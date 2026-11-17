<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import FormDialog from './components/FormDialog.vue';
import FormField from '../../components/ui/FormField.vue';
import TextInput from '../../components/ui/TextInput.vue';
import SettingSwitch from './components/SettingSwitch.vue';
import { apiPost, apiPut } from '../../lib/api';
import { t } from '../../lib/i18n';

export interface ResourceTargetInput {
  id: string;
  name: string;
  protocol?: string;
  baseUrl?: string;
  enabled?: boolean;
  defaultTarget?: boolean;
  version: number;
  adminUsername?: string;
  adminPasswordConfigured?: boolean;
  apiKeyConfigured?: boolean;
  newApiUserId?: string | number;
  allowHttp?: boolean;
}

const props = defineProps<{ target: ResourceTargetInput | 'new' }>();
const emit = defineEmits<{ close: []; saved: [] }>();
const saved = props.target === 'new' ? null : props.target;
const isNew = saved === null;
const name = ref(saved?.name ?? '');
const baseUrl = ref(saved?.baseUrl ?? '');
const protocol = ref(saved?.protocol ?? 'CCMAX_NATIVE');
const username = ref(saved?.adminUsername ?? '');
const password = ref('');
const saving = ref(false);
const apiKey = ref('');
const userId = ref(String(saved?.newApiUserId ?? ''));
const allowHttp = ref(!!saved?.allowHttp);
const enabled = ref(saved ? !!saved.enabled : true);
const defaultTarget = ref(!!saved?.defaultTarget);
const native = computed(() => protocol.value === 'CCMAX_NATIVE');
const httpAddress = computed(() => baseUrl.value.trim().toLowerCase().startsWith('http://'));
const passwordRequired = isNew || !saved?.adminPasswordConfigured;
const tokenRequired = isNew || !saved?.apiKeyConfigured;
const protocols = ['CCMAX_NATIVE', 'NEWAPI'] as const;

watch(baseUrl, () => { allowHttp.value = false; });

function protocolLabel(value: string) {
  return ({ NEWAPI: 'New API', CCMAX_NATIVE: 'CCMAX', CUSTOM: t('兼容接入（已有配置）') } as Record<string, string>)[value] || value;
}

async function save() {
  saving.value = true;
  try {
  const input = {
    name: name.value.trim(),
    baseUrl: baseUrl.value.trim(),
    protocol: protocol.value,
    enabled: enabled.value,
    defaultTarget: defaultTarget.value,
    allowHttp: allowHttp.value && httpAddress.value,
    ...(native.value
      ? { adminUsername: username.value.trim(), ...(password.value ? { adminPassword: password.value } : {}) }
      : { ...(protocol.value === 'NEWAPI' ? { newApiUserId: userId.value.trim() } : {}), ...(apiKey.value.trim() ? { apiKey: apiKey.value.trim() } : {}) }),
    ...(!isNew && saved ? { version: saved.version } : {}),
  };
  if (isNew) await apiPost('/resource-targets', input);
  else if (saved) await apiPut(`/resource-targets/${encodeURIComponent(saved.id)}`, input);
  emit('saved');
  } finally {
    saving.value = false;
  }
}
</script>

<template>
  <FormDialog :title="isNew ? t('新增资源接入') : t('编辑资源接入')" :submit-label="t('保存配置')" :on-submit="save" @close="emit('close')">
    <p class="hint">{{ t('标有 * 的项目为必填。') }}</p>
    <FormField :label="t('接入名称')" required>
      <template #default="field"><TextInput :id="field.id" v-model="name" required maxlength="128" :disabled="saving" /></template>
    </FormField>
    <FormField :label="t('服务地址')" required>
      <template #default="field"><TextInput :id="field.id" v-model="baseUrl" required type="url" placeholder="https://example.com" spellcheck="false" autocapitalize="none" :disabled="saving" /></template>
    </FormField>
    <fieldset v-if="isNew" class="types" :disabled="saving">
      <legend>{{ t('接入类型') }} *</legend>
      <label v-for="value in protocols" :key="value"><input v-model="protocol" type="radio" name="protocol" :value="value" required /> {{ protocolLabel(value) }}</label>
    </fieldset>
    <p v-else class="hint">{{ t('接入类型') }}：{{ protocolLabel(protocol) }}</p>
    <template v-if="native">
      <FormField :label="t('CCMAX 管理员账号')" required>
        <template #default="field"><TextInput :id="field.id" v-model="username" required maxlength="160" autocomplete="off" autocapitalize="none" spellcheck="false" :disabled="saving" /></template>
      </FormField>
      <FormField :label="t('CCMAX 管理员密码')" :required="passwordRequired" :hint="passwordRequired ? t('保存后不回显。') : t('留空保留已有密码。')">
        <template #default="field"><TextInput :id="field.id" v-model="password" :required="passwordRequired" type="password" autocomplete="new-password" maxlength="512" :disabled="saving" /></template>
      </FormField>
    </template>
    <template v-else>
      <FormField v-if="protocol === 'NEWAPI'" :label="t('New API 管理员用户 ID')" required>
        <template #default="field"><TextInput :id="field.id" v-model="userId" required inputmode="numeric" pattern="[1-9][0-9]{0,18}" :disabled="saving" /></template>
      </FormField>
      <FormField :label="t('管理令牌')" :required="tokenRequired" :hint="tokenRequired ? t('保存后不回显。') : t('留空保留已有令牌。')">
        <template #default="field"><TextInput :id="field.id" v-model="apiKey" :required="tokenRequired" type="password" autocomplete="new-password" :disabled="saving" /></template>
      </FormField>
    </template>
    <SettingSwitch v-if="httpAddress" v-model="allowHttp" name="allowHttp" :disabled="saving" :label="t('允许此 HTTP 地址')" :hint="t('仅批准当前地址，管理凭据会通过 HTTP 传输。')" />
    <SettingSwitch v-model="defaultTarget" name="defaultTarget" :disabled="saving" :label="t('默认接入')" :hint="t('多个接入启用时，只选择一个作为默认接入。')" />
    <SettingSwitch v-model="enabled" name="enabled" :disabled="saving" :label="t('启用接入')" />
  </FormDialog>
</template>

<style scoped>
.hint { margin: 0; color: var(--hs-text-3); font-size: var(--hs-text-sm); line-height: 1.7; }
.types { display: flex; flex-wrap: wrap; gap: 8px 16px; margin: 0; padding: 0; border: 0; }
.types legend { width: 100%; margin-bottom: 4px; color: var(--hs-text-2); font-size: var(--hs-text-xs); font-weight: 500; }
.types label { display: inline-flex; align-items: center; gap: 6px; color: var(--hs-text); font-size: var(--hs-text-sm); }
</style>
