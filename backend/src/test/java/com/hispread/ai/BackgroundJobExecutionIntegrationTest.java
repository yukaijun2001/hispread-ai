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
    assertEquals("SUCCESS", jobs.run(task.path("key").asText(), "MANUAL").path("state").asText());
    assertEquals(70, s.get("resource", r1, owner).path("priority").asInt());
    httpStatus.set(503);
    assertEquals(
        "RESOURCE_UPSTREAM_HTTP_ERROR",
        jobs.run(task.path("key").asText(), "MANUAL").path("resultCode").asText());
  }

  @Test
  void scheduledTickExecutesOnlyDueEnabledTaskAndAdvancesAfterFailure() {
    ObjectNode task = task("CCMAX_STATUS_SYNC");
    String key = task.path("key").asText();
    jobs.update(key, s.object().put("version", 0).put("enabled", true));
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
    jobs.update(key, s.object().put("version", s.get("scheduled-task", key, null).path("version").asLong()).put("enabled", false));
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
  void retiredJobsCannotExecuteOrBeReenabledEvenIfDatabaseFlagsRemainEnabled() {
    for (String type : List.of("CCMAX_DAILY_SYNC", "CCMAX_PRIORITY_ROTATION", "QUOTE_AUTO_RENEWAL",
        "WORKBENCH_WECOM_REMINDER", "SETTLEMENT_AUTO_CONFIRM", "SETTLEMENT_DEADLINE_CONFIRM")) {
      ObjectNode task = task(type);
      String key = task.path("key").asText();
      s.update("scheduled-task", key, null, s.object().put("enabled", true).put("nextRunAt", Instant.EPOCH.toString()));
      assertFalse(jobs.describe(s.get("scheduled-task", key, null)).path("ready").asBoolean());
      assertEquals(410, assertThrows(ApiException.class, () -> jobs.run(key, "MANUAL")).status);
      assertEquals(410, assertThrows(ApiException.class,
          () -> jobs.update(key, s.object().put("version", 1).put("enabled", true))).status);
    }
    jobs.tick();
    assertTrue(requests.isEmpty());
    assertTrue(s.list("scheduled-run", null).isEmpty());
    assertTrue(s.list("input", owner).isEmpty());
    assertTrue(s.list("settlement", owner).isEmpty());
  }

  @Test
  void optionalStatusSyncDoesNotWriteCostsOrWeightsAndDoesNotCollectDailyLogs() {
    ObjectNode task = task("CCMAX_STATUS_SYNC");
    s.update("resource", r1, owner, s.object().set("usage", s.object().put("amount", "123").put("currency", "USD")));
    ObjectNode run = jobs.run(task.path("key").asText(), "MANUAL");
    assertEquals("SUCCESS", run.path("state").asText());
    assertEquals("DELIVERY_STATUS_SYNCED", run.path("resultCode").asText());
    assertTrue(seenPayload.get().path("deliveryStatusOnly").asBoolean());
    assertEquals("123", s.get("resource", r1, owner).path("usage").path("amount").asText());
    assertEquals(70, s.get("resource", r1, owner).path("priority").asInt());
    assertTrue(s.list("input", owner).isEmpty());
    assertTrue(s.list("bill", owner).isEmpty());
    assertTrue(s.list("supplier-usage-snapshot", owner).isEmpty());
    assertEquals(List.of("/api/jobs/ccmax/status-sync"), requests);
  }

  @Test
  void legacyPrioritySnapshotCanOnlyBeExplicitlyRestoredWithoutStartingANewRound() {
    ObjectNode task = rotation("ROTATION");
    String key = task.path("key").asText();
    priorities.put(r1, 10);
    ObjectNode round = s.object().put("taskKey", key).put("supplierId", owner)
        .put("targetId", target).put("state", "ACTIVE");
    round.putArray("items").add(s.object().put("resourceId", r1).put("supplierId", owner)
        .put("originalPriority", 70).put("priority", 10).put("boostState", "SUCCESS").put("restored", false));
    s.create("priority-round", owner, round);
    assertEquals(410, assertThrows(ApiException.class, () -> jobs.run(key, "MANUAL")).status);
    assertTrue(requests.isEmpty());
    assertEquals(1, jobs.retryRestore(key).path("restored").asInt());
    assertEquals(70, priorities.get(r1));
    assertEquals(0, jobs.retryRestore(key).path("restored").asInt());
    assertEquals(1, requests.size());
    assertEquals(1, s.list("priority-round", owner).size());
  }

}
