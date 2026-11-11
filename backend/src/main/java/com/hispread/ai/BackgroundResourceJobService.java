package com.hispread.ai;

import static com.hispread.ai.BusinessSupport.*;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.node.*;
import java.math.BigDecimal;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.time.*;
import java.util.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.support.TransactionTemplate;

/**
 * Validated resource-observation and recoverable priority-rotation adapter. See
 * docs/job-executor-protocols.md.
 */
@Service
public class BackgroundResourceJobService {
  private final Store s;
  private final ResourceIntegrationGateway gateway;
  private final QuotePricingService pricing;
  private final TransactionTemplate tx;

  public BackgroundResourceJobService(
      Store s,
      ResourceIntegrationGateway gateway,
      QuotePricingService pricing,
      PlatformTransactionManager manager) {
    this.s = s;
    this.gateway = gateway;
    this.pricing = pricing;
    this.tx = new TransactionTemplate(manager);
  }

  private List<ObjectNode> targets(ObjectNode task) {
    String id = text(task, "targetId");
    if (!id.isBlank()) {
      ObjectNode target = gateway.requireConfigured(id);
      if (!(target.path("protocol").asText("CUSTOM").equals("CUSTOM")
          || target.path("protocol").asText().equals("CCMAX_NATIVE") && !eq(task, "type", "CCMAX_PRIORITY_ROTATION")))
        throw new ApiException(503, "CCMAX后台任务需CUSTOM协议资源适配器", "RESOURCE_OPERATION_UNSUPPORTED");
      gateway.validateEndpoint(
          java.net.URI.create(target.path("baseUrl").asText(target.path("endpoint").asText())),
          target.path("allowHttp").asBoolean());
      return List.of(target);
    }
    List<ObjectNode> targets =
        s.list("resource-target", null).stream()
            .filter(
                t ->
                    t.path("enabled").asBoolean()
                        && (t.path("protocol").asText("CUSTOM").equals("CUSTOM")
                            || t.path("protocol").asText().equals("CCMAX_NATIVE") && !eq(task, "type", "CCMAX_PRIORITY_ROTATION")))
            .toList();
    if (targets.isEmpty())
      throw new ApiException(503, "尚未配置并启用真实资源上游服务", "RESOURCE_UPSTREAM_NOT_CONFIGURED");
    for (ObjectNode t : targets)
      gateway.validateEndpoint(
          java.net.URI.create(t.path("baseUrl").asText(t.path("endpoint").asText())),
          t.path("allowHttp").asBoolean());
    return targets;
  }

  public boolean configured(ObjectNode task) {
    try {
      targets(task);
      if (eq(task, "type", "CCMAX_PRIORITY_ROTATION")) {
        ObjectNode settings = s.get("rotation-settings", text(task, "key"), null);
        validateSettings(settings.path("settings"));
      }
      return true;
    } catch (ApiException | IllegalArgumentException e) {
      return false;
    }
  }

  public static void validateSettings(JsonNode settings) {
    if (!settings.isObject()
        || !Set.of("ROTATION", "SUPPLIER_IDLE").contains(text(settings, "mode"))
        || !Set.of("SELECTED", "TIERS", "ALL").contains(text(settings, "scope"))
        || !settings.path("basisPoints").isIntegralNumber()
        || !settings.path("basisPoints").canConvertToInt()
        || settings.path("basisPoints").asInt() < 1
        || settings.path("basisPoints").asInt() > 10000
        || !settings.path("maxAccounts").isIntegralNumber()
        || !settings.path("maxAccounts").canConvertToInt()
        || settings.path("maxAccounts").asInt() < 1
        || settings.path("maxAccounts").asInt() > 50000
        || !settings.path("priority").isIntegralNumber()
        || !settings.path("priority").canConvertToInt()
        || settings.path("priority").asInt(-1) < 0
        || settings.path("priority").asInt() > 1000)
      throw new ApiException(400, "无效扶持范围、类型、比例、优先级或账号数量");
    String field = eq(settings, "scope", "SELECTED") ? "supplierIds" : "tiers";
    if (!eq(settings, "scope", "ALL")
        && (!settings.path(field).isArray()
            || settings.path(field).isEmpty()
            || settings.path(field).size() > 1000)) throw new ApiException(400, "请选择供应商或优先级档位");
    for (JsonNode tier : settings.path("tiers"))
      if (!Set.of("FALLBACK", "NORMAL", "PAYMENT_TERM", "PARTNER", "TEMPORARY")
          .contains(tier.asText())) throw new ApiException(400, "无效供应商优先级档位");
  }

