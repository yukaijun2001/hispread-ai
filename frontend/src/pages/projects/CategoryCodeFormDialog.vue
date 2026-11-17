<script setup lang="ts">
// Add or edit a project category code. The code is fixed once created;
// editing changes the name and enabled state.
import { ref, useId } from 'vue';
import Dialog from '../../components/ui/Dialog.vue';
import Button from '../../components/ui/Button.vue';
import Notice from '../../components/ui/Notice.vue';
import FormField from '../../components/ui/FormField.vue';
import Select from '../../components/ui/Select.vue';
import TextInput from '../../components/ui/TextInput.vue';
import { apiPost, apiPut } from '../../lib/api';
import { t } from '../../lib/i18n';
import { useSessionStore } from '../../stores/session';
import { ENABLED_OPTIONS, type CategoryCode } from './projectAdmin';

const props = defineProps<{ category: CategoryCode | null }>();
const emit = defineEmits<{ close: [] }>();
const session = useSessionStore();
const formId = useId();

const code = ref('');
const name = ref(props.category?.name ?? '');
const enabled = ref(props.category ? String(props.category.enabled) : '');
const busy = ref(false);
const error = ref('');
const form = ref<HTMLFormElement | null>(null);
const enabledOptions = ENABLED_OPTIONS();

function close() { if (!busy.value) emit('close'); }

async function submit() {
  if (busy.value) return;
  if (props.category && !enabled.value) {
    error.value = t('请选择{0}', [t('状态')]);
    form.value?.querySelector<HTMLElement>('[data-field="enabled"] .hs-select')?.focus();
    return;
  }
  busy.value = true;
  error.value = '';
  try {
    if (!props.category) await apiPost('/projects/category-codes', { code: code.value.trim(), name: name.value.trim() });
    else {
      await apiPut(`/projects/category-codes/${encodeURIComponent(props.category.code)}`, {
        name: name.value.trim(), enabled: enabled.value === 'true', version: props.category.version,
      });
    }
    session.refresh();
    session.notify(t('项目大类已保存'));
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
  <Dialog
    :title="t(category ? '编辑项目大类' : '新增项目大类')"
    :subtitle="category ? t('码值 {0} · 已关联 {1} 个项目', [category.code, category.projectCount]) : t('新增后即可用于项目创建。')"
    @close="close"
  >
    <form :id="formId" ref="form" class="fields" @submit.prevent="submit">
      <FormField v-if="!category" :label="t('大类码值')" :hint="t('2-40位字母、数字、下划线或短横线；创建后不可修改')">
        <template #default="{ id }"><TextInput :id="id" v-model="code" required :disabled="busy" /></template>
      </FormField>
      <FormField :label="t('大类名称')">
        <template #default="{ id }"><TextInput :id="id" v-model="name" required :disabled="busy" /></template>
      </FormField>
      <FormField v-if="category" data-field="enabled" :label="t('状态')">
        <template #default="{ id }">
          <Select :id="id" v-model="enabled" :options="enabledOptions" :label="t('状态')" :placeholder="t('请选择')" :disabled="busy" />
        </template>
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
.fields { display: grid; gap: 14px; }
.error { margin-top: 14px; }
</style>
