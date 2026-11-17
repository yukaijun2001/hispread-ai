<script setup lang="ts">
// Payment drawer. The platform reviews a request (never one it created),
// cancels it or records the transfer once another reviewer has approved it;
// the supplier confirms whether the money arrived. Writes carry `version`.
import { computed, ref } from 'vue';
import Dialog from '../../../components/ui/Dialog.vue';
import Button from '../../../components/ui/Button.vue';
import Notice from '../../../components/ui/Notice.vue';
import StatusBadge from '../../../components/ui/StatusBadge.vue';
import DetailList from '../../../components/ui/DetailList.vue';
import ReviewBox from '../../../components/ReviewBox.vue';
import EvidenceView from './EvidenceView.vue';
import PaymentReceiptDialog from './PaymentReceiptDialog.vue';
import PaymentCloseDialog from './PaymentCloseDialog.vue';
import OfflineRecordDialog from './OfflineRecordDialog.vue';
import ChannelReconcilePanel from './ChannelReconcilePanel.vue';
import { apiPost } from '../../../lib/api';
import { t } from '../../../lib/i18n';
import { formatDateTime, formatMoney } from '../../../lib/money';
import { useSessionStore } from '../../../stores/session';
import type { Payment } from './payments';

const props = defineProps<{ payment: Payment; canReapply: boolean }>();
const emit = defineEmits<{ close: []; updated: [payment: Payment]; reapply: [payment: Payment] }>();

const session = useSessionStore();
const user = computed(() => session.user!);
const supplierSide = computed(() => !!user.value.supplierId);
const p = computed(() => props.payment);
const dialog = ref<'receipt' | 'close' | 'record' | null>(null);

const stateLabel = computed(() => (p.value.verificationMode === 'SIMULATED'
  ? t('模拟 · ') + (p.value.state === 'SUCCEEDED' ? t('完成') : p.value.state) : undefined));
const methodLabel = computed(() => (p.value.paymentMethod === 'OFFLINE' || p.value.verificationMode === 'MANUAL' ? t('线下付款')
  : p.value.paymentMethod === 'CHANNEL' ? t('线上付款') : t('历史付款')));
const details = computed<Array<[string, string | null | undefined]>>(() => {
  const d = p.value;
  return [
    [t('对应结算单'), d.settlementCode || d.settlementId],
    [t(supplierSide.value ? '抵扣原币应收' : '抵扣原币应付'), `${d.obligationCurrency} ${formatMoney(d.obligationAmount, d.obligationCurrency)}`],
    [t('汇率方向'), `1 ${d.obligationCurrency} = ${d.fxRate} ${d.payoutCurrency}`],
    [t('汇率依据'), d.fxSource],
    [t('付款方式'), methodLabel.value],
    [t('转账流水号 / 凭证编号'), d.externalRef || (d.state === 'SUCCEEDED' ? t('未填写') : t('尚未登记'))],
    [t('供应商到账确认'), d.receiptState === 'CONFIRMED' ? t('已确认到账') : d.receiptState === 'DISPUTED' ? t('收款有异议') : t('尚未确认')],
    [t('收款备注'), d.receiptNote],
    [t('确认时间'), formatDateTime(d.receivedAt)],
  ];
});

const canDownload = computed(() => session.has('supplier.read'));
// Four-eyes: the creator of a request cannot review it.
const canReview = computed(() => !supplierSide.value && p.value.state === 'PENDING' && session.has('payment.review') && p.value.createdBy !== user.value.id);
const canConfirmReceipt = computed(() => supplierSide.value && p.value.state === 'SUCCEEDED' && p.value.receiptState !== 'CONFIRMED' && session.has('payment.receipt'));
const canClose = computed(() => !supplierSide.value && session.has('payment.record') && ['PENDING', 'APPROVED'].includes(p.value.state));
const canRecord = computed(() => canClose.value && p.value.state === 'APPROVED' && !!p.value.reviewedBy && p.value.reviewedBy !== p.value.createdBy);
const showChannel = computed(() => !supplierSide.value && user.value.role === 'ADMIN' && !user.value.supplierId && p.value.paymentMethod !== 'OFFLINE'
  && (session.has('payment.execute') || session.has('payout.reconcile')));

