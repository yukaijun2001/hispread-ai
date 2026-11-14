package com.hispread.ai;

import com.fasterxml.jackson.databind.node.*;
import jakarta.servlet.http.*;
import java.util.*;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api")
public class AuthController {
  private final Store store;
  private final AuthService auth;

  public AuthController(Store store, AuthService auth) {
    this.store = store;
    this.auth = auth;
  }

  @GetMapping("/health")
  public Object health() {
    return Map.of("status", "UP", "version", "0.8.124", "storage", "PostgreSQL");
  }

  @GetMapping("/auth/csrf")
  public Object csrf(HttpServletRequest req) {
    HttpSession s = req.getSession(true);
    if (s.getAttribute("csrf") == null) s.setAttribute("csrf", SessionGuard.token());
    return Map.of("headerName", "X-CSRF-TOKEN", "token", s.getAttribute("csrf"));
  }

  @GetMapping({"/auth/registration-policy", "/auth/password-policy"})
  public Object policy() {
    return auth.policy();
  }

  @PostMapping(value = "/auth/login", consumes = "application/x-www-form-urlencoded")
  public Object login(
      @RequestParam String username, @RequestParam String password, HttpServletRequest req) {
    username = username.trim();
    int lockMinutes = auth.policy().path("loginLockMinutes").asInt(15),
        maxFailures = auth.policy().path("loginMaxFailures").asInt(10);
    var attempts =
        store.jdbc.queryForList(
            "select failures from hub_login_attempt where username=? and window_started > now()-(?"
                + " * interval '1 minute')",
            username,
            lockMinutes);
    if (!attempts.isEmpty() && ((Number) attempts.get(0).get("failures")).intValue() >= maxFailures)
      throw new ApiException(429, "尝试次数过多，请稍后重试");
    var rows =
        store.jdbc.queryForList(
            "select id,password_hash,enabled,session_version from hub_user where username=?",
            username);
    if (rows.isEmpty()
        || !(Boolean) rows.get(0).get("enabled")
        || !auth.passwords().matches(password, rows.get(0).get("password_hash").toString())) {
      store.jdbc.update(
          "insert into hub_login_attempt(username,failures) values(?,1) on conflict(username) do"
              + " update set failures=case when hub_login_attempt.window_started < now()-(? *"
              + " interval '1 minute') then 1 else hub_login_attempt.failures+1"
              + " end,window_started=case when hub_login_attempt.window_started < now()-(? *"
              + " interval '1 minute') then now() else hub_login_attempt.window_started end",
          username,
          lockMinutes,
          lockMinutes);
      throw new ApiException(401, "账号或密码不正确");
    }
    store.jdbc.update("delete from hub_login_attempt where username=?", username);
    req.changeSessionId();
    HttpSession s = req.getSession();
    s.setAttribute("uid", rows.get(0).get("id"));
    s.setAttribute(
        org.springframework.session.FindByIndexNameSessionRepository.PRINCIPAL_NAME_INDEX_NAME,
        rows.get(0).get("id").toString());
    s.setAttribute("loginAt", System.currentTimeMillis());
    s.setMaxInactiveInterval(auth.policy().path("sessionIdleMinutes").asInt(480) * 60);
    s.setAttribute("sv", ((Number) rows.get(0).get("session_version")).longValue());
    s.removeAttribute("csrf");
    return Map.of("authenticated", true);
  }

  @GetMapping("/auth/me")
  public Object me(HttpServletRequest req) {
    return auth.user(req);
  }

  @PostMapping("/auth/logout")
  public Object logout(HttpServletRequest req) {
    req.getSession().invalidate();
    return Map.of("loggedOut", true);
  }

