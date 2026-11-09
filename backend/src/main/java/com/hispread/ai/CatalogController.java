package com.hispread.ai;

import com.fasterxml.jackson.databind.node.*;
import jakarta.servlet.http.*;
import java.time.Instant;
import java.util.*;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api")
public class CatalogController {
  private final Store s;
  private final AuthService a;
  private final AccessPolicy access;
  private final SupplierService suppliers;

  public CatalogController(Store s, AuthService a, AccessPolicy access, SupplierService suppliers) {
    this.s = s;
    this.a = a;
    this.access = access;
    this.suppliers = suppliers;
  }

  @GetMapping("/projects")
  public Object projects(
      @RequestParam(defaultValue = "1") int page,
      @RequestParam(defaultValue = "20") int size,
      @RequestParam(defaultValue = "") String search,
      @RequestParam(required = false) Boolean enabled,
      @RequestParam Map<String, String> filters,
      HttpServletRequest r) {
    a.require(r, "project.read");
    return s.page(
        access.visible("project", r).stream()
            .filter(p -> enabled == null || p.path("enabled").asBoolean() == enabled)
            .filter(
                p ->
                    List.of("category", "settlementMethod", "deliveryMethod").stream()
                        .allMatch(
                            k ->
                                filters.getOrDefault(k, "").isBlank()
                                    || filters.get(k).equals(p.path(k).asText())))
            .filter(
                p -> search.isBlank() || p.toString().toLowerCase().contains(search.toLowerCase()))
            .map(p -> access.publicRecord("project", p, r))
            .toList(),
        page,
        size);
  }

  @GetMapping("/projects/{id}")
  public Object project(@PathVariable String id, HttpServletRequest r) {
    a.require(r, "project.read");
    return access.publicRecord("project", access.get("project", id, r), r);
  }

  @GetMapping("/projects/category-codes")
  public Object codes(HttpServletRequest r) {
    a.require(r, "project.read");
    List<ObjectNode> categories = s.list("category", null);
    if (!categories.isEmpty())
      return categories.stream()
          .map(
              c ->
                  c.deepCopy()
                      .put(
                          "projectCount",
                          s.list("project", null).stream()
                              .filter(
                                  p -> p.path("category").asText().equals(c.path("code").asText()))
                              .count()))
          .toList();
    return access.visible("project", r).stream()
        .map(
            p -> {
              ObjectNode c = s.object();
              c.put("code", p.path("category").asText())
                  .put("name", p.path("categoryName").asText())
                  .put("enabled", true);
              return c;
            })
        .distinct()
        .toList();
  }

  @PostMapping("/projects/category-codes")
  public Object createCategory(@RequestBody ObjectNode body, HttpServletRequest r) {
    requireAdmin(r, "project.write");
    String code = body.path("code").asText().trim();
    if (!code.matches("[A-Za-z0-9_-]{2,40}")
        || body.path("name").asText().isBlank()
        || body.path("name").asText().length() > 160)
      throw new ApiException(400, "大类码值需2–40位字母数字下划线短横线，名称不能为空");
    if (s.list("category", null).stream()
        .anyMatch(c -> c.path("code").asText().equalsIgnoreCase(code)))
      throw new ApiException(409, "项目大类码值已存在");
    return s.create(
        "category",
        "GLOBAL",
        s.object()
            .put("id", code)
            .put("code", code)
            .put("name", body.path("name").asText().trim())
            .put("enabled", true));
  }

  @PutMapping("/projects/category-codes/{code}")
  public Object updateCategory(
      @PathVariable String code, @RequestBody ObjectNode body, HttpServletRequest r) {
    requireAdmin(r, "project.write");
    ObjectNode old = s.get("category", code, null);
    if (body.has("code") && !body.path("code").asText().equals(code))
      throw new ApiException(400, "项目大类码值不可修改");
    if (body.path("name").asText().isBlank() || body.path("name").asText().length() > 160)
      throw new ApiException(400, "请填写有效大类名称");
    ObjectNode patch =
        s.object()
            .put("name", body.path("name").asText().trim())
            .put("enabled", body.path("enabled").asBoolean(old.path("enabled").asBoolean()));
    if (body.has("version")) patch.set("version", body.get("version"));
    return s.update("category", code, null, patch);
  }

