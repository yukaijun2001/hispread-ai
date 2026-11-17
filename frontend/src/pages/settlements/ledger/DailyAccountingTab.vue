<script setup lang="ts">
// Platform daily ledger (settlements?tab=daily). Filters are edited as a draft
// and applied with 查询; the summary, the grouped views and the detail list
// all read the applied filter. Summaries still being rebuilt reload every 2.5 s.
import { computed, ref } from 'vue';
import { useRouter } from 'vue-router';
import Button from '../../../components/ui/Button.vue';
import IconButton from '../../../components/ui/IconButton.vue';
import Icon from '../../../components/ui/Icon.vue';
import SearchInput from '../../../components/ui/SearchInput.vue';
import Select from '../../../components/ui/Select.vue';
import DateRangePicker from '../../../components/ui/DateRangePicker.vue';
import Segmented from '../../../components/ui/Segmented.vue';
import Notice from '../../../components/ui/Notice.vue';
import DataTable from '../../../components/ui/DataTable.vue';
import Pagination from '../../../components/ui/Pagination.vue';
import EmptyState from '../../../components/ui/EmptyState.vue';
import Spinner from '../../../components/ui/Spinner.vue';
import MoneyDisplay from './MoneyDisplay.vue';
import DailyGroupTable from './DailyGroupTable.vue';
import DailyExportDialog from './DailyExportDialog.vue';
import DailyExportHistory from './DailyExportHistory.vue';
import { useApiData } from '../../../composables/useApiData';
import { useSupplierDirectory } from '../../../composables/useSupplierDirectory';
import { apiPost } from '../../../lib/api';
import { formatDiscount, t, translateServerMessage } from '../../../lib/i18n';
import { formatMoney } from '../../../lib/money';
import type { Project } from '../../../lib/projects';
import { useSessionStore } from '../../../stores/session';
import { beijingDateTime, DAILY_SOURCE_LABELS, todayRange, useSummaryRefresh, type Page } from './ledger';
import { DISPLAY_STATE_LABELS, type DailyEntry, type DailyGroup, type DailySummary, type SortKey } from './daily';
import type { DailyFilter, ExportScope } from './dailyExports';

type View = 'summary' | 'supplier' | 'detail';

const session = useSessionStore();
const router = useRouter();

// --- Filters: draft vs applied ------------------------------------------------
const blankFilter = (): DailyFilter => ({ ...todayRange(), search: '', supplier: '', project: '', model: '', sourceKind: '', reviewStatus: '' });
const applied = ref<DailyFilter>(blankFilter());
const draft = ref<DailyFilter>(blankFilter());
const view = ref<View>('supplier');
const sortBy = ref<SortKey | ''>('consumptionTotal');
const sortDirection = ref<'ASC' | 'DESC'>('DESC');
const page = ref(1);
const size = ref(10);

const filterKey = (filter: DailyFilter) => JSON.stringify(filter);
const draftChanged = computed(() => filterKey(draft.value) !== filterKey(applied.value));

/** Apply a filter; applying the unchanged filter again refreshes the data. */
function apply(next: DailyFilter = draft.value) {
  const filter = { ...next, search: next.search.trim(), model: next.model.trim() };
  const unchanged = filterKey(filter) === filterKey(applied.value);
  draft.value = filter;
  page.value = 1;
  applied.value = filter;
  if (unchanged) session.refresh();
}
function reset() {
  apply({ ...draft.value, ...todayRange(), search: '', supplier: '', project: '', model: '', sourceKind: '', reviewStatus: '' });
}
const setDraft = (patch: Partial<DailyFilter>) => { draft.value = { ...draft.value, ...patch }; };

function switchView(next: View) { view.value = next; page.value = 1; }
function sort(key: SortKey) {
  if (sortBy.value === key) {
    if (sortDirection.value === 'DESC') sortDirection.value = 'ASC';
    else { sortBy.value = ''; sortDirection.value = 'DESC'; }
  } else {
    sortBy.value = key;
    sortDirection.value = 'DESC';
  }
  page.value = 1;
}

