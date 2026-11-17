<script setup lang="ts">
// The quote list with inline edit rows. New drafts come first, then the list
// (a row being edited is replaced by its draft), then drafts whose quote has
// left the current page.
import { computed } from 'vue';
import { RouterLink } from 'vue-router';
import Select from '../../components/ui/Select.vue';
import TextInput from '../../components/ui/TextInput.vue';
import DateRangePicker from '../../components/ui/DateRangePicker.vue';
import StatusBadge from '../../components/ui/StatusBadge.vue';
import Badge from '../../components/ui/Badge.vue';
import Icon from '../../components/ui/Icon.vue';
import UsdPreview from './UsdPreview.vue';
import { getLocale, t, times100 } from '../../lib/i18n';
import { capacityLabel, DELIVERY_TYPE_LABELS, SETTLEMENT_MODE_LABELS, unitLabel } from '../../lib/labels';
import { beijingDate, type ExchangeRate } from '../../lib/money';
import { projectOption, type Project } from '../../lib/projects';
import type { SupplierSummary } from '../../composables/useSupplierDirectory';
import { useSessionStore } from '../../stores/session';
import {
  capacitySummary, draftUsesUnitPrice, isHistoricalEdit, pendingChangeNote, percentInputToMultiplier, quoteMultiplier,
  suggestedDiscount, upcomingPriceNote, type MultiplierBounds, type Quote, type QuoteDraft,
} from './quotes';

const props = defineProps<{
  quotes: Quote[];
  drafts: QuoteDraft[];
  projects: Project[];
  suppliers: SupplierSummary[];
  rates: ExchangeRate[];
  ratesLoading: boolean;
  ratesError: string;
  bounds: MultiplierBounds | null;
}>();
const emit = defineEmits<{
  open: [quote: Quote]; edit: [quote: Quote]; adjust: [quote: Quote]; reject: [quote: Quote]; copy: [quote: Quote];
  save: [draft: QuoteDraft]; cancel: [key: string]; update: [key: string, field: keyof QuoteDraft, value: string];
  period: [key: string, from: string, to: string];
}>();

const session = useSessionStore();
const user = computed(() => session.user!);
const supplierSide = computed(() => !!user.value.supplierId);
const today = beijingDate();
const discountUnit = getLocale() === 'zh-CN' ? '折' : '%';
const settlementLabels = SETTLEMENT_MODE_LABELS();
const deliveryLabels = DELIVERY_TYPE_LABELS();

type Line = { kind: 'draft'; draft: QuoteDraft } | { kind: 'quote'; quote: Quote };
const lines = computed<Line[]>(() => [
  ...props.drafts.filter((draft) => !draft.id).map((draft) => ({ kind: 'draft' as const, draft })),
  ...props.quotes.map((quote): Line => {
    const draft = props.drafts.find((entry) => entry.id === quote.id);
    return draft ? { kind: 'draft', draft } : { kind: 'quote', quote };
  }),
  ...props.drafts.filter((draft) => draft.id && !props.quotes.some((quote) => quote.id === draft.id)).map((draft) => ({ kind: 'draft' as const, draft })),
]);
const lineKey = (line: Line) => (line.kind === 'draft' ? line.draft.key : line.quote.id);

const projectFor = (draft: QuoteDraft) => props.projects.find((project) => project.id === draft.projectId);
const projectOptions = computed(() => props.projects.map((project) => projectOption(project, props.projects, true)));
const supplierOptions = computed(() => props.suppliers.map((supplier) => ({ value: supplier.id, label: supplier.name, detail: supplier.code })));
const supplierName = (draft: QuoteDraft) => props.suppliers.find((s) => s.id === draft.supplierId)?.name
  || props.quotes.find((q) => q.id === draft.id)?.supplierName || t('当前供应商');
const taxOptions = [{ value: 'true', label: t('含税') }, { value: 'false', label: t('未税') }];

// Row actions follow the same ownership, state and date rules as the server.
const own = (quote: Quote) => quote.supplierId === user.value.supplierId;
const current = (quote: Quote) => quote.effectiveTo >= today;
const canDeliver = (quote: Quote) => supplierSide.value && own(quote) && quote.state === 'APPROVED' && session.has('resource.read') && session.has('resource.write');
const canEdit = (quote: Quote) => session.has('quote.write') && quote.state === 'PENDING' && quote.submittedBy === user.value.id && current(quote);
const canAdjust = (quote: Quote) => quote.state === 'APPROVED' && session.has('quote.write') && (!supplierSide.value || own(quote)) && current(quote);
const canReview = (quote: Quote) => quote.state === 'APPROVED' && session.has('quote.review') && !supplierSide.value;

