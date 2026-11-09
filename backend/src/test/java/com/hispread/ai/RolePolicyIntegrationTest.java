package com.hispread.ai;

import static org.junit.jupiter.api.Assertions.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

import com.fasterxml.jackson.databind.*;
import com.fasterxml.jackson.databind.node.*;
import java.util.*;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.mock.web.MockHttpSession;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

@SpringBootTest
@AutoConfigureMockMvc
@Transactional
class RolePolicyIntegrationTest {
  @Autowired Store store;
  @Autowired AuthService auth;
  @Autowired RolePolicy policy;
  @Autowired SeedData seed;
  @Autowired MockMvc mvc;
  @Autowired ObjectMapper json;

  record Client(String id, MockHttpSession session, String csrf) {}

  Client client(String role) throws Exception {
    String id = UUID.randomUUID().toString();
    ObjectNode u =
        store
            .object()
            .put("id", id)
            .put("username", "policy_" + id.substring(0, 8))
            .put("displayName", "Role policy test")
            .put("version", 0)
            .put("mustChangePassword", false)
            .put("onboardingRequired", false);
    policy.assign(u, role, store.json.createArrayNode(), null);
    auth.createUser(u, "RolePolicy@123");
    MockHttpSession session = new MockHttpSession();
    session.setAttribute("uid", id);
    session.setAttribute("sv", 0L);
    var result = mvc.perform(get("/api/auth/csrf").session(session)).andReturn();
    return new Client(
        id,
        session,
        json.readTree(result.getResponse().getContentAsString()).path("token").asText());
  }

  Set<String> values(JsonNode values) {
    Set<String> out = new HashSet<>();
    for (JsonNode p : values) out.add(p.asText());
    return out;
  }

  @Test
  void defaultsAreLocalLeastPrivilegeAndPlatformIdentityIsNotAnExtraRole() throws Exception {
    Set<String> operator = values(policy.defaults("OPERATOR")),
        finance = values(policy.defaults("FINANCE"));
    assertEquals(17, operator.size());
    assertEquals(22, finance.size());
    assertTrue(operator.containsAll(Set.of("quote.review", "resource.read", "supplier.write")));
    assertFalse(operator.contains("payment.record"));
    assertFalse(operator.contains("settlement.read"));
    assertTrue(
        finance.containsAll(Set.of("payment.record", "account.review", "settlement.create")));
    assertFalse(finance.contains("quote.review"));
    assertFalse(finance.contains("resource.write"));
    Client op = client("OPERATOR");
    mvc.perform(get("/api/system/users").session(op.session)).andExpect(status().isForbidden());
    mvc.perform(get("/api/system/audits").session(op.session)).andExpect(status().isForbidden());
    ObjectNode custom =
        store
            .object()
            .put("id", "POLICY_CUSTOM")
            .put("code", "POLICY_CUSTOM")
            .put("name", "Admin display name cannot grant identity")
            .put("builtIn", false);
    custom.set("permissions", store.json.valueToTree(List.of("system.users", "workbench.read")));
    store.create("role", "GLOBAL", custom);
    assertThrows(ApiException.class, () -> client("POLICY_CUSTOM"));
    assertThrows(
        ApiException.class,
        () -> policy.additionalRoles("OPERATOR", store.json.valueToTree(List.of("ADMIN"))));
    ObjectNode bound = store.object().put("role", "ADMIN").put("supplierId", "a-supplier");
    assertFalse(policy.platform(bound));
    assertFalse(policy.highestAdministrator(bound));
    ObjectNode administrator = store.object().put("role", "ADMIN").putNull("supplierId");
    assertTrue(policy.highestAdministrator(administrator));
    store.update("role", "ADMIN", null, store.object().put("builtIn", false));
    assertFalse(policy.highestAdministrator(administrator));
  }

  @Test
  void migrationOnlyFillsLegacyEmptyBuiltinsAndPreservesAdditionalRoles() throws Exception {
    ObjectNode role = store.get("role", "OPERATOR", null), empty = role.deepCopy();
    empty.remove(List.of("defaultPolicy", "securityPolicy"));
    empty.put("version", 0);
    empty.set("permissions", store.json.createArrayNode());
    store.jdbc.update(
        "update hub_entity set data=cast(? as jsonb),version=0 where kind='role' and id='OPERATOR'",
        empty.toString());
    ObjectNode custom =
        store
            .object()
            .put("id", "MIGRATION_CUSTOM")
            .put("code", "MIGRATION_CUSTOM")
            .put("name", "Operator readonly extra")
            .put("scopeType", "OPERATOR")
            .put("builtIn", false);
    custom.set("permissions", store.json.valueToTree(List.of("quote.read")));
    store.create("role", "GLOBAL", custom);
    String id = UUID.randomUUID().toString();
    ObjectNode user =
        store
            .object()
            .put("id", id)
            .put("username", "migrate_" + id.substring(0, 8))
            .put("role", "OPERATOR")
            .putNull("supplierId")
            .put("version", 0);
    user.set("permissions", store.json.valueToTree(List.of("payment.read")));
    user.set("additionalRoleCodes", store.json.valueToTree(List.of("MIGRATION_CUSTOM")));
    auth.createUser(user, "RoleMigration@123");
    seed.migrateRoleDefaults();
    ObjectNode migrated = store.get("role", "OPERATOR", null);
    assertEquals(RolePolicy.DEFAULT_POLICY_VERSION, migrated.path("defaultPolicy").asText());
    assertEquals(17, migrated.path("permissions").size());
    ObjectNode refreshed = auth.findUser(id);
    assertTrue(
        values(refreshed.path("permissions")).containsAll(Set.of("quote.read", "quote.review")));
    assertEquals("MIGRATION_CUSTOM", refreshed.path("additionalRoleCodes").get(0).asText());
    long version = migrated.path("version").asLong();
    seed.migrateRoleDefaults();
    assertEquals(version, store.get("role", "OPERATOR", null).path("version").asLong());
    ObjectNode customized = store.object().put("defaultPolicy", "customized");
    customized.set("permissions", store.json.createArrayNode());
    store.update("role", "OPERATOR", null, customized);
    seed.migrateRoleDefaults();
    assertTrue(store.get("role", "OPERATOR", null).path("permissions").isEmpty());
  }

