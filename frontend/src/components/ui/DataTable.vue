<script setup lang="ts" generic="Row">
// Table with skeleton loading, empty and error states. Cells render through
// `#cell-<key>` slots (falling back to row[key]); rows are clickable when a
// `row-click` listener is attached.
import { computed, getCurrentInstance } from 'vue';
import EmptyState from './EmptyState.vue';
import Button from './Button.vue';
import { t } from '../../lib/i18n';
import type { Column } from './types';

const props = withDefaults(defineProps<{
  columns: Column[];
  rows: Row[] | null | undefined;
  rowKey: (row: Row) => string | number;
  loading?: boolean;
  refreshing?: boolean;
  error?: string;
  emptyText?: string;
  emptyHint?: string;
  label: string;
  skeletonRows?: number;
  rowClass?: (row: Row) => string | Record<string, boolean> | undefined;
}>(), { skeletonRows: 5 });
const emit = defineEmits<{ 'row-click': [row: Row]; retry: [] }>();

const clickable = computed(() => !!getCurrentInstance()?.vnode.props?.onRowClick);
const showSkeleton = computed(() => props.loading && !props.rows?.length);

function onRowKey(event: KeyboardEvent, row: Row) {
  if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); emit('row-click', row); }
}
</script>

<template>
  <div class="hs-table-wrap" :class="{ refreshing }" role="region" :aria-label="label" tabindex="-1">
    <table class="hs-table">
      <colgroup><col v-for="column in columns" :key="column.key" :style="column.width ? { width: column.width } : undefined"></colgroup>
      <thead>
        <tr>
          <th v-for="column in columns" :key="column.key" scope="col" :class="[column.align ?? 'left']">{{ column.label }}</th>
        </tr>
      </thead>
      <tbody v-if="showSkeleton">
        <tr v-for="n in skeletonRows" :key="n" class="hs-table-skeleton" aria-hidden="true">
          <td v-for="column in columns" :key="column.key"><span /></td>
        </tr>
      </tbody>
      <tbody v-else-if="rows?.length">
        <tr
          v-for="row in rows"
          :key="rowKey(row)"
          :class="[rowClass?.(row), { 'is-clickable': clickable }]"
          :tabindex="clickable ? 0 : undefined"
          @click="clickable && emit('row-click', row)"
          @keydown="clickable && onRowKey($event, row)"
        >
          <td v-for="column in columns" :key="column.key" :class="[column.align ?? 'left', { nowrap: column.nowrap }]">
            <slot :name="`cell-${column.key}`" :row="row">{{ (row as Record<string, unknown>)[column.key] ?? '—' }}</slot>
          </td>
        </tr>
      </tbody>
    </table>
    <EmptyState v-if="!showSkeleton && error && !rows?.length" error :text="error" compact>
      <Button size="sm" icon="refresh" @click="emit('retry')">{{ t('重试') }}</Button>
    </EmptyState>
    <EmptyState v-else-if="!showSkeleton && !loading && !rows?.length" :text="emptyText" :hint="emptyHint" compact />
  </div>
</template>

<style scoped>
.hs-table-wrap { width: 100%; min-width: 0; overflow-x: auto; overscroll-behavior-x: contain; scrollbar-width: thin; transition: opacity .15s; }
.hs-table-wrap.refreshing { opacity: .65; }
@supports (content-visibility: auto) {
  .hs-table-wrap { content-visibility: auto; contain-intrinsic-size: auto 100% auto 280px; }
}
@supports not (content-visibility: auto) {
  .hs-table-wrap { contain: layout style paint; }
}
.hs-table { width: 100%; border-collapse: collapse; font-size: var(--hs-text-sm); white-space: nowrap; }
.hs-table th, .hs-table td { height: auto; padding: 0 14px; text-align: left; vertical-align: middle; }
.hs-table th:first-child, .hs-table td:first-child { padding-left: 20px; }
.hs-table th:last-child, .hs-table td:last-child { padding-right: 20px; }
.hs-table thead { background: var(--hs-surface-subtle); }
.hs-table th { height: 38px; color: var(--hs-text-3); border-top: 1px solid var(--hs-divider); border-bottom: 1px solid var(--hs-divider); font-size: var(--hs-text-xs); font-weight: 500; letter-spacing: 0; }
.hs-table td { height: 52px; padding-top: 10px; padding-bottom: 10px; color: var(--hs-text-2); border-bottom: 1px solid var(--hs-divider); line-height: 1.5; white-space: normal; }
.hs-table td.nowrap { white-space: nowrap; }
.hs-table tbody tr:last-child td { border-bottom: 0; }
.hs-table .right { text-align: right; }
.hs-table .center { text-align: center; }
.hs-table tr.is-clickable { cursor: pointer; transition: background .12s; }
.hs-table tr.is-clickable:hover { background: var(--hs-surface-subtle); }
.hs-table tr.is-clickable:focus-visible { outline: 2px solid var(--hs-accent); outline-offset: -2px; }
.hs-table-skeleton td span { display: block; height: 10px; max-width: 120px; background: linear-gradient(90deg, #f0f0f0, #f7f7f7, #f0f0f0); background-size: 200% 100%; border-radius: 4px; animation: shimmer 1.2s ease-in-out infinite; }
@keyframes shimmer { from { background-position: 100% 0; } to { background-position: -100% 0; } }
@media (prefers-reduced-motion: reduce) { .hs-table-skeleton td span { animation: none; } }
</style>
