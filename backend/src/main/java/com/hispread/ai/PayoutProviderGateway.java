package com.hispread.ai;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import java.net.URI;
import java.net.http.*;
import java.nio.charset.StandardCharsets;
import java.time.*;
import java.util.*;
import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import org.springframework.stereotype.Service;

/** Only documented, read-only provider authentication tests; never submits a payment. */
@Service
public class PayoutProviderGateway {
  public record Request(
      String method, URI uri, Map<String, String> headers, String body, int timeoutMs) {}

  public record Reply(int status, String body) {}

  @FunctionalInterface
  public interface Transport {
    Reply send(Request request) throws Exception;
  }

  private final Store store;
  private final Transport transport;
  private final Clock clock;

  @org.springframework.beans.factory.annotation.Autowired
  public PayoutProviderGateway(Store store) {
    this(
        store,
        r -> {
          HttpClient client =
              HttpClient.newBuilder()
                  .connectTimeout(Duration.ofMillis(r.timeoutMs))
                  .followRedirects(HttpClient.Redirect.NEVER)
                  .build();
          HttpRequest.Builder request =
              HttpRequest.newBuilder(r.uri).timeout(Duration.ofMillis(r.timeoutMs));
          r.headers.forEach(request::header);
          request.method(r.method, HttpRequest.BodyPublishers.ofString(r.body));
          HttpResponse<String> response =
              client.send(request.build(), HttpResponse.BodyHandlers.ofString());
          return new Reply(response.statusCode(), response.body());
        },
        Clock.systemUTC());
  }

  public PayoutProviderGateway(Store store, Transport transport, Clock clock) {
    this.store = store;
    this.transport = transport;
    this.clock = clock;
  }

  public ObjectNode test(String code, ObjectNode config) {
    Request request = prepare(code, config);
    long start = System.nanoTime();
    Reply reply;
    try {
      reply = transport.send(request);
    } catch (InterruptedException e) {
      Thread.currentThread().interrupt();
      throw new ApiException(503, "支付通道只读连接测试中断；未发起付款");
    } catch (Exception e) {
      throw new ApiException(503, "支付通道无法连接；未发起付款");
    }
    JsonNode body;
    try {
      body = store.json.readTree(reply.body);
    } catch (Exception e) {
      throw new ApiException(502, "支付通道返回格式异常；未发起付款");
    }
    boolean ok = reply.status >= 200 && reply.status < 300;
    if (code.equals("AIRWALLEX"))
      ok = ok && body.hasNonNull("token") && body.hasNonNull("expires_at");
    if (code.equals("OKX_USDT")) ok = ok && body.path("code").asText().equals("0");
    if (code.equals("BINANCE_USDT"))
      ok = ok && (!body.has("code") || body.path("code").asInt() >= 0);
    if (!ok)
      throw new ApiException(
          reply.status == 401 || reply.status == 403 ? 502 : 502,
          "支付通道拒绝只读测试（HTTP " + reply.status + "）；请检查凭据、区域与只读权限，未发起付款");
    return store
        .object()
        .put("code", code)
        .put("lastHealthState", "OK")
        .put("lastHealthAt", clock.instant().toString())
        .put("lastHealthMessage", "官方只读身份/余额接口连接成功；未发起付款")
        .put("latencyMs", (System.nanoTime() - start) / 1_000_000)
        .put("readOnly", true)
        .put("paymentExecuted", false);
  }

  public Request prepare(String code, ObjectNode c) {
    int timeout = c.path("requestTimeoutMs").asInt(10000);
    timeout = Math.min(30000, Math.max(1000, timeout));
    String key = c.path("apiKey").asText();
    if (!c.path("enabled").asBoolean(false) || key.isBlank())
      throw new ApiException(503, "资金通道未配置或未启用；未发起付款");
    Map<String, String> headers = new LinkedHashMap<>();
    headers.put("Accept", "application/json");
    String region = c.path("regionCode").asText("GLOBAL");
    if (code.equals("AIRWALLEX")) {
      String client = c.path("clientId").asText();
      if (client.isBlank()) throw new ApiException(503, "Airwallex Client ID未配置");
      String host =
          region.equals("SANDBOX")
              ? "https://api.sandbox.airwallex.com"
              : region.equals("GLOBAL") || region.equals("PRODUCTION")
                  ? "https://api.airwallex.com"
                  : null;
      if (host == null) throw new ApiException(400, "不支持的Airwallex区域");
      headers.put("x-client-id", client);
      headers.put("x-api-key", key);
      headers.put("Content-Type", "application/json");
      if (!c.path("loginAs").asText().isBlank())
        headers.put("x-login-as", c.path("loginAs").asText());
      return new Request(
          "POST", URI.create(host + "/api/v1/authentication/login"), headers, "{}", timeout);
    }
    String secret = c.path("secretKey").asText();
    if (secret.isBlank()) throw new ApiException(503, "通道签名密钥未配置");
    if (code.equals("OKX_USDT")) {
      String passphrase = c.path("passphrase").asText();
      if (passphrase.isBlank()) throw new ApiException(503, "OKX Passphrase未配置");
      String host =
          switch (region) {
            case "GLOBAL" -> "https://openapi.okx.com";
            case "US", "AU" -> "https://us.okx.com";
            case "EU", "EEA" -> "https://eea.okx.com";
            default -> throw new ApiException(400, "不支持的OKX区域");
          };
      String stamp =
          new java.time.format.DateTimeFormatterBuilder()
              .appendInstant(3)
              .toFormatter()
              .format(clock.instant());
      String path = "/api/v5/asset/balances?ccy=USDT";
      headers.put("OK-ACCESS-KEY", key);
      headers.put("OK-ACCESS-TIMESTAMP", stamp);
      headers.put("OK-ACCESS-PASSPHRASE", passphrase);
      headers.put(
          "OK-ACCESS-SIGN", Base64.getEncoder().encodeToString(hmac(secret, stamp + "GET" + path)));
      return new Request("GET", URI.create(host + path), headers, "", timeout);
    }
    if (code.equals("BINANCE_USDT")) {
      if (!region.equals("GLOBAL")) throw new ApiException(400, "本实现仅支持Binance GLOBAL官方钱包只读接口");
      String query = "timestamp=" + clock.millis() + "&recvWindow=5000";
      headers.put("X-MBX-APIKEY", key);
      return new Request(
          "GET",
          URI.create(
              "https://api.binance.com/sapi/v1/account/info?"
                  + query
                  + "&signature="
                  + HexFormat.of().formatHex(hmac(secret, query))),
          headers,
          "",
          timeout);
    }
    throw new ApiException(400, "未知资金通道");
  }

  private byte[] hmac(String secret, String text) {
    try {
      Mac mac = Mac.getInstance("HmacSHA256");
      mac.init(new SecretKeySpec(secret.getBytes(StandardCharsets.UTF_8), "HmacSHA256"));
      return mac.doFinal(text.getBytes(StandardCharsets.UTF_8));
    } catch (Exception e) {
      throw new IllegalStateException(e);
    }
  }
}
