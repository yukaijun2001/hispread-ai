package com.hispread.ai;

import static com.hispread.ai.BusinessSupport.*;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.node.*;
import jakarta.servlet.http.HttpServletRequest;
import java.time.*;
import java.time.temporal.ChronoUnit;
import java.util.*;
import org.springframework.stereotype.Service;

@Service
public class OnboardingReportService {
  private static final ZoneId ZONE = ZoneId.of("Asia/Shanghai");
  private static final Set<String> CREATION_TYPES = Set.of("SUBMIT", "DISPATCH", "OAUTH_COMPLETE");
  private static final Set<String> PENDING = Set.of("UNKNOWN", "PENDING", "RUNNING", "SUBMITTING");
  private final Store store;
  private final AccessPolicy access;

  public OnboardingReportService(Store store, AccessPolicy access) {
    this.store = store;
    this.access = access;
  }

  private record Outcome(ObjectNode resource, ObjectNode operation, String state, Instant at) {}

  private LocalDate parseDate(String value) {
    try {
      if (value == null || !value.matches("[0-9]{4}-[0-9]{2}-[0-9]{2}"))
        throw new DateTimeException("Invalid date format");
      if (value.startsWith("0000-")) throw new DateTimeException("Year must be positive");
      return LocalDate.parse(value);
    } catch (DateTimeException invalid) {
      throw new ApiException(400, "请选择有效的统计日期", "INVALID_REPORT_DATE");
    }
  }

  private LocalDate[] period(Map<String, String> query) {
    LocalDate until = parseDate(query.getOrDefault("to", LocalDate.now(ZONE).toString()));
    LocalDate minimum = LocalDate.of(1, 1, 1);
    LocalDate since = query.containsKey("from") ? parseDate(query.get("from"))
        : until.isBefore(minimum.plusDays(29)) ? minimum : until.minusDays(29);
    if (since.isAfter(until) || ChronoUnit.DAYS.between(since, until) > 365)
      throw new ApiException(400, "统计起止日期须顺序有效且不超过366天", "INVALID_REPORT_DATE");
    return new LocalDate[] {since, until};
  }

  private Instant instant(JsonNode record, String field) {
    try {
      return Instant.parse(text(record, field));
    } catch (DateTimeException invalid) {
      return null;
    }
  }

  private boolean ccmax(JsonNode resource) {
    return eq(resource, "resourceType", "CCMAX")
        && text(resource, "upstreamChannelId").isBlank()
        && !eq(resource, "upstreamProtocol", "NEWAPI");
  }

  private boolean creation(JsonNode operation, JsonNode resource) {
    if (!CREATION_TYPES.contains(text(operation, "type"))
        || !eq(operation, "supplierId", text(resource, "supplierId"))
        || operation.path("result").path("existingAccountUpdated").asBoolean()
        || !text(operation.path("oauthBinding"), "accountId").isBlank()) return false;
    String previousAccount = text(operation.path("request").path("input"), "upstreamAccountId");
    return previousAccount.isBlank()
        && text(operation.path("request"), "upstreamAccountId").isBlank()
        && text(operation.path("request"), "accountId").isBlank();
  }

