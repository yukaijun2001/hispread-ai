<script setup lang="ts">
// An amount at currency precision. When rounding hides digits the figure is
// marked "≈" (or shown as "< 0.01"); clicking reveals the exact server value.
import { computed, ref } from 'vue';
import { t } from '../../../lib/i18n';
import { formatMoney } from '../../../lib/money';

const props = defineProps<{ currency?: string | null; value: string | number | null | undefined }>();
const open = ref(false);

const raw = computed(() => (props.value == null ? '' : String(props.value)));
const rounded = computed(() => formatMoney(raw.value, props.currency || undefined));
const normal = (text: string) => {
  const [whole, fraction = ''] = text.replaceAll(',', '').split('.');
  return `${whole.replace(/^(-?)0+(?=\d)/, '$1')}.${fraction.replace(/0+$/, '')}`;
};
const approximate = computed(() => normal(rounded.value) !== normal(raw.value));
const tiny = computed(() => approximate.value && /^0(?:\.0+)?$/.test(rounded.value));
const shown = computed(() => (tiny.value
  ? `${raw.value.startsWith('-') ? '> -' : '< '}${props.currency === 'JPY' ? '1' : '0.01'}`
  : rounded.value));

function onKeydown(event: KeyboardEvent) {
  if (event.key !== 'Escape' || !open.value) return;
  event.preventDefault();
  event.stopPropagation();
  open.value = false;
}
</script>

<template>
  <span v-if="value == null" class="rs-money missing">—</span>
  <span v-else class="rs-money">
    <span class="rs-money-summary">
      <small v-if="currency">{{ currency }}</small>
      <button
        type="button"
        :title="[currency, raw].filter(Boolean).join(' ')"
        :aria-label="t('查看完整金额：{0} {1}', [currency || '', raw])"
        :aria-expanded="open"
        @click.stop="open = !open"
        @keydown="onKeydown"
      ><span v-if="approximate && !tiny" class="rs-money-approx">≈ </span>{{ shown }}</button>
    </span>
    <span v-if="open" class="rs-money-exact">
      <small>{{ t('完整原值') }}</small>
      <span>{{ raw }}</span>
    </span>
  </span>
</template>

<style scoped>
.rs-money { display: inline-grid; gap: 2px; justify-items: inherit; font-variant-numeric: tabular-nums; }
.rs-money.missing { color: var(--hs-text-4); }
.rs-money-summary { display: inline-flex; align-items: baseline; gap: 4px; white-space: nowrap; }
.rs-money-summary small { color: var(--hs-text-3); font-size: 11px; font-weight: 500; }
.rs-money-summary button { min-height: 0; padding: 0; color: inherit; background: none; border: 0; border-radius: 4px; font: inherit; font-weight: inherit; cursor: pointer; }
.rs-money-summary button:hover { text-decoration: underline dotted; text-underline-offset: 3px; }
.rs-money-summary button:focus-visible { outline: none; box-shadow: var(--hs-accent-ring); }
.rs-money-approx { color: var(--hs-text-3); }
.rs-money-exact { display: inline-flex; align-items: baseline; gap: 6px; padding: 2px 6px; color: var(--hs-text-2); background: var(--hs-surface-subtle); border: 1px solid var(--hs-border); border-radius: 6px; font-family: var(--hs-font-mono); font-size: 11px; font-weight: 400; overflow-wrap: anywhere; }
.rs-money-exact small { font-family: var(--hs-font); color: var(--hs-text-3); }
</style>
