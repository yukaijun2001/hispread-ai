<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import Card from '../../components/ui/Card.vue';
import Segmented from '../../components/ui/Segmented.vue';
import Button from '../../components/ui/Button.vue';
import Icon from '../../components/ui/Icon.vue';
import EmptyState from '../../components/ui/EmptyState.vue';
import Notice from '../../components/ui/Notice.vue';
import type { IconName } from '../../components/ui/icons';
import { useApiData } from '../../composables/useApiData';
import { t, translateServerMessage } from '../../lib/i18n';
import { formatDateTime, formatMoney } from '../../lib/money';
import { openTarget } from '../../navigation/navigate';
import { factValue, TASK_GROUPS, taskActionLabel, taskKindLabel, taskSummary, type WorkbenchTask } from './tasks';

const tasks = useApiData<{ items: WorkbenchTask[]; limited?: boolean }>('/workbench/tasks');
const filter = ref<string>('all');
const showAll = ref(false);
const expanded = ref('');

const items = computed(() => tasks.data.value?.items ?? []);
const groupedKinds = new Set<string>(TASK_GROUPS.flatMap((group) => group.kinds));
const filters = computed(() => {
  const other = items.value.filter((task) => !groupedKinds.has(task.kind)).length;
  return [
    { value: 'all', label: t('全部'), count: items.value.length },
    ...TASK_GROUPS
      .map((group) => ({ value: group.id as string, label: t(group.label), count: items.value.filter((task) => (group.kinds as readonly string[]).includes(task.kind)).length }))
      .filter((option) => option.count > 0),
    ...(other ? [{ value: 'other', label: t('其他'), count: other }] : []),
  ];
});
const activeFilter = computed(() => (filters.value.some((option) => option.value === filter.value) ? filter.value : 'all'));
const filtered = computed(() => items.value.filter((task) => {
  if (activeFilter.value === 'all') return true;
  if (activeFilter.value === 'other') return !groupedKinds.has(task.kind);
  const group = TASK_GROUPS.find((entry) => entry.id === activeFilter.value);
  return !group || (group.kinds as readonly string[]).includes(task.kind);
}));
const visible = computed(() => (showAll.value ? filtered.value : filtered.value.slice(0, 5)));

watch(filter, () => { showAll.value = false; expanded.value = ''; });

const key = (task: WorkbenchTask) => `${task.kind}-${task.id}`;
const icon = (task: WorkbenchTask): IconName => (task.targetPath.startsWith('quotes') ? 'quote' : task.targetPath.startsWith('settlements') ? 'wallet' : 'users');
const tones = ['accent', 'teal', 'amber'];
</script>

<template>
  <Card :title="t('待办事项')" flush>
    <template #actions>
      <Segmented v-if="tasks.data.value && items.length" v-model="filter" :options="filters" :label="t('待办分类')" />
    </template>
    <Notice v-if="tasks.data.value?.limited" class="limited">{{ t('当前只显示最近 200 条。处理完这些之后，刷新即可看到更早的待办。') }}</Notice>
    <div v-if="tasks.error.value && !tasks.data.value" class="state">
      <EmptyState error :text="tasks.error.value" compact>
        <Button size="sm" icon="refresh" @click="tasks.reload()">{{ t('重试') }}</Button>
      </EmptyState>
    </div>
    <div v-else-if="!tasks.data.value" class="skeleton" aria-hidden="true"><span v-for="n in 3" :key="n" /></div>
    <EmptyState v-else-if="!visible.length" icon="check" :text="t('暂无待处理事项')" :hint="t('新的审核、核对和付款事项会出现在这里。')" compact />
    <ul v-else id="workbench-task-list" class="tasks">
      <li v-for="(task, index) in visible" :key="key(task)" class="task" :class="{ open: expanded === key(task) }">
        <button
          type="button"
          class="row"
          :aria-expanded="expanded === key(task)"
          :aria-controls="`task-detail-${key(task)}`"
          @click="expanded = expanded === key(task) ? '' : key(task)"
        >
          <span class="tile" :class="tones[index % 3]"><Icon :name="icon(task)" :size="16" /></span>
          <span class="main">
            <strong>{{ task.title }}</strong>
            <span class="kind">{{ taskKindLabel(task) }}<template v-if="task.summary"> · {{ taskSummary(task) }}</template></span>
          </span>
          <span class="side">
            <span v-if="task.supplierName" class="supplier">{{ task.supplierName }}</span>
            <b v-if="task.amount != null && task.currency">{{ task.currency }} {{ formatMoney(task.amount, task.currency) }}</b>
          </span>
          <time :datetime="task.createdAt">{{ formatDateTime(task.createdAt) }}</time>
          <Icon name="chevron" :size="15" class="chevron" />
        </button>
        <div v-if="expanded === key(task)" :id="`task-detail-${key(task)}`" class="detail">
          <dl v-if="task.facts.length" class="facts">
            <div v-for="fact in task.facts" :key="fact.label">
              <dt>{{ translateServerMessage(fact.label) }}</dt>
              <dd>{{ factValue(fact) }}</dd>
            </div>
          </dl>
          <p v-else-if="task.detail" class="detail-text">{{ taskSummary(task, task.detail) }}</p>
          <Button variant="primary" size="sm" trailing-icon="arrow" @click="openTarget(task.targetPath)">{{ taskActionLabel(task) }}</Button>
        </div>
      </li>
    </ul>
    <template v-if="filtered.length > 5" #footer>
      <button type="button" class="more" aria-controls="workbench-task-list" :aria-expanded="showAll" @click="showAll = !showAll">
        {{ showAll ? t('收起') : t('展开全部 {0} 项', [filtered.length]) }}
      </button>
    </template>
  </Card>
