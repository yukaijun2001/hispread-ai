<script setup lang="ts">
// One attachment waiting to be uploaded; images get a local preview.
import { onBeforeUnmount, ref } from 'vue';
import IconButton from '../../../components/ui/IconButton.vue';
import Icon from '../../../components/ui/Icon.vue';
import { t } from '../../../lib/i18n';

const props = defineProps<{ file: File; disabled?: boolean }>();
const emit = defineEmits<{ remove: [] }>();

const preview = ref(props.file.type.startsWith('image/') ? URL.createObjectURL(props.file) : '');
onBeforeUnmount(() => { if (preview.value) URL.revokeObjectURL(preview.value); });
</script>

<template>
  <div class="ev-file">
    <img v-if="preview" :src="preview" :alt="file.name" />
    <span v-else class="ev-file-icon"><Icon name="quote" :size="18" /></span>
    <div class="ev-file-text">
      <strong>{{ file.name }}</strong>
      <small>{{ (file.size / 1024).toFixed(1) }} KB</small>
    </div>
    <IconButton icon="close" :size="14" :label="t('移除附件 {0}', [file.name])" :disabled="disabled" @click="emit('remove')" />
  </div>
</template>

<style scoped>
.ev-file { display: flex; align-items: center; gap: 10px; min-width: 0; padding: 6px 6px 6px 8px; background: var(--hs-surface-subtle); border: 1px solid var(--hs-border); border-radius: 10px; }
.ev-file img { width: 36px; height: 36px; object-fit: cover; border-radius: 6px; flex: none; }
.ev-file-icon { display: grid; place-items: center; width: 36px; height: 36px; color: var(--hs-text-3); background: var(--hs-surface); border-radius: 6px; flex: none; }
.ev-file-text { display: grid; flex: 1; min-width: 0; }
.ev-file-text strong { overflow: hidden; color: var(--hs-text); font-size: var(--hs-text-xs); font-weight: 500; text-overflow: ellipsis; white-space: nowrap; }
.ev-file-text small { color: var(--hs-text-3); font-size: 11px; }
</style>
