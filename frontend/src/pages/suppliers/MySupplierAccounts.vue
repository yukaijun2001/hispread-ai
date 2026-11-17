<script setup lang="ts">
// The supplier's payout accounts. New accounts and changes go through platform
// review; a change keeps the old account active until the replacement is approved.
// Full account numbers are never shown, only the last four digits.
import { computed, ref } from 'vue';
import Card from '../../components/ui/Card.vue';
import Button from '../../components/ui/Button.vue';
import EmptyState from '../../components/ui/EmptyState.vue';
import FormField from '../../components/ui/FormField.vue';
import Icon from '../../components/ui/Icon.vue';
import Notice from '../../components/ui/Notice.vue';
import Select from '../../components/ui/Select.vue';
import Spinner from '../../components/ui/Spinner.vue';
import StatusBadge from '../../components/ui/StatusBadge.vue';
import TextInput from '../../components/ui/TextInput.vue';
import { useApiData } from '../../composables/useApiData';
import { apiPost } from '../../lib/api';
import { t } from '../../lib/i18n';
import { CURRENCIES, payoutProviderLabel } from '../../lib/labels';
import { useSessionStore } from '../../stores/session';
import { bankForAccountType, isUsdtAccountType } from './suppliers';
import type { OwnSupplier, PayoutAccountRecord } from './supplierAccounts';

const props = defineProps<{ supplier: OwnSupplier }>();
const session = useSessionStore();

const accounts = useApiData<PayoutAccountRecord[]>(() => (session.has('account.read') ? `/accounts?supplierId=${props.supplier.id}` : null));

interface AccountForm { holder: string; currency: string; accountType: string; transferType: string; network: string; walletType: string; accountNumber: string }
const target = ref<'new' | PayoutAccountRecord | null>(null);
const form = ref<AccountForm>({ holder: '', currency: '', accountType: 'BANK', transferType: '', network: '', walletType: 'PRIVATE', accountNumber: '' });
const submitting = ref(false);
const error = ref('');

const canWrite = computed(() => session.has('account.write') && props.supplier.enabled);
const changePending = (account: PayoutAccountRecord) => !!accounts.data.value?.some((other) => other.state === 'PENDING' && other.replacesId === account.id);
const usdt = computed(() => isUsdtAccountType(form.value.accountType));

function open(next: 'new' | PayoutAccountRecord) {
  target.value = next;
  form.value = next === 'new'
    ? { holder: props.supplier.name, currency: 'USD', accountType: 'BANK', transferType: 'ONCHAIN', network: '', walletType: 'PRIVATE', accountNumber: '' }
    : {
      holder: props.supplier.name,
      currency: next.currency,
      accountType: next.accountType || 'BANK',
      transferType: next.transferType || 'ONCHAIN',
      network: next.network || '',
      walletType: next.walletType || 'PRIVATE',
      accountNumber: '',
    };
  error.value = '';
}

const patch = (values: Partial<AccountForm>) => { form.value = { ...form.value, ...values }; };
const accountTypeModel = computed({
  get: () => form.value.accountType || 'BANK',
  set: (value: string) => patch({ accountType: value, currency: isUsdtAccountType(value) ? 'USDT' : 'USD', transferType: isUsdtAccountType(value) ? 'ONCHAIN' : '' }),
});
const currencyModel = computed({ get: () => form.value.currency, set: (value: string) => patch({ currency: value }) });
const transferModel = computed({ get: () => form.value.transferType || 'ONCHAIN', set: (value: string) => patch({ transferType: value }) });
const walletModel = computed({ get: () => form.value.walletType || 'PRIVATE', set: (value: string) => patch({ walletType: value }) });

const accountTypeOptions = [{ value: 'BANK', label: t('空中云汇') }, { value: 'OKX_USDT', label: t('欧意') }, { value: 'BINANCE_USDT', label: t('币安') }];
const currencyOptions = computed(() => (usdt.value ? ['USDT'] : [...CURRENCIES]).map((value) => ({ value, label: value })));
const transferOptions = computed(() => (form.value.accountType === 'BINANCE_USDT'
  ? [{ value: 'ONCHAIN', label: t('链上转账') }]
  : [{ value: 'ONCHAIN', label: t('链上转账') }, { value: 'INTERNAL_UID', label: t('欧意 UID 内部转账') }]));