// --- Data ------------------------------------------------------------------------
const filterQuery = computed(() => {
  const f = applied.value;
  return new URLSearchParams({ from: f.from, to: f.to, search: f.search, supplier: f.supplier, project: f.project, model: f.model, sourceKind: f.sourceKind, reviewStatus: f.reviewStatus }).toString();
});
const detail = useApiData<Page<DailyEntry>>(() => (view.value === 'detail'
  ? `/accounting/daily?${filterQuery.value}&${new URLSearchParams({ page: String(page.value), size: String(size.value), includeSummary: 'false' })}`
  : null));
const summary = useApiData<DailySummary>(() => `/accounting/daily/summary?${filterQuery.value}`);
const groups = useApiData<Page<DailyGroup>>(() => {
  if (view.value === 'detail') return null;
  const sorting = view.value === 'supplier' && sortBy.value ? `&${new URLSearchParams({ sortBy: sortBy.value, sortDirection: sortDirection.value })}` : '';
  return `/accounting/daily/groups?${filterQuery.value}&page=${page.value}&size=${size.value}&groupBy=${view.value === 'supplier' ? 'SUPPLIER' : 'DAY'}${sorting}`;
});
useSummaryRefresh(() => summary.data.value, summary.reload);
useSummaryRefresh(() => groups.data.value, groups.reload);

const directory = useSupplierDirectory(() => session.has('supplier.read'));
const projectData = useApiData<{ items: Project[] }>(() => (session.has('project.read') ? '/projects?page=1&size=100' : null));

const summaryReady = computed(() => !summary.loading.value && !summary.error.value && !!summary.data.value);
const totals = computed(() => (summaryReady.value ? summary.data.value!.totals : []));
const projectStats = computed(() => (summaryReady.value ? summary.data.value!.projects.filter((p) => p.count > 0) : []));
const showPending = computed(() => view.value === 'supplier' || totals.value.some((x) => x.pendingCount > 0) || (groups.data.value?.items.some((x) => x.pendingCount > 0) ?? false));
const showConfirmed = computed(() => view.value === 'supplier' || totals.value.some((x) => x.confirmedCount > 0) || (groups.data.value?.items.some((x) => x.confirmedCount > 0) ?? false));
const updating = computed(() => !!(summary.data.value?.summaryUpdating || groups.data.value?.summaryUpdating));
const groupCountText = computed(() => {
  if (view.value !== 'supplier') return String(summary.data.value?.groupCount ?? '—');
  return groups.loading.value || groups.error.value ? '—' : String(groups.data.value?.total ?? '—');
});

// --- Filter options -----------------------------------------------------------------
const supplierOptions = computed(() => {
  const items = directory.items.value ?? [];
  const value = draft.value.supplier;
  return [
    { value: '', label: directory.loading.value ? t('{0}加载中…', [t('供应商')]) : directory.error.value ? t('{0}加载失败', [t('供应商')]) : t('全部供应商') },
    ...items.map((s) => ({ value: s.id, label: s.name, detail: s.code })),
    ...(value && !items.some((s) => s.id === value) ? [{ value, label: t('已选{0}', [t('供应商')]) }] : []),
  ];
});
const projectOptions = computed(() => [
  { value: '', label: t('全部项目') },
  ...(projectData.data.value?.items ?? []).map((p) => ({ value: p.id, label: p.name, detail: p.code })),
]);
const sourceOptions = computed(() => [{ value: '', label: t('全部来源') }, ...Object.entries(DAILY_SOURCE_LABELS()).map(([value, label]) => ({ value, label }))]);
const viewOptions = [
  { value: 'summary' as const, label: t('按日汇总') },
  { value: 'supplier' as const, label: t('按供应商汇总') },
  { value: 'detail' as const, label: t('明细') },
];
const sourceLabels = DAILY_SOURCE_LABELS();

// --- Export -------------------------------------------------------------------------
const canExport = computed(() => session.has('settlement.export') && session.has('usage.read'));
const exportScope = ref<ExportScope | null>(null);
const historyOpen = ref(false);
function openExport() {
  const filter = applied.value;
  exportScope.value = {
    filter: { ...filter },
    supplierName: directory.items.value?.find((s) => s.id === filter.supplier)?.name || filter.supplier || t('全部供应商'),
    projectName: projectData.data.value?.items.find((p) => p.id === filter.project)?.name || filter.project || t('全部项目'),
  };
}

