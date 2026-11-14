package com.hispread.ai;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

import java.util.*;
import java.util.concurrent.*;
import java.util.concurrent.atomic.AtomicInteger;
import org.junit.jupiter.api.Test;

class ResourceSyncSettingsTest {
  @Test
  void managedLimitsBoundEachTargetAndAllTargetsAndReleaseAfterFailure() throws Exception {
    for (boolean sharedTarget : List.of(true, false)) {
      ResourceSyncSettings settings = new ResourceSyncSettings(mock(Store.class));
      int limit = sharedTarget ? 2 : 4;
      ExecutorService executor = Executors.newFixedThreadPool(limit + 1);
      CountDownLatch started = new CountDownLatch(limit), release = new CountDownLatch(1), extraStarted = new CountDownLatch(1);
      AtomicInteger active = new AtomicInteger(), peak = new AtomicInteger();
      List<Future<Integer>> pending = new ArrayList<>();
      try {
        for (int i = 0; i < limit; i++) {
          String target = sharedTarget ? "shared" : "target-" + i;
          pending.add(executor.submit(() -> settings.withPermit(target, 3000, () -> {
            peak.accumulateAndGet(active.incrementAndGet(), Math::max); started.countDown();
            try { assertTrue(release.await(2, TimeUnit.SECONDS)); }
            catch (InterruptedException e) { Thread.currentThread().interrupt(); throw new AssertionError(e); }
            finally { active.decrementAndGet(); }
            return 1;
          })));
        }
        assertTrue(started.await(1, TimeUnit.SECONDS));
        Future<Integer> extra = executor.submit(() -> settings.withPermit(sharedTarget ? "shared" : "extra", 3000, () -> {
          extraStarted.countDown(); return 2;
        }));
        assertFalse(extraStarted.await(150, TimeUnit.MILLISECONDS));
        release.countDown();
        for (Future<Integer> item : pending) assertEquals(1, item.get(2, TimeUnit.SECONDS));
        assertEquals(2, extra.get(2, TimeUnit.SECONDS)); assertEquals(limit, peak.get());
        assertThrows(IllegalStateException.class, () -> settings.withPermit("shared", 1000, () -> { throw new IllegalStateException("fixture"); }));
        assertEquals(3, settings.withPermit("shared", 1000, () -> 3));
      } finally { release.countDown(); executor.shutdownNow(); }
    }
  }
}
