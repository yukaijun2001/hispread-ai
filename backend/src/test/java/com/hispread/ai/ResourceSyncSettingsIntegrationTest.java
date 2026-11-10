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
  void savedSettingsMatchReadShapeWithoutReturningTargetCredentials() throws Exception {
    Client admin = client("ADMIN");
    ObjectNode target = target();
    String path = path(target);
    ObjectNode initial = read(path, admin);
    ObjectNode saved =
        save(
            path,
            initial.deepCopy().put("perTargetConcurrency", 3).put("globalConcurrency", 5),
            admin,
            200);
    assertFalse(saved.toString().contains("PRIVATE-SYNC-KEY"));
    assertEquals(
        Set.of(
            "perTargetConcurrency",
            "globalConcurrency",
            "effectiveConcurrency",
            "targetVersion",
            "globalVersion"),
        json.convertValue(saved, Map.class).keySet());
    assertEquals(3, saved.path("perTargetConcurrency").asInt());
    assertEquals(5, saved.path("globalConcurrency").asInt());
    assertEquals(3, saved.path("effectiveConcurrency").asInt());
    assertEquals(saved, read(path, admin));
    assertEquals(
        "PRIVATE-SYNC-KEY",
        store.get("resource-target", target.path("id").asText(), null).path("apiKey").asText());
    save(path, initial, admin, 409);
  }

  @Test
  void validatesIntegersAndBothVersionsWithoutChangingSettings() throws Exception {
    Client admin = client("ADMIN");
    ObjectNode target = target();
    ObjectNode initial = read(path(target), admin);
    List<ObjectNode> invalid =
        List.of(
            initial.deepCopy().put("perTargetConcurrency", 0),
            initial.deepCopy().put("perTargetConcurrency", 33),
            initial.deepCopy().put("perTargetConcurrency", 1.5),
            initial.deepCopy().put("perTargetConcurrency", "2"),
            initial.deepCopy().put("globalConcurrency", 0),
            initial.deepCopy().put("globalConcurrency", 65),
            initial.deepCopy().put("globalConcurrency", 4.5),
            initial.deepCopy().put("globalConcurrency", 4294967297L),
            initial.deepCopy().put("targetVersion", "0"),
            initial.deepCopy().put("globalVersion", -1));
    for (ObjectNode input : invalid) save(path(target), input, admin, 400);
    ObjectNode missing = initial.deepCopy();
    missing.remove("targetVersion");
    save(path(target), missing, admin, 400);
    missing = initial.deepCopy();
    missing.remove("globalVersion");
    save(path(target), missing, admin, 400);
    assertEquals(initial, read(path(target), admin));
  }

  @Test
  void globalSettingsAreSharedAndStaleOtherTargetChangesAreRejected() throws Exception {
    Client admin = client("ADMIN");
    ObjectNode first = target(), second = target();
    ObjectNode beforeFirst = read(path(first), admin), beforeSecond = read(path(second), admin);
    ObjectNode saved =
        save(
            path(first),
            beforeFirst.deepCopy().put("perTargetConcurrency", 2).put("globalConcurrency", 6),
            admin,
            200);
    ObjectNode other = read(path(second), admin);
    assertEquals(6, other.path("globalConcurrency").asInt());
    assertEquals(saved.path("globalVersion"), other.path("globalVersion"));
    assertEquals(beforeSecond.path("targetVersion"), other.path("targetVersion"));
    save(path(second), beforeSecond.deepCopy().put("globalConcurrency", 7), admin, 409);
    save(path(second), other.deepCopy().put("perTargetConcurrency", 1), admin, 200);
    assertEquals(2, read(path(first), admin).path("perTargetConcurrency").asInt());
  }

  @Test
  void legacySettingsRemainReadableWithoutLeakingUnexpectedFields() throws Exception {
    Client admin = client("ADMIN");
    ObjectNode target = target();
    ObjectNode legacy =
        store
            .object()
            .put("perTargetConcurrency", 1)
            .put("globalConcurrency", 4)
            .put("targetVersion", 100)
            .put("apiKey", "LEGACY-PRIVATE");
    store.update(
        "resource-target",
        target.path("id").asText(),
        null,
        store.object().set("syncSettings", legacy));
    ObjectNode settings = read(path(target), admin);
    assertEquals(1, settings.path("perTargetConcurrency").asInt());
    assertEquals(1, settings.path("targetVersion").asInt());
    assertFalse(settings.has("apiKey"));
    Client supplier = client("SUPPLIER");
    mvc.perform(get(path(target)).session(supplier.session)).andExpect(status().isForbidden());
    save(path(target), settings, supplier, 403);
  }
}
