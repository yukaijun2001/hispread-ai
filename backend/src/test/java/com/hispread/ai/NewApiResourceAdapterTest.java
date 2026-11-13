package com.hispread.ai;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

import com.fasterxml.jackson.databind.*;
import com.fasterxml.jackson.databind.node.*;
import java.util.*;
import java.util.concurrent.atomic.*;
import org.junit.jupiter.api.Test;

class NewApiResourceAdapterTest {
  final ObjectMapper json = new ObjectMapper();
  ObjectNode obj() { return json.createObjectNode(); }
  ObjectNode config() { return obj().put("protocol", "NEWAPI").put("apiKey", "admin-secret").put("newApiUserId", "2"); }
  @Test void lifecycleUsesDedicatedStatusEndpointAndVerifiesReadback() {
    Store store = mock(Store.class); when(store.object()).thenAnswer(call -> obj());
    when(store.get("resource", "local", null)).thenReturn(obj().put("upstreamChannelId", "148"));
    AtomicInteger status = new AtomicInteger(1);
    List<String> paths = new ArrayList<>();
    NewApiResourceAdapter adapter = new NewApiResourceAdapter(store, (config, method, path, body, key) -> {
      paths.add(method + " " + path);
      if (method.equals("POST") && path.equals("/channel/148/status")) {
        status.set(body.path("status").asInt());
        return obj().put("success", true).put("data", true);
      }
      if (method.equals("GET") && path.equals("/channel/148")) {
        ObjectNode reply = obj().put("success", true);
        reply.putObject("data").put("id", 148).put("status", status.get());
        return reply;
      }
      return obj().put("success", false);
    });
    ObjectNode request = obj().put("action", "PAUSE");
    request.putArray("items").add(obj().put("resourceId", "local"));
    ObjectNode paused = adapter.exchange(config(), "POST", "/resource-lifecycle-jobs", request, "pause");
    assertEquals("COMPLETED", paused.path("state").asText());
    assertEquals(2, status.get());
    assertEquals(List.of("POST /channel/148/status", "GET /channel/148"), paths);
  }

  @Test void batchPriorityUsesMappedChannelsAndReadOnlyReconciliation() {
    Store store = mock(Store.class); when(store.object()).thenAnswer(call -> obj());
    when(store.get("resource", "local", null)).thenReturn(obj().put("upstreamChannelId", "148"));
    AtomicInteger priority = new AtomicInteger(3);
    AtomicInteger writes = new AtomicInteger();
    NewApiResourceAdapter adapter = new NewApiResourceAdapter(store, (config, method, path, body, key) -> {
      if (method.equals("PUT")) {
        assertEquals("/channel/", path);
        assertEquals(148, body.path("id").asInt());
        assertFalse(body.has("status"));
        priority.set(body.path("priority").asInt()); writes.incrementAndGet();
        return obj().put("success", true);
      }
      ObjectNode reply = obj().put("success", true);
      reply.putObject("data").put("id", 148).put("status", 1).put("priority", priority.get());
      return reply;
    });
    ObjectNode request = obj().put("priority", 7);
    request.putArray("items").add(obj().put("resourceId", "local"));
    assertEquals("COMPLETED", adapter.exchange(config(), "POST", "/priority-batch", request, "priority").path("state").asText());
    assertEquals(1, writes.get());
    assertEquals("COMPLETED", adapter.exchange(config(), "GET", "/priority-batch/reconcile", request, "priority").path("state").asText());
    assertEquals(1, writes.get());
  }

