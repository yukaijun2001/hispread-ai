package com.hispread.ai;

import static org.junit.jupiter.api.Assertions.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

import com.fasterxml.jackson.databind.*;
import com.fasterxml.jackson.databind.node.*;
import java.time.*;
import java.util.*;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.mock.web.MockHttpSession;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

@SpringBootTest
@AutoConfigureMockMvc
@Transactional
class FinanceContractIntegrationTest {
  @Autowired Store s;
  @Autowired AuthService a;
  @Autowired MockMvc mvc;
  @Autowired ObjectMapper json;
  @Autowired FinancialWorkflowService workflow;
  @Autowired FinancialReportService reports;

  record Client(String uid, MockHttpSession session, String csrf) {}

  Client admin() throws Exception {
    String id = UUID.randomUUID().toString();
    ObjectNode u =
        s.object()
            .put("id", id)
            .put("username", "contract_" + id)
            .put("displayName", "Contract admin")
            .put("role", "ADMIN")
            .putNull("supplierId")
            .put("mustChangePassword", false)
            .put("onboardingRequired", false);
    u.set("permissions", a.allPermissions());
    a.createUser(u, "ContractTest@123");
    MockHttpSession se = new MockHttpSession();
    se.setAttribute("uid", id);
    se.setAttribute("sv", 0L);
    var r =
        mvc.perform(
                org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get(
                        "/api/auth/csrf")
                    .session(se))
            .andReturn();
    return new Client(
        id, se, json.readTree(r.getResponse().getContentAsString()).path("token").asText());
  }

  JsonNode get(String path, Client c) throws Exception {
    return json.readTree(
        mvc.perform(
                org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get(path)
                    .session(c.session))
            .andExpect(status().isOk())
            .andReturn()
            .getResponse()
            .getContentAsString());
  }

  JsonNode post(String path, ObjectNode body, Client c, int status) throws Exception {
    return json.readTree(
        mvc.perform(
                org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post(path)
                    .session(c.session)
                    .header("X-CSRF-TOKEN", c.csrf)
                    .contentType("application/json")
                    .content(body.toString()))
            .andExpect(status().is(status))
            .andReturn()
            .getResponse()
            .getContentAsString());
  }

  ObjectNode supplier(String name) {
    String id = UUID.randomUUID().toString();
    return s.create(
        "supplier",
        id,
        s.object().put("id", id).put("name", name).put("enabled", true).put("state", "APPROVED"));
  }

  @Test
  void quoteRankingUsesHistoricalPriceDateAndNumericCapabilitySort() throws Exception {
    Client c = admin();
    ObjectNode p =
        s.create("project", "GLOBAL", s.object().put("name", "Rank project").put("enabled", true));
    String project = p.path("id").asText();
    LocalDate d = LocalDate.now(ZoneId.of("Asia/Shanghai"));
    String historical = d.minusDays(2).toString();
    ObjectNode one = supplier("One"), two = supplier("Two");
    for (ObjectNode owner : List.of(one, two)) {
      String id = owner.path("id").asText();
      ObjectNode q =
          s.object()
              .put("supplierId", id)
              .put("supplierName", owner.path("name").asText())
              .put("projectId", project)
              .put("state", "APPROVED")
              .put("pricingType", "DISCOUNT")
              .put("currency", "USD")
              .put("multiplier", id.equals(one.path("id").asText()) ? "0.9" : "0.5")
              .put("accountCount", id.equals(one.path("id").asText()) ? "100" : "20")
              .put("effectiveFrom", d.minusDays(10).toString())
              .put("effectiveTo", d.plusDays(10).toString());
      ArrayNode h = q.putArray("priceHistory");
      h.add(
          s.object()
              .put("effectiveAt", d.minusDays(10) + "T00:00:00+08:00")
              .put("multiplier", id.equals(one.path("id").asText()) ? "0.2" : "0.5"));
      h.add(
          s.object()
              .put("effectiveAt", d + "T00:00:00+08:00")
              .put("multiplier", id.equals(one.path("id").asText()) ? "0.9" : "0.5"));
      s.create("quote", id, q);
    }
    JsonNode rank =
        get(
            "/api/quotes/ranking?projectId="
                + project
                + "&currency=USD&onDate="
                + historical
                + "&sortBy=PRICE&sortDirection=ASC",
            c);
    assertEquals("One", rank.get(0).path("supplierName").asText());
    assertEquals("0.2", rank.get(0).path("multiplier").asText());
    assertEquals(1, rank.get(0).path("rank").asInt());
    JsonNode capacity =
        get(
            "/api/quotes/ranking?projectId="
                + project
                + "&currency=USD&sortBy=ACCOUNT_COUNT&sortDirection=DESC",
            c);
    assertEquals("100", capacity.get(0).path("accountCount").asText());
    JsonNode historicalList =
        get("/api/quotes?onDate=" + historical + "&project=" + project + "&size=100", c);
    assertTrue(historicalList.path("items").isArray());
  }

