<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import { useRoute } from 'vue-router';
import PageHeader from '../../components/ui/PageHeader.vue';
import Button from '../../components/ui/Button.vue';
import IconButton from '../../components/ui/IconButton.vue';
import Icon from '../../components/ui/Icon.vue';
import SearchInput from '../../components/ui/SearchInput.vue';
import Select from '../../components/ui/Select.vue';
import TextInput from '../../components/ui/TextInput.vue';
import Segmented from '../../components/ui/Segmented.vue';
import Notice from '../../components/ui/Notice.vue';
import EmptyState from '../../components/ui/EmptyState.vue';
import Pagination from '../../components/ui/Pagination.vue';
import Spinner from '../../components/ui/Spinner.vue';
import QuoteSheet from './QuoteSheet.vue';
import QuoteRanking from './QuoteRanking.vue';
import QuoteDetailDrawer from './QuoteDetailDrawer.vue';
import QuoteAdjustDialog from './QuoteAdjustDialog.vue';
import RejectApprovedDialog from './RejectApprovedDialog.vue';
import { useApiData } from '../../composables/useApiData';
import { useSupplierDirectory } from '../../composables/useSupplierDirectory';
import { apiFetch, apiPost, apiPut } from '../../lib/api';
import { t } from '../../lib/i18n';
import type { ExchangeRate } from '../../lib/money';
import type { Project } from '../../lib/projects';
import { useSessionStore } from '../../stores/session';
import {
  createDraft, draftPayload, QUOTE_STATE_FILTERS, validateDraft,
  type MultiplierBounds, type Quote, type QuoteDraft,
} from './quotes';

const session = useSessionStore();
const route = useRoute();
const user = computed(() => session.user!);
const supplierSide = computed(() => !!user.value.supplierId);

// --- Filters ---------------------------------------------------------------
const search = ref('');
const supplierFilter = ref('');
const projectFilter = ref('');
const pricingType = ref('');
// Quotes are only offered in USD.
const CURRENCY = 'USD';
const stateFilter = ref('CURRENT');
const onDate = ref('');
const page = ref(1);
const size = ref(10);
const tab = ref<'list' | 'ranking'>('list');
watch([search, supplierFilter, projectFilter, pricingType, stateFilter, onDate], () => { page.value = 1; });

function resetFilters() {
  search.value = ''; supplierFilter.value = ''; projectFilter.value = ''; pricingType.value = '';
  stateFilter.value = 'CURRENT'; onDate.value = ''; page.value = 1;
}

// --- Data ------------------------------------------------------------------
const listPath = computed(() => {
  if (!supplierSide.value && tab.value !== 'list') return null;
  const query = new URLSearchParams({
    search: search.value, supplier: supplierSide.value ? '' : supplierFilter.value, project: projectFilter.value,
    pricingType: pricingType.value, currency: CURRENCY, state: stateFilter.value, onDate: onDate.value,
    page: String(page.value), size: String(size.value),
  });
  return `/quotes?${query}`;
});
const list = useApiData<{ items: Quote[]; total: number }>(listPath, { pollMs: 15_000 });
const directory = useSupplierDirectory(() => session.has('supplier.read'));
const projectData = useApiData<{ items: Project[] }>('/projects?size=100');
const rates = useApiData<ExchangeRate[]>(() => (session.has('exchange_rate.read') ? '/exchange-rates/current' : null), { pollMs: 30_000 });
const bounds = useApiData<MultiplierBounds>(() => (session.has('quote.read') ? '/quotes/multiplier-bounds' : null));

const quotes = computed(() => list.data.value?.items ?? []);
const projects = computed(() => (projectData.data.value?.items ?? []).filter((p) => p.settlementMethod !== 'LEGACY'));
const approvedSuppliers = computed(() => (directory.items.value ?? []).filter((s) => s.state === 'APPROVED' && s.enabled !== false));
const rateList = computed(() => rates.data.value ?? []);

// --- Inline drafts -----------------------------------------------------------
const drafts = ref<QuoteDraft[]>([]);
const submitting = new Set<string>();

