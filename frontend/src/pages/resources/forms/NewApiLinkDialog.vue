<script setup lang="ts">
// Link a local resource to an existing NewAPI channel. Only verifies and links
// the channel; nothing is created upstream and no key is imported.
import { computed, ref } from 'vue';
import Dialog from '../../../components/ui/Dialog.vue';
import Button from '../../../components/ui/Button.vue';
import Notice from '../../../components/ui/Notice.vue';
import FormField from '../../../components/ui/FormField.vue';
import Select from '../../../components/ui/Select.vue';
import SearchInput from '../../../components/ui/SearchInput.vue';
import TextInput from '../../../components/ui/TextInput.vue';
import { useApiData } from '../../../composables/useApiData';
import { apiFetch, apiPost } from '../../../lib/api';
import { t } from '../../../lib/i18n';
import { enc, isIntake, type DeliveryPage, type Resource } from '../resources';
import { CHANNEL_ID_PATTERN, isNewApi, type ResourceTarget } from './newapiChannel';

const emit = defineEmits<{ close: []; linked: [resource: Resource] }>();

const search = ref('');
const targets = useApiData<ResourceTarget[]>('/resource-targets');
const resources = useApiData<DeliveryPage>(() => `/resources?page=1&size=100&search=${enc(search.value)}`);
const targetId = ref('');
const resourceId = ref('');
const channelId = ref('');
const busy = ref(false);
const error = ref('');

const targetOptions = computed(() => [
  { value: '', label: t('请选择目标') },
  ...(targets.data.value || []).filter((row) => row.enabled && row.protocol === 'NEWAPI').map((row) => ({ value: row.id, label: row.name })),
]);
const eligible = computed(() => (resources.data.value?.items || []).filter((row) => !row.readOnly && !isNewApi(row) && !isIntake(row)
  && (!row.targetId || row.targetId === targetId.value)));
const resourceOptions = computed(() => [
  { value: '', label: t('请选择未关联资源') },
  ...eligible.value.map((row) => ({ value: row.id, label: `${row.name} · ${row.supplierName || t('未命名供应商')}` })),
]);
const loadError = computed(() => error.value || targets.error.value || resources.error.value);

function onSearch(value: string) {
  search.value = value;
  resourceId.value = '';
}

async function save() {
  if (busy.value) return;
  error.value = '';
  if (!targetId.value || !resourceId.value || !CHANNEL_ID_PATTERN.test(channelId.value)) {
    error.value = t('请选择目标、本地资源，并填写有效渠道 ID');
    return;
  }
  busy.value = true;
  try {
    const resource = await apiFetch<Resource>(`/resources/${enc(resourceId.value)}`);
    const saved = await apiPost<Resource>(`/resources/${enc(resourceId.value)}/upstream-channel`, {
      targetId: targetId.value, channelId: channelId.value, version: resource.version,
    });
    emit('linked', saved);
  } catch (failure) {
    error.value = (failure as Error).message;
  } finally {
    busy.value = false;
  }
}
</script>

<template>
  <Dialog :title="t('关联 New API 渠道')" @close="emit('close')">
    <form class="rs-form" @submit.prevent="save">
      <Notice>{{ t('关联上游已有渠道，只读取并核验渠道，不创建渠道、不导入密钥，也不改变交付和账务状态。') }}</Notice>
      <FormField :label="t('New API 资源目标')">
        <template #default="{ id }"><Select :id="id" v-model="targetId" :options="targetOptions" :label="t('New API 资源目标')" /></template>
      </FormField>
      <FormField :label="t('搜索本地资源')">
        <SearchInput :model-value="search" :label="t('搜索本地资源')" :placeholder="t('按资源名称、账号或 Lane ID 搜索')" @update:model-value="onSearch" />
      </FormField>
      <FormField :label="t('本地资源')">
        <template #default="{ id }"><Select :id="id" v-model="resourceId" :options="resourceOptions" :label="t('本地资源')" /></template>
      </FormField>
      <FormField :label="t('上游渠道 ID')">
        <template #default="{ id }">
          <TextInput :id="id" v-model="channelId" required inputmode="numeric" pattern="[1-9][0-9]{0,17}" />
        </template>
      </FormField>
      <Notice v-if="!resources.loading.value && !eligible.length" tone="warning">{{ t('没有可关联资源，请先由供应商创建本地资源草稿。') }}</Notice>
      <Notice v-if="loadError" tone="danger">{{ loadError }}</Notice>
    </form>
    <template #footer>
      <Button @click="emit('close')">{{ t('取消') }}</Button>
      <Button variant="primary" :disabled="busy || resources.loading.value || targets.loading.value || !eligible.length" @click="save">
        {{ busy ? t('核验中…') : t('核验并关联') }}
      </Button>
    </template>
  </Dialog>
</template>

<style scoped>
.rs-form { display: grid; gap: 14px; }
</style>
