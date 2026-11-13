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
import java.util.concurrent.atomic.AtomicReference;
import java.util.concurrent.atomic.AtomicInteger;
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
class MonitoringContractIntegrationTest {
  @Autowired Store s;
  @Autowired AuthService a;
  @Autowired MockMvc mvc;
  @Autowired ObjectMapper json;
  @Autowired MonitoringService monitoring;

  @Test
  void configuredMonitoringActuallyFetchesNestedFieldsWithoutReturningToken() throws Exception {
    HttpServer server = HttpServer.create(new InetSocketAddress("127.0.0.1", 0), 0);
    server.createContext(
        "/metrics",
        e -> {
          byte[] response =
              "{\"data\":{\"rpm\":321,\"tpm\":4500}}".getBytes(StandardCharsets.UTF_8);
          e.getResponseHeaders().set("Content-Type", "application/json");
          e.sendResponseHeaders(200, response.length);
          e.getResponseBody().write(response);
          e.close();
        });
    server.start();
    try {
      String uid = UUID.randomUUID().toString();
      ObjectNode u =
          s.object()
              .put("id", uid)
              .put("username", "monitor_" + uid)
              .put("role", "ADMIN")
              .putNull("supplierId")
              .put("version", 0);
      u.set("permissions", a.allPermissions());
      a.createUser(u, "MonitorTest@123");
      MockHttpSession session = new MockHttpSession();
      session.setAttribute("uid", uid);
      session.setAttribute("sv", 0L);
      String csrf =
          json.readTree(
                  mvc.perform(get("/api/auth/csrf").session(session))
                      .andReturn()
                      .getResponse()
                      .getContentAsString())
              .path("token")
              .asText();
      ObjectNode source =
          s.create(
              "monitoring-source",
              "GLOBAL",
              s.object()
                  .put("name", "Fixture monitoring")
                  .put("category", "ANTHROPIC")
                  .put("enabled", true)
                  .put("includeInTotal", true)
                  .put("supplierVisible", true)
                  .put("endpoint", "http://127.0.0.1:" + server.getAddress().getPort() + "/metrics")
                  .put("authType", "NONE")
                  .put("rpmPath", "data.rpm")
                  .put("tpmPath", "data.tpm")
                  .put("token", "server-only"));
      JsonNode result =
          json.readTree(
              mvc.perform(
                      post("/api/workbench-monitoring/sources/"
                              + source.path("id").asText()
                              + "/refresh")
                          .session(session)
                          .header("X-CSRF-TOKEN", csrf)
                          .contentType("application/json")
                          .content("{}"))
                  .andExpect(status().isOk())
                  .andReturn()
                  .getResponse()
                  .getContentAsString());
      assertEquals("321", result.path("rpm").asText());
      assertEquals("4500", result.path("tpm").asText());
      assertEquals("READY", result.path("state").asText());
      assertFalse(result.has("token"));
      assertEquals(
          "321", s.get("monitoring-source", source.path("id").asText(), null).path("rpm").asText());
      JsonNode displayed =
          json.readTree(
              mvc.perform(get("/api/workbench/monitoring").session(session))
                  .andExpect(status().isOk())
                  .andReturn()
                  .getResponse()
                  .getContentAsString());
      JsonNode row = null;
      for (JsonNode entry : displayed)
        if (entry.path("category").asText().equals("ANTHROPIC")) row = entry;
      assertNotNull(row);
      assertEquals("321", row.path("rpm").asText());
      assertEquals("4500", row.path("tpm").asText());
      assertFalse(row.has("token"));
    } finally {
      server.stop(0);
    }
  }

  @Test
  void aggregationUsesMaximumAndHonorsSupplierVisibilityAndEnabledState() {
    String category = "metric-" + UUID.randomUUID();
    for (ObjectNode source :
        List.of(
            source(category, "100", "200", true, true),
            source(category, "400", "150", true, true),
            source(category, "900", "900", false, true),
            source(category, "999", "999", true, false)))
      s.create("monitoring-source", "GLOBAL", source);
    ObjectNode platform =
        monitoring.snapshots(false).stream()
            .filter(x -> x.path("category").asText().equals(category))
            .findFirst()
            .orElseThrow();
    ObjectNode supplier =
        monitoring.snapshots(true).stream()
            .filter(x -> x.path("category").asText().equals(category))
            .findFirst()
            .orElseThrow();
    assertEquals("900", platform.path("rpm").asText());
    assertEquals("400", supplier.path("rpm").asText());
    assertEquals("200", supplier.path("tpm").asText());
    assertFalse(supplier.toString().contains("secret"));
  }

