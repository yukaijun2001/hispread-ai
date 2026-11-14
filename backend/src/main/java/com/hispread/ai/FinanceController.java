package com.hispread.ai;

import static com.hispread.ai.BusinessSupport.*;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.node.*;
import jakarta.servlet.http.HttpServletRequest;
import java.math.BigDecimal;
import java.time.*;
import java.util.*;
import java.util.stream.Collectors;
import org.springframework.http.*;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api")
public class FinanceController {
  private final Store store;
  private final AuthService auth;
  private final BusinessSupport b;
  private final AccessPolicy access;
  private final PaymentExecutionGateway executionGateway;
  private final PaymentExecutionService execution;
  private final PaymentSandboxService sandbox;

  public FinanceController(
      Store store,
      AuthService auth,
      BusinessSupport b,
      AccessPolicy access,
      PaymentExecutionGateway executionGateway,
      PaymentExecutionService execution,
      PaymentSandboxService sandbox) {
    this.store = store;
    this.auth = auth;
    this.b = b;
    this.access = access;
    this.executionGateway = executionGateway;
    this.execution = execution;
    this.sandbox = sandbox;
  }

  private void financial(HttpServletRequest req) {
    if (access.operator(req)) throw new ApiException(403, "运营角色无权访问财务信息");
    if (auth.platform(req) && !access.admin(req) && !access.finance(req))
      throw new ApiException(403, "仅财务或最高管理员可访问平台财务信息");
  }

  private void supplierPrincipal(HttpServletRequest req) {
    if (!auth.user(req).path("role").asText().equals("SUPPLIER")
        || auth.user(req).path("supplierId").asText().isBlank())
      throw new ApiException(403, "仅所属供应商主账号可确认");
  }

  private List<ObjectNode> settlements(HttpServletRequest req) {
    financial(req);
    b.mainSupplier(req);
    return access.visible("settlement", req).stream()
        .map(row -> publicSettlement(row, req))
        .toList();
  }

  private ObjectNode publicSettlement(ObjectNode row, HttpServletRequest req) {
    ObjectNode out = row.deepCopy();
    if (!auth.platform(req)) {
      ArrayNode visible = store.json.createArrayNode();
      for (JsonNode adjustment : out.path("adjustments"))
        if (adjustment.path("supplierVisible").asBoolean(false)) visible.add(adjustment);
      if (out.has("adjustments")) out.set("adjustments", visible);
      out.remove(
          List.of("requestKey", "snapshotHash", "expectedSnapshotHash", "requestFingerprint"));
    }
    return out;
  }

  private List<ObjectNode> filteredSettlements(Map<String, String> q, HttpServletRequest req) {
    financial(req);
    return settlements(req).stream()
        .filter(
            r ->
                b.contains(r, q.get("search"), "code", "supplierName")
                    && b.match(r, q, "supplierId", "supplierId")
                    && b.match(r, q, "projectId", "projectId")
                    && b.match(r, q, "currency", "currency")
                    && b.match(r, q, "state", "state")
                    && b.match(r, q, "paymentProgress", "paymentProgress")
                    && b.dates(r, q, "periodStart", "periodEnd", "periodStart", "periodEnd"))
        .toList();
  }

  @GetMapping("/settlements")
  public ObjectNode list(@RequestParam Map<String, String> q, HttpServletRequest req) {
    auth.require(req, "settlement.read");
    return b.page(filteredSettlements(q, req), q);
  }

  @GetMapping("/settlements/summary")
  public ObjectNode summary(
      @RequestParam(defaultValue = "USD") String currency, HttpServletRequest req) {
    auth.require(req, "settlement.read");
    List<ObjectNode> rows =
        settlements(req).stream()
            .filter(x -> eq(x, "currency", currency) && eq(x, "state", "CONFIRMED"))
            .toList();
    BigDecimal total = sum(rows, "total"),
        paid = sum(rows, "paidAmount"),
        received = sum(rows, "receivedAmount");
    return b.obj()
        .put("currency", currency)
        .put("unsettledPayable", "0")
        .put("total", total.toPlainString())
        .put("paid", paid.toPlainString())
        .put("received", received.toPlainString());
  }

  @GetMapping("/settlements/pending-summary")
  public ObjectNode pending(@RequestParam Map<String, String> q, HttpServletRequest req) {
    auth.require(req, "settlement.read");
    List<ObjectNode> rows =
        filteredSettlements(q, req).stream().filter(x -> eq(x, "state", "PENDING")).toList();
    return b.obj()
        .put("pendingCount", rows.size())
        .put("pendingTotal", sum(rows, "total").toPlainString());
  }

