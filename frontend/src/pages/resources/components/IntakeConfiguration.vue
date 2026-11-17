<script setup lang="ts">
// Configuration of a received NewAPI resource: endpoint, models, model mapping,
// API key (`resource.sensitive`) and the original request (`resource.request.read`).
// Secrets and the original request are read with POST so nothing caches them;
// read-only records never load them.
import { computed, ref, watch } from 'vue';
import Button from '../../../components/ui/Button.vue';
import DetailList from '../../../components/ui/DetailList.vue';
import Notice from '../../../components/ui/Notice.vue';
import { apiPost } from '../../../lib/api';
import { t } from '../../../lib/i18n';
import { useSessionStore } from '../../../stores/session';
import { channelTypeLabel } from '../resources';
import { jsonText, modelList, type IntakeMaterial, type IntakeRecord } from '../intakeDetail';

const props = defineProps<{ item: IntakeRecord }>();
const session = useSessionStore();

const maySeeKey = computed(() => !props.item.readOnly && session.has('resource.sensitive'));
const mayReadRequest = computed(() => !props.item.readOnly && session.has('resource.request.read'));
const attempt = ref(0);

const original = ref<unknown>(null);
const originalError = ref('');
watch([() => props.item.id, mayReadRequest, attempt], (_, __, onCleanup) => {
  let active = true;
  onCleanup(() => { active = false; });
  original.value = null; originalError.value = '';
  if (!mayReadRequest.value) return;
  apiPost<{ originalRequest: unknown }>(`/resource-intakes/${encodeURIComponent(props.item.id)}/original-request`, {})
    .then((result) => { if (active) original.value = result.originalRequest; })
    .catch((error: Error) => { if (active) originalError.value = error.message; });
}, { immediate: true });

const material = ref<IntakeMaterial | null>(null);
const materialLoading = ref(false);
const materialError = ref('');
const revealed = ref(false);
watch([() => props.item.id, maySeeKey, attempt], (_, __, onCleanup) => {
  let active = true;
  onCleanup(() => { active = false; });
  material.value = null; revealed.value = false; materialError.value = '';
  if (!maySeeKey.value) { materialLoading.value = false; return; }
  materialLoading.value = true;
  apiPost<IntakeMaterial>(`/resource-intakes/${encodeURIComponent(props.item.id)}/material`, {})
    .then((result) => { if (active) material.value = result; })
    .catch((error: Error) => { if (active) materialError.value = error.message; })
    .finally(() => { if (active) materialLoading.value = false; });
}, { immediate: true });

const configuration = computed(() => props.item.configuration || {});
const channel = computed(() => {
  const value = material.value?.channel;
  return value && typeof value === 'object' && !Array.isArray(value) ? value : null;
});
const models = computed(() => modelList(configuration.value.models));
const mapping = computed(() => {
  let value = channel.value?.model_mapping;
  if (typeof value === 'string') {
    try { value = JSON.parse(value); } catch { /* shown as text */ }
  }
  return value;
});
const mappingEntries = computed(() => (mapping.value && typeof mapping.value === 'object' && !Array.isArray(mapping.value)
  ? Object.entries(mapping.value as Record<string, unknown>) : null));
const mappingText = computed(() => (!mappingEntries.value && typeof mapping.value === 'string' && mapping.value.trim() ? mapping.value : ''));

const details = computed<Array<[string, string]>>(() => [
  [t('资源名称'), props.item.name],
  [t('类型'), channelTypeLabel(props.item.channelType)],
  [t('API 地址'), typeof configuration.value.base_url === 'string' && configuration.value.base_url ? configuration.value.base_url : t('未提供')],
]);

async function copy(value: unknown) {
  try {
    await navigator.clipboard.writeText(typeof value === 'string' ? value : JSON.stringify(value, null, 2));
    session.notify(t('已复制'));
  } catch {
    session.notify(t('复制失败，请选择内容手动复制'), true);
  }
}
</script>

