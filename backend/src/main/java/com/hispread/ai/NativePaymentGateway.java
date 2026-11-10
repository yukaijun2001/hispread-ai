package com.hispread.ai;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import java.math.BigDecimal;
import java.net.URI;
import java.net.URLEncoder;
import java.net.http.*;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.time.*;
import java.time.format.DateTimeFormatterBuilder;
import java.util.*;
import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import org.springframework.stereotype.Service;

/** Official native APIs. No network retries; an accepted create is never treated as paid. */
@Service
public class NativePaymentGateway {
  public static final Set<String> PROTOCOLS =
      Set.of("NATIVE_AIRWALLEX", "NATIVE_OKX", "NATIVE_BINANCE");

  public record Request(String method, URI uri, Map<String, String> headers, String body, int timeoutMs) {}
  public record Reply(int status, String body) {}
  @FunctionalInterface
  public interface Transport { Reply send(Request request) throws Exception; }

  private final Store s;
  private final Transport transport;
  private final Clock clock;

  @org.springframework.beans.factory.annotation.Autowired
  public NativePaymentGateway(Store s) {
    this(s, request -> {
      HttpClient client = HttpClient.newBuilder()
          .connectTimeout(Duration.ofMillis(request.timeoutMs()))
          .followRedirects(HttpClient.Redirect.NEVER).build();
      HttpRequest.Builder builder = HttpRequest.newBuilder(request.uri())
          .timeout(Duration.ofMillis(request.timeoutMs()));
      request.headers().forEach(builder::header);
      builder.method(request.method(), HttpRequest.BodyPublishers.ofString(request.body(), StandardCharsets.UTF_8));
      HttpResponse<String> reply = client.send(builder.build(), HttpResponse.BodyHandlers.ofString(StandardCharsets.UTF_8));
      return new Reply(reply.statusCode(), reply.body());
    }, Clock.systemUTC());
  }

  public NativePaymentGateway(Store s, Transport transport, Clock clock) {
    this.s = s;
    this.transport = transport;
    this.clock = clock;
  }

  static String text(JsonNode node, String field) { return node.path(field).asText(""); }

  public String origin(ObjectNode c) {
    String region = text(c, "regionCode");
    if (region.isBlank()) region = "GLOBAL";
    return switch (text(c, "protocol")) {
      case "NATIVE_AIRWALLEX" -> switch (region) {
        case "SANDBOX" -> "https://api.sandbox.airwallex.com";
        case "GLOBAL", "PRODUCTION" -> "https://api.airwallex.com";
        default -> throw invalid("不支持的Airwallex区域");
      };
      case "NATIVE_OKX" -> switch (region) {
        case "GLOBAL" -> "https://openapi.okx.com";
        case "US", "AU" -> "https://us.okx.com";
        case "EU", "EEA" -> "https://eea.okx.com";
        default -> throw invalid("不支持的OKX区域");
      };
      case "NATIVE_BINANCE" -> {
        if (!region.equals("GLOBAL")) throw invalid("原生Binance仅支持GLOBAL钱包API");
        yield "https://api.binance.com";
      }
      default -> throw invalid("未知原生支付协议");
    };
  }

  public void validateConfig(ObjectNode c) {
    String host = origin(c);
    if (!text(c, "baseUrl").isBlank() && !text(c, "baseUrl").equals(host))
      throw invalid("原生支付地址必须为所选区域的官方固定HTTPS地址");
    if (c.path("allowHttp").asBoolean()) throw invalid("原生支付不允许HTTP");
    credential(c, "apiKey");
    if (text(c, "protocol").equals("NATIVE_AIRWALLEX")) {
      credential(c, "clientId");
      if (!Set.of("", "2025-06-30").contains(text(c, "apiVersion")))
        throw invalid("Airwallex原生转账协议固定支持2025-06-30版本");
      if (!Set.of("", "LOCAL", "SWIFT").contains(text(c, "transferMethod")))
        throw invalid("Airwallex transferMethod需为LOCAL或SWIFT");
    } else {
      credential(c, "secretKey");
      if (text(c, "protocol").equals("NATIVE_OKX")) credential(c, "passphrase");
      else if (!Set.of("", "SPOT", "FUNDING").contains(text(c, "sourceWallet")))
        throw invalid("Binance sourceWallet需为SPOT或FUNDING");
    }
    for (String field : List.of("networkMappings", "beneficiaryMappings", "recipientInformation")) {
      if (c.has(field) && !c.path(field).isObject()) throw invalid(field + "需为对象");
      if (c.path(field).size() > 1000) throw invalid(field + "配置项过多");
    }
    for (String field : List.of("singleLimit", "dailyLimit")) {
      if (!text(c, field).isBlank() && decimal(c.get(field), field).signum() <= 0)
        throw invalid(field + "需为正数");
    }
  }

