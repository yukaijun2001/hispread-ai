// Workbench to-do items: kind labels, action labels and translation of the
// server-built summaries.
import { formatDiscount, t, translateServerMessage } from '../../lib/i18n';
import { unitLabel } from '../../lib/labels';

export interface TaskFact { label: string; value: string }
export interface WorkbenchTask {
  id: string;
  kind: string;
  label: string;
  title: string;
  summary?: string | null;
  detail?: string | null;
  facts: TaskFact[];
  supplierName?: string | null;
  amount?: string | null;
  currency?: string | null;
  createdAt: string;
  targetPath: string;
}

const KIND_LABELS: Record<string, string> = {
  SUPPLIER_REVIEW: '资质待审核', ACCOUNT_REVIEW: '收款账户待审核', QUOTE_NEW: '新报价待审', QUOTE_EXPIRING: '报价即将到期',
  QUOTE_CHANGE: '改价待审', SETTLEMENT_CONFIRM: '待确认应收金额', PAYMENT_CREATE: '待申请付款', PAYMENT_REVIEW: '付款待审核',
  PAYMENT_EXECUTE: '待执行付款', SUPPLIER_REVISION: '资料需要补充', QUOTE_REJECTED: '报价已退回', PAYMENT_RECEIPT: '请核对到账',
};

export const taskKindLabel = (task: WorkbenchTask) => (KIND_LABELS[task.kind] ? t(KIND_LABELS[task.kind]) : translateServerMessage(task.label));

export function taskActionLabel(task: WorkbenchTask): string {
  if (['QUOTE_NEW', 'SUPPLIER_REVIEW', 'ACCOUNT_REVIEW', 'PAYMENT_REVIEW'].includes(task.kind)) return t('审核');
  if (task.kind === 'QUOTE_CHANGE') return t('审核改价');
  if (task.kind === 'SUPPLIER_REVISION') return t('去补充');
  if (['SETTLEMENT_CONFIRM', 'PAYMENT_RECEIPT'].includes(task.kind)) return t('核对');
  if (task.kind === 'PAYMENT_CREATE') return t('申请付款');
  if (task.kind === 'PAYMENT_EXECUTE') return t('去付款');
  return t('查看');
}

/** Quote summaries carry "0.85倍" multipliers, date ranges and units in Chinese. */
function translateQuoteText(text: string): string {
  return text
    .replace(/(\d+(?:\.\d+)?)\s*倍/g, (_m, ratio) => formatDiscount(ratio))
    .replace(/(\d{4}-\d{2}-\d{2}) 至 (\d{4}-\d{2}-\d{2})/g, (_m, from, to) => t('{0} 至 {1}', [from, to]))
    .replace(/，自 (\d{4}-\d{2}-\d{2}) 生效/g, (_m, date) => t('，自 {0} 生效', [date]))
    .replace(/ \/ ([^·，]+?)(?= ·|，|$)/g, (_m, unit) => ` / ${unitLabel(unit)}`);
}

const QUOTE_KINDS = ['QUOTE_NEW', 'QUOTE_CHANGE', 'QUOTE_REJECTED'];
export const taskSummary = (task: WorkbenchTask, text = task.summary ?? '') => (QUOTE_KINDS.includes(task.kind) ? translateQuoteText(text) : text);
export const factValue = (fact: TaskFact) => (['报价', '价格', '期间'].includes(fact.label) ? translateQuoteText(fact.value) : fact.value);

export const TASK_GROUPS = [
  { id: 'quote', label: '报价', kinds: ['QUOTE_NEW', 'QUOTE_CHANGE', 'QUOTE_REJECTED'] },
  { id: 'profile', label: '资料', kinds: ['SUPPLIER_REVIEW', 'SUPPLIER_REVISION', 'ACCOUNT_REVIEW'] },
  { id: 'money', label: '账务', kinds: ['SETTLEMENT_CONFIRM', 'PAYMENT_CREATE', 'PAYMENT_REVIEW', 'PAYMENT_EXECUTE', 'PAYMENT_RECEIPT'] },
] as const;
