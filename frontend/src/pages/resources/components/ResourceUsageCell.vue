<script setup lang="ts">
// List cell for quota and usage: NewAPI channel usage, or the CCMAX plan with
// 5h / 7d mini bars and their reset times.
import { computed } from 'vue';
import ChannelUsage from '../forms/ChannelUsage.vue';
import { t } from '../../../lib/i18n';
import { isNewApi, type Resource } from '../resources';
import { asPercent, asRecord, percentNumber, planLabel, USAGE_WINDOWS, usageLevel, usageTime, usedText } from '../usage';

const props = defineProps<{ resource: Resource }>();

const usage = computed(() => (props.resource.resourceData ? asRecord(props.resource.resourceData.usage) : null));
const windows = computed(() => {
  const data = usage.value;
  if (!data) return [];
  return USAGE_WINDOWS().slice(0, 2).map(({ key, short }) => {
    const percent = asPercent(data[`${key}Percent`]);
    const reset = usageTime(data[`${key}ResetsAt`]);
    return { key, short, percent, reset, level: usageLevel(percent), used: usedText(percent) };
  });
});
</script>

<template>
  <ChannelUsage v-if="isNewApi(resource)" :resource="resource" />
  <template v-else-if="resource.resourceType === 'CCMAX'">
    <div v-if="usage" class="rs-usage">
      <div class="rs-usage-head">
        <span class="rs-plan">{{ planLabel(usage) }}</span>
        <span class="rs-usage-caption">{{ t('已用') }}</span>
      </div>
      <div
        v-for="row in windows"
        :key="row.key"
        class="rs-mini"
        :class="row.level"
        role="group"
        :aria-label="`${row.short} ${row.used}`"
        :title="t('{0} {1} · 重置时间：{2}', [row.short, row.used, row.reset])"
      >
        <span class="rs-mini-period" aria-hidden="true">{{ row.short }}</span>
        <span class="rs-mini-track" aria-hidden="true"><span v-if="row.percent !== null" :style="{ width: `${Math.min(row.percent, 100)}%` }" /></span>
        <span class="rs-mini-value" aria-hidden="true">{{ row.percent === null ? t('未提供') : `${percentNumber(row.percent)}%` }}</span>
        <span class="rs-mini-reset">{{ t('重置：') }}{{ row.reset }}</span>
      </div>
    </div>
    <span v-else class="rs-usage-empty" :title="t('暂无套餐与额度数据')">{{ t('暂无数据') }}</span>
  </template>
  <span v-else-if="resource.resourceData" class="rs-usage-empty">{{ t('查看扩展信息') }}</span>
  <span v-else class="rs-usage-empty">—</span>
</template>

<style scoped>
.rs-usage { display: grid; gap: 4px; min-width: 180px; }
.rs-usage-head { display: flex; align-items: center; justify-content: space-between; gap: 8px; }
.rs-plan { padding: 1px 8px; color: var(--hs-text-2); background: var(--hs-surface-subtle); border: 1px solid var(--hs-border); border-radius: 999px; font-size: var(--hs-text-xs); white-space: nowrap; }
.rs-usage-caption { color: var(--hs-text-4); font-size: 11px; }
.rs-mini { display: grid; grid-template-columns: 30px 1fr auto; align-items: center; column-gap: 6px; font-size: 11px; }
.rs-mini-period { color: var(--hs-text-3); }
.rs-mini-track { height: 4px; overflow: hidden; background: var(--hs-surface-subtle); border-radius: 999px; }
.rs-mini-track span { display: block; height: 100%; background: var(--hs-success); border-radius: inherit; }
.rs-mini.medium .rs-mini-track span { background: var(--hs-warning); }
.rs-mini.high .rs-mini-track span { background: var(--hs-danger); }
.rs-mini-value { color: var(--hs-text-2); font-variant-numeric: tabular-nums; }
.rs-mini.missing .rs-mini-value { color: var(--hs-text-4); }
.rs-mini-reset { grid-column: 2 / -1; color: var(--hs-text-4); white-space: nowrap; }
.rs-usage-empty { color: var(--hs-text-3); font-size: var(--hs-text-xs); }
</style>
