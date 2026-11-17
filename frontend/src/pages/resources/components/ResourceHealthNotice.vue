<script setup lang="ts">
// Credential health of a CCMAX resource: red when the account is invalid, amber otherwise.
import { computed } from 'vue';
import Notice from '../../../components/ui/Notice.vue';
import { t, translateServerMessage } from '../../../lib/i18n';
import { accountInvalid, credentialFailureReason, isAccessTokenRenewal, type Resource } from '../resources';

const props = defineProps<{ resource: Resource }>();
const reason = computed(() => credentialFailureReason(props.resource));
const invalid = computed(() => accountInvalid(props.resource));
</script>

<template>
  <Notice
    v-if="reason"
    :tone="invalid ? 'danger' : 'warning'"
    :title="invalid ? t('账号失效原因') : isAccessTokenRenewal(reason) ? t('凭据续期提示') : t('凭据状态提示')"
  >{{ translateServerMessage(reason) }}</Notice>
</template>
