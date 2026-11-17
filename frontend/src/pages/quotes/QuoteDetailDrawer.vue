<script setup lang="ts">
import { computed, ref } from 'vue';
import Dialog from '../../components/ui/Dialog.vue';
import Button from '../../components/ui/Button.vue';
import Notice from '../../components/ui/Notice.vue';
import StatusBadge from '../../components/ui/StatusBadge.vue';
import DetailList from '../../components/ui/DetailList.vue';
import DataTable from '../../components/ui/DataTable.vue';
import Spinner from '../../components/ui/Spinner.vue';
import ReviewBox from '../../components/ReviewBox.vue';
import QuotePriceHistory from './QuotePriceHistory.vue';
import { apiPost } from '../../lib/api';
import { getLocale, t, times100 } from '../../lib/i18n';
import { DELIVERY_TYPE_LABELS, SETTLEMENT_MODE_LABELS, unitLabel } from '../../lib/labels';
import { beijingDate, formatDateTime, formatMoney } from '../../lib/money';
import { useSessionStore } from '../../stores/session';
import { capacitySummary, quoteMultiplier, type Quote, type RenewalEntry } from './quotes';

const props = defineProps<{ quote: Quote; loading: boolean; error: string }>();
const emit = defineEmits<{ close: []; retry: []; changed: []; edit: [quote: Quote]; adjust: [quote: Quote]; copy: [quote: Quote]; reject: [quote: Quote] }>();

const session = useSessionStore();
const user = computed(() => session.user!);
const supplierSide = computed(() => !!user.value.supplierId);
const today = beijingDate();
const busy = computed(() => props.loading || !!props.error);
const ready = computed(() => !props.loading && !props.error);
const withdrawing = ref(false);

const details = computed<Array<[string, string]>>(() => {
  const quote = props.quote;
  const settlement = SETTLEMENT_MODE_LABELS();
  const delivery = DELIVERY_TYPE_LABELS();
  return [
    ...(supplierSide.value ? [] : [[t('供应商'), quote.supplierName] as [string, string]]),
    [t('报价项目'), quote.projectName],
    [t('结算方式'), settlement[quote.settlementMethod || 'LEGACY']],
    [t('交付方式'), delivery[quote.deliveryMethod || 'LEGACY']],
    [t('计价币种'), quote.currency],
    [t('生效日期'), quote.effectiveFrom],
    [t('结束日期'), quote.effectiveTo],
    [t('含税口径'), quote.taxInclusive ? t('含税') : t('未税（不自动计税）')],
    [t('申报能力'), capacitySummary(quote)],
    [t('能力补充说明'), quote.serviceCapacityNote?.trim() || t('未填写')],
  ];
});

// Four-eyes: the submitter or creator of a quote cannot review it.
const canReview = computed(() => ready.value && session.has('quote.review') && props.quote.state === 'PENDING'
  && props.quote.submittedBy !== user.value.id && props.quote.createdBy !== user.value.id);
const ownPending = computed(() => props.quote.state === 'PENDING' && props.quote.submittedBy === user.value.id);

async function review(approved: boolean, note: string) {
  await apiPost(`/quotes/${props.quote.id}/review`, { approved, note });
  session.notify(t('报价审核已处理'));
  emit('changed');
}

async function withdraw() {
  withdrawing.value = true;
  try {
    await apiPost(`/quotes/${props.quote.id}/withdraw`, {});
    session.notify(t('报价已撤回'));
    emit('changed');
  } catch (error) {
    session.notify((error as Error).message, true);
  } finally {
    withdrawing.value = false;
  }
}

const renewalColumns = [
  { key: 'kind', label: t('方式') },
  { key: 'previous', label: t('原有效期') },
  { key: 'current', label: t('调整后有效期') },
  { key: 'actorName', label: t('操作人') },
  { key: 'occurredAt', label: t('时间') },
];
const discountUnit = getLocale() === 'zh-CN' ? '折' : '%';
</script>

