<script setup lang="ts">
// Department editor: create / edit, set the admin (`adminOnly`), assign members
// (`membersOnly`) or delete (`removing`). Saving sends the version of every
// other department that loses members (`sourceVersions`) so concurrent edits fail.
import { computed, ref } from 'vue';
import Dialog from '../../components/ui/Dialog.vue';
import Button from '../../components/ui/Button.vue';
import Notice from '../../components/ui/Notice.vue';
import FormField from '../../components/ui/FormField.vue';
import TextInput from '../../components/ui/TextInput.vue';
import SearchInput from '../../components/ui/SearchInput.vue';
import Select from '../../components/ui/Select.vue';
import { apiPost, apiPut } from '../../lib/api';
import { t } from '../../lib/i18n';
import { useSessionStore } from '../../stores/session';
import { agentIdentity, groupByMember, type SupplierAgent, type TeamGroup } from './team';

const props = withDefaults(defineProps<{
  agents: SupplierAgent[];
  groups: TeamGroup[];
  group: TeamGroup | 'new';
  removing?: boolean;
  adminOnly?: boolean;
  membersOnly?: boolean;
}>(), { removing: false, adminOnly: false, membersOnly: false });
const emit = defineEmits<{ close: []; saved: [] }>();
const session = useSessionStore();

const existing = props.group === 'new' ? null : props.group;
const groupId = existing?.id ?? '';
const name = ref(existing?.name ?? '');
const adminId = ref(existing?.adminUserId || '');
const memberIds = ref<string[]>(existing ? existing.memberIds : []);
const search = ref('');
const placement = ref<'' | 'INSIDE' | 'OUTSIDE'>(props.membersOnly ? 'OUTSIDE' : '');
const others = props.groups.filter((group) => existing && group.id !== existing.id);
const target = ref(others.find((group) => group.name === '交付组1')?.id || others[0]?.id || '');
const saving = ref(false);
const error = ref('');

const memberGroup = computed(() => groupByMember(props.groups));
// Admin candidates: (for adminOnly) members of this group, excluding admins of other groups.
const candidates = computed(() => props.agents.filter((agent) => (!props.adminOnly || (!!existing && existing.memberIds.includes(agent.id)))
  && (!memberGroup.value.has(agent.id) || memberGroup.value.get(agent.id)?.id === groupId || memberGroup.value.get(agent.id)?.adminUserId !== agent.id)));
const listed = computed(() => {
  const term = search.value.trim().toLocaleLowerCase();
  return props.agents.filter((agent) => {
    const inside = memberGroup.value.get(agent.id)?.id === groupId;
    return (!placement.value || (placement.value === 'INSIDE' ? inside : !inside)) && `${agent.displayName} ${agent.username}`.toLocaleLowerCase().includes(term);
  });
});
const selectedCount = computed(() => new Set([...memberIds.value, ...(adminId.value ? [adminId.value] : [])]).size);
const adminRequired = props.adminOnly || !existing || !!existing.adminUserId;
const adminValid = computed(() => candidates.value.some((agent) => agent.id === adminId.value && agent.enabled));

const title = computed(() => {
  if (props.removing) return t('删除部门');
  if (props.membersOnly) return t('分配成员');
  if (props.adminOnly) return existing?.adminUserId ? t('更换管理员') : t('设置管理员');
  return existing ? t('编辑部门') : t('新增部门');
});
const adminOptions = computed(() => [
  { value: '', label: t('请选择管理员') },
  ...candidates.value.filter((agent) => agent.enabled).map((agent) => ({ value: agent.id, label: agentIdentity(agent) })),
]);
const targetOptions = computed(() => [{ value: '', label: t('请选择目标部门') }, ...props.groups.filter((group) => group.id !== groupId).map((group) => ({ value: group.id, label: group.name }))]);
const placementOptions = [{ value: '' as const, label: t('全部成员') }, { value: 'INSIDE' as const, label: t('已在本组') }, { value: 'OUTSIDE' as const, label: t('未在本组') }];
const submitDisabled = computed(() => saving.value
  || (props.removing && !!existing && existing.memberIds.length > 0 && !target.value)
  || (!props.removing && (!name.value.trim() || (adminRequired && !adminValid.value))));

