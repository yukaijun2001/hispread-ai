package com.hispread.ai;

import static com.hispread.ai.BusinessSupport.*;

import com.fasterxml.jackson.databind.node.*;
import java.sql.*;
import java.time.*;
import java.util.*;
import java.util.function.Supplier;
import org.springframework.context.annotation.Configuration;
import org.springframework.scheduling.annotation.EnableScheduling;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.support.TransactionTemplate;

/** Persisted execution with a session lock held across durable remote-operation phases. */
@Service
public class SystemJobService {
  private final Store s;
  private final FinancialWorkflowService finance;
  private final QuotePricingService pricing;
  private final TransactionTemplate tx;
  private final BackgroundResourceJobService remote;
  private final WecomReminderService wecom;

  public SystemJobService(
      Store s,
      FinancialWorkflowService finance,
      QuotePricingService pricing,
      PlatformTransactionManager manager,
      BackgroundResourceJobService remote,
      WecomReminderService wecom) {
    this.s = s;
    this.finance = finance;
    this.pricing = pricing;
    this.tx = new TransactionTemplate(manager);
    this.remote = remote;
    this.wecom = wecom;
  }

  private boolean local(ObjectNode task) {
    return Set.of("SETTLEMENT_AUTO_CONFIRM", "SETTLEMENT_DEADLINE_CONFIRM")
            .contains(text(task, "type"))
        || eq(task, "type", "QUOTE_AUTO_RENEWAL") && renewalConfigured(task);
  }

  private boolean renewalConfigured(ObjectNode task) {
    return task.path("autoRenewEnabled").asBoolean()
        && task.path("renewalDays").isIntegralNumber()
        && task.path("renewalDays").canConvertToInt()
        && task.path("renewalDays").asInt() >= 1
        && task.path("renewalDays").asInt() <= 365
        && task.path("renewBeforeDays").isIntegralNumber()
        && task.path("renewBeforeDays").canConvertToInt()
        && task.path("renewBeforeDays").asInt() >= 0
        && task.path("renewBeforeDays").asInt() <= 30
        && task.path("quoteIds").isArray()
        && !task.path("quoteIds").isEmpty();
  }

  private boolean ready(ObjectNode task) {
    return local(task)
        || switch (text(task, "type")) {
          case "CCMAX_DAILY_SYNC", "CCMAX_STATUS_SYNC", "CCMAX_PRIORITY_ROTATION" ->
              remote.configured(task);
          case "WORKBENCH_WECOM_REMINDER" -> wecom.configured();
          default -> false;
        };
  }

  public ObjectNode describe(ObjectNode task) {
    ObjectNode out = task.deepCopy();
    boolean ready = ready(task);
    out.put("ready", ready);
    out.put(
        "unavailableReason",
        ready
            ? ""
            : text(task, "type").equals("QUOTE_AUTO_RENEWAL")
                ? "报价自动续期的延长期与冲突规则尚未配置"
                : text(task, "type").equals("WORKBENCH_WECOM_REMINDER")
                    ? "请配置企业微信机器人与服务端加密密钥"
                    : "请配置支持该任务的CCMAX原生或CUSTOM资源上游与有效任务规则");
    return out;
  }

  public List<ObjectNode> tasks() {
    ensureDeadline();
    return s.list("scheduled-task", null).stream().map(this::describe).toList();
  }

  private synchronized void ensureDeadline() {
    if (s.list("scheduled-task", null).stream()
        .noneMatch(t -> eq(t, "key", "SETTLEMENT_AUTO_CONFIRM"))) {
      s.seed(
          "scheduled-task",
          "GLOBAL",
          s.object()
              .put("id", "SETTLEMENT_AUTO_CONFIRM")
              .put("key", "SETTLEMENT_AUTO_CONFIRM")
              .put("type", "SETTLEMENT_AUTO_CONFIRM")
              .put("name", "结算截止自动确认")
              .put("intervalMinutes", 1)
              .put("enabled", false)
              .put("running", false)
              .put("ready", true));
    }
  }

