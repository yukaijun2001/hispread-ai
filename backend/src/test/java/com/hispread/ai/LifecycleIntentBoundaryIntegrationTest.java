package com.hispread.ai;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import java.util.*;
import java.util.concurrent.*;
import java.util.concurrent.atomic.*;
import org.junit.jupiter.api.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.mock.web.MockHttpSession;
import org.springframework.test.web.servlet.MockMvc;

/** Durable PostgreSQL intent guards around an injected upstream, without real account actions. */
@SpringBootTest
@AutoConfigureMockMvc
class LifecycleIntentBoundaryIntegrationTest {
  @Autowired Store store;
  @Autowired AuthService auth;
  @Autowired MockMvc mvc;
  @MockBean ResourceIntegrationGateway gateway;
  String owner, target, first, second;
  Client administrator;
  List<String> users;
  AtomicInteger writes, reads;
  AtomicBoolean uncertain;
  AtomicReference<String> protocol;

  record Client(MockHttpSession session, String csrf) {}

  @BeforeEach void setup() throws Exception {
    String suffix = UUID.randomUUID().toString();
    owner = "lifecycle-owner-" + suffix;
    target = "lifecycle-target-" + suffix;
    first = "lifecycle-first-" + suffix;
    second = "lifecycle-second-" + suffix;
    users = new ArrayList<>();
    writes = new AtomicInteger(); reads = new AtomicInteger();
    uncertain = new AtomicBoolean(true); protocol = new AtomicReference<>("NEWAPI");
    store.create("supplier", owner, store.object().put("id", owner).put("supplierId", owner)
        .put("state", "APPROVED").put("enabled", true));
    for (String id : List.of(first, second))
      store.create("resource", owner, store.object().put("id", id).put("supplierId", owner)
          .put("resourceType", "NEWAPI_CHANNEL").put("targetId", target)
          .put("upstreamChannelId", id.equals(first) ? "148" : "149")
          .put("operationalState", "ACTIVE"));
    administrator = client("ADMIN", null);
    when(gateway.requireConfigured(any())).thenAnswer(call -> store.object().put("id", target)
        .put("protocol", protocol.get()).put("name", "Isolated lifecycle target"));
    when(gateway.exchange(any(), anyString(), anyString(), any(), anyString())).thenAnswer(call -> {
      String method = call.getArgument(1);
      if (method.equals("GET")) reads.incrementAndGet(); else writes.incrementAndGet();
      return receipt(call.getArgument(3), uncertain.get());
    });
  }

  @AfterEach void cleanup() {
    store.jdbc.update("delete from hub_entity where owner_id=?", owner);
    for (String id : users) store.jdbc.update("delete from hub_user where id=?", id);
  }

  Client client(String role, String supplier) throws Exception {
    String id = "lifecycle-user-" + UUID.randomUUID(); users.add(id);
    ObjectNode user = store.object().put("id", id).put("username", id).put("displayName", "Lifecycle fixture")
        .put("role", role).put("mustChangePassword", false).put("onboardingRequired", false).put("version", 0);
    if (supplier == null) user.putNull("supplierId"); else user.put("supplierId", supplier);
    user.set("permissions", auth.allPermissions()); auth.createUser(user, "Fixture@Password123");
    MockHttpSession session = new MockHttpSession(); session.setAttribute("uid", id); session.setAttribute("sv", 0L);
    String csrf = store.parse(mvc.perform(get("/api/auth/csrf").session(session)).andReturn()
        .getResponse().getContentAsString()).path("token").asText();
    return new Client(session, csrf);
  }

  ObjectNode request(String action, String... ids) {
    ObjectNode body = store.object().put("action", action).put("requestKey", UUID.randomUUID().toString());
    for (String id : ids) body.withArray("items").addObject().put("resourceId", id);
    return body;
  }

  ObjectNode receipt(JsonNode request, boolean pending) {
    ObjectNode response = store.object().put("state", pending ? "UNKNOWN" : "COMPLETED");
    String action = request.path("action").asText();
    for (JsonNode item : request.path("items"))
      response.withArray("items").addObject().put("resourceId", item.path("resourceId").asText())
          .put("state", pending ? "UNKNOWN" : action.equals("PAUSE") ? "PAUSED" : action.equals("RESUME") ? "RESUMED" : "GONE");
    return response;
  }

  ObjectNode post(String path, ObjectNode body, Client client, int status) throws Exception {
    return store.parse(mvc.perform(org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post(path).session(client.session()).header("X-CSRF-TOKEN", client.csrf())
        .contentType("application/json").content(body.toString())).andExpect(status().is(status)).andReturn()
        .getResponse().getContentAsString());
  }

  ObjectNode post(ObjectNode body, int status) throws Exception {
    return post("/api/resource-lifecycle-jobs", body, administrator, status);
  }

  ObjectNode lookup(String key, Client client, int status) throws Exception {
    return store.parse(mvc.perform(get("/api/resource-lifecycle-jobs/by-request/" + key).session(client.session()))
        .andExpect(status().is(status)).andReturn().getResponse().getContentAsString());
  }

