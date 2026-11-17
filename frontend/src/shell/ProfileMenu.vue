<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import Popover from '../components/ui/Popover.vue';
import Avatar from '../components/ui/Avatar.vue';
import Icon from '../components/ui/Icon.vue';
import { languagePreference, setLanguagePreference, t, type LanguagePreference } from '../lib/i18n';
import { useSessionStore } from '../stores/session';

const session = useSessionStore();
const router = useRouter();
const open = ref(false);
const language = languagePreference();
const languages: Array<{ value: LanguagePreference; label: string }> = [
  { value: 'auto', label: t('跟随时区') },
  { value: 'zh-CN', label: '中文' },
  { value: 'en-US', label: 'English' },
];

function run(action: () => void) {
  open.value = false;
  action();
}

async function signOut() {
  open.value = false;
  try {
    await session.logout();
  } catch (error) {
    session.notify((error as Error).message, true);
  }
}
</script>

<template>
  <Popover v-model:open="open" width="248px">
    <template #trigger="{ toggle }">
      <button type="button" class="trigger" :aria-expanded="open" :aria-label="t('账号菜单')" @click="toggle">
        <Avatar :name="session.displayName" :size="26" />
        <span class="name">{{ session.displayName }}</span>
        <Icon name="down" :size="14" />
      </button>
    </template>
    <div class="hs-identity">
      <strong>{{ session.displayName }}</strong>
      <small>{{ session.user?.username }}</small>
    </div>
    <button
      v-if="session.isSupplier && session.has('supplier.read')"
      type="button"
      class="entry"
      @click="run(() => router.push('/suppliers'))"
    ><Icon name="building" :size="16" />{{ t('我的资料') }}</button>
    <button type="button" class="entry" @click="run(() => (session.profileDialogOpen = true))"><Icon name="users" :size="16" />{{ t('个人信息') }}</button>
    <button type="button" class="entry" @click="run(() => (session.passwordDialogOpen = true))"><Icon name="lock" :size="16" />{{ t('修改密码') }}</button>
    <div class="language" role="group" :aria-label="t('界面语言')">
      <span><Icon name="globe" :size="16" />{{ t('界面语言') }}</span>
      <div class="language-options">
        <button
          v-for="option in languages"
          :key="option.value"
          type="button"
          :class="{ active: option.value === language }"
          :aria-pressed="option.value === language"
          :title="t('切换语言会刷新页面，请先保存正在编辑的内容。')"
          @click="option.value !== language && setLanguagePreference(option.value)"
        >{{ option.label }}</button>
      </div>
    </div>
    <div class="divider" />
    <button type="button" class="entry danger" @click="signOut"><Icon name="logout" :size="16" />{{ t('退出登录') }}</button>
  </Popover>
</template>

<style scoped>
.trigger { display: flex; align-items: center; gap: 8px; height: 34px; min-height: 0; padding: 0 10px 0 4px; color: var(--hs-text-2); background: var(--hs-surface); border: 1px solid var(--hs-border); border-radius: 999px; font: inherit; font-size: var(--hs-text-sm); cursor: pointer; }
.trigger:hover { color: var(--hs-text); border-color: var(--hs-border-strong); }
.trigger:focus-visible { outline: none; box-shadow: var(--hs-accent-ring); }
.name { max-width: 140px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; color: var(--hs-text); font-weight: 500; }
.hs-identity { display: grid; gap: 2px; padding: 8px 10px 10px; margin-bottom: 4px; border-bottom: 1px solid var(--hs-divider); }
.hs-identity strong { font-size: var(--hs-text-sm); font-weight: 600; overflow-wrap: anywhere; }
.hs-identity small { color: var(--hs-text-3); font-size: var(--hs-text-xs); overflow-wrap: anywhere; }
.entry { display: flex; align-items: center; gap: 10px; width: 100%; min-height: 0; padding: 8px 10px; color: var(--hs-text-2); background: none; border: 0; border-radius: 9px; font: inherit; font-size: var(--hs-text-sm); text-align: left; cursor: pointer; }
.entry:hover, .entry:focus-visible { outline: none; color: var(--hs-text); background: var(--hs-surface-hover); }
.entry.danger:hover { color: var(--hs-danger); background: var(--hs-danger-soft); }
.language { display: grid; gap: 8px; padding: 8px 10px; }
.language > span { display: flex; align-items: center; gap: 10px; color: var(--hs-text-2); font-size: var(--hs-text-sm); }
.language-options { display: flex; gap: 2px; padding: 3px; background: #efefef; border-radius: 999px; }
.language-options button { flex: 1; height: 26px; min-height: 0; padding: 0 6px; color: var(--hs-text-2); background: none; border: 0; border-radius: 999px; font: inherit; font-size: 11px; cursor: pointer; }
.language-options button.active { color: var(--hs-text); background: var(--hs-surface); box-shadow: 0 1px 2px rgb(0 0 0 / 8%); font-weight: 500; }
.divider { height: 1px; margin: 4px 0; background: var(--hs-divider); }
</style>
