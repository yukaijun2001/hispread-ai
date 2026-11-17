<script setup lang="ts">
// Link a local CCMAX draft to an existing account on a CCMAX_NATIVE target.
// Only verifies and links; the upstream account is not modified. Upstream
// accounts are read 20 per page with a 65 s timeout; the search applies when
// 查询上游账号 is pressed.
import { computed, onScopeDispose, ref, watch } from 'vue';
import Dialog from '../../../components/ui/Dialog.vue';
import Button from '../../../components/ui/Button.vue';
import Notice from '../../../components/ui/Notice.vue';
import FormField from '../../../components/ui/FormField.vue';
import Select from '../../../components/ui/Select.vue';
import TextInput from '../../../components/ui/TextInput.vue';
import { useApiData } from '../../../composables/useApiData';
import { apiFetch, apiPost } from '../../../lib/api';
import { t } from '../../../lib/i18n';
import { enc, type DeliveryPage, type Resource } from '../resources';
import type { ResourceTarget } from './newapiChannel';
import type { UpstreamAccount } from './ccmaxNative';

const ACCOUNT_TIMEOUT_MS = 65_000;
const ACCOUNT_PAGE_SIZE = 20;

const emit = defineEmits<{ close: []; linked: [resource: Resource] }>();

const targets = useApiData<ResourceTarget[]>('/resource-targets');
const resources = useApiData<DeliveryPage>('/resources?page=1&size=100');
const targetId = ref('');
const resourceId = ref('');
const accountId = ref('');
const busy = ref(false);
const error = ref('');
const accounts = ref<{ items: UpstreamAccount[]; total: number; loading: boolean; error: string }>({ items: [], total: 0, loading: false, error: '' });
const search = ref('');
const page = ref(1);
const revision = ref(0);

let stopAccounts = () => {};
watch([targetId, revision, page], () => {
  stopAccounts();
  if (!targetId.value) { accounts.value = { items: [], total: 0, loading: false, error: '' }; return; }
  let alive = true;
  const controller = new AbortController();
  const timer = window.setTimeout(() => controller.abort(), ACCOUNT_TIMEOUT_MS);
  stopAccounts = () => { alive = false; controller.abort(); window.clearTimeout(timer); };
  accounts.value = { items: [], total: 0, loading: true, error: '' };
  apiFetch<{ items?: UpstreamAccount[]; total?: number }>(
    `/resource-targets/${enc(targetId.value)}/accounts?page=${page.value}&search=${enc(search.value)}`,
    { signal: controller.signal },
  )
    .then((result) => { if (alive) accounts.value = { items: result.items || [], total: result.total || 0, loading: false, error: '' }; })
    .catch((failure: Error) => {
      if (alive) accounts.value = { items: [], total: 0, loading: false, error: controller.signal.aborted ? t('上游账号读取超时，请重试') : failure.message };
    })
    .finally(() => window.clearTimeout(timer));
}, { immediate: true });
onScopeDispose(() => stopAccounts());

const targetOptions = computed(() => [
  { value: '', label: t('请选择目标') },
  ...(targets.data.value || []).filter((target) => target.enabled && target.protocol === 'CCMAX_NATIVE').map((target) => ({ value: target.id, label: target.name })),
]);
const eligible = computed(() => (resources.data.value?.items || []).filter((row) => row.resourceType === 'CCMAX' && row.state === 'DRAFT'
  && !row.laneId && !row.upstreamChannelId && (!row.targetId || row.targetId === targetId.value)));
const resourceOptions = computed(() => [
  { value: '', label: t('请选择未关联草稿') },
  ...eligible.value.map((row) => ({ value: row.id, label: `${row.name} · ${row.supplierName || t('供应商')}` })),
]);
const accountOptions = computed(() => [
  { value: '', label: accounts.value.loading ? t('正在读取上游账号，请稍候…') : t('请选择上游账号') },
  ...accounts.value.items.map((account) => ({ value: account.id, label: `${account.name} · ${account.status} · ${account.id}` })),
]);
const shownError = computed(() => error.value || targets.error.value || resources.error.value || accounts.value.error);

