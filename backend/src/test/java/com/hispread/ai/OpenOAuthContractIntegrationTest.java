package com.hispread.ai;

import static org.junit.jupiter.api.Assertions.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

import com.fasterxml.jackson.databind.node.ObjectNode;
import java.util.UUID;
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
class OpenOAuthContractIntegrationTest {
  @Autowired Store store;
  @Autowired AuthService auth;
  @Autowired MockMvc mvc;

  record Client(String id, String owner, MockHttpSession session, String csrf, String bearer) {}

  Client supplier() throws Exception {
    String id = UUID.randomUUID().toString(), owner = UUID.randomUUID().toString();
    store.create("supplier", owner, store.object().put("id", owner).put("state", "APPROVED").put("enabled", true));
    ObjectNode user = store.object().put("id", id).put("username", "oauth-contract-" + id)
        .put("displayName", "OAuth contract fixture").put("supplierId", owner).put("role", "SUPPLIER")
        .put("version", 0).put("mustChangePassword", false).put("onboardingRequired", false);
    user.set("permissions", auth.supplierPermissions());
    auth.createUser(user, "FixtureTest@123");
    MockHttpSession session = new MockHttpSession(); session.setAttribute("uid", id); session.setAttribute("sv", 0L);
    String csrf = store.parse(mvc.perform(get("/api/auth/csrf").session(session)).andReturn().getResponse().getContentAsString()).path("token").asText();
    ObjectNode token = store.parse(mvc.perform(post("/api/auth/api-tokens").session(session).header("X-CSRF-TOKEN", csrf)
        .contentType("application/json").content("{\"name\":\"OAuth contract fixture\"}"))
        .andExpect(status().isOk()).andReturn().getResponse().getContentAsString());
    return new Client(id, owner, session, csrf, "Bearer " + token.path("key").asText());
  }

  @Test
  void publicOauthRejectsRawModeAndProjectCodeInsteadOfPublishingAnUnusableContract() throws Exception {
    Client client = supplier();
    String path = "/api/open/v1/ccmax/submissions/oauth/authorize";
    mvc.perform(post(path).header("Authorization", client.bearer).contentType("application/json")
        .content(store.object().put("projectId", "unavailable").put("accountName", "fixture")
            .put("credentialMode", "REFRESH_TOKEN").toString()))
        .andExpect(status().isBadRequest()).andExpect(jsonPath("$.code").value("CCMAX_OAUTH_MODE_REQUIRED"));
    mvc.perform(post(path).header("Authorization", client.bearer).contentType("application/json")
        .content(store.object().put("projectCode", "PRJ-000001").put("accountName", "fixture")
            .put("credentialMode", "OAUTH").toString()))
        .andExpect(status().isBadRequest()).andExpect(jsonPath("$.message").value("请填写projectId"));
    assertTrue(store.list("resource-operation", client.owner).isEmpty());
    assertTrue(store.list("resource", client.owner).isEmpty());
  }

  @Test
  void originalCredentialRequestIsReadableByItsKeyWithoutAnOauthSessionOrCrossTenantLeak() throws Exception {
    Client client = supplier(), other = supplier();
    String key = UUID.randomUUID().toString();
    ObjectNode resource = store.create("resource", client.owner, store.object().put("supplierId", client.owner)
        .put("createdBy", client.id).put("resourceType", "CCMAX").put("state", "DRAFT").put("dispatchState", "UNKNOWN"));
    ObjectNode operation = store.object().put("supplierId", client.owner).put("resourceId", resource.path("id").asText())
        .put("createdBy", client.id).put("requestKey", key).put("type", "SUBMIT").put("state", "UNKNOWN");
    operation.putObject("request").put("refreshToken", "PRIVATE-REQUEST-TOKEN");
    ObjectNode saved = store.create("resource-operation", client.owner, operation);
    mvc.perform(get("/api/resources/submissions/" + key).session(client.session))
        .andExpect(status().isOk()).andExpect(jsonPath("$.state").value("UNKNOWN"))
        .andExpect(jsonPath("$.operationId").value(saved.path("id").asText()))
        .andExpect(jsonPath("$.request").doesNotExist());
    String result = mvc.perform(get("/api/open/v1/ccmax/submissions/" + key).header("Authorization", client.bearer))
        .andExpect(status().isOk()).andExpect(jsonPath("$.state").value("UNKNOWN"))
        .andReturn().getResponse().getContentAsString();
    assertFalse(result.contains("PRIVATE-REQUEST-TOKEN"));
    mvc.perform(get("/api/resources/submissions/" + key).session(other.session)).andExpect(status().isNotFound());
    mvc.perform(get("/api/open/v1/ccmax/submissions/" + key).header("Authorization", other.bearer)).andExpect(status().isNotFound());
    assertEquals(0, store.get("resource-operation", saved.path("id").asText(), client.owner).path("version").asLong());
  }

  @Test
  void nativePublicReauthorizationRejectsManualCredentialReplacementBeforeCreatingAnOperation() throws Exception {
    Client client = supplier();
    ObjectNode resource = store.create("resource", client.owner, store.object().put("supplierId", client.owner)
        .put("createdBy", client.id).put("resourceType", "CCMAX").put("state", "DELIVERED")
        .put("dispatchState", "SUCCESS").put("upstreamProtocol", "CCMAX_NATIVE").put("upstreamAccountId", "fixture-account"));
    mvc.perform(post("/api/open/v1/ccmax/resources/" + resource.path("id").asText() + "/reauthorizations")
        .header("Authorization", client.bearer).contentType("application/json")
        .content("{\"version\":0,\"mode\":\"REFRESH_TOKEN\"}"))
        .andExpect(status().isBadRequest()).andExpect(jsonPath("$.code").value("CCMAX_RAW_IMPORT_DISABLED"));
    assertTrue(store.list("resource-operation", client.owner).isEmpty());
    mvc.perform(get("/api/open/v1/ccmax/capabilities").header("Authorization", client.bearer))
        .andExpect(status().isOk()).andExpect(jsonPath("$.credentialModes").isArray())
        .andExpect(jsonPath("$.supportsProxy").isBoolean());
  }
}
