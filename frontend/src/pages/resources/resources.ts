// Resource and delivery domain helpers (ported from resourceHelpers and the
// predicates inside the legacy Resources module). Dates are shown in Beijing
// time; money stays a decimal string.
import { getLocale, t, translateServerMessage } from '../../lib/i18n';
import { CREDENTIAL_MODE_LABELS, stateTone } from '../../lib/labels';
import type { BadgeTone, SelectOption } from '../../components/ui/types';

/** A row of `/deliveries` or a `/resources/{id}` record. Only the fields the console reads are typed. */
export interface Resource {
  id: string;
  name: string;
  version: number;
  resourceType?: string | null;
  state?: string | null;
  dispatchState?: string | null;
  dispatchFailureReason?: string | null;
  laneId?: string | null;
  laneState?: string | null;
  operationalState?: string | null;
  upstreamProtocol?: string | null;
  upstreamAccountId?: string | null;
  upstreamChannelId?: string | null;
  readOnly?: boolean;
  projectId?: string | null;
  projectName?: string | null;
  projectCategory?: string | null;
  projectCategoryName?: string | null;
  supplierName?: string | null;
  supplierCode?: string | null;
  creatorName?: string | null;
  accountName?: string | null;
  credentialMode?: string | null;
  credentialConfigured?: boolean;
  settlementMethod?: string | null;
  buyoutAmount?: string | null;
  buyoutCurrency?: string | null;
  usage?: { amount?: string | null; currency?: string | null; [key: string]: unknown } | null;
  resourceData?: Record<string, any> | null;
  submittedAt?: string | null;
  createdAt?: string | null;
  // NewAPI intake rows (`resourceType === 'NEWAPI_INTAKE'`).
  assignmentState?: string | null;
  deliveryState?: string | null;
  onboardingState?: string | null;
  channelType?: number | null;
  memberCount?: number;
  modelSummary?: string[];
  baseUrl?: string | null;
  receivedAt?: string | null;
  sourceKind?: string | null;
  // Creation progress and recovery.
  creationAttempts?: number;
  creationRetrying?: boolean;
  creationFinished?: boolean;
  creationHttpStatus?: number | null;
  creationFailureReason?: string | null;
  creationFailureHint?: string | null;
  deleteAvailable?: boolean;
  oauthRetryAvailable?: boolean;
  manualRecoveryAvailable?: boolean;
  recoveryDispatchId?: string | null;
  [key: string]: any;
}

export interface DeliveryPage { items: Resource[]; total: number; page?: number; size?: number }

type Has = (permission: string) => boolean;

export const enc = encodeURIComponent;

// --- Upstream kinds ------------------------------------------------------------
export const isNewApi = (r: Resource) => !!r.upstreamChannelId || r.upstreamProtocol === 'NEWAPI' || r.resourceType === 'NEWAPI_CHANNEL';
export const isNativeCcmax = (r: Resource) => r.upstreamProtocol === 'CCMAX_NATIVE' || !!r.upstreamAccountId;
export const isIntake = (r: Resource) => r.resourceType === 'NEWAPI_INTAKE';

const NEWAPI_STATE: Record<string, string> = { ACTIVE: '已启用', PAUSED: '已停用', GONE: '已移除' };
export const channelLabel = (r: Resource) => t(NEWAPI_STATE[r.operationalState || ''] || '待查询');
const NATIVE_STATE: Record<string, string> = { ACTIVE: '已启用', PAUSED: '已停用', GONE: '已归档', ERROR: '异常' };
export const nativeStateLabel = (r: Resource) => t(NATIVE_STATE[r.operationalState || ''] || '待查询');

export const CHANNEL_TYPES: Record<string, string> = {
  1: 'OpenAI', 3: 'Azure OpenAI', 14: 'Anthropic', 24: 'Google Gemini', 33: 'AWS Bedrock', 41: 'Google Vertex', 60: 'NewAPI',
};
export const channelTypeLabel = (type: number | null | undefined) => CHANNEL_TYPES[String(type ?? 0)] || t('类型 {0}', [type]);

