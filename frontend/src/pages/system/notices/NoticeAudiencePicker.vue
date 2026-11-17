<script setup lang="ts">
// Below the notice form: optional quote-project filter for supplier audiences
// and a live recipient preview. The editor re-mounts this per audience/target
// (`:key`), so search, pages and the expanded list reset; the filter switch and
// chosen projects live in the editor.
import { computed, ref } from 'vue';
import Button from '../../../components/ui/Button.vue';
import DataTable from '../../../components/ui/DataTable.vue';
import EmptyState from '../../../components/ui/EmptyState.vue';
import Notice from '../../../components/ui/Notice.vue';
import Pagination from '../../../components/ui/Pagination.vue';
import SearchInput from '../../../components/ui/SearchInput.vue';
import Spinner from '../../../components/ui/Spinner.vue';
import { useApiData } from '../../../composables/useApiData';
import { t } from '../../../lib/i18n';
import { isSupplierAudience, type QuoteProjectRef, type Recipient } from './notices';

interface Page<T> { items: T[]; total: number }

const props = defineProps<{ audience: string; targetUserId: string }>();
const filtered = defineModel<boolean>('filtered', { required: true });
const projects = defineModel<QuoteProjectRef[]>('projects', { required: true });

const MAX_PROJECTS = 100;

const projectSearch = ref('');
const projectPage = ref(1);
const projectSize = ref(20);
const previewPage = ref(1);
const previewSize = ref(10);
const showRecipients = ref(false);

const supplierAudience = computed(() => isSupplierAudience(props.audience));
const projectFilter = computed(() => supplierAudience.value && filtered.value);
const projectList = useApiData<Page<QuoteProjectRef>>(() => (projectFilter.value
  ? `/notifications/quote-projects?search=${encodeURIComponent(projectSearch.value)}&page=${projectPage.value}&size=${projectSize.value}`
  : null));

const canPreview = computed(() => (props.audience !== 'DIRECT' || !!props.targetUserId) && (!projectFilter.value || projects.value.length > 0));
const preview = useApiData<Page<Recipient>>(() => {
  if (!canPreview.value) return null;
  const query = new URLSearchParams({ audience: props.audience, page: String(previewPage.value), size: String(previewSize.value) });
  if (props.audience === 'DIRECT') query.set('targetUserId', props.targetUserId);
  if (projectFilter.value) projects.value.forEach((project) => query.append('quoteProjectIds', project.id));
  return `/notifications/recipient-preview?${query}`;
});

const isChosen = (id: string) => projects.value.some((project) => project.id === id);

function setProjects(next: QuoteProjectRef[]) { projects.value = next; previewPage.value = 1; }
function toggleProject(project: QuoteProjectRef, checked: boolean) {
  setProjects(checked ? [...projects.value, project] : projects.value.filter((item) => item.id !== project.id));
}
function setFiltered(checked: boolean) { filtered.value = checked; previewPage.value = 1; }
function setProjectSearch(value: string) { projectSearch.value = value; projectPage.value = 1; }

const recipientColumns = [
  { key: 'person', label: t('接收人员') },
  { key: 'supplier', label: t('供应商') },
];
const recipientKey = (row: Recipient) => row.id ?? row.userId ?? row.username;
</script>

