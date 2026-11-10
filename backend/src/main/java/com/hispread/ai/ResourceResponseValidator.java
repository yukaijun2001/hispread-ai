package com.hispread.ai;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import java.net.URI;
import java.time.Instant;
import java.util.*;

/** Fail closed on ambiguous application-level responses before local business state changes. */
final class ResourceResponseValidator {
  private ResourceResponseValidator() {}
  static String validate(String type, ObjectNode response, JsonNode request) {
    if (response.has("success") && (!response.path("success").isBoolean() || !response.path("success").asBoolean()))
      throw new ApiException(422, "资源上游拒绝此操作", "RESOURCE_PROVIDER_REJECTED");
    if (response.has("errcode") && (!response.path("errcode").isIntegralNumber() || response.path("errcode").asLong() != 0))
      throw new ApiException(422, "资源上游拒绝此操作", "RESOURCE_PROVIDER_REJECTED");
    String state = response.path("state").asText(response.path("status").asText()).toUpperCase(Locale.ROOT);
    if (state.isBlank() && type.equals("OAUTH_AUTHORIZE") && response.hasNonNull("sessionId") && response.hasNonNull("authUrl")) state = "READY";
    if (state.isBlank() && type.equals("USAGE") && (response.has("amount") || response.path("usage").isObject())) state = "UPDATED";
    if (state.isBlank() && type.equals("SAY-HI") && response.path("ok").isBoolean()) state = response.path("ok").asBoolean() ? "SUCCESS" : "FAILED";
    if (state.equals("COMPLETE")) state = "COMPLETED";
    Set<String> allowed = Set.of("SUCCESS", "UPDATED", "PENDING", "UNKNOWN", "FAILED", "RUNNING", "SUBMITTING", "READY", "COMPLETED", "PARTIAL", "NEEDS_REVIEW", "CANCELLED", "CANCELED", "EXPIRED", "AUTHORIZED", "DRAINING", "NONE", "SAVED", "QUEUED", "PREPARING", "VERIFYING", "PARTIAL_FAILED");
    if (!allowed.contains(state)) throw invalid();
    if (Set.of("SUBMIT", "DISPATCH", "OAUTH_COMPLETE").contains(type)
        && !Set.of("SUCCESS", "PENDING", "UNKNOWN", "FAILED", "SUBMITTING").contains(state)) throw invalid();
    if (Set.of("SUBMIT", "DISPATCH", "OAUTH_COMPLETE").contains(type)) {
      JsonNode resource = response.path("resource").isObject() ? response.path("resource") : response;
      if (resource.has("dispatchState") && !Set.of("SUCCESS", "PENDING", "UNKNOWN", "FAILED", "SUBMITTING").contains(resource.path("dispatchState").asText())) throw invalid();
      if (resource.path("dispatchState").asText().equals("SUCCESS") && !state.equals("SUCCESS")) throw invalid();
    }
    if (response.has("authUrl")) {
      try {
        URI link = URI.create(response.path("authUrl").asText());
        if (!"https".equals(link.getScheme()) || link.getHost() == null || link.getUserInfo() != null || link.getFragment() != null) throw invalid();
      } catch (RuntimeException e) { throw invalid(); }
    }
    if (type.equals("OAUTH_AUTHORIZE") && Set.of("SUCCESS", "READY", "AUTHORIZED").contains(state)) {
      if (response.path("sessionId").asText().isBlank() || response.path("sessionId").asText().length() > 512) throw invalid();
      try {
        URI uri = URI.create(response.path("authUrl").asText());
        if (!"https".equals(uri.getScheme()) || uri.getHost() == null || uri.getUserInfo() != null || uri.getFragment() != null) throw invalid();
        if (response.hasNonNull("expiresAt") && !Instant.parse(response.path("expiresAt").asText()).isAfter(Instant.now())) throw invalid();
      } catch (RuntimeException e) { throw invalid(); }
    }
    if (type.equals("USAGE")) {
      if (!Set.of("UPDATED", "SUCCESS", "PENDING", "UNKNOWN", "FAILED").contains(state)) throw invalid();
      JsonNode usage = response.path("usage");
      if (response.has("usage") && !usage.isObject()) throw invalid();
      validateUsage(response);
      if (usage.isObject()) validateUsage(usage);
      JsonNode nestedResource = response.path("resource");
      if (nestedResource.has("usage")) {
        if (!nestedResource.path("usage").isObject()) throw invalid();
        validateUsage(nestedResource.path("usage"));
      }
    }
    if (type.equals("SAY-HI") && !Set.of("SUCCESS", "PENDING", "UNKNOWN", "FAILED").contains(state)) throw invalid();
    if (Set.of("LIFECYCLE", "PROXY_REPLACEMENT").contains(type)) {
      Set<String> expected = new HashSet<>(), seen = new HashSet<>();
      for (JsonNode item : request.path("items")) expected.add(item.path("resourceId").asText());
      if (response.has("items")) {
        if (!response.path("items").isArray()) throw invalid();
        for (JsonNode item : response.path("items")) {
          String id = item.path("resourceId").asText();
          if (!expected.contains(id) || !seen.add(id) || !Set.of("SUCCESS", "PENDING", "SUBMITTING", "UNKNOWN", "FAILED", "DRAINING", "PAUSED", "RESUMED", "ACTIVE", "GONE", "REMOVED", "COMPLETED", "CANCELLED", "DONE", "NEEDS_REVIEW", "PREPARING", "VERIFYING", "QUEUED", "RUNNING").contains(item.path("state").asText())) throw invalid();
          if (type.equals("PROXY_REPLACEMENT") && Set.of("DONE", "SUCCESS", "COMPLETED").contains(item.path("state").asText())
              && !item.path("bindingApplied").asBoolean()) throw invalid();
        }
      }
      if (Set.of("SUCCESS", "COMPLETED").contains(state) && !seen.equals(expected)) throw invalid();
    }
    response.put("state", state);
    return state;
  }
  private static void validateUsage(JsonNode usage) {
    for (String field : List.of("amount", "used_quota", "balance", "balance_updated_time", "response_time")) {
      if (!usage.has(field)) continue;
      JsonNode value = usage.path(field);
      if (!value.isNumber() && !value.isTextual()) throw invalid();
      String raw = value.asText();
      if (raw.length() > 80 || !raw.matches("[0-9]+(?:\\.[0-9]+)?")) throw invalid();
      try {
        java.math.BigDecimal amount = new java.math.BigDecimal(raw);
        if (amount.signum() < 0 || amount.precision() > 32 || amount.scale() > 12 || amount.scale() < -12) throw invalid();
      } catch (RuntimeException e) { throw invalid(); }
    }
    if (usage.has("currency") && !usage.path("currency").asText().matches("[A-Z]{3,10}")) throw invalid();
  }
  private static ApiException invalid() {
    return new ApiException(502, "上游操作响应格式或状态无效，请查询原操作", "RESOURCE_UPSTREAM_INVALID_RESPONSE");
  }
}
