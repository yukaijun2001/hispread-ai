# Resource and proxy implementation — 2026-11-09

The recovered frontend proves the local API shape, not the original CCMAX administrator protocol. Source evidence is recorded in `docs/evidence-domain.md` (resource form, OAuth session, lifecycle, proxy replacement) and the read-only recovered `frontend/src/recovered` modules. No original private CCMAX server, production key, or private API specification was supplied. This implementation therefore offers explicit `CUSTOM` and `NEWAPI` protocols and never labels the custom contract as the original private implementation.

## Proxy verification

`POST /api/outbound-proxies/{id}/test` now reads the saved credential URL on the server and executes an actual proxy transaction:

1. Resolve/check the proxy and the server-configured HTTPS probe destination. Connect to a validated proxy IP. Private, loopback, link-local, multicast, unspecified, carrier-grade NAT (`100.64.0.0/10`), benchmarking (`198.18.0.0/15`), and unique-local IPv6 addresses are rejected outside tests. A `production` profile always disables the test allowance.
2. For `HTTP`, send HTTP/1.1 CONNECT to the validated destination IP and optional Basic `Proxy-Authorization`. For `HTTPS`, first authenticate the proxy TLS certificate and hostname, then issue CONNECT inside TLS. CONNECT credentials never reach the destination service.
3. For `SOCKS5`, negotiate only no-auth or username/password as appropriate; perform RFC 1929 subnegotiation when credentials are present; send RFC 1928 CONNECT using the validated IPv4/IPv6 destination. A server selecting an unoffered authentication method fails.
4. Perform target TLS with certificate/hostname verification, then HTTPS GET to the configured fixed probe URL. Host/SNI use the actual hostname while the tunnel uses the checked IP, so proxy-side DNS cannot change the destination.
5. Require HTTP 200, bounded JSON, and an IP literal with a public address. Return `VERIFIED`, `exitIp`, latency and the authentication flag only after these checks. An opened TCP port alone fails. Authentication, protocol, TLS, timeout and egress failures return distinct states without raw proxy credentials or remote diagnostics.

Default probe URL: `https://api.ipify.org?format=json`. Configure server environment `INTEGRATION_PROXY_PROBE_URL` / Spring `app.integrations.proxy-probe-url` for another administrator-owned HTTPS JSON endpoint returning `{"ip":"<public-IP>"}`; `app.integrations.proxy-probe-timeout-ms` defaults to 10000 and clamps to 1000–30000. The budget covers socket connection, handshake, reads and TLS; DNS resolution uses the JVM resolver. Response headers/body are capped at 16 KiB, including chunked bodies. The returned public IP is an authenticated HTTPS observer's report; it is not proof the proxy differs from the server's direct public IP. A proxy may transparently share that IP.

Primary standards consulted:

