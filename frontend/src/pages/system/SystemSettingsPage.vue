<script setup lang="ts">
// settings: system parameters (CCMAX intake switches and limits, session,
// password, login protection, quote discount range, review) saved together with
// optimistic locking, plus the system-level CC onboarding rules panel.
import { computed, ref, watch } from 'vue';
import PageHeader from '../../components/ui/PageHeader.vue';
import Button from '../../components/ui/Button.vue';
import Card from '../../components/ui/Card.vue';
import EmptyState from '../../components/ui/EmptyState.vue';
import FormField from '../../components/ui/FormField.vue';
import Notice from '../../components/ui/Notice.vue';
import Select from '../../components/ui/Select.vue';
import Spinner from '../../components/ui/Spinner.vue';
import TextInput from '../../components/ui/TextInput.vue';
import SettingSwitch from './components/SettingSwitch.vue';
import IntakePolicyPanel from '../suppliers/IntakePolicyPanel.vue';
import { useApiData } from '../../composables/useApiData';
import { apiPut } from '../../lib/api';
import { divide100, t, times100 } from '../../lib/i18n';
import { useSessionStore } from '../../stores/session';

type Policy = Record<string, unknown> & {
  quoteMultiplierMin: string;
  quoteMultiplierMax: string;
  initialPasswordFormat: string;
  initialPasswordPrefix: string;
  supplierRegistrationApprovalEnabled: boolean;
};
interface SystemSettings {
  policy: Policy;
  allowAllSuppliersPro: boolean;
  allowAllSuppliersCcmax: boolean;
  forceStopCcmaxIntake?: boolean;
  ccmaxIntakeConcurrencyLimit?: number | null;
  ccmaxCreationTimeoutSeconds?: number | null;
  allowAllSuppliersCcmaxReauthorization: boolean;
  version: number;
}

const NUMBER_FIELDS = {
  sessionIdleMinutes: [1, 1440], sessionAbsoluteMinutes: [1, 10080], passwordMinLength: [8, 64], passwordMaxLength: [8, 72],
  initialPasswordLength: [12, 72], loginMaxFailures: [3, 20], loginLockMinutes: [1, 1440],
} as const;
type NumberField = keyof typeof NUMBER_FIELDS;
const CHECK_FIELDS = ['requireUpper', 'requireLower', 'requireDigit', 'requireSymbol', 'forceInitialChange'] as const;
type CheckField = typeof CHECK_FIELDS[number];

defineProps<{ route: string }>();
const session = useSessionStore();
const canAccess = computed(() => !!session.user && !session.user.supplierId && session.user.role !== 'SUPPLIER' && session.has('system.settings'));
const source = useApiData<SystemSettings>(() => (canAccess.value ? '/system/settings' : null));

const policy = ref<Policy | null>(null);
// Number inputs are edited as text and sent as numbers ('' when cleared), as before.
const numbers = ref<Record<NumberField, string>>({} as Record<NumberField, string>);
const allowPro = ref(false);
const allowCcmax = ref(false);
const forceStop = ref(false);
const concurrency = ref('10');
const timeoutSeconds = ref('120');
const allowReauth = ref(false);
const saving = ref(false);
const error = ref('');

function load(data: SystemSettings) {
  allowPro.value = data.allowAllSuppliersPro;
  allowCcmax.value = data.allowAllSuppliersCcmax;
  forceStop.value = data.forceStopCcmaxIntake === true;
  concurrency.value = String(data.ccmaxIntakeConcurrencyLimit ?? 10);
  timeoutSeconds.value = String(data.ccmaxCreationTimeoutSeconds ?? 120);
  allowReauth.value = data.allowAllSuppliersCcmaxReauthorization;
  policy.value = {
    ...data.policy,
    quoteMultiplierMin: times100(data.policy.quoteMultiplierMin || '0'),
    quoteMultiplierMax: times100(data.policy.quoteMultiplierMax || '100'),
  };
  numbers.value = Object.fromEntries((Object.keys(NUMBER_FIELDS) as NumberField[]).map((key) => [key, String(data.policy[key] ?? '')])) as Record<NumberField, string>;
}
watch(() => source.data.value, (data) => { if (data) load(data); }, { immediate: true });

function reset() {
  error.value = '';
  if (source.data.value) load(source.data.value);
}

const numberValue = (key: NumberField) => (numbers.value[key] === '' ? '' : Number(numbers.value[key]));
const shortPassword = computed(() => (numberValue('passwordMinLength') as number) < 15);

