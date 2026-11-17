// Quote domain helpers. Discounts are stored as a multiplier ("0.8") but edited
// and shown as a percentage ("80"); all conversions shift the decimal point on
// strings, never through floating point. "Today" is the Beijing business day.
import { divide100, formatDiscount, t, times100 } from '../../lib/i18n';
import { beijingDate, percentToRatio } from '../../lib/money';
import type { Project } from '../../lib/projects';

export interface PriceVersion { id: string; effectiveAt: string; approvedAt?: string | null; unitPrice?: string | null; multiplier?: string | null; ratePercent?: string | number | null }
export interface PendingChange {
  state: string;
  oldFrom?: string; oldTo?: string; proposedFrom?: string; proposedTo?: string;
  priceEffectiveFrom?: string | null;
  oldUnitPrice?: string | null; proposedUnitPrice?: string | null;
  oldMultiplier?: string | null; proposedMultiplier?: string | null;
  submittedBy?: string; createdBy?: string;
}
export interface RenewalEntry { kind: string; previousFrom: string; previousTo: string; effectiveFrom: string; effectiveTo: string; actorName: string; occurredAt: string }

export interface Quote {
  id: string;
  code: string;
  title?: string;
  supplierId: string;
  supplierName: string;
  projectId: string;
  projectName: string;
  unit?: string | null;
  pricingType: 'DISCOUNT' | 'FIXED';
  multiplier?: string | null;
  ratePercent?: string | number | null;
  unitPrice?: string | null;
  currency: string;
  taxInclusive: boolean;
  effectiveFrom: string;
  effectiveTo: string;
  state: string;
  submittedBy?: string;
  createdBy?: string;
  accountCount?: string | null;
  accountQuota?: string | null;
  capacityCurrency?: string | null;
  capacityType?: string | null;
  rpm?: string | null;
  tpm?: string | null;
  serviceCapacityNote?: string | null;
  pendingChange?: PendingChange | null;
  upcomingPrice?: { effectiveFrom?: string; multiplier?: string | null; unitPrice?: string | null } | null;
  settlementMethod?: string | null;
  deliveryMethod?: string | null;
  reviewNote?: string | null;
  renewalHistory?: RenewalEntry[];
  priceHistory?: PriceVersion[];
}

export interface MultiplierBounds { min: string; max: string }

export const DECIMAL = /^\d+(?:\.\d+)?$/;
const POSITIVE_INTEGER = /^[1-9]\d*$/;
const BIGINT_MAX = 9223372036854775807n;

/** Multiplier of a discount quote, falling back to the legacy percent field. */
export const quoteMultiplier = (quote: Pick<Quote, 'multiplier' | 'ratePercent'>) => String(quote.multiplier ?? percentToRatio(String(quote.ratePercent)));

export function sameDecimal(a: string, b: string): boolean {
  const normal = (value: string) => {
    const [whole, fraction = ''] = value.split('.');
    return `${whole.replace(/^0+(?=\d)/, '')}.${fraction.replace(/0+$/, '')}`;
  };
  return DECIMAL.test(a) && DECIMAL.test(b) && normal(a) === normal(b);
}

/** Last day of the current Beijing month. */
export function endOfBeijingMonth(): string {
  const [year, month] = beijingDate().split('-').map(Number);
  return new Date(Date.UTC(year, month, 0)).toISOString().slice(0, 10);
}

const currentPrice = (quote: Quote) => (quote.pricingType === 'FIXED' ? String(quote.unitPrice ?? '') : quoteMultiplier(quote));

export const sortPriceHistory = (history: PriceVersion[]) => [...history].sort((a, b) =>
  new Date(a.effectiveAt).getTime() - new Date(b.effectiveAt).getTime() || (a.approvedAt || '').localeCompare(b.approvedAt || ''));

