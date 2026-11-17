<script setup lang="ts">
import { computed } from 'vue';
import EvidenceContent from './EvidenceContent';
import { t } from '../../../lib/i18n';
import { docToPlainText, type Evidence } from './evidence';

const props = defineProps<{ value: Evidence; canDownload: boolean }>();
const hasText = computed(() => !!docToPlainText(props.value.content).trim());
const downloadUrl = (id: string) => `/api/documents/${encodeURIComponent(id)}/download`;
</script>

<template>
  <section class="ev-view">
    <h3>{{ t('付款说明与凭证') }}</h3>
    <div v-if="hasText" class="ev-view-content"><EvidenceContent :node="value.content" /></div>
    <div class="ev-view-files">
      <div v-for="file in value.attachments" :key="file.id" class="ev-view-file">
        <a v-if="canDownload && file.contentType.startsWith('image/')" :href="downloadUrl(file.id)" target="_blank" rel="noreferrer">
          <img :src="downloadUrl(file.id)" :alt="file.name" loading="lazy" />
        </a>
        <div class="ev-view-text">
          <a v-if="canDownload" :href="downloadUrl(file.id)" target="_blank" rel="noreferrer">{{ file.name }}</a>
          <strong v-else>{{ file.name }}</strong>
          <small>{{ (file.bytes / 1024).toFixed(1) }} KB</small>
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped>
.ev-view { display: grid; gap: 10px; }
.ev-view h3 { margin: 0; font-size: var(--hs-text-sm); font-weight: 600; }
.ev-view-content { padding: 12px 14px; color: var(--hs-text); background: var(--hs-surface-subtle); border: 1px solid var(--hs-border); border-radius: 12px; font-size: var(--hs-text-sm); line-height: 1.7; overflow-wrap: anywhere; }
.ev-view-content :deep(p) { margin: 0 0 4px; }
.ev-view-content :deep(ul), .ev-view-content :deep(ol) { margin: 0 0 4px; padding-left: 22px; }
.ev-view-files { display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: 8px; }
.ev-view-file { display: flex; align-items: center; gap: 10px; min-width: 0; padding: 8px; border: 1px solid var(--hs-border); border-radius: 10px; }
.ev-view-file img { display: block; width: 48px; height: 48px; object-fit: cover; border-radius: 6px; }
.ev-view-text { display: grid; min-width: 0; }
.ev-view-text a, .ev-view-text strong { overflow: hidden; color: var(--hs-accent); font-size: var(--hs-text-xs); font-weight: 500; text-overflow: ellipsis; white-space: nowrap; text-decoration: none; }
.ev-view-text strong { color: var(--hs-text); }
.ev-view-text a:hover { text-decoration: underline; text-underline-offset: 3px; }
.ev-view-text small { color: var(--hs-text-3); font-size: 11px; }
</style>
