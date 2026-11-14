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
  private final TransactionTemplate tx;

  public BackgroundResourceJobService(
      Store s,
      ResourceIntegrationGateway gateway,
      PlatformTransactionManager manager) {
    this.s = s;
    this.gateway = gateway;
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
      return true;
    } catch (ApiException | IllegalArgumentException e) {
      return false;
    }
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
                !r.path("deleted").asBoolean() && r.path("enabled").asBoolean(true)
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

  public ObjectNode syncNativeTarget(String targetId) {
    ObjectNode target = gateway.requireConfigured(targetId);
    if (!eq(target, "protocol", "CCMAX_NATIVE"))
      throw new ApiException(400, "请选择CCMAX原生目标");
    ObjectNode result = sync(s.object().put("type", "CCMAX_STATUS_SYNC").put("targetId", targetId), UUID.randomUUID().toString());
    ArrayNode rows = result.putArray("resources");
    for (ObjectNode resource : resources(target)) {
      ObjectNode row = s.object().put("resourceId", text(resource, "id")).put("supplierId", text(resource, "supplierId"))
          .put("operationalState", text(resource, "operationalState"));
      for (String field : List.of("usage", "resourceData", "dailyConsumption"))
        if (resource.has(field)) row.set(field, resource.get(field));
      if (resource.has("upstreamPriority")) row.set("priority", resource.get("upstreamPriority"));
      rows.add(row);
    }
    return result.put("state", "SUCCESS");
  }

  public ObjectNode sync(ObjectNode task, String runId) {
    TaskScope.requireSupported(text(task, "type"));
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
      payload.put(
          "businessDate", LocalDate.now(ZoneId.of("Asia/Shanghai")).minusDays(1).toString());
      if (task.path("deliveryStatusOnly").asBoolean()) payload.put("deliveryStatusOnly", true);
      ObjectNode response =
          gateway.exchange(
              target,
              "POST",
              "/jobs/ccmax/status-sync",
              payload,
              "system-job:" + runId + ":" + text(target, "id"));
      success(response);
      JsonNode rows = response.path("resources");
      if (!rows.isArray() || rows.size() > 50000)
        throw new ApiException(502, "资源上游响应列表无效", "RESOURCE_UPSTREAM_INVALID_RESPONSE");
      List<ObjectNode> prepared = new ArrayList<>();
      Set<String> duplicate = new HashSet<>();
      for (JsonNode row : rows) {
        ObjectNode r = requested(row, requested);
        JsonNode statusObservation = row;
        if (task.path("deliveryStatusOnly").asBoolean()) {
          // Unrelated cost/weight fields are neither validated nor persisted by status-only jobs.
          ObjectNode copy = ((ObjectNode) row).deepCopy();
          copy.remove(List.of("usage", "dailyConsumption", "priority"));
          statusObservation = copy;
        }
        ObjectNode preparedRow = statusRow(r, statusObservation);
        if (task.path("deliveryStatusOnly").asBoolean()) {
          preparedRow.remove(List.of("usage", "dailyConsumption", "priority", "upstreamPriority"));
          if (preparedRow.path("resourceData").isObject()) {
            ObjectNode healthOnly = s.object();
            if (preparedRow.path("resourceData").has("health"))
              healthOnly.set("health", preparedRow.path("resourceData").path("health"));
            // Preserve previously collected data while only refreshing account health.
            ObjectNode merged = r.path("resourceData").isObject()
                ? ((ObjectNode) r.path("resourceData")).deepCopy() : s.object();
            merged.setAll(healthOnly);
            preparedRow.set("resourceData", merged);
          }
        }
        String key = text(r, "id");
        if (!duplicate.add(key))
          throw new ApiException(502, "上游响应包含重复记录", "RESOURCE_UPSTREAM_INVALID_RESPONSE");
        prepared.add(preparedRow);
      }
      // Validate the complete batch before writing any resource or financial observation.
      processed +=
          tx.execute(
              status -> {
                for (ObjectNode original : requested.values().stream()
                      .sorted(Comparator.comparing(resource -> text(resource, "id"))).toList()) {
                    s.jdbc.queryForObject("select version from hub_entity where kind='resource' and id=? and owner_id=? for update",
                        Long.class, text(original, "id"), text(original, "supplierId"));
                    ObjectNode current = s.get("resource", text(original, "id"), text(original, "supplierId"));
                    if (current.path("version").asLong() != original.path("version").asLong()
                        || !eq(current, "targetId", text(original, "targetId"))
                        || !eq(current, "upstreamAccountId", text(original, "upstreamAccountId")))
                      throw new ApiException(409, "同步期间资源已变化，请重新同步", "RESOURCE_SYNC_RESOURCE_CHANGED");
                  }
                int count = 0;
                for (ObjectNode row : prepared) {
                  s.update("resource", text(row, "resourceId"), text(row, "supplierId"), row);
                  count++;
                }
                return count;
              });
    }
    return s.object()
        .put("processedCount", processed)
        .put("resultCode", "DELIVERY_STATUS_SYNCED");
  }

  private ObjectNode statusRow(ObjectNode resource, JsonNode row) {
    String state = text(row, "operationalState");
    if (!Set.of("READY", "ACTIVE", "PAUSED", "DISABLED", "EXPIRED", "ERROR", "UNAVAILABLE", "INVALID")
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
    // Only the provider-owned native adapter produces these allowlisted runtime snapshots.
    if (eq(resource, "upstreamProtocol", "CCMAX_NATIVE")) {
      patch.put("laneState", state);
      if (row.path("resourceData").isObject()) patch.set("resourceData", row.path("resourceData"));
      if (row.path("dailyConsumption").isObject()) patch.set("dailyConsumption", row.path("dailyConsumption"));
    }
    return patch;
  }

  /** Compatibility guard for archived automation. New boosts are never started. */
  public ObjectNode rotate(ObjectNode task, String runId) {
    throw TaskScope.retired();
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
