<script setup lang="ts">
// 接收资源详情: configuration of a received NewAPI resource plus its receipt record.
// "分配项目" is offered while the record is still unassigned and `assignable`.
import { computed } from 'vue';
import Button from '../../../components/ui/Button.vue';
import DetailList from '../../../components/ui/DetailList.vue';
import Dialog from '../../../components/ui/Dialog.vue';
import Notice from '../../../components/ui/Notice.vue';
import Spinner from '../../../components/ui/Spinner.vue';
import { useApiData } from '../../../composables/useApiData';
import { t } from '../../../lib/i18n';
import { formatDateTime, formatQuotePrice } from '../../../lib/money';
import IntakeConfiguration from '../components/IntakeConfiguration.vue';
import type { IntakeRecord } from '../intakeDetail';
import type { Resource } from '../resources';

const props = defineProps<{ resource: Resource; assignable: boolean }>();
const emit = defineEmits<{ close: []; assign: [] }>();

const record = useApiData<IntakeRecord>(() => `/resource-intakes/${encodeURIComponent(props.resource.id)}`);
const item = computed(() => record.data.value);

const receipt = computed<Array<[string, string | number | null | undefined]>>(() => {
  const resource = props.resource;
  const detail = item.value;
  return [
    [t('资源名称'), resource.name],
    [t('资源类型'), resource.projectCategoryName || resource.projectCategory || t('未分配')],
    [t('报价项目'), detail?.projectName || resource.projectName || t('尚未分配')],
    [t('项目分配'), (detail?.state || resource.assignmentState) === 'ASSIGNED' ? t('已分配') : t('待分配项目')],
    [t('录入方式'), resource.sourceKind === 'API' ? 'API' : t('网页')],
    [t('录入人'), resource.creatorName],
    [t('录入时间'), formatDateTime(resource.receivedAt)],
    ...(detail?.assignedAt ? [[t('分配时间'), formatDateTime(detail.assignedAt)] as [string, string]] : []),
    ...(detail?.quoteBasis ? [
      [t('报价币种'), String(detail.quoteBasis.currency || '—')] as [string, string],
      [t('价格 / 折扣'), formatQuotePrice(detail.quoteBasis)] as [string, string],
    ] : []),
  ];
});
const canAssign = computed(() => props.assignable && !record.loading.value && !record.error.value && item.value?.state === 'UNASSIGNED');
</script>

<template>
  <Dialog :title="t('接收资源详情')" size="lg" @close="emit('close')">
    <div class="idd">
      <div v-if="record.loading.value" class="idd-loading"><Spinner :size="16" /></div>
      <IntakeConfiguration v-if="item" :item="item" />
      <Notice v-if="record.error.value" tone="danger">
        {{ record.error.value }}
        <template #actions><Button size="sm" @click="record.reload()">{{ t('重试') }}</Button></template>
      </Notice>
      <details class="idd-receipt">
        <summary>{{ t('接收记录') }}</summary>
        <DetailList :items="receipt" />
      </details>
    </div>
    <template v-if="canAssign" #footer>
      <span class="idd-spacer" />
      <Button variant="primary" @click="emit('assign')">{{ t('分配项目') }}</Button>
    </template>
  </Dialog>
</template>

<style scoped>
.idd { display: grid; gap: 18px; }
.idd-loading { display: grid; place-items: center; padding: 24px; color: var(--hs-text-3); }
.idd-receipt { display: grid; gap: 10px; }
.idd-receipt summary { margin-bottom: 10px; cursor: pointer; font-size: var(--hs-text-sm); font-weight: 600; }
.idd-spacer { flex: 1; }
</style>
