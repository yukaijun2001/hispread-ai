package com.hispread.ai;

import static org.junit.jupiter.api.Assertions.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

import com.fasterxml.jackson.databind.*;
import com.fasterxml.jackson.databind.node.*;
import java.time.Instant;
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
class SystemSupplierContractTest {
  @Autowired MockMvc mvc;
  @Autowired Store s;
  @Autowired AuthService a;
  @Autowired ObjectMapper json;
  @Autowired SystemJobService jobs;
  @Autowired RolePolicy rolePolicy;

  record C(String id, MockHttpSession session, String csrf) {}

  C admin() throws Exception {
    String id = UUID.randomUUID().toString();
    ObjectNode u =
        s.object()
            .put("id", id)
            .put("username", "sys_" + id)
            .put("displayName", "Test")
            .put("role", "ADMIN")
            .putNull("supplierId")
            .put("version", 0)
            .put("mustChangePassword", false)
            .put("onboardingRequired", false);
    u.set("permissions", a.allPermissions());
    a.createUser(u, "ContractTest@123");
    MockHttpSession session = new MockHttpSession();
    session.setAttribute("uid", id);
    session.setAttribute("sv", 0L);
    return new C(
        id,
        session,
        json.readTree(
                mvc.perform(get("/api/auth/csrf").session(session))
                    .andReturn()
                    .getResponse()
                    .getContentAsString())
            .path("token")
            .asText());
  }

  ObjectNode read(String p, C c) throws Exception {
    return (ObjectNode)
        json.readTree(
            mvc.perform(get(p).session(c.session))
                .andExpect(status().isOk())
                .andReturn()
                .getResponse()
                .getContentAsString());
  }

  ObjectNode write(String m, String p, ObjectNode d, C c, int status) throws Exception {
    return (ObjectNode)
        json.readTree(
            mvc.perform(
                    (m.equals("PUT") ? put(p) : post(p))
                        .session(c.session)
                        .header("X-CSRF-TOKEN", c.csrf)
                        .contentType("application/json")
                        .content(d.toString()))
                .andExpect(status().is(status))
                .andReturn()
                .getResponse()
                .getContentAsString());
  }

  @Test
  void usersUseFrontendFilterNamesAndVersionedEnabled() throws Exception {
    C c = admin();
    String marker = "MATCH_" + UUID.randomUUID().toString().substring(0, 8);
    ObjectNode u =
        write(
            "POST",
            "/api/system/users",
            s.object()
                .put("username", "filtered_" + UUID.randomUUID())
                .put("displayName", marker)
                .put("roleCode", "FINANCE")
                .put("password", "ContractTest@123"),
            c,
            200);
    assertEquals(
        1,
        read(
                "/api/system/users?search="
                    + marker
                    + "&roleCode=FINANCE&enabled=true&online=false",
                c)
            .path("total")
            .asInt());
    String p = "/api/system/users/" + u.path("id").asText() + "/enabled";
    write("PUT", p, s.object().put("enabled", false).put("version", 0), c, 200);
    assertEquals(
        1, read("/api/system/users?search=" + marker + "&enabled=false", c).path("total").asInt());
    write("PUT", p, s.object().put("enabled", true).put("version", 0), c, 409);
  }

  @Test
  void accountReplacementKeepsPreviousUntilIndependentApproval() throws Exception {
    C c = admin();
    ObjectNode supplier =
        write(
            "POST",
            "/api/suppliers",
            s.object()
                .put("name", "Contract supplier")
                .put("supplierType", "INDIVIDUAL")
                .put("cycle", "MONTHLY"),
            c,
            200);
    String owner = supplier.path("id").asText();
    assertEquals(
        1,
        read("/api/suppliers?search=Contract&state=PENDING&owner=UNASSIGNED", c)
            .path("total")
            .asInt());
    ObjectNode body =
        s.object()
            .put("supplierId", owner)
            .put("holder", "Contract supplier")
            .put("bank", "Bank")
            .put("currency", "USD")
            .put("accountType", "BANK")
            .put("accountNumber", "LOCAL-123456");
    ObjectNode old = write("POST", "/api/accounts", body, c, 200);
    s.update(
        "account",
        old.path("id").asText(),
        owner,
        s.object().put("state", "APPROVED").put("createdBy", "other").put("updatedBy", "other"));
    ObjectNode next =
        write(
            "POST",
            "/api/accounts",
            body.deepCopy()
                .put("accountNumber", "NEW-654321")
                .put("replacesId", old.path("id").asText()),
            c,
            200);
    String path = "/api/accounts/" + next.path("id").asText() + "/review";
    write("POST", path, s.object().put("approved", true), c, 403);
    s.update(
        "account",
        next.path("id").asText(),
        owner,
        s.object().put("createdBy", "maker").put("updatedBy", "maker"));
    write("POST", path, s.object().put("approved", true), c, 200);
    assertEquals(
        "SUPERSEDED", s.get("account", old.path("id").asText(), owner).path("state").asText());
    assertEquals(
        1,
        read("/api/accounts/platform?supplierId=" + owner + "&state=APPROVED", c)
            .path("total")
            .asInt());
  }

