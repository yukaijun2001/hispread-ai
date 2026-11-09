package com.hispread.ai;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.node.*;
import jakarta.servlet.http.HttpServletRequest;
import java.math.BigDecimal;
import java.time.*;
import java.util.*;
import java.util.stream.Collectors;
import org.springframework.stereotype.Service;

/** Shared domain utilities. All tenant reads remain explicitly scoped. */
@Service
public class BusinessSupport {
  final Store store;
  final AuthService auth;
  final AccessPolicy access;

  public BusinessSupport(Store store, AuthService auth, AccessPolicy access) {
    this.store = store;
    this.auth = auth;
    this.access = access;
  }

  static String text(JsonNode n, String field) {
    return n.path(field).asText("");
  }

  static boolean eq(JsonNode n, String field, String expected) {
    return expected.equals(text(n, field));
  }

  static String today() {
    return LocalDate.now(ZoneId.of("Asia/Shanghai")).toString();
  }

  static BigDecimal amount(JsonNode n, String field) {
    try {
      return new BigDecimal(n.path(field).asText("0"));
    } catch (NumberFormatException e) {
      return BigDecimal.ZERO;
    }
  }

  static BigDecimal decimal(JsonNode n, String field, boolean positive) {
    try {
      BigDecimal d = new BigDecimal(n.path(field).asText(""));
      if (d.signum() < (positive ? 1 : 0)) throw new NumberFormatException();
      return d;
    } catch (NumberFormatException e) {
      throw new ApiException(400, "请填写有效的" + field);
    }
  }

  static void required(JsonNode n, String... fields) {
    for (String f : fields) if (text(n, f).isBlank()) throw new ApiException(400, "请填写" + f);
  }

  ObjectNode obj() {
    return store.object();
  }

  ArrayNode arr(Object value) {
    return store.json.valueToTree(value);
  }

  ObjectNode pick(JsonNode body, String... fields) {
    ObjectNode p = obj();
    for (String f : fields) if (body.has(f)) p.set(f, body.get(f));
    return p;
  }

  ObjectNode page(List<ObjectNode> rows, Map<String, String> q) {
    return store.page(rows, integer(q, "page", 1), integer(q, "size", 10));
  }

  static int integer(Map<String, String> q, String field, int fallback) {
    try {
      return Integer.parseInt(q.getOrDefault(field, "" + fallback));
    } catch (NumberFormatException e) {
      return fallback;
    }
  }

  boolean admin(HttpServletRequest req) {
    return auth.admin(req);
  }

  boolean platform(HttpServletRequest req) {
    return auth.platform(req);
  }

  String scope(HttpServletRequest req) {
    return auth.scope(req);
  }

  String tenant(HttpServletRequest req, JsonNode body) {
    if (!platform(req)) {
      access.requireSupplier(req, auth.owner(req));
      return auth.owner(req);
    }
    required(body, "supplierId");
    String owner = text(body, "supplierId");
    access.requireSupplier(req, owner);
    return owner;
  }

  String recordOwner(JsonNode row, HttpServletRequest req) {
    return platform(req) ? text(row, "supplierId") : auth.owner(req);
  }

  String entityOwner(String kind, String id, HttpServletRequest req) {
    return access.entityOwner(kind, id, req);
  }

  List<ObjectNode> owned(String kind, HttpServletRequest req) {
    List<ObjectNode> rows = access.visible(kind, req);
    return kind.equals("quote") ? rows.stream().map(this::currentQuote).toList() : rows;
  }

  ObjectNode currentQuote(ObjectNode stored) {
    ObjectNode quote = stored.deepCopy();
    if (!eq(quote, "state", "APPROVED")) return quote;
    String field = eq(quote, "pricingType", "FIXED") ? "unitPrice" : "multiplier";
    Instant now = Instant.now(), currentAt = Instant.MIN, nextAt = Instant.MAX;
    JsonNode current = null, next = null;
    for (JsonNode price : quote.path("priceHistory")) {
      try {
        Instant effective = Instant.parse(text(price, "effectiveAt"));
        if (!effective.isAfter(now) && !effective.isBefore(currentAt) && price.hasNonNull(field)) {
          currentAt = effective;
          current = price;
        } else if (effective.isAfter(now)
            && effective.isBefore(nextAt)
            && price.hasNonNull(field)) {
          nextAt = effective;
          next = price;
        }
      } catch (DateTimeException ignored) {
      }
    }
    if (current != null) quote.set(field, current.path(field));
    quote.remove("upcomingPrice");
    if (next != null) {
      ObjectNode upcoming =
          obj()
              .put(
                  "effectiveFrom",
                  nextAt.atZone(ZoneId.of("Asia/Shanghai")).toLocalDate().toString());
      upcoming.set(field, next.path(field));
      quote.set("upcomingPrice", upcoming);
    }
    return quote;
  }

  boolean member(HttpServletRequest req) {
    return eq(auth.user(req), "role", "SUPPLIER_AGENT");
  }

  Set<String> projectIds(HttpServletRequest req) {
    return member(req) ? access.assignedProjects(req) : null;
  }

  boolean canResource(JsonNode row, HttpServletRequest req) {
    return access.canMemberResource(row, req);
  }

  ObjectNode get(String kind, String id, HttpServletRequest req) {
    return access.get(kind, id, req);
  }