  public ObjectNode update(String key, ObjectNode body) {
    return locked(
        key,
        () -> {
          ObjectNode saved = tx.execute(status -> updateConfig(key, body));
          if (!saved.path("enabled").asBoolean() && eq(saved, "type", "CCMAX_PRIORITY_ROTATION"))
            remote.restore(key, false);
          return describe(s.get("scheduled-task", key, null));
        });
  }

  private ObjectNode updateConfig(String key, ObjectNode body) {
    ObjectNode task = s.get("scheduled-task", key, null), patch = s.object();
    if (body.has("version")) {
      if (!body.path("version").isIntegralNumber()
          || !body.path("version").canConvertToLong()
          || body.path("version").asLong() < 0)
        throw new ApiException(409, "任务配置已变化");
      patch.set("version", body.get("version"));
    }
    if (eq(task, "type", "QUOTE_AUTO_RENEWAL")) {
      if (body.has("autoRenewEnabled") && !body.path("autoRenewEnabled").isBoolean())
        throw new ApiException(400, "续期规则开关须为布尔值");
      for (String field :
          List.of("autoRenewEnabled", "renewalDays", "renewBeforeDays", "requestKey"))
        if (body.has(field)) patch.set(field, body.get(field));
      if (body.has("renewalDays")
              && (!body.path("renewalDays").isIntegralNumber()
                  || !body.path("renewalDays").canConvertToInt()
                  || body.path("renewalDays").asInt() < 1 || body.path("renewalDays").asInt() > 365)
          || body.has("renewBeforeDays")
              && (!body.path("renewBeforeDays").isIntegralNumber()
                  || !body.path("renewBeforeDays").canConvertToInt()
                  || body.path("renewBeforeDays").asInt(-1) < 0
                  || body.path("renewBeforeDays").asInt() > 30))
        throw new ApiException(400, "续期天数须1–365天，提前天数须0–30天");
      if (body.has("quoteIds")
          && (!body.path("version").isIntegralNumber()
              || body.path("version").asLong() != task.path("version").asLong()))
        throw new ApiException(409, "任务配置已变化");
      if (body.has("quoteIds")) {
        if (!body.path("quoteIds").isArray() || body.path("quoteIds").size() > 500)
          throw new ApiException(400, "quoteIds须为最多500项的数组");
        Set<String> selected = new HashSet<>();
        for (var id : body.path("quoteIds")) {
          if (!id.isTextual() || id.asText().isBlank() || !selected.add(id.asText()))
            throw new ApiException(400, "报价编号须为不重复的非空字符串");
          if (!eq(s.get("quote", id.asText(), null), "state", "APPROVED"))
            throw new ApiException(400, "只能为已通过报价配置自动续期");
        }
        patch.set("quoteIds", body.path("quoteIds"));
        ObjectNode candidate = task.deepCopy();
        candidate.setAll(patch);
        if (candidate.path("autoRenewEnabled").asBoolean() && !renewalConfigured(candidate))
          throw new ApiException(400, "启用续期规则须选择至少一条报价并填写有效天数");
        for (var id : task.path("quoteIds")) {
          if (selected.contains(id.asText())) continue;
          for (ObjectNode quote : s.list("quote", null))
            if (eq(quote, "id", id.asText()))
              s.update("quote", id.asText(), text(quote, "supplierId"),
                  s.object().put("version", quote.path("version").asLong()).put("autoRenewEnabled", false));
        }
        for (var id : body.path("quoteIds")) {
          ObjectNode quote = s.get("quote", id.asText(), null);
          String owner = text(quote, "supplierId");
          s.update(
              "quote",
              id.asText(),
              owner,
              s.object()
                  .put("version", quote.path("version").asLong())
                  .put(
                      "autoRenewEnabled",
                      body.path("autoRenewEnabled")
                          .asBoolean(task.path("autoRenewEnabled").asBoolean())));
        }
      }
      ObjectNode candidate = task.deepCopy();
      candidate.setAll(patch);
      if (body.path("autoRenewEnabled").asBoolean() && !renewalConfigured(candidate))
        throw new ApiException(400, "启用续期规则须选择至少一条报价并填写有效天数");
    }
    if (body.has("targetId")) {
      if (!body.path("targetId").isNull() && !body.path("targetId").isTextual())
        throw new ApiException(400, "目标编号须为字符串或null");
      patch.set("targetId", body.get("targetId"));
    }
    if (body.has("intervalMinutes")) {
      if (!body.path("intervalMinutes").isIntegralNumber()
          || !body.path("intervalMinutes").canConvertToInt())
        throw new ApiException(400, "运行周期须为1–1440分钟的整数");
      int interval = body.path("intervalMinutes").asInt();
      if (interval < 1 || interval > 1440) throw new ApiException(400, "运行周期须为1–1440分钟");
      patch.put("intervalMinutes", interval);
    }
    if (body.has("name")) {
      required(body, "name");
      if (text(body, "name").length() > 160) throw new ApiException(400, "任务名称过长");
      patch.put("name", text(body, "name"));
    }
    if (body.has("enabled")) {
      if (!body.path("enabled").isBoolean()) throw new ApiException(400, "任务开关须为布尔值");
      ObjectNode candidate = task.deepCopy();
      candidate.setAll(patch);
      if (body.path("enabled").asBoolean() && !ready(candidate))
        throw new ApiException(503, describe(candidate).path("unavailableReason").asText());
      patch.put("enabled", body.path("enabled").asBoolean());
    }
    boolean enabled = patch.path("enabled").asBoolean(task.path("enabled").asBoolean());
    if (enabled)
      patch.put(
          "nextRunAt",
          Instant.now()
              .plusSeconds(
                  patch.path("intervalMinutes").asLong(task.path("intervalMinutes").asLong(1)) * 60)
              .toString());
    else patch.putNull("nextRunAt");
    return s.update("scheduled-task", key, null, patch);
  }

