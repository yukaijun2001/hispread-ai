package com.hispread.ai;

import static com.hispread.ai.BusinessSupport.*;

import com.fasterxml.jackson.databind.*;
import com.fasterxml.jackson.databind.node.*;
import jakarta.servlet.http.HttpServletRequest;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.time.Instant;
import java.util.*;
import java.util.stream.Collectors;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api")
public class ResourcesController {
  private final Store store;
  private final AuthService auth;
  private final BusinessSupport b;
  private final ResourceOperations operations;
  private final ResourceIntegrationGateway gateway;

  public ResourcesController(
      Store store,
      AuthService auth,
      BusinessSupport b,
      ResourceOperations operations,
      ResourceIntegrationGateway gateway) {
    this.store = store;
    this.auth = auth;
    this.b = b;
    this.operations = operations;
    this.gateway = gateway;
  }

  @GetMapping("/projects/{id}/intake-channel-types")
  public ArrayNode projectIntakeTypes(@PathVariable String id, HttpServletRequest req) {
    auth.require(req, "project.read");
    b.access.requireProject(req, id);
    ObjectNode project = b.project(id);
    return project.path("supportedIntakeTypes").isArray()
        ? (ArrayNode) project.path("supportedIntakeTypes").deepCopy()
        : store.json.createArrayNode();
  }

  @PutMapping("/projects/{id}/intake-channel-types")
  public ArrayNode setProjectIntakeTypes(
      @PathVariable String id, @RequestBody JsonNode body, HttpServletRequest req) {
    auth.require(req, "project.write");
    if (!auth.admin(req)) throw new ApiException(403, "仅最高管理员可配置接口交付类型");
    if (!body.isArray()) throw new ApiException(400, "适用资源类型须为数组");
    Set<Integer> supported = Set.of(1, 3, 14, 24, 33, 41, 60);
    LinkedHashSet<Integer> types = new LinkedHashSet<>();
    for (JsonNode type : body) {
      if (!type.isIntegralNumber() || !supported.contains(type.asInt()))
        throw new ApiException(400, "不支持的接口资源类型");
      types.add(type.asInt());
    }
    ObjectNode patch = b.obj();
    patch.set("supportedIntakeTypes", b.arr(types));
    return (ArrayNode) store.update("project", id, null, patch).path("supportedIntakeTypes");
  }

  @GetMapping({"/deliveries", "/resources"})
  public ObjectNode list(@RequestParam Map<String, String> q, HttpServletRequest req) {
    auth.require(req, "resource.read");
    List<ObjectNode> rows = new ArrayList<>();
    String assignment = q.getOrDefault("assignment", "ASSIGNED");
    if (!assignment.equals("UNASSIGNED")) rows.addAll(b.scopedResources(req));
    for (ObjectNode i : b.owned("intake", req))
      if (!i.path("deleted").asBoolean()
          && b.canResource(i, req)
          && eq(i, "assignmentState", assignment)) {
        ObjectNode pub = i.deepCopy();
        pub.remove(List.of("originalRequest", "material"));
        rows.add(pub);
      }
    rows =
        rows.stream()
            .filter(
                r ->
                    b.contains(r, q.get("search"), "name", "accountName", "laneId")
                        && (q.getOrDefault("resourceType", "").equals("NEWAPI_CHANNEL")
                            ? !text(r, "upstreamChannelId").isBlank()
                            : q.getOrDefault("resourceType", "").equals("CCMAX") && !text(r, "upstreamChannelId").isBlank()
                                ? false : b.match(r, q, "resourceType", "resourceType"))
                        && b.match(r, q, "supplierId", "supplierId")
                        && b.match(r, q, "supplierSearch", "supplierId")
                        && b.match(r, q, "category", "projectCategory")
                        && b.match(r, q, "projectId", "projectId")
                        && b.match(r, q, "credentialMode", "credentialMode")
                        && b.match(r, q, "state", "state")
                        && b.match(r, q, "creatorSearch", "createdBy")
                        && b.match(r, q, "newApiDeliveryState", "dispatchState")
                        && b.match(r, q, "newApiResourceState", "operationalState")
                        && b.match(r, q, "operationalStatus", "operationalState")
                        && b.dates(r, q, "createdFrom", "createdTo", "createdAt", "createdAt"))
            .toList();
    return b.page(rows.stream().map(x -> resourceView(x, req)).toList(), q);
  }

