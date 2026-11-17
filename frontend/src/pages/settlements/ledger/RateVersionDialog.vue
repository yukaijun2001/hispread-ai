<script setup lang="ts">
// "新增汇率版本": publish a new rate for a currency pair. The server assigns the
// next version number; earlier versions are never edited.
import { reactive, ref, useId } from 'vue';
import Dialog from '../../../components/ui/Dialog.vue';
import Button from '../../../components/ui/Button.vue';
import Notice from '../../../components/ui/Notice.vue';
import FormField from '../../../components/ui/FormField.vue';
import Select from '../../../components/ui/Select.vue';
import TextInput from '../../../components/ui/TextInput.vue';
import { apiPost } from '../../../lib/api';
import { t } from '../../../lib/i18n';
import { CURRENCIES } from '../../../lib/labels';

const emit = defineEmits<{ close: []; created: [] }>();

const formId = useId();
const now = new Date();
const values = reactive({
  baseCurrency: 'USD',
  quoteCurrency: 'CNY',
  rate: '',
  // Browser-local "now" for the datetime-local field.
  effectiveFrom: new Date(now.getTime() - now.getTimezoneOffset() * 60_000).toISOString().slice(0, 16),
});
const busy = ref(false);
const error = ref('');
const currencyOptions = CURRENCIES.map((value) => ({ value, label: value }));

function close() { if (!busy.value) emit('close'); }

async function submit() {
  if (busy.value) return;
  busy.value = true;
  error.value = '';
  try {
    if (values.baseCurrency === values.quoteCurrency) throw new Error(t('基准币种与报价币种不能相同'));
    await apiPost('/exchange-rates', { ...values, effectiveFrom: new Date(values.effectiveFrom).toISOString() });
    emit('created');
  } catch (reason) {
    error.value = reason instanceof Error ? reason.message : t('操作失败');
  } finally {
    busy.value = false;
  }
}
</script>

<template>
  <Dialog :title="t('新增汇率版本')" :subtitle="t('同一币种对自动递增版本号，历史版本不可修改。')" @close="close">
    <form :id="formId" class="rv-form" @submit.prevent="submit">
      <div class="rv-pair">
        <FormField :label="t('基准币种')" required>
          <template #default="{ id }"><Select :id="id" v-model="values.baseCurrency" :options="currencyOptions" :label="t('基准币种')" :disabled="busy" /></template>
        </FormField>
        <FormField :label="t('报价币种')" required>
          <template #default="{ id }"><Select :id="id" v-model="values.quoteCurrency" :options="currencyOptions" :label="t('报价币种')" :disabled="busy" /></template>
        </FormField>
      </div>
      <FormField :label="t('汇率（1 基准币种兑换）')" required>
        <template #default="{ id }">
          <TextInput :id="id" v-model="values.rate" type="number" min="0.000000000001" step="any" required autocomplete="off" :disabled="busy"
            :prefix="`1 ${values.baseCurrency} =`" :suffix="values.quoteCurrency" />
        </template>
      </FormField>
      <FormField :label="t('生效时间')" required>
        <template #default="{ id }"><TextInput :id="id" v-model="values.effectiveFrom" type="datetime-local" required :disabled="busy" /></template>
      </FormField>
      <Notice v-if="error" tone="danger">{{ error }}</Notice>
    </form>
    <template #footer>
      <Button :disabled="busy" @click="close">{{ t('取消') }}</Button>
      <Button type="submit" :form="formId" variant="primary" :loading="busy">{{ busy ? t('正在提交…') : t('保存') }}</Button>
    </template>
  </Dialog>
</template>

<style scoped>
.rv-form { display: grid; gap: 14px; }
.rv-pair { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 14px; }
@media (max-width: 560px) { .rv-pair { grid-template-columns: minmax(0, 1fr); } }
</style>
