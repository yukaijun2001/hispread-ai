# Supplier frontend evidence domain analysis

Evidence root: `/Users/yukaijun/account-booster/evidence/前端`.

This report is a static reconstruction specification. It does not claim that private backend implementation or live mutations were observed. The evidence is a Vite production build, version `0.8.122`, with React JSX runtime imports, beautified into reconstructed domain folders. It is **not original Vue source**. A Vue implementation must translate the recovered component behavior and preserve the verified CSS class names, layout, assets, route strings and API contracts.

## Coverage and source hierarchy

51 domain JavaScript files / 21,667 physical `wc -l` lines / 747,022 bytes were inventoried and processed for component schemas, visible labels, API call contexts, fields and classes. Primary supplier paths and complex request transitions were read in detail. Auxiliary platform-only components were inspected statically through function/field/request/render schemas; they are not evidence of supplier-visible permissions. No production write action was performed. Related CSS examined: index, SupplierAgents, SupplierBills, Resources, NewDelivery, intake. Other scoped CSS is carried in `raw/assets` and should be reused directly when its corresponding view is implemented. Runtime geometry and account-specific records must be corroborated by the parent browser/REA pass.

`src/core/index.js` is the shared implementation, while `api/API-CONTRACT.md`, `api/ROUTES.md`, `api/endpoints_by_file.json` provide inventories. They are helpful indexes; actual component requests are authoritative for fields and methods.

## Routes and supplier account behavior

Hash routing uses the first route component of `#/route?parameters`. `tasks` normalizes to `workbench`, `ops` to `resources`. The original root shell chooses supplier mode from `!!user.supplierId`; team member mode additionally uses `role === 'SUPPLIER_AGENT'`. `user.permissions` controls each action and menu.

| Supplier menu or destination | Route | Main component | Permission / behavior |
|---|---|---|---|
| 工作台 | `#/workbench` | Workbench | `workbench.read` |
| 我的报价 | `#/quotes` | Quotes | `quote.read`; table inline creation with `quote.write` |
| 收款管理 · 日账 | `#/settlements?tab=daily` | SettlementManagement → SupplierBills | supplier main `settlement.read`; ordinary agent sees consumption-focused own bills |
| 收款管理 · 部门账单 | `#/settlements?tab=departments` | SupplierBills departmentView | supplier main or group administrator only |
| 收款管理 · 金额确认 | `#/settlements?tab=statements` | SettlementManagement | supplier main `settlement.read` |
| 收款管理 · 收款记录 | `#/settlements?tab=payments` | PaymentsTab | supplier main `payment.read` |
| 收款管理 · 参考汇率 | `#/settlements?tab=rates` | ExchangeRatesTab | supplier main `exchange_rate.read` |
| 我的交付 · 交付列表 | `#/deliveries` | Resources supplierSide=true | `resource.read` |
| 我的交付 · NewAPI 待分配 | `#/deliveries-pending` | Resources pendingOnly=true | fixed type NEWAPI_INTAKE and assignment UNASSIGNED |
| 代理配置 | `#/outbound-proxies` | OutboundProxies | `proxy.read`; parent handles system domain |
| 团队成员 | `#/supplier-agents` | SupplierAgents | `supplier.agent.manage` |
| 应收报表 | `#/reports` | Reports | `report.read`; parent handles system domain |
| API 文档 | `#/api-docs` | ApiDocs | parent handles system domain |
| 我的资料 / 收款账户 | `#/suppliers` | MySupplierProfile | supplier mode changes platform suppliers page into own profile; menu can be profile entry |

The `settlements` route resolves legacy `tab=resource-accounting` to `statements` on supplier side and `daily` on platform side. Invalid/inaccessible tab selection uses the first allowed tab or access-denied state.

## API transport contract

All paths below are relative to `/api`. Source `core/index.js:5824` onward implements cookie session authentication with `credentials: 'same-origin'`. `GET /auth/csrf` returns `{headerName,token}`; each POST/PUT/DELETE uses that header. POST helper is exported as `rt`, PUT as `it`, GET/general request as `$`; aliases are different in every chunk and must not be interpreted by their local letter name alone. Login is form-urlencoded. A 401 emits the global unauthorized event. JSON failures carry `message`, optional `code`, `traceId`, `creationNotStarted`, `resourceId`. GET supplier-bills requests append `billView=consumption-v2` and set `cache: 'no-store'`.