  private <T> T locked(String key, Supplier<T> action) {
    // The session lock survives commits of run/rotation snapshots and releases on crash.
    String lockKey =
        eq(s.get("scheduled-task", key, null), "type", "CCMAX_PRIORITY_ROTATION")
            ? "system-priority-rotation"
            : "system-job:" + key;
    try (Connection connection = Objects.requireNonNull(s.jdbc.getDataSource()).getConnection()) {
      boolean acquired;
      try (PreparedStatement p =
          connection.prepareStatement("select pg_try_advisory_lock(hashtextextended(?,0))")) {
        p.setString(1, lockKey);
        try (ResultSet result = p.executeQuery()) {
          result.next();
          acquired = result.getBoolean(1);
        }
      }
      if (!acquired) throw new ApiException(409, "任务正在执行，请等待本轮完成", "JOB_ALREADY_RUNNING");
      try {
        return action.get();
      } finally {
        try (PreparedStatement p =
            connection.prepareStatement("select pg_advisory_unlock(hashtextextended(?,0))")) {
          p.setString(1, lockKey);
          p.execute();
        }
      }
    } catch (SQLException error) {
      throw new ApiException(503, "任务执行锁暂不可用", "JOB_LOCK_UNAVAILABLE");
    }
  }

  public ObjectNode retryRestore(String key) {
    return locked(
        key,
        () -> {
          ObjectNode task = s.get("scheduled-task", key, null);
          if (!eq(task, "type", "CCMAX_PRIORITY_ROTATION"))
            throw new ApiException(400, "此任务不支持优先级恢复");
          return remote.restore(key, true);
        });
  }

