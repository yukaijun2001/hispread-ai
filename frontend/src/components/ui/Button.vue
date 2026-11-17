<script setup lang="ts">
import Icon from './Icon.vue';
import Spinner from './Spinner.vue';
import type { IconName } from './icons';

withDefaults(defineProps<{
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'sm' | 'md';
  icon?: IconName;
  trailingIcon?: IconName;
  loading?: boolean;
  disabled?: boolean;
  type?: 'button' | 'submit' | 'reset';
  block?: boolean;
}>(), { variant: 'secondary', size: 'md', type: 'button' });
</script>

<template>
  <button
    class="hs-button"
    :class="[variant, size, { block, loading }]"
    :type="type"
    :disabled="disabled || loading"
    :aria-busy="loading || undefined"
  >
    <Spinner v-if="loading" :size="14" />
    <Icon v-else-if="icon" :name="icon" :size="size === 'sm' ? 14 : 16" />
    <span v-if="$slots.default" class="hs-button-label"><slot /></span>
    <Icon v-if="trailingIcon" :name="trailingIcon" :size="size === 'sm' ? 14 : 16" />
  </button>
</template>

<style scoped>
.hs-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 7px;
  height: var(--hs-control-height);
  min-height: 0;
  padding: 0 15px;
  border: 1px solid transparent;
  border-radius: 999px;
  font: inherit;
  font-size: var(--hs-text-sm);
  font-weight: 500;
  line-height: 1;
  white-space: nowrap;
  cursor: pointer;
  opacity: 1;
  transition: background .15s, border-color .15s, box-shadow .15s, color .15s;
}
.hs-button.sm { height: var(--hs-control-height-sm); padding: 0 11px; font-size: var(--hs-text-xs); gap: 5px; }
.hs-button.block { width: 100%; }
.hs-button:focus-visible { outline: none; box-shadow: var(--hs-accent-ring); }
.hs-button:disabled { cursor: not-allowed; opacity: .5; }
.hs-button.loading { opacity: .8; }

.hs-button.primary {
  color: #fff;
  background: linear-gradient(180deg, var(--hs-primary-top), var(--hs-primary));
  border-color: var(--hs-primary);
  box-shadow: var(--hs-shadow-primary);
}
.hs-button.primary:hover:not(:disabled) { background: linear-gradient(180deg, #4a4a4a, #262626); }
.hs-button.primary:focus-visible { box-shadow: var(--hs-shadow-primary), var(--hs-accent-ring); }

.hs-button.secondary { color: var(--hs-text); background: var(--hs-surface); border-color: var(--hs-border-strong); box-shadow: var(--hs-shadow-control); }
.hs-button.secondary:hover:not(:disabled) { background: var(--hs-surface-subtle); border-color: #c8c8c8; }

.hs-button.ghost { color: var(--hs-text-2); background: transparent; }
.hs-button.ghost:hover:not(:disabled) { color: var(--hs-text); background: var(--hs-surface-hover); }

.hs-button.danger { color: var(--hs-danger); background: var(--hs-surface); border-color: #f0d0d5; }
.hs-button.danger:hover:not(:disabled) { background: var(--hs-danger-soft); }

.hs-button-label { overflow: hidden; text-overflow: ellipsis; }
</style>
