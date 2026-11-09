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
class PlatformFinanceIntegrationTest {
  @Autowired MockMvc mvc;
  @Autowired Store store;
  @Autowired AuthService auth;
  @Autowired ObjectMapper json;

  record Client(MockHttpSession session, String csrf, String owner, String id) {}

  Client client(boolean admin, String owner) throws Exception {
    String id = UUID.randomUUID().toString();
    ObjectNode p =
        store
            .object()
            .put("id", id)
            .put("username", "finance_" + id)
            .put("displayName", admin ? "Admin" : "Supplier")
            .put("role", admin ? "ADMIN" : "SUPPLIER")
            .put("mustChangePassword", false)
            .put("onboardingRequired", false);
    if (admin) p.putNull("supplierId");
    else p.put("supplierId", owner);
    ArrayNode permissions = auth.supplierPermissions();
    for (String permission :
        List.of(
            "usage.read",
            "usage.import",
            "settlement.create",
            "payment.record",
            "payment.create",
            "payment.review",
            "quote.review")) permissions.add(permission);
    p.set("permissions", permissions);
    auth.createUser(p, "Strong@Password1");
    MockHttpSession session = new MockHttpSession();
    session.setAttribute("uid", id);
    session.setAttribute("sv", 0L);
    var response = mvc.perform(get("/api/auth/csrf").session(session)).andReturn();
    return new Client(
        session,
        json.readTree(response.getResponse().getContentAsString()).path("token").asText(),
        owner,
        id);
  }

  ObjectNode post(String url, ObjectNode body, Client c, int status) throws Exception {
    var result =
        mvc.perform(
                org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post(url)
                    .session(c.session)
                    .header("X-CSRF-TOKEN", c.csrf)
                    .contentType("application/json")
                    .content(body.toString()))
            .andExpect(status().is(status))
            .andReturn();
    return (ObjectNode) json.readTree(result.getResponse().getContentAsString());
  }