  @GetMapping("/deliveries/filter-options")
  public ObjectNode options(HttpServletRequest req) {
    auth.require(req, "resource.read");
    ObjectNode out = b.obj();
    ObjectNode user = auth.user(req);
    List<ObjectNode> creators = new ArrayList<>();
    creators.add(
        b.obj()
            .put("id", text(user, "id"))
            .put("name", text(user, "displayName"))
            .put("code", text(user, "username")));
    if (!b.member(req))
      for (ObjectNode a : b.owned("agent", req))
        creators.add(
            b.obj()
                .put("id", text(a, "id"))
                .put("name", text(a, "displayName"))
                .put("code", text(a, "username")));
    out.set("creators", b.arr(creators));
    out.set(
        "suppliers",
        b.arr(
            b.owned("supplier", req).stream()
                .map(
                    s ->
                        b.obj()
                            .put("id", text(s, "id"))
                            .put("name", text(s, "name"))
                            .put("code", text(s, "code")))
                .toList()));
    return out;
  }

  @GetMapping("/resources/eligible-projects")
  public List<ObjectNode> eligible(HttpServletRequest req) {
    auth.require(req, "resource.read");
    return b.eligible(req).stream().map(p -> b.publicRecord("project", p, req)).toList();
  }

  @GetMapping("/resources/submission-capabilities")
  public ObjectNode capabilities(HttpServletRequest req) {
    auth.require(req, "resource.read");
    boolean configured = gateway.ccmaxConfigured();
    return b.obj()
        .put("allowCcmax", configured)
        .put("allowDirectCcmax", gateway.allowDirectCcmax())
        .put("forceStopCcmaxIntake", false)
        .put("allowCcmaxReauthorization", configured)
        .put("allowCcmaxPause", configured)
        .put("allowCcmaxSafeRemoval", configured)
        .put("externalConfigured", configured)
        .put("message", configured ? "已配置资源上游，操作结果以真实响应为准" : "尚未配置资源上游，本地资料可保存");
  }

  @GetMapping("/resources/{id}")
  public ObjectNode detail(@PathVariable String id, HttpServletRequest req) {
    auth.require(req, "resource.read");
    return resourceView(b.resource(id, req), req);
  }

  private ObjectNode resourceView(ObjectNode row, HttpServletRequest req) {
    ObjectNode out = b.publicRecord("resource", row, req);
    if (!text(out, "supplierId").isBlank()) {
      try {
        ObjectNode supplier = store.get("supplier", text(out, "supplierId"), null);
        out.put("supplierName", text(supplier, "name")).put("supplierCode", text(supplier, "code"));
      } catch (ApiException ignored) {}
    }
    return out;
  }

  @PostMapping("/resources/drafts")
  public ObjectNode draft(@RequestBody ObjectNode body, HttpServletRequest req) {
    auth.require(req, "resource.write");
    required(body, "projectId");
    ObjectNode project = b.eligibleProject(text(body, "projectId"), req);
    String owner = b.tenant(req, body);
    if (body.hasNonNull("proxyId") && !text(body, "proxyId").isBlank())
      b.get("proxy", text(body, "proxyId"), req);
    ObjectNode p = draftFields(body, project, req);
    p.put("supplierId", owner);
    ObjectNode saved = store.create("resource", owner, p);
    operations.saveCredentials(text(saved, "id"), owner, body);
    return b.publicRecord("resource", saved, req);
  }

  private ObjectNode draftFields(ObjectNode body, ObjectNode project, HttpServletRequest req) {
    ObjectNode p =
        b.pick(
            body,
            "accountName",
            "projectId",
            "credentialMode",
            "remark",
            "proxyId",
            "expiresAt",
            "version");
    p.put("name", text(body, "accountName").isBlank() ? "待填写" : text(body, "accountName"))
        .put("projectName", text(project, "name"))
        .put("projectCategory", text(project, "category"))
        .put("projectCategoryName", text(project, "categoryName"))
        .put("resourceType", "CCMAX")
        .put("state", "DRAFT")
        .put("dispatchState", "NOT_SUBMITTED")
        .put("supplierId", b.scope(req))
        .put("createdBy", auth.userId(req))
        .put("creatorId", auth.userId(req))
        .put("creatorName", text(auth.user(req), "displayName"))
        .put("credentialConfigured", false)
        .put("localOnly", true);
    p.set("usage", b.obj().putNull("amount").put("currency", "USD"));
    return p;
  }

