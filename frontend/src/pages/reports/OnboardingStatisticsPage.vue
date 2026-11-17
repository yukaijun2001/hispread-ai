<script setup lang="ts">
// Onboarding statistics: first successful deliveries per Beijing day, failed
// and pending results, per-supplier contribution and a paged detail list.
// Filters apply on submit; the default range is the last 30 Beijing days.
import { computed, nextTick, ref, useId } from 'vue';
import PageHeader from '../../components/ui/PageHeader.vue';
import Button from '../../components/ui/Button.vue';
import Icon from '../../components/ui/Icon.vue';
import Notice from '../../components/ui/Notice.vue';
import Select from '../../components/ui/Select.vue';
import TextInput from '../../components/ui/TextInput.vue';
import DataTable from '../../components/ui/DataTable.vue';
import Pagination from '../../components/ui/Pagination.vue';
import type { Column } from '../../components/ui/types';
import { useApiData } from '../../composables/useApiData';
import { useSupplierDirectory } from '../../composables/useSupplierDirectory';
import { t } from '../../lib/i18n';
import { beijingDate, formatDateTime } from '../../lib/money';
import { useSessionStore } from '../../stores/session';

defineProps<{ route: string }>();

interface Counts { success: number; failed: number; pending: number }
interface DailyRow extends Counts { date: string }
interface SupplierRow extends Counts { supplierId: string; supplierName?: string | null }
interface DetailRow {
  id?: string;
  resourceId: string;
  resourceName?: string | null;
  supplierId: string;
  supplierName?: string | null;
  projectName?: string | null;
  state: string;
  at?: string | null;
}
interface OnboardingReport {
  from: string;
  to: string;
  summary: Counts;
  daily: DailyRow[];
  suppliers: SupplierRow[];
  details: { items: DetailRow[]; total: number };
}
interface Period { from: string; to: string; supplierId: string }

const session = useSessionStore();
const allowed = computed(() => session.has('report.read') && session.has('resource.read'));
const canPickSupplier = computed(() => !session.user?.supplierId && session.has('supplier.read'));

function lastThirtyDays(): Period {
  const to = beijingDate();
  const start = new Date(`${to}T00:00:00Z`);
  start.setUTCDate(start.getUTCDate() - 29);
  return { from: start.toISOString().slice(0, 10), to, supplierId: '' };
}

const draft = ref<Period>(lastThirtyDays());
const filter = ref<Period>(lastThirtyDays());
const page = ref(1);
const size = ref(20);
const error = ref('');
const includeEmpty = ref(false);
const errorElement = ref<HTMLElement | null>(null);
const formId = useId();

const report = useApiData<OnboardingReport>(() => (allowed.value
  ? `/reports/onboarding?${new URLSearchParams({ ...filter.value, page: String(page.value), size: String(size.value) })}`
  : null));

// The directory has no reload of its own; switching it off and on again refetches.
const suppliersPaused = ref(false);
const suppliers = useSupplierDirectory(() => allowed.value && canPickSupplier.value && !suppliersPaused.value);
async function retrySuppliers() {
  suppliersPaused.value = true;
  await nextTick();
  suppliersPaused.value = false;
}

function update(field: keyof Period, value: string) {
  draft.value = { ...draft.value, [field]: value };
  error.value = '';
}

function submit() {
  const { from, to } = draft.value;
  if (from > to || (Date.parse(`${to}T00:00:00Z`) - Date.parse(`${from}T00:00:00Z`)) / 86_400_000 > 365) {
    error.value = t('起止日期须顺序有效且不超过366天');
    setTimeout(() => errorElement.value?.focus(), 0);
    return;
  }
  error.value = '';
  const unchanged = draft.value.from === filter.value.from && draft.value.to === filter.value.to && draft.value.supplierId === filter.value.supplierId;
  if (unchanged && page.value === 1) report.reload();
  else filter.value = { ...draft.value };
  page.value = 1;
}

function resetToLastThirtyDays() {
  const next = lastThirtyDays();
  draft.value = next;
  filter.value = { ...next };
  page.value = 1;
  error.value = '';
}

const data = computed(() => (report.error.value ? null : report.data.value));
const busy = computed(() => report.loading.value || report.refreshing.value);
const daily = computed(() => (data.value?.daily ?? []).filter((row) => includeEmpty.value || row.success + row.failed + row.pending > 0));

const supplierOptions = computed(() => [
  { value: '', label: t('全部可见供应商') },
  ...(suppliers.items.value ?? []).map((s) => ({ value: s.id, label: s.name, detail: s.code })),
]);