  private List<ObjectNode> resources(ObjectNode target) {
    List<ObjectNode> allTargets =
        s.list("resource-target", null).stream()
            .filter(t -> t.path("enabled").asBoolean())
            .toList();
    String defaultId =
        allTargets.size() == 1
            ? text(allTargets.get(0), "id")
            : allTargets.stream()
                .filter(t -> t.path("defaultTarget").asBoolean())
                .map(t -> text(t, "id"))
                .reduce((a, b) -> "")
                .orElse("");
    return s.list("resource", null).stream()
        .filter(r -> eq(r, "resourceType", "CCMAX"))
        .filter(
            r ->
                r.path("enabled").asBoolean(true)
                    && !Set.of("REMOVED", "DELETED").contains(text(r, "state"))
                    && (!eq(r, "state", "DRAFT") || !text(r, "upstreamAccountId").isBlank())
                    && !eq(r, "operationalState", "GONE"))
        .filter(
            r ->
                text(target, "id")
                    .equals(
                        r.path("targetId").asText(r.path("upstreamTargetId").asText(defaultId))))
        .filter(
            r -> {
              try {
                ObjectNode owner = s.get("supplier", text(r, "supplierId"), null);
                return owner.path("enabled").asBoolean(true) && eq(owner, "state", "APPROVED");
              } catch (ApiException e) {
                return false;
              }
            })
        .toList();
  }

  private void success(ObjectNode response) {
    if (!eq(response, "state", "SUCCESS")
        || response.path("success").isBoolean() && !response.path("success").asBoolean()
        || response.has("errcode") && response.path("errcode").asInt(-1) != 0)
      throw new ApiException(502, "资源上游未确认执行成功", "RESOURCE_UPSTREAM_REJECTED");
  }

  private BigDecimal number(JsonNode node, String field) {
    try {
      BigDecimal value = new BigDecimal(text(node, field));
      if (value.signum() < 0
          || value.precision() > 30
          || value.scale() > 8
          || value.scale() < -30
          || value.precision() - value.scale() > 30) throw new NumberFormatException();
      return value;
    } catch (NumberFormatException e) {
      throw new ApiException(502, "上游金额或数量无效", "RESOURCE_UPSTREAM_INVALID_RESPONSE");
    }
  }

  private ObjectNode requested(JsonNode row, Map<String, ObjectNode> requested) {
    ObjectNode resource = requested.get(text(row, "resourceId"));
    if (resource == null || !eq(resource, "supplierId", text(row, "supplierId")))
      throw new ApiException(502, "上游返回未请求的资源或供应商归属不符", "RESOURCE_UPSTREAM_SCOPE_MISMATCH");
    return resource;
  }

