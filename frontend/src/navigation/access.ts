// Route catalogue and access rules. These mirror the recovered shell exactly
// (see git history of recovered/index-Dnr0i-H9.js): the server still enforces
// permissions, but the console must not offer what the account cannot open.
import { t } from '../lib/i18n';
import type { IconName } from '../components/ui/icons';

export interface SessionUser {
  id: string;
  username: string;
  displayName?: string | null;
  role: string;
  supplierId?: string | null;
  permissions: string[];
  teamAdminGroup?: { id?: string | null } | null;
  mustChangePassword?: boolean;
  onboardingRequired?: boolean;
  supplierRegistrationApprovalEnabled?: boolean;
}

export interface SubmissionCapabilities { supportsProxy?: boolean; [key: string]: unknown }

export const ROUTE_IDS = [
  'workbench', 'suppliers', 'operator-kpi', 'supplier-accounts', 'projects', 'quotes', 'settlements', 'reports',
  'ccmax-resource-analysis', 'api-docs', 'notifications', 'notice-admin', 'users', 'roles', 'settings',
  'scheduled-tasks', 'scheduled-task-runs', 'payout-providers', 'payout-recipients', 'payout-calls', 'audits',
  'deliveries', 'deliveries-pending', 'resources', 'resources-pending', 'resource-targets', 'outbound-proxies',
  'supplier-agents',
] as const;
export type RouteId = typeof ROUTE_IDS[number];

export const isRouteId = (value: string): value is RouteId => (ROUTE_IDS as readonly string[]).includes(value);

interface RouteMeta { label: string; icon: IconName; permission: string }

// Labels are translated lazily so the catalogue can be imported before i18n matters.
const ROUTES: Record<RouteId, { label: string; icon: IconName; permission: string }> = {
  workbench: { label: '工作台', icon: 'grid', permission: 'workbench.read' },
  suppliers: { label: '供应商管理', icon: 'users', permission: 'supplier.read' },
  'operator-kpi': { label: '运营归属', icon: 'users', permission: 'supplier.owner.assign' },
  projects: { label: '项目管理', icon: 'quote', permission: 'project.read' },
  quotes: { label: '报价管理', icon: 'quote', permission: 'quote.read' },
  settlements: { label: '账务管理', icon: 'wallet', permission: 'settlement.read' },
  deliveries: { label: '我的交付', icon: 'quote', permission: 'resource.read' },
  'outbound-proxies': { label: '代理配置', icon: 'settings', permission: 'proxy.read' },
  'supplier-agents': { label: '团队成员', icon: 'users', permission: 'supplier.agent.manage' },
  resources: { label: '资源管理', icon: 'grid', permission: 'resource.read' },
  reports: { label: '报表中心', icon: 'audit', permission: 'report.read' },
  'api-docs': { label: 'API 文档', icon: 'quote', permission: '' },
  'scheduled-tasks': { label: '上号与交付任务', icon: 'audit', permission: 'resource.read' },
  users: { label: '账号管理', icon: 'users', permission: 'system.users' },
  roles: { label: '角色与权限', icon: 'shield', permission: 'system.roles' },
  'notice-admin': { label: '通知管理', icon: 'bell', permission: 'notification.publish' },
  'resource-targets': { label: '资源接口配置', icon: 'settings', permission: 'resource.config.read' },
  settings: { label: '系统参数', icon: 'settings', permission: 'system.settings' },
  'scheduled-task-runs': { label: '同步历史', icon: 'audit', permission: 'system.settings' },
  'payout-calls': { label: '历史出款查询', icon: 'audit', permission: 'payout.call.read' },
  audits: { label: '审计日志', icon: 'audit', permission: 'audit.read' },
  'payout-providers': { label: '资金通道', icon: 'bank', permission: 'payout.provider.read' },
  'payout-recipients': { label: '收款人汇总', icon: 'users', permission: 'account.read' },
  'supplier-accounts': { label: '供应商收款账户', icon: 'bank', permission: 'account.read' },
  'resources-pending': { label: 'NewAPI 待分配', icon: 'grid', permission: 'resource.intake.manage' },
  'deliveries-pending': { label: 'NewAPI 待分配', icon: 'quote', permission: 'resource.intake.manage' },
  'ccmax-resource-analysis': { label: '上号统计', icon: 'audit', permission: '' },
  notifications: { label: '消息通知', icon: 'bell', permission: '' },
};

