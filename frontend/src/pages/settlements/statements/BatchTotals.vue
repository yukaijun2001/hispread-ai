<script setup lang="ts">
// Per-currency amounts side by side; an em dash when there are none.
import MoneyDisplay from '../ledger/MoneyDisplay.vue';
import type { Totals } from './batch';

defineProps<{ totals: Totals }>();
</script>

<template>
  <span class="bt-totals">
    <MoneyDisplay v-for="(amount, currency) in totals" :key="currency" :currency="String(currency)" :value="amount" />
    <span v-if="!Object.keys(totals).length" class="bt-none">—</span>
  </span>
</template>

<style scoped>
.bt-totals { display: inline-flex; flex-wrap: wrap; gap: 4px 14px; font-variant-numeric: tabular-nums; }
.bt-none { color: var(--hs-text-4); }
</style>
