<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref, shallowRef } from 'vue';
import { staticParticles, type StaticParticle } from './staticParticles';

const stage = ref<HTMLDivElement | null>(null);
const fallback = shallowRef<StaticParticle[] | null>(null);
let cleanup: (() => void) | undefined;

onMounted(async () => {
  if (!stage.value) return;
  // three.js is loaded only for the login screen.
  const { mountParticles } = await import('./particles');
  if (!stage.value) return;
  cleanup = mountParticles(stage.value, () => { cleanup?.(); fallback.value = staticParticles(); });
});
onBeforeUnmount(() => cleanup?.());

const fill = { base: 'var(--particle-base)', cyan: 'var(--particle-cyan)', purple: 'var(--particle-purple)' };
</script>

<template>
  <div v-if="fallback" class="hs-particles static">
    <svg viewBox="0 0 460 800" preserveAspectRatio="xMidYMid meet" aria-hidden="true">
      <circle v-for="(p, index) in fallback" :key="index" :cx="p.cx" :cy="p.cy" :r="p.r" :fill="fill[p.tone]" :opacity="p.opacity" />
    </svg>
  </div>
  <div v-else ref="stage" class="hs-particles" aria-hidden="true" />
</template>

<style scoped>
.hs-particles { position: absolute; inset: 0; }
.hs-particles :deep(canvas) { display: block; width: 100%; height: 100%; }
.static svg { width: 100%; height: 100%; }
</style>