  @Test void acceptedPriorityWriteWithRejectedReadbackRemainsUnknown() {
    Store store = mock(Store.class); when(store.object()).thenAnswer(call -> obj());
    when(store.get("resource", "local", null)).thenReturn(obj().put("upstreamChannelId", "148"));
    AtomicInteger writes = new AtomicInteger();
    AtomicBoolean blockRead = new AtomicBoolean(true);
    NewApiResourceAdapter adapter = new NewApiResourceAdapter(store, (config, method, path, body, key) -> {
      if (method.equals("PUT")) {
        writes.incrementAndGet();
        return obj().put("success", true);
      }
      if (writes.get() > 0 && blockRead.get()) throw new ApiException(403, "fixture read denied");
      ObjectNode reply = obj().put("success", true);
      reply.putObject("data").put("id", 148).put("status", 1).put("priority", 7);
      return reply;
    });
    ObjectNode request = obj().put("priority", 7);
    request.putArray("items").add(obj().put("resourceId", "local"));
    ObjectNode uncertain = adapter.exchange(config(), "POST", "/priority-batch", request, "priority");
    assertEquals("UNKNOWN", uncertain.path("state").asText());
    assertEquals(0, uncertain.path("counts").path("FAILED").asInt());
    ObjectNode readDenied = adapter.exchange(config(), "GET", "/priority-batch/reconcile", request, "priority");
    assertEquals("UNKNOWN", readDenied.path("state").asText());
    assertEquals(0, readDenied.path("counts").path("FAILED").asInt());
    blockRead.set(false);
    assertEquals("COMPLETED", adapter.exchange(config(), "GET", "/priority-batch/reconcile", request, "priority").path("state").asText());
    assertEquals(1, writes.get());
  }
  @Test void rejectedStatusDoesNotFallbackAndUnconfirmedWriteStaysUnknown() {
    Store store = mock(Store.class); when(store.object()).thenAnswer(call -> obj());
    when(store.get("resource", "local", null)).thenReturn(obj().put("upstreamChannelId", "148"));
    List<String> writes = new ArrayList<>();
    NewApiResourceAdapter rejected = new NewApiResourceAdapter(store, (config, method, path, body, key) -> {
      writes.add(method + " " + path);
      return obj().put("success", false).put("message", "PRIVATE");
    });
    ObjectNode request = obj().put("action", "PAUSE"); request.putArray("items").add(obj().put("resourceId", "local"));
    ObjectNode result = rejected.exchange(config(), "POST", "/resource-lifecycle-jobs", request, "key");
    assertEquals("FAILED", result.path("state").asText());
    assertEquals(List.of("POST /channel/148/status"), writes);
    assertFalse(result.toString().contains("PRIVATE"));
    NewApiResourceAdapter uncertain = new NewApiResourceAdapter(store, (config, method, path, body, key) -> {
      ObjectNode reply = obj().put("success", true);
      if (method.equals("GET")) reply.putObject("data").put("id",148).put("status",1);
      return reply;
    });
    assertEquals("UNKNOWN", uncertain.exchange(config(), "POST", "/resource-lifecycle-jobs", request, "key").path("state").asText());
  }

