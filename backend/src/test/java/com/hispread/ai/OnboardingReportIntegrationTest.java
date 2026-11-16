package com.hispread.ai;

import static org.junit.jupiter.api.Assertions.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import java.time.*;
import java.util.*;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpSession;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

@SpringBootTest
@AutoConfigureMockMvc
@Transactional
class OnboardingReportIntegrationTest {
  @Autowired Store store;
  @Autowired AuthService auth;
  @Autowired MockMvc mvc;
  @Autowired OnboardingReportService reports;

  record Client(String id, String owner, MockHttpSession session) {}

  Client client(String role, String owner) {
    String id = UUID.randomUUID().toString();
    ObjectNode user = store.object().put("id", id).put("username", "onboarding-report-" + id)
        .put("role", role).put("version", 0).put("mustChangePassword", false).put("onboardingRequired", false);
    if (owner == null) user.putNull("supplierId"); else user.put("supplierId", owner);
    user.set("permissions", auth.rolePermissions(role));
    user.putArray("projectIds");
    auth.createUser(user, "ReportFixture@123");
    MockHttpSession session = new MockHttpSession();
    session.setAttribute("uid", id); session.setAttribute("sv", 0L);
    return new Client(id, owner, session);
  }

  String supplier() {
    String id = UUID.randomUUID().toString();
    store.create("supplier", id, store.object().put("id", id).put("name", "Report supplier")
        .put("code", "REPORT-" + id).put("enabled", true).put("state", "APPROVED"));
    return id;
  }

  ObjectNode resource(Client client) {
    return store.create("resource", client.owner, store.object().put("supplierId", client.owner)
        .put("name", "Report account").put("resourceType", "CCMAX").put("createdBy", client.id)
        .put("operationalState", "ACTIVE"));
  }

  ObjectNode receipt(Client client, ObjectNode resource, String type, String state, String at) {
    ObjectNode operation = store.object().put("supplierId", client.owner).put("resourceId", resource.path("id").asText())
        .put("type", type).put("state", state).put("createdAt", at).put("finishedAt", at);
    operation.putObject("request").put("code", "PRIVATE-CALLBACK");
    operation.putObject("result").put("access_token", "PRIVATE-TOKEN");
    return store.create("resource-operation", client.owner, operation);
  }

  ObjectNode query(Client client, String from, String to) throws Exception {
    String json = mvc.perform(get("/api/reports/onboarding").session(client.session)
            .param("from", from).param("to", to))
        .andExpect(status().isOk()).andReturn().getResponse().getContentAsString();
    assertFalse(json.contains("PRIVATE"));
    return store.parse(json);
  }

  @Test
  void dailyCountsRequireFirstCreationReceiptAndKeepArchivedHistoryAcrossShanghaiBoundary() throws Exception {
    Client own = client("SUPPLIER", supplier()), foreign = client("SUPPLIER", supplier());
    String before = "2026-11-09T15:59:59Z", after = "2026-11-09T16:00:01Z";
    ObjectNode first = resource(own);
    receipt(own, first, "SUBMIT", "SUCCESS", before);
    receipt(own, first, "DISPATCH", "SUCCESS", after);
    ObjectNode archived = resource(own);
    store.update("resource", archived.path("id").asText(), own.owner,
        store.object().put("deleted", true).put("operationalState", "GONE"));
    receipt(own, archived, "OAUTH_COMPLETE", "SUCCESS", after);
    receipt(own, resource(own), "REAUTHORIZATIONS/session", "SUCCESS", after);
    ObjectNode associated = resource(own);
    ObjectNode association = receipt(own, associated, "OAUTH_COMPLETE", "SUCCESS", after);
    store.update("resource-operation", association.path("id").asText(), own.owner,
        store.object().set("oauthBinding", store.object().put("accountId", "existing-account")));
    ObjectNode updated = resource(own);
    ObjectNode overwrite = receipt(own, updated, "OAUTH_COMPLETE", "SUCCESS", after);
    store.update("resource-operation", overwrite.path("id").asText(), own.owner,
        store.object().set("result", store.object().put("existingAccountUpdated", true)));
    ObjectNode channel = resource(own);
    store.update("resource", channel.path("id").asText(), own.owner, store.object().put("upstreamChannelId", "148"));
    receipt(own, channel, "OAUTH_COMPLETE", "SUCCESS", after);
    receipt(foreign, resource(foreign), "OAUTH_COMPLETE", "SUCCESS", after);
    ObjectNode day = query(own, "2026-11-10", "2026-11-10");
    assertEquals(1, day.path("summary").path("success").asInt());
    assertEquals(1, day.path("daily").path(0).path("success").asInt());
    assertEquals(1, day.path("suppliers").path(0).path("success").asInt());
    assertEquals(archived.path("id"), day.path("details").path("items").path(0).path("resourceId"));
    assertEquals(1, query(own, "2026-11-09", "2026-11-09").path("total").asInt());
    ObjectNode both = query(own, "2026-11-09", "2026-11-10");
    assertEquals(2, both.path("total").asInt());
    assertEquals(2, both.path("details").path("total").asInt());
  }

