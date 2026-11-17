<script setup lang="ts">
// Collapsible CCMAX overview above the resource list. Counts and quota windows
// cover the current filters (type forced to CCMAX, status and paging dropped)
// and load only while expanded. Every count filters the list by its status.
import { computed, ref, useId } from 'vue';
import Button from '../../../components/ui/Button.vue';
import Icon from '../../../components/ui/Icon.vue';
import Notice from '../../../components/ui/Notice.vue';
import Spinner from '../../../components/ui/Spinner.vue';
import IntakeToday from './IntakeToday.vue';
import MoneyDisplay from './MoneyDisplay.vue';
import { getLocale, t } from '../../../lib/i18n';
import { useSessionStore } from '../../../stores/session';
import { usePolledData } from '../composables/usePolledData';
import { count, OVERVIEW_METRICS, resetText, type QuotaWindow, type ResourceOverview } from '../overview';

const props = withDefaults(defineProps<{ filterQuery: string; operationalStatus: string; refreshIntervalMs?: number }>(), { refreshIntervalMs: 10_000 });
const emit = defineEmits<{ filter: [status: string] }>();

const session = useSessionStore();
const expanded = ref(false);
const contentId = useId();

const path = computed(() => {
  if (!expanded.value) return null;
  const query = new URLSearchParams(props.filterQuery);
  query.set('resourceType', 'CCMAX');
  for (const key of ['operationalStatus', 'page', 'size']) query.delete(key);
  return `/resources/overview?${query}`;
});
const overview = usePolledData<ResourceOverview>(path, () => props.refreshIntervalMs);
const metrics = OVERVIEW_METRICS();

const quotas = computed(() => {
  const data = overview.data.value;
  return data ? [
    { key: 'five', label: t('5 小时'), quota: data.fiveHour, status: 'FIVE_HOUR_EXHAUSTED' },
    { key: 'seven', label: t('7 天'), quota: data.sevenDay, status: 'SEVEN_DAY_EXHAUSTED' },
  ] : [];
});
const width = (quota: QuotaWindow) => Math.min(100, Math.max(0, quota.averageUsedPercent ?? 0));
const resetTitle = (value: string | null | undefined) => (value ? new Date(value).toLocaleString(getLocale(), { timeZone: 'Asia/Shanghai' }) : undefined);
</script>

