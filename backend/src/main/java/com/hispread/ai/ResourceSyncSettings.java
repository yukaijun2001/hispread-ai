package com.hispread.ai;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import java.util.*;
import java.util.function.Supplier;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class ResourceSyncSettings {
  private static final String GLOBAL_ID = "GLOBAL";
  private final Store store;
  private final Object permits = new Object();
  private final Map<String, Integer> targetInFlight = new HashMap<>();
  private int globalInFlight;

  public ResourceSyncSettings(Store store) {
    this.store = store;
  }

  private ObjectNode global() {
    List<ObjectNode> settings = store.list("resource-sync-settings", "GLOBAL");
    if (!settings.isEmpty()) return settings.get(0);
    int concurrency = 4;
    for (ObjectNode target : store.list("resource-target", null)) {
      JsonNode value = target.path("syncSettings").path("globalConcurrency");
      if (validInteger(value, 1, 64)) {
        concurrency = value.asInt();
        break;
      }
    }
    return store.object().put("globalConcurrency", concurrency).put("version", 0);
  }

  public ObjectNode read(String id) {
    ObjectNode target = store.get("resource-target", id, null);
    JsonNode local = target.path("syncSettings").path("perTargetConcurrency");
    int perTarget = validInteger(local, 1, 32) ? local.asInt() : 2;
    ObjectNode global = global();
    int total = global.path("globalConcurrency").asInt(4);
    return store
        .object()
        .put("perTargetConcurrency", perTarget)
        .put("globalConcurrency", total)
        .put("effectiveConcurrency", Math.min(perTarget, total))
        .put("targetVersion", target.path("version").asLong())
        .put("globalVersion", global.path("version").asLong());
  }

  @Transactional
  public ObjectNode save(String id, ObjectNode input) {
    if (!validInteger(input.path("perTargetConcurrency"), 1, 32))
      throw new ApiException(400, "该目标并发批次需为1至32的整数");
    if (!validInteger(input.path("globalConcurrency"), 1, 64))
      throw new ApiException(400, "全局并发批次需为1至64的整数");
    for (String field : List.of("targetVersion", "globalVersion"))
      if (!input.path(field).isIntegralNumber()
          || !input.path(field).canConvertToLong()
          || input.path(field).asLong() < 0) throw new ApiException(400, "请提供有效的目标和全局配置版本");
    store.jdbc.queryForObject(
        "select pg_advisory_xact_lock(hashtextextended('resource-sync-settings',0))", Object.class);
    ObjectNode current = read(id);
    if (input.path("targetVersion").asLong() != current.path("targetVersion").asLong()
        || input.path("globalVersion").asLong() != current.path("globalVersion").asLong())
      throw new ApiException(409, "并发配置已变化，请重新读取后保存");
    ObjectNode patch = store.object().put("version", current.path("targetVersion").asLong());
    patch
        .putObject("syncSettings")
        .put("perTargetConcurrency", input.path("perTargetConcurrency").asInt());
    store.update("resource-target", id, null, patch);
    List<ObjectNode> global = store.list("resource-sync-settings", "GLOBAL");
    if (global.isEmpty()) {
      store.create(
          "resource-sync-settings",
          "GLOBAL",
          store
              .object()
              .put("id", GLOBAL_ID)
              .put("globalConcurrency", input.path("globalConcurrency").asInt()));
      store.update(
          "resource-sync-settings",
          GLOBAL_ID,
          "GLOBAL",
          store
              .object()
              .put("version", 0)
              .put("globalConcurrency", input.path("globalConcurrency").asInt()));
    } else if (input.path("globalConcurrency").asInt()
        != current.path("globalConcurrency").asInt()) {
      store.update(
          "resource-sync-settings",
          GLOBAL_ID,
          "GLOBAL",
          store
              .object()
              .put("version", current.path("globalVersion").asLong())
              .put("globalConcurrency", input.path("globalConcurrency").asInt()));
    }
    return read(id);
  }

  private boolean validInteger(JsonNode value, int minimum, int maximum) {
    return value.isIntegralNumber()
        && value.canConvertToInt()
        && value.asInt() >= minimum
        && value.asInt() <= maximum;
  }

  public <T> T withPermit(String targetId, int timeoutMs, Supplier<T> operation) {
    long deadline = System.nanoTime() + Math.max(1000, Math.min(120000, timeoutMs)) * 1000000L;
    synchronized (permits) {
      while (true) {
        ObjectNode settings = read(targetId);
        if (globalInFlight < settings.path("globalConcurrency").asInt()
            && targetInFlight.getOrDefault(targetId, 0)
                < settings.path("perTargetConcurrency").asInt()) {
          globalInFlight++;
          targetInFlight.merge(targetId, 1, Integer::sum);
          break;
        }
        long remaining = (deadline - System.nanoTime()) / 1000000L;
        if (remaining <= 0) throw new ApiException(503, "同步并发已满，请稍后重试", "RESOURCE_SYNC_BUSY");
        try {
          permits.wait(Math.min(remaining, 100));
        } catch (InterruptedException interrupted) {
          Thread.currentThread().interrupt();
          throw new ApiException(503, "同步请求已中断", "RESOURCE_UPSTREAM_INTERRUPTED");
        }
      }
    }
    try {
      return operation.get();
    } finally {
      synchronized (permits) {
        globalInFlight--;
        targetInFlight.compute(
            targetId, (id, count) -> count == null || count <= 1 ? null : count - 1);
        permits.notifyAll();
      }
    }
  }
}
