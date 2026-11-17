<script setup lang="ts">
// The resource / delivery list (legacy Resources `St`). Filters build one
// query for `/deliveries`; CCMAX summaries use the same filters minus the
// NewAPI-only ones. Writes whose outcome is unknown are only ever re-read.
import { computed, onBeforeUnmount, ref, shallowRef, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import PageHeader from '../../components/ui/PageHeader.vue';
import Button from '../../components/ui/Button.vue';
import Icon from '../../components/ui/Icon.vue';
import Dialog from '../../components/ui/Dialog.vue';
import DataTable from '../../components/ui/DataTable.vue';
import DateRangePicker from '../../components/ui/DateRangePicker.vue';
import Notice from '../../components/ui/Notice.vue';
import Pagination from '../../components/ui/Pagination.vue';
import SearchInput from '../../components/ui/SearchInput.vue';
import Select from '../../components/ui/Select.vue';
import Spinner from '../../components/ui/Spinner.vue';
import type { SelectOption } from '../../components/ui/types';
import { useApiData } from '../../composables/useApiData';
import { apiDelete, apiFetch, apiPost } from '../../lib/api';
import { getLocale, t, translateUpstreamError } from '../../lib/i18n';
import { CREDENTIAL_MODE_LABELS } from '../../lib/labels';
import { formatMoney } from '../../lib/money';
import { useSessionStore } from '../../stores/session';
import CcmaxResourceOverview from './components/CcmaxResourceOverview.vue';
import IntakeToday from './components/IntakeToday.vue';
import RemoveConfirm from './components/RemoveConfirm.vue';
import ResourceTable from './components/ResourceTable.vue';
import { usePolledData } from './composables/usePolledData';
import { CAPABILITIES_PATH, intakeDeniedMessage, type SubmissionCapabilities } from './composables/useIntakeAccess';
import { useLifecycleActions } from './composables/useLifecycleActions';
import CredentialRefreshDialog from './dialogs/CredentialRefreshDialog.vue';
import IntakeAssignDialog from './dialogs/IntakeAssignDialog.vue';
import IntakeDetailDialog from './dialogs/IntakeDetailDialog.vue';
import IntakeReviewDialog from './dialogs/IntakeReviewDialog.vue';
import ProxyReplacementDialog from './dialogs/ProxyReplacementDialog.vue';
import ProxyReplacementHistoryDialog from './dialogs/ProxyReplacementHistoryDialog.vue';
import ProxyReplacementProgressDrawer from './dialogs/ProxyReplacementProgressDrawer.vue';
import ReauthorizationDialog from './dialogs/ReauthorizationDialog.vue';
import ResourceDetailDrawer from './dialogs/ResourceDetailDrawer.vue';
import ResourceLifecycleDialog from './dialogs/ResourceLifecycleDialog.vue';
import NativeCcmaxDialog from './forms/NativeCcmaxDialog.vue';
import NativeCcmaxLinkDialog from './forms/NativeCcmaxLinkDialog.vue';
import NewApiChannelDialog from './forms/NewApiChannelDialog.vue';
import NewApiLinkDialog from './forms/NewApiLinkDialog.vue';
import ResourceFormDialog from './forms/ResourceFormDialog.vue';
import {
  canEditDraft, canManualRecover, canOauthRetry, canReauthorize, canRemove, CREATION_STATE_LABELS, DELIVERY_STATE_FILTERS, enc,
  IMPORT_STATE_LABELS, isIntake, isNativeCcmax, isNewApi, isPlatformDispatcher, LANE_FILTER_LABELS, pageTitle, pausedResource,
  proxyReplaceable, type DeliveryPage, type Resource,
} from './resources';

const props = defineProps<{ supplierSide: boolean; pendingOnly: boolean }>();
const emit = defineEmits<{ apiDelivery: [] }>();

const session = useSessionStore();
const route = useRoute();
const router = useRouter();
const user = computed(() => session.user!);
const has = (permission: string) => session.has(permission);

// --- Mode -------------------------------------------------------------------------
const typeFilter = ref('');
/** Effective resource type: the pending tab only lists NewAPI intakes. */
const resourceType = computed(() => (props.pendingOnly ? 'NEWAPI_INTAKE' : typeFilter.value));
const assignment = computed(() => (props.pendingOnly ? 'UNASSIGNED' : 'ASSIGNED'));
const ccmaxVisible = computed(() => !props.pendingOnly && ['', 'CCMAX', 'NEWAPI_CHANNEL'].includes(resourceType.value));
const intakeReviewer = computed(() => !props.supplierSide && isPlatformDispatcher(user.value));
const canDeliver = computed(() => props.supplierSide && has('resource.write'));
const intakeLabels = computed(() => props.supplierSide && resourceType.value === 'NEWAPI_INTAKE');

// Capabilities: `supportsProxy` for everyone; the CCMAX intake switches for suppliers who deliver.
const capabilityData = useApiData<SubmissionCapabilities>(CAPABILITIES_PATH);
const supportsProxy = computed(() => capabilityData.data.value?.supportsProxy === true);
const intakeCapabilities = computed(() => canDeliver.value && !props.pendingOnly);
const capabilities = computed(() => (intakeCapabilities.value ? capabilityData.data.value : null));
const capabilitiesError = computed(() => (intakeCapabilities.value ? capabilityData.error.value : ''));
const intakeStopped = computed(() => capabilities.value?.forceStopCcmaxIntake === true || capabilities.value?.allowCcmax === false);
const mayReplaceProxy = computed(() => supportsProxy.value && has('proxy.read') && has(props.supplierSide ? 'resource.write' : 'resource.dispatch'));

// --- Filters ------------------------------------------------------------------------
const page = ref(1);
const size = ref(10);
const searchInput = ref('');
const search = ref('');
let searchTimer: number | undefined;
// Typing applies after 300 ms; clearing applies at once.
watch(searchInput, (value) => {
  window.clearTimeout(searchTimer);
  const apply = () => { search.value = value.trim(); };
  if (value.trim()) searchTimer = window.setTimeout(apply, 300); else apply();
});
const supplierFilter = ref('');
const creatorFilter = ref('');
const supplierSearch = ref('');
const creatorSearch = ref('');
const optionSearch = ref({ supplier: '', creator: '' });
let optionTimer: number | undefined;
watch([supplierSearch, creatorSearch], () => {
  window.clearTimeout(optionTimer);
  optionTimer = window.setTimeout(() => { optionSearch.value = { supplier: supplierSearch.value.trim(), creator: creatorSearch.value.trim() }; }, 300);
});
onBeforeUnmount(() => { window.clearTimeout(searchTimer); window.clearTimeout(optionTimer); });

const newApiDeliveryState = ref('');
const newApiResourceState = ref('');
const operationalStatus = ref('');
const failureReason = ref('');
const projectFilter = ref('');
const credentialMode = ref('');
const deliveryState = ref('');
const createdFrom = ref('');
const createdTo = ref('');

// Any filter change returns to the first page (declared before the list so the list loads once).
watch([search, supplierFilter, creatorFilter, typeFilter, newApiDeliveryState, newApiResourceState, operationalStatus, failureReason,
  projectFilter, credentialMode, deliveryState, createdFrom, createdTo], () => { page.value = 1; });
const selected = shallowRef(new Map<string, Resource>());
const clearSelection = () => { selected.value = new Map(); };
watch([search, supplierFilter, creatorFilter, resourceType, operationalStatus, failureReason, projectFilter, deliveryState, createdFrom, createdTo], clearSelection);

function resetFilters() {
  searchInput.value = ''; supplierFilter.value = ''; creatorFilter.value = ''; typeFilter.value = '';
  newApiDeliveryState.value = ''; newApiResourceState.value = ''; operationalStatus.value = ''; failureReason.value = '';
  projectFilter.value = ''; credentialMode.value = ''; deliveryState.value = ''; createdFrom.value = ''; createdTo.value = '';
}
function changeType(value: string) {
  typeFilter.value = value; newApiDeliveryState.value = ''; newApiResourceState.value = ''; credentialMode.value = '';
  if (value !== 'CCMAX') { deliveryState.value = ''; operationalStatus.value = ''; failureReason.value = ''; }
}
/** A metric in the CCMAX overview filters the list to that status. */
function filterOverview(status: string) {
  typeFilter.value = 'CCMAX'; newApiDeliveryState.value = ''; newApiResourceState.value = ''; operationalStatus.value = status;
}

const baseQuery = computed(() => new URLSearchParams({
  search: search.value,
  supplierSearch: props.supplierSide ? '' : supplierFilter.value,
  creatorSearch: creatorFilter.value,
  resourceType: props.pendingOnly ? 'NEWAPI_INTAKE' : ['CCMAX', 'NEWAPI_CHANNEL'].includes(typeFilter.value) ? typeFilter.value : '',
  category: props.pendingOnly || ['CCMAX', 'NEWAPI_CHANNEL'].includes(typeFilter.value) ? '' : typeFilter.value,
  assignment: assignment.value,
  newApiDeliveryState: newApiDeliveryState.value,
  newApiResourceState: newApiResourceState.value,
  operationalStatus: operationalStatus.value,
  failureReason: failureReason.value,
  projectId: projectFilter.value,
  credentialMode: props.supplierSide || resourceType.value === 'CCMAX' ? credentialMode.value : '',
  state: deliveryState.value,
  createdFrom: createdFrom.value,
  createdTo: createdTo.value,
}));
/** CCMAX summaries: the list filters, CCMAX only, without assignment and NewAPI states. */
const summaryQuery = computed(() => {
  const query = new URLSearchParams(baseQuery.value);
  query.set('resourceType', 'CCMAX');
  for (const key of ['assignment', 'newApiDeliveryState', 'newApiResourceState']) query.delete(key);
  return query;
});
const listQuery = computed(() => {
  const query = new URLSearchParams(baseQuery.value);
  query.set('page', String(page.value)); query.set('size', String(size.value)); query.set('summaryOnly', 'true');
  return query;
});
const failureQuery = computed(() => {
  const query = new URLSearchParams(summaryQuery.value);
  query.delete('failureReason');
  return query;
});

// --- Data ---------------------------------------------------------------------------
interface FilterPerson { id: string; name: string; code?: string | null }
interface SummaryRow { category: string; categoryName: string; amounts: Array<{ kind: string; amount: string; currency: string; resourceCount: number }> }
interface CreatorRow { creatorName: string; creatorUsername?: string | null; resourceCount: number; amountResourceCount: number; consumptionAmountUsd: string }
interface FailureReason { value: string; label: string; count: number }
interface ProjectRow { id: string; name: string; category?: string | null; categoryName?: string | null }

// Polling stops while a search is applied.
const listPoll = computed(() => (search.value ? 0 : 10_000));
const summaryPoll = computed(() => (search.value ? 0 : 30_000));
const filterOptions = useApiData<{ suppliers: FilterPerson[]; creators: FilterPerson[] }>(() =>
  `/deliveries/filter-options?assignment=${assignment.value}&supplierSearch=${enc(optionSearch.value.supplier)}&creatorSearch=${enc(optionSearch.value.creator)}`);
const list = usePolledData<DeliveryPage>(() => `/deliveries?${listQuery.value}`, listPoll);
const categorySummary = usePolledData<SummaryRow[]>(() => (props.supplierSide && ccmaxVisible.value ? `/resources/summary?${summaryQuery.value}` : null), summaryPoll);
const showCreators = ref(false);
const creatorSummary = usePolledData<CreatorRow[]>(() => (showCreators.value && ccmaxVisible.value ? `/resources/creator-summary?${summaryQuery.value}` : null), summaryPoll);
const failureReasons = usePolledData<FailureReason[]>(() => (ccmaxVisible.value ? `/resources/failure-reasons?${failureQuery.value}` : null), summaryPoll);
const projectData = useApiData<{ items: ProjectRow[] }>('/projects?size=100');
const categoryCodes = useApiData<Array<{ code: string; name: string }>>('/projects/category-codes');

const rows = computed(() => list.data.value?.items ?? []);
const listTotal = computed(() => (!list.loading.value && !list.error.value ? list.data.value?.total : undefined));
const projectNames = computed(() => new Map((projectData.data.value?.items ?? []).map((p) => [p.id, p.name])));
const reasons = computed(() => (failureReasons.loading.value || failureReasons.error.value ? [] : failureReasons.data.value ?? []));

// Option labels survive later searches so chips keep their names.
const supplierLabels = new Map<string, string>();
const creatorLabels = new Map<string, string>();
const toOptions = (people: FilterPerson[] | undefined, cache: Map<string, string>): SelectOption[] => (people ?? []).map((person) => {
  cache.set(person.id, person.name);
  return { value: person.id, label: person.name, detail: person.code ?? undefined };
});
const supplierOptions = computed(() => toOptions(filterOptions.data.value?.suppliers, supplierLabels));
const creatorOptions = computed(() => toOptions(filterOptions.data.value?.creators, creatorLabels));
function personOptions(label: string, allLabel: string, options: SelectOption[], value: string, cache: Map<string, string>): SelectOption[] {
  const first = filterOptions.loading.value ? t('{0}加载中…', [label]) : filterOptions.error.value ? t('{0}加载失败', [label]) : allLabel;
  const extra = value && !options.some((option) => option.value === value) ? [{ value, label: cache.get(value) ?? t('已选{0}', [label]) }] : [];
  return [{ value: '', label: first }, ...options, ...extra];
}
const creatorLabel = computed(() => (intakeLabels.value ? t('录入人') : t('创建人')));

const credentialLabels = CREDENTIAL_MODE_LABELS();
const laneLabels = LANE_FILTER_LABELS();
const importLabels = IMPORT_STATE_LABELS();
const creationLabels = CREATION_STATE_LABELS();
const deliveryFilters = DELIVERY_STATE_FILTERS();
const typeOptions = computed<SelectOption[]>(() => [
  { value: '', label: t('全部资源类型') },
  { value: 'CCMAX', label: 'CCMAX' },
  { value: 'NEWAPI_CHANNEL', label: t('New API 渠道') },
  ...(categoryCodes.data.value ?? []).filter((c) => c.code !== 'CCMAX').map((c) => ({ value: c.code, label: c.name })),
]);
const projectOptions = computed<SelectOption[]>(() => [
  { value: '', label: t('全部项目') },
  ...(projectData.data.value?.items ?? []).map((p) => ({ value: p.id, label: p.name })),
]);
const credentialOptions = computed<SelectOption[]>(() => [
  { value: '', label: t('全部凭据方式') },
  ...Object.entries(credentialLabels).map(([value, label]) => ({ value, label })),
]);
const laneOptions = computed<SelectOption[]>(() => [{ value: '', label: t('全部资源状态') }, ...Object.entries(laneLabels).map(([value, label]) => ({ value, label }))]);
const importOptions = computed<SelectOption[]>(() => [{ value: '', label: t('全部交付状态') }, ...Object.entries(importLabels).map(([value, label]) => ({ value, label }))]);
const creationOptions = computed<SelectOption[]>(() => [{ value: '', label: t('全部资源状态') }, ...Object.entries(creationLabels).map(([value, label]) => ({ value, label }))]);
const count = (value: number) => value.toLocaleString(getLocale());
const reasonOptions = computed<SelectOption[]>(() => {
  const current = failureReason.value;
  const total = listTotal.value;
  const first = failureReasons.loading.value ? t('失效原因加载中…') : failureReasons.error.value ? t('失效原因加载失败') : t('全部失效原因');
  const options: SelectOption[] = reasons.value.map((reason) => ({
    value: reason.value,
    label: translateUpstreamError(reason.label),
    detail: reason.value === current
      ? total === undefined ? (list.error.value ? t('查询失败') : t('查询中…')) : t('{0} 条资源', [count(total)])
      : t('{0} 条资源', [count(reason.count)]),
  }));
  if (current && !reasons.value.some((reason) => reason.value === current)) {
    options.push({
      value: current,
      label: translateUpstreamError(current),
      detail: failureReasons.loading.value || failureReasons.error.value || total === undefined ? t('已选择') : t('当前条件 {0} 条资源', [count(total)]),
    });
  }
  return [{ value: '', label: first }, ...options];
});

interface AppliedFilter { label: string; value: string | undefined; clear: () => void }
const appliedFilters = computed(() => ([
  { label: t('关键词'), value: search.value, clear: () => { searchInput.value = ''; } },
  {
    label: t('供应商'),
    value: props.supplierSide || !supplierFilter.value ? '' : supplierOptions.value.find((o) => o.value === supplierFilter.value)?.label ?? supplierLabels.get(supplierFilter.value) ?? t('已选供应商'),
    clear: () => { supplierFilter.value = ''; },
  },
  {
    label: creatorLabel.value,
    value: creatorFilter.value ? creatorOptions.value.find((o) => o.value === creatorFilter.value)?.label ?? creatorLabels.get(creatorFilter.value) ?? t('已选创建人') : '',
    clear: () => { creatorFilter.value = ''; },
  },
  {
    label: t('资源类型'),
    value: props.pendingOnly ? '' : projectData.data.value?.items.find((p) => p.category === resourceType.value)?.categoryName || resourceType.value,
    clear: () => {
      typeFilter.value = ''; newApiDeliveryState.value = ''; newApiResourceState.value = ''; credentialMode.value = '';
      deliveryState.value = ''; operationalStatus.value = ''; failureReason.value = '';
    },
  },
  { label: t('项目'), value: projectFilter.value ? projectNames.value.get(projectFilter.value) || t('已选项目') : '', clear: () => { projectFilter.value = ''; } },
  { label: t('凭据方式'), value: credentialMode.value ? credentialLabels[credentialMode.value] : '', clear: () => { credentialMode.value = ''; } },
  { label: t('交付状态'), value: newApiDeliveryState.value ? importLabels[newApiDeliveryState.value] : '', clear: () => { newApiDeliveryState.value = ''; } },
  { label: t('资源状态'), value: newApiResourceState.value ? creationLabels[newApiResourceState.value] : '', clear: () => { newApiResourceState.value = ''; } },
  { label: t('交付状态'), value: deliveryState.value ? deliveryFilters.find((o) => o.value === deliveryState.value)?.label : '', clear: () => { deliveryState.value = ''; } },
  { label: t('资源状态'), value: operationalStatus.value ? laneLabels[operationalStatus.value] : '', clear: () => { operationalStatus.value = ''; } },
  {
    label: t('失效原因'),
    value: failureReason.value ? translateUpstreamError(reasons.value.find((r) => r.value === failureReason.value)?.label || failureReason.value) : '',
    clear: () => { failureReason.value = ''; },
  },
  {
    label: t('创建日期'),
    value: createdFrom.value || createdTo.value ? t('{0} 至 {1}', [createdFrom.value || t('不限'), createdTo.value || t('不限')]) : '',
    clear: () => { createdFrom.value = ''; createdTo.value = ''; },
  },
] as AppliedFilter[]).filter((filter) => filter.value));
const draftWindowHint = computed(() => ccmaxVisible.value && !deliveryState.value && !searchInput.value.trim()
  && !supplierFilter.value.trim() && !creatorFilter.value.trim() && !createdFrom.value && !createdTo.value);

// Platform refresh: one global refresh per finished load.
let refreshRequested = false;
watch([list.loading, list.refreshing, list.data, list.error], () => { if (!list.loading.value && !list.refreshing.value) refreshRequested = false; });
function refreshList() {
  if (list.loading.value || list.refreshing.value || refreshRequested) return;
  refreshRequested = true;
  session.refresh();
}

// --- Lifecycle ----------------------------------------------------------------------
const lifecycle = useLifecycleActions({
  supplierSide: props.supplierSide,
  capabilities: () => (capabilityData.loading.value || capabilityData.error.value ? null : capabilities.value),
  onSubmitted: clearSelection,
});
const selectedRows = computed(() => [...selected.value.values()]);
const lifecycleBatch = computed(() => lifecycle.batch(selectedRows.value));
const confirmSubject = computed(() => {
  const resources = lifecycle.confirmation.value?.resources ?? [];
  return resources.length === 1 ? resources[0].name || resources[0].laneId || t('{0} 个资源', [1]) : t('{0} 个资源', [resources.length]);
});
function closeLifecycleDialog() { lifecycle.dialog.value = null; session.refresh(); }

// --- Dialog state ---------------------------------------------------------------------
const form = shallowRef<Resource | 'new' | null>(null);
const prefill = shallowRef<{ projectId: string; projectName: string } | null>(null);
const detail = shallowRef<Resource | null>(null);
const credentialRefresh = shallowRef<Resource | null>(null);
const reauthorization = shallowRef<Resource | null>(null);
/** Detail to reopen once the credential dialogs close. */
let reopenDetail: Resource | null = null;
const intakeDetail = shallowRef<Resource | null>(null);
const assigning = shallowRef<Resource | null>(null);
const replacing = shallowRef<Resource[] | null>(null);
const replacementHistory = ref(false);
const replacementProgress = ref<string | null>(null);
const intakeReview = ref(false);
const linkNative = ref(false);
const linkChannel = ref(false);

function openCredentialDialog(resource: Resource, refresh: boolean, fromDetail = false) {
  reopenDetail = fromDetail ? resource : null;
  if (fromDetail) detail.value = null;
  if (refresh) credentialRefresh.value = resource; else reauthorization.value = resource;
}
function closeCredentialDialogs() {
  credentialRefresh.value = null;
  reauthorization.value = null;
  const resource = reopenDetail;
  reopenDetail = null;
  if (resource) detail.value = resource;
}
function switchToReauthorization() {
  reauthorization.value = credentialRefresh.value;
  credentialRefresh.value = null;
}
const openRow = (resource: Resource) => { if (isIntake(resource)) intakeDetail.value = resource; else detail.value = resource; };
const mayAssign = (resource: Resource) => has('resource.intake.manage') && has('resource.write') && resource.assignmentState === 'UNASSIGNED';

/** Re-reads one resource into the list row and the open detail. */
async function reloadRow(id: string) {
  const fresh = await apiFetch<Resource>(`/resources/${enc(id)}`);
  list.mutate((current) => ({ ...current, items: current.items.map((row) => (!isIntake(row) && row.id === id ? { ...row, ...fresh } : row)) }));
  if (detail.value?.id === id) detail.value = { ...detail.value, ...fresh };
  return fresh;
}
function afterAuthorization(id: string) {
  reloadRow(id).catch((error: Error) => session.notify(t('授权操作已结束，当前行读取失败：{0}', [error.message]), true));
}

// --- Usage sync ---------------------------------------------------------------------
const syncing = ref(new Set<string>());
const mayRefreshUsage = (row: Resource) => row.resourceType === 'CCMAX' && has('resource.usage') && row.state === 'DELIVERED'
  && row.dispatchState === 'SUCCESS' && !(props.supplierSide && row.settlementMethod === 'ACCOUNT_BUYOUT');
async function refreshUsage(row: Resource) {
  if (syncing.value.has(row.id)) return;
  syncing.value = new Set(syncing.value).add(row.id);
  try {
    const result = await apiPost<{ state: string; amount?: string | null; [key: string]: unknown }>(`/resources/${enc(row.id)}/usage`, {});
    try {
      await reloadRow(row.id);
    } catch (error) {
      if (result.state === 'UPDATED') {
        list.mutate((current) => ({
          ...current,
          items: current.items.map((item) => (!isIntake(item) && item.id === row.id ? { ...item, usage: { ...item.usage, ...result } } : item)),
        }));
        session.notify(t('金额已同步，最新账号状态读取失败：{0}', [(error as Error).message]), true);
        return;
      }
    }
    if (result.state !== 'UPDATED') {
      session.notify(result.amount == null ? t('金额同步失败，暂未取得消费金额') : t('金额同步失败，仍显示上次成功的金额'), true);
      return;
    }
    session.notify(t('金额已同步'));
  } catch (error) {
    session.notify(t('金额同步失败：{0}', [(error as Error).message]), true);
  } finally {
    const next = new Set(syncing.value);
    next.delete(row.id);
    syncing.value = next;
  }
}

// --- Draft edit / OAuth retry ----------------------------------------------------------
const editingId = ref<string | null>(null);
async function editDraft(row: Resource) {
  if (editingId.value !== null || (!canEditDraft(row, props.supplierSide, has) && !canOauthRetry(row, props.supplierSide, has))) return;
  editingId.value = row.id;
  try {
    let fresh = await apiFetch<Resource>(`/resources/${enc(row.id)}`);
    if (canOauthRetry(fresh, props.supplierSide, has)) {
      fresh = await apiPost<Resource>(`/resources/${enc(fresh.id)}/oauth/supplier-retry`, { version: fresh.version });
      session.refresh();
    }
    if (!canEditDraft(fresh, props.supplierSide, has)) {
      session.refresh();
      session.notify(t('记录状态已变化，请刷新后查看'), true);
      return;
    }
    prefill.value = null;
    form.value = fresh;
  } catch (error) {
    session.notify(t('加载草稿失败：{0}', [(error as Error).message]), true);
  } finally {
    editingId.value = null;
  }
}

// --- Delete ----------------------------------------------------------------------------
const deleting = shallowRef<Resource | null>(null);
const deleteBusy = ref(false);
const deleteError = ref('');
async function confirmDelete() {
  const target = deleting.value;
  if (!target || deleteBusy.value || !canRemove(target, props.supplierSide, has)) return;
  deleteBusy.value = true;
  deleteError.value = '';
  try {
    await apiDelete(`/resources/${enc(target.id)}?version=${target.version}`);
    if (detail.value?.id === target.id) detail.value = null;
    deleting.value = null;
    session.notify(t('已标记删除，列表中已隐藏'));
    session.refresh();
  } catch (error) {
    deleteError.value = (error as Error).message;
  } finally {
    deleteBusy.value = false;
  }
}
function askDelete(row: Resource) { deleteError.value = ''; deleting.value = row; }

// --- Creation recovery: confirm CCMAX did not create it, then edit or delete ---------------
const recovery = shallowRef<{ resource: Resource; action: 'EDIT' | 'DELETE' } | null>(null);
const recoveryChecked = ref(false);
const recoveryBusy = ref(false);
const recoveryError = ref('');
function askRecovery(resource: Resource, action: 'EDIT' | 'DELETE') {
  recoveryChecked.value = false; recoveryError.value = '';
  recovery.value = { resource, action };
}
async function confirmRecovery() {
  const current = recovery.value;
  if (!current || !recoveryChecked.value || recoveryBusy.value) return;
  recoveryBusy.value = true;
  recoveryError.value = '';
  try {
    const result = await apiPost<{ deleted?: boolean; resource?: Resource }>(`/resources/${enc(current.resource.id)}/creation-recovery`, {
      version: current.resource.version,
      dispatchId: current.resource.recoveryDispatchId,
      confirmedNotCreated: true,
      action: current.action,
    });
    detail.value = null;
    recovery.value = null;
    session.refresh();
    if (result.deleted) session.notify(t('已标记删除，列表中已隐藏'));
    else if (result.resource) { prefill.value = null; form.value = result.resource; }
  } catch (error) {
    recoveryError.value = (error as Error).message;
  } finally {
    recoveryBusy.value = false;
  }
}

// --- New delivery and the `?quoteId=` link from an approved quote --------------------------
const quoteId = computed(() => (typeof route.query.quoteId === 'string' ? route.query.quoteId : ''));
const quoteLoading = ref(!!(quoteId.value && canDeliver.value));
const quoteError = ref('');
let quoteSequence = 0;
watch([quoteId, canDeliver, () => has('quote.read'), () => user.value.supplierId], ([id, deliver, mayReadQuote]) => {
  const sequence = ++quoteSequence;
  if (!id || !deliver) return;
  if (!mayReadQuote) { quoteError.value = t('没有查看报价的权限，无法带入交付资料'); quoteLoading.value = false; return; }
  quoteLoading.value = true;
  Promise.all([
    apiFetch<{ state: string; supplierId: string; projectId: string; projectName: string }>(`/quotes/${enc(id)}`)
      .catch((error: Error) => { throw new Error(t('报价资料加载失败：{0}', [error.message])); }),
    apiFetch<Array<{ id: string }>>('/resources/eligible-projects')
      .catch((error: Error) => { throw new Error(t('可交付项目查询失败：{0}', [error.message])); }),
  ]).then(([quote, eligible]) => {
    if (sequence !== quoteSequence) return;
    if (quote.state !== 'APPROVED' || quote.supplierId !== user.value.supplierId) { quoteError.value = t('仅可从本方已通过的报价发起交付'); return; }
    if (!eligible.some((project) => project.id === quote.projectId)) { quoteError.value = t('该报价目前不满足交付条件，请核对有效期和币种'); return; }
    prefill.value = { projectId: quote.projectId, projectName: quote.projectName };
    form.value = 'new';
  }).catch((error: Error) => {
    if (sequence === quoteSequence) quoteError.value = error.message;
  }).finally(() => {
    if (sequence === quoteSequence) quoteLoading.value = false;
  });
}, { immediate: true });
onBeforeUnmount(() => { quoteSequence++; });

function startDelivery() {
  prefill.value = null;
  if (resourceType.value === 'NEWAPI_INTAKE' || intakeStopped.value) emit('apiDelivery');
  else form.value = 'new';
}
function closeForm() {
  form.value = null;
  prefill.value = null;
  if (quoteId.value) router.push({ path: '/deliveries' });
}

const mayLinkUpstream = computed(() => !props.supplierSide && user.value.role === 'ADMIN' && has('resource.dispatch') && has('resource.config.read'));
function linked(message: string, resource: Resource) {
  linkNative.value = false;
  linkChannel.value = false;
  session.notify(message);
  session.refresh();
  detail.value = resource;
}
const batchReplaceBlocked = computed(() => !selected.value.size || selectedRows.value.some((row) => isNewApi(row) || isNativeCcmax(row)));
</script>

<template>
  <div class="rs-page">
    <PageHeader :title="pageTitle(supplierSide, pendingOnly)">
      <template #actions>
        <template v-if="mayLinkUpstream">
          <Button @click="linkNative = true">{{ t('关联 CCMAX 原生账号') }}</Button>
          <Button @click="linkChannel = true">{{ t('关联 New API 渠道') }}</Button>
        </template>
        <Button
          v-if="!supplierSide"
          icon="refresh"
          :aria-label="pendingOnly ? t('刷新待分配资源') : t('刷新资源列表')"
          :aria-busy="list.loading.value || list.refreshing.value"
          :disabled="list.loading.value || list.refreshing.value"
          @click="refreshList"
        >{{ list.loading.value || list.refreshing.value ? t('刷新中') : t('刷新') }}</Button>
        <Button v-if="ccmaxVisible" :aria-expanded="showCreators" aria-controls="creator-summary" @click="showCreators = !showCreators">
          {{ showCreators ? t('收起创建人汇总') : t('按创建人汇总') }}
        </Button>
        <Button
          v-if="canDeliver"
          variant="primary"
          icon="plus"
          :disabled="quoteLoading || (resourceType !== 'NEWAPI_INTAKE' && (!capabilities || (resourceType === 'CCMAX' && intakeStopped)))"
          @click="startDelivery"
        >{{ intakeStopped && !resourceType ? t('NewAPI 资源交付') : t('新增交付') }}</Button>
      </template>
    </PageHeader>

    <div v-if="quoteLoading" class="rs-state"><Spinner :size="16" /></div>
    <Notice v-if="quoteError" tone="danger">{{ quoteError }}</Notice>
    <template v-if="canDeliver && ccmaxVisible">
      <Notice v-if="capabilitiesError" tone="danger">
        {{ capabilitiesError }}
        <template #actions><Button size="sm" @click="capabilityData.reload()">{{ t('重新加载配置') }}</Button></template>
      </Notice>
      <Notice v-if="intakeStopped" tone="warning">{{ intakeDeniedMessage(capabilities) }}</Notice>
    </template>

    <CcmaxResourceOverview
      v-if="ccmaxVisible"
      :filter-query="summaryQuery.toString()"
      :refresh-interval-ms="summaryPoll"
      :operational-status="operationalStatus"
      @filter="filterOverview"
    />
    <template v-if="supplierSide && ccmaxVisible">
      <IntakeToday />
      <section class="rs-card rs-summary" :aria-label="t('项目分类汇总')">
        <h2>{{ t('项目分类汇总') }}</h2>
        <Notice v-if="categorySummary.error.value" tone="danger">{{ t('分类汇总加载失败：') }}{{ categorySummary.error.value }}</Notice>
        <div v-if="categorySummary.loading.value" class="rs-state"><Spinner :size="16" /></div>
        <template v-else-if="!categorySummary.error.value">
          <div v-if="categorySummary.data.value?.length" class="rs-summary-grid">
            <div v-for="row in categorySummary.data.value" :key="row.category" class="rs-summary-card">
              <span class="rs-summary-category">{{ row.categoryName }}</span>
              <div class="rs-summary-amounts">
                <template v-if="row.amounts.length">
                  <div v-for="amount in row.amounts" :key="`${amount.kind}-${amount.currency}`" class="rs-summary-amount">
                    <span>{{ amount.kind === 'BUYOUT' ? t('买断价格') : t('消费金额') }}</span>
                    <strong>{{ formatMoney(amount.amount) }} {{ amount.currency }}</strong>
                    <span>{{ count(amount.resourceCount) }}{{ t(' 条资源') }}</span>
                  </div>
                </template>
                <span v-else class="rs-muted">{{ t('暂无金额') }}</span>
              </div>
            </div>
          </div>
          <p v-else class="rs-muted rs-summary-empty">{{ t('当前筛选下没有交付资源') }}</p>
        </template>
      </section>
    </template>

    <section class="rs-card">
      <div class="rs-toolbar">
        <SearchInput
          v-model="searchInput"
          class="rs-grow"
          :placeholder="ccmaxVisible ? t('搜索资源名称、账号或 Lane ID') : t('搜索资源名称')"
          :label="t('关键词')"
        />
        <div v-if="!supplierSide" class="rs-filter">
          <Select
            v-model="supplierFilter"
            :options="personOptions(t('供应商'), t('全部供应商'), supplierOptions, supplierFilter, supplierLabels)"
            :label="t('供应商')"
            :placeholder="t('全部供应商')"
            icon="users"
            searchable
            :search-placeholder="t('搜索供应商名称或编码')"
            :search-loading="filterOptions.loading.value"
            @search="(query) => { supplierSearch = query; }"
          />
        </div>
        <div class="rs-filter">
          <Select
            v-model="creatorFilter"
            :options="personOptions(creatorLabel, intakeLabels ? t('全部录入人') : t('全部创建人'), creatorOptions, creatorFilter, creatorLabels)"
            :label="creatorLabel"
            :placeholder="intakeLabels ? t('全部录入人') : t('全部创建人')"
            searchable
            :search-placeholder="intakeLabels ? t('搜索录入人姓名或账号') : t('搜索创建人姓名或账号')"
            :search-loading="filterOptions.loading.value"
            @search="(query) => { creatorSearch = query; }"
          />
        </div>
        <template v-if="!pendingOnly">
          <div class="rs-filter narrow">
            <Select :model-value="typeFilter" :options="typeOptions" :label="t('资源类型')" :placeholder="t('全部资源类型')" @update:model-value="(value) => changeType(value as string)" />
          </div>
          <div class="rs-filter">
            <Select
              v-model="projectFilter"
              :options="projectOptions"
              :label="t('交付项目')"
              :placeholder="t('全部项目')"
              searchable
            />
          </div>
        </template>
        <template v-if="ccmaxVisible">
          <div v-if="supplierSide || resourceType === 'CCMAX'" class="rs-filter narrow">
            <Select v-model="credentialMode" :options="credentialOptions" :label="t('凭据方式')" :placeholder="t('全部凭据方式')" />
          </div>
          <div class="rs-filter narrow">
            <Select v-model="deliveryState" :options="deliveryFilters" :label="t('交付状态')" :placeholder="t('全部交付状态')" />
          </div>
          <div class="rs-filter narrow">
            <Select v-model="operationalStatus" :options="laneOptions" :label="t('资源状态')" :placeholder="t('全部资源状态')" />
          </div>
          <div class="rs-filter">
            <Select
              v-model="failureReason"
              :options="reasonOptions"
              :label="t('失效原因')"
              :placeholder="t('全部失效原因')"
              searchable
              :search-placeholder="t('搜索失效原因')"
              :disabled="failureReasons.loading.value || !!failureReasons.error.value"
            />
          </div>
        </template>
        <template v-if="!supplierSide && resourceType === 'NEWAPI_INTAKE'">
          <div class="rs-filter narrow">
            <Select v-model="newApiDeliveryState" :options="importOptions" :label="t('交付状态')" :placeholder="t('全部交付状态')" />
          </div>
          <div class="rs-filter narrow">
            <Select v-model="newApiResourceState" :options="creationOptions" :label="t('资源状态')" :placeholder="t('全部资源状态')" />
          </div>
        </template>
        <div class="rs-filter date">
          <DateRangePicker :label="t('创建日期')" :from="createdFrom" :to="createdTo" @change="(from, to) => { createdFrom = from; createdTo = to; }" />
        </div>
        <Button variant="ghost" size="sm" class="rs-reset" @click="resetFilters">{{ t('重置筛选') }}</Button>
      </div>

      <div v-if="filterOptions.error.value" class="rs-filter-error" role="alert">
        <span>{{ t('供应商／创建人选项加载失败：') }}{{ filterOptions.error.value }}</span>
        <Button size="sm" @click="session.refresh()">{{ t('重试筛选选项') }}</Button>
      </div>
      <div v-if="ccmaxVisible && failureReasons.error.value" class="rs-filter-error" role="alert">
        <span>{{ t('失效原因选项加载失败：') }}{{ failureReasons.error.value }}</span>
        <Button size="sm" @click="session.refresh()">{{ t('重试失效原因') }}</Button>
      </div>
      <p v-if="draftWindowHint" class="rs-hint"><Icon name="info" :size="14" />{{ t('两天前创建的草稿默认不显示。选择「草稿」，或用搜索、创建日期可以查出来。') }}</p>

      <div v-if="appliedFilters.length || ccmaxVisible" class="rs-footer">
        <div class="rs-chips" :aria-label="t('已应用的筛选')">
          <template v-if="appliedFilters.length">
            <span class="rs-muted">{{ t('已筛选 ') }}{{ appliedFilters.length }}{{ t(' 项') }}</span>
            <span v-for="(filter, index) in appliedFilters" :key="`${index}-${filter.label}`" class="rs-chip">
              <span :title="t('{0}：{1}', [filter.label, filter.value])">{{ filter.label }}{{ t('：') }}{{ filter.value }}</span>
              <button type="button" :aria-label="t('清除{0}筛选', [filter.label])" @click="filter.clear()"><Icon name="close" :size="12" /></button>
            </span>
          </template>
        </div>
        <div v-if="ccmaxVisible" class="rs-bulk">
          <template v-if="lifecycle.may.value">
            <template v-if="lifecycle.maySelect.value && lifecycle.mayPause.value">
              <Button
                size="sm"
                :disabled="lifecycle.busy.value || !!lifecycle.pending.value || !lifecycleBatch.eligible.length || lifecycleBatch.mixed"
                :title="lifecycleBatch.mixed ? t('请选择启停状态相同的资源') : undefined"
                @click="lifecycleBatch.mixed || lifecycle.run(lifecycleBatch.allPaused ? 'RESUME' : 'PAUSE', lifecycleBatch.eligible)"
              >{{ lifecycleBatch.mixed ? t('批量启停') : lifecycleBatch.allPaused ? t('批量恢复') : t('批量停用') }}</Button>
              <span v-if="lifecycleBatch.mixed" class="rs-muted" role="status">{{ t('请选择启停状态相同的资源') }}</span>
            </template>
            <Button
              v-if="lifecycle.maySelect.value && lifecycle.mayRemove.value"
              size="sm"
              :disabled="lifecycle.busy.value || !!lifecycle.pending.value || !lifecycleBatch.eligible.length"
              aria-haspopup="dialog"
              :aria-expanded="lifecycle.confirmation.value?.key === 'batch'"
              @click="(event: MouseEvent) => lifecycle.askRemove(event.currentTarget as HTMLElement, lifecycleBatch.eligible, 'batch')"
            >{{ t('批量移除') }}</Button>
            <Button v-if="lifecycle.mayRecords.value" size="sm" :disabled="lifecycle.busy.value" @click="lifecycle.openRecords()">{{ t('启停与移除记录') }}</Button>
            <Button v-if="lifecycle.pending.value" size="sm" :disabled="lifecycle.busy.value" @click="lifecycle.queryPending()">
              {{ lifecycle.busy.value ? t('查询中…') : t('查询原维护结果') }}
            </Button>
          </template>
          <Button v-if="intakeReviewer" size="sm" @click="intakeReview = true">{{ t('核对上号计数') }}</Button>
          <Button
            v-if="mayReplaceProxy"
            size="sm"
            :disabled="batchReplaceBlocked"
            :title="selectedRows.some(isNewApi) ? t('New API 渠道不支持替换代理') : undefined"
            @click="replacing = selectedRows"
          >{{ t('批量替换代理') }}{{ selected.size ? t('（{0}）', [selected.size]) : '' }}</Button>
          <Button v-if="supportsProxy" size="sm" @click="replacementHistory = true">{{ t('更换记录') }}</Button>
        </div>
      </div>
      <div v-if="ccmaxVisible && lifecycle.may.value && lifecycle.result.value" class="rs-lifecycle-result" :class="{ failed: lifecycle.result.value.failed }" :role="lifecycle.result.value.failed ? 'alert' : 'status'">
        <span>{{ lifecycle.result.value.text }}</span>
        <Button
          v-if="lifecycle.result.value.receipt?.id"
          size="sm"
          :disabled="lifecycle.busy.value"
          @click="lifecycle.openProgress(lifecycle.result.value.receipt.id)"
        >{{ t('查看原操作') }}</Button>
      </div>

      <Notice v-if="projectData.error.value" tone="danger" class="rs-inline-notice">{{ t('项目名称加载失败：') }}{{ projectData.error.value }}</Notice>

      <section v-if="showCreators && ccmaxVisible" id="creator-summary" class="rs-creators" :aria-label="t('创建人归类汇总')">
        <div class="rs-creators-head">
          <h2>{{ t('创建人归类汇总') }}</h2>
          <span>{{ t('按当前筛选统计 CCMAX 资源') }}</span>
        </div>
        <DataTable
          :columns="[{ key: 'creator', label: t('创建人') }, { key: 'count', label: t('资源总数'), align: 'right' }, { key: 'amount', label: t('消费金额'), align: 'right' }]"
          :rows="creatorSummary.loading.value ? [] : creatorSummary.data.value ?? []"
          :row-key="(row: CreatorRow) => `${row.creatorUsername ?? ''}:${row.creatorName}`"
          :loading="creatorSummary.loading.value"
          :error="creatorSummary.error.value"
          :label="t('创建人归类汇总')"
          @retry="creatorSummary.reload()"
        >
          <template #cell-creator="{ row }">
            <div class="rs-person">
              <strong>{{ row.creatorName }}</strong>
              <span v-if="row.creatorUsername && row.creatorUsername !== row.creatorName">{{ row.creatorUsername }}</span>
            </div>
          </template>
          <template #cell-count="{ row }"><span class="rs-num">{{ t('{0} 条', [count(row.resourceCount)]) }}</span></template>
          <template #cell-amount="{ row }">
            <div v-if="row.amountResourceCount" class="rs-person rs-num">
              <strong>{{ formatMoney(row.consumptionAmountUsd) }} USD</strong>
              <span>{{ count(row.amountResourceCount) }}{{ t(' 条资源计入') }}</span>
            </div>
            <span v-else class="rs-muted">{{ t('暂无消费金额') }}</span>
          </template>
        </DataTable>
      </section>

      <ResourceTable
        v-model:selected="selected"
        :rows="rows"
        :loading="list.loading.value"
        :refreshing="list.refreshing.value"
        :error="list.error.value"
        :page-size="size"
        :supplier-side="supplierSide"
        :pending-only="pendingOnly"
        :resource-type="resourceType"
        :ccmax-visible="ccmaxVisible"
        :may-replace="mayReplaceProxy || intakeReviewer || lifecycle.maySelect.value"
        :project-names="projectNames"
        @open="openRow"
        @retry="list.reload()"
      >
        <template #actions="{ row }">
          <Button v-if="isNativeCcmax(row)" size="sm" @click="detail = row">{{ t('CCMAX 账号详情') }}</Button>
          <Button v-else-if="isNewApi(row)" size="sm" @click="detail = row">{{ t('渠道详情') }}</Button>
          <template v-else-if="row.readOnly">
            <button v-if="!isIntake(row) && mayRefreshUsage(row)" type="button" class="rs-link" :title="t('查询账号状态和用量')" :disabled="syncing.has(row.id)" @click="refreshUsage(row)">
              <Icon name="refresh" :size="12" />{{ syncing.has(row.id) ? t('同步中…') : t('同步') }}
            </button>
          </template>
          <template v-else-if="isIntake(row)">
            <Button v-if="mayAssign(row)" size="sm" @click="assigning = row">{{ t('分配项目') }}</Button>
            <Button size="sm" @click="intakeDetail = row">{{ t('查看') }}</Button>
          </template>
          <template v-else>
            <button v-if="mayRefreshUsage(row)" type="button" class="rs-link" :title="t('查询账号状态和用量')" :disabled="syncing.has(row.id)" @click="refreshUsage(row)">
              <Icon name="refresh" :size="12" />{{ syncing.has(row.id) ? t('同步中…') : t('同步') }}
            </button>
            <template v-if="lifecycle.rowEligible(row)">
              <button
                v-if="lifecycle.mayPause.value"
                type="button"
                class="rs-link"
                :disabled="lifecycle.busy.value || !!lifecycle.pending.value"
                @click="lifecycle.run(pausedResource(row) ? 'RESUME' : 'PAUSE', [row])"
              >{{ pausedResource(row) ? t('恢复') : t('停用') }}</button>
              <button
                v-if="lifecycle.mayRemove.value"
                type="button"
                class="rs-link"
                :disabled="lifecycle.busy.value || !!lifecycle.pending.value"
                aria-haspopup="dialog"
                :aria-expanded="lifecycle.confirmation.value?.key === `row:${row.id}`"
                @click="(event: MouseEvent) => lifecycle.askRemove(event.currentTarget as HTMLElement, [row], `row:${row.id}`)"
              >{{ t('移除') }}</button>
            </template>
            <button v-if="mayReplaceProxy && proxyReplaceable(row)" type="button" class="rs-link" @click="replacing = [row]">{{ t('更换代理') }}</button>
            <button v-if="canReauthorize(row, supplierSide, has)" type="button" class="rs-link" @click="openCredentialDialog(row, false)">{{ t('重新授权') }}</button>
            <template v-if="canManualRecover(row, supplierSide, has)">
              <button v-if="supplierSide" type="button" class="rs-link" @click="askRecovery(row, 'EDIT')">{{ t('编辑') }}</button>
              <button type="button" class="rs-link danger" @click="askRecovery(row, 'DELETE')">{{ t('删除') }}</button>
            </template>
            <button v-if="canOauthRetry(row, supplierSide, has)" type="button" class="rs-link" :disabled="editingId !== null" @click="editDraft(row)">
              {{ editingId === row.id ? t('加载中…') : t('重新授权') }}
            </button>
            <button
              v-if="canReauthorize(row, supplierSide, has)"
              type="button"
              class="rs-link"
              :aria-label="t('强制刷新授权')"
              :title="t('强制刷新授权：使用已保存的 Refresh Token 刷新凭据')"
              @click="openCredentialDialog(row, true)"
            ><Icon name="refresh" :size="12" />{{ t('强制刷新') }}</button>
            <button
              v-if="canEditDraft(row, supplierSide, has) && !canOauthRetry(row, supplierSide, has)"
              type="button"
              class="rs-link"
              :disabled="editingId !== null"
              @click="editDraft(row)"
            >{{ editingId === row.id ? t('加载中…') : row.credentialMode === 'OAUTH' && row.dispatchFailureReason ? t('重新授权') : t('编辑') }}</button>
            <button v-if="canRemove(row, supplierSide, has)" type="button" class="rs-link danger" :disabled="deleteBusy" @click="askDelete(row)">{{ t('删除') }}</button>
          </template>
        </template>
      </ResourceTable>
      <Pagination v-model:page="page" v-model:size="size" :total="list.error.value ? 0 : list.data.value?.total ?? 0" :loading="list.loading.value" />
    </section>

    <!-- Lifecycle -->
    <template v-if="lifecycle.mayRecords.value">
      <RemoveConfirm
        v-if="lifecycle.confirmation.value"
        :key="lifecycle.confirmation.value.key"
        :anchor="lifecycle.confirmation.value.anchor"
        :subject="confirmSubject"
        :busy="lifecycle.busy.value"
        @cancel="lifecycle.cancelRemove()"
        @confirm="lifecycle.confirmRemove()"
      />
      <ResourceLifecycleDialog
        v-if="lifecycle.dialog.value"
        :key="lifecycle.dialog.value.mode === 'progress' ? lifecycle.dialog.value.id : 'records'"
        :state="lifecycle.dialog.value"
        @close="closeLifecycleDialog"
        @open="lifecycle.openProgress"
        @changed="session.refresh()"
      />
    </template>

    <IntakeReviewDialog v-if="intakeReview" @close="intakeReview = false" />
    <IntakeAssignDialog
      v-if="assigning"
      :resource="assigning"
      @close="assigning = null"
      @assigned="() => { assigning = null; session.notify(t('项目分配成功，资源已移入交付列表和资源列表')); session.refresh(); }"
    />
    <IntakeDetailDialog
      v-if="intakeDetail"
      :resource="intakeDetail"
      :assignable="mayAssign(intakeDetail)"
      @close="intakeDetail = null"
      @assign="() => { assigning = intakeDetail; intakeDetail = null; }"
    />

    <!-- Proxy replacement -->
    <ProxyReplacementDialog
      v-if="replacing"
      :resources="replacing"
      @close="replacing = null"
      @created="(id) => { replacing = null; clearSelection(); replacementProgress = id; session.refresh(); }"
    />
    <ProxyReplacementHistoryDialog v-if="replacementHistory" @close="replacementHistory = false" @open="(id) => { replacementHistory = false; replacementProgress = id; }" />
    <ProxyReplacementProgressDrawer
      v-if="replacementProgress"
      :id="replacementProgress"
      :key="replacementProgress"
      @close="() => { replacementProgress = null; session.refresh(); }"
      @completed="session.refresh()"
    />

    <!-- Delivery forms and details -->
    <ResourceFormDialog
      v-if="form"
      :resource="form"
      :prefill="prefill"
      :on-api-delivery="() => { form = null; emit('apiDelivery'); }"
      @close="closeForm"
      @saved="session.refresh()"
    />
    <Dialog v-if="recovery" :title="recovery.action === 'EDIT' ? t('核对后编辑') : t('核对后删除')" @close="() => { if (!recoveryBusy) recovery = null; }">
      <div class="rs-dialog-body">
        <p>{{ recovery.resource.name }}</p>
        <Notice tone="warning">{{ t('本次交付结果尚未确认。请先在CCMAX核实没有创建成功；已有账号或无法确认时，请勿继续，以免重复交付或遗漏账号。') }}</Notice>
        <label class="rs-check">
          <input v-model="recoveryChecked" type="checkbox" :disabled="recoveryBusy">
          {{ t('我已核实CCMAX未创建该资源，确认本次交付失败') }}
        </label>
        <Notice v-if="recoveryError" tone="danger">{{ recoveryError }}</Notice>
      </div>
      <template #footer>
        <Button :disabled="recoveryBusy" @click="recovery = null">{{ t('取消') }}</Button>
        <Button :variant="recovery.action === 'DELETE' ? 'danger' : 'primary'" :disabled="!recoveryChecked || recoveryBusy" @click="confirmRecovery">
          {{ recoveryBusy ? t('处理中…') : recovery.action === 'EDIT' ? t('确认并编辑') : t('确认并删除') }}
        </Button>
      </template>
    </Dialog>
    <Dialog v-if="deleting" :title="t('删除资源')" size="sm" @close="() => { if (!deleteBusy) deleting = null; }">
      <div class="rs-dialog-body">
        <p>{{ deleting.name }}{{ t('：标记删除并从列表隐藏，记录保留。') }}</p>
        <Notice v-if="deleteError" tone="danger">{{ deleteError }}</Notice>
      </div>
      <template #footer>
        <Button :disabled="deleteBusy" @click="deleting = null">{{ t('取消') }}</Button>
        <Button variant="danger" :disabled="deleteBusy" @click="confirmDelete">{{ deleteBusy ? t('标记中…') : t('确认删除') }}</Button>
      </template>
    </Dialog>

    <NativeCcmaxLinkDialog v-if="linkNative" @close="linkNative = false" @linked="(resource) => linked(t('CCMAX 账号关联成功'), resource)" />
    <NewApiLinkDialog v-if="linkChannel" @close="linkChannel = false" @linked="(resource) => linked(t('渠道关联成功'), resource)" />
    <template v-if="detail">
      <NativeCcmaxDialog v-if="isNativeCcmax(detail)" :key="`native-${detail.id}`" :resource="detail" @close="detail = null" @changed="session.refresh()" />
      <NewApiChannelDialog v-else-if="isNewApi(detail)" :key="`channel-${detail.id}`" :resource="detail" @close="detail = null" @changed="session.refresh()" />
      <ResourceDetailDrawer
        v-else
        :key="detail.id"
        :resource="detail"
        :supplier-side="supplierSide"
        @close="detail = null"
        @edit="(resource) => { form = resource; detail = null; }"
        @reauthorize="(resource) => openCredentialDialog(resource, false, true)"
        @refresh-credential="(resource) => openCredentialDialog(resource, true, true)"
        @recover="(resource, action) => { detail = null; askRecovery(resource, action); }"
        @changed="() => { session.refresh(); detail = null; }"
      />
    </template>
    <CredentialRefreshDialog
      v-if="credentialRefresh"
      :resource="credentialRefresh"
      @close="closeCredentialDialogs"
      @changed="afterAuthorization(credentialRefresh.id)"
      @reauthorize="switchToReauthorization"
    />
    <ReauthorizationDialog
      v-if="reauthorization"
      :key="reauthorization.id"
      :resource="reauthorization"
      @close="closeCredentialDialogs"
      @changed="afterAuthorization(reauthorization.id)"
    />
  </div>
</template>

<style scoped>
.rs-page { display: grid; gap: 14px; }
.rs-card { background: var(--hs-surface); border: 1px solid var(--hs-border); border-radius: var(--hs-radius-card); box-shadow: var(--hs-shadow-card); overflow: hidden; }
.rs-state { display: grid; place-items: center; padding: 24px; color: var(--hs-text-3); }
.rs-muted { color: var(--hs-text-3); font-size: var(--hs-text-xs); }
.rs-num { font-variant-numeric: tabular-nums; }

.rs-summary { display: grid; gap: 12px; padding: 16px; }
.rs-summary h2, .rs-creators-head h2 { margin: 0; font-size: var(--hs-text-md); font-weight: 600; }
.rs-summary-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(240px, 1fr)); gap: 10px; }
.rs-summary-card { display: grid; gap: 8px; padding: 12px 14px; background: var(--hs-surface-subtle); border: 1px solid var(--hs-border); border-radius: 12px; }
.rs-summary-category { color: var(--hs-text); font-weight: 600; }
.rs-summary-amounts { display: grid; gap: 6px; }
.rs-summary-amount { display: grid; grid-template-columns: auto 1fr; column-gap: 8px; font-size: var(--hs-text-xs); color: var(--hs-text-3); }
.rs-summary-amount strong { grid-row: span 2; justify-self: end; align-self: center; color: var(--hs-text); font-size: var(--hs-text-sm); font-variant-numeric: tabular-nums; }
.rs-summary-empty { margin: 0; }

