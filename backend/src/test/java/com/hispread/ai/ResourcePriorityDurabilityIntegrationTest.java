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
  @Autowired ResourceIntegrationGateway gateway;
  @Autowired CcmaxIntakeControls intakeControlService;
  @Autowired org.springframework.transaction.PlatformTransactionManager transactionManager;
  HttpServer upstream;
  ExecutorService executor;
  MockHttpSession session;
  String csrf, owner, targetId, userId, first, second;
  List<String> jobs;
  Map<String, Integer> weights, writes;
  Map<String, Integer> refreshes;
  Map<String, Integer> exchanges;
  Map<String, String> accountStates;
  AtomicReference<String> blockedAccount;
  AtomicReference<String> blockedReadAccount;
  AtomicBoolean rejectSecond;
  AtomicBoolean denyAccountRead;
  AtomicLong loginDelayMs, exchangeDelayMs;
  AtomicLong accountBodyDelayMs;
  AtomicReference<String> fixturePlan;
  List<ObjectNode> originalSettings;
  CountDownLatch received, release, loginReceived;

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
    refreshes = new ConcurrentHashMap<>();
    exchanges = new ConcurrentHashMap<>();
    accountStates = new ConcurrentHashMap<>(Map.of("first", "active", "second", "active"));
    blockedAccount = new AtomicReference<>("first");
    blockedReadAccount = new AtomicReference<>("");
    rejectSecond = new AtomicBoolean(false);
    denyAccountRead = new AtomicBoolean(false);
    loginDelayMs = new AtomicLong();
    exchangeDelayMs = new AtomicLong();
    accountBodyDelayMs = new AtomicLong();
    fixturePlan = new AtomicReference<>("max");
    originalSettings = store.list("settings", null);
    received = new CountDownLatch(1);
    release = new CountDownLatch(1);
    loginReceived = new CountDownLatch(1);
    executor = Executors.newCachedThreadPool();
    upstream = HttpServer.create(new InetSocketAddress("127.0.0.1", 0), 0);
    upstream.setExecutor(executor);
    upstream.createContext("/", exchange -> {
      String path = exchange.getRequestURI().getPath();
      String method = exchange.getRequestMethod();
      ObjectNode response = store.object();
      int status = 200;
      if (path.equals("/api/auth/admin-login")) {
        loginReceived.countDown();
        if (loginDelayMs.get() > 0) {
          try { Thread.sleep(loginDelayMs.get()); }
          catch (InterruptedException interrupted) { Thread.currentThread().interrupt(); }
        }
        response.put("access_token", "FIXTURE-PRIVATE").putObject("user").put("role", "admin");
      } else if (path.equals("/api/admin/request-logs")) {
        response.putArray("logs"); response.putNull("cursor");
      } else if (path.equals("/api/admin/oauth-accounts/auth-url")) {
        response.put("url", "https://claude.ai/oauth/authorize?state=fixture-state")
            .put("state", "fixture-state").put("expires_in", 600);
      } else if (path.equals("/api/admin/oauth-accounts")) {
        response.putArray("accounts");
        response.putObject("pagination").put("total_pages", 1);
      } else if (path.equals("/api/admin/oauth-accounts/exchange")) {
        JsonNode input = store.json.readTree(exchange.getRequestBody());
        String account = input.path("code").asText().startsWith("second") ? "second" : "first";
        exchanges.merge(account, 1, Integer::sum);
        accountStates.put(account, input.path("status").asText("active"));
        weights.put(account, input.path("weight").asInt(10));
        received.countDown();
        try { release.await(exchangeDelayMs.get() > 0 ? exchangeDelayMs.get() : 10000, TimeUnit.MILLISECONDS); }
        catch (InterruptedException interrupted) { Thread.currentThread().interrupt(); }
        response.putObject("account").put("id", account).put("status", "active");
      } else if (path.startsWith("/api/admin/oauth-accounts/")) {
        String account = path.substring("/api/admin/oauth-accounts/".length());
        if (method.equals("POST") && account.endsWith("/reauthorize")) {
          response.put("url", "https://claude.ai/oauth/authorize?state=fixture-state")
              .put("state", "fixture-state").put("expires_in", 600);
        } else if (method.equals("POST") && account.endsWith("/reauthorize/exchange")) {
          account = account.substring(0, account.length() - "/reauthorize/exchange".length());
          exchanges.merge(account, 1, Integer::sum);
          received.countDown();
          try { release.await(10, TimeUnit.SECONDS); }
          catch (InterruptedException interrupted) { Thread.currentThread().interrupt(); }
          response.putObject("account").put("id", account).put("status", "active");
        } else if (method.equals("POST") && account.endsWith("/refresh")) {
          account = account.substring(0, account.length() - "/refresh".length());
          refreshes.merge(account, 1, Integer::sum);
          if (account.equals(blockedAccount.get())) {
            received.countDown();
            try { release.await(10, TimeUnit.SECONDS); }
            catch (InterruptedException interrupted) { Thread.currentThread().interrupt(); }
          }
          response.put("ok", true);
        } else if (method.equals("PATCH")) {
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
        } else if (denyAccountRead.get()) {
          status = 403;
          response.put("error", "fixture read denied");
        } else {
          if (account.equals(blockedReadAccount.get())) {
            received.countDown();
            try { release.await(10, TimeUnit.SECONDS); }
            catch (InterruptedException interrupted) { Thread.currentThread().interrupt(); }
          }
          ObjectNode observed = response.putObject("account").put("id", account).put("status", accountStates.get(account))
              .put("weight", weights.get(account));
          observed.putObject("subscription_info").put("plan", fixturePlan.get());
        }
      } else {
        status = 404;
      }
      byte[] bytes = response.toString().getBytes(StandardCharsets.UTF_8);
      exchange.getResponseHeaders().set("Content-Type", "application/json");
      exchange.sendResponseHeaders(status, bytes.length);
      if (method.equals("GET") && path.equals("/api/admin/oauth-accounts/first") && accountBodyDelayMs.get() > 0) {
        try { Thread.sleep(accountBodyDelayMs.get()); }
        catch (InterruptedException interrupted) { Thread.currentThread().interrupt(); }
      }
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
    store.jdbc.update("delete from hub_entity where kind='native-oauth' and data->>'targetId'=?", targetId);
    for (String id : jobs) store.jdbc.update("delete from hub_entity where kind='resource-operation' and id=?", id);
    store.jdbc.update("delete from hub_entity where owner_id=? or id=?", owner, targetId);
    store.jdbc.update("delete from hub_user where id=?", userId);
    store.jdbc.update("delete from hub_entity where kind='settings'");
    for (ObjectNode settings : originalSettings)
      store.jdbc.update("insert into hub_entity(id,kind,owner_id,data,version) values(?,'settings','GLOBAL',cast(? as jsonb),?)",
          settings.path("id").asText(), settings.toString(), settings.path("version").asLong());
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

  @Test
  void credentialRefreshCommitsIntentAndSerializesReplayNewKeysAndReadback() throws Exception {
    String path = "/api/resources/" + first + "/credential-refresh";
    ObjectNode input = store.object().put("requestKey", UUID.randomUUID().toString());
    CompletableFuture<ObjectNode> running = CompletableFuture.supplyAsync(() -> {
      try { return postJson(path, input, 200); }
      catch (Exception failure) { throw new CompletionException(failure); }
    }, executor);
    String operationId;
    try {
      assertTrue(received.await(5, TimeUnit.SECONDS));
      ObjectNode intent = findLifecycle(input);
      operationId = intent.path("id").asText();
      assertEquals("UNKNOWN", intent.path("state").asText());
      mvc.perform(get(path).session(session)).andExpect(status().isOk())
          .andExpect(jsonPath("$.state").value("UNKNOWN"))
          .andExpect(jsonPath("$.maintenanceBinding").doesNotExist());
      assertEquals("RESOURCE_JOB_ALREADY_RUNNING", postJson(path, input, 409).path("code").asText());
      assertEquals("RESOURCE_JOB_ALREADY_RUNNING", postJson(path,
          store.object().put("requestKey", UUID.randomUUID().toString()), 409).path("code").asText());
      assertEquals("RESOURCE_JOB_ALREADY_RUNNING", postJson("/api/resources/" + first + "/operations/"
          + operationId + "/reconcile", store.object(), 409).path("code").asText());
    } finally { release.countDown(); }
    ObjectNode finished = running.get(10, TimeUnit.SECONDS);
    assertEquals("UPDATED", finished.path("state").asText());
    long version = store.get("resource", first, owner).path("version").asLong();
    assertEquals(finished.path("operationId"), postJson(path, input, 200).path("operationId"));
    assertEquals(version, store.get("resource", first, owner).path("version").asLong());
    assertEquals("UPDATED", postJson("/api/resources/" + first + "/operations/" + operationId
        + "/reconcile", store.object(), 200).path("state").asText());
    assertEquals("IDEMPOTENCY_CONFLICT", postJson("/api/resources/" + second + "/credential-refresh",
        input, 409).path("code").asText());
    assertEquals(1, refreshes.get("first"));
    assertFalse(refreshes.containsKey("second"));
  }

  @Test
  void acceptedCredentialRefreshWithUnreadableReceiptStaysUnknownAndBlocksAnotherKey() throws Exception {
    blockedAccount.set("");
    denyAccountRead.set(true);
    String path = "/api/resources/" + first + "/credential-refresh";
    ObjectNode input = store.object().put("requestKey", UUID.randomUUID().toString());
    postJson(path, input, 502);
    ObjectNode intent = findLifecycle(input);
    String operation = "/api/resources/" + first + "/operations/" + intent.path("id").asText();
    assertEquals("UNKNOWN", intent.path("state").asText());
    assertEquals("UNKNOWN", postJson(path, input, 200).path("state").asText());
    assertEquals("RESOURCE_OPERATION_UNCERTAIN", postJson(path,
        store.object().put("requestKey", UUID.randomUUID().toString()), 409).path("code").asText());
    denyAccountRead.set(false);
    long version = store.get("resource", first, owner).path("version").asLong();
    ObjectNode checked = postJson(operation + "/reconcile", store.object(), 200);
    assertEquals("UNKNOWN", checked.path("state").asText());
    assertTrue(checked.path("message").asText().contains("无法"));
    assertEquals(version, store.get("resource", first, owner).path("version").asLong());
    mvc.perform(get("/api/resources/" + second + "/operations/" + intent.path("id").asText()).session(session))
        .andExpect(status().isNotFound());
    postJson("/api/resources/" + second + "/operations/" + intent.path("id").asText() + "/reconcile",
        store.object(), 404);
    store.update("resource", first, owner, store.object().put("upstreamAccountId", "replacement"));
    assertEquals("RESOURCE_MAPPING_CHANGED", postJson(operation + "/reconcile", store.object(), 409).path("code").asText());
    assertEquals(1, refreshes.get("first"));
  }

  @Test
  void oauthExchangeCommitsIntentAndSessionBeforeSendAndNeverAcceptsAnotherKey() throws Exception {
    store.update("resource", first, owner, store.object().put("laneId", "first"));
    String path = "/api/resources/" + first + "/reauthorizations";
    ObjectNode authorization = postJson(path, store.object().put("requestKey", UUID.randomUUID().toString()), 200);
    String id = authorization.path("id").asText();
    String completePath = path + "/" + id;
    ObjectNode input = store.object().put("requestKey", UUID.randomUUID().toString())
        .put("code", "fixture-code#fixture-state");
    CompletableFuture<ObjectNode> running = CompletableFuture.supplyAsync(() -> {
      try { return postJson(completePath, input, 200); }
      catch (Exception failure) { throw new CompletionException(failure); }
    }, executor);
    try {
      assertTrue(received.await(5, TimeUnit.SECONDS));
      ObjectNode intent = findLifecycle(input);
      assertEquals("UNKNOWN", intent.path("state").asText());
      ObjectNode nativeSession = store.get("native-oauth", intent.path("oauthNativeSessionId").asText(), "GLOBAL");
      assertEquals("SUBMITTING", nativeSession.path("state").asText());
      mvc.perform(get(path + "/current").session(session)).andExpect(status().isOk())
          .andExpect(jsonPath("$.state").value("UNKNOWN"))
          .andExpect(jsonPath("$.authUrl").doesNotExist());
      assertEquals("RESOURCE_JOB_ALREADY_RUNNING", postJson(completePath, input, 409).path("code").asText());
      assertEquals("RESOURCE_JOB_ALREADY_RUNNING", postJson(completePath,
          input.deepCopy().put("requestKey", UUID.randomUUID().toString()), 409).path("code").asText());
    } finally { release.countDown(); }
    ObjectNode complete = running.get(10, TimeUnit.SECONDS);
    assertEquals("SUCCESS", complete.path("state").asText());
    long version = store.get("resource", first, owner).path("version").asLong();
    assertEquals(complete.path("operationId"), postJson(completePath, input, 200).path("operationId"));
    postJson(completePath, input.deepCopy().put("requestKey", UUID.randomUUID().toString()), 409);
    assertEquals(version, store.get("resource", first, owner).path("version").asLong());
    assertEquals(1, exchanges.get("first"));
    assertFalse(complete.has("oauthNativeSessionId"));
    assertFalse(complete.has("oauthBinding"));
  }

  @Test
  void uncertainReauthorizationCannotCreateAnotherAuthorizationAndMappingChangesDoNotApplySuccess() throws Exception {
    store.update("resource", first, owner, store.object().put("laneId", "first"));
    String path = "/api/resources/" + first + "/reauthorizations";
    ObjectNode authorization = postJson(path, store.object().put("requestKey", UUID.randomUUID().toString()), 200);
    ObjectNode input = store.object().put("requestKey", UUID.randomUUID().toString()).put("code", "fixture#fixture-state");
    CompletableFuture<ObjectNode> running = CompletableFuture.supplyAsync(() -> {
      try { return postJson(path + "/" + authorization.path("id").asText(), input, 200); }
      catch (Exception failure) { throw new CompletionException(failure); }
    }, executor);
    try {
      assertTrue(received.await(5, TimeUnit.SECONDS));
      assertEquals("RESOURCE_OPERATION_UNCERTAIN", postJson(path,
          store.object().put("requestKey", UUID.randomUUID().toString()), 409).path("code").asText());
      assertEquals("RESOURCE_OPERATION_UNCERTAIN", postJson("/api/resources/" + first + "/oauth/authorize",
          store.object().put("requestKey", UUID.randomUUID().toString()), 409).path("code").asText());
      store.update("resource", first, owner, store.object().put("upstreamAccountId", "replacement").put("laneId", "replacement"));
    } finally { release.countDown(); }
    ObjectNode result = running.get(10, TimeUnit.SECONDS);
    assertEquals("UNKNOWN", result.path("state").asText());
    assertEquals("RESOURCE_MAPPING_CHANGED", result.path("errorCode").asText());
    assertEquals("replacement", store.get("resource", first, owner).path("upstreamAccountId").asText());
    mvc.perform(get(path + "/current").session(session)).andExpect(status().isOk())
        .andExpect(jsonPath("$.state").value("UNKNOWN"));
    assertEquals(1, exchanges.get("first"));
  }

  String intakeSession(String rid) {
    store.update("resource", rid, owner, store.object().put("upstreamAccountId", "").put("laneId", "")
        .put("state", "DRAFT").put("dispatchState", "NOT_SUBMITTED"));
    String nativeId = UUID.randomUUID().toString();
    ObjectNode nativeSession = store.object().put("id", nativeId).put("targetId", targetId)
        .put("localResourceId", rid).put("state", "READY").put("pendingState", "fixture-state")
        .put("expiresAt", "2099-01-01T00:00:00Z").put("accountId", "");
    nativeSession.putArray("existingAccountIds");
    store.create("native-oauth", "GLOBAL", nativeSession);
    return store.create("resource-operation", owner, store.object().put("type", "OAUTH_AUTHORIZE")
        .put("supplierId", owner).put("resourceId", rid).put("targetId", targetId)
        .put("protocol", "CCMAX_NATIVE").put("upstreamId", nativeId).put("state", "READY")
        .put("requestKey", UUID.randomUUID().toString())).path("id").asText();
  }

  void intakeControls(int limit, int seconds) {
    store.jdbc.update("delete from hub_entity where kind='settings'");
    store.create("settings", "GLOBAL", store.object().put("ccmaxIntakeConcurrencyLimit", limit)
        .put("ccmaxCreationTimeoutSeconds", seconds).put("allowAllSuppliersCcmax", true));
    ObjectNode policy = store.object().put("nonProOpen", true);
    policy.putObject("nonPro").put("mode", "UNLIMITED");
    policy.putObject("ranges").putObject("NORMAL").put("min", 10).put("max", 10);
    store.create("intake-policy", "GLOBAL", store.object().put("id", owner).set("policy", policy));
  }

  CompletableFuture<ObjectNode> submitIntake(String authorization, String code, int status) {
    return CompletableFuture.supplyAsync(() -> {
      try { return postJson("/api/resources/oauth/supplier-submit", store.object()
          .put("sessionId", authorization).put("code", code + "#fixture-state"), status); }
      catch (Exception failure) { throw new CompletionException(failure); }
    }, executor);
  }

  @Test
  void supplierIntakeLimitRejectsSecondSessionBeforeExchangeAndReleasesConfirmedSlot() throws Exception {
    intakeControls(1, 30);
    String firstAuthorization = intakeSession(first), secondAuthorization = intakeSession(second);
    CompletableFuture<ObjectNode> running = submitIntake(firstAuthorization, "first-code", 200);
    try {
      assertTrue(received.await(5, TimeUnit.SECONDS));
      ObjectNode denied = postJson("/api/resources/oauth/supplier-submit", store.object()
          .put("sessionId", secondAuthorization).put("code", "second-code#fixture-state"), 409);
      assertEquals("CCMAX_INTAKE_CONCURRENCY_LIMIT", denied.path("code").asText());
      assertFalse(exchanges.containsKey("second"));
      String nativeId = store.get("resource-operation", secondAuthorization, owner).path("upstreamId").asText();
      assertEquals("READY", store.get("native-oauth", nativeId, "GLOBAL").path("state").asText());
      assertEquals("RESOURCE_JOB_ALREADY_RUNNING", postJson("/api/resources/" + first + "/creation-recovery",
          store.object().put("confirmedNotCreated", true).put("action", "EDIT")
              .put("version", store.get("resource", first, owner).path("version").asLong()), 409).path("code").asText());
    } finally { release.countDown(); }
    assertEquals("SUCCESS", running.get(10, TimeUnit.SECONDS).path("state").asText());
    assertEquals("SUCCESS", submitIntake(secondAuthorization, "second-code", 200).get(10, TimeUnit.SECONDS).path("state").asText());
    assertEquals(1, exchanges.get("first"));
    assertEquals(1, exchanges.get("second"));
  }

  @Test
  void dailyQuotaReservesBeforeExchangeAndAppliesFrozenPriorityExactlyOnce() throws Exception {
    intakeControls(5, 30);
    ObjectNode policy = store.get("intake-policy", owner, null);
    ((ObjectNode) policy.path("policy").path("nonPro")).put("mode", "LIMITED").put("quantity", 1);
    store.update("intake-policy", owner, null, store.object().set("policy", policy.path("policy")));
    String a = intakeSession(first), b = intakeSession(second);
    var running = submitIntake(a, "first-code", 200);
    try {
      assertTrue(received.await(5, TimeUnit.SECONDS));
      assertEquals("CCMAX_INTAKE_QUOTA_EXHAUSTED", postJson("/api/resources/oauth/supplier-submit",
          store.object().put("sessionId", b).put("code", "second-code#fixture-state"), 409).path("code").asText());
      assertFalse(exchanges.containsKey("second"));
      ObjectNode receipt = store.list("intake-ledger", owner).get(0);
      assertEquals("RESERVED", receipt.path("state").asText());
      assertEquals("disabled", accountStates.get("first"));
    } finally { release.countDown(); }
    ObjectNode complete = running.get(10, TimeUnit.SECONDS);
    assertEquals("SUCCESS", complete.path("state").asText());
    assertEquals("NON_PRO", complete.path("intakeCategory").asText());
    assertEquals(10, weights.get("first"));
    assertEquals("active", accountStates.get("first"));
    assertEquals("SUCCESS", store.list("intake-ledger", owner).get(0).path("state").asText());
    int patches = writes.get("first");
    submitIntake(a, "first-code", 200).get(5, TimeUnit.SECONDS);
    assertEquals(patches, writes.get("first")); assertEquals(1, exchanges.get("first"));
  }

  @Test
  void unallowedProOrUnknownPlanStaysDisabledAndReleasesQuotaWithoutDelivery() throws Exception {
    intakeControls(5, 30); release.countDown(); fixturePlan.set("pro");
    String a = intakeSession(first);
    ObjectNode rejected = submitIntake(a, "first-code", 200).get(5, TimeUnit.SECONDS);
    assertEquals("FAILED", rejected.path("state").asText());
    assertEquals("PRO_PLAN_NOT_ALLOWED", rejected.path("failureCode").asText());
    assertEquals("disabled", accountStates.get("first"));
    assertEquals("RELEASED", store.list("intake-ledger", owner).get(0).path("state").asText());
    assertEquals("FAILED", store.get("resource", first, owner).path("dispatchState").asText());
    assertNotEquals("DELIVERED", store.get("resource", first, owner).path("state").asText());
    assertFalse(writes.containsKey("first"));
    assertTrue(store.get("resource", first, owner).path("intakeQuarantined").asBoolean());
    ObjectNode resume = store.object().put("action", "RESUME").put("requestKey", UUID.randomUUID().toString());
    resume.putArray("items").addObject().put("resourceId", first);
    assertEquals("CCMAX_INTAKE_QUARANTINED", postJson("/api/resource-lifecycle-jobs", resume, 409).path("code").asText());
    assertEquals("CCMAX_INTAKE_QUARANTINED", postJson("/api/resources/" + first + "/reauthorizations", store.object(), 409).path("code").asText());
    fixturePlan.set("unknown");
    ObjectNode unknown = submitIntake(intakeSession(second), "second-code", 200).get(5, TimeUnit.SECONDS);
    assertEquals("FAILED", unknown.path("state").asText());
    assertEquals("PLAN_CHECK_FAILED", unknown.path("failureCode").asText());
    assertEquals("disabled", accountStates.get("second"));
  }

  @Test
  void permittedProIntakeConsumesOnlyProPoolAndUsesServerPriority() throws Exception {
    intakeControls(5, 30); release.countDown(); fixturePlan.set("pro");
    store.create("supplier-settings", "GLOBAL", store.object().put("id", owner).put("allowCcmax", true).put("allowPro", true));
    ObjectNode policy = store.get("intake-policy", owner, null);
    ((ObjectNode) policy.path("policy")).putObject("pro").put("mode", "LIMITED").put("quantity", 1);
    store.update("intake-policy", owner, null, store.object().set("policy", policy.path("policy")));
    String a = intakeSession(first);
    ObjectNode completed = submitIntake(a, "first-code", 200).get(5, TimeUnit.SECONDS);
    assertEquals("SUCCESS", completed.path("state").asText()); assertEquals("PRO", completed.path("intakeCategory").asText());
    assertEquals("PRO", store.list("intake-ledger", owner).get(0).path("category").asText());
    fixturePlan.set("max");
    assertEquals("SUCCESS", submitIntake(intakeSession(second), "second-code", 200).get(5, TimeUnit.SECONDS).path("state").asText());
    assertEquals(2, store.list("intake-ledger", owner).stream().filter(x -> x.path("state").asText().equals("SUCCESS")).count());
  }

  @Test
  void classifiedIntakeReadOnlyRecoverySettlesAcceptedActivationWithoutSecondExchange() throws Exception {
    intakeControls(5, 30); release.countDown();
    String a = intakeSession(first);
    ObjectNode completed = submitIntake(a, "first-code", 200).get(5, TimeUnit.SECONDS);
    String opId = completed.path("operationId").asText();
    ObjectNode op = store.get("resource-operation", opId, owner);
    store.update("resource-operation", opId, owner, store.object().put("state", "UNKNOWN"));
    store.update("intake-ledger", opId, owner, store.object().put("state", "CLASSIFIED"));
    store.update("resource", first, owner, store.object().put("state", "DRAFT").put("dispatchState", "UNKNOWN")
        .put("upstreamAccountId", "").put("laneId", ""));
    store.update("native-oauth", op.path("oauthNativeSessionId").asText(), "GLOBAL", store.object().put("state", "SUBMITTING"));
    int patches = writes.get("first");
    ObjectNode recovered = postJson("/api/resources/" + first + "/operations/" + opId + "/reconcile", store.object(), 200);
    assertEquals("SUCCESS", recovered.path("state").asText());
    assertEquals("SUCCESS", store.get("intake-ledger", opId, owner).path("state").asText());
    assertEquals(1, exchanges.get("first")); assertEquals(patches, writes.get("first"));
  }

  @Test
  void creationTimeoutCoversLoginAndExchangeAndPreservesUnknownWithoutResending() throws Exception {
    intakeControls(1, 1);
    loginDelayMs.set(650); exchangeDelayMs.set(650);
    String authorization = intakeSession(first);
    long began = System.nanoTime();
    ObjectNode failure = submitIntake(authorization, "first-code", 504).get(5, TimeUnit.SECONDS);
    assertEquals("CCMAX_CREATION_TIMEOUT", failure.path("code").asText());
    assertTrue(TimeUnit.NANOSECONDS.toMillis(System.nanoTime() - began) < 2500);
    ObjectNode replay = submitIntake(authorization, "first-code", 200).get(5, TimeUnit.SECONDS);
    assertEquals("UNKNOWN", replay.path("state").asText());
    assertEquals("UNKNOWN", store.get("resource", first, owner).path("dispatchState").asText());
    assertEquals(1, exchanges.get("first"));
    String next = intakeSession(second);
    assertEquals("CCMAX_INTAKE_CONCURRENCY_LIMIT", postJson("/api/resources/oauth/supplier-submit",
        store.object().put("sessionId", next).put("code", "second-code#fixture-state"), 409).path("code").asText());
    assertFalse(exchanges.containsKey("second"));
    postJson("/api/resources/" + first + "/creation-recovery", store.object()
        .put("confirmedNotCreated", true).put("action", "EDIT")
        .put("version", store.get("resource", first, owner).path("version").asLong()), 200);
    loginDelayMs.set(0); exchangeDelayMs.set(0); release.countDown();
    assertEquals("READY", postJson("/api/resources/" + first + "/oauth/authorize",
        store.object().put("requestKey", UUID.randomUUID().toString()), 200).path("state").asText());
    assertEquals("UNKNOWN", submitIntake(authorization, "first-code", 200).get(5, TimeUnit.SECONDS).path("state").asText());
    assertEquals("SUCCESS", submitIntake(next, "second-code", 200).get(5, TimeUnit.SECONDS).path("state").asText());
    assertEquals(1, exchanges.get("first"));
  }

  @Test
  void waitingForSharedLoginLockCannotExceedCreationDeadline() throws Exception {
    intakeControls(2, 1);
    loginDelayMs.set(1800);
    String authorization = intakeSession(first);
    ObjectNode config = store.get("resource-target", targetId, "GLOBAL");
    CompletableFuture<ObjectNode> other = CompletableFuture.supplyAsync(() -> {
      return gateway.exchange(config, "GET", "/resources/" + second + "/account-bind",
          store.object().put("accountId", "second"), "unrelated-read");
    }, executor);
    assertTrue(loginReceived.await(5, TimeUnit.SECONDS));
    long began = System.nanoTime();
    ObjectNode failure = submitIntake(authorization, "first-code", 504).get(3, TimeUnit.SECONDS);
    assertEquals("CCMAX_CREATION_TIMEOUT", failure.path("code").asText());
    assertTrue(TimeUnit.NANOSECONDS.toMillis(System.nanoTime() - began) < 1600);
    assertTrue(exchanges.isEmpty());
    assertEquals("UPDATED", other.get(4, TimeUnit.SECONDS).path("state").asText());
  }

  @Test
  void durableUnknownIntakeKeepsSlotPerSupplierAcrossControlInstances() {
    intakeControls(1, 7);
    store.create("resource-operation", owner, store.object().put("supplierId", owner).put("resourceId", first)
        .put("protocol", "CCMAX_NATIVE").put("type", "OAUTH_COMPLETE").put("state", "UNKNOWN"));
    var tx = new org.springframework.transaction.support.TransactionTemplate(transactionManager);
    ApiException denied = assertThrows(ApiException.class, () -> tx.execute(status -> new CcmaxIntakeControls(store).admit(owner)));
    assertEquals("CCMAX_INTAKE_CONCURRENCY_LIMIT", denied.code);
    Integer independentTimeout = tx.execute(status -> intakeControlService.admit(owner + "-independent"));
    assertEquals(7, independentTimeout.intValue());
  }

  @Test
  void legacyCreationRecoveryRequiresFinishedReceiptBeforeReleasingCapacity() throws Exception {
    intakeControls(1, 7);
    store.update("resource", first, owner, store.object().put("dispatchState", "UNKNOWN"));
    ObjectNode legacy = store.create("resource-operation", owner, store.object().put("supplierId", owner).put("resourceId", first)
        .put("protocol", "CCMAX_NATIVE").put("type", "OAUTH_COMPLETE").put("state", "UNKNOWN"));
    var tx = new org.springframework.transaction.support.TransactionTemplate(transactionManager);
    ApiException blocked = assertThrows(ApiException.class, () -> tx.execute(status -> intakeControlService.admit(owner)));
    assertEquals("CCMAX_INTAKE_CONCURRENCY_LIMIT", blocked.code);
    ObjectNode recovery = store.object().put("confirmedNotCreated", true).put("action", "EDIT")
        .put("version", store.get("resource", first, owner).path("version").asLong());
    assertEquals("RESOURCE_OPERATION_UNCERTAIN", postJson("/api/resources/" + first + "/creation-recovery",
        recovery, 409).path("code").asText());
    assertFalse(store.get("resource-operation", legacy.path("id").asText(), owner)
        .path("creationConfirmedNotCreated").asBoolean());
    assertEquals("UNKNOWN", store.get("resource", first, owner).path("dispatchState").asText());
    assertThrows(ApiException.class, () -> tx.execute(status -> intakeControlService.admit(owner)));
    store.update("resource-operation", legacy.path("id").asText(), owner,
        store.object().put("finishedAt", java.time.Instant.now().toString()));
    postJson("/api/resources/" + first + "/creation-recovery", store.object()
        .put("confirmedNotCreated", true).put("action", "EDIT")
        .put("version", store.get("resource", first, owner).path("version").asLong()), 200);
    Integer available = tx.execute(status -> intakeControlService.admit(owner));
    assertEquals(7, available.intValue());
  }

  @Test
  void creationDeadlineAlsoBoundsSlowResponseBodyAfterHeaders() throws Exception {
    intakeControls(1, 1);
    release.countDown(); accountBodyDelayMs.set(2200);
    String authorization = intakeSession(first);
    long began = System.nanoTime();
    ObjectNode failure = submitIntake(authorization, "first-code", 504).get(4, TimeUnit.SECONDS);
    assertEquals("CCMAX_CREATION_TIMEOUT", failure.path("code").asText());
    assertTrue(TimeUnit.NANOSECONDS.toMillis(System.nanoTime() - began) < 1700);
    assertEquals("UNKNOWN", submitIntake(authorization, "first-code", 200).get(4, TimeUnit.SECONDS).path("state").asText());
    assertEquals(1, exchanges.get("first"));
  }

  @Test
  void existingAccountReauthorizationIsIndependentOfFullNewIntakeSlots() throws Exception {
    intakeControls(1, 1);
    store.create("resource-operation", owner, store.object().put("supplierId", owner).put("resourceId", first)
        .put("protocol", "CCMAX_NATIVE").put("type", "OAUTH_COMPLETE").put("state", "UNKNOWN"));
    store.update("resource", second, owner, store.object().put("laneId", "second"));
    release.countDown();
    String path = "/api/resources/" + second + "/reauthorizations";
    ObjectNode authorization = postJson(path, store.object().put("requestKey", UUID.randomUUID().toString()), 200);
    ObjectNode input = store.object().put("requestKey", UUID.randomUUID().toString()).put("code", "second-code#fixture-state");
    assertEquals("SUCCESS", postJson(path + "/" + authorization.path("id").asText(), input, 200).path("state").asText());
    assertFalse(findLifecycle(input).has("creationTimeoutSeconds"));
    assertEquals(1, exchanges.get("second"));
  }

  @Test
  void manualTargetSyncRejectsWholeBatchWhenMappingChangesWhileReadingUpstream() throws Exception {
    blockedReadAccount.set("first");
    long otherVersion = store.get("resource", second, owner).path("version").asLong();
    CompletableFuture<ObjectNode> running = CompletableFuture.supplyAsync(() -> {
      try { return postJson("/api/resource-targets/" + targetId + "/sync", store.object(), 409); }
      catch (Exception failure) { throw new CompletionException(failure); }
    }, executor);
    try {
      assertTrue(received.await(5, TimeUnit.SECONDS));
      store.update("resource", first, owner, store.object().put("upstreamAccountId", "replacement"));
    } finally { release.countDown(); }
    assertEquals("RESOURCE_SYNC_RESOURCE_CHANGED", running.get(10, TimeUnit.SECONDS).path("code").asText());
    assertEquals(otherVersion, store.get("resource", second, owner).path("version").asLong());
    assertFalse(store.get("resource", first, owner).has("statusSyncedAt"));
    assertFalse(store.get("resource", second, owner).has("statusSyncedAt"));
    assertTrue(writes.isEmpty());
    assertTrue(refreshes.isEmpty());
    assertTrue(exchanges.isEmpty());
  }
}
