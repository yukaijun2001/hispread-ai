package com.hispread.ai;

import static com.hispread.ai.BusinessSupport.*;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.node.*;
import jakarta.servlet.http.HttpServletRequest;
import java.math.BigDecimal;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.time.*;
import java.util.*;
import org.springframework.http.*;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

/** Platform accounting actions. Monetary values are calculated on the server. */
@RestController
@RequestMapping("/api")
public class PlatformFinanceController {
  private final Store store;
  private final AuthService auth;
  private final BusinessSupport b;
  private final AccessPolicy access;
  private final QuotePricingService pricing;

  public PlatformFinanceController(
      Store store,
      AuthService auth,
      BusinessSupport b,
      AccessPolicy access,
      QuotePricingService pricing) {
    this.store = store;
    this.auth = auth;
    this.b = b;
    this.access = access;
    this.pricing = pricing;
  }

  private void platform(HttpServletRequest req, String permission) {
    if (!access.admin(req) && !access.finance(req))
      throw new ApiException(403, "仅财务或最高管理员可执行业务财务操作");
    auth.requirePlatform(req, permission);
  }

  private void lock(String key) {
    store.jdbc.queryForObject(
        "select pg_advisory_xact_lock(hashtextextended(?,0))", Object.class, key);
  }

  private String fingerprint(JsonNode value) {
    try {
      return HexFormat.of()
          .formatHex(
              MessageDigest.getInstance("SHA-256")
                  .digest(value.toString().getBytes(StandardCharsets.UTF_8)));
    } catch (Exception e) {
      throw new IllegalStateException(e);
    }
  }

  private List<ObjectNode> inputs(Map<String, String> query, HttpServletRequest req) {
    return access.visible("input", req).stream()
        .filter(
            x ->
                b.match(x, query, "state", "state")
                    && b.match(x, query, "supplier", "supplierId")
                    && b.match(x, query, "project", "projectId")
                    && b.match(x, query, "currency", "currency")
                    && b.match(x, query, "sourceKind", "sourceKind")
                    && (query.getOrDefault("reviewStatus", "").isBlank()
                        || query
                            .get("reviewStatus")
                            .equals(
                                x.path("reviewStatus")
                                    .asText(eq(x, "state", "PENDING") ? "PENDING" : "CONFIRMED")))
                    && (query.getOrDefault("model", "").isBlank()
                        || b.contains(x, query.get("model"), "modelKey", "model"))
                    && b.contains(
                        x, query.get("search"), "sourceRef", "supplierName", "projectName")
                    && b.dates(x, query, "from", "to", "periodStart", "periodEnd"))
        .toList();
  }

  @GetMapping("/settlement-inputs")
  public ObjectNode inputList(@RequestParam Map<String, String> query, HttpServletRequest req) {
    platform(req, "usage.read");
    return b.page(inputs(query, req), query);
  }

  @PostMapping({
    "/settlement-inputs",
    "/settlement-inputs/manual",
    "/settlement-inputs/manual-direct"
  })
  @Transactional
  public ObjectNode importInputs(@RequestBody ObjectNode body, HttpServletRequest req) {
    platform(req, "usage.import");
    required(body, "supplierId", "projectId");
    String owner = text(body, "supplierId");
    access.requireSupplier(req, owner);
    ObjectNode supplier = access.get("supplier", owner, req),
        project = b.project(text(body, "projectId"));
    if (!body.path("rows").isArray()
        || body.path("rows").isEmpty()
        || body.path("rows").size() > 1000) throw new ApiException(400, "请提供1至1000条金额记录");
    boolean direct = req.getRequestURI().endsWith("manual-direct");
    int inserted = 0, skipped = 0;
    for (JsonNode row : body.path("rows")) {
      required(row, "sourceRef", "periodStart", "periodEnd", "currency");
      checkDates(text(row, "periodStart"), text(row, "periodEnd"));
      if (!Set.of("USD", "CNY", "USDT").contains(text(row, "currency")))
        throw new ApiException(400, "不支持的币种");
      lock("input:" + owner + ":" + text(project, "id") + ":" + text(row, "sourceRef"));
      ObjectNode repeated =
          store.list("input", owner).stream()
              .filter(
                  x ->
                      eq(x, "projectId", text(project, "id"))
                          && eq(x, "sourceRef", text(row, "sourceRef")))
              .findFirst()
              .orElse(null);
      if (repeated != null) {
        for (String field :
            List.of(
                "periodStart",
                "periodEnd",
                "currency",
                "originalAmount",
                "quantity",
                "baseReference")) {
          String supplied = text(row, field);
          if (!supplied.equals(text(repeated, field)))
            throw new ApiException(409, "来源单号已存在但内容不同，请使用新来源单号或核对记录");
        }
        skipped++;
        continue;
      }
      BigDecimal original = decimal(row, "originalAmount", false), payable;
      if (original.precision() > 30 || original.scale() > 8)
        throw new ApiException(400, "原始金额最多30位有效数字和8位小数");
      ObjectNode quote;
      if (direct) {
        required(row, "baseReference");
        quote = b.obj().put("pricingType", "DIRECT").put("title", text(project, "name"));
        payable = original;
      } else {
        List<ObjectNode> matches =
            store.list("quote", owner).stream()
                .filter(
                    q ->
                        eq(q, "projectId", text(project, "id"))
                            && eq(q, "state", "APPROVED")
                            && eq(q, "currency", text(row, "currency"))
                            && text(q, "effectiveFrom").compareTo(text(row, "periodStart")) <= 0
                            && text(q, "effectiveTo").compareTo(text(row, "periodEnd")) >= 0)
                .toList();
        if (matches.size() != 1) throw new ApiException(409, "该期间没有唯一有效报价，请检查日期与币种");
        ObjectNode storedQuote = matches.get(0);
        String priceField = eq(storedQuote, "pricingType", "FIXED") ? "unitPrice" : "multiplier";
        for (JsonNode price : storedQuote.path("priceHistory")) {
          try {
            String changeDate =
                Instant.parse(text(price, "effectiveAt"))
                    .atZone(ZoneId.of("Asia/Shanghai"))
                    .toLocalDate()
                    .toString();
            if (changeDate.compareTo(text(row, "periodStart")) > 0
                && changeDate.compareTo(text(row, "periodEnd")) <= 0)
              throw new ApiException(409, "金额期间跨越已审核调价日期，请拆分原始金额后提交");
          } catch (DateTimeException ignored) {
          }
        }
        quote = pricing.at(storedQuote, LocalDate.parse(text(row, "periodEnd")));
        if (eq(quote, "pricingType", "FIXED")) {
          BigDecimal quantity = decimal(row, "quantity", true);
          if (quantity.stripTrailingZeros().scale() > 0) throw new ApiException(400, "买断数量须为正整数");
          payable = quantity.multiply(amount(quote, "unitPrice"));
        } else payable = original.multiply(amount(quote, "multiplier"));
      }
      ObjectNode data =
          b.pick(
              row,
              "sourceRef",
              "periodStart",
              "periodEnd",
              "currency",
              "quantity",
              "baseReference");
      data.put("supplierId", owner)
          .put("supplierName", text(supplier, "name"))
          .put("projectId", text(project, "id"))
          .put("projectName", text(project, "name"))
          .put(
              "sourceKind",
              req.getRequestURI().endsWith("/settlement-inputs") ? "EXTERNAL" : "MANUAL")
          .put("originalAmount", original.toPlainString())
          .put("calculatedPayable", payable.toPlainString())
          .put("finalAmount", payable.toPlainString())
          .put("state", "AVAILABLE")
          .put("createdBy", auth.userId(req));
      data.set("quoteSnapshot", quote);
      data.put("projectCategory", text(project, "category"))
          .put("pricingType", text(quote, "pricingType"));
      data.set("settlementMultiplier", quote.path("multiplier"));
      data.set("settlementUnitPrice", quote.path("unitPrice"));
      store.create("input", owner, data);
      inserted++;
    }
    return b.obj().put("inserted", inserted).put("skipped", skipped);
  }

