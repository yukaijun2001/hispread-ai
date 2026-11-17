<script setup lang="ts">
// "批量新建结算单": choose a source period and suppliers, let the server preview
// the batch, start generation and follow it until it completes. Recent batches
// can be reopened; every screen can print a PDF summary.
import { computed, ref, watch } from 'vue';
import Dialog from '../../../components/ui/Dialog.vue';
import Button from '../../../components/ui/Button.vue';
import Badge from '../../../components/ui/Badge.vue';
import Notice from '../../../components/ui/Notice.vue';
import FormField from '../../../components/ui/FormField.vue';
import Select from '../../../components/ui/Select.vue';
import TextInput from '../../../components/ui/TextInput.vue';
import SearchInput from '../../../components/ui/SearchInput.vue';
import DataTable from '../../../components/ui/DataTable.vue';
import Spinner from '../../../components/ui/Spinner.vue';
import SettlementPreviewDialog from './SettlementPreviewDialog.vue';
import BatchTotals from './BatchTotals.vue';
import { useApiData } from '../../../composables/useApiData';
import { apiFetch, apiPost } from '../../../lib/api';
import { t, translateServerMessage } from '../../../lib/i18n';
import { CURRENCIES } from '../../../lib/labels';
import { beijingDate, formatDateTime } from '../../../lib/money';
import { useSessionStore } from '../../../stores/session';
import { beijingYesterday, hourDeadline, monthStart, type PreviewDocument } from '../settlements';
import {
  addTotals, aggregateSuppliers, type Batch, type BatchCandidates, type BatchItem, type BatchSummary, type SupplierTotal, type Totals,
} from './batch';
import { exportBatchPdf, type PdfBatch } from './batchPdf';

const emit = defineEmits<{ close: []; settlement: [id: string] }>();
const session = useSessionStore();

// --- Selection ---------------------------------------------------------------
const periodStart = ref(monthStart(beijingYesterday()));
const periodEnd = ref(beijingYesterday());
const projectId = ref('');
const currency = ref('');
const deadline = ref(hourDeadline());
const search = ref('');
const selected = ref<string[]>([]);

const batch = ref<Batch | null>(null);
const previewItemId = ref<string | null>(null);
const busy = ref(false);
const error = ref('');
const pollError = ref('');
/** Bumped after a batch starts or completes so the recent list is fetched afresh. */
const view = ref(0);
// Idempotency keys: one for the preview (renewed whenever the selection changes) and one for retry-preview.
let requestKey = crypto.randomUUID();
let retryKey = crypto.randomUUID();

const periodValid = computed(() => !!periodStart.value && !!periodEnd.value && periodStart.value <= periodEnd.value && periodEnd.value < beijingDate());
const candidates = useApiData<BatchCandidates>(() => (!batch.value && periodValid.value
  ? `/settlement-batches/candidates?periodStart=${periodStart.value}&periodEnd=${periodEnd.value}`
  : null));
const recent = useApiData<BatchSummary[]>(() => `/settlement-batches?view=${view.value}`, { pollMs: 5000 });

// Changing the period or a setting starts a new selection.
watch([periodStart, periodEnd, projectId, currency, deadline], () => {
  selected.value = [];
  error.value = '';
  requestKey = crypto.randomUUID();
});

const suppliers = computed(() => aggregateSuppliers((candidates.data.value?.items || [])
  .filter((item) => (!projectId.value || item.projectId === projectId.value) && (!currency.value || item.currency === currency.value))));
const visibleSuppliers = computed(() => suppliers.value.filter((row) => row.name.toLowerCase().includes(search.value.trim().toLowerCase())));
const chosenIds = computed(() => selected.value.filter((id) => suppliers.value.some((row) => row.id === id)));
const allTotals = computed(() => suppliers.value.reduce<Totals>((sum, row) => addTotals(sum, row.totals), {}));
const chosen = computed(() => suppliers.value.filter((row) => chosenIds.value.includes(row.id)));
const chosenTotals = computed(() => chosen.value.reduce<Totals>((sum, row) => addTotals(sum, row.totals), {}));
const chosenCount = computed(() => chosen.value.reduce((sum, row) => sum + row.count, 0));
const amountsReady = computed(() => periodValid.value && !candidates.loading.value && !candidates.error.value);

const projectOptions = computed(() => [
  { value: '', label: t('全部项目') },
  ...new Map((candidates.data.value?.items || []).map((item) => [item.projectId, { value: item.projectId, label: item.projectName }])).values(),
]);
const currencyOptions = [{ value: '', label: t('全部币种') }, ...CURRENCIES.map((value) => ({ value, label: value }))];

