package com.hispread.ai;

import static org.junit.jupiter.api.Assertions.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

import com.fasterxml.jackson.databind.*;
import com.fasterxml.jackson.databind.node.*;
import java.time.*;
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
class OperatorFinanceIntegrationTest {
  @Autowired MockMvc mvc;
  @Autowired Store store;
  @Autowired AuthService auth;
  @Autowired ObjectMapper json;

  record Client(MockHttpSession session, String csrf, String owner, String id) {}

  Client client(String role, String tenant) throws Exception {
    String id = UUID.randomUUID().toString();
    ObjectNode user =
        store
            .object()
            .put("id", id)
            .put("username", "role_test_" + id.substring(0, 8))
            .put("displayName", role)
            .put("role", role)
            .put("mustChangePassword", false)
            .put("onboardingRequired", false)
            .put("version", 0);
    if (tenant == null) user.putNull("supplierId");
    else user.put("supplierId", tenant);
    ArrayNode permissions =
        role.equals("SUPPLIER") ? auth.supplierPermissions() : auth.rolePermissions(role);
    user.set("permissions", permissions);
    auth.createUser(user, "RoleTest@Password123");
    MockHttpSession session = new MockHttpSession();
    session.setAttribute("uid", id);
    session.setAttribute("sv", 0L);
    var result = mvc.perform(get("/api/auth/csrf").session(session)).andReturn();
    return new Client(
        session,
        json.readTree(result.getResponse().getContentAsString()).path("token").asText(),
        tenant,
        id);
  }

  ObjectNode write(String method, String url, ObjectNode body, Client c, int expected)
      throws Exception {
    var result =
        mvc.perform(
                (method.equals("PUT") ? put(url) : post(url))
                    .session(c.session)
                    .header("X-CSRF-TOKEN", c.csrf)
                    .contentType("application/json")
                    .content(body.toString()))
            .andExpect(status().is(expected))
            .andReturn();
    JsonNode parsed = json.readTree(result.getResponse().getContentAsString());
    return parsed.isObject() ? (ObjectNode) parsed : store.object();
  }

  @Test
  void monitoringSourcesUseTheRecoveredAlternativePermissionGates() throws Exception {
    Client restrictedOperator = client("OPERATOR", null);
    mvc.perform(get("/api/workbench-monitoring/sources").session(restrictedOperator.session))
        .andExpect(status().isForbidden());
    Client operator = client("ADMIN", null), finance = client("FINANCE", null);
    mvc.perform(get("/api/workbench-monitoring/sources").session(operator.session))
        .andExpect(status().isOk());
    mvc.perform(get("/api/workbench-monitoring/sources").session(finance.session))
        .andExpect(status().isForbidden());
    ObjectNode created =
        write(
            "POST",
            "/api/workbench-monitoring/sources",
            store
                .object()
                .put("name", "Local monitoring source")
                .put("endpoint", "http://127.0.0.1/monitoring")
                .put("rpmPath", "rpm"),
            operator,
            200);
    String id = created.path("id").asText();
    write(
        "PUT",
        "/api/workbench-monitoring/sources/" + id,
        store.object().put("name", "Updated source").put("version", 0),
        operator,
        200);
    write("POST", "/api/workbench-monitoring/sources", store.object(), finance, 403);
    write("PUT", "/api/workbench-monitoring/sources/" + id, store.object(), finance, 403);
    write(
        "POST",
        "/api/workbench-monitoring/sources/" + id + "/refresh",
        store.object(),
        operator,
        400);
    write(
        "POST",
        "/api/workbench-monitoring/sources/" + id + "/refresh",
        store.object(),
        finance,
        403);
    mvc.perform(get("/api/workbench-monitoring/multipliers").session(restrictedOperator.session))
        .andExpect(status().isForbidden());
    ObjectNode profile = auth.findUser(operator.id);
    profile.set("permissions", store.json.valueToTree(List.of("workbench.monitoring.configure")));
    auth.saveUser(profile);
    mvc.perform(get("/api/workbench-monitoring/sources").session(operator.session))
        .andExpect(status().isOk());
    write(
        "POST",
        "/api/workbench-monitoring/sources",
        store
            .object()
            .put("name", "Configure-only source")
            .put("endpoint", "http://127.0.0.1/monitoring")
            .put("rpmPath", "rpm"),
        operator,
        200);
    write(
        "PUT",
        "/api/workbench-monitoring/sources/" + id,
        store.object().put("version", 1),
        operator,
        200);
    write(
        "POST",
        "/api/workbench-monitoring/sources/" + id + "/refresh",
        store.object(),
        operator,
        400);
  }