  @PostMapping("/settlement-inputs/{id}/void")
  public ObjectNode voidInput(
      @PathVariable String id, @RequestBody ObjectNode body, HttpServletRequest req) {
    platform(req, "usage.import");
    required(body, "note");
    ObjectNode old = access.get("input", id, req);
    if (!eq(old, "state", "AVAILABLE")) throw new ApiException(409, "只能作废尚未纳入结算的金额");
    return store.update(
        "input",
        id,
        null,
        b.obj()
            .put("state", "VOID")
            .put("voidNote", text(body, "note"))
            .put("version", old.path("version").asLong()));
  }

  private void checkDates(String from, String to) {
    try {
      if (LocalDate.parse(from).isAfter(LocalDate.parse(to))) throw new IllegalArgumentException();
    } catch (Exception e) {
      throw new ApiException(400, "请选择有效的起止日期");
    }
  }

  private ObjectNode document(ObjectNode body, HttpServletRequest req) {
    required(body, "supplierId", "projectId", "periodStart", "periodEnd", "currency");
    checkDates(text(body, "periodStart"), text(body, "periodEnd"));
    String owner = text(body, "supplierId");
    access.requireSupplier(req, owner);
    ObjectNode supplier = access.get("supplier", owner, req),
        project = b.project(text(body, "projectId"));
    Set<String> selected = new HashSet<>();
    for (JsonNode id : body.path("inputIds")) selected.add(id.asText());
    List<ObjectNode> rows =
        store.list("input", owner).stream()
            .filter(
                x ->
                    eq(x, "state", "AVAILABLE")
                        && eq(x, "projectId", text(project, "id"))
                        && eq(x, "currency", text(body, "currency"))
                        && (selected.isEmpty() || selected.contains(text(x, "id")))
                        && text(x, "periodStart").compareTo(text(body, "periodStart")) >= 0
                        && text(x, "periodEnd").compareTo(text(body, "periodEnd")) <= 0)
            .toList();
    if (rows.isEmpty()) throw new ApiException(409, "所选期间没有可结算金额，请先录入真实金额");
    ArrayNode lines = b.arr(List.of());
    BigDecimal original = BigDecimal.ZERO, total = BigDecimal.ZERO;
    for (ObjectNode row : rows) {
      ObjectNode line = row.deepCopy();
      line.put("businessDate", text(row, "periodStart"))
          .put("baseAmount", text(row, "originalAmount"))
          .put("externalId", text(row, "sourceRef"))
          .put("quoteId", text(row.path("quoteSnapshot"), "id"));
      line.set("quote", row.path("quoteSnapshot"));
      lines.add(line);
      original = original.add(amount(row, "originalAmount"));
      total = total.add(amount(row, "calculatedPayable"));
    }
    ObjectNode out =
        b.pick(
            body,
            "supplierId",
            "projectId",
            "periodStart",
            "periodEnd",
            "currency",
            "confirmationDeadline",
            "requestKey");
    out.put("supplierName", text(supplier, "name"))
        .put("projectName", text(project, "name"))
        .put("basisMode", "INPUTS")
        .put("originalTotal", original.toPlainString())
        .put("total", total.toPlainString())
        .put("calculatedTotal", total.toPlainString())
        .put("lineCount", rows.size())
        .put("page", 1)
        .put("size", 1000);
    out.set("lines", lines);
    ObjectNode basis = out.deepCopy();
    basis.remove(List.of("requestKey", "confirmationDeadline"));
    out.put("snapshotHash", fingerprint(basis));
    return out;
  }

  @PostMapping("/settlements/preview")
  public ObjectNode preview(
      @RequestBody ObjectNode body,
      @RequestParam(defaultValue = "1") int page,
      @RequestParam(defaultValue = "50") int size,
      HttpServletRequest req) {
    platform(req, "settlement.create");
    return previewPage(document(body, req), page, size);
  }

  private ObjectNode previewPage(ObjectNode original, int page, int size) {
    ObjectNode out = original.deepCopy();
    List<ObjectNode> all = new ArrayList<>();
    for (JsonNode row : out.path("lines")) if (row.isObject()) all.add((ObjectNode) row);
    ObjectNode paging = store.page(all, page, size);
    out.set("lines", paging.path("items"));
    out.put("lineCount", all.size())
        .put("page", paging.path("page").asInt())
        .put("size", paging.path("size").asInt());
    return out;
  }

