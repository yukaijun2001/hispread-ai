<script setup lang="ts">
// #/settlements — one page per `?tab=` (each tab is its own sidebar item, so
// there is no tab bar). Department bills and supplier agents only get the bill
// view; every other tab shares the create actions and the settlement drawer,
// which `?id=` opens on any tab except payments.
import { computed, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import PageHeader from '../../components/ui/PageHeader.vue';
import ForbiddenView from '../../shell/ForbiddenView.vue';
import SupplierBillsTab from './ledger/SupplierBillsTab.vue';
import DailyAccountingTab from './ledger/DailyAccountingTab.vue';
import InputsTab from './ledger/InputsTab.vue';
import RatesTab from './ledger/RatesTab.vue';
import StatementsTab from './statements/StatementsTab.vue';
import SettlementCreateActions from './statements/SettlementCreateActions.vue';
import SettlementDetailDrawer from './statements/SettlementDetailDrawer.vue';
import PaymentsTab from './payments/PaymentsTab.vue';
import { resolveSettlementTab } from '../../navigation/access';
import { useSessionStore } from '../../stores/session';
import type { Payment } from './payments/payments';

defineProps<{ route: string }>();

const session = useSessionStore();
const current = useRoute();
const router = useRouter();
const user = computed(() => session.user!);
const supplierSide = computed(() => !!user.value.supplierId);

const tab = computed(() => resolveSettlementTab(user.value, String(current.query.tab ?? '')));
const billsOnly = computed(() => tab.value?.id === 'departments' || (supplierSide.value && user.value.role === 'SUPPLIER_AGENT'));

// --- Settlement drawer ------------------------------------------------------------
const detailId = ref<string | null>(null);
const linkedId = computed(() => (tab.value && !billsOnly.value && tab.value.id !== 'payments' && session.has('settlement.read') ? String(current.query.id ?? '') : ''));
watch(linkedId, (id) => { if (id) detailId.value = id; }, { immediate: true });

function paymentCreated(payment: Payment) {
  detailId.value = null;
  if (session.has('payment.read')) router.push({ path: '/settlements', query: { tab: 'payments', id: payment.id, settlementId: payment.settlementId } });
}
</script>

<template>
  <div class="stl-page">
    <ForbiddenView v-if="!tab" />
    <template v-else>
      <PageHeader :title="tab.label">
        <template v-if="!billsOnly && !supplierSide" #actions>
          <SettlementCreateActions @settlement="detailId = $event" />
        </template>
      </PageHeader>

      <SupplierBillsTab v-if="tab.id === 'departments'" key="departments" department-view />
      <SupplierBillsTab v-else-if="billsOnly" key="daily" />
      <template v-else>
        <template v-if="tab.id === 'daily'">
          <SupplierBillsTab v-if="supplierSide && session.has('settlement.read')" key="supplier-daily" />
          <DailyAccountingTab v-else-if="!supplierSide && session.has('usage.read')" />
        </template>
        <StatementsTab v-else-if="tab.id === 'statements'" @open="detailId = $event" />
        <InputsTab v-else-if="tab.id === 'inputs' && !supplierSide && session.has('usage.read')" />
        <PaymentsTab v-else-if="tab.id === 'payments' && session.has('payment.read')" :settlement-id="String(current.query.settlementId ?? '')" />
        <RatesTab v-else-if="tab.id === 'rates' && session.has('exchange_rate.read')" />

        <SettlementDetailDrawer v-if="detailId" :key="detailId" :id="detailId" @payment="paymentCreated" @close="detailId = null" />
      </template>
    </template>
  </div>
</template>

<style scoped>
.stl-page { min-width: 0; }
</style>
