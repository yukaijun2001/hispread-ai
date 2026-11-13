package com.hispread.ai;

import static org.junit.jupiter.api.Assertions.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.node.*;
import com.sun.net.httpserver.HttpServer;
import java.net.*;
import java.nio.charset.StandardCharsets;
import java.time.*;
import java.util.*;
import java.util.concurrent.*;
import java.util.concurrent.atomic.*;
import org.junit.jupiter.api.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.mock.web.MockHttpSession;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

@SpringBootTest(
    properties = {
      "app.integrations.allow-private-targets=true",
      "app.integrations.request-timeout-ms=1000",
      "app.jobs.wecom.encryption-key=AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA="
    })
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Transactional
class BackgroundJobExecutionIntegrationTest {
  @Autowired Store s;
  @Autowired AuthService auth;
  @Autowired MockMvc mvc;
  @Autowired SystemJobService jobs;
  @Autowired WecomReminderService wecom;
  HttpServer server;
  String owner, project, target, r1, r2;
  List<String> requests;
  Map<String, Integer> priorities;
  AtomicReference<String> syncOverride, wecomResponse;
  AtomicInteger httpStatus;
  AtomicBoolean failRestore;
  AtomicReference<JsonNode> seenPayload;
  AtomicReference<String> seenAuth, seenKey;
  CountDownLatch requestEntered, releaseRequest;
  AtomicBoolean blockStatus;

