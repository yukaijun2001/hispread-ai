<script setup lang="ts">
// Label, control, hint and error for one form field. The control goes in the
// default slot and receives `id` through the slot props for label association.
import { useId } from 'vue';
import { t } from '../../lib/i18n';

defineProps<{ label: string; hint?: string; error?: string; required?: boolean; optional?: boolean }>();
const id = useId();
</script>

<template>
  <div class="hs-field" :class="{ invalid: !!error }">
    <label class="hs-field-label" :for="id">
      {{ label }}<span v-if="optional" class="hs-field-optional">{{ t('（选填）') }}</span>
    </label>
    <slot :id="id" />
    <p v-if="error" class="hs-field-error" role="alert">{{ error }}</p>
    <p v-else-if="hint" class="hs-field-hint">{{ hint }}</p>
  </div>
</template>

<style scoped>
.hs-field { display: flex; flex-direction: column; gap: 6px; min-width: 0; }
.hs-field-label { color: var(--hs-text-2); font-size: var(--hs-text-xs); font-weight: 500; }
.hs-field-optional { margin-left: 2px; color: var(--hs-text-4); font-weight: 400; }
.hs-field-hint, .hs-field-error { margin: 0; font-size: var(--hs-text-xs); line-height: 1.6; }
.hs-field-hint { color: var(--hs-text-3); }
.hs-field-error { color: var(--hs-danger); }
</style>
