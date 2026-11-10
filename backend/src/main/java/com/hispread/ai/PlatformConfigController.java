package com.hispread.ai;

import static com.hispread.ai.BusinessSupport.*;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.node.*;
import jakarta.servlet.http.HttpServletRequest;
import java.time.Instant;
import java.util.*;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.MultiValueMap;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api")
public class PlatformConfigController {
  private final Store s;
  private final AuthService a;
  private final BusinessSupport b;
  private final AccessPolicy access;
  private final FinancialReportService reports;
  private final ResourceIntegrationGateway resources;
  private final PayoutProviderGateway payouts;
  private final PaymentExecutionGateway execution;
  private final MonitoringService monitoring;

  public PlatformConfigController(
      Store s,
      AuthService a,
      BusinessSupport b,
      AccessPolicy access,
      FinancialReportService reports,
      ResourceIntegrationGateway resources,
      PayoutProviderGateway payouts,
      PaymentExecutionGateway execution,
      MonitoringService monitoring) {
    this.s = s;
    this.a = a;
    this.b = b;
    this.access = access;
    this.reports = reports;
    this.resources = resources;
    this.payouts = payouts;
    this.execution = execution;
    this.monitoring = monitoring;
  }

  private void guard(HttpServletRequest r, String permission) {
    a.requirePlatform(r, permission);
    if (!a.admin(r)) throw new ApiException(403, "此配置仅最高管理员可访问");
  }

  private void guardAny(HttpServletRequest r, String... permissions) {
    if (!a.admin(r)) throw new ApiException(403, "此配置仅最高管理员可访问");
    Set<String> granted = new HashSet<>();
    for (JsonNode permission : a.user(r).path("permissions")) granted.add(permission.asText());
    for (String permission : permissions) if (granted.contains(permission)) return;
    throw new ApiException(403, "当前账号无此操作权限");
  }

  private List<ObjectNode> users() {
    return s.jdbc.query(
        "select profile from hub_user where enabled=true",
        (rs, n) -> {
          ObjectNode u = s.parse(rs.getString(1));
          String supplier = text(u, "supplierId");
          if (!supplier.isBlank())
            try {
              u.put("supplierName", text(s.get("supplier", supplier, null), "name"));
            } catch (ApiException ignored) {
            }
          return u;
        });
  }

  private List<ObjectNode> recipients(JsonNode notice) {
    String audience = text(notice, "audience");
    Set<String> projects = new HashSet<>();
    for (JsonNode p : notice.path("quoteProjectIds")) projects.add(p.asText());
    Set<String> suppliers = new HashSet<>();
    if (!projects.isEmpty())
      for (ObjectNode q : s.list("quote", null))
        if (projects.contains(text(q, "projectId"))) suppliers.add(text(q, "supplierId"));
    return users().stream()
        .filter(
            u ->
                switch (audience) {
                  case "DIRECT" -> eq(u, "id", text(notice, "targetUserId"));
                  case "PLATFORM" -> u.path("supplierId").isNull();
                  case "SUPPLIERS" -> !text(u, "supplierId").isBlank();
                  case "SUPPLIER_ADMINS" -> eq(u, "role", "SUPPLIER");
                  case "ALL" -> true;
                  default -> false;
                })
        .filter(u -> projects.isEmpty() || suppliers.contains(text(u, "supplierId")))
        .toList();
  }

  @GetMapping("/notifications/notice-recipients")
  public Object recipientList(HttpServletRequest r) {
    guard(r, "notification.publish");
    return users();
  }

  @GetMapping("/notifications/quote-projects")
  public Object quoteProjects(@RequestParam Map<String, String> q, HttpServletRequest r) {
    guard(r, "notification.publish");
    Set<String> ids = new HashSet<>();
    for (ObjectNode quote : s.list("quote", null)) ids.add(text(quote, "projectId"));
    return b.page(
        s.list("project", null).stream()
            .filter(
                p -> ids.contains(text(p, "id")) && b.contains(p, q.get("search"), "name", "code"))
            .toList(),
        q);
  }

  @GetMapping("/notifications/recipient-preview")
  public Object recipientPreview(
      @RequestParam MultiValueMap<String, String> params, HttpServletRequest r) {
    guard(r, "notification.publish");
    Map<String, String> q = params.toSingleValueMap();
    ObjectNode notice = s.json.valueToTree(q);
    notice.set(
        "quoteProjectIds", s.json.valueToTree(params.getOrDefault("quoteProjectIds", List.of())));
    return b.page(recipients(notice), q);
  }

