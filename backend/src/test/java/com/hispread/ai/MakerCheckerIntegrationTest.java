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
class MakerCheckerIntegrationTest {
  @Autowired Store s;
  @Autowired AuthService a;
  @Autowired MockMvc mvc;
  @Autowired ObjectMapper json;

  record Client(String uid, String owner, MockHttpSession session, String csrf) {}

  Client client(String role, String owner) throws Exception {
    String id = UUID.randomUUID().toString();
    ObjectNode u =
        s.object()
            .put("id", id)
            .put("username", "maker_" + id)
            .put("displayName", role)
            .put("role", role)
            .put("version", 0)
            .put("mustChangePassword", false)
            .put("onboardingRequired", false);
    if (owner == null) u.putNull("supplierId");
    else u.put("supplierId", owner);
    u.set(
        "permissions",
        role.equals("ADMIN")
            ? a.allPermissions()
            : role.equals("SUPPLIER") ? a.supplierPermissions() : a.rolePermissions(role));
    a.createUser(u, "MakerChecker@123");
    MockHttpSession session = new MockHttpSession();
    session.setAttribute("uid", id);
    session.setAttribute("sv", 0L);
    var r = mvc.perform(get("/api/auth/csrf").session(session)).andReturn();
    return new Client(
        id,
        owner,
        session,
        json.readTree(r.getResponse().getContentAsString()).path("token").asText());
  }

  ObjectNode post(String path, ObjectNode body, Client c, int status) throws Exception {
    return (ObjectNode)
        json.readTree(
            mvc.perform(
                    org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post(path)
                        .session(c.session)
                        .header("X-CSRF-TOKEN", c.csrf)
                        .contentType("application/json")
                        .content(body.toString()))
                .andExpect(status().is(status))
                .andReturn()
                .getResponse()
                .getContentAsString());
  }

  ObjectNode statement(String owner, String amount) {
    return s.create(
        "settlement",
        owner,
        s.object()
            .put("supplierId", owner)
            .put("code", "MC-STATEMENT")
            .put("state", "PENDING")
            .put("currency", "USD")
            .put("total", amount)
            .put("paidAmount", "0")
            .put("receivedAmount", "0")
            .put("reservedAmount", "0")
            .put("confirmationDeadline", Instant.now().plusSeconds(86400).toString()));
  }

  @Test
  void twoFinanceUsersApproveThenRecordAndOnlySupplierCanConfirmAndReceipt() throws Exception {
    String owner = "mc-" + UUID.randomUUID();
    s.create(
        "supplier",
        owner,
        s.object().put("id", owner).put("name", "Maker checker supplier").put("enabled", true));
    Client maker = client("FINANCE", null),
        checker = client("FINANCE", null),
        admin = client("ADMIN", null),
        supplier = client("SUPPLIER", owner),
        other = client("SUPPLIER", "other-tenant");
    ObjectNode st = statement(owner, "42.50");
    String sid = st.path("id").asText();
    ObjectNode confirmation = s.object().put("approved", true).put("version", 0);
    post("/api/settlements/" + sid + "/confirm", confirmation, admin, 403);
    post("/api/settlements/" + sid + "/confirm", confirmation, maker, 403);
    post("/api/settlements/" + sid + "/confirm", confirmation, other, 404);
    post("/api/settlements/" + sid + "/confirm", confirmation, supplier, 200);
    ObjectNode request =
        s.object()
            .put("settlementId", sid)
            .put("requestKey", UUID.randomUUID().toString())
            .put("payoutCurrency", "USD")
            .put("obligationAmount", "42.50")
            .put("fee", "0")
            .put("state", "SUCCEEDED")
            .put("reviewedBy", maker.uid);
    ObjectNode p = post("/api/payments/offline", request, maker, 200);
    String pid = p.path("id").asText();
    assertEquals("PENDING", p.path("state").asText());
    assertFalse(p.hasNonNull("reviewedBy"));
    assertEquals("0", s.get("settlement", sid, owner).path("paidAmount").asText());
    ObjectNode review = s.object().put("approved", true).put("version", p.path("version").asLong());
    post("/api/payments/" + pid + "/review", review, maker, 403);
    ObjectNode approved = post("/api/payments/" + pid + "/review", review, checker, 200);
    assertEquals(checker.uid, approved.path("reviewedBy").asText());
    ObjectNode proof =
        s.create(
            "document",
            owner,
            s.object()
                .put("supplierId", owner)
                .put("createdBy", maker.uid)
                .put("category", "PAYMENT_PROOF")
                .put("filename", "manual-proof.pdf"));
    ObjectNode evidence =
        s.object()
            .put("version", approved.path("version").asLong())
            .put("evidenceContent", "{\"type\":\"doc\",\"children\":[]}");
    evidence.putArray("evidenceIds").add(proof.path("id").asText());
    ObjectNode recorded = post("/api/payments/" + pid + "/offline-record", evidence, maker, 200);
    assertEquals("SUCCEEDED", recorded.path("state").asText());
    assertEquals(maker.uid, recorded.path("recordedBy").asText());
    assertEquals("42.50", s.get("settlement", sid, owner).path("paidAmount").asText());
    post("/api/payments/" + pid + "/receipt", s.object().put("confirmed", true), admin, 403);
    post("/api/payments/" + pid + "/receipt", s.object().put("confirmed", true), checker, 403);
    post("/api/payments/" + pid + "/receipt", s.object().put("confirmed", true), other, 404);
    post("/api/payments/" + pid + "/receipt", s.object().put("confirmed", true), supplier, 200);
    assertEquals("42.50", s.get("settlement", sid, owner).path("receivedAmount").asText());
  }

