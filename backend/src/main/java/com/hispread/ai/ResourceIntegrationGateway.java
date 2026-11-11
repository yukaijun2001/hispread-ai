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
  private final ProxyProbeService proxyProbe;
  private final NewApiResourceAdapter newApi;
  private final NativeCcmaxAdapter nativeCcmax;
  private final ResourceSyncSettings syncSettings;

  @Value("${app.integrations.allow-private-targets:false}")
  boolean allowPrivateTargets;

  @Value("${app.integrations.request-timeout-ms:15000}")
  int timeoutMs;

  public ResourceIntegrationGateway(Store store, Environment environment, ProxyProbeService proxyProbe,
      ResourceSyncSettings syncSettings) {
    this.store = store;
    this.environment = environment;
    this.proxyProbe = proxyProbe;
    this.syncSettings = syncSettings;
    this.newApi = new NewApiResourceAdapter(store, this::transport);
    this.nativeCcmax = new NativeCcmaxAdapter(store, this::transport);
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

  public boolean ccmaxConfigured() {
    return store.list("resource-target", null).stream().anyMatch(target -> {
      if (!target.path("enabled").asBoolean() || !Set.of("CUSTOM", "CCMAX_NATIVE").contains(target.path("protocol").asText("CUSTOM"))) return false;
      try {
        validateEndpoint(URI.create(target.path("baseUrl").asText()), target.path("allowHttp").asBoolean());
        return true;
      } catch (RuntimeException e) { return false; }
    });
  }

  public void requireCcmax(ObjectNode config) {
    if (!Set.of("CUSTOM", "CCMAX_NATIVE").contains(config.path("protocol").asText("CUSTOM")))
      throw new ApiException(503, "此资源目标不支持CCMAX交付或OAuth，请选择CCMAX兼容适配器", "RESOURCE_OPERATION_UNSUPPORTED");
  }

  public boolean allowDirectCcmax() {
    try { return requireCcmaxConfigured(null).path("protocol").asText().equals("CCMAX_NATIVE"); }
    catch (ApiException unavailable) { return false; }
  }

  public ObjectNode requireCcmaxConfigured(String id) {
    if (id != null && !id.isBlank()) {
      ObjectNode target = requireConfigured(id);
      requireCcmax(target);
      return target;
    }
    List<ObjectNode> targets = store.list("resource-target", null).stream()
        .filter(target -> target.path("enabled").asBoolean() && !target.path("baseUrl").asText().isBlank()
            && Set.of("CUSTOM", "CCMAX_NATIVE").contains(target.path("protocol").asText("CUSTOM")))
        .toList();
    if (targets.isEmpty()) {
      ObjectNode configured = requireConfigured(id);
      requireCcmax(configured);
      throw new ApiException(503, "尚未配置CCMAX资源上游", "RESOURCE_UPSTREAM_NOT_CONFIGURED");
    }
    if (targets.size() == 1) return targets.get(0);
    List<ObjectNode> defaults = targets.stream().filter(target -> target.path("defaultTarget").asBoolean()).toList();
    if (defaults.size() != 1) throw new ApiException(409, "存在多个CCMAX目标，请指定目标", "RESOURCE_TARGET_AMBIGUOUS");
    return defaults.get(0);
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
            .anyMatch(p -> Set.of("test", "integration-test").contains(p))
        && Arrays.stream(environment.getActiveProfiles()).noneMatch("production"::equals);
  }

  public void validateEndpoint(URI uri, boolean allowHttp) {
    if (uri.getUserInfo() != null
        || uri.getFragment() != null
        || uri.getHost() == null
        || !Set.of("https", "http").contains(uri.getScheme()))
      throw new ApiException(400, "资源目标地址无效", "INVALID_RESOURCE_TARGET");
    if (uri.getScheme().equals("http") && !allowHttp && !testPrivate())
      throw new ApiException(400, "资源目标必须使用HTTPS，HTTP需管理员明确允许", "INVALID_RESOURCE_TARGET");
    OutboundAddressPolicy.resolve(uri.getHost(), testPrivate());
  }

  public ObjectNode exchange(
      ObjectNode config, String method, String path, JsonNode body, String key) {
    String protocol = config.path("protocol").asText("CUSTOM");
    if (protocol.equals("NEWAPI")) return newApi.exchange(config, method, path, body, key);
    if (protocol.equals("CCMAX_NATIVE")) {
      if (Set.of("/jobs/ccmax/daily-sync", "/jobs/ccmax/status-sync", "/resources/sync").contains(path))
        return syncSettings.withPermit(config.path("id").asText(), config.path("timeoutMs").asInt(timeoutMs),
            () -> nativeCcmax.exchange(config, method, path, body, key));
      return nativeCcmax.exchange(config, method, path, body, key);
    }
    if (!protocol.equals("CUSTOM"))
      throw new ApiException(400, "资源协议未受支持", "INVALID_RESOURCE_PROTOCOL");
    if (Set.of("/jobs/ccmax/daily-sync", "/jobs/ccmax/status-sync", "/resources/sync").contains(path))
      return syncSettings.withPermit(config.path("id").asText(), config.path("timeoutMs").asInt(timeoutMs),
          () -> transport(config, method, path, body, key));
    return transport(config, method, path, body, key);
  }

  public ObjectNode syncSettings(String targetId) {
    return syncSettings.read(targetId);
  }

  public ObjectNode saveSyncSettings(String targetId, ObjectNode input) {
    return syncSettings.save(targetId, input);
  }

  public void validateNativeCallback(String targetId, String sessionId, String code) {
    ObjectNode target = requireConfigured(targetId);
    if (target.path("protocol").asText().equals("CCMAX_NATIVE"))
      nativeCcmax.validateCallback(target, sessionId, code);
  }

  private ObjectNode transport(
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
    if (!prefix.matches("(?:/[A-Za-z0-9_-]+)*"))
      throw new ApiException(400, "资源目标前缀无效", "INVALID_RESOURCE_TARGET");
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
    if (!config.path("newApiUserId").asText().isBlank()) {
      if (!config.path("newApiUserId").asText().matches("[1-9][0-9]{0,18}"))
        throw new ApiException(400, "New API用户ID无效", "INVALID_RESOURCE_TARGET");
      request.header("New-Api-User", config.path("newApiUserId").asText());
    }
    if (!Set.of("BEARER", "NONE", "HEADER").contains(authType))
      throw new ApiException(400, "上游认证方式无效", "INVALID_RESOURCE_TARGET");
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
      HttpResponse<byte[]> response = client.send(request.build(), info -> new LimitedBodySubscriber(2_000_000));
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
    return probeProxy("http://" + (host.contains(":") ? "[" + host + "]" : host) + ":" + port);
  }

  public ObjectNode probeProxy(String proxyUrl) {
    return proxyProbe.probe(proxyUrl);
  }

  /** Cancel delivery before an untrusted response can allocate an unbounded body. */
  private static final class LimitedBodySubscriber implements HttpResponse.BodySubscriber<byte[]> {
    private final int maximum;
    private final java.io.ByteArrayOutputStream bytes = new java.io.ByteArrayOutputStream();
    private final java.util.concurrent.CompletableFuture<byte[]> body = new java.util.concurrent.CompletableFuture<>();
    private java.util.concurrent.Flow.Subscription subscription;
    LimitedBodySubscriber(int maximum) { this.maximum = maximum; }
    public java.util.concurrent.CompletionStage<byte[]> getBody() { return body; }
    public void onSubscribe(java.util.concurrent.Flow.Subscription value) { subscription = value; value.request(1); }
    public void onNext(List<java.nio.ByteBuffer> buffers) {
      for (java.nio.ByteBuffer buffer : buffers) {
        if (buffer.remaining() > maximum - bytes.size()) {
          subscription.cancel();
          body.completeExceptionally(new java.io.IOException("response limit"));
          return;
        }
        byte[] chunk = new byte[buffer.remaining()]; buffer.get(chunk); bytes.writeBytes(chunk);
      }
      subscription.request(1);
    }
    public void onError(Throwable error) { body.completeExceptionally(error); }
    public void onComplete() { body.complete(bytes.toByteArray()); }
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