  private void credential(ObjectNode c, String name) {
    String value = text(c, name);
    if (value.isBlank() || value.length() > 4096 || value.indexOf('\r') >= 0 || value.indexOf('\n') >= 0)
      throw invalid("原生支付凭据未完整配置：" + name);
  }

  /** Pure validation before durable intent: no authentication or payment requests. */
  public void validatePayment(ObjectNode c, ObjectNode payload) {
    validateConfig(c);
    BigDecimal amount = decimal(payload.get("amount"), "amount");
    if (amount.signum() <= 0 || amount.scale() > 18) throw invalid("付款金额或精度无效");
    if (!text(c, "singleLimit").isBlank() && amount.compareTo(decimal(c.get("singleLimit"), "singleLimit")) > 0)
      throw invalid("超过通道单笔付款限额");
    BigDecimal fee = decimal(payload.get("fee"), "fee");
    if (fee.signum() < 0) throw invalid("手续费不能为负数");
    JsonNode recipient = payload.path("recipient");
    String protocol = text(c, "protocol"), currency = text(payload, "currency"), type = text(recipient, "accountType");
    String number = text(recipient, "accountNumber");
    if (number.isBlank() || number.length() > 300 || number.chars().anyMatch(Character::isISOControl))
      throw invalid("原生支付收款目标无效");
    if (protocol.equals("NATIVE_AIRWALLEX")) {
      if (!type.equals("BANK") || !Set.of("USD", "CNY").contains(currency))
        throw invalid("Airwallex仅支持对应币种的已审核银行账户");
      JsonNode mapping = mapping(c, payload, "beneficiaryMappings");
      if (!text(mapping, "beneficiaryId").matches("[A-Za-z0-9_-]{1,100}"))
        throw invalid("请绑定已验证的Airwallex收款人");
      if (text(c, "transferReason").isBlank()) throw invalid("请配置Airwallex转账用途");
    } else {
      String expected = protocol.equals("NATIVE_OKX") ? "OKX_USDT" : "BINANCE_USDT";
      if (!type.equals(expected) || !currency.equals("USDT")) throw invalid("币种或账户类型与原生通道不匹配");
      String transferType = text(recipient, "transferType");
      if (transferType.equals("INTERNAL_UID")) {
        if (!protocol.equals("NATIVE_OKX") || !number.matches("[0-9]{1,32}"))
          throw invalid("仅OKX支持数字UID内部转账");
        if (amount.stripTrailingZeros().scale() > 8 || fee.signum() != 0)
          throw invalid("OKX内部转账最多8位小数且手续费为0");
      } else if (transferType.equals("ONCHAIN")) {
        network(c, recipient);
        if (!Set.of("PRIVATE", "EXCHANGE").contains(text(recipient, "walletType")))
          throw invalid("链上收款需指定钱包类型");
        if (c.path("recipientInformation").has(text(recipient, "id")))
          mapping(c, payload, "recipientInformation");
      } else throw invalid("请选择ONCHAIN或受支持的INTERNAL_UID转账类型");
    }
  }

  private JsonNode mapping(ObjectNode c, ObjectNode payload, String name) {
    JsonNode recipient = payload.path("recipient"), entry = c.path(name).path(text(recipient, "id"));
    if (!entry.isObject() || !entry.has("accountVersion")
        || entry.path("accountVersion").asLong(-1) != payload.path("accountVersion").asLong(-2))
      throw invalid("请为当前审核账户版本配置" + name);
    return entry;
  }