  @Test
  void adminCannotSelfApproveOrRecordUnapprovedAndOperatorSeesOnlyOperationalMetrics()
      throws Exception {
    Client admin = client("ADMIN", null), operator = client("OPERATOR", null);
    String owned = "owned-" + UUID.randomUUID(), foreign = "foreign-" + UUID.randomUUID();
    s.create(
        "supplier",
        owned,
        s.object()
            .put("id", owned)
            .put("name", "Owned")
            .put("enabled", true)
            .put("ownerUserId", operator.uid));
    s.create(
        "supplier",
        foreign,
        s.object()
            .put("id", foreign)
            .put("name", "Foreign")
            .put("enabled", true)
            .put("ownerUserId", admin.uid));
    ObjectNode st = statement(owned, "20");
    String sid = st.path("id").asText();
    s.update(
        "settlement",
        sid,
        owned,
        s.object().put("state", "CONFIRMED").put("supplierConfirmed", true));
    ObjectNode request =
        s.object()
            .put("settlementId", sid)
            .put("requestKey", UUID.randomUUID().toString())
            .put("payoutCurrency", "USD")
            .put("obligationAmount", "10");
    ObjectNode p = post("/api/payments/offline", request, admin, 200);
    String pid = p.path("id").asText();
    post(
        "/api/payments/" + pid + "/review",
        s.object().put("approved", true).put("version", 0),
        admin,
        403);
    post("/api/payments/" + pid + "/offline-record", s.object().put("version", 0), admin, 403);
    s.create(
        "quote",
        owned,
        s.object()
            .put("supplierId", owned)
            .put("state", "PENDING")
            .put("projectId", "own-project"));
    s.create(
        "quote",
        foreign,
        s.object()
            .put("supplierId", foreign)
            .put("state", "PENDING")
            .put("projectId", "foreign-project"));
    s.create(
        "resource", owned, s.object().put("supplierId", owned).put("projectId", "own-project"));
    String content =
        mvc.perform(get("/api/reports/operations").session(operator.session))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.supplierCount").value(1))
            .andExpect(jsonPath("$.quoteCount").value(1))
            .andReturn()
            .getResponse()
            .getContentAsString();
    assertFalse(content.contains("payable"));
    assertFalse(content.contains("currency"));
    assertFalse(content.contains("Foreign"));
    for (String path :
        List.of(
            "/api/reports/overview",
            "/api/reports/supplier-receivables",
            "/api/settlements/summary",
            "/api/accounting/daily/summary",
            "/api/payments",
            "/api/reports/export?report=SUPPLIER_RECEIVABLES"))
      mvc.perform(get(path).session(operator.session)).andExpect(status().isForbidden());
  }

  @Test
  void supplierAndMemberFinancialProjectionCannotReadAnotherTenantOrPayables() throws Exception {
    String owner = "bills-" + UUID.randomUUID(), foreign = "bills-foreign-" + UUID.randomUUID();
    s.create(
        "supplier",
        owner,
        s.object().put("id", owner).put("name", "Bills supplier").put("enabled", true));
    Client supplier = client("SUPPLIER", owner);
    String memberId = UUID.randomUUID().toString();
    ObjectNode member =
        s.object()
            .put("id", memberId)
            .put("username", "bill_member_" + memberId)
            .put("role", "SUPPLIER_AGENT")
            .put("supplierId", owner)
            .put("version", 0);
    member.set("projectIds", s.json.valueToTree(List.of("assigned-project")));
    member.set("permissions", a.rolePermissions("SUPPLIER_AGENT"));
    a.createUser(member, "MemberBills@123");
    MockHttpSession session = new MockHttpSession();
    session.setAttribute("uid", memberId);
    session.setAttribute("sv", 0L);
    s.create(
        "bill",
        owner,
        s.object()
            .put("supplierId", owner)
            .put("creatorId", memberId)
            .put("createdBy", memberId)
            .put("projectId", "assigned-project")
            .put("resourceId", "own-resource")
            .put("businessDate", BusinessSupport.today())
            .put("currency", "USD")
            .put("state", "CONFIRMED")
            .put("consumption", "8")
            .put("payable", "4"));
    s.create(
        "bill",
        owner,
        s.object()
            .put("supplierId", owner)
            .put("creatorId", "different-member")
            .put("projectId", "assigned-project")
            .put("businessDate", BusinessSupport.today())
            .put("currency", "USD")
            .put("consumption", "100")
            .put("payable", "90"));
    JsonNode page =
        json.readTree(
            mvc.perform(get("/api/supplier-bills/entries").session(session))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.total").value(1))
                .andReturn()
                .getResponse()
                .getContentAsString());
    assertFalse(page.toString().contains("payable"));
    assertFalse(page.toString().contains("different-member"));
    ObjectNode other =
        s.create(
            "settlement",
            foreign,
            s.object()
                .put("supplierId", foreign)
                .put("state", "CONFIRMED")
                .put("currency", "USD")
                .put("total", "999"));
    mvc.perform(get("/api/settlements/" + other.path("id").asText()).session(supplier.session))
        .andExpect(status().isNotFound());
    mvc.perform(get("/api/reports/overview?supplierId=" + foreign).session(supplier.session))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.summary.length()").value(0));
  }

