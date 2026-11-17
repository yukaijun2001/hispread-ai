<script setup lang="ts">
// Interface language for screens outside the console (sign-in, onboarding).
// Switching stores the preference and reloads the page.
import { computed } from 'vue';
import Select from '../../components/ui/Select.vue';
import { languagePreference, setLanguagePreference, t, type LanguagePreference } from '../../lib/i18n';

const options = [{ value: 'auto', label: t('自动') }, { value: 'zh-CN', label: '中文' }, { value: 'en-US', label: 'English' }];
const current = languagePreference();
const model = computed({
  get: () => current,
  set: (value: string) => { if (value !== current) setLanguagePreference(value as LanguagePreference); },
});
</script>

<template>
  <div class="hs-language" :title="t('切换语言会刷新页面，请先保存正在编辑的内容。')">
    <Select v-model="model" :options="options" :label="t('界面语言')" icon="globe" size="sm" pill />
  </div>
</template>

<style scoped>
.hs-language { width: 132px; }
</style>