const SYSTEM_ROUTES: RouteId[] = ['users', 'roles', 'notice-admin', 'resource-targets', 'settings', 'scheduled-task-runs', 'payout-calls', 'audits'];
const FUNDS_ROUTES: RouteId[] = ['payout-providers', 'payout-recipients', 'payout-calls'];

export function routeMeta(route: RouteId): RouteMeta {
  const meta = ROUTES[route];
  return { ...meta, label: t(meta.label) };
}

const has = (user: SessionUser, permission: string) => !permission || user.permissions.includes(permission);
export const isSupplierUser = (user: SessionUser) => !!user.supplierId;
const isSupplierAgent = (user: SessionUser) => isSupplierUser(user) && user.role === 'SUPPLIER_AGENT';

export type SettlementTabId = 'daily' | 'departments' | 'statements' | 'inputs' | 'payments' | 'rates';
export interface SettlementTab { id: SettlementTabId; label: string }

export function settlementTabs(user: SessionUser): SettlementTab[] {
  const supplier = isSupplierUser(user);
  const agent = isSupplierAgent(user);
  const tabs: Array<SettlementTab & { allowed: boolean }> = [
    { id: 'daily', label: t('日账'), allowed: agent || has(user, supplier ? 'settlement.read' : 'usage.read') },
    { id: 'departments', label: t('部门账单'), allowed: supplier && (agent ? !!user.teamAdminGroup?.id : has(user, 'settlement.read')) },
    { id: 'statements', label: t(supplier ? '金额确认' : '结算单'), allowed: !agent && has(user, 'settlement.read') },
    { id: 'inputs', label: t('金额记录'), allowed: !supplier && has(user, 'usage.read') },
    { id: 'payments', label: t(supplier ? '收款记录' : '付款记录'), allowed: !agent && has(user, 'payment.read') },
    { id: 'rates', label: t(supplier ? '参考汇率' : '汇率版本'), allowed: !agent && has(user, 'exchange_rate.read') },
  ];
  return tabs.filter((tab) => tab.allowed).map(({ id, label }) => ({ id, label }));
}

/** The settlement tab a `?tab=` value opens; empty means the first allowed tab. */
export function resolveSettlementTab(user: SessionUser, tab: string): SettlementTab | undefined {
  const tabs = settlementTabs(user);
  const wanted = tab === 'resource-accounting' ? (user.supplierId ? 'statements' : 'daily') : tab;
  return wanted ? tabs.find((item) => item.id === wanted) : tabs[0];
}

/** 上号统计 is a platform report that needs both report and resource access. */
export const canSeeOnboardingStatistics = (user: SessionUser) =>
  !user.supplierId && user.role !== 'SUPPLIER' && has(user, 'report.read') && has(user, 'resource.read');

const canManageAgents = (user: SessionUser) =>
  (user.role === 'SUPPLIER_AGENT' ? !!user.teamAdminGroup?.id : has(user, 'supplier.agent.manage'));

export function isRouteAllowed(user: SessionUser, route: string, tab = ''): boolean {
  if (!isRouteId(route)) return false;
  const supplier = isSupplierUser(user);
  const permitted = route === 'settlements' ? !!resolveSettlementTab(user, tab)
    : route === 'supplier-agents' ? canManageAgents(user)
      : has(user, ROUTES[route].permission);
  if (!permitted) return false;
  if (supplier && (SYSTEM_ROUTES.includes(route) || FUNDS_ROUTES.includes(route)
    || ['projects', 'supplier-accounts', 'resources', 'resources-pending'].includes(route))) return false;
  if (route === 'api-docs' && user.role === 'SUPPLIER_AGENT') return false;
  if (route === 'ccmax-resource-analysis' && !canSeeOnboardingStatistics(user)) return false;
  if (!supplier && ['deliveries', 'deliveries-pending', 'supplier-agents'].includes(route)) return false;
  return true;
}

