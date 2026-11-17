# Functional inventory — supplier-facing & shared business modules
Source: `frontend/src/recovered/` (de-minified Vite/React build rendered through `../runtime/vue-compat.js`). Read-only analysis; no files in the repo were changed. Line numbers refer to the recovered files as they are on disk.

**How to read this**
- Index aliases are listed per module as imported (e.g. `C, S, rt`). For convenience, Appendix A resolves them (`S` = `useApi`, `rt` = POST, `it` = PUT, `$` = raw fetch, `C` = app context `{has, user, refresh, notify}`, `mt` = `t()`), since API behaviour can't be read without knowing which alias is the HTTP client.
- Sub-components inside a module are named by their local minified identifier plus line range.
- "Unreferenced" means no other recovered module or `src/runtime` file imports it (checked with grep). Those modules may be dead code.
- Hand-written modules (they import `../runtime/vue-compat.js` and mostly skip i18n): PaymentForm, DailyExports, PriorityBatchDialog. Some compiled modules also contain hand-patched lines; I flag them where I saw them.

## Module index
| Module (file) | ~Lines | Rendered by / route |
|---|---|---|
| Workbench (`Workbench-CVusO4pD.js`) | 976 | `#/workbench`; exports `TurnoverRecords` (shown in Reports) |
| Quotes (`Quotes-BL6CyQ42.js`) | 1180 | `#/quotes` |
| QuotePeriodPanel | 254 | Quotes adjust dialog |
| QuotePriceHistory | 55 | Quotes drawer/dialog |
| QuoteRankingResults | 112 | Quotes ranking tab |
| ApprovedQuoteRejection | 103 | Quotes |
| quoteHelpers | 156 | helpers |
| Settlements | 36 | `#/settlements` shell |
| SettlementManagement | 796 | settlements tabs: statements (+ hosts other tabs) |
| DailyAccounting | 727 | `?tab=daily` (platform) |
| DailyExports | 90 | DailyAccounting |
| SupplierBills | 690 | `?tab=daily` (supplier) / `?tab=departments` |
| PaymentsTab | 523 | `?tab=payments` |
| PaymentForm | 43 | SettlementDetail, PaymentsTab |
| usePaymentEvidence | 286 | PaymentForm, PaymentsTab |
| ExchangeRatesTab | 177 | `?tab=rates` |
| SettlementDetail | 430 | drawer from SettlementManagement |
| SettlementBatch | 612 | SettlementManagement |
| SettlementPreview | 233 | SettlementManagement, SettlementBatch |
| SettlementInputs | 346 | `?tab=inputs`; ReceiveAmountModal |
| SettlementResourceTable | 81 | SettlementDetail, SettlementPreview |
| Resources (`Resources-CXo1DF00.js`) | 3165 | `#/resources`, `#/resources-pending`, `#/deliveries`, `#/deliveries-pending` |
| ResourceForm | 757 | Resources |
| ResourceDetail | 474 | Resources |
| ResourceLifecycleDialog | 178 | Resources |
| NewDelivery | 631 | Resources |
| CcmaxBatchDelivery | 327 | Resources (currently unreachable — no trigger) |
| CcmaxResourceOverview | 300 | Resources |
| CurrentResourceOverview | 288 | unreferenced |
| IntakeToday | 125 | Resources, CcmaxResourceOverview |
| IntakeReviewDialog | 204 | Resources |
| IntakeAllocationDialog | 441 | SupplierAgents |
| IntakePolicyPanel | 361 | SystemSettings, SupplierPlatformSettings (out of scope) |
| IntakeProjectTypes | 82 | Projects (out of scope) |
| PriorityBatchDialog | 45 | ResourceTargets (out of scope) |
| PrioritySupportDialog | 386 | unreferenced |
| useDeliveryProxies | 50 | ResourceForm, CcmaxBatchDelivery |
| resourceHelpers | 428 | Resources family |
| OutboundProxies | 743 | `#/outbound-proxies` |
| SupplierAgents | 732 | `#/supplier-agents` |
| SupplierTeamGroups | 218 | SupplierAgents |
| SupplierMemberGroupDialog | 89 | SupplierAgents |
| Reports | 637 | `#/reports` |
| DailyCreationAnalysis | 603 | unreferenced (route uses `runtime/onboarding-statistics.js`) |
| ApiDocs | 822 (≈117 KB) | `#/api-docs` |
| ApiTokens | 307 | AccountDialogs, Users (out of scope) |
| MySupplierProfile | 637 | Suppliers page for supplier users (out of scope) |
| AccountDialogs | 270 | app shell, ApiDocs, Suppliers/Users |
| QueryFilters | 218 | shared |
| DateRangePicker | 292 | shared |
| MoneyDisplay | 62 | shared |
| labels / systemLabels / projectOptions / useSummaryRefresh | 48 / 39 / 27 / 21 | shared |

## Things to check before porting (bugs, gaps, inconsistencies I found)
1. **SupplierAgents project-permission dialog**: the 保存 button only renders while the *search text* state `v` is non-empty (`SupplierAgents` L257). This looks like a de-minification or recovery bug. Confirm the intended condition.
2. **CcmaxBatchDelivery is unreachable**: Resources renders it when state `v` is true, but nothing sets `v` to true (Resources L2219/L3007). PriorityBatchDialog is listed in Resources' `__vite__mapDeps` but isn't imported there.
3. **Reauthorization submit verb differs**: Resources `vt` uses `PUT /resources/{id}/reauthorizations/{reauthId}` (L2040). `runtime/ccmax-native.js` L116 uses POST on the same path. ApiDocs documents PUT for the Open API.
4. **Float arithmetic**: the Workbench balance is `Math.max(0, Number(total) − Number(received|paid))` (L710). The turnover chart also sums with `Number()` (L204-212). Everything else uses BigInt decimal helpers. Decide whether to keep or fix this.
5. **Mixed time zones**: most "today" logic is Beijing (`Asia/Shanghai`). These defaults use the browser's local time instead: SettlementInputs manual-entry dates (index `U`), the Reports month range, DateRangePicker's grid cells, datetime-local → ISO conversion for settlement/batch deadlines, the ExchangeRates default `effectiveFrom`, and the PaymentForm/ResourceForm expiry stamps.
6. **Deadline defaults differ**: a single settlement defaults to now + 5 days rounded up to 15 min (SettlementManagement L73-76). A batch defaults to now + 5 days at the top of the hour (SettlementBatch L155-158).
7. **Hand-patched code**: some lines skip i18n and some errors use `window.alert`: DailyAccounting L549-560 (`confirmRequest`), the PaymentsTab legacy channel panel `N` (L127-148), Resources admin link buttons, Reports `RoleAwareReports`, IntakePolicyPanel tier default (L40-42).
8. **Unreferenced modules**: CurrentResourceOverview, DailyCreationAnalysis, PrioritySupportDialog. Confirm whether to port them.
9. **No client-side 409 handling**: version conflicts surface as the localised server message. The only "retry" flows are the idempotent `requestKey` patterns.
10. **Out-of-scope dependencies** that affect in-scope behaviour: `runtime/newapi-channel.js`, `runtime/ccmax-native.js`, `runtime/lifecycle-intent.js` (Resources), `runtime/ccmax-openapi.js` (ApiDocs), `views/roles/OperationsReport.js` (Reports), and the Suppliers helpers used by MySupplierProfile. I only grepped the runtime files, apart from lifecycle-intent, which I read in full.

---
## Shared helpers & components

### labels-DaPzz6Ie.js (~48 lines)
- Purpose: label maps for CC-intake / priority-support features. No API. Imports index `mt, pt`.
- Exports: `a` = intake priority-tier labels {FALLBACK 补充兜底, NORMAL 常规, PAYMENT_TERM 账期优先, PARTNER 重点合作, TEMPORARY 临时调度} (L6-12); `r` = batch-item state labels {PREPARING, PREVIEW, PENDING, SUBMITTING, VERIFYING, UPDATED, UNCHANGED, FAILED, UNKNOWN, SKIPPED} (L13-24); `t(n)` = number formatter, `null`→"不限" (L25); `i(key)` = quota-source label by prefix `U:`→个人预留, `G:`→交付组共享池, else 供应商共享池 (L27-29); `n(accepting, reason)` = intake-availability label with reason map PLATFORM_STOPPED/SUPPLIER_DISABLED/NON_PRO_STOPPED/PRO_DISABLED/GROUP_PRO_DISABLED/NO_QUOTA/QUOTA_RECLAIMED/QUOTA_RESERVED/QUOTA_FULL/NON_PRO_UNAVAILABLE, fallback 当前账号暂不接收 (L31-46).

### systemLabels-DqpNuQ-_.js (~39 lines)
- Purpose: localise system-defined names. No API. Imports index `ht, mt`.
- `i(unit)` = unit label via context `unit::<x>` (L6); `n(role)` = builtin role names (ADMIN/OPERATOR/FINANCE/SUPPLIER/SUPPLIER_AGENT/CCMAX优先级扶持) translated only if `builtIn!==false` and name unchanged (L8-18); `r(task)` = scheduled-task name localiser (L20-28); `t(project)` = capacity caption: ACCOUNT_COUNT→可提供账号数（个）, THROUGHPUT→项目合计每分钟调用能力, ACCOUNT_QUOTA→"{scope} · {period}（{capacityCurrency}）" where capacityPeriod DAY/MONTH/else total, capacityScope PER_ACCOUNT/all (L30-37).

### projectOptions-RFlNxqPH.js (~27 lines)
- Purpose: build a disambiguated `<Select>` option for a project. Imports index `E, O, mt`.
- `t(project, allProjects, markDisabled=false)` (L7-24): groups same-name projects; label suffix = [category (only if same-named projects differ in category), settlementMethod label, deliveryMethod label] joined " · "; if still ambiguous, "同名项目 N" ordered by `code` then `id`; returns `{value:id, label:name, shortLabel, detail, disabled: markDisabled && !enabled}` (+"已停用" in detail).

### useSummaryRefresh-B-5uMwFV.js (~21 lines)
- Purpose: hook `t(data, reload)` — if `data.summaryUpdating` is truthy, reload after **2500 ms** (and on visibilitychange when visible) (L7-17). Used to poll async summaries. Imports index `Z, vt`.

### MoneyDisplay-Bphc56N8.js (~62 lines)
- Purpose: `<MoneyDisplay currency value>` — shows `formatMoney(value,currency)` (index `A`); `null`→`—`. If rounded display ≠ exact string, prefixes `≈`; if it rounds to zero shows `< 0.01` / `> -0.01` (`1` for JPY) (L20-27). Click toggles a "完整原值" popover with raw value; Esc closes; click `stopPropagation` (so it works inside clickable rows). Imports index `A, X, Z, mt, vt`.
- **Rule**: money values arrive as decimal strings; never parse to float for display.

### quoteHelpers-Fmn-ErWD.js (~156 lines)
- Purpose: quote domain helpers. No API. Imports index `F, ct, j, mt, pt, ut`. (Export aliases listed; local names in parentheses.)
- `r` (o) = decimal regex `/^\d+(?:\.\d+)?$/` (L10). `d` (s) = decimal-string equality ignoring leading/trailing zeros (L12-18).
- internal `c()` = last day of the current **Beijing** month via `Date.UTC(y, m, 0)` (L20-23) → default `effectiveTo`.
- `c` (l) = current price string: FIXED→unitPrice, else `multiplier ?? ratePercent/100` (L25-27).
- `f` (u) = sort price history by `effectiveAt` asc, then `approvedAt` (L29-31).
- `l` (d) = price in effect on date: cutoff = `Date.now()` if date is Beijing-today else `${date}T23:59:59.999+08:00` (L33-37). **Beijing-time effective dating.**
- `t` (f) = format ISO date in Asia/Shanghai (year/month/day) (L39-47).
- `i` (h) = quote-form row factory `(supplierId, quote?, editing=false)` (L54-75): key `quote-<ts>-<n>`; `currency` default `USD`; `unitPrice` dropped when cloning a non-USD quote; `multiplier` field holds **percent** (`ct` ×100), default **`80`**, else ratePercent; `taxInclusive` `'true'|'false'` (default true); `effectiveFrom` = Beijing today, `effectiveTo` = month end (both blank when cloning); capacity accountCount/accountQuota/rpm/tpm; `serviceCapacityNote`.
- `s` (g) = positive-integer regex `/^[1-9]\d*$/` (L76).
- `n` (_) = capacity text: ACCOUNT_COUNT "{n} 个", ACCOUNT_QUOTA "{quota} {capacityCurrency}", THROUGHPUT "{rpm} RPM / {tpm} TPM", else 未填写 (L78-80).
- `u` (v) = quote state filter options: `CURRENT` 待审/已通过 (default), `` 全部, PENDING, CHANGE_PENDING, APPROVED, REJECTED, WITHDRAWN (L81-109).
- `p` (y) = "建议折扣 {discount}" from suggested multiplier (L111-113).
- `o` (b) = pending-change summary from `pendingChange{state==='PENDING', proposedMultiplier|proposedUnitPrice, priceEffectiveFrom, proposedFrom/To vs oldFrom/To}` → "待审：…" (L115-120).
- internal `x(a,b)` = signed BigInt decimal compare (L122-145). `a` (S) = bounds check → "报价折扣必须在 {min%} 至 {max%} 之间" when outside `bounds.min..max` (L147-149); bounds from `GET /quotes/multiplier-bounds`.
- `m` (C) = upcoming price text from `upcomingPrice{effectiveFrom, multiplier|unitPrice}` (L151-154).

### QuotePriceHistory-MZUPeopf.js (~55 lines)
- Purpose: `<QuotePriceHistory quote history>` table "价格版本" (used in Quotes detail). No API. Imports index `F, X, c, j, mt, ut`; siblings systemLabels `i`, quoteHelpers `f, t`.
- Columns: 价格 (FIXED: "{currency} {unitPrice} / {unit}", else discount), 生效日期 (Beijing date), 状态 = 已替代价格 (another entry has identical effectiveAt later in list) / 历史价格 / 未来价格 / 当前价格; whole quote counts as history if `effectiveTo < BeijingToday` (L20-50). Caption: "按北京时间的日期生效；历史价格和已形成的费用快照保留。"

### resourceHelpers-DoyalwRL.js (~428 lines)
- Purpose: resource/delivery status helpers + `ProxyCombobox`. No API. Imports index `D, X, Y, Z, g, mt, o, ot, pt, vt`; sibling CcmaxResourceOverview `n` (lane-state label map). Export aliases first, local in parentheses.
- Health: `A` (p) CCMAX `resourceData.health.credentialFailureReason` (L20-25); `j` (m) reason == "accesstoken已过期(等待自动续期)" (normalised) (L27-29); `M` (h) account invalid = laneState≠GONE and reason contains 账号受限(account_on_hold) / 认证被拒绝(具体原因未确认) / 需要身份验证(kyc) (L31-34); `N` (g) `health.paused===true` (L36-39); `O` (v) `<ResourceHealthNotice resource>` red (invalid) / amber (L189-204).
- `k` (_) `<ProxyCombobox>` (L41-187): props value, selected, options[{id,name,protocol,endpoint,enabled,maxResources,usedResources,reservedResources}], loading, loadingMore, error, onRetry, disabled, canRecord (may paste a new proxy URL), ownProxyId, allowFull, supportedProtocols, description, onInput, onSelect. Option disabled when protocol unsupported, `!enabled`, or full (`maxResources>0 && used+reserved>=max`, except own proxy or allowFull). Client-side filter on "name protocol endpoint"; renders 50 at a time ("显示更多代理"); ArrowUp/Down/Enter/Esc. Hints: "使用时自动保存，重复代理会复用" when typed text contains ':'.
- Label maps: `x` (b) lane labels + RATE_LIMITED 限流冷却 (L211-214); `l` (x) delivery-state filter options ``/DRAFT/DELIVERY_FAILED/DELIVERED/SUBMITTING/SUBMIT_FAILED (L215-233); `y` (S) import states NOT_IMPORTED/PENDING/IMPORTED/FAILED/UNKNOWN (L234-240); `b` (C) creation states NOT_STARTED/QUEUED/RUNNING/SUCCEEDED/FAILED/UNKNOWN (L241-248); `v` (w) map import/creation state → badge (L250-252); `_` (W) credential-type options from index `D` (L405-408); internal E = lane-state {label, handling} PROVISIONING/PAUSED/READY/COOLING/DRAINING/DEAD/GONE (L266-295).
- `D` (T) debounced search hook `(onApply)` → `[raw, setRaw, applied]`, 300 ms; empty applies immediately (L254-265).
- `h` (D) dispatch in flight (`dispatchState` UNKNOWN|PENDING) (L297-299); `m` (O) credentialMode ∈ REFRESH_TOKEN/ACCESS_TOKEN/SESSION_KEY (L301-303); `S` (k) delivery label, `C` (A) delivery badge state, from `dispatchState/state/creationFinished/creationRetrying` (L305-311); `c` (j) const "交付失败"; `u` (M) const "交付结果尚未确认…勿重复提交。"; `E` (N) long hint `(state, progress)` incl. "已自动重试1次…" when `creationAttempts===2` (L315-321); `o` (P) creation failure text from creationFailureHint → creationFailureReason → `creationHttpStatus` 4xx/5xx (L323-328); `s` (F) pick progress fields creationAttempts/Retrying/Finished/HttpStatus/FailureReason/FailureHint (L330-333); `t` (I) `<DeliveryStateBadge state label progress>` (L335-353); `d` (H) dispatch-record label (L375-377); `w` (U) lane badge {state,label} (L379-404).
- **Permission/action predicates** (L355-373) — all take `(resource, supplierSide, has)`:
  - internal L *canDelete* = `deleteAvailable && (state==='DRAFT' || oauthRetryAvailable) && dispatchState==='FAILED' && !laneId && (has('resource.write') || (!supplierSide && has('resource.dispatch')))`.
  - `r` (R) *canEditDraft* = `supplierSide && has('resource.write') && state==='DRAFT' && !submittedAt && !oauthRetryAvailable && !inFlight && dispatchState!=='SUCCESS' && !laneId`.
  - `i` (z) *canManualRecover* = `manualRecoveryAvailable && recoveryDispatchId && has(supplierSide ? 'resource.write' : 'resource.dispatch')`.
  - `a` (B) *canOauthRetry* = `supplierSide && has('resource.write') && oauthRetryAvailable`.
  - `n` (V) *canRemove* = canDelete || (canEditDraft && !dispatchState).
- `p` (K) datetime in **Asia/Shanghai** `YYYY/MM/DD HH:mm` (L410-418); `f` (G) = encodeURIComponent; `g` (q) `resourceType==='NEWAPI_INTAKE'` (L420-422); `T` (J) page title (supplierSide, intakeMode) → 我的交付 / 资源管理 / NewAPI 待分配资源 (L424-426).

### QueryFilters-CwGBc_NH.js (~218 lines)
- **Purpose**: filter-bar shell + supplier pickers. Imports index `$, C, G, X, Y, Z, f, mt, r, s, u, vt, y`.
- `t` (h) `<QueryFilters primarySearch searches selectors children className appliedFilters[{label,value,clear}] onReset onFilterCleared actions mobileCompact>` (L20-108): wraps index FilterToolbar; on mobile with `mobileCompact` collapses `searches`+`selectors` into a "筛选 (n)" dialog with 重置筛选 / 查看结果; shows applied-filter chips ("已筛选 N 项", each with clear ×) and footer actions.
- `n` (g) `<FilterSelect value onChange options label allLabel searchPlaceholder onSearchChange loading error visual>` (L110-140): compact Select; first option label becomes "{label}加载中…" / "{label}加载失败" / allLabel; keeps an unknown current value as "已选{label}".
- `i` (_) `useSupplierDirectory(enabled, state='', search='')` (L142-196): fetches **all pages** of `GET /suppliers?page={n}&size=100&state=&search=` until collected ≥ total (dedup by id); error "供应商目录已变化，请刷新重试" if a page comes back empty early; keyed by user id + epoch; returns `{data:{items,total,page:1,size}, loading, error}`.
- `r` (v) `<SupplierFilter …>` (L198-216): FilterSelect with supplier defaults (供应商 / 全部供应商 / 搜索供应商名称或编码, visual `supplier`) or plain SearchInput when `fallbackToText` (no `supplier.read`).

### DateRangePicker-DtOG4QUZ.js (~292 lines)
- **Purpose**: two-month range calendar popover. Imports index `K, X, Z, j, mt, pt, vt`.
- `r` (l) → `{from: BeijingToday, to: BeijingToday}`; `n` (u)(base=BeijingToday) → presets **当日 / 近7天 / 近30天 / 本月** (index 0..3; month end via `Date.UTC(y,m,0)`) (L14-41).
- `t` (v) `<DateRangePicker from to label='适用期间' disabled minDate fromLocked onChange(from,to)>` (L119-290): Monday-first 6×7 grid, two months, ‹/› move by two months; first click = start, second = end (auto-ordered); `fromLocked` → only end selectable (used for quotes whose start is in the past); days `< minDate` disabled; presets disabled if before minDate; closes on outside pointerdown/focus or Esc; portal into the nearest open `<dialog>` or body; trigger shows "起 YYYY/MM/DD 止 YYYY/MM/DD". Footer: "区间包含开始和结束当天".
- Note: calendar cell dates are built with local `Date` while presets/defaults use Beijing date strings.
## Workbench

### Workbench-CVusO4pD.js (~976 lines)
- **Purpose**: home dashboard (`#/workbench`, nav perm `workbench.read`). Also exports `TurnoverRecords` (`B`, L72-202) which is rendered by **Reports** (Reports L3/L633), not by the workbench itself.
- **Imports**: index `A, C, H, I, L, P, R, S, T, X, Y, Z, b, d, g, h, j, mt, n, ot, p, pt, r, rt, s, u, ut, vt, x`; sibling systemLabels `i` (unit label, used in task-summary rewriting).
- **API calls**
  - `GET /workbench` (L534) → `{money:[{currency,total,paid,received}], announcement?{notificationId,title,body,publishedAt}, recent:[notification]}`.
  - `GET /exchange-rates/current` if `exchange_rate.read` (L535) → [{id, baseCurrency, quoteCurrency, rate, source, effectiveFrom}].
  - `POST /notifications/{notificationId}/read` `{}` — announcement "标记已读" (L594) then `refresh()`; recent-panel single read (L435, then navigate to `targetPath || 'notifications'`); bulk read via `Promise.allSettled` (L422) with partial-failure toast "已标记 {0} 条，{1} 条未成功，请重试。" and failed ids kept selected.
  - `GET /workbench/tasks` if `workbench.tasks.read` (L831) → `{items:[{id, kind, label, title, summary, detail, facts:[{label,value}], supplierName, amount, currency, createdAt, targetPath}], limited}`.
  - TurnoverRecords: `GET /turnover` if `turnover.read` (L77) → {items:[{businessDate, siteName, currency, amount, note}]}; `POST /turnover` `{businessDate, siteName, currency, amount, note}` (L192) if `turnover.write`.