  @Test
  void revokedNoticesRetainDeliveryAuditAndFilters() throws Exception {
    C c = admin();
    ObjectNode n =
        write(
            "POST",
            "/api/notifications/notices",
            s.object()
                .put("title", "Delivery")
                .put("body", "Body")
                .put("audience", "DIRECT")
                .put("targetUserId", c.id),
            c,
            200);
    String p = "/api/notifications/notices/" + n.path("id").asText();
    write("POST", p + "/publish", s.object(), c, 200);
    assertEquals(1, read(p + "/deliveries?state=UNREAD", c).path("total").asInt());
    write("POST", p + "/revoke", s.object(), c, 200);
    ObjectNode d = read(p + "/deliveries?state=WITHDRAWN", c);
    assertEquals(1, d.path("total").asInt());
    assertEquals(1, d.path("summary").path("withdrawnCount").asInt());
  }

  @Test
  void historicalDeadlineTasksCannotConfirmMoneyButTheirHistoryRemainsReadable() throws Exception {
    C c = admin();
    String owner = "retired-finance-" + UUID.randomUUID();
    s.create("supplier", owner, s.object().put("id", owner).put("name", "QA").put("enabled", true));
    ObjectNode settlement = s.create("settlement", owner, s.object().put("supplierId", owner)
        .put("state", "PENDING").put("total", "12").put("currency", "USD")
        .put("confirmationDeadline", Instant.now().minusSeconds(60).toString()));
    s.create("scheduled-task", "GLOBAL", s.object().put("id", "SETTLEMENT_AUTO_CONFIRM")
        .put("key", "SETTLEMENT_AUTO_CONFIRM").put("type", "SETTLEMENT_AUTO_CONFIRM").put("enabled", true));
    write("POST", "/api/system/scheduled-tasks/SETTLEMENT_AUTO_CONFIRM/run", s.object(), c, 410);
    write("POST", "/api/system/scheduled-tasks/priority-support", s.object(), c, 410);
    write("PUT", "/api/system/scheduled-tasks/WORKBENCH_WECOM_REMINDER/reminder-settings", s.object(), c, 410);
    assertEquals(settlement, s.get("settlement", settlement.path("id").asText(), owner));
    assertEquals(0, read("/api/system/scheduled-tasks/SETTLEMENT_AUTO_CONFIRM/runs", c).path("total").asInt());
  }

  @Test
  void backgroundAdministrationDeniesEveryNonAdministratorRole() throws Exception {
    jobs.tasks();
    for (String role : List.of("OPERATOR", "FINANCE", "SUPPLIER", "SUPPLIER_AGENT")) {
      String id = "job-role-" + UUID.randomUUID();
      ObjectNode user = s.object().put("id", id).put("username", id)
          .put("role", role).put("mustChangePassword", false).put("onboardingRequired", false);
      if (role.startsWith("SUPPLIER")) {
        String owner = "job-role-owner-" + UUID.randomUUID();
        s.create("supplier", owner, s.object().put("id", owner).put("enabled", true).put("state", "APPROVED"));
        user.put("supplierId", owner);
      } else user.putNull("supplierId");
      user.set("permissions", rolePolicy.defaults(role));
      a.createUser(user, "BackgroundRole@123");
      MockHttpSession session = new MockHttpSession();
      session.setAttribute("uid", id);
      session.setAttribute("sv", 0L);
      String csrf = json.readTree(mvc.perform(get("/api/auth/csrf").session(session))
          .andReturn().getResponse().getContentAsString()).path("token").asText();
      for (String path : List.of("/system/scheduled-tasks",
          "/system/scheduled-tasks/CCMAX_DAILY_SYNC/runs",
          "/system/scheduled-tasks/WORKBENCH_WECOM_REMINDER/reminder-settings",
          "/system/scheduled-tasks/unknown/rotation-settings"))
        mvc.perform(get("/api" + path).session(session)).andExpect(status().isForbidden());
      for (String path : List.of("/system/scheduled-tasks/CCMAX_DAILY_SYNC/run",
          "/system/scheduled-tasks/priority-support",
          "/system/scheduled-tasks/unknown/rotation-settings/retry-restore"))
        mvc.perform(post("/api" + path).session(session).header("X-CSRF-TOKEN", csrf)
            .contentType("application/json").content("{}"))
            .andExpect(status().isForbidden());
      mvc.perform(put("/api/system/scheduled-tasks/CCMAX_DAILY_SYNC/config").session(session)
          .header("X-CSRF-TOKEN", csrf).contentType("application/json").content("{\"name\":\"Denied\"}"))
          .andExpect(status().isForbidden());
    }
  }

  @Test
  void configurationSecretsStayWriteOnlyAndMissingAdapterIs503() throws Exception {
    C c = admin();
    ObjectNode t =
        write(
            "POST",
            "/api/resource-targets",
            s.object()
                .put("name", "Secret target").put("protocol", "NEWAPI").put("newApiUserId", "2")
                .put("baseUrl", "https://example.com")
                .put("apiKey", "server-only-key")
                .put("enabled", false),
            c,
            200);
    assertFalse(t.has("apiKey"));
    assertTrue(t.path("apiKeyConfigured").asBoolean());
    write(
        "PUT",
        "/api/resource-targets/" + t.path("id").asText(),
        s.object().put("version", 0).put("name", "Renamed target").put("apiKey", ""),
        c,
        200);
    assertEquals(
        "server-only-key",
        s.get("resource-target", t.path("id").asText(), null).path("apiKey").asText());
    write("POST", "/api/payout-providers/OKX_USDT/test", s.object(), c, 503);
  }
}
