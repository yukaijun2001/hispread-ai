package com.hispread.ai;

import static org.junit.jupiter.api.Assertions.*;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;
import java.net.URI;
import java.net.http.HttpTimeoutException;
import java.nio.charset.StandardCharsets;
import java.time.*;
import java.util.*;
import java.util.concurrent.atomic.*;
import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import org.junit.jupiter.api.Test;

class NativePaymentGatewayTest {
  final Store s = new Store(null, new ObjectMapper());
  final Clock clock = Clock.fixed(Instant.parse("2026-11-09T10:00:00Z"), ZoneOffset.UTC);
  final String key = "original-intent-request-key";

  ObjectNode config(String protocol) {
    return s.object().put("enabled", true).put("protocol", protocol).put("apiKey", "fixture-key")
        .put("secretKey", "fixture-secret").put("clientId", "fixture-client")
        .put("passphrase", "fixture-passphrase").put("regionCode", "GLOBAL")
        .put("transferReason", "professional_business_services").put("transferMethod", "LOCAL")
        .put("apiVersion", "2025-06-30").put("sourceWallet", "SPOT");
  }

  ObjectNode payload(String type) {
    ObjectNode p = s.object().put("localPaymentId", "payment-1").put("requestKey", key)
        .put("currency", type.equals("BANK") ? "USD" : "USDT").put("amount", "10")
        .put("fee", "0").put("accountVersion", 2);
    p.set("recipient", s.object().put("id", "account-1").put("accountType", type)
        .put("accountNumber", type.equals("BANK") ? "12345678" : "TFixtureWallet")
        .put("holder", "Fixture Company").put("network", "TRC20")
        .put("transferType", "ONCHAIN").put("walletType", "PRIVATE"));
    return p;
  }

  ObjectNode context(NativePaymentGateway gateway, ObjectNode c, ObjectNode p) {
    p.put("protocol", c.path("protocol").asText());
    ObjectNode ctx = gateway.context(c, p);
    p.set("executionContext", ctx);
    return ctx;
  }

  ObjectNode reconcile(ObjectNode p) {
    ObjectNode out = p.deepCopy();
    out.remove("recipient");
    return out;
  }

  NativePaymentGateway.Reply reply(String body) { return new NativePaymentGateway.Reply(200, body); }

  @Test
  void airwallexValidatesApprovedBeneficiaryAndUsesOneCreateThenQueriesOriginalIdentity() {
    ObjectNode c = config("NATIVE_AIRWALLEX"), p = payload("BANK");
    c.putObject("beneficiaryMappings").putObject("account-1").put("accountVersion", 2).put("beneficiaryId", "beneficiary-1");
    AtomicInteger creates = new AtomicInteger();
    List<NativePaymentGateway.Request> calls = new ArrayList<>();
    AtomicReference<String> remote = new AtomicReference<>("SCHEDULED");
    NativePaymentGateway gateway = new NativePaymentGateway(s, r -> {
      calls.add(r);
      switch (r.uri().getPath()) {
        case "/api/v1/authentication/login":
          assertEquals("fixture-client", r.headers().get("x-client-id"));
          return reply("{\"token\":\"fixture-token\"}");
        case "/api/v1/beneficiaries/beneficiary-1":
          assertEquals("Bearer fixture-token", r.headers().get("Authorization"));
          return reply("{\"id\":\"beneficiary-1\",\"beneficiary\":{\"bank_details\":{\"account_number\":\"12345678\",\"account_name\":\"Fixture Company\",\"account_currency\":\"USD\"}}}");
        case "/api/v1/transfers/validate": return reply("{}");
        case "/api/v1/transfers/create":
          creates.incrementAndGet();
          assertEquals("2025-06-30", r.headers().get("x-api-version"));
          ObjectNode body = s.parse(r.body());
          assertEquals("PAYER", body.path("fee_paid_by").asText());
          assertEquals("USD", body.path("source_currency").asText());
          return reply(airwallexRow(remote.get()));
        case "/api/v1/transfers":
          assertEquals("request_id=" + NativePaymentGateway.providerRequestId("payment-1", key) + "&page_size=2", r.uri().getRawQuery());
          return reply("{\"items\":[" + airwallexRow(remote.get()) + "]}");
        default: throw new AssertionError("unexpected API");
      }
    }, clock);
    context(gateway, c, p);
    ObjectNode preview = gateway.exchange(c, "payment-1", "preview", p, key);
    assertTrue(preview.path("executable").asBoolean());
    assertEquals(0, creates.get());
    assertEquals("PROCESSING", gateway.exchange(c, "payment-1", "execute", p, key).path("state").asText());
    remote.set("PAID");
    ObjectNode paid = gateway.exchange(c, "payment-1", "reconcile", reconcile(p), key);
    assertEquals("SUCCEEDED", paid.path("state").asText());
    assertEquals("PROVISIONAL", paid.path("providerFinality").asText());
    remote.set("FAILED");
    assertEquals("FAILED", gateway.exchange(c, "payment-1", "reconcile", reconcile(p), key).path("state").asText());
    assertEquals(1, creates.get());
    assertFalse(paid.toString().contains("fixture-token"));
    assertFalse(paid.toString().contains("12345678"));
    assertTrue(calls.stream().allMatch(r -> r.uri().getHost().equals("api.airwallex.com")));
  }

