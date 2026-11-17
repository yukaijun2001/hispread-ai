<script setup lang="ts">
// Resource list. NewAPI intakes on the supplier side or the pending tab get
// their own columns. Rows that may get a new proxy (or a lifecycle batch) can
// be selected, at most 100 across pages. Row actions come from the `actions` slot.
import { computed } from 'vue';
import DataTable from '../../../components/ui/DataTable.vue';
import type { Column } from '../../../components/ui/types';
import { t } from '../../../lib/i18n';
import { CREDENTIAL_MODE_LABELS } from '../../../lib/labels';
import {
  beijingDateTime, channelTypeLabel, dispatchInFlight, isIntake, isNativeCcmax, isNewApi, modelPreview, proxyReplaceable, type Resource,
} from '../resources';
import DeliveryCell from './DeliveryCell.vue';
import MoneyDisplay from './MoneyDisplay.vue';
import ResourceStateCell from './ResourceStateCell.vue';
import ResourceUsageCell from './ResourceUsageCell.vue';
import StateBadge from './StateBadge.vue';

const MAX_SELECTED = 100;

const props = defineProps<{
  rows: Resource[];
  loading: boolean;
  refreshing: boolean;
  error: string;
  pageSize: number;
  supplierSide: boolean;
  pendingOnly: boolean;
  resourceType: string;
  ccmaxVisible: boolean;
  mayReplace: boolean;
  projectNames: Map<string, string>;
}>();
const selected = defineModel<Map<string, Resource>>('selected', { required: true });
const emit = defineEmits<{ open: [resource: Resource]; retry: [] }>();
defineSlots<{ actions(props: { row: Resource }): unknown }>();

const intakeColumns = computed(() => (props.supplierSide || props.pendingOnly) && props.resourceType === 'NEWAPI_INTAKE');
const selectable = computed(() => props.ccmaxVisible && props.mayReplace && !intakeColumns.value);
const rowSelectable = (row: Resource) => !isIntake(row) && proxyReplaceable(row);
const pageRows = computed(() => props.rows.filter(rowSelectable));
const allOnPage = computed(() => pageRows.value.length > 0 && pageRows.value.every((row) => selected.value.has(row.id)));

function toggleRow(row: Resource, checked: boolean) {
  const next = new Map(selected.value);
  if (checked) next.set(row.id, row); else next.delete(row.id);
  selected.value = next;
}
function togglePage(checked: boolean) {
  const next = new Map(selected.value);
  for (const row of pageRows.value) {
    if (checked && next.size < MAX_SELECTED) next.set(row.id, row);
    else if (!checked) next.delete(row.id);
  }
  selected.value = next;
}

const credentialLabels = CREDENTIAL_MODE_LABELS();
const projectName = (row: Resource) => row.projectName || props.projectNames.get(row.projectId || '') || '—';
const typeLabel = (row: Resource) => (isNewApi(row) ? t('New API 渠道')
  : isIntake(row) ? row.projectCategoryName || row.projectCategory || t('未分配') : row.resourceType || t('未知类型'));
const submittedAt = (row: Resource) => (isIntake(row) ? beijingDateTime(row.receivedAt)
  : beijingDateTime(row.submittedAt, dispatchInFlight(row) ? t('待确认') : t('未提交')));
const models = (row: Resource) => row.modelSummary ?? [];

const columns = computed<Column[]>(() => {
  if (intakeColumns.value) {
    return [
      { key: 'name', label: t('资源名称') },
      { key: 'category', label: t('资源类型') },
      { key: 'provider', label: t('提供商'), nowrap: true },
      { key: 'memberCount', label: t('密钥数量'), align: 'right' },
      { key: 'models', label: t('模型') },
      { key: 'project', label: t('报价项目') },
      ...(props.supplierSide ? [] : [{ key: 'supplier', label: t('供应商') }]),
      { key: 'creator', label: t('录入人') },
      { key: 'receivedAt', label: t('录入时间'), nowrap: true },
      { key: 'actions', label: t('操作'), align: 'right' as const },
    ];
  }
  return [
    ...(selectable.value ? [{ key: 'select', label: '', width: '40px' }] : []),
    { key: 'identity', label: t('资源信息') },
    { key: 'project', label: t('项目 / 创建人') },
    ...(props.supplierSide ? [] : [{ key: 'supplier', label: t('供应商') }]),
    { key: 'status', label: t('交付 / 资源状态') },
    { key: 'usage', label: t('额度 / 使用情况') },
    { key: 'submittedAt', label: t('提交时间'), nowrap: true },
    { key: 'amount', label: props.supplierSide ? t('金额') : t('消费金额'), align: 'right' },
    { key: 'actions', label: t('操作'), align: 'right' },
  ];
});
</script>

