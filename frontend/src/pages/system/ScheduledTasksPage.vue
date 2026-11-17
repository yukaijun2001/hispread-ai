<script setup lang="ts">
// scheduled-tasks: receipts of onboarding / authorization / delivery operations
// (re-query the original result when it is unknown) and, for platform admins,
// the delivery status sync schedule.
import { computed, ref } from 'vue';
import { useRouter } from 'vue-router';
import PageHeader from '../../components/ui/PageHeader.vue';
import Badge from '../../components/ui/Badge.vue';
import Button from '../../components/ui/Button.vue';
import DataTable from '../../components/ui/DataTable.vue';
import FormField from '../../components/ui/FormField.vue';
import Notice from '../../components/ui/Notice.vue';
import Pagination from '../../components/ui/Pagination.vue';
import Segmented from '../../components/ui/Segmented.vue';
import TextInput from '../../components/ui/TextInput.vue';
import FormDialog from './components/FormDialog.vue';
import { useApiData } from '../../composables/useApiData';
import { apiPost, apiPut } from '../../lib/api';
import { formatDateTime } from '../../lib/money';
import { t } from '../../lib/i18n';
import { useSessionStore } from '../../stores/session';
import { deliveryTaskState, deliveryTaskTone, deliveryTaskType, type AutomaticTask, type DeliveryTask } from './scheduled/scheduledTasks';

defineProps<{ route: string }>();
const session = useSessionStore();
const router = useRouter();
const user = computed(() => session.user!);

const page = ref(1);
const size = ref(20);
const reviewOnly = ref(false);
const pending = ref('');
const error = ref('');

const receipts = useApiData<{ items: DeliveryTask[]; total: number }>(() => `/delivery-tasks?page=${page.value}&size=${size.value}${reviewOnly.value ? '&needsReview=true' : ''}`);
const automatic = useApiData<AutomaticTask[]>(() => (user.value.role === 'ADMIN' && session.has('system.settings') ? '/system/scheduled-tasks' : null));
const canReconcile = computed(() => session.has('resource.dispatch') || session.has('resource.write'));

function toggleReviewOnly() { reviewOnly.value = !reviewOnly.value; page.value = 1; }

function openResource(task: DeliveryTask) {
  router.push({ path: user.value.supplierId ? '/deliveries' : '/resources', query: { id: task.resourceId! } });
}

async function reconcile(task: DeliveryTask) {
  if (pending.value) return;
  pending.value = task.id;
  error.value = '';
  try {
    await apiPost(`/delivery-tasks/${encodeURIComponent(task.id)}/reconcile`, {});
    session.refresh();
    session.notify(t('原操作结果已更新'));
  } catch (reason) {
    error.value = (reason as Error).message;
  } finally {
    pending.value = '';
  }
}

const columns = [
  { key: 'type', label: t('任务'), nowrap: true },
  { key: 'resource', label: t('资源 / 项目') },
  { key: 'state', label: t('结果'), nowrap: true },
  { key: 'createdAt', label: t('提交时间'), nowrap: true },
  { key: 'actions', label: t('操作'), nowrap: true },
];

// --- Status sync settings ---------------------------------------------------
const config = ref<AutomaticTask | null>(null);
const enabled = ref<'false' | 'true'>('false');
const intervalMinutes = ref('');
const enabledOptions = [{ value: 'false' as const, label: t('关闭') }, { value: 'true' as const, label: t('启用') }];

function openConfig(task: AutomaticTask) {
  enabled.value = String(!!task.enabled) as 'false' | 'true';
  intervalMinutes.value = String(Math.max(10, task.intervalMinutes || 30));
  config.value = task;
}

async function saveConfig() {
  const task = config.value!;
  await apiPut(`/system/scheduled-tasks/${encodeURIComponent(task.key)}/config`, {
    version: task.version, enabled: enabled.value === 'true', intervalMinutes: Number(intervalMinutes.value),
  });
  session.refresh();
  session.notify(t('状态同步设置已保存'));
}
</script>