<template>
  <Dialog drawer size="lg" :title="quote.title || quote.projectName" :subtitle="quote.code" @close="emit('close')">
    <div class="body">
      <section class="hero">
        <div>
          <span class="eyebrow">{{ t('供应商报价') }}</span>
          <p class="figure">
            <template v-if="quote.pricingType === 'DISCOUNT'">{{ times100(quoteMultiplier(quote)) }}<small>{{ discountUnit }}</small></template>
            <template v-else>{{ quote.currency }} {{ formatMoney(quote.unitPrice, quote.currency) }}<small> / {{ unitLabel(quote.unit) }}</small></template>
          </p>
          <p class="formula">{{ quote.pricingType === 'DISCOUNT' ? t('现行系统原始金额 × 折扣百分比') : t('本期结算数量 × 已确认单价') }}</p>
        </div>
        <StatusBadge :state="quote.state" />
      </section>

      <DetailList :items="details" />
      <Notice v-if="quote.reviewNote" :title="t('审核意见')">{{ quote.reviewNote }}</Notice>

      <div v-if="loading" class="loading"><Spinner :size="16" /></div>
      <Notice v-if="error" tone="danger">
        {{ t('报价详情加载失败：') }}{{ error }}
        <template #actions><Button size="sm" @click="emit('retry')">{{ t('重试') }}</Button></template>
      </Notice>
      <Notice v-if="quote.effectiveTo < today">{{ t('历史报价不能修改，可复制后提交今天或未来的新报价。') }}</Notice>

      <section v-if="ready && quote.renewalHistory?.length" class="sub">
        <h3>{{ t('有效期调整记录') }}</h3>
        <div class="table">
          <DataTable :columns="renewalColumns" :rows="quote.renewalHistory" :row-key="(entry: RenewalEntry) => `${entry.occurredAt}-${entry.effectiveTo}`" :label="t('有效期调整记录')">
            <template #cell-kind="{ row }">{{ row.kind === 'AUTO' ? t('自动续期') : t('人工调整') }}</template>
            <template #cell-previous="{ row }">{{ t('{0} 至 {1}', [row.previousFrom, row.previousTo]) }}</template>
            <template #cell-current="{ row }">{{ t('{0} 至 {1}', [row.effectiveFrom, row.effectiveTo]) }}</template>
            <template #cell-occurredAt="{ row }">{{ formatDateTime(row.occurredAt) }}</template>
          </DataTable>
        </div>
      </section>

      <QuotePriceHistory v-if="ready && quote.state === 'APPROVED' && quote.priceHistory?.length" :quote="quote" :history="quote.priceHistory" />

      <ReviewBox v-if="canReview" :approve-confirmation="t('是否确认审核通过该报价？')" :on-review="review" />
    </div>

    <template #footer>
      <Button v-if="!supplierSide && session.has('quote.review') && quote.state === 'APPROVED'" variant="danger" :disabled="busy" @click="emit('reject', quote)">{{ t('拒绝') }}</Button>
      <span class="spacer" />
      <Button v-if="session.has('quote.write') && ownPending && quote.effectiveTo >= today" :disabled="busy" @click="emit('edit', quote)">{{ t('编辑此行') }}</Button>
      <Button v-if="session.has('quote.write') && quote.state === 'APPROVED' && quote.effectiveTo >= today" :disabled="busy" @click="emit('adjust', quote)">{{ t('调整报价') }}</Button>
      <Button v-if="session.has('quote.write')" icon="copy" :disabled="busy" @click="emit('copy', quote)">{{ t('复制为新行') }}</Button>
      <Button v-if="session.has('quote.write') && ownPending" :disabled="busy" :loading="withdrawing" @click="withdraw">{{ t('撤回') }}</Button>
    </template>
  </Dialog>
</template>

<style scoped>
.body { display: grid; gap: 18px; }
.hero { display: flex; align-items: flex-start; justify-content: space-between; gap: 16px; padding: 18px 20px; background: var(--hs-surface-subtle); border: 1px solid var(--hs-border); border-radius: 14px; }
.eyebrow { color: var(--hs-text-3); font-size: var(--hs-text-xs); }
.figure { margin: 4px 0 0; color: var(--hs-text); font-size: 30px; font-weight: 600; letter-spacing: -.6px; font-variant-numeric: tabular-nums; }
.figure small { margin-left: 4px; color: var(--hs-text-3); font-size: var(--hs-text-sm); font-weight: 400; letter-spacing: 0; }
.formula { margin: 2px 0 0; color: var(--hs-text-3); font-size: var(--hs-text-xs); }
.loading { display: grid; place-items: center; padding: 12px; color: var(--hs-text-3); }
.sub { display: grid; gap: 8px; }
.sub h3 { margin: 0; font-size: var(--hs-text-sm); font-weight: 600; }
.table { border: 1px solid var(--hs-border); border-radius: 12px; overflow: hidden; }
.spacer { flex: 1; }
</style>
