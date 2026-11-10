package com.hispread.ai;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.node.*;
import java.time.Instant;
import java.util.*;

/** Explicit adapter for New API's published administrator channel API. Not a CCMAX OAuth API. */
final class NewApiResourceAdapter {
  @FunctionalInterface interface Transport {
    ObjectNode send(ObjectNode config, String method, String path, JsonNode body, String key);
  }
  private final Store store;
  private final Transport transport;
  NewApiResourceAdapter(Store store, Transport transport) { this.store = store; this.transport = transport; }

  ObjectNode exchange(ObjectNode config, String method, String path, JsonNode body, String key) {
    if (!config.path("newApiUserId").asText().matches("[1-9][0-9]{0,18}") || config.path("apiKey").asText().isBlank())
      throw new ApiException(503, "New API需要管理员令牌和用户ID", "RESOURCE_UPSTREAM_NOT_CONFIGURED");
    ObjectNode target = config.deepCopy().put("upstreamPathPrefix", "/api").put("authType", "BEARER");
    if (path.equals("/health")) {
      ObjectNode remote = send(target, "GET", "/channel/?p=1&page_size=1", null, key);
      return store.object().put("state", "READY").put("protocol", "NEWAPI")
          .put("readOnly", true).put("total", remote.path("data").path("total").asInt());
    }
    if (path.equals("/resource-lifecycle-jobs")) return lifecycle(target, body, key, false);
    if (path.equals("/resource-lifecycle-jobs/reconcile")) return lifecycle(target, body, key, true);
    String[] pieces = path.split("/");
    if (pieces.length != 4 || !pieces[1].equals("resources")) throw unsupported();
    String action = pieces[3];
    if (!Set.of("usage", "say-hi", "priority", "channel-bind").contains(action)) throw unsupported();
    if (action.equals("channel-bind")) {
      String id = body == null ? "" : body.path("channelId").asText();
      if (!id.matches("[1-9][0-9]{0,17}")) throw new ApiException(400, "New API渠道ID无效");
      ObjectNode reply = send(target, "GET", "/channel/" + id, null, key);
      if (reply.path("data").path("id").asLong() != Long.parseLong(id) || !validStatus(reply.path("data").path("status"))) throw invalid();
      return store.object().put("state", "UPDATED").put("laneId", id).put("upstreamChannelId", id)
          .put("operationalState", reply.path("data").path("status").asInt() == 1 ? "ACTIVE" : "PAUSED");
    }
    ObjectNode resource = store.get("resource", pieces[2], null);
    long channel = channel(resource);
    if (action.equals("usage")) {
      ObjectNode reply = send(target, "GET", "/channel/" + channel, null, key);
      JsonNode data = reply.path("data");
      if (!data.isObject() || data.path("id").asLong() != channel || !validStatus(data.path("status")))
        throw invalid();
      ObjectNode result = store.object().put("state", "UPDATED");
      ObjectNode usage = result.putObject("usage").put("queriedAt", Instant.now().toString()).put("unit", "NEWAPI_QUOTA");
      for (String field : List.of("used_quota", "balance", "balance_updated_time", "response_time"))
        if (data.has(field)) {
          if (!data.path(field).isNumber() || data.path(field).decimalValue().signum() < 0
              || data.path(field).decimalValue().precision() > 32 || data.path(field).decimalValue().scale() > 12
              || data.path(field).decimalValue().scale() < -12) throw invalid();
          usage.set(field, data.get(field));
        }
      result.put("operationalState", data.path("status").asInt() == 1 ? "ACTIVE" : "PAUSED");
      return result;
    }
    if (action.equals("say-hi")) {
      ObjectNode reply = send(target, "GET", "/channel/test/" + channel, null, key);
      ObjectNode result = store.object().put("state", "SUCCESS").put("ok", true);
      if (reply.path("time").isNumber()) result.set("time", reply.get("time"));
      return result;
    }
    if (action.equals("priority")) {
      if (body == null || !body.path("priority").isIntegralNumber() || !body.path("priority").canConvertToInt()
          || body.path("priority").asInt() < 0 || body.path("priority").asInt() > 1000)
        throw new ApiException(400, "优先级须在0至1000之间");
      send(target, "PUT", "/channel/", store.object().put("id", channel).set("priority", body.path("priority")), key);
      return store.object().put("state", "UPDATED").set("priority", body.path("priority"));
    }
    throw unsupported();
  }

