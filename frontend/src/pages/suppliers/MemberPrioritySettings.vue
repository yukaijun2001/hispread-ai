<script setup lang="ts">
// Platform-only per-member priority overrides for a supplier's team members.
import { computed, ref, watch } from 'vue';
import Button from '../../components/ui/Button.vue';
import Notice from '../../components/ui/Notice.vue';
import Select from '../../components/ui/Select.vue';
import Spinner from '../../components/ui/Spinner.vue';
import IntakePolicyPanel from './IntakePolicyPanel.vue';
import { useApiData } from '../../composables/useApiData';
import { t } from '../../lib/i18n';
import type { UserOption } from './supplierAdmin';

const props = defineProps<{ supplierId: string }>();

const members = useApiData<UserOption[]>(() => `/cc-intake/admin/suppliers/${encodeURIComponent(props.supplierId)}/members`);
const memberId = ref('');
watch(() => props.supplierId, () => { memberId.value = ''; });

const options = computed(() => (members.data.value ?? []).map((member) => ({ value: member.id, label: member.displayName || member.username, detail: member.username })));
</script>

<template>
  <section class="mp">
    <h3>{{ t('成员独立优先级') }}</h3>
    <p class="mp-hint">{{ t('选择成员查看或覆盖其档位配置；成员和供应商前端均不可读取这些信息。') }}</p>
    <Notice v-if="members.error.value" tone="danger">
      {{ members.error.value }}
      <template #actions><Button size="sm" @click="members.reload()">{{ t('重新加载') }}</Button></template>
    </Notice>
    <div v-else-if="members.loading.value" class="mp-loading"><Spinner :size="16" /></div>
    <div v-else-if="members.data.value?.length" class="mp-field">
      <span class="mp-label">{{ t('选择成员') }}</span>
      <Select v-model="memberId" :options="options" :label="t('选择成员')" :placeholder="t('请选择成员')" icon="users" searchable />
    </div>
    <p v-else class="mp-hint">{{ t('暂无团队成员') }}</p>
    <IntakePolicyPanel v-if="memberId" :key="memberId" :supplier-id="supplierId" :member-id="memberId" />
  </section>
</template>

<style scoped>
.mp { display: grid; gap: 10px; padding-top: 18px; border-top: 1px solid var(--hs-divider); }
.mp h3 { margin: 0; font-size: var(--hs-text-md); font-weight: 600; }
.mp-hint { margin: 0; color: var(--hs-text-3); font-size: var(--hs-text-xs); line-height: 1.6; }
.mp-loading { display: grid; place-items: center; padding: 16px; color: var(--hs-text-3); }
.mp-field { display: grid; gap: 6px; max-width: 360px; }
.mp-label { color: var(--hs-text-2); font-size: var(--hs-text-sm); font-weight: 500; }
</style>