  @BeforeEach
  void setup() throws Exception {
    owner = "job-owner-" + UUID.randomUUID();
    project = "job-project-" + UUID.randomUUID();
    target = "job-target-" + UUID.randomUUID();
    r1 = "job-resource-1-" + UUID.randomUUID();
    r2 = "job-resource-2-" + UUID.randomUUID();
    requests = new CopyOnWriteArrayList<>();
    priorities = new ConcurrentHashMap<>();
    priorities.put(r1, 70);
    priorities.put(r2, 80);
    syncOverride = new AtomicReference<>();
    wecomResponse = new AtomicReference<>("{\"errcode\":0,\"errmsg\":\"ok\"}");
    httpStatus = new AtomicInteger(200);
    failRestore = new AtomicBoolean();
    seenPayload = new AtomicReference<>();
    seenAuth = new AtomicReference<>();
    seenKey = new AtomicReference<>();
    requestEntered = new CountDownLatch(1);
    releaseRequest = new CountDownLatch(1);
    blockStatus = new AtomicBoolean();
    server = HttpServer.create(new InetSocketAddress("127.0.0.1", 0), 0);
    server.createContext(
        "/",
        exchange -> {
          String path = exchange.getRequestURI().getPath();
          requests.add(path);
          JsonNode input = s.json.readTree(exchange.getRequestBody().readAllBytes());
          seenPayload.set(input);
          seenAuth.set(exchange.getRequestHeaders().getFirst("Authorization"));
          seenKey.set(exchange.getRequestHeaders().getFirst("Idempotency-Key"));
          int status = httpStatus.get();
          ObjectNode response = s.object().put("state", "SUCCESS");
          String raw = null;
          if (path.equals("/cgi-bin/webhook/send")) raw = wecomResponse.get();
          else if (path.endsWith("/daily-sync")) {
            if (syncOverride.get() != null) raw = syncOverride.get();
            else {
              ArrayNode rows = response.putArray("rows");
              rows.add(
                  s.object()
                      .put("resourceId", r1)
                      .put("supplierId", owner)
                      .put("businessDate", input.path("businessDate").asText())
                      .put("model", "fixture-model")
                      .put("currency", "USD")
                      .put("originalAmount", "20.50"));
            }
          } else if (path.endsWith("/status-sync")) {
            if (blockStatus.get()) {
              requestEntered.countDown();
              try {
                releaseRequest.await(4, TimeUnit.SECONDS);
              } catch (InterruptedException interrupted) {
                Thread.currentThread().interrupt();
              }
            }
            if (syncOverride.get() != null) raw = syncOverride.get();
            else {
              ArrayNode resources = response.putArray("resources");
              for (JsonNode r : input.path("resources")) {
                ObjectNode row =
                    s.object()
                        .put("resourceId", r.path("resourceId").asText())
                        .put("supplierId", owner)
                        .put("operationalState", "READY")
                        .put("priority", priorities.get(r.path("resourceId").asText()));
                row.putObject("usage").put("amount", "10").put("currency", "USD");
                resources.add(row);
              }
            }
          } else if (path.endsWith("/priority/read")) {
            ArrayNode values = response.putArray("priorities");
            for (JsonNode id : input.path("resourceIds"))
              values.add(
                  s.object()
                      .put("resourceId", id.asText())
                      .put("supplierId", owner)
                      .put("priority", priorities.get(id.asText())));
          } else if (path.endsWith("/priority")) {
            String id = input.path("resourceId").asText();
            int priority = input.path("priority").asInt();
            if (failRestore.get() && priority >= 70) status = 503;
            else priorities.put(id, priority);
            response.put("resourceId", id).put("supplierId", owner).put("priority", priority);
          }
          byte[] bytes = (raw == null ? response.toString() : raw).getBytes(StandardCharsets.UTF_8);
          exchange.getResponseHeaders().set("Content-Type", "application/json");
          exchange.sendResponseHeaders(status, bytes.length);
          exchange.getResponseBody().write(bytes);
          exchange.close();
        });
    server.start();
    s.create(
        "resource-target",
        "GLOBAL",
        s.object()
            .put("id", target)
            .put("protocol", "CUSTOM")
            .put("baseUrl", "http://127.0.0.1:" + server.getAddress().getPort())
            .put("allowHttp", true)
            .put("enabled", true)
            .put("apiKey", "fixture-job-key"));
    s.create(
        "supplier",
        owner,
        s.object()
            .put("id", owner)
            .put("state", "APPROVED")
            .put("enabled", true)
            .put("name", "Job fixture"));
    s.create(
        "project",
        "GLOBAL",
        s.object().put("id", project).put("enabled", true).put("name", "Job project"));
    for (String id : List.of(r1, r2))
      s.create(
          "resource",
          owner,
          s.object()
              .put("id", id)
              .put("supplierId", owner)
              .put("projectId", project)
              .put("projectName", "Job project")
              .put("resourceType", "CCMAX")
              .put("state", "DELIVERED")
              .put("operationalState", "READY")
              .put("targetId", target)
              .put("priority", priorities.get(id)));
    LocalDate today = LocalDate.now(ZoneId.of("Asia/Shanghai"));
    s.create(
        "quote",
        owner,
        s.object()
            .put("supplierId", owner)
            .put("projectId", project)
            .put("state", "APPROVED")
            .put("currency", "USD")
            .put("pricingType", "DISCOUNT")
            .put("multiplier", "0.25")
            .put("effectiveFrom", today.minusDays(30).toString())
            .put("effectiveTo", today.plusDays(30).toString()));
  }

  @AfterEach
  void close() {
    server.stop(0);
    // Clean up the durable-transaction test as well as rolled-back fixtures.
    s.jdbc.update("delete from hub_entity where owner_id=?", owner);
    s.jdbc.update("delete from hub_entity where id in (?,?)", project, target);
    s.jdbc.update(
        "delete from hub_entity where kind in"
            + " ('scheduled-task','rotation-settings','scheduled-run') and (data->>'targetId'=? or"
            + " data->>'taskKey' in (select id from hub_entity where kind='scheduled-task' and"
            + " data->>'targetId'=?))",
        target,
        target);
  }

  ObjectNode task(String type) {
    String key = "background-job-" + UUID.randomUUID();
    return s.create(
        "scheduled-task",
        "GLOBAL",
        s.object()
            .put("id", key)
            .put("key", key)
            .put("type", type)
            .put("targetId", target)
            .put("enabled", false)
            .put("intervalMinutes", 10));
  }