const numberLabels = computed<Record<NumberField, string>>(() => ({
  sessionIdleMinutes: t('空闲有效期（分钟）'), sessionAbsoluteMinutes: t('绝对有效期（分钟）'), passwordMinLength: t('最短长度'),
  passwordMaxLength: t('最长长度'), initialPasswordLength: t('初始密码总长度'), loginMaxFailures: t('连续失败次数'), loginLockMinutes: t('锁定时间（分钟）'),
}));
const checkLabels = computed<Record<CheckField, string>>(() => ({
  requireUpper: t('包含大写字母'), requireLower: t('包含小写字母'), requireDigit: t('包含数字'), requireSymbol: t('包含符号'),
  forceInitialChange: t('新建或重置后，首次登录必须修改密码'),
}));
const formatOptions = [{ value: 'MIXED', label: t('字母、数字和符号') }, { value: 'ALNUM', label: t('字母和数字') }];

function setCheck(key: CheckField, checked: boolean) { if (policy.value) policy.value = { ...policy.value, [key]: checked }; }

async function save() {
  if (saving.value || !canAccess.value || !policy.value || !source.data.value) return;
  const limit = Number(concurrency.value);
  if (!Number.isInteger(limit) || limit < 1 || limit > 1000) { error.value = t('每供应商同时上号数须为1至1000的整数'); return; }
  const timeout = Number(timeoutSeconds.value);
  if (!Number.isInteger(timeout) || timeout < 1 || timeout > 300) { error.value = t('上号单次超时须为1至300的整数秒'); return; }
  saving.value = true;
  error.value = '';
  try {
    const { allowSamePersonReview: _, ...rest } = policy.value;
    const numeric = Object.fromEntries((Object.keys(NUMBER_FIELDS) as NumberField[]).map((key) => [key, numberValue(key)]));
    const result = await apiPut<SystemSettings>('/system/settings', {
      policy: { ...rest, ...numeric, quoteMultiplierMin: divide100(policy.value.quoteMultiplierMin), quoteMultiplierMax: divide100(policy.value.quoteMultiplierMax) },
      allowAllSuppliersPro: allowPro.value,
      allowAllSuppliersCcmax: allowCcmax.value,
      forceStopCcmaxIntake: forceStop.value,
      ccmaxIntakeConcurrencyLimit: limit,
      ccmaxCreationTimeoutSeconds: timeout,
      allowAllSuppliersCcmaxReauthorization: allowReauth.value,
      version: source.data.value.version,
    });
    source.mutate(() => result);
    session.notify(t('系统参数已保存'));
    session.refresh();
  } catch (reason) {
    error.value = (reason as Error).message;
  } finally {
    saving.value = false;
  }
}
</script>

