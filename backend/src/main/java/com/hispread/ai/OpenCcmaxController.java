package com.hispread.ai;

import static com.hispread.ai.BusinessSupport.*;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.node.*;
import jakarta.servlet.http.HttpServletRequest;
import java.math.BigDecimal;
import java.util.*;
import org.springframework.web.bind.annotation.*;

/**
 * Documented Bearer API. Local reads/records are real; upstream effects are explicitly unavailable.
 */
@RestController
@RequestMapping("/api/open/v1/ccmax")
public class OpenCcmaxController {
  private final Store s;
  private final AuthService a;
  private final BusinessSupport b;
  private final ProxyController proxies;
  private final ResourcesController resources;
  private final ResourceOperations operations;

  public OpenCcmaxController(
      Store s,
      AuthService a,
      BusinessSupport b,
      ProxyController proxies,
      ResourcesController resources,
      ResourceOperations operations) {
    this.s = s;
    this.a = a;
    this.b = b;
    this.proxies = proxies;
    this.resources = resources;
    this.operations = operations;
  }

  @GetMapping("/projects")
  public Object projects(HttpServletRequest r) {
    a.require(r, "project.read");
    a.require(r, "resource.read");
    List<ObjectNode> out = new ArrayList<>();
    for (ObjectNode p : b.eligible(r)) {
      if (!eq(p, "category", "ANTHROPIC")) continue;
      JsonNode q = p.path("quoteBasis");
      ObjectNode d =
          s.object()
              .put("projectId", text(p, "id"))
              .put("projectCode", text(p, "code"))
              .put("projectName", text(p, "name"))
              .put("settlementMethod", text(p, "settlementMethod"))
              .put("quoteId", text(q, "id"))
              .put("quoteCode", text(q, "code"))
              .put("currency", text(q, "currency"));
      if (b.member(r)) d.remove(List.of("quoteId", "quoteCode", "currency"));
      out.add(d);
    }
    return out;
  }

  @GetMapping("/proxies")
  public Object proxies(
      @RequestParam(defaultValue = "1") int page,
      @RequestParam(defaultValue = "20") int size,
      @RequestParam(defaultValue = "") String search,
      HttpServletRequest r) {
    return proxies.list(page, size, search, "all", "all", r);
  }

  @PostMapping("/proxies/import")
  public Object imports(@RequestBody ObjectNode body, HttpServletRequest r) {
    a.require(r, "proxy.read");
    a.require(r, "proxy.write");
    if (!body.has("maxResources") || body.path("maxResources").asInt(-1) < 0)
      throw new ApiException(400, "maxResources须为非负整数");
    String[] lines = text(body, "lines").split("\\R");
    if (lines.length > 500) throw new ApiException(400, "最多导入500行");
    int count = 0;
    ArrayNode skipped = s.json.createArrayNode();
    for (int i = 0; i < lines.length; i++) {
      if (lines[i].isBlank()) continue;
      ObjectNode one = body.deepCopy().put("lines", lines[i]);
      @SuppressWarnings("unchecked")
      Map<String, Object> result = (Map<String, Object>) proxies.imports(one, r);
      int imported = ((Number) result.get("imported")).intValue();
      count += imported;
      if (imported == 0) skipped.add(s.object().put("line", i + 1).put("reason", "格式无效或记录已存在"));
    }
    ObjectNode out = s.object().put("imported", count);
    out.set("skipped", skipped);
    return out;
  }

  private ObjectNode publicResource(ObjectNode r) {
    ObjectNode p = s.object();
    for (String k :
        List.of(
            "id",
            "name",
            "accountName",
            "projectId",
            "projectName",
            "credentialMode",
            "state",
            "dispatchState",
            "laneId",
            "laneState",
            "operationalStatus",
            "createdAt",
            "updatedAt",
            "submittedAt",
            "creationFailureHint",
            "dispatchFailureReason",
            "version",
            "creationAttempts",
            "creationRetrying",
            "creationFinished",
            "creationHttpStatus")) if (r.has(k)) p.set(k, r.get(k));
    p.put("resourceType", "CCMAX");
    return p;
  }