  @PostMapping("/settlements")
  @Transactional
  public ObjectNode createSettlement(@RequestBody ObjectNode body, HttpServletRequest req) {
    platform(req, "settlement.create");
    required(body, "supplierId", "expectedSnapshotHash", "confirmationDeadline");
    if (text(body, "requestKey").isBlank())
      body.put("requestKey", "snapshot:" + text(body, "expectedSnapshotHash"));
    lock("settlement:" + text(body, "supplierId"));
    for (ObjectNode x : store.list("settlement", text(body, "supplierId")))
      if (eq(x, "requestKey", text(body, "requestKey"))) return x;
    ObjectNode doc = document(body, req);
    if (!eq(doc, "snapshotHash", text(body, "expectedSnapshotHash")))
      throw new ApiException(409, "金额已变化，请重新预览");
    try {
      if (!Instant.parse(text(body, "confirmationDeadline")).isAfter(Instant.now()))
        throw new IllegalArgumentException();
    } catch (Exception e) {
      throw new ApiException(400, "确认截止时间须为未来时间");
    }
    String owner = text(doc, "supplierId");
    doc.put("code", "S-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase())
        .put("state", "PENDING")
        .put("paidAmount", "0")
        .put("receivedAmount", "0")
        .put("reservedAmount", "0")
        .put("adjustmentTotal", "0")
        .put("supplierConfirmed", false)
        .put("workflowVersion", 2)
        .put("createdBy", auth.userId(req))
        .put("canVoid", true);
    doc.putArray("adjustments");
    ObjectNode saved = store.create("settlement", owner, doc);
    for (JsonNode line : doc.path("lines"))
      store.update(
          "input",
          text(line, "id"),
          owner,
          b.obj()
              .put("state", "ALLOCATED")
              .put("settlementId", text(saved, "id"))
              .put("version", line.path("version").asLong()));
    return saved;
  }

  @PostMapping({"/settlements/{id}/void", "/settlements/{id}/withdraw"})
  @Transactional
  public ObjectNode voidSettlement(
      @PathVariable String id, @RequestBody ObjectNode body, HttpServletRequest req) {
    platform(req, "settlement.create");
    required(body, "note");
    ObjectNode old = access.get("settlement", id, req);
    if (!eq(old, "state", "PENDING") || amount(old, "reservedAmount").signum() != 0)
      throw new ApiException(409, "仅可撤回无付款占用的待确认结算单");
    if (!body.has("version")) throw new ApiException(400, "请提供结算单版本");
    ObjectNode patch = b.pick(body, "version");
    patch
        .put("state", req.getRequestURI().endsWith("withdraw") ? "WITHDRAWN" : "VOID")
        .put("voidNote", text(body, "note"))
        .put("voidedAt", Instant.now().toString())
        .put("canVoid", false);
    ObjectNode saved = store.update("settlement", id, null, patch);
    for (ObjectNode line : store.list("input", text(old, "supplierId")))
      if (eq(line, "settlementId", id))
        store.update(
            "input",
            text(line, "id"),
            text(old, "supplierId"),
            b.obj().put("state", "AVAILABLE").putNull("settlementId"));
    return saved;
  }

  @PostMapping("/settlements/{id}/adjustments")
  @Transactional
  public ObjectNode adjustment(
      @PathVariable String id, @RequestBody ObjectNode body, HttpServletRequest req) {
    platform(req, "settlement.create");
    required(body, "amount", "note", "businessDate", "requestKey");
    lock("adjustment:" + id);
    ObjectNode old = access.get("settlement", id, req);
    if (!eq(old, "state", "PENDING")) throw new ApiException(409, "仅可调整待确认结算单");
    if (!body.has("version")) throw new ApiException(400, "请提供结算单版本");
    for (JsonNode prior : old.path("adjustments"))
      if (eq(prior, "requestKey", text(body, "requestKey"))) return old;
    String deadline = text(old, "confirmationDeadline");
    if (!deadline.isBlank() && !Instant.parse(deadline).isAfter(Instant.now()))
      throw new ApiException(409, "确认截止时间已到");
    String date = text(body, "businessDate");
    try {
      LocalDate.parse(date);
    } catch (Exception e) {
      throw new ApiException(400, "结算日期无效");
    }
    if (date.compareTo(text(old, "periodStart")) < 0 || date.compareTo(text(old, "periodEnd")) > 0)
      throw new ApiException(400, "结算日期必须在本单期间内");
    BigDecimal delta;
    try {
      delta = new BigDecimal(text(body, "amount"));
    } catch (Exception e) {
      throw new ApiException(400, "调整金额无效");
    }
    if (delta.signum() == 0 || delta.scale() > 2) throw new ApiException(400, "加减金额不能为零且最多两位小数");
    BigDecimal total = amount(old, "total").add(delta);
    if (total.signum() < 0) throw new ApiException(400, "调整后的金额不能为负");
    ArrayNode adjustments = old.withArray("adjustments").deepCopy();
    ObjectNode entry =
        b.pick(body, "amount", "note", "businessDate", "supplierVisible", "requestKey");
    entry
        .put("id", UUID.randomUUID().toString())
        .put("createdAt", Instant.now().toString())
        .put("createdBy", auth.userId(req));
    adjustments.add(entry);
    ObjectNode patch = b.pick(body, "version");
    patch.set("adjustments", adjustments);
    patch
        .put("total", total.toPlainString())
        .put("adjustmentTotal", amount(old, "adjustmentTotal").add(delta).toPlainString());
    return store.update("settlement", id, null, patch);
  }

  @PostMapping({"/payments", "/payments/offline"})
  @Transactional
  public ObjectNode createPayment(@RequestBody ObjectNode body, HttpServletRequest req) {
    boolean offline = req.getRequestURI().endsWith("offline");
    platform(req, "payment.create");
    required(body, "settlementId", "requestKey", "payoutCurrency");
    String requestFingerprint =
        fingerprint(
            b.pick(
                    body,
                    "settlementId",
                    "obligationAmount",
                    "payoutCurrency",
                    "exchangeRateId",
                    "accountId",
                    "fee")
                .put("paymentMethod", offline ? "OFFLINE" : "CHANNEL"));
    lock("payment-key:" + text(body, "requestKey"));
    lock("payment:" + text(body, "settlementId"));
    ObjectNode settlement = access.get("settlement", text(body, "settlementId"), req);
    String owner = text(settlement, "supplierId");
    for (ObjectNode existing : store.list("payment", owner))
      if (eq(existing, "requestKey", text(body, "requestKey"))) {
        if (!eq(existing, "settlementId", text(body, "settlementId")))
          throw new ApiException(409, "该提交编号已用于其他结算单");
        if (existing.has("requestFingerprint")
            && !eq(existing, "requestFingerprint", requestFingerprint))
          throw new ApiException(409, "提交编号已用于不同付款内容");
        return existing;
      }
    if (!eq(settlement, "state", "CONFIRMED") || !settlement.path("supplierConfirmed").asBoolean())
      throw new ApiException(409, "供应商须先确认结算金额");
    BigDecimal amount = decimal(body, "obligationAmount", true),
        fee = body.has("fee") ? decimal(body, "fee", false) : BigDecimal.ZERO;
    BigDecimal reserved = amount(settlement, "reservedAmount");
    if (amount.add(reserved).compareTo(amount(settlement, "total")) > 0)
      throw new ApiException(409, "付款金额超过可付余额");
    BigDecimal rate = BigDecimal.ONE;
    if (!eq(settlement, "currency", text(body, "payoutCurrency"))) {
      ObjectNode exchange = store.get("exchange-rate", text(body, "exchangeRateId"), null);
      if (!eq(exchange, "baseCurrency", text(settlement, "currency"))
          || !eq(exchange, "quoteCurrency", text(body, "payoutCurrency")))
        throw new ApiException(400, "汇率币种不匹配");
      if (!exchange.path("enabled").asBoolean(true)
          || Instant.parse(text(exchange, "effectiveFrom")).isAfter(Instant.now()))
        throw new ApiException(409, "汇率尚未生效或已停用");
      rate = amount(exchange, "rate");
    }
    if (!Set.of("USD", "CNY", "USDT").contains(text(body, "payoutCurrency")))
      throw new ApiException(400, "不支持的付款币种");
    if (amount.scale() > 2 || fee.scale() > 2 || amount.precision() > 24)
      throw new ApiException(400, "付款金额和手续费最多两位小数");
    ObjectNode account = null;
    if (!offline || !text(body, "accountId").isBlank()) {
      account = paymentAccount(text(body, "accountId"), owner, text(body, "payoutCurrency"));
    }
    ObjectNode data =
        b.pick(
            body,
            "settlementId",
            "requestKey",
            "payoutCurrency",
            "exchangeRateId",
            "accountId",
            "externalRef",
            "evidenceId",
            "evidenceIds",
            "evidenceContent");
    data.put("requestFingerprint", requestFingerprint)
        .put("supplierId", owner)
        .put("supplierName", text(settlement, "supplierName"))
        .put("settlementCode", text(settlement, "code"))
        .put("currency", text(settlement, "currency"))
        .put("obligationAmount", amount.toPlainString())
        .put("payoutAmount", amount.multiply(rate).toPlainString())
        .put("exchangeRate", rate.toPlainString())
        .put("fxRate", rate.toPlainString())
        .put(
            "fxSource",
            eq(settlement, "currency", text(body, "payoutCurrency"))
                ? "同币种"
                : "汇率版本 " + text(body, "exchangeRateId"))
        .put("obligationCurrency", text(settlement, "currency"))
        .put("statusUpdatedAt", Instant.now().toString())
        .put("verificationMode", offline ? "MANUAL" : "UNVERIFIED")
        .put("fee", fee.toPlainString())
        .put("createdBy", auth.userId(req))
        .put("paymentMethod", offline ? "OFFLINE" : "CHANNEL")
        .put("state", "PENDING")
        .put("receiptState", "PENDING")
        .put("code", "P-" + UUID.randomUUID().toString().substring(0, 8));
    if (account != null)
      data.put("accountVersion", account.path("version").asLong())
          .put("accountSnapshotHash", fingerprint(account));
    if (offline && body.path("evidenceIds").isArray() && !body.path("evidenceIds").isEmpty()) {
      auth.require(req, "file.write");
      validateEvidence(body, owner);
      data.set("evidence", paymentEvidence(body, owner));
    }
    ObjectNode saved = store.create("payment", owner, data);
    ObjectNode patch =
        b.obj()
            .put("reservedAmount", reserved.add(amount).toPlainString())
            .put("version", settlement.path("version").asLong());

    store.update("settlement", text(settlement, "id"), owner, patch);
    return saved;
  }

  private ObjectNode paymentAccount(String id, String owner, String currency) {
    if (id.isBlank()) throw new ApiException(400, "请选择收款账户");
    ObjectNode account = store.get("account", id, owner);
    if (!eq(account, "state", "APPROVED") || !eq(account, "currency", currency))
      throw new ApiException(409, "请使用该供应商同币种已审核账户");
    return account;
  }

  private void validateAccountSnapshot(ObjectNode payment) {
    String id = text(payment, "accountId");
    if (id.isBlank()) {
      if (eq(payment, "paymentMethod", "CHANNEL")) throw new ApiException(409, "付款缺少已审核收款账户，请重新申请");
      return;
    }
    ObjectNode account;
    try {
      account = paymentAccount(id, text(payment, "supplierId"), text(payment, "payoutCurrency"));
    } catch (ApiException e) {
      throw new ApiException(409, "收款账户已失效，请重新申请付款");
    }
    if (!payment.has("accountVersion")
        || !payment.has("accountSnapshotHash")
        || payment.path("accountVersion").asLong() != account.path("version").asLong()
        || !eq(payment, "accountSnapshotHash", fingerprint(account)))
      throw new ApiException(409, "收款账户已变化，请重新申请付款并重新审核");
  }

  private void requireVersion(JsonNode body, JsonNode old) {
    if (!body.has("version")) throw new ApiException(400, "请提供当前付款版本");
    if (body.path("version").asLong() != old.path("version").asLong())
      throw new ApiException(409, "付款已变化，请刷新后重试");
  }

  private void validateEvidence(JsonNode body, String owner) {
    JsonNode ids = body.path("evidenceIds");
    if (!ids.isArray() || ids.isEmpty() || ids.size() > 10)
      throw new ApiException(400, "请上传1至10个真实付款凭证附件");
    for (JsonNode id : ids) {
      ObjectNode doc = store.get("document", id.asText(), owner);
      if (!eq(doc, "category", "PAYMENT_PROOF")) throw new ApiException(400, "请上传付款凭证文件");
    }
    String content = text(body, "evidenceContent");
    if (content.length() > 10000) throw new ApiException(400, "付款说明最多10000字");
    if (!content.isBlank())
      try {
        JsonNode parsed = store.json.readTree(content);
        if (!parsed.isArray() && !parsed.isObject()) throw new IllegalArgumentException();
      } catch (Exception e) {
        throw new ApiException(400, "付款说明格式不正确");
      }
  }

  private ObjectNode paymentEvidence(JsonNode body, String owner) {
    ObjectNode evidence = b.obj();
    ObjectNode empty = b.obj().put("type", "doc");
    empty.putArray("children");
    try {
      evidence.set(
          "content",
          text(body, "evidenceContent").isBlank()
              ? empty
              : store.json.readTree(text(body, "evidenceContent")));
    } catch (Exception e) {
      throw new ApiException(400, "付款说明格式不正确");
    }
    ArrayNode files = evidence.putArray("attachments");
    for (JsonNode id : body.path("evidenceIds")) {
      ObjectNode doc = store.get("document", id.asText(), owner);
      files.add(
          b.obj()
              .put("id", id.asText())
              .put("name", doc.path("filename").asText(doc.path("name").asText("付款凭证")))
              .put("contentType", doc.path("contentType").asText("application/octet-stream"))
              .put("bytes", doc.path("size").asLong()));
    }
    return evidence;
  }

  @PostMapping("/payments/{id}/review")
  @Transactional
  public ObjectNode reviewPayment(
      @PathVariable String id, @RequestBody ObjectNode body, HttpServletRequest req) {
    platform(req, "payment.review");
    lock("payment-state:" + id);
    ObjectNode old = access.get("payment", id, req);
    requireVersion(body, old);
    if (!eq(old, "state", "PENDING")) throw new ApiException(409, "付款申请已不处于待审状态");
    if (eq(old, "createdBy", auth.userId(req))) throw new ApiException(403, "不能审核本人提交的付款申请");
    if (body.path("approved").asBoolean()) validateAccountSnapshot(old);
    if (!body.path("approved").asBoolean())
      return closePayment(
          id,
          b.obj()
              .put("state", "REJECTED")
              .put("note", text(body, "note"))
              .put("version", old.path("version").asLong()),
          req);
    return store.update(
        "payment",
        id,
        null,
        b.obj()
            .put("state", "APPROVED")
            .put("reviewedBy", auth.userId(req))
            .put("reviewedAt", Instant.now().toString())
            .put("version", old.path("version").asLong()));
  }

  @PostMapping("/payments/{id}/offline-record")
  @Transactional
  public ObjectNode recordPayment(
      @PathVariable String id, @RequestBody ObjectNode body, HttpServletRequest req) {
    platform(req, "payment.record");
    lock("payment-state:" + id);
    ObjectNode old = access.get("payment", id, req);
    requireVersion(body, old);
    if (text(old, "reviewedBy").isBlank() || eq(old, "reviewedBy", text(old, "createdBy")))
      throw new ApiException(403, "线下登记须先经过独立审核");
    if (!Set.of("APPROVED").contains(text(old, "state")))
      throw new ApiException(409, "当前付款不能登记线下结果");
    validateAccountSnapshot(old);
    auth.require(req, "file.write");
    validateEvidence(body, text(old, "supplierId"));
    lock("payment:" + text(old, "settlementId"));
    ObjectNode settlement = access.get("settlement", text(old, "settlementId"), req);
    store.update(
        "settlement",
        text(settlement, "id"),
        text(old, "supplierId"),
        b.obj()
            .put(
                "paidAmount",
                amount(settlement, "paidAmount")
                    .add(amount(old, "obligationAmount"))
                    .toPlainString())
            .put("version", settlement.path("version").asLong()));
    ObjectNode patch = b.pick(body, "externalRef", "evidenceId", "evidenceIds", "evidenceContent");
    patch.set("evidence", paymentEvidence(body, text(old, "supplierId")));
    patch
        .put("state", "SUCCEEDED")
        .put("paymentMethod", "OFFLINE")
        .put("verificationMode", "MANUAL")
        .put("recordedBy", auth.userId(req))
        .put("version", old.path("version").asLong())
        .put("statusUpdatedAt", Instant.now().toString());
    return store.update("payment", id, null, patch);
  }

  @PostMapping("/payments/{id}/close")
  @Transactional
  public ObjectNode closePayment(
      @PathVariable String id, @RequestBody ObjectNode body, HttpServletRequest req) {
    platform(req, "payment.review");
    lock("payment-state:" + id);
    required(body, "note");
    ObjectNode old = access.get("payment", id, req);
    requireVersion(body, old);
    if (!Set.of("PENDING", "APPROVED").contains(text(old, "state")))
      throw new ApiException(409, "当前付款状态不可关闭");
    String state = text(body, "state");
    if (!Set.of("CANCELLED", "FAILED", "REJECTED").contains(state))
      throw new ApiException(400, "无效的关闭状态");
    lock("payment:" + text(old, "settlementId"));
    ObjectNode settlement = access.get("settlement", text(old, "settlementId"), req);
    store.update(
        "settlement",
        text(settlement, "id"),
        text(old, "supplierId"),
        b.obj()
            .put(
                "reservedAmount",
                amount(settlement, "reservedAmount")
                    .subtract(amount(old, "obligationAmount"))
                    .max(BigDecimal.ZERO)
                    .toPlainString())
            .put("version", settlement.path("version").asLong()));
    return store.update(
        "payment",
        id,
        null,
        b.obj()
            .put("state", state)
            .put("closeNote", text(body, "note"))
            .put("version", old.path("version").asLong()));
  }

  private List<ObjectNode> dailyRows(Map<String, String> query, HttpServletRequest req) {
    List<ObjectNode> rows = new ArrayList<>();
    for (ObjectNode input : inputs(query, req))
      if (eq(input, "periodStart", text(input, "periodEnd")) && !eq(input, "state", "VOID")) {
        ObjectNode row = input.deepCopy();
        row.put("businessDate", text(input, "periodStart"))
            .put("exactConsumption", text(input, "originalAmount"));
        row.put("displayState", eq(input, "state", "AVAILABLE") ? "UNSETTLED" : "SETTLING");
        row.put("currentDayProvisional", text(input, "periodStart").equals(today()));
        row.put(
            "reviewStatus",
            input
                .path("reviewStatus")
                .asText(eq(input, "state", "PENDING") ? "PENDING" : "CONFIRMED"));
        row.put("consumption", text(input, "originalAmount"))
            .put("payable", text(input, "calculatedPayable"))
            .put("model", input.path("modelKey").asText(text(input, "model")));
        row.put("quoteId", input.path("quoteSnapshot").path("id").asText())
            .put("sourceId", text(input, "id"));
        rows.add(row);
      }
    return rows;
  }

  private ObjectNode aggregate(List<ObjectNode> rows) {
    BigDecimal consumption = BigDecimal.ZERO,
        payable = BigDecimal.ZERO,
        unsettled = BigDecimal.ZERO,
        pending = BigDecimal.ZERO,
        confirmed = BigDecimal.ZERO;
    int pendingCount = 0, confirmedCount = 0;
    for (ObjectNode row : rows) {
      BigDecimal value = amount(row, "originalAmount");
      consumption = consumption.add(value);
      if (eq(row, "reviewStatus", "PENDING") || eq(row, "state", "PENDING")) {
        pending = pending.add(value);
        pendingCount++;
      } else {
        confirmed = confirmed.add(value);
        confirmedCount++;
        payable = payable.add(amount(row, "calculatedPayable"));
        if (eq(row, "state", "AVAILABLE"))
          unsettled = unsettled.add(amount(row, "calculatedPayable"));
      }
    }
    return b.obj()
        .put("consumptionTotal", consumption.toPlainString())
        .put("confirmedOriginal", confirmed.toPlainString())
        .put("payableTotal", payable.toPlainString())
        .put("pendingConsumption", pending.toPlainString())
        .put("unsettledPayable", unsettled.toPlainString())
        .put("pendingCount", pendingCount)
        .put("confirmedCount", confirmedCount);
  }

  @GetMapping({"/accounting/daily", "/accounting/daily/groups"})
  public ObjectNode daily(@RequestParam Map<String, String> query, HttpServletRequest req) {
    platform(req, "usage.read");
    List<ObjectNode> rows = dailyRows(query, req);
    if (req.getRequestURI().endsWith("groups")) {
      boolean supplier = query.getOrDefault("groupBy", "DAY").equals("SUPPLIER");
      Map<String, List<ObjectNode>> groups = new LinkedHashMap<>();
      for (ObjectNode row : rows) {
        String key =
            (supplier ? "" : text(row, "businessDate"))
                + ":"
                + text(row, "supplierId")
                + ":"
                + text(row, "projectId")
                + ":"
                + text(row, "currency")
                + ":"
                + text(row, "pricingType")
                + ":"
                + text(row, "settlementMultiplier")
                + ":"
                + text(row, "settlementUnitPrice");
        groups.computeIfAbsent(key, k -> new ArrayList<>()).add(row);
      }
      List<ObjectNode> grouped = new ArrayList<>();
      groups.forEach(
          (key, items) -> {
            ObjectNode first = items.get(0), a = aggregate(items);
            for (String f :
                List.of(
                    "businessDate",
                    "supplierId",
                    "supplierName",
                    "projectId",
                    "projectName",
                    "currency",
                    "pricingType",
                    "settlementMultiplier",
                    "settlementUnitPrice")) a.set(f, first.path(f));
            a.put("id", key);
            if (supplier) a.putNull("businessDate");
            grouped.add(a);
          });
      rows = grouped;
    }
    String sort = query.getOrDefault("sortBy", "");
    if (!sort.isBlank()) {
      if (!Set.of("consumptionTotal", "pendingConsumption", "confirmedOriginal", "payableTotal")
          .contains(sort)) throw new ApiException(400, "排序字段无效");
      boolean desc = query.getOrDefault("sortDirection", "DESC").equals("DESC");
      rows = new ArrayList<>(rows);
      rows.sort(
          (x, y) ->
              desc
                  ? amount(y, sort).compareTo(amount(x, sort))
                  : amount(x, sort).compareTo(amount(y, sort)));
    }
    ObjectNode out = b.page(rows, query);
    out.put("summaryUpdating", false).put("groupCount", rows.size());
    return out;
  }

  @GetMapping("/accounting/daily/summary")
  public ObjectNode dailySummary(@RequestParam Map<String, String> query, HttpServletRequest req) {
    platform(req, "usage.read");
    List<ObjectNode> rows = dailyRows(query, req);
    ObjectNode out =
        b.obj()
            .put("total", rows.size())
            .put("groupCount", rows.size())
            .put(
                "crossPeriodCount",
                inputs(query, req).stream()
                    .filter(x -> !eq(x, "periodStart", text(x, "periodEnd")))
                    .count())
            .put("summaryUpdating", false);
    ArrayNode totals = out.putArray("totals"), projects = out.putArray("projects");
    Map<String, List<ObjectNode>> currencies = new LinkedHashMap<>();
    Map<String, ObjectNode> projectCounts = new LinkedHashMap<>();
    for (ObjectNode row : rows) {
      currencies.computeIfAbsent(text(row, "currency"), k -> new ArrayList<>()).add(row);
      String pid = text(row, "projectId");
      ObjectNode p =
          projectCounts.computeIfAbsent(
              pid,
              k ->
                  b.obj()
                      .put("projectId", pid)
                      .put("projectName", text(row, "projectName"))
                      .put("count", 0));
      p.put("count", p.path("count").asInt() + 1);
    }
    currencies.forEach((currency, items) -> totals.add(aggregate(items).put("currency", currency)));
    projectCounts.values().forEach(projects::add);
    return out;
  }

  private static final List<String> EXPORT_FIELDS =
      List.of(
          "businessDate",
          "supplierName",
          "projectName",
          "sourceRef",
          "currency",
          "originalAmount",
          "calculatedPayable");
  private static final List<String> EXPORT_HEADERS =
      List.of("账务日期", "供应商", "项目", "来源单号", "币种", "原始金额", "应付金额");

  private Map<String, String> filter(JsonNode value) {
    Map<String, String> result = new LinkedHashMap<>();
    value.fields().forEachRemaining(e -> result.put(e.getKey(), e.getValue().asText()));
    return result;
  }

  @GetMapping("/accounting/daily/exports")
  public ObjectNode exports(@RequestParam Map<String, String> query, HttpServletRequest req) {
    platform(req, "usage.read");
    List<ObjectNode> rows =
        store.list("export", auth.userId(req)).stream()
            .filter(x -> b.match(x, query, "type", "type") && b.match(x, query, "state", "state"))
            .map(this::publicExport)
            .toList();
    ObjectNode page = b.page(rows, query);
    page.put("activeCount", 0);
    return page;
  }

  private ObjectNode publicExport(ObjectNode data) {
    ObjectNode out = data.deepCopy();
    out.remove("contentBase64");
    out.remove("previewRows");
    return out;
  }

  @PostMapping("/accounting/daily/exports/estimate")
  public ObjectNode estimateExport(@RequestBody ObjectNode body, HttpServletRequest req) {
    platform(req, "usage.read");
    Map<String, String> q = filter(body);
    return b.obj()
        .put("count", dailyRows(q, req).size())
        .put("partRows", 100000)
        .put(
            "crossPeriodCount",
            inputs(q, req).stream()
                .filter(x -> !eq(x, "periodStart", text(x, "periodEnd")))
                .count());
  }

  @PostMapping("/accounting/daily/exports")
  @Transactional
  public ObjectNode createExport(@RequestBody ObjectNode body, HttpServletRequest req) {
    platform(req, "settlement.export");
    required(body, "type", "format", "requestKey");
    lock("export:" + auth.userId(req) + ":" + text(body, "requestKey"));
    String exportFingerprint = fingerprint(b.pick(body, "type", "format", "filter"));
    for (ObjectNode prior : store.list("export", auth.userId(req)))
      if (eq(prior, "requestKey", text(body, "requestKey"))) {
        if (prior.has("requestFingerprint") && !eq(prior, "requestFingerprint", exportFingerprint))
          throw new ApiException(409, "导出编号已用于不同筛选条件");
        return publicExport(prior);
      }
    if (!Set.of("CSV", "XLSX").contains(text(body, "format"))
        || !Set.of("DETAIL", "SUMMARY", "SUPPLIER").contains(text(body, "type")))
      throw new ApiException(400, "无效的导出类型或格式");
    List<ObjectNode> rows = dailyRows(filter(body.path("filter")), req);
    if (!eq(body, "type", "DETAIL")) {
      Map<String, List<ObjectNode>> grouped = new LinkedHashMap<>();
      for (ObjectNode r : rows) {
        String group =
            (eq(body, "type", "SUMMARY") ? text(r, "businessDate") + ":" : "")
                + text(r, "supplierId")
                + ":"
                + text(r, "projectId")
                + ":"
                + text(r, "currency")
                + ":"
                + text(r, "pricingType")
                + ":"
                + text(r, "settlementMultiplier")
                + ":"
                + text(r, "settlementUnitPrice");
        grouped.computeIfAbsent(group, k -> new ArrayList<>()).add(r);
      }
      List<ObjectNode> summaryRows = new ArrayList<>();
      for (List<ObjectNode> items : grouped.values()) {
        ObjectNode row = items.get(0).deepCopy();
        BigDecimal
            original =
                items.stream()
                    .map(r -> amount(r, "originalAmount"))
                    .reduce(BigDecimal.ZERO, BigDecimal::add),
            payable =
                items.stream()
                    .map(r -> amount(r, "calculatedPayable"))
                    .reduce(BigDecimal.ZERO, BigDecimal::add);
        row.put("originalAmount", original.toPlainString())
            .put("calculatedPayable", payable.toPlainString())
            .put("sourceRef", "汇总 " + items.size() + " 笔");
        if (eq(body, "type", "SUPPLIER")) row.put("businessDate", "");
        summaryRows.add(row);
      }
      rows = summaryRows;
    }
    ArrayNode values = store.json.createArrayNode();
    for (ObjectNode row : rows) {
      ArrayNode record = values.addArray();
      for (String f : EXPORT_FIELDS) record.add(text(row, f));
    }
    boolean xlsx = eq(body, "format", "XLSX");
    byte[] bytes = xlsx ? xlsx(values) : exportCsv(values);
    ObjectNode data = b.pick(body, "type", "format", "filter", "requestKey");
    String name = "daily-accounting." + (xlsx ? "xlsx" : "csv");
    String now = Instant.now().toString();
    data.put("requestFingerprint", exportFingerprint)
        .put("state", "COMPLETED")
        .put("sourceCount", rows.size())
        .put("resultCount", rows.size())
        .put("processedCount", rows.size())
        .put("snapshotAt", now)
        .put("completedAt", now)
        .put("expiresAt", Instant.now().plusSeconds(604800).toString())
        .put("contentBase64", Base64.getEncoder().encodeToString(bytes));
    data.set("previewRows", values);
    data.set("headers", b.arr(EXPORT_HEADERS));
    data.set("snapshotTotals", aggregate(rows));
    ObjectNode labels =
        b.obj()
            .put("supplier", text(body.path("filter"), "supplier"))
            .put("project", text(body.path("filter"), "project"));
    data.set("filterLabels", labels);
    data.putArray("files")
        .add(b.obj().put("name", name).put("bytes", bytes.length).put("rows", rows.size()));
    return publicExport(store.create("export", auth.userId(req), data));
  }

  @GetMapping("/accounting/daily/exports/{id}")
  public ObjectNode exportDetail(@PathVariable String id, HttpServletRequest req) {
    platform(req, "usage.read");
    return publicExport(store.get("export", id, auth.userId(req)));
  }

  @GetMapping("/accounting/daily/exports/{id}/preview")
  public ObjectNode exportPreview(@PathVariable String id, HttpServletRequest req) {
    platform(req, "usage.read");
    ObjectNode data = store.get("export", id, auth.userId(req)),
        out = b.obj().put("total", data.path("resultCount").asInt());
    out.set("headers", b.arr(EXPORT_HEADERS));
    ArrayNode rows = out.putArray("rows");
    int index = 0;
    for (JsonNode row : data.path("previewRows")) {
      if (index++ >= 100) break;
      rows.add(row);
    }
    return out;
  }

  @GetMapping({
    "/accounting/daily/exports/{id}/files/{index}",
    "/accounting/daily/exports/{id}/download",
    "/accounting/daily/exports/{id}/archive"
  })
  public ResponseEntity<byte[]> download(
      @PathVariable String id,
      @PathVariable(required = false) Integer index,
      HttpServletRequest req) {
    platform(req, "settlement.export");
    ObjectNode data = store.get("export", id, auth.userId(req));
    if (index != null && index != 0) throw new ApiException(404, "文件不存在");
    if (Instant.parse(text(data, "expiresAt")).isBefore(Instant.now()))
      throw new ApiException(410, "导出文件已过期");
    byte[] bytes = Base64.getDecoder().decode(text(data, "contentBase64"));
    String name = data.path("files").get(0).path("name").asText();
    if (req.getRequestURI().endsWith("archive")) {
      bytes = zip(Map.of(name, bytes));
      name = "daily-accounting.zip";
    }
    return ResponseEntity.ok()
        .contentType(MediaType.APPLICATION_OCTET_STREAM)
        .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + name + "\"")
        .body(bytes);
  }