  String airwallexRow(String state) {
    return s.object().put("id", "remote-aw-1").put("request_id", NativePaymentGateway.providerRequestId("payment-1", key))
        .put("beneficiary_id", "beneficiary-1").put("transfer_currency", "USD").put("transfer_amount", "10")
        .put("short_reference_id", "aw-ref-1").put("status", state).toString();
  }

  @Test
  void okxSignsExactPathAndBodyAndMapsUidWithdrawalAndHistory() throws Exception {
    ObjectNode c = config("NATIVE_OKX"), p = payload("OKX_USDT");
    ((ObjectNode) p.path("recipient")).put("transferType", "INTERNAL_UID").put("accountNumber", "123456");
    List<NativePaymentGateway.Request> calls = new ArrayList<>();
    NativePaymentGateway gateway = new NativePaymentGateway(s, r -> {
      calls.add(r);
      String path = r.uri().getRawPath() + (r.uri().getRawQuery() == null ? "" : "?" + r.uri().getRawQuery());
      String timestamp = r.headers().get("OK-ACCESS-TIMESTAMP");
      assertEquals("2026-11-09T10:00:00.000Z", timestamp);
      assertEquals(Base64.getEncoder().encodeToString(hmac("fixture-secret", timestamp + r.method() + path + r.body())), r.headers().get("OK-ACCESS-SIGN"));
      if (r.uri().getPath().endsWith("balances")) return reply("{\"code\":\"0\",\"data\":[{\"ccy\":\"USDT\",\"availBal\":\"50\"}]}");
      if (r.uri().getPath().endsWith("withdrawal-history"))
        return reply("{\"code\":\"0\",\"data\":[{\"ccy\":\"USDT\",\"amt\":\"10\",\"to\":\"123456\",\"clientId\":\"" + NativePaymentGateway.providerRequestId("payment-1", key) + "\",\"wdId\":\"okx-1\",\"state\":\"2\"}]}");
      ObjectNode body = s.parse(r.body());
      assertEquals("3", body.path("dest").asText());
      assertEquals("2", body.path("toAddrType").asText());
      assertFalse(body.has("chain"));
      return reply("{\"code\":\"0\",\"data\":[{\"ccy\":\"USDT\",\"amt\":\"10\",\"wdId\":\"okx-1\",\"clientId\":\"" + NativePaymentGateway.providerRequestId("payment-1", key) + "\"}]}");
    }, clock);
    context(gateway, c, p);
    assertTrue(gateway.exchange(c, "payment-1", "preview", p, key).path("executable").asBoolean());
    assertEquals("PROCESSING", gateway.exchange(c, "payment-1", "execute", p, key).path("state").asText());
    assertEquals("SUCCEEDED", gateway.exchange(c, "payment-1", "reconcile", reconcile(p), key).path("state").asText());
    assertEquals(1, calls.stream().filter(r -> r.method().equals("POST")).count());
  }

