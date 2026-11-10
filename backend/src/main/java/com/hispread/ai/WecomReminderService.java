package com.hispread.ai;

import static com.hispread.ai.BusinessSupport.*;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.node.*;
import java.net.*;
import java.net.http.*;
import java.nio.charset.StandardCharsets;
import java.security.*;
import java.time.*;
import java.util.*;
import javax.crypto.Cipher;
import javax.crypto.spec.*;
import org.springframework.core.env.Environment;
import org.springframework.stereotype.Service;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.support.TransactionTemplate;

/** Official WeCom group robot protocol. Webhook credentials never enter public settings or runs. */
@Service
public class WecomReminderService {
  private final Store s;
  private final Environment env;
  private final TransactionTemplate tx;
  private final HttpClient http =
      HttpClient.newBuilder()
          .connectTimeout(Duration.ofSeconds(5))
          .followRedirects(HttpClient.Redirect.NEVER)
          .build();

  public WecomReminderService(Store s, Environment env, PlatformTransactionManager manager) {
    this.s = s;
    this.env = env;
    this.tx = new TransactionTemplate(manager);
  }

  private ObjectNode config() {
    return s.list("reminder-settings", null).stream()
        .findFirst()
        .orElseGet(
            () ->
                s.create(
                    "reminder-settings",
                    "GLOBAL",
                    s.object().put("id", "default").put("workbenchUrl", "")));
  }

  public ObjectNode settings() {
    ObjectNode c = config().deepCopy();
    c.remove(List.of("webhookCiphertext", "webhookUrl", "lastFingerprint", "lastAttemptAt"));
    c.put("webhookUrl", "").put("configured", configured());
    c.put("encryptionConfigured", encryptionKey() != null);
    return c;
  }

  private byte[] encryptionKey() {
    String value =
        env.getProperty(
            "app.jobs.wecom.encryption-key", env.getProperty("WECOM_ENCRYPTION_KEY", ""));
    try {
      byte[] key = Base64.getDecoder().decode(value);
      return key.length == 32 ? key : null;
    } catch (IllegalArgumentException ignored) {
      return null;
    }
  }

  private String crypt(String value, boolean encrypt) {
    byte[] key = encryptionKey();
    if (key == null)
      throw new ApiException(
          503, "请先配置服务端WECOM_ENCRYPTION_KEY（Base64编码32字节）", "WECOM_ENCRYPTION_NOT_CONFIGURED");
    try {
      Cipher cipher = Cipher.getInstance("AES/GCM/NoPadding");
      byte[] iv = new byte[12];
      byte[] input;
      if (encrypt) {
        new SecureRandom().nextBytes(iv);
        input = value.getBytes(StandardCharsets.UTF_8);
      } else {
        byte[] stored = Base64.getDecoder().decode(value);
        System.arraycopy(stored, 0, iv, 0, 12);
        input = Arrays.copyOfRange(stored, 12, stored.length);
      }
      cipher.init(
          encrypt ? Cipher.ENCRYPT_MODE : Cipher.DECRYPT_MODE,
          new SecretKeySpec(key, "AES"),
          new GCMParameterSpec(128, iv));
      cipher.updateAAD("hispread-wecom-reminder-v1".getBytes(StandardCharsets.UTF_8));
      byte[] result = cipher.doFinal(input);
      if (!encrypt) return new String(result, StandardCharsets.UTF_8);
      byte[] stored = Arrays.copyOf(iv, iv.length + result.length);
      System.arraycopy(result, 0, stored, iv.length, result.length);
      return Base64.getEncoder().encodeToString(stored);
    } catch (Exception error) {
      throw new ApiException(503, "机器人凭据无法解密，请重新保存配置", "WECOM_CREDENTIAL_INVALID");
    }
  }

  private boolean testLocal() {
    return env.getProperty("app.integrations.allow-private-targets", Boolean.class, false)
        && Arrays.asList(env.getActiveProfiles()).contains("test");
  }