function selectTarget(value: string) {
  targetId.value = value;
  accountId.value = '';
  page.value = 1;
}
function queryAccounts() {
  accountId.value = '';
  page.value = 1;
  revision.value++;
}
function turnPage(step: number) {
  accountId.value = '';
  page.value += step;
}

async function save() {
  if (busy.value) return;
  if (!targetId.value || !resourceId.value || !accountId.value) { error.value = t('请选择目标、本地草稿和上游账号'); return; }
  busy.value = true; error.value = '';
  try {
    const resource = await apiFetch<Resource>(`/resources/${enc(resourceId.value)}`);
    const result = await apiPost<Resource>(`/resources/${enc(resourceId.value)}/upstream-account`, {
      targetId: targetId.value, accountId: accountId.value, version: resource.version,
    });
    emit('linked', result);
  } catch (failure) {
    error.value = (failure as Error).message;
  } finally {
    busy.value = false;
  }
}
</script>

<template>
  <Dialog :title="t('关联 CCMAX 原生账号')" @close="emit('close')">
    <form class="rs-form" @submit.prevent="save">
      <Notice>{{ t('仅核验并关联已有账号，不修改上游账号、凭据、归属和调度状态。') }}</Notice>
      <FormField :label="t('CCMAX 原生目标')">
        <template #default="{ id }">
          <Select :id="id" :model-value="targetId" :options="targetOptions" :label="t('CCMAX 原生目标')" @update:model-value="selectTarget($event as string)" />
        </template>
      </FormField>
      <FormField :label="t('本地资源草稿')">
        <template #default="{ id }"><Select :id="id" v-model="resourceId" :options="resourceOptions" :label="t('本地资源草稿')" /></template>
      </FormField>
      <FormField :label="t('搜索上游账号')">
        <template #default="{ id }">
          <div class="rs-search-row">
            <TextInput :id="id" v-model="search" :placeholder="t('上游账号名称')" @keydown.enter.prevent="targetId && !accounts.loading && queryAccounts()" />
            <Button :disabled="!targetId || accounts.loading" @click="queryAccounts">{{ t('查询上游账号') }}</Button>
          </div>
        </template>
      </FormField>
      <FormField :label="t('上游账号')">
        <template #default="{ id }">
          <Select :id="id" v-model="accountId" :options="accountOptions" :label="t('上游账号')" :disabled="accounts.loading" />
        </template>
      </FormField>
      <div v-if="accounts.error" class="rs-actions">
        <Button size="sm" @click="revision++">{{ t('重新读取上游账号') }}</Button>
      </div>
      <div v-if="accounts.total > ACCOUNT_PAGE_SIZE" class="rs-pager">
        <Button size="sm" :disabled="page <= 1 || accounts.loading" @click="turnPage(-1)">{{ t('上一页') }}</Button>
        <span>{{ t('第 {0} 页，共 {1} 个账号', [page, accounts.total]) }}</span>
        <Button size="sm" :disabled="page * ACCOUNT_PAGE_SIZE >= accounts.total || accounts.loading" @click="turnPage(1)">{{ t('下一页') }}</Button>
      </div>
      <Notice v-if="shownError" tone="danger">{{ shownError }}</Notice>
    </form>
    <template #footer>
      <Button @click="emit('close')">{{ t('取消') }}</Button>
      <Button variant="primary" :disabled="busy || !targetId || !resourceId || !accountId" @click="save">{{ busy ? t('核验中…') : t('核验并关联') }}</Button>
    </template>
  </Dialog>
</template>

<style scoped>
.rs-form { display: grid; gap: 14px; }
.rs-search-row { display: flex; gap: 8px; }
.rs-search-row > :first-child { flex: 1; min-width: 0; }
.rs-actions { display: flex; gap: 8px; }
.rs-pager { display: flex; align-items: center; gap: 10px; color: var(--hs-text-2); font-size: var(--hs-text-sm); font-variant-numeric: tabular-nums; }
</style>