function addDraft(source?: Quote) {
  tab.value = 'list';
  drafts.value = [...drafts.value, createDraft(user.value.supplierId || '', source)];
}
function editQuote(quote: Quote) {
  tab.value = 'list';
  if (!drafts.value.some((draft) => draft.id === quote.id)) drafts.value = [...drafts.value, createDraft(user.value.supplierId || '', quote, true)];
}
function updateDraft(key: string, field: keyof QuoteDraft, value: string) {
  drafts.value = drafts.value.map((draft) => {
    if (draft.key !== key) return draft;
    const next = { ...draft, [field]: value, error: '' } as QuoteDraft;
    // A different project means different pricing and capacity fields.
    if (field === 'projectId') {
      const project = projects.value.find((p) => p.id === value);
      Object.assign(next, { unitPrice: '', multiplier: project?.settlementMethod === 'QUOTA' ? '80' : '', accountCount: '', accountQuota: '', rpm: '', tpm: '' });
    }
    return next;
  });
}
function updatePeriod(key: string, from: string, to: string) {
  drafts.value = drafts.value.map((draft) => (draft.key === key ? { ...draft, effectiveFrom: from, effectiveTo: to, error: '' } : draft));
}
const patchDraft = (key: string, patch: Partial<QuoteDraft>) => { drafts.value = drafts.value.map((d) => (d.key === key ? { ...d, ...patch } : d)); };
const removeDraft = (key: string) => { drafts.value = drafts.value.filter((d) => d.key !== key); };

async function saveDraft(draft: QuoteDraft) {
  if (draft.pending || submitting.has(draft.key)) return;
  const project = projects.value.find((p) => p.id === draft.projectId);
  const problem = validateDraft(draft, project, { data: bounds.data.value, loading: bounds.loading.value, error: bounds.error.value });
  if (problem) { patchDraft(draft.key, { error: problem }); return; }
  submitting.add(draft.key);
  patchDraft(draft.key, { pending: true, error: '' });
  try {
    const body = draftPayload(draft, project);
    if (draft.id) await apiPut(`/quotes/${draft.id}`, body); else await apiPost('/quotes', body);
    removeDraft(draft.key);
    session.refresh();
    session.notify(draft.id ? t('该行报价已保存') : t('该行报价已提交审核'));
  } catch (error) {
    const message = (error as Error).message;
    patchDraft(draft.key, { pending: false, error: message });
    session.notify(message, true);
  } finally {
    submitting.delete(draft.key);
  }
}

// --- Detail drawer, adjust dialog, rejection ---------------------------------
// Each loader carries a sequence number so a slow response cannot overwrite a newer one.
const detail = ref<{ quote: Quote; loading: boolean; error: string } | null>(null);
const adjust = ref<{ quote: Quote; loading: boolean; error: string } | null>(null);
const rejecting = ref<Quote | null>(null);
let detailSequence = 0;
let adjustSequence = 0;

async function openDetail(quote: Quote) {
  const sequence = ++detailSequence;
  detail.value = { quote, loading: true, error: '' };
  try {
    const full = await apiFetch<Quote>(`/quotes/${encodeURIComponent(quote.id)}`);
    if (sequence === detailSequence) detail.value = { quote: full, loading: false, error: '' };
  } catch (error) {
    if (sequence === detailSequence && detail.value) detail.value = { ...detail.value, loading: false, error: (error as Error).message };
  }
}
function closeDetail() { detailSequence++; detail.value = null; }

async function openAdjust(quote: Quote) {
  closeDetail();
  const sequence = ++adjustSequence;
  adjust.value = { quote, loading: true, error: '' };
  try {
    const full = await apiFetch<Quote>(`/quotes/${encodeURIComponent(quote.id)}`);
    if (sequence === adjustSequence) adjust.value = { quote: full, loading: false, error: '' };
  } catch (error) {
    if (sequence === adjustSequence && adjust.value) adjust.value = { ...adjust.value, loading: false, error: (error as Error).message };
  }
}
function closeAdjust() { adjustSequence++; adjust.value = null; }
function openReject(quote: Quote) { closeDetail(); rejecting.value = quote; }

function afterChange() { session.refresh(); closeDetail(); }

