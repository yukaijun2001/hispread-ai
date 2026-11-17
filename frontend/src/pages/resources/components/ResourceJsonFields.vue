<script setup lang="ts">
// Generic renderer for resource data: objects become label/value lists (known
// field names translated), timestamps ending in At/Until show in Beijing time.
import { computed } from 'vue';
import { t, translateServerMessage } from '../../../lib/i18n';
import { asRecord, asTime, usageTime } from '../usage';

const props = withDefaults(defineProps<{ value: unknown; path?: string[] }>(), { path: () => [] });

const FIELD_LABELS = (): Record<string, string> => ({
  usage: t('额度数据'),
  health: t('账号健康状态'),
  credentialFailureReason: t('凭据状态提示'),
  healthQueriedAt: t('健康状态同步时间'),
  queriedAt: t('最近同步时间'),
  ageSeconds: t('上游数据年龄（秒）'),
  source: t('数据来源'),
  probedAt: t('上游采集时间'),
  fiveHourPercent: t('5 小时已用百分比'),
  fiveHourResetsAt: t('5 小时重置时间'),
  fiveHourObservedAt: t('5 小时采集时间'),
  sevenDayPercent: t('7 天已用百分比'),
  sevenDayResetsAt: t('7 天重置时间'),
  sevenDayObservedAt: t('7 天采集时间'),
  sevenDayFablePercent: t('7 天 Fable 已用百分比'),
  sevenDayFableResetsAt: t('7 天 Fable 重置时间'),
  fableObservedAt: t('Fable 采集时间'),
  fableBlockedUntil: t('Fable 限制结束时间'),
  plan: t('套餐信息'),
  tier: t('套餐类型'),
  label: t('套餐名称'),
  organizationType: t('订阅类型'),
  rateLimitTier: t('限流等级'),
  billingType: t('计费类型'),
  extraUsageEnabled: t('额外用量'),
  subscriptionCreatedAt: t('订阅创建时间'),
  checkedAt: t('套餐检查时间'),
});

const record = computed(() => asRecord(props.value));
const labels = computed(() => FIELD_LABELS());
const isTime = (key: string, value: unknown) => asTime(value) !== null && /(?:At|Until)$/.test(key);

const scalar = computed(() => {
  const value = props.value;
  if (value === null) return t('未提供');
  if (typeof value === 'boolean') return t(value ? '是' : '否');
  if (typeof value === 'string' && props.path.join('.') === 'health.credentialFailureReason') return translateServerMessage(value);
  return String(value);
});
</script>

<template>
  <dl v-if="record" class="rs-json">
    <div v-for="(item, key) in record" :key="key">
      <dt>{{ Object.hasOwn(labels, key) ? labels[key] : key }}</dt>
      <dd>
        <template v-if="isTime(String(key), item)">{{ usageTime(item) }}</template>
        <ResourceJsonFields v-else :value="item" :path="[...path, String(key)]" />
      </dd>
    </div>
  </dl>
  <template v-else-if="Array.isArray(value)">
    <template v-if="value.length">
      <div v-for="(item, index) in value" :key="index"><ResourceJsonFields :value="item" :path="path" /></div>
    </template>
    <template v-else>{{ t('无数据') }}</template>
  </template>
  <template v-else>{{ scalar }}</template>
</template>

<style scoped>
.rs-json { display: grid; gap: 6px; margin: 0; }
.rs-json > div { display: grid; grid-template-columns: minmax(120px, 34%) minmax(0, 1fr); gap: 12px; }
.rs-json dt { color: var(--hs-text-3); font-size: var(--hs-text-xs); }
.rs-json dd { margin: 0; color: var(--hs-text); font-size: var(--hs-text-xs); overflow-wrap: anywhere; }
.rs-json .rs-json { padding-left: 10px; border-left: 1px solid var(--hs-border); }
.rs-json .rs-json > div { grid-template-columns: minmax(100px, 40%) minmax(0, 1fr); }
</style>
