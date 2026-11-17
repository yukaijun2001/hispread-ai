<script setup lang="ts">
// Outbound proxies. Suppliers maintain their own pool ("代理配置"); platform
// accounts see every supplier's proxies ("代理管理") and can test them.
import { computed, onBeforeUnmount, ref, watch } from 'vue';
import PageHeader from '../../components/ui/PageHeader.vue';
import Button from '../../components/ui/Button.vue';
import SearchInput from '../../components/ui/SearchInput.vue';
import Select from '../../components/ui/Select.vue';
import Notice from '../../components/ui/Notice.vue';
import EmptyState from '../../components/ui/EmptyState.vue';
import DataTable from '../../components/ui/DataTable.vue';
import Pagination from '../../components/ui/Pagination.vue';
import Badge from '../../components/ui/Badge.vue';
import Icon from '../../components/ui/Icon.vue';
import ProxyBatchPanel from './ProxyBatchPanel.vue';
import ProxyFormDialog from './ProxyFormDialog.vue';
import ProxyImportDialog from './ProxyImportDialog.vue';
import ProxyResourcesDialog from './ProxyResourcesDialog.vue';
import { useApiData } from '../../composables/useApiData';
import { useSupplierDirectory } from '../../composables/useSupplierDirectory';
import { apiFetch, apiPost } from '../../lib/api';
import { t, translateServerMessage } from '../../lib/i18n';
import { formatDateTime } from '../../lib/money';
import { useSessionStore } from '../../stores/session';
import {
  collectAllProxies, testFields, testProxies,
  type BatchProgress, type OutboundProxy, type ProxyPage, type TestFields, type TestResult,
} from './proxies';

defineProps<{ route: string }>();

const session = useSessionStore();
const platform = computed(() => !session.user?.supplierId);

// --- Filters -------------------------------------------------------------------
const search = ref('');
const supplierSearch = ref('');
const stateFilter = ref<'all' | 'enabled' | 'disabled'>('enabled');
const protocol = ref<'all' | 'SOCKS5' | 'HTTP' | 'HTTPS'>('all');
const page = ref(1);
const size = ref(50);
watch([search, supplierSearch, stateFilter, protocol], () => { page.value = 1; });

const filtered = computed(() => !!search.value.trim() || (platform.value && !!supplierSearch.value.trim())
  || stateFilter.value !== 'enabled' || protocol.value !== 'all');
function resetFilters() {
  search.value = ''; supplierSearch.value = ''; stateFilter.value = 'enabled'; protocol.value = 'all'; page.value = 1;
}

const filterQuery = () => `search=${encodeURIComponent(search.value)}&state=${stateFilter.value}&protocol=${protocol.value}`
  + (platform.value ? `&supplierSearch=${encodeURIComponent(supplierSearch.value)}` : '');

// --- Data ----------------------------------------------------------------------
const list = useApiData<ProxyPage>(() => `/outbound-proxies/page?page=${page.value}&size=${size.value}&${filterQuery()}`);
const features = useApiData<{ supportsProxy?: boolean }>('/resources/submission-capabilities');
const directory = useSupplierDirectory(() => platform.value && session.has('supplier.read'));

// Test results are shown on top of the list until the list is read again.
const overlay = ref<Record<string, TestFields>>({});
watch(list.data, () => { overlay.value = {}; });
const rows = computed<OutboundProxy[]>(() => (list.data.value?.items ?? []).map((proxy) => ({ ...proxy, ...overlay.value[proxy.id] })));
const remember = (result: TestResult) => { overlay.value = { ...overlay.value, [result.id]: testFields(result) }; };