  ObjectNode rotation(String mode) {
    ObjectNode task = task("CCMAX_PRIORITY_ROTATION");
    ObjectNode config = s.object().put("id", task.path("id").asText());
    ObjectNode settings =
        config
            .putObject("settings")
            .put("mode", mode)
            .put("scope", "SELECTED")
            .put("basisPoints", 5000)
            .put("maxAccounts", 20)
            .put("priority", 10);
    settings.putArray("supplierIds").add(owner);
    settings.putArray("tiers");
    s.create("rotation-settings", "GLOBAL", config);
    return task;
  }

  @Test
  void dailySyncSendsScopedPayloadCalculatesLocallyAndDeduplicates() {
    ObjectNode task = task("CCMAX_DAILY_SYNC");
    assertTrue(jobs.describe(task).path("ready").asBoolean());
    ObjectNode run = jobs.run(task.path("key").asText(), "MANUAL");
    assertEquals("SUCCESS", run.path("state").asText());
    assertEquals(1, run.path("processedCount").asInt());
    assertEquals("Bearer fixture-job-key", seenAuth.get());
    assertNotNull(seenKey.get());
    assertEquals(2, seenPayload.get().path("resources").size());
    assertTrue(seenPayload.get().path("resources").toString().contains(owner));
    ObjectNode input = s.list("input", owner).get(0);
    assertEquals("5.1250", input.path("calculatedPayable").asText());
    assertEquals("PENDING", input.path("state").asText());
    assertEquals("PENDING", input.path("reviewStatus").asText());
    assertEquals("0.25", input.path("quoteSnapshot").path("multiplier").asText());
    assertEquals(1, s.list("bill", owner).size());
    assertEquals(0, jobs.run(task.path("key").asText(), "MANUAL").path("processedCount").asInt());
    assertEquals(1, s.list("input", owner).size());
    syncOverride.set(
        "{\"state\":\"SUCCESS\",\"rows\":[{\"resourceId\":\"foreign\",\"supplierId\":\"foreign\"}]}");
    ObjectNode rejected = jobs.run(task.path("key").asText(), "MANUAL");
    assertEquals("RESOURCE_UPSTREAM_SCOPE_MISMATCH", rejected.path("resultCode").asText());
    assertEquals("FAILED", rejected.path("state").asText());
    assertEquals(1, s.list("input", owner).size());
    assertFalse(
        s.get("scheduled-task", task.path("key").asText(), null).path("running").asBoolean());
  }

