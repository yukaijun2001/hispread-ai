<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import PageHeader from '../../components/ui/PageHeader.vue';
import Avatar from '../../components/ui/Avatar.vue';
import Badge from '../../components/ui/Badge.vue';
import Button from '../../components/ui/Button.vue';
import IconButton from '../../components/ui/IconButton.vue';
import SearchInput from '../../components/ui/SearchInput.vue';
import Select from '../../components/ui/Select.vue';
import DataTable from '../../components/ui/DataTable.vue';
import Pagination from '../../components/ui/Pagination.vue';
import StatusBadge from '../../components/ui/StatusBadge.vue';
import Notice from '../../components/ui/Notice.vue';
import Dialog from '../../components/ui/Dialog.vue';
import FormField from '../../components/ui/FormField.vue';
import TextInput from '../../components/ui/TextInput.vue';
import FormDialog from './components/FormDialog.vue';
import CredentialDialog from './components/CredentialDialog.vue';
import ApiTokensPanel from './components/ApiTokensPanel.vue';
import RoleEditorDialog from './RoleEditorDialog.vue';
import UserFormDialog from './UserFormDialog.vue';
import { useApiData } from '../../composables/useApiData';
import { useSupplierDirectory } from '../../composables/useSupplierDirectory';
import { apiPost, apiPut } from '../../lib/api';
import { t } from '../../lib/i18n';
import { roleLabel } from '../../lib/labels';
import { useSessionStore } from '../../stores/session';
import { SUPPLIER_ROLES, type RoleCatalog } from './roles';
import type { Credential, UserRow } from './users';

defineProps<{ route: string }>();
const session = useSessionStore();
const me = computed(() => session.user!);
const platformAdmin = computed(() => me.value.role === 'ADMIN' && !me.value.supplierId);

// --- Filters ---------------------------------------------------------------
// The supplier filter is a supplier id from the directory, or free text without supplier.read.
const search = ref('');
const supplierSearch = ref('');
const roleCode = ref('');
const enabled = ref('');
const online = ref('');
const page = ref(1);
const size = ref(10);
watch([search, supplierSearch, roleCode, enabled, online], () => { page.value = 1; });
const filtered = computed(() => !!(search.value || supplierSearch.value || roleCode.value || enabled.value || online.value));

function clearFilters() {
  search.value = ''; supplierSearch.value = ''; roleCode.value = ''; enabled.value = ''; online.value = ''; page.value = 1;
}

// --- Data ------------------------------------------------------------------
const list = useApiData<{ items: UserRow[]; total: number }>(() => `/system/users?${new URLSearchParams({
  search: search.value, supplierSearch: supplierSearch.value, roleCode: roleCode.value, enabled: enabled.value, online: online.value,
  page: String(page.value), size: String(size.value),
})}`, { pollMs: 30_000 });
const catalog = useApiData<RoleCatalog>('/system/roles');
const directory = useSupplierDirectory(() => session.has('supplier.read'));

const supplierPlaceholder = computed(() => (directory.loading.value ? t('{0}加载中…', [t('供应商')]) : directory.error.value ? t('{0}加载失败', [t('供应商')]) : t('全部供应商')));
// A chosen supplier missing from the directory stays selectable as "已选供应商".
const supplierOptions = computed(() => {
  const items = (directory.items.value ?? []).map((supplier) => ({ value: supplier.id, label: supplier.name, detail: supplier.code }));
  const missing = supplierSearch.value && !items.some((option) => option.value === supplierSearch.value);
  return [
    { value: '', label: supplierPlaceholder.value },
    ...items,
    ...(missing ? [{ value: supplierSearch.value, label: t('已选{0}', [t('供应商')]) }] : []),
  ];
});
const roleOptions = computed(() => [
  { value: '', label: t('全部角色') },
  ...(catalog.data.value?.roles ?? []).map((role) => ({ value: role.code, label: roleLabel(role) })),
]);
const statusOptions = [{ value: '', label: t('全部状态') }, { value: 'true', label: t('启用') }, { value: 'false', label: t('停用') }];
const onlineOptions = [{ value: '', label: t('是否在线') }, { value: 'true', label: t('在线') }, { value: 'false', label: t('离线') }];

const columns = [
  { key: 'user', label: t('用户') },
  { key: 'roles', label: t('角色') },
  { key: 'scope', label: t('所属范围') },
  { key: 'enabled', label: t('状态'), nowrap: true },
  { key: 'online', label: t('是否在线'), nowrap: true },
  { key: 'actions', label: t('操作'), nowrap: true },
];
const rowIndex = (row: UserRow) => (list.data.value?.items ?? []).indexOf(row);

