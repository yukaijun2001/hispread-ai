package com.hispread.ai;

import static org.junit.jupiter.api.Assertions.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

import com.fasterxml.jackson.databind.*;
import com.fasterxml.jackson.databind.node.*;
import java.nio.file.*;
import java.util.*;
import org.junit.jupiter.api.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.mock.web.MockHttpSession;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

@SpringBootTest
@AutoConfigureMockMvc
@Transactional
class ProfessionalDomainAuthorizationTest {
  @Autowired MockMvc mvc;
  @Autowired Store store;
  @Autowired AuthService auth;
  @Autowired ObjectMapper json;
  @Autowired DocumentController docs;

  record Client(MockHttpSession session, String csrf, String uid, String owner) {}

  Client client(String role, String owner) throws Exception {
    String id = UUID.randomUUID().toString();
    ObjectNode user =
        store
            .object()
            .put("id", id)
            .put("username", "domain_" + id.substring(0, 8))
            .put("displayName", role)
            .put("role", role)
            .put("mustChangePassword", false)
            .put("onboardingRequired", false)
            .put("version", 0);
    if (owner == null) user.putNull("supplierId");
    else user.put("supplierId", owner);
    ArrayNode permissions =
        role.equals("SUPPLIER")
            ? auth.supplierPermissions()
            : role.equals("SUPPLIER_AGENT")
                ? store.json.valueToTree(
                    List.of(
                        "resource.read",
                        "resource.write",
                        "resource.sensitive",
                        "resource.intake.manage",
                        "project.read",
                        "proxy.read",
                        "proxy.write",
                        "supplier.agent.manage",
                        "file.write"))
                : auth.rolePermissions(role);
    user.set("permissions", permissions);
    user.putArray("projectIds");
    auth.createUser(user, "DomainTest@Password123");
    MockHttpSession session = new MockHttpSession();
    session.setAttribute("uid", id);
    session.setAttribute("sv", 0L);
    var result = mvc.perform(get("/api/auth/csrf").session(session)).andReturn();
    return new Client(
        session,
        json.readTree(result.getResponse().getContentAsString()).path("token").asText(),
        id,
        owner);
  }

  ObjectNode write(String method, String url, ObjectNode body, Client c, int expected)
      throws Exception {
    var result =
        mvc.perform(
                (method.equals("PUT") ? put(url) : post(url))
                    .session(c.session)
                    .header("X-CSRF-TOKEN", c.csrf)
                    .contentType("application/json")
                    .content(body.toString()))
            .andExpect(status().is(expected))
            .andReturn();
    JsonNode parsed = json.readTree(result.getResponse().getContentAsString());
    return parsed.isObject() ? (ObjectNode) parsed : store.object();
  }

  String supplier(Client op) {
    String id = UUID.randomUUID().toString();
    store.create(
        "supplier",
        id,
        store
            .object()
            .put("id", id)
            .put("supplierId", id)
            .put("name", "Scoped supplier")
            .put("enabled", true)
            .put("state", "APPROVED")
            .put("ownerUserId", op.uid));
    return id;
  }

  ObjectNode project() {
    return store.create(
        "project",
        "GLOBAL",
        store
            .object()
            .put("name", "Scoped project")
            .put("enabled", true)
            .put("category", "OTHER")
            .put("capacityType", "ACCOUNT_COUNT")
            .put("settlementMethod", "QUOTA"));
  }