Paginated collections consistently use `{items,total}` with 1-based page and sizes 10/20/50/100; some collections are bare arrays (rates current, team groups, team members, eligible projects, accounts). Preserve these shapes rather than wrapping every response in an extra `data` property.

## Quotes: exact supplier implementation contract

Sources: `src/quoting/quotes__Quotes.js` (1,179 wc lines), `QuotePeriodPanel.js`, `QuotePriceHistory.js`, `QuoteRankingResults.js`, `core/quoteHelpers.js`.

Supplier page title is `我的报价`; action `新增报价行` inserts a new table row above existing records. It does **not** open a create modal. Supplier table has seven columns: 报价项目 / 折扣或独立价格 / 申报能力和补充说明 / 币种和税 / 适用期间 / 状态 / 操作. Project cell shows projectName and unit plus code. State displays the original quote state, optionally a second `调价待审` badge. Row click opens the right detail drawer. Actions stop propagation.

Filters are 关键词 (placeholder 报价编号、供应商或项目), 报价项目 (项目名称或编号), 报价方式 (全部方式/DISCOUNT/FIXED), 币种 (USD), 报价状态 (default CURRENT meaning 待审/已通过), 适用日期, 重置 and refresh. State options CURRENT, empty, PENDING, CHANGE_PENDING, APPROVED, REJECTED, WITHDRAWN. Filters reset page to 1.

`GET /quotes?search=&supplier=&project=&pricingType=&currency=USD&state=CURRENT&onDate=&page=1&size=10`, supplier is blank for own account (server enforces tenancy). Poll interval 15 seconds.
`GET /projects?size=100` → `{items,total}`; exclude LEGACY from editable quote projects, enabled available projects sort by categoryName/category and name.
`GET /exchange-rates/current` → array; poll 30 seconds when exchange_rate.read.
`GET /quotes/multiplier-bounds` → `{min,max}` decimal strings using storage multiplier scale.

Display discount scale is unusual: UI `27折` means 27 percent and **API `multiplier: '0.27'`**. Default create input is `80`, API `.8`; preserve exact decimal arithmetic via strings / BigDecimal. A fixed-price project uses settlementMethod ACCOUNT_BUYOUT, pricingType FIXED and unitPrice; QUOTA uses DISCOUNT/multiplier. New default: USD, taxInclusive true, effectiveFrom Beijing today, effectiveTo month end. A copied row clears both dates. Editing existing source keeps historical values and locks project/price/capacity when its start date is past.

POST `/quotes` or PUT `/quotes/{id}` receives:
```json
{"supplierId":"uuid","projectId":"uuid","pricingType":"DISCOUNT","unitPrice":null,"multiplier":"0.27","currency":"USD","taxInclusive":true,"serviceCapacityNote":"","accountCount":null,"accountQuota":"100","rpm":null,"tpm":null,"effectiveFrom":"2026-11-09","effectiveTo":"2026-11-30"}
```
Unused capability fields must be null, not fabricated zero. Project capability choices: ACCOUNT_COUNT → positive integer accountCount; ACCOUNT_QUOTA → positive accountQuota (max 8 decimals) with project.capacityScope/capacityPeriod/capacityCurrency describing the label; THROUGHPUT → both positive rpm and tpm. Integer capability max 9223372036854775807. Note max 500 chars. Discount max 8 integer/6 decimal digits on display scale; validate recovered min/max. End must not precede start or today. Past starts are immutable.

Create success removes editor and shows 已提交审核; response/state should remain PENDING pending actual review, rather than auto approving. Only own PENDING quotes submittedBy=user.id are editable/withdrawable. Approved own quote can deliver (`#/deliveries?quoteId=...`) if resource permissions exist, adjust price, copy or view. Detail drawer has supplier quote hero, state, project/unit/settlement/delivery/currency/dates/tax/capability, reviewNote, renewalHistory and priceHistory.

GET `/quotes/{id}` detail. POST `/quotes/{id}/withdraw` `{}`. POST `/quotes/{id}/review` `{approved,note}` is platform-only. POST `/quotes/{id}/reject-approved` `{note}` is platform-only and requires nonblank <=500 note.

GET `/quotes/{id}/period-change` returns pending adjustment or null. POST same receives `effectiveFrom,effectiveTo` plus changed `multiplier` or `unitPrice` and `priceEffectiveFrom`. Read oldFrom/oldTo/proposedFrom/proposedTo/oldMultiplier/proposedMultiplier/state/priceEffectiveFrom for pending panel. Past start locked, price effective date today/future inside adjusted range. POST `/period-change/review` `{approved,note}` platform-only. History uses effectiveAt and approvedAt order; status 当前价格/历史价格/未来价格/已替代价格 based on actual time.

