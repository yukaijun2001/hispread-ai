package com.hispread.ai;

import static org.junit.jupiter.api.Assertions.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;
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
class BackendIntegrationTest {
  @Autowired MockMvc mvc;
  @Autowired Store store;
  @Autowired AuthService auth;
  @Autowired ObjectMapper json;

  private record Client(MockHttpSession session, String csrf) {}

  private Client login() throws Exception {
    String suffix = UUID.randomUUID().toString().substring(0, 8), id = UUID.randomUUID().toString();
    ObjectNode u = store.object();
    u.put("id", id)
        .put("username", "test_" + suffix)
        .put("displayName", "Test")
        .put("supplierId", "tenant-" + suffix)
        .put("role", "SUPPLIER")
        .put("version", 0)
        .put("mustChangePassword", false)
        .put("onboardingRequired", false);
    u.set("permissions", auth.supplierPermissions());
    auth.createUser(u, "Integration@123");
    var csrfResult = mvc.perform(get("/api/auth/csrf")).andExpect(status().isOk()).andReturn();
    MockHttpSession session = (MockHttpSession) csrfResult.getRequest().getSession();
    String token =
        json.readTree(csrfResult.getResponse().getContentAsString()).path("token").asText();
    mvc.perform(
            post("/api/auth/login")
                .session(session)
                .header("X-CSRF-TOKEN", token)
                .contentType("application/x-www-form-urlencoded")
                .param("username", u.path("username").asText())
                .param("password", "Integration@123"))
        .andExpect(status().isOk());
    var result = mvc.perform(get("/api/auth/csrf").session(session)).andReturn();
    return new Client(
        session, json.readTree(result.getResponse().getContentAsString()).path("token").asText());
  }

  @Test
  void authenticationAndCsrfAreEnforced() throws Exception {
    mvc.perform(get("/api/workbench")).andExpect(status().isUnauthorized());
    mvc.perform(
            post("/api/auth/login")
                .contentType("application/x-www-form-urlencoded")
                .param("username", "unknown")
                .param("password", "wrong"))
        .andExpect(status().isForbidden());
    Client c = login();
    mvc.perform(get("/api/auth/me").session(c.session))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.role").value("SUPPLIER"));
    mvc.perform(
            put("/api/auth/profile")
                .session(c.session)
                .contentType("application/json")
                .content("{\"displayName\":\"Changed\",\"version\":0}"))
        .andExpect(status().isForbidden());
    mvc.perform(
            put("/api/auth/profile")
                .session(c.session)
                .header("X-CSRF-TOKEN", c.csrf)
                .contentType("application/json")
                .content("{\"displayName\":\"Changed\",\"version\":0}"))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.displayName").value("Changed"));
  }

  @Test
  void postgresCrudEnforcesTenantAndVersion() {
    ObjectNode d = store.object();
    d.put("name", "Tenant A record");
    ObjectNode created = store.create("integration-test", "tenant-a", d);
    String id = created.path("id").asText();
    assertEquals(
        404,
        assertThrows(ApiException.class, () -> store.get("integration-test", id, "tenant-b"))
            .status);
    ObjectNode patch = store.object();
    patch.put("version", 0).put("name", "updated");
    ObjectNode updated = store.update("integration-test", id, "tenant-a", patch);
    assertEquals(1, updated.path("version").asLong());
    assertEquals(
        409,
        assertThrows(
                ApiException.class, () -> store.update("integration-test", id, "tenant-a", patch))
            .status);
    assertEquals("updated", store.get("integration-test", id, "tenant-a").path("name").asText());
    store.delete("integration-test", id, "tenant-a");
    assertTrue(store.list("integration-test", "tenant-a").isEmpty());
  }

