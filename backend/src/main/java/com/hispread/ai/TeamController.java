package com.hispread.ai;

import static com.hispread.ai.BusinessSupport.*;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.node.*;
import jakarta.servlet.http.HttpServletRequest;
import java.security.SecureRandom;
import java.util.*;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api")
public class TeamController {
  private final Store store;
  private final AuthService auth;
  private final BusinessSupport b;
  private final CcmaxIntakeLedger intakeLedger;

  public TeamController(Store store, AuthService auth, BusinessSupport b, CcmaxIntakeLedger intakeLedger) {
    this.store = store;
    this.auth = auth;
    this.b = b;
    this.intakeLedger = intakeLedger;
  }

  private void manage(HttpServletRequest req) {
    auth.require(req, "supplier.agent.manage");
    if (auth.platform(req) && !auth.admin(req)) throw new ApiException(403, "仅供应商主账号管理团队");
  }

  private Set<String> groupMembers(JsonNode group) {
    Set<String> ids = new LinkedHashSet<>();
    for (JsonNode x : group.path("memberIds")) ids.add(x.asText());
    return ids;
  }

  private ObjectNode adminGroup(HttpServletRequest req) {
    if (!b.member(req)) return null;
    String id = text(auth.user(req).path("teamAdminGroup"), "id");
    if (id.isBlank()) throw new ApiException(403, "仅部门管理员可管理组员");
    return b.access.activeGroup(req).orElseThrow(() -> new ApiException(403, "部门管理权限已失效"));
  }

  private ObjectNode member(String id, HttpServletRequest req) {
    ObjectNode a = b.get("agent", id, req), g = adminGroup(req);
    if (g != null && !groupMembers(g).contains(id)) throw new ApiException(404, "成员不存在或无权访问");
    return a;
  }

  @GetMapping("/supplier-agents")
  public List<ObjectNode> members(
      @RequestParam(defaultValue = "") String supplierId, HttpServletRequest req) {
    manage(req);
    ObjectNode group = adminGroup(req);
    return b.owned("agent", req).stream()
        .filter(
            x ->
                (!b.platform(req) || supplierId.isBlank() || eq(x, "supplierId", supplierId))
                    && (group == null || groupMembers(group).contains(text(x, "id"))))
        .map(x -> b.publicRecord("agent", x, req))
        .toList();
  }

  @PostMapping("/supplier-agents")
  @Transactional
  public ObjectNode create(@RequestBody ObjectNode body, HttpServletRequest req) {
    manage(req);
    b.mainSupplier(req);
    required(body, "username", "displayName");
    String username = text(body, "username").trim();
    if (!username.matches("[A-Za-z0-9._@-]{3,100}"))
      throw new ApiException(400, "账号须为至少3位字母、数字及._@-");
    if (store.jdbc.queryForObject(
            "select count(*) from hub_user where username=?", Integer.class, username)
        > 0) throw new ApiException(409, "这个登录账号已存在，可在列表中重置密码");
    String owner = b.tenant(req, body),
        id = UUID.randomUUID().toString(),
        password = text(body, "password"),
        groupId = text(body, "groupId");
    ObjectNode restricted = adminGroup(req);
    if (restricted != null) groupId = text(restricted, "id");
    List<ObjectNode> groups = store.list("group", owner);
    ObjectNode group;
    if (groupId.isBlank()) {
      if (groups.isEmpty()) {
        ObjectNode g = b.obj().put("name", "交付组1");
        g.putArray("memberIds");
        group = store.create("group", owner, g);
      } else group = groups.get(0);
    } else group = store.get("group", groupId, owner);
    boolean generated = password.isBlank();
    if (generated) password = randomPassword();
    ObjectNode profile =
        b.obj()
            .put("id", id)
            .put("username", username)
            .put("displayName", text(body, "displayName").trim())
            .put("role", "SUPPLIER_AGENT")
            .put("supplierId", owner)
            .put("mustChangePassword", false)
            .put("onboardingRequired", false)
            .put("version", 0);
    profile.set("permissions", auth.rolePermissions("SUPPLIER_AGENT"));
    profile.putArray("projectIds");
    profile.putObject("teamAdminGroup");
    auth.createUser(profile, password);
    ObjectNode agent = profile.deepCopy().put("enabled", true).put("groupId", text(group, "id"));
    agent.putArray("projects");
    store.create("agent", owner, agent);
    Set<String> ids = groupMembers(group);
    ids.add(id);
    ObjectNode patch = b.obj().put("version", group.path("version").asLong());
    patch.set("memberIds", b.arr(ids));
    store.update("group", text(group, "id"), owner, patch);
    ObjectNode out =
        b.obj().put("id", id).put("username", username).put("groupName", text(group, "name"));
    if (generated) out.put("initialPassword", password);
    return out;
  }

