<script setup lang="ts">
// Statements tab: summary cards in a chosen currency, the filtered settlement
// list with page-level selection and CSV export. Opening a row is handled by
// the page, which owns the detail drawer.
import { computed, onBeforeUnmount, reactive, ref, watch } from 'vue';
import Button from '../../../components/ui/Button.vue';
import IconButton from '../../../components/ui/IconButton.vue';
import Icon from '../../../components/ui/Icon.vue';
import Avatar from '../../../components/ui/Avatar.vue';
import SearchInput from '../../../components/ui/SearchInput.vue';
import Select from '../../../components/ui/Select.vue';
import DateRangePicker from '../../../components/ui/DateRangePicker.vue';
import StatusBadge from '../../../components/ui/StatusBadge.vue';
import Notice from '../../../components/ui/Notice.vue';
import EmptyState from '../../../components/ui/EmptyState.vue';
import Pagination from '../../../components/ui/Pagination.vue';
import type { IconName } from '../../../components/ui/icons';
import MoneyDisplay from './MoneyDisplay.vue';
import SupplierFilter from './SupplierFilter.vue';
import { useApiData } from '../../../composables/useApiData';
import { exportSettlementCsv, exportSettlementsCsv } from '../../../lib/api';
import { t } from '../../../lib/i18n';
import { beijingDate, compareDecimal, formatDateTime, formatMoney, settlementState, subtractMoney } from '../../../lib/money';
import { useSessionStore } from '../../../stores/session';
import { beijingDateTime, STATEMENT_CURRENCIES, type SettlementRow } from '../settlements';

const emit = defineEmits<{ open: [id: string] }>();

const session = useSessionStore();
const supplierSide = computed(() => !!session.user?.supplierId);
const canExport = computed(() => session.has('settlement.export'));

// --- Filters ---------------------------------------------------------------
function lastSevenDays() {
  const today = beijingDate();
  const [y, m, d] = today.split('-').map(Number);
  return { from: new Date(Date.UTC(y, m - 1, d - 6)).toISOString().slice(0, 10), to: today };
}
const statsCurrency = ref('USD');
const currency = ref('');
const supplierId = ref('');
const state = ref('');
const progress = ref('');
const period = reactive(lastSevenDays());
const searchText = ref('');
const search = ref('');
const page = ref(1);
const size = ref(10);
watch([currency, supplierId, state, progress, () => period.from, () => period.to], () => { page.value = 1; });

let searchTimer: number | undefined;
watch([searchText, search], () => {
  window.clearTimeout(searchTimer);
  if (searchText.value.trim() === search.value) return;
  searchTimer = window.setTimeout(() => { search.value = searchText.value.trim(); page.value = 1; }, 300);
});
onBeforeUnmount(() => window.clearTimeout(searchTimer));
const searchPending = computed(() => searchText.value.trim() !== search.value);

const query = computed(() => new URLSearchParams({
  search: search.value, supplierId: supplierId.value, currency: currency.value, state: state.value,
  paymentProgress: progress.value, periodStart: period.from, periodEnd: period.to,
}).toString());

// --- Data ------------------------------------------------------------------
interface Summary { unsettledPayable: string; total: string; paid: string; received: string }
interface PendingSummary { pendingTotal: string; pendingCount: number }
const pendingCurrency = computed(() => currency.value || statsCurrency.value);
const summary = useApiData<Summary>(() => `/settlements/summary?currency=${statsCurrency.value}`);
const pendingSummary = useApiData<PendingSummary>(() => {
  const params = new URLSearchParams(query.value);
  params.set('currency', pendingCurrency.value);
  return `/settlements/pending-summary?${params}`;
});
const list = useApiData<{ items: SettlementRow[]; total: number }>(() => `/settlements?${query.value}&page=${page.value}&size=${size.value}`);
const rows = computed(() => list.data.value?.items ?? []);

const totals = computed(() => (summary.error.value ? null : summary.data.value));
const pending = computed(() => (pendingSummary.loading.value || pendingSummary.error.value ? null : pendingSummary.data.value));

