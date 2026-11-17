<script setup lang="ts">
// Platform ranking board: pick projects (search, category, include/exclude)
// and a date; one ranking table per project.
import { computed, ref } from 'vue';
import SearchInput from '../../components/ui/SearchInput.vue';
import TextInput from '../../components/ui/TextInput.vue';
import EmptyState from '../../components/ui/EmptyState.vue';
import Spinner from '../../components/ui/Spinner.vue';
import QuoteRankingTable from './QuoteRankingTable.vue';
import { getLocale, t } from '../../lib/i18n';
import { DELIVERY_TYPE_LABELS, SETTLEMENT_MODE_LABELS } from '../../lib/labels';
import { beijingDate, type ExchangeRate } from '../../lib/money';
import { projectCategory, type Project } from '../../lib/projects';
import type { Quote } from './quotes';

const props = defineProps<{ projects: Project[]; loading: boolean; error: string; rates: ExchangeRate[]; ratesLoading: boolean; ratesError: string }>();
const emit = defineEmits<{ open: [quote: Quote] }>();

const settlement = SETTLEMENT_MODE_LABELS();
const delivery = DELIVERY_TYPE_LABELS();
const locale = getLocale();
const search = ref('');
const category = ref('');
const excluded = ref<string[]>([]);
const date = ref(beijingDate());

const enabled = computed(() => props.projects.filter((p) => p.enabled)
  .sort((a, b) => `${a.categoryName || a.category}\u0000${a.name}`.localeCompare(`${b.categoryName || b.category}\u0000${b.name}`, locale)));
const categories = computed(() => [...new Map(enabled.value.map((p) => [p.category || '__uncategorized__', projectCategory(p)])).entries()]
  .sort((a, b) => a[1].localeCompare(b[1], locale)));
const matching = computed(() => {
  const term = search.value.trim().toLocaleLowerCase(locale);
  return enabled.value.filter((p) => {
    if (category.value && (p.category || '__uncategorized__') !== category.value) return false;
    return !term || [p.name, p.categoryName, p.category, settlement[p.settlementMethod], delivery[p.deliveryMethod]]
      .filter(Boolean).some((value) => String(value).toLocaleLowerCase(locale).includes(term));
  });
});
const shown = computed(() => matching.value.filter((p) => !excluded.value.includes(p.id)));

function toggle(id: string, include: boolean) {
  excluded.value = include ? excluded.value.filter((value) => value !== id) : [...excluded.value, id];
}
const selectAll = () => { excluded.value = excluded.value.filter((id) => !matching.value.some((p) => p.id === id)); };
const clearAll = () => { excluded.value = [...new Set([...excluded.value, ...matching.value.map((p) => p.id)])]; };
</script>

<template>
  <section class="ranking">
    <div class="controls">
      <div class="filters">
        <SearchInput v-model="search" :placeholder="t('检索项目名称或大类')" class="project-search" />
        <div class="chips" role="group" :aria-label="t('排行项目大类')">
          <button type="button" :class="{ active: !category }" :aria-pressed="!category" @click="category = ''">{{ t('全部') }}</button>
          <button v-for="[id, name] in categories" :key="id" type="button" :class="{ active: category === id }" :aria-pressed="category === id" @click="category = id">{{ name }}</button>
        </div>
      </div>
      <label class="date">
        <span>{{ t('排行日期') }}</span>
        <TextInput v-model="date" type="date" required size="sm" :aria-label="t('排行日期')" />
      </label>
    </div>

    <div class="projects">
      <div class="projects-head">
        <strong>{{ t('展示项目') }}</strong>
        <span>{{ t('已显示 {0} / {1}', [shown.length, matching.length]) }}<template v-if="matching.length !== enabled.length">{{ t('（全部 {0}）', [enabled.length]) }}</template></span>
        <button type="button" class="link" :disabled="matching.every((p) => !excluded.includes(p.id))" @click="selectAll">{{ t('全选') }}</button>
        <button type="button" class="link quiet" :disabled="!shown.length" @click="clearAll">{{ t('清空') }}</button>
        <span class="currency">{{ t('排行币种') }} · USD</span>
      </div>
      <div class="strip" :aria-label="t('排行展示项目')">
        <p v-if="!matching.length" class="none">{{ t('未找到匹配项目') }}</p>
        <label v-for="project in matching" :key="project.id" class="pick" :class="{ on: !excluded.includes(project.id) }">
          <input type="checkbox" :checked="!excluded.includes(project.id)" @change="toggle(project.id, ($event.target as HTMLInputElement).checked)" />
          <span>{{ project.name }}</span>
          <small>{{ projectCategory(project) }}</small>
        </label>
      </div>
    </div>
    <p class="hint">{{ t('每个项目独立保留排序方式；点击报价或能力列头切换排序。能力缺失的历史报价始终置末且不计名次。') }}</p>

    <EmptyState v-if="error" error :text="error" />
    <div v-else-if="loading && !enabled.length" class="state"><Spinner :size="16" /></div>
    <EmptyState v-else-if="!enabled.length" :text="t('暂无可用于报价排行的项目')" />
    <EmptyState v-else-if="!matching.length" :text="t('没有符合当前检索和大类条件的项目')" />
    <EmptyState v-else-if="!shown.length" :text="t('请至少勾选一个要展示的项目')" />
    <EmptyState v-else-if="!date" :text="t('请选择排行日期')" />
    <div v-else class="groups">
      <section v-for="project in shown" :key="project.id" class="group">
        <header>
          <div>
            <h2>{{ project.name }}</h2>
            <p>{{ projectCategory(project) }} · {{ settlement[project.settlementMethod] }} · {{ delivery[project.deliveryMethod] }}</p>
          </div>
          <span class="tag">USD</span>
        </header>
        <QuoteRankingTable :project="project" currency="USD" :on-date="date" :rates="rates" :rates-loading="ratesLoading" :rates-error="ratesError" @open="emit('open', $event)" />
      </section>
    </div>
  </section>
