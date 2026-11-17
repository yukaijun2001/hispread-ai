<script setup lang="ts">
// Drawer for one resource. Supplier side: edit a draft, restore an OAuth draft,
// resubmit the CCMAX target, delete. Platform side: dispatch to a target (or
// OAuth authorize + complete) and the latest dispatch record. Results that are
// not known yet are only re-read, never resubmitted; one request key per
// drawer keeps dispatch / complete retries idempotent.
import { computed, ref, watch } from 'vue';
import Dialog from '../../../components/ui/Dialog.vue';
import Button from '../../../components/ui/Button.vue';
import IconButton from '../../../components/ui/IconButton.vue';
import Notice from '../../../components/ui/Notice.vue';
import DetailList from '../../../components/ui/DetailList.vue';
import DataTable from '../../../components/ui/DataTable.vue';
import Select from '../../../components/ui/Select.vue';
import TextInput from '../../../components/ui/TextInput.vue';
import FormField from '../../../components/ui/FormField.vue';
import Spinner from '../../../components/ui/Spinner.vue';
import { useApiData } from '../../../composables/useApiData';
import { apiFetch, apiPost } from '../../../lib/api';
import { t, translateServerMessage } from '../../../lib/i18n';
import { CREDENTIAL_MODE_LABELS } from '../../../lib/labels';
import { formatDateTime } from '../../../lib/money';
import { useSessionStore } from '../../../stores/session';
import DeliveryStateBadge from '../components/DeliveryStateBadge.vue';
import IntakeAccessNotice from '../components/IntakeAccessNotice.vue';
import ResourceHealthNotice from '../components/ResourceHealthNotice.vue';
import ResourceUsageSection from '../components/ResourceUsageSection.vue';
import { useIntakeAccess } from '../composables/useIntakeAccess';
import {
  beijingDateTime, canManualRecover, canReauthorize, canRemove, creationFailureText, DELIVERY_FAILED, DELIVERY_UNCONFIRMED,
  deliveryHint, deliveryLabel, dispatchInFlight, dispatchRecordLabel, enc, isTokenCredential, type CreationProgress, type Resource,
} from '../resources';
import ProxyReplacementHistoryDialog from './ProxyReplacementHistoryDialog.vue';
import ProxyReplacementProgressDrawer from './ProxyReplacementProgressDrawer.vue';

const props = defineProps<{ resource: Resource; supplierSide: boolean }>();
const emit = defineEmits<{
  close: [];
  edit: [resource: Resource];
  reauthorize: [resource: Resource];
  refreshCredential: [resource: Resource];
  recover: [resource: Resource, action: 'EDIT' | 'DELETE'];
  changed: [];
}>();

interface DispatchRecord extends CreationProgress { targetName: string; state: string; createdAt: string; message?: string | null }
interface Target { id: string; name: string; enabled: boolean }
interface OauthSession { sessionId: string; authUrl: string; expiresAt?: string | null }
interface DispatchResult extends CreationProgress { state: string; message?: string | null }

const session = useSessionStore();
// Read-only resources disable every action.
const may = (permission: string) => !props.resource.readOnly && session.has(permission);
const requestKey = crypto.randomUUID();

const projects = useApiData<{ items: Array<{ id: string; name: string }> }>('/projects?size=100');
const detail = useApiData<Resource>(() => `/resources/${enc(props.resource.id)}`);
const platformCcmax = computed(() => props.resource.resourceType === 'CCMAX' && !props.supplierSide && may('resource.dispatch'));
const dispatches = useApiData<DispatchRecord[]>(() => (platformCcmax.value ? `/resources/${enc(props.resource.id)}/dispatches` : null));
const targets = useApiData<Target[]>(() => (platformCcmax.value ? '/resource-targets' : null));
const eligible = useApiData<Array<{ id: string }>>(() => (props.supplierSide && may('resource.write') ? '/resources/eligible-projects' : null));
const access = useIntakeAccess(() => props.supplierSide);