  @Test
  void dailyFiltersSortAndExportSnapshotStayImmutable() throws Exception {
    Client c = admin();
    ObjectNode owner = supplier("Export contract");
    String oid = owner.path("id").asText(), day = BusinessSupport.today();
    for (int i = 1; i <= 2; i++)
      s.create(
          "input",
          oid,
          s.object()
              .put("supplierId", oid)
              .put("supplierName", "Export contract")
              .put("projectId", "p" + i)
              .put("projectName", "Project " + i)
              .put("sourceRef", "source" + i)
              .put("periodStart", day)
              .put("periodEnd", day)
              .put("currency", "USD")
              .put("originalAmount", String.valueOf(i * 10))
              .put("calculatedPayable", String.valueOf(i * 5))
              .put("state", "AVAILABLE")
              .put("reviewStatus", i == 1 ? "PENDING" : "CONFIRMED")
              .put("modelKey", i == 1 ? "model-a" : "model-b"));
    JsonNode grouped =
        get(
            "/api/accounting/daily/groups?supplier="
                + oid
                + "&groupBy=SUPPLIER&sortBy=consumptionTotal&sortDirection=DESC",
            c);
    assertEquals("20", grouped.path("items").get(0).path("consumptionTotal").asText());
    JsonNode pending =
        get(
            "/api/accounting/daily?from="
                + day
                + "&to="
                + day
                + "&supplier="
                + oid
                + "&reviewStatus=PENDING&model=model-a",
            c);
    assertEquals(1, pending.path("total").asInt());
    ObjectNode export =
        s.object()
            .put("type", "DETAIL")
            .put("format", "CSV")
            .put("requestKey", UUID.randomUUID().toString());
    export.set("filter", s.object().put("supplier", oid));
    JsonNode job = post("/api/accounting/daily/exports", export, c, 200);
    s.create(
        "input",
        oid,
        s.object()
            .put("supplierId", oid)
            .put("periodStart", day)
            .put("periodEnd", day)
            .put("currency", "USD")
            .put("originalAmount", "999")
            .put("state", "AVAILABLE"));
    JsonNode preview =
        get("/api/accounting/daily/exports/" + job.path("id").asText() + "/preview", c);
    assertEquals(2, preview.path("rows").size());
    assertEquals(job.path("id"), post("/api/accounting/daily/exports", export, c, 200).path("id"));
    post("/api/accounting/daily/exports", export.deepCopy().put("format", "XLSX"), c, 409);
  }