  @Test
  void tokensAreReturnedOnceAndStoredAsHashes() throws Exception {
    Client c = login();
    var result =
        mvc.perform(
                post("/api/auth/api-tokens")
                    .session(c.session)
                    .header("X-CSRF-TOKEN", c.csrf)
                    .contentType("application/json")
                    .content("{\"name\":\"integration\",\"days\":30}"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.key").exists())
            .andReturn();
    JsonNode token = json.readTree(result.getResponse().getContentAsString());
    assertTrue(token.path("key").asText().startsWith("hp_"));
    mvc.perform(get("/api/auth/api-tokens").session(c.session))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$[0].key").doesNotExist())
        .andExpect(jsonPath("$[0].hash").doesNotExist());
    String userId = c.session.getAttribute("uid").toString();
    ObjectNode stored = store.get("api-token", token.path("id").asText(), userId);
    assertNotEquals(token.path("key").asText(), stored.path("hash").asText());
    assertEquals(64, stored.path("hash").asText().length());
  }

  @Test
  void bearerApiRejectsMissingRevokedKeysAndIsolatesTenant() throws Exception {
    mvc.perform(get("/api/open/v1/ccmax/resources")).andExpect(status().isUnauthorized());
    mvc.perform(get("/api/open/v1/ccmax/resources").header("Authorization", "Bearer hp_invalid"))
        .andExpect(status().isUnauthorized());
    Client c = login();
    var result =
        mvc.perform(
                post("/api/auth/api-tokens")
                    .session(c.session)
                    .header("X-CSRF-TOKEN", c.csrf)
                    .contentType("application/json")
                    .content("{\"name\":\"gateway\",\"days\":30}"))
            .andExpect(status().isOk())
            .andReturn();
    JsonNode token = json.readTree(result.getResponse().getContentAsString());
    String bearer = "Bearer " + token.path("key").asText();
    String uid = c.session.getAttribute("uid").toString(),
        owner = auth.findUser(uid).path("supplierId").asText();
    ObjectNode own =
        store.create(
            "resource",
            owner,
            store
                .object()
                .put("resourceType", "CCMAX")
                .put("name", "Own CCMAX")
                .put("createdBy", uid));
    ObjectNode other =
        store.create(
            "resource",
            "another-tenant",
            store.object().put("resourceType", "CCMAX").put("name", "Other CCMAX"));
    mvc.perform(get("/api/open/v1/ccmax/resources").header("Authorization", bearer))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.total").value(1))
        .andExpect(jsonPath("$.items[0].name").value("Own CCMAX"));
    mvc.perform(
            get("/api/open/v1/ccmax/resources/" + other.path("id").asText())
                .header("Authorization", bearer))
        .andExpect(status().isNotFound());
    mvc.perform(
            post("/api/open/v1/ccmax/submissions/oauth/authorize")
                .header("Authorization", bearer)
                .contentType("application/json")
                .content("{}"))
        .andExpect(status().isServiceUnavailable());
    mvc.perform(
            post("/api/auth/api-tokens/" + token.path("id").asText() + "/revoke")
                .session(c.session)
                .header("X-CSRF-TOKEN", c.csrf)
                .contentType("application/json")
                .content("{}"))
        .andExpect(status().isOk());
    mvc.perform(get("/api/open/v1/ccmax/resources").header("Authorization", bearer))
        .andExpect(status().isUnauthorized());
  }

  @Test
  void requiredPasswordChangeAndOnboardingAreEnforcedByServer() throws Exception {
    Client c = login();
    String id = c.session.getAttribute("uid").toString();
    ObjectNode user = auth.findUser(id);
    user.put("mustChangePassword", true);
    auth.saveUser(user);
    mvc.perform(get("/api/workbench").session(c.session))
        .andExpect(status().isForbidden())
        .andExpect(jsonPath("$.code").value("PASSWORD_CHANGE_REQUIRED"));
    mvc.perform(get("/api/auth/password-policy").session(c.session)).andExpect(status().isOk());
    user.put("mustChangePassword", false).put("onboardingRequired", true);
    auth.saveUser(user);
    mvc.perform(get("/api/workbench").session(c.session))
        .andExpect(status().isForbidden())
        .andExpect(jsonPath("$.code").value("ONBOARDING_REQUIRED"));
    user.put("onboardingRequired", false);
    auth.saveUser(user);
    mvc.perform(get("/api/workbench").session(c.session)).andExpect(status().isOk());
  }

  @Test
  void supplierCannotChangeAnotherSupplierPlatformFieldsAndProxyResourcesAreProjected()
      throws Exception {
    Client c = login();
    String uid = c.session.getAttribute("uid").toString(),
        owner = auth.findUser(uid).path("supplierId").asText();
    ObjectNode other =
        store.create(
            "supplier",
            "another-tenant",
            store.object().put("name", "Other supplier").put("code", "S_OTHER"));
    for (String field : List.of("code", "note"))
      mvc.perform(
              put("/api/suppliers/" + other.path("id").asText() + "/" + field)
                  .session(c.session)
                  .header("X-CSRF-TOKEN", c.csrf)
                  .contentType("application/json")
                  .content("{\"code\":\"HACKED\",\"note\":\"HACKED\"}"))
          .andExpect(status().isForbidden());
    assertEquals(
        "S_OTHER",
        store.get("supplier", other.path("id").asText(), "another-tenant").path("code").asText());
    ObjectNode proxy = store.create("proxy", owner, store.object().put("name", "test proxy"));
    String pid = proxy.path("id").asText();
    ObjectNode resource =
        store
            .object()
            .put("proxyId", pid)
            .put("name", "visible resource")
            .put("accountName", "public account")
            .put("projectName", "project")
            .put("creatorName", "creator")
            .put("state", "DELIVERED")
            .put("createdBy", uid)
            .put("secret", "do-not-return");
    resource.set("resourceData", store.object().put("accessToken", "do-not-return"));
    store.create("resource", owner, resource);
    mvc.perform(get("/api/outbound-proxies/" + pid + "/resources").session(c.session))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$[0].name").value("visible resource"))
        .andExpect(jsonPath("$[0].secret").doesNotExist())
        .andExpect(jsonPath("$[0].resourceData").doesNotExist())
        .andExpect(jsonPath("$[0].createdBy").doesNotExist());
  }
}
