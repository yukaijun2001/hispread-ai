<script setup lang="ts">
// 交付 column: linked native accounts and NewAPI channels, intake push state, or the delivery state.
import { computed } from 'vue';
import { t, translateServerMessage } from '../../../lib/i18n';
import {
  deliveryBadgeState, deliveryLabel, IMPORT_STATE_LABELS, importBadgeState, isIntake, isNativeCcmax, isNewApi, type Resource,
} from '../resources';
import DeliveryStateBadge from './DeliveryStateBadge.vue';
import StateBadge from './StateBadge.vue';

const props = defineProps<{ resource: Resource }>();
const failureTitle = computed(() => {
  const r = props.resource;
  if (r.dispatchState === 'UNKNOWN' && r.creationFinished) return undefined;
  return translateServerMessage(r.creationFailureHint || r.dispatchFailureReason || '') || undefined;
});
</script>

<template>
  <StateBadge v-if="isNativeCcmax(resource) && resource.dispatchState !== 'SUCCESS'" state="SUCCESS" :label="t('已有账号已关联')" />
  <StateBadge v-else-if="isNewApi(resource)" state="SUCCESS" :label="t('已有渠道已关联')" />
  <StateBadge
    v-else-if="isIntake(resource)"
    :state="importBadgeState(resource.deliveryState)"
    :label="IMPORT_STATE_LABELS()[resource.deliveryState || ''] || t('待推送')"
  />
  <span v-else :title="failureTitle">
    <DeliveryStateBadge :state="deliveryBadgeState(resource)" :label="deliveryLabel(resource)" :progress="resource" />
  </span>
</template>
