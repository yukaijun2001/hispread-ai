import { onScopeDispose, ref, shallowRef, toValue, watch, type MaybeRefOrGetter } from 'vue';
import { apiFetch } from '../lib/api';
import { t } from '../lib/i18n';
import { useSessionStore } from '../stores/session';

export interface SupplierSummary { id: string; name: string; code: string; state: string; enabled?: boolean; [key: string]: unknown }

/**
 * Every supplier matching `state`/`search`, fetched 100 per page until the
 * reported total is reached. Disabled (`enabled=false`) when `active` is false.
 */
export function useSupplierDirectory(active: MaybeRefOrGetter<boolean>, state: MaybeRefOrGetter<string> = '', search: MaybeRefOrGetter<string> = '') {
  const session = useSessionStore();
  const items = shallowRef<SupplierSummary[] | null>(null);
  const loading = ref(false);
  const error = ref('');
  let controller: AbortController | undefined;

  async function load(signal: AbortSignal) {
    const collected: SupplierSummary[] = [];
    const seen = new Set<string>();
    for (let page = 1; !signal.aborted; page++) {
      const query = new URLSearchParams({ page: String(page), size: '100', state: toValue(state), search: toValue(search) });
      const result = await apiFetch<{ items: SupplierSummary[]; total: number }>(`/suppliers?${query}`, { signal });
      for (const supplier of result.items) {
        if (!seen.has(supplier.id)) { collected.push(supplier); seen.add(supplier.id); }
      }
      if (collected.length >= result.total) break;
      if (!result.items.length) throw new Error(t('供应商目录已变化，请刷新重试'));
    }
    return collected;
  }

  watch([() => toValue(active), () => toValue(state), () => toValue(search), () => session.epoch, () => session.user?.id], () => {
    controller?.abort();
    items.value = null;
    error.value = '';
    loading.value = !!toValue(active);
    if (!toValue(active)) return;
    const request = new AbortController();
    controller = request;
    load(request.signal)
      .then((result) => { if (!request.signal.aborted) items.value = result; })
      .catch((reason: Error) => { if (!request.signal.aborted) error.value = reason.message; })
      .finally(() => { if (!request.signal.aborted) loading.value = false; });
  }, { immediate: true });

  onScopeDispose(() => controller?.abort());
  return { items, loading, error };
}
