package com.hispread.ai;

import static org.junit.jupiter.api.Assertions.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import com.sun.net.httpserver.HttpServer;
import java.net.InetSocketAddress;
import java.nio.charset.StandardCharsets;
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

/** Real HTTP requests without a surrounding test transaction: intent must commit before send. */
@SpringBootTest(properties = {"app.integrations.allow-private-targets=true"})
@ActiveProfiles("test")
@AutoConfigureMockMvc
class ResourcePriorityDurabilityIntegrationTest {
  @Autowired Store store;
  @Autowired AuthService auth;
  @Autowired MockMvc mvc;
  HttpServer upstream;
  ExecutorService executor;
  MockHttpSession session;
  String csrf, owner, targetId, userId, first, second;
  List<String> jobs;
  Map<String, Integer> weights, writes;
  Map<String, String> accountStates;
  AtomicReference<String> blockedAccount;
  AtomicBoolean rejectSecond;
  CountDownLatch received, release;

  @BeforeEach
  void setup() throws Exception {
    String suffix = UUID.randomUUID().toString();
    owner = "priority-owner-" + suffix;
    targetId = "priority-target-" + suffix;
    userId = "priority-admin-" + suffix;
    first = "priority-first-" + suffix;
    second = "priority-second-" + suffix;
    jobs = new ArrayList<>();
    weights = new ConcurrentHashMap<>(Map.of("first", 10, "second", 10));
    writes = new ConcurrentHashMap<>();
    accountStates = new ConcurrentHashMap<>(Map.of("first", "active", "second", "active"));
    blockedAccount = new AtomicReference<>("first");
    rejectSecond = new AtomicBoolean(false);
    received = new CountDownLatch(1);
    release = new CountDownLatch(1);
    executor = Executors.newCachedThreadPool();
    upstream = HttpServer.create(new InetSocketAddress("127.0.0.1", 0), 0);
    upstream.setExecutor(executor);
    upstream.createContext("/", exchange -> {
      String path = exchange.getRequestURI().getPath();
      String method = exchange.getRequestMethod();
      ObjectNode response = store.object();
      int status = 200;
      if (path.equals("/api/auth/admin-login")) {
        response.put("access_token", "FIXTURE-PRIVATE").putObject("user").put("role", "admin");
      } else if (path.startsWith("/api/admin/oauth-accounts/")) {
        String account = path.substring("/api/admin/oauth-accounts/".length());
        if (method.equals("PATCH")) {
          JsonNode input = store.json.readTree(exchange.getRequestBody());
          writes.merge(account, 1, Integer::sum);
          if (account.equals("second") && rejectSecond.get()) {
            status = 422;
            response.put("error", "fixture rejection");
          } else {
            if (input.has("weight")) weights.put(account, input.path("weight").asInt());
            if (input.has("status")) accountStates.put(account, input.path("status").asText());
            if (account.equals(blockedAccount.get())) {
              received.countDown();
              try {
                if (!release.await(10, TimeUnit.SECONDS)) throw new IllegalStateException("fixture timeout");
              } catch (InterruptedException interrupted) {
                Thread.currentThread().interrupt();
              }
            }
            response.put("ok", true);
          }
        } else {
          response.putObject("account").put("id", account).put("status", accountStates.get(account))
              .put("weight", weights.get(account));
        }
      } else {
        status = 404;
      }
      byte[] bytes = response.toString().getBytes(StandardCharsets.UTF_8);
      exchange.getResponseHeaders().set("Content-Type", "application/json");
      exchange.sendResponseHeaders(status, bytes.length);
      exchange.getResponseBody().write(bytes);
      exchange.close();
    });
    upstream.start();
    ObjectNode user = store.object().put("id", userId).put("username", userId)
        .put("displayName", "Durability fixture").put("role", "ADMIN")
        .put("mustChangePassword", false).put("onboardingRequired", false).put("version", 0);
    user.set("permissions", auth.allPermissions());
    auth.createUser(user, "Fixture@Password123");
    session = new MockHttpSession();
    session.setAttribute("uid", userId);
    session.setAttribute("sv", 0L);
    var response = mvc.perform(get("/api/auth/csrf").session(session)).andReturn();
    csrf = store.json.readTree(response.getResponse().getContentAsString()).path("token").asText();
    store.create("supplier", owner, store.object().put("id", owner).put("supplierId", owner)
        .put("state", "APPROVED").put("enabled", true));
    store.create("resource-target", "GLOBAL", store.object().put("id", targetId)
        .put("protocol", "CCMAX_NATIVE").put("enabled", true).put("allowHttp", true)
        .put("baseUrl", "http://127.0.0.1:" + upstream.getAddress().getPort())
        .put("adminUsername", "fixture").put("adminPassword", "FIXTURE-PRIVATE"));
    for (String[] row : List.of(new String[] {first, "first"}, new String[] {second, "second"}))
      store.create("resource", owner, store.object().put("id", row[0]).put("supplierId", owner)
          .put("resourceType", "CCMAX").put("upstreamProtocol", "CCMAX_NATIVE")
          .put("operationalState", "ACTIVE").put("targetId", targetId).put("upstreamAccountId", row[1]));
  }

