<script setup lang="ts">
// Bill entries for one creator / resource type / currency. Starts from the
// tab's filter (narrowed to the row's day when grouped by date) and has its own
// filters. Agents never see receivable amounts.
import { computed, ref } from 'vue';
import Dialog from '../../../components/ui/Dialog.vue';
import Button from '../../../components/ui/Button.vue';
import Select from '../../../components/ui/Select.vue';
import SearchInput from '../../../components/ui/SearchInput.vue';
import DateRangePicker from '../../../components/ui/DateRangePicker.vue';
import DataTable from '../../../components/ui/DataTable.vue';
import Pagination from '../../../components/ui/Pagination.vue';
import MoneyDisplay from './MoneyDisplay.vue';
import { useApiData } from '../../../composables/useApiData';
import { t, translateServerMessage } from '../../../lib/i18n';
import { beijingDate } from '../../../lib/money';
import { debounceSearch } from './ledger';
import type { BillFilters, BillPage, CreatorRow, EntryRow } from './bills';

const props = defineProps<{ creator: CreatorRow; memberView: boolean; options: BillFilters | null; filter: string }>();
const emit = defineEmits<{ close: [] }>();

const base = new URLSearchParams(props.filter);
if (props.creator.businessDate) { base.set('from', props.creator.businessDate); base.set('to', props.creator.businessDate); }
const initial = { from: base.get('from') ?? beijingDate(), to: base.get('to') ?? beijingDate(), project: base.get('project') ?? '', search: base.get('search') ?? '' };

const page = ref(1);
const size = ref(10);
const from = ref(initial.from);
const to = ref(initial.to);
const project = ref(initial.project);
const searchDraft = ref(initial.search);
const search = ref(initial.search);
const modelDraft = ref('');
const model = ref('');
const reviewStatus = ref('');
debounceSearch(searchDraft, search, () => { page.value = 1; });
debounceSearch(modelDraft, model, () => { page.value = 1; });

const entries = useApiData<BillPage<EntryRow>>(() => {
  const query = new URLSearchParams(props.filter);
  Object.entries({
    from: from.value, to: to.value, project: project.value, search: search.value, model: model.value, reviewStatus: reviewStatus.value,
    resourceType: props.creator.resourceType ?? '', creatorId: props.creator.creatorId, currency: props.creator.currency,
    page: String(page.value), size: String(size.value),
  }).forEach(([key, value]) => query.set(key, value));
  return `/supplier-bills/entries?${query}`;
});

function reset() {
  from.value = initial.from; to.value = initial.to; project.value = initial.project;
  searchDraft.value = initial.search; search.value = initial.search; modelDraft.value = ''; model.value = ''; reviewStatus.value = ''; page.value = 1;
}

const projectOptions = computed(() => [{ value: '', label: t('全部项目') }, ...(props.options?.projects ?? [])]);
const reviewOptions = [{ value: '', label: t('全部入账状态') }, { value: 'PENDING', label: t('待计价') }, { value: 'CONFIRMED', label: t('已入账') }];
const sourceNames: Record<string, string> = { MANUAL: t('手工款'), EXTERNAL: t('外部金额'), RESOURCE: t('历史资源'), CCMAX: t('历史资源') };
const columns = computed(() => [
  { key: 'businessDate', label: t('日期'), nowrap: true },
  { key: 'resourceTypeName', label: t('资源类型') },
  { key: 'resource', label: t('资源 / 项目') },
  { key: 'modelKey', label: t('模型') },
  { key: 'consumption', label: t('消耗'), align: 'right' as const },
  ...(props.memberView ? [] : [{ key: 'payable', label: t('应收'), align: 'right' as const }, { key: 'review', label: t('入账状态') }]),
]);
const isToday = (date: string) => date === beijingDate();
let rowSequence = 0;
const rowKeys = new WeakMap<EntryRow, number>();
const rowKey = (row: EntryRow) => { if (!rowKeys.has(row)) rowKeys.set(row, ++rowSequence); return rowKeys.get(row)!; };
</script>

