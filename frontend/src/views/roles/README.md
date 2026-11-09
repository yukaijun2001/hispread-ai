# 角色视图维护索引

当前运行入口是 `src/App.vue` → `src/recovered/index-Dnr0i-H9.js` 的 `RootApplication`。全部业务函数通过 Vue 适配层渲染，原始 CSS 与 DOM 类名保留在 `public/assets/`。本目录提供可读的角色边界和模块索引，便于定位及逐页迁移为 SFC，不复制第二份业务状态机。

`route-catalog.js` 导出 `ROUTE_CATALOG`、`accessibleRoutesFor(user)` 和 `settlementTabsFor(user)`、`navigationGroupsFor(user)` 和 `landingRouteFor(user)`。这是前端导航与 QA 索引；访问控制仍由后端验证。供应商和平台用 `user.supplierId` 区分，不能只看 `role` 名称。

| 角色 | 判断 | 页面差异 |
| --- | --- | --- |
| 平台管理员 | `role=ADMIN` 且 `supplierId=null` | 供应商、运营、项目、资源、账务、报表、系统及付款通道。实际可达页面仍受 permissions 控制。 |
| 平台运营 | `role=OPERATOR` 且 `supplierId=null` | 使用同一套平台组件，按权限显示供应商、项目、报价、资源及运营报表。不给系统或财务写权限。 |
| 财务人员 | `role=FINANCE` 且 `supplierId=null` | 使用同一套平台组件，按权限显示日账、结算、付款、汇率及报表；不拥有运营写权限。 |
| 供应商主账号 | `role=SUPPLIER` 且有 `supplierId` | 我的报价、交付、收款、团队、代理、应收报表、API 文档、我的资料。 |
| 供应商成员 | `role=SUPPLIER_AGENT` 且有父供应商 `supplierId` | 默认交付、代理、日账；API 文档显式隐藏。部门账单、团队页面需要 `teamAdminGroup.id`；其他业务页面依所授权限决定。 |

管理员 25 个独立路由、账务 5 个标签，以及成员边界详见 `docs/admin-api-checklist.json`。供应商的 14 个既有视图有线上像素基线；管理员、运营、财务和成员没有提供线上登录账号，只能进行恢复源码对照、本地 DOM 结构检查及功能测试，不能声明其像素还原度通过。

维护步骤：先在 catalog 找路由与构建模块，阅读对应 recovered 源码及 `evidence/前端/src/` 的域分类副本；改动后运行 Vue 类型检查、生产构建及对应角色的页面/接口检查。新 SFC 必须保留接口字段、金额精度、日期时区、权限条件、错误状态及可访问属性。

五角色补充验收记录见 `docs/five-role-browser-qa.json` 和 `ui-review/five-role/report.html`。角色名称本身不会授予前端页面；平台账号必须有对应 permissions。登录目的页继续采用原 shell 的工作台，catalog 的 landingRouteFor 另提供自定义权限集合的安全候选回退。

本轮专业权限收紧覆盖旧五角色默认矩阵：运营只能访问归属供应商，并使用 `OperationsReport.js` 的纯数量报表；财务汇率只读、付款需独立审核；自定义角色受 `scopeType` 和 `allowedPermissions` 上限限制。详见 `docs/security-role-matrix.md`。旧 `ui-review/five-role` 是收紧前历史验收，不可作为本轮职责授权结论。
