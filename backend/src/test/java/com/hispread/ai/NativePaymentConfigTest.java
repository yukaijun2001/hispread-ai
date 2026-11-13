package com.hispread.ai;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;
import jakarta.servlet.http.HttpServletRequest;
import java.util.*;
import org.junit.jupiter.api.Test;
import org.springframework.mock.env.MockEnvironment;

class NativePaymentConfigTest {
  @Test
  void nativeConfigPersistsExplicitProtocolMapsAndVersionBindingsButSafelyProjectsCredentials() {
    Store s = mock(Store.class);
    Store factory = new Store(null, new ObjectMapper());
    when(s.object()).thenAnswer(i -> factory.object());
    AuthService auth = mock(AuthService.class);
    HttpServletRequest req = mock(HttpServletRequest.class);
    when(auth.admin(req)).thenReturn(true);
    Map<String, ObjectNode> saved = new HashMap<>();
    when(s.list(eq("payout-provider"), isNull())).thenAnswer(i -> new ArrayList<>(saved.values()));
    when(s.create(eq("payout-provider"), eq("GLOBAL"), any(ObjectNode.class))).thenAnswer(i -> {
      ObjectNode row = ((ObjectNode) i.getArgument(2)).deepCopy(); saved.put(row.path("code").asText(), row); return row;
    });
    when(s.update(eq("payout-provider"), anyString(), isNull(), any(ObjectNode.class))).thenAnswer(i -> {
      ObjectNode row = ((ObjectNode) i.getArgument(3)).deepCopy(); saved.put(i.getArgument(1), row); return row;
    });
    NativePaymentGateway nativeGateway = new NativePaymentGateway(factory, r -> { throw new AssertionError("must not send"); }, java.time.Clock.systemUTC());
    PaymentExecutionGateway execution = new PaymentExecutionGateway(factory, new MockEnvironment(), nativeGateway);
    PlatformConfigController controller = new PlatformConfigController(s, auth, null, null, null, null, null, execution, null, null);
    ObjectNode body = factory.object().put("enabled", true).put("apiKey", "native-api-key-value")
        .put("secretKey", "native-secret-value").put("passphrase", "native-passphrase-value").put("regionCode", "GLOBAL");
    body.putObject("executionAdapter").put("enabled", true).put("protocol", "NATIVE_OKX");
    body.putObject("networkMappings").put("TRC20", "USDT-TRC20");
    body.putObject("recipientInformation").putObject("approved-account-id").put("accountVersion", 4)
        .putObject("rcvrInfo").put("walletType", "private").put("rcvrFirstName", "private-recipient-name");
    ObjectNode out = (ObjectNode) controller.provider("OKX_USDT", body, req);
    assertEquals("NATIVE_OKX", out.path("executionAdapter").path("protocol").asText());
    assertEquals("https://openapi.okx.com", out.path("executionAdapter").path("baseUrl").asText());
    assertEquals("USDT-TRC20", out.path("networkMappings").path("TRC20").asText());
    assertEquals(4, out.path("recipientInformation").path("approved-account-id").path("accountVersion").asInt());
    assertTrue(out.path("recipientInformation").path("approved-account-id").path("configured").asBoolean());
    for (String secret : List.of("native-api-key-value", "native-secret-value", "native-passphrase-value", "private-recipient-name"))
      assertFalse(out.toString().contains(secret));
    assertEquals("private-recipient-name", saved.get("OKX_USDT").path("recipientInformation").path("approved-account-id").path("rcvrInfo").path("rcvrFirstName").asText());
    controller.provider("OKX_USDT", factory.object().put("apiKey", ""), req);
    assertEquals("native-api-key-value", saved.get("OKX_USDT").path("apiKey").asText());
    assertTrue(execution.executable(saved.get("OKX_USDT")));
    ObjectNode invalid = factory.object();
    invalid.putObject("executionAdapter").put("protocol", "NATIVE_BINANCE").put("baseUrl", "");
    assertThrows(ApiException.class, () -> controller.provider("OKX_USDT", invalid, req));
  }
}
