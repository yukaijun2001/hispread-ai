<script setup lang="ts">
// Create or edit a role. Only permissions inside the ceiling can be granted:
// the scope's `allowedPermissions` while the scope can still be chosen (new
// roles and old custom roles without a scope), otherwise the role's own
// server-provided `allowedPermissions`. ADMIN cannot be edited here.
import { computed, ref, useId } from 'vue';
import Dialog from '../../components/ui/Dialog.vue';
import Button from '../../components/ui/Button.vue';
import Icon from '../../components/ui/Icon.vue';
import Notice from '../../components/ui/Notice.vue';
import Select from '../../components/ui/Select.vue';
import TextInput from '../../components/ui/TextInput.vue';
import FormField from '../../components/ui/FormField.vue';
import { apiPost, apiPut } from '../../lib/api';
import { t } from '../../lib/i18n';
import { PERMISSION_LABELS, permissionTree, type Role, type ScopeType } from './roles';

const props = withDefaults(defineProps<{ role: Role | 'new'; permissions: string[]; scopeTypes?: ScopeType[] }>(), { scopeTypes: () => [] });
const emit = defineEmits<{ close: []; saved: [] }>();

const isNew = props.role === 'new';
const existing = props.role === 'new' ? null : props.role;
const builtIn = existing?.builtIn === true;
const scopeMutable = !existing || !existing.scopeType;
const formId = useId();
const labels = PERMISSION_LABELS();

const available = props.permissions.filter((permission) => !permission.startsWith('workbench.monitoring.'));
const name = ref(existing?.name ?? '');
const code = ref(existing?.code ?? '');
const granted = ref<string[]>(existing ? [...existing.permissions] : []);
const scopeType = ref(existing?.scopeType || 'OPERATOR');
const saving = ref(false);
const error = ref('');

/** Upper-case identifier; spaces and symbols become underscores. */
const normalizeCode = (value: string) => value.toUpperCase().replace(/[^A-Z0-9_]+/g, '_').replace(/_+/g, '_').slice(0, 60);

const ceiling = computed(() => new Set(existing?.code === 'ADMIN' ? []
  : scopeMutable ? props.scopeTypes.find((scope) => scope.code === scopeType.value)?.allowedPermissions || []
    : existing?.allowedPermissions || []));
const scopeOptions = computed(() => (scopeMutable
  ? props.scopeTypes
  : [{ code: scopeType.value, name: props.scopeTypes.find((scope) => scope.code === scopeType.value)?.name || scopeType.value }])
  .map((scope) => ({ value: scope.code, label: scope.name || scope.code })));
const tree = computed(() => permissionTree(available));

function changeScope(value: string | string[]) {
  scopeType.value = String(value);
  granted.value = [];
}
const scopeModel = computed({ get: () => scopeType.value, set: changeScope });

function toggle(permission: string) {
  if (!ceiling.value.has(permission)) return;
  granted.value = granted.value.includes(permission) ? granted.value.filter((p) => p !== permission) : [...granted.value, permission];
}
/** Toggle every grantable permission of a group: all on, or all off when already all on. */
function toggleAll(items: string[]) {
  const allowed = items.filter((permission) => ceiling.value.has(permission));
  granted.value = allowed.every((permission) => granted.value.includes(permission))
    ? granted.value.filter((permission) => !allowed.includes(permission))
    : [...new Set([...granted.value, ...allowed])];
}
const count = (items: string[]) => items.filter((permission) => granted.value.includes(permission)).length;
const anyGrantable = (items: string[]) => items.some((permission) => ceiling.value.has(permission));

function close() { if (!saving.value) emit('close'); }

async function submit() {
  if (saving.value) return;
  if (!scopeOptions.value.some((option) => option.value === scopeType.value)) { error.value = t('请选择{0}', [t('职责范围')]); return; }
  saving.value = true;
  error.value = '';
  try {
    const body = {
      code: code.value,
      name: name.value,
      permissions: granted.value.filter((permission) => ceiling.value.has(permission)),
      scopeType: scopeType.value,
      version: existing ? existing.version : 0,
    };
    if (existing) await apiPut(`/system/roles/${existing.code}`, body);
    else await apiPost('/system/roles', body);
    emit('saved');
  } catch (reason) {
    error.value = (reason as Error).message;
  } finally {
    saving.value = false;
  }
}
</script>

