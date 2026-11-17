<script setup lang="ts">
// Confirmation anchored under (or above) the 移除 button. An outside click,
// focus elsewhere or Escape cancels unless the removal is being submitted;
// focus returns to the button unless the user clicked away.
import { nextTick, onBeforeUnmount, onMounted, ref, useId, watch } from 'vue';
import Button from '../../../components/ui/Button.vue';
import { t } from '../../../lib/i18n';

const props = defineProps<{ anchor: HTMLElement; subject: string; busy: boolean }>();
const emit = defineEmits<{ cancel: []; confirm: [] }>();

const panel = ref<HTMLElement | null>(null);
const position = ref<{ left: number; top: number; width: number } | null>(null);
const titleId = useId();
const bodyId = useId();
let restoreFocus = true;

function place() {
  if (!props.anchor.isConnected) { emit('cancel'); return; }
  const box = props.anchor.getBoundingClientRect();
  const width = Math.min(304, window.innerWidth - 24);
  const height = Math.min(panel.value?.getBoundingClientRect().height || 150, window.innerHeight - 24);
  const below = box.bottom + 8;
  position.value = {
    width,
    left: Math.max(12, Math.min(box.right - width, window.innerWidth - width - 12)),
    top: Math.max(12, Math.min(below + height <= window.innerHeight - 12 ? below : box.top - height - 8, window.innerHeight - height - 12)),
  };
}

const onOutside = (event: Event) => {
  const target = event.target as Node;
  if (!props.busy && !props.anchor.contains(target) && !panel.value?.contains(target)) { restoreFocus = false; emit('cancel'); }
};
const onKey = (event: KeyboardEvent) => {
  if (event.key === 'Escape' && !props.busy) { event.preventDefault(); event.stopPropagation(); emit('cancel'); }
};

let observer: ResizeObserver | undefined;
onMounted(() => {
  place();
  observer = new ResizeObserver(place);
  observer.observe(props.anchor);
  if (panel.value) observer.observe(panel.value);
  window.addEventListener('resize', place);
  window.addEventListener('scroll', place, true);
  document.addEventListener('pointerdown', onOutside);
  document.addEventListener('focusin', onOutside);
  document.addEventListener('keydown', onKey);
});
watch(() => [props.anchor, props.busy], () => {
  if (!props.busy) nextTick(() => panel.value?.querySelector('button')?.focus({ preventScroll: true }));
}, { immediate: true });
onBeforeUnmount(() => {
  observer?.disconnect();
  window.removeEventListener('resize', place);
  window.removeEventListener('scroll', place, true);
  document.removeEventListener('pointerdown', onOutside);
  document.removeEventListener('focusin', onOutside);
  document.removeEventListener('keydown', onKey);
  if (restoreFocus && props.anchor.isConnected) props.anchor.focus({ preventScroll: true });
});
</script>

<template>
  <Teleport to="body">
    <div
      ref="panel"
      class="rs-remove-confirm"
      role="dialog"
      aria-modal="false"
      :aria-labelledby="titleId"
      :aria-describedby="bodyId"
      :aria-busy="busy"
      :style="position ? { left: `${position.left}px`, top: `${position.top}px`, width: `${position.width}px` } : { left: 0, top: 0, width: '304px', visibility: 'hidden' }"
    >
      <strong :id="titleId">{{ subject }}</strong>
      <p :id="bodyId">{{ t('移除后无法恢复') }}</p>
      <div class="rs-remove-confirm-actions">
        <Button size="sm" :disabled="busy" @click="emit('cancel')">{{ t('取消') }}</Button>
        <Button size="sm" variant="danger" :disabled="busy" @click="emit('confirm')">{{ busy ? t('正在提交…') : t('移除') }}</Button>
      </div>
    </div>
  </Teleport>
</template>

<style scoped>
.rs-remove-confirm {
  position: fixed; z-index: 60; display: grid; gap: 6px; padding: 14px 16px;
  background: var(--hs-surface); border: 1px solid var(--hs-border); border-radius: 12px; box-shadow: var(--hs-shadow-pop);
}
.rs-remove-confirm strong { color: var(--hs-text); font-size: var(--hs-text-sm); overflow-wrap: anywhere; }
.rs-remove-confirm p { margin: 0; color: var(--hs-text-3); font-size: var(--hs-text-xs); }
.rs-remove-confirm-actions { display: flex; justify-content: flex-end; gap: 8px; margin-top: 6px; }
</style>
