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
class SupplierBusinessIntegrationTest {
  @Autowired MockMvc mvc;
  @Autowired Store store;
  @Autowired AuthService auth;
  @Autowired ObjectMapper json;

  record Client(MockHttpSession session, String owner, String uid, String csrf) {}

  Client client() throws Exception {
    String uid = UUID.randomUUID().toString(), owner = "test-" + UUID.randomUUID();
    ObjectNode profile =
        store
            .object()
            .put("id", uid)
            .put("supplierId", owner)
            .put("username", "business_" + uid)
            .put("displayName", "Test supplier")
            .put("role", "SUPPLIER")
            .put("mustChangePassword", false)
            .put("onboardingRequired", false)
            .put("version", 0);
    profile.set("permissions", auth.supplierPermissions());
    auth.createUser(profile, "Strong@Password1");
    store.create(
        "supplier",
        owner,
        store
            .object()
            .put("id", owner)
            .put("supplierId", owner)
            .put("name", "Test supplier")
            .put("state", "APPROVED")
            .put("enabled", true));
    MockHttpSession session = new MockHttpSession();
    session.setAttribute("uid", uid);
    session.setAttribute("sv", 0L);
    var result =
        mvc.perform(get("/api/auth/csrf").session(session)).andExpect(status().isOk()).andReturn();
    return new Client(
        session,
        owner,
        uid,
        json.readTree(result.getResponse().getContentAsString()).path("token").asText());
  }

  ObjectNode postJson(String url, ObjectNode body, Client c, int expected) throws Exception {
    var response =
        mvc.perform(
                post(url)
                    .session(c.session)
                    .header("X-CSRF-TOKEN", c.csrf)
                    .contentType("application/json")
                    .content(body.toString()))
            .andExpect(status().is(expected))
            .andReturn();
    return (ObjectNode) json.readTree(response.getResponse().getContentAsString());
  }

  ObjectNode project() {
    ObjectNode p =
        store
            .object()
            .put("name", "Test quote project")
            .put("code", "TEST")
            .put("category", "OTHER")
            .put("categoryName", "Test")
            .put("enabled", true)
            .put("settlementMethod", "QUOTA")
            .put("deliveryMethod", "KEY")
            .put("capacityType", "ACCOUNT_COUNT")
            .put("unit", "个");
    return store.create("project", "GLOBAL", p);
  }

  @Test
  void quotesStayPendingAndAreTenantScoped() throws Exception {
    Client c = client(), other = client();
    ObjectNode p = project();
    ObjectNode input =
        store
            .object()
            .put("projectId", p.path("id").asText())
            .put("effectiveFrom", BusinessSupport.today())
            .put("effectiveTo", BusinessSupport.today())
            .put("currency", "USD")
            .put("multiplier", "0.27")
            .put("accountCount", "50")
            .put("taxInclusive", true);
    ObjectNode quote = postJson("/api/quotes", input, c, 200);
    assertEquals("PENDING", quote.path("state").asText());
    assertEquals("0.27", quote.path("multiplier").asText());
    String id = quote.path("id").asText();
    mvc.perform(get("/api/quotes/" + id).session(other.session)).andExpect(status().isNotFound());
    mvc.perform(
            put("/api/quotes/" + id)
                .session(c.session)
                .header("X-CSRF-TOKEN", c.csrf)
                .contentType("application/json")
                .content(
                    input
                        .deepCopy()
                        .put("version", 0)
                        .put("serviceCapacityNote", "changed")
                        .toString()))
        .andExpect(status().isOk());
    mvc.perform(
            put("/api/quotes/" + id)
                .session(c.session)
                .header("X-CSRF-TOKEN", c.csrf)
                .contentType("application/json")
                .content(input.deepCopy().put("version", 0).toString()))
        .andExpect(status().isConflict());
    postJson("/api/quotes/" + id + "/withdraw", store.object(), c, 200);
    assertEquals("WITHDRAWN", store.get("quote", id, c.owner).path("state").asText());
    input.put("multiplier", "1.01");
    postJson("/api/quotes", input, c, 400);
  }

