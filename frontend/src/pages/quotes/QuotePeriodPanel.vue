<script setup lang="ts">
// Request (or review) a change to an approved quote's period and, optionally,
// its price from a chosen Beijing date. Until approval the old period and
// price stay in force.
import { computed, ref } from 'vue';
import Button from '../../components/ui/Button.vue';
import Notice from '../../components/ui/Notice.vue';
import FormField from '../../components/ui/FormField.vue';
import TextInput from '../../components/ui/TextInput.vue';
import DateRangePicker from '../../components/ui/DateRangePicker.vue';
import Spinner from '../../components/ui/Spinner.vue';
import ReviewBox from '../../components/ReviewBox.vue';
import UsdPreview from './UsdPreview.vue';
import { useApiData } from '../../composables/useApiData';
import { apiPost } from '../../lib/api';
import { divide100, formatDiscount, getLocale, t, times100 } from '../../lib/i18n';
import { unitLabel } from '../../lib/labels';
import { beijingDate, type ExchangeRate } from '../../lib/money';
import { useSessionStore } from '../../stores/session';
import { DECIMAL, multiplierOutOfRange, priceOn, sameDecimal, suggestedDiscount, type MultiplierBounds, type PendingChange, type Quote } from './quotes';

const props = defineProps<{
  quote: Quote;
  canRequest: boolean;
  canReview: boolean;
  rates: ExchangeRate[];
  ratesLoading: boolean;
  ratesError: string;
  bounds: MultiplierBounds | null;
  boundsError: string;
  suggestedMultiplier?: string | null;
}>();
const emit = defineEmits<{ changed: [] }>();

const session = useSessionStore();
const change = useApiData<PendingChange>(`/quotes/${encodeURIComponent(props.quote.id)}/period-change`);
const pending = computed(() => (change.data.value?.state === 'PENDING' ? change.data.value : null));

const discountUnit = getLocale() === 'zh-CN' ? '折' : '%';
const today = beijingDate();
const fixed = props.quote.pricingType === 'FIXED';
const historical = props.quote.effectiveFrom < today;
const from = ref(props.quote.effectiveFrom);
const to = ref(props.quote.effectiveTo);
const adjustPrice = ref(true);
const priceFrom = ref(props.quote.effectiveFrom > today ? props.quote.effectiveFrom : today);
// The price shown in the input: unit price, or discount as a percentage.
const originalPrice = computed(() => priceOn(props.quote, priceFrom.value));
const price = ref(fixed ? originalPrice.value : times100(originalPrice.value));
const submitting = ref(false);
const error = ref('');

const earliestPriceDate = computed(() => (from.value > today ? from.value : today));
const priceChanged = computed(() => adjustPrice.value && !sameDecimal(fixed ? price.value : divide100(price.value), originalPrice.value));
const periodChanged = computed(() => from.value !== props.quote.effectiveFrom || to.value !== props.quote.effectiveTo);

function togglePrice(checked: boolean) {
  adjustPrice.value = checked;
  price.value = fixed ? originalPrice.value : times100(originalPrice.value);
  error.value = '';
}

function validate(): string {
  if (!from.value || !to.value || to.value < from.value) return t('请选择有效的起止日期');
  if (props.quote.effectiveTo < today || to.value < today) return t('历史报价不能修改，结束日期不能早于北京时间今天');
  if (historical ? from.value !== props.quote.effectiveFrom : from.value < today) return t(historical ? '历史开始日期不可修改' : '生效日期不能早于北京时间今天');
  if (adjustPrice.value) {
    if (!DECIMAL.test(price.value)) return t(fixed ? '请填写不小于 0 的单位价格' : '请填写不小于 0 的折扣');
    if (!fixed && (price.value.split('.')[0].replace(/^0+/, '').length > 8 || (price.value.split('.')[1] || '').length > 6)) {
      return t('折扣整数部分最多 8 位，小数部分最多 6 位');
    }
    if (!fixed) {
      if (props.boundsError) return t('报价折扣范围读取失败');
      if (!props.bounds) return t('正在读取报价折扣范围');
      const outOfRange = multiplierOutOfRange(divide100(price.value), props.bounds);
      if (outOfRange) return outOfRange;
    }
    if (!priceFrom.value || priceFrom.value < earliestPriceDate.value || priceFrom.value > to.value) {
      return t('改价生效日期须为北京时间今天或未来，且在调整后的报价期间内');
    }
  }
  if (!priceChanged.value && !periodChanged.value) return t('报价日期和价格没有变化');
  return '';
}

async function submit() {
  if (submitting.value) return;
  const problem = validate();
  error.value = problem;
  if (problem) return;
  submitting.value = true;
  try {
    await apiPost(`/quotes/${encodeURIComponent(props.quote.id)}/period-change`, {
      effectiveFrom: from.value,
      effectiveTo: to.value,
      ...(priceChanged.value ? { ...(fixed ? { unitPrice: price.value } : { multiplier: divide100(price.value) }), priceEffectiveFrom: priceFrom.value } : {}),
    });
    session.notify(t('报价调整已提交审核'));
    emit('changed');
  } catch (reason) {
    error.value = (reason as Error).message;
  } finally {
    submitting.value = false;
  }
}

async function review(approved: boolean, note: string) {
  await apiPost(`/quotes/${encodeURIComponent(props.quote.id)}/period-change/review`, { approved, note });
  session.notify(t(approved ? '报价调整已通过' : '报价调整已退回'));
  emit('changed');
}

const priceText = (unitPrice: string | null | undefined, multiplier: string | null | undefined) =>
  (fixed ? `${props.quote.currency} ${unitPrice ?? '—'}` : formatDiscount(String(multiplier ?? '—')));
