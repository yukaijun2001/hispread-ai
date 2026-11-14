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
  private final TransactionTemplate tx;
  private final BackgroundResourceJobService remote;

  public SystemJobService(
      Store s,
      PlatformTransactionManager manager,
      BackgroundResourceJobService remote) {
    this.s = s;
    this.tx = new TransactionTemplate(manager);
    this.remote = remote;
  }

  private boolean ready(ObjectNode task) {
    return TaskScope.supported(text(task, "type")) && remote.configured(task);
  }

  public ObjectNode describe(ObjectNode task) {
    ObjectNode out = task.deepCopy();
    boolean ready = ready(task);
    out.put("ready", ready);
    boolean retired = !TaskScope.supported(text(task, "type"));
    out.put("retired", retired);
    if (retired) out.put("enabled", false).putNull("nextRunAt");
    out.put("unavailableReason", retired ? "旧自动任务已停用，仅保留执行历史"
        : ready ? "" : "请配置可读取交付状态的资源上游");
    return out;
  }

  public List<ObjectNode> tasks() {
    return s.list("scheduled-task", null).stream()
        .filter(task -> TaskScope.supported(text(task, "type"))).map(this::describe).toList();
  }

  public List<ObjectNode> historyTasks() {
    return s.list("scheduled-task", null).stream().map(this::describe).toList();
  }

  public ObjectNode update(String key, ObjectNode body) {
    TaskScope.requireSupported(text(s.get("scheduled-task", key, null), "type"));
    return locked(
        key,
        () -> {
          return tx.execute(status -> updateConfig(key, body));
        });
  }

  private ObjectNode updateConfig(String key, ObjectNode body) {
    ObjectNode task = s.get("scheduled-task", key, null), patch = s.object();
    TaskScope.requireSupported(text(task, "type"));
    if (!body.path("version").isIntegralNumber() || !body.path("version").canConvertToLong()
        || body.path("version").asLong() != task.path("version").asLong())
      throw new ApiException(409, "任务配置已变化，请刷新后保存");
    patch.set("version", body.get("version"));
    if (body.has("targetId")) {
      if (!body.path("targetId").isNull() && !body.path("targetId").isTextual())
        throw new ApiException(400, "目标编号须为字符串或null");
      patch.set("targetId", body.get("targetId"));
    }
    if (body.has("intervalMinutes")) {
      if (!body.path("intervalMinutes").isIntegralNumber()
          || !body.path("intervalMinutes").canConvertToInt())
        throw new ApiException(400, "运行周期须为10–1440分钟的整数");
      int interval = body.path("intervalMinutes").asInt();
      if (interval < 10 || interval > 1440) throw new ApiException(400, "运行周期须为10–1440分钟");
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
                  patch.path("intervalMinutes").asLong(Math.max(10, task.path("intervalMinutes").asLong(30))) * 60)
              .toString());
    else patch.putNull("nextRunAt");
    return describe(s.update("scheduled-task", key, null, patch));
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
          // Retired jobs can leave an ACTIVE round behind; explicit cleanup restores every open snapshot.
          return remote.restore(key, false);
        });
  }

  public ObjectNode run(String key, String trigger) {
    TaskScope.requireSupported(text(s.get("scheduled-task", key, null), "type"));
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
            result = remote.sync(task.deepCopy().put("deliveryStatusOnly", true), text(run, "id"));
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
                          .plusSeconds(Math.max(10, current.path("intervalMinutes").asLong(30)) * 60)
                          .toString());
                else taskPatch.putNull("nextRunAt");
                s.update("scheduled-task", key, null, taskPatch);
                return done;
              });
        });
  }

  @Scheduled(fixedDelayString = "${app.jobs.poll-ms:60000}")
  public void tick() {
    for (ObjectNode task : s.list("scheduled-task", null)) {
      if (!TaskScope.supported(text(task, "type")) || !task.path("enabled").asBoolean() || !ready(task)) continue;
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