// --- Detail rows ----------------------------------------------------------------------
const detailColumns = computed(() => [
  { key: 'businessDate', label: t('账务日期'), nowrap: true },
  { key: 'supplierName', label: t('供应商') },
  { key: 'project', label: t('服务 / 项目') },
  { key: 'source', label: t('来源') },
  { key: 'amount', label: t('消耗 / 原始金额'), align: 'right' as const },
  { key: 'pricing', label: t('结算折扣 / 单价') },
  { key: 'payable', label: t('应付'), align: 'right' as const },
  { key: 'state', label: t('状态') },
  ...(session.has('usage.import') ? [{ key: 'actions', label: t('操作') }] : []),
]);

// Confirm a CCMAX observation collected for a past day, at the version shown.
const confirming = ref<string[]>([]);
async function confirmObservation(row: DailyEntry) {
  const id = row.sourceId || row.id;
  if (confirming.value.includes(id)) return;
  confirming.value = [...confirming.value, id];
  try {
    await apiPost(`/settlement-inputs/${encodeURIComponent(id)}/confirm`, { version: row.version });
    session.refresh();
  } catch (error) {
    session.notify((error as Error).message, true);
  } finally {
    confirming.value = confirming.value.filter((value) => value !== id);
  }
}

const openInputs = () => router.push({ path: '/settlements', query: { tab: 'inputs' } });
const statCards = [
  { label: t('消耗合计'), key: 'consumptionTotal' as const, hint: t('已拉取的真实消耗合计') },
  { label: t('已入账金额'), key: 'confirmedOriginal' as const, hint: t('已自动计价入账的原始金额') },
  { label: t('待计价消耗'), key: 'pendingConsumption' as const, hint: t('今日或缺报价等原因尚未计价入账') },
  { label: t('未结算金额'), key: 'unsettledPayable' as const, hint: t('已入账且尚未生成结算单的应付金额') },
];
const chipTones = ['blue', 'violet', 'green', 'amber'];
</script>