  @Test
  void completeLocalFinanceFlowUsesReviewedAmountsAndRealProofRecord() throws Exception {
    String owner = "finance-" + UUID.randomUUID();
    Client admin = client(true, null),
        checker = client(true, null),
        supplier = client(false, owner);
    store.create(
        "supplier", owner, store.object().put("id", owner).put("name", "Finance supplier"));
    ObjectNode project =
        store.create(
            "project",
            "GLOBAL",
            store
                .object()
                .put("name", "Finance project")
                .put("enabled", true)
                .put("category", "TEST"));
    String day = LocalDate.now(ZoneId.of("Asia/Shanghai")).minusDays(1).toString();
    ObjectNode request =
        store
            .object()
            .put("supplierId", owner)
            .put("projectId", project.path("id").asText())
            .put("pricingMode", "DIRECT");
    request
        .putArray("rows")
        .add(
            store
                .object()
                .put("sourceRef", "manual-" + UUID.randomUUID())
                .put("periodStart", day)
                .put("periodEnd", day)
                .put("currency", "USD")
                .put("originalAmount", "27.50")
                .put("baseReference", "Real local expense"));
    assertEquals(
        1,
        post("/api/settlement-inputs/manual-direct", request, admin, 200).path("inserted").asInt());
    assertEquals(
        1,
        post("/api/settlement-inputs/manual-direct", request, admin, 200).path("skipped").asInt());
    mvc.perform(get("/api/accounting/daily/summary?supplier=" + owner).session(admin.session))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.totals[0].payableTotal").value("27.50"))
        .andExpect(jsonPath("$.projects[0].count").value(1));
    ObjectNode previewRequest =
        store
            .object()
            .put("supplierId", owner)
            .put("projectId", project.path("id").asText())
            .put("periodStart", day)
            .put("periodEnd", day)
            .put("currency", "USD")
            .put("confirmationDeadline", Instant.now().plusSeconds(86400).toString());
    ObjectNode preview = post("/api/settlements/preview", previewRequest, admin, 200);
    assertEquals("27.50", preview.path("total").asText());
    previewRequest.put("expectedSnapshotHash", preview.path("snapshotHash").asText());
    ObjectNode statement = post("/api/settlements", previewRequest, admin, 200);
    assertEquals(
        statement.path("id"), post("/api/settlements", previewRequest, admin, 200).path("id"));
    String sid = statement.path("id").asText();
    post(
        "/api/settlements/" + sid + "/confirm",
        store.object().put("approved", true).put("version", 0),
        supplier,
        200);
    ObjectNode document =
        store.create(
            "document",
            owner,
            store
                .object()
                .put("supplierId", owner)
                .put("category", "PAYMENT_PROOF")
                .put("name", "real-local-proof.pdf"));
    ObjectNode pay =
        store
            .object()
            .put("settlementId", sid)
            .put("requestKey", UUID.randomUUID().toString())
            .put("obligationAmount", "27.50")
            .put("payoutCurrency", "USD")
            .put("fee", "0")
            .put("externalRef", "")
            .put("evidenceId", document.path("id").asText())
            .put("evidenceContent", "{\"blocks\":[{\"text\":\"Transferred locally\"}]}");
    pay.putArray("evidenceIds").add(document.path("id").asText());
    ObjectNode payment = post("/api/payments/offline", pay, admin, 200);
    assertEquals("PENDING", payment.path("state").asText());
    post(
        "/api/payments/" + payment.path("id").asText() + "/review",
        store.object().put("approved", true).put("version", payment.path("version").asLong()),
        admin,
        403);
    ObjectNode approved =
        post(
            "/api/payments/" + payment.path("id").asText() + "/review",
            store.object().put("approved", true).put("version", payment.path("version").asLong()),
            checker,
            200);
    pay.put("version", approved.path("version").asLong());
    payment =
        post("/api/payments/" + payment.path("id").asText() + "/offline-record", pay, admin, 200);
    assertEquals("SUCCEEDED", payment.path("state").asText());
    assertEquals("MANUAL", payment.path("verificationMode").asText());
    assertTrue(payment.path("evidence").path("attachments").isArray());
    assertEquals(
        document.path("id"), payment.path("evidence").path("attachments").get(0).path("id"));
    assertEquals("USD", payment.path("obligationCurrency").asText());
    assertEquals(payment.path("id"), post("/api/payments/offline", pay, admin, 200).path("id"));
    assertEquals("27.50", store.get("settlement", sid, owner).path("reservedAmount").asText());
    assertEquals("27.50", store.get("settlement", sid, owner).path("paidAmount").asText());
    post(
        "/api/payments/" + payment.path("id").asText() + "/receipt",
        store.object().put("confirmed", true),
        supplier,
        200);
    assertEquals("27.50", store.get("settlement", sid, owner).path("receivedAmount").asText());
    pay.put("requestKey", UUID.randomUUID().toString());
    post("/api/payments/offline", pay, admin, 409);
  }

  @Test
  void snapshotAndAdjustmentGuardsRejectChangedOrNegativeMoney() throws Exception {
    String owner = "finance-" + UUID.randomUUID();
    Client admin = client(true, null);
    store.create(
        "supplier", owner, store.object().put("id", owner).put("name", "Finance supplier"));
    ObjectNode project =
        store.create(
            "project",
            "GLOBAL",
            store.object().put("name", "Finance project").put("enabled", true));
    String day = BusinessSupport.today();
    ObjectNode in =
        store.create(
            "input",
            owner,
            store
                .object()
                .put("supplierId", owner)
                .put("projectId", project.path("id").asText())
                .put("periodStart", day)
                .put("periodEnd", day)
                .put("currency", "USD")
                .put("originalAmount", "10")
                .put("calculatedPayable", "10")
                .put("state", "AVAILABLE"));
    ObjectNode request =
        store
            .object()
            .put("supplierId", owner)
            .put("projectId", project.path("id").asText())
            .put("periodStart", day)
            .put("periodEnd", day)
            .put("currency", "USD")
            .put("confirmationDeadline", Instant.now().plusSeconds(86400).toString());
    ObjectNode preview = post("/api/settlements/preview", request, admin, 200);
    request.put("expectedSnapshotHash", preview.path("snapshotHash").asText());
    store.update(
        "input", in.path("id").asText(), owner, store.object().put("calculatedPayable", "12"));
    post("/api/settlements", request, admin, 409);
    ObjectNode next = post("/api/settlements/preview", request, admin, 200);
    request.put("expectedSnapshotHash", next.path("snapshotHash").asText());
    ObjectNode statement = post("/api/settlements", request, admin, 200);
    post(
        "/api/settlements/" + statement.path("id").asText() + "/adjustments",
        store
            .object()
            .put("version", 0)
            .put("requestKey", UUID.randomUUID().toString())
            .put("amount", "-100")
            .put("businessDate", day)
            .put("note", "adjust"),
        admin,
        400);
  }

