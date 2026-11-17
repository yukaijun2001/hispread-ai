<script setup lang="ts">
// Record one day's turnover. Every field but the note is required; the browser
// checks dates, amount range and step before submit. Closes after a save.
import { ref, useId } from 'vue';
import Dialog from '../../components/ui/Dialog.vue';
import Button from '../../components/ui/Button.vue';
import Notice from '../../components/ui/Notice.vue';
import FormField from '../../components/ui/FormField.vue';
import Select from '../../components/ui/Select.vue';
import TextInput from '../../components/ui/TextInput.vue';
import { apiPost } from '../../lib/api';
import { t } from '../../lib/i18n';
import { CURRENCIES } from '../../lib/labels';
import { beijingDate } from '../../lib/money';
import { useSessionStore } from '../../stores/session';

const props = defineProps<{ currency: string }>();
const emit = defineEmits<{ close: [] }>();
const session = useSessionStore();

const formId = useId();
const today = beijingDate();
const businessDate = ref(today);
const siteName = ref('');
const currency = ref(props.currency);
const amount = ref('');
const note = ref('');
const busy = ref(false);
const error = ref('');
const currencyOptions = CURRENCIES.map((code) => ({ value: code as string, label: code }));

function close() { if (!busy.value) emit('close'); }

async function submit() {
  if (busy.value) return;
  if (!currency.value) { error.value = t('请选择{0}', [t('币种')]); return; }
  busy.value = true;
  error.value = '';
  try {
    await apiPost('/turnover', {
      businessDate: businessDate.value,
      siteName: siteName.value,
      currency: currency.value,
      amount: amount.value,
      note: note.value,
    });
    session.notify(t('已记下这笔营业额'));
    session.refresh();
    emit('close');
  } catch (reason) {
    error.value = reason instanceof Error ? reason.message : t('操作失败');
  } finally {
    busy.value = false;
  }
}
</script>

<template>
  <Dialog :title="t('登记营业额')" :subtitle="t('同一天、同一站点和币种只能记一次。')" @close="close">
    <form :id="formId" class="tr-form" @submit.prevent="submit">
      <FormField :label="t('日期')">
        <template #default="{ id }"><TextInput :id="id" v-model="businessDate" type="date" required :max="today" :disabled="busy" /></template>
      </FormField>
      <FormField :label="t('站点')">
        <template #default="{ id }"><TextInput :id="id" v-model="siteName" required autocomplete="off" :placeholder="t('站点名称')" :disabled="busy" /></template>
      </FormField>
      <FormField :label="t('币种')">
        <template #default="{ id }"><Select :id="id" v-model="currency" :options="currencyOptions" :label="t('币种')" :placeholder="t('请选择')" :disabled="busy" /></template>
      </FormField>
      <FormField :label="t('营业额')">
        <template #default="{ id }"><TextInput :id="id" v-model="amount" type="number" required min="0" step="0.01" autocomplete="off" :disabled="busy" /></template>
      </FormField>
      <FormField :label="t('备注')" optional class="full">
        <template #default="{ id }"><TextInput :id="id" v-model="note" autocomplete="off" :placeholder="t('可选')" :disabled="busy" /></template>
      </FormField>
    </form>
    <Notice v-if="error" tone="danger" class="tr-form-error">{{ error }}</Notice>
    <template #footer>
      <Button :disabled="busy" @click="close">{{ t('取消') }}</Button>
      <Button variant="primary" type="submit" :form="formId" :loading="busy">{{ busy ? t('正在提交…') : t('保存') }}</Button>
    </template>
  </Dialog>
</template>

<style scoped>
.tr-form { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 14px 16px; }
.tr-form .full { grid-column: 1 / -1; }
.tr-form-error { margin-top: 14px; }
@media (max-width: 640px) { .tr-form { grid-template-columns: minmax(0, 1fr); } }
</style>