// Links such as "quotes?id=…" (notifications, to-dos) open the quote; "&review=change" opens the adjustment.
onMounted(() => {
  const id = String(route.query.id ?? '');
  if (!id) return;
  if (route.query.review === 'change') void openAdjust({ id, projectName: '', code: '' } as Quote);
  else {
    const sequence = ++detailSequence;
    apiFetch<Quote>(`/quotes/${encodeURIComponent(id)}`)
      .then((quote) => { if (sequence === detailSequence) detail.value = { quote, loading: false, error: '' }; })
      .catch((error: Error) => { if (sequence === detailSequence) session.notify(error.message, true); });
  }
});
onBeforeUnmount(() => { detailSequence++; adjustSequence++; });

// --- Filter options ------------------------------------------------------------
const supplierOptions = computed(() => [
  { value: '', label: t('全部供应商') },
  ...(directory.items.value ?? []).map((s) => ({ value: s.id, label: s.name, detail: s.code })),
]);
const supplierPlaceholder = computed(() => (directory.loading.value ? t('{0}加载中…', [t('供应商')]) : directory.error.value ? t('{0}加载失败', [t('供应商')]) : t('全部供应商')));
const pricingOptions = [{ value: '', label: t('全部方式') }, { value: 'DISCOUNT', label: t('折扣报价') }, { value: 'FIXED', label: t('独立单价') }];
const stateOptions = QUOTE_STATE_FILTERS();
const tabOptions = [{ value: 'list' as const, label: t('报价列表') }, { value: 'ranking' as const, label: t('报价排行榜') }];
const showList = computed(() => supplierSide.value || tab.value === 'list');
const suggestedFor = computed(() => projects.value.find((p) => p.id === adjust.value?.quote.projectId)?.suggestedMultiplier);
</script>

