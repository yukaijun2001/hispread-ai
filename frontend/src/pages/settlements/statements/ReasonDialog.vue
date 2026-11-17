<script setup lang="ts">
// A required free-text reason followed by one action (void, withdraw). The
// dialog stays open with the server message when the action fails.
import { ref, useId } from 'vue';
import Dialog from '../../../components/ui/Dialog.vue';
import Button from '../../../components/ui/Button.vue';
import Notice from '../../../components/ui/Notice.vue';
import FormField from '../../../components/ui/FormField.vue';
import TextInput from '../../../components/ui/TextInput.vue';
import { t } from '../../../lib/i18n';

const props = defineProps<{
  title: string;
  subtitle?: string;
  label: string;
  submitLabel?: string;
  danger?: boolean;
  onSubmit: (note: string) => Promise<void>;
}>();
const emit = defineEmits<{ close: [] }>();

const formId = useId();
const note = ref('');
const busy = ref(false);
const error = ref('');

async function submit() {
  if (busy.value) return;
  busy.value = true;
  error.value = '';
  try {
    await props.onSubmit(note.value);
    emit('close');
  } catch (reason) {
    error.value = reason instanceof Error ? reason.message : t('操作失败');
  } finally {
    busy.value = false;
  }
}
</script>

<template>
  <Dialog :title="title" :subtitle="subtitle" @close="!busy && emit('close')">
    <form :id="formId" class="st-reason" @submit.prevent="submit">
      <FormField :label="label" required>
        <template #default="{ id }">
          <TextInput :id="id" v-model="note" multiline :rows="4" required :disabled="busy" />
        </template>
      </FormField>
      <Notice v-if="error" tone="danger">{{ error }}</Notice>
    </form>
    <template #footer>
      <Button :disabled="busy" @click="emit('close')">{{ t('取消') }}</Button>
      <Button type="submit" :form="formId" :variant="danger ? 'danger' : 'primary'" :loading="busy">{{ busy ? t('正在提交…') : submitLabel || t('保存') }}</Button>
    </template>
  </Dialog>
</template>

<style scoped>
.st-reason { display: grid; gap: 14px; }
</style>