- **UI sections** (J, L526-809):
  - Date header (locale long date with weekday).
  - Announcement panel (if `announcement`): title, publishedAt, body, 标记已读; 管理公告 link → `notice-admin` if `notification.publish`.
  - Todo panel `Z` (L828-971): category tabs 全部 / 报价 (QUOTE_NEW, QUOTE_CHANGE, QUOTE_REJECTED) / 资料 (SUPPLIER_REVIEW, SUPPLIER_REVISION, ACCOUNT_REVIEW) / 账务 (SETTLEMENT_CONFIRM, PAYMENT_CREATE, PAYMENT_REVIEW, PAYMENT_EXECUTE, PAYMENT_RECEIPT) / 其他, with counts, hidden when 0. Shows 5, "展开全部". `limited` → notice "当前只显示最近 200 条…". Row expands to facts `<dl>` (labels via `ot`, values rewritten by `P`) or detail; primary action button label by kind (`j`, L26-28: 审核 / 审核改价 / 去补充 / 核对 / 申请付款 / 去付款 / 查看) navigates to `targetPath`. Kind label map `A` (L13-24). Summary rewriting for quote kinds (`M`, L30-32): "N倍" → discount format, date ranges, unit labels.
  - Placement: on mobile tasks render before guide, else after (L681).
  - Operation guide `K` (L294-408): tabs quote/delivery/billing built from permissions and role (`SUPPLIER_AGENT`, `teamAdminGroup`, settlement tabs from index `n`). Hide/show persisted in **localStorage `hispread.workbench.guide-hidden:{userId}`** (L538-551).
  - Balance panel (if `settlement.read`): title 收款概览 (supplier) / 应付概览 (platform); currency select limited to `CURRENCIES`; big number = `max(0, total − (supplier? received : paid))` — **computed with `Number()` floats (L710)** then `formatMoney`; breakdown 已确认应收/应付 = total, 已确认收款/已登记付款 = received/paid; link to `settlements`.
  - Quick actions (L602-627): suppliers (`supplier.read`, label 维护资料/供应商管理), projects (platform, `project.write`), quotes (`quote.read`), settlements (`settlement.read`), deliveries (supplier && `resource.read`, requires `resource.write`).
  - Reference rates panel (`exchange_rate.read`): "1 BASE = rate QUOTE", source · effectiveFrom; link `settlements?tab=rates`.
  - Recent progress `q` (L410-524): unread items only, per-item checkbox, 全选本页, 标记已读（n）, 全部消息 → `notifications`; on read uses `f.mutate` to drop ids locally.
- **TurnoverRecords** (L72-202): hidden without `turnover.read`. Currency toggle among currencies present in data; chart mode bar/area (custom SVG `H`, nice-scale `U`); total via `sumDecimal` (index `H`) but chart points aggregated with `Number()` per businessDate (L204-212). FormModal "登记营业额" (subtitle 同一天、同一站点和币种只能记一次。) fields businessDate (date, max Beijing today, default today), siteName, currency (select CURRENCIES), amount (number min 0 step 0.01), note (optional). Success toast "已记下这笔营业额", `refresh()`.
## Quotes domain

### Quotes-BL6CyQ42.js (~1180 lines)
- **Purpose**: quote list (inline-editable spreadsheet) + ranking board + detail drawer + price-adjust dialog. Route `#/quotes` (nav perm `quote.read`). Title "我的报价" for suppliers (`user.supplierId` set → `v`), "报价管理" for platform (L650).
- **Imports**: index `$, A, B, C, E, F, G, I, O, P, S, X, Y, Z, _, _t, b, c, ct, d, ft, g, h, i, it, j, l, lt, m, mt, o, pt, rt, s, u, v, vt, x, y`; siblings QueryFilters `i` (useAllSuppliers), `r` (SupplierFilterSelect); DateRangePicker `t`; systemLabels `i` (unit), `t` (capacity caption); projectOptions `t`; quoteHelpers `a, i, m, n, o, p, r, s, u`; lazy: ApprovedQuoteRejection, QuotePeriodPanel, QuotePriceHistory, QuoteRankingResults (L114-125).
- **Exports**: default `O` (page), `n` = `Oe` `<QuoteUsdPreview value currency unit referenceRates loading error>` (used by QuotePeriodPanel/QuoteRankingResults), `outsideMultiplierRange` (= quoteHelpers `a`), `t` namespace.
- **API calls**
  - `GET /quotes?search&supplier&project&pricingType&currency&state&onDate&page&size` — only when supplier or tab=`list`; **polled every 15 s** (L133-143). `supplier` param blank for supplier users. Uses `items[]`, `total` (pagination). Item fields: id, code, supplierId, supplierName, projectId, projectName, unit, pricingType (DISCOUNT|FIXED), multiplier, ratePercent, unitPrice, currency, taxInclusive, effectiveFrom/To, state, submittedBy, createdBy, accountCount, accountQuota, capacityCurrency, rpm, tpm, serviceCapacityNote, pendingChange, upcomingPrice, settlementMethod, deliveryMethod.
  - Supplier directory via QueryFilters `i(has('supplier.read'))` → paged `GET /suppliers?page=N&size=100&state=&search=` until total (L143). Used for supplier select; editable rows only offer `state==='APPROVED' && enabled!==false`.
  - `GET /projects?size=100` (L143) → projects (filtered `settlementMethod!=='LEGACY'`; enabled ones for ranking sorted by category\0name). Fields: id, name, code, category, categoryName, enabled, settlementMethod (QUOTA|ACCOUNT_BUYOUT|LEGACY), deliveryMethod, capacityType, capacityPeriod, capacityScope, capacityCurrency, unit, suggestedMultiplier.
  - `GET /exchange-rates/current` if `exchange_rate.read`; **poll 30 s** (L143) → array of {baseCurrency, quoteCurrency, rate}.
  - `GET /quotes/multiplier-bounds` if `quote.read` (L143) → {min, max} (multiplier decimals).
  - `GET /quotes/{id}` on open detail (L177-187), on open adjust dialog (L192-203), and deep-link on mount (L147-173): hash `?id=X` → open detail; `?id=X&review=change` → open adjust dialog. Request sequencing via counter refs `I`/`V` (stale responses discarded).
  - `POST /quotes` (new) / `PUT /quotes/{id}` (edit pending) body (L283-300): `{supplierId, projectId, pricingType:'FIXED'|'DISCOUNT', unitPrice|null, multiplier|null (percent ÷100 via lt), currency, taxInclusive:boolean, serviceCapacityNote(trimmed), accountCount, accountQuota, rpm, tpm (only the field matching project.capacityType, others null; when editing a historical quote send existing values or null), effectiveFrom, effectiveTo}`. pricingType FIXED iff project.settlementMethod==='ACCOUNT_BUYOUT' (or source quote FIXED if historical). Success → remove draft row, `refresh()`, toast "该行报价已保存"/"该行报价已提交审核".
  - `POST /quotes/{id}/review` `{approved, note}` (L1122) via ReviewBox; toast "报价审核已处理".
  - `POST /quotes/{id}/withdraw` `{}` (L1157); toast "报价已撤回".
- **Filters** (L668-795): 关键词 `search` (placeholder 报价编号、供应商或项目), 供应商 `supplier` (platform only; falls back to free-text if no `supplier.read`), 报价项目 `project` (text), 报价方式 `pricingType` (``/DISCOUNT 折扣报价/FIXED 独立单价), 币种 `currency` (only `USD`, default USD), 报价状态 `state` (quoteHelpers `u`, default **`CURRENT`**), 适用日期 `onDate` (date). Every change resets page=1. Reset button restores defaults. Refresh icon calls `refresh()`. Page size default **10**.
- **Table** (custom `<table class="quote-sheet">`, L802-834): columns [供应商 (platform only: pending-change note, upcoming note, supplierName, code)], 报价项目 (projectName; unit · code), 折扣 / 独立价格 (DISCOUNT: percent + 折/%, plus USD preview; FIXED: "{currency} {unitPrice} / {unit}" + 固定单价), 申报能力 / 补充说明, 币种 / 税 (含税/未税), 适用期间, 状态 (badge + "调价待审" if pendingChange), 操作. Draft rows render first (new), then list rows (replaced by draft when editing), then orphan edit drafts. Row click opens detail.
- **Row actions** (L612-644):
  - 交付 → navigate `deliveries?quoteId=…` if supplier && own quote && APPROVED && `resource.read` && `resource.write`.
  - 编辑 if `quote.write` && state PENDING && `submittedBy===user.id` && effectiveTo ≥ Beijing today.
  - 调价 if APPROVED && `quote.write` && (platform || own) && effectiveTo ≥ today.
  - 审核调价 / 拒绝 (danger) if APPROVED && `quote.review` && platform.
  - 复制新行 if `quote.write`. 查看 always.
- **Inline edit row** (L311-511): supplier select (locked when supplier user or editing), project select (projectOptions with disabled marking), price input (`unitPrice` for ACCOUNT_BUYOUT else percent `multiplier`; hint "允许范围 {min%} 至 {max%}"; suggested discount; USD preview), capacity inputs by capacityType (accountCount int ≥1, accountQuota decimal, RPM+TPM ints), note textarea max 500, currency read-only, taxInclusive select (true 含税/false 未税), DateRangePicker (minDate Beijing today, `fromLocked` when source started before today), state badge (待审核 if id else 未提交), 保存/取消. Changing project resets price & capacity; default multiplier 80 for QUOTA projects (L212-215).
- **Validation (L231-264)** — preserve messages: 请选择供应商; 请填写完整的生效日期; 结束日期不能早于开始日期; 历史报价不能修改或提交，请选择今天或未来日期; 历史开始日期不可修改，只能调整今天或未来的结束日期; 生效日期不能早于北京时间今天; (historical-started quote skips the rest); 请选择报价项目; 项目已停用，不能提交报价; 该项目尚未配置能力口径; 能力补充说明最多500字; 请填写正整数账号数量; 请填写大于0的账号额度; 账号额度最多8位小数; 请同时填写正整数RPM和TPM; 整数能力超过BIGINT上限 (> 9223372036854775807n); ACCOUNT_BUYOUT: 请填写不小于 0 的单位价格; else 正在读取/读取失败 报价折扣范围, 请填写不小于 0 的折扣, 折扣整数部分最多 8 位, 折扣最多 6 位小数, bounds check (quoteHelpers `a`). Duplicate-submit guard `ct` Set of row keys (L266).
- **Ranking tab** (platform only, L852-998): search projects (name/category/method labels), category chips, per-project include checkboxes (state = excluded ids; 全选/清空), currency fixed USD, 排行日期 (default Beijing today, required). Renders one `<QuoteRankingResults>` per selected project.
- **Adjust dialog** (wide `G`, L999-1039): title 调价 (if `quote.write`) else 审核调价; shows QuotePeriodPanel when APPROVED (`canRequest = quote.write && (platform||own) && effectiveTo ≥ today`, `canReview = quote.review`, `defaultAdjustPrice: true`), then QuotePriceHistory. Notes: 历史报价不能申请修改。 / 报价状态已变化，请关闭并刷新列表。
- **Detail drawer** (L1040-1164): hero price (discount or `formatMoney(unitPrice)`), text "现行系统原始金额 × 折扣百分比" vs "本期结算数量 × 已确认单价"; DetailGrid (supplier, project, settlementMethod, deliveryMethod, currency, from/to, 含税/未税（不自动计税）, capacity, note); reviewNote; 有效期调整记录 table from `renewalHistory[]` {kind AUTO|manual, previousFrom/To, effectiveFrom/To, actorName, occurredAt}; price history (APPROVED); ReviewBox when `quote.review` && PENDING && submittedBy≠me && createdBy≠me (**four-eyes rule**). Footer: 拒绝 (platform, review, APPROVED) → ApprovedQuoteRejection; 编辑此行; 调整报价; 复制为新行; 撤回 (write && PENDING && submittedBy===me).
- **Business rules**: all "today" comparisons use Beijing date (`j`). Discount stored as multiplier decimal (0.8) but edited/displayed as percent (80) — conversions via `ct`(×100)/`lt`(÷100) string shifting, no floats. Footnote (L850): one active quote per supplier+project at a time, same currency across periods; same-day price change takes effect today; future changes on chosen date.
- **USD preview `Oe`** (L72-109): for DISCOUNT shows `convertCurrency(multiplier, currency→USD, rates)` "折扣后约 USD x / 1 CNY" + "按原金额的 {pct}% 计价"; for FIXED (with `unit`) "参考金额约 USD x / unit"; needs `exchange_rate.read` when currency≠USD.

### QuotePeriodPanel-D3BWLIuY.js (~254 lines)
- **Purpose**: request/review a period + price change for an APPROVED quote (inside Quotes adjust dialog).
- **Imports**: index `C, S, X, Z, ct, g, h, j, lt, mt, rt, s, ut, v, vt`; DateRangePicker `t`; systemLabels `i`; quoteHelpers `a, c, d, l, p, r`; Quotes `n` (USD preview).
- **Props**: quote, canRequest, canReview, defaultAdjustPrice, referenceRates(+Loading/Error), multiplierBounds(+Error), suggestedMultiplier, onChanged.
- **API**: `GET /quotes/{id}/period-change` (L52) → if `state==='PENDING'` show it: {oldFrom, oldTo, proposedFrom, proposedTo, priceEffectiveFrom, oldUnitPrice, proposedUnitPrice, oldMultiplier, proposedMultiplier, submittedBy, createdBy}. `POST /quotes/{id}/period-change` body `{effectiveFrom, effectiveTo, [unitPrice | multiplier], priceEffectiveFrom}` (price keys only if price changed) (L121-131). `POST /quotes/{id}/period-change/review` `{approved, note}` (L157) — ReviewBox only if `canReview` and pending change submittedBy/createdBy ≠ current user.
- **State**: from/to (init quote), price input (FIXED: unitPrice; DISCOUNT: percent), adjust-price checkbox (default `defaultAdjustPrice`), priceEffectiveFrom default = max(quote.effectiveFrom, Beijing today).
- **Validation (L72-118)**: 请选择有效的起止日期; 历史报价不能修改，结束日期不能早于北京时间今天; 历史开始日期不可修改 / 生效日期不能早于北京时间今天; price regex; 折扣整数部分最多 8 位，小数部分最多 6 位; bounds read failure/loading; bounds check; 改价生效日期须为北京时间今天或未来，且在调整后的报价期间内 (R ∈ [max(from,today), to]); 报价日期和价格没有变化. Price-changed detection compares against price-in-effect on the chosen effective date (`quoteHelpers l`) with decimal equality.
- Shows "所选生效日原价格", USD preview; toggling checkbox resets price to that original. Toast "报价调整已提交审核" / "报价调整已通过|已退回".

### ApprovedQuoteRejection-7MD8D-Rd.js (~103 lines)
- **Purpose**: dialog "拒绝已通过报价" (platform reviewers from Quotes).
- **Imports**: index `G, S, X, Z, g, h, l, mt, rt, s, vt`.
- **API**: `GET /quotes/{id}` (L23) to re-check state; `POST /quotes/{id}/reject-approved` `{note}` (L42); response must have `state==='REJECTED'` else error "报价状态未更新，请刷新后核对".
- UI: DetailGrid (code, supplierName, projectName, period), amber notice (rejection stops new deliveries/pricing, closes pending changes; frozen records kept), red notice if state no longer APPROVED, textarea 拒绝原因 required, maxLength 500 ("请填写拒绝原因"). Confirm (danger) disabled unless loaded+APPROVED+non-empty. In-flight ref guard; close blocked while submitting.