/** The label an account sees for a route; suppliers see their own wording for shared pages. */
export function routeLabel(user: SessionUser, route: RouteId): string {
  if (!isSupplierUser(user) && route === 'reports' && !has(user, 'usage.read') && !has(user, 'settlement.read')) return t('运营报表');
  if (isSupplierUser(user)) {
    const supplierLabels: Partial<Record<RouteId, string>> = {
      suppliers: '我的资料', quotes: '我的报价', settlements: '收款管理', reports: '应收报表',
      deliveries: '交付列表', 'deliveries-pending': 'NewAPI 待分配',
    };
    if (supplierLabels[route]) return t(supplierLabels[route]!);
  }
  if (route === 'resources') return t('资源列表');
  return routeMeta(route).label;
}

export interface NavItem { key: string; route: RouteId; query?: Record<string, string>; label: string; icon: IconName }
export interface NavSection { id: string; label: string; items: NavItem[] }

/** Business navigation, grouped flat instead of the old accordions. Visibility follows the old sidebar rules. */
export function navigationFor(user: SessionUser, capabilities: SubmissionCapabilities | null): NavSection[] {
  const supplier = isSupplierUser(user);
  const visible = (route: RouteId) => {
    if (route === 'outbound-proxies' && capabilities?.supportsProxy !== true) return false;
    if (route === 'api-docs' && user.role === 'SUPPLIER_AGENT') return false;
    const allowed = route === 'settlements' ? settlementTabs(user).length > 0
      : route === 'supplier-agents' ? canManageAgents(user) : has(user, ROUTES[route].permission);
    if (!allowed) return false;
    return supplier ? !['projects', 'resources', 'suppliers'].includes(route) : !['deliveries', 'supplier-agents'].includes(route);
  };
  const item = (route: RouteId, label = routeLabel(user, route), query?: Record<string, string>): NavItem => ({
    key: query ? `${route}?${new URLSearchParams(query)}` : route, route, query, label, icon: ROUTES[route].icon,
  });
  const settlementItems = visible('settlements')
    ? settlementTabs(user).map((tab) => ({ ...item('settlements', tab.label, { tab: tab.id }), icon: (tab.id === 'rates' ? 'bank' : 'wallet') as IconName }))
    : [];
  const deliveryRoute: RouteId = supplier ? 'deliveries' : 'resources';
  const deliveryItems = visible(deliveryRoute)
    ? [
      ...(has(user, 'resource.read') ? [item(deliveryRoute)] : []),
      ...(has(user, 'resource.intake.manage') ? [item(supplier ? 'deliveries-pending' : 'resources-pending')] : []),
    ]
    : [];
  const pick = (...routes: RouteId[]) => routes.filter(visible).map((route) => item(route));

  const sections: NavSection[] = supplier
    ? [
      { id: 'home', label: '', items: pick('workbench') },
      { id: 'business', label: t('报价与交付'), items: [...pick('quotes'), ...deliveryItems, ...pick('outbound-proxies', 'scheduled-tasks')] },
      { id: 'finance', label: t('收款管理'), items: settlementItems },
      { id: 'team', label: t('团队与报表'), items: pick('supplier-agents', 'reports') },
      { id: 'developer', label: t('开发者'), items: pick('api-docs') },
    ]
    : [
      { id: 'home', label: '', items: pick('workbench') },
      { id: 'suppliers', label: t('供应商'), items: pick('suppliers', 'operator-kpi') },
      { id: 'business', label: t('报价与资源'), items: [...pick('projects', 'quotes'), ...deliveryItems, ...pick('scheduled-tasks', 'outbound-proxies')] },
      { id: 'finance', label: t('账务管理'), items: settlementItems },
      {
        id: 'reports',
        label: t('报表'),
        items: visible('reports')
          ? [
            item('reports', !has(user, 'usage.read') && !has(user, 'settlement.read') ? t('运营报表') : t('应付应收分析')),
            ...(canSeeOnboardingStatistics(user) ? [item('ccmax-resource-analysis')] : []),
          ]
          : [],
      },
      { id: 'system', label: t('系统管理'), items: SYSTEM_ROUTES.filter((route) => has(user, ROUTES[route].permission)).map((route) => item(route)) },
      { id: 'developer', label: t('开发者'), items: pick('api-docs') },
    ];
  return sections.filter((section) => section.items.length > 0);
}

/** Old hash aliases that are still linked from notifications and bookmarks. */
export function normalizeLegacyPath(path: string): string {
  const clean = path.replace(/^#?\//, '');
  if (clean.split('?')[0] === 'tasks') return 'workbench';
  return clean.replace(/^ops(?=\?|$)/, 'resources');
}