  @Test
  void exportReplayUsesPersistedInputsDespiteJsonbKeyOrderAndLegacyHashes() throws Exception {
    Client c = admin();
    String owner = supplier("Reordered export").path("id").asText(), day = BusinessSupport.today();
    ObjectNode originalFilter = s.object().put("reviewStatus", "").put("supplier", owner)
        .put("project", "").put("from", day).put("to", day).put("currency", "USD");
    ObjectNode body = s.object().put("type", "SUMMARY").put("format", "CSV")
        .put("requestKey", UUID.randomUUID().toString());
    body.set("filter", originalFilter);
    ObjectNode created = (ObjectNode) post("/api/accounting/daily/exports", body, c, 200);

    for (String mode : List.of("created", "legacy-hash", "legacy-no-hash")) {
      String id = created.path("id").asText();
      if (!mode.equals("created")) {
        ObjectNode historical = created.deepCopy();
        historical.remove(List.of("id", "version", "updatedAt"));
        historical.put("requestKey", UUID.randomUUID().toString());
        historical.set("filter", originalFilter.deepCopy());
        if (mode.equals("legacy-hash")) {
          // Original pre-JSONB serialization from the former fingerprint algorithm.
          ObjectNode payload = s.object().put("type", "SUMMARY").put("format", "CSV");
          payload.set("filter", originalFilter.deepCopy());
          historical.put("requestFingerprint", HexFormat.of().formatHex(
              java.security.MessageDigest.getInstance("SHA-256")
                  .digest(payload.toString().getBytes(java.nio.charset.StandardCharsets.UTF_8))));
        } else historical.remove("requestFingerprint");
        // Preserve an actual immutable snapshot and file, as prior releases did.
        ObjectNode source = s.get("export", created.path("id").asText(), c.uid);
        historical.set("contentBase64", source.path("contentBase64"));
        historical.set("previewRows", source.path("previewRows"));
        id = s.create("export", c.uid, historical).path("id").asText();
      }
      String path = "/api/accounting/daily/exports/" + id;
      ObjectNode persisted = s.get("export", id, c.uid);
      JsonNode returned = get(path, c);
      assertEquals(originalFilter, returned.path("filter"));
      assertNotEquals(originalFilter.toString(), returned.path("filter").toString());
      ObjectNode retry = s.object().put("type", returned.path("type").asText())
          .put("format", returned.path("format").asText())
          .put("requestKey", returned.path("requestKey").asText());
      retry.set("filter", returned.path("filter").deepCopy());
      int before = s.list("export", c.uid).size();
      assertEquals(id, post("/api/accounting/daily/exports", retry, c, 200).path("id").asText());
      assertEquals(persisted, s.get("export", id, c.uid));
      assertEquals(before, s.list("export", c.uid).size());
      post("/api/accounting/daily/exports", retry.deepCopy().put("format", "XLSX"), c, 409);
      ObjectNode differentFilter = retry.deepCopy();
      ((ObjectNode) differentFilter.path("filter")).put("from", LocalDate.parse(day).minusDays(1).toString());
      post("/api/accounting/daily/exports", differentFilter, c, 409);
      assertEquals(persisted, s.get("export", id, c.uid));
      assertEquals(before, s.list("export", c.uid).size());
    }
  }

