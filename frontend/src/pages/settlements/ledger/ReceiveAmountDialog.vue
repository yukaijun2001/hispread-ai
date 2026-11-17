<script setup lang="ts">
// "录入应付依据": record one payable source amount for a supplier and project,
// either priced by the supplier's quote (QUOTE) or entered as the real
// settlement amount (DIRECT). Supplier and project options are loaded here; the
// form opens once both are available.
import { computed, ref, useId, watch } from 'vue';
import Dialog from '../../../components/ui/Dialog.vue';
import Button from '../../../components/ui/Button.vue';
import Notice from '../../../components/ui/Notice.vue';
import FormField from '../../../components/ui/FormField.vue';
import TextInput from '../../../components/ui/TextInput.vue';
import Select from '../../../components/ui/Select.vue';
import Spinner from '../../../components/ui/Spinner.vue';
import { useApiData } from '../../../composables/useApiData';
import { useSupplierDirectory, type SupplierSummary } from '../../../composables/useSupplierDirectory';
import { apiPost } from '../../../lib/api';
import { t } from '../../../lib/i18n';
import { CURRENCIES } from '../../../lib/labels';
import { localToday } from '../../../lib/money';
import { projectOption, type Project } from '../../../lib/projects';
import { useSessionStore } from '../../../stores/session';

const emit = defineEmits<{ close: []; saved: [] }>();

const session = useSessionStore();
const supplierSide = computed(() => !!session.user?.supplierId);
const canRead = computed(() => session.has('supplier.read') && session.has('project.read'));

// --- Options: full supplier directory, server search, projects ------------------------
const supplierQuery = ref('');
const supplierSearch = ref('');
let searchTimer: number | undefined;
watch(supplierQuery, (value) => {
  window.clearTimeout(searchTimer);
  searchTimer = window.setTimeout(() => { supplierSearch.value = value.trim(); }, 300);
});
const directory = useSupplierDirectory(() => !supplierSide.value && session.has('supplier.read'));
const searched = useSupplierDirectory(() => !supplierSide.value && session.has('supplier.read') && !!supplierSearch.value, 'APPROVED', supplierSearch);
const projectData = useApiData<{ items: Project[] }>(() => (!supplierSide.value && session.has('project.read') ? '/projects?size=100' : null));

// Suppliers found by search stay available after the search is cleared.
const seen = new Map<string, SupplierSummary>();
watch(() => searched.items.value, (items) => { for (const supplier of items ?? []) seen.set(supplier.id, supplier); });

const searching = computed(() => !!supplierQuery.value.trim());
const searchPending = computed(() => searching.value && (supplierQuery.value.trim() !== supplierSearch.value || searched.loading.value));
const supplierPool = computed(() => {
  if (searching.value) return searchPending.value ? [] : searched.items.value ?? [];
  return [...new Map([...(directory.items.value ?? []), ...seen.values()].map((s) => [s.id, s])).values()];
});
const supplierOptions = computed(() => supplierPool.value.filter((s) => s.state === 'APPROVED' && s.enabled)
  .map((s) => ({ value: s.id, label: s.name, detail: s.code })));
const supplierEmpty = computed(() => {
  if (!searching.value || searchPending.value) return '';
  return searched.error.value || (supplierOptions.value.length ? '' : t('没有匹配的供应商'));
});

const optionsError = computed(() => directory.error.value || projectData.error.value);
const ready = computed(() => canRead.value && !directory.loading.value && !projectData.loading.value && !optionsError.value
  && !!directory.items.value && !!projectData.data.value);
const projects = computed(() => (projectData.data.value?.items ?? []).filter((p) => p.enabled && p.settlementMethod !== 'LEGACY'));
const projectOptions = computed(() => projects.value.map((p) => projectOption(p, projects.value)));
const currencyOptions = CURRENCIES.map((c) => ({ value: c, label: c }));
const modeOptions = [{ value: 'QUOTE', label: t('按报价计算') }, { value: 'DIRECT', label: t('直接金额') }];

// --- Form ------------------------------------------------------------------------------
const formId = useId();
const form = ref({
  pricingMode: 'QUOTE', supplierId: '', projectId: '', sourceRef: '', baseReference: '',
  periodStart: localToday(), periodEnd: localToday(), currency: 'USD', originalAmount: '', quantity: '',
});
const busy = ref(false);
const error = ref('');
const direct = computed(() => form.value.pricingMode === 'DIRECT');
const buyout = computed(() => !direct.value && projects.value.find((p) => p.id === form.value.projectId)?.settlementMethod === 'ACCOUNT_BUYOUT');

function close() { if (!busy.value) emit('close'); }

async function submit() {
  if (busy.value) return;
  const values = form.value;
  // Native constraints are checked by the browser first; the selects here are custom.
  const missing = ([['pricingMode', t('计价方式')], ['supplierId', t('供应商')], ['projectId', t('项目')], ['currency', direct.value ? t('结算币种') : t('原始金额币种')]] as const)
    .find(([key]) => !values[key]);
  if (missing) { error.value = t('请选择{0}', [missing[1]]); return; }
  busy.value = true;
  error.value = '';
  try {
    const result = await apiPost<{ inserted: number; skipped: number }>(direct.value ? '/settlement-inputs/manual-direct' : '/settlement-inputs/manual', {
      supplierId: values.supplierId,
      projectId: values.projectId,
      pricingMode: values.pricingMode,
      rows: [{
        sourceRef: values.sourceRef,
        periodStart: values.periodStart,
        periodEnd: values.periodEnd,
        currency: values.currency,
        originalAmount: values.originalAmount,
        quantity: buyout.value ? values.quantity : null,
        baseReference: values.baseReference,
      }],
    });
    session.refresh();
    session.notify(t(direct.value ? '已录入 {0} 条，重复 {1} 条；已按真实结算金额保存' : '已录入 {0} 条，重复 {1} 条；应付金额由服务端按报价计算', [result.inserted, result.skipped]));
    emit('saved');
    emit('close');
  } catch (reason) {
    error.value = reason instanceof Error ? reason.message : t('操作失败');
  } finally {
    busy.value = false;
  }
}
</script>

