package com.hispread.ai;

import static org.junit.jupiter.api.Assertions.*;

import com.fasterxml.jackson.databind.node.*;
import java.time.*;
import java.util.*;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.transaction.annotation.Transactional;

@SpringBootTest
@Transactional
class ExplicitJobConfigurationTest {
  @Autowired Store s;
  @Autowired SystemJobService jobs;

  @Test
  void nameOnlyUpdatePreservesTargetAndSchedule() {
    String key = "target-" + UUID.randomUUID();
    s.create("scheduled-task", "GLOBAL", s.object().put("id", key).put("key", key)
        .put("type", "CCMAX_STATUS_SYNC").put("enabled", false)
        .put("intervalMinutes", 12).put("targetId", "selected-target"));
    ObjectNode updated = jobs.update(key, s.object().put("version", 0).put("name", "Renamed"));
    assertEquals("selected-target", updated.path("targetId").asText());
    assertEquals(12, updated.path("intervalMinutes").asInt());
    assertFalse(updated.path("enabled").asBoolean());
  }

  @Test
  void taskConfigurationRejectsCoercedTypesWithoutChangingItsSchedule() {
    String key = "typed-schedule-" + UUID.randomUUID();
    ObjectNode original = s.create("scheduled-task", "GLOBAL", s.object().put("id", key)
        .put("key", key).put("type", "CCMAX_STATUS_SYNC").put("enabled", false)
        .put("intervalMinutes", 10));
    for (ObjectNode invalid : List.of(
        s.object().put("intervalMinutes", 10.5),
        s.object().put("intervalMinutes", "10"),
        s.object().put("intervalMinutes", true),
        s.object().putNull("intervalMinutes"),
        s.object().put("intervalMinutes", 4294967306L),
        s.object().put("enabled", "false"),
        s.object().put("enabled", "true"),
        s.object().put("enabled", 1),
        s.object().putNull("enabled"))) {
      invalid.put("version", 0);
      assertEquals(400, assertThrows(ApiException.class, () -> jobs.update(key, invalid),
          invalid.toString()).status);
      assertEquals(original, s.get("scheduled-task", key, null), invalid.toString());
    }
    for (ObjectNode invalidVersion : List.of(
        s.object().put("version", "0"), s.object().put("version", 0.5),
        s.object().putNull("version"))) {
      invalidVersion.put("name", "Must not be saved");
      assertEquals(409, assertThrows(ApiException.class,
          () -> jobs.update(key, invalidVersion)).status);
      assertEquals(original, s.get("scheduled-task", key, null));
    }
    ObjectNode saved = jobs.update(key, s.object().put("version", 0)
        .put("intervalMinutes", 1440).put("enabled", false));
    assertEquals(1440, saved.path("intervalMinutes").asInt());
    assertFalse(saved.path("enabled").asBoolean());
    assertTrue(saved.path("nextRunAt").isNull());
  }
}
