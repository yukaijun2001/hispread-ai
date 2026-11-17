<script setup lang="ts">
import { computed } from 'vue';

const props = withDefaults(defineProps<{ name: string; size?: number; tone?: number; square?: boolean }>(), { size: 28 });
const initial = computed(() => (/^[a-z]/i.test(props.name) ? props.name[0].toUpperCase() : props.name.slice(0, 1)) || '?');
// Five soft tints, chosen by index so the same entity keeps its colour across lists.
const tints = [['#eef3fe', '#2f5bd3'], ['#ebf6f3', '#2f8a76'], ['#fcf4e4', '#8f5a0c'], ['#f3effc', '#6a4bb0'], ['#f1f1f1', '#4d4d4d']];
const tint = computed(() => (props.tone === undefined ? tints[4] : tints[Math.abs(props.tone) % tints.length]));
</script>

<template>
  <span
    class="hs-avatar"
    :class="{ square }"
    :style="{ width: `${size}px`, height: `${size}px`, fontSize: `${Math.round(size * 0.42)}px`, background: tint[0], color: tint[1] }"
    aria-hidden="true"
  >{{ initial }}</span>
</template>

<style scoped>
.hs-avatar { display: inline-grid; place-items: center; flex: none; border-radius: 50%; font-weight: 600; line-height: 1; box-shadow: inset 0 0 0 1px rgb(0 0 0 / 4%); }
.hs-avatar.square { border-radius: 9px; }
</style>
