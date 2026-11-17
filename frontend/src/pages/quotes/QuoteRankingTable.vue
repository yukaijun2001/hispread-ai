<script setup lang="ts">
// Supplier ranking for one project on one date. Each project keeps its own
// sort; price sorts ascending by default, capacity columns descending.
import { computed, ref } from 'vue';
import UsdPreview from './UsdPreview.vue';
import EmptyState from '../../components/ui/EmptyState.vue';
import Spinner from '../../components/ui/Spinner.vue';
import { useApiData } from '../../composables/useApiData';
import { getLocale, t, times100 } from '../../lib/i18n';
import { capacityLabel, unitLabel } from '../../lib/labels';
import { formatMoney, type ExchangeRate } from '../../lib/money';
import type { Project } from '../../lib/projects';
import { quoteMultiplier, type Quote } from './quotes';

type SortKey = 'PRICE' | 'ACCOUNT_COUNT' | 'ACCOUNT_QUOTA' | 'RPM' | 'TPM';
interface RankingRow extends Quote { rank: number | null }

const props = defineProps<{ project: Project; currency: string; onDate: string; rates: ExchangeRate[]; ratesLoading: boolean; ratesError: string }>();
const emit = defineEmits<{ open: [row: RankingRow] }>();

const sortBy = ref<SortKey>('PRICE');
const direction = ref<'ASC' | 'DESC'>('ASC');
const ranking = useApiData<RankingRow[]>(() => `/quotes/ranking?${new URLSearchParams({
  projectId: props.project.id, currency: props.currency, onDate: props.onDate, sortBy: sortBy.value, sortDirection: direction.value,
})}`);

function sort(key: SortKey) {
  if (key === sortBy.value) direction.value = direction.value === 'ASC' ? 'DESC' : 'ASC';
  else { sortBy.value = key; direction.value = key === 'PRICE' ? 'ASC' : 'DESC'; }
}

const capacityColumns = computed<Array<{ key: SortKey; label: string; value: (row: RankingRow) => string }>>(() => {
  const type = props.project.capacityType;
  if (type === 'ACCOUNT_COUNT') return [{ key: 'ACCOUNT_COUNT', label: t('账号数'), value: (row) => row.accountCount || t('未填写') }];
  if (type === 'ACCOUNT_QUOTA') return [{ key: 'ACCOUNT_QUOTA', label: capacityLabel(props.project), value: (row) => (row.accountQuota ? `${row.accountQuota} ${row.capacityCurrency ?? ''}` : t('未填写')) }];
  if (type === 'THROUGHPUT') return [
    { key: 'RPM', label: 'RPM', value: (row) => row.rpm || t('未填写') },
    { key: 'TPM', label: 'TPM', value: (row) => row.tpm || t('未填写') },
  ];
  return [];
});
const ariaSort = (key: SortKey) => (sortBy.value === key ? (direction.value === 'ASC' ? 'ascending' : 'descending') : 'none');
const arrow = (key: SortKey) => (sortBy.value === key ? (direction.value === 'ASC' ? ' ↑' : ' ↓') : '');
const discountUnit = getLocale() === 'zh-CN' ? '折' : '%';
</script>

<template>
  <div class="ranking">
    <p class="sort-now">{{ t('当前：') }}{{ sortBy === 'PRICE' ? t('价格优先') : t('{0} 优先', [sortBy]) }}</p>
    <div class="wrap">
      <table>
        <thead>
          <tr>
            <th>{{ t('名次') }}</th>
            <th>{{ t('供应商') }}</th>
            <th :aria-sort="ariaSort('PRICE')"><button type="button" :class="{ active: sortBy === 'PRICE' }" @click="sort('PRICE')">{{ t('报价') }}{{ arrow('PRICE') }}</button></th>
            <th v-for="column in capacityColumns" :key="column.key" :aria-sort="ariaSort(column.key)">
              <button type="button" :class="{ active: sortBy === column.key }" @click="sort(column.key)">{{ column.label }}{{ arrow(column.key) }}</button>
            </th>
            <th>{{ t('能力说明') }}</th>
            <th>{{ t('适用期间') }}</th>
            <th>{{ t('操作') }}</th>
          </tr>
        </thead>
        <tbody v-if="ranking.data.value?.length">
          <tr v-for="row in ranking.data.value" :key="row.id">
            <td><strong>{{ row.rank == null ? '—' : `#${row.rank}` }}</strong></td>
            <td><strong>{{ row.supplierName }}</strong></td>
            <td>
              <template v-if="row.pricingType !== 'DISCOUNT'">{{ row.currency }} {{ formatMoney(row.unitPrice, row.currency) }} / {{ unitLabel(row.unit) }}</template>
              <div v-else class="price">
                <strong>{{ times100(quoteMultiplier(row)) }}{{ discountUnit }}</strong>
                <UsdPreview :value="quoteMultiplier(row)" :currency="row.currency" :rates="rates" :loading="ratesLoading" :error="ratesError" />
              </div>
            </td>
            <td v-for="column in capacityColumns" :key="column.key">{{ column.value(row) }}</td>
            <td class="note">{{ row.serviceCapacityNote?.trim() || '—' }}</td>
            <td class="nowrap">{{ t('{0} 至 {1}', [row.effectiveFrom, row.effectiveTo]) }}</td>
            <td><button type="button" class="link" @click="emit('open', row)">{{ t('查看') }}</button></td>
          </tr>
        </tbody>
      </table>
      <div v-if="ranking.loading.value && !ranking.data.value" class="state"><Spinner :size="16" /></div>
      <EmptyState v-else-if="ranking.error.value" error :text="ranking.error.value" compact />
      <EmptyState v-else-if="!ranking.data.value?.length" :text="t('该日期暂无有效报价')" compact />
    </div>
  </div>
</template>

<style scoped>
.ranking { display: grid; gap: 6px; }
.sort-now { margin: 0; color: var(--hs-text-3); font-size: var(--hs-text-xs); }
.wrap { overflow-x: auto; border: 1px solid var(--hs-border); border-radius: 12px; }
table { width: 100%; border-collapse: collapse; font-size: var(--hs-text-sm); }
th, td { height: auto; padding: 10px 14px; text-align: left; vertical-align: top; }
thead { background: var(--hs-surface-subtle); }
th { color: var(--hs-text-3); border-bottom: 1px solid var(--hs-divider); font-size: var(--hs-text-xs); font-weight: 500; white-space: nowrap; }
td { color: var(--hs-text-2); border-bottom: 1px solid var(--hs-divider); }
tbody tr:last-child td { border-bottom: 0; }
td strong { color: var(--hs-text); font-weight: 500; }
th button { min-height: 0; padding: 0; color: inherit; background: none; border: 0; font: inherit; cursor: pointer; }
th button.active { color: var(--hs-text); font-weight: 600; }
.price { display: grid; gap: 2px; }
.note { max-width: 260px; overflow-wrap: anywhere; }
.nowrap { white-space: nowrap; font-variant-numeric: tabular-nums; }
.link { min-height: 0; padding: 0; color: var(--hs-accent); background: none; border: 0; font: inherit; font-size: var(--hs-text-xs); cursor: pointer; }
.link:hover { text-decoration: underline; text-underline-offset: 3px; }
.state { display: grid; place-items: center; padding: 20px; color: var(--hs-text-3); }
</style>