// A newer row from the list replaces the loaded detail.
let shown = props.resource;
watch([() => props.resource, detail.loading, detail.error], () => {
  if (shown !== props.resource && !detail.loading.value && !detail.error.value) {
    shown = props.resource;
    const next = props.resource;
    detail.mutate(() => next);
  }
});

const targetId = ref('');
const busy = ref(false);
let running = false;
const override = ref<Resource | null>(null);
const inFlight = ref(false);
const message = ref('');
const oauth = ref<OauthSession | null>(null);
const code = ref('');
const historyOpen = ref(false);
const progressId = ref<string | null>(null);

const loaded = computed(() => !!override.value || !!detail.data.value);
const current = computed<Resource>(() => override.value || detail.data.value || props.resource);
const isCcmax = computed(() => current.value.resourceType === 'CCMAX');
const canResubmit = computed(() => props.supplierSide && isCcmax.value && may('resource.write') && current.value.state === 'DELIVERED'
  && !current.value.dispatchState && isTokenCredential(current.value));
const projectEligible = computed(() => !!eligible.data.value?.some((project) => project.id === current.value.projectId));
const pending = computed(() => inFlight.value || dispatchInFlight(current.value));
const activeDispatch = computed(() => (dispatches.data.value || []).find((record) => ['SUCCESS', 'PENDING', 'UNKNOWN'].includes(record.state)));
const blocked = computed(() => busy.value || detail.loading.value || !!detail.error.value);

const statusItems = computed<Array<[string, string]>>(() => {
  const reference = creationFailureText(current.value);
  return [[t('交付状态'), deliveryLabel(current.value)], ...(current.value.dispatchState !== 'SUCCESS' && reference ? [[t('处理参考'), reference] as [string, string]] : [])];
});
const hint = computed(() => {
  const r = current.value;
  return message.value || ((r.dispatchState === 'UNKNOWN' && r.creationFinished) || (r.dispatchState === 'PENDING' && r.creationRetrying) ? deliveryHint(r.dispatchState, r) : '');
});
const failureReason = computed(() => current.value.creationFailureHint || current.value.dispatchFailureReason || '');

const detailItems = computed<Array<[string, string | null | undefined]>>(() => {
  const r = current.value;
  return [
    [t('资源名称'), r.name],
    [t('资源类型'), r.resourceType || t('未知类型')],
    [t('项目'), r.projectName || projects.data.value?.items.find((p) => p.id === r.projectId)?.name],
    ...(props.supplierSide ? [] : [[t('供应商'), `${r.supplierName || '—'}${r.supplierCode ? t('（{0}）', [r.supplierCode]) : ''}`] as [string, string]]),
    [t('创建人'), r.creatorName || t('未知创建人')],
    [t('创建时间'), beijingDateTime(r.createdAt)],
    [t('提交时间'), beijingDateTime(r.submittedAt, dispatchInFlight(r) ? t('待确认') : t('未提交'))],
    [t('交付报价'), r.quoteBasis ? t('{0} 至 {1} · {2}', [r.quoteBasis.effectiveFrom, r.quoteBasis.effectiveTo, r.quoteBasis.currency]) : t('未交付或历史记录无快照')],
    [t('备注'), r.remark],
  ];
});
const credentialLabel = computed(() => CREDENTIAL_MODE_LABELS()[current.value.credentialMode || '']);
const targetOptions = computed(() => [
  { value: '', label: t('请选择') },
  ...(targets.data.value || []).filter((target) => target.enabled).map((target) => ({ value: target.id, label: target.name })),
]);
const dispatchColumns = [{ key: 'targetName', label: t('目标') }, { key: 'state', label: t('结果') }, { key: 'createdAt', label: t('时间') }];

const showEditDraft = computed(() => props.supplierSide && current.value.state === 'DRAFT' && !current.value.oauthRetryAvailable && !pending.value
  && current.value.dispatchState !== 'SUCCESS' && may('resource.write'));
const showDispatch = computed(() => isCcmax.value && !props.supplierSide && current.value.state === 'DELIVERED' && may('resource.dispatch')
  && activeDispatch.value?.state !== 'SUCCESS');