function toggle(id: string, checked: boolean) {
  selected.value = checked ? [...selected.value, id] : selected.value.filter((value) => value !== id);
  requestKey = crypto.randomUUID();
}
function selectAll() {
  selected.value = [...new Set([...selected.value, ...visibleSuppliers.value.map((row) => row.id)])];
  requestKey = crypto.randomUUID();
}
function clearSelection() {
  selected.value = [];
  requestKey = crypto.randomUUID();
}

// --- Actions -------------------------------------------------------------------
async function run(task: () => Promise<void>) {
  if (busy.value) return;
  busy.value = true;
  error.value = '';
  try {
    await task();
  } catch (reason) {
    error.value = (reason as Error).message;
  } finally {
    busy.value = false;
  }
}

function close() { if (!busy.value) emit('close'); }

const openBatch = (id: string) => run(async () => { batch.value = await apiFetch<Batch>(`/settlement-batches/${id}`); });

const preview = () => run(async () => {
  const due = new Date(deadline.value);
  if (Number.isNaN(due.getTime())) throw new Error(t('请选择{0}', [t('供应商确认截止时间')]));
  batch.value = await apiPost<Batch>('/settlement-batches/preview', {
    periodStart: periodStart.value,
    periodEnd: periodEnd.value,
    supplierIds: chosenIds.value,
    projectId: projectId.value,
    currency: currency.value,
    confirmationDeadline: due.toISOString(),
    requestKey,
  });
});

function backToSelection() {
  batch.value = null;
  requestKey = crypto.randomUUID();
}

const start = (id: string) => run(async () => {
  batch.value = await apiPost<Batch>(`/settlement-batches/${id}/start`, {});
  view.value++;
  session.refresh();
});

const retry = (id: string) => run(async () => {
  batch.value = await apiPost<Batch>(`/settlement-batches/${id}/retry-preview`, { requestKey: retryKey });
  retryKey = crypto.randomUUID();
});

function exportPdf(source: PdfBatch, rows?: SupplierTotal[]) {
  try {
    exportBatchPdf(source, rows);
  } catch (reason) {
    error.value = (reason as Error).message;
  }
}
function exportCandidates() {
  exportPdf({
    id: '', state: 'PREVIEW', confirmationDeadline: '', items: [], periodStart: periodStart.value, periodEnd: periodEnd.value,
    totals: allTotals.value, incompleteDays: candidates.data.value?.incompleteDays || 0,
  }, suppliers.value);
}

function openSettlement(id: string) {
  close();
  emit('settlement', id);
}

// While a batch is queued, follow it in the background: first after 1 s, then
// every 2 s, every 5 s after an error, until the server reports a new state.
watch(() => (batch.value?.state === 'QUEUED' ? batch.value.id : null), (id, _previous, onCleanup) => {
  if (!id) return;
  let stopped = false;
  let timer: number | undefined;
  const poll = async () => {
    try {
      const next = await apiFetch<Batch>(`/settlement-batches/${id}`, { background: true });
      if (stopped) return;
      batch.value = next;
      pollError.value = '';
      if (next.state === 'COMPLETED') {
        session.refresh();
        view.value++;
      } else {
        timer = window.setTimeout(poll, 2000);
      }
    } catch (reason) {
      if (stopped) return;
      pollError.value = (reason as Error).message;
      timer = window.setTimeout(poll, 5000);
    }
  };
  timer = window.setTimeout(poll, 1000);
  onCleanup(() => {
    stopped = true;
    window.clearTimeout(timer);
    pollError.value = '';
  });
}, { immediate: true });

// --- Batch screen ----------------------------------------------------------------
const title = computed(() => {
  if (!batch.value) return t('批量新建结算单');
  return batch.value.state === 'PREVIEW' ? t('批量结算单预览') : t('批量生成结果');
});
const headline = computed(() => {
  const current = batch.value!;
  if (current.state === 'PREVIEW') return t('已选 {0} 家供应商 · 可生成 {1} 张结算单', [current.supplierCount, current.readyCount]);
  if (current.state === 'QUEUED') return t('正在生成 · 已生成 {0} 张', [current.successCount]);
  return t('已生成 {0} 张结算单', [current.successCount]);
});
const failedItems = computed(() => (batch.value?.items || []).filter((item) => item.state === 'FAILED'));
const settledItems = computed(() => (batch.value?.items || []).filter((item) => item.state !== 'FAILED'));
const readyItems = computed(() => (batch.value?.items || []).filter((item) => item.state === 'READY'));
const previewIndex = computed(() => readyItems.value.findIndex((item) => item.id === previewItemId.value));
const loadItemPage = computed(() => {
  const batchId = batch.value?.id;
  const itemId = previewItemId.value;
  return (page: number, size: number) => apiFetch<PreviewDocument>(`/settlement-batches/${batchId}/items/${itemId}/preview?page=${page}&size=${size}`);
});