  @Test
  void exportKeepsPendingAndConfirmedAmountsSeparateRegardlessOfSourceOrder() throws Exception {
    Client c = admin();
    for (boolean pendingFirst : List.of(false, true)) {
      String owner = supplier("Mixed review export").path("id").asText();
      String day = BusinessSupport.today();
      for (String suffix : List.of("confirmed-one", "confirmed-two", "pending", "allocated")) {
        boolean pending = suffix.equals("pending");
        String order = pending == pendingFirst ? "a-" : "z-";
        String original = switch (suffix) { case "confirmed-one" -> "10"; case "confirmed-two" -> "20";
          case "pending" -> "100"; default -> "40"; };
        String payable = switch (suffix) { case "confirmed-one" -> "5"; case "confirmed-two" -> "10";
          case "pending" -> "50"; default -> "20"; };
        s.create("input", owner, s.object().put("id", owner + order + suffix)
            .put("supplierId", owner).put("supplierName", "Mixed review export")
            .put("projectId", "mixed-project").put("projectName", "Mixed project")
            .put("sourceRef", suffix).put("periodStart", day).put("periodEnd", day)
            .put("currency", "USD").put("pricingType", "DISCOUNT").put("settlementMultiplier", "0.5")
            .put("originalAmount", original).put("calculatedPayable", payable)
            .put("state", pending ? "PENDING" : suffix.equals("allocated") ? "ALLOCATED" : "AVAILABLE")
            .put("reviewStatus", pending ? "PENDING" : "CONFIRMED"));
      }
      for (String type : List.of("DETAIL", "SUMMARY", "SUPPLIER")) {
        String format = type.equals("SUPPLIER") ? "XLSX" : "CSV";
        ObjectNode body = s.object().put("type", type).put("format", format)
            .put("requestKey", UUID.randomUUID().toString());
        body.set("filter", s.object().put("supplier", owner));
        JsonNode job = post("/api/accounting/daily/exports", body, c, 200);
        assertEquals(4, job.path("sourceCount").asInt());
        assertEquals(type.equals("DETAIL") ? 4 : 3, job.path("resultCount").asInt());
        JsonNode totals = job.path("snapshotTotals");
        assertEquals("70", totals.path("confirmedOriginal").asText());
        assertEquals("100", totals.path("pendingConsumption").asText());
        assertEquals("35", totals.path("payableTotal").asText());
        assertEquals("15", totals.path("unsettledPayable").asText());
        assertEquals(3, totals.path("confirmedCount").asInt());
        assertEquals(1, totals.path("pendingCount").asInt());
        String path = "/api/accounting/daily/exports/" + job.path("id").asText();
        JsonNode preview = get(path + "/preview", c);
        assertEquals("已确认应付", preview.path("headers").get(6).asText());
        assertEquals("核对状态", preview.path("headers").get(7).asText());
        assertEquals("待核对计算金额", preview.path("headers").get(9).asText());
        int pendingRows = 0;
        for (JsonNode row : preview.path("rows")) {
          if (row.get(7).asText().equals("待核对")) {
            pendingRows++;
            assertEquals("0", row.get(6).asText());
            assertEquals("50", row.get(9).asText());
          } else assertEquals("0", row.get(9).asText());
        }
        assertEquals(1, pendingRows);
        byte[] bytes = mvc.perform(org.springframework.test.web.servlet.request.MockMvcRequestBuilders
                .get(path + "/download").session(c.session)).andExpect(status().isOk())
            .andReturn().getResponse().getContentAsByteArray();
        String content = "";
        if (format.equals("CSV")) content = new String(bytes, java.nio.charset.StandardCharsets.UTF_8);
        else try (var zip = new java.util.zip.ZipInputStream(new java.io.ByteArrayInputStream(bytes))) {
          java.util.zip.ZipEntry entry;
          while ((entry = zip.getNextEntry()) != null)
            if (entry.getName().endsWith("sheet1.xml"))
              content = new String(zip.readAllBytes(), java.nio.charset.StandardCharsets.UTF_8);
        }
        assertTrue(content.contains("核对状态"));
        assertTrue(content.contains("待核对计算金额"));
        assertTrue(content.contains("待核对"));
      }
    }
  }

