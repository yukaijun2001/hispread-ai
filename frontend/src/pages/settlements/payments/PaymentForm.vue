<script setup lang="ts">
// Offline payment request against a confirmed settlement. Another finance or
// admin user must approve it before the transfer is recorded.
import { computed, reactive, ref, useId } from 'vue';
import Dialog from '../../../components/ui/Dialog.vue';
import Button from '../../../components/ui/Button.vue';
import Notice from '../../../components/ui/Notice.vue';
import FormField from '../../../components/ui/FormField.vue';
import Select from '../../../components/ui/Select.vue';
import TextInput from '../../../components/ui/TextInput.vue';
import EvidenceEditor from './EvidenceEditor.vue';
import { useApiData } from '../../../composables/useApiData';
import { apiPost } from '../../../lib/api';
import { t } from '../../../lib/i18n';
import { CURRENCIES } from '../../../lib/labels';
import { formatDateTime, formatMoney, multiplyMoney, subtractMoney } from '../../../lib/money';
import { useSessionStore } from '../../../stores/session';
import { useEvidence } from './evidence';
import type { Settlement } from '../settlements';
import type { CurrentRate, Payment } from './payments';

const props = defineProps<{ settlement: Pick<Settlement, 'id' | 'code' | 'supplierId' | 'supplierName' | 'currency' | 'total' | 'reservedAmount'> }>();
const emit = defineEmits<{ close: []; payment: [payment: Payment] }>();

const session = useSessionStore();
const formId = useId();
const permitted = session.has('payment.create') && session.has('file.write');
const evidence = useEvidence();
const rates = useApiData<CurrentRate[]>(session.has('exchange_rate.read') ? '/exchange-rates/current' : null);

const available = subtractMoney(props.settlement.total, props.settlement.reservedAmount, props.settlement.currency);
const values = reactive({ obligationAmount: available, payoutCurrency: props.settlement.currency, exchangeRateId: '', fee: '0' });
const reference = ref('');
const requestKey = crypto.randomUUID();
const busy = ref(false);
const error = ref('');

const converting = computed(() => values.payoutCurrency !== props.settlement.currency);
const currencyOptions = CURRENCIES.map((value) => ({ value, label: value }));
const rateOptions = computed(() => (rates.data.value ?? [])
  .filter((rate) => rate.baseCurrency === props.settlement.currency && rate.quoteCurrency === values.payoutCurrency)
  .map((rate) => ({ value: rate.id, label: `V${rate.version} · ${rate.rate} ${rate.quoteCurrency} · ${formatDateTime(rate.effectiveFrom)}` })));
const chosenRate = computed(() => rates.data.value?.find((rate) => rate.id === values.exchangeRateId));
const expected = computed(() => {
  if (!converting.value) return formatMoney(values.obligationAmount, values.payoutCurrency);
  return chosenRate.value ? formatMoney(multiplyMoney(values.obligationAmount, chosenRate.value.rate, values.payoutCurrency), values.payoutCurrency) : t('请选择当前汇率');
});

function setPayoutCurrency(value: string) {
  values.payoutCurrency = value;
  values.exchangeRateId = '';
}
function close() { if (!busy.value) emit('close'); }

async function submit() {
  if (busy.value) return;
  if (!values.payoutCurrency) { error.value = t('请选择{0}', [t('实际付款币种')]); return; }
  if (converting.value && !values.exchangeRateId) { error.value = t('请选择{0}', [t('当前汇率版本（1 {0} ＝）', [props.settlement.currency])]); return; }
  busy.value = true;
  error.value = '';
  try {
    const prepared = await evidence.prepare(props.settlement.supplierId);
    const result = await apiPost<Payment>('/payments/offline', {
      settlementId: props.settlement.id,
      obligationAmount: values.obligationAmount,
      payoutCurrency: values.payoutCurrency,
      exchangeRateId: converting.value ? values.exchangeRateId : null,
      fee: values.fee,
      requestKey,
      ...prepared,
      externalRef: reference.value,
    });
    session.refresh();
    session.notify(t('线下付款申请已提交，等待独立审核'));
    emit('payment', result);
    emit('close');
  } catch (reason) {
    error.value = reason instanceof Error ? reason.message : t('操作失败');
  } finally {
    busy.value = false;
  }
}
</script>

