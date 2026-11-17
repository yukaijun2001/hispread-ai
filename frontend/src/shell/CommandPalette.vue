<script setup lang="ts">
// Jump to any page the account can open. ⌘K / Ctrl+K anywhere, or "/" when
// not typing in a field.
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import { useRouter } from 'vue-router';
import Icon from '../components/ui/Icon.vue';
import type { IconName } from '../components/ui/icons';
import { t } from '../lib/i18n';
import { navigationFor } from '../navigation/access';
import { useSessionStore } from '../stores/session';

interface Command { id: string; label: string; group: string; icon: IconName; run: () => void }

const open = defineModel<boolean>('open', { default: false });
const session = useSessionStore();
const router = useRouter();
const dialog = ref<HTMLDialogElement | null>(null);
const input = ref<HTMLInputElement | null>(null);
const query = ref('');
const active = ref(0);

const commands = computed<Command[]>(() => {
  if (!session.user) return [];
  const pages = navigationFor(session.user, session.capabilities).flatMap((section) => section.items.map((item) => ({
    id: item.key,
    label: item.label,
    group: section.label || t('概览'),
    icon: item.icon,
    run: () => router.push({ path: `/${item.route}`, query: item.query }),
  })));
  return [
    ...pages,
    { id: 'notifications', label: t('消息通知'), group: t('我的账号'), icon: 'bell', run: () => router.push('/notifications') },
    { id: 'profile', label: t('个人信息'), group: t('我的账号'), icon: 'users', run: () => { session.profileDialogOpen = true; } },
    { id: 'password', label: t('修改密码'), group: t('我的账号'), icon: 'lock', run: () => { session.passwordDialogOpen = true; } },
  ];
});

const results = computed(() => {
  const term = query.value.trim().toLowerCase();
  return term ? commands.value.filter((c) => `${c.label} ${c.group} ${c.id}`.toLowerCase().includes(term)) : commands.value;
});

watch(results, () => { active.value = 0; });
watch(open, async (isOpen) => {
  if (isOpen) {
    query.value = '';
    await nextTick();
    dialog.value?.showModal();
    input.value?.focus();
  } else {
    dialog.value?.close();
  }
});

function execute(command: Command | undefined) {
  if (!command) return;
  open.value = false;
  command.run();
}

function onKeydown(event: KeyboardEvent) {
  if (event.key === 'ArrowDown') { event.preventDefault(); active.value = (active.value + 1) % Math.max(1, results.value.length); }
  else if (event.key === 'ArrowUp') { event.preventDefault(); active.value = (active.value - 1 + results.value.length) % Math.max(1, results.value.length); }
  else if (event.key === 'Enter') { event.preventDefault(); execute(results.value[active.value]); }
  else return;
  nextTick(() => dialog.value?.querySelector('.active')?.scrollIntoView({ block: 'nearest' }));
}

const isTyping = (target: EventTarget | null) => target instanceof HTMLElement
  && (target.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName));

function onGlobalKey(event: KeyboardEvent) {
  if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
    event.preventDefault();
    open.value = !open.value;
  } else if (event.key === '/' && !open.value && !isTyping(event.target) && !document.querySelector('dialog[open]')) {
    event.preventDefault();
    open.value = true;
  }
}
onMounted(() => window.addEventListener('keydown', onGlobalKey));
onBeforeUnmount(() => window.removeEventListener('keydown', onGlobalKey));
</script>

<template>
  <dialog ref="dialog" class="palette" :aria-label="t('搜索页面')" @cancel.prevent="open = false" @click.self="open = false" @close="open = false">
    <div class="hs-palette-search">
      <Icon name="search" :size="18" />
      <input ref="input" v-model="query" type="search" :placeholder="t('搜索页面或操作…')" :aria-label="t('搜索页面或操作')" @keydown="onKeydown" />
      <kbd>Esc</kbd>
    </div>
    <ul class="results" role="listbox" :aria-label="t('搜索结果')">
      <li
        v-for="(command, index) in results"
        :key="command.id"
        role="option"
        :aria-selected="index === active"
        :class="{ active: index === active }"
        @mouseenter="active = index"
        @click="execute(command)"
      >
        <Icon :name="command.icon" :size="16" />
        <span class="label">{{ command.label }}</span>
        <span class="group">{{ command.group }}</span>
      </li>
      <li v-if="!results.length" class="hs-palette-empty">{{ t('没有匹配的页面') }}</li>
    </ul>
  </dialog>
</template>

<style scoped>
.palette { width: min(560px, 100vw - 32px); max-height: min(480px, 100dvh - 120px); margin: 12vh auto auto; padding: 0; overflow: hidden; color: var(--hs-text); background: var(--hs-surface); border: 1px solid var(--hs-border); border-radius: 16px; box-shadow: var(--hs-shadow-pop); font-family: var(--hs-font); }
.palette[open] { display: flex; flex-direction: column; }
.palette::backdrop { background: rgb(23 23 23 / 24%); backdrop-filter: blur(2px); }
.hs-palette-search { display: flex; align-items: center; gap: 10px; padding: 0 16px; height: 52px; color: var(--hs-text-3); border-bottom: 1px solid var(--hs-divider); flex: none; }
.hs-palette-search input { flex: 1; height: 100%; padding: 0; color: var(--hs-text); background: none; border: 0; border-radius: 0; outline: none; box-shadow: none; font: inherit; font-size: 15px; }
.hs-palette-search input::-webkit-search-cancel-button { display: none; }
kbd { padding: 2px 6px; color: var(--hs-text-3); background: var(--hs-surface-subtle); border: 1px solid var(--hs-border); border-radius: 6px; font-family: var(--hs-font); font-size: 11px; }
.results { margin: 0; padding: 6px; list-style: none; overflow-y: auto; }
.results li { display: flex; align-items: center; gap: 10px; padding: 9px 10px; color: var(--hs-text-2); border-radius: 10px; font-size: var(--hs-text-sm); cursor: pointer; }
.results li.active { color: var(--hs-text); background: var(--hs-surface-hover); }
.label { flex: 1; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.group { color: var(--hs-text-4); font-size: var(--hs-text-xs); }
.results li.hs-palette-empty { justify-content: center; padding: 24px; color: var(--hs-text-3); cursor: default; }
</style>
