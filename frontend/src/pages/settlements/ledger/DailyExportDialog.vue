<script setup lang="ts">
// Generate and download a daily-ledger file for the applied filter. The
// request key is renewed when the dialog opens or the type/format changes, so
// retrying the same choice cannot create a second file.
import { computed, ref, useId } from 'vue';
import Dialog from '../../../components/ui/Dialog.vue';
import Button from '../../../components/ui/Button.vue';
import Notice from '../../../components/ui/Notice.vue';
import DetailList from '../../../components/ui/DetailList.vue';
import FormField from '../../../components/ui/FormField.vue';
import Select from '../../../components/ui/Select.vue';
import { apiPost } from '../../../lib/api';
import { t } from '../../../lib/i18n';
import { useSessionStore } from '../../../stores/session';
import { downloadExport, EXPORT_TYPES, EXPORTS_ENDPOINT, type ExportJob, type ExportScope } from './dailyExports';

const props = defineProps<{ scope: ExportScope }>();
const emit = defineEmits<{ close: [] }>();

const session = useSessionStore();
const formId = useId();
const type = ref('SUMMARY');
const format = ref('XLSX');
const busy = ref(false);
const error = ref('');
let requestKey = crypto.randomUUID();

const typeOptions = computed(() => Object.entries(EXPORT_TYPES()).map(([value, label]) => ({ value, label })));
const formatOptions = [{ value: 'XLSX', label: 'Excel（.xlsx）' }, { value: 'CSV', label: 'CSV（.csv）' }];
const range = computed(() => `${props.scope.filter.from || t('不限')} — ${props.scope.filter.to || t('不限')}`);

function setType(value: string) { type.value = value; requestKey = crypto.randomUUID(); }
function setFormat(value: string) { format.value = value; requestKey = crypto.randomUUID(); }

function close() { if (!busy.value) emit('close'); }

async function generate() {
  if (busy.value) return;
  busy.value = true;
  error.value = '';
  try {
    const result = await apiPost<ExportJob>(EXPORTS_ENDPOINT, { type: type.value, format: format.value, filter: props.scope.filter, requestKey });
    if (result.state !== 'COMPLETED') throw new Error(t('文件生成结果尚未确认，请查看导出记录。'));
    await downloadExport(result);
    session.notify(t('文件已生成并下载'));
    emit('close');
  } catch (reason) {
    error.value = (reason as Error).message;
  } finally {
    busy.value = false;
  }
}
</script>

<template>
  <Dialog :title="t('导出日账')" @close="close">
    <form :id="formId" class="body" :aria-label="t('导出日账')" @submit.prevent="generate">
      <DetailList :items="[[t('业务日期'), range], [t('供应商'), scope.supplierName || t('全部供应商')], [t('项目'), scope.projectName || t('全部项目')]]" />
      <div class="fields">
        <FormField :label="t('汇总方式')">
          <template #default="{ id }">
            <Select :id="id" :model-value="type" :options="typeOptions" :label="t('汇总方式')" :disabled="busy" @update:model-value="setType(String($event))" />
          </template>
        </FormField>
        <FormField :label="t('文件格式')">
          <template #default="{ id }">
            <Select :id="id" :model-value="format" :options="formatOptions" :label="t('文件格式')" :disabled="busy" @update:model-value="setFormat(String($event))" />
          </template>
        </FormField>
      </div>
      <p class="note">{{ t('导出当前筛选的全部分页。跨日金额请在金额记录中查看；历史采集的待确认金额不能据此当作已确认应付。文件保留 7 天。') }}</p>
      <Notice v-if="error" tone="danger">{{ error }}</Notice>
    </form>
    <template #footer>
      <Button :disabled="busy" @click="close">{{ t('取消') }}</Button>
      <Button type="submit" :form="formId" variant="primary" icon="download" :loading="busy">{{ busy ? t('正在生成并下载…') : t('生成并下载') }}</Button>
    </template>
  </Dialog>
</template>

<style scoped>
.body { display: grid; gap: 16px; }
.fields { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 14px; }
.note { margin: 0; color: var(--hs-text-3); font-size: var(--hs-text-xs); line-height: 1.7; }
@media (max-width: 560px) { .fields { grid-template-columns: minmax(0, 1fr); } }
</style>