  @PostMapping("/accounting/daily/exports/{id}/cancel")
  public ObjectNode cancelExport(@PathVariable String id, HttpServletRequest req) {
    platform(req, "settlement.export");
    ObjectNode old = store.get("export", id, auth.userId(req));
    if (eq(old, "state", "COMPLETED")) throw new ApiException(409, "导出已完成");
    return publicExport(
        store.update("export", id, auth.userId(req), b.obj().put("state", "CANCELLED")));
  }

  private byte[] exportCsv(ArrayNode rows) {
    StringBuilder out = new StringBuilder("\uFEFF");
    out.append(String.join(",", EXPORT_HEADERS)).append("\r\n");
    for (JsonNode row : rows) {
      int index = 0;
      for (JsonNode value : row) {
        if (index++ > 0) out.append(',');
        String v = value.asText();
        if (v.matches("^[=+@-].*")) v = "'" + v;
        out.append('"').append(v.replace("\"", "\"\"")).append('"');
      }
      out.append("\r\n");
    }
    return out.toString().getBytes(StandardCharsets.UTF_8);
  }

  private byte[] zip(Map<String, byte[]> entries) {
    try {
      var out = new java.io.ByteArrayOutputStream();
      try (var zip = new java.util.zip.ZipOutputStream(out)) {
        for (var e : entries.entrySet()) {
          zip.putNextEntry(new java.util.zip.ZipEntry(e.getKey()));
          zip.write(e.getValue());
          zip.closeEntry();
        }
      }
      return out.toByteArray();
    } catch (Exception e) {
      throw new IllegalStateException(e);
    }
  }

