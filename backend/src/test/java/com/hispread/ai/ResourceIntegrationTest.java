package com.hispread.ai;

import static org.junit.jupiter.api.Assertions.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

import com.fasterxml.jackson.databind.*;
import com.fasterxml.jackson.databind.node.*;
import com.sun.net.httpserver.HttpServer;
import java.net.*;
import java.nio.charset.StandardCharsets;
import java.util.*;
import java.util.concurrent.atomic.*;
import org.junit.jupiter.api.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.mock.web.MockHttpSession;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

@SpringBootTest(
    properties = {
      "app.integrations.allow-private-targets=true",
      "app.integrations.request-timeout-ms=1000"
    })
@ActiveProfiles("test")
@AutoConfigureMockMvc
@Transactional
class ResourceIntegrationTest {
  @Autowired Store store;
  @Autowired AuthService auth;
  @Autowired ObjectMapper json;
  @Autowired MockMvc mvc;
  @Autowired ResourceIntegrationGateway gateway;
  HttpServer server;
  AtomicInteger calls;
  AtomicReference<String> response;
  AtomicInteger httpStatus;
  AtomicReference<String> seenAuth, seenPath;
  ObjectNode target;

  record Client(MockHttpSession session, String csrf, String owner, String uid) {}

  @BeforeEach
  void start() throws Exception {
    calls = new AtomicInteger();
    response =
        new AtomicReference<>(
            "{\"state\":\"SUCCESS\",\"laneId\":\"fixture-lane\",\"accessToken\":\"UPSTREAM-SECRET\"}");
    httpStatus = new AtomicInteger(200);
    seenAuth = new AtomicReference<>();
    seenPath = new AtomicReference<>();
    server = HttpServer.create(new InetSocketAddress("127.0.0.1", 0), 0);
    server.createContext(
        "/",
        exchange -> {
          calls.incrementAndGet();
          seenAuth.set(exchange.getRequestHeaders().getFirst("Authorization"));
          seenPath.set(exchange.getRequestURI().getPath());
          exchange.getRequestBody().readAllBytes();
          byte[] bytes = response.get().getBytes(StandardCharsets.UTF_8);
          exchange.getResponseHeaders().set("Content-Type", "application/json");
          exchange.sendResponseHeaders(httpStatus.get(), bytes.length);
          exchange.getResponseBody().write(bytes);
          exchange.close();
        });
    server.start();
    for (ObjectNode old : store.list("resource-target", null))
      if (old.path("enabled").asBoolean())
        store.update(
            "resource-target", old.path("id").asText(), null, store.object().put("enabled", false));
    target =
        store.create(
            "resource-target",
            "GLOBAL",
            store
                .object()
                .put("name", "Fixture adapter")
                .put("baseUrl", "http://127.0.0.1:" + server.getAddress().getPort())
                .put("apiKey", "fixture-admin-key")
                .put("enabled", true)
                .put("allowHttp", true));
  }

  @AfterEach
  void stop() {
    server.stop(0);
  }

  Client supplier() throws Exception {
    String id = UUID.randomUUID().toString(), owner = UUID.randomUUID().toString();
    ObjectNode user =
        store
            .object()
            .put("id", id)
            .put("username", "resource_test_" + id.substring(0, 8))
            .put("displayName", "Fixture supplier")
            .put("role", "SUPPLIER")
            .put("supplierId", owner)
            .put("mustChangePassword", false)
            .put("onboardingRequired", false)
            .put("version", 0);
    user.set("permissions", auth.supplierPermissions());
    auth.createUser(user, "FixtureTest@123");
    store.create(
        "supplier",
        owner,
        store
            .object()
            .put("id", owner)
            .put("supplierId", owner)
            .put("name", "Fixture supplier")
            .put("state", "APPROVED")
            .put("enabled", true));
    MockHttpSession session = new MockHttpSession();
    session.setAttribute("uid", id);
    session.setAttribute("sv", 0L);
    var csrf = mvc.perform(get("/api/auth/csrf").session(session)).andReturn();
    return new Client(
        session,
        json.readTree(csrf.getResponse().getContentAsString()).path("token").asText(),
        owner,
        id);
  }

  ObjectNode submission(Client c) {
    ObjectNode project =
        store.create(
            "project",
            "GLOBAL",
            store
                .object()
                .put("name", "CCMAX Fixture")
                .put("category", "ANTHROPIC")
                .put("enabled", true));
    store.create(
        "quote",
        c.owner,
        store
            .object()
            .put("supplierId", c.owner)
            .put("projectId", project.path("id").asText())
            .put("state", "APPROVED")
            .put("effectiveFrom", BusinessSupport.today())
            .put("effectiveTo", BusinessSupport.today())
            .put("multiplier", "0.27"));
    ObjectNode body = store.object().put("requestKey", UUID.randomUUID().toString());
    body.set(
        "input",
        store
            .object()
            .put("accountName", "Local fixture account")
            .put("projectId", project.path("id").asText())
            .put("credentialMode", "REFRESH_TOKEN")
            .put("refreshToken", "PRIVATE-REFRESH"));
    return body;
  }

