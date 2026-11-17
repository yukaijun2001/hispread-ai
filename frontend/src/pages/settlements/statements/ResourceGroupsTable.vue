<script setup lang="ts">
import DataTable from '../../../components/ui/DataTable.vue';
import { divide100, formatDiscount, t } from '../../../lib/i18n';
import { formatMoney } from '../../../lib/money';
import type { ResourceGroup } from '../settlements';

const props = defineProps<{ groups: ResourceGroup[]; currency: string }>();

const columns = [
  { key: 'resource', label: t('资源编号 / 款项') },
  { key: 'basis', label: t('计价依据') },
  { key: 'finalAmount', label: t('应付金额'), align: 'right' as const },
];

const resourceName = (group: ResourceGroup) => (group.resourceName === '资源编号缺失' ? t('资源编号缺失') : group.resourceName || t('历史记录'));

function basis(price: ResourceGroup['prices'][number]) {
  const quote = price.quote;
  if (quote.pricingType === 'DIRECT') return t('直接录入真实结算金额');
  if (quote.pricingType === 'FIXED') return t('{0} 个 · 单价 {1} {2}', [price.quantity, props.currency, quote.unitPrice ?? '—']);
  if (quote.multiplier != null || quote.ratePercent != null) {
    return t('原额 {0} · {1}', [formatMoney(price.originalAmount, props.currency), formatDiscount(String(quote.multiplier ?? divide100(String(quote.ratePercent))))]);
  }
  return t('历史报价依据缺失');
}
// Groups carry no id; key each row object by identity.
const keys = new WeakMap<ResourceGroup, number>();
let nextKey = 0;
function rowKey(group: ResourceGroup) {
  if (!keys.has(group)) keys.set(group, ++nextKey);
  return keys.get(group)!;
}
</script>

<template>
  <div class="st-lines">
    <DataTable :columns="columns" :rows="groups" :row-key="rowKey" :label="t('按资源汇总的结算明细')">
      <template #cell-resource="{ row }">
        <div class="st-cell">
          <strong>{{ resourceName(row) }}</strong>
          <small>{{ row.periodStart }}{{ row.periodEnd === row.periodStart ? '' : ` — ${row.periodEnd}` }} · {{ t('{0} 笔来源', [row.sourceCount]) }}</small>
        </div>
      </template>
      <template #cell-basis="{ row }">
        <div class="st-cell">
          <div v-for="(price, index) in row.prices" :key="index" class="st-price">
            <span>{{ basis(price) }}</span>
            <small v-if="row.prices.length > 1 && price.quote.pricingType !== 'DIRECT'">{{ price.quote.effectiveFrom }} — {{ price.quote.effectiveTo }}</small>
          </div>
        </div>
      </template>
      <template #cell-finalAmount="{ row }"><strong class="st-num">{{ currency }} {{ formatMoney(row.finalAmount, currency) }}</strong></template>
    </DataTable>
  </div>
</template>

<style scoped>
.st-lines { border: 1px solid var(--hs-border); border-radius: 12px; overflow: hidden; }
.st-cell { display: grid; gap: 4px; min-width: 0; }
.st-cell strong { color: var(--hs-text); font-weight: 500; overflow-wrap: anywhere; }
.st-cell small { color: var(--hs-text-3); font-size: var(--hs-text-xs); }
.st-price { display: grid; gap: 1px; }
.st-num { color: var(--hs-text); font-weight: 600; font-variant-numeric: tabular-nums; white-space: nowrap; }
</style>
