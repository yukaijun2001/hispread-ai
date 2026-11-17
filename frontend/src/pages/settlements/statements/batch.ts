// Batch settlement types and the per-supplier aggregation behind the batch
// wizard. Amounts are decimal strings summed exactly; totals are keyed by currency.
import { sumDecimals } from '../../../lib/money';

/** Amount per currency, e.g. { USD: '120.5', CNY: '80' }. */
export type Totals = Record<string, string>;

/** One supplier × project × currency group that can be settled in the period. */
export interface BatchCandidate {
  supplierId: string;
  supplierName: string;
  projectId: string;
  projectName: string;
  currency: string;
  sourceCount: number;
  blockedCount: number;
  total: string;
}

export interface BatchCandidates { items: BatchCandidate[]; summaryUpdating?: boolean; incompleteDays?: number }

/** A row of GET /settlement-batches. */
export interface BatchSummary {
  id: string;
  periodStart: string;
  periodEnd: string;
  supplierCount: number;
  state: string;
  successCount: number;
  failedCount: number;
}

export interface BatchItem {
  id: string;
  supplierName: string;
  projectName: string;
  currency: string;
  sourceCount: number;
  total: string;
  /** READY | SUCCEEDED | FAILED */
  state: string;
  error?: string | null;
  settlementId?: string | null;
}

/** A batch: PREVIEW → QUEUED → COMPLETED. */
export interface Batch extends BatchSummary {
  readyCount: number;
  totals: Totals;
  incompleteDays: number;
  confirmationDeadline: string;
  items?: BatchItem[];
}

/** Candidates folded per supplier. Blocked groups count as items to handle and add nothing to the totals. */
export interface SupplierTotal { id: string; name: string; count: number; blocked: number; totals: Totals }

/** Add `amounts` into `target` exactly, currency by currency. */
export function addTotals(target: Totals, amounts: Totals): Totals {
  for (const [currency, amount] of Object.entries(amounts)) target[currency] = sumDecimals([target[currency] || '0', amount]);
  return target;
}

/** Fold candidate groups into one row per supplier, in first-seen order. */
export function aggregateSuppliers(items: BatchCandidate[]): SupplierTotal[] {
  const bySupplier = new Map<string, SupplierTotal>();
  for (const item of items) {
    const row = bySupplier.get(item.supplierId) || { id: item.supplierId, name: item.supplierName, count: 0, blocked: 0, totals: {} };
    row.count += item.blockedCount ? 0 : item.sourceCount;
    row.blocked += item.blockedCount;
    if (!item.blockedCount) row.totals[item.currency] = sumDecimals([row.totals[item.currency] || '0', item.total]);
    bySupplier.set(row.id, row);
  }
  return [...bySupplier.values()];
}
