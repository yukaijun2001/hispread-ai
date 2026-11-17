<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import Icon from './Icon.vue';
import Select from './Select.vue';
import { t } from '../../lib/i18n';

const props = withDefaults(defineProps<{ total: number; loading?: boolean; sizes?: number[] }>(), { sizes: () => [10, 20, 50, 100] });
const page = defineModel<number>('page', { required: true });
const size = defineModel<number>('size', { required: true });

const pageCount = computed(() => Math.max(1, Math.ceil(props.total / size.value)));
const jump = ref(String(page.value));
watch(page, (value) => { jump.value = String(value); });

const pages = computed<Array<number | '…'>>(() => {
  const count = pageCount.value;
  const current = page.value;
  if (count <= 7) return Array.from({ length: count }, (_, i) => i + 1);
  const set = new Set([1, count, current - 1, current, current + 1].filter((p) => p >= 1 && p <= count));
  const sorted = [...set].sort((a, b) => a - b);
  const result: Array<number | '…'> = [];
  sorted.forEach((value, index) => {
    if (index && value - sorted[index - 1] > 1) result.push('…');
    result.push(value);
  });
  return result;
});

const sizeValue = computed({
  get: () => String(size.value),
  set: (value: string) => { size.value = Number(value); page.value = 1; },
});
const sizeOptions = computed(() => props.sizes.map((value) => ({ value: String(value), label: t('{0} 条/页', [value]) })));

function go(target: number) {
  const next = Math.min(Math.max(1, target), pageCount.value);
  if (next !== page.value) page.value = next;
}
function submitJump() {
  const value = Number(jump.value);
  if (Number.isInteger(value)) go(value);
  else jump.value = String(page.value);
}
</script>

<template>
  <nav class="hs-pagination" :aria-label="t('分页')">
    <span class="hs-pagination-total">{{ t('共 {0} 条记录', [total]) }}</span>
    <div class="hs-pagination-controls">
      <div class="hs-pagination-size"><Select v-model="sizeValue" :options="sizeOptions" :label="t('每页条数')" size="sm" /></div>
      <button type="button" class="hs-page" :disabled="page <= 1 || loading" :aria-label="t('上一页')" @click="go(page - 1)">
        <Icon name="chevron" :size="14" class="flip" />
      </button>
      <template v-for="(item, index) in pages" :key="`${item}-${index}`">
        <span v-if="item === '…'" class="hs-page-gap">…</span>
        <button
          v-else
          type="button"
          class="hs-page"
          :class="{ active: item === page }"
          :aria-current="item === page ? 'page' : undefined"
          :disabled="loading && item !== page"
          @click="go(item)"
        >{{ item }}</button>
      </template>
      <button type="button" class="hs-page" :disabled="page >= pageCount || loading" :aria-label="t('下一页')" @click="go(page + 1)">
        <Icon name="chevron" :size="14" />
      </button>
      <label v-if="pageCount > 7" class="hs-pagination-jump">
        {{ t('跳至') }}
        <input v-model="jump" inputmode="numeric" :aria-label="t('跳转页码')" @keydown.enter="submitJump" @blur="submitJump" />
        {{ t('页') }}
      </label>
    </div>
  </nav>
</template>

<style scoped>
.hs-pagination { display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: 10px 16px; padding: 12px 20px; color: var(--hs-text-3); border-top: 1px solid var(--hs-divider); font-size: var(--hs-text-xs); }
.hs-pagination-total { white-space: nowrap; font-variant-numeric: tabular-nums; }
.hs-pagination-controls { display: flex; flex-wrap: wrap; align-items: center; gap: 4px; margin-left: auto; }
.hs-pagination-size { width: 104px; margin-right: 6px; }
.hs-page {
  display: grid; place-items: center;
  min-width: 30px; height: 30px; min-height: 0; padding: 0 6px;
  color: var(--hs-text-2); background: none; border: 1px solid transparent; border-radius: 8px;
  font: inherit; font-size: var(--hs-text-xs); font-variant-numeric: tabular-nums; cursor: pointer;
}
.hs-page:hover:not(:disabled):not(.active) { background: var(--hs-surface-hover); }
.hs-page.active { color: var(--hs-text); background: var(--hs-surface); border-color: var(--hs-border-strong); box-shadow: var(--hs-shadow-control); font-weight: 600; cursor: default; }
.hs-page:disabled:not(.active) { color: var(--hs-text-4); cursor: default; }
.hs-page:focus-visible { outline: none; box-shadow: var(--hs-accent-ring); }
.hs-page-gap { min-width: 20px; text-align: center; }
.flip { transform: rotate(180deg); }
.hs-pagination-jump { display: flex; align-items: center; gap: 6px; margin-left: 8px; white-space: nowrap; }
.hs-pagination-jump input { width: 48px; height: 30px; padding: 0 6px; text-align: center; color: var(--hs-text); background: var(--hs-surface); border: 1px solid var(--hs-border-strong); border-radius: 8px; font: inherit; box-shadow: none; }
.hs-pagination-jump input:focus { outline: none; border-color: var(--hs-accent); box-shadow: var(--hs-accent-ring); }
</style>
