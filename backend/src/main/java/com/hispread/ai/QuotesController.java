package com.hispread.ai;

import static com.hispread.ai.BusinessSupport.*;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.node.*;
import jakarta.servlet.http.HttpServletRequest;
import java.math.BigDecimal;
import java.time.*;
import java.util.*;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/quotes")
public class QuotesController {
  private final BusinessSupport b;
  private final Store store;
  private final AuthService auth;
  private final QuotePricingService pricing;

  public QuotesController(
      BusinessSupport b, Store store, AuthService auth, QuotePricingService pricing) {
    this.b = b;
    this.store = store;
    this.auth = auth;
    this.pricing = pricing;
  }

  @GetMapping
  public ObjectNode list(@RequestParam Map<String, String> q, HttpServletRequest req) {
    auth.require(req, "quote.read");
    String state = q.getOrDefault("state", ""), on = q.getOrDefault("onDate", "");
    LocalDate onDate = pricing.date(on);
    List<ObjectNode> rows =
        b.access.visible("quote", req).stream()
            .map(row -> pricing.at(row, onDate))
            .filter(
                r ->
                    b.contains(r, q.get("search"), "code", "projectName", "supplierName")
                        && b.contains(r, q.get("project"), "projectName", "projectCode")
                        && b.match(r, q, "pricingType", "pricingType")
                        && b.match(r, q, "currency", "currency")
                        && b.match(r, q, "supplierId", "supplierId")
                        && b.contains(r, q.get("supplier"), "supplierName", "supplierId")
                        && (state.isBlank() || state.equals("CURRENT")
                            ? state.isBlank()
                                || Set.of("APPROVED", "PENDING").contains(text(r, "state"))
                            : state.equals("CHANGE_PENDING")
                                ? eq(r.path("pendingChange"), "state", "PENDING")
                                : eq(r, "state", state))
                        && (on.isBlank()
                            || text(r, "effectiveFrom").compareTo(on) <= 0
                                && text(r, "effectiveTo").compareTo(on) >= 0))
            .toList();
    return b.page(rows.stream().map(x -> b.publicRecord("quote", x, req)).toList(), q);
  }

  @GetMapping("/multiplier-bounds")
  public ObjectNode bounds(HttpServletRequest req) {
    auth.require(req, "quote.read");
    return b.obj().put("min", "0").put("max", "1");
  }

  @GetMapping("/ranking")
  public List<ObjectNode> ranking(@RequestParam Map<String, String> q, HttpServletRequest req) {
    auth.require(req, "quote.read");
    LocalDate on = pricing.date(q.get("onDate"));
    String date = on.toString();
    List<ObjectNode> rows =
        b.access.visible("quote", req).stream()
            .filter(
                x ->
                    eq(x, "state", "APPROVED")
                        && b.match(x, q, "projectId", "projectId")
                        && b.match(x, q, "currency", "currency")
                        && text(x, "effectiveFrom").compareTo(date) <= 0
                        && text(x, "effectiveTo").compareTo(date) >= 0)
            .filter(
                x -> {
                  try {
                    ObjectNode supplier = store.get("supplier", b.recordOwner(x, req), null);
                    return supplier.path("enabled").asBoolean(true)
                        && eq(supplier, "state", "APPROVED");
                  } catch (ApiException e) {
                    return false;
                  }
                })
            .map(x -> b.publicRecord("quote", pricing.at(x, on), req))
            .toList();
    return pricing.rank(
        rows, q.getOrDefault("sortBy", "PRICE"), q.getOrDefault("sortDirection", "ASC"));
  }

  @GetMapping("/{id}")
  public ObjectNode detail(@PathVariable String id, HttpServletRequest req) {
    auth.require(req, "quote.read");
    return b.publicRecord("quote", pricing.at(b.get("quote", id, req), pricing.date(null)), req);
  }