  public ObjectNode sync(ObjectNode task, String runId) {
    int processed = 0;
    for (ObjectNode target : targets(task)) {
      List<ObjectNode> resources = resources(target);
      if (resources.isEmpty()) continue;
      Map<String, ObjectNode> requested = new LinkedHashMap<>();
      ObjectNode payload = s.object().put("runId", runId).put("targetId", text(target, "id"));
      ArrayNode ids = payload.putArray("resources");
      for (ObjectNode r : resources) {
        requested.put(text(r, "id"), r);
        ids.add(
            s.object()
                .put("resourceId", text(r, "id"))
                .put("supplierId", text(r, "supplierId"))
                .put("projectId", text(r, "projectId"))
                .put("laneId", text(r, "laneId")));
      }
      boolean daily = eq(task, "type", "CCMAX_DAILY_SYNC");
      payload.put(
          "businessDate", LocalDate.now(ZoneId.of("Asia/Shanghai")).minusDays(1).toString());
      ObjectNode response =
          gateway.exchange(
              target,
              "POST",
              "/jobs/ccmax/" + (daily ? "daily-sync" : "status-sync"),
              payload,
              "system-job:" + runId + ":" + text(target, "id"));
      success(response);
      JsonNode rows = response.path(daily ? "rows" : "resources");
      if (!rows.isArray() || rows.size() > 50000)
        throw new ApiException(502, "资源上游响应列表无效", "RESOURCE_UPSTREAM_INVALID_RESPONSE");
      List<ObjectNode> prepared = new ArrayList<>();
      Set<String> duplicate = new HashSet<>();
      for (JsonNode row : rows) {
        ObjectNode r = requested(row, requested);
        if (daily && !eq(row, "businessDate", text(payload, "businessDate")))
          throw new ApiException(502, "上游返回非本次采集日期的账单", "RESOURCE_UPSTREAM_SCOPE_MISMATCH");
        ObjectNode preparedRow = daily ? dailyRow(target, r, row) : statusRow(r, row);
        String key = daily ? text(preparedRow, "sourceRef") : text(r, "id");
        if (!duplicate.add(key))
          throw new ApiException(502, "上游响应包含重复记录", "RESOURCE_UPSTREAM_INVALID_RESPONSE");
        prepared.add(preparedRow);
      }
      // Validate the complete batch before writing any resource or financial observation.
      processed +=
          tx.execute(
              status -> {
                int count = 0;
                for (ObjectNode row : prepared) {
                  if (daily) {
                    if (persistDaily(row)) count++;
                  } else {
                    s.update("resource", text(row, "resourceId"), text(row, "supplierId"), row);
                    count++;
                  }
                }
                if (!daily) snapshotTotals(target, prepared);
                return count;
              });
    }
    return s.object()
        .put("processedCount", processed)
        .put("resultCode", "COLLECTED_FOLLOWUPS_QUEUED");
  }

  private ObjectNode statusRow(ObjectNode resource, JsonNode row) {
    String state = text(row, "operationalState");
    if (!Set.of("READY", "ACTIVE", "PAUSED", "DISABLED", "EXPIRED", "ERROR", "UNAVAILABLE")
        .contains(state))
      throw new ApiException(502, "上游资源状态无效", "RESOURCE_UPSTREAM_INVALID_RESPONSE");
    ObjectNode patch =
        s.object()
            .put("resourceId", text(resource, "id"))
            .put("supplierId", text(resource, "supplierId"))
            .put("operationalState", state)
            .put("statusSyncedAt", Instant.now().toString());
    if (row.has("priority")) {
      if (!row.path("priority").isIntegralNumber()
          || !row.path("priority").canConvertToInt()
          || row.path("priority").asInt(-1) < 0
          || row.path("priority").asInt() > 1000)
        throw new ApiException(502, "上游优先级无效", "RESOURCE_UPSTREAM_INVALID_RESPONSE");
      patch.set("priority", row.get("priority"));
      if (eq(resource, "upstreamProtocol", "CCMAX_NATIVE")) patch.set("upstreamPriority", row.get("priority"));
    }
    if (row.has("usage")) {
      JsonNode usage = row.path("usage");
      if (!Set.of("USD", "CNY", "USDT").contains(text(usage, "currency")))
        throw new ApiException(502, "上游费用币种无效", "RESOURCE_UPSTREAM_INVALID_RESPONSE");
      patch
          .putObject("usage")
          .put("amount", number(usage, "amount").toPlainString())
          .put("currency", text(usage, "currency"))
          .put("queriedAt", Instant.now().toString());
    }
    return patch;
  }

