<script setup lang="ts">
// Today's CC onboarding quota for supplier users (Beijing business day),
// PRO and non-PRO side by side. Polls every 30 s while `active`.
import { computed } from 'vue';
import Button from '../../../components/ui/Button.vue';
import Notice from '../../../components/ui/Notice.vue';
import Spinner from '../../../components/ui/Spinner.vue';
import StateBadge from './StateBadge.vue';
import { useApiData } from '../../../composables/useApiData';
import { t } from '../../../lib/i18n';
import { useSessionStore } from '../../../stores/session';
import { intakeAvailability, intakeCount, quotaSourceLabel, type IntakeAllowance, type IntakeToday } from '../intake';

const props = withDefaults(defineProps<{ active?: boolean }>(), { active: true });

const session = useSessionStore();
const user = computed(() => session.user!);
const owner = computed(() => user.value.role === 'SUPPLIER');
const today = useApiData<IntakeToday>(() => (props.active && user.value.supplierId ? '/cc-intake/mine' : null), { pollMs: 30_000 });

interface Row { key: 'pro' | 'nonPro'; title: string; allowance: IntakeAllowance; accepting: boolean; reason?: string | null; count: number }
const rows = computed<Row[]>(() => {
  const data = today.data.value;
  if (!data) return [];
  return [
    { key: 'pro', title: 'PRO', allowance: data.proAllowance, accepting: data.canPro, reason: data.proBlockReason, count: data.pro },
    { key: 'nonPro', title: t('非PRO'), allowance: data.nonProAllowance, accepting: data.accepting, reason: data.nonProBlockReason, count: data.nonPro },
  ];
});
</script>

<template>
  <section v-if="user.supplierId" class="it" :aria-label="t('今日上号额度')">
    <header class="it-head">
      <div class="it-summary">
        <h3>{{ t('今日上号额度') }}</h3>
        <div v-if="today.data.value && !today.error.value" class="it-totals">
          <span>{{ owner ? t('供应商今日成功总数') : t('本人今日成功总数') }} <strong>{{ intakeCount(today.data.value.total) }}</strong></span>
          <span>{{ t('套餐未识别') }} <strong>{{ intakeCount(today.data.value.unknown) }}</strong></span>
          <span>{{ t('处理中及待核实') }} <strong>{{ intakeCount(today.data.value.processing) }}</strong></span>
        </div>
      </div>
      <span class="it-date">{{ t('北京时间') }}{{ today.data.value ? ` · ${today.data.value.date}` : '' }}</span>
    </header>

    <Notice v-if="today.error.value" tone="danger">
      {{ today.error.value }}
      <template #actions><Button size="sm" @click="today.reload()">{{ t('重新加载') }}</Button></template>
    </Notice>
    <div v-else-if="today.data.value" class="it-rows" role="list" :aria-label="t('今日上号分类额度')">
      <div v-for="row in rows" :key="row.key" class="it-row" role="listitem">
        <div class="it-category">
          <strong>{{ row.title }}</strong>
          <StateBadge :state="row.accepting ? 'ACCEPTING' : 'CLOSED'" :label="intakeAvailability(row.accepting, row.reason)" />
        </div>
        <dl class="it-values">
          <div class="it-source">
            <dt>{{ t('来源') }}</dt>
            <dd>
              {{ quotaSourceLabel(row.allowance.source) }}
              <small v-if="row.allowance.reclaimed">{{ t('今日个人额度已回收，次日使用共享额度') }}</small>
            </dd>
          </div>
          <div>
            <dt>{{ owner ? t('供应商今日成功') : t('本人今日成功') }}</dt>
            <dd>{{ intakeCount(row.count) }}</dd>
          </div>
          <div>
            <dt>{{ t('来源已用／每日上限') }}</dt>
            <dd>
              {{ intakeCount(row.allowance.used) }} / {{ intakeCount(row.allowance.limit) }}
              <small v-if="row.allowance.limit !== null && row.allowance.used > row.allowance.limit" class="it-over">{{ t('超出{0}个', [row.allowance.used - row.allowance.limit]) }}</small>
            </dd>
          </div>
          <div class="it-balance">
            <dt>{{ t('本账号可用') }}</dt>
            <dd><strong>{{ intakeCount(row.allowance.remaining) }}</strong></dd>
          </div>
        </dl>
        <p v-if="row.allowance.reservedRemaining > 0" class="it-reserved">
          {{ t('已预留给成员／交付组 {0} 个，不计入本账号可用额度。', [intakeCount(row.allowance.reservedRemaining)]) }}
        </p>
      </div>
    </div>
    <div v-else class="it-state"><Spinner :size="16" /></div>
  </section>
</template>

<style scoped>
.it { display: grid; gap: 12px; padding: 14px 16px; background: var(--hs-surface); border: 1px solid var(--hs-border); border-radius: var(--hs-radius-card); }
.it-head { display: flex; flex-wrap: wrap; align-items: baseline; justify-content: space-between; gap: 8px; }
.it-summary { display: flex; flex-wrap: wrap; align-items: baseline; gap: 6px 16px; }
.it-summary h3 { margin: 0; font-size: var(--hs-text-md); font-weight: 600; }
.it-totals { display: flex; flex-wrap: wrap; gap: 4px 14px; color: var(--hs-text-3); font-size: var(--hs-text-xs); }
.it-totals strong { color: var(--hs-text); font-variant-numeric: tabular-nums; }
.it-date { color: var(--hs-text-3); font-size: var(--hs-text-xs); }
.it-rows { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 10px; }
.it-row { display: grid; gap: 10px; padding: 12px 14px; background: var(--hs-surface-subtle); border: 1px solid var(--hs-border); border-radius: 12px; }
.it-category { display: flex; align-items: center; gap: 8px; }
.it-category strong { font-size: var(--hs-text-sm); }
.it-values { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 8px; margin: 0; }
.it-values dt { color: var(--hs-text-3); font-size: var(--hs-text-xs); }
.it-values dd { display: grid; gap: 2px; margin: 2px 0 0; color: var(--hs-text); font-size: var(--hs-text-sm); font-variant-numeric: tabular-nums; }
.it-values small { color: var(--hs-text-3); font-size: 11px; }
.it-values .it-over { color: var(--hs-danger); }
.it-balance dd strong { font-size: var(--hs-text-lg); }
.it-reserved { margin: 0; color: var(--hs-text-3); font-size: var(--hs-text-xs); }
.it-state { display: grid; place-items: center; padding: 16px; color: var(--hs-text-3); }
@media (max-width: 640px) { .it-values { grid-template-columns: repeat(2, minmax(0, 1fr)); } }
</style>