  @DeleteMapping("/projects/category-codes/{code}")
  public Object deleteCategory(
      @PathVariable String code, @RequestParam long version, HttpServletRequest r) {
    requireAdmin(r, "project.write");
    ObjectNode old = s.get("category", code, null);
    if (old.path("version").asLong() != version) throw new ApiException(409, "大类已变化，请刷新后重试");
    if (s.list("project", null).stream().anyMatch(p -> p.path("category").asText().equals(code)))
      throw new ApiException(409, "此大类仍有关联项目，不能删除");
    s.delete("category", code, null);
    return Map.of("deleted", true);
  }

  @GetMapping("/projects/categories")
  public Object categories(HttpServletRequest r) {
    a.require(r, "project.read");
    LinkedHashMap<String, ObjectNode> m = new LinkedHashMap<>();
    for (ObjectNode p : access.visible("project", r)) {
      String c = p.path("category").asText();
      ObjectNode d = s.object();
      d.put("code", c).put("name", p.path("categoryName").asText(c)).put("enabled", true);
      m.put(c, d);
    }
    return m.keySet();
  }

  @PostMapping("/projects")
  public Object createProject(@RequestBody ObjectNode b, HttpServletRequest r) {
    requireAdmin(r, "project.write");
    return s.create("project", "GLOBAL", b);
  }

  @PutMapping("/projects/{id}")
  public Object updateProject(
      @PathVariable String id, @RequestBody ObjectNode b, HttpServletRequest r) {
    requireAdmin(r, "project.write");
    return s.update("project", id, null, b);
  }

  @GetMapping("/suppliers")
  public Object suppliers(
      @RequestParam(defaultValue = "1") int page,
      @RequestParam(defaultValue = "20") int size,
      @RequestParam Map<String, String> filters,
      HttpServletRequest r) {
    a.require(r, "supplier.read");
    return s.page(
        access.visible("supplier", r).stream()
            .filter(x -> suppliers.filter(x, filters))
            .map(x -> access.publicRecord("supplier", x, r))
            .toList(),
        page,
        size);
  }

  @GetMapping("/suppliers/{id}")
  public Object supplier(@PathVariable String id, HttpServletRequest r) {
    a.require(r, "supplier.read");
    return access.publicRecord("supplier", access.get("supplier", id, r), r);
  }

  @PutMapping("/suppliers/{id}")
  public Object updateSupplier(
      @PathVariable String id, @RequestBody ObjectNode b, HttpServletRequest r) {
    a.require(r, "supplier.write");
    ObjectNode old = access.get("supplier", id, r);
    ObjectNode allowed = suppliers.profile(b, null);
    if (b.has("version")) allowed.set("version", b.get("version"));
    if (a.admin(r))
      return access.publicRecord(
          "supplier", s.update("supplier", id, access.entityOwner("supplier", id, r), allowed), r);
    ObjectNode patch = s.object();
    patch.set("pendingProfile", allowed);
    patch.put("profileReviewState", "PENDING");
    patch
        .put("profileSubmittedBy", a.userId(r))
        .put("profileSubmittedAt", Instant.now().toString());
    if (allowed.has("version")) patch.set("version", allowed.get("version"));
    return access.publicRecord(
        "supplier", s.update("supplier", id, access.entityOwner("supplier", id, r), patch), r);
  }

  private void requireAdmin(HttpServletRequest r, String permission) {
    if (!a.admin(r)) throw new ApiException(403, "仅最高管理员可执行此操作");
    a.require(r, permission);
  }