const supplierOptions = computed(() => {
  const label = t('供应商');
  const items = directory.items.value ?? [];
  const first = directory.loading.value ? t('{0}加载中…', [label]) : directory.error.value ? t('{0}加载失败', [label]) : t('全部供应商');
  const known = !supplierSearch.value || items.some((supplier) => supplier.id === supplierSearch.value);
  return [
    { value: '', label: first },
    ...items.map((supplier) => ({ value: supplier.id, label: supplier.name, detail: supplier.code })),
    ...(known ? [] : [{ value: supplierSearch.value, label: t('已选{0}', [label]) }]),
  ];
});
const stateOptions = [
  { value: 'all' as const, label: t('全部状态') }, { value: 'enabled' as const, label: t('启用') }, { value: 'disabled' as const, label: t('停用') },
];
const protocolOptions = [
  { value: 'all' as const, label: t('全部协议') }, { value: 'SOCKS5' as const, label: 'SOCKS5' }, { value: 'HTTP' as const, label: 'HTTP' }, { value: 'HTTPS' as const, label: 'HTTPS' },
];

// --- Testing -------------------------------------------------------------------
// One job at a time: a single test or a batch. Leaving the page stops the batch.
let job: { stop: boolean } | null = null;
let mounted = true;
const testingId = ref<string | null>(null);
const batch = ref<BatchProgress | null>(null);
const pageError = ref('');
const importResult = ref('');
const batchRunning = computed(() => !!batch.value && ['collecting', 'running', 'stopping'].includes(batch.value.phase));

onBeforeUnmount(() => { mounted = false; if (job) job.stop = true; });

const updateBatch = (patch: (current: BatchProgress) => Partial<BatchProgress>) => {
  if (batch.value) batch.value = { ...batch.value, ...patch(batch.value) };
};

async function testOne(proxy: OutboundProxy) {
  if (job || !proxy.testable) return;
  const current = { stop: false };
  job = current;
  testingId.value = proxy.id;
  pageError.value = '';
  try {
    const result = await apiPost<TestResult>(`/outbound-proxies/${encodeURIComponent(proxy.id)}/test`, {});
    if (!mounted) return;
    remember(result);
    session.notify(result.lastTestState === 'OK' ? t('代理检测通过')
      : t('代理检测失败：{0}', [result.lastTestMessage ? translateServerMessage(result.lastTestMessage) : t('未能连通目标地址')]));
  } catch (error) {
    if (mounted) pageError.value = (error as Error).message;
  } finally {
    if (job === current) job = null;
    if (mounted) testingId.value = null;
  }
}

function stopBatch() {
  if (!job) return;
  job.stop = true;
  updateBatch(() => ({ phase: 'stopping' }));
}

async function testAll() {
  if (job || !session.has('proxy.write')) return;
  const current = { stop: false };
  job = current;
  pageError.value = '';
  batch.value = { phase: 'collecting', collected: 0, total: 0, completed: 0, ok: 0, failed: 0, requestFailed: 0, skipped: 0, results: [] };
  // The filter is fixed when the batch starts.
  const query = filterQuery();
  const stopped = () => current.stop || !mounted;
  try {
    const proxies = await collectAllProxies(
      (number, pageSize) => apiFetch<ProxyPage>(`/outbound-proxies/page?page=${number}&size=${pageSize}&${query}`),
      stopped,
      (count) => { if (mounted) updateBatch(() => ({ collected: count })); },
    );
    if (!proxies) {
      if (mounted) updateBatch(() => ({ phase: 'stopped' }));
      return;
    }
    const testable = proxies.filter((proxy) => proxy.testable);
    updateBatch(() => ({ phase: 'running', total: testable.length, skipped: proxies.length - testable.length }));
    await testProxies(
      testable,
      stopped,
      () => { current.stop = true; },
      (proxy) => apiPost<TestResult>(`/outbound-proxies/${encodeURIComponent(proxy.id)}/test`, {}),
      (result, updated) => {
        if (!mounted) return;
        if (updated) remember(updated);
        updateBatch((progress) => ({
          completed: progress.completed + 1,
          ok: progress.ok + Number(result.state === 'OK'),
          failed: progress.failed + Number(result.state === 'FAILED'),
          requestFailed: progress.requestFailed + Number(result.state === 'REQUEST_FAILED'),
          results: [...progress.results, result],
          phase: current.stop ? 'stopping' : progress.phase,
        }));
      },
    );
    if (mounted) updateBatch(() => ({ phase: current.stop ? 'stopped' : 'complete' }));
  } catch (error) {
    if (mounted) {
      pageError.value = t('代理列表收集失败，未开始检测：{0}', [error instanceof Error ? error.message : t('请求失败')]);
      updateBatch(() => ({ phase: 'error' }));
    }
  } finally {
    if (job === current) job = null;
  }
}

