<script setup lang="ts">
// Counts of the suppliers, quotes and resources assigned to the current
// operator. No accounting amounts or credentials are read.
import { computed } from 'vue';
import Button from '../../components/ui/Button.vue';
import Notice from '../../components/ui/Notice.vue';
import Spinner from '../../components/ui/Spinner.vue';
import DataTable from '../../components/ui/DataTable.vue';
import type { Column } from '../../components/ui/types';
import { useApiData } from '../../composables/useApiData';
import { t } from '../../lib/i18n';
import { useSessionStore } from '../../stores/session';
import type { OperationsData } from './reports';

const session = useSessionStore();
const report = useApiData<OperationsData>('/reports/operations');
const data = computed(() => report.data.value);

const counts = computed(() => {
  const value = data.value;
  if (!value) return [];
  return [
    [t('归属供应商'), value.supplierCount],
    [t('报价总数'), value.quoteCount],
    [t('待审核报价'), value.pendingQuoteCount],
    [t('已通过报价'), value.approvedQuoteCount],
    [t('资源总数'), value.resourceCount],
  ] as Array<[string, number | undefined]>;
});

const projectColumns: Column[] = [
  { key: 'projectName', label: t('项目') },
  { key: 'quoteCount', label: t('报价数量'), align: 'right' },
  { key: 'resourceCount', label: t('资源数量'), align: 'right' },
];
const supplierColumns: Column[] = [
  { key: 'supplierName', label: t('供应商') },
  { key: 'quoteCount', label: t('报价数量'), align: 'right' },
  { key: 'resourceCount', label: t('资源数量'), align: 'right' },
];
</script>

<template>
  <div class="op-report">
    <section class="op-card op-intro">
      <div class="op-head">
        <h2>{{ t('运营报表') }}</h2>
        <Button icon="refresh" @click="session.refresh()">{{ t('刷新') }}</Button>
      </div>
      <p>{{ t('仅统计归属给你的供应商、报价和资源数量；不包含账务金额、消耗金额或资源凭据。') }}</p>
    </section>

    <Notice v-if="report.error.value" tone="danger">{{ report.error.value }}</Notice>
    <div v-if="report.loading.value && !data" class="op-state"><Spinner :size="16" /></div>

    <template v-if="data">
      <div class="op-counts">
        <article v-for="[label, count] in counts" :key="label" class="op-card op-count">
          <strong class="op-count-label">{{ label }}</strong>
          <strong class="op-count-value">{{ String(count ?? 0) }}</strong>
        </article>
      </div>

      <section class="op-card">
        <div class="op-head"><h2>{{ t('按项目统计') }}</h2></div>
        <DataTable :columns="projectColumns" :rows="data.projects || []" :row-key="(row) => row.projectId ?? row.projectName" :label="t('按项目统计')" />
      </section>

      <section class="op-card">
        <div class="op-head"><h2>{{ t('按归属供应商统计') }}</h2></div>
        <DataTable :columns="supplierColumns" :rows="data.suppliers || []" :row-key="(row) => row.supplierId ?? row.supplierName" :label="t('按归属供应商统计')" />
      </section>
    </template>
  </div>
</template>

<style scoped>
.op-report { display: grid; gap: 16px; }
.op-card { background: var(--hs-surface); border: 1px solid var(--hs-border); border-radius: var(--hs-radius-card); box-shadow: var(--hs-shadow-card); overflow: hidden; }
.op-head { display: flex; align-items: center; justify-content: space-between; gap: 12px; padding: 16px 20px 12px; }
.op-head h2 { margin: 0; color: var(--hs-text); font-size: var(--hs-text-md); font-weight: 600; }
.op-intro p { margin: 0; padding: 0 20px 18px; color: var(--hs-text-3); font-size: var(--hs-text-sm); }
.op-state { display: grid; place-items: center; padding: 48px; color: var(--hs-text-3); }
.op-counts { display: grid; grid-template-columns: repeat(auto-fill, minmax(180px, 1fr)); gap: 12px; }
.op-count { display: grid; gap: 10px; padding: 18px 20px; }
.op-count-label { color: var(--hs-text-3); font-size: var(--hs-text-xs); font-weight: 500; }
.op-count-value { color: var(--hs-text); font-size: 28px; font-weight: 600; line-height: 1.1; font-variant-numeric: tabular-nums; }
</style>
