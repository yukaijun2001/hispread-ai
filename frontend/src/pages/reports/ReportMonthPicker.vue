<script setup lang="ts">
// Month picker for the report range: a year header and a 12-month grid.
// Months outside [min, max] are disabled; years with no selectable month too.
import { ref, watch } from 'vue';
import Popover from '../../components/ui/Popover.vue';
import Icon from '../../components/ui/Icon.vue';
import { t } from '../../lib/i18n';
import { monthLabel } from './reports';

const props = defineProps<{ label: string; min?: string; max?: string }>();
const model = defineModel<string>({ required: true });

const open = ref(false);
const year = ref(Number(model.value.slice(0, 4)));
watch(model, (value) => { year.value = Number(value.slice(0, 4)); });

const pad = (value: number) => String(value).padStart(2, '0');
const yearSelectable = (value: number) => (!props.min || `${value}-12` >= props.min) && (!props.max || `${value}-01` <= props.max);
const monthDisabled = (value: string) => (!!props.min && value < props.min) || (!!props.max && value > props.max);

function choose(value: string) {
  model.value = value;
  open.value = false;
}
</script>

<template>
  <Popover v-model:open="open" align="start" width="248px">
    <template #trigger="{ toggle }">
      <button
        type="button"
        class="rp-month-trigger"
        :aria-label="t('{0}：{1}', [label, monthLabel(model)])"
        aria-haspopup="dialog"
        :aria-expanded="open"
        @click="toggle"
      >
        <span>{{ monthLabel(model) }}</span>
        <Icon name="down" :size="14" />
      </button>
    </template>
    <div class="rp-month-panel" role="dialog" :aria-label="label">
      <header>
        <button type="button" :aria-label="t('上一年')" :disabled="!yearSelectable(year - 1)" @click="year--"><span aria-hidden="true">‹</span></button>
        <strong>{{ year }}{{ t('年') }}</strong>
        <button type="button" :aria-label="t('下一年')" :disabled="!yearSelectable(year + 1)" @click="year++"><span aria-hidden="true">›</span></button>
      </header>
      <div class="rp-month-grid">
        <button
          v-for="index in 12"
          :key="`${year}-${pad(index)}`"
          type="button"
          :class="{ current: `${year}-${pad(index)}` === model }"
          :aria-pressed="`${year}-${pad(index)}` === model"
          :disabled="monthDisabled(`${year}-${pad(index)}`)"
          @click="choose(`${year}-${pad(index)}`)"
        >
          {{ index }}{{ t('月') }}
        </button>
      </div>
    </div>
  </Popover>
</template>

<style scoped>
.rp-month-trigger {
  display: inline-flex; align-items: center; justify-content: space-between; gap: 8px; min-width: 128px; height: 36px; padding: 0 12px;
  color: var(--hs-text); background: var(--hs-surface); border: 1px solid var(--hs-border); border-radius: var(--hs-radius-control);
  box-shadow: var(--hs-shadow-control); font: inherit; font-size: var(--hs-text-sm); cursor: pointer; font-variant-numeric: tabular-nums;
}
.rp-month-trigger:hover { border-color: var(--hs-border-strong); }
.rp-month-trigger[aria-expanded="true"] { border-color: var(--hs-accent); box-shadow: var(--hs-accent-ring); }
.rp-month-trigger .hs-icon { color: var(--hs-text-3); }
.rp-month-panel { padding: 10px; }
.rp-month-panel header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 8px; }
.rp-month-panel header strong { font-size: var(--hs-text-sm); color: var(--hs-text); }
.rp-month-panel header button {
  width: 28px; height: 28px; color: var(--hs-text-2); background: none; border: 0; border-radius: var(--hs-radius-small); font-size: 18px; line-height: 1; cursor: pointer;
}
.rp-month-panel header button:hover:not(:disabled) { background: var(--hs-surface-hover); }
.rp-month-panel header button:disabled { color: var(--hs-text-4); cursor: not-allowed; }
.rp-month-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 4px; }
.rp-month-grid button {
  height: 34px; color: var(--hs-text-2); background: none; border: 0; border-radius: var(--hs-radius-small); font: inherit; font-size: var(--hs-text-sm); cursor: pointer;
}
.rp-month-grid button:hover:not(:disabled) { background: var(--hs-surface-hover); }
.rp-month-grid button:disabled { color: var(--hs-text-4); cursor: not-allowed; }
.rp-month-grid button.current { color: #fff; background: var(--hs-primary); }
</style>
