package com.hispread.ai;

import com.fasterxml.jackson.databind.node.ObjectNode;
import java.util.*;
import java.util.function.Supplier;
import org.springframework.stereotype.Service;

@Service
public class ResourceSyncSettings {
  private final Store store;
  private final Object permits = new Object();
  private final Map<String, Integer> targetInFlight = new HashMap<>();
  private int globalInFlight;

  public ResourceSyncSettings(Store store) {
    this.store = store;
  }

  public ObjectNode read(String id) {
    ObjectNode target = store.get("resource-target", id, null);
    // Internal safety limits are deliberately independent of historical tuning values.
    return store.object().put("perTargetConcurrency", 2).put("globalConcurrency", 4)
        .put("effectiveConcurrency", 2).put("targetVersion", target.path("version").asLong())
        .put("globalVersion", 0).put("managed", true);
  }

  public <T> T withPermit(String targetId, int timeoutMs, Supplier<T> operation) {
    long deadline = System.nanoTime() + Math.max(1000, Math.min(120000, timeoutMs)) * 1000000L;
    synchronized (permits) {
      while (true) {
        if (globalInFlight < 4 && targetInFlight.getOrDefault(targetId, 0) < 2) {
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
