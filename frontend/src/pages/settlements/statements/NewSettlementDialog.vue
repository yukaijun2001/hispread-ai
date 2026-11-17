<script setup lang="ts">
// "单张新建" form: supplier, project, source period, confirmation deadline and
// currency. Submitting requests a server preview; the page shows it and keeps
// these values (and the request key) for "返回修改".
import { computed, onBeforeUnmount, reactive, ref, useId, watch } from 'vue';
import Dialog from '../../../components/ui/Dialog.vue';
import Button from '../../../components/ui/Button.vue';
import Notice from '../../../components/ui/Notice.vue';
import FormField from '../../../components/ui/FormField.vue';
import Select from '../../../components/ui/Select.vue';
import TextInput from '../../../components/ui/TextInput.vue';
import Spinner from '../../../components/ui/Spinner.vue';
import { useApiData } from '../../../composables/useApiData';
import { useSupplierDirectory, type SupplierSummary } from '../../../composables/useSupplierDirectory';
import { apiPost } from '../../../lib/api';
import { t } from '../../../lib/i18n';
import { CURRENCIES } from '../../../lib/labels';
import { projectOption, type Project } from '../../../lib/projects';
import { useSessionStore } from '../../../stores/session';
import {
  beijingYesterday, quarterHourDeadline, withLocalOffset, type NewSettlementValues, type PreviewDocument, type SettlementRequest,
} from '../settlements';

const props = defineProps<{ initial: NewSettlementValues | null }>();
const emit = defineEmits<{ close: []; preview: [document: PreviewDocument, request: SettlementRequest, values: NewSettlementValues] }>();

const session = useSessionStore();
const formId = useId();
const permitted = session.has('supplier.read') && session.has('project.read');

const values = reactive<NewSettlementValues>(props.initial ? { ...props.initial } : {
  supplierId: '', projectId: '', periodStart: beijingYesterday(), periodEnd: beijingYesterday(),
  confirmationDeadline: quarterHourDeadline(), currency: 'USD', requestKey: crypto.randomUUID(),
});
const submitting = ref(false);
const error = ref('');

// --- Options: every supplier, plus an approved-only server search while typing ---
const typed = ref('');
const search = ref('');
let timer: number | undefined;
watch(typed, (value) => {
  window.clearTimeout(timer);
  timer = window.setTimeout(() => { search.value = value.trim(); }, 300);
});
onBeforeUnmount(() => window.clearTimeout(timer));

const all = useSupplierDirectory(session.has('supplier.read'));
const found = useSupplierDirectory(() => session.has('supplier.read') && !!search.value, 'APPROVED', search);
const seen = new Map<string, SupplierSummary>();
watch(found.items, (items) => { for (const item of items ?? []) seen.set(item.id, item); }, { immediate: true });
const projects = useApiData<{ items: Project[] }>(session.has('project.read') ? '/projects?size=100' : null);

const searching = computed(() => !!typed.value.trim());
const searchPending = computed(() => searching.value && (typed.value.trim() !== search.value || found.loading.value));
const supplierOptions = computed(() => {
  const pool = searching.value
    ? (searchPending.value ? [] : found.items.value ?? [])
    : [...new Map([...(all.items.value ?? []), ...seen.values()].map((s) => [s.id, s])).values()];
  return pool.filter((s) => s.state === 'APPROVED' && s.enabled).map((s) => ({ value: s.id, label: s.name, detail: s.code }));
});
const supplierEmpty = computed(() => {
  if (!searching.value || searchPending.value) return undefined;
  return found.error.value || (supplierOptions.value.length ? undefined : t('没有匹配的供应商'));
});
const projectOptions = computed(() => (projects.data.value?.items ?? []).map((project, _, list) => projectOption(project, list)));
const currencyOptions = CURRENCIES.map((value) => ({ value, label: value }));

const loadError = computed(() => all.error.value || projects.error.value);
const ready = ref(false);
watch([() => all.items.value, () => projects.data.value], ([suppliers, list]) => { if (suppliers && list) ready.value = true; }, { immediate: true });
const submitBlocked = computed(() => searchPending.value || (searching.value && !!found.error.value));

function close() { if (!submitting.value) emit('close'); }

