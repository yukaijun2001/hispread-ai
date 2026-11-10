package com.hispread.ai;

import static com.hispread.ai.BusinessSupport.*;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.node.*;
import jakarta.servlet.http.HttpServletRequest;
import java.util.*;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api")
public class SystemAdminController {
  private final Store s;
  private final AuthService a;
  private final BusinessSupport b;
  private final RolePolicy rolePolicy;
  private final SystemJobService jobs;
  private final WecomReminderService wecom;

  public SystemAdminController(
      Store s,
      AuthService a,
      BusinessSupport b,
      RolePolicy rolePolicy,
      SystemJobService jobs,
      WecomReminderService wecom) {
    this.s = s;
    this.a = a;
    this.b = b;
    this.rolePolicy = rolePolicy;
    this.jobs = jobs;
    this.wecom = wecom;
  }

  private List<ObjectNode> users() {
    return s.jdbc.query(
        "select profile,enabled from hub_user order by username",
        (rs, n) -> {
          ObjectNode u = s.parse(rs.getString(1)).put("enabled", rs.getBoolean(2));
          u.put("online", online(u.path("id").asText()));
          u.put("roleCode", text(u, "role"));
          try {
            u.put("roleName", text(role(text(u, "role")), "name"));
          } catch (ApiException e) {
            u.put("roleName", text(u, "role"));
          }
          ArrayNode roles = s.json.createArrayNode();
          for (JsonNode code : u.path("additionalRoleCodes")) {
            try {
              roles.add(role(code.asText()));
            } catch (ApiException ignored) {
            }
          }
          u.set("additionalRoles", roles);
          String supplier = u.path("supplierId").asText("");
          if (!supplier.isBlank())
            try {
              ObjectNode company = s.get("supplier", supplier, null);
              u.put("supplierName", text(company, "name"))
                  .put("supplierCode", text(company, "code"));
            } catch (ApiException ignored) {
            }
          if (!u.has("additionalRoleCodes")) u.putArray("additionalRoleCodes");
          return u;
        });
  }

  private boolean online(String uid) {
    try {
      return s.jdbc.queryForObject(
              "select count(*) from spring_session where principal_name=? and expiry_time>?",
              Integer.class,
              uid,
              System.currentTimeMillis())
          > 0;
    } catch (org.springframework.dao.DataAccessException unavailable) {
      return false;
    }
  }

  private void guard(HttpServletRequest r, String permission) {
    a.require(r, permission);
    if (!a.admin(r)) throw new ApiException(403, "仅平台管理员可执行此操作");
  }

  private ObjectNode role(String code) {
    return rolePolicy.describe(s.get("role", code, null));
  }

  private ArrayNode permissions(String code, JsonNode extra) {
    return rolePolicy.effectivePermissions(code, extra);
  }

  private ArrayNode extras(ObjectNode body, ObjectNode previous) {
    JsonNode extra =
        body.has("additionalRoleCodes")
            ? body.path("additionalRoleCodes")
            : previous.path("additionalRoleCodes");
    return extra.isArray() ? (ArrayNode) extra.deepCopy() : s.json.createArrayNode();
  }

  private void assign(ObjectNode user, String code, JsonNode extra, String supplierId) {
    rolePolicy.assign(user, code, extra, supplierId);
  }

  @GetMapping("/system/users")
  public Object users(@RequestParam Map<String, String> q, HttpServletRequest r) {
    guard(r, "system.users");
    return b.page(
        users().stream()
            .filter(
                u ->
                    b.contains(u, q.get("search"), "username", "displayName")
                        && b.match(u, q, "role", "role")
                        && b.match(u, q, "roleCode", "role")
                        && b.contains(u, q.get("supplierSearch"), "supplierName", "supplierCode")
                        && (q.getOrDefault("enabled", "").isBlank()
                            || u.path("enabled").asBoolean()
                                == Boolean.parseBoolean(q.get("enabled")))
                        && (q.getOrDefault("online", "").isBlank()
                            || u.path("online").asBoolean()
                                == Boolean.parseBoolean(q.get("online")))
                        && (q.getOrDefault("state", "").isBlank()
                            || u.path("enabled").asBoolean() == q.get("state").equals("enabled")))
            .toList(),
        q);
  }