  private String network(ObjectNode c, JsonNode recipient) {
    String label = text(recipient, "network"), mapped = c.path("networkMappings").path(label).asText("");
    if (mapped.isBlank()) mapped = label;
    if (!mapped.matches("[A-Za-z0-9][A-Za-z0-9_.-]{0,79}")) throw invalid("请明确配置官方网络/链标识");
    return mapped;
  }

  /** Nonsecret route snapshot persisted before send, so timeout reconciliation uses the same identity. */
  public ObjectNode context(ObjectNode c, ObjectNode p) {
    validatePayment(c, p);
    JsonNode recipient = p.path("recipient");
    ObjectNode out = s.object()
        .put("providerRequestId", providerRequestId(text(p, "localPaymentId"), text(p, "requestKey")))
        .put("expectedFee", text(p, "fee"))
        .put("createdAtMs", clock.millis())
        .put("accountVersion", p.path("accountVersion").asLong())
        .put("recipientHash", sha(text(recipient, "accountNumber")))
        .put("holderHash", sha(text(recipient, "holder")))
        .put("transferType", text(recipient, "transferType"))
        .put("network", text(c, "protocol").equals("NATIVE_AIRWALLEX") ? "" : networkIfNeeded(c, recipient));
    if (text(c, "protocol").equals("NATIVE_AIRWALLEX"))
      out.put("beneficiaryId", text(mapping(c, p, "beneficiaryMappings"), "beneficiaryId"));
    return out;
  }

  private String networkIfNeeded(ObjectNode c, JsonNode recipient) {
    return text(recipient, "transferType").equals("ONCHAIN") ? network(c, recipient) : "";
  }

  public String binding(ObjectNode c) {
    return sha(text(c, "protocol") + "\n" + origin(c) + "\n" + text(c, "apiKey") + "\n"
        + text(c, "clientId") + "\n" + text(c, "loginAs"));
  }

  public ObjectNode exchange(ObjectNode c, String id, String action, ObjectNode p, String key) {
    validateConfig(c);
    if (!Set.of("preview", "execute", "reconcile").contains(action)) throw invalid("未知原生支付操作");
    if (key.isBlank() || !key.equals(text(p, "requestKey"))) throw invalid("付款幂等标识缺失或不匹配");
    if (!action.equals("reconcile")) validatePayment(c, p);
    ObjectNode ctx = p.path("executionContext").isObject()
        ? (ObjectNode) p.path("executionContext") : action.equals("reconcile") ? s.object() : context(c, p);
    if (!providerRequestId(id, key).equals(text(ctx, "providerRequestId")))
      throw invalid("原生支付原操作身份缺失");
    return switch (text(c, "protocol")) {
      case "NATIVE_AIRWALLEX" -> airwallex(c, id, action, p, key, ctx);
      case "NATIVE_OKX" -> okx(c, id, action, p, key, ctx);
      case "NATIVE_BINANCE" -> binance(c, id, action, p, key, ctx);
      default -> throw invalid("未知原生支付协议");
    };
  }

