package com.hispread.ai;

import static com.hispread.ai.BusinessSupport.*;

import com.fasterxml.jackson.databind.node.*;
import jakarta.servlet.http.HttpServletRequest;
import java.time.Instant;
import java.util.*;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api")
public class IntakeConfigController {
  private final Store s;
  private final AuthService a;
  private final BusinessSupport b;
  private final AccessPolicy access;

  public IntakeConfigController(Store s, AuthService a, BusinessSupport b, AccessPolicy access) {
    this.s = s;
    this.a = a;
    this.b = b;
    this.access = access;
  }

  private void guard(HttpServletRequest r, String permission) {
    a.requirePlatform(r, permission);
    if (!a.admin(r)) throw new ApiException(403, "接收与任务配置仅最高管理员可访问");
  }

  private ObjectNode get(String kind, String id, ObjectNode defaults) {
    try {
      return s.get(kind, id, null);
    } catch (ApiException e) {
      if (e.status != 404) throw e;
      return s.create(kind, "GLOBAL", defaults.put("id", id));
    }
  }

  @GetMapping("/suppliers/{id}/settings")
  public Object supplier(@PathVariable String id, HttpServletRequest r) {
    guard(r, "supplier.read");
    s.get("supplier", id, null);
    ObjectNode out =
        get(
            "supplier-settings",
            id,
            s.object()
                .put("defaultProxyMaxResources", 0)
                .put("allowPro", false)
                .put("allowCcmax", false)
                .put("allowCcmaxReauthorization", false)
                .put("allowCcmaxPause", false)
                .put("allowCcmaxSafeRemoval", false)
                .put("forceStopCcmaxIntake", false)
                .put("globalAllowCcmax", false)
                .put("globalAllowCcmaxReauthorization", false));
    List<ObjectNode> settings = s.list("settings", null);
    if (!settings.isEmpty()) {
      ObjectNode global = settings.get(0);
      out.put("globalAllowCcmax", global.path("allowAllSuppliersCcmax").asBoolean())
          .put("globalAllowPro", global.path("allowAllSuppliersPro").asBoolean())
          .put("forceStopCcmaxIntake", global.path("forceStopCcmaxIntake").asBoolean())
          .put(
              "globalAllowCcmaxReauthorization",
              global.path("allowAllSuppliersCcmaxReauthorization").asBoolean());
    }
    return out;
  }

  @PutMapping("/suppliers/{id}/settings")
  public Object supplier(
      @PathVariable String id, @RequestBody ObjectNode body, HttpServletRequest r) {
    guard(r, "supplier.write");
    supplier(id, r);
    return s.update("supplier-settings", id, null, body);
  }

  private ObjectNode defaultPolicy() {
    ObjectNode p = s.object().put("nonProOpen", false);
    for (String k : List.of("pro", "nonPro"))
      p.set(k, s.object().put("mode", "UNLIMITED").putNull("quantity"));
    ObjectNode ranges = s.object();
    for (String tier : List.of("FALLBACK", "NORMAL", "PAYMENT_TERM", "PARTNER", "TEMPORARY"))
      ranges.set(tier, s.object().put("min", 0).put("max", 100));
    p.set("ranges", ranges);
    return p;
  }

  @GetMapping({
    "/cc-intake/admin/system",
    "/cc-intake/admin/suppliers/{id}",
    "/cc-intake/admin/suppliers/{id}/members/{memberId}"
  })
  public Object policy(
      @PathVariable(required = false) String id,
      @PathVariable(required = false) String memberId,
      HttpServletRequest r) {
    guard(r, id == null ? "system.settings" : "supplier.read");
    if (id != null) s.get("supplier", id, null);
    if (memberId != null) s.get("agent", memberId, id);
    String key = id == null ? "system" : id + (memberId == null ? "" : ":" + memberId);
    ObjectNode d = s.object();
    d.set("policy", defaultPolicy());
    ObjectNode inherited = defaultPolicy();
    String parent = id == null ? null : memberId == null ? "system" : id;
    if (parent != null)
      try {
        inherited = (ObjectNode) s.get("intake-policy", parent, null).path("policy").deepCopy();
      } catch (ApiException ignored) {
      }
    d.set("inherited", inherited);
    ObjectNode out = get("intake-policy", key, d);
    out.set("inherited", inherited);
    return out;
  }

