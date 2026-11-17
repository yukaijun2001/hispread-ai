<script setup lang="ts">
// Two-month range picker. Click a start day then an end day (order-free);
// shortcuts cover today / last 7 / last 30 days / this month. With `fromLocked`
// only the end date can change. Dates are YYYY-MM-DD in Beijing business days.
import { computed, nextTick, onBeforeUnmount, ref, watch } from 'vue';
import Icon from './Icon.vue';
import { getLocale, t } from '../../lib/i18n';
import { beijingDate } from '../../lib/money';

const props = withDefaults(defineProps<{
  from: string;
  to: string;
  label?: string;
  disabled?: boolean;
  minDate?: string;
  fromLocked?: boolean;
  size?: 'sm' | 'md';
}>(), { size: 'md' });
const emit = defineEmits<{ change: [from: string, to: string] }>();

const label = computed(() => props.label ?? t('适用期间'));
const open = ref(false);
const month = ref(new Date());
const start = ref('');
const hover = ref('');
const trigger = ref<HTMLButtonElement | null>(null);
const popup = ref<HTMLDivElement | null>(null);
const container = ref<HTMLElement | string>('body');
const position = ref({ top: 0, left: 0 });
const WEEKDAYS = ['一', '二', '三', '四', '五', '六', '日'].map((day) => t(day));

const toIso = (date: Date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
const monthOf = (value: string) => {
  const match = /^(\d{4})-(\d{2})-\d{2}$/.exec(value);
  if (match) return new Date(Number(match[1]), Number(match[2]) - 1, 1);
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), 1);
};
const shift = (date: Date, months: number) => new Date(date.getFullYear(), date.getMonth() + months, 1);
const slash = (value: string) => value.replaceAll('-', '/');

const shortcuts = computed(() => {
  const today = beijingDate();
  const [y, m, d] = today.split('-').map(Number);
  const back = (days: number) => new Date(Date.UTC(y, m - 1, d - days)).toISOString().slice(0, 10);
  return [
    { label: t('当日'), from: today, to: today },
    { label: t('近7天'), from: back(6), to: today },
    { label: t('近30天'), from: back(29), to: today },
    { label: t('本月'), from: `${today.slice(0, 7)}-01`, to: new Date(Date.UTC(y, m, 0)).toISOString().slice(0, 10) },
  ];
});
const activeShortcut = computed(() => shortcuts.value.find((s) => s.from === props.from && s.to === props.to));

function daysOf(first: Date) {
  const year = first.getFullYear();
  const index = first.getMonth();
  const offset = (new Date(year, index, 1).getDay() + 6) % 7;
  return Array.from({ length: 42 }, (_, i) => {
    const date = new Date(year, index, i - offset + 1);
    return { iso: toIso(date), day: date.getDate(), inMonth: date.getMonth() === index };
  });
}
const months = computed(() => [month.value, shift(month.value, 1)].map((first) => ({
  key: `${first.getFullYear()}-${first.getMonth()}`,
  title: new Intl.DateTimeFormat(getLocale(), { year: 'numeric', month: 'long' }).format(first),
  days: daysOf(first),
})));

const rangeStart = computed(() => (start.value ? (hover.value && hover.value < start.value ? hover.value : start.value) : props.from));
const rangeEnd = computed(() => (start.value ? (hover.value && hover.value > start.value ? hover.value : start.value) : props.to));
const isEndpoint = (iso: string) => iso === (start.value || props.from) || (!start.value && iso === props.to);
const inRange = (iso: string) => !!(rangeStart.value && rangeEnd.value && iso >= rangeStart.value && iso <= rangeEnd.value);
const blocked = (iso: string) => !!(props.minDate && iso < props.minDate);

function place() {
  const anchor = trigger.value?.getBoundingClientRect();
  const panel = popup.value?.getBoundingClientRect();
  if (!anchor || !panel) return;
  const left = Math.max(8, Math.min(anchor.left, window.innerWidth - panel.width - 8));
  const below = anchor.bottom + 8;
  position.value = { left, top: below + panel.height <= window.innerHeight - 8 ? below : Math.max(8, anchor.top - panel.height - 8) };
}

function close(focus = false) {
  open.value = false;
  start.value = '';
  hover.value = '';
  if (focus) trigger.value?.focus();
}