### QuoteRankingResults-cj8V1Hgu.js (~112 lines)
- **Purpose**: per-project ranking table in Quotes ranking tab.
- **Imports**: index `A, F, S, X, Z, c, ct, mt, pt, vt`; systemLabels `i, t`; Quotes `n`.
- **API**: `GET /quotes/ranking?projectId&currency&onDate&sortBy&sortDirection` (L143). sortBy ∈ PRICE|ACCOUNT_COUNT|ACCOUNT_QUOTA|RPM|TPM; default PRICE ASC; switching to a capacity column defaults DESC; re-click toggles. Response array rows: rank, supplierName, pricingType, unitPrice, currency, unit, multiplier, ratePercent, accountCount, accountQuota, capacityCurrency, rpm, tpm, serviceCapacityNote, effectiveFrom, effectiveTo, (id for onQuote).
- Columns: 名次 (#rank or —), 供应商, 报价 (sortable; FIXED "{cur} {formatMoney} / {unit}", DISCOUNT percent + USD preview), capacity columns per project.capacityType (sortable), 能力说明, 适用期间, 操作 查看 → `onQuote(row)` (opens Quotes detail).
## Settlement / accounting domain

### Settlements-CJxoFHir.js (~36 lines)
- **Purpose**: route shell for `#/settlements` (nav perm `settlement.read`; for suppliers the nav item shows only if index `n(user)` returns ≥1 tab — index 8441).
- Resolves tab with index `t(user, hashParam('tab'))` (alias `t` = dn; `?tab=resource-accounting` is an alias → `statements` for suppliers, `daily` for platform; index 7789-7793). No allowed tab → EmptyState "当前账号无权访问此页面".
- `tab==='departments'` → `<SupplierBills departmentView>`; supplier `SUPPLIER_AGENT` → `<SupplierBills>` (daily consumption only); otherwise `<SettlementManagement tab>` (L17-29).
- Tab permission rules (index `n`, 7758-7787) — preserve exactly: `daily` (agent || has(supplier? `settlement.read` : `usage.read`)), `departments` (supplier && (agent ? teamAdminGroup.id : `settlement.read`)), `statements` label 金额确认/结算单 (!agent && `settlement.read`), `inputs` 金额记录 (platform && `usage.read`), `payments` 收款记录/付款记录 (!agent && `payment.read`), `rates` 参考汇率/汇率版本 (!agent && `exchange_rate.read`).
- Imports: index `B, C, X, Z, d, i, mt, t, vt`. Lazy siblings: SettlementManagement, SupplierBills.

### SettlementManagement-DAgYDp-f.js (~796 lines)
- **Purpose**: settlement hub for one tab; owns the "statements" tab (settlement list) and mounts other tabs lazily: daily → `SupplierBills` (supplier with `settlement.read`) or `DailyAccounting` (platform with `usage.read`); inputs → `SettlementInputs`; payments → `PaymentsTab{settlementId: hash 'settlementId'}`; rates → `ExchangeRatesTab{supplierSide}`; detail drawer `SettlementDetail`; batch `SettlementBatch`; preview `SettlementPreview`; manual input modal `SettlementInputs.ReceiveAmountModal` (L129-135, 782-793).
- **Exports**: `SettlementManagement` (w), `t` = `ve` datetime formatter in **Asia/Shanghai** (L56-66).
- **Imports**: index `A, B, C, G, I, M, P, S, T, V, X, Y, Z, _, a, c, et, f, g, h, i, j, m, mt, n, o, p, pt, rt, s, tt, u, vt, y, z`; QueryFilters `i`; DateRangePicker `n` (presets), `t`; MoneyDisplay `t`; projectOptions `t`.
- **Header actions** (L267-281, platform only): 录入应付依据 (`usage.import`) → manual-input modal; 单张新建 (`settlement.create`) → new-settlement FormModal; 批量新建结算单 (`settlement.create`, primary) → SettlementBatch.
- **API (statements tab)**
  - `GET /settlements/summary?currency={statsCurrency}` (L222) → {unsettledPayable, total, paid, received}.
  - `GET /settlements/pending-summary?{filters}&currency={filterCurrency||statsCurrency}` (L223-227) → {pendingTotal, pendingCount}.
  - `GET /settlements?search&supplierId&currency&state&paymentProgress&periodStart&periodEnd&page&size` (L154-162, 228) → paged {items,total}. Item fields: id, code, supplierName, projectName, periodStart, periodEnd, createdAt, originalTotal, total, currency, state, confirmationMode, confirmationDeadline, receivedAmount, paidAmount.
  - Export: index `tt` → `POST /settlements/export?{filters}` body `{ids}` (ids `[]` = all filtered) → download `settlements.csv` (L182-193); per-row index `et` → `GET /settlements/{id}/export` → `settlement-{id}.csv` (L193-207). Both need `settlement.export`; per-row in-flight Set.
  - Supplier search for filter `Se` (L83-127): QueryFilters `i(true,'',debouncedSearch)` → paged `/suppliers` (300 ms debounce, caches selected).
  - Form options (only while a modal is open): suppliers (all + `state=APPROVED&search=`) via QueryFilters `i` when `supplier.read`; `GET /projects?size=100` when `project.read` (L229-252).
  - New settlement: `POST /settlements/preview` body `{supplierId, projectId, periodStart, periodEnd, currency, requestKey (crypto.randomUUID), inputIds: [], basisMode:'DAILY_SUMMARY', confirmationDeadline (local datetime + local offset, xe L78-81)}` (L734-746) → document with `snapshotHash`; paging `POST /settlements/preview?page&size` same body (L761); confirm `POST /settlements` body = request + `expectedSnapshotHash` (L767) → `{id}` → toast "已发起结算，等待供应商确认金额", opens detail. **Snapshot hash = optimistic concurrency for previews.**
- **Stat cards** (L297-379): currency select over `[USD,CNY,USDT,EUR,HKD,SGD,JPY,GBP]` (`Ce`, L128) default USD; cards 历史未结算金额 (unsettledPayable; foot "全部历史已入账、尚未生成结算单的金额"), 待确认金额/待供应商确认 (pendingTotal in filter currency; button "{n} 笔待确认 · 查看" sets currency filter + state=PENDING), 已确认应收/应付 (total), 已确认收款/已完成付款 (received|paid), 待确认收款/待付金额 = `subtractMoney(total, received|paid)` (decimal). All via MoneyDisplay.
- **Filters** (L382-509): search (debounced 300 ms; placeholder 搜索结算单号 / 搜索供应商或结算单号), supplier (platform + `supplier.read`), currency (`''` + Ce), state (``/PENDING/CONFIRMED/REJECTED 有金额异议/WITHDRAWN/VOID), paymentProgress (``/UNPAID/PARTIAL/PAID, supplier wording 收款), 结算周期 DateRangePicker default **近7天 preset** (`me()[1]`, L145-153), 清除筛选; caption "显示与所选周期有交集的结算单（含起止当天）。". Page size default 10; selection scoped to current filter string (resets when filters change, L162-181).
- **Table columns** (L515-633): [checkbox select (if `settlement.export`, page-level tri-state)], 结算单 / 供应商 / 结算单 (avatar), 项目 (platform; fallback 历史多项目结算), 结算期间, 创建时间 (Beijing), 原始金额 (`originalTotal`, null→历史未记录), 最终应收/应付 (`total`), 结算状态 (badge; `confirmationMode==='AUTO_DEADLINE'` → 逾期自动确认; PENDING → 待供应商确认 + 截止 deadline), 收款/付款进度 (supplier: CONFIRMED && received ≥ total → 全额已收款, received>0 → 部分已收款, else 待收款; platform: index `z` PAID/PARTIAL/UNPAID; PENDING → 待确认金额), 操作 (核对 if PENDING else 查看; 导出). Row click opens detail. Deep link `?id=` opens detail on mount unless tab=payments.
- **New settlement FormModal** (L680-756): supplier (APPROVED && enabled only, searchable), project, periodStart/periodEnd default **yesterday (Beijing)** (`ye`, L68-71), confirmationDeadline datetime-local default **now + 5 days rounded up to 15 min** (`be`, L73-76) hint "请核对后手动确认或提出异议；到期不会自动确认。", currency (USD/CNY/USDT). Note "按已生成的日账汇总金额结算，正式生成后冻结本单金额。" Preview → back returns to form with previous values.
- Missing permissions in modal: "当前账号缺少读取供应商或项目的权限，无法填写此表单。"; load error with "重新加载选项".
- On payment created from detail: navigate `settlements?tab=payments&id={paymentId}&settlementId={settlementId}` if `payment.read` (L259-261).

### PaymentForm-DYdHXH-C.js (~43 lines; **hand-written against `../runtime/vue-compat.js`, not compiled React**)
- **Purpose**: "申请线下付款" FormModal, lazy-loaded from SettlementDetail and PaymentsTab.
- **Imports**: index `A, C, G, N, P, S, T, V, g, p, rt`; usePaymentEvidence `n` (EvidenceEditor), `t` (useEvidence).
- **Permission**: requires `payment.create` && `file.write`, else dialog with red notice "缺少付款申请或附件上传权限，请联系管理员。" (L13-15).
- **API**: `GET /exchange-rates/current` (if `exchange_rate.read`) → [{id, version, baseCurrency, quoteCurrency, rate, effectiveFrom}]; `POST /payments/offline` body `{settlementId, obligationAmount, payoutCurrency, exchangeRateId (null when same currency), fee, requestKey (crypto.randomUUID at open), ...evidence.prepare(supplierId) → {evidenceId, evidenceIds, evidenceContent}, externalRef}` (L38).
- **Fields**: obligationAmount (本次抵扣应付, min 0.01, max & default = `subtractMoney(total, reservedAmount)`), payoutCurrency (CURRENCIES; clears exchangeRateId), exchangeRateId (visible when payoutCurrency ≠ settlement.currency; options rates base=settlement.currency & quote=payout, label "V{version} · {rate} {quote} · {date}", hint 采用当前已生效的版本，提交后冻结), fee (平台承担的手续费, min 0, default '0'), externalRef (≤160, optional), evidence editor.
- **Preview**: 预计向供应商支付 = obligationAmount (same currency) or `multiplyMoney(obligationAmount, rate)` rounded 2 dp.
- Notice: offline only; needs a different finance/admin to approve; applicant cannot review own request. Success: `refresh()`, toast "线下付款申请已提交，等待独立审核", `onPayment(result)`.

### usePaymentEvidence-DFI1SOk7.js (~286 lines)
- **Purpose**: payment evidence (rich-text note + attachments) hook and editor; used by PaymentForm and PaymentsTab.
- **Imports**: index `X, Z, at, g, mt, s, vt`.
- **Exports**: `t` = `useEvidence()` (L238-284); `n` = `<EvidenceEditor value disabled>` (L105-236); `r` = docToPlainText (L52-55).
- **Content model**: JSON doc tree `{type:'doc', children}` with node types paragraph/bold/italic/underline/bulletList/orderedList/listItem/text/br — converted from contentEditable DOM (`u`, L29-50; strips SCRIPT/STYLE/IFRAME/IMG) and back (`f`, L57-71). Toolbar uses `document.execCommand` (bold/italic/underline/lists). Paste/drop of files → attachments; text paste inserted as plain text.
- **Attachment rules** (L244-264): max **10** files ("最多添加10个付款凭证附件"); size 1 B–**10 MB** (10485760) ("付款凭证大小须在1 B至10 MB之间"); types PDF/PNG/JPEG by MIME or extension ("仅支持PDF、PNG、JPG付款凭证"); dedupe by name+size+lastModified. Image previews via object URLs.
- **prepare(supplierId)** (L269-282): requires ≥1 file ("请上传付款凭证"); plain text ≤ **10000** chars ("付款说明过长，最多10000字"); uploads each file once via index `at` → `POST /documents` multipart `{supplierId, category:'PAYMENT_PROOF', file}` → `id` (cached per draft key so retries don't re-upload); returns `{evidenceId: ids[0], evidenceIds, evidenceContent: JSON.stringify(doc)}`.

### PaymentsTab-c0WtyzS3.js (~523 lines)
- **Purpose**: `settlements?tab=payments` — payment (platform) / receipt (supplier) records list + detail drawer with review, receipt confirmation, cancel/close, offline recording, re-apply.
- **Imports**: index `$, A, B, C, G, M, P, S, V, X, Z, _, c, f, g, h, i, l, mt, o, ot, p, rt, s, v, vt`; usePaymentEvidence `n, r, t`; lazy PaymentForm.
- **Export**: `PaymentsTab({initialPayment?, settlementId=''})`.
- **API**
  - `GET /payments?page&size&settlementId={settlementId or ''}` (L160) → {items,total}. Fields: id, code, settlementId, settlementCode, supplierId, supplierName, obligationAmount, obligationCurrency, payoutAmount, payoutCurrency, fxRate, fxSource, state, paymentMethod (OFFLINE|CHANNEL|other=历史付款), verificationMode (SIMULATED|MANUAL), statusUpdatedAt, receiptState (CONFIRMED|DISPUTED|null), receiptNote, receivedAt, externalRef, evidence{content, attachments[{id,name,contentType,bytes}]}, evidenceId, createdBy, reviewedBy, version, lateReturn, lateReturnMonitoringRequired.
  - `GET /payments/{id}` on row open and deep link (`?tab=payments&id=` when no settlementId filter) (L161-173).
  - `POST /payments/{id}/review` `{approved, version, note}` (L321) — ReviewBox title 付款申请审核 when platform && PENDING && `payment.review` && `createdBy !== me` (**four-eyes**).
  - `POST /payments/{id}/receipt` `{confirmed:boolean, note}` (L385) — supplier, SUCCEEDED, receiptState≠CONFIRMED, `payment.receipt`; form options 已核实到账 / 未到账或金额有异议.
  - `POST /payments/{id}/close` `{state:'CANCELLED'|'FAILED', note, version}` (L416) — platform `payment.record`, state PENDING|APPROVED; FAILED option hidden for CHANNEL payments; toast "申请已作废，金额占用已释放"/"申请已关闭…".
  - `POST /payments/{id}/offline-record` `{externalRef, version, evidenceId, evidenceIds, evidenceContent}` (L477) — dialog 线下付款 / 上传凭证 shown when APPROVED && `reviewedBy && reviewedBy !== createdBy` && `payment.record`.
  - `POST /payments/{id}/reconcile` `{version}` (L137) — legacy channel panel `N` (hand-patched, untranslated strings) for ADMIN platform users with `payment.execute`||`payout.reconcile`, non-OFFLINE payments; button only with `payout.reconcile` and state PROCESSING/UNKNOWN (or SUCCEEDED with `lateReturnMonitoringRequired`); `lateReturn` red notice.
  - Re-apply `I` (L429-456): `GET /settlements/{settlementId}` → opens PaymentForm only if `state==='CONFIRMED' && supplierConfirmed && workflowVersion===2 && (total − reservedAmount) > 0` (decimal compare), else notice "该结算单尚未确认或已无可申请付款金额，请刷新后核对。".
  - Evidence download links `/api/documents/{id}/download` (direct `<a>`/`<img>`; only if `supplier.read`).
- **Optimistic concurrency**: `version` sent on review/close/offline-record/reconcile.
- **Table columns** (L191-259): 对应账单/记录 | 供应商/付款单, 本次应收/应付抵扣 (obligation), 预计收款/付款金额 (payout + "同币种" or "1 X = fxRate Y"), 付款时间 (only SUCCEEDED && not SIMULATED), 平台付款状态 (+线下付款·凭证登记 / 模拟·未真实出款), 供应商收款状态 (已确认到账/有异议/待确认到账), 操作 (查看 | 核对收款; 重新申请付款 when `G`).
- **Re-apply rule `G`** (L160): platform && `settlement.read` && ((`payment.create` && `account.read`) || (`payment.record` && `file.write`)) && state ∈ FAILED/CANCELLED/REJECTED.
- **Drawer DetailGrid**: 对应结算单, 抵扣原币, 汇率方向, 汇率依据 (fxSource), 付款方式, 转账流水号, 供应商到账确认, 收款备注, 确认时间; evidence viewer `M` renders doc tree safely (no HTML injection).

### SettlementDetail-B_4PzTZg.js (~430 lines)
- **Purpose**: settlement drawer (opened from SettlementManagement list, after creation, SettlementBatch). Confirm/dispute (supplier), void/withdraw/adjust/apply-payment (platform).
- **Imports**: index `A, C, F, G, H, M, P, S, T, V, X, Y, Z, _, c, d, et, g, h, i, l, mt, o, p, rt, s, ut, v, vt`; systemLabels `i`; SettlementResourceTable `n` (daily lines), `t` (resource groups); SettlementManagement `t` (Beijing datetime); lazy PaymentForm.
- **Props**: `{id, onClose, onPayment}`.
- **API**
  - `GET /settlements/{id}?page&size` (line paging, default size **50**) (L58). Fields: code, supplierId, supplierName, projectName, periodStart/End, createdAt, confirmationDeadline, confirmationMode, state, workflowVersion, version, supplierConfirmed, sourceChanged, canVoid, voidNote, voidedAt, currency, total, originalTotal, calculatedTotal, adjustmentTotal, paidAmount, receivedAmount, reservedAmount, basisMode (DAILY_SUMMARY|other), dailyLines[], resourceGroups[], lines[] (legacy: quoteSnapshot{title,projectName,pricingType DIRECT|FIXED|DISCOUNT,unit,unitPrice,multiplier,ratePercent,code}, externalId, quantity, baseAmount, amount), linePage{total,page,size}, adjustments[{businessDate, amount, note, supplierVisible, createdByName, createdAt}], note.
  - `POST /settlements/{id}/confirm` `{approved, note, version}` (L282) — supplier ReviewBox "核对本期应收金额" when PENDING && supplier && `workflowVersion===2` && `settlement.confirm`; approve disabled if `sourceChanged`; reject label 提出金额异议. Toast 本期金额已确认 / 已退回核对.
  - `POST /settlements/{id}/void` `{note, version}` (L300) — platform, `canVoid` && `settlement.create`; subtitle "作废后原始金额重新可选，原结算及确认记录保留。".
  - `POST /settlements/{id}/withdraw` `{approved:false, note, version}` (L321) — platform, PENDING, `settlement.create`, workflowVersion 2.
  - `POST /settlements/{id}/adjustments` `{businessDate, amount, note, supplierVisible:boolean, version, requestKey}` (L418) — "加减金额" only when platform && `settlement.create` && PENDING && wf 2 && deadline not passed.
  - Export via index `et` → `GET /settlements/{id}/export` (label 导出结算单 / 导出明细) if `settlement.export`.
- **Deadline timer** (L59-66): setTimeout to re-render exactly when `confirmationDeadline` passes (capped 2^31−1 ms); after deadline amber notice "已超过建议核对时间，仍需供应商手动确认或提出异议。" + refresh button; adjustments disabled.
- **Hero / balances**: 本期应收/应付 total; 平台已完成付款 paidAmount; 供应商已确认收款 receivedAmount; 申请中占用 = `subtractMoney(reservedAmount, paidAmount)` (platform only).
- **DetailGrid**: 项目, 结算期间, 创建时间 (Beijing), 确认截止时间, 原始金额, platform-only 调整前应付 (`calculatedTotal ?? total − adjustmentTotal`), 人工调整合计, 最终应付; 金额确认 (AUTO_DEADLINE / 手动确认 / 尚未确认); 计价口径 text by basisMode.
- **Apply payment** `Q` (L70): CONFIRMED && supplierConfirmed && platform && (`payment.create`||`payment.record`) && currency ∈ CURRENCIES && total > reservedAmount (decimal compare). Non-USD/CNY/USDT historical currency → amber "该历史币种仅供查看；新付款申请只支持 USD、CNY 和 USDT。".
- **Lines**: dailyLines → SettlementResourceTable `n`; resourceGroups → `t`; else legacy lines table (项目/记录, 计算依据 "qty unit × unitPrice" or "baseAmount × discount" or 直接录入真实结算金额, 金额). Pagination from `linePage`.
- **Adjustments table**: supplier sees only `supplierVisible` rows; columns 结算日期, 加减金额 (+ sign), 调整说明, [供应商可见, 操作人 — platform], 记录时间.
- **Adjustment form `ie`** (L348-428) validation: deadline passed → error; businessDate within [periodStart, periodEnd] ("结算日期必须在本单结算期间内"); amount regex JPY `^-?\d+$` ("请输入整数加减金额") else ≤2 dp ("加减金额最多保留两位小数"); non-zero ("加减金额不能为零"); `total + amount ≥ 0` via `sumDecimal` ("调整后的最终应付不能小于零"); note required ("请填写调整说明"). Live preview "当前最终应付 → 调整后预览". supplierVisible default `false`.

### SettlementResourceTable-DOsIIJjV.js (~81 lines)
- **Purpose**: two presentational tables shared by SettlementDetail and SettlementPreview. No API. Imports index `A, F, X, Z, c, mt, ut`.
- `n` (c) `<DailyLinesTable lines currency>`: 账务日期 businessDate, 来源笔数 sourceCount, 原始金额 originalAmount (raw string), 应付金额 finalAmount (formatMoney).
- `t` (l) `<ResourceGroupsTable groups currency>`: 资源编号/款项 (resourceName; literal "资源编号缺失" translated; fallback 历史记录; period + "{n} 笔来源"), 计价依据 per `prices[]` (DIRECT 直接录入真实结算金额; FIXED "{qty} 个 · 单价 {cur} {unitPrice}"; DISCOUNT "原额 {formatMoney(originalAmount)} · {discount}"; else 历史报价依据缺失; shows quote period when >1 price), 应付金额 finalAmount.

### SettlementPreview-CEv04HyA.js (~233 lines)
- **Purpose**: wide modal "结算单预览" for a not-yet-generated settlement; used by SettlementManagement (single) and SettlementBatch (per item, with prev/next navigation).
- **Imports**: index `A, F, G, P, X, Z, _, c, g, h, l, mt, s, ut, vt`; SettlementResourceTable `n, t`.
- **Props**: `initialDocument?`, `loadPage(page,size) → Promise<doc>`, `onClose`, `onBack?`, `onConfirm?`, `navigation?{index,count,onPrevious,onNext}`. Skips first load if `initialDocument` given; reload on page/size change or "重新核对". Page size default `initialDocument.size || 50`.
- **No direct endpoints** (caller supplies `loadPage`/`onConfirm`).
- **Document fields**: supplierName, projectName, periodStart/End, currency, confirmationDeadline, basisMode, lineCount, dailyLines/dailyLineCount, resourceGroups/resourceGroupCount, lines[{businessDate, sourceKind MANUAL|EXTERNAL|CCMAX|RESOURCE, modelKey, sourceRef, originalAmount, quote{pricingType, code, effectiveFrom, effectiveTo, multiplier, ratePercent, unitPrice}, quantity, finalAmount}], originalTotal, total, page, size.
- UI: DetailGrid (供应商, 项目, 结算期间, 应付币种, 确认截止时间, 金额来源), lines table (daily/resource/legacy with 个数 column only if any FIXED), pagination only when count > page size, footer 原始金额合计 (trailing zeros trimmed, raw) and 本次应付合计 (formatMoney). Buttons: 返回修改 (onBack), 取消/返回批量预览, 确认生成 (onConfirm; in-flight guard; error shown inline).

### SettlementBatch-C6NFYAZd.js (~612 lines)
- **Purpose**: "批量新建结算单" wizard (platform `settlement.create`) from SettlementManagement: choose period/suppliers → server preview batch → start generation → poll → results; printable PDF summaries.
- **Imports**: index `$, A, C, G, H, P, S, T, X, Z, c, g, h, i, j, mt, ot, pt, rt, s, u, vt, y`; lazy SettlementPreview.
- **Props**: `{open, onClose, onSettlement(id)}` (opens SettlementDetail).
- **API**
  - `GET /settlement-batches/candidates?periodStart&periodEnd` (L180) — only when valid period (start ≤ end < Beijing today) and no batch loaded → `{items:[{supplierId, supplierName, projectId, projectName, currency, sourceCount, blockedCount, total}], summaryUpdating, incompleteDays}`.
  - `GET /settlement-batches?view={counter}` **polled every 5 s** (L180) → recent batches [{id, periodStart, periodEnd, supplierCount, state, successCount, failedCount}]; `view` is a cache-busting counter bumped after start/complete.
  - `GET /settlement-batches/{id}` (L186, 247) — open history item; **poll while `state==='QUEUED'`**: first after 1 s, then every 2 s, on error every 5 s, with `X-Hub-Background: 1`; on COMPLETED → `refresh()`.
  - `POST /settlement-batches/preview` `{periodStart, periodEnd, supplierIds[], projectId ('' = all), currency ('' = all), confirmationDeadline (ISO from datetime-local), requestKey}` (L576-584) → batch {id, state:'PREVIEW', supplierCount, readyCount, successCount, failedCount, totals{cur:amount}, incompleteDays, confirmationDeadline, items[{id, supplierName, projectName, currency, sourceCount, total, state READY|SUCCEEDED|FAILED, error, settlementId}]}. `requestKey` regenerated whenever selection/filters change (idempotency).
  - `POST /settlement-batches/{id}/start` `{}` (L383) → batch (QUEUED).
  - `POST /settlement-batches/{id}/retry-preview` `{requestKey}` (L390) — when COMPLETED with failures ("重新生成未完成项").
  - `GET /settlement-batches/{id}/items/{itemId}/preview?page&size` (L597) — per-item SettlementPreview (READY items, prev/next).
- **Defaults**: periodEnd = **yesterday (Beijing)**, periodStart = first of that month (L151-153, 180); confirmation deadline = now + 5 days at the top of the hour (L155-158; note SettlementManagement rounds to 15 min instead). End date max = yesterday; message "请选择有效的结算期间，结束日期最晚为昨天。".
- **Selection screen**: date inputs; "更多设置" (project select built from candidates, currency select CURRENCIES, deadline); notices for `summaryUpdating` (amber) and `incompleteDays` (red); supplier search, 选择全部(搜索结果), 清空, 已选 N 家; per-supplier aggregation (count excludes blocked rows; totals per currency via `sumDecimal`); 可结算总金额; table 选择/供应商/可结算笔数/可生成金额/状态 ("{n} 笔需处理" or 可生成); 已选金额汇总; 预览结算单.
- **Batch screen**: summary line by state; incompleteDays warning; deadline; QUEUED notice "后台正在处理，关闭页面后仍会继续"; polling error notice; failed items table (供应商/项目/币种/原因 via `ot`); items table (预览结算单 in PREVIEW; 查看结算单 when `settlementId` && `settlement.read`); actions 返回选择, 导出汇总 PDF (not while QUEUED), 关闭, 确认生成 (needs readyCount), 重新生成未完成项.
- **PDF export** (`ie`/`re`, L29-146): opens `window.open('')` and builds an A4 print document via DOM (no HTML strings): title 供应商结算汇总 / 结算单汇总, period, deadline formatted in **Asia/Shanghai**, batch id, per-currency totals (formatMoney), supplier table with tfoot totals, settlement table, "需处理项" table; auto `print()` after fonts load. Errors: "请等待结算单核算完成后导出", "请允许弹出窗口后重试导出 PDF".

### SettlementInputs-CZ-QKlwM.js (~346 lines)
- **Purpose**: `settlements?tab=inputs` (platform, `usage.read`) — list of payable source amounts ("金额记录"); also exports `ReceiveAmountModal` used by SettlementManagement "录入应付依据".
- **Imports**: index `A, C, F, G, S, T, U, X, Z, _, c, g, l, mt, o, p, rt, s, u, ut, vt, y`; systemLabels `i`; projectOptions `t`.
- **Exports**: `SettlementInputs` (E), `ReceiveAmountModal` (D).
- **API**
  - `GET /settlement-inputs?search&state&page&size` (L48); search debounced 300 ms; state ``/AVAILABLE 待结算/ALLOCATED 已纳入结算/VOID 已作废. Item fields: id, supplierName, projectName, sourceRef, sourceKind (EXTERNAL 外部接收 | MANUAL 手工录入 | RESOURCE CC lane 资源; default EXTERNAL), periodStart/End, currency, originalAmount, finalAmount, state, sourceSnapshot{exactConsumption, queriedAt}, baseReference, quoteSnapshot{pricingType DIRECT|DISCOUNT|FIXED, code, multiplier, ratePercent, unit, unitPrice, effectiveFrom, effectiveTo}, quantity, voidNote.
  - `POST /settlement-inputs/{id}/void` `{note}` (L215) — only when state AVAILABLE and `usage.import`; toast "已作废，来源单号仍保留用于防重".
  - ReceiveAmountModal: `POST /settlement-inputs/manual` (QUOTE mode) or `POST /settlement-inputs/manual-direct` (DIRECT) body `{supplierId, projectId, pricingMode, rows:[{sourceRef, periodStart, periodEnd, currency, originalAmount, quantity (only ACCOUNT_BUYOUT projects in QUOTE mode, else null), baseReference}]}` (L326-339) → `{inserted, skipped}` toast "已录入 {inserted} 条，重复 {skipped} 条…".
- **Table**: 供应商/项目, 来源单号 (mono), 来源, 所属期间, 消耗/原始金额, 应付金额, 状态, 操作 查看依据 → drawer "账务金额与计算依据" (DetailGrid incl. 原始金额（完整精度） raw string, CC lane 查询消耗 "USD {exactConsumption}", 计算方式 "originalAmount × discount" or "qty unit × unitPrice" or 直接录入真实结算金额, 报价有效期, 作废原因).
- **ReceiveAmountModal fields** (L230-310), sections 关联对象与录入方式 / 款项信息 / 所属期间与金额: pricingMode (QUOTE 按报价计算 default | DIRECT 直接金额), supplierId (field passed in by parent), projectId (enabled && non-LEGACY), sourceRef (hint 同一供应商和项目下保持唯一，用于防止重复结算), baseReference, periodStart/periodEnd (default **browser-local today** via index `U`), QUOTE: currency + originalAmount (step 0.00000001, i.e. 8 dp); DIRECT: currency 结算币种 + originalAmount 真实结算金额 (step 0.01); quantity 买断账号数量 (int ≥1, ACCOUNT_BUYOUT only). Submit label depends on mode.

### ExchangeRatesTab-FzGMcdR6.js (~177 lines)
- **Purpose**: `settlements?tab=rates` — platform: versioned FX rate management; supplier: read-only current rates.
- **Imports**: index `C, P, S, T, X, Z, _, c, f, g, mt, o, p, rt, s, vt, y`.
- **API**
  - Platform: `GET /exchange-rates?search&page&size` (L31) → {items[{id, baseCurrency, quoteCurrency, rate, version, effectiveFrom, source, enabled}], total}.
  - Supplier: `GET /exchange-rates/current` (L31).
  - `POST /exchange-rates` `{baseCurrency, quoteCurrency, rate, effectiveFrom (ISO)}` (L151) — `exchange_rate.write`; validation "基准币种与报价币种不能相同"; defaults USD→CNY, effectiveFrom = now (local datetime-local); rate min 1e-12. Subtitle: 同一币种对自动递增版本号，历史版本不可修改。
  - `POST /exchange-rates/{id}/enabled` `{enabled: !current, version, note}` (L167) — 停用 / 重新发布 with 变更原因.
- **Columns**: 币种对, 汇率 ("1 BASE = rate QUOTE", 版本 V#), 生效时间, 汇率来源, [platform: 状态 (enabled && effectiveFrom ≤ now → 已发布, enabled future → 待生效, else 已停用), 操作]. Supplier note: actual payment uses the rate snapshot on the payment record.

### DailyAccounting-z_8v-GqX.js (~727 lines)
- **Purpose**: platform daily ledger ("日账") for `settlements?tab=daily` when `usage.read` (non-supplier). Three views: 按日汇总 (`summary`), 按供应商汇总 (`supplier`, **default**), 明细 (`detail`).
- **Imports**: index `$` (twice, as `e` and `confirmRequest`), `A, C, S, X, Z, _, b, c, g, h, i, mt, ot, pt, s, u, ut, vt, y`; QueryFilters `i` (supplier directory), `r` (SupplierFilterSelect); DateRangePicker `r` (today range), `t`; useSummaryRefresh `t`; MoneyDisplay `t`; lazy DailyExports.
- **Props**: `onOpenPeriods` (→ navigate `settlements?tab=inputs`).
- **Filter form** (draft vs applied state; L106-130, 188-325): 关键词 `search` (来源编号或关键词), 供应商 `supplier`, 项目 `project` (from `GET /projects?page=1&size=100` if `project.read`), 模型 `model` (text), 来源 `sourceKind` (RESOURCE 资源金额 / MANUAL 手工款 / EXTERNAL 外部金额 / CCMAX_OBSERVATION CCMAX 待核对采集 / CCMAX CCMAX 模型消耗), 账务日期 `from`/`to` (DateRangePicker, default **Beijing today..today**), `reviewStatus` (state exists, no UI; always ''). 查询 applies (trims search/model; re-applying identical filter triggers refresh); 重置; refresh. Status line "筛选条件已修改，点击查询后更新结果。".
- **API**
  - `GET /accounting/daily/summary?from&to&search&supplier&project&model&sourceKind&reviewStatus` (L151) → {totals[{currency, consumptionTotal, confirmedOriginal, pendingConsumption, unsettledPayable, pendingCount, confirmedCount, groupCount}], projects[{projectId, projectName, currency, count, amount}], total, groupCount, crossPeriodCount, summaryUpdating}.
  - `GET /accounting/daily/groups?{filters}&page&size&groupBy=SUPPLIER|DAY[&sortBy&sortDirection]` (L151) — sort only in supplier view; sortable keys consumptionTotal/pendingConsumption/confirmedOriginal/payableTotal; cycle DESC → ASC → none (L161-184). Items: businessDate, supplierId, supplierName, projectId, projectName, currency, pricingType (DISCOUNT|FIXED|DIRECT|UNAVAILABLE), settlementMultiplier, settlementUnitPrice, consumptionTotal, pendingConsumption, pendingCount, confirmedOriginal, confirmedCount, payableTotal; `summaryUpdating`, `total`.
  - `GET /accounting/daily?{filters}&page&size&includeSummary=false` (detail view) (L139-151). Items: businessDate, supplierName, projectName, projectCategory, sourceKind, modelKey, resourceUsageId, sourceRef, sourceId, id, version, exactConsumption, originalAmount, quantity, pricingType, settlementMultiplier, settlementUnitPrice, pricingProvisional, pricingIssue, finalAmount, displayState, currentDayProvisional, observationQueriedAt, sourceChanged, state, settlementCode, settlementPaidAmount, settlementTotal.
  - `POST /settlement-inputs/{sourceId||id}/confirm` body `{version}` (L549-560; **hand-patched** raw `$` call, errors via `window.alert`) — "确认采集金额" for rows `sourceKind==='CCMAX_OBSERVATION' && state==='PENDING'`, column only with `usage.import`.
- **Auto refresh**: useSummaryRefresh on summary and groups → reload every 2.5 s while `summaryUpdating` (notice "汇总更新中，将自动刷新").
- **UI**: cross-period orange notice with link 查看金额记录 when `crossPeriodCount>0`; 4 stat cards per currency (消耗合计, 已入账金额, 待计价消耗, 未结算金额) via MoneyDisplay; 项目统计 chips; view switch + counts; export buttons (requires `settlement.export` && `usage.read`) open DailyExports with `actionRequest {type:'SUMMARY'|'TASKS', sequence, scope}`; hint "…当天日账次日可结算（北京时间）。".
- **Detail columns**: 账务日期, 供应商, 服务/项目, 来源 (+模型, 历史期间总费用来源 if resourceUsageId, sourceRef), 消耗/原始金额 (`exactConsumption ?? originalAmount`, 计价数量), 结算折扣/单价 (DIRECT / DISCOUNT multiplier with 当前有效报价 vs 入账时报价 / FIXED unitPrice / provisional issue text), 应付 (null → 待计价), 状态 (displayState map UNSETTLED/SETTLING/AWAITING_PAYMENT/PARTIALLY_PAID/PAID/NO_PAYMENT_DUE/NEEDS_REVIEW/PENDING_REVIEW/CURRENT_DAY_PROVISIONAL; 最近查询 time in **Beijing** `se` L89-98; sourceChanged hints; settlementCode; "整单已付 x / y"), [操作].
- **Group table**: columns depend on view and on whether any row has pending/confirmed counts (`Z`/`Q`, L158-159); tfoot rows per currency from summary totals. Row key includes pricing tuple.

### DailyExports-q6_gv_XE.js (~90 lines; **hand-written against vue-compat**)
- **Purpose**: async export jobs for the daily ledger (dialog + history drawer). Mounted by DailyAccounting with `hideActions` and an `actionRequest`.
- **Imports**: index `$, C, G, P, S, c, g, l, rt, s`.
- **Props**: filter, count, disabled, supplierName, projectName, actionRequest{type, sequence, scope}, hideActions.
- **API** (base `/accounting/daily/exports`):
  - `GET /accounting/daily/exports?page&size=10` (history, when drawer open) → {items[{id, type, format, state, createdAt, completedAt, filter{from,to}, snapshotAt, resultCount, expiresAt, files[{name}]}], total}.
  - `POST /accounting/daily/exports` `{type: DETAIL|SUMMARY|SUPPLIER, format: XLSX|CSV, filter, requestKey}` (L53) — must return `state==='COMPLETED'` else "文件生成结果尚未确认，请查看导出记录。" (synchronous generation).
  - `GET /accounting/daily/exports/{id}` (re-check COMPLETED & files) then raw `fetch('/api/accounting/daily/exports/{id}/download')` → blob → download as `files[0].name` (L33-47).
- **Rules**: requestKey regenerated when type/format changes or dialog opens (idempotent generation); files retained **7 days**; history shows only current account's files. State labels COMPLETED 已生成 / EXPIRED 已过期 / FAILED 生成失败 / CANCELLED 已取消 / else 历史记录. Default type SUMMARY, format XLSX. Strings are not passed through i18n here.

### SupplierBills-BVKniq6z.js (~690 lines)
- **Purpose**: supplier-side consumption bills. Rendered as: `settlements?tab=daily` for suppliers (via SettlementManagement when `settlement.read`, or directly by Settlements for `SUPPLIER_AGENT`), and `settlements?tab=departments` with `departmentView` (Settlements L21).
- **Imports**: index `A, C, G, S, X, Z, _, c, g, ht, j, mt, ot, s, u, vt, y`; DateRangePicker `t`; useSummaryRefresh `t`; MoneyDisplay `t`.
- **Note**: all GETs here hit `/supplier-bills/*`, so the shared client appends `billView=consumption-v2` and uses `cache:'no-store'` (index 5860-5865). Must replicate.
- **State/derived (L39-75)**: `isAgent = role==='SUPPLIER_AGENT'`; from/to default **Beijing today**; `dateOverride` (from department drill-down); `todayOnly` = range is today; **poll 60 s** when `to` is today and no filters (L50); `memberOnly = isAgent && !filters.groupAdmin` (only own daily consumption); `showMemberViews = !departmentView || department || groupAdmin`; `groupByDateCreators = isAgent && groupAdmin`; view `days` (default) | `creators`; department view `groupByDate` default true (按日显示 / 期间汇总).
- **API**
  - `GET /supplier-bills/filters?from&to&department` (L60) → {groupAdmin, groupName, departments[{value,label}], resourceTypes[{value,label}], projects[{value,label}], creators[{value,label}], summaryUpdating}.
  - `GET /supplier-bills/days?{q}&page&size` (L67) — q = from,to,search,resourceType,project,creator,department → {items[{businessDate, resourceTypeName, resourceCount, entryCount, currency, consumptionTotal, payableTotal, pendingConsumption}], totals[{currency, consumptionTotal, payableTotal, pendingConsumption}], total, summaryUpdating}.
  - `GET /supplier-bills/creators?{q}&groupByDate&page&size` (L68) → items {id, businessDate?, creatorId, creatorName, creatorUsername, resourceType, resourceTypeName, resourceCount, entryCount, currency, consumptionTotal, payableTotal, pendingConsumption}.
  - `GET /supplier-bills/departments?{q}&groupByDate&page&size` (L69) → items {businessDate, departmentId, departmentName, memberCount, resourceTypeName, resourceCount, entryCount, currency, consumptionTotal, payableTotal, pendingConsumption}.
  - `GET /supplier-bills/entries?{q overridden with from,to,project,search,model,reviewStatus,resourceType,creatorId,currency,page,size}` (L537-551) — creator detail dialog → items {businessDate, resourceTypeName, resourceName, sourceKind, projectName, modelKey, consumption, payable, pending, currency}.
  - All four list hooks use useSummaryRefresh (2.5 s while `summaryUpdating`).
- **Filters** (hidden for memberOnly except date): 账务日期 (DateRangePicker), 部门 (department view, non-agent; options + `__UNASSIGNED__` 主账号／历史未归属), 资源类型, 项目, 创建账号 (`ht('label','创建账号')`), 关键词 (300 ms debounce). Changing any resets all three pagers. 重置 resets to Beijing today.
- **Stats** per currency: agent → 消耗合计 only; else 消耗合计 / 已入账应收 (shows "次日入账" when range is today) / 待计价消耗 (tooltip 当日消耗，次日入账。).
- **Department summary table** (departmentView && !showMemberViews): 日期|账务期间, 部门 (+成员数), 资源/账单, 消耗合计, [已入账应收, 待计价消耗 — non-agent], 操作 查看成员 → sets department (+ date override when by-day) and switches to creators view.
- **Member views**: header (返回部门汇总 button; title groupName/department label/日账明细); switch 成员账单 (creators) / 每日汇总 (days) (hidden for memberOnly). Days table: 日期, [资源类型, 资源/账单], 消耗, [已入账应收 ("次日入账" for today rows), 待计价消耗]. Creators table: [日期 if groupByDate], 创建账号, 资源类型, 资源/账单, 消耗合计, [已入账应收, 待计价消耗], 操作 查看明细.
- **Entries dialog `re`** (L518-687): wide, title "{creatorName} · 账单明细 · {currency}"; own filters date/project/资源关键词/模型 (300 ms debounce)/入账状态 (PENDING 待计价 | CONFIRMED 已入账; non-agent only); columns 日期, 资源类型, 资源/项目 (resourceName or sourceKind fallback), 模型, 消耗, [应收 (今日 pending → 次日入账; null → 待计价), 入账状态]. Agents never see receivable amounts.
- Notes `<details>` "账单口径与说明" (department attribution follows member's current department; amounts shown at currency precision, hover for exact).
## Resources / delivery domain — smaller modules

### useDeliveryProxies-DGHL4QCT.js (~50 lines)
- **Purpose**: hook `t(enabled=true)` loading **all** outbound-proxy options page by page for proxy pickers (ResourceForm, CcmaxBatchDelivery).
- **Imports**: index `$, C, Z, mt, vt`.
- **API**: `GET /outbound-proxies/options?page={n}&size=100` loop while `n*size < total && items.length>0` (L25-33); merges by id; exposes partial results immediately (`loading=false` after first page, `loadingMore` while continuing). Re-runs on user id / `epoch` / retry counter. Returns `{data, error, loading, loadingMore, retry}`. Option fields consumed by ProxyCombobox: id, name, protocol, endpoint, enabled, maxResources, usedResources, reservedResources.

### PriorityBatchDialog-DWPDEDJI.js (~45 lines; **hand-written against vue-compat**; default export named `PriorityHistory`)
- **Purpose**: read-only "历史调度记录" dialog for legacy priority-adjustment jobs. Imported by ResourceTargets (`import PriorityHistory from './PriorityBatchDialog-…'`, out of scope page).
- **Imports**: index `C, G, P, S, c, g, l, rt, s`.
- **Permission**: `user.role==='ADMIN' && has('resource.dispatch')`, else red notice 当前账号无权访问历史记录.
- **API** (root `/cc-intake/admin/priority/jobs`): `GET /cc-intake/admin/priority/jobs` (list: createdAt, total, state); `GET /cc-intake/admin/priority/jobs/{id}` (detail: items[{resourceName, resourceId, priority, state}], protocol); `POST /cc-intake/admin/priority/jobs/{id}/reconcile` `{}` — "查询原结果" only when `protocol ∈ {NEWAPI, CCMAX_NATIVE}` and state ∈ PREVIEW/UNKNOWN/RUNNING/PREPARING/PARTIAL_FAILED. Toasts per result state. State labels PREVIEW 旧预览（已停用）/RUNNING/UNKNOWN/PARTIAL_FAILED/FAILED/COMPLETED/SUCCESS. Strings not i18n'd.

### ResourceLifecycleDialog-C3CIVivi.js (~178 lines)
- **Purpose**: pause/resume/remove job progress + history (lazy from Resources, L242).
- **Imports**: index `G, P, S, X, Z, _, c, d, g, h, mt, o, rt, s, vt`.
- **Default export** `b(props)`: if `props.state.mode==='progress'` → progress dialog `x({state:{id}, onClose, onChanged})`, else history dialog `S({onClose, onOpen(id)})`.
- **API** (base `/resource-lifecycle-jobs`):
  - `GET /resource-lifecycle-jobs/{id}` **polled every 3 s while `state==='RUNNING'`** (L52-55); when it stops running, calls `onChanged()` once. Fields: action (PAUSE|RESUME|REMOVE), total, state (RUNNING|NEEDS_REVIEW|UNKNOWN|FAILED|PARTIAL|PARTIAL_FAILED|COMPLETED), items[{resourceId, resourceName, targetName, state PENDING|SUBMITTING|UNKNOWN|DRAINING|PAUSED|RESUMED|GONE|FAILED, errorMessage}].
  - `POST /resource-lifecycle-jobs/{id}/reconcile` `{}` (L60) — "重新核对状态" when any item UNKNOWN; restarts polling.
  - `GET /resource-lifecycle-jobs?page&size` (history, default size 20) (L130) → {items[{id, action, items, total, state, createdAt}], total}.
- Notice texts stress "结果不明时只查询状态，不自动重复提交" (no automatic resubmission). Job creation happens in Resources (see there).

### CcmaxResourceOverview-BpVmtOxH.js (~300 lines)
- **Purpose**: collapsible "CCMAX 资源概况" panel above the resource list; also exports lane/operational-status label map `n` (used by resourceHelpers).
- **Imports**: index `C, S, X, Y, Z, g, h, i, mt, pt, s, vt`; lazy IntakeToday (rendered inside when expanded).
- **Props**: `filterQuery` (current list query string), `operationalStatus` (selected), `onFilter(status)`, `refreshIntervalMs` default **10000**.
- **API**: `GET /resources/overview?{filterQuery with resourceType=CCMAX, minus operationalStatus/page/size}` — only when expanded, **polled every 10 s** (L168-171). Response: counts{total, ready, active, provisioning, invalid, dead, cooling, gone, missingUsage, draining, paused, unknownState}, dailyConsumption{businessDate, amount|null, reportedResourceCount}, fiveHour/sevenDay{averageUsedPercent|null, reportedCount, exhaustedCount, nextResetAt, remainingEquivalent|null, missingCount}.
- **UI**: count metrics are buttons that call `onFilter` with READY/ALL/ACTIVE/PROVISIONING/INVALID/DEAD/COOLING/GONE/MISSING_USAGE/DRAINING/PAUSED/UNKNOWN/FIVE_HOUR_EXHAUSTED/SEVEN_DAY_EXHAUSTED (aria-pressed for current). Quota windows show progress bar, "已满 N" filter button, reset countdown (minutes/hours/days; tooltip in Asia/Shanghai). Daily consumption formatted with custom `_` ("$1, 234.50" — note the separator is `", "` with a space, L41-44) + "（北京时间）".
- Status label map `n` (L20-36): ALL, PAUSED, READY, ACTIVE, PROVISIONING, COOLING, DRAINING, DEAD, GONE, UNKNOWN, MISSING_USAGE, RATE_LIMITED, FIVE_HOUR_EXHAUSTED, SEVEN_DAY_EXHAUSTED, INVALID.

### CurrentResourceOverview-Dl-e28oo.js (~288 lines) — **not imported by any recovered module or `src/runtime` file** (likely superseded; verify before porting)
- **Purpose**: CCMAX current-inventory report ("套餐品类与当前状态" matrix).
- **Imports**: index `C, S, X, Z, _, c, d, g, h, mt, s, u, vt, y`; QueryFilters `r`; ccmaxAnalysis `a, c, f, i, r, t, u`; CcmaxDistribution `t` (both out of scope).
- **Props**: `catalog` (supplier directory result).
- **API**: `GET /reports/ccmax-resources/current?supplierId=` (L41) → {total, unprojectedCount, …} normalised by ccmaxAnalysis `u` into {states, plans[{type,total,states}]}.
- **UI**: supplier filter (if `supplier.read`, draft→apply), 查询/重置筛选/刷新统计; summary (当前就绪 + 在库就绪率, 在库资源 excl. GONE, 冷却中, 失效或不可用 = INVALID+DEAD); distributions (state click filters plans); matrix table client-side paged (default 20), sort total/ready/rate, plan search, "显示全部状态" toggle, synthetic 筛选合计 row; rates `(100*x/y).toFixed(1)%`.

### IntakeToday-Digz-vi6.js (~125 lines)
- **Purpose**: "今日上号额度" (today's onboarding quota) widget for supplier users; rendered in CcmaxResourceOverview and Resources (imported directly at Resources L5).
- **Imports**: index `C, S, X, g, h, mt, o, s`; labels `i, n, t`.
- **API**: `GET /cc-intake/mine` **poll 30 s** (only if `active` and user has supplierId) (L24) → {date, total, unknown, processing, pro, nonPro, canPro, accepting, proBlockReason, nonProBlockReason, proAllowance/nonProAllowance{source, reclaimed, used, limit|null, remaining, reservedRemaining}}.
- UI: totals (供应商今日成功总数 vs 本人 for non-SUPPLIER roles), 套餐未识别, 处理中及待核实; per PRO / 非PRO row: accepting badge with reason label (labels `n`), source label (labels `i`), used/limit with overage "超出N个", remaining, reserved note. Header "北京时间 · {date}".

### IntakeProjectTypes-FBnV0kVR.js (~82 lines)
- **Purpose**: dialog "接口交付适用类型" to set which channel types may be assigned to a project (lazy from **Projects** page, out of scope).
- **Imports**: index `C, G, S, X, Z, g, it, mt, s, vt`.
- **API**: `GET /projects/{id}/intake-channel-types` → number[]; `PUT /projects/{id}/intake-channel-types` body = number[] (L166). Channel type ids: 1 OpenAI 兼容, 3 Azure, 14 Anthropic, 24 Gemini, 33 AWS, 41 Vertex, 60 NewAPI (L141-149). Toast 项目适用资源类型已保存; `refresh()`.

### IntakeReviewDialog-C9xZ8Ftb.js (~204 lines)
- **Purpose**: wide dialog "核对上号计数" — platform reviews successful CC creations whose new-vs-existing attribution is ambiguous (lazy from Resources L2208). Only corrects counts, does not re-onboard.
- **Imports**: index `C, G, P, S, X, Z, _, c, g, mt, rt, s, u, vt`.
- **Permission**: platform user (no supplierId, role ∉ SUPPLIER/SUPPLIER_AGENT) && `resource.read` && `resource.dispatch`, else 当前账号无权访问此页面.
- **API**: `GET /deliveries/filter-options?assignment=ASSIGNED&supplierSearch=` (300 ms debounce) → {suppliers[{id,name,code}]}; `GET /cc-intake/admin/reviews?page&size[&supplierId]` (default size 20) → {items[{dispatchId, resourceName, supplierName, actorName, confirmedAt}], total}; `POST /cc-intake/admin/reviews/{dispatchId}/resolve` `{newlyCreated: result==='NEW', reason (trimmed, ≤500)}` (L131). Toast 上号计数已核对; `refresh()`.
- UI: supplier select, 刷新, table 资源名称/供应商/提交账号/确认成功时间/操作 核对此账号 → inline form 核对结果 (NEW 确认本次新增 | EXISTING 确认为已有账号) + 核对依据 textarea with counter `n/500`.

### IntakeAllocationDialog-CW0YASmn.js (~441 lines)
- **Purpose**: "CC每日上号额度分配" — supplier main account divides daily PRO / non-PRO onboarding quota among delivery groups and members (lazy from SupplierAgents L86).
- **Imports**: index `C, G, S, X, Z, b, g, h, it, mt, s, u, vt, y`; labels `t`.
- **Permission**: `role==='SUPPLIER' && has('supplier.agent.manage')`, else 仅供应商主账号可分配额度.
- **API**: `GET /cc-intake/allocations` → {proLimit|null, nonProLimit|null, version, groups[{id,name,allowPro,version}], members[{id,username,displayName}], memberships[{userId,groupId}], allocations[{kind GROUP|USER, subjectId, parentGroupId, proBasisPoints|null, nonProBasisPoints|null}], usage[{source ('S' | 'G:id' | 'U:id'), category PRO|NON_PRO, used, processing}]}. `PUT /cc-intake/allocations` `{allocations:[{kind, subjectId, parentGroupId, proBasisPoints, nonProBasisPoints}], groupPro:[{id, allowPro, version}] (only changed groups), version}` (L244-255) → same shape (re-initialises form).
- **Units**: percent inputs (0–100, ≤2 dp) ⇄ **basis points** (`Math.round(pct*100)`; `bp/100`) (L23-24). Blank = shared (null), 0 = allocate nothing.
- **Validation**: "分配比例须在0%至100%之间，最多两位小数"; sibling sum per parent (supplier `S` or group) per category ≤ 10000 bp ("同级划拨比例不能超过100%"); reclaiming a group with child allocations → "回收交付组额度前，请先回收或调整组内个人划拨。".
- **Derived numbers** (client-side, L78-100): daily count for a row = `floor(parentLimit × pct / 100)` (parent = group row if parentGroupId else supplier limit); shared remaining = limit − used − processing − Σ(children's (count − used − processing)⁺).
- UI: amber notice, summary per category (每日额度, 共享剩余), group table (交付组, 允许 PRO switch, PRO %, 非PRO %, 回收额度), member table with search/group filter/"仅看已划拨成员", client paging 20, 额度来源 select (供应商直接划拨 / 来自{group} / 原额度来源：{old group}), group balances, 恢复当前值, 保存额度分配.

### IntakePolicyPanel-DHvOkPUU.js (~361 lines)
- **Purpose**: CC onboarding policy editor at system / supplier / member level. Consumers (out of scope): SystemSettings (system), SupplierPlatformSettings (supplier + `MemberPrioritySettings`).
- **Imports**: index `C, S, X, Z, b, d, g, h, it, mt, s, u, vt`; labels `a` (tier labels), `t` (number fmt).
- **Exports**: default `v({supplierId?, memberId?, title?})`, `MemberPrioritySettings({supplierId})`.
- **Permission**: platform only; read needs `supplier.read` (supplier scope) or `system.settings`; write needs `supplier.write` or `system.settings` (L34).
- **API**: endpoint `C` = `/cc-intake/admin/system` | `/cc-intake/admin/suppliers/{supplierId}` | `/cc-intake/admin/suppliers/{supplierId}/members/{memberId}`; `GET C` → {policy{pro{mode,quantity}, nonPro{mode,quantity}, nonProOpen|null, tier|null, ranges{TIER:{min,max}}}, inherited{pro, nonPro, tier, ranges}, version}; `PUT C` `{policy:{…, ranges}, version}` (L129-134). `GET /cc-intake/admin/suppliers/{id}/members` → [{id, username, displayName}] for the member picker.
- **Rules**: quantity mode INHERIT (non-system only)/LIMITED (0–1e8 int)/UNLIMITED; nonProOpen INHERIT/OPEN/CLOSED; tier select (FALLBACK/NORMAL/PAYMENT_TERM/PARTNER/TEMPORARY, or 跟随上级); system rows without tier default to `inherited.tier || 'NORMAL'` (L40-42, hand-patched); per-tier priority range CUSTOM vs INHERIT, ints 0–1000, min ≤ max ("优先级区间须为0至1000且下限不大于上限"). Member scope hides quantity fields. Counts are per Beijing day. Toast CC上号规则已保存.

### PrioritySupportDialog-DfV-rWYR.js (~386 lines) — **not imported by any recovered module or runtime file** (verify whether ScheduledTasks/runtime replaced it)
- **Purpose**: create/edit a "priority support" scheduled task (boost account priority for selected suppliers).
- **Imports**: index `C, G, P, S, X, Z, c, g, h, it, mt, rt, s, u, vt`; labels `a`.
- **Props**: onClose, onSaved, taskKey? (edit mode).
- **API** (base `/system/scheduled-tasks`): `GET /system/scheduled-tasks/{taskKey}/rotation-settings` → {name, version, taskVersion, intervalMinutes, settings{mode, scope, tiers, maxAccounts, basisPoints, priority}, suppliers[{id,name,code}], rounds[{supplierName, createdAt, state, boost{succeeded,total,failed}, restore{…}}], restoreFailedCount}; edit `PUT …/rotation-settings`, create `POST /system/scheduled-tasks/priority-support`, body `{name, settings{mode SUPPLIER_IDLE|ROTATION, scope SELECTED|TIERS, tiers[], supplierIds[], basisPoints (pct×100), maxAccounts, priority}, version, intervalMinutes, taskVersion}`; `POST …/{taskKey}/rotation-settings/retry-restore` `{}`; supplier search `GET /deliveries/filter-options?supplierSearch=` (300 ms).
- **Validation**: task type required; ≥1 supplier (max 100) or ≥1 tier; ratio 0.01–100 ≤2 dp; priority int 0–1000; maxAccounts 1–50000; interval 1–1440 min. Round state labels BOOSTING/ACTIVE/RESTORING/RESTORE_FAILED/CLOSED/REPLACED.
### ResourceForm-CV4-f1sb.js (~757 lines)
- **Purpose**: supplier dialog "新增交付 / 编辑草稿 / 核对交付结果" for a single **CCMAX** resource (lazy from Resources L3110/L3159). Handles OAuth (authorize link + paste callback) and raw-credential (Refresh/Access Token, Session Key) submission with crash-safe "pending submission" recovery.
- **Imports**: index `$, C, G, P, Q (ApiError), S, X, Z, g, h, it, mt, ot, rt, s, u, vt`; useDeliveryProxies `t`; resourceHelpers `E, _, c, f, h, k, s, u`; Resources `c` (intake-access hook: `{allowed, deniedMessage, requireAllowed()}`) and `s` (intake-access notice component).
- **Props**: `resource` (`'new'` or resource object), `prefill?{projectId, projectName}`, `onClose`, `onSaved`, `onApiDelivery?` (switch to NewAPI delivery).
- **API**
  - `GET /resources/submission-capabilities` (new) or `…?resourceId={id}` (edit) (L67) → {credentialModes[], supportsProxy, allowDirectCcmax}. Unsupported mode → force `OAUTH`; no proxy support → clear proxy (L111-115). Error CCMAX_RAW_IMPORT_DISABLED forces OAUTH and reloads capabilities (L459-462).
  - `GET /projects?page=1&size=100`; `GET /resources/eligible-projects` → projects with a unique valid approved quote today (only these are selectable; "暂无可交付项目，请先提交报价并等待审核生效。"). Only projects whose name starts with `CCMAX` (case-insensitive) can be delivered here ("当前仅支持 CCMAX 项目交付") (L79).
  - Proxies: useDeliveryProxies (when supportsProxy) + `GET /outbound-proxies/{proxyId}` for selected; `POST /outbound-proxies/resolve` `{url}` when user typed a proxy URL (requires `proxy.write`&&`proxy.read`), checks `enabled` and capacity (L305-320).
  - OAuth (new): `POST /resources/oauth/supplier-authorize` `{...input, requestKey}` → `{sessionId, authUrl, expiresAt}` (requestKey reused while input fingerprint unchanged, L397-401); submit `POST /resources/oauth/supplier-submit` `{sessionId, code, input}` (L333); cancel `POST /resources/oauth/supplier-session/{sessionId}/cancel` `{}` on close / regenerate / input change (L118, 142, 390, 416); status `GET /resources/oauth/supplier-session/{id}` (L180).
  - OAuth (existing draft): `PUT /resources/{id}` (save input first if fingerprint changed) then `POST /resources/{id}/oauth/supplier-authorize` `{version, requestKey}` (L438-444); submit `POST /resources/{id}/oauth/supplier-submit` `{sessionId, code, version, remark}` (L341).
  - Credential (new): `POST /resources/supplier-submit` `{requestKey, input}` (L409); status `GET /resources/submissions/{requestKey}` (L180).
  - Drafts: `POST /resources/drafts` (new) / `PUT /resources/{id}` (edit) body = input (L447); formal submit of draft `POST /resources/{id}/submit` `{version}` (L450); refresh `GET /resources/{id}` (L165, 170, 191, 467).
  - **input body** (L249-281): `{accountName, projectId, credentialMode, remark, version? (edit), proxyId ('' if no proxy support), refreshToken|accessToken|sessionKey (only when entered; cleared to '' when project changed on edit), expiresAt (ms epoch int, ACCESS_TOKEN only), socks5:'' (edit with no proxy)}`.
- **Pending-submission recovery** (L41-51, 134-139, 175-202): sessionStorage key **`supplier:pending-submission:{userId}`** stores `{id (uuid), kind: 'OAUTH'|'CREDENTIAL'}` before submitting; on reopen shows "有一次交付结果尚未确认，请先刷新交付结果。" and "刷新交付结果" polls the session/submission (404 on OAuth → cancel). Submission result states: SUCCESS (toast, close), FAILED + recordDiscarded (reset), FAILED + resourceId (record kept), CANCELLED/EXPIRED (reset with message), PENDING/UNKNOWN (stay "in flight"; hint text from resourceHelpers `E`).
- **Error-code handling** (ApiError.details.code): `CCMAX_INTAKE_CONCURRENCY_LIMIT`, `OAUTH_STATE_MISMATCH` (keep session, clear code), `OAUTH_SESSION_EXPIRED` ("授权会话已过期，请重新生成授权链接。"), `CCMAX_RAW_IMPORT_DISABLED`; `details.creationNotStarted===true` → safe to retry (new requestKey), optionally reload `details.resourceId` (L167-174). Any other error after submit → "交付结果尚未确认：…请刷新交付结果，勿重复提交。" (**never auto-retry**).
- **Validation messages**: 请等待上号方式加载完成后重试; intake access denied (Resources `c.requireAllowed`); 请选择项目; 该项目今日没有唯一有效的已通过报价，暂不可交付; 请填写CCMAX账号名称 (max 128); 请选择可用代理; 当前账号只能选择已有代理，请从下拉列表选择; 请录入代理地址或从代理池选择代理 (when `!allowDirectCcmax`); 过期时间需为正整数毫秒时间戳; 请先生成授权链接并回填授权码; 请填写Refresh Token / Access Token / Session Key (unless already configured for same project+mode); 该代理已停用… / 该代理的可用名额已满….
- **UI**: delivery-method switch (CCMAX vs NewAPI → `onApiDelivery`) for new; read-only 资源名称 (system-generated); 所属项目; account name; credential mode select (only if >1 supported, else "上号方式：OAuth 授权"); ProxyCombobox; token inputs (password, "留空表示不更换" on edit); OAuth section (生成/重新生成授权链接, expiry, link textarea, 复制 via clipboard, 打开浏览器, callback textarea "回调地址或 code#state"); 备注; footer 刷新交付结果 (in-flight), 取消/关闭, 保存草稿, 正式提交. Fieldset disabled while busy or in flight. Title varies by in-flight state (正在自动重试 / 交付中 / 交付待处理 / 核对交付结果).

### ResourceDetail-PGeCmPlL.js (~474 lines)
- **Purpose**: wide drawer for one resource (lazy from Resources L3113). Supplier side: edit draft, OAuth retry, re-submit CCMAX target, delete. Platform side: dispatch to target / OAuth authorize+complete, dispatch history.
- **Imports**: index `$, C, D, G, P, S, X, Y, Z, c, g, h, l, mt, ot, rt, s, u, vt`; resourceHelpers `E, O, S, c, d, f, h, i, m, n, o, p, t, u`; Resources `a` (proxy-replacement detail dialog), `c` (intake-access hook), `i` (resource usage/extra section component — see Resources), `n` (reauthorization panel component), `o` (proxy-replacement history dialog), `r` (canForceRefreshCredential predicate), `s` (intake-access notice).
- **Props**: resource, supplierSide, onClose, onEdit(resource), onReauthorize, onRefreshCredential(resource), onRecover(resource, 'EDIT'|'DELETE'), onChanged.
- **Permission helper**: `j(p) = !resource.readOnly && has(p)` (L65) — `readOnly` resources disable all actions.
- **API**
  - `GET /projects?size=100` (project name fallback); `GET /resources/{id}` (detail; local mutate when parent passes a new object).
  - Platform CCMAX with `resource.dispatch`: `GET /resources/{id}/dispatches` → [{targetName, state, createdAt, creation* fields}] (only first shown); `GET /resource-targets` → [{id, name, enabled}].
  - Supplier with `resource.write`: `GET /resources/eligible-projects`.
  - `DELETE /resources/{id}?version={version}` (L104) → toast 已标记删除，列表中已隐藏 (soft delete). Shown when resourceHelpers `n` (canRemove).
  - `POST /resources/{id}/dispatch` `{targetId, requestKey, version}` (L108) — non-OAuth platform dispatch.
  - `POST /resources/{id}/oauth/authorize` `{targetId, version}` → {sessionId, authUrl, expiresAt}; `POST /resources/{id}/oauth/complete` `{sessionId, code, requestKey, version}` (L113-125).
  - `POST /resources/{id}/oauth/supplier-retry` `{version}` (L149) → draft resource then `onEdit(draft)` ("重新授权").
  - `POST /resources/{id}/submit` `{version}` (L168) — "补交 CCMAX 目标" when supplier && CCMAX && `resource.write` && state DELIVERED && no dispatchState && token credential mode; requires intake access and project eligibility. "刷新交付结果" re-GETs the resource.
  - `requestKey` = one UUID per drawer instance (L65) reused for dispatch/complete retries (idempotency).
- **Results handling**: dispatch/complete FAILED → message; UNKNOWN/PENDING → in-flight + hint; network error → "交付结果尚未确认：…勿重复提交。".
- **UI sections**: 代理更换记录 button (CCMAX, not readOnly) → Resources `o`/`a` dialogs; status grid (交付状态, 处理参考); failure reason (red); main DetailGrid (资源名称, 资源类型, 项目, 供应商 (platform; with code), 创建人, 创建时间/提交时间 in Beijing, 交付报价 quoteBasis{effectiveFrom, effectiveTo, currency}, 备注); CCMAX section (账号名称, Lane ID + copy, 凭据方式, 代理 proxyName/proxyType/proxyEndpoint, 凭据 status) + ResourceHealthNotice + 强制刷新授权 (Resources `r`) + reauthorization panel (Resources `n`); Resources `i` section; 买断金额 (supplier, ACCOUNT_BUYOUT, DELIVERED: buyoutAmount buyoutCurrency); action rows (编辑草稿/重新授权, OAuth retry, manual recover 编辑/删除 via `onRecover`, 删除); 补交; 交付记录 (platform dispatch UI); 消费金额（CC目标） `usage{amount,currency}` (hidden for supplier buyout).

### NewDelivery-CYrGthQl.js (~631 lines)
- **Purpose**: "新增交付" dialog for **NewAPI** (API-key) resources — creates `resource-intakes` that are later assigned to a quote project (lazy from Resources L3120). Supplier or platform (platform must pick supplier).
- **Imports**: index `C, G, S, X, Z, g, mt, ot, rt, s, u, vt, x`; Resources `c` (intake-access hook), `s` (access notice).
- **Props**: onClose, onSaved, onCcmax? (switch to CCMAX ResourceForm; asks confirmation "切换到 CCMAX 会清除当前未提交资料。" if data entered).
- **API**
  - Platform: `GET /suppliers?page=1&size=100&search=` (L131); extra search input shown when total > 100.
  - `POST /resource-intakes/recognize` `{text, channelType: null|number}` (L209) → {recognized, request (single `{mode, multi_key_mode, channel}` or `{requests:[…]}`), raw, message}. Result → grouped table (type / API 地址 (query stripped) / 密钥数量) or JSON editor (raw or Vertex type 41).
  - `POST /resource-intakes/preview` body = built request (L233) → {resourceCount, keyCount}. Must re-preview after any edit (revision counter `Z`; edits call `$()` to invalidate).
  - `POST /resource-intakes` `{request, requestKey (one UUID per dialog), supplierId, name}` (L249) → {resourceIds[]}; toast "已接收 {n} 条资料，待分配报价项目".
- **Provider types** (L100-121): 1 OpenAI, 3 Azure OpenAI, 14 Anthropic, 24 Google Gemini, 33 AWS Bedrock, 41 Google Vertex, 60 NewAPI.
- **Tabs**: 智能录入 (provider auto/explicit, paste textarea, 识别资料) | 手动填写 (provider, 添加模式 single/batch/multi_to_single, Vertex 凭据方式 api_key/service_account, 密钥聚合模式 random/polling, API 地址 (required for Azure), 模型 (comma-separated), API 密钥 textarea or service-account JSON uploader). Optional 名称 (≤100; default channel name "供应商交付").
- **Manual request body** (L159-178): `{mode (single for Vertex SA else chosen), multi_key_mode, channel:{type:Number, name, key, base_url, models, settings? (Vertex: JSON.stringify({vertex_key_type}))}}`; grouped: `{requests:[…each with channel.models overridden]}`; json mode: parsed object.
- **File rules**: data file TXT/JSON ≤ 200 KB (`2e5` bytes), non-empty, no NUL bytes, strict UTF-8 (L186-195). Service-account JSON ≤ **1 MiB**, must be object with `type==='service_account'`, non-empty `project_id`, `client_email`, `private_key`, serialized ≤ 64000 chars; BOM stripped (L25-43).
- Validation messages: 请先识别交付资料。/ 请先识别资料，再核对并提交。/ NewAPI 资料不是有效的 JSON… / 请填写交付凭据。/ Azure 交付需要填写 Endpoint 地址。/ 请先选择交付供应商。

### CcmaxBatchDelivery-BSCydCTL.js (~327 lines)
- **Purpose**: "CCMAX 批量交付" — up to 100 independent raw-credential CCMAX deliveries in one request (lazy from Resources L3116). OAuth not supported here.
- **Imports**: index `C, G, S, X, Z, g, mt, ot, rt, s, u, vt`; useDeliveryProxies `t`; Resources `c` (access hook), `s` (notice).
- **Props**: initialSupplierId, initialProjectId, onClose, onSaved, onOpen(resource).
- **API**: `GET /resources/eligible-projects`; proxies via useDeliveryProxies; `POST /resources/ccmax/batch` `{items:[{requestKey, input:{projectId, proxyId, credentialMode, accountName, refreshToken?|accessToken?|sessionKey?, socks5?, remark?, expiresAt?}}]}` (L125) → {results[{index, success, resource?, message}], successCount, failureCount}.
- **Idempotency**: each row's `requestKey` (UUID) is kept across retries ("原提交编号已保留，核对时不会换号重建"); succeeded rows are skipped on re-submit; result mapping persisted to **sessionStorage `hub:ccmax-batch-result`** as [{requestKey, resourceId}] (L147). Successful rows drop secrets from local state.
- **JSON paste parser `g`** (L25-57): ≤200 KB UTF-8, JSON array of 1–100 objects; credentialMode ∈ REFRESH_TOKEN/ACCESS_TOKEN/SESSION_KEY; string fields refreshToken/accessToken/sessionKey/socks5/remark; expiresAt positive safe int; projectId/proxyId default to first row's values.
- **Validation**: every pending row needs supplier, project, accountName and proxyId or socks5 ("请为每条选择供应商、项目、账号标识和代理。"); intake access required. Row editor: 项目, 账号标识, 凭据方式, 凭据 (password), 代理 (enabled proxies "name · endpoint"); row status 交付成功 / 结果核对中; "查看原交付记录".
### Resources-CXo1DF00.js (~3165 lines)
- **Purpose**: the resource list page. Routes `#/resources` / `#/resources-pending` (`supplierSide:false`) and `#/deliveries` / `#/deliveries-pending` (`supplierSide:true`), prop `pendingOnly` (index 7675-7683). Nav perm `resource.read`. Also exports many sub-components used by ResourceForm/ResourceDetail/NewDelivery/CcmaxBatchDelivery.
- **Imports**: index `$, A, B, C, D, G, I, K, P, Q, S, X, Y, Z, _, _t, c, d, dt, g, h, i, it, l, m, mt, o, ot, pt, r, rt, s, st, u, vt, y`; CcmaxResourceOverview `t`; QueryFilters `n, r, t`; DateRangePicker `t`; MoneyDisplay `t`; resourceHelpers `A, C, D, M, N, S, T, _, a, b, f, g, h, i, j, k, l, n, p, r, t, v, w, x, y`; IntakeToday (static import L5); lazy ResourceLifecycleDialog, IntakeReviewDialog, PriorityBatchDialog(?), CcmaxResourceOverview, ResourceForm, ResourceDetail, CcmaxBatchDelivery, NewDelivery (mapDeps L6). **Runtime (non-recovered) deps** L2-4: `../runtime/newapi-channel.js` (ChannelUsage, NewApiChannelDialog, NewApiLinkDialog, channelLabel, isNewApi), `../runtime/ccmax-native.js` (NativeCcmaxDialog, NativeCcmaxLinkDialog, isNativeCcmax), `../runtime/lifecycle-intent.js` (createLifecycleIntent, lifecycleOutcome, lifecycleMessage).

#### Part 1 (L86-900): access hook, lifecycle actions, intake config viewer, proxy replacement
- **`c` export = `Me(enabled=true)` intake-access hook** (L95-111): enabled iff supplier user with `resource.write`; `GET /resources/submission-capabilities` → `allowed = allowCcmax===true && !forceStopCcmaxIntake`; `deniedMessage` = 平台已暂停 CCMAX 新增上号… (forceStop) or 当前供应商未开通 CCMAX 上号…; `requireAllowed()` re-GETs capabilities and throws if not allowed (fresh check before every submit).
- **`s` export = `Ne({access})`** notice: red with 重新加载配置 on error, amber deniedMessage when not allowed (L113-126).
- `Pe` anchored popover confirm "移除后无法恢复" (portal; Esc/outside click cancels) (L128-221).
- Role predicates: `Fe(user)` platform dispatcher = no supplierId, role ∉ SUPPLIER/SUPPLIER_AGENT, perms resource.read + resource.dispatch (L223-225); `Ie(user, supplierSide)` may manage lifecycle = resource.read && (supplier ? supplierId && resource.write : resource.dispatch) (L227-230).
- `Le(r)` lifecycle-eligible (L232-237): not readOnly and (native CCMAX: upstreamAccountId; NewAPI: upstreamChannelId; legacy CCMAX: DELIVERED && dispatch SUCCESS && laneId) and state ∉ GONE/DRAINING. `pausedResource` = health.paused || operationalState/laneState PAUSED.
- **`ze(supplierSide, reload, refresh, capabilities)` lifecycle controller** (L244-388): supplier pause allowed only if `capabilities.allowCcmaxPause===true`, removal only if `allowCcmaxSafeRemoval===true`; batch actions only for platform dispatchers (`maySelect`). Uses runtime `createLifecycleIntent` → `POST /resource-lifecycle-jobs` `{action: PAUSE|RESUME|REMOVE, items:[{resourceId, version}] sorted by resourceId, requestKey}`; on lost response keeps the intent and offers "查询原维护结果" which does `GET /resource-lifecycle-jobs/{id}` or `GET /resource-lifecycle-jobs/by-request/{requestKey}`, then `POST /resource-lifecycle-jobs/{id}/reconcile` if still pending (runtime/lifecycle-intent.js). Error codes RESOURCE_LIFECYCLE_UNRESOLVED / RESOURCE_JOB_ALREADY_RUNNING keep the block; 4xx clears it. Row actions 停用/恢复, 移除 (popover confirm); toolbar 批量停用/批量恢复 (requires uniform paused state, else "请选择启停状态相同的资源"), 批量移除, 启停与移除记录, 查看原操作 (opens ResourceLifecycleDialog progress).
- **NewAPI intake configuration viewer `He({item})`** (L411-564): `POST /resource-intakes/{id}/original-request` `{}` if `resource.request.read` → `{originalRequest}`; `POST /resource-intakes/{id}/material` `{}` if `resource.sensitive` → `{channel{key, model_mapping}}` (both POST to avoid caching secrets; not for readOnly). Shows 资源名称, 类型 (channel type map `Be` L389-397), API 地址 (`configuration.base_url`), 支持模型 (dedup from `configuration.models` CSV), 模型映射, API 密钥 (查看/隐藏/复制 with clipboard), 原始请求 (copy), "已保存 {memberCount} 个密钥".
- **Proxy replacement** (L565-900+):
  - Status labels `Ue` QUEUED/PREPARING/SUBMITTING/RUNNING/VERIFYING/COMPLETED/PARTIAL_FAILED/FAILED/NEEDS_REVIEW/DONE/SKIPPED/PENDING/READY/SUBMITTED; terminal set COMPLETED, PARTIAL_FAILED, FAILED, NEEDS_REVIEW.
  - `Ge(r)` eligible for proxy replacement: not readOnly and ((NewAPI or native CCMAX) && operationalState≠GONE, or legacy CCMAX delivered with laneId) (L583-585).
  - `B(text)` accepts proxy search text ≤128 chars, host:port or bracketed IPv6 (L587-590).
  - Picker `V` (L595-655): `GET /resource-proxy-replacements/proxy-options?resourceId&search&page&size` (search debounced 250 ms, default size 20) → items {id, name, protocol, endpoint, supported, version, …}; ProxyCombobox with `allowFull`, protocols SOCKS5/HTTP; supports pasting `host:port:username:password`.
  - Dialog `qe({resources, onClose, onCreated})` 更换代理 / 批量替换代理 (L657-768): `POST /resource-proxy-replacements` `{requestKey, items:[{resourceId, resourceVersion, proxyId+proxyVersion | proxyUrl}]}` → `{id}`. Typing a new URL needs `proxy.read`&&`proxy.write`. On non-4xx error, keeps the same `requestKey` and switches button to "核对同一请求" (idempotent retry); changing inputs regenerates the key only when not in that state.
  - History `Je` (exported `o`) 更换记录 (L770-833): `GET /resource-proxy-replacements?scope=mine|all&page&size=10[&resourceId]` **poll 5 s**; scope select hidden for SUPPLIER_AGENT; columns 操作时间, 操作人, 类型 (SINGLE 单条更换 / 批量替换), 进度 finished/total, 状态, 查看进度.
  - Progress `Ye` (exported `a`) drawer (L835-…): `GET /resource-proxy-replacements/{id}` **poll 3 s until terminal**, then `onCompleted()` once; counts DONE/SKIPPED/FAILED/NEEDS_REVIEW; `POST /resource-proxy-replacements/{id}/reconcile` `{}` when NEEDS_REVIEW (restarts polling).

#### Part 2 (L900-2207): usage widgets, list renderers, credential refresh, intake assignment, reauthorization
- Usage windows `Xe`: fiveHour (5h), sevenDay (7d), sevenDayFable (Fable 7d; shown only if fable fields present). Times formatted in **Asia/Shanghai** (`K`, L953-964). Percent displayed with max 6 fraction digits; mini-bar classes `high` ≥90, `medium` ≥75.
- `tt` (exported `i`? — no: exported `i` is `it`; see export list) list usage cell: NewAPI → runtime `ChannelUsage`; CCMAX → plan pill (`usage.plan.label|tier`) + 5h/7d mini bars with reset time; non-CCMAX with resourceData → "查看扩展信息".
- `it({resource})` "套餐与额度" section (used by ResourceDetail as Resources `i`, L1109-1194): DetailGrid (套餐类型, 订阅创建时间, 套餐检查时间), quota cards with `<meter low=75 high=90>`, reset/observed times, "采集时间未知", 最近同步时间, Fable 限制结束时间, `<details>更多数据` generic JSON renderer `rt` with field-label dictionary `nt` (L1044-1072) — hides `ageSeconds`, `source`, plan.rateLimitTier/billingType/extraUsageEnabled. Non-CCMAX: "资源扩展信息" JSON.
- **List renderer `at`** (L1196-1391): mobile (index `r` useIsMobile) → card list `st` (L1405-1559); desktop DataTable.
  - NEWAPI_INTAKE tab columns (supplierSide or pendingOnly with resourceType NEWAPI_INTAKE): 资源名称 (+baseUrl), 资源类型 (projectCategoryName), 提供商 (channel type), 密钥数量 memberCount, 模型 (first 2 of modelSummary + 等), 报价项目 (projectName + 已分配/待分配项目 badge by assignmentState), [供应商], 录入人, 录入时间 receivedAt, 操作.
  - Default columns: [selection checkbox (when CCMAX visible && mayReplace; only rows passing `Ge`; **max 100 selected**)], 资源信息 (name; type label "New API 渠道"/category/resourceType; supplier side: accountName, credential mode label), 项目 / 创建人, [供应商 + code — platform], 交付 / 资源状态 (`ct` delivery badge, `lt` resource badge), 额度 / 使用情况, 提交时间 (Beijing; 待确认/未提交), 金额 (supplier) / 消费金额 (platform) via `ot`, 操作.
  - `ot` money cell (L1393-1403): NewAPI "—（配额原值）"; native CCMAX usage.amount; intake "—"; supplier buyout → buyoutAmount/buyoutCurrency; platform DRAFT → 未交付; else usage.amount (MoneyDisplay; currency default USD on supplier side).
  - `ct` delivery badge (L1561-1575): native CCMAX not SUCCESS → "已有账号已关联"; NewAPI → "已有渠道已关联"; intake → deliveryState (import labels); else resourceHelpers DeliveryStateBadge with failure tooltip.
  - `lt` resource badge (L1577-1599): native CCMAX operationalState ACTIVE/PAUSED/GONE(已归档)/ERROR; NewAPI channelLabel; intake onboardingState; legacy lane badge, "已暂停" when health.paused (unless DRAINING/GONE), plus credential reason (amber color #a87823 unless account invalid).
- **Credential refresh dialog `ut`** "强制刷新授权" (L1601-1715): `GET /resources/{id}/credential-refresh` → {id, status NONE|SUBMITTING|UNKNOWN|FAILED|saved|complete, reauthorizationAllowed, paused}; `POST /resources/{id}/credential-refresh` `{requestId (original id when continuing 'saved', else stable UUID), version}`; new UUID only after complete/FAILED; 403 → reauthorization not allowed. Buttons 查询操作结果, OAuth 重新授权 (FAILED/UNKNOWN), 继续同步 (saved), 确认刷新授权 (NONE/FAILED/complete). Opened via Resources export `r` predicate `gt`.
- `gt(resource, supplierSide, has)` (exported `r`, L1947-1951): can re-auth/force-refresh when not readOnly, legacy CCMAX delivered+SUCCESS+laneId, and (paused, or credential reason other than "access token expiring", or laneState ∉ READY/COOLING), with `resource.read` and (`resource.write` supplier | `resource.dispatch` platform). `_t` (exported `n`) renders the 重新授权 button.
- `dt` resource-type filter select (L1717-1740): `GET /projects/category-codes` → [{code,name}]; options ``, CCMAX, NEWAPI_CHANNEL (New API 渠道), others.
- **Intake detail `ft`** 接收资源详情 (L1742-1788): `GET /resource-intakes/{id}` → {projectName, state UNASSIGNED|ASSIGNED, assignedAt, quoteBasis, configuration, channelType, memberCount, …}; uses `He` viewer; 接收记录 details (录入方式 API/网页, 录入时间, 报价币种, 价格/折扣 via index `dt`); 分配项目 button when UNASSIGNED and `onAssign`.
- **Assign project `pt`** (L1790-1927): `GET /resource-intakes/{id}/eligible-projects` → [{id, name, quoteToken, quoteBasis{unitPrice, multiplier, ratePercent, currency, effectiveFrom, effectiveTo}}]; `POST /resource-intakes/{id}/assign-project` `{projectId, version, requestKey (per dialog), quoteToken}` (L1806). Hint "仅可分配一次，保存后不可更改". Empty: 暂无可分配项目.
- **Reauthorization dialog `vt`** "已有账号重新授权" (L1969-2206): base `/resources/{id}/reauthorizations`; `GET …/current` on open; `POST …` `{version, mode: OAUTH|REFRESH_TOKEN}` to start (generate link); `GET …/{reauthId}` progress — **auto-poll every 3 s** while submitted and status ∈ SUBMITTING/pending/staged/saved/installed; `PUT …/{reauthId}` body OAuth `{code}` or RT `{refreshToken, accessToken?, expiresAt?}` (expiresAt must be future Unix ms: "有效期请填写未来的 Unix 毫秒时间戳。"). Status labels `mt` (NONE, INITIALIZING, READY, SUBMITTING, UNKNOWN, NOT_FOUND, FAILED, CANCELLED, pending, exchanging, staged, saved, installed, complete, superseded). `expiredUnsaved`/NOT_FOUND/exchanging force OAuth mode; warns not to reuse one-time codes/RT. On `complete` calls onChanged once; `credentialSaved` clears secret inputs; 403 → not allowed ("当前供应商未开通 CCMAX 重新授权").

#### Part 3 (L2210-3165): page `St` + wrapper `J` (default export)
- **Exports** (L3162-3164): default `J({supplierSide, pendingOnly=false})`; `a` = proxy-replacement progress `Ye`; `c` = intake-access hook `Me`; `i` = 套餐与额度 section `it`; `n` = 重新授权 button `_t`; `o` = replacement history `Je`; `r` = reauth predicate `gt`; `s` = access notice `Ne`; `t` = namespace.
- `J` wraps `St` (keyed by pending/assigned) and owns the NewDelivery dialog (NewAPI) and a second ResourceForm instance for switching CCMAX⇄NewAPI (L3122-3158).
- **Mode variables** (L2235-2242): `pendingOnly` → resourceType forced `NEWAPI_INTAKE`, assignment `UNASSIGNED` (else `ASSIGNED`); `ccmaxVisible V` = not pending and type ∈ {'', CCMAX, NEWAPI_CHANNEL}; `Xe` platform dispatcher (shows 核对上号计数 → IntakeReviewDialog); `H` mayReplaceProxy = `supportsProxy && proxy.read && (supplier ? resource.write : resource.dispatch)`; `Dn` canDeliver = supplierSide && `resource.write`.
- **Query building** (L2292-2312): `cn` = {search (debounced 300 ms via resourceHelpers `D`), supplierSearch (supplier id; platform only), creatorSearch (creator id), resourceType (NEWAPI_INTAKE | CCMAX | NEWAPI_CHANNEL | ''), category (other category codes), assignment, newApiDeliveryState, newApiResourceState, operationalStatus, failureReason, projectId, credentialMode (supplier or CCMAX only), state, createdFrom, createdTo}. Summary query `ln` = cn with resourceType=CCMAX minus assignment/newApi*.
- **API**
  - `GET /resources/submission-capabilities` (page-level: `supportsProxy`; supplier w/ write: allowCcmax / forceStopCcmaxIntake / allowCcmaxPause / allowCcmaxSafeRemoval).
  - `GET /deliveries/filter-options?assignment&supplierSearch&creatorSearch` (300 ms debounced text) → {suppliers[{id,name,code}], creators[{id,name,code}]} (labels cached so chips survive search changes).
  - **`GET /deliveries?{cn}&page&size&summaryOnly=true`** — main list; **poll 10 s** when no search text (0 when searching) (L2328-2330). Page size default 10.
  - `GET /resources/summary?{ln}` (supplier, CCMAX visible; poll 30 s) → [{category, categoryName, amounts[{kind BUYOUT|…, amount, currency, resourceCount}]}] — "项目分类汇总".
  - `GET /resources/creator-summary?{ln}` (when toggled; poll 30 s) → [{creatorName, creatorUsername, resourceCount, amountResourceCount, consumptionAmountUsd}].
  - `GET /resources/failure-reasons?{ln minus failureReason}` (poll 30 s) → [{value, label, count}].
  - `GET /projects?size=100` (names); `GET /projects/category-codes` (type filter).
  - Deep link `?quoteId=` (from Quotes "交付"): `GET /quotes/{id}` + `GET /resources/eligible-projects`; requires `quote.read`, quote APPROVED and owned by this supplier, project eligible → opens ResourceForm prefilled (L2401-2439); on close navigates back to `deliveries`.
  - `POST /resources/{id}/usage` `{}` "同步" (CCMAX, `resource.usage`, DELIVERED+SUCCESS, not supplier buyout) → {state UPDATED|…, amount,…}; then `GET /resources/{id}` to merge row via `mutate` (L2459-2492). In-flight Set per row.
  - Edit/OAuth-retry flow `Vn`: `GET /resources/{id}`, if canOauthRetry `POST /resources/{id}/oauth/supplier-retry` `{version}` then open ResourceForm (L2493-2511).
  - `DELETE /resources/{id}?version=` confirm dialog "删除资源 … 标记删除并从列表隐藏，记录保留。" (L2512-2525).
  - **Creation recovery** `POST /resources/{id}/creation-recovery` `{version, dispatchId: recoveryDispatchId, confirmedNotCreated:true, action: 'EDIT'|'DELETE'}` (L2274-2291) — dialog 核对后编辑/核对后删除 requires checkbox "我已核实CCMAX未创建该资源，确认本次交付失败"; response {deleted} or {resource} (opens form).
  - Lifecycle, proxy replacement, credential refresh, reauthorization, intake detail/assign — see Parts 1-2. Admin-only (`role==='ADMIN'` && `resource.dispatch` && `resource.config.read`, platform): 关联 CCMAX 原生账号 (runtime NativeCcmaxLinkDialog) and 关联 New API 渠道 (runtime NewApiLinkDialog).
- **Header actions** (L2626-2650): [admin link buttons], 刷新 (platform; guarded against double refresh), 按创建人汇总 toggle (CCMAX visible), 新增交付 (supplier `resource.write`; disabled while quote prefill loading or capabilities missing; if CCMAX intake stopped/disallowed or pending tab → opens NewDelivery instead; label "NewAPI 资源交付" when CCMAX blocked).
- **Panels**: capability errors / denied notice; CcmaxResourceOverview (filterQuery=`ln`, refresh 30 s/0, clicking a metric sets type=CCMAX and operationalStatus); IntakeToday (supplier); 项目分类汇总 (supplier).
- **Filters** (QueryFilters `t` with mobileCompact, applied-filter chips `En` L2344-2396, reset): primary search (搜索资源名称、账号或 Lane ID); 供应商 (platform); 创建人/录入人; resource-type select (`dt`); 交付项目; [CCMAX visible: 凭据方式 (supplier or CCMAX), 交付状态 (resourceHelpers `l` options), 资源状态 (operational status labels `x`), 失效原因 (with counts)]; [platform NEWAPI_INTAKE: newApiDeliveryState / newApiResourceState]; 创建日期 DateRangePicker. Hint: "两天前创建的草稿默认不显示…" (server default window — preserve). Toolbar actions: lifecycle toolbar, 核对上号计数, 批量替换代理（n） (disabled if any selected NewAPI/native), 更换记录. Selection (Map, ≤100) resets whenever filters change (L2254).
- **Row actions `Wn`** (L2539-2624): native CCMAX → "CCMAX 账号详情" (runtime NativeCcmaxDialog); NewAPI → "渠道详情" (NewApiChannelDialog); readOnly → only 同步; intake rows → 分配项目 (`resource.intake.manage` && `resource.write` && UNASSIGNED) + 查看; others → 同步, 停用/恢复/移除, 更换代理, 重新授权 (`gt`), manual-recover 编辑/删除 (resourceHelpers `i`), OAuth 重新授权 (`a`), 强制刷新 (`gt`), 编辑/重新授权 draft (`r`), 删除 (`n`). Row click: intake → 接收资源详情, else ResourceDetail / native / NewAPI dialog.
- **Note**: `CcmaxBatchDelivery` (`Tt`) is rendered when state `v` is true, but nothing in the file sets it to true (no `x(!0)` call) — the batch dialog is currently unreachable from this page. `PriorityBatchDialog` appears only in `__vite__mapDeps` (L6), not imported.

#### Runtime dependencies used by Resources (outside `recovered/`, summarized from grep only — not fully read)
- `runtime/lifecycle-intent.js` (73 lines, read): endpoints listed in Part 1.
- `runtime/newapi-channel.js`: `isNewApi` (upstreamChannelId | upstreamProtocol NEWAPI | resourceType NEWAPI_CHANNEL); `ChannelUsage`; `NewApiChannelDialog` (`GET /resources/{id}`, `POST /resources/{id}/usage {requestKey}`; perm `resource.write`/`resource.dispatch`, `resource.usage`); `NewApiLinkDialog` (`GET /resource-targets`, `GET /resources?page=1&size=100&search=`, `POST /resources/{id}/upstream-channel {targetId, channelId, version}`).
- `runtime/ccmax-native.js`: `isNativeCcmax` (upstreamProtocol CCMAX_NATIVE | upstreamAccountId); `NativeCcmaxDialog` (`GET /resources/submission-capabilities?resourceId=` poll 30 s, `GET /resources/{id}/credential-refresh`, `GET /resources/{id}/reauthorizations/current`, `POST /resources/{id}/{action} {requestKey}`, reauthorizations POST/`…/{id}`, `POST /resources/{id}/operations/{opId}/reconcile`, `POST /resource-lifecycle-jobs/{id}/reconcile`; ADMIN-only 归档账号); `NativeCcmaxLinkDialog` (`GET /resource-targets`, `GET /resources?page=1&size=100`, `GET /resource-targets/{id}/accounts?page&search` 65 s timeout, `POST /resources/{id}/upstream-account {targetId, accountId, version}`).
## Proxies & team management

### OutboundProxies-BILxGplZ.js (~743 lines)
- **Purpose**: `#/outbound-proxies` — supplier "代理配置" (own proxy pool) or platform "代理管理" (`platform` prop = `!user.supplierId`, index 7678). Nav perm `proxy.read`; nav entry only when `connectionFeatures.supportsProxy===true` (index 8441).
- **Imports**: index `$, C, G, P, Q, S, W, X, Y, Z, _, c, g, h, it, m, mt, ot, rt, s, u, vt, y`; QueryFilters `i` (supplier directory), `r` (supplier filter).
- **API**
  - `GET /outbound-proxies/page?page&size&search&state&protocol[&supplierSearch (platform)]` (L94) → {items[{id, name, endpoint, protocol, enabled, testable, editable, maxResources (0 = 不限), usedResources, reservedResources, lastTestState OK|FAILED|null, lastTestMessage, lastTestLatencyMs, lastTestedAt, supplierName, supplierCode, creatorName, version}], total}. Default filters: state **`enabled`**, protocol `all`, page size **50**.
  - `GET /resources/submission-capabilities` → `supportsProxy`; if not true shows notice "当前接入使用上游直连，代理记录仅供兼容接入维护，不参与原生 OAuth 上号。".
  - `GET /outbound-proxies/{id}/resources` (bound-resources dialog) → [{name, accountName, projectName, creatorName, state}].
  - `POST /outbound-proxies/{id}/test` `{}` → updated proxy test fields (merged into local overlay `we`, cleared when the list reloads).
  - `POST /outbound-proxies` `{name, url, maxResources|null, enabled}` (new); `PUT /outbound-proxies/{id}` `{name, url ('' keeps existing), maxResources, enabled, version}` (L238-241). URL validated with index `W` (socks5/http/https with port). Messages: 请填写代理名称和有效的绑定上限 / 请填写有效的代理 URL / 代理地址格式不正确. URL input is a password field; "已有资源绑定时不可修改地址".
  - `POST /outbound-proxies/import` `{lines, defaultProtocol SOCKS5|HTTP|HTTPS, maxResources|null}` → {imported, skipped[{line, reason}]} — summary "已导入 N 条；跳过 M 条。第 x 行：reason…" (L32-39). Max 500 lines (per label). Supplier only.
- **Batch test** (`je`, L150-212; needs `proxy.write`): collects **all pages** of the current filter (size 100) via `le` with consistency checks (total must stay constant: "代理列表已变化，请刷新后重新检测"); tests only `testable` proxies with **concurrency 3** (`ue`, L57-84); progress phases collecting/running/stopping/stopped/complete/error; stop flag lets in-flight requests finish; 401/403 aborts. Counts 正常/失败/请求失败/无检测权限 (skipped).
- **Table**: 代理/地址 (name, endpoint), [所属供应商 (+code), 创建人 — platform], 协议, 状态 (启用/停用), 检测 (state, latency ms · time, message), 占用/上限 (`used+reserved / max|不限`, "含 N 个预占"), 操作 (检测 if testable, 绑定资源, 配置 if editable). Row click → bound resources.
- Header buttons: 批量检测 (`proxy.write`), 批量导入 + 新增代理 (supplier only). Empty states differ for filtered/platform/supplier.


### SupplierAgents-GOZSRGGY.js (~732 lines)
- **Purpose**: `#/supplier-agents` "团队成员" — supplier main account (`role==='SUPPLIER'`) manages member accounts, departments (team groups), project permissions, CC quota allocation; a department admin (`SUPPLIER_AGENT` with `teamAdminGroup`) sees own group and manages members' project permissions only. Nav visibility: agent → `teamAdminGroup.id`; others `supplier.agent.manage` (index 8436).
- **Imports**: index `C, G, S, X, Y, Z, c, f, g, h, i, it, l, m, mt, pt, rt, s, u, vt, y`; lazy IntakeAllocationDialog, SupplierTeamGroups, SupplierMemberGroupDialog.
- **API**
  - `GET /supplier-agents` → [{id, username, displayName, enabled, version, projects[{id, name, category, categoryName}]}].
  - `GET /supplier-team-groups` (SUPPLIER only) → [{id, name, adminUserId, memberIds[], allowPro, version}].
  - `GET /auth/registration-policy` → {passwordMinLength, passwordMaxLength, requireUpper, requireLower, requireDigit, requireSymbol} — live password checks use Unicode classes `\p{Lu}`, `\p{Ll}`, `\p{Nd}`, symbol = `[^\p{L}\p{N}\s]`, length by code points (L316-318).
  - `POST /supplier-agents` `{username (trim), displayName (trim), password ('' = auto-generate), groupId (SUPPLIER: selected dept or null; agent: own teamAdminGroup.id)}` → {initialPassword?, groupName} (L326-336). Client-side duplicate-username check (case-insensitive) against list.
  - `PUT /supplier-agents/{id}/enabled` `{enabled: !enabled, version}` (L347).
  - `POST /supplier-agents/{id}/password` `{password: ''}` → {initialPassword} (reset; invalidates sessions) (L362).
  - Project permissions dialog `T`: `GET /supplier-agents/{id}/projects` → {assignedIds[], availableProjects[{id, name, category, categoryName, assignable}]}; `PUT /supplier-agents/{id}/projects` `{projectIds}` (L154). `assignable===false` = historical grant: can be unchecked but not re-checked. Agent editing self is read-only.
- **Credentials display `E`**: initial password shown once with amber warning "初始密码仅在此处显示一次…" and 我已保存.
- **UI**: header 额度分配 (SUPPLIER → IntakeAllocationDialog), 新增成员 (default dept = selected, else "交付组1", else first); department sidebar `ne` (SUPPLIER: 全部成员 + groups with member counts, 新增部门); content header (dept name + count, admin info, PRO允许/PRO停收 badge; actions 分配成员 / 设置|更换管理员 / 编辑部门 / 删除部门 / refresh); filters: search name/username, project category (`category:{code}`|`uncategorized`), project; table 成员, 所属部门 (+部门管理员 tag), 可操作项目 (count + first 3 tags + 查看全部), 状态, 操作 (SUPPLIER: 重置密码, 停用/启用, 权限管理, 调整分组 (disabled for a dept admin: "请先更换原部门管理员"); agent: 权限管理 except self).
- **Probable recovery bug**: in the project-permission dialog the 保存 button renders only when `v` (the *search text* state) is non-empty (L257: `v && (0,b.jsx)(g,{… 保存})`). Behaviour as compiled: Save is hidden until something is typed in the search box. Verify against the original before porting.

### SupplierTeamGroups-Dk9m6lRm.js (~218 lines)
- **Purpose**: department dialog with modes new / edit / delete (`removing`) / set admin (`adminOnly`) / assign members (`membersOnly`) — lazy from SupplierAgents.
- **Imports**: index `C, G, X, Z, g, it, mt, rt, s, u, vt, y`.
- **API**: `POST /supplier-team-groups` / `PUT /supplier-team-groups/{id}` body `{name (trim, ≤100), adminUserId|null, memberIds (incl. admin), version|null, sourceVersions: {otherGroupId: version} for every group losing members}` (multi-row optimistic concurrency); `POST /supplier-team-groups/{id}/remove` `{version, targetGroupId|null, targetVersion}` (members move to target; "至少保留一个部门…" when no other group). Toasts 部门已删除 / 管理员已保存 / 成员分配已保存 / 部门已保存.
- **Rules**: admin must be an enabled member of this group (when admin required); admins of other groups can't be pulled in ("请先更换原部门管理员"); current members can't be unchecked (only moved elsewhere); member filter 全部 / INSIDE 已在本组 / OUTSIDE 未在本组 (default OUTSIDE in membersOnly mode); default delete target "交付组1".

### SupplierMemberGroupDialog-7u5cN2us.js (~89 lines)
- **Purpose**: "调整分组" move one member to another department.
- **Imports**: index `C, G, X, Z, g, it, mt, s, u, vt`.
- **API**: `PUT /supplier-team-groups/{targetId}` `{name, adminUserId, memberIds: target.memberIds ∪ {agent.id}, version: target.version, sourceVersions: {currentGroupId: version}}` (L30-37). Toast 成员分组已更新.
## Reports & analysis

### Reports-ChHNVTLt.js (~637 lines)
- **Purpose**: `#/reports` "报表中心" (nav perm `report.read`). Default export `RoleAwareReports` (L621-636, hand-patched): platform users with `report.read` but **without** `usage.read` and `settlement.read` see `../views/roles/OperationsReport.js` (out of scope, not in recovered/) instead of the business report `D`; platform users with `turnover.read` get a collapsible "手工营业额记录" `<details>` that lazily mounts Workbench `TurnoverRecords` when opened.
- **Imports**: `../views/roles/OperationsReport.js`; Workbench `TurnoverRecords`; index `$, A, C, G, X, Y, Z, c, d, g, h, m, mt, o, s, u, vt, x`; QueryFilters `i` (supplier directory with state APPROVED), `r`.
- **Tabs**: platform 经营概览 `overview` (default) / 每月应付 `monthly` / 供应商应收 `receivables`; supplier only `receivables` (default).
- **Filters**: 统计月份 from/to (custom month picker `E`, default **last 6 months**: from = current month − 5, to = current month, browser-local) → query `from=YYYY-MM-01`, `to=YYYY-MM-<last day>`; currency (''/USD/CNY/USDT); supplier (platform; APPROVED suppliers); project (`GET /projects?enabled=true&page=1&size=100` if `project.read`). Reset enabled when changed. Caption "按结算周期归属统计".
- **API**
  - `GET /reports/overview?from&to&currency&supplierId&projectId` → {summary[{currency, supplierCount, confirmedPayable, paidAmount, outstandingAmount, receivedAmount, settlementCount, disputedCount}], monthly[…], suppliers[…]}.
  - `GET /reports/monthly-payables?{q}` → {items[{month, currency, originalAmount, finalPayable, confirmedPayable, paidAmount, outstandingAmount, settlementCount, supplierCount}]}.
  - `GET /reports/supplier-receivables?{q}` → {items[{supplierId, supplierName, supplierCode, currency, receivableAmount, paidAmount, outstandingAmount, receivedAmount, unconfirmedReceiptAmount, unpaidCount, disputedCount, earliestUnpaidDate}]}.
  - Drill-down `GET /reports/settlements?from&to&currency&supplierId&projectId&scope=CONFIRMED|LIVE` → {items[{code, supplierName, projectName, periodStart, periodEnd, total, paidAmount, outstandingAmount, currency, state}]} (modal, "最多展示 200 张结算单"). Monthly row → scope LIVE for that month; supplier row → scope CONFIRMED.
  - **CSV export** (`report.export`, non-overview tabs): plain `<a href="/api/reports/export?report=MONTHLY_PAYABLES|SUPPLIER_RECEIVABLES&{q}" download="每月应付.csv|供应商应收.csv">` click (no fetch / no error handling) (L164-168).
- Requests are plain `$` with a cancel flag (not useApi; no polling). Overview shows per-currency summary cards, 月度应付趋势 (compact monthly table), 供应商应收排行 (top 10 by outstanding).


### DailyCreationAnalysis-MGRzns81.js (~603 lines) — **not imported by any recovered module or `src/runtime` file** (the `CcmaxResourceAnalysis` route now re-exports `../runtime/onboarding-statistics.js`, which calls `/reports/onboarding?…`). Treat as superseded unless confirmed otherwise.
- **Purpose**: CCMAX daily-creation analysis (trend chart + breakdowns + details).
- **Imports**: index `C, S, X, Z, _, c, d, g, h, mt, o, s, u, vt, x`; QueryFilters `r`; ccmaxAnalysis `c, f, i, l, n, o, s, t` and CcmaxDistribution `t` (out of scope); DateRangePicker `n` (presets), `t`.
- **Props**: `catalog` (supplier directory).
- **API**: `GET /reports/ccmax-resources?from&to&supplierId` (L281) → normalised by ccmaxAnalysis `l` into {days[{date,total,types,states}], details[{id,date,type,total,states}], types, states}; `total`, `from`, `to`.
- **UI/rules**: draft vs applied filter (查询/重置筛选/刷新; "筛选条件尚未应用"); default range = DateRangePicker preset[2] **近30天** (Beijing); preset shortcut buttons; stacked-bar SVG chart by types/states (click a day to filter); distributions; details as chart (ratio/count) or table, client paging default 20; statistics note: counts by Beijing success date.

## API docs, tokens, profile, account

### ApiDocs-BOQ6E5CN.js (~822 lines; ~117 KB — lines 29-30/42-43 are embedded OpenAPI JSON)
- **Purpose**: `#/api-docs` — static documentation for the supplier-facing **Open API** `/api/open/v1/ccmax/*` (Bearer API keys). Nav has no permission; hidden for `SUPPLIER_AGENT` (index 8441).
- **Imports**: `../runtime/ccmax-openapi.js` (`tightenCcmaxOpenApi`, out of scope); index `C, X, Z, b, g, h, i, mt, pt, s, vt, x`; lazy AccountDialogs `PersonalProfileDialog`.
- **Makes no backend calls itself.** The spec object (zh `p` / en `m`, v1.1.0, "9类、21个Bearer接口") is passed through `tightenCcmaxOpenApi(spec, locale)` (L44) — the runtime transform may add/alter paths: the label map `E` (L121-146) also names `GET /capabilities`, `GET /resources/{resourceId}/operations/{id}`, `POST …/operations/{id}/reconcile` which are **not** in the raw embedded JSON (likely injected by the runtime; unverified).
- Raw documented operations (extracted from L29): GET `/projects`, GET `/proxies`, POST `/proxies/import`, POST `/submissions/credentials`, POST `/submissions/oauth/authorize`, POST `/submissions/oauth/complete`, GET `/submissions/{id}`, POST `/submissions/{id}/cancel`, GET `/resources`, GET `/resources/{id}`, GET `/daily-summary` (`?quoteId=`), GET `/intake`, POST `/proxy-replacements`, GET `/proxy-replacements/{id}`, POST `/proxy-replacements/{id}/reconcile`, GET/POST `/resources/{resourceId}/credential-refresh`, GET `/resources/{resourceId}/reauthorizations/current`, POST `/resources/{resourceId}/reauthorizations`, PUT/GET `/resources/{resourceId}/reauthorizations/{id}` (all under `/api/open/v1/ccmax`).
- **UI**: toolbar (version, count, 下载 OpenAPI → Blob download `ccmax-openapi.json` / `ccmax-openapi.en.json`, 管理 API 密钥 → PersonalProfileDialog `initialTab:'tokens'`); tabs 快速开始 / 接口说明 / 权限与重试. Endpoint view: grouped index (`T` groups capabilities, projects, proxies, submissions, resources, proxy-replacements, credential-refresh, reauthorizations, operations, daily-summary, intake), description `D`, required permission text `A(e)` (L243-265), request-field table from parameters+requestBody schema (depth ≤2, `$ref` resolved), generated cURL (`L`, placeholders), response fields (hides `payableTotal` for SUPPLIER_AGENT), example JSON (`z`). Rules tab: error table 400/401/403/404/409/410/502-503, retry guidance (keep requestKey/sessionId; never re-key).
- Port as static content; preserve the permission strings and the agent-specific `payableTotal` omission.

### ApiTokens-uH0R0C-_.js (~307 lines)
- **Purpose**: API key management. Exports `ApiTokens({userId?})` (own keys when no userId; admin viewing another user's keys from Users page, out of scope) and `ApiTokensDialog({userId, username, onClose})`. Rendered in AccountDialogs `PersonalProfileDialog` tab "API 密钥" (and Users page).
- **Imports**: index `C, G, P, S, X, Y, Z, g, h, mt, o, rt, s, vt`.
- **API** (base `v` = `/auth/api-tokens` or `/users/{userId}/api-tokens`):
  - `GET {base}` → [{id, name, tail, enabled, expiresAt, lastUsedAt, revealable}].
  - `POST {base}` `{name (≤100, required), days}` → {key} (issue; shown once).
  - `POST {base}/{id}/reset` `{days}` → {key}; `POST {base}/{id}/revoke` `{}`; `POST {base}/{id}/reveal` `{}` → {key} — reveal only for `role==='ADMIN' && !supplierId && has('system.users')` and `revealable` and not expired.
- **Rules**: expiry presets 7/30/90 (default)/365 days or custom integer 1–365; "active" = enabled && (no expiresAt || expiresAt > now); 历史密钥 toggle shows inactive ones; secret dialog with show/hide + clipboard copy; "仅本次展示，请复制保存。" (not shown for admin reveal); "新建密钥" hidden when viewing another user. Help snippet shows `POST {origin}/api/channel/` with Bearer header (as written in source).

### AccountDialogs-DkF7YQod.js (~270 lines)
- **Purpose**: account dialogs used by the app shell (index 8806-8812: PasswordDialog, PersonalProfileDialog), ApiDocs, Suppliers/SupplierDetail/Users (CredentialDialog).
- **Imports**: index `$, G, X, Z, g, h, i, it, l, mt, nt, rt, s, vt, x`; lazy ApiTokens.
- **Exports**:
  - `PersonalProfileDialog({onClose, onSaved, initialTab='profile'})`: tabs 基本资料 / API 密钥. `GET /auth/profile` → {username, displayName, personalEmail, personalPhone, version}; `PUT /auth/profile` `{displayName (trim, required, ≤100), personalEmail (email, ≤160), personalPhone (tel, ≤60), version}` → saved profile passed to `onSaved` (shell then updates `displayName`, toast 个人信息已更新).
  - `PasswordDialog({forced, onClose, onChanged})`: `GET /auth/password-policy` → {passwordMinLength, passwordMaxLength, requireUpper, requireLower, requireDigit, requireSymbol}; `POST /auth/password` `{currentPassword, newPassword}`; client check "两次输入的新密码不一致"; `forced` (mustChangePassword) cannot be dismissed, offers 退出登录 (index `nt` → `POST /auth/logout`). Submit label 保存并重新登录.
  - `CredentialDialog({value:{username, initialPassword}, onClose})`: one-time initial password display.


### MySupplierProfile-DPM4wUP0.js (~637 lines)
- **Purpose**: export `MySupplierOverview({supplier, supplierId})` — supplier's own profile page body (lazy from **Suppliers** page, out of scope; i.e. `#/suppliers` for a supplier user, nav label 维护资料). Three panels: profile, payout accounts, qualification documents.
- **Imports**: index `C, P, S, T, X, Y, Z, a, at, d, g, h, it, k, l, mt, o, rt, s, u, vt`; Suppliers (out of scope) `a` (cycle label fn), `o` (bank name for accountType), `r` (cycle options), `s` (isUsdtAccountType).
- **Profile `D`** (L34-272): view DetailGrid or edit form. `PUT /suppliers/{id}` `{name, registrationNo ('' if none), supplierType (unchanged), country, contact, phone, email (trim or ''), cycle, customCycleDays (Number when cycle==='CUSTOM', else null), version}` (L69-79) → toast "资料修改已提交审核" (goes through review). Edit only with `supplier.write` and no `pendingProfile`. Fields: 主体名称*, 主体类型 (fixed: INDIVIDUAL 个人 / COMPANY 企业), 企业注册编号* (COMPANY), 国家/地区*, 联系人*, 联系电话, 电子邮箱 (email), 结算周期 select, 每隔多少天结算 (CUSTOM, 1–365). Notices: pendingProfile (amber), disabled supplier, REJECTED with reviewNote; status badge `profileReviewState || state`; 最近更新 `updatedAt`.
- **Payout accounts `O`** (L274-544): `GET /accounts?supplierId={id}` (if `account.read`) → [{id, bank, holder, accountType BANK|OKX_USDT|BINANCE_USDT, providerCode, currency, transferType ONCHAIN|INTERNAL_UID, network, walletType, lastFour, state, replacesId, reviewNote}]. `POST /accounts` `{supplierId, holder (trim), bank (derived from accountType), accountNumber (trim, 3–300), currency, accountType, transferType (USDT types only), network (USDT+ONCHAIN), walletType (USDT+ONCHAIN: PRIVATE|EXCHANGE), replacesId (null for new / old id for change)}` → toast 收款账户已提交审核. Rules: new/change needs `account.write` and supplier enabled; change only for APPROVED with no pending replacement; holder defaults to supplier name and must match entity name (per hint); BANK (空中云汇/Airwallex beneficiary ID) currencies CURRENCIES, USDT types force USDT; Binance only ONCHAIN; OKX ONCHAIN or INTERNAL_UID. Full numbers never echoed (only `lastFour`). Display name via index `k`.
- **Documents `k`** (L546-620): `GET /documents?supplierId={id}` → [{id, name, bytes, createdAt}]; upload via index `at` → `POST /documents` multipart (category QUALIFICATION) if `file.write`, accept PDF/PNG/JPEG (hint ≤10 MB; size not checked client-side); download link `/api/documents/{id}/download`.
## (a) Deduplicated API endpoint table

All paths are relative to `/api` (the shared client prefixes it). "poll" = auto-refresh interval used by at least one caller. Modules: short names without hash. `{x}` = path param (always `encodeURIComponent`-ed except a few noted in module sections). Runtime = `src/runtime/*.js` (outside `recovered/`, listed only where Resources depends on them).

### Auth / account
| Method | Path | Used by |
|---|---|---|
| GET | `/auth/csrf` (raw fetch, cached) | index client (all non-GET) |
| GET / PUT | `/auth/profile` | AccountDialogs |
| GET | `/auth/password-policy` | AccountDialogs |
| POST | `/auth/password` | AccountDialogs |
| POST | `/auth/logout` | AccountDialogs (via index `nt`) |
| GET | `/auth/registration-policy` | SupplierAgents |
| GET / POST | `/auth/api-tokens` | ApiTokens |
| POST | `/auth/api-tokens/{id}/reset` · `/revoke` · `/reveal` | ApiTokens |
| GET / POST (+ `/{id}/reset|revoke|reveal`) | `/users/{userId}/api-tokens` | ApiTokens (admin mode) |

### Workbench / notifications / turnover
| Method | Path | Used by |
|---|---|---|
| GET | `/workbench` | Workbench |
| GET | `/workbench/tasks` | Workbench |
| POST | `/notifications/{id}/read` | Workbench |
| GET / POST | `/turnover` | Workbench (TurnoverRecords; also shown in Reports) |

### Suppliers / projects / documents / payout accounts
| Method | Path | Used by |
|---|---|---|
| GET | `/suppliers?page&size&state&search` | QueryFilters (all-pages loader → Quotes, SettlementManagement, DailyAccounting, OutboundProxies, Reports, Current/DailyCreation analyses), NewDelivery (page 1 only) |
| PUT | `/suppliers/{id}` | MySupplierProfile |
| GET | `/projects?size=100` / `?page=1&size=100` / `?enabled=true&page=1&size=100` | Quotes, SettlementManagement, DailyAccounting, Reports, ResourceForm, ResourceDetail, Resources |
| GET | `/projects/category-codes` | Resources |
| GET / PUT | `/projects/{id}/intake-channel-types` | IntakeProjectTypes |
| GET | `/documents?supplierId` | MySupplierProfile |
| POST | `/documents` (multipart supplierId, category QUALIFICATION/PAYMENT_PROOF, file) | MySupplierProfile, usePaymentEvidence (index `at`) |
| GET | `/documents/{id}/download` (direct link) | PaymentsTab, MySupplierProfile |
| GET / POST | `/accounts?supplierId` / `/accounts` | MySupplierProfile |

### Quotes
| Method | Path | Used by |
|---|---|---|
| GET | `/quotes?search&supplier&project&pricingType&currency&state&onDate&page&size` (poll 15 s) | Quotes |
| POST | `/quotes` | Quotes |
| GET / PUT | `/quotes/{id}` | Quotes, ApprovedQuoteRejection (GET), Resources (GET, `?quoteId` deep link) |
| GET | `/quotes/multiplier-bounds` | Quotes |
| GET | `/quotes/ranking?projectId&currency&onDate&sortBy&sortDirection` | QuoteRankingResults |
| POST | `/quotes/{id}/review` `{approved,note}` | Quotes |
| POST | `/quotes/{id}/withdraw` | Quotes |
| POST | `/quotes/{id}/reject-approved` `{note}` | ApprovedQuoteRejection |
| GET / POST | `/quotes/{id}/period-change` | QuotePeriodPanel |
| POST | `/quotes/{id}/period-change/review` | QuotePeriodPanel |

### Exchange rates
| Method | Path | Used by |
|---|---|---|
| GET | `/exchange-rates/current` (poll 30 s in Quotes) | Quotes, Workbench, ExchangeRatesTab (supplier), PaymentForm |
| GET / POST | `/exchange-rates?search&page&size` / `/exchange-rates` | ExchangeRatesTab |
| POST | `/exchange-rates/{id}/enabled` `{enabled,version,note}` | ExchangeRatesTab |

### Settlements
| Method | Path | Used by |
|---|---|---|
| GET | `/settlements/summary?currency` | SettlementManagement |
| GET | `/settlements/pending-summary?{filters}&currency` | SettlementManagement |
| GET | `/settlements?search&supplierId&currency&state&paymentProgress&periodStart&periodEnd&page&size` | SettlementManagement |
| POST | `/settlements/preview` and `/settlements/preview?page&size` | SettlementManagement |
| POST | `/settlements` (with `expectedSnapshotHash`) | SettlementManagement |
| POST | `/settlements/export?{filters}` `{ids}` → CSV | SettlementManagement (index `tt`) |
| GET | `/settlements/{id}/export` → CSV | SettlementManagement, SettlementDetail (index `et`) |
| GET | `/settlements/{id}?page&size` | SettlementDetail; PaymentsTab (re-apply, no paging) |
| POST | `/settlements/{id}/confirm` · `/void` · `/withdraw` · `/adjustments` | SettlementDetail |
| GET | `/settlement-batches/candidates?periodStart&periodEnd` | SettlementBatch |
| GET | `/settlement-batches?view={n}` (poll 5 s) | SettlementBatch |
| POST | `/settlement-batches/preview` | SettlementBatch |
| GET | `/settlement-batches/{id}` (poll 1 s→2 s while QUEUED) | SettlementBatch |
| POST | `/settlement-batches/{id}/start` · `/retry-preview` | SettlementBatch |
| GET | `/settlement-batches/{id}/items/{itemId}/preview?page&size` | SettlementBatch → SettlementPreview |
| GET | `/settlement-inputs?search&state&page&size` | SettlementInputs |
| POST | `/settlement-inputs/manual` · `/manual-direct` | SettlementInputs (ReceiveAmountModal) |
| POST | `/settlement-inputs/{id}/void` | SettlementInputs |
| POST | `/settlement-inputs/{id}/confirm` `{version}` | DailyAccounting |

### Daily accounting / supplier bills / reports
| Method | Path | Used by |
|---|---|---|
| GET | `/accounting/daily/summary?{filters}` (2.5 s while summaryUpdating) | DailyAccounting |
| GET | `/accounting/daily/groups?{filters}&page&size&groupBy[&sortBy&sortDirection]` | DailyAccounting |
| GET | `/accounting/daily?{filters}&page&size&includeSummary=false` | DailyAccounting |
| GET / POST | `/accounting/daily/exports` | DailyExports |
| GET | `/accounting/daily/exports/{id}` and `/{id}/download` (raw fetch → blob) | DailyExports |
| GET | `/supplier-bills/filters` · `/days` · `/creators` · `/departments` · `/entries` (client adds `billView=consumption-v2`, no-store; poll 60 s when today & unfiltered) | SupplierBills |
| GET | `/reports/overview` · `/monthly-payables` · `/supplier-receivables` · `/settlements` | Reports |
| GET | `/reports/export?report=MONTHLY_PAYABLES|SUPPLIER_RECEIVABLES&…` (anchor download) | Reports |
| GET | `/reports/ccmax-resources?from&to&supplierId` | DailyCreationAnalysis (unreferenced) |
| GET | `/reports/ccmax-resources/current?supplierId` | CurrentResourceOverview (unreferenced) |

### Payments
| Method | Path | Used by |
|---|---|---|
| GET | `/payments?page&size&settlementId` | PaymentsTab |
| GET | `/payments/{id}` | PaymentsTab |
| POST | `/payments/offline` | PaymentForm |
| POST | `/payments/{id}/review` · `/receipt` · `/close` · `/offline-record` · `/reconcile` | PaymentsTab |

### Resources / deliveries
| Method | Path | Used by |
|---|---|---|
| GET | `/deliveries?{filters}&page&size&summaryOnly=true` (poll 10 s) | Resources |
| GET | `/deliveries/filter-options?assignment&supplierSearch&creatorSearch` | Resources, IntakeReviewDialog, PrioritySupportDialog |
| GET | `/resources/submission-capabilities[?resourceId]` | Resources (+access hook), ResourceForm, OutboundProxies, runtime ccmax-native (poll 30 s) |
| GET | `/resources/eligible-projects` | ResourceForm, ResourceDetail, CcmaxBatchDelivery, Resources |
| GET | `/resources/summary?{q}` · `/creator-summary?{q}` · `/failure-reasons?{q}` (poll 30 s) | Resources |
| GET | `/resources/overview?{q}` (poll 10 s / 30 s, when expanded) | CcmaxResourceOverview |
| GET | `/resources?page=1&size=100[&search]` | runtime newapi-channel / ccmax-native link dialogs |
| GET / PUT / DELETE | `/resources/{id}` (`DELETE ?version=`) | ResourceForm, ResourceDetail, Resources, runtime |
| POST | `/resources/drafts` | ResourceForm |
| POST | `/resources/{id}/submit` `{version}` | ResourceForm, ResourceDetail |
| POST | `/resources/supplier-submit` `{requestKey,input}` | ResourceForm |
| GET | `/resources/submissions/{requestKey}` | ResourceForm |
| POST | `/resources/oauth/supplier-authorize` · `/oauth/supplier-submit` | ResourceForm |
| GET / POST | `/resources/oauth/supplier-session/{id}` / `…/{id}/cancel` | ResourceForm |
| POST | `/resources/{id}/oauth/supplier-authorize` · `/oauth/supplier-submit` | ResourceForm |
| POST | `/resources/{id}/oauth/supplier-retry` `{version}` | ResourceDetail, Resources |
| POST | `/resources/{id}/oauth/authorize` · `/oauth/complete` · `/dispatch` | ResourceDetail |
| GET | `/resources/{id}/dispatches` | ResourceDetail |
| POST | `/resources/{id}/usage` | Resources, runtime newapi-channel |
| POST | `/resources/{id}/creation-recovery` | Resources |
| GET / POST | `/resources/{id}/credential-refresh` | Resources, runtime ccmax-native |
| GET | `/resources/{id}/reauthorizations/current` | Resources, runtime ccmax-native |
| POST | `/resources/{id}/reauthorizations` `{version,mode}` | Resources, runtime |
| GET / PUT | `/resources/{id}/reauthorizations/{reauthId}` | Resources (runtime uses POST for submit — see runtime file) |
| POST | `/resources/ccmax/batch` | CcmaxBatchDelivery (dialog currently unreachable) |
| POST | `/resources/{id}/upstream-channel` · `/upstream-account` · `/{action}` · `/operations/{opId}/reconcile` | runtime newapi-channel / ccmax-native |
| GET | `/resource-targets` | ResourceDetail, runtime link dialogs |
| GET | `/resource-targets/{id}/accounts?page&search` | runtime ccmax-native |
| GET | `/resource-intakes/{id}` · `/{id}/eligible-projects` | Resources |
| POST | `/resource-intakes/{id}/original-request` · `/{id}/material` · `/{id}/assign-project` | Resources |
| POST | `/resource-intakes/recognize` · `/resource-intakes/preview` · `/resource-intakes` | NewDelivery |
| GET / POST | `/resource-lifecycle-jobs` (POST via runtime lifecycle-intent) | ResourceLifecycleDialog (GET list), Resources (POST) |
| GET | `/resource-lifecycle-jobs/{id}` (poll 3 s while RUNNING) · `/by-request/{requestKey}` | ResourceLifecycleDialog, runtime lifecycle-intent |
| POST | `/resource-lifecycle-jobs/{id}/reconcile` | ResourceLifecycleDialog, runtime |
| GET / POST | `/resource-proxy-replacements` (GET poll 5 s, `scope=mine|all`) | Resources |
| GET | `/resource-proxy-replacements/proxy-options?resourceId&search&page&size` | Resources |
| GET | `/resource-proxy-replacements/{id}` (poll 3 s until terminal) | Resources |
| POST | `/resource-proxy-replacements/{id}/reconcile` | Resources |

### Outbound proxies
| Method | Path | Used by |
|---|---|---|
| GET | `/outbound-proxies/page?page&size&search&state&protocol[&supplierSearch]` | OutboundProxies |
| GET | `/outbound-proxies/options?page&size=100` (all pages) | useDeliveryProxies → ResourceForm, CcmaxBatchDelivery |
| GET / PUT | `/outbound-proxies/{id}` | ResourceForm (GET), OutboundProxies (PUT) |
| POST | `/outbound-proxies` · `/outbound-proxies/import` | OutboundProxies |
| POST | `/outbound-proxies/resolve` `{url}` | ResourceForm |
| POST | `/outbound-proxies/{id}/test` | OutboundProxies |
| GET | `/outbound-proxies/{id}/resources` | OutboundProxies |

### CC intake / priority
| Method | Path | Used by |
|---|---|---|
| GET | `/cc-intake/mine` (poll 30 s) | IntakeToday |
| GET / PUT | `/cc-intake/allocations` | IntakeAllocationDialog |
| GET | `/cc-intake/admin/reviews?page&size&supplierId` | IntakeReviewDialog |
| POST | `/cc-intake/admin/reviews/{dispatchId}/resolve` | IntakeReviewDialog |
| GET / PUT | `/cc-intake/admin/system` | IntakePolicyPanel |
| GET / PUT | `/cc-intake/admin/suppliers/{id}` and `/cc-intake/admin/suppliers/{id}/members/{memberId}` | IntakePolicyPanel |
| GET | `/cc-intake/admin/suppliers/{id}/members` | IntakePolicyPanel (MemberPrioritySettings) |
| GET | `/cc-intake/admin/priority/jobs` · `/{id}` | PriorityBatchDialog |
| POST | `/cc-intake/admin/priority/jobs/{id}/reconcile` | PriorityBatchDialog |
| GET / PUT | `/system/scheduled-tasks/{taskKey}/rotation-settings` | PrioritySupportDialog (unreferenced) |
| POST | `/system/scheduled-tasks/priority-support` · `/{taskKey}/rotation-settings/retry-restore` | PrioritySupportDialog (unreferenced) |

### Team
| Method | Path | Used by |
|---|---|---|
| GET / POST | `/supplier-agents` | SupplierAgents |
| PUT | `/supplier-agents/{id}/enabled` | SupplierAgents |
| POST | `/supplier-agents/{id}/password` `{password:''}` | SupplierAgents |
| GET / PUT | `/supplier-agents/{id}/projects` | SupplierAgents |
| GET / POST | `/supplier-team-groups` | SupplierAgents, SupplierTeamGroups |
| PUT | `/supplier-team-groups/{id}` | SupplierTeamGroups, SupplierMemberGroupDialog |
| POST | `/supplier-team-groups/{id}/remove` | SupplierTeamGroups |

### Documented only (ApiDocs — Open API for API keys, not called by the UI)
`/api/open/v1/ccmax/…` — 21 operations listed in the ApiDocs section.
## (b) Shared UI / behaviour patterns to build once

1. **API client + `useApi(path|null, pollMs)` composable** (index `$`/`rt`/`it`/`S`). Must keep: `/api` prefix, `Accept-Language`, CSRF header on non-GET (token from `/api/auth/csrf`, re-fetched after 401), `ApiError{status, details{code, traceId, creationNotStarted, resourceId, operationId}}`, `hub:unauthorized` / `hub:password-required` events, **`billView=consumption-v2` + no-store for GET `/supplier-bills/*`**, 15 s timeout, `X-Hub-Background: 1` on background polls, pause while `document.hidden`, refresh on visibility, `mutate()` and `reload()`, null path = disabled, keep previous data while refreshing (`refreshing` vs `loading`). Global `refresh()` from app context re-runs all queries (`epoch`).
2. **Server-message localisation** (`ot`/`st`) — every displayed server error/notice passes through it.
3. **Money & decimals**: `formatMoney` (BigInt half-up, 2 dp, JPY 0 dp, thousands sep), `<MoneyDisplay>` (≈ marker, "< 0.01", click to reveal exact), decimal add/sub/compare/multiply helpers, percent⇄multiplier string shifting (`ct`/`lt`/`F`), discount formatting (`80折` / `80%`), currency conversion over a rate graph. **Never use floats** — the only float uses in the source are Workbench balance (L710) and turnover chart aggregation (L204-212), plus SupplierBills/agents counts.
4. **Beijing-time date utilities**: today (`j`), yesterday, month end, date/time formatting with `timeZone:'Asia/Shanghai'` (resourceHelpers `p`, SettlementManagement `t`, quoteHelpers `t`, DailyAccounting `se`, CcmaxResourceOverview tooltips, SettlementBatch PDF). Note a few defaults use browser-local dates (index `U` in SettlementInputs, Reports month range, DateRangePicker grid, datetime-local deadline conversion).
5. **DataTable** (columns `{label, render, className, ariaSort}`, skeleton rows sized to previous height, error+retry, refreshing badge, clickable rows with keyboard), **Pagination** (sizes 10/20/50/100, jump-to page, total cached per `queryKey` while loading), **TableScroll**.
6. **Mobile card list** alternative for wide tables (Resources `st`, `useIsMobile` ≤767 px) and **QueryFilters** shell (mobile filter dialog, applied-filter chips with per-chip clear, reset).
7. **Select/dropdown** with search (`onSearchChange` for server search), visual variants (supplier/project/currency/user), tones, multi-select (`selectedValues`, `onSelectAll`, `onClearSelection` — PrioritySupportDialog), disabled options. **FilterSelect** wrapper with loading/error labels and "已选X" for unknown values.
8. **Supplier directory loader** (all pages of `/suppliers`, size 100) and **server-search supplier select with 300 ms debounce + label cache** (SettlementManagement `Se`, Resources filter options).
9. **Debounced search** hook (300 ms; 250 ms in proxy picker; empty applies immediately) and "draft vs applied filters" forms with an "未应用" status line (DailyAccounting, CurrentResourceOverview, DailyCreationAnalysis).
10. **DateRangePicker** (two-month, presets 当日/近7天/近30天/本月, `minDate`, `fromLocked`) and **MonthPicker** (Reports).
11. **Dialog / Drawer** (native `<dialog>`, wide, drawer with outside-click close, focus restore, busy-guarded close), **FormModal** (declarative fields with sections, `visible`, `clearOnChange`, `valuesOnChange`, required select validation "请选择{label}", secondary submit, `extra(values)` slot, error notice, in-flight lock), **anchored confirm popover** (Resources `Pe`).
12. **ReviewBox** (approve/reject with comment, optional confirmation dialog) — used for quotes, quote period changes, payments, settlement confirmation; always paired with a **four-eyes check** (`submittedBy/createdBy !== currentUser.id`).
13. **StatusBadge** with a global state→label map (index `nt`) and per-domain label maps (quote states, settlement states, resource lane/dispatch/import/creation states, lifecycle, proxy replacement, reauthorization, export jobs).
14. **Notice** (tones blue/amber/red/orange/green), **EmptyState**, **LoadingState**, **DetailGrid** (`[[label, value]]`, empty → `—`), **PageActions** header, **Tabs**, **FilterToolbar**, **Button** (variants primary/secondary/danger/danger-quiet/ghost, icon).
15. **Idempotent write pattern**: client `requestKey = crypto.randomUUID()` per logical intent, reused on retry, regenerated only when the input fingerprint changes (settlement create/preview, batches, adjustments, payments, dispatch, OAuth authorize, CCMAX batch rows, proxy replacement, intake assign, exports, credential refresh `requestId`). Persist pending intents where page reloads matter (sessionStorage `supplier:pending-submission:{userId}`, `hub:ccmax-batch-result`).
16. **Optimistic concurrency**: send `version` on mutating calls of versioned entities (settlements, payments, exchange rates, resources, proxies, team groups incl. `sourceVersions` map, allocations incl. per-group versions, intake policies, supplier agents, personal profile, supplier profile). Quote create/edit and period-change bodies carry **no** version; `expectedSnapshotHash` for settlement previews. No explicit 409 handling exists client-side — errors are shown via the localised server message (409 documented in ApiDocs as "幂等内容、版本或业务状态冲突").
17. **"Unknown outcome" UX**: never auto-retry writes whose result is unknown; show amber "结果尚未确认…勿重复提交" and offer "查询原操作 / 刷新交付结果 / 重新核对" (ResourceForm, ResourceDetail, lifecycle intent, proxy replacement, credential refresh, reauthorization, PriorityBatch, payments reconcile).
18. **Polling job-progress dialogs** (poll until terminal state, then call `onChanged` once, manual reconcile button): ResourceLifecycleDialog (3 s), proxy replacement progress (3 s), reauthorization (3 s), settlement batch (1 s→2 s, 5 s on error), summary refresh (2.5 s while `summaryUpdating`).
19. **File handling**: blob download helper (`URL.createObjectURL` + anchor + revoke after 1 s) for CSV/XLSX/OpenAPI; direct `/api/documents/{id}/download` links; multipart upload to `/documents`; client-side file validation (size/type/UTF-8/JSON shape) in NewDelivery, CcmaxBatchDelivery, usePaymentEvidence; printable PDF via `window.open` + DOM building (SettlementBatch).
20. **Rich-text evidence editor** (contentEditable → JSON doc tree, safe renderer) — PaymentForm/PaymentsTab.
21. **Proxy combobox** (resourceHelpers `k`) — capacity-aware options, paste-new-URL mode, incremental rendering.
22. **One-time secret display** (initial passwords, API keys): show once, copy button, amber warning (SupplierAgents `E`, AccountDialogs `CredentialDialog`, ApiTokens).
23. **Clipboard copy with toast** fallback message "复制失败…手动复制" (ResourceForm, ResourceDetail, Resources, ApiDocs, ApiTokens).
24. **Permission gating helper** `has(perm)` + role checks (`ADMIN`, `SUPPLIER`, `SUPPLIER_AGENT`, `teamAdminGroup`), plus per-record `readOnly`, `editable`, `testable`, `canVoid`, `revealable` flags from the server.
25. **Deep links via hash query** (`?id=`, `?review=change`, `?tab=`, `?settlementId=`, `?quoteId=`) read once on mount, and navigation helper with route whitelist.
## Appendix A — index-Dnr0i-H9.js alias legend (resolved for reading convenience)
Export statement at index-Dnr0i-H9.js:8816. Definitions verified by reading index lines 5680–7800.

| alias | local | meaning (index line) |
|---|---|---|
| `$` | fe | `api(path, init)` raw fetch: prefixes `/api`, sets `Accept-Language`, JSON content-type, CSRF header for non-GET (token from `GET /api/auth/csrf`, cached), throws `ApiError` (5853). **GET paths starting `/supplier-bills/` get `billView=consumption-v2` appended + `cache:no-store` (5860-5865).** 401 → dispatch `hub:unauthorized`; `code===PASSWORD_CHANGE_REQUIRED` → `hub:password-required`. Error details: code, traceId, creationNotStarted, resourceId, operationId (5880-5886) |
| `rt` | pe | POST JSON (5889) |
| `it` | me | PUT JSON (5893) |
| `Q` | ue | `ApiError` class {status, details} (5836) |
| `S` | _t | `useApi(path|null, pollMs=0)` → {data,error,loading,refreshing,mutate(fn),reload()}; 15 s timeout, background polls send `X-Hub-Background: 1`, pauses while `document.hidden`, re-fetches on visibilitychange if polling (6585) |
| `C` | gt | `useApp()` context: `{has(perm), user, refresh, notify(msg, error?), epoch, …}` (6583) |
| `mt` | S | i18n `t(key, args[])` with `{0}` placeholders, `|one` plural (5697) |
| `gt` | ee | i18n literal lookup (5703) |
| `ht` | C | i18n with context `ctx::text` (5707) |
| `ot` | k | translate server error/message (regex table) (5781) |
| `st` | A | translate server msg, fallback "上游错误（参考 HASH）" (5821) |
| `pt` | v | current locale (`zh-CN`/`en-US`) |
| `A` | at | `formatMoney(value, currency)` BigInt half-up, 2 dp (JPY 0), thousands sep (6512) |
| `N` | ot | `multiplyMoney(a,b,currency)` 12-dp BigInt, rounds to 2 dp (6518) |
| `V` | ct | `subtractMoney(a,b,currency)` (6533) |
| `M` | lt | `compareDecimal(a,b)` −1/0/1 (6538) |
| `H` | st | `sumDecimal(values, scale=9)` trailing zeros trimmed (6526) |
| `ct` | ae | shift decimal point +2 (multiplier 0.8 → "80") (5733) |
| `lt` | D | shift decimal −2 (5734) |
| `F` | Ge | shift decimal −2 (ratePercent→multiplier) (6417) |
| `ut` | O | format discount: `80折` (zh) / `80%` (en) from multiplier (5736) |
| `dt` | ce | quote price display: unitPrice ‖ discount(multiplier) ‖ discount(ratePercent/100) ‖ `—` (5777) |
| `ft` | se | `convertCurrency(amount, from, to, rates[])` direct/inverse/one-hop via rates {baseCurrency,quoteCurrency,rate}; BigInt half-up 2 dp; null if no path (5746) |
| `T` | tt | `CURRENCIES = ['USD','CNY','USDT']` (6471) |
| `j` | $e | today in **Asia/Shanghai** `YYYY-MM-DD` (6457) |
| `U` | Qe | today in browser-local `YYYY-MM-DD` (6452) |
| `P` | ut | format datetime `MM-DD HH:mm` locale, 24h (6544) |
| `z` | dt | settlement payment state: CONFIRMED→PAID/PARTIAL/UNPAID by paidAmount vs total (6554) |
| `k` | et | payout account display name (OKX/Binance/Airwallex/bank) (6468) |
| `O` | Ke | settlementMethod labels QUOTA/ACCOUNT_BUYOUT/LEGACY (6420) |
| `E` | qe | deliveryMethod labels ACCOUNT/KEY/RELAY/LEGACY (6425) |
| `w` | Je | capacityType labels ACCOUNT_COUNT/ACCOUNT_QUOTA/THROUGHPUT (6431) |
| `D` | ft | credential type labels REFRESH_TOKEN/ACCESS_TOKEN/SESSION_KEY/OAUTH (6557) |
| `W` | pt | `isValidProxyUrl` socks5/http/https://[user:pass@]host:port (6564) |
| `B` | Xe | read query param from `location.hash` (6443) |
| `I` | Ze | navigate to hash route (whitelisted routes) (6447) |
| `L` | Ye | notification body localiser (6437) |
| `R` | mt | notification title localiser (6579) |
| `et` | ve | download `/settlements/{id}/export` → `settlement-{id}.csv` (5929) |
| `tt` | ye | POST `/settlements/export?{query}` body `{ids}` → `settlements.csv` (5932) |
| `at` | _e | upload doc: POST `/documents` multipart {supplierId, category='QUALIFICATION', file} (5922) |
| `nt` | ge | logout POST `/auth/logout` |
| `n` | un | settlement tabs for user (daily/departments/statements/inputs/payments/rates) with permission rules (7758) |
| `t` | dn | resolve settlement tab from `?tab=` (7789) |
| `r` | ln | `useIsMobile()` (max-width 767px) |
| `i` | L | Vite preload / lazy import helper |
| `Z` / `X` / `vt` | React / jsx-runtime / `__toESM` interop |
| `_t` | s | esbuild `__export` helper (module namespace `t`) |
| UI components | | `s`=Button(variant,icon) · `o`=StatusBadge(state,label) · `u`=Select dropdown(options,value,onChange,searchable) · `a`=CompanyAvatar · `d`=EmptyState(text,error) · `h`=LoadingState · `g`=Notice(tone) · `m`=PageActions header · `x`=Tabs(items{id,label,count}) · `f`=FilterToolbar(children,actions) · `b`=TableScroll · `c`=DataTable(columns{label,render,className},data,loading,refreshing,error,onRetry,onRow) · `_`=Pagination(data.total,page,size∈{10,20,50,100},jump) · `y`=SearchInput · `p`=FormModal(fields[],initial,onSubmit,secondarySubmit,extra; validates required selects "请选择{label}") · `l`=DetailGrid([[k,v]]) · `v`=ReviewBox(onReview(approve,comment), approveConfirmation) · `G`=Dialog(title,subtitle,wide,drawer) · `Y`=Icon · `J`=BrandLogo · `q`=LanguageSwitcher · `K`=portal |

Route table (index 7675-7685): `workbench`→Workbench, `quotes`→Quotes, `settlements`→Settlements, `deliveries`/`deliveries-pending`→Resources{supplierSide:true,pendingOnly}, `resources`/`resources-pending`→Resources{supplierSide:false,pendingOnly}, `outbound-proxies`→OutboundProxies{platform:!supplier}, `supplier-agents`→SupplierAgents, `reports`→Reports, `api-docs`→ApiDocs. Nav permissions (index 8159-8224): workbench.read, quote.read, settlement.read, resource.read (deliveries/resources), proxy.read, supplier.agent.manage, report.read, api-docs (no perm; hidden for SUPPLIER_AGENT; 8441), outbound-proxies only if `connectionFeatures.supportsProxy===true`.
