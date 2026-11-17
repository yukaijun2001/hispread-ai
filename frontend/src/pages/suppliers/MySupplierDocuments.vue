<script setup lang="ts">
// Qualification documents: list, upload (PDF/PNG/JPEG) and download.
import { ref } from 'vue';
import Card from '../../components/ui/Card.vue';
import Button from '../../components/ui/Button.vue';
import EmptyState from '../../components/ui/EmptyState.vue';
import Icon from '../../components/ui/Icon.vue';
import Spinner from '../../components/ui/Spinner.vue';
import { useApiData } from '../../composables/useApiData';
import { download, uploadDocument } from '../../lib/api';
import { t } from '../../lib/i18n';
import { formatDateTime } from '../../lib/money';
import { useSessionStore } from '../../stores/session';
import type { SupplierDocument } from './supplierAccounts';

const props = defineProps<{ supplierId: string }>();
const session = useSessionStore();

const documents = useApiData<SupplierDocument[]>(() => `/documents?supplierId=${props.supplierId}`);
const fileInput = ref<HTMLInputElement | null>(null);
const uploading = ref(false);

async function upload(file: File | undefined) {
  if (!file) return;
  uploading.value = true;
  try {
    await uploadDocument(props.supplierId, file);
    session.notify(t('资质材料已上传'));
    session.refresh();
  } catch (error) {
    session.notify((error as Error).message, true);
  } finally {
    uploading.value = false;
  }
}

function onFile(event: Event) {
  const input = event.target as HTMLInputElement;
  void upload(input.files?.[0]);
  input.value = '';
}

function save(doc: SupplierDocument) {
  download(`/documents/${doc.id}/download`, doc.name).catch((error: Error) => session.notify(error.message, true));
}
</script>

<template>
  <Card :title="t('资质材料')" :description="t('主体证明与补充材料')">
    <template v-if="session.has('file.write')" #actions>
      <Button size="sm" icon="upload" :disabled="uploading" @click="fileInput?.click()">{{ uploading ? t('上传中…') : t('上传材料') }}</Button>
      <input ref="fileInput" type="file" hidden accept="application/pdf,image/png,image/jpeg" @change="onFile">
    </template>

    <div class="md-body">
      <EmptyState v-if="documents.error.value" error :text="documents.error.value" compact>
        <Button size="sm" icon="refresh" @click="documents.reload()">{{ t('重试') }}</Button>
      </EmptyState>
      <div v-else-if="documents.loading.value && !documents.data.value" class="md-loading"><Spinner :size="16" /></div>
      <ul v-else-if="documents.data.value?.length" class="md-list">
        <li v-for="doc in documents.data.value" :key="doc.id" class="md-row">
          <span class="md-icon"><Icon name="quote" :size="17" /></span>
          <div class="md-name">
            <strong>{{ doc.name }}</strong>
            <small>{{ (doc.bytes / 1024).toFixed(1) }} KB · {{ formatDateTime(doc.createdAt) }}</small>
          </div>
          <Button size="sm" variant="ghost" icon="download" @click="save(doc)">{{ t('下载') }}</Button>
        </li>
      </ul>
      <EmptyState v-else :text="t('尚未上传资质材料')" compact />
      <p class="md-hint">{{ t('支持 PDF、PNG、JPG，单个文件不超过 10 MB。') }}</p>
    </div>
  </Card>
</template>

<style scoped>
.md-body { display: grid; gap: 12px; }
.md-loading { display: grid; place-items: center; padding: 24px; color: var(--hs-text-3); }
.md-list { display: grid; gap: 4px; margin: 0; padding: 0; list-style: none; }
.md-row { display: flex; align-items: center; gap: 10px; min-height: 48px; padding: 6px 0; border-bottom: 1px solid var(--hs-divider); }
.md-row:last-child { border-bottom: 0; }
.md-icon { display: grid; place-items: center; width: 32px; height: 32px; color: var(--hs-text-3); background: var(--hs-surface-subtle); border-radius: 9px; flex: none; }
.md-name { display: grid; flex: 1; min-width: 0; }
.md-name strong { color: var(--hs-text); font-size: var(--hs-text-sm); font-weight: 500; overflow-wrap: anywhere; }
.md-name small { color: var(--hs-text-3); font-size: var(--hs-text-xs); font-variant-numeric: tabular-nums; }
.md-hint { margin: 0; color: var(--hs-text-3); font-size: var(--hs-text-xs); }
</style>
