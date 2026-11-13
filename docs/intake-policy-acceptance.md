# Native OAuth intake policy and acceptance

Date: 2026-11-13. Scope: existing native CCMAX adapter, Vue console and Bearer API. These are local implementation rules consistent with the recovered interface, not claims about the supplier site's private backend. No production account or OAuth authorization was created for this work.

## Implemented rules

- The effective policy overlays system, supplier and member settings independently. `INHERIT`, a null tier and missing tier ranges inherit the parent. A fixed range uses its exact value; a range assigns one deterministic value from the operation ID and persists it before the first provider call. Policy changes apply to later submissions; existing account priorities are not rewritten.
- Only authoritative `subscription_info.plan` values classify a new native account: `pro` is PRO; `max`, `team`, `enterprise` and `free` are NON_PRO. Missing or unknown plans fail closed with `PLAN_CHECK_FAILED`. The raw plan label remains visible. This explicit local two-category mapping is not an inferred identity from the account name or a client claim.
- Global/supplier intake switches continue to gate authorization. Global/supplier PRO permission and delivery-group PRO permission gate that category. A full PRO pool blocks PRO only; a full open non-PRO pool stops new admission, consistent with the recovered interface's non-PRO gate. Disabled non-PRO reception can still allow a permitted PRO-only submission.
- PostgreSQL serializes admission per supplier. Each new exchange reserves every still-possible category before sending the one-time callback. Once its plan is verified, only that category remains charged. Successful intake consumes one unit on its Beijing completion day; uncertain creations retain their reservation across midnight and restarts. Definite policy rejection releases unused capacity. Manual non-creation recovery cannot release a reservation after an upstream account ID has already been observed.
- Supplier, group and personal percentage allocations use integer basis points and floor their parent quantity. A blank allocation shares its pool; 0% grants zero. Sibling totals cannot exceed 100%; nested allocations require an explicit finite parent quantity and a valid member/group relationship. Foreign objects, duplicate rows, fractional basis points and group cycles are rejected. Used quantities remain attached to the frozen source chain. Personal reclaim blocks that category for the rest of the Beijing day and releases unused quota; already-used and in-flight quantities remain charged. Group deletion/member moves cannot strand personal allocations.
- Console `/cc-intake/mine` and Bearer `/open/v1/ccmax/intake` expose the same balances. Supplier principal totals cover the supplier; member totals cover only the member even for a group administrator. Historical successful receipts without a trustworthy class remain unknown and conservatively charge both pools. An archived resource does not erase historical success. Historical receipt classification is not silently rewritten from a present-day plan.
- Client attempts to set priority, tier, ranges, classification, canPro or quota sources are rejected on new submission paths. Native RT/AT/SK import routes are disabled, closing a bypass around the OAuth admission path; this preserves the user's OAuth-only requirement.

## Provider constraints and uncertain outcomes

The observed native frontend supports `weight` during OAuth exchange but supplies no proven pre-exchange plan-query API. The integration therefore requests `status=disabled` and the frozen weight on first exchange, reads the created account, verifies disabled state, checks the actual plan and reservation, then explicitly enables it and reads status/weight back. If the provider ignored the requested disabled status, the integration requests disable and verifies it before proceeding. Thus a strict guarantee that no account can ever be briefly enabled before readback depends on the provider honoring disabled creation; this remains a live contract limitation, not a passed production assertion.

A rejected/unknown plan remains disabled, returns FAILED with a reason, and never becomes a successful delivery. Its observed account association is retained for removal and review. Such an account is quarantined: RESUME and reauthorization cannot bypass the original policy check. Failures or crashes without enough evidence remain UNKNOWN; no timeout is treated as proof of non-creation. Reconciliation never re-exchanges a code or resends activation. It can confirm SUCCESS only after a persisted CLASSIFIED reservation and a matching upstream account is active at the frozen weight. An account still disabled after an interrupted activation remains UNKNOWN for review rather than being enabled automatically.

