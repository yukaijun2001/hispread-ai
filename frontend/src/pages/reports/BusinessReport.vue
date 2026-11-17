<script setup lang="ts">
// Report center for finance users: overview, monthly payables and supplier
// receivables over a month range, with a settlement drill-down per row.
// Supplier accounts only see their own receivables.
import { computed, onBeforeUnmount, ref } from 'vue';
import PageHeader from '../../components/ui/PageHeader.vue';
import Button from '../../components/ui/Button.vue';
import Icon from '../../components/ui/Icon.vue';
import Select from '../../components/ui/Select.vue';
import Tabs from '../../components/ui/Tabs.vue';
import EmptyState from '../../components/ui/EmptyState.vue';
import Spinner from '../../components/ui/Spinner.vue';
import Dialog from '../../components/ui/Dialog.vue';
import DataTable from '../../components/ui/DataTable.vue';
import StatusBadge from '../../components/ui/StatusBadge.vue';
import type { Column } from '../../components/ui/types';
import ReportMonthPicker from './ReportMonthPicker.vue';
import ReportOverview from './ReportOverview.vue';
import ReportMonthlyTable from './ReportMonthlyTable.vue';
import ReportReceivablesTable from './ReportReceivablesTable.vue';
import ReportMoney from './ReportMoney.vue';
import { useApiData } from '../../composables/useApiData';
import { useSupplierDirectory } from '../../composables/useSupplierDirectory';
import { apiFetch, download } from '../../lib/api';
import { t } from '../../lib/i18n';
import { CURRENCIES } from '../../lib/labels';
import type { Project } from '../../lib/projects';
import { useSessionStore } from '../../stores/session';
import {
  defaultFromMonth, defaultToMonth, monthEnd,
  type DrillFilter, type DrillScope, type MonthlyRow, type OverviewData, type ReceivableRow, type ReportSettlement, type ReportTab,
} from './reports';

const session = useSessionStore();
const supplierSide = computed(() => !!session.user?.supplierId);

// --- Filters ---------------------------------------------------------------
const defaults = { from: defaultFromMonth(), to: defaultToMonth() };
const tab = ref<ReportTab>(supplierSide.value ? 'receivables' : 'overview');
const fromMonth = ref(defaults.from);
const toMonth = ref(defaults.to);
const currency = ref('');
const supplierId = ref('');
const projectId = ref('');
const dirty = computed(() => fromMonth.value !== defaults.from || toMonth.value !== defaults.to || !!currency.value || !!supplierId.value || !!projectId.value);

function resetFilters() {
  fromMonth.value = defaults.from; toMonth.value = defaults.to;
  currency.value = ''; supplierId.value = ''; projectId.value = '';
}

const query = computed(() => new URLSearchParams({
  from: `${fromMonth.value}-01`,
  to: monthEnd(toMonth.value),
  currency: currency.value,
  supplierId: supplierSide.value ? '' : supplierId.value,
  projectId: projectId.value,
}).toString());

// --- Data ------------------------------------------------------------------
const ENDPOINTS: Record<ReportTab, string> = {
  overview: '/reports/overview',
  monthly: '/reports/monthly-payables',
  receivables: '/reports/supplier-receivables',
};
const report = useApiData<Record<string, unknown>>(() => `${ENDPOINTS[tab.value]}?${query.value}`);
const overview = computed(() => (tab.value === 'overview' ? report.data.value as unknown as OverviewData | null : null));
const monthlyRows = computed(() => (tab.value === 'monthly' ? (report.data.value?.items as MonthlyRow[] | undefined) ?? [] : []));
const receivableRows = computed(() => (tab.value === 'receivables' ? (report.data.value?.items as ReceivableRow[] | undefined) ?? [] : []));

const projectData = useApiData<{ items: Project[] }>(() => (session.has('project.read') ? '/projects?enabled=true&page=1&size=100' : null));
const projects = computed(() => (projectData.error.value ? [] : projectData.data.value?.items ?? []));
const directory = useSupplierDirectory(() => !supplierSide.value && session.has('supplier.read'), 'APPROVED');

// --- Filter options --------------------------------------------------------
const tabItems = computed<Array<{ id: ReportTab; label: string }>>(() => (supplierSide.value
  ? [{ id: 'receivables', label: t('供应商应收') }]
  : [{ id: 'overview', label: t('经营概览') }, { id: 'monthly', label: t('每月应付') }, { id: 'receivables', label: t('供应商应收') }]));
