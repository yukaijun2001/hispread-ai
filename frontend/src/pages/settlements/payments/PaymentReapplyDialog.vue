<script setup lang="ts">
// "重新申请付款" after a failed, cancelled or rejected payment: reload the
// settlement and open the payment form only if it still has an amount to pay.
import { computed, ref, watch } from 'vue';
import Dialog from '../../../components/ui/Dialog.vue';
import Button from '../../../components/ui/Button.vue';
import Notice from '../../../components/ui/Notice.vue';
import Spinner from '../../../components/ui/Spinner.vue';
import PaymentForm from './PaymentForm.vue';
import { useApiData } from '../../../composables/useApiData';
import { t } from '../../../lib/i18n';
import { compareDecimal, subtractMoney } from '../../../lib/money';
import type { Settlement } from '../settlements';
import type { Payment } from './payments';

const props = defineProps<{ payment: Payment }>();
const emit = defineEmits<{ close: []; payment: [payment: Payment] }>();

const settlement = useApiData<Settlement>(() => `/settlements/${encodeURIComponent(props.payment.settlementId)}`);
const payable = computed(() => {
  const s = settlement.data.value;
  return !settlement.loading.value && !settlement.error.value && !!s && s.state === 'CONFIRMED' && !!s.supplierConfirmed
    && s.workflowVersion === 2 && compareDecimal(subtractMoney(s.total, s.reservedAmount, s.currency), '0') > 0;
});
// Once the form is open, a background refresh must not swap it out under the user.
const formFor = ref<Settlement | null>(null);
watch(payable, (value) => { if (value && !formFor.value) formFor.value = settlement.data.value; }, { immediate: true });
</script>

<template>
  <PaymentForm v-if="formFor" :settlement="formFor" @payment="emit('payment', $event)" @close="emit('close')" />
  <Dialog v-else :title="t('重新申请付款')" @close="emit('close')">
    <div v-if="settlement.loading.value" class="ra-loading"><Spinner :size="16" /></div>
    <Notice v-else-if="settlement.error.value" tone="danger">
      {{ settlement.error.value }}
      <template #actions><Button size="sm" icon="refresh" @click="settlement.reload()">{{ t('重试') }}</Button></template>
    </Notice>
    <Notice v-else>{{ t('该结算单尚未确认或已无可申请付款金额，请刷新后核对。') }}</Notice>
  </Dialog>
</template>

<style scoped>
.ra-loading { display: grid; place-items: center; padding: 28px; color: var(--hs-text-3); }
</style>