  @GetMapping("/notifications/notices")
  public Object notices(@RequestParam Map<String, String> q, HttpServletRequest r) {
    guard(r, "notification.publish");
    return b.page(
        s.list("notice", null).stream()
            .filter(
                n ->
                    b.contains(n, q.get("search"), "title", "body")
                        && b.match(n, q, "status", "status"))
            .map(this::noticeView)
            .toList(),
        q);
  }

  @GetMapping("/notifications/notices/{id}")
  public Object notice(@PathVariable String id, HttpServletRequest r) {
    guard(r, "notification.publish");
    return noticeView(s.get("notice", id, null));
  }

  private ObjectNode noticeView(ObjectNode notice) {
    ObjectNode out = notice.deepCopy();
    List<ObjectNode> deliveries =
        s.list("notice-delivery", null).stream()
            .filter(d -> eq(d, "noticeId", text(notice, "id")))
            .toList();
    if (!deliveries.isEmpty()) {
      long read = deliveries.stream().filter(d -> notificationRead(d)).count();
      out.put("recipientCount", deliveries.size()).put("readCount", read);
    }
    ArrayNode projects = out.putArray("quoteProjects");
    for (JsonNode id : notice.path("quoteProjectIds"))
      try {
        projects.add(s.get("project", id.asText(), null));
      } catch (ApiException ignored) {
      }
    return out;
  }

  private boolean notificationRead(ObjectNode delivery) {
    try {
      return s.get("notification", text(delivery, "notificationId"), null).hasNonNull("readAt");
    } catch (ApiException ignored) {
      return delivery.hasNonNull("readAt");
    }
  }

  private ObjectNode noticeInput(ObjectNode body) {
    required(body, "title", "body", "audience");
    if (!Set.of("ALL", "PLATFORM", "SUPPLIERS", "SUPPLIER_ADMINS", "DIRECT")
        .contains(text(body, "audience"))) throw new ApiException(400, "无效通知范围");
    if (text(body, "title").length() > 200 || text(body, "body").length() > 10000)
      throw new ApiException(400, "通知内容过长");
    if (eq(body, "audience", "DIRECT")) {
      required(body, "targetUserId");
      a.findUser(text(body, "targetUserId"));
    }
    ObjectNode out =
        b.pick(body, "title", "body", "audience", "targetUserId", "quoteProjectIds", "version");
    if (!out.has("quoteProjectIds")) out.putArray("quoteProjectIds");
    if (!out.path("quoteProjectIds").isArray()) throw new ApiException(400, "报价项目需为数组");
    return out;
  }

  @PostMapping("/notifications/notices")
  public Object createNotice(@RequestBody ObjectNode body, HttpServletRequest r) {
    guard(r, "notification.publish");
    ObjectNode d =
        noticeInput(body)
            .put("status", "DRAFT")
            .put("createdBy", a.userId(r))
            .put("recipientCount", 0)
            .put("readCount", 0);
    return s.create("notice", "GLOBAL", d);
  }

  @PutMapping("/notifications/notices/{id}")
  public Object edit(@PathVariable String id, @RequestBody ObjectNode body, HttpServletRequest r) {
    guard(r, "notification.publish");
    if (!eq(s.get("notice", id, null), "status", "DRAFT")) throw new ApiException(409, "仅可修改草稿");
    return s.update("notice", id, null, noticeInput(body));
  }

  @PostMapping("/notifications/publish")
  @Transactional
  public Object publish(@RequestBody ObjectNode body, HttpServletRequest r) {
    ObjectNode n = (ObjectNode) createNotice(body, r);
    return publishId(text(n, "id"), r);
  }

