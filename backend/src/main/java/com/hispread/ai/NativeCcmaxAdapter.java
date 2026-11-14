package com.hispread.ai;

import static com.hispread.ai.BusinessSupport.*;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.node.*;
import java.net.URI;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.locks.ReentrantLock;
import java.util.function.LongSupplier;

final class NativeCcmaxAdapter {
  interface Transport {
    ObjectNode send(ObjectNode config, String method, String path, JsonNode body, String key);
  }

  private record Session(String token, long expiresAt, long version) {}

  private final Map<String, Session> sessions = new ConcurrentHashMap<>();
  private final Store store;
  private final Transport transport;
  private final LongSupplier remainingNanos;
  private final CcmaxIntakeLedger intakeLedger;
  private final ReentrantLock loginLock = new ReentrantLock();

  NativeCcmaxAdapter(Store store, Transport transport, LongSupplier remainingNanos, CcmaxIntakeLedger intakeLedger) {
    this.store = store;
    this.transport = transport;
    this.remainingNanos = remainingNanos;
    this.intakeLedger = intakeLedger;
  }

  ObjectNode exchange(ObjectNode config, String method, String path, JsonNode body, String key) {
    if (path.equals("/health")) {
      ObjectNode identity = call(config, "GET", "/auth/me", null, key);
      if (!eq(identity, "role", "admin"))
        throw new ApiException(403, "CCMAX原生接入需要管理员身份", "RESOURCE_UPSTREAM_FORBIDDEN");
      return store
          .object()
          .put("state", "READY")
          .put("protocol", "CCMAX_NATIVE")
          .put("readOnly", true);
    }
    if (path.equals("/native/accounts")) return accounts(config, body, key);
    if (Set.of("/oauth/link", "/oauth/complete", "/priority-batch", "/jobs/ccmax/daily-sync").contains(path))
      throw UpstreamScope.retired();
    if (path.equals("/resources/oauth/supplier-authorize"))
      return authorize(config, body, text(body, "localResourceId"), key);
    if (path.equals("/resources/oauth/supplier-submit"))
      return complete(config, body, key);
    if (path.startsWith("/resources/oauth/supplier-session/")) {
      String id = path.substring("/resources/oauth/supplier-session/".length());
      if (id.endsWith("/cancel")) {
        id = id.substring(0, id.length() - "/cancel".length());
        ObjectNode saved = session(config, id);
        if (eq(saved, "state", "EXPIRED")) return store.object().put("state", "EXPIRED");
        if (!Set.of("READY", "CANCELLED").contains(text(saved, "state")))
          throw new ApiException(409, "已提交授权不可取消，请核对原操作");
        store.update("native-oauth", id, "GLOBAL", store.object().put("state", "CANCELLED"));
        return store.object().put("state", "CANCELLED");
      }
      ObjectNode session = session(config, id);
      if (eq(session, "state", "SUCCESS") && !text(session, "accountId").isBlank())
        return observation(account(config, text(session, "accountId"), key))
            .put("state", "SUCCESS")
            .put("sessionId", id);
      return store
          .object()
          .put("state", text(session, "state"))
          .put("sessionId", id)
          .put("expiresAt", text(session, "expiresAt"));
    }
    if (path.equals("/resources/supplier-submit")) return submit(config, body, key);
    if (path.equals("/resource-lifecycle-jobs")
        || path.equals("/resource-lifecycle-jobs/reconcile"))
      return lifecycle(config, body, key, path.endsWith("/reconcile"));
    if (path.equals("/priority-batch/reconcile"))
      return priorities(config, body, key);
    if (path.equals("/jobs/ccmax/status-sync") || path.equals("/resources/sync"))
      return statusSync(config, body, key);
    if (path.contains("/operations/")) return reconcileOperation(config, path, key);
    String[] pieces = path.split("/");
    if (pieces.length < 4 || !pieces[1].equals("resources")) throw unsupported();
    String localId = pieces[2],
        action = String.join("/", Arrays.copyOfRange(pieces, 3, pieces.length));
    ObjectNode resource = store.get("resource", localId, null);
    if (!text(resource, "targetId").isBlank() && !eq(resource, "targetId", text(config, "id")))
      throw new ApiException(409, "资源上游目标不一致");
    if (action.equals("oauth/authorize") || action.equals("oauth/supplier-authorize"))
      return authorize(config, body, localId, key);
    if (action.equals("oauth/complete") || action.equals("oauth/supplier-submit"))
      return complete(config, body, key);
    if (action.equals("account-bind")) {
      String accountId = text(body, "accountId");
      ObjectNode account = account(config, accountId, key);
      return observation(account)
          .put("upstreamAccountId", accountId)
          .put("upstreamProtocol", "CCMAX_NATIVE");
    }
    String accountId = mapped(config, resource);
    if (eq(resource, "operationalState", "GONE"))
      throw new ApiException(409, "账号已移除，不可再操作", "RESOURCE_CHANNEL_REMOVED");
    if (action.equals("usage")) {
      // Read the account's current snapshot; do not refresh billing or scan request logs.
      return observation(account(config, accountId, key));
    }
    if (action.equals("credential-refresh")) {
      NativeMaintenanceBinding.validate(config, resource, body.path("expectedMaintenanceBinding"));
      if (body.path("expectedMaintenanceBinding").isObject()) accountId = text(body.path("expectedMaintenanceBinding"), "accountId");
      ObjectNode refreshed =
          call(
              config,
              "POST",
              accountPath(accountId) + "/refresh",
              store.object().put("force", false),
              key);
      if (refreshed.path("ok").isBoolean() && !refreshed.path("ok").asBoolean()) throw rejected();
      if (!refreshed.path("ok").asBoolean() && !refreshed.path("access_token").isObject())
        throw invalid();
      try { return observation(account(config, accountId, key)).put("state", "UPDATED"); }
      catch (ApiException readback) {
        throw new ApiException(502, "上游已受理凭据刷新，但回读未确认，请查询原操作，勿重复刷新", "RESOURCE_OPERATION_UNCERTAIN");
      }
    }
    if (action.equals("reauthorizations")) return authorize(config, body, localId, key);
    if (action.startsWith("reauthorizations/"))
      return complete(
          config, bodyWithSession(body, action.substring("reauthorizations/".length())), key);
    if (action.equals("priority")) {
      throw UpstreamScope.retired();
    }
    if (action.equals("submit") || action.equals("dispatch")) return submit(config, body, key);
    throw unsupported();
  }