  @Test
  void collectedObservationRequiresFinancialConfirmationBeforeSettlementPreview() throws Exception {
    ObjectNode task = task("CCMAX_DAILY_SYNC");
    jobs.run(task.path("key").asText(), "MANUAL");
    ObjectNode input = s.list("input", owner).get(0);
    String uid = UUID.randomUUID().toString();
    ObjectNode user =
        s.object()
            .put("id", uid)
            .put("username", "job-review-" + uid)
            .put("role", "FINANCE")
            .put("displayName", "Fixture finance")
            .putNull("supplierId")
            .put("mustChangePassword", false)
            .put("onboardingRequired", false);
    user.set("permissions", auth.rolePermissions("FINANCE"));
    auth.createUser(user, "FixtureJob@123");
    MockHttpSession session = new MockHttpSession();
    session.setAttribute("uid", uid);
    session.setAttribute("sv", 0L);
    String csrf =
        s.json
            .readTree(
                mvc.perform(get("/api/auth/csrf").session(session))
                    .andReturn()
                    .getResponse()
                    .getContentAsString())
            .path("token")
            .asText();
    ObjectNode document =
        s.object()
            .put("supplierId", owner)
            .put("projectId", project)
            .put("currency", "USD")
            .put("periodStart", input.path("periodStart").asText())
            .put("periodEnd", input.path("periodEnd").asText());
    document.putArray("inputIds").add(input.path("id").asText());
    mvc.perform(
            post("/api/settlements/preview")
                .session(session)
                .header("X-CSRF-TOKEN", csrf)
                .contentType("application/json")
                .content(document.toString()))
        .andExpect(status().isConflict());
    String path = "/api/settlement-inputs/" + input.path("id").asText() + "/confirm";
    mvc.perform(
            post(path)
                .session(session)
                .header("X-CSRF-TOKEN", csrf)
                .contentType("application/json")
                .content(s.object().put("version", 999).toString()))
        .andExpect(status().isConflict());
    String body = s.object().put("version", input.path("version").asLong()).toString();
    ObjectNode quote = s.list("quote", owner).get(0);
    s.update("quote", quote.path("id").asText(), owner, s.object().put("multiplier", "0.5"));
    mvc.perform(
            post(path)
                .session(session)
                .header("X-CSRF-TOKEN", csrf)
                .contentType("application/json")
                .content(body))
        .andExpect(status().isConflict())
        .andExpect(jsonPath("$.code").value("JOB_QUOTE_CHANGED"));
    s.update("quote", quote.path("id").asText(), owner, s.object().put("multiplier", "0.25"));
    ObjectNode restricted = user.deepCopy().put("role", "OPERATOR");
    restricted.set("permissions", auth.rolePermissions("OPERATOR"));
    auth.saveUser(restricted);
    mvc.perform(
            post(path)
                .session(session)
                .header("X-CSRF-TOKEN", csrf)
                .contentType("application/json")
                .content(body))
        .andExpect(status().isForbidden());
    auth.saveUser(user);
    mvc.perform(
            post(path)
                .session(session)
                .header("X-CSRF-TOKEN", csrf)
                .contentType("application/json")
                .content(body))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.state").value("AVAILABLE"));
    mvc.perform(
            post(path)
                .session(session)
                .header("X-CSRF-TOKEN", csrf)
                .contentType("application/json")
                .content(body))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.state").value("AVAILABLE"));
    assertEquals("CONFIRMED", s.list("bill", owner).get(0).path("state").asText());
    JsonNode preview =
        s.json.readTree(
            mvc.perform(
                    post("/api/settlements/preview")
                        .session(session)
                        .header("X-CSRF-TOKEN", csrf)
                        .contentType("application/json")
                        .content(document.toString()))
                .andExpect(status().isOk())
                .andReturn()
                .getResponse()
                .getContentAsString());
    assertEquals("5.1250", preview.path("total").asText());
    assertEquals(1, preview.path("lineCount").asInt());
    assertEquals(uid, s.get("input", input.path("id").asText(), owner).path("reviewedBy").asText());
  }

  @Test
  void statusSyncPersistsOnlyWhitelistedFieldsAndChecksBusinessAndHttpErrors() {
    ObjectNode task = task("CCMAX_STATUS_SYNC");
    ObjectNode response = s.object().put("state", "SUCCESS");
    response
        .putArray("resources")
        .add(
            s.object()
                .put("resourceId", r1)
                .put("supplierId", owner)
                .put("operationalState", "PAUSED")
                .put("priority", 12)
                .put("createdBy", "attacker")
                .put("state", "DELETED"));
    syncOverride.set(response.toString());
    assertEquals("SUCCESS", jobs.run(task.path("key").asText(), "MANUAL").path("state").asText());
    ObjectNode resource = s.get("resource", r1, owner);
    assertEquals("PAUSED", resource.path("operationalState").asText());
    assertEquals("DELIVERED", resource.path("state").asText());
    assertFalse(resource.has("createdBy"));
    syncOverride.set("{\"state\":\"FAILED\",\"resources\":[]}");
    assertEquals(
        "RESOURCE_UPSTREAM_REJECTED",
        jobs.run(task.path("key").asText(), "MANUAL").path("resultCode").asText());
    ((ObjectNode) response.path("resources").get(0)).put("priority", 4294967296L);
    syncOverride.set(response.toString());
    assertEquals(
        "RESOURCE_UPSTREAM_INVALID_RESPONSE",
        jobs.run(task.path("key").asText(), "MANUAL").path("resultCode").asText());
    httpStatus.set(503);
    assertEquals(
        "RESOURCE_UPSTREAM_HTTP_ERROR",
        jobs.run(task.path("key").asText(), "MANUAL").path("resultCode").asText());
  }