<template>
  <div class="quotes">
    <PageHeader :title="supplierSide ? t('我的报价') : t('报价管理')" :description="t('同一供应商、同一项目同一时间只生效一条报价。')">
      <template #actions>
        <Segmented v-if="!supplierSide" v-model="tab" :options="tabOptions" :label="t('报价视图')" />
        <Button v-if="session.has('quote.write') && showList" variant="primary" icon="plus" @click="addDraft()">{{ t('新增报价行') }}</Button>
      </template>
    </PageHeader>

    <template v-if="showList">
      <section class="card">
        <div class="toolbar">
          <SearchInput v-model="search" class="grow" :placeholder="t('报价编号、供应商或项目')" :label="t('关键词')" />
          <template v-if="!supplierSide">
            <SearchInput v-if="!session.has('supplier.read')" v-model="supplierFilter" class="f-select" :placeholder="t('搜索供应商名称或编码')" :label="t('供应商')" />
            <div v-else class="f-select">
              <Select v-model="supplierFilter" :options="supplierOptions" :label="t('供应商')" :placeholder="supplierPlaceholder" icon="users"
                searchable :search-placeholder="t('搜索供应商名称或编码')" :disabled="directory.loading.value && !supplierFilter" />
            </div>
          </template>
          <SearchInput v-model="projectFilter" class="f-select" :placeholder="t('项目名称或编号')" :label="t('报价项目')" />
          <div class="narrow"><Select v-model="pricingType" :options="pricingOptions" :label="t('报价方式')" :placeholder="t('全部方式')" /></div>
          <div class="narrow"><Select v-model="stateFilter" :options="stateOptions" :label="t('报价状态')" :placeholder="t('全部报价状态')" /></div>
          <div class="date"><TextInput v-model="onDate" type="date" :prefix="t('适用日期')" :aria-label="t('适用日期')" /></div>
          <div class="toolbar-actions">
            <Button variant="ghost" size="sm" @click="resetFilters">{{ t('重置') }}</Button>
            <IconButton icon="refresh" :label="t('刷新报价')" @click="session.refresh()" />
          </div>
        </div>
        <p v-if="drafts.length" class="drafting"><Icon name="info" :size="14" />{{ t('{0} 行编辑中，保存后提交审核。', [drafts.length]) }}</p>

        <Notice v-if="list.error.value && (quotes.length || drafts.length)" tone="warning" class="inline-notice">
          {{ t('报价列表读取失败：{0}；已有草稿仍可保留，刷新后再试。', [list.error.value]) }}
        </Notice>
        <EmptyState v-if="list.error.value && !quotes.length && !drafts.length" error :text="list.error.value">
          <Button size="sm" icon="refresh" @click="list.reload()">{{ t('重试') }}</Button>
        </EmptyState>
        <div v-else-if="list.loading.value && !quotes.length && !drafts.length" class="state"><Spinner :size="16" /></div>
        <template v-else>
          <QuoteSheet
            :quotes="quotes"
            :drafts="drafts"
            :projects="projects"
            :suppliers="approvedSuppliers"
            :rates="rateList"
            :rates-loading="rates.loading.value"
            :rates-error="rates.error.value"
            :bounds="bounds.data.value"
            @open="openDetail"
            @edit="editQuote"
            @adjust="openAdjust"
            @reject="openReject"
            @copy="addDraft"
            @save="saveDraft"
            @cancel="removeDraft"
            @update="updateDraft"
            @period="updatePeriod"
          />
          <EmptyState v-if="!quotes.length && !drafts.length" :text="t('暂无报价')" :hint="session.has('quote.write') ? t('点击右上角「新增报价行」开始填写。') : undefined" compact />
          <Pagination v-model:page="page" v-model:size="size" :total="list.data.value?.total ?? 0" :loading="list.loading.value" />
        </template>
      </section>
      <p class="footnote">
        <Icon name="lock" :size="14" />
        {{ t('同一供应商、项目同一时间只生效一条报价，跨期间保持同一币种。今天调价今天生效，历史价格不变；未来调价按所选日期生效。待审调整和已排期的后续价格会显示在列表中，页面打开时自动更新。') }}
      </p>
    </template>

    <QuoteRanking
      v-else
      :projects="projectData.data.value?.items.filter((p) => p.settlementMethod !== 'LEGACY') ?? []"
      :loading="projectData.loading.value"
      :error="projectData.error.value"
      :rates="rateList"
      :rates-loading="rates.loading.value"
      :rates-error="rates.error.value"
      @open="openDetail"
    />

    <QuoteDetailDrawer
      v-if="detail"
      :quote="detail.quote"
      :loading="detail.loading"
      :error="detail.error"
      @close="closeDetail"
      @retry="openDetail(detail.quote)"
      @changed="afterChange"
      @edit="(quote) => { editQuote(quote); closeDetail(); }"
      @adjust="openAdjust"
      @copy="(quote) => { addDraft(quote); closeDetail(); }"
      @reject="openReject"
    />
    <QuoteAdjustDialog
      v-if="adjust"
      :quote="adjust.quote"
      :loading="adjust.loading"
      :error="adjust.error"
      :rates="rateList"
      :rates-loading="rates.loading.value"
      :rates-error="rates.error.value"
      :bounds="bounds.data.value"
      :bounds-error="bounds.error.value"
      :suggested-multiplier="suggestedFor"
      @close="closeAdjust"
      @retry="openAdjust(adjust.quote)"
      @changed="() => { session.refresh(); closeAdjust(); }"
    />
    <RejectApprovedDialog
      v-if="rejecting"
      :quote="rejecting"
      @close="rejecting = null"
      @rejected="() => { rejecting = null; session.refresh(); session.notify(t('报价已拒绝')); }"
    />
  </div>
</template>

<style scoped>
.card { background: var(--hs-surface); border: 1px solid var(--hs-border); border-radius: var(--hs-radius-card); box-shadow: var(--hs-shadow-card); overflow: hidden; }
.toolbar { display: flex; flex-wrap: wrap; align-items: center; gap: 8px; padding: 14px 16px; }
.grow { flex: 1 1 240px; }
.f-select { flex: 0 1 200px; min-width: 160px; }
.narrow { flex: 0 1 150px; min-width: 128px; }
.date { flex: 0 1 210px; min-width: 200px; }
.toolbar-actions { display: flex; align-items: center; gap: 2px; margin-left: auto; }
.drafting { display: flex; align-items: center; gap: 6px; margin: 0; padding: 0 16px 12px; color: var(--hs-violet); font-size: var(--hs-text-xs); }
.inline-notice { margin: 0 16px 12px; }
.state { display: grid; place-items: center; padding: 48px; color: var(--hs-text-3); }
.footnote { display: flex; align-items: flex-start; gap: 8px; margin: 14px 4px 0; color: var(--hs-text-3); font-size: var(--hs-text-xs); line-height: 1.7; }
.footnote > .hs-icon { margin-top: 2px; }
</style>
