package com.hispread.ai;

import static org.junit.jupiter.api.Assertions.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

import com.fasterxml.jackson.databind.*;
import com.fasterxml.jackson.databind.node.*;
import com.sun.net.httpserver.*;
import java.net.*;
import java.nio.charset.StandardCharsets;
import java.util.*;
import java.util.concurrent.atomic.*;
import org.junit.jupiter.api.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.mock.web.MockHttpSession;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

@SpringBootTest(properties = "app.payments.allow-private-adapters=true")
@AutoConfigureMockMvc
@ActiveProfiles("integration-test")
class PaymentExecutionIntegrationTest {
  @Autowired Store s;
  @Autowired AuthService a;
  @Autowired MockMvc mvc;
  @Autowired ObjectMapper json;
  @Autowired PaymentExecutionGateway gateway;
  HttpServer server;
  String base;
  String owner, uid;
  MockHttpSession session;
  String csrf;
  ObjectNode oldProvider;
  String providerId = "AIRWALLEX";
  AtomicInteger executes = new AtomicInteger(), reconciles = new AtomicInteger();
  AtomicReference<String> mode = new AtomicReference<>("SUCCEEDED");
  AtomicReference<ObjectNode> last = new AtomicReference<>();
  AtomicReference<String> authHeader = new AtomicReference<>();
  List<String> userIds = new ArrayList<>();

  @BeforeEach
  void init() throws Exception {
    owner = "execution-" + UUID.randomUUID();
    uid = UUID.randomUUID().toString();
    userIds.add(uid);
    ObjectNode user =
        s.object()
            .put("id", uid)
            .put("username", "execution_" + uid)
            .put("role", "ADMIN")
            .putNull("supplierId")
            .put("displayName", "Execution admin")
            .put("mustChangePassword", false)
            .put("onboardingRequired", false);
    user.set("permissions", a.allPermissions());
    a.createUser(user, "ExecutionTest@123");
    session = new MockHttpSession();
    session.setAttribute("uid", uid);
    session.setAttribute("sv", 0L);
    csrf =
        json.readTree(
                mvc.perform(get("/api/auth/csrf").session(session))
                    .andReturn()
                    .getResponse()
                    .getContentAsString())
            .path("token")
            .asText();
    s.create(
        "supplier",
        owner,
        s.object()
            .put("id", owner)
            .put("name", "Execution supplier")
            .put("state", "APPROVED")
            .put("enabled", true));
    server = HttpServer.create(new InetSocketAddress("127.0.0.1", 0), 0);
    server.createContext("/", this::handle);
    server.start();
    base = "http://127.0.0.1:" + server.getAddress().getPort();
    try {
      oldProvider = s.get("payout-provider", providerId, null);
    } catch (ApiException missing) {
    }
    ObjectNode provider =
        s.object().put("id", providerId).put("code", providerId).put("enabled", true);
    provider.set("executionAdapter", adapter());
    if (oldProvider == null) s.create("payout-provider", "GLOBAL", provider);
    else s.update("payout-provider", providerId, null, provider);
  }

  ObjectNode adapter() {
    return s.object()
        .put("enabled", true)
        .put("protocol", "HISPREAD_PAYOUT_V1")
        .put("baseUrl", base)
        .put("apiKey", "fixture-bridge-secret")
        .put("allowHttp", true)
        .put("timeoutMs", 1000);
  }

  void handle(HttpExchange exchange) throws java.io.IOException {
    ObjectNode request = (ObjectNode) json.readTree(exchange.getRequestBody().readAllBytes());
    last.set(request);
    authHeader.set(exchange.getRequestHeaders().getFirst("Authorization"));
    String action =
        exchange
            .getRequestURI()
            .getPath()
            .substring(exchange.getRequestURI().getPath().lastIndexOf('/') + 1);
    if (action.equals("execute")) executes.incrementAndGet();
    if (action.equals("reconcile")) reconciles.incrementAndGet();
    if (action.equals("execute") && mode.get().equals("TIMEOUT")) {
      try {
        Thread.sleep(1300);
      } catch (InterruptedException e) {
        Thread.currentThread().interrupt();
      }
    }
    if (action.equals("execute") && mode.get().equals("REJECT")) {
      byte[] bytes = "{\"error\":\"refused fixture\"}".getBytes(StandardCharsets.UTF_8);
      exchange.sendResponseHeaders(422, bytes.length);
      exchange.getResponseBody().write(bytes);
      exchange.close();
      return;
    }
    ObjectNode response =
        s.object()
            .put("localPaymentId", request.path("localPaymentId").asText())
            .put("requestKey", request.path("requestKey").asText())
            .put("currency", request.path("currency").asText("USD"))
            .put("amount", request.path("amount").asText("10"))
            .put("operationId", "fixture-operation")
            .put("externalRef", "fixture-reference")
            .put("secretKey", "must-not-leak");
    if (action.equals("preview")) response.put("executable", true).put("availableBalance", "100");
    else
      response.put(
          "state",
          mode.get().equals("MISMATCH")
              ? "SUCCEEDED"
              : action.equals("reconcile") ? "SUCCEEDED" : mode.get());
    if (mode.get().equals("MISMATCH")) response.put("amount", "999");
    byte[] bytes = response.toString().getBytes(StandardCharsets.UTF_8);
    try {
      exchange.sendResponseHeaders(200, bytes.length);
      exchange.getResponseBody().write(bytes);
    } finally {
      exchange.close();
    }
  }