  @PutMapping("/resources/{id}")
  public ObjectNode edit(
      @PathVariable String id, @RequestBody ObjectNode body, HttpServletRequest req) {
    auth.require(req, "resource.write");
    ObjectNode old = b.resource(id, req);
    if (!eq(old, "state", "DRAFT")) throw new ApiException(409, "仅可编辑本地草稿");
    if (body.hasNonNull("proxyId") && !text(body, "proxyId").isBlank())
      b.get("proxy", text(body, "proxyId"), req);
    ObjectNode p =
        b.pick(
            body,
            "accountName",
            "projectId",
            "credentialMode",
            "remark",
            "proxyId",
            "expiresAt",
            "version");
    if (body.hasNonNull("projectId")) {
      ObjectNode pr = b.eligibleProject(text(body, "projectId"), req);
      p.put("projectName", text(pr, "name"));
    }
    if (body.has("accountName")) p.put("name", text(body, "accountName"));
    operations.saveCredentials(id, b.entityOwner("resource", id, req), body);
    return b.publicRecord("resource", b.update("resource", id, req, p), req);
  }

  @DeleteMapping("/resources/{id}")
  public ObjectNode delete(
      @PathVariable String id, @RequestParam long version, HttpServletRequest req) {
    auth.require(req, "resource.write");
    ObjectNode old = b.resource(id, req);
    if (!eq(old, "state", "DRAFT")) throw new ApiException(409, "已交付资源需通过配置的上游移除流程处理");
    return store.update(
        "resource",
        id,
        b.entityOwner("resource", id, req),
        b.obj().put("deleted", true).put("version", version));
  }

  @PostMapping("/resources/supplier-submit")
  public ObjectNode supplierSubmit(@RequestBody ObjectNode body, HttpServletRequest req) {
    return operations.submit(body, req);
  }

  @PostMapping("/resources/ccmax/batch")
  public ObjectNode batch(@RequestBody ObjectNode body, HttpServletRequest req) {
    auth.require(req, "resource.write");
    if (!body.path("items").isArray()
        || body.path("items").size() < 1
        || body.path("items").size() > 100) throw new ApiException(400, "每批1至100份资料");
    ObjectNode out = b.obj();
    ArrayNode results = out.putArray("results");
    int i = 0;
    for (JsonNode item : body.path("items")) {
      ObjectNode row = b.obj().put("index", i++);
      try {
        ObjectNode response = operations.submit((ObjectNode) item, req);
        row.put("success", eq(response, "state", "SUCCESS"));
        row.set("resource", response);
      } catch (ApiException e) {
        row.put("success", false).put("error", e.getMessage()).put("code", e.code);
      }
      results.add(row);
    }
    return out;
  }

  @PostMapping("/resources/oauth/supplier-authorize")
  public ObjectNode authorize(@RequestBody ObjectNode body, HttpServletRequest req) {
    return operations.authorize(body, req);
  }

  @PostMapping("/resources/oauth/supplier-submit")
  public ObjectNode oauthSubmit(@RequestBody ObjectNode body, HttpServletRequest req) {
    required(body, "sessionId", "code");
    return operations.session(text(body, "sessionId"), "complete", body, req);
  }

  @GetMapping("/resources/oauth/supplier-session/{id}")
  public ObjectNode session(@PathVariable String id, HttpServletRequest req) {
    return operations.session(id, "get", b.obj(), req);
  }

  @PostMapping("/resources/oauth/supplier-session/{id}/cancel")
  public ObjectNode cancel(@PathVariable String id, HttpServletRequest req) {
    return operations.session(id, "cancel", b.obj(), req);
  }

  @PostMapping({
    "/resources/{id}/submit",
    "/resources/{id}/dispatch",
    "/resources/{id}/usage",
    "/resources/{id}/say-hi",
    "/resources/{id}/credential-refresh",
    "/resources/{id}/reauthorizations",
    "/resources/{id}/reauthorizations/{op}",
    "/resources/{id}/oauth/authorize",
    "/resources/{id}/oauth/complete",
    "/resources/{id}/oauth/supplier-retry",
    "/resources/{id}/oauth/supplier-submit",
    "/resources/{id}/oauth/supplier-authorize"
  })
  public ObjectNode action(
      @PathVariable String id,
      @RequestBody(required = false) ObjectNode body,
      HttpServletRequest req) {
    String tail = req.getRequestURI().substring(("/api/resources/" + id + "/").length());
    return operations.action(id, tail, "POST", body == null ? b.obj() : body, req);
  }