  @Test
  void okxNetworkFeeChangeAndUnmappedChainFailBeforeWithdrawal() {
    ObjectNode c = config("NATIVE_OKX"), p = payload("OKX_USDT");
    c.putObject("networkMappings").put("TRC20", "USDT-TRC20");
    AtomicInteger writes = new AtomicInteger();
    NativePaymentGateway gateway = new NativePaymentGateway(s, r -> {
      if (r.method().equals("POST")) writes.incrementAndGet();
      return reply("{\"code\":\"0\",\"data\":[{\"chain\":\"USDT-TRC20\",\"canWd\":true,\"minWd\":\"1\",\"maxWd\":\"1000\",\"wdTickSz\":\"6\",\"fee\":\"1\"}]}");
    }, clock);
    context(gateway, c, p);
    assertEquals("PAYMENT_ADAPTER_REJECTED", assertThrows(ApiException.class, () -> gateway.exchange(c, "payment-1", "execute", p, key)).code);
    assertEquals(0, writes.get());
    p.put("fee", "1");
    c.putObject("networkMappings").put("TRC20", "USDT-WRONG");
    context(gateway, c, p);
    assertThrows(ApiException.class, () -> gateway.exchange(c, "payment-1", "preview", p, key));
  }

  @Test
  void binanceSignsEncodedQueryAndNeverRetriesTimeoutThenQueriesOriginalWithdrawal() {
    ObjectNode c = config("NATIVE_BINANCE"), p = payload("BINANCE_USDT").put("fee", "1");
    c.putObject("networkMappings").put("TRC20", "TRX");
    AtomicInteger sends = new AtomicInteger();
    NativePaymentGateway gateway = new NativePaymentGateway(s, r -> {
      String query = r.uri().getRawQuery();
      String unsigned = query.substring(0, query.lastIndexOf("&signature="));
      assertEquals(HexFormat.of().formatHex(hmac("fixture-secret", unsigned)), query.substring(query.lastIndexOf("=") + 1));
      assertEquals("fixture-key", r.headers().get("X-MBX-APIKEY"));
      if (r.uri().getPath().endsWith("questionnaire-requirements")) return reply("{\"questionnaireCountryCode\":\"NIL\"}");
      if (r.uri().getPath().endsWith("config/getall")) return reply(binanceConfig());
      if (r.uri().getPath().endsWith("withdraw/apply")) {
        sends.incrementAndGet();
        assertTrue(unsigned.contains("amount=11"));
        assertTrue(unsigned.contains("network=TRX"));
        throw new HttpTimeoutException("fixture timeout");
      }
      assertTrue(query.contains("withdrawOrderId=" + NativePaymentGateway.providerRequestId("payment-1", key)));
      return reply("[{\"withdrawOrderId\":\"" + NativePaymentGateway.providerRequestId("payment-1", key) + "\",\"id\":\"bn-1\",\"coin\":\"USDT\",\"amount\":\"10\",\"transactionFee\":\"1\",\"network\":\"TRX\",\"address\":\"TFixtureWallet\",\"status\":6,\"txId\":\"chain-tx\"}]");
    }, clock);
    context(gateway, c, p);
    assertTrue(gateway.exchange(c, "payment-1", "preview", p, key).path("executable").asBoolean());
    assertEquals(0, sends.get());
    assertEquals("PAYMENT_ADAPTER_TIMEOUT", assertThrows(ApiException.class, () -> gateway.exchange(c, "payment-1", "execute", p, key)).code);
    ObjectNode result = gateway.exchange(c, "payment-1", "reconcile", reconcile(p), key);
    assertEquals("SUCCEEDED", result.path("state").asText());
    assertEquals(1, sends.get());
    assertFalse(result.toString().contains("TFixtureWallet"));
  }

