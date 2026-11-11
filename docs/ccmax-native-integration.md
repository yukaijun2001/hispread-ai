# CCMAX native integration and acceptance — 2026-11-11

`CCMAX_NATIVE` is the observed Claude Gateway administrator protocol. It is separate from this repository's `CUSTOM` adapter contract and the numeric-channel `NEWAPI` protocol. Evidence came from the authorized deployment's public client and authenticated administrator UI; its server source was not supplied. Native route compatibility remains tied to that deployment's version.

## Configuration

In **资源接口配置 → 新增目标**, select **CCMAX 原生管理接口** and enter the service origin, administrator username and password. An inference `sk-…` key is not a management credential. HTTP requires explicit approval in the form. Default native per-request timeout is 60,000 ms; the supplied service showed multi-second queries and a usage refresh over 20 seconds. The frontend reverse-proxy timeout allows up to 180 seconds for sequential authentication/readback calls. These changes do not eliminate upstream slowness.

Credentials are read only by the server and are omitted from target reads, updates, resource results and acceptance artifacts. Blank password on edit preserves the stored value. Administrator sessions are cached in memory, bound to the target version, expire conservatively and are renewed by a fresh administrator login after one 401. A 401 permits one retry; timeouts and ambiguous business writes are never automatically repeated. PostgreSQL currently stores administrator credentials in server-only JSONB, without field encryption; use the same encrypted-volume/secret boundary required by other saved integration credentials.

## Protocol mapping

| Hispread operation | Native request | Result |
|---|---|---|
| Administrator authentication | POST `/api/auth/admin-login` with identifier/email/password | Require administrator role and access token |
| Connection test | GET `/api/auth/me` | READY only for administrator role |
| Select existing accounts | GET `/api/admin/oauth-accounts?page_mode=1&page=…&page_size=20&query=…` | Allowlisted id/name/status/health/weight/type |
| Bind existing account | GET `/api/admin/oauth-accounts/{accountId}` | Verify ID before storing target/account mapping; preserve DRAFT/NOT_SUBMITTED |
| Refresh usage | POST account `/refresh-usage`, then GET account | UPDATED after confirmed refresh; lifetime cost remains observational USD |
| Refresh credentials | POST account `/refresh` with `force:false`, then GET account | UPDATED only on the native refresh receipt; raw credentials never copied back |
| Pause / resume | PATCH account `{status:"disabled"|"active"}`, then GET account | PAUSED/RESUMED after matching readback |
| Remove | DELETE account `{release_proxy:false}`, then GET `/api/admin/archived-accounts/{id}` | GONE means archive, not permanent purge |
| Priority | PATCH account `{weight:n}`, then GET account | Existing local PREVIEW/start/reconcile jobs; 0–1000 absolute weight |
| New OAuth | POST `/api/admin/oauth-accounts/auth-url`, then `/exchange` | Opaque local session; pending_state and `code#state` verified |
| Reauthorize bound account | POST account `/reauthorize`, then `/reauthorize/exchange` | Same account ID and original enabled/disabled status required |
| Refresh/access token intake | POST `/api/admin/oauth-accounts/import-rt` | Actual native import; not yet live-accepted with a disposable credential |
| Session-key intake | POST `/api/admin/oauth-accounts/import-by-session-key/batch` | Exactly one confirmed result required |
| Background status | GET each mapped account | Scoped health/status, weight and observational cost |
| Background daily cost | Cursor GET `/api/admin/request-logs` for the preceding Asia/Shanghai date | Aggregate exact decimal `cost_official_usd` by mapped account/model into pending observations |

CCMAX input and OAuth choose the unique eligible CCMAX target when no explicit target is supplied; an unrelated NEWAPI default cannot capture those calls. Existing resources retain target affinity. Administrator-only binding rejects duplicate target/account mappings, stale local versions and replacing a different mapping. Suppliers cannot browse global upstream accounts; member resource scope is still enforced at the local resource boundary.

Both OAuth generation and exchange explicitly send `overwrite_existing:false`. New intake snapshots existing upstream IDs and rejects a response that identifies an existing account or reports overwrite; it cannot undo an upstream implementation that changes credentials despite the flag, so no new delivery/account count is manufactured. Reauthorization is a separate, explicit original-account operation. Invalid state is rejected before creating the completion operation; the successful original request can be replayed without another code exchange. Pending/unknown results do not justify resubmitting the one-time callback.

Daily sync checks dates, account mappings, duplicate log IDs, cursor progress, monetary bounds and failure flags before returning totals. It never persists prompts, response bodies, session keys or client credentials from native logs. A billing failure or inconsistent source fails the batch; it does not manufacture zero usage. Existing quote validation and pending-observation confirmation remain authoritative. Lifetime account totals are not daily ledger sources. Automatic priority rotation still requires CUSTOM's original-priority snapshot/restore contract and remains unavailable for native-only deployments.

Native proxy replacement, automatic account model-call testing and upstream permanent purge are deliberately unavailable. Native proxy selection needs an explicit upstream-proxy-ID mapping; the current native intake uses direct mode. The supplied production account was not paused, archived or forced to refresh credentials during live acceptance.

## Verification evidence

Automated PostgreSQL/HTTP-fixture coverage lives in `ResourceIntegrationTest`: native target secret projection, administrator login and a single 401 re-login, mapping/deduplication/tenant denial, usage refresh and read-only timeout reconciliation, lifecycle/readback/idempotency, weight preview/start/reconcile, OAuth state rejection and successful replay, existing-account detection, original-account reauthorization preserving disabled state, refresh-token intake/credential refresh, archive receipts and scoped daily decimal aggregation. The full backend suite and frontend check/build are required before push.

Real live acceptance used an isolated local Hispread backend/database schema and Vue page connected to the authorized native upstream. It verified saved administrator credentials without response leakage, connection READY, a read-only existing-account binding, ACTIVE/healthy/weight 10 readback, lifetime USD observation, refresh-usage UPDATED and original-account OAuth-link READY with an official `https://claude.ai/oauth/authorize` URL. No server-deployed Hispread records or upstream account lifecycle/priority settings were changed by those checks. Machine-specific reports and credentials remain only in ignored `.run/` paths.

Remaining live acceptance after deploying this commit: configure the native target on the server and repeat the read-only path; use a disposable account for pause/resume, archive, credential rotation and distinct new intake; complete a freshly generated official callback through Hispread; compare daily observations to the upstream date/model totals. Supplying an administrator login alone does not establish these business operations passed.
