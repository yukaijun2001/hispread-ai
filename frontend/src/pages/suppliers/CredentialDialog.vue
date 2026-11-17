<script setup lang="ts">
// One-time display of a supplier login account and its initial password.
import Dialog from '../../components/ui/Dialog.vue';
import Button from '../../components/ui/Button.vue';
import Notice from '../../components/ui/Notice.vue';
import { t } from '../../lib/i18n';
import type { Credential } from './supplierAdmin';

defineProps<{ value: Credential }>();
const emit = defineEmits<{ close: [] }>();
</script>

<template>
  <Dialog :title="t('账号信息')" size="sm" @close="emit('close')">
    <div class="cred">
      <dl class="cred-list">
        <div>
          <dt>{{ t('登录账号') }}</dt>
          <dd>{{ value.username || t('所选账号') }}</dd>
        </div>
        <div>
          <dt>{{ t('初始密码') }}</dt>
          <dd>
            <code v-if="value.initialPassword" class="cred-secret">{{ value.initialPassword }}</code>
            <template v-else>{{ t('继续使用原账号密码') }}</template>
          </dd>
        </div>
      </dl>
      <Notice v-if="value.initialPassword" tone="warning">{{ t('初始密码仅在本次操作后展示。请通过安全渠道交给本人；关闭后无法再次查询明文。') }}</Notice>
    </div>
    <template #footer>
      <Button variant="primary" @click="emit('close')">{{ t('我已保存') }}</Button>
    </template>
  </Dialog>
</template>

<style scoped>
.cred { display: grid; gap: 14px; }
.cred-list { display: grid; gap: 12px; margin: 0; }
.cred-list dt { color: var(--hs-text-3); font-size: var(--hs-text-xs); }
.cred-list dd { margin: 3px 0 0; color: var(--hs-text); font-size: var(--hs-text-sm); overflow-wrap: anywhere; }
.cred-secret { display: inline-block; padding: 4px 8px; font-family: var(--hs-font-mono); background: var(--hs-surface-subtle); border: 1px solid var(--hs-border); border-radius: var(--hs-radius-small); user-select: all; }
</style>
