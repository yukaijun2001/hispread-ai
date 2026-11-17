<script setup lang="ts">
// Record the real transfer for an independently approved offline payment:
// optional reference plus the evidence note and attachments.
import { ref, useId } from 'vue';
import Dialog from '../../../components/ui/Dialog.vue';
import Button from '../../../components/ui/Button.vue';
import Notice from '../../../components/ui/Notice.vue';
import FormField from '../../../components/ui/FormField.vue';
import TextInput from '../../../components/ui/TextInput.vue';
import EvidenceEditor from './EvidenceEditor.vue';
import { apiPost } from '../../../lib/api';
import { t } from '../../../lib/i18n';
import { useSessionStore } from '../../../stores/session';
import { useEvidence } from './evidence';
import type { Payment } from './payments';

const props = defineProps<{ payment: Payment }>();
const emit = defineEmits<{ close: []; saved: [] }>();

const session = useSessionStore();
const formId = useId();
const evidence = useEvidence();
const reference = ref('');
const busy = ref(false);
const error = ref('');

async function submit() {
  if (busy.value) return;
  busy.value = true;
  error.value = '';
  try {
    const prepared = await evidence.prepare(props.payment.supplierId);
    await apiPost(`/payments/${props.payment.id}/offline-record`, { externalRef: reference.value, version: props.payment.version, ...prepared });
    session.refresh();
    session.notify(t('付款结果已登记'));
    emit('saved');
  } catch (reason) {
    error.value = reason instanceof Error ? reason.message : t('操作失败');
  } finally {
    busy.value = false;
  }
}
</script>

<template>
  <Dialog size="lg" :title="t('线下付款 / 上传凭证')" :subtitle="t('本申请已由独立审核人通过。请核对实际转账结果并上传真实凭证，登记后通知供应商确认到账。')" @close="!busy && emit('close')">
    <form :id="formId" class="or-form" @submit.prevent="submit">
      <FormField :label="t('转账流水号 / 凭证编号（选填）')">
        <template #default="{ id }">
          <TextInput :id="id" v-model="reference" maxlength="160" :disabled="busy" />
        </template>
      </FormField>
      <FormField :label="t('付款说明与凭证')">
        <EvidenceEditor :evidence="evidence" :disabled="busy" />
      </FormField>
      <Notice v-if="error" tone="danger">{{ error }}</Notice>
    </form>
    <template #footer>
      <Button :disabled="busy" @click="emit('close')">{{ t('取消') }}</Button>
      <Button type="submit" :form="formId" variant="primary" :loading="busy">{{ busy ? t('正在登记…') : t('确认登记') }}</Button>
    </template>
  </Dialog>
</template>

<style scoped>
.or-form { display: grid; gap: 14px; }
</style>