  @Test void legacyStatusFallbackRequiresMissingEndpointAndPreservesChannelRouting() {
    Store store = mock(Store.class); when(store.object()).thenAnswer(call -> obj());
    when(store.get("resource", "local", null)).thenReturn(obj().put("upstreamChannelId", "148"));
    AtomicInteger status = new AtomicInteger(1);
    NewApiResourceAdapter adapter = new NewApiResourceAdapter(store, (config, method, path, body, key) -> {
      if (method.equals("POST")) throw new ApiException(404, "Missing endpoint");
      if (method.equals("PUT")) {
        assertEquals("default", body.path("group").asText()); assertEquals("fixture", body.path("models").asText());
        assertFalse(body.has("key")); status.set(body.path("status").asInt());
        return obj().put("success", true);
      }
      ObjectNode reply = obj().put("success", true);
      reply.putObject("data").put("id",148).put("status",status.get()).put("models","fixture").put("group","default");
      return reply;
    });
    ObjectNode request = obj().put("action", "PAUSE"); request.putArray("items").add(obj().put("resourceId", "local"));
    assertEquals("COMPLETED", adapter.exchange(config(), "POST", "/resource-lifecycle-jobs", request, "key").path("state").asText());
  }
  @Test void officialPathsStatusMappingAndQuotaUnitsArePreserved() {
    Store store = mock(Store.class); when(store.object()).thenAnswer(call -> obj());
    when(store.get("resource", "local", null)).thenReturn(obj().put("laneId", "42"));
    AtomicReference<String> path = new AtomicReference<>(), method = new AtomicReference<>();
    AtomicReference<JsonNode> sent = new AtomicReference<>();
    AtomicReference<ObjectNode> reply = new AtomicReference<>(obj().put("success", true));
    NewApiResourceAdapter adapter = new NewApiResourceAdapter(store, (c, m, p, body, key) -> { path.set(p); method.set(m); sent.set(body); assertEquals("/api", c.path("upstreamPathPrefix").asText()); return reply.get(); });
    adapter.exchange(config(), "POST", "/resources/local/priority", obj().put("priority", 123), "stable");
    assertEquals("PUT", method.get()); assertEquals("/channel/", path.get()); assertEquals(42, sent.get().path("id").asLong()); assertEquals(123, sent.get().path("priority").asInt());
    ObjectNode request = obj().put("action", "PAUSE"); request.putArray("items").add(obj().put("resourceId", "local"));
    reply.set(obj().put("success", true)); reply.get().putObject("data").put("id",42).put("status",2);
    ObjectNode result = adapter.exchange(config(), "POST", "/resource-lifecycle-jobs", request, "stable");
    assertEquals("GET", method.get()); assertEquals("/channel/42", path.get()); assertEquals("PAUSED", result.path("items").get(0).path("state").asText());
    reply.set(obj().put("success", true)); reply.get().putObject("data").put("id",42).put("status",1).put("used_quota",500000).put("balance",12.5);
    ObjectNode usage = adapter.exchange(config(), "POST", "/resources/local/usage", obj(), "stable");
    assertEquals("/channel/42", path.get()); assertEquals("GET", method.get()); assertEquals("NEWAPI_QUOTA", usage.path("usage").path("unit").asText()); assertFalse(usage.has("amount"));
    assertFalse(usage.toString().contains("admin-secret"));
  }
  @Test void rejectsProviderFalseMissingMappingAndUnsupportedCcmaxWithoutRemoteWrite() {
    Store store = mock(Store.class); when(store.object()).thenAnswer(call -> obj());
    when(store.get("resource", "local", null)).thenReturn(obj().put("laneId", "42"));
    AtomicInteger calls = new AtomicInteger();
    NewApiResourceAdapter adapter = new NewApiResourceAdapter(store, (c,m,p,b,k) -> { calls.incrementAndGet(); return obj().put("success",false).put("message","SECRET diagnostic"); });
    assertEquals("RESOURCE_OPERATION_UNSUPPORTED", assertThrows(ApiException.class, () -> adapter.exchange(config(), "POST", "/resources/oauth/supplier-authorize", obj(), "key")).code);
    assertEquals(0,calls.get());
    ApiException rejected = assertThrows(ApiException.class, () -> adapter.exchange(config(),"POST","/resources/local/say-hi",obj(),"key"));
    assertEquals("RESOURCE_PROVIDER_REJECTED", rejected.code); assertFalse(rejected.getMessage().contains("SECRET"));
    when(store.get("resource", "local", null)).thenReturn(obj().put("laneId", "unmapped-private-id"));
    assertEquals("RESOURCE_CHANNEL_NOT_MAPPED", assertThrows(ApiException.class, () -> adapter.exchange(config(),"POST","/resources/local/usage",obj(),"key")).code);
  }
  @Test void removalReconciliationWithoutProofStaysUnknownAndNeverDeletesAgain() {
    Store store = mock(Store.class); when(store.object()).thenAnswer(call -> obj());
    when(store.get("resource", "local", null)).thenReturn(obj().put("upstreamChannelId", "148"));
    List<String> calls = new ArrayList<>();
    NewApiResourceAdapter adapter = new NewApiResourceAdapter(store, (config, method, path, body, key) -> {
      calls.add(method + " " + path);
      return obj().put("success", false).put("message", "PRIVATE missing-channel diagnostic");
    });
    ObjectNode request = obj().put("action", "REMOVE");
    request.putArray("items").add(obj().put("resourceId", "local"));
    ObjectNode result = adapter.exchange(config(), "GET", "/resource-lifecycle-jobs/reconcile", request, "original");
    assertEquals("UNKNOWN", result.path("state").asText());
    assertEquals("UNKNOWN", result.path("items").get(0).path("state").asText());
    assertEquals(List.of("GET /channel/148"), calls);
    assertFalse(result.toString().contains("PRIVATE"));
  }