  @Test
  void operatorReviewsQuotesButCannotPerformFinancialOrSystemWrites() throws Exception {
    Client op = client("OPERATOR", null), finance = client("FINANCE", null);
    String owner = "op-" + UUID.randomUUID();
    store.create(
        "supplier",
        owner,
        store
            .object()
            .put("id", owner)
            .put("supplierId", owner)
            .put("name", "Role supplier")
            .put("ownerUserId", op.id)
            .put("state", "APPROVED")
            .put("enabled", true));
    ObjectNode project =
        store.create(
            "project",
            "GLOBAL",
            store
                .object()
                .put("name", "Role project")
                .put("enabled", true)
                .put("category", "OTHER")
                .put("capacityType", "ACCOUNT_COUNT")
                .put("settlementMethod", "QUOTA")
                .put("deliveryMethod", "KEY"));
    ObjectNode quote =
        store.create(
            "quote",
            owner,
            store
                .object()
                .put("supplierId", owner)
                .put("projectId", project.path("id").asText())
                .put("state", "PENDING")
                .put("effectiveFrom", BusinessSupport.today())
                .put("effectiveTo", BusinessSupport.today())
                .put("multiplier", "0.27")
                .put("pricingType", "DISCOUNT"));
    String id = quote.path("id").asText();
    write(
        "POST",
        "/api/quotes/" + id + "/review",
        store.object().put("approved", true),
        finance,
        403);
    assertEquals(
        "APPROVED",
        write(
                "POST",
                "/api/quotes/" + id + "/review",
                store.object().put("approved", true),
                op,
                200)
            .path("state")
            .asText());
    write(
        "PUT",
        "/api/suppliers/" + owner,
        store.object().put("name", "Updated supplier").put("country", "CN").put("contact", "Test"),
        op,
        200);
    write("PUT", "/api/suppliers/" + owner, store.object().put("name", "Blocked"), finance, 403);
    mvc.perform(get("/api/resource-targets").session(op.session)).andExpect(status().isForbidden());
    mvc.perform(get("/api/resource-targets").session(finance.session))
        .andExpect(status().isForbidden());
    write("POST", "/api/settlement-inputs/manual-direct", store.object(), op, 403);
    for (Client c : List.of(op, finance)) {
      mvc.perform(get("/api/system/users").session(c.session)).andExpect(status().isForbidden());
      mvc.perform(get("/api/system/settings").session(c.session)).andExpect(status().isForbidden());
      mvc.perform(get("/api/payout-providers/AIRWALLEX").session(c.session))
          .andExpect(status().isForbidden());
    }
  }

