<script setup lang="ts">
// Add or deduct an amount on a pending settlement before its confirmation
// deadline. The original amounts and quote snapshots are not touched.
import { computed, ref, useId } from 'vue';
import Dialog from '../../../components/ui/Dialog.vue';
import Button from '../../../components/ui/Button.vue';
import Notice from '../../../components/ui/Notice.vue';
import FormField from '../../../components/ui/FormField.vue';
import Select from '../../../components/ui/Select.vue';
import TextInput from '../../../components/ui/TextInput.vue';
import { apiPost } from '../../../lib/api';
import { t } from '../../../lib/i18n';
import { compareDecimal, formatMoney, sumDecimals } from '../../../lib/money';
import type { Settlement } from '../settlements';

const props = defineProps<{ settlement: Settlement }>();
const emit = defineEmits<{ close: []; saved: [] }>();

const formId = useId();
const businessDate = ref(props.settlement.periodStart);
const amount = ref('');
const note = ref('');
const supplierVisible = ref<'false' | 'true'>('false');
const requestKey = crypto.randomUUID();
const busy = ref(false);
const error = ref('');

const deadlinePassed = () => !!props.settlement.confirmationDeadline && Date.parse(props.settlement.confirmationDeadline) <= Date.now();
const currency = computed(() => props.settlement.currency);
const previewable = computed(() => /^-?\d+(?:\.\d+)?$/.test(amount.value));
const visibilityOptions = [{ value: 'false' as const, label: t('仅平台内部可见') }, { value: 'true' as const, label: t('供应商可见') }];

function validate(): string {
  const s = props.settlement;
  if (deadlinePassed()) return t('本单确认截止时间已到，请关闭弹窗并刷新结算单状态');
  if (!/^\d{4}-\d{2}-\d{2}$/.test(businessDate.value) || businessDate.value < s.periodStart || businessDate.value > s.periodEnd) return t('结算日期必须在本单结算期间内');
  if (!(s.currency === 'JPY' ? /^-?\d+$/ : /^-?\d+(?:\.\d{1,2})?$/).test(amount.value)) return s.currency === 'JPY' ? t('请输入整数加减金额') : t('加减金额最多保留两位小数');
  if (compareDecimal(amount.value, '0') === 0) return t('加减金额不能为零');
  if (compareDecimal(sumDecimals([s.total, amount.value]), '0') < 0) return t('调整后的最终应付不能小于零');
  if (!note.value.trim()) return t('请填写调整说明');
  return '';
}

async function submit() {
  if (busy.value) return;
  const problem = validate();
  error.value = problem;
  if (problem) return;
  busy.value = true;
  try {
    await apiPost(`/settlements/${props.settlement.id}/adjustments`, {
      businessDate: businessDate.value,
      amount: amount.value,
      note: note.value.trim(),
      supplierVisible: supplierVisible.value === 'true',
      version: props.settlement.version,
      requestKey,
    });
    emit('saved');
    emit('close');
  } catch (reason) {
    error.value = reason instanceof Error ? reason.message : t('操作失败');
  } finally {
    busy.value = false;
  }
}
</script>

<template>
  <Dialog :title="t('加减结算金额')" :subtitle="`${settlement.code} · ${settlement.currency}`" @close="!busy && emit('close')">
    <form :id="formId" class="st-adjust" @submit.prevent="submit">
      <FormField :label="t('结算日期')" required>
        <template #default="{ id }">
          <TextInput :id="id" v-model="businessDate" type="date" :min="settlement.periodStart" :max="settlement.periodEnd" required :disabled="busy" />
        </template>
      </FormField>
      <FormField :label="t('加减金额（{0}）', [currency])" :hint="t('正数增加，负数扣减；不会修改原始金额和报价快照。')" required>
        <template #default="{ id }">
          <TextInput :id="id" v-model="amount" type="number" :step="currency === 'JPY' ? '1' : '0.01'" required :disabled="busy" />
        </template>
      </FormField>
      <FormField :label="t('调整说明')" required>
        <template #default="{ id }">
          <TextInput :id="id" v-model="note" multiline :rows="3" required :disabled="busy" />
        </template>
      </FormField>
      <FormField :label="t('供应商是否可见')" :hint="t('供应商始终可见最终应收；选择仅内部可见时，不展示本条加减金额与说明。')" required>
        <template #default="{ id }">
          <Select :id="id" v-model="supplierVisible" :options="visibilityOptions" :label="t('供应商是否可见')" :disabled="busy" />
        </template>
      </FormField>
      <Notice v-if="deadlinePassed()" tone="warning">{{ t('本单确认截止时间已到，请关闭弹窗并刷新结算单状态。') }}</Notice>
      <Notice v-else>
        {{ t('当前最终应付：') }}{{ currency }} {{ formatMoney(settlement.total, currency) }}
        <template v-if="previewable"> {{ t('→ 调整后预览：') }}{{ currency }} {{ formatMoney(sumDecimals([settlement.total, amount]), currency) }}</template>{{ t('。确认后金额冻结。') }}
      </Notice>
      <Notice v-if="error" tone="danger">{{ error }}</Notice>
    </form>
    <template #footer>
      <Button :disabled="busy" @click="emit('close')">{{ t('取消') }}</Button>
      <Button type="submit" :form="formId" variant="primary" :loading="busy">{{ busy ? t('正在提交…') : t('保存调整') }}</Button>
    </template>
  </Dialog>
</template>

<style scoped>
.st-adjust { display: grid; gap: 14px; }
</style>
