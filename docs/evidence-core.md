# 前端核心证据与后端契约

本文件是对本地已捕获生产构建产物的静态分析。源站代码为 React + Vite；实现按用户要求转成 Vue。证据包含美化的生产 JS（不是原始 TSX/Vue 源文件）；内联 React、React DOM、Three.js 库与翻译词典的遍历不代表对库自身的重新审计。未在源站执行任何写操作。

## 核心请求协议

来源：`evidence/前端/src/core/index.js:5835–5955`。

- 一切业务接口前缀 `/api`，请求 `credentials: same-origin`，原站用 Cookie 会话。前端不保存登录 token。
- 首个写请求前 GET `/api/auth/csrf`，JSON `{headerName,token}`；写请求（除 GET/HEAD/OPTIONS）附加该头。登录/登出后丢弃缓存 token。
- GET API 成功体直接是对象/数组；无统一 `{code,data}` 包裹。
- POST/PUT 默认 JSON；上传 FormData；登录专用 urlencoded。
- 登录 POST `/api/auth/login`，Content-Type `application/x-www-form-urlencoded`，body `username=...&password=...`。403 时重新取 CSRF 重试一次。登录成功再 GET `/api/auth/me`。
- `/auth/me` 字段：`id,username,displayName,role,supplierId,permissions:string[],mustChangePassword,onboardingRequired,supplierRegistrationApprovalEnabled,teamAdminGroup?:{id}`。以 `supplierId` 是否存在区分供应商侧。
- 401 清除用户态；403 `PASSWORD_CHANGE_REQUIRED` 弹强制改密码；错误 JSON `{message,code?,traceId?,creationNotStarted?,resourceId?}`。
- 分页体 `{items:[],total:number,page:number,size:number}`，页码从1开始。部分列表（rates/current、roles、api-tokens）直接返回数组。
- GET `/supplier-bills/*` 自动添加 `billView=consumption-v2` 并 `cache:no-store`。
- blob导出 `/settlements/{id}/export`、POST `/settlements/export?filters` JSON `{ids}`；文件下载应返回实际文件。

## 注册、首次建档、个人设置

| 方法 | 路径（均以 /api 开头） | 输入/输出 |
|---|---|---|
| GET | `/auth/registration-policy` | `{passwordMinLength,passwordMaxLength,requireUpper,requireLower,requireDigit,requireSymbol}`；截图为8–64并包含四类字符 |
| POST | `/auth/register` | `{username,password}`，前端先验证两次密码一致；成功后回登录，不自动登录 |
| POST | `/auth/logout` | `{}`；清会话 |
| GET | `/auth/password-policy` | 密码策略，改密组件用 |
| POST | `/auth/password` | `{currentPassword,newPassword}`，成功后用户退出会话并重新登录 |
| GET/PUT | `/auth/profile` | `{username,displayName,personalEmail,personalPhone,version}`；PUT传显示名/邮箱/电话/version |
| POST | `/auth/onboarding` | `{personalName,personalEmail,personalPhone,supplierType:COMPANY或INDIVIDUAL,companyName,registrationNo,country,cycle:DAILY/WEEKLY/MONTHLY/CUSTOM,customCycleDays}` |
| POST | `/documents` | multipart `supplierId,category:QUALIFICATION默认,file` |
| GET | `/health` | `{status,version}`，截图证据版本0.8.122；前端比较meta版本不一致会刷新 |

注册校验：姓名/企业字段前端maxLength；country默认中国，cycle默认MONTHLY；custom周期1–365。登录和注册切换是同一URL同一组件状态，注册不是独立线上路由。

## 路由与权限

hash `#/workbench` 为默认。`tasks`→`workbench`；`ops`→`resources`。所有路由由 `auth/me.permissions` 决定显示和进入资格。

供应商主账号菜单：工作台(`workbench.read`)、我的报价(`quote.read`)、收款管理、我的交付(`resource.read`)、代理配置(`proxy.read`)、团队成员(`supplier.agent.manage`)、应收报表(`report.read`)、API文档（非SUPPLIER_AGENT可见）。我的资料从右上账号菜单进，对应 `#/suppliers`。

收款管理子路由：`#/settlements?tab=daily` 日账、`departments` 部门账单、`statements` 金额确认、`payments` 收款记录、`rates` 参考汇率。daily/statements需settlement.read；payments需payment.read；rates需exchange_rate.read。SUPPLIER_AGENT仅有日账，本组管理员额外部门账单。`tab=resource-accounting`在供应商侧映射statements。