<template>
  <Dialog v-if="!permitted" :title="t('申请线下付款')" @close="emit('close')">
    <Notice tone="danger">{{ t('缺少付款申请或附件上传权限，请联系管理员。') }}</Notice>
  </Dialog>
  <Dialog v-else size="lg" :title="t('申请线下付款')" :subtitle="`${settlement.supplierName} · ${settlement.code}`" @close="close">
    <form :id="formId" class="pf-form" @submit.prevent="submit">
      <fieldset>
        <legend>{{ t('付款安排') }}</legend>
        <FormField :label="t('本次抵扣应付（{0}）', [settlement.currency])" required>
          <template #default="{ id }">
            <TextInput :id="id" v-model="values.obligationAmount" type="number" min="0.01" :max="available" step="any" required :disabled="busy" />
          </template>
        </FormField>
        <div class="pf-half">
          <FormField :label="t('实际付款币种')" required>
            <template #default="{ id }">
              <Select :id="id" :model-value="values.payoutCurrency" :options="currencyOptions" :label="t('实际付款币种')" :disabled="busy"
                @update:model-value="setPayoutCurrency(String($event))" />
            </template>
          </FormField>
        </div>
      </fieldset>
      <fieldset v-if="converting">
        <legend>{{ t('收款与汇率') }}</legend>
        <FormField :label="t('当前汇率版本（1 {0} ＝）', [settlement.currency])" :hint="t('采用当前已生效的版本，提交后冻结')" required>
          <template #default="{ id }">
            <Select :id="id" v-model="values.exchangeRateId" :options="rateOptions" :label="t('当前汇率版本（1 {0} ＝）', [settlement.currency])" :placeholder="t('请选择')" :disabled="busy" />
          </template>
        </FormField>
      </fieldset>
      <fieldset>
        <legend>{{ t('手续费') }}</legend>
        <div class="pf-half">
          <FormField :label="t('平台承担的手续费（付款币种）')" required>
            <template #default="{ id }">
              <TextInput :id="id" v-model="values.fee" type="number" min="0" step="any" required :disabled="busy" />
            </template>
          </FormField>
        </div>
      </fieldset>

      <Notice>{{ t('当前仅支持线下付款。申请需由另一位财务或管理员审核通过，再登记真实转账结果和凭证；申请人不能审核自己的申请。') }}</Notice>
      <div class="pf-preview">
        <span>{{ t('预计向供应商支付') }}</span>
        <strong>{{ values.payoutCurrency }} {{ expected }}</strong>
      </div>
      <Notice v-if="rates.error.value" tone="danger">{{ rates.error.value }}</Notice>
      <FormField :label="t('付款说明与凭证')">
        <EvidenceEditor :evidence="evidence" :disabled="busy" />
      </FormField>
      <FormField :label="t('转账流水号 / 凭证编号（选填）')">
        <template #default="{ id }">
          <TextInput :id="id" v-model="reference" name="externalRef" maxlength="160" :disabled="busy" />
        </template>
      </FormField>
      <Notice v-if="error" tone="danger">{{ error }}</Notice>
    </form>
    <template #footer>
      <Button :disabled="busy" @click="close">{{ t('取消') }}</Button>
      <Button type="submit" :form="formId" variant="primary" :loading="busy">{{ busy ? t('正在提交…') : t('提交线下付款申请') }}</Button>
    </template>
  </Dialog>
</template>

<style scoped>
.pf-form { display: grid; gap: 18px; }
.pf-form fieldset { display: grid; gap: 14px; min-width: 0; margin: 0; padding: 0; border: 0; }
.pf-form legend { margin-bottom: 10px; padding: 0; color: var(--hs-text); font-size: var(--hs-text-sm); font-weight: 600; }
.pf-half { max-width: calc(50% - 7px); }
.pf-preview { display: flex; flex-wrap: wrap; align-items: baseline; justify-content: space-between; gap: 8px; padding: 14px 16px; background: var(--hs-surface-subtle); border: 1px solid var(--hs-border); border-radius: 12px; color: var(--hs-text-3); font-size: var(--hs-text-xs); }
.pf-preview strong { color: var(--hs-text); font-size: 20px; font-weight: 600; letter-spacing: -.3px; font-variant-numeric: tabular-nums; }
@media (max-width: 640px) { .pf-half { max-width: none; } }
</style>