  @Test
  void rotationRestoresBeforeNextBoostAndRetryOnlyRepeatsFailedRestores() {
    ObjectNode task = rotation("ROTATION");
    String key = task.path("key").asText();
    assertEquals(1, jobs.run(key, "MANUAL").path("processedCount").asInt());
    assertEquals(10, priorities.get(r1));
    assertEquals(80, priorities.get(r2));
    ObjectNode first = s.list("priority-round", owner).get(0);
    assertEquals("ACTIVE", first.path("state").asText());
    assertEquals(70, first.path("items").get(0).path("originalPriority").asInt());
    assertEquals("SUCCESS", jobs.run(key, "MANUAL").path("state").asText());
    assertEquals(70, priorities.get(r1));
    assertEquals(10, priorities.get(r2));
    assertEquals(
        "CLOSED", s.get("priority-round", first.path("id").asText(), owner).path("state").asText());
    failRestore.set(true);
    int count = requests.size();
    assertEquals("PRIORITY_RESTORE_FAILED", jobs.run(key, "MANUAL").path("resultCode").asText());
    assertEquals(count + 1, requests.size());
    assertEquals(
        1,
        s.list("priority-round", owner).stream()
            .filter(r -> r.path("state").asText().equals("RESTORE_FAILED"))
            .count());
    failRestore.set(false);
    assertEquals(1, jobs.retryRestore(key).path("restored").asInt());
    assertEquals(80, priorities.get(r2));
    int beforeRetry = requests.size();
    assertEquals(0, jobs.retryRestore(key).path("restored").asInt());
    assertEquals(beforeRetry, requests.size());
    jobs.run(key, "MANUAL");
    jobs.update(key, s.object().put("enabled", false));
    assertEquals(70, priorities.get(r1));
    assertEquals(80, priorities.get(r2));
  }

  @Test
  @Transactional(propagation = Propagation.NOT_SUPPORTED)
  void failedRestorePersistsAcrossIndependentCommittedRuns() {
    ObjectNode task = rotation("ROTATION");
    String key = task.path("key").asText();
    try {
      assertEquals("SUCCESS", jobs.run(key, "MANUAL").path("state").asText());
      String roundId = s.list("priority-round", owner).get(0).path("id").asText();
      failRestore.set(true);
      assertEquals("FAILED", jobs.run(key, "MANUAL").path("state").asText());
      assertEquals(
          "RESTORE_FAILED", s.get("priority-round", roundId, owner).path("state").asText());
      assertEquals(
          70,
          s.get("priority-round", roundId, owner)
              .path("items")
              .get(0)
              .path("originalPriority")
              .asInt());
      failRestore.set(false);
      assertEquals(1, jobs.retryRestore(key).path("restored").asInt());
      assertEquals("CLOSED", s.get("priority-round", roundId, owner).path("state").asText());
      assertEquals(70, priorities.get(r1));
    } finally {
      s.jdbc.update(
          "delete from hub_entity where kind='scheduled-run' and data->>'taskKey'=?", key);
      s.jdbc.update(
          "delete from hub_entity where kind in ('rotation-settings','scheduled-task') and id=?",
          key);
    }
  }

  @Test
  void idleRotationRequiresTwoSuccessfulUnchangedCompleteObservations() {
    ObjectNode task = rotation("SUPPLIER_IDLE");
    assertEquals(0, jobs.run(task.path("key").asText(), "MANUAL").path("processedCount").asInt());
    assertEquals(1, s.list("supplier-usage-snapshot", owner).size());
    assertEquals(1, jobs.run(task.path("key").asText(), "MANUAL").path("processedCount").asInt());
  }

