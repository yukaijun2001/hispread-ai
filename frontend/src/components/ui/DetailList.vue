<script setup lang="ts">
// Label/value grid. Empty values show an em dash.
withDefaults(defineProps<{ items: Array<[string, string | number | null | undefined]>; columns?: number }>(), { columns: 2 });
</script>

<template>
  <dl class="hs-details" :style="{ '--columns': columns }">
    <div v-for="[label, value] in items" :key="label">
      <dt>{{ label }}</dt>
      <dd>{{ value === null || value === undefined || value === '' ? '—' : value }}</dd>
    </div>
  </dl>
</template>

<style scoped>
.hs-details { display: grid; grid-template-columns: repeat(var(--columns), minmax(0, 1fr)); gap: 14px 24px; margin: 0; }
.hs-details dt { color: var(--hs-text-3); font-size: var(--hs-text-xs); }
.hs-details dd { margin: 3px 0 0; color: var(--hs-text); font-size: var(--hs-text-sm); line-height: 1.6; overflow-wrap: anywhere; white-space: pre-wrap; }
@media (max-width: 560px) { .hs-details { grid-template-columns: minmax(0, 1fr); } }
</style>
