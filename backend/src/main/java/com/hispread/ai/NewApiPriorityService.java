package com.hispread.ai;

import static com.hispread.ai.BusinessSupport.*;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.node.*;
import jakarta.servlet.http.HttpServletRequest;
import java.sql.*;
import java.time.Instant;
import java.util.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.support.TransactionTemplate;

@Service
public class NewApiPriorityService {
  private final Store store;
  private final BusinessSupport business;
  private final ResourceIntegrationGateway gateway;
  private final TransactionTemplate transactions;

  public NewApiPriorityService(Store store, BusinessSupport business, ResourceIntegrationGateway gateway,
      PlatformTransactionManager transactionManager) {
    this.store = store; this.business = business; this.gateway = gateway;
    this.transactions = new TransactionTemplate(transactionManager);
  }

  ObjectNode preview(ObjectNode body, HttpServletRequest req) {
    ObjectNode config = previewTarget(body, req);
    String protocol = text(config, "protocol");
    if (!Set.of("NEWAPI", "CCMAX_NATIVE").contains(protocol)) return null;
    String key = text(body, "requestKey");
    if (key.isBlank()) key = UUID.randomUUID().toString();
    store.jdbc.queryForObject("select pg_advisory_xact_lock(hashtext(?),hashtext(?))", (rs, row) -> true, "newapi-priority", key);
    ObjectNode fingerprint = body.deepCopy(); fingerprint.remove("requestKey");
    for (ObjectNode prior : store.list("resource-operation", "GLOBAL")) {
      if (eq(prior, "type", "PRIORITY") && eq(prior, "protocol", protocol) && eq(prior, "requestKey", key)) {
        if (!prior.path("priorityInput").equals(fingerprint)) throw new ApiException(409, "提交编号已用于不同资料");
        return view(prior);
      }
    }
    Set<String> ids = strings(body.path("resourceIds")), lanes = strings(body.path("laneIds")), suppliers = strings(body.path("supplierIds"));
    if (body.path("items").isArray()) for (JsonNode item : body.path("items")) ids.add(text(item, "resourceId"));
    int scopes = (ids.isEmpty() ? 0 : 1) + (lanes.isEmpty() ? 0 : 1) + (suppliers.isEmpty() ? 0 : 1) + (body.path("filters").isObject() ? 1 : 0);
    if (scopes != 1) throw new ApiException(400, "请选择一种优先级调整范围");
    List<ObjectNode> selected = new ArrayList<>();
    for (ObjectNode resource : business.scopedResources(req)) {
      if (!ids.isEmpty() && !ids.contains(text(resource, "id"))) continue;
      if (!lanes.isEmpty() && !lanes.contains(mapped(resource, protocol))) continue;
      if (!suppliers.isEmpty() && !suppliers.contains(text(resource, "supplierId"))) continue;
      if (body.path("filters").isObject() && !matches(resource, body.path("filters"), protocol)) continue;
      if (ids.isEmpty() && mapped(resource, protocol).isBlank()) continue;
      if (!ResourceTelemetry.matches(resource, text(body, "operationalStatus"))) continue;
      if (!eq(resource, "targetId", text(config, "id"))) {
        if (!ids.isEmpty() || !lanes.isEmpty()) throw new ApiException(409, "所选账号或Lane ID不属于指定上游目标");
        continue;
      }
      if (resource.path("readOnly").asBoolean()
          || Set.of("GONE", "DRAINING", "REMOVED", "DELETED").contains(ResourceTelemetry.state(resource))) {
        if (!ids.isEmpty()) throw new ApiException(409, "所选账号已移除、退出中或不可调整");
        continue;
      }
      String mappedId = mapped(resource, protocol);
      if (!(protocol.equals("NEWAPI") ? mappedId.matches("[1-9][0-9]{0,17}") : mappedId.matches("[A-Za-z0-9_-]{1,100}"))) {
        if (!ids.isEmpty() || !lanes.isEmpty()) throw new ApiException(409, "请先关联有效上游账号或渠道");
        continue;
      }
      if (selected.stream().anyMatch(other -> mapped(other, protocol).equals(mappedId)))
        throw new ApiException(409, "同一渠道存在重复关联，请先核对本地记录");
      selected.add(resource);
    }
    if (!ids.isEmpty() && selected.size() != ids.size()) throw new ApiException(409, "选择范围已变化，请刷新后重新选择");
    if (!lanes.isEmpty() && selected.stream().map(row -> mapped(row, protocol)).distinct().count() != lanes.size())
      throw new ApiException(409, "部分Lane ID未关联至所选目标");
    if (selected.isEmpty() || selected.size() > 100) throw new ApiException(400, "每批请选择1至100个已关联渠道");
    ObjectNode request = store.object().put("priority", body.path("priority").asInt());
    ArrayNode items = request.putArray("items");
    for (ObjectNode resource : selected) items.addObject().put("resourceId", text(resource, "id"))
        .put("resourceName", text(resource, "name")).put("laneId", mapped(resource, protocol))
        .put("resourceVersion", resource.path("version").asLong()).put("priority", body.path("priority").asInt()).put("state", "PENDING");
    ObjectNode op = store.object().put("type", "PRIORITY").put("protocol", protocol).put("supplierId", "GLOBAL")
        .put("targetId", text(config, "id")).put("requestKey", key).put("state", "PREVIEW")
        .put("writeIntentVersion", 1).put("total", selected.size());
    op.set("request", request); op.set("priorityInput", fingerprint); op.set("items", items);
    ObjectNode result = request.deepCopy().put("state", "PREVIEW"); result.putObject("counts").put("PENDING", selected.size());
    op.set("result", result);
    return view(store.create("resource-operation", "GLOBAL", op));
  }