  private ObjectNode call(
      ObjectNode config, String method, String path, JsonNode body, String key) {
    String id = text(config, "id");
    ObjectNode target = config.deepCopy().put("upstreamPathPrefix", "/api");
    target.remove("newApiUserId");
    for (int attempt = 0; attempt < 2; attempt++) {
      Session session = login(config);
      target.put("apiKey", session.token()).put("authType", "BEARER");
      try {
        ObjectNode result = transport.send(target, method, path, body, key);
        if (result.path("ok").isBoolean() && !result.path("ok").asBoolean()) throw rejected();
        if (result.hasNonNull("error")
            && !result.hasNonNull("id")
            && !result.path("account").isObject()
            && (!result.path("error").isTextual() || !text(result, "error").isBlank()))
          throw rejected();
        return result;
      } catch (ApiException error) {
        if (error.status != 401 || attempt != 0) throw error;
        sessions.remove(id, session);
      }
    }
    throw rejected();
  }

  private Session login(ObjectNode config) {
    boolean acquired = false;
    try {
      acquired = loginLock.tryLock(remainingNanos.getAsLong(), TimeUnit.NANOSECONDS);
      if (!acquired) throw new ApiException(504, "上号单次超时，请查询原操作，勿重复提交", "CCMAX_CREATION_TIMEOUT");
      return loginWithLock(config);
    } catch (InterruptedException interrupted) {
      Thread.currentThread().interrupt();
      throw new ApiException(503, "上游登录等待已中断", "RESOURCE_UPSTREAM_INTERRUPTED");
    } finally {
      if (acquired) loginLock.unlock();
    }
  }

  private Session loginWithLock(ObjectNode config) {
    remainingNanos.getAsLong();
    String id = text(config, "id");
    Session existing = sessions.get(id);
    long version = config.path("version").asLong();
    if (existing != null
        && existing.version() == version
        && existing.expiresAt() > System.currentTimeMillis() + 30000) return existing;
    required(config, "adminUsername", "adminPassword");
    ObjectNode target = config.deepCopy().put("upstreamPathPrefix", "/api").put("authType", "NONE");
    target.remove(List.of("apiKey", "newApiUserId"));
    ObjectNode result =
        transport.send(
            target,
            "POST",
            "/auth/admin-login",
            store
                .object()
                .put("identifier", text(config, "adminUsername"))
                .put("email", text(config, "adminUsername"))
                .put("password", text(config, "adminPassword")),
            null);
    String token = text(result, "access_token");
    if (token.isBlank() || !eq(result.path("user"), "role", "admin")) throw rejected();
    long expiresAt = System.currentTimeMillis() + 300000;
    try {
      JsonNode payload = store.json.readTree(Base64.getUrlDecoder().decode(token.split("\\.")[1]));
      if (payload.path("exp").canConvertToLong())
        expiresAt = Math.min(expiresAt, payload.path("exp").asLong() * 1000);
    } catch (Exception ignored) {
    }
    Session session = new Session(token, expiresAt, version);
    sessions.put(id, session);
    return session;
  }