  private ObjectNode dailyRow(ObjectNode target, ObjectNode r, JsonNode row) {
    LocalDate day;
    try {
      day = LocalDate.parse(text(row, "businessDate"));
    } catch (DateTimeException e) {
      throw new ApiException(502, "上游账单日期无效", "RESOURCE_UPSTREAM_INVALID_RESPONSE");
    }
    if (day.isAfter(LocalDate.now(ZoneId.of("Asia/Shanghai")))
        || text(row, "model").length() > 160
        || !Set.of("USD", "CNY", "USDT").contains(text(row, "currency")))
      throw new ApiException(502, "上游账单日期、模型或币种无效", "RESOURCE_UPSTREAM_INVALID_RESPONSE");
    BigDecimal original = number(row, "originalAmount");
    List<ObjectNode> quotes =
        s.list("quote", text(r, "supplierId")).stream()
            .filter(
                q ->
                    eq(q, "state", "APPROVED")
                        && eq(q, "projectId", text(r, "projectId"))
                        && eq(q, "currency", text(row, "currency"))
                        && text(q, "effectiveFrom").compareTo(day.toString()) <= 0
                        && text(q, "effectiveTo").compareTo(day.toString()) >= 0)
            .toList();
    if (quotes.size() != 1)
      throw new ApiException(409, "同步账单没有唯一有效报价，请先核对报价", "JOB_QUOTE_AMBIGUOUS");
    ObjectNode quote = pricing.at(quotes.get(0), day);
    BigDecimal quantity = row.has("quantity") ? number(row, "quantity") : BigDecimal.ZERO;
    if (eq(quote, "pricingType", "FIXED")
        && (quantity.signum() <= 0 || quantity.stripTrailingZeros().scale() > 0))
      throw new ApiException(502, "买断账单须提供正整数数量", "RESOURCE_UPSTREAM_INVALID_RESPONSE");
    if (!Set.of("FIXED", "DISCOUNT").contains(text(quote, "pricingType")))
      throw new ApiException(409, "报价计价方式不支持自动采集", "JOB_QUOTE_INVALID");
    BigDecimal payable =
        eq(quote, "pricingType", "FIXED")
            ? quantity.multiply(number(quote, "unitPrice"))
            : original.multiply(number(quote, "multiplier"));
    String source =
        "CCMAX:"
            + text(target, "id")
            + ":"
            + text(r, "id")
            + ":"
            + day
            + ":"
            + text(row, "model")
            + ":"
            + text(row, "currency");
    ObjectNode out =
        s.object()
            .put("sourceRef", source)
            .put("sourceKind", "CCMAX_OBSERVATION")
            .put("targetId", text(target, "id"))
            .put("resourceId", text(r, "id"))
            .put("resourceType", "CCMAX")
            .put("resourceName", r.path("name").asText(text(r, "accountName")))
            .put("supplierId", text(r, "supplierId"))
            .put("supplierName", text(s.get("supplier", text(r, "supplierId"), null), "name"))
            .put("projectId", text(r, "projectId"))
            .put("projectName", text(r, "projectName"))
            .put("creatorId", text(r, "creatorId"))
            .put("creatorName", text(r, "creatorName"))
            .put("businessDate", day.toString())
            .put("periodStart", day.toString())
            .put("periodEnd", day.toString())
            .put("currency", text(row, "currency"))
            .put("model", text(row, "model"))
            .put("originalAmount", original.toPlainString())
            .put("consumption", original.toPlainString())
            .put("quantity", quantity.toPlainString())
            .put("calculatedPayable", payable.toPlainString())
            .put("payable", payable.toPlainString())
            .put("finalAmount", payable.toPlainString())
            .put("state", "PENDING")
            .put("reviewStatus", "PENDING")
            .put("createdBy", "SYSTEM_CCMAX_SYNC")
            .put("pricingType", text(quote, "pricingType"))
            .put("observedAt", Instant.now().toString());
    out.set("quoteSnapshot", quote);
    out.set("settlementMultiplier", quote.path("multiplier"));
    out.set("settlementUnitPrice", quote.path("unitPrice"));
    return out;
  }

  private boolean persistDaily(ObjectNode row) {
    String owner = text(row, "supplierId"), source = text(row, "sourceRef");
    s.jdbc.queryForObject(
        "select pg_advisory_xact_lock(hashtextextended(?,0))",
        Object.class,
        "ccmax-bill:" + source);
    ObjectNode existing =
        s.list("input", owner).stream()
            .filter(x -> eq(x, "sourceRef", source))
            .findFirst()
            .orElse(null);
    if (existing != null) {
      for (String field :
          List.of("originalAmount", "quantity", "currency", "periodStart", "periodEnd"))
        if (!eq(existing, field, text(row, field)))
          throw new ApiException(409, "已采集账单出现变更，请人工核对后导入更正", "JOB_BILL_SOURCE_CHANGED");
      return false;
    }
    String id = UUID.nameUUIDFromBytes(source.getBytes(StandardCharsets.UTF_8)).toString();
    s.create("input", owner, row.deepCopy().put("id", "input-" + id));
    s.create("bill", owner, row.deepCopy().put("id", "bill-" + id));
    return true;
  }

