package com.hispread.ai;

import static org.junit.jupiter.api.Assertions.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;
import java.net.http.HttpTimeoutException;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.time.*;
import java.util.*;
import java.util.concurrent.atomic.*;
import org.junit.jupiter.api.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Primary;
import org.springframework.mock.web.MockHttpSession;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("integration-test")
class NativePaymentIntegrationTest {
  static final AtomicReference<String> REMOTE = new AtomicReference<>("TIMEOUT");
  static final AtomicReference<String> REQUEST_ID = new AtomicReference<>();
  static final AtomicInteger CREATES = new AtomicInteger();

  @TestConfiguration
  static class FixtureConfiguration {
    @Bean @Primary
    NativePaymentGateway fixtureNativePayments(Store s) {
      return new NativePaymentGateway(s, r -> {
        switch (r.uri().getPath()) {
          case "/api/v1/authentication/login":
            return new NativePaymentGateway.Reply(200, "{\"token\":\"fixture-auth-only\"}");
          case "/api/v1/beneficiaries/fixture-beneficiary":
            return new NativePaymentGateway.Reply(200, "{\"id\":\"fixture-beneficiary\",\"beneficiary\":{\"bank_details\":{\"account_number\":\"987654321\",\"account_name\":\"Native fixture company\",\"account_currency\":\"USD\"}}}");
          case "/api/v1/transfers/validate": return new NativePaymentGateway.Reply(200, "{}");
          case "/api/v1/transfers/create":
            CREATES.incrementAndGet();
            REQUEST_ID.set(s.parse(r.body()).path("request_id").asText());
            if (REMOTE.get().equals("TIMEOUT")) throw new HttpTimeoutException("fixture timeout after accepted intent");
            return new NativePaymentGateway.Reply(201, row(s).toString());
          case "/api/v1/transfers":
            return new NativePaymentGateway.Reply(200, s.object().set("items", s.json.createArrayNode().add(row(s))).toString());
          default: throw new AssertionError("Unexpected request: " + r.uri().getPath());
        }
      }, Clock.systemUTC());
    }
    static ObjectNode row(Store s) {
      return s.object().put("id", "fixture-native-operation").put("request_id", REQUEST_ID.get())
          .put("beneficiary_id", "fixture-beneficiary").put("transfer_currency", "USD").put("transfer_amount", "10")
          .put("short_reference_id", "fixture-native-ref").put("status", REMOTE.get())
          .put("fee_amount", "0").put("fee_currency", "USD");
    }
  }

  @Autowired Store s;
  @Autowired AuthService auth;
  @Autowired MockMvc mvc;
  @Autowired ObjectMapper json;
  String owner, uid;
  MockHttpSession session;
  String csrf;
  ObjectNode oldProvider;
  ObjectNode payment;

  @BeforeEach
  void setup() throws Exception {
    REMOTE.set("TIMEOUT"); CREATES.set(0); REQUEST_ID.set(null);
    owner = "native-fixture-" + UUID.randomUUID(); uid = UUID.randomUUID().toString();
    ObjectNode user = s.object().put("id", uid).put("username", "native_" + uid)
        .put("role", "ADMIN").putNull("supplierId").put("displayName", "Native admin")
        .put("mustChangePassword", false).put("onboardingRequired", false);
    user.set("permissions", auth.allPermissions()); auth.createUser(user, "NativePaymentTest@123");
    session = new MockHttpSession(); session.setAttribute("uid", uid); session.setAttribute("sv", 0L);
    csrf = json.readTree(mvc.perform(get("/api/auth/csrf").session(session)).andReturn().getResponse().getContentAsString()).path("token").asText();
    s.create("supplier", owner, s.object().put("id", owner).put("name", "Native fixture company").put("state", "APPROVED").put("enabled", true));
    ObjectNode account = s.create("account", owner, s.object().put("id", owner + "-account").put("supplierId", owner)
        .put("holder", "Native fixture company").put("currency", "USD").put("accountType", "BANK").put("lastFour", "4321").put("state", "APPROVED"));
    s.create("account-secret", owner, s.object().put("id", account.path("id").asText()).put("accountNumber", "987654321"));
    ObjectNode settlement = s.create("settlement", owner, s.object().put("id", owner + "-settlement")
        .put("supplierId", owner).put("currency", "USD").put("total", "10").put("paidAmount", "0").put("reservedAmount", "10"));
    account = s.get("account", account.path("id").asText(), owner);
    String hash = HexFormat.of().formatHex(MessageDigest.getInstance("SHA-256").digest(account.toString().getBytes(StandardCharsets.UTF_8)));
    payment = s.create("payment", owner, s.object().put("id", owner + "-payment").put("supplierId", owner)
        .put("settlementId", settlement.path("id").asText()).put("accountId", account.path("id").asText())
        .put("accountVersion", account.path("version").asLong()).put("accountSnapshotHash", hash)
        .put("createdBy", "fixture-maker").put("reviewedBy", "fixture-checker").put("state", "APPROVED")
        .put("paymentMethod", "CHANNEL").put("payoutCurrency", "USD").put("payoutAmount", "10")
        .put("obligationCurrency", "USD").put("obligationAmount", "10").put("fee", "0").put("requestKey", UUID.randomUUID().toString()));
    try { oldProvider = s.get("payout-provider", "AIRWALLEX", null); } catch (ApiException ignored) { oldProvider = null; }
    ObjectNode provider = s.object().put("id", "AIRWALLEX").put("code", "AIRWALLEX").put("enabled", true)
        .put("apiKey", "fixture-native-api-key").put("clientId", "fixture-native-client")
        .put("regionCode", "SANDBOX").put("apiVersion", "2025-06-30").put("transferReason", "professional_business_services");
    provider.putObject("executionAdapter").put("enabled", true).put("protocol", "NATIVE_AIRWALLEX").put("baseUrl", "");
    provider.putObject("beneficiaryMappings").putObject(account.path("id").asText()).put("accountVersion", 0).put("beneficiaryId", "fixture-beneficiary");
    if (oldProvider == null) s.create("payout-provider", "GLOBAL", provider);
    else s.update("payout-provider", "AIRWALLEX", null, provider);
  }

