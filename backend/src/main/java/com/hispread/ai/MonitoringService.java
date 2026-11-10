package com.hispread.ai;

import static com.hispread.ai.BusinessSupport.*;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import java.math.BigDecimal;
import java.net.URI;
import java.time.Instant;
import java.util.*;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.support.TransactionTemplate;

/** One persisted source snapshot feeds both configuration and the public workbench. */
@Service
public class MonitoringService {
  private final Store s;
  private final ResourceIntegrationGateway gateway;
  private final TransactionTemplate tx;

  @Value("${app.monitoring.scheduling-enabled:true}")
  boolean schedulingEnabled;

  public MonitoringService(
      Store s, ResourceIntegrationGateway gateway, PlatformTransactionManager manager) {
    this.s = s;
    this.gateway = gateway;
    this.tx = new TransactionTemplate(manager);
  }

  public void validate(ObjectNode source) {
    if (!Set.of("NONE", "BEARER", "HEADER").contains(source.path("authType").asText("NONE")))
      throw new ApiException(400, "无效监控认证方式");
    if (!source.path("authType").asText("NONE").equals("NONE") && text(source, "token").isBlank())
      throw new ApiException(400, "请配置监控认证令牌");
    if (eq(source, "authType", "HEADER")
        && (!text(source, "authHeader").matches("[A-Za-z][A-Za-z0-9-]{0,60}")
            || Set.of("host", "cookie", "connection", "content-length", "authorization")
                .contains(text(source, "authHeader").toLowerCase(Locale.ROOT))))
      throw new ApiException(400, "无效监控认证请求头");
    for (String field : List.of("rpmPath", "tpmPath", "windowSecondsPath", "updatedAtPath")) {
      String path = text(source, field);
      if (!path.isBlank()
          && (!path.matches("[A-Za-z0-9_-]+(?:\\.[A-Za-z0-9_-]+)*") || path.length() > 256))
        throw new ApiException(400, "监控字段路径格式无效");
    }
    if (source.path("sortOrder").asInt() < 0) throw new ApiException(400, "显示顺序不能为负数");
    if (!text(source, "newApiUserId").isBlank()
        && !text(source, "newApiUserId").matches("[1-9][0-9]{0,18}"))
      throw new ApiException(400, "NewAPI用户ID须为正整数");
    try {
      gateway.validateEndpoint(
          URI.create(text(source, "endpoint")), source.path("allowHttp").asBoolean());
    } catch (IllegalArgumentException e) {
      throw new ApiException(400, "监控地址格式无效");
    }
  }

  private JsonNode field(JsonNode data, String path) {
    JsonNode value = data;
    for (String part : path.split("\\."))
      value =
          value.isArray() && part.matches("[0-9]{1,5}")
              ? value.path(Integer.parseInt(part))
              : value.path(part);
    return value;
  }

  private BigDecimal metric(JsonNode value, String name) {
    try {
      if (!value.isNumber() && !value.isTextual()) throw new NumberFormatException();
      BigDecimal number = new BigDecimal(value.asText());
      if (number.signum() < 0 || number.precision() > 40 || Math.abs(number.scale()) > 12)
        throw new NumberFormatException();
      return number;
    } catch (NumberFormatException e) {
      throw new ApiException(502, "监控返回无效非负数字：" + name, "MONITORING_INVALID_METRIC");
    }
  }

  public ObjectNode refresh(String id) {
    return refresh(id, false);
  }

