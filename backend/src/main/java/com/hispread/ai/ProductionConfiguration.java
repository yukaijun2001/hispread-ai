package com.hispread.ai;

import jakarta.annotation.PostConstruct;
import java.net.URI;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Profile;

/** Fail fast on mismatched public-origin/cookie deployment settings. */
@Configuration
@Profile("production")
public class ProductionConfiguration {
  @Value("${app.public-origin:}")
  String origin;

  @Value("${server.servlet.session.cookie.secure:false}")
  boolean secure;

  @Value("${spring.datasource.password:}")
  String databasePassword;

  @PostConstruct
  void validate() {
    URI uri;
    try {
      uri = URI.create(origin);
    } catch (Exception e) {
      throw new IllegalStateException("PUBLIC_ORIGIN must be a valid absolute origin");
    }
    if (uri.getHost() == null
        || uri.getUserInfo() != null
        || uri.getQuery() != null
        || uri.getFragment() != null
        || !("http".equals(uri.getScheme()) || "https".equals(uri.getScheme()))
        || uri.getPath() != null && !uri.getPath().isEmpty())
      throw new IllegalStateException(
          "PUBLIC_ORIGIN must contain only scheme, hostname and optional port");
    if (uri.getScheme().equals("https") && !secure)
      throw new IllegalStateException("HTTPS production PUBLIC_ORIGIN requires COOKIE_SECURE=true");
    if (databasePassword.length() < 20)
      throw new IllegalStateException(
          "Production DATABASE_PASSWORD must contain at least 20 characters");
  }
}
