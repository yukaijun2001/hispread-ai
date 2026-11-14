/**
 * Readable index of the recovered supplier platform's role-dependent views.
 *
 * The recovered shell remains the rendering authority. This catalog documents
 * and exposes the same decisions for QA tools and future SFC migrations; it is
 * not an authorization mechanism. The server enforces roles and data scope.
 */
export const ROLE = Object.freeze({
  ADMIN: 'ADMIN',
  OPERATOR: 'OPERATOR',
  FINANCE: 'FINANCE',
  SUPPLIER: 'SUPPLIER',
  MEMBER: 'SUPPLIER_AGENT',
});

export const ROLE_DESCRIPTIONS = Object.freeze({
  ADMIN: '平台管理员：系统配置与全部获授权业务页面。',
  OPERATOR: '平台运营：按授权维护供应商、项目、报价与资源。',
  FINANCE: '财务人员：按授权核对账务、付款、汇率与报表。',
  SUPPLIER: '供应商主账号：维护本供应商资料、报价、交付和收款。',
  SUPPLIER_AGENT: '供应商成员：处理本人或获授权部门的交付与日账。',
});
const route = (id, label, module, permission, audience = 'platform') => Object.freeze({ id, label, module, permission, audience });
export const ROUTE_CATALOG = Object.freeze([
  route('workbench', '工作台', 'Workbench-CVusO4pD.js', 'workbench.read', 'both'),
  route('suppliers', '供应商管理 / 我的资料', 'Suppliers-BquEthXG.js', 'supplier.read', 'both'),
  route('operator-kpi', '运营归属', 'OperatorKpi-NouSWERW.js', 'supplier.owner.assign'),
  route('supplier-accounts', '供应商收款账户', 'SupplierAccounts-CMP57Xp2.js', 'account.read'),
  route('projects', '项目管理', 'Projects-BlZGF-3J.js', 'project.read'),
  route('quotes', '报价管理 / 我的报价', 'Quotes-BL6CyQ42.js', 'quote.read', 'both'),
  route('settlements', '账务管理 / 收款管理', 'Settlements-CJxoFHir.js', 'settlement.read', 'both'),
  route('resources', '资源管理', 'Resources-CXo1DF00.js', 'resource.read'),
  route('resources-pending', 'NewAPI 待分配', 'Resources-CXo1DF00.js', 'resource.intake.manage'),
  route('deliveries', '交付列表', 'Resources-CXo1DF00.js', 'resource.read', 'supplier'),
  route('deliveries-pending', 'NewAPI 待分配', 'Resources-CXo1DF00.js', 'resource.intake.manage', 'supplier'),
  route('outbound-proxies', '代理配置', 'OutboundProxies-BILxGplZ.js', 'proxy.read', 'both'),
  route('supplier-agents', '团队成员', 'SupplierAgents-GOZSRGGY.js', 'supplier.agent.manage', 'supplier'),
  route('resource-targets', '资源接口配置', 'ResourceTargets-DskGxaTi.js', 'resource.config.read'),
  route('ccmax-resource-analysis', 'CCMAX资源分析', 'CcmaxResourceAnalysis-DJRiAnAd.js', ''),
  route('reports', '报表中心 / 应收报表', 'Reports-ChHNVTLt.js', 'report.read', 'both'),
  route('notifications', '消息通知', 'Notifications-BTntRB-A.js', '', 'both'),
  route('api-docs', 'API 文档', 'ApiDocs-BOQ6E5CN.js', '', 'both'),
  route('notice-admin', '通知管理', 'SystemNotices-BwbR9un8.js', 'notification.publish'),
  route('users', '账号管理', 'Users-B5SmzLla.js', 'system.users'),
  route('roles', '角色与权限', 'Roles-BkB5m-qF.js', 'system.roles'),
  route('audits', '审计日志', 'Audits-BxINf5wz.js', 'audit.read'),
  route('settings', '系统参数', 'SystemSettings-CtOVlrw5.js', 'system.settings'),
  route('scheduled-tasks', '上号与交付任务', 'ScheduledTasks-DQG4VARN.js', 'resource.read', 'both'),
  route('scheduled-task-runs', '同步历史', 'ScheduledTaskRuns-DXdXtjvS.js', 'system.settings'),
  route('payout-providers', '资金通道', 'PayoutProviders-D9Kgf-te.js', 'payout.provider.read'),
  route('payout-recipients', '收款人汇总', 'SupplierAccounts-CMP57Xp2.js', 'account.read'),
  route('payout-calls', '付款状态', 'PayoutCallLogs-DpLZK7rw.js', 'payout.call.read'),
]);

