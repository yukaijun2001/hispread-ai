// Settlement inputs ("金额记录"): payable source amounts awaiting settlement.

export interface QuoteSnapshot {
  pricingType: 'DIRECT' | 'DISCOUNT' | 'FIXED' | string;
  code?: string | null;
  multiplier?: string | null;
  ratePercent?: string | number | null;
  unit?: string | null;
  unitPrice?: string | null;
  effectiveFrom?: string | null;
  effectiveTo?: string | null;
}

export interface SettlementInput {
  id: string;
  supplierName: string;
  projectName: string;
  sourceRef: string;
  sourceKind?: string | null;
  periodStart: string;
  periodEnd: string;
  currency: string;
  originalAmount: string;
  finalAmount: string;
  state: string;
  sourceSnapshot?: { exactConsumption?: string | null; queriedAt?: string | null } | null;
  baseReference?: string | null;
  quoteSnapshot?: QuoteSnapshot | null;
  quantity?: string | number | null;
  voidNote?: string | null;
}