  private ObjectNode previewTarget(ObjectNode body, HttpServletRequest req) {
    String targetId = text(body, "targetId");
    if (!targetId.isBlank()) return gateway.requireConfigured(targetId);
    String first = body.path("resourceIds").path(0).asText(body.path("items").path(0).path("resourceId").asText());
    if (!first.isBlank()) return gateway.requireConfigured(text(business.resource(first, req), "targetId"));
    Set<String> lanes = strings(body.path("laneIds"));
    if (!lanes.isEmpty()) {
      Set<String> targets = new LinkedHashSet<>();
      for (ObjectNode resource : business.scopedResources(req)) {
        String lane = text(resource, "upstreamProtocol").equals("NEWAPI") || !text(resource, "upstreamChannelId").isBlank()
            ? mapped(resource, "NEWAPI") : mapped(resource, "CCMAX_NATIVE");
        if (lanes.contains(lane) && !text(resource, "targetId").isBlank()) targets.add(text(resource, "targetId"));
      }
      if (targets.size() > 1) throw new ApiException(409, "Lane ID涉及多个上游目标，请指定一个目标", "RESOURCE_TARGET_AMBIGUOUS");
      if (targets.size() == 1) return gateway.requireConfigured(targets.iterator().next());
    }
    try {
      // Supplier/filter controls describe CCMAX accounts; an unrelated NEWAPI default must
      // not capture them. NEWAPI-only installations retain their channel compatibility.
      return gateway.requireCcmaxConfigured(null);
    } catch (ApiException unavailable) {
      if (!Set.of("RESOURCE_OPERATION_UNSUPPORTED", "RESOURCE_UPSTREAM_NOT_CONFIGURED")
          .contains(Objects.toString(unavailable.code, ""))) throw unavailable;
      return gateway.requireConfigured(null);
    }
  }

  ObjectNode action(ObjectNode op, String action, HttpServletRequest req) {
    if (!Set.of("start", "retry", "reconcile").contains(action)) throw new ApiException(400, "不支持的优先级操作");
    String id = text(op, "id");
    // A session lock spans the committed intent, remote call and committed result. A process
    // crash releases the lock but cannot roll a potentially accepted write back to PREVIEW.
    try (Connection lock = Objects.requireNonNull(store.jdbc.getDataSource()).getConnection()) {
      try (PreparedStatement query = lock.prepareStatement("select pg_try_advisory_lock(hashtext(?),hashtext(?))")) {
        query.setString(1, "newapi-priority-job"); query.setString(2, id);
        try (ResultSet result = query.executeQuery()) {
          result.next();
          if (!result.getBoolean(1))
            throw new ApiException(409, "原优先级任务正在执行，请稍后查询结果", "RESOURCE_JOB_ALREADY_RUNNING");
        }
      }
      try {
        Attempt attempt = transactions.execute(status -> prepare(id, action, req));
        if (attempt.request() == null) return view(attempt.operation());
        ObjectNode result;
        try {
          result = gateway.exchange(attempt.config(), action.equals("reconcile") ? "GET" : "POST",
              action.equals("reconcile") ? "/priority-batch/reconcile" : "/priority-batch",
              attempt.request(), text(attempt.operation(), "requestKey"));
        } catch (ApiException error) {
          result = attempt.request().deepCopy().put("state", "UNKNOWN");
          for (JsonNode item : result.path("items"))
            ((ObjectNode) item).put("state", "UNKNOWN").put("errorCode", error.code);
        }
        ObjectNode reply = result;
        return transactions.execute(status -> complete(attempt, reply, req));
      } finally {
        try (PreparedStatement query = lock.prepareStatement("select pg_advisory_unlock(hashtext(?),hashtext(?))")) {
          query.setString(1, "newapi-priority-job"); query.setString(2, id); query.execute();
        }
      }
    } catch (SQLException error) {
      throw new ApiException(503, "优先级任务执行锁暂不可用", "RESOURCE_JOB_LOCK_UNAVAILABLE");
    }
  }

