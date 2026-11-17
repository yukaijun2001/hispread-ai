<script setup lang="ts">
// One audit entry: the list row's facts right away, then the full record
// (field changes and the raw before/after snapshot or CCMAX request/response).
import { computed } from 'vue';
import Dialog from '../../components/ui/Dialog.vue';
import DataTable from '../../components/ui/DataTable.vue';
import Notice from '../../components/ui/Notice.vue';
import Spinner from '../../components/ui/Spinner.vue';
import StatusBadge from '../../components/ui/StatusBadge.vue';
import InfoGrid from './components/InfoGrid.vue';
import { useApiData } from '../../composables/useApiData';
import { t } from '../../lib/i18n';
import { formatDateTime } from '../../lib/money';
import {
  AUDIT_ACTION_LABELS, AUDIT_TARGET_LABELS, auditChanges, auditResultLabel, auditState, auditSummary, formatChangeValue, own, parseSnapshot,
  type AuditChange, type AuditDetail, type AuditEntry,
} from './audits';

const props = defineProps<{ entry: AuditEntry }>();
const emit = defineEmits<{ close: [] }>();

const detail = useApiData<AuditDetail>(() => `/system/audits/${encodeURIComponent(props.entry.id)}`);
const changes = computed(() => (detail.data.value && !detail.loading.value && !detail.error.value ? auditChanges(detail.data.value) : []));
const apiCall = computed(() => props.entry.action === 'CC_API_CALL');
const summary = computed(() => auditSummary(props.entry));

const facts = computed(() => [
  { key: 'actor', label: t('操作人'), value: props.entry.actorName },
  { key: 'outcome', label: t('操作结果') },
  { key: 'summary', label: t('操作说明'), value: summary.value },
  { key: 'targetType', label: t('对象类型'), value: own(AUDIT_TARGET_LABELS(), props.entry.targetType) || props.entry.targetType },
  { key: 'targetId', label: t('资源编号'), value: props.entry.targetId },
  { key: 'ip', label: t('来源 IP'), value: props.entry.ip },
  { key: 'createdAt', label: t('操作时间'), value: formatDateTime(props.entry.createdAt) },
  { key: 'traceId', label: t('请求追踪 ID'), value: props.entry.traceId },
  { key: 'action', label: t('事件代码'), value: props.entry.action },
]);

const beforeText = computed(() => {
  const data = detail.data.value;
  if (!data) return '';
  return data.originalBodiesAvailable ? data.originalRequestBody ?? t('无请求体') : JSON.stringify(parseSnapshot(data.beforeJson), null, 2);
});
const afterText = computed(() => {
  const data = detail.data.value;
  if (!data) return '';
  return data.originalBodiesAvailable ? data.originalResponseBody ?? t('未收到响应体') : JSON.stringify(parseSnapshot(data.afterJson), null, 2);
});

const changeColumns = [
  { key: 'field', label: t('字段') },
  { key: 'before', label: t('修改前') },
  { key: 'after', label: t('修改后') },
];
</script>

<template>
  <Dialog drawer size="lg" :title="own(AUDIT_ACTION_LABELS(), entry.action) || entry.action" :subtitle="summary" @close="emit('close')">
    <div class="audit-detail">
      <InfoGrid :items="facts">
        <template #outcome><StatusBadge :state="auditState(entry)" :label="auditResultLabel(entry)" /></template>
        <template #traceId><code class="audit-code">{{ entry.traceId || '—' }}</code></template>
        <template #targetId><code class="audit-code">{{ entry.targetId || '—' }}</code></template>
      </InfoGrid>

      <div v-if="detail.loading.value" class="audit-state"><Spinner :size="16" /></div>
      <Notice v-else-if="detail.error.value" tone="danger">{{ t('详情加载失败：') }}{{ detail.error.value }}</Notice>
      <template v-else-if="detail.data.value">
        <section v-if="changes.length" class="audit-section">
          <h3>{{ t('变更内容') }}</h3>
          <DataTable :columns="changeColumns" :rows="changes" :row-key="(row: AuditChange) => row.id" :label="t('变更内容')">
            <template #cell-before="{ row }"><span class="audit-value">{{ formatChangeValue(row.before) }}</span></template>
            <template #cell-after="{ row }"><span class="audit-value">{{ formatChangeValue(row.after) }}</span></template>
          </DataTable>
        </section>
        <details class="audit-section audit-raw">
          <summary>{{ apiCall ? t('查看原始请求与响应（技术字段）') : t('查看完整变更快照') }}</summary>
          <Notice v-if="apiCall && !detail.data.value.originalBodiesAvailable">{{ t('此历史记录未保留原始报文，以下为当时保存的内容。') }}</Notice>
          <h3>{{ apiCall ? t('请求') : t('变更前') }}</h3>
          <pre class="hs-audit-json">{{ beforeText }}</pre>
          <h3>{{ apiCall ? t('响应') : t('变更后') }}</h3>
          <pre class="hs-audit-json after">{{ afterText }}</pre>
        </details>
      </template>
    </div>
  </Dialog>
</template>

<style scoped>
.audit-detail { display: grid; gap: 20px; }
.audit-state { display: grid; place-items: center; padding: 32px; color: var(--hs-text-3); }
.audit-section { display: grid; gap: 10px; }
.audit-section h3 { margin: 0; color: var(--hs-text); font-size: var(--hs-text-sm); font-weight: 600; }
.audit-raw summary { color: var(--hs-text-2); font-size: var(--hs-text-sm); cursor: pointer; }
.audit-raw[open] summary { margin-bottom: 4px; }
.audit-code { font-family: var(--hs-font-mono); font-size: var(--hs-text-xs); overflow-wrap: anywhere; }
.audit-value { font-family: var(--hs-font-mono); font-size: var(--hs-text-xs); overflow-wrap: anywhere; white-space: pre-wrap; }
.hs-audit-json { max-height: 360px; margin: 0; padding: 12px; overflow: auto; color: var(--hs-text-2); background: var(--hs-surface-subtle); border: 1px solid var(--hs-border); border-radius: 10px; font-family: var(--hs-font-mono); font-size: var(--hs-text-xs); line-height: 1.6; white-space: pre-wrap; overflow-wrap: anywhere; }
.hs-audit-json.after { border-left: 3px solid var(--hs-accent); }
</style>