  @Test
  void operatorsCannotReadOrMutateOtherAssignmentsOrSelfAssignOwnership() throws Exception {
    Client op1 = client("OPERATOR", null),
        op2 = client("OPERATOR", null),
        admin = client("ADMIN", null);
    String s1 = supplier(op1), s2 = supplier(op2);
    mvc.perform(get("/api/suppliers/" + s2).session(op1.session)).andExpect(status().isNotFound());
    var list =
        mvc.perform(get("/api/suppliers?size=100").session(op1.session))
            .andExpect(status().isOk())
            .andReturn();
    assertFalse(list.getResponse().getContentAsString().contains(s2));
    write(
        "PUT",
        "/api/suppliers/" + s1,
        store
            .object()
            .put("name", "Safe name")
            .put("ownerUserId", op2.uid)
            .put("state", "APPROVED")
            .put("permissions", "all")
            .put("secretKey", "injected")
            .put("enabled", false),
        op1,
        200);
    ObjectNode saved = store.get("supplier", s1, s1);
    assertEquals(op1.uid, saved.path("ownerUserId").asText());
    assertTrue(saved.path("enabled").asBoolean());
    assertFalse(saved.toString().contains("injected"));
    assertFalse(saved.path("pendingProfile").has("ownerUserId"));
    write("PUT", "/api/suppliers/" + s2, store.object().put("name", "Bad"), op1, 404);
    write(
        "PUT",
        "/api/suppliers/" + s1 + "/owner",
        store.object().put("ownerUserId", op1.uid).put("note", "self"),
        op1,
        403);
    write(
        "POST",
        "/api/suppliers/" + s1 + "/enabled",
        store.object().put("enabled", false),
        op1,
        403);
    ObjectNode created =
        write(
            "POST",
            "/api/suppliers",
            store
                .object()
                .put("name", "New supplier")
                .put("ownerUserId", op2.uid)
                .put("state", "APPROVED"),
            op1,
            200);
    assertEquals(op1.uid, created.path("ownerUserId").asText());
    assertEquals("PENDING", created.path("state").asText());
    ObjectNode p = project();
    ObjectNode q =
        store.create(
            "quote",
            s1,
            store
                .object()
                .put("supplierId", s1)
                .put("projectId", p.path("id").asText())
                .put("state", "PENDING")
                .put("submittedBy", op1.uid)
                .put("effectiveFrom", BusinessSupport.today())
                .put("effectiveTo", BusinessSupport.today()));
    write(
        "POST",
        "/api/quotes/" + q.path("id").asText() + "/review",
        store.object().put("approved", true),
        op1,
        403);
    write(
        "POST",
        "/api/quotes/" + q.path("id").asText() + "/review",
        store.object().put("approved", true),
        op2,
        404);
    q =
        store.create(
            "quote",
            s1,
            store
                .object()
                .put("supplierId", s1)
                .put("projectId", p.path("id").asText())
                .put("state", "PENDING")
                .put("submittedBy", admin.uid)
                .put("effectiveFrom", BusinessSupport.today())
                .put("effectiveTo", BusinessSupport.today()));
    write(
        "POST",
        "/api/quotes/" + q.path("id").asText() + "/review",
        store.object().put("approved", true),
        admin,
        403);
  }

  @Test
  void memberResourceAccessRequiresCreatorDepartmentAndCurrentProjectGrant() throws Exception {
    Client op = client("OPERATOR", null);
    String owner = supplier(op);
    Client m1 = client("SUPPLIER_AGENT", owner), m2 = client("SUPPLIER_AGENT", owner);
    ObjectNode p = project();
    String pid = p.path("id").asText();
    for (Client m : List.of(m1, m2)) {
      ObjectNode u = auth.findUser(m.uid);
      u.putArray("projectIds").add(pid);
      auth.saveUser(u);
      store.create("agent", owner, u.deepCopy().put("enabled", true));
    }
    ObjectNode r =
        store.create(
            "resource",
            owner,
            store
                .object()
                .put("supplierId", owner)
                .put("projectId", pid)
                .put("createdBy", m2.uid)
                .put("state", "DRAFT")
                .put("name", "Other member"));
    String rid = r.path("id").asText();
    mvc.perform(get("/api/resources/" + rid).session(m1.session)).andExpect(status().isNotFound());
    ObjectNode group = store.object().put("name", "Dept").put("adminUserId", m1.uid);
    group.putArray("memberIds").add(m1.uid).add(m2.uid);
    group = store.create("group", owner, group);
    ObjectNode u = auth.findUser(m1.uid);
    u.set("teamAdminGroup", group);
    auth.saveUser(u);
    mvc.perform(get("/api/resources/" + rid).session(m1.session)).andExpect(status().isOk());
    write(
        "POST",
        "/api/supplier-agents",
        store.object().put("username", "blocked_user").put("displayName", "Blocked"),
        m1,
        403);
    write("POST", "/api/supplier-team-groups", store.object().put("name", "Blocked"), m1, 403);
    write("POST", "/api/supplier-agents/" + m2.uid + "/password", store.object(), m1, 403);
    ObjectNode no = project();
    ObjectNode grant = store.object();
    grant.putArray("projectIds").add(no.path("id").asText());
    write("PUT", "/api/supplier-agents/" + m2.uid + "/projects", grant, m1, 403);
    u = auth.findUser(m1.uid);
    u.putArray("projectIds");
    auth.saveUser(u);
    mvc.perform(get("/api/resources/" + rid).session(m1.session)).andExpect(status().isNotFound());
  }