  @PostMapping("/system/users")
  @Transactional
  public Object createUser(@RequestBody ObjectNode body, HttpServletRequest r) {
    guard(r, "system.users");
    required(body, "username", "displayName", "roleCode");
    if (!text(body, "username").matches("[A-Za-z0-9._@-]{3,100}")
        || text(body, "displayName").length() > 160) throw new ApiException(400, "账号或显示名称格式无效");
    if (s.jdbc.queryForObject(
            "select count(*) from hub_user where username=?", Integer.class, text(body, "username"))
        > 0) throw new ApiException(409, "登录账号已存在");
    String code = text(body, "roleCode"), password = text(body, "password");
    boolean generated = password.isBlank();
    if (generated) password = "Aa1!" + SessionGuard.token();
    ObjectNode u =
        s.object()
            .put("id", UUID.randomUUID().toString())
            .put("username", text(body, "username"))
            .put("displayName", text(body, "displayName"))
            .put("role", code)
            .put("version", 0)
            .put("mustChangePassword", generated)
            .put("onboardingRequired", false);
    String supplier = text(body, "supplierId");
    assign(u, code, extras(body, s.object()), supplier);
    u.set("teamAdminGroup", s.object());
    a.createUser(u, password);
    ObjectNode out = u.deepCopy();
    if (generated) out.put("initialPassword", password);
    return out;
  }

  @PutMapping("/system/users/{id}")
  @Transactional
  public Object updateUser(
      @PathVariable String id, @RequestBody ObjectNode body, HttpServletRequest r) {
    guard(r, "system.users");
    if (id.equals(a.userId(r))) throw new ApiException(409, "不能修改当前登录账号权限");
    ObjectNode u = a.lockUser(id);
    if (!body.has("version") || body.path("version").asLong() != u.path("version").asLong())
      throw new ApiException(409, "账号已变化，请刷新");
    if (body.has("enabled") && !body.path("enabled").isBoolean())
      throw new ApiException(400, "请提供有效的账号启用状态");
    String code = body.has("roleCode") ? text(body, "roleCode") : text(u, "role");
    protectLastAdministrator(
        u, code, body.has("enabled") ? body.path("enabled").asBoolean() : true);
    String existingRole = text(u, "role"), supplier = text(u, "supplierId");
    if (rolePolicy.supplierRole(existingRole) && !code.equals(existingRole))
      throw new ApiException(400, "供应商身份不能在账号编辑中改为平台身份");
    if (!rolePolicy.supplierRole(existingRole) && rolePolicy.supplierRole(code))
      throw new ApiException(400, "平台身份不能在账号编辑中改为供应商身份");
    if (body.has("supplierId") && !text(body, "supplierId").equals(supplier))
      throw new ApiException(400, "请通过供应商账号关联流程修改归属");
    assign(u, code, extras(body, u), supplier);
    u.put("version", u.path("version").asLong() + 1);
    if (body.has("enabled"))
      a.setEnabled(u, body.path("enabled").asBoolean());
    else {
      a.saveUser(u);
      a.invalidate(id);
    }
    return u;
  }

  @PutMapping("/system/users/{id}/enabled")
  @Transactional
  public Object enabled(
      @PathVariable String id, @RequestBody ObjectNode body, HttpServletRequest r) {
    guard(r, "system.users");
    ObjectNode u = a.findUser(id);
    if (!body.has("version")) throw new ApiException(400, "请提供当前账号版本");
    if (!body.path("enabled").isBoolean()) throw new ApiException(400, "请提供有效的账号启用状态");
    ObjectNode patch = body.deepCopy();
    return updateUser(id, patch, r);
  }

