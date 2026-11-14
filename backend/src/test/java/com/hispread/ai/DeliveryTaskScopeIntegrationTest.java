package com.hispread.ai;

import static org.junit.jupiter.api.Assertions.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.node.*;
import java.time.*;
import java.util.*;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.mock.web.MockHttpSession;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

@SpringBootTest
@AutoConfigureMockMvc
@Transactional
class DeliveryTaskScopeIntegrationTest {
  @Autowired Store s;
  @Autowired AuthService auth;
  @Autowired MockMvc mvc;

  record Client(String id, String owner, MockHttpSession session, String csrf) {}

  Client client(String role, String owner) throws Exception {
    String id = UUID.randomUUID().toString();
    ObjectNode user = s.object().put("id",id).put("username","delivery-scope-"+id).put("role",role)
        .put("version",0).put("mustChangePassword",false).put("onboardingRequired",false);
    if (owner == null) user.putNull("supplierId"); else user.put("supplierId",owner);
    user.set("permissions",auth.rolePermissions(role));
    user.putArray("projectIds");
    auth.createUser(user,"FixtureTest@123");
    MockHttpSession session = new MockHttpSession(); session.setAttribute("uid",id);session.setAttribute("sv",0L);
    String csrf=s.json.readTree(mvc.perform(get("/api/auth/csrf").session(session)).andReturn()
        .getResponse().getContentAsString()).path("token").asText();
    return new Client(id,owner,session,csrf);
  }

  String supplier() {
    String id=UUID.randomUUID().toString();
    s.create("supplier",id,s.object().put("id",id).put("state","APPROVED").put("enabled",true));
    return id;
  }

  ObjectNode receipt(Client client,String state) {
    ObjectNode resource=s.create("resource",client.owner,s.object().put("supplierId",client.owner)
        .put("createdBy",client.id).put("creatorId",client.id).put("resourceType","CCMAX")
        .put("name","QA delivery").put("state","DELIVERED"));
    ObjectNode op=s.object().put("supplierId",client.owner).put("resourceId",resource.path("id").asText())
        .put("type","OAUTH_COMPLETE").put("state",state).put("createdBy",client.id)
        .put("requestKey","PRIVATE-REQUEST-KEY").put("oauthNativeSessionId","PRIVATE-SESSION");
    op.putObject("request").put("code","PRIVATE-CODE").put("refreshToken","PRIVATE-TOKEN");
    op.putObject("result").put("authUrl","https://example.invalid?code=PRIVATE");
    return s.create("resource-operation",client.owner,op);
  }

  @Test
  void receiptIndexReusesExistingIntakesAndNeverExposesCredentialsOrOtherSuppliers() throws Exception {
    Client one=client("SUPPLIER",supplier()),two=client("SUPPLIER",supplier());
    ObjectNode own=receipt(one,"UNKNOWN"),other=receipt(two,"SUCCESS");
    String text=mvc.perform(get("/api/delivery-tasks?needsReview=true").session(one.session))
        .andExpect(status().isOk()).andExpect(jsonPath("$.total").value(1))
        .andExpect(jsonPath("$.items[0].needsReview").value(true))
        .andReturn().getResponse().getContentAsString();
    assertTrue(text.contains(own.path("id").asText()));
    assertFalse(text.contains(other.path("id").asText()));
    assertFalse(text.contains("PRIVATE"));
    mvc.perform(post("/api/delivery-tasks/"+other.path("id").asText()+"/reconcile")
        .session(one.session).header("X-CSRF-TOKEN",one.csrf).contentType("application/json").content("{}"))
        .andExpect(status().isNotFound());
    assertEquals("UNKNOWN",s.get("resource-operation",own.path("id").asText(),one.owner).path("state").asText());
  }

