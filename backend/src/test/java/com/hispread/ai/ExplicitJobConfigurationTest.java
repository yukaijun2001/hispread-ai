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
  void explicitOptInCreatesOneFuturePendingQuoteNeverApprovedAndRetriesAreIdempotent() {
    String owner = "renew-" + UUID.randomUUID(),
        pid = "project-" + UUID.randomUUID(),
        key = "job-" + UUID.randomUUID();
    LocalDate today = LocalDate.now(ZoneId.of("Asia/Shanghai"));
    s.create(
        "supplier",
        owner,
        s.object()
            .put("id", owner)
            .put("name", "Renew supplier")
            .put("state", "APPROVED")
            .put("enabled", true));
    s.create(
        "project", "GLOBAL", s.object().put("id", pid).put("name", "Project").put("enabled", true));
    ObjectNode original =
        s.create(
            "quote",
            owner,
            s.object()
                .put("supplierId", owner)
                .put("supplierName", "Renew supplier")
                .put("projectId", pid)
                .put("projectName", "Project")
                .put("state", "APPROVED")
                .put("currency", "USD")
                .put("pricingType", "DISCOUNT")
                .put("multiplier", "0.25")
                .put("effectiveFrom", today.minusDays(10).toString())
                .put("effectiveTo", today.toString())
                .put("submittedBy", "original-maker"));
    original
        .putArray("priceHistory")
        .add(
            s.object()
                .put("effectiveAt", today.toString() + "T00:00:00+08:00")
                .put("approvedAt", Instant.now().toString())
                .put("multiplier", "0.30"));
    s.update(
        "quote",
        original.path("id").asText(),
        owner,
        s.object().set("priceHistory", original.path("priceHistory")));
    ObjectNode task =
        s.create(
            "scheduled-task",
            "GLOBAL",
            s.object()
                .put("id", key)
                .put("key", key)
                .put("type", "QUOTE_AUTO_RENEWAL")
                .put("enabled", false)
                .put("intervalMinutes", 10));
    assertFalse(jobs.describe(task).path("ready").asBoolean());
    assertThrows(ApiException.class, () -> jobs.run(key, "MANUAL"));
    ObjectNode config =
        s.object()
            .put("autoRenewEnabled", true)
            .put("renewalDays", 30)
            .put("renewBeforeDays", 2)
            .put("version", 0);
    config.putArray("quoteIds").add(original.path("id").asText());
    ObjectNode configured = jobs.update(key, config);
    assertTrue(configured.path("ready").asBoolean());
    assertEquals(1, jobs.run(key, "MANUAL").path("processedCount").asInt());
    List<ObjectNode> generated =
        s.list("quote", owner).stream().filter(q -> q.has("renewedFrom")).toList();
    assertEquals(1, generated.size());
    ObjectNode pending = generated.get(0);
    assertEquals("PENDING", pending.path("state").asText());
    assertEquals(today.plusDays(1).toString(), pending.path("effectiveFrom").asText());
    assertEquals(today.plusDays(30).toString(), pending.path("effectiveTo").asText());
    assertEquals("0.30", pending.path("priceSnapshot").path("multiplier").asText());
    assertFalse(pending.has("reviewedBy"));
    assertEquals(
        "APPROVED", s.get("quote", original.path("id").asText(), owner).path("state").asText());
    assertEquals(0, jobs.run(key, "MANUAL").path("processedCount").asInt());
    assertEquals(2, s.list("quote", owner).size());
    ObjectNode disabled = s.object().put("version", s.get("scheduled-task", key, null).path("version").asLong())
        .put("autoRenewEnabled", false);
    disabled.putArray("quoteIds");
    assertFalse(jobs.update(key, disabled).path("ready").asBoolean());
    assertFalse(s.get("quote", original.path("id").asText(), owner).path("autoRenewEnabled").asBoolean());
    assertEquals(503, assertThrows(ApiException.class, () -> jobs.run(key, "MANUAL")).status);
  }

  @Test
  void noQuoteOptInOrInvalidRulesCannotRenew() {
    String key = "disabled-renew-" + UUID.randomUUID();
    ObjectNode task =
        s.create(
            "scheduled-task",
            "GLOBAL",
            s.object()
                .put("id", key)
                .put("key", key)
                .put("type", "QUOTE_AUTO_RENEWAL")
                .put("renewalDays", 30)
                .put("renewBeforeDays", 2));
    assertFalse(jobs.describe(task).path("ready").asBoolean());
    ApiException error = assertThrows(ApiException.class, () -> jobs.run(key, "MANUAL"));
    assertEquals(503, error.status);
    assertThrows(ApiException.class, () -> jobs.update(key, s.object().put("renewalDays", 366)));
  }

  @Test
  void renewalRequiresExplicitNonemptySelectionAndTypedRules() {
    String key = "selection-" + UUID.randomUUID();
    ObjectNode task = s.create("scheduled-task", "GLOBAL", s.object().put("id", key)
        .put("key", key).put("type", "QUOTE_AUTO_RENEWAL").put("enabled", false));
    ObjectNode empty = s.object().put("version", 0).put("autoRenewEnabled", true)
        .put("renewalDays", 30).put("renewBeforeDays", 2);
    empty.putArray("quoteIds");
    assertEquals(400, assertThrows(ApiException.class, () -> jobs.update(key, empty)).status);
    assertEquals(0, s.get("scheduled-task", key, null).path("version").asLong());
    assertEquals(400, assertThrows(ApiException.class, () -> jobs.update(key,
        s.object().put("version", 0).put("renewalDays", 1.5))).status);
    assertEquals(400, assertThrows(ApiException.class, () -> jobs.update(key,
        s.object().put("version", 0).put("autoRenewEnabled", "true"))).status);
    assertFalse(jobs.describe(task).path("ready").asBoolean());
  }

  @Test
  void nameOnlyUpdatePreservesTargetAndSchedule() {
    String key = "target-" + UUID.randomUUID();
    s.create("scheduled-task", "GLOBAL", s.object().put("id", key).put("key", key)
        .put("type", "CCMAX_DAILY_SYNC").put("enabled", false)
        .put("intervalMinutes", 12).put("targetId", "selected-target"));
    ObjectNode updated = jobs.update(key, s.object().put("version", 0).put("name", "Renamed"));
    assertEquals("selected-target", updated.path("targetId").asText());
    assertEquals(12, updated.path("intervalMinutes").asInt());
    assertFalse(updated.path("enabled").asBoolean());
  }
}
