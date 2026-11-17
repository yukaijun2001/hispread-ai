<script setup lang="ts">
// Paste up to 500 proxies, one per line. Short forms (host:port[:user:pass])
// use the chosen default protocol; invalid lines are skipped and reported.
import { ref } from 'vue';
import Dialog from '../../components/ui/Dialog.vue';
import Button from '../../components/ui/Button.vue';
import Notice from '../../components/ui/Notice.vue';
import FormField from '../../components/ui/FormField.vue';
import TextInput from '../../components/ui/TextInput.vue';
import Select from '../../components/ui/Select.vue';
import { apiPost } from '../../lib/api';
import { t } from '../../lib/i18n';
import { useSessionStore } from '../../stores/session';
import { importSummary } from './proxies';

const emit = defineEmits<{ close: []; imported: [summary: string] }>();
const session = useSessionStore();

const lines = ref('');
const protocol = ref<'SOCKS5' | 'HTTP' | 'HTTPS'>('SOCKS5');
const maxResources = ref('');
const importing = ref(false);
const error = ref('');
const protocolOptions = (['SOCKS5', 'HTTP', 'HTTPS'] as const).map((value) => ({ value, label: value }));
const placeholder = 'socks5://user:pass@host:1080\nhost:1080\nhost:1080:user:pass';

function close() { if (!importing.value) emit('close'); }

async function submit() {
  if (importing.value || !lines.value.trim()) return;
  importing.value = true;
  error.value = '';
  try {
    const result = await apiPost<{ imported: number; skipped: Array<{ line: number; reason: string }> }>('/outbound-proxies/import', {
      lines: lines.value,
      defaultProtocol: protocol.value,
      maxResources: maxResources.value === '' ? null : Number(maxResources.value),
    });
    emit('imported', importSummary(result.imported, result.skipped));
    session.refresh();
  } catch (reason) {
    error.value = (reason as Error).message;
  } finally {
    importing.value = false;
  }
}
</script>

<template>
  <Dialog size="lg" :title="t('批量导入代理')" @close="close">
    <div class="form">
      <FormField :label="t('代理列表（每行一条，最多 500 条）')" class="full">
        <template #default="{ id }"><TextInput :id="id" v-model="lines" multiline :rows="9" :placeholder="placeholder" :disabled="importing" class="mono-input" /></template>
      </FormField>
      <FormField :label="t('简写默认协议')">
        <template #default="{ id }"><Select :id="id" v-model="protocol" :options="protocolOptions" :label="t('简写默认协议')" :disabled="importing" /></template>
      </FormField>
      <FormField :label="t('每条代理绑定上限')" :hint="t('留空使用平台默认值。')">
        <template #default="{ id }"><TextInput :id="id" v-model="maxResources" type="number" min="0" step="1" :placeholder="t('使用平台默认值')" :disabled="importing" /></template>
      </FormField>
      <Notice v-if="error" tone="danger" class="full">{{ error }}</Notice>
    </div>
    <template #footer>
      <Button :disabled="importing" @click="close">{{ t('取消') }}</Button>
      <Button variant="primary" :loading="importing" :disabled="!lines.trim()" @click="submit">{{ importing ? t('导入中…') : t('导入有效项') }}</Button>
    </template>
  </Dialog>
</template>

<style scoped>
.form { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
.full { grid-column: 1 / -1; }
.form :deep(.mono-input) { font-family: var(--hs-font-mono); font-size: var(--hs-text-xs); }
@media (max-width: 640px) { .form { grid-template-columns: 1fr; } }
</style>
