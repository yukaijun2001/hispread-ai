<script setup lang="ts">
// Who received a published notice and who has read it. Viewing does not mark
// anything as read.
import { computed, ref } from 'vue';
import Dialog from '../../../components/ui/Dialog.vue';
import Badge from '../../../components/ui/Badge.vue';
import DataTable from '../../../components/ui/DataTable.vue';
import IconButton from '../../../components/ui/IconButton.vue';
import Notice from '../../../components/ui/Notice.vue';
import Pagination from '../../../components/ui/Pagination.vue';
import SearchInput from '../../../components/ui/SearchInput.vue';
import StatusBadge from '../../../components/ui/StatusBadge.vue';
import Tabs from '../../../components/ui/Tabs.vue';
import { useApiData } from '../../../composables/useApiData';
import { t } from '../../../lib/i18n';
import { formatDateTime } from '../../../lib/money';
import type { NoticeRow, Recipient } from './notices';

interface Delivery extends Recipient { withdrawnAt?: string | null; readAt?: string | null; sentAt?: string | null }
interface Summary { recipientCount: number; withdrawnCount: number; knownRecipientCount: number; readCount: number; unreadCount: number; historyComplete: boolean }

const props = defineProps<{ notice: NoticeRow }>();
const emit = defineEmits<{ close: [] }>();

const search = ref('');
const state = ref<'all' | 'READ' | 'UNREAD'>('all');
const page = ref(1);
const size = ref(20);

const list = useApiData<{ items: Delivery[]; total: number; summary?: Summary }>(() => `/notifications/notices/${props.notice.id}/deliveries?search=${encodeURIComponent(search.value)}&state=${state.value === 'all' ? '' : state.value}&page=${page.value}&size=${size.value}`);
const summary = computed(() => list.data.value?.summary);

const tabs = computed(() => {
  const value = summary.value;
  return [
    { id: 'all' as const, label: `${t('全部人员')}${value ? ` · ${value.knownRecipientCount}` : ''}` },
    { id: 'READ' as const, label: value ? t('已读 {0} 人', [value.readCount]) : t('已读') },
    { id: 'UNREAD' as const, label: value ? t('未读 {0} 人', [value.unreadCount]) : t('未读') },
  ];
});

function setState(value: 'all' | 'READ' | 'UNREAD') { state.value = value; page.value = 1; }
function setSearch(value: string) { search.value = value; page.value = 1; }

const columns = [
  { key: 'person', label: t('接收人员') },
  { key: 'supplier', label: t('供应商') },
  { key: 'delivery', label: t('推送情况'), nowrap: true },
  { key: 'read', label: t('阅读状态'), nowrap: true },
  { key: 'sentAt', label: t('推送时间'), nowrap: true },
  { key: 'readAt', label: t('阅读时间'), nowrap: true },
];
const rowKey = (row: Delivery) => row.id ?? row.userId ?? row.username;
</script>

<template>
  <Dialog size="xl" :title="t('阅读与接收人员')" :subtitle="notice.title" @close="emit('close')">
    <div class="ndl">
      <div v-if="summary" class="ndl-summary" aria-live="polite">
        <strong>{{ t('已推送 {0} 人', [summary.recipientCount]) }}</strong>
        <span v-if="summary.withdrawnCount > 0">{{ t('已撤回 {0} 人', [summary.withdrawnCount]) }}</span>
      </div>
      <Notice v-if="summary && !summary.historyComplete" tone="warning">
        {{ t('历史接收明细仅保留 {0} 人，其余投递记录已移除，无法还原人员及阅读状态。', [summary.knownRecipientCount]) }}
      </Notice>
      <Tabs :model-value="state" :items="tabs" :label="t('阅读状态')" @update:model-value="setState" />
      <div class="ndl-toolbar">
        <SearchInput class="ndl-search" :model-value="search" :placeholder="t('搜索姓名、账号或供应商')" @update:model-value="setSearch" />
        <IconButton icon="refresh" :label="t('刷新人员明细')" @click="list.reload()" />
      </div>
      <div class="ndl-table">
        <DataTable
          :columns="columns"
          :rows="list.data.value?.items"
          :row-key="rowKey"
          :loading="list.loading.value"
          :refreshing="list.refreshing.value"
          :error="list.error.value"
          :label="t('阅读与接收人员')"
          @retry="list.reload()"
        >
          <template #cell-person="{ row }"><div class="ndl-person"><strong>{{ row.displayName }}</strong><small>{{ row.username }}</small></div></template>
          <template #cell-supplier="{ row }">{{ row.supplierName || t('平台人员') }}</template>
          <template #cell-delivery="{ row }"><Badge :tone="row.withdrawnAt ? 'neutral' : 'info'" dot>{{ row.withdrawnAt ? t('已撤回') : t('已投递') }}</Badge></template>
          <template #cell-read="{ row }"><StatusBadge :state="row.readAt ? 'APPROVED' : 'PENDING'" :label="row.readAt ? t('已读') : t('未读')" /></template>
          <template #cell-sentAt="{ row }"><span class="ndl-time">{{ formatDateTime(row.sentAt) }}</span></template>
          <template #cell-readAt="{ row }"><span class="ndl-time">{{ formatDateTime(row.readAt) }}</span></template>
        </DataTable>
      </div>
      <Pagination v-model:page="page" v-model:size="size" :total="list.data.value?.total ?? 0" :loading="list.loading.value" />
      <p class="ndl-hint">{{ t('已读表示该账号已点击“标记已读”、打开消息或执行“全部已读”。查看人员明细不会改变阅读状态。') }}</p>
    </div>
  </Dialog>
</template>

<style scoped>
.ndl { display: grid; gap: 14px; }
.ndl-summary { display: flex; flex-wrap: wrap; align-items: center; gap: 12px 22px; color: var(--hs-text); font-size: var(--hs-text-sm); }
.ndl-summary span { color: var(--hs-text-3); }
.ndl-toolbar { display: flex; align-items: center; gap: 8px; }
.ndl-search { flex: 1 1 260px; }
.ndl-table { max-height: min(40dvh, 420px); overflow: auto; border: 1px solid var(--hs-border); border-radius: 12px; }
.ndl-person { display: grid; gap: 2px; }
.ndl-person strong { color: var(--hs-text); font-weight: 500; }
.ndl-person small { color: var(--hs-text-3); font-size: var(--hs-text-xs); }
.ndl-time { color: var(--hs-text-2); font-variant-numeric: tabular-nums; }
.ndl-hint { margin: 0; color: var(--hs-text-3); font-size: var(--hs-text-xs); line-height: 1.7; }
</style>
