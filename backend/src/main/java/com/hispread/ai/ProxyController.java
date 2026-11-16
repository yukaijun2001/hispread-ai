package com.hispread.ai;

import com.fasterxml.jackson.databind.node.*;
import jakarta.servlet.http.*;
import java.net.URI;
import java.util.*;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/outbound-proxies")
public class ProxyController {
  private final Store s;
  private final AuthService a;
  private final AccessPolicy access;
  private final ResourceIntegrationGateway gateway;

  public ProxyController(
      Store s, AuthService a, AccessPolicy access, ResourceIntegrationGateway gateway) {
    this.s = s;
    this.a = a;
    this.access = access;
    this.gateway = gateway;
  }

  private ObjectNode publicProxy(ObjectNode p) {
    ObjectNode d = p.deepCopy();
    d.remove("url");
    return d;
  }

  @GetMapping({"", "/page", "/options"})
  public Object list(
      @RequestParam(defaultValue = "1") int page,
      @RequestParam(defaultValue = "50") int size,
      @RequestParam(defaultValue = "") String search,
      @RequestParam(defaultValue = "all") String state,
      @RequestParam(defaultValue = "all") String protocol,
      HttpServletRequest r) {
    a.require(r, "proxy.read");
    return s.page(
        access.visible("proxy", r).stream()
            .filter(p -> search.isBlank() || p.path("name").asText().contains(search))
            .filter(
                p ->
                    state.equals("all") || state.equals("enabled") == p.path("enabled").asBoolean())
            .filter(
                p ->
                    protocol.equals("all")
                        || protocol.equalsIgnoreCase(p.path("protocol").asText()))
            .map(p -> access.publicRecord("proxy", publicProxy(p), r))
            .toList(),
        page,
        size);
  }

  private String ownerForCreate(ObjectNode body, HttpServletRequest r) {
    String owner = a.platform(r) ? body.path("supplierId").asText() : a.owner(r);
    if (owner.isBlank()) throw new ApiException(400, "请选择供应商");
    access.requireSupplier(r, owner);
    return owner;
  }

  private ObjectNode checked(ObjectNode b) {
    String url = b.path("url").asText().trim();
    try {
      URI u = ProxyProbeService.parseProxy(url);
      if (!Set.of("http", "https", "socks5").contains(u.getScheme().toLowerCase())
          || u.getHost() == null
          || u.getPort() < 1) throw new IllegalArgumentException();
      ObjectNode d = s.object();
      for (String f : List.of("name", "url", "enabled", "maxResources", "version"))
        if (b.has(f)) d.set(f, b.get(f));
      d.put("protocol", u.getScheme().toUpperCase())
          .put("host", u.getHost())
          .put("port", u.getPort())
          .put(
              "maskedUrl",
              u.getScheme()
                  + "://"
                  + (u.getUserInfo() == null ? "" : "***@")
                  + u.getHost()
                  + ":"
                  + u.getPort())
          .put("endpoint", u.getHost() + ":" + u.getPort())
          .put("resourceCount", 0)
          .put("usedResources", 0)
          .put("reservedResources", 0)
          .put("editable", true)
          .put("testable", true)
          .put("lastTestState", "NOT_TESTED");
      if (!d.hasNonNull("maxResources")) d.put("maxResources", 0);
      if (!d.path("maxResources").isIntegralNumber() || !d.path("maxResources").canConvertToInt()
          || d.path("maxResources").asInt() < 0) throw new IllegalArgumentException();
      if (!d.has("enabled")) d.put("enabled", true);
      return d;
    } catch (Exception e) {
      throw new ApiException(400, "请填写有效的HTTP、HTTPS或SOCKS5代理URL（含端口）");
    }
  }

  @PostMapping
  public Object create(@RequestBody ObjectNode b, HttpServletRequest r) {
    a.require(r, "proxy.write");
    if (b.path("name").asText().isBlank()) throw new ApiException(400, "请填写代理名称");
    String owner = ownerForCreate(b, r);
    ObjectNode data = checked(b);
    data.put("createdBy", a.userId(r)).put("supplierId", owner);
    return access.publicRecord("proxy", s.create("proxy", owner, data), r);
  }

  @PutMapping("/{id}")
  public Object update(@PathVariable String id, @RequestBody ObjectNode b, HttpServletRequest r) {
    a.require(r, "proxy.write");
    ObjectNode existing = access.get("proxy", id, r);
    ObjectNode p = b.deepCopy();
    if (p.path("url").asText().isBlank())
      p.put("url", access.get("proxy", id, r).path("url").asText());
    return access.publicRecord(
        "proxy", s.update("proxy", id, access.entityOwner("proxy", id, r), checked(p)), r);
  }