  @PostMapping("/system/users/{id}/password")
  public Object password(
      @PathVariable String id, @RequestBody ObjectNode body, HttpServletRequest r) {
    guard(r, "system.users");
    a.findUser(id);
    String password = text(body, "password");
    if (password.isBlank()) password = "Aa1!" + SessionGuard.token();
    a.validateCurrentPassword(password);
    ObjectNode target = a.findUser(id);
    target.put("mustChangePassword", true).put("version", target.path("version").asLong() + 1);
    a.saveUser(target);
    s.jdbc.update(
        "update hub_user set password_hash=?,session_version=session_version+1 where id=?",
        a.passwords().encode(password),
        id);
    return Map.of("initialPassword", password);
  }

  @PostMapping("/system/users/{id}/logout")
  public Object logout(@PathVariable String id, HttpServletRequest r) {
    guard(r, "system.users");
    if (id.equals(a.userId(r))) throw new ApiException(409, "不能强制登出当前登录账号");
    a.invalidate(id);
    return Map.of("loggedOut", true);
  }

  private void protectLastAdministrator(ObjectNode current, String nextRole, boolean enabled) {
    if (!rolePolicy.highestAdministrator(current) || nextRole.equals("ADMIN") && enabled) return;
    // Serialize demotion/disable of administrators so two concurrent requests cannot remove both.
    s.jdbc.queryForObject(
        "select pg_advisory_xact_lock(hashtextextended('last-administrator',0))", Object.class);
    Integer count =
        s.jdbc.queryForObject(
            "select count(*) from hub_user where enabled=true and supplier_id is null and"
                + " profile->>'role'='ADMIN' and id<>?",
            Integer.class,
            current.path("id").asText());
    if (count == null || count == 0) throw new ApiException(409, "至少保留一个已启用的最高管理员");
  }

  @GetMapping("/system/roles")
  public Object roles(HttpServletRequest r) {
    guard(r, "system.roles");
    ObjectNode out = s.object();
    out.set(
        "roles",
        s.json.valueToTree(s.list("role", null).stream().map(rolePolicy::describe).toList()));
    out.set("permissions", a.allPermissions());
    out.set("scopeTypes", rolePolicy.scopeTypes());
    return out;
  }

  @GetMapping("/system/roles/page")
  public Object rolePage(@RequestParam Map<String, String> q, HttpServletRequest r) {
    guard(r, "system.roles");
    ObjectNode page =
        b.page(
            s.list("role", null).stream()
                .filter(p -> b.contains(p, q.get("search"), "code", "name"))
                .map(rolePolicy::describe)
                .toList(),
            q);
    page.set("permissions", a.allPermissions());
    page.set("scopeTypes", rolePolicy.scopeTypes());
    return page;
  }

  @PostMapping("/system/roles")
  public Object createRole(@RequestBody ObjectNode body, HttpServletRequest r) {
    guard(r, "system.roles");
    required(body, "code", "name");
    if (!text(body, "code").matches("[A-Z][A-Z0-9_]{1,49}"))
      throw new ApiException(400, "角色标识需大写字母数字下划线");
    if (Set.of("ADMIN", "OPERATOR", "FINANCE", "SUPPLIER", "SUPPLIER_AGENT")
        .contains(text(body, "code"))) throw new ApiException(409, "内置角色标识不能用作自定义角色");
    String scope = text(body, "scopeType");
    if (scope.equals("ADMIN")) throw new ApiException(400, "不能创建最高管理员附加角色");
    rolePolicy.validatePermissions(scope, body.path("permissions"));
    ObjectNode d =
        s.object()
            .put("id", text(body, "code"))
            .put("code", text(body, "code"))
            .put("name", text(body, "name"))
            .put("builtIn", false)
            .put("scopeType", scope);
    d.set("permissions", body.path("permissions"));
    return rolePolicy.describe(s.create("role", "GLOBAL", d));
  }