  @GetMapping("/accounts")
  public Object accounts(@RequestParam String supplierId, HttpServletRequest r) {
    a.require(r, "account.read");
    access.requireSupplier(r, supplierId);
    return access.visible("account", r).stream()
        .filter(
            x ->
                supplierId.equals(x.path("supplierId").asText())
                    || supplierId.equals(access.entityOwner("account", x.path("id").asText(), r)))
        .map(x -> access.publicRecord("account", x, r))
        .toList();
  }

  @PostMapping("/accounts")
  public Object account(@RequestBody ObjectNode b, HttpServletRequest r) {
    a.require(r, "account.write");
    access.requireSupplier(r, b.path("supplierId").asText());
    String supplierId = b.path("supplierId").asText();
    ObjectNode supplier = access.get("supplier", supplierId, r);
    String number = b.path("accountNumber").asText();
    ObjectNode d = suppliers.account(b, supplier, a.userId(r));
    ObjectNode saved = s.create("account", supplierId, d);
    ObjectNode secret = s.object();
    secret.put("id", saved.path("id").asText()).put("accountNumber", number);
    s.create("account-secret", supplierId, secret);
    return access.publicRecord("account", saved, r);
  }

  @PostMapping("/accounts/{id}/reveal")
  public Object reveal(@PathVariable String id, HttpServletRequest r) {
    a.require(r, "account.sensitive");
    access.get("account", id, r);
    if (access.operator(r) || access.member(r)) throw new ApiException(403, "无权读取收款账号");
    return s.get("account-secret", id, access.entityOwner("account", id, r));
  }

  @PostMapping("/suppliers")
  @Transactional
  public Object createSupplier(@RequestBody ObjectNode body, HttpServletRequest r) {
    a.require(r, "supplier.write");
    if (!a.platform(r)) throw new ApiException(403, "仅平台可新增供应商");
    String id = UUID.randomUUID().toString();
    ObjectNode source = body.path("profile").isObject() ? (ObjectNode) body.path("profile") : body;
    ObjectNode d = suppliers.profile(source, null);
    d.put("id", id)
        .put("supplierId", id)
        .put("code", "S" + id.substring(0, 6).toUpperCase())
        .put("enabled", true)
        .put("state", "PENDING")
        .put("profileReviewState", "PENDING")
        .put("createdBy", a.userId(r));
    if (access.operator(r))
      d.put("ownerUserId", a.userId(r)).put("ownerName", a.user(r).path("displayName").asText());
    if (!body.path("code").asText().isBlank())
      d.put("code", body.path("code").asText().trim().toUpperCase());
    suppliers.code(d.path("code").asText(), null);
    if (d.path("name").asText().isBlank()) throw new ApiException(400, "请填写供应商主体名称");
    ObjectNode created = s.create("supplier", id, d);
    if (body.path("account").isObject()) {
      requireAdmin(r, "supplier.users");
      ObjectNode result = s.object();
      result.set("supplier", created);
      result.set(
          "account", s.json.valueToTree(addSupplierUser(id, (ObjectNode) body.path("account"), r)));
      return result;
    }
    return access.publicRecord("supplier", created, r);
  }

  @PostMapping("/suppliers/{id}/review")
  public Object review(
      @PathVariable String id, @RequestBody ObjectNode body, HttpServletRequest r) {
    requireAdmin(r, "supplier.review");
    ObjectNode old = s.get("supplier", id, null), p = s.object();
    if (!old.path("profileReviewState").asText().equals("PENDING"))
      throw new ApiException(409, "资料不处于待审核状态");
    if (!body.path("approved").asBoolean() && body.path("note").asText().isBlank())
      throw new ApiException(400, "退回资料需填写原因");
    if (body.path("approved").asBoolean()) {
      if (old.path("pendingProfile").isObject()) p.setAll((ObjectNode) old.path("pendingProfile"));
      p.put("state", "APPROVED").put("profileReviewState", "APPROVED").putNull("pendingProfile");
    } else p.put("state", "REJECTED").put("profileReviewState", "REJECTED");
    p.put("reviewNote", body.path("note").asText());
    return s.update("supplier", id, null, p);
  }

