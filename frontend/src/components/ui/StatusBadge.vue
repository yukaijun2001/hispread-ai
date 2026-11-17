<script setup lang="ts">
import Badge from './Badge.vue';
import { stateLabel, stateTone } from '../../lib/labels';

defineProps<{ state: string; label?: string }>();
</script>

<template>
  <Badge :tone="stateTone(state)" dot>{{ label || stateLabel(state) }}</Badge>
</template>
