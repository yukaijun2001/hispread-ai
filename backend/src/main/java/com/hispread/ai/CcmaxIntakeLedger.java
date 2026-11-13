package com.hispread.ai;

import static com.hispread.ai.BusinessSupport.*;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.node.*;
import jakarta.servlet.http.HttpServletRequest;
import java.time.*;
import java.util.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/** Daily admission and immutable source accounting. Every writer locks the supplier first. */
@Service
public class CcmaxIntakeLedger {
  private static final Set<String> TIERS = Set.of("FALLBACK", "NORMAL", "PAYMENT_TERM", "PARTNER", "TEMPORARY");
  private static final Set<String> CONTROLLED = Set.of("priority", "weight", "tier", "ranges", "canPro", "can_pro",
      "intakeCategory", "category", "allowanceSource", "source", "proAllowance", "nonProAllowance", "intakeDecision");
  private final Store store;
  private final AuthService auth;
  private final CcmaxAccessPolicy access;

  public CcmaxIntakeLedger(Store store, AuthService auth, CcmaxAccessPolicy access) {
    this.store = store; this.auth = auth; this.access = access;
  }

  void lock(String owner) {
    store.jdbc.queryForObject("select pg_advisory_xact_lock(hashtext(?),hashtext(?))",
        (r, i) -> true, "ccmax-intake-admission", owner);
  }

  static void rejectOverrides(JsonNode request) {
    if (!request.isObject()) return;
    for (String key : CONTROLLED) if (request.has(key))
      throw new ApiException(400, "上号分类、优先级及额度来源由服务端计算", "CCMAX_POLICY_OVERRIDE_FORBIDDEN");
    if (request.path("input").isObject()) rejectOverrides(request.path("input"));
  }

  ObjectNode defaults(boolean system) {
    ObjectNode policy = store.object().put("tier", system ? "NORMAL" : null);
    if (system) policy.put("nonProOpen", false); else policy.putNull("nonProOpen");
    for (String k : List.of("pro", "nonPro")) policy.putObject(k).put("mode", system ? "UNLIMITED" : "INHERIT").putNull("quantity");
    ObjectNode ranges = policy.putObject("ranges");
    if (system) for (String tier : TIERS) ranges.putObject(tier).put("min", 0).put("max", 100);
    return policy;
  }

  private ObjectNode rawPolicy(String id) {
    try { return (ObjectNode) store.get("intake-policy", id, null).path("policy").deepCopy(); }
    catch (ApiException missing) { if (missing.status != 404) throw missing; return defaults(id.equals("system")); }
  }

  ObjectNode effectivePolicy(String owner, String member) {
    ObjectNode resolved = defaults(true);
    for (String id : List.of("system", owner, owner + ":" + member)) {
      if (id.endsWith(":")) continue;
      JsonNode policy = rawPolicy(id);
      for (String category : List.of("pro", "nonPro"))
        if (Set.of("LIMITED", "UNLIMITED").contains(text(policy.path(category), "mode")))
          resolved.set(category, policy.path(category).deepCopy());
      if (policy.path("nonProOpen").isBoolean()) resolved.set("nonProOpen", policy.get("nonProOpen"));
      if (TIERS.contains(text(policy, "tier"))) resolved.set("tier", policy.get("tier"));
      for (String tier : TIERS) if (policy.path("ranges").path(tier).isObject())
        ((ObjectNode) resolved.path("ranges")).set(tier, policy.path("ranges").get(tier).deepCopy());
    }
    return resolved;
  }

  private Long limit(String owner, String category) {
    JsonNode rule = effectivePolicy(owner, "").path(category.equals("PRO") ? "pro" : "nonPro");
    return eq(rule, "mode", "LIMITED") ? rule.path("quantity").asLong() : null;
  }

  private ObjectNode allocation(String owner) {
    List<ObjectNode> rows = store.list("allocation", owner);
    return rows.isEmpty() ? store.object().put("version", 0).set("allocations", store.json.createArrayNode()) : rows.get(0);
  }

  private String group(String owner, String user) {
    for (ObjectNode group : store.list("group", owner))
      for (JsonNode id : group.path("memberIds")) if (id.asText().equals(user)) return text(group, "id");
    return "";
  }

  private JsonNode allocated(String owner, String source, String category) {
    String kind = source.startsWith("G:") ? "GROUP" : "USER", id = source.substring(2);
    for (JsonNode row : allocation(owner).path("allocations"))
      if (eq(row, "kind", kind) && eq(row, "subjectId", id)
          && row.path(category.equals("PRO") ? "proBasisPoints" : "nonProBasisPoints").isIntegralNumber()) return row;
    return null;
  }

