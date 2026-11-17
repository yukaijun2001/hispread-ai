<script setup lang="ts">
// "我的资料" body for supplier accounts: profile, payout accounts and qualification documents.
import MySupplierProfileCard from './MySupplierProfileCard.vue';
import MySupplierAccounts from './MySupplierAccounts.vue';
import MySupplierDocuments from './MySupplierDocuments.vue';
import type { OwnSupplier } from './supplierAccounts';

defineProps<{ supplier: OwnSupplier; supplierId: string }>();
</script>

<template>
  <div class="my-supplier">
    <MySupplierProfileCard :supplier="supplier" />
    <div class="my-supplier-side">
      <MySupplierAccounts :supplier="supplier" />
      <MySupplierDocuments :supplier-id="supplierId" />
    </div>
  </div>
</template>

<style scoped>
.my-supplier { display: grid; grid-template-columns: minmax(0, 1.25fr) minmax(320px, 1fr); gap: 18px; align-items: start; }
.my-supplier-side { display: grid; gap: 18px; min-width: 0; }
@media (max-width: 1080px) { .my-supplier { grid-template-columns: minmax(0, 1fr); } }
</style>