  private ObjectNode accounts(ObjectNode config, JsonNode query, String key) {
    int page = Math.max(1, Math.min(10000, query == null ? 1 : query.path("page").asInt(1)));
    String search = query == null ? "" : text(query, "search");
    ObjectNode reply =
        call(
            config,
            "GET",
            "/admin/oauth-accounts?page_mode=1&page="
                + page
                + "&page_size=20&query="
                + ResourceOperations.encode(search),
            null,
            key);
    if (!reply.path("accounts").isArray()) throw invalid();
    ObjectNode out = store.object();
    ArrayNode rows = out.putArray("items");
    for (JsonNode account : reply.path("accounts")) rows.add(summary(account));
    out.put("total", reply.path("pagination").path("total_rows").asInt(rows.size()));
    out.put("page", page).put("size", 20);
    return out;
  }

  private ObjectNode account(ObjectNode config, String id, String key) {
    validateId(id);
    ObjectNode result = call(config, "GET", accountPath(id), null, key);
    JsonNode account = result.path("account").isObject() ? result.path("account") : result;
    if (!eq(account, "id", id)
        || !Set.of("active", "disabled", "error").contains(text(account, "status")))
      throw invalid();
    ObjectNode out = ((ObjectNode) account).deepCopy();
    // The native detail response places runtime stats beside account, unlike the list rows.
    if (result.path("stats").isObject()) out.set("stats", result.path("stats"));
    return out;
  }

  private ObjectNode summary(JsonNode account) {
    return store
        .object()
        .put("id", text(account, "id"))
        .put("name", text(account, "name"))
        .put("status", text(account, "status"))
        .put("healthStatus", text(account, "health_status"))
        .put("weight", account.path("weight").asInt())
        .put("accountType", text(account, "account_type"));
  }

  private ObjectNode observation(JsonNode account) {
    return observation(account, false);
  }

  private ObjectNode observation(JsonNode account, boolean statusOnly) {
    String status = text(account, "status");
    String state =
        status.equals("active") ? "ACTIVE" : status.equals("disabled") ? "PAUSED" : "ERROR";
    ObjectNode result =
        store
            .object()
            .put("state", "UPDATED")
            .put("laneId", text(account, "id"))
            .put("upstreamAccountId", text(account, "id"))
            .put("upstreamProtocol", "CCMAX_NATIVE")
            .put("operationalState", state)
            .put("laneState", state)
            .put("upstreamPriority", account.path("weight").asInt());
    ObjectNode data = result.putObject("resourceData");
    data.putObject("health")
        .put("paused", status.equals("disabled"))
        .put("status", text(account, "health_status"));
    if (Set.of("token_error", "revoked", "identity_verification_required").contains(text(account, "health_status"))) {
      ((ObjectNode) data.path("health")).put("credentialFailureReason", text(account, "health_status"));
      result.put("operationalState", "INVALID").put("laneState", "INVALID");
    }
    data.put("upstreamProtocol", "CCMAX_NATIVE");
    if (statusOnly) {
      result.remove("upstreamPriority");
      return result;
    }
    ObjectNode quota = data.putObject("usage");
    JsonNode stats = account.path("stats"), utilization = stats.path("claude_utilization");
    for (String[] window : List.of(new String[] {"five_hour", "fiveHour"}, new String[] {"seven_day", "sevenDay"})) {
      JsonNode source = utilization.path(window[0]);
      JsonNode percent = source.path("utilization");
      if (percent.isNumber() && Double.isFinite(percent.asDouble())
          && percent.asDouble() >= 0 && percent.asDouble() <= 100)
        quota.set(window[1] + "Percent", percent);
      copyInstant(source, "resets_at", quota, window[1] + "ResetsAt");
      copyInstant(stats, "claude_utilization_updated_at", quota, window[1] + "ObservedAt");
    }
    JsonNode subscription = account.path("subscription_info");
    if (subscription.path("plan").isTextual() && !text(subscription, "plan").isBlank()) {
      ObjectNode plan = quota.putObject("plan");
      plan.put("tier", text(subscription, "plan")).put("label", text(subscription, "plan"));
      copyInstant(subscription, "checked_at", plan, "checkedAt");
    }
    if (quota.isEmpty()) data.remove("usage");
    if (account.hasNonNull("total_cost")) {
      java.math.BigDecimal cost;
      try {
        cost = new java.math.BigDecimal(account.path("total_cost").asText());
      } catch (RuntimeException error) {
        throw invalid();
      }
      if (cost.signum() < 0 || cost.precision() > 32 || cost.scale() > 12 || cost.scale() < -12)
        throw invalid();
      result
          .putObject("usage")
          .put("amount", cost.toPlainString())
          .put("currency", "USD")
          .put("basis", "UPSTREAM_LIFETIME_TOTAL")
          .put("queriedAt", Instant.now().toString());
    }
    return result;
  }

  private void copyInstant(JsonNode source, String field, ObjectNode target, String output) {
    if (!source.path(field).isTextual()) return;
    try {
      target.put(output, Instant.parse(text(source, field)).toString());
    } catch (java.time.format.DateTimeParseException ignored) {
      // Missing or malformed optional telemetry remains missing, never a fabricated timestamp.
    }
  }

