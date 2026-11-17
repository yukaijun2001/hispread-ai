<script setup lang="ts">
// Grouped daily ledger: by day (date × supplier × project) or by supplier
// (supplier × currency × pricing). Amount columns are sortable in the supplier
// view; the footer carries one total row per currency from the summary.
import { computed } from 'vue';
import MoneyDisplay from './MoneyDisplay.vue';
import { formatDiscount, t } from '../../../lib/i18n';
import { formatMoney } from '../../../lib/money';
import type { DailyGroup, DailyTotal, SortKey } from './daily';

const props = defineProps<{
  bySupplier: boolean;
  items: DailyGroup[];
  totals: DailyTotal[];
  showPending: boolean;
  showConfirmed: boolean;
  sortBy: string;
  sortDirection: 'ASC' | 'DESC';
}>();
const emit = defineEmits<{ sort: [key: SortKey] }>();

interface Head { key: string; label: string; sort?: SortKey; numeric?: boolean }
const heads = computed<Head[]>(() => [
  ...(props.bySupplier ? [] : [{ key: 'date', label: t('业务日期') }]),
  { key: 'name', label: t(props.bySupplier ? '供应商' : '供应商 / 项目') },
  ...(props.bySupplier ? [
    { key: 'pricing', label: t('折扣 / 单价') },
    { key: 'consumption', label: t('消耗合计'), sort: 'consumptionTotal' as const, numeric: true },
  ] : []),
  ...(props.showPending ? [{ key: 'pending', label: t('待计价消耗'), sort: 'pendingConsumption' as const, numeric: true }] : []),
  ...(props.showConfirmed ? [
    { key: 'confirmed', label: t('入账原始金额'), sort: 'confirmedOriginal' as const, numeric: true },
    { key: 'payable', label: t('入账应付'), sort: 'payableTotal' as const, numeric: true },
  ] : []),
]);

// Sorting cycles high → low, low → high, off.
const direction = (key: SortKey) => (props.sortBy === key ? props.sortDirection : null);
const ariaSort = (key: SortKey) => (direction(key) === 'ASC' ? 'ascending' : direction(key) === 'DESC' ? 'descending' : 'none');
const sortHint = (key: SortKey) => t(direction(key) ? (direction(key) === 'DESC' ? '按金额从低到高排序' : '取消金额排序') : '按金额从高到低排序');
const arrow = (key: SortKey) => (direction(key) === 'ASC' ? ' ↑' : direction(key) === 'DESC' ? ' ↓' : ' ↕');

function pricing(group: DailyGroup) {
  if (group.pricingType === 'DISCOUNT' && group.settlementMultiplier != null) return formatDiscount(group.settlementMultiplier);
  if (group.pricingType === 'FIXED' && group.settlementUnitPrice != null) return `${group.currency} ${group.settlementUnitPrice} ${t('/ 个')}`;
  return group.pricingType === 'DIRECT' ? t('直接录入') : '—';
}
function pricingNote(group: DailyGroup) {
  if (group.pricingType === 'UNAVAILABLE') return t('报价未提供或不唯一');
  return group.pendingCount > 0 ? t('待计价部分仅供参考') : t('入账时计价依据');
}
const rowKey = (group: DailyGroup) => [group.businessDate, group.supplierId, group.projectId, group.currency, group.pricingType, group.settlementMultiplier, group.settlementUnitPrice].join(':');
</script>