export function settlementTabsFor(user) {
  const supplier = Boolean(user?.supplierId);
  const member = supplier && user.role === ROLE.MEMBER;
  const permissions = new Set(user?.permissions || []);
  const has = name => permissions.has(name);
  return [
    { id: 'daily', label: '日账', allowed: member || has(supplier ? 'settlement.read' : 'usage.read') },
    { id: 'departments', label: '部门账单', allowed: supplier && (member ? Boolean(user.teamAdminGroup?.id) : has('settlement.read')) },
    { id: 'statements', label: supplier ? '金额确认' : '结算单', allowed: !member && has('settlement.read') },
    { id: 'inputs', label: '金额记录', allowed: !supplier && has('usage.read') },
    { id: 'payments', label: supplier ? '收款记录' : '付款记录', allowed: !member && has('payment.read') },
    { id: 'rates', label: supplier ? '参考汇率' : '汇率版本', allowed: !member && has('exchange_rate.read') },
  ].filter(tab => tab.allowed);
}

export function accessibleRoutesFor(user) {
  if (!user) return [];
  const supplier = Boolean(user.supplierId);
  const member = supplier && user.role === ROLE.MEMBER;
  const permissions = new Set(user.permissions || []);
  const has = permission => !permission || permissions.has(permission);
  return ROUTE_CATALOG.filter(view => {
    if (view.audience === 'platform' && supplier) return false;
    if (view.audience === 'supplier' && !supplier) return false;
    if (view.id === 'api-docs' && member) return false;
    if (view.id === 'supplier-agents') return member ? Boolean(user.teamAdminGroup?.id) : has(view.permission);
    if (view.id === 'settlements') return settlementTabsFor(user).length > 0;
    if (view.id === 'ccmax-resource-analysis') return !supplier && user.role !== ROLE.SUPPLIER && has('report.read') && has('resource.read') && has('usage.read');
    if (view.id === 'resource-targets') return has(view.permission) || has('workbench.monitoring.configure');
    return has(view.permission);
  });
}

/** Default shell destination and a safe fallback for a custom permission set. */
export function landingRouteFor(user) {
  const views = accessibleRoutesFor(user);
  if (views.some(view => view.id === 'workbench')) return 'workbench';
  const first = views[0];
  if (!first) return null;
  if (first.id === 'settlements') {
    const tab = settlementTabsFor(user)[0];
    return tab ? `settlements?tab=${tab.id}` : null;
  }
  return first.id;
}

/** Menu groups follow the recovered shell; roles never bypass permissions. */
export function navigationGroupsFor(user) {
  const views = accessibleRoutesFor(user);
  const finance = new Set(['payout-providers', 'payout-recipients', 'payout-calls']);
  const system = new Set(['users', 'roles', 'audits', 'notice-admin', 'settings', 'resource-targets', 'scheduled-task-runs']);
  return {
    business: views.filter(view => !finance.has(view.id) && !system.has(view.id) && !['notifications', 'supplier-accounts'].includes(view.id)),
    finance: views.filter(view => finance.has(view.id)),
    system: views.filter(view => system.has(view.id)),
    account: views.filter(view => ['notifications', 'supplier-accounts'].includes(view.id)),
  };
}
