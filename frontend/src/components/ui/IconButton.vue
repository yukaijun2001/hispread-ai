<script setup lang="ts">
import Icon from './Icon.vue';
import type { IconName } from './icons';

withDefaults(defineProps<{ icon: IconName; label: string; size?: number; bordered?: boolean }>(), { size: 18 });
</script>

<template>
  <button class="hs-icon-button" :class="{ bordered }" type="button" :aria-label="label" :title="label">
    <Icon :name="icon" :size="size" />
    <slot />
  </button>
</template>

<style scoped>
.hs-icon-button {
  position: relative;
  display: inline-grid;
  place-items: center;
  width: 32px;
  height: 32px;
  min-height: 0;
  padding: 0;
  color: var(--hs-text-2);
  background: transparent;
  border: 1px solid transparent;
  border-radius: 9px;
  cursor: pointer;
  transition: background .15s, color .15s;
}
.hs-icon-button:hover:not(:disabled) { color: var(--hs-text); background: var(--hs-surface-hover); }
.hs-icon-button:focus-visible { outline: none; box-shadow: var(--hs-accent-ring); }
.hs-icon-button:disabled { opacity: .45; cursor: not-allowed; }
.bordered { width: 36px; height: 36px; border-color: var(--hs-border-strong); border-radius: 999px; background: var(--hs-surface); box-shadow: var(--hs-shadow-control); }
</style>