  @Test
  void resourceAnalyticsRequireBothUsageAndResourceRead() throws Exception {
    Client operator = client("OPERATOR", null),
        finance = client("FINANCE", null),
        admin = client("ADMIN", null);
    for (String endpoint :
        List.of(
            "/api/reports/ccmax-resources",
            "/api/reports/ccmax-resources/current",
            "/api/reports/ccmax-resources/suppliers")) {
      mvc.perform(get(endpoint).session(operator.session)).andExpect(status().isForbidden());
      mvc.perform(get(endpoint).session(finance.session)).andExpect(status().isForbidden());
      mvc.perform(get(endpoint).session(admin.session)).andExpect(status().isOk());
    }
  }

  @Test
  void supplierHiddenAdjustmentsStayPrivateAndChangedAccountInvalidatesApproval() throws Exception {
    String owner = "guard-" + UUID.randomUUID(), other = "guard-other-" + UUID.randomUUID();
    s.create(
        "supplier",
        owner,
        s.object().put("id", owner).put("name", "Guard supplier").put("enabled", true));
    Client maker = client("FINANCE", null),
        checker = client("FINANCE", null),
        supplier = client("SUPPLIER", owner);
    ObjectNode st = statement(owner, "30");
    String sid = st.path("id").asText();
    ArrayNode adjustments = s.json.createArrayNode();
    adjustments.add(
        s.object()
            .put("note", "INTERNAL_ONLY_NOTE")
            .put("supplierVisible", false)
            .put("amount", "1"));
    adjustments.add(
        s.object().put("note", "VISIBLE_NOTE").put("supplierVisible", true).put("amount", "1"));
    ObjectNode patch = s.object();
    patch.set("adjustments", adjustments);
    s.update("settlement", sid, owner, patch);
    String detail =
        mvc.perform(get("/api/settlements/" + sid).session(supplier.session))
            .andExpect(status().isOk())
            .andReturn()
            .getResponse()
            .getContentAsString();
    assertFalse(detail.contains("INTERNAL_ONLY_NOTE"));
    assertTrue(detail.contains("VISIBLE_NOTE"));
    String financial =
        mvc.perform(get("/api/settlements/" + sid).session(maker.session))
            .andExpect(status().isOk())
            .andReturn()
            .getResponse()
            .getContentAsString();
    assertTrue(financial.contains("INTERNAL_ONLY_NOTE"));
    s.update(
        "settlement",
        sid,
        owner,
        s.object().put("state", "CONFIRMED").put("supplierConfirmed", true));
    ObjectNode foreign =
        s.create(
            "account",
            other,
            s.object().put("supplierId", other).put("state", "APPROVED").put("currency", "USD"));
    ObjectNode req =
        s.object()
            .put("settlementId", sid)
            .put("requestKey", UUID.randomUUID().toString())
            .put("payoutCurrency", "USD")
            .put("obligationAmount", "10")
            .put("accountId", foreign.path("id").asText());
    post("/api/payments/offline", req, maker, 404);
    ObjectNode account =
        s.create(
            "account",
            owner,
            s.object()
                .put("supplierId", owner)
                .put("state", "APPROVED")
                .put("currency", "USD")
                .put("holder", "Guard supplier"));
    String aid = account.path("id").asText();
    req.put("accountId", aid).put("requestKey", UUID.randomUUID().toString());
    ObjectNode payment = post("/api/payments/offline", req, maker, 200);
    String pid = payment.path("id").asText();
    s.update("account", aid, owner, s.object().put("holder", "Changed beneficiary"));
    post(
        "/api/payments/" + pid + "/review",
        s.object().put("approved", true).put("version", 0),
        checker,
        409);
    ObjectNode next =
        post(
            "/api/payments/offline",
            req.deepCopy().put("requestKey", UUID.randomUUID().toString()),
            maker,
            200);
    String nextId = next.path("id").asText();
    ObjectNode approved =
        post(
            "/api/payments/" + nextId + "/review",
            s.object().put("approved", true).put("version", 0),
            checker,
            200);
    s.update("account", aid, owner, s.object().put("state", "PENDING"));
    post(
        "/api/payments/" + nextId + "/offline-record",
        s.object().put("version", approved.path("version").asLong()),
        maker,
        409);
  }
}