  @Test
  void intakeMaterialPersistsIdempotentlyAndIsNotDispatched() throws Exception {
    Client c = client();
    ObjectNode request = store.object().put("mode", "single").put("multi_key_mode", "random");
    request.set(
        "channel",
        store
            .object()
            .put("type", 1)
            .put("key", "local-test-key")
            .put("name", "Local intake")
            .put("models", "test-model")
            .put("base_url", "https://example.invalid"));
    ObjectNode recognition =
        postJson(
            "/api/resource-intakes/recognize",
            store.object().put("text", request.toString()),
            c,
            200);
    assertTrue(recognition.path("recognized").asBoolean());
    assertEquals(
        1,
        postJson("/api/resource-intakes/preview", request, c, 200).path("resourceCount").asInt());
    ObjectNode body = store.object().put("requestKey", UUID.randomUUID().toString());
    body.set("request", request);
    ObjectNode first = postJson("/api/resource-intakes", body, c, 200),
        again = postJson("/api/resource-intakes", body, c, 200);
    assertEquals(first.path("resourceIds"), again.path("resourceIds"));
    String id = first.path("resourceIds").get(0).asText();
    assertEquals(1, store.list("intake", c.owner).size());
    var result =
        mvc.perform(get("/api/deliveries?assignment=UNASSIGNED").session(c.session))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.total").value(1))
            .andExpect(jsonPath("$.items[0].material").doesNotExist())
            .andExpect(jsonPath("$.items[0].originalRequest").doesNotExist())
            .andExpect(jsonPath("$.items[0].dispatchState").value("NOT_SUBMITTED"))
            .andReturn();
    postJson("/api/resources/supplier-submit", store.object(), c, 400);
    assertTrue(store.list("resource", c.owner).isEmpty());
  }

  @Test
  void teamCreationGrantsOnlyScopedMemberCapabilities() throws Exception {
    Client c = client();
    ObjectNode created =
        postJson(
            "/api/supplier-agents",
            store
                .object()
                .put("username", "member_" + UUID.randomUUID())
                .put("displayName", "Member")
                .put("password", ""),
            c,
            200);
    String id = created.path("id").asText();
    ObjectNode profile = auth.findUser(id);
    assertEquals(c.owner, profile.path("supplierId").asText());
    assertEquals("SUPPLIER_AGENT", profile.path("role").asText());
    assertFalse(profile.path("permissions").toString().contains("quote.write"));
    assertFalse(profile.path("permissions").toString().contains("payment.receipt"));
    ObjectNode group = store.list("group", c.owner).get(0);
    assertTrue(group.path("memberIds").toString().contains(id));
    assertFalse(created.path("initialPassword").asText().isBlank());
    var csrfResult = mvc.perform(get("/api/auth/csrf")).andReturn();
    MockHttpSession memberSession = (MockHttpSession) csrfResult.getRequest().getSession();
    String token =
        json.readTree(csrfResult.getResponse().getContentAsString()).path("token").asText();
    mvc.perform(
            post("/api/auth/login")
                .session(memberSession)
                .header("X-CSRF-TOKEN", token)
                .contentType("application/x-www-form-urlencoded")
                .param("username", created.path("username").asText())
                .param("password", created.path("initialPassword").asText()))
        .andExpect(status().isOk());
    mvc.perform(get("/api/quotes").session(memberSession)).andExpect(status().isForbidden());
    mvc.perform(get("/api/supplier-bills/filters").session(memberSession))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.departments").isEmpty());
    mvc.perform(get("/api/supplier-bills/departments").session(memberSession))
        .andExpect(status().isForbidden());
    ObjectNode groupPatch =
        group.deepCopy().put("name", "Renamed department").put("adminUserId", id);
    mvc.perform(
            put("/api/supplier-team-groups/" + group.path("id").asText())
                .session(c.session)
                .header("X-CSRF-TOKEN", c.csrf)
                .contentType("application/json")
                .content(groupPatch.toString()))
        .andExpect(status().isOk());
    assertEquals(
        group.path("id").asText(), auth.findUser(id).path("teamAdminGroup").path("id").asText());
    Client other = client();
    mvc.perform(get("/api/supplier-agents/" + id + "/projects").session(other.session))
        .andExpect(status().isNotFound());
  }

