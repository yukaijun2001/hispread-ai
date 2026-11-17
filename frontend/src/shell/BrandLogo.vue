<script setup lang="ts">
// The wordmark is a raster; the SVG viewBox crops it to the full or mark-only form.
withDefaults(defineProps<{ compact?: boolean; height?: number }>(), { height: 32 });
const LOGO = '/assets/hispread-ai-Bi7go8ib.png';
</script>

<template>
  <svg
    class="hs-brand-logo"
    :height="height"
    :width="compact ? height * 0.92 : height * 2.99"
    :viewBox="compact ? '10 54 180 196' : '10 54 585 196'"
    preserveAspectRatio="xMidYMid meet"
    role="img"
    aria-label="Hispread AI"
    focusable="false"
  >
    <image :href="LOGO" width="600" height="300" />
  </svg>
</template>

<style scoped>
.hs-brand-logo { display: block; flex: none; }
</style>
