<script setup lang="ts">
// An amount at currency precision. When rounding hides digits the figure is
// marked "≈" (or "< 0.01" when it rounds to zero); clicking shows the exact value.
import { computed, ref } from 'vue';
import { t } from '../../../lib/i18n';
import { formatMoney } from '../../../lib/money';

const props = defineProps<{ currency: string; value: string | null | undefined }>();
const open = ref(false);

const normal = (value: string) => {
  const [whole, fraction = ''] = value.replaceAll(',', '').split('.');
  return `${whole.replace(/^(-?)0+(?=\d)/, '$1')}.${fraction.replace(/0+$/, '')}`;
};
const rounded = computed(() => formatMoney(props.value, props.currency));
const approximate = computed(() => props.value != null && normal(rounded.value) !== normal(String(props.value)));
const tiny = computed(() => approximate.value && /^0(?:\.0+)?$/.test(rounded.value));
const shown = computed(() => (tiny.value
  ? `${String(props.value).startsWith('-') ? '> -' : '< '}${props.currency === 'JPY' ? '1' : '0.01'}`
  : rounded.value));

function onKey(event: KeyboardEvent) {
  if (event.key === 'Escape' && open.value) { event.preventDefault(); event.stopPropagation(); open.value = false; }
}
</script>

<template>
  <span v-if="value == null" class="st-money missing">—</span>
  <span v-else class="st-money">
    <span class="st-money-summary">
      <small v-if="currency">{{ currency }}</small>
      <button
        type="button"
        :title="`${currency} ${value}`.trim()"
        :aria-label="t('查看完整金额：{0} {1}', [currency, value])"
        :aria-expanded="open"
        @click.stop="open = !open"
        @keydown="onKey"
      ><span v-if="approximate && !tiny" class="approx">≈ </span>{{ shown }}</button>
    </span>
    <span v-if="open" class="st-money-exact">
      <small>{{ t('完整原值') }}</small>
      <span>{{ value }}</span>
    </span>
  </span>
</template>

<style scoped>
.st-money { display: inline-grid; gap: 4px; font-variant-numeric: tabular-nums; }
.st-money.missing { color: var(--hs-text-3); }
.st-money-summary { display: inline-flex; align-items: baseline; gap: 6px; }
.st-money-summary small { color: var(--hs-text-3); font-size: .5em; font-weight: 500; letter-spacing: 0; }
.st-money-summary button { min-height: 0; padding: 0; color: inherit; background: none; border: 0; font: inherit; letter-spacing: inherit; cursor: pointer; }
.st-money-summary button:focus-visible { outline: 2px solid var(--hs-accent); outline-offset: 2px; border-radius: 4px; }
.approx { color: var(--hs-text-3); }
.st-money-exact { display: inline-flex; flex-wrap: wrap; gap: 6px; padding: 4px 8px; color: var(--hs-text-2); background: var(--hs-surface-subtle); border: 1px solid var(--hs-border); border-radius: 8px; font-size: var(--hs-text-xs); font-weight: 400; letter-spacing: 0; overflow-wrap: anywhere; }
.st-money-exact small { color: var(--hs-text-3); }
</style>
