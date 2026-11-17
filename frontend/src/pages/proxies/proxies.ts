// Outbound proxy types and the batch-test helpers: collect every page of the
// current filter, then test with limited concurrency until done or stopped.
import { ApiError } from '../../lib/api';
import { t, translateServerMessage } from '../../lib/i18n';

export interface OutboundProxy {
  id: string;
  name: string;
  endpoint: string;
  protocol: string;
  enabled: boolean;
  testable: boolean;
  editable: boolean;
  /** 0 means no limit. */
  maxResources: number;
  usedResources: number;
  reservedResources: number;
  lastTestState?: 'OK' | 'FAILED' | null;
  lastTestMessage?: string | null;
  lastTestLatencyMs?: number | null;
  lastTestedAt?: string | null;
  supplierName?: string | null;
  supplierCode?: string | null;
  creatorName?: string | null;
  version: number;
}

export interface ProxyPage { items: OutboundProxy[]; total: number }

export type TestFields = Pick<OutboundProxy, 'lastTestState' | 'lastTestMessage' | 'lastTestLatencyMs' | 'lastTestedAt'>;
export type TestResult = OutboundProxy & TestFields;

export const testFields = (result: TestResult): TestFields => ({
  lastTestState: result.lastTestState,
  lastTestMessage: result.lastTestMessage,
  lastTestLatencyMs: result.lastTestLatencyMs,
  lastTestedAt: result.lastTestedAt,
});

export interface BoundResource { name: string; accountName?: string | null; projectName: string; creatorName: string; state: string }

export interface BatchResult { id: string; name: string; state: 'OK' | 'FAILED' | 'REQUEST_FAILED'; message: string }
export type BatchPhase = 'collecting' | 'running' | 'stopping' | 'stopped' | 'complete' | 'error';
export interface BatchProgress {
  phase: BatchPhase;
  collected: number;
  total: number;
  completed: number;
  ok: number;
  failed: number;
  requestFailed: number;
  skipped: number;
  results: BatchResult[];
}

/** "已导入 N 条；跳过 M 条。第 x 行：reason；…" */
export function importSummary(imported: number, skipped: Array<{ line: number; reason: string }>): string {
  const head = t('已导入 {0} 条；跳过 {1} 条。', [imported, skipped.length]);
  const lines = skipped.map(({ line, reason }) => t('第 {0} 行：{1}', [line, translateServerMessage(reason).replace(/[.。]$/u, '')]));
  return lines.length ? `${head} ${lines.join(t('； '))}` : head;
}

/**
 * Every proxy of a filter, 100 per page. The total must stay the same across
 * pages, otherwise the list changed while reading. Returns null when stopped.
 */
export async function collectAllProxies(
  fetchPage: (page: number, size: number) => Promise<ProxyPage>,
  stopped: () => boolean,
  onProgress: (count: number) => void,
): Promise<OutboundProxy[] | null> {
  const collected = new Map<string, OutboundProxy>();
  let total: number | null = null;
  for (let page = 1; total === null || page <= Math.ceil(total / 100); page++) {
    if (stopped()) return null;
    const result = await fetchPage(page, 100);
    if (stopped()) return null;
    if (!Number.isSafeInteger(result.total) || result.total < 0 || !Array.isArray(result.items)) throw new Error(t('代理列表返回不完整，请刷新后重试'));
    if (total !== null && result.total !== total) throw new Error(t('代理列表已变化，请刷新后重新检测'));
    total = result.total;
    for (const proxy of result.items) collected.set(proxy.id, proxy);
    onProgress(collected.size);
  }
  if (collected.size !== total) throw new Error(t('代理列表返回不完整，请刷新后重试'));
  return [...collected.values()];
}

/**
 * Test proxies three at a time. Stopping lets requests already sent finish.
 * A 401/403 calls `abort` so no further requests are started.
 */
export async function testProxies(
  proxies: OutboundProxy[],
  stopped: () => boolean,
  abort: () => void,
  test: (proxy: OutboundProxy) => Promise<TestResult>,
  onResult: (result: BatchResult, updated?: TestResult) => void,
): Promise<void> {
  let next = 0;
  async function worker() {
    while (!stopped() && next < proxies.length) {
      const proxy = proxies[next++];
      try {
        const updated = await test(proxy);
        if (updated.lastTestState !== 'OK' && updated.lastTestState !== 'FAILED') throw new Error(t('检测结果返回不完整'));
        onResult({ id: proxy.id, name: proxy.name, state: updated.lastTestState, message: translateServerMessage(updated.lastTestMessage || '') }, updated);
      } catch (error) {
        if (error instanceof ApiError && (error.status === 401 || error.status === 403)) abort();
        onResult({ id: proxy.id, name: proxy.name, state: 'REQUEST_FAILED', message: error instanceof Error ? error.message : t('检测请求失败') });
      }
    }
  }
  await Promise.all(Array.from({ length: Math.min(3, proxies.length) }, worker));
}
