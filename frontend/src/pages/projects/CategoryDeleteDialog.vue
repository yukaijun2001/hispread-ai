<script setup lang="ts">
import { ref } from 'vue';
import Dialog from '../../components/ui/Dialog.vue';
import Button from '../../components/ui/Button.vue';
import Notice from '../../components/ui/Notice.vue';
import { apiDelete } from '../../lib/api';
import { t } from '../../lib/i18n';
import { useSessionStore } from '../../stores/session';
import type { CategoryCode } from './projectAdmin';

const props = defineProps<{ category: CategoryCode }>();
const emit = defineEmits<{ close: [] }>();
const session = useSessionStore();
const busy = ref(false);
const error = ref('');

function close() { if (!busy.value) emit('close'); }

async function remove() {
  if (busy.value) return;
  busy.value = true;
  error.value = '';
  try {
    await apiDelete(`/projects/category-codes/${encodeURIComponent(props.category.code)}?version=${props.category.version}`);
    session.refresh();
    session.notify(t('项目大类已删除'));
    busy.value = false;
    emit('close');
  } catch (reason) {
    error.value = reason instanceof Error ? reason.message : t('删除失败，请重试');
  } finally {
    busy.value = false;
  }
}
</script>

<template>
  <Dialog size="sm" :title="t('删除项目大类')" @close="close">
    <div class="body">
      <Notice tone="warning">{{ t('确定删除“') }}{{ category.name }}{{ t('”（') }}{{ category.code }}{{ t('）吗？删除后不能再用于新项目。') }}</Notice>
      <Notice v-if="error" tone="danger">{{ error }}</Notice>
    </div>
    <template #footer>
      <Button :disabled="busy" @click="close">{{ t('取消') }}</Button>
      <Button variant="danger" :disabled="busy" @click="remove">{{ busy ? t('删除中…') : t('确认删除') }}</Button>
    </template>
  </Dialog>
</template>

<style scoped>
.body { display: grid; gap: 12px; }
</style>
