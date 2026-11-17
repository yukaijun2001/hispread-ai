<script setup lang="ts">
// Business overview: one summary card per currency, the monthly trend and the
// top ten suppliers by outstanding amount (clickable for the settlement list).
import { t } from '../../lib/i18n';
import { formatMoney } from '../../lib/money';
import ReportMonthlyTable from './ReportMonthlyTable.vue';
import ReportReceivablesTable from './ReportReceivablesTable.vue';
import type { OverviewData, ReceivableRow } from './reports';

defineProps<{ data: OverviewData }>();
const emit = defineEmits<{ supplier: [row: ReceivableRow] }>();
</script>

<template>
  <div class="rp-overview">
    <div v-if="data.summary.length" class="rp-summary-grid">
      <article v-for="entry in data.summary" :key="entry.currency" class="rp-summary-card">
        <header>
          <strong>{{ entry.currency }}</strong>
          <span>{{ entry.supplierCount }}{{ t(' 家供应商') }}</span>
        </header>
        <dl>
          <div><dt>{{ t('已确认应付') }}</dt><dd>{{ formatMoney(entry.confirmedPayable, entry.currency) }}</dd></div>
          <div><dt>{{ t('已付款') }}</dt><dd>{{ formatMoney(entry.paidAmount, entry.currency) }}</dd></div>
          <div class="emphasis"><dt>{{ t('待付款') }}</dt><dd>{{ formatMoney(entry.outstandingAmount, entry.currency) }}</dd></div>
          <div><dt>{{ t('已确认到账') }}</dt><dd>{{ formatMoney(entry.receivedAmount, entry.currency) }}</dd></div>
        </dl>
        <footer>
          {{ entry.settlementCount }}{{ t(' 张结算单 ') }}{{ entry.disputedCount ? t(' · {0} 笔到账争议', [entry.disputedCount]) : '' }}
        </footer>
      </article>
    </div>

    <section class="rp-section">
      <div class="rp-section-head">
        <h2>{{ t('月度应付趋势') }}</h2>
        <span>{{ t('按结算周期结束月份归属') }}</span>
      </div>
      <ReportMonthlyTable :rows="data.monthly" compact />
    </section>

    <section class="rp-section">
      <div class="rp-section-head">
        <h2>{{ t('供应商应收排行') }}</h2>
        <span>{{ t('按待付款金额排序') }}</span>
      </div>
      <ReportReceivablesTable :rows="data.suppliers.slice(0, 10)" compact :on-row="(row) => emit('supplier', row)" />
    </section>
  </div>
</template>

<style scoped>
.rp-overview { display: grid; gap: 16px; }
.rp-summary-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(260px, 1fr)); gap: 12px; }
.rp-summary-card {
  display: grid; gap: 14px; padding: 18px 20px; background: var(--hs-surface); border: 1px solid var(--hs-border);
  border-radius: var(--hs-radius-card); box-shadow: var(--hs-shadow-card);
}
.rp-summary-card header { display: flex; align-items: baseline; justify-content: space-between; gap: 8px; }
.rp-summary-card header strong { color: var(--hs-text); font-size: var(--hs-text-lg); font-weight: 600; }
.rp-summary-card header span, .rp-summary-card footer { color: var(--hs-text-3); font-size: var(--hs-text-xs); }
.rp-summary-card dl { display: grid; grid-template-columns: 1fr 1fr; gap: 12px 16px; margin: 0; }
.rp-summary-card dt { color: var(--hs-text-3); font-size: var(--hs-text-xs); }
.rp-summary-card dd { margin: 4px 0 0; color: var(--hs-text); font-size: var(--hs-text-md); font-weight: 500; font-variant-numeric: tabular-nums; }
.rp-summary-card .emphasis dd { color: var(--hs-accent); font-weight: 600; }
.rp-section { background: var(--hs-surface); border: 1px solid var(--hs-border); border-radius: var(--hs-radius-card); box-shadow: var(--hs-shadow-card); overflow: hidden; }
.rp-section-head { display: flex; flex-wrap: wrap; align-items: baseline; gap: 4px 12px; padding: 16px 20px 12px; }
.rp-section-head h2 { margin: 0; color: var(--hs-text); font-size: var(--hs-text-md); font-weight: 600; }
.rp-section-head span { color: var(--hs-text-3); font-size: var(--hs-text-xs); }
</style>
