package com.hispread.ai;

import static org.junit.jupiter.api.Assertions.*;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;
import java.time.*;
import java.util.concurrent.atomic.AtomicReference;
import org.junit.jupiter.api.Test;

class PayoutProviderGatewayTest {
  private final Store store = new Store(null, new ObjectMapper());

  private ObjectNode config() {
    return store
        .object()
        .put("enabled", true)
        .put("apiKey", "fixture-api-key")
        .put("secretKey", "fixture-secret")
        .put("passphrase", "fixture-passphrase")
        .put("clientId", "fixture-client")
        .put("regionCode", "GLOBAL");
  }

  @Test
  void officialReadOnlyProtocolsMapSuccessWithoutExposingSecrets() {
    for (String code : new String[] {"AIRWALLEX", "OKX_USDT", "BINANCE_USDT"}) {
      AtomicReference<PayoutProviderGateway.Request> captured = new AtomicReference<>();
      PayoutProviderGateway gateway =
          new PayoutProviderGateway(
              store,
              request -> {
                captured.set(request);
                return new PayoutProviderGateway.Reply(
                    200,
                    code.equals("AIRWALLEX")
                        ? "{\"token\":\"must-not-leak\",\"expires_at\":\"2026-11-09T12:00:00Z\"}"
                        : code.equals("OKX_USDT")
                            ? "{\"code\":\"0\",\"data\":[]}"
                            : "{\"vipLevel\":0}");
              },
              Clock.fixed(Instant.parse("2026-11-09T10:00:00Z"), ZoneOffset.UTC));
      ObjectNode result = gateway.test(code, config());
      assertTrue(result.path("readOnly").asBoolean());
      assertFalse(result.path("paymentExecuted").asBoolean());
      assertFalse(result.toString().contains("fixture"));
      assertFalse(result.toString().contains("must-not-leak"));
      assertFalse(captured.get().uri().getPath().contains("withdraw"));
      if (!code.equals("AIRWALLEX")) assertEquals("GET", captured.get().method());
    }
  }

  @Test
  void missingCredentialsAndProviderRejectionsNeverBecomeFakeSuccess() {
    PayoutProviderGateway gateway =
        new PayoutProviderGateway(
            store,
            r -> new PayoutProviderGateway.Reply(401, "{\"msg\":\"denied\"}"),
            Clock.systemUTC());
    assertEquals(
        503,
        assertThrows(ApiException.class, () -> gateway.test("OKX_USDT", store.object())).status);
    assertEquals(
        502, assertThrows(ApiException.class, () -> gateway.test("OKX_USDT", config())).status);
    PayoutProviderGateway fake200 =
        new PayoutProviderGateway(
            store,
            r ->
                new PayoutProviderGateway.Reply(
                    200, "{\"code\":\"50113\",\"msg\":\"invalid signature\"}"),
            Clock.systemUTC());
    assertEquals(
        502, assertThrows(ApiException.class, () -> fake200.test("OKX_USDT", config())).status);
  }
}