  @PostMapping
  @Transactional
  public ObjectNode create(@RequestBody ObjectNode body, HttpServletRequest req) {
    auth.require(req, "quote.write");
    b.mainSupplier(req);
    String owner = b.tenant(req, body);
    b.requireApprovedSupplier(req, owner);
    ObjectNode p = validate(body, null, req);
    p.put("state", "PENDING")
        .put("code", "Q-" + System.currentTimeMillis())
        .put("submittedBy", auth.userId(req))
        .put("supplierId", owner);
    p.put("supplierName", text(auth.user(req), "displayName"));
    try {
      p.put("supplierName", text(store.get("supplier", owner, null), "name"));
    } catch (ApiException missing) {
    }
    p.putArray("priceHistory");
    p.putArray("renewalHistory");
    return store.create("quote", owner, p);
  }

  @PutMapping("/{id}")
  @Transactional
  public ObjectNode edit(
      @PathVariable String id, @RequestBody ObjectNode body, HttpServletRequest req) {
    auth.require(req, "quote.write");
    ObjectNode old = b.get("quote", id, req);
    if (!eq(old, "state", "PENDING")
        || !b.platform(req) && !eq(old, "submittedBy", auth.userId(req)))
      throw new ApiException(409, "仅可修改本人提交的待审核报价");
    return b.publicRecord("quote", b.update("quote", id, req, validate(body, old, req)), req);
  }

  ObjectNode validate(ObjectNode body, ObjectNode old, HttpServletRequest req) {
    required(body, "projectId", "effectiveFrom", "effectiveTo", "currency");
    b.access.requireProject(req, text(body, "projectId"));
    ObjectNode p = b.project(text(body, "projectId"));
    if (!p.path("enabled").asBoolean()) throw new ApiException(400, "项目已停用，不能提交报价");
    LocalDate start, end;
    try {
      start = LocalDate.parse(text(body, "effectiveFrom"));
      end = LocalDate.parse(text(body, "effectiveTo"));
    } catch (Exception e) {
      throw new ApiException(400, "请选择有效的起止日期");
    }
    LocalDate now = LocalDate.parse(today());
    if (end.isBefore(start) || end.isBefore(now)) throw new ApiException(400, "结束日期不能早于开始日期或今天");
    boolean historical = old != null && text(old, "effectiveFrom").compareTo(today()) < 0;
    if (historical && !text(body, "effectiveFrom").equals(text(old, "effectiveFrom")))
      throw new ApiException(400, "历史开始日期不可修改");
    if (!historical && start.isBefore(now)) throw new ApiException(400, "生效日期不能早于北京时间今天");
    if (!text(body, "currency").equals("USD")) throw new ApiException(400, "新报价仅支持 USD");
    boolean fixed = eq(p, "settlementMethod", "ACCOUNT_BUYOUT");
    BigDecimal price = decimal(body, fixed ? "unitPrice" : "multiplier", false);
    if (!fixed && (price.compareTo(BigDecimal.ONE) > 0 || price.scale() > 8))
      throw new ApiException(400, "报价折扣必须在0至100之间，最多6位小数");
    String ct = text(p, "capacityType");
    if (ct.equals("ACCOUNT_COUNT")) positiveInteger(body, "accountCount");
    else if (ct.equals("ACCOUNT_QUOTA")) {
      if (decimal(body, "accountQuota", true).scale() > 8)
        throw new ApiException(400, "账号额度最多8位小数");
    } else if (ct.equals("THROUGHPUT")) {
      positiveInteger(body, "rpm");
      positiveInteger(body, "tpm");
    } else throw new ApiException(400, "该项目尚未配置能力口径");
    if (text(body, "serviceCapacityNote").length() > 500)
      throw new ApiException(400, "能力补充说明最多500字");
    ObjectNode out =
        b.pick(
            body,
            "projectId",
            "unitPrice",
            "multiplier",
            "currency",
            "taxInclusive",
            "serviceCapacityNote",
            "accountCount",
            "accountQuota",
            "rpm",
            "tpm",
            "effectiveFrom",
            "effectiveTo",
            "version");
    out.put("pricingType", fixed ? "FIXED" : "DISCOUNT");
    out.put("projectName", text(p, "name")).put("projectCode", text(p, "code"));
    for (String f :
        List.of(
            "settlementMethod",
            "deliveryMethod",
            "unit",
            "capacityType",
            "capacityScope",
            "capacityPeriod",
            "capacityCurrency")) out.set(f, p.path(f));
    out.put("title", text(p, "name"));
    out.put("taxInclusive", body.path("taxInclusive").asBoolean(true));
    if (!ct.equals("ACCOUNT_COUNT")) out.putNull("accountCount");
    if (!ct.equals("ACCOUNT_QUOTA")) out.putNull("accountQuota");
    if (!ct.equals("THROUGHPUT")) {
      out.putNull("rpm");
      out.putNull("tpm");
    }
    out.putNull(fixed ? "multiplier" : "unitPrice");
    if (old != null && historical) {
      for (String f :
          List.of(
              "projectId", "multiplier", "unitPrice", "accountCount", "accountQuota", "rpm", "tpm"))
        if (!old.path(f).equals(out.path(f))) throw new ApiException(400, "历史价格及能力不可修改，请复制新行");
    }
    return out;
  }

