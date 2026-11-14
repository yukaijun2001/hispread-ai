package com.hispread.ai;

/** The site delivers accounts; ongoing gateway routing is managed by the upstream service. */
final class UpstreamScope {
  private UpstreamScope() {}

  static ApiException retired() {
    return new ApiException(410, "此上游运维功能已停用，请在上游管理台处理；本站保留上号、关联、交付查询和账号维护", "UPSTREAM_FEATURE_RETIRED");
  }
}
