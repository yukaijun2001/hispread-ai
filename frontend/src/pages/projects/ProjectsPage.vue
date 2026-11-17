<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import PageHeader from '../../components/ui/PageHeader.vue';
import Button from '../../components/ui/Button.vue';
import IconButton from '../../components/ui/IconButton.vue';
import SearchInput from '../../components/ui/SearchInput.vue';
import Select from '../../components/ui/Select.vue';
import DataTable from '../../components/ui/DataTable.vue';
import Pagination from '../../components/ui/Pagination.vue';
import StatusBadge from '../../components/ui/StatusBadge.vue';
import ProjectFormDialog from './ProjectFormDialog.vue';
import CategoryCodesDialog from './CategoryCodesDialog.vue';
import CategoryCodeFormDialog from './CategoryCodeFormDialog.vue';
import CategoryDeleteDialog from './CategoryDeleteDialog.vue';
import IntakeProjectTypesDialog from './IntakeProjectTypesDialog.vue';
import { useApiData } from '../../composables/useApiData';
import { formatDiscount, t } from '../../lib/i18n';
import { CAPACITY_TYPE_LABELS, DELIVERY_TYPE_LABELS, SETTLEMENT_MODE_LABELS, capacityLabel, unitLabel } from '../../lib/labels';
import { formatDateTime } from '../../lib/money';
import { useSessionStore } from '../../stores/session';
import type { CategoryCode, ProjectRow } from './projectAdmin';

defineProps<{ route: string }>();
const session = useSessionStore();
const settlementLabels = SETTLEMENT_MODE_LABELS();
const deliveryLabels = DELIVERY_TYPE_LABELS();
const capacityTypeLabels = CAPACITY_TYPE_LABELS();

// --- Filters ---------------------------------------------------------------
const search = ref('');
const category = ref('');
const settlementMethod = ref('');
const deliveryMethod = ref('');
const enabled = ref('');
const page = ref(1);
const size = ref(10);
watch([search, category, settlementMethod, deliveryMethod, enabled], () => { page.value = 1; });

// --- Data ------------------------------------------------------------------
const categories = useApiData<string[]>('/projects/categories');
const categoryCodes = useApiData<CategoryCode[]>('/projects/category-codes');
const codeByValue = computed(() => new Map((categoryCodes.data.value ?? []).map((code) => [code.code, code])));
const list = useApiData<{ items: ProjectRow[]; total: number }>(() =>
  `/projects?search=${encodeURIComponent(search.value)}&category=${encodeURIComponent(category.value)}&settlementMethod=${settlementMethod.value}`
  + `&deliveryMethod=${deliveryMethod.value}&enabled=${enabled.value}&page=${page.value}&size=${size.value}`);

const categoryOptions = computed(() => [
  { value: '', label: t('全部大类') },
  ...(categories.data.value ?? []).map((code) => ({ value: code, label: codeByValue.value.get(code)?.name || code })),
]);
const settlementOptions = [{ value: '', label: t('全部结算方式') }, { value: 'QUOTA', label: settlementLabels.QUOTA }, { value: 'ACCOUNT_BUYOUT', label: settlementLabels.ACCOUNT_BUYOUT }];
const deliveryOptions = [
  { value: '', label: t('全部交付方式') }, { value: 'ACCOUNT', label: deliveryLabels.ACCOUNT }, { value: 'KEY', label: deliveryLabels.KEY }, { value: 'RELAY', label: deliveryLabels.RELAY },
];
const stateOptions = [{ value: '', label: t('全部状态') }, { value: 'true', label: t('启用') }, { value: 'false', label: t('停用') }];

const columns = [
  { key: 'category', label: t('项目大类') },
  { key: 'name', label: t('项目') },
  { key: 'settlementMethod', label: t('结算方式'), nowrap: true },
  { key: 'deliveryMethod', label: t('交付方式'), nowrap: true },
  { key: 'unit', label: t('报价单位'), nowrap: true },
  { key: 'suggestedMultiplier', label: t('建议折扣'), nowrap: true },
  { key: 'capacity', label: t('能力口径') },
  { key: 'enabled', label: t('状态'), nowrap: true },
  { key: 'updatedAt', label: t('最近更新'), nowrap: true },
  { key: 'actions', label: t('操作'), nowrap: true },
];

// --- Dialogs ---------------------------------------------------------------
// `project` is the edited project, or the source of a copy when `mode` is new.
const projectForm = ref<{ mode: 'new' | 'edit'; project: ProjectRow | null } | null>(null);
const intakeProject = ref<ProjectRow | null>(null);
// The category list closes while one code is edited or deleted, and reopens afterwards.
const categoryList = ref(false);
const categoryEdit = ref<CategoryCode | 'new' | null>(null);
const categoryDelete = ref<CategoryCode | null>(null);

function openCategoryList() { categoryDelete.value = null; categoryList.value = true; }
function editCategory(code: CategoryCode | 'new') { categoryList.value = false; categoryEdit.value = code; }
function closeCategoryEdit() { categoryEdit.value = null; categoryList.value = true; }
function removeCategory(code: CategoryCode) { categoryList.value = false; categoryDelete.value = code; }
</script>

