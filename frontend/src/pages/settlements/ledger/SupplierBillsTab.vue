<script setup lang="ts">
// Supplier consumption bills (settlements?tab=daily for suppliers) and, with
// `departmentView`, department bills (settlements?tab=departments). Supplier
// agents who are not group admins only see their own daily consumption.
// Today's unfiltered bills refresh every 60 s; summaries still being rebuilt
// reload every 2.5 s.
import { computed, ref } from 'vue';
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
import Spinner from '../../../components/ui/Spinner.vue';
import MoneyDisplay from './MoneyDisplay.vue';
import SupplierBillEntriesDialog from './SupplierBillEntriesDialog.vue';
import { useApiData } from '../../../composables/useApiData';
import { t, translateInContext, translateServerMessage } from '../../../lib/i18n';
import { beijingDate, formatMoney } from '../../../lib/money';
import { useSessionStore } from '../../../stores/session';
import { debounceSearch, useLiveData, useSummaryRefresh } from './ledger';
import { UNASSIGNED, type BillFilters, type BillPage, type BillTotal, type CreatorRow, type DayRow, type DepartmentRow } from './bills';

const props = withDefaults(defineProps<{ departmentView?: boolean }>(), { departmentView: false });

const session = useSessionStore();
const isAgent = computed(() => session.user?.role === 'SUPPLIER_AGENT');

// --- Filters ---------------------------------------------------------------------
const from = ref(beijingDate());
const to = ref(beijingDate());
const searchDraft = ref('');
const search = ref('');
const resourceType = ref('');
const project = ref('');
const creator = ref('');
const department = ref('');
/** A single day chosen by drilling into a by-day department row. */
const dateOverride = ref('');
const departmentByDate = ref<'day' | 'period'>('day');
const view = ref<'days' | 'creators'>('days');
const departmentPage = ref(1);
const departmentSize = ref(10);
const dayPage = ref(1);
const daySize = ref(10);
const creatorPage = ref(1);
const creatorSize = ref(10);
const selected = ref<CreatorRow | null>(null);

const resetPages = () => { creatorPage.value = 1; dayPage.value = 1; departmentPage.value = 1; };
debounceSearch(searchDraft, search, resetPages);

const rangeFrom = computed(() => dateOverride.value || from.value);
const rangeTo = computed(() => dateOverride.value || to.value);
const todayOnly = computed(() => rangeFrom.value === beijingDate() && rangeTo.value === beijingDate());
const live = computed(() => rangeTo.value === beijingDate() && !search.value && !resourceType.value && !project.value && !creator.value && !department.value);
const query = computed(() => new URLSearchParams({
  from: rangeFrom.value, to: rangeTo.value, search: search.value, resourceType: resourceType.value,
  project: project.value, creator: creator.value, department: department.value,
}).toString());

const filters = useApiData<BillFilters>(() => `/supplier-bills/filters?${new URLSearchParams({ from: rangeFrom.value, to: rangeTo.value, department: department.value })}`);
const groupAdmin = computed(() => !!filters.data.value?.groupAdmin);
/** Agents outside a group admin role see only their own days. */
const memberOnly = computed(() => isAgent.value && !groupAdmin.value);
const showMemberViews = computed(() => !props.departmentView || !!department.value || groupAdmin.value);
const creatorsByDate = computed(() => isAgent.value && groupAdmin.value);
const departmentTotals = computed(() => props.departmentView && (!showMemberViews.value || view.value !== 'days'));

const days = useLiveData<BillPage<DayRow>>(() => (departmentTotals.value ? null
  : `/supplier-bills/days?${query.value}&page=${dayPage.value}&size=${daySize.value}`), () => live.value, 60_000);
const creators = useLiveData<BillPage<CreatorRow>>(() => (memberOnly.value || view.value !== 'creators' || (props.departmentView && !department.value && !groupAdmin.value) ? null
  : `/supplier-bills/creators?${query.value}&groupByDate=${creatorsByDate.value}&page=${creatorPage.value}&size=${creatorSize.value}`), () => live.value, 60_000);
