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
}