  private ObjectNode airwallex(ObjectNode c, String id, String action, ObjectNode p, String key, ObjectNode ctx) {
    Map<String, String> auth = new LinkedHashMap<>();
    auth.put("x-client-id", text(c, "clientId"));
    auth.put("x-api-key", text(c, "apiKey"));
    if (!text(c, "loginAs").isBlank()) auth.put("x-login-as", text(c, "loginAs"));
    JsonNode login = send(c, "POST", "/api/v1/authentication/login", auth, "{}", false);
    String token = text(login, "token");
    if (token.isBlank() || token.length() > 16384 || token.chars().anyMatch(Character::isISOControl))
      throw invalidResponse();
    Map<String, String> headers = new LinkedHashMap<>();
    headers.put("Authorization", "Bearer " + token);
    headers.put("x-api-version", "2025-06-30");
    if (action.equals("reconcile")) {
      JsonNode list = send(c, "GET", "/api/v1/transfers?request_id=" + encode(text(ctx, "providerRequestId"))
          + "&page_size=2", headers, "", false);
      JsonNode row = unique(list.path("items"), "request_id", text(ctx, "providerRequestId"));
      if (row == null) return result(id, p, key, "UNKNOWN", "", "");
      validateAirwallex(row, p, ctx);
      return airwallexResult(id, p, key, row);
    }
    JsonNode beneficiary = send(c, "GET", "/api/v1/beneficiaries/" + text(ctx, "beneficiaryId"), headers, "", false);
    JsonNode bank = beneficiary.path("beneficiary").path("bank_details");
    String number = text(bank, "account_number").isBlank() ? text(bank, "iban") : text(bank, "account_number");
    if (!text(beneficiary, "id").equals(text(ctx, "beneficiaryId"))
        || !sha(number).equals(text(ctx, "recipientHash"))
        || !sha(text(bank, "account_name")).equals(text(ctx, "holderHash"))
        || !text(bank, "account_currency").equals(text(p, "currency")))
      throw rejected("Airwallex收款人资料与当前审核账户不匹配");
    ObjectNode transfer = s.object().put("request_id", text(ctx, "providerRequestId"))
        .put("beneficiary_id", text(ctx, "beneficiaryId"))
        .put("transfer_currency", text(p, "currency"))
        .put("source_currency", text(p, "currency"))
        .put("transfer_amount", text(p, "amount"))
        .put("fee_paid_by", "PAYER")
        .put("reason", text(c, "transferReason"))
        .put("reference", id.substring(0, Math.min(id.length(), 32)))
        .put("transfer_method", c.path("transferMethod").asText("LOCAL"));
    if (action.equals("preview")) {
      send(c, "POST", "/api/v1/transfers/validate", headers, transfer.toString(), false);
      return result(id, p, key, "PREVIEW", "", "").put("executable", true)
          .put("feeVerification", "PROVIDER_VALIDATED_REQUEST_ONLY").put("feeEstimateOnly", true);
    }
    // Revalidate the beneficiary for each execution; no create retries after this one request.
    JsonNode row = send(c, "POST", "/api/v1/transfers/create", headers, transfer.toString(), true);
    validateAirwallex(row, p, ctx);
    return airwallexResult(id, p, key, row);
  }

  private void validateAirwallex(JsonNode row, ObjectNode p, ObjectNode ctx) {
    if (!text(row, "request_id").equals(text(ctx, "providerRequestId"))
        || !text(row, "beneficiary_id").equals(text(ctx, "beneficiaryId"))
        || !text(row, "transfer_currency").equals(text(p, "currency"))
        || !sameAmount(row.get("transfer_amount"), p.get("amount"))
        || !text(p, "operationId").isBlank() && !text(p, "operationId").equals(text(row, "id"))) throw identityMismatch();
  }

  private ObjectNode airwallexResult(String id, ObjectNode p, String key, JsonNode row) {
    String remote = text(row, "status");
    String state = switch (remote) {
      case "PAID" -> "SUCCEEDED";
      case "FAILED", "CANCELLED" -> "FAILED";
      case "IN_APPROVAL", "APPROVAL_RECALLED", "APPROVAL_REJECTED", "APPROVAL_BLOCKED", "SCHEDULED", "OVERDUE", "PROCESSING", "SENT" -> "PROCESSING";
      default -> "UNKNOWN";
    };
    ObjectNode result = result(id, p, key, state, text(row, "id"), reference(row, "short_reference_id", "id"))
        .put("providerState", remote).put("providerFinality", state.equals("SUCCEEDED") ? "PROVISIONAL" : "PENDING")
        .put("lateReturnMonitoringRequired", true);
    if (row.hasNonNull("fee_amount")) result.put("providerFeeAmount", text(row, "fee_amount"));
    if (row.hasNonNull("fee_currency")) result.put("providerFeeCurrency", text(row, "fee_currency"));
    JsonNode expectedFee = p.path("executionContext").path("expectedFee");
    if (row.hasNonNull("fee_amount") && !expectedFee.isMissingNode())
      result.put("providerFeeVariance", !sameAmount(row.get("fee_amount"), expectedFee));
    return result;
  }