  private String randomPassword() {
    byte[] bytes = new byte[18];
    new SecureRandom().nextBytes(bytes);
    return "Aa1!" + Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
  }

  @PutMapping("/supplier-agents/{id}/enabled")
  @Transactional
  public ObjectNode enabled(
      @PathVariable String id, @RequestBody ObjectNode body, HttpServletRequest req) {
    manage(req);
    b.mainSupplier(req);
    member(id, req);
    if (!body.path("enabled").isBoolean()) throw new ApiException(400, "请提供有效的账号启用状态");
    if (!body.has("version")) throw new ApiException(400, "请提供当前成员版本");
    ObjectNode user = auth.lockUser(id);
    ObjectNode patch = b.pick(body, "enabled", "version");
    ObjectNode result = b.update("agent", id, req, patch);
    user.put("version", user.path("version").asLong() + 1);
    auth.setEnabled(user, body.path("enabled").asBoolean());
    return result;
  }

  @PostMapping("/supplier-agents/{id}/password")
  public ObjectNode reset(
      @PathVariable String id, @RequestBody ObjectNode body, HttpServletRequest req) {
    manage(req);
    b.mainSupplier(req);
    member(id, req);
    String pass = text(body, "password");
    if (pass.isBlank()) pass = randomPassword();
    AuthService.validatePassword(pass);
    store.jdbc.update(
        "update hub_user set password_hash=?,session_version=session_version+1 where id=?",
        auth.passwords().encode(pass),
        id);
    return b.obj().put("initialPassword", pass);
  }

  @GetMapping("/supplier-agents/{id}/projects")
  public ObjectNode permissions(@PathVariable String id, HttpServletRequest req) {
    manage(req);
    ObjectNode a = member(id, req), out = b.obj();
    List<String> assigned = new ArrayList<>();
    for (JsonNode p : auth.findUser(id).path("projectIds")) assigned.add(p.asText());
    out.set("assignedIds", b.arr(assigned));
    String owner = b.entityOwner("agent", id, req);
    List<ObjectNode> available = new ArrayList<>(b.eligibleForSupplier(req, owner));
    Set<String> included = new HashSet<>();
    available.forEach(
        x -> {
          x.put("assignable", true);
          included.add(text(x, "id"));
        });
    for (String pid : assigned)
      if (!included.contains(pid)) {
        try {
          ObjectNode p = b.project(pid).deepCopy().put("assignable", false);
          available.add(p);
        } catch (ApiException ignored) {
        }
      }
    if (b.member(req))
      available =
          available.stream()
              .filter(p -> b.access.assignedProjects(req).contains(text(p, "id")))
              .toList();
    out.set(
        "availableProjects",
        b.arr(available.stream().map(x -> b.publicRecord("project", x, req)).toList()));
    return out;
  }

  @PutMapping("/supplier-agents/{id}/projects")
  @Transactional
  public ObjectNode savePermissions(
      @PathVariable String id, @RequestBody ObjectNode body, HttpServletRequest req) {
    manage(req);
    ObjectNode a = member(id, req);
    if (id.equals(auth.userId(req))) throw new ApiException(403, "自己的项目权限由供应商分配");
    Set<String> allowed = new HashSet<>();
    for (JsonNode p : permissions(id, req).path("availableProjects"))
      if (p.path("assignable").asBoolean()) allowed.add(text(p, "id"));
    Set<String> old = new HashSet<>();
    for (JsonNode p : auth.findUser(id).path("projectIds")) old.add(p.asText());
    List<ObjectNode> projects = new ArrayList<>();
    Set<String> ids = new LinkedHashSet<>();
    if (!body.path("projectIds").isArray()) throw new ApiException(400, "projectIds须为数组");
    for (JsonNode n : body.path("projectIds")) {
      String pid = n.asText();
      if (b.member(req)
          ? !b.access.assignedProjects(req).contains(pid)
          : !allowed.contains(pid) && !old.contains(pid)) throw new ApiException(403, "无权分配该项目");
      if (ids.add(pid)) projects.add(b.project(pid));
    }
    ObjectNode patch = b.obj();
    patch.set("projects", b.arr(projects));
    ObjectNode updated = b.update("agent", id, req, patch);
    ObjectNode user = auth.findUser(id);
    user.set("projectIds", b.arr(ids));
    auth.saveUser(user);
    auth.invalidate(id);
    return b.publicRecord("agent", updated, req);
  }

