package com.hispread.ai;

import static com.hispread.ai.BusinessSupport.*;

import com.fasterxml.jackson.databind.*;
import com.fasterxml.jackson.databind.node.*;
import jakarta.servlet.http.HttpServletRequest;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.time.Instant;
import java.util.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/** Durable local records around explicitly configured upstream adapter operations. */
@Service
public class ResourceOperations {
  private final Store store;
  private final AuthService auth;
  private final BusinessSupport b;
  private final ResourceIntegrationGateway gateway;

  public ResourceOperations(
      Store store, AuthService auth, BusinessSupport b, ResourceIntegrationGateway gateway) {
    this.store = store;
    this.auth = auth;
    this.b = b;
    this.gateway = gateway;
  }

  private JsonNode canonical(JsonNode value) {
    if (value.isObject()) {
      ObjectNode o = b.obj();
      List<String> names = new ArrayList<>();
      value.fieldNames().forEachRemaining(names::add);
      Collections.sort(names);
      names.forEach(n -> o.set(n, canonical(value.path(n))));
      return o;
    }
    if (value.isArray()) {
      ArrayNode a = store.json.createArrayNode();
      value.forEach(n -> a.add(canonical(n)));
      return a;
    }
    return value;
  }

  private String digest(JsonNode body) {
    try {
      return HexFormat.of()
          .formatHex(
              MessageDigest.getInstance("SHA-256")
                  .digest(canonical(body).toString().getBytes(StandardCharsets.UTF_8)));
    } catch (Exception e) {
      throw new IllegalStateException(e);
    }
  }

  private void writable(HttpServletRequest req) {
    auth.require(req, auth.platform(req) ? "resource.dispatch" : "resource.write");
  }

  private ObjectNode project(ObjectNode input, String owner, HttpServletRequest req) {
    return b.eligibleForSupplier(req, owner).stream()
        .filter(x -> eq(x, "id", text(input, "projectId")))
        .findFirst()
        .orElseThrow(() -> new ApiException(409, "该供应商和项目没有唯一有效报价", "RESOURCE_QUOTE_UNAVAILABLE"));
  }

  public ObjectNode safe(ObjectNode body, HttpServletRequest req) {
    ObjectNode safe = b.publicRecord("resource", body, req);
    safe.remove(
        List.of(
            "request",
            "fingerprint",
            "proxyUrl",
            "socks5",
            "authorization",
            "adminApiKey",
            "authHeaderValue"));
    return safe;
  }

  public ObjectNode getOperation(String id, HttpServletRequest req) {
    ObjectNode op = store.get("resource-operation", id, null);
    if (eq(op, "supplierId", "GLOBAL")) {
      if (!auth.admin(req)) throw new ApiException(404, "操作不存在");
      return op;
    }
    String rid = text(op, "resourceId");
    if (!rid.isBlank()) b.resource(rid, req);
    else {
      b.access.requireSupplier(req, text(op, "supplierId"));
      if (b.member(req) && !eq(op, "createdBy", auth.userId(req)))
        throw new ApiException(404, "操作不存在");
      for (JsonNode item : op.path("items")) b.resource(text(item, "resourceId"), req);
    }
    return op;
  }

  public List<ObjectNode> listOperations(String type, HttpServletRequest req) {
    List<ObjectNode> out = new ArrayList<>();
    for (ObjectNode op : store.list("resource-operation", null))
      if (eq(op, "type", type))
        try {
          getOperation(text(op, "id"), req);
          ObjectNode row = safe(op, req);
          row.remove(
              List.of(
                  "request", "result", "fingerprint", "targetId", "upstreamPath", "upstreamId"));
          out.add(row);
        } catch (ApiException denied) {
        }
    return out;
  }