  @Test
  void failedPendingAndLaterSuccessAreDistinctResourceOutcomesAndDateFiltersActuallyApply() throws Exception {
    Client client = client("SUPPLIER", supplier());
    ObjectNode pending = resource(client), failed = resource(client), recovered = resource(client);
    store.update("resource", recovered.path("id").asText(), client.owner,
        store.object().put("dispatchState", "PENDING").put("submittedAt", "2026-11-09T18:00:00Z"));
    receipt(client, pending, "OAUTH_COMPLETE", "UNKNOWN", "2026-11-09T17:00:00Z");
    receipt(client, pending, "OAUTH_COMPLETE", "PENDING", "2026-11-09T18:00:00Z");
    receipt(client, failed, "SUBMIT", "FAILED", "2026-11-09T18:00:00Z");
    receipt(client, recovered, "SUBMIT", "FAILED", "2026-11-09T18:00:00Z");
    receipt(client, recovered, "OAUTH_COMPLETE", "SUCCESS", "2026-11-10T18:00:00Z");
    ObjectNode day = query(client, "2026-11-10", "2026-11-10");
    assertEquals(0, day.path("summary").path("success").asInt());
    assertEquals(1, day.path("summary").path("failed").asInt());
    assertEquals(1, day.path("summary").path("pending").asInt());
    ObjectNode following = query(client, "2026-11-11", "2026-11-11");
    assertEquals(1, following.path("summary").path("success").asInt());
    assertEquals(0, following.path("summary").path("failed").asInt());
    assertEquals(0, following.path("summary").path("pending").asInt());
    assertEquals(0, query(client, "2026-11-12", "2026-11-12").path("total").asInt());
    mvc.perform(get("/api/reports/onboarding").session(client.session)
        .param("from", "2026-11-12").param("to", "2026-11-10")).andExpect(status().isBadRequest());
    mvc.perform(get("/api/reports/onboarding").session(client.session)
        .param("from", "2020-01-01").param("to", "2026-11-10")).andExpect(status().isBadRequest());
    mvc.perform(get("/api/reports/onboarding").session(client.session)
        .param("page", "2147483647")).andExpect(status().isBadRequest());
  }

  @Test
  void committedIntakeSuccessKeepsItsOriginalDayWhenReceiptIsReadAgainLater() throws Exception {
    Client client = client("SUPPLIER", supplier());
    ObjectNode resource = resource(client);
    ObjectNode operation = receipt(client, resource, "OAUTH_COMPLETE", "SUCCESS", "2026-11-11T18:00:00Z");
    store.create("intake-ledger", client.owner, store.object().put("id", operation.path("id").asText())
        .put("supplierId", client.owner).put("resourceId", resource.path("id").asText())
        .put("state", "SUCCESS").put("completedAt", "2026-11-09T18:00:00Z"));
    store.update("resource-operation", operation.path("id").asText(), client.owner,
        store.object().put("intakeLedgerId", operation.path("id").asText()));
    assertEquals(1, query(client, "2026-11-10", "2026-11-10").path("total").asInt());
    assertEquals(0, query(client, "2026-11-12", "2026-11-12").path("total").asInt());
  }

  @Test
  void reportDatesRejectMalformedAndExtremeYearsAndSupportUiBoundaryDates() throws Exception {
    Client client = client("SUPPLIER", supplier());
    for (String invalid : List.of("", "2026-2-03", "2026-02-30", "0000-01-01",
        "-999999999-01-01", "+999999999-12-31", "+10000-01-01", "2026-11-16T00:00:00Z")) {
      mvc.perform(get("/api/reports/onboarding").session(client.session).param("to", invalid))
          .andExpect(status().isBadRequest()).andExpect(jsonPath("$.code").value("INVALID_REPORT_DATE"));
      mvc.perform(get("/api/reports/onboarding").session(client.session)
              .param("from", invalid).param("to", "2026-11-16"))
          .andExpect(status().isBadRequest()).andExpect(jsonPath("$.code").value("INVALID_REPORT_DATE"));
    }
    ObjectNode lastDay = query(client, "9999-12-31", "9999-12-31");
    assertEquals(1, lastDay.path("daily").size());
    assertEquals("9999-12-31", lastDay.path("daily").path(0).path("date").asText());
    mvc.perform(get("/api/reports/onboarding").session(client.session).param("to", "0001-01-01"))
        .andExpect(status().isOk()).andExpect(jsonPath("$.from").value("0001-01-01"))
        .andExpect(jsonPath("$.to").value("0001-01-01"))
        .andExpect(jsonPath("$.daily.length()").value(1));
  }