// --- Dialogs ---------------------------------------------------------------
const form = ref<UserRow | 'new' | null>(null);
const creatingRole = ref(false);
const toggling = ref<UserRow | null>(null);
const resetting = ref<UserRow | null>(null);
const resetPassword = ref('');
const loggingOut = ref<UserRow | null>(null);
const tokensFor = ref<UserRow | null>(null);
const credential = ref<Credential | null>(null);

function openReset(user: UserRow) { resetPassword.value = ''; resetting.value = user; }

function roleCreated() {
  creatingRole.value = false;
  session.refresh();
  session.notify(t('自定义角色已创建，可勾选分配'));
}

async function toggleEnabled() {
  const user = toggling.value!;
  await apiPut(`/system/users/${user.id}/enabled`, { enabled: !user.enabled, version: user.version });
  session.refresh();
  session.notify(user.enabled ? t('账号已停用') : t('账号已启用'));
}

async function submitReset() {
  const user = resetting.value!;
  const result = await apiPost<Credential>(`/system/users/${user.id}/password`, { password: resetPassword.value || null });
  credential.value = { ...result, username: user.username };
  session.refresh();
  session.notify(t('密码已重置'));
}

async function forceLogout() {
  await apiPost(`/system/users/${loggingOut.value!.id}/logout`, {});
  session.refresh();
  session.notify(t('已强制登出'));
}
</script>

<template>
  <div class="users">
    <PageHeader :title="t('账号管理')">
      <template #actions>
        <Button variant="primary" icon="plus" @click="form = 'new'">{{ t('创建账号') }}</Button>
      </template>
    </PageHeader>

    <section class="card">
      <div class="toolbar">
        <SearchInput v-model="search" class="grow" :placeholder="t('搜索姓名或登录账号')" :label="t('搜索姓名或登录账号')" />
        <SearchInput v-if="!session.has('supplier.read')" v-model="supplierSearch" class="filter" :placeholder="t('搜索供应商名称或编码')" :label="t('供应商')" />
        <div v-else class="filter">
          <Select v-model="supplierSearch" :options="supplierOptions" :label="t('供应商')" :placeholder="supplierPlaceholder" icon="users"
            searchable :search-placeholder="t('搜索供应商名称或编码')" :disabled="directory.loading.value && !supplierSearch" />
        </div>
        <div class="filter"><Select v-model="roleCode" :options="roleOptions" :label="t('筛选账号角色')" :placeholder="t('全部角色')" /></div>
        <div class="filter narrow"><Select v-model="enabled" :options="statusOptions" :label="t('筛选账号状态')" :placeholder="t('全部状态')" /></div>
        <div class="filter narrow"><Select v-model="online" :options="onlineOptions" :label="t('筛选是否在线')" :placeholder="t('是否在线')" /></div>
        <div class="toolbar-actions">
          <Button v-if="filtered" variant="ghost" size="sm" @click="clearFilters">{{ t('清除筛选') }}</Button>
          <IconButton icon="refresh" :label="t('刷新账号')" @click="session.refresh()" />
        </div>
      </div>

      <DataTable
        :columns="columns"
        :rows="list.data.value?.items"
        :row-key="(row: UserRow) => row.id"
        :loading="list.loading.value"
        :refreshing="list.refreshing.value"
        :error="list.error.value"
        :label="t('账号管理')"
        @retry="list.reload()"
      >
        <template #cell-user="{ row }">
          <div class="hs-identity">
            <Avatar :name="row.displayName ?? ''" :tone="rowIndex(row)" />
            <div class="cell"><strong>{{ row.displayName }}</strong><small>{{ row.username }}</small></div>
          </div>
        </template>
        <template #cell-roles="{ row }">
          <div class="tags">
            <Badge>{{ roleLabel({ code: row.roleCode, name: row.roleName || row.roleCode }) }}</Badge>
            <Badge v-for="role in row.additionalRoles ?? []" :key="role.code" tone="info">{{ roleLabel(role) }}</Badge>
          </div>
        </template>
        <template #cell-scope="{ row }">{{ SUPPLIER_ROLES.includes(row.roleCode) ? row.supplierName || t('待关联供应商') : t('平台') }}</template>
        <template #cell-enabled="{ row }"><StatusBadge :state="row.enabled ? 'APPROVED' : 'WITHDRAWN'" :label="row.enabled ? t('启用') : t('停用')" /></template>
        <template #cell-online="{ row }"><StatusBadge :state="row.online ? 'APPROVED' : 'WITHDRAWN'" :label="row.online ? t('在线') : t('离线')" /></template>
        <template #cell-actions="{ row }">
          <div class="actions">
            <button type="button" class="action" :disabled="row.id === me.id" @click="form = row">{{ t('编辑') }}</button>
            <button type="button" class="action" :disabled="row.id === me.id" @click="toggling = row">{{ row.enabled ? t('停用') : t('启用') }}</button>
            <button type="button" class="action" :disabled="row.id === me.id" @click="openReset(row)">{{ t('重置密码') }}</button>
            <button v-if="platformAdmin" type="button" class="action" @click="tokensFor = row">{{ t('API 密钥') }}</button>
            <button type="button" class="action" :disabled="row.id === me.id" @click="loggingOut = row">{{ t('强制登出') }}</button>
          </div>
        </template>
      </DataTable>
      <Pagination v-model:page="page" v-model:size="size" :total="list.data.value?.total ?? 0" :loading="list.loading.value" />
    </section>

    <FormDialog
      v-if="toggling"
      :title="t('{0}账号 · {1}', [toggling.enabled ? t('停用') : t('启用'), toggling.displayName])"
      :submit-label="toggling.enabled ? t('确认停用') : t('确认启用')"
      :on-submit="toggleEnabled"
      @close="toggling = null"
    >
      <Notice :tone="toggling.enabled ? 'warning' : 'info'">
        {{ toggling.enabled
          ? t('停用后，{0} 将立即退出登录且无法再次登录，历史资源和账单保留。', [toggling.username])
          : t('启用后，{0} 可重新登录，原角色和所属供应商保持不变。', [toggling.username]) }}
      </Notice>
    </FormDialog>

    <UserFormDialog
      v-if="form"
      :key="form === 'new' ? 'new' : form.id"
      :user="form"
      :catalog="catalog.data.value"
      :catalog-loading="catalog.loading.value"
      :catalog-error="catalog.error.value"
      :suppliers="directory.items.value ?? []"
      :can-create-role="session.has('system.roles')"
      @close="form = null"
      @created="(value) => (credential = value)"
      @create-role="creatingRole = true"
    />
    <RoleEditorDialog
      v-if="creatingRole && catalog.data.value"
      role="new"
      :permissions="catalog.data.value.permissions"
      :scope-types="catalog.data.value.scopeTypes ?? []"
      @close="creatingRole = false"
      @saved="roleCreated"
    />

    <FormDialog v-if="resetting" :title="t('重置密码 · {0}', [resetting.displayName])" :on-submit="submitReset" @close="resetting = null">
      <template #default="{ busy }">
        <FormField :label="t('新初始密码')">
          <template #default="{ id }">
            <TextInput :id="id" v-model="resetPassword" type="password" autocomplete="new-password" :placeholder="t('留空则按系统参数随机生成')" :disabled="busy" />
          </template>
        </FormField>
        <Notice tone="warning">{{ t('重置后旧会话失效，首次登录要求遵循当前系统参数。') }}</Notice>
      </template>
    </FormDialog>

    <FormDialog v-if="loggingOut" :title="t('强制登出 · {0}', [loggingOut.displayName])" :submit-label="t('强制登出')" :on-submit="forceLogout" @close="loggingOut = null">
      <Notice tone="warning">{{ t('将立即结束') }} {{ loggingOut.username }}{{ t(' 的全部登录会话。对方需要重新登录。') }}</Notice>
    </FormDialog>

    <Dialog v-if="tokensFor" size="lg" :title="t('API 密钥')" :subtitle="tokensFor.username" @close="tokensFor = null">
      <ApiTokensPanel :user-id="tokensFor.id" />
    </Dialog>

    <CredentialDialog v-if="credential" :value="credential" @close="credential = null" />
  </div>
