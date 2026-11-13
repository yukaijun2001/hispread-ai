package com.hispread.ai;

import static com.hispread.ai.BusinessSupport.*;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import java.util.List;
import java.util.Set;
import org.springframework.stereotype.Service;

/** Admission is checked inside the transaction that commits a native OAuth creation intent. */
@Service
public class CcmaxIntakeControls {
  private final Store store;

  public CcmaxIntakeControls(Store store) { this.store = store; }

  private ObjectNode settings() {
    List<ObjectNode> rows = store.list("settings", null);
    return rows.isEmpty() ? store.object() : rows.get(0);
  }

  int admit(String owner) {
    store.jdbc.queryForObject("select pg_advisory_xact_lock(hashtext(?),hashtext(?))",
        (row, index) -> true, "ccmax-intake-admission", owner);
    ObjectNode settings = settings();
    int limit = integer(settings.path("ccmaxIntakeConcurrencyLimit"), 1, 1000, 10);
    long outstanding = store.list("resource-operation", owner).stream()
        .filter(op -> eq(op, "protocol", "CCMAX_NATIVE")
            && (eq(op, "type", "OAUTH_COMPLETE") || op.path("creationTimeoutSeconds").asInt() > 0)
            && Set.of("UNKNOWN", "PENDING", "RUNNING", "SUBMITTING").contains(text(op, "state")))
        .filter(op -> !op.path("creationConfirmedNotCreated").asBoolean())
        .filter(op -> !op.has("oauthBinding") || text(op.path("oauthBinding"), "accountId").isBlank())
        .map(op -> text(op, "resourceId")).distinct().count();
    if (outstanding >= limit)
      throw new ApiException(409, "该供应商上号并发已满，待核对的创建也占用名额，请先查询原操作",
          "CCMAX_INTAKE_CONCURRENCY_LIMIT");
    return integer(settings.path("ccmaxCreationTimeoutSeconds"), 1, 300, 120);
  }

  private int integer(JsonNode value, int min, int max, int fallback) {
    return value.isIntegralNumber() && value.canConvertToInt() && value.asInt() >= min && value.asInt() <= max
        ? value.asInt() : fallback;
  }
}
