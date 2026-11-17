<script setup lang="ts">
import { computed, onBeforeUnmount, ref, watch, watchEffect } from 'vue';
import { RouterView, useRoute } from 'vue-router';
import SidebarNav from './SidebarNav.vue';
import NotificationBell from './NotificationBell.vue';
import ProfileMenu from './ProfileMenu.vue';
import CommandPalette from './CommandPalette.vue';
import ForbiddenView from './ForbiddenView.vue';
import Icon from '../components/ui/Icon.vue';
import IconButton from '../components/ui/IconButton.vue';
import PasswordDialog from './account/PasswordDialog.vue';
import ProfileDialog from './account/ProfileDialog.vue';
import { t } from '../lib/i18n';
import { watchForNewRelease } from '../lib/version';
import { isRouteAllowed, isRouteId, navigationFor, resolveSettlementTab, routeLabel } from '../navigation/access';
import { useSessionStore } from '../stores/session';

const session = useSessionStore();
const route = useRoute();
const paletteOpen = ref(false);
const drawerOpen = ref(false);
const drawer = ref<HTMLDialogElement | null>(null);

const user = computed(() => session.user!);
const routeName = computed(() => String(route.name ?? ''));
const tab = computed(() => String(route.query.tab ?? ''));
const allowed = computed(() => isRouteAllowed(user.value, routeName.value, tab.value));

const trail = computed(() => {
  const name = routeName.value;
  if (!isRouteId(name)) return { section: '', page: '' };
  const sections = navigationFor(user.value, session.capabilities);
  const tabId = name === 'settlements' ? resolveSettlementTab(user.value, tab.value)?.id : undefined;
  for (const section of sections) {
    const item = section.items.find((entry) => entry.route === name && (!tabId || entry.query?.tab === tabId));
    if (item) return { section: section.label, page: item.label };
  }
  return { section: '', page: routeLabel(user.value, name) };
});

watchEffect(() => {
  document.title = trail.value.page ? `${trail.value.page} · Hispread AI` : 'Hispread AI';
});

watch(drawerOpen, (open) => (open ? drawer.value?.showModal() : drawer.value?.close()));
watch(() => route.fullPath, () => { drawerOpen.value = false; });

// Supplier members on the billing pages get new releases promptly, as before.
let stopReleaseWatch: (() => void) | undefined;
watch(() => user.value.role === 'SUPPLIER_AGENT' && !!user.value.supplierId && routeName.value === 'settlements', (watching) => {
  stopReleaseWatch?.();
  stopReleaseWatch = watching ? watchForNewRelease() : undefined;
}, { immediate: true });
onBeforeUnmount(() => stopReleaseWatch?.());

function closePassword() { session.passwordDialogOpen = false; }
function passwordChanged() { session.clear(); }
function profileSaved(profile: { displayName?: string }) {
  session.patchUser({ displayName: profile.displayName });
  session.refresh();
  session.profileDialogOpen = false;
  session.notify(t('个人信息已更新'));
}
const isMac = /Mac|iPhone|iPad/.test(navigator.platform);
</script>

<template>
  <div class="shell">
    <aside class="rail"><SidebarNav /></aside>

    <dialog ref="drawer" class="hs-drawer" :aria-label="t('业务导航')" @cancel.prevent="drawerOpen = false" @click.self="drawerOpen = false">
      <IconButton class="hs-drawer-close" icon="close" :label="t('关闭导航')" @click="drawerOpen = false" />
      <SidebarNav @navigate="drawerOpen = false" />
    </dialog>

    <div class="main">
      <header class="hs-topbar">
        <IconButton class="menu" icon="menu" :label="t('打开导航')" @click="drawerOpen = true" />
        <nav class="trail" :aria-label="t('当前位置')">
          <template v-if="trail.section">
            <span class="trail-section">{{ trail.section }}</span>
            <Icon name="chevron" :size="14" class="trail-sep" />
          </template>
          <span class="trail-page" aria-current="page">{{ trail.page }}</span>
        </nav>
        <div class="actions">
          <button type="button" class="hs-search-trigger" @click="paletteOpen = true">
            <Icon name="search" :size="16" />
            <span>{{ t('搜索页面') }}</span>
            <kbd>{{ isMac ? '⌘K' : 'Ctrl K' }}</kbd>
          </button>
          <NotificationBell v-if="!user.mustChangePassword" />
          <ProfileMenu />
        </div>
      </header>

      <main class="hs-panel">
        <template v-if="!user.mustChangePassword">
          <RouterView v-if="allowed" v-slot="{ Component, route: current }">
            <component :is="Component" :key="current.path" />
          </RouterView>
          <ForbiddenView v-else />
        </template>
      </main>
    </div>

    <CommandPalette v-model:open="paletteOpen" />

    <PasswordDialog
      v-if="session.passwordDialogOpen || user.mustChangePassword"
      :forced="!!user.mustChangePassword"
      @close="closePassword"
      @changed="passwordChanged"
    />
    <ProfileDialog v-if="session.profileDialogOpen" @close="session.profileDialogOpen = false" @saved="profileSaved" />
  </div>
