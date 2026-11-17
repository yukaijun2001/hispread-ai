<script setup lang="ts">
import { computed } from 'vue';
import Dialog from '../../components/ui/Dialog.vue';
import Notice from '../../components/ui/Notice.vue';
import Button from '../../components/ui/Button.vue';
import Spinner from '../../components/ui/Spinner.vue';
import QuotePeriodPanel from './QuotePeriodPanel.vue';
import QuotePriceHistory from './QuotePriceHistory.vue';
import { t } from '../../lib/i18n';
import { beijingDate, type ExchangeRate } from '../../lib/money';
import { useSessionStore } from '../../stores/session';
import type { MultiplierBounds, Quote } from './quotes';

const props = defineProps<{
  quote: Quote;
  loading: boolean;
  error: string;
  rates: ExchangeRate[];
  ratesLoading: boolean;
  ratesError: string;
  bounds: MultiplierBounds | null;
  boundsError: string;
  suggestedMultiplier?: string | null;
}>();
const emit = defineEmits<{ close: []; retry: []; changed: [] }>();
const session = useSessionStore();
const today = beijingDate();
const supplierSide = computed(() => !!session.user?.supplierId);
const canRequest = computed(() => session.has('quote.write') && (!supplierSide.value || props.quote.supplierId === session.user?.supplierId) && props.quote.effectiveTo >= today);
const subtitle = computed(() => [props.quote.projectName, props.quote.code].filter(Boolean).join(' · '));
</script>

<template>
  <Dialog size="lg" :title="session.has('quote.write') ? t('调价') : t('审核调价')" :subtitle="subtitle" @close="emit('close')">
    <div v-if="loading" class="loading"><Spinner :size="16" /></div>
    <Notice v-else-if="error" tone="danger">
      {{ t('报价读取失败：') }}{{ error }}
      <template #actions><Button size="sm" @click="emit('retry')">{{ t('重试') }}</Button></template>
    </Notice>
    <div v-else class="body">
      <Notice v-if="quote.effectiveTo < today">{{ t('历史报价不能申请修改。') }}</Notice>
      <QuotePeriodPanel
        v-if="quote.state === 'APPROVED'"
        :key="quote.id"
        :quote="quote"
        :can-request="canRequest"
        :can-review="session.has('quote.review')"
        :rates="rates"
        :rates-loading="ratesLoading"
        :rates-error="ratesError"
        :bounds="bounds"
        :bounds-error="boundsError"
        :suggested-multiplier="suggestedMultiplier"
        @changed="emit('changed')"
      />
      <Notice v-else>{{ t('报价状态已变化，请关闭并刷新列表。') }}</Notice>
      <QuotePriceHistory v-if="quote.priceHistory?.length" :quote="quote" :history="quote.priceHistory" />
    </div>
  </Dialog>
</template>

<style scoped>
.loading { display: grid; place-items: center; padding: 28px; color: var(--hs-text-3); }
.body { display: grid; gap: 20px; }
</style>
