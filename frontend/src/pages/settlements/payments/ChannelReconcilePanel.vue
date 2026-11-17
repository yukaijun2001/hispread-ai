<script setup lang="ts">
// Admin panel for payments made through the retired online channel. No new
// payouts can start there; unresolved ones keep their reservation until the
// original result is queried, so nothing is paid twice.
import { computed, ref } from 'vue';
import Button from '../../../components/ui/Button.vue';
import Notice from '../../../components/ui/Notice.vue';
import { apiPost } from '../../../lib/api';
import { t } from '../../../lib/i18n';
import { useSessionStore } from '../../../stores/session';
import type { Payment } from './payments';

const props = defineProps<{ payment: Payment }>();
const emit = defineEmits<{ updated: [payment: Payment] }>();

const session = useSessionStore();
const busy = ref(false);
const error = ref('');
const needsQuery = computed(() => ['PROCESSING', 'UNKNOWN'].includes(props.payment.state)
  || (!!props.payment.lateReturnMonitoringRequired && props.payment.state === 'SUCCEEDED'));

async function queryOriginal() {
  if (busy.value) return;
  busy.value = true;
  error.value = '';
  try {
    emit('updated', await apiPost<Payment>(`/payments/${encodeURIComponent(props.payment.id)}/reconcile`, { version: props.payment.version }));
    session.notify(t('已查询原通道结果'));
  } catch (reason) {
    error.value = reason instanceof Error ? reason.message : t('操作失败');
  } finally {
    busy.value = false;
  }
}
</script>

<template>
  <section class="cr-panel">
    <Notice>{{ t('线上付款通道已关闭，不能发起新出款。历史未决款项继续保留金额占用，请查询原结果，避免重复付款。') }}</Notice>
    <Notice v-if="payment.lateReturn" tone="danger">{{ t('原通道付款已退回，请财务核对后重新申请线下付款。') }}</Notice>
    <Notice v-if="error" tone="danger">{{ error }}</Notice>
    <div v-if="session.has('payout.reconcile') && needsQuery">
      <Button size="sm" icon="refresh" :loading="busy" @click="queryOriginal">{{ busy ? t('正在查询…') : t('查询原通道结果') }}</Button>
    </div>
  </section>
</template>

<style scoped>
.cr-panel { display: grid; gap: 10px; }
</style>