  private URI webhook(String url) {
    try {
      URI u = URI.create(url);
      boolean fixture =
          testLocal()
              && Set.of("localhost", "127.0.0.1", "::1").contains(u.getHost())
              && "http".equals(u.getScheme());
      if (u.getUserInfo() != null
          || u.getFragment() != null
          || !"/cgi-bin/webhook/send".equals(u.getPath())
          || !fixture
              && (!"https".equals(u.getScheme())
                  || !"qyapi.weixin.qq.com".equals(u.getHost())
                  || u.getPort() != -1 && u.getPort() != 443)
          || u.getRawQuery() == null
          || !u.getRawQuery().matches("key=[A-Za-z0-9_-]{6,200}"))
        throw new IllegalArgumentException();
      return u;
    } catch (IllegalArgumentException e) {
      throw new ApiException(400, "请使用企业微信官方群机器人Webhook地址", "WECOM_INVALID_WEBHOOK");
    }
  }

  private void workbench(String url) {
    if (url.isBlank()) return;
    try {
      URI u = URI.create(url);
      if (!"https".equals(u.getScheme())
          || u.getHost() == null
          || u.getUserInfo() != null
          || url.length() > 1000
          || url.contains("\n")
          || url.contains("]")
          || url.contains(")")) throw new IllegalArgumentException();
    } catch (IllegalArgumentException e) {
      throw new ApiException(400, "工作台链接须为有效HTTPS地址");
    }
  }

  public ObjectNode save(ObjectNode body) {
    return tx.execute(
        status -> {
          ObjectNode old = config(), patch = s.object();
          if (body.has("version")) patch.set("version", body.get("version"));
          String link = body.path("workbenchUrl").asText(text(old, "workbenchUrl")).trim();
          workbench(link);
          patch.put("workbenchUrl", link);
          if (body.path("clearWebhook").asBoolean()) patch.put("webhookCiphertext", "");
          else if (!text(body, "webhookUrl").isBlank())
            patch.put(
                "webhookCiphertext",
                crypt(webhook(text(body, "webhookUrl").trim()).toString(), true));
          // Remove legacy plaintext if a prior deployment stored it.
          patch.putNull("webhookUrl");
          s.update("reminder-settings", text(old, "id"), null, patch);
          return settings();
        });
  }

  public boolean configured() {
    try {
      List<ObjectNode> rows = s.list("reminder-settings", null);
      if (rows.isEmpty() || text(rows.get(0), "webhookCiphertext").isBlank()) return false;
      webhook(crypt(text(rows.get(0), "webhookCiphertext"), false));
      return true;
    } catch (ApiException e) {
      return false;
    }
  }

  private Map<String, Integer> counts() {
    Map<String, Integer> out = new LinkedHashMap<>();
    out.put(
        "新报价待审",
        (int) s.list("quote", null).stream().filter(x -> eq(x, "state", "PENDING")).count());
    out.put(
        "供应商资质待审",
        (int)
            s.list("supplier", null).stream()
                .filter(x -> eq(x, "state", "PENDING") || eq(x, "profileReviewState", "PENDING"))
                .count());
    out.put(
        "收款账户待审",
        (int) s.list("account", null).stream().filter(x -> eq(x, "state", "PENDING")).count());
    out.put(
        "付款待审",
        (int)
            s.list("payment", null).stream()
                .filter(x -> Set.of("PENDING", "PENDING_REVIEW").contains(text(x, "state")))
                .count());
    return out;
  }

