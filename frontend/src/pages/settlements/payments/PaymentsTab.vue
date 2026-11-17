<script setup lang="ts">
// Payment records (platform) / receipt records (supplier). `settlementId`
// narrows the list to one settlement; `?id=` opens a payment when the list is
// not narrowed. Failed, cancelled or rejected payments can be re-applied.
import { computed, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import Button from '../../../components/ui/Button.vue';
import IconButton from '../../../components/ui/IconButton.vue';
import DataTable from '../../../components/ui/DataTable.vue';
import Pagination from '../../../components/ui/Pagination.vue';
import StatusBadge from '../../../components/ui/StatusBadge.vue';
import PaymentDetailDrawer from './PaymentDetailDrawer.vue';
import PaymentReapplyDialog from './PaymentReapplyDialog.vue';
import { useApiData } from '../../../composables/useApiData';
import { apiFetch } from '../../../lib/api';
import { t } from '../../../lib/i18n';
import { formatDateTime, formatMoney } from '../../../lib/money';
import { useSessionStore } from '../../../stores/session';
import type { Payment } from './payments';

const props = withDefaults(defineProps<{ settlementId?: string }>(), { settlementId: '' });

const session = useSessionStore();
const route = useRoute();
const router = useRouter();
const supplierSide = computed(() => !!session.user?.supplierId);

const page = ref(1);
const size = ref(10);
watch(() => props.settlementId, () => { page.value = 1; });
const list = useApiData<{ items: Payment[]; total: number }>(() => `/payments?page=${page.value}&size=${size.value}&settlementId=${encodeURIComponent(props.settlementId)}`);
const rows = computed(() => list.data.value?.items ?? []);

const canReapply = (payment: Payment) => !supplierSide.value && session.has('settlement.read')
  && ((session.has('payment.create') && session.has('account.read')) || (session.has('payment.record') && session.has('file.write')))
  && ['FAILED', 'CANCELLED', 'REJECTED'].includes(payment.state);

// --- Detail ------------------------------------------------------------------
const selected = ref<Payment | null>(null);
const reapplying = ref<Payment | null>(null);

/** Show the row at once, then swap in the full record. */
function open(row: Payment) {
  selected.value = row;
  apiFetch<Payment>(`/payments/${encodeURIComponent(row.id)}`)
    .then((payment) => { if (selected.value?.id === row.id) selected.value = payment; })
    .catch((error: Error) => session.notify(error.message, true));
}

const linkedId = computed(() => (!props.settlementId && route.query.tab === 'payments' ? String(route.query.id ?? '') : ''));
watch(linkedId, (id, _previous, onCleanup) => {
  if (!id) return;
  let current = true;
  onCleanup(() => { current = false; });
  apiFetch<Payment>(`/payments/${encodeURIComponent(id)}`)
    .then((payment) => { if (current) selected.value = payment; })
    .catch((error: Error) => { if (current) session.notify(error.message, true); });
}, { immediate: true });

function reapplied(payment: Payment) {
  reapplying.value = null;
  selected.value = payment;
}

// --- Table ----------------------------------------------------------------------
const columns = computed(() => [
  { key: 'identity', label: t(supplierSide.value ? '对应账单 / 记录' : '供应商 / 付款单') },
  { key: 'obligation', label: t(supplierSide.value ? '本次应收抵扣' : '本次应付抵扣'), align: 'right' as const },
  { key: 'payout', label: t(supplierSide.value ? '预计收款' : '付款金额'), align: 'right' as const },
  { key: 'paidAt', label: t('付款时间'), nowrap: true },
  { key: 'state', label: t('平台付款状态') },
  { key: 'receipt', label: t('供应商收款状态') },
  { key: 'actions', label: t('操作'), nowrap: true },
]);
const receiptLabel = (row: Payment) => (row.receiptState === 'CONFIRMED' ? t('已确认到账') : row.receiptState === 'DISPUTED' ? t('有异议') : t('待确认到账'));
const awaitingReceipt = (row: Payment) => supplierSide.value && row.state === 'SUCCEEDED' && row.receiptState !== 'CONFIRMED';
</script>

<template>
  <section class="pt-card">
    <div class="pt-head">
      <h2>{{ t(supplierSide ? '我的收款记录' : '付款记录') }}</h2>
      <IconButton icon="refresh" :label="t('刷新款项记录')" @click="session.refresh()" />
    </div>
    <div v-if="settlementId" class="pt-filter">
      <span>{{ t('仅显示所选结算单的款项') }}</span>
      <Button size="sm" variant="ghost" @click="router.push({ path: '/settlements', query: { tab: 'payments' } })">{{ t('查看全部') }}</Button>
    </div>

    <DataTable
      :columns="columns"
      :rows="rows"
      :row-key="(row) => row.id"
      :loading="list.loading.value"
      :refreshing="list.refreshing.value"
      :error="list.error.value"
      :label="t(supplierSide ? '我的收款记录' : '付款记录')"
      @row-click="open"
      @retry="list.reload()"
    >
      <template #cell-identity="{ row }">
        <div class="pt-cell">
          <strong>{{ supplierSide ? row.settlementCode : row.supplierName }}</strong>
          <small>{{ row.code }}</small>
        </div>
      </template>
      <template #cell-obligation="{ row }">
        <strong class="pt-amount"><small>{{ row.obligationCurrency }}</small>{{ formatMoney(row.obligationAmount, row.obligationCurrency) }}</strong>
      </template>
      <template #cell-payout="{ row }">
        <div class="pt-cell end">
          <strong class="pt-amount"><small>{{ row.payoutCurrency }}</small>{{ formatMoney(row.payoutAmount, row.payoutCurrency) }}</strong>
          <small>{{ row.obligationCurrency === row.payoutCurrency ? t('同币种') : `1 ${row.obligationCurrency} = ${row.fxRate} ${row.payoutCurrency}` }}</small>
        </div>
      </template>
      <template #cell-paidAt="{ row }">
        <time v-if="row.state === 'SUCCEEDED' && row.verificationMode !== 'SIMULATED'" class="pt-mono" :title="row.statusUpdatedAt ?? undefined">{{ formatDateTime(row.statusUpdatedAt) }}</time>
        <template v-else>—</template>
      </template>
      <template #cell-state="{ row }">
        <div class="pt-cell">
          <StatusBadge :state="row.state" />
          <small v-if="row.paymentMethod === 'OFFLINE'">{{ t('线下付款 · 凭证登记') }}</small>
          <small v-if="row.verificationMode === 'SIMULATED'">{{ t('模拟 · 未真实出款') }}</small>
        </div>
      </template>
      <template #cell-receipt="{ row }">
        <StatusBadge :state="row.receiptState || 'PENDING'" :label="receiptLabel(row)" />
      </template>
      <template #cell-actions="{ row }">
        <div class="pt-actions" @click.stop>
          <button type="button" class="pt-link" @click="open(row)">{{ awaitingReceipt(row) ? t('核对收款') : t('查看') }}</button>
          <button v-if="canReapply(row)" type="button" class="pt-link" @click="reapplying = row">{{ t('重新申请付款') }}</button>
        </div>
      </template>
    </DataTable>
    <Pagination v-model:page="page" v-model:size="size" :total="list.data.value?.total ?? 0" :loading="list.loading.value" />
  </section>

  <PaymentReapplyDialog v-if="reapplying" :payment="reapplying" @payment="reapplied" @close="reapplying = null" />
  <PaymentDetailDrawer
    v-if="selected"
    :key="selected.id"
    :payment="selected"
    :can-reapply="canReapply(selected)"
    @updated="selected = $event"
    @reapply="reapplying = $event"
    @close="selected = null"
  />
</template>

<style scoped>
.pt-card { background: var(--hs-surface); border: 1px solid var(--hs-border); border-radius: var(--hs-radius-card); box-shadow: var(--hs-shadow-card); overflow: hidden; }
.pt-head { display: flex; align-items: center; justify-content: space-between; gap: 12px; padding: 14px 16px 12px 20px; }
.pt-head h2 { margin: 0; color: var(--hs-text); font-size: var(--hs-text-sm); font-weight: 600; }
.pt-filter { display: flex; flex-wrap: wrap; align-items: center; gap: 8px; padding: 0 16px 12px 20px; color: var(--hs-text-3); font-size: var(--hs-text-xs); }
.pt-cell { display: grid; gap: 2px; min-width: 0; }
.pt-cell.end { justify-items: end; }
.pt-cell strong { color: var(--hs-text); font-weight: 500; overflow-wrap: anywhere; }
.pt-cell small { color: var(--hs-text-3); font-size: var(--hs-text-xs); }
.pt-amount { color: var(--hs-text); font-weight: 600; font-variant-numeric: tabular-nums; white-space: nowrap; }
.pt-amount small { margin-right: 4px; color: var(--hs-text-3); font-size: 11px; font-weight: 400; }
.pt-cell strong.pt-amount { font-weight: 600; }
.pt-mono { font-family: var(--hs-font-mono); font-size: var(--hs-text-xs); white-space: nowrap; }
.pt-actions { display: flex; gap: 10px; white-space: nowrap; }
.pt-link { min-height: 0; padding: 0; color: var(--hs-accent); background: none; border: 0; font: inherit; font-size: var(--hs-text-xs); cursor: pointer; }
.pt-link:hover { text-decoration: underline; text-underline-offset: 3px; }
</style>
