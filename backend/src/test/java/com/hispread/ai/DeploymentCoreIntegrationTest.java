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
  void deliveryScopeMigrationStopsOldPlansWithoutChangingFinancialHistory() throws Exception {
    jdbc.update("delete from hub_entity where kind in ('scheduled-task','scheduled-run','monitoring-source','quote')");
    var quote = store.create("quote","migration-owner",store.object().put("state","APPROVED")
        .put("effectiveTo","2026-12-01").put("multiplier","0.25").put("autoRenewEnabled",true));
    for (String type : java.util.List.of("CCMAX_STATUS_SYNC","CCMAX_DAILY_SYNC","CCMAX_PRIORITY_ROTATION",
        "QUOTE_AUTO_RENEWAL","WORKBENCH_WECOM_REMINDER","SETTLEMENT_AUTO_CONFIRM"))
      store.create("scheduled-task","GLOBAL",store.object().put("id",type).put("key",type).put("type",type)
          .put("enabled",true).put("running",true).put("nextRunAt","2026-12-01T00:00:00Z"));
    var run=store.create("scheduled-run","GLOBAL",store.object().put("state","RUNNING").put("taskKey","CCMAX_DAILY_SYNC"));
    store.create("monitoring-source","GLOBAL",store.object().put("enabled",true));
    var settlement=store.create("settlement","migration-owner",store.object().put("state","PENDING").put("total","20"));
    var input=store.create("input","migration-owner",store.object().put("state","PENDING").put("originalAmount","20"));
    try (var stream=new org.springframework.core.io.ClassPathResource("db/migration/V3__delivery_task_scope.sql").getInputStream()) {
      jdbc.execute(new String(stream.readAllBytes(),java.nio.charset.StandardCharsets.UTF_8));
    }
    for (var task:store.list("scheduled-task",null)) {
      assertFalse(task.path("enabled").asBoolean());assertFalse(task.path("running").asBoolean());
      assertTrue(task.path("nextRunAt").isNull());
      assertEquals(!TaskScope.supported(task.path("type").asText()),task.path("retired").asBoolean());
    }
    assertFalse(store.list("monitoring-source",null).get(0).path("enabled").asBoolean());
    assertEquals("TIMED_OUT",store.get("scheduled-run",run.path("id").asText(),null).path("state").asText());
    var savedQuote=store.get("quote",quote.path("id").asText(),"migration-owner");
    assertFalse(savedQuote.path("autoRenewEnabled").asBoolean());assertEquals("APPROVED",savedQuote.path("state").asText());
    assertEquals("2026-12-01",savedQuote.path("effectiveTo").asText());assertEquals("0.25",savedQuote.path("multiplier").asText());
    assertEquals(settlement,store.get("settlement",settlement.path("id").asText(),"migration-owner"));
    assertEquals(input,store.get("input",input.path("id").asText(),"migration-owner"));
  }

  @Test
  void readinessAndMigrationsAreAvailableBeforeLogin() throws Exception {
    mvc.perform(get("/api/health/live"))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.status").value("UP"));
    mvc.perform(get("/api/health/ready"))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.database").value("UP"));
    assertEquals(
        3,
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
