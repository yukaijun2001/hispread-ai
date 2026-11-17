<script setup lang="ts">
// CC每日上号额度分配: the supplier main account divides its daily PRO / non-PRO
// onboarding quota among delivery groups and members, and switches PRO per group.
import { computed, ref, watch } from 'vue';
import Dialog from '../../components/ui/Dialog.vue';
import Button from '../../components/ui/Button.vue';
import Notice from '../../components/ui/Notice.vue';
import SearchInput from '../../components/ui/SearchInput.vue';
import Select from '../../components/ui/Select.vue';
import Spinner from '../../components/ui/Spinner.vue';
import AllocationRow from './AllocationRow.vue';
import { useApiData } from '../../composables/useApiData';
import { apiPut } from '../../lib/api';
import { t } from '../../lib/i18n';
import { useSessionStore } from '../../stores/session';
import {
  allocationMath, buildAllocations, CATEGORIES, formatCount, rowsFrom,
  type AllocationData, type AllocationRow as Row, type Category,
} from './intakeAllocation';
import type { SelectOption } from '../../components/ui/types';

const emit = defineEmits<{ close: [] }>();
const session = useSessionStore();
const PAGE_SIZE = 20;

const allowed = computed(() => session.user?.role === 'SUPPLIER' && session.has('supplier.agent.manage'));
const source = useApiData<AllocationData>(() => (allowed.value ? '/cc-intake/allocations' : null));
const current = ref<AllocationData | null>(null);
const rows = ref<Row[]>([]);
const search = ref('');
const groupFilter = ref('');
const allocatedOnly = ref(false);
const page = ref(1);
const saving = ref(false);
const error = ref('');

function reset(data: AllocationData) {
  current.value = data;
  error.value = '';
  rows.value = rowsFrom(data);
}
watch(() => source.data.value, (data) => { if (data) reset(data); }, { immediate: true });

const patch = (key: string, change: Partial<Row>) => { rows.value = rows.value.map((row) => (row.key === key ? { ...row, ...change } : row)); };
const math = computed(() => (current.value ? allocationMath(current.value, rows.value) : null));
const count = (row: Row, field: Category) => math.value?.count(row, field) ?? null;
const used = (key: string, field: Category) => math.value?.used(key, field);
const remaining = (key: string, field: Category) => math.value?.remaining(key, field) ?? null;

const groupRows = computed(() => rows.value.filter((row) => row.kind === 'GROUP'));
const memberRows = computed(() => {
  const data = current.value;
  const term = search.value.trim().toLocaleLowerCase();
  return rows.value.filter((row) => {
    if (row.kind !== 'USER') return false;
    const member = data?.members.find((entry) => entry.id === row.subjectId);
    return (!term || [member?.username, member?.displayName].some((value) => value?.toLocaleLowerCase().includes(term)))
      && (!groupFilter.value || !!data?.memberships.some((entry) => entry.userId === row.subjectId && entry.groupId === groupFilter.value))
      && (!allocatedOnly.value || row.pro !== '' || row.nonPro !== '');
  });
});
const pageCount = computed(() => Math.ceil(memberRows.value.length / PAGE_SIZE));
watch(() => memberRows.value.length, () => { page.value = Math.max(1, Math.min(page.value, pageCount.value)); });
watch([search, groupFilter, allocatedOnly], () => { page.value = 1; });
const pageRows = computed(() => memberRows.value.slice((page.value - 1) * PAGE_SIZE, page.value * PAGE_SIZE));
const balanceRows = computed(() => groupRows.value.filter((row) => row.pro !== '' || row.nonPro !== ''));

const groupName = (id: string) => current.value?.groups.find((group) => group.id === id)?.name;
const memberOf = (id: string) => current.value?.members.find((member) => member.id === id);
const groupOptions = computed(() => [{ value: '', label: t('全部交付组') }, ...(current.value?.groups ?? []).map((group) => ({ value: group.id, label: group.name }))]);

/** Supplier pool, the member's current group, and (if different) the group the allocation still points at. */
function sourceOptions(row: Row): SelectOption[] {
  const data = current.value;
  const groupId = data?.memberships.find((entry) => entry.userId === row.subjectId)?.groupId ?? null;
  const group = data?.groups.find((entry) => entry.id === groupId);
  const previousId = data?.allocations.find((entry) => entry.kind === 'USER' && entry.subjectId === row.subjectId)?.parentGroupId;
  const previous = previousId && previousId !== groupId ? { id: previousId, name: groupName(previousId) || t('原交付组') } : null;
  return [
    { value: '', label: t('供应商直接划拨') },
    ...(group ? [{ value: group.id, label: t('来自{0}', [group.name]) }] : []),
    ...(previous ? [{ value: previous.id, label: t('原额度来源：{0}', [previous.name]) }] : []),
  ];
}

function reclaim(row: Row) {
  if (row.kind === 'GROUP' && rows.value.some((child) => child.parentGroupId === row.subjectId && (child.pro !== '' || child.nonPro !== ''))) {
    error.value = t('回收交付组额度前，请先回收或调整组内个人划拨。');
    return;
  }
  patch(row.key, { pro: '', nonPro: '' });
}