  @Test void uncertainNewApiBlocksDifferentActionsAndOriginalReadbackNeverResends() throws Exception {
    ObjectNode original = request("PAUSE", first), result = post(original, 200);
    assertEquals("UNKNOWN", result.path("state").asText());
    for (String action : List.of("PAUSE", "RESUME", "REMOVE")) {
      ObjectNode refused = post(request(action, first), 409);
      assertEquals("RESOURCE_LIFECYCLE_UNRESOLVED", refused.path("code").asText());
      assertEquals(result.path("id"), refused.path("operationId"));
    }
    assertEquals(result.path("id"), post(original, 200).path("id"));
    assertEquals(result.path("id"), lookup(original.path("requestKey").asText(), administrator, 200).path("id"));
    assertEquals(1, writes.get()); assertEquals(0, reads.get());
    uncertain.set(false);
    post("/api/resource-lifecycle-jobs/" + result.path("id").asText() + "/reconcile", store.object(), administrator, 200);
    assertEquals(1, writes.get()); assertEquals(1, reads.get());
    assertEquals("COMPLETED", post(request("RESUME", first), 200).path("state").asText());
    assertEquals(2, writes.get());
  }

  @Test void nativeRemovalUncertaintyAlsoBlocksPauseUntilOriginalIsConfirmed() throws Exception {
    protocol.set("CCMAX_NATIVE");
    store.update("resource", first, owner, store.object().put("resourceType", "CCMAX")
        .put("upstreamProtocol", "CCMAX_NATIVE").put("upstreamAccountId", "native-fixture").putNull("upstreamChannelId"));
    ObjectNode original = request("REMOVE", first), result = post(original, 200);
    assertEquals("RESOURCE_LIFECYCLE_UNRESOLVED", post(request("PAUSE", first), 409).path("code").asText());
    assertEquals(result.path("id"), post(original, 200).path("id"));
    assertEquals(1, writes.get());
  }

  @Test void partialUncertainBatchLocksAllItsResourcesUntilReadbackFinishes() throws Exception {
    doAnswer(call -> {
      writes.incrementAndGet(); JsonNode input = call.getArgument(3);
      ObjectNode response = receipt(input, false);
      if (input.path("items").size() == 2) {
        response.put("state", "UNKNOWN");
        ((ObjectNode) response.withArray("items").get(1)).put("state", "UNKNOWN");
      }
      return response;
    }).when(gateway).exchange(any(), anyString(), anyString(), any(), anyString());
    ObjectNode result = post(request("PAUSE", first, second), 200);
    assertEquals("UNKNOWN", result.path("state").asText());
    assertEquals("RESOURCE_LIFECYCLE_UNRESOLVED", post(request("RESUME", first), 409).path("code").asText());
    assertEquals("RESOURCE_LIFECYCLE_UNRESOLVED", post(request("REMOVE", second), 409).path("code").asText());
    assertEquals(1, writes.get());
  }

  @Test void terminalCustomPartialBatchCanStartANewIntent() throws Exception {
    protocol.set("CUSTOM");
    doAnswer(call -> {
      writes.incrementAndGet();
      ObjectNode response = receipt(call.getArgument(3), false).put("state", "PARTIAL");
      if (response.path("items").size() == 2)
        ((ObjectNode) response.withArray("items").get(1)).put("state", "FAILED");
      return response;
    }).when(gateway).exchange(any(), anyString(), anyString(), any(), anyString());
    assertEquals("PARTIAL", post(request("PAUSE", first, second), 200).path("state").asText());
    post(request("RESUME", second), 200);
    assertEquals(2, writes.get());
  }

  @Test void historicalRequestItemStateNeverCountsAsConfirmedUpstreamOutcome() throws Exception {
    ObjectNode request = request("PAUSE", first);
    ((ObjectNode) request.withArray("items").get(0)).put("state", "COMPLETED");
    ObjectNode original = store.object().put("type", "LIFECYCLE").put("supplierId", owner)
        .put("resourceId", "").put("requestKey", request.path("requestKey").asText())
        .put("state", "UNKNOWN").put("createdBy", users.get(0));
    original.set("request", request); original.set("items", request.path("items"));
    String id = store.create("resource-operation", owner, original).path("id").asText();
    ObjectNode refused = post(request("RESUME", first), 409);
    assertEquals("RESOURCE_LIFECYCLE_UNRESOLVED", refused.path("code").asText());
    assertEquals(id, refused.path("operationId").asText());
    assertEquals(0, writes.get());
    ObjectNode apparentlyFinished = receipt(request, false);
    store.update("resource-operation", id, owner, store.object().set("result", apparentlyFinished));
    assertEquals("RESOURCE_LIFECYCLE_UNRESOLVED", post(request("RESUME", first), 409).path("code").asText());
    apparentlyFinished.put("unknownCount", 1);
    ObjectNode inconsistent = store.object().put("state", "COMPLETED");
    inconsistent.set("result", apparentlyFinished);
    store.update("resource-operation", id, owner, inconsistent);
    assertEquals("RESOURCE_LIFECYCLE_UNRESOLVED", post(request("RESUME", first), 409).path("code").asText());
    assertEquals(0, writes.get());
  }

