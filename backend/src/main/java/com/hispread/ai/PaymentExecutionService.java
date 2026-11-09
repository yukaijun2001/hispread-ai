package com.hispread.ai;

import static com.hispread.ai.BusinessSupport.*;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import jakarta.servlet.http.HttpServletRequest;
import java.math.BigDecimal;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.time.Instant;
import java.util.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.support.TransactionTemplate;

/**
 * Durable intent is committed before one network send; uncertain results can only be reconciled.
 */
@Service
public class PaymentExecutionService {
  private final Store s;
  private final AuthService auth;
  private final AccessPolicy access;
  private final PaymentExecutionGateway gateway;
  private final TransactionTemplate tx;

  public PaymentExecutionService(
      Store s,
      AuthService auth,
      AccessPolicy access,
      PaymentExecutionGateway gateway,
      PlatformTransactionManager manager) {
    this.s = s;
    this.auth = auth;
    this.access = access;
    this.gateway = gateway;
    this.tx = new TransactionTemplate(manager);
  }

  private void permitted(HttpServletRequest req, String permission) {
    if (!access.admin(req)) throw new ApiException(403, "资金执行与查单仅最高管理员可操作");
    auth.require(req, permission);
  }

  private void lock(String key) {
    s.jdbc.queryForObject("select pg_advisory_xact_lock(hashtextextended(?,0))", Object.class, key);
  }

  private String digest(JsonNode value) {
    try {
      return HexFormat.of()
          .formatHex(
              MessageDigest.getInstance("SHA-256")
                  .digest(value.toString().getBytes(StandardCharsets.UTF_8)));
    } catch (Exception e) {
      throw new IllegalStateException(e);
    }
  }

  private ObjectNode provider(String code) {
    if (!Set.of("AIRWALLEX", "OKX_USDT", "BINANCE_USDT").contains(code))
      throw new ApiException(400, "请选择已配置的支付执行中台通道");
    return s.list("payout-provider", null).stream()
        .filter(p -> eq(p, "code", code) || eq(p, "id", code))
        .findFirst()
        .orElseThrow(() -> new ApiException(503, "未配置支付执行中台"));
  }

  private void version(ObjectNode payment, ObjectNode body) {
    if (!body.has("version")) throw new ApiException(400, "请提供当前付款版本");
    if (body.path("version").asLong() != payment.path("version").asLong())
      throw new ApiException(409, "付款已更新，请刷新");
  }

  private ObjectNode account(ObjectNode payment) {
    String owner = text(payment, "supplierId");
    ObjectNode account = s.get("account", text(payment, "accountId"), owner);
    if (!eq(account, "state", "APPROVED")
        || !eq(account, "currency", text(payment, "payoutCurrency"))
        || !payment.has("accountVersion")
        || payment.path("accountVersion").asLong() != account.path("version").asLong()
        || !eq(payment, "accountSnapshotHash", digest(account)))
      throw new ApiException(409, "已审核收款账户发生变化，请重新申请并审核付款");
    return account;
  }

  private void approved(ObjectNode payment) {
    if (!eq(payment, "state", "APPROVED")
        || text(payment, "createdBy").isBlank()
        || text(payment, "reviewedBy").isBlank()
        || eq(payment, "createdBy", text(payment, "reviewedBy")))
      throw new ApiException(403, "付款必须由另一身份审核通过");
    if (!eq(payment, "paymentMethod", "CHANNEL")) throw new ApiException(409, "仅线上通道付款可调用执行中台");
    account(payment);
  }

  private ObjectNode payload(ObjectNode payment, ObjectNode account, String provider) {
    ObjectNode d =
        s.object()
            .put("protocol", "HISPREAD_PAYOUT_V1")
            .put("localPaymentId", text(payment, "id"))
            .put("requestKey", text(payment, "requestKey"))
            .put("provider", provider)
            .put("supplierId", text(payment, "supplierId"))
            .put("settlementId", text(payment, "settlementId"))
            .put("currency", text(payment, "payoutCurrency"))
            .put("amount", text(payment, "payoutAmount"))
            .put("fee", text(payment, "fee"))
            .put("obligationCurrency", text(payment, "obligationCurrency"))
            .put("obligationAmount", text(payment, "obligationAmount"));
    ObjectNode recipient = s.object();
    for (String k :
        List.of(
            "id",
            "holder",
            "accountType",
            "bank",
            "currency",
            "transferType",
            "network",
            "walletType",
            "lastFour")) if (account.has(k)) recipient.set(k, account.get(k));
    try {
      ObjectNode secret = s.get("account-secret", text(account, "id"), text(payment, "supplierId"));
      if (secret.hasNonNull("accountNumber"))
        recipient.set("accountNumber", secret.get("accountNumber"));
    } catch (ApiException missing) {
      throw new ApiException(409, "收款目标明细缺失，请重新维护审核账户");
    }
    d.set("recipient", recipient);
    d.put("accountVersion", payment.path("accountVersion").asLong());
    return d;
  }

  private ObjectNode existing(String id) {
    try {
      return s.get("payout-call", id, null);
    } catch (ApiException e) {
      if (e.status == 404) return null;
      throw e;
    }
  }