  @Test void partialRemovalPreservesPreviouslyConfirmedItemsDuringReadOnlyReconcile() {
    Store store = mock(Store.class); when(store.object()).thenAnswer(call -> obj());
    when(store.get("resource", "confirmed", null)).thenReturn(obj().put("upstreamChannelId", "148"));
    when(store.get("resource", "uncertain", null)).thenReturn(obj().put("upstreamChannelId", "149"));
    List<String> paths = new ArrayList<>();
    NewApiResourceAdapter adapter = new NewApiResourceAdapter(store, (config, method, path, body, key) -> {
      paths.add(method + " " + path);
      return obj().put("success", false);
    });
    ObjectNode request = obj().put("action", "REMOVE");
    request.putArray("items").add(obj().put("resourceId", "confirmed"))
        .add(obj().put("resourceId", "uncertain"));
    request.putArray("confirmedItems").add(obj().put("resourceId", "confirmed").put("state", "GONE"));
    ObjectNode result = adapter.exchange(config(), "GET", "/resource-lifecycle-jobs/reconcile", request, "key");
    assertEquals("UNKNOWN", result.path("state").asText());
    assertEquals(1, result.path("completedCount").asInt());
    assertEquals(1, result.path("unknownCount").asInt());
    assertEquals("GONE", result.path("items").get(0).path("state").asText());
    assertEquals(List.of("GET /channel/149"), paths);
  }

  @Test void validatorRejectsBogusStateCrossResourceJobsAndInsecureOauth() {
    assertThrows(ApiException.class, () -> ResourceResponseValidator.validate("SUBMIT",obj().put("state","DELIVERED"),obj()));
    assertThrows(ApiException.class, () -> ResourceResponseValidator.validate("SUBMIT",obj().put("state","SUCCESS").put("success",false),obj()));
    assertThrows(ApiException.class, () -> ResourceResponseValidator.validate("SUBMIT",obj().put("state","SUCCESS").put("errcode",500),obj()));
    ObjectNode request = obj(); request.putArray("items").add(obj().put("resourceId","expected"));
    ObjectNode response = obj().put("state","COMPLETED"); response.putArray("items").add(obj().put("resourceId","other-tenant").put("state","PAUSED"));
    assertThrows(ApiException.class, () -> ResourceResponseValidator.validate("LIFECYCLE",response,request));
    ObjectNode replacement = obj().put("state","COMPLETED"); replacement.putArray("items").add(obj().put("resourceId","expected").put("state","SUCCESS"));
    assertThrows(ApiException.class, () -> ResourceResponseValidator.validate("PROXY_REPLACEMENT",replacement,request));
    assertThrows(ApiException.class, () -> ResourceResponseValidator.validate("OAUTH_AUTHORIZE",obj().put("sessionId","real").put("authUrl","http://insecure.invalid"),obj()));
    assertThrows(ApiException.class, () -> ResourceResponseValidator.validate("USAGE",obj().put("state","UPDATED").put("amount","NaN"),obj()));
    ObjectNode nested = obj().put("state","UPDATED"); nested.putObject("usage").put("amount","1e999999");
    assertThrows(ApiException.class, () -> ResourceResponseValidator.validate("USAGE",nested,obj()));
    nested.withObject("/usage").put("amount","-4");
    assertThrows(ApiException.class, () -> ResourceResponseValidator.validate("USAGE",nested,obj()));
    nested.withObject("/usage").put("amount","4.25").put("currency","USD");
    assertEquals("UPDATED",ResourceResponseValidator.validate("USAGE",nested,obj()));
  }
}
