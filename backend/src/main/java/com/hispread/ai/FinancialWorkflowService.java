package com.hispread.ai;

import org.springframework.stereotype.Service;

/** Legacy compatibility: financial confirmation always requires an explicit business action. */
@Service
public class FinancialWorkflowService {
  public int confirmOverdue() {
    return 0;
  }
}
