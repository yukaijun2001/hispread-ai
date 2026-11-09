package com.hispread.ai;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.node.*;
import java.util.*;
import org.springframework.stereotype.Service;

/** Explicit responsibility ceilings: custom grants never change identity or data scope. */
@Service
public class RolePolicy {
  public static final String DEFAULT_POLICY_VERSION = "security-role-policy-v3";
  public static final Set<String> BUILTINS =
      Set.of("ADMIN", "OPERATOR", "FINANCE", "SUPPLIER", "SUPPLIER_AGENT");
  private static final Set<String> PLATFORM = Set.of("ADMIN", "OPERATOR", "FINANCE");
  private static final List<String> OPERATOR =
      List.of(
          "workbench.read",
          "workbench.tasks.read",
          "workbench.monitoring.read",
          "supplier.read",
          "supplier.write",
          "project.read",
          "quote.read",
          "quote.review",
          "resource.read",
          "resource.write",
          "resource.dispatch",
          "resource.usage",
          "resource.intake.manage",
          "proxy.read",
          "proxy.write",
          "report.read",
          "file.write");
  private static final List<String> FINANCE =
      List.of(
          "workbench.read",
          "workbench.tasks.read",
          "workbench.monitoring.read",
          "supplier.read",
          "project.read",
          "quote.read",
          "account.read",
          "account.review",
          "usage.read",
          "usage.import",
          "settlement.read",
          "settlement.create",
          "settlement.export",
          "payment.read",
          "payment.create",
          "payment.review",
          "payment.record",
          "payout.call.read",
          "exchange_rate.read",
          "report.read",
          "report.export",
          "file.write");
  private static final List<String> SUPPLIER =
      List.of(
          "workbench.read",
          "workbench.tasks.read",
          "workbench.monitoring.read",
          "supplier.read",
          "supplier.write",
          "project.read",
          "quote.read",
          "quote.write",
          "resource.read",
          "resource.write",
          "resource.sensitive",
          "resource.request.read",
          "resource.usage",
          "resource.intake.manage",
          "proxy.read",
          "proxy.write",
          "settlement.read",
          "settlement.confirm",
          "settlement.export",
          "payment.read",
          "payment.receipt",
          "account.read",
          "account.write",
          "exchange_rate.read",
          "report.read",
          "report.export",
          "file.write",
          "supplier.agent.manage");
  private static final List<String> MEMBER =
      List.of(
          "workbench.read",
          "workbench.tasks.read",
          "project.read",
          "resource.read",
          "resource.write",
          "resource.usage",
          "resource.intake.manage",
          "proxy.read",
          "proxy.write",
          "file.write");
  private static final List<String> MEMBER_CEILING =
      List.of(
          "workbench.read",
          "workbench.tasks.read",
          "project.read",
          "resource.read",
          "resource.write",
          "resource.usage",
          "resource.intake.manage",
          "proxy.read",
          "proxy.write",
          "file.write",
          "resource.sensitive",
          "resource.request.read",
          "supplier.agent.manage");
  private final Store store;

  public RolePolicy(Store store) {
    this.store = store;
  }

  public ArrayNode allPermissions() {
    try (var input =
        new org.springframework.core.io.ClassPathResource("permissions.json").getInputStream()) {
      return (ArrayNode) store.json.readTree(input);
    } catch (Exception e) {
      throw new IllegalStateException(e);
    }
  }

  public ArrayNode defaults(String code) {
    if (code.equals("ADMIN")) return allPermissions();
    return store.json.valueToTree(
        switch (code) {
          case "OPERATOR" -> OPERATOR;
          case "FINANCE" -> FINANCE;
          case "SUPPLIER" -> SUPPLIER;
          case "SUPPLIER_AGENT" -> MEMBER;
          default -> List.of();
        });
  }

  public ArrayNode ceiling(String code) {
    return code.equals("SUPPLIER_AGENT") ? store.json.valueToTree(MEMBER_CEILING) : defaults(code);
  }

  public ArrayNode scopeTypes() {
    ArrayNode scopes = store.json.createArrayNode();
    for (String code : List.of("OPERATOR", "FINANCE", "SUPPLIER", "SUPPLIER_AGENT")) {
      ObjectNode type =
          store
              .object()
              .put("code", code)
              .put(
                  "name",
                  switch (code) {
                    case "OPERATOR" -> "平台运营";
                    case "FINANCE" -> "财务人员";
                    case "SUPPLIER" -> "供应商主账号";
                    default -> "供应商成员";
                  });
      type.set("allowedPermissions", ceiling(code));
      scopes.add(type);
    }
    return scopes;
  }

  public ObjectNode role(String code) {
    ObjectNode role = store.get("role", code, null);
    if (!code.equals(role.path("code").asText()) || !code.equals(role.path("id").asText()))
      throw new ApiException(403, "角色身份无效");
    return role;
  }

  public boolean supplierRole(String code) {
    return Set.of("SUPPLIER", "SUPPLIER_AGENT").contains(code);
  }

  public boolean highestAdministrator(JsonNode user) {
    if (!"ADMIN".equals(user.path("role").asText()) || hasSupplier(user)) return false;
    try {
      return role("ADMIN").path("builtIn").asBoolean(false);
    } catch (ApiException e) {
      return false;
    }
  }

  public boolean platform(JsonNode user) {
    if (hasSupplier(user) || !PLATFORM.contains(user.path("role").asText())) return false;
    try {
      return role(user.path("role").asText()).path("builtIn").asBoolean(false);
    } catch (ApiException e) {
      return false;
    }
  }