  @PostMapping("/resources/{id}/upstream-channel")
  public ObjectNode bindChannel(@PathVariable String id, @RequestBody ObjectNode body, HttpServletRequest req) {
    return operations.bindNewApi(id, body, req);
  }

  @PostMapping("/resources/{id}/upstream-account")
  public ObjectNode bindNativeAccount(@PathVariable String id, @RequestBody ObjectNode body, HttpServletRequest req) {
    operations.bindNativeCcmax(id, body, req);
    return resourceView(b.resource(id, req), req);
  }

  @PutMapping("/resources/{id}/reauthorizations/{op}")
  public ObjectNode updateAuthorization(
      @PathVariable String id,
      @PathVariable String op,
      @RequestBody ObjectNode body,
      HttpServletRequest req) {
    return operations.action(id, "reauthorizations/" + op, "PUT", body, req);
  }

  @GetMapping("/resources/{id}/dispatches")
  public List<ObjectNode> dispatches(@PathVariable String id, HttpServletRequest req) {
    b.resource(id, req);
    return operations.listOperations("DISPATCH", req).stream()
        .filter(x -> eq(x, "resourceId", id))
        .toList();
  }

  @GetMapping({"/resources/{id}/credential-refresh", "/resources/{id}/reauthorizations/current"})
  public ObjectNode currentAuthorization(@PathVariable String id, HttpServletRequest req) {
    return operations.current(
        id,
        req.getRequestURI().endsWith("credential-refresh")
            ? "CREDENTIAL-REFRESH"
            : "REAUTHORIZATIONS",
        req);
  }

  @GetMapping("/resources/{id}/reauthorizations/{op}")
  public ObjectNode authorizationOperation(
      @PathVariable String id, @PathVariable String op, HttpServletRequest req) {
    b.resource(id, req);
    ObjectNode operation = operations.getOperation(op, req);
    if (!eq(operation, "resourceId", id)) throw new ApiException(404, "操作不存在");
    return operations.operation(op, req);
  }

  @PostMapping("/resources/{id}/creation-recovery")
  public ObjectNode recovery(
      @PathVariable String id, @RequestBody ObjectNode body, HttpServletRequest req) {
    return operations.recovery(id, body, req);
  }

  @PostMapping({"/resource-lifecycle-jobs", "/resource-proxy-replacements"})
  public ObjectNode job(@RequestBody ObjectNode body, HttpServletRequest req) {
    return operations.job(
        req.getRequestURI().endsWith("resource-lifecycle-jobs") ? "LIFECYCLE" : "PROXY_REPLACEMENT",
        body,
        req);
  }

  @GetMapping({"/resource-lifecycle-jobs", "/resource-proxy-replacements"})
  public ObjectNode operationList(@RequestParam Map<String, String> q, HttpServletRequest req) {
    auth.require(req, "resource.read");
    String type =
        req.getRequestURI().endsWith("resource-lifecycle-jobs") ? "LIFECYCLE" : "PROXY_REPLACEMENT";
    List<ObjectNode> rows =
        operations.listOperations(type, req).stream()
            .filter(
                x ->
                    (!q.containsKey("resourceId")
                            || x.path("items").toString().contains(q.get("resourceId")))
                        && (!q.getOrDefault("scope", "").equals("mine")
                            || eq(x, "createdBy", auth.userId(req))))
            .toList();
    return b.page(rows, q);
  }

  @GetMapping({"/resource-lifecycle-jobs/{id}", "/resource-proxy-replacements/{id}"})
  public ObjectNode operationDetail(@PathVariable String id, HttpServletRequest req) {
    auth.require(req, "resource.read");
    return operations.jobDetail(id, req);
  }

  @PostMapping({
    "/resource-lifecycle-jobs/{id}/reconcile",
    "/resource-proxy-replacements/{id}/reconcile"
  })
  public ObjectNode reconcile(@PathVariable String id, HttpServletRequest req) {
    operations.reconcile(id, req);
    return operations.jobDetail(id, req);
  }

  @GetMapping("/resource-proxy-replacements/proxy-options")
  public ObjectNode proxyOptions(@RequestParam Map<String, String> q, HttpServletRequest req) {
    auth.require(req, "proxy.read");
    return b.page(
        b.owned("proxy", req).stream()
            .filter(
                x ->
                    x.path("enabled").asBoolean()
                        && b.contains(x, q.get("search"), "name", "endpoint", "url"))
            .map(x -> b.publicRecord("proxy", x, req))
            .toList(),
        q);
  }

