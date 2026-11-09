package com.hispread.ai;

import static org.junit.jupiter.api.Assertions.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

import com.fasterxml.jackson.databind.*;
import com.fasterxml.jackson.databind.node.*;
import java.util.*;
import org.junit.jupiter.api.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.mock.web.MockHttpSession;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

@SpringBootTest
@AutoConfigureMockMvc
@Transactional
class SecurityRoleBoundaryIntegrationTest {
  @Autowired Store s;
  @Autowired AuthService auth;
  @Autowired RolePolicy roles;
  @Autowired SeedData seed;
  @Autowired MockMvc mvc;
  @Autowired ObjectMapper json;

  record Client(String id, MockHttpSession session, String csrf) {}

  Client client(String role, String owner) throws Exception {
    String id = UUID.randomUUID().toString();
    ObjectNode u =
        s.object()
            .put("id", id)
            .put("username", "secure_" + id.substring(0, 8))
            .put("displayName", "Security QA")
            .put("role", role)
            .put("version", 0)
            .put("mustChangePassword", false)
            .put("onboardingRequired", false);
    if (owner == null) u.putNull("supplierId");
    else u.put("supplierId", owner);
    u.set("permissions", auth.rolePermissions(role));
    u.putArray("additionalRoleCodes");
    auth.createUser(u, "Security@Password123");
    MockHttpSession session = new MockHttpSession();
    session.setAttribute("uid", id);
    session.setAttribute("sv", 0L);
    var result = mvc.perform(get("/api/auth/csrf").session(session)).andReturn();
    return new Client(
        id,
        session,
        json.readTree(result.getResponse().getContentAsString()).path("token").asText());
  }

  JsonNode write(String method, String path, ObjectNode body, Client c, int status)
      throws Exception {
    return json.readTree(
        mvc.perform(
                (method.equals("PUT") ? put(path) : post(path))
                    .session(c.session)
                    .header("X-CSRF-TOKEN", c.csrf)
                    .contentType("application/json")
                    .content(body.toString()))
            .andExpect(status().is(status))
            .andReturn()
            .getResponse()
            .getContentAsString());
  }

  @Test
  void roleCeilingsAndScopePreventCustomPrivilegeEscalation() throws Exception {
    Client admin = client("ADMIN", null),
        op = client("OPERATOR", null),
        fin = client("FINANCE", null);
    assertFalse(auth.rolePermissions("OPERATOR").toString().contains("supplier.owner.assign"));
    ObjectNode bad =
        s.object().put("code", "SEC_BAD").put("name", "Bad").put("scopeType", "OPERATOR");
    bad.putArray("permissions").add("payment.record");
    write("POST", "/api/system/roles", bad, admin, 400);
    ObjectNode custom =
        s.object().put("code", "SEC_FIN").put("name", "Finance read").put("scopeType", "FINANCE");
    custom.putArray("permissions").add("payment.read");
    write("POST", "/api/system/roles", custom, admin, 200);
    ObjectNode opProfile = auth.findUser(op.id);
    opProfile.put("version", 0).put("roleCode", "OPERATOR");
    opProfile.putArray("additionalRoleCodes").add("SEC_FIN");
    write("PUT", "/api/system/users/" + op.id, opProfile, admin, 400);
    ObjectNode customAsPrimary =
        s.object()
            .put("username", "custom_" + UUID.randomUUID().toString().substring(0, 8))
            .put("displayName", "Custom")
            .put("roleCode", "SEC_FIN")
            .put("password", "Security@Password123");
    customAsPrimary.putArray("additionalRoleCodes");
    write("POST", "/api/system/users", customAsPrimary, admin, 400);
    for (Client c : List.of(op, fin))
      mvc.perform(get("/api/system/roles").session(c.session)).andExpect(status().isForbidden());
    var body =
        json.readTree(
            mvc.perform(get("/api/system/roles").session(admin.session))
                .andExpect(status().isOk())
                .andReturn()
                .getResponse()
                .getContentAsString());
    assertEquals(4, body.path("scopeTypes").size());
    assertTrue(body.path("roles").get(0).path("allowedPermissions").isArray());
  }

  @Test
  void staleProfileGrantsCannotBypassCeilingsAndScopedCustomRoleCannotChangeIdentity()
      throws Exception {
    Client op = client("OPERATOR", null);
    ObjectNode u = auth.findUser(op.id);
    u.withArray("permissions").add("system.users").add("payment.record");
    auth.saveUser(u);
    mvc.perform(get("/api/auth/me").session(op.session))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.permissions[?(@ == 'system.users')]").isEmpty());
    mvc.perform(get("/api/system/users").session(op.session)).andExpect(status().isForbidden());
    ObjectNode fake =
        s.object()
            .put("id", "SEC_FAKE")
            .put("code", "SEC_FAKE")
            .put("name", "Admin")
            .put("builtIn", false)
            .put("scopeType", "OPERATOR");
    fake.putArray("permissions").add("system.users");
    s.create("role", "GLOBAL", fake);
    assertThrows(
        ApiException.class,
        () -> roles.assign(s.object(), "SEC_FAKE", s.json.createArrayNode(), null));
    u.putArray("additionalRoleCodes").add("SEC_FAKE");
    auth.saveUser(u);
    mvc.perform(get("/api/system/users").session(op.session)).andExpect(status().isForbidden());
  }

  @Test
  void securityMigrationClampsGrantsAndPreservesIntentionalRestrictions() throws Exception {
    ObjectNode original = s.get("role", "OPERATOR", null);
    ObjectNode old =
        s.object()
            .put("defaultPolicy", "local-role-policy-v2")
            .put("version", original.path("version").asLong());
    old.putArray("permissions")
        .add("workbench.read")
        .add("supplier.owner.assign")
        .add("resource.sensitive");
    old.putNull("securityPolicy");
    s.update("role", "OPERATOR", null, old);
    seed.migrateRoleDefaults();
    ObjectNode migrated = s.get("role", "OPERATOR", null);
    assertEquals(RolePolicy.DEFAULT_POLICY_VERSION, migrated.path("securityPolicy").asText());
    assertFalse(migrated.path("permissions").toString().contains("resource.sensitive"));
    ObjectNode locked =
        s.object()
            .put("defaultPolicy", "customized")
            .put("securityPolicy", RolePolicy.DEFAULT_POLICY_VERSION)
            .put("version", migrated.path("version").asLong());
    locked.putArray("permissions");
    s.update("role", "OPERATOR", null, locked);
    seed.migrateRoleDefaults();
    assertTrue(s.get("role", "OPERATOR", null).path("permissions").isEmpty());
  }

  @Test
  void disabledSupplierStopsSessionAndBearerBusinessButKeepsAccountRecovery() throws Exception {
    String owner = "disabled_" + UUID.randomUUID();
    s.create(
        "supplier",
        owner,
        s.object().put("id", owner).put("name", "Disabled").put("enabled", true));
    Client supplier = client("SUPPLIER", owner);
    s.update("supplier", owner, owner, s.object().put("enabled", false));
    mvc.perform(get("/api/workbench").session(supplier.session))
        .andExpect(status().isForbidden())
        .andExpect(jsonPath("$.code").value("SUPPLIER_DISABLED"));
    mvc.perform(get("/api/auth/profile").session(supplier.session)).andExpect(status().isOk());
    mvc.perform(get("/api/auth/me").session(supplier.session)).andExpect(status().isOk());
  }
}