async function submit() {
  if (submitting.value || submitBlocked.value) return;
  const missing = ([['supplierId', t('供应商')], ['projectId', t('项目')], ['currency', t('应付币种')]] as const).find(([key]) => !values[key]);
  if (missing) { error.value = t('请选择{0}', [missing[1]]); return; }
  submitting.value = true;
  error.value = '';
  try {
    const request: SettlementRequest = {
      supplierId: values.supplierId, projectId: values.projectId, periodStart: values.periodStart, periodEnd: values.periodEnd,
      currency: values.currency, requestKey: values.requestKey, inputIds: [], basisMode: 'DAILY_SUMMARY',
      confirmationDeadline: withLocalOffset(values.confirmationDeadline),
    };
    const document = await apiPost<PreviewDocument>('/settlements/preview', request);
    emit('preview', document, { ...request, expectedSnapshotHash: document.snapshotHash }, { ...values });
  } catch (reason) {
    error.value = reason instanceof Error ? reason.message : t('操作失败');
  } finally {
    submitting.value = false;
  }
}
</script>

<template>
  <Dialog size="lg" :title="t('新建结算单')" @close="close">
    <Notice v-if="!permitted" tone="danger">{{ t('当前账号缺少读取供应商或项目的权限，无法填写此表单。') }}</Notice>
    <Notice v-else-if="loadError && !ready" tone="danger">
      {{ t('供应商或项目加载失败：') }}{{ loadError }}
      <template #actions><Button size="sm" @click="session.refresh()">{{ t('重新加载选项') }}</Button></template>
    </Notice>
    <div v-else-if="!ready" class="st-loading"><Spinner :size="16" /></div>
    <form v-else :id="formId" class="st-form" @submit.prevent="submit">
      <fieldset>
        <legend>{{ t('结算对象') }}</legend>
        <FormField :label="t('供应商')" required>
          <template #default="{ id }">
            <Select :id="id" v-model="values.supplierId" :options="supplierOptions" :label="t('供应商')" :placeholder="t('请选择')" icon="users"
              searchable :search-placeholder="t('搜索供应商名称或编码')" :search-loading="searchPending" :empty-text="supplierEmpty"
              :disabled="submitting" @search="typed = $event" />
          </template>
        </FormField>
        <FormField :label="t('项目')" required>
          <template #default="{ id }">
            <Select :id="id" v-model="values.projectId" :options="projectOptions" :label="t('项目')" :placeholder="t('请选择')" searchable :disabled="submitting" />
          </template>
        </FormField>
      </fieldset>
      <fieldset>
        <legend>{{ t('结算期间') }}</legend>
        <div class="st-pair">
          <FormField :label="t('来源开始日期')" required>
            <template #default="{ id }"><TextInput :id="id" v-model="values.periodStart" type="date" required :disabled="submitting" /></template>
          </FormField>
          <FormField :label="t('来源结束日期')" required>
            <template #default="{ id }"><TextInput :id="id" v-model="values.periodEnd" type="date" required :disabled="submitting" /></template>
          </FormField>
        </div>
        <FormField :label="t('供应商确认截止时间')" :hint="t('请核对后手动确认或提出异议；到期不会自动确认。')" required>
          <template #default="{ id }"><TextInput :id="id" v-model="values.confirmationDeadline" type="datetime-local" required :disabled="submitting" /></template>
        </FormField>
      </fieldset>
      <fieldset>
        <legend>{{ t('结算金额') }}</legend>
        <div class="st-half">
          <FormField :label="t('应付币种')" required>
            <template #default="{ id }"><Select :id="id" v-model="values.currency" :options="currencyOptions" :label="t('应付币种')" :disabled="submitting" /></template>
          </FormField>
        </div>
      </fieldset>
      <Notice>{{ t('按已生成的日账汇总金额结算，正式生成后冻结本单金额。') }}</Notice>
      <Notice v-if="error" tone="danger">{{ error }}</Notice>
    </form>

    <template #footer>
      <Button :disabled="submitting" @click="close">{{ t('取消') }}</Button>
      <Button v-if="permitted && ready" type="submit" :form="formId" variant="primary" :loading="submitting" :disabled="submitBlocked">
        {{ submitting ? t('正在提交…') : t('预览结算单') }}
      </Button>
    </template>
  </Dialog>
</template>

<style scoped>
.st-loading { display: grid; place-items: center; padding: 28px; color: var(--hs-text-3); }
.st-form { display: grid; gap: 18px; }
.st-form fieldset { display: grid; gap: 14px; min-width: 0; margin: 0; padding: 0; border: 0; }
.st-form legend { margin-bottom: 10px; padding: 0; color: var(--hs-text); font-size: var(--hs-text-sm); font-weight: 600; }
.st-pair { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 14px; }
.st-half { max-width: calc(50% - 7px); }
@media (max-width: 640px) { .st-pair { grid-template-columns: minmax(0, 1fr); } .st-half { max-width: none; } }
</style>
