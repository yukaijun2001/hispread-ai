package com.hispread.ai;

import static org.junit.jupiter.api.Assertions.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;
import java.util.UUID;
import org.junit.jupiter.api.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.mock.web.MockHttpSession;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

@SpringBootTest(properties = "app.payments.sandbox-enabled=true")
@AutoConfigureMockMvc
@Transactional
class PaymentSandboxIntegrationTest {
  @Autowired Store s;
  @Autowired AuthService auth;
  @Autowired ObjectMapper json;
  @Autowired MockMvc mvc;
  @Autowired PaymentSandboxService sandbox;
  MockHttpSession session;
  String csrf, paymentId, settlementId;

  @BeforeEach
  void setup() throws Exception {
    String id = UUID.randomUUID().toString();
    ObjectNode user =
        s.object()
            .put("id", id)
            .put("username", "sandbox_" + id)
            .put("role", "ADMIN")
            .putNull("supplierId");
    user.set("permissions", auth.allPermissions());
    auth.createUser(user, "SandboxTest@123");
    session = new MockHttpSession();
    session.setAttribute("uid", id);
    session.setAttribute("sv", 0L);
    csrf =
        json.readTree(
                mvc.perform(get("/api/auth/csrf").session(session))
                    .andReturn()
                    .getResponse()
                    .getContentAsString())
            .path("token")
            .asText();
    String owner = "sandbox-" + UUID.randomUUID();
    paymentId = UUID.randomUUID().toString();
    settlementId = UUID.randomUUID().toString();
    s.create(
        "supplier",
        owner,
        s.object()
            .put("id", owner)
            .put("name", "Sandbox supplier")
            .put("state", "APPROVED")
            .put("enabled", true));
    s.create(
        "settlement",
        owner,
        s.object()
            .put("id", settlementId)
            .put("supplierId", owner)
            .put("paidAmount", "0")
            .put("reservedAmount", "12.50"));
    s.create(
        "payment",
        owner,
        s.object()
            .put("id", paymentId)
            .put("supplierId", owner)
            .put("settlementId", settlementId)
            .put("state", "APPROVED")
            .put("createdBy", "maker")
            .put("reviewedBy", "checker")
            .put("payoutAmount", "12.50")
            .put("payoutCurrency", "USD"));
  }

  ObjectNode create() throws Exception {
    return json.readTree(
            mvc.perform(
                    post("/api/payments/sandbox")
                        .session(session)
                        .header("X-CSRF-TOKEN", csrf)
                        .contentType("application/json")
                        .content(
                            s.object()
                                .put("paymentId", paymentId)
                                .put("requestKey", "request-1")
                                .toString()))
                .andExpect(status().isOk())
                .andReturn()
                .getResponse()
                .getContentAsString())
        .deepCopy();
  }

  @Test
  void simulationHasIdempotentEventsAndNeverChangesRealBalances() throws Exception {
    ObjectNode simulated = create();
    assertEquals(simulated.path("id").asText(), create().path("id").asText());
    ObjectNode event =
        s.object()
            .put("paymentId", simulated.path("id").asText())
            .put("eventId", "evt-" + UUID.randomUUID())
            .put("providerReference", simulated.path("externalRef").asText())
            .put("status", "SUCCEEDED")
            .put("amount", "12.50")
            .put("currency", "USD");
    for (int i = 0; i < 2; i++)
      mvc.perform(
              post("/api/payments/sandbox/events")
                  .session(session)
                  .header("X-CSRF-TOKEN", csrf)
                  .contentType("application/json")
                  .content(event.toString()))
          .andExpect(status().isOk())
          .andExpect(jsonPath("$.state").value("SUCCEEDED"))
          .andExpect(jsonPath("$.paymentExecuted").value(false));
    assertEquals("APPROVED", s.get("payment", paymentId, null).path("state").asText());
    assertEquals("0", s.get("settlement", settlementId, null).path("paidAmount").asText());
    assertEquals("12.50", s.get("settlement", settlementId, null).path("reservedAmount").asText());
    mvc.perform(
            post("/api/payments/sandbox/events")
                .session(session)
                .header("X-CSRF-TOKEN", csrf)
                .contentType("application/json")
                .content(event.put("status", "FAILED").toString()))
        .andExpect(status().isConflict());
  }

  @Test
  void realPaymentEventsAndMissingCsrfAreRejected() throws Exception {
    ObjectNode event =
        s.object()
            .put("paymentId", paymentId)
            .put("eventId", "e")
            .put("status", "SUCCEEDED")
            .put("amount", "12.50")
            .put("currency", "USD");
    mvc.perform(
            post("/api/payments/sandbox/events")
                .session(session)
                .header("X-CSRF-TOKEN", csrf)
                .contentType("application/json")
                .content(event.toString()))
        .andExpect(status().isBadRequest());
    mvc.perform(
            post("/api/payments/sandbox")
                .session(session)
                .contentType("application/json")
                .content("{}"))
        .andExpect(status().isForbidden());
    PaymentSandboxService target =
        org.springframework.test.util.AopTestUtils.getTargetObject(sandbox);
    boolean old = target.enabled;
    try {
      target.enabled = false;
      mvc.perform(
              post("/api/payments/sandbox")
                  .session(session)
                  .header("X-CSRF-TOKEN", csrf)
                  .contentType("application/json")
                  .content("{}"))
          .andExpect(status().isConflict());
    } finally {
      target.enabled = old;
    }
  }
}