<template>
  <!-- Options not ready yet: loading, failed, or no permission to read them. -->
  <Dialog v-if="!ready" :title="t('录入手工应付依据')" @close="emit('close')">
    <Notice v-if="!canRead" tone="danger">{{ t('当前账号缺少读取供应商或项目的权限，无法填写此表单。') }}</Notice>
    <Notice v-else-if="optionsError" tone="danger">
      {{ t('供应商或项目加载失败：') }}{{ optionsError }}
      <template #actions><Button size="sm" icon="refresh" @click="session.refresh()">{{ t('重新加载选项') }}</Button></template>
    </Notice>
    <div v-else class="loading"><Spinner :size="16" /></div>
  </Dialog>

  <Dialog v-else size="lg" :title="t('录入应付依据')" @close="close">
    <form :id="formId" class="form" @submit.prevent="submit">
      <fieldset>
        <legend>{{ t('关联对象与录入方式') }}</legend>
        <div class="grid">
          <FormField :label="t('计价方式')" required class="full">
            <template #default="{ id }">
              <Select :id="id" v-model="form.pricingMode" :options="modeOptions" :label="t('计价方式')" :disabled="busy" />
            </template>
          </FormField>
          <FormField :label="t('供应商')" required class="full">
            <template #default="{ id }">
              <Select :id="id" v-model="form.supplierId" :options="supplierOptions" :label="t('供应商')" icon="users" searchable
                :placeholder="t('请选择')" :search-placeholder="t('搜索供应商名称或编码')" :search-loading="searchPending"
                :empty-text="supplierEmpty || undefined" :disabled="busy" @search="supplierQuery = $event" />
            </template>
          </FormField>
          <FormField :label="t('项目')" required class="full">
            <template #default="{ id }">
              <Select :id="id" v-model="form.projectId" :options="projectOptions" :label="t('项目')" :placeholder="t('请选择')" searchable :disabled="busy" />
            </template>
          </FormField>
        </div>
      </fieldset>

      <fieldset>
        <legend>{{ t('款项信息') }}</legend>
        <div class="grid">
          <FormField :label="t('来源单号')" :hint="t('同一供应商和项目下保持唯一，用于防止重复结算')" required class="full">
            <template #default="{ id }"><TextInput :id="id" v-model="form.sourceRef" required autocomplete="off" :disabled="busy" /></template>
          </FormField>
          <FormField :label="t('款项说明')" required class="full">
            <template #default="{ id }"><TextInput :id="id" v-model="form.baseReference" required autocomplete="off" :disabled="busy" /></template>
          </FormField>
        </div>
      </fieldset>

      <fieldset>
        <legend>{{ t('所属期间与金额') }}</legend>
        <div class="grid">
          <FormField :label="t('金额所属开始日期')" required>
            <template #default="{ id }"><TextInput :id="id" v-model="form.periodStart" type="date" required :disabled="busy" /></template>
          </FormField>
          <FormField :label="t('金额所属结束日期')" required>
            <template #default="{ id }"><TextInput :id="id" v-model="form.periodEnd" type="date" required :disabled="busy" /></template>
          </FormField>
          <FormField :label="direct ? t('结算币种') : t('原始金额币种')" required>
            <template #default="{ id }">
              <Select :id="id" v-model="form.currency" :options="currencyOptions" :label="direct ? t('结算币种') : t('原始金额币种')" :disabled="busy" />
            </template>
          </FormField>
          <FormField :label="direct ? t('真实结算金额') : t('原始金额')" required>
            <template #default="{ id }">
              <TextInput :id="id" v-model="form.originalAmount" type="number" min="0" :step="direct ? '0.01' : '0.00000001'" required autocomplete="off" :disabled="busy" />
            </template>
          </FormField>
          <FormField v-if="buyout" :label="t('买断账号数量')" required>
            <template #default="{ id }"><TextInput :id="id" v-model="form.quantity" type="number" min="1" step="1" required autocomplete="off" :disabled="busy" /></template>
          </FormField>
        </div>
      </fieldset>

      <Notice>{{ direct
        ? t('仅关联供应商和项目，无需报价；填写金额即为应付金额。提交后进入待结算，付款仍需先完成供应商金额确认。')
        : t('填写原始金额后，系统按该供应商和项目的有效报价计算应付。跨越调价日期的金额需要拆分；付款仍需先完成供应商金额确认。') }}</Notice>
      <Notice v-if="error" tone="danger">{{ error }}</Notice>
    </form>
    <template #footer>
      <Button :disabled="busy" @click="close">{{ t('取消') }}</Button>
      <Button type="submit" :form="formId" variant="primary" :loading="busy">
        {{ busy ? t('正在提交…') : direct ? t('保存真实结算金额') : t('校验报价并计算应付') }}
      </Button>
    </template>
  </Dialog>
</template>

<style scoped>
.loading { display: grid; place-items: center; padding: 28px; color: var(--hs-text-3); }
.form { display: grid; gap: 18px; }
fieldset { min-width: 0; margin: 0; padding: 0; border: 0; }
legend { margin-bottom: 10px; padding: 0; color: var(--hs-text); font-size: var(--hs-text-sm); font-weight: 600; }
.grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 14px 16px; }
.full { grid-column: 1 / -1; }
@media (max-width: 640px) { .grid { grid-template-columns: minmax(0, 1fr); } }
</style>
