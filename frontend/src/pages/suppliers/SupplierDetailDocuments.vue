<script setup lang="ts">
// 资质材料 tab: qualification documents with upload (file.write) and download links.
import { ref } from 'vue';
import Button from '../../components/ui/Button.vue';
import EmptyState from '../../components/ui/EmptyState.vue';
import Icon from '../../components/ui/Icon.vue';
import { uploadDocument } from '../../lib/api';
import { t } from '../../lib/i18n';
import { formatDateTime } from '../../lib/money';
import { useSessionStore } from '../../stores/session';
import type { SupplierDocument } from './supplierAdmin';

const props = defineProps<{ supplierId: string; documents: SupplierDocument[] | null }>();

const session = useSessionStore();
const input = ref<HTMLInputElement | null>(null);
const uploading = ref(false);

async function upload(file: File | undefined) {
  if (!file) return;
  uploading.value = true;
  try {
    await uploadDocument(props.supplierId, file);
    session.notify(t('资质附件已上传'));
    session.refresh();
  } catch (error) {
    session.notify((error as Error).message, true);
  } finally {
    uploading.value = false;
  }
}

function onPick(event: Event) {
  const target = event.target as HTMLInputElement;
  void upload(target.files?.[0]);
  target.value = '';
}
</script>

<template>
  <section class="docs">
    <div class="docs-title">
      <h3>{{ t('主体证明与补充材料') }}</h3>
      <Button v-if="session.has('file.write')" size="sm" icon="upload" :disabled="uploading" @click="input?.click()">{{ uploading ? t('上传中…') : t('上传材料') }}</Button>
      <input ref="input" type="file" hidden accept="application/pdf,image/png,image/jpeg" @change="onPick">
    </div>
    <p class="docs-hint">{{ t('支持 PDF、PNG、JPG，单个文件不超过 10 MB。') }}</p>
    <ul v-if="documents?.length" class="docs-list">
      <li v-for="document in documents" :key="document.id">
        <span class="docs-icon"><Icon name="quote" :size="17" /></span>
        <div class="docs-meta">
          <strong>{{ document.name }}</strong>
          <small>{{ (document.bytes / 1024).toFixed(1) }} KB · {{ formatDateTime(document.createdAt) }}</small>
        </div>
        <a class="docs-link" :href="`/api/documents/${document.id}/download`">{{ t('下载') }}</a>
      </li>
    </ul>
    <EmptyState v-else :text="t('尚未上传资质材料')" compact />
  </section>
</template>

<style scoped>
.docs { display: grid; gap: 10px; }
.docs-title { display: flex; align-items: center; justify-content: space-between; gap: 12px; }
.docs-title h3 { margin: 0; font-size: var(--hs-text-sm); font-weight: 600; }
.docs-hint { margin: 0; color: var(--hs-text-3); font-size: var(--hs-text-xs); }
.docs-list { display: grid; gap: 8px; margin: 0; padding: 0; list-style: none; }
.docs-list li { display: flex; align-items: center; gap: 12px; padding: 10px 12px; border: 1px solid var(--hs-border); border-radius: 12px; }
.docs-icon { display: grid; place-items: center; width: 34px; height: 34px; color: var(--hs-text-3); background: var(--hs-surface-subtle); border-radius: 9px; flex: none; }
.docs-meta { display: grid; gap: 2px; flex: 1; min-width: 0; }
.docs-meta strong { color: var(--hs-text); font-size: var(--hs-text-sm); font-weight: 500; overflow-wrap: anywhere; }
.docs-meta small { color: var(--hs-text-3); font-size: var(--hs-text-xs); font-variant-numeric: tabular-nums; }
.docs-link { color: var(--hs-accent); font-size: var(--hs-text-sm); text-decoration: none; }
.docs-link:hover { text-decoration: underline; text-underline-offset: 3px; }
</style>