  private void positiveInteger(JsonNode n, String field) {
    String value = text(n, field);
    try {
      if (!value.matches("[1-9][0-9]*") || Long.parseLong(value) <= 0)
        throw new NumberFormatException();
    } catch (NumberFormatException e) {
      throw new ApiException(400, "请填写正整数" + field);
    }
  }

  @PostMapping("/{id}/withdraw")
  public ObjectNode withdraw(@PathVariable String id, HttpServletRequest req) {
    auth.require(req, "quote.write");
    ObjectNode old = b.get("quote", id, req);
    if (!eq(old, "state", "PENDING")
        || !b.platform(req) && !eq(old, "submittedBy", auth.userId(req)))
      throw new ApiException(409, "仅可撤回本人提交的待审报价");
    return store.update(
        "quote",
        id,
        b.entityOwner("quote", id, req),
        b.obj().put("state", "WITHDRAWN").put("version", old.path("version").asLong()));
  }

  @GetMapping("/{id}/period-change")
  public JsonNode change(@PathVariable String id, HttpServletRequest req) {
    return detail(id, req).path("pendingChange").isMissingNode()
        ? NullNode.instance
        : detail(id, req).path("pendingChange");
  }

  @PostMapping("/{id}/period-change")
  @Transactional
  public ObjectNode requestChange(
      @PathVariable String id, @RequestBody ObjectNode body, HttpServletRequest req) {
    auth.require(req, "quote.write");
    ObjectNode old = b.get("quote", id, req);
    if (!eq(old, "state", "APPROVED") || text(old, "effectiveTo").compareTo(today()) < 0)
      throw new ApiException(409, "只有当前已通过报价可申请调整");
    if (eq(old.path("pendingChange"), "state", "PENDING"))
      throw new ApiException(409, "已有待审核的报价调整");
    required(body, "effectiveFrom", "effectiveTo");
    String from = text(body, "effectiveFrom"), to = text(body, "effectiveTo");
    try {
      LocalDate.parse(from);
      LocalDate.parse(to);
    } catch (Exception e) {
      throw new ApiException(400, "请选择有效的起止日期");
    }
    if (to.compareTo(today()) < 0
        || to.compareTo(from) < 0
        || text(old, "effectiveFrom").compareTo(today()) < 0
            && !from.equals(text(old, "effectiveFrom"))
        || text(old, "effectiveFrom").compareTo(today()) >= 0 && from.compareTo(today()) < 0)
      throw new ApiException(400, "报价日期无效，历史开始日期不可修改");
    ObjectNode change =
        b.obj()
            .put("id", UUID.randomUUID().toString())
            .put("state", "PENDING")
            .put("oldFrom", text(old, "effectiveFrom"))
            .put("oldTo", text(old, "effectiveTo"))
            .put("proposedFrom", from)
            .put("proposedTo", to)
            .put("submittedAt", Instant.now().toString())
            .put("submittedBy", auth.userId(req));
    String price = eq(old, "pricingType", "FIXED") ? "unitPrice" : "multiplier";
    if (body.has(price)) {
      BigDecimal proposed = decimal(body, price, false);
      if (price.equals("multiplier")
          && (proposed.compareTo(BigDecimal.ONE) > 0 || proposed.scale() > 8))
        throw new ApiException(400, "报价折扣必须在0至100之间");
      required(body, "priceEffectiveFrom");
      String effective = text(body, "priceEffectiveFrom");
      try {
        LocalDate.parse(effective);
      } catch (Exception e) {
        throw new ApiException(400, "请选择有效的改价生效日");
      }
      if (effective.compareTo(today()) < 0
          || effective.compareTo(from) < 0
          || effective.compareTo(to) > 0) throw new ApiException(400, "改价生效日须在今天或未来且在报价期间内");
      change.set(
          eq(old, "pricingType", "FIXED") ? "oldUnitPrice" : "oldMultiplier", old.path(price));
      change.set(
          eq(old, "pricingType", "FIXED") ? "proposedUnitPrice" : "proposedMultiplier",
          body.get(price));
      change.put("priceEffectiveFrom", effective);
    }
    ObjectNode patch = b.obj();
    patch.set("pendingChange", change);
    patch.put("version", old.path("version").asLong());
    b.update("quote", id, req, patch);
    return change;
  }

