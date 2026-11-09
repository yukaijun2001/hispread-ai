package com.hispread.ai;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.node.*;
import java.net.*;
import java.net.http.*;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.util.*;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.env.Environment;
import org.springframework.stereotype.Service;

/** Server-side adapter for administrator-owned targets. No browser-supplied destination is used. */
@Service
public class ResourceIntegrationGateway {
  private final Store store;
  private final Environment environment;
  private final HttpClient client;

  @Value("${app.integrations.allow-private-targets:false}")
  boolean allowPrivateTargets;

  @Value("${app.integrations.request-timeout-ms:15000}")
  int timeoutMs;

  public ResourceIntegrationGateway(Store store, Environment environment) {
    this.store = store;
    this.environment = environment;
    client =
        HttpClient.newBuilder()
            .connectTimeout(Duration.ofSeconds(5))
            .followRedirects(HttpClient.Redirect.NEVER)
            .build();
  }

  public boolean configured() {
    try {
      ObjectNode c = requireConfigured(null);
      URI uri = URI.create(c.path("baseUrl").asText(c.path("endpoint").asText()));
      validateEndpoint(uri, c.path("allowHttp").asBoolean());
      return true;
    } catch (ApiException | IllegalArgumentException e) {
      return false;
    }
  }

  public ObjectNode requireConfigured(String id) {
    List<ObjectNode> targets =
        store.list("resource-target", null).stream()
            .filter(
                t ->
                    t.path("enabled").asBoolean()
                        && (id == null || id.isBlank() || id.equals(t.path("id").asText())))
            .filter(t -> !t.path("baseUrl").asText(t.path("endpoint").asText()).isBlank())
            .toList();
    if (targets.isEmpty())
      throw new ApiException(503, "尚未配置并启用真实资源上游服务", "RESOURCE_UPSTREAM_NOT_CONFIGURED");
    if ((id == null || id.isBlank()) && targets.size() > 1) {
      List<ObjectNode> defaults =
          targets.stream().filter(t -> t.path("defaultTarget").asBoolean()).toList();
      if (defaults.size() != 1)
        throw new ApiException(409, "存在多个资源目标，请指定目标或设置唯一默认目标", "RESOURCE_TARGET_AMBIGUOUS");
      return defaults.get(0);
    }
    return targets.get(0);
  }

  private boolean testPrivate() {
    return allowPrivateTargets
        && Arrays.stream(environment.getActiveProfiles())
            .anyMatch(p -> Set.of("test", "integration-test").contains(p));
  }

  public void validateEndpoint(URI uri, boolean allowHttp) {
    if (uri.getUserInfo() != null
        || uri.getFragment() != null
        || uri.getHost() == null
        || !Set.of("https", "http").contains(uri.getScheme()))
      throw new ApiException(400, "资源目标地址无效", "INVALID_RESOURCE_TARGET");
    if (uri.getScheme().equals("http") && !allowHttp && !testPrivate())
      throw new ApiException(400, "资源目标必须使用HTTPS，HTTP需管理员明确允许", "INVALID_RESOURCE_TARGET");
    try {
      for (InetAddress ip : InetAddress.getAllByName(uri.getHost()))
        if (!testPrivate()
            && (ip.isAnyLocalAddress()
                || ip.isLoopbackAddress()
                || ip.isLinkLocalAddress()
                || ip.isSiteLocalAddress()
                || ip.isMulticastAddress()
                || ip.getHostAddress().startsWith("100.64.")
                || ip.getHostAddress().startsWith("fc")
                || ip.getHostAddress().startsWith("fd")))
          throw new ApiException(400, "禁止连接内网、环回或链路本地目标", "UNSAFE_RESOURCE_TARGET");
    } catch (UnknownHostException e) {
      throw new ApiException(502, "上游目标域名无法解析", "RESOURCE_UPSTREAM_DNS_FAILED");
    }
  }

