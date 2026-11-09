package com.hispread.ai;

import java.util.Map;
import java.util.UUID;
import org.springframework.dao.DuplicateKeyException;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestControllerAdvice
public class Errors {
  private static final org.slf4j.Logger log = org.slf4j.LoggerFactory.getLogger(Errors.class);

  private String trace() {
    String id = org.slf4j.MDC.get("requestId");
    return id == null ? UUID.randomUUID().toString() : id;
  }

  @ExceptionHandler(ApiException.class)
  public ResponseEntity<?> api(ApiException e) {
    Map<String, Object> body = new java.util.LinkedHashMap<>();
    body.put("message", e.getMessage());
    body.put("status", e.status);
    body.put("traceId", trace());
    if (e.code != null) body.put("code", e.code);
    return ResponseEntity.status(e.status).body(body);
  }

  @ExceptionHandler(DuplicateKeyException.class)
  public ResponseEntity<?> duplicate(DuplicateKeyException e) {
    return ResponseEntity.status(409).body(Map.of("message", "记录已存在，请检查后重试"));
  }

  @ExceptionHandler({
    IllegalArgumentException.class,
    org.springframework.http.converter.HttpMessageNotReadableException.class
  })
  public ResponseEntity<?> bad(Exception e) {
    return ResponseEntity.badRequest().body(Map.of("message", "请求参数格式不正确"));
  }

  @ExceptionHandler({
    org.springframework.web.bind.MissingServletRequestParameterException.class,
    org.springframework.web.method.annotation.MethodArgumentTypeMismatchException.class,
    org.springframework.web.multipart.MaxUploadSizeExceededException.class
  })
  public ResponseEntity<?> invalid(Exception e) {
    return ResponseEntity.badRequest()
        .body(Map.of("message", "请求字段缺失、类型错误或文件超出大小限制", "traceId", trace()));
  }

  @ExceptionHandler(org.springframework.web.servlet.resource.NoResourceFoundException.class)
  public ResponseEntity<?> missing(Exception e) {
    return ResponseEntity.status(404).body(Map.of("message", "接口或文件不存在", "traceId", trace()));
  }

  @ExceptionHandler(Exception.class)
  public ResponseEntity<?> unexpected(Exception e) {
    log.error("Unhandled server error [{}] {}", trace(), e.getClass().getSimpleName());
    return ResponseEntity.status(500).body(Map.of("message", "服务器暂时无法处理请求", "traceId", trace()));
  }
}
