<script setup lang="ts">
// Unread notifications with single and bulk "mark as read". Opening one marks
// it read and follows its target.
import { computed, ref } from 'vue';
import { RouterLink } from 'vue-router';
import Card from '../../components/ui/Card.vue';
import Button from '../../components/ui/Button.vue';
import Icon from '../../components/ui/Icon.vue';
import EmptyState from '../../components/ui/EmptyState.vue';
import { apiPost } from '../../lib/api';
import { t } from '../../lib/i18n';
import { formatDateTime } from '../../lib/money';
import { notificationSummary, notificationTitle, type NotificationItem } from '../../lib/notifications';
import { openTarget } from '../../navigation/navigate';
import { useSessionStore } from '../../stores/session';

const props = defineProps<{ items: NotificationItem[] }>();
const emit = defineEmits<{ read: [ids: string[]] }>();
const session = useSessionStore();
const selected = ref(new Set<string>());
const busy = ref(false);

const unread = computed(() => props.items.filter((item) => !item.readAt));
const chosen = computed(() => unread.value.filter((item) => selected.value.has(item.id)));
const allChosen = computed(() => unread.value.length > 0 && chosen.value.length === unread.value.length);

function toggle(id: string, checked: boolean) {
  const next = new Set(selected.value);
  if (checked) next.add(id); else next.delete(id);
  selected.value = next;
}

async function markChosen() {
  if (busy.value || !chosen.value.length) return;
  busy.value = true;
  const batch = chosen.value;
  try {
    const results = await Promise.allSettled(batch.map((item) => apiPost(`/notifications/${item.id}/read`, {})));
    const done = batch.filter((_item, index) => results[index].status === 'fulfilled');
    const failed = batch.filter((_item, index) => results[index].status === 'rejected');
    emit('read', done.map((item) => item.id));
    selected.value = new Set(failed.map((item) => item.id));
    session.refresh();
    if (failed.length) session.notify(t('已标记 {0} 条，{1} 条未成功，请重试。', [done.length, failed.length]), true);
    else session.notify(t('已将 {0} 条消息标记为已读', [done.length]));
  } finally {
    busy.value = false;
  }
}

async function open(item: NotificationItem) {
  if (busy.value) return;
  busy.value = true;
  try {
    await apiPost(`/notifications/${item.id}/read`, {});
    emit('read', [item.id]);
    session.refresh();
    openTarget(item.targetPath);
  } catch (error) {
    session.notify((error as Error).message, true);
  } finally {
    busy.value = false;
  }
}
</script>

<template>
  <Card :title="t('最近进展')" flush>
    <template #actions>
      <template v-if="unread.length">
        <label class="select-all">
          <input type="checkbox" :checked="allChosen" :disabled="busy" @change="selected = new Set(($event.target as HTMLInputElement).checked ? unread.map((item) => item.id) : [])" />
          {{ t('全选本页') }}
        </label>
        <Button size="sm" icon="check" :disabled="busy || !chosen.length" @click="markChosen">
          {{ busy ? t('正在处理…') : t('标记已读（{0}）', [chosen.length]) }}
        </Button>
      </template>
      <RouterLink to="/notifications" class="all">{{ t('全部消息') }}<Icon name="chevron" :size="14" /></RouterLink>
    </template>
    <EmptyState v-if="!unread.length" icon="bell" :text="t('暂无未读进展')" compact />
    <ul v-else class="updates">
      <li v-for="item in unread" :key="item.id">
        <input
          type="checkbox"
          :checked="selected.has(item.id)"
          :disabled="busy"
          :aria-label="t('选择消息：{0}', [notificationTitle(item)])"
          @change="toggle(item.id, ($event.target as HTMLInputElement).checked)"
        />
        <button type="button" class="update" :disabled="busy" :aria-label="t('{0}，查看详情', [notificationTitle(item)])" @click="open(item)">
          <span class="dot" aria-hidden="true" />
          <span class="text">
            <strong>{{ notificationTitle(item) }}</strong>
            <span>{{ notificationSummary(item) }}</span>
          </span>
          <time :datetime="item.createdAt">{{ formatDateTime(item.createdAt) }}</time>
        </button>
      </li>
    </ul>
  </Card>
</template>

<style scoped>
.select-all { display: inline-flex; align-items: center; gap: 6px; color: var(--hs-text-2); font-size: var(--hs-text-xs); cursor: pointer; }
input[type=checkbox] { width: 15px; height: 15px; margin: 0; padding: 0; accent-color: var(--hs-primary); cursor: pointer; box-shadow: none; }
.all { display: inline-flex; align-items: center; gap: 2px; color: var(--hs-text-2); font-size: var(--hs-text-xs); text-decoration: none; }
.all:hover { color: var(--hs-text); }
.updates { margin: 0; padding: 0; list-style: none; }
.updates li { display: flex; align-items: flex-start; gap: 12px; padding: 0 0 0 20px; border-top: 1px solid var(--hs-divider); }
.updates li > input { margin-top: 16px; flex: none; }
.update { display: grid; grid-template-columns: 8px minmax(0, 1fr) auto; align-items: start; gap: 10px; flex: 1; min-width: 0; min-height: 0; padding: 12px 20px 12px 0; color: var(--hs-text); background: none; border: 0; border-radius: 0; font: inherit; text-align: left; cursor: pointer; }
.update:hover .text strong { text-decoration: underline; text-underline-offset: 3px; }
.update:focus-visible { outline: 2px solid var(--hs-accent); outline-offset: -2px; }
.dot { width: 7px; height: 7px; margin-top: 7px; border-radius: 50%; background: var(--hs-accent); }
.text { display: grid; gap: 2px; min-width: 0; }
.text strong { font-size: var(--hs-text-sm); font-weight: 500; }
.text span { color: var(--hs-text-3); font-size: var(--hs-text-xs); line-height: 1.6; overflow-wrap: anywhere; }
time { color: var(--hs-text-4); font-size: var(--hs-text-xs); font-variant-numeric: tabular-nums; white-space: nowrap; }
</style>