const canReviewPending = computed(() => props.canReview && pending.value
  && pending.value.submittedBy !== session.user?.id && pending.value.createdBy !== session.user?.id);
</script>

<template>
  <section class="period-panel">
    <div v-if="change.loading.value" class="loading"><Spinner :size="16" /></div>
    <Notice v-if="change.error.value" tone="danger">{{ t('调整状态加载失败：') }}{{ change.error.value }}</Notice>
    <Notice v-if="!canRequest && !pending && !change.loading.value && !change.error.value">{{ t('暂无待审核的报价调整。') }}</Notice>

    <Notice v-if="pending" tone="info" :title="t('待审核的调整')">
      <p class="line">{{ t('期间：') }}{{ t('{0} 至 {1}', [pending.oldFrom, pending.oldTo]) }} → {{ t('{0} 至 {1}', [pending.proposedFrom, pending.proposedTo]) }}</p>
      <p v-if="pending.priceEffectiveFrom" class="line">
        {{ t('价格：') }}{{ priceText(pending.oldUnitPrice, pending.oldMultiplier) }} → {{ priceText(pending.proposedUnitPrice, pending.proposedMultiplier) }}，{{ pending.priceEffectiveFrom === today ? t('今天生效') : t('{0} 生效', [pending.priceEffectiveFrom]) }}
      </p>
      <p class="line">{{ t('审核前原期间和价格继续生效，历史费用不变。') }}</p>
    </Notice>
    <ReviewBox v-if="canReviewPending" :approve-confirmation="t('是否确认审核通过该报价调整？')" :on-review="review" />

    <template v-if="canRequest && !pending && !change.loading.value && !change.error.value">
      <p class="intro">{{ t('今天调价今天生效，历史价格不变。未来调价按所选日期生效，审核前旧价继续有效。') }}</p>
      <div class="form">
        <FormField :label="t('适用期间')" :hint="historical ? t('开始日期已锁定，只能调整今天或未来的结束日期。') : undefined">
          <DateRangePicker :from="from" :to="to" :disabled="submitting" :min-date="today" :from-locked="historical" @change="(a, b) => { from = a; to = b; error = ''; }" />
        </FormField>
        <label class="toggle">
          <input type="checkbox" :checked="adjustPrice" :disabled="submitting" @change="togglePrice(($event.target as HTMLInputElement).checked)" />
          {{ t('同时调价') }}
        </label>
        <template v-if="adjustPrice">
          <FormField :label="fixed ? t('单位价格（{0} / {1}）', [quote.currency, unitLabel(quote.unit)]) : t('报价折扣')">
            <template #default="{ id }">
              <TextInput :id="id" v-model="price" type="number" min="0" step="any" :disabled="submitting"
                :aria-label="t(fixed ? '调整单位价格' : '调整报价折扣')" :suffix="fixed ? undefined : discountUnit" @update:model-value="error = ''" />
              <div class="hints">
                <small v-if="!fixed && bounds">{{ t('允许范围 {0} 至 {1}，可填小数', [times100(bounds.min), times100(bounds.max)]) }}</small>
                <small v-if="suggestedDiscount(suggestedMultiplier)" class="suggest">{{ suggestedDiscount(suggestedMultiplier) }}</small>
                <small>{{ t('所选生效日原价格：') }}{{ fixed ? `${quote.currency} ${originalPrice}` : formatDiscount(originalPrice) }}</small>
                <UsdPreview :value="fixed ? price : divide100(price)" :currency="quote.currency" :unit="fixed ? unitLabel(quote.unit) : undefined"
                  :rates="rates" :loading="ratesLoading" :error="ratesError" />
              </div>
            </template>
          </FormField>
          <FormField :label="t('改价生效日期（北京时间）')" :hint="priceFrom === today ? t('今天调价今天生效。') : t('按所选日期生效。')">
            <template #default="{ id }">
              <TextInput :id="id" v-model="priceFrom" type="date" :min="earliestPriceDate" :max="to" :disabled="submitting" :aria-label="t('改价生效日期')" @update:model-value="error = ''" />
            </template>
          </FormField>
        </template>
      </div>
      <Notice v-if="error" tone="danger">{{ error }}</Notice>
      <div class="submit">
        <Button variant="primary" :loading="submitting" :disabled="!periodChanged && !priceChanged" @click="submit">{{ submitting ? t('提交中…') : t('提交调整审核') }}</Button>
      </div>
    </template>
  </section>
</template>

<style scoped>
.period-panel { display: grid; gap: 14px; }
.loading { display: grid; place-items: center; padding: 12px; color: var(--hs-text-3); }
.line { margin: 0; }
.intro { margin: 0; color: var(--hs-text-3); font-size: var(--hs-text-xs); line-height: 1.7; }
.form { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 16px 20px; align-items: start; }
.form > :first-child { grid-column: 1 / -1; }
.toggle { grid-column: 1 / -1; display: inline-flex; align-items: center; gap: 8px; color: var(--hs-text); font-size: var(--hs-text-sm); cursor: pointer; }
.toggle input { width: 15px; height: 15px; margin: 0; padding: 0; accent-color: var(--hs-primary); box-shadow: none; }
.hints { display: grid; gap: 2px; margin-top: 6px; color: var(--hs-text-3); font-size: var(--hs-text-xs); }
.suggest { color: var(--hs-teal); }
.submit { display: flex; justify-content: flex-end; }
@media (max-width: 640px) { .form { grid-template-columns: minmax(0, 1fr); } }
</style>