  ObjectNode write(String path, ObjectNode body, Client c, int status) throws Exception {
    var result =
        mvc.perform(
                post(path)
                    .session(c.session)
                    .header("X-CSRF-TOKEN", c.csrf)
                    .contentType("application/json")
                    .content(body.toString()))
            .andExpect(status().is(status))
            .andReturn();
    return (ObjectNode) json.readTree(result.getResponse().getContentAsString());
  }

  @Test
  void configuredSubmissionIsRealIdempotentScopedAndSecretSafe() throws Exception {
    Client c = supplier();
    ObjectNode body = submission(c);
    ObjectNode result = write("/api/resources/supplier-submit", body, c, 200);
    assertEquals("SUCCESS", result.path("state").asText());
    assertFalse(result.toString().contains("UPSTREAM-SECRET"));
    assertEquals("Bearer fixture-admin-key", seenAuth.get());
    assertEquals("/api/resources/supplier-submit", seenPath.get());
    assertEquals(1, calls.get());
    ObjectNode again = write("/api/resources/supplier-submit", body, c, 200);
    assertEquals(result.path("operationId"), again.path("operationId"));
    assertEquals(1, calls.get());
    String rid = result.path("resourceId").asText();
    assertEquals("DELIVERED", store.get("resource", rid, c.owner).path("state").asText());
    mvc.perform(get("/api/resources/" + rid).session(c.session))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.refreshToken").doesNotExist());
    Client other = supplier();
    mvc.perform(get("/api/resources/" + rid).session(other.session))
        .andExpect(status().isNotFound());
    ((ObjectNode) body.path("input")).put("refreshToken", "CHANGED");
    write("/api/resources/supplier-submit", body, c, 409);
    assertEquals(1, calls.get());
  }

  @Test
  void upstreamFailureIsPreservedWithoutFakeDeliveredStateOrSecretEcho() throws Exception {
    Client c = supplier();
    ObjectNode body = submission(c);
    httpStatus.set(422);
    response.set("{\"message\":\"SECRET raw provider diagnostic\"}");
    ObjectNode error = write("/api/resources/supplier-submit", body, c, 422);
    assertEquals("RESOURCE_UPSTREAM_HTTP_ERROR", error.path("code").asText());
    assertFalse(error.toString().contains("SECRET"));
    assertEquals("FAILED", store.list("resource", c.owner).get(0).path("dispatchState").asText());
    assertNotEquals("DELIVERED", store.list("resource", c.owner).get(0).path("state").asText());
    assertEquals(1, calls.get());
  }

  @Test
  void noTargetIsExplicitAndPrivateTargetsFailClosedOutsideTest() throws Exception {
    store.update(
        "resource-target",
        target.path("id").asText(),
        "GLOBAL",
        store.object().put("enabled", false));
    Client c = supplier();
    ObjectNode error = write("/api/resources/supplier-submit", submission(c), c, 503);
    assertEquals("RESOURCE_UPSTREAM_NOT_CONFIGURED", error.path("code").asText());
    assertTrue(store.list("resource", c.owner).isEmpty());
    boolean saved = gateway.allowPrivateTargets;
    gateway.allowPrivateTargets = false;
    try {
      ApiException unsafe =
          assertThrows(
              ApiException.class,
              () -> gateway.validateEndpoint(URI.create("https://127.0.0.1:1234"), true));
      assertEquals("UNSAFE_RESOURCE_TARGET", unsafe.code);
    } finally {
      gateway.allowPrivateTargets = saved;
    }
  }

  @Test
  void tcpProxyProbeTestsRealPortAndDoesNotClaimAuthentication() throws Exception {
    ObjectNode result = gateway.probeProxy("127.0.0.1", server.getAddress().getPort());
    assertTrue(result.path("ok").asBoolean());
    assertTrue(result.path("message").asText().contains("尚未验证"));
  }