async function toggle() {
  if (open.value) { close(); return; }
  const focusDate = props.fromLocked ? props.to : props.minDate && props.from < props.minDate ? props.minDate : props.from;
  month.value = monthOf(focusDate);
  container.value = trigger.value?.closest<HTMLElement>('dialog[open]') ?? 'body';
  start.value = '';
  hover.value = '';
  open.value = true;
  await nextTick();
  place();
  const target = popup.value?.querySelector<HTMLButtonElement>(`[data-date="${focusDate}"]`);
  (target && !target.disabled ? target : popup.value?.querySelector<HTMLButtonElement>('.hs-day:not(:disabled)'))?.focus();
}

function pick(iso: string) {
  if (blocked(iso)) return;
  if (props.fromLocked) { emit('change', props.from, iso); close(true); return; }
  if (!start.value) { start.value = iso; hover.value = ''; return; }
  emit('change', start.value < iso ? start.value : iso, start.value > iso ? start.value : iso);
  close(true);
}

function applyShortcut(from: string, to: string) {
  if (props.fromLocked || blocked(from)) return;
  emit('change', from, to);
  close(true);
}

const onOutside = (event: Event) => {
  const target = event.target as Node;
  if (!trigger.value?.contains(target) && !popup.value?.contains(target)) close();
};
const onKey = (event: KeyboardEvent) => { if (event.key === 'Escape') { event.preventDefault(); close(true); } };
watch(open, (value) => {
  const method = value ? 'addEventListener' : 'removeEventListener';
  document[method]('pointerdown', onOutside, true);
  document[method]('focusin', onOutside);
  document[method]('keydown', onKey as EventListener);
  window[method]('resize', place);
  window[method]('scroll', place, true);
});
watch(month, () => nextTick(place));
onBeforeUnmount(() => { if (open.value) close(); });
</script>

<template>
  <button
    ref="trigger"
    type="button"
    class="hs-range"
    :class="[size, { open }]"
    :disabled="disabled"
    :aria-label="t('{0}：{1}', [label, from && to ? t('{0} 至 {1}', [slash(from), slash(to)]) : t('未选择')])"
    aria-haspopup="dialog"
    :aria-expanded="open"
    @click="toggle"
  >
    <span v-if="from && to" class="hs-range-value">{{ slash(from) }} <span class="hs-range-sep">→</span> {{ slash(to) }}</span>
    <span v-else class="hs-range-placeholder">{{ t('选择{0}', [label]) }}</span>
    <Icon name="clock" :size="15" />
  </button>
  <Teleport v-if="open" :to="container">
    <div ref="popup" class="hs-range-popup" role="dialog" :aria-label="t('选择{0}', [label])" :style="{ top: `${position.top}px`, left: `${position.left}px` }">
      <div class="hs-range-head">
        <span>{{ fromLocked ? t('开始日期已锁定，请选择结束日期') : start ? t('选择结束日期') : t('选择开始日期，再选择结束日期') }}</span>
        <div>
          <button type="button" :aria-label="t('上两个月')" @click="month = shift(month, -2)"><Icon name="chevron" :size="14" class="flip" /></button>
          <button type="button" :aria-label="t('下两个月')" @click="month = shift(month, 2)"><Icon name="chevron" :size="14" /></button>
        </div>
      </div>
      <div class="hs-range-months">
        <div v-for="m in months" :key="m.key" class="hs-range-month">
          <strong>{{ m.title }}</strong>
          <div class="hs-range-grid">
            <span v-for="day in WEEKDAYS" :key="day" class="hs-weekday">{{ day }}</span>
            <template v-for="cell in m.days" :key="cell.iso">
              <span v-if="!cell.inMonth" class="hs-day-outside" aria-hidden="true" />
              <button
                v-else
                type="button"
                class="hs-day"
                :class="{ 'in-range': inRange(cell.iso), endpoint: isEndpoint(cell.iso) }"
                :data-date="cell.iso"
                :aria-label="t('{0}年{1}月{2}日', cell.iso.split('-').map(Number))"
                :aria-pressed="isEndpoint(cell.iso)"
                :disabled="blocked(cell.iso)"
                @click="pick(cell.iso)"
                @pointerenter="!blocked(cell.iso) && (hover = cell.iso)"
              >{{ cell.day }}</button>
            </template>
          </div>
        </div>
      </div>
      <div class="hs-range-foot">
        <span>{{ fromLocked ? t('开始日期 {0} 保留，历史期间不可修改', [slash(from)]) : start ? t('已选开始：{0}，请选择结束日期', [slash(start)]) : t('区间包含开始和结束当天') }}</span>
        <div v-if="!fromLocked" class="hs-range-shortcuts" role="group" :aria-label="t('快捷日期')">
          <button
            v-for="shortcut in shortcuts"
            :key="shortcut.label"
            type="button"
            :class="{ active: !start && shortcut === activeShortcut }"
            :aria-pressed="!start && shortcut === activeShortcut"
            :disabled="!!(minDate && shortcut.from < minDate)"
            @click="applyShortcut(shortcut.from, shortcut.to)"
          >{{ shortcut.label }}</button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<style scoped>