<template>
  <div class="rs-table">
    <div v-if="selectable && rows.length && !loading" class="rs-select-bar">
      <label>
        <input type="checkbox" :checked="allOnPage" :disabled="!pageRows.length" @change="togglePage(($event.target as HTMLInputElement).checked)">
        {{ t('选择本页可操作资源') }}
      </label>
      <span v-if="selected.size">{{ t('已选 {0} 项', [selected.size]) }}</span>
    </div>
    <DataTable
      :columns="columns"
      :rows="loading ? [] : rows"
      :row-key="(row: Resource) => row.id"
      :loading="loading"
      :refreshing="refreshing"
      :error="error"
      :skeleton-rows="Math.min(pageSize, 10)"
      :label="t('资源列表')"
      @row-click="(row: Resource) => emit('open', row)"
      @retry="emit('retry')"
    >
      <!-- NewAPI intake columns -->
      <template #cell-name="{ row }">
        <div class="rs-identity">
          <strong>{{ row.name }}</strong>
          <span v-if="isIntake(row) && row.baseUrl" class="rs-endpoint">{{ row.baseUrl }}</span>
        </div>
      </template>
      <template #cell-category="{ row }">{{ isIntake(row) ? row.projectCategoryName || row.projectCategory || t('未分配') : row.resourceType || t('未知类型') }}</template>
      <template #cell-provider="{ row }">{{ isIntake(row) ? channelTypeLabel(row.channelType) : 'CCMAX' }}</template>
      <template #cell-memberCount="{ row }"><span class="rs-num">{{ isIntake(row) ? row.memberCount : '—' }}</span></template>
      <template #cell-models="{ row }">
        <span v-if="isIntake(row)" class="rs-models" :title="models(row).join(t('、'))">{{ modelPreview(row.modelSummary) }}</span>
        <template v-else>—</template>
      </template>
      <template #cell-creator="{ row }">{{ row.creatorName || '—' }}</template>
      <template #cell-receivedAt="{ row }">{{ beijingDateTime(isIntake(row) ? row.receivedAt : row.createdAt) }}</template>

      <!-- Default columns -->
      <template #cell-select="{ row }">
        <input
          v-if="rowSelectable(row)"
          type="checkbox"
          :aria-label="t('选择{0}', [row.name])"
          :checked="selected.has(row.id)"
          :disabled="!selected.has(row.id) && selected.size >= MAX_SELECTED"
          @click.stop
          @change="toggleRow(row, ($event.target as HTMLInputElement).checked)"
        >
      </template>
      <template #cell-identity="{ row }">
        <div class="rs-identity">
          <strong>{{ row.name }}</strong>
          <div class="rs-meta">
            <span class="rs-type">{{ typeLabel(row) }}</span>
            <template v-if="supplierSide && !isIntake(row)">
              <span>{{ row.accountName || t('待填写') }}</span>
              <span>{{ credentialLabels[row.credentialMode || ''] || '—' }}</span>
            </template>
          </div>
          <span v-if="isIntake(row) && row.baseUrl" class="rs-endpoint">{{ row.baseUrl }}</span>
        </div>
      </template>
      <template #cell-project="{ row }">
        <div v-if="intakeColumns" class="rs-project">
          <template v-if="isIntake(row)">
            <span v-if="row.projectName">{{ row.projectName }}</span>
            <StateBadge :state="row.assignmentState === 'ASSIGNED' ? 'APPROVED' : 'PENDING'" :label="row.assignmentState === 'ASSIGNED' ? t('已分配') : t('待分配项目')" />
          </template>
          <template v-else>{{ projectName(row) }}</template>
        </div>
        <div v-else class="rs-project">
          <span>{{ projectName(row) }}</span>
          <small>{{ t('创建人：{0}', [row.creatorName || t('未知创建人')]) }}</small>
          <StateBadge v-if="isIntake(row)" :state="row.assignmentState === 'ASSIGNED' ? 'APPROVED' : 'PENDING'" :label="row.assignmentState === 'ASSIGNED' ? t('已分配') : t('待分配项目')" />
        </div>
      </template>
      <template #cell-supplier="{ row }">
        <div class="rs-project">
          <span>{{ row.supplierName || '—' }}</span>
          <small v-if="!intakeColumns && !isIntake(row) && row.supplierCode">{{ row.supplierCode }}</small>
        </div>
      </template>
      <template #cell-status="{ row }">
        <div class="rs-status">
          <div><small>{{ t('交付') }}</small><DeliveryCell :resource="row" /></div>
          <div><small>{{ t('资源') }}</small><ResourceStateCell :resource="row" /></div>
        </div>
      </template>
      <template #cell-usage="{ row }">
        <span v-if="isIntake(row)" class="rs-models" :title="models(row).join(t('、'))">{{ modelPreview(row.modelSummary, t('未提供模型')) }}</span>
        <ResourceUsageCell v-else :resource="row" />
      </template>
      <template #cell-submittedAt="{ row }">{{ submittedAt(row) }}</template>
      <template #cell-amount="{ row }">
        <span class="rs-amount">
          <template v-if="isNewApi(row)">{{ t('—（配额原值）') }}</template>
          <template v-else-if="isNativeCcmax(row)">
            <template v-if="row.usage?.amount == null">{{ t('未查询') }}</template>
            <MoneyDisplay v-else :value="row.usage.amount" :currency="row.usage.currency || 'USD'" />
          </template>
          <template v-else-if="isIntake(row)">—</template>
          <template v-else-if="supplierSide && row.settlementMethod === 'ACCOUNT_BUYOUT'">
            <template v-if="row.buyoutAmount == null">{{ t('未交付') }}</template>
            <MoneyDisplay v-else :value="row.buyoutAmount" :currency="row.buyoutCurrency || ''" />
          </template>
          <template v-else-if="!supplierSide && row.state === 'DRAFT'">{{ t('未交付') }}</template>
          <template v-else-if="row.usage?.amount == null">{{ t('未查询') }}</template>
          <MoneyDisplay v-else :value="row.usage.amount" :currency="row.usage.currency || (supplierSide ? 'USD' : '')" />
        </span>
      </template>
      <template #cell-actions="{ row }"><div class="rs-actions" @click.stop><slot name="actions" :row="row" /></div></template>
    </DataTable>
  </div>
