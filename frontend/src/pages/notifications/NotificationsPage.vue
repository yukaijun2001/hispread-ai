<script setup lang="ts">
// Inbox with all/unread views. Opening a message marks it read and shows it in
// a dialog; the related record opens from there.
import { computed, ref, watch } from 'vue';
import PageHeader from '../../components/ui/PageHeader.vue';
import Button from '../../components/ui/Button.vue';
import Tabs from '../../components/ui/Tabs.vue';
import EmptyState from '../../components/ui/EmptyState.vue';
import Pagination from '../../components/ui/Pagination.vue';
import Spinner from '../../components/ui/Spinner.vue';
import Dialog from '../../components/ui/Dialog.vue';
import { useApiData } from '../../composables/useApiData';
import { apiPost } from '../../lib/api';
import { t } from '../../lib/i18n';
import { formatDateTime } from '../../lib/money';
import { notificationSummary, notificationTitle, type NotificationItem } from '../../lib/notifications';
import { openTarget } from '../../navigation/navigate';
import { useSessionStore } from '../../stores/session';

defineProps<{ route: string }>();
const session = useSessionStore();

const view = ref<'all' | 'unread'>('all');
const page = ref(1);
const size = ref(10);
watch(view, () => { page.value = 1; });

const list = useApiData<{ items: NotificationItem[]; total: number }>(
  () => `/notifications?unread=${view.value === 'unread'}&page=${page.value}&size=${size.value}`,
);
const items = computed(() => list.data.value?.items ?? []);
const opened = ref<NotificationItem | null>(null);

const tabItems = [{ id: 'all' as const, label: t('全部消息') }, { id: 'unread' as const, label: t('未读消息') }];

async function markAllRead() {
  try {
    await apiPost('/notifications/read-all', {});
    session.refresh();
    session.notify(t('已全部标记为已读'));
  } catch (error) {
    session.notify((error as Error).message, true);
  }
}

async function open(item: NotificationItem) {
  try {
    if (!item.readAt) await apiPost(`/notifications/${item.id}/read`, {});
    opened.value = item;
    session.refresh();
  } catch (error) {
    session.notify((error as Error).message, true);
  }
}

function openRecord(item: NotificationItem) {
  opened.value = null;
  openTarget(item.targetPath);
}
</script>

<template>
  <div class="notifications">
    <PageHeader :title="t('消息通知')">
      <template #actions>
        <Button icon="check" @click="markAllRead">{{ t('全部已读') }}</Button>
      </template>
    </PageHeader>

    <section class="card">
      <div class="tabs-bar"><Tabs v-model="view" :items="tabItems" :label="t('消息通知')" /></div>

      <div v-if="list.loading.value && !list.data.value" class="state"><Spinner :size="16" /></div>
      <EmptyState v-else-if="list.error.value" error :text="list.error.value">
        <Button size="sm" icon="refresh" @click="list.reload()">{{ t('重试') }}</Button>
      </EmptyState>
      <ul v-else-if="items.length" class="messages" :class="{ refreshing: list.refreshing.value }">
        <li v-for="item in items" :key="item.id">
          <button type="button" class="message" :class="{ unread: !item.readAt }" @click="open(item)">
            <span class="dot" aria-hidden="true" />
            <span class="text">
              <strong>{{ notificationTitle(item) }}</strong>
              <span>{{ notificationSummary(item) }}</span>
            </span>
            <time :datetime="item.createdAt">{{ formatDateTime(item.createdAt) }}</time>
          </button>
        </li>
      </ul>
      <EmptyState v-else icon="bell" :text="view === 'unread' ? t('没有未读消息') : t('暂无消息')" />

      <Pagination v-if="list.data.value" v-model:page="page" v-model:size="size" :total="list.data.value.total" :loading="list.loading.value" />
    </section>

    <Dialog v-if="opened" :title="notificationTitle(opened)" :subtitle="formatDateTime(opened.createdAt)" @close="opened = null">
      <p class="body">{{ notificationSummary(opened) }}</p>
      <template v-if="opened.targetPath" #footer>
        <Button variant="primary" @click="openRecord(opened)">{{ t('查看相关记录') }}</Button>
      </template>
    </Dialog>
  </div>
</template>

<style scoped>
.card { background: var(--hs-surface); border: 1px solid var(--hs-border); border-radius: var(--hs-radius-card); box-shadow: var(--hs-shadow-card); overflow: hidden; }
.tabs-bar { padding: 14px 20px 0; }
.state { display: grid; place-items: center; padding: 48px; color: var(--hs-text-3); }
.messages { margin: 0; padding: 0; list-style: none; transition: opacity .15s; }
.messages.refreshing { opacity: .6; }
.messages li + li { border-top: 1px solid var(--hs-divider); }
.message { display: grid; grid-template-columns: 8px minmax(0, 1fr) auto; align-items: start; gap: 12px; width: 100%; min-height: 0; padding: 14px 20px; color: var(--hs-text); background: none; border: 0; border-radius: 0; font: inherit; text-align: left; cursor: pointer; }
.message:hover { background: var(--hs-surface-subtle); }
.message:focus-visible { outline: 2px solid var(--hs-accent); outline-offset: -2px; }
.dot { width: 7px; height: 7px; margin-top: 7px; border-radius: 50%; background: transparent; }
.unread .dot { background: var(--hs-accent); }
.text { display: grid; gap: 2px; min-width: 0; }
.text strong { color: var(--hs-text-2); font-size: var(--hs-text-sm); font-weight: 400; }
.unread .text strong { color: var(--hs-text); font-weight: 500; }
.text span { color: var(--hs-text-3); font-size: var(--hs-text-xs); line-height: 1.6; overflow-wrap: anywhere; }
time { color: var(--hs-text-4); font-size: var(--hs-text-xs); font-variant-numeric: tabular-nums; white-space: nowrap; }
.body { margin: 0; color: var(--hs-text-2); font-size: var(--hs-text-sm); line-height: 1.7; white-space: pre-wrap; overflow-wrap: anywhere; }
</style>