  @PostMapping("/auth/register")
  @Transactional
  public Object register(@RequestBody ObjectNode b) {
    String username = b.path("username").asText().trim();
    if (!username.matches("[A-Za-z0-9_.@-]{3,100}"))
      throw new ApiException(400, "账号需为3–100位字母、数字或常用账号符号");
    String id = UUID.randomUUID().toString(), supplier = UUID.randomUUID().toString();
    ObjectNode u = store.object();
    u.put("id", id)
        .put("username", username)
        .put("displayName", username)
        .put("role", "SUPPLIER")
        .put("supplierId", supplier)
        .put("onboardingRequired", true)
        .put("mustChangePassword", false)
        .put(
            "supplierRegistrationApprovalEnabled",
            auth.policy().path("supplierRegistrationApprovalEnabled").asBoolean(false))
        .put("version", 0);
    u.set("permissions", auth.supplierPermissions());
    u.set("teamAdminGroup", store.object());
    auth.createUser(u, b.path("password").asText());
    ObjectNode d = store.object();
    d.put("id", supplier)
        .put("name", username)
        .put("code", "S" + supplier.substring(0, 6).toUpperCase())
        .put("state", "PENDING")
        .put("profileReviewState", "PENDING")
        .put("enabled", true)
        .put("supplierType", "INDIVIDUAL")
        .put("country", "中国")
        .put("cycle", "MONTHLY");
    store.create("supplier", supplier, d);
    return Map.of("registered", true);
  }

  @GetMapping("/auth/profile")
  public Object profile(HttpServletRequest req) {
    ObjectNode u = auth.user(req), p = store.object();
    for (String k : List.of("username", "displayName", "version", "personalEmail", "personalPhone"))
      p.set(k, u.has(k) ? u.get(k) : store.json.valueToTree(k.equals("version") ? 0 : ""));
    return p;
  }

  @PutMapping("/auth/profile")
  public Object updateProfile(@RequestBody ObjectNode b, HttpServletRequest req) {
    ObjectNode u = auth.user(req);
    if (b.path("version").asLong() != u.path("version").asLong())
      throw new ApiException(409, "个人资料已更新，请刷新重试");
    String display = b.path("displayName").asText().trim();
    if (display.isBlank() || display.length() > 100) throw new ApiException(400, "请填写有效显示名称");
    for (String k : List.of("displayName", "personalEmail", "personalPhone"))
      u.put(k, b.path(k).asText().trim());
    u.put("version", u.path("version").asLong() + 1);
    auth.saveUser(u);
    return profile(req);
  }

  @PostMapping("/auth/password")
  public Object password(@RequestBody ObjectNode b, HttpServletRequest req) {
    String id = auth.userId(req),
        hash =
            store.jdbc.queryForObject(
                "select password_hash from hub_user where id=?", String.class, id);
    if (!auth.passwords().matches(b.path("currentPassword").asText(), hash))
      throw new ApiException(400, "当前密码不正确");
    String p = b.path("newPassword").asText();
    auth.validateCurrentPassword(p);
    store.jdbc.update(
        "update hub_user set password_hash=?,session_version=session_version+1 where id=?",
        auth.passwords().encode(p),
        id);
    req.getSession().invalidate();
    return Map.of("changed", true);
  }

  @PostMapping("/auth/onboarding")
  @Transactional
  public Object onboard(@RequestBody ObjectNode b, HttpServletRequest req) {
    ObjectNode u = auth.user(req);
    if (b.path("personalName").asText().isBlank()) throw new ApiException(400, "请填写姓名");
    String supplier = u.path("supplierId").asText();
    ObjectNode d = store.object();
    d.put(
        "name",
        b.path("supplierType").asText().equals("COMPANY")
            ? b.path("companyName").asText()
            : b.path("personalName").asText());
    for (String k :
        List.of("supplierType", "country", "cycle", "registrationNo", "customCycleDays"))
      if (b.has(k)) d.set(k, b.get(k));
    boolean approval = auth.policy().path("supplierRegistrationApprovalEnabled").asBoolean();
    d.put("state", approval ? "PENDING" : "APPROVED")
        .put("profileReviewState", approval ? "PENDING" : "APPROVED");
    store.update("supplier", supplier, supplier, d);
    u.put("displayName", b.path("personalName").asText())
        .put("personalEmail", b.path("personalEmail").asText())
        .put("personalPhone", b.path("personalPhone").asText())
        .put("onboardingRequired", false);
    auth.saveUser(u);
    return Map.of("saved", true);
  }
}
