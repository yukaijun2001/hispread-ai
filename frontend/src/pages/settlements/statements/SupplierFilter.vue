<script setup lang="ts">
// Supplier filter backed by a server-side search (300 ms debounce). Suppliers
// seen in earlier results are remembered so the current choice keeps its name.
import { computed, onBeforeUnmount, ref, watch } from 'vue';
import Select from '../../../components/ui/Select.vue';
import Notice from '../../../components/ui/Notice.vue';
import { useSupplierDirectory, type SupplierSummary } from '../../../composables/useSupplierDirectory';
import { t } from '../../../lib/i18n';

const model = defineModel<string>({ required: true });

const typed = ref('');
const search = ref('');
let timer: number | undefined;
watch(typed, (value) => {
  window.clearTimeout(timer);
  timer = window.setTimeout(() => { search.value = value.trim(); }, 300);
});
onBeforeUnmount(() => window.clearTimeout(timer));

const directory = useSupplierDirectory(true, '', search);
const seen = new Map<string, SupplierSummary>();
watch(directory.items, (items) => { for (const item of items ?? []) seen.set(item.id, item); }, { immediate: true });

const pending = computed(() => typed.value.trim() !== search.value || directory.loading.value);
const options = computed(() => {
  const items = pending.value ? [] : directory.items.value ?? [];
  const selected = seen.get(model.value);
  const suppliers = [...(selected && !items.some((item) => item.id === model.value) ? [selected] : []), ...items];
  return [{ value: '', label: t('全部供应商') }, ...suppliers.map((item) => ({ value: item.id, label: item.name, detail: item.code }))];
});
const emptyText = computed(() => (!pending.value && !directory.error.value ? t('没有匹配的供应商') : undefined));
</script>

<template>
  <div class="st-supplier-filter">
    <Select
      v-model="model"
      :options="options"
      :label="t('供应商')"
      :placeholder="t('全部供应商')"
      icon="users"
      searchable
      :search-placeholder="t('搜索供应商名称或编码')"
      :search-loading="pending"
      :empty-text="emptyText"
      @search="typed = $event"
    />
    <Notice v-if="directory.error.value" tone="danger">{{ directory.error.value }}</Notice>
  </div>
</template>

<style scoped>
.st-supplier-filter { display: grid; gap: 6px; }
</style>
