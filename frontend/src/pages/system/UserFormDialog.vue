<script setup lang="ts">
// Create an account, or change an account's primary role, status and
// additional roles. Supplier accounts keep their primary role; platform
// accounts can only move between platform roles. Additional roles are filtered
// again on submit so only ones the server accepts for the primary role are sent.
import { computed, ref } from 'vue';
import FormField from '../../components/ui/FormField.vue';
import Select from '../../components/ui/Select.vue';
import TextInput from '../../components/ui/TextInput.vue';
import FormDialog from './components/FormDialog.vue';
import UserRolePicker from './UserRolePicker.vue';
import { apiPost, apiPut } from '../../lib/api';
import { t } from '../../lib/i18n';
import { roleLabel } from '../../lib/labels';
import { useSessionStore } from '../../stores/session';
import type { SupplierSummary } from '../../composables/useSupplierDirectory';
import { PRIMARY_ROLES, SUPPLIER_ROLES, submittableRoleCodes, type RoleCatalog } from './roles';
import type { Credential, UserRow } from './users';

const props = defineProps<{
  user: UserRow | 'new';
  catalog: RoleCatalog | null;
  catalogLoading: boolean;
  catalogError: string;
  suppliers: SupplierSummary[];
  canCreateRole: boolean;
}>();
const emit = defineEmits<{ close: []; created: [credential: Credential]; 'create-role': [] }>();
const session = useSessionStore();

const existing = props.user === 'new' ? null : props.user;
const displayName = ref('');
const username = ref('');
const password = ref('');
const roleCode = ref(existing ? existing.roleCode : 'SUPPLIER');
const supplierId = ref('');
const enabled = ref(existing ? String(existing.enabled) : '');
const additional = ref<string[]>(existing ? (existing.additionalRoles ?? []).map((role) => role.code) : []);

const roles = computed(() => props.catalog?.roles ?? []);
const supplierRole = computed(() => SUPPLIER_ROLES.includes(roleCode.value));
const roleOptions = computed(() => roles.value
  .filter((role) => role.builtIn && PRIMARY_ROLES.includes(role.code) && (!existing
    || (SUPPLIER_ROLES.includes(existing.roleCode) ? role.code === existing.roleCode : !SUPPLIER_ROLES.includes(role.code))))
  .map((role) => ({ value: role.code, label: roleLabel(role) })));
const supplierOptions = computed(() => props.suppliers.map((supplier) => ({ value: supplier.id, label: supplier.name })));
const statusOptions = [{ value: 'true', label: t('启用') }, { value: 'false', label: t('停用') }];

/** Required selects, checked in field order like the native required inputs. */
function validate() {
  if (!roleCode.value) return t('请选择{0}', [t('基础角色')]);
  if (existing && !enabled.value) return t('请选择{0}', [t('状态')]);
  return '';
}

async function submit() {
  const additionalRoleCodes = submittableRoleCodes(roles.value, roleCode.value, additional.value);
  if (existing) {
    await apiPut('/system/users/' + existing.id, { roleCode: roleCode.value, enabled: enabled.value === 'true', version: existing.version, additionalRoleCodes });
    session.refresh();
    session.notify(t('账号设置已保存'));
    return;
  }
  const result = await apiPost<Credential>('/system/users', {
    displayName: displayName.value,
    username: username.value,
    password: password.value || null,
    roleCode: roleCode.value,
    supplierId: (supplierRole.value && supplierId.value) || null,
    additionalRoleCodes,
  });
  emit('created', { ...result, username: username.value });
  session.refresh();
  session.notify(t('账号已创建'));
}
</script>

<template>
  <FormDialog
    :title="existing ? t('编辑账号 · {0}', [existing.displayName]) : t('创建账号')"
    size="lg"
    :validate="validate"
    :on-submit="submit"
    @close="emit('close')"
  >
    <template #default="{ busy }">
      <div class="user-grid">
        <template v-if="!existing">
          <FormField :label="t('显示名称')" required>
            <template #default="{ id }"><TextInput :id="id" v-model="displayName" required autocomplete="off" :disabled="busy" /></template>
          </FormField>
          <FormField :label="t('登录账号')" required>
            <template #default="{ id }"><TextInput :id="id" v-model="username" required autocomplete="off" :disabled="busy" /></template>
          </FormField>
          <FormField class="full" :label="t('初始密码')">
            <template #default="{ id }">
              <TextInput :id="id" v-model="password" type="password" autocomplete="new-password" :placeholder="t('留空则按系统参数随机生成')" :disabled="busy" />
            </template>
          </FormField>
        </template>
        <FormField :class="{ full: !!existing }" :label="t('基础角色')" required>
          <template #default="{ id }">
            <Select :id="id" v-model="roleCode" :options="roleOptions" :label="t('基础角色')" :placeholder="t('请选择')" icon="shield" :disabled="busy" />
          </template>
        </FormField>
        <FormField v-if="!existing && supplierRole" :label="t('所属供应商')" :hint="t('可先创建用户，在新建供应商时关联；关联前不能登录')">
          <template #default="{ id }">
            <Select :id="id" v-model="supplierId" :options="[{ value: '', label: t('请选择') }, ...supplierOptions]" :label="t('所属供应商')"
              :placeholder="t('请选择')" icon="users" searchable :disabled="busy" />
          </template>
        </FormField>
        <FormField v-if="existing" :label="t('状态')" required>
          <template #default="{ id }">
            <Select :id="id" v-model="enabled" :options="statusOptions" :label="t('状态')" :placeholder="t('请选择')" :disabled="busy" />
          </template>
        </FormField>
      </div>
      <UserRolePicker
        v-model="additional"
        :roles="roles"
        :primary="roleCode"
        :loading="catalogLoading"
        :error="catalogError"
        :can-create="canCreateRole"
        @create="emit('create-role')"
      />
    </template>
  </FormDialog>
</template>

<style scoped>
.user-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 14px 16px; }
.user-grid .full { grid-column: 1 / -1; }
@media (max-width: 640px) { .user-grid { grid-template-columns: minmax(0, 1fr); } }
</style>