  public ObjectNode run(String key, String trigger) {
    return locked(
        key,
        () -> {
          ObjectNode task = s.get("scheduled-task", key, null);
          if ("SCHEDULE".equals(trigger)) {
            if (!task.path("enabled").asBoolean())
              return s.object().put("state", "SKIPPED").put("resultCode", "TASK_DISABLED");
            try {
              if (!text(task, "nextRunAt").isBlank()
                  && Instant.parse(text(task, "nextRunAt")).isAfter(Instant.now()))
                return s.object().put("state", "SKIPPED").put("resultCode", "TASK_NOT_DUE");
            } catch (DateTimeException error) {
              throw new ApiException(409, "任务调度时间无效，请重新保存周期");
            }
          }
          if (!ready(task))
            throw new ApiException(503, describe(task).path("unavailableReason").asText());
          String now = Instant.now().toString();
          ObjectNode run =
              tx.execute(
                  status -> {
                    for (ObjectNode stale : s.list("scheduled-run", null))
                      if (eq(stale, "taskKey", key) && eq(stale, "state", "RUNNING"))
                        s.update(
                            "scheduled-run",
                            text(stale, "id"),
                            null,
                            s.object()
                                .put("state", "TIMED_OUT")
                                .put("resultCode", "LEASE_LOST")
                                .put("finishedAt", now));
                    s.update("scheduled-task", key, null, s.object().put("running", true));
                    return s.create(
                        "scheduled-run",
                        "GLOBAL",
                        s.object()
                            .put("taskKey", key)
                            .put("taskType", text(task, "type"))
                            .put("triggerKind", trigger)
                            .put("state", "RUNNING")
                            .put("startedAt", now));
                  });
          ObjectNode result;
          String state = "SUCCESS";
          try {
            if (local(task)) {
              int count =
                  tx.execute(
                      status ->
                          eq(task, "type", "QUOTE_AUTO_RENEWAL")
                              ? renewQuotes(task)
                              : finance.confirmOverdue());
              result =
                  s.object()
                      .put("processedCount", count)
                      .put(
                          "resultCode",
                          (eq(task, "type", "QUOTE_AUTO_RENEWAL")
                                  ? "QUOTE_RENEWAL_PENDING:"
                                  : "SETTLEMENT_AUTO_CONFIRMED:")
                              + count);
            } else if (eq(task, "type", "WORKBENCH_WECOM_REMINDER")) result = wecom.send(task);
            else if (eq(task, "type", "CCMAX_PRIORITY_ROTATION"))
              result = remote.rotate(task, text(run, "id"));
            else result = remote.sync(task, text(run, "id"));
          } catch (RuntimeException error) {
            state = "FAILED";
            result =
                s.object()
                    .put("processedCount", 0)
                    .put(
                        "resultCode",
                        error instanceof ApiException a
                            ? Objects.toString(a.code, "JOB_FAILED")
                            : "JOB_FAILED")
                    .put(
                        "message",
                        error instanceof ApiException ? error.getMessage() : "任务执行异常，请检查服务端日志");
          }
          ObjectNode patch =
              result.deepCopy().put("state", state).put("finishedAt", Instant.now().toString());
          return tx.execute(
              status -> {
                ObjectNode done = s.update("scheduled-run", text(run, "id"), null, patch);
                ObjectNode current = s.get("scheduled-task", key, null);
                ObjectNode taskPatch =
                    s.object()
                        .put("running", false)
                        .put("lastRunAt", now)
                        .put("lastState", text(done, "state"))
                        .put("lastResultCode", text(done, "resultCode"));
                if (current.path("enabled").asBoolean())
                  taskPatch.put(
                      "nextRunAt",
                      Instant.now()
                          .plusSeconds(current.path("intervalMinutes").asLong(1) * 60)
                          .toString());
                else taskPatch.putNull("nextRunAt");
                s.update("scheduled-task", key, null, taskPatch);
                return done;
              });
        });
  }

