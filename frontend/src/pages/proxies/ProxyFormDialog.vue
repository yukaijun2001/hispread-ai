<script setup lang="ts">
// Create or configure one proxy. The URL is write-only: it is never echoed, and
// leaving it blank when editing keeps the stored address.
import { computed, ref } from 'vue';
import Dialog from '../../components/ui/Dialog.vue';
import Button from '../../components/ui/Button.vue';
import Notice from '../../components/ui/Notice.vue';
import FormField from '../../components/ui/FormField.vue';
import TextInput from '../../components/ui/TextInput.vue';
import Select from '../../components/ui/Select.vue';
import { apiPost, apiPut } from '../../lib/api';
import { t } from '../../lib/i18n';
import { isValidProxyUrl } from '../../lib/labels';
import { useSessionStore } from '../../stores/session';
import type { OutboundProxy } from './proxies';

const props = defineProps<{ proxy: OutboundProxy | 'new' }>();
const emit = defineEmits<{ close: [] }>();
const session = useSessionStore();

// The dialog is mounted per proxy, so the target is read once.
const existing: OutboundProxy | null = props.proxy === 'new' ? null : props.proxy;
const isNew = computed(() => !existing);
const name = ref(existing?.name ?? '');
const url = ref('');
const maxResources = ref(existing ? String(existing.maxResources) : '');
const enabled = ref<'true' | 'false'>(!existing || existing.enabled ? 'true' : 'false');
const saving = ref(false);
const error = ref('');
const urlHint = t('支持 SOCKS5、HTTP、HTTPS，用于 CCMAX 交付。认证信息加密保存，不回显。 已有资源绑定时不可修改地址。');
const urlPlaceholder = existing ? t('留空表示保持原地址') : 'socks5://user:pass@host:1080';
const stateOptions = [{ value: 'true' as const, label: t('启用') }, { value: 'false' as const, label: t('停用') }];

function close() { if (!saving.value) emit('close'); }

async function save() {
  const limit = maxResources.value;
  if (!name.value.trim() || (limit === '' && !isNew.value) || (limit !== '' && (!Number.isSafeInteger(Number(limit)) || Number(limit) < 0))) {
    error.value = t('请填写代理名称和有效的绑定上限');
    return;
  }
  if (isNew.value && !isValidProxyUrl(url.value.trim())) { error.value = t('请填写有效的代理 URL'); return; }
  if (url.value.trim() && !isValidProxyUrl(url.value.trim())) { error.value = t('代理地址格式不正确'); return; }
  saving.value = true;
  error.value = '';
  try {
    const body = { name: name.value.trim(), url: url.value.trim(), maxResources: limit === '' ? null : Number(limit), enabled: enabled.value === 'true' };
    if (existing) await apiPut(`/outbound-proxies/${encodeURIComponent(existing.id)}`, { ...body, version: existing.version });
    else await apiPost('/outbound-proxies', body);
    session.notify(t('代理配置已保存'));
    emit('close');
    session.refresh();
  } catch (reason) {
    error.value = (reason as Error).message;
  } finally {
    saving.value = false;
  }
}
</script>

<template>
  <Dialog :title="isNew ? t('新增代理') : t('配置代理')" :subtitle="existing?.endpoint" @close="close">
    <form class="form" @submit.prevent="save">
      <FormField :label="t('名称')">
        <template #default="{ id }"><TextInput :id="id" v-model="name" maxlength="128" :disabled="saving" /></template>
      </FormField>
      <FormField :label="t('代理 URL')" :hint="urlHint">
        <template #default="{ id }">
          <TextInput :id="id" v-model="url" type="password" autocomplete="new-password" :disabled="saving" :placeholder="urlPlaceholder" />
        </template>
      </FormField>
      <FormField :label="t('最多绑定资源数')" :hint="(isNew ? t('留空使用平台默认值。') : '') + t('0 表示不限；每条已交付资源占一个名额。')">
        <template #default="{ id }">
          <TextInput :id="id" v-model="maxResources" type="number" min="0" step="1" :disabled="saving" :placeholder="isNew ? t('使用平台默认值') : undefined" />
        </template>
      </FormField>
      <FormField :label="t('状态')">
        <template #default="{ id }"><Select :id="id" v-model="enabled" :options="stateOptions" :label="t('状态')" :disabled="saving" /></template>
      </FormField>
      <Notice v-if="error" tone="danger">{{ error }}</Notice>
    </form>
    <template #footer>
      <Button :disabled="saving" @click="close">{{ t('取消') }}</Button>
      <Button variant="primary" :loading="saving" @click="save">{{ saving ? t('保存中…') : t('保存') }}</Button>
    </template>
  </Dialog>
</template>

<style scoped>
.form { display: grid; gap: 14px; }
</style>