  public ObjectNode preview(String id, ObjectNode body, HttpServletRequest req) {
    permitted(req, "payment.execute");
    ObjectNode payment = access.get("payment", id, req);
    version(payment, body);
    approved(payment);
    String code = text(body, "provider");
    ObjectNode config = provider(code),
        adapter = gateway.requireAdapter(config),
        account = account(payment);
    ObjectNode request = payload(payment, account, code);
    ObjectNode upstream =
        gateway.exchange(adapter, id, "preview", request, text(payment, "requestKey"));
    if (!upstream.path("executable").asBoolean(false))
      throw new ApiException(409, "支付中台预检不允许执行本笔付款");
    validateEcho(upstream, payment);
    ObjectNode out =
        s.object()
            .put("executable", true)
            .put("provider", code)
            .put("currency", text(payment, "payoutCurrency"))
            .put("amount", text(payment, "payoutAmount"))
            .put("fee", text(payment, "fee"))
            .put(
                "totalDebit",
                amount(payment, "payoutAmount").add(amount(payment, "fee")).toPlainString())
            .put(
                "recipientMasked",
                account.path("holder").asText() + " · " + account.path("lastFour").asText())
            .put("transferMethod", account.path("transferMethod").asText("LOCAL"))
            .put("transferType", account.path("transferType").asText())
            .put("network", account.path("network").asText())
            .put("protocol", "HISPREAD_PAYOUT_V1");
    if (upstream.hasNonNull("availableBalance"))
      out.put("availableBalance", upstream.path("availableBalance").asText());
    return out;
  }

  public ObjectNode execute(String id, ObjectNode body, HttpServletRequest req) {
    permitted(req, "payment.execute");
    record Intent(ObjectNode operation, ObjectNode adapter, ObjectNode payload, boolean send) {}
    Intent intent =
        tx.execute(
            status -> {
              lock("payment-state:" + id);
              ObjectNode payment = access.get("payment", id, req), prior = existing(id);
              if (prior != null) {
                if (!text(body, "provider").isBlank()
                    && !eq(prior, "providerCode", text(body, "provider")))
                  throw new ApiException(409, "原执行操作属于其他通道，不能重新提交");
                return new Intent(payment, null, null, false);
              }
              version(payment, body);
              approved(payment);
              String code = text(body, "provider");
              ObjectNode adapter = gateway.requireAdapter(provider(code));
              ObjectNode request = payload(payment, account(payment), code);
              ObjectNode operation =
                  s.object()
                      .put("id", id)
                      .put("paymentId", id)
                      .put("supplierId", text(payment, "supplierId"))
                      .put("supplierName", text(payment, "supplierName"))
                      .put("providerCode", code)
                      .put("protocol", "HISPREAD_PAYOUT_V1")
                      .put("adapterBaseUrl", text(adapter, "baseUrl"))
                      .put("requestKey", text(payment, "requestKey"))
                      .put("requestFingerprint", digest(request))
                      .put("amount", text(payment, "payoutAmount"))
                      .put("currency", text(payment, "payoutCurrency"))
                      .put("state", "PROCESSING")
                      .put("paidApplied", false)
                      .put("reservationReleased", false)
                      .put("executionActor", auth.userId(req));
              s.create("payout-call", text(payment, "supplierId"), operation);
              s.update(
                  "payment",
                  id,
                  text(payment, "supplierId"),
                  s.object()
                      .put("version", payment.path("version").asLong())
                      .put("state", "PROCESSING")
                      .put("provider", code)
                      .put("executionProtocol", "HISPREAD_PAYOUT_V1")
                      .put("executionStartedAt", Instant.now().toString())
                      .put("statusUpdatedAt", Instant.now().toString()));
              return new Intent(operation, adapter, request, true);
            });
    if (!intent.send) return publicPayment(intent.operation, req);
    try {
      ObjectNode response =
          gateway.exchange(
              intent.adapter, id, "execute", intent.payload, text(intent.operation, "requestKey"));
      return apply(id, response, null, req);
    } catch (ApiException e) {
      return apply(id, null, e.code == null ? "PAYMENT_ADAPTER_UNKNOWN" : e.code, req);
    }
  }

  public ObjectNode reconcile(String id, ObjectNode body, HttpServletRequest req) {
    permitted(req, "payout.reconcile");
    ObjectNode payment = access.get("payment", id, req), operation = existing(id);
    if (operation == null) throw new ApiException(409, "没有可查询的原支付执行操作");
    if (Set.of("SUCCEEDED", "FAILED").contains(text(operation, "state")))
      return publicPayment(payment, req);
    version(payment, body);
    if (!Set.of("PROCESSING", "UNKNOWN").contains(text(payment, "state")))
      throw new ApiException(409, "原支付操作状态不可查询");
    ObjectNode adapter = gateway.requireAdapter(provider(text(operation, "providerCode")));
    if (!eq(adapter, "baseUrl", text(operation, "adapterBaseUrl")))
      throw new ApiException(409, "支付中台地址已变化，请恢复原操作目标后查询");
    ObjectNode request =
        s.object()
            .put("protocol", "HISPREAD_PAYOUT_V1")
            .put("localPaymentId", id)
            .put("requestKey", text(operation, "requestKey"))
            .put("operationId", text(operation, "operationId"));
    try {
      return apply(
          id,
          gateway.exchange(adapter, id, "reconcile", request, text(operation, "requestKey")),
          null,
          req);
    } catch (ApiException e) {
      return apply(id, null, e.code == null ? "PAYMENT_ADAPTER_UNKNOWN" : e.code, req);
    }
  }

