<script setup lang="ts" generic="V extends string">
// Listbox select. Opens in a floating panel positioned against the trigger and
// rendered into the nearest modal dialog (so it stays in the top layer) or the
// body. Supports search and multiple selection.
import { computed, nextTick, onBeforeUnmount, ref, useId, watch } from 'vue';
import Icon from './Icon.vue';
import Spinner from './Spinner.vue';
import type { IconName } from './icons';
import { t } from '../../lib/i18n';
import type { SelectOption } from './types';

const props = withDefaults(defineProps<{
  options: Array<SelectOption<V>>;
  label: string;
  placeholder?: string;
  multiple?: boolean;
  searchable?: boolean;
  searchPlaceholder?: string;
  searchLoading?: boolean;
  emptyText?: string;
  disabled?: boolean;
  invalid?: boolean;
  icon?: IconName;
  size?: 'sm' | 'md';
  pill?: boolean;
  id?: string;
}>(), { size: 'md' });
const model = defineModel<V | V[] | ''>({ required: true });
const emit = defineEmits<{ search: [query: string] }>();

const open = ref(false);
const query = ref('');
const activeIndex = ref(-1);
const trigger = ref<HTMLButtonElement | null>(null);
const panel = ref<HTMLDivElement | null>(null);
const searchInput = ref<HTMLInputElement | null>(null);
const container = ref<HTMLElement | string>('body');
const position = ref({ top: 0, left: 0, width: 0, maxHeight: 320, above: false });
const listId = useId();

const selectedValues = computed<V[]>(() => (Array.isArray(model.value) ? model.value : model.value ? [model.value as V] : []));
const visibleOptions = computed(() => {
  const term = query.value.trim().toLowerCase();
  if (!term) return props.options;
  return props.options.filter((option) => `${option.label} ${option.detail ?? ''} ${option.value}`.toLowerCase().includes(term));
});
const triggerText = computed(() => {
  const chosen = props.options.filter((option) => selectedValues.value.includes(option.value));
  if (!chosen.length) return '';
  if (props.multiple && chosen.length > 1) return t('已选 {0} 项', [chosen.length]);
  return chosen[0].shortLabel || chosen[0].label;
});

function place() {
  const box = trigger.value?.getBoundingClientRect();
  if (!box) return;
  const margin = 8;
  const below = window.innerHeight - box.bottom - margin;
  const above = box.top - margin;
  const showAbove = below < 220 && above > below;
  const width = Math.max(box.width, 200);
  position.value = {
    top: showAbove ? box.top - 6 : box.bottom + 6,
    left: Math.min(Math.max(margin, box.left), window.innerWidth - width - margin),
    width,
    maxHeight: Math.min(360, (showAbove ? above : below) - 6),
    above: showAbove,
  };
}

function openPanel() {
  if (props.disabled) return;
  container.value = trigger.value?.closest('dialog') ?? 'body';
  place();
  open.value = true;
  query.value = '';
  const current = visibleOptions.value.findIndex((option) => selectedValues.value.includes(option.value));
  activeIndex.value = current >= 0 ? current : visibleOptions.value.findIndex((option) => !option.disabled);
  nextTick(() => (props.searchable ? searchInput.value : panel.value)?.focus());
}

function closePanel(focusTrigger = true) {
  if (!open.value) return;
  open.value = false;
  if (focusTrigger) trigger.value?.focus({ preventScroll: true });
}

function choose(option: SelectOption<V>) {
  if (option.disabled) return;
  if (props.multiple) {
    const values = selectedValues.value.includes(option.value)
      ? selectedValues.value.filter((value) => value !== option.value)
      : [...selectedValues.value, option.value];
    model.value = values;
  } else {
    model.value = option.value;
    closePanel();
  }
}

function move(step: number) {
  const options = visibleOptions.value;
  if (!options.length) return;
  let index = activeIndex.value;
  for (let i = 0; i < options.length; i++) {
    index = (index + step + options.length) % options.length;
    if (!options[index].disabled) break;
  }
  activeIndex.value = index;
  nextTick(() => panel.value?.querySelector(`[data-index="${index}"]`)?.scrollIntoView({ block: 'nearest' }));
}

