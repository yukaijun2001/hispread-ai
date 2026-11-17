<script setup lang="ts">
// Progress of one proxy replacement job: polled every 3 s until it reaches a
// final state, then `completed` fires once. Items awaiting review are never
// resubmitted automatically; 重新核对 asks the server to check them again.
import { computed, ref, watch } from 'vue';
import Dialog from '../../../components/ui/Dialog.vue';
import Button from '../../../components/ui/Button.vue';
import DataTable from '../../../components/ui/DataTable.vue';
import Notice from '../../../components/ui/Notice.vue';
import Spinner from '../../../components/ui/Spinner.vue';
import { apiPost } from '../../../lib/api';
import { t, translateServerMessage } from '../../../lib/i18n';
import { useSessionStore } from '../../../stores/session';
import { usePolledData } from '../composables/usePolledData';
import { REPLACEMENT_TERMINAL, replacementStateLabel, type ReplacementItem, type ReplacementJob } from '../proxyReplacement';
import { enc } from '../resources';

const props = defineProps<{ id: string }>();
const emit = defineEmits<{ close: []; completed: [] }>();

const session = useSessionStore();
const pollMs = ref(3000);
const job = usePolledData<ReplacementJob>(() => `/resource-proxy-replacements/${enc(props.id)}`, pollMs);
const reconciling = ref(false);
let reported = false;

watch(job.data, (value) => {
  if (value && REPLACEMENT_TERMINAL.has(value.state) && !reported) {
    reported = true;
    pollMs.value = 0;
    emit('completed');
  }
});

async function reconcile() {
  reconciling.value = true;
  try {
    await apiPost(`/resource-proxy-replacements/${enc(props.id)}/reconcile`, {});
    reported = false;
    pollMs.value = 3000;
    session.refresh();
  } catch (error) {
    session.notify(error instanceof Error ? error.message : t('核对失败'), true);
  } finally {
    reconciling.value = false;
  }
}

const data = computed(() => job.data.value);
const columns = [
  { key: 'resourceName', label: t('资源') },
  { key: 'proxyName', label: t('目标代理') },
  { key: 'state', label: t('结果') },
  { key: 'note', label: t('说明') },
];
const itemNote = (item: ReplacementItem) => (item.error ? translateServerMessage(item.error) : '') || (item.bindingApplied ? t('已核对绑定 · 服务待验证') : '—');
</script>

<template>
  <Dialog drawer size="lg" :title="t('代理更换进度')" :subtitle="t('进度自动更新；关闭后仍可从更换记录查看')" @close="emit('close')">
    <div class="rs-progress">
      <Notice v-if="job.error.value" tone="danger">{{ job.error.value }}</Notice>
      <p v-if="!data && !job.error.value" class="rs-progress-loading" role="status"><Spinner :size="16" />{{ t('加载进度中…') }}</p>
      <template v-if="data">
        <section class="rs-progress-hero">
          <div class="rs-progress-heading">
            <strong>{{ replacementStateLabel(data.state) }}</strong>
            <span>{{ data.finished }}/{{ data.total }} {{ t('已结束') }}</span>
          </div>
          <progress class="rs-progress-bar" :max="data.total || 1" :value="data.finished" :aria-label="t('代理更换进度')" />
          <dl class="rs-progress-counts">
            <div><dt>{{ t('绑定完成') }}</dt><dd>{{ data.DONE ?? 0 }}</dd></div>
            <div><dt>{{ t('已是目标') }}</dt><dd>{{ data.SKIPPED ?? 0 }}</dd></div>
            <div><dt>{{ t('失败') }}</dt><dd>{{ data.FAILED ?? 0 }}</dd></div>
            <div><dt>{{ t('待核对') }}</dt><dd>{{ data.NEEDS_REVIEW ?? 0 }}</dd></div>
          </dl>
        </section>
        <Notice v-if="data.error" tone="danger">{{ translateServerMessage(data.error) }}</Notice>
        <Notice tone="info">
          {{ t('绑定完成表示已核对代理绑定，服务可用性尚未验证。待核对项不会自动重复提交。') }}
          <template v-if="data.state === 'NEEDS_REVIEW'" #actions>
            <Button size="sm" :disabled="reconciling" :loading="reconciling" @click="reconcile">{{ reconciling ? t('请求中…') : t('重新核对') }}</Button>
          </template>
        </Notice>
        <div class="rs-progress-table">
          <DataTable :columns="columns" :rows="data.items ?? []" :row-key="(row: ReplacementItem) => `${row.resourceName}-${row.proxyName}`" :label="t('代理更换进度')">
            <template #cell-state="{ row }">{{ replacementStateLabel(row.state) }}</template>
            <template #cell-note="{ row }">{{ itemNote(row) }}</template>
          </DataTable>
        </div>
      </template>
    </div>
  </Dialog>
</template>

<style scoped>
.rs-progress { display: grid; gap: 14px; }
.rs-progress-loading { display: flex; align-items: center; gap: 8px; margin: 0; color: var(--hs-text-3); }
.rs-progress-hero { display: grid; gap: 10px; padding: 16px 18px; background: var(--hs-surface-subtle); border: 1px solid var(--hs-border); border-radius: 14px; }
.rs-progress-heading { display: flex; align-items: baseline; justify-content: space-between; gap: 12px; }
.rs-progress-heading strong { font-size: var(--hs-text-md, 16px); font-weight: 600; }
.rs-progress-heading span { color: var(--hs-text-3); font-size: var(--hs-text-sm); font-variant-numeric: tabular-nums; }
.rs-progress-bar { width: 100%; height: 8px; accent-color: var(--hs-accent); }
.rs-progress-counts { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 8px; margin: 0; }
.rs-progress-counts div { display: grid; gap: 2px; }
.rs-progress-counts dt { color: var(--hs-text-3); font-size: var(--hs-text-xs); }
.rs-progress-counts dd { margin: 0; font-weight: 600; font-variant-numeric: tabular-nums; }
.rs-progress-table { border: 1px solid var(--hs-border); border-radius: 12px; overflow: hidden; }
</style>
