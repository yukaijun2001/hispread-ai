<script setup lang="ts">
import { computed } from 'vue';
import { RouterLink, useRoute } from 'vue-router';
import Icon from '../components/ui/Icon.vue';
import BrandLogo from './BrandLogo.vue';
import { t } from '../lib/i18n';
import { navigationFor, resolveSettlementTab, type NavItem } from '../navigation/access';
import { useSessionStore } from '../stores/session';

defineEmits<{ navigate: [] }>();
const session = useSessionStore();
const route = useRoute();

const sections = computed(() => (session.user ? navigationFor(session.user, session.capabilities) : []));
const currentTab = computed(() => {
  if (route.name !== 'settlements' || !session.user) return '';
  return resolveSettlementTab(session.user, String(route.query.tab ?? ''))?.id ?? '';
});

function isActive(item: NavItem) {
  if (item.route === 'settlements') return route.name === 'settlements' && item.query?.tab === currentTab.value;
  if (item.route === 'suppliers') return route.name === 'suppliers' || route.name === 'supplier-accounts';
  return route.name === item.route;
}
</script>

<template>
  <div class="hs-sidebar">
    <RouterLink to="/workbench" class="hs-brand" aria-label="Hispread AI" @click="$emit('navigate')">
      <BrandLogo :height="38" />
    </RouterLink>
    <nav :aria-label="t('业务导航')" class="sections">
      <div v-for="section in sections" :key="section.id" class="section">
        <p v-if="section.label" class="section-label">{{ section.label }}</p>
        <RouterLink
          v-for="item in section.items"
          :key="item.key"
          :to="{ path: `/${item.route}`, query: item.query }"
          class="item"
          :class="{ active: isActive(item) }"
          :aria-current="isActive(item) ? 'page' : undefined"
          @click="$emit('navigate')"
        >
          <Icon :name="item.icon" :size="17" />
          <span>{{ item.label }}</span>
        </RouterLink>
      </div>
    </nav>
  </div>
</template>

<style scoped>
.hs-sidebar { display: flex; flex-direction: column; height: 100%; min-height: 0; padding: 18px 12px 16px; }
.hs-brand { display: flex; align-items: center; height: 40px; padding: 0 10px; margin-bottom: 14px; border-radius: 10px; flex: none; }
.hs-brand:focus-visible { outline: none; box-shadow: var(--hs-accent-ring); }
.sections { flex: 1; min-height: 0; overflow-y: auto; scrollbar-width: none; display: grid; align-content: start; gap: 18px; }
.section { display: grid; gap: 1px; }
.section-label { margin: 0 0 4px; padding: 0 10px; color: var(--hs-text-4); font-size: 11px; font-weight: 500; letter-spacing: .4px; }
.item {
  display: flex; align-items: center; gap: 10px;
  min-height: 34px; padding: 6px 10px;
  color: var(--hs-text-2); border-radius: 9px;
  font-size: var(--hs-text-sm); line-height: 1.35; text-decoration: none;
  transition: background .12s, color .12s;
}
.item .hs-icon { color: var(--hs-text-3); }
.item:hover { color: var(--hs-text); background: rgb(0 0 0 / 4%); }
.item.active { color: var(--hs-text); background: var(--hs-surface); box-shadow: 0 1px 2px rgb(0 0 0 / 6%), 0 0 0 1px rgb(0 0 0 / 4%); font-weight: 500; }
.item.active .hs-icon { color: var(--hs-text); }
.item:focus-visible { outline: none; box-shadow: var(--hs-accent-ring); }
.item span { min-width: 0; overflow-wrap: anywhere; }
</style>
