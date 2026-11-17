<script setup lang="ts" generic="T extends string">
// Pill segmented control for switching views or filters with few options.
defineProps<{ options: Array<{ value: T; label: string; count?: number | string }>; label: string }>();
const model = defineModel<T>({ required: true });
</script>

<template>
  <div class="hs-segmented" role="tablist" :aria-label="label">
    <button
      v-for="option in options"
      :key="option.value"
      type="button"
      role="tab"
      :aria-selected="model === option.value"
      :class="{ active: model === option.value }"
      @click="model = option.value"
    >
      {{ option.label }}<span v-if="option.count !== undefined" class="hs-segmented-count">{{ option.count }}</span>
    </button>
  </div>
</template>

<style scoped>
.hs-segmented { display: inline-flex; gap: 2px; padding: 3px; background: #efefef; border-radius: 999px; max-width: 100%; overflow-x: auto; }
.hs-segmented button {
  display: inline-flex; align-items: center; gap: 6px;
  height: 28px; min-height: 0; padding: 0 12px;
  color: var(--hs-text-2); background: transparent; border: 0; border-radius: 999px;
  font: inherit; font-size: var(--hs-text-xs); font-weight: 500; white-space: nowrap; cursor: pointer;
}
.hs-segmented button:hover:not(.active) { color: var(--hs-text); }
.hs-segmented button.active { color: var(--hs-text); background: var(--hs-surface); box-shadow: 0 1px 2px rgb(0 0 0 / 8%), 0 0 0 1px rgb(0 0 0 / 4%); }
.hs-segmented button:focus-visible { outline: none; box-shadow: var(--hs-accent-ring); }
.hs-segmented-count { color: var(--hs-text-3); font-variant-numeric: tabular-nums; }
</style>
