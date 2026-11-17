<script setup lang="ts">
// The member's projects in the list: count, first three names, and a link to the
// permission dialog. With a category or project filter, counts refer to the match.
import { computed } from 'vue';
import { t } from '../../lib/i18n';
import { categoryKey, type SupplierAgent } from './team';

const props = defineProps<{ agent: SupplierAgent; category: string; projectId: string }>();
const emit = defineEmits<{ 'show-all': [] }>();

const all = computed(() => props.agent.projects ?? []);
const matching = computed(() => all.value.filter((project) => (!props.category || categoryKey(project.category) === props.category)
  && (!props.projectId || project.id === props.projectId)));
const caption = computed(() => (props.projectId
  ? t('当前项目 {0} 项 · 共 {1} 项', [matching.value.length, all.value.length])
  : props.category ? t('本类 {0} 项 · 共 {1} 项', [matching.value.length, all.value.length]) : t('共 {0} 项', [all.value.length])));
</script>

<template>
  <div v-if="all.length" class="agent-projects">
    <span class="agent-projects-count">{{ caption }}</span>
    <div class="agent-projects-tags">
      <span v-for="project in matching.slice(0, 3)" :key="project.id">{{ project.name }}</span>
    </div>
    <button v-if="matching.length > 3 || category || projectId" type="button" class="agent-projects-more" @click.stop="emit('show-all')">
      {{ t('查看全部') }} {{ all.length }} {{ t('项') }}
    </button>
  </div>
  <span v-else class="agent-projects-none">{{ t('未分配') }}</span>
</template>

<style scoped>
.agent-projects { display: grid; gap: 4px; justify-items: start; }
.agent-projects-count { color: var(--hs-text-3); font-size: var(--hs-text-xs); }
.agent-projects-tags { display: flex; flex-wrap: wrap; gap: 4px; }
.agent-projects-tags span { max-width: 180px; padding: 1px 8px; overflow: hidden; color: var(--hs-text-2); background: var(--hs-surface-subtle); border: 1px solid var(--hs-border); border-radius: 6px; font-size: var(--hs-text-xs); text-overflow: ellipsis; white-space: nowrap; }
.agent-projects-more { padding: 0; color: var(--hs-accent); background: none; border: 0; font: inherit; font-size: var(--hs-text-xs); cursor: pointer; }
.agent-projects-more:hover { text-decoration: underline; text-underline-offset: 3px; }
.agent-projects-none { color: var(--hs-text-4); font-size: var(--hs-text-xs); }
</style>
