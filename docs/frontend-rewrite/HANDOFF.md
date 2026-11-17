# 前端重写交接清单

接手前先读：本目录的 `CONVENTIONS.md`（必须遵守的约定）、`README.md`（架构与进度），参考实现 `frontend/src/pages/quotes/`。

所有改动都在工作区，**尚未提交**。新增依赖 `vue-router`、`pinia`、`@types/three`，本地需在 `frontend/` 运行一次 `npm ci`。

---

## 一、已完成

### 1. 换皮（第一阶段，已随旧页面删除）
- [x] 调色插件和只作用于旧页面的覆盖样式已删除，由 `src/styles/tokens.css` 与 `src/styles/base.css` 接替。

### 2. 基础设施
- [x] `src/lib/api.ts`：/api 客户端（CSRF、401 和改密事件、下载、上传、登录重试），旧代码也已改为使用它。
- [x] `src/lib/i18n.ts` + `src/i18n/en-US.js`：词典从旧主模块抽出；服务端消息翻译。
- [x] `src/lib/money.ts`：字符串精确金额运算、汇率换算、北京日期。
- [x] `src/lib/labels.ts`、`projects.ts`、`notifications.ts`、`version.ts`。
- [x] `src/stores/session.ts`（Pinia）、`src/composables/useApiData.ts`（与旧 `useData` 语义一致）、`useSupplierDirectory.ts`。
- [x] `src/navigation/access.ts`：路由目录与权限门禁（逐条移植旧外壳规则）、分组导航。
- [x] `src/router.ts`：hash 路由，全部控制台页面都登记在 `pages`。
- [x] 旧主模块已删除。词典、翻译、十进制和 HTTP 客户端在 `src/lib`。

### 3. 设计系统与外壳
- [x] `src/styles/tokens.css`；`src/components/ui/`：Button、IconButton、Icon、Badge、StatusBadge、Card、PageHeader、DataTable、Pagination、Select、SearchInput、TextInput、FormField、DateRangePicker、Dialog（含 `closable`）、Tabs、Segmented、Notice、EmptyState、DetailList、Avatar、Spinner、Popover、ToastHost；`src/components/ReviewBox.vue`。
- [x] `src/shell/`：嵌入式面板布局、分组侧栏、面包屑、命令面板（⌘K / `/`）、通知铃铛、账号菜单（含语言切换）、无权限页、移动端抽屉。
- [x] `src/shell/auth/`：登录/注册（含 three.js 粒子动画与静态回退）、首次建档、语言选择。
- [x] `src/shell/account/`：修改密码（含强制模式）、个人资料（含 API 密钥标签页）。

### 4. 业务页面（`src/pages/`，均已在 `router.ts` 登记）

| 路由 | 页面 | 验证程度 |
| --- | --- | --- |
| workbench | `workbench/WorkbenchPage.vue` | 打开 + 截图 |
| quotes | `quotes/QuotesPage.vue` | **端到端**：提交 → 审核 → 调价 → 审核调价 |
| settlements（6 个标签） | `settlements/SettlementsPage.vue` | 打开 |
| deliveries / deliveries-pending / resources / resources-pending | `resources/ResourcesPage.vue` | 打开 |
| suppliers | `suppliers/SuppliersPage.vue` | 打开 |
| operator-kpi | `suppliers/OperatorKpiPage.vue` | 打开 |
| supplier-accounts / payout-recipients | `suppliers/SupplierAccountsPage.vue` | supplier-accounts 打开；payout-recipients **未打开过**（不在导航里） |
| projects | `projects/ProjectsPage.vue` | 打开 |
| supplier-agents | `team/SupplierAgentsPage.vue` | 打开 |
| outbound-proxies | `proxies/OutboundProxiesPage.vue` | **未打开过**（沙箱数据里 `supportsProxy` 为假，导航不显示） |
| users / roles / audits | `system/UsersPage.vue` 等 | 打开 |
| notice-admin / settings / scheduled-tasks / scheduled-task-runs | `system/*Page.vue` | 打开 |
| reports / ccmax-resource-analysis | `reports/ReportsPage.vue`、`OnboardingStatisticsPage.vue` | 打开 |
| api-docs / notifications | `api-docs/ApiDocsPage.vue`、`notifications/NotificationsPage.vue` | 打开 |
| 登录、注册、首次建档 | `shell/auth/` | **端到端**：注册 → 登录 → 建档 → 进入控制台 |

"打开"的含义：五种角色（供应商主账号、子账号、管理员、运营、财务）从侧栏逐页打开，共 64 个页面次，无脚本错误、无接口 4xx/5xx。没有点击任何写操作。

### 5. 其他
- [x] `vue-tsc --noEmit` 零错误，`npm run build` 通过。
- [x] 新增文案的英文都已写入词典（`node tools/i18n.mjs` 只剩一条误报：源码里的 `\n`）。
- [x] 根目录 `README.md`、本目录 `README.md` 已更新。

---

## 二、未完成