  @Test void concurrentDifferentRequestKeysCannotOverlapButUnrelatedResourceCanProceed() throws Exception {
    CountDownLatch sent = new CountDownLatch(1), release = new CountDownLatch(1);
    ExecutorService executor = Executors.newSingleThreadExecutor();
    doAnswer(call -> {
      writes.incrementAndGet(); JsonNode input = call.getArgument(3);
      if (input.path("items").get(0).path("resourceId").asText().equals(first)) {
        sent.countDown(); assertTrue(release.await(10, TimeUnit.SECONDS));
      }
      return receipt(input, true);
    }).when(gateway).exchange(any(), anyString(), anyString(), any(), anyString());
    CompletableFuture<ObjectNode> running = CompletableFuture.supplyAsync(() -> {
      try { return post(request("PAUSE", first), 200); }
      catch (Exception error) { throw new CompletionException(error); }
    }, executor);
    try {
      assertTrue(sent.await(5, TimeUnit.SECONDS));
      assertEquals("RESOURCE_LIFECYCLE_UNRESOLVED", post(request("RESUME", first), 409).path("code").asText());
      assertEquals("UNKNOWN", post(request("PAUSE", second), 200).path("state").asText());
    } finally { release.countDown(); }
    try { assertEquals("UNKNOWN", running.get(10, TimeUnit.SECONDS).path("state").asText()); }
    finally { executor.shutdownNow(); }
    assertEquals(2, writes.get());
  }

  @Test void scopedMissingAndForeignLookupsNeverCreateOrExecuteOperations() throws Exception {
    ObjectNode original = request("PAUSE", first), result = post(original, 200);
    Client supplier = client("SUPPLIER", owner), stranger = client("SUPPLIER", "other-" + owner);
    assertEquals(result.path("id"), lookup(original.path("requestKey").asText(), supplier, 200).path("id"));
    assertFalse(lookup(original.path("requestKey").asText(), stranger, 404).has("operationId"));
    lookup(UUID.randomUUID().toString(), administrator, 404);
    assertEquals(1, writes.get()); assertEquals(0, reads.get());
    assertEquals(1, store.list("resource-operation", owner).size());
  }

  @Test void dispatchFailureStillReturnsScopedOriginalIdAndProtectsIntent() throws Exception {
    doAnswer(call -> {
      writes.incrementAndGet(); throw new ApiException(400, "fixture reply failed", "FIXTURE_REPLY_FAILED");
    }).when(gateway).exchange(any(), anyString(), anyString(), any(), anyString());
    ObjectNode input = request("PAUSE", first), error = post(input, 400);
    assertFalse(error.path("operationId").asText().isBlank());
    assertEquals(error.path("operationId"), lookup(input.path("requestKey").asText(), administrator, 200).path("id"));
    assertEquals(error.path("operationId"), post(input, 200).path("id"));
    post(request("RESUME", first), 409); assertEquals(1, writes.get());
  }

  @Test void completedPauseAndFailedReceiptsRemainHistoricalAfterNewerResume() throws Exception {
    for (String adapter : List.of("NEWAPI", "CCMAX_NATIVE", "CUSTOM")) {
      protocol.set(adapter); uncertain.set(false);
      ObjectNode paused = post(request("PAUSE", first), 200);
      post(request("RESUME", first), 200);
      long version = store.get("resource", first, owner).path("version").asLong();
      int callsBefore = writes.get() + reads.get();
      ObjectNode historical = post("/api/resource-lifecycle-jobs/" + paused.path("id").asText() + "/reconcile",
          store.object(), administrator, 200);
      assertEquals("COMPLETED", historical.path("state").asText());
      assertEquals(callsBefore, writes.get() + reads.get());
      assertEquals("ACTIVE", store.get("resource", first, owner).path("operationalState").asText());
      assertEquals(version, store.get("resource", first, owner).path("version").asLong());

      ObjectNode failedInput = request("PAUSE", second);
      ObjectNode failed = store.object().put("type", "LIFECYCLE").put("protocol", adapter).put("supplierId", owner)
          .put("resourceId", "").put("state", "FAILED").put("createdBy", users.get(0));
      failed.set("request", failedInput);
      ObjectNode failedResult = receipt(failedInput, false).put("state", "FAILED").put("unknownCount", 0);
      ((ObjectNode) failedResult.withArray("items").get(0)).put("state", "FAILED");
      failed.set("result", failedResult);
      String failedId = store.create("resource-operation", owner, failed).path("id").asText();
      assertEquals("FAILED", post("/api/resource-lifecycle-jobs/" + failedId + "/reconcile",
          store.object(), administrator, 200).path("state").asText());
      assertEquals(callsBefore, writes.get() + reads.get());
    }
  }
}
