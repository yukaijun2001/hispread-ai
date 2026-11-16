package com.hispread.ai;

import static org.junit.jupiter.api.Assertions.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

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
class ConsoleProxyContractIntegrationTest {
  @Autowired Store store;
  @Autowired AuthService auth;
  @Autowired MockMvc mvc;

  record Client(String owner, String uid, MockHttpSession session, String csrf) {}

  Client supplier() throws Exception {
    String owner = UUID.randomUUID().toString(), uid = UUID.randomUUID().toString();
    ObjectNode user = store.object().put("id", uid).put("username", "proxy-contract-" + uid)
        .put("displayName", "Proxy contract supplier").put("role", "SUPPLIER")
        .put("supplierId", owner).put("version", 0).put("onboardingRequired", false);
    user.set("permissions", auth.supplierPermissions());
    auth.createUser(user, "FixtureTest@123");
    store.create("supplier", owner, store.object().put("id", owner).put("supplierId", owner)
        .put("name", "Proxy contract supplier").put("enabled", true).put("state", "APPROVED"));
    MockHttpSession session = new MockHttpSession();
    session.setAttribute("uid", uid); session.setAttribute("sv", 0L);
    String csrf = store.parse(mvc.perform(org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get("/api/auth/csrf").session(session))
        .andReturn().getResponse().getContentAsString()).path("token").asText();
    return new Client(owner, uid, session, csrf);
  }

  ObjectNode post(String path, ObjectNode body, Client client, int status) throws Exception {
    return store.parse(mvc.perform(org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post(path).session(client.session)
        .header("X-CSRF-TOKEN", client.csrf).contentType("application/json").content(body.toString()))
        .andExpect(status().is(status)).andReturn().getResponse().getContentAsString());
  }

  ObjectNode get(String path, Client client, int status) throws Exception {
    return store.parse(mvc.perform(org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get(path).session(client.session)).andExpect(status().is(status))
        .andReturn().getResponse().getContentAsString());
  }

  @Test
  void importReturnsDetailedSkipsUsesSupplierDefaultAndNeverEchoesAuthentication() throws Exception {
    Client client = supplier();
    store.create("supplier-settings", "GLOBAL", store.object().put("id", client.owner)
        .put("defaultProxyMaxResources", 3));
    String address = "socks5://fixture-user:PRIVATE-PROXY-SECRET@proxy.example.invalid:1080";
    ObjectNode response = post("/api/outbound-proxies/import", store.object()
        .put("lines", address + "\n" + address + "\ninvalid-address"), client, 200);
    assertEquals(1, response.path("imported").asInt());
    assertTrue(response.path("skipped").isArray());
    assertEquals(2, response.path("skipped").size());
    assertEquals(2, response.path("skipped").get(0).path("line").asInt());
    assertEquals(3, response.path("skipped").get(1).path("line").asInt());
    assertFalse(response.toString().contains("PRIVATE-PROXY-SECRET"));
    assertEquals(3, store.list("proxy", client.owner).get(0).path("maxResources").asInt());
    post("/api/outbound-proxies/import", store.object().put("lines", address).put("maxResources", -1), client, 400);
    assertEquals(1, store.list("proxy", client.owner).size());
  }

  @Test
  void replacementOptionsUseTheResourcesSupplierAndTargetCapability() throws Exception {
    Client client = supplier(), foreign = supplier();
    ObjectNode target = store.create("resource-target", "GLOBAL", store.object().put("protocol", "CUSTOM")
        .put("enabled", true).put("baseUrl", "https://adapter.example.invalid"));
    ObjectNode resource = store.create("resource", client.owner, store.object().put("supplierId", client.owner)
        .put("createdBy", client.uid).put("resourceType", "CCMAX").put("targetId", target.path("id").asText()));
    ObjectNode own = store.create("proxy", client.owner, store.object().put("supplierId", client.owner)
        .put("enabled", true).put("name", "Own proxy").put("url", "socks5://user:PRIVATE@own.example.invalid:1080"));
    store.create("proxy", foreign.owner, store.object().put("supplierId", foreign.owner)
        .put("enabled", true).put("name", "Foreign proxy"));
    String path = "/api/resource-proxy-replacements/proxy-options?resourceId=" + resource.path("id").asText();
    ObjectNode options = get(path, client, 200);
    assertEquals(1, options.path("total").asInt());
    assertEquals(own.path("id"), options.path("items").get(0).path("id"));
    assertTrue(options.path("items").get(0).path("supported").asBoolean());
    assertFalse(options.toString().contains("PRIVATE"));
    store.update("resource-target", target.path("id").asText(), "GLOBAL", store.object().put("protocol", "CCMAX_NATIVE"));
    assertFalse(get(path, client, 200).path("items").get(0).path("supported").asBoolean());
    get(path, foreign, 404);
  }

  @Test
  void rawSubmissionRecoveryReadsOriginalScopedReceiptWithoutCreatingAnotherOperation() throws Exception {
    Client client = supplier(), foreign = supplier();
    ObjectNode resource = store.create("resource", client.owner, store.object().put("supplierId", client.owner)
        .put("createdBy", client.uid).put("resourceType", "CCMAX").put("state", "DRAFT"));
    String requestKey = UUID.randomUUID().toString();
    ObjectNode receipt = store.create("resource-operation", client.owner, store.object().put("supplierId", client.owner)
        .put("resourceId", resource.path("id").asText()).put("createdBy", client.uid)
        .put("type", "SUBMIT").put("state", "UNKNOWN").put("requestKey", requestKey));
    String path = "/api/resources/submissions/" + requestKey;
    assertEquals("UNKNOWN", get(path, client, 200).path("state").asText());
    get(path, foreign, 404);
    get("/api/resources/submissions/" + UUID.randomUUID(), client, 404);
    assertEquals(receipt, store.get("resource-operation", receipt.path("id").asText(), client.owner));
    assertEquals(1, store.list("resource-operation", client.owner).size());
  }
}
