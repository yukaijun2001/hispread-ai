<script setup lang="ts">
// 团队成员. The supplier main account (role SUPPLIER) manages member accounts,
// departments, project permissions and the CC quota split. A department admin
// (SUPPLIER_AGENT with `teamAdminGroup`) sees their own group and can only hand
// out project permissions they hold.
import { computed, ref } from 'vue';
import PageHeader from '../../components/ui/PageHeader.vue';
import Button from '../../components/ui/Button.vue';
import IconButton from '../../components/ui/IconButton.vue';
import Icon from '../../components/ui/Icon.vue';
import Badge from '../../components/ui/Badge.vue';
import Notice from '../../components/ui/Notice.vue';
import Dialog from '../../components/ui/Dialog.vue';
import DataTable from '../../components/ui/DataTable.vue';
import FormField from '../../components/ui/FormField.vue';
import SearchInput from '../../components/ui/SearchInput.vue';
import Select from '../../components/ui/Select.vue';
import Spinner from '../../components/ui/Spinner.vue';
import TextInput from '../../components/ui/TextInput.vue';
import AgentProjectSummary from './AgentProjectSummary.vue';
import InitialCredentials from './InitialCredentials.vue';
import ProjectPermissionsDialog from './ProjectPermissionsDialog.vue';
import TeamGroupDialog from './TeamGroupDialog.vue';
import MemberGroupDialog from './MemberGroupDialog.vue';
import IntakeAllocationDialog from './IntakeAllocationDialog.vue';
import { useApiData } from '../../composables/useApiData';
import { apiPost, apiPut } from '../../lib/api';
import { getLocale, t } from '../../lib/i18n';
import { useSessionStore } from '../../stores/session';
import {
  categoryKey, categoryOptions, groupByMember, passwordProblems, policyRequirements,
  type RegistrationPolicy, type SupplierAgent, type TeamGroup,
} from './team';

defineProps<{ route: string }>();

const session = useSessionStore();
const user = computed(() => session.user!);
const mainAccount = computed(() => user.value.role === 'SUPPLIER');
const adminGroup = computed(() => user.value.teamAdminGroup as { id?: string | null; name?: string | null } | null | undefined);

const agents = useApiData<SupplierAgent[]>('/supplier-agents');
const groups = useApiData<TeamGroup[]>(() => (mainAccount.value ? '/supplier-team-groups' : null));
const policy = useApiData<RegistrationPolicy>('/auth/registration-policy');

const agentList = computed(() => agents.data.value ?? []);
const groupList = computed(() => groups.data.value ?? []);
const memberGroup = computed(() => groupByMember(groupList.value));

// --- Department selection ---------------------------------------------------
const selectedGroupId = ref('');
const selectedGroup = computed(() => groupList.value.find((group) => group.id === selectedGroupId.value));
const selectedAdmin = computed(() => agentList.value.find((agent) => agent.id === selectedGroup.value?.adminUserId));
const headcount = computed(() => (selectedGroup.value ? selectedGroup.value.memberIds.length : agentList.value.length));
const heading = computed(() => (mainAccount.value ? '' : adminGroup.value?.name) || selectedGroup.value?.name || t('全部成员'));
const adminText = computed(() => {
  const admin = selectedAdmin.value;
  if (admin) return `${admin.displayName} · ${admin.username}${admin.enabled ? '' : t('（已停用）')}`;
  return selectedGroup.value?.adminUserId ? t('账号不可用') : t('待设置管理员');
});
const groupActionsDisabled = computed(() => groups.refreshing.value || agents.loading.value || !!agents.error.value);

// --- Filters -----------------------------------------------------------------
const search = ref('');
const category = ref('');
const projectId = ref('');
const allProjects = computed(() => agentList.value.flatMap((agent) => agent.projects ?? []));
const projectOptions = computed(() => [
  { value: '', label: t('全部报价项目') },
  ...Array.from(new Map(allProjects.value
    .filter((project) => !category.value || categoryKey(project.category) === category.value)
    .map((project) => [project.id, { value: project.id, label: project.name }])).values())
    .sort((a, b) => a.label.localeCompare(b.label, getLocale())),
]);
function setCategory(value: string) { category.value = value; projectId.value = ''; }
const rows = computed(() => {
  const term = search.value.trim().toLocaleLowerCase();
  return agentList.value.filter((agent) => (!term || `${agent.displayName} ${agent.username}`.toLocaleLowerCase().includes(term))
    && (!selectedGroupId.value || memberGroup.value.get(agent.id)?.id === selectedGroupId.value)
    && (!category.value || !!agent.projects?.some((project) => categoryKey(project.category) === category.value))
    && (!projectId.value || !!agent.projects?.some((project) => project.id === projectId.value)));
});