  private String xml(String text) {
    return text.replace("&", "&amp;")
        .replace("<", "&lt;")
        .replace(">", "&gt;")
        .replace("\"", "&quot;");
  }

  private byte[] xlsx(ArrayNode rows) {
    StringBuilder sheet =
        new StringBuilder(
            "<?xml version=\"1.0\" encoding=\"UTF-8\"?><worksheet"
                + " xmlns=\"http://schemas.openxmlformats.org/spreadsheetml/2006/main\"><sheetData>");
    ArrayNode all = store.json.createArrayNode();
    all.add(b.arr(EXPORT_HEADERS));
    rows.forEach(all::add);
    int r = 0;
    for (JsonNode row : all) {
      sheet.append("<row r=\"").append(++r).append("\">");
      int c = 0;
      for (JsonNode v : row)
        sheet
            .append("<c r=\"")
            .append((char) ('A' + c++))
            .append(r)
            .append("\" t=\"inlineStr\"><is><t xml:space=\"preserve\">")
            .append(xml(v.asText()))
            .append("</t></is></c>");
      sheet.append("</row>");
    }
    sheet.append("</sheetData></worksheet>");
    Map<String, byte[]> files = new LinkedHashMap<>();
    files.put(
        "[Content_Types].xml",
        ("<?xml version=\"1.0\"?><Types"
             + " xmlns=\"http://schemas.openxmlformats.org/package/2006/content-types\"><Default"
             + " Extension=\"rels\""
             + " ContentType=\"application/vnd.openxmlformats-package.relationships+xml\"/><Default"
             + " Extension=\"xml\" ContentType=\"application/xml\"/><Override"
             + " PartName=\"/xl/workbook.xml\""
             + " ContentType=\"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml\"/><Override"
             + " PartName=\"/xl/worksheets/sheet1.xml\""
             + " ContentType=\"application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml\"/></Types>")
            .getBytes(StandardCharsets.UTF_8));
    files.put(
        "_rels/.rels",
        ("<Relationships"
             + " xmlns=\"http://schemas.openxmlformats.org/package/2006/relationships\"><Relationship"
             + " Id=\"rId1\""
             + " Type=\"http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument\""
             + " Target=\"xl/workbook.xml\"/></Relationships>")
            .getBytes(StandardCharsets.UTF_8));
    files.put(
        "xl/workbook.xml",
        ("<workbook xmlns=\"http://schemas.openxmlformats.org/spreadsheetml/2006/main\""
             + " xmlns:r=\"http://schemas.openxmlformats.org/officeDocument/2006/relationships\"><sheets><sheet"
             + " name=\"日账\" sheetId=\"1\" r:id=\"rId1\"/></sheets></workbook>")
            .getBytes(StandardCharsets.UTF_8));
    files.put(
        "xl/_rels/workbook.xml.rels",
        ("<Relationships"
             + " xmlns=\"http://schemas.openxmlformats.org/package/2006/relationships\"><Relationship"
             + " Id=\"rId1\""
             + " Type=\"http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet\""
             + " Target=\"worksheets/sheet1.xml\"/></Relationships>")
            .getBytes(StandardCharsets.UTF_8));
    files.put("xl/worksheets/sheet1.xml", sheet.toString().getBytes(StandardCharsets.UTF_8));
    return zip(files);
  }

