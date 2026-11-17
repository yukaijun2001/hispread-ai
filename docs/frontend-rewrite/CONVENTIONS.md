# 重写约定（每个页面都要遵守）

参考实现：`src/pages/quotes/`（表格 + 行内编辑 + 抽屉 + 弹窗 + 审核）和 `src/pages/workbench/`。动手前先读这两处和本文件。

## 行为必须与旧版一致

旧实现已从源码删除。接口、权限和文案仍以迁出时核对过的行为为准；导出别名对照留在 `docs/frontend-rewrite/inventory-supplier.md` 附录 A。

- 接口路径、方法、请求体字段、查询参数、轮询间隔：逐项照旧。
- 权限判断（`session.has('x.y')`、`user.supplierId`、`user.role`、`teamAdminGroup`）、状态条件、四眼原则（提交人/创建人不能审核自己的单据）：逐项照旧。
- 校验顺序和提示文案：照旧（文案是词典键，改了会丢英文）。
- 金额一律是字符串，用 `src/lib/money.ts` 精确运算（`formatMoney`、`subtractMoney`、`sumDecimals`、`compareDecimal`、`multiplyMoney`、`convertCurrency`）。不要 `Number()` 金额。
- "今天"是北京时间：`beijingDate()`。旧版明确用浏览器本地日期的地方用 `localToday()`，照旧。
- `version`（乐观锁）、`requestKey`（幂等，`crypto.randomUUID()`）、`expectedSnapshotHash` 等字段照旧发送；结果未知时不自动重试。
- 布局、信息顺序、筛选方式可以按新设计调整；有调整就在报告里写明。

## 代码

- Vue 3 `<script setup lang="ts">`，scoped 样式。数据用 `useApiData(path, { pollMs })`（与旧 `useData` 语义一致，路径可以是 getter，返回 null 表示不请求）；写操作用 `apiFetch / apiPost / apiPut / apiDelete`（`src/lib/api.ts`）；会话用 `useSessionStore()`；刷新全站数据用 `session.refresh()`；提示用 `session.notify(msg, isError)`。
- 下载用 `download()`；上传附件用 `uploadDocument()`；导出结算用 `exportSettlementCsv / exportSettlementsCsv`。
- 跳转站内地址（服务端给的 `targetPath` 等）用 `openTarget()`；普通跳转用 `RouterLink` / `router.push({ path, query })`。读查询参数用 `useRoute().query`。
- 标签：`src/lib/labels.ts`（状态、结算方式、交付方式、能力口径、单位、角色名、任务名、代理地址校验）；项目选项：`src/lib/projects.ts`；通知文案：`src/lib/notifications.ts`；供应商目录（分页取全量）：`useSupplierDirectory()`。
- 组件（`src/components/ui/`）：`Button`(variant primary/secondary/ghost/danger, size, icon, loading)、`IconButton`、`Icon`（名字见 `icons.ts`）、`Badge`(tone)、`StatusBadge`(state)、`Card`、`PageHeader`、`DataTable`(columns + `#cell-<key>` 插槽 + row-click)、`Pagination`(v-model:page/size)、`Select`(options, searchable, multiple, @search)、`SearchInput`、`TextInput`(type, multiline, prefix/suffix, size)、`FormField`(label/hint/error，插槽给 id)、`DateRangePicker`(from/to/minDate/fromLocked, @change)、`Dialog`(size, drawer, #footer)、`Tabs`、`Segmented`、`Notice`(tone, title, #actions)、`EmptyState`、`DetailList`、`Avatar`、`Spinner`、`Popover`；`src/components/ReviewBox.vue`（审核意见 + 通过/退回 + 可选二次确认）。
- **不要用 `v-model` 直接绑原生 `<input type="number">`**：Vue 会转成数字。用 `TextInput`（内部已处理成字符串）。
- 共享目录（`src/components`、`src/lib`、`src/composables`、`src/shell`、`src/stores`、`src/router.ts`、`src/i18n`）不要改。需要的新组件或工具放在自己的页面目录里（如 `src/pages/settlements/components/`）；如果确实值得共享，在报告里提出。

## 样式

- 只用 scoped 样式。文档默认值在 `src/styles/base.css`，不要在页面里再写全局元素选择器。
- class 名继续用 `hs-` 前缀，或放在页面自己的 scoped 样式里。
- 用 token（`src/styles/tokens.css`）：`--hs-text`/`-2`/`-3`/`-4`、`--hs-border`、`--hs-surface-subtle`、`--hs-accent`、`--hs-radius-card` 等。页面结构：`PageHeader` → 白底细边卡片（`Card` 或 `.card` 圆角 16）→ 工具栏（搜索 + 筛选下拉 + 右侧次要按钮）→ 表格 → 分页。主按钮只放最主要的一个动作（炭黑）。
- 表格行高约 48–52px，金额用 `font-variant-numeric: tabular-nums`。

## 国际化

- 文案一律 `t('中文原文')`，键就是中文原文；旧版用过的文案原样复用（旧词典里有的键会自动有英文）。旧词典有些键带尾随空格（如 `'编辑 '`），新代码写不带空格的版本即可，由集成方补齐。
- 新增的中文文案，写进你的报告：`{"中文": "English"}`。不要改 `src/i18n/en-US.js`。

## 验证

- 类型检查：先建自己的副本，`mkdir -p /tmp/fe-<域名> && cd /sessions/youthful-inspiring-hypatia/mnt/hispread-ai/frontend && tar --exclude=node_modules --exclude=dist -cf - . | (cd /tmp/fe-<域名> && tar xf -) && ln -sfn /tmp/fe/node_modules /tmp/fe-<域名>/node_modules && cd /tmp/fe-<域名> && npx vue-tsc --noEmit`（`tsconfig` 覆盖 `src` 下全部 `.vue`，不需要登记路由）。
- 路径：文件读写工具用宿主机路径 `/Users/yukaijun/account-booster/hispread-ai/...`；shell 里同一个仓库挂载在 `/sessions/youthful-inspiring-hypatia/mnt/hispread-ai/...`。
- 不要启动沙箱后端或 Vite（端口由集成方占用）。运行时验证由集成方完成。
