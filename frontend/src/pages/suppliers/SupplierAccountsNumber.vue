<script setup lang="ts">
// Masked account number with an on-demand reveal for `account.sensitive` holders.
// The parent re-keys this per query and refresh so a revealed number is hidden again.
import { ref } from 'vue';
import IconButton from '../../components/ui/IconButton.vue';
import { apiPost } from '../../lib/api';
import { t } from '../../lib/i18n';
import { useSessionStore } from '../../stores/session';
import type { PlatformAccount } from './supplierAccounts';

const props = defineProps<{ account: PlatformAccount }>();
const session = useSessionStore();
const revealed = ref('');
const loading = ref(false);
const sensitive = session.has('account.sensitive');

async function toggle() {
  if (revealed.value) { revealed.value = ''; return; }
  if (loading.value) return;
  loading.value = true;
  try {
    const result = await apiPost<{ accountNumber: string }>(`/accounts/${props.account.id}/reveal`, {});
    revealed.value = result.accountNumber;
  } catch (error) {
    session.notify((error as Error).message, true);
  } finally {
    loading.value = false;
  }
}
</script>

<template>
  <div class="an">
    <div class="an-text">
      <strong>{{ sensitive && revealed ? revealed : `•••• ${account.lastFour}` }}</strong>
      <small>{{ account.holder }}</small>
    </div>
    <IconButton
      v-if="sensitive"
      :icon="revealed ? 'close' : 'eye'"
      :size="17"
      :label="t('{0} {1} 完整收款账号', [revealed ? t('隐藏') : t('查看'), account.supplierName])"
      :aria-pressed="!!revealed"
      :disabled="loading"
      @click="toggle"
    />
  </div>
</template>

<style scoped>
.an { display: flex; align-items: center; gap: 6px; }
.an-text { display: grid; min-width: 0; }
.an-text strong { color: var(--hs-text); font-weight: 500; font-variant-numeric: tabular-nums; overflow-wrap: anywhere; }
.an-text small { color: var(--hs-text-3); font-size: var(--hs-text-xs); }
</style>
