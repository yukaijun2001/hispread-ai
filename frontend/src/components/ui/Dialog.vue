<script setup lang="ts">
// Native modal dialog. Mount it to open, unmount to close. Escape and the close
// button emit `close`; drawers also close on a backdrop click. With
// `closable=false` (e.g. a forced password change) there is no way out but the body's own actions.
import { onBeforeUnmount, onMounted, ref, useId } from 'vue';
import IconButton from './IconButton.vue';
import { t } from '../../lib/i18n';

const props = withDefaults(defineProps<{ title: string; subtitle?: string; size?: 'sm' | 'md' | 'lg' | 'xl'; drawer?: boolean; closable?: boolean }>(), { size: 'md', closable: true });
const emit = defineEmits<{ close: [] }>();

const dialog = ref<HTMLDialogElement | null>(null);
const titleId = useId();
let previousFocus: Element | null = null;

const syncViewport = () => {
  const viewport = window.visualViewport;
  dialog.value?.style.setProperty('--dialog-viewport-height', `${Math.min(window.innerHeight, viewport?.height ?? window.innerHeight)}px`);
};

onMounted(() => {
  previousFocus = document.activeElement;
  syncViewport();
  window.addEventListener('resize', syncViewport);
  window.visualViewport?.addEventListener('resize', syncViewport);
  dialog.value?.showModal();
});

onBeforeUnmount(() => {
  window.removeEventListener('resize', syncViewport);
  window.visualViewport?.removeEventListener('resize', syncViewport);
  dialog.value?.close();
  if (previousFocus instanceof HTMLElement && previousFocus.isConnected) previousFocus.focus({ preventScroll: true });
});

function onPointerDown(event: PointerEvent, drawer: boolean) {
  if (!drawer || !props.closable || event.target !== event.currentTarget) return;
  const box = (event.currentTarget as HTMLElement).getBoundingClientRect();
  if (event.clientX < box.left || event.clientX > box.right || event.clientY < box.top || event.clientY > box.bottom) emit('close');
}
</script>

<template>
  <dialog
    ref="dialog"
    class="hs-dialog"
    :class="[size, { 'is-drawer': drawer }]"
    :aria-labelledby="titleId"
    @cancel.prevent="closable && emit('close')"
    @pointerdown="onPointerDown($event, !!drawer)"
  >
    <header class="hs-dialog-head">
      <div class="hs-dialog-heading">
        <h2 :id="titleId">{{ title }}</h2>
        <p v-if="subtitle">{{ subtitle }}</p>
      </div>
      <IconButton v-if="closable" icon="close" :label="t('关闭')" @click="emit('close')" />
    </header>
    <div class="hs-dialog-body"><slot /></div>
    <footer v-if="$slots.footer" class="hs-dialog-foot"><slot name="footer" /></footer>
  </dialog>
</template>

<style scoped>
.hs-dialog {
  width: min(560px, 100vw - 32px);
  max-width: none;
  max-height: calc(var(--dialog-viewport-height, 100dvh) - 64px);
  margin: auto;
  padding: 0;
  overflow: hidden;
  color: var(--hs-text);
  background: var(--hs-surface);
  border: 1px solid var(--hs-border);
  border-radius: var(--hs-radius-card);
  box-shadow: var(--hs-shadow-pop);
  font-family: var(--hs-font);
}
.hs-dialog[open] { display: flex; flex-direction: column; }
.hs-dialog::backdrop { background: rgb(23 23 23 / 28%); backdrop-filter: blur(2px); }
.sm { width: min(420px, 100vw - 32px); }
.lg { width: min(800px, 100vw - 32px); }
.xl { width: min(1180px, 100vw - 32px); }
.is-drawer {
  width: min(720px, 100vw - 24px);
  height: calc(var(--dialog-viewport-height, 100dvh) - 24px);
  max-height: none;
  margin: 12px 12px 12px auto;
}
.is-drawer.lg { width: min(960px, 100vw - 24px); }
.is-drawer.xl { width: min(1240px, 95vw); }
.hs-dialog-head { display: flex; align-items: flex-start; justify-content: space-between; gap: 16px; padding: 20px 22px 16px; border-bottom: 1px solid var(--hs-divider); flex: none; }
.hs-dialog-heading { min-width: 0; }
.hs-dialog-heading h2 { margin: 0; font-size: 17px; font-weight: 600; letter-spacing: -.2px; line-height: 1.4; }
.hs-dialog-heading p { margin: 4px 0 0; color: var(--hs-text-3); font-size: var(--hs-text-xs); line-height: 1.6; }
.hs-dialog-body { flex: 1; min-height: 0; overflow: auto; padding: 20px 22px; }
.hs-dialog-foot { display: flex; flex-wrap: wrap; align-items: center; justify-content: flex-end; gap: 8px; padding: 14px 22px; border-top: 1px solid var(--hs-divider); flex: none; }
</style>
