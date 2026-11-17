// Platform-side supplier helpers: record shapes, the declarative form fields
// used by the supplier dialogs (recovered Suppliers `F` and `I`) and the CC
// intake tier labels (recovered labels `a`/`t`).
import { getLocale, t } from '../../lib/i18n';
import type { SelectOption } from '../../components/ui/types';
import { CYCLE_OPTIONS } from './suppliers';

export interface LinkedUser { id: string; username: string; displayName: string; enabled: boolean }

export interface Supplier {
  id: string;
  code: string;
  name: string;
  supplierType: 'COMPANY' | 'INDIVIDUAL' | string;
  registrationNo?: string | null;
  country: string;
  contact: string;
  phone?: string | null;
  email?: string | null;
  cycle: string;
  customCycleDays?: number | null;
  state: string;
  profileReviewState?: string | null;
  enabled: boolean;
  ownerUserId?: string | null;
  ownerName?: string | null;
  updatedAt?: string | null;
  version: number;
  pendingProfile?: string | null;
  internalNote?: string | null;
  linkedUsers?: LinkedUser[];
  reviewNote?: string | null;
  submittedBy?: string | null;
  profileSubmittedBy?: string | null;
}

export interface UserOption { id: string; username: string; displayName: string }
export interface SupplierDocument { id: string; name: string; bytes: number; createdAt: string }

export interface SupplierAccount {
  id: string;
  bank: string;
  holder: string;
  accountType?: string;
  providerCode?: string;
  currency: string;
  transferType?: string | null;
  network?: string | null;
  walletType?: string | null;
  lastFour: string;
  state: string;
  replacesId?: string | null;
  reviewNote?: string | null;
  submittedBy?: string | null;
  submittedByName?: string | null;
  createdBy?: string | null;
  updatedBy?: string | null;
  createdAt?: string | null;
}
export interface Credential { username?: string | null; initialPassword?: string | null }

// --- Declarative form fields (port of the recovered FormModal field spec) ---------
export type FormValues = Record<string, string>;
export interface FormFieldSpec {
  name: string;
  label: string;
  type?: 'text' | 'email' | 'password' | 'number' | 'select' | 'textarea';
  full?: boolean;
  /** Required unless explicitly false. */
  required?: boolean;
  hint?: string;
  placeholder?: string;
  min?: string;
  max?: string;
  step?: string;
  minLength?: number;
  options?: SelectOption[] | ((values: FormValues) => SelectOption[]);
  searchable?: boolean;
  visible?: (values: FormValues) => boolean;
  /** Fields reset to '' when this one changes. */
  clearOnChange?: string[];
  /** Extra values merged when this one changes. */
  valuesOnChange?: (value: string, values: FormValues) => FormValues;
}

/** Supplier profile fields (create and edit). */
export const profileFields = (): FormFieldSpec[] => [
  { name: 'name', label: t('供应商主体名称'), full: true },
  { name: 'registrationNo', label: t('企业注册编号'), visible: (v) => v.supplierType === 'COMPANY' },
  { name: 'country', label: t('国家 / 地区') },
  { name: 'contact', label: t('联系人') },
  { name: 'phone', label: t('联系电话'), required: false, hint: t('选填') },
  { name: 'email', label: t('电子邮箱'), type: 'email', required: false, hint: t('选填；填写时需为有效邮箱格式') },
  { name: 'cycle', label: t('结算周期'), type: 'select', clearOnChange: ['customCycleDays'], options: CYCLE_OPTIONS().map(({ value, label }) => ({ value, label })) },
  {
    name: 'customCycleDays', label: t('每隔多少天结算'), type: 'number', min: '1', max: '365', step: '1',
    placeholder: t('例如 10'), hint: t('填写 1-365 天；结算单的实际起止日期仍在创建时确认'), visible: (v) => v.cycle === 'CUSTOM',
  },
];

/** Login-account fields for a new supplier or a user linked to one. */
export const loginAccountFields = (users: UserOption[]): FormFieldSpec[] => [
  {
    name: 'mode', label: t('登录账号'), type: 'select', full: true,
    options: [{ value: 'NEW', label: t('创建新用户') }, { value: 'EXISTING', label: t('选择已有用户') }],
  },
  {
    name: 'userId', label: t('已有供应商用户'), type: 'select', full: true, searchable: true, visible: (v) => v.mode === 'EXISTING',
    options: users.map((user) => ({ value: user.id, label: `${user.displayName} · ${user.username}` })),
    hint: t('仅显示已启用且未绑定供应商的用户'),
  },
  { name: 'username', label: t('新登录账号'), visible: (v) => v.mode === 'NEW', hint: t('字母、数字及 . _ @ -，至少 3 位') },
  { name: 'displayName', label: t('账号显示名称'), required: false, visible: (v) => v.mode === 'NEW', placeholder: t('默认使用联系人姓名') },
  { name: 'password', label: t('初始密码'), type: 'password', full: true, required: false, visible: (v) => v.mode === 'NEW', placeholder: t('留空则按系统参数安全随机生成') },
];

// --- CC intake labels ----------------------------------------------------------------
export const INTAKE_TIERS = ['FALLBACK', 'NORMAL', 'PAYMENT_TERM', 'PARTNER', 'TEMPORARY'] as const;
export const tierLabels = (): Record<string, string> => ({
  FALLBACK: t('补充兜底'), NORMAL: t('常规'), PAYMENT_TERM: t('账期优先'), PARTNER: t('重点合作'), TEMPORARY: t('临时调度'),
});
/** A daily quantity; null means unlimited. */
export const formatLimit = (value: number | null | undefined) => (value === null || value === undefined ? t('不限') : value.toLocaleString(getLocale()));

/** Platform staff (not a supplier account) — the audience for platform configuration. */
export const isPlatformUser = (user: { supplierId?: string | null; role: string }) =>
  !user.supplierId && !['SUPPLIER', 'SUPPLIER_AGENT'].includes(user.role);