  @PutMapping("/system/roles/{code}")
  @Transactional
  public Object updateRole(
      @PathVariable String code, @RequestBody ObjectNode body, HttpServletRequest r) {
    guard(r, "system.roles");
    if (code.equals("ADMIN")) throw new ApiException(409, "最高管理员权限不可削减");
    ObjectNode existing = role(code),
        patch = s.object().put("name", body.path("name").asText(text(existing, "name")));
    String scope = existing.path("builtIn").asBoolean() ? code : text(existing, "scopeType");
    if (scope.isBlank()) scope = text(body, "scopeType");
    if (body.has("scopeType") && !scope.equals(text(body, "scopeType")))
      throw new ApiException(400, "角色职责范围创建后不可改变");
    if (scope.equals("ADMIN")) throw new ApiException(400, "不能创建最高管理员附加角色");
    rolePolicy.validatePermissions(scope, body.path("permissions"));
    patch.put("scopeType", scope);
    patch.put("defaultPolicy", "customized");
    patch.set("permissions", body.path("permissions"));
    if (body.has("version")) patch.set("version", body.path("version"));
    ObjectNode role = s.update("role", code, null, patch);
    for (ObjectNode u : users()) {
      boolean linked = eq(u, "role", code);
      for (JsonNode extra : u.path("additionalRoleCodes"))
        if (extra.asText().equals(code)) linked = true;
      if (linked) {
        u.set("permissions", permissions(text(u, "role"), u.path("additionalRoleCodes")));
        u.put("version", u.path("version").asLong() + 1);
        a.saveUser(u);
        a.invalidate(text(u, "id"));
      }
    }
    return rolePolicy.describe(role);
  }

  private void validatePermissions(JsonNode body) {
    Set<String> valid = new HashSet<>();
    for (JsonNode p : a.allPermissions()) valid.add(p.asText());
    if (!body.path("permissions").isArray()) throw new ApiException(400, "权限需为数组");
    for (JsonNode p : body.path("permissions"))
      if (!valid.contains(p.asText())) throw new ApiException(400, "未知权限");
  }

  private ObjectNode singleton(String kind, ObjectNode defaults) {
    List<ObjectNode> rows = s.list(kind, null);
    return rows.isEmpty() ? s.create(kind, "GLOBAL", defaults.put("id", "default")) : rows.get(0);
  }

  private ObjectNode settings() {
    ObjectNode d =
        s.object()
            .put("allowAllSuppliersPro", false)
            .put("allowAllSuppliersCcmax", false)
            .put("forceStopCcmaxIntake", false)
            .put("allowAllSuppliersCcmaxReauthorization", false)
            .put("ccmaxIntakeConcurrencyLimit", 10)
            .put("ccmaxCreationTimeoutSeconds", 120);
    ObjectNode policy =
        s.object()
            .put("passwordMinLength", 8)
            .put("passwordMaxLength", 64)
            .put("requireUpper", true)
            .put("requireLower", true)
            .put("requireDigit", true)
            .put("requireSymbol", true)
            .put("quoteMultiplierMin", "0")
            .put("quoteMultiplierMax", "1")
            .put("supplierRegistrationApprovalEnabled", false)
            .put("sessionIdleMinutes", 480)
            .put("sessionAbsoluteMinutes", 1440)
            .put("initialPasswordLength", 18)
            .put("initialPasswordFormat", "RANDOM")
            .put("initialPasswordPrefix", "")
            .put("forceInitialChange", true)
            .put("loginMaxFailures", 10)
            .put("loginLockMinutes", 15)
            .put("allowSamePersonReview", false);
    d.set("policy", policy);
    return singleton("settings", d);
  }

  @GetMapping("/system/settings")
  public Object settings(HttpServletRequest r) {
    guard(r, "system.settings");
    return settings();
  }

