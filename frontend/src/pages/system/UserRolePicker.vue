<script setup lang="ts">
// Additional custom roles of an account: only roles of the primary role's scope
// whose permissions stay inside its ceiling are offered.
import { computed, ref } from 'vue';
import Button from '../../components/ui/Button.vue';
import Notice from '../../components/ui/Notice.vue';
import SearchInput from '../../components/ui/SearchInput.vue';
import Spinner from '../../components/ui/Spinner.vue';
import { t } from '../../lib/i18n';
import { roleLabel } from '../../lib/labels';
import { attachableRoles, type Role } from './roles';

const props = defineProps<{ roles: Role[]; primary: string; loading?: boolean; error?: string; canCreate?: boolean }>();
const emit = defineEmits<{ create: [] }>();
const selected = defineModel<string[]>({ required: true });

const query = ref('');
const candidates = computed(() => attachableRoles(props.roles, props.primary));
const visible = computed(() => candidates.value.filter((role) => `${roleLabel(role)} ${role.code}`.toLowerCase().includes(query.value.toLowerCase())));
const chosenCount = computed(() => selected.value.filter((code) => candidates.value.some((role) => role.code === code)).length);

function toggle(code: string, checked: boolean) {
  selected.value = checked ? [...selected.value, code] : selected.value.filter((value) => value !== code);
}
</script>

<template>
  <section class="role-picker" :aria-label="t('附加自定义角色')">
    <div class="role-picker-head">
      <strong>{{ t('自定义角色 · 可多选') }}</strong>
      <Button v-if="canCreate" size="sm" :disabled="loading || !!error" @click="emit('create')">{{ t('新建角色') }}</Button>
    </div>
    <p class="role-picker-hint">{{ t('仅显示与主身份同范围且不超出职责上限的自定义角色；附加角色不能改变平台身份或供应商归属。') }}</p>
    <div v-if="loading" class="role-picker-state"><Spinner :size="16" /></div>
    <Notice v-else-if="error" tone="danger">{{ t('角色加载失败：') }}{{ error }}</Notice>
    <p v-else-if="!candidates.length" class="role-picker-hint">{{ t('暂无自定义角色，可先新建角色并配置权限。') }}</p>
    <template v-else>
      <SearchInput v-model="query" :placeholder="t('搜索自定义角色名称或标识')" :label="t('搜索自定义角色名称或标识')" />
      <div class="role-picker-options">
        <label v-for="role in visible" :key="role.code" class="role-picker-option" :class="{ on: selected.includes(role.code) }">
          <input type="checkbox" :checked="selected.includes(role.code)" @change="toggle(role.code, ($event.target as HTMLInputElement).checked)" />
          <span>
            <strong>{{ roleLabel(role) }}</strong>
            <small>{{ role.code }} · {{ role.permissions.length }}{{ t(' 项权限') }}</small>
          </span>
        </label>
      </div>
      <p v-if="!visible.length" class="role-picker-hint">{{ t('没有匹配的自定义角色') }}</p>
      <small class="role-picker-count">{{ t('已选') }} {{ chosenCount }} {{ t('个自定义角色') }}</small>
    </template>
  </section>
</template>

<style scoped>
.role-picker { display: grid; gap: 10px; padding: 14px; background: var(--hs-surface-subtle); border: 1px solid var(--hs-border); border-radius: 12px; }
.role-picker-head { display: flex; align-items: center; justify-content: space-between; gap: 12px; }
.role-picker-head strong { color: var(--hs-text); font-size: var(--hs-text-sm); font-weight: 600; }
.role-picker-hint { margin: 0; color: var(--hs-text-3); font-size: var(--hs-text-xs); line-height: 1.6; }
.role-picker-state { display: grid; place-items: center; padding: 16px; color: var(--hs-text-3); }
.role-picker-options { display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 8px; max-height: 240px; overflow-y: auto; }
.role-picker-option { display: flex; align-items: flex-start; gap: 8px; padding: 8px 10px; background: var(--hs-surface); border: 1px solid var(--hs-border); border-radius: 10px; cursor: pointer; }
.role-picker-option.on { border-color: var(--hs-accent); box-shadow: var(--hs-accent-ring); }
.role-picker-option input { width: 15px; height: 15px; margin: 2px 0 0; accent-color: var(--hs-primary); flex: none; }
.role-picker-option span { display: grid; gap: 2px; min-width: 0; }
.role-picker-option strong { color: var(--hs-text); font-size: var(--hs-text-sm); font-weight: 500; overflow-wrap: anywhere; }
.role-picker-option small { color: var(--hs-text-3); font-family: var(--hs-font-mono); font-size: 11px; }
.role-picker-count { color: var(--hs-text-3); font-size: var(--hs-text-xs); }
</style>
