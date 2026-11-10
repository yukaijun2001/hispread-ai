package com.hispread.ai;

import static com.hispread.ai.BusinessSupport.*;

import com.fasterxml.jackson.databind.node.ObjectNode;
import jakarta.servlet.http.HttpServletRequest;
import java.math.BigDecimal;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.time.Instant;
import java.util.*;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/** Explicit, isolated simulations never write payment, settlement or payout-call entities. */
@Service
public class PaymentSandboxService {
  private final Store s;
  private final AuthService auth;
  private final AccessPolicy access;

  @Value("${app.payments.sandbox-enabled:false}")
  boolean enabled;

  public PaymentSandboxService(Store s, AuthService auth, AccessPolicy access) {
    this.s = s;
    this.auth = auth;
    this.access = access;
  }

  private void permit(HttpServletRequest req) {
    if (!auth.admin(req)) throw new ApiException(403, "支付模拟仅最高管理员可操作");
    auth.require(req, "payment.execute");
    if (!enabled)
      throw new ApiException(
          409, "支付沙箱未开启，请显式设置PAYMENT_SANDBOX_ENABLED=true", "PAYMENT_SANDBOX_DISABLED");
  }

  public ObjectNode capabilities(HttpServletRequest req) {
    if (!auth.admin(req)) throw new ApiException(403, "支付模拟仅最高管理员可操作");
    auth.require(req, "payment.execute");
    return s.object()
        .put("enabled", enabled)
        .put("isolated", true)
        .put("realPaymentEffects", false);
  }

  private String hash(String value) {
    try {
      return HexFormat.of()
          .formatHex(
              MessageDigest.getInstance("SHA-256").digest(value.getBytes(StandardCharsets.UTF_8)));
    } catch (Exception e) {
      throw new IllegalStateException(e);
    }
  }

  private void lock(String id) {
    s.jdbc.queryForObject(
        "select pg_advisory_xact_lock(hashtextextended(?,0))", Object.class, "sandbox:" + id);
  }

  @Transactional
  public ObjectNode create(ObjectNode body, HttpServletRequest req) {
    permit(req);
    required(body, "paymentId", "requestKey");
    if (text(body, "requestKey").length() > 128) throw new ApiException(400, "requestKey过长");
    String id = "sandbox-" + hash(auth.userId(req) + ":" + text(body, "requestKey"));
    lock(id);
    ObjectNode source = access.get("payment", text(body, "paymentId"), req);
    ObjectNode prior =
        s.list("sandbox-payment", null).stream()
            .filter(p -> eq(p, "id", id))
            .findFirst()
            .orElse(null);
    if (prior != null) {
      if (!eq(prior, "sourcePaymentId", text(source, "id")))
        throw new ApiException(409, "模拟请求标识已用于其他付款");
      return prior;
    }
    if (!eq(source, "state", "APPROVED")
        || text(source, "createdBy").isBlank()
        || text(source, "reviewedBy").isBlank()
        || eq(source, "createdBy", text(source, "reviewedBy")))
      throw new ApiException(409, "仅可根据已独立审核通过的付款建立隔离模拟");
    ObjectNode sandbox =
        s.object()
            .put("id", id)
            .put("sourcePaymentId", text(source, "id"))
            .put("sourceVersion", source.path("version").asLong())
            .put("createdBy", auth.userId(req))
            .put("supplierId", text(source, "supplierId"))
            .put("state", "PROCESSING")
            .put("verificationMode", "SIMULATED")
            .put("paymentExecuted", false)
            .put("externalRef", "SBX-" + UUID.randomUUID())
            .put("requestKey", text(body, "requestKey"));
    for (String field : List.of("payoutAmount", "payoutCurrency", "code", "supplierName"))
      if (source.has(field)) sandbox.set(field, source.get(field));
    return s.create("sandbox-payment", text(source, "supplierId"), sandbox);
  }

  public ObjectNode get(String id, HttpServletRequest req) {
    permit(req);
    return s.get("sandbox-payment", id, null);
  }

  @Transactional
  public ObjectNode event(ObjectNode body, HttpServletRequest req) {
    permit(req);
    required(body, "paymentId", "eventId", "status", "amount", "currency");
    String id = text(body, "paymentId"),
        event = text(body, "eventId"),
        state = text(body, "status");
    if (!id.startsWith("sandbox-")
        || event.length() > 128
        || !Set.of("SUCCEEDED", "FAILED", "UNKNOWN").contains(state))
      throw new ApiException(400, "只接受隔离支付模拟ID和有效状态，不能修改真实付款");
    lock(id);
    ObjectNode payment = s.get("sandbox-payment", id, null);
    BigDecimal amount;
    try {
      amount = new BigDecimal(text(body, "amount"));
      if (amount.signum() <= 0
          || amount.precision() > 30
          || amount.compareTo(new BigDecimal(text(payment, "payoutAmount"))) != 0)
        throw new NumberFormatException();
    } catch (NumberFormatException e) {
      throw new ApiException(400, "模拟金额不匹配");
    }
    if (!eq(body, "currency", text(payment, "payoutCurrency"))
        || body.hasNonNull("providerReference")
            && !eq(body, "providerReference", text(payment, "externalRef")))
      throw new ApiException(400, "模拟币种或通道标识不匹配");
    String eventId = "sandbox-event-" + hash(event);
    lock(eventId);
    String fingerprint =
        hash(
            id
                + ":"
                + state
                + ":"
                + amount.stripTrailingZeros().toPlainString()
                + ":"
                + text(body, "currency"));
    ObjectNode prior =
        s.list("sandbox-event", null).stream()
            .filter(e -> eq(e, "id", eventId))
            .findFirst()
            .orElse(null);
    if (prior != null) {
      if (!eq(prior, "fingerprint", fingerprint)) throw new ApiException(409, "模拟事件ID已用于不同事件");
      return payment;
    }
    if (Set.of("SUCCEEDED", "FAILED").contains(text(payment, "state"))
        && !eq(payment, "state", state)) throw new ApiException(409, "已终结的模拟付款不能变更结果");
    s.create(
        "sandbox-event",
        text(payment, "supplierId"),
        s.object()
            .put("id", eventId)
            .put("sandboxPaymentId", id)
            .put("fingerprint", fingerprint)
            .put("state", state)
            .put("actor", auth.userId(req)));
    return s.update(
        "sandbox-payment",
        id,
        null,
        s.object()
            .put("state", state)
            .put("lastEventId", event)
            .put("statusUpdatedAt", Instant.now().toString())
            .put("verificationMode", "SIMULATED")
            .put("paymentExecuted", false));
  }
}