<template>
  <div class="ss-page">
    <PageHeader :title="t('系统参数')" />

    <EmptyState v-if="!canAccess" error :text="t('当前账号无权访问此页面')" />
    <Notice v-else-if="source.error.value && !source.data.value" tone="danger">
      {{ source.error.value }}
      <template #actions><Button size="sm" @click="source.reload()">{{ t('重新加载配置') }}</Button></template>
    </Notice>
    <div v-else-if="!policy || !source.data.value" class="ss-loading"><Spinner /></div>
    <template v-else>
      <form class="ss-form" @submit.prevent="save">
        <Card :title="t('CCMAX 上号')" :description="t('统一开通供应商上号资格，仍需通过强制停止与项目权限校验；关闭后按各供应商配置判断。原生 OAuth 新增上号同时执行套餐分类、每日额度及优先级规则。')">
          <div class="ss-rows">
            <SettingSwitch v-model="forceStop" :label="t('强制停止 CCMAX 新增上号')" :hint="t('优先于全局允许和供应商配置，仅停止新增上号；已有资源查询、同步和重新授权不受影响。')" :disabled="saving" />
            <SettingSwitch v-model="allowCcmax" :label="t('全部供应商允许 CCMAX 上号')" :hint="t('对供应商及其有项目权限的团队成员生效，历史资源仍可查看。')" :disabled="saving" />
            <div class="ss-number-row">
              <div class="ss-row-text">
                <strong>{{ t('每供应商同时上号数') }}</strong>
                <small id="ccmax-intake-concurrency-help">{{ t('限制同一供应商同时进行的 CCMAX 原生 OAuth 新增上号；待核对的创建继续占用名额，已生成但未提交的授权链接不占用。') }}</small>
              </div>
              <TextInput v-model="concurrency" class="ss-number" type="number" required min="1" max="1000" step="1" :disabled="saving"
                :aria-label="t('每供应商同时上号数')" aria-describedby="ccmax-intake-concurrency-help" />
            </div>
            <div class="ss-number-row">
              <div class="ss-row-text">
                <strong>{{ t('上号单次超时（秒）') }}</strong>
                <small id="ccmax-creation-timeout-help">{{ t('CCMAX 原生 OAuth 新增上号从兑换开始共用此时间预算，包含上游登录和回读；超时后保留待核对结果，不自动重复创建。已有账号重新授权不受此项限制。') }}</small>
              </div>
              <TextInput v-model="timeoutSeconds" class="ss-number" type="number" required min="1" max="300" step="1" :disabled="saving"
                :aria-label="t('上号单次超时（秒）')" aria-describedby="ccmax-creation-timeout-help" />
            </div>
          </div>
        </Card>

        <Card :title="t('CCMAX 重新授权')" :description="t('独立于新增上号；全局关闭后按各供应商的重新授权开关判断。')">
          <SettingSwitch v-model="allowReauth" :label="t('全部供应商允许 CCMAX 重新授权')" :hint="t('控制 OAuth 重新授权和凭据刷新；关闭后仍可查询已有操作。')" :disabled="saving" />
        </Card>

        <Card :title="t('PRO 推送')" :description="t('开启后所有供应商均允许推送 PRO；关闭后按各供应商自己的配置判断。')">
          <SettingSwitch v-model="allowPro" :label="t('全部供应商允许推送 PRO')" :hint="t('原生 OAuth 新增上号按上游套餐信息核验 PRO 资格，并检查交付组开关和每日可用额度。已有账号不因修改此开关自动启停。')" :disabled="saving" />
        </Card>

        <Card :title="t('会话有效期')" :description="t('空闲期控制无操作退出，绝对有效期限制单次登录总时长。保存后按新策略校验已有会话。')">
          <div class="ss-grid">
            <FormField v-for="key in (['sessionIdleMinutes', 'sessionAbsoluteMinutes'] as const)" :key="key" :label="numberLabels[key]">
              <template #default="{ id }"><TextInput :id="id" v-model="numbers[key]" type="number" required step="1" :min="NUMBER_FIELDS[key][0]" :max="NUMBER_FIELDS[key][1]" /></template>
            </FormField>
          </div>
        </Card>

        <Card :title="t('密码策略')" :description="t('用于创建、重置和修改密码；不会直接改写已有密码。')">
          <div class="ss-stack">
            <div class="ss-grid">
              <FormField v-for="key in (['passwordMinLength', 'passwordMaxLength'] as const)" :key="key" :label="numberLabels[key]">
                <template #default="{ id }"><TextInput :id="id" v-model="numbers[key]" type="number" required step="1" :min="NUMBER_FIELDS[key][0]" :max="NUMBER_FIELDS[key][1]" /></template>
              </FormField>
            </div>
            <div class="ss-checks">
              <label v-for="key in (['requireUpper', 'requireLower', 'requireDigit', 'requireSymbol'] as const)" :key="key" class="ss-check">
                <input type="checkbox" :checked="!!policy[key]" @change="setCheck(key, ($event.target as HTMLInputElement).checked)" />{{ checkLabels[key] }}
              </label>
            </div>
            <Notice v-if="shortPassword" tone="warning">{{ t('当前最短密码少于 15 位。请结合账号的验证方式评估风险，避免使用可预测短密码。') }}</Notice>
          </div>
        </Card>

        <Card :title="t('初始化密码')" :description="t('每个账号独立随机生成，不使用所有人通用的固定密码。随机部分至少 12 位。')">
          <div class="ss-stack">
            <div class="ss-grid">
              <FormField :label="numberLabels.initialPasswordLength">
                <template #default="{ id }"><TextInput :id="id" v-model="numbers.initialPasswordLength" type="number" required step="1" min="12" max="72" /></template>
              </FormField>
              <FormField :label="t('生成格式')">
                <template #default="{ id }"><Select :id="id" v-model="policy.initialPasswordFormat" :options="formatOptions" :label="t('生成格式')" /></template>
              </FormField>
              <FormField class="ss-full" :label="t('可选前缀')">
                <template #default="{ id }"><TextInput :id="id" v-model="policy.initialPasswordPrefix" maxlength="8" /></template>
              </FormField>
            </div>
            <label class="ss-check">
              <input type="checkbox" :checked="!!policy.forceInitialChange" @change="setCheck('forceInitialChange', ($event.target as HTMLInputElement).checked)" />{{ checkLabels.forceInitialChange }}
            </label>
          </div>
        </Card>

        <Card :title="t('登录保护')" :description="t('达到连续失败次数后临时锁定账号；同时保留接口限流。')">
          <div class="ss-grid">
            <FormField v-for="key in (['loginMaxFailures', 'loginLockMinutes'] as const)" :key="key" :label="numberLabels[key]">
              <template #default="{ id }"><TextInput :id="id" v-model="numbers[key]" type="number" required step="1" :min="NUMBER_FIELDS[key][0]" :max="NUMBER_FIELDS[key][1]" /></template>
            </FormField>
          </div>
        </Card>

        <Card :title="t('报价折扣')" :description="t('额度报价可填小数。新提交、待审修改和调价按当前区间校验；已经通过的价格不改写。')">
          <div class="ss-grid">
            <FormField :label="t('折扣下限')">
              <template #default="{ id }">
                <TextInput :id="id" :model-value="policy.quoteMultiplierMin" inputmode="decimal" required @update:model-value="policy.quoteMultiplierMin = $event.trim()" />
              </template>
            </FormField>
            <FormField :label="t('折扣上限')">
              <template #default="{ id }">
                <TextInput :id="id" :model-value="policy.quoteMultiplierMax" inputmode="decimal" required @update:model-value="policy.quoteMultiplierMax = $event.trim()" />
              </template>
            </FormField>
          </div>
        </Card>

        <Card :title="t('审核操作')" :description="t('配置审核方式；新注册供应商的审批开关默认开启。')">
          <SettingSwitch v-model="policy.supplierRegistrationApprovalEnabled" :label="t('开启供应商注册审批')"
            :hint="t('关闭后，新自注册供应商首次建档自动通过，无需先上传资质；已有待审资料、后台创建和后续资料变更仍需人工审核。')" />
          <p class="ss-note">{{ t('供应商资料、收款账户、报价和付款实行独立审核，提交人不能审核自己的申请；平台管理员同样遵守。') }}</p>
        </Card>

        <Notice v-if="source.error.value" tone="danger">
          {{ source.error.value }}
          <template #actions><Button size="sm" @click="source.reload()">{{ t('重新加载配置') }}</Button></template>
        </Notice>
        <Notice v-if="error" tone="danger">{{ error }}</Notice>
        <footer class="ss-actions">
          <Button :disabled="saving" @click="reset">{{ t('恢复当前值') }}</Button>
          <Button type="submit" variant="primary" icon="check" :disabled="saving">{{ t(saving ? '保存中…' : '保存设置') }}</Button>
        </footer>
      </form>

      <Card class="ss-intake"><IntakePolicyPanel /></Card>
    </template>
  </div>