<template>
  <section class="nap">
    <template v-if="supplierAudience">
      <label class="nap-check">
        <input type="checkbox" :checked="filtered" @change="setFiltered(($event.target as HTMLInputElement).checked)" />
        <span>{{ t('按报价项目筛选接收供应商') }}</span>
      </label>
      <fieldset v-if="filtered" class="nap-projects">
        <legend>{{ t('报价项目（可多选）') }}</legend>
        <p class="nap-hint">{{ t('任一所选项目做过报价即可接收，包含已驳回或已撤回的报价；同一账号只推送一次。') }}</p>
        <div v-if="projects.length" class="nap-chips">
          <Button v-for="project in projects" :key="project.id" size="sm" :aria-label="t('移除项目 {0}', [project.name])"
            @click="setProjects(projects.filter((item) => item.id !== project.id))">{{ project.name }} ×</Button>
          <button v-if="projects.length > 1" type="button" class="nap-link" @click="setProjects([])">{{ t('清空选择') }}</button>
        </div>
        <SearchInput :model-value="projectSearch" :placeholder="t('搜索报价项目')" @update:model-value="setProjectSearch" />
        <div v-if="projectList.loading.value" class="nap-state"><Spinner /></div>
        <Notice v-else-if="projectList.error.value" tone="danger">
          {{ projectList.error.value }}
          <template #actions><Button size="sm" @click="projectList.reload()">{{ t('重试') }}</Button></template>
        </Notice>
        <div v-else-if="projectList.data.value?.items.length" class="nap-options">
          <label v-for="project in projectList.data.value.items" :key="project.id" class="nap-check">
            <input type="checkbox" :checked="isChosen(project.id)" :disabled="projects.length >= MAX_PROJECTS && !isChosen(project.id)"
              @change="toggleProject(project, ($event.target as HTMLInputElement).checked)" />
            <span>{{ project.name }}<small v-if="!project.enabled"> · {{ t('已停用') }}</small></span>
          </label>
        </div>
        <EmptyState v-else compact :text="t('暂无有报价记录的项目')" />
        <Pagination v-if="projectList.data.value && projectList.data.value.total > projectSize" v-model:page="projectPage" v-model:size="projectSize" :total="projectList.data.value.total" />
        <p v-if="!projects.length" class="nap-hint">{{ t('请至少选择一个报价项目。') }}</p>
      </fieldset>
    </template>

    <section v-if="canPreview" class="nap-preview">
      <p v-if="preview.loading.value" class="nap-hint">{{ t('正在计算接收人员…') }}</p>
      <Notice v-else-if="preview.error.value" tone="danger">
        {{ preview.error.value }}
        <template #actions><Button size="sm" @click="preview.reload()">{{ t('重试') }}</Button></template>
      </Notice>
      <template v-else-if="preview.data.value">
        <div class="nap-summary">
          <strong>{{ t('预计推送 {0} 人', [preview.data.value.total]) }}</strong>
          <button type="button" class="nap-link" @click="showRecipients = !showRecipients">{{ t(showRecipients ? '收起人员' : '查看接收人员') }}</button>
        </div>
        <template v-if="showRecipients">
          <div class="nap-table">
            <DataTable :columns="recipientColumns" :rows="preview.data.value.items" :row-key="recipientKey" :refreshing="preview.refreshing.value" :label="t('接收人员')">
              <template #cell-person="{ row }"><div class="nap-person"><strong>{{ row.displayName }}</strong><small>{{ row.username }}</small></div></template>
              <template #cell-supplier="{ row }">{{ row.supplierName || t('平台人员') }}</template>
            </DataTable>
          </div>
          <Pagination v-model:page="previewPage" v-model:size="previewSize" :total="preview.data.value.total" />
        </template>
        <p class="nap-hint">{{ t('实际接收人员以发布时的账号状态和报价记录为准。') }}</p>
      </template>
    </section>
  </section>
</template>

<style scoped>
.nap { display: grid; gap: 12px; }
.nap-check { display: flex; align-items: center; gap: 9px; color: var(--hs-text); font-size: var(--hs-text-sm); cursor: pointer; }
.nap-check input { flex: 0 0 16px; width: 16px; height: 16px; margin: 0; accent-color: var(--hs-accent); }
.nap-check span { overflow-wrap: anywhere; }
.nap-check small { color: var(--hs-text-3); }
.nap-projects { display: grid; gap: 10px; min-width: 0; margin: 0; padding: 12px 14px 14px; border: 1px solid var(--hs-border); border-radius: 12px; }
.nap-projects legend { padding: 0 6px; color: var(--hs-text); font-size: var(--hs-text-sm); font-weight: 600; }
.nap-hint { margin: 0; color: var(--hs-text-3); font-size: var(--hs-text-xs); line-height: 1.7; }
.nap-chips { display: flex; flex-wrap: wrap; align-items: center; gap: 6px; }
.nap-link { padding: 0; color: var(--hs-accent); background: none; border: 0; font: inherit; font-size: var(--hs-text-xs); cursor: pointer; }
.nap-link:hover { text-decoration: underline; text-underline-offset: 3px; }
.nap-state { display: grid; place-items: center; padding: 16px; color: var(--hs-text-3); }
.nap-options { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 12px; max-height: 210px; padding: 4px 0; overflow-y: auto; }
.nap-preview { display: grid; gap: 10px; padding-top: 14px; border-top: 1px solid var(--hs-divider); }
.nap-summary { display: flex; flex-wrap: wrap; align-items: center; gap: 12px 22px; color: var(--hs-text); font-size: var(--hs-text-sm); }
.nap-table { max-height: 240px; overflow: auto; border: 1px solid var(--hs-border); border-radius: 12px; }
.nap-person { display: grid; gap: 2px; }
.nap-person strong { color: var(--hs-text); font-weight: 500; }
.nap-person small { color: var(--hs-text-3); font-size: var(--hs-text-xs); }
@media (max-width: 620px) { .nap-options { grid-template-columns: minmax(0, 1fr); } }
</style>
