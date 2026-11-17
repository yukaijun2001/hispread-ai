// Daily-ledger export jobs. Files are generated synchronously on POST and kept
// for 7 days; a download re-checks the job before fetching the file.
import { apiFetch } from '../../../lib/api';
import { t, translateServerMessage } from '../../../lib/i18n';

export const EXPORTS_ENDPOINT = '/accounting/daily/exports';

export interface DailyFilter { from: string; to: string; search: string; supplier: string; project: string; model: string; sourceKind: string; reviewStatus: string }
export interface ExportScope { filter: DailyFilter; supplierName: string; projectName: string }
export interface ExportJob {
  id: string;
  type: string;
  format: string;
  state: string;
  createdAt: string;
  completedAt?: string | null;
  filter?: { from?: string; to?: string } | null;
  snapshotAt?: string | null;
  resultCount?: number | null;
  expiresAt?: string | null;
  files?: Array<{ name: string }>;
}

export const EXPORT_TYPES = (): Record<string, string> => ({ DETAIL: t('日账明细'), SUMMARY: t('按日汇总'), SUPPLIER: t('供应商汇总') });

export const exportStateLabel = (state: string) => {
  const labels: Record<string, string> = { COMPLETED: '已生成', EXPIRED: '已过期', FAILED: '生成失败', CANCELLED: '已取消' };
  return t(labels[state] || '历史记录');
};

export const exportContent = (job: Pick<ExportJob, 'type' | 'format'>) => `${EXPORT_TYPES()[job.type] || job.type} · ${job.format}`;

export async function downloadExport(job: Pick<ExportJob, 'id'>): Promise<void> {
  const id = encodeURIComponent(job.id);
  const latest = await apiFetch<ExportJob>(`${EXPORTS_ENDPOINT}/${id}`);
  if (latest.state !== 'COMPLETED' || !latest.files?.length) throw new Error(t('文件尚未生成或已过期，请重新导出。'));
  const response = await fetch(`/api${EXPORTS_ENDPOINT}/${id}/download`, { credentials: 'same-origin' });
  if (!response.ok) {
    let message = t('下载失败，请重试');
    try {
      const body = await response.json();
      if (body?.message) message = translateServerMessage(body.message);
    } catch { /* keep the generic message */ }
    throw new Error(message);
  }
  const url = URL.createObjectURL(await response.blob());
  const link = document.createElement('a');
  link.href = url;
  link.download = latest.files[0].name;
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
