// CCMAX resource overview and lifecycle-job labels.
import { getLocale, t } from '../../lib/i18n';

// --- Lifecycle jobs ------------------------------------------------------------
export interface LifecycleJobItem { resourceId: string; resourceName?: string; targetName?: string; state: string; errorMessage?: string | null }
export interface LifecycleJob { id: string; action?: string; total: number; state: string; items: LifecycleJobItem[]; createdAt?: string }

export const LIFECYCLE_ITEM_LABELS = (): Record<string, string> => ({
  PENDING: t('等待提交'), SUBMITTING: t('提交中'), UNKNOWN: t('结果待核对'), DRAINING: t('正在移除'),
  PAUSED: t('已停用'), RESUMED: t('已恢复'), GONE: t('已移除'), FAILED: t('失败'),
});

/** 停用 / 恢复 / 移除, from the job action or else the first item state. */
export function jobActionLabel(action: string | null | undefined, items: Array<{ state?: string }> | null | undefined): string {
  const kind = action || (items || []).map((item) => item.state).find(Boolean);
  return t(kind === 'PAUSE' || kind === 'PAUSED' ? '停用'
    : kind === 'RESUME' || kind === 'RESUMED' ? '恢复'
      : kind === 'REMOVE' || kind === 'GONE' || kind === 'DRAINING' ? '移除' : '操作');
}

export const jobStateLabel = (state: string) => (state === 'RUNNING' ? t('处理中')
  : state === 'NEEDS_REVIEW' || state === 'UNKNOWN' ? t('需要人工核对')
    : state === 'FAILED' ? t('失败')
      : state === 'PARTIAL' || state === 'PARTIAL_FAILED' ? t('部分失败')
        : state === 'COMPLETED' ? t('已完成') : t('处理结束'));

// --- Overview ------------------------------------------------------------------
export interface QuotaWindow {
  averageUsedPercent: number | null;
  reportedCount: number;
  exhaustedCount: number;
  nextResetAt?: string | null;
  remainingEquivalent: number | null;
  missingCount: number;
}
export interface ResourceOverview {
  counts: Record<string, number> & { total: number; paused?: number; unknownState: number };
  dailyConsumption?: { businessDate: string; amount: string | null; reportedResourceCount: number } | null;
  fiveHour: QuotaWindow;
  sevenDay: QuotaWindow;
}

export const count = (value: number, digits = 0) => value.toLocaleString(getLocale(), { maximumFractionDigits: digits });

/** Time until the next window reset, rounded up to minutes. */
export function resetText(value: string | null | undefined): string {
  if (!value || !Number.isFinite(Date.parse(value))) return t('重置时间未提供');
  const minutes = Math.ceil((Date.parse(value) - Date.now()) / 60_000);
  if (minutes <= 0) return t('等待重置更新');
  if (minutes < 60) return t('最近 {0} 分钟后重置', [minutes]);
  if (minutes < 1440) return t('最近 {0} 小时后重置', [count(minutes / 60, 1)]);
  return t('最近 {0} 天后重置', [count(minutes / 1440, 1)]);
}

export interface OverviewMetric { key: string; status: string; label: string; tone?: 'danger' | 'warm' }
export const OVERVIEW_METRICS = (): OverviewMetric[][] => [
  [{ key: 'ready', status: 'READY', label: t('就绪 / 总数') }, { key: 'active', status: 'ACTIVE', label: t('已启用') }, { key: 'provisioning', status: 'PROVISIONING', label: t('配置中') }],
  [{ key: 'invalid', status: 'INVALID', label: t('账号失效'), tone: 'danger' }, { key: 'dead', status: 'DEAD', label: t('已停止') }],
  [{ key: 'cooling', status: 'COOLING', label: t('冷却中'), tone: 'warm' }, { key: 'gone', status: 'GONE', label: t('已移除') }],
  [{ key: 'missingUsage', status: 'MISSING_USAGE', label: t('额度数据缺失') }, { key: 'draining', status: 'DRAINING', label: t('退出中') }],
];
