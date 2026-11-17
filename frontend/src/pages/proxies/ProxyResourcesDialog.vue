<script setup lang="ts">
// Resources bound to one proxy, limited to what the current account may see.
import Dialog from '../../components/ui/Dialog.vue';
import DataTable from '../../components/ui/DataTable.vue';
import Notice from '../../components/ui/Notice.vue';
import Badge from '../../components/ui/Badge.vue';
import { useApiData } from '../../composables/useApiData';
import { t } from '../../lib/i18n';
import type { BoundResource, OutboundProxy } from './proxies';

const props = defineProps<{ proxy: OutboundProxy }>();
const emit = defineEmits<{ close: [] }>();

const resources = useApiData<BoundResource[]>(`/outbound-proxies/${encodeURIComponent(props.proxy.id)}/resources`);
const columns = [
  { key: 'name', label: t('资源名称') },
  { key: 'accountName', label: t('CCMAX账号名称') },
  { key: 'projectName', label: t('项目') },
  { key: 'creatorName', label: t('提交账号') },
  { key: 'state', label: t('状态'), width: '96px' },
];
</script>

<template>
  <Dialog size="lg" :title="t('{0} · 绑定资源', [proxy.name])" @close="emit('close')">
    <div class="body">
      <p class="lead">{{ t('本代理已交付 ') }}<strong>{{ proxy.usedResources }}</strong>{{ t(' 条资源；当前账号仅可查看自己有权限的明细。') }}</p>
      <Notice v-if="resources.error.value" tone="danger">{{ resources.error.value }}</Notice>
      <div v-else class="table">
        <DataTable
          :columns="columns"
          :rows="resources.loading.value ? [] : resources.data.value ?? []"
          :row-key="(row: BoundResource) => `${row.name}-${row.accountName}-${row.projectName}-${row.creatorName}`"
          :loading="resources.loading.value"
          :label="t('{0} · 绑定资源', [proxy.name])"
        >
          <template #cell-accountName="{ row }">{{ row.accountName || t('待填写') }}</template>
          <template #cell-state="{ row }">
            <Badge :tone="row.state === 'DELIVERED' ? 'success' : 'neutral'" dot>{{ row.state === 'DELIVERED' ? t('已交付') : t('草稿') }}</Badge>
          </template>
        </DataTable>
      </div>
    </div>
  </Dialog>
</template>

<style scoped>
.body { display: grid; gap: 14px; }
.lead { margin: 0; color: var(--hs-text-2); font-size: var(--hs-text-sm); line-height: 1.7; }
.lead strong { color: var(--hs-text); font-variant-numeric: tabular-nums; }
.table { border: 1px solid var(--hs-border); border-radius: 12px; overflow: hidden; }
</style>