  @Test
  void sourceReferenceReplayCannotChangeBetweenQuotedAndDirectPricing() throws Exception {
    Client c = admin();
    String owner = supplier("Pricing replay").path("id").asText(), day = BusinessSupport.today();
    String project = s.create("project", "GLOBAL", s.object().put("name", "Replay project")
        .put("enabled", true)).path("id").asText();
    s.create("quote", owner, s.object().put("supplierId", owner).put("projectId", project)
        .put("state", "APPROVED").put("currency", "USD").put("pricingType", "DISCOUNT")
        .put("multiplier", "0.5").put("effectiveFrom", day).put("effectiveTo", day));
    for (boolean direct : List.of(false, true)) {
      ObjectNode body = s.object().put("supplierId", owner).put("projectId", project);
      body.putArray("rows").add(s.object().put("sourceRef", "pricing-mode-" + direct)
          .put("periodStart", day).put("periodEnd", day).put("currency", "USD")
          .put("originalAmount", "10").put("baseReference", "Invoice replay"));
      String original = "/api/settlement-inputs/" + (direct ? "manual-direct" : "manual");
      String changed = "/api/settlement-inputs/" + (direct ? "manual" : "manual-direct");
      assertEquals(1, post(original, body, c, 200).path("inserted").asInt());
      assertEquals(1, post(original, body, c, 200).path("skipped").asInt());
      post(changed, body, c, 409);
    }
    assertEquals(2, s.list("input", owner).size());
    for (ObjectNode input : s.list("input", owner))
      assertEquals(input.path("sourceRef").asText().endsWith("true") ? "10" : "5.0",
          input.path("calculatedPayable").asText());
  }

  @Test
  void expiredExportReadsTruthfullyWithoutChangingStoredSnapshotOrLegacyHeaders() throws Exception {
    Client c = admin();
    ObjectNode saved = s.object().put("state", "COMPLETED").put("type", "DETAIL")
        .put("expiresAt", Instant.now().minusSeconds(1).toString()).put("contentBase64", "YQ==")
        .put("requestKey", "old-export");
    saved.putArray("headers").add("历史列");
    saved.putArray("previewRows").addArray().add("历史值");
    saved.putArray("files").add(s.object().put("name", "legacy.csv"));
    String id = s.create("export", c.uid, saved).path("id").asText();
    assertEquals("EXPIRED", get("/api/accounting/daily/exports/" + id, c).path("state").asText());
    assertEquals(1, get("/api/accounting/daily/exports?state=EXPIRED", c).path("total").asInt());
    assertEquals("历史列", get("/api/accounting/daily/exports/" + id + "/preview", c)
        .path("headers").get(0).asText());
    assertEquals("COMPLETED", s.get("export", id, c.uid).path("state").asText());
    mvc.perform(org.springframework.test.web.servlet.request.MockMvcRequestBuilders
            .get("/api/accounting/daily/exports/" + id + "/download").session(c.session))
        .andExpect(status().isGone());
  }

  @Test
  void overdueRequiresManualConfirmationAndOwnerKpiReadsConfirmedHistory() throws Exception {
    Client c = admin();
    ObjectNode owner = supplier("Deadline supplier");
    String oid = owner.path("id").asText();
    s.update("supplier", oid, oid, s.object().put("ownerUserId", c.uid));
    ObjectNode due =
        s.create(
            "settlement",
            oid,
            s.object()
                .put("supplierId", oid)
                .put("supplierName", "Deadline supplier")
                .put("ownerUserId", c.uid)
                .put("state", "PENDING")
                .put("currency", "USD")
                .put("total", "12.50")
                .put("confirmationDeadline", Instant.now().minusSeconds(30).toString()));
    s.create(
        "settlement",
        oid,
        s.object()
            .put("supplierId", oid)
            .put("state", "PENDING")
            .put("currency", "USD")
            .put("total", "1000")
            .put("sourceChanged", true)
            .put("confirmationDeadline", Instant.now().minusSeconds(30).toString()));
    assertEquals(0, workflow.confirmOverdue());
    assertEquals(0, workflow.confirmOverdue());
    ObjectNode confirmed = s.get("settlement", due.path("id").asText(), oid);
    assertEquals("PENDING", confirmed.path("state").asText());
    assertFalse(confirmed.has("confirmationMode"));
    s.update("settlement", due.path("id").asText(), oid, s.object().put("state", "CONFIRMED")
        .put("confirmationMode", "MANUAL").put("confirmedAt", Instant.now().toString()));
    ObjectNode kpi =
        reports.operatorKpi(
            Map.of(
                "month",
                YearMonth.now(ZoneId.of("Asia/Shanghai")).toString(),
                "owner",
                c.uid,
                "currency",
                "USD"));
    assertEquals("12.50", kpi.path("items").get(0).path("total").asText());
    assertEquals(
        1,
        reports
            .operatorKpiLines(
                Map.of(
                    "month",
                    YearMonth.now(ZoneId.of("Asia/Shanghai")).toString(),
                    "ownerUserId",
                    c.uid,
                    "currency",
                    "USD"))
            .path("total")
            .asInt());
  }