  @GetMapping("/settlement-batches")
  public List<ObjectNode> batches(HttpServletRequest req) {
    platform(req, "settlement.create");
    return store.list("batch", null);
  }

  @GetMapping("/settlement-batches/candidates")
  public ObjectNode candidates(@RequestParam Map<String, String> query, HttpServletRequest req) {
    platform(req, "settlement.create");
    ObjectNode out = b.obj().put("summaryUpdating", false).put("incompleteDays", 0);
    List<ObjectNode> rows =
        access.visible("input", req).stream()
            .filter(
                x ->
                    eq(x, "state", "AVAILABLE")
                        && b.dates(
                            x, query, "periodStart", "periodEnd", "periodStart", "periodEnd"))
            .toList();
    Map<String, List<ObjectNode>> groups = new LinkedHashMap<>();
    for (ObjectNode row : rows) {
      String key =
          text(row, "supplierId") + ":" + text(row, "projectId") + ":" + text(row, "currency");
      groups.computeIfAbsent(key, k -> new ArrayList<>()).add(row);
    }
    List<ObjectNode> grouped = new ArrayList<>();
    groups.forEach(
        (key, items) -> {
          ObjectNode first = items.get(0), x = b.obj();
          for (String f :
              List.of("supplierId", "supplierName", "projectId", "projectName", "currency"))
            x.set(f, first.path(f));
          BigDecimal total =
              items.stream()
                  .map(i -> amount(i, "calculatedPayable"))
                  .reduce(BigDecimal.ZERO, BigDecimal::add);
          x.put("sourceCount", items.size())
              .put("blockedCount", 0)
              .put("total", total.toPlainString());
          grouped.add(x);
        });
    out.set("items", b.arr(grouped));
    return out;
  }