  private ObjectNode source(
      String category, String rpm, String tpm, boolean visible, boolean enabled) {
    return s.object()
        .put("category", category)
        .put("rpm", rpm)
        .put("tpm", tpm)
        .put("supplierVisible", visible)
        .put("enabled", enabled)
        .put("includeInTotal", true)
        .put("token", "secret")
        .put("state", "READY")
        .put("intervalSeconds", 60)
        .put("queriedAt", java.time.Instant.now().toString());
  }

  @Test
  void invalidMetricRecordsFailureAndPreservesLastGoodSnapshot() throws Exception {
    AtomicReference<String> response = new AtomicReference<>("{\"rpm\":123}");
    HttpServer server = HttpServer.create(new InetSocketAddress("127.0.0.1", 0), 0);
    server.createContext(
        "/metrics",
        e -> {
          byte[] bytes = response.get().getBytes(StandardCharsets.UTF_8);
          e.sendResponseHeaders(200, bytes.length);
          e.getResponseBody().write(bytes);
          e.close();
        });
    server.start();
    try {
      String category = "metric-" + UUID.randomUUID();
      ObjectNode source =
          s.create(
              "monitoring-source",
              "GLOBAL",
              source(category, "0", "0", true, true)
                  .put("endpoint", "http://127.0.0.1:" + server.getAddress().getPort() + "/metrics")
                  .put("rpmPath", "rpm")
                  .put("authType", "NONE"));
      String id = source.path("id").asText();
      monitoring.refresh(id);
      response.set("{\"rpm\":-1}");
      ApiException failure = assertThrows(ApiException.class, () -> monitoring.refresh(id));
      assertEquals(502, failure.status);
      ObjectNode saved = s.get("monitoring-source", id, null);
      assertEquals("ERROR", saved.path("state").asText());
      assertEquals("123", saved.path("rpm").asText());
      ObjectNode displayed =
          monitoring.snapshots(true).stream()
              .filter(x -> x.path("category").asText().equals(category))
              .findFirst()
              .orElseThrow();
      assertTrue(displayed.path("stale").asBoolean());
      assertEquals("123", displayed.path("rpm").asText());
    } finally {
      server.stop(0);
    }
  }

  @Test
  void collectorRespectsEnabledDueAndFailureCooldownThenRecovers() throws Exception {
    AtomicInteger calls = new AtomicInteger();
    AtomicReference<String> body = new AtomicReference<>("{\"rpm\":12,\"tpm\":45}");
    HttpServer server = HttpServer.create(new InetSocketAddress("127.0.0.1", 0), 0);
    server.createContext("/metrics", exchange -> {
      calls.incrementAndGet();
      byte[] bytes = body.get().getBytes(StandardCharsets.UTF_8);
      exchange.sendResponseHeaders(200, bytes.length);
      exchange.getResponseBody().write(bytes);
      exchange.close();
    });
    server.start();
    boolean previous = monitoring.schedulingEnabled;
    try {
      monitoring.schedulingEnabled = true;
      ObjectNode source = s.create("monitoring-source", "GLOBAL",
          source("due-" + UUID.randomUUID(), "0", "0", true, true)
              .put("endpoint", "http://127.0.0.1:" + server.getAddress().getPort() + "/metrics")
              .put("rpmPath", "rpm").put("tpmPath", "tpm").put("authType", "NONE")
              .put("lastAttemptAt", java.time.Instant.now().toString()));
      String id = source.path("id").asText();
      monitoring.collectDue();
      assertEquals(0, calls.get());
      s.update("monitoring-source", id, null, s.object().put("lastAttemptAt", java.time.Instant.EPOCH.toString()));
      monitoring.collectDue();
      assertEquals(1, calls.get());
      assertEquals("12", s.get("monitoring-source", id, null).path("rpm").asText());
      body.set("{\"rpm\":-1,\"tpm\":45}");
      s.update("monitoring-source", id, null, s.object().put("lastAttemptAt", java.time.Instant.EPOCH.toString()));
      monitoring.collectDue();
      assertEquals(2, calls.get());
      assertEquals("ERROR", s.get("monitoring-source", id, null).path("state").asText());
      monitoring.collectDue();
      assertEquals(2, calls.get());
      body.set("{\"rpm\":30,\"tpm\":60}");
      s.update("monitoring-source", id, null, s.object().put("lastAttemptAt", java.time.Instant.EPOCH.toString()));
      monitoring.collectDue();
      assertEquals("READY", s.get("monitoring-source", id, null).path("state").asText());
      assertEquals("30", s.get("monitoring-source", id, null).path("rpm").asText());
      s.update("monitoring-source", id, null, s.object().put("enabled", false).put("lastAttemptAt", java.time.Instant.EPOCH.toString()));
      monitoring.collectDue();
      assertEquals(3, calls.get());
    } finally {
      monitoring.schedulingEnabled = previous;
      server.stop(0);
    }
  }
}