  @PutMapping({
    "/cc-intake/admin/system",
    "/cc-intake/admin/suppliers/{id}",
    "/cc-intake/admin/suppliers/{id}/members/{memberId}"
  })
  public Object policy(
      @PathVariable(required = false) String id,
      @PathVariable(required = false) String memberId,
      @RequestBody ObjectNode body,
      HttpServletRequest r) {
    guard(r, id == null ? "system.settings" : "supplier.write");
    ObjectNode existing = (ObjectNode) policy(id, memberId, r);
    if (!body.path("policy").isObject() || !body.path("policy").path("ranges").isObject())
      throw new ApiException(400, "规则必须包含policy.ranges");
    ObjectNode policy = (ObjectNode) body.path("policy");
    for (String kind : List.of("pro", "nonPro")) {
      String mode = policy.path(kind).path("mode").asText();
      if (!Set.of("UNLIMITED", "LIMITED", "INHERIT").contains(mode)
          || id == null && mode.equals("INHERIT")) throw new ApiException(400, "无效数量限制规则");
      if (mode.equals("LIMITED")
          && (policy.path(kind).path("quantity").asLong(-1) < 0
              || policy.path(kind).path("quantity").asLong() > 100000000))
        throw new ApiException(400, "数量限制超出范围");
    }
    policy
        .path("ranges")
        .fields()
        .forEachRemaining(
            e -> {
              if (!Set.of("FALLBACK", "NORMAL", "PAYMENT_TERM", "PARTNER", "TEMPORARY")
                  .contains(e.getKey())) throw new ApiException(400, "无效优先级档位");
              int min = e.getValue().path("min").asInt(-1),
                  max = e.getValue().path("max").asInt(-1);
              if (min < 0 || max > 1000 || min > max)
                throw new ApiException(400, "优先级范围需为0至1000且下限不大于上限");
            });
    ObjectNode patch = s.object();
    patch.set("policy", policy);
    if (body.has("version")) patch.set("version", body.get("version"));
    return s.update("intake-policy", text(existing, "id"), null, patch);
  }

  @GetMapping("/cc-intake/admin/suppliers/{id}/members")
  public Object members(@PathVariable String id, HttpServletRequest r) {
    guard(r, "supplier.read");
    return s.list("agent", id);
  }

  @GetMapping("/system/scheduled-tasks/{key}/rotation-settings")
  public Object rotation(@PathVariable String key, HttpServletRequest r) {
    guard(r, "system.settings");
    ObjectNode task = s.get("scheduled-task", key, null);
    ObjectNode d = get("rotation-settings", key, s.object());
    ObjectNode out =
        d.deepCopy()
            .put("taskVersion", task.path("version").asLong())
            .put("name", text(task, "name"))
            .put("intervalMinutes", task.path("intervalMinutes").asInt(1));
    if (!out.has("settings")) {
      ObjectNode settings =
          s.object()
              .put("mode", "ROTATION")
              .put("scope", "SELECTED")
              .put("basisPoints", 1000)
              .put("maxAccounts", 20)
              .put("priority", 10);
      settings.putArray("tiers");
      out.set("settings", settings);
    }
    out.set(
        "rounds",
        s.json.valueToTree(
            s.list("priority-round", null).stream().filter(x -> eq(x, "taskKey", key)).toList()));
    ArrayNode selected = out.putArray("suppliers");
    for (var supplierId : out.path("settings").path("supplierIds"))
      try {
        selected.add(s.get("supplier", supplierId.asText(), null));
      } catch (ApiException ignored) {
      }
    return out;
  }

  @PutMapping("/system/scheduled-tasks/{key}/rotation-settings")
  @Transactional
  public Object rotation(
      @PathVariable String key, @RequestBody ObjectNode body, HttpServletRequest r) {
    guard(r, "system.settings");
    rotation(key, r);
    validateRotation(body);
    ObjectNode task = s.get("scheduled-task", key, null);
    if (body.path("taskVersion").asLong(-1) != task.path("version").asLong())
      throw new ApiException(409, "任务配置已变化");
    ObjectNode patch = b.pick(body, "settings", "version");
    s.update("rotation-settings", key, null, patch);
    s.update(
        "scheduled-task",
        key,
        null,
        b.pick(body, "name", "intervalMinutes").put("version", task.path("version").asLong()));
    return rotation(key, r);
  }

