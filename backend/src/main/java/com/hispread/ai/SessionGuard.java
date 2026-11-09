package com.hispread.ai;

import jakarta.servlet.http.*;
import java.security.SecureRandom;
import java.util.*;
import org.springframework.stereotype.Component;
import org.springframework.web.servlet.*;
import org.springframework.web.servlet.config.annotation.*;

@Component
public class SessionGuard implements HandlerInterceptor, WebMvcConfigurer {
  private final AuthService auth;

  @org.springframework.beans.factory.annotation.Value("${app.public-origin:}")
  String publicOrigin;

  public SessionGuard(AuthService auth) {
    this.auth = auth;
  }

  public void addInterceptors(InterceptorRegistry r) {
    r.addInterceptor(this).addPathPatterns("/api/**");
  }

  public boolean preHandle(HttpServletRequest req, HttpServletResponse res, Object handler) {
    String path = req.getRequestURI();
    if (path.startsWith("/api/open/v1/ccmax/")) {
      auth.authenticateBearer(req);
      res.setHeader("Cache-Control", "no-store");
      res.setHeader("X-Content-Type-Options", "nosniff");
      return true;
    }
    boolean open =
        Set.of(
                "/api/health",
                "/api/health/live",
                "/api/health/ready",
                "/api/auth/csrf",
                "/api/auth/login",
                "/api/auth/register",
                "/api/auth/registration-policy")
            .contains(path);
    if (!open) {
      var user = auth.user(req);
      String supplierId = user.path("supplierId").asText("");
      if (!supplierId.isBlank() && !path.startsWith("/api/auth/")) {
        var suppliers = auth.supplierState(supplierId);
        if (suppliers != null && !suppliers.path("enabled").asBoolean(true))
          throw new ApiException(403, "供应商已停用，请联系平台处理", "SUPPLIER_DISABLED");
      }
      if (user.path("mustChangePassword").asBoolean()
          && !Set.of(
                  "/api/auth/me",
                  "/api/auth/password",
                  "/api/auth/password-policy",
                  "/api/auth/logout")
              .contains(path))
        throw new ApiException(403, "首次登录或密码重置后，请先修改密码", "PASSWORD_CHANGE_REQUIRED");
      if (!user.path("mustChangePassword").asBoolean()
          && user.path("onboardingRequired").asBoolean()
          && !Set.of(
                  "/api/auth/me",
                  "/api/auth/onboarding",
                  "/api/auth/logout",
                  "/api/auth/profile",
                  "/api/auth/password",
                  "/api/auth/password-policy")
              .contains(path)) throw new ApiException(403, "请先完善首次登录资料", "ONBOARDING_REQUIRED");
    }
    if (!Set.of("GET", "HEAD", "OPTIONS").contains(req.getMethod())) {
      HttpSession s = req.getSession(false);
      String expected = s == null ? null : (String) s.getAttribute("csrf");
      String actual = req.getHeader("X-CSRF-TOKEN");
      if (expected == null
          || actual == null
          || !java.security.MessageDigest.isEqual(
              expected.getBytes(java.nio.charset.StandardCharsets.UTF_8),
              actual.getBytes(java.nio.charset.StandardCharsets.UTF_8)))
        throw new ApiException(403, "安全校验失败，请刷新后重试");
      String origin = req.getHeader("Origin");
      if (origin != null) {
        try {
          var o = new java.net.URI(origin);
          String host = req.getHeader("Host");
          boolean configured = publicOrigin != null && !publicOrigin.isBlank();
          boolean sameOrigin =
              configured
                  ? o.getScheme().equalsIgnoreCase(new java.net.URI(publicOrigin).getScheme())
                      && o.getRawAuthority()
                          .equalsIgnoreCase(new java.net.URI(publicOrigin).getRawAuthority())
                  : o.getRawAuthority().equalsIgnoreCase(host);
          if (!sameOrigin) throw new ApiException(403, "请求来源校验失败");
        } catch (java.net.URISyntaxException e) {
          throw new ApiException(403, "请求来源校验失败");
        }
      }
    }
    res.setHeader("X-Content-Type-Options", "nosniff");
    res.setHeader("Cache-Control", "no-store");
    return true;
  }

  public void afterCompletion(
      HttpServletRequest req, HttpServletResponse res, Object handler, Exception ex) {
    if (Set.of("GET", "HEAD", "OPTIONS").contains(req.getMethod())
        || !req.getRequestURI().startsWith("/api/")
        || req.getRequestURI().equals("/api/auth/login")) return;
    try {
      com.fasterxml.jackson.databind.node.ObjectNode user = auth.user(req);
      auth.audit(req.getRequestURI(), req.getMethod(), user, res.getStatus());
    } catch (Exception ignored) {
    }
  }

  public static String token() {
    byte[] b = new byte[32];
    new SecureRandom().nextBytes(b);
    return Base64.getUrlEncoder().withoutPadding().encodeToString(b);
  }
}
