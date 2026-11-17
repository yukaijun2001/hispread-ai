<script setup lang="ts">
// Anchored panel that closes on an outside pointer, Escape, or `close()`.
import { onBeforeUnmount, ref, watch } from 'vue';

withDefaults(defineProps<{ align?: 'start' | 'end'; width?: string }>(), { align: 'end', width: '280px' });
const open = defineModel<boolean>('open', { default: false });
const root = ref<HTMLElement | null>(null);

const onPointer = (event: PointerEvent) => { if (!root.value?.contains(event.target as Node)) open.value = false; };
const onKey = (event: KeyboardEvent) => {
  if (event.key !== 'Escape') return;
  open.value = false;
  (root.value?.querySelector('[aria-expanded]') as HTMLElement | null)?.focus();
};
watch(open, (value) => {
  const method = value ? 'addEventListener' : 'removeEventListener';
  document[method]('pointerdown', onPointer as EventListener, true);
  document[method]('keydown', onKey as EventListener);
});
onBeforeUnmount(() => { open.value = false; });
</script>

<template>
  <div ref="root" class="hs-popover">
    <slot name="trigger" :open="open" :toggle="() => (open = !open)" />
    <Transition name="hs-pop">
      <div v-if="open" class="hs-popover-panel" :class="align" :style="{ width }">
        <slot :close="() => (open = false)" />
      </div>
    </Transition>
  </div>
</template>

<style scoped>
.hs-popover { position: relative; }
.hs-popover-panel {
  position: absolute; top: calc(100% + 8px); z-index: 60;
  max-width: calc(100vw - 24px);
  padding: 6px;
  background: var(--hs-surface);
  border: 1px solid var(--hs-border);
  border-radius: 14px;
  box-shadow: var(--hs-shadow-pop);
}
.hs-popover-panel.end { right: 0; }
.hs-popover-panel.start { left: 0; }
.hs-pop-enter-active, .hs-pop-leave-active { transition: opacity .12s, transform .12s; }
.hs-pop-enter-from, .hs-pop-leave-to { opacity: 0; transform: translateY(-4px); }
</style>
