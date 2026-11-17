<script setup lang="ts">
// Change password. In forced mode (initial password) the dialog cannot be
// dismissed; the only alternative to saving is signing out. Either way the
// session ends afterwards and the user signs in again.
import { onMounted, ref } from 'vue';
import Dialog from '../../components/ui/Dialog.vue';
import Button from '../../components/ui/Button.vue';
import Notice from '../../components/ui/Notice.vue';
import FormField from '../../components/ui/FormField.vue';
import TextInput from '../../components/ui/TextInput.vue';
import { apiFetch, apiPost, logout } from '../../lib/api';
import { t } from '../../lib/i18n';

interface PasswordPolicy { passwordMinLength: number; passwordMaxLength: number; requireUpper: boolean; requireLower: boolean; requireDigit: boolean; requireSymbol: boolean }

const props = defineProps<{ forced?: boolean }>();
const emit = defineEmits<{ close: []; changed: [] }>();

const policy = ref<PasswordPolicy | null>(null);
const current = ref('');
const next = ref('');
const confirm = ref('');
const saving = ref(false);
const error = ref('');

onMounted(() => {
  apiFetch<PasswordPolicy>('/auth/password-policy').then((value) => { policy.value = value; }).catch((reason: Error) => { error.value = reason.message; });
});

const policyHint = () => {
  const p = policy.value;
  if (!p) return '';
  return `${p.passwordMinLength}—${p.passwordMaxLength}${t(' 位 ')}${p.requireUpper ? t(' · 大写字母') : ''}${p.requireLower ? t(' · 小写字母') : ''}${p.requireDigit ? t(' · 数字') : ''}${p.requireSymbol ? t(' · 符号') : ''}`;
};

async function submit() {
  if (next.value !== confirm.value) { error.value = t('两次输入的新密码不一致'); return; }
  saving.value = true;
  error.value = '';
  try {
    await apiPost('/auth/password', { currentPassword: current.value, newPassword: next.value });
    emit('changed');
  } catch (reason) {
    error.value = (reason as Error).message;
  } finally {
    saving.value = false;
  }
}

async function signOut() {
  try {
    await logout();
    emit('changed');
  } catch (reason) {
    error.value = (reason as Error).message;
  }
}

function close() { if (!props.forced && !saving.value) emit('close'); }
</script>

<template>
  <Dialog :title="forced ? t('设置新密码') : t('修改密码')" size="sm" :closable="!forced" @close="close">
    <form id="password-form" class="form" @submit.prevent="submit">
      <Notice v-if="forced">{{ t('此账号需要先修改初始密码。修改成功后请重新登录。') }}</Notice>
      <FormField :label="t('当前密码')">
        <template #default="{ id }"><TextInput :id="id" v-model="current" type="password" required autocomplete="current-password" /></template>
      </FormField>
      <FormField :label="t('新密码')" :hint="policyHint()">
        <template #default="{ id }">
          <TextInput :id="id" v-model="next" type="password" required autocomplete="new-password"
            :minlength="policy?.passwordMinLength" :maxlength="policy?.passwordMaxLength" />
        </template>
      </FormField>
      <FormField :label="t('确认新密码')">
        <template #default="{ id }"><TextInput :id="id" v-model="confirm" type="password" required autocomplete="new-password" /></template>
      </FormField>
      <Notice v-if="error" tone="danger">{{ error }}</Notice>
    </form>
    <template #footer>
      <Button v-if="forced" :disabled="saving" @click="signOut">{{ t('退出登录') }}</Button>
      <Button v-else :disabled="saving" @click="close">{{ t('取消') }}</Button>
      <Button type="submit" form="password-form" variant="primary" :loading="saving" :disabled="!policy">{{ saving ? t('保存中…') : t('保存并重新登录') }}</Button>
    </template>
  </Dialog>
</template>

<style scoped>
.form { display: grid; gap: 14px; }
</style>