  private void snapshotTotals(ObjectNode target, List<ObjectNode> rows) {
    Map<String, BigDecimal> totals = new TreeMap<>();
    Map<String, Integer> counts = new HashMap<>();
    for (ObjectNode r : rows)
      if (r.has("usage")) {
        String key = text(r, "supplierId") + ":" + text(r.path("usage"), "currency");
        totals.merge(key, number(r.path("usage"), "amount"), BigDecimal::add);
        counts.merge(key, 1, Integer::sum);
      }
    totals.forEach(
        (key, total) -> {
          int split = key.lastIndexOf(':');
          String owner = key.substring(0, split), currency = key.substring(split + 1);
          long expected =
              resources(target).stream().filter(r -> eq(r, "supplierId", owner)).count();
          if (counts.get(key) == expected)
            s.create(
                "supplier-usage-snapshot",
                owner,
                s.object()
                    .put("targetId", text(target, "id"))
                    .put("supplierId", owner)
                    .put("currency", currency)
                    .put("amount", total.toPlainString())
                    .put("resourceCount", expected)
                    .put("observedAt", Instant.now().toString()));
        });
  }

  private boolean idle(ObjectNode target, String owner) {
    List<ObjectNode> history =
        s.list("supplier-usage-snapshot", owner).stream()
            .filter(x -> eq(x, "targetId", text(target, "id")))
            .sorted(Comparator.comparing((ObjectNode x) -> text(x, "observedAt")).reversed())
            .limit(2)
            .toList();
    return history.size() == 2
        && eq(history.get(0), "currency", text(history.get(1), "currency"))
        && history.get(0).path("resourceCount").asInt()
            == history.get(1).path("resourceCount").asInt()
        && number(history.get(0), "amount").compareTo(number(history.get(1), "amount")) == 0;
  }

