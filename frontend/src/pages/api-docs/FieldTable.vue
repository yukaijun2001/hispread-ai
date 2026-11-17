<script setup lang="ts">
// Request or response fields of one operation.
import { t } from '../../lib/i18n';
import { fieldHint, type Field } from './docs';

defineProps<{ fields: Field[]; request?: boolean }>();
</script>

<template>
  <div v-if="fields.length" class="field-scroll" role="region" tabindex="0" :aria-label="t('接口字段')">
    <table class="field-table">
      <thead>
        <tr>
          <th>{{ t('字段') }}</th>
          <th>{{ t('类型') }}</th>
          <th v-if="request">{{ t('必填') }}</th>
          <th>{{ t('说明') }}</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="field in fields" :key="field.name">
          <td><code>{{ field.name }}</code></td>
          <td><code>{{ field.type }}</code></td>
          <td v-if="request">{{ field.required ? t('是') : t('否') }}</td>
          <td>{{ t(fieldHint(field, !!request)) || '—' }}</td>
        </tr>
      </tbody>
    </table>
  </div>
  <p v-else class="none">{{ t('无需额外参数。') }}</p>
</template>

<style scoped>
.field-scroll { overflow-x: auto; border: 1px solid var(--hs-border); border-radius: var(--hs-radius-control); }
.field-scroll:focus-visible { outline: none; box-shadow: var(--hs-accent-ring); }
.field-table { width: 100%; border-collapse: collapse; font-size: var(--hs-text-sm); }
.field-table th { padding: 9px 14px; color: var(--hs-text-3); background: var(--hs-surface-subtle); border-bottom: 1px solid var(--hs-border); font-size: var(--hs-text-xs); font-weight: 500; text-align: left; white-space: nowrap; }
.field-table td { padding: 10px 14px; color: var(--hs-text-2); border-top: 1px solid var(--hs-divider); line-height: 1.6; vertical-align: top; }
.field-table tbody tr:first-child td { border-top: 0; }
.field-table td:nth-child(-n+2) { white-space: nowrap; }
.field-table code { color: var(--hs-text); background: none; padding: 0; font-family: var(--hs-font-mono); font-size: 12.5px; }
.none { margin: 0; color: var(--hs-text-3); font-size: var(--hs-text-sm); }
</style>