/** Department shown for a member; a department admin sees their own group for everyone. */
function departmentOf(agent: SupplierAgent): { name: string; adminUserId?: string | null } | undefined {
  if (mainAccount.value) return memberGroup.value.get(agent.id);
  return adminGroup.value ? { name: adminGroup.value.name ?? '', adminUserId: user.value.id } : undefined;
}
const isGroupAdmin = (agent: SupplierAgent) => memberGroup.value.get(agent.id)?.adminUserId === agent.id;

const columns = computed(() => [
  { key: 'member', label: t('成员'), width: '22%' },
  { key: 'department', label: t('所属部门'), width: '16%' },
  { key: 'projects', label: t('可操作项目') },
  { key: 'state', label: t('状态'), width: '88px' },
  { key: 'actions', label: t('操作'), width: mainAccount.value ? '260px' : '120px' },
]);

// --- Dialogs --------------------------------------------------------------------
const busy = ref(false);
const error = ref('');
const allocationOpen = ref(false);
const permissionAgent = ref<SupplierAgent | null>(null);
const movingAgent = ref<SupplierAgent | null>(null);
interface GroupDialogState { group: TeamGroup | 'new'; removing: boolean; adminOnly: boolean; membersOnly: boolean }
const groupDialog = ref<GroupDialogState | null>(null);
const groupDialogKey = computed(() => {
  const state = groupDialog.value;
  return state ? `${state.group === 'new' ? 'new' : state.group.id}:${state.removing}:${state.adminOnly}:${state.membersOnly}` : '';
});
function openGroupDialog(group: TeamGroup | 'new', removing = false, adminOnly = false, membersOnly = false) {
  groupDialog.value = { group, removing, adminOnly, membersOnly };
}
function groupSaved() {
  if (groupDialog.value?.removing) selectedGroupId.value = '';
  session.refresh();
}

// New member
const createOpen = ref(false);
const created = ref<{ username: string; initialPassword?: string | null; groupName: string } | null>(null);
const newGroupId = ref('');
const username = ref('');
const displayName = ref('');
const password = ref('');
const requirements = computed(() => policyRequirements(policy.data.value));
const problems = computed(() => passwordProblems(policy.data.value, password.value));
const duplicate = computed(() => (username.value.trim()
  ? agentList.value.some((agent) => agent.username.toLowerCase() === username.value.trim().toLowerCase()) : false));
const groupOptions = computed(() => groupList.value.map((group) => ({ value: group.id, label: group.name })));

function openCreate() {
  newGroupId.value = selectedGroup.value?.id || groupList.value.find((group) => group.name === '交付组1')?.id || groupList.value[0]?.id || '';
  createOpen.value = true;
  created.value = null;
  error.value = '';
}
function closeCreate() {
  if (busy.value) return;
  createOpen.value = false;
  created.value = null;
  error.value = '';
}

async function createMember() {
  if (duplicate.value) {
    error.value = mainAccount.value ? t('本供应商已有这个登录账号，请在列表中重置密码或更换登录账号') : t('登录账号已存在，请更换登录账号');
    return;
  }
  busy.value = true;
  error.value = '';
  try {
    const result = await apiPost<{ initialPassword?: string | null; groupName: string }>('/supplier-agents', {
      username: username.value.trim(),
      displayName: displayName.value.trim(),
      password: password.value,
      groupId: mainAccount.value ? newGroupId.value || null : adminGroup.value?.id,
    });
    created.value = { username: username.value.trim(), initialPassword: result.initialPassword, groupName: result.groupName };
    username.value = '';
    displayName.value = '';
    password.value = '';
    session.refresh();
  } catch (reason) {
    error.value = (reason as Error).message;
  } finally {
    busy.value = false;
  }
}

async function toggleEnabled(agent: SupplierAgent) {
  if (busy.value) return;
  busy.value = true;
  try {
    await apiPut(`/supplier-agents/${encodeURIComponent(agent.id)}/enabled`, { enabled: !agent.enabled, version: agent.version });
    session.refresh();
    session.notify(agent.enabled ? t('账号已停用') : t('账号已启用'));
  } catch (reason) {
    error.value = (reason as Error).message;
  } finally {
    busy.value = false;
  }
}