  @Test
  void batchFailureLeavesNoPartialStatementAndRetryRebuildsSnapshot() throws Exception {
    Client c = admin();
    ObjectNode owner = supplier("Batch contract");
    String oid = owner.path("id").asText(), day = BusinessSupport.today();
    ObjectNode project =
        s.create("project", "GLOBAL", s.object().put("name", "Batch project").put("enabled", true));
    String pid = project.path("id").asText();
    ObjectNode source =
        s.create(
            "input",
            oid,
            s.object()
                .put("supplierId", oid)
                .put("supplierName", "Batch contract")
                .put("projectId", pid)
                .put("projectName", "Batch project")
                .put("periodStart", day)
                .put("periodEnd", day)
                .put("currency", "USD")
                .put("originalAmount", "10")
                .put("calculatedPayable", "5")
                .put("state", "AVAILABLE"));
    ObjectNode request =
        s.object()
            .put("periodStart", day)
            .put("periodEnd", day)
            .put("confirmationDeadline", Instant.now().plusSeconds(86400).toString())
            .put("requestKey", UUID.randomUUID().toString());
    request.putArray("supplierIds").add(oid);
    JsonNode batch = post("/api/settlement-batches/preview", request, c, 200);
    assertEquals(1, batch.path("readyCount").asInt());
    s.update("input", source.path("id").asText(), oid, s.object().put("calculatedPayable", "7"));
    JsonNode failed =
        post("/api/settlement-batches/" + batch.path("id").asText() + "/start", s.object(), c, 200);
    assertEquals(1, failed.path("failedCount").asInt());
    assertEquals(
        "AVAILABLE", s.get("input", source.path("id").asText(), oid).path("state").asText());
    assertTrue(s.list("settlement", oid).isEmpty());
    JsonNode retry =
        post(
            "/api/settlement-batches/" + batch.path("id").asText() + "/retry-preview",
            s.object().put("requestKey", UUID.randomUUID().toString()),
            c,
            200);
    JsonNode success =
        post("/api/settlement-batches/" + retry.path("id").asText() + "/start", s.object(), c, 200);
    assertEquals(1, success.path("successCount").asInt());
    assertEquals("7", s.list("settlement", oid).get(0).path("total").asText());
  }

  @Test
  void exchangeRateVersionsIncreasePerPairAndLatestEnabledIsSelected() throws Exception {
    Client c = admin();
    String from = "USD", to = "USDT";
    ObjectNode request =
        s.object()
            .put("baseCurrency", from)
            .put("quoteCurrency", to)
            .put("rate", "1.01")
            .put("effectiveFrom", Instant.now().minusSeconds(1).toString());
    JsonNode first = post("/api/exchange-rates", request, c, 200),
        second = post("/api/exchange-rates", request.deepCopy().put("rate", "1.02"), c, 200);
    assertEquals(first.path("version").asLong() + 1, second.path("version").asLong());
    JsonNode rates = get("/api/exchange-rates/current", c);
    JsonNode selected = null;
    for (JsonNode r : rates)
      if (r.path("baseCurrency").asText().equals(from)
          && r.path("quoteCurrency").asText().equals(to)) selected = r;
    assertNotNull(selected);
    assertEquals("1.02", selected.path("rate").asText());
    post(
        "/api/exchange-rates/" + second.path("id").asText() + "/enabled",
        s.object()
            .put("enabled", false)
            .put("note", "test")
            .put("version", second.path("version").asLong()),
        c,
        200);
  }

