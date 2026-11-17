// Delivery task receipts (scheduled-tasks) and scheduled task runs (scheduled-task-runs).
import { getLocale, t } from '../../../lib/i18n';
import type { BadgeTone } from '../../../components/ui/types';

// --- Delivery task receipts --------------------------------------------------
export interface DeliveryTask {
  id: string;
  type: string;
  state: string;
  resourceId?: string | null;
  resourceName?: string | null;
  projectName?: string | null;
  itemCount?: number | null;
  needsReview?: boolean;
  createdAt?: string | null;
}

/** The status-sync job a platform admin can configure. */
export interface AutomaticTask { key: string; enabled: boolean; intervalMinutes: number; version: number }

const TASK_TYPES: Record<string, string> = {
  SUBMIT: '上号提交', DISPATCH: '账号交付', OAUTH_COMPLETE: 'OAuth 上号', 'CREDENTIAL-REFRESH': '刷新授权',
  REAUTHORIZATIONS: '重新授权', LIFECYCLE: '账号维护', PROXY_REPLACEMENT: '更换代理',
};
const TASK_STATES: Record<string, string> = {
  SUCCESS: '成功', COMPLETED: '已完成', UPDATED: '已更新', FAILED: '失败', UNKNOWN: '结果待核对', PENDING: '处理中',
  SUBMITTING: '提交中', RUNNING: '处理中', PARTIAL_FAILED: '部分失败', CANCELLED: '已取消',
};
const TASK_STATE_TONES: Record<string, BadgeTone> = {
  SUCCESS: 'success', COMPLETED: 'success', UPDATED: 'success', FAILED: 'danger', UNKNOWN: 'warning', PARTIAL_FAILED: 'warning',
  PENDING: 'info', SUBMITTING: 'info', RUNNING: 'info', CANCELLED: 'neutral',
};

export const deliveryTaskType = (type: string) => t(Object.hasOwn(TASK_TYPES, type) ? TASK_TYPES[type] : type);
export const deliveryTaskState = (state: string) => t(Object.hasOwn(TASK_STATES, state) ? TASK_STATES[state] : state);
export const deliveryTaskTone = (state: string): BadgeTone => TASK_STATE_TONES[state] ?? 'neutral';

// --- Scheduled task runs -----------------------------------------------------
export interface ScheduledTask { key: string; name: string; type?: string; retired?: boolean }

export interface TaskRun {
  id: string;
  triggerKind: 'SCHEDULE' | 'MANUAL' | string;
  state: string;
  resultCode?: string | null;
  startedAt?: string | null;
  finishedAt?: string | null;
  phase?: string | null;
  phaseDate?: string | null;
  completedBatches?: number | null;
  totalBatches?: number | null;
  postingProcessed?: number | null;
  postingPosted?: number | null;
  postingBlocked?: number | null;
  followupPending?: number | null;
  followupDeferred?: number | null;
  followupFailed?: number | null;
  overviewState?: string | null;
}

export interface RunPage { items: TaskRun[]; total: number; page: number; size: number }

const WECOM_RESULTS: Record<string, string> = {
  SENT: '已发送', NO_TODOS: '无待办，未发送', WECOM_TIMEOUT: '发送结果未确认', WECOM_NETWORK_ERROR: '网络异常，发送结果未确认',
  WECOM_HTTP_ERROR: '企业微信请求失败', WECOM_REJECTED: '企业微信拒绝消息', WECOM_INVALID_RESPONSE: '企业微信响应无效',
  WECOM_NOT_CONFIGURED: '未配置企业微信机器人', LEASE_LOST: '执行租约已失效',
};
const RUN_STATES: Record<string, string> = { RUNNING: '运行中', SUCCESS: '成功', FAILED: '失败', TIMED_OUT: '执行超时' };
const OVERVIEW_STATES: Record<string, string> = {
  PENDING: '资源概况待刷新', RUNNING: '资源概况刷新中', SUCCESS: '资源概况已刷新', FAILED: '资源概况刷新失败', SUPERSEDED: '资源概况刷新已合并至后续任务',
};
const MAX_INT = 2147483647;

/** "Skipped L lanes / R resources" for a failed run that only hit lane ownership conflicts. */
function laneConflict(run: TaskRun): string | null {
  if (run.state !== 'FAILED') return null;
  const match = /^PARTIAL_LANE_CONFLICT:L([1-9]\d*):R([1-9]\d*)$/.exec(run.resultCode || '');
  if (!match || match[0] !== run.resultCode) return null;
  const lanes = Number(match[1]);
  const resources = Number(match[2]);
  if (!Number.isSafeInteger(lanes) || !Number.isSafeInteger(resources) || lanes > MAX_INT || resources > MAX_INT) return null;
  return t('已跳过 {0} 组归属冲突 lane / {1} 条资源；其余可采集资源已处理', [lanes.toLocaleString(getLocale()), resources.toLocaleString(getLocale())]);
}

export type RunResult =
  | { kind: 'renewal'; renewed: string; conflicts: string }
  | { kind: 'partial'; detail: string }
  | { kind: 'text'; text: string };

export function runResult(run: TaskRun, taskType: string | undefined): RunResult {
  const renewal = /^QUOTE_RENEWAL:R(\d+):C(\d+)$/.exec(run.resultCode || '');
  if (renewal) return { kind: 'renewal', renewed: renewal[1], conflicts: renewal[2] };
  const partial = laneConflict(run);
  if (partial) return { kind: 'partial', detail: partial };
  const code = run.resultCode || '';
  const text = (taskType === 'WORKBENCH_WECOM_REMINDER' && Object.hasOwn(WECOM_RESULTS, code) ? t(WECOM_RESULTS[code]) : '')
    || (code === 'PRIORITY_SUPPORT_CONFIG_CHANGED' ? t('配置已变化，本轮跳过并等待下一周期') : '')
    || (code === 'PRIORITY_SUPPORT_EVALUATED' ? t('规则检查完成，账号结果见扶持记录') : '')
    || (code === 'COLLECTED_FOLLOWUPS_QUEUED' ? t('采集完成') : '')
    || (Object.hasOwn(RUN_STATES, run.state) ? t(RUN_STATES[run.state]) : run.state);
  return { kind: 'text', text };
}

export function phaseTitle(run: TaskRun): string {
  if (run.phase === 'COLLECT') return t('采集 {0}：{1}/{2} 批', [run.phaseDate || '', run.completedBatches ?? 0, run.totalBatches ?? 0]);
  return run.phase === 'COLLECTED' ? t('日账采集完成') : t('资源概况刷新中');
}

export const overviewStateLabel = (state: string) => (Object.hasOwn(OVERVIEW_STATES, state) ? t(OVERVIEW_STATES[state]) : state);

export const runCode = (run: TaskRun) => (run.resultCode === 'COLLECTION_BUDGET_EXHAUSTED' ? t('达到本轮采集时限，已保存数据，下轮补采') : run.resultCode || '—');