  @PostMapping("/settlement-batches/preview")
  @Transactional
  public ObjectNode previewBatch(@RequestBody ObjectNode body, HttpServletRequest req) {
    platform(req, "settlement.create");
    required(body, "periodStart", "periodEnd", "confirmationDeadline");
    Set<String> suppliers = new HashSet<>();
    for (JsonNode id : body.path("supplierIds")) suppliers.add(id.asText());
    ArrayNode items = b.arr(List.of());
    Set<String> seen = new HashSet<>();
    for (ObjectNode input : access.visible("input", req)) {
      String owner = text(input, "supplierId"),
          project = text(input, "projectId"),
          currency = text(input, "currency");
      if (!eq(input, "state", "AVAILABLE")
          || !suppliers.contains(owner)
          || body.hasNonNull("projectId")
              && !text(body, "projectId").isBlank()
              && !eq(input, "projectId", text(body, "projectId"))
          || body.hasNonNull("currency")
              && !text(body, "currency").isBlank()
              && !eq(input, "currency", text(body, "currency"))) continue;
      if (!seen.add(owner + project + currency)) continue;
      ObjectNode request = b.pick(body, "periodStart", "periodEnd", "confirmationDeadline");
      request
          .put("supplierId", owner)
          .put("projectId", project)
          .put("currency", currency)
          .put("requestKey", UUID.randomUUID().toString());
      try {
        ObjectNode doc = document(request, req);
        request.put("expectedSnapshotHash", text(doc, "snapshotHash"));
        ObjectNode item =
            doc.deepCopy()
                .put("id", UUID.randomUUID().toString())
                .put("state", "READY")
                .put("sourceCount", doc.path("lineCount").asInt());
        item.set("request", request);
        item.set("document", doc);
        items.add(item);
      } catch (ApiException e) {
        items.add(
            b.obj()
                .put("id", UUID.randomUUID().toString())
                .put("supplierId", owner)
                .put("supplierName", input.path("supplierName").asText(owner))
                .put("projectId", project)
                .put("projectName", text(input, "projectName"))
                .put("currency", currency)
                .put("state", "FAILED")
                .put("sourceCount", 1)
                .put("error", e.getMessage())
                .set("request", request));
      }
    }
    ObjectNode batch =
        b.pick(body, "periodStart", "periodEnd", "confirmationDeadline", "requestKey");
    batch
        .put("state", "PREVIEW")
        .put("supplierCount", suppliers.size())
        .put(
            "readyCount",
            java.util.stream.StreamSupport.stream(items.spliterator(), false)
                .filter(x -> eq(x, "state", "READY"))
                .count())
        .put("successCount", 0)
        .put("failedCount", 0)
        .put("incompleteDays", 0);
    batch.set("items", items);
    ObjectNode totals = batch.putObject("totals");
    for (JsonNode item : items) {
      if (!eq(item, "state", "READY")) continue;
      String currency = text(item, "currency");
      BigDecimal current = amount(totals, currency);
      totals.put(currency, current.add(amount(item, "total")).toPlainString());
    }
    return store.create("batch", "GLOBAL", batch);
  }

