<script setup lang="ts">
// Responsible operator of a supplier: assign / reassign form and the
// ownership history. Inside the supplier drawer it is a section with its own
// dialog; `embedded` (operator KPI page) shows the form directly and loads the
// history only when expanded.
import { computed, ref } from 'vue';
import Dialog from '../../components/ui/Dialog.vue';
import Button from '../../components/ui/Button.vue';
import Notice from '../../components/ui/Notice.vue';
import Select from '../../components/ui/Select.vue';
import TextInput from '../../components/ui/TextInput.vue';
import SearchInput from '../../components/ui/SearchInput.vue';
import DataTable from '../../components/ui/DataTable.vue';
import Pagination from '../../components/ui/Pagination.vue';
import { useApiData } from '../../composables/useApiData';
import { apiPut } from '../../lib/api';
import { t } from '../../lib/i18n';
import { formatDateTime } from '../../lib/money';
import { useSessionStore } from '../../stores/session';
import type { UserOption } from './supplierAdmin';

interface OwnerTerm { id?: string; ownerName: string; startsAt: string; endsAt?: string | null; note: string }

const props = withDefaults(defineProps<{
  supplierId: string;
  version: number;
  ownerUserId?: string | null;
  ownerName?: string | null;
  embedded?: boolean;
}>(), { embedded: false });
const emit = defineEmits<{ changed: []; close: [] }>();

const session = useSessionStore();
const canAssign = computed(() => session.has('supplier.owner.assign'));

const search = ref('');
const page = ref(1);
const size = ref(10);
const historyOpen = ref(false);
const terms = useApiData<{ items: OwnerTerm[]; total: number }>(() => (canAssign.value && (!props.embedded || historyOpen.value)
  ? `/suppliers/${props.supplierId}/owner-terms?search=${encodeURIComponent(search.value)}&page=${page.value}&size=${size.value}`
  : null));
const candidates = useApiData<UserOption[]>(() => (canAssign.value ? '/suppliers/owner-candidates' : null));

const dialogOpen = ref(false);
const selected = ref('');
const reason = ref('');
const saving = ref(false);
const error = ref('');

const candidateOptions = computed(() => (candidates.data.value ?? []).map((user) => ({ value: user.id, label: t('{0}（{1}）', [user.displayName, user.username]) })));
const noCandidates = computed(() => candidates.loading.value || !!candidates.error.value || !candidates.data.value?.length);

function onSearch(value: string) { search.value = value; page.value = 1; }

function closeForm() {
  if (props.embedded) emit('close'); else dialogOpen.value = false;
  error.value = '';
}

async function save() {
  if (!selected.value) { error.value = t('请选择平台运营'); return; }
  if (selected.value === props.ownerUserId) { error.value = t('请选择另一位平台运营'); return; }
  if (!reason.value.trim()) { error.value = t('请填写本次指定或改挂的原因'); return; }
  saving.value = true;
  try {
    await apiPut(`/suppliers/${props.supplierId}/owner`, { ownerUserId: selected.value, version: props.version, note: reason.value });
    session.notify(t('负责运营已更新'));
    closeForm();
    reason.value = '';
    emit('changed');
  } catch (reason) {
    error.value = (reason as Error).message;
  } finally {
    saving.value = false;
  }
}

const columns = [
  { key: 'ownerName', label: t('负责人') },
  { key: 'range', label: t('区间') },
  { key: 'note', label: t('备注') },
];
</script>