async function review(approved: boolean, note: string) {
  await apiPost(`/payments/${p.value.id}/review`, { approved, version: p.value.version, note });
  session.refresh();
  emit('close');
  session.notify(t('付款审核已处理'));
}
function updated(payment: Payment) {
  emit('updated', payment);
  session.refresh();
}
</script>

<template>
  <Dialog drawer size="lg" :title="p.code" :subtitle="p.supplierName" @close="emit('close')">
    <div class="pd-body">
      <section class="pd-hero">
        <div>
          <span class="pd-eyebrow">{{ t(supplierSide ? '本次收款' : '付款金额') }}</span>
          <p class="pd-figure"><small>{{ p.payoutCurrency }}</small>{{ formatMoney(p.payoutAmount, p.payoutCurrency) }}</p>
        </div>
        <StatusBadge :state="p.state" :label="stateLabel" />
      </section>

      <DetailList :items="details" />

      <EvidenceView v-if="p.evidence" :value="p.evidence" :can-download="canDownload" />
      <a v-else-if="p.evidenceId && canDownload" class="pd-link" :href="`/api/documents/${encodeURIComponent(p.evidenceId)}/download`">{{ t('查看 / 下载付款凭证') }}</a>

      <Notice v-if="!supplierSide && p.state === 'SUCCEEDED' && p.receiptState !== 'CONFIRMED'">{{ t('平台已登记付款，等待供应商确认到账。') }}</Notice>

      <ReviewBox v-if="canReview" :title="t('付款申请审核')" :on-review="review" />

      <ChannelReconcilePanel v-if="showChannel" :payment="p" @updated="updated" />
    </div>

    <template v-if="canConfirmReceipt || canReapply || canClose" #footer>
      <Button v-if="canClose" @click="dialog = 'close'">{{ t('作废申请') }}</Button>
      <span class="pd-spacer" />
      <Button v-if="canConfirmReceipt" variant="primary" @click="dialog = 'receipt'">{{ t('核对到账情况') }}</Button>
      <Button v-if="canReapply" variant="primary" @click="emit('reapply', p)">{{ t('重新申请付款') }}</Button>
      <Button v-if="canRecord" variant="primary" icon="upload" @click="dialog = 'record'">{{ t('线下付款 / 上传凭证') }}</Button>
    </template>

    <PaymentReceiptDialog v-if="dialog === 'receipt'" :payment="p" @saved="emit('close')" @close="dialog = null" />
    <PaymentCloseDialog v-if="dialog === 'close'" :payment="p" @saved="emit('close')" @close="dialog = null" />
    <OfflineRecordDialog v-if="dialog === 'record'" :payment="p" @saved="emit('close')" @close="dialog = null" />
  </Dialog>
</template>

<style scoped>
.pd-body { display: grid; gap: 18px; }
.pd-hero { display: flex; align-items: flex-start; justify-content: space-between; gap: 16px; padding: 18px 20px; background: var(--hs-surface-subtle); border: 1px solid var(--hs-border); border-radius: 14px; }
.pd-eyebrow { color: var(--hs-text-3); font-size: var(--hs-text-xs); }
.pd-figure { margin: 4px 0 0; color: var(--hs-text); font-size: 30px; font-weight: 600; letter-spacing: -.6px; font-variant-numeric: tabular-nums; overflow-wrap: anywhere; }
.pd-figure small { margin-right: 6px; color: var(--hs-text-3); font-size: var(--hs-text-sm); font-weight: 500; letter-spacing: 0; }
.pd-link { justify-self: start; color: var(--hs-accent); font-size: var(--hs-text-sm); text-decoration: none; }
.pd-link:hover { text-decoration: underline; text-underline-offset: 3px; }
.pd-spacer { flex: 1; }
</style>
