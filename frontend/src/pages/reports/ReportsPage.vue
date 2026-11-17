<script setup lang="ts">
// Reports route. Platform operators who may read reports but neither usage nor
// settlements get the count-only operations report; everyone else gets the
// business report. Platform users with `turnover.read` also get the manual
// turnover ledger, which loads only while its section is expanded.
import { computed, ref } from 'vue';
import Icon from '../../components/ui/Icon.vue';
import BusinessReport from './BusinessReport.vue';
import OperationsReport from './OperationsReport.vue';
import TurnoverRecords from './TurnoverRecords.vue';
import { t } from '../../lib/i18n';
import { useSessionStore } from '../../stores/session';

defineProps<{ route: string }>();

const session = useSessionStore();
const platform = computed(() => !session.user?.supplierId);
const operationsOnly = computed(() => platform.value && session.has('report.read') && !session.has('usage.read') && !session.has('settlement.read'));
const turnoverOpen = ref(false);
</script>

<template>
  <div class="rp-root">
    <OperationsReport v-if="operationsOnly" />
    <BusinessReport v-else />

    <details
      v-if="platform && session.has('turnover.read')"
      class="rp-turnover"
      @toggle="turnoverOpen = ($event.currentTarget as HTMLDetailsElement).open"
    >
      <summary>
        <Icon name="chevron" :size="14" class="rp-turnover-caret" />
        <span>{{ t('手工营业额记录') }}</span>
      </summary>
      <div class="rp-turnover-body">
        <p>{{ t('独立的手工经营台账，不计入结算应付。') }}</p>
        <TurnoverRecords v-if="turnoverOpen" />
      </div>
    </details>
  </div>
</template>

<style scoped>
.rp-root { display: grid; gap: 16px; }
.rp-turnover { background: var(--hs-surface); border: 1px solid var(--hs-border); border-radius: var(--hs-radius-card); box-shadow: var(--hs-shadow-card); }
.rp-turnover > summary {
  display: flex; align-items: center; gap: 8px; min-height: 52px; padding: 0 20px; color: var(--hs-text); font-size: var(--hs-text-md); font-weight: 600;
  list-style: none; cursor: pointer;
}
.rp-turnover > summary::-webkit-details-marker { display: none; }
.rp-turnover > summary:focus-visible { outline: 2px solid var(--hs-accent); outline-offset: -2px; border-radius: var(--hs-radius-card); }
.rp-turnover-caret { color: var(--hs-text-3); transition: transform .15s; }
.rp-turnover[open] .rp-turnover-caret { transform: rotate(90deg); }
.rp-turnover-body { display: grid; gap: 14px; padding: 0 20px 20px; }
.rp-turnover-body > p { margin: 0; color: var(--hs-text-3); font-size: var(--hs-text-sm); }
</style>