<template>
  <Dialog size="xl" :title="t(isNew ? '新建角色' : builtIn ? '权限配置' : '编辑角色')" @close="close">
    <form :id="formId" class="role-form" @submit.prevent="submit">
      <div class="role-fields">
        <FormField :label="t('角色名称')">
          <template #default="{ id }"><TextInput :id="id" v-model="name" required :disabled="builtIn" /></template>
        </FormField>
        <FormField :label="t('角色标识')" :hint="isNew ? t('自动转为大写标识，空格和符号转为下划线') : undefined">
          <template #default="{ id }">
            <TextInput
              :id="id"
              :model-value="code"
              required
              :disabled="!isNew"
              pattern="[A-Z][A-Z0-9_]{2,59}"
              maxlength="60"
              :placeholder="t('如 BILLING_VIEWER')"
              @update:model-value="code = normalizeCode($event)"
            />
          </template>
        </FormField>
        <FormField :label="t('职责范围')" :hint="t('创建后职责范围固定；自定义角色只能附加给相同主身份。')">
          <template #default="{ id }">
            <Select :id="id" v-model="scopeModel" :options="scopeOptions" :label="t('职责范围')" :disabled="!scopeMutable || saving" />
          </template>
        </FormField>
      </div>

      <Notice>{{ t('职责范围：{0}。仅可勾选服务器允许的职责权限；灰色权限超出该角色上限，不能通过附加角色扩大身份或数据范围。', [scopeType]) }}</Notice>

      <div class="role-tree">
        <section v-for="section in tree" :key="section.code" class="role-section">
          <label class="role-section-title">
            <input
              type="checkbox"
              :disabled="saving || !anyGrantable(section.groups.flatMap((g) => g.items))"
              :checked="count(section.groups.flatMap((g) => g.items)) === section.groups.flatMap((g) => g.items).length"
              :indeterminate="count(section.groups.flatMap((g) => g.items)) > 0 && count(section.groups.flatMap((g) => g.items)) < section.groups.flatMap((g) => g.items).length"
              @change="toggleAll(section.groups.flatMap((g) => g.items))"
            />
            <span>{{ section.name }}</span>
            <small>{{ count(section.groups.flatMap((g) => g.items)) }}/{{ section.groups.flatMap((g) => g.items).length }}</small>
          </label>
          <div class="role-pages">
            <div v-for="group in section.groups" :key="group.code" class="role-page">
              <label class="role-page-title">
                <input
                  type="checkbox"
                  :disabled="saving || !anyGrantable(group.items)"
                  :checked="count(group.items) === group.items.length"
                  :indeterminate="count(group.items) > 0 && count(group.items) < group.items.length"
                  @change="toggleAll(group.items)"
                />
                <span class="role-page-icon"><Icon :name="group.icon" :size="15" /></span>
                <strong>{{ group.name }}</strong>
                <small>{{ count(group.items) }}/{{ group.items.length }}</small>
              </label>
              <div class="role-items">
                <label v-for="permission in group.items" :key="permission" class="role-item" :class="{ blocked: !ceiling.has(permission) }">
                  <input type="checkbox" :disabled="saving || !ceiling.has(permission)" :checked="granted.includes(permission)" @change="toggle(permission)" />
                  <span>{{ labels[permission] || permission }}<small>{{ permission }}</small></span>
                </label>
              </div>
            </div>
          </div>
        </section>
      </div>

      <Notice v-if="error" tone="danger">{{ error }}</Notice>
    </form>
    <template #footer>
      <Button :disabled="saving" @click="close">{{ t(builtIn ? '关闭' : '取消') }}</Button>
      <Button type="submit" :form="formId" variant="primary" :disabled="saving || (!isNew && existing?.code === 'ADMIN')">
        {{ t(saving ? '保存中…' : builtIn ? '保存权限' : '保存角色') }}
      </Button>
    </template>
  </Dialog>
</template>

<style scoped>
.role-form { display: grid; gap: 16px; }
.role-fields { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 14px 16px; }
.role-tree { display: grid; gap: 14px; }
.role-section { border: 1px solid var(--hs-border); border-radius: 12px; overflow: hidden; }
.role-section-title { display: flex; align-items: center; gap: 10px; padding: 10px 14px; background: var(--hs-surface-subtle); border-bottom: 1px solid var(--hs-divider); cursor: pointer; }
.role-section-title span { color: var(--hs-text); font-size: var(--hs-text-sm); font-weight: 600; }
.role-section-title small, .role-page-title small { margin-left: auto; color: var(--hs-text-3); font-size: var(--hs-text-xs); font-variant-numeric: tabular-nums; }
.role-pages { display: grid; }
.role-page { padding: 12px 14px; border-bottom: 1px solid var(--hs-divider); }
.role-page:last-child { border-bottom: 0; }
.role-page-title { display: flex; align-items: center; gap: 8px; cursor: pointer; }
.role-page-title strong { color: var(--hs-text); font-size: var(--hs-text-sm); font-weight: 500; }
.role-page-icon { display: grid; place-items: center; width: 24px; height: 24px; color: var(--hs-text-3); background: var(--hs-surface-subtle); border: 1px solid var(--hs-border); border-radius: 7px; }
.role-items { display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: 6px 16px; margin: 10px 0 0 26px; }
.role-item { display: flex; align-items: flex-start; gap: 8px; color: var(--hs-text-2); font-size: var(--hs-text-sm); line-height: 1.5; cursor: pointer; }
.role-item span { display: grid; }
.role-item small { color: var(--hs-text-4); font-family: var(--hs-font-mono); font-size: 11px; }
.role-item.blocked { color: var(--hs-text-4); cursor: not-allowed; }
.role-tree input[type='checkbox'] { width: 15px; height: 15px; margin: 2px 0 0; accent-color: var(--hs-primary); flex: none; }
@media (max-width: 760px) { .role-fields { grid-template-columns: minmax(0, 1fr); } }
</style>
