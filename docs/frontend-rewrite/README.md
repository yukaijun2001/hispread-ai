# 前端重写（原地、逐页替换）

目标：用 Vue 3 + TypeScript + vue-router + Pinia 重写全部控制台页面，删除 `src/recovered/`（从生产包恢复的编译后代码）和 `src/runtime/vue-compat.js` 适配层。界面采用新的设计系统（中性灰、细描边、炭黑主按钮、蓝色仅作强调），页面布局和流程可以重新设计；接口调用、权限判断、金额精度、日期时区和错误处理必须与旧实现一致。

## 结构

| 位置 | 内容 |
| --- | --- |
| `src/lib/` | `api.ts`（/api 客户端、CSRF、401/改密事件、下载）、`i18n.ts`（语言、翻译、服务端消息翻译）、`money.ts`（字符串十进制运算、汇率换算、日期）、`labels.ts`、`notifications.ts`、`version.ts` |
| `src/i18n/en-US.js` | 中文原文 → 英文词典（从旧主模块抽出） |
| `src/stores/session.ts` | 当前账号、epoch（全局刷新计数）、能力、Toast、账号弹窗开关 |
| `src/composables/useApiData.ts` | 与旧 `useData` 语义一致的数据加载（epoch 重载、15 秒超时、后台轮询、保留旧数据） |
| `src/navigation/access.ts` | 路由目录与访问规则（逐条移植旧外壳），以及新的分组导航 |
| `src/router.ts` | hash 路由；`pages` 登记全部控制台页面 |
| `src/components/ui/` | 设计系统组件，根 class 一律 `hs-` 前缀 |
| `src/shell/` | 新外壳：嵌入式面板、分组侧栏、面包屑、命令面板（⌘K 或 /）、通知、账号菜单 |
| `src/styles/tokens.css` | 设计 token |
| `src/styles/base.css` | 文档默认样式：字体、盒模型、按钮和表单的浏览器默认值 |

## 样式

- 旧样式表、恢复代码和调色插件已删除。`src/styles/base.css` 只设置文档默认值；组件继续使用 scoped 样式和 `hs-` 前缀。
- `public/assets/` 只保留品牌图。

## 迁移一个页面

1. 读 `inventory-supplier.md`（以及旧源码）里该页面的接口、筛选、表格、弹窗、权限和业务规则。
2. 在 `src/pages/<area>/` 写 SFC，数据用 `useApiData` / `apiFetch`，权限用 `session.has()`。
3. 在 `src/router.ts` 的 `pages` 里登记，旧页面自动停用。
4. 用沙箱后端对照旧页面验证（同一账号、同一数据）：接口请求、字段、按钮可见性、空/错/加载态。
5. 更新下面的进度表。

## 进度

全部控制台路由、登录/注册、首次建档、修改密码和个人信息弹窗都已重写。恢复出来的旧运行时、旧样式和调色插件已删除。验证方式：`vue-tsc` 零错误、生产构建通过；沙箱里五种角色逐页打开，无脚本错误、无接口 4xx/5xx；报价完整写流程和注册 → 登录 → 建档流程端到端通过。其余写操作尚未逐项点击验证。

| 路由 | 状态 |
| --- | --- |
| 全部控制台路由 | 已重写，代码在 `src/pages/<领域>/` |

## 迁移时有意改变的行为

- 工作台：待办永远在操作指引前；公告改为顶部横幅；余额改为字符串精确计算（旧版用 `Number()`）。
- 报价：去掉只有 USD 一个选项的币种筛选（请求仍固定 `currency=USD`）。
- 团队成员 → 项目权限弹窗：修正了"保存按钮只在搜索框有内容时出现"。
- 结算：`?id=` 深链在查询参数变化时也会响应（旧版只在首次加载时读取）；付款列表在 `settlementId` 变化时回到第 1 页；批量生成的截止时间为空时给出表单提示（旧版直接抛出 "Invalid time value"）；最近批次只在批量弹窗打开时每 5 秒轮询（旧版在结算页挂载期间一直轮询）。
- 汇率：已发布/待生效/已停用用不同颜色（旧版前两者同色）。
- 资源：不再有移动端卡片列表，窄屏改为横向滚动表格；ResourceForm 一个凭据提交被取消时的提示文案修正（旧版读到了过期状态）。
- 报表：营业额图按日汇总改为精确加法（只用数字定位柱子）；上号统计里"供应商列表读取失败 → 重试"现在真的会重试（旧版调用了不存在的函数）。
- 系统参数："恢复当前值"与首次加载用同一套缺省值（旧版少了 `|| '0'` / `|| '100'`）。
- 通知管理：接收范围标签改为渲染时翻译（旧版在模块加载时翻译一次）。
- 很多旧版没有英文的文案（定时任务、系统参数、API 文档、资源相关弹窗等）补上了英文。

## 保持旧版行为、但值得后续处理的问题

- 付款：申请付款后跳到付款记录时同时带 `id` 和 `settlementId`，旧逻辑在有 `settlementId` 时忽略 `id`，所以不会自动打开新付款。
- 重新授权提交：资源页用 PUT，`ccmax-native` 弹窗用 POST（同一路径）。两处都照旧。
- 资源详情里"删除"没有二次确认；分配 intake 时发送的是列表行的 `version`；intake 时间用浏览器本地时间而非北京时间。
- 角色：用户表单里附加角色的筛选条件前后不一致（`scopeType` 与角色 code 比较），内置角色的 `scopeType` 若与 code 不同会被静默丢弃。审计"清空日志"没有单独的权限判断。
- API 文档：`proxies` 分组说明与当前规范矛盾（该分组已被转换移除，不会显示）；凭据刷新 GET 的响应示例与 schema 不符。
- 批量结算 PDF 里未成功的项一律标为"待生成"。
- `CcmaxBatchDelivery`、`CurrentResourceOverview`、`DailyCreationAnalysis`、`PrioritySupportDialog` 在旧版就没有入口，未迁移。
- 资金管理分组在旧导航里从不显示；新导航保持不显示（`payout-providers` 等只能手输地址进入）。
- `MoneyDisplay.vue` 在 settlements/ledger、settlements/statements、resources 三处各有一份，可以合并进 `src/components/ui`。
