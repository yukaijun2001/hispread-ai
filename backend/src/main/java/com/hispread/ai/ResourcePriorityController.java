package com.hispread.ai;

import com.fasterxml.jackson.databind.node.ObjectNode;
import jakarta.servlet.http.HttpServletRequest;
import java.util.*;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/cc-intake/admin/priority/jobs")
public class ResourcePriorityController {
  private final AuthService auth;
  private final ResourceOperations operations;
  private final BusinessSupport b;

  public ResourcePriorityController(
      AuthService auth, ResourceOperations operations, BusinessSupport b) {
    this.auth = auth;
    this.operations = operations;
    this.b = b;
  }

  private void admin(HttpServletRequest req) {
    if (!auth.admin(req)) throw new ApiException(403, "仅最高管理员可调整批量优先级");
    auth.require(req, "resource.dispatch");
  }

  @GetMapping
  public List<ObjectNode> list(HttpServletRequest req) {
    admin(req);
    return operations.listOperations("PRIORITY", req);
  }

  @PostMapping
  public ObjectNode create(@RequestBody ObjectNode body, HttpServletRequest req) {
    admin(req);
    return operations.priority(body, req);
  }

  @GetMapping("/{id}")
  public ObjectNode detail(@PathVariable String id, HttpServletRequest req) {
    admin(req);
    return operations.jobDetail(id, req);
  }

  @PostMapping("/{id}/{action}")
  public ObjectNode action(
      @PathVariable String id, @PathVariable String action, HttpServletRequest req) {
    admin(req);
    if (!Set.of("start", "retry", "reconcile").contains(action))
      throw new ApiException(400, "不支持的优先级操作");
    return operations.priorityAction(id, action, req);
  }
}
