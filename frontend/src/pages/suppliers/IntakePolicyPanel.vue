<script setup lang="ts">
// CC onboarding rules at system, supplier or member level: PRO / non-PRO daily
// quantities, non-PRO intake, the priority tier and per-tier priority ranges.
// Platform only. Edits are discarded when the server data reloads.
import { computed, ref, shallowRef, watch } from 'vue';
import Button from '../../components/ui/Button.vue';
import Notice from '../../components/ui/Notice.vue';
import Select from '../../components/ui/Select.vue';
import TextInput from '../../components/ui/TextInput.vue';
import EmptyState from '../../components/ui/EmptyState.vue';
import Spinner from '../../components/ui/Spinner.vue';
import { useApiData } from '../../composables/useApiData';
import { apiPut } from '../../lib/api';
import { t } from '../../lib/i18n';
import { useSessionStore } from '../../stores/session';
import { formatLimit, INTAKE_TIERS, isPlatformUser, tierLabels } from './supplierAdmin';

type QuantityMode = 'INHERIT' | 'LIMITED' | 'UNLIMITED';
interface Quantity { mode: QuantityMode; quantity: number | null }
interface Range { min: number; max: number }
interface Policy { pro: Quantity; nonPro: Quantity; nonProOpen: boolean | null; tier: string | null; ranges: Record<string, Range> }
interface PolicyResponse { policy: Policy; inherited?: { pro: Quantity; nonPro: Quantity; tier?: string | null; ranges: Record<string, Range> } | null; version: number }

const props = defineProps<{ supplierId?: string; memberId?: string; title?: string }>();

const session = useSessionStore();
const canRead = computed(() => !!session.user && isPlatformUser(session.user) && session.has(props.supplierId ? 'supplier.read' : 'system.settings'));
const canWrite = computed(() => canRead.value && session.has(props.supplierId ? 'supplier.write' : 'system.settings'));
const endpoint = computed(() => (props.supplierId
  ? `/cc-intake/admin/suppliers/${encodeURIComponent(props.supplierId)}${props.memberId ? `/members/${encodeURIComponent(props.memberId)}` : ''}`
  : '/cc-intake/admin/system'));
const source = useApiData<PolicyResponse>(() => (canRead.value ? endpoint.value : null));

const loaded = shallowRef<PolicyResponse | null>(null);
const policy = ref<Policy | null>(null);
const ranges = ref<Record<string, { min: string; max: string }>>({});
const saving = ref(false);
const error = ref('');
const labels = tierLabels();

watch(endpoint, () => { loaded.value = null; policy.value = null; ranges.value = {}; error.value = ''; });

function init(response: PolicyResponse) {
  const next = structuredClone(response.policy);
  // Historical system rows predate the tier field; use the server's effective default.
  if (!props.supplierId && !next.tier) next.tier = response.inherited?.tier || 'NORMAL';
  loaded.value = response;
  policy.value = next;
  ranges.value = Object.fromEntries(Object.entries(response.policy.ranges).map(([tier, range]) => [tier, { min: String(range.min), max: String(range.max) }]));
  error.value = '';
}
watch(() => source.data.value, (value) => { if (value) init(value); }, { immediate: true });

const inherited = computed(() => loaded.value?.inherited ?? null);
const disabled = computed(() => saving.value || !canWrite.value);

const quantityOptions = computed(() => [
  ...(props.supplierId ? [{ value: 'INHERIT', label: t('跟随系统') }] : []),
  { value: 'LIMITED', label: t('限制数量') },
  { value: 'UNLIMITED', label: t('不限') },
]);
const openOptions = computed(() => [
  ...(props.supplierId ? [{ value: 'INHERIT', label: t('跟随系统') }] : []),
  { value: 'OPEN', label: t('开放') },
  { value: 'CLOSED', label: t('停收') },
]);
const inheritTierLabel = computed(() => (inherited.value?.tier ? t('跟随上级（{0}）', [labels[inherited.value.tier]]) : t('跟随上级')));
const tierOptions = computed(() => [
  ...(props.supplierId ? [{ value: '', label: inheritTierLabel.value }] : []),
  ...INTAKE_TIERS.map((tier) => ({ value: tier, label: labels[tier] })),
]);
const rangeModeOptions = [{ value: 'INHERIT', label: t('跟随上级') }, { value: 'CUSTOM', label: t('单独设置') }];

const quantityFields = computed(() => [
  { key: 'pro' as const, label: t('PRO每日数量') },
  { key: 'nonPro' as const, label: t('非PRO每日数量') },
]);

