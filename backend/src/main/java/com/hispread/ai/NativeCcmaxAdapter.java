package com.hispread.ai;

import static com.hispread.ai.BusinessSupport.*;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.node.*;
import java.net.URI;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;

final class NativeCcmaxAdapter {
  interface Transport {
    ObjectNode send(ObjectNode config, String method, String path, JsonNode body, String key);
  }

  private record Session(String token, long expiresAt, long version) {}

  private final Map<String, Session> sessions = new ConcurrentHashMap<>();
  private final Store store;
  private final Transport transport;

  NativeCcmaxAdapter(Store store, Transport transport) {
    this.store = store;
    this.transport = transport;
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
    if (path.equals("/oauth/link") || path.equals("/resources/oauth/supplier-authorize"))
      return authorize(config, body, text(body, "localResourceId"), key);
    if (path.equals("/oauth/complete") || path.equals("/resources/oauth/supplier-submit"))
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
    if (path.equals("/priority-batch") || path.equals("/priority-batch/reconcile"))
      return priorities(config, body, key, path.endsWith("/reconcile"));
    if (path.equals("/jobs/ccmax/status-sync") || path.equals("/resources/sync"))
      return statusSync(config, body, key);
    if (path.equals("/jobs/ccmax/daily-sync")) return dailySync(config, body, key);
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
      ObjectNode refreshed =
          call(config, "POST", accountPath(accountId) + "/refresh-usage", store.object(), key);
      requireOk(refreshed);
      ObjectNode observed = observation(account(config, accountId, key));
      ObjectNode query = store.object();
      query.putArray("resources").addObject().put("resourceId", localId)
          .put("supplierId", text(resource, "supplierId"));
      observed.set("dailyConsumption", todayConsumption(config, query, key).get(localId));
      return observed;
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
      int weight = priority(body);
      call(config, "PATCH", accountPath(accountId), store.object().put("weight", weight), key);
      ObjectNode observed = account(config, accountId, key);
      if (observed.path("weight").asInt(-1) != weight) throw invalid();
      return observation(observed).put("state", "UPDATED");
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

  private synchronized Session login(ObjectNode config) {
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
    data.put("upstreamProtocol", "CCMAX_NATIVE");
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
    requireReadySession(session);
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
    if (bound.isBlank() && !eq(observed, "status", "active"))
      throw new ApiException(502, "新账号未处于可用状态，未确认交付成功", "RESOURCE_UPSTREAM_INVALID_RESPONSE");
    if (!bound.isBlank() && !eq(observed, "status", text(session, "originalStatus")))
      throw new ApiException(502, "重新授权改变了账号启停状态，请核对原账号", "RESOURCE_UPSTREAM_INVALID_RESPONSE");
    store.update(
        "native-oauth",
        sessionId,
        "GLOBAL",
        store.object().put("state", "SUCCESS").put("accountId", accountId));
    return observation(observed)
        .put("state", "SUCCESS")
        .put("credentialConfigured", true)
        .put("existingAccountUpdated", reply.path("overwritten").asBoolean());
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
    JsonNode input = body.path("input").isObject() ? body.path("input") : body;
    if (!text(input, "proxyUrl").isBlank()) throw proxyUnsupported();
    if (!text(body, "localResourceId").isBlank()) {
      ObjectNode local = store.get("resource", text(body, "localResourceId"), null);
      if (!text(local, "laneId").isBlank()) throw new ApiException(409, "已有账号关联不可作为新增交付再次提交");
    }
    Set<String> existingIds = existingAccountIds(config, key);
    ObjectNode payload =
        store
            .object()
            .put("name", text(input, "accountName"))
            .put("inference_backend", "native")
            .put("outbound_proxy_mode", "direct")
            .put("overwrite_existing", false);
    String mode = text(input, "credentialMode"), path;
    if (Set.of("REFRESH_TOKEN", "ACCESS_TOKEN").contains(mode)) {
      if (mode.equals("REFRESH_TOKEN")) payload.put("refresh_token", text(input, "refreshToken"));
      else payload.put("access_token", text(input, "accessToken"));
      path = "/admin/oauth-accounts/import-rt";
    } else if (mode.equals("SESSION_KEY")) {
      payload.putArray("session_keys").add(text(input, "sessionKey"));
      payload.putObject("proxy_source").put("mode", "direct");
      path = "/admin/oauth-accounts/import-by-session-key/batch";
    } else throw unsupported();
    ObjectNode reply = call(config, "POST", path, payload, key);
    JsonNode imported = reply;
    if (mode.equals("SESSION_KEY")) {
      if (reply.path("ok").asInt() != 1 || reply.path("results").size() != 1) throw rejected();
      imported = reply.path("results").get(0);
      if (!imported.path("ok").asBoolean()) throw rejected();
    }
    String id = imported.path("id").asText(imported.path("account_id").asText());
    if (imported.path("overwritten").asBoolean() || existingIds.contains(id))
      throw new ApiException(409, "上游更新了已有账号，未记为新增交付", "RESOURCE_EXISTING_ACCOUNT_UPDATED");
    ObjectNode observed = account(config, id, key);
    if (!eq(observed, "status", "active"))
      throw new ApiException(502, "导入账号未处于可用状态，未确认交付成功", "RESOURCE_UPSTREAM_INVALID_RESPONSE");
    return observation(observed)
        .put("state", "SUCCESS")
        .put("credentialConfigured", true)
        .put("existingAccountUpdated", imported.path("overwritten").asBoolean());
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

  private ObjectNode priorities(ObjectNode config, JsonNode body, String key, boolean readOnly) {
    int weight = priority(body);
    if (!body.path("items").isArray()
        || body.path("items").isEmpty()
        || body.path("items").size() > 100) throw new ApiException(400, "优先级参数无效");
    ObjectNode result = store.object();
    ArrayNode items = result.putArray("items");
    int success = 0, failed = 0;
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
      boolean writeAccepted = false;
      try {
        if (!readOnly) {
          call(config, "PATCH", accountPath(id), store.object().put("weight", weight), key);
          writeAccepted = true;
        }
        if (account(config, id, key).path("weight").asInt(-1) != weight) throw invalid();
        item.put("state", "SUCCESS");
        success++;
      } catch (ApiException error) {
        boolean rejected = !readOnly && !writeAccepted
            && error.status >= 400 && error.status < 500 && error.status != 408;
        if (rejected) failed++;
        item.put("state", rejected ? "FAILED" : "UNKNOWN")
            .put("errorCode", error.code)
            .put("errorMessage", error.getMessage());
      }
    }
    result
        .putObject("counts")
        .put("SUCCESS", success)
        .put("FAILED", failed)
        .put("UNKNOWN", items.size() - success - failed);
    return result
        .put("total", items.size())
        .put("state", success + failed < items.size() ? "UNKNOWN"
            : failed == items.size() ? "FAILED" : failed > 0 ? "PARTIAL_FAILED" : "COMPLETED");
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
      ObjectNode observed = observation(account(config, mapped(config, local), key));
      ObjectNode row =
          resources
              .addObject()
              .put("resourceId", rid)
              .put("supplierId", text(local, "supplierId"))
              .put("operationalState", text(observed, "operationalState"))
              .put("priority", observed.path("upstreamPriority").asInt());
      if (observed.has("usage")) row.set("usage", observed.get("usage"));
      row.set("resourceData", observed.path("resourceData"));
    }
    ObjectNode query = store.object();
    query.set("resources", requested);
    Map<String, ObjectNode> daily = todayConsumption(config, query, key);
    for (JsonNode row : resources)
      ((ObjectNode) row).set("dailyConsumption", daily.get(text(row, "resourceId")));
    return result;
  }