Project object fields needed by quote editor: `id,name,code,category,categoryName,enabled,settlementMethod,deliveryMethod,unit,capacityType,capacityScope,capacityPeriod,capacityCurrency,suggestedMultiplier`. Project enums QUOTA/ACCOUNT_BUYOUT, ACCOUNT/KEY/RELAY, ACCOUNT_COUNT/ACCOUNT_QUOTA/THROUGHPUT. Platform project maintenance is outside supplier menu but supports GET/POST/PUT `/projects`, GET `/projects/categories`, GET/POST/PUT/DELETE `/projects/category-codes` with version optimistic checks; intake types at `/projects/{id}/intake-channel-types` GET/PUT.

## Deliveries and resource submission

Main source `resources/resources-pending__Resources.js` implements **both** supplier and platform list; `pendingOnly` is a meaningful separate view, not a stub. Pending-only forces resourceType NEWAPI_INTAKE and assignment UNASSIGNED. Normal supplier list uses assignment ASSIGNED and a resource type/category filter. CCMAX overview shown when not pending and type blank/CCMAX; NewAPI list differs in columns and states.

GET `/deliveries` query:
`search,supplierSearch,creatorSearch,resourceType,category,assignment,newApiDeliveryState,newApiResourceState,operationalStatus,failureReason,projectId,credentialMode,state,createdFrom,createdTo,page,size,summaryOnly=true`.
GET `/deliveries/filter-options?assignment=&supplierSearch=&creatorSearch=` → `{suppliers:[{id,name,code}],creators:[{id,name,code}]}`. Keyword debounce 300ms; listing polls 10 seconds and summary polls 30 when no keyword search. GET `/projects?size=100`, GET `/projects/category-codes` supplies filters.
GET `/resources/submission-capabilities` exposes CCMAX stop/allow flags and operation availability. GET `/resources/eligible-projects` returns projects with currently valid uniquely approved quote. Entry with `quoteId` loads quote plus eligibility, requires approved own supplier quote and eligible project before opening resource form.
GET `/resources/summary` → categoryName/category/amounts[] (kind BUYOUT vs consumption, amount,currency,resourceCount). GET `/resources/creator-summary`, GET `/resources/failure-reasons`, GET `/resources/overview` support real totals and filterable overview. Overview includes delivered successful resources, state totals (ready/provisioning/invalid/dead/cooling/gone/draining/missingUsage), daily usage and fiveHour/sevenDay quota aggregates.

Supplier table columns for CCMAX: resource information, project/creator, delivery/resource state, quota/use, submit time, actions. Credentials/extended data remain masked until deliberate reveal. Resource fields include id,name,accountName,projectId/projectName,creatorName,resourceType,state,dispatchState,credentialMode,credentialConfigured,proxyId,proxyName,proxyEndpoint,laneId,laneState,version,usage,createdAt,submittedAt,readOnly. Delivery states DRAFT/DELIVERED plus dispatch PENDING/UNKNOWN/SUCCESS/FAILED. Runtime resource states and usage windows must not be conflated with dispatch.

New CCMAX form source `ResourceForm.js`: modal fields accountName, projectId, credentialMode (default REFRESH_TOKEN), refreshToken/accessToken/sessionKey, expiresAt (Unix ms), proxy pool or typed proxy URI, remark. GET project list, GET eligible-projects, GET `/outbound-proxies/options?page=&size=100`; typed URI POST `/outbound-proxies/resolve` `{url}`. Proxy response fields id,enabled,maxResources,usedResources,reservedResources. Project currently must have name uppercase starting CCMAX and valid approved quote. No credentials must be sent to live production during reconstruction.

Save draft POST `/resources/drafts` → Resource, edit PUT `/resources/{id}`. Credential new submit POST `/resources/supplier-submit` `{requestKey,input}` where input includes fields above and proxyId. Existing submit POST `/resources/{id}/submit` `{version}`. New OAuth POST `/resources/oauth/supplier-authorize` input → `{sessionId,authUrl,expiresAt}` then POST `/resources/oauth/supplier-submit` `{sessionId,code,input}`. Existing-resource equivalents are `/resources/{id}/oauth/supplier-authorize`, `/supplier-submit`, `/supplier-retry`. GET `/resources/oauth/supplier-session/{id}` and POST `/cancel` query/cancel the original operation. Session storage records only pending operation id/kind for reload recovery. Idempotency requestKey and UNKNOWN handling are essential: do not retry creating a new resource after uncertain network completion.