  @PostMapping("/notifications/notices/{id}/publish")
  @Transactional
  public Object publishId(@PathVariable String id, HttpServletRequest r) {
    guard(r, "notification.publish");
    s.jdbc.queryForObject(
        "select pg_advisory_xact_lock(hashtextextended(?,0))",
        Object.class,
        "notice-publish:" + id);
    ObjectNode n = s.get("notice", id, null);
    if (!eq(n, "status", "DRAFT")) throw new ApiException(409, "通知已发布或撤回");
    List<ObjectNode> recipients = recipients(n);
    for (ObjectNode u : recipients) {
      ObjectNode d =
          s.object()
              .put("userId", text(u, "id"))
              .put("title", text(n, "title"))
              .put("body", text(n, "body"))
              .put("eventType", "SYSTEM_NOTICE")
              .put("targetPath", "notifications")
              .put("noticeId", id)
              .putNull("readAt");
      ObjectNode sent = s.create("notification", text(u, "id"), d);
      ObjectNode delivery =
          s.object()
              .put("noticeId", id)
              .put("notificationId", text(sent, "id"))
              .put("userId", text(u, "id"))
              .put("username", text(u, "username"))
              .put("displayName", text(u, "displayName"))
              .put("supplierName", text(u, "supplierName"))
              .put("state", "UNREAD");
      s.create("notice-delivery", "GLOBAL", delivery);
    }
    s.update(
        "notice",
        id,
        null,
        s.object()
            .put("status", "PUBLISHED")
            .put("publishedAt", Instant.now().toString())
            .put("recipientCount", recipients.size()));
    return Map.of("recipientCount", recipients.size());
  }

  @PostMapping("/notifications/notices/{id}/revoke")
  @Transactional
  public Object revoke(@PathVariable String id, HttpServletRequest r) {
    guard(r, "notification.publish");
    s.get("notice", id, null);
    int count = 0;
    for (ObjectNode n : s.list("notification", null))
      if (eq(n, "noticeId", id) && !n.hasNonNull("readAt")) {
        s.delete("notification", text(n, "id"), null);
        count++;
      }
    for (ObjectNode d : s.list("notice-delivery", null))
      if (eq(d, "noticeId", id) && !notificationRead(d))
        s.update("notice-delivery", text(d, "id"), null, s.object().put("state", "WITHDRAWN"));
    s.update("notice", id, null, s.object().put("status", "REVOKED"));
    return Map.of("removedUnreadCount", count);
  }

  @GetMapping("/notifications/notices/{id}/deliveries")
  public Object deliveries(
      @PathVariable String id, @RequestParam Map<String, String> q, HttpServletRequest r) {
    guard(r, "notification.publish");
    s.get("notice", id, null);
    List<ObjectNode> list = new ArrayList<>();
    for (ObjectNode d : s.list("notice-delivery", null))
      if (eq(d, "noticeId", id)) {
        ObjectNode row = d.deepCopy();
        if (notificationRead(d)) row.put("state", "READ").put("readAt", "recorded");
        list.add(row);
      }
    if (list.isEmpty())
      for (ObjectNode n : s.list("notification", null))
        if (eq(n, "noticeId", id)) {
          ObjectNode d = n.deepCopy();
          try {
            d.setAll(a.findUser(text(n, "userId")));
          } catch (ApiException ignored) {
          }
          d.put("state", n.hasNonNull("readAt") ? "READ" : "UNREAD");
          list.add(d);
        }
    ObjectNode
        out =
            b.page(
                list.stream()
                    .filter(
                        d ->
                            b.contains(
                                    d, q.get("search"), "username", "displayName", "supplierName")
                                && b.match(d, q, "state", "state"))
                    .toList(),
                q),
        summary =
            s.object()
                .put("recipientCount", list.size())
                .put("readCount", list.stream().filter(n -> n.hasNonNull("readAt")).count())
                .put("unreadCount", list.stream().filter(n -> !n.hasNonNull("readAt")).count())
                .put(
                    "withdrawnCount",
                    list.stream().filter(n -> eq(n, "state", "WITHDRAWN")).count());
    out.set("summary", summary);
    return out;
  }

  @GetMapping("/resource-targets")
  public Object targets(HttpServletRequest r) {
    guard(r, "resource.config.read");
    return s.list("resource-target", null).stream().map(this::targetView).toList();
  }

  private ObjectNode targetView(ObjectNode target) {
    ObjectNode out = target.deepCopy();
    out.put("apiKeyConfigured", !text(out, "apiKey").isBlank());
    out.remove("apiKey");
    return out;
  }

