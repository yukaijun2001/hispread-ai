import { computed, onScopeDispose, ref, shallowRef, toValue, watch, type MaybeRefOrGetter } from 'vue';
import { apiFetch } from '../lib/api';
import { t } from '../lib/i18n';
import { useSessionStore } from '../stores/session';

const TIMEOUT_MS = 15_000;

/**
 * Load JSON from `path` and keep it fresh.
 * - Reloads when the path, the account or the session epoch changes.
 * - A reload keeps the previous data visible (`refreshing`) instead of blanking it.
 * - With `pollMs`, refetches in the background while the tab is visible; polling
 *   pauses after an error until `reload()` succeeds.
 * - Errors keep the last good data.
 */
export function useApiData<T>(path: MaybeRefOrGetter<string | null | undefined>, options: { pollMs?: number } = {}) {
  const session = useSessionStore();
  const pollMs = options.pollMs ?? 0;
  const data = shallowRef<T | null>(null);
  const error = ref('');
  const loading = ref(false);
  const refreshing = ref(false);
  const reloadToken = ref(0);
  const key = computed(() => {
    const value = toValue(path);
    return value ? `${session.user?.id}:${value}` : '';
  });

  let loadedKey = '';
  let revision = 0;
  let inFlight = false;
  let controller: AbortController | undefined;
  let pollTimer: number | undefined;
  let active = true;

  const schedulePoll = () => {
    if (!active || pollMs <= 0) return;
    window.clearTimeout(pollTimer);
    pollTimer = window.setTimeout(() => {
      if (document.hidden || error.value) schedulePoll();
      else load(false);
    }, pollMs);
  };

  function load(foreground: boolean) {
    const target = toValue(path);
    const requestKey = key.value;
    if (!target || inFlight) return;
    inFlight = true;
    window.clearTimeout(pollTimer);
    const request = new AbortController();
    controller = request;
    const requestRevision = revision + (foreground ? 1 : 0);
    if (foreground) {
      revision = requestRevision;
      const keep = loadedKey === requestKey && data.value !== null;
      if (!keep) data.value = null;
      error.value = '';
      loading.value = !keep;
      refreshing.value = keep;
    }
    let timedOut = false;
    const timer = window.setTimeout(() => { timedOut = true; request.abort(); }, TIMEOUT_MS);
    apiFetch<T>(target, { signal: request.signal, background: !foreground })
      .then((value) => {
        if (!active || requestKey !== key.value || requestRevision !== revision) return;
        data.value = value;
        loadedKey = requestKey;
        error.value = '';
      })
      .catch((reason: Error) => {
        if (!active || requestKey !== key.value) return;
        error.value = timedOut ? t('加载超时，请重试') : reason.message;
      })
      .finally(() => {
        window.clearTimeout(timer);
        if (requestKey === key.value) { loading.value = false; refreshing.value = false; }
        inFlight = false;
        schedulePoll();
      });
  }

  watch([key, () => session.epoch, reloadToken], () => {
    controller?.abort();
    inFlight = false;
    window.clearTimeout(pollTimer);
    if (!key.value) {
      data.value = null; error.value = ''; loading.value = false; refreshing.value = false; loadedKey = '';
      return;
    }
    if (loadedKey !== key.value) { data.value = null; loadedKey = ''; }
    load(true);
  }, { immediate: true });

  const onVisible = () => { if (!document.hidden && !error.value) load(false); };
  if (pollMs > 0) document.addEventListener('visibilitychange', onVisible);

  onScopeDispose(() => {
    active = false;
    controller?.abort();
    window.clearTimeout(pollTimer);
    document.removeEventListener('visibilitychange', onVisible);
  });

  /** Apply a local change to loaded data without contacting the server. */
  function mutate(update: (current: T) => T) {
    if (data.value === null || loading.value || error.value) return;
    data.value = update(data.value);
    revision++;
  }

  return { data, error, loading, refreshing, reload: () => { reloadToken.value++; }, mutate };
}