.rs-toolbar { display: flex; flex-wrap: wrap; align-items: center; gap: 8px; padding: 14px 16px 10px; }
.rs-grow { flex: 1 1 240px; }
.rs-filter { flex: 0 1 190px; min-width: 150px; }
.rs-filter.narrow { flex-basis: 150px; min-width: 128px; }
.rs-filter.date { flex: 0 1 260px; min-width: 220px; }
.rs-reset { margin-left: auto; }
.rs-filter-error { display: flex; flex-wrap: wrap; align-items: center; gap: 8px; margin: 0 16px 8px; color: var(--hs-danger); font-size: var(--hs-text-xs); }
.rs-hint { display: flex; align-items: center; gap: 6px; margin: 0; padding: 0 16px 10px; color: var(--hs-text-3); font-size: var(--hs-text-xs); }
.rs-footer { display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: 8px; padding: 0 16px 12px; }
.rs-chips { display: flex; flex-wrap: wrap; align-items: center; gap: 6px; min-height: 28px; }
.rs-chip { display: inline-flex; align-items: center; gap: 4px; max-width: 280px; padding: 2px 4px 2px 10px; color: var(--hs-text-2); background: var(--hs-surface-subtle); border: 1px solid var(--hs-border); border-radius: 999px; font-size: var(--hs-text-xs); }
.rs-chip > span { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.rs-chip button { display: grid; place-items: center; width: 18px; height: 18px; padding: 0; color: var(--hs-text-3); background: none; border: 0; border-radius: 50%; cursor: pointer; }
.rs-chip button:hover { color: var(--hs-text); background: var(--hs-surface-hover); }
.rs-bulk { display: flex; flex-wrap: wrap; align-items: center; gap: 6px; margin-left: auto; }
.rs-lifecycle-result { display: flex; flex-wrap: wrap; align-items: center; gap: 8px; margin: 0 16px 12px; padding: 8px 12px; color: var(--hs-text-2); background: var(--hs-surface-subtle); border-radius: 10px; font-size: var(--hs-text-xs); }
.rs-lifecycle-result.failed { color: var(--hs-danger); background: var(--hs-danger-soft); }
.rs-inline-notice { margin: 0 16px 12px; }

.rs-creators { display: grid; gap: 10px; padding: 0 16px 14px; }
.rs-creators-head { display: flex; flex-wrap: wrap; align-items: baseline; gap: 10px; }
.rs-creators-head span { color: var(--hs-text-3); font-size: var(--hs-text-xs); }
.rs-person { display: grid; gap: 2px; }
.rs-person span { color: var(--hs-text-3); font-size: var(--hs-text-xs); }

.rs-link {
  display: inline-flex; align-items: center; gap: 3px; min-height: 26px; padding: 0 6px; color: var(--hs-text-2);
  background: none; border: 0; border-radius: var(--hs-radius-small); font: inherit; font-size: var(--hs-text-xs); white-space: nowrap; cursor: pointer;
}
.rs-link:hover:not(:disabled) { color: var(--hs-text); background: var(--hs-surface-hover); }
.rs-link:disabled { opacity: .5; cursor: not-allowed; }
.rs-link.danger { color: var(--hs-danger); }
.rs-dialog-body { display: grid; gap: 12px; }
.rs-dialog-body p { margin: 0; }
.rs-check { display: flex; align-items: flex-start; gap: 8px; font-size: var(--hs-text-sm); }
.rs-check input { margin-top: 3px; }
</style>
