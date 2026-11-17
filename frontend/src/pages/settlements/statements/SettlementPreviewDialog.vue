<script setup lang="ts">
// Preview of a settlement that has not been generated. The caller supplies how
// pages are loaded and, for a single settlement, how it is confirmed; batch
// items get previous/next navigation instead.
import { computed, onBeforeUnmount, ref, watch } from 'vue';
import Dialog from '../../../components/ui/Dialog.vue';
import Button from '../../../components/ui/Button.vue';
import Notice from '../../../components/ui/Notice.vue';
import DetailList from '../../../components/ui/DetailList.vue';
import DataTable from '../../../components/ui/DataTable.vue';
import Pagination from '../../../components/ui/Pagination.vue';
import Spinner from '../../../components/ui/Spinner.vue';
import DailyLinesTable from './DailyLinesTable.vue';
import ResourceGroupsTable from './ResourceGroupsTable.vue';
import { divide100, formatDiscount, t } from '../../../lib/i18n';
import { formatDateTime, formatMoney } from '../../../lib/money';
import { trimZeros, type PreviewDocument, type PreviewLine } from '../settlements';

const props = defineProps<{
  initialDocument?: PreviewDocument;
  loadPage: (page: number, size: number) => Promise<PreviewDocument>;
  /** Generates the settlement; absent for batch items. */
  confirm?: () => Promise<void>;
  canGoBack?: boolean;
  navigation?: { index: number; count: number };
}>();
const emit = defineEmits<{ close: []; back: []; previous: []; next: [] }>();

const doc = ref<PreviewDocument | undefined>(props.initialDocument);
const page = ref(1);
const size = ref(props.initialDocument?.size || 50);
const loading = ref(!props.initialDocument);
const error = ref('');
const confirming = ref(false);
const recheck = ref(0);
let sequence = 0;
let skipFirst = !!props.initialDocument;

watch([page, size, recheck], () => {
  if (skipFirst) { skipFirst = false; return; }
  const current = ++sequence;
  loading.value = true;
  error.value = '';
  props.loadPage(page.value, size.value)
    .then((next) => { if (current === sequence) doc.value = next; })
    .catch((reason: Error) => { if (current === sequence) { doc.value = undefined; error.value = reason.message; } })
    .finally(() => { if (current === sequence) loading.value = false; });
}, { immediate: true });
onBeforeUnmount(() => { sequence++; });

async function generate() {
  if (!props.confirm || confirming.value) return;
  confirming.value = true;
  error.value = '';
  try {
    await props.confirm();
  } catch (reason) {
    error.value = (reason as Error).message;
  } finally {
    confirming.value = false;
  }
}
function close() { if (!confirming.value) emit('close'); }

const SOURCE_LABELS: Record<string, string> = { MANUAL: '手工款', EXTERNAL: '外部金额', CCMAX: '日账', RESOURCE: '资源费用' };
const sourceLabel = (kind: string) => (SOURCE_LABELS[kind] ? t(SOURCE_LABELS[kind]) : kind);

function basis(line: PreviewLine, currency: string) {
  const quote = line.quote;
  if (quote.pricingType === 'DIRECT') return t('直接录入真实结算金额');
  if (quote.pricingType === 'DISCOUNT') {
    const multiplier = quote.multiplier ?? (quote.ratePercent == null ? null : divide100(String(quote.ratePercent)));
    return multiplier == null ? t('报价折扣缺失') : formatDiscount(String(multiplier));
  }
  if (quote.pricingType === 'FIXED') return quote.unitPrice == null ? t('报价单价缺失') : t('{0} {1} / 个', [currency, formatMoney(quote.unitPrice, currency)]);
  return t('历史报价依据缺失');
}