  ObjectNode update(String kind, String id, HttpServletRequest req, ObjectNode patch) {
    get(kind, id, req);
    return store.update(kind, id, entityOwner(kind, id, req), patch);
  }

  ObjectNode publicRecord(String kind, ObjectNode record, HttpServletRequest req) {
    return access.publicRecord(kind, record, req);
  }

  List<ObjectNode> scopedResources(HttpServletRequest req) {
    return owned("resource", req).stream()
        .filter(r -> !r.path("deleted").asBoolean() && canResource(r, req))
        .collect(Collectors.toCollection(ArrayList::new));
  }

  ObjectNode resource(String id, HttpServletRequest req) {
    ObjectNode d = get("resource", id, req);
    if (d.path("deleted").asBoolean() || !canResource(d, req))
      throw new ApiException(404, "资源不存在或无权访问");
    return d;
  }

  ObjectNode project(String id) {
    return store.get("project", id, null);
  }

  boolean contains(JsonNode n, String keyword, String... fields) {
    if (keyword == null || keyword.isBlank()) return true;
    String k = keyword.toLowerCase(Locale.ROOT);
    for (String f : fields) if (text(n, f).toLowerCase(Locale.ROOT).contains(k)) return true;
    return false;
  }

  boolean match(JsonNode n, Map<String, String> q, String query, String field) {
    String v = q.getOrDefault(query, "");
    return v.isBlank() || eq(n, field, v);
  }

  boolean dates(
      JsonNode n,
      Map<String, String> q,
      String fromQ,
      String toQ,
      String fromField,
      String toField) {
    String from = q.getOrDefault(fromQ, ""), to = q.getOrDefault(toQ, "");
    return (from.isBlank() || datePart(n, toField).compareTo(from) >= 0)
        && (to.isBlank() || datePart(n, fromField).compareTo(to) <= 0);
  }

  static String datePart(JsonNode n, String field) {
    String value = text(n, field);
    return value.length() > 10 ? value.substring(0, 10) : value;
  }

  List<ObjectNode> eligible(HttpServletRequest req) {
    return eligibleForSupplier(
        req, platform(req) ? req.getParameter("supplierId") : auth.owner(req));
  }

  List<ObjectNode> eligibleForSupplier(HttpServletRequest req, String supplierId) {
    if (supplierId != null && !supplierId.isBlank()) access.requireSupplier(req, supplierId);
    String now = today();
    Map<String, List<ObjectNode>> quotes =
        (member(req) ? store.list("quote", supplierId) : owned("quote", req))
            .stream()
                .filter(
                    q ->
                        supplierId == null
                            || supplierId.isBlank()
                            || eq(q, "supplierId", supplierId))
                .map(this::currentQuote)
                .filter(
                    q ->
                        eq(q, "state", "APPROVED")
                            && approvedSupplier(text(q, "supplierId"))
                            && text(q, "effectiveFrom").compareTo(now) <= 0
                            && text(q, "effectiveTo").compareTo(now) >= 0)
                .collect(Collectors.groupingBy(q -> text(q, "projectId")));
    Set<String> ids = projectIds(req);
    List<ObjectNode> result = new ArrayList<>();
    for (ObjectNode p : store.list("project", null)) {
      String id = text(p, "id");
      List<ObjectNode> qs = quotes.getOrDefault(id, List.of());
      if (access.canProject(req, id)
          && p.path("enabled").asBoolean()
          && qs.size() == 1
          && (ids == null || ids.contains(id))) {
        ObjectNode x = p.deepCopy();
        x.set("quoteBasis", qs.get(0));
        x.put("quoteToken", quoteToken(qs.get(0)));
        result.add(x);
      }
    }
    return result;
  }

  private String quoteToken(ObjectNode quote) {
    try {
      String value = text(quote, "id") + ":" + quote.path("version").asLong();
      return java.util.HexFormat.of()
          .formatHex(
              java.security.MessageDigest.getInstance("SHA-256")
                  .digest(value.getBytes(java.nio.charset.StandardCharsets.UTF_8)));
    } catch (Exception e) {
      throw new IllegalStateException(e);
    }
  }

  private boolean approvedSupplier(String id) {
    try {
      ObjectNode supplier = store.get("supplier", id, null);
      return supplier.path("enabled").asBoolean(true) && eq(supplier, "state", "APPROVED");
    } catch (ApiException missing) {
      return false;
    }
  }

  void requireApprovedSupplier(HttpServletRequest req, String id) {
    access.requireSupplier(req, id);
    if (!approvedSupplier(id)) throw new ApiException(409, "供应商主体尚未审核通过或已停用");
  }

  boolean acceptsIntakeType(JsonNode project, int channelType) {
    if (eq(project, "category", "CCMAX")) return false;
    for (JsonNode type : project.path("supportedIntakeTypes"))
      if (type.isIntegralNumber() && type.asInt() == channelType) return true;
    return false;
  }

  ObjectNode eligibleProject(String id, HttpServletRequest req) {
    return eligible(req).stream()
        .filter(p -> eq(p, "id", id))
        .findFirst()
        .orElseThrow(() -> new ApiException(409, "该项目今日没有唯一有效的已通过报价，暂不可交付"));
  }

  void mainSupplier(HttpServletRequest req) {
    if (member(req)) throw new ApiException(403, "仅供应商主账号可执行此操作");
  }

  ApiException external() {
    return new ApiException(503, "尚未配置真实上游服务；本地资料已保留，未执行外部操作");
  }
}
