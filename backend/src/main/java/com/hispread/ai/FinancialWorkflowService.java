package com.hispread.ai;

import com.fasterxml.jackson.databind.node.ObjectNode;
import java.time.*;
import java.util.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class FinancialWorkflowService {
  private final Store store;

  public FinancialWorkflowService(Store store) {
    this.store = store;
  }

  @Transactional
  public int confirmOverdue() {
    int count = 0;
    for (ObjectNode original : store.list("settlement", null)) {
      if (!original.path("state").asText().equals("PENDING")
          || original.path("sourceChanged").asBoolean()) continue;
      String deadline = original.path("confirmationDeadline").asText();
      try {
        if (Instant.parse(deadline).isAfter(Instant.now())) continue;
      } catch (DateTimeException e) {
        continue;
      }
      String id = original.path("id").asText();
      store.jdbc.queryForObject(
          "select pg_advisory_xact_lock(hashtextextended(?,0))",
          Object.class,
          "settlement-confirm:" + id);
      ObjectNode current = store.get("settlement", id, null);
      if (!current.path("state").asText().equals("PENDING")
          || current.path("sourceChanged").asBoolean()) continue;
      String supplierId = current.path("supplierId").asText();
      String ownerUser = "", ownerName = "未归属";
      try {
        ObjectNode supplier = store.get("supplier", supplierId, null);
        ownerUser = supplier.path("ownerUserId").asText();
        ownerName = supplier.path("ownerName").asText(ownerName);
      } catch (ApiException ignored) {
      }
      ObjectNode patch =
          store
              .object()
              .put("version", current.path("version").asLong())
              .put("state", "CONFIRMED")
              .put("supplierConfirmed", true)
              .put("confirmationMode", "AUTO_DEADLINE")
              .put("ownerUserId", ownerUser)
              .put("ownerName", ownerName)
              .put("confirmedAt", Instant.now().toString())
              .put("confirmationNote", "确认截止时间已到且未提出异议，按结算规则自动确认");
      store.update("settlement", id, null, patch);
      store.create(
          "audit",
          "GLOBAL",
          store
              .object()
              .put("action", "SETTLEMENT_AUTO_CONFIRM")
              .put("actor", "SYSTEM")
              .put("entityId", id)
              .put("outcome", "SUCCESS"));
      String owner = current.path("supplierId").asText();
      for (ObjectNode user :
          store.jdbc.query(
              "select profile from hub_user where supplier_id=? and enabled=true",
              (r, n) -> store.parse(r.getString(1)),
              owner)) {
        if (!user.path("role").asText().equals("SUPPLIER")) continue;
        store.create(
            "notification",
            user.path("id").asText(),
            store
                .object()
                .put("userId", user.path("id").asText())
                .put("title", "结算金额已按截止时间自动确认")
                .put("body", current.path("code").asText(id))
                .put("eventType", "SETTLEMENT_AUTO_CONFIRM")
                .put("targetPath", "settlements?tab=statements&id=" + id)
                .putNull("readAt"));
      }
      count++;
    }
    return count;
  }
}
