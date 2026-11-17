<script setup lang="ts">
import { ref } from 'vue';

defineOptions({ inheritAttrs: false });

withDefaults(defineProps<{ type?: string; invalid?: boolean; multiline?: boolean; rows?: number; suffix?: string; prefix?: string; size?: 'sm' | 'md' }>(), { type: 'text', rows: 3, size: 'md' });
const model = defineModel<string>({ default: '' });
const control = ref<HTMLInputElement | HTMLTextAreaElement | null>(null);
const onInput = (event: Event) => { model.value = (event.target as HTMLInputElement | HTMLTextAreaElement).value; };
defineExpose({ focus: () => control.value?.focus() });
</script>

<template>
  <div class="hs-input" :class="[size, { invalid, multiline }]">
    <span v-if="prefix" class="hs-input-prefix">{{ prefix }}</span>
    <!-- Bound by hand: v-model would turn type="number" values into numbers, and amounts must stay exact strings. -->
    <textarea v-if="multiline" ref="control" :value="model" :rows="rows" v-bind="$attrs" @input="onInput" />
    <input v-else ref="control" :value="model" :type="type" v-bind="$attrs" @input="onInput" />
    <span v-if="suffix" class="hs-input-suffix">{{ suffix }}</span>
  </div>
</template>

<style scoped>
.hs-input {
  display: flex; align-items: center;
  min-width: 0; height: var(--hs-control-height); padding: 0 12px;
  background: var(--hs-surface);
  border: 1px solid var(--hs-border-strong); border-radius: var(--hs-radius-control);
  box-shadow: var(--hs-shadow-control);
  transition: border-color .15s, box-shadow .15s;
}
.hs-input.sm { height: var(--hs-control-height-sm); padding: 0 10px; }
.hs-input.sm input { font-size: var(--hs-text-xs); }
.hs-input.multiline { height: auto; padding: 8px 12px; align-items: stretch; }
.hs-input:hover { border-color: #c4c4c4; }
.hs-input:focus-within { border-color: var(--hs-accent); box-shadow: var(--hs-accent-ring); }
.hs-input.invalid { border-color: #e3a1aa; }
.hs-input.invalid:focus-within { box-shadow: 0 0 0 3px rgb(176 41 58 / 12%); }
.hs-input input, .hs-input textarea {
  flex: 1; width: 100%; min-width: 0; height: 100%; padding: 0;
  color: var(--hs-text); background: none; border: 0; border-radius: 0; outline: none; box-shadow: none;
  font: inherit; font-size: var(--hs-text-sm);
}
.hs-input textarea { min-height: 64px; resize: vertical; line-height: 1.6; }
.hs-input input::placeholder, .hs-input textarea::placeholder { color: var(--hs-text-4); }
.hs-input input:disabled, .hs-input textarea:disabled { color: var(--hs-text-3); cursor: not-allowed; }
.hs-input:has(:disabled) { background: var(--hs-surface-subtle); }
.hs-input-prefix { margin-right: 8px; color: var(--hs-text-3); font-size: var(--hs-text-xs); white-space: nowrap; flex: none; }
.hs-input-suffix { margin-left: 8px; color: var(--hs-text-3); font-size: var(--hs-text-xs); flex: none; }
</style>
