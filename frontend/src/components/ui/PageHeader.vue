<script setup lang="ts">
defineProps<{ title: string; description?: string }>();
</script>

<template>
  <header class="hs-page-header">
    <div class="hs-page-heading">
      <h1>{{ title }}</h1>
      <p v-if="description || $slots.description"><slot name="description">{{ description }}</slot></p>
    </div>
    <div v-if="$slots.actions" class="hs-page-actions"><slot name="actions" /></div>
  </header>
</template>

<style scoped>
.hs-page-header { display: flex; flex-wrap: wrap; align-items: flex-end; justify-content: space-between; gap: 12px 20px; margin-bottom: 20px; }
.hs-page-heading { min-width: 0; }
.hs-page-heading h1 { margin: 0; color: var(--hs-text); font-size: 22px; font-weight: 600; letter-spacing: -.4px; line-height: 1.3; }
.hs-page-heading p { margin: 4px 0 0; color: var(--hs-text-3); font-size: var(--hs-text-sm); line-height: 1.6; }
.hs-page-actions { display: flex; flex-wrap: wrap; align-items: center; gap: 8px; }
</style>