async function submit() {
  const data = current.value;
  if (!data || saving.value) return;
  error.value = '';
  const allocations = buildAllocations(rows.value);
  if (typeof allocations === 'string') { error.value = allocations; return; }
  saving.value = true;
  try {
    const saved = await apiPut<AllocationData>('/cc-intake/allocations', {
      allocations,
      groupPro: groupRows.value
        .filter((row) => row.allowPro !== (data.groups.find((group) => group.id === row.subjectId)?.allowPro !== false))
        .map((row) => ({ id: row.subjectId, allowPro: row.allowPro !== false, version: data.groups.find((group) => group.id === row.subjectId)!.version })),
      version: data.version,
    });
    reset(saved);
    session.notify(t('上号额度分配已保存'));
    session.refresh();
  } catch (reason) {
    error.value = (reason as Error).message;
  } finally {
    saving.value = false;
  }
}

const categoryName = (field: Category) => (field === 'pro' ? 'PRO' : t('非PRO'));
const limitOf = (field: Category) => (field === 'pro' ? current.value!.proLimit : current.value!.nonProLimit);
</script>

<template>
  <Dialog :title="t('CC每日上号额度分配')" size="xl" @close="emit('close')">
    <Notice v-if="!allowed" tone="danger">{{ t('仅供应商主账号可分配额度') }}</Notice>
    <Notice v-else-if="source.error.value && !current" tone="danger">
      {{ source.error.value }}
      <template #actions><Button size="sm" @click="source.reload()">{{ t('重新加载') }}</Button></template>
    </Notice>
    <form v-else-if="current" class="alloc-body" @submit.prevent="submit">
      <Notice tone="warning">{{ t('划拨及交付组 PRO 开关用于后续原生 OAuth 上号。已用和处理中预留均占额；回收只释放未用额度，个人当天回收后次日恢复共享。') }}</Notice>
      <div class="alloc-summary">
        <div v-for="field in CATEGORIES" :key="field">
          <strong>{{ categoryName(field) }}</strong>
          <span>{{ t('每日额度') }} <b>{{ formatCount(limitOf(field)) }}</b></span>
          <span>{{ t('共享剩余') }} <b>{{ formatCount(remaining('S', field)) }}</b></span>
        </div>
      </div>
      <p class="alloc-hint">
        {{ t('留空共享，0%不分配。') }}
        <span v-if="current.proLimit === null || current.nonProLimit === null">{{ t('比例划拨需先由平台设置每日数量。') }}</span>
      </p>

      <div class="alloc-heading">
        <h3>{{ t('交付组划拨') }}</h3>
        <span>{{ t('关闭 PRO 不影响非PRO，保留原额度配置。') }}</span>
      </div>
      <div class="alloc-table-wrap" role="region" :aria-label="t('交付组上号额度分配')" tabindex="-1">
        <table class="alloc-table">
          <thead><tr><th>{{ t('交付组') }}</th><th>{{ t('允许 PRO') }}</th><th>PRO</th><th>{{ t('非PRO') }}</th><th>{{ t('操作') }}</th></tr></thead>
          <tbody>
            <tr v-if="!current.groups.length"><td colspan="5" class="alloc-empty">{{ t('暂无交付组') }}</td></tr>
            <AllocationRow
              v-for="row in groupRows"
              :key="row.key"
              :row="row"
              :title="groupName(row.subjectId) || '—'"
              :disabled="saving"
              :count="count"
              :used="used"
              @update="patch(row.key, $event)"
              @reclaim="reclaim(row)"
            />
          </tbody>
        </table>
      </div>

      <div class="alloc-heading">
        <h3>{{ t('个人划拨') }}</h3>
        <span>{{ t('{0}位成员', [current.members.length]) }}</span>
      </div>
      <div class="alloc-filters">
        <SearchInput v-model="search" class="alloc-search" :placeholder="t('搜索成员姓名或账号')" :label="t('搜索成员姓名或账号')" />
        <div class="alloc-group"><Select v-model="groupFilter" :options="groupOptions" :label="t('按交付组筛选成员')" :placeholder="t('全部交付组')" /></div>
        <label class="alloc-check"><input v-model="allocatedOnly" type="checkbox">{{ t('仅看已划拨成员') }}</label>
      </div>
      <p v-if="search || groupFilter || allocatedOnly" class="alloc-hint">{{ t('显示{0}／{1}位成员', [memberRows.length, current.members.length]) }}</p>
      <div class="alloc-table-wrap" role="region" :aria-label="t('个人上号额度分配')" tabindex="-1">
        <table class="alloc-table">
          <thead><tr><th>{{ t('成员') }}</th><th>{{ t('额度来源') }}</th><th>PRO</th><th>{{ t('非PRO') }}</th><th>{{ t('操作') }}</th></tr></thead>
          <tbody>
            <tr v-if="!memberRows.length"><td colspan="5" class="alloc-empty">{{ t('暂无匹配成员') }}</td></tr>
            <AllocationRow
              v-for="row in pageRows"
              :key="row.key"
              :row="row"
              :title="memberOf(row.subjectId)?.displayName || memberOf(row.subjectId)?.username || '—'"
              :subtitle="memberOf(row.subjectId)?.username"
              :source-options="sourceOptions(row)"
              :disabled="saving"
              :count="count"
              :used="used"
              @update="patch(row.key, $event)"
              @reclaim="reclaim(row)"
            />
          </tbody>
        </table>
      </div>
      <div v-if="memberRows.length > PAGE_SIZE" class="alloc-pages">
        <Button size="sm" :disabled="page <= 1" @click="page--">{{ t('上一页') }}</Button>
        <span>{{ t('第 {0} / 共 {1} 页', [page, pageCount]) }}</span>
        <Button size="sm" :disabled="page * PAGE_SIZE >= memberRows.length" @click="page++">{{ t('下一页') }}</Button>
      </div>

      <div v-if="balanceRows.length" class="alloc-balances">
        <p v-for="row in balanceRows" :key="row.key">
          <strong>{{ groupName(row.subjectId) }}</strong> {{ t('组内共享剩余') }}：PRO {{ row.pro === '' ? t('跟随供应商共享') : formatCount(remaining(row.key, 'pro')) }} · {{ t('非PRO') }} {{ row.nonPro === '' ? t('跟随供应商共享') : formatCount(remaining(row.key, 'nonPro')) }}
        </p>
      </div>
      <p class="alloc-hint">{{ t('回收仅释放未用额度，当日已用保留。') }}</p>
      <Notice v-if="error" tone="danger">{{ error }}</Notice>
    </form>
    <div v-else class="alloc-loading"><Spinner :size="16" /></div>
    <template v-if="allowed && current" #footer>
      <Button :disabled="saving" @click="reset(current)">{{ t('恢复当前值') }}</Button>
      <Button variant="primary" :loading="saving" :disabled="saving" @click="submit">{{ saving ? t('保存中…') : t('保存额度分配') }}</Button>
    </template>
  </Dialog>
