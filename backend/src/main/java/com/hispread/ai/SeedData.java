package com.hispread.ai;

import com.fasterxml.jackson.databind.*;
import com.fasterxml.jackson.databind.node.*;
import java.nio.file.*;
import java.util.*;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

@Component
public class SeedData implements CommandLineRunner {
  private final Store store;
  private final AuthService auth;
  private final RolePolicy rolePolicy;

  @Value("${app.bootstrap-mode:demo}")
  String bootstrapMode;

  @Value("${app.operator-username}")
  String operatorUsername;

  @Value("${app.operator-password}")
  String operatorPassword;

  @Value("${app.finance-username}")
  String financeUsername;

  @Value("${app.finance-password}")
  String financePassword;

  @Value("${app.member-username}")
  String memberUsername;

  @Value("${app.member-password}")
  String memberPassword;

  @Value("${app.admin-username}")
  String adminUsername;

  @Value("${app.admin-password}")
  String adminPassword;

  @Value("${app.seed-username}")
  String username;

  @Value("${app.seed-password}")
  String password;

  @Value("${app.fixtures}")
  String fixtures;

  public SeedData(Store store, AuthService auth, RolePolicy rolePolicy) {
    this.store = store;
    this.auth = auth;
    this.rolePolicy = rolePolicy;
  }

  @Override
  @Transactional
  public void run(String... args) throws Exception {
    if (bootstrapMode.equals("production")) {
      if (store.jdbc.queryForObject(
                  "select count(*) from hub_user where enabled=true and supplier_id is null and"
                      + " profile->>'role'='ADMIN'",
                  Integer.class)
              == 0
          && (adminUsername.isBlank() || adminPassword.isBlank()))
        throw new IllegalStateException(
            "First production launch requires ADMIN_USERNAME and ADMIN_PASSWORD");
      if (!adminPassword.isBlank() && adminPassword.length() < 16)
        throw new IllegalStateException(
            "Production initial administrator password must contain at least 16 characters");
      seedAdmin();
      migrateRoleDefaults();
      return;
    }
    if (!bootstrapMode.equals("demo"))
      throw new IllegalStateException("BOOTSTRAP_MODE must be production or demo");
    JsonNode all = store.json.readTree(Files.readString(Path.of(fixtures))).path("responses");
    for (JsonNode c : all.path("/projects/category-codes").path("body")) {
      ObjectNode category = (ObjectNode) c.deepCopy();
      category.put("id", category.path("code").asText());
      store.seed("category", "GLOBAL", category);
    }
    seedAdmin();
    migrateRoleDefaults();
    seedPlatformUser("OPERATOR", operatorUsername, operatorPassword);
    seedPlatformUser("FINANCE", financeUsername, financePassword);
    if (store.jdbc.queryForObject(
            "select count(*) from hub_user where supplier_id is not null", Integer.class)
        > 0) {
      syncAgents();
      return;
    }
    if (username.isBlank() || password.isBlank())
      throw new IllegalStateException(
          "First launch requires SEED_USERNAME and SEED_PASSWORD environment variables");
    ObjectNode me = (ObjectNode) all.path("/auth/me").path("body").deepCopy();
    String owner = me.path("supplierId").asText();
    me.put("username", username)
        .put("version", 2)
        .put("personalEmail", "")
        .put("personalPhone", "");
    auth.createUser(me, password);
    for (JsonNode p : all.path("/projects?size=100").path("body").path("items"))
      store.seed("project", "GLOBAL", (ObjectNode) p);
    for (JsonNode q : all.path("/quotes?page=1&size=20&state=").path("body").path("items")) {
      JsonNode full = all.path("/quotes/" + q.path("id").asText()).path("body");
      store.seed("quote", owner, full.isObject() ? (ObjectNode) full : (ObjectNode) q);
    }
    ObjectNode supplier = (ObjectNode) all.path("/suppliers/" + owner).path("body").deepCopy();
    for (String field : List.of("email", "phone", "registrationNo")) supplier.put(field, "");
    supplier.put("contact", "梧桐");
    supplier.set("linkedUsers", store.json.createArrayNode());
    store.seed("supplier", owner, supplier);
    for (JsonNode rate : all.path("/exchange-rates/current").path("body"))
      store.seed("exchange-rate", "GLOBAL", (ObjectNode) rate);
    for (JsonNode n :
        all.path("/notifications?unread=false&page=1&size=10").path("body").path("items"))
      store.seed("notification", me.path("id").asText(), (ObjectNode) n);
    for (JsonNode a : all.path("/supplier-agents?page=1&size=20").path("body")) {
      ObjectNode agent = (ObjectNode) a.deepCopy();
      agent.put("username", "wt_agent45");
      store.seed("agent", owner, agent);
    }
    for (JsonNode group : all.path("/supplier-team-groups").path("body"))
      store.seed("group", owner, (ObjectNode) group);
    ObjectNode monitor =
        (ObjectNode) all.path("/workbench/monitoring").path("body").get(0).deepCopy();
    monitor.put("rpm", "402").put("queriedAt", "2026-11-09T05:52:00Z");
    store.seed("monitoring", "GLOBAL", monitor);
    syncAgents();
  }