  private ObjectNode okx(ObjectNode c, String id, String action, ObjectNode p, String key, ObjectNode ctx) {
    String clientId = text(ctx, "providerRequestId");
    if (action.equals("reconcile")) {
      JsonNode list = okxRequest(c, "GET", "/api/v5/asset/withdrawal-history?ccy=USDT&clientId=" + clientId, "", false);
      JsonNode row = unique(list.path("data"), "clientId", clientId);
      if (row == null) return result(id, p, key, "UNKNOWN", "", "");
      validateCryptoHistory(row, p, ctx, "amt", "ccy", "to", "chain");
      if (!text(p, "operationId").isBlank() && !text(p, "operationId").equals(text(row, "wdId"))) throw identityMismatch();
      String remote = text(row, "state");
      String state = remote.equals("2") ? "SUCCEEDED" : Set.of("-1", "-2").contains(remote) ? "FAILED"
          : Set.of("-3", "0", "1", "4", "5", "6", "7", "8", "9", "10", "12", "15", "16", "17", "19").contains(remote) ? "PROCESSING" : "UNKNOWN";
      ObjectNode result = result(id, p, key, state, text(row, "wdId"), reference(row, "txId", "wdId")).put("providerState", remote);
      if (row.hasNonNull("fee")) result.put("providerFeeAmount", text(row, "fee"))
          .put("providerFeeCurrency", row.path("feeCcy").asText("USDT"))
          .put("providerFeeVariance", !sameAmount(row.get("fee"), ctx.get("expectedFee"))
              || !row.path("feeCcy").asText("USDT").equals("USDT"));
      return result;
    }
    BigDecimal amount = decimal(p.get("amount"), "amount"), fee = decimal(p.get("fee"), "fee");
    boolean internal = text(ctx, "transferType").equals("INTERNAL_UID");
    if (!internal) {
      JsonNode currencies = okxRequest(c, "GET", "/api/v5/asset/currencies?ccy=USDT", "", false);
      JsonNode chain = unique(currencies.path("data"), "chain", text(ctx, "network"));
      if (chain == null || !chain.path("canWd").asBoolean()) throw rejected("OKX所选网络不可提币");
      bounds(amount, chain, "minWd", "maxWd");
      int precision = chain.path("wdTickSz").asInt(-1);
      if (precision < 0 || amount.stripTrailingZeros().scale() > precision) throw rejected("OKX提币精度不符合官方网络规则");
      JsonNode officialFee = chain.hasNonNull("fee") ? chain.get("fee") : chain.get("minFee");
      if (officialFee == null || decimal(officialFee, "fee").compareTo(fee) != 0)
        throw rejected("OKX当前提币手续费与审核金额不一致，请重新申请");
    }
    JsonNode balance = okxRequest(c, "GET", "/api/v5/asset/balances?ccy=USDT", "", false);
    JsonNode usd = unique(balance.path("data"), "ccy", "USDT");
    if (usd == null || decimal(usd.get("availBal"), "availBal").compareTo(amount.add(fee)) < 0)
      throw rejected("OKX资金账户可用余额不足");
    if (action.equals("preview")) return result(id, p, key, "PREVIEW", "", "").put("executable", true)
        .put("availableBalance", text(usd, "availBal")).put("feeVerification", "CURRENT_NETWORK_FEE");
    ObjectNode withdrawal = s.object().put("ccy", "USDT").put("amt", text(p, "amount"))
        .put("dest", internal ? "3" : "4").put("toAddr", text(p.path("recipient"), "accountNumber"))
        .put("clientId", clientId);
    if (internal) withdrawal.put("toAddrType", "2");
    else {
      withdrawal.put("chain", text(ctx, "network"));
      JsonNode info = c.path("recipientInformation").path(text(p.path("recipient"), "id"));
      if (info.path("rcvrInfo").isObject()) {
        ObjectNode receiver = ((ObjectNode) info.path("rcvrInfo")).deepCopy();
        String expected = text(p.path("recipient"), "walletType").toLowerCase(Locale.ROOT);
        if (!text(receiver, "walletType").equals(expected)) throw rejected("OKX收款人钱包类型与审核账户不匹配");
        withdrawal.set("rcvrInfo", receiver);
      }
    }
    JsonNode rows = okxRequest(c, "POST", "/api/v5/asset/withdrawal", withdrawal.toString(), true);
    JsonNode row = unique(rows.path("data"), "clientId", clientId);
    if (row == null || !text(row, "ccy").equals("USDT") || !sameAmount(row.get("amt"), p.get("amount"))) throw identityMismatch();
    return result(id, p, key, "PROCESSING", text(row, "wdId"), "");
  }

