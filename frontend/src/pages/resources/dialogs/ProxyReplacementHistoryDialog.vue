<script setup lang="ts">
// Proxy replacement jobs, mine or the whole scope, refreshed every 5 s.
import { computed, ref } from 'vue';
import Dialog from '../../../components/ui/Dialog.vue';
import Button from '../../../components/ui/Button.vue';
import DataTable from '../../../components/ui/DataTable.vue';
import Pagination from '../../../components/ui/Pagination.vue';
import Select from '../../../components/ui/Select.vue';
import { useApiData } from '../../../composables/useApiData';
import { t } from '../../../lib/i18n';
import { formatDateTime } from '../../../lib/money';
import { useSessionStore } from '../../../stores/session';
import { replacementStateLabel, type ReplacementJob } from '../proxyReplacement';
import { enc } from '../resources';

const props = defineProps<{ resourceId?: string }>();
const emit = defineEmits<{ close: []; open: [id: string] }>();

const session = useSessionStore();
const scope = ref<'mine' | 'all'>('mine');
const page = ref(1);
const size = ref(10);
const records = useApiData<{ items: ReplacementJob[]; total: number }>(
  () => `/resource-proxy-replacements?scope=${scope.value}&page=${page.value}&size=10${props.resourceId ? `&resourceId=${enc(props.resourceId)}` : ''}`,
  { pollMs: 5000 },
);

const scopeOptions = computed(() => [
  { value: 'mine' as const, label: t('我的操作') },
  { value: 'all' as const, label: session.user?.supplierId ? t('本供应商全部操作') : t('全部操作') },
]);
const scopeValue = computed({
  get: () => scope.value,
  set: (value: string) => { scope.value = value === 'all' ? 'all' : 'mine'; page.value = 1; },
});
const columns = [
  { key: 'createdAt', label: t('操作时间'), nowrap: true },
  { key: 'creatorName', label: t('操作人') },
  { key: 'mode', label: t('类型') },
  { key: 'progress', label: t('进度'), nowrap: true },
  { key: 'state', label: t('状态') },
  { key: 'actions', label: t('操作'), align: 'right' as const },
];
</script>

<template>
  <Dialog :title="t('更换记录')" :subtitle="t('关闭页面不会停止已提交的操作')" size="lg" @close="emit('close')">
    <div class="rs-replace-history">
      <div v-if="session.user?.role !== 'SUPPLIER_AGENT'" class="rs-replace-scope">
        <Select v-model="scopeValue" :options="scopeOptions" :label="t('操作记录范围')" size="sm" />
      </div>
      <div class="rs-replace-table">
        <DataTable
          :columns="columns"
          :rows="records.data.value?.items ?? []"
          :row-key="(row: ReplacementJob) => row.id"
          :loading="records.loading.value && !records.data.value"
          :error="records.error.value"
          :label="t('更换记录')"
          @retry="records.reload()"
        >
          <template #cell-createdAt="{ row }">{{ formatDateTime(row.createdAt) }}</template>
          <template #cell-mode="{ row }">{{ row.mode === 'SINGLE' ? t('单条更换') : t('批量替换') }}</template>
          <template #cell-progress="{ row }"><span class="rs-num">{{ row.finished }}/{{ row.total }}</span></template>
          <template #cell-state="{ row }">{{ replacementStateLabel(row.state) }}</template>
          <template #cell-actions="{ row }"><Button size="sm" variant="ghost" @click="emit('open', row.id)">{{ t('查看进度') }}</Button></template>
        </DataTable>
      </div>
      <Pagination v-if="records.data.value" v-model:page="page" v-model:size="size" :total="records.data.value.total" :sizes="[10]" />
    </div>
  </Dialog>
</template>

<style scoped>
.rs-replace-history { display: grid; gap: 12px; }
.rs-replace-scope { width: 200px; max-width: 100%; }
.rs-replace-table { border: 1px solid var(--hs-border); border-radius: 12px; overflow: hidden; }
.rs-num { font-variant-numeric: tabular-nums; }
</style>