function onKeydown(event: KeyboardEvent) {
  if (event.key === 'ArrowDown') { event.preventDefault(); move(1); }
  else if (event.key === 'ArrowUp') { event.preventDefault(); move(-1); }
  else if (event.key === 'Enter') {
    event.preventDefault();
    const option = visibleOptions.value[activeIndex.value];
    if (option) choose(option);
  } else if (event.key === 'Escape') { event.preventDefault(); event.stopPropagation(); closePanel(); }
  else if (event.key === 'Tab') closePanel(false);
}

function onTriggerKeydown(event: KeyboardEvent) {
  if (['ArrowDown', 'ArrowUp', 'Enter', ' '].includes(event.key)) { event.preventDefault(); openPanel(); }
}

const onOutside = (event: PointerEvent) => {
  const target = event.target as Node;
  if (!trigger.value?.contains(target) && !panel.value?.contains(target)) closePanel(false);
};
const onViewportChange = (event: Event) => {
  if (event.type === 'scroll' && panel.value?.contains(event.target as Node)) return;
  place();
};

watch(open, (isOpen) => {
  const method = isOpen ? 'addEventListener' : 'removeEventListener';
  document[method]('pointerdown', onOutside as EventListener, true);
  window[method]('resize', onViewportChange);
  window[method]('scroll', onViewportChange, true);
});
watch(query, (value) => { emit('search', value); activeIndex.value = 0; });
onBeforeUnmount(() => { open.value = false; });
</script>

<template>
  <button
    :id="id"
    ref="trigger"
    type="button"
    class="hs-select"
    :class="[size, { open, invalid, pill, placeholder: !triggerText }]"
    :disabled="disabled"
    aria-haspopup="listbox"
    :aria-expanded="open"
    :aria-controls="open ? listId : undefined"
    :aria-label="triggerText ? `${label}：${triggerText}` : label"
    @click="open ? closePanel() : openPanel()"
    @keydown="onTriggerKeydown"
  >
    <Icon v-if="icon" :name="icon" :size="15" class="hs-select-icon" />
    <span class="hs-select-value">{{ triggerText || placeholder || label }}</span>
    <Icon name="down" :size="15" class="hs-select-caret" />
  </button>
  <Teleport v-if="open" :to="container">
    <div
      :id="listId"
      ref="panel"
      class="hs-select-panel"
      :class="{ above: position.above }"
      role="listbox"
      tabindex="-1"
      :aria-label="label"
      :aria-multiselectable="multiple || undefined"
      :style="{ top: `${position.top}px`, left: `${position.left}px`, minWidth: `${position.width}px`, maxHeight: `${position.maxHeight}px` }"
      @keydown="onKeydown"
    >
      <div v-if="searchable" class="hs-select-search">
        <Icon name="search" :size="14" />
        <input ref="searchInput" v-model="query" type="search" :placeholder="searchPlaceholder || t('搜索')" :aria-label="searchPlaceholder || t('搜索')" />
        <Spinner v-if="searchLoading" :size="12" />
      </div>
      <div class="hs-select-options">
        <button
          v-for="(option, index) in visibleOptions"
          :key="option.value"
          type="button"
          role="option"
          tabindex="-1"
          :data-index="index"
          class="hs-select-option"
          :class="{ active: index === activeIndex, 'is-selected': selectedValues.includes(option.value) }"
          :aria-selected="selectedValues.includes(option.value)"
          :disabled="option.disabled"
          @mouseenter="activeIndex = index"
          @click="choose(option)"
        >
          <span v-if="multiple" class="hs-select-check" aria-hidden="true"><Icon v-if="selectedValues.includes(option.value)" name="check" :size="12" /></span>
          <span class="hs-select-text">
            <span>{{ option.label }}</span>
            <small v-if="option.detail">{{ option.detail }}</small>
          </span>
          <Icon v-if="!multiple && selectedValues.includes(option.value)" name="check" :size="15" class="hs-select-tick" />
        </button>
        <p v-if="!visibleOptions.length" class="hs-select-empty">{{ emptyText || t('没有匹配的选项') }}</p>
      </div>
    </div>
  </Teleport>