  private ObjectNode authorize(ObjectNode config, JsonNode body, String localId, String key) {
    ObjectNode request =
        store
            .object()
            .put("provider", "anthropic")
            .put("oauth_flow", "login")
            .put("inference_backend", "native")
            .put("outbound_proxy_mode", "direct")
            .putNull("outbound_proxy_id")
            .put("overwrite_existing", false);
    JsonNode input = body != null && body.path("input").isObject() ? body.path("input") : body;
    if (input != null && !text(input, "proxyUrl").isBlank()) throw proxyUnsupported();
    String bound = "";
    String boundState = "";
    if (!localId.isBlank()) {
      ObjectNode resource = store.get("resource", localId, null);
      for (ObjectNode operation : store.list("resource-operation", null))
        if (eq(operation, "resourceId", localId) && eq(operation, "protocol", "CCMAX_NATIVE")
            && operation.has("oauthAuthorizationId")
            && !operation.path("creationConfirmedNotCreated").asBoolean()
            && Set.of("UNKNOWN", "SUBMITTING", "RUNNING", "PENDING").contains(text(operation, "state")))
          throw new ApiException(409, "原授权兑换结果未确认，请查询原操作，勿生成新授权", "RESOURCE_OPERATION_UNCERTAIN");
      if (!text(resource, "laneId").isBlank()) bound = mapped(config, resource);
      if (eq(resource, "operationalState", "GONE"))
        throw new ApiException(409, "账号已归档，不可再授权", "RESOURCE_CHANNEL_REMOVED");
      if (!bound.isBlank()) boundState = text(account(config, bound, key), "status");
    }
    ArrayNode existingIds = store.json.createArrayNode();
    if (bound.isBlank()) {
      for (int page = 1; page <= 500; page++) {
        ObjectNode baseline =
            call(
                config,
                "GET",
                "/admin/oauth-accounts?page_mode=1&page=" + page + "&page_size=100",
                null,
                key);
        if (!baseline.path("accounts").isArray()) throw invalid();
        for (JsonNode account : baseline.path("accounts")) existingIds.add(text(account, "id"));
        if (page >= baseline.path("pagination").path("total_pages").asInt(1)) break;
        if (page == 500) throw new ApiException(503, "上游账号列表超出核验上限", "RESOURCE_SYNC_LIMIT");
      }
    }
    String path =
        bound.isBlank() ? "/admin/oauth-accounts/auth-url" : accountPath(bound) + "/reauthorize";
    ObjectNode reply = call(config, "POST", path, request, key);
    String state = text(reply, "state"), url = text(reply, "url");
    try {
      URI parsed = URI.create(url);
      if (!"https".equals(parsed.getScheme())
          || !"claude.ai".equals(parsed.getHost())
          || !parsed.getPath().equals("/oauth/authorize")) throw invalid();
    } catch (RuntimeException error) {
      throw invalid();
    }
    if (state.isBlank() || state.length() > 512) throw invalid();
    int ttl = reply.path("expires_in").asInt(600);
    String expires = Instant.now().plusSeconds(Math.max(1, Math.min(3600, ttl))).toString();
    ObjectNode session =
        store
            .object()
            .put("targetId", text(config, "id"))
            .put("pendingState", state)
            .put("localResourceId", localId)
            .put("accountId", bound)
            .put("originalStatus", boundState)
            .put("expiresAt", expires)
            .put("state", "READY");
    ArrayNode existing = session.putArray("existingAccountIds");
    existing.addAll(existingIds);
    session = store.create("native-oauth", "GLOBAL", session);
    return store
        .object()
        .put("state", "READY")
        .put("sessionId", text(session, "id"))
        .put("authUrl", url)
        .put("expiresAt", expires);
  }

  private ObjectNode session(ObjectNode config, String id) {
    store.jdbc.queryForObject(
        "select pg_advisory_xact_lock(hashtext(?),hashtext(?))",
        (row, index) -> true, "native-oauth", id);
    ObjectNode session = store.get("native-oauth", id, "GLOBAL");
    if (!eq(session, "targetId", text(config, "id"))) throw new ApiException(404, "授权会话不存在");
    if (!Instant.parse(text(session, "expiresAt")).isAfter(Instant.now())
        && eq(session, "state", "READY"))
      return store.update("native-oauth", id, "GLOBAL", store.object().put("state", "EXPIRED"));
    return session;
  }

