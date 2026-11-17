<script setup lang="ts">
import DataTable from '../../../components/ui/DataTable.vue';
import { t } from '../../../lib/i18n';
import { formatMoney } from '../../../lib/money';
import type { DailyLine } from '../settlements';

defineProps<{ lines: DailyLine[]; currency: string }>();

const columns = [
  { key: 'businessDate', label: t('账务日期'), nowrap: true },
  { key: 'sourceCount', label: t('来源笔数'), align: 'right' as const },
  { key: 'originalAmount', label: t('原始金额'), align: 'right' as const },
  { key: 'finalAmount', label: t('应付金额'), align: 'right' as const },
];
</script>

<template>
  <div class="st-lines">
    <DataTable :columns="columns" :rows="lines" :row-key="(line) => line.businessDate" :label="t('日账汇总')">
      <template #cell-originalAmount="{ row }"><span class="st-num">{{ currency }} {{ row.originalAmount }}</span></template>
      <template #cell-finalAmount="{ row }"><strong class="st-num">{{ currency }} {{ formatMoney(row.finalAmount, currency) }}</strong></template>
    </DataTable>
  </div>
</template>

<style scoped>
.st-lines { border: 1px solid var(--hs-border); border-radius: 12px; overflow: hidden; }
.st-num { font-variant-numeric: tabular-nums; white-space: nowrap; }
strong.st-num { color: var(--hs-text); font-weight: 600; }
</style>