  private String parent(JsonNode row) {
    return text(row, "parentGroupId").isBlank() ? "S" : "G:" + text(row, "parentGroupId");
  }

  private Long sourceLimit(String owner, String source, String category) {
    if (source.equals("S")) return limit(owner, category);
    JsonNode row = allocated(owner, source, category);
    if (row == null) return null;
    if (source.startsWith("G:") && !text(row, "parentGroupId").isBlank())
      throw new ApiException(409, "历史交付组划拨来源无效，请重新保存额度分配", "CCMAX_ALLOCATION_INVALID");
    if (!parent(row).equals("S") && allocated(owner, parent(row), category) == null)
      throw new ApiException(409, "上级交付组划拨已失效，请重新保存额度分配", "CCMAX_ALLOCATION_INVALID");
    Long parent = sourceLimit(owner, parent(row), category);
    return parent == null ? 0L : parent * row.path(category.equals("PRO") ? "proBasisPoints" : "nonProBasisPoints").asLong() / 10000;
  }

  private List<String> chain(String owner, String source, String category) {
    List<String> out = new ArrayList<>(); out.add("S");
    if (source.equals("S")) return out;
    JsonNode row = allocated(owner, source, category);
    if (row != null && !parent(row).equals("S")) out.add(parent(row));
    out.add(source); return out;
  }

  private String source(String owner, String user, String category) {
    if (allocated(owner, "U:" + user, category) != null) return "U:" + user;
    String group = group(owner, user);
    return !group.isBlank() && allocated(owner, "G:" + group, category) != null ? "G:" + group : "S";
  }

  private boolean date(String instant, String day) {
    try { return Instant.parse(instant).atZone(ZoneId.of("Asia/Shanghai")).toLocalDate().toString().equals(day); }
    catch (RuntimeException invalid) { return false; }
  }

  private boolean includes(JsonNode chain, String source) {
    for (JsonNode item : chain) if (item.asText().equals(source)) return true;
    return false;
  }

  /** Historical receipts without ledger rows still count once; their unknown class charges both pools. */
  private List<ObjectNode> entries(String owner) {
    List<ObjectNode> entries = new ArrayList<>(store.list("intake-ledger", owner));
    Set<String> booked = new HashSet<>();
    for (ObjectNode row : entries) if (Set.of("SUCCESS", "RESERVED", "CLASSIFIED").contains(text(row, "state"))) booked.add(text(row, "resourceId"));
    Map<String, ObjectNode> successes = new LinkedHashMap<>();
    for (ObjectNode op : store.list("resource-operation", owner)) {
      if (!Set.of("SUBMIT", "DISPATCH", "OAUTH_COMPLETE").contains(text(op, "type"))
          || op.path("result").path("existingAccountUpdated").asBoolean()
          || !text(op.path("oauthBinding"), "accountId").isBlank()) continue;
      String rid = text(op, "resourceId");
      if (booked.contains(rid)) continue;
      ObjectNode resource;
      try { resource = store.get("resource", rid, owner); } catch (ApiException missing) { continue; }
      if (!eq(resource, "resourceType", "CCMAX") || !text(resource, "upstreamChannelId").isBlank()) continue;
      if (Set.of("UNKNOWN", "PENDING", "RUNNING", "SUBMITTING").contains(text(op, "state"))
          && !op.path("creationConfirmedNotCreated").asBoolean() && !op.has("intakeLedgerId")) {
        ObjectNode pending = store.object().put("resourceId", rid).put("userId", text(resource, "createdBy"))
            .put("state", "RESERVED").put("category", "UNKNOWN").put("day", today());
        for (String category : List.of("PRO", "NON_PRO")) pending.putArray(category + "Chain").add("S");
        if (entries.stream().noneMatch(x -> eq(x, "resourceId", rid))) entries.add(pending);
        continue;
      }
      if (!eq(op, "state", "SUCCESS")) continue;
      String completed = text(resource, "submittedAt");
      if (completed.isBlank()) completed = text(op, "finishedAt");
      if (completed.isBlank()) continue;
      ObjectNode prior = successes.get(rid);
      if (prior != null && text(prior, "completedAt").compareTo(completed) <= 0) continue;
      String category = text(op.path("result"), "intakeCategory");
      if (!Set.of("PRO", "NON_PRO").contains(category)) category = "UNKNOWN";
      ObjectNode entry = store.object().put("resourceId", rid).put("userId", resource.path("createdBy").asText(text(resource, "creatorId")))
          .put("state", "SUCCESS").put("category", category).put("completedAt", completed);
      for (String k : List.of("PRO", "NON_PRO")) entry.putArray(k + "Chain").add("S");
      successes.put(rid, entry);
    }
    entries.removeIf(row -> !eq(row, "state", "SUCCESS") && successes.containsKey(text(row, "resourceId")));
    entries.addAll(successes.values()); return entries;
  }

