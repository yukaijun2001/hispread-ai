// CCMAX plan and quota windows reported in `resourceData.usage`. Times are
// shown in Beijing time; a missing value reads 未提供.
import { getLocale, t } from '../../lib/i18n';

export type UsageWindowKey = 'fiveHour' | 'sevenDay' | 'sevenDayFable';
export interface UsageWindow { key: UsageWindowKey; short: string; label: string }

export const USAGE_WINDOWS = (): UsageWindow[] => [
  { key: 'fiveHour', short: '5h', label: t('5 小时用量') },
  { key: 'sevenDay', short: '7d', label: t('7 天用量') },
  { key: 'sevenDayFable', short: 'Fable 7d', label: t('7 天 Fable 用量') },
];

export type UsageRecord = Record<string, unknown>;

export const asRecord = (value: unknown): UsageRecord | null =>
  (typeof value === 'object' && value && !Array.isArray(value) ? value as UsageRecord : null);
export const asText = (value: unknown): string | null => (typeof value === 'string' && value.trim() ? value : null);
/** A finite, non-negative percentage. */
export const asPercent = (value: unknown): number | null => (typeof value === 'number' && Number.isFinite(value) && value >= 0 ? value : null);
export function asTime(value: unknown): number | null {
  const text = asText(value);
  if (!text) return null;
  const time = Date.parse(text);
  return Number.isFinite(time) ? time : null;
}

/** YYYY/MM/DD HH:mm in Beijing time, or 未提供. */
export function usageTime(value: unknown): string {
  const time = asTime(value);
  return time === null ? t('未提供') : new Date(time).toLocaleString(getLocale(), {
    timeZone: 'Asia/Shanghai', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hour12: false,
  });
}

/** When a window was observed: its own timestamp, else the probe time. */
export function observedAt(usage: UsageRecord, key: UsageWindowKey): unknown {
  const value = usage[`${key === 'sevenDayFable' ? 'fable' : key}ObservedAt`];
  return asTime(value) === null ? usage.probedAt : value;
}

export function planLabel(usage: UsageRecord): string {
  const plan = asRecord(usage.plan);
  return (plan && (asText(plan.label) || asText(plan.tier))) || t('套餐未提供');
}

export const percentNumber = (value: number) => value.toLocaleString(getLocale(), { maximumFractionDigits: 6 });
export const usedText = (percent: number | null) => (percent === null ? t('未提供') : t('已用 {0}%', [percentNumber(percent)]));

/** Fable fields present: show the third window. */
export const hasFable = (usage: UsageRecord) =>
  ['sevenDayFablePercent', 'sevenDayFableResetsAt', 'fableBlockedUntil'].some((key) => usage[key] !== null && usage[key] !== undefined);

/** Mini-bar level: high ≥ 90, medium ≥ 75. */
export const usageLevel = (percent: number | null) => (percent === null ? 'missing' : percent >= 90 ? 'high' : percent >= 75 ? 'medium' : 'normal');