<template>
  <section class="ov" :class="{ expanded }" :aria-label="t('CCMAX 资源概况')">
    <h2 class="ov-heading">
      <button type="button" class="ov-toggle" :aria-expanded="expanded" :aria-controls="contentId" @click="expanded = !expanded">
        <span class="ov-title">
          <Icon name="chevron" :size="14" class="ov-chevron" />
          {{ t('CCMAX 资源概况') }}
          <span class="ov-info" :title="t('按当前筛选统计已成功交付的资源，状态和额度按最近同步快照展示；状态分类互斥，等待自动续期不算账号失效；额度指标单独统计。')">
            <Icon name="info" :size="13" />
          </span>
        </span>
        <span class="ov-toggle-label">{{ expanded ? t('收起') : t('展开') }}</span>
      </button>
    </h2>

    <div v-if="expanded" :id="contentId" class="ov-content">
      <IntakeToday />
      <div v-if="overview.loading.value" class="ov-state"><Spinner :size="16" /></div>
      <Notice v-else-if="overview.error.value" tone="danger">
        {{ t('资源概况加载失败：') }}{{ overview.error.value }}
        <template #actions><Button size="sm" @click="session.refresh()">{{ t('重新加载') }}</Button></template>
      </Notice>
      <template v-else-if="overview.data.value">
        <p v-if="overview.data.value.counts.total === 0" class="ov-empty">{{ t('当前筛选下没有已成功交付的 CCMAX 资源') }}</p>

        <div v-if="overview.data.value.dailyConsumption" class="ov-daily" :aria-label="t('每日消耗')">
          <span class="ov-daily-label">
            {{ t('每日消耗') }}
            <small>{{ t('今日 · ') }}{{ overview.data.value.dailyConsumption.businessDate }}{{ t('（北京时间）') }}</small>
          </span>
          <strong class="ov-daily-amount">
            <template v-if="overview.data.value.dailyConsumption.amount === null">{{ t('暂无当日数据') }}</template>
            <MoneyDisplay v-else :value="overview.data.value.dailyConsumption.amount" currency="USD" />
          </strong>
          <span class="ov-daily-meta">{{ t('已采集 ') }}{{ count(overview.data.value.dailyConsumption.reportedResourceCount) }}{{ t(' 个资源 · 当日持续更新 ') }}</span>
        </div>

        <div class="ov-layout">
          <div class="ov-counts" :aria-label="t('资源状态数量')">
            <div v-for="(column, index) in metrics" :key="index" class="ov-column">
              <div v-for="metric in column" :key="metric.key" class="ov-metric" :class="metric.tone">
                <span>{{ metric.label }}</span>
                <div class="ov-value">
                  <button
                    type="button"
                    :aria-label="t('{0} {1} 条，筛选资源', [metric.label, overview.data.value.counts[metric.key]])"
                    :aria-pressed="operationalStatus === metric.status"
                    @click="emit('filter', metric.status)"
                  >{{ count(overview.data.value.counts[metric.key] ?? 0) }}</button>
                  <button
                    v-if="metric.key === 'ready'"
                    type="button"
                    class="ov-total"
                    :aria-label="t('全部已成功交付资源 {0} 条，筛选资源', [overview.data.value.counts.total])"
                    :aria-pressed="operationalStatus === 'ALL'"
                    @click="emit('filter', 'ALL')"
                  >/ {{ count(overview.data.value.counts.total) }}</button>
                </div>
              </div>
            </div>
          </div>

          <div class="ov-quotas" :aria-label="t('资源额度概况')">
            <div v-for="item in quotas" :key="item.key" class="ov-quota">
              <div class="ov-quota-top">
                <span class="ov-quota-label">{{ item.label }}</span>
                <div
                  class="ov-track"
                  :class="{ missing: item.quota.averageUsedPercent === null }"
                  role="progressbar"
                  :aria-label="t('{0}平均已用', [item.label])"
                  aria-valuemin="0"
                  aria-valuemax="100"
                  :aria-valuenow="item.quota.averageUsedPercent === null ? undefined : width(item.quota)"
                  :aria-valuetext="item.quota.averageUsedPercent === null ? t('暂无用量数据') : t('平均已用 {0}%', [count(item.quota.averageUsedPercent, 1)])"
                >
                  <span v-if="item.quota.averageUsedPercent !== null" :style="{ width: `${width(item.quota)}%` }" />
                </div>
                <span class="ov-quota-percent">{{ t('均 ') }}<strong>{{ item.quota.averageUsedPercent === null ? '—' : `${count(item.quota.averageUsedPercent, 1)}%` }}</strong></span>
              </div>
              <div class="ov-quota-meta">
                <span>
                  {{ count(item.quota.reportedCount) }}{{ t(' 个窗口 ') }}<span class="ov-sep">·</span>
                  <button type="button" :aria-pressed="operationalStatus === item.status" @click="emit('filter', item.status)">{{ t('已满 ') }}{{ count(item.quota.exhaustedCount) }}</button>
                </span>
                <span :title="resetTitle(item.quota.nextResetAt)">{{ resetText(item.quota.nextResetAt) }}</span>
              </div>
              <div class="ov-quota-detail">
                <span :title="t('将每个窗口剩余百分比相加；不同套餐的实际容量不同，仅作参考')">
                  {{ t('余量折合约') }} {{ item.quota.remainingEquivalent === null ? '—' : count(item.quota.remainingEquivalent, 1) }}{{ t(' 个窗口 ') }}
                </span>
                <span>{{ count(item.quota.missingCount) }}{{ t(' 条未提供数据') }}</span>
              </div>
            </div>
          </div>
        </div>

        <div class="ov-footnote">
          <span>{{ t('按当前筛选统计已成功交付资源；5h/7d额度统计不含已移除资源；余量折合按窗口百分比估算。 ') }}</span>
          <button v-if="(overview.data.value.counts.paused ?? 0) > 0" type="button" @click="emit('filter', 'PAUSED')">
            {{ t('已暂停') }} {{ count(overview.data.value.counts.paused ?? 0) }}
          </button>
          <button v-if="overview.data.value.counts.unknownState > 0" type="button" @click="emit('filter', 'UNKNOWN')">
            {{ t('状态未知 ') }}{{ count(overview.data.value.counts.unknownState) }}{{ t(' 条 ') }}
          </button>
        </div>
      </template>
    </div>
  </section>
</template>