  public ObjectNode exchange(
      ObjectNode config, String method, String path, JsonNode body, String key) {
    String base = config.path("baseUrl").asText(config.path("endpoint").asText());
    if (base.isBlank())
      throw new ApiException(503, "尚未配置真实资源上游服务", "RESOURCE_UPSTREAM_NOT_CONFIGURED");
    if (path == null
        || !path.startsWith("/")
        || path.startsWith("//")
        || path.contains("..")
        || path.contains("\\"))
      throw new ApiException(400, "上游操作路径无效", "INVALID_RESOURCE_OPERATION");
    String prefix = config.path("upstreamPathPrefix").asText("/api");
    URI baseUri;
    URI uri;
    try {
      baseUri = URI.create(base.endsWith("/") ? base.substring(0, base.length() - 1) : base);
      String basePath = baseUri.getRawPath() == null ? "" : baseUri.getRawPath();
      uri =
          URI.create(
              baseUri.getScheme() + "://" + baseUri.getRawAuthority() + basePath + prefix + path);
    } catch (Exception e) {
      throw new ApiException(400, "资源目标地址或前缀无效", "INVALID_RESOURCE_TARGET");
    }
    validateEndpoint(uri, config.path("allowHttp").asBoolean());
    String apiKey =
        config
            .path("apiKey")
            .asText(config.path("adminApiKey").asText(config.path("token").asText()));
    HttpRequest.Builder request =
        HttpRequest.newBuilder(uri)
            .timeout(
                Duration.ofMillis(
                    Math.max(1000, Math.min(120000, config.path("timeoutMs").asInt(timeoutMs)))))
            .header("Accept", "application/json");
    String authType = config.path("authType").asText("BEARER");
    if (!apiKey.isBlank() && !authType.equals("NONE")) {
      if (authType.equals("HEADER")) {
        String header = config.path("authHeader").asText();
        if (!header.matches("[A-Za-z][A-Za-z0-9-]{0,60}")
            || Set.of("host", "content-length", "connection", "cookie")
                .contains(header.toLowerCase(Locale.ROOT)))
          throw new ApiException(400, "上游认证头无效", "INVALID_RESOURCE_TARGET");
        request.header(header, apiKey);
      } else request.header("Authorization", "Bearer " + apiKey);
    }
    if (key != null && !key.isBlank()) request.header("Idempotency-Key", key);
    if (method.equals("GET") || method.equals("HEAD"))
      request.method(method, HttpRequest.BodyPublishers.noBody());
    else
      request
          .header("Content-Type", "application/json")
          .method(
              method,
              HttpRequest.BodyPublishers.ofString(
                  body == null ? "{}" : body.toString(), StandardCharsets.UTF_8));
    try {
      HttpResponse<String> response =
          client.send(request.build(), HttpResponse.BodyHandlers.ofString(StandardCharsets.UTF_8));
      if (response.body().length() > 2_000_000)
        throw new ApiException(502, "上游响应过大", "RESOURCE_UPSTREAM_INVALID_RESPONSE");
      if (response.statusCode() < 200 || response.statusCode() >= 300) {
        int status = response.statusCode();
        throw new ApiException(
            status >= 400 && status < 600 ? status : 502,
            "上游请求失败（HTTP " + status + "）",
            "RESOURCE_UPSTREAM_HTTP_ERROR");
      }
      JsonNode parsed;
      try {
        parsed = store.json.readTree(response.body());
      } catch (Exception e) {
        throw new ApiException(502, "上游返回无效JSON", "RESOURCE_UPSTREAM_INVALID_RESPONSE");
      }
      if (parsed == null || !parsed.isObject())
        throw new ApiException(502, "上游响应须为JSON对象", "RESOURCE_UPSTREAM_INVALID_RESPONSE");
      return (ObjectNode) parsed;
    } catch (java.net.http.HttpTimeoutException e) {
      throw new ApiException(504, "资源上游请求超时，请查询原操作结果", "RESOURCE_UPSTREAM_TIMEOUT");
    } catch (InterruptedException e) {
      Thread.currentThread().interrupt();
      throw new ApiException(503, "资源上游请求已中断", "RESOURCE_UPSTREAM_INTERRUPTED");
    } catch (java.io.IOException e) {
      throw new ApiException(502, "资源上游连接失败，请查询原操作结果", "RESOURCE_UPSTREAM_CONNECTION_FAILED");
    }
  }

  public ObjectNode probeProxy(String host, int port) {
    if (port < 1 || port > 65535) throw new ApiException(400, "代理端口无效");
    URI endpoint =
        URI.create("https://" + (host.contains(":") ? "[" + host + "]" : host) + ":" + port);
    validateEndpoint(endpoint, false);
    long started = System.nanoTime();
    try (java.net.Socket socket = new java.net.Socket()) {
      socket.connect(
          new java.net.InetSocketAddress(host, port), Math.min(5000, Math.max(1000, timeoutMs)));
      return store
          .object()
          .put("ok", true)
          .put("state", "REACHABLE")
          .put("latencyMs", (System.nanoTime() - started) / 1000000)
          .put("checkedAt", java.time.Instant.now().toString())
          .put("message", "TCP端口可连接；尚未验证代理认证及出口服务");
    } catch (java.io.IOException e) {
      return store
          .object()
          .put("ok", false)
          .put("state", "UNREACHABLE")
          .put("latencyMs", (System.nanoTime() - started) / 1000000)
          .put("checkedAt", java.time.Instant.now().toString())
          .put("message", "TCP端口连接失败");
    }
  }

  public ObjectNode request(
      String targetId, String method, String path, JsonNode body, String key) {
    return exchange(requireConfigured(targetId), method, path, body, key);
  }

  public ObjectNode testTarget(ObjectNode config) {
    return exchange(config, "GET", "/health", null, null);
  }

  public ObjectNode refreshMonitoring(ObjectNode config) {
    String endpoint = config.path("endpoint").asText();
    if (endpoint.isBlank()) return exchange(config, "GET", "/monitoring", null, null);
    URI uri = URI.create(endpoint);
    ObjectNode target = config.deepCopy();
    target
        .put("baseUrl", uri.getScheme() + "://" + uri.getRawAuthority())
        .put("upstreamPathPrefix", "");
    String path = uri.getRawPath() + (uri.getRawQuery() == null ? "" : "?" + uri.getRawQuery());
    return exchange(target, "GET", path.isBlank() ? "/" : path, null, null);
  }
}
