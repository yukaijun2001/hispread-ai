<script setup lang="ts">
// Platform list of supplier payout accounts (`supplier-accounts`) and the
// recipient summary (`payout-recipients`, which defaults to approved accounts).
import { computed, ref, watch } from 'vue';
import { useRouter } from 'vue-router';
import PageHeader from '../../components/ui/PageHeader.vue';
import Avatar from '../../components/ui/Avatar.vue';
import Button from '../../components/ui/Button.vue';
import DataTable from '../../components/ui/DataTable.vue';
import IconButton from '../../components/ui/IconButton.vue';
import Notice from '../../components/ui/Notice.vue';
import Pagination from '../../components/ui/Pagination.vue';
import SearchInput from '../../components/ui/SearchInput.vue';
import Select from '../../components/ui/Select.vue';
import StatusBadge from '../../components/ui/StatusBadge.vue';
import SupplierAccountsNumber from './SupplierAccountsNumber.vue';
import { useApiData } from '../../composables/useApiData';
import { useSupplierDirectory } from '../../composables/useSupplierDirectory';
import { t } from '../../lib/i18n';
import { CURRENCIES, payoutProviderLabel } from '../../lib/labels';
import { formatDateTime } from '../../lib/money';
import { useSessionStore } from '../../stores/session';
import { transferLabel, walletLabel, type PlatformAccount } from './supplierAccounts';

const props = defineProps<{ route: string }>();
const session = useSessionStore();
const router = useRouter();
const recipients = computed(() => props.route === 'payout-recipients');
const canReadSuppliers = computed(() => session.has('supplier.read'));

const search = ref('');
const supplierId = ref('');
const accountType = ref('');
const currency = ref('');
const state = ref(recipients.value ? 'APPROVED' : '');
const page = ref(1);
const size = ref(10);
watch([search, supplierId, accountType, currency, state], () => { page.value = 1; });

const query = computed(() => new URLSearchParams({
  search: search.value, supplierId: supplierId.value, accountType: accountType.value, currency: currency.value,
  state: state.value, page: String(page.value), size: String(size.value),
}).toString());
const list = useApiData<{ items: PlatformAccount[]; total: number }>(() => `/accounts/platform?${query.value}`);
const directory = useSupplierDirectory(canReadSuppliers);

const supplierLabel = t('供应商筛选');
const supplierOptions = computed(() => {
  const items = (directory.items.value ?? []).map((s) => ({ value: s.id, label: s.name, detail: s.code }));
  const known = !supplierId.value || items.some((option) => option.value === supplierId.value);
  return [
    { value: '', label: t('全部供应商') },
    ...items,
    ...(known ? [] : [{ value: supplierId.value, label: t('已选{0}', [supplierLabel]) }]),
  ];
});
const supplierPlaceholder = computed(() => (directory.loading.value ? t('{0}加载中…', [supplierLabel])
  : directory.error.value ? t('{0}加载失败', [supplierLabel]) : t('全部供应商')));
const accountTypeOptions = [
  { value: '', label: t('全部账户类型') },
  { value: 'AIRWALLEX', label: t('空中云汇') },
  { value: 'OKX_USDT', label: t('OKX 欧意') },
  { value: 'BINANCE_USDT', label: t('Binance 币安') },
  { value: 'LEGACY_BANK', label: t('历史银行账户') },
];
const currencyOptions = [{ value: '', label: t('全部币种') }, ...CURRENCIES.map((value) => ({ value, label: value }))];
const stateOptions = [
  { value: '', label: t('全部状态') },
  { value: 'APPROVED', label: t('生效中') },
  { value: 'PENDING', label: t('待审核') },
  { value: 'REJECTED', label: t('已退回') },
  { value: 'SUPERSEDED', label: t('已替换') },
];

const columns = [
  { key: 'supplier', label: t('供应商') },
  { key: 'type', label: t('账户类型 / 转账方式') },
  { key: 'number', label: t('收款人 / 账户') },
  { key: 'currency', label: t('币种'), width: '80px' },
  { key: 'state', label: t('状态'), width: '104px' },
  { key: 'createdAt', label: t('提交时间'), width: '120px', nowrap: true },
  { key: 'actions', label: t('操作'), width: '112px', nowrap: true },
];
const rows = computed(() => list.data.value?.items ?? []);
const rowIndex = (account: PlatformAccount) => rows.value.indexOf(account);
</script>