  @Test
  void manualSourcesUseHistoricalQuoteAndRejectCrossPriceDatesOrChangedReplay() throws Exception {
    Client c = admin();
    ObjectNode owner = supplier("Historical amount");
    String oid = owner.path("id").asText();
    ObjectNode project =
        s.create(
            "project", "GLOBAL", s.object().put("name", "Historical project").put("enabled", true));
    String pid = project.path("id").asText();
    LocalDate today = LocalDate.now(ZoneId.of("Asia/Shanghai"));
    ObjectNode quote =
        s.object()
            .put("supplierId", oid)
            .put("projectId", pid)
            .put("state", "APPROVED")
            .put("pricingType", "DISCOUNT")
            .put("currency", "USD")
            .put("multiplier", "0.9")
            .put("effectiveFrom", today.minusDays(10).toString())
            .put("effectiveTo", today.plusDays(10).toString());
    quote
        .putArray("priceHistory")
        .add(
            s.object()
                .put("effectiveAt", today.minusDays(10) + "T00:00:00+08:00")
                .put("multiplier", "0.2"))
        .add(s.object().put("effectiveAt", today + "T00:00:00+08:00").put("multiplier", "0.9"));
    s.create("quote", oid, quote);
    ObjectNode request = s.object().put("supplierId", oid).put("projectId", pid);
    ObjectNode row =
        s.object()
            .put("sourceRef", "historical-one")
            .put("periodStart", today.minusDays(2).toString())
            .put("periodEnd", today.minusDays(2).toString())
            .put("currency", "USD")
            .put("originalAmount", "100");
    request.putArray("rows").add(row);
    post("/api/settlement-inputs/manual", request, c, 200);
    assertEquals("20.0", s.list("input", oid).get(0).path("calculatedPayable").asText());
    assertEquals(1, post("/api/settlement-inputs/manual", request, c, 200).path("skipped").asInt());
    ObjectNode different = request.deepCopy();
    ((ObjectNode) different.path("rows").get(0)).put("originalAmount", "101");
    post("/api/settlement-inputs/manual", different, c, 409);
    ObjectNode cross = request.deepCopy();
    ((ObjectNode) cross.path("rows").get(0))
        .put("sourceRef", "historical-cross")
        .put("periodEnd", today.toString());
    post("/api/settlement-inputs/manual", cross, c, 409);
  }

  @Test
  void configuredReadOnlyProviderIsNeverAdvertisedAsExecutable() throws Exception {
    Client c = admin();
    ObjectNode config =
        s.object()
            .put("id", "AIRWALLEX")
            .put("code", "AIRWALLEX")
            .put("enabled", true)
            .put("apiKey", "fixture-never-return")
            .put("clientId", "fixture-client");
    try {
      s.get("payout-provider", "AIRWALLEX", null);
      s.update("payout-provider", "AIRWALLEX", null, config);
    } catch (ApiException missing) {
      s.create("payout-provider", "GLOBAL", config);
    }
    JsonNode capabilities = get("/api/payments/provider-capabilities", c);
    assertEquals(3, capabilities.size());
    JsonNode aw = null;
    for (JsonNode p : capabilities) if (p.path("code").asText().equals("AIRWALLEX")) aw = p;
    assertNotNull(aw);
    assertTrue(aw.path("configured").asBoolean());
    assertFalse(aw.path("readOnlyTestAvailable").asBoolean());
    assertFalse(aw.path("executable").asBoolean());
    assertFalse(capabilities.toString().contains("fixture"));
    assertTrue(get("/api/payments/providers", c).isEmpty());
  }
}