  private ObjectNode complete(ObjectNode config, JsonNode input, String key) {
    String sessionId = text(input, "sessionId");
    ObjectNode session = session(config, sessionId);
    String intent = text(input, "expectedOAuthOperationId");
    if (intent.isBlank()) requireReadySession(session);
    else if (!eq(session, "state", "SUBMITTING") || !eq(session, "exchangeOperationId", intent))
      throw new ApiException(409, "授权兑换已提交，请核对原操作", "OAUTH_SESSION_NOT_READY");
    if (!text(input, "localResourceId").isBlank()
        && !eq(session, "localResourceId", text(input, "localResourceId")))
      throw new ApiException(409, "授权会话与资源不匹配");
    String code = validatedCallback(session, text(input, "code"));
    if (!text(session, "localResourceId").isBlank()) {
      ObjectNode local = store.get("resource", text(session, "localResourceId"), null);
      if (eq(local, "operationalState", "GONE")) throw new ApiException(409, "账号已归档，不可更新授权");
      if (!text(session, "accountId").isBlank()
          && !mapped(config, local).equals(text(session, "accountId")))
        throw new ApiException(409, "授权期间账号关联已变化");
    }
    ObjectNode payload =
        store
            .object()
            .put("code", code)
            .put("pending_state", text(session, "pendingState"))
            .put("inference_backend", "native")
            .put("outbound_proxy_mode", "direct")
            .put("overwrite_existing", false);
    String bound = text(session, "accountId");
    JsonNode decision = input.path("intakeDecision");
    if (bound.isBlank() && decision.isObject()) payload.put("status", "disabled").put("weight", decision.path("priority").asInt());
    String path =
        bound.isBlank()
            ? "/admin/oauth-accounts/exchange"
            : accountPath(bound) + "/reauthorize/exchange";
    store.update("native-oauth", sessionId, "GLOBAL", store.object().put("state", "SUBMITTING"));
    ObjectNode reply = call(config, "POST", path, payload, key);
    JsonNode result = reply.path("account").isObject() ? reply.path("account") : reply;
    String accountId = text(result, "id");
    validateId(accountId);
    store.update(
        "native-oauth", sessionId, "GLOBAL", store.object().put("observedAccountId", accountId));
    if (!bound.isBlank() && !bound.equals(accountId)) throw invalid();
    if (bound.isBlank()
        && (reply.path("overwritten").asBoolean()
            || java.util.stream.StreamSupport.stream(
                    session.path("existingAccountIds").spliterator(), false)
                .anyMatch(id -> id.asText().equals(accountId))))
      throw new ApiException(409, "上游返回已有账号更新，未记为新增交付，请核对原账号", "RESOURCE_EXISTING_ACCOUNT_UPDATED");
    ObjectNode observed = account(config, accountId, key);
    String intakeCategory = "";
    if (bound.isBlank() && decision.isObject()) {
      String plan = text(observed.path("subscription_info"), "plan").toLowerCase(Locale.ROOT);
      intakeCategory = plan.equals("pro") ? "PRO" : Set.of("max", "team", "enterprise", "free").contains(plan) ? "NON_PRO" : "UNKNOWN";
      // Exchange creates disabled: verify that contract before trusting admission or enabling.
      if (!eq(observed, "status", "disabled")) {
        call(config, "PATCH", accountPath(accountId), store.object().put("status", "disabled"), key);
        observed = account(config, accountId, key);
        if (!eq(observed, "status", "disabled")) throw invalid();
      }
      try {
        intakeLedger.classify(text(decision, "supplierId"), text(decision, "id"), intakeCategory);
      } catch (ApiException denied) {
        store.update("native-oauth", sessionId, "GLOBAL", store.object().put("state", "REJECTED").put("accountId", accountId)
            .put("failureCode", denied.code).put("failureMessage", denied.getMessage()));
        return observation(observed).put("state", "FAILED").put("intakeCategory", intakeCategory)
            .put("failureCode", denied.code).put("message", denied.getMessage());
      }
      call(config, "PATCH", accountPath(accountId), store.object().put("weight", decision.path("priority").asInt()).put("status", "active"), key);
      observed = account(config, accountId, key);
      if (!eq(observed, "status", "active") || observed.path("weight").asInt(-1) != decision.path("priority").asInt()) throw invalid();
    }
    if (bound.isBlank() && !eq(observed, "status", "active"))
      throw new ApiException(502, "新账号未处于可用状态，未确认交付成功", "RESOURCE_UPSTREAM_INVALID_RESPONSE");
    if (!bound.isBlank() && !eq(observed, "status", text(session, "originalStatus")))
      throw new ApiException(502, "重新授权改变了账号启停状态，请核对原账号", "RESOURCE_UPSTREAM_INVALID_RESPONSE");
    store.update(
        "native-oauth",
        sessionId,
        "GLOBAL",
        store.object().put("state", "SUCCESS").put("accountId", accountId));
    ObjectNode completion = observation(observed)
        .put("state", "SUCCESS")
        .put("credentialConfigured", true)
        .put("existingAccountUpdated", reply.path("overwritten").asBoolean());
    if (!intakeCategory.isBlank()) completion.put("intakeCategory", intakeCategory);
    return completion;
  }