  @PostMapping("/{id}/review")
  @Transactional
  public ObjectNode review(
      @PathVariable String id, @RequestBody ObjectNode body, HttpServletRequest req) {
    auth.requirePlatform(req, "quote.review");
    ObjectNode old = b.get("quote", id, req);
    rejectSelfReview(old, req);
    b.requireApprovedSupplier(req, b.entityOwner("quote", id, req));
    if (!eq(old, "state", "PENDING")) throw new ApiException(409, "报价不处于待审核状态");
    boolean approve = body.path("approved").asBoolean();
    if (!approve && text(body, "note").isBlank()) throw new ApiException(400, "退回时必须填写原因");
    if (approve) {
      for (ObjectNode q : store.list("quote", b.recordOwner(old, req)))
        if (!eq(q, "id", id)
            && eq(q, "state", "APPROVED")
            && eq(q, "projectId", text(old, "projectId"))
            && text(q, "effectiveTo").compareTo(text(old, "effectiveFrom")) >= 0
            && text(q, "effectiveFrom").compareTo(text(old, "effectiveTo")) <= 0)
          throw new ApiException(409, "该供应商和项目已有重叠期间的生效报价");
    }
    ObjectNode patch =
        b.obj()
            .put("state", approve ? "APPROVED" : "REJECTED")
            .put("reviewNote", text(body, "note"))
            .put("reviewedBy", auth.userId(req))
            .put("reviewedAt", Instant.now().toString())
            .put("version", old.path("version").asLong());
    if (approve) {
      ArrayNode history =
          old.path("priceHistory").isArray()
              ? (ArrayNode) old.path("priceHistory").deepCopy()
              : store.json.createArrayNode();
      ObjectNode h =
          b.obj()
              .put("id", UUID.randomUUID().toString())
              .put("effectiveAt", text(old, "effectiveFrom") + "T00:00:00+08:00")
              .put("approvedAt", Instant.now().toString());
      h.set("multiplier", old.path("multiplier"));
      h.set("unitPrice", old.path("unitPrice"));
      history.add(h);
      patch.set("priceHistory", history);
    }
    ObjectNode out = b.update("quote", id, req, patch);
    audit("QUOTE_REVIEW", id, req);
    return b.publicRecord("quote", out, req);
  }

