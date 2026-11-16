package com.hispread.ai;

public class ApiException extends RuntimeException {
  public final int status;
  public final String code;
  public final String operationId;

  public ApiException(int status, String message) {
    this(status, message, null);
  }

  public ApiException(int status, String message, String code) {
    this(status, message, code, null);
  }

  public ApiException(int status, String message, String code, String operationId) {
    super(message);
    this.status = status;
    this.code = code;
    this.operationId = operationId;
  }
}