  private long count(String owner, String source, String category, boolean reserved) {
    long n = 0; String day = today();
    for (ObjectNode row : entries(owner)) {
      boolean success = eq(row, "state", "SUCCESS");
      if (reserved ? !Set.of("RESERVED", "CLASSIFIED").contains(text(row, "state")) : !success) continue;
      if (success && !date(text(row, "completedAt"), day)) continue;
      String klass = text(row, "category");
      if (!klass.equals(category) && !klass.equals("UNKNOWN")) continue;
      if (includes(row.path(category + "Chain"), source)) n++;
    }
    return n;
  }

  private boolean reclaimed(String owner, String source, String category) {
    for (JsonNode row : allocation(owner).path("reclaimed"))
      if (eq(row, "source", source) && eq(row, "category", category) && eq(row, "day", today())) return true;
    return false;
  }

  private long childReservations(String owner, String source, String category) {
    long reserved = 0;
    for (JsonNode row : allocation(owner).path("allocations")) {
      if (!parent(row).equals(source)) continue;
      String child = (eq(row, "kind", "GROUP") ? "G:" : "U:") + text(row, "subjectId");
      Long quantity = sourceLimit(owner, child, category);
      if (quantity != null) reserved += Math.max(0, quantity - count(owner, child, category, false) - count(owner, child, category, true));
    }
    return reserved;
  }

  ObjectNode allowance(String owner, String user, String category) {
    String source = source(owner, user, category), group = group(owner, user);
    boolean reclaimed = reclaimed(owner, "U:" + user, category);
    Long quantity = sourceLimit(owner, source, category);
    long used = count(owner, source, category, false), pending = count(owner, source, category, true);
    long children = childReservations(owner, source, category);
    Long remaining = quantity == null ? null : Math.max(0, quantity - used - pending - children);
    // A child never gets more capacity than its ancestors, even after limits are reduced.
    for (String ancestor : chain(owner, source, category)) {
      Long cap = sourceLimit(owner, ancestor, category);
      if (cap != null) {
        long free = Math.max(0, cap - count(owner, ancestor, category, false) - count(owner, ancestor, category, true));
        remaining = remaining == null ? free : Math.min(remaining, free);
      }
    }
    if (reclaimed) remaining = 0L;
    JsonNode memberRule = effectivePolicy(owner, user).path(category.equals("PRO") ? "pro" : "nonPro");
    if (eq(memberRule, "mode", "LIMITED")) {
      long personalUsed = 0;
      for (ObjectNode row : entries(owner))
        if (eq(row, "userId", user) && !eq(row, "state", "RELEASED")
            && (!eq(row, "state", "SUCCESS") || date(text(row, "completedAt"), today()))
            && (eq(row, "category", category) || eq(row, "category", "UNKNOWN"))) personalUsed++;
      long cap = Math.max(0, memberRule.path("quantity").asLong() - personalUsed);
      remaining = remaining == null ? cap : Math.min(remaining, cap);
    }
    ObjectNode out = store.object().put("source", source)
        .put("used", used).put("processing", pending).put("reservedRemaining", children).put("reclaimed", reclaimed);
    if (quantity == null) out.putNull("limit"); else out.put("limit", quantity);
    if (remaining == null) out.putNull("remaining"); else out.put("remaining", remaining);
    if (group.isBlank()) out.putNull("groupId"); else out.put("groupId", group);
    return out;
  }

  private ObjectNode supplierSettings(String owner) {
    try { return store.get("supplier-settings", owner, null); }
    catch (ApiException missing) { if (missing.status != 404) throw missing; return store.object(); }
  }

  private boolean proAllowed(String owner, String user) {
    List<ObjectNode> globals = store.list("settings", null);
    boolean allow = !globals.isEmpty() && globals.get(0).path("allowAllSuppliersPro").asBoolean()
        || supplierSettings(owner).path("allowPro").asBoolean();
    String group = group(owner, user);
    return allow && (group.isBlank() || store.get("group", group, owner).path("allowPro").asBoolean(true));
  }

