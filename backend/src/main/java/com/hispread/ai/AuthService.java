package com.hispread.ai;

import com.fasterxml.jackson.databind.node.*;
import jakarta.servlet.http.*;
import java.util.*;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AuthService {
  private final Store store;
  private final RolePolicy roles;
  private final PasswordEncoder encoder = new BCryptPasswordEncoder(11);

  public AuthService(Store store, RolePolicy roles) {
    this.store = store;
    this.roles = roles;
  }

  public PasswordEncoder passwords() {
    return encoder;
  }

  public ObjectNode user(HttpServletRequest req) {
    if (req.getAttribute("bearer.user") instanceof ObjectNode bearer) return constrained(bearer);
    HttpSession s = req.getSession(false);
    if (s == null || s.getAttribute("uid") == null) throw new ApiException(401, "请先登录");
    String id = s.getAttribute("uid").toString();
    var rows =
        store.jdbc.query(
            "select profile,enabled,session_version from hub_user where id=?",
            (r, n) -> {
              ObjectNode d = store.parse(r.getString(1));
              d.put("_enabled", r.getBoolean(2));
              d.put("_sessionVersion", r.getLong(3));
              return d;
            },
            id);
    if (rows.isEmpty()) throw new ApiException(401, "登录已失效");
    ObjectNode u = rows.get(0);
    if (s.getAttribute("loginAt") instanceof Long loginAt
        && System.currentTimeMillis() - loginAt
            > policy().path("sessionAbsoluteMinutes").asLong(1440) * 60000L) {
      s.invalidate();
      throw new ApiException(401, "会话已到期，请重新登录");
    }
    if (!u.path("_enabled").asBoolean()
        || !Objects.equals(s.getAttribute("sv"), u.path("_sessionVersion").asLong())) {
      s.invalidate();
      throw new ApiException(401, "登录已失效，请重新登录");
    }
    u.remove(List.of("_enabled", "_sessionVersion"));
    return constrained(u);
  }

  private ObjectNode constrained(ObjectNode profile) {
    ObjectNode user = roles.constrain(profile);
    if (user.path("role").asText().equals("SUPPLIER_AGENT")) {
      ObjectNode groupInfo = store.object();
      String owner = user.path("supplierId").asText();
      for (ObjectNode group : store.list("group", owner)) {
        if (!group.path("adminUserId").asText().equals(user.path("id").asText())) continue;
        boolean included = false;
        for (var id : group.path("memberIds"))
          if (id.asText().equals(user.path("id").asText())) included = true;
        if (!included) continue;
        groupInfo.put("id", group.path("id").asText()).put("name", group.path("name").asText());
        ((ArrayNode) user.path("permissions")).add("supplier.agent.manage");
        break;
      }
      user.set("teamAdminGroup", groupInfo);
    }
    return user;
  }

  public boolean admin(HttpServletRequest req) {
    return roles.highestAdministrator(user(req));
  }

  public boolean platform(HttpServletRequest req) {
    return roles.platform(user(req));
  }

  public void requirePlatform(HttpServletRequest req, String permission) {
    if (!platform(req)) throw new ApiException(403, "仅有权限的平台账号可执行此操作");
    require(req, permission);
  }

  public String scope(HttpServletRequest req) {
    // Operators need object-level assignment checks; a user-id scope is a fail-closed fallback.
    return admin(req) || user(req).path("role").asText().equals("FINANCE") && platform(req)
        ? null
        : owner(req);
  }

  public ArrayNode rolePermissions(String code) {
    return roles.effectivePermissions(code, store.json.createArrayNode());
  }

  public ArrayNode allPermissions() {
    try {
      return (ArrayNode)
          store.json.readTree(
              new org.springframework.core.io.ClassPathResource("permissions.json")
                  .getInputStream());
    } catch (Exception e) {
      throw new IllegalStateException(e);
    }
  }

  public String owner(HttpServletRequest req) {
    ObjectNode u = user(req);
    return u.path("supplierId").asText("").isBlank()
        ? u.path("id").asText()
        : u.path("supplierId").asText();
  }

  public String userId(HttpServletRequest req) {
    return user(req).path("id").asText();
  }

  public void require(HttpServletRequest req, String permission) {
    if (permission == null || permission.isBlank()) return;
    ObjectNode u = user(req);
    for (var p : u.path("permissions")) if (permission.equals(p.asText())) return;
    throw new ApiException(403, "当前账号无此操作权限");
  }

  public ObjectNode findUser(String id) {
    var users =
        store.jdbc.query(
            "select profile from hub_user where id=?", (r, n) -> store.parse(r.getString(1)), id);
    if (users.isEmpty()) throw new ApiException(404, "账号不存在");
    return users.get(0);
  }

  public ObjectNode lockUser(String id) {
    var users =
        store.jdbc.query(
            "select profile,enabled from hub_user where id=? for update",
            (row, index) -> store.parse(row.getString(1)).put("enabled", row.getBoolean(2)),
            id);
    if (users.isEmpty()) throw new ApiException(404, "账号不存在");
    return users.get(0);
  }

  public boolean enabled(String id) {
    return store.jdbc
        .query("select enabled from hub_user where id=?", (row, index) -> row.getBoolean(1), id)
        .stream()
        .anyMatch(Boolean.TRUE::equals);
  }

  @Transactional
  public void setEnabled(ObjectNode user, boolean enabled) {
    String id = user.path("id").asText();
    user.put("enabled", enabled);
    saveUser(user);
    int updated =
        store.jdbc.update(
            "update hub_user set enabled=?,session_version=session_version+1 where id=?", enabled, id);
    if (updated == 0) throw new ApiException(404, "账号不存在");
    if ("SUPPLIER_AGENT".equals(user.path("role").asText())) {
      ObjectNode agent;
      String owner = user.path("supplierId").asText();
      try {
        agent = store.get("agent", id, owner);
      } catch (ApiException missing) {
        if (missing.status != 404) throw missing;
        return;
      }
      if (!agent.path("enabled").isBoolean() || agent.path("enabled").asBoolean() != enabled)
        store.update(
            "agent",
            id,
            owner,
            store.object().put("enabled", enabled).put("version", agent.path("version").asLong()));
    }
  }

  public ObjectNode supplierState(String supplierId) {
    try {
      return store.get("supplier", supplierId, null);
    } catch (ApiException e) {
      return null;
    }
  }

  public void saveUser(ObjectNode user) {
    store.jdbc.update(
        "update hub_user set profile=cast(? as jsonb),supplier_id=? where id=?",
        user.toString(),
        user.path("supplierId").isNull() ? null : user.path("supplierId").asText(),
        user.path("id").asText());
  }

  public void invalidate(String id) {
    store.jdbc.update("update hub_user set session_version=session_version+1 where id=?", id);
  }

  public void createUser(ObjectNode user, String password) {
    validateCurrentPassword(password);
    store.jdbc.update(
        "insert into hub_user(id,username,password_hash,supplier_id,profile) values(?,?,?,?,cast(?"
            + " as jsonb))",
        user.path("id").asText(),
        user.path("username").asText(),
        encoder.encode(password),
        user.path("supplierId").isNull() ? null : user.path("supplierId").asText(),
        user.toString());
  }

  public ObjectNode policy() {
    List<ObjectNode> settings = store.list("settings", null);
    if (!settings.isEmpty() && settings.get(0).path("policy").isObject())
      return (ObjectNode) settings.get(0).path("policy").deepCopy();
    return store
        .object()
        .put("passwordMinLength", 8)
        .put("passwordMaxLength", 64)
        .put("requireUpper", true)
        .put("requireLower", true)
        .put("requireDigit", true)
        .put("requireSymbol", true)
        .put("loginMaxFailures", 10)
        .put("loginLockMinutes", 15)
        .put("sessionIdleMinutes", 480)
        .put("sessionAbsoluteMinutes", 1440)
        .put("supplierRegistrationApprovalEnabled", false);
  }

  public void validateCurrentPassword(String p) {
    ObjectNode policy = policy();
    int min = policy.path("passwordMinLength").asInt(8),
        max = policy.path("passwordMaxLength").asInt(64);
    if (p == null
        || p.length() < min
        || p.length() > max
        || policy.path("requireUpper").asBoolean() && !p.matches("(?s).*[A-Z].*")
        || policy.path("requireLower").asBoolean() && !p.matches("(?s).*[a-z].*")
        || policy.path("requireDigit").asBoolean() && !p.matches("(?s).*[0-9].*")
        || policy.path("requireSymbol").asBoolean() && !p.matches("(?s).*[^A-Za-z0-9].*"))
      throw new ApiException(400, "密码不符合当前策略，请查看密码规则");
  }

  public static void validatePassword(String p) {
    if (p == null
        || p.length() < 8
        || p.length() > 64
        || !p.matches("(?s).*[A-Z].*")
        || !p.matches("(?s).*[a-z].*")
        || !p.matches("(?s).*[0-9].*")
        || !p.matches("(?s).*[^A-Za-z0-9].*"))
      throw new ApiException(400, "密码需为 8–64 位，并包含大写字母、小写字母、数字和符号。");
  }

  public void audit(String path, String method, ObjectNode user, int status) {
    ObjectNode d =
        store
            .object()
            .put("action", method + " " + path)
            .put("actor", user.path("id").asText())
            .put("actorName", user.path("displayName").asText())
            .put("outcome", status < 400 ? "SUCCESS" : "FAILURE")
            .put("httpStatus", status)
            .put("targetPath", path);
    store.create("audit", "GLOBAL", d);
  }

  public void authenticateBearer(HttpServletRequest req) {
    String header = req.getHeader("Authorization");
    if (header == null || !header.startsWith("Bearer ") || header.length() > 300)
      throw new ApiException(401, "缺少有效API密钥");
    String key = header.substring(7);
    String digest;
    try {
      digest =
          java.util.HexFormat.of()
              .formatHex(
                  java.security.MessageDigest.getInstance("SHA-256")
                      .digest(key.getBytes(java.nio.charset.StandardCharsets.UTF_8)));
    } catch (Exception e) {
      throw new IllegalStateException(e);
    }
    var tokens =
        store.jdbc.query(
            "select data,owner_id from hub_entity where kind='api-token' and data->>'hash'=?",
            (r, n) -> new AbstractMap.SimpleEntry<>(store.parse(r.getString(1)), r.getString(2)),
            digest);
    if (tokens.isEmpty()) throw new ApiException(401, "API密钥无效或已撤销");
    ObjectNode token = tokens.get(0).getKey();
    try {
      if (!token.path("enabled").asBoolean()
          || java.time.Instant.parse(token.path("expiresAt").asText())
              .isBefore(java.time.Instant.now())) throw new ApiException(401, "API密钥无效或已到期");
    } catch (java.time.format.DateTimeParseException e) {
      throw new ApiException(401, "API密钥无效");
    }
    String uid = tokens.get(0).getValue();
    var users = store.jdbc.queryForList("select enabled from hub_user where id=?", uid);
    if (users.isEmpty() || !Boolean.TRUE.equals(users.get(0).get("enabled")))
      throw new ApiException(401, "密钥所属账号不可用");
    ObjectNode user = constrained(findUser(uid));
    String supplierId = user.path("supplierId").asText("");
    ObjectNode supplier = supplierId.isBlank() ? null : supplierState(supplierId);
    if (supplier != null && !supplier.path("enabled").asBoolean(true))
      throw new ApiException(403, "供应商已停用", "SUPPLIER_DISABLED");
    if (user.path("mustChangePassword").asBoolean() || user.path("onboardingRequired").asBoolean())
      throw new ApiException(403, "请先在管理台完成账号设置");
    req.setAttribute("bearer.user", user);
    store.jdbc.update(
        "update hub_entity set data=jsonb_set(data,'{lastUsedAt}',to_jsonb(cast(? as"
            + " text))),updated_at=now() where kind='api-token' and id=?",
        java.time.Instant.now().toString(),
        token.path("id").asText());
  }

  public ArrayNode supplierPermissions() {
    return roles.defaults("SUPPLIER");
  }
}
