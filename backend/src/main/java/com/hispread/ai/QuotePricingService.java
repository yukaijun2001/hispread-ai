package com.hispread.ai;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import java.math.BigDecimal;
import java.time.*;
import java.util.*;
import org.springframework.stereotype.Service;

@Service
public class QuotePricingService {
  private final Store store;

  public QuotePricingService(Store store) {
    this.store = store;
  }

  public LocalDate date(String value) {
    try {
      return value == null || value.isBlank()
          ? LocalDate.now(ZoneId.of("Asia/Shanghai"))
          : LocalDate.parse(value);
    } catch (DateTimeException e) {
      throw new ApiException(400, "报价日期格式不正确");
    }
  }

  public ObjectNode at(ObjectNode original, LocalDate date) {
    ObjectNode out = original.deepCopy();
    if (!original.path("state").asText().equals("APPROVED")) return out;
    String field =
        original.path("pricingType").asText().equals("FIXED") ? "unitPrice" : "multiplier";
    Instant target = date.atTime(LocalTime.MAX).atZone(ZoneId.of("Asia/Shanghai")).toInstant();
    if (date.equals(LocalDate.now(ZoneId.of("Asia/Shanghai")))) target = Instant.now();
    JsonNode selected = null;
    Instant best = Instant.MIN;
    String approved = "";
    for (JsonNode h : original.path("priceHistory")) {
      try {
        Instant effective = Instant.parse(h.path("effectiveAt").asText());
        String approval = h.path("approvedAt").asText();
        if (h.hasNonNull(field)
            && !effective.isAfter(target)
            && (effective.isAfter(best)
                || effective.equals(best) && approval.compareTo(approved) >= 0)) {
          selected = h;
          best = effective;
          approved = approval;
        }
      } catch (DateTimeException ignored) {
      }
    }
    if (selected != null) out.set(field, selected.path(field));
    else if (original.path("priceHistory").isArray() && !original.path("priceHistory").isEmpty()) {
      JsonNode first = original.path("priceHistory").get(0);
      if (first.hasNonNull(field)) out.set(field, first.path(field));
    }
    out.remove("upcomingPrice");
    Instant future = Instant.MAX;
    JsonNode upcoming = null;
    for (JsonNode h : original.path("priceHistory")) {
      try {
        Instant effective = Instant.parse(h.path("effectiveAt").asText());
        if (h.hasNonNull(field) && effective.isAfter(target) && effective.isBefore(future)) {
          future = effective;
          upcoming = h;
        }
      } catch (DateTimeException ignored) {
      }
    }
    if (upcoming != null) {
      ObjectNode next =
          store
              .object()
              .put(
                  "effectiveFrom",
                  future.atZone(ZoneId.of("Asia/Shanghai")).toLocalDate().toString());
      next.set(field, upcoming.path(field));
      out.set("upcomingPrice", next);
    }
    if (field.equals("multiplier") && out.hasNonNull(field)) {
      try {
        out.put(
            "ratePercent",
            new BigDecimal(out.path(field).asText())
                .movePointRight(2)
                .stripTrailingZeros()
                .toPlainString());
      } catch (NumberFormatException ignored) {
      }
    }
    return out;
  }

  public List<ObjectNode> rank(List<ObjectNode> rows, String sortBy, String direction) {
    String key =
        switch (sortBy) {
          case "ACCOUNT_COUNT" -> "accountCount";
          case "ACCOUNT_QUOTA" -> "accountQuota";
          case "RPM" -> "rpm";
          case "TPM" -> "tpm";
          case "PRICE" -> "PRICE";
          default -> throw new ApiException(400, "不支持的报价排序字段");
        };
    if (!Set.of("ASC", "DESC").contains(direction)) throw new ApiException(400, "排序方向无效");
    Comparator<ObjectNode> cmp =
        (x, y) -> {
          BigDecimal a = value(x, key), b = value(y, key);
          if (a == null && b == null) return 0;
          if (a == null) return 1;
          if (b == null) return -1;
          return direction.equals("DESC") ? b.compareTo(a) : a.compareTo(b);
        };
    List<ObjectNode> sorted = new ArrayList<>(rows);
    sorted.sort(
        cmp.thenComparing(x -> x.path("supplierName").asText())
            .thenComparing(x -> x.path("id").asText()));
    for (int i = 0; i < sorted.size(); i++) sorted.get(i).put("rank", i + 1);
    return sorted;
  }

  private BigDecimal value(ObjectNode row, String key) {
    String field =
        key.equals("PRICE")
            ? (row.path("pricingType").asText().equals("FIXED") ? "unitPrice" : "multiplier")
            : key;
    try {
      return row.hasNonNull(field) ? new BigDecimal(row.path(field).asText()) : null;
    } catch (NumberFormatException e) {
      return null;
    }
  }
}
