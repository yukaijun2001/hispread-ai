package com.hispread.ai;

import java.util.Map;
import org.springframework.http.ResponseEntity;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/health")
public class ReadinessController {
  private final JdbcTemplate jdbc;

  public ReadinessController(JdbcTemplate jdbc) {
    this.jdbc = jdbc;
  }

  @GetMapping("/live")
  public Object live() {
    return Map.of("status", "UP");
  }

  @GetMapping("/ready")
  public ResponseEntity<?> ready() {
    try {
      jdbc.queryForObject("select 1", Integer.class);
      return ResponseEntity.ok(Map.of("status", "UP", "database", "UP"));
    } catch (Exception e) {
      return ResponseEntity.status(503).body(Map.of("status", "DOWN", "database", "UNAVAILABLE"));
    }
  }
}