  @GetMapping("/settlements/{id}")
  public ObjectNode detail(@PathVariable String id, HttpServletRequest req) {
    auth.require(req, "settlement.read");
    financial(req);
    b.mainSupplier(req);
    return publicSettlement(access.get("settlement", id, req), req);
  }

  @PostMapping("/settlements/{id}/confirm")
  @Transactional
  public ObjectNode confirm(
      @PathVariable String id, @RequestBody ObjectNode body, HttpServletRequest req) {
    supplierPrincipal(req);
    auth.require(req, "settlement.confirm");
    ObjectNode old = detail(id, req);
    if (!eq(old, "state", "PENDING")) throw new ApiException(409, "结算单已不处于待确认状态");
    if (old.path("sourceChanged").asBoolean()) throw new ApiException(409, "来源金额或归属已变化，当前结算单暂停确认");
    if (!body.has("version")) throw new ApiException(400, "请提供结算单版本");
    boolean approved = body.path("approved").asBoolean();
    if (!approved && text(body, "note").isBlank()) throw new ApiException(400, "提出异议时请填写说明");
    ObjectNode p = b.pick(body, "version");
    p.put("state", approved ? "CONFIRMED" : "REJECTED")
        .put("supplierConfirmed", approved)
        .put("confirmationMode", "MANUAL")
        .put("confirmedAt", Instant.now().toString())
        .put("confirmationNote", text(body, "note"));
    if (approved) {
      String ownerUser = "", ownerName = "未归属";
      try {
        ObjectNode supplier = store.get("supplier", text(old, "supplierId"), null);
        ownerUser = text(supplier, "ownerUserId");
        ownerName = supplier.path("ownerName").asText(ownerName);
      } catch (ApiException ignored) {
      }
      p.put("ownerUserId", ownerUser).put("ownerName", ownerName);
    }
    return publicSettlement(store.update("settlement", id, b.scope(req), p), req);
  }

  @GetMapping("/settlements/{id}/export")
  public ResponseEntity<byte[]> exportOne(@PathVariable String id, HttpServletRequest req) {
    auth.require(req, "settlement.export");
    return csv(
        List.of(detail(id, req)),
        List.of(
            "code",
            "projectName",
            "periodStart",
            "periodEnd",
            "currency",
            "originalTotal",
            "total",
            "state"),
        "settlement-" + id + ".csv");
  }

  @PostMapping("/settlements/export")
  public ResponseEntity<byte[]> exportAll(
      @RequestParam Map<String, String> q, @RequestBody ObjectNode body, HttpServletRequest req) {
    auth.require(req, "settlement.export");
    Set<String> ids = new HashSet<>();
    for (JsonNode id : body.path("ids")) ids.add(id.asText());
    return csv(
        filteredSettlements(q, req).stream()
            .filter(x -> ids.isEmpty() || ids.contains(text(x, "id")))
            .toList(),
        List.of(
            "code",
            "projectName",
            "periodStart",
            "periodEnd",
            "currency",
            "originalTotal",
            "total",
            "state"),
        "settlements.csv");
  }

  @GetMapping("/payments")
  public ObjectNode payments(@RequestParam Map<String, String> q, HttpServletRequest req) {
    auth.require(req, "payment.read");
    financial(req);
    b.mainSupplier(req);
    return b.page(
        access.visible("payment", req).stream()
            .filter(x -> b.match(x, q, "settlementId", "settlementId"))
            .toList(),
        q);
  }

  @GetMapping("/payments/{id}")
  public ObjectNode payment(@PathVariable String id, HttpServletRequest req) {
    auth.require(req, "payment.read");
    financial(req);
    b.mainSupplier(req);
    return access.get("payment", id, req);
  }

