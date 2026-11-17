<script setup lang="ts">
// Supplier receivables. Rows are clickable only when `onRow` is given.
import DataTable from '../../components/ui/DataTable.vue';
import Notice from '../../components/ui/Notice.vue';
import type { Column } from '../../components/ui/types';
import { t } from '../../lib/i18n';
import ReportMoney from './ReportMoney.vue';
import type { ReceivableRow } from './reports';

defineProps<{ rows: ReceivableRow[]; compact?: boolean; onRow?: (row: ReceivableRow) => void }>();

const columns: Column[] = [
  { key: 'supplier', label: t('供应商') },
  { key: 'currency', label: t('币种') },
  { key: 'receivableAmount', label: t('应收'), align: 'right' },
  { key: 'paidAmount', label: t('已付款'), align: 'right' },
  { key: 'outstandingAmount', label: t('待付款'), align: 'right' },
  { key: 'receivedAmount', label: t('确认到账'), align: 'right' },
  { key: 'unconfirmedReceiptAmount', label: t('待确认到账'), align: 'right' },
  { key: 'unpaidCount', label: t('待付单'), align: 'right' },
  { key: 'disputedCount', label: t('到账争议'), align: 'right' },
  { key: 'earliestUnpaidDate', label: t('最早待付'), nowrap: true },
];
const money = ['receivableAmount', 'paidAmount', 'outstandingAmount', 'receivedAmount', 'unconfirmedReceiptAmount'] as const;
</script>

<template>
  <div class="rp-table-block">
    <Notice v-if="!compact" class="rp-table-note">{{ t('应收只统计供应商已确认的结算；平台付款成功与供应商确认到账分别统计。') }}</Notice>
    <DataTable
      :columns="columns"
      :rows="rows"
      :row-key="(row) => `${row.supplierId}:${row.currency}`"
      :label="t('供应商应收')"
      :onRowClick="onRow"
    >
      <template #cell-supplier="{ row }">
        <div class="rp-supplier">
          <strong>{{ row.supplierName }}</strong>
          <small>{{ row.supplierCode }}</small>
        </div>
      </template>
      <template v-for="key in money" :key="key" #[`cell-${key}`]="{ row }">
        <ReportMoney :value="row[key]" :currency="row.currency" />
      </template>
      <template #cell-disputedCount="{ row }">{{ row.disputedCount || '—' }}</template>
      <template #cell-earliestUnpaidDate="{ row }">{{ row.earliestUnpaidDate || '—' }}</template>
    </DataTable>
  </div>
</template>

<style scoped>
.rp-table-note { margin: 16px 20px; }
.rp-table-block :deep(td) { font-variant-numeric: tabular-nums; }
.rp-supplier { display: grid; gap: 2px; }
.rp-supplier strong { color: var(--hs-text); font-weight: 500; }
.rp-supplier small { color: var(--hs-text-3); font-size: var(--hs-text-xs); }
</style>
