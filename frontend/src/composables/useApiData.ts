import { computed, nextTick, onScopeDispose, ref, shallowRef, toValue, watch, type MaybeRefOrGetter } from 'vue';
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
  let visibleRevision = 0;
  let visibleTimer: number | undefined;

  const yieldToPaint = () => new Promise<void>((resolve) => {
    const finish = () => {
      window.clearTimeout(visibleTimer);
      resolve();
    };
    if (typeof requestAnimationFrame === 'function') requestAnimationFrame(() => finish());
    else visibleTimer = window.setTimeout(finish, 0);
  });

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
    const requestRevision = ++visibleRevision;
    if (!target || inFlight) return;
    inFlight = true;
    window.clearTimeout(pollTimer);
    const request = new AbortController();
    controller = request;
    if (foreground) {
      revision++;
      const keep = loadedKey === requestKey && data.value !== null;
      if (!keep) data.value = null;
      error.value = '';
      loading.value = !keep;
      refreshing.value = keep;
    }
    const acceptedRevision = revision;
    let timedOut = false;
    const timer = window.setTimeout(() => { timedOut = true; request.abort(); }, TIMEOUT_MS);
    const started = foreground ? yieldToPaint() : Promise.resolve();
    started.then(() => {
      if (!active || requestKey !== key.value || requestRevision !== visibleRevision) {
        inFlight = false;
        return undefined;
      }
      return apiFetch<T>(target, { signal: request.signal, background: !foreground });
    })
      .then((value) => {
        if (value === undefined || !active || requestKey !== key.value || acceptedRevision !== revision) return;
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
    visibleRevision++;
    inFlight = false;
    window.clearTimeout(pollTimer);
    if (!key.value) {
      data.value = null; error.value = ''; loading.value = false; refreshing.value = false; loadedKey = '';
      return;
    }
    if (loadedKey !== key.value) { data.value = null; loadedKey = ''; }
    nextTick(() => { if (active && key.value) load(true); });
  }, { immediate: true });

  const onVisible = () => { if (!document.hidden && !error.value) load(false); };
  if (pollMs > 0) document.addEventListener('visibilitychange', onVisible);

  onScopeDispose(() => {
    active = false;
    visibleRevision++;
    controller?.abort();
    window.clearTimeout(pollTimer);
    window.clearTimeout(visibleTimer);
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