  @Test
  void scheduledTickExecutesOnlyDueEnabledTaskAndAdvancesAfterFailure() {
    ObjectNode task = task("CCMAX_STATUS_SYNC");
    String key = task.path("key").asText();
    jobs.update(key, s.object().put("enabled", true));
    jobs.tick();
    assertTrue(requests.isEmpty());
    assertEquals("TASK_NOT_DUE", jobs.run(key, "SCHEDULE").path("resultCode").asText());
    assertTrue(requests.isEmpty());
    s.update("scheduled-task", key, null, s.object().put("nextRunAt", Instant.EPOCH.toString()));
    httpStatus.set(500);
    jobs.tick();
    assertEquals(1, requests.size());
    ObjectNode updated = s.get("scheduled-task", key, null);
    assertEquals("FAILED", updated.path("lastState").asText());
    assertFalse(updated.path("running").asBoolean());
    assertTrue(Instant.parse(updated.path("nextRunAt").asText()).isAfter(Instant.now()));
    jobs.tick();
    assertEquals(1, requests.size());
    jobs.update(key, s.object().put("enabled", false));
    s.update("scheduled-task", key, null, s.object().put("nextRunAt", Instant.EPOCH.toString()));
    jobs.tick();
    assertEquals(1, requests.size());
  }

  @Test
  @Transactional(propagation = Propagation.NOT_SUPPORTED)
  void concurrentRunsAndConfigurationWritesAreRejectedBeforeAnotherRequest() throws Exception {
    ObjectNode task = task("CCMAX_STATUS_SYNC");
    String key = task.path("key").asText();
    ExecutorService worker = Executors.newSingleThreadExecutor();
    blockStatus.set(true);
    try {
      Future<ObjectNode> running = worker.submit(() -> jobs.run(key, "MANUAL"));
      assertTrue(requestEntered.await(3, TimeUnit.SECONDS));
      assertEquals("JOB_ALREADY_RUNNING",
          assertThrows(ApiException.class, () -> jobs.run(key, "MANUAL")).code);
      assertEquals(409, assertThrows(ApiException.class,
          () -> jobs.update(key, s.object().put("name", "Concurrent update"))).status);
      assertEquals(1, requests.size());
      releaseRequest.countDown();
      assertEquals("SUCCESS", running.get(3, TimeUnit.SECONDS).path("state").asText());
      assertFalse(s.get("scheduled-task", key, null).path("running").asBoolean());
      assertEquals(1, s.list("scheduled-run", null).stream().filter(r -> r.path("taskKey").asText().equals(key)).count());
    } finally {
      releaseRequest.countDown();
      worker.shutdownNow();
      worker.awaitTermination(4, TimeUnit.SECONDS);
      s.jdbc.update("delete from hub_entity where kind='scheduled-run' and data->>'taskKey'=?", key);
      s.jdbc.update("delete from hub_entity where kind='scheduled-task' and id=?", key);
    }
  }

  @Test
  void abandonedRunIsMarkedTimedOutBeforeNextRun() {
    ObjectNode task = task("CCMAX_STATUS_SYNC");
    String key = task.path("key").asText();
    ObjectNode abandoned = s.create("scheduled-run", "GLOBAL", s.object()
        .put("taskKey", key).put("state", "RUNNING").put("startedAt", Instant.EPOCH.toString()));
    assertEquals("SUCCESS", jobs.run(key, "MANUAL").path("state").asText());
    ObjectNode recovered = s.get("scheduled-run", abandoned.path("id").asText(), null);
    assertEquals("TIMED_OUT", recovered.path("state").asText());
    assertEquals("LEASE_LOST", recovered.path("resultCode").asText());
    assertFalse(recovered.path("finishedAt").asText().isBlank());
  }

