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

  ObjectNode action(ObjectNode op, String action, HttpServletRequest req) {
    if (!action.equals("reconcile")) throw UpstreamScope.retired();
    String id = text(op, "id");
    // Reuse the old job lock so concurrent readback cannot overwrite another reconciliation.
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
        Attempt attempt = transactions.execute(status -> prepare(id, req));
        if (attempt.request() == null) return view(attempt.operation());
        ObjectNode result;
        try {
          result = gateway.exchange(attempt.config(), "GET", "/priority-batch/reconcile",
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

  private Attempt prepare(String id, HttpServletRequest req) {
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
    if (eq(op, "state", "PREVIEW") || eq(op, "state", "COMPLETED")) return new Attempt(op, null, null);
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
        throw new ApiException(409, "渠道关联已变化，请在上游核对原账号");
      items.add(item);
    }
    if (items.isEmpty()) return new Attempt(op, null, null);
    request.set("items", items);
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

  private String mapped(ObjectNode resource, String protocol) {
    String id = text(resource, protocol.equals("CCMAX_NATIVE") ? "upstreamAccountId" : "upstreamChannelId");
    return id.isBlank() ? text(resource, "laneId") : id;
  }
}
