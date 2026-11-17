// System notices (notice-admin): audiences, statuses and the list row shape.
import { t } from '../../../lib/i18n';
import type { BadgeTone } from '../../../components/ui/types';

export type NoticeAudience = 'ALL' | 'PLATFORM' | 'SUPPLIERS' | 'SUPPLIER_ADMINS' | 'DIRECT';
export type NoticeStatus = 'DRAFT' | 'PUBLISHED' | 'REVOKED';

export interface QuoteProjectRef { id: string; name: string; enabled?: boolean }

export interface NoticeRow {
  id: string;
  title: string;
  body: string;
  audience: NoticeAudience;
  targetUserId?: string | null;
  targetUsername?: string | null;
  targetDisplayName?: string | null;
  quoteProjects?: QuoteProjectRef[] | null;
  status: NoticeStatus;
  readCount: number;
  recipientCount: number;
  creatorName?: string | null;
  revokerName?: string | null;
  createdAt?: string | null;
  updatedAt?: string | null;
  publishedAt?: string | null;
  revokedAt?: string | null;
  version: number;
}

export interface Recipient { id?: string; userId?: string; displayName: string; username: string; supplierName?: string | null }

export const AUDIENCE_LABELS = (): Record<NoticeAudience, string> => ({
  ALL: t('全部启用账号'),
  PLATFORM: t('平台人员'),
  SUPPLIERS: t('供应商账号（含团队成员）'),
  SUPPLIER_ADMINS: t('供应商管理员（仅主账号）'),
  DIRECT: t('指定单个账号'),
});

/** Supplier audiences can be narrowed to suppliers that quoted on chosen projects. */
export const isSupplierAudience = (audience: string) => audience === 'SUPPLIERS' || audience === 'SUPPLIER_ADMINS';

export function audienceLabel(notice: Pick<NoticeRow, 'audience' | 'targetDisplayName' | 'targetUsername'>): string {
  if (notice.audience === 'DIRECT') {
    return t('指定账号：{0}{1}', [
      notice.targetDisplayName || notice.targetUsername || t('账号已变更'),
      notice.targetUsername ? t('（{0}）', [notice.targetUsername]) : '',
    ]);
  }
  return AUDIENCE_LABELS()[notice.audience];
}

export const projectNames = (notice: Pick<NoticeRow, 'quoteProjects'>) => (notice.quoteProjects ?? []).map((project) => project.name).join('、');

export const noticeStatusLabel = (status: NoticeStatus) => t(status === 'DRAFT' ? '草稿' : status === 'PUBLISHED' ? '已发布' : '已撤回');
export const noticeStatusTone = (status: NoticeStatus): BadgeTone => (status === 'DRAFT' ? 'info' : status === 'PUBLISHED' ? 'success' : 'neutral');
