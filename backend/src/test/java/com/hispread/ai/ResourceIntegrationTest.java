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
  @Autowired BackgroundResourceJobService backgroundJobs;
  HttpServer server;
  AtomicInteger calls;
  AtomicReference<String> response;
  AtomicInteger httpStatus;
  AtomicReference<String> seenAuth, seenPath, seenUser, seenBody;
  ObjectNode target;
  AtomicReference<java.util.function.BiFunction<String, JsonNode, String>> responder;

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
    seenUser = new AtomicReference<>();
    seenBody = new AtomicReference<>();
    responder = new AtomicReference<>();
    server = HttpServer.create(new InetSocketAddress("127.0.0.1", 0), 0);
    server.createContext(
        "/",
        exchange -> {
          calls.incrementAndGet();
          seenAuth.set(exchange.getRequestHeaders().getFirst("Authorization"));
          seenUser.set(exchange.getRequestHeaders().getFirst("New-Api-User"));
          seenPath.set(exchange.getRequestURI().getPath());
          seenBody.set(new String(exchange.getRequestBody().readAllBytes(), StandardCharsets.UTF_8));
          String output = responder.get() == null ? response.get() : responder.get().apply(
              exchange.getRequestMethod() + " " + exchange.getRequestURI().getPath(),
              seenBody.get().isBlank() ? store.object() : store.parse(seenBody.get()));
          byte[] bytes = output.getBytes(StandardCharsets.UTF_8);
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
    store.create(
        "supplier-settings",
        "GLOBAL",
        store.object()
            .put("id", owner)
            .put("allowCcmax", true)
            .put("allowCcmaxReauthorization", true)
            .put("allowCcmaxPause", true)
            .put("allowCcmaxSafeRemoval", true));
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
  void disabledSupplierCannotStartNewOauthEvenWhenUpstreamIsConfigured() throws Exception {
    Client supplier = supplier();
    store.update("supplier-settings", supplier.owner, null, store.object().put("allowCcmax", false));
    ObjectNode settings = store.list("settings", null).get(0);
    store.update("settings", settings.path("id").asText(), null,
        store.object().put("allowAllSuppliersCcmax", false).put("forceStopCcmaxIntake", false));
    ObjectNode input = (ObjectNode) submission(supplier).path("input").deepCopy();
    input.put("credentialMode", "OAUTH").put("requestKey", UUID.randomUUID().toString());
    input.remove("refreshToken");
    response.set("{\"sessionId\":\"remote\",\"authUrl\":\"https://auth.example.invalid/authorize\",\"expiresAt\":\"2099-01-01T00:00:00Z\"}");
    mvc.perform(get("/api/resources/submission-capabilities").session(supplier.session))
        .andExpect(status().isOk()).andExpect(jsonPath("$.allowCcmax").value(false));
    ObjectNode error = write("/api/resources/oauth/supplier-authorize", input, supplier, 403);
    assertEquals("CCMAX_INTAKE_DISABLED", error.path("code").asText());
    ObjectNode credentialError = write("/api/resources/supplier-submit", submission(supplier), supplier, 403);
    assertEquals("CCMAX_INTAKE_DISABLED", credentialError.path("code").asText());
    assertEquals(0, calls.get());
    assertTrue(store.list("resource", supplier.owner).isEmpty());
  }

  void switches(ObjectNode patch) {
    ObjectNode settings = store.list("settings", null).get(0);
    store.update("settings", settings.path("id").asText(), null, patch);
  }

  ObjectNode oauthInput(Client supplier) {
    ObjectNode input = (ObjectNode) submission(supplier).path("input").deepCopy();
    input.put("credentialMode", "OAUTH").put("requestKey", UUID.randomUUID().toString());
    input.remove("refreshToken");
    return input;
  }

  void oauthReply() {
    response.set("{\"state\":\"READY\",\"sessionId\":\"remote\",\"authUrl\":\"https://auth.example.invalid/authorize\",\"expiresAt\":\"2099-01-01T00:00:00Z\"}");
  }

  @Test
  void forceStopOverridesGlobalAndSupplierButAllowsExistingOauthToCompleteAndCancel() throws Exception {
    Client supplier = supplier(), admin = administrator();
    ObjectNode input = oauthInput(supplier);
    oauthReply();
    ObjectNode authorized = write("/api/resources/oauth/supplier-authorize", input, supplier, 200);
    String sessionId = authorized.path("sessionId").asText();
    String resourceId = authorized.path("resourceId").asText();
    switches(store.object().put("allowAllSuppliersCcmax", true).put("forceStopCcmaxIntake", true));
    int before = calls.get();
    ObjectNode replay = write("/api/resources/oauth/supplier-authorize", input, supplier, 200);
    assertEquals(authorized.path("sessionId"), replay.path("sessionId"));
    assertEquals("CCMAX_INTAKE_STOPPED", write("/api/resources/oauth/supplier-authorize",
        oauthInput(supplier), supplier, 403).path("code").asText());
    ObjectNode adminInput = oauthInput(supplier).put("supplierId", supplier.owner);
    write("/api/resources/oauth/supplier-authorize", adminInput, admin, 403);
    write("/api/resources/" + resourceId + "/oauth/supplier-authorize",
        store.object().put("requestKey", UUID.randomUUID().toString()), supplier, 403);
    write("/api/resources/" + resourceId + "/dispatch", store.object(), supplier, 403);
    response.set("{\"state\":\"SUCCESS\",\"laneId\":\"accepted-before-stop\"}");
    ObjectNode completion = write("/api/resources/oauth/supplier-submit",
        store.object().put("sessionId", sessionId).put("code", "valid-before-stop"), supplier, 200);
    assertEquals("SUCCESS", completion.path("state").asText());
    before = calls.get();
    ObjectNode completionReplay = write("/api/resources/oauth/supplier-submit",
        store.object().put("sessionId", sessionId).put("code", "valid-before-stop"), supplier, 200);
    assertEquals(completion.path("operationId"), completionReplay.path("operationId"));
    assertEquals(before, calls.get());
    write("/api/resources/supplier-submit", submission(supplier), supplier, 403);
    assertEquals(before, calls.get());
    mvc.perform(get("/api/resources/" + resourceId).session(supplier.session)).andExpect(status().isOk());
    response.set("{\"state\":\"READY\"}");
    mvc.perform(get("/api/resources/oauth/supplier-session/" + sessionId).session(supplier.session))
        .andExpect(status().isOk());
    response.set("{\"state\":\"CANCELLED\"}");
    write("/api/resources/oauth/supplier-session/" + sessionId + "/cancel", store.object(), supplier, 200);
    mvc.perform(get("/api/resources/submission-capabilities").session(supplier.session))
        .andExpect(status().isOk()).andExpect(jsonPath("$.allowCcmax").value(false))
        .andExpect(jsonPath("$.forceStopCcmaxIntake").value(true))
        .andExpect(jsonPath("$.allowCcmaxReauthorization").value(true));
  }

  @Test
  void globalSwitchAndSupplierOverrideAreScopedAndDefaultClosed() throws Exception {
    Client supplier = supplier(), other = supplier(), admin = administrator();
    store.update("supplier-settings", supplier.owner, null, store.object().put("allowCcmax", false));
    switches(store.object().put("allowAllSuppliersCcmax", true).put("forceStopCcmaxIntake", false));
    oauthReply();
    write("/api/resources/oauth/supplier-authorize", oauthInput(supplier), supplier, 200);
    switches(store.object().put("allowAllSuppliersCcmax", false));
    store.update("supplier-settings", supplier.owner, null, store.object().put("allowCcmax", true));
    store.delete("supplier-settings", other.owner, null);
    write("/api/resources/oauth/supplier-authorize", oauthInput(supplier), supplier, 200);
    int before = calls.get();
    write("/api/resources/oauth/supplier-authorize", oauthInput(other), other, 403);
    assertEquals(before, calls.get());
    mvc.perform(get("/api/resources/submission-capabilities").session(admin.session)
            .param("supplierId", other.owner))
        .andExpect(status().isOk()).andExpect(jsonPath("$.allowCcmax").value(false));
    mvc.perform(get("/api/resources/submission-capabilities").session(supplier.session)
            .param("supplierId", other.owner))
        .andExpect(status().isOk()).andExpect(jsonPath("$.allowCcmax").value(true));
  }

  @Test
  void resourceOauthCompletionRequiresAnExistingSessionForThatResource() throws Exception {
    Client supplier = supplier();
    oauthReply();
    ObjectNode first = write("/api/resources/oauth/supplier-authorize", oauthInput(supplier), supplier, 200);
    ObjectNode second = write("/api/resources/oauth/supplier-authorize", oauthInput(supplier), supplier, 200);
    String firstId = first.path("resourceId").asText();
    String endpoint = "/api/resources/" + firstId + "/oauth/supplier-submit";
    switches(store.object().put("forceStopCcmaxIntake", true));
    int before = calls.get();
    write(endpoint, store.object().put("code", "fixture").put("requestKey", UUID.randomUUID().toString()), supplier, 400);
    write(endpoint, store.object().put("sessionId", second.path("sessionId").asText())
        .put("code", "fixture").put("requestKey", UUID.randomUUID().toString()), supplier, 404);
    assertEquals(before, calls.get());
    response.set("{\"state\":\"SUCCESS\",\"laneId\":\"completed-in-flight\"}");
    ObjectNode completion = write(endpoint, store.object().put("sessionId", first.path("sessionId").asText())
        .put("code", "fixture").put("requestKey", UUID.randomUUID().toString()), supplier, 200);
    assertEquals("SUCCESS", completion.path("state").asText());
    assertEquals(before + 1, calls.get());
  }

  @Test
  void reauthorizationSwitchIsIndependentOfNewIntakeAndKeepsCompletedReplayReadable() throws Exception {
    Client supplier = supplier(), admin = administrator();
    ObjectNode delivered = write("/api/resources/supplier-submit", submission(supplier), supplier, 200);
    String resourceId = delivered.path("resourceId").asText();
    store.update("supplier-settings", supplier.owner, null, store.object()
        .put("allowCcmax", false).put("allowCcmaxReauthorization", false));
    switches(store.object().put("allowAllSuppliersCcmax", false)
        .put("allowAllSuppliersCcmaxReauthorization", false).put("forceStopCcmaxIntake", true));
    int before = calls.get();
    for (String action : List.of("reauthorizations", "credential-refresh", "oauth/authorize")) {
      ObjectNode error = write("/api/resources/" + resourceId + "/" + action,
          store.object().put("requestKey", UUID.randomUUID().toString()), supplier, 403);
      assertEquals("CCMAX_REAUTHORIZATION_DISABLED", error.path("code").asText());
    }
    mvc.perform(get("/api/resources/" + resourceId + "/reauthorizations/current").session(supplier.session))
        .andExpect(status().isOk()).andExpect(jsonPath("$.reauthorizationAllowed").value(false));
    assertEquals(before, calls.get());
    store.update("supplier-settings", supplier.owner, null,
        store.object().put("allowCcmaxReauthorization", true));
    oauthReply();
    ObjectNode existing = write("/api/resources/" + resourceId + "/reauthorizations",
        store.object().put("requestKey", UUID.randomUUID().toString()), supplier, 200);
    store.update("supplier-settings", supplier.owner, null,
        store.object().put("allowCcmaxReauthorization", false));
    response.set("{\"state\":\"SUCCESS\",\"laneId\":\"fixture-lane\"}");
    ObjectNode completed = write("/api/resources/" + resourceId + "/reauthorizations/" + existing.path("id").asText(),
        store.object().put("requestKey", UUID.randomUUID().toString()).put("code", "existing-callback"), supplier, 200);
    assertEquals("SUCCESS", completed.path("state").asText());
    switches(store.object().put("allowAllSuppliersCcmaxReauthorization", true));
    response.set("{\"state\":\"UPDATED\"}");
    ObjectNode request = store.object().put("requestKey", UUID.randomUUID().toString());
    ObjectNode refreshed = write("/api/resources/" + resourceId + "/credential-refresh", request, supplier, 200);
    switches(store.object().put("allowAllSuppliersCcmaxReauthorization", false));
    before = calls.get();
    ObjectNode replay = write("/api/resources/" + resourceId + "/credential-refresh", request, supplier, 200);
    assertEquals(refreshed.path("operationId"), replay.path("operationId"));
    assertFalse(replay.path("reauthorizationAllowed").asBoolean());
    mvc.perform(get("/api/resources/" + resourceId + "/credential-refresh").session(supplier.session))
        .andExpect(status().isOk()).andExpect(jsonPath("$.reauthorizationAllowed").value(false));
    assertEquals(before, calls.get());
    ObjectNode adminRefresh = write("/api/resources/" + resourceId + "/credential-refresh",
        store.object().put("requestKey", UUID.randomUUID().toString()), admin, 200);
    assertEquals("UPDATED", adminRefresh.path("state").asText());
  }

  @Test
  void supplierLifecycleSwitchesAreEnforcedForEveryItemAndDoNotRestrictNewApi() throws Exception {
    Client supplier = supplier(), admin = administrator();
    ObjectNode delivered = write("/api/resources/supplier-submit", submission(supplier), supplier, 200);
    String resourceId = delivered.path("resourceId").asText();
    store.update("supplier-settings", supplier.owner, null, store.object()
        .put("allowCcmaxPause", false).put("allowCcmaxSafeRemoval", false));
    int before = calls.get();
    for (String action : List.of("PAUSE", "RESUME", "REMOVE")) {
      ObjectNode request = store.object().put("requestKey", UUID.randomUUID().toString()).put("action", action);
      request.putArray("items").add(store.object().put("resourceId", resourceId));
      ObjectNode rejected = write("/api/resource-lifecycle-jobs", request, supplier, 403);
      assertEquals(action.equals("REMOVE") ? "CCMAX_REMOVAL_DISABLED" : "CCMAX_PAUSE_DISABLED",
          rejected.path("code").asText());
    }
    assertEquals(before, calls.get());
    ObjectNode request = store.object().put("requestKey", UUID.randomUUID().toString()).put("action", "PAUSE");
    request.putArray("items").add(store.object().put("resourceId", resourceId));
    response.set("{\"state\":\"COMPLETED\",\"items\":[{\"resourceId\":\"" + resourceId + "\",\"state\":\"PAUSED\"}]}");
    write("/api/resource-lifecycle-jobs", request, admin, 200);
    store.update("resource", resourceId, supplier.owner,
        store.object().put("resourceType", "NEWAPI_CHANNEL").put("upstreamChannelId", "148"));
    request.put("requestKey", UUID.randomUUID().toString());
    write("/api/resource-lifecycle-jobs", request, supplier, 200);
  }

  @Test
  void bearerAndTeamMembersCannotBypassSupplierIntakeOrMaintenanceSwitches() throws Exception {
    Client supplier = supplier();
    ObjectNode input = oauthInput(supplier);
    String memberId = UUID.randomUUID().toString();
    ObjectNode member = store.object().put("id", memberId).put("username", "ccmax_member_" + memberId)
        .put("role", "SUPPLIER_AGENT").put("supplierId", supplier.owner).put("version", 0);
    member.set("permissions", auth.rolePermissions("SUPPLIER_AGENT"));
    member.putArray("projectIds").add(input.path("projectId").asText());
    auth.createUser(member, "FixtureTest@123");
    MockHttpSession session = new MockHttpSession();
    session.setAttribute("uid", memberId); session.setAttribute("sv", 0L);
    String csrf = json.readTree(mvc.perform(get("/api/auth/csrf").session(session))
        .andReturn().getResponse().getContentAsString()).path("token").asText();
    Client memberClient = new Client(session, csrf, supplier.owner, memberId);
    ObjectNode token = write("/api/auth/api-tokens", store.object().put("name", "policy-fixture"), memberClient, 200);
    store.update("supplier-settings", supplier.owner, null, store.object()
        .put("allowCcmax", false).put("allowCcmaxReauthorization", false));
    switches(store.object().put("allowAllSuppliersCcmax", false)
        .put("allowAllSuppliersCcmaxReauthorization", false).put("forceStopCcmaxIntake", false));
    oauthReply();
    write("/api/resources/oauth/supplier-authorize", input, memberClient, 403);
    mvc.perform(post("/api/open/v1/ccmax/submissions/oauth/authorize")
            .header("Authorization", "Bearer " + token.path("key").asText())
            .contentType("application/json").content(input.toString()))
        .andExpect(status().isForbidden()).andExpect(jsonPath("$.code").value("CCMAX_INTAKE_DISABLED"));
    mvc.perform(get("/api/resources/submission-capabilities").session(session))
        .andExpect(status().isOk()).andExpect(jsonPath("$.allowCcmax").value(false))
        .andExpect(jsonPath("$.allowCcmaxReauthorization").value(false));
    assertEquals(0, calls.get());
  }

  @Test
  void configuredSubmissionIsRealIdempotentScopedAndSecretSafe() throws Exception {
    Client c = supplier();
    ObjectNode body = submission(c);
    ObjectNode proxy = store.create("proxy", c.owner, store.object().put("supplierId", c.owner).put("enabled", true).put("url", "socks5://u:PRIVATE-PROXY@proxy.example:1234"));
    ((ObjectNode) body.path("input")).put("proxyId", proxy.path("id").asText());
    ObjectNode result = write("/api/resources/supplier-submit", body, c, 200);
    assertEquals("socks5://u:PRIVATE-PROXY@proxy.example:1234", json.readTree(seenBody.get()).path("input").path("proxyUrl").asText());
    assertEquals(result.path("resourceId").asText(), json.readTree(seenBody.get()).path("localResourceId").asText());
    assertFalse(result.toString().contains("PRIVATE-PROXY"));
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
  void plainHttpServerDoesNotPassAsAWorkingProxy() throws Exception {
    ObjectNode result = gateway.probeProxy("127.0.0.1", server.getAddress().getPort());
    assertFalse(result.path("ok").asBoolean());
    assertNotEquals("VERIFIED", result.path("state").asText());
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
    int completionCalls = calls.get();
    write("/api/resources/oauth/supplier-submit", store.object().put("sessionId", session).put("code", "one-time-code"), c, 200);
    assertEquals(completionCalls, calls.get());
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
    assertEquals("PAUSED", store.get("resource", rid, c.owner).path("operationalState").asText());
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
  @Test
  void malformedSuccessRemainsUnknownAndReplayNeverResendsIt() throws Exception {
    Client c = supplier(); ObjectNode body = submission(c);
    response.set("{\"state\":\"DELIVERED\",\"accessToken\":\"PRIVATE\"}");
    write("/api/resources/supplier-submit", body, c, 502);
    ObjectNode op = store.list("resource-operation", c.owner).get(0);
    assertEquals("UNKNOWN", op.path("state").asText());
    assertEquals("UNKNOWN", store.list("resource", c.owner).get(0).path("dispatchState").asText());
    store.update("resource-target", target.path("id").asText(), "GLOBAL", store.object().put("enabled", false));
    ObjectNode replay = write("/api/resources/supplier-submit", body, c, 200);
    assertEquals("UNKNOWN", replay.path("state").asText()); assertEquals(1, calls.get());
  }

  @Test
  void oauthAuthorizeReplayKeepsSingleDraftAndCredentialsInstallLocally() throws Exception {
    Client c = supplier(); ObjectNode input = (ObjectNode) submission(c).path("input").deepCopy();
    input.put("credentialMode", "OAUTH").put("requestKey", UUID.randomUUID().toString()); input.remove("refreshToken");
    response.set("{\"sessionId\":\"remote\",\"authUrl\":\"https://auth.example.invalid/authorize\",\"expiresAt\":\"2099-01-01T00:00:00Z\"}");
    ObjectNode first = write("/api/resources/oauth/supplier-authorize", input, c, 200);
    ObjectNode replay = write("/api/resources/oauth/supplier-authorize", input, c, 200);
    assertEquals(first.path("sessionId"), replay.path("sessionId")); assertEquals(1, calls.get()); assertEquals(1, store.list("resource", c.owner).size());
    String rid = first.path("resourceId").asText();
    response.set("{\"status\":\"complete\",\"credentials\":{\"refreshToken\":\"ROTATED-SECRET\"}}");
    ObjectNode refresh = store.object().put("requestId", UUID.randomUUID().toString()).put("version", store.get("resource", rid, c.owner).path("version").asLong());
    ObjectNode result = write("/api/resources/" + rid + "/credential-refresh", refresh, c, 200);
    assertFalse(result.toString().contains("ROTATED-SECRET"));
    assertEquals("ROTATED-SECRET", store.get("resource-secret", rid, c.owner).path("refreshToken").asText());
    int count = calls.get(); write("/api/resources/" + rid + "/credential-refresh", refresh, c, 200); assertEquals(count, calls.get());
  }

  @Test
  void confirmedProxyReplacementUpdatesBindingAndJobReplaySurvivesVersionChange() throws Exception {
    Client c = supplier(); ObjectNode delivered = write("/api/resources/supplier-submit", submission(c), c, 200);
    String rid = delivered.path("resourceId").asText();
    ObjectNode proxy = store.create("proxy", c.owner, store.object().put("supplierId", c.owner).put("name", "fixture").put("enabled", true).put("endpoint", "fixture:1234").put("url", "socks5://u:SECRET@proxy.example:1234"));
    ObjectNode request = store.object().put("requestKey", UUID.randomUUID().toString());
    request.putArray("items").add(store.object().put("resourceId", rid).put("resourceVersion", store.get("resource", rid, c.owner).path("version").asLong()).put("proxyId", proxy.path("id").asText()).put("proxyVersion", proxy.path("version").asLong()));
    ObjectNode remote = store.object().put("state", "COMPLETED"); remote.putArray("items").add(store.object().put("resourceId", rid).put("state", "DONE").put("bindingApplied", true)); response.set(remote.toString());
    ObjectNode job = write("/api/resource-proxy-replacements", request, c, 200);
    assertEquals(proxy.path("id"), store.get("resource", rid, c.owner).path("proxyId"));
    assertFalse(job.toString().contains("SECRET")); int before = calls.get();
    write("/api/resource-proxy-replacements", request, c, 200); assertEquals(before, calls.get());
  }

  @Test
  void newApiTargetBindsVerifiedChannelAndUsesPublishedDualHeaderProtocol() throws Exception {
    Client c = supplier();
    ObjectNode submission = write("/api/resources/supplier-submit", submission(c), c, 200);
    String rid = submission.path("resourceId").asText();
    store.update("resource-target", target.path("id").asText(), "GLOBAL", store.object().put("protocol", "NEWAPI").put("newApiUserId", "2"));
    ObjectNode resource = store.get("resource", rid, c.owner);
    // Test converts existing fixture into a mapped channel after verifying the published GET contract.
    String uid = UUID.randomUUID().toString(); ObjectNode admin = store.object().put("id",uid).put("username","resource_admin_"+uid).put("displayName","Admin").put("role","ADMIN").putNull("supplierId").put("version",0);
    admin.set("permissions",auth.allPermissions()); auth.createUser(admin,"FixtureTest@123");
    MockHttpSession session = new MockHttpSession(); session.setAttribute("uid",uid); session.setAttribute("sv",0L);
    String csrf = json.readTree(mvc.perform(get("/api/auth/csrf").session(session)).andReturn().getResponse().getContentAsString()).path("token").asText();
    Client adminClient = new Client(session,csrf,"GLOBAL",uid);
    response.set("{\"success\":true,\"data\":{\"id\":42,\"status\":1,\"used_quota\":250000}}");
    ObjectNode bound = write("/api/resources/"+rid+"/upstream-channel",store.object().put("targetId",target.path("id").asText()).put("channelId",42).put("version",resource.path("version").asLong()),adminClient,200);
    assertEquals("42",bound.path("upstreamChannelId").asText()); assertEquals("/api/channel/42",seenPath.get());
    assertEquals("NEWAPI_CHANNEL", bound.path("resourceType").asText());
    ObjectNode usage = write("/api/resources/"+rid+"/usage",store.object().put("requestKey",UUID.randomUUID().toString()),c,200);
    assertEquals("NEWAPI_QUOTA",usage.path("usage").path("unit").asText()); assertFalse(usage.has("amount")); assertEquals("Bearer fixture-admin-key",seenAuth.get()); assertEquals("2",seenUser.get());
    assertEquals("NEWAPI_QUOTA",store.get("resource",rid,c.owner).path("usage").path("unit").asText());
    int count = calls.get(); write("/api/resources/oauth/supplier-authorize",(ObjectNode) submission(c).path("input"),c,503); assertEquals(count,calls.get());
  }

  Client administrator() throws Exception {
    String uid = UUID.randomUUID().toString();
    ObjectNode admin = store.object().put("id", uid).put("username", "admin_" + uid).put("role", "ADMIN").put("displayName", "Admin").putNull("supplierId").put("version", 0);
    admin.set("permissions", auth.allPermissions()); auth.createUser(admin, "FixtureTest@123");
    MockHttpSession session = new MockHttpSession(); session.setAttribute("uid", uid); session.setAttribute("sv", 0L);
    String csrf = json.readTree(mvc.perform(get("/api/auth/csrf").session(session)).andReturn().getResponse().getContentAsString()).path("token").asText();
    return new Client(session, csrf, "GLOBAL", uid);
  }

  @Test void newApiPriorityUsesPreviewStartReplayAndReadbackWithoutChangingDelivery() throws Exception {
    Client supplier = supplier(), admin = administrator();
    ObjectNode input = submission(supplier);
    ObjectNode draft = store.create("resource", supplier.owner, store.object().put("supplierId", supplier.owner).put("projectId", input.path("input").path("projectId").asText()).put("resourceType", "CCMAX").put("state", "DRAFT").put("dispatchState", "NOT_SUBMITTED").put("name", "New API fixture"));
    String rid = draft.path("id").asText(), tid = target.path("id").asText();
    store.update("resource-target", tid, "GLOBAL", store.object().put("protocol", "NEWAPI").put("newApiUserId", "2"));
    AtomicInteger priority = new AtomicInteger(3), writes = new AtomicInteger(), status = new AtomicInteger(1);
    responder.set((request, body) -> {
      if (request.equals("POST /api/channel/148/status")) { status.set(body.path("status").asInt()); return "{\"success\":true,\"data\":true}"; }
      if (request.equals("PUT /api/channel/")) { priority.set(body.path("priority").asInt()); writes.incrementAndGet(); return "{\"success\":true}"; }
      return "{\"success\":true,\"data\":{\"id\":148,\"status\":" + status.get() + ",\"priority\":" + priority.get() + ",\"used_quota\":0,\"models\":\"fixture-model\",\"group\":\"default\",\"type\":1}}";
    });
    ObjectNode bind = store.object().put("targetId", tid).put("channelId", 148).put("version", 0);
    ObjectNode bound = write("/api/resources/" + rid + "/upstream-channel", bind, admin, 200);
    assertEquals("DRAFT", bound.path("state").asText());
    assertEquals("NOT_SUBMITTED", bound.path("dispatchState").asText());
    assertEquals("NEWAPI_CHANNEL", bound.path("resourceType").asText());
    mvc.perform(get("/api/resources/" + rid).session(admin.session)).andExpect(jsonPath("$.resourceType").value("NEWAPI_CHANNEL"));
    ObjectNode request = store.object().put("priority", 7).put("requestKey", UUID.randomUUID().toString());
    request.putArray("resourceIds").add(rid);
    ObjectNode preview = write("/api/cc-intake/admin/priority/jobs", request, admin, 200);
    assertEquals("PREVIEW", preview.path("state").asText()); assertEquals(0, writes.get());
    ObjectNode replay = write("/api/cc-intake/admin/priority/jobs", request, admin, 200);
    assertEquals(preview.path("id"), replay.path("id"));
    String job = "/api/cc-intake/admin/priority/jobs/" + preview.path("id").asText();
    ObjectNode started = write(job + "/start", store.object(), admin, 200);
    assertEquals("COMPLETED", started.path("state").asText()); assertEquals(1, writes.get());
    assertEquals(7, store.get("resource", rid, supplier.owner).path("upstreamPriority").asInt());
    write(job + "/start", store.object(), admin, 200); assertEquals(1, writes.get());
    write(job + "/reconcile", store.object(), admin, 200); assertEquals(1, writes.get());
    assertEquals("DRAFT", store.get("resource", rid, supplier.owner).path("state").asText());
    request.put("priority", 8); write("/api/cc-intake/admin/priority/jobs", request, admin, 409);
    write(job + "/start", store.object(), supplier, 403);
    ObjectNode pause = store.object().put("action", "PAUSE").put("requestKey", UUID.randomUUID().toString());
    pause.putArray("items").add(store.object().put("resourceId", rid));
    assertEquals("COMPLETED", write("/api/resource-lifecycle-jobs", pause, admin, 200).path("state").asText());
    assertEquals(2, status.get());
    assertEquals("PAUSED", store.get("resource", rid, supplier.owner).path("operationalState").asText());
    pause.put("action", "RESUME").put("requestKey", UUID.randomUUID().toString());
    write("/api/resource-lifecycle-jobs", pause, admin, 200); assertEquals(1, status.get());
    ObjectNode other = store.create("resource", supplier.owner, draft.deepCopy().put("id", UUID.randomUUID().toString()));
    bind.put("version", 0); write("/api/resources/" + other.path("id").asText() + "/upstream-channel", bind, admin, 409);
  }

  @Test
  void confirmedNewApiRemovalIsStableAndRemovedChannelsCannotBeOperated() throws Exception {
    Client supplier = supplier(), admin = administrator();
    String targetId = target.path("id").asText();
    store.update("resource-target", targetId, "GLOBAL",
        store.object().put("protocol", "NEWAPI").put("newApiUserId", "2"));
    ObjectNode resource = store.create("resource", supplier.owner, store.object()
        .put("supplierId", supplier.owner).put("targetId", targetId).put("name", "Removal fixture")
        .put("upstreamChannelId", "148").put("resourceType", "CCMAX")
        .put("state", "DRAFT").put("dispatchState", "NOT_SUBMITTED").put("operationalState", "ACTIVE"));
    String resourceId = resource.path("id").asText();
    ObjectNode priorityInput = store.object().put("priority", 0).put("requestKey", UUID.randomUUID().toString());
    priorityInput.putArray("resourceIds").add(resourceId);
    ObjectNode pendingPriority = write("/api/cc-intake/admin/priority/jobs", priorityInput, admin, 200);
    AtomicInteger deletes = new AtomicInteger();
    responder.set((request, body) -> {
      if (request.equals("DELETE /api/channel/148")) {
        deletes.incrementAndGet();
        return "{\"success\":true}";
      }
      return "{\"success\":false,\"message\":\"channel not found\"}";
    });
    ObjectNode removal = store.object().put("action", "REMOVE")
        .put("requestKey", UUID.randomUUID().toString());
    removal.putArray("items").add(store.object().put("resourceId", resourceId).put("version", 0));
    ObjectNode receipt = write("/api/resource-lifecycle-jobs", removal, admin, 200);
    String jobPath = "/api/resource-lifecycle-jobs/" + receipt.path("id").asText();
    assertEquals("COMPLETED", receipt.path("state").asText());
    int callsAfterDelete = calls.get();
    ObjectNode checked = write(jobPath + "/reconcile", store.object(), admin, 200);
    assertEquals("COMPLETED", checked.path("state").asText());
    assertEquals("GONE", checked.path("items").get(0).path("state").asText());
    assertEquals(callsAfterDelete, calls.get());
    write("/api/resource-lifecycle-jobs", removal, admin, 200);
    assertEquals(1, deletes.get());
    for (String action : List.of("usage", "say-hi")) {
      ObjectNode error = write("/api/resources/" + resourceId + "/" + action,
          store.object().put("requestKey", UUID.randomUUID().toString()), admin, 409);
      assertEquals("RESOURCE_CHANNEL_REMOVED", error.path("code").asText());
    }
    ObjectNode repeat = removal.deepCopy().put("requestKey", UUID.randomUUID().toString());
    ((ObjectNode) repeat.path("items").get(0)).put("version",
        store.get("resource", resourceId, supplier.owner).path("version").asLong());
    write("/api/resource-lifecycle-jobs", repeat, admin, 409);
    write("/api/cc-intake/admin/priority/jobs/" + pendingPriority.path("id").asText() + "/start",
        store.object(), admin, 409);
    assertEquals(callsAfterDelete, calls.get());
    assertEquals("GONE", store.get("resource", resourceId, supplier.owner).path("operationalState").asText());
  }

  void nativeTarget() {
    target = store.update("resource-target", target.path("id").asText(), "GLOBAL", store.object()
        .put("protocol", "CCMAX_NATIVE").put("adminUsername", "native-admin")
        .put("adminPassword", "PRIVATE-NATIVE-PASSWORD").put("defaultTarget", true));
  }

  ObjectNode nativeResource(Client supplier) {
    return store.create("resource", supplier.owner, store.object().put("supplierId", supplier.owner)
        .put("name", "Native fixture").put("resourceType", "CCMAX").put("state", "DRAFT")
        .put("dispatchState", "NOT_SUBMITTED"));
  }

  void nativeResponder(AtomicInteger logins, AtomicInteger accountStatus, AtomicInteger weight) {
    responder.set((request, body) -> {
      if (request.equals("POST /api/auth/admin-login")) {
        assertEquals("native-admin", body.path("identifier").asText());
        assertEquals("PRIVATE-NATIVE-PASSWORD", body.path("password").asText());
        logins.incrementAndGet();
        return "{\"access_token\":\"PRIVATE-NATIVE-SESSION\",\"user\":{\"role\":\"admin\"}}";
      }
      assertEquals("Bearer PRIVATE-NATIVE-SESSION", seenAuth.get());
      if (request.equals("GET /api/auth/me")) return "{\"role\":\"admin\"}";
      if (request.equals("GET /api/admin/request-logs")) return "{\"logs\":[],\"cursor\":null}";
      if (request.equals("GET /api/admin/oauth-accounts"))
        return "{\"accounts\":[{\"id\":\"native-148\",\"name\":\"Fixture\",\"status\":\"active\",\"weight\":10}],\"pagination\":{\"total_rows\":1}}";
      if (request.equals("PATCH /api/admin/oauth-accounts/native-148")) {
        if (body.has("status")) accountStatus.set(body.path("status").asText().equals("active") ? 1 : 0);
        if (body.has("weight")) weight.set(body.path("weight").asInt());
        return "{\"ok\":true}";
      }
      if (request.endsWith("/refresh-usage") || request.endsWith("/refresh")) return "{\"ok\":true,\"status\":\"updated\"}";
      if (request.equals("GET /api/admin/oauth-accounts/native-148"))
        return "{\"account\":{\"id\":\"native-148\",\"status\":\"" + (accountStatus.get()==1?"active":"disabled")
            + "\",\"weight\":" + weight.get() + ",\"health_status\":\"healthy\",\"total_cost\":\"12.5\"}}";
      if (request.equals("POST /api/admin/oauth-accounts/auth-url")) {
        assertFalse(body.path("overwrite_existing").asBoolean(true));
        return "{\"url\":\"https://claude.ai/oauth/authorize?state=fixture-state\",\"state\":\"fixture-state\",\"expires_in\":600}";
      }
      if (request.equals("POST /api/admin/oauth-accounts/exchange")) {
        assertFalse(body.path("overwrite_existing").asBoolean(true));
        return "{\"id\":\"new-account\",\"status\":\"active\",\"overwritten\":false}";
      }
      if (request.equals("GET /api/admin/oauth-accounts/new-account"))
        return "{\"account\":{\"id\":\"new-account\",\"status\":\"active\",\"weight\":10,\"total_cost\":\"0\"}}";
      throw new AssertionError("Unexpected native path: " + request);
    });
  }

  @Test
  void nativeConfigurationConnectionBindingUsageLifecycleAndPriorityAreSecretSafe() throws Exception {
    nativeTarget();
    Client supplier = supplier(), admin = administrator(), other = supplier();
    AtomicInteger logins = new AtomicInteger(), status = new AtomicInteger(1), weight = new AtomicInteger(10);
    nativeResponder(logins, status, weight);
    String targetId = target.path("id").asText();
    mvc.perform(get("/api/resource-targets/" + targetId).session(admin.session))
        .andExpect(status().isOk()).andExpect(jsonPath("$.adminPassword").doesNotExist())
        .andExpect(jsonPath("$.adminPasswordConfigured").value(true));
    ObjectNode check = write("/api/resource-targets/" + targetId + "/test", store.object(), admin, 200);
    assertEquals("READY", check.path("state").asText());
    ObjectNode local = nativeResource(supplier); String id = local.path("id").asText();
    ObjectNode binding = store.object().put("targetId", targetId).put("accountId", "native-148").put("version", 0);
    ObjectNode mapped = write("/api/resources/" + id + "/upstream-account", binding, admin, 200);
    assertEquals("CCMAX_NATIVE", mapped.path("upstreamProtocol").asText());
    assertEquals("DRAFT", mapped.path("state").asText());
    assertEquals("NOT_SUBMITTED", mapped.path("dispatchState").asText());
    assertEquals("12.5", mapped.path("usage").path("amount").asText());
    ObjectNode usage = write("/api/resources/" + id + "/usage", store.object().put("requestKey", UUID.randomUUID().toString()), supplier, 200);
    assertEquals("UPDATED", usage.path("state").asText());
    assertFalse(usage.toString().contains("PRIVATE"));
    int before = calls.get();
    write("/api/resources/" + id + "/usage", store.object(), other, 404);
    assertEquals(before, calls.get());
    write("/api/resources/" + id + "/upstream-account", binding, supplier, 403);
    ObjectNode second = nativeResource(supplier);
    write("/api/resources/" + second.path("id").asText() + "/upstream-account", binding, admin, 409);
    ObjectNode action = store.object().put("action", "PAUSE").put("requestKey", UUID.randomUUID().toString());
    action.putArray("items").add(store.object().put("resourceId", id));
    ObjectNode paused = write("/api/resource-lifecycle-jobs", action, admin, 200);
    assertEquals("COMPLETED", paused.path("state").asText());
    assertEquals(0, status.get());
    write("/api/resource-lifecycle-jobs/" + paused.path("id").asText() + "/reconcile", store.object(), admin, 200);
    action.put("action", "RESUME").put("requestKey", UUID.randomUUID().toString());
    write("/api/resource-lifecycle-jobs", action, admin, 200); assertEquals(1, status.get());
    ObjectNode priority = store.object().put("priority", 7).put("requestKey", UUID.randomUUID().toString());
    priority.putArray("resourceIds").add(id);
    ObjectNode preview = write("/api/cc-intake/admin/priority/jobs", priority, admin, 200);
    String path = "/api/cc-intake/admin/priority/jobs/" + preview.path("id").asText();
    assertEquals("CCMAX_NATIVE", preview.path("protocol").asText());
    write(path + "/start", store.object(), admin, 200); assertEquals(7, weight.get());
    before = calls.get(); write(path + "/start", store.object(), admin, 200); assertEquals(before, calls.get());
    write(path + "/reconcile", store.object(), admin, 200);
    assertEquals(1, logins.get());
  }

  @Test
  void nativePriorityRetryOnlyResendsExplicitlyRejectedItems() throws Exception {
    nativeTarget(); Client supplier = supplier(), admin = administrator();
    AtomicInteger weight = new AtomicInteger(10), secondWeight = new AtomicInteger(10);
    AtomicInteger firstWrites = new AtomicInteger(), secondWrites = new AtomicInteger();
    AtomicBoolean rejectSecond = new AtomicBoolean(true);
    nativeResponder(new AtomicInteger(), new AtomicInteger(1), weight);
    var original = responder.get();
    responder.set((request, body) -> {
      httpStatus.set(200);
      if (request.equals("PATCH /api/admin/oauth-accounts/native-148")) firstWrites.incrementAndGet();
      if (request.equals("PATCH /api/admin/oauth-accounts/native-second")) {
        secondWrites.incrementAndGet();
        if (rejectSecond.get()) { httpStatus.set(422); return "{\"error\":\"fixture rejection\"}"; }
        secondWeight.set(body.path("weight").asInt());
        return "{\"ok\":true}";
      }
      if (request.equals("GET /api/admin/oauth-accounts/native-second"))
        return "{\"account\":{\"id\":\"native-second\",\"status\":\"active\",\"weight\":" + secondWeight.get() + "}}";
      return original.apply(request, body);
    });
    ObjectNode first = nativeResource(supplier), second = nativeResource(supplier);
    store.update("resource", first.path("id").asText(), supplier.owner,
        store.object().put("targetId", target.path("id").asText()).put("upstreamAccountId", "native-148"));
    store.update("resource", second.path("id").asText(), supplier.owner,
        store.object().put("targetId", target.path("id").asText()).put("upstreamAccountId", "native-second"));
    ObjectNode input = store.object().put("priority", 11).put("requestKey", UUID.randomUUID().toString());
    input.putArray("resourceIds").add(first.path("id").asText()).add(second.path("id").asText());
    ObjectNode preview = write("/api/cc-intake/admin/priority/jobs", input, admin, 200);
    String path = "/api/cc-intake/admin/priority/jobs/" + preview.path("id").asText();
    ObjectNode partial = write(path + "/start", store.object(), admin, 200);
    assertEquals("PARTIAL_FAILED", partial.path("state").asText());
    assertEquals(1, partial.path("counts").path("SUCCESS").asInt());
    assertEquals(1, partial.path("counts").path("FAILED").asInt());
    assertEquals(0, partial.path("counts").path("UNKNOWN").asInt());
    write(path + "/start", store.object(), admin, 200);
    assertEquals(1, firstWrites.get()); assertEquals(1, secondWrites.get());
    rejectSecond.set(false);
    ObjectNode retried = write(path + "/retry", store.object(), admin, 200);
    assertEquals("COMPLETED", retried.path("state").asText());
    assertEquals(2, retried.path("counts").path("SUCCESS").asInt());
    assertEquals(1, firstWrites.get()); assertEquals(2, secondWrites.get());
    write(path + "/retry", store.object(), admin, 200);
    assertEquals(1, firstWrites.get()); assertEquals(2, secondWrites.get());
  }

  @Test
  void nativePriorityReadbackFailureStaysUnknownAndReconcilesWithoutWriting() throws Exception {
    nativeTarget(); Client supplier = supplier(), admin = administrator();
    AtomicInteger writes = new AtomicInteger(), weight = new AtomicInteger(10);
    AtomicBoolean readUnavailable = new AtomicBoolean(true);
    nativeResponder(new AtomicInteger(), new AtomicInteger(1), weight);
    var original = responder.get();
    responder.set((request, body) -> {
      httpStatus.set(200);
      if (request.equals("PATCH /api/admin/oauth-accounts/native-148")) writes.incrementAndGet();
      if (request.equals("GET /api/admin/oauth-accounts/native-148") && readUnavailable.get()) {
        httpStatus.set(403); return "{\"error\":\"fixture read temporarily forbidden\"}";
      }
      return original.apply(request, body);
    });
    ObjectNode resource = nativeResource(supplier);
    store.update("resource", resource.path("id").asText(), supplier.owner,
        store.object().put("targetId", target.path("id").asText()).put("upstreamAccountId", "native-148"));
    ObjectNode input = store.object().put("priority", 11).put("requestKey", UUID.randomUUID().toString());
    input.putArray("resourceIds").add(resource.path("id").asText());
    ObjectNode preview = write("/api/cc-intake/admin/priority/jobs", input, admin, 200);
    String path = "/api/cc-intake/admin/priority/jobs/" + preview.path("id").asText();
    ObjectNode uncertain = write(path + "/start", store.object(), admin, 200);
    assertEquals("UNKNOWN", uncertain.path("state").asText());
    assertEquals(1, uncertain.path("counts").path("UNKNOWN").asInt());
    write(path + "/retry", store.object(), admin, 200); assertEquals(1, writes.get());
    readUnavailable.set(false);
    ObjectNode reconciled = write(path + "/reconcile", store.object(), admin, 200);
    assertEquals("COMPLETED", reconciled.path("state").asText());
    assertEquals(1, reconciled.path("counts").path("SUCCESS").asInt());
    assertEquals(1, writes.get());
  }

  @Test
  void acceptedNativePauseWithRejectedReadbackStaysUnknownUntilReadOnlyRecovery() throws Exception {
    nativeTarget();
    Client supplier = supplier(), admin = administrator();
    AtomicInteger status = new AtomicInteger(1), patches = new AtomicInteger();
    nativeResponder(new AtomicInteger(), status, new AtomicInteger(10));
    var healthy = responder.get();
    AtomicBoolean denyRead = new AtomicBoolean(true);
    responder.set((request, input) -> {
      httpStatus.set(200);
      if (request.equals("PATCH /api/admin/oauth-accounts/native-148")) patches.incrementAndGet();
      if (request.equals("GET /api/admin/oauth-accounts/native-148") && denyRead.get()) {
        httpStatus.set(403);
        return "{\"error\":\"fixture read denied\"}";
      }
      return healthy.apply(request, input);
    });
    ObjectNode local = nativeResource(supplier);
    String id = local.path("id").asText();
    store.update("resource", id, supplier.owner, store.object().put("targetId", target.path("id").asText())
        .put("upstreamAccountId", "native-148").put("upstreamProtocol", "CCMAX_NATIVE").put("operationalState", "ACTIVE"));
    ObjectNode input = store.object().put("requestKey", UUID.randomUUID().toString()).put("action", "PAUSE");
    input.putArray("items").addObject().put("resourceId", id);
    ObjectNode uncertain = write("/api/resource-lifecycle-jobs", input, admin, 200);
    assertEquals("UNKNOWN", uncertain.path("state").asText());
    assertEquals(0, uncertain.path("failedCount").asInt());
    write("/api/resource-lifecycle-jobs", input, admin, 200);
    assertEquals(1, patches.get());
    denyRead.set(false);
    ObjectNode recovered = write("/api/resource-lifecycle-jobs/" + uncertain.path("id").asText() + "/reconcile", store.object(), admin, 200);
    assertEquals("COMPLETED", recovered.path("state").asText());
    assertEquals(1, patches.get());
    assertEquals("PAUSED", store.get("resource", id, supplier.owner).path("operationalState").asText());
  }

  @Test
  void historicalFailedPriorityHasStableDetailShapeWithoutInventedItemCounts() throws Exception {
    Client admin = administrator();
    ObjectNode operation = store.object().put("supplierId", "GLOBAL").put("type", "PRIORITY")
        .put("state", "FAILED").put("total", 1)
        .put("errorCode", "RESOURCE_OPERATION_UNSUPPORTED")
        .put("error", "上游操作未完成，请查询原操作");
    operation.putArray("items").addObject().put("resourceId", "historical-removed-local")
        .put("resourceName", "Historical channel");
    ObjectNode saved = store.create("resource-operation", "GLOBAL", operation);
    String id = saved.path("id").asText();
    long version = saved.path("version").asLong();
    mvc.perform(get("/api/cc-intake/admin/priority/jobs/" + id).session(admin.session))
        .andExpect(status().isOk()).andExpect(jsonPath("$.state").value("FAILED"))
        .andExpect(jsonPath("$.total").value(1)).andExpect(jsonPath("$.counts").isMap())
        .andExpect(jsonPath("$.counts").isEmpty())
        .andExpect(jsonPath("$.items[0].resourceName").value("Historical channel"))
        .andExpect(jsonPath("$.items[0].state").doesNotExist())
        .andExpect(jsonPath("$.errorCode").value("RESOURCE_OPERATION_UNSUPPORTED"));
    var response = mvc.perform(get("/api/cc-intake/admin/priority/jobs").session(admin.session))
        .andExpect(status().isOk()).andReturn();
    JsonNode listed = null;
    for (JsonNode item : json.readTree(response.getResponse().getContentAsString()))
      if (item.path("id").asText().equals(id)) listed = item;
    assertNotNull(listed);
    assertTrue(listed.path("counts").isObject());
    assertTrue(listed.path("counts").isEmpty());
    assertEquals(version, store.get("resource-operation", id, "GLOBAL").path("version").asLong());
    assertEquals(0, calls.get());
  }

  @Test
  void nativeOAuthUsesOpaqueSessionsChecksStateAndAvoidsRepeatedExchange() throws Exception {
    nativeTarget(); Client supplier = supplier();
    AtomicInteger logins = new AtomicInteger(); nativeResponder(logins, new AtomicInteger(1), new AtomicInteger(10));
    ObjectNode input = (ObjectNode) submission(supplier).path("input");
    input.put("credentialMode", "OAUTH").put("requestKey", UUID.randomUUID().toString());
    input.remove("refreshToken");
    ObjectNode authorized = write("/api/resources/oauth/supplier-authorize", input, supplier, 200);
    assertEquals("READY", authorized.path("state").asText());
    String sessionId = authorized.path("sessionId").asText();
    assertFalse(sessionId.equals("fixture-state"));
    write("/api/resources/oauth/supplier-submit", store.object().put("sessionId", sessionId).put("code", "code#wrong-state"), supplier, 400);
    ObjectNode completed = write("/api/resources/oauth/supplier-submit", store.object().put("sessionId", sessionId).put("code", "code#fixture-state"), supplier, 200);
    assertEquals("SUCCESS", completed.path("state").asText());
    String rid = completed.path("resourceId").asText();
    assertEquals("new-account", store.get("resource", rid, supplier.owner).path("upstreamAccountId").asText());
    assertEquals("DELIVERED", store.get("resource", rid, supplier.owner).path("state").asText());
    int before = calls.get();
    write("/api/resources/oauth/supplier-submit", store.object().put("sessionId", sessionId).put("code", "code#fixture-state"), supplier, 200);
    assertEquals(before, calls.get());
    mvc.perform(get("/api/cc-intake/mine").session(supplier.session))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.total").value(1))
        .andExpect(jsonPath("$.unknown").value(1))
        .andExpect(jsonPath("$.pro").value(0))
        .andExpect(jsonPath("$.nonPro").value(0));
  }

  @Test
  void expiredNativeOAuthCanBeQueriedCancelledAndReplacedWithoutExchangingCode() throws Exception {
    nativeTarget(); Client supplier = supplier(), other = supplier();
    nativeResponder(new AtomicInteger(), new AtomicInteger(1), new AtomicInteger(10));
    ObjectNode input = (ObjectNode) submission(supplier).path("input");
    input.put("credentialMode", "OAUTH").put("requestKey", UUID.randomUUID().toString());
    input.remove("refreshToken");
    ObjectNode authorized = write("/api/resources/oauth/supplier-authorize", input, supplier, 200);
    String id = authorized.path("sessionId").asText();
    ObjectNode operation = store.get("resource-operation", id, supplier.owner);
    String upstreamId = operation.path("upstreamId").asText();
    store.update("native-oauth", upstreamId, "GLOBAL", store.object()
        .put("expiresAt", java.time.Instant.now().minusSeconds(1).toString()));
    int upstreamCalls = calls.get();
    mvc.perform(get("/api/resources/oauth/supplier-session/" + id).session(supplier.session))
        .andExpect(status().isOk()).andExpect(jsonPath("$.state").value("EXPIRED"))
        .andExpect(jsonPath("$.authUrl").doesNotExist());
    assertEquals("EXPIRED", store.get("native-oauth", upstreamId, "GLOBAL").path("state").asText());
    mvc.perform(get("/api/resources/oauth/supplier-session/" + id).session(other.session))
        .andExpect(status().isNotFound());
    ObjectNode denied = write("/api/resources/oauth/supplier-submit", store.object()
        .put("sessionId", id).put("code", "fixture-code#fixture-state"), supplier, 409);
    assertEquals("OAUTH_SESSION_EXPIRED", denied.path("code").asText());
    for (int repeat = 0; repeat < 2; repeat++) {
      ObjectNode cancelled = write("/api/resources/oauth/supplier-session/" + id + "/cancel",
          store.object(), supplier, 200);
      assertEquals("EXPIRED", cancelled.path("state").asText());
    }
    assertEquals(upstreamCalls, calls.get());
    assertFalse(store.list("resource-operation", supplier.owner).stream()
        .anyMatch(op -> op.path("type").asText().equals("OAUTH_COMPLETE")));
    input.put("requestKey", UUID.randomUUID().toString());
    ObjectNode next = write("/api/resources/oauth/supplier-authorize", input, supplier, 200);
    assertEquals("READY", next.path("state").asText());
    assertNotEquals(id, next.path("sessionId").asText());
  }

  @Test
  void expiredClockDoesNotClearNativeOAuthAlreadySubmittedForExchange() throws Exception {
    nativeTarget(); Client supplier = supplier();
    nativeResponder(new AtomicInteger(), new AtomicInteger(1), new AtomicInteger(10));
    ObjectNode input = (ObjectNode) submission(supplier).path("input");
    input.put("credentialMode", "OAUTH").put("requestKey", UUID.randomUUID().toString());
    input.remove("refreshToken");
    ObjectNode authorized = write("/api/resources/oauth/supplier-authorize", input, supplier, 200);
    String id = authorized.path("sessionId").asText();
    String upstreamId = store.get("resource-operation", id, supplier.owner).path("upstreamId").asText();
    store.update("native-oauth", upstreamId, "GLOBAL", store.object().put("state", "SUBMITTING")
        .put("expiresAt", java.time.Instant.now().minusSeconds(1).toString()));
    int before = calls.get();
    mvc.perform(get("/api/resources/oauth/supplier-session/" + id).session(supplier.session))
        .andExpect(status().isOk()).andExpect(jsonPath("$.state").value("SUBMITTING"));
    write("/api/resources/oauth/supplier-session/" + id + "/cancel", store.object(), supplier, 409);
    write("/api/resources/oauth/supplier-submit", store.object()
        .put("sessionId", id).put("code", "fixture-code#fixture-state"), supplier, 409);
    assertEquals(before, calls.get());
    assertEquals("SUBMITTING", store.get("native-oauth", upstreamId, "GLOBAL").path("state").asText());
    assertFalse(store.list("resource-operation", supplier.owner).stream()
        .anyMatch(op -> op.path("type").asText().equals("OAUTH_COMPLETE")));
  }

  @Test
  void openApiProjectCodeFilterFindsOAuthDeliveriesWithoutStoredProjectCodes() throws Exception {
    nativeTarget(); Client supplier = supplier(), other = supplier();
    nativeResponder(new AtomicInteger(), new AtomicInteger(1), new AtomicInteger(10));
    ObjectNode input = (ObjectNode) submission(supplier).path("input");
    String projectId = input.path("projectId").asText();
    store.update("project", projectId, null, store.object().put("code", "CCMAX-FORM-TEST"));
    input.put("credentialMode", "OAUTH").put("requestKey", UUID.randomUUID().toString());
    input.remove("refreshToken");
    ObjectNode authorized = write("/api/resources/oauth/supplier-authorize", input, supplier, 200);
    ObjectNode completed = write("/api/resources/oauth/supplier-submit", store.object()
        .put("sessionId", authorized.path("sessionId").asText()).put("code", "fixture#fixture-state"), supplier, 200);
    String resourceId = completed.path("resourceId").asText();
    ObjectNode foreign = nativeResource(other);
    store.update("resource", foreign.path("id").asText(), other.owner,
        store.object().put("projectId", projectId));
    ObjectNode token = write("/api/auth/api-tokens", store.object().put("name", "fixture-project-filter"), supplier, 200);
    String bearer = "Bearer " + token.path("key").asText();
    mvc.perform(get("/api/open/v1/ccmax/resources").header("Authorization", bearer)
            .param("projectCode", "CCMAX-FORM-TEST").param("operationalStatus", "ACTIVE"))
        .andExpect(status().isOk()).andExpect(jsonPath("$.total").value(1))
        .andExpect(jsonPath("$.items[0].id").value(resourceId))
        .andExpect(jsonPath("$.items[0].projectCode").value("CCMAX-FORM-TEST"));
    mvc.perform(get("/api/open/v1/ccmax/resources/" + resourceId).header("Authorization", bearer))
        .andExpect(status().isOk()).andExpect(jsonPath("$.projectCode").value("CCMAX-FORM-TEST"));
    mvc.perform(get("/api/open/v1/ccmax/resources").header("Authorization", bearer)
            .param("projectCode", "NONEXISTENT"))
        .andExpect(status().isOk()).andExpect(jsonPath("$.total").value(0));
    store.update("resource", resourceId, supplier.owner, store.object().put("projectCode", "STALE-CODE"));
    store.update("project", projectId, null, store.object().put("code", "CURRENT-CODE"));
    mvc.perform(get("/api/open/v1/ccmax/resources").header("Authorization", bearer)
            .param("projectCode", "CURRENT-CODE"))
        .andExpect(status().isOk()).andExpect(jsonPath("$.total").value(1))
        .andExpect(jsonPath("$.items[0].projectCode").value("CURRENT-CODE"));
    mvc.perform(get("/api/open/v1/ccmax/resources").header("Authorization", bearer)
            .param("projectCode", "STALE-CODE"))
        .andExpect(status().isOk()).andExpect(jsonPath("$.total").value(0));
  }

  @Test
  void openApiUsesNativeOperationalStateAndExcludesLegacyNewApiChannels() throws Exception {
    Client supplier = supplier();
    ObjectNode token = write("/api/auth/api-tokens", store.object().put("name", "fixture-open-api"), supplier, 200);
    String bearer = "Bearer " + token.path("key").asText();
    ObjectNode active = nativeResource(supplier);
    active = store.update("resource", active.path("id").asText(), supplier.owner, store.object()
        .put("operationalState", "ACTIVE").put("upstreamProtocol", "CCMAX_NATIVE")
        .put("upstreamAccountId", "native-active").put("laneId", "native-active")
        .put("state", "DELIVERED").put("dispatchState", "SUCCESS")
        .put("accessToken", "PRIVATE-RESOURCE-CREDENTIAL"));
    ObjectNode paused = nativeResource(supplier);
    store.update("resource", paused.path("id").asText(), supplier.owner,
        store.object().put("operationalStatus", "PAUSED"));
    ObjectNode newApi = nativeResource(supplier);
    store.update("resource", newApi.path("id").asText(), supplier.owner,
        store.object().put("upstreamChannelId", "148").put("upstreamProtocol", "NEWAPI")
            .put("operationalState", "ACTIVE"));
    mvc.perform(get("/api/open/v1/ccmax/resources").header("Authorization", bearer))
        .andExpect(status().isOk()).andExpect(jsonPath("$.total").value(2));
    mvc.perform(get("/api/open/v1/ccmax/resources").header("Authorization", bearer)
            .param("operationalStatus", "ACTIVE"))
        .andExpect(status().isOk()).andExpect(jsonPath("$.total").value(1))
        .andExpect(jsonPath("$.items[0].id").value(active.path("id").asText()))
        .andExpect(jsonPath("$.items[0].operationalStatus").value("ACTIVE"))
        .andExpect(jsonPath("$.items[0].operationalState").value("ACTIVE"))
        .andExpect(jsonPath("$.items[0].accessToken").doesNotExist());
    mvc.perform(get("/api/open/v1/ccmax/resources/" + active.path("id").asText())
            .header("Authorization", bearer))
        .andExpect(status().isOk()).andExpect(jsonPath("$.operationalStatus").value("ACTIVE"))
        .andExpect(jsonPath("$.operationalState").value("ACTIVE"))
        .andExpect(jsonPath("$.accessToken").doesNotExist());
    mvc.perform(get("/api/open/v1/ccmax/resources").header("Authorization", bearer)
            .param("operationalStatus", "PAUSED"))
        .andExpect(status().isOk()).andExpect(jsonPath("$.total").value(1))
        .andExpect(jsonPath("$.items[0].operationalStatus").value("PAUSED"));
    mvc.perform(get("/api/open/v1/ccmax/resources/" + newApi.path("id").asText())
            .header("Authorization", bearer))
        .andExpect(status().isNotFound());
    int upstreamBefore = calls.get();
    mvc.perform(post("/api/open/v1/ccmax/resources/" + newApi.path("id").asText() + "/credential-refresh")
            .header("Authorization", bearer).contentType("application/json").content("{}"))
        .andExpect(status().isNotFound());
    assertEquals(upstreamBefore, calls.get());
  }

  @Test
  void overviewCountsEnabledNativeAccountsAndUsesTheResourceFilters() throws Exception {
    Client supplier = supplier(), other = supplier();
    String selectedProject = UUID.randomUUID().toString();
    String otherProject = UUID.randomUUID().toString();
    for (String[] fixture : List.of(
        new String[] {selectedProject, "ACTIVE"},
        new String[] {selectedProject, "READY"},
        new String[] {otherProject, "PAUSED"})) {
      store.create("resource", supplier.owner, store.object()
          .put("supplierId", supplier.owner).put("createdBy", supplier.uid)
          .put("projectId", fixture[0]).put("resourceType", "CCMAX")
          .put("state", "DELIVERED").put("dispatchState", "SUCCESS")
          .put("operationalState", fixture[1]));
    }
    store.create("resource", other.owner, store.object()
        .put("supplierId", other.owner).put("createdBy", other.uid)
        .put("projectId", selectedProject).put("resourceType", "CCMAX")
        .put("state", "DELIVERED").put("dispatchState", "SUCCESS")
        .put("operationalState", "ACTIVE"));
    store.create("resource", supplier.owner, store.object()
        .put("supplierId", supplier.owner).put("createdBy", supplier.uid)
        .put("projectId", selectedProject).put("resourceType", "CCMAX")
        .put("upstreamProtocol", "NEWAPI").put("upstreamChannelId", "148")
        .put("state", "DELIVERED").put("dispatchState", "SUCCESS")
        .put("operationalState", "ACTIVE"));
    store.create("resource", supplier.owner, store.object()
        .put("supplierId", supplier.owner).put("createdBy", supplier.uid)
        .put("projectId", selectedProject).put("resourceType", "CCMAX")
        .put("state", "DRAFT").put("dispatchState", "NOT_SUBMITTED"));
    store.create("resource", supplier.owner, store.object()
        .put("supplierId", supplier.owner).put("createdBy", supplier.uid)
        .put("projectId", selectedProject).put("resourceType", "OTHER")
        .put("state", "DELIVERED").put("dispatchState", "SUCCESS")
        .put("operationalState", "ACTIVE"));
    mvc.perform(get("/api/resources/overview").session(supplier.session)
            .param("resourceType", "CCMAX").param("projectId", selectedProject))
        .andExpect(status().isOk()).andExpect(jsonPath("$.counts.total").value(2))
        .andExpect(jsonPath("$.counts.active").value(1))
        .andExpect(jsonPath("$.counts.ready").value(1))
        .andExpect(jsonPath("$.counts.paused").value(0))
        .andExpect(jsonPath("$.counts.unknownState").value(0));
    mvc.perform(get("/api/resources").session(supplier.session)
            .param("resourceType", "CCMAX").param("projectId", selectedProject)
            .param("operationalStatus", "ACTIVE"))
        .andExpect(status().isOk()).andExpect(jsonPath("$.total").value(1));
    mvc.perform(get("/api/resources").session(supplier.session)
            .param("resourceType", "CCMAX").param("projectId", selectedProject)
            .param("operationalStatus", "ALL"))
        .andExpect(status().isOk()).andExpect(jsonPath("$.total").value(2));
  }

  @Test
  void nativeQuotaStatsAndTodayConsumptionSurviveRefreshAndOverview() throws Exception {
    nativeTarget();
    Client supplier = supplier(), admin = administrator();
    AtomicInteger logins = new AtomicInteger(), state = new AtomicInteger(1), weight = new AtomicInteger(10);
    nativeResponder(logins, state, weight);
    var original = responder.get();
    String observed = "2026-11-13T00:57:33.425Z";
    String reset = "2027-01-01T05:40:00Z";
    String today = BusinessSupport.today();
    String logTime = java.time.LocalDate.parse(today).atStartOfDay(java.time.ZoneId.of("Asia/Shanghai"))
        .plusHours(1).toInstant().toString();
    responder.set((request, input) -> {
      if (request.equals("GET /api/admin/oauth-accounts/native-148")) {
        ObjectNode reply = store.object();
        reply.putObject("account").put("id", "native-148").put("status", "active")
            .put("weight", 10).put("health_status", "healthy").put("total_cost", "12.5")
            .put("access_token", "PRIVATE-DO-NOT-PROJECT");
        ((ObjectNode) reply.path("account")).putObject("subscription_info").put("plan", "max")
            .put("checked_at", observed).put("private_field", "PRIVATE-UNMAPPED");
        ObjectNode stats = reply.putObject("stats");
        stats.put("claude_utilization_updated_at", observed).put("daily_cost", 999999);
        ObjectNode utilization = stats.putObject("claude_utilization");
        utilization.putObject("five_hour").put("utilization", 0).put("resets_at", reset);
        utilization.putObject("seven_day").put("utilization", 83).put("resets_at", reset);
        return reply.toString();
      }
      if (request.equals("GET /api/admin/request-logs")) {
        ObjectNode reply = store.object();
        ArrayNode logs = reply.putArray("logs");
        for (String[] log : List.of(new String[] {"log-1", "0.113479"}, new String[] {"log-2", "0.096663"}))
          logs.addObject().put("id", log[0]).put("account_id", "native-148")
              .put("created_at", logTime).put("request_model", "fixture-model")
              .put("cost_official_usd", log[1]);
        reply.putNull("cursor");
        return reply.toString();
      }
      return original.apply(request, input);
    });
    ObjectNode local = nativeResource(supplier);
    String id = local.path("id").asText();
    write("/api/resources/" + id + "/upstream-account", store.object()
        .put("targetId", target.path("id").asText()).put("accountId", "native-148").put("version", 0), admin, 200);
    ObjectNode refreshed = write("/api/resources/" + id + "/usage", store.object()
        .put("requestKey", UUID.randomUUID().toString()), supplier, 200);
    assertEquals(0, refreshed.path("resourceData").path("usage").path("fiveHourPercent").asInt(-1));
    assertEquals(83, refreshed.path("resourceData").path("usage").path("sevenDayPercent").asInt(-1));
    assertEquals(reset, refreshed.path("resourceData").path("usage").path("fiveHourResetsAt").asText());
    assertEquals(observed, refreshed.path("resourceData").path("usage").path("fiveHourObservedAt").asText());
    assertEquals("max", refreshed.path("resourceData").path("usage").path("plan").path("tier").asText());
    assertEquals("0.210142", refreshed.path("dailyConsumption").path("amount").asText());
    assertEquals(today, refreshed.path("dailyConsumption").path("businessDate").asText());
    assertFalse(refreshed.toString().contains("PRIVATE"));
    assertFalse(refreshed.toString().contains("999999"));
    ObjectNode batch = gateway.exchange(target, "POST", "/resources/sync", store.object(), "quota-sync");
    assertEquals(0, batch.path("resources").path(0).path("resourceData").path("usage").path("fiveHourPercent").asInt(-1));
    assertEquals("0.210142", batch.path("resources").path(0).path("dailyConsumption").path("amount").asText());
    store.update("resource", id, supplier.owner, store.object().putNull("resourceData").putNull("dailyConsumption"));
    ObjectNode syncResult = backgroundJobs.sync(store.object().put("type", "CCMAX_STATUS_SYNC")
        .put("targetId", target.path("id").asText()), UUID.randomUUID().toString());
    assertEquals(1, syncResult.path("processedCount").asInt());
    ObjectNode persisted = store.get("resource", id, supplier.owner);
    assertEquals(83, persisted.path("resourceData").path("usage").path("sevenDayPercent").asInt(-1));
    assertEquals("0.210142", persisted.path("dailyConsumption").path("amount").asText());
    assertEquals(0, store.list("bill", supplier.owner).size());
    var healthy = responder.get();
    AtomicBoolean failRead = new AtomicBoolean(true);
    AtomicInteger refreshRequests = new AtomicInteger();
    responder.set((request, input) -> {
      if (request.endsWith("/refresh-usage")) refreshRequests.incrementAndGet();
      if (request.equals("GET /api/admin/request-logs") && failRead.get()) {
        httpStatus.set(503);
        return "{\"error\":\"unavailable\"}";
      }
      httpStatus.set(200);
      return healthy.apply(request, input);
    });
    long beforeFailure = store.get("resource", id, supplier.owner).path("version").asLong();
    ObjectNode request = store.object().put("requestKey", UUID.randomUUID().toString());
    write("/api/resources/" + id + "/usage", request, supplier, 503);
    assertEquals(beforeFailure, store.get("resource", id, supplier.owner).path("version").asLong());
    ObjectNode replay = write("/api/resources/" + id + "/usage", request, supplier, 200);
    assertEquals("UNKNOWN", replay.path("state").asText());
    assertEquals(1, refreshRequests.get());
    failRead.set(false);
    ObjectNode reconciled = write("/api/resource-lifecycle-jobs/" + replay.path("operationId").asText()
        + "/reconcile", store.object(), supplier, 200);
    assertEquals("UPDATED", reconciled.path("state").asText());
    assertEquals(1, refreshRequests.get());
    assertEquals("0.210142", store.get("resource", id, supplier.owner).path("dailyConsumption").path("amount").asText());
    store.update("resource", id, supplier.owner, store.object().put("state", "DELIVERED").put("dispatchState", "SUCCESS"));
    mvc.perform(get("/api/resources/overview").session(supplier.session).param("resourceType", "CCMAX"))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.fiveHour.reportedCount").value(1))
        .andExpect(jsonPath("$.fiveHour.averageUsedPercent").value(0))
        .andExpect(jsonPath("$.fiveHour.missingCount").value(0))
        .andExpect(jsonPath("$.sevenDay.averageUsedPercent").value(83))
        .andExpect(jsonPath("$.dailyConsumption.amount").value("0.210142"))
        .andExpect(jsonPath("$.dailyConsumption.reportedResourceCount").value(1));
  }

  @Test
  void nativeQuotaIgnoresInvalidOptionalTelemetryAndKeepsConfirmedZeroDailyUsage() throws Exception {
    nativeTarget();
    Client supplier = supplier(), admin = administrator();
    nativeResponder(new AtomicInteger(), new AtomicInteger(1), new AtomicInteger(10));
    var original = responder.get();
    responder.set((request, input) -> {
      if (request.equals("GET /api/admin/oauth-accounts/native-148")) {
        ObjectNode reply = store.parse(original.apply(request, input));
        ObjectNode stats = reply.putObject("stats");
        stats.put("claude_utilization_updated_at", "invalid-date");
        ObjectNode usage = stats.putObject("claude_utilization");
        usage.putObject("five_hour").put("utilization", "0").put("resets_at", "invalid-date");
        usage.putObject("seven_day").put("utilization", 101);
        return reply.toString();
      }
      return original.apply(request, input);
    });
    ObjectNode local = nativeResource(supplier);
    String id = local.path("id").asText();
    write("/api/resources/" + id + "/upstream-account", store.object().put("version", 0)
        .put("targetId", target.path("id").asText()).put("accountId", "native-148"), admin, 200);
    ObjectNode result = write("/api/resources/" + id + "/usage", store.object()
        .put("requestKey", UUID.randomUUID().toString()), supplier, 200);
    assertFalse(result.path("resourceData").has("usage"));
    assertEquals("0", result.path("dailyConsumption").path("amount").asText());
    assertEquals("UPDATED", result.path("state").asText());
  }

  @Test
  void quotaOverviewUsesValidSnapshotsAndKeepsStateSeparateFromMissingWindows() throws Exception {
    Client supplier = supplier(), other = supplier();
    String project = UUID.randomUUID().toString();
    ObjectNode a = intakeResource(supplier, supplier.uid, "DELIVERED", "SUCCESS");
    ObjectNode b = intakeResource(supplier, supplier.uid, "DELIVERED", "SUCCESS");
    ObjectNode gone = intakeResource(supplier, supplier.uid, "DELIVERED", "SUCCESS");
    for (ObjectNode resource : List.of(a, b, gone)) {
      ObjectNode patch = store.object().put("projectId", project).put("operationalState", "ACTIVE");
      patch.putObject("resourceData").putObject("usage").put("fiveHourPercent", 100).put("sevenDayPercent", 25)
          .put("fiveHourResetsAt", "2027-01-01T05:00:00Z");
      patch.putObject("dailyConsumption").put("businessDate", BusinessSupport.today())
          .put("currency", "USD").put("amount", "0.10");
      if (resource == b) {
        patch.put("operationalState", "MISSING_USAGE");
        ((ObjectNode) patch.path("resourceData").path("usage"))
            .put("fiveHourPercent", 50).put("sevenDayPercent", "invalid");
        ((ObjectNode) patch.path("dailyConsumption")).put("businessDate", "2000-01-01");
      }
      if (resource == gone) patch.put("operationalState", "GONE");
      store.update("resource", resource.path("id").asText(), supplier.owner, patch);
    }
    ObjectNode foreign = intakeResource(other, other.uid, "DELIVERED", "SUCCESS");
    store.update("resource", foreign.path("id").asText(), other.owner,
        store.object().put("projectId", project).put("operationalState", "ACTIVE"));
    mvc.perform(get("/api/resources/overview").session(supplier.session)
            .param("resourceType", "CCMAX").param("projectId", project))
        .andExpect(status().isOk()).andExpect(jsonPath("$.counts.total").value(3))
        .andExpect(jsonPath("$.counts.active").value(1)).andExpect(jsonPath("$.counts.missingUsage").value(1))
        .andExpect(jsonPath("$.counts.gone").value(1))
        .andExpect(jsonPath("$.fiveHour.reportedCount").value(2))
        .andExpect(jsonPath("$.fiveHour.averageUsedPercent").value(75))
        .andExpect(jsonPath("$.fiveHour.exhaustedCount").value(1))
        .andExpect(jsonPath("$.fiveHour.remainingEquivalent").value(0.5))
        .andExpect(jsonPath("$.sevenDay.missingCount").value(1))
        .andExpect(jsonPath("$.dailyConsumption.amount").value("0.20"));
    mvc.perform(get("/api/resources").session(supplier.session).param("resourceType", "CCMAX")
            .param("projectId", project).param("operationalStatus", "FIVE_HOUR_EXHAUSTED"))
        .andExpect(status().isOk()).andExpect(jsonPath("$.total").value(1))
        .andExpect(jsonPath("$.items[0].id").value(a.path("id").asText()));
  }

  ObjectNode intakeResource(Client supplier, String creator, String resourceState, String dispatch) {
    return store.create("resource", supplier.owner, store.object()
        .put("supplierId", supplier.owner).put("resourceType", "CCMAX")
        .put("createdBy", creator).put("state", resourceState).put("dispatchState", dispatch));
  }

  void intakeReceipt(Client supplier, ObjectNode resource, String state, String time) {
    store.create("resource-operation", supplier.owner, store.object()
        .put("supplierId", supplier.owner).put("resourceId", resource.path("id").asText())
        .put("type", "OAUTH_COMPLETE").put("state", state)
        .put("createdAt", time).put("finishedAt", time));
  }

  @Test
  void intakeCountsUseShanghaiCompletionDayTenantAndDistinctConfirmedResources() throws Exception {
    Client supplier = supplier(), other = supplier();
    java.time.Instant boundary = java.time.LocalDate.parse(BusinessSupport.today())
        .atStartOfDay(java.time.ZoneId.of("Asia/Shanghai")).toInstant();
    String today = boundary.plusSeconds(1).toString(), yesterday = boundary.minusSeconds(1).toString();
    ObjectNode first = intakeResource(supplier, supplier.uid, "DELIVERED", "SUCCESS");
    intakeReceipt(supplier, first, "SUCCESS", today);
    intakeReceipt(supplier, first, "SUCCESS", today); // distinct operations, one delivery
    ObjectNode old = intakeResource(supplier, supplier.uid, "DELIVERED", "SUCCESS");
    intakeReceipt(supplier, old, "SUCCESS", yesterday);
    intakeReceipt(supplier, old, "SUCCESS", today); // later confirmation cannot re-date intake
    ObjectNode archived = intakeResource(supplier, supplier.uid, "DELIVERED", "SUCCESS");
    store.update("resource", archived.path("id").asText(), supplier.owner,
        store.object().put("operationalState", "GONE").put("deleted", true));
    intakeReceipt(supplier, archived, "SUCCESS", today); // archival does not erase the day's intake
    ObjectNode mapped = intakeResource(supplier, supplier.uid, "DRAFT", "NOT_SUBMITTED");
    store.create("resource-operation", supplier.owner, store.object()
        .put("supplierId", supplier.owner).put("resourceId", mapped.path("id").asText())
        .put("type", "REAUTHORIZATIONS/session").put("state", "SUCCESS")
        .put("finishedAt", today));
    ObjectNode pending = intakeResource(supplier, supplier.uid, "DRAFT", "UNKNOWN");
    intakeReceipt(supplier, pending, "UNKNOWN", today);
    intakeReceipt(supplier, pending, "UNKNOWN", today);
    ObjectNode failed = intakeResource(supplier, supplier.uid, "DRAFT", "FAILED");
    intakeReceipt(supplier, failed, "FAILED", today);
    ObjectNode foreign = intakeResource(other, other.uid, "DELIVERED", "SUCCESS");
    intakeReceipt(other, foreign, "SUCCESS", today);
    ObjectNode newApi = intakeResource(supplier, supplier.uid, "DELIVERED", "SUCCESS");
    store.update("resource", newApi.path("id").asText(), supplier.owner,
        store.object().put("upstreamChannelId", "148"));
    intakeReceipt(supplier, newApi, "SUCCESS", today);
    mvc.perform(get("/api/cc-intake/mine").session(supplier.session)
            .param("supplierId", other.owner).param("search", "no-match"))
        .andExpect(status().isOk()).andExpect(jsonPath("$.total").value(2))
        .andExpect(jsonPath("$.unknown").value(2)).andExpect(jsonPath("$.processing").value(1));
    mvc.perform(get("/api/cc-intake/mine").session(other.session))
        .andExpect(status().isOk()).andExpect(jsonPath("$.total").value(1));
  }

  @Test
  void successfulDeliveryReconciliationPreservesOriginalSubmissionDay() throws Exception {
    Client supplier = supplier();
    ObjectNode submitted = write("/api/resources/supplier-submit", submission(supplier), supplier, 200);
    String resourceId = submitted.path("resourceId").asText();
    String operationId = submitted.path("operationId").asText();
    String yesterday = java.time.LocalDate.parse(BusinessSupport.today()).minusDays(1)
        .atStartOfDay(java.time.ZoneId.of("Asia/Shanghai")).toInstant().toString();
    store.update("resource", resourceId, supplier.owner, store.object().put("submittedAt", yesterday));
    store.update("resource-operation", operationId, supplier.owner, store.object().put("finishedAt", yesterday));
    write("/api/resource-lifecycle-jobs/" + operationId + "/reconcile", store.object(), supplier, 200);
    assertEquals(yesterday, store.get("resource", resourceId, supplier.owner).path("submittedAt").asText());
    mvc.perform(get("/api/cc-intake/mine").session(supplier.session))
        .andExpect(status().isOk()).andExpect(jsonPath("$.total").value(0));
  }

  @Test
  void pendingDeliveryConfirmedOnLaterDayCountsOnConfirmationDay() throws Exception {
    Client supplier = supplier();
    response.set("{\"state\":\"PENDING\"}");
    ObjectNode submitted = write("/api/resources/supplier-submit", submission(supplier), supplier, 200);
    String resourceId = submitted.path("resourceId").asText();
    String operationId = submitted.path("operationId").asText();
    String yesterday = java.time.LocalDate.parse(BusinessSupport.today()).minusDays(1)
        .atStartOfDay(java.time.ZoneId.of("Asia/Shanghai")).toInstant().toString();
    store.update("resource-operation", operationId, supplier.owner, store.object().put("finishedAt", yesterday));
    response.set("{\"state\":\"SUCCESS\",\"laneId\":\"confirmed-account\"}");
    write("/api/resource-lifecycle-jobs/" + operationId + "/reconcile", store.object(), supplier, 200);
    mvc.perform(get("/api/cc-intake/mine").session(supplier.session))
        .andExpect(status().isOk()).andExpect(jsonPath("$.total").value(1));
  }

  @Test
  void memberIntakeReportsOwnDeliveriesEvenForGroupAdministrator() throws Exception {
    Client supplier = supplier();
    String memberId = UUID.randomUUID().toString(), teammateId = UUID.randomUUID().toString();
    String projectId = submission(supplier).path("input").path("projectId").asText();
    ObjectNode member = store.object().put("id", memberId).put("username", "member_" + memberId)
        .put("role", "SUPPLIER_AGENT").put("supplierId", supplier.owner).put("version", 0);
    member.set("permissions", auth.rolePermissions("SUPPLIER_AGENT"));
    member.putArray("projectIds").add(projectId);
    ObjectNode group = store.create("group", supplier.owner,
        store.object().put("adminUserId", memberId));
    group.putArray("memberIds").add(memberId).add(teammateId);
    store.update("group", group.path("id").asText(), supplier.owner, group);
    member.set("teamAdminGroup", group);
    auth.createUser(member, "FixtureTest@123");
    MockHttpSession session = new MockHttpSession();
    session.setAttribute("uid", memberId); session.setAttribute("sv", 0L);
    ObjectNode own = intakeResource(supplier, memberId, "DELIVERED", "SUCCESS");
    store.update("resource", own.path("id").asText(), supplier.owner, store.object().put("projectId", projectId));
    intakeReceipt(supplier, own, "SUCCESS", java.time.Instant.now().toString());
    ObjectNode teammate = intakeResource(supplier, teammateId, "DELIVERED", "SUCCESS");
    store.update("resource", teammate.path("id").asText(), supplier.owner, store.object().put("projectId", projectId));
    intakeReceipt(supplier, teammate, "SUCCESS", java.time.Instant.now().toString());
    mvc.perform(get("/api/cc-intake/mine").session(session))
        .andExpect(status().isOk()).andExpect(jsonPath("$.total").value(1));
    mvc.perform(get("/api/cc-intake/mine").session(supplier.session))
        .andExpect(status().isOk()).andExpect(jsonPath("$.total").value(2));
  }

  @Test
  void nativeDailySyncProducesScopedPendingObservationsWithoutCredentials() throws Exception {
    nativeTarget(); Client supplier = supplier();
    ObjectNode local = nativeResource(supplier);
    local = store.update("resource", local.path("id").asText(), supplier.owner, store.object()
        .put("targetId", target.path("id").asText()).put("upstreamAccountId", "native-148").put("laneId", "native-148"));
    nativeResponder(new AtomicInteger(), new AtomicInteger(1), new AtomicInteger(10));
    java.util.function.BiFunction<String,JsonNode,String> original = responder.get();
    responder.set((request,body) -> {
      if (request.equals("GET /api/admin/request-logs")) return "{\"logs\":[{\"id\":\"log-1\",\"created_at\":\"2026-11-10T01:00:00Z\",\"account_id\":\"native-148\",\"request_model\":\"fixture-model\",\"cost_official_usd\":0.25,\"session_key\":\"PRIVATE\"},{\"id\":\"other\",\"account_id\":\"unmapped\"}],\"cursor\":null}";
      return original.apply(request,body);
    });
    ObjectNode body = store.object().put("businessDate", "2026-11-10");
    body.putArray("resources").add(store.object().put("resourceId", local.path("id").asText()).put("supplierId", supplier.owner));
    ObjectNode observations = gateway.exchange(target, "POST", "/jobs/ccmax/daily-sync", body, "daily");
    assertEquals(1, observations.path("rows").size());
    assertEquals("0.25", observations.path("rows").get(0).path("originalAmount").asText());
    assertEquals(supplier.owner, observations.path("rows").get(0).path("supplierId").asText());
    assertFalse(observations.toString().contains("PRIVATE"));
  }

  @Test
  void nativeManagementReauthenticatesOnlyAfterUnauthorizedAndNeverLeaksPassword() throws Exception {
    nativeTarget(); Client admin = administrator();
    AtomicInteger login = new AtomicInteger(), reads = new AtomicInteger();
    responder.set((request, body) -> {
      if (request.equals("POST /api/auth/admin-login")) {
        login.incrementAndGet(); httpStatus.set(200);
        return "{\"access_token\":\"PRIVATE-SESSION\",\"user\":{\"role\":\"admin\"}}";
      }
      if (reads.incrementAndGet() == 1) {httpStatus.set(401);return "{\"error\":\"expired\"}";}
      httpStatus.set(200);return "{\"role\":\"admin\"}";
    });
    ObjectNode result = write("/api/resource-targets/" + target.path("id").asText() + "/test", store.object(), admin, 200);
    assertEquals(2, login.get());
    assertEquals(2, reads.get());
    assertFalse(result.toString().contains("PRIVATE"));
    String path = "/api/resource-targets/" + target.path("id").asText();
    mvc.perform(put(path).session(admin.session).header("X-CSRF-TOKEN",admin.csrf)
        .contentType("application/json").content(store.object().put("name","Updated native fixture")
            .put("adminPassword", "").put("version", target.path("version").asLong()).toString()))
        .andExpect(status().isOk()).andExpect(jsonPath("$.adminPassword").doesNotExist())
        .andExpect(jsonPath("$.adminPasswordConfigured").value(true));
    assertEquals("PRIVATE-NATIVE-PASSWORD",store.get("resource-target",target.path("id").asText(),null).path("adminPassword").asText());
  }

  @Test
  void nativeOAuthExistingAccountCannotBeRecordedAsNewDelivery() throws Exception {
    nativeTarget(); Client supplier = supplier();
    nativeResponder(new AtomicInteger(), new AtomicInteger(1), new AtomicInteger(10));
    var previous = responder.get();
    responder.set((request, body) -> request.equals("POST /api/admin/oauth-accounts/exchange")
        ? "{\"id\":\"native-148\",\"overwritten\":true}" : previous.apply(request,body));
    ObjectNode input = (ObjectNode) submission(supplier).path("input");
    input.put("credentialMode", "OAUTH").put("requestKey",UUID.randomUUID().toString());
    ObjectNode session = write("/api/resources/oauth/supplier-authorize",input,supplier,200);
    ObjectNode result = write("/api/resources/oauth/supplier-submit",store.object()
        .put("sessionId",session.path("sessionId").asText()).put("code","code#fixture-state"),supplier,409);
    assertEquals("RESOURCE_EXISTING_ACCOUNT_UPDATED",result.path("code").asText());
    assertNotEquals("DELIVERED",store.get("resource",session.path("resourceId").asText(),supplier.owner).path("state").asText());
  }

  @Test
  void nativeUsageTimeoutReplayUsesOriginalOperationAndReadOnlyReconciliation() throws Exception {
    nativeTarget(); Client supplier = supplier();
    ObjectNode local = nativeResource(supplier);
    store.update("resource",local.path("id").asText(),supplier.owner,store.object()
        .put("targetId",target.path("id").asText()).put("upstreamAccountId","native-148").put("laneId","native-148"));
    nativeResponder(new AtomicInteger(),new AtomicInteger(1),new AtomicInteger(10));
    var previous = responder.get(); AtomicInteger refreshes = new AtomicInteger();
    responder.set((request,body)->{
      if(request.endsWith("/refresh-usage")){refreshes.incrementAndGet();httpStatus.set(504);return "{}";}
      httpStatus.set(200);return previous.apply(request,body);
    });
    ObjectNode payload = store.object().put("requestKey",UUID.randomUUID().toString());
    write("/api/resources/"+local.path("id").asText()+"/usage",payload,supplier,504);
    ObjectNode repeated = write("/api/resources/"+local.path("id").asText()+"/usage",payload,supplier,200);
    assertEquals("UNKNOWN",repeated.path("state").asText());
    assertEquals(1,refreshes.get());
    ObjectNode operation = store.list("resource-operation",supplier.owner).get(0);
    ObjectNode reconciled = write("/api/resource-lifecycle-jobs/"+operation.path("id").asText()+"/reconcile",store.object(),supplier,200);
    assertEquals("UPDATED",reconciled.path("state").asText());
    assertEquals(1,refreshes.get());
  }

  @Test
  void nativeCredentialImportRefreshAndArchivePreserveReceiptsAndAvoidDuplicates() throws Exception {
    nativeTarget(); Client supplier = supplier(), admin = administrator();
    nativeResponder(new AtomicInteger(),new AtomicInteger(1),new AtomicInteger(10));
    var previous = responder.get(); AtomicInteger imports = new AtomicInteger(),archives = new AtomicInteger();
    responder.set((request,body)->{
      if(request.equals("POST /api/admin/oauth-accounts/import-rt")){
        imports.incrementAndGet();assertEquals("PRIVATE-REFRESH",body.path("refresh_token").asText());
        assertFalse(body.path("overwrite_existing").asBoolean(true));
        return "{\"ok\":true,\"id\":\"new-account\",\"overwritten\":false}";
      }
      if(request.equals("POST /api/admin/oauth-accounts/new-account/refresh"))
        return "{\"access_token\":{\"masked\":\"MASKED\"},\"refresh_token\":{\"masked\":\"MASKED\"}}";
      if(request.equals("DELETE /api/admin/oauth-accounts/new-account")){
        archives.incrementAndGet();assertFalse(body.path("release_proxy").asBoolean(true));return "{\"ok\":true}";
      }
      if(request.equals("GET /api/admin/archived-accounts/new-account")) return "{\"account\":{\"id\":\"new-account\"}}";
      return previous.apply(request,body);
    });
    ObjectNode input = submission(supplier);
    ObjectNode submitted = write("/api/resources/supplier-submit",input,supplier,200);
    String rid = submitted.path("resourceId").asText();
    assertEquals("DELIVERED",store.get("resource",rid,supplier.owner).path("state").asText());
    write("/api/resources/supplier-submit",input,supplier,200);assertEquals(1,imports.get());
    ObjectNode refreshed = write("/api/resources/"+rid+"/credential-refresh",store.object().put("requestKey",UUID.randomUUID().toString()),supplier,200);
    assertEquals("UPDATED",refreshed.path("state").asText());assertFalse(refreshed.toString().contains("MASKED"));
    ObjectNode removal = store.object().put("action","REMOVE").put("requestKey",UUID.randomUUID().toString());
    removal.putArray("items").add(store.object().put("resourceId",rid));
    ObjectNode removed = write("/api/resource-lifecycle-jobs",removal,admin,200);
    assertEquals("GONE",removed.path("items").get(0).path("state").asText());
    int before = calls.get();
    write("/api/resource-lifecycle-jobs/"+removed.path("id").asText()+"/reconcile",store.object(),admin,200);
    assertEquals(before,calls.get());assertEquals(1,archives.get());
    write("/api/resources/"+rid+"/usage",store.object(),supplier,409);
  }

  @Test
  void bearerReauthorizationCurrentAndOriginalIdReflectDurableCompletion() throws Exception {
    nativeTarget(); Client supplier = supplier(), other = supplier();
    ObjectNode local = nativeResource(supplier);
    String rid = local.path("id").asText();
    store.update("resource", rid, supplier.owner, store.object()
        .put("targetId", target.path("id").asText()).put("laneId", "native-148")
        .put("upstreamAccountId", "native-148").put("upstreamProtocol", "CCMAX_NATIVE"));
    nativeResponder(new AtomicInteger(), new AtomicInteger(1), new AtomicInteger(10));
    var original = responder.get(); AtomicInteger exchanges = new AtomicInteger();
    responder.set((request, body) -> {
      if (request.equals("POST /api/admin/oauth-accounts/native-148/reauthorize"))
        return "{\"url\":\"https://claude.ai/oauth/authorize?state=reauth-state\",\"state\":\"reauth-state\",\"expires_in\":600}";
      if (request.equals("POST /api/admin/oauth-accounts/native-148/reauthorize/exchange")) {
        exchanges.incrementAndGet();
        return "{\"account\":{\"id\":\"native-148\",\"status\":\"active\"}}";
      }
      return original.apply(request, body);
    });
    ObjectNode token = write("/api/auth/api-tokens", store.object().put("name", "reauth-fixture"), supplier, 200);
    String bearer = "Bearer " + token.path("key").asText();
    String base = "/api/open/v1/ccmax/resources/" + rid + "/reauthorizations";
    var generated = mvc.perform(post(base).header("Authorization", bearer)
            .contentType("application/json").content(store.object().put("requestKey", UUID.randomUUID().toString()).toString()))
        .andExpect(status().isOk()).andExpect(jsonPath("$.state").value("READY")).andReturn();
    String id = json.readTree(generated.getResponse().getContentAsString()).path("id").asText();
    ObjectNode input = store.object().put("code", "fixture-code#reauth-state")
        .put("requestKey", UUID.randomUUID().toString());
    var completed = mvc.perform(put(base + "/" + id).header("Authorization", bearer)
            .contentType("application/json").content(input.toString()))
        .andExpect(status().isOk()).andExpect(jsonPath("$.state").value("SUCCESS")).andReturn();
    String completionId = json.readTree(completed.getResponse().getContentAsString()).path("operationId").asText();
    // Existing deployments retain a READY start record and a separate successful completion.
    assertEquals("READY", store.get("resource-operation", id, supplier.owner).path("state").asText());
    int before = calls.get(); long version = store.get("resource", rid, supplier.owner).path("version").asLong();
    for (String path : List.of(base + "/current", base + "/" + id,
        "/api/resources/" + rid + "/reauthorizations/current",
        "/api/resources/" + rid + "/reauthorizations/" + id)) {
      var result = path.startsWith("/api/open/")
          ? mvc.perform(get(path).header("Authorization", bearer))
          : mvc.perform(get(path).session(supplier.session));
      result.andExpect(status().isOk()).andExpect(jsonPath("$.state").value("SUCCESS"))
          .andExpect(jsonPath("$.id").value(id))
          .andExpect(jsonPath("$.completionOperationId").value(completionId))
          .andExpect(jsonPath("$.authUrl").doesNotExist());
    }
    mvc.perform(put(base + "/" + id).header("Authorization", bearer)
            .contentType("application/json").content(input.toString()))
        .andExpect(status().isOk()).andExpect(jsonPath("$.operationId").value(completionId));
    assertEquals(before, calls.get()); assertEquals(1, exchanges.get());
    assertEquals(version, store.get("resource", rid, supplier.owner).path("version").asLong());
    mvc.perform(get("/api/resources/" + rid + "/reauthorizations/" + id).session(other.session))
        .andExpect(status().isNotFound());
    ObjectNode next = write("/api/resources/" + rid + "/reauthorizations",
        store.object().put("requestKey", UUID.randomUUID().toString()), supplier, 200);
    assertNotEquals(id, next.path("id").asText());
    mvc.perform(get(base + "/current").header("Authorization", bearer))
        .andExpect(status().isOk()).andExpect(jsonPath("$.state").value("READY"))
        .andExpect(jsonPath("$.id").value(next.path("id").asText()));
    mvc.perform(get(base + "/" + id).header("Authorization", bearer))
        .andExpect(status().isOk()).andExpect(jsonPath("$.state").value("SUCCESS"));
  }

  @Test
  void currentReauthorizationPreservesUnknownCompletionAfterLinkExpires() throws Exception {
    nativeTarget(); Client supplier = supplier();
    ObjectNode local = nativeResource(supplier); String rid = local.path("id").asText();
    store.update("resource", rid, supplier.owner, store.object()
        .put("targetId", target.path("id").asText()).put("laneId", "native-148")
        .put("upstreamAccountId", "native-148").put("upstreamProtocol", "CCMAX_NATIVE"));
    nativeResponder(new AtomicInteger(), new AtomicInteger(1), new AtomicInteger(10));
    var original = responder.get();
    responder.set((request, body) -> {
      if (request.equals("POST /api/admin/oauth-accounts/native-148/reauthorize"))
        return "{\"url\":\"https://claude.ai/oauth/authorize?state=reauth-state\",\"state\":\"reauth-state\",\"expires_in\":600}";
      if (request.equals("POST /api/admin/oauth-accounts/native-148/reauthorize/exchange")) {
        httpStatus.set(504); return "{}";
      }
      return original.apply(request, body);
    });
    ObjectNode start = write("/api/resources/" + rid + "/reauthorizations",
        store.object().put("requestKey", UUID.randomUUID().toString()), supplier, 200);
    String id = start.path("id").asText();
    write("/api/resources/" + rid + "/reauthorizations/" + id, store.object()
        .put("code", "fixture-code#reauth-state").put("requestKey", UUID.randomUUID().toString()), supplier, 504);
    ObjectNode stored = store.get("resource-operation", id, supplier.owner);
    ObjectNode result = (ObjectNode) stored.path("result").deepCopy();
    result.put("expiresAt", java.time.Instant.now().minusSeconds(1).toString());
    store.update("resource-operation", id, supplier.owner, store.object().set("result", result));
    int before = calls.get();
    mvc.perform(get("/api/resources/" + rid + "/reauthorizations/current").session(supplier.session))
        .andExpect(status().isOk()).andExpect(jsonPath("$.state").value("UNKNOWN"))
        .andExpect(jsonPath("$.id").value(id))
        .andExpect(jsonPath("$.completionOperationId").isNotEmpty())
        .andExpect(jsonPath("$.authUrl").doesNotExist());
    assertEquals(before, calls.get());
  }

  @Test
  void nativeReauthorizationUsesBoundAccountAndPreservesStatus() throws Exception {
    nativeTarget(); Client supplier = supplier();
    ObjectNode local = nativeResource(supplier);String rid=local.path("id").asText();
    store.update("resource",rid,supplier.owner,store.object().put("targetId",target.path("id").asText())
        .put("laneId","native-148").put("upstreamAccountId","native-148").put("upstreamProtocol","CCMAX_NATIVE"));
    nativeResponder(new AtomicInteger(),new AtomicInteger(0),new AtomicInteger(10));var previous=responder.get();
    responder.set((request,body)->{
      if(request.equals("POST /api/admin/oauth-accounts/native-148/reauthorize"))
        return "{\"url\":\"https://claude.ai/oauth/authorize?state=reauth-state\",\"state\":\"reauth-state\",\"expires_in\":600}";
      if(request.equals("POST /api/admin/oauth-accounts/native-148/reauthorize/exchange"))
        return "{\"account\":{\"id\":\"native-148\",\"status\":\"disabled\"}}";
      return previous.apply(request,body);
    });
    ObjectNode start=write("/api/resources/"+rid+"/reauthorizations",store.object().put("requestKey",UUID.randomUUID().toString()),supplier,200);
    String path="/api/resources/"+rid+"/reauthorizations/"+start.path("id").asText();
    write(path,store.object().put("code","bad#state").put("requestKey",UUID.randomUUID().toString()),supplier,400);
    ObjectNode updated=write(path,store.object().put("code","right#reauth-state").put("requestKey",UUID.randomUUID().toString()),supplier,200);
    assertEquals("SUCCESS",updated.path("state").asText());
    assertEquals("PAUSED",store.get("resource",rid,supplier.owner).path("operationalState").asText());
    assertNotEquals("DELIVERED",store.get("resource",rid,supplier.owner).path("state").asText());
  }

}
