<script setup lang="ts">
import Icon from './Icon.vue';
import type { IconName } from './icons';
import { t } from '../../lib/i18n';

withDefaults(defineProps<{ text?: string; hint?: string; icon?: IconName; error?: boolean; compact?: boolean }>(), { icon: 'quote' });
defineEmits<{ retry: [] }>();
</script>

<template>
  <div class="hs-empty" :class="{ error, compact }" :role="error ? 'alert' : undefined">
    <span class="hs-empty-icon"><Icon :name="error ? 'alert' : icon" :size="22" /></span>
    <strong>{{ text || (error ? t('加载失败') : t('暂无记录')) }}</strong>
    <span v-if="hint" class="hs-empty-hint">{{ hint }}</span>
    <slot />
  </div>
</template>

<style scoped>
.hs-empty { display: flex; flex-direction: column; align-items: center; gap: 8px; padding: 48px 20px; text-align: center; color: var(--hs-text-3); }
.hs-empty.compact { padding: 28px 16px; }
.hs-empty-icon { display: grid; place-items: center; width: 48px; height: 48px; margin-bottom: 4px; color: var(--hs-text-4); background: var(--hs-surface-subtle); border: 1px solid var(--hs-border); border-radius: 14px; }
.hs-empty strong { max-width: 560px; color: var(--hs-text-2); font-size: var(--hs-text-sm); font-weight: 500; line-height: 1.7; white-space: normal; }
.hs-empty-hint { max-width: 520px; font-size: var(--hs-text-xs); line-height: 1.6; }
.error .hs-empty-icon { color: var(--hs-danger); background: var(--hs-danger-soft); border-color: #f3d6da; }
.error strong { color: var(--hs-danger); }
</style>
