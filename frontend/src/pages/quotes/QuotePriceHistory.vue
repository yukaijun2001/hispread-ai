<script setup lang="ts">
import { computed } from 'vue';
import DataTable from '../../components/ui/DataTable.vue';
import { formatDiscount, getLocale, t } from '../../lib/i18n';
import { unitLabel } from '../../lib/labels';
import { beijingDate, percentToRatio } from '../../lib/money';
import { beijingDay, sortPriceHistory, type PriceVersion, type Quote } from './quotes';

const props = defineProps<{ quote: Quote; history: PriceVersion[] }>();

const rows = computed(() => sortPriceHistory(props.history));
const now = Date.now();
const time = (entry: PriceVersion) => new Date(entry.effectiveAt).getTime();
// A version is superseded when a later entry takes effect at the same instant.
const superseded = computed(() => new Set(rows.value.filter((entry, index) => rows.value.slice(index + 1).some((later) => time(later) === time(entry))).map((entry) => entry.id)));
const currentIndex = computed(() => rows.value.reduce((found, entry, index) => (time(entry) <= now ? index : found), -1));
const expired = computed(() => props.quote.effectiveTo < beijingDate());

function price(entry: PriceVersion) {
  if (props.quote.pricingType === 'FIXED') return `${props.quote.currency} ${entry.unitPrice ?? '—'} / ${unitLabel(props.quote.unit)}`;
  return formatDiscount(String(entry.multiplier ?? percentToRatio(String(entry.ratePercent))));
}
function status(entry: PriceVersion) {
  if (superseded.value.has(entry.id)) return t('已替代价格');
  const future = time(entry) > now;
  return t(expired.value || (!future && rows.value.indexOf(entry) !== currentIndex.value) ? '历史价格' : future ? '未来价格' : '当前价格');
}
const columns = [{ key: 'price', label: t('价格') }, { key: 'date', label: t('生效日期') }, { key: 'status', label: t('状态') }];
</script>

<template>
  <section class="history">
    <h3>{{ t('价格版本') }}</h3>
    <p>{{ t('按北京时间的日期生效；历史价格和已形成的费用快照保留。') }}</p>
    <div class="table">
      <DataTable :columns="columns" :rows="rows" :row-key="(entry) => entry.id" :label="t('价格版本')">
        <template #cell-price="{ row }">{{ price(row) }}</template>
        <template #cell-date="{ row }">{{ beijingDay(row.effectiveAt, getLocale()) }}</template>
        <template #cell-status="{ row }">{{ status(row) }}</template>
      </DataTable>
    </div>
  </section>
</template>

<style scoped>
.history { display: grid; gap: 6px; }
.history h3 { margin: 0; font-size: var(--hs-text-sm); font-weight: 600; }
.history p { margin: 0 0 4px; color: var(--hs-text-3); font-size: var(--hs-text-xs); }
.table { border: 1px solid var(--hs-border); border-radius: 12px; overflow: hidden; }
</style>
