package com.hispread.ai;

import com.fasterxml.jackson.databind.node.*;
import jakarta.servlet.http.*;
import java.nio.charset.StandardCharsets;
import java.security.*;
import java.time.*;
import java.util.*;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping({"/api/auth/api-tokens", "/api/users/{userId}/api-tokens"})
public class TokenController {
  private final Store s;
  private final AuthService a;

  public TokenController(Store s, AuthService a) {
    this.s = s;
    this.a = a;
  }

  private String owner(HttpServletRequest r) {
    String path = r.getRequestURI();
    if (path.startsWith("/api/users/")) {
      a.require(r, "system.users");
      if (!a.admin(r)) throw new ApiException(403, "仅最高管理员可管理其他账号密钥");
      String id = path.substring("/api/users/".length()).split("/")[0];
      a.findUser(id);
      return id;
    }
    return a.userId(r);
  }

  private String hash(String value) {
    try {
      return HexFormat.of()
          .formatHex(
              MessageDigest.getInstance("SHA-256").digest(value.getBytes(StandardCharsets.UTF_8)));
    } catch (Exception e) {
      throw new IllegalStateException(e);
    }
  }

  private ObjectNode publicToken(ObjectNode t) {
    ObjectNode d = t.deepCopy();
    d.remove("hash");
    return d;
  }

  @GetMapping
  public Object list(HttpServletRequest r) {
    return s.list("api-token", owner(r)).stream().map(this::publicToken).toList();
  }

  private String secret() {
    return "hp_" + SessionGuard.token();
  }

  private ObjectNode issue(ObjectNode b, HttpServletRequest r, String id) {
    int days = b.path("days").asInt(90);
    if (days < 1 || days > 365) throw new ApiException(400, "有效期需为1–365天");
    String key = secret();
    ObjectNode d = s.object();
    d.put("name", b.path("name").asText("API 密钥"))
        .put("hash", hash(key))
        .put("tail", key.substring(key.length() - 4))
        .put("enabled", true)
        .put("expiresAt", Instant.now().plus(Duration.ofDays(days)).toString())
        .putNull("lastUsedAt")
        .put("revealable", false);
    ObjectNode saved =
        id == null ? s.create("api-token", owner(r), d) : s.update("api-token", id, owner(r), d);
    ObjectNode response = publicToken(saved);
    response.put("key", key);
    return response;
  }

  @PostMapping
  public Object create(@RequestBody ObjectNode b, HttpServletRequest r) {
    return issue(b, r, null);
  }

  @PostMapping("/{id}/reset")
  public Object reset(@PathVariable String id, @RequestBody ObjectNode b, HttpServletRequest r) {
    s.get("api-token", id, owner(r));
    return issue(b, r, id);
  }

  @PostMapping("/{id}/revoke")
  public Object revoke(@PathVariable String id, HttpServletRequest r) {
    ObjectNode p = s.object();
    p.put("enabled", false);
    return publicToken(s.update("api-token", id, owner(r), p));
  }

  @PostMapping("/{id}/reveal")
  public Object reveal(@PathVariable String id, HttpServletRequest r) {
    s.get("api-token", id, owner(r));
    throw new ApiException(403, "密钥仅在创建和重置时展示，无法再次查询明文");
  }
}
