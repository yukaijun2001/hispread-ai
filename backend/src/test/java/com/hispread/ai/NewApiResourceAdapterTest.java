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
    ObjectNode result = adapter.exchange(config(), "POST", "/resource-lifecycle-jobs", request, "stable");
    assertEquals(2, sent.get().path("status").asInt()); assertEquals("PAUSED", result.path("items").get(0).path("state").asText());
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
