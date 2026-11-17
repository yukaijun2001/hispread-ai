<script setup lang="ts">
// Status badge using this page's state colours (adds COOLING / ACCEPTING / CLOSED to the shared map).
import Badge from '../../../components/ui/Badge.vue';
import { stateLabel } from '../../../lib/labels';
import { badgeTone } from '../resources';

defineProps<{ state: string; label?: string }>();
</script>

<template>
  <Badge :tone="badgeTone(state)" dot>{{ label || stateLabel(state) }}</Badge>
</template>
