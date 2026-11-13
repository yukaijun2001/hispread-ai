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
class AdminIntegrationTest {
  @Autowired MockMvc mvc;
  @Autowired Store s;
  @Autowired AuthService a;
  @Autowired ObjectMapper json;

  record Client(MockHttpSession session, String csrf, String uid) {}

  Client client(boolean admin) throws Exception {
    String id = UUID.randomUUID().toString();
    ObjectNode u =
        s.object()
            .put("id", id)
            .put("username", "admin_test_" + id.substring(0, 8))
            .put("displayName", "Test")
            .put("role", admin ? "ADMIN" : "SUPPLIER")
            .put("version", 0)
            .put("mustChangePassword", false)
            .put("onboardingRequired", false);
    if (admin) u.putNull("supplierId");
    else u.put("supplierId", "tenant-" + id);
    u.set("permissions", admin ? a.allPermissions() : a.supplierPermissions());
    a.createUser(u, "AdminTest@123");
    MockHttpSession session = new MockHttpSession();
    session.setAttribute("uid", id);
    session.setAttribute("sv", 0L);
    var result = mvc.perform(get("/api/auth/csrf").session(session)).andReturn();
    return new Client(
        session,
        json.readTree(result.getResponse().getContentAsString()).path("token").asText(),
        id);
  }

  JsonNode getJson(String path, Client c) throws Exception {
    return json.readTree(
        mvc.perform(get(path).session(c.session))
            .andExpect(status().isOk())
            .andReturn()
            .getResponse()
            .getContentAsString());
  }

  JsonNode write(String method, String path, ObjectNode body, Client c) throws Exception {
    return json.readTree(
        mvc.perform(
                (method.equals("PUT") ? put(path) : post(path))
                    .session(c.session)
                    .header("X-CSRF-TOKEN", c.csrf)
                    .contentType("application/json")
                    .content(body.toString()))
            .andExpect(status().isOk())
            .andReturn()
            .getResponse()
            .getContentAsString());
  }

  @Test
  void adminViewsExposeRealShapesAndSupplierCannotEnter() throws Exception {
    Client admin = client(true), supplier = client(false);
    mvc.perform(get("/api/system/users").session(supplier.session))
        .andExpect(status().isForbidden());
    assertTrue(getJson("/api/system/users", admin).path("items").isArray());
    JsonNode roles = getJson("/api/system/roles", admin);
    assertTrue(roles.path("roles").isArray());
    assertTrue(roles.path("permissions").isArray());
    assertTrue(getJson("/api/system/roles/page", admin).path("permissions").isArray());
    assertTrue(getJson("/api/system/settings", admin).path("policy").isObject());
    for (String path :
        List.of(
            "/api/resource-targets",
            "/api/system/scheduled-tasks",
            "/api/workbench-monitoring/sources",
            "/api/workbench-monitoring/multipliers")) assertTrue(getJson(path, admin).isArray());
    for (String code : List.of("AIRWALLEX", "OKX_USDT", "BINANCE_USDT"))
      assertFalse(getJson("/api/payout-providers/" + code, admin).path("enabled").asBoolean());
  }

  @Test
  void adminCreatesRoleAndNoticeDeliveryAndRevokesUnread() throws Exception {
    Client admin = client(true), supplier = client(false);
    String suffix = UUID.randomUUID().toString().substring(0, 8).toUpperCase();
    ObjectNode role =
        s.object()
            .put("code", "CUSTOM_" + suffix)
            .put("name", "Test role")
            .put("scopeType", "OPERATOR");
    role.set("permissions", s.json.valueToTree(List.of("workbench.read")));
    JsonNode created = write("POST", "/api/system/roles", role, admin);
    assertEquals("Test role", created.path("name").asText());
    ObjectNode notice =
        s.object()
            .put("title", "Local system notice")
            .put("body", "Integration delivery")
            .put("audience", "DIRECT")
            .put("targetUserId", supplier.uid);
    JsonNode n = write("POST", "/api/notifications/notices", notice, admin);
    String id = n.path("id").asText();
    JsonNode published =
        write("POST", "/api/notifications/notices/" + id + "/publish", s.object(), admin);
    assertEquals(1, published.path("recipientCount").asInt());
    assertEquals(1, getJson("/api/notifications/unread-count", supplier).path("count").asInt());
    JsonNode revoked =
        write("POST", "/api/notifications/notices/" + id + "/revoke", s.object(), admin);
    assertEquals(1, revoked.path("removedUnreadCount").asInt());
    assertEquals(0, getJson("/api/notifications/unread-count", supplier).path("count").asInt());
  }

  @Test
  void passwordPolicyPersistsAndControlsRegistration() throws Exception {
    Client admin = client(true);
    ObjectNode settings = (ObjectNode) getJson("/api/system/settings", admin);
    ObjectNode policy = (ObjectNode) settings.path("policy").deepCopy();
    policy.put("passwordMinLength", 16);
    settings.set("policy", policy);
    write("PUT", "/api/system/settings", settings, admin);
    assertEquals(
        16, getJson("/api/auth/registration-policy", admin).path("passwordMinLength").asInt());
    assertThrows(ApiException.class, () -> a.validateCurrentPassword("Short@123"));
  }

  @Test
  void intakeLimitsRequireWholeNumbersAndRejectMalformedSettings() throws Exception {
    Client admin = client(true);
    for (String field : List.of("ccmaxIntakeConcurrencyLimit", "ccmaxCreationTimeoutSeconds")) {
      for (JsonNode invalid : List.of(json.readTree("0"), json.readTree("1.5"), json.readTree("\"2\""), json.readTree("null"))) {
        ObjectNode input = s.object(); input.set(field, invalid);
        mvc.perform(put("/api/system/settings").session(admin.session).header("X-CSRF-TOKEN", admin.csrf)
            .contentType("application/json").content(input.toString())).andExpect(status().isBadRequest());
      }
    }
    JsonNode saved = write("PUT", "/api/system/settings", s.object()
        .put("ccmaxIntakeConcurrencyLimit", 2).put("ccmaxCreationTimeoutSeconds", 3), admin);
    assertEquals(2, saved.path("ccmaxIntakeConcurrencyLimit").asInt());
    assertEquals(3, saved.path("ccmaxCreationTimeoutSeconds").asInt());
  }

  @Test
  void workbenchUsesRoleAndActualSettlementTotals() throws Exception {
    Client admin = client(true), supplier = client(false);
    String owner = a.findUser(supplier.uid).path("supplierId").asText();
    s.create(
        "settlement",
        owner,
        s.object()
            .put("state", "CONFIRMED")
            .put("currency", "USD")
            .put("total", "120.50")
            .put("paidAmount", "20.00")
            .put("receivedAmount", "10.00"));
    JsonNode mine = getJson("/api/workbench", supplier);
    assertTrue(mine.path("supplierSide").asBoolean());
    assertEquals("120.50", mine.path("money").get(0).path("total").asText());
    assertFalse(getJson("/api/workbench", admin).path("supplierSide").asBoolean());
    assertFalse(getJson("/api/workbench", admin).path("money").isEmpty());
  }
}
