<script setup lang="ts">
// 运营归属: assign responsible operators to suppliers, and the monthly KPI of
// confirmed settlements per operator with a drill-down to settlement lines.
import { computed, ref } from 'vue';
import PageHeader from '../../components/ui/PageHeader.vue';
import IconButton from '../../components/ui/IconButton.vue';
import Notice from '../../components/ui/Notice.vue';
import Tabs from '../../components/ui/Tabs.vue';
import SearchInput from '../../components/ui/SearchInput.vue';
import Select from '../../components/ui/Select.vue';
import TextInput from '../../components/ui/TextInput.vue';
import DataTable from '../../components/ui/DataTable.vue';
import Pagination from '../../components/ui/Pagination.vue';
import Dialog from '../../components/ui/Dialog.vue';
import OwnerSection from './OwnerSection.vue';
import { useApiData } from '../../composables/useApiData';
import { t } from '../../lib/i18n';
import { formatDateTime, formatMoney, localToday } from '../../lib/money';
import { useSessionStore } from '../../stores/session';
import type { Supplier, UserOption } from './supplierAdmin';

defineProps<{ route: string }>();

interface KpiRow { ownerUserId?: string | null; ownerName: string; currency: string; total: string; settlementCount: number }
interface KpiLine { id?: string; code: string; supplierName: string; confirmedAt: string; total: string; currency: string }

const session = useSessionStore();
const tab = ref<'owners' | 'report'>('owners');

// The month defaults to the browser's local month, as before.
const month = ref(localToday().slice(0, 7));
const ownerSearch = ref('');
const ownerFilter = ref('');
const ownersPage = ref(1);
const ownersSize = ref(10);
const currency = ref('');
const kpiOwner = ref('');
const reportPage = ref(1);
const reportSize = ref(10);
const lineSearch = ref('');
const linesPage = ref(1);
const linesSize = ref(10);
const drill = ref<KpiRow | null>(null);
const assigning = ref<Supplier | null>(null);

const candidates = useApiData<UserOption[]>('/suppliers/owner-candidates?includeHistory=true');
const owners = useApiData<{ items: Supplier[]; total: number }>(() => (tab.value === 'owners'
  ? `/suppliers?search=${encodeURIComponent(ownerSearch.value)}&owner=${encodeURIComponent(ownerFilter.value)}&page=${ownersPage.value}&size=${ownersSize.value}`
  : null));
const report = useApiData<{ items: KpiRow[]; total: number }>(() => (tab.value === 'report'
  ? `/reports/operator-kpi?month=${month.value}&currency=${currency.value}&owner=${encodeURIComponent(kpiOwner.value)}&page=${reportPage.value}&size=${reportSize.value}`
  : null));
const lines = useApiData<{ items: KpiLine[]; total: number }>(() => (drill.value
  ? `/reports/operator-kpi/lines?month=${month.value}&currency=${drill.value.currency}&ownerUserId=${drill.value.ownerUserId || ''}&unassigned=${drill.value.ownerUserId ? 'false' : 'true'}&search=${encodeURIComponent(lineSearch.value)}&page=${linesPage.value}&size=${linesSize.value}`
  : null));

const ownerOptions = (unassignedLabel: string) => [
  { value: '', label: t('全部归属') },
  { value: 'UNASSIGNED', label: unassignedLabel },
  ...(candidates.data.value ?? []).map((user) => ({ value: user.id, label: t('{0}（{1}）', [user.displayName, user.username]) })),
];
const assignmentOptions = computed(() => ownerOptions(t('待分配')));
const kpiOwnerOptions = computed(() => ownerOptions(t('未归属')));
const currencyOptions = [{ value: '', label: t('全部币种') }, { value: 'CNY', label: 'CNY' }, { value: 'USD', label: 'USD' }, { value: 'USDT', label: 'USDT' }];
const tabs = [{ id: 'owners' as const, label: t('负责运营') }, { id: 'report' as const, label: t('月度绩效') }];

const reportRows = computed(() => (report.data.value?.items ?? []).map((row, index) => ({ ...row, id: `${row.ownerUserId || 'none'}-${row.currency}-${index}` })));

function setOwnerSearch(value: string) { ownerSearch.value = value; ownersPage.value = 1; }
function setOwnerFilter(value: string) { ownerFilter.value = value; ownersPage.value = 1; }
function setReportFilter(apply: () => void) { apply(); reportPage.value = 1; drill.value = null; }
function openLines(row: KpiRow) { lineSearch.value = ''; linesPage.value = 1; drill.value = row; }
function setLineSearch(value: string) { lineSearch.value = value; linesPage.value = 1; }
function afterOwnerChange() { assigning.value = null; session.refresh(); }

const ownerColumns = [
  { key: 'name', label: t('供应商') },
  { key: 'ownerName', label: t('负责运营') },
  { key: 'actions', label: t('操作'), width: '96px' },
];
const reportColumns = [
  { key: 'ownerName', label: t('负责运营') },
  { key: 'currency', label: t('币种') },
  { key: 'total', label: t('已确认应付'), align: 'right' as const },
  { key: 'settlementCount', label: t('结算笔数'), align: 'right' as const },
];
const lineColumns = [
  { key: 'code', label: t('结算编号') },
  { key: 'supplierName', label: t('供应商') },
  { key: 'confirmedAt', label: t('确认时间') },
  { key: 'total', label: t('应付'), align: 'right' as const },
];
</script>

