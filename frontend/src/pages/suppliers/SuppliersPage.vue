<script setup lang="ts">
// 供应商 (platform): searchable supplier list with review-state and owner
// filters, the supplier drawer, and create / edit forms that go to review.
// Supplier accounts see 我的资料 (their own profile, accounts and documents).
import { computed, onMounted, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import PageHeader from '../../components/ui/PageHeader.vue';
import Button from '../../components/ui/Button.vue';
import IconButton from '../../components/ui/IconButton.vue';
import Icon from '../../components/ui/Icon.vue';
import Avatar from '../../components/ui/Avatar.vue';
import Badge from '../../components/ui/Badge.vue';
import StatusBadge from '../../components/ui/StatusBadge.vue';
import SearchInput from '../../components/ui/SearchInput.vue';
import Select from '../../components/ui/Select.vue';
import DataTable from '../../components/ui/DataTable.vue';
import Pagination from '../../components/ui/Pagination.vue';
import EmptyState from '../../components/ui/EmptyState.vue';
import Spinner from '../../components/ui/Spinner.vue';
import MySupplierProfile from './MySupplierProfile.vue';
import SupplierDetail from './SupplierDetail.vue';
import SupplierFormModal from './SupplierFormModal.vue';
import CredentialDialog from './CredentialDialog.vue';
import { useApiData } from '../../composables/useApiData';
import { apiPost, apiPut } from '../../lib/api';
import { t } from '../../lib/i18n';
import { formatDateTime } from '../../lib/money';
import { useSessionStore } from '../../stores/session';
import { cycleLabel } from './suppliers';
import {
  loginAccountFields, profileFields,
  type Credential, type FormFieldSpec, type FormValues, type Supplier, type UserOption,
} from './supplierAdmin';

defineProps<{ route: string }>();

const session = useSessionStore();
const router = useRouter();
const currentRoute = useRoute();
const user = computed(() => session.user!);
const supplierSide = computed(() => !!user.value.supplierId);
const canAssignOwner = computed(() => session.has('supplier.owner.assign'));

// --- Filters ---------------------------------------------------------------------
const search = ref('');
const reviewState = ref('');
const owner = ref('');
const page = ref(1);
const size = ref(10);
const setFilter = (apply: () => void) => { apply(); page.value = 1; };

// --- Data ------------------------------------------------------------------------
const editing = ref<Supplier | 'new' | null>(null);
const detailId = ref<string | null>(null);
const credential = ref<Credential | null>(null);

const availableUsers = useApiData<UserOption[]>(() => (editing.value === 'new' && session.has('supplier.users') ? '/suppliers/available-users' : null));
const ownerCandidates = useApiData<UserOption[]>(() => (!supplierSide.value && canAssignOwner.value ? '/suppliers/owner-candidates?includeHistory=true' : null));
const list = useApiData<{ items: Supplier[]; total: number }>(() => (supplierSide.value ? null
  : `/suppliers?search=${encodeURIComponent(search.value)}&state=${reviewState.value}&owner=${canAssignOwner.value ? encodeURIComponent(owner.value) : ''}&page=${page.value}&size=${size.value}`));
const mine = useApiData<Supplier>(() => (supplierSide.value ? `/suppliers/${user.value.supplierId}` : null));

// Links such as "suppliers?id=…" open the drawer (platform only).
onMounted(() => {
  if (!supplierSide.value) detailId.value = String(currentRoute.query.id ?? '') || null;
});

function openEdit(supplier: Supplier) {
  detailId.value = null;
  editing.value = supplier;
}

// --- Options and columns -------------------------------------------------------------
const stateOptions = [
  { value: '', label: t('全部审核状态') },
  { value: 'PENDING', label: t('待审核') },
  { value: 'APPROVED', label: t('已通过') },
  { value: 'REJECTED', label: t('已退回') },
];
const ownerOptions = computed(() => [
  { value: '', label: t('全部归属') },
  { value: 'UNASSIGNED', label: t('待分配') },
  ...(ownerCandidates.data.value ?? []).map((candidate) => ({ value: candidate.id, label: t('{0}（{1}）', [candidate.displayName, candidate.username]) })),
]);
const columns = computed(() => [
  { key: 'name', label: t('供应商') },
  { key: 'supplierType', label: t('类型'), width: '84px' },
  { key: 'contact', label: t('联系人') },
  { key: 'review', label: t('资料审核'), width: '108px' },
  { key: 'enabled', label: t('合作状态'), width: '108px' },
  ...(canAssignOwner.value ? [{ key: 'ownerName', label: t('负责运营') }] : []),
  { key: 'cycle', label: t('结算周期') },
  { key: 'updatedAt', label: t('最近更新'), nowrap: true },
  { key: 'actions', label: t('操作'), width: '80px' },
]);
const rows = computed(() => list.data.value?.items ?? []);
const indexOf = (supplier: Supplier) => rows.value.indexOf(supplier);

// --- Create / edit form ----------------------------------------------------------------
const formFields = computed<FormFieldSpec[]>(() => [
  ...(editing.value === 'new' ? [
    { name: 'code', label: t('供应商代码'), full: true, placeholder: t('例如 SUP-2026-0008'), hint: t('2-30 位字母、数字、下划线或短横线；创建后仅运营可修改') },
    { name: 'supplierType', label: t('供应商类型'), type: 'select' as const, full: true, options: [{ value: 'COMPANY', label: t('企业') }, { value: 'INDIVIDUAL', label: t('个人') }] },
  ] : []),
  ...profileFields(),
  ...(editing.value === 'new' ? loginAccountFields(availableUsers.data.value ?? []) : []),
]);
const formInitial = computed<FormValues>(() => (editing.value && editing.value !== 'new'
  ? Object.fromEntries(Object.entries(editing.value).map(([key, value]) => [key, String(value ?? '')]))
  : { code: '', supplierType: 'COMPANY', country: t('中国'), cycle: 'MONTHLY', mode: 'NEW' }));

async function submitSupplier(values: FormValues) {
  const target = editing.value;
  const profile = {
    name: values.name,
    registrationNo: values.registrationNo || '',
    supplierType: values.supplierType,
    country: values.country,
    contact: values.contact,
    phone: values.phone,
    email: values.email?.trim() || '',
    cycle: values.cycle,
    customCycleDays: values.cycle === 'CUSTOM' ? Number(values.customCycleDays) : null,
    version: Number(values.version || 0),
  };
  if (target === 'new') {
    const created = await apiPost<{ account: Credential }>('/suppliers', {
      code: values.code.trim().toUpperCase(),
      profile,
      account: {
        mode: values.mode,
        userId: values.userId || null,
        username: values.username,
        displayName: values.displayName || values.contact,
        password: values.password || null,
      },
    });
    credential.value = created.account;
  } else if (target) {
    await apiPut(`/suppliers/${target.id}`, profile);
  }
  session.notify(t('资料已提交审核'));
  session.refresh();
}
</script>

<template>
  <div class="suppliers">
    <PageHeader :title="supplierSide ? t('我的资料') : t('供应商')">
      <template v-if="!supplierSide" #actions>
        <Button v-if="session.has('account.read')" icon="bank" @click="router.push('/supplier-accounts')">{{ t('收款账户') }}</Button>
        <Button v-if="session.has('supplier.write') && session.has('supplier.users')" variant="primary" icon="plus" @click="editing = 'new'">{{ t('新建供应商') }}</Button>
      </template>
    </PageHeader>

    <!-- Supplier account: own profile. -->
    <template v-if="supplierSide">
      <section v-if="mine.error.value" class="card"><EmptyState error :text="mine.error.value" /></section>
      <MySupplierProfile v-else-if="mine.data.value" :supplier="mine.data.value" :supplier-id="user.supplierId!" />
      <section v-else-if="mine.loading.value" class="card state"><Spinner :size="16" /></section>
      <section v-else class="card"><EmptyState error :text="t('暂时无法获取你的资料，请刷新重试')" /></section>
    </template>

    <!-- Platform: supplier list. -->
    <section v-else class="card">
      <div class="toolbar">
        <SearchInput :model-value="search" class="grow" :placeholder="t('搜索供应商代码、名称、联系人')" @update:model-value="setFilter(() => { search = $event; })" />
        <div class="narrow">
          <Select :model-value="reviewState" :options="stateOptions" :label="t('资料审核状态')" :placeholder="t('全部审核状态')"
            @update:model-value="setFilter(() => { reviewState = String($event); })" />
        </div>
        <div v-if="canAssignOwner" class="f-select">
          <Select :model-value="owner" :options="ownerOptions" :label="t('负责运营筛选')" :placeholder="t('全部归属')" icon="users" searchable
            @update:model-value="setFilter(() => { owner = String($event); })" />
        </div>
        <div class="toolbar-actions">
          <IconButton icon="refresh" :label="t('刷新供应商')" @click="session.refresh()" />
        </div>
      </div>
      <DataTable :columns="columns" :rows="rows" :row-key="(row: Supplier) => row.id" :loading="list.loading.value" :refreshing="list.refreshing.value"
        :error="list.error.value" :label="t('供应商')" @retry="list.reload()" @row-click="(row: Supplier) => (detailId = row.id)">
        <template #cell-name="{ row }">
          <div class="hs-identity">
            <Avatar :name="row.name" :tone="indexOf(row)" square />
            <div class="cell"><strong>{{ row.name }}</strong><small>{{ row.code }}</small></div>
          </div>
        </template>
        <template #cell-supplierType="{ row }"><Badge>{{ row.supplierType === 'INDIVIDUAL' ? t('个人') : t('企业') }}</Badge></template>
        <template #cell-contact="{ row }">
          <div class="cell"><span>{{ row.contact }}</span><small>{{ row.email || t('未填写邮箱') }}</small></div>
        </template>
        <template #cell-review="{ row }"><StatusBadge :state="row.profileReviewState || row.state" /></template>
        <template #cell-enabled="{ row }"><Badge :tone="row.enabled ? 'success' : 'neutral'" dot>{{ row.enabled ? t('启用中') : t('已停用') }}</Badge></template>
        <template #cell-ownerName="{ row }"><span :class="{ quiet: !row.ownerName }">{{ row.ownerName || t('待分配') }}</span></template>
        <template #cell-cycle="{ row }">{{ cycleLabel(row.cycle, row.customCycleDays) }}</template>
        <template #cell-updatedAt="{ row }"><span class="quiet">{{ formatDateTime(row.updatedAt) }}</span></template>
        <template #cell-actions="{ row }">
          <button type="button" class="action" @click.stop="detailId = row.id">{{ t('查看') }}<Icon name="chevron" :size="14" /></button>
        </template>
      </DataTable>
      <Pagination v-model:page="page" v-model:size="size" :total="list.data.value?.total ?? 0" :loading="list.loading.value" />
    </section>

    <SupplierDetail v-if="!supplierSide && detailId" :id="detailId" @close="detailId = null" @edit="openEdit" />
    <CredentialDialog v-if="credential" :value="credential" @close="credential = null" />
    <SupplierFormModal
      v-if="editing"
      :title="editing === 'new' ? t('新建供应商') : t('变更供应商资料')"
      :fields="formFields"
      :initial="formInitial"
      :submit-label="t('提交审核')"
      :on-submit="submitSupplier"
      @close="editing = null"
    />
  </div>
</template>

<style scoped>
.card { background: var(--hs-surface); border: 1px solid var(--hs-border); border-radius: var(--hs-radius-card); box-shadow: var(--hs-shadow-card); overflow: hidden; }
.state { display: grid; place-items: center; padding: 48px; color: var(--hs-text-3); }
.toolbar { display: flex; flex-wrap: wrap; align-items: center; gap: 8px; padding: 14px 16px; }
.grow { flex: 1 1 260px; }
.narrow { flex: 0 1 160px; min-width: 136px; }
.f-select { flex: 0 1 220px; min-width: 160px; }
.toolbar-actions { display: flex; align-items: center; gap: 2px; margin-left: auto; }
.hs-identity { display: flex; align-items: center; gap: 10px; min-width: 0; }
.cell { display: grid; gap: 2px; min-width: 0; }
.cell strong { color: var(--hs-text); font-weight: 500; overflow-wrap: anywhere; }
.cell small, .quiet { color: var(--hs-text-3); font-size: var(--hs-text-xs); }
.action { display: inline-flex; align-items: center; gap: 2px; padding: 0; color: var(--hs-accent); background: none; border: 0; font: inherit; font-size: var(--hs-text-sm); white-space: nowrap; cursor: pointer; }
.action:hover { text-decoration: underline; text-underline-offset: 3px; }
</style>
