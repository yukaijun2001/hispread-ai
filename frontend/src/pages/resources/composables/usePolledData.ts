import { computed, onScopeDispose, ref, shallowRef, toValue, watch, type MaybeRefOrGetter } from 'vue';
import { apiFetch } from '../../../lib/api';
import { t } from '../../../lib/i18n';
import { useSessionStore } from '../../../stores/session';

const TIMEOUT_MS = 15_000;

/**
 * `useApiData` with a poll interval that may change while mounted (the legacy
 * page stops polling while a search is applied and job-progress views stop
 * once the job is final). 0 disables polling. Otherwise identical semantics:
 * reload on path / account / epoch change, keep data while refreshing, pause
 * polling while hidden or after an error, `mutate` for local changes.
 */
export function usePolledData<T>(path: MaybeRefOrGetter<string | null | undefined>, pollMs: MaybeRefOrGetter<number> = 0) {
  const session = useSessionStore();
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
    window.clearTimeout(pollTimer);
    const interval = toValue(pollMs);
    if (!active || interval <= 0 || !key.value) return;
    pollTimer = window.setTimeout(() => {
      if (document.hidden || error.value) schedulePoll();
      else load(false);
    }, interval);
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
        if (!active || requestKey !== key.value || request.signal.aborted && !timedOut) return;
        error.value = timedOut ? t('加载超时，请重试') : reason.message;
      })
      .finally(() => {
        window.clearTimeout(timer);
        if (controller === request) {
          if (requestKey === key.value) { loading.value = false; refreshing.value = false; }
          inFlight = false;
          schedulePoll();
        }
      });
  }

  watch([key, () => session.epoch, reloadToken], () => {
    controller?.abort();
    controller = undefined;
    inFlight = false;
    window.clearTimeout(pollTimer);
    if (!key.value) {
      data.value = null; error.value = ''; loading.value = false; refreshing.value = false; loadedKey = '';
      return;
    }
    if (loadedKey !== key.value) { data.value = null; loadedKey = ''; }
    load(true);
  }, { immediate: true });

  // A changed interval takes effect immediately (0 stops a scheduled poll).
  watch(() => toValue(pollMs), () => { if (!inFlight) schedulePoll(); });

  const onVisible = () => { if (!document.hidden && !error.value && toValue(pollMs) > 0) load(false); };
  document.addEventListener('visibilitychange', onVisible);

  onScopeDispose(() => {
    active = false;
    controller?.abort();
    window.clearTimeout(pollTimer);
    document.removeEventListener('visibilitychange', onVisible);
  });

  function mutate(update: (current: T) => T) {
    if (data.value === null || loading.value || error.value) return;
    data.value = update(data.value);
    revision++;
  }

  return { data, error, loading, refreshing, reload: () => { reloadToken.value++; }, mutate };
}