Batch CCMAX source `CcmaxBatchDelivery.js`: 1–100 independent objects, JSON max 200KB, allowed Refresh/Access/Session modes, OAuth single only. POST `/resources/ccmax/batch` `{items:[{requestKey,input}]}` → `{results:[{index,success,resource,error}]}`. Retain original ids for uncertain results.

NewAPI source `NewDelivery.js`: intelligent text input or manual entry. Supported channel types 1 OpenAI, 3 Azure, 14 Anthropic, 24 Gemini, 33 AWS, 41 Vertex, 60 generic OpenAI compatible. Choose modes single/batch/multi_to_single, key aggregation random/polling, optional models/base_url. TXT/JSON upload max200KB, strict UTF8, no zero bytes. Vertex service_account JSON required fields and max1MiB uploaded /64k canonical chars. POST `/resource-intakes/recognize` `{text,channelType}` → `{recognized,request,message,raw}`; request can be one `{mode,multi_key_mode,channel:{type,name,key,base_url,models,settings}}` or `{requests:[]}`. POST `/resource-intakes/preview` raw request → preview counts. POST `/resource-intakes` `{request,requestKey,supplierId,name}` → `{resourceIds:[]}` then list record remains UNASSIGNED.

GET `/resource-intakes/{id}` for intake detail, POST `/material` and `/original-request` for deliberate material reveal. GET `/resource-intakes/{id}/eligible-projects` → project rows with quoteBasis and quoteToken. POST `/assign-project` `{projectId,version,requestKey,quoteToken}` is one-time immutable assignment; success moves record to assigned list. Empty eligibility message asks platform to check resource type and valid quotation.

Resource detail GET `/resources/{id}`; POST `/usage` refreshes amount/state; POST `/say-hi` tests connection and may use upstream quota (local reconstruction must clearly separate unconfigured external operation). DELETE `/resources/{id}?version=N` logical delete. POST `/creation-recovery` `{version,dispatchId,confirmedNotCreated:true,action:'EDIT'|'DELETE'}` requires explicit confirmation original remote creation did not occur.

Resource lifecycle POST `/resource-lifecycle-jobs` `{requestKey,action:'PAUSE'|'RESUME'|'REMOVE',items}` returns durable operation. GET `/resource-lifecycle-jobs/{id}` and POST `/reconcile`; modal polls3s while RUNNING; distinguish PAUSED/RESUMED/GONE/FAILED/UNKNOWN/DRAINING and NEEDS_REVIEW. Closing modal does not cancel jobs.

Proxy replacement: GET `/resource-proxy-replacements/proxy-options?resourceId=&search=&page=&size=`, POST `/resource-proxy-replacements` `{requestKey,items}`, GET list `?scope=mine|all&page=&size=10&resourceId=`, GET detail id, POST `/reconcile`. Report binding completion separately from actual service availability.

Reauthorization path `/resources/{id}/reauthorizations`: GET `/current`; POST base `{version,mode:'OAUTH'|'REFRESH_TOKEN'}`; GET `/{operationId}`; PUT same `{code}` or `{refreshToken,accessToken?,expiresAt?}`. Status lifecycle NONE/INITIALIZING/READY/SUBMITTING/UNKNOWN/NOT_FOUND/FAILED/CANCELLED/pending/exchanging/staged/saved/installed/complete/superseded. Credential refresh separate path `/resources/{id}/credential-refresh`: GET for current record and POST `{requestId,version}` (reuse prior operation id while continuing save/sync, new UUID for new completed/failed operation); preserve pause/resource identity/history. Parent may implement local deterministic state without claiming real upstream refresh.

## Team members and departments

`SupplierAgents.js` has left departments and right member table for supplier main; group administrator gets a single-column own-group workspace. GET `/supplier-agents` → array; GET `/supplier-team-groups` → array. Member rows contain id,username,displayName,enabled,version,projects[]; department rows id,name,adminUserId,memberIds[],allowPro,version. Table columns member/dept/allowed projects/state/actions. Project summary shows first three chips then 查看全部; filter by category and project. All member/group filters happen client-side.

