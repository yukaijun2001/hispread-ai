<script setup lang="ts">
// notice-admin: system notices — drafts, publishing, revoking and read receipts.
import { ref } from 'vue';
import PageHeader from '../../components/ui/PageHeader.vue';
import Badge from '../../components/ui/Badge.vue';
import Button from '../../components/ui/Button.vue';
import DataTable from '../../components/ui/DataTable.vue';
import Dialog from '../../components/ui/Dialog.vue';
import IconButton from '../../components/ui/IconButton.vue';
import Notice from '../../components/ui/Notice.vue';
import Pagination from '../../components/ui/Pagination.vue';
import SearchInput from '../../components/ui/SearchInput.vue';
import Select from '../../components/ui/Select.vue';
import NoticeDetailDrawer from './notices/NoticeDetailDrawer.vue';
import NoticeEditorDialog from './notices/NoticeEditorDialog.vue';
import NoticeDeliveriesDialog from './notices/NoticeDeliveriesDialog.vue';
import { useApiData } from '../../composables/useApiData';
import { apiPost } from '../../lib/api';
import { t } from '../../lib/i18n';
import { formatDateTime } from '../../lib/money';
import { useSessionStore } from '../../stores/session';
import { audienceLabel, noticeStatusLabel, noticeStatusTone, projectNames, type NoticeRow } from './notices/notices';

defineProps<{ route: string }>();
const session = useSessionStore();

const search = ref('');
const status = ref('');
const page = ref(1);
const size = ref(10);
function setSearch(value: string) { search.value = value; page.value = 1; }
function setStatus(value: string) { status.value = value; page.value = 1; }

const list = useApiData<{ items: NoticeRow[]; total: number }>(() => `/notifications/notices?search=${encodeURIComponent(search.value)}&status=${status.value}&page=${page.value}&size=${size.value}`);

const statusOptions = [
  { value: '', label: t('全部状态') },
  { value: 'DRAFT', label: t('草稿') },
  { value: 'PUBLISHED', label: t('已发布') },
  { value: 'REVOKED', label: t('已撤回') },
];
const columns = [
  { key: 'content', label: t('通知内容') },
  { key: 'audience', label: t('接收范围') },
  { key: 'reads', label: t('阅读情况'), nowrap: true },
  { key: 'status', label: t('状态'), nowrap: true },
  { key: 'creatorName', label: t('创建人'), nowrap: true },
  { key: 'updatedAt', label: t('更新时间'), nowrap: true },
  { key: 'actions', label: t('操作'), nowrap: true },
];

const editing = ref<NoticeRow | 'new' | null>(null);
const viewing = ref<NoticeRow | null>(null);
const deliveriesOf = ref<NoticeRow | null>(null);
const publishing = ref<NoticeRow | null>(null);
const revoking = ref<NoticeRow | null>(null);
const busy = ref(false);
const actionError = ref('');

function openPublish(notice: NoticeRow) { actionError.value = ''; publishing.value = notice; }
function openRevoke(notice: NoticeRow) { actionError.value = ''; revoking.value = notice; }
function closePublish() { if (!busy.value) { publishing.value = null; actionError.value = ''; } }
function closeRevoke() { if (!busy.value) { revoking.value = null; actionError.value = ''; } }
function closeDeliveries() { deliveriesOf.value = null; session.refresh(); }

async function publish() {
  if (!publishing.value) return;
  busy.value = true;
  actionError.value = '';
  try {
    const result = await apiPost<{ recipientCount: number }>(`/notifications/notices/${publishing.value.id}/publish`, {});
    publishing.value = null;
    viewing.value = null;
    session.refresh();
    session.notify(t('已发送至 {0} 个账号', [result.recipientCount]));
  } catch (reason) {
    actionError.value = (reason as Error).message;
  } finally {
    busy.value = false;
  }
}

async function revoke() {
  if (!revoking.value) return;
  busy.value = true;
  actionError.value = '';
  try {
    const result = await apiPost<{ removedUnreadCount: number }>(`/notifications/notices/${revoking.value.id}/revoke`, {});
    revoking.value = null;
    viewing.value = null;
    session.refresh();
    session.notify(t('通知已撤回，已移除 {0} 条未读消息', [result.removedUnreadCount]));
  } catch (reason) {
    actionError.value = (reason as Error).message;
  } finally {
    busy.value = false;
  }
}
</script>