  @GetMapping("/resources/failure-reasons")
  public List<ObjectNode> failures(HttpServletRequest req) {
    auth.require(req, "resource.read");
    Map<String, Integer> counts = new LinkedHashMap<>();
    for (ObjectNode r : b.scopedResources(req)) {
      String reason = text(r, "dispatchFailureReason");
      if (reason.isBlank())
        reason = text(r.path("resourceData").path("health"), "credentialFailureReason");
      if (!reason.isBlank()) counts.merge(reason, 1, Integer::sum);
    }
    List<ObjectNode> out = new ArrayList<>();
    counts.forEach(
        (reason, count) ->
            out.add(b.obj().put("value", reason).put("label", reason).put("count", count)));
    return out;
  }

  @GetMapping("/resources/summary")
  public List<ObjectNode> summary(HttpServletRequest req) {
    auth.require(req, "resource.read");
    Map<String, List<ObjectNode>> groups =
        b.scopedResources(req).stream()
            .filter(x -> eq(x, "state", "DELIVERED"))
            .collect(Collectors.groupingBy(x -> text(x, "projectCategory")));
    List<ObjectNode> out = new ArrayList<>();
    groups.forEach(
        (category, rows) -> {
          ObjectNode x =
              b.obj()
                  .put("category", category)
                  .put("categoryName", text(rows.get(0), "projectCategoryName"));
          ArrayNode amounts = x.putArray("amounts");
          if (!b.member(req)) {
            Map<String, java.math.BigDecimal> sums = new LinkedHashMap<>();
            Map<String, Integer> counts = new HashMap<>();
            for (ObjectNode row : rows) {
              boolean buyout = eq(row, "settlementMethod", "ACCOUNT_BUYOUT");
              String currency =
                  buyout
                      ? row.path("buyoutCurrency").asText("USD")
                      : row.path("usage").path("currency").asText("USD");
              JsonNode amount =
                  buyout ? row.path("buyoutAmount") : row.path("usage").path("amount");
              if (amount.isNumber() || amount.isTextual())
                try {
                  String key = (buyout ? "BUYOUT" : "CONSUMPTION") + ":" + currency;
                  sums.merge(
                      key, new java.math.BigDecimal(amount.asText()), java.math.BigDecimal::add);
                  counts.merge(key, 1, Integer::sum);
                } catch (NumberFormatException ignored) {
                }
            }
            sums.forEach(
                (key, total) ->
                    amounts.add(
                        b.obj()
                            .put("kind", key.split(":")[0])
                            .put("currency", key.split(":")[1])
                            .put("amount", total.toPlainString())
                            .put("resourceCount", counts.get(key))));
          }
          out.add(x);
        });
    return out;
  }

  @GetMapping("/resources/creator-summary")
  public List<ObjectNode> creatorSummary(HttpServletRequest req) {
    auth.require(req, "resource.read");
    Map<String, List<ObjectNode>> groups =
        b.scopedResources(req).stream()
            .collect(
                Collectors.groupingBy(
                    r -> r.path("createdBy").asText(r.path("creatorId").asText())));
    List<ObjectNode> out = new ArrayList<>();
    groups.forEach(
        (creator, rows) -> {
          ObjectNode r =
              b.obj()
                  .put("creatorId", creator)
                  .put("creatorName", text(rows.get(0), "creatorName"))
                  .put("creatorUsername", text(rows.get(0), "creatorUsername"))
                  .put("resourceCount", rows.size());
          java.math.BigDecimal amount = java.math.BigDecimal.ZERO;
          int count = 0;
          for (ObjectNode row : rows) {
            if (row.path("usage").hasNonNull("amount")) {
              amount = amount.add(BusinessSupport.amount(row.path("usage"), "amount"));
              count++;
            }
          }
          r.put("amountResourceCount", b.member(req) ? 0 : count)
              .put("consumptionAmountUsd", b.member(req) ? "0" : amount.toPlainString());
          out.add(r);
        });
    return out;
  }

