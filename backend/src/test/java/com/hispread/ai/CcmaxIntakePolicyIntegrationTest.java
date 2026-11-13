package com.hispread.ai;

import static org.junit.jupiter.api.Assertions.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.node.*;
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
class CcmaxIntakePolicyIntegrationTest {
  @Autowired Store store;
  @Autowired AuthService auth;
  @Autowired MockMvc mvc;
  @Autowired CcmaxIntakeLedger ledger;
  String owner, uid, memberId, groupId, csrf;
  MockHttpSession session;

  @BeforeEach void setup() throws Exception {
    String suffix = UUID.randomUUID().toString();
    owner = "quota-owner-" + suffix; uid = "quota-user-" + suffix;
    memberId = "quota-member-" + suffix; groupId = "quota-group-" + suffix;
    ObjectNode user = store.object().put("id", uid).put("username", uid).put("role", "SUPPLIER")
        .put("supplierId", owner).put("version", 0).put("mustChangePassword", false);
    user.set("permissions", auth.supplierPermissions()); auth.createUser(user, "FixtureTest@123");
    session = new MockHttpSession(); session.setAttribute("uid", uid); session.setAttribute("sv", 0L);
    csrf = store.parse(mvc.perform(get("/api/auth/csrf").session(session)).andReturn()
        .getResponse().getContentAsString()).path("token").asText();
    store.create("supplier", owner, store.object().put("id", owner).put("supplierId", owner)
        .put("state", "APPROVED").put("enabled", true));
    store.create("supplier-settings", "GLOBAL", store.object().put("id", owner)
        .put("allowCcmax", true).put("allowPro", true));
    store.create("agent", owner, store.object().put("id", memberId).put("supplierId", owner)
        .put("groupId", groupId).put("enabled", true));
    ObjectNode group = store.object().put("id", groupId).put("allowPro", true);
    group.putArray("memberIds").add(memberId); store.create("group", owner, group);
    ObjectNode policy = store.object().put("nonProOpen", true).put("tier", "NORMAL");
    policy.putObject("pro").put("mode", "LIMITED").put("quantity", 4);
    policy.putObject("nonPro").put("mode", "LIMITED").put("quantity", 8);
    policy.putObject("ranges").putObject("NORMAL").put("min", 23).put("max", 23);
    store.create("intake-policy", "GLOBAL", store.object().put("id", owner).set("policy", policy));
  }

  ObjectNode getJson(String path) throws Exception {
    return store.parse(mvc.perform(get(path).session(session)).andExpect(status().isOk())
        .andReturn().getResponse().getContentAsString());
  }
  ObjectNode putJson(String path, ObjectNode value, int expected) throws Exception {
    return store.parse(mvc.perform(put(path).session(session).header("X-CSRF-TOKEN", csrf)
        .contentType("application/json").content(value.toString())).andExpect(status().is(expected))
        .andReturn().getResponse().getContentAsString());
  }

  org.springframework.mock.web.MockHttpServletRequest request() {
    var req = new org.springframework.mock.web.MockHttpServletRequest(); req.setSession(session); return req;
  }
  ObjectNode resource(String user) {
    return store.create("resource", owner, store.object().put("supplierId", owner).put("createdBy", user)
        .put("resourceType", "CCMAX").put("state", "DRAFT").put("dispatchState", "NOT_SUBMITTED"));
  }

  @Test void supplierAllowanceUsesEffectiveDailyPolicyAndRealClassification() throws Exception {
    String rid = "quota-delivered-" + UUID.randomUUID();
    store.create("resource", owner, store.object().put("id", rid).put("supplierId", owner)
        .put("createdBy", uid).put("resourceType", "CCMAX").put("state", "DELIVERED")
        .put("dispatchState", "SUCCESS").put("submittedAt", java.time.Instant.now().toString()));
    ObjectNode receipt = store.object().put("supplierId", owner).put("resourceId", rid)
        .put("type", "OAUTH_COMPLETE").put("state", "SUCCESS").put("finishedAt", java.time.Instant.now().toString());
    receipt.putObject("result").put("intakeCategory", "PRO");
    store.create("resource-operation", owner, receipt);
    ObjectNode today = getJson("/api/cc-intake/mine");
    assertEquals(1, today.path("pro").asInt()); assertEquals(0, today.path("unknown").asInt());
    assertEquals(4, today.path("proAllowance").path("limit").asInt());
    assertEquals(3, today.path("proAllowance").path("remaining").asInt());
    assertEquals(8, today.path("nonProAllowance").path("limit").asInt());
    assertTrue(today.path("canPro").asBoolean());
  }

