// One pause / resume / remove intent against /resource-lifecycle-jobs (port of
// runtime/lifecycle-intent.js). A lost response keeps the intent: it is
// recovered by reading the original job (by id, else by requestKey) and asking
// the server to reconcile it, never by submitting again.
import { ApiError } from '../../../lib/api';
import { t } from '../../../lib/i18n';

const endpoint = '/resource-lifecycle-jobs';
const terminalItemStates = new Set(['PAUSED', 'RESUMED', 'GONE', 'REMOVED', 'SUCCESS', 'COMPLETED', 'DONE', 'FAILED', 'CANCELLED']);
const successStates = new Set(['COMPLETED', 'SUCCESS']);
const failureStates = new Set(['FAILED', 'PARTIAL', 'PARTIAL_FAILED', 'CANCELLED']);

export interface LifecycleItem { resourceId: string; resourceName?: string; targetName?: string; state?: string; errorMessage?: string | null; errorCode?: string | null }
export interface LifecycleReceipt {
  id?: string;
  operationId?: string;
  action?: string;
  state?: string;
  status?: string;
  total?: number;
  unknownCount?: number | string;
  items?: LifecycleItem[];
  createdAt?: string;
}
export type LifecycleOutcome = 'success' | 'failure' | 'pending';
type Get = <T>(path: string) => Promise<T>;
type Post = <T>(path: string, body: unknown) => Promise<T>;

export function lifecycleOutcome(receipt: LifecycleReceipt | null | undefined): LifecycleOutcome {
  const state = receipt?.state || receipt?.status || 'UNKNOWN';
  const unknownItem = Number(receipt?.unknownCount) > 0 || !!receipt?.items?.some((item) => !terminalItemStates.has(item?.state as string));
  if (successStates.has(state) && !unknownItem) return 'success';
  if (failureStates.has(state) && !unknownItem) return 'failure';
  return 'pending';
}

export function lifecycleMessage(receipt: LifecycleReceipt): string {
  const outcome = lifecycleOutcome(receipt);
  if (outcome === 'success') return t('账号维护已完成');
  if (outcome === 'failure') {
    return ['PARTIAL', 'PARTIAL_FAILED'].includes(receipt.state || '')
      ? t('账号维护部分失败，请查看原操作明细')
      : t('账号维护未成功，请查看原操作明细');
  }
  return t('账号维护结果尚未确认，请查询原操作，勿重复提交');
}

export interface LifecycleIntent {
  pending(): { id?: string; requestKey: string } | null;
  receipt(): LifecycleReceipt | null;
  start(action: string, items: unknown[]): Promise<LifecycleReceipt>;
  reconcile(): Promise<LifecycleReceipt>;
}

export function createLifecycleIntent({ post, get, randomUUID = () => crypto.randomUUID() }: { post: Post; get: Get; randomUUID?: () => string }): LifecycleIntent {
  let intent: { id?: string; requestKey: string } | null = null;
  let lastReceipt: LifecycleReceipt | null = null;
  let running = false;

  function accept(receipt: LifecycleReceipt) {
    lastReceipt = receipt;
    if (lifecycleOutcome(receipt) === 'pending') intent = { ...intent!, id: receipt.id || receipt.operationId || intent?.id };
    else intent = null;
    return receipt;
  }
  function rejected(error: unknown): never {
    const details = error instanceof ApiError ? error.details : undefined;
    const status = error instanceof ApiError ? error.status : 0;
    const code = details?.code;
    const originalId = details?.operationId;
    if (originalId) intent = { ...intent!, id: originalId };
    else if (code === 'RESOURCE_LIFECYCLE_UNRESOLVED' || code === 'RESOURCE_JOB_ALREADY_RUNNING') {
      // A hidden or concurrent original stays blocked until it can be queried safely.
    } else if (status >= 400 && status < 500) intent = null;
    throw error;
  }

  return {
    pending: () => (intent ? { id: intent.id, requestKey: intent.requestKey } : null),
    receipt: () => lastReceipt,
    async start(action, items) {
      if (running || intent) throw new Error(t('原账号维护结果尚未确认，请先查询原操作'));
      const body = structuredClone({ action, items, requestKey: randomUUID() });
      intent = { requestKey: body.requestKey };
      lastReceipt = null;
      running = true;
      try { return accept(await post<LifecycleReceipt>(endpoint, body)); }
      catch (error) { return rejected(error); }
      finally { running = false; }
    },
    async reconcile() {
      if (running) throw new Error(t('正在查询原操作，请稍候'));
      if (!intent) throw new Error(t('没有待核对的账号维护操作'));
      running = true;
      try {
        const original = intent.id
          ? await get<LifecycleReceipt>(`${endpoint}/${encodeURIComponent(intent.id)}`)
          : await get<LifecycleReceipt>(`${endpoint}/by-request/${encodeURIComponent(intent.requestKey)}`);
        accept(original);
        if (lifecycleOutcome(original) !== 'pending') return original;
        if (!intent?.id) throw new Error(t('原操作编号尚未返回，请稍后再次查询'));
        return accept(await post<LifecycleReceipt>(`${endpoint}/${encodeURIComponent(intent.id)}/reconcile`, {}));
      } finally { running = false; }
    },
  };
}