  private ObjectNode resourceInput(ObjectNode resource) {
    ObjectNode input =
        b.pick(
            resource,
            "accountName",
            "projectId",
            "credentialMode",
            "proxyId",
            "remark",
            "expiresAt",
            "version");
    try {
      ObjectNode secret =
          store.get("resource-secret", text(resource, "id"), text(resource, "supplierId"));
      for (String field : List.of("accessToken", "refreshToken", "sessionKey"))
        if (secret.has(field)) input.set(field, secret.get(field));
    } catch (ApiException ignored) {
    }
    return input;
  }

  private void persistCredentials(String id, String owner, ObjectNode input) {
    ObjectNode secret = b.pick(input, "accessToken", "refreshToken", "sessionKey");
    if (secret.isEmpty()) return;
    try {
      store.get("resource-secret", id, owner);
      store.update("resource-secret", id, owner, secret);
    } catch (ApiException e) {
      if (e.status != 404) throw e;
      secret.put("id", id);
      store.create("resource-secret", owner, secret);
    }
  }

  public void saveCredentials(String id, String owner, ObjectNode input) {
    persistCredentials(id, owner, input);
  }

  private ObjectNode newResource(ObjectNode input, String owner, HttpServletRequest req) {
    required(input, "projectId");
    b.requireApprovedSupplier(req, owner);
    ObjectNode p = project(input, owner, req);
    String proxy = text(input, "proxyId");
    if (!proxy.isBlank()) {
      b.get("proxy", proxy, req);
      if (!b.entityOwner("proxy", proxy, req).equals(owner))
        throw new ApiException(409, "代理与资源必须属于同一供应商");
    }
    ObjectNode data =
        b.pick(
            input, "accountName", "projectId", "credentialMode", "proxyId", "remark", "expiresAt");
    data.put("name", text(input, "accountName"))
        .put("supplierId", owner)
        .put("projectName", text(p, "name"))
        .put("projectCategory", text(p, "category"))
        .put("projectCategoryName", text(p, "categoryName"))
        .put("resourceType", "CCMAX")
        .put("state", "DRAFT")
        .put("dispatchState", "NOT_SUBMITTED")
        .put("createdBy", auth.userId(req))
        .put("creatorId", auth.userId(req))
        .put("creatorName", text(auth.user(req), "displayName"))
        .put(
            "credentialConfigured",
            input.hasNonNull("accessToken")
                || input.hasNonNull("refreshToken")
                || input.hasNonNull("sessionKey"));
    data.set("quoteBasis", p.path("quoteBasis"));
    ObjectNode resource = store.create("resource", owner, data);
    persistCredentials(text(resource, "id"), owner, input);
    return resource;
  }

  private ObjectNode findRequest(String owner, String key, String type, HttpServletRequest req) {
    for (ObjectNode op : store.list("resource-operation", owner))
      if (eq(op, "requestKey", key) && eq(op, "type", type)) {
        getOperation(text(op, "id"), req);
        return op;
      }
    return null;
  }