const details = computed<Array<[string, string]>>(() => {
  const d = doc.value!;
  return [
    [t('供应商'), d.supplierName],
    [t('项目'), d.projectName],
    [t('结算期间'), t('{0} 至 {1}', [d.periodStart, d.periodEnd])],
    [t('应付币种'), d.currency],
    [t('供应商确认截止时间'), formatDateTime(d.confirmationDeadline)],
    [t('金额来源'), d.basisMode === 'DAILY_SUMMARY' ? t('已生成的日账静态汇总') : t('{0} 笔已选日账', [d.lineCount])],
  ];
});
const lineColumns = computed(() => [
  { key: 'businessDate', label: t('账务日期'), nowrap: true },
  { key: 'source', label: t('来源') },
  { key: 'originalAmount', label: t('原始金额') },
  { key: 'quote', label: t('报价') },
  { key: 'basis', label: t('计价依据') },
  ...(doc.value?.lines.some((line) => line.quote.pricingType === 'FIXED') ? [{ key: 'quantity', label: t('个数') }] : []),
  { key: 'finalAmount', label: t('应付金额'), align: 'right' as const },
]);
const lineCount = computed(() => (doc.value ? doc.value.dailyLineCount ?? doc.value.resourceGroupCount ?? doc.value.lineCount : 0));
const lineKeys = new WeakMap<PreviewLine, number>();
let nextKey = 0;
function lineKey(line: PreviewLine) {
  if (!lineKeys.has(line)) lineKeys.set(line, ++nextKey);
  return lineKeys.get(line)!;
}
</script>

<template>
  <Dialog size="xl" :title="t('结算单预览')" @close="close">
    <div class="st-preview">
      <div v-if="navigation" class="st-preview-nav">
        <Button size="sm" icon="arrow-left" :disabled="confirming || navigation.index === 0" @click="emit('previous')">{{ t('上一张') }}</Button>
        <span>{{ t('第') }} {{ navigation.index + 1 }} / {{ navigation.count }} {{ t('张') }}</span>
        <Button size="sm" trailing-icon="arrow" :disabled="confirming || navigation.index + 1 === navigation.count" @click="emit('next')">{{ t('下一张') }}</Button>
      </div>

      <div v-if="loading" class="st-loading"><Spinner :size="16" /></div>
      <Notice v-if="error" tone="danger">
        {{ error }}
        <template #actions><Button size="sm" :disabled="confirming || loading" @click="recheck++">{{ t('重新核对') }}</Button></template>
      </Notice>

      <article v-if="!loading && doc" class="st-sheet" :aria-label="t('结算单预览内容')">
        <header class="st-sheet-head">
          <h3>{{ t('结算单') }}</h3>
          <span>{{ t('预览 · 尚未生成') }}</span>
        </header>
        <DetailList :items="details" />
        <DailyLinesTable v-if="doc.dailyLines" :lines="doc.dailyLines" :currency="doc.currency" />
        <ResourceGroupsTable v-else-if="doc.resourceGroups" :groups="doc.resourceGroups" :currency="doc.currency" />
        <div v-else class="st-lines">
          <DataTable :columns="lineColumns" :rows="doc.lines" :row-key="lineKey" :label="t('结算单预览明细')">
            <template #cell-source="{ row }">
              <div class="st-cell">
                <span>{{ sourceLabel(row.sourceKind) }}{{ row.modelKey ? ` · ${row.modelKey}` : '' }}</span>
                <small>{{ row.sourceRef }}</small>
              </div>
            </template>
            <template #cell-originalAmount="{ row }"><span class="st-num">{{ doc.currency }} {{ trimZeros(row.originalAmount) }}</span></template>
            <template #cell-quote="{ row }">
              <div class="st-cell">
                <span>{{ row.quote.pricingType === 'DIRECT' ? t('无需报价') : row.quote.code || t('历史报价') }}</span>
                <small>{{ row.quote.effectiveFrom || '—' }} {{ t('至') }} {{ row.quote.effectiveTo || '—' }}</small>
              </div>
            </template>
            <template #cell-basis="{ row }">{{ basis(row, doc.currency) }}</template>
            <template #cell-quantity="{ row }">{{ row.quantity ?? '—' }}</template>
            <template #cell-finalAmount="{ row }"><strong class="st-num">{{ doc.currency }} {{ formatMoney(row.finalAmount, doc.currency) }}</strong></template>
          </DataTable>
        </div>
        <Pagination v-if="lineCount > size" v-model:page="page" v-model:size="size" :total="lineCount" :loading="loading" />
        <footer class="st-sheet-total">
          <span>{{ t('原始金额合计') }} {{ doc.currency }} {{ trimZeros(doc.originalTotal) }}</span>
          <div>
            <span>{{ t('本次应付合计') }}</span>
            <strong>{{ doc.currency }} {{ formatMoney(doc.total, doc.currency) }}</strong>
          </div>
        </footer>
        <p class="st-note">
          <template v-if="doc.basisMode === 'DAILY_SUMMARY'">{{ t('按已生成的日账汇总金额结算，正式生成后冻结本单金额。') }}</template>
          <template v-else>{{ t('合计包含全部') }} {{ doc.lineCount }} {{ t('笔来源。按各笔日账的冻结报价计价，正式生成前再次核对金额。') }}</template>
        </p>
        <p class="st-note">{{ t('请核对后手动确认或提出异议；到期不会自动确认。') }}</p>
      </article>
    </div>

    <template #footer>
      <Button v-if="canGoBack" :disabled="confirming" @click="emit('back')">{{ t('返回修改') }}</Button>
      <span class="st-spacer" />
      <Button :disabled="confirming" @click="emit('close')">{{ confirm ? t('取消') : t('返回批量预览') }}</Button>
      <Button v-if="confirm" variant="primary" :loading="confirming" :disabled="loading || !doc || !!error" @click="generate">
        {{ confirming ? t('正在生成…') : t('确认生成') }}
      </Button>
    </template>
  </Dialog>