  private ObjectNode configInput(ObjectNode body, ObjectNode previous, boolean monitoring) {
    ObjectNode out = previous == null ? s.object() : previous.deepCopy();
    for (String field :
        monitoring
            ? List.of(
                "name",
                "category",
                "groupName",
                "endpoint",
                "authType",
                "authHeader",
                "newApiUserId",
                "rpmPath",
                "tpmPath",
                "windowSecondsPath",
                "updatedAtPath",
                "intervalSeconds",
                "sortOrder",
                "enabled",
                "supplierVisible",
                "includeInTotal",
                "version")
            : List.of(
                "name",
                "baseUrl",
                "allowHttp",
                "enabled",
                "upstreamPathPrefix",
                "version",
                "protocol",
                "newApiUserId",
                "defaultTarget",
                "timeoutMs")) if (body.has(field)) out.set(field, body.get(field));
    String secret = monitoring ? "token" : "apiKey";
    if (body.has(secret) && !text(body, secret).isBlank()) out.put(secret, text(body, secret));
    if (body.path("clearToken").asBoolean() || body.path("clearApiKey").asBoolean())
      out.remove(secret);
    required(out, "name", monitoring ? "endpoint" : "baseUrl");
    if (text(out, "name").length() > 160) throw new ApiException(400, "配置名称过长");
    if (monitoring) {
      int interval = out.path("intervalSeconds").asInt(30);
      if (interval < 2 || interval > 3600) throw new ApiException(400, "采集周期须为2至3600秒");
      out.put("intervalSeconds", interval);
      if (text(out, "rpmPath").isBlank() && text(out, "tpmPath").isBlank())
        throw new ApiException(400, "请至少配置RPM或TPM字段路径");
      this.monitoring.validate(out);
    }
    if (!monitoring) {
      String protocol = out.path("protocol").asText("CUSTOM");
      if (!Set.of("CUSTOM", "NEWAPI").contains(protocol))
        throw new ApiException(400, "资源协议须为CUSTOM或NEWAPI");
      out.put("protocol", protocol);
      if (protocol.equals("NEWAPI") && !text(out, "newApiUserId").matches("[1-9][0-9]{0,18}"))
        throw new ApiException(400, "New API需要有效管理员用户ID");
      int timeout = out.path("timeoutMs").asInt(15000);
      if (timeout < 1000 || timeout > 120000) throw new ApiException(400, "资源超时须为1000至120000毫秒");
      out.put("timeoutMs", timeout);
      String prefix = out.path("upstreamPathPrefix").asText("/api");
      if (!prefix.matches("(?:/[A-Za-z0-9_-]+)*")) throw new ApiException(400, "资源目标前缀无效");
    }
    return out;
  }

  private ObjectNode sourceView(ObjectNode source) {
    ObjectNode out = source.deepCopy();
    out.put("tokenConfigured", !text(out, "token").isBlank());
    out.remove("token");
    return out;
  }

  @PostMapping("/resource-targets")
  public Object createTarget(@RequestBody ObjectNode body, HttpServletRequest r) {
    guard(r, "resource.config.write");
    return targetView(s.create("resource-target", "GLOBAL", configInput(body, null, false)));
  }

  @GetMapping("/resource-targets/{id}")
  public Object target(@PathVariable String id, HttpServletRequest r) {
    guard(r, "resource.config.read");
    return targetView(s.get("resource-target", id, null));
  }

  @PutMapping("/resource-targets/{id}")
  public Object updateTarget(
      @PathVariable String id, @RequestBody ObjectNode body, HttpServletRequest r) {
    guard(r, "resource.config.write");
    return targetView(
        s.update(
            "resource-target",
            id,
            null,
            configInput(body, s.get("resource-target", id, null), false)));
  }

  @PostMapping({
    "/resource-targets/{id}/test",
    "/resource-targets/{id}/sync",
    "/workbench-monitoring/sources/{id}/refresh"
  })
  public Object external(@PathVariable String id, HttpServletRequest r) {
    if (r.getRequestURI().startsWith("/api/workbench-monitoring/sources/"))
      guardAny(r, "resource.config.test", "workbench.monitoring.configure");
    else guard(r, "resource.config.test");
    if (r.getRequestURI().startsWith("/api/workbench-monitoring/sources/")) {
      return sourceView(monitoring.refresh(id));
    }
    ObjectNode config = s.get("resource-target", id, null);
    if (r.getRequestURI().endsWith("/sync"))
      return resources.exchange(
          config, "POST", "/resources/sync", s.object(), UUID.randomUUID().toString());
    ObjectNode result = resources.testTarget(config);
    return s.object().put("state", "READY").put("message", "目标只读连接检查成功").set("result", result);
  }

