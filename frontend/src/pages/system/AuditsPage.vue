<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import PageHeader from '../../components/ui/PageHeader.vue';
import Avatar from '../../components/ui/Avatar.vue';
import Button from '../../components/ui/Button.vue';
import IconButton from '../../components/ui/IconButton.vue';
import SearchInput from '../../components/ui/SearchInput.vue';
import Select from '../../components/ui/Select.vue';
import DateRangePicker from '../../components/ui/DateRangePicker.vue';
import DataTable from '../../components/ui/DataTable.vue';
import Pagination from '../../components/ui/Pagination.vue';
import StatusBadge from '../../components/ui/StatusBadge.vue';
import Notice from '../../components/ui/Notice.vue';
import Dialog from '../../components/ui/Dialog.vue';
import AuditDetailDrawer from './AuditDetailDrawer.vue';
import { useApiData } from '../../composables/useApiData';
import { apiDelete } from '../../lib/api';
import { getLocale, t } from '../../lib/i18n';
import { beijingDate, formatDateTime } from '../../lib/money';
import { useSessionStore } from '../../stores/session';
import { AUDIT_ACTION_LABELS, AUDIT_TARGET_LABELS, auditResultLabel, auditState, auditSummary, own, type AuditEntry } from './audits';

defineProps<{ route: string }>();
const session = useSessionStore();
const actionLabels = AUDIT_ACTION_LABELS();
const targetLabels = AUDIT_TARGET_LABELS();

// --- Filters ---------------------------------------------------------------
// The date range starts at today (Beijing); clearing the filters clears it too.
const search = ref('');
const action = ref('');
const actor = ref('');
const outcome = ref('');
const from = ref(beijingDate());
const to = ref(beijingDate());
const page = ref(1);
const size = ref(10);
watch([search, action, actor, outcome, from, to], () => { page.value = 1; });
const filtered = computed(() => !!(search.value || action.value || actor.value || outcome.value || from.value || to.value));

function clearFilters() {
  search.value = ''; action.value = ''; actor.value = ''; outcome.value = ''; from.value = ''; to.value = ''; page.value = 1;
}
function changeRange(start: string, end: string) { from.value = start; to.value = end; }

// --- Data ------------------------------------------------------------------
const actionsRetry = ref(0);
const actions = useApiData<unknown[]>(() => `/system/audit-actions?retry=${actionsRetry.value}`);
const list = useApiData<{ items: AuditEntry[]; total: number }>(() => {
  const query = new URLSearchParams({
    search: search.value, action: action.value, actor: actor.value, outcome: outcome.value, page: String(page.value), size: String(size.value),
  });
  if (from.value) query.set('from', from.value);
  if (to.value) query.set('to', to.value);
  return `/system/audits?summaryOnly=true&${query}`;
});

/** Known actions, the server's list and the current choice, sorted by label. */
const actionOptions = computed(() => {
  const codes = Array.from(new Set([
    ...Object.keys(actionLabels),
    ...(actions.data.value ?? []).filter((code): code is string => typeof code === 'string' && !!code.trim()),
    ...(action.value ? [action.value] : []),
  ])).sort((a, b) => (own(actionLabels, a) || a).localeCompare(own(actionLabels, b) || b, getLocale()));
  return [
    { value: '', label: t('全部操作内容'), shortLabel: t('操作内容') },
    ...codes.map((code) => ({ value: code, label: own(actionLabels, code) || code, detail: code })),
  ];
});
const outcomeOptions = [
  { value: '', label: t('全部结果') }, { value: 'SUCCESS', label: t('成功') }, { value: 'FAILURE', label: t('失败') }, { value: 'DENIED', label: t('已拦截') },
];

const columns = [
  { key: 'actor', label: t('操作人') },
  { key: 'action', label: t('操作内容') },
  { key: 'target', label: t('操作对象') },
  { key: 'outcome', label: t('结果'), nowrap: true },
  { key: 'createdAt', label: t('时间'), nowrap: true },
  { key: 'actions', label: t('操作'), nowrap: true },
];
const rowIndex = (row: AuditEntry) => (list.data.value?.items ?? []).indexOf(row);

// --- Detail and clearing -----------------------------------------------------
const selected = ref<AuditEntry | null>(null);
const clearOpen = ref(false);
const clearing = ref(false);
const clearError = ref('');

function openClear() { clearError.value = ''; clearOpen.value = true; }
function closeClear() { if (!clearing.value) clearOpen.value = false; }

async function clearAudits() {
  if (clearing.value) return;
  clearing.value = true;
  clearError.value = '';
  try {
    await apiDelete('/system/audits');
    session.refresh();
    clearOpen.value = false;
  } catch (error) {
    clearError.value = error instanceof Error ? error.message : t('清空失败，请重试');
  } finally {
    clearing.value = false;
  }
}
</script>

