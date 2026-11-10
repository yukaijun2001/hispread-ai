package com.hispread.ai;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.node.*;
import jakarta.servlet.http.HttpServletRequest;
import java.util.*;
import org.springframework.stereotype.Service;

/**
 * Object-level authorization. Entity ownership is read from the database, never a request field.
 */
@Service
public class AccessPolicy {
  private static final Set<String> CATALOG = Set.of("project", "category", "exchange-rate");
  private static final Set<String> FINANCE_KINDS =
      Set.of(
          "supplier",
          "quote",
          "account",
          "settlement",
          "payment",
          "input",
          "bill",
          "document",
          "payout-call");
  private static final Set<String> OPERATOR_KINDS =
      Set.of("supplier", "quote", "resource", "intake", "proxy", "document", "owner-term");
  private static final Set<String> PRIVATE_USER_KINDS =
      Set.of("notification", "api-token", "export");
  private static final Set<String> SECRETS =
      Set.of(
          "password",
          "passwordHash",
          "password_hash",
          "hash",
          "initialPassword",
          "secretKey",
          "passphrase",
          "apiKey",
          "api_key",
          "accessToken",
          "refreshToken",
          "sessionKey",
          "credential",
          "credentials",
          "credentialContent",
          "material",
          "originalRequest");
  private final Store store;
  private final AuthService auth;

  public AccessPolicy(Store store, AuthService auth) {
    this.store = store;
    this.auth = auth;
  }

  public boolean admin(HttpServletRequest req) {
    return auth.admin(req);
  }

  public boolean operator(HttpServletRequest req) {
    return auth.platform(req) && "OPERATOR".equals(auth.user(req).path("role").asText());
  }

  public boolean finance(HttpServletRequest req) {
    return auth.platform(req) && "FINANCE".equals(auth.user(req).path("role").asText());
  }

  public boolean member(HttpServletRequest req) {
    return "SUPPLIER_AGENT".equals(auth.user(req).path("role").asText());
  }

  public boolean canSupplier(HttpServletRequest req, String supplierId) {
    if (supplierId == null || supplierId.isBlank() || "GLOBAL".equals(supplierId)) return false;
    if (admin(req) || finance(req)) return true;
    if (operator(req)) {
      try {
        ObjectNode supplier = store.get("supplier", supplierId, null);
        return supplier.path("enabled").asBoolean(true)
            && auth.userId(req).equals(supplier.path("ownerUserId").asText());
      } catch (ApiException e) {
        return false;
      }
    }
    return !auth.platform(req) && supplierId.equals(auth.user(req).path("supplierId").asText());
  }

  public void requireSupplier(HttpServletRequest req, String supplierId) {
    if (!canSupplier(req, supplierId)) throw new ApiException(404, "记录不存在或无权访问");
  }

  public String entityOwner(String kind, String id, HttpServletRequest req) {
    String owner = rawOwner(kind, id);
    if (!canRead(kind, store.get(kind, id, owner), owner, req))
      throw new ApiException(404, "记录不存在或无权访问");
    return owner;
  }

  private String rawOwner(String kind, String id) {
    List<String> owners =
        store.jdbc.query(
            "select owner_id from hub_entity where kind=? and id=?",
            (rs, index) -> rs.getString(1),
            kind,
            id);
    if (owners.isEmpty()) throw new ApiException(404, "记录不存在或无权访问");
    return owners.get(0);
  }

  public List<ObjectNode> visible(String kind, HttpServletRequest req) {
    List<Map.Entry<ObjectNode, String>> rows =
        store.jdbc.query(
            "select data,owner_id from hub_entity where kind=? order by created_at desc,id",
            (rs, index) -> Map.entry(store.parse(rs.getString(1)), rs.getString(2)),
            kind);
    return rows.stream()
        .filter(row -> canRead(kind, row.getKey(), row.getValue(), req))
        .map(Map.Entry::getKey)
        .toList();
  }

  public ObjectNode get(String kind, String id, HttpServletRequest req) {
    String owner = rawOwner(kind, id);
    ObjectNode row = store.get(kind, id, owner);
    if (!canRead(kind, row, owner, req)) throw new ApiException(404, "记录不存在或无权访问");
    return row;
  }

  private boolean canRead(String kind, ObjectNode row, String owner, HttpServletRequest req) {
    if (PRIVATE_USER_KINDS.contains(kind)) return auth.userId(req).equals(owner);
    if (kind.equals("project")) return canProject(req, row.path("id").asText());
    if (kind.equals("category") || kind.equals("exchange-rate")) return true;
    if (admin(req)) return true;
    if (finance(req))
      return FINANCE_KINDS.contains(kind)
          && (canSupplier(req, owner) || "GLOBAL".equals(owner) && kind.equals("payout-call"));
    if (operator(req)) {
      if (!OPERATOR_KINDS.contains(kind) || !canSupplier(req, owner)) return false;
      return !kind.equals("document") || !isPaymentProof(row);
    }
    if (!canSupplier(req, owner)) return false;
    if (!member(req)) return true;
    if (Set.of(
            "resource",
            "intake",
            "proxy",
            "bill",
            "submission",
            "reauthorization",
            "proxy-replacement")
        .contains(kind)) return canMemberResource(row, req);
    if (kind.equals("group"))
      return activeGroup(req)
          .map(g -> g.path("id").asText().equals(row.path("id").asText()))
          .orElse(false);
    if (kind.equals("agent"))
      return auth.userId(req).equals(row.path("id").asText())
          || activeGroup(req)
              .map(g -> includes(g.path("memberIds"), row.path("id").asText()))
              .orElse(false);
    if (kind.equals("document"))
      return !isPaymentProof(row) && auth.userId(req).equals(row.path("createdBy").asText());
    return false;
  }