function setMode(key: 'pro' | 'nonPro', mode: string) {
  if (!policy.value) return;
  const current = policy.value[key];
  policy.value = { ...policy.value, [key]: { mode: mode as QuantityMode, quantity: mode === 'LIMITED' ? current.quantity ?? 0 : null } };
}
function setQuantity(key: 'pro' | 'nonPro', value: string) {
  if (!policy.value) return;
  policy.value = { ...policy.value, [key]: { ...policy.value[key], quantity: value === '' ? null : Number(value) } };
}
const openValue = computed(() => (policy.value?.nonProOpen === null ? 'INHERIT' : policy.value?.nonProOpen ? 'OPEN' : 'CLOSED'));
function setOpen(value: string) {
  if (policy.value) policy.value = { ...policy.value, nonProOpen: value === 'INHERIT' ? null : value === 'OPEN' };
}
function setTier(value: string) {
  if (policy.value) policy.value = { ...policy.value, tier: value || null };
}

/** The range in effect for a tier: its own override, else the inherited one. */
function effectiveRange(tier: string) {
  const own = ranges.value[tier];
  const parent = inherited.value?.ranges[tier];
  return own || (parent ? { min: String(parent.min), max: String(parent.max) } : undefined);
}
function setRangeMode(tier: string, mode: string) {
  const next = { ...ranges.value };
  if (mode === 'INHERIT') delete next[tier];
  else next[tier] = effectiveRange(tier) || { min: '1', max: '1' };
  ranges.value = next;
}
function setRange(tier: string, bound: 'min' | 'max', value: string) {
  ranges.value = { ...ranges.value, [tier]: { ...ranges.value[tier], [bound]: value } };
}

async function save() {
  if (saving.value || !canWrite.value || !policy.value || !loaded.value) return;
  error.value = '';
  const payload: Record<string, Range> = {};
  for (const tier of INTAKE_TIERS) {
    const range = ranges.value[tier];
    if (!range) continue;
    if (!/^\d+$/.test(range.min) || !/^\d+$/.test(range.max) || Number(range.min) > Number(range.max) || Number(range.max) > 1000) {
      error.value = t('优先级区间须为0至1000且下限不大于上限');
      return;
    }
    payload[tier] = { min: Number(range.min), max: Number(range.max) };
  }
  saving.value = true;
  try {
    init(await apiPut<PolicyResponse>(endpoint.value, { policy: { ...policy.value, ranges: payload }, version: loaded.value.version }));
    session.notify(t('CC上号规则已保存'));
  } catch (reason) {
    error.value = (reason as Error).message;
  } finally {
    saving.value = false;
  }
}
</script>

