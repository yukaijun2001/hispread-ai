<script setup lang="ts">
import { formatMoney } from '../../lib/money';

defineProps<{ value: string | null | undefined; currency: string }>();
</script>

<template>
  <span class="rp-money">{{ currency }} {{ formatMoney(value, currency) }}</span>
</template>

<style scoped>
.rp-money { font-variant-numeric: tabular-nums; white-space: nowrap; }
</style>