  @Test
  void materialsProxiesAndDocumentDownloadsRespectSubjectAndCategory() throws Exception {
    Client op1 = client("OPERATOR", null),
        op2 = client("OPERATOR", null),
        finance = client("FINANCE", null);
    String owner = supplier(op1), other = supplier(op2);
    Client supplier = client("SUPPLIER", owner),
        m1 = client("SUPPLIER_AGENT", owner),
        m2 = client("SUPPLIER_AGENT", owner);
    ObjectNode intake =
        store
            .object()
            .put("supplierId", owner)
            .put("createdBy", supplier.uid)
            .put("resourceType", "NEWAPI_INTAKE")
            .put("state", "UNASSIGNED");
    intake.set("material", store.object().put("key", "NEVER IN RESPONSE"));
    intake = store.create("intake", owner, intake);
    String iid = intake.path("id").asText();
    write("POST", "/api/resource-intakes/" + iid + "/material", store.object(), op1, 403);
    mvc.perform(get("/api/resource-intakes/" + iid).session(op2.session))
        .andExpect(status().isNotFound());
    ObjectNode material =
        write("POST", "/api/resource-intakes/" + iid + "/material", store.object(), supplier, 200);
    assertEquals("NEVER IN RESPONSE", material.path("key").asText());
    ObjectNode proxy =
        store.create(
            "proxy",
            owner,
            store
                .object()
                .put("supplierId", owner)
                .put("createdBy", m2.uid)
                .put("name", "Other member proxy")
                .put("url", "socks5://user:secret@proxy.invalid:1080")
                .put("enabled", true));
    mvc.perform(
            get("/api/outbound-proxies/" + proxy.path("id").asText() + "/resources")
                .session(m1.session))
        .andExpect(status().isNotFound());
    write(
        "PUT",
        "/api/outbound-proxies/" + proxy.path("id").asText(),
        store.object().put("name", "overwrite"),
        m1,
        404);
    for (String category : List.of("QUALIFICATION", "PAYMENT_PROOF")) {
      String id = UUID.randomUUID().toString();
      store.create(
          "document",
          owner,
          store
              .object()
              .put("id", id)
              .put("supplierId", owner)
              .put("createdBy", supplier.uid)
              .put("category", category)
              .put("contentType", "application/pdf")
              .put("filename", "proof.pdf"));
      Path path = Path.of(docs.directory).toAbsolutePath().resolve(id);
      Files.createDirectories(path.getParent());
      Files.writeString(path, "%PDF-local-proof");
      try {
        mvc.perform(get("/api/documents/" + id + "/download").session(op2.session))
            .andExpect(status().isNotFound());
        mvc.perform(get("/api/documents/" + id + "/download").session(m1.session))
            .andExpect(status().isNotFound());
        mvc.perform(get("/api/documents/" + id + "/download").session(op1.session))
            .andExpect(status().is(category.equals("QUALIFICATION") ? 200 : 404));
        mvc.perform(get("/api/documents/" + id + "/download").session(finance.session))
            .andExpect(status().is(category.equals("PAYMENT_PROOF") ? 200 : 404));
      } finally {
        Files.deleteIfExists(path);
      }
    }
  }

