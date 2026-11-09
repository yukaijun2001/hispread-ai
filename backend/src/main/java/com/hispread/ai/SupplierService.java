package com.hispread.ai;

import static com.hispread.ai.BusinessSupport.*;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.node.*;
import java.time.Instant;
import java.util.*;
import org.springframework.stereotype.Service;

/** Validated supplier and account workflows; all access checks stay at their API boundary. */
@Service
public class SupplierService {
  private final Store s;

  public SupplierService(Store s) {
    this.s = s;
  }

  private boolean contains(JsonNode row, String search, String... fields) {
    if (search == null || search.isBlank()) return true;
    String q = search.toLowerCase(Locale.ROOT);
    for (String field : fields)
      if (text(row, field).toLowerCase(Locale.ROOT).contains(q)) return true;
    return false;
  }

  public ObjectNode profile(JsonNode body, ObjectNode previous) {
    ObjectNode out = previous == null ? s.object() : previous.deepCopy();
    for (String field :
        List.of(
            "name",
            "supplierType",
            "registrationNo",
            "country",
            "contact",
            "phone",
            "email",
            "cycle",
            "customCycleDays")) if (body.has(field)) out.set(field, body.get(field));
    required(out, "name");
    if (text(out, "name").length() > 160
        || text(out, "contact").length() > 160
        || text(out, "phone").length() > 80) throw new ApiException(400, "供应商字段长度超出范围");
    if (!text(out, "email").isBlank()
        && !text(out, "email").matches("^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$"))
      throw new ApiException(400, "请输入有效邮箱");
    String type = out.path("supplierType").asText("COMPANY");
    if (!Set.of("COMPANY", "INDIVIDUAL").contains(type)) throw new ApiException(400, "无效的主体类型");
    out.put("supplierType", type);
    String cycle = out.path("cycle").asText("MONTHLY");
    if (!Set.of("DAILY", "WEEKLY", "BIWEEKLY", "MONTHLY", "CUSTOM").contains(cycle))
      throw new ApiException(400, "无效的结算周期");
    out.put("cycle", cycle);
    if (cycle.equals("CUSTOM")
        && (out.path("customCycleDays").asInt() < 1 || out.path("customCycleDays").asInt() > 365))
      throw new ApiException(400, "自定义周期需为1–365天");
    if (!cycle.equals("CUSTOM")) out.putNull("customCycleDays");
    return out;
  }

  public void code(String code, String exceptId) {
    if (!code.matches("[A-Za-z0-9_-]{2,30}"))
      throw new ApiException(400, "供应商编码需为2–30位字母数字下划线或短横线");
    if (s.list("supplier", null).stream()
        .anyMatch(
            x ->
                !eq(x, "id", exceptId == null ? "" : exceptId)
                    && text(x, "code").equalsIgnoreCase(code)))
      throw new ApiException(409, "供应商编码已存在");
  }

  public boolean filter(ObjectNode row, Map<String, String> q) {
    String owner = q.getOrDefault("owner", q.getOrDefault("ownerUserId", ""));
    return contains(row, q.get("search"), "name", "code", "contact", "phone", "email")
        && (q.getOrDefault("state", "").isBlank()
            || eq(row, "profileReviewState", q.get("state"))
            || eq(row, "state", q.get("state")))
        && (owner.isBlank()
            || owner.equals("UNASSIGNED") && text(row, "ownerUserId").isBlank()
            || eq(row, "ownerUserId", owner))
        && (q.getOrDefault("enabled", "").isBlank()
            || row.path("enabled").asBoolean() == Boolean.parseBoolean(q.get("enabled")));
  }

  public ObjectNode account(JsonNode body, ObjectNode supplier, String creator) {
    required(body, "accountNumber", "holder", "currency");
    if (!text(body, "holder").equals(text(supplier, "name")))
      throw new ApiException(400, "收款人需与供应商主体名称一致");
    if (!Set.of("USD", "CNY", "USDT").contains(text(body, "currency")))
      throw new ApiException(400, "无效账户币种");
    if (text(body, "accountNumber").length() > 300 || text(body, "bank").length() > 160)
      throw new ApiException(400, "账户信息过长");
    ObjectNode out = s.object();
    for (String f :
        List.of(
            "supplierId",
            "holder",
            "bank",
            "currency",
            "accountType",
            "providerCode",
            "transferType",
            "network",
            "walletType",
            "replacesId")) if (body.has(f)) out.set(f, body.get(f));
    String number = text(body, "accountNumber");
    out.put("lastFour", number.substring(Math.max(0, number.length() - 4)))
        .put("state", "PENDING")
        .put("createdBy", creator)
        .put("updatedBy", creator)
        .put("submittedBy", creator);
    String replaces = text(body, "replacesId");
    if (!replaces.isBlank()) {
      ObjectNode old = s.get("account", replaces, text(supplier, "id"));
      if (!eq(old, "state", "APPROVED")) throw new ApiException(409, "只能变更生效中的账户");
      if (s.list("account", text(supplier, "id")).stream()
          .anyMatch(x -> eq(x, "replacesId", replaces) && eq(x, "state", "PENDING")))
        throw new ApiException(409, "该账户已有待审变更");
    }
    return out;
  }

  public void approveReplacement(ObjectNode account) {
    String replaces = text(account, "replacesId");
    if (replaces.isBlank()) return;
    ObjectNode old = s.get("account", replaces, text(account, "supplierId"));
    if (!eq(old, "state", "APPROVED")) throw new ApiException(409, "原账户状态已变化，请刷新审核");
    s.update(
        "account",
        replaces,
        text(account, "supplierId"),
        s.object()
            .put("version", old.path("version").asLong())
            .put("state", "SUPERSEDED")
            .put("supersededBy", text(account, "id"))
            .put("supersededAt", Instant.now().toString()));
  }
}