/** The price in effect at the end of `date` (Beijing), or now when `date` is today. */
export function priceOn(quote: Quote, date: string): string {
  const cutoff = date === beijingDate() ? Date.now() : new Date(`${date}T23:59:59.999+08:00`).getTime();
  const version = sortPriceHistory(quote.priceHistory || []).filter((entry) => new Date(entry.effectiveAt).getTime() <= cutoff).at(-1);
  if (!version) return currentPrice(quote);
  return quote.pricingType === 'FIXED' ? String(version.unitPrice ?? '') : String(version.multiplier ?? percentToRatio(String(version.ratePercent)));
}

/** A timestamp as a Beijing calendar date in the UI locale. */
export function beijingDay(value: string, locale: string): string {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value
    : new Intl.DateTimeFormat(locale, { timeZone: 'Asia/Shanghai', year: 'numeric', month: '2-digit', day: '2-digit' }).format(date);
}

export function capacitySummary(quote: Pick<Quote, 'capacityType' | 'accountCount' | 'accountQuota' | 'capacityCurrency' | 'rpm' | 'tpm'>): string {
  if (quote.capacityType === 'ACCOUNT_COUNT') return quote.accountCount ? t('{0} 个', [quote.accountCount]) : t('未填写');
  if (quote.capacityType === 'ACCOUNT_QUOTA') return quote.accountQuota ? `${quote.accountQuota} ${quote.capacityCurrency || ''}`.trim() : t('未填写');
  if (quote.capacityType === 'THROUGHPUT' && quote.rpm && quote.tpm) return `${quote.rpm} RPM / ${quote.tpm} TPM`;
  return t('未填写');
}

export const QUOTE_STATE_FILTERS = () => [
  { value: 'CURRENT', label: t('待审 / 已通过') },
  { value: '', label: t('全部报价状态') },
  { value: 'PENDING', label: t('待审核') },
  { value: 'CHANGE_PENDING', label: t('调价待审') },
  { value: 'APPROVED', label: t('已通过') },
  { value: 'REJECTED', label: t('已退回') },
  { value: 'WITHDRAWN', label: t('已撤回') },
];

export const suggestedDiscount = (value: string | null | undefined) => (value == null || value.trim() === '' ? '' : t('建议折扣 {0}', [formatDiscount(value.trim())]));

export function pendingChangeNote(quote: Quote): string {
  const change = quote.pendingChange;
  if (!change || change.state !== 'PENDING') return '';
  const parts: string[] = [];
  if (quote.pricingType === 'DISCOUNT' && change.proposedMultiplier != null) parts.push(t('折扣改为 {0}', [formatDiscount(change.proposedMultiplier)]));
  else if (change.proposedUnitPrice != null) parts.push(t('单价改为 {0} {1}', [quote.currency, change.proposedUnitPrice]));
  if (change.priceEffectiveFrom) parts.push(t('{0} 起', [change.priceEffectiveFrom]));
  if (change.proposedFrom && change.proposedTo && (change.proposedFrom !== change.oldFrom || change.proposedTo !== change.oldTo)) {
    parts.push(t('期间改为 {0} 至 {1}', [change.proposedFrom, change.proposedTo]));
  }
  return parts.length ? t('待审：{0}', [parts.join(t('，'))]) : t('调价待审');
}

export function upcomingPriceNote(quote: Quote): string {
  const upcoming = quote.upcomingPrice;
  if (!upcoming?.effectiveFrom) return '';
  if (quote.pricingType === 'DISCOUNT' && upcoming.multiplier != null) return t('后续 {0} · {1} 起', [formatDiscount(upcoming.multiplier), upcoming.effectiveFrom]);
  return upcoming.unitPrice == null ? '' : t('后续 {0} {1} · {2} 起', [quote.currency, upcoming.unitPrice, upcoming.effectiveFrom]);
}

