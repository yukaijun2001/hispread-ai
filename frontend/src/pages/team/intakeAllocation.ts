// CC daily onboarding quota allocation. Shares are edited as percentages with
// at most two decimals and sent as basis points (1% = 100). Blank means "share
// the parent's pool", 0 means "allocate nothing". Counts are whole accounts per
// Beijing day: a row's count is floor(parent count × percent / 100).
import { divide100, getLocale, t } from '../../lib/i18n';

export type Category = 'pro' | 'nonPro';
export const CATEGORIES: Category[] = ['pro', 'nonPro'];

export interface AllocationEntry {
  kind: 'GROUP' | 'USER';
  subjectId: string;
  parentGroupId: string | null;
  proBasisPoints: number | null;
  nonProBasisPoints: number | null;
}

export interface AllocationData {
  proLimit: number | null;
  nonProLimit: number | null;
  version: number;
  groups: Array<{ id: string; name: string; allowPro?: boolean; version: number }>;
  members: Array<{ id: string; username: string; displayName?: string | null }>;
  memberships: Array<{ userId: string; groupId: string }>;
  allocations: AllocationEntry[];
  /** `source` is `S` (supplier pool), `G:<groupId>` or `U:<userId>`. */
  usage: Array<{ source: string; category: 'PRO' | 'NON_PRO'; used: number; processing?: number }>;
}

export interface AllocationRow {
  key: string;
  kind: 'GROUP' | 'USER';
  subjectId: string;
  parentGroupId: string | null;
  allowPro?: boolean;
  pro: string;
  nonPro: string;
}

const PERCENT = /^\d+(?:\.\d{1,2})?$/;

export const bpToPercent = (bp: number | null) => (bp === null ? '' : divide100(String(bp)));

/** Basis points of a validated percentage ("12.5" → 1250); blank → null. */
export function percentToBp(value: string): number | null {
  if (value.trim() === '') return null;
  const [whole, fraction = ''] = value.trim().split('.');
  return Number(whole) * 100 + Number(fraction.padEnd(2, '0'));
}

export const isValidPercent = (value: string) => PERCENT.test(value) && percentToBp(value)! <= 10000;

/** Count formatter; null is unlimited. */
export const formatCount = (value: number | null) => (value === null ? t('不限') : value.toLocaleString(getLocale()));

export function rowsFrom(data: AllocationData): AllocationRow[] {
  const byKey = new Map(data.allocations.map((entry) => [`${entry.kind}:${entry.subjectId}`, entry]));
  return [
    ...data.groups.map((group): AllocationRow => {
      const entry = byKey.get(`GROUP:${group.id}`);
      return {
        key: `G:${group.id}`, kind: 'GROUP', subjectId: group.id, parentGroupId: null, allowPro: group.allowPro !== false,
        pro: bpToPercent(entry?.proBasisPoints ?? null), nonPro: bpToPercent(entry?.nonProBasisPoints ?? null),
      };
    }),
    ...data.members.map((member): AllocationRow => {
      const entry = byKey.get(`USER:${member.id}`);
      return {
        key: `U:${member.id}`, kind: 'USER', subjectId: member.id, parentGroupId: entry?.parentGroupId ?? null,
        pro: bpToPercent(entry?.proBasisPoints ?? null), nonPro: bpToPercent(entry?.nonProBasisPoints ?? null),
      };
    }),
  ];
}

/** floor(limit × percent / 100) without floating-point drift for decimal input. */
function share(limit: number, percent: string): number {
  const match = /^(\d+)(?:\.(\d+))?$/.exec(percent.trim());
  if (!match) return Math.floor(limit * Number(percent) / 100);
  const fraction = match[2] ?? '';
  const numerator = BigInt(limit) * BigInt(match[1] + fraction);
  return Number(numerator / (100n * 10n ** BigInt(fraction.length)));
}

/** Calculations over the loaded data and the rows being edited. */
export function allocationMath(data: AllocationData, rows: AllocationRow[]) {
  const category = (field: Category) => (field === 'pro' ? 'PRO' : 'NON_PRO');
  const usageOf = (source: string, field: Category) => data.usage.find((entry) => entry.source === source && entry.category === category(field));

  /** Daily count for a row with a share; null when blank or the parent has no fixed number. */
  function count(row: AllocationRow, field: Category): number | null {
    if (row[field].trim() === '') return null;
    let limit = field === 'pro' ? data.proLimit : data.nonProLimit;
    if (row.parentGroupId) {
      const parent = rows.find((entry) => entry.key === `G:${row.parentGroupId}`);
      limit = parent ? count(parent, field) : null;
    }
    return limit === null ? null : share(limit, row[field]);
  }

  const used = (source: string, field: Category) => usageOf(source, field)?.used;

  /** Pool left for `source` (`S` or a group row key): limit − used − processing − children's unused shares. */
  function remaining(source: string, field: Category): number | null {
    const row = source === 'S' ? null : rows.find((entry) => entry.key === source);
    const limit = source === 'S' ? (field === 'pro' ? data.proLimit : data.nonProLimit) : row ? count(row, field) : null;
    if (limit === null) return null;
    const pending = usageOf(source, field)?.processing ?? 0;
    const reserved = rows
      .filter((child) => child[field].trim() !== '' && (source === 'S' ? child.parentGroupId === null : child.parentGroupId === source.substring(2)))
      .reduce((total, child) => total + Math.max(0, (count(child, field) ?? 0) - (used(child.key, field) ?? 0) - (usageOf(child.key, field)?.processing ?? 0)), 0);
    return Math.max(0, limit - (used(source, field) ?? 0) - pending - reserved);
  }

  return { count, used, remaining };
}

/** Validate rows and build the PUT body entries; returns an error message instead when invalid. */
export function buildAllocations(rows: AllocationRow[]): AllocationEntry[] | string {
  const entries: AllocationEntry[] = [];
  for (const row of rows) {
    if (row.pro === '' && row.nonPro === '') continue;
    for (const field of CATEGORIES) {
      if (row[field] !== '' && !isValidPercent(row[field])) return t('分配比例须在0%至100%之间，最多两位小数');
    }
    entries.push({ kind: row.kind, subjectId: row.subjectId, parentGroupId: row.parentGroupId, proBasisPoints: percentToBp(row.pro), nonProBasisPoints: percentToBp(row.nonPro) });
  }
  const sums = new Map<string, number>();
  for (const entry of entries) {
    for (const field of ['proBasisPoints', 'nonProBasisPoints'] as const) {
      const value = entry[field];
      if (value === null) continue;
      const key = `${entry.parentGroupId ?? 'S'}:${field}`;
      const sum = (sums.get(key) ?? 0) + value;
      sums.set(key, sum);
      if (sum > 10000) return t('同级划拨比例不能超过100%');
    }
  }
  return entries;
}