我的交付含`#/deliveries`交付列表与`#/deliveries-pending` NewAPI待分配（需resource.intake.manage）。业务导航默认展开我的交付；收款管理只有当前路由settlements时展开。右上菜单：我的资料、个人信息、修改密码、退出登录。移动导航断点767px；桌面折叠侧栏82px。

平台管理路由表已由证据完整保存于 `evidence/前端/api/ROUTES.md`：users/roles/audits、projects、suppliers、resources、resource-targets、ccmax-resource-analysis、operator-kpi、scheduled-tasks、scheduled-task-runs、payout-providers、payout-recipients、payout-calls、notice-admin、settings。供应商账号隐藏平台权限页面。

## 工作台数据契约与交互

| GET路径 | 数据 |
|---|---|
| `/workbench` | `{money:[{currency,total,received,paid}],recent:Notification[],announcement?:{notificationId,title,body,publishedAt}}` |
| `/workbench/monitoring` | `[{category,categoryName,rpm:string|null,tpm:string|null,queriedAt?,lastAttemptAt?,dataUpdatedAt?}]`，每10秒刷新，需workbench.monitoring.read |
| `/workbench/tasks` | `{items:Task[],limited?:boolean}`，需workbench.tasks.read |
| `/exchange-rates/current` | `[{id,baseCurrency,quoteCurrency,rate,source,effectiveFrom}]` |
| `/turnover` | `{items:[{businessDate,siteName,currency,amount,note}]}`，原站供应商通常无turnover.read |
| `/notifications/unread-count` | `{count}`，每30秒后台刷新 |

Task字段：`id,kind,title,label,summary,detail,targetPath,supplierName,amount,currency,createdAt,facts:[{label,value}]`。分类QUOTE_NEW/QUOTE_CHANGE/QUOTE_REJECTED→报价；SUPPLIER_REVIEW/SUPPLIER_REVISION/ACCOUNT_REVIEW→资料；SETTLEMENT_CONFIRM/PAYMENT_CREATE/PAYMENT_REVIEW/PAYMENT_EXECUTE/PAYMENT_RECEIPT→账务。

待办默认显示5条，点击行展开facts和操作按钮；操作按钮导航targetPath。截图种子为1条QUOTE_REJECTED CCMAX-额度-CODING，27折（后端倍率0.27），11/06至11/30，供应商梧桐。

操作指引是open的details，3个tabs：提交报价/交付资源/查看账单。隐藏状态localStorage键 `hispread.workbench.guide-hidden:{userId}`。工作台顺序：日期→公告(可选)→操作指引→RPM/TPM→待办→收款概览+常用操作→汇率(可选)→最近进展。

收款概览：待确认收款=max(0,total-received)，未有money时币种下拉disabled、所有金额'—'。常用操作：维护资料→suppliers，提交报价→quotes，查看收款→settlements，新增交付→deliveries。

## system 全部模块接口