  private boolean available(JsonNode allowance) {
    return allowance.path("remaining").isNull() || allowance.path("remaining").asLong() > 0;
  }

  ObjectNode decorate(ObjectNode statistics, HttpServletRequest req) {
    if (auth.platform(req)) return statistics;
    String owner = auth.owner(req), user = auth.userId(req);
    ObjectNode pro = allowance(owner, user, "PRO"), nonPro = allowance(owner, user, "NON_PRO");
    boolean enabled = access.allowsIntake(owner);
    boolean nonProOpen = effectivePolicy(owner, user).path("nonProOpen").asBoolean();
    boolean accepting = enabled && nonProOpen && available(nonPro);
    boolean canPro = enabled && proAllowed(owner, user) && available(pro) && (!nonProOpen || available(nonPro));
    long proCount = 0, nonProCount = 0, total = 0, processing = 0;
    for (ObjectNode row : entries(owner)) {
      if (auth.user(req).path("role").asText().equals("SUPPLIER_AGENT") && !eq(row, "userId", user)) continue;
      if (Set.of("RESERVED", "CLASSIFIED").contains(text(row, "state"))) { processing++; continue; }
      if (!eq(row, "state", "SUCCESS") || !date(text(row, "completedAt"), today())) continue;
      total++;
      if (eq(row, "category", "PRO")) proCount++;
      if (eq(row, "category", "NON_PRO")) nonProCount++;
    }
    statistics.put("pro", proCount).put("nonPro", nonProCount).put("total", total).put("processing", processing)
        .put("unknown", Math.max(0, total - proCount - nonProCount))
        .put("canPro", canPro).put("accepting", accepting)
        .put("proBlockReason", !enabled ? "SUPPLIER_DISABLED" : !proAllowed(owner, user) ? "PRO_DISABLED"
            : pro.path("reclaimed").asBoolean() ? "QUOTA_RECLAIMED" : nonProOpen && !available(nonPro) ? "NON_PRO_UNAVAILABLE" : "QUOTA_FULL")
        .put("nonProBlockReason", !enabled ? "SUPPLIER_DISABLED" : !nonProOpen ? "NON_PRO_STOPPED"
            : nonPro.path("reclaimed").asBoolean() ? "QUOTA_RECLAIMED" : "QUOTA_FULL");
    statistics.set("proAllowance", pro); statistics.set("nonProAllowance", nonPro); return statistics;
  }

  ObjectNode reserve(ObjectNode resource, String operationId, HttpServletRequest req) {
    String owner = text(resource, "supplierId"), user = resource.path("createdBy").asText(auth.userId(req));
    lock(owner);
    if (text(resource, "createdBy").isBlank()) user = auth.userId(req);
    for (ObjectNode prior : store.list("intake-ledger", owner))
      if (eq(prior, "resourceId", text(resource, "id")) && Set.of("RESERVED", "CLASSIFIED", "SUCCESS").contains(text(prior, "state")))
        throw new ApiException(409, "该资源已有上号预留或成功记录，请查询原操作", "RESOURCE_OPERATION_UNCERTAIN");
    ObjectNode pro = allowance(owner, user, "PRO"), nonPro = allowance(owner, user, "NON_PRO");
    ObjectNode policy = effectivePolicy(owner, user);
    boolean nonProOpen = policy.path("nonProOpen").asBoolean();
    boolean canNonPro = nonProOpen && available(nonPro);
    boolean canPro = proAllowed(owner, user) && available(pro) && (!nonProOpen || available(nonPro));
    if (!canPro && !canNonPro) throw new ApiException(409, "当前上号分类未开放或每日额度已用尽", "CCMAX_INTAKE_QUOTA_EXHAUSTED");
    String tier = text(policy, "tier"); JsonNode range = policy.path("ranges").path(tier);
    int min = range.path("min").asInt(), max = range.path("max").asInt();
    int priority = min + Math.floorMod(operationId.hashCode(), max - min + 1);
    ObjectNode decision = store.object().put("id", operationId).put("resourceId", text(resource, "id"))
        .put("userId", user).put("supplierId", owner).put("day", today()).put("state", "RESERVED")
        .put("category", "UNKNOWN").put("priority", priority).put("tier", tier).put("allowPro", canPro).put("allowNonPro", canNonPro);
    for (String category : List.of("PRO", "NON_PRO")) {
      ArrayNode path = decision.putArray(category + "Chain");
      if (category.equals("PRO") ? canPro : canNonPro)
        for (String step : chain(owner, source(owner, user, category), category)) path.add(step);
    }
    return store.create("intake-ledger", owner, decision);
  }