</template>

<style scoped>
.rs-table { display: grid; }
.rs-select-bar { display: flex; align-items: center; gap: 12px; padding: 8px 16px; color: var(--hs-text-2); font-size: var(--hs-text-xs); border-top: 1px solid var(--hs-divider); }
.rs-select-bar label { display: inline-flex; align-items: center; gap: 6px; cursor: pointer; }
.rs-select-bar span { color: var(--hs-text-3); }
.rs-identity { display: grid; gap: 3px; min-width: 160px; }
.rs-identity strong { color: var(--hs-text); font-weight: 600; overflow-wrap: anywhere; }
.rs-meta { display: flex; flex-wrap: wrap; gap: 4px 8px; color: var(--hs-text-3); font-size: var(--hs-text-xs); }
.rs-type { color: var(--hs-text-2); }
.rs-endpoint { color: var(--hs-text-3); font-family: var(--hs-font-mono); font-size: 11px; overflow-wrap: anywhere; }
.rs-project { display: grid; gap: 2px; justify-items: start; min-width: 120px; }
.rs-project small { color: var(--hs-text-3); font-size: var(--hs-text-xs); }
.rs-status { display: grid; gap: 6px; min-width: 140px; }
.rs-status > div { display: flex; align-items: flex-start; gap: 6px; }
.rs-status small { flex: none; width: 28px; padding-top: 2px; color: var(--hs-text-4); font-size: 11px; }
.rs-models { display: inline-block; max-width: 220px; color: var(--hs-text-2); font-size: var(--hs-text-xs); }
.rs-num, .rs-amount { font-variant-numeric: tabular-nums; }
.rs-amount { white-space: nowrap; }
.rs-actions { display: flex; flex-wrap: wrap; justify-content: flex-end; gap: 2px 4px; min-width: 96px; cursor: default; }
</style>