- IETF [RFC 9110 §9.3.6, CONNECT](https://www.rfc-editor.org/rfc/rfc9110.html#section-9.3.6): a successful 2xx establishes a tunnel; authority form identifies host/port.
- IETF [RFC 1928, SOCKS Protocol Version 5](https://www.rfc-editor.org/rfc/rfc1928): greeting, method selection, address types, CONNECT reply.
- IETF [RFC 1929, Username/Password Authentication for SOCKS V5](https://www.rfc-editor.org/rfc/rfc1929): version 1 authentication and length-prefixed credential fields.
- IETF [RFC 7617, Basic authentication](https://www.rfc-editor.org/rfc/rfc7617): Base64 user/password credentials. Plain HTTP proxies expose this authentication to the network; use TLS proxies where needed.
- [ipify API documentation](https://www.ipify.org/) documents the JSON `ip` observer response.

## Explicit target configuration

Only ADMIN with `resource.config.write` can save a target. API and the existing target modal support `protocol: CUSTOM|NEWAPI`, `baseUrl`, `apiKey`, `enabled`, `newApiUserId`, `defaultTarget`, `upstreamPathPrefix` and `timeoutMs` (1000–120000). Empty secrets preserve saved values, clearApiKey removes them, and GET responses exclude keys. Multiple enabled targets need an explicit `targetId` or exactly one default. Resources persist target affinity and reject switching an existing resource or mixing targets in a maintenance batch.

`CUSTOM` remains the compatibility default for existing installations. It implements the documented local adapter contract in `docs/resource-upstream-adapter.md`: the operator must deploy a real compatible service. All remote HTTP calls have explicit methods, no automatic redirects, response byte limits, credential redaction and stable failure codes. Error bodies are not reflected to browsers.

A missing target returns 503 before creating a submission/OAuth draft. Unsupported NEWAPI CCMAX creation/OAuth also returns 503 before creating a draft. Invalid application response states, malformed JSON, invalid OAuth links, wrong job resource IDs or invalid usage amounts fail closed. An uncertain remote result persists UNKNOWN; request-key replay returns the existing operation and never repeats the remote mutation. Explicit user-facing version conflicts remain 409. OAuth authorization request-key replay retains a single local resource and opaque local session ID.

The local state projection now installs returned credentials into the server-only secret record, applies confirmed lifecycle results to resource operational/lane state, and applies confirmed proxy replacements to the local proxy binding. `DONE` requires `bindingApplied:true`; `NEEDS_REVIEW`/UNKNOWN do not change binding. Reconcile reads update the same local state without another create. Usage and say-hi results cannot create a delivered resource or override dispatch state.

## Actual New API compatibility

Official New API documentation was read on 2026-11-09:

- [Official channel management API](https://doc.newapi.pro/en/api/fei-channel-management/) documents the channel list, single channel GET, test GET, PUT updates, DELETE, administrator Bearer token and mandatory `New-Api-User` header.
- [New API source repository](https://github.com/QuantumNous/new-api) is the upstream implementation reference.

`NEWAPI` uses the real `/api/channel` administrator API, fixed prefix `/api`, Bearer API key, and numeric `New-Api-User`. The provider's `success` field must be an actual boolean true; HTTP 200 with `success:false` is rejected with a redacted application error.

| Local operation | Published New API operation | Local interpretation |
| --- | --- | --- |
| Target test | GET `/api/channel/?p=1&page_size=1` | Read-only administrator authentication check |
| Bind channel | GET `/api/channel/{channelId}` | Verify numeric ID and status before saving mapping |
| Resource usage | GET `/api/channel/{channelId}` | Preserve used_quota/balance and status; quota units remain `NEWAPI_QUOTA` |
| Resource say-hi | GET `/api/channel/test/{channelId}` | Real model connectivity check; provider may incur model usage |
| Channel priority | GET channel → PUT `/api/channel/` with explicit priority → GET channel | Preserve routing fields; require readback of requested priority |
| Lifecycle PAUSE / RESUME | POST `/api/channel/{id}/status` `{status:2|1}` → GET channel | PAUSED / RESUMED only after matching readback; old general-update endpoint used only when status endpoint returns 404/405 |
| Lifecycle REMOVE | DELETE `/api/channel/{channelId}` | GONE only on explicit provider success |
| Lifecycle reconcile | GET `/api/channel/{channelId}` only | Confirm status; unresolved/deletion ambiguity remains UNKNOWN |

An ADMIN associates an existing local resource with a real channel through `POST /api/resources/{localResourceId}/upstream-channel` with `{ "targetId":"saved-target-id", "channelId":42, "version":<current-version> }`. The call verifies the remote channel before saving `upstreamChannelId`, `laneId`, target and operational status. A pre-existing target association cannot be silently changed. Mapping does not claim new channel creation or monetary delivery success. The returned New API quota counter is not converted into USD or financial ledger records because per-deployment pricing and quota conversion were not supplied.

New API's published API-key channel creation is not CCMAX refresh-token/session-key intake, OAuth or credential refresh. Those functions deliberately return `RESOURCE_OPERATION_UNSUPPORTED` for NEWAPI. NewAPI intake material remains local until an explicit remote-creation workflow is specified; it is not silently uploaded. New API does not document this project's private CCMAX background jobs, so background CCMAX readiness must use CUSTOM targets. Original private OAuth/resource endpoints and production compatibility remain unverified until the real service specification and an authorized test environment are supplied.

## 2026-11-10 acceptance fixes

Resource management now provides **关联 New API 渠道** and a dedicated channel detail dialog. The association validates the target, channel ID and local version, rejects reassociation or duplicate target/channel mappings, and never changes the original delivery/financial state. Existing mapped rows are projected as `NEWAPI_CHANNEL` without rewriting their stored `DRAFT`/`NOT_SUBMITTED` state. The list shows the actual operational state and raw `NEWAPI_QUOTA`, including zero values, and can filter New API channels separately. Detail actions provide explicit connectivity testing, usage refresh, confirm-before-pause/resume and administrator priority updates.

`POST /api/cc-intake/admin/priority/jobs` now accepts the existing selected resources, Lane IDs, supplier range or filters for a NEWAPI target. It freezes at most 100 mapped resources into a local PREVIEW, and `/start` performs per-channel priority updates with readback. Repeat start does not execute twice. `/reconcile` only reads original channels; `/retry` executes only explicitly failed items, preserving UNKNOWN items for review. Target association/version changes block execution. The existing CUSTOM route remains separate. No response or task exports upstream credentials.

The 2026-11-13 crash-recovery correction extends the priority replay guarantee across backend process failure for NEWAPI and CCMAX_NATIVE. The UNKNOWN write intent commits before network access; a PostgreSQL session lock serializes start/retry/reconcile while the network call runs outside that transaction. Legacy previews with no durable-intent version require read-only reconciliation before another write. A confirmed NewAPI PUT followed by failed readback remains UNKNOWN, and cannot enter failed-only retry. See `ccmax-native-integration.md` for the isolated process-kill/restart evidence and the distinction from real-provider outage acceptance.

Production HTTP origins also receive a cryptographically random UUID fallback because `crypto.randomUUID()` is restricted to secure contexts; recovered resource detail components no longer throw before rendering on the default HTTP deployment.

The integration changes were checked against the official [channel routes](https://github.com/QuantumNous/new-api/blob/main/router/channel-router.go), [channel status controller](https://github.com/QuantumNous/new-api/blob/main/controller/channel.go) and [channel edit field permissions](https://github.com/QuantumNous/new-api/blob/main/controller/channel_authz.go). Upstream permission failures remain failures, with no fallback after authentication or application-level rejection. Real production retesting of channel 148 is pending deployment of these fixes.

## CCMAX native integration — 2026-11-11

The authorized Claude Gateway deployment supplied its native management protocol, which is now supported separately as `CCMAX_NATIVE`. See [native configuration, route mapping and acceptance boundaries](ccmax-native-integration.md). The earlier CUSTOM limitations in this document apply to CUSTOM, not to the observed native protocol. Real native administrator login, existing-account binding, status/usage readback and OAuth-link generation were verified from an isolated local Hispread instance; server deployment and live account mutations remain separate acceptance steps.

## Verification

The 2026-11-10 follow-up fixes give `GET` and `PUT /api/resource-targets/{id}/sync-settings` the same allowlisted response: `perTargetConcurrency`, `globalConcurrency`, `effectiveConcurrency`, `targetVersion`, and `globalVersion`. Neither response returns target configuration or credentials. PUT requires integer limits of 1–32 per target and 1–64 globally, plus both nonnegative versions. PostgreSQL transactions and a shared advisory lock reject stale target/global updates; the global limit is stored once for all targets. Legacy per-target settings remain readable. Existing valid per-target values are retained; missing/invalid values use 2, and the initial global value uses the latest valid legacy value or 4. The recovered editor refreshes its parent target version after saving, so opening the target editor does not immediately submit a stale version.

CCMAX `/resources/sync`, `/jobs/ccmax/daily-sync`, and `/jobs/ccmax/status-sync` requests now take shared per-target/global permits before sending a batch. Existing in-flight requests finish when a limit is lowered; later requests wait within a bounded queue timeout. These permits are shared within one backend process, matching the provided one-backend Docker deployment. A future multi-replica deployment requires a distributed permit implementation.

An already confirmed REMOVE operation keeps its durable GONE receipt when reconciled, without sending another delete or reading a channel that no longer exists. Partial deletion reconciliation retains each previously confirmed GONE item. For an unconfirmed removal, a missing/rejected channel query is UNKNOWN with a safe manual-review message; an HTTP/application error alone does not establish deletion. Existing already-downgraded history is not retroactively declared successful without its original receipt. Removed New API channels disable detail actions and reject new backend operations (including stale priority tasks) before contacting the upstream. Idempotent replay of the original deletion request remains available.

Focused command: `mvn -q -Dtest=ProxyProbeServiceTest,NewApiResourceAdapterTest,ResourceIntegrationTest test` from `backend/`.

The fixtures use only local sockets, a dedicated self-signed localhost test certificate trusted by the fixture client, a local HTTP server and transactionally rolled-back PostgreSQL rows. They verify HTTP and HTTPS proxy CONNECT, encoded Basic credentials, SOCKS5 RFC 1929 auth, real nested TLS/hostname verification, fixed HTTPS request without leaked proxy headers, chunked egress JSON, rejection of auth failures/plain HTTP servers/private targets, official New API paths and response semantics, dual authentication headers, read-verified mapping, no USD conversion, scoped operation/target state, malformed-success UNKNOWN handling, replay after target disable/version change, OAuth draft deduplication, rotated credential storage and confirmed proxy/lifecycle projection. No real provider credentials or business network writes are used. The PEM private key is a public local fixture key, never a deployment key.