<template>
  <div class="projects">
    <PageHeader :title="t('项目管理')">
      <template v-if="session.has('project.write')" #actions>
        <Button @click="openCategoryList">{{ t('维护大类码值') }}</Button>
        <Button variant="primary" icon="plus" @click="projectForm = { mode: 'new', project: null }">{{ t('新建项目') }}</Button>
      </template>
    </PageHeader>

    <section class="card">
      <div class="toolbar">
        <SearchInput v-model="search" class="grow" :placeholder="t('搜索项目大类、名称或编号')" :label="t('搜索项目大类、名称或编号')" />
        <div class="filter"><Select v-model="category" :options="categoryOptions" :label="t('项目大类筛选')" :placeholder="t('全部大类')" searchable /></div>
        <div class="filter"><Select v-model="settlementMethod" :options="settlementOptions" :label="t('结算方式筛选')" :placeholder="t('全部结算方式')" /></div>
        <div class="filter"><Select v-model="deliveryMethod" :options="deliveryOptions" :label="t('交付方式筛选')" :placeholder="t('全部交付方式')" /></div>
        <div class="filter narrow"><Select v-model="enabled" :options="stateOptions" :label="t('项目状态筛选')" :placeholder="t('全部状态')" /></div>
        <div class="toolbar-actions">
          <IconButton icon="refresh" :label="t('刷新项目')" @click="session.refresh()" />
        </div>
      </div>

      <DataTable
        :columns="columns"
        :rows="list.data.value?.items"
        :row-key="(row: ProjectRow) => row.id"
        :loading="list.loading.value"
        :refreshing="list.refreshing.value"
        :error="list.error.value"
        :label="t('项目管理')"
        @retry="list.reload()"
      >
        <template #cell-category="{ row }">{{ row.categoryName || row.category || t('未分类') }}</template>
        <template #cell-name="{ row }">
          <div class="cell"><strong>{{ row.name }}</strong><small class="code">{{ row.code }}</small></div>
        </template>
        <template #cell-settlementMethod="{ row }">{{ settlementLabels[row.settlementMethod || 'LEGACY'] }}</template>
        <template #cell-deliveryMethod="{ row }">{{ deliveryLabels[row.deliveryMethod || 'LEGACY'] }}</template>
        <template #cell-unit="{ row }">{{ unitLabel(row.unit) }}</template>
        <template #cell-suggestedMultiplier="{ row }">
          <span class="num">{{ row.suggestedMultiplier == null || row.suggestedMultiplier === '' ? '' : formatDiscount(row.suggestedMultiplier) }}</span>
        </template>
        <template #cell-capacity="{ row }">
          <div class="cell">
            <strong>{{ row.capacityType ? capacityTypeLabels[row.capacityType] : t('待配置') }}</strong>
            <small>{{ capacityLabel(row) }}</small>
          </div>
        </template>
        <template #cell-enabled="{ row }"><StatusBadge :state="row.enabled ? 'APPROVED' : 'WITHDRAWN'" :label="row.enabled ? t('启用') : t('停用')" /></template>
        <template #cell-updatedAt="{ row }"><span class="num">{{ formatDateTime(row.updatedAt) }}</span></template>
        <template #cell-actions="{ row }">
          <div v-if="session.has('project.write')" class="actions">
            <button type="button" class="action" @click="intakeProject = row">{{ t('接口交付类型') }}</button>
            <button type="button" class="action" @click="projectForm = { mode: 'new', project: row }">{{ t('复制') }}</button>
            <button type="button" class="action" @click="projectForm = { mode: 'edit', project: row }">{{ t('编辑') }}</button>
          </div>
          <span v-else class="readonly">{{ t('只读') }}</span>
        </template>
      </DataTable>
      <Pagination v-model:page="page" v-model:size="size" :total="list.data.value?.total ?? 0" :loading="list.loading.value" />
    </section>

    <CategoryCodesDialog
      v-if="categoryList && !categoryEdit"
      :codes="categoryCodes.data.value ?? []"
      :loading="categoryCodes.loading.value"
      :error="categoryCodes.error.value"
      @close="categoryList = false"
      @retry="categoryCodes.reload()"
      @create="editCategory('new')"
      @edit="editCategory"
      @remove="removeCategory"
    />
    <CategoryDeleteDialog v-if="categoryDelete" :category="categoryDelete" @close="openCategoryList" />
    <CategoryCodeFormDialog v-if="categoryEdit" :category="categoryEdit === 'new' ? null : categoryEdit" @close="closeCategoryEdit" />
    <IntakeProjectTypesDialog v-if="intakeProject" :project="intakeProject" @close="intakeProject = null" />
    <ProjectFormDialog
      v-if="projectForm"
      :mode="projectForm.mode"
      :project="projectForm.project"
      :category-codes="categoryCodes.data.value ?? []"
      @close="projectForm = null"
    />
  </div>
</template>

<style scoped>
.card { background: var(--hs-surface); border: 1px solid var(--hs-border); border-radius: var(--hs-radius-card); box-shadow: var(--hs-shadow-card); overflow: hidden; }
.toolbar { display: flex; flex-wrap: wrap; align-items: center; gap: 8px; padding: 14px 16px; }
.grow { flex: 1 1 240px; }
.filter { flex: 0 1 170px; min-width: 140px; }
.filter.narrow { flex-basis: 130px; min-width: 120px; }
.toolbar-actions { display: flex; align-items: center; gap: 2px; margin-left: auto; }
.cell { display: grid; gap: 2px; min-width: 0; }
.cell strong { color: var(--hs-text); font-weight: 500; overflow-wrap: anywhere; }
.cell small { color: var(--hs-text-3); font-size: var(--hs-text-xs); }
.code { font-family: var(--hs-font-mono); }
.num { font-variant-numeric: tabular-nums; }
.actions { display: flex; flex-wrap: wrap; gap: 4px 10px; }
.action { padding: 0; color: var(--hs-accent); background: none; border: 0; font: inherit; font-size: var(--hs-text-xs); white-space: nowrap; cursor: pointer; }
.action:hover { color: var(--hs-accent-hover); text-decoration: underline; text-underline-offset: 3px; }
.readonly { color: var(--hs-text-3); font-size: var(--hs-text-xs); }
</style>
