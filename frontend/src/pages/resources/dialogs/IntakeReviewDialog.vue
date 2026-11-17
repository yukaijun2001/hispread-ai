<script setup lang="ts">
// Platform review of successful CC creations whose new-vs-existing attribution
// is ambiguous. Resolving only corrects the onboarding count.
import { computed, onBeforeUnmount, ref, watch } from 'vue';
import Dialog from '../../../components/ui/Dialog.vue';
import Button from '../../../components/ui/Button.vue';
import Notice from '../../../components/ui/Notice.vue';
import Select from '../../../components/ui/Select.vue';
import TextInput from '../../../components/ui/TextInput.vue';
import FormField from '../../../components/ui/FormField.vue';
import DataTable from '../../../components/ui/DataTable.vue';
import Pagination from '../../../components/ui/Pagination.vue';
import { useApiData } from '../../../composables/useApiData';
import { apiPost } from '../../../lib/api';
import { t } from '../../../lib/i18n';
import { formatDateTime } from '../../../lib/money';
import { useSessionStore } from '../../../stores/session';
import { isPlatformDispatcher } from '../resources';

interface Review { dispatchId: string; resourceName: string; supplierName: string; actorName: string; confirmedAt: string }
interface FilterOptions { suppliers: Array<{ id: string; name: string; code?: string }> }

const emit = defineEmits<{ close: [] }>();

const session = useSessionStore();
const allowed = computed(() => isPlatformDispatcher(session.user!));

const supplierSearch = ref('');
const appliedSearch = ref('');
let searchTimer: number | undefined;
watch(supplierSearch, (value) => {
  window.clearTimeout(searchTimer);
  searchTimer = window.setTimeout(() => { appliedSearch.value = value.trim(); }, 300);
});
onBeforeUnmount(() => window.clearTimeout(searchTimer));

const supplierId = ref('');
const page = ref(1);
const size = ref(20);
const reviewing = ref<Review | null>(null);
const result = ref<'' | 'NEW' | 'EXISTING'>('');
const reason = ref('');
const saving = ref(false);
const saveError = ref('');

const options = useApiData<FilterOptions>(() => (allowed.value ? `/deliveries/filter-options?assignment=ASSIGNED&supplierSearch=${encodeURIComponent(appliedSearch.value)}` : null));
const listPath = computed(() => {
  if (!allowed.value) return null;
  const query = new URLSearchParams({ page: String(page.value), size: String(size.value) });
  if (supplierId.value) query.set('supplierId', supplierId.value);
  return `/cc-intake/admin/reviews?${query}`;
});
const reviews = useApiData<{ items: Review[]; total: number }>(listPath);

watch(supplierId, () => { page.value = 1; reviewing.value = null; saveError.value = ''; });
watch([page, size], () => { reviewing.value = null; });

const supplierOptions = computed(() => [
  { value: '', label: t('全部供应商') },
  ...(options.data.value?.suppliers ?? []).map((s) => ({ value: s.id, label: s.name, detail: s.code })),
]);
const resultOptions = [
  { value: '' as const, label: t('请选择核对结果') },
  { value: 'NEW' as const, label: t('确认本次新增') },
  { value: 'EXISTING' as const, label: t('确认为已有账号') },
];
const columns = [
  { key: 'resourceName', label: t('资源名称') },
  { key: 'supplierName', label: t('供应商') },
  { key: 'actorName', label: t('提交账号') },
  { key: 'confirmedAt', label: t('确认成功时间'), nowrap: true },
  { key: 'action', label: t('操作'), align: 'right' as const },
];

function startReview(row: Review) {
  reviewing.value = row; result.value = ''; reason.value = ''; saveError.value = '';
}

async function resolve() {
  const target = reviewing.value;
  if (!target || saving.value || !result.value || !reason.value.trim()) return;
  saving.value = true;
  saveError.value = '';
  try {
    await apiPost(`/cc-intake/admin/reviews/${encodeURIComponent(target.dispatchId)}/resolve`, { newlyCreated: result.value === 'NEW', reason: reason.value.trim() });
    reviewing.value = null; reason.value = ''; result.value = '';
    session.notify(t('上号计数已核对'));
    session.refresh();
  } catch (error) {
    saveError.value = (error as Error).message;
  } finally {
    saving.value = false;
  }
}
</script>