  @RequestMapping(
      value = "/suppliers/{id}/enabled",
      method = {RequestMethod.PUT, RequestMethod.POST})
  public Object toggle(
      @PathVariable String id, @RequestBody ObjectNode body, HttpServletRequest r) {
    requireAdmin(r, "supplier.toggle");
    ObjectNode patch = s.object().put("enabled", body.path("enabled").asBoolean());
    if (body.has("version")) patch.set("version", body.get("version"));
    return s.update("supplier", id, null, patch);
  }

  @PutMapping("/suppliers/{id}/code")
  public Object code(@PathVariable String id, @RequestBody ObjectNode body, HttpServletRequest r) {
    a.require(r, "supplier.write");
    if (!a.admin(r)) throw new ApiException(403, "仅最高管理员可修改供应商编码");
    ObjectNode p = s.object().put("code", body.path("code").asText());
    suppliers.code(p.path("code").asText(), id);
    if (body.has("version")) p.set("version", body.get("version"));
    return s.update("supplier", id, null, p);
  }

  @PutMapping("/suppliers/{id}/note")
  public Object note(@PathVariable String id, @RequestBody ObjectNode body, HttpServletRequest r) {
    a.require(r, "supplier.write");
    if (!a.admin(r)) throw new ApiException(403, "仅最高管理员可维护供应商备注");
    ObjectNode p = s.object().put("note", body.path("note").asText());
    if (body.has("version")) p.set("version", body.get("version"));
    return s.update("supplier", id, null, p);
  }

  @GetMapping("/suppliers/available-users")
  public Object availableUsers(HttpServletRequest r) {
    requireAdmin(r, "supplier.users");
    return s
        .jdbc
        .query(
            "select profile from hub_user where enabled=true and (supplier_id is null or"
                + " supplier_id='')",
            (rs, n) -> s.parse(rs.getString(1)))
        .stream()
        .filter(
            u ->
                u.path("role").asText().equals("SUPPLIER")
                    && u.path("supplierId").asText("").isBlank())
        .toList();
  }

  @GetMapping("/suppliers/owner-candidates")
  public Object owners(HttpServletRequest r) {
    requireAdmin(r, "supplier.owner.assign");
    return s
        .jdbc
        .query(
            "select profile from hub_user where supplier_id is null and enabled=true",
            (rs, n) -> s.parse(rs.getString(1)))
        .stream()
        .filter(this::operatorCandidate)
        .toList();
  }

  private boolean operatorCandidate(ObjectNode user) {
    String role = user.path("role").asText();
    if (!Set.of("ADMIN", "OPERATOR").contains(role)
        || !user.path("supplierId").asText("").isBlank()) return false;
    try {
      return s.get("role", role, null).path("builtIn").asBoolean();
    } catch (ApiException e) {
      return false;
    }
  }