  @Transactional
  public void classify(String owner, String operation, String category) {
    lock(owner); ObjectNode reservation = store.get("intake-ledger", operation, owner);
    if (!Set.of("PRO", "NON_PRO").contains(category)) throw new ApiException(422, "上游套餐未识别，账号保持禁用", "PLAN_CHECK_FAILED");
    if (!reservation.path(category.equals("PRO") ? "allowPro" : "allowNonPro").asBoolean())
      throw new ApiException(422, "该套餐未获接收权限或没有可用额度，账号保持禁用",
          category.equals("PRO") ? "PRO_PLAN_NOT_ALLOWED" : "NON_PRO_PLAN_NOT_ALLOWED");
    if (!Set.of("RESERVED", "CLASSIFIED").contains(text(reservation, "state"))) throw new ApiException(409, "额度预留状态已变化");
    if (category.equals("PRO") && !proAllowed(owner, text(reservation, "userId")))
      throw new ApiException(422, "上号期间PRO接收权限已关闭，账号保持禁用", "PRO_PLAN_NOT_ALLOWED");
    if (category.equals("NON_PRO") && !effectivePolicy(owner, text(reservation, "userId")).path("nonProOpen").asBoolean())
      throw new ApiException(422, "上号期间非PRO接收已关闭，账号保持禁用", "NON_PRO_PLAN_NOT_ALLOWED");
    if (reclaimed(owner, "U:" + text(reservation, "userId"), category))
      throw new ApiException(422, "上号期间个人额度已回收，账号保持禁用", "CCMAX_INTAKE_QUOTA_EXHAUSTED");
    List<String> currentChain = chain(owner, source(owner, text(reservation, "userId"), category), category);
    List<String> frozenChain = new ArrayList<>();
    for (JsonNode item : reservation.path(category + "Chain")) frozenChain.add(item.asText());
    if (!currentChain.equals(frozenChain))
      throw new ApiException(422, "预留期间额度来源已变化，账号保持禁用", "CCMAX_INTAKE_SOURCE_CHANGED");
    for (String source : currentChain) {
      Long limit = sourceLimit(owner, source, category);
      if (limit != null && count(owner, source, category, false) + count(owner, source, category, true) > limit)
        throw new ApiException(422, "预留期间额度已下调，账号保持禁用", "CCMAX_INTAKE_QUOTA_EXHAUSTED");
    }
    store.update("intake-ledger", operation, owner, store.object().put("category", category).put("state", "CLASSIFIED"));
  }

  void settle(String owner, String operation, String state) {
    lock(owner);
    ObjectNode row;
    try { row = store.get("intake-ledger", operation, owner); } catch (ApiException absent) { if (absent.status != 404) throw absent; return; }
    if (eq(row, "state", "SUCCESS") || eq(row, "state", "RELEASED")) return;
    if (state.equals("SUCCESS")) store.update("intake-ledger", operation, owner,
        store.object().put("state", "SUCCESS").put("completedAt", Instant.now().toString()));
    else if (state.equals("FAILED")) store.update("intake-ledger", operation, owner, store.object().put("state", "RELEASED"));
  }

  void confirmedArchive(String owner, String resource) {
    lock(owner);
    for (ObjectNode entry : store.list("intake-ledger", owner))
      if (eq(entry, "resourceId", resource) && Set.of("RESERVED", "CLASSIFIED").contains(text(entry, "state")))
        settle(owner, text(entry, "id"), "FAILED");
  }

  ObjectNode allocationView(String owner, ObjectNode out) {
    Long pro = limit(owner, "PRO"), nonPro = limit(owner, "NON_PRO");
    if (pro == null) out.putNull("proLimit"); else out.put("proLimit", pro);
    if (nonPro == null) out.putNull("nonProLimit"); else out.put("nonProLimit", nonPro);
    ArrayNode usage = out.putArray("usage"); Set<String> sources = new LinkedHashSet<>(List.of("S"));
    for (ObjectNode row : entries(owner)) for (String category : List.of("PRO", "NON_PRO"))
      for (JsonNode source : row.path(category + "Chain")) sources.add(source.asText());
    for (JsonNode row : out.path("allocations")) sources.add((eq(row, "kind", "GROUP") ? "G:" : "U:") + text(row, "subjectId"));
    for (String source : sources) for (String category : List.of("PRO", "NON_PRO"))
      usage.addObject().put("source", source).put("category", category).put("used", count(owner, source, category, false))
          .put("processing", count(owner, source, category, true));
    return out;
  }