// --- Health ----------------------------------------------------------------------
export function credentialFailureReason(r: Resource): string | null {
  const health = r.resourceType === 'CCMAX' ? r.resourceData?.health : null;
  if (!health || typeof health !== 'object' || Array.isArray(health)) return null;
  const reason = health.credentialFailureReason;
  return typeof reason === 'string' && reason.trim() ? reason.trim() : null;
}
const normalReason = (text: string | null | undefined) => text?.toLowerCase().replaceAll(' ', '').replaceAll('（', '(').replaceAll('）', ')') || '';
export const isAccessTokenRenewal = (reason: string | null | undefined) => normalReason(reason) === 'accesstoken已过期(等待自动续期)';
export function accountInvalid(r: Resource): boolean {
  const reason = normalReason(credentialFailureReason(r));
  return r.laneState !== 'GONE' && ['账号受限(account_on_hold)', '认证被拒绝(具体原因未确认)', '需要身份验证(kyc)'].some((text) => reason.includes(text));
}
export function healthPaused(r: Resource): boolean {
  const health = r.resourceType === 'CCMAX' ? r.resourceData?.health : null;
  return !!health && typeof health === 'object' && !Array.isArray(health) && health.paused === true;
}
export const pausedResource = (r: Resource) => healthPaused(r) || r.operationalState === 'PAUSED' || r.laneState === 'PAUSED';

// --- Labels ------------------------------------------------------------------------
export const OPERATIONAL_STATUS_LABELS = (): Record<string, string> => ({
  ALL: t('已成功交付'), PAUSED: t('已暂停'), READY: t('就绪'), ACTIVE: t('已启用'), PROVISIONING: t('配置中'), COOLING: t('冷却中'),
  DRAINING: t('退出中'), DEAD: t('已停止'), GONE: t('已移除'), UNKNOWN: t('状态未知'), MISSING_USAGE: t('额度数据缺失'),
  RATE_LIMITED: t('冷却中'), FIVE_HOUR_EXHAUSTED: t('5h 已满'), SEVEN_DAY_EXHAUSTED: t('7d 已满'), INVALID: t('账号失效'),
});
/** Resource-status filter options: the overview statuses plus rate limiting. */
export const LANE_FILTER_LABELS = (): Record<string, string> => ({ ...OPERATIONAL_STATUS_LABELS(), RATE_LIMITED: t('限流冷却') });

const DELIVERY_STATE_LABELS = (): Record<string, string> => ({ DRAFT: t('草稿'), DELIVERED: t('交付成功'), SUBMITTING: t('交付中'), SUBMIT_FAILED: t('提交失败') });
export const DELIVERY_STATE_FILTERS = (): SelectOption[] => [
  { value: '', label: t('全部交付状态') },
  { value: 'DRAFT', label: t('草稿') },
  { value: 'DELIVERY_FAILED', label: t('失败或待核对') },
  { value: 'DELIVERED', label: t('已提交') },
  { value: 'SUBMITTING', label: t('交付中') },
  { value: 'SUBMIT_FAILED', label: t('提交失败') },
];
/** NewAPI intake push states. */
export const IMPORT_STATE_LABELS = (): Record<string, string> => ({
  NOT_IMPORTED: t('待推送'), PENDING: t('推送中'), IMPORTED: t('已推送'), FAILED: t('推送失败'), UNKNOWN: t('待核对'),
});
/** NewAPI intake onboarding states. */
export const CREATION_STATE_LABELS = (): Record<string, string> => ({
  NOT_STARTED: t('待上号'), QUEUED: t('排队中'), RUNNING: t('上号中'), SUCCEEDED: t('已上号'), FAILED: t('上号失败'), UNKNOWN: t('待核对'),
});
export const importBadgeState = (state: string | null | undefined) =>
  state === 'IMPORTED' || state === 'SUCCEEDED' ? 'APPROVED' : state === 'FAILED' ? 'REJECTED' : state === 'UNKNOWN' ? 'UNKNOWN' : 'PENDING';

