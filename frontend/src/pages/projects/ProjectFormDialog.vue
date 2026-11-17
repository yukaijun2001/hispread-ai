<script setup lang="ts">
// New / copy / edit project. A copy starts from the source project's values;
// the server assigns the project code. Suggested discount is edited as a
// percentage ("27") and sent as a ratio ("0.27").
import { computed, reactive, ref, useId } from 'vue';
import Dialog from '../../components/ui/Dialog.vue';
import Button from '../../components/ui/Button.vue';
import Notice from '../../components/ui/Notice.vue';
import FormField from '../../components/ui/FormField.vue';
import Select from '../../components/ui/Select.vue';
import TextInput from '../../components/ui/TextInput.vue';
import { apiPost, apiPut } from '../../lib/api';
import { divide100, t, times100 } from '../../lib/i18n';
import { CURRENCIES } from '../../lib/labels';
import { useSessionStore } from '../../stores/session';
import { ENABLED_OPTIONS, type CategoryCode, type ProjectRow } from './projectAdmin';

const props = defineProps<{
  /** `new` creates (optionally copying `project`); `edit` updates `project`. */
  mode: 'new' | 'edit';
  project: ProjectRow | null;
  categoryCodes: CategoryCode[];
}>();
const emit = defineEmits<{ close: [] }>();
const session = useSessionStore();
const formId = useId();

type Field = 'category' | 'name' | 'settlementMethod' | 'deliveryMethod' | 'capacityType' | 'capacityScope'
  | 'capacityPeriod' | 'capacityCurrency' | 'enabled' | 'suggestedMultiplier' | 'description';

function initialValues(): Record<Field, string> {
  const source = props.project;
  const blank: Record<Field, string> = {
    category: '', name: '', settlementMethod: '', deliveryMethod: '', capacityType: '', capacityScope: '',
    capacityPeriod: '', capacityCurrency: '', enabled: '', suggestedMultiplier: '', description: '',
  };
  if (props.mode === 'new' && !source) {
    return { ...blank, enabled: 'true', settlementMethod: 'QUOTA', deliveryMethod: 'KEY', capacityType: 'ACCOUNT_QUOTA', capacityScope: 'TOTAL', capacityPeriod: 'TOTAL', capacityCurrency: 'USD' };
  }
  if (!source) return blank;
  if (props.mode === 'new') {
    return {
      category: source.category ?? '',
      name: source.name,
      description: source.description ?? '',
      enabled: String(source.enabled),
      settlementMethod: source.settlementMethod === 'LEGACY' ? 'QUOTA' : source.settlementMethod,
      deliveryMethod: source.deliveryMethod === 'LEGACY' ? 'KEY' : source.deliveryMethod,
      capacityType: source.capacityType || 'ACCOUNT_QUOTA',
      capacityScope: source.capacityScope || 'TOTAL',
      capacityPeriod: source.capacityPeriod || 'TOTAL',
      capacityCurrency: source.capacityCurrency || 'USD',
      suggestedMultiplier: times100(source.suggestedMultiplier || ''),
    };
  }
  return {
    name: source.name,
    category: source.category ?? '',
    enabled: String(source.enabled),
    description: source.description ?? '',
    settlementMethod: source.settlementMethod === 'LEGACY' ? '' : source.settlementMethod,
    deliveryMethod: source.deliveryMethod === 'LEGACY' ? '' : source.deliveryMethod,
    capacityType: source.capacityType || '',
    capacityScope: source.capacityScope || '',
    capacityPeriod: source.capacityPeriod || '',
    capacityCurrency: source.capacityCurrency || '',
    suggestedMultiplier: times100(source.suggestedMultiplier || ''),
  };
}

const values = reactive(initialValues());
const busy = ref(false);
const error = ref('');
const form = ref<HTMLFormElement | null>(null);
const quota = computed(() => values.capacityType === 'ACCOUNT_QUOTA');

function setField(field: Field, value: string) {
  // A different capacity type has different scope, period and currency.
  if (field === 'capacityType') Object.assign(values, { capacityScope: '', capacityPeriod: '', capacityCurrency: '' });
  values[field] = value;
}