function inputValue(event: Event) { return (event.target as HTMLInputElement).value; }
</script>

<template>
  <div class="sheet-wrap" role="region" :aria-label="t('报价列表')" tabindex="-1">
    <table class="sheet">
      <thead>
        <tr>
          <th v-if="!supplierSide" class="col-supplier">{{ t('供应商') }}</th>
          <th class="col-project">{{ t('报价项目') }}</th>
          <th class="col-price">{{ t('折扣 / 独立价格') }}</th>
          <th class="col-capacity">{{ t('申报能力 / 补充说明') }}</th>
          <th class="col-currency">{{ t('币种 / 税') }}</th>
          <th class="col-period">{{ t('适用期间') }}</th>
          <th class="col-state">{{ t('状态') }}</th>
          <th class="col-actions">{{ t('操作') }}</th>
        </tr>
      </thead>
      <tbody>
        <template v-for="line in lines" :key="lineKey(line)">
          <!-- Inline edit row -->
          <template v-if="line.kind === 'draft'">
            <tr class="edit" @click.stop>
              <td v-if="!supplierSide">
                <div v-if="user.supplierId || line.draft.id" class="locked">
                  <strong>{{ supplierName(line.draft) }}</strong>
                  <small>{{ t('所属供应商不可变更') }}</small>
                </div>
                <Select
                  v-else
                  :model-value="line.draft.supplierId"
                  :options="supplierOptions"
                  :label="t('供应商')"
                  :placeholder="t('选择供应商')"
                  searchable
                  :disabled="line.draft.pending"
                  size="sm"
                  @update:model-value="emit('update', line.draft.key, 'supplierId', String($event))"
                />
              </td>
              <td>
                <Select
                  :model-value="line.draft.projectId"
                  :options="projectOptions"
                  :label="t('报价项目')"
                  :placeholder="t('选择项目')"
                  searchable
                  :disabled="line.draft.pending || isHistoricalEdit(line.draft)"
                  size="sm"
                  @update:model-value="emit('update', line.draft.key, 'projectId', String($event))"
                />
                <small v-if="projectFor(line.draft)" class="sub">
                  {{ settlementLabels[projectFor(line.draft)!.settlementMethod] }} · {{ deliveryLabels[projectFor(line.draft)!.deliveryMethod] }}
                </small>
              </td>
              <td>
                <div class="cell">
                  <TextInput
                    :model-value="draftUsesUnitPrice(line.draft, projectFor(line.draft)) ? line.draft.unitPrice : line.draft.multiplier"
                    type="number"
                    min="0"
                    step="any"
                    size="sm"
                    :aria-label="t(draftUsesUnitPrice(line.draft, projectFor(line.draft)) ? '单位价格' : '报价折扣')"
                    :placeholder="t(draftUsesUnitPrice(line.draft, projectFor(line.draft)) ? '单位价格' : '例如 27')"
                    :suffix="draftUsesUnitPrice(line.draft, projectFor(line.draft)) ? `/ ${unitLabel(projectFor(line.draft)?.unit) || t('单位')}` : discountUnit"
                    :disabled="line.draft.pending || isHistoricalEdit(line.draft) || !projectFor(line.draft)"
                    @update:model-value="emit('update', line.draft.key, draftUsesUnitPrice(line.draft, projectFor(line.draft)) ? 'unitPrice' : 'multiplier', $event)"
                  />
                  <small v-if="!draftUsesUnitPrice(line.draft, projectFor(line.draft)) && bounds" class="sub">
                    {{ t('允许范围 {0} 至 {1}，可填小数', [times100(bounds.min), times100(bounds.max)]) }}
                  </small>
                  <small v-if="suggestedDiscount(projectFor(line.draft)?.suggestedMultiplier)" class="suggest">{{ suggestedDiscount(projectFor(line.draft)?.suggestedMultiplier) }}</small>
                  <UsdPreview
                    v-if="!draftUsesUnitPrice(line.draft, projectFor(line.draft)) && projectFor(line.draft)"
                    :value="percentInputToMultiplier(line.draft.multiplier)"
                    :currency="line.draft.currency"
                    :rates="rates"
                    :loading="ratesLoading"
                    :error="ratesError"
                  />
                </div>
              </td>
              <td>
                <div class="cell">
                  <TextInput
                    v-if="projectFor(line.draft)?.capacityType === 'ACCOUNT_COUNT'"
                    :model-value="line.draft.accountCount" type="number" min="1" step="1" size="sm"
                    :aria-label="t('账号数量')" :placeholder="t('账号数（个）')" :disabled="line.draft.pending || isHistoricalEdit(line.draft)"
                    @update:model-value="emit('update', line.draft.key, 'accountCount', $event)"
                  />
                  <TextInput
                    v-if="projectFor(line.draft)?.capacityType === 'ACCOUNT_QUOTA'"
                    :model-value="line.draft.accountQuota" type="number" min="0" step="any" size="sm"
                    :aria-label="capacityLabel(projectFor(line.draft)!)" :placeholder="capacityLabel(projectFor(line.draft)!)"
                    :disabled="line.draft.pending || isHistoricalEdit(line.draft)"
                    @update:model-value="emit('update', line.draft.key, 'accountQuota', $event)"
                  />
                  <div v-if="projectFor(line.draft)?.capacityType === 'THROUGHPUT'" class="pair">
                    <TextInput :model-value="line.draft.rpm" type="number" min="1" step="1" size="sm" aria-label="RPM" placeholder="RPM"
                      :disabled="line.draft.pending || isHistoricalEdit(line.draft)" @update:model-value="emit('update', line.draft.key, 'rpm', $event)" />
                    <TextInput :model-value="line.draft.tpm" type="number" min="1" step="1" size="sm" aria-label="TPM" placeholder="TPM"
                      :disabled="line.draft.pending || isHistoricalEdit(line.draft)" @update:model-value="emit('update', line.draft.key, 'tpm', $event)" />
                  </div>
                  <small v-if="projectFor(line.draft) && !projectFor(line.draft)!.capacityType" class="error">{{ t('请先在项目管理配置能力口径') }}</small>
                  <TextInput
                    :model-value="line.draft.serviceCapacityNote" multiline :rows="2" maxlength="500"
                    :aria-label="t('能力补充说明')" :placeholder="t('能力补充说明（选填）')" :disabled="line.draft.pending || isHistoricalEdit(line.draft)"
                    @update:model-value="emit('update', line.draft.key, 'serviceCapacityNote', $event)"
                  />
                </div>
              </td>
              <td>
                <div class="cell">
                  <span class="readonly" :aria-label="t('计价币种')">{{ line.draft.currency }}</span>
                  <Select
                    :model-value="line.draft.taxInclusive"
                    :options="taxOptions"
                    :label="t('含税口径')"
                    :disabled="line.draft.pending || isHistoricalEdit(line.draft)"
                    size="sm"
                    @update:model-value="emit('update', line.draft.key, 'taxInclusive', String($event))"
                  />
                </div>
              </td>
              <td>
                <DateRangePicker
                  :from="line.draft.effectiveFrom"
                  :to="line.draft.effectiveTo"
                  :disabled="line.draft.pending"
                  :min-date="today"
                  :from-locked="isHistoricalEdit(line.draft)"
                  size="sm"
                  @change="(from, to) => emit('period', line.draft.key, from, to)"
                />
                <small v-if="isHistoricalEdit(line.draft)" class="sub">{{ t('历史开始日期和价格已锁定；改价请复制新行。') }}</small>
              </td>
              <td><Badge :tone="line.draft.id ? 'violet' : 'neutral'" dot>{{ line.draft.id ? t('待审核') : t('未提交') }}</Badge></td>
              <td>
                <div class="actions">
                  <button type="button" class="action primary" :disabled="line.draft.pending" @click="emit('save', line.draft)">{{ line.draft.pending ? t('保存中…') : t('保存') }}</button>
                  <button type="button" class="action" :disabled="line.draft.pending" @click="emit('cancel', line.draft.key)">{{ t('取消') }}</button>
                </div>
              </td>
            </tr>
            <tr v-if="line.draft.error" class="edit-error">
              <td :colspan="supplierSide ? 7 : 8"><Icon name="info" :size="14" />{{ line.draft.error }}</td>
            </tr>
          </template>

          <!-- Read-only row -->
          <tr v-else class="row" :class="{ flagged: pendingChangeNote(line.quote) || upcomingPriceNote(line.quote) }" tabindex="0"
            @click="emit('open', line.quote)" @keydown.enter.self="emit('open', line.quote)">
            <td v-if="!supplierSide">
              <div class="cell">
                <span v-if="pendingChangeNote(line.quote)" class="note pending">{{ pendingChangeNote(line.quote) }}</span>
                <span v-if="upcomingPriceNote(line.quote)" class="note upcoming">{{ upcomingPriceNote(line.quote) }}</span>
                <strong>{{ line.quote.supplierName }}</strong>
                <small class="dates">{{ line.quote.code }}</small>
              </div>
            </td>
            <td>
              <div class="cell">
                <span v-if="supplierSide && pendingChangeNote(line.quote)" class="note pending">{{ pendingChangeNote(line.quote) }}</span>
                <span v-if="supplierSide && upcomingPriceNote(line.quote)" class="note upcoming">{{ upcomingPriceNote(line.quote) }}</span>
                <strong>{{ line.quote.projectName }}</strong>
                <small>{{ supplierSide ? `${unitLabel(line.quote.unit)} · ${line.quote.code}` : unitLabel(line.quote.unit) }}</small>
              </div>
            </td>
            <td>
              <div class="cell">
                <strong v-if="line.quote.pricingType === 'DISCOUNT'" class="price">{{ times100(quoteMultiplier(line.quote)) }}<small>{{ discountUnit }}</small></strong>
                <strong v-else class="price">{{ line.quote.currency }} {{ line.quote.unitPrice }}<small> / {{ unitLabel(line.quote.unit) }}</small></strong>
                <UsdPreview v-if="line.quote.pricingType === 'DISCOUNT'" :value="quoteMultiplier(line.quote)" :currency="line.quote.currency" :rates="rates" :loading="ratesLoading" :error="ratesError" />
                <small v-else>{{ t('固定单价') }}</small>
              </div>
            </td>
            <td>
              <div class="cell">
                <strong>{{ capacitySummary(line.quote) }}</strong>
                <small v-if="line.quote.serviceCapacityNote?.trim()" class="clamp">{{ line.quote.serviceCapacityNote }}</small>
              </div>
            </td>
            <td>
              <div class="cell">
                <strong>{{ line.quote.currency }}</strong>
                <small>{{ line.quote.taxInclusive ? t('含税') : t('未税') }}</small>
              </div>
            </td>
            <td>
              <div class="cell dates">
                <span>{{ line.quote.effectiveFrom }}</span>
                <small>{{ t('至') }} {{ line.quote.effectiveTo }}</small>
              </div>
            </td>
            <td>
              <div class="cell badges">
                <StatusBadge :state="line.quote.state" />
                <Badge v-if="pendingChangeNote(line.quote)" tone="violet" dot>{{ t('调价待审') }}</Badge>
              </div>
            </td>
            <td @click.stop>
              <div class="actions">
                <RouterLink v-if="canDeliver(line.quote)" class="action primary" :to="{ path: '/deliveries', query: { quoteId: line.quote.id } }">{{ t('交付') }}</RouterLink>
                <button v-if="canEdit(line.quote)" type="button" class="action primary" @click="emit('edit', line.quote)">{{ t('编辑') }}</button>
                <button v-if="canAdjust(line.quote)" type="button" class="action primary" @click="emit('adjust', line.quote)">{{ t('调价') }}</button>
                <button v-if="canReview(line.quote)" type="button" class="action primary" @click="emit('adjust', line.quote)">{{ t('审核调价') }}</button>
                <button v-if="canReview(line.quote)" type="button" class="action danger" @click="emit('reject', line.quote)">{{ t('拒绝') }}</button>
                <button v-if="session.has('quote.write')" type="button" class="action" @click="emit('copy', line.quote)">{{ t('复制新行') }}</button>
                <button type="button" class="action" @click="emit('open', line.quote)">{{ t('查看') }}</button>
              </div>
            </td>
          </tr>
        </template>
      </tbody>
    </table>
  </div>