  @Test void groupAndMemberFractionsReserveSupplierAndGroupBalances() throws Exception {
    ObjectNode input = store.object().put("version", 0);
    ArrayNode allocations = input.putArray("allocations");
    allocations.addObject().put("kind", "GROUP").put("subjectId", groupId)
        .put("proBasisPoints", 5000).put("nonProBasisPoints", 5000);
    allocations.addObject().put("kind", "USER").put("subjectId", memberId).put("parentGroupId", groupId)
        .put("proBasisPoints", 5000).put("nonProBasisPoints", 5000);
    ObjectNode saved = putJson("/api/cc-intake/allocations", input, 200);
    assertEquals(4, saved.path("proLimit").asInt());
    assertEquals(8, saved.path("nonProLimit").asInt());
    ObjectNode today = getJson("/api/cc-intake/mine");
    assertEquals(2, today.path("proAllowance").path("reservedRemaining").asInt());
    assertEquals(2, today.path("proAllowance").path("remaining").asInt());
    assertEquals(4, today.path("nonProAllowance").path("remaining").asInt());
  }

  @Test void allocationRejectsFractionalBasisPointsDuplicatesAndSelfParentedGroups() throws Exception {
    ObjectNode input = store.object().put("version", 0);
    input.putArray("allocations").addObject().put("kind", "USER").put("subjectId", memberId)
        .put("proBasisPoints", 0.5);
    putJson("/api/cc-intake/allocations", input, 400);
    ObjectNode one = store.object().put("kind", "USER").put("subjectId", memberId).put("proBasisPoints", 1000);
    input.putArray("allocations").add(one).add(one.deepCopy());
    putJson("/api/cc-intake/allocations", input, 400);
    input.putArray("allocations").addObject().put("kind", "GROUP").put("subjectId", groupId)
        .put("parentGroupId", groupId).put("proBasisPoints", 1000);
    putJson("/api/cc-intake/allocations", input, 400);
  }

  @Test void durableUnknownReservationsSurviveMidnightAndReleaseOnlyOnDefiniteFailure() {
    ObjectNode policy = ledger.effectivePolicy(owner, "");
    ((ObjectNode) policy.path("nonPro")).put("quantity", 1);
    store.update("intake-policy", owner, null, store.object().set("policy", policy));
    ObjectNode first = ledger.reserve(resource(uid), UUID.randomUUID().toString(), request());
    assertEquals(23, first.path("priority").asInt());
    assertThrows(ApiException.class, () -> ledger.reserve(resource(uid), UUID.randomUUID().toString(), request()));
    store.update("intake-ledger", first.path("id").asText(), owner, store.object().put("day", "2020-01-01"));
    assertThrows(ApiException.class, () -> ledger.reserve(resource(uid), UUID.randomUUID().toString(), request()));
    ledger.settle(owner, first.path("id").asText(), "UNKNOWN");
    assertThrows(ApiException.class, () -> ledger.reserve(resource(uid), UUID.randomUUID().toString(), request()));
    ledger.settle(owner, first.path("id").asText(), "FAILED");
    assertNotNull(ledger.reserve(resource(uid), UUID.randomUUID().toString(), request()));
  }

  @Test void memberPersonalReservationAndReclaimPreserveConsumptionAndCloseToday() throws Exception {
    ObjectNode input = store.object().put("version", 0);
    input.putArray("allocations").addObject().put("kind", "USER").put("subjectId", memberId)
        .put("proBasisPoints", 5000).put("nonProBasisPoints", 2500);
    ObjectNode saved = putJson("/api/cc-intake/allocations", input, 200);
    ObjectNode r = ledger.reserve(resource(memberId), UUID.randomUUID().toString(), request());
    ledger.classify(owner, r.path("id").asText(), "NON_PRO");
    ledger.settle(owner, r.path("id").asText(), "SUCCESS");
    ObjectNode member = ledger.allowance(owner, memberId, "NON_PRO");
    assertEquals(1, member.path("used").asInt()); assertEquals(1, member.path("remaining").asInt());
    ObjectNode reset = store.object().put("version", saved.path("version").asLong()); reset.putArray("allocations");
    putJson("/api/cc-intake/allocations", reset, 200);
    member = ledger.allowance(owner, memberId, "NON_PRO");
    assertTrue(member.path("reclaimed").asBoolean()); assertEquals(0, member.path("remaining").asInt());
    ObjectNode supplier = ledger.allowance(owner, uid, "NON_PRO");
    assertEquals(1, supplier.path("used").asInt()); assertEquals(7, supplier.path("remaining").asInt());
  }

