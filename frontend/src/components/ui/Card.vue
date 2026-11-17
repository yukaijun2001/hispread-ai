<script setup lang="ts">
withDefaults(defineProps<{ title?: string; description?: string; flush?: boolean; as?: string }>(), { as: 'section' });
</script>

<template>
  <component :is="as" class="hs-card" :class="{ flush }">
    <header v-if="title || $slots.header || $slots.actions" class="hs-card-head">
      <slot name="header">
        <div class="hs-card-heading">
          <h2>{{ title }}</h2>
          <p v-if="description">{{ description }}</p>
        </div>
      </slot>
      <div v-if="$slots.actions" class="hs-card-actions"><slot name="actions" /></div>
    </header>
    <div class="hs-card-body"><slot /></div>
    <footer v-if="$slots.footer" class="hs-card-foot"><slot name="footer" /></footer>
  </component>
</template>

<style scoped>
.hs-card {
  min-width: 0;
  background: var(--hs-surface);
  border: 1px solid var(--hs-border);
  border-radius: var(--hs-radius-card);
  box-shadow: var(--hs-shadow-card);
}
.hs-card-head { display: flex; align-items: flex-start; justify-content: space-between; gap: 16px; padding: 18px 20px 0; }
.hs-card-heading { min-width: 0; }
.hs-card-heading h2 { margin: 0; color: var(--hs-text); font-size: 15px; font-weight: 600; letter-spacing: -.1px; line-height: 1.4; }
.hs-card-heading p { margin: 3px 0 0; color: var(--hs-text-3); font-size: var(--hs-text-xs); line-height: 1.5; }
.hs-card-actions { display: flex; flex-wrap: wrap; align-items: center; gap: 8px; flex: none; }
.hs-card-body { padding: 16px 20px 20px; }
.flush .hs-card-body { padding: 12px 0 0; }
.flush .hs-card-head + .hs-card-body { padding-top: 12px; }
.hs-card-foot { padding: 12px 20px; border-top: 1px solid var(--hs-divider); }
</style>