</template>

<style scoped>
.ranking { display: grid; gap: 14px; }
.controls { display: flex; flex-wrap: wrap; align-items: flex-end; justify-content: space-between; gap: 12px 20px; }
.filters { display: flex; flex-wrap: wrap; align-items: center; gap: 10px 14px; flex: 1; min-width: 0; }
.project-search { width: min(300px, 100%); }
.chips { display: flex; flex-wrap: wrap; gap: 6px; }
.chips button { height: 28px; min-height: 0; padding: 0 12px; color: var(--hs-text-2); background: var(--hs-surface); border: 1px solid var(--hs-border-strong); border-radius: 999px; font: inherit; font-size: var(--hs-text-xs); cursor: pointer; }
.chips button.active { color: #fff; background: var(--hs-primary); border-color: var(--hs-primary); }
.date { display: grid; gap: 4px; width: 160px; color: var(--hs-text-2); font-size: var(--hs-text-xs); }
.projects { display: grid; gap: 8px; padding: 14px; background: var(--hs-surface-subtle); border: 1px solid var(--hs-border); border-radius: 14px; }
.projects-head { display: flex; flex-wrap: wrap; align-items: center; gap: 6px 14px; font-size: var(--hs-text-xs); color: var(--hs-text-3); }
.projects-head strong { color: var(--hs-text); font-size: var(--hs-text-sm); font-weight: 600; }
.currency { margin-left: auto; }
.link { min-height: 0; padding: 0; color: var(--hs-accent); background: none; border: 0; font: inherit; cursor: pointer; }
.link.quiet { color: var(--hs-text-3); }
.link:disabled { opacity: .45; cursor: not-allowed; }
.strip { display: flex; flex-wrap: wrap; gap: 6px; max-height: 148px; overflow-y: auto; }
.pick { display: inline-flex; align-items: center; gap: 6px; padding: 6px 10px; color: var(--hs-text-2); background: var(--hs-surface); border: 1px solid var(--hs-border); border-radius: 10px; font-size: var(--hs-text-xs); cursor: pointer; }
.pick.on { color: var(--hs-text); border-color: var(--hs-border-strong); }
.pick input { width: 14px; height: 14px; margin: 0; padding: 0; accent-color: var(--hs-primary); box-shadow: none; }
.pick small { color: var(--hs-text-4); }
.none { margin: 0; color: var(--hs-text-3); font-size: var(--hs-text-xs); }
.hint { margin: 0; color: var(--hs-text-3); font-size: var(--hs-text-xs); }
.state { display: grid; place-items: center; padding: 32px; color: var(--hs-text-3); }
.groups { display: grid; gap: 22px; }
.group header { display: flex; align-items: flex-end; justify-content: space-between; gap: 12px; margin-bottom: 8px; }
.group h2 { margin: 0; font-size: 15px; font-weight: 600; }
.group p { margin: 2px 0 0; color: var(--hs-text-3); font-size: var(--hs-text-xs); }
.tag { padding: 2px 8px; color: var(--hs-text-2); background: #f1f1f1; border-radius: 999px; font-size: 11px; }
</style>