  private ObjectNode invoke(
      String type,
      String resourceId,
      String owner,
      String method,
      String path,
      ObjectNode payload,
      String key,
      String targetId,
      HttpServletRequest req) {
    ObjectNode config = gateway.requireConfigured(targetId);
    if (key == null || key.isBlank()) key = UUID.randomUUID().toString();
    store.jdbc.queryForObject(
        "select pg_advisory_xact_lock(hashtext(?),hashtext(?))", (r, n) -> true, owner, key);
    String fingerprint = digest(payload);
    ObjectNode prior = findRequest(owner, key, type, req);
    if (prior != null) {
      if (!eq(prior, "fingerprint", fingerprint))
        throw new ApiException(409, "提交编号已用于不同内容", "IDEMPOTENCY_CONFLICT");
      return result(prior, req);
    }
    ObjectNode op =
        b.obj()
            .put("type", type)
            .put("supplierId", owner)
            .put("resourceId", resourceId == null ? "" : resourceId)
            .put("requestKey", key)
            .put("fingerprint", fingerprint)
            .put("targetId", text(config, "id"))
            .put("upstreamPath", path)
            .put("method", method)
            .put("state", "SUBMITTING")
            .put("status", "SUBMITTING")
            .put("createdBy", auth.userId(req))
            .put("creatorName", text(auth.user(req), "displayName"));
    op.set("request", payload);
    if (payload.path("items").isArray()) op.set("items", payload.path("items"));
    op.put("total", payload.path("items").isArray() ? payload.path("items").size() : 1);
    op = store.create("resource-operation", owner, op);
    try {
      ObjectNode response = gateway.exchange(config, method, path, payload, key);
      if (type.equals("USAGE") && response.has("amount"))
        response.put("state", response.path("state").asText("UPDATED"));
      String status = text(response, "state");
      if (status.isBlank()) status = text(response, "status");
      if (status.isBlank()
          && type.equals("OAUTH_AUTHORIZE")
          && response.hasNonNull("sessionId")
          && response.hasNonNull("authUrl")) status = "READY";
      if (status.isBlank() && type.equals("USAGE") && response.hasNonNull("amount"))
        status = "UPDATED";
      if (status.isBlank() && type.equals("SAY-HI") && response.has("ok"))
        status = response.path("ok").asBoolean() ? "SUCCESS" : "FAILED";
      if (status.isBlank())
        throw new ApiException(502, "上游未返回操作状态", "RESOURCE_UPSTREAM_INVALID_RESPONSE");
      ObjectNode patch =
          b.obj()
              .put("state", status)
              .put("status", status)
              .put("finishedAt", Instant.now().toString());
      patch.set("result", response);
      String remote = text(response, "operationId");
      if (remote.isBlank()) remote = text(response, "sessionId");
      if (remote.isBlank()) remote = text(response, "id");
      if (!remote.isBlank()) patch.put("upstreamId", remote);
      op = store.update("resource-operation", text(op, "id"), owner, patch);
      ObjectNode resourceResponse = response.deepCopy();
      if (!Set.of("SUBMIT", "DISPATCH", "OAUTH_COMPLETE").contains(type))
        resourceResponse.remove("state");
      if (type.equals("USAGE") && response.has("amount"))
        resourceResponse.set("usage", b.pick(response, "amount", "currency", "queriedAt", "state"));
      applyResource(resourceId, owner, resourceResponse, type, req);
      return result(op, req);
    } catch (ApiException e) {
      boolean unknown = e.status >= 500 || e.status == 408;
      ObjectNode patch =
          b.obj()
              .put("state", unknown ? "UNKNOWN" : "FAILED")
              .put("status", unknown ? "UNKNOWN" : "FAILED")
              .put("errorCode", e.code == null ? "RESOURCE_UPSTREAM_ERROR" : e.code)
              .put("error", "上游操作未完成，请查询原操作");
      store.update("resource-operation", text(op, "id"), owner, patch);
      if (resourceId != null
          && !resourceId.isBlank()
          && Set.of("SUBMIT", "DISPATCH", "OAUTH_COMPLETE").contains(type))
        store.update(
            "resource",
            resourceId,
            owner,
            b.obj().put("dispatchState", unknown ? "UNKNOWN" : "FAILED"));
      throw e;
    }
  }

  private void applyResource(
      String rid, String owner, ObjectNode response, String operationType, HttpServletRequest req) {
    if (rid == null || rid.isBlank()) return;
    ObjectNode update = b.obj();
    JsonNode upstream = response.path("resource").isObject() ? response.path("resource") : response;
    for (String f :
        List.of(
            "laneId",
            "laneState",
            "operationalState",
            "usage",
            "resourceData",
            "credentialConfigured",
            "creationAttempts",
            "creationRetrying",
            "creationFinished",
            "dispatchFailureReason",
            "submittedAt")) if (upstream.has(f)) update.set(f, upstream.get(f));
    String state = text(response, "state"), dispatch = text(upstream, "dispatchState");
    boolean deliveryOperation =
        Set.of("SUBMIT", "DISPATCH", "OAUTH_COMPLETE").contains(operationType);
    if (deliveryOperation
        && dispatch.isBlank()
        && Set.of("SUCCESS", "PENDING", "UNKNOWN", "FAILED").contains(state)) dispatch = state;
    if (!dispatch.isBlank()) {
      update.put("dispatchState", dispatch);
      if (dispatch.equals("SUCCESS"))
        update.put("state", "DELIVERED").put("submittedAt", Instant.now().toString());
    }
    if (!update.isEmpty()) store.update("resource", rid, owner, update);
  }