  @Test
  void oauthSessionAndLifecycleUseRealAdapterIdsAndPersistProgress() throws Exception {
    Client c = supplier();
    ObjectNode credential = submission(c);
    ObjectNode input = (ObjectNode) credential.path("input").deepCopy();
    input.put("credentialMode", "OAUTH");
    input.remove("refreshToken");
    response.set(
        store
            .object()
            .put("sessionId", "remote-session")
            .put("authUrl", "https://auth.example.invalid/authorize")
            .put("expiresAt", "2099-01-01T00:00:00Z")
            .toString());
    ObjectNode authorized = write("/api/resources/oauth/supplier-authorize", input, c, 200);
    String session = authorized.path("sessionId").asText(),
        rid = authorized.path("resourceId").asText();
    assertNotEquals("remote-session", session);
    assertTrue(authorized.path("authUrl").asText().startsWith("https://"));
    response.set(
        store.object().put("state", "SUCCESS").put("laneId", "oauth-real-lane").toString());
    write(
        "/api/resources/oauth/supplier-submit",
        store.object().put("sessionId", session).put("code", "one-time-code"),
        c,
        200);
    assertEquals("/api/resources/oauth/supplier-submit", seenPath.get());
    ObjectNode resource = store.get("resource", rid, c.owner);
    assertEquals("DELIVERED", resource.path("state").asText());
    ObjectNode lifecycle =
        store.object().put("requestKey", UUID.randomUUID().toString()).put("action", "PAUSE");
    lifecycle
        .putArray("items")
        .add(
            store
                .object()
                .put("resourceId", rid)
                .put("version", resource.path("version").asLong()));
    ObjectNode jobResponse = store.object().put("state", "COMPLETED").put("id", "upstream-job");
    jobResponse.putArray("items").add(store.object().put("resourceId", rid).put("state", "PAUSED"));
    response.set(jobResponse.toString());
    ObjectNode job = write("/api/resource-lifecycle-jobs", lifecycle, c, 200);
    assertEquals("COMPLETED", job.path("state").asText());
    assertFalse(job.has("request"));
    mvc.perform(get("/api/resource-lifecycle-jobs/" + job.path("id").asText()).session(c.session))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.items[0].state").value("PAUSED"));
    int before = calls.get();
    ObjectNode replay = write("/api/resource-lifecycle-jobs", lifecycle, c, 200);
    assertEquals(job.path("id"), replay.path("id"));
    assertEquals(before, calls.get());
  }

  @Test
  void usageFailureDoesNotDowngradeAnAlreadyDeliveredResourceAndRequestsAreScoped()
      throws Exception {
    Client c = supplier();
    ObjectNode delivered = write("/api/resources/supplier-submit", submission(c), c, 200);
    String rid = delivered.path("resourceId").asText();
    httpStatus.set(500);
    write("/api/resources/" + rid + "/usage", store.object(), c, 500);
    assertEquals("SUCCESS", store.get("resource", rid, c.owner).path("dispatchState").asText());
    httpStatus.set(200);
    response.set(
        store
            .object()
            .put("state", "UPDATED")
            .put("amount", "4.75")
            .put("currency", "USD")
            .toString());
    ObjectNode fresh = store.get("resource", rid, c.owner);
    write(
        "/api/resources/" + rid + "/usage",
        store.object().put("requestKey", UUID.randomUUID().toString()),
        c,
        200);
    assertEquals("4.75", store.get("resource", rid, c.owner).path("usage").path("amount").asText());
    Client other = supplier();
    int count = calls.get();
    write("/api/resources/" + rid + "/usage", store.object(), other, 404);
    assertEquals(count, calls.get());
  }

  @Test
  void genericUsageOrSayHiSuccessCannotCreateDeliverySuccess() throws Exception {
    Client c = supplier();
    ObjectNode draft =
        store.create(
            "resource",
            c.owner,
            store
                .object()
                .put("supplierId", c.owner)
                .put("createdBy", c.uid)
                .put("resourceType", "CCMAX")
                .put("state", "DRAFT")
                .put("dispatchState", "PENDING")
                .put("accountName", "Pending account"));
    String id = draft.path("id").asText();
    response.set(
        store
            .object()
            .put("state", "SUCCESS")
            .put("ok", true)
            .put("amount", "2.25")
            .put("currency", "USD")
            .toString());
    write(
        "/api/resources/" + id + "/usage",
        store.object().put("requestKey", UUID.randomUUID().toString()),
        c,
        200);
    assertEquals("DRAFT", store.get("resource", id, c.owner).path("state").asText());
    assertEquals("PENDING", store.get("resource", id, c.owner).path("dispatchState").asText());
    write(
        "/api/resources/" + id + "/say-hi",
        store.object().put("requestKey", UUID.randomUUID().toString()),
        c,
        200);
    assertEquals("DRAFT", store.get("resource", id, c.owner).path("state").asText());
    assertEquals("PENDING", store.get("resource", id, c.owner).path("dispatchState").asText());
  }
}
