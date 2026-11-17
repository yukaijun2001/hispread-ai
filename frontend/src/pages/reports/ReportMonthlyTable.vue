<script setup lang="ts">
// Monthly payables. Rows are clickable only when `onRow` is given; the
// standalone (non-compact) table explains which settlements each column counts.
import DataTable from '../../components/ui/DataTable.vue';
import Notice from '../../components/ui/Notice.vue';
import type { Column } from '../../components/ui/types';
import { t } from '../../lib/i18n';
import ReportMoney from './ReportMoney.vue';
import type { MonthlyRow } from './reports';

defineProps<{ rows: MonthlyRow[]; compact?: boolean; onRow?: (row: MonthlyRow) => void }>();

const columns: Column[] = [
  { key: 'month', label: t('月份'), nowrap: true },
  { key: 'currency', label: t('币种') },
  { key: 'originalAmount', label: t('原始金额'), align: 'right' },
  { key: 'finalPayable', label: t('最终应付'), align: 'right' },
  { key: 'confirmedPayable', label: t('已确认应付'), align: 'right' },
  { key: 'paidAmount', label: t('已付款'), align: 'right' },
  { key: 'outstandingAmount', label: t('待付款'), align: 'right' },
  { key: 'settlementCount', label: t('结算单'), align: 'right' },
  { key: 'supplierCount', label: t('供应商'), align: 'right' },
];
const money = ['originalAmount', 'finalPayable', 'confirmedPayable', 'paidAmount', 'outstandingAmount'] as const;
</script>

<template>
  <div class="rp-table-block">
    <Notice v-if="!compact" class="rp-table-note">{{ t('原始金额和最终应付包含待确认及已确认结算；已确认应付、已付款和待付款只按供应商已确认结算统计。') }}</Notice>
    <DataTable
      :columns="columns"
      :rows="rows"
      :row-key="(row) => `${row.month}:${row.currency}`"
      :label="t('每月应付')"
      :onRowClick="onRow"
    >
      <template v-for="key in money" :key="key" #[`cell-${key}`]="{ row }">
        <ReportMoney :value="row[key]" :currency="row.currency" />
      </template>
    </DataTable>
  </div>
</template>

<style scoped>
.rp-table-note { margin: 16px 20px; }
.rp-table-block :deep(td) { font-variant-numeric: tabular-nums; }
</style>
