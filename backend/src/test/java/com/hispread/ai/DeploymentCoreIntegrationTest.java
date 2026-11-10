package com.hispread.ai;

import static org.junit.jupiter.api.Assertions.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.mock.web.MockHttpSession;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

@SpringBootTest
@AutoConfigureMockMvc
@Transactional
class DeploymentCoreIntegrationTest {
  @Autowired MockMvc mvc;
  @Autowired JdbcTemplate jdbc;
  @Autowired SeedData seed;
  @Autowired AuthService auth;
  @Autowired Store store;

  @Test
  void readinessAndMigrationsAreAvailableBeforeLogin() throws Exception {
    mvc.perform(get("/api/health/live"))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.status").value("UP"));
    mvc.perform(get("/api/health/ready"))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.database").value("UP"));
    assertEquals(
        2,
        jdbc.queryForObject(
            "select count(*) from flyway_schema_history where success and type='SQL'",
            Integer.class));
    assertNotNull(jdbc.queryForObject("select to_regclass('spring_session')", String.class));
  }

  @Test
  void cleanProductionBootstrapNeedsNoFixtureAndOnlyCreatesAdministrator() throws Exception {
    jdbc.update("delete from hub_entity");
    jdbc.update("delete from hub_user");
    SeedData target = org.springframework.test.util.AopTestUtils.getTargetObject(seed);
    String mode = target.bootstrapMode,
        user = target.adminUsername,
        password = target.adminPassword,
        fixtures = target.fixtures;
    try {
      target.bootstrapMode = "production";
      target.adminUsername = "production_qa";
      target.adminPassword = "Production@StrongPassword123";
      target.fixtures = "/missing/fixture/production-must-not-read";
      seed.run();
      assertEquals(1, jdbc.queryForObject("select count(*) from hub_user", Integer.class));
      assertEquals(
          0,
          jdbc.queryForObject(
              "select count(*) from hub_entity where kind in"
                  + " ('supplier','project','quote','monitoring')",
              Integer.class));
      assertEquals(
          "ADMIN",
          store
              .parse(jdbc.queryForObject("select profile::text from hub_user", String.class))
              .path("role")
              .asText());
      seed.run();
      assertEquals(1, jdbc.queryForObject("select count(*) from hub_user", Integer.class));
      jdbc.update(
          "update hub_user set id=?, username=?, profile=jsonb_set(profile,'{username}',to_jsonb(cast(? as text)))",
          "local-admin",
          "admin",
          "admin");
      target.adminUsername = "wutong";
      target.adminPassword = "wutong@Qq1.";
      seed.run();
      assertEquals(
          "wutong",
          jdbc.queryForObject("select username from hub_user where id=?", String.class, "local-admin"));
      assertTrue(
          auth.passwords().matches(
              "wutong@Qq1.",
              jdbc.queryForObject(
                  "select password_hash from hub_user where id=?", String.class, "local-admin")));
      seed.run();
      assertEquals(1, jdbc.queryForObject("select count(*) from hub_user", Integer.class));
    } finally {
      target.bootstrapMode = mode;
      target.adminUsername = user;
      target.adminPassword = password;
      target.fixtures = fixtures;
    }
  }

  @Test
  void healthExposesCorrelationIdAndWriteStillRequiresCsrf() throws Exception {
    mvc.perform(get("/api/health/ready")).andExpect(header().exists("X-Request-ID"));
    mvc.perform(
            post("/api/auth/login")
                .session(new MockHttpSession())
                .contentType("application/x-www-form-urlencoded")
                .param("username", "none"))
        .andExpect(status().isForbidden());
  }

  @Test
  void productionRejectsOriginCookieMismatchAndWeakDatabaseSecret() {
    ProductionConfiguration config = new ProductionConfiguration();
    config.origin = "https://supplier.example.com";
    config.secure = false;
    config.databasePassword = "a".repeat(32);
    assertThrows(IllegalStateException.class, config::validate);
    config.secure = true;
    assertDoesNotThrow(config::validate);
    config.databasePassword = "weak";
    assertThrows(IllegalStateException.class, config::validate);
    config.databasePassword = "a".repeat(32);
    config.origin = "https://supplier.example.com/path";
    assertThrows(IllegalStateException.class, config::validate);
  }
}