</template>

<style scoped>
.card { background: var(--hs-surface); border: 1px solid var(--hs-border); border-radius: var(--hs-radius-card); box-shadow: var(--hs-shadow-card); overflow: hidden; }
.toolbar { display: flex; flex-wrap: wrap; align-items: center; gap: 8px; padding: 14px 16px; }
.grow { flex: 1 1 220px; }
.filter { flex: 0 1 180px; min-width: 150px; }
.filter.narrow { flex-basis: 130px; min-width: 120px; }
.toolbar-actions { display: flex; align-items: center; gap: 2px; margin-left: auto; }
.hs-identity { display: flex; align-items: center; gap: 10px; min-width: 0; }
.cell { display: grid; gap: 2px; min-width: 0; }
.cell strong { color: var(--hs-text); font-weight: 500; overflow-wrap: anywhere; }
.cell small { color: var(--hs-text-3); font-size: var(--hs-text-xs); }
.tags { display: flex; flex-wrap: wrap; gap: 4px; }
.actions { display: flex; flex-wrap: wrap; gap: 4px 10px; }
.action { padding: 0; color: var(--hs-accent); background: none; border: 0; font: inherit; font-size: var(--hs-text-xs); white-space: nowrap; cursor: pointer; }
.action:hover:not(:disabled) { color: var(--hs-accent-hover); text-decoration: underline; text-underline-offset: 3px; }
.action:disabled { color: var(--hs-text-4); cursor: not-allowed; }
</style>
