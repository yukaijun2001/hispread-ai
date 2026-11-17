// Daily-ledger response shapes (GET /accounting/daily, /groups, /summary).

export type SortKey = 'consumptionTotal' | 'pendingConsumption' | 'confirmedOriginal' | 'payableTotal';

export interface DailyGroup {
  businessDate?: string | null;
  supplierId: string;
  supplierName: string;
  projectId: string;
  projectName: string;
  currency: string;
  pricingType: 'DISCOUNT' | 'FIXED' | 'DIRECT' | 'UNAVAILABLE' | string;
  settlementMultiplier?: string | null;
  settlementUnitPrice?: string | null;
  consumptionTotal: string;
  pendingConsumption: string;
  pendingCount: number;
  confirmedOriginal: string;
  confirmedCount: number;
  payableTotal: string;
}

export interface DailyTotal {
  currency: string;
  consumptionTotal: string;
  confirmedOriginal: string;
  pendingConsumption: string;
  unsettledPayable: string;
  payableTotal?: string;
  pendingCount: number;
  confirmedCount: number;
  groupCount: number;
}

export interface DailySummary {
  totals: DailyTotal[];
  projects: Array<{ projectId: string; projectName: string; currency: string; count: number; amount: string }>;
  total: number;
  groupCount: number;
  crossPeriodCount: number;
  summaryUpdating?: boolean;
}

export interface DailyEntry {
  id: string;
  version: number;
  sourceId?: string | null;
  businessDate: string;
  supplierName: string;
  projectName: string;
  projectCategory?: string | null;
  sourceKind: string;
  modelKey?: string | null;
  resourceUsageId?: string | null;
  sourceRef: string;
  currency: string;
  exactConsumption?: string | null;
  originalAmount?: string | null;
  quantity?: string | number | null;
  pricingType?: string | null;
  settlementMultiplier?: string | null;
  settlementUnitPrice?: string | null;
  pricingProvisional?: boolean;
  pricingIssue?: string | null;
  finalAmount?: string | null;
  displayState: string;
  currentDayProvisional?: boolean;
  observationQueriedAt?: string | null;
  sourceChanged?: boolean;
  state: string;
  settlementCode?: string | null;
  settlementPaidAmount?: string | null;
  settlementTotal?: string | null;
}

export const DISPLAY_STATE_LABELS: Record<string, string> = {
  UNSETTLED: '待结算',
  SETTLING: '结算中',
  AWAITING_PAYMENT: '待付款',
  PARTIALLY_PAID: '部分付款',
  PAID: '已付款',
  NO_PAYMENT_DUE: '无需付款',
  NEEDS_REVIEW: '待计价',
  PENDING_REVIEW: '待自动计价',
  CURRENT_DAY_PROVISIONAL: '今日账单 · 次日可结算',
};
