<script setup lang="ts">
// Detail of a resource linked to an existing NewAPI channel: usage query and
// pause / resume through a lifecycle job. Every action re-reads the resource
// first; an unconfirmed job blocks further actions until it is reconciled.
import { computed, ref, shallowRef } from 'vue';
import Dialog from '../../../components/ui/Dialog.vue';
import Button from '../../../components/ui/Button.vue';
import Notice from '../../../components/ui/Notice.vue';
import DetailList from '../../../components/ui/DetailList.vue';
import { apiFetch, apiPost } from '../../../lib/api';
import { t } from '../../../lib/i18n';
import { useSessionStore } from '../../../stores/session';
import { beijingDateTime, enc, type Resource } from '../resources';
import { createLifecycleIntent, lifecycleOutcome, type LifecycleReceipt } from '../runtime/lifecycleIntent';
import ChannelUsage from './ChannelUsage.vue';
import { channelLabel } from './newapiChannel';

type Action = 'usage' | 'PAUSE' | 'RESUME' | 'reconcile';

const props = defineProps<{ resource: Resource }>();
const emit = defineEmits<{ close: []; changed: [] }>();

const session = useSessionStore();
const current = shallowRef<Resource>(props.resource);
const busy = ref(false);
const error = ref('');
const status = ref('');
const confirmation = ref<'' | 'PAUSE' | 'RESUME'>('');
const uncertainJob = ref<{ id?: string; requestKey: string } | null>(null);
const lifecycle = createLifecycleIntent({ get: apiFetch, post: apiPost });

const allowed = computed(() => !current.value.readOnly && session.has(session.user?.supplierId ? 'resource.write' : 'resource.dispatch'));
const removed = computed(() => current.value.operationalState === 'GONE');
const paused = computed(() => current.value.operationalState === 'PAUSED');
const details = computed<Array<[string, string | null | undefined]>>(() => [
  [t('资源名称'), current.value.name],
  [t('渠道 ID'), current.value.upstreamChannelId],
  [t('供应商'), current.value.supplierName || '—'],
  [t('项目'), current.value.projectName],
  [t('渠道状态'), channelLabel(current.value)],
]);

async function run(action: Action) {
  if (busy.value) return;
  busy.value = true; error.value = ''; status.value = '';
  const path = `/resources/${enc(current.value.id)}`;
  try {
    const latest = await apiFetch<Resource>(path);
    current.value = latest;
    if (latest.operationalState === 'GONE' && action !== 'reconcile') {
      emit('changed');
      throw new Error(t('渠道已移除，不可再操作'));
    }
    let result: LifecycleReceipt | undefined;
    if (action === 'usage') {
      const usage = await apiPost<{ state: string }>(`${path}/usage`, { requestKey: crypto.randomUUID() });
      if (usage.state !== 'UPDATED') throw new Error(t('用量暂未更新：{0}', [usage.state]));
    }
    if (action === 'PAUSE' || action === 'RESUME') {
      result = await lifecycle.start(action, [{ resourceId: latest.id, resourceVersion: latest.version }]);
    }
    if (action === 'reconcile') result = await lifecycle.reconcile();
    if (action !== 'usage' && lifecycleOutcome(result) !== 'success') {
      emit('changed');
      const item = result?.items?.[0];
      throw new Error(lifecycleOutcome(result) === 'pending'
        ? t('渠道操作结果尚未确认，请核对原启停操作，勿重复提交')
        : t('渠道操作未成功：{0}', [item?.errorMessage || item?.errorCode || result?.state]));
    }
    current.value = await apiFetch<Resource>(path);
    emit('changed');
    status.value = t('渠道信息已更新');
  } catch (failure) {
    error.value = (failure as Error).message;
  } finally {
    uncertainJob.value = lifecycle.pending();
    busy.value = false;
    confirmation.value = '';
  }
}
</script>

<template>
  <Dialog size="lg" :title="t('New API 渠道详情')" @close="emit('close')">
    <div class="rs-body">
      <DetailList :items="details" />
      <Notice>{{ t('此资源关联上游已有渠道，不代表新建交付成功；配额保持上游原始单位。') }}</Notice>
      <Notice v-if="removed" tone="warning">{{ t('该渠道已移除，仅保留历史信息。') }}</Notice>
      <section class="rs-section">
        <h3>{{ t('渠道用量') }}</h3>
        <ChannelUsage :resource="current" />
        <p class="rs-muted">{{ t('查询时间：{0}', [beijingDateTime(current.usage?.queriedAt as string | null, t('未查询'))]) }}</p>
      </section>
      <Notice v-if="error" tone="danger">{{ error }}</Notice>
      <Notice v-else-if="status">{{ status }}</Notice>
      <Notice v-if="uncertainJob" tone="warning">
        {{ t('原启停操作尚未确认，已暂停再次执行。查询仅核对原操作，不重复停用或恢复渠道。') }}
        <template #actions><Button size="sm" :disabled="busy" @click="run('reconcile')">{{ t('核对原启停操作') }}</Button></template>
      </Notice>
      <template v-if="allowed && !uncertainJob">
        <Notice v-if="confirmation" tone="warning">
          {{ confirmation === 'PAUSE' ? t('确认临时停用该真实渠道？') : t('确认恢复该真实渠道？') }}
          <template #actions>
            <Button size="sm" :disabled="busy" @click="run(confirmation)">{{ t('确认执行') }}</Button>
            <Button size="sm" variant="ghost" :disabled="busy" @click="confirmation = ''">{{ t('取消') }}</Button>
          </template>
        </Notice>
        <div v-else class="rs-actions">
          <Button :disabled="busy || removed" @click="confirmation = paused ? 'RESUME' : 'PAUSE'">{{ paused ? t('恢复启用') : t('停用渠道') }}</Button>
        </div>
      </template>
    </div>
    <template #footer>
      <Button v-if="session.has('resource.usage')" :disabled="busy || removed" @click="run('usage')">{{ busy ? t('处理中…') : t('查询状态和配额') }}</Button>
      <Button @click="emit('close')">{{ t('关闭') }}</Button>
    </template>
  </Dialog>
</template>

<style scoped>
.rs-body { display: grid; gap: 14px; }
.rs-section { display: grid; gap: 6px; padding-top: 4px; }
.rs-section h3 { margin: 0; color: var(--hs-text); font-size: var(--hs-text-md); font-weight: 600; }
.rs-muted { margin: 0; color: var(--hs-text-3); font-size: var(--hs-text-xs); }
.rs-actions { display: flex; flex-wrap: wrap; gap: 8px; }
</style>