  @Test
  void exportsContainRealSpreadsheetBytesAndAreOwnedByCurrentUser() throws Exception {
    Client admin = client(true, null), other = client(true, null);
    String owner = "export-" + UUID.randomUUID();
    store.create(
        "input",
        owner,
        store
            .object()
            .put("supplierId", owner)
            .put("supplierName", "Export supplier")
            .put("projectId", "export-project")
            .put("projectName", "Export project")
            .put("sourceRef", "export-one")
            .put("periodStart", BusinessSupport.today())
            .put("periodEnd", BusinessSupport.today())
            .put("originalAmount", "5.25")
            .put("calculatedPayable", "5.25")
            .put("currency", "USD")
            .put("state", "AVAILABLE"));
    ObjectNode request =
        store
            .object()
            .put("type", "DETAIL")
            .put("format", "XLSX")
            .put("requestKey", UUID.randomUUID().toString());
    request.set("filter", store.object().put("supplier", owner));
    ObjectNode job = post("/api/accounting/daily/exports", request, admin, 200);
    assertEquals("COMPLETED", job.path("state").asText());
    assertEquals(1, job.path("resultCount").asInt());
    assertEquals(
        job.path("id"), post("/api/accounting/daily/exports", request, admin, 200).path("id"));
    String id = job.path("id").asText();
    mvc.perform(get("/api/accounting/daily/exports/" + id + "/preview").session(admin.session))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.rows[0][5]").value("5.25"));
    mvc.perform(get("/api/accounting/daily/exports/" + id).session(other.session))
        .andExpect(status().isNotFound());
    byte[] bytes =
        mvc.perform(get("/api/accounting/daily/exports/" + id + "/files/0").session(admin.session))
            .andExpect(status().isOk())
            .andReturn()
            .getResponse()
            .getContentAsByteArray();
    Set<String> names = new HashSet<>();
    try (var zip = new java.util.zip.ZipInputStream(new java.io.ByteArrayInputStream(bytes))) {
      java.util.zip.ZipEntry entry;
      while ((entry = zip.getNextEntry()) != null) {
        names.add(entry.getName());
        if (entry.getName().endsWith("sheet1.xml"))
          assertTrue(
              new String(zip.readAllBytes(), java.nio.charset.StandardCharsets.UTF_8)
                  .contains("5.25"));
      }
    }
    assertTrue(names.contains("[Content_Types].xml"));
    assertTrue(names.contains("xl/workbook.xml"));
  }

  @Test
  void closingFailedPaymentCannotReleaseAnotherPaymentsReservation() throws Exception {
    String owner = "close-" + UUID.randomUUID();
    Client admin = client(true, null);
    ObjectNode settlement =
        store.create(
            "settlement",
            owner,
            store
                .object()
                .put("supplierId", owner)
                .put("state", "CONFIRMED")
                .put("total", "30")
                .put("reservedAmount", "20"));
    String sid = settlement.path("id").asText();
    ObjectNode first =
        store.create(
            "payment",
            owner,
            store
                .object()
                .put("supplierId", owner)
                .put("settlementId", sid)
                .put("obligationAmount", "10")
                .put("state", "APPROVED"));
    store.create(
        "payment",
        owner,
        store
            .object()
            .put("supplierId", owner)
            .put("settlementId", sid)
            .put("obligationAmount", "10")
            .put("state", "APPROVED"));
    ObjectNode close =
        store.object().put("state", "FAILED").put("note", "Failure confirmed").put("version", 0);
    String pid = first.path("id").asText();
    post("/api/payments/" + pid + "/close", close, admin, 200);
    assertEquals("10", store.get("settlement", sid, owner).path("reservedAmount").asText());
    post("/api/payments/" + pid + "/close", close, admin, 409);
    assertEquals("10", store.get("settlement", sid, owner).path("reservedAmount").asText());
    post("/api/payments/" + pid + "/offline-record", store.object().put("version", 1), admin, 403);
  }
}