## Completed automated acceptance

Java 17 `mvn -q package`: 209 tests passed, zero failures/errors/skips. Frontend `npm run check` and production static build passed. The initial three new policy tests failed against the old implementation (unclassified totals, null limits and fractional allocation acceptance), then passed after the correction.

| Area | Executed evidence | Status |
|---|---|---|
| PRO/NON_PRO classification and policy rejection | Real adapter HTTP requests to a localhost provider, known PRO/Max/unknown metadata, disabled-first exchange and frozen weight, disallowed plan stays disabled | Isolated pass |
| Daily quota and concurrent last slot | PostgreSQL-backed admission while the first exchange is blocked; second request returns quota error before provider exchange; completed request consumes once; replay sends no second exchange | Isolated pass |
| Group/member allocations | Actual console endpoints plus ledger tests: inherited limits, nested pools, reserved remainder, percentages, ownership, reclaim, member tier, migration/deletion guards | Isolated pass |
| Positive 100% and revoked credential filtering | Adapter reads provider quota 100/100 and `health_status=revoked`; list, overview and priority preview return the same resource, nonmatching reason returns zero | Isolated pass |
| Independent native targets | Two separately listening HTTP servers with different administrator credentials/sessions but identical account IDs; only selected target receives PATCH; mixed lane ID is ambiguous | Isolated pass |
| Partial provider rejection | Separate per-item 422 response, only the explicitly failed item is retried; success is not rewritten, uncertain items are reconciled read-only | Isolated pass |
| Backend interruption/restart | Packaged application is killed after accepted exchange or activation; PostgreSQL survives and retains reservation; replay and reconciliation do not repeat the write | Isolated process pass |
| Actual Vue UI | Browser saved group 50% and member 25%, reloaded and read both values back; displayed real quota totals and source balances; missing intake-panel mount and misleading shared-source label corrected | Isolated browser pass |

Reproducible packaged checks (local PostgreSQL and packaged JAR required):

```sh
JAVA_HOME="$(/usr/libexec/java_home -v 17)" PATH="$(/usr/libexec/java_home -v 17)/bin:$PATH" \
  python3 scripts/verify-intake-restart.py --stage exchange
JAVA_HOME="$(/usr/libexec/java_home -v 17)" PATH="$(/usr/libexec/java_home -v 17)/bin:$PATH" \
  python3 scripts/verify-intake-restart.py --stage activation
```

Exchange crash result: RESERVED survives, second request returns 409 quota exhausted, original stays UNKNOWN, one exchange, zero activations. Activation crash result: CLASSIFIED survives, second request returns 409 quota exhausted, read-only recovery confirms SUCCESS, one exchange and one activation at weight 37. The partial-priority retry crash also passed with one successful-account write, two second-account attempts (one rejected), UNKNOWN after restart and COMPLETED after read-only reconciliation. These are test-provider responses, not intentionally induced failures on the deployed provider.

Sanitized results/screenshots are retained under ignored `.run/intake-policy-acceptance/`; private browser credentials and temporary databases/processes are removed. The browser page used only localhost; the existing production tab was preserved.

## Deployment and real-provider acceptance still required

Deploy the committed application using the existing `./deploy.sh`. Review the previously saved policies first: they now enforce rules instead of merely storing them. New missing supplier policies inherit the system; an existing explicit `nonProOpen=false` remains closed. No database schema migration or production counter patch is needed because ledger rows use the existing entity store.

This delivery completes implementation and isolated acceptance. It does **not** manufacture live samples or assert that the following happened on the real service:

1. A new PRO/NON_PRO OAuth exchange using these new controls, including disabled creation before plan readback. The standing user constraint is to use existing accounts and not request new OAuth; it is therefore intentionally not performed.
2. A genuine existing account reporting 100% or a credential failure. No production values were edited to simulate this.
3. Two independently deployed native provider installations. Two independent local HTTP services prove target/session routing, but are not two real provider installations.
4. A provider-owned process restart or intentional production 422/connection loss. Packaged application crash and controlled provider faults were verified locally only.