  private List<Outcome> outcomes(Map<String, String> query, HttpServletRequest request) {
    Map<String, ObjectNode> resources = new HashMap<>();
    for (ObjectNode resource : access.visible("resource", request))
      if (ccmax(resource)
          && (query.getOrDefault("supplierId", "").isBlank()
              || eq(resource, "supplierId", query.get("supplierId"))))
        resources.put(text(resource, "id"), resource);
    Map<String, ObjectNode> ledger = new HashMap<>();
    for (ObjectNode entry : store.list("intake-ledger", null))
      if (eq(entry, "state", "SUCCESS")) ledger.put(text(entry, "id"), entry);
    Map<String, Outcome> successful = new HashMap<>(), latest = new HashMap<>();
    for (ObjectNode operation : store.list("resource-operation", null)) {
      String resourceId = text(operation, "resourceId");
      ObjectNode resource = resources.get(resourceId);
      if (resource == null || !creation(operation, resource)) continue;
      String state = text(operation, "state");
      if (state.equals("SUCCESS")) {
        Instant completed = completed(operation, resource, ledger);
        if (completed == null) continue;
        Outcome previous = successful.get(resourceId);
        if (previous == null || completed.isBefore(previous.at()))
          successful.put(resourceId, new Outcome(resource, operation, "SUCCESS", completed));
      } else if (state.equals("FAILED") || PENDING.contains(state)) {
        boolean failed = state.equals("FAILED") || operation.path("creationConfirmedNotCreated").asBoolean();
        Instant at = failed ? instant(operation, "finishedAt") : instant(operation, "createdAt");
        if (at == null) at = instant(operation, "createdAt");
        if (at == null) continue;
        Outcome previous = latest.get(resourceId);
        if (previous == null || at.isAfter(previous.at())
            || at.equals(previous.at()) && text(operation, "id").compareTo(text(previous.operation(), "id")) > 0)
          latest.put(resourceId, new Outcome(resource, operation, failed ? "FAILED" : "PENDING", at));
      }
    }
    successful.forEach(latest::put);
    return new ArrayList<>(latest.values());
  }

  private Instant completed(JsonNode operation, JsonNode resource, Map<String, ObjectNode> ledger) {
    ObjectNode reservation = ledger.get(text(operation, "intakeLedgerId"));
    if (reservation != null && eq(reservation, "resourceId", text(resource, "id"))
        && eq(reservation, "supplierId", text(resource, "supplierId"))) {
      Instant committed = instant(reservation, "completedAt");
      if (committed != null) return committed;
    }
    if (eq(resource, "dispatchState", "SUCCESS")) {
      Instant firstSuccess = instant(resource, "submittedAt");
      if (firstSuccess != null) return firstSuccess;
    }
    return instant(operation, "finishedAt");
  }

  private String plan(JsonNode resource) {
    String plan = text(resource.path("resourceData").path("usage").path("plan"), "tier");
    return plan.isBlank() ? "UNKNOWN" : plan;
  }

  private String state(JsonNode resource) {
    String state = ResourceTelemetry.state(resource);
    return state.isBlank() ? "UNKNOWN" : state;
  }

  private Map<String, ObjectNode> suppliers() {
    Map<String, ObjectNode> result = new HashMap<>();
    for (ObjectNode supplier : store.list("supplier", null)) result.put(text(supplier, "id"), supplier);
    return result;
  }

  private ObjectNode detail(Outcome outcome, Map<String, ObjectNode> suppliers) {
    ObjectNode resource = outcome.resource();
    String owner = text(resource, "supplierId");
    ObjectNode supplier = suppliers.getOrDefault(owner, store.object());
    return store.object()
        .put("resourceId", text(resource, "id"))
        .put("resourceName", text(resource, "name"))
        .put("supplierId", owner)
        .put("supplierName", supplier.path("name").asText(resource.path("supplierName").asText(owner)))
        .put("supplierCode", text(supplier, "code"))
        .put("projectId", text(resource, "projectId"))
        .put("projectName", text(resource, "projectName"))
        .put("operationId", text(outcome.operation(), "id"))
        .put("state", outcome.state())
        .put("at", outcome.at().toString())
        .put("createdDate", outcome.at().atZone(ZONE).toLocalDate().toString())
        .put("operationalState", state(resource))
        .put("resourceType", plan(resource));
  }