  @Test
  void readinessRequiresCustomConfiguredAdapterAndValidRotationPolicy() {
    ObjectNode task = rotation("ROTATION");
    assertTrue(jobs.describe(task).path("ready").asBoolean());
    s.update("resource-target", target, null, s.object().put("protocol", "NEWAPI"));
    assertFalse(jobs.describe(task).path("ready").asBoolean());
    assertEquals(
        503,
        assertThrows(
                ApiException.class,
                () -> jobs.update(task.path("key").asText(), s.object().put("enabled", true)))
            .status);
    assertTrue(requests.isEmpty());
  }

  @Test
  void wecomCredentialsAreEncryptedAndPayloadIsAggregateOnlyWithNoDuplicateSpam() {
    ObjectNode task = task("WORKBENCH_WECOM_REMINDER");
    for (ObjectNode config : s.list("reminder-settings", null))
      s.delete("reminder-settings", config.path("id").asText(), null);
    assertFalse(jobs.describe(task).path("ready").asBoolean());
    String secret = "fixture-private-robot-key";
    ObjectNode settings =
        wecom.save(
            s.object()
                .put(
                    "webhookUrl",
                    "http://127.0.0.1:"
                        + server.getAddress().getPort()
                        + "/cgi-bin/webhook/send?key="
                        + secret)
                .put("workbenchUrl", "https://example.com/#/workbench"));
    assertTrue(settings.path("configured").asBoolean());
    assertEquals("", settings.path("webhookUrl").asText());
    assertFalse(settings.toString().contains(secret));
    assertFalse(s.list("reminder-settings", null).get(0).toString().contains(secret));
    s.create(
        "quote",
        owner,
        s.object().put("state", "PENDING").put("supplierId", owner).put("title", "PRIVATE-NAME"));
    ObjectNode run = jobs.run(task.path("key").asText(), "MANUAL");
    assertEquals("SENT", run.path("resultCode").asText());
    assertEquals("markdown", seenPayload.get().path("msgtype").asText());
    assertTrue(seenPayload.get().path("markdown").path("content").asText().contains("新报价待审"));
    assertFalse(seenPayload.get().toString().contains("PRIVATE-NAME"));
    int count = requests.size();
    assertEquals(
        "DUPLICATE_SUPPRESSED",
        jobs.run(task.path("key").asText(), "MANUAL").path("resultCode").asText());
    assertEquals(count, requests.size());
    String configId = s.list("reminder-settings", null).get(0).path("id").asText();
    s.update(
        "reminder-settings",
        configId,
        null,
        s.object().put("lastAttemptAt", Instant.EPOCH.toString()));
    wecomResponse.set("{\"errcode\":93000,\"errmsg\":\"fixture rejection\"}");
    assertEquals(
        "WECOM_REJECTED",
        jobs.run(task.path("key").asText(), "MANUAL").path("resultCode").asText());
    assertEquals(
        "DUPLICATE_SUPPRESSED",
        jobs.run(task.path("key").asText(), "MANUAL").path("resultCode").asText());
    s.update(
        "reminder-settings",
        configId,
        null,
        s.object().put("lastAttemptAt", Instant.EPOCH.toString()));
    httpStatus.set(500);
    assertEquals(
        "WECOM_HTTP_ERROR",
        jobs.run(task.path("key").asText(), "MANUAL").path("resultCode").asText());
    s.update(
        "reminder-settings",
        configId,
        null,
        s.object().put("lastAttemptAt", Instant.EPOCH.toString()));
    httpStatus.set(200);
    wecomResponse.set("{\"errmsg\":\"missing result\"}");
    assertEquals(
        "WECOM_INVALID_RESPONSE",
        jobs.run(task.path("key").asText(), "MANUAL").path("resultCode").asText());
    assertFalse(wecom.save(s.object().put("clearWebhook", true)).path("configured").asBoolean());
    assertThrows(
        ApiException.class,
        () ->
            wecom.save(
                s.object()
                    .put("webhookUrl", "https://example.com/cgi-bin/webhook/send?key=123456")));
  }
}