  private boolean hasSupplier(JsonNode user) {
    return user.path("supplierId").isTextual() && !user.path("supplierId").asText().isBlank();
  }

  private Set<String> values(JsonNode array) {
    Set<String> out = new LinkedHashSet<>();
    for (JsonNode value : array) out.add(value.asText());
    return out;
  }

  public void validatePermissions(String scope, JsonNode permissions) {
    if (!BUILTINS.contains(scope) || !permissions.isArray())
      throw new ApiException(400, "请选择有效的职责范围和权限数组");
    Set<String> allowed = values(ceiling(scope));
    for (JsonNode permission : permissions)
      if (!allowed.contains(permission.asText()))
        throw new ApiException(400, "权限超出该角色职责上限：" + permission.asText());
  }

  public ObjectNode describe(ObjectNode role) {
    ObjectNode out = role.deepCopy();
    String scope =
        role.path("builtIn").asBoolean()
            ? role.path("code").asText()
            : role.path("scopeType").asText();
    out.put("scopeType", scope)
        .put(
            "dataScope",
            switch (scope) {
              case "ADMIN" -> "ALL_WITH_SEPARATION_OF_DUTIES";
              case "OPERATOR" -> "ASSIGNED_SUPPLIERS";
              case "FINANCE" -> "FINANCIAL_BUSINESS";
              case "SUPPLIER" -> "OWN_SUPPLIER";
              case "SUPPLIER_AGENT" -> "OWN_OR_MANAGED_GROUP_AND_PROJECTS";
              default -> "DENIED_UNCLASSIFIED";
            });
    out.set("allowedPermissions", ceiling(scope));
    return out;
  }

  public ArrayNode additionalRoles(String primary, JsonNode input) {
    if (!BUILTINS.contains(primary) || !input.isArray())
      throw new ApiException(400, "请选择内置主身份及附加角色数组");
    LinkedHashSet<String> codes = new LinkedHashSet<>();
    for (JsonNode item : input) {
      String code = item.asText();
      ObjectNode role = role(code);
      if (role.path("builtIn").asBoolean(true)
          || BUILTINS.contains(code)
          || !primary.equals(role.path("scopeType").asText()))
        throw new ApiException(400, "附加角色必须与主身份同职责范围，不能附加其他身份权限");
      validatePermissions(primary, role.path("permissions"));
      codes.add(code);
    }
    return store.json.valueToTree(codes);
  }

  public ArrayNode effectivePermissions(String primary, JsonNode extras) {
    if (!BUILTINS.contains(primary)) throw new ApiException(400, "自定义角色不能作为登录主身份");
    ObjectNode builtin = role(primary);
    if (!builtin.path("builtIn").asBoolean(false)) throw new ApiException(403, "内置角色身份无效");
    Set<String> allowed = values(ceiling(primary)),
        permissions = values(builtin.path("permissions"));
    permissions.retainAll(allowed);
    // Previously assigned invalid legacy extras fail closed without locking the user out.
    for (JsonNode code : extras) {
      try {
        additionalRoles(primary, store.json.valueToTree(List.of(code.asText())));
        permissions.addAll(values(role(code.asText()).path("permissions")));
      } catch (ApiException ignored) {
      }
    }
    permissions.retainAll(allowed);
    return store.json.valueToTree(permissions);
  }

  /**
   * Intersect stored grants on every request so stale or hand-edited profiles cannot bypass
   * ceilings.
   */
  public ObjectNode constrain(ObjectNode profile) {
    ObjectNode out = profile.deepCopy();
    String primary = out.path("role").asText();
    if (!BUILTINS.contains(primary) || supplierRole(primary) != hasSupplier(out))
      throw new ApiException(403, "账号身份与所属主体不一致，请联系管理员");
    Set<String> stored = values(out.path("permissions"));
    stored.retainAll(
        values(
            effectivePermissions(
                primary,
                out.path("additionalRoleCodes").isArray()
                    ? out.path("additionalRoleCodes")
                    : store.json.createArrayNode())));
    if (primary.equals("SUPPLIER_AGENT")) stored.remove("supplier.agent.manage");
    out.set("permissions", store.json.valueToTree(stored));
    out.put("scopeType", primary).put("rolePolicyVersion", DEFAULT_POLICY_VERSION);
    return out;
  }

  public void assign(ObjectNode user, String primary, JsonNode extras, String supplierId) {
    if (!BUILTINS.contains(primary)) throw new ApiException(400, "主身份只能选择五个内置角色");
    ObjectNode builtin = role(primary);
    if (!builtin.path("builtIn").asBoolean(false)) throw new ApiException(403, "内置角色身份无效");
    if (supplierRole(primary)) {
      if (supplierId == null || supplierId.isBlank()) throw new ApiException(400, "供应商身份必须关联供应商");
      store.get("supplier", supplierId, null);
      user.put("supplierId", supplierId);
    } else {
      if (supplierId != null && !supplierId.isBlank()) throw new ApiException(400, "平台身份不能关联供应商");
      user.putNull("supplierId");
    }
    ArrayNode extra = additionalRoles(primary, extras);
    user.put("role", primary)
        .put("roleCode", primary)
        .put("roleName", builtin.path("name").asText());
    user.set("additionalRoleCodes", extra);
    user.set("permissions", effectivePermissions(primary, extra));
  }
}