interface StatCard { label: string; value: string | null | undefined; icon: IconName; tone: string; currency: string; foot?: 'history' | 'pending' }
const cards = computed<StatCard[]>(() => {
  const s = totals.value;
  const settled = s ? (supplierSide.value ? s.received : s.paid) : undefined;
  return [
    { label: t('历史未结算金额'), value: s?.unsettledPayable, icon: 'wallet', tone: 'blue', currency: statsCurrency.value, foot: 'history' },
    { label: t(supplierSide.value ? '待确认金额' : '待供应商确认'), value: pending.value?.pendingTotal, icon: 'clock', tone: 'amber', currency: pendingCurrency.value, foot: 'pending' },
    { label: t(supplierSide.value ? '已确认应收' : '已确认应付'), value: s?.total, icon: 'wallet', tone: 'blue', currency: statsCurrency.value },
    { label: t(supplierSide.value ? '已确认收款' : '已完成付款'), value: settled, icon: 'bank', tone: 'teal', currency: statsCurrency.value },
    { label: t(supplierSide.value ? '待确认收款' : '待付金额'), value: s ? subtractMoney(s.total, settled, statsCurrency.value) : undefined, icon: 'clock', tone: 'amber', currency: statsCurrency.value },
  ];
});

function showPending() {
  currency.value = pendingCurrency.value;
  state.value = 'PENDING';
  page.value = 1;
}

// --- Selection (scoped to the current filters) --------------------------------
const selection = ref<{ scope: string; ids: string[] }>({ scope: '', ids: [] });
watch(query, (scope) => { selection.value = { scope, ids: [] }; }, { immediate: true });
const selected = computed(() => (selection.value.scope === query.value ? selection.value.ids : []));
const pageIds = computed(() => rows.value.map((row) => row.id));
const allOnPage = computed(() => !!pageIds.value.length && pageIds.value.every((id) => selected.value.includes(id)));
const someOnPage = computed(() => pageIds.value.some((id) => selected.value.includes(id)) && !allOnPage.value);
function toggle(ids: string[], checked: boolean) {
  const next = new Set(selected.value);
  ids.forEach((id) => (checked ? next.add(id) : next.delete(id)));
  selection.value = { scope: query.value, ids: [...next] };
}
const clearSelection = () => { selection.value = { scope: query.value, ids: [] }; };

// --- Export ------------------------------------------------------------------
const exporting = ref(false);
async function exportList(all: boolean) {
  if (exporting.value) return;
  exporting.value = true;
  try {
    await exportSettlementsCsv(query.value, all ? [] : selected.value);
    session.notify(t('结算单已导出'));
  } catch (error) {
    session.notify(error instanceof Error ? error.message : t('导出失败，请重试'), true);
  } finally {
    exporting.value = false;
  }
}
const rowExports = ref(new Set<string>());
async function exportRow(id: string) {
  if (rowExports.value.has(id)) return;
  rowExports.value = new Set(rowExports.value).add(id);
  try {
    await exportSettlementCsv(id);
  } catch (error) {
    session.notify(error instanceof Error ? error.message : t('导出失败，请重试'), true);
  } finally {
    const next = new Set(rowExports.value);
    next.delete(id);
    rowExports.value = next;
  }
}
const listUnavailable = computed(() => list.loading.value || !!list.error.value);

// --- Options and cell helpers --------------------------------------------------
const statsOptions = STATEMENT_CURRENCIES.map((value) => ({ value, label: value }));
const currencyOptions = [{ value: '', label: t('全部币种') }, ...statsOptions];
const stateOptions = computed(() => [
  { value: '', label: t('全部状态') },
  { value: 'PENDING', label: t(supplierSide.value ? '待确认' : '待供应商确认') },
  { value: 'CONFIRMED', label: t('已确认') },
  { value: 'REJECTED', label: t('有金额异议') },
  { value: 'WITHDRAWN', label: t('已撤回') },
  { value: 'VOID', label: t('已作废') },
]);
const progressOptions = computed(() => [
  { value: '', label: t(supplierSide.value ? '全部收款进度' : '全部付款进度') },
  { value: 'UNPAID', label: t(supplierSide.value ? '待收款' : '待付款') },
  { value: 'PARTIAL', label: t(supplierSide.value ? '部分已收款' : '部分付款') },
  { value: 'PAID', label: t(supplierSide.value ? '全额已收款' : '已付清') },
]);