  private ObjectNode result(ObjectNode op, HttpServletRequest req) {
    ObjectNode out =
        op.path("result").isObject()
            ? (ObjectNode) op.path("result").deepCopy()
            : b.obj().put("state", text(op, "state")).put("status", text(op, "status"));
    out.put("operationId", text(op, "id"));
    if (text(op, "type").startsWith("PRIORITY")) out.put("id", text(op, "id"));
    if (Set.of("REAUTHORIZATIONS", "CREDENTIAL-REFRESH").contains(text(op, "type")))
      out.put("id", text(op, "id"));
    if (eq(op, "type", "OAUTH_AUTHORIZE")) out.put("sessionId", text(op, "id"));
    if (!text(op, "resourceId").isBlank()) out.put("resourceId", text(op, "resourceId"));
    if (Set.of("REAUTHORIZATIONS", "CREDENTIAL-REFRESH").contains(text(op, "type")))
      out.put("reauthorizationAllowed", gateway.configured());
    ObjectNode safe = safe(out, req);
    if (eq(op, "type", "OAUTH_AUTHORIZE") && out.hasNonNull("authUrl"))
      safe.set("authUrl", out.get("authUrl"));
    return safe;
  }

  @Transactional(noRollbackFor = ApiException.class)
  public ObjectNode submit(ObjectNode body, HttpServletRequest req) {
    writable(req);
    required(body, "requestKey");
    ObjectNode input = body.path("input").isObject() ? (ObjectNode) body.path("input") : body;
    String owner =
        auth.platform(req)
            ? b.tenant(req, body.has("supplierId") ? body : input)
            : b.tenant(req, input);
    gateway.requireConfigured(text(body, "targetId"));
    String key = text(body, "requestKey");
    store.jdbc.queryForObject(
        "select pg_advisory_xact_lock(hashtext(?),hashtext(?))", (r, n) -> true, owner, key);
    ObjectNode existing = findRequest(owner, key, "SUBMIT", req);
    if (existing != null) {
      if (!eq(existing, "fingerprint", digest(body)))
        throw new ApiException(409, "提交编号已用于不同资料", "IDEMPOTENCY_CONFLICT");
      return result(existing, req);
    }
    required(input, "accountName", "credentialMode");
    String mode = text(input, "credentialMode");
    if (!Set.of("REFRESH_TOKEN", "ACCESS_TOKEN", "SESSION_KEY").contains(mode))
      throw new ApiException(400, "请使用凭据方式或OAuth流程");
    required(
        input,
        mode.equals("REFRESH_TOKEN")
            ? "refreshToken"
            : mode.equals("ACCESS_TOKEN") ? "accessToken" : "sessionKey");
    ObjectNode resource = newResource(input, owner, req);
    return invoke(
        "SUBMIT",
        text(resource, "id"),
        owner,
        "POST",
        "/resources/supplier-submit",
        body,
        key,
        text(body, "targetId"),
        req);
  }

