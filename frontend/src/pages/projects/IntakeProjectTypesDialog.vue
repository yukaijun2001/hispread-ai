<script setup lang="ts">
// Which upstream channel types a supplier may assign to this project.
import { ref, useId, watch } from 'vue';
import Dialog from '../../components/ui/Dialog.vue';
import Button from '../../components/ui/Button.vue';
import Notice from '../../components/ui/Notice.vue';
import Spinner from '../../components/ui/Spinner.vue';
import { useApiData } from '../../composables/useApiData';
import { apiPut } from '../../lib/api';
import { t } from '../../lib/i18n';
import { useSessionStore } from '../../stores/session';
import type { ProjectRow } from './projectAdmin';

const props = defineProps<{ project: ProjectRow }>();
const emit = defineEmits<{ close: [] }>();
const session = useSessionStore();
const formId = useId();

const CHANNEL_TYPES: Array<[number, string]> = [
  [1, t('OpenAI 兼容')], [3, 'Azure'], [14, 'Anthropic'], [24, 'Gemini'], [33, 'AWS'], [41, 'Vertex'], [60, 'NewAPI'],
];

const path = `/projects/${encodeURIComponent(props.project.id)}/intake-channel-types`;
const current = useApiData<number[]>(path);
const selected = ref<number[]>([]);
watch(current.data, (value) => { if (value) selected.value = value; }, { immediate: true });

const saving = ref(false);
const error = ref('');

function toggle(type: number, checked: boolean) {
  selected.value = checked ? [...selected.value, type] : selected.value.filter((value) => value !== type);
}

function close() { if (!saving.value) emit('close'); }

async function save() {
  if (saving.value || current.loading.value || current.error.value) return;
  saving.value = true;
  error.value = '';
  try {
    await apiPut(path, selected.value);
    session.refresh();
    session.notify(t('项目适用资源类型已保存'));
    saving.value = false;
    emit('close');
  } catch (reason) {
    error.value = (reason as Error).message;
  } finally {
    saving.value = false;
  }
}
</script>

<template>
  <Dialog size="sm" :title="t('接口交付适用类型')" :subtitle="project.name" @close="close">
    <div class="body">
      <p class="intro">{{ t('供应商只能将匹配类型的接口资源分配到此项目。仍需有权交付且存在有效的已审核报价。') }}</p>
      <Notice v-if="error || current.error.value" tone="danger">{{ error || current.error.value }}</Notice>
      <p v-if="current.loading.value" class="loading"><Spinner :size="14" />{{ t('正在加载…') }}</p>
      <form v-else :id="formId" class="types" @submit.prevent="save">
        <label v-for="[type, label] in CHANNEL_TYPES" :key="type" class="type">
          <input type="checkbox" :checked="selected.includes(type)" :disabled="saving || !!current.error.value"
            @change="toggle(type, ($event.target as HTMLInputElement).checked)" />
          <span>{{ label }}</span>
        </label>
      </form>
    </div>
    <template #footer>
      <Button :disabled="saving" @click="close">{{ t('取消') }}</Button>
      <Button v-if="!current.loading.value" variant="primary" type="submit" :form="formId" :disabled="saving || !!current.error.value">
        {{ saving ? t('正在保存…') : t('保存适用类型') }}
      </Button>
    </template>
  </Dialog>
</template>

<style scoped>
.body { display: grid; gap: 14px; }
.intro { margin: 0; color: var(--hs-text-2); font-size: var(--hs-text-sm); line-height: 1.7; }
.loading { display: flex; align-items: center; gap: 8px; margin: 0; color: var(--hs-text-3); font-size: var(--hs-text-sm); }
.types { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 8px; }
.type { display: flex; align-items: center; gap: 8px; min-height: 40px; padding: 0 12px; color: var(--hs-text); background: var(--hs-surface-subtle); border: 1px solid var(--hs-border); border-radius: var(--hs-radius-control); font-size: var(--hs-text-sm); cursor: pointer; }
.type input { width: 15px; height: 15px; margin: 0; accent-color: var(--hs-accent); }
</style>
