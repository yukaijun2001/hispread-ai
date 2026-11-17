<script setup lang="ts">
// One settlement input with its calculation basis. An unsettled input can be
// voided; its source reference stays reserved against duplicates.
import { computed, ref } from 'vue';
import Dialog from '../../../components/ui/Dialog.vue';
import Button from '../../../components/ui/Button.vue';
import DetailList from '../../../components/ui/DetailList.vue';
import StatusBadge from '../../../components/ui/StatusBadge.vue';
import NoteDialog from './NoteDialog.vue';
import { apiPost } from '../../../lib/api';
import { formatDiscount, t } from '../../../lib/i18n';
import { unitLabel } from '../../../lib/labels';
import { formatMoney, percentToRatio } from '../../../lib/money';
import { useSessionStore } from '../../../stores/session';
import { INPUT_SOURCE_LABELS } from './ledger';
import type { SettlementInput } from './inputs';

const props = defineProps<{ input: SettlementInput }>();
const emit = defineEmits<{ close: [] }>();

const session = useSessionStore();
const voiding = ref(false);

const details = computed<Array<[string, string | null | undefined]>>(() => {
  const input = props.input;
  const quote = input.quoteSnapshot;
  const direct = quote?.pricingType === 'DIRECT';
  const method = direct ? t('直接录入真实结算金额')
    : quote?.pricingType === 'DISCOUNT'
      ? t('{0} × {1}', [input.originalAmount, formatDiscount(String(quote.multiplier ?? percentToRatio(String(quote.ratePercent))))])
      : `${input.quantity} ${unitLabel(quote?.unit) || t('个数')} × ${quote?.unitPrice}`;
  return [
    [t('供应商'), input.supplierName],
    [t('项目'), input.projectName],
    [t('来源类型'), INPUT_SOURCE_LABELS()[input.sourceKind || 'EXTERNAL']],
    [t('来源账单期间'), `${input.periodStart} — ${input.periodEnd}`],
    [t('原始金额（完整精度）'), `${input.currency} ${input.originalAmount}`],
    [t('CC lane 查询消耗'), input.sourceSnapshot?.exactConsumption ? `USD ${input.sourceSnapshot.exactConsumption}` : null],
    [t('CC lane 查询时间'), input.sourceSnapshot?.queriedAt],
    [t('款项说明'), input.baseReference],
    [t('对应报价'), direct ? t('无需报价') : quote?.code],
    [t('计算方式'), method],
    [t('报价有效期'), direct ? t('无需报价') : `${quote?.effectiveFrom} — ${quote?.effectiveTo}`],
    [t('作废原因'), input.voidNote],
  ];
});

async function voidInput(note: string) {
  await apiPost(`/settlement-inputs/${props.input.id}/void`, { note });
  voiding.value = false;
  emit('close');
  session.refresh();
  session.notify(t('已作废，来源单号仍保留用于防重'));
}
</script>

<template>
  <Dialog drawer :title="t('账务金额与计算依据')" :subtitle="input.sourceRef" @close="emit('close')">
    <div class="body">
      <section class="hero">
        <div>
          <span class="eyebrow">{{ t('应付金额') }}</span>
          <p class="figure"><small>{{ input.currency }}</small>{{ formatMoney(input.finalAmount, input.currency) }}</p>
        </div>
        <StatusBadge :state="input.state" />
      </section>
      <DetailList :items="details" />
    </div>
    <template v-if="input.state === 'AVAILABLE' && session.has('usage.import')" #footer>
      <Button variant="danger" @click="voiding = true">{{ t('作废本条原始金额') }}</Button>
    </template>
  </Dialog>
  <NoteDialog v-if="voiding" :title="t('作废未结算的原始金额')" :label="t('作废原因')" :submit-label="t('确认作废')" danger :submit="voidInput" @close="voiding = false" />
</template>

<style scoped>
.body { display: grid; gap: 18px; }
.hero { display: flex; align-items: flex-start; justify-content: space-between; gap: 16px; padding: 18px 20px; background: var(--hs-surface-subtle); border: 1px solid var(--hs-border); border-radius: 14px; }
.eyebrow { color: var(--hs-text-3); font-size: var(--hs-text-xs); }
.figure { display: flex; align-items: baseline; gap: 6px; margin: 4px 0 0; color: var(--hs-text); font-size: 28px; font-weight: 600; letter-spacing: -.6px; font-variant-numeric: tabular-nums; }
.figure small { color: var(--hs-text-3); font-size: var(--hs-text-sm); font-weight: 500; letter-spacing: 0; }
</style>