  private void seedAdmin() {
    if (!adminUsername.isBlank()
        && !adminPassword.isBlank()
        && store.jdbc.queryForObject(
                "select count(*) from hub_user where username=?", Integer.class, adminUsername)
            == 0) {
      ObjectNode admin =
          store
              .object()
              .put("id", "local-admin")
              .put("username", adminUsername)
              .put("displayName", "平台管理员")
              .put("role", "ADMIN")
              .putNull("supplierId")
              .put("version", 0)
              .put("mustChangePassword", false)
              .put("onboardingRequired", false);
      admin.set("permissions", auth.allPermissions());
      admin.set("teamAdminGroup", store.object());
      auth.createUser(admin, adminPassword);
    }
    for (String key :
        List.of(
            "CCMAX_DAILY_SYNC",
            "CCMAX_STATUS_SYNC",
            "QUOTE_AUTO_RENEWAL",
            "WORKBENCH_WECOM_REMINDER")) {
      ObjectNode task =
          store
              .object()
              .put("id", key)
              .put("key", key)
              .put("type", key)
              .put(
                  "name",
                  Map.of(
                          "CCMAX_DAILY_SYNC",
                          "CCMAX 日账同步",
                          "CCMAX_STATUS_SYNC",
                          "CCMAX 状态与费用同步",
                          "QUOTE_AUTO_RENEWAL",
                          "报价自动续期",
                          "WORKBENCH_WECOM_REMINDER",
                          "工作台待办企业微信提醒")
                      .get(key))
              .put("ready", false)
              .put("enabled", false)
              .put("running", false)
              .put("intervalMinutes", 10)
              .put("unavailableReason", "本地环境未配置自动任务执行器");
      store.seed("scheduled-task", "GLOBAL", task);
    }
    for (JsonNode category : store.list("category", null)) {
      String code = category.path("code").asText();
      ObjectNode config =
          store
              .object()
              .put("id", code)
              .put("category", code)
              .put("categoryName", category.path("name").asText())
              .put("minMultiplier", "1")
              .put("maxMultiplier", "1")
              .putNull("currentRpmMultiplier")
              .putNull("currentTpmMultiplier")
              .putNull("generatedAt");
      store.seed("monitoring-multiplier", "GLOBAL", config);
    }
    for (String code : List.of("ADMIN", "OPERATOR", "FINANCE", "SUPPLIER", "SUPPLIER_AGENT")) {
      ObjectNode role =
          store
              .object()
              .put("id", code)
              .put("code", code)
              .put(
                  "name",
                  Map.of(
                          "ADMIN",
                          "平台管理员",
                          "OPERATOR",
                          "平台运营",
                          "FINANCE",
                          "财务人员",
                          "SUPPLIER",
                          "供应商",
                          "SUPPLIER_AGENT",
                          "团队成员")
                      .get(code))
              .put("builtIn", true);
      role.set(
          "permissions", code.equals("ADMIN") ? auth.allPermissions() : rolePolicy.defaults(code));
      role.put("defaultPolicy", RolePolicy.DEFAULT_POLICY_VERSION)
          .put("securityPolicy", RolePolicy.DEFAULT_POLICY_VERSION)
          .put("scopeType", code);
      store.seed("role", "GLOBAL", role);
    }
  }