  public ObjectNode report(Map<String, String> query, HttpServletRequest request) {
    LocalDate[] period = period(query);
    Map<String, ObjectNode> suppliers = suppliers(), daily = new TreeMap<>(), contributions = new HashMap<>();
    for (LocalDate day = period[0]; !day.isAfter(period[1]); day = day.plusDays(1))
      daily.put(day.toString(), counts(store.object().put("date", day.toString())));
    List<ObjectNode> details = new ArrayList<>();
    ObjectNode summary = counts(store.object());
    for (Outcome outcome : outcomes(query, request)) {
      LocalDate day = outcome.at().atZone(ZONE).toLocalDate();
      if (day.isBefore(period[0]) || day.isAfter(period[1])) continue;
      ObjectNode detail = detail(outcome, suppliers);
      details.add(detail);
      String owner = text(detail, "supplierId");
      ObjectNode contribution = contributions.computeIfAbsent(owner, key -> counts(store.object()
          .put("supplierId", key).put("supplierName", text(detail, "supplierName"))
          .put("supplierCode", text(detail, "supplierCode"))));
      for (ObjectNode target : List.of(summary, daily.get(day.toString()), contribution))
        increment(target, outcome.state());
    }
    details.sort(Comparator.comparing((ObjectNode row) -> text(row, "at")).reversed()
        .thenComparing(row -> text(row, "resourceId")));
    List<ObjectNode> supplierRows = contributions.values().stream()
        .sorted(Comparator.comparingLong((ObjectNode row) -> row.path("success").asLong()).reversed()
            .thenComparing(row -> text(row, "supplierName"))).toList();
    ObjectNode result = store.object().put("from", period[0].toString()).put("to", period[1].toString())
        .put("timezone", ZONE.getId()).put("total", summary.path("success").asLong());
    result.set("summary", summary);
    result.set("daily", store.json.valueToTree(daily.values()));
    result.set("suppliers", store.json.valueToTree(supplierRows));
    result.set("details", store.page(details, integer(query, "page", 1), integer(query, "size", 20)));
    return result;
  }

  private ObjectNode counts(ObjectNode record) {
    return record.put("success", 0).put("failed", 0).put("pending", 0);
  }

  private void increment(ObjectNode record, String state) {
    String field = state.equals("SUCCESS") ? "success" : state.equals("FAILED") ? "failed" : "pending";
    record.put(field, record.path(field).asLong() + 1);
  }

  public ObjectNode legacy(Map<String, String> query, boolean current, HttpServletRequest request) {
    LocalDate[] period = period(query);
    Map<String, ObjectNode> suppliers = suppliers(), grouped = new LinkedHashMap<>();
    for (Outcome outcome : outcomes(query, request)) {
      if (!outcome.state().equals("SUCCESS")) continue;
      ObjectNode resource = outcome.resource();
      LocalDate day = outcome.at().atZone(ZONE).toLocalDate();
      if (current ? resource.path("deleted").asBoolean()
          : day.isBefore(period[0]) || day.isAfter(period[1])) continue;
      ObjectNode item = detail(outcome, suppliers);
      String key = day + ":" + text(item, "supplierId") + ":"
          + text(item, "resourceType") + ":" + text(item, "operationalState");
      ObjectNode row = grouped.computeIfAbsent(key, ignored -> {
        ObjectNode out = item.deepCopy();
        out.remove(List.of("resourceId", "resourceName", "projectId", "projectName", "operationId", "state", "at"));
        return out.put("count", 0);
      });
      row.put("count", row.path("count").asLong() + 1);
    }
    long total = grouped.values().stream().mapToLong(row -> row.path("count").asLong()).sum();
    ObjectNode result = store.object().put("from", period[0].toString()).put("to", period[1].toString()).put("total", total);
    result.set("rows", store.json.valueToTree(grouped.values()));
    return result;
  }

  private int integer(Map<String, String> query, String key, int fallback) {
    try {
      int value = Integer.parseInt(query.getOrDefault(key, Integer.toString(fallback)));
      if (value < 1 || key.equals("size") && value > 100 || key.equals("page") && value > 1000000)
        throw new NumberFormatException();
      return value;
    } catch (NumberFormatException invalid) {
      throw new ApiException(400, "分页参数无效");
    }
  }
}
