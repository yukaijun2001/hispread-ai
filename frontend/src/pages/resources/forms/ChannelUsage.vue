<script setup lang="ts">
// Quota of a NewAPI channel in upstream raw units (never converted to USD).
import { computed } from 'vue';
import { t } from '../../../lib/i18n';
import type { Resource } from '../resources';
import { newApiUsage, usageNumber } from './newapiChannel';

const props = defineProps<{ resource: Resource }>();
const usage = computed(() => newApiUsage(props.resource));
</script>

<template>
  <div v-if="usage?.unit === 'NEWAPI_QUOTA'" class="rs-channel-usage">
    <span>{{ t('已用配额：{0}', [usageNumber(usage.used_quota)]) }}</span>
    <span>{{ t('余额原值：{0}', [usageNumber(usage.balance)]) }}</span>
    <small>{{ t('NEWAPI_QUOTA · 上游原始单位，不换算为 USD') }}</small>
  </div>
  <span v-else class="rs-channel-usage-empty">{{ t('尚未查询渠道用量') }}</span>
</template>

<style scoped>
.rs-channel-usage { display: grid; gap: 2px; font-variant-numeric: tabular-nums; }
.rs-channel-usage small, .rs-channel-usage-empty { color: var(--hs-text-3); font-size: var(--hs-text-xs); }
</style>