  @PostMapping("/resource-targets/{id}/oauth/link")
  public Object oauthLink(
      @PathVariable String id,
      @RequestBody(required = false) ObjectNode body,
      HttpServletRequest r) {
    guard(r, "resource.dispatch");
    return resources.exchange(
        s.get("resource-target", id, null),
        "POST",
        "/oauth/link",
        body == null ? s.object() : body,
        UUID.randomUUID().toString());
  }

  @PostMapping("/resource-targets/{id}/oauth/complete")
  public Object oauthComplete(
      @PathVariable String id, @RequestBody ObjectNode body, HttpServletRequest r) {
    guard(r, "resource.dispatch");
    required(body, "sessionId", "code");
    return resources.exchange(
        s.get("resource-target", id, null),
        "POST",
        "/oauth/complete",
        body,
        text(body, "sessionId"));
  }

  @GetMapping("/workbench-monitoring/sources")
  public Object sources(HttpServletRequest r) {
    guardAny(r, "resource.config.read", "workbench.monitoring.configure");
    return s.list("monitoring-source", null).stream().map(this::sourceView).toList();
  }

  @PostMapping("/workbench-monitoring/sources")
  public Object source(@RequestBody ObjectNode body, HttpServletRequest r) {
    guardAny(r, "resource.config.write", "workbench.monitoring.configure");
    return sourceView(
        s.create(
            "monitoring-source", "GLOBAL", configInput(body, null, true).put("state", "PENDING")));
  }

  @PutMapping("/workbench-monitoring/sources/{id}")
  @Transactional
  public Object source(
      @PathVariable String id, @RequestBody ObjectNode body, HttpServletRequest r) {
    guardAny(r, "resource.config.write", "workbench.monitoring.configure");
    s.jdbc.queryForObject(
        "select pg_advisory_xact_lock(hashtextextended(?,0))", Object.class, "monitoring:" + id);
    return sourceView(
        s.update(
            "monitoring-source",
            id,
            null,
            configInput(body, s.get("monitoring-source", id, null), true)));
  }

  @GetMapping("/workbench-monitoring/multipliers")
  public Object multipliers(HttpServletRequest r) {
    guard(r, "system.settings");
    return s.list("monitoring-multiplier", null);
  }

  @PutMapping("/workbench-monitoring/multipliers")
  public Object multipliers(@RequestBody ObjectNode body, HttpServletRequest r) {
    guard(r, "system.settings");
    String id = text(body, "category");
    java.math.BigDecimal min = decimal(body, "minMultiplier", true),
        max = decimal(body, "maxMultiplier", true);
    if (min.compareTo(new java.math.BigDecimal("0.1")) < 0
        || max.compareTo(new java.math.BigDecimal("100")) > 0
        || min.compareTo(max) > 0) throw new ApiException(400, "倍率需在0.1至100且上限不小于下限");
    List<ObjectNode> items =
        s.list("monitoring-multiplier", null).stream().filter(n -> eq(n, "category", id)).toList();
    if (items.isEmpty())
      return s.create("monitoring-multiplier", "GLOBAL", body.deepCopy().put("id", id));
    return s.update("monitoring-multiplier", text(items.get(0), "id"), null, body);
  }