  @Test
  void legacyConfirmedResourceDateOverridesAnOldPendingReceiptAndLaterReadbacks() throws Exception {
    Client client = client("SUPPLIER", supplier());
    ObjectNode resource = resource(client);
    ObjectNode operation = receipt(client, resource, "SUBMIT", "SUCCESS", "2026-11-09T18:00:00Z");
    store.update("resource", resource.path("id").asText(), client.owner,
        store.object().put("dispatchState", "SUCCESS").put("submittedAt", "2026-11-10T18:00:00Z"));
    assertEquals(0, query(client, "2026-11-10", "2026-11-10").path("total").asInt());
    assertEquals(1, query(client, "2026-11-11", "2026-11-11").path("total").asInt());
    store.update("resource-operation", operation.path("id").asText(), client.owner,
        store.object().put("finishedAt", "2026-11-12T18:00:00Z"));
    assertEquals(1, query(client, "2026-11-11", "2026-11-11").path("total").asInt());
    assertEquals(0, query(client, "2026-11-13", "2026-11-13").path("total").asInt());
  }

  @Test
  void operatorSupplierAndMemberProjectScopesAlsoConstrainDeletedHistoricalResources() throws Exception {
    Client operator = client("OPERATOR", null), first = client("SUPPLIER", supplier()), second = client("SUPPLIER", supplier());
    store.update("supplier", first.owner, first.owner, store.object().put("ownerUserId", operator.id));
    ObjectNode own = resource(first), other = resource(second);
    receipt(first, own, "OAUTH_COMPLETE", "SUCCESS", "2026-11-09T18:00:00Z");
    receipt(second, other, "OAUTH_COMPLETE", "SUCCESS", "2026-11-09T18:00:00Z");
    assertEquals(1, query(operator, "2026-11-10", "2026-11-10").path("total").asInt());
    mvc.perform(get("/api/reports/onboarding").session(operator.session).param("supplierId", second.owner)
            .param("from", "2026-11-10").param("to", "2026-11-10"))
        .andExpect(status().isOk()).andExpect(jsonPath("$.total").value(0));
    Client member = client("SUPPLIER_AGENT", first.owner), teammate = client("SUPPLIER_AGENT", first.owner);
    String project = store.create("project", "GLOBAL", store.object().put("enabled", true).put("name", "Report project")).path("id").asText();
    ObjectNode memberResource = resource(member), teammateResource = resource(teammate);
    for (ObjectNode row : List.of(memberResource, teammateResource))
      store.update("resource", row.path("id").asText(), first.owner, store.object().put("projectId", project).put("deleted", true));
    receipt(member, memberResource, "OAUTH_COMPLETE", "SUCCESS", "2026-11-09T18:00:00Z");
    receipt(teammate, teammateResource, "OAUTH_COMPLETE", "SUCCESS", "2026-11-09T18:00:00Z");
    MockHttpServletRequest request = new MockHttpServletRequest(); request.setSession(member.session);
    assertEquals(0, reports.report(Map.of("from", "2026-11-10", "to", "2026-11-10"), request).path("total").asInt());
    ObjectNode profile = auth.findUser(member.id); profile.putArray("projectIds").add(project); auth.saveUser(profile);
    assertEquals(1, reports.report(Map.of("from", "2026-11-10", "to", "2026-11-10"), request).path("total").asInt());
    mvc.perform(get("/api/reports/onboarding").session(member.session)).andExpect(status().isForbidden());
    Client finance = client("FINANCE", null);
    mvc.perform(get("/api/reports/onboarding").session(finance.session)).andExpect(status().isForbidden());
  }

  @Test
  void legacyDailyAndSupplierRowsContainDateDimensionAndSuccessTotalsMatchCanonicalEndpoint() throws Exception {
    Client supplier = client("SUPPLIER", supplier()), admin = client("ADMIN", null);
    ObjectNode resource = resource(supplier);
    receipt(supplier, resource, "OAUTH_COMPLETE", "SUCCESS", "2026-11-09T18:00:00Z");
    for (String endpoint : List.of("/api/reports/ccmax-resources", "/api/reports/ccmax-resources/suppliers")) {
      String response = mvc.perform(get(endpoint).session(admin.session).param("supplierId", supplier.owner)
              .param("from", "2026-11-10").param("to", "2026-11-10"))
          .andExpect(status().isOk()).andExpect(jsonPath("$.total").value(1))
          .andExpect(jsonPath("$.rows[0].createdDate").value("2026-11-10"))
          .andExpect(jsonPath("$.rows[0].supplierId").value(supplier.owner))
          .andExpect(jsonPath("$.rows[0].operationalState").value("ACTIVE"))
          .andReturn().getResponse().getContentAsString();
      JsonNode data = store.json.readTree(response);
      assertEquals(1, data.path("rows").path(0).path("count").asInt());
      assertEquals("UNKNOWN", data.path("rows").path(0).path("resourceType").asText());
    }
  }
}