  private record Attempt(ObjectNode operation, ObjectNode config, ObjectNode request) {}

  private Attempt prepare(String id, String action, HttpServletRequest req) {
    ObjectNode op = store.get("resource-operation", id, "GLOBAL");
    if (eq(op, "state", "PREVIEW") && op.path("writeIntentVersion").asInt() != 1) {
      // A PREVIEW left by the old single-transaction writer may already have reached upstream.
      // There is no evidence to distinguish that case from a never-started legacy preview.
      ObjectNode pending = op.path("result").deepCopy();
      for (JsonNode item : pending.path("items"))
        ((ObjectNode) item).put("state", "UNKNOWN").put("errorCode", "RESOURCE_LEGACY_PREVIEW_UNCERTAIN")
            .put("errorMessage", "旧任务缺少持久化执行标记，请先核对原操作；未再次发送更新");
      summarize(pending);
      ObjectNode patch = store.object().put("state", "UNKNOWN");
      patch.set("result", pending);
      op = store.update("resource-operation", id, "GLOBAL", patch);
    }
    if (action.equals("start") && !eq(op, "state", "PREVIEW")) return new Attempt(op, null, null);
    if (action.equals("retry") && eq(op, "state", "PREVIEW")) throw new ApiException(409, "请先确认执行任务");
    if (action.equals("reconcile") && eq(op, "state", "PREVIEW")) return new Attempt(op, null, null);
    ObjectNode config = gateway.requireConfigured(text(op, "targetId"));
    if (!eq(config, "protocol", text(op, "protocol"))) throw new ApiException(409, "目标协议已变化");
    ObjectNode request = ((ObjectNode) op.path("request")).deepCopy();
    ArrayNode items = store.json.createArrayNode();
    for (JsonNode item : request.path("items")) {
      ObjectNode resource = business.resource(text(item, "resourceId"), req);
      if (Set.of("GONE", "DRAINING", "REMOVED", "DELETED").contains(ResourceTelemetry.state(resource)))
        throw new ApiException(409, "账号或渠道已移除或退出中，不可再操作", "RESOURCE_CHANNEL_REMOVED");
      if (!eq(resource, "targetId", text(config, "id"))
          || !mapped(resource, text(config, "protocol")).equals(text(item, "laneId")))
        throw new ApiException(409, "渠道关联已变化，请重新建立任务");
      if (action.equals("start") && item.path("resourceVersion").asLong() != resource.path("version").asLong()) throw new ApiException(409, "资源版本已变化，请重新建立任务");
      if (action.equals("retry")) {
        boolean failed = false;
        for (JsonNode old : op.path("result").path("items")) if (eq(old, "resourceId", text(item, "resourceId")) && eq(old, "state", "FAILED")) failed = true;
        if (!failed) continue;
      }
      items.add(item);
    }
    if (items.isEmpty()) return new Attempt(op, null, null);
    request.set("items", items);
    if (!action.equals("reconcile")) {
      ObjectNode pending = op.path("result").deepCopy();
      Set<String> claimed = new HashSet<>();
      for (JsonNode item : items) claimed.add(text(item, "resourceId"));
      for (JsonNode item : pending.path("items")) {
        if (!claimed.contains(text(item, "resourceId"))) continue;
        ObjectNode row = (ObjectNode) item;
        row.remove(List.of("errorCode", "errorMessage"));
        row.put("state", "UNKNOWN");
      }
      summarize(pending);
      ObjectNode patch = store.object().put("state", text(pending, "state"))
          .put("startedAt", Instant.now().toString()).putNull("finishedAt");
      patch.set("result", pending);
      op = store.update("resource-operation", id, "GLOBAL", patch);
    }
    return new Attempt(op, config, request);
  }