function itemState(item: BatchItem): { label: string; tone: 'success' | 'neutral' | 'info' } {
  if (item.state === 'SUCCEEDED') return { label: t('已生成'), tone: 'success' };
  return batch.value?.state === 'PREVIEW' ? { label: t('待生成'), tone: 'neutral' } : { label: t('处理中'), tone: 'info' };
}

const supplierColumns = [
  { key: 'pick', label: t('选择'), width: '64px' },
  { key: 'name', label: t('供应商') },
  { key: 'count', label: t('可结算笔数'), align: 'right' as const },
  { key: 'totals', label: t('可生成金额'), align: 'right' as const },
  { key: 'status', label: t('状态') },
];
const failedColumns = [
  { key: 'supplierName', label: t('供应商') },
  { key: 'projectName', label: t('项目') },
  { key: 'currency', label: t('币种') },
  { key: 'error', label: t('原因') },
];
const itemColumns = [
  { key: 'supplierName', label: t('供应商') },
  { key: 'projectName', label: t('项目') },
  { key: 'sourceCount', label: t('来源笔数'), align: 'right' as const },
  { key: 'total', label: t('应付金额'), align: 'right' as const },
  { key: 'state', label: t('状态') },
  { key: 'actions', label: '' },
];
</script>

<template>
  <Dialog size="xl" :title="title" @close="close">
    <div class="sb-body">
      <Notice v-if="error" tone="danger">{{ error }}</Notice>

      <!-- Batch: preview, progress or result -->
      <template v-if="batch">
        <section class="sb-summary">
          <strong class="sb-headline">{{ headline }}</strong>
          <BatchTotals class="sb-summary-totals" :totals="batch.totals" />
          <span class="sb-period">{{ batch.periodStart }}{{ t(' 至 ') }}{{ batch.periodEnd }}</span>
        </section>

        <Notice v-if="batch.state === 'PREVIEW' && batch.incompleteDays > 0" tone="danger">
          {{ t('该期间有 {0} 天存在采集异常。本次只结算已拉取的日账，不代表该期间已全部结清。', [batch.incompleteDays]) }}
        </Notice>
        <p v-if="batch.state === 'PREVIEW'" class="sb-line">
          {{ t('供应商确认截止时间：{0}。请供应商核对后手动确认。', [formatDateTime(batch.confirmationDeadline)]) }}
        </p>
        <Notice v-if="batch.state === 'QUEUED'" tone="info">{{ t('后台正在处理，关闭页面后仍会继续。可在“最近批量结算”查看结果。') }}</Notice>
        <Notice v-if="pollError" tone="danger">{{ t('暂时无法更新进度：{0}。正在重试，可稍后重新查看。', [pollError]) }}</Notice>
        <Notice v-if="batch.failedCount > 0" tone="danger">
          {{ batch.state === 'PREVIEW'
            ? t('{0} 张结算单需处理，其余单据可正常生成。', [batch.failedCount])
            : t('{0} 张结算单需处理，其余单据正常生成。', [batch.failedCount]) }}
        </Notice>

        <div v-if="failedItems.length" class="sb-table">
          <DataTable :columns="failedColumns" :rows="failedItems" :row-key="(row: BatchItem) => row.id" :label="t('需处理项')">
            <template #cell-error="{ row }">{{ row.error ? translateServerMessage(row.error) : '—' }}</template>
          </DataTable>
        </div>

        <details class="sb-section" :open="batch.state === 'PREVIEW' || undefined">
          <summary>{{ batch.state === 'PREVIEW' ? t('待生成结算单 · 可逐张预览') : t('查看结算单明细') }}</summary>
          <div class="sb-table">
            <DataTable :columns="itemColumns" :rows="settledItems" :row-key="(row: BatchItem) => row.id" :label="t('查看结算单明细')">
              <template #cell-sourceCount="{ row }"><span class="sb-num">{{ row.sourceCount }}</span></template>
              <template #cell-total="{ row }"><BatchTotals :totals="{ [row.currency]: row.total }" /></template>
              <template #cell-state="{ row }"><Badge :tone="itemState(row).tone" dot>{{ itemState(row).label }}</Badge></template>
              <template #cell-actions="{ row }">
                <Button v-if="batch.state === 'PREVIEW'" size="sm" variant="ghost" icon="eye" @click="previewItemId = row.id">{{ t('预览结算单') }}</Button>
                <Button v-else-if="row.settlementId && session.has('settlement.read')" size="sm" variant="ghost" trailing-icon="arrow" @click="openSettlement(row.settlementId)">
                  {{ t('查看结算单') }}
                </Button>
              </template>
            </DataTable>
          </div>
        </details>
      </template>

      <!-- Selection -->
      <template v-else>
        <details v-if="recent.data.value?.length" class="sb-section sb-history">
          <summary>{{ t('最近批量结算') }}{{ recent.data.value.some((item) => item.state === 'QUEUED') ? t(' · 有任务正在生成') : '' }}</summary>
          <ul>
            <li v-for="item in recent.data.value" :key="item.id">
              <span class="sb-history-period">{{ item.periodStart }}{{ t(' 至 ') }}{{ item.periodEnd }} · {{ item.supplierCount }}{{ t(' 家供应商') }}</span>
              <span class="sb-history-state">
                <Spinner v-if="item.state === 'QUEUED'" :size="12" />
                {{ item.state === 'QUEUED' ? t('生成中 · 已生成 {0} 张', [item.successCount]) : t('已生成 {0} 张', [item.successCount]) }}{{ item.failedCount > 0 ? t(' · {0} 张需处理', [item.failedCount]) : '' }}
              </span>
              <Button size="sm" :disabled="busy" @click="openBatch(item.id)">{{ t('查看结果') }}</Button>
            </li>
          </ul>
        </details>

        <div class="sb-fields">
          <FormField :label="t('来源开始日期')" required>
            <template #default="{ id }"><TextInput :id="id" v-model="periodStart" type="date" :max="periodEnd" required /></template>
          </FormField>
          <FormField :label="t('来源结束日期')" required>
            <template #default="{ id }"><TextInput :id="id" v-model="periodEnd" type="date" :min="periodStart" :max="beijingYesterday()" required /></template>
          </FormField>
        </div>
        <Notice>{{ t('日期用于筛选明细，结算周期按所选明细的最早开始日期和最晚结束日期自动识别。') }}</Notice>

        <details class="sb-section">
          <summary>{{ t('更多设置 · 默认全部项目、全部币种，五天内确认') }}</summary>
          <div class="sb-fields three">
            <FormField :label="t('项目')">
              <template #default="{ id }">
                <Select :id="id" v-model="projectId" :options="projectOptions" :label="t('批量结算项目')" :placeholder="t('全部项目')" searchable />
              </template>
            </FormField>
            <FormField :label="t('币种')">
              <template #default="{ id }">
                <Select :id="id" v-model="currency" :options="currencyOptions" :label="t('批量结算币种')" :placeholder="t('全部币种')" />
              </template>
            </FormField>
            <FormField :label="t('供应商确认截止时间')" required>
              <template #default="{ id }"><TextInput :id="id" v-model="deadline" type="datetime-local" required /></template>
            </FormField>
          </div>
        </details>

        <Notice v-if="!periodValid">{{ t('请选择有效的结算期间，结束日期最晚为昨天。') }}</Notice>
        <Notice v-if="candidates.data.value?.summaryUpdating" tone="warning">{{ t('日账静态汇总正在更新，请等待生成完成后重新预览') }}</Notice>
        <Notice v-if="candidates.data.value?.incompleteDays" tone="danger">
          {{ t('该期间有 {0} 天存在采集异常，金额仅包含已拉取的日账；遗漏账单补齐后可再次结算。', [candidates.data.value.incompleteDays]) }}
        </Notice>
        <div v-if="candidates.loading.value" class="sb-loading"><Spinner :size="16" /></div>
        <Notice v-if="candidates.error.value" tone="danger">
          {{ t('加载供应商失败：') }}{{ candidates.error.value }}
          <template #actions><Button size="sm" @click="session.refresh()">{{ t('重试') }}</Button></template>
        </Notice>

        <section v-if="amountsReady" class="sb-card">
          <div class="sb-toolbar">
            <SearchInput v-model="search" class="sb-grow" :placeholder="t('搜索供应商')" />
            <Button size="sm" @click="selectAll">{{ search ? t('选择全部搜索结果') : t('选择全部供应商') }}</Button>
            <Button size="sm" variant="ghost" @click="clearSelection">{{ t('清空') }}</Button>
            <span class="sb-count">{{ t('已选 {0} 家', [chosenIds.length]) }}</span>
          </div>
          <div class="sb-list-total">
            <div>
              <span>{{ t('可结算总金额') }}</span>
              <BatchTotals class="sb-list-amount" :totals="allTotals" />
            </div>
            <Button size="sm" icon="download" :disabled="!suppliers.length" @click="exportCandidates">{{ t('下载汇总 PDF') }}</Button>
          </div>
          <DataTable :columns="supplierColumns" :rows="visibleSuppliers" :row-key="(row: SupplierTotal) => row.id" :label="t('供应商')"
            @row-click="(row: SupplierTotal) => toggle(row.id, !selected.includes(row.id))">
            <template #cell-pick="{ row }">
              <input
                type="checkbox"
                class="sb-check"
                :aria-label="t('选择{0}', [row.name])"
                :checked="selected.includes(row.id)"
                @click.stop
                @change="toggle(row.id, ($event.target as HTMLInputElement).checked)"
              />
            </template>
            <template #cell-name="{ row }"><strong class="sb-name">{{ row.name }}</strong></template>
            <template #cell-count="{ row }"><span class="sb-num">{{ row.count }}</span></template>
            <template #cell-totals="{ row }"><BatchTotals class="sb-right" :totals="row.totals" /></template>
            <template #cell-status="{ row }">
              <Badge v-if="row.blocked" tone="warning" dot>{{ t('{0} 笔需处理', [row.blocked]) }}</Badge>
              <Badge v-else tone="success" dot>{{ t('可生成') }}</Badge>
            </template>
          </DataTable>
        </section>
        <p class="sb-note">{{ t('按已拉取的可结算日账生成。不同项目和币种自动分单；缺报价或来源异常的单据单独提示。') }}</p>
      </template>
    </div>

    <template #footer>
      <template v-if="batch">
        <Button v-if="batch.state === 'PREVIEW'" icon="arrow-left" :disabled="busy" @click="backToSelection">{{ t('返回选择') }}</Button>
        <Button v-if="batch.state !== 'QUEUED'" icon="download" :disabled="busy || !batch.items?.length" @click="exportPdf(batch)">{{ t('导出汇总 PDF') }}</Button>
        <span class="sb-spacer" />
        <Button @click="close">{{ t('关闭') }}</Button>
        <Button v-if="batch.state === 'PREVIEW'" variant="primary" :loading="busy" :disabled="!batch.readyCount" @click="start(batch.id)">
          {{ busy ? t('正在提交…') : t('确认生成') }}
        </Button>
        <Button v-if="batch.state === 'COMPLETED' && batch.failedCount > 0" variant="primary" :loading="busy" @click="retry(batch.id)">
          {{ busy ? t('正在核算…') : t('重新生成未完成项') }}
        </Button>
      </template>
      <template v-else>
        <div class="sb-selected" role="status" aria-live="polite">
          <span>{{ t('已选金额汇总') }}</span>
          <template v-if="amountsReady">
            <BatchTotals class="sb-selected-amount" :totals="chosenTotals" />
            <small>{{ t('已选 {0} 家供应商 · {1} 笔可结算', [chosenIds.length, chosenCount]) }}</small>
          </template>
          <small v-else>{{ t('金额待核算') }}</small>
        </div>
        <span class="sb-spacer" />
        <Button :disabled="busy" @click="close">{{ t('取消') }}</Button>
        <Button
          variant="primary"
          :loading="busy"
          :disabled="candidates.loading.value || !!candidates.error.value || !periodValid || !chosenIds.length"
          @click="preview"
        >
          {{ busy ? t('正在核算…') : t('预览结算单') }}
        </Button>
      </template>
    </template>
  </Dialog>

  <SettlementPreviewDialog
    v-if="previewItemId && batch?.state === 'PREVIEW'"
    :key="previewItemId"
    :load-page="loadItemPage"
    :navigation="{ index: previewIndex, count: readyItems.length }"
    @close="previewItemId = null"
    @previous="previewItemId = readyItems[previewIndex - 1].id"
    @next="previewItemId = readyItems[previewIndex + 1].id"
  />