async function copyLaneId() {
  if (!current.value.laneId) return;
  try {
    await navigator.clipboard.writeText(current.value.laneId);
    session.notify(t('已复制'));
  } catch {
    message.value = t('复制失败，请选择内容手动复制');
  }
}

async function run(action: 'delete' | 'dispatch' | 'authorize' | 'complete') {
  if (running || pending.value) return;
  running = true; busy.value = true; message.value = '';
  const r = current.value;
  const base = `/resources/${enc(r.id)}`;
  try {
    if (action === 'delete') await apiFetch(`${base}?version=${r.version}`, { method: 'DELETE' });
    let result: DispatchResult | undefined;
    if (action === 'dispatch') result = await apiPost<DispatchResult>(`${base}/dispatch`, { targetId: targetId.value, requestKey, version: r.version });
    if (action === 'authorize') {
      oauth.value = await apiPost<OauthSession>(`${base}/oauth/authorize`, { targetId: targetId.value, version: r.version });
      return;
    }
    if (action === 'complete' && oauth.value) {
      result = await apiPost<DispatchResult>(`${base}/oauth/complete`, { sessionId: oauth.value.sessionId, code: code.value.trim(), requestKey, version: r.version });
    }
    if (action === 'delete') {
      session.notify(t('已标记删除，列表中已隐藏'));
      emit('changed');
      return;
    }
    session.refresh();
    if (result?.state === 'FAILED') {
      inFlight.value = false;
      message.value = translateServerMessage(result.message || DELIVERY_FAILED());
      return;
    }
    if (result?.state === 'UNKNOWN' || result?.state === 'PENDING') {
      inFlight.value = true;
      message.value = deliveryHint(result.state, result);
      return;
    }
    session.notify(result?.message ? translateServerMessage(result.message) : t('分发请求已完成，请核对目标状态'));
    emit('changed');
  } catch (error) {
    // A lost dispatch response may still have created the target.
    if (action === 'dispatch' || action === 'complete') {
      inFlight.value = true;
      message.value = t('交付结果尚未确认：{0}。请刷新交付结果核对，勿重复提交。', [(error as Error).message]);
    } else message.value = (error as Error).message;
  } finally {
    running = false; busy.value = false;
  }
}

async function retryOauth() {
  if (running) return;
  running = true; busy.value = true; message.value = '';
  try {
    const draft = await apiPost<Resource>(`/resources/${enc(current.value.id)}/oauth/supplier-retry`, { version: current.value.version });
    session.refresh();
    emit('edit', draft);
  } catch (error) {
    message.value = (error as Error).message;
  } finally {
    running = false; busy.value = false;
  }
}

function applySubmission(result: Resource) {
  override.value = result;
  inFlight.value = false;
  session.refresh();
  if (result.dispatchState === 'SUCCESS') {
    session.notify(translateServerMessage(result.message || t('CCMAX 目标已创建，资源交付成功')));
    emit('changed');
  } else if (result.dispatchState === 'FAILED') message.value = translateServerMessage(result.message || DELIVERY_FAILED());
  else {
    message.value = deliveryHint(result.dispatchState, result);
    if (!dispatchInFlight(result)) inFlight.value = true;
  }
}

/** Resubmit the CCMAX target, or (`check`) re-read the delivery result. */
async function resubmit(check = false) {
  if (running || (!check && (pending.value || !canResubmit.value))) return;
  running = true; busy.value = true; message.value = '';
  const base = `/resources/${enc(current.value.id)}`;
  try {
    if (!check) await access.requireAllowed();
    applySubmission(check ? await apiFetch<Resource>(base) : await apiPost<Resource>(`${base}/submit`, { version: current.value.version }));
  } catch (error) {
    const reason = (error as Error).message;
    inFlight.value = true;
    try {
      const latest = await apiFetch<Resource>(base);
      override.value = latest;
      session.refresh();
      if (latest.dispatchState) applySubmission(latest);
      else { inFlight.value = false; message.value = t('补交未完成：{0}', [reason]); }
    } catch {
      message.value = DELIVERY_UNCONFIRMED();
    }
  } finally {
    running = false; busy.value = false;
  }
}

