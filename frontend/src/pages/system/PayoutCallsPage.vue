<script setup lang="ts">
import { computed, onBeforeUnmount, ref, watch } from 'vue';
import Notice from '../../components/ui/Notice.vue';
import SearchInput from '../../components/ui/SearchInput.vue';
import Select from '../../components/ui/Select.vue';
import IconButton from '../../components/ui/IconButton.vue';
import DataTable from '../../components/ui/DataTable.vue';
import Pagination from '../../components/ui/Pagination.vue';
import StatusBadge from '../../components/ui/StatusBadge.vue';
import { useApiData } from '../../composables/useApiData';
import { t } from '../../lib/i18n';
import { formatDateTime } from '../../lib/money';
import { useSessionStore } from '../../stores/session';

interface PayoutCall {
  id?: string;
  paymentCode?: string;
  supplierName?: string;
  provider?: string;
  state: string;
  updatedAt?: string;
}

defineProps<{ route: string }>();
const session = useSessionStore();
const draft = ref('');
const search = ref('');
const state = ref('');
const page = ref(1);
const size = ref(10);
let timer = 0;
watch(draft, (value) => {
  window.clearTimeout(timer);
  timer = window.setTimeout(() => { search.value = value.trim(); page.value = 1; }, 300);
});
onBeforeUnmount(() => window.clearTimeout(timer));
watch(state, () => { page.value = 1; });

const calls = useApiData<{ items: PayoutCall[]; total: number }>(() => {
  const query = new URLSearchParams({ search: search.value, state: state.value, page: String(page.value), size: String(size.value) });
  return `/payout-calls?${query}`;
});

const labels: Record<string, string> = {
  PROCESSING: t('付款处理中'), UNKNOWN: t('付款待核实'), SUCCEEDED: t('付款成功'), FAILED: t('付款失败'),
};
const options = computed(() => [
  { value: '', label: t('全部状态') },
  { value: 'PROCESSING', label: labels.PROCESSING },
  { value: 'UNKNOWN', label: labels.UNKNOWN },
  { value: 'SUCCEEDED', label: labels.SUCCEEDED },
  { value: 'FAILED', label: labels.FAILED },
]);
const columns = [
  { key: 'payment', label: t('付款单 / 供应商') },
  { key: 'provider', label: t('资金通道') },
  { key: 'state', label: t('付款状态') },
  { key: 'updatedAt', label: t('更新时间'), nowrap: true },
];
const rowKey = (row: PayoutCall) => row.id || `${row.paymentCode || ''}:${row.updatedAt || ''}:${row.state}`;
</script>

<template>
  <div class="calls">
    <Notice>{{ t('仅保留已有线上出款的历史记录。未确认款项请在付款详情查询原通道结果；新的付款使用线下登记。') }}</Notice>
    <section class="card">
      <div class="toolbar">
        <SearchInput v-model="draft" class="grow" :placeholder="t('搜索付款单、供应商或通道')" :label="t('搜索付款单、供应商或通道')" />
        <div class="filter"><Select v-model="state" :options="options" :label="t('付款状态')" :placeholder="t('全部状态')" /></div>
        <IconButton icon="refresh" :label="t('刷新付款状态')" @click="session.refresh()" />
      </div>
      <DataTable
        :columns="columns"
        :rows="calls.data.value?.items"
        :row-key="rowKey"
        :loading="calls.loading.value"
        :refreshing="calls.refreshing.value"
        :error="calls.error.value"
        :label="t('历史出款查询')"
        @retry="calls.reload()"
      >
        <template #cell-payment="{ row }">
          <div class="payment"><strong>{{ row.paymentCode }}</strong><small>{{ row.supplierName }}</small></div>
        </template>
        <template #cell-provider="{ row }"><strong>{{ row.provider }}</strong></template>
        <template #cell-state="{ row }"><StatusBadge :state="row.state" :label="labels[row.state] || row.state" /></template>
        <template #cell-updatedAt="{ row }"><span class="time">{{ formatDateTime(row.updatedAt) }}</span></template>
      </DataTable>
      <Pagination v-model:page="page" v-model:size="size" :total="calls.data.value?.total ?? 0" :loading="calls.loading.value" />
    </section>
  </div>
</template>

<style scoped>
.calls { display: grid; gap: 16px; }
.card { background: var(--hs-surface); border: 1px solid var(--hs-border); border-radius: var(--hs-radius-card); box-shadow: var(--hs-shadow-card); overflow: hidden; }
.toolbar { display: flex; flex-wrap: wrap; align-items: center; gap: 8px; padding: 14px 16px; }
.grow { flex: 1 1 240px; }
.filter { flex: 0 1 180px; min-width: 150px; }
.payment { display: grid; gap: 2px; min-width: 0; }
.payment strong, .card strong { color: var(--hs-text); font-weight: 500; }
.payment small { color: var(--hs-text-3); font-size: var(--hs-text-xs); }
.time { color: var(--hs-text-3); font-family: var(--hs-font-mono); font-size: var(--hs-text-xs); font-variant-numeric: tabular-nums; }
</style>
