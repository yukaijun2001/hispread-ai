import { onScopeDispose, ref, shallowRef, toValue, watch, type MaybeRefOrGetter } from 'vue';
import { apiFetch } from '../../../lib/api';
import { t } from '../../../lib/i18n';
import { useSessionStore } from '../../../stores/session';

export interface ProxyOption {
  id: string;
  name: string;
  protocol: string;
  endpoint: string;
  enabled: boolean;
  maxResources: number;
  usedResources: number;
  reservedResources: number;
  version?: number;
  supported?: boolean;
}

/**
 * Every outbound-proxy option, 100 per page. The first page is usable at once
 * (`loading` clears) while later pages keep arriving (`loadingMore`).
 */
export function useDeliveryProxies(enabled: MaybeRefOrGetter<boolean> = true) {
  const session = useSessionStore();
  const data = shallowRef<ProxyOption[]>([]);
  const error = ref('');
  const loading = ref(true);
  const loadingMore = ref(false);
  const attempt = ref(0);
  let controller: AbortController | undefined;

  watch([() => session.user?.id, () => session.epoch, attempt, () => toValue(enabled)], () => {
    controller?.abort();
    data.value = []; error.value = ''; loadingMore.value = false;
    if (!toValue(enabled)) { loading.value = false; return; }
    loading.value = true;
    const request = new AbortController();
    controller = request;
    (async () => {
      const collected = new Map<string, ProxyOption>();
      for (let page = 1; ; page++) {
        const result = await apiFetch<{ items: ProxyOption[]; total: number; size: number }>(`/outbound-proxies/options?page=${page}&size=100`, { signal: request.signal });
        if (request.signal.aborted) return;
        result.items.forEach((item) => collected.set(item.id, item));
        data.value = [...collected.values()];
        loading.value = false;
        const more = page * result.size < result.total && result.items.length > 0;
        loadingMore.value = more;
        if (!more) break;
      }
    })()
      .catch((reason) => { if (!request.signal.aborted) error.value = reason instanceof Error ? reason.message : t('请求失败'); })
      .finally(() => { if (!request.signal.aborted) { loading.value = false; loadingMore.value = false; } });
  }, { immediate: true });

  onScopeDispose(() => controller?.abort());
  return { data, error, loading, loadingMore, retry: () => { attempt.value++; } };
}
