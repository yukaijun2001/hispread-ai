package com.hispread.ai;

import static com.hispread.ai.BusinessSupport.*;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Instant;
import java.util.List;
import java.util.Set;

/** Read-only calculations over the same persisted telemetry displayed in resource details. */
final class ResourceTelemetry {
  private ResourceTelemetry() {}

  static BigDecimal percent(JsonNode resource, String window) {
    JsonNode value = resource.path("resourceData").path("usage").path(window + "Percent");
    if (!value.isNumber()) return null;
    try {
      BigDecimal number = new BigDecimal(value.asText());
      return number.signum() >= 0 && number.compareTo(BigDecimal.valueOf(100)) <= 0
          ? number : null;
    } catch (NumberFormatException invalid) {
      return null;
    }
  }

  static boolean matches(JsonNode resource, String status) {
    if (status.isBlank()) return true;
    if (status.equals("ALL")) return delivered(resource);
    if (Set.of("FIVE_HOUR_EXHAUSTED", "SEVEN_DAY_EXHAUSTED").contains(status)) {
      BigDecimal value = percent(resource, status.equals("FIVE_HOUR_EXHAUSTED") ? "fiveHour" : "sevenDay");
      return delivered(resource) && !state(resource).equals("GONE")
          && value != null && value.compareTo(BigDecimal.valueOf(100)) >= 0;
    }
    if (status.equals("UNKNOWN"))
      return delivered(resource) && !Set.of("READY", "ACTIVE", "PROVISIONING", "INVALID", "DEAD", "COOLING", "RATE_LIMITED",
          "GONE", "DRAINING", "PAUSED", "MISSING_USAGE").contains(state(resource));
    if (status.equals("COOLING") || status.equals("RATE_LIMITED"))
      return Set.of("COOLING", "RATE_LIMITED").contains(state(resource));
    return status.equals(state(resource));
  }

  static String state(JsonNode resource) {
    String state = text(resource, "operationalState");
    return state.isBlank() ? text(resource, "operationalStatus") : state;
  }

  static boolean matchesFailure(JsonNode resource, String reason) {
    if (reason == null || reason.isBlank()) return true;
    String actual = text(resource, "dispatchFailureReason");
    if (actual.isBlank()) actual = text(resource.path("resourceData").path("health"), "credentialFailureReason");
    return reason.equals(actual);
  }

  private static boolean delivered(JsonNode resource) {
    return eq(resource, "state", "DELIVERED") && eq(resource, "dispatchState", "SUCCESS");
  }

  static ObjectNode quota(Store store, List<ObjectNode> resources, String window) {
    int reported = 0, missing = 0, exhausted = 0;
    BigDecimal sum = BigDecimal.ZERO, remaining = BigDecimal.ZERO;
    Instant next = null;
    for (JsonNode resource : resources) {
      if (state(resource).equals("GONE")) continue;
      BigDecimal value = percent(resource, window);
      if (value == null) { missing++; continue; }
      reported++;
      sum = sum.add(value);
      remaining = remaining.add(BigDecimal.valueOf(100).subtract(value));
      if (value.compareTo(BigDecimal.valueOf(100)) >= 0) exhausted++;
      try {
        Instant reset = Instant.parse(text(resource.path("resourceData").path("usage"), window + "ResetsAt"));
        if (next == null || reset.isBefore(next)) next = reset;
      } catch (java.time.format.DateTimeParseException ignored) { }
    }
    ObjectNode out = store.object().put("reportedCount", reported).put("missingCount", missing)
        .put("exhaustedCount", exhausted);
    if (reported == 0) out.putNull("averageUsedPercent").putNull("remainingEquivalent");
    else out.put("averageUsedPercent", sum.divide(BigDecimal.valueOf(reported), 6, RoundingMode.HALF_UP))
        .put("remainingEquivalent", remaining.movePointLeft(2));
    if (next == null) out.putNull("nextResetAt"); else out.put("nextResetAt", next.toString());
    return out;
  }

  static ObjectNode daily(Store store, List<ObjectNode> resources) {
    BigDecimal sum = BigDecimal.ZERO;
    int count = 0;
    for (JsonNode resource : resources) {
      JsonNode snapshot = resource.path("dailyConsumption");
      if (!eq(snapshot, "businessDate", today()) || !eq(snapshot, "currency", "USD")) continue;
      try {
        BigDecimal amount = new BigDecimal(text(snapshot, "amount"));
        if (amount.signum() < 0 || amount.precision() > 32 || Math.abs((long) amount.scale()) > 12) continue;
        sum = sum.add(amount);
        count++;
      } catch (NumberFormatException invalid) { }
    }
    ObjectNode out = store.object().put("businessDate", today()).put("reportedResourceCount", count);
    if (count == 0) out.putNull("amount"); else out.put("amount", sum.toPlainString());
    return out;
  }
}
