package com.hispread.ai;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import java.net.*;
import java.net.http.*;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.util.*;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.env.Environment;
import org.springframework.stereotype.Service;

/** HISPREAD_PAYOUT_V1 is an explicit external bridge contract, not a native wallet protocol. */
@Service
public class PaymentExecutionGateway {
  private final Store store;
  private final Environment environment;
  private final HttpClient client =
      HttpClient.newBuilder()
          .connectTimeout(Duration.ofSeconds(5))
          .followRedirects(HttpClient.Redirect.NEVER)
          .build();

  @Value("${app.payments.allow-private-adapters:false}")
  boolean allowPrivateAdapters;

  public PaymentExecutionGateway(Store store, Environment environment) {
    this.store = store;
    this.environment = environment;
  }

  private boolean localTest() {
    return allowPrivateAdapters
        && Arrays.stream(environment.getActiveProfiles())
            .anyMatch(p -> Set.of("test", "integration-test").contains(p));
  }

  public void validateAdapter(ObjectNode adapter) {
    if (!adapter.path("enabled").asBoolean(false)) return;
    if (!adapter.path("protocol").asText().equals("HISPREAD_PAYOUT_V1"))
      throw new ApiException(400, "仅支持显式HISPREAD_PAYOUT_V1支付中台协议");
    if (adapter.path("apiKey").asText().isBlank()
        || adapter.path("apiKey").asText().length() > 4096)
      throw new ApiException(400, "请配置支付中台服务端密钥");
    URI uri;
    try {
      uri = URI.create(adapter.path("baseUrl").asText());
    } catch (Exception e) {
      throw new ApiException(400, "支付中台地址无效");
    }
    boolean testing = localTest();
    if (uri.getHost() == null
        || uri.getUserInfo() != null
        || uri.getRawQuery() != null
        || uri.getFragment() != null
        || uri.getRawPath() != null
            && (uri.getRawPath().contains("..")
                || uri.getRawPath().contains("%")
                || uri.getRawPath().contains("\\"))
        || !Set.of("https", "http").contains(uri.getScheme()))
      throw new ApiException(400, "支付中台地址必须为安全origin或固定路径前缀");
    if (!uri.getScheme().equals("https") && !(testing && adapter.path("allowHttp").asBoolean()))
      throw new ApiException(400, "支付中台生产连接必须使用公网HTTPS");
    if (!testing && adapter.path("allowHttp").asBoolean())
      throw new ApiException(400, "生产支付中台不能允许明文HTTP");
    try {
      for (InetAddress ip : InetAddress.getAllByName(uri.getHost())) {
        byte[] address = ip.getAddress();
        boolean cgnat =
            address.length == 4
                && (address[0] & 255) == 100
                && ((address[1] & 255) >= 64 && (address[1] & 255) <= 127);
        String host = ip.getHostAddress().toLowerCase(Locale.ROOT);
        if (!testing
            && (ip.isAnyLocalAddress()
                || ip.isLoopbackAddress()
                || ip.isLinkLocalAddress()
                || ip.isSiteLocalAddress()
                || ip.isMulticastAddress()
                || cgnat
                || host.startsWith("fc")
                || host.startsWith("fd")
                || address.length == 4 && (address[0] & 255) == 0))
          throw new ApiException(400, "支付中台不能连接私网、环回或链路本地地址");
      }
    } catch (UnknownHostException e) {
      throw new ApiException(503, "支付中台域名无法解析");
    }
  }

  public boolean executable(ObjectNode provider) {
    try {
      if (!provider.path("enabled").asBoolean(false)
          || !provider.path("executionAdapter").isObject()) return false;
      ObjectNode adapter = (ObjectNode) provider.path("executionAdapter");
      if (!adapter.path("enabled").asBoolean(false)) return false;
      validateAdapter(adapter);
      return true;
    } catch (ApiException e) {
      return false;
    }
  }

  public ObjectNode requireAdapter(ObjectNode provider) {
    if (!provider.path("enabled").asBoolean(false)
        || !provider.path("executionAdapter").isObject()
        || !provider.path("executionAdapter").path("enabled").asBoolean())
      throw new ApiException(503, "未配置并启用支付执行中台适配器", "PAYMENT_ADAPTER_NOT_CONFIGURED");
    ObjectNode adapter = (ObjectNode) provider.path("executionAdapter").deepCopy();
    validateAdapter(adapter);
    return adapter;
  }

  public ObjectNode exchange(
      ObjectNode adapter, String localId, String action, ObjectNode payload, String requestKey) {
    validateAdapter(adapter);
    if (!Set.of("preview", "execute", "reconcile").contains(action)
        || !localId.matches("[A-Za-z0-9_-]{1,100}")) throw new ApiException(400, "支付中台操作参数无效");
    String base = adapter.path("baseUrl").asText().replaceAll("/+$", "");
    URI uri = URI.create(base + "/payments/" + localId + "/" + action);
    int timeout = Math.max(1000, Math.min(30000, adapter.path("timeoutMs").asInt(15000)));
    HttpRequest request =
        HttpRequest.newBuilder(uri)
            .timeout(Duration.ofMillis(timeout))
            .header("Authorization", "Bearer " + adapter.path("apiKey").asText())
            .header("Content-Type", "application/json")
            .header("Accept", "application/json")
            .header("Idempotency-Key", requestKey)
            .POST(HttpRequest.BodyPublishers.ofString(payload.toString(), StandardCharsets.UTF_8))
            .build();
    try {
      HttpResponse<String> response =
          client.send(request, HttpResponse.BodyHandlers.ofString(StandardCharsets.UTF_8));
      if (response.statusCode() < 200 || response.statusCode() >= 300)
        throw new ApiException(
            502,
            "支付中台响应HTTP " + response.statusCode() + "；请核对原操作",
            Set.of(400, 401, 403, 404, 405, 415, 422).contains(response.statusCode())
                ? "PAYMENT_ADAPTER_REJECTED"
                : "PAYMENT_ADAPTER_HTTP_ERROR");
      if (response.body().length() > 262144)
        throw new ApiException(502, "支付中台响应过大", "PAYMENT_ADAPTER_INVALID_RESPONSE");
      JsonNode parsed;
      try {
        parsed = store.json.readTree(response.body());
      } catch (Exception e) {
        throw new ApiException(502, "支付中台返回无效JSON", "PAYMENT_ADAPTER_INVALID_RESPONSE");
      }
      if (parsed == null || !parsed.isObject())
        throw new ApiException(502, "支付中台响应必须为对象", "PAYMENT_ADAPTER_INVALID_RESPONSE");
      return (ObjectNode) parsed;
    } catch (HttpTimeoutException e) {
      throw new ApiException(504, "支付中台请求超时；只能查询原操作，不得重复出款", "PAYMENT_ADAPTER_TIMEOUT");
    } catch (InterruptedException e) {
      Thread.currentThread().interrupt();
      throw new ApiException(503, "支付中台请求中断；请查询原操作", "PAYMENT_ADAPTER_INTERRUPTED");
    } catch (java.io.IOException e) {
      throw new ApiException(502, "支付中台连接结果未知；请查询原操作", "PAYMENT_ADAPTER_CONNECTION_FAILED");
    }
  }
}