  @PostMapping("/import")
  public Object imports(@RequestBody ObjectNode b, HttpServletRequest r) {
    a.require(r, "proxy.write");
    String owner = ownerForCreate(b, r);
    String lines = b.path("lines").asText();
    if (lines.length() > 200000) throw new ApiException(400, "代理文本不能超过200000个字符");
    String[] entries = lines.split("\\R");
    if (entries.length > 500) throw new ApiException(400, "最多导入500行");
    if (b.hasNonNull("maxResources") && (!b.path("maxResources").isIntegralNumber()
        || !b.path("maxResources").canConvertToInt() || b.path("maxResources").asInt() < 0))
      throw new ApiException(400, "代理绑定上限须为非负整数");
    int maximum = 0;
    try {
      maximum = s.get("supplier-settings", owner, null).path("defaultProxyMaxResources").asInt(0);
    } catch (ApiException missing) {
      if (missing.status != 404) throw missing;
    }
    if (b.hasNonNull("maxResources")) maximum = b.path("maxResources").asInt();
    int imported = 0;
    ArrayNode skipped = s.json.createArrayNode();
    for (int index = 0; index < entries.length; index++) {
      String line = entries[index];
      if (line.isBlank()) continue;
      try {
        ObjectNode d = s.object();
        String address = line.trim();
        if (!address.contains("://")) {
          String[] parts = address.split(":", 4);
          if (parts.length == 4)
            address =
                b.path("defaultProtocol").asText("SOCKS5").toLowerCase()
                    + "://"
                    + parts[2]
                    + ":"
                    + parts[3]
                    + "@"
                    + parts[0]
                    + ":"
                    + parts[1];
          else address = b.path("defaultProtocol").asText("SOCKS5").toLowerCase() + "://" + address;
        }
        String candidate = address;
        if (access.visible("proxy", r).stream()
            .anyMatch(p -> owner.equals(p.path("supplierId").asText()) && candidate.equals(p.path("url").asText()))) {
          skipped.addObject().put("line", index + 1).put("reason", "记录已存在");
          continue;
        }
        d.put("name", "代理 " + (imported + 1)).put("url", address);
        d.put("maxResources", maximum);
        ObjectNode data = checked(d).put("createdBy", a.userId(r)).put("supplierId", owner);
        s.create("proxy", owner, data);
        imported++;
      } catch (ApiException e) {
        skipped.addObject().put("line", index + 1).put("reason", "格式无效，需有效的代理地址及端口");
      }
    }
    return Map.of("imported", imported, "skipped", skipped, "skippedCount", skipped.size());
  }

  @GetMapping("/{id}/resources")
  public Object resources(@PathVariable String id, HttpServletRequest r) {
    a.require(r, "proxy.read");
    access.get("proxy", id, r);
    String uid = a.userId(r);
    boolean member = a.user(r).path("role").asText().equals("SUPPLIER_AGENT");
    return access.visible("resource", r).stream()
        .filter(p -> id.equals(p.path("proxyId").asText()))
        .filter(
            p ->
                !member
                    || uid.equals(p.path("createdBy").asText())
                    || uid.equals(p.path("creatorId").asText()))
        .map(
            p -> {
              ObjectNode d = s.object();
              for (String k :
                  List.of("id", "name", "accountName", "projectName", "creatorName", "state"))
                if (p.has(k)) d.set(k, p.get(k));
              return d;
            })
        .toList();
  }

  @GetMapping("/{id}")
  public Object detail(@PathVariable String id, HttpServletRequest r) {
    a.require(r, "proxy.read");
    return access.publicRecord("proxy", access.get("proxy", id, r), r);
  }

  @PostMapping("/resolve")
  public Object resolve(@RequestBody ObjectNode body, HttpServletRequest r) {
    a.require(r, "proxy.read");
    a.require(r, "proxy.write");
    String url = body.path("url").asText().trim();
    for (ObjectNode proxy : access.visible("proxy", r))
      if (url.equals(proxy.path("url").asText())) return access.publicRecord("proxy", proxy, r);
    ObjectNode create = body.deepCopy().put("name", "录入代理");
    return create(create, r);
  }

  @PostMapping("/{id}/test")
  public Object test(@PathVariable String id, HttpServletRequest r) {
    a.require(r, "proxy.write");
    ObjectNode proxy = access.get("proxy", id, r);
    ObjectNode result = gateway.probeProxy(proxy.path("url").asText());
    ObjectNode patch =
        s.object()
            .put("lastTestState", result.path("state").asText())
            .put("lastTestAt", result.path("checkedAt").asText())
            .put("lastLatencyMs", result.path("latencyMs").asLong())
            .put("lastExitIp", result.path("exitIp").asText())
            .put("lastTestMessage", result.path("message").asText());
    s.update("proxy", id, access.entityOwner("proxy", id, r), patch);
    return result;
  }
}