  @Test
  void authorizedMemberCanDeliverWithoutQuotePricesAndRevocationClosesSdkReads() throws Exception {
    Client op = client("OPERATOR", null);
    String owner = supplier(op);
    Client member = client("SUPPLIER_AGENT", owner), main = client("SUPPLIER", owner);
    ObjectNode project = project();
    String pid = project.path("id").asText();
    ObjectNode pp = store.object().put("apiKey", "CATALOG-SECRET");
    pp.putArray("supportedIntakeTypes").add(1);
    store.update("project", pid, "GLOBAL", pp);
    ObjectNode user = auth.findUser(member.uid);
    user.putArray("projectIds").add(pid);
    auth.saveUser(user);
    ObjectNode quote =
        store.create(
            "quote",
            owner,
            store
                .object()
                .put("supplierId", owner)
                .put("projectId", pid)
                .put("state", "APPROVED")
                .put("pricingType", "DISCOUNT")
                .put("multiplier", "0.27")
                .put("currency", "USD")
                .put("effectiveFrom", BusinessSupport.today())
                .put("effectiveTo", BusinessSupport.today()));
    var eligible =
        mvc.perform(get("/api/resources/eligible-projects").session(member.session))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$[0].id").value(pid))
            .andExpect(jsonPath("$[0].quoteBasis").doesNotExist())
            .andExpect(jsonPath("$[0].currency").doesNotExist())
            .andReturn();
    String token =
        json.readTree(eligible.getResponse().getContentAsString())
            .get(0)
            .path("quoteToken")
            .asText();
    assertEquals(64, token.length());
    assertFalse(eligible.getResponse().getContentAsString().contains("CATALOG-SECRET"));
    mvc.perform(get("/api/projects").session(member.session))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.items[0].apiKey").doesNotExist());
    ObjectNode intake =
        store.create(
            "intake",
            owner,
            store
                .object()
                .put("supplierId", owner)
                .put("createdBy", member.uid)
                .put("channelType", 1)
                .put("assignmentState", "UNASSIGNED")
                .put("resourceType", "NEWAPI_INTAKE"));
    ObjectNode assigned =
        write(
            "POST",
            "/api/resource-intakes/" + intake.path("id").asText() + "/assign-project",
            store.object().put("projectId", pid).put("version", 0).put("quoteToken", token),
            member,
            200);
    assertFalse(assigned.has("quoteBasis"));
    assertTrue(
        store
            .get("intake", intake.path("id").asText(), owner)
            .path("quoteBasis")
            .has("multiplier"));
    String id = UUID.randomUUID().toString();
    ObjectNode submission =
        store
            .object()
            .put("id", id)
            .put("supplierId", owner)
            .put("createdBy", member.uid)
            .put("projectId", pid)
            .put("accessToken", "SDK-SECRET")
            .put("key", "SDK-KEY");
    submission.set("quoteBasis", quote);
    store.create("submission", owner, submission);
    ObjectNode tokenResponse =
        write("POST", "/api/auth/api-tokens", store.object().put("name", "SDK Test"), member, 200);
    String bearer = tokenResponse.path("key").asText();
    mvc.perform(
            get("/api/open/v1/ccmax/submissions/" + id).header("Authorization", "Bearer " + bearer))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.accessToken").doesNotExist())
        .andExpect(jsonPath("$.key").doesNotExist())
        .andExpect(jsonPath("$.quoteBasis").doesNotExist());
    ObjectNode resource =
        store.create(
            "resource",
            owner,
            store
                .object()
                .put("supplierId", owner)
                .put("createdBy", member.uid)
                .put("projectId", pid)
                .put("resourceType", "CCMAX"));
    ObjectNode operation =
        store.create(
            "reauthorization",
            owner,
            store
                .object()
                .put("resourceId", resource.path("id").asText())
                .put("refreshToken", "OP-SECRET")
                .put("token", "OP-TOKEN"));
    mvc.perform(
            get("/api/open/v1/ccmax/resources/"
                    + resource.path("id").asText()
                    + "/reauthorizations/"
                    + operation.path("id").asText())
                .header("Authorization", "Bearer " + bearer))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.refreshToken").doesNotExist())
        .andExpect(jsonPath("$.token").doesNotExist());
    user = auth.findUser(member.uid);
    user.putArray("projectIds");
    auth.saveUser(user);
    mvc.perform(get("/api/resources/eligible-projects").session(member.session))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$").isEmpty());
    mvc.perform(
            get("/api/open/v1/ccmax/submissions/" + id).header("Authorization", "Bearer " + bearer))
        .andExpect(status().isNotFound());
    mvc.perform(get("/api/resource-intakes/" + intake.path("id").asText()).session(member.session))
        .andExpect(status().isNotFound());
  }

  @Test
  void departmentCannotLeaveExistingMemberWithoutAnyDepartment() throws Exception {
    Client op = client("OPERATOR", null);
    String owner = supplier(op);
    Client main = client("SUPPLIER", owner), member = client("SUPPLIER_AGENT", owner);
    ObjectNode user = auth.findUser(member.uid);
    store.create("agent", owner, user.deepCopy().put("enabled", true));
    ObjectNode group = store.object().put("name", "Original department");
    group.putArray("memberIds").add(member.uid);
    group = store.create("group", owner, group);
    ObjectNode patch = store.object().put("name", "Do not orphan").put("version", 0);
    patch.putArray("memberIds");
    write("PUT", "/api/supplier-team-groups/" + group.path("id").asText(), patch, main, 409);
    assertEquals(1, store.get("group", group.path("id").asText(), owner).path("memberIds").size());
  }
}