<template>
  <div class="daily">
    <section class="ld-card">
      <form class="filters" @submit.prevent="apply()">
        <label class="f-item grow">
          <span>{{ t('关键词') }}</span>
          <SearchInput :model-value="draft.search" :placeholder="t('来源编号或关键词')" :label="t('关键词')" @update:model-value="setDraft({ search: $event })" />
        </label>
        <div class="f-item">
          <span>{{ t('供应商') }}</span>
          <Select :model-value="draft.supplier" :options="supplierOptions" :label="t('供应商')" icon="users" searchable
            :search-placeholder="t('搜索供应商名称或编码')" :disabled="directory.loading.value && !draft.supplier"
            @update:model-value="setDraft({ supplier: String($event) })" />
        </div>
        <div class="f-item">
          <span>{{ t('项目') }}</span>
          <Select :model-value="draft.project" :options="projectOptions" :label="t('项目')" searchable
            :search-placeholder="t('搜索项目名称或编码')" @update:model-value="setDraft({ project: String($event) })" />
        </div>
        <label class="f-item">
          <span>{{ t('模型') }}</span>
          <SearchInput :model-value="draft.model" :placeholder="t('全部模型')" :label="t('模型')" @update:model-value="setDraft({ model: $event })" />
        </label>
        <div class="f-item narrow">
          <span>{{ t('来源') }}</span>
          <Select :model-value="draft.sourceKind" :options="sourceOptions" :label="t('来源类型')" @update:model-value="setDraft({ sourceKind: String($event) })" />
        </div>
        <div class="f-item date">
          <span>{{ t('账务日期') }}</span>
          <DateRangePicker :from="draft.from" :to="draft.to" :label="t('账务日期')" @change="(from, to) => setDraft({ from, to })" />
        </div>
        <div class="f-actions">
          <Button type="submit" variant="primary" icon="search">{{ t('查询') }}</Button>
          <Button @click="reset">{{ t('重置') }}</Button>
          <IconButton icon="refresh" :label="t('刷新日账')" @click="session.refresh()" />
        </div>
      </form>
      <p v-if="draftChanged" class="draft-status" role="status"><Icon name="info" :size="14" />{{ t('筛选条件已修改，点击查询后更新结果。') }}</p>
    </section>

    <Notice v-if="summaryReady && summary.data.value!.crossPeriodCount > 0" tone="warning">
      {{ t('当前日期范围有') }} {{ summary.data.value!.crossPeriodCount }} {{ t('笔跨天金额未计入日账。直接录入的真实结算金额可按完整期间结算；其他未结算记录需按真实每日金额重新录入，已结算记录需人工核对。') }}
      <template #actions><Button size="sm" trailing-icon="arrow" @click="openInputs">{{ t('查看金额记录') }}</Button></template>
    </Notice>
    <Notice v-if="updating" tone="info">{{ t('汇总更新中，将自动刷新') }}</Notice>
    <p v-if="summary.loading.value" class="quiet"><Spinner :size="14" />{{ t('正在加载日账统计…') }}</p>
    <Notice v-if="summary.error.value" tone="danger">
      {{ t('日账统计加载失败：') }}{{ summary.error.value }}
      <template #actions><Button size="sm" icon="refresh" @click="session.refresh()">{{ t('重试统计') }}</Button></template>
    </Notice>

    <template v-if="totals.length">
      <div class="stats">
        <article v-for="card in statCards" :key="card.key" class="stat">
          <span class="stat-label">{{ card.label }}</span>
          <strong v-for="total in totals" :key="total.currency" class="stat-figure">
            <MoneyDisplay :currency="total.currency" :value="total[card.key]" />
          </strong>
          <small>{{ card.hint }}</small>
        </article>
      </div>
      <div v-if="projectStats.length" class="projects">
        <span class="projects-title">{{ t('项目统计') }}</span>
        <span v-for="(item, index) in projectStats" :key="`${item.projectId}:${item.currency}`" class="chip" :class="chipTones[index % 4]">
          <b>{{ item.projectName }}</b>
          <em>{{ item.count }} {{ t('条') }}</em>
          <strong><MoneyDisplay :currency="item.currency" :value="item.amount" /></strong>
        </span>
      </div>
    </template>

    <section class="ld-card">
      <div class="viewbar">
        <Segmented :model-value="view" :options="viewOptions" :label="t('日账视图')" @update:model-value="switchView" />
        <div class="viewbar-end">
          <span v-if="summaryReady" class="counts">{{ summary.data.value!.total }} {{ t('条记录 ·') }} {{ groupCountText }} {{ t('组') }}</span>
          <template v-if="canExport">
            <Button size="sm" icon="download" :disabled="!summaryReady || summary.data.value!.total === 0" :title="t('导出当前筛选的全部分页')" @click="openExport">{{ t('导出') }}</Button>
            <Button size="sm" @click="historyOpen = true">{{ t('导出记录') }}</Button>
          </template>
        </div>
      </div>
      <p class="hint">{{ t('来源金额须按报价或直接金额依据核对；历史采集记录确认后才计入可结算应付。当天日账次日可结算（北京时间）。') }}</p>

      <template v-if="view === 'detail'">
        <DataTable :columns="detailColumns" :rows="detail.data.value?.items" :row-key="(row: DailyEntry) => row.id" :loading="detail.loading.value"
          :refreshing="detail.refreshing.value" :error="detail.error.value" :label="t('明细')" @retry="detail.reload()">
          <template #cell-businessDate="{ row }"><strong class="mono-date">{{ row.businessDate }}</strong></template>
          <template #cell-supplierName="{ row }"><strong class="strong">{{ row.supplierName }}</strong></template>
          <template #cell-project="{ row }">
            <div class="cell"><strong>{{ row.projectName }}</strong><small>{{ row.projectCategory || t('未分类') }}</small></div>
          </template>
          <template #cell-source="{ row }">
            <div class="cell">
              <span>{{ sourceLabels[row.sourceKind] }}</span>
              <small v-if="row.modelKey">{{ t('模型：') }}{{ row.modelKey }}</small>
              <small v-if="row.resourceUsageId">{{ t('历史期间总费用来源') }}</small>
              <small class="ref">{{ row.sourceRef }}</small>
            </div>
          </template>
          <template #cell-amount="{ row }">
            <div class="cell end">
              <MoneyDisplay :currency="row.currency" :value="row.exactConsumption ?? row.originalAmount" />
              <small v-if="row.quantity">{{ t('计价数量') }} {{ row.quantity }}</small>
            </div>
          </template>
          <template #cell-pricing="{ row }">
            <span v-if="row.pricingType === 'DIRECT'">{{ t('直接录入真实结算金额') }}</span>
            <div v-else-if="row.pricingType === 'DISCOUNT'" class="cell">
              <strong>{{ row.settlementMultiplier == null ? '—' : formatDiscount(row.settlementMultiplier) }}</strong>
              <small>{{ row.pricingProvisional ? t('当前有效报价') : t('入账时报价') }}</small>
            </div>
            <div v-else-if="row.pricingType === 'FIXED'" class="cell">
              <strong>{{ t('按单价') }}</strong>
              <small>{{ row.currency }} {{ row.settlementUnitPrice ?? '—' }} {{ t('/ 个') }}</small>
            </div>
            <span v-else-if="row.pricingProvisional" class="issue">{{ translateServerMessage(row.pricingIssue || t('暂无唯一有效报价')) }}</span>
            <span v-else class="none">—</span>
          </template>
          <template #cell-payable="{ row }">
            <strong class="amount">{{ row.finalAmount == null ? t('待计价') : `${row.currency} ${formatMoney(row.finalAmount, row.currency)}` }}</strong>
          </template>
          <template #cell-state="{ row }">
            <div class="cell">
              <strong>{{ DISPLAY_STATE_LABELS[row.displayState] ? t(DISPLAY_STATE_LABELS[row.displayState]) : '' }}</strong>
              <small v-if="row.currentDayProvisional && row.observationQueriedAt">{{ t('最近查询') }} {{ beijingDateTime(row.observationQueriedAt) }}{{ t('（北京时间）· 次日可结算') }}</small>
              <small v-if="row.sourceChanged">{{ t('上游金额已修订，') }}{{ row.state === 'AVAILABLE' ? t('暂停结算') : t('需核对差额') }}</small>
              <small v-if="row.settlementCode" class="ref">{{ row.settlementCode }}</small>
              <small v-if="row.displayState === 'PARTIALLY_PAID'">{{ t('整单已付') }} {{ row.settlementPaidAmount }} / {{ row.settlementTotal }}</small>
            </div>
          </template>
          <template #cell-actions="{ row }">
            <Button v-if="row.sourceKind === 'CCMAX_OBSERVATION' && row.state === 'PENDING'" size="sm" :loading="confirming.includes(row.sourceId || row.id)"
              @click="confirmObservation(row)">{{ t('确认采集金额') }}</Button>
            <span v-else class="none">—</span>
          </template>
        </DataTable>
        <Pagination v-model:page="page" v-model:size="size" :total="detail.data.value?.total ?? 0" :loading="detail.loading.value" />
      </template>

      <div v-else-if="groups.loading.value" class="state"><Spinner :size="16" />{{ t('正在汇总…') }}</div>
      <div v-else-if="groups.error.value" class="pad"><Notice tone="danger">{{ groups.error.value }}</Notice></div>
      <template v-else-if="groups.data.value">
        <div class="group-heading">
          <strong>{{ t(view === 'supplier' ? '供应商 × 币种 × 折扣汇总' : '日期 × 供应商 × 项目汇总') }}</strong>
          <small>{{ t('按当前条件汇总全部') }} {{ summaryReady ? summary.data.value!.total : '—' }} {{ t('条记录；待计价消耗不计入应付。') }}</small>
        </div>
        <DailyGroupTable
          v-if="groups.data.value.items.length"
          :by-supplier="view === 'supplier'"
          :items="groups.data.value.items"
          :totals="totals"
          :show-pending="showPending"
          :show-confirmed="showConfirmed"
          :sort-by="sortBy"
          :sort-direction="sortDirection"
          @sort="sort"
        />
        <EmptyState v-else :text="t('当前条件没有日账记录')" compact />
        <Pagination v-model:page="page" v-model:size="size" :total="groups.data.value.total" :loading="groups.loading.value" />
      </template>
    </section>

    <DailyExportDialog v-if="exportScope" :scope="exportScope" @close="exportScope = null" />
    <DailyExportHistory v-if="historyOpen" @close="historyOpen = false" />
  </div>