  @Test
  void receiptOnlyUpdatesExistingSucceededPayment() throws Exception {
    Client c = client();
    ObjectNode settlement =
        store.create(
            "settlement",
            c.owner,
            store
                .object()
                .put("supplierId", c.owner)
                .put("state", "CONFIRMED")
                .put("currency", "USD")
                .put("total", "10")
                .put("receivedAmount", "0"));
    ObjectNode payment =
        store.create(
            "payment",
            c.owner,
            store
                .object()
                .put("settlementId", settlement.path("id").asText())
                .put("state", "PENDING")
                .put("obligationAmount", "10")
                .put("receiptState", "PENDING"));
    String id = payment.path("id").asText();
    postJson("/api/payments/" + id + "/receipt", store.object().put("confirmed", true), c, 409);
    store.update("payment", id, c.owner, store.object().put("state", "SUCCEEDED"));
    postJson("/api/payments/" + id + "/receipt", store.object().put("confirmed", true), c, 200);
    assertEquals(
        "10",
        store
            .get("settlement", settlement.path("id").asText(), c.owner)
            .path("receivedAmount")
            .asText());
    postJson("/api/payments/" + id + "/receipt", store.object().put("confirmed", true), c, 409);
  }

  @Test
  void settlementConfirmationChecksStateVersionAndTenant() throws Exception {
    Client c = client(), other = client();
    ObjectNode statement =
        store.create(
            "settlement",
            c.owner,
            store
                .object()
                .put("supplierId", c.owner)
                .put("state", "PENDING")
                .put("total", "10")
                .put("currency", "USD")
                .put("confirmationDeadline", java.time.Instant.now().plusSeconds(3600).toString()));
    String id = statement.path("id").asText();
    postJson(
        "/api/settlements/" + id + "/confirm",
        store.object().put("approved", true).put("version", 0),
        other,
        404);
    postJson(
        "/api/settlements/" + id + "/confirm",
        store.object().put("approved", true).put("version", 8),
        c,
        409);
    ObjectNode confirmed =
        postJson(
            "/api/settlements/" + id + "/confirm",
            store.object().put("approved", true).put("version", 0),
            c,
            200);
    assertEquals("CONFIRMED", confirmed.path("state").asText());
    postJson(
        "/api/settlements/" + id + "/confirm",
        store.object().put("approved", true).put("version", 1),
        c,
        409);
  }

  @Test
  void adminCanReviewSupplierQuoteAndFilteringPreservesTenantScope() throws Exception {
    Client supplier = client();
    ObjectNode p = project();
    ObjectNode input =
        store
            .object()
            .put("projectId", p.path("id").asText())
            .put("effectiveFrom", BusinessSupport.today())
            .put("effectiveTo", BusinessSupport.today())
            .put("currency", "USD")
            .put("multiplier", "0.27")
            .put("accountCount", "50");
    ObjectNode quote = postJson("/api/quotes", input, supplier, 200);
    Client admin = client();
    ObjectNode profile = auth.findUser(admin.uid);
    profile.put("role", "ADMIN");
    profile.putNull("supplierId");
    ArrayNode permissions = (ArrayNode) profile.path("permissions");
    permissions.add("quote.review");
    auth.saveUser(profile);
    mvc.perform(get("/api/quotes/" + quote.path("id").asText()).session(admin.session))
        .andExpect(status().isOk());
    ObjectNode reviewed =
        postJson(
            "/api/quotes/" + quote.path("id").asText() + "/review",
            store.object().put("approved", true),
            admin,
            200);
    assertEquals("APPROVED", reviewed.path("state").asText());
    mvc.perform(get("/api/resources/eligible-projects").session(supplier.session))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$[0].id").value(p.path("id").asText()));
    assertTrue(
        store.list("audit", null).stream()
            .anyMatch(x -> x.path("entityId").asText().equals(quote.path("id").asText())));
  }