  private List<ObjectNode> rows(HttpServletRequest r) {
    a.require(r, "resource.read");
    return b.scopedResources(r).stream().filter(x -> eq(x, "resourceType", "CCMAX")).toList();
  }

  private ObjectNode row(String id, HttpServletRequest r) {
    a.require(r, "resource.read");
    ObjectNode d = b.resource(id, r);
    if (!eq(d, "resourceType", "CCMAX")) throw new ApiException(404, "CCMAX资源不存在");
    return d;
  }

  @GetMapping("/resources")
  public Object list(@RequestParam Map<String, String> q, HttpServletRequest r) {
    List<ObjectNode> list =
        rows(r).stream()
            .filter(
                x ->
                    b.contains(x, q.get("search"), "name", "accountName", "laneId")
                        && b.match(x, q, "state", "state")
                        && b.match(x, q, "operationalStatus", "operationalStatus")
                        && b.match(x, q, "projectCode", "projectCode"))
            .map(this::publicResource)
            .toList();
    return b.page(list, q);
  }

  @GetMapping("/resources/{id}")
  public Object detail(@PathVariable String id, HttpServletRequest r) {
    return publicResource(row(id, r));
  }

  @GetMapping("/intake")
  public Object intake(HttpServletRequest r) {
    ObjectNode out = resources.mine(r);
    for (String k : List.of("proAllowance", "nonProAllowance")) {
      ObjectNode allowance = (ObjectNode) out.path(k);
      allowance.putNull("groupId").put("reclaimed", false);
      allowance.remove("reservedRemaining");
    }
    out.remove(List.of("proBlockReason", "nonProBlockReason"));
    return out;
  }

  @GetMapping("/daily-summary")
  public Object daily(@RequestParam String quoteId, HttpServletRequest r) {
    a.require(r, "resource.read");
    a.require(r, "resource.usage");
    if (a.platform(r) && !a.admin(r)) throw new ApiException(403, "平台业务账号不可通过开放接口读取供应商账务");
    ObjectNode quote = s.get("quote", quoteId, a.owner(r));
    if (b.member(r)) b.access.requireProject(r, text(quote, "projectId"));
    List<ObjectNode> records =
        b.owned("bill", r).stream()
            .filter(
                x ->
                    eq(x, "quoteId", quoteId)
                        && eq(x, "businessDate", today())
                        && (!b.member(r) || eq(x, "creatorId", a.userId(r))))
            .toList();
    ObjectNode out =
        s.object()
            .put("businessDate", today())
            .put("timezone", "Asia/Shanghai")
            .put("quoteId", quoteId)
            .put("currency", text(quote, "currency"))
            .put("hasData", !records.isEmpty())
            .put(
                "resourceCount",
                records.stream().map(x -> text(x, "resourceId")).distinct().count())
            .put("entryCount", records.size())
            .put("pendingCount", records.stream().filter(x -> eq(x, "state", "PENDING")).count());
    out.put(
        "consumptionTotal",
        records.stream()
            .map(x -> amount(x, "consumption"))
            .reduce(BigDecimal.ZERO, BigDecimal::add)
            .toPlainString());
    out.put(
        "pendingConsumption",
        records.stream()
            .filter(x -> eq(x, "state", "PENDING"))
            .map(x -> amount(x, "consumption"))
            .reduce(BigDecimal.ZERO, BigDecimal::add)
            .toPlainString());
    if (!b.member(r))
      out.put(
          "payableTotal",
          records.stream()
              .map(x -> amount(x, "payable"))
              .reduce(BigDecimal.ZERO, BigDecimal::add)
              .toPlainString());
    out.putNull("lastQueriedAt");
    return out;
  }

  @PostMapping({
    "/submissions/credentials",
    "/submissions/oauth/authorize",
    "/submissions/oauth/complete",
    "/proxy-replacements"
  })
  public Object submit(@RequestBody ObjectNode body, HttpServletRequest r) {
    a.require(r, "resource.write");
    String path = r.getRequestURI();
    if (path.endsWith("/submissions/credentials")) return operations.submit(body, r);
    if (path.endsWith("/submissions/oauth/authorize")) {
      ObjectNode input = body.path("input").isObject() ? (ObjectNode) body.path("input") : body;
      return operations.authorize(input, r);
    }
    if (path.endsWith("/submissions/oauth/complete")) {
      required(body, "sessionId", "code");
      return operations.session(text(body, "sessionId"), "complete", body, r);
    }
    return operations.job("PROXY_REPLACEMENT", body, r);
  }

