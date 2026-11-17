<script setup lang="ts">
import { computed, ref } from 'vue';
import PageHeader from '../../components/ui/PageHeader.vue';
import Button from '../../components/ui/Button.vue';
import DataTable from '../../components/ui/DataTable.vue';
import Dialog from '../../components/ui/Dialog.vue';
import Notice from '../../components/ui/Notice.vue';
import EmptyState from '../../components/ui/EmptyState.vue';
import InfoGrid from './components/InfoGrid.vue';
import PriorityHistoryDialog from './PriorityHistoryDialog.vue';
import TargetForm from './TargetForm.vue';
import { useApiData } from '../../composables/useApiData';
import { ApiError, apiDelete, apiPost } from '../../lib/api';
import { t } from '../../lib/i18n';
import { useSessionStore } from '../../stores/session';

interface ResourceTarget {
  id: string;
  name: string;
  protocol?: string;
  baseUrl?: string;
  enabled?: boolean;
  defaultTarget?: boolean;
  version: number;
  adminUsername?: string;
  adminPasswordConfigured?: boolean;
  apiKeyConfigured?: boolean;
  newApiUserId?: string | number;
  allowHttp?: boolean;
}

defineProps<{ route: string }>();
const session = useSessionStore();
const canRead = computed(() => session.has('resource.config.read'));
const canWrite = computed(() => session.has('resource.config.write'));
const targets = useApiData<ResourceTarget[]>(() => (canRead.value ? '/resource-targets' : null));

const showHistory = ref(false);
const selected = ref<ResourceTarget | null>(null);
const editing = ref<ResourceTarget | 'new' | null>(null);
const busy = ref(false);
const error = ref('');
const removing = ref<ResourceTarget | null>(null);
const removeError = ref('');

const protocolLabel = (value?: string) => ({ NEWAPI: 'New API', CCMAX_NATIVE: 'CCMAX', CUSTOM: t('兼容接入（已有配置）') } as Record<string, string>)[value || 'CUSTOM'] || value;
const columns = computed(() => [
  { key: 'name', label: t('接入名称') },
  { key: 'protocol', label: t('接入类型') },
  ...(canWrite.value ? [{ key: 'baseUrl', label: t('服务地址') }] : []),
  { key: 'enabled', label: t('状态') },
  { key: 'defaultTarget', label: t('默认接入') },
  { key: 'actions', label: t('操作'), nowrap: true },
]);

function open(target: ResourceTarget) { selected.value = target; error.value = ''; }
function askRemove(target: ResourceTarget) { removing.value = target; removeError.value = ''; selected.value = null; }

async function remove() {
  const target = removing.value;
  if (busy.value || !target) return;
  busy.value = true;
  removeError.value = '';
  try {
    await apiDelete(`/resource-targets/${encodeURIComponent(target.id)}?version=${encodeURIComponent(target.version)}`);
  } catch (reason) {
    if (!(reason instanceof ApiError) || reason.status !== 404) {
      busy.value = false;
      removeError.value = reason instanceof Error ? reason.message : t('删除失败，请重试');
      return;
    }
  }
  busy.value = false;
  removing.value = null;
  targets.reload();
  session.refresh();
  session.notify(t('接入配置已删除'));
}

async function check() {
  const target = selected.value;
  if (busy.value || !target) return;
  busy.value = true;
  error.value = '';
  try {
    const result = await apiPost<{ message?: string }>(`/resource-targets/${encodeURIComponent(target.id)}/test`, {});
    session.notify(result.message || t('连接检查成功'));
  } catch (reason) {
    error.value = reason instanceof Error ? reason.message : t('操作失败');
  } finally {
    busy.value = false;
  }
}

function credential(target: ResourceTarget) {
  const configured = target.protocol === 'CCMAX_NATIVE' ? target.adminPasswordConfigured : target.apiKeyConfigured;
  return configured ? t('已配置') : t('未配置');
}
</script>