  @PostMapping("/payments/{id}/receipt")
  @Transactional
  public ObjectNode receipt(
      @PathVariable String id, @RequestBody ObjectNode body, HttpServletRequest req) {
    supplierPrincipal(req);
    auth.require(req, "payment.receipt");
    store.jdbc.queryForObject(
        "select pg_advisory_xact_lock(hashtextextended(?,0))", Object.class, "payment-state:" + id);
    ObjectNode old = payment(id, req);
    if (!eq(old, "state", "SUCCEEDED")) throw new ApiException(409, "仅可核对平台已付款记录");
    if (eq(old, "receiptState", "CONFIRMED")) throw new ApiException(409, "该款项已确认到账");
    boolean confirmed = body.path("confirmed").asBoolean();
    if (!confirmed && text(body, "note").isBlank()) throw new ApiException(400, "请填写未到账或异议说明");
    ObjectNode p =
        b.obj()
            .put("receiptState", confirmed ? "CONFIRMED" : "DISPUTED")
            .put("receiptNote", text(body, "note"))
            .put("receiptConfirmedAt", Instant.now().toString())
            .put("receivedAt", Instant.now().toString())
            .put("version", old.path("version").asLong());
    ObjectNode result = store.update("payment", id, b.scope(req), p);
    String sid = text(old, "settlementId");
    if (!sid.isBlank()) {
      store.jdbc.queryForObject(
          "select pg_advisory_xact_lock(hashtextextended(?,0))", Object.class, "payment:" + sid);
      ObjectNode s = access.get("settlement", sid, req);
      BigDecimal received =
          access.visible("payment", req).stream()
              .filter(
                  x ->
                      eq(x, "settlementId", sid)
                          && eq(x, "receiptState", "CONFIRMED")
                          && eq(x, "state", "SUCCEEDED"))
              .map(x -> amount(x, "obligationAmount"))
              .reduce(BigDecimal.ZERO, BigDecimal::add);
      BigDecimal total = amount(s, "total");
      store.update(
          "settlement",
          sid,
          b.scope(req),
          b.obj()
              .put("receivedAmount", received.toPlainString())
              .put(
                  "paymentProgress",
                  received.signum() == 0
                      ? "UNPAID"
                      : received.compareTo(total) >= 0 ? "PAID" : "PARTIAL")
              .put("version", s.path("version").asLong()));
    }
    return result;
  }

  @GetMapping("/payments/providers")
  public List<ObjectNode> providers(HttpServletRequest req) {
    return providerCapabilities(req).stream()
        .filter(p -> p.path("executable").asBoolean(false))
        .toList();
  }

  @GetMapping("/payments/provider-capabilities")
  public List<ObjectNode> providerCapabilities(HttpServletRequest req) {
    if (!access.admin(req)) throw new ApiException(403, "支付通道能力仅最高管理员可访问");
    auth.require(req, "payment.execute");
    List<ObjectNode> result = new ArrayList<>();
    Map<String, String> names =
        Map.of(
            "AIRWALLEX", "Airwallex 空中云汇", "OKX_USDT", "OKX USDT", "BINANCE_USDT", "Binance USDT");
    for (String code : List.of("AIRWALLEX", "OKX_USDT", "BINANCE_USDT")) {
      ObjectNode raw =
          store.list("payout-provider", null).stream()
              .filter(p -> eq(p, "code", code) || eq(p, "id", code))
              .findFirst()
              .orElse(b.obj());
      boolean configured =
          !text(raw, "apiKey").isBlank()
              && (code.equals("AIRWALLEX")
                  ? !text(raw, "clientId").isBlank()
                  : !text(raw, "secretKey").isBlank()
                      && (!code.equals("OKX_USDT") || !text(raw, "passphrase").isBlank()));
      boolean enabled = raw.path("enabled").asBoolean(false);
      result.add(
          b.obj()
              .put("code", code)
              .put("name", names.get(code))
              .put("enabled", enabled)
              .put("configured", configured)
              .put("readOnlyTestAvailable", enabled && configured)
              .put("executable", executionGateway.executable(raw))
              .put(
                  "unavailableReason",
                  executionGateway.executable(raw)
                      ? ""
                      : !enabled ? "通道未启用" : "未配置可执行的官方支付适配器或支付中台；连接测试独立且只读"));
    }
    return result;
  }

  @PostMapping("/payments/{id}/payout-preview")
  public ObjectNode payoutPreview(
      @PathVariable String id, @RequestBody ObjectNode body, HttpServletRequest req) {
    return execution.preview(id, body, req);
  }

  @PostMapping("/payments/{id}/execute")
  public ObjectNode execute(
      @PathVariable String id, @RequestBody ObjectNode body, HttpServletRequest req) {
    return execution.execute(id, body, req);
  }

  @PostMapping("/payments/{id}/reconcile")
  public ObjectNode reconcile(
      @PathVariable String id, @RequestBody ObjectNode body, HttpServletRequest req) {
    return execution.reconcile(id, body, req);
  }

  @PostMapping("/payments/sandbox/events")
  public ObjectNode externalSandbox(@RequestBody ObjectNode body, HttpServletRequest req) {
    return sandbox.event(body, req);
  }

  @GetMapping("/payments/sandbox-capabilities")
  public ObjectNode sandboxCapabilities(HttpServletRequest req) {
    return sandbox.capabilities(req);
  }

  @PostMapping("/payments/sandbox")
  public ObjectNode createSandbox(@RequestBody ObjectNode body, HttpServletRequest req) {
    return sandbox.create(body, req);
  }

  @GetMapping("/payments/sandbox/{id}")
  public ObjectNode sandboxPayment(@PathVariable String id, HttpServletRequest req) {
    return sandbox.get(id, req);
  }