  /**
   * One-time security migration: intersect every persisted grant with its responsibility ceiling.
   */
  public void migrateRoleDefaults() {
    for (String code : List.of("ADMIN", "OPERATOR", "FINANCE", "SUPPLIER", "SUPPLIER_AGENT")) {
      ObjectNode current = store.get("role", code, null);
      if (!current.path("builtIn").asBoolean(false))
        throw new IllegalStateException("Invalid builtin role: " + code);
      if (RolePolicy.DEFAULT_POLICY_VERSION.equals(current.path("securityPolicy").asText()))
        continue;
      boolean customized = current.path("defaultPolicy").asText().equals("customized");
      Set<String> old = new LinkedHashSet<>(), allowed = new LinkedHashSet<>();
      for (JsonNode permission : current.path("permissions")) old.add(permission.asText());
      for (JsonNode permission : rolePolicy.ceiling(code)) allowed.add(permission.asText());
      if (customized) old.retainAll(allowed);
      else {
        old.clear();
        for (JsonNode permission : rolePolicy.defaults(code)) old.add(permission.asText());
      }
      ObjectNode patch =
          store
              .object()
              .put("version", current.path("version").asLong())
              .put("securityPolicy", RolePolicy.DEFAULT_POLICY_VERSION)
              .put("scopeType", code);
      patch.set("permissions", store.json.valueToTree(old));
      if (!customized) patch.put("defaultPolicy", RolePolicy.DEFAULT_POLICY_VERSION);
      store.update("role", code, null, patch);
    }
    for (ObjectNode user :
        store.jdbc.query("select profile from hub_user", (rs, n) -> store.parse(rs.getString(1)))) {
      if (RolePolicy.DEFAULT_POLICY_VERSION.equals(user.path("securityPolicy").asText())) continue;
      String primary = user.path("role").asText();
      ArrayNode extras = store.json.createArrayNode();
      for (JsonNode code : user.path("additionalRoleCodes")) {
        try {
          rolePolicy.additionalRoles(primary, store.json.valueToTree(List.of(code.asText())));
          extras.add(code.asText());
        } catch (ApiException ignored) {
          /* Legacy cross-duty or unclassified additional roles are revoked. */
        }
      }
      user.set("additionalRoleCodes", extras);
      Set<String> grants = new LinkedHashSet<>(), old = new LinkedHashSet<>();
      for (JsonNode permission : user.path("permissions")) old.add(permission.asText());
      if (RolePolicy.BUILTINS.contains(primary)) {
        for (JsonNode permission : rolePolicy.effectivePermissions(primary, extras)) {
          if (!primary.equals("SUPPLIER_AGENT") || old.contains(permission.asText()))
            grants.add(permission.asText());
        }
      }
      user.set("permissions", store.json.valueToTree(grants));
      user.put("securityPolicy", RolePolicy.DEFAULT_POLICY_VERSION)
          .put("version", user.path("version").asLong() + 1);
      auth.saveUser(user);
      auth.invalidate(user.path("id").asText());
    }
  }

  private void seedPlatformUser(String role, String username, String password) {
    if (username.isBlank()
        || password.isBlank()
        || store.jdbc.queryForObject(
                "select count(*) from hub_user where username=?", Integer.class, username)
            > 0) return;
    ObjectNode user =
        store
            .object()
            .put("id", "local-" + role.toLowerCase())
            .put("username", username)
            .put("displayName", role.equals("OPERATOR") ? "平台运营" : "财务人员")
            .put("version", 0)
            .put("mustChangePassword", false)
            .put("onboardingRequired", false);
    rolePolicy.assign(user, role, store.json.createArrayNode(), null);
    user.set("teamAdminGroup", store.object());
    auth.createUser(user, password);
  }

  private void syncAgents() {
    for (ObjectNode agent : store.list("agent", null)) {
      String id = agent.path("id").asText();
      if (!id.equals("29488753-d429-4766-885c-55fcd7d04856")) continue;
      if (store.jdbc.queryForObject("select count(*) from hub_user where id=?", Integer.class, id)
          > 0) continue;
      if (!memberUsername.isBlank() && !agent.path("username").asText().equals(memberUsername)) {
        agent = store.update("agent", id, null, store.object().put("username", memberUsername));
      }
      String owner =
          store.jdbc.queryForObject(
              "select owner_id from hub_entity where kind='agent' and id=?", String.class, id);
      ObjectNode user = store.object();
      user.put("id", id)
          .put("username", agent.path("username").asText())
          .put("displayName", agent.path("displayName").asText())
          .put("role", "SUPPLIER_AGENT")
          .put("supplierId", owner)
          .put("version", 0)
          .put("mustChangePassword", false)
          .put("onboardingRequired", false);
      user.set("teamAdminGroup", store.object());
      user.set("projectIds", store.json.createArrayNode());
      user.set("permissions", rolePolicy.defaults("SUPPLIER_AGENT"));
      auth.createUser(
          user, memberPassword.isBlank() ? "Aa1!" + SessionGuard.token() : memberPassword);
    }
  }
}
