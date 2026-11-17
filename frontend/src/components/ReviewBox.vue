<script setup lang="ts">
// Approve / send-back panel with a review note. Callers show it only when the
// reviewer is not the submitter or creator (four-eyes rule).
import { ref } from 'vue';
import Button from './ui/Button.vue';
import Dialog from './ui/Dialog.vue';
import Notice from './ui/Notice.vue';
import TextInput from './ui/TextInput.vue';
import { t } from '../lib/i18n';

const props = withDefaults(defineProps<{
  onReview: (approved: boolean, note: string) => Promise<void>;
  title?: string;
  approveLabel?: string;
  rejectLabel?: string;
  approveDisabled?: boolean;
  approveConfirmation?: string;
}>(), {});

const note = ref('');
const busy = ref(false);
const error = ref('');
const confirming = ref(false);

async function submit(approved: boolean) {
  if (busy.value) return;
  error.value = '';
  busy.value = true;
  try {
    await props.onReview(approved, note.value);
    confirming.value = false;
  } catch (reason) {
    error.value = (reason as Error).message;
  } finally {
    busy.value = false;
  }
}
</script>

<template>
  <section class="hs-review">
    <h3>{{ title ?? t('审核意见') }}</h3>
    <TextInput v-model="note" multiline :rows="3" :aria-label="title ?? t('审核意见')" :placeholder="t('填写审核意见，退回时必填')" />
    <Notice v-if="error && !confirming" tone="danger">{{ error }}</Notice>
    <div class="hs-review-actions">
      <Button :disabled="busy" @click="submit(false)">{{ rejectLabel ?? t('退回补充') }}</Button>
      <Button variant="primary" icon="check" :disabled="busy || approveDisabled" @click="approveConfirmation ? (confirming = true) : submit(true)">
        {{ approveLabel ?? t('审核通过') }}
      </Button>
    </div>
    <Dialog v-if="confirming && approveConfirmation" :title="t('确认审核通过')" size="sm" @close="!busy && (confirming = false)">
      <p class="hs-review-confirm">{{ approveConfirmation }}</p>
      <Notice v-if="error" tone="danger">{{ error }}</Notice>
      <template #footer>
        <Button :disabled="busy" @click="confirming = false">{{ t('取消') }}</Button>
        <Button variant="primary" :loading="busy" @click="submit(true)">{{ busy ? t('正在提交…') : t('确认通过') }}</Button>
      </template>
    </Dialog>
  </section>
</template>

<style scoped>
.hs-review { display: grid; gap: 10px; padding: 16px; background: var(--hs-surface-subtle); border: 1px solid var(--hs-border); border-radius: 14px; }
.hs-review h3 { margin: 0; font-size: var(--hs-text-sm); font-weight: 600; }
.hs-review-actions { display: flex; justify-content: flex-end; gap: 8px; }
.hs-review-confirm { margin: 0 0 8px; color: var(--hs-text-2); font-size: var(--hs-text-sm); line-height: 1.7; }
</style>