| 模块 | 方法/路径 | 字段与行为 |
|---|---|---|
| Notifications | GET `/notifications?unread=false&page=1&size=10`；POST `/{id}/read`；POST `/notifications/read-all` | Notification字段id,title/body或类型化payload,targetPath,createdAt,readAt。打开消息标已读，弹层可导航 |
| ApiTokens | GET/POST `/auth/api-tokens`；POST `/{id}/reset,/revoke,/reveal` | create `{name,days}`；reset `{days}`；返回key仅创建/重置/特权reveal时。列表{id,name,tail,enabled,expiresAt,lastUsedAt,revealable}；days1–365默认90。管理他人同构 `/users/{userId}/api-tokens` |
| OutboundProxies | GET `/outbound-proxies/page?page&size&search&state&protocol`；GET `/options?page&size`；POST `/outbound-proxies`；PUT `/{id}`；POST `/import`；POST `/{id}/test`；GET `/{id}/resources` | 写入{name,url,maxResources:null或非负整型,enabled,version?}；import{lines,defaultProtocol,maxResources}返回imported/skipped；测试返回lastTestState/Message；SOCKS5/HTTP/HTTPS |
| Reports | GET `/reports/supplier-receivables`、`/overview`、`/monthly-payables`、`/settlements`；GET `/reports/export` | 筛选from/to/currency/supplierId/projectId；settlements额外scope；export report=SUPPLIER_RECEIVABLES/MONTHLY_PAYABLES。供应商仅receivables，默认近6个月 |
| SystemUsers | GET `/system/users?search&role&state&page&size`；POST `/system/users`；PUT `/{id}`；PUT `/{id}/enabled`；POST `/{id}/password`；POST `/{id}/logout` | 创建displayName,username,password可null,roleCode,supplierId可null,additionalRoleCodes；更新roleCode,enabled,version,additionalRoleCodes；password返回临时凭据 |
| Roles | GET `/system/roles`、`/system/roles/page?search&page&size`；POST `/system/roles`；PUT `/{code}` | `{name,code,description,permissions,version?}`，内置角色与自定义角色 |
| Audits | GET `/system/audit-actions?retry`；GET `/system/audits?summaryOnly=true&search&action&actor&outcome&page&size&from&to` | 只读审计，权限audit.read |
| SystemSettings | GET/PUT `/system/settings` | `{policy,allowAllSuppliersPro,allowAllSuppliersCcmax,forceStopCcmaxIntake,ccmaxIntakeConcurrencyLimit,ccmaxCreationTimeoutSeconds,allowAllSuppliersCcmaxReauthorization,version}`；policy包含密码与报价倍率边界 |
| MonitoringSettings | GET/PUT `/workbench-monitoring/multipliers` | `{category,minMultiplier,maxMultiplier,version}`；其为RPM显示倍率，不等同报价倍率 |
| ScheduledTasks | GET `/system/scheduled-tasks`；PUT `/{key}`、`/{key}/schedule`、`/{key}/config`；GET `/{key}/runs` | enable `{enabled,version}`；schedule `{intervalMinutes,version}`；config `{name,targetId:null,intervalMinutes,version}`；runs筛选triggerKind/state/from/to/page/size |
| WecomReminder | GET/PUT `/system/scheduled-tasks/WORKBENCH_WECOM_REMINDER/reminder-settings` | `{webhookUrl,workbenchUrl,clearWebhook,version}` |
| PayoutProviders | GET/PUT `/payout-providers/{code}`；POST `/{code}/test` | code=AIRWALLEX/BINANCE_USDT/OKX_USDT；配置secretKey,passphrase,sourceWallet,clientId,loginAs,apiVersion,transferMethod,transferReason,requestTimeoutMs,reconcileIntervalSeconds；测试只读 |
| PayoutCalls | GET `/payout-calls?...` | 列表state PROCESSING/UNKNOWN/SUCCEEDED/FAILED；进行中5秒刷新 |
| SystemNotices | GET `/notifications/notices?search&status&page&size`；POST `/notifications/notices`；PUT `/{id}`；POST `/{id}/publish,/revoke`；POST `/notifications/publish` | title,body,audience,targetUserId,quoteProjectIds,version；revoke返回removedUnreadCount；publish返回recipientCount |
| NoticeAudience | GET `/notifications/notice-recipients`、`/recipient-preview?...`、`/notices/{id}/deliveries?search&state&page&size` | 人员与阅读状态，查看阅读明细不会改变readAt |

完整生产接口字面量清单已在 `evidence/前端/api/API-CONTRACT.md` 与 `endpoints_by_file.json`。与供应商业务相关的 quoting/resources/finance 由另一证据任务分析；后端应以重建 Vue 实际调用与这些契约交集为首批实现，不能凭空给外部支付/CCMAX动作返回成功。

## 精确视觉样式

可复用证据原CSS `raw/assets/index-Co8Tabyn.css` 与Workbench-CUVm9rHy.css；须保持选择器对应DOM层级以获得相同效果。CSS有多层media覆盖，不能拿正则提取后丢失media条件。