  public ObjectNode send(ObjectNode task) {
    if (!configured()) throw new ApiException(503, "未配置企业微信机器人或服务端加密密钥", "WECOM_NOT_CONFIGURED");
    ObjectNode c = config();
    Map<String, Integer> counts = counts();
    int total = counts.values().stream().mapToInt(Integer::intValue).sum();
    if (total == 0) return s.object().put("processedCount", 0).put("resultCode", "NO_TODOS");
    String fingerprint = counts.toString() + ":" + text(c, "workbenchUrl");
    int cooldown = Math.max(60, task.path("intervalMinutes").asInt(10) * 60);
    // Claim before sending, including unknown network outcomes; WeCom provides no idempotency key.
    ObjectNode claim =
        tx.execute(
            status -> {
              s.jdbc.queryForObject(
                  "select pg_advisory_xact_lock(hashtextextended(?,0))",
                  Object.class,
                  "wecom-reminder-send");
              ObjectNode current = config();
              try {
                if (Instant.parse(text(current, "lastAttemptAt"))
                    .plusSeconds(cooldown)
                    .isAfter(Instant.now())) return null;
              } catch (DateTimeException ignored) {
              }
              return s.update(
                  "reminder-settings",
                  text(current, "id"),
                  null,
                  s.object()
                      .put("version", current.path("version").asLong())
                      .put("lastAttemptAt", Instant.now().toString())
                      .put("lastFingerprint", fingerprint));
            });
    if (claim == null)
      return s.object().put("processedCount", 0).put("resultCode", "DUPLICATE_SUPPRESSED");
    StringBuilder message = new StringBuilder("## 工作台待办提醒\n");
    counts.forEach(
        (name, count) -> {
          if (count > 0) message.append("> ").append(name).append("：").append(count).append("\n");
        });
    if (!text(c, "workbenchUrl").isBlank())
      message.append("[打开工作台](").append(text(c, "workbenchUrl")).append(")");
    if (message.toString().getBytes(StandardCharsets.UTF_8).length > 4096)
      throw new ApiException(400, "提醒内容超过企业微信限制", "WECOM_MESSAGE_TOO_LARGE");
    ObjectNode payload = s.object().put("msgtype", "markdown");
    payload.putObject("markdown").put("content", message.toString());
    HttpRequest request =
        HttpRequest.newBuilder(webhook(crypt(text(c, "webhookCiphertext"), false)))
            .timeout(
                Duration.ofMillis(
                    Math.max(
                        1000,
                        Math.min(
                            30000,
                            env.getProperty(
                                "app.integrations.request-timeout-ms", Integer.class, 15000)))))
            .header("Content-Type", "application/json; charset=utf-8")
            .POST(HttpRequest.BodyPublishers.ofString(payload.toString(), StandardCharsets.UTF_8))
            .build();
    try {
      HttpResponse<String> response =
          http.send(request, HttpResponse.BodyHandlers.ofString(StandardCharsets.UTF_8));
      if (response.statusCode() < 200 || response.statusCode() >= 300)
        throw new ApiException(
            502, "企业微信请求失败（HTTP " + response.statusCode() + "）", "WECOM_HTTP_ERROR");
      JsonNode result;
      try {
        result = response.body().length() < 65536 ? s.json.readTree(response.body()) : null;
      } catch (Exception ignored) {
        result = null;
      }
      if (result == null
          || !result.isObject()
          || !result.path("errcode").isIntegralNumber()
          || !result.path("errcode").canConvertToInt())
        throw new ApiException(502, "企业微信响应无效", "WECOM_INVALID_RESPONSE");
      if (result.path("errcode").asInt() != 0)
        throw new ApiException(
            502, "企业微信拒绝消息（错误码 " + result.path("errcode").asInt() + "）", "WECOM_REJECTED");
      return s.object().put("processedCount", total).put("resultCode", "SENT");
    } catch (HttpTimeoutException e) {
      throw new ApiException(504, "企业微信发送结果未确认", "WECOM_TIMEOUT");
    } catch (InterruptedException e) {
      Thread.currentThread().interrupt();
      throw new ApiException(503, "企业微信发送已中断", "WECOM_NETWORK_ERROR");
    } catch (java.io.IOException e) {
      throw new ApiException(502, "企业微信网络异常，发送结果未确认", "WECOM_NETWORK_ERROR");
    }
  }
}
