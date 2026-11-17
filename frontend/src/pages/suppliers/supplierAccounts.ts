// Payout account types and labels for the supplier's own profile page and the
// platform account list.
import { t } from '../../lib/i18n';

export interface OwnSupplier {
  id: string;
  name: string;
  supplierType: 'INDIVIDUAL' | 'COMPANY' | string;
  registrationNo?: string | null;
  country?: string | null;
  contact?: string | null;
  phone?: string | null;
  email?: string | null;
  cycle: string;
  customCycleDays?: number | null;
  state: string;
  profileReviewState?: string | null;
  pendingProfile?: unknown;
  enabled: boolean;
  reviewNote?: string | null;
  updatedAt?: string | null;
  version: number;
}

export interface PayoutAccountRecord {
  id: string;
  bank: string;
  holder: string;
  accountType?: 'BANK' | 'OKX_USDT' | 'BINANCE_USDT' | string;
  providerCode?: string;
  currency: string;
  transferType?: 'ONCHAIN' | 'INTERNAL_UID' | string | null;
  network?: string | null;
  walletType?: 'PRIVATE' | 'EXCHANGE' | string | null;
  lastFour: string;
  state: string;
  replacesId?: string | null;
  reviewNote?: string | null;
}

export interface PlatformAccount extends PayoutAccountRecord {
  supplierId: string;
  supplierName: string;
  supplierCode: string;
  createdAt: string;
}

export interface SupplierDocument { id: string; name: string; bytes: number; createdAt: string }

/** Second line of the account-type column: transfer route of the account. */
export function transferLabel(account: PayoutAccountRecord): string {
  if (account.providerCode === 'AIRWALLEX') return 'Airwallex beneficiary ID';
  if (account.accountType !== 'OKX_USDT' && account.accountType !== 'BINANCE_USDT') return t('收款账号');
  if (account.transferType === 'INTERNAL_UID') return t('欧意 UID 内部转账');
  return t('链上转账 · {0}', [account.network || t('网络未填写')]);
}

export const walletLabel = (walletType?: string | null) => (walletType === 'PRIVATE' ? t('私人钱包') : t('交易所钱包'));
