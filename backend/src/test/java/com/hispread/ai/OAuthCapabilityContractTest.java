package com.hispread.ai;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;
import java.util.List;
import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockHttpServletRequest;

class OAuthCapabilityContractTest {
  private final ObjectMapper mapper = new ObjectMapper();

  @Test
  void nativeCapabilitiesExposeOnlyDirectOauthWhileCustomRetainsQualifiedCompatibility() {
    Store store = mock(Store.class);
    AuthService auth = mock(AuthService.class);
    MockHttpServletRequest request = new MockHttpServletRequest();
    when(store.object()).thenAnswer(invocation -> mapper.createObjectNode());
    when(store.list("settings", null)).thenReturn(List.of(mapper.createObjectNode()));
    when(store.get("supplier-settings", "supplier", null)).thenReturn(mapper.createObjectNode().put("allowCcmax", true));
    CcmaxAccessPolicy policy = new CcmaxAccessPolicy(store, auth);

    ObjectNode nativeCapabilities = policy.capabilities("supplier", true, true, request);
    assertTrue(nativeCapabilities.path("allowCcmax").asBoolean());
    assertTrue(nativeCapabilities.path("allowDirectCcmax").asBoolean());
    assertFalse(nativeCapabilities.path("supportsProxy").asBoolean());
    assertFalse(nativeCapabilities.path("allowRawCredentialImport").asBoolean());
    assertEquals(mapper.createArrayNode().add("OAUTH"), nativeCapabilities.path("credentialModes"));

    ObjectNode customCapabilities = policy.capabilities("supplier", true, false, request);
    assertTrue(customCapabilities.path("supportsProxy").asBoolean());
    assertTrue(customCapabilities.path("allowRawCredentialImport").asBoolean());
    assertEquals(mapper.createArrayNode().add("OAUTH").add("REFRESH_TOKEN").add("ACCESS_TOKEN").add("SESSION_KEY"), customCapabilities.path("credentialModes"));

    ObjectNode unavailable = policy.capabilities("supplier", false, false, request);
    assertFalse(unavailable.path("supportsProxy").asBoolean());
    assertFalse(unavailable.path("allowRawCredentialImport").asBoolean());
    assertTrue(unavailable.path("credentialModes").isEmpty());
  }

  @Test
  void nativeCapabilityDoesNotGrantIntakeWhenSupplierIsStopped() {
    Store store = mock(Store.class);
    AuthService auth = mock(AuthService.class);
    when(store.object()).thenAnswer(invocation -> mapper.createObjectNode());
    when(store.list("settings", null)).thenReturn(List.of(mapper.createObjectNode().put("forceStopCcmaxIntake", true).put("allowAllSuppliersCcmax", true)));
    when(store.get("supplier-settings", "supplier", null)).thenReturn(mapper.createObjectNode().put("allowCcmax", true));
    ObjectNode capabilities = new CcmaxAccessPolicy(store, auth).capabilities("supplier", true, true, new MockHttpServletRequest());
    assertFalse(capabilities.path("allowCcmax").asBoolean());
    assertTrue(capabilities.path("forceStopCcmaxIntake").asBoolean());
    assertEquals("OAUTH", capabilities.path("credentialModes").path(0).asText());
  }
}
