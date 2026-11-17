<script setup lang="ts">
import { computed, ref } from 'vue';
import Dialog from '../../components/ui/Dialog.vue';
import Button from '../../components/ui/Button.vue';
import DataTable from '../../components/ui/DataTable.vue';
import Notice from '../../components/ui/Notice.vue';
import InfoGrid from './components/InfoGrid.vue';
import { useApiData } from '../../composables/useApiData';
import { apiPost } from '../../lib/api';
import { t } from '../../lib/i18n';
import { formatDateTime } from '../../lib/money';
import { useSessionStore } from '../../stores/session';

interface PriorityJob {
  id: string;
  createdAt?: string;
  total?: number;
  state?: string;
  protocol?: string;
  items?: Array<{ resourceName?: string; resourceId?: string; priority?: number | string; state?: string }>;
}

const emit = defineEmits<{ close: [] }>();
const session = useSessionStore();
const root = '/cc-intake/admin/priority/jobs';
const permitted = computed(() => session.user?.role === 'ADMIN' && session.has('resource.dispatch'));
const history = useApiData<PriorityJob[]>(() => (permitted.value ? root : null));
const selected = ref<PriorityJob | null>(null);
const detail = useApiData<PriorityJob>(() => (permitted.value && selected.value ? `${root}/${encodeURIComponent(selected.value.id)}` : null));
const current = computed(() => detail.data.value || selected.value);
const itemRows = computed(() => (current.value?.items || []).map((item, index) => ({ ...item, key: item.resourceId || `item-${index}` })));
const busy = ref(false);
const error = ref('');

const labels: Record<string, string> = {
  PREVIEW: t('旧预览（已停用）'), RUNNING: t('处理中'), UNKNOWN: t('待核对'), PARTIAL_FAILED: t('部分失败'),
  FAILED: t('失败'), COMPLETED: t('已完成'), SUCCESS: t('成功'),
};
const label = (value?: string) => (value && labels[value]) || value || '—';
const reconcilable = computed(() => {
  const job = current.value;
  return !!job && ['NEWAPI', 'CCMAX_NATIVE'].includes(job.protocol || '') && ['PREVIEW', 'UNKNOWN', 'RUNNING', 'PREPARING', 'PARTIAL_FAILED'].includes(job.state || '');
});

function close() { if (!busy.value) emit('close'); }
function open(row: PriorityJob) { selected.value = row; error.value = ''; }
function back() { selected.value = null; error.value = ''; }

async function reconcile() {
  const job = current.value;
  if (busy.value || !job) return;
  busy.value = true;
  error.value = '';
  try {
    const result = await apiPost<PriorityJob>(`${root}/${encodeURIComponent(job.id)}/reconcile`, {});
    selected.value = result;
    detail.reload();
    history.reload();
    session.notify(result.state === 'COMPLETED' ? t('原结果已确认') : result.state === 'PREVIEW' ? t('此旧任务未执行，已停用') : t('已查询原结果，请核对记录'));
  } catch (reason) {
    error.value = reason instanceof Error ? reason.message : t('操作失败');
  } finally {
    busy.value = false;
  }
}
</script>

<template>
  <Dialog size="xl" :title="t('历史调度记录')" @close="close">
    <div class="history">
      <p>{{ t('保留旧调整记录供核对。新的权重与优先级调整请在上游管理台处理。') }}</p>
      <Notice v-if="!permitted" tone="danger">{{ t('当前账号无权访问历史记录') }}</Notice>
      <template v-else-if="current">
        <InfoGrid :items="[
          { key: 'createdAt', label: t('创建时间'), value: formatDateTime(current.createdAt) },
          { key: 'total', label: t('账号数量'), value: current.total ?? '—' },
          { key: 'state', label: t('结果'), value: label(current.state) },
        ]" />
        <DataTable
          :columns="[{ key: 'resource', label: t('资源') }, { key: 'priority', label: t('原调整值') }, { key: 'state', label: t('结果') }]"
          :rows="itemRows"
          :row-key="(row) => row.key"
          :loading="detail.loading.value"
          :error="detail.error.value"
          :label="t('历史调度记录')"
          @retry="detail.reload()"
        >
          <template #cell-resource="{ row }">{{ row.resourceName || row.resourceId || '—' }}</template>
          <template #cell-priority="{ row }">{{ row.priority ?? '—' }}</template>
          <template #cell-state="{ row }">{{ label(row.state) }}</template>
        </DataTable>
        <Notice v-if="!['NEWAPI', 'CCMAX_NATIVE'].includes(current.protocol || '')">{{ t('此旧接入没有只读核对协议，请在上游核实结果。') }}</Notice>
      </template>
      <DataTable
        v-else
        :columns="[{ key: 'createdAt', label: t('创建时间') }, { key: 'total', label: t('账号数量') }, { key: 'state', label: t('结果') }, { key: 'actions', label: t('操作'), nowrap: true }]"
        :rows="history.data.value"
        :row-key="(row: PriorityJob) => row.id"
        :loading="history.loading.value"
        :error="history.error.value"
        :label="t('历史调度记录')"
        @retry="history.reload()"
        @row-click="open"
      >
        <template #cell-createdAt="{ row }">{{ formatDateTime(row.createdAt) }}</template>
        <template #cell-total="{ row }">{{ row.total ?? '—' }}</template>
        <template #cell-state="{ row }">{{ label(row.state) }}</template>
        <template #cell-actions="{ row }"><button type="button" class="action" @click.stop="open(row)">{{ t('查看') }}</button></template>
      </DataTable>
      <Notice v-if="error" tone="danger">{{ error }}</Notice>
    </div>
    <template #footer>
      <Button v-if="current" :disabled="busy" @click="back">{{ t('返回记录') }}</Button>
      <Button v-if="reconcilable" :disabled="busy || detail.loading.value || !!detail.error.value" @click="reconcile">{{ busy ? t('正在查询…') : t('查询原结果') }}</Button>
      <Button :disabled="busy" @click="close">{{ t('关闭') }}</Button>
    </template>
  </Dialog>
</template>

<style scoped>
.history { display: grid; gap: 14px; }
.history p { margin: 0; color: var(--hs-text-3); font-size: var(--hs-text-sm); line-height: 1.7; }
.action { padding: 0; color: var(--hs-accent); background: none; border: 0; font: inherit; font-size: var(--hs-text-xs); cursor: pointer; }
.action:hover { color: var(--hs-accent-hover); text-decoration: underline; text-underline-offset: 3px; }
</style>