  @PutMapping("/suppliers/{id}/owner")
  @Transactional
  public Object owner(@PathVariable String id, @RequestBody ObjectNode body, HttpServletRequest r) {
    requireAdmin(r, "supplier.owner.assign");
    if (body.path("note").asText().isBlank()) throw new ApiException(400, "请填写归属变更原因");
    ObjectNode old = s.get("supplier", id, null);
    ObjectNode p =
        s.object()
            .put("ownerUserId", body.path("ownerUserId").asText())
            .put("ownerNote", body.path("note").asText());
    if (body.has("version")) p.set("version", body.get("version"));
    String user = body.path("ownerUserId").asText();
    if (!user.isBlank()) {
      ObjectNode candidate = a.findUser(user);
      Boolean enabled =
          s.jdbc.queryForObject("select enabled from hub_user where id=?", Boolean.class, user);
      if (!Boolean.TRUE.equals(enabled) || !operatorCandidate(candidate))
        throw new ApiException(403, "请选择已启用的平台运营账号");
      p.put("ownerName", candidate.path("displayName").asText());
    } else p.putNull("ownerUserId").putNull("ownerName");
    ObjectNode updated = s.update("supplier", id, null, p);
    String now = Instant.now().toString();
    for (ObjectNode term : s.list("owner-term", id)) {
      if (!term.hasNonNull("endsAt"))
        s.update("owner-term", term.path("id").asText(), id, s.object().put("endsAt", now));
    }
    s.create(
        "owner-term",
        id,
        s.object()
            .put("supplierId", id)
            .put("ownerUserId", user)
            .put("ownerName", updated.path("ownerName").asText())
            .put("previousOwnerUserId", old.path("ownerUserId").asText())
            .put("startsAt", now)
            .putNull("endsAt")
            .put("note", body.path("note").asText()));
    return updated;
  }

  @GetMapping("/suppliers/{id}/owner-terms")
  public Object ownerTerms(
      @PathVariable String id,
      @RequestParam(defaultValue = "1") int page,
      @RequestParam(defaultValue = "10") int size,
      @RequestParam(defaultValue = "") String search,
      HttpServletRequest r) {
    requireAdmin(r, "supplier.owner.assign");
    s.get("supplier", id, null);
    return s.page(
        s.list("owner-term", id).stream()
            .filter(
                term ->
                    search.isBlank()
                        || term.path("ownerName").asText().contains(search)
                        || term.path("note").asText().contains(search))
            .toList(),
        page,
        size);
  }

  @GetMapping("/suppliers/{id}/users")
  public Object supplierUsers(@PathVariable String id, HttpServletRequest r) {
    requireAdmin(r, "supplier.users");
    s.get("supplier", id, null);
    return s.jdbc.query(
        "select profile from hub_user where supplier_id=?",
        (rs, n) -> s.parse(rs.getString(1)),
        id);
  }

  @PutMapping("/suppliers/{id}/users")
  @Transactional
  public Object linkUsers(
      @PathVariable String id, @RequestBody ObjectNode body, HttpServletRequest r) {
    requireAdmin(r, "supplier.users");
    s.get("supplier", id, null);
    if (!body.path("userIds").isArray()) throw new ApiException(400, "请选择供应商登录账号");
    List<ObjectNode> checked = new ArrayList<>();
    for (var user : body.path("userIds")) {
      ObjectNode u = a.findUser(user.asText());
      Boolean enabled =
          s.jdbc.queryForObject(
              "select enabled from hub_user where id=?", Boolean.class, user.asText());
      if (!Boolean.TRUE.equals(enabled)
          || !u.path("role").asText().equals("SUPPLIER")
          || !u.path("supplierId").asText("").isBlank()
              && !u.path("supplierId").asText().equals(id))
        throw new ApiException(403, "只能绑定已启用且尚未归属供应商的供应商主账号");
      checked.add(u);
    }
    for (ObjectNode u : checked) {
      u.put("supplierId", id);
      a.saveUser(u);
      a.invalidate(u.path("id").asText());
    }
    syncLinkedUsers(id);
    return supplierUsers(id, r);
  }

  private void syncLinkedUsers(String id) {
    List<ObjectNode> profiles =
        s.jdbc.query(
            "select profile from hub_user where supplier_id=?",
            (rs, n) -> s.parse(rs.getString(1)),
            id);
    ArrayNode links = s.json.createArrayNode();
    for (ObjectNode u : profiles) {
      ObjectNode link = s.object();
      for (String field : List.of("id", "username", "displayName", "role"))
        link.set(field, u.path(field));
      link.put("enabled", true);
      links.add(link);
    }
    ObjectNode patch = s.object();
    patch.set("linkedUsers", links);
    s.update("supplier", id, null, patch);
  }

