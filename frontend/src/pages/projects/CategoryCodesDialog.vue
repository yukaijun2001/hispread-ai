<script setup lang="ts">
// Project category codes. Codes in use by a project cannot be deleted.
import Dialog from '../../components/ui/Dialog.vue';
import Button from '../../components/ui/Button.vue';
import DataTable from '../../components/ui/DataTable.vue';
import StatusBadge from '../../components/ui/StatusBadge.vue';
import { t } from '../../lib/i18n';
import type { CategoryCode } from './projectAdmin';

defineProps<{ codes: CategoryCode[]; loading: boolean; error: string }>();
const emit = defineEmits<{ close: []; create: []; edit: [code: CategoryCode]; remove: [code: CategoryCode]; retry: [] }>();

const columns = [
  { key: 'name', label: t('大类名称') },
  { key: 'code', label: t('码值') },
  { key: 'projectCount', label: t('关联项目'), align: 'right' as const, width: '96px' },
  { key: 'enabled', label: t('状态'), width: '96px' },
  { key: 'actions', label: t('操作'), width: '112px' },
];
</script>

<template>
  <Dialog size="lg" :title="t('项目大类码值')" @close="emit('close')">
    <div class="head">
      <span class="note">{{ t('码值创建后固定；停用不改变已有项目。') }}</span>
      <Button variant="primary" icon="plus" size="sm" @click="emit('create')">{{ t('新增大类') }}</Button>
    </div>
    <div class="table">
      <DataTable :columns="columns" :rows="codes" :row-key="(row: CategoryCode) => row.code" :loading="loading" :error="error" :label="t('项目大类码值')" @retry="emit('retry')">
        <template #cell-name="{ row }"><strong class="name">{{ row.name }}</strong></template>
        <template #cell-code="{ row }"><span class="code">{{ row.code }}</span></template>
        <template #cell-enabled="{ row }"><StatusBadge :state="row.enabled ? 'APPROVED' : 'WITHDRAWN'" :label="row.enabled ? t('启用') : t('停用')" /></template>
        <template #cell-actions="{ row }">
          <div class="actions">
            <button type="button" class="action" @click="emit('edit', row)">{{ t('编辑') }}</button>
            <span v-if="row.projectCount > 0" :title="t('该大类已有项目关联，不能删除')">
              <button type="button" class="action" disabled>{{ t('删除') }}</button>
            </span>
            <button v-else type="button" class="action danger" @click="emit('remove', row)">{{ t('删除') }}</button>
          </div>
        </template>
      </DataTable>
    </div>
  </Dialog>
</template>

<style scoped>
.head { display: flex; align-items: center; justify-content: space-between; gap: 12px; margin-bottom: 12px; }
.note { color: var(--hs-text-3); font-size: var(--hs-text-xs); }
.table { border: 1px solid var(--hs-border); border-radius: 12px; overflow: hidden; }
.name { color: var(--hs-text); font-weight: 500; }
.code { color: var(--hs-text-3); font-family: var(--hs-font-mono); font-size: var(--hs-text-xs); }
.actions { display: flex; gap: 10px; }
.action { padding: 0; color: var(--hs-accent); background: none; border: 0; font: inherit; font-size: var(--hs-text-xs); white-space: nowrap; cursor: pointer; }
.action:hover:not(:disabled) { color: var(--hs-accent-hover); text-decoration: underline; text-underline-offset: 3px; }
.action.danger { color: var(--hs-danger); }
.action:disabled { color: var(--hs-text-4); cursor: not-allowed; }
</style>
