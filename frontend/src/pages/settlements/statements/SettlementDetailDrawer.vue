<script setup lang="ts">
// Settlement drawer. Suppliers confirm or dispute the amount; the platform can
// adjust it before the deadline, withdraw or void it, and request payment once
// it is confirmed. Every write carries the settlement `version`.
import { computed, onBeforeUnmount, ref, watch } from 'vue';
import Dialog from '../../../components/ui/Dialog.vue';
import Button from '../../../components/ui/Button.vue';
import Notice from '../../../components/ui/Notice.vue';
import StatusBadge from '../../../components/ui/StatusBadge.vue';
import DetailList from '../../../components/ui/DetailList.vue';
import DataTable from '../../../components/ui/DataTable.vue';
import Pagination from '../../../components/ui/Pagination.vue';
import EmptyState from '../../../components/ui/EmptyState.vue';
import Spinner from '../../../components/ui/Spinner.vue';
import ReviewBox from '../../../components/ReviewBox.vue';
import DailyLinesTable from './DailyLinesTable.vue';
import ResourceGroupsTable from './ResourceGroupsTable.vue';
import ReasonDialog from './ReasonDialog.vue';
import AdjustmentDialog from './AdjustmentDialog.vue';
import PaymentForm from '../payments/PaymentForm.vue';
import { useApiData } from '../../../composables/useApiData';
import { apiPost, exportSettlementCsv } from '../../../lib/api';
import { divide100, formatDiscount, t } from '../../../lib/i18n';
import { CURRENCIES, unitLabel } from '../../../lib/labels';
import { compareDecimal, formatDateTime, formatMoney, subtractMoney } from '../../../lib/money';
import { useSessionStore } from '../../../stores/session';
import { beijingDateTime, type Adjustment, type LegacyLine, type Settlement } from '../settlements';
import type { Payment } from '../payments/payments';

const props = defineProps<{ id: string }>();
const emit = defineEmits<{ close: []; payment: [payment: Payment] }>();

const session = useSessionStore();
const supplierSide = computed(() => !!session.user?.supplierId);
const page = ref(1);
const size = ref(50);
const detail = useApiData<Settlement>(() => `/settlements/${props.id}?page=${page.value}&size=${size.value}`);
const s = computed(() => detail.data.value);

// Re-render exactly when the confirmation deadline passes.
const tick = ref(0);
let deadlineTimer: number | undefined;
watch([() => s.value?.confirmationDeadline, () => s.value?.state, tick], () => {
  window.clearTimeout(deadlineTimer);
  const deadline = s.value?.confirmationDeadline;
  if (!deadline || s.value?.state !== 'PENDING') return;
  const remaining = Date.parse(deadline) - Date.now();
  if (!Number.isFinite(remaining) || remaining <= 0) return;
  deadlineTimer = window.setTimeout(() => { tick.value++; }, Math.min(remaining + 1, 2_147_483_647));
}, { immediate: true });
onBeforeUnmount(() => window.clearTimeout(deadlineTimer));
const deadlinePassed = computed(() => {
  void tick.value;
  return !!s.value?.confirmationDeadline && Date.parse(s.value.confirmationDeadline) <= Date.now();
});

const payable = (currency: string) => (CURRENCIES as readonly string[]).includes(currency);
const editablePending = computed(() => !!s.value && !supplierSide.value && session.has('settlement.create') && s.value.state === 'PENDING' && s.value.workflowVersion === 2);
const canAdjust = computed(() => editablePending.value && !deadlinePassed.value);
const adjustments = computed(() => (s.value?.adjustments ?? []).filter((entry) => !supplierSide.value || entry.supplierVisible));
const outstanding = computed(() => !!s.value && compareDecimal(s.value.total, s.value.reservedAmount) > 0);
const canPay = computed(() => !!s.value && s.value.state === 'CONFIRMED' && !!s.value.supplierConfirmed && !supplierSide.value
  && (session.has('payment.create') || session.has('payment.record')) && payable(s.value.currency) && outstanding.value);
const historicalCurrency = computed(() => !!s.value && s.value.state === 'CONFIRMED' && !!s.value.supplierConfirmed && !supplierSide.value
  && session.has('payment.create') && !payable(s.value.currency) && outstanding.value);
const canVoid = computed(() => !!s.value?.canVoid && !supplierSide.value && session.has('settlement.create'));
const canConfirm = computed(() => !!s.value && s.value.state === 'PENDING' && supplierSide.value && s.value.workflowVersion === 2 && session.has('settlement.confirm'));

const dialog = ref<'void' | 'withdraw' | 'adjust' | 'pay' | null>(null);