const currencyOptions = [{ value: '', label: t('全部币种') }, ...CURRENCIES.map((code) => ({ value: code, label: code }))];
const supplierLabel = t('报表供应商');
const supplierOptions = computed(() => {
  const items = (directory.items.value ?? []).map((s) => ({ value: s.id, label: s.name, detail: s.code }));
  const first = {
    value: '',
    label: directory.loading.value ? t('{0}加载中…', [supplierLabel]) : directory.error.value ? t('{0}加载失败', [supplierLabel]) : t('全部供应商'),
  };
  const missing = supplierId.value && !items.some((option) => option.value === supplierId.value)
    ? [{ value: supplierId.value, label: t('已选{0}', [supplierLabel]) }] : [];
  return [first, ...items, ...missing];
});
const projectOptions = computed(() => [
  { value: '', label: t('全部项目') },
  ...projects.value.map((p) => ({ value: p.id, label: p.name, detail: p.categoryName || p.category || undefined })),
]);

// --- Export ----------------------------------------------------------------
const exporting = ref(false);
async function exportCsv() {
  const monthly = tab.value === 'monthly';
  exporting.value = true;
  session.notify(t('报表导出已开始'));
  try {
    await download(`/reports/export?report=${monthly ? 'MONTHLY_PAYABLES' : 'SUPPLIER_RECEIVABLES'}&${query.value}`, t(monthly ? '每月应付.csv' : '供应商应收.csv'));
  } catch (error) {
    session.notify((error as Error).message, true);
  } finally {
    exporting.value = false;
  }
}

// --- Settlement drill-down ---------------------------------------------------
// A sequence number keeps a slow response from filling a dialog opened later.
const drill = ref<{ title: string; rows: ReportSettlement[] | null } | null>(null);
let drillSequence = 0;

async function openDrill(title: string, scope: DrillScope, filter: DrillFilter) {
  const sequence = ++drillSequence;
  drill.value = { title, rows: null };
  const params = new URLSearchParams({
    from: filter.from || `${fromMonth.value}-01`,
    to: filter.to || monthEnd(toMonth.value),
    currency: filter.currency ?? currency.value,
    supplierId: filter.supplierId ?? (supplierSide.value ? '' : supplierId.value),
    projectId: projectId.value,
    scope,
  });
  try {
    const result = await apiFetch<{ items: ReportSettlement[] }>(`/reports/settlements?${params}`);
    if (sequence === drillSequence) drill.value = { title, rows: result.items };
  } catch (error) {
    if (sequence !== drillSequence) return;
    session.notify((error as Error).message, true);
    drill.value = null;
  }
}
function closeDrill() { drillSequence++; drill.value = null; }
onBeforeUnmount(() => { drillSequence++; });

const openSupplier = (row: ReceivableRow) => openDrill(t('{0} · 应收明细', [row.supplierName]), 'CONFIRMED', { supplierId: row.supplierId, currency: row.currency });
const openMonth = (row: MonthlyRow) => openDrill(t('{0} · {1} 应付明细', [row.month, row.currency]), 'LIVE', {
  from: `${row.month}-01`, to: monthEnd(row.month), currency: row.currency,
});

const drillColumns: Column[] = [
  { key: 'code', label: t('结算单'), nowrap: true },
  { key: 'supplierName', label: t('供应商') },
  { key: 'projectName', label: t('项目') },
  { key: 'period', label: t('期间'), nowrap: true },
  { key: 'total', label: t('应付'), align: 'right' },
  { key: 'paidAmount', label: t('已付款'), align: 'right' },
  { key: 'outstandingAmount', label: t('待付款'), align: 'right' },
  { key: 'state', label: t('状态') },
];
const drillMoney = ['total', 'paidAmount', 'outstandingAmount'] as const;
</script>