  @GetMapping("/payout-providers/{code}")
  public Object provider(@PathVariable String code, HttpServletRequest r) {
    guard(r, "payout.provider.read");
    List<ObjectNode> items =
        s.list("payout-provider", null).stream().filter(n -> eq(n, "code", code)).toList();
    ObjectNode d =
        items.isEmpty()
            ? s.object()
                .put("id", code)
                .put("code", code)
                .put("enabled", false)
                .put("configured", false)
                .put("regionCode", code.equals("AIRWALLEX") ? "SANDBOX" : "GLOBAL")
                .put("apiKeyMasked", "")
                .put("hasSecretKey", false)
                .put("hasPassphrase", false)
                .put("clientIdMasked", "")
                .put("loginAs", "")
                .put("apiVersion", "2025-06-30")
                .put("transferMethod", "LOCAL")
                .put("transferReason", "professional_business_services")
                .put("sourceWallet", "SPOT")
                .put("singleLimit", "1000")
                .put("dailyLimit", "10000")
                .put("requestTimeoutMs", 10000)
                .put("reconcileIntervalSeconds", 60)
                .put("lastHealthState", "NOT_CONFIGURED")
                .putNull("lastHealthAt")
                .put("lastHealthMessage", "尚未配置真实资金通道")
                .put("version", 0)
            : items.get(0).deepCopy();
    d.put("apiKeyMasked", mask(text(d, "apiKey"))).put("clientIdMasked", mask(text(d, "clientId")));
    d.put(
        "configured",
        d.path("enabled").asBoolean()
            && (!text(d, "apiKey").isBlank() || !text(d, "clientId").isBlank()));
    d.put("hasSecretKey", !text(d, "secretKey").isBlank())
        .put("hasPassphrase", !text(d, "passphrase").isBlank());
    d.put("recipientInformationConfigured", d.path("recipientInformation").size() > 0);
    ObjectNode recipientSummary = s.object();
    d.path("recipientInformation")
        .fields()
        .forEachRemaining(
            entry -> {
              ObjectNode summary =
                  s.object()
                      .put("accountVersion", entry.getValue().path("accountVersion").asLong())
                      .put("configured", true);
              recipientSummary.set(entry.getKey(), summary);
            });
    d.set("recipientInformation", recipientSummary);
    d.remove(List.of("apiKey", "secretKey", "passphrase", "clientId"));
    if (d.path("executionAdapter").isObject()) {
      ObjectNode adapter = (ObjectNode) d.path("executionAdapter");
      adapter
          .put("apiKeyMasked", mask(text(adapter, "apiKey")))
          .put("hasApiKey", !text(adapter, "apiKey").isBlank());
      adapter.remove(
          List.of("apiKey", "secretKey", "passphrase", "clientId", "recipientInformation"));
    }
    return d;
  }

  @PutMapping("/payout-providers/{code}")
  public Object provider(
      @PathVariable String code, @RequestBody ObjectNode body, HttpServletRequest r) {
    guard(r, "payout.provider.write");
    if (!Set.of("AIRWALLEX", "OKX_USDT", "BINANCE_USDT").contains(code))
      throw new ApiException(400, "未知资金通道");
    List<ObjectNode> items =
        s.list("payout-provider", null).stream().filter(n -> eq(n, "code", code)).toList();
    ObjectNode d = items.isEmpty() ? s.object() : items.get(0).deepCopy();
    for (String field :
        List.of(
            "enabled",
            "regionCode",
            "loginAs",
            "apiVersion",
            "transferMethod",
            "transferReason",
            "sourceWallet",
            "singleLimit",
            "dailyLimit",
            "requestTimeoutMs",
            "reconcileIntervalSeconds",
            "networkMappings",
            "beneficiaryMappings",
            "recipientInformation",
            "version")) if (body.has(field)) d.set(field, body.get(field));
    for (String secret : List.of("apiKey", "secretKey", "passphrase", "clientId"))
      if (body.path("clear" + Character.toUpperCase(secret.charAt(0)) + secret.substring(1))
          .asBoolean()) d.remove(secret);
      else if (body.has(secret) && !text(body, secret).isBlank()) d.put(secret, text(body, secret));
    if (body.has("executionAdapter")) {
      if (!body.path("executionAdapter").isObject()) throw new ApiException(400, "执行中台配置需为对象");
      ObjectNode adapter =
          d.path("executionAdapter").isObject()
              ? (ObjectNode) d.path("executionAdapter").deepCopy()
              : s.object();
      ObjectNode submitted = (ObjectNode) body.path("executionAdapter");
      for (String field : List.of("baseUrl", "enabled", "protocol", "allowHttp", "timeoutMs"))
        if (submitted.has(field)) adapter.set(field, submitted.get(field));
      if (submitted.has("apiKey") && !text(submitted, "apiKey").isBlank())
        adapter.put("apiKey", text(submitted, "apiKey"));
      if (submitted.path("clearApiKey").asBoolean()) adapter.remove("apiKey");
      if (!text(adapter, "protocol").isBlank()
          && !eq(adapter, "protocol", "HISPREAD_PAYOUT_V1")
          && !NativePaymentGateway.PROTOCOLS.contains(text(adapter, "protocol")))
        throw new ApiException(400, "不支持的执行中台协议");
      d.set("executionAdapter", adapter);
    }
    d.put("code", code);
    if (d.path("executionAdapter").path("enabled").asBoolean()) {
      ObjectNode adapter = execution.configuredAdapter(d);
      execution.validateAdapter(adapter);
      if (execution.nativeProtocol(adapter)) {
        ObjectNode storedAdapter = (ObjectNode) d.path("executionAdapter");
        storedAdapter.put("baseUrl", text(adapter, "baseUrl"));
        storedAdapter.remove("apiKey");
      }
    }
    if (d.path("requestTimeoutMs").asInt(10000) < 100
        || d.path("requestTimeoutMs").asInt(10000) > 120000)
      throw new ApiException(400, "请求超时需为100–120000毫秒");
    if (items.isEmpty()) s.create("payout-provider", "GLOBAL", d.put("id", code));
    else s.update("payout-provider", code, null, d);
    return provider(code, r);
  }

