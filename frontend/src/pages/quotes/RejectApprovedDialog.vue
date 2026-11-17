<script setup lang="ts">
// Reject a quote that was already approved. The state is re-read first so a
// quote that changed meanwhile cannot be rejected by mistake.
import { computed, ref } from 'vue';
import Dialog from '../../components/ui/Dialog.vue';
import Button from '../../components/ui/Button.vue';
import Notice from '../../components/ui/Notice.vue';
import DetailList from '../../components/ui/DetailList.vue';
import FormField from '../../components/ui/FormField.vue';
import TextInput from '../../components/ui/TextInput.vue';
import Spinner from '../../components/ui/Spinner.vue';
import { useApiData } from '../../composables/useApiData';
import { apiPost } from '../../lib/api';
import { t } from '../../lib/i18n';
import type { Quote } from './quotes';

const props = defineProps<{ quote: Quote }>();
const emit = defineEmits<{ close: []; rejected: [] }>();

const latest = useApiData<Quote>(`/quotes/${encodeURIComponent(props.quote.id)}`);
const shown = computed(() => latest.data.value || props.quote);
const rejectable = computed(() => !latest.loading.value && !latest.error.value && latest.data.value?.state === 'APPROVED');
const note = ref('');
const submitting = ref(false);
const error = ref('');

function close() { if (!submitting.value) emit('close'); }

async function reject() {
  if (submitting.value || !rejectable.value) return;
  const reason = note.value.trim();
  if (!reason) { error.value = t('请填写拒绝原因'); return; }
  submitting.value = true;
  error.value = '';
  try {
    const result = await apiPost<{ state: string }>(`/quotes/${encodeURIComponent(props.quote.id)}/reject-approved`, { note: reason });
    if (result.state !== 'REJECTED') throw new Error(t('报价状态未更新，请刷新后核对'));
    emit('rejected');
  } catch (reason) {
    error.value = (reason as Error).message;
  } finally {
    submitting.value = false;
  }
}
</script>

<template>
  <Dialog :title="t('拒绝已通过报价')" @close="close">
    <div class="body">
      <DetailList :items="[
        [t('报价编号'), shown.code],
        [t('供应商'), shown.supplierName],
        [t('报价项目'), shown.projectName],
        [t('适用期间'), t('{0} 至 {1}', [shown.effectiveFrom, shown.effectiveTo])],
      ]" />
      <Notice tone="warning">{{ t('拒绝后，该报价不再用于新的交付和计价，未完成的调价申请一并关闭。已冻结的交付、账务和结算记录保留。') }}</Notice>
      <div v-if="latest.loading.value" class="loading"><Spinner :size="16" /></div>
      <Notice v-if="latest.error.value" tone="danger">{{ t('报价加载失败：') }}{{ latest.error.value }}</Notice>
      <Notice v-if="!latest.loading.value && !latest.error.value && latest.data.value?.state !== 'APPROVED'" tone="danger">{{ t('报价已不处于已通过状态，请刷新列表。') }}</Notice>
      <FormField :label="t('拒绝原因（必填）')">
        <template #default="{ id }">
          <TextInput :id="id" v-model="note" multiline :rows="3" maxlength="500" required :disabled="submitting" :aria-label="t('拒绝原因')" :placeholder="t('填写拒绝原因，最多500字')" />
        </template>
      </FormField>
      <Notice v-if="error" tone="danger">{{ error }}</Notice>
    </div>
    <template #footer>
      <Button :disabled="submitting" @click="close">{{ t('取消') }}</Button>
      <Button variant="danger" :loading="submitting" :disabled="!rejectable || !note.trim()" @click="reject">{{ submitting ? t('正在拒绝…') : t('确认拒绝') }}</Button>
    </template>
  </Dialog>
</template>

<style scoped>
.body { display: grid; gap: 14px; }
.loading { display: grid; place-items: center; padding: 8px; color: var(--hs-text-3); }
</style>