  @GetMapping("/supplier-team-groups")
  public List<ObjectNode> groups(
      @RequestParam(defaultValue = "") String supplierId, HttpServletRequest req) {
    manage(req);
    b.mainSupplier(req);
    return b.owned("group", req).stream()
        .filter(
            x ->
                supplierId.isBlank()
                    || b.entityOwner("group", text(x, "id"), req).equals(supplierId))
        .map(x -> b.publicRecord("group", x, req))
        .toList();
  }

  @PostMapping("/supplier-team-groups")
  @Transactional
  public ObjectNode createGroup(@RequestBody ObjectNode body, HttpServletRequest req) {
    manage(req);
    b.mainSupplier(req);
    ObjectNode patch = validateGroup(body, null, req);
    ObjectNode created = store.create("group", b.tenant(req, body), patch);
    moveMembers(created, body, req);
    syncGroupAdmins(req);
    return created;
  }

  @PutMapping("/supplier-team-groups/{id}")
  @Transactional
  public ObjectNode updateGroup(
      @PathVariable String id, @RequestBody ObjectNode body, HttpServletRequest req) {
    manage(req);
    b.mainSupplier(req);
    ObjectNode old = b.get("group", id, req);
    ObjectNode patch = validateGroup(body, old, req);
    ObjectNode updated = b.update("group", id, req, patch);
    moveMembers(updated, body, req);
    syncGroupAdmins(req);
    return updated;
  }

  private ObjectNode validateGroup(ObjectNode body, ObjectNode old, HttpServletRequest req) {
    required(body, "name");
    if (text(body, "name").length() > 100) throw new ApiException(400, "部门名称最多100字");
    ObjectNode patch = b.pick(body, "name", "adminUserId", "memberIds", "version", "allowPro");
    if (b.platform(req))
      patch.put("supplierId", old == null ? b.tenant(req, body) : text(old, "supplierId"));
    Set<String> ids = groupMembers(body);
    if (old != null && !ids.containsAll(groupMembers(old)))
      throw new ApiException(409, "成员必须归属部门，请从目标部门执行成员迁移");
    String admin = text(body, "adminUserId");
    if (!admin.isBlank()) ids.add(admin);
    String owner = old == null ? b.tenant(req, body) : b.entityOwner("group", text(old, "id"), req);
    intakeLedger.lock(owner);
    if (body.has("allowPro") && !body.path("allowPro").isBoolean()) throw new ApiException(400, "交付组PRO开关须为布尔值");
    for (String id : ids) {
      intakeLedger.requireMovableMember(owner, id, old == null ? "" : text(old, "id"));
      ObjectNode a = store.get("agent", id, owner);
      if (id.equals(admin) && !auth.enabled(id))
        throw new ApiException(400, "请选择已启用的部门管理员");
    }
    for (ObjectNode other : store.list("group", owner)) {
      if (old != null && eq(other, "id", text(old, "id"))) continue;
      String oa = text(other, "adminUserId");
      if (!oa.isBlank() && ids.contains(oa)) throw new ApiException(409, "请先更换原部门管理员");
    }
    patch.set("memberIds", b.arr(ids));
    if (admin.isBlank()) patch.putNull("adminUserId");
    return patch;
  }

  private void moveMembers(ObjectNode target, ObjectNode body, HttpServletRequest req) {
    String owner = b.entityOwner("group", text(target, "id"), req);
    Set<String> targetIds = groupMembers(target);
    for (ObjectNode other : store.list("group", owner)) {
      if (eq(other, "id", text(target, "id"))) continue;
      Set<String> remaining = groupMembers(other);
      if (remaining.removeAll(targetIds)) {
        String id = text(other, "id");
        if (!body.path("sourceVersions").has(id)
            || body.path("sourceVersions").path(id).asLong() != other.path("version").asLong())
          throw new ApiException(409, "成员来源部门已变化，请刷新后重试");
        ObjectNode patch = b.obj().put("version", other.path("version").asLong());
        patch.set("memberIds", b.arr(remaining));
        b.update("group", id, req, patch);
      }
    }
    for (String id : targetIds)
      b.update("agent", id, req, b.obj().put("groupId", text(target, "id")));
  }

  private void syncGroupAdmins(HttpServletRequest req) {
    List<ObjectNode> groups = b.owned("group", req);
    for (ObjectNode a : b.owned("agent", req)) {
      String id = text(a, "id");
      ObjectNode user;
      try {
        user = auth.findUser(id);
      } catch (ApiException missing) {
        continue;
      }
      ObjectNode group =
          groups.stream().filter(g -> eq(g, "adminUserId", id)).findFirst().orElse(null);
      ObjectNode admin = b.obj();
      if (group != null) admin.put("id", text(group, "id")).put("name", text(group, "name"));
      user.set("teamAdminGroup", admin);
      Set<String> permissions = new LinkedHashSet<>();
      for (JsonNode p : user.path("permissions")) permissions.add(p.asText());
      if (group != null) {
        permissions.add("supplier.agent.manage");

      } else {
        permissions.remove("supplier.agent.manage");
      }
      user.set("permissions", b.arr(permissions));
      auth.saveUser(user);
      auth.invalidate(id);
    }
  }