POST `/supplier-agents` `{username,displayName,password,groupId}` creates member; blank password server-generates, response initialPassword shown once. GET `/auth/registration-policy` supplies passwordMinLength/passwordMaxLength and complexity flags. PUT `/supplier-agents/{id}/enabled` `{enabled,version}`. POST `/supplier-agents/{id}/password` `{password:''}` resets/invalidate sessions and returns initialPassword.

GET `/supplier-agents/{id}/projects` → `{assignedIds,availableProjects}` with assignable flag. PUT same `{projectIds:[]}`. Select all uses all assignable or already-selected history projects, not just currently searched rows. Ordinary member cannot change own projects. Admin may only assign own delegable projects.

POST `/supplier-team-groups` or PUT `/supplier-team-groups/{id}` `{name,adminUserId,memberIds,version?,sourceVersions:{otherGroupId:version}}`. Each member belongs to exactly one department; selected admin is included automatically. Moving an existing department admin requires replacing admin first. Removing group POST `/supplier-team-groups/{id}/remove` `{version,targetGroupId,targetVersion}`; at least one group remains. Adjust member group uses target group's PUT with member union and sourceVersions.

Quota modal GET `/cc-intake/allocations` supplies groups,members,memberships,allocations,usage,proLimit,nonProLimit,versions. UI percentages store basis points (27.5% →2750). PUT `/cc-intake/allocations` `{allocations:[{kind:'GROUP'|'USER',subjectId,parentGroupId,proBasisPoints,nonProBasisPoints}],groupPro:[{id,allowPro,version}],version}`. Blank means share, 0 means no allocation, sibling totals <=100%, explicit parent quantity required for percentages. Reclaim only unused quota; used remains. This operation supplier main role only.

## Supplier profile, accounts and documents

Supplier view `Suppliers.js` delegates own profile, rather than presenting platform suppliers table. MySupplierProfile has profile head/avatar/status, 主体信息, 联系与结算, recent update and inline edit controls. Fields name,registrationNo,supplierType INDIVIDUAL/COMPANY,country,contact,phone,email,cycle DAILY/WEEKLY/MONTHLY/CUSTOM,customCycleDays,version. CUSTOM days integer1–365. PUT `/suppliers/{id}` submits pendingProfile review without replacing current approved fields immediately. profileReviewState may be PENDING/APPROVED/REJECTED; disabled cooperation remains read-only.

GET `/accounts?supplierId={id}` → array. POST `/accounts` fields supplierId,holder,bank,accountNumber,currency,accountType,transferType,network,walletType,replacesId?. UI accountType BANK labelled 空中云汇, OKX_USDT 欧意, BINANCE_USDT 币安. Crypto fixes currency USDT; INTERNAL_UID only OKX; ONCHAIN requires network/wallet PRIVATE|EXCHANGE. Full account not echoed; show lastFour and state (APPROVED 生效中, PENDING/REJECTED/SUPERSEDED). Pending replacement keeps old account effective. Source requires exact same supplier holder name.

GET `/documents?supplierId=...` → array; POST `/documents` multipart supplierId/category/file; category QUALIFICATION default, PAYMENT_PROOF for payments. PDF/PNG/JPG <=10MB. Download `/documents/{id}/download`. Platform deliberate reveal POST `/accounts/{id}/reveal` `{}`; review POST `/accounts/{id}/review` `{approved,note}`.

Personal profile modal GET/PUT `/auth/profile` with displayName,personalEmail,personalPhone,version; two tabs basic profile/API tokens (system-domain subcomponent). Password GET `/auth/password-policy`, POST `/auth/password` `{currentPassword,newPassword}`; success requires re-login. Do not substitute supplier contact fields for personal user profile fields.

## Receivables / settlements / payments

Supplier tab labels 日账 / 部门账单 / 金额确认 / 收款记录 / 参考汇率 are navigable submenu destinations. Members have reduced tabs and no all-supplier financial data. APIs must enforce supplier and own/group scope, not rely only on hidden UI.

SupplierBills date default today/today, type/project/creator/keyword/department filters and debounce300ms. GET `/supplier-bills/filters?from=&to=&department=` returns departments,resourceTypes,projects,creators,groupAdmin; GET `/supplier-bills/days?from=&to=&search=&resourceType=&project=&creator=&department=&page=&size=`; creators same with groupByDate; departments same with groupByDate. Results `{items,total,totals:[{currency,consumptionTotal,payableTotal,pendingConsumption}],summaryUpdating}`. Today polls60s when no other filters. Daily/creator/department aggregated switch changes request. Entries GET `/supplier-bills/entries` with date/project/search/model/state/creator/currency/page/size. Entry fields date/resourceType/resourceName/projectName/model/consumption/payable/state. Pending consumption is not yet receivable; current day becomes eligible next day Beijing time.