<template>
  <div class="audits">
    <PageHeader :title="t('审计日志')" :description="t('记录关键操作及接口调用。已发起、已提交和本地已交付均不代表目标分发成功，最终状态请查看资源详情。')" />

    <section class="card">
      <div class="toolbar">
        <SearchInput v-model="search" class="grow" :placeholder="t('目标编号或操作代码')" :label="t('目标编号或操作代码')" />
        <div class="filter wide">
          <Select v-model="action" :options="actionOptions" :label="t('操作内容')" :placeholder="t('全部操作内容')" searchable :search-placeholder="t('搜索操作内容或代码')" />
        </div>
        <SearchInput v-model="actor" class="filter" :placeholder="t('操作人')" :label="t('操作人')" />
        <div class="filter narrow"><Select v-model="outcome" :options="outcomeOptions" :label="t('操作结果')" :placeholder="t('全部结果')" /></div>
        <div class="date"><DateRangePicker :from="from" :to="to" :label="t('操作日期')" @change="changeRange" /></div>
        <div class="toolbar-actions">
          <Button v-if="filtered" variant="ghost" size="sm" @click="clearFilters">{{ t('清除筛选') }}</Button>
          <Button variant="ghost" size="sm" class="danger-text" @click="openClear">{{ t('清空日志') }}</Button>
          <IconButton icon="refresh" :label="t('刷新审计日志')" @click="session.refresh()" />
        </div>
      </div>

      <Notice v-if="actions.error.value" tone="warning" class="inline-notice">
        {{ t('操作内容加载失败：') }}{{ actions.error.value }}{{ t('。已有操作仍可筛选。') }}
        <template #actions><Button size="sm" @click="actionsRetry++">{{ t('重试加载操作内容') }}</Button></template>
      </Notice>

      <DataTable
        :columns="columns"
        :rows="list.data.value?.items"
        :row-key="(row: AuditEntry) => row.id"
        :loading="list.loading.value"
        :refreshing="list.refreshing.value"
        :error="list.error.value"
        :label="t('审计日志')"
        @retry="list.reload()"
        @row-click="(row: AuditEntry) => (selected = row)"
      >
        <template #cell-actor="{ row }">
          <div class="hs-identity"><Avatar :name="row.actorName ?? ''" :tone="rowIndex(row)" :size="24" /><strong>{{ row.actorName }}</strong></div>
        </template>
        <template #cell-action="{ row }">
          <div class="cell"><strong>{{ own(actionLabels, row.action) || row.action }}</strong><small>{{ auditSummary(row) }}</small></div>
        </template>
        <template #cell-target="{ row }">
          <span class="target">{{ own(targetLabels, row.targetType) || t('操作对象') }} · <code>{{ row.targetId }}</code></span>
        </template>
        <template #cell-outcome="{ row }"><StatusBadge :state="auditState(row)" :label="auditResultLabel(row)" /></template>
        <template #cell-createdAt="{ row }"><span class="num">{{ formatDateTime(row.createdAt) }}</span></template>
        <template #cell-actions="{ row }">
          <button type="button" class="action" @click.stop="selected = row">{{ t('详情') }}</button>
        </template>
      </DataTable>
      <Pagination v-model:page="page" v-model:size="size" :total="list.data.value?.total ?? 0" :loading="list.loading.value" />
    </section>

    <AuditDetailDrawer v-if="selected" :key="selected.id" :entry="selected" @close="selected = null" />

    <Dialog v-if="clearOpen" size="sm" :title="t('清空审计日志')" @close="closeClear">
      <div class="clear-body">
        <Notice tone="warning">{{ t('确定清空全部审计日志吗？当前筛选不会限制范围，清空后不能恢复。系统会保留本次清空操作的记录。') }}</Notice>
        <Notice v-if="clearError" tone="danger">{{ clearError }}</Notice>
      </div>
      <template #footer>
        <Button :disabled="clearing" @click="clearOpen = false">{{ t('取消') }}</Button>
        <Button variant="danger" :disabled="clearing" @click="clearAudits">{{ t(clearing ? '清空中…' : '确认清空') }}</Button>
      </template>
    </Dialog>
  </div>
</template>

<style scoped>
.card { background: var(--hs-surface); border: 1px solid var(--hs-border); border-radius: var(--hs-radius-card); box-shadow: var(--hs-shadow-card); overflow: hidden; }
.toolbar { display: flex; flex-wrap: wrap; align-items: center; gap: 8px; padding: 14px 16px; }
.grow { flex: 1 1 220px; }
.filter { flex: 0 1 170px; min-width: 140px; }
.filter.wide { flex-basis: 220px; min-width: 180px; }
.filter.narrow { flex-basis: 130px; min-width: 120px; }
.date { flex: 0 1 250px; min-width: 220px; }
.toolbar-actions { display: flex; align-items: center; gap: 2px; margin-left: auto; }
.danger-text { color: var(--hs-danger); }
.inline-notice { margin: 0 16px 12px; }
.hs-identity { display: flex; align-items: center; gap: 8px; min-width: 0; }
.hs-identity strong { color: var(--hs-text); font-weight: 500; overflow-wrap: anywhere; }
.cell { display: grid; gap: 2px; min-width: 0; }
.cell strong { color: var(--hs-text); font-weight: 500; }
.cell small { color: var(--hs-text-3); font-size: var(--hs-text-xs); }
.target { color: var(--hs-text-2); }
.target code { font-family: var(--hs-font-mono); font-size: var(--hs-text-xs); overflow-wrap: anywhere; }
.num { color: var(--hs-text-3); font-family: var(--hs-font-mono); font-size: var(--hs-text-xs); font-variant-numeric: tabular-nums; }
.action { padding: 0; color: var(--hs-accent); background: none; border: 0; font: inherit; font-size: var(--hs-text-xs); white-space: nowrap; cursor: pointer; }
.action:hover { color: var(--hs-accent-hover); text-decoration: underline; text-underline-offset: 3px; }
.clear-body { display: grid; gap: 12px; }
</style>
