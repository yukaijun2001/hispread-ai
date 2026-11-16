package com.hispread.ai;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;
import java.util.*;
import org.junit.jupiter.api.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.mock.web.MockHttpSession;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

@SpringBootTest(properties = "app.payments.sandbox-enabled=true")
@AutoConfigureMockMvc
@Transactional
class OfflinePaymentScopeIntegrationTest {
  @Autowired Store store;
  @Autowired AuthService auth;
  @Autowired ObjectMapper json;
  @Autowired MockMvc mvc;
  @MockBean PaymentExecutionGateway gateway;
  MockHttpSession session;
  String csrf, owner, settlementId;

  @BeforeEach
  void setup() throws Exception {
    String userId = UUID.randomUUID().toString();
    ObjectNode user = store.object().put("id", userId).put("username", "offline_" + userId)
        .put("role", "ADMIN").putNull("supplierId").put("version", 0);
    user.set("permissions", auth.allPermissions()); auth.createUser(user, "OfflineFixture@123");
    session = new MockHttpSession(); session.setAttribute("uid", userId); session.setAttribute("sv", 0L);
    csrf = json.readTree(mvc.perform(get("/api/auth/csrf").session(session)).andReturn()
        .getResponse().getContentAsString()).path("token").asText();
    owner = "offline-owner-" + UUID.randomUUID();
    store.create("supplier", owner, store.object().put("id", owner).put("name", "Offline fixture")
        .put("state", "APPROVED").put("enabled", true));
    settlementId = store.create("settlement", owner, store.object().put("supplierId", owner)
        .put("state", "CONFIRMED").put("supplierConfirmed", true).put("currency", "USD")
        .put("total", "100").put("reservedAmount", "0").put("paidAmount", "0"))
        .path("id").asText();
  }

  ObjectNode write(String method, String path, ObjectNode body, int expected) throws Exception {
    return (ObjectNode) json.readTree(mvc.perform(request(org.springframework.http.HttpMethod.valueOf(method), path)
        .session(session).header("X-CSRF-TOKEN", csrf).contentType("application/json").content(body.toString()))
        .andExpect(status().is(expected)).andReturn().getResponse().getContentAsString());
  }

  ObjectNode requestBody() {
    return store.object().put("settlementId", settlementId).put("requestKey", UUID.randomUUID().toString())
        .put("payoutCurrency", "USD").put("obligationAmount", "10").put("fee", "0");
  }

  @Test
  void bothCreationRoutesDefaultToOfflineAndRejectExplicitOnlineMode() throws Exception {
    for (String path : List.of("/api/payments", "/api/payments/offline")) {
      ObjectNode payment = write("POST", path, requestBody(), 200);
      assertEquals("OFFLINE", payment.path("paymentMethod").asText());
      assertEquals("MANUAL", payment.path("verificationMode").asText());
      assertEquals("PENDING", payment.path("state").asText());
      assertEquals("PAYMENT_CHANNEL_DISABLED", write("POST", path,
          requestBody().put("paymentMethod", "CHANNEL"), 410).path("code").asText());
    }
    assertEquals("20", store.get("settlement", settlementId, owner).path("reservedAmount").asText());
    assertEquals("0", store.get("settlement", settlementId, owner).path("paidAmount").asText());
    verifyNoInteractions(gateway);
  }

  @Test
  void disabledChannelsCannotConfigureTestPreviewExecuteOrSimulate() throws Exception {
    ObjectNode payment = store.create("payment", owner, store.object().put("supplierId", owner)
        .put("settlementId", settlementId).put("paymentMethod", "CHANNEL").put("state", "APPROVED"));
    String id = payment.path("id").asText();
    for (String path : List.of("/api/payments/" + id + "/payout-preview", "/api/payments/" + id + "/execute",
        "/api/payout-providers/AIRWALLEX/test", "/api/payments/sandbox", "/api/payments/sandbox/events"))
      assertEquals("PAYMENT_CHANNEL_DISABLED", write("POST", path, store.object(), 410).path("code").asText());
    write("PUT", "/api/payout-providers/AIRWALLEX", store.object().put("enabled", true), 410);
    mvc.perform(get("/api/payments/providers").session(session)).andExpect(status().isOk())
        .andExpect(jsonPath("$.length()").value(0));
    mvc.perform(get("/api/payments/sandbox-capabilities").session(session)).andExpect(status().isOk())
        .andExpect(jsonPath("$.enabled").value(false));
    assertEquals(payment, store.get("payment", id, owner));
    assertTrue(store.list("payout-call", owner).isEmpty()); verifyNoInteractions(gateway);
  }

  @Test
  void originalUnknownPaymentCanBeQueriedWithoutExecutingAgainOrReleasingItsReservation() throws Exception {
    ObjectNode adapter = store.object().put("protocol", "HISPREAD_PAYOUT_V1")
        .put("baseUrl", "https://fixture.invalid").put("enabled", true);
    ObjectNode provider = store.object().put("id", "AIRWALLEX").put("code", "AIRWALLEX");
    try { store.get("payout-provider", "AIRWALLEX", null); }
    catch (ApiException missing) { store.create("payout-provider", "GLOBAL", provider); }
    ObjectNode payment = store.create("payment", owner, store.object().put("supplierId", owner)
        .put("settlementId", settlementId).put("paymentMethod", "CHANNEL").put("state", "UNKNOWN")
        .put("payoutAmount", "10").put("payoutCurrency", "USD").put("obligationAmount", "10")
        .put("requestKey", "historical-key"));
    String id = payment.path("id").asText();
    store.update("settlement", settlementId, owner, store.object().put("reservedAmount", "10"));
    store.create("payout-call", owner, store.object().put("id", id).put("paymentId", id)
        .put("supplierId", owner).put("state", "UNKNOWN").put("providerCode", "AIRWALLEX")
        .put("protocol", "HISPREAD_PAYOUT_V1").put("adapterBaseUrl", "https://fixture.invalid")
        .put("requestKey", "historical-key").put("amount", "10").put("currency", "USD"));
    write("POST", "/api/payments/" + id + "/execute", store.object(), 200);
    verifyNoInteractions(gateway);
    when(gateway.requireAdapter(any())).thenReturn(adapter);
    when(gateway.exchange(eq(adapter), eq(id), eq("reconcile"), any(), eq("historical-key")))
        .thenReturn(store.object().put("localPaymentId", id).put("requestKey", "historical-key")
            .put("currency", "USD").put("amount", "10").put("state", "UNKNOWN"));
    ObjectNode checked = write("POST", "/api/payments/" + id + "/reconcile", store.object().put("version", 0), 200);
    assertEquals("UNKNOWN", checked.path("state").asText());
    assertEquals("10", store.get("settlement", settlementId, owner).path("reservedAmount").asText());
    assertEquals("0", store.get("settlement", settlementId, owner).path("paidAmount").asText());
    verify(gateway).exchange(eq(adapter), eq(id), eq("reconcile"), any(), eq("historical-key"));
    verify(gateway, never()).exchange(any(), anyString(), eq("execute"), any(), anyString());
  }
}