  void validateAllocations(String owner, ObjectNode body) {
    if (!body.path("allocations").isArray() || body.path("allocations").size() > 2000) throw new ApiException(400, "无效划拨列表");
    Map<String, JsonNode> rows = new HashMap<>(); Map<String, Integer> sums = new HashMap<>();
    for (JsonNode row : body.path("allocations")) {
      String kind = text(row, "kind"), id = text(row, "subjectId"), parent = text(row, "parentGroupId");
      if (!Set.of("GROUP", "USER").contains(kind) || id.isBlank()
          || rows.putIfAbsent((kind.equals("GROUP") ? "G:" : "U:") + id, row) != null) throw new ApiException(400, "划拨对象无效或重复");
      store.get(kind.equals("GROUP") ? "group" : "agent", id, owner);
      if (kind.equals("GROUP") && !parent.isBlank()) throw new ApiException(400, "交付组额度须来自供应商");
      if (!parent.isBlank() && !group(owner, id).equals(parent)) throw new ApiException(400, "个人只能使用所属交付组额度");
      for (String category : List.of("PRO", "NON_PRO")) {
        JsonNode bp = row.path(category.equals("PRO") ? "proBasisPoints" : "nonProBasisPoints");
        if (bp.isMissingNode() || bp.isNull()) continue;
        if (!bp.isIntegralNumber() || !bp.canConvertToInt() || bp.asInt() < 0 || bp.asInt() > 10000) throw new ApiException(400, "划拨比例须为0至10000的整数基点");
        if (limit(owner, category) == null) throw new ApiException(400, "比例划拨须先设置供应商每日数量");
        String key = parent + ":" + category;
        int total = sums.merge(key, bp.asInt(), Integer::sum);
        if (total > 10000) throw new ApiException(400, "同级划拨比例不能超过100%");
      }
    }
    for (JsonNode row : rows.values()) if (!text(row, "parentGroupId").isBlank()) {
      JsonNode parent = rows.get("G:" + text(row, "parentGroupId"));
      if (parent == null) throw new ApiException(400, "个人划拨需要保留上级交付组划拨");
      for (String field : List.of("proBasisPoints", "nonProBasisPoints"))
        if (row.path(field).isIntegralNumber() && !parent.path(field).isIntegralNumber()) throw new ApiException(400, "个人划拨需要明确同类别交付组比例");
    }
  }

  void saveReclaims(String owner, ObjectNode previous, ObjectNode patch) {
    ArrayNode reclaimed = patch.putArray("reclaimed");
    for (JsonNode row : previous.path("reclaimed")) if (eq(row, "day", today())) reclaimed.add(row.deepCopy());
    for (JsonNode old : previous.path("allocations")) {
      String source = (eq(old, "kind", "GROUP") ? "G:" : "U:") + text(old, "subjectId");
      JsonNode replacement = null;
      for (JsonNode row : patch.path("allocations")) if (eq(row, "kind", text(old, "kind")) && eq(row, "subjectId", text(old, "subjectId"))) replacement = row;
      for (String category : List.of("PRO", "NON_PRO")) {
        String field = category.equals("PRO") ? "proBasisPoints" : "nonProBasisPoints";
        if (old.path(field).isIntegralNumber() && (replacement == null || !replacement.path(field).isIntegralNumber()))
          reclaimed.addObject().put("source", source).put("category", category).put("day", today());
      }
    }
  }

  void requireGroupRemovalWithoutAllocations(String owner, String id) {
    lock(owner);
    for (JsonNode row : allocation(owner).path("allocations"))
      if (eq(row, "parentGroupId", id) || eq(row, "kind", "GROUP") && eq(row, "subjectId", id))
        throw new ApiException(409, "删除交付组前须先回收其额度及组内个人划拨");
  }

  void requireMovableMember(String owner, String user, String destination) {
    lock(owner);
    for (JsonNode row : allocation(owner).path("allocations"))
      if (eq(row, "kind", "USER") && eq(row, "subjectId", user) && !text(row, "parentGroupId").isBlank()
          && !eq(row, "parentGroupId", destination))
        throw new ApiException(409, "成员迁移前须先回收原交付组的个人划拨");
  }
}