// --- Dialogs -------------------------------------------------------------------
const editing = ref<OutboundProxy | 'new' | null>(null);
const importing = ref(false);
const viewing = ref<OutboundProxy | null>(null);

function openEditor(proxy: OutboundProxy | 'new') { editing.value = proxy; pageError.value = ''; }
function openImport() { importing.value = true; pageError.value = ''; }
function onImported(summary: string) { importResult.value = summary; importing.value = false; }

const columns = computed(() => [
  { key: 'name', label: t('代理 / 地址') },
  ...(platform.value ? [{ key: 'supplier', label: t('所属供应商') }, { key: 'creator', label: t('创建人') }] : []),
  { key: 'protocol', label: t('协议'), width: '92px' },
  { key: 'enabled', label: t('状态'), width: '88px' },
  { key: 'test', label: t('检测') },
  { key: 'usage', label: t('占用 / 上限'), width: '120px' },
  { key: 'actions', label: t('操作'), width: '150px' },
]);
const showCapabilityNotice = computed(() => features.data.value?.supportsProxy !== true && !(features.loading.value && !features.data.value));
</script>

<template>
  <div class="proxies">
    <PageHeader
      :title="platform ? t('代理管理') : t('代理配置')"
      :description="platform ? t('查看各供应商的代理归属，并可检测连通性。检测失败不会自动停用。') : t('每条代理独立设置绑定上限。')"
    >
      <template #actions>
        <Button v-if="session.has('proxy.write')" icon="refresh" :disabled="batchRunning || !!testingId" @click="testAll">{{ t('批量检测') }}</Button>
        <template v-if="!platform">
          <Button icon="upload" :disabled="batchRunning" @click="openImport">{{ t('批量导入') }}</Button>
          <Button variant="primary" icon="plus" :disabled="batchRunning" @click="openEditor('new')">{{ t('新增代理') }}</Button>
        </template>
      </template>
    </PageHeader>

    <div class="stack-gap">
      <Notice v-if="showCapabilityNotice">{{ t('当前接入使用上游直连，代理记录仅供兼容接入维护，不参与原生 OAuth 上号。') }}</Notice>
      <Notice v-if="importResult" tone="info">{{ importResult }}</Notice>
      <Notice v-if="pageError && !editing && !importing" tone="danger">{{ pageError }}</Notice>
      <ProxyBatchPanel v-if="batch" :progress="batch" @stop="stopBatch" @dismiss="batch = null" />

      <section class="card" :aria-label="t('代理列表')">
        <div class="card-head">
          <strong>{{ platform ? t('全部供应商代理') : t('代理池') }}</strong>
          <span v-if="!list.loading.value && !list.error.value && list.data.value" class="total">{{ list.data.value.total }}{{ t(' 条代理') }}</span>
        </div>
        <div class="toolbar" role="search" :aria-label="t('筛选代理')">
          <SearchInput v-model="search" class="grow" :placeholder="t('代理名称或可见出口')" :label="t('搜索')" />
          <template v-if="platform">
            <SearchInput v-if="!session.has('supplier.read')" v-model="supplierSearch" class="f-select" :placeholder="t('搜索供应商名称或编码')" :label="t('供应商')" />
            <div v-else class="f-select">
              <Select v-model="supplierSearch" :options="supplierOptions" :label="t('供应商')" icon="users" searchable
                :search-placeholder="t('搜索供应商名称或编码')" :disabled="directory.loading.value && !supplierSearch" />
            </div>
          </template>
          <div class="narrow"><Select v-model="stateFilter" :options="stateOptions" :label="t('代理状态')" /></div>
          <div class="narrow"><Select v-model="protocol" :options="protocolOptions" :label="t('代理协议')" /></div>
          <div class="toolbar-actions">
            <Button v-if="filtered" variant="ghost" size="sm" @click="resetFilters">{{ t('重置筛选') }}</Button>
          </div>
        </div>

        <EmptyState v-if="list.error.value" error :text="list.error.value">
          <Button size="sm" icon="refresh" @click="list.reload()">{{ t('重试') }}</Button>
        </EmptyState>
        <template v-else-if="list.loading.value || rows.length">
          <DataTable :columns="columns" :rows="rows" :row-key="(row: OutboundProxy) => row.id" :loading="list.loading.value"
            :refreshing="list.refreshing.value" :label="t('代理列表')" @row-click="(row: OutboundProxy) => (viewing = row)">
            <template #cell-name="{ row }">
              <div class="hs-identity"><strong>{{ row.name }}</strong><span class="mono-text">{{ row.endpoint }}</span></div>
            </template>
            <template #cell-supplier="{ row }">{{ row.supplierName || '—' }}{{ row.supplierCode ? t('（{0}）', [row.supplierCode]) : '' }}</template>
            <template #cell-creator="{ row }">{{ row.creatorName || t('未知创建人') }}</template>
            <template #cell-protocol="{ row }"><span class="protocol">{{ row.protocol }}</span></template>
            <template #cell-enabled="{ row }"><Badge :tone="row.enabled ? 'success' : 'neutral'" dot>{{ row.enabled ? t('启用') : t('停用') }}</Badge></template>
            <template #cell-test="{ row }">
              <div class="test">
                <Badge :tone="row.lastTestState === 'OK' ? 'success' : row.lastTestState === 'FAILED' ? 'danger' : 'neutral'" dot>
                  {{ row.lastTestState === 'OK' ? t('正常') : row.lastTestState === 'FAILED' ? t('失败') : t('未检测') }}
                </Badge>
                <small v-if="row.lastTestState">
                  {{ row.lastTestLatencyMs == null ? '' : `${row.lastTestLatencyMs} ms` }}{{ row.lastTestedAt ? `${row.lastTestLatencyMs == null ? '' : ' · '}${formatDateTime(row.lastTestedAt)}` : '' }}
                </small>
                <small v-if="row.lastTestMessage" class="message">{{ translateServerMessage(row.lastTestMessage) }}</small>
              </div>
            </template>
            <template #cell-usage="{ row }">
              <div class="usage">
                <strong>{{ row.usedResources + row.reservedResources }} / {{ row.maxResources === 0 ? t('不限') : row.maxResources }}</strong>
                <small v-if="row.reservedResources > 0">{{ t('含 ') }}{{ row.reservedResources }}{{ t(' 个预占') }}</small>
              </div>
            </template>
            <template #cell-actions="{ row }">
              <div class="actions" @click.stop>
                <button v-if="row.testable" type="button" class="action primary" :disabled="!!testingId || batchRunning" @click="testOne(row)">
                  {{ testingId === row.id ? t('检测中…') : t('检测') }}
                </button>
                <button type="button" class="action" @click="viewing = row">{{ t('绑定资源') }}</button>
                <button v-if="row.editable" type="button" class="action" :disabled="batchRunning" @click="openEditor(row)">{{ t('配置') }}</button>
              </div>
            </template>
          </DataTable>
          <Pagination v-if="rows.length" v-model:page="page" v-model:size="size" :total="list.data.value?.total ?? 0" :loading="list.loading.value" />
        </template>
        <EmptyState
          v-else
          :icon="filtered ? 'search' : 'settings'"
          :text="filtered ? t('没有找到匹配的代理') : t('暂无启用代理')"
          :hint="filtered ? t('试试其他名称、供应商、状态或协议，或清除当前筛选条件。')
            : platform ? t('供应商添加并启用代理后，会显示在这里；也可切换状态筛选查看全部代理。')
              : t('添加或启用代理后，可在交付时选择；也可切换状态筛选查看全部代理。')"
        >
          <Button v-if="filtered" size="sm" @click="resetFilters">{{ t('清除筛选') }}</Button>
          <div v-else-if="!platform" class="empty-actions">
            <Button size="sm" variant="primary" icon="plus" :disabled="batchRunning" @click="openEditor('new')">{{ t('新增代理') }}</Button>
            <Button size="sm" :disabled="batchRunning" @click="openImport">{{ t('批量导入') }}</Button>
          </div>
        </EmptyState>
      </section>
      <p class="footnote">
        <Icon name="info" :size="14" />
        {{ t('点击代理可查看绑定资源；地址按当前账号权限展示。检测只说明当次能否经该代理连出，不会自动停用。') }}
      </p>
    </div>

    <ProxyFormDialog v-if="editing" :proxy="editing" @close="editing = null" />
    <ProxyImportDialog v-if="importing" @close="importing = false" @imported="onImported" />
    <ProxyResourcesDialog v-if="viewing" :proxy="viewing" @close="viewing = null" />
  </div>