const title = computed(() => t(props.mode === 'new' ? (props.project ? '复制项目' : '新建项目') : '编辑项目'));
const categoryOptions = computed(() => props.categoryCodes.map((code) => ({
  value: code.code,
  label: code.name,
  detail: code.code,
  disabled: !code.enabled && (props.mode === 'new' || props.project?.category !== code.code),
})));
const settlementOptions = [{ value: 'QUOTA', label: t('额度结算') }, { value: 'ACCOUNT_BUYOUT', label: t('账号买断') }];
const deliveryOptions = [{ value: 'ACCOUNT', label: t('交付账号') }, { value: 'KEY', label: t('交付密钥') }, { value: 'RELAY', label: t('中转站') }];
const capacityTypeOptions = [{ value: 'ACCOUNT_COUNT', label: t('账号数量') }, { value: 'ACCOUNT_QUOTA', label: t('账号额度') }, { value: 'THROUGHPUT', label: t('调用能力（RPM + TPM）') }];
const scopeOptions = [{ value: 'PER_ACCOUNT', label: t('单账号') }, { value: 'TOTAL', label: t('全部账号合计') }];
const periodOptions = [{ value: 'TOTAL', label: t('总额度') }, { value: 'DAY', label: t('每日') }, { value: 'MONTH', label: t('每月') }];
const currencyOptions = CURRENCIES.map((currency) => ({ value: currency, label: currency }));
const enabledOptions = ENABLED_OPTIONS();

// Required selects in form order; the first empty one is reported and focused.
const requiredSelects = computed<Array<[Field, string]>>(() => [
  ['category', t('项目大类')],
  ['settlementMethod', t('结算方式')],
  ['deliveryMethod', t('交付方式')],
  ['capacityType', t('能力类型')],
  ...(quota.value ? [['capacityScope', t('额度范围')], ['capacityPeriod', t('额度周期')], ['capacityCurrency', t('额度面值币种')]] as Array<[Field, string]> : []),
  ['enabled', t('状态')],
]);

function close() { if (!busy.value) emit('close'); }

async function submit() {
  if (busy.value) return;
  const missing = requiredSelects.value.find(([field]) => !values[field]);
  if (missing) {
    error.value = t('请选择{0}', [missing[1]]);
    form.value?.querySelector<HTMLElement>(`[data-field="${missing[0]}"] .hs-select`)?.focus();
    return;
  }
  busy.value = true;
  error.value = '';
  try {
    const body = {
      category: values.category.trim(),
      name: values.name,
      settlementMethod: values.settlementMethod,
      deliveryMethod: values.deliveryMethod,
      capacityType: values.capacityType,
      capacityScope: quota.value ? values.capacityScope : null,
      capacityPeriod: quota.value ? values.capacityPeriod : null,
      capacityCurrency: quota.value ? values.capacityCurrency : null,
      description: values.description || '',
      suggestedMultiplier: divide100((values.suggestedMultiplier || '').trim()),
      enabled: values.enabled === 'true',
      version: props.mode === 'new' ? 0 : props.project!.version,
    };
    if (props.mode === 'new') await apiPost('/projects', body);
    else await apiPut('/projects/' + props.project!.id, body);
    session.refresh();
    session.notify(t('项目已保存'));
    busy.value = false;
    emit('close');
  } catch (reason) {
    error.value = reason instanceof Error ? reason.message : t('操作失败');
  } finally {
    busy.value = false;
  }
}
</script>

