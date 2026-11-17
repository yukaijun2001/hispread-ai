<script setup lang="ts">
// Delivery badge; an unknown result whose automatic handling has ended asks for help.
import { t } from '../../../lib/i18n';
import type { CreationProgress } from '../resources';
import StateBadge from './StateBadge.vue';

defineProps<{ state: string; label: string; progress: CreationProgress }>();
</script>

<template>
  <span class="rs-delivery-badge">
    <StateBadge :state="state" :label="label" />
    <small v-if="state === 'UNKNOWN' && progress.creationFinished">{{ t('交付暂未完成，请协助处理') }}</small>
  </span>
</template>

<style scoped>
.rs-delivery-badge { display: inline-grid; justify-items: start; gap: 2px; }
.rs-delivery-badge small { color: var(--hs-text-3); font-size: var(--hs-text-xs); }
</style>