  void claimExchange(ObjectNode config, String sessionId, String localId, String code, String operationId) {
    ObjectNode saved = session(config, sessionId);
    requireReadySession(saved);
    validatedCallback(saved, code);
    if (!eq(saved, "localResourceId", localId)) throw new ApiException(404, "授权会话与资源不匹配");
    ObjectNode local = store.get("resource", localId, null);
    if (eq(local, "operationalState", "GONE")) throw new ApiException(409, "账号已归档，不可更新授权");
    if (!text(saved, "accountId").isBlank() && !mapped(config, local).equals(text(saved, "accountId")))
      throw new ApiException(409, "授权期间账号关联已变化", "RESOURCE_MAPPING_CHANGED");
    store.update("native-oauth", sessionId, "GLOBAL", store.object()
        .put("state", "SUBMITTING").put("exchangeOperationId", operationId));
  }

  void validateCallback(ObjectNode config, String sessionId, String code) {
    ObjectNode saved = session(config, sessionId);
    requireReadySession(saved);
    validatedCallback(saved, code);
  }

  private void requireReadySession(JsonNode session) {
    if (eq(session, "state", "EXPIRED"))
      throw new ApiException(409, "授权会话已过期，请重新生成链接", "OAUTH_SESSION_EXPIRED");
    if (!eq(session, "state", "READY"))
      throw new ApiException(409, "授权会话已提交或已取消，请核对原结果", "OAUTH_SESSION_NOT_READY");
  }

  private String validatedCallback(ObjectNode session, String raw) {
    String code = raw.trim();
    if (code.isBlank() || code.length() > 10000) throw new ApiException(400, "回调内容无效");
    if (code.startsWith("http://") || code.startsWith("https://")) {
      try {
        Map<String, String> query = new HashMap<>();
        for (String part : URI.create(code).getRawQuery().split("&")) {
          String[] field = part.split("=", 2);
          query.put(
              java.net.URLDecoder.decode(field[0], StandardCharsets.UTF_8),
              java.net.URLDecoder.decode(
                  field.length == 2 ? field[1] : "", StandardCharsets.UTF_8));
        }
        code = query.getOrDefault("code", "") + "#" + query.getOrDefault("state", "");
      } catch (RuntimeException error) {
        throw new ApiException(400, "回调地址无效");
      }
    }
    int separator = code.lastIndexOf('#');
    if (separator < 1 || !code.substring(separator + 1).equals(text(session, "pendingState")))
      throw new ApiException(400, "授权state不匹配，请使用本次回调", "OAUTH_STATE_MISMATCH");
    return code;
  }

  private ObjectNode submit(ObjectNode config, JsonNode body, String key) {
    throw new ApiException(400, "原生上号仅支持 OAuth，RT/AT/SK 导入已停用", "CCMAX_RAW_IMPORT_DISABLED");
  }

  private ObjectNode lifecycle(ObjectNode config, JsonNode body, String key, boolean readOnly) {
    if (!body.path("items").isArray()
        || body.path("items").isEmpty()
        || body.path("items").size() > 100
        || !Set.of("PAUSE", "RESUME", "REMOVE").contains(text(body, "action")))
      throw new ApiException(400, "生命周期参数无效");
    LifecycleBindings.validate(store, config, body);
    Map<String, String> mapped = new LinkedHashMap<>();
    for (JsonNode item : body.path("items")) {
      String id = text(item, "resourceId");
      String accountId = LifecycleBindings.frozenId(body, id, mapped(config, store.get("resource", id, null)));
      validateId(accountId);
      if (mapped.containsValue(accountId) || mapped.putIfAbsent(id, accountId) != null)
        throw new ApiException(400, "账号不可重复");
    }
    ObjectNode result = store.object();
    ArrayNode items = result.putArray("items");
    int failed = 0, unknown = 0;
    String action = text(body, "action");
    Set<String> confirmed = new HashSet<>();
    if (readOnly && action.equals("REMOVE"))
      for (JsonNode item : body.path("confirmedItems"))
        if (eq(item, "state", "GONE")) confirmed.add(text(item, "resourceId"));
    for (var entry : mapped.entrySet()) {
      ObjectNode item = items.addObject().put("resourceId", entry.getKey());
      if (confirmed.contains(entry.getKey())) {
        item.put("state", "GONE");
        continue;
      }
      boolean writeAccepted = false;
      try {
        if (action.equals("REMOVE")) {
          if (!readOnly) {
            call(
                config,
                "DELETE",
                accountPath(entry.getValue()),
                store.object().put("release_proxy", false),
                key);
            writeAccepted = true;
          }
          ObjectNode archived =
              call(config, "GET", "/admin/archived-accounts/" + entry.getValue(), null, key);
          JsonNode record =
              archived.path("account").isObject() ? archived.path("account") : archived;
          if (!eq(record, "id", entry.getValue())) throw invalid();
          item.put("state", "GONE");
        } else {
          String desired = action.equals("PAUSE") ? "disabled" : "active";
          if (!readOnly) {
            call(
                config,
                "PATCH",
                accountPath(entry.getValue()),
                store.object().put("status", desired),
                key);
            writeAccepted = true;
          }
          if (!eq(account(config, entry.getValue(), key), "status", desired)) throw invalid();
          item.put("state", action.equals("PAUSE") ? "PAUSED" : "RESUMED");
        }
      } catch (ApiException error) {
        boolean uncertain = readOnly || writeAccepted || error.status >= 500 || error.status == 408;
        if (uncertain) unknown++;
        else failed++;
        item.put("state", uncertain ? "UNKNOWN" : "FAILED")
            .put("errorCode", error.code)
            .put("errorMessage", error.getMessage());
      }
    }
    return result
        .put(
            "state",
            unknown > 0
                ? "UNKNOWN"
                : failed == items.size() ? "FAILED" : failed > 0 ? "PARTIAL" : "COMPLETED")
        .put("completedCount", items.size() - failed - unknown)
        .put("failedCount", failed)
        .put("unknownCount", unknown);
  }