  @GetMapping("/resources/overview")
  public ObjectNode overview(HttpServletRequest req) {
    auth.require(req, "resource.read");
    List<ObjectNode> rows =
        b.scopedResources(req).stream()
            .filter(x -> eq(x, "state", "DELIVERED") && eq(x, "dispatchState", "SUCCESS"))
            .toList();
    ObjectNode out = b.obj(), counts = b.obj().put("total", rows.size());
    for (String key :
        List.of(
            "ready",
            "provisioning",
            "invalid",
            "dead",
            "cooling",
            "gone",
            "missingUsage",
            "draining",
            "paused",
            "unknownState")) counts.put(key, 0);
    for (ObjectNode r : rows) {
      String key =
          switch (text(r, "operationalState")) {
            case "READY" -> "ready";
            case "PROVISIONING" -> "provisioning";
            case "INVALID" -> "invalid";
            case "DEAD" -> "dead";
            case "COOLING" -> "cooling";
            case "GONE" -> "gone";
            case "DRAINING" -> "draining";
            case "PAUSED" -> "paused";
            default -> "unknownState";
          };
      counts.put(key, counts.path(key).asInt() + 1);
    }
    out.set("counts", counts);
    for (String window : List.of("fiveHour", "sevenDay"))
      out.set(
          window,
          b.obj()
              .putNull("averageUsedPercent")
              .put("reportedCount", 0)
              .put("exhaustedCount", 0)
              .put("missingCount", rows.size())
              .putNull("remainingEquivalent")
              .putNull("nextResetAt"));
    out.set(
        "dailyConsumption",
        b.obj().put("businessDate", today()).putNull("amount").put("reportedResourceCount", 0));
    return out;
  }

  @GetMapping("/cc-intake/mine")
  public ObjectNode mine(HttpServletRequest req) {
    auth.require(req, "resource.read");
    ObjectNode out =
        b.obj()
            .put("date", today())
            .put("total", 0)
            .put("unknown", 0)
            .put("processing", 0)
            .put("pro", 0)
            .put("nonPro", 0)
            .put("canPro", false)
            .put("accepting", false)
            .put("proBlockReason", "SYSTEM_CLOSED")
            .put("nonProBlockReason", "SYSTEM_CLOSED");
    for (String key : List.of("proAllowance", "nonProAllowance"))
      out.set(
          key,
          b.obj()
              .put("source", "SUPPLIER")
              .put("used", 0)
              .putNull("limit")
              .put("remaining", 0)
              .put("reservedRemaining", 0));
    return out;
  }

  // NewAPI submissions are local durable material records; no external dispatch is implied.
  @PostMapping("/resource-intakes/recognize")
  public ObjectNode recognize(@RequestBody ObjectNode body, HttpServletRequest req) {
    auth.require(req, "resource.write");
    String input = text(body, "text").trim();
    if (input.isBlank() || input.length() > 200000) throw new ApiException(400, "请填写200KB以内的交付资料");
    try {
      JsonNode parsed = store.json.readTree(input);
      if (parsed.isObject() && (parsed.has("channel") || parsed.has("requests"))) {
        previewRequest(parsed);
        ObjectNode out = b.obj().put("recognized", true).put("raw", true);
        out.set("request", parsed);
        return out;
      }
    } catch (ApiException e) {
      throw e;
    } catch (Exception ignored) {
    }
    int type = body.path("channelType").asInt(0);
    if (type == 0) {
      if (input.startsWith("sk-ant-")) type = 14;
      else if (input.startsWith("sk-")) type = 1;
      else return b.obj().put("recognized", false).put("message", "无法唯一识别，请选择资源类型后重试");
    }
    ObjectNode channel =
        b.obj()
            .put("type", type)
            .put("name", "供应商交付")
            .put("key", input)
            .put("base_url", "")
            .put("models", "");
    ObjectNode request =
        b.obj()
            .put("mode", input.contains("\n") ? "batch" : "single")
            .put("multi_key_mode", "random");
    request.set("channel", channel);
    ObjectNode out = b.obj().put("recognized", true);
    out.set("request", request);
    return out;
  }

  private List<ObjectNode> previewRequest(JsonNode body) {
    List<ObjectNode> requests = new ArrayList<>();
    if (body.has("requests")) {
      if (!body.path("requests").isArray()) throw new ApiException(400, "requests须为数组");
      for (JsonNode x : body.path("requests")) requests.addAll(previewRequest(x));
      return requests;
    }
    if (!body.isObject() || !body.path("channel").isObject())
      throw new ApiException(400, "请粘贴包含mode和channel的资料对象");
    ObjectNode input = (ObjectNode) body, channel = (ObjectNode) body.path("channel");
    required(channel, "key");
    int type = channel.path("type").asInt(0);
    if (!Set.of(1, 3, 14, 24, 33, 41, 60).contains(type)) throw new ApiException(400, "不支持的资源类型");
    if (type == 3 && text(channel, "base_url").isBlank())
      throw new ApiException(400, "Azure交付需要Endpoint地址");
    String mode = text(input, "mode");
    if (!Set.of("single", "batch", "multi_to_single").contains(mode))
      throw new ApiException(400, "无效的添加模式");
    if (mode.equals("batch")) {
      for (String key : text(channel, "key").split("\\R"))
        if (!key.isBlank()) {
          ObjectNode item = input.deepCopy();
          ((ObjectNode) item.path("channel")).put("key", key.trim());
          item.put("mode", "single");
          requests.add(item);
        }
    } else requests.add(input.deepCopy());
    if (requests.isEmpty() || requests.size() > 1000) throw new ApiException(400, "每次应提交1至1000份资料");
    return requests;
  }

