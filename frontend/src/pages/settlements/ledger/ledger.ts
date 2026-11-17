// Shared helpers for the ledger tabs (daily accounting, supplier bills,
// settlement inputs, exchange rates). Amounts stay decimal strings; business
// dates are Beijing calendar days.
import { computed, onScopeDispose, watch, type Ref } from 'vue';
import { useApiData } from '../../../composables/useApiData';
import { getLocale, t } from '../../../lib/i18n';
import { beijingDate } from '../../../lib/money';

export interface Page<T> { items: T[]; total: number; summaryUpdating?: boolean }

/** Today..today in Beijing time. */
export const todayRange = () => { const today = beijingDate(); return { from: today, to: today }; };

/** MM-DD HH:mm in Beijing time, UI locale. */
export function beijingDateTime(value: string): string {
  return new Date(value).toLocaleString(getLocale(), {
    timeZone: 'Asia/Shanghai', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hour12: false,
  });
}

/** Daily-ledger source kinds. */
export const DAILY_SOURCE_LABELS = (): Record<string, string> => ({
  RESOURCE: t('资源金额'),
  MANUAL: t('手工款'),
  EXTERNAL: t('外部金额'),
  CCMAX_OBSERVATION: t('CCMAX 待核对采集'),
  CCMAX: t('CCMAX 模型消耗'),
});

/** Settlement-input source kinds; a missing kind means an external amount. */
export const INPUT_SOURCE_LABELS = (): Record<string, string> => ({ EXTERNAL: t('外部接收'), MANUAL: t('手工录入'), RESOURCE: t('CC lane 资源') });

/**
 * While a loaded summary reports `summaryUpdating`, reload it after 2.5 s, or
 * as soon as the tab becomes visible again.
 */
export function useSummaryRefresh(data: () => { summaryUpdating?: boolean } | null | undefined, reload: () => void) {
  watch(data, (value, _previous, onCleanup) => {
    if (!value?.summaryUpdating) return;
    const run = () => { if (!document.hidden) reload(); };
    const timer = window.setTimeout(run, 2500);
    document.addEventListener('visibilitychange', run);
    onCleanup(() => {
      window.clearTimeout(timer);
      document.removeEventListener('visibilitychange', run);
    });
  }, { immediate: true });
}

/**
 * `useApiData` whose background polling switches on and off with `live`.
 * Two loaders share the path; only the one matching `live` is active.
 */
export function useLiveData<T>(path: () => string | null | undefined, live: () => boolean, pollMs: number) {
  const polled = useApiData<T>(() => (live() ? path() : null), { pollMs });
  const still = useApiData<T>(() => (live() ? null : path()));
  const pick = () => (live() ? polled : still);
  return {
    data: computed(() => pick().data.value),
    error: computed(() => pick().error.value),
    loading: computed(() => pick().loading.value),
    refreshing: computed(() => pick().refreshing.value),
    reload: () => pick().reload(),
  };
}

/** Apply `draft` (trimmed) to `applied` 300 ms after typing stops. */
export function debounceSearch(draft: Ref<string>, applied: Ref<string>, onApply?: () => void) {
  let timer: number | undefined;
  watch([draft, applied], () => {
    window.clearTimeout(timer);
    if (draft.value.trim() === applied.value) return;
    timer = window.setTimeout(() => {
      applied.value = draft.value.trim();
      onApply?.();
    }, 300);
  });
  onScopeDispose(() => window.clearTimeout(timer));
}
