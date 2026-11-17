<script setup lang="ts">
import { RouterLink } from 'vue-router';
import EmptyState from '../components/ui/EmptyState.vue';
import { t } from '../lib/i18n';
</script>

<template>
  <EmptyState icon="lock" :text="t('当前账号无权访问此页面')" :hint="t('如需开通，请联系平台管理员调整角色权限。')">
    <RouterLink to="/workbench" class="hs-forbidden-link">{{ t('返回工作台') }}</RouterLink>
  </EmptyState>
</template>

<style scoped>
.hs-forbidden-link { margin-top: 6px; color: var(--hs-accent); font-size: var(--hs-text-sm); text-decoration: none; }
.hs-forbidden-link:hover { text-decoration: underline; text-underline-offset: 3px; }
</style>
