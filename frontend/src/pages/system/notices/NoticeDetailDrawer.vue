<script setup lang="ts">
// One notice: facts, body, and the status-dependent actions (edit/publish a
// draft, revoke a published notice). The page owns the confirm dialogs.
import { computed } from 'vue';
import Dialog from '../../../components/ui/Dialog.vue';
import Badge from '../../../components/ui/Badge.vue';
import Button from '../../../components/ui/Button.vue';
import InfoGrid from '../components/InfoGrid.vue';
import { t } from '../../../lib/i18n';
import { formatDateTime } from '../../../lib/money';
import { audienceLabel, noticeStatusLabel, noticeStatusTone, projectNames, type NoticeRow } from './notices';

const props = defineProps<{ notice: NoticeRow }>();
const emit = defineEmits<{ close: []; deliveries: []; edit: []; publish: []; revoke: [] }>();

const facts = computed(() => {
  const notice = props.notice;
  const items: Array<{ key: string; label: string; value?: string | null }> = [
    { key: 'status', label: t('状态') },
    { key: 'audience', label: t('接收范围'), value: audienceLabel(notice) },
    { key: 'reads', label: t('阅读情况') },
    { key: 'creator', label: t('创建人'), value: notice.creatorName },
    { key: 'createdAt', label: t('创建时间'), value: formatDateTime(notice.createdAt) },
    { key: 'publishedAt', label: t('发布时间'), value: formatDateTime(notice.publishedAt) },
  ];
  if (notice.quoteProjects?.length) items.push({ key: 'projects', label: t('报价项目'), value: projectNames(notice) });
  if (notice.revokedAt) {
    items.push({ key: 'revoker', label: t('撤回人'), value: notice.revokerName || '—' }, { key: 'revokedAt', label: t('撤回时间'), value: formatDateTime(notice.revokedAt) });
  }
  return items;
});
</script>

<template>
  <Dialog drawer :title="notice.title" :subtitle="formatDateTime(notice.publishedAt || notice.updatedAt || notice.createdAt)" @close="emit('close')">
    <div class="nd">
      <InfoGrid :items="facts">
        <template #status><Badge :tone="noticeStatusTone(notice.status)" dot>{{ noticeStatusLabel(notice.status) }}</Badge></template>
        <template #reads>
          <button type="button" class="nd-link" :disabled="notice.status === 'DRAFT'" @click="emit('deliveries')">
            {{ notice.readCount }} / {{ notice.recipientCount }} · {{ t('查看人员') }}
          </button>
        </template>
      </InfoGrid>
      <section class="nd-body">
        <h3>{{ t('通知正文') }}</h3>
        <p>{{ notice.body }}</p>
      </section>
    </div>
    <template v-if="notice.status === 'DRAFT' || notice.status === 'PUBLISHED'" #footer>
      <template v-if="notice.status === 'DRAFT'">
        <Button @click="emit('edit')">{{ t('编辑草稿') }}</Button>
        <Button variant="primary" @click="emit('publish')">{{ t('发布通知') }}</Button>
      </template>
      <Button v-else variant="danger" @click="emit('revoke')">{{ t('撤回通知') }}</Button>
    </template>
  </Dialog>
</template>

<style scoped>
.nd { display: grid; gap: 22px; }
.nd-link { padding: 0; color: var(--hs-accent); background: none; border: 0; font: inherit; font-variant-numeric: tabular-nums; cursor: pointer; }
.nd-link:hover:not(:disabled) { text-decoration: underline; text-underline-offset: 3px; }
.nd-link:disabled { color: var(--hs-text-3); cursor: not-allowed; }
.nd-body { padding-top: 18px; border-top: 1px solid var(--hs-divider); }
.nd-body h3 { margin: 0 0 8px; color: var(--hs-text); font-size: var(--hs-text-sm); font-weight: 600; }
.nd-body p { margin: 0; color: var(--hs-text-2); font-size: var(--hs-text-sm); line-height: 1.75; white-space: pre-wrap; overflow-wrap: anywhere; }
</style>