  @PostMapping("/resource-intakes/preview")
  public ObjectNode preview(@RequestBody ObjectNode body, HttpServletRequest req) {
    auth.require(req, "resource.write");
    List<ObjectNode> requests = previewRequest(body);
    return b.obj()
        .put("resourceCount", requests.size())
        .put(
            "keyCount",
            requests.stream()
                .mapToInt(x -> text(x.path("channel"), "key").split("\\R").length)
                .sum());
  }

  @PostMapping("/resource-intakes")
  @Transactional
  public ObjectNode submit(@RequestBody ObjectNode body, HttpServletRequest req) {
    auth.require(req, "resource.write");
    auth.require(req, "resource.intake.manage");
    required(body, "requestKey");
    String owner = b.tenant(req, body), key = text(body, "requestKey");
    b.requireApprovedSupplier(req, owner);
    List<ObjectNode> requests = previewRequest(body.path("request"));
    String submissionHash = submissionHash(owner, text(body, "name"), requests);
    store.jdbc.queryForObject(
        "select pg_advisory_xact_lock(hashtext(?),hashtext(?))", (r, n) -> true, owner, key);
    List<ObjectNode> previous =
        b.owned("intake", req).stream()
            .filter(x -> eq(x, "supplierId", owner) && eq(x, "requestKey", key))
            .toList();
    ObjectNode out = b.obj();
    ArrayNode ids = out.putArray("resourceIds");
    if (!previous.isEmpty()) {
      String previousHash = text(previous.get(0), "submissionHash");
      if (previousHash.isBlank()) {
        List<ObjectNode> priorRequests =
            previous.stream()
                .sorted(Comparator.comparingInt(x -> x.path("requestIndex").asInt()))
                .map(x -> (ObjectNode) x.path("originalRequest"))
                .toList();
        previousHash =
            submissionHash(owner, text(previous.get(0), "submissionName"), priorRequests);
      }
      if (!submissionHash.equals(previousHash))
        throw new ApiException(409, "该提交编号已用于不同的交付资料，请重新核对后使用新编号");
      previous.forEach(x -> ids.add(text(x, "id")));
      return out;
    }
    int index = 0;
    for (ObjectNode input : requests) {
      JsonNode ch = input.path("channel");
      String name = text(body, "name").isBlank() ? text(ch, "name") : text(body, "name");
      ObjectNode data =
          b.obj()
              .put("name", name.isBlank() ? "供应商交付" : name)
              .put("supplierId", owner)
              .put("resourceType", "NEWAPI_INTAKE")
              .put("assignmentState", "UNASSIGNED")
              .put("state", "UNASSIGNED")
              .put("dispatchState", "NOT_SUBMITTED")
              .put("sourceKind", "WEB")
              .put("createdBy", auth.userId(req))
              .put("creatorId", auth.userId(req))
              .put("creatorName", text(auth.user(req), "displayName"))
              .put("receivedAt", Instant.now().toString())
              .put("requestKey", key)
              .put("submissionHash", submissionHash)
              .put("submissionName", text(body, "name"))
              .put("requestIndex", index++)
              .put("memberCount", text(ch, "key").split("\\R").length)
              .put("channelType", ch.path("type").asInt())
              .put("localOnly", true);
      ArrayNode models = data.putArray("modelSummary");
      for (String m : text(ch, "models").split(",")) if (!m.isBlank()) models.add(m.trim());
      data.set(
          "configuration",
          b.obj()
              .put("type", ch.path("type").asInt())
              .put("base_url", text(ch, "base_url"))
              .put("models", text(ch, "models")));
      data.set("originalRequest", input);
      data.set("material", input);
      ids.add(text(store.create("intake", owner, data), "id"));
    }
    return out;
  }