const stateLabelFor = (row: SettlementRow) => (row.confirmationMode === 'AUTO_DEADLINE' ? t('逾期自动确认') : row.state === 'PENDING' ? t('待供应商确认') : undefined);
const fullyReceived = (row: SettlementRow) => compareDecimal(row.receivedAmount, row.total) >= 0 && row.state === 'CONFIRMED';
const progressState = (row: SettlementRow) => (supplierSide.value ? (fullyReceived(row) ? 'CONFIRMED' : 'PENDING') : settlementState(row));
function progressLabel(row: SettlementRow) {
  if (row.state === 'PENDING') return t('待确认金额');
  if (!supplierSide.value) return undefined;
  return fullyReceived(row) ? t('全额已收款') : compareDecimal(row.receivedAmount, '0') > 0 ? t('部分已收款') : t('待收款');
}
function createdParts(value: string) {
  const [date, ...time] = beijingDateTime(value).split(' ');
  return { date: date.replace(/,$/, ''), time: time.join(' ') };
}
const columnCount = computed(() => (canExport.value ? 1 : 0) + (supplierSide.value ? 8 : 9));
const headerCheck = ref<HTMLInputElement | null>(null);
watch([headerCheck, someOnPage], ([element, some]) => { if (element) element.indeterminate = some; }, { flush: 'post' });
</script>

