<script setup lang="ts">
// Page-header actions on every settlement tab (platform only): record a manual
// payable source, create one settlement through a server preview, or create a
// batch. A generated settlement is handed to the page to open its drawer.
import { computed, ref } from 'vue';
import Button from '../../../components/ui/Button.vue';
import ReceiveAmountDialog from '../ledger/ReceiveAmountDialog.vue';
import NewSettlementDialog from './NewSettlementDialog.vue';
import SettlementPreviewDialog from './SettlementPreviewDialog.vue';
import SettlementBatchDialog from './SettlementBatchDialog.vue';
import { apiPost } from '../../../lib/api';
import { t } from '../../../lib/i18n';
import { useSessionStore } from '../../../stores/session';
import type { NewSettlementValues, PreviewDocument, SettlementRequest } from '../settlements';

const emit = defineEmits<{ settlement: [id: string] }>();

const session = useSessionStore();
const platform = computed(() => !session.user?.supplierId);
const canCreate = computed(() => platform.value && session.has('settlement.create'));

const dialog = ref<'receive' | 'new' | 'batch' | null>(null);
// The single form keeps its values (and request key) until a settlement is generated.
const saved = ref<NewSettlementValues | null>(null);
const preview = ref<{ document: PreviewDocument; request: SettlementRequest } | null>(null);

function previewed(document: PreviewDocument, request: SettlementRequest, values: NewSettlementValues) {
  saved.value = values;
  preview.value = { document, request };
  dialog.value = null;
}
const loadPage = (page: number, size: number) => apiPost<PreviewDocument>(`/settlements/preview?page=${page}&size=${size}`, preview.value!.request);
async function generate() {
  const created = await apiPost<{ id: string }>('/settlements', preview.value!.request);
  preview.value = null;
  saved.value = null;
  session.refresh();
  session.notify(t('已发起结算，等待供应商确认金额'));
  emit('settlement', created.id);
}
function back() {
  preview.value = null;
  dialog.value = 'new';
}
</script>

<template>
  <template v-if="platform">
    <Button v-if="session.has('usage.import')" icon="plus" @click="dialog = 'receive'">{{ t('录入应付依据') }}</Button>
    <Button v-if="canCreate" @click="dialog = 'new'">{{ t('单张新建') }}</Button>
    <Button v-if="canCreate" variant="primary" icon="plus" @click="dialog = 'batch'">{{ t('批量新建结算单') }}</Button>
  </template>

  <ReceiveAmountDialog v-if="dialog === 'receive'" @close="dialog = null" />
  <NewSettlementDialog v-if="dialog === 'new'" :initial="saved" @preview="previewed" @close="dialog = null" />
  <SettlementPreviewDialog
    v-if="preview"
    :initial-document="preview.document"
    :load-page="loadPage"
    :confirm="generate"
    can-go-back
    @back="back"
    @close="preview = null"
  />
  <SettlementBatchDialog v-if="dialog === 'batch' && canCreate" @close="dialog = null" @settlement="emit('settlement', $event)" />
</template>