  private JsonNode okxRequest(ObjectNode c, String method, String path, String body, boolean creates) {
    String timestamp = new DateTimeFormatterBuilder().appendInstant(3).toFormatter().format(clock.instant());
    Map<String, String> headers = new LinkedHashMap<>();
    headers.put("OK-ACCESS-KEY", text(c, "apiKey"));
    headers.put("OK-ACCESS-TIMESTAMP", timestamp);
    headers.put("OK-ACCESS-PASSPHRASE", text(c, "passphrase"));
    headers.put("OK-ACCESS-SIGN", Base64.getEncoder().encodeToString(hmac(text(c, "secretKey"), timestamp + method + path + body)));
    JsonNode result = send(c, method, path, headers, body, creates);
    if (!text(result, "code").equals("0")) throw providerError(creates);
    return result;
  }

  private ObjectNode binance(ObjectNode c, String id, String action, ObjectNode p, String key, ObjectNode ctx) {
    String clientId = text(ctx, "providerRequestId");
    if (action.equals("reconcile")) {
      long start = ctx.path("createdAtMs").asLong(0);
      if (start <= 0) throw invalid("原操作创建时间缺失");
      LinkedHashMap<String, String> params = params("coin", "USDT", "withdrawOrderId", clientId,
          "startTime", Long.toString(Math.max(0, start - 60_000)), "endTime", Long.toString(start + Duration.ofDays(6).toMillis()));
      JsonNode rows = binanceRequest(c, "GET", "/sapi/v1/capital/withdraw/history", params, false);
      JsonNode row = unique(rows, "withdrawOrderId", clientId);
      if (row == null) return result(id, p, key, "UNKNOWN", "", "");
      validateCryptoHistory(row, p, ctx, "amount", "coin", "address", "network");
      if (!text(p, "operationId").isBlank() && !text(p, "operationId").equals(text(row, "id"))) throw identityMismatch();
      if (!sameAmount(row.get("transactionFee"), ctx.get("expectedFee"))) throw identityMismatch();
      String remote = text(row, "status");
      String state = remote.equals("6") ? "SUCCEEDED" : Set.of("1", "3", "5").contains(remote) ? "FAILED"
          : Set.of("0", "2", "4").contains(remote) ? "PROCESSING" : "UNKNOWN";
      return result(id, p, key, state, text(row, "id"), reference(row, "txId", "id")).put("providerState", remote);
    }
    JsonNode requirements = binanceRequest(c, "GET", "/sapi/v1/localentity/questionnaire-requirements", new LinkedHashMap<>(), false);
    String questionnaire = requirements.isTextual() ? requirements.asText() : text(requirements, "questionnaireCountryCode");
    if (!questionnaire.equals("NIL")) throw rejected("Binance账户需要Travel Rule问卷，当前标准提币适配器不能执行");
    JsonNode coins = binanceRequest(c, "GET", "/sapi/v1/capital/config/getall", new LinkedHashMap<>(), false);
    JsonNode coin = unique(coins, "coin", "USDT");
    JsonNode network = coin == null ? null : unique(coin.path("networkList"), "network", text(ctx, "network"));
    if (network == null || !network.path("withdrawEnable").asBoolean()) throw rejected("Binance所选网络不可提币");
    BigDecimal amount = decimal(p.get("amount"), "amount"), fee = decimal(p.get("fee"), "fee");
    bounds(amount, network, "withdrawMin", "withdrawMax");
    String multiple = text(network, "withdrawIntegerMultiple");
    BigDecimal debit = amount.add(fee);
    if (!multiple.isBlank()) {
      BigDecimal step = decimal(network.get("withdrawIntegerMultiple"), "withdrawIntegerMultiple");
      if (step.signum() > 0 && debit.remainder(step).signum() != 0) throw rejected("Binance提币金额不符合网络精度");
    }
    if (network.path("withdrawTag").asBoolean()) throw rejected("当前收款账户未保存该网络必需的Memo/Tag");
    String regex = text(network, "addressRegex");
    try {
      if (regex.length() > 500 || !regex.isBlank() && !text(p.path("recipient"), "accountNumber").matches(regex))
        throw rejected("Binance收款地址不符合官方网络规则");
    } catch (java.util.regex.PatternSyntaxException e) { throw invalidResponse(); }
    if (decimal(network.get("withdrawFee"), "withdrawFee").compareTo(fee) != 0)
      throw rejected("Binance当前网络手续费与审核手续费不一致，请重新申请");
    // Binance withdraw amount is the debited amount (recipient receives amount minus fee).
    bounds(debit, network, "withdrawMin", "withdrawMax");
    if (text(c, "sourceWallet").equals("FUNDING")) {
      JsonNode funding = binanceRequest(c, "POST", "/sapi/v1/asset/get-funding-asset", params("asset", "USDT"), false);
      JsonNode usdt = unique(funding, "asset", "USDT");
      if (usdt == null || decimal(usdt.get("free"), "free").compareTo(debit) < 0) throw rejected("Binance Funding余额不足");
    } else if (decimal(coin.get("free"), "free").compareTo(debit) < 0) throw rejected("Binance Spot余额不足");
    if (action.equals("preview")) return result(id, p, key, "PREVIEW", "", "").put("executable", true)
        .put("feeVerification", "CURRENT_NETWORK_FEE");
    LinkedHashMap<String, String> params = params("coin", "USDT", "withdrawOrderId", clientId,
        "network", text(ctx, "network"), "address", text(p.path("recipient"), "accountNumber"),
        "amount", debit.toPlainString(), "walletType", text(c, "sourceWallet").equals("FUNDING") ? "1" : "0");
    JsonNode row = binanceRequest(c, "POST", "/sapi/v1/capital/withdraw/apply", params, true);
    if (text(row, "id").isBlank()) throw invalidResponse();
    return result(id, p, key, "PROCESSING", text(row, "id"), "");
  }