const departments = useLiveData<BillPage<DepartmentRow>>(() => (departmentTotals.value
  ? `/supplier-bills/departments?${query.value}&groupByDate=${departmentByDate.value === 'day'}&page=${departmentPage.value}&size=${departmentSize.value}` : null), () => live.value, 60_000);
useSummaryRefresh(() => days.data.value, days.reload);
useSummaryRefresh(() => creators.data.value, creators.reload);
useSummaryRefresh(() => departments.data.value, departments.reload);
useSummaryRefresh(() => filters.data.value, filters.reload);

const updating = computed(() => !!(days.data.value?.summaryUpdating || creators.data.value?.summaryUpdating || departments.data.value?.summaryUpdating));
const totals = computed<BillTotal[]>(() => {
  const source = departmentTotals.value ? departments : days;
  return !source.loading.value && !source.error.value ? source.data.value?.totals ?? [] : [];
});

function setRange(nextFrom: string, nextTo: string) {
  from.value = nextFrom; to.value = nextTo; dateOverride.value = ''; resetPages();
}
const setResourceType = (value: string) => { resourceType.value = value; resetPages(); };
const setProject = (value: string) => { project.value = value; resetPages(); };
const setCreator = (value: string) => { creator.value = value; resetPages(); };
/** Drill into a department (optionally one day of it) and show its members. */
function openDepartment(value: string, date = '') {
  department.value = value; dateOverride.value = date; view.value = 'creators'; creator.value = ''; selected.value = null; resetPages();
}
function reset() {
  from.value = beijingDate(); to.value = beijingDate(); searchDraft.value = ''; search.value = '';
  resourceType.value = ''; project.value = ''; creator.value = ''; department.value = ''; dateOverride.value = ''; resetPages();
}
function setDepartmentByDate(value: 'day' | 'period') { departmentByDate.value = value; departmentPage.value = 1; }

// --- Options & labels ------------------------------------------------------------------
const departmentOptions = computed(() => [{ value: '', label: t('全部部门') }, ...(filters.data.value?.departments ?? []), { value: UNASSIGNED, label: t('主账号／历史未归属') }]);
const resourceTypeOptions = computed(() => [{ value: '', label: t('全部资源类型') }, ...(filters.data.value?.resourceTypes ?? []).map((o) => ({ ...o, label: translateServerMessage(o.label) }))]);
const projectOptions = computed(() => [{ value: '', label: t('全部项目') }, ...(filters.data.value?.projects ?? [])]);
const creatorOptions = computed(() => [{ value: '', label: t('全部创建账号') }, ...(filters.data.value?.creators ?? [])]);
const creatorLabel = translateInContext('label', '创建账号');
const memberTitle = computed(() => (props.departmentView
  ? filters.data.value?.groupName || filters.data.value?.departments?.find((o) => o.value === department.value)?.label || t('主账号／历史未归属')
  : t('日账明细')));

const statKeys = computed(() => (isAgent.value
  ? [{ label: t('消耗合计'), key: 'consumptionTotal' as const }]
  : [{ label: t('消耗合计'), key: 'consumptionTotal' as const }, { label: t('已入账应收'), key: 'payableTotal' as const }, { label: t('待计价消耗'), key: 'pendingConsumption' as const }]));

const isToday = (date: string | null | undefined) => date === beijingDate();
const counts = (row: { resourceCount: number; entryCount: number }) => t('{0} 个资源 · {1} 条账单', [row.resourceCount, row.entryCount]);