Statements page GET `/settlements/summary?currency=USD` → unsettledPayable,total,received,paid. GET `/settlements/pending-summary?filters` → pendingTotal,pendingCount. Five stat cards historical unsettled/pending confirmation/confirmed receivable/confirmed receipts/pending receipt. GET `/settlements?search=&supplierId=&currency=&state=&paymentProgress=&periodStart=&periodEnd=&page=&size=`. Filters include states PENDING/CONFIRMED/REJECTED/WITHDRAWN/VOID and payment progress UNPAID/PARTIAL/PAID. Date is period intersection inclusive.

Statement row fields id,code,projectName,periodStart,periodEnd,createdAt,currency,originalTotal,total,state,confirmationDeadline,confirmationMode,supplierConfirmed,paymentProgress. Detail GET `/settlements/{id}?page=1&size=50`, right drawer contains amount hero, frozen basis, dailyLines or resource groups, adjustments, payments. Supplier POST `/settlements/{id}/confirm` `{approved,note,version}`; approved true confirms, false raises dispute. Deadline auto confirmation is represented by confirmationMode AUTO_DEADLINE. Stale source pauses confirmation.

Export GET `/settlements/{id}/export` CSV, POST `/settlements/export?filters` `{ids:[]}` CSV. All-filter export with empty ids covers every page. Parent should implement real downloadable data.

Platform-only create source: POST `/settlements/preview` supplierId/projectId/periodStart/periodEnd/currency/confirmationDeadline, preview response snapshotHash; POST `/settlements` adds expectedSnapshotHash to freeze reviewed money. POST `/settlements/{id}/withdraw|void` note/version; POST `/adjustments` businessDate,amount,note,supplierVisible,version,requestKey. Batch candidate/preview/start/job polling sources are recovered but not supplier-visible creation actions. Record workflowVersion2.

GET `/payments?page=&size=&settlementId=` → `{items,total}`; GET `/payments/{id}` detail. Supplier row columns corresponding settlement/obligation deduction/expected payout/time/platform state/supplier receipt state/actions. Fields settlementCode,code,obligationCurrency,obligationAmount,payoutCurrency,payoutAmount,fxRate,statusUpdatedAt,state,paymentMethod,verificationMode,receiptState. Receipt states PENDING/CONFIRMED/DISPUTED. Only SUCCEEDED not confirmed can confirm. POST `/payments/{id}/receipt` `{confirmed:boolean,note}`. Detail displays transfer reference, proof, currency snapshot and receipt remarks.

Platform-only payment creation POST `/payments` online or `/payments/offline` with statement,obligationAmount,payoutCurrency,exchangeRateId,fee,accountId/paymentMethod,requestKey plus evidence for offline. Offline proof source stores sanitized rich-text JSON and up to10 files PDF/PNG/JPG max10MB each; evidenceContent max10000 chars. POST `/payments/{id}/offline-record`, `/review`, `/payout-preview`, `/execute`, `/reconcile`, `/close` implement workflow. Real payment providers are not required to produce local UI but fake success must not be represented as external execution.

Supplier reference rates GET `/exchange-rates/current` array `{baseCurrency,quoteCurrency,rate,version,effectiveFrom,source}`; no supplier edits or pagination; explanatory note says actual payment uses frozen recorded rate. Platform GET `/exchange-rates` paginated, POST base create version, POST `/{id}/enabled` version/note.

Platform DailyAccounting and DailyExports are auxiliary: `/accounting/daily`, `/summary`, `/groups`, `/exports` jobs; estimates/preview/files/archive/cancel; queue states QUEUED/FETCHING/GENERATING/COMPLETED/FAILED/CANCELLED/EXPIRED. Source format CSV/XLSX; jobs owned by current user and kept7 days. These are not the supplier daily-bills endpoint.

## CSS geometry and reuse plan

Use real `raw/assets/hispread-ai*.png` and favicon; do not redraw logo. CSS can be copied verbatim into Vue, preserving class names. This gives exact observed design tokens and media rules, unlike inventing approximations. Existing CSS selectors mostly depend on classes and native elements, so changing React to Vue does not require visual redesign. Preserve cascade order: base index first, route CSS after.