  /** Local opt-in policy, deliberately generates a new pending quotation, never approval. */
  private int renewQuotes(ObjectNode task) {
    LocalDate today = LocalDate.now(ZoneId.of("Asia/Shanghai"));
    int generated = 0;
    Set<String> selected = new HashSet<>();
    for (var id : task.path("quoteIds")) selected.add(id.asText());
    if (selected.isEmpty()) return 0;
    for (ObjectNode quote : s.list("quote", null)) {
      String id = text(quote, "id");
      if (!eq(quote, "state", "APPROVED")
          || !quote.path("autoRenewEnabled").asBoolean()
          || !selected.contains(id)) continue;
      String owner = text(quote, "supplierId"), project = text(quote, "projectId");
      ObjectNode supplier;
      try {
        supplier = s.get("supplier", owner, null);
        if (!supplier.path("enabled").asBoolean(true)
            || !eq(supplier, "state", "APPROVED")
            || !s.get("project", project, null).path("enabled").asBoolean()) continue;
      } catch (ApiException ignored) {
        continue;
      }
      LocalDate end;
      try {
        end = LocalDate.parse(text(quote, "effectiveTo"));
      } catch (DateTimeException ignored) {
        continue;
      }
      if (end.isBefore(today) || end.isAfter(today.plusDays(task.path("renewBeforeDays").asInt())))
        continue;
      LocalDate from = end.plusDays(1), to = from.plusDays(task.path("renewalDays").asInt() - 1);
      ObjectNode priced = pricing.at(quote, from);
      String renewalKey = id + ":" + from + ":" + to;
      boolean exists =
          s.list("quote", owner).stream()
              .anyMatch(
                  q ->
                      eq(q, "renewalKey", renewalKey)
                          || eq(q, "projectId", project)
                              && Set.of("PENDING", "APPROVED").contains(text(q, "state"))
                              && text(q, "effectiveFrom").compareTo(to.toString()) <= 0
                              && text(q, "effectiveTo").compareTo(from.toString()) >= 0);
      if (exists) continue;
      ObjectNode next = s.object();
      for (String f :
          List.of(
              "supplierId",
              "supplierName",
              "projectId",
              "projectName",
              "projectCode",
              "currency",
              "pricingType",
              "multiplier",
              "unitPrice",
              "taxInclusive",
              "serviceCapacityNote",
              "accountCount",
              "accountQuota",
              "rpm",
              "tpm",
              "settlementMethod",
              "deliveryMethod",
              "unit",
              "capacityType",
              "capacityScope",
              "capacityPeriod",
              "capacityCurrency")) if (priced.has(f)) next.set(f, priced.get(f));
      next.put("state", "PENDING")
          .put("effectiveFrom", from.toString())
          .put("effectiveTo", to.toString())
          .put("submittedBy", "SYSTEM_QUOTE_RENEWAL")
          .put("createdBy", "SYSTEM_QUOTE_RENEWAL")
          .put("submittedAt", Instant.now().toString())
          .put("renewedFrom", id)
          .put("renewalKey", renewalKey)
          .put("autoRenewEnabled", false)
          .put("code", "Q-RENEW-" + UUID.randomUUID().toString().substring(0, 8));
      ObjectNode snapshot = s.object();
      for (String f :
          List.of(
              "pricingType",
              "multiplier",
              "unitPrice",
              "currency",
              "taxInclusive",
              "accountCount",
              "accountQuota",
              "rpm",
              "tpm")) if (priced.has(f)) snapshot.set(f, priced.get(f));
      next.set("priceSnapshot", snapshot);
      next.putArray("priceHistory");
      next.putArray("renewalHistory");
      ObjectNode created = s.create("quote", owner, next);
      ArrayNode history =
          quote.path("renewalHistory").isArray()
              ? (ArrayNode) quote.path("renewalHistory").deepCopy()
              : s.json.createArrayNode();
      history.add(
          s.object()
              .put("id", UUID.randomUUID().toString())
              .put("kind", "AUTO_PENDING")
              .put("actorName", "系统续期申请（待审核）")
              .put("actorId", "SYSTEM_QUOTE_RENEWAL")
              .put("previousFrom", text(quote, "effectiveFrom"))
              .put("previousTo", text(quote, "effectiveTo"))
              .put("effectiveFrom", from.toString())
              .put("effectiveTo", to.toString())
              .put("pendingQuoteId", text(created, "id"))
              .put("occurredAt", Instant.now().toString()));
      s.update(
          "quote",
          id,
          owner,
          s.object().put("version", quote.path("version").asLong()).set("renewalHistory", history));
      generated++;
    }
    return generated;
  }

  @Scheduled(fixedDelayString = "${app.jobs.poll-ms:15000}")
  public void tick() {
    for (ObjectNode task : s.list("scheduled-task", null)) {
      if (!task.path("enabled").asBoolean() || !ready(task)) continue;
      String next = text(task, "nextRunAt");
      try {
        if (next.isBlank() || !Instant.parse(next).isAfter(Instant.now()))
          run(text(task, "key"), "SCHEDULE");
      } catch (RuntimeException ignored) {
        /* failed execution remains visible in its run record */
      }
    }
  }
}

@Configuration
@EnableScheduling
class SystemSchedulingConfiguration {}
