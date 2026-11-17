<script setup lang="ts">
// Dialog around a native form, mirroring the old FormModal: native `required`
// validation, an optional `validate` step (e.g. "请选择…" for selects), busy
// state, inline error, and close after a successful submit. A secondary submit
// (e.g. "save as draft") calls `onSubmit(true)`.
import { ref, useId } from 'vue';
import Dialog from '../../../components/ui/Dialog.vue';
import Button from '../../../components/ui/Button.vue';
import Notice from '../../../components/ui/Notice.vue';
import { t } from '../../../lib/i18n';

const props = withDefaults(defineProps<{
  title: string;
  subtitle?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  submitLabel?: string;
  secondaryLabel?: string;
  submitVariant?: 'primary' | 'danger';
  submitDisabled?: boolean;
  validate?: () => string;
  onSubmit: (secondary: boolean) => Promise<void>;
}>(), { size: 'md', submitVariant: 'primary' });
const emit = defineEmits<{ close: [] }>();

const formId = useId();
const busy = ref(false);
const error = ref('');

function close() { if (!busy.value) emit('close'); }

async function submit(event: SubmitEvent) {
  if (busy.value || props.submitDisabled) return;
  const secondary = (event.submitter as HTMLElement | null)?.dataset.formAction === 'secondary';
  const problem = props.validate?.() ?? '';
  if (problem) { error.value = problem; return; }
  busy.value = true;
  error.value = '';
  try {
    await props.onSubmit(secondary);
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
  <Dialog :title="title" :subtitle="subtitle" :size="size" @close="close">
    <form :id="formId" class="sys-form" @submit.prevent="submit($event as SubmitEvent)">
      <slot :busy="busy" />
      <Notice v-if="error" tone="danger">{{ error }}</Notice>
    </form>
    <template #footer>
      <Button :disabled="busy" @click="close">{{ t('取消') }}</Button>
      <Button v-if="secondaryLabel" type="submit" :form="formId" data-form-action="secondary" :disabled="busy || submitDisabled">
        {{ busy ? t('正在提交…') : secondaryLabel }}
      </Button>
      <Button type="submit" :form="formId" :variant="submitVariant" :disabled="busy || submitDisabled">
        {{ busy ? t('正在提交…') : submitLabel ?? t('保存') }}
      </Button>
    </template>
  </Dialog>
</template>

<style scoped>
.sys-form { display: grid; gap: 16px; }
</style>
