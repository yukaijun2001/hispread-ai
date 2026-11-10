package com.hispread.ai;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;
import jakarta.servlet.http.HttpServletRequest;
import java.lang.reflect.Method;
import java.util.*;
import org.junit.jupiter.api.Test;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.transaction.*;
import org.springframework.transaction.support.SimpleTransactionStatus;

/** Transaction/ledger behavior with a deterministic in-memory store; no provider or DB connection. */
class NativePaymentExecutionServiceTest {
  static class MemoryStore extends Store {
    final Map<String, ObjectNode> records = new HashMap<>();
    MemoryStore() { super(mock(JdbcTemplate.class), new ObjectMapper()); }
    @Override public ObjectNode get(String kind, String id, String owner) {
      ObjectNode row = records.get(kind + ":" + id);
      if (row == null) throw new ApiException(404, "missing");
      return row.deepCopy();
    }
    @Override public ObjectNode create(String kind, String owner, ObjectNode row) {
      ObjectNode out = row.deepCopy().put("version", 0);
      records.put(kind + ":" + row.path("id").asText(), out);
      return out.deepCopy();
    }
    @Override public List<ObjectNode> list(String kind, String owner) {
      return records.entrySet().stream().filter(entry -> entry.getKey().startsWith(kind + ":"))
          .map(entry -> entry.getValue().deepCopy()).toList();
    }
    @Override public ObjectNode update(String kind, String id, String owner, ObjectNode patch) {
      ObjectNode old = get(kind, id, owner);
      if (patch.has("version") && patch.path("version").asLong() != old.path("version").asLong())
        throw new ApiException(409, "stale");
      long version = old.path("version").asLong();
      old.setAll(patch);
      old.put("version", version + 1);
      records.put(kind + ":" + id, old);
      return old.deepCopy();
    }
  }

  @Test
  void airwallexPaidCanBeReconciledAfterSuccessAndLateReturnReversesExactlyOnce() throws Exception {
    MemoryStore s = new MemoryStore();
    AccessPolicy access = mock(AccessPolicy.class);
    AuthService auth = mock(AuthService.class);
    HttpServletRequest req = mock(HttpServletRequest.class);
    when(access.get(anyString(), anyString(), eq(req)))
        .thenAnswer(invocation -> s.get(invocation.getArgument(0), invocation.getArgument(1), null));
    when(access.publicRecord(anyString(), any(ObjectNode.class), eq(req)))
        .thenAnswer(invocation -> ((ObjectNode) invocation.getArgument(1)).deepCopy());
    PlatformTransactionManager tx = mock(PlatformTransactionManager.class);
    when(tx.getTransaction(any())).thenReturn(new SimpleTransactionStatus());
    PaymentExecutionService service = new PaymentExecutionService(s, auth, access, mock(PaymentExecutionGateway.class), tx);
    s.create("settlement", "owner", s.object().put("id", "settlement-1").put("total", "10").put("paidAmount", "0").put("reservedAmount", "10"));
    s.create("payment", "owner", s.object().put("id", "payment-1").put("supplierId", "owner")
        .put("settlementId", "settlement-1").put("requestKey", "original-request")
        .put("state", "PROCESSING").put("payoutCurrency", "USD").put("payoutAmount", "10")
        .put("obligationAmount", "10"));
    s.create("payout-call", "owner", s.object().put("id", "payment-1").put("protocol", "NATIVE_AIRWALLEX")
        .put("state", "PROCESSING").put("paidApplied", false).put("reservationReleased", false));
    Method apply = PaymentExecutionService.class.getDeclaredMethod("apply", String.class, ObjectNode.class, String.class, HttpServletRequest.class);
    apply.setAccessible(true);
    ObjectNode reply = s.object().put("localPaymentId", "payment-1").put("requestKey", "original-request")
        .put("currency", "USD").put("amount", "10").put("operationId", "aw-1").put("externalRef", "aw-ref")
        .put("state", "SUCCEEDED").put("providerState", "PAID").put("providerFinality", "PROVISIONAL");
    ObjectNode paid = (ObjectNode) apply.invoke(service, "payment-1", reply, null, req);
    assertEquals("SUCCEEDED", paid.path("state").asText());
    assertEquals("NATIVE_PROVIDER", paid.path("verificationMode").asText());
    assertEquals("10", s.get("settlement", "settlement-1", null).path("paidAmount").asText());
    apply.invoke(service, "payment-1", reply, null, req);
    assertEquals("10", s.get("settlement", "settlement-1", null).path("paidAmount").asText());
    apply.invoke(service, "payment-1", null, "PAYMENT_ADAPTER_CONNECTION_FAILED", req);
    assertEquals("SUCCEEDED", s.get("payment", "payment-1", null).path("state").asText());
    reply.put("state", "FAILED").put("providerState", "FAILED");
    ObjectNode returned = (ObjectNode) apply.invoke(service, "payment-1", reply, null, req);
    assertEquals("FAILED", returned.path("state").asText());
    assertTrue(returned.path("lateReturn").asBoolean());
    assertEquals("0", s.get("settlement", "settlement-1", null).path("paidAmount").asText());
    assertEquals("0", s.get("settlement", "settlement-1", null).path("reservedAmount").asText());
    assertTrue(s.get("payout-call", "payment-1", null).path("paidReversed").asBoolean());
    apply.invoke(service, "payment-1", reply, null, req);
    assertEquals("0", s.get("settlement", "settlement-1", null).path("paidAmount").asText());
  }

  @Test
  void publicPayoutCallHidesBoundPayerAndRecipientFingerprints() {
    Store s = new Store(null, new ObjectMapper());
    AuthService auth = mock(AuthService.class);
    when(auth.user(any())).thenReturn(s.object().put("role", "ADMIN"));
    AccessPolicy access = new AccessPolicy(s, auth);
    ObjectNode operation = s.object().put("id", "payment-1").put("state", "UNKNOWN")
        .put("adapterBinding", "private-fingerprint").put("requestFingerprint", "private-request-hash");
    operation.putObject("executionContext").put("recipientHash", "private-recipient-hash");
    ObjectNode out = access.publicRecord("payout-call", operation, mock(HttpServletRequest.class));
    assertFalse(out.has("adapterBinding"));
    assertFalse(out.has("requestFingerprint"));
    assertFalse(out.has("executionContext"));
    assertTrue(operation.has("executionContext"));
  }
}