  private Map<String, ObjectNode> todayConsumption(ObjectNode config, ObjectNode query, String key) {
    String day = BusinessSupport.today();
    query.put("businessDate", day);
    ObjectNode amounts = dailySync(config, query, key);
    Map<String, java.math.BigDecimal> totals = new LinkedHashMap<>();
    for (JsonNode resource : query.path("resources")) totals.put(text(resource, "resourceId"), java.math.BigDecimal.ZERO);
    for (JsonNode row : amounts.path("rows"))
      totals.merge(text(row, "resourceId"), new java.math.BigDecimal(text(row, "originalAmount")), java.math.BigDecimal::add);
    Map<String, ObjectNode> out = new LinkedHashMap<>();
    String now = Instant.now().toString();
    totals.forEach((id, amount) -> out.put(id, store.object().put("businessDate", day)
        .put("currency", "USD").put("amount", amount.toPlainString())
        .put("basis", "UPSTREAM_REQUEST_LOG_OFFICIAL_TOTAL").put("queriedAt", now)));
    return out;
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
      } else {
        ObjectNode query = store.object();
        query.putArray("resources").addObject().put("resourceId", rid).put("supplierId", text(local, "supplierId"));
        observed.set("dailyConsumption", todayConsumption(config, query, key).get(rid));
      }
      return observed;
    }
    if (type.equals("OAUTH_COMPLETE")) {
      String sessionId = text(operation.path("request"), "sessionId");
      ObjectNode saved = session(config, sessionId);
      if (eq(saved, "state", "SUCCESS"))
        return observation(account(config, text(saved, "accountId"), key)).put("state", "SUCCESS");
    }
    return store
        .object()
        .put("state", "UNKNOWN")
        .put("message", "原操作结果仍不确定，未再次发送导入、授权兑换或凭据刷新请求，请人工核对");
  }

  private ObjectNode dailySync(ObjectNode config, JsonNode body, String key) {
    long deadline = System.nanoTime() + 120000000000L;
    java.time.LocalDate day;
    try {
      day = java.time.LocalDate.parse(text(body, "businessDate"));
    } catch (RuntimeException error) {
      throw new ApiException(400, "采集日期无效");
    }
    java.time.ZoneId zone = java.time.ZoneId.of("Asia/Shanghai");
    Instant since = day.atStartOfDay(zone).toInstant(),
        until = day.plusDays(1).atStartOfDay(zone).toInstant();
    Map<String, ObjectNode> resources = new HashMap<>();
    for (JsonNode item : body.path("resources")) {
      ObjectNode local = store.get("resource", text(item, "resourceId"), null);
      if (!eq(local, "supplierId", text(item, "supplierId"))) throw invalid();
      String accountId = mapped(config, local);
      if (resources.putIfAbsent(accountId, local) != null)
        throw new ApiException(409, "同一账号存在重复映射");
    }
    ObjectNode out = store.object().put("state", "SUCCESS");
    ArrayNode rows = out.putArray("rows");
    if (resources.isEmpty()) return out;
    Map<String, java.math.BigDecimal> totals = new LinkedHashMap<>();
    Set<String> seen = new HashSet<>();
    String cursor = "", cursorAt = "";
    for (int page = 0; page < 500; page++) {
      if (System.nanoTime() >= deadline)
        throw new ApiException(503, "日账采集超过单次时间上限，未确认完整批次，请稍后重试", "RESOURCE_SYNC_LIMIT");
      String path =
          "/admin/request-logs?mode=cursor&limit=100&since="
              + ResourceOperations.encode(since.toString())
              + "&until="
              + ResourceOperations.encode(until.toString());
      if (!cursor.isBlank())
        path +=
            "&cursor_id="
                + ResourceOperations.encode(cursor)
                + "&cursor_at="
                + ResourceOperations.encode(cursorAt);
      ObjectNode reply = call(config, "GET", path, null, key);
      JsonNode logs = reply.path("logs").isArray() ? reply.path("logs") : reply.path("items");
      if (!logs.isArray()) throw invalid();
      for (JsonNode log : logs) {
        String id = text(log, "id"),
            accountId = log.path("account_id").asText(log.path("oauth_account_id").asText());
        if (id.isBlank() || !seen.add(id)) throw invalid();
        if (!resources.containsKey(accountId)) continue;
        Instant created;
        try {
          created = Instant.parse(text(log, "created_at"));
        } catch (RuntimeException error) {
          throw invalid();
        }
        if (created.isBefore(since) || !created.isBefore(until)) throw invalid();
        if (log.path("billing_evaluation_failed").asBoolean()) throw invalid();
        String model = text(log, "request_model");
        if (model.isBlank() || model.length() > 160) throw invalid();
        java.math.BigDecimal cost;
        try {
          cost = new java.math.BigDecimal(log.path("cost_official_usd").asText());
        } catch (RuntimeException error) {
          throw invalid();
        }
        if (cost.signum() < 0 || cost.precision() > 30 || cost.scale() > 8) throw invalid();
        totals.merge(accountId + "\n" + model, cost, java.math.BigDecimal::add);
      }
      JsonNode next = reply.path("cursor");
      if (next.isNull() || next.isMissingNode()) break;
      String nextId = text(next, "id"),
          nextAt = next.path("createdAt").asText(next.path("created_at").asText());
      if (nextId.isBlank() || nextAt.isBlank() || nextId.equals(cursor)) throw invalid();
      cursor = nextId;
      cursorAt = nextAt;
      if (page == 499) throw new ApiException(503, "日账超过单次采集上限，请缩小范围", "RESOURCE_SYNC_LIMIT");
    }
    for (var entry : totals.entrySet()) {
      String[] identity = entry.getKey().split("\n", 2);
      ObjectNode local = resources.get(identity[0]);
      rows.addObject()
          .put("resourceId", text(local, "id"))
          .put("supplierId", text(local, "supplierId"))
          .put("businessDate", day.toString())
          .put("model", identity[1])
          .put("currency", "USD")
          .put("originalAmount", entry.getValue().toPlainString());
    }
    return out;
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

  private void requireOk(JsonNode data) {
    if (!data.path("ok").isBoolean() || !data.path("ok").asBoolean()) throw rejected();
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