  @PutMapping("/system/settings")
  public Object settings(@RequestBody ObjectNode body, HttpServletRequest r) {
    guard(r, "system.settings");
    if (body.path("ccmaxIntakeConcurrencyLimit").asInt(10) < 1
        || body.path("ccmaxIntakeConcurrencyLimit").asInt(10) > 1000
        || body.path("ccmaxCreationTimeoutSeconds").asInt(120) < 1
        || body.path("ccmaxCreationTimeoutSeconds").asInt(120) > 300)
      throw new ApiException(400, "上号并发与超时超出范围");
    JsonNode policy = body.path("policy");
    if (policy.isObject()) {
      int min = policy.path("passwordMinLength").asInt(8),
          max = policy.path("passwordMaxLength").asInt(64);
      if (min < 8
          || max > 72
          || max < min
          || policy.path("sessionIdleMinutes").asInt(480) < 1
          || policy.path("sessionAbsoluteMinutes").asInt(1440) < 1
          || policy.path("loginMaxFailures").asInt(10) < 3
          || policy.path("loginLockMinutes").asInt(15) < 1)
        throw new ApiException(400, "密码或会话策略超出范围");
    }
    return s.update("settings", text(settings(), "id"), null, body);
  }

  @GetMapping("/system/audit-actions")
  public Object auditActions(HttpServletRequest r) {
    guard(r, "audit.read");
    return s.list("audit", null).stream().map(x -> text(x, "action")).distinct().toList();
  }

  @GetMapping("/system/audits")
  public Object audits(@RequestParam Map<String, String> q, HttpServletRequest r) {
    guard(r, "audit.read");
    return b.page(
        s.list("audit", null).stream()
            .filter(
                p ->
                    b.contains(p, q.get("search"), "action", "actorName", "targetId")
                        && b.match(p, q, "action", "action")
                        && b.contains(p, q.get("actor"), "actor", "actorName")
                        && b.match(p, q, "outcome", "outcome")
                        && b.dates(p, q, "from", "to", "createdAt", "createdAt"))
            .toList(),
        q);
  }

  @GetMapping("/system/audits/{id}")
  public Object audit(@PathVariable String id, HttpServletRequest r) {
    guard(r, "audit.read");
    return s.get("audit", id, null);
  }

  @GetMapping("/system/scheduled-tasks")
  public Object tasks(HttpServletRequest r) {
    guard(r, "system.settings");
    return jobs.tasks();
  }

  @PutMapping({
    "/system/scheduled-tasks/{key}",
    "/system/scheduled-tasks/{key}/schedule",
    "/system/scheduled-tasks/{key}/config"
  })
  public Object task(@PathVariable String key, @RequestBody ObjectNode body, HttpServletRequest r) {
    guard(r, "system.settings");
    return jobs.update(key, body);
  }

  @GetMapping("/system/scheduled-tasks/{key}/runs")
  public Object runs(
      @PathVariable String key, @RequestParam Map<String, String> q, HttpServletRequest r) {
    guard(r, "system.settings");
    return b.page(
        s.list("scheduled-run", null).stream()
            .filter(x -> eq(x, "taskKey", key))
            .filter(
                x ->
                    b.match(x, q, "state", "state")
                        && b.match(x, q, "triggerKind", "triggerKind")
                        && b.dates(x, q, "from", "to", "startedAt", "startedAt"))
            .toList(),
        q);
  }

  @PostMapping("/system/scheduled-tasks/{key}/run")
  public Object run(@PathVariable String key, HttpServletRequest r) {
    guard(r, "system.settings");
    return jobs.run(key, "MANUAL");
  }

  @GetMapping("/system/scheduled-tasks/WORKBENCH_WECOM_REMINDER/reminder-settings")
  public Object reminder(HttpServletRequest r) {
    guard(r, "system.settings");
    return wecom.settings();
  }

  @PutMapping("/system/scheduled-tasks/WORKBENCH_WECOM_REMINDER/reminder-settings")
  public Object reminder(@RequestBody ObjectNode body, HttpServletRequest r) {
    guard(r, "system.settings");
    return wecom.save(body);
  }
}
