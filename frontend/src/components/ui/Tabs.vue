<script setup lang="ts" generic="T extends string">
// Underlined tabs for switching sections of one page.
defineProps<{ items: Array<{ id: T; label: string; count?: number }>; label: string }>();
const model = defineModel<T>({ required: true });
</script>

<template>
  <div class="hs-tabs" role="tablist" :aria-label="label">
    <button
      v-for="item in items"
      :key="item.id"
      type="button"
      role="tab"
      :aria-selected="model === item.id"
      :class="{ active: model === item.id }"
      @click="model = item.id"
    >
      {{ item.label }}<span v-if="item.count !== undefined" class="hs-tabs-count">{{ item.count }}</span>
    </button>
  </div>
</template>

<style scoped>
.hs-tabs { display: flex; gap: 24px; border-bottom: 1px solid var(--hs-border); overflow-x: auto; }
.hs-tabs button {
  position: relative; display: inline-flex; align-items: center; gap: 6px;
  min-height: 0; padding: 0 1px 12px;
  color: var(--hs-text-3); background: none; border: 0;
  font: inherit; font-size: var(--hs-text-sm); white-space: nowrap; cursor: pointer;
}
.hs-tabs button:hover { color: var(--hs-text); }
.hs-tabs button.active { color: var(--hs-text); font-weight: 500; }
.hs-tabs button.active::after { content: ""; position: absolute; left: 0; right: 0; bottom: -1px; height: 2px; border-radius: 2px; background: var(--hs-text); }
.hs-tabs button:focus-visible { outline: none; box-shadow: var(--hs-accent-ring); border-radius: 6px; }
.hs-tabs-count { padding: 0 6px; color: var(--hs-text-3); background: #f0f0f0; border-radius: 999px; font-size: 11px; font-variant-numeric: tabular-nums; }
</style>