  @Transactional(noRollbackFor = ApiException.class)
  public ObjectNode action(
      String id, String action, String method, ObjectNode body, HttpServletRequest req) {
    if (action.equals("usage")) auth.require(req, "resource.usage");
    else if (action.equals("say-hi")) auth.require(req, "resource.read");
    else writable(req);
    ObjectNode resource = b.resource(id, req);
    String owner = b.entityOwner("resource", id, req);
    if (body.has("version") && body.path("version").asLong() != resource.path("version").asLong())
      throw new ApiException(409, "资源版本已变化");
    if (action.equals("oauth/supplier-retry")) {
      if (!Set.of("FAILED", "UNKNOWN", "NOT_SUBMITTED").contains(text(resource, "dispatchState")))
        throw new ApiException(409, "当前状态不可恢复授权草稿");
      return safe(
          b.update(
              "resource",
              id,
              req,
              b.pick(body, "version").put("state", "DRAFT").put("dispatchState", "NOT_SUBMITTED")),
          req);
    }
    String key = text(body, "requestKey");
    if (key.isBlank()) key = text(body, "requestId");
    if (key.isBlank()) key = id + ":" + action + ":" + resource.path("version").asLong();
    ObjectNode payload = body.deepCopy();
    String remoteAction = action;
    if (action.startsWith("reauthorizations/")) {
      String localId = action.substring("reauthorizations/".length());
      ObjectNode prior = getOperation(localId, req);
      if (!eq(prior, "resourceId", id)) throw new ApiException(404, "授权操作不存在");
      remoteAction = "reauthorizations/" + encode(text(prior, "upstreamId"));
    }
    if (action.startsWith("oauth/") && body.hasNonNull("sessionId")) {
      ObjectNode prior = getOperation(text(body, "sessionId"), req);
      if (!eq(prior, "resourceId", id)) throw new ApiException(404, "授权会话不存在");
      payload.put("sessionId", text(prior, "upstreamId"));
    }
    if (action.equals("submit")) {
      b.requireApprovedSupplier(req, owner);
      payload.set("input", resourceInput(resource));
    }
    if (action.equals("usage")) auth.require(req, "resource.usage");
    if (action.equals("oauth/supplier-authorize") || action.equals("oauth/authorize"))
      payload.set("input", resourceInput(resource));
    String type =
        (action.equals("oauth/supplier-authorize") || action.equals("oauth/authorize"))
            ? "OAUTH_AUTHORIZE"
            : (action.equals("oauth/supplier-submit") || action.equals("oauth/complete"))
                ? "OAUTH_COMPLETE"
                : action.toUpperCase(Locale.ROOT);
    return invoke(
        type,
        id,
        owner,
        method,
        "/resources/" + encode(id) + "/" + remoteAction,
        payload,
        key,
        text(body, "targetId"),
        req);
  }

  @Transactional(noRollbackFor = ApiException.class)
  public ObjectNode authorize(ObjectNode input, HttpServletRequest req) {
    writable(req);
    String owner = b.tenant(req, input);
    gateway.requireConfigured(text(input, "targetId"));
    ObjectNode resource = newResource(input, owner, req);
    String key = text(input, "requestKey");
    if (key.isBlank()) key = UUID.randomUUID().toString();
    ObjectNode request = input.deepCopy();
    if (!request.has("credentialMode")) request.put("credentialMode", "OAUTH");
    return invoke(
        "OAUTH_AUTHORIZE",
        text(resource, "id"),
        owner,
        "POST",
        "/resources/oauth/supplier-authorize",
        request,
        key,
        text(input, "targetId"),
        req);
  }

  @Transactional(noRollbackFor = ApiException.class)
  public ObjectNode session(String id, String action, ObjectNode body, HttpServletRequest req) {
    ObjectNode op = getOperation(id, req);
    if (!eq(op, "type", "OAUTH_AUTHORIZE")) throw new ApiException(404, "授权会话不存在");
    if (action.equals("get")) {
      ObjectNode remote =
          gateway.request(
              text(op, "targetId"),
              "GET",
              "/resources/oauth/supplier-session/" + encode(text(op, "upstreamId")),
              null,
              text(op, "requestKey"));
      store.update("resource-operation", id, text(op, "supplierId"), b.obj().set("result", remote));
      applyResource(text(op, "resourceId"), text(op, "supplierId"), remote, "OAUTH_COMPLETE", req);
      return result(store.get("resource-operation", id, text(op, "supplierId")), req);
    }
    writable(req);
    ObjectNode payload = body.deepCopy().put("sessionId", text(op, "upstreamId"));
    if (action.equals("complete"))
      payload.set("input", resourceInput(b.resource(text(op, "resourceId"), req)));
    String path =
        action.equals("cancel")
            ? "/resources/oauth/supplier-session/" + encode(text(op, "upstreamId")) + "/cancel"
            : "/resources/oauth/supplier-submit";
    return invoke(
        action.equals("cancel") ? "OAUTH_CANCEL" : "OAUTH_COMPLETE",
        text(op, "resourceId"),
        text(op, "supplierId"),
        "POST",
        path,
        payload,
        id + ":" + action,
        text(op, "targetId"),
        req);
  }

