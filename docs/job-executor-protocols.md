# Background job executors

Implemented and verified 2026-11-09. The recovered UI contract is in `frontend/src/recovered/ScheduledTasks-DQG4VARN.js`, `ScheduledTaskRuns-DXdXtjvS.js`, and `PrioritySupportDialog-DfV-rWYR.js`.

The original private CCMAX provider implementation was unavailable. The paths below define this repository's **CUSTOM adapter contract**, not a claimed public CCMAX API. Configure an enabled `resource-target` with `protocol=CUSTOM` (the default), server-owned `baseUrl`, `upstreamPathPrefix` (default `/api`), and optional server-side credentials. `NEWAPI` targets are excluded because their public channel API does not supply this observation/rotation contract. Set `targetId` on a task to select one target; null processes enabled CUSTOM targets. Resources are selected by `resource.targetId` / `upstreamTargetId`; legacy resources without a binding are assigned only to the unique enabled target or unique default. Suppliers must be enabled and approved.

## Job lifecycle

- Readiness is computed from executable job type and current server configuration; enabling an unready task returns 503. Unconfigured jobs never manufacture successful runs.
- A PostgreSQL session advisory lock prevents concurrent executions across app instances. All priority rotations share one lock so overlapping tasks cannot race snapshots. A separate connection holds that lock while run records and remote-operation snapshots are committed in short transactions. Connection loss releases the lock. The next run marks abandoned RUNNING records TIMED_OUT/LEASE_LOST.
- A started execution persists RUNNING, then SUCCESS or FAILED with `resultCode`, safe message and completion time. The task always clears `running`; failures also advance the next scheduled run, preventing a 15-second retry storm. Disabled manual runs do not create a future scheduled time.
- Per-target synchronization batches are validated before persistence. Earlier successful target batches remain durable if a later target fails; repeating the job deduplicates stored daily rows.
- Existing settlement deadline confirmation and explicit opt-in quote renewal remain local. Quote renewal creates one new PENDING quotation per source/date range and requires subsequent review.

## CCMAX daily observations

`POST {base}{prefix}/jobs/ccmax/daily-sync`, `Authorization` according to the saved resource target, `Idempotency-Key: system-job:{runId}:{targetId}`.

```json
{
  "runId": "local-run-id",
  "targetId": "configured-target-id",
  "businessDate": "2026-11-08",
  "resources": [
    {"resourceId":"local-resource-id","supplierId":"local-supplier-id","projectId":"local-project-id","laneId":"provider-lane"}
  ]
}
```

The date is the previous day in Asia/Shanghai. The response must be an object with explicit success and at most 50,000 rows:

```json
{
  "state":"SUCCESS",
  "rows":[
    {"resourceId":"local-resource-id","supplierId":"local-supplier-id","businessDate":"2026-11-08","model":"model-name","currency":"USD","originalAmount":"20.50"}
  ]
}
```

`quantity` is additionally required as a positive integer for FIXED quotes. Amounts/quantities must be nonnegative decimals with at most 30 significant digits / 8 decimal places. Currency is USD, CNY or USDT. A returned resource must have been requested, its supplier must match, and the date must equal the requested date. Duplicate resource/date/model/currency rows fail the batch.

The server selects exactly one approved quote belonging to the resource's supplier/project/currency and covering the date, applies approved price history via `QuotePricingService`, and computes payable itself. No upstream payable, owner, quote, settlement, state or arbitrary fields are copied. A deterministic source reference and IDs persist both `input` and supplier-facing `bill` observations with `state=PENDING`, `reviewStatus=PENDING`; these observations are visible for reconciliation and cannot enter settlement while pending. They do not approve a quote, confirm a bill, settle or post a ledger entry. Corrections with a changed original amount/quantity conflict rather than silently rewriting a previously observed source. Repeat identical daily sync inserts nothing. Financial staff confirm observations explicitly through `POST /api/settlement-inputs/{id}/confirm` with `{version}` and existing `usage.import` permission (finance/admin only). Confirmation checks the current unique effective quote and its recorded price/currency against the immutable collection snapshot, approved supplier/enabled project, and paired bill amounts. It atomically records the reviewer, sets input AVAILABLE/reviewStatus CONFIRMED and supplier bill CONFIRMED, and audits the review. Repeating a completed confirmation is idempotent. Confirmed inputs enter the existing `/settlements/preview` and settlement creation flow. Changes to pricing or conflicting source records require explicit reconciliation; no implicit approval is introduced by the collector.

## CCMAX status and usage

`POST {base}{prefix}/jobs/ccmax/status-sync` with the same request resource list, run and target fields. Response:

```json
{
  "state":"SUCCESS",
  "resources":[
    {"resourceId":"local-resource-id","supplierId":"local-supplier-id","operationalState":"READY","priority":50,"usage":{"amount":"30.00","currency":"USD"}}
  ]
}
```

Allowed operational states: READY, ACTIVE, PAUSED, DISABLED, EXPIRED, ERROR, UNAVAILABLE. Optional priority is an integer from 0 to 1000. Optional usage amount/currency uses the same decimal/currency validation. Only these fields and local observation timestamps update existing scoped resources. A complete supplier/target/currency observation also records a supplier usage snapshot. Partial resource responses never create a complete supplier total.

All remote operations require `state=SUCCESS`; an explicit `success=false`, nonzero `errcode`, HTTP error, invalid JSON, malformed fields or mismatched resource/supplier produces a failed run. Targets use the existing gateway's HTTPS, DNS/private-address policy, timeout and no-redirect handling. Private HTTP fixtures require both the `test` profile and `app.integrations.allow-private-targets=true`.

## Recoverable priority rotation

