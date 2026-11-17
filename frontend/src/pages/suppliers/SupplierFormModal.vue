<script setup lang="ts">
// Declarative form dialog used by the supplier pages (port of the recovered
// FormModal): fields are required unless `required: false`, hidden fields keep
// their values, browser validation runs first, then the first empty required
// select is reported as "请选择{label}". Closes after a successful submit.
import { computed, ref, useId } from 'vue';
import Dialog from '../../components/ui/Dialog.vue';
import Button from '../../components/ui/Button.vue';
import Notice from '../../components/ui/Notice.vue';
import Select from '../../components/ui/Select.vue';
import TextInput from '../../components/ui/TextInput.vue';
import { t } from '../../lib/i18n';
import type { FormFieldSpec, FormValues } from './supplierAdmin';

const props = defineProps<{
  title: string;
  subtitle?: string;
  fields: FormFieldSpec[];
  initial?: FormValues;
  submitLabel?: string;
  onSubmit: (values: FormValues) => Promise<void>;
}>();
const emit = defineEmits<{ close: [] }>();

const formId = useId();
const values = ref<FormValues>({ ...(props.initial ?? {}) });
const error = ref('');
const busy = ref(false);
let locked = false;

const shown = computed(() => props.fields.filter((field) => !field.visible || field.visible(values.value)));
const optionsOf = (field: FormFieldSpec) => (typeof field.options === 'function' ? field.options(values.value) : field.options ?? []);

function change(field: FormFieldSpec, value: string) {
  const current = values.value;
  const extra = field.valuesOnChange?.(value, current) ?? {};
  values.value = {
    ...current,
    ...Object.fromEntries((field.clearOnChange ?? []).map((name) => [name, ''])),
    ...extra,
    [field.name]: value,
  };
}

function close() { if (!busy.value) emit('close'); }

async function submit() {
  if (locked) return;
  const missing = props.fields.find((field) => field.type === 'select' && field.required !== false
    && (!field.visible || field.visible(values.value)) && !values.value[field.name]);
  if (missing) { error.value = t('请选择{0}', [missing.label]); return; }
  locked = true;
  busy.value = true;
  error.value = '';
  try {
    await props.onSubmit(values.value);
    emit('close');
  } catch (reason) {
    error.value = reason instanceof Error ? reason.message : t('操作失败');
  } finally {
    locked = false;
    busy.value = false;
  }
}
</script>

<template>
  <Dialog :title="title" :subtitle="subtitle" @close="close">
    <form :id="formId" class="sf-form" @submit.prevent="submit">
      <div v-for="field in shown" :key="field.name" class="sf-field" :class="{ full: field.full }">
        <label :for="`${formId}-${field.name}`" class="sf-label">
          {{ field.label }}<em v-if="field.required !== false" aria-hidden="true">*</em>
        </label>
        <Select
          v-if="field.type === 'select'"
          :id="`${formId}-${field.name}`"
          :model-value="values[field.name] || ''"
          :options="optionsOf(field)"
          :label="field.label"
          :placeholder="t('请选择')"
          :searchable="field.searchable"
          :disabled="busy"
          @update:model-value="change(field, String($event))"
        />
        <TextInput
          v-else
          :id="`${formId}-${field.name}`"
          :model-value="values[field.name] || ''"
          :type="field.type === 'textarea' ? 'text' : field.type || 'text'"
          :multiline="field.type === 'textarea'"
          :required="field.required !== false"
          :autocomplete="field.type === 'password' ? 'new-password' : 'off'"
          :min="field.min"
          :max="field.max"
          :minlength="field.minLength"
          :step="field.type === 'textarea' ? undefined : field.step || 'any'"
          :placeholder="field.placeholder"
          :disabled="busy"
          @update:model-value="change(field, $event)"
        />
        <small v-if="field.hint" class="sf-hint">{{ field.hint }}</small>
      </div>
    </form>
    <Notice v-if="error" tone="danger" class="sf-error">{{ error }}</Notice>
    <template #footer>
      <Button :disabled="busy" @click="close">{{ t('取消') }}</Button>
      <Button variant="primary" type="submit" :form="formId" :loading="busy">{{ busy ? t('正在提交…') : submitLabel ?? t('保存') }}</Button>
    </template>
  </Dialog>
</template>

<style scoped>
.sf-form { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 14px 16px; }
.sf-field { display: grid; gap: 6px; align-content: start; min-width: 0; }
.sf-field.full { grid-column: 1 / -1; }
.sf-label { color: var(--hs-text-2); font-size: var(--hs-text-sm); font-weight: 500; }
.sf-label em { margin-left: 2px; color: var(--hs-danger); font-style: normal; }
.sf-hint { color: var(--hs-text-3); font-size: var(--hs-text-xs); line-height: 1.5; }
.sf-error { margin-top: 14px; }
@media (max-width: 640px) { .sf-form { grid-template-columns: minmax(0, 1fr); } }
</style>
