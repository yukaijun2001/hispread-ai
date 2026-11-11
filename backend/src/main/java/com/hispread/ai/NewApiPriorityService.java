package com.hispread.ai;

import static com.hispread.ai.BusinessSupport.*;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.node.*;
import jakarta.servlet.http.HttpServletRequest;
import java.time.Instant;
import java.util.*;
import org.springframework.stereotype.Service;

@Service
public class NewApiPriorityService {
  private final Store store;
  private final BusinessSupport business;
  private final ResourceIntegrationGateway gateway;

  public NewApiPriorityService(Store store, BusinessSupport business, ResourceIntegrationGateway gateway) {
    this.store = store; this.business = business; this.gateway = gateway;
  }

  ObjectNode preview(ObjectNode body, HttpServletRequest req) {
    String targetId = text(body, "targetId");
    if (targetId.isBlank()) {
      String first = body.path("resourceIds").path(0).asText(body.path("items").path(0).path("resourceId").asText());
      if (!first.isBlank()) targetId = text(business.resource(first, req), "targetId");
    }
    ObjectNode config = gateway.requireConfigured(targetId);
    String protocol = text(config, "protocol");
    if (!Set.of("NEWAPI", "CCMAX_NATIVE").contains(protocol)) return null;
    String mappingField = protocol.equals("CCMAX_NATIVE") ? "upstreamAccountId" : "upstreamChannelId";
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
      if (!lanes.isEmpty() && !lanes.contains(text(resource, mappingField))) continue;
      if (!suppliers.isEmpty() && !suppliers.contains(text(resource, "supplierId"))) continue;
      if (body.path("filters").isObject() && !matches(resource, body.path("filters"))) continue;
      if (ids.isEmpty() && !eq(resource, "targetId", text(config, "id"))) continue;
      if (ids.isEmpty() && text(resource, mappingField).isBlank()) continue;
      if (!text(body, "operationalStatus").isBlank() && !eq(resource, "operationalState", text(body, "operationalStatus"))) continue;
      if (!eq(resource, "targetId", text(config, "id"))) throw new ApiException(409, "一批操作仅支持同一上游目标");
      String mapped = text(resource, mappingField);
      if (!(protocol.equals("NEWAPI") ? mapped.matches("[1-9][0-9]{0,17}") : mapped.matches("[A-Za-z0-9_-]{1,100}")) || eq(resource, "operationalState", "GONE"))
        throw new ApiException(409, "请先关联有效上游账号或渠道");
      if (selected.stream().anyMatch(other -> eq(other, mappingField, mapped)))
        throw new ApiException(409, "同一渠道存在重复关联，请先核对本地记录");
      selected.add(resource);
    }
    if (!ids.isEmpty() && selected.size() != ids.size()) throw new ApiException(409, "选择范围已变化，请刷新后重新选择");
    if (!lanes.isEmpty() && selected.stream().map(row -> text(row, mappingField)).distinct().count() != lanes.size())
      throw new ApiException(409, "部分Lane ID未关联至所选目标");
    if (selected.isEmpty() || selected.size() > 100) throw new ApiException(400, "每批请选择1至100个已关联渠道");
    ObjectNode request = store.object().put("priority", body.path("priority").asInt());
    ArrayNode items = request.putArray("items");
    for (ObjectNode resource : selected) items.addObject().put("resourceId", text(resource, "id"))
        .put("resourceName", text(resource, "name")).put("laneId", text(resource, mappingField))
        .put("resourceVersion", resource.path("version").asLong()).put("priority", body.path("priority").asInt()).put("state", "PENDING");
    ObjectNode op = store.object().put("type", "PRIORITY").put("protocol", protocol).put("supplierId", "GLOBAL")
        .put("targetId", text(config, "id")).put("requestKey", key).put("state", "PREVIEW").put("total", selected.size());
    op.set("request", request); op.set("priorityInput", fingerprint); op.set("items", items);
    ObjectNode result = request.deepCopy().put("state", "PREVIEW"); result.putObject("counts").put("PENDING", selected.size());
    op.set("result", result);
    return view(store.create("resource-operation", "GLOBAL", op));
  }

  ObjectNode action(ObjectNode op, String action, HttpServletRequest req) {
    if (!Set.of("start", "retry", "reconcile").contains(action)) throw new ApiException(400, "不支持的优先级操作");
    String id = text(op, "id");
    store.jdbc.queryForObject("select pg_advisory_xact_lock(hashtext(?),hashtext(?))", (rs, row) -> true, "newapi-priority-job", id);
    op = store.get("resource-operation", id, "GLOBAL");
    if (action.equals("start") && !eq(op, "state", "PREVIEW")) return view(op);
    if (action.equals("retry") && eq(op, "state", "PREVIEW")) throw new ApiException(409, "请先确认执行任务");
    if (action.equals("reconcile") && eq(op, "state", "PREVIEW")) return view(op);
    ObjectNode config = gateway.requireConfigured(text(op, "targetId"));
    if (!eq(config, "protocol", text(op, "protocol"))) throw new ApiException(409, "目标协议已变化");
    String mappingField = eq(config, "protocol", "CCMAX_NATIVE") ? "upstreamAccountId" : "upstreamChannelId";
    ObjectNode request = ((ObjectNode) op.path("request")).deepCopy();
    ArrayNode items = store.json.createArrayNode();
    for (JsonNode item : request.path("items")) {
      ObjectNode resource = business.resource(text(item, "resourceId"), req);
      if (eq(resource, "operationalState", "GONE"))
        throw new ApiException(409, "渠道已移除，不可再操作", "RESOURCE_CHANNEL_REMOVED");
      if (!eq(resource, "targetId", text(config, "id")) || !eq(resource, mappingField, text(item, "laneId")))
        throw new ApiException(409, "渠道关联已变化，请重新建立任务");
      if (action.equals("start") && item.path("resourceVersion").asLong() != resource.path("version").asLong()) throw new ApiException(409, "资源版本已变化，请重新建立任务");
      if (action.equals("retry")) {
        boolean failed = false;
        for (JsonNode old : op.path("result").path("items")) if (eq(old, "resourceId", text(item, "resourceId")) && eq(old, "state", "FAILED")) failed = true;
        if (!failed) continue;
      }
      items.add(item);
    }
    if (items.isEmpty()) return view(op);
    request.set("items", items);
    ObjectNode result;
    try {
      result = gateway.exchange(config, action.equals("reconcile") ? "GET" : "POST", action.equals("reconcile") ? "/priority-batch/reconcile" : "/priority-batch", request, text(op, "requestKey"));
    } catch (ApiException error) {
      result = request.deepCopy().put("state", "UNKNOWN");
      for (JsonNode item : result.path("items")) ((ObjectNode) item).put("state", "UNKNOWN").put("errorCode", error.code);
    }
    Map<String, JsonNode> changed = new LinkedHashMap<>();
    for (JsonNode item : result.path("items")) changed.put(text(item, "resourceId"), item);
    ArrayNode merged = store.json.createArrayNode();
    int failed = 0, unknown = 0, success = 0;
    for (JsonNode item : op.path("request").path("items")) {
      JsonNode previous = item;
      for (JsonNode old : op.path("result").path("items")) if (eq(old, "resourceId", text(item, "resourceId"))) previous = old;
      ObjectNode finalItem = ((ObjectNode) item).deepCopy();
      finalItem.setAll((ObjectNode) changed.getOrDefault(text(item, "resourceId"), previous));
      merged.add(finalItem);
      if (eq(finalItem, "state", "SUCCESS")) {
        success++;
        if (changed.containsKey(text(item, "resourceId")))
          business.update("resource", text(item, "resourceId"), req, store.object().put("upstreamPriority", request.path("priority").asInt()));
      } else if (eq(finalItem, "state", "FAILED")) failed++; else unknown++;
    }
    result.set("items", merged);
    result.putObject("counts").put("SUCCESS", success).put("FAILED", failed).put("UNKNOWN", unknown);
    result.put("state", unknown > 0 ? "UNKNOWN" : failed == merged.size() ? "FAILED" : failed > 0 ? "PARTIAL_FAILED" : "COMPLETED");
    ObjectNode patch = store.object().put("state", text(result, "state")).put("finishedAt", Instant.now().toString());
    patch.set("result", result);
    return view(store.update("resource-operation", id, "GLOBAL", patch));
  }

  ObjectNode view(ObjectNode op) {
    ObjectNode out = store.object().put("id", text(op, "id")).put("state", text(op, "state")).put("protocol", text(op, "protocol"))
        .put("total", op.path("total").asInt()).put("createdAt", text(op, "createdAt"));
    out.set("items", op.path("result").path("items")); out.set("counts", op.path("result").path("counts"));
    return out;
  }

  private Set<String> strings(JsonNode values) {
    Set<String> result = new LinkedHashSet<>();
    if (values.isArray()) for (JsonNode value : values) { if (value.asText().isBlank()) throw new ApiException(400, "范围ID不能为空"); result.add(value.asText()); }
    return result;
  }

  private boolean matches(ObjectNode row, JsonNode filters) {
    Map<String, String> fields = Map.of("state", "state", "projectId", "projectId", "credentialMode", "credentialMode", "supplierSearch", "supplierId", "creatorSearch", "createdBy", "operationalStatus", "operationalState");
    for (var field : fields.entrySet()) if (!text(filters, field.getKey()).isBlank() && !eq(row, field.getValue(), text(filters, field.getKey()))) return false;
    if (!business.contains(row, text(filters, "search"), "name", "accountName", "laneId")) return false;
    if (!business.contains(row, text(filters, "accountSearch"), "accountName")) return false;
    if (!text(filters, "failureReason").isBlank()) throw new ApiException(400, "New API优先级不支持按CCMAX失效原因筛选");
    String created = datePart(row, "createdAt");
    return (text(filters, "createdFrom").isBlank() || created.compareTo(text(filters, "createdFrom")) >= 0)
        && (text(filters, "createdTo").isBlank() || created.compareTo(text(filters, "createdTo")) <= 0);
  }
}