</template>

<style scoped>
.sheet-wrap { width: 100%; overflow-x: auto; overscroll-behavior-x: contain; scrollbar-width: thin; }
.sheet { width: 100%; min-width: 920px; border-collapse: collapse; font-size: var(--hs-text-sm); }
.sheet th, .sheet td { height: auto; padding: 12px 12px; text-align: left; vertical-align: top; }
.sheet th:first-child, .sheet td:first-child { padding-left: 20px; }
.sheet th:last-child, .sheet td:last-child { padding-right: 20px; }
.sheet thead { background: var(--hs-surface-subtle); }
.sheet th { height: 38px; padding-top: 0; padding-bottom: 0; vertical-align: middle; color: var(--hs-text-3); border-top: 1px solid var(--hs-divider); border-bottom: 1px solid var(--hs-divider); font-size: var(--hs-text-xs); font-weight: 500; white-space: nowrap; }
.sheet td { color: var(--hs-text-2); border-bottom: 1px solid var(--hs-divider); line-height: 1.5; }
.col-supplier { min-width: 120px; } .col-project { min-width: 150px; } .col-price { min-width: 140px; } .col-capacity { min-width: 140px; }
.col-currency { width: 104px; } .col-period { min-width: 170px; } .col-state { width: 96px; } .col-actions { width: 112px; }

