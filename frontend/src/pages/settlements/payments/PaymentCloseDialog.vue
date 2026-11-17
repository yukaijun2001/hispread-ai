<script setup lang="ts">
// Cancel a pending or approved payment request, or mark it failed, with a
// required reason. Either way the reserved amount is released.
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
const state = ref<'CANCELLED' | 'FAILED'>('CANCELLED');
const note = ref('');
const busy = ref(false);
const error = ref('');
// Channel payments cannot be marked failed by hand.
const options = [
  { value: 'CANCELLED' as const, label: t('作废申请') },
  ...(props.payment.paymentMethod === 'CHANNEL' ? [] : [{ value: 'FAILED' as const, label: t('付款失败') }]),
];

async function submit() {
  if (busy.value) return;
  busy.value = true;
  error.value = '';
  try {
    await apiPost(`/payments/${props.payment.id}/close`, { state: state.value, note: note.value, version: props.payment.version });
    session.refresh();
    session.notify(t(state.value === 'CANCELLED' ? '申请已作废，金额占用已释放' : '申请已关闭，金额占用已释放'));
    emit('saved');
  } catch (reason) {
    error.value = reason instanceof Error ? reason.message : t('操作失败');
  } finally {
    busy.value = false;
  }
}
</script>

<template>
  <Dialog :title="t('作废付款申请')" @close="!busy && emit('close')">
    <form :id="formId" class="pc-form" @submit.prevent="submit">
      <FormField :label="t('处理结果')" required>
        <template #default="{ id }">
          <Select :id="id" v-model="state" :options="options" :label="t('处理结果')" :disabled="busy" />
        </template>
      </FormField>
      <FormField :label="t('原因')" required>
        <template #default="{ id }">
          <TextInput :id="id" v-model="note" multiline :rows="4" required :disabled="busy" />
        </template>
      </FormField>
      <Notice v-if="error" tone="danger">{{ error }}</Notice>
    </form>
    <template #footer>
      <Button :disabled="busy" @click="emit('close')">{{ t('取消') }}</Button>
      <Button type="submit" :form="formId" variant="danger" :loading="busy">{{ busy ? t('正在提交…') : t('保存') }}</Button>
    </template>
  </Dialog>
</template>

<style scoped>
.pc-form { display: grid; gap: 14px; }
</style>
