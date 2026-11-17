<script setup lang="ts">
// Google service-account JSON for a Vertex delivery: upload a local file or
// paste the JSON. `upload` resolves true when the file was accepted; only then
// is its name shown.
import { computed, ref, useId } from 'vue';
import Button from '../../../components/ui/Button.vue';
import TextInput from '../../../components/ui/TextInput.vue';
import { t } from '../../../lib/i18n';
import { parseServiceAccount } from './newDelivery';

const props = defineProps<{ value: string; disabled?: boolean; scope: string; upload: (file: File) => Promise<boolean> }>();
const emit = defineEmits<{ change: [value: string] }>();

const id = useId();
const fileInput = ref<HTMLInputElement | null>(null);
const fileName = ref('');
const parsed = computed(() => {
  try { return props.value.trim() ? parseServiceAccount(props.value) : null; } catch { return null; }
});

function onFile(event: Event) {
  const input = event.target as HTMLInputElement;
  const file = input.files?.[0];
  input.value = '';
  if (file) props.upload(file).then((accepted) => { if (accepted) fileName.value = file.name; });
}
function onInput(value: string) {
  fileName.value = '';
  emit('change', value);
}
</script>

<template>
  <div class="rs-sa">
    <label class="rs-sa-label" :for="id">{{ t('服务账号 JSON') }}</label>
    <div class="rs-sa-row">
      <Button size="sm" icon="upload" :disabled="disabled" @click="fileInput?.click()">{{ t('上传 JSON 文件') }}</Button>
      <input
        ref="fileInput"
        class="rs-sa-file"
        type="file"
        accept=".json,application/json"
        tabindex="-1"
        :aria-label="t('{0}上传 JSON 文件', [scope])"
        :disabled="disabled"
        @change="onFile"
      >
      <span v-if="fileName" class="rs-sa-name">{{ t('已读取：') }}{{ fileName }}</span>
    </div>
    <TextInput
      :id="id"
      :model-value="value"
      multiline
      :rows="4"
      autocomplete="off"
      spellcheck="false"
      :disabled="disabled"
      :aria-label="t('{0}服务账号 JSON', [scope])"
      :placeholder="t('上传服务账号 JSON 文件，或在这里粘贴完整 JSON')"
      @update:model-value="onInput"
    />
    <small>{{ t('文件在本地读取并填入当前资料，确认交付时一并提交。支持 JSON 文件，最大 1 MiB。') }}</small>
    <small v-if="parsed">{{ t('项目：') }}{{ String(parsed.project_id) }}{{ t(' · 服务账号：') }}{{ String(parsed.client_email) }}</small>
  </div>
</template>

<style scoped>
.rs-sa { display: grid; gap: 6px; min-width: 0; }
.rs-sa-label { color: var(--hs-text-2); font-size: var(--hs-text-sm); font-weight: 500; }
.rs-sa-row { display: flex; flex-wrap: wrap; align-items: center; gap: 10px; }
.rs-sa-file { display: none; }
.rs-sa-name { color: var(--hs-text-2); font-size: var(--hs-text-xs); overflow-wrap: anywhere; }
.rs-sa small { color: var(--hs-text-3); font-size: var(--hs-text-xs); }
</style>