.row { cursor: pointer; transition: background .12s; }
.row:hover { background: var(--hs-surface-subtle); }
.row:focus-visible { outline: 2px solid var(--hs-accent); outline-offset: -2px; }
.row.flagged { background: #fffcf4; }
.row.flagged:hover { background: #fdf8eb; }
.cell { display: grid; gap: 3px; min-width: 0; }
.cell strong { color: var(--hs-text); font-weight: 500; overflow-wrap: anywhere; }
.cell small, .sub { color: var(--hs-text-3); font-size: var(--hs-text-xs); }
.sub { display: block; margin-top: 4px; }
.dates { font-family: var(--hs-font-mono); font-size: var(--hs-text-xs); }
.dates span { color: var(--hs-text); }
.price { font-size: 15px; font-variant-numeric: tabular-nums; }
.price small { margin-left: 2px; color: var(--hs-text-3); font-size: var(--hs-text-xs); font-weight: 400; }
.clamp { display: -webkit-box; overflow: hidden; -webkit-line-clamp: 2; -webkit-box-orient: vertical; }
.note { font-size: 11px; font-weight: 500; line-height: 1.5; }
.note.pending { color: var(--hs-violet); }
.note.upcoming { color: var(--hs-warning); }
.badges { justify-items: start; }
.suggest { color: var(--hs-teal); font-size: var(--hs-text-xs); }
.error { color: var(--hs-danger); font-size: var(--hs-text-xs); }

.actions { display: flex; flex-wrap: wrap; gap: 4px 10px; }
.action { min-height: 0; padding: 0; color: var(--hs-text-3); background: none; border: 0; font: inherit; font-size: var(--hs-text-xs); text-decoration: none; white-space: nowrap; cursor: pointer; }
.action:hover:not(:disabled) { color: var(--hs-text); text-decoration: underline; text-underline-offset: 3px; }
.action.primary { color: var(--hs-accent); }
.action.primary:hover:not(:disabled) { color: var(--hs-accent-hover); }
.action.danger { color: var(--hs-danger); }
.action:disabled { opacity: .5; cursor: not-allowed; }

.edit td { background: #fbfbfb; }
.locked { display: grid; gap: 2px; }
.locked strong { color: var(--hs-text); font-weight: 500; }
.locked small { color: var(--hs-text-3); font-size: 11px; }
.pair { display: grid; grid-template-columns: 1fr 1fr; gap: 6px; }
.readonly { display: inline-flex; align-items: center; height: var(--hs-control-height-sm); padding: 0 10px; color: var(--hs-text-2); background: var(--hs-surface-subtle); border: 1px solid var(--hs-border); border-radius: var(--hs-radius-control); font-size: var(--hs-text-xs); }
.edit-error td { padding-top: 8px; padding-bottom: 8px; color: var(--hs-danger); background: var(--hs-danger-soft); font-size: var(--hs-text-xs); }
.edit-error td > .hs-icon { display: inline-block; margin-right: 6px; vertical-align: -2px; }
</style>
