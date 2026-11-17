<script setup lang="ts">
// Shown when the supplier may not onboard new CCMAX accounts (or the check failed).
import Button from '../../../components/ui/Button.vue';
import Notice from '../../../components/ui/Notice.vue';
import { t } from '../../../lib/i18n';
import type { IntakeAccess } from '../composables/useIntakeAccess';

defineProps<{ access: IntakeAccess }>();
</script>

<template>
  <template v-if="access.enabled.value && !access.loading.value && !access.allowed.value">
    <Notice v-if="access.error.value" tone="danger">
      {{ access.error.value }}
      <template #actions><Button size="sm" @click="access.reload()">{{ t('重新加载配置') }}</Button></template>
    </Notice>
    <Notice v-else tone="warning">{{ access.deniedMessage.value }}</Notice>
  </template>
</template>