</template>

<style scoped>
.stack-gap { display: grid; gap: 14px; }
.card { background: var(--hs-surface); border: 1px solid var(--hs-border); border-radius: var(--hs-radius-card); box-shadow: var(--hs-shadow-card); overflow: hidden; }
.card-head { display: flex; align-items: baseline; justify-content: space-between; gap: 12px; padding: 14px 16px 0; }
.card-head strong { color: var(--hs-text); font-size: var(--hs-text-md); font-weight: 600; }
.total { color: var(--hs-text-3); font-size: var(--hs-text-xs); font-variant-numeric: tabular-nums; }
.toolbar { display: flex; flex-wrap: wrap; align-items: center; gap: 8px; padding: 12px 16px 14px; }
.grow { flex: 1 1 240px; }
.f-select { flex: 0 1 220px; min-width: 160px; }
.narrow { flex: 0 1 150px; min-width: 128px; }
.toolbar-actions { display: flex; align-items: center; gap: 2px; margin-left: auto; }
.hs-identity { display: grid; gap: 2px; min-width: 0; }
.hs-identity strong { color: var(--hs-text); font-weight: 500; overflow-wrap: anywhere; }
.mono-text { color: var(--hs-text-3); font-family: var(--hs-font-mono); font-size: var(--hs-text-xs); overflow-wrap: anywhere; }
.protocol { display: inline-block; padding: 1px 7px; color: var(--hs-text-2); background: var(--hs-surface-subtle); border: 1px solid var(--hs-border); border-radius: 6px; font-family: var(--hs-font-mono); font-size: 11px; }
.test, .usage { display: grid; gap: 3px; justify-items: start; }
.test small, .usage small { color: var(--hs-text-3); font-size: var(--hs-text-xs); font-variant-numeric: tabular-nums; }
.test .message { overflow-wrap: anywhere; }
.usage strong { color: var(--hs-text); font-weight: 500; font-variant-numeric: tabular-nums; }
.actions { display: flex; flex-wrap: wrap; gap: 4px 10px; }
.action { min-height: 0; padding: 0; color: var(--hs-text-3); background: none; border: 0; font: inherit; font-size: var(--hs-text-xs); white-space: nowrap; cursor: pointer; }
.action:hover:not(:disabled) { color: var(--hs-text); text-decoration: underline; text-underline-offset: 3px; }
.action.primary { color: var(--hs-accent); }
.action.primary:hover:not(:disabled) { color: var(--hs-accent-hover); }
.action:disabled { opacity: .5; cursor: not-allowed; }
.empty-actions { display: flex; gap: 8px; }
.footnote { display: flex; align-items: flex-start; gap: 8px; margin: 0 4px; color: var(--hs-text-3); font-size: var(--hs-text-xs); line-height: 1.7; }
.footnote > .hs-icon { margin-top: 2px; }
</style>
