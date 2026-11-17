<script setup lang="ts">
import type { BadgeTone } from './types';

withDefaults(defineProps<{ tone?: BadgeTone; dot?: boolean }>(), { tone: 'neutral' });
</script>

<template>
  <span class="hs-badge" :class="tone">
    <span v-if="dot" class="hs-badge-dot" aria-hidden="true" />
    <slot />
  </span>
</template>

<style scoped>
.hs-badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 3px 9px;
  border-radius: 999px;
  font-size: var(--hs-text-xs);
  font-weight: 500;
  line-height: 1.35;
  white-space: nowrap;
  box-shadow: inset 0 0 0 1px rgb(0 0 0 / 4%);
}
.hs-badge-dot { width: 6px; height: 6px; border-radius: 50%; background: currentColor; flex: none; }
.neutral { color: var(--hs-text-2); background: #f1f1f1; }
.success { color: var(--hs-success); background: var(--hs-success-soft); }
.warning { color: var(--hs-warning); background: var(--hs-warning-soft); }
.danger { color: var(--hs-danger); background: var(--hs-danger-soft); }
.info { color: var(--hs-accent-hover); background: var(--hs-accent-soft); }
.violet { color: var(--hs-violet); background: var(--hs-violet-soft); }
.teal { color: var(--hs-teal); background: var(--hs-teal-soft); }
</style>
