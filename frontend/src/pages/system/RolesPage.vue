<script setup lang="ts">
import { ref, watch } from 'vue';
import PageHeader from '../../components/ui/PageHeader.vue';
import Badge from '../../components/ui/Badge.vue';
import Button from '../../components/ui/Button.vue';
import IconButton from '../../components/ui/IconButton.vue';
import SearchInput from '../../components/ui/SearchInput.vue';
import DataTable from '../../components/ui/DataTable.vue';
import Pagination from '../../components/ui/Pagination.vue';
import RoleEditorDialog from './RoleEditorDialog.vue';
import { useApiData } from '../../composables/useApiData';
import { t } from '../../lib/i18n';
import { roleLabel } from '../../lib/labels';
import { useSessionStore } from '../../stores/session';
import type { Role, RoleCatalog } from './roles';

defineProps<{ route: string }>();
const session = useSessionStore();

const search = ref('');
const page = ref(1);
const size = ref(10);
watch(search, () => { page.value = 1; });

const list = useApiData<RoleCatalog & { items: Role[]; total: number }>(() =>
  `/system/roles/page?${new URLSearchParams({ search: search.value, page: String(page.value), size: String(size.value) })}`);

const columns = [
  { key: 'name', label: t('角色名称') },
  { key: 'code', label: t('角色标识') },
  { key: 'builtIn', label: t('类型'), nowrap: true },
  { key: 'permissions', label: t('授权数量'), nowrap: true },
  { key: 'actions', label: t('操作'), nowrap: true },
];
// Built-in identities whose name is fixed: only their permissions are configured.
const PERMISSION_ONLY = ['ADMIN', 'SUPPLIER', 'SUPPLIER_AGENT'];

const editing = ref<Role | 'new' | null>(null);

function saved() {
  session.refresh();
  session.notify(t('角色已保存'));
  editing.value = null;
}
</script>

<template>
  <div class="roles">
    <PageHeader :title="t('角色与权限')">
      <template #actions>
        <Button variant="primary" icon="plus" @click="editing = 'new'">{{ t('新建角色') }}</Button>
      </template>
    </PageHeader>

    <section class="card">
      <div class="toolbar">
        <SearchInput v-model="search" class="grow" :placeholder="t('搜索角色名称或标识')" :label="t('搜索角色名称或标识')" />
        <div class="toolbar-actions">
          <IconButton icon="refresh" :label="t('刷新角色')" @click="session.refresh()" />
        </div>
      </div>

      <DataTable
        :columns="columns"
        :rows="list.data.value?.items"
        :row-key="(row: Role) => row.code"
        :loading="list.loading.value"
        :refreshing="list.refreshing.value"
        :error="list.error.value"
        :label="t('角色与权限')"
        @retry="list.reload()"
      >
        <template #cell-name="{ row }"><strong class="name">{{ roleLabel(row) }}</strong></template>
        <template #cell-code="{ row }"><code class="code">{{ row.code }}</code></template>
        <template #cell-builtIn="{ row }"><Badge>{{ row.builtIn ? t('内置') : t('自定义') }}</Badge></template>
        <template #cell-permissions="{ row }"><span class="num">{{ t('{0} 项', [row.permissions.length]) }}</span></template>
        <template #cell-actions="{ row }">
          <button type="button" class="action" @click="editing = row">{{ PERMISSION_ONLY.includes(row.code) ? t('权限配置') : t('编辑') }}</button>
        </template>
      </DataTable>
      <Pagination v-model:page="page" v-model:size="size" :total="list.data.value?.total ?? 0" :loading="list.loading.value" />
    </section>

    <RoleEditorDialog
      v-if="editing"
      :key="editing === 'new' ? 'new' : editing.code"
      :role="editing"
      :permissions="list.data.value?.permissions ?? []"
      :scope-types="list.data.value?.scopeTypes ?? []"
      @close="editing = null"
      @saved="saved"
    />
  </div>
</template>

<style scoped>
.card { background: var(--hs-surface); border: 1px solid var(--hs-border); border-radius: var(--hs-radius-card); box-shadow: var(--hs-shadow-card); overflow: hidden; }
.toolbar { display: flex; flex-wrap: wrap; align-items: center; gap: 8px; padding: 14px 16px; }
.grow { flex: 1 1 240px; max-width: 420px; }
.toolbar-actions { display: flex; align-items: center; gap: 2px; margin-left: auto; }
.name { color: var(--hs-text); font-weight: 500; }
.code { color: var(--hs-text-2); font-family: var(--hs-font-mono); font-size: var(--hs-text-xs); }
.num { font-variant-numeric: tabular-nums; }
.action { padding: 0; color: var(--hs-accent); background: none; border: 0; font: inherit; font-size: var(--hs-text-xs); white-space: nowrap; cursor: pointer; }
.action:hover { color: var(--hs-accent-hover); text-decoration: underline; text-underline-offset: 3px; }
</style>