  @GetMapping("/submissions/{id}")
  public Object submission(@PathVariable String id, HttpServletRequest r) {
    a.require(r, "resource.read");
    try {
      return operations.operation(id, r);
    } catch (ApiException missing) {
      if (missing.status != 404) throw missing;
    }
    ObjectNode data = b.access.get("submission", id, r);
    if (b.member(r) && !text(data, "projectId").isBlank())
      b.access.requireProject(r, text(data, "projectId"));
    return b.access.publicRecord("submission", data, r);
  }

  @PostMapping("/submissions/{id}/cancel")
  public Object cancel(@PathVariable String id, HttpServletRequest r) {
    a.require(r, "resource.write");
    submission(id, r);
    return operations.session(id, "cancel", s.object(), r);
  }

  @GetMapping("/proxy-replacements/{id}")
  public Object replacement(@PathVariable String id, HttpServletRequest r) {
    a.require(r, "resource.read");
    try {
      return operations.jobDetail(id, r);
    } catch (ApiException missing) {
      if (missing.status != 404) throw missing;
    }
    ObjectNode job = b.access.get("proxy-replacement", id, r);
    for (JsonNode item : job.path("items")) row(text(item, "resourceId"), r);
    return b.access.publicRecord("proxy-replacement", job, r);
  }

  @PostMapping("/proxy-replacements/{id}/reconcile")
  public Object reconcile(@PathVariable String id, HttpServletRequest r) {
    a.require(r, "resource.write");
    replacement(id, r);
    return operations.reconcile(id, r);
  }

  @GetMapping({
    "/resources/{resourceId}/credential-refresh",
    "/resources/{resourceId}/reauthorizations/current"
  })
  public Object current(@PathVariable String resourceId, HttpServletRequest r) {
    row(resourceId, r);
    return operations.current(
        resourceId,
        r.getRequestURI().endsWith("credential-refresh")
            ? "CREDENTIAL-REFRESH"
            : "REAUTHORIZATIONS",
        r);
  }

  @PostMapping({
    "/resources/{resourceId}/credential-refresh",
    "/resources/{resourceId}/reauthorizations"
  })
  public Object maintenance(
      @PathVariable String resourceId, @RequestBody ObjectNode body, HttpServletRequest r) {
    a.require(r, "resource.write");
    row(resourceId, r);
    return operations.action(
        resourceId,
        r.getRequestURI().endsWith("credential-refresh")
            ? "credential-refresh"
            : "reauthorizations",
        "POST",
        body,
        r);
  }

  @GetMapping("/resources/{resourceId}/reauthorizations/{id}")
  public Object operation(
      @PathVariable String resourceId, @PathVariable String id, HttpServletRequest r) {
    row(resourceId, r);
    try {
      ObjectNode record = operations.getOperation(id, r);
      if (!eq(record, "resourceId", resourceId)) throw new ApiException(404, "操作不存在");
      return operations.operation(id, r);
    } catch (ApiException missing) {
      if (missing.status != 404) throw missing;
    }
    ObjectNode op = s.get("reauthorization", id, b.access.entityOwner("resource", resourceId, r));
    if (!eq(op, "resourceId", resourceId)) throw new ApiException(404, "操作不存在");
    return b.access.publicRecord("reauthorization", op, r);
  }

  @PutMapping("/resources/{resourceId}/reauthorizations/{id}")
  public Object authorization(
      @PathVariable String resourceId,
      @PathVariable String id,
      @RequestBody ObjectNode body,
      HttpServletRequest r) {
    a.require(r, "resource.write");
    operation(resourceId, id, r);
    return operations.action(resourceId, "reauthorizations/" + id, "PUT", body, r);
  }
}