  private ObjectNode refresh(String id, boolean dueOnly) {
    record Result(ObjectNode source, ApiException error) {}
    Result result =
        tx.execute(
            status -> {
              s.jdbc.queryForObject(
                  "select pg_advisory_xact_lock(hashtextextended(?,0))",
                  Object.class,
                  "monitoring:" + id);
              ObjectNode source = s.get("monitoring-source", id, null);
              if (dueOnly) {
                if (!source.path("enabled").asBoolean()) return new Result(source, null);
                try {
                  if (Instant.parse(text(source, "lastAttemptAt"))
                      .plusSeconds(source.path("intervalSeconds").asLong(60))
                      .isAfter(Instant.now())) return new Result(source, null);
                } catch (Exception ignored) {
                }
              }
              String now = Instant.now().toString();
              try {
                ObjectNode data = gateway.refreshMonitoring(source);
                if (data.has("success") && !data.path("success").asBoolean()
                    || data.has("errcode") && data.path("errcode").asInt(-1) != 0
                    || Set.of("FAILED", "ERROR", "REJECTED")
                        .contains(data.path("state").asText().toUpperCase(Locale.ROOT)))
                  throw new ApiException(502, "监控上游返回业务失败", "MONITORING_UPSTREAM_REJECTED");
                ObjectNode patch =
                    s.object()
                        .put("lastAttemptAt", now)
                        .put("queriedAt", now)
                        .put("state", "READY")
                        .putNull("lastError")
                        .putNull("lastErrorCode");
                for (String name : List.of("rpm", "tpm")) {
                  String path = text(source, name + "Path");
                  if (!path.isBlank())
                    patch.put(name, metric(field(data, path), name).toPlainString());
                  else patch.putNull(name);
                }
                String window = text(source, "windowSecondsPath");
                if (!window.isBlank()) {
                  BigDecimal seconds = metric(field(data, window), "windowSeconds");
                  if (seconds.signum() == 0) throw new ApiException(502, "监控窗口须大于零");
                  patch.put("windowSeconds", seconds.toPlainString());
                }
                String updated = text(source, "updatedAtPath");
                if (!updated.isBlank()) {
                  JsonNode value = field(data, updated);
                  try {
                    Instant at =
                        value.isNumber()
                            ? Instant.ofEpochSecond(value.longValue())
                            : Instant.parse(value.asText());
                    if (at.isAfter(Instant.now().plusSeconds(300)))
                      throw new IllegalArgumentException();
                    patch.put("dataUpdatedAt", at.toString());
                  } catch (Exception e) {
                    throw new ApiException(502, "监控数据时间无效");
                  }
                }
                patch.put("version", source.path("version").asLong());
                return new Result(s.update("monitoring-source", id, null, patch), null);
              } catch (ApiException e) {
                ObjectNode saved =
                    s.update(
                        "monitoring-source",
                        id,
                        null,
                        s.object()
                            .put("lastAttemptAt", now)
                            .put("state", "ERROR")
                            .put("lastError", "监控采集失败，请检查配置或上游服务")
                            .put(
                                "lastErrorCode",
                                e.code == null ? "MONITORING_UPSTREAM_FAILED" : e.code));
                return new Result(saved, e);
              } catch (IllegalArgumentException e) {
                ObjectNode saved =
                    s.update(
                        "monitoring-source",
                        id,
                        null,
                        s.object()
                            .put("lastAttemptAt", now)
                            .put("state", "ERROR")
                            .put("lastError", "监控地址或响应无效"));
                return new Result(saved, new ApiException(502, "监控地址或响应无效"));
              }
            });
    if (result.error() != null) throw result.error();
    return result.source();
  }

  /** The frontend's contract uses the highest eligible value per category, not a sum. */
  public List<ObjectNode> snapshots(boolean supplier) {
    Map<String, ObjectNode> groups = new LinkedHashMap<>();
    List<ObjectNode> sources = s.list("monitoring-source", null);
    sources.sort(Comparator.comparingInt(p -> p.path("sortOrder").asInt()));
    for (ObjectNode source : sources) {
      if (!source.path("enabled").asBoolean()
          || !source.path("includeInTotal").asBoolean()
          || supplier && !source.path("supplierVisible").asBoolean()
          || !source.hasNonNull("queriedAt")) continue;
      String category = source.path("category").asText("");
      ObjectNode row =
          groups.computeIfAbsent(
              category,
              key ->
                  s.object()
                      .put("category", key)
                      .put("categoryName", categoryName(key))
                      .putNull("rpm")
                      .putNull("tpm")
                      .put("stale", false));
      for (String name : List.of("rpm", "tpm")) {
        if (!source.hasNonNull(name)) continue;
        BigDecimal candidate = metric(source.path(name), name);
        if (!row.hasNonNull(name)
            || candidate.compareTo(new BigDecimal(row.path(name).asText())) > 0)
          row.put(name, candidate.toPlainString());
      }
      for (String time : List.of("queriedAt", "dataUpdatedAt", "lastAttemptAt"))
        if (source.hasNonNull(time)
            && source.path(time).asText().compareTo(row.path(time).asText()) > 0)
          row.set(time, source.get(time));
      boolean stale = !eq(source, "state", "READY") || expired(source);
      row.put("stale", row.path("stale").asBoolean() || stale);
    }
    return new ArrayList<>(groups.values());
  }

  private String categoryName(String category) {
    return s.list("category", null).stream()
        .filter(c -> eq(c, "code", category))
        .map(c -> c.path("name").asText(category))
        .findFirst()
        .orElse(category);
  }

  private boolean expired(ObjectNode source) {
    try {
      return Instant.parse(text(source, "queriedAt"))
          .plusSeconds(Math.max(30, source.path("intervalSeconds").asLong(60) * 3))
          .isBefore(Instant.now());
    } catch (Exception e) {
      return true;
    }
  }

  @Scheduled(
      fixedDelayString = "${app.monitoring.poll-ms:2000}",
      initialDelayString = "${app.monitoring.initial-delay-ms:10000}")
  public void collectDue() {
    if (!schedulingEnabled) return;
    int count = 0;
    for (ObjectNode source : s.list("monitoring-source", null)) {
      if (!source.path("enabled").asBoolean()) continue;
      try {
        String last = text(source, "lastAttemptAt");
        if (!last.isBlank()
            && Instant.parse(last)
                .plusSeconds(source.path("intervalSeconds").asLong(60))
                .isAfter(Instant.now())) continue;
      } catch (Exception ignored) {
      }
      try {
        refresh(text(source, "id"), true);
      } catch (ApiException ignored) {
      }
      if (++count >= 20) break;
    }
  }
}