  @AfterEach
  void cleanup() throws Exception {
    release.countDown();
    executor.shutdown();
    executor.awaitTermination(10, TimeUnit.SECONDS);
    upstream.stop(0);
    for (String id : jobs) store.jdbc.update("delete from hub_entity where kind='resource-operation' and id=?", id);
    store.jdbc.update("delete from hub_entity where owner_id=? or id=?", owner, targetId);
    store.jdbc.update("delete from hub_user where id=?", userId);
  }

  ObjectNode postJson(String path, ObjectNode input, int status) throws Exception {
    var response = mvc.perform(post(path).session(session).header("X-CSRF-TOKEN", csrf)
            .contentType("application/json").content(input.toString()))
        .andExpect(status().is(status)).andReturn();
    return store.parse(response.getResponse().getContentAsString());
  }

  String preview() throws Exception {
    ObjectNode input = store.object().put("targetId", targetId).put("priority", 11)
        .put("requestKey", UUID.randomUUID().toString());
    input.putArray("resourceIds").add(first).add(second);
    ObjectNode preview = postJson("/api/cc-intake/admin/priority/jobs", input, 200);
    String id = preview.path("id").asText();
    jobs.add(id);
    return id;
  }

  CompletableFuture<ObjectNode> run(String path) {
    return CompletableFuture.supplyAsync(() -> {
      try { return postJson(path, store.object(), 200); }
      catch (Exception failure) { throw new CompletionException(failure); }
    }, executor);
  }

  @Test
  void commitsUnknownBeforeSendAndRejectsConcurrentStartRetryAndReconcile() throws Exception {
    String id = preview(), path = "/api/cc-intake/admin/priority/jobs/" + id;
    CompletableFuture<ObjectNode> running = run(path + "/start");
    try {
      assertTrue(received.await(5, TimeUnit.SECONDS));
      ObjectNode committed = store.get("resource-operation", id, "GLOBAL");
      assertEquals("UNKNOWN", committed.path("state").asText());
      assertEquals(2, committed.path("result").path("counts").path("UNKNOWN").asInt());
      mvc.perform(get(path).session(session)).andExpect(status().isOk())
          .andExpect(jsonPath("$.state").value("UNKNOWN"));
      for (String action : List.of("start", "retry", "reconcile"))
        assertEquals("RESOURCE_JOB_ALREADY_RUNNING", postJson(path + "/" + action, store.object(), 409).path("code").asText());
    } finally {
      release.countDown();
    }
    assertEquals("COMPLETED", running.get(10, TimeUnit.SECONDS).path("state").asText());
    postJson(path + "/start", store.object(), 200);
    postJson(path + "/retry", store.object(), 200);
    postJson(path + "/reconcile", store.object(), 200);
    assertEquals(1, writes.get("first"));
    assertEquals(1, writes.get("second"));
  }

  @Test
  void retryCommitsOnlyFailedItemsAsUnknownAndPreservesSuccessfulItems() throws Exception {
    blockedAccount.set("");
    rejectSecond.set(true);
    String id = preview(), path = "/api/cc-intake/admin/priority/jobs/" + id;
    assertEquals("PARTIAL_FAILED", postJson(path + "/start", store.object(), 200).path("state").asText());
    rejectSecond.set(false);
    blockedAccount.set("second");
    CompletableFuture<ObjectNode> retry = run(path + "/retry");
    try {
      assertTrue(received.await(5, TimeUnit.SECONDS));
      ObjectNode committed = store.get("resource-operation", id, "GLOBAL");
      assertEquals("UNKNOWN", committed.path("state").asText());
      assertEquals(1, committed.path("result").path("counts").path("SUCCESS").asInt());
      assertEquals(1, committed.path("result").path("counts").path("UNKNOWN").asInt());
      assertEquals(0, committed.path("result").path("counts").path("FAILED").asInt());
      assertEquals("RESOURCE_JOB_ALREADY_RUNNING", postJson(path + "/retry", store.object(), 409).path("code").asText());
    } finally {
      release.countDown();
    }
    assertEquals("COMPLETED", retry.get(10, TimeUnit.SECONDS).path("state").asText());
    postJson(path + "/retry", store.object(), 200);
    assertEquals(1, writes.get("first"));
    assertEquals(2, writes.get("second"));
  }

  @Test
  void successfulRemoteWriteCannotBeProjectedToChangedLocalMapping() throws Exception {
    String id = preview(), path = "/api/cc-intake/admin/priority/jobs/" + id;
    CompletableFuture<ObjectNode> running = run(path + "/start");
    try {
      assertTrue(received.await(5, TimeUnit.SECONDS));
      store.update("resource", first, owner, store.object().put("upstreamAccountId", "replaced-account"));
    } finally {
      release.countDown();
    }
    ObjectNode result = running.get(10, TimeUnit.SECONDS);
    assertEquals("UNKNOWN", result.path("state").asText());
    JsonNode changed = null;
    for (JsonNode item : result.path("items"))
      if (item.path("resourceId").asText().equals(first)) changed = item;
    assertNotNull(changed);
    assertEquals("RESOURCE_MAPPING_CHANGED", changed.path("errorCode").asText());
    assertFalse(store.get("resource", first, owner).has("upstreamPriority"));
    assertEquals(1, writes.get("first"));
    assertEquals(1, writes.get("second"));
  }

