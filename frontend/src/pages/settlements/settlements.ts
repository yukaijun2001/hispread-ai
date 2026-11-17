// Settlement domain types and helpers shared by the statements list, the
// detail drawer, previews and the batch wizard. Amounts are decimal strings;
// business dates are Beijing calendar days.
import { getLocale } from '../../lib/i18n';
import { CURRENCIES } from '../../lib/labels';
import { beijingDate } from '../../lib/money';

/** Currencies offered by the statement filters and summary cards (wider than the payable set). */
export const STATEMENT_CURRENCIES = [...CURRENCIES, 'EUR', 'HKD', 'SGD', 'JPY', 'GBP'];

export interface SettlementRow {
  id: string;
  code: string;
  supplierName: string;
  projectName?: string | null;
  periodStart: string;
  periodEnd: string;
  createdAt: string;
  originalTotal?: string | null;
  total: string;
  currency: string;
  state: string;
  confirmationMode?: string | null;
  confirmationDeadline?: string | null;
  receivedAmount: string;
  paidAmount: string;
}

export interface DailyLine { businessDate: string; sourceCount: number; originalAmount: string; finalAmount: string }

export interface QuoteBasis {
  pricingType?: string | null;
  code?: string | null;
  effectiveFrom?: string | null;
  effectiveTo?: string | null;
  multiplier?: string | null;
  ratePercent?: string | number | null;
  unitPrice?: string | null;
}

export interface ResourceGroup {
  resourceName?: string | null;
  periodStart: string;
  periodEnd: string;
  sourceCount: number;
  finalAmount: string;
  prices: Array<{ quote: QuoteBasis; quantity?: string | number | null; originalAmount: string }>;
}

export interface LegacyLine {
  quoteSnapshot: QuoteBasis & { title?: string | null; projectName?: string | null; unit?: string | null };
  externalId?: string | null;
  quantity?: string | number | null;
  baseAmount: string;
  amount: string;
}

export interface Adjustment {
  businessDate: string;
  amount: string;
  note: string;
  supplierVisible: boolean;
  createdByName?: string | null;
  createdAt: string;
}

export interface Settlement extends SettlementRow {
  supplierId: string;
  workflowVersion?: number;
  version: number;
  supplierConfirmed?: boolean;
  sourceChanged?: boolean;
  canVoid?: boolean;
  voidNote?: string | null;
  voidedAt?: string | null;
  calculatedTotal?: string | null;
  adjustmentTotal?: string | null;
  reservedAmount: string;
  basisMode?: string | null;
  dailyLines?: DailyLine[] | null;
  resourceGroups?: ResourceGroup[] | null;
  lines?: LegacyLine[] | null;
  linePage?: { total: number; page: number; size: number } | null;
  adjustments?: Adjustment[];
  note?: string | null;
}

export interface PreviewLine {
  businessDate: string;
  sourceKind: string;
  modelKey?: string | null;
  sourceRef?: string | null;
  originalAmount: string;
  quote: QuoteBasis;
  quantity?: string | number | null;
  finalAmount: string;
}

/** A settlement that has not been generated yet (single preview or one batch item). */
export interface PreviewDocument {
  supplierName: string;
  projectName: string;
  periodStart: string;
  periodEnd: string;
  currency: string;
  confirmationDeadline?: string | null;
  basisMode?: string | null;
  lineCount: number;
  dailyLines?: DailyLine[] | null;
  dailyLineCount?: number | null;
  resourceGroups?: ResourceGroup[] | null;
  resourceGroupCount?: number | null;
  lines: PreviewLine[];
  originalTotal: string;
  total: string;
  page?: number;
  size?: number;
  snapshotHash?: string;
}

/** Values of the single-settlement form, kept while its preview is open. */
export interface NewSettlementValues {
  supplierId: string;
  projectId: string;
  periodStart: string;
  periodEnd: string;
  confirmationDeadline: string;
  currency: string;
  requestKey: string;
}
/** Body of POST /settlements/preview; POST /settlements adds `expectedSnapshotHash`. */
export interface SettlementRequest {
  supplierId: string; projectId: string; periodStart: string; periodEnd: string; currency: string; requestKey: string;
  inputIds: string[]; basisMode: 'DAILY_SUMMARY'; confirmationDeadline: string; expectedSnapshotHash?: string;
}

/** Date and time in Beijing, e.g. 2026/05/01 14:30. */
export function beijingDateTime(value: string | null | undefined): string {
  return value ? new Date(value).toLocaleString(getLocale(), {
    timeZone: 'Asia/Shanghai', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hour12: false,
  }) : '—';
}

/** The Beijing calendar day before today. */
export function beijingYesterday(): string {
  const [year, month, day] = beijingDate().split('-').map(Number);
  return new Date(Date.UTC(year, month - 1, day - 1)).toISOString().slice(0, 10);
}

const localInput = (date: Date) => new Date(date.getTime() - date.getTimezoneOffset() * 60_000).toISOString().slice(0, 16);

/** `datetime-local` value five days from now (browser time), rounded up to the next quarter hour. */
export function quarterHourDeadline(): string {
  const date = new Date(Date.now() + 5 * 86_400_000);
  date.setMinutes(Math.ceil(date.getMinutes() / 15) * 15, 0, 0);
  return localInput(date);
}

/** `datetime-local` value five days from now (browser time), at the start of that hour. */
export function hourDeadline(): string {
  const date = new Date(Date.now() + 5 * 86_400_000);
  date.setMinutes(0, 0, 0);
  return localInput(date);
}

/** A `datetime-local` value with seconds and the browser's UTC offset, e.g. 2026-05-01T10:00:00+08:00. */
export function withLocalOffset(value: string): string {
  const offset = -new Date(value).getTimezoneOffset();
  const hours = String(Math.floor(Math.abs(offset) / 60)).padStart(2, '0');
  const minutes = String(Math.abs(offset) % 60).padStart(2, '0');
  return `${value}:00${offset >= 0 ? '+' : '-'}${hours}:${minutes}`;
}

/** Drop trailing zeros from a raw decimal string ("12.500" → "12.5"). */
export const trimZeros = (value: string) => (value.includes('.') ? value.replace(/0+$/, '').replace(/\.$/, '') : value);

/** First day of the month of a YYYY-MM-DD date. */
export const monthStart = (date: string) => `${date.slice(0, 8)}01`;
