<script setup lang="ts">
// Daily turnover as SVG bars or an area line. Point values are exact decimal
// strings; they become numbers only for geometry and axis ticks.
import { computed } from 'vue';
import { t } from '../../lib/i18n';
import { formatMoney } from '../../lib/money';
import type { TurnoverPoint } from './reports';

const props = defineProps<{ mode: 'bar' | 'area'; currency: string; points: TurnoverPoint[] }>();

const LEFT = 58;
const WIDTH = 650;
const BASE = 192;
const HEIGHT = 176;

/** Round the axis maximum up to 1, 2, 2.5, 5 or 10 × 10ⁿ with 8% headroom. */
function niceMax(value: number): number {
  if (value <= 0) return 1;
  const padded = value * 1.08;
  const magnitude = 10 ** Math.floor(Math.log10(padded));
  const ratio = padded / magnitude;
  return (ratio <= 1 ? 1 : ratio <= 2 ? 2 : ratio <= 2.5 ? 2.5 : ratio <= 5 ? 5 : 10) * magnitude;
}

const values = computed(() => props.points.map((point) => Number(point.value)));
const top = computed(() => niceMax(Math.max(...values.value, 0)));
const ticks = computed(() => [0, 0.25, 0.5, 0.75, 1].map((step) => top.value * step));
const slot = computed(() => WIDTH / props.points.length);
const y = (value: number) => BASE - (value / top.value) * HEIGHT;
const centre = (index: number) => LEFT + slot.value * index + slot.value / 2;
const labelEvery = computed(() => (props.points.length <= 10 ? 1 : props.points.length <= 16 ? 2 : 3));
const tickLabel = (value: number) => Math.round(value).toLocaleString('en-US');

const line = computed(() => values.value.map((value, index) => `${index === 0 ? 'M' : 'L'} ${centre(index)} ${y(value)}`).join(' '));
const area = computed(() => `${line.value} L ${centre(props.points.length - 1)} ${y(0)} L ${centre(0)} ${y(0)} Z`);
const bars = computed(() => {
  const width = Math.min(28, slot.value * 0.46);
  return props.points.map((point, index) => {
    const value = values.value[index];
    return {
      point,
      x: LEFT + slot.value * index + (slot.value - width) / 2,
      y: y(value),
      width,
      height: Math.max(y(0) - y(value), value > 0 ? 2 : 0),
    };
  });
});
</script>

<template>
  <svg class="tr-chart" viewBox="0 0 720 220" role="img" :aria-label="t('每日营业额{0}', [t(mode === 'bar' ? '柱状图' : '面积图')])">
    <g v-for="tick in ticks" :key="tick" class="tr-grid">
      <line :x1="LEFT" :x2="LEFT + WIDTH" :y1="y(tick)" :y2="y(tick)" />
      <text :x="50" :y="y(tick) + 4" text-anchor="end">{{ tickLabel(tick) }}</text>
    </g>
    <template v-if="mode === 'area'">
      <path class="tr-area" :d="area" />
      <path class="tr-line" :d="line" />
    </template>
    <template v-else>
      <rect v-for="bar in bars" :key="bar.point.date" class="tr-bar" :x="bar.x" :y="bar.y" :width="bar.width" :height="bar.height" rx="3">
        <title>{{ bar.point.date }} {{ currency }} {{ formatMoney(bar.point.value, currency) }}</title>
      </rect>
    </template>
    <text v-for="(point, index) in points" :key="point.date" class="tr-axis" :x="centre(index)" :y="212" text-anchor="middle">
      {{ index % labelEvery === 0 ? point.date.slice(5).replace('-', '/') : '' }}
    </text>
  </svg>
</template>

<style scoped>
.tr-chart { display: block; width: 100%; height: auto; }
.tr-grid line { stroke: var(--hs-divider); stroke-width: 1; }
.tr-grid text, .tr-axis { fill: var(--hs-text-3); font-size: 11px; font-variant-numeric: tabular-nums; }
.tr-bar { fill: var(--hs-accent); }
.tr-bar:hover { fill: var(--hs-accent-hover); }
.tr-area { fill: var(--hs-accent-soft); }
.tr-line { fill: none; stroke: var(--hs-accent); stroke-width: 2; stroke-linejoin: round; stroke-linecap: round; }
</style>
