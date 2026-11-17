<script setup lang="ts">
// A one-field form (a required reason). `submit` throws to show its error in
// the dialog; on success the caller unmounts the dialog.
import { ref, useId } from 'vue';
import Dialog from '../../../components/ui/Dialog.vue';
import Button from '../../../components/ui/Button.vue';
import Notice from '../../../components/ui/Notice.vue';
import FormField from '../../../components/ui/FormField.vue';
import TextInput from '../../../components/ui/TextInput.vue';
import { t } from '../../../lib/i18n';

const props = withDefaults(defineProps<{
  title: string;
  subtitle?: string;
  label: string;
  submitLabel?: string;
  danger?: boolean;
  submit: (note: string) => Promise<void>;
}>(), {});
const emit = defineEmits<{ close: [] }>();

const formId = useId();
const note = ref('');
const busy = ref(false);
const error = ref('');

function close() { if (!busy.value) emit('close'); }

async function onSubmit() {
  if (busy.value) return;
  busy.value = true;
  error.value = '';
  try {
    await props.submit(note.value);
  } catch (reason) {
    error.value = reason instanceof Error ? reason.message : t('操作失败');
  } finally {
    busy.value = false;
  }
}
</script>

<template>
  <Dialog size="sm" :title="title" :subtitle="subtitle" @close="close">
    <form :id="formId" class="body" @submit.prevent="onSubmit">
      <FormField :label="label" required>
        <template #default="{ id }">
          <TextInput :id="id" v-model="note" multiline :rows="3" required :disabled="busy" />
        </template>
      </FormField>
      <Notice v-if="error" tone="danger">{{ error }}</Notice>
    </form>
    <template #footer>
      <Button :disabled="busy" @click="close">{{ t('取消') }}</Button>
      <Button type="submit" :form="formId" :variant="danger ? 'danger' : 'primary'" :loading="busy">{{ busy ? t('正在提交…') : submitLabel || t('保存') }}</Button>
    </template>
  </Dialog>
</template>

<style scoped>
.body { display: grid; gap: 14px; }
</style>