<template>
  <EmptyState v-if="!canRead" error icon="settings" :text="t('当前账号无权访问此页面')" />
  <div v-else class="targets">
    <PageHeader :title="t('资源接口配置')">
      <template #actions>
        <Button v-if="session.has('resource.dispatch')" @click="showHistory = true">{{ t('历史调度记录') }}</Button>
        <Button v-if="canWrite" variant="primary" icon="plus" @click="editing = 'new'">{{ t('新增接入') }}</Button>
      </template>
    </PageHeader>

    <section class="card">
      <DataTable
        :columns="columns"
        :rows="targets.data.value"
        :row-key="(row: ResourceTarget) => row.id"
        :loading="targets.loading.value"
        :refreshing="targets.refreshing.value"
        :error="targets.error.value"
        :label="t('资源接口配置')"
        @retry="targets.reload()"
        @row-click="open"
      >
        <template #cell-name="{ row }"><strong>{{ row.name }}</strong></template>
        <template #cell-protocol="{ row }">{{ protocolLabel(row.protocol || 'CUSTOM') }}</template>
        <template #cell-baseUrl="{ row }">{{ row.baseUrl || '—' }}</template>
        <template #cell-enabled="{ row }">{{ row.enabled ? t('已启用') : t('已停用') }}</template>
        <template #cell-defaultTarget="{ row }">{{ row.defaultTarget ? t('是') : '—' }}</template>
        <template #cell-actions="{ row }">
          <div class="actions">
            <button type="button" class="action" @click.stop="open(row)">{{ t('查看') }}</button>
            <button v-if="canWrite" type="button" class="action danger" @click.stop="askRemove(row)">{{ t('删除') }}</button>
          </div>
        </template>
      </DataTable>
    </section>

    <Dialog v-if="selected" :title="selected.name" @close="busy || (selected = null)">
      <div class="detail">
        <InfoGrid :items="[
          { key: 'protocol', label: t('接入类型'), value: protocolLabel(selected.protocol || 'CUSTOM') },
          ...(canWrite ? [
            { key: 'baseUrl', label: t('服务地址'), value: selected.baseUrl || '—' },
            { key: 'credential', label: t('管理凭据'), value: credential(selected) },
          ] : []),
          { key: 'enabled', label: t('状态'), value: selected.enabled ? t('已启用') : t('已停用') },
          { key: 'defaultTarget', label: t('默认接入'), value: selected.defaultTarget ? t('是') : t('否') },
        ]" />
        <p>{{ t('在资源列表关联已有账号；新增上号请从交付流程发起。') }}</p>
        <Notice v-if="error" tone="danger">{{ error }}</Notice>
      </div>
      <template #footer>
        <Button v-if="session.has('resource.config.test')" :disabled="busy || !selected.enabled" @click="check">{{ busy ? t('正在检查…') : t('检查连接') }}</Button>
        <Button v-if="canWrite" :disabled="busy" @click="editing = selected; selected = null">{{ t('编辑') }}</Button>
        <Button v-if="canWrite" variant="danger" :disabled="busy" @click="askRemove(selected)">{{ t('删除') }}</Button>
        <Button :disabled="busy" @click="selected = null">{{ t('关闭') }}</Button>
      </template>
    </Dialog>

    <Dialog v-if="removing" size="sm" :title="t('删除资源接入')" @close="busy || (removing = null)">
      <div class="detail">
        <Notice tone="warning">{{ t('确定删除“{0}”吗？删除后不能再用此接入上号或同步。仍有资源使用时会拒绝删除。', [removing.name]) }}</Notice>
        <Notice v-if="removeError" tone="danger">{{ removeError }}</Notice>
      </div>
      <template #footer>
        <Button :disabled="busy" @click="removing = null">{{ t('取消') }}</Button>
        <Button variant="danger" :disabled="busy" @click="remove">{{ busy ? t('正在删除…') : t('确认删除') }}</Button>
      </template>
    </Dialog>

    <PriorityHistoryDialog v-if="showHistory" @close="showHistory = false" />
    <TargetForm v-if="editing" :target="editing" @close="editing = null" @saved="targets.reload(); session.refresh(); session.notify(t('接入配置已保存'))" />
  </div>
</template>

<style scoped>
.card { background: var(--hs-surface); border: 1px solid var(--hs-border); border-radius: var(--hs-radius-card); box-shadow: var(--hs-shadow-card); overflow: hidden; }
.detail { display: grid; gap: 14px; }
.detail p { margin: 0; color: var(--hs-text-3); font-size: var(--hs-text-sm); line-height: 1.7; }
.actions { display: flex; gap: 12px; }
.action { padding: 0; color: var(--hs-accent); background: none; border: 0; font: inherit; font-size: var(--hs-text-xs); cursor: pointer; }
.action:hover { color: var(--hs-accent-hover); text-decoration: underline; text-underline-offset: 3px; }
.action.danger { color: var(--hs-danger); }
strong { color: var(--hs-text); font-weight: 500; }
</style>