<template>
  <div class="st-statements">
    <div class="st-stats-head">
      <span>{{ t(supplierSide ? '应收汇总' : '应付汇总') }}</span>
      <div class="st-stats-currency">
        <Select v-model="statsCurrency" :options="statsOptions" :label="t('统计币种')" size="sm" pill />
      </div>
    </div>
    <div class="st-stats">
      <div v-for="card in cards" :key="card.label" class="st-stat" :class="card.tone">
        <div class="st-stat-top">
          <span>{{ card.label }}</span>
          <span class="st-stat-icon"><Icon :name="card.icon" :size="17" /></span>
        </div>
        <div class="st-stat-number"><MoneyDisplay :currency="card.currency" :value="card.value" /></div>
        <div v-if="card.foot === 'history'" class="st-stat-foot">{{ t('全部历史已入账、尚未生成结算单的金额') }}</div>
        <div v-else-if="card.foot === 'pending'" class="st-stat-foot">
          <button type="button" class="st-link" :aria-label="t('查看待确认结算单')" :disabled="pendingSummary.loading.value || !!pendingSummary.error.value" @click="showPending">
            {{ pending ? t('{0} 笔待确认 · 查看', [pending.pendingCount]) : '—' }}
          </button>
        </div>
      </div>
    </div>
    <Notice v-if="summary.error.value" tone="danger" class="st-gap">{{ summary.error.value }}</Notice>
    <Notice v-if="pendingSummary.error.value" tone="danger" class="st-gap">{{ pendingSummary.error.value }}</Notice>

    <section class="st-card">
      <div class="st-toolbar">
        <SearchInput v-model="searchText" class="st-grow" :placeholder="t(supplierSide ? '搜索结算单号' : '搜索供应商或结算单号')" :label="t('关键词')" />
        <SupplierFilter v-if="!supplierSide && session.has('supplier.read')" v-model="supplierId" class="st-select" />
        <div class="st-narrow"><Select v-model="currency" :options="currencyOptions" :label="t('结算币种筛选')" :placeholder="t('全部币种')" /></div>
        <div class="st-narrow"><Select v-model="state" :options="stateOptions" :label="t('结算状态')" :placeholder="t('全部状态')" /></div>
        <div class="st-narrow"><Select v-model="progress" :options="progressOptions" :label="t(supplierSide ? '收款进度' : '付款进度')" /></div>
        <div class="st-actions">
          <template v-if="canExport">
            <Button size="sm" icon="download" :title="t('导出当前筛选下的全部结算单，包含所有分页')"
              :disabled="exporting || listUnavailable || !list.data.value?.total || searchPending" @click="exportList(true)">
              {{ exporting ? t('正在导出…') : t('导出筛选结果') }}
            </Button>
            <Button size="sm" icon="download" :disabled="exporting || listUnavailable || !selected.length || searchPending" @click="exportList(false)">
              {{ t('批量导出已选（{0}）', [selected.length]) }}
            </Button>
            <Button v-if="selected.length" size="sm" variant="ghost" @click="clearSelection">{{ t('清空选择') }}</Button>
          </template>
          <IconButton icon="refresh" :label="t('刷新结算单')" @click="session.refresh()" />
        </div>
      </div>
      <div class="st-period">
        <span class="st-period-label">{{ t('结算周期') }}</span>
        <DateRangePicker :from="period.from" :to="period.to" :label="t('结算周期')" size="sm" @change="(from, to) => { period.from = from; period.to = to; }" />
        <Button v-if="period.from || period.to" size="sm" variant="ghost" @click="period.from = ''; period.to = ''">{{ t('清除筛选') }}</Button>
        <small>{{ t('显示与所选周期有交集的结算单（含起止当天）。') }}</small>
      </div>

      <div class="st-table-wrap" role="region" :aria-label="t('结算单')" tabindex="-1" :class="{ refreshing: list.refreshing.value }">
        <table class="st-table">
          <thead>
            <tr>
              <th v-if="canExport" class="st-check">
                <input
                  ref="headerCheck"
                  type="checkbox"
                  :aria-label="t('选择本页结算单')"
                  :disabled="listUnavailable || !rows.length"
                  :checked="allOnPage"
                  @change="toggle(pageIds, ($event.target as HTMLInputElement).checked)"
                />
              </th>
              <th>{{ t(supplierSide ? '结算单' : '供应商 / 结算单') }}</th>
              <th v-if="!supplierSide">{{ t('项目') }}</th>
              <th>{{ t('结算期间') }}</th>
              <th>{{ t('创建时间') }}</th>
              <th class="right">{{ t('原始金额') }}</th>
              <th class="right">{{ t(supplierSide ? '最终应收' : '最终应付') }}</th>
              <th>{{ t('结算状态') }}</th>
              <th>{{ t(supplierSide ? '收款进度' : '付款进度') }}</th>
              <th>{{ t('操作') }}</th>
            </tr>
          </thead>
          <tbody v-if="list.loading.value && !rows.length">
            <tr v-for="n in 5" :key="n" class="st-skeleton" aria-hidden="true"><td v-for="c in columnCount" :key="c"><span /></td></tr>
          </tbody>
          <tbody v-else>
            <tr v-for="(row, index) in rows" :key="row.id" class="st-row" tabindex="0" @click="emit('open', row.id)" @keydown.enter.self="emit('open', row.id)">
              <td v-if="canExport" class="st-check" @click.stop>
                <input type="checkbox" :aria-label="t('选择结算单 {0}', [row.code])" :checked="selected.includes(row.id)"
                  @change="toggle([row.id], ($event.target as HTMLInputElement).checked)" />
              </td>
              <td>
                <div class="st-identity">
                  <Avatar v-if="!supplierSide" :name="row.supplierName" :tone="index" />
                  <div class="st-cell">
                    <strong>{{ supplierSide ? row.code : row.supplierName }}</strong>
                    <small>{{ supplierSide ? row.projectName : row.code }}</small>
                  </div>
                </div>
              </td>
              <td v-if="!supplierSide">{{ row.projectName || t('历史多项目结算') }}</td>
              <td>
                <div class="st-cell st-mono">
                  <span>{{ row.periodStart }}</span>
                  <small>{{ t('至') }} {{ row.periodEnd }}</small>
                </div>
              </td>
              <td>
                <time class="st-cell st-mono" :datetime="row.createdAt">
                  <span>{{ createdParts(row.createdAt).date }}</span>
                  <small>{{ createdParts(row.createdAt).time }}</small>
                </time>
              </td>
              <td class="right">
                <span v-if="row.originalTotal == null" class="st-muted">{{ t('历史未记录') }}</span>
                <span v-else class="st-amount"><small>{{ row.currency }}</small>{{ formatMoney(row.originalTotal, row.currency) }}</span>
              </td>
              <td class="right"><strong class="st-amount"><small>{{ row.currency }}</small>{{ formatMoney(row.total, row.currency) }}</strong></td>
              <td>
                <div class="st-cell">
                  <StatusBadge :state="row.state" :label="stateLabelFor(row)" />
                  <small v-if="row.state === 'PENDING' && row.confirmationDeadline">{{ t('截止') }} {{ formatDateTime(row.confirmationDeadline) }}</small>
                </div>
              </td>
              <td><StatusBadge :state="progressState(row)" :label="progressLabel(row)" /></td>
              <td @click.stop>
                <div class="st-row-actions">
                  <button type="button" class="st-link" @click="emit('open', row.id)">{{ row.state === 'PENDING' ? t('核对') : t('查看') }}</button>
                  <button v-if="canExport" type="button" class="st-link quiet" :disabled="rowExports.has(row.id)" :aria-label="t('导出结算单 {0}', [row.code])" @click="exportRow(row.id)">
                    {{ rowExports.has(row.id) ? t('导出中…') : t('导出') }}
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
        <EmptyState v-if="list.error.value && !rows.length" error :text="list.error.value" compact>
          <Button size="sm" icon="refresh" @click="list.reload()">{{ t('重试') }}</Button>
        </EmptyState>
        <EmptyState v-else-if="!list.loading.value && !rows.length" compact />
      </div>
      <Notice v-if="list.error.value && rows.length" tone="danger" class="st-inline">{{ list.error.value }}</Notice>
      <Pagination v-model:page="page" v-model:size="size" :total="list.data.value?.total ?? 0" :loading="list.loading.value" />
    </section>
  </div>