const walletOptions = [{ value: 'PRIVATE', label: t('私人钱包') }, { value: 'EXCHANGE', label: t('交易所钱包') }];
const numberLabel = computed(() => (form.value.accountType === 'OKX_USDT' ? t('收款地址 / 欧意 UID')
  : form.value.accountType === 'BINANCE_USDT' ? t('币安 USDT 收款地址') : 'Airwallex beneficiary ID'));

async function submit() {
  const replacing = target.value;
  if (submitting.value || !replacing) return;
  submitting.value = true;
  error.value = '';
  const f = form.value;
  const onchain = usdt.value && f.transferType === 'ONCHAIN';
  try {
    await apiPost('/accounts', {
      supplierId: props.supplier.id,
      holder: f.holder.trim(),
      bank: bankForAccountType(f.accountType),
      accountNumber: f.accountNumber.trim(),
      currency: f.currency,
      accountType: f.accountType || 'BANK',
      transferType: usdt.value ? f.transferType : null,
      network: onchain ? f.network.trim() : null,
      walletType: onchain ? f.walletType : null,
      replacesId: replacing === 'new' ? null : replacing.id,
    });
    session.notify(t('收款账户已提交审核'));
    target.value = null;
    session.refresh();
  } catch (reason) {
    error.value = (reason as Error).message;
  } finally {
    submitting.value = false;
  }
}
</script>

<template>
  <Card :title="t('收款账户')" :description="t('账户变更须经审核，审核通过前旧账户仍有效')">
    <template v-if="canWrite && !target" #actions>
      <Button size="sm" icon="plus" @click="open('new')">{{ t('新增账户') }}</Button>
    </template>

    <div class="ma-body">
      <template v-if="session.has('account.read')">
        <EmptyState v-if="accounts.error.value" error :text="accounts.error.value" compact>
          <Button size="sm" icon="refresh" @click="accounts.reload()">{{ t('重试') }}</Button>
        </EmptyState>
        <div v-else-if="accounts.loading.value && !accounts.data.value" class="ma-loading"><Spinner :size="16" /></div>
        <ul v-else-if="accounts.data.value?.length" class="ma-list">
          <li v-for="account in accounts.data.value" :key="account.id" class="ma-row">
            <div class="ma-row-head">
              <span class="ma-icon"><Icon name="bank" :size="17" /></span>
              <div class="ma-name">
                <strong>{{ payoutProviderLabel(account) }}</strong>
                <small>{{ account.holder }}</small>
              </div>
              <StatusBadge :state="account.state" :label="account.state === 'APPROVED' ? t('生效中') : undefined" />
            </div>
            <div class="ma-row-bottom">
              <span class="ma-number">
                {{ account.currency }} · {{ account.transferType === 'INTERNAL_UID' ? 'UID' : account.network || t('收款账号') }} {{ t('· 尾号') }} {{ account.lastFour }}
              </span>
              <span v-if="account.state === 'PENDING'" class="ma-quiet">{{ t('审核通过后才可用于收款') }}</span>
              <span v-if="changePending(account)" class="ma-quiet">{{ t('变更审核中，当前账户仍有效') }}</span>
              <Button v-if="canWrite && account.state === 'APPROVED' && !changePending(account) && !target" size="sm" @click="open(account)">{{ t('申请变更') }}</Button>
            </div>
            <Notice v-if="account.state === 'REJECTED' && account.reviewNote" tone="danger">{{ t('退回原因：') }}{{ account.reviewNote }}</Notice>
          </li>
        </ul>
        <EmptyState v-else :text="t('尚未添加收款账户')" icon="bank" compact />
      </template>
      <EmptyState v-else error :text="t('当前账号没有收款账户查看权限')" compact />

      <form v-if="target" class="ma-form" @submit.prevent="submit">
        <h4>{{ target === 'new' ? t('新增收款账户') : t('提交账户变更') }}</h4>
        <Notice v-if="target !== 'new'" tone="warning">
          {{ t('原账户') }} {{ payoutProviderLabel(target) }} · {{ target.currency }} {{ t('· 尾号') }} {{ target.lastFour }}{{ t('仍有效；新账户审核通过后才会替换它。') }}
        </Notice>
        <p class="ma-hint">{{ t('仅支持与当前供应商主体同名的账户；完整账号、地址或 UID 不会在页面回显。') }}</p>
        <div class="ma-grid">
          <FormField :label="t('账户类型')">
            <template #default="{ id }"><Select :id="id" v-model="accountTypeModel" :options="accountTypeOptions" :label="t('账户类型')" /></template>
          </FormField>
          <FormField :label="t('收款户名')" required>
            <template #default="{ id }"><TextInput :id="id" :model-value="form.holder" required maxlength="160" @update:model-value="patch({ holder: $event })" /></template>
          </FormField>
          <FormField :label="numberLabel" required>
            <template #default="{ id }">
              <TextInput :id="id" :model-value="form.accountNumber" required minlength="3" maxlength="300" autocomplete="off" @update:model-value="patch({ accountNumber: $event })" />
            </template>
          </FormField>
          <FormField :label="t('收款币种')">
            <template #default="{ id }"><Select :id="id" v-model="currencyModel" :options="currencyOptions" :label="t('收款币种')" /></template>
          </FormField>
          <template v-if="usdt">
            <FormField :label="t('转账方式')">
              <template #default="{ id }"><Select :id="id" v-model="transferModel" :options="transferOptions" :label="t('转账方式')" /></template>
            </FormField>
            <template v-if="form.transferType !== 'INTERNAL_UID'">
              <FormField :label="t('USDT 网络')" required>
                <template #default="{ id }">
                  <TextInput :id="id" :model-value="form.network" required :placeholder="form.accountType === 'BINANCE_USDT' ? t('如 TRX、BSC、ETH') : t('如 USDT-TRC20')"
                    @update:model-value="patch({ network: $event })" />
                </template>
              </FormField>
              <FormField :label="t('钱包类型')">
                <template #default="{ id }"><Select :id="id" v-model="walletModel" :options="walletOptions" :label="t('钱包类型')" /></template>
              </FormField>
            </template>
          </template>
        </div>
        <Notice v-if="error" tone="danger">{{ error }}</Notice>
        <div class="ma-actions">
          <Button :disabled="submitting" @click="target = null">{{ t('取消') }}</Button>
          <Button type="submit" variant="primary" :disabled="submitting">{{ submitting ? t('提交中…') : t('提交账户审核') }}</Button>
        </div>
      </form>
    </div>
  </Card>
