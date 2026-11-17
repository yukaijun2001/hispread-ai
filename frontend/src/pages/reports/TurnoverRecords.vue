<script setup lang="ts">
// Manually recorded daily turnover: total and chart for one currency at a time.
// Only currencies that have records can be picked. Hidden without `turnover.read`.
import { computed, ref } from 'vue';
import Button from '../../components/ui/Button.vue';
import Icon from '../../components/ui/Icon.vue';
import Segmented from '../../components/ui/Segmented.vue';
import EmptyState from '../../components/ui/EmptyState.vue';
import Spinner from '../../components/ui/Spinner.vue';
import TurnoverChart from './TurnoverChart.vue';
import TurnoverFormDialog from './TurnoverFormDialog.vue';
import { useApiData } from '../../composables/useApiData';
import { t } from '../../lib/i18n';
import { CURRENCIES } from '../../lib/labels';
import { formatMoney, sumDecimals } from '../../lib/money';
import { useSessionStore } from '../../stores/session';
import type { TurnoverPoint, TurnoverRecord } from './reports';

const session = useSessionStore();
const turnover = useApiData<{ items: TurnoverRecord[] }>(() => (session.has('turnover.read') ? '/turnover' : null));

const recording = ref(false);
const mode = ref<'bar' | 'area'>('bar');
const chosen = ref('USD');

const records = computed(() => turnover.data.value?.items ?? []);
const currencies = computed<string[]>(() => CURRENCIES.filter((code) => records.value.some((record) => record.currency === code)));
const currency = computed({
  get: () => (currencies.value.includes(chosen.value) ? chosen.value : currencies.value[0] || 'USD'),
  set: (value: string) => { chosen.value = value; },
});
const inCurrency = computed(() => records.value.filter((record) => record.currency === currency.value));
const total = computed(() => sumDecimals(inCurrency.value.map((record) => record.amount)));

// One point per business day, summed exactly, in date order.
const points = computed<TurnoverPoint[]>(() => {
  const byDate = new Map<string, string[]>();
  for (const record of inCurrency.value) byDate.set(record.businessDate, [...(byDate.get(record.businessDate) ?? []), record.amount]);
  return [...byDate.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, amounts]) => ({ date, value: sumDecimals(amounts) }));
});

const currencyOptions = computed(() => currencies.value.map((code) => ({ value: code, label: code })));
const modeOptions = [{ value: 'bar' as const, label: t('柱状图') }, { value: 'area' as const, label: t('面积图') }];
</script>

<template>
  <section v-if="session.has('turnover.read')" class="tr-panel" aria-labelledby="report-turnover-title">
    <div class="tr-head">
      <div class="tr-total">
        <span class="tr-mark" aria-hidden="true"><Icon name="wallet" :size="14" /></span>
        <h2 id="report-turnover-title">{{ t('每日营业额') }}</h2>
        <span class="tr-sum">{{ t('总计：') }}{{ currency === 'USD' ? '$' : `${currency} ` }}{{ formatMoney(total || '0', currency) }}</span>
      </div>
      <div class="tr-tools">
        <Segmented v-if="currencies.length > 1" v-model="currency" :options="currencyOptions" :label="t('币种')" />
        <Segmented v-model="mode" :options="modeOptions" :label="t('图表类型')" />
        <Button v-if="session.has('turnover.write')" variant="primary" icon="plus" @click="recording = true">{{ t('记一笔') }}</Button>
      </div>
    </div>

    <EmptyState v-if="turnover.error.value" error :text="turnover.error.value" compact />
    <template v-else-if="turnover.data.value">
      <EmptyState v-if="!points.length" :text="t('还没有营业额记录。可以先手工记一笔。')" icon="wallet" compact />
      <div v-else class="tr-chart-wrap"><TurnoverChart :mode="mode" :currency="currency" :points="points" /></div>
    </template>
    <div v-else class="tr-state"><Spinner :size="16" /></div>

    <TurnoverFormDialog v-if="recording" :currency="currency" @close="recording = false" />
  </section>
</template>

<style scoped>
.tr-panel { display: grid; gap: 12px; }
.tr-head { display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: 12px; }
.tr-total { display: flex; flex-wrap: wrap; align-items: center; gap: 8px; min-width: 0; }
.tr-mark { display: inline-grid; place-items: center; width: 26px; height: 26px; color: var(--hs-accent); background: var(--hs-accent-soft); border-radius: var(--hs-radius-small); }
.tr-total h2 { margin: 0; color: var(--hs-text); font-size: var(--hs-text-md); font-weight: 600; }
.tr-sum { color: var(--hs-text-2); font-size: var(--hs-text-sm); font-variant-numeric: tabular-nums; }
.tr-tools { display: flex; flex-wrap: wrap; align-items: center; gap: 8px; }
.tr-chart-wrap { min-width: 0; }
.tr-state { display: grid; place-items: center; padding: 40px; color: var(--hs-text-3); }
</style>