  @Test
  void projectAssignmentResponseDoesNotRevealCredentialMaterial() throws Exception {
    Client c = client();
    ObjectNode profile = auth.findUser(c.uid);
    ArrayNode permissions = store.json.createArrayNode();
    permissions.add("resource.read").add("resource.intake.manage");
    profile.set("permissions", permissions);
    auth.saveUser(profile);
    ObjectNode project = project();
    ObjectNode typePatch = store.object();
    typePatch.putArray("supportedIntakeTypes").add(1);
    store.update("project", project.path("id").asText(), "GLOBAL", typePatch);
    store.create(
        "quote",
        c.owner,
        store
            .object()
            .put("projectId", project.path("id").asText())
            .put("supplierId", c.owner)
            .put("state", "APPROVED")
            .put("effectiveFrom", BusinessSupport.today())
            .put("effectiveTo", BusinessSupport.today())
            .put("multiplier", "0.27"));
    ObjectNode intake =
        store
            .object()
            .put("supplierId", c.owner)
            .put("resourceType", "NEWAPI_INTAKE")
            .put("channelType", 1)
            .put("assignmentState", "UNASSIGNED");
    intake.set("material", store.object().put("key", "private-test-secret"));
    intake.set("originalRequest", store.object().put("key", "private-test-secret"));
    ObjectNode stored = store.create("intake", c.owner, intake);
    var eligible =
        mvc.perform(
                get("/api/resource-intakes/" + stored.path("id").asText() + "/eligible-projects")
                    .session(c.session))
            .andExpect(status().isOk())
            .andReturn();
    String quoteToken =
        json.readTree(eligible.getResponse().getContentAsString())
            .get(0)
            .path("quoteToken")
            .asText();
    ObjectNode assigned =
        postJson(
            "/api/resource-intakes/" + stored.path("id").asText() + "/assign-project",
            store
                .object()
                .put("projectId", project.path("id").asText())
                .put("quoteToken", quoteToken)
                .put("version", 0),
            c,
            200);
    assertFalse(assigned.has("material"));
    assertFalse(assigned.has("originalRequest"));
    assertFalse(assigned.toString().contains("private-test-secret"));
    assertTrue(store.get("intake", stored.path("id").asText(), c.owner).has("material"));
  }

  @Test
  void scheduledPriceIsDerivedAtReadTimeAfterEffectiveDate() throws Exception {
    Client c = client();
    ObjectNode p = project(),
        quote =
            store
                .object()
                .put("projectId", p.path("id").asText())
                .put("state", "APPROVED")
                .put("pricingType", "DISCOUNT")
                .put("multiplier", "0.27")
                .put("effectiveFrom", BusinessSupport.today())
                .put("effectiveTo", BusinessSupport.today());
    quote
        .putArray("priceHistory")
        .add(
            store
                .object()
                .put("effectiveAt", java.time.Instant.now().minusSeconds(60).toString())
                .put("multiplier", "0.25"));
    quote.put("supplierId", c.owner);
    ObjectNode saved = store.create("quote", c.owner, quote);
    mvc.perform(get("/api/quotes/" + saved.path("id").asText()).session(c.session))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.multiplier").value("0.25"));
    mvc.perform(get("/api/resources/eligible-projects").session(c.session))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$[0].quoteBasis.multiplier").value("0.25"));
  }