| Rule | Verified base value |
|---|---|
| root font | Inter,-apple-system,BlinkMacSystemFont,Segoe UI,Noto Sans CJK SC,Microsoft YaHei,sans-serif;14px400 |
| primary | `--blue:#3267f6` |
| body ink / muted | `#1d2942`, `--ink:#182640`, `--muted:#65748b` |
| app background | radial-gradient at55% -30% `#eaf1ff` to transparent62%, base `#f5f7fc` |
| page gutter | clamp(18px,2vw,32px) |
| sidebar | fixed216px border-box; padding20px12px16px; bg gradient160deg #f7faff→#f1f5fd; rightborder #e5ebf6 |
| sidebar logo | full168px; brand minheight76px |
| topbar | height64px; horizontal gutter |
| page content | width100%; padding16px gutter32px; >=1650px top24px |
| panel | white; border1px #e7edf6; radius15px; shadow0 4px22px #21437203; overflow hidden |
| primary button | h38px; padding0 15px; radius8px; font13px500; gap7px |
| table | font13px; nowrap; collapse; head #f8fafd;color#60728e; th44px/12px600; td60px;padding12px16px;color#526581 |
| own quote sheet | minwidth1300px; column widths220/225/210/140/175/70/135px |
| quote filters | grid6 equal columns; gap14px12px;padding18px20px; first two each span3; action span2 |
| editable quote row | td top aligned, bg#f8fbff; padding14px top/bottom |
| quote error row | bg#fff5f6; color#b96d79; padding9px22px |
| regular dialog | width min(580px,100vw-32px); maxheight100dvh-70px; radius18px; border#e7edf7 |
| drawer | width min(780px,100vw-22px); height100dvh-24px; margin12px12px12px auto |
| dialog header/body | 23px26px19px /24px26px; stickyheader; footer gap10px margin24px paddingtop19px |
| own profile | maxwidth920px centered; padding30px34px0; h2 21px650 |
| team workspace | grid192px minmax(0,1fr); gap16px; panels radius10px |
| team member cells | h76px; font12–13px; compact buttons28px high/radius5px/padding0 8px |
| daily bills filter | grid repeat7 minmax(0,1fr) auto; padding20px gap14px16px |
| daily bills stats | grid3 columns; gap16px;padding0 20px20px; cards bg#fbfcff/border#e7edf7/radius10px/padding16px18px |

Breakpoints: <=1450 daily query4 cols; <=1250 sidebar210px/pagegutter24; <=1000 sidebar82px collapsed; <=850 daily query2cols and stats1col; <=767 mobile modal navigation, main margin0, topbar auto>=60px, content16px12px, controls min44px and inputs16px; <=560 daily query1col; <=500 historical sidebar65px rules are superseded on app-shell mobile. Route quote filters reduce2columns then1. Team workspace192→185px at intermediate then1col mobile.

Do not drop media query wrappers when extracting CSS. The original cascade contains repeated selectors with different breakpoint scopes; naive regex extraction can turn mobile declarations into desktop overrides.

## Implementation priority and acceptance guidance

1. Restore shared shell, login/register, workbench from parent evidence.
2. Build actual supplier quotes with filters, inline draft, detail drawer, withdraw/copy/adjustment, APIs above.
3. Build assigned and unassigned delivery views, new NewAPI recognition→preview→submit and CCMAX local draft→submit states with idempotency.
4. Build receivable statement list/detail/confirm/exports, supplier daily/department bills, payments receipt confirmation, rates.
5. Build team departments/members/project permissions/quota; own profile/accounts/documents.
6. Match CSS geometry at the supplied screenshot widths and desktop/mobile breakpoints. ui-review must name audited routes/overlays and distinguish pages without visual design references; do not claim a global 1:1 score from only login/workbench screenshot matching.

## Complete domain inventory