const stateLabel = computed(() => (s.value?.confirmationMode === 'AUTO_DEADLINE' ? t('逾期自动确认') : s.value?.state === 'PENDING' ? t('待供应商确认') : undefined));
const details = computed<Array<[string, string]>>(() => {
  const d = s.value!;
  const money = (value: string | null | undefined) => `${d.currency} ${formatMoney(value, d.currency)}`;
  return [
    [t('项目'), d.projectName || t('历史多项目结算')],
    [t('结算期间'), `${d.periodStart} — ${d.periodEnd}`],
    [t('创建时间'), beijingDateTime(d.createdAt)],
    [t('确认截止时间'), d.confirmationDeadline ? formatDateTime(d.confirmationDeadline) : t('历史单据未设置')],
    [t('原始金额'), d.originalTotal == null ? t('历史单据未记录') : `${d.currency} ${d.originalTotal}`],
    ...(supplierSide.value ? [] : [
      [t('调整前应付'), money(d.calculatedTotal ?? subtractMoney(d.total, d.adjustmentTotal ?? '0', d.currency))] as [string, string],
      [t('人工调整合计'), money(d.adjustmentTotal ?? '0')] as [string, string],
      [t('最终应付'), money(d.total)] as [string, string],
    ]),
    [t('金额确认'), d.confirmationMode === 'AUTO_DEADLINE' ? t('逾期未提出异议，系统已自动确认') : d.supplierConfirmed ? t('供应商已手动确认') : t('尚未获供应商确认')],
    [t('计价口径'), d.basisMode === 'DAILY_SUMMARY' ? t('以本单冻结的日账静态汇总金额确认')
      : t(supplierSide.value ? '按原始金额和对应报价计算；以本单最终应收金额确认' : '按原始金额和对应报价计算，叠加人工调整；确认后金额冻结')],
  ];
});

// --- Legacy (per-record) lines ----------------------------------------------------
const lineColumns = [
  { key: 'record', label: t('项目 / 记录') },
  { key: 'basis', label: t('计算依据') },
  { key: 'amount', label: t('金额'), align: 'right' as const },
];
function lineBasis(line: LegacyLine, currency: string) {
  const quote = line.quoteSnapshot;
  if (quote.pricingType === 'DIRECT') return t('直接录入真实结算金额');
  if (quote.pricingType === 'FIXED') return `${line.quantity} ${unitLabel(quote.unit) || t('个数')} × ${quote.unitPrice}`;
  return t('{0} × {1}', [formatMoney(line.baseAmount, currency), formatDiscount(String(quote.multiplier ?? divide100(String(quote.ratePercent))))]);
}
const rowKeys = new WeakMap<object, number>();
let nextKey = 0;
function rowKey(row: object) {
  if (!rowKeys.has(row)) rowKeys.set(row, ++nextKey);
  return rowKeys.get(row)!;
}
const adjustmentColumns = computed(() => [
  { key: 'businessDate', label: t('结算日期'), nowrap: true },
  { key: 'amount', label: t('加减金额'), align: 'right' as const },
  { key: 'note', label: t('调整说明') },
  ...(supplierSide.value ? [] : [{ key: 'supplierVisible', label: t('供应商可见') }, { key: 'createdByName', label: t('操作人') }]),
  { key: 'createdAt', label: t('记录时间'), nowrap: true },
]);
const signedAmount = (entry: Adjustment, currency: string) => `${currency} ${compareDecimal(entry.amount, '0') > 0 ? '+' : ''}${formatMoney(entry.amount, currency)}`;

// --- Actions ------------------------------------------------------------------
async function exportDetail() {
  try {
    await exportSettlementCsv(props.id);
  } catch (error) {
    session.notify((error as Error).message, true);
  }
}
async function confirmAmount(approved: boolean, note: string) {
  await apiPost(`/settlements/${props.id}/confirm`, { approved, note, version: s.value!.version });
  session.refresh();
  session.notify(t(approved ? '本期金额已确认' : '已退回核对'));
}
async function voidSettlement(note: string) {
  await apiPost(`/settlements/${props.id}/void`, { note, version: s.value!.version });
  session.refresh();
  session.notify(t('结算单已作废，原始金额重新可选'));
}
async function withdraw(note: string) {
  await apiPost(`/settlements/${props.id}/withdraw`, { approved: false, note, version: s.value!.version });
  session.refresh();
  session.notify(t('已撤回，原始金额重新可选'));
}
function adjusted() {
  session.refresh();
  session.notify(t('人工调整已保存，最终应付金额已更新'));
}
</script>

