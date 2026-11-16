# 控制台功能与接口收紧审查

日期：2026-11-16。线上 `http://152.53.83.250:10001/`，健康接口确认版本 `0.8.124`；本地源码提交 `e004bd2`。使用平台管理员查看工作台、供应商、运营归属、项目、报价、账务、代理、资源、报表、API 文档、交付任务、资金通道和系统页面，并对照服务端实现。

此文件保留审查时的发现。用户已批准其中的修复与精简，`0.8.125` 对应实现和验证见 [控制台收紧实现](console-scope-implementation-2026-11-16.md)；不应把下列旧问题当作升级后仍存在的问题。

本轮为审查，未修改业务源码、线上配置、账号或账务，未新增 OAuth、导入代理、触发上游维护或付款。下列“确定问题”包含线上读取与源码核对；源码可推导的写入问题未在生产发送请求复现。后台路由清单共 335 条注册项，其中包含已明确返回 410 的兼容路由，不能据此认为这些功能仍可执行。

## 优先处理的确定问题

### 1. 系统参数仍可编辑已停用的 RPM／TPM 倍率

线上 `#/settings` 仍有倍率下限、上限和保存按钮。页面读 `GET /api/workbench-monitoring/multipliers`，保存调用 `PUT` 同一路径，而后端已无条件抛出 `410 TASK_RETIRED`。

建议移除整块编辑界面和后台轮询，保留历史数据；已有 410 兼容接口不需要重新实现。证据：`frontend/src/recovered/SystemSettings-CtOVlrw5.js:24`、`:113`、`:644`；`backend/src/main/java/com/hispread/ai/PlatformConfigController.java:522`、`:528`。

### 2. OAuth 主流程、旧凭据流程与公开文档尚未统一

| 接口或界面 | 核实情况 | 建议 |
| --- | --- | --- |
| 新增 CCMAX 交付表单 | 默认 `REFRESH_TOKEN`，仍展示 RT／AT／SK；原生目标在创建本地记录前返回 `400 CCMAX_RAW_IMPORT_DISABLED`。表单却可能保存待核对标识并提示结果不确定 | 原生接入只展示 OAuth；明确拒绝应直接显示失败，不能制造待核对会话 |
| `POST /api/resources/supplier-submit`、`POST /api/resources/ccmax/batch`、`POST /api/open/v1/ccmax/submissions/credentials` | 原生目标已阻断，历史 CUSTOM 仍走旧兼容实现 | 按接入能力限定或退役旧入口；不要重新开放原生 RT／AT／SK |
| `POST /api/open/v1/ccmax/submissions/oauth/authorize` | 发布示例要求 `projectCode`，服务实际要求 `projectId`，未找到自动映射；文档还要求 `proxyId`，允许把代理 URL 填进去，服务实际按本地代理 ID 查询 | 统一公开请求协议与示例；原生直连不要求代理。先查询有效项目和报价，再传服务端支持的标识 |
| `POST /api/open/v1/ccmax/submissions/oauth/complete` | 原生校验完整回调或 `code#state`，文档示例仅写授权码占位 | 清楚说明必须保留本次 state 与原会话 |
| 公开重新授权文档 | 统一宣称 `OAUTH / REFRESH_TOKEN`；当前原生账号详情已经是 OAuth，原生服务也走 OAuth 回调 | 按协议描述实际能力，停止把兼容 RT 替换写成原生支持 |
| 下载 OpenAPI | 实际下载为 `v1.1.0`、19 路径／21 操作，遗漏已实现的 `GET /api/open/v1/ccmax/resources/{resourceId}/operations/{id}` 和 `POST .../operations/{id}/reconcile` | 文档应优先覆盖 OAuth、结果查询、必要维护和额度；补充原操作查询以避免重复提交 |

证据：`frontend/src/recovered/ResourceForm-CV4-f1sb.js:78`、`:375`、`:412`；`backend/src/main/java/com/hispread/ai/ResourceOperations.java:187`、`:511`、`:688`；`backend/src/main/java/com/hispread/ai/NativeCcmaxAdapter.java:338`、`:542`；`frontend/src/recovered/ApiDocs-BOQ6E5CN.js:118`、`:144`、`:149`、`:155`、`:305`；`backend/src/main/java/com/hispread/ai/OpenCcmaxController.java:247`、`:357`。

