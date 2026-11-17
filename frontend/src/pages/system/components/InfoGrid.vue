<script setup lang="ts">
// Label/value grid like DetailList, but a value can be replaced through a
// `#<key>` slot (badges, links, code). Empty values show an em dash.
withDefaults(defineProps<{ items: Array<{ key: string; label: string; value?: string | number | null }>; columns?: number }>(), { columns: 2 });
</script>

<template>
  <dl class="sys-info" :style="{ '--columns': columns }">
    <div v-for="item in items" :key="item.key">
      <dt>{{ item.label }}</dt>
      <dd>
        <slot :name="item.key" :item="item">{{ item.value === null || item.value === undefined || item.value === '' ? '—' : item.value }}</slot>
      </dd>
    </div>
  </dl>
</template>

<style scoped>
.sys-info { display: grid; grid-template-columns: repeat(var(--columns), minmax(0, 1fr)); gap: 14px 24px; margin: 0; }
.sys-info dt { color: var(--hs-text-3); font-size: var(--hs-text-xs); }
.sys-info dd { margin: 3px 0 0; color: var(--hs-text); font-size: var(--hs-text-sm); line-height: 1.6; overflow-wrap: anywhere; white-space: pre-wrap; }
@media (max-width: 560px) { .sys-info { grid-template-columns: minmax(0, 1fr); } }
</style>