// Password reset: confirm, then show the new password once.
const resetting = ref<SupplierAgent | null>(null);
const resetPassword = ref<string | null>(null);
function openReset(agent: SupplierAgent) {
  error.value = '';
  resetPassword.value = null;
  resetting.value = agent;
}
function closeReset() {
  if (busy.value) return;
  resetting.value = null;
  resetPassword.value = null;
  error.value = '';
}
async function confirmReset(agent: SupplierAgent) {
  if (busy.value) return;
  busy.value = true;
  try {
    const result = await apiPost<{ initialPassword: string }>(`/supplier-agents/${encodeURIComponent(agent.id)}/password`, { password: '' });
    resetPassword.value = result.initialPassword;
    session.refresh();
  } catch (reason) {
    error.value = (reason as Error).message;
  } finally {
    busy.value = false;
  }
}
</script>

<template>
  <div class="team-page">
    <PageHeader :title="t('团队成员')">
      <template #actions>
        <Button v-if="mainAccount" @click="allocationOpen = true">{{ t('额度分配') }}</Button>
        <Button variant="primary" icon="plus" :disabled="mainAccount && (groups.loading.value || !!groups.error.value)" @click="openCreate">{{ t('新增成员') }}</Button>
      </template>
    </PageHeader>

    <Notice v-if="!createOpen && !resetting && error" tone="danger" class="team-notice">{{ error }}</Notice>
    <Notice v-if="groups.error.value" tone="danger" class="team-notice">
      {{ t('部门加载失败：') }}{{ groups.error.value }}
      <template #actions><Button size="sm" @click="session.refresh()">{{ t('重试') }}</Button></template>
    </Notice>

    <div class="team-workspace" :class="{ single: !mainAccount }">
      <aside v-if="mainAccount" class="team-departments">
        <div class="team-departments-head">
          <h2>{{ t('团队部门') }}</h2>
          <IconButton icon="plus" :label="t('新增部门')" bordered :disabled="groups.loading.value || !!groups.error.value" @click="openGroupDialog('new')" />
        </div>
        <nav :aria-label="t('团队部门')">
          <button type="button" class="team-dept" :class="{ active: !selectedGroupId }" :aria-current="!selectedGroupId ? 'true' : undefined" @click="selectedGroupId = ''">
            <Icon name="users" :size="17" /><span>{{ t('全部成员') }}</span><small>{{ agentList.length }}</small>
          </button>
          <div v-if="groups.loading.value" class="team-dept-state"><Spinner :size="16" /></div>
          <div v-else-if="groups.error.value" class="team-dept-state">
            <p>{{ t('部门加载失败') }}</p>
            <Button size="sm" @click="session.refresh()">{{ t('重试') }}</Button>
          </div>
          <template v-else>
            <div class="team-dept-divider" />
            <button
              v-for="group in groupList"
              :key="group.id"
              type="button"
              class="team-dept"
              :class="{ active: selectedGroupId === group.id }"
              :aria-current="selectedGroupId === group.id ? 'true' : undefined"
              @click="selectedGroupId = group.id"
            >
              <Icon name="building" :size="17" /><span>{{ group.name }}</span><small>{{ group.memberIds.length }}</small>
            </button>
          </template>
        </nav>
        <p v-if="!groups.loading.value && !groups.error.value && !groupList.length" class="team-dept-empty">{{ t('创建部门，安排成员与管理员。') }}</p>
      </aside>

      <section class="team-card">
        <div class="team-card-head">
          <div class="team-card-title">
            <h2>{{ heading }} <span>{{ t('{0} 人', [headcount]) }}</span></h2>
            <p v-if="!mainAccount">{{ t('仅可为本组成员分配本人已有的项目权限；账号、密码和部门由供应商主账号管理。') }}</p>
            <p v-else-if="selectedGroup">
              {{ t('部门管理员：{0}', [adminText]) }}
              <Badge :tone="selectedGroup.allowPro === false ? 'warning' : 'success'" dot>{{ selectedGroup.allowPro === false ? t('PRO停收') : t('PRO允许') }}</Badge>
            </p>
            <p v-else>{{ t('选择左侧小组，可设置管理员或调整成员分组。') }}</p>
          </div>
          <div class="team-card-actions">
            <template v-if="selectedGroup">
              <Button size="sm" variant="primary" :disabled="groupActionsDisabled" @click="openGroupDialog(selectedGroup, false, false, true)">{{ t('分配成员') }}</Button>
              <Button size="sm" icon="users" :disabled="groupActionsDisabled" @click="openGroupDialog(selectedGroup, false, true)">{{ selectedGroup.adminUserId ? t('更换管理员') : t('设置管理员') }}</Button>
              <Button size="sm" :disabled="groupActionsDisabled" @click="openGroupDialog(selectedGroup)">{{ t('编辑部门') }}</Button>
              <Button size="sm" variant="ghost" :disabled="groups.refreshing.value" @click="openGroupDialog(selectedGroup, true)">{{ t('删除部门') }}</Button>
            </template>
            <IconButton icon="refresh" :label="t('刷新团队成员')" @click="session.refresh()" />
          </div>
        </div>

        <div class="team-toolbar">
          <SearchInput v-model="search" class="team-grow" :placeholder="t('搜索成员姓名或登录账号')" :label="t('搜索成员姓名或登录账号')" />
          <div class="team-filter">
            <Select :model-value="category" :options="categoryOptions(allProjects)" :label="t('成员项目大类筛选')" :placeholder="t('全部大类')" @update:model-value="setCategory(String($event))" />
          </div>
          <div class="team-filter wide">
            <Select v-model="projectId" :options="projectOptions" :label="t('成员报价项目筛选')" :placeholder="t('全部报价项目')" searchable :search-placeholder="t('搜索报价项目')" />
          </div>
        </div>

        <DataTable
          :columns="columns"
          :rows="rows"
          :row-key="(agent: SupplierAgent) => agent.id"
          :loading="agents.loading.value"
          :refreshing="agents.refreshing.value"
          :error="agents.error.value"
          :label="t('团队成员')"
          @retry="agents.reload()"
        >
          <template #cell-member="{ row }">
            <div class="team-identity"><strong>{{ row.displayName }}</strong><small>{{ row.username }}</small></div>
          </template>
          <template #cell-department="{ row }">
            <div v-if="departmentOf(row)" class="team-identity">
              <span>{{ departmentOf(row)!.name }}</span>
              <small v-if="departmentOf(row)!.adminUserId === row.id" class="team-admin-tag">{{ t('部门管理员') }}</small>
            </div>
            <span v-else class="team-quiet">{{ groups.loading.value ? '…' : '—' }}</span>
          </template>
          <template #cell-projects="{ row }">
            <AgentProjectSummary :agent="row" :category="category" :project-id="projectId" @show-all="permissionAgent = row" />
          </template>
          <template #cell-state="{ row }">
            <Badge :tone="row.enabled ? 'success' : 'neutral'" dot>{{ row.enabled ? t('启用') : t('停用') }}</Badge>
          </template>
          <template #cell-actions="{ row }">
            <div v-if="mainAccount" class="team-actions">
              <button type="button" class="team-action" :disabled="busy" @click="openReset(row)">{{ t('重置密码') }}</button>
              <button type="button" class="team-action" :disabled="busy" @click="toggleEnabled(row)">{{ row.enabled ? t('停用') : t('启用') }}</button>
              <button type="button" class="team-action primary" :disabled="busy" @click="permissionAgent = row">{{ t('权限管理') }}</button>
              <button type="button" class="team-action" :disabled="busy || isGroupAdmin(row)" :title="isGroupAdmin(row) ? t('请先更换原部门管理员') : undefined" @click="movingAgent = row">{{ t('调整分组') }}</button>
            </div>
            <span v-else-if="row.id === user.id" class="team-quiet">—</span>
            <div v-else class="team-actions">
              <button type="button" class="team-action primary" :disabled="busy" @click="permissionAgent = row">{{ t('权限管理') }}</button>
            </div>
          </template>
        </DataTable>
      </section>
    </div>

    <IntakeAllocationDialog v-if="allocationOpen" @close="allocationOpen = false" />

    <Dialog v-if="createOpen" :title="created ? t('团队成员创建成功') : t('新增团队成员')" @close="closeCreate">
      <div v-if="created" class="team-form">
        <Notice>
          {{ mainAccount ? t('成员已加入{0}，请在列表中通过“权限管理”分配项目。', [created.groupName]) : t('成员已加入{0}，可在列表中分配你已有的项目。', [adminGroup?.name || '']) }}
        </Notice>
        <InitialCredentials :username="created.username" :initial-password="created.initialPassword" />
      </div>
      <div v-else class="team-form">
        <div class="team-form-grid">
          <FormField :label="t('所属部门')">
            <template #default="{ id }">
              <Select v-if="mainAccount && groupList.length" :id="id" v-model="newGroupId" :options="groupOptions" :label="t('新成员所属部门')" />
              <TextInput v-else :id="id" :model-value="mainAccount ? t('交付组1（自动创建）') : adminGroup?.name || ''" readonly />
            </template>
          </FormField>
          <FormField :label="t('登录账号')">
            <template #default="{ id }"><TextInput :id="id" v-model="username" autocomplete="off" /></template>
          </FormField>
          <FormField :label="t('显示名称')">
            <template #default="{ id }"><TextInput :id="id" v-model="displayName" /></template>
          </FormField>
          <FormField :label="t('初始密码（留空自动生成）')">
            <template #default="{ id }"><TextInput :id="id" v-model="password" type="password" autocomplete="new-password" /></template>
          </FormField>
        </div>
        <p v-if="policy.data.value" class="team-hint">
          {{ t('手动设置需') }} {{ policy.data.value.passwordMinLength }}—{{ policy.data.value.passwordMaxLength }} {{ t('位') }}{{ requirements.length ? t('，包含{0}', [requirements.join(t('、'))]) : '' }}{{ t('；留空由系统生成。') }}
        </p>
        <Notice v-if="problems.length" tone="warning">{{ t('当前密码还需满足：') }}{{ problems.join(t('、')) }}</Notice>
        <Notice v-if="duplicate" tone="warning">{{ mainAccount ? t('这个登录账号已存在，可在列表中重置密码。') : t('登录账号已存在，请更换登录账号') }}</Notice>
        <Notice v-if="error" tone="danger">{{ error }}</Notice>
      </div>
      <template #footer>
        <Button v-if="created" variant="primary" @click="closeCreate">{{ created.initialPassword ? t('我已保存') : t('完成') }}</Button>
        <template v-else>
          <Button :disabled="busy" @click="closeCreate">{{ t('取消') }}</Button>
          <Button variant="primary" :loading="busy" :disabled="busy" @click="createMember">{{ busy ? t('创建中…') : t('创建') }}</Button>
        </template>
      </template>
    </Dialog>

    <Dialog v-if="resetting" :title="resetPassword === null ? t('重置团队成员密码') : t('密码重置成功')" size="sm" @close="closeReset">
      <div v-if="resetPassword === null" class="team-form">
        <p class="team-text">{{ t('将为') }} {{ resetting.username }} {{ t('生成新密码，并让该账号现有会话失效。') }}</p>
        <Notice v-if="error" tone="danger">{{ error }}</Notice>
      </div>
      <InitialCredentials v-else :username="resetting.username" :initial-password="resetPassword" />
      <template #footer>
        <template v-if="resetPassword === null">
          <Button :disabled="busy" @click="closeReset">{{ t('取消') }}</Button>
          <Button variant="primary" :loading="busy" :disabled="busy" @click="confirmReset(resetting)">{{ busy ? t('重置中…') : t('确认重置') }}</Button>
        </template>
        <Button v-else variant="primary" @click="closeReset">{{ resetPassword ? t('我已保存') : t('完成') }}</Button>
      </template>
    </Dialog>

    <ProjectPermissionsDialog v-if="permissionAgent" :agent="permissionAgent" @close="permissionAgent = null" />
    <MemberGroupDialog v-if="movingAgent" :agent="movingAgent" :groups="groupList" @close="movingAgent = null" @saved="session.refresh()" />
    <TeamGroupDialog
      v-if="groupDialog"
      :key="groupDialogKey"
      :agents="agentList"
      :groups="groupList"
      :group="groupDialog.group"
      :removing="groupDialog.removing"
      :admin-only="groupDialog.adminOnly"
      :members-only="groupDialog.membersOnly"
      @close="groupDialog = null"
      @saved="groupSaved"
    />
  </div>
