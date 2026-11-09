package com.hispread.ai;

import static com.hispread.ai.BusinessSupport.*;

import com.fasterxml.jackson.databind.node.ObjectNode;
import java.math.BigDecimal;
import java.time.*;
import java.util.*;
import org.springframework.stereotype.Service;

@Service
public class FinancialReportService {
  private final Store store;
  private final BusinessSupport support;

  public FinancialReportService(Store store, BusinessSupport support) {
    this.store = store;
    this.support = support;
  }

  private List<ObjectNode> rows(Map<String, String> q) {
    String month = q.getOrDefault("month", YearMonth.now(ZoneId.of("Asia/Shanghai")).toString());
    try {
      YearMonth.parse(month);
    } catch (DateTimeException e) {
      throw new ApiException(400, "月份格式不正确");
    }
    return store.list("settlement", null).stream()
        .filter(
            s ->
                eq(s, "state", "CONFIRMED")
                    && confirmedMonth(s).equals(month)
                    && support.match(s, q, "currency", "currency"))
        .map(
            s -> {
              ObjectNode d = s.deepCopy();
              String owner = text(s, "ownerUserId");
              if (!s.has("ownerUserId")) {
                try {
                  ObjectNode supplier = store.get("supplier", text(s, "supplierId"), null);
                  owner = text(supplier, "ownerUserId");
                } catch (ApiException ignored) {
                }
              }
              d.put("ownerUserId", owner);
              String name = "未归属";
              if (!owner.isBlank()) {
                List<String> names =
                    store.jdbc.query(
                        "select profile->>'displayName' from hub_user where id=?",
                        (r, n) -> r.getString(1),
                        owner);
                if (!names.isEmpty()) name = names.get(0);
              }
              d.put("ownerName", name);
              return d;
            })
        .filter(
            s -> {
              String owner = q.getOrDefault("owner", "");
              return owner.isBlank()
                  || owner.equals("UNASSIGNED") && text(s, "ownerUserId").isBlank()
                  || owner.equals(text(s, "ownerUserId"));
            })
        .toList();
  }

  private String confirmedMonth(ObjectNode settlement) {
    try {
      return YearMonth.from(
              Instant.parse(text(settlement, "confirmedAt")).atZone(ZoneId.of("Asia/Shanghai")))
          .toString();
    } catch (DateTimeException e) {
      return "";
    }
  }

  public ObjectNode operatorKpi(Map<String, String> q) {
    Map<String, List<ObjectNode>> grouped = new LinkedHashMap<>();
    for (ObjectNode row : rows(q))
      grouped
          .computeIfAbsent(
              text(row, "ownerUserId") + ":" + text(row, "currency"), k -> new ArrayList<>())
          .add(row);
    List<ObjectNode> result = new ArrayList<>();
    grouped.forEach(
        (key, items) -> {
          ObjectNode first = items.get(0),
              d =
                  store
                      .object()
                      .put("id", key)
                      .put("ownerUserId", text(first, "ownerUserId"))
                      .put("ownerName", text(first, "ownerName"))
                      .put("currency", text(first, "currency"))
                      .put(
                          "supplierCount",
                          items.stream().map(x -> text(x, "supplierId")).distinct().count())
                      .put("settlementCount", items.size())
                      .put(
                          "total",
                          items.stream()
                              .map(x -> amount(x, "total"))
                              .reduce(BigDecimal.ZERO, BigDecimal::add)
                              .toPlainString());
          result.add(d);
        });
    result.sort(Comparator.comparing(x -> x.path("ownerName").asText()));
    return support.page(result, q);
  }

  public ObjectNode operatorKpiLines(Map<String, String> q) {
    String owner = q.getOrDefault("ownerUserId", "");
    boolean unassigned = Boolean.parseBoolean(q.getOrDefault("unassigned", "false"));
    List<ObjectNode> result =
        rows(q).stream()
            .filter(
                x ->
                    unassigned
                        ? text(x, "ownerUserId").isBlank()
                        : owner.equals(text(x, "ownerUserId")))
            .filter(x -> support.contains(x, q.get("search"), "code", "supplierName"))
            .map(
                row -> {
                  ObjectNode d = store.object();
                  for (String k :
                      List.of(
                          "id",
                          "code",
                          "supplierId",
                          "supplierName",
                          "confirmedAt",
                          "currency",
                          "total",
                          "ownerUserId",
                          "ownerName")) d.set(k, row.path(k));
                  return d;
                })
            .toList();
    return support.page(result, q);
  }
}