  @Test
  void legacyPreviewWithoutDurableIntentCannotBeBlindlyStarted() throws Exception {
    String id = preview(), path = "/api/cc-intake/admin/priority/jobs/" + id;
    store.update("resource-operation", id, "GLOBAL", store.object().putNull("writeIntentVersion"));
    ObjectNode result = postJson(path + "/start", store.object(), 200);
    assertEquals("UNKNOWN", result.path("state").asText());
    assertTrue(writes.isEmpty());
    postJson(path + "/retry", store.object(), 200);
    assertTrue(writes.isEmpty());
    weights.put("first", 11);
    weights.put("second", 11);
    assertEquals("COMPLETED", postJson(path + "/reconcile", store.object(), 200).path("state").asText());
    assertTrue(writes.isEmpty());
  }

  ObjectNode lifecycleInput() {
    ObjectNode input = store.object().put("requestKey", UUID.randomUUID().toString()).put("action", "PAUSE");
    input.putArray("items").addObject().put("resourceId", first).put("resourceVersion", 0);
    return input;
  }

  CompletableFuture<ObjectNode> lifecycleRun(ObjectNode input) {
    return CompletableFuture.supplyAsync(() -> {
      try { return postJson("/api/resource-lifecycle-jobs", input, 200); }
      catch (Exception failure) { throw new CompletionException(failure); }
    }, executor);
  }

  ObjectNode findLifecycle(ObjectNode input) {
    return store.list("resource-operation", owner).stream()
        .filter(x -> x.path("requestKey").equals(input.path("requestKey")))
        .findFirst().orElseThrow();
  }

  @Test
  void lifecycleIntentCommitsBeforeSendAndReplayNeverRepeatsAcceptedPause() throws Exception {
    ObjectNode input = lifecycleInput();
    CompletableFuture<ObjectNode> running = lifecycleRun(input);
    String path;
    try {
      assertTrue(received.await(5, TimeUnit.SECONDS));
      ObjectNode committed = findLifecycle(input);
      assertEquals("UNKNOWN", committed.path("state").asText());
      assertEquals(1, committed.path("result").path("unknownCount").asInt());
      path = "/api/resource-lifecycle-jobs/" + committed.path("id").asText();
      mvc.perform(get(path).session(session)).andExpect(status().isOk())
          .andExpect(jsonPath("$.state").value("UNKNOWN"))
          .andExpect(jsonPath("$.lifecycleBindings").doesNotExist());
      assertEquals("RESOURCE_JOB_ALREADY_RUNNING",
          postJson("/api/resource-lifecycle-jobs", input, 409).path("code").asText());
      assertEquals("RESOURCE_JOB_ALREADY_RUNNING",
          postJson(path + "/reconcile", store.object(), 409).path("code").asText());
    } finally {
      release.countDown();
    }
    ObjectNode finished = running.get(10, TimeUnit.SECONDS);
    assertEquals("COMPLETED", finished.path("state").asText());
    assertEquals("PAUSED", store.get("resource", first, owner).path("operationalState").asText());
    long version = store.get("resource", first, owner).path("version").asLong();
    ObjectNode replay = postJson("/api/resource-lifecycle-jobs", input, 200);
    assertEquals(finished.path("id"), replay.path("id"));
    assertEquals(version, store.get("resource", first, owner).path("version").asLong());
    assertEquals("IDEMPOTENCY_CONFLICT", postJson("/api/resource-lifecycle-jobs",
        input.deepCopy().put("action", "RESUME"), 409).path("code").asText());
    postJson("/api/resource-lifecycle-jobs/" + finished.path("id").asText() + "/reconcile", store.object(), 200);
    assertEquals(1, writes.get("first"));
  }

  @Test
  void lifecycleCannotApplyOrReconcileSuccessfulPauseAgainstAReplacementAccount() throws Exception {
    ObjectNode input = lifecycleInput();
    CompletableFuture<ObjectNode> running = lifecycleRun(input);
    try {
      assertTrue(received.await(5, TimeUnit.SECONDS));
      store.update("resource", first, owner, store.object().put("upstreamAccountId", "replacement"));
    } finally {
      release.countDown();
    }
    ObjectNode finished = running.get(10, TimeUnit.SECONDS);
    assertEquals("UNKNOWN", finished.path("state").asText());
    assertEquals("RESOURCE_MAPPING_CHANGED", finished.path("items").path(0).path("errorCode").asText());
    assertEquals("ACTIVE", store.get("resource", first, owner).path("operationalState").asText());
    assertEquals("RESOURCE_MAPPING_CHANGED", postJson("/api/resource-lifecycle-jobs/"
        + finished.path("id").asText() + "/reconcile", store.object(), 409).path("code").asText());
    assertEquals(1, writes.get("first"));
    assertEquals("UNKNOWN", findLifecycle(input).path("state").asText());
  }
}