<template>
  <Dialog drawer size="lg" :title="s?.code || t('结算单详情')" :subtitle="s?.supplierName" @close="emit('close')">
    <EmptyState v-if="!s && detail.error.value" error :text="detail.error.value">
      <Button size="sm" icon="refresh" @click="detail.reload()">{{ t('重试') }}</Button>
    </EmptyState>
    <div v-else-if="!s" class="sd-loading"><Spinner :size="16" /></div>
    <div v-else class="sd-body">
      <section class="sd-hero">
        <div>
          <span class="sd-eyebrow">{{ t(supplierSide ? '本期应收' : '本期应付') }}</span>
          <p class="sd-figure"><small>{{ s.currency }}</small>{{ formatMoney(s.total, s.currency) }}</p>
        </div>
        <StatusBadge :state="s.state" :label="stateLabel" />
      </section>

      <Notice v-if="s.state === 'VOID'" :title="t('结算单已作废')">
        <p class="sd-line">{{ s.voidNote }}</p>
        <span class="sd-muted">{{ formatDateTime(s.voidedAt) }}</span>
      </Notice>
      <Notice v-if="s.sourceChanged" tone="danger">{{ t('来源金额或归属已变化，当前结算单暂停确认。请由平台撤回后重新生成。') }}</Notice>

      <div class="sd-balances">
        <div>
          <span>{{ t('平台已完成付款') }}</span>
          <strong>{{ s.currency }} {{ formatMoney(s.paidAmount, s.currency) }}</strong>
        </div>
        <div>
          <span>{{ t('供应商已确认收款') }}</span>
          <strong>{{ s.currency }} {{ formatMoney(s.receivedAmount, s.currency) }}</strong>
        </div>
        <div v-if="!supplierSide">
          <span>{{ t('申请中占用') }}</span>
          <strong>{{ s.currency }} {{ formatMoney(subtractMoney(s.reservedAmount, s.paidAmount, s.currency), s.currency) }}</strong>
        </div>
      </div>

      <DetailList :items="details" />

      <Notice v-if="s.state === 'PENDING' && s.confirmationDeadline" tone="warning">
        <template v-if="deadlinePassed">
          {{ t('已超过建议核对时间，仍需供应商手动确认或提出异议。') }}
          <template v-if="editablePending">{{ t('当前不能再添加人工调整。') }}</template>
        </template>
        <template v-else>{{ t('请于') }} {{ formatDateTime(s.confirmationDeadline) }} {{ t('前核对；到期后仍需手动确认或提出异议。') }}</template>
        <template v-if="deadlinePassed" #actions><Button size="sm" icon="refresh" @click="session.refresh()">{{ t('刷新状态') }}</Button></template>
      </Notice>
      <Notice v-if="historicalCurrency" tone="warning">{{ t('该历史币种仅供查看；新付款申请只支持 USD、CNY 和 USDT。') }}</Notice>

      <section class="sd-section">
        <div class="sd-section-head">
          <h3>{{ t(s.basisMode === 'DAILY_SUMMARY' ? '日账汇总' : '计价明细') }}</h3>
          <Button v-if="session.has('settlement.export')" size="sm" variant="ghost" icon="download" @click="exportDetail">
            {{ t(s.basisMode === 'DAILY_SUMMARY' ? '导出结算单' : '导出明细') }}
          </Button>
        </div>
        <DailyLinesTable v-if="s.dailyLines" :lines="s.dailyLines" :currency="s.currency" />
        <ResourceGroupsTable v-else-if="s.resourceGroups" :groups="s.resourceGroups" :currency="s.currency" />
        <div v-else class="sd-table">
          <DataTable :columns="lineColumns" :rows="s.lines ?? []" :row-key="rowKey" :label="t('计价明细')">
            <template #cell-record="{ row }">
              <div class="sd-cell">
                <strong>{{ row.quoteSnapshot.title || row.quoteSnapshot.projectName || t('未命名项目') }}</strong>
                <small>{{ row.externalId }}</small>
              </div>
            </template>
            <template #cell-basis="{ row }">
              <div class="sd-cell">
                <span>{{ lineBasis(row, s.currency) }}</span>
                <small>{{ row.quoteSnapshot.pricingType === 'DIRECT' ? t('无需报价') : row.quoteSnapshot.code }}</small>
              </div>
            </template>
            <template #cell-amount="{ row }"><strong class="sd-num">{{ formatMoney(row.amount, s.currency) }}</strong></template>
          </DataTable>
        </div>
        <Pagination v-if="s.linePage" v-model:page="page" v-model:size="size" :total="s.linePage.total" :loading="detail.refreshing.value" />
      </section>

      <section v-if="!supplierSide || adjustments.length" class="sd-section">
        <div class="sd-section-head">
          <h3>{{ t('人工调整记录') }}</h3>
          <Button v-if="canAdjust" size="sm" icon="plus" @click="dialog = 'adjust'">{{ t('加减金额') }}</Button>
        </div>
        <div v-if="adjustments.length" class="sd-table">
          <DataTable :columns="adjustmentColumns" :rows="adjustments" :row-key="rowKey" :label="t('结算人工调整记录')">
            <template #cell-amount="{ row }"><strong class="sd-num">{{ signedAmount(row, s.currency) }}</strong></template>
            <template #cell-supplierVisible="{ row }">{{ row.supplierVisible ? t('可见') : t('仅内部可见') }}</template>
            <template #cell-createdByName="{ row }">{{ row.createdByName || '—' }}</template>
            <template #cell-createdAt="{ row }">{{ formatDateTime(row.createdAt) }}</template>
          </DataTable>
        </div>
        <Notice v-else>{{ t('暂无人工调整记录。') }}</Notice>
      </section>

      <Notice v-if="s.note">{{ s.note }}</Notice>

      <ReviewBox
        v-if="canConfirm"
        :title="t('核对本期应收金额')"
        :approve-disabled="!!s.sourceChanged"
        :reject-label="t('提出金额异议')"
        :approve-label="t('确认本期应收')"
        :on-review="confirmAmount"
      />
    </div>

    <template v-if="s && (canVoid || canPay || editablePending)" #footer>
      <Button v-if="canVoid" variant="danger" @click="dialog = 'void'">{{ t('作废结算单') }}</Button>
      <span class="sd-spacer" />
      <Button v-if="editablePending" @click="dialog = 'withdraw'">{{ t('撤回结算单') }}</Button>
      <Button v-if="canPay" variant="primary" icon="wallet" @click="dialog = 'pay'">{{ t('申请付款') }}</Button>
    </template>

    <ReasonDialog
      v-if="s && dialog === 'void'"
      :title="t('作废结算单')"
      :subtitle="t('作废后原始金额重新可选，原结算及确认记录保留。')"
      :label="t('作废原因')"
      :submit-label="t('确认作废')"
      danger
      :on-submit="voidSettlement"
      @close="dialog = null"
    />
    <ReasonDialog
      v-if="s && dialog === 'withdraw'"
      :title="t('撤回结算单')"
      :label="t('撤回原因')"
      :on-submit="withdraw"
      @close="dialog = null"
    />
    <AdjustmentDialog v-if="s && dialog === 'adjust' && editablePending" :settlement="s" @saved="adjusted" @close="dialog = null" />
    <PaymentForm v-if="s && dialog === 'pay'" :settlement="s" @payment="emit('payment', $event)" @close="dialog = null" />
  </Dialog>
