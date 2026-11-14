package com.hispread.ai;

import static com.hispread.ai.BusinessSupport.*;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.node.*;
import jakarta.servlet.http.*;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.*;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api")
public class WorkbenchController {
  private final Store s;
  private final AuthService a;
  private final AccessPolicy access;
  private final MonitoringService monitoring;

  public WorkbenchController(
      Store s, AuthService a, AccessPolicy access, MonitoringService monitoring) {
    this.s = s;
    this.a = a;
    this.access = access;
    this.monitoring = monitoring;
  }

  private List<ObjectNode> tasks(HttpServletRequest req) {
    List<ObjectNode> out = new ArrayList<>();
    ObjectNode user = a.user(req);
    if (eq(user, "role", "SUPPLIER_AGENT")) return out;
    boolean platform = a.platform(req);
    String owner = a.scope(req);
    for (ObjectNode q : access.visible("quote", req)) {
      String state = text(q, "state");
      if (!has(user, "quote.read")
          || (platform && (!has(user, "quote.review") || !state.equals("PENDING")))
          || (!platform && !state.equals("REJECTED"))) continue;
      ObjectNode t =
          task(
              q,
              platform ? "QUOTE_NEW" : "QUOTE_REJECTED",
              platform ? "新报价待审" : "报价已退回",
              "quotes?id=" + text(q, "id"),
              q.path("projectName").asText(text(q, "title")));
      String summary =
          text(q, "multiplier")
              + " 倍 · "
              + text(q, "effectiveFrom")
              + " 至 "
              + text(q, "effectiveTo");
      t.put("summary", summary).put("detail", summary);
      ArrayNode facts = s.json.createArrayNode();
      for (String[] p :
          List.of(
              new String[] {
                "供应商", q.path("supplierName").asText(user.path("supplierName").asText())
              },
              new String[] {"项目", text(t, "title")},
              new String[] {"报价", text(q, "multiplier") + " 倍"},
              new String[] {"期间", text(q, "effectiveFrom") + " 至 " + text(q, "effectiveTo")})) {
        facts.add(s.object().put("label", p[0]).put("value", p[1]));
      }
      t.set("facts", facts);
      out.add(t);
    }
    // Derive expiry reminders at read time; no new quote, approval, or background scan.
    if (has(user, "quote.read")) {
      java.time.LocalDate today = java.time.LocalDate.now(java.time.ZoneId.of("Asia/Shanghai"));
      for (ObjectNode quote : access.visible("quote", req)) {
        if (!eq(quote, "state", "APPROVED")) continue;
        try {
          java.time.LocalDate end = java.time.LocalDate.parse(text(quote, "effectiveTo"));
          if (end.isBefore(today) || end.isAfter(today.plusDays(7))) continue;
          ObjectNode reminder = task(quote, "QUOTE_EXPIRING", "报价即将到期",
              "quotes?id=" + text(quote, "id"), quote.path("projectName").asText(text(quote, "title")));
          reminder.put("summary", "报价有效期至 " + end + "，需要继续交付时请手动提交新报价")
              .put("detail", "到期提醒不会延长报价或生成续期申请");
          out.add(reminder);
        } catch (java.time.DateTimeException ignored) { /* Invalid historical dates remain in quotation history. */ }
      }
    }
    if (platform) {
      for (ObjectNode supplier : access.visible("supplier", req))
        if (has(user, "supplier.review")
            && (eq(supplier, "state", "PENDING") || eq(supplier, "profileReviewState", "PENDING")))
          out.add(
              task(
                  supplier,
                  "SUPPLIER_REVIEW",
                  "资质待审核",
                  "suppliers?id=" + text(supplier, "id"),
                  text(supplier, "name")));
      for (ObjectNode account : access.visible("account", req))
        if (has(user, "account.review")
            && eq(account, "state", "PENDING")
            && !eq(account, "createdBy", a.userId(req))
            && !eq(account, "updatedBy", a.userId(req)))
          out.add(
              task(
                  account,
                  "ACCOUNT_REVIEW",
                  "收款账户待审核",
                  "suppliers?id=" + text(account, "supplierId"),
                  account.path("holder").asText("收款账户")));
      for (ObjectNode payment : access.visible("payment", req))
        if (has(user, "payment.review")
            && !eq(payment, "createdBy", a.userId(req))
            && (eq(payment, "state", "PENDING") || eq(payment, "state", "PENDING_REVIEW")))
          out.add(
              task(
                  payment,
                  "PAYMENT_REVIEW",
                  "付款待审核",
                  "settlements?tab=payments&id=" + text(payment, "id"),
                  payment.path("code").asText("付款申请")));
    }
    if (!platform && has(user, "settlement.confirm"))
      for (ObjectNode settlement : access.visible("settlement", req))
        if (eq(settlement, "state", "PENDING"))
          out.add(
              task(
                  settlement,
                  "SETTLEMENT_CONFIRM",
                  "待确认应收金额",
                  "settlements?tab=statements&id=" + text(settlement, "id"),
                  settlement.path("code").asText("金额确认")));
    return out;
  }

