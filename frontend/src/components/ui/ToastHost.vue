<script setup lang="ts">
// The single toast. Rendered as a manual popover inside the top-most open
// modal dialog (or the body) so it stays visible above modal content.
import { nextTick, onBeforeUnmount, ref, watch } from 'vue';
import Icon from './Icon.vue';
import { useSessionStore } from '../../stores/session';
import { t } from '../../lib/i18n';

const session = useSessionStore();
const host = ref<HTMLElement | string>('body');
const element = ref<HTMLElement | null>(null);

const topDialog = () => [...document.querySelectorAll<HTMLDialogElement>('dialog[open]')].at(-1) ?? null;

function show() {
  host.value = topDialog() ?? 'body';
  nextTick(() => {
    const node = element.value as (HTMLElement & { showPopover?: () => void }) | null;
    try { node?.showPopover?.(); } catch { /* already open */ }
  });
}

const observer = new MutationObserver(() => {
  if (!session.toast) return;
  const next = topDialog() ?? 'body';
  if (next !== host.value) show();
});
observer.observe(document.body, { subtree: true, attributes: true, attributeFilter: ['open'], childList: true });
onBeforeUnmount(() => observer.disconnect());

watch(() => session.toast?.id, (id) => { if (id) show(); });
</script>

<template>
  <Teleport v-if="session.toast" :to="host">
    <div
      :key="session.toast.id"
      ref="element"
      class="hs-toast"
      :class="{ error: session.toast.error }"
      popover="manual"
      :role="session.toast.error ? 'alert' : 'status'"
      aria-live="polite"
    >
      <Icon :name="session.toast.error ? 'alert' : 'check'" :size="17" />
      <span>{{ session.toast.message }}</span>
      <button type="button" :aria-label="t('关闭提示')" @click="session.dismissToast()"><Icon name="close" :size="14" /></button>
    </div>
  </Teleport>
</template>

<style scoped>
.hs-toast {
  position: fixed; inset: auto auto 24px 50%; transform: translateX(-50%);
  display: flex; align-items: center; gap: 10px;
  max-width: min(560px, 92vw); margin: 0; padding: 12px 14px 12px 16px;
  color: #fff; background: #1c1c1c;
  border: 0; border-radius: 12px;
  box-shadow: 0 12px 32px rgb(0 0 0 / 22%);
  font-family: var(--hs-font); font-size: var(--hs-text-sm); line-height: 1.5;
}
.hs-toast > .hs-icon:first-child { color: #6fd3a1; }
.hs-toast.error > .hs-icon:first-child { color: #ff9aa6; }
.hs-toast span { overflow-wrap: anywhere; }
.hs-toast button { display: grid; place-items: center; width: 24px; height: 24px; min-height: 0; padding: 0; margin-left: 4px; color: rgb(255 255 255 / 60%); background: none; border: 0; border-radius: 6px; cursor: pointer; flex: none; }
.hs-toast button:hover { color: #fff; background: rgb(255 255 255 / 10%); }
</style>
