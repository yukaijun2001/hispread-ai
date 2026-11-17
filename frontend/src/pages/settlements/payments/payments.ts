import type { Evidence } from './evidence';

export interface Payment {
  id: string;
  code: string;
  settlementId: string;
  settlementCode?: string | null;
  supplierId: string;
  supplierName: string;
  obligationAmount: string;
  obligationCurrency: string;
  payoutAmount: string;
  payoutCurrency: string;
  fxRate?: string | null;
  fxSource?: string | null;
  state: string;
  paymentMethod?: string | null;
  verificationMode?: string | null;
  statusUpdatedAt?: string | null;
  receiptState?: string | null;
  receiptNote?: string | null;
  receivedAt?: string | null;
  externalRef?: string | null;
  evidence?: Evidence | null;
  evidenceId?: string | null;
  createdBy?: string | null;
  reviewedBy?: string | null;
  version: number;
  lateReturn?: boolean;
  lateReturnMonitoringRequired?: boolean;
}

export interface CurrentRate { id: string; version: number; baseCurrency: string; quoteCurrency: string; rate: string; effectiveFrom: string }