const LANE_STATES = (): Record<string, { label: string; handling: string }> => ({
  PROVISIONING: { label: t('配置中'), handling: t('等待目标就绪；保留本地交付记录') },
  PAUSED: { label: t('已暂停'), handling: t('停止接收新请求；保留本地交付记录') },
  READY: { label: t('就绪'), handling: t('目标已就绪；保留本地交付记录') },
  COOLING: { label: t('冷却中'), handling: t('目标冷却中；保留本地交付记录') },
  DRAINING: { label: t('退出中'), handling: t('目标退出中；保留本地交付记录') },
  DEAD: { label: t('已停止'), handling: t('目标已停止；保留本地交付记录，允许核对费用') },
  GONE: { label: t('已移除'), handling: t('目标已移除；自动同步停止，历史金额可手动核查') },
});

export const credentialModeOptions = (): SelectOption[] => Object.entries(CREDENTIAL_MODE_LABELS()).map(([value, label]) => ({ value, label }));

/** Badge colour for the legacy badge states used across this page. */
export function badgeTone(state: string): BadgeTone {
  if (state === 'ACCEPTING') return 'success';
  if (state === 'COOLING' || state === 'CLOSED') return 'neutral';
  return stateTone(state);
}

// --- Delivery state -----------------------------------------------------------------
export const dispatchInFlight = (r: Pick<Resource, 'dispatchState'>) => r.dispatchState === 'UNKNOWN' || r.dispatchState === 'PENDING';
export const isTokenCredential = (r: Resource) => ['REFRESH_TOKEN', 'ACCESS_TOKEN', 'SESSION_KEY'].includes(r.credentialMode || '');

export function deliveryLabel(r: Resource): string {
  if (r.dispatchState === 'FAILED') return t('交付失败');
  if (r.dispatchState === 'UNKNOWN' && r.creationFinished) return t('待处理');
  if (r.dispatchState === 'UNKNOWN') return t('待核对');
  if (r.dispatchState === 'PENDING') return r.creationRetrying ? t('正在自动重试') : t('交付中');
  if (r.state === 'DELIVERED' && r.dispatchState !== 'SUCCESS') return t('待创建目标');
  return DELIVERY_STATE_LABELS()[r.state || ''] || r.state || '';
}
export function deliveryBadgeState(r: Resource): string {
  if (r.dispatchState === 'FAILED') return 'FAILURE';
  if (r.dispatchState === 'UNKNOWN') return 'UNKNOWN';
  if (r.dispatchState === 'PENDING' || (r.state === 'DELIVERED' && r.dispatchState !== 'SUCCESS')) return 'PENDING';
  return r.state || '';
}

export const DELIVERY_FAILED = () => t('交付失败');
export const DELIVERY_UNCONFIRMED = () => t('交付结果尚未确认，请等待后刷新交付结果，勿重复提交。');

export interface CreationProgress {
  creationAttempts?: number;
  creationRetrying?: boolean;
  creationFinished?: boolean;
  creationHttpStatus?: number | null;
  creationFailureReason?: string | null;
  creationFailureHint?: string | null;
}

/** Hint for a delivery whose outcome is pending or unknown. */
export function deliveryHint(state: string | null | undefined, progress: CreationProgress = {}): string {
  if (state === 'UNKNOWN' && progress.creationFinished) {
    const base = progress.creationAttempts === 2
      ? t('已自动重试1次，交付暂未完成，自动处理已结束，请协助处理。')
      : t('交付暂未完成，请协助处理。');
    return progress.creationFailureHint ? t('{0} {1} 请先联系平台核对创建结果，勿重复提交。', [base, translateServerMessage(progress.creationFailureHint)]) : base;
  }
  if (state === 'PENDING' && progress.creationRetrying) return t('正在自动重试，请等待处理结果，勿重复提交。');
  if (state === 'PENDING') return t('交付中，请等待后刷新交付结果，勿重复提交。');
  return DELIVERY_UNCONFIRMED();
}