</template>

<style scoped>
.alloc-body { display: grid; gap: 14px; }
.alloc-loading { display: grid; place-items: center; padding: 32px; color: var(--hs-text-3); }
.alloc-summary { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
.alloc-summary > div { display: flex; flex-wrap: wrap; align-items: baseline; gap: 6px 16px; padding: 12px 14px; background: var(--hs-surface-subtle); border: 1px solid var(--hs-border); border-radius: 12px; }
.alloc-summary strong { color: var(--hs-text); font-size: var(--hs-text-sm); font-weight: 600; }
.alloc-summary span { color: var(--hs-text-3); font-size: var(--hs-text-xs); }
.alloc-summary b { color: var(--hs-text); font-size: var(--hs-text-md); font-weight: 600; font-variant-numeric: tabular-nums; }
.alloc-hint { margin: 0; color: var(--hs-text-3); font-size: var(--hs-text-xs); line-height: 1.7; }
.alloc-hint span { margin-left: 6px; color: var(--hs-warning); }
.alloc-heading { display: flex; flex-wrap: wrap; align-items: baseline; gap: 4px 10px; margin-top: 4px; }
.alloc-heading h3 { margin: 0; font-size: var(--hs-text-sm); font-weight: 600; }
.alloc-heading span { color: var(--hs-text-3); font-size: var(--hs-text-xs); }
.alloc-table-wrap { overflow-x: auto; border: 1px solid var(--hs-border); border-radius: 12px; }
.alloc-table { width: 100%; min-width: 720px; border-collapse: collapse; font-size: var(--hs-text-sm); }
.alloc-table thead { background: var(--hs-surface-subtle); }
.alloc-table th { height: 36px; padding: 0 12px; color: var(--hs-text-3); font-size: var(--hs-text-xs); font-weight: 500; text-align: left; white-space: nowrap; border-bottom: 1px solid var(--hs-divider); }
.alloc-empty { padding: 18px 12px; color: var(--hs-text-3); text-align: center; }
.alloc-filters { display: flex; flex-wrap: wrap; align-items: center; gap: 8px; }
.alloc-search { flex: 1 1 220px; }
.alloc-group { flex: 0 1 200px; min-width: 160px; }
.alloc-check { display: inline-flex; align-items: center; gap: 6px; color: var(--hs-text-2); font-size: var(--hs-text-sm); cursor: pointer; }
.alloc-check input { accent-color: var(--hs-accent); }
.alloc-pages { display: flex; align-items: center; justify-content: flex-end; gap: 10px; color: var(--hs-text-3); font-size: var(--hs-text-xs); }
.alloc-balances { display: grid; gap: 4px; padding: 10px 14px; background: var(--hs-surface-subtle); border-radius: 12px; }
.alloc-balances p { margin: 0; color: var(--hs-text-2); font-size: var(--hs-text-xs); font-variant-numeric: tabular-nums; }
.alloc-balances strong { color: var(--hs-text); font-weight: 600; }
@media (max-width: 640px) { .alloc-summary { grid-template-columns: 1fr; } }
</style>