<template>
  <div class="ic">
    <DetailList :items="details" />

    <section class="ic-section">
      <div class="ic-heading">
        <h3>{{ t('支持模型') }}</h3>
        <span>{{ t('共 ') }}{{ models.length }}{{ t(' 个') }}</span>
      </div>
      <ol v-if="models.length" class="ic-models" :aria-label="t('支持模型')">
        <li v-for="(model, index) in models" :key="model"><span>{{ index + 1 }}</span><code>{{ model }}</code></li>
      </ol>
      <p v-else class="ic-muted">{{ t('未提供模型') }}</p>
    </section>

    <section v-if="mappingEntries?.length" class="ic-section">
      <div class="ic-heading"><h3>{{ t('模型映射') }}</h3></div>
      <dl class="ic-mapping">
        <div v-for="[from, to] in mappingEntries" :key="from"><dt>{{ from }}</dt><dd>{{ jsonText(to) }}</dd></div>
      </dl>
    </section>
    <section v-else-if="mappingText" class="ic-section">
      <div class="ic-heading"><h3>{{ t('模型映射') }}</h3></div>
      <pre class="ic-pre">{{ mappingText }}</pre>
    </section>

    <section class="ic-section">
      <div class="ic-heading">
        <h3>{{ t('API 密钥') }}</h3>
        <div v-if="maySeeKey" class="ic-actions">
          <Button v-if="channel && revealed" size="sm" icon="copy" @click="copy(channel.key)">{{ t('复制') }}</Button>
          <Button size="sm" :disabled="materialLoading || !channel" :loading="materialLoading" @click="revealed = !revealed">{{ revealed ? t('隐藏') : t('查看') }}</Button>
        </div>
      </div>
      <pre v-if="channel && revealed" class="ic-pre">{{ jsonText(channel.key) }}</pre>
      <p v-else class="ic-muted">
        {{ t('已保存 ') }}{{ item.memberCount }}{{ t(' 个密钥 ') }}{{ session.has('resource.sensitive') ? '' : t('，当前账号无查看权限') }}
      </p>
    </section>

    <details v-if="mayReadRequest && original" class="ic-original">
      <summary>{{ t('原始请求') }}</summary>
      <div class="ic-original-actions"><Button size="sm" icon="copy" @click="copy(original)">{{ t('复制') }}</Button></div>
      <pre class="ic-pre">{{ jsonText(original) }}</pre>
    </details>

    <Notice v-if="originalError" tone="danger">
      {{ originalError }}
      <template #actions><Button size="sm" @click="attempt++">{{ t('重试') }}</Button></template>
    </Notice>
    <Notice v-if="materialError" tone="danger">
      {{ materialError }}
      <template #actions><Button size="sm" @click="attempt++">{{ t('重试') }}</Button></template>
    </Notice>
  </div>
</template>

<style scoped>
.ic { display: grid; gap: 18px; }
.ic-section { display: grid; gap: 8px; }
.ic-heading { display: flex; align-items: center; justify-content: space-between; gap: 12px; }
.ic-heading h3 { margin: 0; font-size: var(--hs-text-sm); font-weight: 600; }
.ic-heading > span { color: var(--hs-text-3); font-size: var(--hs-text-xs); }
.ic-actions { display: flex; gap: 6px; }
.ic-muted { margin: 0; color: var(--hs-text-3); font-size: var(--hs-text-sm); }
.ic-models { display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: 6px; margin: 0; padding: 0; list-style: none; }
.ic-models li { display: flex; align-items: center; gap: 8px; min-width: 0; padding: 6px 10px; background: var(--hs-surface-subtle); border: 1px solid var(--hs-border); border-radius: 8px; }
.ic-models li span { color: var(--hs-text-4); font-size: var(--hs-text-xs); font-variant-numeric: tabular-nums; }
.ic-models code { overflow-wrap: anywhere; font-family: var(--hs-font-mono); font-size: var(--hs-text-xs); }
.ic-mapping { display: grid; gap: 4px; margin: 0; }
.ic-mapping div { display: grid; grid-template-columns: minmax(120px, 1fr) 2fr; gap: 12px; padding: 6px 10px; border-bottom: 1px solid var(--hs-border); }
.ic-mapping dt { color: var(--hs-text-2); font-family: var(--hs-font-mono); font-size: var(--hs-text-xs); overflow-wrap: anywhere; }
.ic-mapping dd { margin: 0; font-family: var(--hs-font-mono); font-size: var(--hs-text-xs); white-space: pre-wrap; overflow-wrap: anywhere; }
.ic-pre { margin: 0; max-height: 320px; overflow: auto; padding: 10px 12px; background: var(--hs-surface-subtle); border: 1px solid var(--hs-border); border-radius: 8px; font-family: var(--hs-font-mono); font-size: var(--hs-text-xs); white-space: pre-wrap; overflow-wrap: anywhere; }
.ic-original { display: grid; gap: 8px; }
.ic-original summary { cursor: pointer; font-size: var(--hs-text-sm); font-weight: 600; }
.ic-original-actions { display: flex; justify-content: flex-end; margin-top: 8px; }
</style>