export function creationFailureText(r: CreationProgress): string | null {
  if (r.creationFailureHint?.trim()) return translateServerMessage(r.creationFailureHint.trim());
  if (r.creationFailureReason?.trim()) return translateServerMessage(r.creationFailureReason.trim());
  const status = r.creationHttpStatus;
  return status != null && Number.isInteger(status) && status >= 400 && status <= 599
    ? t(status >= 500 ? 'CCMAX 服务异常（HTTP {0}）' : 'CCMAX 返回 HTTP {0}', [status])
    : null;
}

export function pickProgress(source: Record<string, any>): CreationProgress {
  const progress: CreationProgress = {};
  for (const key of ['creationAttempts', 'creationRetrying', 'creationFinished', 'creationHttpStatus', 'creationFailureReason', 'creationFailureHint'] as const) {
    if (source[key] !== undefined) (progress as Record<string, unknown>)[key] = source[key];
  }
  return progress;
}

/** Label of a dispatch record (`/resources/{id}/dispatches`). */
export function dispatchRecordLabel(record: { state: string } & CreationProgress): string {
  if (record.state === 'SUCCESS') return t('交付成功');
  if (record.state === 'PENDING') return record.creationRetrying ? t('正在自动重试') : t('交付中');
  if (record.state === 'FAILED') return DELIVERY_FAILED();
  return record.state === 'UNKNOWN' && record.creationFinished ? t('待处理') : t('待核对');
}

export function laneBadge(r: Resource): { state: string; label: string } {
  const lane = r.laneState;
  if (lane === 'GONE') return { state: 'WITHDRAWN', label: t('已移除') };
  if (lane === 'DRAINING') return { state: 'PENDING', label: t('退出中') };
  if (accountInvalid(r)) return { state: 'FAILURE', label: t('账号失效') };
  if (lane) {
    const states: Record<string, string> = { PROVISIONING: 'PENDING', READY: 'SUCCESS', COOLING: 'PENDING', DRAINING: 'PENDING', DEAD: 'FAILURE', GONE: 'WITHDRAWN' };
    return { state: states[lane] || 'UNKNOWN', label: LANE_STATES()[lane]?.label || t('未知状态（{0}）', [lane]) };
  }
  return {
    state: r.dispatchState === 'PENDING' ? 'PENDING' : 'UNKNOWN',
    label: r.dispatchState === 'PENDING' ? t('创建中') : r.dispatchState === 'UNKNOWN' ? t('待核对') : r.state === 'DRAFT' ? t('未交付') : r.dispatchState === 'SUCCESS' ? t('待查询') : t('未关联'),
  };
}

// --- Permissions ---------------------------------------------------------------------
export function canDelete(r: Resource, supplierSide: boolean, has: Has): boolean {
  return !!r.deleteAvailable && (r.state === 'DRAFT' || !!r.oauthRetryAvailable) && r.dispatchState === 'FAILED' && !r.laneId
    && (has('resource.write') || (!supplierSide && has('resource.dispatch')));
}
export function canEditDraft(r: Resource, supplierSide: boolean, has: Has): boolean {
  return supplierSide && has('resource.write') && r.state === 'DRAFT' && !r.submittedAt && !r.oauthRetryAvailable
    && !dispatchInFlight(r) && r.dispatchState !== 'SUCCESS' && !r.laneId;
}
export function canManualRecover(r: Resource, supplierSide: boolean, has: Has): boolean {
  return !!r.manualRecoveryAvailable && !!r.recoveryDispatchId && has(supplierSide ? 'resource.write' : 'resource.dispatch');
}
export const canOauthRetry = (r: Resource, supplierSide: boolean, has: Has) => supplierSide && has('resource.write') && !!r.oauthRetryAvailable;
export const canRemove = (r: Resource, supplierSide: boolean, has: Has) => canDelete(r, supplierSide, has) || (canEditDraft(r, supplierSide, has) && !r.dispatchState);

