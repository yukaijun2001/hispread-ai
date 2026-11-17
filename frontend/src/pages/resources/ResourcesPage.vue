<script setup lang="ts">
// Routes `deliveries` / `deliveries-pending` (supplier side) and `resources` /
// `resources-pending` (platform). The list is rebuilt per route; this wrapper
// owns the NewAPI delivery dialog and the CCMAX form it can switch to.
import { computed, ref } from 'vue';
import { useSessionStore } from '../../stores/session';
import ResourceListView from './ResourceListView.vue';
import NewDeliveryDialog from './forms/NewDeliveryDialog.vue';
import ResourceFormDialog from './forms/ResourceFormDialog.vue';

const props = defineProps<{ route: string }>();

const session = useSessionStore();
const supplierSide = computed(() => props.route.startsWith('deliveries'));
const pendingOnly = computed(() => props.route.endsWith('-pending'));
const newDelivery = ref(false);
const ccmaxForm = ref(false);

function switchToCcmax() { newDelivery.value = false; ccmaxForm.value = true; }
function switchToApi() { ccmaxForm.value = false; newDelivery.value = true; }
</script>

<template>
  <ResourceListView :key="route" :supplier-side="supplierSide" :pending-only="pendingOnly" @api-delivery="newDelivery = true" />
  <NewDeliveryDialog
    v-if="newDelivery"
    :on-ccmax="supplierSide ? switchToCcmax : undefined"
    @close="newDelivery = false"
    @saved="() => { newDelivery = false; session.refresh(); }"
  />
  <ResourceFormDialog
    v-if="ccmaxForm"
    resource="new"
    :prefill="null"
    :on-api-delivery="switchToApi"
    @close="ccmaxForm = false"
    @saved="session.refresh()"
  />
</template>