  @GetMapping("/exchange-rates/current")
  public List<ObjectNode> currentRates(HttpServletRequest req) {
    auth.require(req, "exchange_rate.read");
    Map<String, ObjectNode> pairs = new LinkedHashMap<>();
    for (ObjectNode r : store.list("exchange-rate", null)) {
      if (!r.path("enabled").asBoolean(true)) continue;
      try {
        if (Instant.parse(text(r, "effectiveFrom")).isAfter(Instant.now())) continue;
      } catch (Exception e) {
        continue;
      }
      String pair = text(r, "baseCurrency") + ":" + text(r, "quoteCurrency");
      ObjectNode prior = pairs.get(pair);
      if (prior == null
          || r.path("rateVersion").asLong(r.path("version").asLong())
              > prior.path("rateVersion").asLong(prior.path("version").asLong()))
        pairs.put(pair, r);
    }
    return pairs.values().stream().map(this::rateView).toList();
  }

  @GetMapping("/exchange-rates")
  public ObjectNode rates(@RequestParam Map<String, String> q, HttpServletRequest req) {
    auth.require(req, "exchange_rate.read");
    return b.page(
        store.list("exchange-rate", null).stream()
            .filter(x -> b.contains(x, q.get("search"), "baseCurrency", "quoteCurrency", "source"))
            .map(this::rateView)
            .toList(),
        q);
  }

  @PostMapping("/exchange-rates")
  @Transactional
  public ObjectNode newRate(@RequestBody ObjectNode body, HttpServletRequest req) {
    if (!access.admin(req)) throw new ApiException(403, "仅最高管理员可维护汇率");
    auth.requirePlatform(req, "exchange_rate.write");
    required(body, "baseCurrency", "quoteCurrency", "rate", "effectiveFrom");
    if (text(body, "baseCurrency").equals(text(body, "quoteCurrency")))
      throw new ApiException(400, "基准币种与报价币种不能相同");
    decimal(body, "rate", true);
    try {
      Instant.parse(text(body, "effectiveFrom"));
    } catch (Exception e) {
      throw new ApiException(400, "请选择有效的生效时间");
    }
    ObjectNode p = b.pick(body, "baseCurrency", "quoteCurrency", "rate", "effectiveFrom");
    p.put("source", "本地人工维护").put("enabled", true);
    store.jdbc.queryForObject(
        "select pg_advisory_xact_lock(hashtextextended(?,0))",
        Object.class,
        "rate:" + text(body, "baseCurrency") + ":" + text(body, "quoteCurrency"));
    long next =
        store.list("exchange-rate", null).stream()
                .filter(
                    x ->
                        eq(x, "baseCurrency", text(body, "baseCurrency"))
                            && eq(x, "quoteCurrency", text(body, "quoteCurrency")))
                .mapToLong(x -> x.path("rateVersion").asLong(x.path("version").asLong()))
                .max()
                .orElse(0)
            + 1;
    p.put("rateVersion", next);
    ObjectNode saved = store.create("exchange-rate", "GLOBAL", p);
    return rateView(saved);
  }

  private ObjectNode rateView(ObjectNode row) {
    ObjectNode out = row.deepCopy();
    long optimistic = row.path("version").asLong();
    out.put("entityVersion", optimistic);
    out.put("version", row.path("rateVersion").asLong(optimistic));
    return out;
  }

  @PostMapping("/exchange-rates/{id}/enabled")
  public ObjectNode enableRate(
      @PathVariable String id, @RequestBody ObjectNode body, HttpServletRequest req) {
    if (!access.admin(req)) throw new ApiException(403, "仅最高管理员可维护汇率");
    auth.requirePlatform(req, "exchange_rate.write");
    required(body, "note");
    ObjectNode current = store.get("exchange-rate", id, "GLOBAL");
    if (body.path("version").asLong()
        != current.path("rateVersion").asLong(current.path("version").asLong()))
      throw new ApiException(409, "汇率版本已变化，请刷新");
    ObjectNode patch = b.pick(body, "enabled", "note");
    patch.put("version", current.path("version").asLong());
    return rateView(store.update("exchange-rate", id, "GLOBAL", patch));
  }

  private List<ObjectNode> bills(Map<String, String> q, HttpServletRequest req) {
    String uid = auth.userId(req), gid = text(auth.user(req).path("teamAdminGroup"), "id");
    Set<String> members = new HashSet<>();
    if (!gid.isBlank()) {
      ObjectNode g = store.get("group", gid, b.scope(req));
      for (JsonNode id : g.path("memberIds")) members.add(id.asText());
    }
    return access.visible("bill", req).stream()
        .filter(
            x ->
                !b.member(req) || eq(x, "creatorId", uid) || members.contains(text(x, "creatorId")))
        .filter(
            x ->
                b.dates(x, q, "from", "to", "businessDate", "businessDate")
                    && b.match(x, q, "resourceType", "resourceType")
                    && b.match(x, q, "project", "projectId")
                    && b.match(x, q, "creator", "creatorId")
                    && b.match(x, q, "department", "departmentId")
                    && b.match(x, q, "state", "state")
                    && b.contains(x, q.get("search"), "resourceName", "projectName", "creatorName")
                    && b.contains(x, q.get("model"), "model"))
        .toList();
  }