.hs-range {
  display: flex; align-items: center; justify-content: space-between; gap: 8px;
  width: 100%; min-width: 0; height: var(--hs-control-height); min-height: 0; padding: 0 10px 0 12px;
  color: var(--hs-text); background: var(--hs-surface);
  border: 1px solid var(--hs-border-strong); border-radius: var(--hs-radius-control); box-shadow: var(--hs-shadow-control);
  font: inherit; font-size: var(--hs-text-sm); font-variant-numeric: tabular-nums; text-align: left; white-space: nowrap; cursor: pointer;
}
.hs-range.sm { height: var(--hs-control-height-sm); font-size: var(--hs-text-xs); }
.hs-range:hover:not(:disabled) { border-color: #c4c4c4; }
.hs-range.open, .hs-range:focus-visible { outline: none; border-color: var(--hs-accent); box-shadow: var(--hs-accent-ring); }
.hs-range:disabled { color: var(--hs-text-3); background: var(--hs-surface-subtle); cursor: not-allowed; }
.hs-range > .hs-icon { color: var(--hs-text-3); }
.hs-range-value { overflow: hidden; text-overflow: ellipsis; }
.hs-range-sep { color: var(--hs-text-4); }
.hs-range-placeholder { color: var(--hs-text-3); }

.hs-range-popup { position: fixed; z-index: 1000; width: min(560px, calc(100vw - 16px)); padding: 12px; color: var(--hs-text); background: var(--hs-surface); border: 1px solid var(--hs-border); border-radius: 14px; box-shadow: var(--hs-shadow-pop); font-family: var(--hs-font); font-size: var(--hs-text-xs); }
.hs-range-head, .hs-range-foot { display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: 8px; color: var(--hs-text-3); }
.hs-range-head div { display: flex; gap: 4px; }
.hs-range-head button { display: grid; place-items: center; width: 28px; height: 28px; min-height: 0; padding: 0; color: var(--hs-text-2); background: none; border: 1px solid var(--hs-border); border-radius: 8px; cursor: pointer; }
.hs-range-head button:hover { background: var(--hs-surface-hover); }
.flip { transform: rotate(180deg); }
.hs-range-months { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 16px; margin: 10px 0; }
.hs-range-month strong { display: block; margin-bottom: 6px; text-align: center; font-size: var(--hs-text-sm); font-weight: 600; }
.hs-range-grid { display: grid; grid-template-columns: repeat(7, 1fr); gap: 2px 0; }
.hs-weekday { padding: 4px 0; color: var(--hs-text-4); text-align: center; font-size: 11px; }
.hs-day, .hs-day-outside { height: 30px; }
.hs-day { min-height: 0; padding: 0; color: var(--hs-text); background: none; border: 0; border-radius: 0; font: inherit; font-size: var(--hs-text-xs); font-variant-numeric: tabular-nums; cursor: pointer; }
.hs-day:hover:not(:disabled):not(.endpoint) { background: var(--hs-surface-hover); border-radius: 8px; }
.hs-day.in-range { background: #f0f0f0; }
.hs-day.endpoint { color: #fff; background: var(--hs-primary); border-radius: 8px; font-weight: 600; }
.hs-day:disabled { color: var(--hs-text-4); background: none; cursor: not-allowed; text-decoration: line-through; }
.hs-day:focus-visible { outline: 2px solid var(--hs-accent); outline-offset: -2px; border-radius: 8px; }
.hs-range-foot { padding-top: 10px; border-top: 1px solid var(--hs-divider); }
.hs-range-shortcuts { display: flex; flex-wrap: wrap; gap: 4px; }
.hs-range-shortcuts button { height: 26px; min-height: 0; padding: 0 10px; color: var(--hs-text-2); background: var(--hs-surface); border: 1px solid var(--hs-border); border-radius: 999px; font: inherit; font-size: 11px; cursor: pointer; }
.hs-range-shortcuts button:hover:not(:disabled) { border-color: var(--hs-border-strong); color: var(--hs-text); }
.hs-range-shortcuts button.active { color: #fff; background: var(--hs-primary); border-color: var(--hs-primary); }
.hs-range-shortcuts button:disabled { opacity: .45; cursor: not-allowed; }
@media (max-width: 560px) { .hs-range-months { grid-template-columns: 1fr; } .hs-range-month:nth-child(2) { display: none; } }
</style>