- 全局Inter/-apple-system/BlinkMacSystemFont/Segoe UI/Noto Sans CJK SC/Microsoft YaHei；14px，正文#1d2942；blue#3267f6；border#e9edf5。
- 品牌：`svg viewBox="10 54 585 196"`、image width600 height300；full180×60，侧栏168宽。直接img会保留透明留白，比例不对。
- 登录背景radial-gradient(at 32% 48%,#e3edff,transparent 57%),#f3f7ff；主区max1600、左右5.1% padding；grid 1.1fr/1fr、gap6%；portal高690。
- 登录h2 clamp34px/3.6vw/58px，line-height1.45，weight500，紫色#5c4aaf。副文案13px，line-height1.95。
- 登录card宽400、radius24、padding46px32px32px、shadow0 24px70px -34px #3e639c55；头像66×66；标题28px/500，margin-bottom36。
- 登录输入52高，radius28，background#f8faff/border#d3deef、left padding44、font13；提交52高、背景#315cff、margin-top32；切换链接margin-top28。
- 粒子原组件末尾用Three.js自定义shader（6200点、seed9182、相机48°/z8.5、rotation.z=-.11）。颜色来自--particle-base #4169d9、cyan#168baf、purple#7663d6。reduced-motion固定时间12，无法WebGL fallback2100svg圆点seed871。若1:1需迁移末尾shader和生命周期，库本体可用npm three。
- 桌面sidebar216宽、fixed、padding20px12px16px；brand min-height76；nav项44高/14px/9radius；submenu38高/13px。
- topbar64高，main margin-left216；page gutter clamp18px/2vw/32px；page-content padding16px gutter32px；背景#f5f7fc + radial渐变。
- panel border#e7edf6/radius15；panel-section-head padding21px23px，h2 15px/650。
- 工作台guide margin-bottom20，summary padding20px92px20px23px；instructions grid auto-fit≥240px、gap24、padding23；guide footer14px23px。
- 监控表fixed layout：品类28%，RPM20%，TPM20%，时间32%；RPM/TPM右对齐17px；table min580。
- 待办head14px18px；row grid28px 1.1fr 1.5fr auto16px，gap18；row padding12px18px；task title13px。
- workbench-summary两列1fr，gap16；quick-grid两列gap9；balance数字32px。

## 本机运行环境（只读检查）

- Node/npm：/opt/homebrew/bin；Java命令17.0.12；Maven3.10.0默认使用Homebrew OpenJDK27。后端编译可固定release17。
- PostgreSQL16.15已运行，`pg_isready`为accepting connections，Unix socket /tmp:5432。`psql -d postgres`可连接，当前用户yukaijun。尚未创建/修改任何数据库。
- Docker29.5.2 daemon可达。

## 文件覆盖

机器遍历core/system全部32个JS，共1,887,323字节。重点逐段阅读应用自有API封装、登录注册、路由分发、权限、组件、工作台、通知、设置及proxy/reports；生产内联第三方库与长翻译词典按依赖身份识别，未逐语句审计第三方实现。

| 文件 | 行数 | 字节 |
|---|---:|---:|
| `core/DateRangePicker.js` | 293 | 8863 |
| `core/MoneyDisplay.js` | 63 | 1644 |
| `core/QueryFilters.js` | 219 | 5274 |
| `core/index.js` | 18283 | 872969 |
| `core/labels.js` | 49 | 1425 |
| `core/projectOptions.js` | 28 | 970 |
| `core/quoteHelpers.js` | 157 | 5184 |
| `core/resourceHelpers.js` | 429 | 14587 |
| `core/systemLabels.js` | 40 | 1373 |
| `core/useDeliveryProxies.js` | 46 | 1240 |
| `core/useSummaryRefresh.js` | 22 | 500 |
| `system/ApiTokens.js` | 308 | 10995 |
| `system/Audits.js` | 618 | 27348 |
| `system/LoginParticleArtwork.js` | 15770 | 606602 |
| `system/NoticeDeliveries.js` | 131 | 3790 |
| `system/NoticeEditor.js` | 275 | 8791 |
| `system/Onboarding.js` | 215 | 6878 |
| `system/RoleEditor.js` | 386 | 14103 |
| `system/Roles.js` | 112 | 3094 |
| `system/System.js` | 33 | 1234 |
| `system/Users.js` | 491 | 15862 |
| `system/api-docs__ApiDocs.js` | 799 | 115646 |
| `system/notice-admin__SystemNotices.js` | 366 | 11171 |
| `system/notifications__Notifications.js` | 114 | 2842 |
| `system/outbound-proxies__OutboundProxies.js` | 741 | 26020 |
| `system/payout-calls__PayoutCallLogs.js` | 141 | 3691 |
| `system/payout-providers__PayoutProviders.js` | 348 | 12283 |
| `system/reports__Reports.js` | 622 | 17827 |
| `system/scheduled-task-runs__ScheduledTaskRuns.js` | 282 | 10665 |
| `system/scheduled-tasks__ScheduledTasks.js` | 312 | 11763 |
| `system/settings__SystemSettings.js` | 646 | 24617 |
| `system/workbench__Workbench.js` | 1098 | 38072 |
