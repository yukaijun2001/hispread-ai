package com.hispread.ai;

import static com.hispread.ai.BusinessSupport.*;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.node.ObjectNode;

/** Credential refresh must keep the account captured by its committed write intent. */
final class NativeMaintenanceBinding {
  private NativeMaintenanceBinding() {}

  static void validate(ObjectNode config, ObjectNode resource, JsonNode binding) {
    if (binding.isMissingNode()) return; // Historical receipts predate mapping snapshots.
    String account = resource.path("upstreamAccountId").asText(resource.path("laneId").asText());
    if (!binding.isObject() || !text(binding, "accountId").matches("[A-Za-z0-9_-]{1,100}")
        || !eq(config, "id", text(binding, "targetId"))
        || !eq(resource, "targetId", text(binding, "targetId"))
        || !account.equals(text(binding, "accountId")))
      throw new ApiException(409, "资源关联已变化，请核对原账号", "RESOURCE_MAPPING_CHANGED");
  }
}