<template>
  <div class="rp-page">
    <PageHeader :title="t('报表中心')">
      <template v-if="tab !== 'overview' && session.has('report.export')" #actions>
        <Button icon="download" :loading="exporting" @click="exportCsv">{{ t('导出 CSV') }}</Button>
      </template>
    </PageHeader>

    <Tabs v-model="tab" :items="tabItems" :label="t('报表中心')" />

    <section class="rp-card rp-filters" :aria-label="t('报表筛选')">
      <div class="rp-filter-head">
        <div class="rp-filter-title">
          <Icon name="filter" :size="16" />
          <strong>{{ t('筛选条件') }}</strong>
          <span>{{ t('按结算周期归属统计') }}</span>
        </div>
        <Button variant="ghost" size="sm" icon="refresh" :disabled="!dirty" @click="resetFilters">{{ t('重置') }}</Button>
      </div>
      <div class="rp-filter-grid" :class="{ 'supplier-side': supplierSide }">
        <div class="rp-filter-field rp-period">
          <span class="rp-filter-label">{{ t('统计月份') }}</span>
          <div class="rp-period-control">
            <ReportMonthPicker v-model="fromMonth" :label="t('开始月份')" :max="toMonth" />
            <span class="rp-period-separator">{{ t('至') }}</span>
            <ReportMonthPicker v-model="toMonth" :label="t('结束月份')" :min="fromMonth" />
          </div>
        </div>
        <div class="rp-filter-field">
          <span class="rp-filter-label">{{ t('币种') }}</span>
          <Select v-model="currency" :options="currencyOptions" :label="t('报表币种')" :placeholder="t('全部币种')" />
        </div>
        <div v-if="!supplierSide" class="rp-filter-field">
          <span class="rp-filter-label">{{ t('供应商') }}</span>
          <Select
            v-model="supplierId"
            :options="supplierOptions"
            :label="supplierLabel"
            :placeholder="supplierOptions[0].label"
            icon="users"
            searchable
            :search-placeholder="t('搜索供应商名称或编码')"
            :disabled="directory.loading.value && !supplierId"
          />
        </div>
        <div class="rp-filter-field">
          <span class="rp-filter-label">{{ t('项目') }}</span>
          <Select v-model="projectId" :options="projectOptions" :label="t('报表项目')" :placeholder="t('全部项目')" :disabled="!projects.length" />
        </div>
      </div>
    </section>

    <EmptyState v-if="report.error.value" error :text="report.error.value">
      <Button size="sm" icon="refresh" @click="report.reload()">{{ t('重试') }}</Button>
    </EmptyState>
    <div v-else-if="report.loading.value || !report.data.value" class="rp-state"><Spinner :size="16" /></div>
    <div v-else :class="{ 'rp-refreshing': report.refreshing.value }">
      <ReportOverview v-if="tab === 'overview' && overview" :data="overview" @supplier="openSupplier" />
      <section v-else-if="tab === 'monthly'" class="rp-card">
        <ReportMonthlyTable :rows="monthlyRows" :on-row="openMonth" />
      </section>
      <section v-else class="rp-card">
        <ReportReceivablesTable :rows="receivableRows" :on-row="openSupplier" />
      </section>
    </div>

    <Dialog v-if="drill" :title="drill.title" :subtitle="t('最多展示 200 张结算单')" size="xl" @close="closeDrill">
      <div v-if="drill.rows === null" class="rp-state"><Spinner :size="16" /></div>
      <DataTable
        v-else
        :columns="drillColumns"
        :rows="drill.rows"
        :row-key="(row) => row.id ?? row.code"
        :label="drill.title"
      >
        <template #cell-period="{ row }">{{ t('{0} 至 {1}', [row.periodStart, row.periodEnd]) }}</template>
        <template v-for="key in drillMoney" :key="key" #[`cell-${key}`]="{ row }">
          <ReportMoney :value="row[key]" :currency="row.currency" />
        </template>
        <template #cell-state="{ row }"><StatusBadge :state="row.state" /></template>
      </DataTable>
    </Dialog>
  </div>
</template>

<style scoped>
.rp-page { display: grid; gap: 16px; }
.rp-card { background: var(--hs-surface); border: 1px solid var(--hs-border); border-radius: var(--hs-radius-card); box-shadow: var(--hs-shadow-card); overflow: hidden; }
.rp-filters { overflow: visible; padding: 14px 20px 18px; }
.rp-filter-head { display: flex; align-items: center; justify-content: space-between; gap: 12px; margin-bottom: 12px; }
.rp-filter-title { display: flex; flex-wrap: wrap; align-items: center; gap: 6px 8px; min-width: 0; }
.rp-filter-title .hs-icon { color: var(--hs-text-3); }
.rp-filter-title strong { color: var(--hs-text); font-size: var(--hs-text-sm); font-weight: 600; }
.rp-filter-title span { color: var(--hs-text-3); font-size: var(--hs-text-xs); }
.rp-filter-grid { display: grid; grid-template-columns: minmax(300px, 1.4fr) repeat(3, minmax(160px, 1fr)); gap: 12px 16px; align-items: end; }
.rp-filter-grid.supplier-side { grid-template-columns: minmax(300px, 1.4fr) repeat(2, minmax(160px, 1fr)); }
.rp-filter-field { display: grid; gap: 6px; min-width: 0; }
.rp-filter-label { color: var(--hs-text-3); font-size: var(--hs-text-xs); }
.rp-period-control { display: flex; align-items: center; gap: 8px; }
.rp-period-separator { color: var(--hs-text-3); font-size: var(--hs-text-sm); }
.rp-state { display: grid; place-items: center; padding: 48px; color: var(--hs-text-3); }
.rp-refreshing { opacity: .65; transition: opacity .15s; }
@media (max-width: 1080px) {
  .rp-filter-grid, .rp-filter-grid.supplier-side { grid-template-columns: repeat(2, minmax(0, 1fr)); }
  .rp-period { grid-column: 1 / -1; }
}
@media (max-width: 640px) {
  .rp-filter-grid, .rp-filter-grid.supplier-side { grid-template-columns: minmax(0, 1fr); }
}
</style>