<style scoped>
.ov { background: var(--hs-surface); border: 1px solid var(--hs-border); border-radius: var(--hs-radius-card); box-shadow: var(--hs-shadow-card); }
.ov-heading { margin: 0; font-size: inherit; }
.ov-toggle { display: flex; align-items: center; justify-content: space-between; gap: 12px; width: 100%; padding: 12px 16px; color: var(--hs-text); text-align: left; font: inherit; background: none; border: 0; border-radius: var(--hs-radius-card); cursor: pointer; }
.ov-toggle:focus-visible { outline: none; box-shadow: var(--hs-accent-ring); }
.ov-title { display: inline-flex; align-items: center; gap: 6px; font-size: var(--hs-text-md); font-weight: 600; }
.ov-chevron { color: var(--hs-text-3); transition: transform .15s ease; }
.expanded .ov-chevron { transform: rotate(90deg); }
.ov-info { display: inline-flex; color: var(--hs-text-4); }
.ov-toggle-label { color: var(--hs-text-3); font-size: var(--hs-text-xs); }
.ov-content { display: grid; gap: 14px; padding: 0 16px 16px; }
.ov-state { display: grid; place-items: center; padding: 24px; color: var(--hs-text-3); }
.ov-empty { margin: 0; color: var(--hs-text-3); font-size: var(--hs-text-sm); }
.ov-daily { display: flex; flex-wrap: wrap; align-items: baseline; gap: 6px 14px; padding: 10px 14px; background: var(--hs-surface-subtle); border: 1px solid var(--hs-border); border-radius: 12px; }
.ov-daily-label { color: var(--hs-text-2); font-size: var(--hs-text-sm); }
.ov-daily-label small, .ov-daily-meta { color: var(--hs-text-3); font-size: var(--hs-text-xs); }
.ov-daily-amount { font-size: var(--hs-text-lg); font-variant-numeric: tabular-nums; }
.ov-layout { display: grid; grid-template-columns: minmax(0, 3fr) minmax(260px, 2fr); gap: 14px; }
.ov-counts { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 10px; }
.ov-column { display: grid; align-content: start; gap: 10px; }
.ov-metric { display: grid; gap: 2px; padding: 10px 12px; border: 1px solid var(--hs-border); border-radius: 12px; }
.ov-metric > span { color: var(--hs-text-3); font-size: var(--hs-text-xs); }
.ov-metric.danger .ov-value button:first-child { color: var(--hs-danger); }
.ov-metric.warm .ov-value button:first-child { color: var(--hs-warning); }
.ov-value { display: flex; align-items: baseline; gap: 4px; }
.ov-value button, .ov-quota-meta button, .ov-footnote button {
  padding: 0; color: var(--hs-text); font: inherit; font-variant-numeric: tabular-nums; background: none; border: 0; border-radius: 4px; cursor: pointer;
}
.ov-value button:first-child { font-size: var(--hs-text-xl); font-weight: 600; }
.ov-value .ov-total { color: var(--hs-text-3); font-size: var(--hs-text-sm); }
.ov-value button:hover, .ov-quota-meta button:hover, .ov-footnote button:hover { text-decoration: underline; text-underline-offset: 3px; }
.ov-value button[aria-pressed="true"], .ov-quota-meta button[aria-pressed="true"] { color: var(--hs-accent); text-decoration: underline; text-underline-offset: 3px; }
.ov-value button:focus-visible, .ov-quota-meta button:focus-visible, .ov-footnote button:focus-visible { outline: none; box-shadow: var(--hs-accent-ring); }
.ov-quotas { display: grid; align-content: start; gap: 10px; }
.ov-quota { display: grid; gap: 6px; padding: 10px 12px; border: 1px solid var(--hs-border); border-radius: 12px; }
.ov-quota-top { display: grid; grid-template-columns: auto 1fr auto; align-items: center; gap: 10px; }
.ov-quota-label { color: var(--hs-text-2); font-size: var(--hs-text-sm); font-weight: 500; }
.ov-track { height: 6px; overflow: hidden; background: var(--hs-divider); border-radius: 999px; }
.ov-track span { display: block; height: 100%; background: var(--hs-accent); border-radius: inherit; }
.ov-track.missing { background: repeating-linear-gradient(45deg, var(--hs-divider) 0 4px, var(--hs-surface) 4px 8px); }
.ov-quota-percent { color: var(--hs-text-3); font-size: var(--hs-text-xs); }
.ov-quota-percent strong { color: var(--hs-text); font-size: var(--hs-text-sm); font-variant-numeric: tabular-nums; }
.ov-quota-meta, .ov-quota-detail { display: flex; flex-wrap: wrap; justify-content: space-between; gap: 4px 12px; color: var(--hs-text-3); font-size: var(--hs-text-xs); }
.ov-quota-meta button { color: var(--hs-text-2); font-size: var(--hs-text-xs); }
.ov-sep { margin: 0 4px; }
.ov-footnote { display: flex; flex-wrap: wrap; align-items: baseline; gap: 4px 12px; color: var(--hs-text-3); font-size: var(--hs-text-xs); }
.ov-footnote button { color: var(--hs-accent); font-size: var(--hs-text-xs); }
@media (max-width: 960px) { .ov-layout { grid-template-columns: minmax(0, 1fr); } }
@media (max-width: 640px) { .ov-counts { grid-template-columns: repeat(2, minmax(0, 1fr)); } }
</style>