<template>
  <Dialog size="lg" :title="title" :subtitle="mode === 'new' ? t('项目编号将在保存后由系统自动生成。') : undefined" @close="close">
    <form :id="formId" ref="form" class="grid" @submit.prevent="submit">
      <FormField class="full" data-field="category" :label="t('项目大类')" :hint="t('大类选项在“维护大类码值”中新增和启停')">
        <template #default="{ id }">
          <Select :id="id" :model-value="values.category" :options="categoryOptions" :label="t('项目大类')" :placeholder="t('请选择')" searchable
            :disabled="busy" @update:model-value="setField('category', String($event))" />
        </template>
      </FormField>
      <FormField class="full" data-field="name" :label="t('项目名称')">
        <template #default="{ id }"><TextInput :id="id" v-model="values.name" required :disabled="busy" /></template>
      </FormField>
      <FormField data-field="settlementMethod" :label="t('结算方式')">
        <template #default="{ id }">
          <Select :id="id" :model-value="values.settlementMethod" :options="settlementOptions" :label="t('结算方式')" :placeholder="t('请选择')"
            :disabled="busy" @update:model-value="setField('settlementMethod', String($event))" />
        </template>
      </FormField>
      <FormField data-field="deliveryMethod" :label="t('交付方式')">
        <template #default="{ id }">
          <Select :id="id" :model-value="values.deliveryMethod" :options="deliveryOptions" :label="t('交付方式')" :placeholder="t('请选择')"
            :disabled="busy" @update:model-value="setField('deliveryMethod', String($event))" />
        </template>
      </FormField>
      <FormField class="full" data-field="capacityType" :label="t('能力类型')" :hint="t('首版每个项目只使用一种能力口径')">
        <template #default="{ id }">
          <Select :id="id" :model-value="values.capacityType" :options="capacityTypeOptions" :label="t('能力类型')" :placeholder="t('请选择')"
            :disabled="busy" @update:model-value="setField('capacityType', String($event))" />
        </template>
      </FormField>
      <template v-if="quota">
        <FormField data-field="capacityScope" :label="t('额度范围')">
          <template #default="{ id }">
            <Select :id="id" :model-value="values.capacityScope" :options="scopeOptions" :label="t('额度范围')" :placeholder="t('请选择')"
              :disabled="busy" @update:model-value="setField('capacityScope', String($event))" />
          </template>
        </FormField>
        <FormField data-field="capacityPeriod" :label="t('额度周期')">
          <template #default="{ id }">
            <Select :id="id" :model-value="values.capacityPeriod" :options="periodOptions" :label="t('额度周期')" :placeholder="t('请选择')"
              :disabled="busy" @update:model-value="setField('capacityPeriod', String($event))" />
          </template>
        </FormField>
        <FormField data-field="capacityCurrency" :label="t('额度面值币种')">
          <template #default="{ id }">
            <Select :id="id" :model-value="values.capacityCurrency" :options="currencyOptions" :label="t('额度面值币种')" :placeholder="t('请选择')"
              :disabled="busy" @update:model-value="setField('capacityCurrency', String($event))" />
          </template>
        </FormField>
      </template>
      <FormField data-field="enabled" :label="t('状态')">
        <template #default="{ id }">
          <Select :id="id" :model-value="values.enabled" :options="enabledOptions" :label="t('状态')" :placeholder="t('请选择')"
            :disabled="busy" @update:model-value="setField('enabled', String($event))" />
        </template>
      </FormField>
      <FormField data-field="suggestedMultiplier" optional :label="t('建议折扣')" :hint="t('输入 27 表示 27折（原金额的 27%）。仅作建议，不限制实际报价。')">
        <template #default="{ id }"><TextInput :id="id" v-model="values.suggestedMultiplier" :placeholder="t('例如 27')" :disabled="busy" /></template>
      </FormField>
      <FormField class="full" data-field="description" optional :label="t('项目说明')">
        <template #default="{ id }"><TextInput :id="id" v-model="values.description" multiline :rows="3" :disabled="busy" /></template>
      </FormField>
    </form>
    <Notice v-if="error" tone="danger" class="error">{{ error }}</Notice>
    <template #footer>
      <Button :disabled="busy" @click="close">{{ t('取消') }}</Button>
      <Button variant="primary" type="submit" :form="formId" :disabled="busy">{{ busy ? t('正在提交…') : t('保存') }}</Button>
    </template>
  </Dialog>
</template>

<style scoped>
.grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 14px 16px; }
.full { grid-column: 1 / -1; }
.error { margin-top: 14px; }
@media (max-width: 640px) { .grid { grid-template-columns: minmax(0, 1fr); } }
</style>