  private ObjectNode lifecycle(ObjectNode config, JsonNode body, String key, boolean readOnly) {
    if (body == null || !body.path("items").isArray() || body.path("items").isEmpty()
        || body.path("items").size() > 100 || !Set.of("PAUSE", "RESUME", "REMOVE").contains(body.path("action").asText()))
      throw new ApiException(400, "New API生命周期请求无效");
    // Resolve every mapping before sending the first mutation.
    Map<String, Long> channels = new LinkedHashMap<>();
    for (JsonNode item : body.path("items")) {
      String id = item.path("resourceId").asText();
      if (channels.putIfAbsent(id, channel(store.get("resource", id, null))) != null)
        throw new ApiException(400, "资源不能重复");
    }
    ObjectNode result = store.object();
    ArrayNode items = result.putArray("items");
    String action = body.path("action").asText();
    int failed = 0, unknown = 0;
    for (var entry : channels.entrySet()) {
      ObjectNode item = items.addObject().put("resourceId", entry.getKey());
      try {
        long id = entry.getValue();
        if (readOnly) {
          ObjectNode observed = send(config, "GET", "/channel/" + id, null, key);
          JsonNode data = observed.path("data");
          if (data.path("id").asLong() != id || !validStatus(data.path("status"))) throw invalid();
          boolean confirmed = action.equals("PAUSE") ? data.path("status").asInt() == 2
              : action.equals("RESUME") && data.path("status").asInt() == 1;
          if (!confirmed) { unknown++; item.put("state", "UNKNOWN"); continue; }
        } else if (action.equals("REMOVE")) send(config, "DELETE", "/channel/" + id, null, key);
        else send(config, "PUT", "/channel/", store.object().put("id", id).put("status", action.equals("PAUSE") ? 2 : 1), key);
        item.put("state", action.equals("PAUSE") ? "PAUSED" : action.equals("RESUME") ? "RESUMED" : "GONE");
      } catch (ApiException e) {
        boolean uncertain = e.status >= 500 || e.status == 408;
        if (uncertain) unknown++; else failed++;
        item.put("state", uncertain ? "UNKNOWN" : "FAILED").put("errorCode", e.code);
      }
    }
    return result.put("state", unknown > 0 ? "UNKNOWN" : failed == channels.size() ? "FAILED" : failed > 0 ? "PARTIAL" : "COMPLETED")
        .put("completedCount", channels.size() - failed - unknown).put("failedCount", failed).put("unknownCount", unknown);
  }

  private long channel(ObjectNode resource) {
    String id = resource.path("upstreamChannelId").asText(resource.path("laneId").asText());
    if (!id.matches("[1-9][0-9]{0,17}"))
      throw new ApiException(409, "资源尚未关联真实New API渠道ID", "RESOURCE_CHANNEL_NOT_MAPPED");
    return Long.parseLong(id);
  }

  private ObjectNode send(ObjectNode config, String method, String path, JsonNode body, String key) {
    ObjectNode response = transport.send(config, method, path, body, key);
    if (!response.path("success").isBoolean()) throw invalid();
    if (!response.path("success").asBoolean())
      throw new ApiException(422, "New API拒绝此操作", "RESOURCE_PROVIDER_REJECTED");
    return response;
  }

  private static boolean validStatus(JsonNode status) {
    return status.isIntegralNumber() && status.canConvertToInt() && Set.of(1, 2, 3).contains(status.asInt());
  }

  private static ApiException unsupported() {
    return new ApiException(503, "New API公开协议不支持此CCMAX操作，请使用已实现该操作的CUSTOM适配器", "RESOURCE_OPERATION_UNSUPPORTED");
  }
  private static ApiException invalid() {
    return new ApiException(502, "New API响应格式无效", "RESOURCE_UPSTREAM_INVALID_RESPONSE");
  }
}
