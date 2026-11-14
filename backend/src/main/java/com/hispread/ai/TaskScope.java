package com.hispread.ai;

/** Executable background work is limited to reading delivered-account status. */
final class TaskScope {
  private TaskScope() {}

  static boolean supported(String type) {
    return "CCMAX_STATUS_SYNC".equals(type);
  }

  static ApiException retired() {
    return new ApiException(410, "此自动任务已停用，请在交付、报价或账务页面手动处理", "TASK_RETIRED");
  }

  static void requireSupported(String type) {
    if (!supported(type)) throw retired();
  }
}