const departmentColumns = computed(() => [
  { key: 'date', label: t(departmentByDate.value === 'day' ? '日期' : '账务期间'), nowrap: true },
  { key: 'department', label: t('部门') },
  { key: 'resources', label: t('资源 / 账单') },
  { key: 'consumption', label: t('消耗合计'), align: 'right' as const },
  ...(isAgent.value ? [] : [{ key: 'payable', label: t('已入账应收'), align: 'right' as const }, { key: 'pending', label: t('待计价消耗'), align: 'right' as const }]),
  { key: 'actions', label: t('操作') },
]);
const dayColumns = computed(() => [
  { key: 'date', label: t('日期'), nowrap: true },
  ...(isAgent.value ? [] : [{ key: 'resourceType', label: t('资源类型') }, { key: 'resources', label: t('资源 / 账单') }]),
  { key: 'consumption', label: t('消耗'), align: 'right' as const },
  ...(isAgent.value ? [] : [{ key: 'payable', label: t('已入账应收'), align: 'right' as const }, { key: 'pending', label: t('待计价消耗'), align: 'right' as const }]),
]);
const creatorColumns = computed(() => [
  ...(creatorsByDate.value ? [{ key: 'date', label: t('日期'), nowrap: true }] : []),
  { key: 'creator', label: creatorLabel },
  { key: 'resourceType', label: t('资源类型') },
  { key: 'resources', label: t('资源 / 账单') },
  { key: 'consumption', label: t('消耗合计'), align: 'right' as const },
  ...(isAgent.value ? [] : [{ key: 'payable', label: t('已入账应收'), align: 'right' as const }, { key: 'pending', label: t('待计价消耗'), align: 'right' as const }]),
  { key: 'actions', label: t('操作') },
]);
const departmentModes = [{ value: 'day' as const, label: t('按日显示') }, { value: 'period' as const, label: t('期间汇总') }];
const memberModes = [{ value: 'creators' as const, label: t('成员账单') }, { value: 'days' as const, label: t('每日汇总') }];
</script>