function chooseAdmin(value: string) {
  adminId.value = value;
  if (value) memberIds.value = [...new Set([...memberIds.value, value])];
}
function toggle(id: string, checked: boolean) {
  memberIds.value = checked ? [...memberIds.value, id] : memberIds.value.filter((value) => value !== id);
}
function memberNote(agent: SupplierAgent) {
  const group = memberGroup.value.get(agent.id);
  const elsewhere = !!group && group.id !== groupId;
  if (elsewhere && group!.adminUserId === agent.id) return t('请先更换原部门管理员');
  if (agent.id === adminId.value) return t('部门管理员');
  if (group?.id === groupId) return t('已在本组');
  if (elsewhere) return t('来自部门：{0}', [group!.name]);
  return agent.enabled ? '' : t('已停用');
}
const lockedAdmin = (agent: SupplierAgent) => {
  const group = memberGroup.value.get(agent.id);
  return !!group && group.id !== groupId && group.adminUserId === agent.id;
};

async function submit() {
  if (saving.value) return;
  saving.value = true;
  error.value = '';
  try {
    if (props.removing && existing) {
      await apiPost(`/supplier-team-groups/${encodeURIComponent(existing.id)}/remove`, {
        version: existing.version,
        targetGroupId: target.value || null,
        targetVersion: props.groups.find((group) => group.id === target.value)?.version,
      });
      session.notify(t('部门已删除'));
    } else {
      const members = [...new Set([...memberIds.value, ...(adminId.value ? [adminId.value] : [])])];
      const body = {
        name: name.value.trim(),
        adminUserId: adminId.value || null,
        memberIds: members,
        version: existing ? existing.version : null,
        sourceVersions: Object.fromEntries(props.groups
          .filter((group) => group.id !== groupId && group.memberIds.some((id) => members.includes(id)))
          .map((group) => [group.id, group.version])),
      };
      if (existing) await apiPut(`/supplier-team-groups/${encodeURIComponent(existing.id)}`, body);
      else await apiPost('/supplier-team-groups', body);
      session.notify(props.adminOnly ? t('管理员已保存') : props.membersOnly ? t('成员分配已保存') : t('部门已保存'));
    }
    emit('saved');
    emit('close');
  } catch (reason) {
    error.value = (reason as Error).message;
  } finally {
    saving.value = false;
  }
}
</script>

