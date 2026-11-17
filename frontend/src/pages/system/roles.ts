// Roles, permission labels and the permission tree of the role editor.
import type { IconName } from '../../components/ui/icons';
import { t } from '../../lib/i18n';

export interface ScopeType { code: string; name?: string | null; allowedPermissions?: string[] }

export interface Role {
  code: string;
  name: string;
  builtIn?: boolean;
  permissions: string[];
  /** Custom roles: the primary identity they may be attached to. Fixed once set. */
  scopeType?: string | null;
  /** Ceiling of grantable permissions (server-provided). */
  allowedPermissions?: string[];
  version?: number;
}

export interface RoleCatalog { roles: Role[]; permissions: string[]; scopeTypes?: ScopeType[] }

export const PRIMARY_ROLES = ['ADMIN', 'OPERATOR', 'FINANCE', 'SUPPLIER', 'SUPPLIER_AGENT'];
export const SUPPLIER_ROLES = ['SUPPLIER', 'SUPPLIER_AGENT'];

/**
 * Additional roles that can be attached to an account whose primary role is
 * `primaryCode`: custom roles of the same scope whose permissions stay inside
 * the primary role's ceiling.
 */
export function attachableRoles(roles: Role[], primaryCode: string): Role[] {
  const primary = roles.find((role) => role.code === primaryCode);
  const allowed = new Set(primary?.allowedPermissions || []);
  return roles.filter((role) => !role.builtIn && role.code !== primaryCode && !!primary?.scopeType
    && role.scopeType === primary.scopeType && role.permissions.every((permission) => allowed.has(permission)));
}

/** The selected additional role codes the server will accept for `primaryCode` (checked again on submit). */
export function submittableRoleCodes(roles: Role[], primaryCode: string, selected: string[]): string[] {
  const primary = roles.find((role) => role.code === primaryCode);
  return selected.filter((code) => {
    const extra = roles.find((role) => role.code === code);
    return !!extra && !extra.builtIn && extra.scopeType === primaryCode
      && extra.permissions.every((permission) => primary?.allowedPermissions?.includes(permission));
  });
}

export const PERMISSION_LABELS = (): Record<string, string> => ({
  'supplier.read': t('查看供应商列表与详情'),
  'supplier.write': t('新建供应商 / 修改资料'),
  'supplier.review': t('审核资料'),
  'supplier.toggle': t('启用 / 停用供应商'),
  'supplier.users': t('管理登录账号'),
  'project.read': t('查看项目列表与详情'),
  'project.write': t('新建 / 编辑 / 启停项目'),
  'account.read': t('查看收款账户'),
  'account.write': t('提交 / 变更收款账户'),
  'account.review': t('审核收款账户'),
  'account.sensitive': t('查看完整收款账号'),
  'quote.read': t('查看报价列表与详情'),
  'quote.write': t('提交 / 编辑报价'),
  'quote.review': t('审核报价'),
  'usage.read': t('查看账务金额记录'),
  'turnover.read': t('查看每日营业额'),
  'turnover.write': t('登记每日营业额'),
  'usage.import': t('录入手工款 / 接收或作废原始金额'),
  'settlement.read': t('查看账务结算单'),
  'settlement.create': t('创建 / 撤回结算单'),
  'settlement.confirm': t('确认 / 提出结算异议'),
  'settlement.export': t('导出结算单'),
  'payment.read': t('查看「付款记录」标签页'),
  'payment.create': t('申请付款'),
  'payment.review': t('审核付款申请'),
  'payment.record': t('人工登记 / 关闭付款'),
  'payment.execute': t('通过资金通道执行付款'),
  'payment.receipt': t('供应商核对到账'),
  'payout.provider.read': t('查看资金通道'),
  'payout.provider.write': t('维护通道配置'),
  'payout.provider.test': t('测试通道连接'),
  'payout.call.read': t('查看付款状态'),
  'payout.reconcile': t('查询通道结果'),
  'exchange_rate.read': t('查看「汇率版本」标签页'),
  'exchange_rate.write': t('新增 / 启停汇率版本'),
  'report.read': t('查看报表'),
  'report.export': t('导出报表 CSV'),
  'notification.publish': t('新建 / 编辑 / 发布通知'),
  'system.users': t('查看与管理账号'),
  'system.roles': t('查看与管理角色'),
  'system.settings': t('查看与修改系统参数'),
  'resource.intake.manage': t('管理 NewAPI 待分配资源'),
  'resource.request.read': t('查看资源原始请求'),
  'resource.sensitive': t('查看资源密钥与模型映射'),
  'resource.read': t('查看本方或授权资源'),
  'resource.write': t('保存和提交交付'),
  'resource.dispatch': t('分发资源'),
  'resource.usage': t('查询资源消耗'),
  'resource.config.read': t('查看资源接口配置'),
  'resource.config.write': t('维护资源接口配置'),
  'resource.config.test': t('检查资源接口连接'),
  'supplier.agent.manage': t('管理团队成员'),
  'proxy.read': t('查看代理配置'),
  'proxy.write': t('维护代理配置'),
  'audit.read': t('查看审计日志'),
  'file.write': t('上传供应商资质附件'),
  'supplier.owner.assign': t('指定负责运营并查看月度绩效'),
  'workbench.read': t('查看工作台'),
  'workbench.tasks.read': t('查看待办'),
  'workbench.monitoring.read': t('查看站点 RPM / TPM'),
  'workbench.monitoring.configure': t('配置工作台展示'),
});