<template>
  <div class="bills">
    <Notice v-if="updating" tone="info">{{ t('汇总更新中，将自动刷新') }}</Notice>

    <section class="ld-card">
      <div class="filters">
        <div class="f-item date">
          <span>{{ t('账务日期') }}</span>
          <DateRangePicker :from="rangeFrom" :to="rangeTo" :label="t('账务日期')" @change="setRange" />
        </div>
        <template v-if="!memberOnly">
          <div v-if="departmentView && !isAgent" class="f-item">
            <span>{{ t('部门') }}</span>
            <Select :model-value="department" :options="departmentOptions" :label="t('账单部门')" searchable :search-placeholder="t('搜索部门')"
              @update:model-value="openDepartment(String($event))" />
          </div>
          <div class="f-item">
            <span>{{ t('资源类型') }}</span>
            <Select :model-value="resourceType" :options="resourceTypeOptions" :label="t('账单资源类型')" @update:model-value="setResourceType(String($event))" />
          </div>
          <div class="f-item">
            <span>{{ t('项目') }}</span>
            <Select :model-value="project" :options="projectOptions" :label="t('账单项目')" searchable :search-placeholder="t('搜索项目')"
              @update:model-value="setProject(String($event))" />
          </div>
          <div class="f-item">
            <span>{{ creatorLabel }}</span>
            <Select :model-value="creator" :options="creatorOptions" :label="t('账单创建账号')" searchable :search-placeholder="t('搜索创建账号')"
              @update:model-value="setCreator(String($event))" />
          </div>
          <label class="f-item grow">
            <span>{{ t('关键词') }}</span>
            <SearchInput v-model="searchDraft" :placeholder="t('搜索创建账号、资源或项目')" :label="t('关键词')" />
          </label>
        </template>
        <div class="f-actions">
          <Button @click="reset">{{ t('重置') }}</Button>
          <IconButton icon="refresh" :label="t('刷新供应商账单')" @click="session.refresh()" />
        </div>
      </div>
      <p v-if="filters.loading.value" class="quiet"><Spinner :size="14" />{{ t('正在加载筛选选项…') }}</p>
      <div v-if="filters.error.value" class="pad">
        <Notice tone="danger">
          {{ t('筛选选项加载失败：') }}{{ filters.error.value }}
          <template #actions><Button size="sm" icon="refresh" @click="session.refresh()">{{ t('重试') }}</Button></template>
        </Notice>
      </div>
    </section>

    <div v-if="totals.length" class="stats" :class="{ single: isAgent }">
      <article v-for="stat in statKeys" :key="stat.key" class="stat">
        <span class="stat-label">
          {{ stat.label }}
          <span v-if="stat.key === 'pendingConsumption'" class="help">
            <button type="button" :aria-label="t('待计价消耗说明')" aria-describedby="supplier-bill-pending-hint"><Icon name="help" :size="13" /></button>
            <span id="supplier-bill-pending-hint" role="tooltip">{{ t('当日消耗，次日入账。') }}</span>
          </span>
        </span>
        <strong v-for="total in totals" :key="total.currency" class="stat-figure" :title="`${total.currency} ${total[stat.key] ?? ''}`">
          <template v-if="stat.key === 'payableTotal' && todayOnly">{{ t('次日入账') }}</template>
          <template v-else><small>{{ total.currency }}</small>{{ total[stat.key] == null ? '—' : formatMoney(total[stat.key], total.currency) }}</template>
        </strong>
      </article>
    </div>

    <!-- Department summary -->
    <section v-if="departmentView && !showMemberViews" class="ld-card">
      <div class="viewbar">
        <div class="viewbar-title">
          <h2>{{ t('部门汇总') }}</h2>
          <small>{{ t('按成员当前部门归集，币种分别统计') }}</small>
        </div>
        <Segmented :model-value="departmentByDate" :options="departmentModes" :label="t('部门汇总方式')" @update:model-value="setDepartmentByDate" />
      </div>
      <DataTable :columns="departmentColumns" :rows="departments.data.value?.items"
        :row-key="(row: DepartmentRow) => `${row.businessDate ?? ''}:${row.departmentId ?? ''}:${row.resourceTypeName}:${row.currency}`"
        :loading="departments.loading.value" :refreshing="departments.refreshing.value" :error="departments.error.value" :label="t('部门汇总')" @retry="departments.reload()">
        <template #cell-date="{ row }">
          <strong v-if="departmentByDate === 'day'" class="mono-date">{{ row.businessDate }}</strong>
          <div v-else class="cell hs-mono"><span>{{ from }}</span><small>{{ t('至 {0}', [to]) }}</small></div>
        </template>
        <template #cell-department="{ row }">
          <div class="cell">
            <strong>{{ row.departmentId ? row.departmentName : t('主账号／历史未归属') }}</strong>
            <small>{{ t('{0} 位账单成员', [row.memberCount]) }}</small>
          </div>
        </template>
        <template #cell-resources="{ row }">
          <div class="cell"><span>{{ translateServerMessage(row.resourceTypeName) }}</span><small>{{ counts(row) }}</small></div>
        </template>
        <template #cell-consumption="{ row }"><MoneyDisplay :currency="row.currency" :value="row.consumptionTotal" /></template>
        <template #cell-payable="{ row }">
          <strong class="amount">
            <template v-if="todayOnly || isToday(row.businessDate)">{{ t('次日入账') }}</template>
            <MoneyDisplay v-else :currency="row.currency" :value="row.payableTotal" />
          </strong>
        </template>
        <template #cell-pending="{ row }"><MoneyDisplay :currency="row.currency" :value="row.pendingConsumption" /></template>
        <template #cell-actions="{ row }">
          <button type="button" class="ld-link" @click="openDepartment(row.departmentId || UNASSIGNED, (departmentByDate === 'day' && row.businessDate) || '')">{{ t('查看成员') }}</button>
        </template>
      </DataTable>
      <Pagination v-model:page="departmentPage" v-model:size="departmentSize" :total="departments.data.value?.total ?? 0" :loading="departments.loading.value" />
    </section>

    <!-- Member bills -->
    <section v-if="showMemberViews" class="ld-card">
      <div class="viewbar">
        <div class="viewbar-title">
          <button v-if="departmentView && !isAgent && department" type="button" class="ld-link back" @click="openDepartment('')">
            <Icon name="arrow-left" :size="14" />{{ t('返回部门汇总') }}
          </button>
          <h2>{{ memberTitle }}</h2>
        </div>
        <Segmented v-if="!memberOnly" v-model="view" :options="memberModes" :label="t('账单汇总方式')" />
      </div>

      <template v-if="view === 'days' || memberOnly">
        <DataTable :columns="dayColumns" :rows="days.data.value?.items" :row-key="(row: DayRow) => `${row.businessDate}:${row.resourceTypeName}:${row.currency}`"
          :loading="days.loading.value" :refreshing="days.refreshing.value" :error="days.error.value" :label="t('每日汇总')" @retry="days.reload()">
          <template #cell-date="{ row }"><strong class="mono-date">{{ row.businessDate }}</strong></template>
          <template #cell-resourceType="{ row }">{{ translateServerMessage(row.resourceTypeName) }}</template>
          <template #cell-resources="{ row }">{{ counts(row) }}</template>
          <template #cell-consumption="{ row }"><MoneyDisplay :currency="row.currency" :value="row.consumptionTotal" /></template>
          <template #cell-payable="{ row }">
            <strong class="amount">
              <template v-if="isToday(row.businessDate)">{{ t('次日入账') }}</template>
              <MoneyDisplay v-else :currency="row.currency" :value="row.payableTotal" />
            </strong>
          </template>
          <template #cell-pending="{ row }"><MoneyDisplay :currency="row.currency" :value="row.pendingConsumption" /></template>
        </DataTable>
        <Pagination v-model:page="dayPage" v-model:size="daySize" :total="days.data.value?.total ?? 0" :loading="days.loading.value" />
      </template>

      <template v-if="!memberOnly && view === 'creators'">
        <DataTable :columns="creatorColumns" :rows="creators.data.value?.items" :row-key="(row: CreatorRow) => row.id"
          :loading="creators.loading.value" :refreshing="creators.refreshing.value" :error="creators.error.value" :label="t('成员账单')" @retry="creators.reload()">
          <template #cell-date="{ row }"><strong class="mono-date">{{ row.businessDate }}</strong></template>
          <template #cell-creator="{ row }">
            <div class="cell"><strong>{{ row.creatorName }}</strong><small>{{ row.creatorUsername || t('历史归属待核对') }}</small></div>
          </template>
          <template #cell-resourceType="{ row }">{{ translateServerMessage(row.resourceTypeName) }}</template>
          <template #cell-resources="{ row }">{{ counts(row) }}</template>
          <template #cell-consumption="{ row }"><MoneyDisplay :currency="row.currency" :value="row.consumptionTotal" /></template>
          <template #cell-payable="{ row }">
            <strong class="amount">
              <template v-if="todayOnly">{{ t('次日入账') }}</template>
              <MoneyDisplay v-else :currency="row.currency" :value="row.payableTotal" />
            </strong>
          </template>
          <template #cell-pending="{ row }"><MoneyDisplay :currency="row.currency" :value="row.pendingConsumption" /></template>
          <template #cell-actions="{ row }"><button type="button" class="ld-link" @click="selected = row">{{ t('查看明细') }}</button></template>
        </DataTable>
        <Pagination v-model:page="creatorPage" v-model:size="creatorSize" :total="creators.data.value?.total ?? 0" :loading="creators.loading.value" />
      </template>
    </section>

    <details class="notes">
      <summary>{{ t('账单口径与说明') }}</summary>
      <p v-if="departmentView">{{ t(isAgent ? '部门账单按成员当前所属部门汇总；调整部门后，历史日账随当前归属展示。' : '部门账单按成员当前所属部门汇总；调整部门后，历史日账随当前归属展示。已入账应收沿用原账单金额。') }}</p>
      <p v-if="!isAgent">{{ t('今日账单持续更新，次日可结算；待计价消耗尚未计入应收。历史资源未能关联创建账号的，单独列示。') }}</p>
      <p>{{ t('金额按币种精度展示，悬停可查看完整数值；币种分别统计。') }}</p>
    </details>

    <SupplierBillEntriesDialog
      v-if="selected"
      :key="`${selected.id}:${query}`"
      :creator="selected"
      :member-view="isAgent"
      :options="filters.data.value"
      :filter="query"
      @close="selected = null"
    />
  </div>