const SUMMARY: Array<[keyof Counts, string]> = [['success', t('成功新增')], ['failed', t('失败')], ['pending', t('处理中／待核对')]];
const countColumns: Column[] = [
  { key: 'success', label: t('成功新增'), align: 'right' },
  { key: 'failed', label: t('失败'), align: 'right' },
  { key: 'pending', label: t('处理中／待核对'), align: 'right' },
];
const dailyColumns: Column[] = [{ key: 'date', label: t('日期'), nowrap: true }, ...countColumns];
const supplierColumns: Column[] = [{ key: 'supplier', label: t('供应商') }, ...countColumns];
const detailColumns: Column[] = [
  { key: 'resource', label: t('账号') },
  { key: 'supplier', label: t('供应商 / 项目') },
  { key: 'state', label: t('结果') },
  { key: 'at', label: t('首次成功／当前结果时间'), nowrap: true },
];
const STATE_LABELS: Record<string, string> = { SUCCESS: '首次上号成功', FAILED: '上号失败', PENDING: '处理中／待核对' };
const stateLabel = (state: string) => (STATE_LABELS[state] ? t(STATE_LABELS[state]) : state);
</script>

<template>
  <Notice v-if="!allowed" tone="danger">{{ t('当前账号无权查看上号统计') }}</Notice>
  <div v-else class="obs-page">
    <PageHeader :title="t('上号统计')" :description="t('按北京时间首次成功交付统计；已有账号关联、重新授权不计新增。失败和待核对按每个资源的最新结果单独统计。')" />

    <div role="search">
      <form :id="formId" class="obs-card obs-filters" method="get" :aria-label="t('筛选上号统计')" @submit.prevent="submit">
        <div class="obs-field">
          <label :for="`${formId}-from`">{{ t('开始日期') }} <em aria-hidden="true">*</em></label>
          <TextInput :id="`${formId}-from`" :model-value="draft.from" name="from" type="date" required :max="draft.to || undefined" @update:model-value="update('from', $event)" />
        </div>
        <div class="obs-field">
          <label :for="`${formId}-to`">{{ t('结束日期') }} <em aria-hidden="true">*</em></label>
          <TextInput :id="`${formId}-to`" :model-value="draft.to" name="to" type="date" required :min="draft.from || undefined" @update:model-value="update('to', $event)" />
        </div>
        <div v-if="canPickSupplier" class="obs-field">
          <label :for="`${formId}-supplier`">{{ t('供应商') }}</label>
          <Select
            :id="`${formId}-supplier`"
            :model-value="draft.supplierId"
            :options="supplierOptions"
            :label="t('供应商')"
            :placeholder="t('全部可见供应商')"
            searchable
            :search-placeholder="t('搜索供应商名称或编码')"
            @update:model-value="update('supplierId', String($event))"
          />
        </div>
        <div class="obs-actions">
          <Button type="submit" variant="primary" :disabled="busy">{{ busy ? t('查询中…') : t('查询') }}</Button>
          <Button @click="resetToLastThirtyDays">{{ t('近30天') }}</Button>
        </div>
        <p v-if="error" ref="errorElement" role="alert" tabindex="-1" class="obs-error">{{ error }}</p>
        <Notice v-if="suppliers.error.value" tone="danger" class="obs-wide">
          {{ t('供应商列表读取失败：{0}', [suppliers.error.value]) }}
          <template #actions><Button size="sm" @click="retrySuppliers">{{ t('重试') }}</Button></template>
        </Notice>
      </form>
    </div>

    <Notice v-if="report.error.value" tone="danger">
      {{ report.error.value }}
      <template #actions><Button size="sm" icon="refresh" @click="report.reload()">{{ t('重新查询') }}</Button></template>
    </Notice>

    <div class="obs-summary" role="status" aria-live="polite">
      <section v-for="[key, label] in SUMMARY" :key="key" class="obs-card obs-stat">
        <span>{{ label }}</span>
        <strong>{{ data ? String(data.summary[key]) : '—' }}</strong>
      </section>
    </div>
    <p v-if="data" class="obs-note">
      <Icon name="info" :size="14" />
      {{ t('统计期间：{0} 至 {1}（北京时间）。归档或隐藏不扣减已有成功记录；失败／待核对不是成功新增。', [data.from, data.to]) }}
    </p>

    <section class="obs-card">
      <div class="obs-section-head">
        <h2>{{ t('每日上号') }}</h2>
        <label class="obs-toggle">
          <input v-model="includeEmpty" type="checkbox" name="includeEmpty">
          {{ t('显示无记录日期') }}
        </label>
      </div>
      <DataTable :columns="dailyColumns" :rows="daily" :row-key="(row) => row.date" :loading="report.loading.value" :label="t('每日上号')" />
    </section>

    <section class="obs-card">
      <div class="obs-section-head"><h2>{{ t('供应商贡献') }}</h2></div>
      <DataTable :columns="supplierColumns" :rows="data?.suppliers ?? []" :row-key="(row) => row.supplierId" :loading="report.loading.value" :label="t('供应商贡献')">
        <template #cell-supplier="{ row }">{{ row.supplierName || row.supplierId }}</template>
      </DataTable>
    </section>

    <details class="obs-card obs-details">
      <summary>
        <Icon name="chevron" :size="14" class="obs-caret" />
        {{ t('查看上号明细') }}
      </summary>
      <DataTable
        :columns="detailColumns"
        :rows="data?.details?.items ?? []"
        :row-key="(row) => row.id ?? `${row.resourceId}:${row.state}:${row.at ?? ''}`"
        :loading="report.loading.value"
        :label="t('查看上号明细')"
      >
        <template #cell-resource="{ row }">{{ row.resourceName || row.resourceId }}</template>
        <template #cell-supplier="{ row }">
          <div class="obs-stack">
            <span>{{ row.supplierName || row.supplierId }}</span>
            <small>{{ row.projectName || '—' }}</small>
          </div>
        </template>
        <template #cell-state="{ row }">{{ stateLabel(row.state) }}</template>
        <template #cell-at="{ row }">{{ formatDateTime(row.at) }}</template>
      </DataTable>
      <Pagination v-if="data?.details" v-model:page="page" v-model:size="size" :total="data.details.total" :loading="report.loading.value" />
    </details>
  </div>