</template>

<style scoped>
.limited { margin: 0 20px 12px; }
.state { padding: 4px 0 8px; }
.skeleton { display: grid; gap: 10px; padding: 8px 20px 20px; }
.skeleton span { height: 44px; border-radius: 10px; background: linear-gradient(90deg, #f3f3f3, #f9f9f9, #f3f3f3); background-size: 200% 100%; animation: shimmer 1.2s ease-in-out infinite; }
@keyframes shimmer { from { background-position: 100% 0; } to { background-position: -100% 0; } }
.tasks { margin: 0; padding: 0; list-style: none; }
.task { border-top: 1px solid var(--hs-divider); }
.row {
  display: grid; grid-template-columns: 32px minmax(0, 1fr) auto auto 16px; align-items: center; gap: 14px;
  width: 100%; min-height: 0; padding: 12px 20px;
  color: var(--hs-text); background: none; border: 0; border-radius: 0;
  font: inherit; text-align: left; cursor: pointer;
}
.row:hover, .task.open .row { background: var(--hs-surface-subtle); }
.row:focus-visible { outline: 2px solid var(--hs-accent); outline-offset: -2px; }
.tile { display: grid; place-items: center; width: 32px; height: 32px; border-radius: 9px; }
.tile.accent { color: var(--hs-accent); background: var(--hs-accent-soft); }
.tile.teal { color: var(--hs-teal); background: var(--hs-teal-soft); }
.tile.amber { color: #b07a22; background: var(--hs-warning-soft); }
.main { display: grid; gap: 2px; min-width: 0; }
.main strong { overflow: hidden; font-size: var(--hs-text-sm); font-weight: 500; text-overflow: ellipsis; white-space: nowrap; }
.kind { overflow: hidden; color: var(--hs-text-3); font-size: var(--hs-text-xs); text-overflow: ellipsis; white-space: nowrap; }
.side { display: flex; align-items: center; gap: 10px; color: var(--hs-text-2); font-size: var(--hs-text-xs); }
.side b { color: var(--hs-text); font-weight: 600; font-variant-numeric: tabular-nums; }
.supplier { max-width: 140px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
time { color: var(--hs-text-4); font-size: var(--hs-text-xs); font-variant-numeric: tabular-nums; white-space: nowrap; }
.chevron { color: var(--hs-text-4); transition: transform .15s; }
.task.open .chevron { transform: rotate(90deg); }
.detail { display: grid; gap: 14px; justify-items: start; padding: 4px 20px 16px 66px; background: var(--hs-surface-subtle); }
.facts { display: grid; grid-template-columns: repeat(auto-fill, minmax(180px, 1fr)); gap: 10px 24px; width: 100%; margin: 0; }
.facts dt { color: var(--hs-text-3); font-size: var(--hs-text-xs); }
.facts dd { margin: 2px 0 0; color: var(--hs-text); font-size: var(--hs-text-sm); overflow-wrap: anywhere; }
.detail-text { margin: 0; color: var(--hs-text-2); font-size: var(--hs-text-sm); line-height: 1.7; }
.more { min-height: 0; padding: 0; color: var(--hs-text-2); background: none; border: 0; font: inherit; font-size: var(--hs-text-xs); cursor: pointer; }
.more:hover { color: var(--hs-text); }
@media (max-width: 760px) {
  .row { grid-template-columns: 32px minmax(0, 1fr) 16px; }
  .side, time { display: none; }
  .detail { padding-left: 20px; }
}
</style>