  private ObjectNode complete(Attempt attempt, ObjectNode result, HttpServletRequest req) {
    ObjectNode op = store.get("resource-operation", text(attempt.operation(), "id"), "GLOBAL");
    ObjectNode config = attempt.config(), request = attempt.request();
    Map<String, JsonNode> changed = new LinkedHashMap<>();
    for (JsonNode item : result.path("items")) changed.put(text(item, "resourceId"), item);
    ArrayNode merged = store.json.createArrayNode();
    for (JsonNode item : op.path("request").path("items")) {
      JsonNode previous = item;
      for (JsonNode old : op.path("result").path("items")) if (eq(old, "resourceId", text(item, "resourceId"))) previous = old;
      ObjectNode finalItem = ((ObjectNode) item).deepCopy();
      finalItem.setAll((ObjectNode) changed.getOrDefault(text(item, "resourceId"), previous));
      merged.add(finalItem);
      if (eq(finalItem, "state", "SUCCESS") && changed.containsKey(text(item, "resourceId"))) {
        ObjectNode resource = business.resource(text(item, "resourceId"), req);
        if (!eq(resource, "targetId", text(config, "id"))
            || !mapped(resource, text(config, "protocol")).equals(text(item, "laneId"))
            || Set.of("GONE", "DRAINING", "REMOVED", "DELETED").contains(ResourceTelemetry.state(resource)))
          finalItem.put("state", "UNKNOWN").put("errorCode", "RESOURCE_MAPPING_CHANGED")
              .put("errorMessage", "执行期间资源关联已变化，请核对原账号");
        else business.update("resource", text(item, "resourceId"), req,
            store.object().put("upstreamPriority", request.path("priority").asInt()));
      }
    }
    result.set("items", merged);
    summarize(result);
    ObjectNode patch = store.object().put("state", text(result, "state")).put("finishedAt", Instant.now().toString());
    patch.set("result", result);
    return view(store.update("resource-operation", text(op, "id"), "GLOBAL", patch));
  }

  private void summarize(ObjectNode result) {
    int failed = 0, unknown = 0, success = 0;
    for (JsonNode item : result.path("items")) {
      if (eq(item, "state", "SUCCESS")) success++;
      else if (eq(item, "state", "FAILED")) failed++;
      else unknown++;
    }
    result.putObject("counts").put("SUCCESS", success).put("FAILED", failed).put("UNKNOWN", unknown);
    result.put("state", unknown > 0 ? "UNKNOWN" : success == 0 ? "FAILED" : failed > 0 ? "PARTIAL_FAILED" : "COMPLETED");
  }

  ObjectNode view(ObjectNode op) {
    ObjectNode out = store.object().put("id", text(op, "id")).put("state", text(op, "state")).put("protocol", text(op, "protocol"))
        .put("total", op.path("total").asInt()).put("createdAt", text(op, "createdAt"));
    JsonNode items = op.path("result").path("items"), counts = op.path("result").path("counts");
    if (items.isArray()) out.set("items", items); else out.putArray("items");
    if (counts.isObject()) out.set("counts", counts); else out.putObject("counts");
    return out;
  }

  private Set<String> strings(JsonNode values) {
    Set<String> result = new LinkedHashSet<>();
    if (values.isArray()) for (JsonNode value : values) { if (value.asText().isBlank()) throw new ApiException(400, "范围ID不能为空"); result.add(value.asText()); }
    return result;
  }

  private boolean matches(ObjectNode row, JsonNode filters, String protocol) {
    Map<String, String> fields = Map.of("state", "state", "projectId", "projectId", "credentialMode", "credentialMode", "supplierSearch", "supplierId", "creatorSearch", "createdBy");
    for (var field : fields.entrySet()) if (!text(filters, field.getKey()).isBlank() && !eq(row, field.getValue(), text(filters, field.getKey()))) return false;
    if (!ResourceTelemetry.matches(row, text(filters, "operationalStatus"))) return false;
    if (!business.contains(row, text(filters, "search"), "name", "accountName", "laneId")) return false;
    if (!business.contains(row, text(filters, "accountSearch"), "accountName")) return false;
    if (!text(filters, "failureReason").isBlank()) {
      if (!protocol.equals("CCMAX_NATIVE")) throw new ApiException(400, "New API优先级不支持按CCMAX失效原因筛选");
      String reason = text(row, "dispatchFailureReason");
      if (reason.isBlank()) reason = text(row.path("resourceData").path("health"), "credentialFailureReason");
      if (!reason.equals(text(filters, "failureReason"))) return false;
    }
    String created = datePart(row, "createdAt");
    return (text(filters, "createdFrom").isBlank() || created.compareTo(text(filters, "createdFrom")) >= 0)
        && (text(filters, "createdTo").isBlank() || created.compareTo(text(filters, "createdTo")) <= 0);
  }

  private String mapped(ObjectNode resource, String protocol) {
    String id = text(resource, protocol.equals("CCMAX_NATIVE") ? "upstreamAccountId" : "upstreamChannelId");
    return id.isBlank() ? text(resource, "laneId") : id;
  }
}
