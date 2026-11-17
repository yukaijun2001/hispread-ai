// Supplier helpers shared by the supplier list, detail and "my profile" pages
// (recovered Suppliers module exports a/c/n/o/r/s).
import { t } from '../../lib/i18n';
import { payoutProviderLabel, type PayoutAccount } from '../../lib/labels';
import type { BadgeTone } from '../../components/ui/types';

export type SettlementCycle = 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'CUSTOM';

export const CYCLE_OPTIONS = (): Array<{ value: SettlementCycle; label: string; tone: BadgeTone }> => [
  { value: 'DAILY', label: t('日结'), tone: 'info' },
  { value: 'WEEKLY', label: t('周结'), tone: 'info' },
  { value: 'MONTHLY', label: t('月结'), tone: 'teal' },
  { value: 'CUSTOM', label: t('自定义期间'), tone: 'violet' },
];

export const CYCLE_LABELS = (): Record<string, string> => ({ DAILY: t('日结'), WEEKLY: t('周结'), MONTHLY: t('月结'), CUSTOM: t('自定义期间') });

/** "每 N 天结算" for a custom cycle with days, otherwise the cycle name (or the raw value). */
export function cycleLabel(cycle: string, customCycleDays?: number | string | null): string {
  return cycle === 'CUSTOM' && customCycleDays ? t('每 {0} 天结算', [customCycleDays]) : CYCLE_LABELS()[cycle] || cycle;
}

export const isUsdtAccountType = (accountType?: string | null) => accountType === 'OKX_USDT' || accountType === 'BINANCE_USDT';

/** The `bank` value sent for a payout account type. */
export const bankForAccountType = (accountType?: string | null) =>
  (accountType === 'OKX_USDT' ? 'OKX' : accountType === 'BINANCE_USDT' ? 'Binance' : 'Airwallex');

export interface PayoutAccountSummary extends PayoutAccount { id: string; lastFour: string }

/** "<provider> · 末四位 1234" for an account id in `accounts`, or 历史账户 when it is not listed. */
export function accountLabel(accounts: PayoutAccountSummary[], id: string | null | undefined): string {
  const account = accounts.find((entry) => entry.id === id);
  return account ? t('{0} · 末四位 {1}', [payoutProviderLabel(account), account.lastFour]) : t('历史账户');
}