### A. 三个页面仍是旧代码（优先）
- [x] `resource-targets` → `src/pages/system/ResourceTargetsPage.vue`（含 `TargetForm.vue`、`PriorityHistoryDialog.vue`）
- [x] `payout-providers` → `src/pages/system/PayoutProvidersPage.vue`
- [x] `payout-calls` → `src/pages/system/PayoutCallsPage.vue`
- 已在 `router.ts` 登记。线上付款仍只展示关闭说明和历史记录；资源接入保留新增、编辑、检查连接、删除和历史调度只读核对。

### B. 三页完成后删除旧代码
- [x] 删除 `src/recovered/`、`src/runtime/vue-compat.js`、`src/legacy/`、`src/runtime/*.css`。
- [x] 删除 `public/assets/*.css`（保留品牌图 `hispread-ai-*.png`，`BrandLogo.vue` 在用）、`src/theme/console.css`、`scripts/console-palette.mjs` 及 `vite.config.js` 里对它的引用；`index.html` 里旧样式链接一并删除。
- [x] 补上 `src/styles/base.css`：body 字体、box-sizing、按钮/输入/标题/列表的浏览器默认值。
- [x] `request-id.js`（`crypto.randomUUID` 兜底）移到 `src/lib/`，`main.js` 继续引入。
- [x] 删除 `src/views/roles/`。只被旧源码引用的前端契约检查脚本一并删除。

### C. 写操作的运行时验证（没有逐项点过）
按风险排序，每项在沙箱里用对应角色实际提交一次，核对请求载荷和旧版一致：
- [ ] 结算：单张新建（预览 → 带 `expectedSnapshotHash` 确认）、批量新建（预览 → 生成 → 轮询 → 失败重试 → 导出 PDF）、供应商确认/提出异议、作废、撤回、加减金额、CSV 导出（单张和批量）。
- [ ] 付款：申请线下付款（含凭证上传、汇率选择）、独立审核（四眼原则：申请人看不到审核框）、登记线下付款、供应商确认到账、作废/关闭、重新申请。
- [ ] 资源：新建交付、草稿、CCMAX OAuth 生成链接并回填、New API 渠道关联、启停/移除（生命周期，结果未知时只查询不重提）、代理批量替换、intake 审核与分配。
- [ ] 日账：三种视图切换、排序、CCMAX 采集确认、导出；供应商账单/部门账单；金额记录作废；录入应付依据（按报价 / 直接金额）。
- [ ] 汇率新增版本、停用、重新发布。
- [ ] 供应商：新建、审核、启停、指定运营、资质上传、收款账户审核；我的资料编辑。
- [ ] 项目：新建/编辑、大类码值、intake 项目类型。
- [ ] 团队成员：新增成员、部门、项目权限（已修复保存按钮问题）、额度分配。
- [ ] 系统：账号新建/编辑/重置密码/强制下线、角色新建（职责范围上限）、通知新建/发布/撤回、系统参数保存、审计清空。
- [ ] 账号：修改密码（普通和强制两种）、个人资料保存、API 密钥新建/吊销。
- [ ] 移动端宽度（< 768px）：侧栏抽屉、表格横向滚动、弹窗。
- [ ] 英文模式（`?language=en-US`）逐页检查一遍。

### D. 可选的整理
- [ ] `MoneyDisplay.vue` 在 `settlements/ledger`、`settlements/statements`、`resources/components` 各有一份，合并进 `src/components/ui/`。
- [ ] 各领域里还有重复的小组件（CredentialDialog 在 suppliers 和 system 各一份等），可以合并。
- [ ] `src/pages/api-docs/spec.zh-CN.ts` 和 `spec.en-US.ts` 各约 88 KB，可以按当前语言懒加载。

---

## 三、保持了旧版行为、需要产品决定是否修改的问题
见本目录 `README.md` 的"保持旧版行为、但值得后续处理的问题"一节（付款跳转不自动打开新付款、重新授权 PUT/POST 不一致、资源删除无二次确认、角色附加筛选条件不一致等）。

---

## 四、工具（`tools/`，从沙箱复制，路径需按你的环境修改）

| 文件 | 用途 |
| --- | --- |
| `up.sh` | 启动本地 PostgreSQL + 后端 jar（演示数据）+ Vite，执行传入的命令后全部关闭。需要 JDK 17、PostgreSQL 二进制，脚本里的账号密码只是沙箱用的假凭据 |
| `smoke.py <输出目录> <角色...>` | Playwright：登录后从侧栏逐页打开、截图，记录脚本错误和 4xx/5xx。角色：supplier / member / admin / operator / finance |
| `shot.py <输出目录> <角色> name=/#/路由!点击文字!row:CSS选择器` | 按需截图，支持连续点击 |
| `flow_quotes.py`、`flow_auth.py` | 报价写流程、注册建档流程的端到端脚本，可作为其他写流程测试的模板 |
| `i18n.mjs [--apply]` | 找出 `t('…')` 里词典缺失的键；`--apply` 自动补齐只差首尾空格的键 |
| `add_i18n.py '<json>'` | 向词典追加 `{"中文": "English"}`，已存在的跳过 |
| `collide.py` | 检查新组件的 class 名是否会被旧全局样式命中（旧代码删除后就不需要了） |

单次命令有时长上限时，`smoke.py` 一次只跑一两个角色。