<template>
  <div class="sa-page">
    <PageHeader :title="recipients ? t('收款人汇总') : t('供应商收款账户')">
      <template v-if="!recipients && canReadSuppliers" #actions>
        <Button icon="arrow-left" @click="router.push('/suppliers')">{{ t('返回供应商列表') }}</Button>
      </template>
    </PageHeader>

    <section class="sa-card">
      <p v-if="recipients" class="sa-note">{{ t('汇总供应商维护的收款账户，默认展示生效中的账户；待审核、已退回和已替换记录可通过状态筛选查看。') }}</p>
      <div class="sa-toolbar">
        <SearchInput v-model="search" class="sa-grow" :placeholder="t('搜索供应商、户名、机构或尾号')" :label="t('搜索供应商、户名、机构或尾号')" />
        <div v-if="canReadSuppliers" class="sa-filter">
          <Select v-model="supplierId" :options="supplierOptions" :label="supplierLabel" :placeholder="supplierPlaceholder" icon="users"
            searchable :search-placeholder="t('搜索供应商名称或编码')" :disabled="directory.loading.value && !supplierId" />
        </div>
        <div class="sa-narrow"><Select v-model="accountType" :options="accountTypeOptions" :label="t('账户类型筛选')" :placeholder="t('全部账户类型')" /></div>
        <div class="sa-narrow"><Select v-model="currency" :options="currencyOptions" :label="t('收款币种筛选')" :placeholder="t('全部币种')" /></div>
        <div class="sa-narrow"><Select v-model="state" :options="stateOptions" :label="t('账户状态筛选')" :placeholder="t('全部状态')" /></div>
        <div class="sa-actions">
          <IconButton icon="refresh" :label="t('刷新收款账户')" :disabled="list.loading.value" @click="session.refresh()" />
        </div>
      </div>
      <Notice v-if="directory.error.value" tone="danger" class="sa-notice">
        {{ t('供应商筛选项加载失败：') }}{{ directory.error.value }}{{ t('。可使用关键词搜索，或刷新重试。') }}
      </Notice>

      <DataTable
        :columns="columns"
        :rows="rows"
        :row-key="(account: PlatformAccount) => account.id"
        :loading="list.loading.value"
        :refreshing="list.refreshing.value"
        :error="list.error.value"
        :label="recipients ? t('收款人汇总') : t('供应商收款账户')"
        @retry="list.reload()"
      >
        <template #cell-supplier="{ row }">
          <div class="sa-identity">
            <Avatar :name="row.supplierName" :tone="rowIndex(row)" />
            <div class="sa-stack">
              <strong>{{ row.supplierName }}</strong>
              <small>{{ row.supplierCode }}</small>
            </div>
          </div>
        </template>
        <template #cell-type="{ row }">
          <div class="sa-stack">
            <strong>{{ payoutProviderLabel(row) }}</strong>
            <small>{{ transferLabel(row) }}</small>
            <small v-if="row.transferType === 'ONCHAIN' && row.walletType">{{ walletLabel(row.walletType) }}</small>
          </div>
        </template>
        <template #cell-number="{ row }">
          <SupplierAccountsNumber :key="`${row.id}:${query}:${session.epoch}`" :account="row" />
        </template>
        <template #cell-currency="{ row }"><strong class="sa-strong">{{ row.currency }}</strong></template>
        <template #cell-state="{ row }"><StatusBadge :state="row.state" :label="row.state === 'APPROVED' ? t('生效中') : undefined" /></template>
        <template #cell-createdAt="{ row }"><span class="sa-quiet">{{ formatDateTime(row.createdAt) }}</span></template>
        <template #cell-actions="{ row }">
          <button v-if="canReadSuppliers" type="button" class="sa-link" @click="router.push({ path: '/suppliers', query: { id: row.supplierId } })">{{ t('查看供应商') }}</button>
          <span v-else>—</span>
        </template>
      </DataTable>
      <Pagination v-if="!list.loading.value && !list.error.value" v-model:page="page" v-model:size="size" :total="list.data.value?.total ?? 0" />
    </section>
  </div>
</template>

<style scoped>
.sa-card { background: var(--hs-surface); border: 1px solid var(--hs-border); border-radius: var(--hs-radius-card); box-shadow: var(--hs-shadow-card); overflow: hidden; }
.sa-note { margin: 0; padding: 14px 16px 0; color: var(--hs-text-3); font-size: var(--hs-text-xs); line-height: 1.6; }
.sa-toolbar { display: flex; flex-wrap: wrap; align-items: center; gap: 8px; padding: 14px 16px; }
.sa-grow { flex: 1 1 240px; }
.sa-filter { flex: 0 1 200px; min-width: 160px; }
.sa-narrow { flex: 0 1 150px; min-width: 128px; }
.sa-actions { display: flex; align-items: center; margin-left: auto; }
.sa-notice { margin: 0 16px 12px; }
.sa-identity { display: flex; align-items: center; gap: 10px; min-width: 0; }
.sa-stack { display: grid; gap: 2px; min-width: 0; }
.sa-stack strong, .sa-strong { color: var(--hs-text); font-weight: 500; overflow-wrap: anywhere; }
.sa-stack small, .sa-quiet { color: var(--hs-text-3); font-size: var(--hs-text-xs); }
.sa-link { padding: 0; color: var(--hs-accent); background: none; border: 0; font: inherit; font-size: var(--hs-text-xs); cursor: pointer; white-space: nowrap; }
.sa-link:hover { color: var(--hs-accent-hover); text-decoration: underline; text-underline-offset: 3px; }
</style>