function close() { if (!running) emit('close'); }
function openProgress(id: string) { historyOpen.value = false; progressId.value = id; }
</script>

<template>
  <Dialog v-if="!loaded" drawer size="lg" :title="resource.name" @close="emit('close')">
    <div v-if="detail.loading.value" class="rd-loading"><Spinner :size="16" /></div>
    <Notice v-else tone="danger">{{ t('详情加载失败：') }}{{ detail.error.value || t('未取得资源详情') }}</Notice>
    <template #footer>
      <span class="rd-spacer" />
      <Button v-if="detail.error.value" @click="session.refresh()">{{ t('重试加载详情') }}</Button>
      <Button @click="emit('close')">{{ t('关闭') }}</Button>
    </template>
  </Dialog>

  <Dialog v-else drawer size="lg" :title="current.name" @close="close">
    <div class="rd-body">
      <div v-if="detail.loading.value" class="rd-loading"><Spinner :size="16" /></div>
      <Notice v-if="detail.error.value" tone="danger">{{ t('详情加载失败：') }}{{ detail.error.value }}</Notice>

      <section class="rd-status">
        <DetailList :items="statusItems" />
        <Button v-if="isCcmax && !current.readOnly" size="sm" icon="refresh" @click="historyOpen = true">{{ t('代理更换记录') }}</Button>
      </section>
      <Notice v-if="failureReason" tone="danger" :title="t('交付失败原因')">{{ translateServerMessage(failureReason) }}</Notice>

      <DetailList :items="detailItems" />

      <section v-if="isCcmax" class="rd-section">
        <h3>{{ t('CCMAX 账户信息') }}</h3>
        <dl class="rd-details">
          <div><dt>{{ t('账号名称') }}</dt><dd>{{ current.accountName || t('待核实') }}</dd></div>
          <div>
            <dt>Lane ID</dt>
            <dd>
              <span v-if="current.laneId" class="rd-lane">
                <code>{{ current.laneId }}</code>
                <IconButton icon="copy" :size="14" :label="t('复制 Lane ID')" @click="copyLaneId" />
              </span>
              <template v-else>{{ t('未绑定') }}</template>
            </dd>
          </div>
          <div><dt>{{ t('凭据方式') }}</dt><dd>{{ credentialLabel || '—' }}</dd></div>
          <div>
            <dt>{{ t('代理') }}</dt>
            <dd>
              <span v-if="current.proxyConfigured || current.socks5Configured" class="rd-proxy">
                <strong>{{ current.proxyName || t('已配置') }}{{ current.proxyType ? t('（{0}）', [current.proxyType]) : '' }}</strong>
                <code v-if="current.proxyEndpoint">{{ current.proxyEndpoint }}</code>
              </span>
              <template v-else>{{ t('未配置') }}</template>
            </dd>
          </div>
          <div><dt>{{ t('凭据') }}</dt><dd>{{ current.credentialMode === 'OAUTH' ? t('分发时授权') : current.credentialConfigured ? t('已配置') : t('未配置') }}</dd></div>
        </dl>
        <ResourceHealthNotice :resource="current" />
        <div v-if="canReauthorize(current, supplierSide, may)" class="rd-actions">
          <Button @click="emit('refreshCredential', current)">{{ t('强制刷新授权') }}</Button>
          <Button @click="emit('reauthorize', current)">{{ t('重新授权') }}</Button>
        </div>
      </section>

      <ResourceUsageSection :resource="current" />

      <section v-if="supplierSide && current.settlementMethod === 'ACCOUNT_BUYOUT' && current.state === 'DELIVERED'" class="rd-section">
        <h3>{{ t('买断金额') }}</h3>
        <DetailList :items="[[t('每个账号价格'), current.buyoutAmount == null ? t('报价快照缺失') : `${current.buyoutAmount} ${current.buyoutCurrency || ''}`]]" />
      </section>

      <div v-if="showEditDraft || (supplierSide && current.oauthRetryAvailable && may('resource.write')) || canManualRecover(current, supplierSide, may) || canRemove(current, supplierSide, may)" class="rd-actions">
        <Button v-if="showEditDraft" :disabled="blocked" @click="emit('edit', current)">
          {{ current.credentialMode === 'OAUTH' && current.dispatchState === 'FAILED' ? t('重新授权') : t('编辑草稿') }}
        </Button>
        <Button v-if="supplierSide && current.oauthRetryAvailable && may('resource.write')" variant="primary" :disabled="blocked" :loading="busy" @click="retryOauth">
          {{ busy ? t('正在恢复草稿…') : t('重新授权') }}
        </Button>
        <template v-if="canManualRecover(current, supplierSide, may)">
          <Button v-if="supplierSide" :disabled="blocked" @click="emit('recover', current, 'EDIT')">{{ t('编辑') }}</Button>
          <Button variant="danger" :disabled="blocked" @click="emit('recover', current, 'DELETE')">{{ t('删除') }}</Button>
        </template>
        <Button v-if="canRemove(current, supplierSide, may)" variant="danger" :disabled="blocked" @click="run('delete')">{{ t('删除') }}</Button>
      </div>

      <section v-if="canResubmit" class="rd-section">
        <h3>{{ t('补交 CCMAX 目标') }}</h3>
        <IntakeAccessNotice :access="access" />
        <Notice>{{ t('此记录已保存在本地，但尚未创建 CCMAX 目标。补交成功后才算交付成功。') }}</Notice>
        <Notice v-if="eligible.error.value" tone="danger">{{ t('交付资格查询失败：') }}{{ eligible.error.value }}</Notice>
        <Notice v-if="!eligible.loading.value && !eligible.error.value && !projectEligible" tone="danger">{{ t('当前项目不满足交付资格，请先核对项目授权和当日生效报价。') }}</Notice>
        <div class="rd-actions">
          <Button
            variant="primary"
            :disabled="blocked || pending || !access.allowed.value || eligible.loading.value || !!eligible.error.value || !projectEligible"
            :loading="busy"
            @click="resubmit()"
          >{{ busy ? t('正在补交…') : t('补交目标') }}</Button>
        </div>
      </section>

      <div v-if="isCcmax && pending && may(supplierSide ? 'resource.write' : 'resource.dispatch')" class="rd-actions">
        <Button icon="refresh" :disabled="busy" @click="resubmit(true)">{{ busy ? t('正在查询…') : t('刷新交付结果') }}</Button>
      </div>
      <Notice v-if="hint" :tone="pending ? 'warning' : 'danger'">{{ hint }}</Notice>

      <section v-if="showDispatch" class="rd-section">
        <h3>{{ t('交付记录') }}</h3>
        <Notice v-if="targets.error.value" tone="danger">{{ t('目标加载失败：') }}{{ targets.error.value }}</Notice>
        <template v-if="!activeDispatch && !pending">
          <FormField :label="t('目标服务')">
            <template #default="{ id }"><Select :id="id" v-model="targetId" :options="targetOptions" :label="t('目标服务')" :placeholder="t('请选择')" @update:model-value="oauth = null" /></template>
          </FormField>
          <template v-if="current.credentialMode === 'OAUTH'">
            <div class="rd-actions"><Button :disabled="busy || !targetId" @click="run('authorize')">{{ t('生成授权入口') }}</Button></div>
            <div v-if="oauth" class="rd-oauth">
              <Notice>{{ t('授权入口有效期至 ') }}{{ formatDateTime(oauth.expiresAt) }}{{ t('。请有权人员完成登录并回填授权码。') }}</Notice>
              <a :href="oauth.authUrl" target="_blank" rel="noopener noreferrer">{{ t('打开授权页面') }}</a>
              <FormField :label="t('授权码')">
                <template #default="{ id }"><TextInput :id="id" v-model="code" type="password" autocomplete="off" /></template>
              </FormField>
              <div class="rd-actions">
                <Button variant="primary" :disabled="busy || !code.trim()" :loading="busy" @click="run('complete')">{{ t('完成授权并分发') }}</Button>
              </div>
            </div>
          </template>
          <div v-else class="rd-actions">
            <Button variant="primary" :disabled="busy || !targetId" :loading="busy" @click="run('dispatch')">{{ busy ? t('正在分发…') : t('分发到目标') }}</Button>
          </div>
        </template>
        <Notice v-if="dispatches.error.value" tone="danger">{{ t('分发记录加载失败：') }}{{ dispatches.error.value }}</Notice>
        <div class="rd-table">
          <DataTable
            :columns="dispatchColumns"
            :rows="dispatches.data.value?.slice(0, 1) ?? []"
            :row-key="(record: DispatchRecord) => `${record.targetName}-${record.createdAt}`"
            :loading="dispatches.loading.value"
            :label="t('交付记录')"
            :skeleton-rows="1"
          >
            <template #cell-state="{ row }">
              <DeliveryStateBadge :state="row.state === 'FAILED' ? 'FAILURE' : row.state" :label="dispatchRecordLabel(row)" :progress="row" />
            </template>
            <template #cell-createdAt="{ row }">{{ formatDateTime(row.createdAt) }}</template>
          </DataTable>
        </div>
      </section>

      <section v-if="isCcmax && current.state === 'DELIVERED' && !(supplierSide && current.settlementMethod === 'ACCOUNT_BUYOUT')" class="rd-section">
        <h3>{{ t('消费金额（CC目标）') }}</h3>
        <DetailList :items="[[t('Token 消费总额'), current.usage?.amount == null ? t('未查询') : `${current.usage.amount} ${current.usage.currency || 'USD'}`]]" />
      </section>
    </div>

    <template #footer>
      <span class="rd-spacer" />
      <Button :disabled="busy" @click="emit('close')">{{ t('关闭') }}</Button>
    </template>
  </Dialog>

  <ProxyReplacementHistoryDialog v-if="historyOpen" :resource-id="current.id" @close="historyOpen = false" @open="openProgress" />
  <ProxyReplacementProgressDrawer v-if="progressId" :id="progressId" @close="progressId = null" @completed="session.refresh()" />
