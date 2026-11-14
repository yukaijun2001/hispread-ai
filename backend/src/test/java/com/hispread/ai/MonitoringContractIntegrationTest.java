package com.hispread.ai;

import static org.junit.jupiter.api.Assertions.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import java.util.UUID;
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
class MonitoringContractIntegrationTest {
  @Autowired Store s;
  @Autowired AuthService auth;
  @Autowired MockMvc mvc;
  @Autowired MonitoringService monitoring;
  @Autowired WecomReminderService wecom;

  @Test
  void oldMonitoringSourcesStayHistoricalAndCannotBeReenabledOrRefreshed() throws Exception {
    String uid = UUID.randomUUID().toString();
    ObjectNode user = s.object().put("id",uid).put("username","retired-monitor-"+uid)
        .put("role","ADMIN").putNull("supplierId").put("version",0);
    user.set("permissions",auth.allPermissions());
    auth.createUser(user,"FixtureTest@123");
    MockHttpSession session = new MockHttpSession();
    session.setAttribute("uid",uid);session.setAttribute("sv",0L);
    String csrf = s.json.readTree(mvc.perform(get("/api/auth/csrf").session(session))
        .andReturn().getResponse().getContentAsString()).path("token").asText();
    ObjectNode source = s.create("monitoring-source","GLOBAL",s.object().put("enabled",true)
        .put("name","Retired historical source").put("token","PRIVATE")
        .put("endpoint","https://example.invalid/metrics").put("rpm","100"));
    for (String path : new String[]{"/api/workbench-monitoring/sources",
        "/api/workbench-monitoring/sources/"+source.path("id").asText()+"/refresh"})
      mvc.perform(post(path).session(session).header("X-CSRF-TOKEN",csrf)
          .contentType("application/json").content("{}"))
          .andExpect(status().isGone()).andExpect(jsonPath("$.code").value("TASK_RETIRED"));
    mvc.perform(put("/api/workbench-monitoring/sources/"+source.path("id").asText())
        .session(session).header("X-CSRF-TOKEN",csrf).contentType("application/json")
        .content("{\"enabled\":true}" )).andExpect(status().isGone());
    mvc.perform(get("/api/workbench/monitoring").session(session)).andExpect(status().isOk())
        .andExpect(content().json("[]"));
    JsonNode history = s.json.readTree(mvc.perform(get("/api/workbench-monitoring/sources").session(session))
        .andExpect(status().isOk()).andReturn().getResponse().getContentAsString());
    assertFalse(history.toString().contains("PRIVATE"));
    monitoring.collectDue();
    assertEquals(source,s.get("monitoring-source",source.path("id").asText(),null));
  }

  @Test
  void enterpriseRobotCanNeverBeConfiguredOrSendEvenWithLegacyEnvironmentKeys() {
    assertFalse(wecom.configured());
    assertEquals(410,assertThrows(ApiException.class,()->wecom.save(s.object()
        .put("webhookUrl","https://qyapi.weixin.qq.com/cgi-bin/webhook/send?key=private"))).status);
    assertEquals(410,assertThrows(ApiException.class,()->wecom.send(s.object())).status);
    assertFalse(wecom.settings().toString().contains("private"));
  }
}