  @PostMapping("/suppliers/{id}/users")
  @Transactional
  public Object addSupplierUser(
      @PathVariable String id, @RequestBody ObjectNode body, HttpServletRequest r) {
    requireAdmin(r, "supplier.users");
    s.get("supplier", id, null);
    String userId;
    ObjectNode response = s.object();
    if (body.path("mode").asText().equals("EXISTING")) {
      userId = body.path("userId").asText();
      if (userId.isBlank()) throw new ApiException(400, "请选择已有供应商主账号");
    } else if (body.path("mode").asText().equals("NEW")) {
      String username = body.path("username").asText().trim();
      if (!username.matches("[A-Za-z0-9._@-]{3,100}")) throw new ApiException(400, "登录账号格式不正确");
      if (s.jdbc.queryForObject(
              "select count(*) from hub_user where username=?", Integer.class, username)
          > 0) throw new ApiException(409, "登录账号已存在");
      String password = body.path("password").asText("");
      if (password.isBlank()) {
        byte[] random = new byte[18];
        new java.security.SecureRandom().nextBytes(random);
        password = "Aa1!" + Base64.getUrlEncoder().withoutPadding().encodeToString(random);
        response.put("initialPassword", password);
      }
      userId = UUID.randomUUID().toString();
      ObjectNode user =
          s.object()
              .put("id", userId)
              .put("username", username)
              .put("displayName", body.path("displayName").asText(username))
              .put("role", "SUPPLIER")
              .putNull("supplierId")
              .put("mustChangePassword", false)
              .put("onboardingRequired", false)
              .put("version", 0);
      user.set("permissions", a.supplierPermissions());
      a.createUser(user, password);
    } else throw new ApiException(400, "请选择新建或已有账号模式");
    ObjectNode link = s.object();
    link.putArray("userIds").add(userId);
    linkUsers(id, link, r);
    return response
        .put("userId", userId)
        .put("username", a.findUser(userId).path("username").asText());
  }

  @GetMapping("/accounts/platform")
  public Object platformAccounts(
      @RequestParam(defaultValue = "1") int page,
      @RequestParam(defaultValue = "20") int size,
      @RequestParam Map<String, String> filters,
      HttpServletRequest r) {
    a.require(r, "account.read");
    if (!a.platform(r)) throw new ApiException(403, "仅平台可访问");
    return s.page(
        access.visible("account", r).stream()
            .filter(
                x ->
                    List.of("supplierId", "accountType", "currency", "state").stream()
                        .allMatch(
                            k ->
                                filters.getOrDefault(k, "").isBlank()
                                    || filters.get(k).equals(x.path(k).asText())))
            .filter(
                x ->
                    filters.getOrDefault("search", "").isBlank()
                        || x.toString().toLowerCase().contains(filters.get("search").toLowerCase()))
            .map(x -> access.publicRecord("account", x, r))
            .toList(),
        page,
        size);
  }

  @PostMapping("/accounts/{id}/review")
  @Transactional
  public Object accountReview(
      @PathVariable String id, @RequestBody ObjectNode body, HttpServletRequest r) {
    a.requirePlatform(r, "account.review");
    ObjectNode old = access.get("account", id, r);
    if (old.path("createdBy").asText().equals(a.userId(r))
        || old.path("updatedBy").asText().equals(a.userId(r)))
      throw new ApiException(403, "不能审核本人创建或修改的账户");
    if (!old.path("state").asText().equals("PENDING")) throw new ApiException(409, "账户不处于待审核状态");
    if (body.path("approved").asBoolean()) suppliers.approveReplacement(old);
    ObjectNode p =
        s.object()
            .put("state", body.path("approved").asBoolean() ? "APPROVED" : "REJECTED")
            .put("reviewNote", body.path("note").asText());
    return access.publicRecord(
        "account", s.update("account", id, access.entityOwner("account", id, r), p), r);
  }
}
