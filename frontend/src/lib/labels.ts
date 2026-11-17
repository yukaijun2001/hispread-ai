// Display labels for server enums.
import { t, translateInContext } from './i18n';
import type { BadgeTone } from '../components/ui/types';

const STATE_LABELS: Record<string, string> = {
  PENDING: '待审核', APPROVED: '已通过', REJECTED: '已退回', CONFIRMED: '已确认', WITHDRAWN: '已撤回',
  SUPERSEDED: '已替换', SUCCEEDED: '付款完成', PROCESSING: '付款处理中', UNKNOWN: '结果待核对', AVAILABLE: '待结算',
  ALLOCATED: '已纳入结算', VOID: '已作废', PARTIAL: '部分付款', PAID: '已付清', UNPAID: '待付款', SUCCESS: '成功',
  DENIED: '已拦截', FAILURE: '失败', DISPUTED: '收款有异议', CANCELLED: '已取消', FAILED: '付款失败',
};

const STATE_TONES: Record<string, BadgeTone> = {
  APPROVED: 'success', CONFIRMED: 'success', SUCCESS: 'success', SUCCEEDED: 'success', PAID: 'success',
  PENDING: 'violet', PROCESSING: 'info', PARTIAL: 'info', ALLOCATED: 'info',
  UNKNOWN: 'warning', UNPAID: 'warning', AVAILABLE: 'warning',
  REJECTED: 'danger', DENIED: 'danger', FAILURE: 'danger', DISPUTED: 'danger', FAILED: 'danger',
  WITHDRAWN: 'neutral', SUPERSEDED: 'neutral', CANCELLED: 'neutral', VOID: 'neutral',
};

export const stateLabel = (state: string) => (STATE_LABELS[state] ? t(STATE_LABELS[state]) : state);
export const stateTone = (state: string): BadgeTone => STATE_TONES[state] ?? 'neutral';

export const SETTLEMENT_MODE_LABELS = (): Record<string, string> => ({ QUOTA: t('额度结算'), ACCOUNT_BUYOUT: t('账号买断'), LEGACY: '—' });
export const DELIVERY_TYPE_LABELS = (): Record<string, string> => ({ ACCOUNT: t('交付账号'), KEY: t('交付密钥'), RELAY: t('中转站'), LEGACY: t('待完善') });
export const CAPACITY_TYPE_LABELS = (): Record<string, string> => ({ ACCOUNT_COUNT: t('账号数量'), ACCOUNT_QUOTA: t('账号额度'), THROUGHPUT: t('调用能力') });
export const CREDENTIAL_MODE_LABELS = (): Record<string, string> => ({
  REFRESH_TOKEN: 'Refresh Token', ACCESS_TOKEN: 'Access Token', SESSION_KEY: 'Session Key', OAUTH: t('OAuth 授权码'),
});
export const CURRENCIES = ['USD', 'CNY', 'USDT'] as const;

export interface PayoutAccount { accountType?: string; providerCode?: string; bank: string }
export function payoutProviderLabel(account: PayoutAccount): string {
  if (account.accountType === 'OKX_USDT') return t('欧意');
  if (account.accountType === 'BINANCE_USDT') return t('币安');
  if (account.providerCode === 'AIRWALLEX' || /^(airwallex|空中云汇)$/i.test(account.bank.trim())) return t('空中云汇');
  return account.bank;
}

/** socks5/http/https URL with host and port 1–65535, optional userinfo, and no path. */
export function isValidProxyUrl(value: string): boolean {
  if (!value || /[\s\u0000-\u001f]/.test(value)) return false;
  const match = value.match(/^(socks5|http|https):\/\/([^/?#]+)$/);
  if (!match) return false;
  try {
    const url = new URL(value);
    const authority = match[2];
    const port = authority.match(/:(\d+)$/)?.[1];
    const userinfo = authority.includes('@') ? authority.slice(0, authority.lastIndexOf('@')) : null;
    return ['socks5:', 'http:', 'https:'].includes(url.protocol) && !!url.hostname && !!port
      && Number(port) >= 1 && Number(port) <= 65535 && (userinfo === null || (!!userinfo && !userinfo.startsWith(':')));
  } catch {
    return false;
  }
}

/** Measurement unit in the current locale (dictionary context `unit`). */
export const unitLabel = (unit: string | null | undefined) => (unit ? translateInContext('unit', unit) : '');

const BUILT_IN_ROLES: Record<string, string> = {
  CCMAX优先级扶持: 'CCMAX优先级扶持', ADMIN: '平台管理员', OPERATOR: '平台运营', FINANCE: '财务人员', SUPPLIER: '供应商', SUPPLIER_AGENT: '团队成员',
};
/** Built-in role names are translated; custom role names are shown as entered. */
export function roleLabel(role: { code: string; name: string; builtIn?: boolean }): string {
  const builtIn = BUILT_IN_ROLES[role.code];
  return role.builtIn !== false && builtIn === role.name ? t(builtIn) : role.name;
}

const TASK_NAMES: Record<string, string> = {
  'CCMAX 日账同步': 'CCMAX 日账同步', 'CCMAX 状态与费用同步': '交付状态同步', 报价自动续期: '报价自动续期', 工作台待办企业微信提醒: '工作台待办企业微信提醒',
};
export const scheduledTaskName = (task: { name: string }) => (Object.hasOwn(TASK_NAMES, task.name) ? t(TASK_NAMES[task.name]) : task.name);

export interface CapacitySpec { capacityType?: string | null; capacityPeriod?: string | null; capacityScope?: string | null; capacityCurrency?: string | null }
export function capacityLabel(spec: CapacitySpec): string {
  if (spec.capacityType === 'ACCOUNT_COUNT') return t('可提供账号数（个）');
  if (spec.capacityType === 'THROUGHPUT') return t('项目合计每分钟调用能力');
  if (spec.capacityType !== 'ACCOUNT_QUOTA') return t('能力口径待配置');
  const period = spec.capacityPeriod === 'DAY' ? t('每日额度') : spec.capacityPeriod === 'MONTH' ? t('每月额度') : t('总额度');
  const scope = spec.capacityScope === 'PER_ACCOUNT' ? t('单账号') : t('全部账号合计');
  return t('{0} · {1}（{2}）', [scope, period, spec.capacityCurrency ?? '']);
}