These distinctions must remain in later acceptance reports. Proxy remains deferred; RT/AT/SK imports remain excluded.

## Deployed existing-account acceptance — 2026-11-13

After deployment of `9ec203d`, the actual service passed 26 recorded assertions: eight finite-limit/allocation checks, eleven existing-member/override checks and seven final resource/configuration invariants. The expired administrator browser session was restored with the existing administrator; the existing enabled test supplier's retained credential was used without resetting credentials or creating an account. A first background login request omitted CSRF and returned 403; it is not credential-failure or permission-boundary evidence. The CSRF-corrected request succeeded.

The test supplier's original intake and PRO switches remained false throughout. Its original policy (unlimited quantities, non-PRO closed, ranges 0–100 and no explicit tier) was saved before testing. A temporary supplier-only policy set PRO=4, NON_PRO=8 and a fixed NORMAL priority range of 37. Fractional quantities returned 400; saving succeeded and stale policy versions returned 409. With the existing delivery group allocated 50% of each category, supplier available balances became 2/4 and reserved remainders 2/4. Fractional basis points returned 400, saved allocations survived a fresh read, and stale allocation versions returned 409.

The existing disabled test member was temporarily enabled; no new member was created. A one-day temporary member API key was issued through the administrator's supported token endpoint. Cookie-free Bearer requests returned group-source limits/balances 2/4. A nested personal 50% allocation returned personal limits/balances 1/2; supplier balances remained 2/4, proving the nested reserve was not deducted twice. Removing the personal allocation returned `reclaimed=true` and zero available for both categories that day. Client-supplied classification and priority were rejected with `CCMAX_POLICY_OVERRIDE_FORBIDDEN`; a native raw-import request was rejected with `CCMAX_RAW_IMPORT_DISABLED` before a resource or upstream account was created.

The original supplier policy and empty allocation list were restored. Policy version advanced 0→2 and allocation version advanced to 6 as expected for audited configuration writes. The tested member returned to disabled (user version 14); the temporary key was revoked and reuse returned 401. Current-day GROUP/USER reclaim markers created by the explicit reclaim checks remain until the next Beijing day, per the implemented semantics; no hidden counter reset was attempted. The tested member stays disabled and all intake switches stay closed, so these markers do not affect currently permitted intake. The background supplier session was logged out and private cookie/key files were removed.

The actual supplier browser displayed today's zero totals, unlimited restored balances, closed intake and the allocation interface. All eight resource records retained their original versions and states; the actual upstream still listed the same three ACTIVE accounts, each at weight 10. Global settings stayed at version 9, concurrency 10 and timeout 120; supplier settings stayed at version 8 with intake/PRO disabled. All scheduled tasks stayed disabled. Nonmatching `revoked` list/overview filters returned zero, with no production telemetry altered. No OAuth authorization, account creation, priority execution or upstream lifecycle write occurred.

Two UI defects found during this acceptance are corrected separately: system settings retained obsolete statements that classification/PRO rules were not enforced, and a historical system policy without a tier displayed a blank picker although the backend uses NORMAL. The correction displays the effective NORMAL default without changing the stored policy until an explicit save, and describes the enforced native rules. Frontend check/production build passed. A read-only local replay of six actual deployed responses verified the picker reads 常规 and both obsolete statements are absent; all mutation methods on that replay server were disabled. These two frontend corrections require a new deployment. Sanitized evidence is in ignored `.run/intake-policy-deployed-9ec203d/`.

This closes deployed configuration, allowance arithmetic, existing-member Bearer projection, reclaim and client-override compatibility. New-account classification/priority activation still needs a permitted real callback; positive provider 100%/credential-failure samples, two real provider installations and intentionally induced real provider faults remain unperformed for the reasons above. The isolated proofs remain valid but are not relabeled as live provider acceptance.