</template>

<style scoped>
.rd-body { display: grid; gap: 18px; }
.rd-loading { display: grid; place-items: center; padding: 12px; color: var(--hs-text-3); }
.rd-status { display: flex; align-items: flex-start; justify-content: space-between; gap: 16px; padding: 14px 16px; background: var(--hs-surface-subtle); border: 1px solid var(--hs-border); border-radius: 14px; }
.rd-status > :first-child { flex: 1; }
.rd-section { display: grid; gap: 12px; padding-top: 16px; border-top: 1px solid var(--hs-divider); }
.rd-section h3 { margin: 0; font-size: var(--hs-text-sm); font-weight: 600; }
.rd-details { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 14px 24px; margin: 0; }
.rd-details dt { color: var(--hs-text-3); font-size: var(--hs-text-xs); }
.rd-details dd { margin: 3px 0 0; color: var(--hs-text); font-size: var(--hs-text-sm); line-height: 1.6; overflow-wrap: anywhere; }
.rd-details code { font-family: var(--hs-font-mono); font-size: var(--hs-text-xs); overflow-wrap: anywhere; }
.rd-lane { display: inline-flex; align-items: center; gap: 4px; }
.rd-proxy { display: grid; gap: 2px; }
.rd-actions { display: flex; flex-wrap: wrap; gap: 8px; }
.rd-oauth { display: grid; gap: 10px; }
.rd-oauth a { color: var(--hs-accent); font-size: var(--hs-text-sm); }
.rd-table { border: 1px solid var(--hs-border); border-radius: 12px; overflow: hidden; }
.rd-spacer { flex: 1; }
@media (max-width: 560px) { .rd-details { grid-template-columns: minmax(0, 1fr); } }
</style>