/** Compare two signed decimal strings exactly. */
function compareSigned(a: string, b: string): -1 | 0 | 1 {
  const parse = (value: string) => {
    const text = value.trim().replace(/^\+/, '');
    const negative = text.startsWith('-');
    const [whole, fraction = ''] = text.replace(/^-/, '').split('.');
    return { negative, whole: whole.replace(/^0+/, '') || '0', fraction: fraction.replace(/0+$/, '') };
  };
  const sign = (n: ReturnType<typeof parse>) => (n.whole === '0' && !n.fraction ? 0 : n.negative ? -1 : 1);
  const left = parse(a);
  const right = parse(b);
  const ls = sign(left);
  const rs = sign(right);
  if (ls !== rs) return ls < rs ? -1 : 1;
  if (ls === 0) return 0;
  const width = Math.max(left.fraction.length, right.fraction.length);
  const l = BigInt(left.whole + left.fraction.padEnd(width, '0'));
  const r = BigInt(right.whole + right.fraction.padEnd(width, '0'));
  const order = l < r ? -1 : l > r ? 1 : 0;
  return (ls < 0 ? -order : order) as -1 | 0 | 1;
}

/** Error text when a multiplier lies outside the server-configured bounds. */
export function multiplierOutOfRange(multiplier: string, bounds: MultiplierBounds | null | undefined): string {
  if (!bounds?.min || !bounds.max) return '';
  return compareSigned(multiplier, bounds.min) < 0 || compareSigned(multiplier, bounds.max) > 0
    ? t('报价折扣必须在 {0} 至 {1} 之间', [times100(bounds.min), times100(bounds.max)]) : '';
}

/** Discount percent input → stored multiplier. */
export const percentInputToMultiplier = (percent: string) => divide100(percent);

// --- Inline edit rows -------------------------------------------------------

export interface QuoteDraft {
  key: string;
  id?: string;
  source?: Quote;
  supplierId: string;
  projectId: string;
  currency: string;
  unitPrice: string;
  /** Discount as a percentage, as typed. */
  multiplier: string;
  taxInclusive: 'true' | 'false';
  serviceCapacityNote: string;
  effectiveFrom: string;
  effectiveTo: string;
  pending: boolean;
  error: string;
  accountCount: string;
  accountQuota: string;
  rpm: string;
  tpm: string;
}

let draftSequence = 0;

/**
 * A new row, a copy of `source` (dates cleared, non-USD unit price dropped),
 * or — with `editing` — the pending quote itself.
 */
export function createDraft(supplierId: string, source?: Quote, editing = false): QuoteDraft {
  draftSequence += 1;
  return {
    key: `quote-${Date.now()}-${draftSequence}`,
    id: editing ? source?.id : undefined,
    source: editing ? source : undefined,
    supplierId: source?.supplierId || supplierId,
    projectId: source?.projectId || '',
    currency: editing && source ? source.currency : 'USD',
    unitPrice: source?.unitPrice == null || (!editing && source.currency !== 'USD') ? '' : String(source.unitPrice),
    multiplier: source?.multiplier == null ? (source?.ratePercent == null ? '80' : String(source.ratePercent)) : times100(String(source.multiplier)),
    taxInclusive: source?.taxInclusive === false ? 'false' : 'true',
    serviceCapacityNote: source?.serviceCapacityNote || '',
    effectiveFrom: source && !editing ? '' : source?.effectiveFrom || beijingDate(),
    effectiveTo: source && !editing ? '' : source?.effectiveTo || endOfBeijingMonth(),
    pending: false,
    error: '',
    accountCount: source?.accountCount || '',
    accountQuota: source?.accountQuota || '',
    rpm: source?.rpm || '',
    tpm: source?.tpm || '',
  };
}

/** A pending quote that started before today keeps its start date and price; only the end date may move. */
export const isHistoricalEdit = (draft: QuoteDraft) => !!(draft.source && draft.source.effectiveFrom < beijingDate());

export const draftUsesUnitPrice = (draft: QuoteDraft, project: Project | undefined) =>
  (isHistoricalEdit(draft) ? draft.source?.pricingType === 'FIXED' : project?.settlementMethod === 'ACCOUNT_BUYOUT');

export interface BoundsState { data: MultiplierBounds | null; loading: boolean; error: string }