  public ObjectNode rotate(ObjectNode task, String runId) {
    String key = text(task, "key");
    ObjectNode config = s.get("rotation-settings", key, null);
    JsonNode settings = config.path("settings");
    validateSettings(settings);
    ObjectNode restored = restore(key, false);
    if (restored.path("failed").asInt() > 0)
      throw new ApiException(502, "上一轮优先级恢复失败，已暂停继续扶持", "PRIORITY_RESTORE_FAILED");
    if (eq(settings, "mode", "SUPPLIER_IDLE"))
      sync(task.deepCopy().put("type", "CCMAX_STATUS_SYNC"), runId + ":idle");
    int boosted = 0;
    for (ObjectNode target : targets(task)) {
      Map<String, List<ObjectNode>> byOwner = new TreeMap<>();
      for (ObjectNode r : resources(target)) {
        if (!Set.of("READY", "ACTIVE").contains(text(r, "operationalState"))) continue;
        String owner = text(r, "supplierId");
        ObjectNode supplier = s.get("supplier", owner, null);
        if (eq(settings, "scope", "SELECTED") && !contains(settings.path("supplierIds"), owner)
            || eq(settings, "scope", "TIERS")
                && !contains(
                    settings.path("tiers"),
                    supplier.path("priorityTier").asText(supplier.path("tier").asText()))) continue;
        if (eq(settings, "mode", "SUPPLIER_IDLE") && !idle(target, owner)) continue;
        byOwner.computeIfAbsent(owner, ignored -> new ArrayList<>()).add(r);
      }
      for (var entry : byOwner.entrySet()) {
        String owner = entry.getKey();
        // A resource cannot be boosted by overlapping tasks while its original-priority snapshot is
        // active.
        if (s.list("priority-round", null).stream()
            .anyMatch(
                r ->
                    !eq(r, "taskKey", key)
                        && eq(r, "supplierId", owner)
                        && !Set.of("CLOSED", "REPLACED").contains(text(r, "state")))) continue;
        List<ObjectNode> eligible = entry.getValue();
        eligible.sort(
            Comparator.comparing((ObjectNode r) -> text(r, "lastPriorityBoostAt"))
                .thenComparing(r -> text(r, "id")));
        int count =
            Math.min(
                settings.path("maxAccounts").asInt(),
                Math.max(
                    1, (eligible.size() * settings.path("basisPoints").asInt() + 9999) / 10000));
        List<ObjectNode> selected = eligible.subList(0, count);
        if (s.get("rotation-settings", key, null).path("version").asLong()
            != config.path("version").asLong())
          return s.object()
              .put("processedCount", boosted)
              .put("resultCode", "PRIORITY_SUPPORT_CONFIG_CHANGED");
        ObjectNode read = s.object().put("supplierId", owner);
        ArrayNode resourceIds = read.putArray("resourceIds");
        selected.forEach(r -> resourceIds.add(text(r, "id")));
        ObjectNode remote =
            gateway.exchange(
                target,
                "POST",
                "/jobs/ccmax/priority/read",
                read,
                "priority-read:" + runId + ":" + owner);
        success(remote);
        Map<String, ObjectNode> requested = new HashMap<>();
        selected.forEach(r -> requested.put(text(r, "id"), r));
        ArrayNode items = s.json.createArrayNode();
        Set<String> seen = new HashSet<>();
        if (!remote.path("priorities").isArray())
          throw new ApiException(502, "上游未返回原始优先级快照", "RESOURCE_UPSTREAM_INVALID_RESPONSE");
        for (JsonNode item : remote.path("priorities")) {
          ObjectNode r = requested(item, requested);
          int priority = item.path("priority").asInt(-1);
          if (!seen.add(text(r, "id"))
              || !item.path("priority").isIntegralNumber()
              || !item.path("priority").canConvertToInt()
              || priority < 0
              || priority > 1000)
            throw new ApiException(502, "原始优先级快照无效", "RESOURCE_UPSTREAM_INVALID_RESPONSE");
          items.add(
              s.object()
                  .put("resourceId", text(r, "id"))
                  .put("supplierId", owner)
                  .put("originalPriority", priority)
                  .put("priority", settings.path("priority").asInt())
                  .put("boostState", "PENDING")
                  .put("restored", false));
        }
        if (seen.size() != selected.size())
          throw new ApiException(502, "原始优先级快照不完整", "RESOURCE_UPSTREAM_INVALID_RESPONSE");
        ObjectNode roundData =
            s.object()
                .put("taskKey", key)
                .put("runId", runId)
                .put("supplierId", owner)
                .put("supplierName", text(s.get("supplier", owner, null), "name"))
                .put("targetId", text(target, "id"))
                .put("state", "BOOSTING")
                .put("settingsVersion", config.path("version").asLong());
        roundData.set("items", items);
        ObjectNode round = tx.execute(status -> s.create("priority-round", owner, roundData));
        for (int index = 0; index < items.size(); index++) {
          ObjectNode item = (ObjectNode) items.get(index);
          try {
            writePriority(
                target,
                item,
                item.path("priority").asInt(),
                "priority:" + text(round, "id") + ":boost:" + text(item, "resourceId"));
            item.put("boostState", "SUCCESS");
            tx.execute(
                status ->
                    s.update(
                        "resource",
                        text(item, "resourceId"),
                        owner,
                        s.object()
                            .put("priority", item.path("priority").asInt())
                            .put("lastPriorityBoostAt", Instant.now().toString())));
            boosted++;
          } catch (RuntimeException error) {
            item.put("boostState", "FAILED")
                .put(
                    "errorCode",
                    error instanceof ApiException a
                        ? Objects.toString(a.code, "PRIORITY_BOOST_FAILED")
                        : "PRIORITY_BOOST_FAILED");
          }
          saveRound(round, items, "BOOSTING");
        }
        boolean failed = items.findValuesAsText("boostState").stream().anyMatch("FAILED"::equals);
        saveRound(round, items, failed ? "RESTORE_FAILED" : "ACTIVE");
        if (failed) throw new ApiException(502, "部分扶持结果未确认，已暂停并保留恢复快照", "PRIORITY_BOOST_FAILED");
      }
    }
    return s.object()
        .put("processedCount", boosted)
        .put("resultCode", "PRIORITY_SUPPORT_EVALUATED");
  }