  @GetMapping("/supplier-bills/filters")
  public ObjectNode billFilters(@RequestParam Map<String, String> q, HttpServletRequest req) {
    financial(req);
    if (!b.member(req)) auth.require(req, "settlement.read");
    List<ObjectNode> rows = bills(q, req);
    ObjectNode out =
        b.obj().put("groupAdmin", !text(auth.user(req).path("teamAdminGroup"), "id").isBlank());
    List<ObjectNode> visibleDepartments = access.visible("group", req);
    if (b.member(req)) {
      auth.require(req, "resource.read");
      String ownGroup = text(auth.user(req).path("teamAdminGroup"), "id");
      visibleDepartments =
          visibleDepartments.stream()
              .filter(g -> !ownGroup.isBlank() && eq(g, "id", ownGroup))
              .toList();
    }
    out.set("departments", labels(visibleDepartments, "id", "name"));
    out.set("projects", labels(rows, "projectId", "projectName"));
    out.set("creators", labels(rows, "creatorId", "creatorName"));
    out.set("resourceTypes", labels(rows, "resourceType", "resourceType"));
    return out;
  }

  private ArrayNode labels(List<ObjectNode> rows, String id, String label) {
    Map<String, ObjectNode> out = new LinkedHashMap<>();
    for (ObjectNode r : rows)
      if (!text(r, id).isBlank())
        out.put(text(r, id), b.obj().put("value", text(r, id)).put("label", text(r, label)));
    return b.arr(out.values());
  }

  @GetMapping("/supplier-bills/entries")
  public ObjectNode entries(@RequestParam Map<String, String> q, HttpServletRequest req) {
    financial(req);
    if (!b.member(req)) auth.require(req, "settlement.read");
    else auth.require(req, "resource.read");
    ObjectNode out =
        b.page(
            bills(q, req).stream().filter(x -> b.match(x, q, "currency", "currency")).toList(), q);
    out.set("totals", billTotals(bills(q, req)));
    return billPublic(out, req);
  }

  @GetMapping({"/supplier-bills/days", "/supplier-bills/creators", "/supplier-bills/departments"})
  public ObjectNode billGroups(@RequestParam Map<String, String> q, HttpServletRequest req) {
    financial(req);
    if (!b.member(req)) auth.require(req, "settlement.read");
    else auth.require(req, "resource.read");
    if (req.getRequestURI().endsWith("/departments")
        && b.member(req)
        && text(auth.user(req).path("teamAdminGroup"), "id").isBlank()) {
      throw new ApiException(403, "仅部门管理员可查看部门账单");
    }
    List<ObjectNode> rows = bills(q, req);
    String group =
        req.getRequestURI().endsWith("/creators")
            ? "creatorId"
            : req.getRequestURI().endsWith("/departments") ? "departmentId" : "businessDate";
    boolean byDate = Boolean.parseBoolean(q.getOrDefault("groupByDate", "false"));
    Map<String, List<ObjectNode>> groups =
        rows.stream()
            .collect(
                Collectors.groupingBy(
                    x ->
                        text(x, group)
                            + ":"
                            + text(x, "currency")
                            + (byDate ? ":" + text(x, "businessDate") : "")));
    List<ObjectNode> summaries = new ArrayList<>();
    groups.forEach(
        (key, items) -> {
          ObjectNode first = items.get(0), out = b.obj();
          for (String f :
              List.of(
                  "businessDate",
                  "creatorId",
                  "creatorName",
                  "departmentId",
                  "departmentName",
                  "resourceType",
                  "currency")) out.set(f, first.path(f));
          out.put("id", key)
              .put("date", text(first, "businessDate"))
              .put(
                  "resourceCount",
                  items.stream().map(x -> text(x, "resourceId")).distinct().count())
              .put("entryCount", items.size())
              .put("billCount", items.size());
          out.put("consumptionTotal", sum(items, "consumption").toPlainString())
              .put("payableTotal", sum(items, "payable").toPlainString())
              .put(
                  "pendingConsumption",
                  items.stream()
                      .filter(x -> eq(x, "state", "PENDING"))
                      .map(x -> amount(x, "consumption"))
                      .reduce(BigDecimal.ZERO, BigDecimal::add)
                      .toPlainString());
          summaries.add(out);
        });
    ObjectNode out = b.page(summaries, q);
    out.set("totals", billTotals(rows));
    out.put("summaryUpdating", false);
    return billPublic(out, req);
  }

