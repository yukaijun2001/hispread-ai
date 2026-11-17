<script setup lang="ts">
// Pause / resume / remove jobs: the progress of one job (polled every 3 s while
// RUNNING, `changed` once it stops) or the paged history. An unknown item is
// only reconciled on request, never resubmitted.
import { computed, ref, watch } from 'vue';
import Dialog from '../../../components/ui/Dialog.vue';
import Button from '../../../components/ui/Button.vue';
import Notice from '../../../components/ui/Notice.vue';
import DataTable from '../../../components/ui/DataTable.vue';
import Pagination from '../../../components/ui/Pagination.vue';
import Spinner from '../../../components/ui/Spinner.vue';
import EmptyState from '../../../components/ui/EmptyState.vue';
import StateBadge from '../components/StateBadge.vue';
import { useApiData } from '../../../composables/useApiData';
import { apiPost } from '../../../lib/api';
import { t } from '../../../lib/i18n';
import { formatDateTime } from '../../../lib/money';
import { usePolledData } from '../composables/usePolledData';
import { jobActionLabel, jobStateLabel, LIFECYCLE_ITEM_LABELS, type LifecycleJob, type LifecycleJobItem } from '../overview';

const props = defineProps<{ state: { mode: 'records' } | { mode: 'progress'; id: string } }>();
const emit = defineEmits<{ close: []; open: [id: string]; changed: [] }>();

const ENDPOINT = '/resource-lifecycle-jobs';
const progressId = computed(() => (props.state.mode === 'progress' ? props.state.id : ''));

// --- Progress ------------------------------------------------------------------
const polling = ref(true);
const job = usePolledData<LifecycleJob>(() => (progressId.value ? `${ENDPOINT}/${encodeURIComponent(progressId.value)}` : null), () => (polling.value ? 3000 : 0));
const reconciling = ref(false);
const actionError = ref('');
let changedOnce = false;

watch(job.data, (value) => {
  if (!value || value.state === 'RUNNING') return;
  polling.value = false;
  if (!changedOnce) { changedOnce = true; emit('changed'); }
});

async function reconcile() {
  if (reconciling.value) return;
  reconciling.value = true;
  actionError.value = '';
  try {
    await apiPost(`${ENDPOINT}/${encodeURIComponent(progressId.value)}/reconcile`, {});
    changedOnce = false;
    polling.value = true;
    job.reload();
  } catch (error) {
    actionError.value = (error as Error).message;
  } finally {
    reconciling.value = false;
  }
}

const acceptedText = computed(() => {
  const action = job.data.value?.action;
  return action === 'PAUSE' ? t('已受理停用。结果不明时只查询状态，不自动重复提交。')
    : action === 'RESUME' ? t('已受理恢复。结果不明时只查询状态，不自动重复提交。')
      : t('已受理移除后继续核对至已移除；结果不明时只查询状态，不自动重复提交。关闭窗口后可从操作记录继续查看。');
});
const itemBadge = (state: string) => (state === 'PAUSED' ? 'COOLING' : state === 'RESUMED' ? 'SUCCESS' : state);
const itemColumns = [
  { key: 'resourceName', label: t('资源名称') },
  { key: 'targetName', label: t('目标') },
  { key: 'state', label: t('状态') },
  { key: 'errorMessage', label: t('说明') },
];

// --- History -------------------------------------------------------------------
const page = ref(1);
const size = ref(20);
const history = useApiData<{ items: LifecycleJob[]; total: number }>(() => (props.state.mode === 'records' ? `${ENDPOINT}?page=${page.value}&size=${size.value}` : null));
const historyColumns = [
  { key: 'action', label: t('操作') },
  { key: 'total', label: t('资源数量'), align: 'right' as const },
  { key: 'state', label: t('状态') },
  { key: 'createdAt', label: t('创建时间'), nowrap: true },
  { key: 'open', label: t('操作'), align: 'right' as const },
];
</script>

<template>
  <Dialog v-if="state.mode === 'progress'" size="lg" :title="t('启停与移除进度')" @close="emit('close')">
    <div class="lc-body">
      <Notice v-if="job.error.value" tone="danger">
        {{ job.error.value }}
        <template #actions><Button size="sm" @click="job.reload()">{{ t('重新加载') }}</Button></template>
      </Notice>
      <div v-else-if="job.loading.value" class="lc-state"><Spinner :size="16" /></div>
      <template v-else-if="job.data.value">
        <p class="lc-summary">
          {{ jobActionLabel(job.data.value.action, job.data.value.items) }} · {{ t('共 {0} 个资源', [job.data.value.total]) }} · {{ jobStateLabel(job.data.value.state) }}
        </p>
        <Notice tone="info">{{ acceptedText }}</Notice>
        <div class="lc-table">
          <DataTable :columns="itemColumns" :rows="job.data.value.items" :row-key="(item: LifecycleJobItem) => item.resourceId" :label="t('启停与移除进度')">
            <template #cell-state="{ row }"><StateBadge :state="itemBadge(row.state)" :label="LIFECYCLE_ITEM_LABELS()[row.state]" /></template>
            <template #cell-errorMessage="{ row }">{{ row.errorMessage || '—' }}</template>
          </DataTable>
        </div>
      </template>
      <Notice v-if="actionError" tone="danger">{{ actionError }}</Notice>
    </div>
    <template v-if="job.data.value && !job.error.value" #footer>
      <Button :disabled="job.refreshing.value" @click="job.reload()">{{ t('刷新进度') }}</Button>
      <Button v-if="job.data.value.items.some((item) => item.state === 'UNKNOWN')" :loading="reconciling" :disabled="reconciling" @click="reconcile">
        {{ reconciling ? t('核对中…') : t('重新核对状态') }}
      </Button>
      <span class="lc-spacer" />
      <Button @click="emit('close')">{{ t('关闭') }}</Button>
    </template>
  </Dialog>

  <Dialog v-else size="lg" :title="t('启停与移除记录')" @close="emit('close')">
    <Notice v-if="history.error.value" tone="danger">
      {{ history.error.value }}
      <template #actions><Button size="sm" @click="history.reload()">{{ t('重新加载') }}</Button></template>
    </Notice>
    <div v-else-if="history.loading.value" class="lc-state"><Spinner :size="16" /></div>
    <template v-else-if="history.data.value?.total">
      <div class="lc-table">
        <DataTable :columns="historyColumns" :rows="history.data.value.items" :row-key="(row: LifecycleJob) => row.id" :label="t('启停与移除记录')">
          <template #cell-action="{ row }">{{ jobActionLabel(row.action, row.items) }}</template>
          <template #cell-state="{ row }">{{ jobStateLabel(row.state) }}</template>
          <template #cell-createdAt="{ row }">{{ formatDateTime(row.createdAt) }}</template>
          <template #cell-open="{ row }"><Button size="sm" variant="ghost" @click="emit('open', row.id)">{{ t('查看结果') }}</Button></template>
        </DataTable>
      </div>
      <Pagination v-model:page="page" v-model:size="size" :total="history.data.value.total" :loading="history.refreshing.value" />
    </template>
    <EmptyState v-else compact />
  </Dialog>
</template>

<style scoped>
.lc-body { display: grid; gap: 14px; }
.lc-state { display: grid; place-items: center; padding: 32px; color: var(--hs-text-3); }
.lc-summary { margin: 0; color: var(--hs-text); font-size: var(--hs-text-md); font-weight: 600; }
.lc-table { border: 1px solid var(--hs-border); border-radius: 12px; overflow: hidden; }
.lc-spacer { flex: 1; }
</style>