  private void validateEcho(ObjectNode response, ObjectNode payment) {
    if (!eq(response, "localPaymentId", text(payment, "id"))
        || !eq(response, "requestKey", text(payment, "requestKey"))
        || !eq(response, "currency", text(payment, "payoutCurrency")))
      throw new ApiException(502, "支付中台响应身份或币种不匹配", "PAYMENT_ADAPTER_IDENTITY_MISMATCH");
    try {
      if (new BigDecimal(text(response, "amount")).compareTo(amount(payment, "payoutAmount")) != 0)
        throw new NumberFormatException();
    } catch (NumberFormatException e) {
      throw new ApiException(502, "支付中台金额不匹配", "PAYMENT_ADAPTER_AMOUNT_MISMATCH");
    }
  }

  private ObjectNode apply(String id, ObjectNode response, String failure, HttpServletRequest req) {
    return tx.execute(
        status -> {
          String error = failure;
          lock("payment-state:" + id);
          ObjectNode operation = s.get("payout-call", id, null),
              payment = access.get("payment", id, req);
          if (Set.of("SUCCEEDED", "FAILED").contains(text(operation, "state")))
            return publicPayment(payment, req);
          String state = "PAYMENT_ADAPTER_REJECTED".equals(error) ? "FAILED" : "UNKNOWN";
          if (response != null) {
            try {
              validateEcho(response, payment);
              String remote = text(response, "state");
              if (Set.of("SUCCEEDED", "FAILED", "PROCESSING", "UNKNOWN").contains(remote)) {
                state = remote;
                if ((remote.equals("SUCCEEDED")
                        && (text(response, "operationId").isBlank()
                            || text(response, "externalRef").isBlank()))
                    || (remote.equals("FAILED") && text(response, "operationId").isBlank())) {
                  state = "UNKNOWN";
                  error = "PAYMENT_ADAPTER_MISSING_REFERENCE";
                }
              } else error = "PAYMENT_ADAPTER_INVALID_STATE";
            } catch (ApiException e) {
              error = e.code;
            }
          }
          ObjectNode opPatch =
              s.object()
                  .put("version", operation.path("version").asLong())
                  .put("state", state)
                  .put("lastCheckedAt", Instant.now().toString());
          ObjectNode payPatch =
              s.object()
                  .put("version", payment.path("version").asLong())
                  .put("state", state)
                  .put("statusUpdatedAt", Instant.now().toString())
                  .put("verificationMode", "EXTERNAL_BRIDGE");
          if (response != null && error == null) {
            if (!text(response, "operationId").isBlank()) {
              opPatch.put("operationId", text(response, "operationId"));
              payPatch.put("operationId", text(response, "operationId"));
            }
            if (!text(response, "externalRef").isBlank()) {
              opPatch.put("externalRef", text(response, "externalRef"));
              payPatch.put("externalRef", text(response, "externalRef"));
            }
          }
          if (error != null) {
            opPatch.put("lastErrorCode", error);
            payPatch.put("lastExecutionError", "支付中台结果尚未核实，请查询原操作");
          }
          if (state.equals("SUCCEEDED") && !operation.path("paidApplied").asBoolean()) {
            lock("payment:" + text(payment, "settlementId"));
            ObjectNode settlement = access.get("settlement", text(payment, "settlementId"), req);
            s.update(
                "settlement",
                text(settlement, "id"),
                text(payment, "supplierId"),
                s.object()
                    .put("version", settlement.path("version").asLong())
                    .put(
                        "paidAmount",
                        amount(settlement, "paidAmount")
                            .add(amount(payment, "obligationAmount"))
                            .toPlainString()));
            opPatch.put("paidApplied", true);
          }
          if (state.equals("FAILED") && !operation.path("reservationReleased").asBoolean()) {
            lock("payment:" + text(payment, "settlementId"));
            ObjectNode settlement = access.get("settlement", text(payment, "settlementId"), req);
            s.update(
                "settlement",
                text(settlement, "id"),
                text(payment, "supplierId"),
                s.object()
                    .put("version", settlement.path("version").asLong())
                    .put(
                        "reservedAmount",
                        amount(settlement, "reservedAmount")
                            .subtract(amount(payment, "obligationAmount"))
                            .max(BigDecimal.ZERO)
                            .toPlainString()));
            opPatch.put("reservationReleased", true);
          }
          s.update("payout-call", id, text(payment, "supplierId"), opPatch);
          return publicPayment(s.update("payment", id, text(payment, "supplierId"), payPatch), req);
        });
  }

  private ObjectNode publicPayment(ObjectNode payment, HttpServletRequest req) {
    return access.publicRecord("payment", payment, req);
  }
}