</template>

<style scoped>
.bills { display: grid; gap: 14px; }
.ld-card { background: var(--hs-surface); border: 1px solid var(--hs-border); border-radius: var(--hs-radius-card); box-shadow: var(--hs-shadow-card); overflow: hidden; }
.filters { display: flex; flex-wrap: wrap; align-items: flex-end; gap: 10px; padding: 14px 16px; }
.f-item { display: grid; gap: 4px; flex: 0 1 180px; min-width: 150px; }
.f-item > span { color: var(--hs-text-3); font-size: var(--hs-text-xs); }
.f-item.grow { flex: 1 1 220px; }
.f-item.date { flex: 0 1 230px; min-width: 210px; }
.f-actions { display: flex; align-items: center; gap: 6px; margin-left: auto; }
.quiet { display: flex; align-items: center; gap: 8px; margin: 0; padding: 0 16px 12px; color: var(--hs-text-3); font-size: var(--hs-text-xs); }
.pad { padding: 0 16px 14px; }

.stats { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 12px; }
.stats.single { grid-template-columns: minmax(0, 360px); }
.stat { display: grid; align-content: start; gap: 4px; padding: 14px 16px; background: var(--hs-surface); border: 1px solid var(--hs-border); border-radius: 14px; }
.stat-label { display: inline-flex; align-items: center; gap: 4px; color: var(--hs-text-3); font-size: var(--hs-text-xs); }
.stat-figure { display: flex; align-items: baseline; gap: 6px; color: var(--hs-text); font-size: 19px; font-weight: 600; letter-spacing: -.3px; font-variant-numeric: tabular-nums; }
.stat-figure small { color: var(--hs-text-3); font-size: 11px; font-weight: 500; letter-spacing: 0; }
.help { position: relative; display: inline-flex; }
.help button { display: inline-grid; place-items: center; min-height: 0; padding: 0; color: var(--hs-text-4); background: none; border: 0; cursor: help; }
.help [role="tooltip"] { position: absolute; left: 50%; bottom: calc(100% + 6px); z-index: 2; width: max-content; max-width: 220px; padding: 6px 8px; color: #fff; background: var(--hs-primary); border-radius: 6px; font-size: 11px; line-height: 1.5; transform: translateX(-50%); opacity: 0; pointer-events: none; transition: opacity .12s; }
.help:hover [role="tooltip"], .help:focus-within [role="tooltip"] { opacity: 1; }

.viewbar { display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: 10px; padding: 14px 16px 12px; }
.viewbar-title { display: flex; flex-wrap: wrap; align-items: baseline; gap: 4px 12px; min-width: 0; }
.viewbar-title h2 { margin: 0; color: var(--hs-text); font-size: 15px; font-weight: 600; }
.viewbar-title small { color: var(--hs-text-3); font-size: var(--hs-text-xs); }

.cell { display: grid; gap: 2px; min-width: 0; }
.cell strong { color: var(--hs-text); font-weight: 500; }
.cell small { color: var(--hs-text-3); font-size: var(--hs-text-xs); }
.hs-mono { font-family: var(--hs-font-mono); font-size: var(--hs-text-xs); }
.mono-date { color: var(--hs-text); font-family: var(--hs-font-mono); font-size: var(--hs-text-xs); font-weight: 500; white-space: nowrap; }
.amount { color: var(--hs-text); font-weight: 500; white-space: nowrap; }
.ld-link { display: inline-flex; align-items: center; gap: 4px; min-height: 0; padding: 0; color: var(--hs-accent); background: none; border: 0; font: inherit; font-size: var(--hs-text-xs); white-space: nowrap; cursor: pointer; }
.ld-link:hover { color: var(--hs-accent-hover); text-decoration: underline; text-underline-offset: 3px; }
.ld-link.back { font-size: var(--hs-text-sm); }

.notes { padding: 12px 16px; color: var(--hs-text-3); background: var(--hs-surface); border: 1px solid var(--hs-border); border-radius: 14px; font-size: var(--hs-text-xs); line-height: 1.7; }
.notes summary { color: var(--hs-text-2); font-size: var(--hs-text-sm); cursor: pointer; }
.notes p { margin: 6px 0 0; }

@media (max-width: 900px) { .stats { grid-template-columns: minmax(0, 1fr); } }
</style>