  private JsonNode binanceRequest(ObjectNode c, String method, String path, LinkedHashMap<String, String> params, boolean creates) {
    LinkedHashMap<String, String> signed = new LinkedHashMap<>(params);
    signed.put("timestamp", Long.toString(clock.millis()));
    signed.put("recvWindow", "5000");
    StringJoiner query = new StringJoiner("&");
    signed.forEach((k, v) -> query.add(encode(k) + "=" + encode(v)));
    String unsigned = query.toString();
    String signature = HexFormat.of().formatHex(hmac(text(c, "secretKey"), unsigned));
    JsonNode row = send(c, method, path + "?" + unsigned + "&signature=" + signature,
        Map.of("X-MBX-APIKEY", text(c, "apiKey")), "", creates);
    if (row.has("code") && row.path("code").asInt() < 0) throw providerError(creates);
    return row;
  }

  private void validateCryptoHistory(JsonNode row, ObjectNode p, ObjectNode ctx,
      String amount, String currency, String address, String chain) {
    // Binance history exposes the net amount received, matching the local payoutAmount.
    if (!text(row, currency).equals(text(p, "currency")) || !sameAmount(row.get(amount), p.get("amount"))
        || !sha(text(row, address)).equals(text(ctx, "recipientHash"))
        || !text(ctx, "network").isBlank() && !text(row, chain).equals(text(ctx, "network"))) throw identityMismatch();
  }

  private void bounds(BigDecimal amount, JsonNode row, String minimum, String maximum) {
    if (!text(row, minimum).isBlank() && amount.compareTo(decimal(row.get(minimum), minimum)) < 0
        || !text(row, maximum).isBlank() && amount.compareTo(decimal(row.get(maximum), maximum)) > 0)
      throw rejected("付款金额不符合官方网络单笔限额");
  }

  private JsonNode unique(JsonNode rows, String field, String expected) {
    if (!rows.isArray()) throw invalidResponse();
    JsonNode found = null;
    for (JsonNode row : rows) if (text(row, field).equals(expected)) {
      if (found != null) throw identityMismatch();
      found = row;
    }
    return found;
  }

  private ObjectNode result(String id, ObjectNode p, String key, String state, String operationId, String reference) {
    return s.object().put("localPaymentId", id).put("requestKey", key).put("currency", text(p, "currency"))
        .put("amount", text(p, "amount")).put("state", state).put("operationId", operationId)
        .put("externalRef", reference).put("protocol", text(p, "protocol"));
  }

