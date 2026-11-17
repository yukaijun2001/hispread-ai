<script setup lang="ts">
import Icon from './Icon.vue';

withDefaults(defineProps<{ tone?: 'neutral' | 'info' | 'warning' | 'danger' | 'success'; title?: string }>(), { tone: 'neutral' });
</script>

<template>
  <div class="hs-notice" :class="tone" :role="tone === 'danger' ? 'alert' : 'status'">
    <Icon :name="tone === 'danger' || tone === 'warning' ? 'alert' : tone === 'success' ? 'check' : 'info'" :size="16" />
    <div class="hs-notice-body">
      <strong v-if="title">{{ title }}</strong>
      <div class="hs-notice-text"><slot /></div>
    </div>
    <div v-if="$slots.actions" class="hs-notice-actions"><slot name="actions" /></div>
  </div>
</template>

<style scoped>
.hs-notice {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  padding: 11px 14px;
  border: 1px solid var(--hs-border);
  border-radius: 12px;
  color: var(--hs-text-2);
  background: var(--hs-surface-subtle);
  font-size: var(--hs-text-sm);
  line-height: 1.6;
}
.hs-notice > .hs-icon { margin-top: 2px; }
.hs-notice-body { flex: 1; min-width: 0; }
.hs-notice-body strong { display: block; color: inherit; font-weight: 600; }
.hs-notice-text { overflow-wrap: anywhere; }
.hs-notice-actions { display: flex; align-items: center; gap: 8px; flex: none; align-self: center; }
.info { color: #2a4fb3; background: var(--hs-accent-soft); border-color: #dbe5fd; }
.warning { color: var(--hs-warning); background: var(--hs-warning-soft); border-color: #f2e2c2; }
.danger { color: var(--hs-danger); background: var(--hs-danger-soft); border-color: #f2d5da; }
.success { color: var(--hs-success); background: var(--hs-success-soft); border-color: #cfe9db; }
</style>