  @Test void verifiedProAndUnknownPlansFailClosedAndMemberPriorityOverridesSupplier() {
    store.update("group", groupId, owner, store.object().put("allowPro", false));
    ObjectNode memberPolicy = store.object().put("tier", "PARTNER");
    memberPolicy.putObject("ranges").putObject("PARTNER").put("min", 41).put("max", 41);
    store.create("intake-policy", "GLOBAL", store.object().put("id", owner + ":" + memberId).set("policy", memberPolicy));
    ObjectNode entry = ledger.reserve(resource(memberId), UUID.randomUUID().toString(), request());
    assertEquals(41, entry.path("priority").asInt()); assertFalse(entry.path("allowPro").asBoolean());
    ApiException pro = assertThrows(ApiException.class, () -> ledger.classify(owner, entry.path("id").asText(), "PRO"));
    assertEquals("PRO_PLAN_NOT_ALLOWED", pro.code);
    assertEquals("PLAN_CHECK_FAILED", assertThrows(ApiException.class,
        () -> ledger.classify(owner, entry.path("id").asText(), "UNKNOWN")).code);
    assertThrows(ApiException.class, () -> CcmaxIntakeLedger.rejectOverrides(store.object().put("priority", 999)));
    assertThrows(ApiException.class, () -> CcmaxIntakeLedger.rejectOverrides(store.object().set("input", store.object().put("canPro", true))));
  }

  @Test void nestedGroupReservationsCannotBeSpentBySupplierOrUnallocatedGroupMembers() throws Exception {
    ObjectNode input = store.object().put("version", 0);
    input.putArray("allocations").addObject().put("kind", "GROUP").put("subjectId", groupId).put("nonProBasisPoints", 5000);
    ((ArrayNode) input.path("allocations")).addObject().put("kind", "USER").put("subjectId", memberId)
        .put("parentGroupId", groupId).put("nonProBasisPoints", 5000);
    putJson("/api/cc-intake/allocations", input, 200);
    String other = memberId + "-other";
    ObjectNode group = store.get("group", groupId, owner);
    ((ArrayNode) group.path("memberIds")).add(other);
    store.update("group", groupId, owner, store.object().set("memberIds", group.path("memberIds")));
    assertEquals(2, ledger.allowance(owner, other, "NON_PRO").path("remaining").asInt());
    ObjectNode pending = ledger.reserve(resource(memberId), UUID.randomUUID().toString(), request());
    assertEquals(4, ledger.allowance(owner, uid, "NON_PRO").path("remaining").asInt());
    assertEquals(2, ledger.allowance(owner, other, "NON_PRO").path("remaining").asInt());
    assertEquals(1, ledger.allowance(owner, memberId, "NON_PRO").path("remaining").asInt());
    ledger.classify(owner, pending.path("id").asText(), "NON_PRO"); ledger.settle(owner, pending.path("id").asText(), "SUCCESS");
    assertEquals(4, ledger.allowance(owner, uid, "NON_PRO").path("remaining").asInt());
    assertEquals(2, ledger.allowance(owner, other, "NON_PRO").path("remaining").asInt());
    assertThrows(ApiException.class, () -> ledger.requireGroupRemovalWithoutAllocations(owner, groupId));
    assertThrows(ApiException.class, () -> ledger.requireMovableMember(owner, memberId, "other-group"));
  }

  @Test void effectiveInheritanceAndForeignAllocationFailClosed() throws Exception {
    ObjectNode override = store.object().put("tier", "PARTNER");
    override.putObject("nonPro").put("mode", "LIMITED").put("quantity", 1);
    override.putObject("ranges").putObject("PARTNER").put("min", 77).put("max", 77);
    store.create("intake-policy", "GLOBAL", store.object().put("id", owner + ":" + memberId).set("policy", override));
    ObjectNode row = ledger.reserve(resource(memberId), UUID.randomUUID().toString(), request());
    assertEquals(77, row.path("priority").asInt()); assertEquals("PARTNER", row.path("tier").asText());
    assertEquals(0, ledger.allowance(owner, memberId, "NON_PRO").path("remaining").asInt());
    store.create("group", "other-owner", store.object().put("id", "foreign-" + groupId));
    ObjectNode input = store.object().put("version", 0);
    input.putArray("allocations").addObject().put("kind", "GROUP").put("subjectId", "foreign-" + groupId).put("proBasisPoints", 1000);
    putJson("/api/cc-intake/allocations", input, 404);
  }

  @Test void confirmedArchiveReleasesUncertainReservationButNeverErasesSuccessfulDailyUsage() {
    ObjectNode successfulResource = resource(uid), pendingResource = resource(uid);
    ObjectNode successful = ledger.reserve(successfulResource, UUID.randomUUID().toString(), request());
    ledger.classify(owner, successful.path("id").asText(), "NON_PRO");
    ledger.settle(owner, successful.path("id").asText(), "SUCCESS");
    ObjectNode pending = ledger.reserve(pendingResource, UUID.randomUUID().toString(), request());
    ledger.confirmedArchive(owner, successfulResource.path("id").asText());
    ledger.confirmedArchive(owner, pendingResource.path("id").asText());
    assertEquals("SUCCESS", store.get("intake-ledger", successful.path("id").asText(), owner).path("state").asText());
    assertEquals("RELEASED", store.get("intake-ledger", pending.path("id").asText(), owner).path("state").asText());
    assertEquals(1, ledger.allowance(owner, uid, "NON_PRO").path("used").asInt());
    assertEquals(7, ledger.allowance(owner, uid, "NON_PRO").path("remaining").asInt());
  }
}