  public Optional<ObjectNode> activeGroup(HttpServletRequest req) {
    if (!member(req)) return Optional.empty();
    String groupId = auth.user(req).path("teamAdminGroup").path("id").asText();
    if (groupId.isBlank()) return Optional.empty();
    try {
      ObjectNode group = store.get("group", groupId, auth.owner(req));
      return auth.userId(req).equals(group.path("adminUserId").asText())
              && includes(group.path("memberIds"), auth.userId(req))
          ? Optional.of(group)
          : Optional.empty();
    } catch (ApiException e) {
      return Optional.empty();
    }
  }

  public boolean canMemberResource(JsonNode row, HttpServletRequest req) {
    if (!member(req)) return true;
    String project = row.path("projectId").asText();
    if (!project.isBlank() && !assignedProjects(req).contains(project)) return false;
    String creator = row.path("createdBy").asText(row.path("creatorId").asText());
    if (auth.userId(req).equals(creator)) return true;
    return activeGroup(req).map(g -> includes(g.path("memberIds"), creator)).orElse(false);
  }

  public Set<String> assignedProjects(HttpServletRequest req) {
    if (!member(req)) return Set.of();
    Set<String> ids = new HashSet<>();
    for (JsonNode id : auth.user(req).path("projectIds")) ids.add(id.asText());
    // The user profile is authoritative; do not union stale agent snapshots after a revoke.
    ids.remove("");
    return ids;
  }

  public boolean canProject(HttpServletRequest req, String projectId) {
    try {
      ObjectNode p = store.get("project", projectId, null);
      if (admin(req) || finance(req)) return true;
      if (!p.path("enabled").asBoolean(true)) return false;
      return !member(req) || assignedProjects(req).contains(projectId);
    } catch (ApiException e) {
      return false;
    }
  }

  public void requireProject(HttpServletRequest req, String projectId) {
    if (!canProject(req, projectId)) throw new ApiException(404, "项目不存在或未获授权");
  }

  public boolean isPaymentProof(JsonNode row) {
    return Set.of("PAYMENT_PROOF", "PAYMENT_EVIDENCE", "PAYMENT_RECEIPT")
        .contains(row.path("category").asText());
  }

  public ObjectNode publicRecord(String kind, ObjectNode row, HttpServletRequest req) {
    ObjectNode out = row.deepCopy();
    redact(out);
    if (kind.equals("payout-call"))
      out.remove(List.of("adapterBinding", "executionContext", "requestFingerprint"));
    if (kind.equals("proxy")) out.remove("url");
    if (kind.equals("supplier")) {
      if (!admin(req) && auth.platform(req)) out.remove("linkedUsers");
      if (operator(req)) out.remove(List.of("accounts", "bankAccounts", "paymentSettings"));
    }
    if (kind.equals("account") && !admin(req))
      out.remove(List.of("accountNumber", "bankAccountNumber", "walletAddress"));
    if (Set.of(
            "resource",
            "intake",
            "quote",
            "project",
            "submission",
            "reauthorization",
            "proxy-replacement")
        .contains(kind)) {
      out.remove(
          List.of("key", "token", "apiToken", "raw", "url", "baseUrl", "configurationSecret"));
      JsonNode config = out.path("configuration");
      if (config.isObject())
        ((ObjectNode) config).remove(List.of("key", "token", "url", "baseUrl", "base_url"));
    }
    if (member(req)
        && Set.of(
                "resource",
                "intake",
                "project",
                "submission",
                "reauthorization",
                "proxy-replacement")
            .contains(kind)) redactMemberFinancial(out);
    return out;
  }

  private void redactMemberFinancial(JsonNode node) {
    if (node.isObject()) {
      ObjectNode object = (ObjectNode) node;
      object.remove(
          List.of(
              "quoteBasis",
              "quoteSnapshot",
              "pricingType",
              "pricing",
              "multiplier",
              "unitPrice",
              "ratePercent",
              "currency",
              "buyoutAmount",
              "buyoutCurrency",
              "amount",
              "total",
              "payable",
              "payableTotal",
              "originalAmount",
              "calculatedPayable",
              "finalAmount",
              "paidAmount",
              "receivedAmount",
              "reservedAmount",
              "suggestedMultiplier",
              "priceHistory"));
      object.fields().forEachRemaining(entry -> redactMemberFinancial(entry.getValue()));
    } else if (node.isArray()) for (JsonNode item : node) redactMemberFinancial(item);
  }

  private void redact(JsonNode node) {
    if (node.isObject()) {
      ObjectNode obj = (ObjectNode) node;
      obj.remove(SECRETS);
      obj.fields().forEachRemaining(entry -> redact(entry.getValue()));
    } else if (node.isArray()) for (JsonNode child : node) redact(child);
  }

  private boolean includes(JsonNode array, String id) {
    if (id == null || id.isBlank()) return false;
    for (JsonNode value : array) if (id.equals(value.asText())) return true;
    return false;
  }
}
