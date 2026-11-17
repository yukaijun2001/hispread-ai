<script setup lang="ts">
// 套餐与额度: plan, quota windows and sync time of a CCMAX resource, with the
// raw data under 更多数据. Other resource types show their extension data.
import { computed } from 'vue';
import DetailList from '../../../components/ui/DetailList.vue';
import { t } from '../../../lib/i18n';
import type { Resource } from '../resources';
import {
  asPercent, asRecord, asText, asTime, hasFable, observedAt, planLabel, USAGE_WINDOWS, usageLevel, usageTime, usedText, type UsageRecord,
} from '../usage';
import ResourceJsonFields from './ResourceJsonFields.vue';

const props = defineProps<{ resource: Resource }>();

const data = computed(() => props.resource.resourceData ?? null);
const usage = computed(() => (data.value ? asRecord(data.value.usage) : null));
const plan = computed(() => (usage.value ? asRecord(usage.value.plan) : null));

// The raw view hides upstream bookkeeping fields.
const raw = computed(() => {
  if (!data.value) return null;
  if (!usage.value) return data.value;
  const visible: UsageRecord = Object.fromEntries(Object.entries(usage.value).filter(([key]) => key !== 'ageSeconds' && key !== 'source'));
  if (plan.value) visible.plan = Object.fromEntries(Object.entries(plan.value).filter(([key]) => !['rateLimitTier', 'billingType', 'extraUsageEnabled'].includes(key)));
  return { ...data.value, usage: visible };
});

const windows = computed(() => {
  const all = USAGE_WINDOWS();
  return hasFable(usage.value || {}) ? all : all.slice(0, 2);
});
const cards = computed(() => windows.value.map((window) => {
  const record = usage.value!;
  const percent = asPercent(record[`${window.key}Percent`]);
  const observed = observedAt(record, window.key);
  return { ...window, percent, resetsAt: usageTime(record[`${window.key}ResetsAt`]), observed: usageTime(observed), observedKnown: asTime(observed) !== null };
}));

const planItems = computed<Array<[string, string]>>(() => [
  [t('套餐类型'), planLabel(usage.value!)],
  [t('订阅创建时间'), usageTime(plan.value?.subscriptionCreatedAt)],
  [t('套餐检查时间'), usageTime(plan.value?.checkedAt)],
]);
const syncItems = computed<Array<[string, string]>>(() => [
  [t('最近同步时间'), usageTime(data.value?.queriedAt)],
  ...(asText(usage.value?.fableBlockedUntil) ? [[t('Fable 限制结束时间'), usageTime(usage.value?.fableBlockedUntil)] as [string, string]] : []),
]);
</script>

<template>
  <section v-if="resource.resourceType !== 'CCMAX' && data" class="rs-usage">
    <h3>{{ t('资源扩展信息') }}</h3>
    <ResourceJsonFields :value="data" />
  </section>
  <section v-else-if="resource.resourceType === 'CCMAX'" class="rs-usage" :aria-label="t('套餐与额度')">
    <h3>{{ t('套餐与额度') }}</h3>
    <template v-if="usage">
      <DetailList :items="planItems" :columns="3" />
      <div class="rs-quota-grid">
        <section v-for="card in cards" :key="card.key" class="rs-quota-card" :class="usageLevel(card.percent)" :aria-label="card.label">
          <h4>{{ card.label }}</h4>
          <strong>{{ usedText(card.percent) }}</strong>
          <meter v-if="card.percent !== null" :aria-label="card.label" min="0" max="100" low="75" high="90" optimum="0" :value="Math.min(card.percent, 100)" />
          <span>{{ t('重置时间：') }}{{ card.resetsAt }}</span>
          <span>{{ t('采集时间：') }}{{ card.observed }}</span>
          <span v-if="!card.observedKnown" class="rs-quota-stale">{{ t('采集时间未知') }}</span>
        </section>
      </div>
      <DetailList :items="syncItems" />
    </template>
    <p v-else class="rs-usage-empty">{{ t('暂无套餐与额度数据') }}</p>
    <details v-if="raw" class="rs-usage-more">
      <summary>{{ t('更多数据') }}</summary>
      <ResourceJsonFields :value="raw" />
    </details>
  </section>
</template>

<style scoped>
.rs-usage { display: grid; gap: 12px; }
.rs-usage h3 { margin: 0; font-size: var(--hs-text-sm); font-weight: 600; }
.rs-quota-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 10px; }
.rs-quota-card { display: grid; gap: 4px; padding: 12px 14px; background: var(--hs-surface-subtle); border: 1px solid var(--hs-border); border-radius: 12px; }
.rs-quota-card h4 { margin: 0; color: var(--hs-text-3); font-size: var(--hs-text-xs); font-weight: 500; }
.rs-quota-card strong { font-size: var(--hs-text-md); font-variant-numeric: tabular-nums; }
.rs-quota-card meter { width: 100%; height: 8px; }
.rs-quota-card span { color: var(--hs-text-3); font-size: var(--hs-text-xs); }
.rs-quota-card .rs-quota-stale { color: var(--hs-warning); }
.rs-quota-card.high strong { color: var(--hs-danger); }
.rs-usage-empty { margin: 0; color: var(--hs-text-3); font-size: var(--hs-text-sm); }
.rs-usage-more summary { color: var(--hs-text-2); font-size: var(--hs-text-xs); cursor: pointer; }
.rs-usage-more[open] summary { margin-bottom: 10px; }
</style>