  private ObjectNode task(
      ObjectNode source, String kind, String label, String target, String title) {
    ObjectNode t =
        s.object()
            .put("id", text(source, "id"))
            .put("title", title)
            .put("label", label)
            .put("kind", kind)
            .put("targetPath", target)
            .put("supplierName", text(source, "supplierName"))
            .put("currency", source.path("currency").asText("USD"))
            .put("createdAt", text(source, "createdAt"))
            .put("summary", "")
            .put("detail", "")
            .put("actionLabel", "查看");
    if (source.hasNonNull("total")) t.set("amount", source.get("total"));
    else if (source.hasNonNull("amount")) t.set("amount", source.get("amount"));
    else t.putNull("amount");
    t.putArray("facts");
    return t;
  }

  private boolean has(JsonNode user, String permission) {
    for (JsonNode p : user.path("permissions")) if (permission.equals(p.asText())) return true;
    return false;
  }

  private ArrayNode money(HttpServletRequest r) {
    Map<String, BigDecimal[]> totals = new TreeMap<>();
    if (access.operator(r)
        || eq(a.user(r), "role", "SUPPLIER_AGENT")
        || !has(a.user(r), "settlement.read") && !has(a.user(r), "payment.read"))
      return s.json.createArrayNode();
    for (ObjectNode item : access.visible("settlement", r))
      if (eq(item, "state", "CONFIRMED")) {
        String currency = item.path("currency").asText("USD");
        BigDecimal[] v =
            totals.computeIfAbsent(
                currency,
                k -> new BigDecimal[] {BigDecimal.ZERO, BigDecimal.ZERO, BigDecimal.ZERO});
        v[0] = v[0].add(amount(item, "total"));
        v[1] = v[1].add(amount(item, "paidAmount"));
        v[2] = v[2].add(amount(item, "receivedAmount"));
      }
    ArrayNode out = s.json.createArrayNode();
    totals.forEach(
        (currency, v) ->
            out.add(
                s.object()
                    .put("currency", currency)
                    .put("total", v[0].toPlainString())
                    .put("paid", v[1].toPlainString())
                    .put("received", v[2].toPlainString())));
    return out;
  }

  @GetMapping("/workbench")
  public Object workbench(HttpServletRequest req) {
    a.require(req, "workbench.read");
    ObjectNode d = s.object();
    List<ObjectNode> tasks = tasks(req);
    d.set("tasks", s.json.valueToTree(tasks));
    d.set("todos", s.json.valueToTree(tasks));
    d.set("money", money(req));
    d.set(
        "recent",
        s.json.valueToTree(
            s.list("notification", a.userId(req)).stream()
                .filter(n -> !n.hasNonNull("readAt"))
                .limit(10)
                .toList()));
    d.putNull("announcement");
    d.put(
        "supplierSide",
        a.user(req).path("supplierId").isTextual() && !text(a.user(req), "supplierId").isBlank());
    return d;
  }

  @GetMapping("/workbench/tasks")
  public Object tasksApi(HttpServletRequest req) {
    a.require(req, "workbench.tasks.read");
    return Map.of("items", tasks(req), "limited", false);
  }

  @GetMapping("/workbench/monitoring")
  public Object monitoring(HttpServletRequest req) {
    a.require(req, "workbench.monitoring.read");
    return List.of();
  }

  @GetMapping("/notifications/unread-count")
  public Object count(HttpServletRequest req) {
    return Map.of(
        "count",
        s.list("notification", a.userId(req)).stream()
            .filter(n -> !n.hasNonNull("readAt"))
            .count());
  }

  @GetMapping("/notifications")
  public Object notifications(
      @RequestParam(defaultValue = "false") boolean unread,
      @RequestParam(defaultValue = "1") int page,
      @RequestParam(defaultValue = "10") int size,
      HttpServletRequest req) {
    return s.page(
        s.list("notification", a.userId(req)).stream()
            .filter(n -> !unread || !n.hasNonNull("readAt"))
            .toList(),
        page,
        size);
  }

  @PostMapping("/notifications/{id}/read")
  public Object read(@PathVariable String id, HttpServletRequest req) {
    ObjectNode p = s.object();
    p.put("readAt", Instant.now().toString());
    return s.update("notification", id, a.userId(req), p);
  }

  @PostMapping("/notifications/read-all")
  public Object readAll(HttpServletRequest req) {
    int count = 0;
    for (ObjectNode n : s.list("notification", a.userId(req)))
      if (!n.hasNonNull("readAt")) {
        read(n.path("id").asText(), req);
        count++;
      }
    return Map.of("count", count);
  }
}
