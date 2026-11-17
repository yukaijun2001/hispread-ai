<script setup lang="ts">
// Labelled, copyable code sample.
import Button from '../../components/ui/Button.vue';
import { t } from '../../lib/i18n';
import { useSessionStore } from '../../stores/session';

const props = defineProps<{ label: string; code: string }>();
const session = useSessionStore();

async function copy() {
  try {
    await navigator.clipboard.writeText(props.code);
    session.notify(t('已复制'));
  } catch {
    session.notify(t('复制失败，请手动选择复制'), true);
  }
}
</script>

<template>
  <div class="code-block">
    <div class="code-head">
      <span>{{ label }}</span>
      <Button variant="ghost" size="sm" icon="copy" @click="copy">{{ t('复制') }}</Button>
    </div>
    <pre tabindex="0" :aria-label="label"><code>{{ code }}</code></pre>
  </div>
</template>

<style scoped>
.code-block { min-width: 0; overflow: hidden; background: var(--hs-surface-subtle); border: 1px solid var(--hs-border); border-radius: var(--hs-radius-control); }
.code-head { display: flex; align-items: center; justify-content: space-between; gap: 8px; padding: 4px 6px 4px 14px; color: var(--hs-text-3); border-bottom: 1px solid var(--hs-border); font-size: var(--hs-text-xs); }
pre { margin: 0; padding: 12px 14px; overflow-x: auto; color: var(--hs-text); background: none; border: 0; font-family: var(--hs-font-mono); font-size: 12.5px; line-height: 1.65; white-space: pre; }
pre:focus-visible { outline: none; box-shadow: inset var(--hs-accent-ring); }
code { font: inherit; background: none; padding: 0; }
</style>