  private ObjectNode priorities(ObjectNode config, JsonNode body, String key) {
    int weight = priority(body);
    if (!body.path("items").isArray()
        || body.path("items").isEmpty()
        || body.path("items").size() > 100) throw new ApiException(400, "优先级参数无效");
    ObjectNode result = store.object();
    ArrayNode items = result.putArray("items");
    int success = 0;
    Set<String> seen = new HashSet<>();
    for (JsonNode item : body.path("items")) {
      String rid = text(item, "resourceId"), id = mapped(config, store.get("resource", rid, null));
      if (!seen.add(id)) throw new ApiException(400, "账号不可重复");
    }
    for (JsonNode source : body.path("items")) {
      String rid = text(source, "resourceId"),
          id = mapped(config, store.get("resource", rid, null));
      ObjectNode item =
          items.addObject().put("resourceId", rid).put("laneId", id).put("priority", weight);
      try {
        if (account(config, id, key).path("weight").asInt(-1) != weight) throw invalid();
        item.put("state", "SUCCESS");
        success++;
      } catch (ApiException error) {
        item.put("state", "UNKNOWN")
            .put("errorCode", error.code)
            .put("errorMessage", error.getMessage());
      }
    }
    result
        .putObject("counts")
        .put("SUCCESS", success)
        .put("FAILED", 0)
        .put("UNKNOWN", items.size() - success);
    return result
        .put("total", items.size())
        .put("state", success < items.size() ? "UNKNOWN" : "COMPLETED");
  }

  private ObjectNode statusSync(ObjectNode config, JsonNode body, String key) {
    ObjectNode result = store.object().put("state", "SUCCESS");
    ArrayNode resources = result.putArray("resources");
    JsonNode requested = body.path("resources");
    if (!requested.isArray()) {
      ArrayNode all = store.json.createArrayNode();
      for (ObjectNode local : store.list("resource", null))
        if (eq(local, "targetId", text(config, "id"))
            && !text(local, "upstreamAccountId").isBlank()
            && !local.path("deleted").asBoolean()
            && !eq(local, "operationalState", "GONE"))
          all.addObject()
              .put("resourceId", text(local, "id"))
              .put("supplierId", text(local, "supplierId"));
      requested = all;
    }
    if (requested.size() > 1000) throw new ApiException(400, "每批最多同步1000个账号");
    for (JsonNode item : requested) {
      String rid = text(item, "resourceId");
      ObjectNode local = store.get("resource", rid, null);
      if (!eq(local, "supplierId", text(item, "supplierId"))) throw invalid();
      ObjectNode observed = observation(account(config, mapped(config, local), key), true);
      ObjectNode row =
          resources
              .addObject()
              .put("resourceId", rid)
              .put("supplierId", text(local, "supplierId"))
              .put("operationalState", text(observed, "operationalState"));
      row.set("resourceData", observed.path("resourceData"));
    }
    return result;
  }