<template>
  <EmptyState v-if="!canRead" error :text="t('当前账号无权访问此页面')" compact />
  <Notice v-else-if="source.error.value && !loaded" tone="danger">
    {{ source.error.value }}
    <template #actions><Button size="sm" @click="source.reload()">{{ t('重新加载配置') }}</Button></template>
  </Notice>
  <div v-else-if="!loaded || !policy" class="ip-loading"><Spinner :size="16" /></div>
  <form v-else class="ip" @submit.prevent="save">
    <Notice tone="warning">{{ t('规则用于后续原生 OAuth 上号。套餐由上游核验，未知套餐保持禁用；处理中及待核实的创建占用预留额度。') }}</Notice>
    <div class="ip-heading">
      <h3>{{ title || (memberId ? t('个人优先级配置') : t('CC上号规则')) }}</h3>
      <p>{{ memberId ? t('仅平台可见；未覆盖的档位跟随供应商及系统配置。') : t('按北京时间统计当日成功新增；数量和优先级分别继承，已成功的数量不会因修改配置清零。') }}</p>
    </div>

    <template v-if="!memberId">
      <div class="ip-fields">
        <div v-for="field in quantityFields" :key="field.key" class="ip-field">
          <span class="ip-label">{{ field.label }}</span>
          <Select :model-value="policy[field.key].mode" :options="quantityOptions" :label="field.label" :disabled="disabled" @update:model-value="setMode(field.key, String($event))" />
          <TextInput
            v-if="policy[field.key].mode === 'LIMITED'"
            :model-value="policy[field.key].quantity === null ? '' : String(policy[field.key].quantity)"
            type="number" min="0" max="100000000" step="1" required
            :aria-label="field.label" :disabled="disabled"
            @update:model-value="setQuantity(field.key, $event)"
          />
          <small v-if="policy[field.key].mode === 'INHERIT' && inherited" class="ip-hint">{{ t('当前系统默认：{0}', [formatLimit(inherited[field.key].quantity)]) }}</small>
        </div>
        <div class="ip-field">
          <span class="ip-label">{{ t('非PRO品类开放') }}</span>
          <Select :model-value="openValue" :options="openOptions" :label="t('非PRO品类开放')" :disabled="disabled" @update:model-value="setOpen(String($event))" />
        </div>
      </div>
      <p class="ip-hint">{{ t('按北京时间统计成功新增；历史未识别套餐按保守方式占用两类额度，重新授权不计新增。') }}</p>
    </template>

    <div class="ip-tier">
      <h4>{{ t('优先级档位') }}</h4>
      <div class="ip-field ip-tier-select">
        <span class="ip-label">{{ t('当前使用档位') }}</span>
        <Select :model-value="policy.tier ?? ''" :options="tierOptions" :label="t('当前使用档位')" :placeholder="supplierId ? inheritTierLabel : t('请选择')" :disabled="disabled" @update:model-value="setTier(String($event))" />
      </div>
    </div>

    <div class="ip-table-wrap" role="region" :aria-label="t('各档位优先级区间')">
      <table class="ip-table">
        <thead>
          <tr>
            <th>{{ t('档位') }}</th>
            <th>{{ t('配置方式') }}</th>
            <th>{{ t('优先级下限') }}</th>
            <th>{{ t('优先级上限') }}</th>
            <th>{{ t('生效区间') }}</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="tier in INTAKE_TIERS" :key="tier">
            <th scope="row">{{ labels[tier] }}</th>
            <td>
              <Select v-if="supplierId" :model-value="ranges[tier] ? 'CUSTOM' : 'INHERIT'" :options="rangeModeOptions" :label="t('{0}配置方式', [labels[tier]])" size="sm"
                :disabled="disabled" @update:model-value="setRangeMode(tier, String($event))" />
              <template v-else>{{ t('系统默认') }}</template>
            </td>
            <td v-for="bound in (['min', 'max'] as const)" :key="bound">
              <TextInput v-if="ranges[tier]" :model-value="ranges[tier][bound]" type="number" required min="0" max="1000" step="1" size="sm" :disabled="disabled"
                :aria-label="t('{0}：{1}', [labels[tier], t(bound === 'min' ? '优先级下限' : '优先级上限')])"
                @update:model-value="setRange(tier, bound, $event)" />
              <template v-else>—</template>
            </td>
            <td class="ip-range">{{ effectiveRange(tier) ? `${effectiveRange(tier)!.min}–${effectiveRange(tier)!.max}` : '—' }}</td>
          </tr>
        </tbody>
      </table>
    </div>
    <p class="ip-hint">{{ supplierId ? t('未单独设置时继承上级区间；上下限相同即固定值。仅用于后续首次上号的初始分配，已有账号请在上游维护。') : t('上下限相同即固定值。仅用于后续首次上号的初始分配，已有账号请在上游维护。') }}</p>

    <Notice v-if="error || source.error.value" tone="danger">
      {{ error || source.error.value }}
      <template #actions><Button size="sm" :disabled="saving" @click="source.reload()">{{ t('重新加载配置') }}</Button></template>
    </Notice>
    <footer class="ip-actions">
      <Button :disabled="saving" @click="loaded && init(loaded)">{{ t('恢复当前值') }}</Button>
      <Button v-if="canWrite" variant="primary" type="submit" :loading="saving">{{ saving ? t('保存中…') : t('保存CC上号规则') }}</Button>
    </footer>
  </form>
</template>

<style scoped>
.ip { display: grid; gap: 14px; }
.ip-loading { display: grid; place-items: center; padding: 24px; color: var(--hs-text-3); }
.ip-heading h3 { margin: 0; font-size: var(--hs-text-md); font-weight: 600; }
.ip-heading p, .ip-hint { margin: 4px 0 0; color: var(--hs-text-3); font-size: var(--hs-text-xs); line-height: 1.6; }
.ip-fields { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 12px; }
.ip-field { display: grid; gap: 6px; align-content: start; }
.ip-label { color: var(--hs-text-2); font-size: var(--hs-text-sm); font-weight: 500; }
.ip-tier { display: flex; flex-wrap: wrap; align-items: flex-end; justify-content: space-between; gap: 12px; }
.ip-tier h4 { margin: 0; font-size: var(--hs-text-sm); font-weight: 600; }
.ip-tier-select { min-width: 220px; }
.ip-table-wrap { overflow-x: auto; border: 1px solid var(--hs-border); border-radius: 12px; }
.ip-table { width: 100%; min-width: 560px; border-collapse: collapse; font-size: var(--hs-text-sm); }
.ip-table th, .ip-table td { padding: 8px 12px; text-align: left; border-bottom: 1px solid var(--hs-divider); }
.ip-table thead th { color: var(--hs-text-3); background: var(--hs-surface-subtle); font-size: var(--hs-text-xs); font-weight: 500; }
.ip-table tbody th { color: var(--hs-text); font-weight: 500; white-space: nowrap; }
.ip-table tbody tr:last-child th, .ip-table tbody tr:last-child td { border-bottom: 0; }
.ip-range { font-variant-numeric: tabular-nums; }
.ip-actions { display: flex; justify-content: flex-end; gap: 8px; }
</style>
