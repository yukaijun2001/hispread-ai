package com.hispread.ai;

import jakarta.servlet.http.HttpServletRequest;
import java.util.*;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.mvc.method.annotation.RequestMappingHandlerMapping;

/**
 * Administrator-only runtime route inventory to reconcile frontend contracts against the built jar.
 */
@RestController
@RequestMapping("/api/system")
public class ApiRouteInventoryController {
  private final AuthService auth;
  private final RequestMappingHandlerMapping mapping;

  public ApiRouteInventoryController(
      AuthService auth,
      @Qualifier("requestMappingHandlerMapping") RequestMappingHandlerMapping mapping) {
    this.auth = auth;
    this.mapping = mapping;
  }

  @GetMapping("/api-routes")
  public Object routes(HttpServletRequest req) {
    auth.require(req, "system.settings");
    if (!auth.admin(req)) throw new ApiException(403, "仅最高管理员可查看接口清单");
    List<Map<String, Object>> rows = new ArrayList<>();
    mapping
        .getHandlerMethods()
        .forEach(
            (info, handler) -> {
              for (String path : info.getPatternValues())
                if (path.startsWith("/api/"))
                  rows.add(
                      Map.of(
                          "path",
                          path,
                          "methods",
                          info.getMethodsCondition().getMethods().stream()
                              .map(Enum::name)
                              .sorted()
                              .toList(),
                          "controller",
                          handler.getBeanType().getSimpleName()));
            });
    rows.sort(Comparator.comparing(x -> x.get("path").toString()));
    return Map.of("items", rows, "total", rows.size());
  }
}