</template>

<style scoped>
.obs-page { display: grid; gap: 16px; }
.obs-card { background: var(--hs-surface); border: 1px solid var(--hs-border); border-radius: var(--hs-radius-card); box-shadow: var(--hs-shadow-card); overflow: hidden; }
.obs-filters { display: flex; flex-wrap: wrap; align-items: flex-end; gap: 12px 16px; padding: 16px 20px; overflow: visible; }
.obs-field { display: grid; gap: 6px; flex: 1 1 12rem; min-width: 0; }
.obs-field label { color: var(--hs-text-3); font-size: var(--hs-text-xs); }
.obs-field em { color: var(--hs-danger); font-style: normal; }
.obs-actions { display: flex; gap: 8px; }
.obs-error { flex: 1 1 100%; margin: 0; color: var(--hs-danger); font-size: var(--hs-text-sm); outline: none; }
.obs-wide { flex: 1 1 100%; }
.obs-summary { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 12px; }
.obs-stat { display: grid; gap: 10px; padding: 18px 20px; }
.obs-stat span { color: var(--hs-text-3); font-size: var(--hs-text-xs); }
.obs-stat strong { color: var(--hs-text); font-size: 28px; font-weight: 600; line-height: 1.1; font-variant-numeric: tabular-nums; }
.obs-note { display: flex; align-items: flex-start; gap: 8px; margin: 0 4px; color: var(--hs-text-3); font-size: var(--hs-text-xs); line-height: 1.7; }
.obs-note > .hs-icon { margin-top: 3px; flex: none; }
.obs-section-head { display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: 8px 12px; padding: 12px 20px; }
.obs-section-head h2 { margin: 0; color: var(--hs-text); font-size: var(--hs-text-md); font-weight: 600; }
.obs-toggle { display: inline-flex; align-items: center; gap: 8px; min-height: 36px; color: var(--hs-text-2); font-size: var(--hs-text-sm); cursor: pointer; }
.obs-toggle input { width: 16px; height: 16px; margin: 0; accent-color: var(--hs-primary); }
.obs-details > summary { display: flex; align-items: center; gap: 8px; min-height: 52px; padding: 0 20px; color: var(--hs-text); font-size: var(--hs-text-md); font-weight: 600; list-style: none; cursor: pointer; }
.obs-details > summary::-webkit-details-marker { display: none; }
.obs-details > summary:focus-visible { outline: 2px solid var(--hs-accent); outline-offset: -2px; }
.obs-caret { color: var(--hs-text-3); transition: transform .15s; }
.obs-details[open] .obs-caret { transform: rotate(90deg); }
.obs-stack { display: grid; gap: 2px; }
.obs-stack small { color: var(--hs-text-3); font-size: var(--hs-text-xs); }
@media (max-width: 640px) {
  .obs-summary { grid-template-columns: minmax(0, 1fr); }
  .obs-field { flex-basis: 100%; }
}
</style>