  @PostMapping("/system/scheduled-tasks/priority-support")
  @Transactional
  public Object priority(@RequestBody ObjectNode body, HttpServletRequest r) {
    guard(r, "system.settings");
    validateRotation(body);
    String id = "PRIORITY_" + UUID.randomUUID();
    ObjectNode task =
        body.deepCopy()
            .put("id", id)
            .put("key", id)
            .put("type", "CCMAX_PRIORITY_ROTATION")
            .put("enabled", false)
            .put("running", false)
            .put("ready", false)
            .put("unavailableReason", "尚未配置上游任务执行器");
    s.create("scheduled-task", "GLOBAL", task);
    ObjectNode config = body.deepCopy().put("id", id);
    s.create("rotation-settings", "GLOBAL", config);
    return rotation(id, r);
  }

  @PostMapping("/system/scheduled-tasks/{key}/rotation-settings/retry-restore")
  public Object retry(@PathVariable String key, HttpServletRequest r) {
    guard(r, "system.settings");
    throw b.external();
  }

  private void validateRotation(ObjectNode body) {
    var settings = body.path("settings");
    if (!Set.of("ROTATION", "SUPPLIER_IDLE").contains(settings.path("mode").asText())
        || !Set.of("SELECTED", "TIERS", "ALL").contains(settings.path("scope").asText()))
      throw new ApiException(400, "无效扶持范围或类型");
    if (settings.path("basisPoints").asInt() < 1
        || settings.path("basisPoints").asInt() > 10000
        || settings.path("priority").asInt(-1) < 0
        || settings.path("priority").asInt() > 1000
        || settings.path("maxAccounts").asInt() < 1
        || settings.path("maxAccounts").asInt() > 50000)
      throw new ApiException(400, "扶持比例、优先级或账号数量超出范围");
    if (body.path("intervalMinutes").asInt() < 1 || body.path("intervalMinutes").asInt() > 1440)
      throw new ApiException(400, "周期须为1–1440分钟");
    for (var id : settings.path("supplierIds")) s.get("supplier", id.asText(), null);
  }

  @GetMapping("/cc-intake/admin/reviews")
  public Object reviews(@RequestParam Map<String, String> q, HttpServletRequest r) {
    a.requirePlatform(r, "resource.read");
    a.require(r, "resource.dispatch");
    return b.page(
        s.list("intake-review", null).stream()
            .filter(
                x ->
                    access.canSupplier(r, text(x, "supplierId"))
                        && !eq(x, "state", "RESOLVED")
                        && b.match(x, q, "supplierId", "supplierId"))
            .toList(),
        q);
  }

  @PostMapping("/cc-intake/admin/reviews/{dispatchId}/resolve")
  @Transactional
  public Object resolve(
      @PathVariable String dispatchId, @RequestBody ObjectNode body, HttpServletRequest r) {
    a.requirePlatform(r, "resource.read");
    a.require(r, "resource.dispatch");
    required(body, "reason");
    if (text(body, "reason").length() > 500 || !body.has("newlyCreated"))
      throw new ApiException(400, "请提供有效核对结果和500字以内依据");
    ObjectNode old =
        s.list("intake-review", null).stream()
            .filter(x -> eq(x, "dispatchId", dispatchId) || eq(x, "id", dispatchId))
            .findFirst()
            .orElseThrow(() -> new ApiException(404, "核对记录不存在"));
    access.requireSupplier(r, text(old, "supplierId"));
    if (eq(old, "state", "RESOLVED")) throw new ApiException(409, "此账号计数已核对");
    ObjectNode patch =
        s.object()
            .put("state", "RESOLVED")
            .put("newlyCreated", body.path("newlyCreated").asBoolean())
            .put("reason", text(body, "reason"))
            .put("resolvedBy", a.userId(r))
            .put("resolvedAt", Instant.now().toString());
    return s.update("intake-review", text(old, "id"), null, patch);
  }
}