</template>

<style scoped>
.ss-page { display: grid; gap: 16px; }
.ss-page > .hs-page-header { margin-bottom: 4px; }
.ss-loading { display: grid; place-items: center; padding: 48px; color: var(--hs-text-3); }
.ss-form { display: grid; gap: 16px; }
.ss-rows { display: grid; }
.ss-rows > * + * { border-top: 1px solid var(--hs-divider); }
.ss-number-row { display: flex; align-items: center; justify-content: space-between; gap: 20px; padding: 12px 0; }
.ss-row-text { display: grid; gap: 3px; min-width: 0; }
.ss-row-text strong { color: var(--hs-text); font-size: var(--hs-text-sm); font-weight: 500; }
.ss-row-text small { color: var(--hs-text-3); font-size: var(--hs-text-xs); line-height: 1.6; }
.ss-number { flex: none; width: 112px; }
.ss-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 14px 16px; }
.ss-full { grid-column: 1 / -1; }
.ss-stack { display: grid; gap: 14px; }
.ss-checks { display: flex; flex-wrap: wrap; gap: 10px 22px; }
.ss-check { display: inline-flex; align-items: center; gap: 8px; color: var(--hs-text); font-size: var(--hs-text-sm); cursor: pointer; }
.ss-check input { width: 16px; height: 16px; margin: 0; accent-color: var(--hs-accent); }
.ss-note { margin: 4px 0 0; color: var(--hs-text-3); font-size: var(--hs-text-xs); line-height: 1.6; }
.ss-actions { display: flex; justify-content: flex-end; gap: 8px; }
.ss-intake { margin-top: 8px; }
@media (max-width: 640px) {
  .ss-grid { grid-template-columns: minmax(0, 1fr); }
  .ss-number-row { flex-direction: column; align-items: stretch; }
  .ss-number { width: 100%; }
}
</style>