  @Test
  void intakeKeyRejectsChangedPayloadButIgnoresJsonFieldOrdering() throws Exception {
    Client c = client();
    ObjectNode request = store.object().put("mode", "single").put("multi_key_mode", "random");
    request.set("channel", store.object().put("type", 1).put("key", "one-key").put("name", "Test"));
    ObjectNode body =
        store
            .object()
            .put("requestKey", UUID.randomUUID().toString())
            .put("name", "Local submission");
    body.set("request", request);
    ObjectNode first = postJson("/api/resource-intakes", body, c, 200);
    ObjectNode reordered = store.object().put("multi_key_mode", "random");
    reordered.set(
        "channel", store.object().put("name", "Test").put("key", "one-key").put("type", 1));
    reordered.put("mode", "single");
    body.set("request", reordered);
    assertEquals(
        first.path("resourceIds"),
        postJson("/api/resource-intakes", body, c, 200).path("resourceIds"));
    ((ObjectNode) reordered.path("channel")).put("key", "different-key");
    postJson("/api/resource-intakes", body, c, 409);
    assertEquals(1, store.list("intake", c.owner).size());
  }

  @Test
  void adminAssignmentUsesIntakeTenantAndConfiguredChannelTypes() throws Exception {
    Client a = client(), other = client(), admin = client();
    ObjectNode ap = auth.findUser(admin.uid);
    ap.put("role", "ADMIN").putNull("supplierId");
    auth.saveUser(ap);
    ObjectNode project = project();
    String pid = project.path("id").asText();
    for (Client tenant : List.of(a, other))
      store.create(
          "quote",
          tenant.owner,
          store
              .object()
              .put("projectId", pid)
              .put("supplierId", tenant.owner)
              .put("state", "APPROVED")
              .put("effectiveFrom", BusinessSupport.today())
              .put("effectiveTo", BusinessSupport.today())
              .put("multiplier", tenant == a ? "0.27" : "0.50"));
    ObjectNode old =
        store.create(
            "intake",
            a.owner,
            store
                .object()
                .put("supplierId", a.owner)
                .put("resourceType", "NEWAPI_INTAKE")
                .put("assignmentState", "UNASSIGNED")
                .put("channelType", 14));
    String iid = old.path("id").asText();
    mvc.perform(
            put("/api/projects/" + pid + "/intake-channel-types")
                .session(admin.session)
                .header("X-CSRF-TOKEN", admin.csrf)
                .contentType("application/json")
                .content("[1]"))
        .andExpect(status().isForbidden());
    ArrayNode permissions = (ArrayNode) ap.path("permissions");
    permissions.add("project.write");
    auth.saveUser(ap);
    mvc.perform(
            put("/api/projects/" + pid + "/intake-channel-types")
                .session(admin.session)
                .header("X-CSRF-TOKEN", admin.csrf)
                .contentType("application/json")
                .content("[1]"))
        .andExpect(status().isOk());
    mvc.perform(
            get("/api/resource-intakes/" + iid + "/eligible-projects?supplierId=" + other.owner)
                .session(admin.session))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$").isEmpty());
    postJson(
        "/api/resource-intakes/" + iid + "/assign-project",
        store.object().put("projectId", pid).put("version", 0).put("quoteToken", "bad"),
        admin,
        409);
    mvc.perform(
            put("/api/projects/" + pid + "/intake-channel-types")
                .session(admin.session)
                .header("X-CSRF-TOKEN", admin.csrf)
                .contentType("application/json")
                .content("[14]"))
        .andExpect(status().isOk());
    var choices =
        mvc.perform(
                get("/api/resource-intakes/" + iid + "/eligible-projects?supplierId=" + other.owner)
                    .session(admin.session))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$[0].quoteBasis.supplierId").value(a.owner))
            .andReturn();
    String token =
        json.readTree(choices.getResponse().getContentAsString())
            .get(0)
            .path("quoteToken")
            .asText();
    ObjectNode assigned =
        postJson(
            "/api/resource-intakes/" + iid + "/assign-project?supplierId=" + other.owner,
            store.object().put("projectId", pid).put("version", 0).put("quoteToken", token),
            admin,
            200);
    assertEquals(a.owner, assigned.path("supplierId").asText());
    assertEquals(a.owner, assigned.path("quoteBasis").path("supplierId").asText());
    assertEquals("0.27", assigned.path("quoteBasis").path("multiplier").asText());
  }
}