<template>
  <Dialog :title="title" :size="removing || adminOnly ? 'md' : 'lg'" @close="!saving && emit('close')">
    <div class="dept-body">
      <template v-if="removing">
        <p class="dept-text">{{ t('删除部门“{0}”后，成员将转入目标部门，原管理员权限随即收回。', [name]) }}</p>
        <FormField v-if="existing && existing.memberIds.length > 0" :label="t('成员转入部门')">
          <template #default="{ id }">
            <Select :id="id" v-model="target" :options="targetOptions" :label="t('成员转入部门')" :placeholder="t('请选择目标部门')" :disabled="saving" />
          </template>
        </FormField>
        <Notice v-if="existing && existing.memberIds.length > 0 && !groups.some((group) => group.id !== groupId)">{{ t('至少保留一个部门，请先新增部门并转移成员') }}</Notice>
      </template>
      <template v-else>
        <p v-if="adminOnly || membersOnly" class="dept-text">{{ t('当前小组：{0}', [name]) }}</p>
        <div v-if="!membersOnly" class="dept-grid" :class="{ single: adminOnly }">
          <FormField v-if="!adminOnly" :label="t('部门名称')">
            <template #default="{ id }">
              <TextInput :id="id" v-model="name" maxlength="100" :disabled="saving" :placeholder="t('如：交付组2')" />
            </template>
          </FormField>
          <FormField :label="t('部门管理员')">
            <template #default="{ id }">
              <Select :id="id" :model-value="adminId" :options="adminOptions" :label="t('部门管理员')" :placeholder="t('请选择管理员')" searchable :disabled="saving"
                @update:model-value="chooseAdmin(String($event))" />
            </template>
          </FormField>
        </div>
        <p class="dept-help">
          <template v-if="adminOnly">{{ t('请选择本组已启用成员作为管理员，可查看日账、创建组员并分配已有项目。') }}</template>
          <template v-else>
            {{ t('每名成员必须归属一个部门。管理员可管理本组成员及已有项目权限。') }}
            {{ t('勾选其他部门成员后，保存时会将其调入本部门。原部门管理员需先更换管理员。') }}
            <template v-if="existing && !existing.adminUserId"> {{ t('历史成员已初始化分组，请指定部门管理员。') }}</template>
          </template>
        </p>
        <Notice v-if="adminOnly && !candidates.some((agent) => agent.enabled)">{{ t('请先在编辑部门中加入已启用成员，再设置管理员。') }}</Notice>
        <template v-if="!adminOnly">
          <div class="dept-member-head">
            <strong>{{ t('部门成员') }} <span>{{ t('已选 {0} 人', [selectedCount]) }}</span></strong>
            <div class="dept-member-tools">
              <div class="dept-placement"><Select v-model="placement" :options="placementOptions" :label="t('成员分组筛选')" size="sm" /></div>
              <SearchInput v-model="search" class="dept-search" :placeholder="t('搜索成员姓名或登录账号')" :label="t('搜索成员姓名或登录账号')" />
            </div>
          </div>
          <div class="dept-members" role="group" :aria-label="t('部门成员')">
            <template v-if="listed.length">
              <label v-for="agent in listed" :key="agent.id" class="dept-member" :class="{ 'is-off': lockedAdmin(agent) }">
                <input
                  type="checkbox"
                  :aria-label="agentIdentity(agent)"
                  :disabled="saving || lockedAdmin(agent) || agent.id === adminId || memberGroup.get(agent.id)?.id === groupId && !!groupId"
                  :checked="memberIds.includes(agent.id) || agent.id === adminId"
                  @change="toggle(agent.id, ($event.target as HTMLInputElement).checked)"
                >
                <span class="dept-member-identity"><strong>{{ agent.displayName }}</strong><small>{{ agent.username }}</small></span>
                <span class="dept-member-role">{{ memberNote(agent) }}</span>
              </label>
            </template>
            <p v-else class="dept-empty">{{ t('没有匹配的成员') }}</p>
          </div>
        </template>
      </template>
      <Notice v-if="error" tone="danger">{{ error }}</Notice>
    </div>
    <template #footer>
      <Button :disabled="saving" @click="emit('close')">{{ t('取消') }}</Button>
      <Button :variant="removing ? 'danger' : 'primary'" :loading="saving" :disabled="submitDisabled" @click="submit">
        {{ saving ? t('保存中…') : removing ? t('确认删除') : t('保存') }}
      </Button>
    </template>
  </Dialog>
</template>

<style scoped>
.dept-body { display: grid; gap: 14px; }
.dept-text { margin: 0; color: var(--hs-text-2); font-size: var(--hs-text-sm); line-height: 1.7; }
.dept-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
.dept-grid.single { grid-template-columns: 1fr; }
.dept-help { margin: 0; color: var(--hs-text-3); font-size: var(--hs-text-xs); line-height: 1.7; }
.dept-member-head { display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: 8px; }
.dept-member-head strong { color: var(--hs-text); font-size: var(--hs-text-sm); font-weight: 600; }
.dept-member-head strong span { margin-left: 6px; color: var(--hs-text-3); font-size: var(--hs-text-xs); font-weight: 400; }
.dept-member-tools { display: flex; flex-wrap: wrap; gap: 8px; }
.dept-placement { width: 132px; }
.dept-search { width: 220px; }
.dept-members { display: grid; gap: 6px; max-height: 44vh; overflow: auto; padding: 2px; }
.dept-member { display: flex; align-items: center; gap: 10px; padding: 9px 12px; border: 1px solid var(--hs-border); border-radius: var(--hs-radius-control); cursor: pointer; }
.dept-member.is-off { color: var(--hs-text-4); cursor: not-allowed; }
.dept-member input { accent-color: var(--hs-accent); }
.dept-member-identity { display: grid; flex: 1; min-width: 0; }
.dept-member-identity strong { color: var(--hs-text); font-size: var(--hs-text-sm); font-weight: 500; }
.dept-member-identity small { color: var(--hs-text-3); font-size: var(--hs-text-xs); }
.dept-member-role { flex: none; color: var(--hs-text-3); font-size: var(--hs-text-xs); }
.dept-empty { margin: 0; padding: 20px; color: var(--hs-text-3); font-size: var(--hs-text-sm); text-align: center; }
@media (max-width: 640px) { .dept-grid { grid-template-columns: 1fr; } }
</style>