  ObjectNode approved() throws Exception {
    ObjectNode account =
        s.create(
            "account",
            owner,
            s.object()
                .put("supplierId", owner)
                .put("state", "APPROVED")
                .put("currency", "USD")
                .put("holder", "Execution supplier")
                .put("lastFour", "1234"));
    s.create(
        "account-secret",
        owner,
        s.object()
            .put("id", account.path("id").asText())
            .put("accountNumber", "fixture-beneficiary-1234"));
    account = s.get("account", account.path("id").asText(), owner);
    String hash =
        java.util.HexFormat.of()
            .formatHex(
                java.security.MessageDigest.getInstance("SHA-256")
                    .digest(account.toString().getBytes(StandardCharsets.UTF_8)));
    ObjectNode settlement =
        s.create(
            "settlement",
            owner,
            s.object()
                .put("supplierId", owner)
                .put("state", "CONFIRMED")
                .put("supplierConfirmed", true)
                .put("currency", "USD")
                .put("total", "10")
                .put("paidAmount", "0")
                .put("reservedAmount", "10"));
    return s.create(
        "payment",
        owner,
        s.object()
            .put("supplierId", owner)
            .put("settlementId", settlement.path("id").asText())
            .put("accountId", account.path("id").asText())
            .put("accountVersion", account.path("version").asLong())
            .put("accountSnapshotHash", hash)
            .put("state", "APPROVED")
            .put("createdBy", "separate-maker")
            .put("reviewedBy", "separate-checker")
            .put("paymentMethod", "CHANNEL")
            .put("payoutCurrency", "USD")
            .put("payoutAmount", "10")
            .put("obligationCurrency", "USD")
            .put("obligationAmount", "10")
            .put("fee", "0")
            .put("requestKey", UUID.randomUUID().toString()));
  }

  ObjectNode post(String path, ObjectNode body, int status) throws Exception {
    return (ObjectNode)
        json.readTree(
            mvc.perform(
                    org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post(path)
                        .session(session)
                        .header("X-CSRF-TOKEN", csrf)
                        .contentType("application/json")
                        .content(body.toString()))
                .andExpect(status().is(status))
                .andReturn()
                .getResponse()
                .getContentAsString());
  }

  @AfterEach
  void cleanup() {
    if (server != null) server.stop(0);
    for (String kind :
        List.of("payout-call", "payment", "settlement", "account-secret", "account", "supplier"))
      s.jdbc.update("delete from hub_entity where kind=? and owner_id=?", kind, owner);
    s.jdbc.update("delete from hub_entity where kind='audit' and data->>'actor'=?", uid);
    for (String id : userIds) s.jdbc.update("delete from hub_user where id=?", id);
    if (oldProvider == null)
      s.jdbc.update("delete from hub_entity where kind='payout-provider' and id=?", providerId);
    else
      s.jdbc.update(
          "update hub_entity set data=cast(? as jsonb),version=? where kind='payout-provider' and"
              + " id=?",
          oldProvider.toString(),
          oldProvider.path("version").asLong(),
          providerId);
  }

  @Test
  void configuredBridgePreviewsExecutesOnceAndReconcileNeverDoubleAddsPaid() throws Exception {
    ObjectNode p = approved();
    String id = p.path("id").asText(), sid = p.path("settlementId").asText();
    ObjectNode body = s.object().put("provider", "AIRWALLEX").put("version", 0);
    ObjectNode preview = post("/api/payments/" + id + "/payout-preview", body, 200);
    assertTrue(preview.path("executable").asBoolean());
    assertFalse(preview.toString().contains("must-not-leak"));
    ObjectNode done = post("/api/payments/" + id + "/execute", body, 200);
    assertEquals("SUCCEEDED", done.path("state").asText());
    assertEquals("10", s.get("settlement", sid, owner).path("paidAmount").asText());
    assertEquals("Bearer fixture-bridge-secret", authHeader.get());
    assertEquals(
        "fixture-beneficiary-1234", last.get().path("recipient").path("accountNumber").asText());
    assertFalse(done.toString().contains("fixture-beneficiary"));
    post("/api/payments/" + id + "/execute", body, 200);
    post(
        "/api/payments/" + id + "/reconcile",
        s.object().put("version", done.path("version").asLong()),
        200);
    assertEquals(1, executes.get());
    assertEquals("10", s.get("settlement", sid, owner).path("paidAmount").asText());
  }