  @Test
  void financeCompletesScopedLocalMoneyFlowWhileOperatorIsDenied() throws Exception {
    String owner = "finance-role-" + UUID.randomUUID();
    Client fin = client("FINANCE", null),
        op = client("OPERATOR", null),
        supplier = client("SUPPLIER", owner),
        other = client("SUPPLIER", "other-" + UUID.randomUUID());
    store.create(
        "supplier",
        owner,
        store
            .object()
            .put("id", owner)
            .put("supplierId", owner)
            .put("state", "APPROVED")
            .put("enabled", true)
            .put("name", "Finance role supplier"));
    ObjectNode project =
        store.create(
            "project",
            "GLOBAL",
            store.object().put("name", "Finance role project").put("enabled", true));
    String day = LocalDate.now(ZoneId.of("Asia/Shanghai")).minusDays(1).toString();
    ObjectNode input =
        store.object().put("supplierId", owner).put("projectId", project.path("id").asText());
    input
        .putArray("rows")
        .add(
            store
                .object()
                .put("sourceRef", "role-source")
                .put("periodStart", day)
                .put("periodEnd", day)
                .put("currency", "USD")
                .put("originalAmount", "15.25")
                .put("baseReference", "Local recorded expense"));
    write("POST", "/api/settlement-inputs/manual-direct", input, op, 403);
    write("POST", "/api/settlement-inputs/manual-direct", input, fin, 200);
    ObjectNode previewBody =
        store
            .object()
            .put("supplierId", owner)
            .put("projectId", project.path("id").asText())
            .put("periodStart", day)
            .put("periodEnd", day)
            .put("currency", "USD")
            .put("confirmationDeadline", Instant.now().plusSeconds(86400).toString());
    ObjectNode preview = write("POST", "/api/settlements/preview", previewBody, fin, 200);
    previewBody.put("expectedSnapshotHash", preview.path("snapshotHash").asText());
    ObjectNode statement = write("POST", "/api/settlements", previewBody, fin, 200);
    String sid = statement.path("id").asText();
    mvc.perform(get("/api/settlements/" + sid).session(fin.session)).andExpect(status().isOk());
    mvc.perform(get("/api/settlements/" + sid).session(other.session))
        .andExpect(status().isNotFound());
    write(
        "POST",
        "/api/settlements/" + sid + "/confirm",
        store.object().put("approved", true).put("version", 0),
        supplier,
        200);
    ObjectNode proof =
        store.create(
            "document",
            owner,
            store
                .object()
                .put("category", "PAYMENT_PROOF")
                .put("filename", "proof.pdf")
                .put("contentType", "application/pdf"));
    ObjectNode pay =
        store
            .object()
            .put("settlementId", sid)
            .put("requestKey", UUID.randomUUID().toString())
            .put("obligationAmount", "15.25")
            .put("payoutCurrency", "USD")
            .put("fee", "0")
            .put("evidenceId", proof.path("id").asText())
            .put("evidenceContent", "{\"type\":\"doc\",\"children\":[]}");
    pay.putArray("evidenceIds").add(proof.path("id").asText());
    write("POST", "/api/payments/offline", pay, op, 403);
    ObjectNode payment = write("POST", "/api/payments/offline", pay, fin, 200);
    Client reviewer = client("FINANCE", null);
    ObjectNode approved =
        write(
            "POST",
            "/api/payments/" + payment.path("id").asText() + "/review",
            store.object().put("approved", true).put("version", payment.path("version").asLong()),
            reviewer,
            200);
    pay.put("version", approved.path("version").asLong());
    payment =
        write(
            "POST",
            "/api/payments/" + payment.path("id").asText() + "/offline-record",
            pay,
            fin,
            200);
    write(
        "POST",
        "/api/payments/" + payment.path("id").asText() + "/receipt",
        store.object().put("confirmed", true),
        supplier,
        200);
    assertEquals("15.25", store.get("settlement", sid, owner).path("receivedAmount").asText());
    ObjectNode account =
        store.create(
            "account", owner, store.object().put("state", "PENDING").put("currency", "USD"));
    write(
        "POST",
        "/api/accounts/" + account.path("id").asText() + "/review",
        store.object().put("approved", true),
        op,
        403);
    write(
        "POST",
        "/api/accounts/" + account.path("id").asText() + "/review",
        store.object().put("approved", true),
        fin,
        200);
  }

  @Test
  void operatorCannotBindPlatformIdentitiesAndBatchBindingIsAtomic() throws Exception {
    Client op = client("ADMIN", null),
        admin = client("ADMIN", null),
        finance = client("FINANCE", null);
    String owner = "bind-" + UUID.randomUUID();
    store.create("supplier", owner, store.object().put("id", owner).put("name", "Bind target"));
    String unboundId = UUID.randomUUID().toString();
    ObjectNode unbound =
        store
            .object()
            .put("id", unboundId)
            .put("username", "unbound_" + unboundId.substring(0, 8))
            .put("displayName", "Unbound")
            .put("role", "SUPPLIER")
            .putNull("supplierId");
    unbound.set("permissions", auth.supplierPermissions());
    auth.createUser(unbound, "Unbound@Password123");
    ObjectNode originalAdmin = auth.findUser(admin.id);
    ObjectNode body = store.object();
    body.putArray("userIds").add(unboundId).add(admin.id);
    write("PUT", "/api/suppliers/" + owner + "/users", body, op, 403);
    assertTrue(auth.findUser(unboundId).path("supplierId").isNull());
    assertEquals(originalAdmin, auth.findUser(admin.id));
    var available =
        mvc.perform(get("/api/suppliers/available-users").session(op.session))
            .andExpect(status().isOk())
            .andReturn();
    JsonNode users = json.readTree(available.getResponse().getContentAsString());
    assertTrue(users.toString().contains(unboundId));
    assertFalse(users.toString().contains(admin.id));
    assertFalse(users.toString().contains(finance.id));
    ObjectNode only = store.object();
    only.putArray("userIds").add(unboundId);
    write("PUT", "/api/suppliers/" + owner + "/users", only, op, 200);
    assertEquals(owner, auth.findUser(unboundId).path("supplierId").asText());
    write(
        "PUT",
        "/api/suppliers/" + owner + "/owner",
        store.object().put("ownerUserId", finance.id).put("note", "Must not choose finance"),
        op,
        403);
    var owners =
        mvc.perform(get("/api/suppliers/owner-candidates").session(op.session))
            .andExpect(status().isOk())
            .andReturn();
    String candidates = owners.getResponse().getContentAsString();
    assertFalse(candidates.contains(finance.id));
    assertTrue(candidates.contains(op.id));
  }

