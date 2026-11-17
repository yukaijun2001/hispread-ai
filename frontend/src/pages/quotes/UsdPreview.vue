<script setup lang="ts">
// Reference USD amount for a discount multiplier (per 1 unit of `currency`) or
// for a unit price (per `unit`). Informational only.
import { computed } from 'vue';
import { t, times100 } from '../../lib/i18n';
import { convertCurrency, type ExchangeRate } from '../../lib/money';
import { useSessionStore } from '../../stores/session';
import { DECIMAL } from './quotes';

const props = defineProps<{ value: string; currency: string; unit?: string; rates: ExchangeRate[]; loading?: boolean; error?: string }>();
const session = useSessionStore();
const valid = computed(() => !!props.value && DECIMAL.test(props.value));
const usd = computed(() => (valid.value ? convertCurrency(props.value, props.currency, 'USD', props.rates) : null));
const isUsd = computed(() => props.currency === 'USD');
</script>

<template>
  <div class="usd" aria-live="polite">
    <small v-if="!valid">{{ t('输入有效价格后显示折扣后金额') }}</small>
    <small v-else-if="!isUsd && loading">{{ t('正在读取参考汇率…') }}</small>
    <small v-else-if="!isUsd && error" class="error">{{ t('参考汇率读取失败') }}</small>
    <small v-else-if="!isUsd && !session.has('exchange_rate.read')">{{ t('无参考汇率查看权限') }}</small>
    <span v-else-if="usd" class="amount">
      <strong>{{ t(unit ? '参考金额约 {0} {1}' : '折扣后约 {0} {1}', ['USD', usd]) }}</strong>
      <span>/ {{ unit || `1 ${currency}` }}</span>
      <small>{{ t('仅供参考') }}</small>
    </span>
    <small v-else>{{ t('暂无 {0} → {1} 当前参考汇率', [currency, 'USD']) }}</small>
    <small v-if="!unit && valid">{{ t('按原金额的 {0}% 计价', [times100(value)]) }}</small>
  </div>
</template>

<style scoped>
.usd { display: grid; gap: 2px; color: var(--hs-text-3); font-size: 11px; line-height: 1.5; }
.usd small { font-size: 11px; }
.amount { display: flex; flex-wrap: wrap; align-items: baseline; gap: 4px; }
.amount strong { color: var(--hs-text-2); font-weight: 500; }
.error { color: var(--hs-danger); }
</style>