</template>

<style scoped>
.sd-loading { display: grid; place-items: center; padding: 40px; color: var(--hs-text-3); }
.sd-body { display: grid; gap: 18px; }
.sd-hero { display: flex; align-items: flex-start; justify-content: space-between; gap: 16px; padding: 18px 20px; background: var(--hs-surface-subtle); border: 1px solid var(--hs-border); border-radius: 14px; }
.sd-eyebrow { color: var(--hs-text-3); font-size: var(--hs-text-xs); }
.sd-figure { margin: 4px 0 0; color: var(--hs-text); font-size: 30px; font-weight: 600; letter-spacing: -.6px; font-variant-numeric: tabular-nums; overflow-wrap: anywhere; }
.sd-figure small { margin-right: 6px; color: var(--hs-text-3); font-size: var(--hs-text-sm); font-weight: 500; letter-spacing: 0; }
.sd-line { margin: 0; white-space: pre-wrap; }
.sd-muted { color: var(--hs-text-3); font-size: var(--hs-text-xs); }
.sd-balances { display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 1px; overflow: hidden; background: var(--hs-divider); border: 1px solid var(--hs-border); border-radius: 12px; }
.sd-balances > div { display: grid; gap: 4px; padding: 12px 14px; background: var(--hs-surface); }
.sd-balances span { color: var(--hs-text-3); font-size: var(--hs-text-xs); }
.sd-balances strong { color: var(--hs-text); font-size: var(--hs-text-sm); font-weight: 600; font-variant-numeric: tabular-nums; }
.sd-section { display: grid; gap: 10px; }
.sd-section-head { display: flex; align-items: center; justify-content: space-between; gap: 12px; }
.sd-section-head h3 { margin: 0; font-size: var(--hs-text-sm); font-weight: 600; }
.sd-table { border: 1px solid var(--hs-border); border-radius: 12px; overflow: hidden; }
.sd-cell { display: grid; gap: 2px; min-width: 0; }
.sd-cell strong { color: var(--hs-text); font-weight: 500; overflow-wrap: anywhere; }
.sd-cell small { color: var(--hs-text-3); font-size: var(--hs-text-xs); overflow-wrap: anywhere; }
.sd-num { color: var(--hs-text); font-weight: 600; font-variant-numeric: tabular-nums; white-space: nowrap; }
.sd-spacer { flex: 1; }
</style>