  @GetMapping("/settlement-batches/{id}")
  public ObjectNode batch(@PathVariable String id, HttpServletRequest req) {
    platform(req, "settlement.create");
    return store.get("batch", id, null);
  }

  @GetMapping("/settlement-batches/{id}/items/{itemId}/preview")
  public JsonNode batchItem(
      @PathVariable String id,
      @PathVariable String itemId,
      @RequestParam(defaultValue = "1") int page,
      @RequestParam(defaultValue = "50") int size,
      HttpServletRequest req) {
    for (JsonNode item : batch(id, req).path("items"))
      if (eq(item, "id", itemId)) {
        if (!item.path("document").isObject()) throw new ApiException(409, "此明细预览失败，请重试");
        return previewPage((ObjectNode) item.path("document"), page, size);
      }
    throw new ApiException(404, "批次明细不存在");
  }

  @PostMapping("/settlement-batches/{id}/start")
  @Transactional
  public ObjectNode startBatch(@PathVariable String id, HttpServletRequest req) {
    lock("batch:" + id);
    ObjectNode old = batch(id, req);
    if (!eq(old, "state", "PREVIEW")) return old;
    ArrayNode items = old.withArray("items").deepCopy();
    int success = 0, failed = 0;
    for (JsonNode node : items) {
      ObjectNode item = (ObjectNode) node;
      if (!eq(item, "state", "READY")) {
        failed++;
        continue;
      }
      org.springframework.transaction.TransactionStatus transaction =
          org.springframework.transaction.interceptor.TransactionAspectSupport
              .currentTransactionStatus();
      Object savepoint = transaction.createSavepoint();
      try {
        ObjectNode result = createSettlement((ObjectNode) item.path("request"), req);
        item.put("settlementId", text(result, "id")).put("state", "SUCCEEDED");
        item.remove("error");
        transaction.releaseSavepoint(savepoint);
        success++;
      } catch (RuntimeException e) {
        transaction.rollbackToSavepoint(savepoint);
        transaction.releaseSavepoint(savepoint);
        item.put("state", "FAILED")
            .put("error", e instanceof ApiException ? e.getMessage() : "生成结算单失败，请重新预览");
        failed++;
      }
    }
    ObjectNode patch =
        b.obj().put("state", "COMPLETED").put("successCount", success).put("failedCount", failed);
    patch.set("items", items);
    return store.update("batch", id, null, patch);
  }

  @PostMapping("/settlement-batches/{id}/retry-preview")
  @Transactional
  public ObjectNode retryBatch(
      @PathVariable String id, @RequestBody ObjectNode body, HttpServletRequest req) {
    ObjectNode old = batch(id, req);
    if (!eq(old, "state", "COMPLETED")) throw new ApiException(409, "批次尚未执行完成");
    ObjectNode request = b.pick(old, "periodStart", "periodEnd", "confirmationDeadline");
    request.put("requestKey", text(body, "requestKey"));
    ArrayNode suppliers = request.putArray("supplierIds");
    Set<String> seen = new HashSet<>();
    for (JsonNode item : old.path("items")) {
      if (eq(item, "state", "FAILED") && seen.add(text(item, "supplierId")))
        suppliers.add(text(item, "supplierId"));
    }
    if (suppliers.isEmpty()) throw new ApiException(409, "没有需要重新生成的失败项");
    return previewBatch(request, req);
  }
}
