<script setup lang="ts">
import { ref } from 'vue';
import Icon from './Icon.vue';
import { t } from '../../lib/i18n';

defineProps<{ placeholder?: string; label?: string }>();
const model = defineModel<string>({ default: '' });
const input = ref<HTMLInputElement | null>(null);
defineExpose({ focus: () => input.value?.focus() });
</script>

<template>
  <label class="hs-search">
    <Icon name="search" :size="16" />
    <input ref="input" v-model="model" type="search" :placeholder="placeholder" :aria-label="label || placeholder" />
    <button v-if="model" type="button" class="hs-search-clear" :aria-label="t('清除搜索')" @click="model = ''; input?.focus()">
      <Icon name="close" :size="14" />
    </button>
    <slot name="suffix" />
  </label>
</template>

<style scoped>
.hs-search {
  display: flex; align-items: center; gap: 8px;
  height: var(--hs-control-height); min-width: 0; padding: 0 12px;
  color: var(--hs-text-3); background: var(--hs-surface);
  border: 1px solid var(--hs-border-strong); border-radius: var(--hs-radius-control);
  box-shadow: var(--hs-shadow-control);
  transition: border-color .15s, box-shadow .15s;
}
.hs-search:hover { border-color: #c4c4c4; }
.hs-search:focus-within { border-color: var(--hs-accent); box-shadow: var(--hs-accent-ring); }
.hs-search input {
  flex: 1; min-width: 0; height: 100%; padding: 0;
  color: var(--hs-text); background: none; border: 0; border-radius: 0; outline: none; box-shadow: none;
  font: inherit; font-size: var(--hs-text-sm);
}
.hs-search input::placeholder { color: var(--hs-text-4); }
.hs-search input::-webkit-search-cancel-button { display: none; }
.hs-search-clear { display: grid; place-items: center; width: 20px; height: 20px; min-height: 0; padding: 0; color: var(--hs-text-3); background: none; border: 0; border-radius: 50%; cursor: pointer; }
.hs-search-clear:hover { color: var(--hs-text); background: var(--hs-surface-hover); }
</style>
