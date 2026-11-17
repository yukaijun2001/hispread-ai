<script setup lang="ts">
// Exchange rates (settlements?tab=rates). The platform manages versioned rates
// per currency pair; suppliers see the rates currently in effect, read-only.
import { computed, ref, watch } from 'vue';
import Button from '../../../components/ui/Button.vue';
import IconButton from '../../../components/ui/IconButton.vue';
import SearchInput from '../../../components/ui/SearchInput.vue';
import DataTable from '../../../components/ui/DataTable.vue';
import Pagination from '../../../components/ui/Pagination.vue';
import Badge from '../../../components/ui/Badge.vue';
import Notice from '../../../components/ui/Notice.vue';
import NoteDialog from './NoteDialog.vue';
import RateVersionDialog from './RateVersionDialog.vue';
import { useApiData } from '../../../composables/useApiData';
import { apiPost } from '../../../lib/api';
import { t } from '../../../lib/i18n';
import { formatDateTime } from '../../../lib/money';
import { useSessionStore } from '../../../stores/session';
import type { Page } from './ledger';

interface RateVersion {
  id: string;
  baseCurrency: string;
  quoteCurrency: string;
  rate: string;
  version: number;
  effectiveFrom: string;
  source?: string | null;
  enabled?: boolean;
}

const session = useSessionStore();
const supplierSide = computed(() => !!session.user?.supplierId);
const canWrite = computed(() => session.has('exchange_rate.write'));

const search = ref('');
const page = ref(1);
const size = ref(10);
watch(search, () => { page.value = 1; });

const versions = useApiData<Page<RateVersion>>(() => (supplierSide.value
  ? null
  : `/exchange-rates?search=${encodeURIComponent(search.value)}&page=${page.value}&size=${size.value}`));
const current = useApiData<RateVersion[]>(() => (supplierSide.value ? '/exchange-rates/current' : null));
const source = computed(() => (supplierSide.value ? current : versions));
const rows = computed(() => (supplierSide.value ? current.data.value || [] : versions.data.value?.items || []));

const creating = ref(false);
const toggling = ref<RateVersion | null>(null);

function rateState(rate: RateVersion): { label: string; tone: 'success' | 'info' | 'neutral' } {
  if (!rate.enabled) return { label: t('已停用'), tone: 'neutral' };
  return new Date(rate.effectiveFrom) <= new Date() ? { label: t('已发布'), tone: 'success' } : { label: t('待生效'), tone: 'info' };
}

function onCreated() {
  creating.value = false;
  session.refresh();
  session.notify(t('汇率新版本已发布'));
}

async function toggle(note: string) {
  const rate = toggling.value!;
  await apiPost(`/exchange-rates/${rate.id}/enabled`, { enabled: !rate.enabled, version: rate.version, note });
  toggling.value = null;
  session.refresh();
  session.notify(t('汇率版本状态已更新'));
}

const columns = computed(() => [
  { key: 'pair', label: t('币种对') },
  { key: 'rate', label: t('汇率') },
  { key: 'effectiveFrom', label: t('生效时间'), nowrap: true },
  { key: 'source', label: t('汇率来源') },
  ...(supplierSide.value ? [] : [{ key: 'state', label: t('状态') }, { key: 'actions', label: t('操作') }]),
]);
</script>

<template>
  <div class="rates">
    <section class="rt-card">
      <div class="rt-toolbar">
        <span v-if="supplierSide" class="rt-caption">{{ t('当前已生效的公开参考汇率') }}</span>
        <SearchInput v-else v-model="search" class="rt-grow" :placeholder="t('搜索币种对或汇率来源')" />
        <div class="rt-actions">
          <IconButton icon="refresh" :label="t('刷新汇率')" @click="session.refresh()" />
          <Button v-if="!supplierSide && canWrite" variant="primary" icon="plus" @click="creating = true">{{ t('新增版本') }}</Button>
        </div>
      </div>
      <DataTable :columns="columns" :rows="rows" :row-key="(row: RateVersion) => row.id" :loading="source.loading.value"
        :refreshing="source.refreshing.value" :error="source.error.value" :label="t('汇率')" @retry="source.reload()">
        <template #cell-pair="{ row }"><strong class="rt-pair">{{ row.baseCurrency }} / {{ row.quoteCurrency }}</strong></template>
        <template #cell-rate="{ row }">
          <div class="rt-cell">
            <strong class="rt-rate">1 {{ row.baseCurrency }} = {{ row.rate }} {{ row.quoteCurrency }}</strong>
            <small>{{ t('版本 V') }}{{ row.version }}</small>
          </div>
        </template>
        <template #cell-effectiveFrom="{ row }"><span class="rt-num">{{ formatDateTime(row.effectiveFrom) }}</span></template>
        <template #cell-source="{ row }">{{ row.source || '—' }}</template>
        <template #cell-state="{ row }"><Badge :tone="rateState(row).tone" dot>{{ rateState(row).label }}</Badge></template>
        <template #cell-actions="{ row }">
          <button v-if="canWrite" type="button" class="rt-link" :class="{ danger: row.enabled }" @click="toggling = row">
            {{ row.enabled ? t('停用') : t('重新发布') }}
          </button>
          <span v-else class="rt-none">—</span>
        </template>
      </DataTable>
      <Pagination v-if="!supplierSide" v-model:page="page" v-model:size="size" :total="versions.data.value?.total ?? 0" :loading="versions.loading.value" />
    </section>
    <Notice v-if="supplierSide">{{ t('这里只展示平台已发布并到达生效时间的最新版本；实际付款采用的汇率以对应付款记录快照为准。') }}</Notice>

    <RateVersionDialog v-if="creating" @close="creating = false" @created="onCreated" />
    <NoteDialog
      v-if="toggling"
      :title="toggling.enabled ? t('停用汇率版本') : t('重新发布汇率版本')"
      :subtitle="`${toggling.baseCurrency}/${toggling.quoteCurrency} · V${toggling.version}`"
      :label="t('变更原因')"
      :danger="toggling.enabled"
      :submit="toggle"
      @close="toggling = null"
    />
  </div>
</template>

<style scoped>
.rates { display: grid; gap: 14px; }
.rt-card { background: var(--hs-surface); border: 1px solid var(--hs-border); border-radius: var(--hs-radius-card); box-shadow: var(--hs-shadow-card); overflow: hidden; }
.rt-toolbar { display: flex; flex-wrap: wrap; align-items: center; gap: 8px; padding: 14px 16px; }
.rt-grow { flex: 1 1 260px; max-width: 420px; }
.rt-caption { color: var(--hs-text-2); font-size: var(--hs-text-sm); }
.rt-actions { display: flex; align-items: center; gap: 8px; margin-left: auto; }
.rt-pair { color: var(--hs-text); font-weight: 600; white-space: nowrap; }
.rt-cell { display: grid; gap: 2px; min-width: 0; }
.rt-cell small { color: var(--hs-text-3); font-size: var(--hs-text-xs); }
.rt-rate { color: var(--hs-text); font-weight: 500; font-variant-numeric: tabular-nums; white-space: nowrap; }
.rt-num { font-variant-numeric: tabular-nums; }
.rt-none { color: var(--hs-text-4); }
.rt-link { min-height: 0; padding: 0; color: var(--hs-accent); background: none; border: 0; font: inherit; font-size: var(--hs-text-xs); white-space: nowrap; cursor: pointer; }
.rt-link:hover { color: var(--hs-accent-hover); text-decoration: underline; text-underline-offset: 3px; }
.rt-link.danger { color: var(--hs-danger); }
</style>
