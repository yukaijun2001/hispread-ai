<script setup lang="ts">
// scheduled-task-runs: run history of the status sync and retired scheduled
// tasks. `?task=` picks the task (default: the first one); dates are Beijing
// business days of the run start; the list polls every 10 s.
import { computed, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import PageHeader from '../../components/ui/PageHeader.vue';
import Button from '../../components/ui/Button.vue';
import DataTable from '../../components/ui/DataTable.vue';
import DateRangePicker from '../../components/ui/DateRangePicker.vue';
import EmptyState from '../../components/ui/EmptyState.vue';
import Notice from '../../components/ui/Notice.vue';
import Pagination from '../../components/ui/Pagination.vue';
import Select from '../../components/ui/Select.vue';
import Spinner from '../../components/ui/Spinner.vue';
import { useApiData } from '../../composables/useApiData';
import { t } from '../../lib/i18n';
import { scheduledTaskName } from '../../lib/labels';
import { beijingDate, formatDateTime } from '../../lib/money';
import { useSessionStore } from '../../stores/session';
import { overviewStateLabel, phaseTitle, runCode, runResult, type RunPage, type ScheduledTask, type TaskRun } from './scheduled/scheduledTasks';

defineProps<{ route: string }>();
const session = useSessionStore();
const currentRoute = useRoute();
const router = useRouter();

const tasks = useApiData<ScheduledTask[]>('/system/scheduled-tasks/history');
const taskParam = computed(() => (typeof currentRoute.query.task === 'string' ? currentRoute.query.task : ''));
const task = computed(() => tasks.data.value?.find((item) => item.key === taskParam.value) || tasks.data.value?.[0] || null);

const page = ref(1);
const size = ref(10);
const triggerKind = ref('');
const state = ref('');
const from = ref(beijingDate());
const to = ref(beijingDate());
const invalidRange = computed(() => !!(from.value && to.value && from.value > to.value));

const runs = useApiData<RunPage>(() => {
  if (!task.value || invalidRange.value) return null;
  const query = new URLSearchParams({ page: String(page.value), size: String(size.value) });
  if (triggerKind.value) query.set('triggerKind', triggerKind.value);
  if (state.value) query.set('state', state.value);
  if (from.value) query.set('from', from.value);
  if (to.value) query.set('to', to.value);
  return `/system/scheduled-tasks/${encodeURIComponent(task.value.key)}/runs?${query.toString()}`;
}, { pollMs: 10_000 });

// Step back when the current page has emptied out (e.g. after narrowing filters).
watch([runs.data, runs.loading, page, size], () => {
  const data = runs.data.value;
  if (runs.loading.value || !data || data.page !== page.value || data.size !== size.value) return;
  const last = Math.max(1, Math.ceil(data.total / size.value));
  if (page.value > last) page.value = last;
});

const taskOptions = computed(() => (tasks.data.value ?? []).map((item) => ({
  value: item.key,
  label: item.retired ? t('{0}（历史）', [scheduledTaskName(item)]) : scheduledTaskName(item),
})));
const triggerOptions = [{ value: '', label: t('全部方式') }, { value: 'SCHEDULE', label: t('自动') }, { value: 'MANUAL', label: t('手动') }];
const stateOptions = [
  { value: '', label: t('全部结果') },
  { value: 'RUNNING', label: t('运行中') },
  { value: 'SUCCESS', label: t('成功') },
  { value: 'FAILED', label: t('失败或部分完成') },
  { value: 'TIMED_OUT', label: t('执行超时') },
];

function selectTask(key: string) { router.push({ path: '/scheduled-task-runs', query: { task: key } }); }
function setTrigger(value: string) { triggerKind.value = value; page.value = 1; }
function setState(value: string) { state.value = value; page.value = 1; }
function setRange(nextFrom: string, nextTo: string) { from.value = nextFrom; to.value = nextTo; page.value = 1; }
function resetFilters() { triggerKind.value = ''; state.value = ''; from.value = beijingDate(); to.value = beijingDate(); page.value = 1; }

const columns = [
  { key: 'triggerKind', label: t('触发方式'), nowrap: true },
  { key: 'startedAt', label: t('开始时间'), nowrap: true },
  { key: 'finishedAt', label: t('结束时间'), nowrap: true },
  { key: 'result', label: t('结果') },
  { key: 'phase', label: t('阶段与进度') },
  { key: 'code', label: t('代码') },
];
const hideRows = computed(() => invalidRange.value || !!runs.error.value);
const countText = computed(() => (invalidRange.value ? t('请调整日期') : runs.loading.value ? t('加载中') : t('共 {0} 条', [runs.data.value?.total ?? 0])));
</script>

<template>
  <div class="str-page">
    <PageHeader :title="t('同步历史')" :description="t('查看交付状态同步及旧任务的历史记录；已停用任务仅供查阅。')">
      <template #actions><Button icon="refresh" @click="session.refresh()">{{ t('刷新') }}</Button></template>
    </PageHeader>

    <Notice v-if="tasks.error.value" tone="danger">{{ t('任务加载失败：') }}{{ tasks.error.value }}</Notice>
    <div v-else-if="tasks.loading.value && !tasks.data.value" class="str-loading"><Spinner /></div>
    <section v-else-if="tasks.data.value?.length" class="str-card" :aria-label="t('执行记录')">
      <header class="str-head">
        <div>
          <h2>{{ t('记录明细') }}</h2>
          <p>{{ t('按执行开始时间筛选，日期使用北京时间') }}</p>
        </div>
        <span class="str-count">{{ countText }}</span>
      </header>

      <div class="str-filters" role="search" :aria-label="t('筛选执行记录')">
        <div class="str-field str-task">
          <span>{{ t('服务任务') }}</span>
          <Select :model-value="task?.key || ''" :options="taskOptions" :label="t('选择服务任务')" @update:model-value="selectTask(String($event))" />
        </div>
        <div class="str-field">
          <span>{{ t('触发方式') }}</span>
          <Select :model-value="triggerKind" :options="triggerOptions" :label="t('触发方式')" :placeholder="t('全部方式')" @update:model-value="setTrigger(String($event))" />
        </div>
        <div class="str-field">
          <span>{{ t('执行结果') }}</span>
          <Select :model-value="state" :options="stateOptions" :label="t('执行结果')" :placeholder="t('全部结果')" @update:model-value="setState(String($event))" />
        </div>
        <div class="str-field str-dates">
          <span>{{ t('执行日期') }}</span>
          <DateRangePicker :from="from" :to="to" :label="t('执行日期')" @change="setRange" />
        </div>
        <div class="str-filter-actions">
          <Button v-if="from || to" variant="ghost" @click="setRange('', '')">{{ t('不限日期') }}</Button>
          <Button variant="ghost" @click="resetFilters">{{ t('重置筛选') }}</Button>
        </div>
      </div>

      <div v-if="invalidRange || runs.error.value" class="str-notices">
        <Notice v-if="invalidRange" tone="danger">{{ t('开始日期不能晚于结束日期') }}</Notice>
        <Notice v-if="runs.error.value" tone="danger">{{ t('执行记录加载失败：') }}{{ runs.error.value }}</Notice>
      </div>

      <DataTable
        :columns="columns"
        :rows="hideRows ? [] : runs.data.value?.items ?? []"
        :row-key="(row: TaskRun) => row.id"
        :loading="runs.loading.value && !invalidRange"
        :refreshing="runs.refreshing.value"
        :label="t('执行记录')"
      >
        <template #cell-triggerKind="{ row }">{{ row.triggerKind === 'SCHEDULE' ? t('自动') : t('手动') }}</template>
        <template #cell-startedAt="{ row }"><span class="str-time">{{ formatDateTime(row.startedAt) }}</span></template>
        <template #cell-finishedAt="{ row }"><span class="str-time">{{ formatDateTime(row.finishedAt || undefined) }}</span></template>
        <template #cell-result="{ row }">
          <template v-for="result in [runResult(row, task?.type)]" :key="result.kind">
            <span v-if="result.kind === 'renewal'">{{ t('已续期 ') }}{{ result.renewed }}{{ t(' 条 ') }}{{ result.conflicts === '0' ? '' : t('；{0} 条存在待审或报价冲突，请核对审批', [result.conflicts]) }}</span>
            <span v-else-if="result.kind === 'partial'" class="str-detail"><strong>{{ t('部分完成') }}</strong><span>{{ result.detail }}</span></span>
            <template v-else>{{ result.text }}</template>
          </template>
        </template>
        <template #cell-phase="{ row }">
          <template v-if="!row.phase">—</template>
          <div v-else class="str-detail">
            <strong>{{ phaseTitle(row) }}</strong>
            <span v-if="(row.postingProcessed ?? 0) > 0">{{ t('入账已处理 ') }}{{ row.postingProcessed }}{{ t(' 条，成功 ') }}{{ row.postingPosted ?? 0 }} {{ t('条，待核对 ') }}{{ row.postingBlocked ?? 0 }}{{ t(' 条 ') }}</span>
            <span v-if="(row.followupPending ?? 0) > 0">{{ t('后续处理进行中（') }}{{ row.followupPending }}{{ t(' 项）') }}</span>
            <span v-if="(row.followupDeferred ?? 0) > 0">{{ t('当日账单等待次日入账') }}</span>
            <span v-if="(row.followupFailed ?? 0) > 0">{{ t('后续处理失败 ') }}{{ row.followupFailed }}{{ t(' 项，请核对') }}</span>
            <span v-if="row.overviewState">{{ overviewStateLabel(row.overviewState) }}</span>
          </div>
        </template>
        <template #cell-code="{ row }"><span class="str-code">{{ runCode(row) }}</span></template>
      </DataTable>
      <Pagination v-if="!hideRows" v-model:page="page" v-model:size="size" :total="runs.data.value?.total ?? 0" :loading="runs.loading.value" />
    </section>
    <section v-else class="str-card">
      <EmptyState icon="clock" :text="t('还没有定时任务')" :hint="t('创建任务后才能查看执行记录。')" />
    </section>
  </div>
</template>

<style scoped>
.str-loading { display: grid; place-items: center; padding: 48px; color: var(--hs-text-3); }
.str-card { background: var(--hs-surface); border: 1px solid var(--hs-border); border-radius: var(--hs-radius-card); box-shadow: var(--hs-shadow-card); overflow: hidden; }
.str-page > .hs-notice { margin-bottom: 16px; }
.str-head { display: flex; flex-wrap: wrap; align-items: flex-end; justify-content: space-between; gap: 8px 16px; padding: 16px 18px 4px; }
.str-head h2 { margin: 0; color: var(--hs-text); font-size: var(--hs-text-md); font-weight: 600; }
.str-head p { margin: 4px 0 0; color: var(--hs-text-3); font-size: var(--hs-text-xs); }
.str-count { color: var(--hs-text-3); font-size: var(--hs-text-sm); font-variant-numeric: tabular-nums; }
.str-filters { display: flex; flex-wrap: wrap; align-items: flex-end; gap: 10px 12px; padding: 12px 18px 16px; }
.str-field { display: grid; gap: 6px; flex: 0 1 160px; min-width: 130px; }
.str-field > span { color: var(--hs-text-3); font-size: var(--hs-text-xs); }
.str-task { flex-basis: 240px; }
.str-dates { flex-basis: 260px; }
.str-filter-actions { display: flex; gap: 4px; margin-left: auto; }
.str-notices { display: grid; gap: 8px; padding: 0 18px 12px; }
.str-time { color: var(--hs-text-2); font-variant-numeric: tabular-nums; }
.str-detail { display: grid; gap: 2px; }
.str-detail strong { color: var(--hs-text); font-weight: 500; }
.str-detail span { color: var(--hs-text-3); font-size: var(--hs-text-xs); }
.str-code { color: var(--hs-text-3); font-family: var(--hs-font-mono); font-size: var(--hs-text-xs); overflow-wrap: anywhere; }
</style>
