<script setup lang="ts">
// Supplier checks whether a recorded payment actually arrived. A dispute keeps
// the payment open for finance to follow up.
import { ref, useId } from 'vue';
import Dialog from '../../../components/ui/Dialog.vue';
import Button from '../../../components/ui/Button.vue';
import Notice from '../../../components/ui/Notice.vue';
import FormField from '../../../components/ui/FormField.vue';
import Select from '../../../components/ui/Select.vue';
import TextInput from '../../../components/ui/TextInput.vue';
import { apiPost } from '../../../lib/api';
import { t } from '../../../lib/i18n';
import { useSessionStore } from '../../../stores/session';
import type { Payment } from './payments';

const props = defineProps<{ payment: Payment }>();
const emit = defineEmits<{ close: []; saved: [] }>();

const session = useSessionStore();
const formId = useId();
const confirmed = ref<'true' | 'false'>('true');
const note = ref('');
const busy = ref(false);
const error = ref('');
const options = [
  { value: 'true' as const, label: t('已核实到账') },
  { value: 'false' as const, label: t('未到账或金额有异议') },
];

async function submit() {
  if (busy.value) return;
  busy.value = true;
  error.value = '';
  try {
    await apiPost(`/payments/${props.payment.id}/receipt`, { confirmed: confirmed.value === 'true', note: note.value || '' });
    session.refresh();
    session.notify(t('收款核对已保存'));
    emit('saved');
  } catch (reason) {
    error.value = reason instanceof Error ? reason.message : t('操作失败');
  } finally {
    busy.value = false;
  }
}
</script>

<template>
  <Dialog :title="t('核对到账情况')" @close="!busy && emit('close')">
    <form :id="formId" class="pr-form" @submit.prevent="submit">
      <FormField :label="t('核对结果')" required>
        <template #default="{ id }">
          <Select :id="id" v-model="confirmed" :options="options" :label="t('核对结果')" :disabled="busy" />
        </template>
      </FormField>
      <FormField :label="t('说明')">
        <template #default="{ id }">
          <TextInput :id="id" v-model="note" multiline :rows="4" :disabled="busy" />
        </template>
      </FormField>
      <Notice v-if="error" tone="danger">{{ error }}</Notice>
    </form>
    <template #footer>
      <Button :disabled="busy" @click="emit('close')">{{ t('取消') }}</Button>
      <Button type="submit" :form="formId" variant="primary" :loading="busy">{{ busy ? t('正在提交…') : t('保存') }}</Button>
    </template>
  </Dialog>
</template>

<style scoped>
.pr-form { display: grid; gap: 14px; }
</style>