/** Legacy CCMAX lane that can be reauthorized or force-refreshed. */
export function canReauthorize(r: Resource, supplierSide: boolean, has: Has): boolean {
  const reason = credentialFailureReason(r);
  const needsAttention = healthPaused(r) || (!!reason && !isAccessTokenRenewal(reason)) || !['READY', 'COOLING'].includes(r.laneState || '');
  return !r.readOnly && r.resourceType === 'CCMAX' && r.state === 'DELIVERED' && r.dispatchState === 'SUCCESS' && !!r.laneId
    && needsAttention && has('resource.read') && has(supplierSide ? 'resource.write' : 'resource.dispatch');
}

/** Platform dispatcher: no supplier, not a supplier role, may read and dispatch resources. */
export const isPlatformDispatcher = (user: { supplierId?: string | null; role: string; permissions: string[] }) =>
  !user.supplierId && !['SUPPLIER', 'SUPPLIER_AGENT'].includes(user.role) && user.permissions.includes('resource.read') && user.permissions.includes('resource.dispatch');

/** May pause, resume or remove resources at all (supplier side: own supplier with `resource.write`). */
export function mayManageLifecycle(user: { supplierId?: string | null; role: string; permissions: string[] }, supplierSide: boolean): boolean {
  const supplier = supplierSide || !!user.supplierId || ['SUPPLIER', 'SUPPLIER_AGENT'].includes(user.role);
  return user.permissions.includes('resource.read')
    && (supplier ? !!user.supplierId && user.permissions.includes('resource.write') : user.permissions.includes('resource.dispatch'));
}

/** Pause, resume or remove through a lifecycle job. */
export function lifecycleEligible(r: Resource): boolean {
  if (r.readOnly) return false;
  if (isNativeCcmax(r)) return !!r.upstreamAccountId && !['GONE', 'DRAINING'].includes(r.operationalState || '');
  if (isNewApi(r)) return !!r.upstreamChannelId && !['GONE', 'DRAINING'].includes(r.operationalState || '');
  return r.resourceType === 'CCMAX' && r.state === 'DELIVERED' && r.dispatchState === 'SUCCESS' && !!r.laneId && !['GONE', 'DRAINING'].includes(r.laneState || '');
}

/** May switch outbound proxy. */
export function proxyReplaceable(r: Resource): boolean {
  return !r.readOnly && (((isNewApi(r) || isNativeCcmax(r)) && r.operationalState !== 'GONE')
    || (r.resourceType === 'CCMAX' && r.state === 'DELIVERED' && r.dispatchState === 'SUCCESS' && !!r.laneId));
}

/** Proxy search text: ≤128 characters and either free text or host:port (IPv6 in brackets). Anything else searches for nothing. */
export function proxySearchText(value: string): string {
  const text = value.trim();
  if (text.length > 128) return '';
  return !text.includes(':') || /^(?:[^\s:@/?#[\]]+|\[[0-9a-fA-F:.]+(?:%[^\s:@/?#[\]]+)?\]):\d{1,5}$/.test(text) ? text : '';
}

// --- Formatting -------------------------------------------------------------------------
/** YYYY/MM/DD HH:mm in Beijing time. */
export function beijingDateTime(value: string | null | undefined, fallback = '—'): string {
  return value ? new Date(value).toLocaleString(getLocale(), {
    timeZone: 'Asia/Shanghai', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hour12: false,
  }) : fallback;
}

export const pageTitle = (supplierSide: boolean, pendingOnly: boolean) =>
  t(pendingOnly ? 'NewAPI 待分配资源' : supplierSide ? '我的交付' : '资源管理');

export const modelPreview = (models: string[] | undefined, fallback = '—') => {
  const list = models ?? [];
  return list.length ? list.slice(0, 2).join(t('、')) + (list.length > 2 ? t(' 等') : '') : fallback;
};

export const formatCount = (value: number) => value.toLocaleString(getLocale());