  private ArrayNode billTotals(List<ObjectNode> rows) {
    Map<String, List<ObjectNode>> currencies =
        rows.stream().collect(Collectors.groupingBy(x -> text(x, "currency")));
    List<ObjectNode> out = new ArrayList<>();
    currencies.forEach(
        (currency, items) ->
            out.add(
                b.obj()
                    .put("currency", currency)
                    .put("consumptionTotal", sum(items, "consumption").toPlainString())
                    .put("payableTotal", sum(items, "payable").toPlainString())
                    .put(
                        "pendingConsumption",
                        items.stream()
                            .filter(x -> eq(x, "state", "PENDING"))
                            .map(x -> amount(x, "consumption"))
                            .reduce(BigDecimal.ZERO, BigDecimal::add)
                            .toPlainString())));
    return b.arr(out);
  }

  @GetMapping({"/reports/supplier-receivables", "/reports/monthly-payables"})
  public ObjectNode report(@RequestParam Map<String, String> q, HttpServletRequest req) {
    auth.require(req, "report.read");
    List<ObjectNode> rows = reportRows(q, req);
    ObjectNode out = b.obj();
    out.set(
        "items",
        b.arr(
            req.getRequestURI().endsWith("monthly-payables")
                ? monthly(rows)
                : receivables(rows, req)));
    return out;
  }

  private List<ObjectNode> reportRows(Map<String, String> q, HttpServletRequest req) {
    financial(req);
    return settlements(req).stream()
        .filter(
            x ->
                b.match(x, q, "supplierId", "supplierId")
                    && !Set.of("VOID", "WITHDRAWN").contains(text(x, "state"))
                    && b.match(x, q, "currency", "currency")
                    && b.match(x, q, "projectId", "projectId")
                    && b.dates(x, q, "from", "to", "periodEnd", "periodEnd"))
        .toList();
  }

  @GetMapping("/reports/overview")
  public ObjectNode overview(@RequestParam Map<String, String> q, HttpServletRequest req) {
    auth.require(req, "report.read");
    List<ObjectNode> rows = reportRows(q, req);
    ObjectNode out = b.obj();
    out.set("monthly", b.arr(monthly(rows)));
    out.set("suppliers", b.arr(receivables(rows, req)));
    List<ObjectNode> sums = new ArrayList<>();
    Map<String, List<ObjectNode>> currencyGroups =
        rows.stream()
            .filter(x -> eq(x, "state", "CONFIRMED"))
            .collect(Collectors.groupingBy(x -> text(x, "currency")));
    currencyGroups.forEach(
        (currency, items) -> {
          BigDecimal total = sum(items, "total"), paid = sum(items, "paidAmount");
          sums.add(
              b.obj()
                  .put("currency", currency)
                  .put(
                      "supplierCount",
                      items.stream().map(x -> text(x, "supplierId")).distinct().count())
                  .put("confirmedPayable", total.toPlainString())
                  .put("paidAmount", paid.toPlainString())
                  .put(
                      "outstandingAmount",
                      total.subtract(paid).max(BigDecimal.ZERO).toPlainString())
                  .put("receivedAmount", sum(items, "receivedAmount").toPlainString())
                  .put("settlementCount", items.size())
                  .put("disputedCount", 0));
        });
    out.set("summary", b.arr(sums));
    return out;
  }

  @GetMapping("/reports/settlements")
  public ObjectNode reportDetail(@RequestParam Map<String, String> q, HttpServletRequest req) {
    auth.require(req, "report.read");
    List<ObjectNode> rows =
        reportRows(q, req).stream()
            .filter(
                x ->
                    !q.getOrDefault("scope", "").equals("CONFIRMED") || eq(x, "state", "CONFIRMED"))
            .limit(200)
            .toList();
    ObjectNode out = b.obj();
    List<ObjectNode> details =
        rows.stream()
            .map(
                row -> {
                  ObjectNode item = b.obj();
                  for (String field :
                      List.of(
                          "id",
                          "code",
                          "supplierId",
                          "supplierName",
                          "projectId",
                          "projectName",
                          "periodStart",
                          "periodEnd",
                          "currency",
                          "total",
                          "paidAmount",
                          "state")) item.set(field, row.path(field));
                  item.put(
                      "outstandingAmount",
                      amount(row, "total")
                          .subtract(amount(row, "paidAmount"))
                          .max(BigDecimal.ZERO)
                          .toPlainString());
                  return item;
                })
            .toList();
    out.set("items", b.arr(details));
    return out;
  }