  private String submissionHash(String owner, String name, List<ObjectNode> requests) {
    ObjectNode payload = b.obj().put("supplierId", owner).put("name", name.trim());
    payload.set("requests", b.arr(requests));
    try {
      return HexFormat.of()
          .formatHex(
              MessageDigest.getInstance("SHA-256")
                  .digest(canonical(payload).toString().getBytes(StandardCharsets.UTF_8)));
    } catch (Exception e) {
      throw new IllegalStateException(e);
    }
  }

  private JsonNode canonical(JsonNode node) {
    if (node.isObject()) {
      ObjectNode out = b.obj();
      List<String> names = new ArrayList<>();
      node.fieldNames().forEachRemaining(names::add);
      Collections.sort(names);
      names.forEach(name -> out.set(name, canonical(node.path(name))));
      return out;
    }
    if (node.isArray()) {
      ArrayNode out = store.json.createArrayNode();
      node.forEach(value -> out.add(canonical(value)));
      return out;
    }
    return node;
  }

  private ObjectNode intake(String id, HttpServletRequest req) {
    ObjectNode data = b.get("intake", id, req);
    if (data.path("deleted").asBoolean() || !b.canResource(data, req))
      throw new ApiException(404, "资源不存在或无权访问");
    return data;
  }

  @GetMapping("/resource-intakes/{id}")
  public ObjectNode intakeDetail(@PathVariable String id, HttpServletRequest req) {
    auth.require(req, "resource.read");
    ObjectNode d = intake(id, req).deepCopy();
    d.remove(List.of("originalRequest", "material"));
    return b.publicRecord("intake", d, req);
  }

  private void requireRaw(HttpServletRequest req) {
    if (auth.platform(req)) throw new ApiException(403, "平台运营账号不可读取供应商原始凭据");
    auth.require(req, "resource.sensitive");
  }

  @PostMapping("/resource-intakes/{id}/original-request")
  public ObjectNode original(@PathVariable String id, HttpServletRequest req) {
    requireRaw(req);
    auth.require(req, "resource.request.read");
    ObjectNode out = b.obj();
    out.set("originalRequest", intake(id, req).path("originalRequest"));
    return out;
  }

  @PostMapping("/resource-intakes/{id}/material")
  public JsonNode material(@PathVariable String id, HttpServletRequest req) {
    requireRaw(req);
    return intake(id, req).path("material");
  }

  @GetMapping("/resource-intakes/{id}/eligible-projects")
  public List<ObjectNode> intakeProjects(@PathVariable String id, HttpServletRequest req) {
    auth.require(req, "resource.intake.manage");
    ObjectNode old = intake(id, req);
    String supplierId = b.entityOwner("intake", id, req);
    return b.eligibleForSupplier(req, supplierId).stream()
        .filter(x -> b.acceptsIntakeType(x, old.path("channelType").asInt()))
        .map(p -> b.publicRecord("project", p, req))
        .toList();
  }

  @PostMapping("/resource-intakes/{id}/assign-project")
  @Transactional
  public ObjectNode assign(
      @PathVariable String id, @RequestBody ObjectNode body, HttpServletRequest req) {
    auth.require(req, "resource.intake.manage");
    ObjectNode old = intake(id, req);
    if (!eq(old, "assignmentState", "UNASSIGNED")) throw new ApiException(409, "该资料已经分配项目");
    String supplierId = b.entityOwner("intake", id, req);
    ObjectNode project =
        b.eligibleForSupplier(req, supplierId).stream()
            .filter(x -> eq(x, "id", text(body, "projectId")))
            .findFirst()
            .orElseThrow(() -> new ApiException(409, "此资源所属供应商没有该项目的唯一有效报价"));
    if (!b.acceptsIntakeType(project, old.path("channelType").asInt()))
      throw new ApiException(409, "接口资源类型与项目适用类型不匹配");
    if (!text(body, "quoteToken").equals(text(project, "quoteToken")))
      throw new ApiException(409, "报价已变化，请重新读取");
    ObjectNode p = b.pick(body, "version");
    p.put("projectId", text(project, "id"))
        .put("projectName", text(project, "name"))
        .put("projectCategory", text(project, "category"))
        .put("projectCategoryName", text(project, "categoryName"))
        .put("assignmentState", "ASSIGNED")
        .put("state", "ASSIGNED")
        .put("assignedAt", Instant.now().toString());
    p.set("quoteBasis", project.path("quoteBasis"));
    ObjectNode assigned = b.update("intake", id, req, p).deepCopy();
    assigned.remove(List.of("material", "originalRequest"));
    return b.publicRecord("intake", assigned, req);
  }
}
