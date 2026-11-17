<script setup lang="ts">
// Personal profile (display name, email, phone) and the account's own API keys.
import { onMounted, ref } from 'vue';
import Dialog from '../../components/ui/Dialog.vue';
import Button from '../../components/ui/Button.vue';
import Notice from '../../components/ui/Notice.vue';
import Tabs from '../../components/ui/Tabs.vue';
import FormField from '../../components/ui/FormField.vue';
import TextInput from '../../components/ui/TextInput.vue';
import DetailList from '../../components/ui/DetailList.vue';
import Spinner from '../../components/ui/Spinner.vue';
import ApiTokensPanel from '../../pages/system/components/ApiTokensPanel.vue';
import { apiFetch, apiPut } from '../../lib/api';
import { t } from '../../lib/i18n';

interface Profile { username: string; displayName: string; personalEmail: string; personalPhone: string; version: number }

const props = withDefaults(defineProps<{ initialTab?: 'profile' | 'tokens' }>(), { initialTab: 'profile' });
const emit = defineEmits<{ close: []; saved: [profile: Profile] }>();

const tab = ref<'profile' | 'tokens'>(props.initialTab);
const profile = ref<Profile | null>(null);
const displayName = ref('');
const email = ref('');
const phone = ref('');
const loading = ref(true);
const saving = ref(false);
const error = ref('');

onMounted(async () => {
  try {
    const value = await apiFetch<Profile>('/auth/profile');
    profile.value = value;
    displayName.value = value.displayName;
    email.value = value.personalEmail;
    phone.value = value.personalPhone;
  } catch (reason) {
    error.value = (reason as Error).message;
  } finally {
    loading.value = false;
  }
});

async function save() {
  if (!profile.value || saving.value) return;
  saving.value = true;
  error.value = '';
  try {
    emit('saved', await apiPut<Profile>('/auth/profile', {
      displayName: displayName.value.trim(),
      personalEmail: email.value.trim(),
      personalPhone: phone.value.trim(),
      version: profile.value.version,
    }));
  } catch (reason) {
    error.value = (reason as Error).message;
  } finally {
    saving.value = false;
  }
}

function close() { if (!saving.value) emit('close'); }
const tabs = [{ id: 'profile' as const, label: t('基本资料') }, { id: 'tokens' as const, label: t('API 密钥') }];
</script>

<template>
  <Dialog :title="t('个人资料')" size="lg" @close="close">
    <Tabs v-model="tab" :items="tabs" :label="t('个人资料')" />
    <div class="body">
      <ApiTokensPanel v-if="tab === 'tokens'" />
      <div v-else-if="loading" class="loading"><Spinner :size="16" /></div>
      <form v-else-if="profile" id="profile-form" class="form" @submit.prevent="save">
        <DetailList :items="[[t('登录账号'), profile.username]]" :columns="1" />
        <FormField :label="t('姓名 / 显示名称')">
          <template #default="{ id }"><TextInput :id="id" v-model="displayName" required maxlength="100" /></template>
        </FormField>
        <div class="pair">
          <FormField :label="t('个人邮箱')">
            <template #default="{ id }"><TextInput :id="id" v-model="email" type="email" maxlength="160" /></template>
          </FormField>
          <FormField :label="t('个人电话')">
            <template #default="{ id }"><TextInput :id="id" v-model="phone" type="tel" maxlength="60" /></template>
          </FormField>
        </div>
        <Notice v-if="error" tone="danger">{{ error }}</Notice>
      </form>
      <Notice v-else tone="danger">{{ t('个人信息加载失败：') }}{{ error }}</Notice>
    </div>
    <template v-if="tab === 'profile' && profile" #footer>
      <Button :disabled="saving" @click="close">{{ t('取消') }}</Button>
      <Button type="submit" form="profile-form" variant="primary" :loading="saving">{{ saving ? t('保存中…') : t('保存') }}</Button>
    </template>
  </Dialog>
</template>

<style scoped>
.body { margin-top: 16px; }
.loading { display: grid; place-items: center; padding: 28px; color: var(--hs-text-3); }
.form { display: grid; gap: 14px; }
.pair { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
@media (max-width: 560px) { .pair { grid-template-columns: 1fr; } }
</style>