  @Test
  void finishedReceiptsDoNotReplayAndMemberListingRespectsCreatorScope() throws Exception {
    String owner=supplier();Client first=client("SUPPLIER_AGENT",owner),second=client("SUPPLIER_AGENT",owner);
    ObjectNode own=receipt(first,"SUCCESS");receipt(second,"SUCCESS");
    mvc.perform(get("/api/delivery-tasks").session(first.session)).andExpect(status().isOk())
        .andExpect(jsonPath("$.total").value(1));
    mvc.perform(post("/api/delivery-tasks/"+own.path("id").asText()+"/reconcile")
        .session(first.session).header("X-CSRF-TOKEN",first.csrf).contentType("application/json").content("{}"))
        .andExpect(status().isOk()).andExpect(jsonPath("$.state").value("SUCCESS"));
    assertEquals(0,s.get("resource-operation",own.path("id").asText(),owner).path("version").asLong());
    ObjectNode project=s.create("project","GLOBAL",s.object().put("name","Scoped delivery project").put("enabled",true));
    s.update("resource",own.path("resourceId").asText(),owner,s.object().put("projectId",project.path("id").asText()));
    mvc.perform(get("/api/delivery-tasks").session(first.session)).andExpect(status().isOk())
        .andExpect(jsonPath("$.total").value(0));
    ObjectNode profile=auth.findUser(first.id);
    profile.putArray("projectIds").add(project.path("id").asText());
    auth.saveUser(profile);
    mvc.perform(get("/api/delivery-tasks").session(first.session)).andExpect(status().isOk())
        .andExpect(jsonPath("$.total").value(1));
  }

  @Test
  void operatorReceiptIndexStaysWithinAssignedSupplierAndFinanceCannotEnter() throws Exception {
    Client operator=client("OPERATOR",null),finance=client("FINANCE",null);
    Client assigned=client("SUPPLIER",supplier()),other=client("SUPPLIER",supplier());
    s.update("supplier",assigned.owner,assigned.owner,s.object().put("ownerUserId",operator.id));
    ObjectNode visible=receipt(assigned,"UNKNOWN"),hidden=receipt(other,"UNKNOWN");
    String data=mvc.perform(get("/api/delivery-tasks").session(operator.session))
        .andExpect(status().isOk()).andExpect(jsonPath("$.total").value(1))
        .andReturn().getResponse().getContentAsString();
    assertTrue(data.contains(visible.path("id").asText()));assertFalse(data.contains(hidden.path("id").asText()));
    mvc.perform(post("/api/delivery-tasks/"+hidden.path("id").asText()+"/reconcile")
        .session(operator.session).header("X-CSRF-TOKEN",operator.csrf).contentType("application/json").content("{}"))
        .andExpect(status().isNotFound());
    mvc.perform(get("/api/delivery-tasks").session(finance.session)).andExpect(status().isForbidden());
  }

  @Test
  void quoteExpiryReminderDoesNotGenerateRenewalsOrChangeApprovedDates() throws Exception {
    Client owner=client("SUPPLIER",supplier()),other=client("SUPPLIER",supplier());
    String today=BusinessSupport.today();
    ObjectNode quote=s.create("quote",owner.owner,s.object().put("supplierId",owner.owner).put("state","APPROVED")
        .put("projectName","Expiry QA").put("effectiveFrom",today).put("effectiveTo",today));
    JsonNode data=s.json.readTree(mvc.perform(get("/api/workbench").session(owner.session))
        .andExpect(status().isOk()).andReturn().getResponse().getContentAsString());
    assertTrue(data.path("tasks").findValuesAsText("kind").contains("QUOTE_EXPIRING"));
    String otherData=mvc.perform(get("/api/workbench").session(other.session)).andExpect(status().isOk())
        .andReturn().getResponse().getContentAsString();
    assertFalse(otherData.contains(quote.path("id").asText()));
    assertEquals(1,s.list("quote",owner.owner).size());assertEquals(quote,s.get("quote",quote.path("id").asText(),owner.owner));
  }

  @Test
  void supplierCanStillExplicitlyConfirmAfterSuggestedDeadlineWithoutAutomation() throws Exception {
    Client owner=client("SUPPLIER",supplier());
    ObjectNode settlement=s.create("settlement",owner.owner,s.object().put("supplierId",owner.owner)
        .put("state","PENDING").put("currency","USD").put("total","10")
        .put("confirmationDeadline",Instant.now().minusSeconds(60).toString()));
    mvc.perform(post("/api/settlements/"+settlement.path("id").asText()+"/confirm")
        .session(owner.session).header("X-CSRF-TOKEN",owner.csrf).contentType("application/json")
        .content("{\"approved\":true,\"version\":0}"))
        .andExpect(status().isOk()).andExpect(jsonPath("$.state").value("CONFIRMED"))
        .andExpect(jsonPath("$.confirmationMode").value("MANUAL"));
  }
}