旧 `CcmaxBatchDelivery` 是 RT／AT／SK 专用组件，但当前资源页未找到打开它的状态赋值，应归为休眠兼容代码，不能声称线上仍有可点击的批量导入按钮。原生详情正确走 `frontend/src/runtime/ccmax-native.js`，不要把兼容详情的 RT 选项归到原生详情。

### 3. 上号分析接口口径错误，应修正后收为轻量上号统计

线上只读请求确认以下接口返回了同样的 `{from,to,total,rows}`，`rows` 只有资源类型、原始运行状态和数量：

- `GET /api/reports/ccmax-resources/current`
- `GET /api/reports/ccmax-resources?from=2026-10-18&to=2026-11-16`
- `GET /api/reports/ccmax-resources/suppliers?from=2026-11-10&to=2026-11-16`

现场响应三者均为 `total:14`，状态分组为空 8、ACTIVE 4、GONE 2。后端只按供应商过滤，没有按期间、成功新增、资源类型或逻辑删除核实统计范围，也没有返回前端需要的 `createdDate` 和供应商维度。每日图和供应商表因此把全部响应行丢弃，出现“创建成功 14、日期明细 0、供应商期间合计 0”。当前状态图将空状态与 ACTIVE 各自显示成“状态未知”；不能据此认定这 4 个 ACTIVE 账号实际上不可用。

建议保留“每日成功新增数、期间合计、供应商贡献、失败与待核对数”，合为一个上号统计入口。成功数依据原交付回执和首次成功时间，已有账号关联及重新授权不计新增。库存状态放回资源列表；套餐分布、状态交叉图、热力矩阵作为可选次级统计。不要用删除报表代替修复计数契约。

证据：`backend/src/main/java/com/hispread/ai/FinanceController.java:895`；`frontend/src/recovered/ccmaxAnalysis-BjOYJv3E.js:7`、`:49`、`:72`、`:124`；`frontend/src/recovered/DailyCreationAnalysis-MGRzns81.js:281`；`frontend/src/recovered/SupplierDailyCreations-C04GFRSJ.js:49`。

### 4. 已生效能力与旧提示相互矛盾

- 供应商平台配置仍显示“PRO 套餐限制尚未生效”，但原生 OAuth 已执行套餐分类、资格与额度校验。应说明实际作用于后续原生新增，而非继续宣称只保存配置。证据：`frontend/src/recovered/SupplierPlatformSettings-DQ79klgY.js:188`；`backend/src/main/java/com/hispread/ai/CcmaxIntakeLedger.java:311`。
- 上号规则仍引导“历史账号通过批量调整执行”，但批量调权已停用。应明确规则只影响后续上号的初始分配，已有账号在上游维护。首次上号政策、PRO／非 PRO 限额和成员／分组分配本身属于业务范围，应保留。证据：`frontend/src/recovered/IntakePolicyPanel-DHvOkPUU.js:288`。
- 日账仍写“拉取金额即为真实账单，无需核验”，线上历史金额记录同时显示待审核。应区分“来源金额”“待确认金额”“可结算应付”，保留旧采集记录的人工核对。证据：`frontend/src/recovered/DailyAccounting-z_8v-GqX.js:473`、`:583`；`backend/src/main/java/com/hispread/ai/PlatformFinanceController.java:213`。
- 资金通道仍有“自动查单间隔”／“自动调度预留”输入。字段只被保存，未找到调度消费者，应隐藏无效配置，而不向用户承诺自动查单。证据：`frontend/src/recovered/PayoutProviders-D9Kgf-te.js:328`；`backend/src/main/java/com/hispread/ai/PlatformConfigController.java:559`、`:618`。

## 适合进一步简化的业务模块