  private List<ObjectNode> receivables(List<ObjectNode> rows, HttpServletRequest req) {
    Map<String, List<ObjectNode>> groups =
        rows.stream()
            .filter(x -> eq(x, "state", "CONFIRMED"))
            .collect(Collectors.groupingBy(x -> text(x, "supplierId") + ":" + text(x, "currency")));
    List<ObjectNode> out = new ArrayList<>();
    groups.forEach(
        (groupKey, items) -> {
          String currency = text(items.get(0), "currency");
          BigDecimal total = sum(items, "total"),
              paid = sum(items, "paidAmount"),
              received = sum(items, "receivedAmount");
          ObjectNode first = items.get(0);
          ObjectNode x =
              b.obj()
                  .put("supplierId", text(first, "supplierId"))
                  .put("supplierName", text(first, "supplierName"))
                  .put("supplierCode", text(first, "supplierCode"))
                  .put("currency", currency)
                  .put("receivableAmount", total.toPlainString())
                  .put("paidAmount", paid.toPlainString())
                  .put(
                      "outstandingAmount",
                      total.subtract(paid).max(BigDecimal.ZERO).toPlainString())
                  .put("receivedAmount", received.toPlainString())
                  .put(
                      "unconfirmedReceiptAmount",
                      paid.subtract(received).max(BigDecimal.ZERO).toPlainString())
                  .put(
                      "unpaidCount",
                      items.stream()
                          .filter(s -> amount(s, "total").compareTo(amount(s, "paidAmount")) > 0)
                          .count())
                  .put("settlementCount", items.size())
                  .put("disputedCount", 0);
          items.stream()
              .filter(s -> amount(s, "total").compareTo(amount(s, "paidAmount")) > 0)
              .map(s -> text(s, "periodEnd"))
              .min(String::compareTo)
              .ifPresent(v -> x.put("earliestUnpaidDate", v));
          out.add(x);
        });
    return out;
  }

  private List<ObjectNode> monthly(List<ObjectNode> rows) {
    Map<String, List<ObjectNode>> groups =
        rows.stream()
            .collect(
                Collectors.groupingBy(
                    x ->
                        text(x, "periodEnd")
                                .substring(0, Math.min(7, text(x, "periodEnd").length()))
                            + ":"
                            + text(x, "currency")));
    List<ObjectNode> out = new ArrayList<>();
    groups.forEach(
        (key, items) -> {
          ObjectNode first = items.get(0);
          List<ObjectNode> confirmed =
              items.stream().filter(x -> eq(x, "state", "CONFIRMED")).toList();
          BigDecimal payable = sum(confirmed, "total"), paid = sum(confirmed, "paidAmount");
          out.add(
              b.obj()
                  .put("month", key.split(":")[0])
                  .put("currency", text(first, "currency"))
                  .put("originalAmount", sum(items, "originalTotal").toPlainString())
                  .put("finalPayable", sum(items, "total").toPlainString())
                  .put("confirmedPayable", payable.toPlainString())
                  .put("paidAmount", paid.toPlainString())
                  .put(
                      "outstandingAmount",
                      payable.subtract(paid).max(BigDecimal.ZERO).toPlainString())
                  .put("settlementCount", items.size())
                  .put(
                      "supplierCount",
                      items.stream().map(x -> text(x, "supplierId")).distinct().count()));
        });
    return out;
  }

  @GetMapping("/reports/export")
  public ResponseEntity<byte[]> reportExport(
      @RequestParam Map<String, String> q, HttpServletRequest req) {
    financial(req);
    auth.require(req, "report.export");
    List<ObjectNode> rows = reportRows(q, req);
    boolean monthly = q.getOrDefault("report", "").equals("MONTHLY_PAYABLES");
    return csv(
        monthly ? monthly(rows) : receivables(rows, req),
        monthly
            ? List.of(
                "month",
                "currency",
                "originalAmount",
                "finalPayable",
                "confirmedPayable",
                "paidAmount",
                "outstandingAmount")
            : List.of(
                "supplierName",
                "currency",
                "receivableAmount",
                "paidAmount",
                "receivedAmount",
                "outstandingAmount"),
        "report.csv");
  }

  private ObjectNode billPublic(ObjectNode value, HttpServletRequest req) {
    if (!b.member(req)) return value;
    return (ObjectNode) stripFinance(value);
  }

  private JsonNode stripFinance(JsonNode n) {
    if (n.isObject()) {
      ObjectNode o = (ObjectNode) n.deepCopy();
      for (String k :
          List.of(
              "payable",
              "payableTotal",
              "paidAmount",
              "receivedAmount",
              "receivableAmount",
              "multiplier",
              "unitPrice",
              "quoteSnapshot")) o.remove(k);
      List<String> keys = new ArrayList<>();
      o.fieldNames().forEachRemaining(keys::add);
      for (String k : keys) o.set(k, stripFinance(o.get(k)));
      return o;
    }
    if (n.isArray()) {
      ArrayNode a = store.json.createArrayNode();
      n.forEach(x -> a.add(stripFinance(x)));
      return a;
    }
    return n;
  }

