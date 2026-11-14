package com.hispread.ai;

import static org.junit.jupiter.api.Assertions.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;
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
class ResourceSyncSettingsIntegrationTest {
  @Autowired Store store;
  @Autowired AuthService auth;
  @Autowired ObjectMapper json;
  @Autowired MockMvc mvc;

  record Client(MockHttpSession session, String csrf) {}

  Client client(String role) throws Exception {
    String id = UUID.randomUUID().toString();
    ObjectNode user =
        store
            .object()
            .put("id", id)
            .put("username", "sync_" + id)
            .put("displayName", "Sync fixture")
            .put("role", role)
            .put("version", 0);
    if (role.equals("ADMIN")) user.putNull("supplierId");
    else user.put("supplierId", id);
    user.set("permissions", auth.rolePermissions(role));
    auth.createUser(user, "SyncFixture@123");
    MockHttpSession session = new MockHttpSession();
    session.setAttribute("uid", id);
    session.setAttribute("sv", 0L);
    String csrf =
        json.readTree(
                mvc.perform(get("/api/auth/csrf").session(session))
                    .andReturn()
                    .getResponse()
                    .getContentAsString())
            .path("token")
            .asText();
    return new Client(session, csrf);
  }

  ObjectNode target() {
    return store.create(
        "resource-target",
        "GLOBAL",
        store
            .object()
            .put("name", "Sync target")
            .put("protocol", "CUSTOM")
            .put("baseUrl", "https://example.invalid")
            .put("apiKey", "PRIVATE-SYNC-KEY"));
  }

  String path(ObjectNode target) {
    return "/api/resource-targets/" + target.path("id").asText() + "/sync-settings";
  }

  ObjectNode read(String path, Client client) throws Exception {
    return (ObjectNode)
        json.readTree(
            mvc.perform(get(path).session(client.session))
                .andExpect(status().isOk())
                .andReturn()
                .getResponse()
                .getContentAsString());
  }

  ObjectNode save(String path, ObjectNode input, Client client, int expected) throws Exception {
    return (ObjectNode)
        json.readTree(
            mvc.perform(
                    put(path)
                        .session(client.session)
                        .header("X-CSRF-TOKEN", client.csrf)
                        .contentType("application/json")
                        .content(input.toString()))
                .andExpect(status().is(expected))
                .andReturn()
                .getResponse()
                .getContentAsString());
  }

  @Test
  void concurrencyIsManagedAndOldWritesCannotChangeItOrExposeCredentials() throws Exception {
    Client admin = client("ADMIN"); ObjectNode target = target();
    ObjectNode legacy = store.object().put("perTargetConcurrency", 32).put("globalConcurrency", 64).put("apiKey", "LEGACY-PRIVATE");
    store.update("resource-target", target.path("id").asText(), null, store.object().set("syncSettings", legacy));
    ObjectNode before = store.get("resource-target", target.path("id").asText(), null);
    ObjectNode managed = read(path(target), admin);
    assertEquals(2, managed.path("perTargetConcurrency").asInt());
    assertEquals(4, managed.path("globalConcurrency").asInt());
    assertTrue(managed.path("managed").asBoolean());
    assertFalse(managed.toString().contains("PRIVATE"));
    ObjectNode error = save(path(target), managed.deepCopy().put("perTargetConcurrency", 32), admin, 410);
    assertEquals("UPSTREAM_FEATURE_RETIRED", error.path("code").asText());
    assertEquals(before, store.get("resource-target", target.path("id").asText(), null));
    assertEquals(managed, read(path(target), admin));
    Client supplier = client("SUPPLIER");
    mvc.perform(get(path(target)).session(supplier.session)).andExpect(status().isForbidden());
    save(path(target), managed, supplier, 403);
  }

  @Test
  void standaloneOauthAndNewCustomConnectionsAreRetiredWhileLegacyConfigRemainsEditable() throws Exception {
    Client admin = client("ADMIN"); ObjectNode legacy = target();
    for (String action : List.of("link", "complete"))
      mvc.perform(post("/api/resource-targets/" + legacy.path("id").asText() + "/oauth/" + action)
          .session(admin.session).header("X-CSRF-TOKEN", admin.csrf)
          .contentType("application/json").content("{}"))
          .andExpect(status().isGone()).andExpect(jsonPath("$.code").value("UPSTREAM_FEATURE_RETIRED"));
    mvc.perform(post("/api/resource-targets").session(admin.session).header("X-CSRF-TOKEN", admin.csrf)
        .contentType("application/json").content(store.object().put("name", "New compatibility connection").put("baseUrl", "https://example.invalid").put("protocol", "CUSTOM").toString()))
        .andExpect(status().isGone());
    ObjectNode edited = save("/api/resource-targets/" + legacy.path("id").asText(),
        store.object().put("name", "Renamed compatibility connection").put("version", legacy.path("version").asLong()), admin, 200);
    assertEquals("CUSTOM", edited.path("protocol").asText());
    assertFalse(edited.has("apiKey"));
    assertTrue(edited.path("apiKeyConfigured").asBoolean());
    save("/api/resource-targets/" + legacy.path("id").asText(),
        store.object().put("protocol", "NEWAPI").put("newApiUserId", "2"), admin, 409);
    assertTrue(store.list("native-oauth", "GLOBAL").isEmpty());
  }
}