</template>

<style scoped>
.sb-body { display: grid; gap: 14px; min-width: 0; }
.sb-fields { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 14px; }
.sb-fields.three { grid-template-columns: repeat(3, minmax(0, 1fr)); padding: 4px 16px 16px; }
.sb-section { background: var(--hs-surface); border: 1px solid var(--hs-border); border-radius: 12px; overflow: hidden; }
.sb-section > summary { padding: 12px 16px; color: var(--hs-text); font-size: var(--hs-text-sm); font-weight: 500; cursor: pointer; list-style-position: inside; }
.sb-section > summary:hover { background: var(--hs-surface-subtle); }
.sb-section > summary:focus-visible { outline: none; box-shadow: inset var(--hs-accent-ring); }
.sb-section[open] > summary { border-bottom: 1px solid var(--hs-divider); }
.sb-history ul { display: grid; margin: 0; padding: 0; list-style: none; }
.sb-history li { display: grid; grid-template-columns: minmax(0, 1fr) auto auto; align-items: center; gap: 16px; padding: 10px 16px; font-size: var(--hs-text-sm); }
.sb-history li + li { border-top: 1px solid var(--hs-divider); }
.sb-history-period { color: var(--hs-text); font-variant-numeric: tabular-nums; }
.sb-history-state { display: inline-flex; align-items: center; gap: 6px; color: var(--hs-text-3); font-size: var(--hs-text-xs); }
.sb-loading { display: grid; place-items: center; padding: 24px; color: var(--hs-text-3); }
.sb-card { background: var(--hs-surface); border: 1px solid var(--hs-border); border-radius: 12px; overflow: hidden; }
.sb-toolbar { display: flex; flex-wrap: wrap; align-items: center; gap: 8px; padding: 12px 16px; }
.sb-grow { flex: 1 1 220px; }
.sb-count { margin-left: auto; color: var(--hs-text-3); font-size: var(--hs-text-xs); font-variant-numeric: tabular-nums; }
.sb-list-total { display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: 10px 16px; padding: 10px 16px 12px; border-top: 1px solid var(--hs-divider); }
.sb-list-total > div { display: flex; flex-wrap: wrap; align-items: baseline; gap: 6px 12px; color: var(--hs-text-3); font-size: var(--hs-text-xs); }
.sb-list-amount { color: var(--hs-text); font-size: var(--hs-text-md); font-weight: 600; }
.sb-check { width: 16px; height: 16px; margin: 0; accent-color: var(--hs-primary); cursor: pointer; }
.sb-name { color: var(--hs-text); font-weight: 500; }
.sb-num { font-variant-numeric: tabular-nums; }
.sb-right { justify-content: flex-end; }
.sb-table { border: 1px solid var(--hs-border); border-radius: 12px; overflow: hidden; }
.sb-section .sb-table { border: 0; border-radius: 0; }
.sb-note, .sb-line { margin: 0; color: var(--hs-text-3); font-size: var(--hs-text-xs); line-height: 1.6; }
.sb-line { color: var(--hs-text-2); font-size: var(--hs-text-sm); }
.sb-summary { display: grid; grid-template-columns: minmax(0, 1fr) auto; align-items: end; gap: 6px 16px; padding: 16px 18px; background: var(--hs-surface-subtle); border: 1px solid var(--hs-border); border-radius: 12px; }
.sb-headline { color: var(--hs-text); font-size: var(--hs-text-md); font-weight: 600; }
.sb-summary-totals { grid-row: 2; color: var(--hs-text); font-size: var(--hs-text-xl); font-weight: 600; letter-spacing: -.3px; }
.sb-period { grid-row: 1 / 3; grid-column: 2; align-self: center; color: var(--hs-text-3); font-size: var(--hs-text-xs); font-variant-numeric: tabular-nums; }
.sb-selected { display: grid; gap: 2px; min-width: 0; font-size: var(--hs-text-xs); color: var(--hs-text-3); }
.sb-selected-amount { color: var(--hs-text); font-size: var(--hs-text-md); font-weight: 600; }
.sb-selected small { font-size: var(--hs-text-xs); }
.sb-spacer { flex: 1; }
@media (max-width: 720px) {
  .sb-fields, .sb-fields.three { grid-template-columns: minmax(0, 1fr); }
  .sb-history li { grid-template-columns: minmax(0, 1fr); gap: 6px; }
  .sb-summary { grid-template-columns: minmax(0, 1fr); }
  .sb-period { grid-row: auto; grid-column: auto; }
}
</style>
