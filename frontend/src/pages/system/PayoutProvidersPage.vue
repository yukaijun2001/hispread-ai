<script setup lang="ts">
import PageHeader from '../../components/ui/PageHeader.vue';
import Button from '../../components/ui/Button.vue';
import Notice from '../../components/ui/Notice.vue';
import { t } from '../../lib/i18n';
import { openTarget } from '../../navigation/navigate';

defineProps<{ route: string }>();
</script>

<template>
  <div class="providers">
    <PageHeader :title="t('线下付款')" />
    <Notice>{{ t('线上付款通道已关闭。请在付款记录中提交申请，完成独立审核后登记真实转账凭证。已有线上付款可通过历史出款查询核对原结果。') }}</Notice>
    <Button @click="openTarget('settlements?tab=payments')">{{ t('查看付款记录') }}</Button>
  </div>
</template>

<style scoped>
.providers { display: grid; justify-items: start; gap: 16px; }
</style>