`settings` retains the recovered UI payload: mode ROTATION or SUPPLIER_IDLE; scope SELECTED, TIERS, ALL; supplierIds; tiers; basisPoints 1–10000; maxAccounts 1–50000; priority 0–1000. Eligible resources belong to approved/enabled suppliers and have operationalState READY or ACTIVE. Each supplier receives at most `min(maxAccounts, ceil(eligibleCount*basisPoints/10000))` resources; ordering favors the oldest/no `lastPriorityBoostAt`, then resource ID. TIERS uses the saved supplier priorityTier (or tier).

Every cycle first restores all previous nonclosed snapshots. Any unresolved restore blocks new boosts. SUPPLIER_IDLE then performs status/usage collection and requires two complete successful observations with unchanged total, currency and resource count; the first observation only establishes a baseline. Changed totals restore the previous batch and skip a new boost for that cycle.

Before modifying priority, query the actual upstream values:

`POST {base}{prefix}/jobs/ccmax/priority/read`

```json
{"supplierId":"supplier-id","resourceIds":["resource-id"]}
```

```json
{"state":"SUCCESS","priorities":[{"resourceId":"resource-id","supplierId":"supplier-id","priority":70}]}
```

The response must contain exactly one valid original priority for every selected resource. The app commits a BOOSTING round with those original values before any write.

`POST {base}{prefix}/resources/{urlEncodedLocalResourceId}/priority`

```json
{"resourceId":"resource-id","supplierId":"supplier-id","priority":10}
```

```json
{"state":"SUCCESS","resourceId":"resource-id","supplierId":"supplier-id","priority":10}
```

A synchronous confirmation with matching IDs and exact priority is required. Boost keys are `priority:{roundId}:boost:{resourceId}`; restore keys are `priority:{roundId}:restore:{resourceId}`. **The adapter must apply priority as an absolute assignment and honor these idempotency keys.** Successful writes persist local priority and progress. Rounds become ACTIVE, RESTORING, CLOSED or RESTORE_FAILED. Any failed/unknown boost retains the original snapshot and blocks another boost until restoration. Every potential write is restored, including a timeout that may have applied remotely. Restoration intentionally restores the preboost priority even if a person changed priority during the round, matching the recovered UI note.

`POST /api/system/scheduled-tasks/{key}/rotation-settings/retry-restore` executes outstanding failed/incomplete restores immediately. It skips already restored items, keeps failures visible, and returns `{restored,failed}`. Disabling a rotation also attempts restoration. Unavailable/disabled targets require repairing/re-enabling the target before retrying. The settings API exposes the latest 10 summary rounds and `restoreFailedCount` while keeping internal account snapshots out of the browser response.

## Official WeCom robot reminders

Primary source: [WeCom developer center — Message push configuration (91770)](https://developer.work.weixin.qq.com/document/path/91770), retrieved 2026-11-09. It documents HTTP POST to `https://qyapi.weixin.qq.com/cgi-bin/webhook/send?key=…`, UTF-8 payloads with `msgtype`/`markdown.content`, a 4096-byte markdown limit, a 20-message/minute limit, webhook secrecy, and JSON `errcode`/`errmsg` responses.

Only the official HTTPS host/path and one `key` parameter are accepted in production; redirects are never followed. Set server environment `WECOM_ENCRYPTION_KEY` (Base64-encoded 32 random bytes), or Spring `app.jobs.wecom.encryption-key`. Save the robot through the existing admin settings endpoint. Its webhook is AES-256-GCM encrypted with a fresh IV before database storage, never returned to the browser or run records. Blank webhook preserves the encrypted value; clearWebhook deletes it. Missing/wrong encryption keys make the task unready. The optional displayed workbenchUrl must use HTTPS. Keep the encryption key in server secret configuration and back it up separately; changing it requires resaving the webhook.

The execution queries platform-wide pending quote, supplier qualification, collection-account and payment review counts. It sends aggregate category counts and the optional workbench link only; no names, account numbers, amounts, tokens or individual tasks enter the message. Zero totals produce NO_TODOS and no HTTP request. A durable, globally serialized attempt claim permits at most one attempt per configured job interval, with a minimum 60-second cooldown; repeated manual/scheduled requests during that interval return DUPLICATE_SUPPRESSED. The claim is committed **before** HTTP, so unknown timeout/network outcomes cannot trigger immediate duplicate spam. An unchanged outstanding count may be reminded again on the next configured interval. WeCom offers no server-side idempotency protocol, so exactly-once delivery is not claimed; after the cooldown an unknown outcome may be retried.

HTTP non-2xx yields WECOM_HTTP_ERROR; invalid/missing integer errcode yields WECOM_INVALID_RESPONSE; nonzero errcode yields WECOM_REJECTED; network/timeout outcomes yield WECOM_NETWORK_ERROR/WECOM_TIMEOUT. Only errcode=0 is SENT. Error messages never echo the webhook or provider response content. Saving settings does not send a message. Test HTTP loopback endpoints are accepted only with the test profile plus private-target flag.

## Verification

`mvn -q -Dtest=BackgroundJobExecutionIntegrationTest,ExplicitJobConfigurationTest test` uses a local HTTP server and the actual PostgreSQL schema. It checks outgoing paths/auth/idempotency payloads, validated and locally priced daily writes, duplicate/source handling, scoped resource updates, HTTP/business errors, readiness, two-observation idle selection, rotation/restore order, pause-on-failed-restore, idempotent retry and disable restoration, encryption/masking, aggregate-only official-format messages and repeat suppression. The sync→preview→financial confirmation→preview workflow verifies pending data is excluded and confirmed local payable becomes settleable. A test without an ambient transaction verifies committed snapshots survive independent failed runs and can be restored afterward. No live third-party business operation or real webhook is used.