| 模块 | 涉及接口 | 建议与边界 |
| --- | --- | --- |
| 资金通道和真实出款 | `PUT /api/payout-providers/{code}`；`POST /api/payments/{id}/payout-preview`、`execute`、`reconcile` | 当前有 Airwallex／OKX／Binance 和支付中台配置，属于较重的可选业务。如果只做线下结算，主流程保留付款申请、独立审核、凭证登记和供应商收款确认，真实出款模块默认关闭或收为高级功能；原未决款项查单与历史不能删除 |
| 日账导出任务 | `POST /api/accounting/daily/exports`、`/estimate`；`GET /api/accounting/daily/exports`；相关预览、下载、归档、取消路径 | 当前请求内同步生成，立即 COMPLETED，列表 activeCount 固定 0；界面却有排队／生成状态和任务提示。合为“导出 → 汇总层级／格式 → 下载”，历史作为次级入口，文件过期与访问权限保留 |
| 金额录入的重复入口 | `POST /api/settlement-inputs`、`/manual`、`/manual-direct` | “录入手工款”与标注“待完成”的“接收外部金额”当前都是人工表单。可合为“录入应付依据”，选择按报价计算或直接金额，保留来源单号、报价快照、审核与防重 |
| 工作台每日营业额 | `GET/POST /api/turnover` | 独立手工台账，与报价或已确认结算没有自动关联。可移到可选报表或收起；不能把应付总额改叫营业额 |
| 代理池与批量替换 | `/api/outbound-proxies/*`；`POST /api/resource-proxy-replacements`；公开 `/api/open/v1/ccmax/proxy-replacements` | 原生 OAuth 当前直连，原生替换不支持且页面已对原生选择禁用。兼容代理入口宜按目标能力呈现，原生用户不必面对代理池配置；本轮不扩展原生代理范围 |
| NewAPI 待分配资料 | `/api/resource-intakes/recognize`、`preview`、创建与 `/{id}/assign-project` | 这是本地资料接收／分配，不等同于在上游创建渠道；建议明确“资料已接收／待分配”，减少把本地保存称为远程交付成功的误解。已有渠道关联继续独立核验 |
| 运营归属和月度绩效 | `GET /api/reports/operator-kpi`、`/lines` | 是供应商归属和结算绩效，业务含义成立；可把分配放供应商详情、绩效放报表中心，减少独立导航 |

出款证据：`backend/src/main/java/com/hispread/ai/FinanceController.java:322`；金额录入：`backend/src/main/java/com/hispread/ai/PlatformFinanceController.java:91`；同步导出：同文件 `:988`、`:1022`、`:1087`；导出界面：`frontend/src/recovered/DailyExports-q6_gv_XE.js:37`、`:129`；独立营业额：`backend/src/main/java/com/hispread/ai/PlatformConfigController.java:717`；NewAPI 本地资料：`backend/src/main/java/com/hispread/ai/ResourcesController.java:708`。

代理还存在两个源码确定的接口契约缺陷，作为修复项登记，不混同为新增功能：

1. `POST /api/outbound-proxies/import` 返回数字 `skipped`，控制台却调用 `skipped.map`。服务端即使保存成功，界面也会报错。证据：`backend/src/main/java/com/hispread/ai/ProxyController.java:160`；`frontend/src/recovered/OutboundProxies-BILxGplZ.js:32`、`:256`。公开 Bearer 导入另有包装返回数组，不能与控制台结果混为一谈。
2. 兼容替换界面要求 `supported:true` 才允许选已有代理，而 `GET /api/resource-proxy-replacements/proxy-options` 未返回该能力字段。证据：`backend/src/main/java/com/hispread/ai/ResourcesController.java:445`；`frontend/src/recovered/Resources-CXo1DF00.js:612`、`:639`。

## 保留的必要边界

上号资格与限额、报价有效期与审核、供应商／成员／项目范围、账号关联防重、原操作幂等及不确定结果查询、供应商结算确认／异议、付款独立审核与凭证、旧款项占用和查单，都不因界面精简而取消。按报价做消耗折扣或买断结算本身也不构成网关职责。

已停用的模型试调用、批量调权、独立配置页 OAuth、旧监控写入和旧自动任务，仍返回 410；历史 GET、原生／NewAPI 只读核对与旧权重快照显式恢复，是升级兼容和善后路径，不算“没收紧”。`workbench.monitoring.read/configure` 仍在权限底层目录及部分默认授权中，可清理；角色编辑器已隐藏这两个权限，不能说当前权限树仍展示它们。

建议下一轮顺序：先统一 OAuth 与公开契约、修正上号统计；同时移除退役倍率和矛盾文案；再精简出款、金额录入、导出、营业额与代理的主入口。证据与线上下载文档保存在被忽略的 `.run/console-scope-audit-2026-11-16/`，不包含登录凭据。