  String binanceConfig() {
    return "[{\"coin\":\"USDT\",\"free\":\"100\",\"networkList\":[{\"network\":\"TRX\",\"withdrawEnable\":true,\"withdrawMin\":\"1\",\"withdrawMax\":\"1000\",\"withdrawIntegerMultiple\":\"0.000001\",\"withdrawFee\":\"1\",\"withdrawTag\":false,\"addressRegex\":\"^T[A-Za-z]+$\"}]}]";
  }

  @Test
  void binanceTravelRuleAndResponseIdentityMismatchNeverBecomeSuccess() {
    ObjectNode c = config("NATIVE_BINANCE"), p = payload("BINANCE_USDT");
    AtomicInteger requests = new AtomicInteger();
    NativePaymentGateway travel = new NativePaymentGateway(s, r -> {
      requests.incrementAndGet();
      return reply("{\"questionnaireCountryCode\":\"DE\"}");
    }, clock);
    context(travel, c, p);
    assertThrows(ApiException.class, () -> travel.exchange(c, "payment-1", "execute", p, key));
    assertEquals(1, requests.get());
    NativePaymentGateway mismatch = new NativePaymentGateway(s, r -> reply("[{\"withdrawOrderId\":\"" + NativePaymentGateway.providerRequestId("payment-1", key) + "\",\"id\":\"wrong\",\"coin\":\"USDT\",\"amount\":\"11\",\"address\":\"wrong\",\"status\":6}]"), clock);
    assertEquals("PAYMENT_ADAPTER_IDENTITY_MISMATCH", assertThrows(ApiException.class, () -> mismatch.exchange(c, "payment-1", "reconcile", reconcile(p), key)).code);
  }

  @Test
  void configurationAndRecipientVersionsFailClosedWithoutNetwork() {
    NativePaymentGateway gateway = new NativePaymentGateway(s, r -> { throw new AssertionError("must not send"); }, clock);
    ObjectNode c = config("NATIVE_AIRWALLEX"), p = payload("BANK");
    assertThrows(ApiException.class, () -> gateway.validatePayment(c, p));
    c.putObject("beneficiaryMappings").putObject("account-1").put("accountVersion", 1).put("beneficiaryId", "x");
    assertThrows(ApiException.class, () -> gateway.validatePayment(c, p));
    assertThrows(ApiException.class, () -> gateway.validateConfig(config("NATIVE_OKX").put("baseUrl", "https://evil.example")));
    assertThrows(ApiException.class, () -> gateway.validateConfig(config("NATIVE_BINANCE").put("regionCode", "US")));
    assertThrows(ApiException.class, () -> gateway.validateConfig(config("NATIVE_OKX").put("apiKey", "x\r\nheader")));
    ObjectNode bridge = s.object().put("enabled", true).put("protocol", "NATIVE_BINANCE");
    ObjectNode provider = config("NATIVE_BINANCE").put("code", "OKX_USDT");
    provider.set("executionAdapter", bridge);
    PaymentExecutionGateway execution = new PaymentExecutionGateway(s, new org.springframework.mock.env.MockEnvironment(), gateway);
    assertThrows(ApiException.class, () -> execution.requireAdapter(provider));
    assertNotEquals(gateway.binding(c), gateway.binding(c.deepCopy().put("loginAs", "other-tenant")));
  }

  @Test
  void providerRequestIdsAreScopedToLocalPaymentEvenWhenTenantsReuseRequestKey() {
    assertNotEquals(NativePaymentGateway.providerRequestId("supplier-a-payment", key),
        NativePaymentGateway.providerRequestId("supplier-b-payment", key));
    assertEquals(32, NativePaymentGateway.providerRequestId("supplier-a-payment", key).length());
  }

  static byte[] hmac(String secret, String value) throws Exception {
    Mac mac = Mac.getInstance("HmacSHA256");
    mac.init(new SecretKeySpec(secret.getBytes(StandardCharsets.UTF_8), "HmacSHA256"));
    return mac.doFinal(value.getBytes(StandardCharsets.UTF_8));
  }
}