| File | Physical lines (splitlines) | Role |
|---|---:|---|
| `src/finance/DailyAccounting.js` | 745 | platform raw daily accounting/groups/summary |
| `src/finance/DailyExports.js` | 549 | platform asynchronous CSV/XLSX exports |
| `src/finance/ExchangeRatesTab.js` | 178 | supplier published rates/platform version editor |
| `src/finance/PaymentForm.js` | 196 | platform payment creation |
| `src/finance/PaymentsTab.js` | 676 | supplier receipts/platform execution workflows |
| `src/finance/SettlementBatch.js` | 613 | platform multi-supplier batch creation |
| `src/finance/SettlementDetail.js` | 431 | supplier confirmation/platform adjustments/drawer |
| `src/finance/SettlementInputs.js` | 347 | platform manual/external source amount records |
| `src/finance/SettlementManagement.js` | 811 | finance tab/list/stats/create orchestration |
| `src/finance/SettlementPreview.js` | 234 | frozen quote basis preview and confirmation |
| `src/finance/SettlementResourceTable.js` | 82 | daily/resource source amount tables |
| `src/finance/settlements__Settlements.js` | 37 | role-aware finance route dispatcher |
| `src/finance/usePaymentEvidence.js` | 287 | proof attachments and rich-text evidence |
| `src/quoting/ApprovedQuoteRejection.js` | 104 | platform rejection of approved quote |
| `src/quoting/QuotePeriodPanel.js` | 254 | quote date and price adjustment state |
| `src/quoting/QuotePriceHistory.js` | 56 | effective dated prices table |
| `src/quoting/QuoteRankingResults.js` | 113 | platform ranking and capability sorting |
| `src/quoting/projects__Projects.js` | 581 | platform projects and category management |
| `src/quoting/quotes__Quotes.js` | 1180 | supplier quote sheet/editor/details |
| `src/resources/CcmaxBatchDelivery.js` | 328 | 1–100 independent credential submissions |
| `src/resources/CcmaxDistribution.js` | 78 | interactive plan distribution bars |
| `src/resources/CcmaxResourceOverview.js` | 295 | list snapshot state/quota overview |
| `src/resources/CurrentResourceOverview.js` | 289 | platform current resources reporting |
| `src/resources/IntakeAllocationDialog.js` | 434 | supplier daily quota department/member allocation |
| `src/resources/IntakePolicyPanel.js` | 355 | platform intake/priority policy |
| `src/resources/IntakeProjectTypes.js` | 83 | platform compatible NewAPI channel types |
| `src/resources/IntakeReviewDialog.js` | 205 | platform reconcile success creation count |
| `src/resources/IntakeToday.js` | 126 | today intake quota summary |
| `src/resources/NewDelivery.js` | 631 | NewAPI smart/manual recognition preview submission |
| `src/resources/PriorityBatchDialog.js` | 408 | platform batch priority jobs |
| `src/resources/PrioritySupportDialog.js` | 387 | platform scheduled priority support |
| `src/resources/ResourceDetail.js` | 475 | resource detail drawer/actions |
| `src/resources/ResourceForm.js` | 679 | supplier CCMAX credential/OAuth draft form |
| `src/resources/ResourceLifecycleDialog.js` | 174 | pause/resume/remove durable jobs |
| `src/resources/ccmax-resource-analysis__CcmaxResourceAnalysis.js` | 91 | platform reporting tab orchestration |
| `src/resources/ccmaxAnalysis.js` | 167 | resource reporting math/normalization |
| `src/resources/resource-targets__ResourceTargets.js` | 969 | platform upstream target and monitoring configuration |
| `src/resources/resources-pending__Resources.js` | 3203 | shared delivery/resource list/intake assignment/reauthorization |
| `src/supplier/AccountDialogs.js` | 271 | personal user profile/password/account creation result |
| `src/supplier/MySupplierProfile.js` | 638 | supplier self-service profile/accounts/documents |
| `src/supplier/OwnerSection.js` | 199 | platform operator ownership/history |
| `src/supplier/SupplierBills.js` | 691 | supplier daily/department/member bills and entries |
| `src/supplier/SupplierDailyCreations.js` | 277 | platform supplier creation heatmap/table |
| `src/supplier/SupplierDetail.js` | 540 | platform supplier drawer/review/accounts/users |
| `src/supplier/SupplierMemberGroupDialog.js` | 90 | move member to department |
| `src/supplier/SupplierPlatformSettings.js` | 259 | platform supplier resource/PRO/proxy configuration |
| `src/supplier/SupplierTeamGroups.js` | 219 | department create/edit/remove/admin/member allocation |
| `src/supplier/Suppliers.js` | 435 | platform list and supplier own-profile route adaptation |
| `src/supplier/operator-kpi__OperatorKpi.js` | 242 | platform ownership and monthly KPI |
| `src/supplier/payout-recipients__SupplierAccounts.js` | 274 | platform account/recipient list |
| `src/supplier/supplier-agents__SupplierAgents.js` | 732 | supplier team workspace and permissions |
