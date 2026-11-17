<script setup lang="ts">
// A labelled on/off switch row (native checkbox underneath).
defineProps<{ label: string; hint?: string; disabled?: boolean; name?: string }>();
const model = defineModel<boolean>({ required: true });
</script>

<template>
  <label class="sys-switch" :class="{ disabled }">
    <span class="sys-switch-text">
      <strong>{{ label }}</strong>
      <small v-if="hint">{{ hint }}</small>
    </span>
    <input v-model="model" type="checkbox" role="switch" :name="name" :disabled="disabled" />
    <span class="sys-switch-track" aria-hidden="true" />
  </label>
</template>

<style scoped>
.sys-switch { position: relative; display: flex; align-items: center; justify-content: space-between; gap: 20px; padding: 12px 0; cursor: pointer; }
.sys-switch.disabled { cursor: not-allowed; opacity: .7; }
.sys-switch-text { display: grid; gap: 3px; min-width: 0; }
.sys-switch-text strong { color: var(--hs-text); font-size: var(--hs-text-sm); font-weight: 500; }
.sys-switch-text small { color: var(--hs-text-3); font-size: var(--hs-text-xs); line-height: 1.6; }
.sys-switch input { position: absolute; width: 1px; height: 1px; opacity: 0; pointer-events: none; }
.sys-switch-track { position: relative; flex: none; width: 36px; height: 20px; background: var(--hs-border-strong); border-radius: 999px; transition: background .15s; }
.sys-switch-track::after { content: ''; position: absolute; top: 2px; left: 2px; width: 16px; height: 16px; background: #fff; border-radius: 50%; box-shadow: 0 1px 2px rgb(0 0 0 / 20%); transition: transform .15s; }
.sys-switch input:checked + .sys-switch-track { background: var(--hs-primary); }
.sys-switch input:checked + .sys-switch-track::after { transform: translateX(16px); }
.sys-switch input:focus-visible + .sys-switch-track { box-shadow: var(--hs-accent-ring); }
</style>