  ObjectNode action(String action, long version, int expected) throws Exception {
    ObjectNode body = s.object().put("version", version).put("provider", "AIRWALLEX");
    return (ObjectNode) json.readTree(mvc.perform(post("/api/payments/" + payment.path("id").asText() + "/" + action)
        .session(session).header("X-CSRF-TOKEN", csrf).contentType("application/json").content(body.toString()))
        .andExpect(status().is(expected)).andReturn().getResponse().getContentAsString());
  }

  @AfterEach
  void cleanup() {
    for (String kind : List.of("payout-call", "payment", "settlement", "account-secret", "account", "supplier"))
      s.jdbc.update("delete from hub_entity where kind=? and owner_id=?", kind, owner);
    s.jdbc.update("delete from hub_entity where kind='audit' and data->>'actor'=?", uid);
    s.jdbc.update("delete from hub_user where id=?", uid);
    if (oldProvider == null) s.jdbc.update("delete from hub_entity where kind='payout-provider' and id='AIRWALLEX'");
    else s.jdbc.update("update hub_entity set data=cast(? as jsonb),version=? where kind='payout-provider' and id='AIRWALLEX'", oldProvider.toString(), oldProvider.path("version").asLong());
  }

  @Test
  void durableNativeIntentTimeoutPaidAndLateReturnAreAppliedOnceInPostgres() throws Exception {
    ObjectNode preview = action("payout-preview", 0, 200);
    assertEquals("NATIVE_AIRWALLEX", preview.path("protocol").asText());
    assertTrue(preview.path("feeEstimateOnly").asBoolean()); assertEquals(0, CREATES.get());
    ObjectNode unknown = action("execute", 0, 200);
    assertEquals("UNKNOWN", unknown.path("state").asText());
    assertEquals(1, CREATES.get());
    ObjectNode operation = s.get("payout-call", payment.path("id").asText(), owner);
    assertEquals("NATIVE_AIRWALLEX", operation.path("protocol").asText());
    assertEquals(REQUEST_ID.get(), operation.path("executionContext").path("providerRequestId").asText());
    action("execute", 0, 200); assertEquals(1, CREATES.get());
    REMOTE.set("PAID");
    ObjectNode paid = action("reconcile", unknown.path("version").asLong(), 200);
    assertEquals("SUCCEEDED", paid.path("state").asText());
    assertEquals("NATIVE_PROVIDER", paid.path("verificationMode").asText());
    assertEquals("10", s.get("settlement", payment.path("settlementId").asText(), owner).path("paidAmount").asText());
    ObjectNode paidAgain = action("reconcile", paid.path("version").asLong(), 200);
    assertEquals("10", s.get("settlement", payment.path("settlementId").asText(), owner).path("paidAmount").asText());
    ObjectNode acknowledged = s.update("payment", payment.path("id").asText(), owner,
        s.object().put("receiptState", "CONFIRMED"));
    s.update("settlement", payment.path("settlementId").asText(), owner,
        s.object().put("receivedAmount", "10").put("paymentProgress", "PAID"));
    REMOTE.set("FAILED");
    ObjectNode returned = action("reconcile", acknowledged.path("version").asLong(), 200);
    assertEquals("FAILED", returned.path("state").asText()); assertTrue(returned.path("lateReturn").asBoolean());
    action("reconcile", returned.path("version").asLong(), 200);
    assertEquals("0", s.get("settlement", payment.path("settlementId").asText(), owner).path("paidAmount").asText());
    assertEquals("0", s.get("settlement", payment.path("settlementId").asText(), owner).path("reservedAmount").asText());
    assertEquals("0", s.get("settlement", payment.path("settlementId").asText(), owner).path("receivedAmount").asText());
    assertEquals("UNPAID", s.get("settlement", payment.path("settlementId").asText(), owner).path("paymentProgress").asText());
    assertEquals("DISPUTED", returned.path("receiptState").asText());
    assertTrue(s.get("payout-call", payment.path("id").asText(), owner).path("paidReversed").asBoolean());
    assertEquals(1, CREATES.get());
    String calls = mvc.perform(get("/api/payout-calls").session(session)).andExpect(status().isOk()).andReturn().getResponse().getContentAsString();
    for (String secret : List.of("fixture-native-api-key", "recipientHash", "adapterBinding", "executionContext", "987654321")) assertFalse(calls.contains(secret));
  }

  @Test
  void payerIdentityChangesBlockReconciliationOfAnUncertainSend() throws Exception {
    ObjectNode unknown = action("execute", 0, 200);
    s.update("payout-provider", "AIRWALLEX", null, s.object().put("loginAs", "different-account"));
    action("reconcile", unknown.path("version").asLong(), 409);
    assertEquals(1, CREATES.get());
    assertEquals("0", s.get("settlement", payment.path("settlementId").asText(), owner).path("paidAmount").asText());
  }
}