  private boolean contains(JsonNode array, String value) {
    for (JsonNode item : array) if (item.asText().equals(value)) return true;
    return false;
  }

  private void writePriority(ObjectNode target, ObjectNode item, int priority, String key) {
    String path =
        "/resources/"
            + URLEncoder.encode(text(item, "resourceId"), StandardCharsets.UTF_8)
            + "/priority";
    ObjectNode result =
        gateway.exchange(
            target,
            "POST",
            path,
            s.object()
                .put("supplierId", text(item, "supplierId"))
                .put("resourceId", text(item, "resourceId"))
                .put("priority", priority),
            key);
    success(result);
    if (!eq(result, "resourceId", text(item, "resourceId"))
        || !eq(result, "supplierId", text(item, "supplierId"))
        || !result.path("priority").isIntegralNumber()
        || !result.path("priority").canConvertToInt()
        || result.path("priority").asInt(-1) != priority)
      throw new ApiException(502, "上游未确认指定账号优先级", "RESOURCE_UPSTREAM_INVALID_RESPONSE");
  }

  private void saveRound(ObjectNode round, ArrayNode items, String state) {
    long good = items.findValuesAsText("boostState").stream().filter("SUCCESS"::equals).count();
    long restored = 0;
    for (JsonNode item : items) if (item.path("restored").asBoolean()) restored++;
    ObjectNode patch = s.object().put("state", state);
    patch.set("items", items.deepCopy());
    patch
        .putObject("boost")
        .put("total", items.size())
        .put("succeeded", good)
        .put("failed", items.size() - good);
    patch
        .putObject("restore")
        .put("total", items.size())
        .put("succeeded", restored)
        .put("failed", items.size() - restored);
    tx.execute(status -> s.update("priority-round", text(round, "id"), null, patch));
  }

  public ObjectNode restore(String key, boolean retryOnly) {
    int restored = 0, failed = 0;
    for (ObjectNode round : s.list("priority-round", null)) {
      if (!eq(round, "taskKey", key)
          || Set.of("CLOSED", "REPLACED").contains(text(round, "state"))
          || retryOnly
              && !Set.of("RESTORE_FAILED", "RESTORING", "BOOSTING").contains(text(round, "state")))
        continue;
      ArrayNode items = (ArrayNode) round.path("items").deepCopy();
      saveRound(round, items, "RESTORING");
      ObjectNode target;
      try {
        target = gateway.requireConfigured(text(round, "targetId"));
      } catch (ApiException e) {
        saveRound(round, items, "RESTORE_FAILED");
        failed += items.size();
        continue;
      }
      for (JsonNode node : items) {
        ObjectNode item = (ObjectNode) node;
        if (item.path("restored").asBoolean()) continue;
        try {
          ObjectNode resource =
              s.get("resource", text(item, "resourceId"), text(round, "supplierId"));
          if (!eq(resource, "supplierId", text(round, "supplierId")))
            throw new ApiException(409, "资源归属已变化");
          writePriority(
              target,
              item,
              item.path("originalPriority").asInt(),
              "priority:" + text(round, "id") + ":restore:" + text(item, "resourceId"));
          item.put("restored", true).put("restoredAt", Instant.now().toString());
          tx.execute(
              status ->
                  s.update(
                      "resource",
                      text(item, "resourceId"),
                      text(round, "supplierId"),
                      s.object().put("priority", item.path("originalPriority").asInt())));
          restored++;
        } catch (RuntimeException error) {
          item.put(
              "restoreErrorCode",
              error instanceof ApiException a
                  ? Objects.toString(a.code, "PRIORITY_RESTORE_FAILED")
                  : "PRIORITY_RESTORE_FAILED");
          failed++;
        }
        saveRound(round, items, "RESTORING");
      }
      boolean complete = true;
      for (JsonNode item : items) if (!item.path("restored").asBoolean()) complete = false;
      saveRound(round, items, complete ? "CLOSED" : "RESTORE_FAILED");
    }
    return s.object().put("restored", restored).put("failed", failed);
  }
}