</template>

<style scoped>
.ma-body { display: grid; gap: 14px; }
.ma-loading { display: grid; place-items: center; padding: 24px; color: var(--hs-text-3); }
.ma-list { display: grid; gap: 10px; margin: 0; padding: 0; list-style: none; }
.ma-row { display: grid; gap: 10px; padding: 12px 14px; border: 1px solid var(--hs-border); border-radius: 12px; }
.ma-row-head { display: flex; align-items: center; gap: 10px; }
.ma-icon { display: grid; place-items: center; width: 32px; height: 32px; color: var(--hs-text-3); background: var(--hs-surface-subtle); border-radius: 9px; flex: none; }
.ma-name { display: grid; flex: 1; min-width: 0; }
.ma-name strong { color: var(--hs-text); font-size: var(--hs-text-sm); font-weight: 500; }
.ma-name small { color: var(--hs-text-3); font-size: var(--hs-text-xs); overflow-wrap: anywhere; }
.ma-row-bottom { display: flex; flex-wrap: wrap; align-items: center; gap: 6px 12px; }
.ma-number { color: var(--hs-text-2); font-size: var(--hs-text-xs); font-variant-numeric: tabular-nums; }
.ma-quiet { color: var(--hs-text-3); font-size: var(--hs-text-xs); }
.ma-row-bottom :deep(.hs-button) { margin-left: auto; }
.ma-form { display: grid; gap: 12px; padding: 14px; background: var(--hs-surface-subtle); border: 1px solid var(--hs-border); border-radius: 12px; }
.ma-form h4 { margin: 0; color: var(--hs-text); font-size: var(--hs-text-sm); font-weight: 600; }
.ma-hint { margin: 0; color: var(--hs-text-3); font-size: var(--hs-text-xs); line-height: 1.6; }
.ma-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 12px 14px; }
.ma-actions { display: flex; justify-content: flex-end; gap: 8px; }
</style>