</template>

<style scoped>
.shell { display: grid; grid-template-columns: var(--hs-sidebar-width) minmax(0, 1fr); min-height: 100vh; background: var(--hs-bg); color: var(--hs-text); font-family: var(--hs-font); font-size: var(--hs-text-md); }
.rail { position: sticky; top: 0; height: 100vh; }
.main { display: flex; flex-direction: column; min-width: 0; padding: 0 12px 12px 0; }
.hs-topbar { display: flex; align-items: center; gap: 12px; height: 60px; padding: 0 8px 0 12px; flex: none; }
.menu { display: none; }
.trail { display: flex; align-items: center; gap: 8px; min-width: 0; font-size: var(--hs-text-md); }
.trail-section { color: var(--hs-text-3); white-space: nowrap; }
.trail-sep { color: var(--hs-text-4); }
.trail-page { overflow: hidden; color: var(--hs-text); font-weight: 500; text-overflow: ellipsis; white-space: nowrap; }
.actions { display: flex; align-items: center; gap: 8px; margin-left: auto; }
.hs-search-trigger { display: flex; align-items: center; gap: 8px; width: 240px; height: 34px; min-height: 0; padding: 0 6px 0 12px; color: var(--hs-text-3); background: var(--hs-surface); border: 1px solid var(--hs-border); border-radius: 999px; font: inherit; font-size: var(--hs-text-sm); cursor: pointer; }
.hs-search-trigger:hover { border-color: var(--hs-border-strong); }
.hs-search-trigger:focus-visible { outline: none; box-shadow: var(--hs-accent-ring); }
.hs-search-trigger span { flex: 1; text-align: left; }
.hs-search-trigger kbd { padding: 1px 6px; color: var(--hs-text-3); background: var(--hs-surface-subtle); border: 1px solid var(--hs-border); border-radius: 6px; font-family: var(--hs-font); font-size: 11px; }
.hs-panel { flex: 1; min-width: 0; padding: var(--hs-page-gutter); background: var(--hs-surface); border: 1px solid var(--hs-border); border-radius: 18px; box-shadow: 0 1px 2px rgb(0 0 0 / 3%); }

.hs-drawer { width: min(300px, 86vw); height: 100dvh; max-height: none; margin: 0 auto 0 0; padding: 0; background: var(--hs-bg); border: 0; border-radius: 0 16px 16px 0; box-shadow: var(--hs-shadow-pop); font-family: var(--hs-font); }
.hs-drawer::backdrop { background: rgb(23 23 23 / 28%); }
.hs-drawer-close { position: absolute; top: 20px; right: 12px; z-index: 1; }

@media (max-width: 1100px) { .hs-search-trigger { width: auto; } .hs-search-trigger span, .hs-search-trigger kbd { display: none; } }
@media (max-width: 767px) {
  .shell { grid-template-columns: minmax(0, 1fr); }
  .rail { display: none; }
  .menu { display: inline-grid; }
  .main { padding: 0 8px 8px; }
  .hs-topbar { padding: 0 4px; }
  .trail-section, .trail-sep { display: none; }
  .hs-panel { border-radius: 14px; padding: 16px 14px; }
}
@media (min-width: 768px) { .hs-drawer { display: none; } }
</style>