<template>
  <div class="wrap" role="region" :aria-label="t('日账分组汇总')" tabindex="-1">
    <table class="grid">
      <thead>
        <tr>
          <th v-for="head in heads" :key="head.key" :class="{ num: head.numeric }" :aria-sort="bySupplier && head.sort ? ariaSort(head.sort) : undefined">
            <button v-if="bySupplier && head.sort" type="button" class="sort" :class="{ active: sortBy === head.sort }"
              :aria-label="t('{0}：{1}', [head.label, sortHint(head.sort)])" :title="sortHint(head.sort)" @click="emit('sort', head.sort)">
              {{ head.label }}<span aria-hidden="true">{{ arrow(head.sort) }}</span>
            </button>
            <template v-else>{{ head.label }}</template>
          </th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="group in items" :key="rowKey(group)">
          <td v-for="head in heads" :key="head.key" :class="{ num: head.numeric }">
            <span v-if="head.key === 'date'" class="date">{{ group.businessDate || '—' }}</span>
            <div v-else-if="head.key === 'name'" class="cell">
              <strong>{{ group.supplierName }}</strong>
              <small>{{ bySupplier ? group.currency : `${group.projectName} · ${group.currency}` }}</small>
            </div>
            <div v-else-if="head.key === 'pricing'" class="cell">
              <strong>{{ pricing(group) }}</strong>
              <small>{{ pricingNote(group) }}</small>
            </div>
            <div v-else-if="head.key === 'consumption'" class="cell">
              <strong><MoneyDisplay :currency="group.currency" :value="group.consumptionTotal" /></strong>
              <small>{{ group.pendingCount + group.confirmedCount }} {{ t('条记录') }}</small>
            </div>
            <template v-else-if="head.key === 'pending'">
              <div v-if="group.pendingCount > 0" class="cell">
                <strong><MoneyDisplay :currency="group.currency" :value="group.pendingConsumption" /></strong>
                <small>{{ group.pendingCount }} {{ t('条待计价') }}</small>
              </div>
              <span v-else class="none">—</span>
            </template>
            <template v-else-if="head.key === 'confirmed'">
              <div v-if="group.confirmedCount > 0" class="cell">
                <strong><MoneyDisplay :currency="group.currency" :value="group.confirmedOriginal" /></strong>
                <small>{{ group.confirmedCount }} {{ t('条已入账') }}</small>
              </div>
              <span v-else class="none">—</span>
            </template>
            <template v-else-if="head.key === 'payable'">
              <strong v-if="group.confirmedCount > 0" class="amount">{{ group.currency }} {{ formatMoney(group.payableTotal, group.currency) }}</strong>
              <span v-else class="none">—</span>
            </template>
          </td>
        </tr>
      </tbody>
      <tfoot>
        <tr v-for="total in totals" :key="total.currency">
          <td v-for="head in heads" :key="head.key" :class="{ num: head.numeric }">
            <span v-if="head.key === 'date' || head.key === 'pricing'" class="none">—</span>
            <div v-else-if="head.key === 'name'" class="cell">
              <strong>{{ t('合计') }}</strong>
              <small>{{ total.currency }}<template v-if="!bySupplier"> · {{ total.groupCount }} {{ t('组') }}</template></small>
            </div>
            <div v-else-if="head.key === 'consumption'" class="cell">
              <strong><MoneyDisplay :currency="total.currency" :value="total.consumptionTotal" /></strong>
              <small>{{ total.pendingCount + total.confirmedCount }} {{ t('条记录') }}</small>
            </div>
            <template v-else-if="head.key === 'pending'">
              <div v-if="total.pendingCount > 0" class="cell">
                <strong><MoneyDisplay :currency="total.currency" :value="total.pendingConsumption" /></strong>
                <small>{{ total.pendingCount }} {{ t('条待计价') }}</small>
              </div>
              <span v-else class="none">—</span>
            </template>
            <template v-else-if="head.key === 'confirmed'">
              <div v-if="total.confirmedCount > 0" class="cell">
                <strong><MoneyDisplay :currency="total.currency" :value="total.confirmedOriginal" /></strong>
                <small>{{ total.confirmedCount }} {{ t('条已入账') }}</small>
              </div>
              <span v-else class="none">—</span>
            </template>
            <template v-else-if="head.key === 'payable'">
              <strong v-if="total.confirmedCount > 0" class="amount">{{ total.currency }} {{ formatMoney(total.payableTotal, total.currency) }}</strong>
              <span v-else class="none">—</span>
            </template>
          </td>
        </tr>
      </tfoot>
    </table>
  </div>
</template>

<style scoped>
.wrap { width: 100%; overflow-x: auto; scrollbar-width: thin; }
.grid { width: 100%; min-width: 760px; border-collapse: collapse; font-size: var(--hs-text-sm); }
.grid th, .grid td { height: auto; padding: 10px 14px; text-align: left; vertical-align: top; }
.grid th:first-child, .grid td:first-child { padding-left: 20px; }
.grid th:last-child, .grid td:last-child { padding-right: 20px; }
.grid thead { background: var(--hs-surface-subtle); }
.grid th { height: 38px; padding-top: 0; padding-bottom: 0; vertical-align: middle; color: var(--hs-text-3); border-top: 1px solid var(--hs-divider); border-bottom: 1px solid var(--hs-divider); font-size: var(--hs-text-xs); font-weight: 500; white-space: nowrap; }
.grid td { color: var(--hs-text-2); border-bottom: 1px solid var(--hs-divider); line-height: 1.5; }
.grid .num { text-align: right; }
.grid tfoot td { background: var(--hs-surface-subtle); border-bottom-color: var(--hs-border); }
.cell { display: grid; gap: 2px; justify-items: inherit; }
.num .cell { justify-items: end; }
.cell strong, .amount { color: var(--hs-text); font-weight: 500; font-variant-numeric: tabular-nums; }
.cell small { color: var(--hs-text-3); font-size: var(--hs-text-xs); }
.date { font-family: var(--hs-font-mono); font-size: var(--hs-text-xs); color: var(--hs-text); white-space: nowrap; }
.none { color: var(--hs-text-4); }
.sort { min-height: 0; padding: 0; color: inherit; background: none; border: 0; font: inherit; white-space: nowrap; cursor: pointer; }
.sort:hover { color: var(--hs-text); }
.sort.active { color: var(--hs-text); font-weight: 600; }
.sort:focus-visible { outline: none; box-shadow: var(--hs-accent-ring); border-radius: 4px; }
</style>