type Section = 'business' | 'funds' | 'system';
interface PageGroup { code: string; name: string; section: Section; icon: IconName; permissions: string[] }

const PAGE_GROUPS = (): PageGroup[] => [
  { code: 'workbench', name: t('工作台'), section: 'business', icon: 'grid', permissions: ['workbench.read', 'workbench.tasks.read', 'turnover.read', 'turnover.write'] },
  { code: 'suppliers', name: t('供应商管理'), section: 'business', icon: 'users', permissions: ['supplier.read', 'supplier.write', 'supplier.review', 'supplier.toggle', 'supplier.users', 'supplier.owner.assign', 'file.write'] },
  { code: 'supplier-accounts', name: t('供应商收款账户'), section: 'business', icon: 'bank', permissions: ['account.read', 'account.write', 'account.review', 'account.sensitive'] },
  { code: 'projects', name: t('项目管理'), section: 'business', icon: 'quote', permissions: ['project.read', 'project.write'] },
  { code: 'quotes', name: t('报价管理'), section: 'business', icon: 'quote', permissions: ['quote.read', 'quote.write', 'quote.review'] },
  {
    code: 'settlements', name: t('账务管理'), section: 'business', icon: 'wallet',
    permissions: ['settlement.read', 'settlement.create', 'settlement.confirm', 'settlement.export', 'usage.read', 'usage.import', 'payment.read', 'payment.create', 'payment.review', 'payment.record', 'payment.execute', 'payment.receipt', 'payout.reconcile', 'exchange_rate.read', 'exchange_rate.write'],
  },
  { code: 'resources', name: t('资源管理'), section: 'business', icon: 'grid', permissions: ['resource.read', 'resource.sensitive', 'resource.intake.manage', 'resource.request.read', 'resource.write', 'resource.dispatch', 'resource.usage'] },
  { code: 'resource-targets', name: t('资源接口配置'), section: 'system', icon: 'settings', permissions: ['resource.config.read', 'resource.config.write', 'resource.config.test'] },
  { code: 'outbound-proxies', name: t('代理配置'), section: 'business', icon: 'settings', permissions: ['proxy.read', 'proxy.write'] },
  { code: 'supplier-agents', name: t('团队成员'), section: 'business', icon: 'users', permissions: ['supplier.agent.manage'] },
  { code: 'reports', name: t('报表中心'), section: 'business', icon: 'audit', permissions: ['report.read', 'report.export'] },
  { code: 'users', name: t('账号管理'), section: 'system', icon: 'users', permissions: ['system.users'] },
  { code: 'roles', name: t('角色与权限'), section: 'system', icon: 'shield', permissions: ['system.roles'] },
  { code: 'notice-admin', name: t('通知管理'), section: 'system', icon: 'bell', permissions: ['notification.publish'] },
  { code: 'settings', name: t('系统参数'), section: 'system', icon: 'settings', permissions: ['system.settings'] },
  { code: 'payout-providers', name: t('资金通道'), section: 'funds', icon: 'bank', permissions: ['payout.provider.read', 'payout.provider.write', 'payout.provider.test'] },
  { code: 'payout-calls', name: t('付款状态'), section: 'funds', icon: 'audit', permissions: ['payout.call.read'] },
  { code: 'audits', name: t('审计日志'), section: 'system', icon: 'audit', permissions: ['audit.read'] },
];

export interface PermissionGroup { code: string; name: string; icon: IconName; items: string[] }
export interface PermissionSection { code: Section; name: string; groups: PermissionGroup[] }

/**
 * The editor's tree: sections → pages → permissions, limited to the permissions
 * the server offers. Unknown permissions land in "其他权限" under 系统管理.
 */
export function permissionTree(available: string[]): PermissionSection[] {
  const groups: Array<PermissionGroup & { section: Section }> = PAGE_GROUPS()
    .map((page) => ({ code: page.code, name: page.name, section: page.section, icon: page.icon, items: page.permissions.filter((p) => available.includes(p)) }))
    .filter((group) => group.items.length);
  const grouped = new Set(groups.flatMap((group) => group.items));
  const other = available.filter((permission) => !grouped.has(permission));
  if (other.length) groups.push({ code: 'other', name: t('其他权限'), section: 'system', icon: 'shield', items: other });
  const sections: Array<[Section, string]> = [['business', t('业务功能')], ['funds', t('资金管理')], ['system', t('系统管理')]];
  return sections
    .map(([code, name]) => ({ code, name, groups: groups.filter((group) => group.section === code) }))
    .filter((section) => section.groups.length);
}