<template>
  <div class="st-page">
    <PageHeader :title="t('上号与交付任务')" :description="t('查看上号、授权和交付处理结果；结果待核对时查询原操作。')">
      <template #actions>
        <Button v-if="session.has('system.settings')" icon="clock" @click="router.push('/scheduled-task-runs')">{{ t('查看历史同步记录') }}</Button>
        <Button icon="refresh" @click="session.refresh()">{{ t('刷新') }}</Button>
      </template>
    </PageHeader>

    <Notice v-if="error" tone="danger">{{ error }}</Notice>

    <section class="st-card">
      <header class="st-head">
        <h2 id="delivery-task-table-title">{{ t('上号与交付任务') }}</h2>
        <Button size="sm" @click="toggleReviewOnly">{{ t(reviewOnly ? '查看全部' : '只看处理中与待核对') }}</Button>
      </header>
      <DataTable
        :columns="columns"
        :rows="receipts.data.value?.items"
        :row-key="(row: DeliveryTask) => row.id"
        :loading="receipts.loading.value"
        :refreshing="receipts.refreshing.value"
        :error="receipts.error.value"
        :label="t('上号与交付任务')"
        @retry="receipts.reload()"
      >
        <template #cell-type="{ row }">{{ deliveryTaskType(row.type) }}</template>
        <template #cell-resource="{ row }">
          <div class="st-cell"><span>{{ row.resourceName || t('批量交付') }}</span><small>{{ row.projectName || t('{0} 个资源', [row.itemCount]) }}</small></div>
        </template>
        <template #cell-state="{ row }"><Badge :tone="deliveryTaskTone(row.state)" dot>{{ deliveryTaskState(row.state) }}</Badge></template>
        <template #cell-createdAt="{ row }"><span class="st-time">{{ formatDateTime(row.createdAt) }}</span></template>
        <template #cell-actions="{ row }">
          <div class="st-actions">
            <Button v-if="row.resourceId" size="sm" variant="ghost" @click="openResource(row)">{{ t('查看资源') }}</Button>
            <Button v-if="row.needsReview && canReconcile" size="sm" :disabled="!!pending" @click="reconcile(row)">{{ t(pending === row.id ? '查询中…' : '查询原结果') }}</Button>
          </div>
        </template>
      </DataTable>
      <Pagination v-model:page="page" v-model:size="size" :total="receipts.data.value?.total ?? 0" :loading="receipts.loading.value" />
    </section>

    <Notice v-if="automatic.error.value" tone="danger">{{ automatic.error.value }}</Notice>
    <section v-for="task in automatic.data.value ?? []" :key="task.key" class="st-card st-sync">
      <div class="st-sync-text">
        <h2>{{ t('交付状态同步') }}</h2>
        <p>{{ t(task.enabled ? '已启用，每 {0} 分钟只读更新账号状态' : '默认关闭；需要时可按 10 分钟至 1 天的周期更新已交付账号状态。', [task.intervalMinutes]) }}</p>
      </div>
      <Button icon="settings" @click="openConfig(task)">{{ t('设置') }}</Button>
    </section>

    <FormDialog
      v-if="config"
      :title="t('交付状态同步设置')"
      :subtitle="t('仅更新账号健康和交付状态。费用、日账和权重不随此任务同步。')"
      :on-submit="saveConfig"
      @close="config = null"
    >
      <template #default="{ busy }">
        <FormField :label="t('自动同步')" required>
          <Segmented v-model="enabled" :options="enabledOptions" :label="t('自动同步')" />
        </FormField>
        <FormField :label="t('同步间隔（分钟）')" required>
          <template #default="{ id }">
            <TextInput :id="id" v-model="intervalMinutes" type="number" min="10" max="1440" step="1" required :disabled="busy" />
          </template>
        </FormField>
      </template>
    </FormDialog>
  </div>
</template>

<style scoped>
.st-page { display: grid; gap: 16px; }
.st-page > .hs-page-header { margin-bottom: 4px; }
.st-card { background: var(--hs-surface); border: 1px solid var(--hs-border); border-radius: var(--hs-radius-card); box-shadow: var(--hs-shadow-card); overflow: hidden; }
.st-head { display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: 8px 16px; padding: 14px 16px; }
.st-head h2, .st-sync h2 { margin: 0; color: var(--hs-text); font-size: var(--hs-text-md); font-weight: 600; }
.st-cell { display: grid; gap: 2px; min-width: 0; }
.st-cell span { color: var(--hs-text); overflow-wrap: anywhere; }
.st-cell small { color: var(--hs-text-3); font-size: var(--hs-text-xs); }
.st-time { color: var(--hs-text-2); font-variant-numeric: tabular-nums; }
.st-actions { display: flex; flex-wrap: wrap; align-items: center; gap: 6px; }
.st-sync { display: flex; flex-wrap: wrap; align-items: center; gap: 12px 16px; padding: 16px 18px; }
.st-sync-text { flex: 1 1 320px; min-width: 0; }
.st-sync-text p { margin: 4px 0 0; color: var(--hs-text-3); font-size: var(--hs-text-sm); line-height: 1.6; }
</style>