export function validateDraft(draft: QuoteDraft, project: Project | undefined, bounds: BoundsState): string {
  if (!draft.supplierId) return t('请选择供应商');
  if (!draft.effectiveFrom || !draft.effectiveTo) return t('请填写完整的生效日期');
  if (draft.effectiveTo < draft.effectiveFrom) return t('结束日期不能早于开始日期');
  const today = beijingDate();
  if (draft.effectiveTo < today) return t('历史报价不能修改或提交，请选择今天或未来日期');
  if (draft.source?.effectiveFrom && draft.source.effectiveFrom < today) {
    if (draft.effectiveFrom !== draft.source.effectiveFrom) return t('历史开始日期不可修改，只能调整今天或未来的结束日期');
  } else if (draft.effectiveFrom < today) return t('生效日期不能早于北京时间今天');
  if (draft.source && draft.source.effectiveFrom < today) return '';
  if (!project) return t('请选择报价项目');
  if (!project.enabled) return t('项目已停用，不能提交报价');
  if (!project.capacityType) return t('该项目尚未配置能力口径');
  if (draft.serviceCapacityNote.trim().length > 500) return t('能力补充说明最多500字');
  if (project.capacityType === 'ACCOUNT_COUNT' && !POSITIVE_INTEGER.test(draft.accountCount)) return t('请填写正整数账号数量');
  if (project.capacityType === 'ACCOUNT_QUOTA') {
    if (!DECIMAL.test(draft.accountQuota) || /^0+(?:\.0+)?$/.test(draft.accountQuota)) return t('请填写大于0的账号额度');
    if ((draft.accountQuota.split('.')[1] || '').length > 8) return t('账号额度最多8位小数');
  }
  if (project.capacityType === 'THROUGHPUT' && (!POSITIVE_INTEGER.test(draft.rpm) || !POSITIVE_INTEGER.test(draft.tpm))) return t('请同时填写正整数RPM和TPM');
  for (const value of [draft.accountCount, draft.rpm, draft.tpm].filter(Boolean)) {
    if (BigInt(value) > BIGINT_MAX) return t('整数能力超过BIGINT上限');
  }
  if (project.settlementMethod === 'ACCOUNT_BUYOUT') {
    if (!DECIMAL.test(draft.unitPrice)) return t('请填写不小于 0 的单位价格');
  } else {
    if (bounds.loading) return t('正在读取报价折扣范围');
    if (bounds.error) return t('报价折扣范围读取失败');
    if (!DECIMAL.test(draft.multiplier)) return t('请填写不小于 0 的折扣');
    if (draft.multiplier.split('.')[0].replace(/^0+/, '').length > 8) return t('折扣整数部分最多 8 位');
    if ((draft.multiplier.split('.')[1] || '').length > 6) return t('折扣最多 6 位小数');
    const outOfRange = multiplierOutOfRange(percentInputToMultiplier(draft.multiplier), bounds.data);
    if (outOfRange) return outOfRange;
  }
  return '';
}

/** Request body for POST /quotes and PUT /quotes/{id}. Only the capacity field the project uses is sent. */
export function draftPayload(draft: QuoteDraft, project: Project | undefined) {
  const historical = isHistoricalEdit(draft);
  const fixed = draftUsesUnitPrice(draft, project);
  const capacity = (type: string, value: string) => (historical ? value || null : project?.capacityType === type ? value : null);
  return {
    supplierId: draft.supplierId,
    projectId: draft.projectId,
    pricingType: fixed ? 'FIXED' : 'DISCOUNT',
    unitPrice: fixed ? draft.unitPrice : null,
    multiplier: fixed ? null : percentInputToMultiplier(draft.multiplier),
    currency: draft.currency,
    taxInclusive: draft.taxInclusive === 'true',
    serviceCapacityNote: draft.serviceCapacityNote.trim(),
    accountCount: capacity('ACCOUNT_COUNT', draft.accountCount),
    accountQuota: capacity('ACCOUNT_QUOTA', draft.accountQuota),
    rpm: capacity('THROUGHPUT', draft.rpm),
    tpm: capacity('THROUGHPUT', draft.tpm),
    effectiveFrom: draft.effectiveFrom,
    effectiveTo: draft.effectiveTo,
  };
}