<template>
  <template v-if="canAssign">
    <!-- Assign / reassign form, rendered inline (embedded) or in a dialog. -->
    <template v-if="embedded">
      <div class="owner">
        <div class="owner-form">
          <p class="owner-current">{{ t('当前负责运营：') }}<strong>{{ ownerName || t('待分配') }}</strong></p>
          <Notice v-if="candidates.error.value" tone="danger">{{ t('平台运营加载失败：') }}{{ candidates.error.value }}</Notice>
          <p v-if="candidates.loading.value && !candidates.data.value" class="owner-quiet">{{ t('正在读取平台运营…') }}</p>
          <Notice v-if="!candidates.loading.value && !candidates.error.value && candidates.data.value?.length === 0">{{ t('暂无可指定的平台运营账号，请先启用平台运营账号。') }}</Notice>
          <div class="owner-field">
            <span class="owner-label">{{ t('平台运营') }}<em>*</em></span>
            <Select v-model="selected" :options="candidateOptions" :label="t('平台运营')" :placeholder="t('请选择')" icon="users" searchable :disabled="noCandidates" @update:model-value="error = ''" />
          </div>
          <div class="owner-field">
            <span class="owner-label">{{ t('指定原因') }}<em>*</em></span>
            <TextInput v-model="reason" multiline :rows="3" maxlength="500" :aria-label="t('指定原因')" :placeholder="t('说明本次指定或改挂的原因')" @update:model-value="error = ''" />
            <small class="owner-quiet">{{ t('必填，保存后会记入归属记录。') }}</small>
          </div>
          <Notice v-if="error" tone="danger">{{ error }}</Notice>
          <div class="owner-actions">
            <Button :disabled="saving" @click="closeForm">{{ t('取消') }}</Button>
            <Button variant="primary" :loading="saving" :disabled="noCandidates" @click="save">{{ saving ? t('保存中…') : ownerName ? t('确认改挂') : t('确认指定') }}</Button>
          </div>
        </div>
        <details class="owner-history" @toggle="historyOpen = ($event.currentTarget as HTMLDetailsElement).open">
          <summary>{{ t('查看归属记录') }}</summary>
          <div v-if="historyOpen" class="owner-history-body">
            <SearchInput :model-value="search" :placeholder="t('搜索负责人或备注')" @update:model-value="onSearch" />
            <div class="owner-table">
              <DataTable :columns="columns" :rows="terms.data.value?.items ?? []" :row-key="(row: OwnerTerm) => row.id ?? `${row.ownerName}-${row.startsAt}`"
                :loading="terms.loading.value" :error="terms.error.value" :label="t('查看归属记录')" @retry="terms.reload()">
                <template #cell-range="{ row }">{{ t('{0} 至 {1}', [formatDateTime(row.startsAt), row.endsAt ? formatDateTime(row.endsAt) : t('现在')]) }}</template>
              </DataTable>
            </div>
            <Pagination v-model:page="page" v-model:size="size" :total="terms.data.value?.total ?? 0" :loading="terms.loading.value" />
          </div>
        </details>
      </div>
    </template>

    <section v-else class="owner-section">
      <div class="owner-title">
        <h3>{{ t('负责运营') }}</h3>
        <button type="button" class="owner-link" @click="dialogOpen = true">{{ ownerName ? t('改挂') : t('指定') }}</button>
      </div>
      <p class="owner-quiet">{{ ownerName || t('待分配') }}</p>
      <SearchInput :model-value="search" :placeholder="t('搜索负责人或备注')" @update:model-value="onSearch" />
      <div class="owner-table">
        <DataTable :columns="columns" :rows="terms.data.value?.items ?? []" :row-key="(row: OwnerTerm) => row.id ?? `${row.ownerName}-${row.startsAt}`"
          :loading="terms.loading.value" :error="terms.error.value" :label="t('负责运营')" @retry="terms.reload()">
          <template #cell-range="{ row }">{{ t('{0} 至 {1}', [formatDateTime(row.startsAt), row.endsAt ? formatDateTime(row.endsAt) : t('现在')]) }}</template>
        </DataTable>
      </div>
      <Pagination v-model:page="page" v-model:size="size" :total="terms.data.value?.total ?? 0" :loading="terms.loading.value" />

      <Dialog v-if="dialogOpen" :title="ownerName ? t('改挂负责运营') : t('指定负责运营')" @close="!saving && closeForm()">
        <div class="owner-form">
          <p class="owner-current">{{ t('当前负责运营：') }}<strong>{{ ownerName || t('待分配') }}</strong></p>
          <Notice v-if="candidates.error.value" tone="danger">{{ t('平台运营加载失败：') }}{{ candidates.error.value }}</Notice>
          <p v-if="candidates.loading.value && !candidates.data.value" class="owner-quiet">{{ t('正在读取平台运营…') }}</p>
          <Notice v-if="!candidates.loading.value && !candidates.error.value && candidates.data.value?.length === 0">{{ t('暂无可指定的平台运营账号，请先启用平台运营账号。') }}</Notice>
          <div class="owner-field">
            <span class="owner-label">{{ t('平台运营') }}<em>*</em></span>
            <Select v-model="selected" :options="candidateOptions" :label="t('平台运营')" :placeholder="t('请选择')" icon="users" searchable :disabled="noCandidates" @update:model-value="error = ''" />
          </div>
          <div class="owner-field">
            <span class="owner-label">{{ t('指定原因') }}<em>*</em></span>
            <TextInput v-model="reason" multiline :rows="3" maxlength="500" :aria-label="t('指定原因')" :placeholder="t('说明本次指定或改挂的原因')" @update:model-value="error = ''" />
            <small class="owner-quiet">{{ t('必填，保存后会记入归属记录。') }}</small>
          </div>
          <Notice v-if="error" tone="danger">{{ error }}</Notice>
        </div>
        <template #footer>
          <Button :disabled="saving" @click="closeForm">{{ t('取消') }}</Button>
          <Button variant="primary" :loading="saving" :disabled="noCandidates" @click="save">{{ saving ? t('保存中…') : ownerName ? t('确认改挂') : t('确认指定') }}</Button>
        </template>
      </Dialog>
    </section>
  </template>
</template>

<style scoped>
.owner { display: grid; gap: 16px; }
.owner-section { display: grid; gap: 10px; }
.owner-form { display: grid; gap: 12px; }
.owner-title { display: flex; align-items: center; justify-content: space-between; gap: 12px; }
.owner-title h3 { margin: 0; font-size: var(--hs-text-sm); font-weight: 600; }
.owner-current { margin: 0; color: var(--hs-text-2); font-size: var(--hs-text-sm); }
.owner-current strong { color: var(--hs-text); font-weight: 600; }
.owner-field { display: grid; gap: 6px; }
.owner-label { color: var(--hs-text-2); font-size: var(--hs-text-sm); font-weight: 500; }
.owner-label em { margin-left: 2px; color: var(--hs-danger); font-style: normal; }
.owner-quiet { margin: 0; color: var(--hs-text-3); font-size: var(--hs-text-xs); }
.owner-actions { display: flex; justify-content: flex-end; gap: 8px; }
.owner-link { padding: 0; color: var(--hs-accent); background: none; border: 0; font: inherit; font-size: var(--hs-text-sm); cursor: pointer; }
.owner-link:hover { text-decoration: underline; text-underline-offset: 3px; }
.owner-table { border: 1px solid var(--hs-border); border-radius: 12px; overflow: hidden; }
.owner-history summary { color: var(--hs-text-2); font-size: var(--hs-text-sm); cursor: pointer; }
.owner-history-body { display: grid; gap: 10px; margin-top: 10px; }
</style>