</template>

<style scoped>
.hs-select {
  display: flex; align-items: center; gap: 8px;
  width: 100%; min-width: 0; height: var(--hs-control-height); min-height: 0; padding: 0 10px 0 12px;
  color: var(--hs-text); background: var(--hs-surface);
  border: 1px solid var(--hs-border-strong); border-radius: var(--hs-radius-control);
  box-shadow: var(--hs-shadow-control);
  font: inherit; font-size: var(--hs-text-sm); text-align: left; cursor: pointer;
  transition: border-color .15s, box-shadow .15s;
}
.hs-select.sm { height: var(--hs-control-height-sm); font-size: var(--hs-text-xs); }
.hs-select.pill { border-radius: 999px; }
.hs-select:hover:not(:disabled) { border-color: #c4c4c4; }
.hs-select.open, .hs-select:focus-visible { outline: none; border-color: var(--hs-accent); box-shadow: var(--hs-accent-ring); }
.hs-select.invalid { border-color: #e3a1aa; }
.hs-select:disabled { color: var(--hs-text-3); background: var(--hs-surface-subtle); cursor: not-allowed; }
.hs-select.placeholder .hs-select-value { color: var(--hs-text-3); }
.hs-select-icon { color: var(--hs-text-3); }
.hs-select-value { flex: 1; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.hs-select-caret { color: var(--hs-text-3); transition: transform .15s; }
.hs-select.open .hs-select-caret { transform: rotate(180deg); }

.hs-select-panel {
  position: fixed; z-index: 1000;
  display: flex; flex-direction: column;
  max-width: min(420px, calc(100vw - 16px));
  padding: 4px;
  color: var(--hs-text);
  background: var(--hs-surface);
  border: 1px solid var(--hs-border);
  border-radius: 12px;
  box-shadow: var(--hs-shadow-pop);
  font-family: var(--hs-font);
  outline: none;
}
.hs-select-panel.above { transform: translateY(-100%); }
.hs-select-search { display: flex; align-items: center; gap: 6px; margin: 2px 2px 4px; padding: 0 8px; height: 32px; color: var(--hs-text-3); border: 1px solid var(--hs-border); border-radius: 8px; flex: none; }
.hs-select-search input { flex: 1; min-width: 0; height: 100%; padding: 0; color: var(--hs-text); background: none; border: 0; border-radius: 0; outline: none; box-shadow: none; font: inherit; font-size: var(--hs-text-sm); }
.hs-select-options { overflow-y: auto; overscroll-behavior: contain; min-height: 0; }
.hs-select-option {
  display: flex; align-items: center; gap: 8px;
  width: 100%; min-height: 34px; padding: 6px 8px;
  color: var(--hs-text); background: none; border: 0; border-radius: 8px;
  font: inherit; font-size: var(--hs-text-sm); text-align: left; cursor: pointer;
}
.hs-select-option.active { background: var(--hs-surface-hover); }
.hs-select-option:disabled { color: var(--hs-text-4); cursor: not-allowed; }
.hs-select-text { display: flex; flex-direction: column; flex: 1; min-width: 0; }
.hs-select-text small { color: var(--hs-text-3); font-size: 11px; overflow-wrap: anywhere; }
.hs-select-tick { color: var(--hs-text); }
.hs-select-check { display: grid; place-items: center; width: 16px; height: 16px; color: #fff; border: 1px solid var(--hs-border-strong); border-radius: 5px; flex: none; }
.hs-select-option.is-selected .hs-select-check { background: var(--hs-primary); border-color: var(--hs-primary); }
.hs-select-empty { margin: 0; padding: 14px 8px; color: var(--hs-text-3); font-size: var(--hs-text-xs); text-align: center; }
</style>