  @Test
  void financialExecutionPermissionsDoNotGrantSupplierReceiptOrSystemAccess() throws Exception {
    Client finance = client("FINANCE", null), op = client("OPERATOR", null);
    write("POST", "/api/payments/nonexistent/execute", store.object(), op, 403);
    write("POST", "/api/payments/nonexistent/execute", store.object(), finance, 403);
    write("POST", "/api/payments/nonexistent/reconcile", store.object(), finance, 403);
    write("POST", "/api/payments/sandbox/events", store.object(), finance, 403);
    write(
        "POST",
        "/api/settlements/nonexistent/confirm",
        store.object().put("approved", true),
        finance,
        403);
    write(
        "POST",
        "/api/payments/nonexistent/receipt",
        store.object().put("confirmed", true),
        finance,
        403);
    String month = BusinessSupport.today();
    for (int i = 0; i < 2; i++) {
      String owner = "report-role-" + UUID.randomUUID();
      ObjectNode statement =
          store
              .object()
              .put("supplierId", owner)
              .put("supplierName", "Report " + i)
              .put("projectName", "Role test")
              .put("currency", "USD")
              .put("periodStart", month)
              .put("periodEnd", month)
              .put("total", "10")
              .put("paidAmount", "0")
              .put("receivedAmount", "0")
              .put("state", "CONFIRMED");
      statement
          .putArray("adjustments")
          .add(store.object().put("note", "PRIVATE ADJUSTMENT").put("supplierVisible", false));
      store.create("settlement", owner, statement);
    }
    var report =
        mvc.perform(
                get("/api/reports/monthly-payables?from=" + month + "&to=" + month)
                    .session(finance.session))
            .andExpect(status().isOk())
            .andReturn();
    JsonNode rows = json.readTree(report.getResponse().getContentAsString()).path("items");
    assertTrue(rows.get(0).path("supplierCount").asInt() >= 2);
    var details =
        mvc.perform(
                get("/api/reports/settlements?from=" + month + "&to=" + month)
                    .session(finance.session))
            .andExpect(status().isOk())
            .andReturn();
    assertFalse(details.getResponse().getContentAsString().contains("PRIVATE ADJUSTMENT"));
  }

  @Test
  void operatorUsesRecoveredSupplierCreateBindAndOwnerHistoryContracts() throws Exception {
    Client op = client("ADMIN", null);
    String username = "created_supplier_" + UUID.randomUUID().toString().substring(0, 8);
    ObjectNode body = store.object().put("code", "LOCALTEST");
    body.set(
        "profile",
        store
            .object()
            .put("name", "Created via operator")
            .put("contact", "Contact")
            .put("country", "CN")
            .put("supplierType", "INDIVIDUAL")
            .put("cycle", "WEEKLY"));
    body.set(
        "account",
        store.object().put("mode", "NEW").put("username", username).put("displayName", "Contact"));
    ObjectNode created = write("POST", "/api/suppliers", body, op, 200);
    String owner = created.path("supplier").path("id").asText();
    assertFalse(owner.isBlank());
    String uid = created.path("account").path("userId").asText();
    assertEquals(owner, auth.findUser(uid).path("supplierId").asText());
    assertFalse(created.path("account").path("initialPassword").asText().isBlank());
    write(
        "POST",
        "/api/suppliers/" + owner + "/enabled",
        store.object().put("enabled", false).put("note", "local pause"),
        op,
        200);
    assertFalse(store.get("supplier", owner, owner).path("enabled").asBoolean());
    ObjectNode supplier = store.get("supplier", owner, owner);
    write(
        "PUT",
        "/api/suppliers/" + owner + "/owner",
        store
            .object()
            .put("ownerUserId", op.id)
            .put("version", supplier.path("version").asLong())
            .put("note", "Assigned local operator"),
        op,
        200);
    mvc.perform(get("/api/suppliers/" + owner + "/owner-terms").session(op.session))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.items[0].ownerUserId").value(op.id));
  }
}