  private ObjectNode reconcileOperation(ObjectNode config, String path, String key) {
    ObjectNode operation =
        store.list("resource-operation", null).stream()
            .filter(
                op ->
                    eq(op, "targetId", text(config, "id"))
                        && eq(op, "requestKey", key)
                        && path.startsWith(text(op, "upstreamPath") + "/operations/"))
            .findFirst()
            .orElseThrow(() -> new ApiException(404, "原生上游操作不存在"));
    String type = text(operation, "type"), rid = text(operation, "resourceId");
    if (Set.of("USAGE", "CREDENTIAL-REFRESH").contains(type)) {
      ObjectNode local = store.get("resource", rid, null);
      if (type.equals("CREDENTIAL-REFRESH")) NativeMaintenanceBinding.validate(config, local, operation.path("maintenanceBinding"));
      String accountId = type.equals("CREDENTIAL-REFRESH") && operation.path("maintenanceBinding").isObject()
          ? text(operation.path("maintenanceBinding"), "accountId") : mapped(config, local);
      ObjectNode observed = observation(account(config, accountId, key));
      if (type.equals("CREDENTIAL-REFRESH")) {
        observed.put("state", "UNKNOWN").put("message", "账号可读取，但无法仅凭状态确认刷新凭据结果，请人工核对");
      }
      return observed;
    }
    if (type.equals("OAUTH_COMPLETE")) {
      String sessionId = text(operation.path("request"), "sessionId");
      ObjectNode saved = session(config, sessionId);
      if (!text(operation, "intakeLedgerId").isBlank() && !text(saved, "observedAccountId").isBlank()) {
        ObjectNode quota = store.get("intake-ledger", text(operation, "intakeLedgerId"), text(operation, "supplierId"));
        ObjectNode observed = account(config, text(saved, "observedAccountId"), key);
        String category = text(quota, "category");
        if (Set.of("CLASSIFIED", "SUCCESS").contains(text(quota, "state"))
            && Set.of("PRO", "NON_PRO").contains(category) && eq(observed, "status", "active")
            && observed.path("weight").asInt(-1) == quota.path("priority").asInt()) {
          store.update("native-oauth", sessionId, "GLOBAL", store.object().put("state", "SUCCESS").put("accountId", text(observed, "id")));
          return observation(observed).put("state", "SUCCESS").put("intakeCategory", category);
        }
        if (eq(saved, "state", "REJECTED") && eq(observed, "status", "disabled"))
          return observation(observed).put("state", "FAILED").put("intakeCategory", category)
              .put("failureCode", text(saved, "failureCode")).put("message", text(saved, "failureMessage"));
        return store.object().put("state", "UNKNOWN").put("message", "已保留账号及额度预留，启用结果未确认；未重复兑换或写入上游");
      }
      if (eq(saved, "state", "SUCCESS"))
        return observation(account(config, text(saved, "accountId"), key)).put("state", "SUCCESS");
    }
    return store
        .object()
        .put("state", "UNKNOWN")
        .put("message", "原操作结果仍不确定，未再次发送导入、授权兑换或凭据刷新请求，请人工核对");
  }

  private String mapped(ObjectNode config, ObjectNode resource) {
    if (!eq(resource, "targetId", text(config, "id"))) throw new ApiException(409, "资源上游目标不一致");
    String id = resource.path("upstreamAccountId").asText(resource.path("laneId").asText());
    validateId(id);
    return id;
  }

  private Set<String> existingAccountIds(ObjectNode config, String key) {
    Set<String> ids = new HashSet<>();
    for (int page = 1; page <= 500; page++) {
      ObjectNode reply =
          call(
              config,
              "GET",
              "/admin/oauth-accounts?page_mode=1&page=" + page + "&page_size=100",
              null,
              key);
      if (!reply.path("accounts").isArray()) throw invalid();
      for (JsonNode item : reply.path("accounts")) ids.add(text(item, "id"));
      if (page >= reply.path("pagination").path("total_pages").asInt(1)) return ids;
    }
    throw new ApiException(503, "上游账号核对超过上限", "RESOURCE_SYNC_LIMIT");
  }

  private void validateId(String id) {
    if (!id.matches("[A-Za-z0-9_-]{1,100}"))
      throw new ApiException(409, "请先关联有效CCMAX账号", "RESOURCE_ACCOUNT_NOT_MAPPED");
  }

  private String accountPath(String id) {
    validateId(id);
    return "/admin/oauth-accounts/" + id;
  }

  private int priority(JsonNode body) {
    if (!body.path("priority").isIntegralNumber()
        || !body.path("priority").canConvertToInt()
        || body.path("priority").asInt() < 0
        || body.path("priority").asInt() > 1000) throw new ApiException(400, "调度权重须为0至1000的整数");
    return body.path("priority").asInt();
  }

  private ObjectNode bodyWithSession(JsonNode body, String id) {
    return ((ObjectNode) body).deepCopy().put("sessionId", id);
  }

  private ApiException rejected() {
    return new ApiException(422, "CCMAX原生服务拒绝此操作，请核对账号状态", "RESOURCE_PROVIDER_REJECTED");
  }

  private ApiException invalid() {
    return new ApiException(502, "CCMAX原生响应无效，请核对原操作结果", "RESOURCE_UPSTREAM_INVALID_RESPONSE");
  }

  private ApiException unsupported() {
    return new ApiException(503, "该CCMAX原生操作尚无已验证协议，请核对支持范围", "RESOURCE_OPERATION_UNSUPPORTED");
  }

  private ApiException proxyUnsupported() {
    return new ApiException(409, "原生代理需要上游代理ID映射，当前请使用直连", "RESOURCE_OPERATION_UNSUPPORTED");
  }
}