</template>

<style scoped>
.st-statements { display: grid; gap: 14px; }
.st-stats-head { display: flex; align-items: center; justify-content: space-between; gap: 12px; color: var(--hs-text-2); font-size: var(--hs-text-sm); font-weight: 500; }
.st-stats-currency { width: 104px; }
.st-stats { display: grid; grid-template-columns: repeat(5, minmax(0, 1fr)); gap: 12px; }
.st-stat { display: grid; align-content: start; gap: 8px; min-width: 0; padding: 14px 16px; background: var(--hs-surface); border: 1px solid var(--hs-border); border-radius: var(--hs-radius-card); box-shadow: var(--hs-shadow-card); }
.st-stat-top { display: flex; align-items: center; justify-content: space-between; gap: 8px; color: var(--hs-text-3); font-size: var(--hs-text-xs); }
.st-stat-icon { display: grid; place-items: center; width: 28px; height: 28px; border-radius: 8px; color: var(--hs-text-3); background: var(--hs-surface-subtle); }
.st-stat.blue .st-stat-icon { color: var(--hs-accent); background: var(--hs-accent-soft); }
.st-stat.amber .st-stat-icon { color: var(--hs-warning); background: var(--hs-warning-soft, #fcf4e4); }
.st-stat.teal .st-stat-icon { color: var(--hs-teal); background: #ebf6f3; }
.st-stat-number { color: var(--hs-text); font-size: 22px; font-weight: 600; letter-spacing: -.4px; line-height: 1.3; overflow-wrap: anywhere; }
.st-stat-foot { color: var(--hs-text-3); font-size: 11px; line-height: 1.5; }
.st-gap { margin: 0; }

.st-card { background: var(--hs-surface); border: 1px solid var(--hs-border); border-radius: var(--hs-radius-card); box-shadow: var(--hs-shadow-card); overflow: hidden; }
.st-toolbar { display: flex; flex-wrap: wrap; align-items: center; gap: 8px; padding: 14px 16px 8px; }
.st-grow { flex: 1 1 220px; }
.st-select { flex: 0 1 200px; min-width: 160px; }
.st-narrow { flex: 0 1 150px; min-width: 128px; }
.st-actions { display: flex; flex-wrap: wrap; align-items: center; gap: 6px; margin-left: auto; }
.st-period { display: flex; flex-wrap: wrap; align-items: center; gap: 8px 10px; padding: 0 16px 14px; }
.st-period-label { color: var(--hs-text-2); font-size: var(--hs-text-xs); font-weight: 500; }
.st-period small { color: var(--hs-text-3); font-size: var(--hs-text-xs); }
.st-inline { margin: 12px 16px; }

.st-table-wrap { width: 100%; overflow-x: auto; scrollbar-width: thin; transition: opacity .15s; }
.st-table-wrap.refreshing { opacity: .6; }
.st-table { width: 100%; min-width: 1040px; border-collapse: collapse; font-size: var(--hs-text-sm); }
.st-table th, .st-table td { height: 50px; padding: 8px 12px; text-align: left; vertical-align: middle; }
.st-table th:first-child, .st-table td:first-child { padding-left: 20px; }
.st-table th:last-child, .st-table td:last-child { padding-right: 20px; }
.st-table thead { background: var(--hs-surface-subtle); }
.st-table th { height: 38px; color: var(--hs-text-3); border-top: 1px solid var(--hs-divider); border-bottom: 1px solid var(--hs-divider); font-size: var(--hs-text-xs); font-weight: 500; white-space: nowrap; }
.st-table td { color: var(--hs-text-2); border-bottom: 1px solid var(--hs-divider); }
.st-table .right { text-align: right; }
.st-check { width: 44px; }
.st-check input { width: 15px; height: 15px; margin: 0; padding: 0; accent-color: var(--hs-primary); box-shadow: none; cursor: pointer; }
.st-row { cursor: pointer; transition: background .12s; }
.st-row:hover { background: var(--hs-surface-subtle); }
.st-row:focus-visible { outline: 2px solid var(--hs-accent); outline-offset: -2px; }
.st-identity { display: flex; align-items: center; gap: 10px; min-width: 0; }
.st-cell { display: grid; gap: 2px; min-width: 0; }
.st-cell strong { color: var(--hs-text); font-weight: 500; overflow-wrap: anywhere; }
.st-cell small { color: var(--hs-text-3); font-size: var(--hs-text-xs); }
.st-cell.st-mono { font-family: var(--hs-font-mono); font-size: var(--hs-text-xs); white-space: nowrap; }
.st-cell.st-mono span { color: var(--hs-text); }
.st-amount { font-variant-numeric: tabular-nums; white-space: nowrap; }
.st-amount small { margin-right: 4px; color: var(--hs-text-3); font-size: 11px; font-weight: 400; }
strong.st-amount { color: var(--hs-text); font-weight: 600; }
.st-muted { color: var(--hs-text-3); font-size: var(--hs-text-xs); }
.st-row-actions { display: flex; gap: 10px; white-space: nowrap; }
.st-link { min-height: 0; padding: 0; color: var(--hs-accent); background: none; border: 0; font: inherit; font-size: var(--hs-text-xs); cursor: pointer; }
.st-link.quiet { color: var(--hs-text-3); }
.st-link:hover:not(:disabled) { text-decoration: underline; text-underline-offset: 3px; }
.st-link:disabled { opacity: .5; cursor: not-allowed; }
.st-skeleton td span { display: block; height: 10px; border-radius: 5px; background: var(--hs-surface-subtle); }

@media (max-width: 1280px) { .st-stats { grid-template-columns: repeat(3, minmax(0, 1fr)); } }
@media (max-width: 760px) { .st-stats { grid-template-columns: repeat(2, minmax(0, 1fr)); } }
</style>
