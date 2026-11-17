<script setup lang="ts">
// One-time display of a member's login and initial password. The caller's
// dialog footer carries the 我已保存 / 完成 button.
import Notice from '../../components/ui/Notice.vue';
import { t } from '../../lib/i18n';

defineProps<{ username: string; initialPassword?: string | null }>();
</script>

<template>
  <div class="team-credentials">
    <dl>
      <div>
        <dt>{{ t('登录账号') }}</dt>
        <dd>{{ username }}</dd>
      </div>
      <div>
        <dt>{{ t('初始密码') }}</dt>
        <dd><code v-if="initialPassword" class="team-secret">{{ initialPassword }}</code><template v-else>{{ t('使用创建时填写的密码') }}</template></dd>
      </div>
    </dl>
    <Notice v-if="initialPassword" tone="warning">{{ t('初始密码仅在此处显示一次，请先安全保存；关闭后无法再次查看。') }}</Notice>
  </div>
</template>

<style scoped>
.team-credentials { display: grid; gap: 14px; }
dl { display: grid; gap: 12px; margin: 0; }
dt { color: var(--hs-text-3); font-size: var(--hs-text-xs); }
dd { margin: 3px 0 0; color: var(--hs-text); font-size: var(--hs-text-sm); overflow-wrap: anywhere; }
.team-secret { display: inline-block; padding: 4px 8px; font-family: var(--hs-font-mono); font-size: var(--hs-text-sm); background: var(--hs-surface-subtle); border: 1px solid var(--hs-border); border-radius: var(--hs-radius-small); user-select: all; word-break: break-all; }
</style>