<template>
  <Dialog size="lg" :title="t('核对上号计数')" @close="emit('close')">
    <Notice v-if="!allowed" tone="danger">{{ t('当前账号无权访问此页面') }}</Notice>
    <div v-else class="ir-body">
      <p class="ir-intro">{{ t('仅列出已成功创建、但新增或重复归属仍有歧义的账号。核对只修正计数，不重新上号。') }}</p>
      <div class="ir-toolbar">
        <div class="ir-supplier">
          <Select
            v-model="supplierId"
            :options="supplierOptions"
            :label="t('核对计数供应商')"
            :placeholder="t('全部供应商')"
            icon="users"
            searchable
            :search-placeholder="t('搜索供应商名称或编码')"
            :search-loading="options.loading.value"
            :disabled="saving"
            @search="supplierSearch = $event"
          />
        </div>
        <Button icon="refresh" :disabled="saving || reviews.loading.value" @click="reviews.reload()">{{ t('刷新') }}</Button>
      </div>
      <Notice v-if="options.error.value" tone="danger">
        {{ options.error.value }}
        <template #actions><Button size="sm" @click="options.reload()">{{ t('重新加载') }}</Button></template>
      </Notice>

      <div class="ir-table">
        <DataTable
          :columns="columns"
          :rows="reviews.data.value?.items"
          :row-key="(row: Review) => row.dispatchId"
          :loading="reviews.loading.value"
          :refreshing="reviews.refreshing.value"
          :error="reviews.error.value"
          :label="t('核对上号计数')"
          @retry="reviews.reload()"
        >
          <template #cell-confirmedAt="{ row }">{{ formatDateTime(row.confirmedAt) }}</template>
          <template #cell-action="{ row }">
            <Button size="sm" variant="ghost" :disabled="saving" @click="startReview(row)">{{ t('核对此账号') }}</Button>
          </template>
        </DataTable>
      </div>
      <Pagination v-model:page="page" v-model:size="size" :total="reviews.data.value?.total ?? 0" :loading="reviews.loading.value" />

      <form v-if="reviewing" class="ir-form" @submit.prevent="resolve">
        <h3>{{ t('核对：{0}', [reviewing.resourceName]) }}</h3>
        <FormField :label="t('核对结果')">
          <Select v-model="result" :options="resultOptions" :label="t('核对结果')" :placeholder="t('请选择核对结果')" :disabled="saving" />
        </FormField>
        <FormField v-slot="{ id }" :label="t('核对依据')" :hint="`${reason.length}/500`">
          <TextInput :id="id" v-model="reason" multiline :rows="3" maxlength="500" required :disabled="saving" />
        </FormField>
        <Notice v-if="saveError" tone="danger">{{ saveError }}</Notice>
        <footer class="ir-actions">
          <Button :disabled="saving" @click="reviewing = null">{{ t('取消') }}</Button>
          <Button type="submit" variant="primary" :loading="saving" :disabled="saving || !result || !reason.trim()">{{ saving ? t('保存中…') : t('保存核对结果') }}</Button>
        </footer>
      </form>
    </div>
  </Dialog>
</template>

<style scoped>
.ir-body { display: grid; gap: 14px; }
.ir-intro { margin: 0; color: var(--hs-text-3); font-size: var(--hs-text-sm); }
.ir-toolbar { display: flex; flex-wrap: wrap; align-items: center; gap: 8px; }
.ir-supplier { flex: 0 1 280px; min-width: 200px; }
.ir-table { border: 1px solid var(--hs-border); border-radius: 12px; overflow: hidden; }
.ir-form { display: grid; gap: 12px; padding: 14px 16px; background: var(--hs-surface-subtle); border: 1px solid var(--hs-border); border-radius: 12px; }
.ir-form h3 { margin: 0; font-size: var(--hs-text-sm); font-weight: 600; }
.ir-actions { display: flex; justify-content: flex-end; gap: 8px; }
</style>
