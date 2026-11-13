package com.hispread.ai;

import static com.hispread.ai.BusinessSupport.*;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import java.util.*;

/** Verify all frozen mappings before the first mutation or reconciliation read. */
final class LifecycleBindings {
  private LifecycleBindings() {}

  static void validate(Store store, ObjectNode config, JsonNode request) {
    if (!request.has("expectedBindings")) return; // Legacy jobs did not retain a binding snapshot.
    JsonNode bindings = request.path("expectedBindings");
    if (!bindings.isArray() || bindings.size() != request.path("items").size()) throw changed();
    Map<String, JsonNode> expected = new HashMap<>();
    for (JsonNode binding : bindings)
      if (expected.putIfAbsent(text(binding, "resourceId"), binding) != null) throw changed();
    for (JsonNode item : request.path("items")) {
      String id = text(item, "resourceId");
      JsonNode binding = expected.remove(id);
      if (binding == null || !eq(binding, "targetId", text(config, "id"))) throw changed();
      ObjectNode local = store.get("resource", id, null);
      String mapping = eq(config, "protocol", "CCMAX_NATIVE") ? "upstreamAccountId" : "upstreamChannelId";
      String upstream = local.path(mapping).asText(local.path("laneId").asText());
      if (!eq(local, "targetId", text(config, "id")) || !upstream.equals(text(binding, "upstreamId"))) throw changed();
    }
    if (!expected.isEmpty()) throw changed();
  }

  static String frozenId(JsonNode request, String localId, String legacyId) {
    if (!request.has("expectedBindings")) return legacyId;
    for (JsonNode binding : request.path("expectedBindings"))
      if (eq(binding, "resourceId", localId)) return text(binding, "upstreamId");
    throw changed();
  }

  private static ApiException changed() {
    return new ApiException(409, "资源关联已变化，请核对原账号", "RESOURCE_MAPPING_CHANGED");
  }
}