  @PostMapping("/payout-providers/{code}/test")
  public Object test(@PathVariable String code, HttpServletRequest r) {
    guard(r, "payout.provider.test");
    ObjectNode config;
    try {
      config = s.get("payout-provider", code, null);
    } catch (ApiException missing) {
      if (missing.status == 404) throw new ApiException(503, "资金通道未配置；未发起付款");
      throw missing;
    }
    try {
      ObjectNode result = payouts.test(code, config);
      s.update(
          "payout-provider",
          code,
          null,
          b.pick(result, "lastHealthState", "lastHealthAt", "lastHealthMessage"));
      return result;
    } catch (ApiException error) {
      s.update(
          "payout-provider",
          code,
          null,
          s.object()
              .put("lastHealthState", "ERROR")
              .put("lastHealthAt", Instant.now().toString())
              .put("lastHealthMessage", error.getMessage()));
      throw error;
    }
  }

  private String mask(String value) {
    return value.isBlank()
        ? ""
        : value.length() < 5 ? "••••" : "••••" + value.substring(value.length() - 4);
  }

  @GetMapping("/payout-calls")
  public Object calls(@RequestParam Map<String, String> q, HttpServletRequest r) {
    if (!a.platform(r)) throw new ApiException(403, "仅平台财务可查看付款状态");
    a.require(r, "payout.call.read");
    if (!access.admin(r) && !access.finance(r)) throw new ApiException(403, "仅财务与最高管理员可查看付款状态");
    return b.page(
        access.visible("payout-call", r).stream()
            .filter(
                x ->
                    b.contains(
                            x, q.get("search"), "paymentId", "code", "supplierName", "providerCode")
                        && b.match(x, q, "state", "state"))
            .map(row -> access.publicRecord("payout-call", row, r))
            .toList(),
        q);
  }

  @GetMapping("/turnover")
  public Object turnover(HttpServletRequest r) {
    guard(r, "turnover.read");
    return Map.of("items", s.list("turnover", null));
  }

  @PostMapping("/turnover")
  public Object turnover(@RequestBody ObjectNode body, HttpServletRequest r) {
    guard(r, "turnover.write");
    required(body, "businessDate", "siteName", "currency", "amount");
    decimal(body, "amount", false);
    if (s.list("turnover", null).stream()
        .anyMatch(
            x ->
                eq(x, "businessDate", text(body, "businessDate"))
                    && eq(x, "siteName", text(body, "siteName"))
                    && eq(x, "currency", text(body, "currency"))))
      throw new ApiException(409, "同一天站点和币种已有营业额");
    return s.create(
        "turnover",
        "GLOBAL",
        b.pick(body, "businessDate", "siteName", "currency", "amount", "note"));
  }

  @GetMapping("/reports/operator-kpi")
  public Object kpi(@RequestParam Map<String, String> q, HttpServletRequest r) {
    guard(r, "supplier.owner.assign");
    return reports.operatorKpi(q);
  }

  @GetMapping("/reports/operator-kpi/lines")
  public Object kpiLines(@RequestParam Map<String, String> q, HttpServletRequest r) {
    guard(r, "supplier.owner.assign");
    return reports.operatorKpiLines(q);
  }

  @GetMapping("/resource-targets/{id}/sync-settings")
  public Object sync(@PathVariable String id, HttpServletRequest r) {
    guard(r, "resource.config.read");
    return resources.syncSettings(id);
  }

  @PutMapping("/resource-targets/{id}/sync-settings")
  public Object sync(@PathVariable String id, @RequestBody ObjectNode body, HttpServletRequest r) {
    guard(r, "resource.config.write");
    return resources.saveSyncSettings(id, body);
  }
}
