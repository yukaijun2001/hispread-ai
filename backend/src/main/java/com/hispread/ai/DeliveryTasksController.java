package com.hispread.ai;

import static com.hispread.ai.BusinessSupport.*;

import com.fasterxml.jackson.databind.node.ObjectNode;
import jakarta.servlet.http.HttpServletRequest;
import java.util.*;
import org.springframework.web.bind.annotation.*;

/** An index of existing delivery receipts; listing never polls or repeats an upstream write. */
@RestController
@RequestMapping("/api/delivery-tasks")
public class DeliveryTasksController {
  private static final Set<String> TYPES = Set.of(
      "SUBMIT", "DISPATCH", "OAUTH_COMPLETE", "CREDENTIAL-REFRESH", "REAUTHORIZATIONS",
      "LIFECYCLE", "PROXY_REPLACEMENT");
  private static final Set<String> UNCONFIRMED = Set.of("UNKNOWN", "PENDING", "SUBMITTING", "RUNNING");
  private final Store s;
  private final AuthService auth;
  private final BusinessSupport b;
  private final ResourceOperations operations;

  public DeliveryTasksController(Store s, AuthService auth, BusinessSupport b, ResourceOperations operations) {
    this.s = s;
    this.auth = auth;
    this.b = b;
    this.operations = operations;
  }

  private ObjectNode receipt(String id, HttpServletRequest req) {
    ObjectNode operation = operations.getOperation(id, req);
    if (!TYPES.contains(text(operation, "type")) || eq(operation, "supplierId", "GLOBAL"))
      throw new ApiException(404, "上号交付任务不存在");
    return operation;
  }

  private ObjectNode view(ObjectNode op, HttpServletRequest req) {
    ObjectNode out = b.pick(op, "id", "type", "state", "createdAt", "startedAt", "finishedAt");
    String rid = text(op, "resourceId");
    out.put("resourceId", rid).put("needsReview", UNCONFIRMED.contains(text(op, "state")));
    out.put("itemCount", op.path("items").isArray() ? op.path("items").size() : 1);
    if (!rid.isBlank()) {
      ObjectNode resource = b.resource(rid, req);
      out.put("resourceName", text(resource, "name")).put("projectName", text(resource, "projectName"));
    }
    // Never copy request/result bodies, authorization URLs, callbacks, tokens, or proxy credentials.
    return out;
  }

  @GetMapping
  public Object list(@RequestParam Map<String, String> q, HttpServletRequest req) {
    auth.require(req, "resource.read");
    List<ObjectNode> rows = new ArrayList<>();
    for (ObjectNode op : s.list("resource-operation", null)) {
      if (!TYPES.contains(text(op, "type"))) continue;
      try {
        ObjectNode row = view(receipt(text(op, "id"), req), req);
        if (!b.match(row, q, "type", "type") || !b.match(row, q, "state", "state")
            || "true".equals(q.get("needsReview")) && !row.path("needsReview").asBoolean()
            || !b.contains(row, q.get("search"), "resourceName", "projectName", "id")) continue;
        rows.add(row);
      } catch (ApiException denied) {
        if (denied.status != 403 && denied.status != 404) throw denied;
      }
    }
    rows.sort(Comparator.comparing((ObjectNode row) -> text(row, "createdAt")).reversed());
    return b.page(rows, q);
  }

  @PostMapping("/{id}/reconcile")
  public Object reconcile(@PathVariable String id, HttpServletRequest req) {
    auth.require(req, "resource.read");
    ObjectNode op = receipt(id, req);
    if (UNCONFIRMED.contains(text(op, "state"))) operations.reconcile(id, req);
    return view(receipt(id, req), req);
  }
}