  @Test
  void roleChangesRemovePreviousPermissionsKeepCustomExtrasAndInvalidateSession() throws Exception {
    Client admin = client("ADMIN"), operator = client("OPERATOR");
    ObjectNode extra =
        store
            .object()
            .put("id", "ROLE_EXTRA")
            .put("code", "ROLE_EXTRA")
            .put("name", "Extra reporting")
            .put("scopeType", "FINANCE")
            .put("builtIn", false);
    extra.set("permissions", store.json.valueToTree(List.of("report.read")));
    store.create("role", "GLOBAL", extra);
    ObjectNode patch = store.object().put("roleCode", "FINANCE").put("version", 0);
    patch.set("additionalRoleCodes", store.json.valueToTree(List.of("ROLE_EXTRA")));
    mvc.perform(
            put("/api/system/users/" + operator.id)
                .session(admin.session)
                .header("X-CSRF-TOKEN", admin.csrf)
                .contentType("application/json")
                .content(patch.toString()))
        .andExpect(status().isOk());
    ObjectNode changed = auth.findUser(operator.id);
    Set<String> permissions = values(changed.path("permissions"));
    assertEquals("FINANCE", changed.path("role").asText());
    assertTrue(changed.path("supplierId").isNull());
    assertTrue(permissions.contains("payment.record"));
    assertTrue(permissions.contains("report.read"));
    assertFalse(permissions.contains("quote.review"));
    mvc.perform(get("/api/auth/me").session(operator.session)).andExpect(status().isUnauthorized());
    ObjectNode noExtras = store.object().put("roleCode", "OPERATOR").put("version", 1);
    noExtras.putArray("additionalRoleCodes");
    mvc.perform(
            put("/api/system/users/" + operator.id)
                .session(admin.session)
                .header("X-CSRF-TOKEN", admin.csrf)
                .contentType("application/json")
                .content(noExtras.toString()))
        .andExpect(status().isOk());
    assertFalse(values(auth.findUser(operator.id).path("permissions")).contains("payment.record"));
    ObjectNode supplier =
        store.object().put("id", "binding-test-supplier").put("name", "Binding test");
    store.create("supplier", "binding-test-supplier", supplier);
    assertThrows(
        ApiException.class,
        () ->
            policy.assign(
                store.object(), "FINANCE", store.json.createArrayNode(), "binding-test-supplier"));
    assertThrows(
        ApiException.class,
        () -> policy.assign(store.object(), "SUPPLIER", store.json.createArrayNode(), null));
  }

  @Test
  void workbenchOnlyShowsTaskKindsAllowedForEachPlatformRole() throws Exception {
    Client operator = client("OPERATOR"), finance = client("FINANCE");
    String owner = "role-policy-tenant";
    store.create(
        "quote",
        owner,
        store
            .object()
            .put("state", "PENDING")
            .put("title", "Review quote")
            .put("projectName", "Review quote"));
    store.create(
        "supplier",
        owner,
        store
            .object()
            .put("id", owner)
            .put("name", "Review supplier")
            .put("state", "PENDING")
            .put("ownerUserId", operator.id)
            .put("enabled", true));
    store.create(
        "account", owner, store.object().put("holder", "Review account").put("state", "PENDING"));
    store.create("payment", owner, store.object().put("code", "PAY-ROLE").put("state", "PENDING"));
    store.create(
        "settlement",
        owner,
        store
            .object()
            .put("state", "CONFIRMED")
            .put("currency", "USD")
            .put("total", "15")
            .put("paidAmount", "0")
            .put("receivedAmount", "0"));
    JsonNode operatorData =
        json.readTree(
            mvc.perform(get("/api/workbench").session(operator.session))
                .andExpect(status().isOk())
                .andReturn()
                .getResponse()
                .getContentAsString());
    Set<String> operatorKinds = new HashSet<>();
    for (JsonNode t : operatorData.path("tasks")) operatorKinds.add(t.path("kind").asText());
    assertTrue(operatorKinds.contains("QUOTE_NEW"));
    assertFalse(operatorKinds.contains("SUPPLIER_REVIEW"));
    assertFalse(operatorKinds.contains("PAYMENT_REVIEW"));
    assertFalse(operatorKinds.contains("ACCOUNT_REVIEW"));
    assertTrue(operatorData.path("money").isEmpty());
    JsonNode financeData =
        json.readTree(
            mvc.perform(get("/api/workbench").session(finance.session))
                .andExpect(status().isOk())
                .andReturn()
                .getResponse()
                .getContentAsString());
    Set<String> financeKinds = new HashSet<>();
    for (JsonNode t : financeData.path("tasks")) financeKinds.add(t.path("kind").asText());
    assertTrue(financeKinds.containsAll(Set.of("ACCOUNT_REVIEW", "PAYMENT_REVIEW")));
    assertFalse(financeKinds.contains("QUOTE_NEW"));
    assertFalse(financeKinds.contains("SUPPLIER_REVIEW"));
    assertFalse(financeData.path("money").isEmpty());
  }
}
