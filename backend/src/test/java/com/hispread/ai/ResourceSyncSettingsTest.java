package com.hispread.ai;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;
import java.util.*;
import java.util.concurrent.*;
import java.util.concurrent.atomic.AtomicInteger;
import org.junit.jupiter.api.Test;

class ResourceSyncSettingsTest {
  final ObjectMapper json = new ObjectMapper();

  ResourceSyncSettings settings(int perTarget, int global) {
    Store store = mock(Store.class);
    when(store.object()).thenAnswer(call -> json.createObjectNode());
    when(store.get(eq("resource-target"), anyString(), isNull()))
        .thenAnswer(
            call -> {
              ObjectNode target = json.createObjectNode().put("id", (String) call.getArgument(1));
              target.putObject("syncSettings").put("perTargetConcurrency", perTarget);
              return target;
            });
    when(store.list("resource-sync-settings", "GLOBAL"))
        .thenReturn(
            List.of(json.createObjectNode().put("globalConcurrency", global).put("version", 1)));
    return new ResourceSyncSettings(store);
  }

  @Test
  void enforcesGlobalAndPerTargetLimitsAndReleasesAfterFailure() throws Exception {
    for (boolean sharedTarget : List.of(true, false)) {
      ResourceSyncSettings settings = settings(sharedTarget ? 1 : 3, sharedTarget ? 3 : 1);
      ExecutorService executor = Executors.newFixedThreadPool(2);
      CountDownLatch firstStarted = new CountDownLatch(1),
          releaseFirst = new CountDownLatch(1),
          secondAttempted = new CountDownLatch(1),
          secondStarted = new CountDownLatch(1);
      AtomicInteger active = new AtomicInteger(), peak = new AtomicInteger();
      try {
        Future<Integer> first =
            executor.submit(
                () ->
                    settings.withPermit(
                        "first",
                        3000,
                        () -> {
                          peak.accumulateAndGet(active.incrementAndGet(), Math::max);
                          firstStarted.countDown();
                          try {
                            if (!releaseFirst.await(2, TimeUnit.SECONDS))
                              throw new AssertionError("first not released");
                          } catch (InterruptedException interrupted) {
                            Thread.currentThread().interrupt();
                            throw new AssertionError(interrupted);
                          } finally {
                            active.decrementAndGet();
                          }
                          return 1;
                        }));
        assertTrue(firstStarted.await(1, TimeUnit.SECONDS));
        Future<Integer> second =
            executor.submit(
                () -> {
                  secondAttempted.countDown();
                  return settings.withPermit(
                      sharedTarget ? "first" : "second",
                      3000,
                      () -> {
                        peak.accumulateAndGet(active.incrementAndGet(), Math::max);
                        secondStarted.countDown();
                        active.decrementAndGet();
                        return 2;
                      });
                });
        assertTrue(secondAttempted.await(1, TimeUnit.SECONDS));
        assertFalse(secondStarted.await(150, TimeUnit.MILLISECONDS));
        releaseFirst.countDown();
        assertEquals(1, first.get(2, TimeUnit.SECONDS));
        assertEquals(2, second.get(2, TimeUnit.SECONDS));
        assertEquals(1, peak.get());
        assertThrows(
            IllegalStateException.class,
            () ->
                settings.withPermit(
                    "first",
                    1000,
                    () -> {
                      throw new IllegalStateException("fixture failure");
                    }));
        assertEquals(3, settings.withPermit("first", 1000, () -> 3));
      } finally {
        releaseFirst.countDown();
        executor.shutdownNow();
      }
    }
  }
}
