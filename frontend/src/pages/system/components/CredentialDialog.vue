<script setup lang="ts">
// Shows the account and the one-time initial password returned by account
// creation or a password reset.
import Dialog from '../../../components/ui/Dialog.vue';
import Button from '../../../components/ui/Button.vue';
import Notice from '../../../components/ui/Notice.vue';
import InfoGrid from './InfoGrid.vue';
import { t } from '../../../lib/i18n';

defineProps<{ value: { username?: string; initialPassword?: string | null } }>();
const emit = defineEmits<{ close: [] }>();
</script>

<template>
  <Dialog :title="t('账号信息')" @close="emit('close')">
    <div class="credential-body">
      <InfoGrid :columns="1" :items="[
        { key: 'username', label: t('登录账号'), value: value.username || t('所选账号') },
        { key: 'password', label: t('初始密码'), value: value.initialPassword ? '' : t('继续使用原账号密码') },
      ]">
        <template v-if="value.initialPassword" #password><code class="credential-secret">{{ value.initialPassword }}</code></template>
      </InfoGrid>
      <Notice v-if="value.initialPassword" tone="warning">{{ t('初始密码仅在本次操作后展示。请通过安全渠道交给本人；关闭后无法再次查询明文。') }}</Notice>
    </div>
    <template #footer>
      <Button variant="primary" @click="emit('close')">{{ t('我已保存') }}</Button>
    </template>
  </Dialog>
</template>

<style scoped>
.credential-body { display: grid; gap: 16px; }
.credential-secret { display: inline-block; padding: 4px 8px; color: var(--hs-text); background: var(--hs-surface-subtle); border: 1px solid var(--hs-border); border-radius: 6px; font-family: var(--hs-font-mono); font-size: var(--hs-text-sm); user-select: all; word-break: break-all; }
</style>