  @PostMapping("/{id}/period-change/review")
  @Transactional
  public ObjectNode reviewChange(
      @PathVariable String id, @RequestBody ObjectNode body, HttpServletRequest req) {
    auth.requirePlatform(req, "quote.review");
    ObjectNode old = b.get("quote", id, req);
    rejectSelfReview(old, req);
    JsonNode change = old.path("pendingChange");
    if (eq(change, "submittedBy", auth.userId(req))) throw new ApiException(403, "不能审核本人提交的报价调整");
    if (!eq(change, "state", "PENDING")) throw new ApiException(409, "没有待审的报价调整");
    boolean approved = body.path("approved").asBoolean();
    if (!approved && text(body, "note").isBlank()) throw new ApiException(400, "退回时请填写原因");
    ObjectNode patch = b.obj().put("version", old.path("version").asLong());
    ObjectNode done = (ObjectNode) change.deepCopy();
    done.put("state", approved ? "APPROVED" : "REJECTED")
        .put("reviewNote", text(body, "note"))
        .put("reviewedAt", Instant.now().toString());
    patch.set("pendingChange", done);
    if (approved) {
      ArrayNode renewals =
          old.path("renewalHistory").isArray()
              ? (ArrayNode) old.path("renewalHistory").deepCopy()
              : store.json.createArrayNode();
      renewals.add(
          b.obj()
              .put("id", UUID.randomUUID().toString())
              .put("kind", "MANUAL")
              .put("previousFrom", text(old, "effectiveFrom"))
              .put("previousTo", text(old, "effectiveTo"))
              .put("effectiveFrom", text(change, "proposedFrom"))
              .put("effectiveTo", text(change, "proposedTo"))
              .put("actorName", text(auth.user(req), "displayName"))
              .put("actorId", auth.userId(req))
              .put("occurredAt", Instant.now().toString()));
      patch.set("renewalHistory", renewals);
      patch
          .put("effectiveFrom", text(change, "proposedFrom"))
          .put("effectiveTo", text(change, "proposedTo"));
      if (change.has("priceEffectiveFrom")) {
        ArrayNode history =
            old.path("priceHistory").isArray()
                ? (ArrayNode) old.path("priceHistory").deepCopy()
                : store.json.createArrayNode();
        ObjectNode h =
            b.obj()
                .put("id", UUID.randomUUID().toString())
                .put("effectiveAt", text(change, "priceEffectiveFrom") + "T00:00:00+08:00")
                .put("approvedAt", Instant.now().toString());
        String field = eq(old, "pricingType", "FIXED") ? "unitPrice" : "multiplier";
        h.set(
            field,
            change.path(field.equals("unitPrice") ? "proposedUnitPrice" : "proposedMultiplier"));
        history.add(h);
        patch.set("priceHistory", history);
        if (text(change, "priceEffectiveFrom").compareTo(today()) <= 0)
          patch.set(field, h.path(field));
        else
          patch.set(
              "upcomingPrice",
              b.obj()
                  .put("effectiveFrom", text(change, "priceEffectiveFrom"))
                  .set(field, h.path(field)));
      }
    }
    ObjectNode out = b.update("quote", id, req, patch);
    audit("QUOTE_CHANGE_REVIEW", id, req);
    return b.publicRecord("quote", out, req);
  }

  @PostMapping("/{id}/reject-approved")
  public ObjectNode reject(
      @PathVariable String id, @RequestBody ObjectNode body, HttpServletRequest req) {
    auth.requirePlatform(req, "quote.review");
    required(body, "note");
    ObjectNode old = b.get("quote", id, req);
    rejectSelfReview(old, req);
    if (!eq(old, "state", "APPROVED")) throw new ApiException(409, "报价已不处于已通过状态");
    ObjectNode p =
        b.obj()
            .put("state", "REJECTED")
            .put("reviewNote", text(body, "note"))
            .put("version", old.path("version").asLong());
    p.putNull("pendingChange");
    audit("QUOTE_REJECT_APPROVED", id, req);
    return b.publicRecord("quote", b.update("quote", id, req, p), req);
  }

  private void rejectSelfReview(ObjectNode quote, HttpServletRequest req) {
    String uid = auth.userId(req);
    if (eq(quote, "submittedBy", uid) || eq(quote, "createdBy", uid))
      throw new ApiException(403, "不能审核本人创建或提交的报价");
  }

  private void audit(String action, String id, HttpServletRequest req) {
    store.create(
        "audit",
        null,
        b.obj()
            .put("action", action)
            .put("actorId", auth.userId(req))
            .put("entityId", id)
            .put("occurredAt", Instant.now().toString()));
  }
}