  @PostMapping("/supplier-team-groups/{id}/remove")
  @Transactional
  public ObjectNode removeGroup(
      @PathVariable String id, @RequestBody ObjectNode body, HttpServletRequest req) {
    manage(req);
    b.mainSupplier(req);
    ObjectNode old = b.get("group", id, req);
    intakeLedger.requireGroupRemovalWithoutAllocations(b.entityOwner("group", id, req), id);
    if (old.path("version").asLong() != body.path("version").asLong(-1))
      throw new ApiException(409, "部门已变化，请刷新");
    if (b.owned("group", req).size() < 2) throw new ApiException(409, "至少保留一个部门");
    String target = text(body, "targetGroupId");
    if (target.isBlank() || target.equals(id)) throw new ApiException(400, "请选择其他目标部门");
    ObjectNode dest = store.get("group", target, b.entityOwner("group", id, req));
    if (dest.path("version").asLong() != body.path("targetVersion").asLong(-1))
      throw new ApiException(409, "目标部门已变化");
    Set<String> ids = groupMembers(dest);
    ids.addAll(groupMembers(old));
    ObjectNode patch = b.obj().put("version", dest.path("version").asLong());
    patch.set("memberIds", b.arr(ids));
    b.update("group", target, req, patch);
    store.delete("group", id, b.entityOwner("group", id, req));
    for (String mid : groupMembers(old))
      b.update("agent", mid, req, b.obj().put("groupId", target));
    syncGroupAdmins(req);
    return b.obj().put("removed", true);
  }

  @GetMapping("/cc-intake/allocations")
  public ObjectNode allocations(HttpServletRequest req) {
    manage(req);
    b.mainSupplier(req);
    List<ObjectNode> existing = b.owned("allocation", req);
    ObjectNode out = existing.isEmpty() ? b.obj().put("version", 0) : existing.get(0).deepCopy();
    out.set("groups", b.arr(b.owned("group", req)));
    out.set(
        "members",
        b.arr(
            b.owned("agent", req).stream()
                .map(member -> b.publicRecord("agent", member, req))
                .toList()));
    ArrayNode memberships = out.putArray("memberships");
    for (ObjectNode g : b.owned("group", req))
      for (String id : groupMembers(g))
        memberships.add(b.obj().put("userId", id).put("groupId", text(g, "id")));
    if (!out.has("allocations")) out.putArray("allocations");
    return intakeLedger.allocationView(auth.owner(req), out);
  }

  @PutMapping("/cc-intake/allocations")
  @Transactional
  public ObjectNode saveAllocations(@RequestBody ObjectNode body, HttpServletRequest req) {
    manage(req);
    b.mainSupplier(req);
    if (auth.platform(req)) throw new ApiException(403, "仅供应商主账号划拨团队额度");
    intakeLedger.lock(auth.owner(req));
    intakeLedger.validateAllocations(auth.owner(req), body);
    if (!body.path("allocations").isArray()) throw new ApiException(400, "allocations须为数组");
    for (JsonNode g : body.path("groupPro")) {
      if (!g.path("allowPro").isBoolean() || !g.path("version").isIntegralNumber()) throw new ApiException(400, "无效交付组开关或版本");
      ObjectNode patch =
          b.obj()
              .put("allowPro", g.path("allowPro").asBoolean())
              .put("version", g.path("version").asLong());
      b.update("group", text(g, "id"), req, patch);
    }
    List<ObjectNode> existing = b.owned("allocation", req);
    ObjectNode data = b.pick(body, "allocations", "version");
    if (!existing.isEmpty() && (!body.path("version").isIntegralNumber()
        || body.path("version").asLong() != existing.get(0).path("version").asLong()))
      throw new ApiException(409, "划拨配置已更新，请刷新");
    intakeLedger.saveReclaims(auth.owner(req), existing.isEmpty() ? b.obj() : existing.get(0), data);
    if (existing.isEmpty()) {
      data.put("id", UUID.randomUUID().toString());
      store.create("allocation", b.scope(req), data);
    } else store.update("allocation", text(existing.get(0), "id"), b.scope(req), data);
    return allocations(req);
  }
}