<template>
  <Dialog size="xl" :title="t('{0} · 账单明细 · {1}', [creator.creatorName, creator.currency])" @close="emit('close')">
    <div class="body">
      <div class="filters">
        <div class="f-item date">
          <span>{{ t('账务日期') }}</span>
          <DateRangePicker :from="from" :to="to" :label="t('明细账务日期')" @change="(a, b) => { from = a; to = b; page = 1; }" />
        </div>
        <div class="f-item">
          <span>{{ t('项目') }}</span>
          <Select :model-value="project" :options="projectOptions" :label="t('明细项目')" searchable @update:model-value="project = String($event); page = 1" />
        </div>
        <label class="f-item">
          <span>{{ t('资源关键词') }}</span>
          <SearchInput v-model="searchDraft" :placeholder="t('搜索资源名称')" :label="t('资源关键词')" />
        </label>
        <label class="f-item">
          <span>{{ t('模型') }}</span>
          <SearchInput v-model="modelDraft" :placeholder="t('搜索模型')" :label="t('模型')" />
        </label>
        <div v-if="!memberView" class="f-item">
          <span>{{ t('入账状态') }}</span>
          <Select :model-value="reviewStatus" :options="reviewOptions" :label="t('明细入账状态')" @update:model-value="reviewStatus = String($event); page = 1" />
        </div>
        <div class="f-actions"><Button @click="reset">{{ t('重置') }}</Button></div>
      </div>
      <div class="table">
        <DataTable :columns="columns" :rows="entries.data.value?.items" :row-key="rowKey" :loading="entries.loading.value"
          :refreshing="entries.refreshing.value" :error="entries.error.value" :label="t('账单明细')" @retry="entries.reload()">
          <template #cell-businessDate="{ row }"><span class="hs-mono">{{ row.businessDate }}</span></template>
          <template #cell-resourceTypeName="{ row }">{{ translateServerMessage(row.resourceTypeName) }}</template>
          <template #cell-resource="{ row }">
            <div class="cell"><strong>{{ row.resourceName || sourceNames[row.sourceKind] }}</strong><small>{{ row.projectName }}</small></div>
          </template>
          <template #cell-modelKey="{ row }">{{ row.modelKey || '—' }}</template>
          <template #cell-consumption="{ row }"><MoneyDisplay :currency="row.currency" :value="row.consumption" /></template>
          <template #cell-payable="{ row }">
            <template v-if="isToday(row.businessDate) && row.pending">{{ t('次日入账') }}</template>
            <template v-else-if="row.payable == null">{{ t('待计价') }}</template>
            <MoneyDisplay v-else :currency="row.currency" :value="row.payable" />
          </template>
          <template #cell-review="{ row }">{{ row.pending ? (isToday(row.businessDate) ? t('次日入账') : t('待计价')) : t('已入账') }}</template>
        </DataTable>
        <Pagination v-model:page="page" v-model:size="size" :total="entries.data.value?.total ?? 0" :loading="entries.loading.value" />
      </div>
    </div>
  </Dialog>
</template>

<style scoped>
.body { display: grid; gap: 14px; }
.filters { display: flex; flex-wrap: wrap; align-items: flex-end; gap: 10px; }
.f-item { display: grid; gap: 4px; flex: 0 1 170px; min-width: 140px; }
.f-item > span { color: var(--hs-text-3); font-size: var(--hs-text-xs); }
.f-item.date { flex: 0 1 230px; min-width: 210px; }
.f-actions { margin-left: auto; }
.table { border: 1px solid var(--hs-border); border-radius: 12px; overflow: hidden; }
.cell { display: grid; gap: 2px; min-width: 0; }
.cell strong { color: var(--hs-text); font-weight: 500; }
.cell small { color: var(--hs-text-3); font-size: var(--hs-text-xs); }
.hs-mono { font-family: var(--hs-font-mono); font-size: var(--hs-text-xs); white-space: nowrap; }
</style>