<template>
  <div class="kpi">
    <PageHeader :title="t('运营归属')" :description="t('按确认月份统计已确认结算。指定和改挂不改变已经结算的归属。')">
      <template #actions>
        <IconButton icon="refresh" :label="t('刷新归属')" bordered @click="session.refresh()" />
      </template>
    </PageHeader>

    <Tabs v-model="tab" :items="tabs" :label="t('运营归属')" class="kpi-tabs" />

    <section v-if="tab === 'owners'" class="card">
      <div class="toolbar">
        <SearchInput :model-value="ownerSearch" class="grow" :placeholder="t('搜索供应商名称、编码或联系人')" @update:model-value="setOwnerSearch" />
        <div class="f-select">
          <Select :model-value="ownerFilter" :options="assignmentOptions" :label="t('归属筛选')" :placeholder="t('全部归属')" icon="users" searchable
            @update:model-value="setOwnerFilter(String($event))" />
        </div>
      </div>
      <DataTable :columns="ownerColumns" :rows="owners.data.value?.items ?? []" :row-key="(row: Supplier) => row.id"
        :loading="owners.loading.value" :refreshing="owners.refreshing.value" :error="owners.error.value" :label="t('负责运营')" @retry="owners.reload()">
        <template #cell-name="{ row }">
          <div class="cell"><strong>{{ row.name }}</strong><small>{{ row.code }}</small></div>
        </template>
        <template #cell-ownerName="{ row }">
          <span :class="{ quiet: !row.ownerName }">{{ row.ownerName || t('待分配') }}</span>
        </template>
        <template #cell-actions="{ row }">
          <button type="button" class="action" @click.stop="assigning = row">{{ row.ownerName ? t('改挂') : t('指定') }}</button>
        </template>
      </DataTable>
      <Pagination v-model:page="ownersPage" v-model:size="ownersSize" :total="owners.data.value?.total ?? 0" :loading="owners.loading.value" />
    </section>

    <section v-else class="card">
      <div class="toolbar">
        <div class="month">
          <TextInput :model-value="month" type="month" :prefix="t('月份')" :aria-label="t('月份')" @update:model-value="setReportFilter(() => { month = $event; })" />
        </div>
        <div class="narrow">
          <Select :model-value="currency" :options="currencyOptions" :label="t('币种')" :placeholder="t('全部币种')" @update:model-value="setReportFilter(() => { currency = String($event); })" />
        </div>
        <div class="f-select">
          <Select :model-value="kpiOwner" :options="kpiOwnerOptions" :label="t('绩效负责人')" :placeholder="t('全部归属')" icon="users" searchable
            @update:model-value="setReportFilter(() => { kpiOwner = String($event); })" />
        </div>
      </div>
      <DataTable :columns="reportColumns" :rows="reportRows" :row-key="(row) => row.id"
        :loading="report.loading.value" :refreshing="report.refreshing.value" :error="report.error.value" :label="t('月度绩效')" @retry="report.reload()" @row-click="openLines">
        <template #cell-total="{ row }"><span class="num">{{ formatMoney(row.total, row.currency) }}</span></template>
        <template #cell-settlementCount="{ row }"><span class="num">{{ String(row.settlementCount) }}</span></template>
      </DataTable>
      <Pagination v-model:page="reportPage" v-model:size="reportSize" :total="report.data.value?.total ?? 0" :loading="report.loading.value" />
    </section>

    <Dialog v-if="assigning" size="lg" :title="assigning.name" :subtitle="assigning.code" @close="assigning = null">
      <OwnerSection
        embedded
        :supplier-id="assigning.id"
        :version="assigning.version"
        :owner-user-id="assigning.ownerUserId"
        :owner-name="assigning.ownerName"
        @close="assigning = null"
        @changed="afterOwnerChange"
      />
    </Dialog>

    <Dialog v-if="drill" size="lg" :title="`${drill.ownerName} · ${month} · ${drill.currency}`" @close="drill = null">
      <div class="lines">
        <SearchInput :model-value="lineSearch" :placeholder="t('搜索结算编号或供应商')" @update:model-value="setLineSearch" />
        <div class="bordered">
          <DataTable :columns="lineColumns" :rows="lines.data.value?.items ?? []" :row-key="(row: KpiLine) => row.id ?? row.code"
            :loading="lines.loading.value" :error="lines.error.value" :label="t('结算编号')" @retry="lines.reload()">
            <template #cell-confirmedAt="{ row }">{{ formatDateTime(row.confirmedAt) }}</template>
            <template #cell-total="{ row }"><span class="num">{{ formatMoney(row.total, row.currency) }}</span></template>
          </DataTable>
        </div>
        <Pagination v-model:page="linesPage" v-model:size="linesSize" :total="lines.data.value?.total ?? 0" :loading="lines.loading.value" />
      </div>
    </Dialog>
  </div>
</template>

<style scoped>
.kpi-tabs { margin-bottom: 14px; }
.card { background: var(--hs-surface); border: 1px solid var(--hs-border); border-radius: var(--hs-radius-card); box-shadow: var(--hs-shadow-card); overflow: hidden; }
.toolbar { display: flex; flex-wrap: wrap; align-items: center; gap: 8px; padding: 14px 16px; }
.grow { flex: 1 1 240px; }
.f-select { flex: 0 1 220px; min-width: 160px; }
.narrow { flex: 0 1 150px; min-width: 128px; }
.month { flex: 0 1 200px; min-width: 180px; }
.cell { display: grid; gap: 2px; }
.cell strong { color: var(--hs-text); font-weight: 500; }
.cell small, .quiet { color: var(--hs-text-3); font-size: var(--hs-text-xs); }
.num { font-variant-numeric: tabular-nums; }
.action { padding: 0; color: var(--hs-accent); background: none; border: 0; font: inherit; font-size: var(--hs-text-sm); cursor: pointer; }
.action:hover { text-decoration: underline; text-underline-offset: 3px; }
.lines { display: grid; gap: 12px; }
.bordered { border: 1px solid var(--hs-border); border-radius: 12px; overflow: hidden; }
</style>
