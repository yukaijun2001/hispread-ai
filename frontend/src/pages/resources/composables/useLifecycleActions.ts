import { computed, ref, shallowRef, toValue, type MaybeRefOrGetter } from 'vue';
import { apiFetch, apiPost } from '../../../lib/api';
import { t } from '../../../lib/i18n';
import { useSessionStore } from '../../../stores/session';
import type { SubmissionCapabilities } from './useIntakeAccess';
import { isPlatformDispatcher, lifecycleEligible, mayManageLifecycle, pausedResource, type Resource } from '../resources';
import { createLifecycleIntent, lifecycleMessage, lifecycleOutcome, type LifecycleReceipt } from '../runtime/lifecycleIntent';

export type LifecycleAction = 'PAUSE' | 'RESUME' | 'REMOVE';
export type LifecycleDialogState = { mode: 'records' } | { mode: 'progress'; id: string };
export interface RemoveConfirmation { anchor: HTMLElement; resources: Resource[]; key: string }
export interface LifecycleResult { receipt?: LifecycleReceipt; text: string; failed: boolean }

/**
 * Pause / resume / remove through one lifecycle intent at a time. Suppliers may
 * pause or remove only when the capabilities allow it; batches are for platform
 * dispatchers. A lost response keeps the intent until 查询原维护结果 settles it.
 */
export function useLifecycleActions(options: {
  supplierSide: boolean;
  capabilities: MaybeRefOrGetter<SubmissionCapabilities | null | undefined>;
  /** Clears the list selection after a submitted action. */
  onSubmitted: () => void;
}) {
  const session = useSessionStore();
  const user = computed(() => session.user!);
  const may = computed(() => mayManageLifecycle(user.value, options.supplierSide));
  const supplierScope = computed(() => options.supplierSide || !!user.value.supplierId);
  const mayPause = computed(() => may.value && (!supplierScope.value || toValue(options.capabilities)?.allowCcmaxPause === true));
  const mayRemove = computed(() => may.value && (!supplierScope.value || toValue(options.capabilities)?.allowCcmaxSafeRemoval === true));
  const mayRecords = computed(() => may.value && (!supplierScope.value || mayPause.value || mayRemove.value));
  const maySelect = computed(() => !options.supplierSide && isPlatformDispatcher(user.value));

  const intent = createLifecycleIntent({ get: (path) => apiFetch(path), post: (path, body) => apiPost(path, body) });
  const busy = ref(false);
  const pending = shallowRef(intent.pending());
  const result = shallowRef<LifecycleResult | null>(null);
  const confirmation = shallowRef<RemoveConfirmation | null>(null);
  const dialog = shallowRef<LifecycleDialogState | null>(null);
  let running = false;

  const receiptResult = (receipt: LifecycleReceipt): LifecycleResult => ({ receipt, text: lifecycleMessage(receipt), failed: lifecycleOutcome(receipt) !== 'success' });

  async function run(action: LifecycleAction, resources: Resource[]): Promise<boolean> {
    if (running || pending.value || !resources.length || (resources.length > 1 && !maySelect.value) || (action === 'REMOVE' ? !mayRemove.value : !mayPause.value)) return false;
    running = true;
    try {
      const items = resources.map((resource) => ({ resourceId: resource.id, version: resource.version }))
        .sort((a, b) => a.resourceId.localeCompare(b.resourceId));
      busy.value = true;
      const receipt = await intent.start(action, items);
      result.value = receiptResult(receipt);
      confirmation.value = null;
      options.onSubmitted();
      session.refresh();
      return true;
    } catch (error) {
      confirmation.value = null;
      result.value = { text: intent.pending() ? t('账号维护结果尚未确认，请查询原操作，勿重复提交。') : (error as Error).message, failed: true };
      return false;
    } finally {
      pending.value = intent.pending();
      running = false;
      busy.value = false;
    }
  }

  async function queryPending() {
    if (running || !pending.value) return;
    running = true;
    busy.value = true;
    try {
      result.value = receiptResult(await intent.reconcile());
      options.onSubmitted();
      session.refresh();
    } catch (error) {
      result.value = { text: t('原操作查询未完成：{0}。请保留原记录，勿重复提交。', [(error as Error).message]), failed: true };
    } finally {
      pending.value = intent.pending();
      running = false;
      busy.value = false;
    }
  }

  /** Toggles the remove confirmation anchored at `anchor`. */
  function askRemove(anchor: HTMLElement, resources: Resource[], key: string) {
    if (running || !mayRemove.value || !resources.length || (resources.length > 1 && !maySelect.value)) return;
    confirmation.value = confirmation.value?.anchor === anchor ? null : { anchor, resources, key };
  }
  function cancelRemove() { if (!running) confirmation.value = null; }
  async function confirmRemove() {
    const current = confirmation.value;
    if (current && await run('REMOVE', current.resources)) confirmation.value = null;
  }

  /** Row pause / resume / remove are offered for eligible resources only. */
  const rowEligible = (resource: Resource) => may.value && lifecycleEligible(resource);

  /** Batch state of the selected rows: only uniformly paused or running rows can be toggled together. */
  function batch(selected: Resource[]) {
    const eligible = selected.filter(lifecycleEligible);
    const paused = eligible.filter(pausedResource).length;
    return { eligible, mixed: paused > 0 && paused < eligible.length, allPaused: eligible.length > 0 && paused === eligible.length };
  }

  function openRecords() { confirmation.value = null; dialog.value = { mode: 'records' }; }
  function openProgress(id: string) { dialog.value = { mode: 'progress', id }; }

  return {
    may, mayPause, mayRemove, mayRecords, maySelect, busy, pending, result, confirmation, dialog,
    run, queryPending, askRemove, cancelRemove, confirmRemove, rowEligible, batch, openRecords, openProgress,
  };
}

export type LifecycleActions = ReturnType<typeof useLifecycleActions>;
