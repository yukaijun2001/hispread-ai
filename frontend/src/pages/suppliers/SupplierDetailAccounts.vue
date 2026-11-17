<script setup lang="ts">
// 收款账户 tab: payout accounts with masked numbers (full number on demand for
// account.sensitive), new / change requests (account.write) and four-eyes review.
import { ref } from 'vue';
import Button from '../../components/ui/Button.vue';
import IconButton from '../../components/ui/IconButton.vue';
import Icon from '../../components/ui/Icon.vue';
import StatusBadge from '../../components/ui/StatusBadge.vue';
import DetailList from '../../components/ui/DetailList.vue';
import EmptyState from '../../components/ui/EmptyState.vue';
import ReviewBox from '../../components/ReviewBox.vue';
import SupplierFormModal from './SupplierFormModal.vue';
import { apiPost } from '../../lib/api';
import { t } from '../../lib/i18n';
import { CURRENCIES, payoutProviderLabel } from '../../lib/labels';
import { formatDateTime } from '../../lib/money';
import { useSessionStore } from '../../stores/session';
import { accountLabel, bankForAccountType, isUsdtAccountType } from './suppliers';
import type { FormFieldSpec, FormValues, SupplierAccount } from './supplierAdmin';

const props = defineProps<{ supplierId: string; supplierName: string; accounts: SupplierAccount[] | null }>();

const session = useSessionStore();
const revealed = ref<Record<string, string>>({});
const editing = ref<SupplierAccount | 'new' | null>(null);

async function reveal(account: SupplierAccount) {
  try {
    const result = await apiPost<{ accountNumber: string }>(`/accounts/${account.id}/reveal`, {});
    revealed.value = { ...revealed.value, [account.id]: result.accountNumber };
  } catch (error) {
    session.notify((error as Error).message, true);
  }
}

async function review(account: SupplierAccount, approved: boolean, note: string) {
  await apiPost(`/accounts/${account.id}/review`, { approved, note });
  session.notify(t('账户审核已处理'));
  session.refresh();
}

// Four-eyes: whoever submitted, created or last changed the request cannot review it.
const canReview = (account: SupplierAccount) => session.has('account.review') && account.state === 'PENDING'
  && account.submittedBy !== session.user?.id && account.createdBy !== session.user?.id && account.updatedBy !== session.user?.id;

function details(account: SupplierAccount): Array<[string, string]> {
  return [
    [t('账户类型'), payoutProviderLabel(account)],
    [t('收款户名'), account.holder],
    [t('收款方式'), account.transferType === 'INTERNAL_UID' ? t('欧意 UID 内部转账') : account.transferType === 'ONCHAIN' ? t('链上转账')
      : account.providerCode === 'AIRWALLEX' ? 'Airwallex beneficiary ID' : t('银行账户')],
    ...(account.network ? [[t('转账网络'), account.network] as [string, string]] : []),
    ...(account.walletType ? [[t('钱包类型'), account.walletType === 'PRIVATE' ? t('私人钱包') : t('交易所钱包')] as [string, string]] : []),
    [t('申请类型'), account.replacesId ? t('变更已有账户') : t('新增账户')],
    ...(account.replacesId ? [[t('原账户'), accountLabel(props.accounts ?? [], account.replacesId)] as [string, string]] : []),
    [t('申请人'), account.submittedByName || t('未知申请人')],
    [t('申请时间'), account.createdAt ? formatDateTime(account.createdAt) : '—'],
    ...(account.reviewNote ? [[t('审核意见'), account.reviewNote] as [string, string]] : []),
  ];
}

const accountFields = (): FormFieldSpec[] => [
  {
    name: 'accountType', label: t('账户类型'), type: 'select', full: true,
    clearOnChange: ['accountNumber', 'transferType', 'network', 'walletType'],
    valuesOnChange: (value) => (isUsdtAccountType(value)
      ? { currency: 'USDT', transferType: 'ONCHAIN', walletType: 'PRIVATE', network: '' }
      : { currency: 'USD', transferType: '', walletType: '', network: '' }),
    options: [{ value: 'BANK', label: t('空中云汇') }, { value: 'OKX_USDT', label: t('欧意') }, { value: 'BINANCE_USDT', label: t('币安') }],
  },
  { name: 'holder', label: t('收款户名'), full: true },
  { name: 'accountNumber', label: t('Airwallex beneficiary ID / 收款地址 / UID'), minLength: 3, full: true },
  {
    name: 'currency', label: t('收款币种'), type: 'select',
    options: (values) => (isUsdtAccountType(values.accountType) ? ['USDT'] : [...CURRENCIES]).map((currency) => ({ value: currency, label: currency })),
  },
  {
    name: 'transferType', label: t('转账方式'), type: 'select', visible: (values) => isUsdtAccountType(values.accountType),
    options: (values) => (values.accountType === 'BINANCE_USDT'
      ? [{ value: 'ONCHAIN', label: t('链上转账') }]
      : [{ value: 'ONCHAIN', label: t('链上转账') }, { value: 'INTERNAL_UID', label: t('欧意 UID 内部转账') }]),
  },
  {
    name: 'network', label: t('USDT 网络'), placeholder: t('OKX 如 USDT-TRC20；Binance 如 TRX、BSC、ETH'),
    visible: (values) => isUsdtAccountType(values.accountType) && values.transferType === 'ONCHAIN',
  },
  {
    name: 'walletType', label: t('钱包类型'), type: 'select',
    visible: (values) => isUsdtAccountType(values.accountType) && values.transferType === 'ONCHAIN',
    options: [{ value: 'PRIVATE', label: t('私人钱包') }, { value: 'EXCHANGE', label: t('交易所钱包') }],
  },
];