</template>

<style scoped>
.st-preview { display: grid; gap: 16px; }
.st-preview-nav { display: flex; align-items: center; justify-content: space-between; gap: 12px; color: var(--hs-text-2); font-size: var(--hs-text-sm); font-variant-numeric: tabular-nums; }
.st-loading { display: grid; place-items: center; padding: 28px; color: var(--hs-text-3); }
.st-sheet { display: grid; gap: 16px; padding: 20px; background: var(--hs-surface); border: 1px solid var(--hs-border); border-radius: 14px; }
.st-sheet-head { display: flex; align-items: baseline; justify-content: space-between; gap: 12px; padding-bottom: 12px; border-bottom: 1px solid var(--hs-divider); }
.st-sheet-head h3 { margin: 0; font-size: 18px; font-weight: 600; letter-spacing: -.2px; }
.st-sheet-head span { color: var(--hs-text-3); font-size: var(--hs-text-xs); }
.st-lines { border: 1px solid var(--hs-border); border-radius: 12px; overflow: hidden; }
.st-cell { display: grid; gap: 2px; min-width: 0; }
.st-cell small { color: var(--hs-text-3); font-size: var(--hs-text-xs); overflow-wrap: anywhere; }
.st-num { font-variant-numeric: tabular-nums; white-space: nowrap; }
strong.st-num { color: var(--hs-text); font-weight: 600; }
.st-sheet-total { display: flex; flex-wrap: wrap; align-items: flex-end; justify-content: space-between; gap: 10px 20px; padding-top: 12px; border-top: 1px solid var(--hs-divider); color: var(--hs-text-3); font-size: var(--hs-text-xs); font-variant-numeric: tabular-nums; }
.st-sheet-total div { display: grid; justify-items: end; gap: 2px; }
.st-sheet-total strong { color: var(--hs-text); font-size: 22px; font-weight: 600; letter-spacing: -.4px; }
.st-note { margin: 0; color: var(--hs-text-3); font-size: var(--hs-text-xs); line-height: 1.6; }
.st-spacer { flex: 1; }
</style>
