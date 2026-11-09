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
    } finally {
      server.stop(0);
    }
  }
}
