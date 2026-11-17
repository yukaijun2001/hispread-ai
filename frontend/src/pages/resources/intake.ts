// CC intake (daily onboarding quota) labels.
import { getLocale, t } from '../../lib/i18n';

/** A count, or 不限 when there is no limit. */
export const intakeCount = (value: number | null) => (value === null ? t('不限') : value.toLocaleString(getLocale()));

/** Quota source key: `U:` personal reservation, `G:` delivery-group pool, otherwise the supplier pool. */
export const quotaSourceLabel = (source: string) =>
  source.startsWith('U:') ? t('个人预留') : source.startsWith('G:') ? t('交付组共享池') : t('供应商共享池');

const BLOCK_REASONS: Record<string, string> = {
  PLATFORM_STOPPED: '平台已停收',
  SUPPLIER_DISABLED: '供应商未开通',
  NON_PRO_STOPPED: '非PRO暂停接收',
  PRO_DISABLED: '未开通PRO',
  GROUP_PRO_DISABLED: '交付组未开通PRO',
  NO_QUOTA: '今日额度为0',
  QUOTA_RECLAIMED: '个人额度已回收',
  QUOTA_RESERVED: '共享额度已预留',
  QUOTA_FULL: '当前来源额度用尽',
  NON_PRO_UNAVAILABLE: '非PRO来源暂无额度',
};

export function intakeAvailability(accepting: boolean, reason?: string | null): string {
  if (accepting) return t('可上号');
  return reason && BLOCK_REASONS[reason] ? t(BLOCK_REASONS[reason]) : t('当前账号暂不接收');
}

export interface IntakeAllowance { source: string; reclaimed?: boolean; used: number; limit: number | null; remaining: number | null; reservedRemaining: number }
export interface IntakeToday {
  date: string;
  total: number;
  unknown: number;
  processing: number;
  pro: number;
  nonPro: number;
  canPro: boolean;
  accepting: boolean;
  proBlockReason?: string | null;
  nonProBlockReason?: string | null;
  proAllowance: IntakeAllowance;
  nonProAllowance: IntakeAllowance;
}