</template>

<style scoped>
.daily { display: grid; gap: 14px; }
.ld-card { background: var(--hs-surface); border: 1px solid var(--hs-border); border-radius: var(--hs-radius-card); box-shadow: var(--hs-shadow-card); overflow: hidden; }

.filters { display: flex; flex-wrap: wrap; align-items: flex-end; gap: 10px 10px; padding: 14px 16px; }
.f-item { display: grid; gap: 4px; flex: 0 1 190px; min-width: 150px; }
.f-item > span { color: var(--hs-text-3); font-size: var(--hs-text-xs); }
.f-item.grow { flex: 1 1 220px; }
.f-item.narrow { flex: 0 1 160px; min-width: 132px; }
.f-item.date { flex: 0 1 230px; min-width: 210px; }
.f-actions { display: flex; align-items: center; gap: 6px; margin-left: auto; }
.draft-status { display: flex; align-items: center; gap: 6px; margin: 0; padding: 0 16px 12px; color: var(--hs-warning); font-size: var(--hs-text-xs); }
.quiet { display: flex; align-items: center; gap: 8px; margin: 0; color: var(--hs-text-3); font-size: var(--hs-text-xs); }

.stats { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 12px; }
.stat { display: grid; align-content: start; gap: 4px; padding: 14px 16px; background: var(--hs-surface); border: 1px solid var(--hs-border); border-radius: 14px; }
.stat-label { color: var(--hs-text-3); font-size: var(--hs-text-xs); }
.stat-figure { color: var(--hs-text); font-size: 19px; font-weight: 600; letter-spacing: -.3px; }
.stat small { margin-top: 2px; color: var(--hs-text-4); font-size: 11px; line-height: 1.5; }
.projects { display: flex; flex-wrap: wrap; align-items: center; gap: 8px; }
.projects-title { color: var(--hs-text-3); font-size: var(--hs-text-xs); }
.chip { display: inline-flex; align-items: baseline; gap: 8px; padding: 5px 10px; background: var(--hs-surface); border: 1px solid var(--hs-border); border-left-width: 3px; border-radius: 10px; font-size: var(--hs-text-xs); }
.chip b { color: var(--hs-text); font-weight: 500; }
.chip em { color: var(--hs-text-3); font-style: normal; }
.chip strong { color: var(--hs-text); font-weight: 500; }
.chip.blue { border-left-color: var(--hs-accent); }
.chip.violet { border-left-color: var(--hs-violet); }
.chip.green { border-left-color: var(--hs-success); }
.chip.amber { border-left-color: #d79a2b; }

.viewbar { display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: 10px; padding: 14px 16px 6px; }
.viewbar-end { display: flex; flex-wrap: wrap; align-items: center; gap: 8px; }
.counts { color: var(--hs-text-3); font-size: var(--hs-text-xs); font-variant-numeric: tabular-nums; }
.hint { margin: 0; padding: 4px 16px 12px; color: var(--hs-text-3); font-size: var(--hs-text-xs); line-height: 1.6; }
.group-heading { display: flex; flex-wrap: wrap; align-items: baseline; gap: 4px 12px; padding: 0 20px 10px; }
.group-heading strong { color: var(--hs-text); font-size: var(--hs-text-sm); font-weight: 600; }
.group-heading small { color: var(--hs-text-3); font-size: var(--hs-text-xs); }
.state { display: flex; align-items: center; justify-content: center; gap: 8px; padding: 40px; color: var(--hs-text-3); font-size: var(--hs-text-sm); }
.pad { padding: 0 16px 16px; }

.cell { display: grid; gap: 2px; min-width: 0; }
.cell.end { justify-items: end; }
.cell strong, .strong { color: var(--hs-text); font-weight: 500; }
.cell small { color: var(--hs-text-3); font-size: var(--hs-text-xs); }
.mono-date { color: var(--hs-text); font-family: var(--hs-font-mono); font-size: var(--hs-text-xs); font-weight: 500; white-space: nowrap; }
.ref { font-family: var(--hs-font-mono); overflow-wrap: anywhere; }
.amount { color: var(--hs-text); font-weight: 500; font-variant-numeric: tabular-nums; white-space: nowrap; }
.issue { color: var(--hs-warning); font-size: var(--hs-text-xs); }
.none { color: var(--hs-text-4); }

@media (max-width: 1080px) { .stats { grid-template-columns: repeat(2, minmax(0, 1fr)); } }
@media (max-width: 560px) { .stats { grid-template-columns: minmax(0, 1fr); } }
</style>
