package com.hispread.ai;

import static org.junit.jupiter.api.Assertions.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

import com.fasterxml.jackson.databind.*;
import com.fasterxml.jackson.databind.node.*;
import java.util.*;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.mock.web.MockHttpSession;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

@SpringBootTest
@AutoConfigureMockMvc
@Transactional
class ExecutionAdapterConfigTest {
  @Autowired Store s;
  @Autowired AuthService auth;
  @Autowired MockMvc mvc;
  @Autowired ObjectMapper json;

  @Test
  void nestedAdapterSecretStaysServerSideAndBlankPreservesOldValue() throws Exception {
    String id = UUID.randomUUID().toString();
    ObjectNode user =
        s.object()
            .put("id", id)
            .put("username", "config_" + id)
            .put("displayName", "Admin")
            .put("role", "ADMIN")
            .putNull("supplierId")
            .put("version", 0);
    user.set("permissions", auth.allPermissions());
    auth.createUser(user, "AdapterConfig@123");
    MockHttpSession session = new MockHttpSession();
    session.setAttribute("uid", id);
    session.setAttribute("sv", 0L);
    String csrf =
        json.readTree(
                mvc.perform(get("/api/auth/csrf").session(session))
                    .andReturn()
                    .getResponse()
                    .getContentAsString())
            .path("token")
            .asText();
    ObjectNode body = s.object().put("enabled", false);
    body.set(
        "executionAdapter",
        s.object()
            .put("enabled", false)
            .put("protocol", "HISPREAD_PAYOUT_V1")
            .put("baseUrl", "https://payments.example.com")
            .put("apiKey", "super-secret-adapter"));
    JsonNode saved =
        json.readTree(
            mvc.perform(
                    put("/api/payout-providers/OKX_USDT")
                        .session(session)
                        .header("X-CSRF-TOKEN", csrf)
                        .contentType("application/json")
                        .content(body.toString()))
                .andExpect(status().isOk())
                .andReturn()
                .getResponse()
                .getContentAsString());
    assertFalse(saved.path("executionAdapter").has("apiKey"));
    assertTrue(saved.path("executionAdapter").path("hasApiKey").asBoolean());
    assertFalse(saved.toString().contains("super-secret-adapter"));
    ObjectNode patch = s.object();
    patch.set("executionAdapter", s.object().put("enabled", false).put("apiKey", ""));
    mvc.perform(
            put("/api/payout-providers/OKX_USDT")
                .session(session)
                .header("X-CSRF-TOKEN", csrf)
                .contentType("application/json")
                .content(patch.toString()))
        .andExpect(status().isOk());
    assertEquals(
        "super-secret-adapter",
        s.get("payout-provider", "OKX_USDT", null)
            .path("executionAdapter")
            .path("apiKey")
            .asText());
    ObjectNode invalid = s.object();
    invalid.set(
        "executionAdapter",
        s.object()
            .put("enabled", true)
            .put("protocol", "UNKNOWN")
            .put("baseUrl", "https://payments.example.com")
            .put("apiKey", "test"));
    mvc.perform(
            put("/api/payout-providers/OKX_USDT")
                .session(session)
                .header("X-CSRF-TOKEN", csrf)
                .contentType("application/json")
                .content(invalid.toString()))
        .andExpect(status().isBadRequest());
  }
}