function initialFor(target: SupplierAccount | 'new'): FormValues {
  // The holder always starts as the supplier's entity name; account numbers are never prefilled.
  return target === 'new'
    ? { holder: props.supplierName, accountType: 'BANK', currency: 'USD', transferType: 'ONCHAIN', network: '', walletType: 'PRIVATE' }
    : {
      holder: props.supplierName, accountType: target.accountType || 'BANK', currency: target.currency,
      transferType: target.transferType || 'ONCHAIN', network: target.network || '', walletType: target.walletType || 'PRIVATE',
    };
}

async function submitAccount(values: FormValues) {
  const target = editing.value;
  const usdt = isUsdtAccountType(values.accountType);
  await apiPost('/accounts', {
    ...values,
    bank: bankForAccountType(values.accountType),
    currency: usdt ? 'USDT' : values.currency,
    transferType: usdt ? values.transferType : null,
    network: usdt && values.transferType === 'ONCHAIN' ? values.network : null,
    walletType: usdt && values.transferType === 'ONCHAIN' ? values.walletType : null,
    supplierId: props.supplierId,
    replacesId: target === 'new' || !target ? null : target.id,
  });
  session.notify(t('收款账户已提交审核'));
  session.refresh();
}
</script>

<template>
  <section class="acc">
    <div class="acc-title">
      <h3>{{ t('收款账户') }}</h3>
      <Button v-if="session.has('account.write')" size="sm" icon="plus" @click="editing = 'new'">{{ t('新增账户') }}</Button>
    </div>
    <article v-for="account in accounts ?? []" :key="account.id" class="acc-card">
      <header class="acc-head">
        <div class="acc-identity">
          <span class="acc-icon"><Icon name="bank" :size="17" /></span>
          <div><strong>{{ payoutProviderLabel(account) }}</strong><small>{{ account.holder }}</small></div>
        </div>
        <StatusBadge :state="account.state" :label="account.state === 'APPROVED' ? t('生效中') : undefined" />
      </header>
      <div class="acc-number">
        <span>{{ revealed[account.id] || `•••• •••• •••• ${account.lastFour}` }}</span>
        <b>{{ account.currency }}</b>
        <IconButton v-if="session.has('account.sensitive')" icon="eye" :size="17" :label="t('查看完整账号')" @click="reveal(account)" />
      </div>
      <DetailList :items="details(account)" />
      <div v-if="session.has('account.write') && account.state === 'APPROVED'">
        <button type="button" class="acc-link" @click="editing = account">{{ t('申请变更') }}</button>
      </div>
      <ReviewBox v-if="canReview(account)" :on-review="(approved, note) => review(account, approved, note)" />
    </article>
    <EmptyState v-if="!accounts?.length" :text="t('暂无收款账户')" compact />

    <SupplierFormModal
      v-if="editing"
      :title="editing === 'new' ? t('新增收款账户') : t('提交账户变更')"
      :subtitle="t('仅支持与供应商主体同名的账户。')"
      :fields="accountFields()"
      :initial="initialFor(editing)"
      :submit-label="t('提交审核')"
      :on-submit="submitAccount"
      @close="editing = null"
    />
  </section>
</template>

<style scoped>
.acc { display: grid; gap: 12px; }
.acc-title { display: flex; align-items: center; justify-content: space-between; gap: 12px; }
.acc-title h3 { margin: 0; font-size: var(--hs-text-sm); font-weight: 600; }
.acc-card { display: grid; gap: 12px; padding: 14px 16px; border: 1px solid var(--hs-border); border-radius: 14px; }
.acc-head { display: flex; align-items: center; justify-content: space-between; gap: 12px; }
.acc-identity { display: flex; align-items: center; gap: 10px; min-width: 0; }
.acc-identity div { display: grid; gap: 2px; }
.acc-identity strong { color: var(--hs-text); font-size: var(--hs-text-sm); font-weight: 600; }
.acc-identity small { color: var(--hs-text-3); font-size: var(--hs-text-xs); }
.acc-icon { display: grid; place-items: center; width: 34px; height: 34px; color: var(--hs-text-3); background: var(--hs-surface-subtle); border-radius: 9px; flex: none; }
.acc-number { display: flex; align-items: center; gap: 10px; padding: 10px 12px; background: var(--hs-surface-subtle); border-radius: 10px; font-family: var(--hs-font-mono); font-size: var(--hs-text-sm); }
.acc-number span { flex: 1; min-width: 0; color: var(--hs-text); overflow-wrap: anywhere; }
.acc-number b { color: var(--hs-text-3); font-size: var(--hs-text-xs); font-weight: 600; }
.acc-link { padding: 0; color: var(--hs-accent); background: none; border: 0; font: inherit; font-size: var(--hs-text-sm); cursor: pointer; }
.acc-link:hover { text-decoration: underline; text-underline-offset: 3px; }
</style>