</template>

<style scoped>
.team-page { max-width: 1440px; }
.team-notice { margin-bottom: 14px; }
.team-workspace { display: grid; grid-template-columns: 236px minmax(0, 1fr); gap: 16px; align-items: start; }
.team-workspace.single { grid-template-columns: minmax(0, 1fr); }

.team-departments { position: sticky; top: 16px; padding: 14px 10px; background: var(--hs-surface); border: 1px solid var(--hs-border); border-radius: var(--hs-radius-card); box-shadow: var(--hs-shadow-card); }
.team-departments-head { display: flex; align-items: center; justify-content: space-between; padding: 0 6px 10px; }
.team-departments-head h2 { margin: 0; color: var(--hs-text); font-size: var(--hs-text-sm); font-weight: 600; }
.team-departments nav { display: grid; gap: 2px; }
.team-dept { display: flex; align-items: center; gap: 9px; width: 100%; min-height: 36px; padding: 0 10px; color: var(--hs-text-2); background: none; border: 0; border-radius: var(--hs-radius-small); font: inherit; font-size: var(--hs-text-sm); text-align: left; cursor: pointer; }
.team-dept:hover { color: var(--hs-text); background: var(--hs-surface-hover); }
.team-dept.active { color: var(--hs-text); background: var(--hs-surface-selected); font-weight: 500; }
.team-dept:focus-visible { outline: none; box-shadow: var(--hs-accent-ring); }
.team-dept .hs-icon { color: var(--hs-text-3); flex: none; }
.team-dept span { flex: 1; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.team-dept small { color: var(--hs-text-3); font-size: var(--hs-text-xs); font-variant-numeric: tabular-nums; }
.team-dept-divider { height: 1px; margin: 6px 4px; background: var(--hs-divider); }
.team-dept-state { display: grid; justify-items: center; gap: 8px; padding: 14px 6px; color: var(--hs-text-3); font-size: var(--hs-text-xs); }
.team-dept-state p { margin: 0; }
.team-dept-empty { margin: 10px 6px 0; color: var(--hs-text-3); font-size: var(--hs-text-xs); line-height: 1.6; }

.team-card { min-width: 0; background: var(--hs-surface); border: 1px solid var(--hs-border); border-radius: var(--hs-radius-card); box-shadow: var(--hs-shadow-card); overflow: hidden; }
.team-card-head { display: flex; flex-wrap: wrap; align-items: flex-start; justify-content: space-between; gap: 12px; padding: 18px 20px 6px; }
.team-card-title { min-width: 0; }
.team-card-title h2 { margin: 0; color: var(--hs-text); font-size: var(--hs-text-lg); font-weight: 600; }
.team-card-title h2 span { margin-left: 6px; color: var(--hs-text-3); font-size: var(--hs-text-sm); font-weight: 400; }
.team-card-title p { display: flex; flex-wrap: wrap; align-items: center; gap: 8px; margin: 6px 0 0; color: var(--hs-text-3); font-size: var(--hs-text-xs); line-height: 1.6; }
.team-card-actions { display: flex; flex-wrap: wrap; align-items: center; gap: 6px; }
.team-toolbar { display: flex; flex-wrap: wrap; align-items: center; gap: 8px; padding: 12px 20px 14px; }
.team-grow { flex: 1 1 240px; }
.team-filter { flex: 0 1 180px; min-width: 150px; }
.team-filter.wide { flex-basis: 220px; }

.team-identity { display: grid; gap: 2px; min-width: 0; }
.team-identity strong { color: var(--hs-text); font-weight: 500; }
.team-identity small { color: var(--hs-text-3); font-size: var(--hs-text-xs); }
.team-identity .team-admin-tag { justify-self: start; padding: 0 6px; color: var(--hs-accent); background: var(--hs-accent-soft); border-radius: 6px; font-size: 11px; }
.team-quiet { color: var(--hs-text-4); }
.team-actions { display: flex; flex-wrap: wrap; gap: 4px 12px; }
.team-action { padding: 0; color: var(--hs-text-3); background: none; border: 0; font: inherit; font-size: var(--hs-text-xs); white-space: nowrap; cursor: pointer; }
.team-action:hover:not(:disabled) { color: var(--hs-text); text-decoration: underline; text-underline-offset: 3px; }
.team-action.primary { color: var(--hs-accent); }
.team-action:disabled { opacity: .5; cursor: not-allowed; }

.team-form { display: grid; gap: 14px; }
.team-form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px 14px; }
.team-hint { margin: 0; color: var(--hs-text-3); font-size: var(--hs-text-xs); line-height: 1.6; }
.team-text { margin: 0; color: var(--hs-text-2); font-size: var(--hs-text-sm); line-height: 1.7; }

@media (max-width: 900px) {
  .team-workspace { grid-template-columns: minmax(0, 1fr); }
  .team-departments { position: static; }
}
@media (max-width: 640px) { .team-form-grid { grid-template-columns: 1fr; } }
</style>