  private JsonNode send(ObjectNode c, String method, String path, Map<String, String> auth, String body, boolean creates) {
    LinkedHashMap<String, String> headers = new LinkedHashMap<>();
    headers.put("Accept", "application/json");
    headers.put("Content-Type", "application/json");
    headers.putAll(auth);
    int timeout = Math.max(1000, Math.min(30000, c.path("requestTimeoutMs").asInt(15000)));
    Reply reply;
    try {
      reply = transport.send(new Request(method, URI.create(origin(c) + path), Collections.unmodifiableMap(headers), body, timeout));
    } catch (InterruptedException e) {
      Thread.currentThread().interrupt();
      throw new ApiException(503, "原生支付请求中断；请查询原操作", "PAYMENT_ADAPTER_INTERRUPTED");
    } catch (HttpTimeoutException e) {
      throw new ApiException(504, "原生支付结果未知；请查询原操作，不得重新提币", "PAYMENT_ADAPTER_TIMEOUT");
    } catch (Exception e) {
      throw new ApiException(502, "原生支付连接结果未知；请查询原操作", "PAYMENT_ADAPTER_CONNECTION_FAILED");
    }
    if (reply.status() < 200 || reply.status() >= 300) throw providerError(creates);
    if (reply.body() == null || reply.body().length() > 1048576) throw invalidResponse();
    try {
      JsonNode parsed = s.json.readTree(reply.body());
      if (parsed == null || parsed.isNull()) throw invalidResponse();
      return parsed;
    } catch (java.io.IOException e) { throw invalidResponse(); }
  }

  static String providerRequestId(String localId, String requestKey) { return sha(localId + "\n" + requestKey).substring(0, 32); }
  static String sha(String text) {
    try { return HexFormat.of().formatHex(MessageDigest.getInstance("SHA-256").digest(text.getBytes(StandardCharsets.UTF_8))); }
    catch (Exception e) { throw new IllegalStateException(e); }
  }
  private static String reference(JsonNode row, String primary, String fallback) {
    return text(row, primary).isBlank() ? text(row, fallback) : text(row, primary);
  }
  private static byte[] hmac(String secret, String message) {
    try {
      Mac mac = Mac.getInstance("HmacSHA256");
      mac.init(new SecretKeySpec(secret.getBytes(StandardCharsets.UTF_8), "HmacSHA256"));
      return mac.doFinal(message.getBytes(StandardCharsets.UTF_8));
    } catch (Exception e) { throw new IllegalStateException(e); }
  }
  private static String encode(String value) { return URLEncoder.encode(value, StandardCharsets.UTF_8).replace("+", "%20"); }
  private static LinkedHashMap<String, String> params(String... fields) {
    LinkedHashMap<String, String> out = new LinkedHashMap<>();
    for (int n = 0; n < fields.length; n += 2) out.put(fields[n], fields[n + 1]);
    return out;
  }
  private static BigDecimal decimal(JsonNode value, String name) {
    try {
      if (value == null || value.isNull() || value.asText().length() > 64) throw new NumberFormatException();
      return new BigDecimal(value.asText());
    } catch (NumberFormatException e) { throw invalid("无效金额字段：" + name); }
  }
  private static boolean sameAmount(JsonNode first, JsonNode second) {
    try { return decimal(first, "amount").compareTo(decimal(second, "amount")) == 0; }
    catch (ApiException e) { return false; }
  }
  private static ApiException invalid(String message) { return new ApiException(400, message, "PAYMENT_NATIVE_INVALID_CONFIG"); }
  private static ApiException rejected(String message) { return new ApiException(409, message, "PAYMENT_ADAPTER_REJECTED"); }
  private static ApiException identityMismatch() { return new ApiException(502, "官方支付响应与原付款身份不匹配", "PAYMENT_ADAPTER_IDENTITY_MISMATCH"); }
  private static ApiException invalidResponse() { return new ApiException(502, "官方支付返回无法验证的响应", "PAYMENT_ADAPTER_INVALID_RESPONSE"); }
  private static ApiException providerError(boolean creates) {
    return new ApiException(502, "官方支付请求未确认成功；响应细节已隐藏",
        creates ? "PAYMENT_ADAPTER_UNKNOWN" : "PAYMENT_ADAPTER_REJECTED");
  }
}