  @GetMapping("/reports/operations")
  public ObjectNode operations(HttpServletRequest req) {
    auth.require(req, "report.read");
    if (!auth.platform(req)) throw new ApiException(403, "仅平台运营报表");
    List<ObjectNode> suppliers = access.visible("supplier", req),
        quotes = access.visible("quote", req),
        resources = access.visible("resource", req);
    ObjectNode out =
        b.obj()
            .put("supplierCount", suppliers.size())
            .put("quoteCount", quotes.size())
            .put(
                "pendingQuoteCount", quotes.stream().filter(q -> eq(q, "state", "PENDING")).count())
            .put(
                "approvedQuoteCount",
                quotes.stream().filter(q -> eq(q, "state", "APPROVED")).count())
            .put("resourceCount", resources.size());
    ArrayNode projectRows = out.putArray("projects"), supplierRows = out.putArray("suppliers");
    Set<String> ids = new LinkedHashSet<>();
    quotes.forEach(q -> ids.add(text(q, "projectId")));
    resources.forEach(r -> ids.add(text(r, "projectId")));
    for (String id : ids) {
      if (id.isBlank()) continue;
      String name =
          quotes.stream()
              .filter(q -> eq(q, "projectId", id))
              .findFirst()
              .map(q -> text(q, "projectName"))
              .orElse(id);
      projectRows.add(
          b.obj()
              .put("projectId", id)
              .put("projectName", name)
              .put("quoteCount", quotes.stream().filter(q -> eq(q, "projectId", id)).count())
              .put(
                  "resourceCount", resources.stream().filter(r -> eq(r, "projectId", id)).count()));
    }
    for (ObjectNode supplier : suppliers) {
      String id = text(supplier, "id");
      supplierRows.add(
          b.obj()
              .put("supplierId", id)
              .put("supplierName", text(supplier, "name"))
              .put("quoteCount", quotes.stream().filter(q -> eq(q, "supplierId", id)).count())
              .put(
                  "resourceCount",
                  resources.stream().filter(r -> eq(r, "supplierId", id)).count()));
    }
    return out;
  }

  @GetMapping({
    "/reports/ccmax-resources",
    "/reports/ccmax-resources/current",
    "/reports/ccmax-resources/suppliers"
  })
  public ObjectNode resourceReports(@RequestParam Map<String, String> q, HttpServletRequest req) {
    auth.require(req, "report.read");
    auth.require(req, "usage.read");
    auth.require(req, "resource.read");
    List<ObjectNode> rows =
        access.visible("resource", req).stream()
            .filter(r -> b.match(r, q, "supplierId", "supplierId"))
            .toList();
    ObjectNode out =
        b.obj()
            .put("from", q.getOrDefault("from", today()))
            .put("to", q.getOrDefault("to", today()))
            .put("total", rows.size());
    Map<String, Long> counts = new LinkedHashMap<>();
    for (ObjectNode r : rows) {
      String type = text(r, "resourceType"), state = text(r, "operationalState");
      counts.merge(type + ":" + state, 1L, Long::sum);
    }
    ArrayNode report = out.putArray("rows");
    counts.forEach(
        (key, count) -> {
          String[] values = key.split(":", 2);
          report.add(
              b.obj()
                  .put("resourceType", values[0])
                  .put("operationalState", values.length > 1 ? values[1] : "")
                  .put("count", count));
        });
    return out;
  }

  private static BigDecimal sum(List<ObjectNode> rows, String field) {
    return rows.stream().map(x -> amount(x, field)).reduce(BigDecimal.ZERO, BigDecimal::add);
  }

  private ResponseEntity<byte[]> csv(List<ObjectNode> rows, List<String> fields, String name) {
    StringBuilder csv = new StringBuilder("\uFEFF");
    csv.append(String.join(",", fields)).append("\r\n");
    for (ObjectNode row : rows) {
      for (int i = 0; i < fields.size(); i++) {
        if (i > 0) csv.append(',');
        String value = text(row, fields.get(i));
        if (value.matches("^[=+@-].*")) value = "'" + value;
        csv.append('"').append(value.replace("\"", "\"\"")).append('"');
      }
      csv.append("\r\n");
    }
    return ResponseEntity.ok()
        .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + name + "\"")
        .contentType(MediaType.parseMediaType("text/csv;charset=UTF-8"))
        .body(csv.toString().getBytes(java.nio.charset.StandardCharsets.UTF_8));
  }
}