<template>
  <div class="na-page">
    <PageHeader :title="t('通知管理')">
      <template #actions>
        <Button variant="primary" icon="plus" @click="editing = 'new'">{{ t('新建通知') }}</Button>
      </template>
    </PageHeader>

    <section class="na-card">
      <div class="na-toolbar">
        <SearchInput class="na-grow" :model-value="search" :placeholder="t('搜索通知标题或正文')" @update:model-value="setSearch" />
        <div class="na-filter"><Select :model-value="status" :options="statusOptions" :label="t('筛选通知状态')" :placeholder="t('全部状态')" @update:model-value="setStatus(String($event))" /></div>
        <div class="na-toolbar-actions"><IconButton icon="refresh" :label="t('刷新通知')" @click="session.refresh()" /></div>
      </div>

      <DataTable
        :columns="columns"
        :rows="list.data.value?.items"
        :row-key="(row: NoticeRow) => row.id"
        :loading="list.loading.value"
        :refreshing="list.refreshing.value"
        :error="list.error.value"
        :label="t('通知管理')"
        @retry="list.reload()"
        @row-click="(row: NoticeRow) => (viewing = row)"
      >
        <template #cell-content="{ row }">
          <div class="na-cell na-content"><strong>{{ row.title }}</strong><small>{{ row.body }}</small></div>
        </template>
        <template #cell-audience="{ row }">
          <div class="na-cell"><span>{{ audienceLabel(row) }}</span><small v-if="row.quoteProjects?.length">{{ projectNames(row) }}</small></div>
        </template>
        <template #cell-reads="{ row }">
          <button type="button" class="na-reads" :disabled="row.status === 'DRAFT'" :aria-label="t('查看阅读和接收人员：{0}', [row.title])" @click.stop="deliveriesOf = row">
            {{ row.readCount }} / {{ row.recipientCount }}<span>{{ t('查看人员') }}</span>
          </button>
        </template>
        <template #cell-status="{ row }"><Badge :tone="noticeStatusTone(row.status)" dot>{{ noticeStatusLabel(row.status) }}</Badge></template>
        <template #cell-creatorName="{ row }">{{ row.creatorName }}</template>
        <template #cell-updatedAt="{ row }"><span class="na-time">{{ formatDateTime(row.publishedAt || row.updatedAt || row.createdAt) }}</span></template>
        <template #cell-actions="{ row }">
          <div class="na-actions">
            <template v-if="row.status === 'DRAFT'">
              <button type="button" class="na-action" @click.stop="editing = row">{{ t('编辑') }}</button>
              <button type="button" class="na-action" @click.stop="openPublish(row)">{{ t('发布') }}</button>
            </template>
            <button v-else-if="row.status === 'PUBLISHED'" type="button" class="na-action" @click.stop="openRevoke(row)">{{ t('撤回') }}</button>
            <span v-else class="na-none">—</span>
          </div>
        </template>
      </DataTable>
      <Pagination v-model:page="page" v-model:size="size" :total="list.data.value?.total ?? 0" :loading="list.loading.value" />
    </section>

    <NoticeEditorDialog v-if="editing" :key="editing === 'new' ? 'new' : editing.id" :editing="editing" @close="editing = null" />
    <NoticeDeliveriesDialog v-if="deliveriesOf" :notice="deliveriesOf" @close="closeDeliveries" />
    <NoticeDetailDrawer
      v-if="viewing"
      :notice="viewing"
      @close="viewing = null"
      @deliveries="deliveriesOf = viewing; viewing = null"
      @edit="editing = viewing; viewing = null"
      @publish="openPublish(viewing!)"
      @revoke="openRevoke(viewing!)"
    />

    <Dialog v-if="publishing" size="sm" :title="t('发布通知')" :subtitle="publishing.title" @close="closePublish">
      <Notice>
        {{ t('发布后将立即发送给“') }}{{ audienceLabel(publishing) }}{{ publishing.quoteProjects?.length ? ` · ${projectNames(publishing)}` : '' }}{{ t('”，草稿内容将不能再修改。') }}
      </Notice>
      <Notice v-if="actionError" class="na-error" tone="danger">{{ actionError }}</Notice>
      <template #footer>
        <Button :disabled="busy" @click="publishing = null; actionError = ''">{{ t('取消') }}</Button>
        <Button variant="primary" :disabled="busy" @click="publish">{{ t(busy ? '发布中…' : '确认发布') }}</Button>
      </template>
    </Dialog>

    <Dialog v-if="revoking" size="sm" :title="t('撤回通知')" :subtitle="revoking.title" @close="closeRevoke">
      <Notice tone="warning">{{ t('撤回后，尚未阅读的消息会从收件人列表中移除；已读消息和管理记录会保留。') }}</Notice>
      <Notice v-if="actionError" class="na-error" tone="danger">{{ actionError }}</Notice>
      <template #footer>
        <Button :disabled="busy" @click="revoking = null; actionError = ''">{{ t('取消') }}</Button>
        <Button variant="danger" :disabled="busy" @click="revoke">{{ t(busy ? '撤回中…' : '确认撤回') }}</Button>
      </template>
    </Dialog>
  </div>
</template>

<style scoped>
.na-card { background: var(--hs-surface); border: 1px solid var(--hs-border); border-radius: var(--hs-radius-card); box-shadow: var(--hs-shadow-card); overflow: hidden; }
.na-toolbar { display: flex; flex-wrap: wrap; align-items: center; gap: 8px; padding: 14px 16px; }
.na-grow { flex: 1 1 240px; }
.na-filter { flex: 0 1 160px; min-width: 130px; }
.na-toolbar-actions { display: flex; align-items: center; gap: 2px; margin-left: auto; }
.na-cell { display: grid; gap: 2px; min-width: 0; }
.na-cell strong { color: var(--hs-text); font-weight: 500; overflow-wrap: anywhere; }
.na-cell small { color: var(--hs-text-3); font-size: var(--hs-text-xs); overflow-wrap: anywhere; }
.na-content { max-width: 420px; }
.na-content small { display: -webkit-box; overflow: hidden; -webkit-box-orient: vertical; -webkit-line-clamp: 2; }
.na-reads { display: inline-flex; align-items: center; gap: 8px; padding: 0; color: var(--hs-accent); background: none; border: 0; font: inherit; font-variant-numeric: tabular-nums; white-space: nowrap; cursor: pointer; }
.na-reads span { font-size: 11px; }
.na-reads:hover:not(:disabled) { text-decoration: underline; text-underline-offset: 3px; }
.na-reads:disabled { color: var(--hs-text-3); cursor: not-allowed; }
.na-time { color: var(--hs-text-3); font-variant-numeric: tabular-nums; }
.na-actions { display: flex; flex-wrap: wrap; gap: 4px 10px; }
.na-action { padding: 0; color: var(--hs-accent); background: none; border: 0; font: inherit; font-size: var(--hs-text-xs); white-space: nowrap; cursor: pointer; }
.na-action:hover { color: var(--hs-accent-hover); text-decoration: underline; text-underline-offset: 3px; }
.na-none { color: var(--hs-text-4); }
.na-error { margin-top: 12px; }
</style>
