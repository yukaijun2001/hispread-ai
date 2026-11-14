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
  private final SystemJobService jobs;
  private final CcmaxIntakeLedger intakeLedger;

  public IntakeConfigController(
      Store s, AuthService a, BusinessSupport b, AccessPolicy access, SystemJobService jobs, CcmaxIntakeLedger intakeLedger) {
    this.s = s;
    this.a = a;
    this.b = b;
    this.access = access;
    this.jobs = jobs;
    this.intakeLedger = intakeLedger;
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
    d.set("policy", intakeLedger.defaults(id == null));
    ObjectNode inherited = intakeLedger.defaults(true);
    String parent = id == null ? null : memberId == null ? "system" : id;
    if (parent != null)
      try {
        inherited = intakeLedger.effectivePolicy(memberId == null ? "system" : id, "");
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
  @Transactional
  public Object policy(
      @PathVariable(required = false) String id,
      @PathVariable(required = false) String memberId,
      @RequestBody ObjectNode body,
      HttpServletRequest r) {
    guard(r, id == null ? "system.settings" : "supplier.write");
    if (id != null) intakeLedger.lock(id);
    ObjectNode existing = (ObjectNode) policy(id, memberId, r);
    if (!body.path("policy").isObject() || !body.path("policy").path("ranges").isObject())
      throw new ApiException(400, "规则必须包含policy.ranges");
    ObjectNode policy = (ObjectNode) body.path("policy");
    for (String kind : List.of("pro", "nonPro")) {
      String mode = policy.path(kind).path("mode").asText();
      if (!Set.of("UNLIMITED", "LIMITED", "INHERIT").contains(mode)
          || id == null && mode.equals("INHERIT")) throw new ApiException(400, "无效数量限制规则");
      if (mode.equals("LIMITED")
          && (!policy.path(kind).path("quantity").isIntegralNumber()
              || !policy.path(kind).path("quantity").canConvertToLong()
              || policy.path(kind).path("quantity").asLong(-1) < 0
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
              if (!e.getValue().path("min").isIntegralNumber() || !e.getValue().path("max").isIntegralNumber()
                  || !e.getValue().path("min").canConvertToInt() || !e.getValue().path("max").canConvertToInt())
                throw new ApiException(400, "优先级上下限须为整数");
              int min = e.getValue().path("min").asInt(-1),
                  max = e.getValue().path("max").asInt(-1);
              if (min < 0 || max > 1000 || min > max)
                throw new ApiException(400, "优先级范围需为0至1000且下限不大于上限");
            });
    if (policy.hasNonNull("tier") && !Set.of("FALLBACK", "NORMAL", "PAYMENT_TERM", "PARTNER", "TEMPORARY").contains(text(policy, "tier")))
      throw new ApiException(400, "无效优先级档位");
    if (policy.hasNonNull("nonProOpen") && !policy.path("nonProOpen").isBoolean())
      throw new ApiException(400, "非PRO开放状态须为布尔值");
    ObjectNode patch = s.object();
    patch.set("policy", policy);
    if (!body.path("version").isIntegralNumber() || body.path("version").asLong() != existing.path("version").asLong())
      throw new ApiException(409, "上号规则已更新，请刷新后保存");
    patch.set("version", body.get("version"));
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
    if (!eq(task, "type", "CCMAX_PRIORITY_ROTATION")) throw new ApiException(400, "此任务不支持扶持配置");
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
            s.list("priority-round", null).stream()
                .filter(x -> eq(x, "taskKey", key))
                .sorted(Comparator.comparing((ObjectNode x) -> text(x, "createdAt")).reversed())
                .limit(10)
                .map(
                    x -> {
                      ObjectNode row = x.deepCopy();
                      row.remove("items");
                      return row;
                    })
                .toList()));
    out.put(
        "restoreFailedCount",
        s.list("priority-round", null).stream()
            .filter(x -> eq(x, "taskKey", key) && eq(x, "state", "RESTORE_FAILED"))
            .count());
    out.put("ready", jobs.describe(task).path("ready").asBoolean());
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
    throw TaskScope.retired();
  }

  @PostMapping("/system/scheduled-tasks/priority-support")
  @Transactional
  public Object priority(@RequestBody ObjectNode body, HttpServletRequest r) {
    guard(r, "system.settings");
    throw TaskScope.retired();
  }

  @PostMapping("/system/scheduled-tasks/{key}/rotation-settings/retry-restore")
  public Object retry(@PathVariable String key, HttpServletRequest r) {
    guard(r, "system.settings");
    return jobs.retryRestore(key);
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
