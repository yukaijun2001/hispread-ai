<script setup lang="ts">
// 资源 column: native account / NewAPI channel state, intake onboarding state,
// or the CCMAX lane with its credential hint (amber unless the account is invalid).
import { computed } from 'vue';
import { t, translateServerMessage } from '../../../lib/i18n';
import {
  accountInvalid, channelLabel, CREATION_STATE_LABELS, credentialFailureReason, healthPaused, importBadgeState,
  isIntake, isNativeCcmax, isNewApi, laneBadge, nativeStateLabel, type Resource,
} from '../resources';
import StateBadge from './StateBadge.vue';

const props = defineProps<{ resource: Resource }>();
const lane = computed(() => {
  const r = props.resource;
  const badge = laneBadge(r);
  return healthPaused(r) && !['DRAINING', 'GONE'].includes(r.laneState || '') ? { state: 'COOLING', label: t('已暂停') } : badge;
});
const reason = computed(() => credentialFailureReason(props.resource));
</script>

<template>
  <StateBadge v-if="isNativeCcmax(resource)" :state="resource.operationalState === 'ACTIVE' ? 'SUCCESS' : 'COOLING'" :label="nativeStateLabel(resource)" />
  <StateBadge v-else-if="isNewApi(resource)" :state="resource.operationalState === 'ACTIVE' ? 'SUCCESS' : 'COOLING'" :label="channelLabel(resource)" />
  <StateBadge
    v-else-if="isIntake(resource)"
    :state="importBadgeState(resource.onboardingState)"
    :label="CREATION_STATE_LABELS()[resource.onboardingState || ''] || t('待上号')"
  />
  <span v-else class="rs-health">
    <StateBadge :state="lane.state" :label="lane.label" />
    <span v-if="reason" class="rs-health-reason" :class="{ invalid: accountInvalid(resource) }">{{ translateServerMessage(reason) }}</span>
  </span>
</template>

<style scoped>
.rs-health { display: inline-grid; justify-items: start; gap: 2px; }
.rs-health-reason { max-width: 220px; color: var(--hs-warning); font-size: var(--hs-text-xs); line-height: 1.4; }
.rs-health-reason.invalid { color: var(--hs-danger); }
</style>
