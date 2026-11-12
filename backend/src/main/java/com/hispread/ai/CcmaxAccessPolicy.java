package com.hispread.ai;

import com.fasterxml.jackson.databind.node.ObjectNode;
import jakarta.servlet.http.HttpServletRequest;
import java.util.List;
import org.springframework.stereotype.Service;

/** The console capability response and every CCMAX write share these persisted switches. */
@Service
public class CcmaxAccessPolicy {
  private final Store store;
  private final AuthService auth;

  public CcmaxAccessPolicy(Store store, AuthService auth) {
    this.store = store;
    this.auth = auth;
  }

  private ObjectNode global() {
    List<ObjectNode> settings = store.list("settings", null);
    return settings.isEmpty() ? store.object() : settings.get(0);
  }

  private ObjectNode supplier(String owner) {
    if (owner == null || owner.isBlank()) return store.object();
    try {
      return store.get("supplier-settings", owner, null);
    } catch (ApiException missing) {
      if (missing.status != 404) throw missing;
      return store.object();
    }
  }

  public boolean stopped() {
    return global().path("forceStopCcmaxIntake").asBoolean();
  }

  public boolean allowsIntake(String owner) {
    ObjectNode settings = global();
    return !settings.path("forceStopCcmaxIntake").asBoolean()
        && (settings.path("allowAllSuppliersCcmax").asBoolean()
            || supplier(owner).path("allowCcmax").asBoolean());
  }

  public boolean allowsReauthorization(String owner, HttpServletRequest req) {
    return auth.admin(req)
        || global().path("allowAllSuppliersCcmaxReauthorization").asBoolean()
        || supplier(owner).path("allowCcmaxReauthorization").asBoolean();
  }

  private boolean allowsLifecycle(String owner, String action, HttpServletRequest req) {
    return auth.admin(req)
        || supplier(owner)
            .path(action.equals("REMOVE") ? "allowCcmaxSafeRemoval" : "allowCcmaxPause")
            .asBoolean();
  }

  public void requireIntake(String owner) {
    if (stopped())
      throw new ApiException(403, "平台已暂停CCMAX新增上号，已有资源查询和维护不受影响", "CCMAX_INTAKE_STOPPED");
    if (!allowsIntake(owner))
      throw new ApiException(403, "当前供应商未开通CCMAX上号，请联系平台管理员", "CCMAX_INTAKE_DISABLED");
  }

  public void requireReauthorization(String owner, HttpServletRequest req) {
    if (!allowsReauthorization(owner, req))
      throw new ApiException(403, "当前供应商未开通CCMAX重新授权，请联系平台管理员", "CCMAX_REAUTHORIZATION_DISABLED");
  }

  public void requireLifecycle(String owner, String action, HttpServletRequest req) {
    if (!allowsLifecycle(owner, action, req))
      throw new ApiException(403,
          action.equals("REMOVE") ? "当前供应商未开通CCMAX资源移除" : "当前供应商未开通CCMAX资源启停",
          action.equals("REMOVE") ? "CCMAX_REMOVAL_DISABLED" : "CCMAX_PAUSE_DISABLED");
  }

  public ObjectNode capabilities(String owner, boolean configured, boolean direct, HttpServletRequest req) {
    // A platform view without a selected supplier does not grant that supplier intake rights.
    boolean intake = owner != null && !owner.isBlank()
        ? allowsIntake(owner)
        : auth.admin(req) && !stopped();
    return store.object()
        .put("allowCcmax", configured && intake)
        .put("allowDirectCcmax", direct)
        .put("forceStopCcmaxIntake", stopped())
        .put("allowCcmaxReauthorization", configured && allowsReauthorization(owner, req))
        .put("allowCcmaxPause", configured && allowsLifecycle(owner, "PAUSE", req))
        .put("allowCcmaxSafeRemoval", configured && allowsLifecycle(owner, "REMOVE", req))
        .put("externalConfigured", configured)
        .put("message", !configured ? "尚未配置资源上游，本地资料可保存"
            : stopped() ? "平台已暂停CCMAX新增上号，已有资源查询和维护不受影响"
            : !intake ? "当前供应商未开通CCMAX上号，请联系平台管理员"
            : "已配置资源上游，操作结果以真实响应为准");
  }
}
