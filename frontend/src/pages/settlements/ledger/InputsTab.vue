<script setup lang="ts">
// Settlement inputs (settlements?tab=inputs, platform with usage.read): every
// payable source amount and whether it has been settled.
import { ref, watch } from 'vue';
import IconButton from '../../../components/ui/IconButton.vue';
import SearchInput from '../../../components/ui/SearchInput.vue';
import Select from '../../../components/ui/Select.vue';
import DataTable from '../../../components/ui/DataTable.vue';
import Pagination from '../../../components/ui/Pagination.vue';
import StatusBadge from '../../../components/ui/StatusBadge.vue';
import InputDetailDrawer from './InputDetailDrawer.vue';
import { useApiData } from '../../../composables/useApiData';
import { t } from '../../../lib/i18n';
import { formatMoney } from '../../../lib/money';
import { useSessionStore } from '../../../stores/session';
import { debounceSearch, INPUT_SOURCE_LABELS, type Page } from './ledger';
import type { SettlementInput } from './inputs';

const session = useSessionStore();
const searchDraft = ref('');
const search = ref('');
const state = ref('');
const page = ref(1);
const size = ref(10);
const selected = ref<SettlementInput | null>(null);
debounceSearch(searchDraft, search, () => { page.value = 1; });
watch(state, () => { page.value = 1; });

const list = useApiData<Page<SettlementInput>>(() => `/settlement-inputs?search=${encodeURIComponent(search.value)}&state=${state.value}&page=${page.value}&size=${size.value}`);

const stateOptions = [
  { value: '', label: t('全部状态') },
  { value: 'AVAILABLE', label: t('待结算') },
  { value: 'ALLOCATED', label: t('已纳入结算') },
  { value: 'VOID', label: t('已作废') },
];
const sourceLabels = INPUT_SOURCE_LABELS();
const columns = [
  { key: 'party', label: t('供应商 / 项目') },
  { key: 'sourceRef', label: t('来源单号') },
  { key: 'source', label: t('来源') },
  { key: 'period', label: t('所属期间'), nowrap: true },
  { key: 'original', label: t('消耗 / 原始金额'), align: 'right' as const },
  { key: 'final', label: t('应付金额'), align: 'right' as const },
  { key: 'state', label: t('状态') },
  { key: 'actions', label: t('操作') },
];
</script>

<template>
  <div class="inputs">
    <section class="ld-card">
      <div class="toolbar">
        <SearchInput v-model="searchDraft" class="grow" :placeholder="t('搜索来源单号、供应商或项目')" :label="t('搜索来源单号、供应商或项目')" />
        <div class="state-filter">
          <Select v-model="state" :options="stateOptions" :label="t('原始金额状态')" :placeholder="t('全部状态')" />
        </div>
        <IconButton icon="refresh" :label="t('刷新原始金额')" @click="session.refresh()" />
      </div>
      <DataTable :columns="columns" :rows="list.data.value?.items" :row-key="(row: SettlementInput) => row.id" :loading="list.loading.value"
        :refreshing="list.refreshing.value" :error="list.error.value" :label="t('金额记录')" @retry="list.reload()" @row-click="selected = $event">
        <template #cell-party="{ row }">
          <div class="cell"><strong>{{ row.supplierName }}</strong><small>{{ row.projectName }}</small></div>
        </template>
        <template #cell-sourceRef="{ row }"><span class="hs-mono">{{ row.sourceRef }}</span></template>
        <template #cell-source="{ row }">{{ sourceLabels[row.sourceKind || 'EXTERNAL'] }}</template>
        <template #cell-period="{ row }">
          <div class="cell hs-mono"><span>{{ row.periodStart }}</span><small>{{ t('至') }} {{ row.periodEnd }}</small></div>
        </template>
        <template #cell-original="{ row }"><span class="hs-money">{{ row.currency }} {{ formatMoney(row.originalAmount, row.currency) }}</span></template>
        <template #cell-final="{ row }"><strong class="hs-money strong">{{ row.currency }} {{ formatMoney(row.finalAmount, row.currency) }}</strong></template>
        <template #cell-state="{ row }"><StatusBadge :state="row.state" /></template>
        <template #cell-actions="{ row }">
          <button type="button" class="ld-link" @click.stop="selected = row">{{ t('查看依据') }}</button>
        </template>
      </DataTable>
      <Pagination v-model:page="page" v-model:size="size" :total="list.data.value?.total ?? 0" :loading="list.loading.value" />
    </section>
    <InputDetailDrawer v-if="selected" :input="selected" @close="selected = null" />
  </div>
</template>

<style scoped>
.ld-card { background: var(--hs-surface); border: 1px solid var(--hs-border); border-radius: var(--hs-radius-card); box-shadow: var(--hs-shadow-card); overflow: hidden; }
.toolbar { display: flex; flex-wrap: wrap; align-items: center; gap: 8px; padding: 14px 16px; }
.grow { flex: 1 1 260px; }
.state-filter { flex: 0 1 170px; min-width: 140px; margin-left: auto; }
.cell { display: grid; gap: 2px; min-width: 0; }
.cell strong { color: var(--hs-text); font-weight: 500; }
.cell small { color: var(--hs-text-3); font-size: var(--hs-text-xs); }
.hs-mono { font-family: var(--hs-font-mono); font-size: var(--hs-text-xs); overflow-wrap: anywhere; }
.hs-money { font-variant-numeric: tabular-nums; white-space: nowrap; }
.strong { color: var(--hs-text); font-weight: 500; }
.ld-link { min-height: 0; padding: 0; color: var(--hs-accent); background: none; border: 0; font: inherit; font-size: var(--hs-text-xs); white-space: nowrap; cursor: pointer; }
.ld-link:hover { color: var(--hs-accent-hover); text-decoration: underline; text-underline-offset: 3px; }
</style>