  public ObjectNode operation(String id, HttpServletRequest req) {
    ObjectNode op = getOperation(id, req);
    return result(op, req);
  }

  @Transactional(noRollbackFor = ApiException.class)
  public ObjectNode reconcile(String id, HttpServletRequest req) {
    writable(req);
    ObjectNode op = getOperation(id, req);
    String path = text(op, "upstreamPath");
    String remote = text(op, "upstreamId");
    if (remote.isBlank()) remote = text(op, "requestKey");
    ObjectNode response =
        gateway.request(
            text(op, "targetId"),
            "GET",
            path + "/operations/" + encode(remote),
            null,
            text(op, "requestKey"));
    ObjectNode patch =
        b.obj()
            .put("state", response.path("state").asText(response.path("status").asText("UNKNOWN")));
    patch.set("result", response);
    ObjectNode updated = store.update("resource-operation", id, text(op, "supplierId"), patch);
    applyResource(text(op, "resourceId"), text(op, "supplierId"), response, text(op, "type"), req);
    return result(updated, req);
  }

  public ObjectNode current(String rid, String type, HttpServletRequest req) {
    b.resource(rid, req);
    for (ObjectNode op : store.list("resource-operation", b.entityOwner("resource", rid, req)))
      if (eq(op, "resourceId", rid) && eq(op, "type", type)) return result(op, req);
    return b.obj()
        .put("status", "NONE")
        .put("state", "NONE")
        .put("reauthorizationAllowed", gateway.configured());
  }

  @Transactional(noRollbackFor = ApiException.class)
  public ObjectNode job(String type, ObjectNode body, HttpServletRequest req) {
    writable(req);
    required(body, "requestKey");
    if (!body.path("items").isArray()
        || body.path("items").isEmpty()
        || body.path("items").size() > 100) throw new ApiException(400, "每批应包含1至100个资源");
    String owner = null;
    for (JsonNode item : body.path("items")) {
      String rid = text(item, "resourceId");
      ObjectNode resource = b.resource(rid, req);
      String next = b.entityOwner("resource", rid, req);
      if (owner == null) owner = next;
      else if (!owner.equals(next)) throw new ApiException(400, "一批操作仅支持同一供应商");
      if (item.has("resourceVersion")
          && item.path("resourceVersion").asLong() != resource.path("version").asLong())
        throw new ApiException(409, "资源版本已变化");
      if (item.has("version") && item.path("version").asLong() != resource.path("version").asLong())
        throw new ApiException(409, "资源版本已变化");
      if (type.equals("LIFECYCLE")
          && !Set.of("PAUSE", "RESUME", "REMOVE").contains(text(body, "action")))
        throw new ApiException(400, "不支持的资源生命周期操作");
      if (type.equals("PROXY_REPLACEMENT") && item.hasNonNull("proxyUrl")) {
        auth.require(req, "proxy.read");
        auth.require(req, "proxy.write");
        try {
          java.net.URI proxy = java.net.URI.create(text(item, "proxyUrl"));
          if (!Set.of("http", "https", "socks5").contains(proxy.getScheme())
              || proxy.getHost() == null
              || proxy.getPort() < 1) throw new IllegalArgumentException();
        } catch (Exception e) {
          throw new ApiException(400, "代理URL无效");
        }
      }
      if (item.hasNonNull("proxyId")) {
        b.get("proxy", text(item, "proxyId"), req);
        if (!b.entityOwner("proxy", text(item, "proxyId"), req).equals(next))
          throw new ApiException(409, "代理与资源不属于同一供应商");
      }
    }
    String path =
        type.equals("LIFECYCLE") ? "/resource-lifecycle-jobs" : "/resource-proxy-replacements";
    ObjectNode response =
        invoke(
            type,
            null,
            owner,
            "POST",
            path,
            body,
            text(body, "requestKey"),
            text(body, "targetId"),
            req);
    String id = text(response, "operationId");
    ObjectNode op = getOperation(id, req);
    ObjectNode publicOp = safe(op, req);
    publicOp.set(
        "items",
        op.path("result").path("items").isArray()
            ? op.path("result").path("items")
            : op.path("items"));
    publicOp.put("id", id);
    publicOp.remove(
        List.of("request", "result", "fingerprint", "upstreamPath", "targetId", "upstreamId"));
    return safe(publicOp, req);
  }

