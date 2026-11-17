<script setup lang="ts">
// Unread count polled every 30 s while the tab is visible; opening the panel
// loads the five latest unread items. Opening one marks it read and follows
// its target.
import { onBeforeUnmount, ref, watch } from 'vue';
import Popover from '../components/ui/Popover.vue';
import Icon from '../components/ui/Icon.vue';
import Spinner from '../components/ui/Spinner.vue';
import { apiFetch, apiPost } from '../lib/api';
import { t } from '../lib/i18n';
import { formatDateTime } from '../lib/money';
import { notificationSummary, notificationTitle, type NotificationItem } from '../lib/notifications';
import { openTarget } from '../navigation/navigate';
import { useSessionStore } from '../stores/session';

const session = useSessionStore();
const count = ref(0);
const open = ref(false);
const loading = ref(false);
const items = ref<NotificationItem[]>([]);
let timer: number | undefined;

function poll() {
  if (document.hidden) return;
  apiFetch<{ count: number }>('/notifications/unread-count', { background: true })
    .then((result) => { count.value = result.count; })
    .catch(() => {});
}

watch(() => session.epoch, () => {
  window.clearInterval(timer);
  poll();
  timer = window.setInterval(poll, 30_000);
}, { immediate: true });
onBeforeUnmount(() => window.clearInterval(timer));

watch(open, async (isOpen) => {
  if (!isOpen) return;
  loading.value = true;
  try {
    items.value = (await apiFetch<{ items: NotificationItem[] }>('/notifications?unread=true&size=5', { background: true })).items;
  } catch (error) {
    session.notify((error as Error).message, true);
  } finally {
    loading.value = false;
  }
});

function openItem(item: NotificationItem) {
  open.value = false;
  apiPost(`/notifications/${item.id}/read`, {})
    .catch((error: Error) => session.notify(error.message, true))
    .finally(() => { session.refresh(); openTarget(item.targetPath); });
}

function showAll() {
  open.value = false;
  openTarget('notifications');
}
</script>

<template>
  <Popover v-model:open="open" width="340px">
    <template #trigger="{ toggle }">
      <button
        type="button"
        class="bell"
        :aria-label="count ? t('消息通知，{0} 条未读', [count]) : t('消息通知，没有未读')"
        :aria-expanded="open"
        @click="toggle"
      >
        <Icon name="bell" :size="18" />
        <b v-if="count > 0">{{ count > 99 ? '99+' : count }}</b>
      </button>
    </template>
    <div class="head">
      <strong>{{ t('未读消息') }}</strong>
      <button type="button" class="link" @click="showAll">{{ t('全部消息') }}</button>
    </div>
    <div v-if="loading && !items.length" class="state"><Spinner :size="14" /></div>
    <p v-else-if="!items.length" class="state">{{ t('暂无未读消息') }}</p>
    <button v-for="item in items" v-else :key="item.id" type="button" class="item" @click="openItem(item)">
      <strong>{{ notificationTitle(item) }}</strong>
      <span>{{ notificationSummary(item) }}</span>
      <small>{{ formatDateTime(item.createdAt) }}</small>
    </button>
  </Popover>
</template>

<style scoped>
.bell { position: relative; display: grid; place-items: center; width: 34px; height: 34px; min-height: 0; padding: 0; color: var(--hs-text-2); background: var(--hs-surface); border: 1px solid var(--hs-border); border-radius: 999px; cursor: pointer; }
.bell:hover { color: var(--hs-text); border-color: var(--hs-border-strong); }
.bell:focus-visible { outline: none; box-shadow: var(--hs-accent-ring); }
.bell b { position: absolute; top: -4px; right: -6px; min-width: 18px; height: 18px; padding: 0 5px; color: #fff; background: #e5484d; border: 2px solid var(--hs-bg); border-radius: 999px; font-size: 10px; font-weight: 600; line-height: 14px; text-align: center; }
.head { display: flex; align-items: center; justify-content: space-between; padding: 8px 10px 10px; border-bottom: 1px solid var(--hs-divider); margin-bottom: 4px; }
.head strong { font-size: var(--hs-text-sm); font-weight: 600; }
.link { min-height: 0; padding: 0; color: var(--hs-accent); background: none; border: 0; font: inherit; font-size: var(--hs-text-xs); cursor: pointer; }
.link:hover { text-decoration: underline; text-underline-offset: 3px; }
.state { display: flex; justify-content: center; margin: 0; padding: 22px 10px; color: var(--hs-text-3); font-size: var(--hs-text-xs); }
.item { display: grid; gap: 3px; width: 100%; min-height: 0; padding: 9px 10px; text-align: left; color: var(--hs-text); background: none; border: 0; border-radius: 10px; font: inherit; cursor: pointer; }
.item:hover, .item:focus-visible { outline: none; background: var(--hs-surface-hover); }
.item strong { font-size: var(--hs-text-sm); font-weight: 500; }
.item span { color: var(--hs-text-2); font-size: var(--hs-text-xs); line-height: 1.5; overflow: hidden; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; }
.item small { color: var(--hs-text-4); font-size: 11px; font-variant-numeric: tabular-nums; }
</style>
