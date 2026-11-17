<script setup lang="ts">
// One row of the quota allocation tables (a delivery group or a member).
import Button from '../../components/ui/Button.vue';
import Select from '../../components/ui/Select.vue';
import TextInput from '../../components/ui/TextInput.vue';
import { t } from '../../lib/i18n';
import { CATEGORIES, formatCount, type AllocationRow, type Category } from './intakeAllocation';
import type { SelectOption } from '../../components/ui/types';

defineProps<{
  row: AllocationRow;
  title: string;
  subtitle?: string;
  disabled: boolean;
  sourceOptions?: SelectOption[];
  count: (row: AllocationRow, field: Category) => number | null;
  used: (source: string, field: Category) => number | undefined;
}>();
const emit = defineEmits<{ update: [patch: Partial<AllocationRow>]; reclaim: [] }>();
const categoryName = (field: Category) => (field === 'pro' ? 'PRO' : t('非PRO'));
</script>

<template>
  <tr>
    <th scope="row">
      <strong>{{ title }}</strong>
      <small v-if="subtitle && subtitle !== title">{{ subtitle }}</small>
      <small v-if="row.kind === 'GROUP'">{{ t('供应商总额度') }}</small>
    </th>
    <td>
      <label v-if="row.kind === 'GROUP'" class="alloc-switch">
        <input
          type="checkbox"
          role="switch"
          :aria-label="t('允许{0}上 PRO', [title])"
          :checked="row.allowPro !== false"
          :disabled="disabled"
          @change="emit('update', { allowPro: ($event.target as HTMLInputElement).checked })"
        >
        <span class="alloc-track" aria-hidden="true" />
        <span>{{ row.allowPro === false ? t('已关闭') : t('允许') }}</span>
      </label>
      <div v-else class="alloc-source">
        <Select
          :model-value="row.parentGroupId ?? ''"
          :options="sourceOptions ?? []"
          :label="t('{0}额度来源', [title])"
          :disabled="disabled"
          size="sm"
          @update:model-value="emit('update', { parentGroupId: String($event) || null })"
        />
      </div>
    </td>
    <td v-for="field in CATEGORIES" :key="field">
      <div class="alloc-ratio">
        <TextInput
          :model-value="row[field]"
          type="number"
          min="0"
          max="100"
          step="0.01"
          size="sm"
          suffix="%"
          :placeholder="t('共享')"
          :disabled="disabled"
          :aria-label="t('{0}：{1}分配比例', [title, categoryName(field)])"
          @update:model-value="emit('update', { [field]: $event })"
        />
      </div>
      <small class="alloc-meta">
        <template v-if="row[field].trim() !== ''">{{ count(row, field) === null ? t('请先明确上级数量') : t('每日{0}个', [formatCount(count(row, field))]) }}<span aria-hidden="true"> · </span></template>{{ t('今日已用：{0}', [used(row.key, field) === undefined ? '—' : formatCount(used(row.key, field)!)]) }}
      </small>
    </td>
    <td>
      <Button size="sm" variant="ghost" :aria-label="t('{0}：回收未用额度', [title])" :disabled="disabled || (row.pro === '' && row.nonPro === '')" @click="emit('reclaim')">{{ t('回收额度') }}</Button>
    </td>
  </tr>
</template>

<style scoped>
th, td { padding: 10px 12px; text-align: left; vertical-align: top; border-bottom: 1px solid var(--hs-divider); }
th { font-weight: 400; }
th strong { display: block; color: var(--hs-text); font-size: var(--hs-text-sm); font-weight: 500; }
th small { display: block; color: var(--hs-text-3); font-size: var(--hs-text-xs); }
.alloc-source { min-width: 170px; }
.alloc-ratio { width: 120px; }
.alloc-meta { display: block; margin-top: 4px; color: var(--hs-text-3); font-size: 11px; font-variant-numeric: tabular-nums; white-space: nowrap; }
.alloc-switch { position: relative; display: inline-flex; align-items: center; gap: 8px; color: var(--hs-text-2); font-size: var(--hs-text-xs); cursor: pointer; }
.alloc-switch input { position: absolute; width: 1px; height: 1px; opacity: 0; }
.alloc-track { position: relative; width: 32px; height: 18px; background: var(--hs-border-strong); border-radius: 999px; transition: background .15s; }
.alloc-track::after { content: ''; position: absolute; top: 2px; left: 2px; width: 14px; height: 14px; background: #fff; border-radius: 50%; box-shadow: 0 1px 2px rgb(0 0 0 / 20%); transition: transform .15s; }
.alloc-switch input:checked + .alloc-track { background: var(--hs-accent); }
.alloc-switch input:checked + .alloc-track::after { transform: translateX(14px); }
.alloc-switch input:focus-visible + .alloc-track { box-shadow: var(--hs-accent-ring); }
.alloc-switch input:disabled + .alloc-track { opacity: .5; }
</style>