  public ObjectNode jobDetail(String id, HttpServletRequest req) {
    ObjectNode op = getOperation(id, req), out = safe(op, req);
    out.remove(List.of("request", "fingerprint", "upstreamPath", "targetId", "upstreamId"));
    if (op.path("result").isObject()) {
      JsonNode result = op.path("result");
      for (String field :
          List.of(
              "state", "items", "completedCount", "failedCount", "successCount", "unknownCount"))
        if (result.has(field)) out.set(field, result.path(field));
    }
    return safe(out, req);
  }

  @Transactional
  public ObjectNode recovery(String id, ObjectNode body, HttpServletRequest req) {
    writable(req);
    ObjectNode resource = b.resource(id, req);
    if (!body.path("confirmedNotCreated").asBoolean()
        || !Set.of("FAILED", "UNKNOWN").contains(text(resource, "dispatchState")))
      throw new ApiException(409, "请先核实上游未创建该资源");
    ObjectNode patch = b.pick(body, "version");
    patch.put("dispatchState", "FAILED").put("creationFinished", true);
    if (eq(body, "action", "DELETE")) patch.put("deleted", true);
    ObjectNode saved = b.update("resource", id, req, patch);
    return b.obj()
        .put("deleted", saved.path("deleted").asBoolean())
        .set("resource", safe(saved, req));
  }

  @Transactional(noRollbackFor = ApiException.class)
  public ObjectNode priority(ObjectNode body, HttpServletRequest req) {
    if (!auth.admin(req)) throw new ApiException(403, "仅最高管理员可调整批量优先级");
    auth.require(req, "resource.dispatch");
    if (body.path("priority").asInt(-1) < 0 || body.path("priority").asInt() > 1000)
      throw new ApiException(400, "优先级须在0至1000之间");
    ObjectNode payload = body.deepCopy();
    String key = text(body, "requestKey");
    if (key.isBlank()) key = UUID.randomUUID().toString();
    return invoke(
        "PRIORITY",
        null,
        "GLOBAL",
        "POST",
        "/cc-intake/admin/priority/jobs",
        payload,
        key,
        text(body, "targetId"),
        req);
  }

  @Transactional(noRollbackFor = ApiException.class)
  public ObjectNode priorityAction(String id, String action, HttpServletRequest req) {
    if (!auth.admin(req)) throw new ApiException(403, "仅最高管理员可调整批量优先级");
    ObjectNode op = store.get("resource-operation", id, "GLOBAL");
    return invoke(
        "PRIORITY_" + action,
        null,
        "GLOBAL",
        "POST",
        "/cc-intake/admin/priority/jobs/" + encode(text(op, "upstreamId")) + "/" + action,
        b.obj(),
        id + ":" + action,
        text(op, "targetId"),
        req);
  }

  public static String encode(String value) {
    return java.net.URLEncoder.encode(value, StandardCharsets.UTF_8);
  }
}