  @Test
  void timeoutPersistsUnknownAndReconcilesOriginalOperation() throws Exception {
    mode.set("TIMEOUT");
    ObjectNode p = approved();
    String id = p.path("id").asText(), sid = p.path("settlementId").asText();
    ObjectNode unknown =
        post(
            "/api/payments/" + id + "/execute",
            s.object().put("provider", "AIRWALLEX").put("version", 0),
            200);
    assertEquals("UNKNOWN", unknown.path("state").asText());
    assertEquals("10", s.get("settlement", sid, owner).path("reservedAmount").asText());
    assertEquals("0", s.get("settlement", sid, owner).path("paidAmount").asText());
    mode.set("SUCCEEDED");
    ObjectNode done =
        post(
            "/api/payments/" + id + "/reconcile",
            s.object().put("version", unknown.path("version").asLong()),
            200);
    assertEquals("SUCCEEDED", done.path("state").asText());
    assertEquals(1, executes.get());
    assertEquals(1, reconciles.get());
    assertEquals("10", s.get("settlement", sid, owner).path("paidAmount").asText());
  }

  @Test
  void definiteRejectionFailsAndReleasesOnlyItsReservation() throws Exception {
    mode.set("REJECT");
    ObjectNode p = approved();
    String id = p.path("id").asText(), sid = p.path("settlementId").asText();
    ObjectNode failed =
        post(
            "/api/payments/" + id + "/execute",
            s.object().put("provider", "AIRWALLEX").put("version", 0),
            200);
    assertEquals("FAILED", failed.path("state").asText());
    assertEquals("0", s.get("settlement", sid, owner).path("reservedAmount").asText());
    assertEquals("0", s.get("settlement", sid, owner).path("paidAmount").asText());
    post(
        "/api/payments/" + id + "/execute",
        s.object().put("provider", "AIRWALLEX").put("version", 0),
        200);
    assertEquals(1, executes.get());
  }

  @Test
  void mismatchedSuccessStaysUnknownAndMissingConfigOrSelfReviewNeverSends() throws Exception {
    ObjectNode p = approved();
    String id = p.path("id").asText();
    s.update("payment", id, owner, s.object().put("reviewedBy", "separate-maker"));
    post(
        "/api/payments/" + id + "/execute",
        s.object().put("provider", "AIRWALLEX").put("version", 1),
        403);
    assertEquals(0, executes.get());
    s.update("payment", id, owner, s.object().put("reviewedBy", "separate-checker"));
    ObjectNode disabled = s.object();
    disabled.set("executionAdapter", adapter().put("enabled", false));
    s.update("payout-provider", "AIRWALLEX", null, disabled);
    post(
        "/api/payments/" + id + "/execute",
        s.object().put("provider", "AIRWALLEX").put("version", 2),
        503);
    assertEquals(0, executes.get());
    ObjectNode enabled = s.object();
    enabled.set("executionAdapter", adapter());
    s.update("payout-provider", "AIRWALLEX", null, enabled);
    mode.set("MISMATCH");
    ObjectNode unknown =
        post(
            "/api/payments/" + id + "/execute",
            s.object().put("provider", "AIRWALLEX").put("version", 2),
            200);
    assertEquals("UNKNOWN", unknown.path("state").asText());
    assertEquals(
        "0",
        s.get("settlement", p.path("settlementId").asText(), owner).path("paidAmount").asText());
  }

  @Test
  void productionValidationBlocksHttpPrivateAndRedirectDestinations() {
    PaymentExecutionGateway production =
        new PaymentExecutionGateway(s, new org.springframework.mock.env.MockEnvironment());
    assertEquals(
        400, assertThrows(ApiException.class, () -> production.validateAdapter(adapter())).status);
    assertEquals(
        400,
        assertThrows(
                ApiException.class,
                () ->
                    production.validateAdapter(
                        adapter().put("allowHttp", false).put("baseUrl", "https://127.0.0.1")))
            .status);
    assertEquals(
        400,
        assertThrows(
                ApiException.class,
                () ->
                    production.validateAdapter(
                        adapter()
                            .put("allowHttp", false)
                            .put("baseUrl", "https://user:pass@example.com")))
            .status);
  }
}
