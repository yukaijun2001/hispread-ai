// Report center types and month-range helpers. The month range follows the
// browser's local calendar, as the old page did.
import { t } from '../../lib/i18n';

export type ReportTab = 'overview' | 'monthly' | 'receivables';
export type DrillScope = 'CONFIRMED' | 'LIVE';

export interface SummaryRow {
  currency: string;
  supplierCount: number;
  confirmedPayable: string;
  paidAmount: string;
  outstandingAmount: string;
  receivedAmount: string;
  settlementCount: number;
  disputedCount: number;
}

export interface MonthlyRow {
  month: string;
  currency: string;
  originalAmount: string;
  finalPayable: string;
  confirmedPayable: string;
  paidAmount: string;
  outstandingAmount: string;
  settlementCount: number;
  supplierCount: number;
}

export interface ReceivableRow {
  supplierId: string;
  supplierName: string;
  supplierCode: string;
  currency: string;
  receivableAmount: string;
  paidAmount: string;
  outstandingAmount: string;
  receivedAmount: string;
  unconfirmedReceiptAmount: string;
  unpaidCount: number;
  disputedCount: number;
  earliestUnpaidDate?: string | null;
}

export interface OverviewData { summary: SummaryRow[]; monthly: MonthlyRow[]; suppliers: ReceivableRow[] }

export interface ReportSettlement {
  id?: string;
  code: string;
  supplierName: string;
  projectName: string;
  periodStart: string;
  periodEnd: string;
  total: string;
  paidAmount: string;
  outstandingAmount: string;
  currency: string;
  state: string;
}

/** Overrides for a drill-down query; anything left out falls back to the page filters. */
export interface DrillFilter { from?: string; to?: string; currency?: string; supplierId?: string }

export interface TurnoverRecord { businessDate: string; siteName: string; currency: string; amount: string; note?: string | null }
/** One day's turnover in one currency; `value` is an exact decimal string. */
export interface TurnoverPoint { date: string; value: string }

export interface OperationsData {
  supplierCount?: number;
  quoteCount?: number;
  pendingQuoteCount?: number;
  approvedQuoteCount?: number;
  resourceCount?: number;
  projects?: Array<{ projectId?: string; projectName: string; quoteCount: number; resourceCount: number }>;
  suppliers?: Array<{ supplierId?: string; supplierName: string; quoteCount: number; resourceCount: number }>;
}

const pad = (value: number) => String(value).padStart(2, '0');
const yearMonth = (date: Date) => `${date.getFullYear()}-${pad(date.getMonth() + 1)}`;

/** Five months before the current local month (Date#setMonth semantics). */
export function defaultFromMonth(): string {
  const date = new Date();
  date.setMonth(date.getMonth() - 5);
  return yearMonth(date);
}
export const defaultToMonth = () => yearMonth(new Date());

export function monthLabel(value: string): string {
  const [year, month] = value.split('-');
  return t('{0}年 {1}月', [year, month]);
}

/** Last calendar day of a YYYY-MM month, as YYYY-MM-DD. */
export function monthEnd(value: string): string {
  const [year, month] = value.split('-').map(Number);
  return `${value}-${new Date(year, month, 0).getDate()}`;
}
