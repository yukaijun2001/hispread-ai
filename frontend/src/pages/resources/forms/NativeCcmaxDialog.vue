<script setup lang="ts">
// Detail of a resource linked to an existing CCMAX native account: usage query,
// credential refresh, reauthorization (link + callback), pause / resume and,
// for admins, archive. Any write whose outcome is unknown becomes the pending
// operation; it must be reconciled before another write, and its request key
// is reused so a retry can never write twice.
import { computed, ref, shallowRef, watch } from 'vue';
import Dialog from '../../../components/ui/Dialog.vue';
import Button from '../../../components/ui/Button.vue';
import Notice from '../../../components/ui/Notice.vue';
import DetailList from '../../../components/ui/DetailList.vue';
import FormField from '../../../components/ui/FormField.vue';
import TextInput from '../../../components/ui/TextInput.vue';
import { useApiData } from '../../../composables/useApiData';
import { apiFetch, apiPost } from '../../../lib/api';
import { t, translateServerMessage } from '../../../lib/i18n';
import { useSessionStore } from '../../../stores/session';
import { beijingDateTime, enc, type Resource } from '../resources';
import type { SubmissionCapabilities } from '../composables/useIntakeAccess';
import { createLifecycleIntent, lifecycleMessage, lifecycleOutcome, type LifecycleReceipt } from '../runtime/lifecycleIntent';
import {
  isPendingState, nativeStateLabel, operationUncertain, exchangeUncertain,
  type NativeAction, type NativeAuthorization, type NativeConfirmation, type OperationReceipt, type PendingOperation,
} from './ccmaxNative';

const props = defineProps<{ resource: Resource }>();
const emit = defineEmits<{ close: []; changed: [] }>();

const session = useSessionStore();
const path = `/resources/${enc(props.resource.id)}`;
const capabilities = useApiData<SubmissionCapabilities>(`/resources/submission-capabilities?resourceId=${enc(props.resource.id)}`, { pollMs: 30_000 });
const refreshStatus = useApiData<OperationReceipt>(`${path}/credential-refresh`);
const reauthorizationStatus = useApiData<OperationReceipt>(`${path}/reauthorizations/current`);

const current = shallowRef<Resource>(props.resource);
const busy = ref(false);
const error = ref('');
const confirmation = ref<NativeConfirmation>('');
const oauth = shallowRef<NativeAuthorization | null>(null);
const callback = ref('');
const pendingOperation = shallowRef<PendingOperation | null>(null);
const lifecycleStatus = ref('');
const lifecycle = createLifecycleIntent({ get: apiFetch, post: apiPost });
/** Request key per action (usage / credential-refresh) or per reauthorization id, kept while the outcome is unknown. */
const attemptedRequests = new Map<string, string>();

const refreshUncertain = computed(() => isPendingState(refreshStatus.data.value?.state));
const authorizationUncertain = computed(() => isPendingState(reauthorizationStatus.data.value?.state));
const checkingRefresh = computed(() => (!refreshStatus.data.value && !refreshStatus.error.value)
  || (!reauthorizationStatus.data.value && !reauthorizationStatus.error.value));
const blockedByRefresh = computed(() => checkingRefresh.value || !!refreshStatus.error.value || !!reauthorizationStatus.error.value
  || refreshUncertain.value || authorizationUncertain.value);

watch(() => refreshStatus.data.value, (previous) => {
  if (previous?.operationId && isPendingState(previous.state)) {
    pendingOperation.value ||= { kind: 'operation', id: previous.operationId };
  }
});
watch(() => reauthorizationStatus.data.value, (previous) => {
  if (previous?.id && isPendingState(previous.state)) {
    pendingOperation.value ||= { kind: 'reauthorization', id: previous.id };
    callback.value = '';
  }
});

const removed = computed(() => current.value.operationalState === 'GONE');
const paused = computed(() => current.value.operationalState === 'PAUSED');
const allowed = computed(() => !current.value.readOnly && session.has(session.user?.supplierId ? 'resource.write' : 'resource.dispatch'));
const knownCapabilities = computed(() => !!capabilities.data.value && !capabilities.error.value);
const canPause = computed(() => knownCapabilities.value && capabilities.data.value?.allowCcmaxPause === true);
const canReauthorize = computed(() => knownCapabilities.value && capabilities.data.value?.allowCcmaxReauthorization === true);
const canRemove = computed(() => knownCapabilities.value && capabilities.data.value?.allowCcmaxSafeRemoval === true);
const confirmationAllowed = computed(() => (confirmation.value === 'REMOVE' ? canRemove.value
  : confirmation.value === 'credential-refresh' ? canReauthorize.value : canPause.value));
const actionsLocked = computed(() => busy.value || removed.value || !!pendingOperation.value || blockedByRefresh.value);
const confirmationText = computed(() => (confirmation.value === 'REMOVE' ? t('确认归档该上游账号？')
  : confirmation.value === 'credential-refresh' ? t('确认刷新该真实账号凭据？') : t('确认修改该真实账号启停状态？')));

const details = computed<Array<[string, string | null | undefined]>>(() => [
  [t('资源名称'), current.value.name],
  [t('上游账号 ID'), current.value.upstreamAccountId || current.value.laneId],
  [t('供应商'), current.value.supplierName || '—'],
  [t('项目'), current.value.projectName],
  [t('账号状态'), nativeStateLabel(current.value)],
]);
const lastQueried = computed(() => beijingDateTime((current.value.usage?.queriedAt || current.value.statusSyncedAt) as string | null, t('未查询')));

const syncLifecyclePending = () => {
  const pending = lifecycle.pending();
  pendingOperation.value = pending ? { kind: 'lifecycle', ...pending } : null;
};

async function reconcilePending(): Promise<OperationReceipt | LifecycleReceipt> {
  const original = pendingOperation.value!;
  if (original.kind === 'lifecycle') {
    const result = await lifecycle.reconcile();
    syncLifecyclePending();
    lifecycleStatus.value = lifecycleMessage(result);
    if (lifecycleOutcome(result) !== 'success') throw new Error(lifecycleMessage(result));
    return result;
  }
  return original.kind === 'reauthorization'
    ? apiFetch<OperationReceipt>(`${path}/reauthorizations/${enc(original.id)}`)
    : apiPost<OperationReceipt>(`${path}/operations/${enc(original.id)}/reconcile`, {});
}

async function run(action: NativeAction) {
  if (busy.value) return;
  busy.value = true; error.value = '';
  try {
    const latest = await apiFetch<Resource>(path);
    if (latest.operationalState === 'GONE' && action !== 'reconcile-pending') throw new Error(t('账号已归档，仅可查看历史信息'));
    if (pendingOperation.value && action !== 'reconcile-pending') throw new Error(t('原操作尚未确认，请先核对原操作'));
    if (action === 'reconcile-pending') {
      const result = await reconcilePending();
      const state = result.state || '';
      if (!['UPDATED', 'SUCCESS', 'COMPLETED'].includes(state)) {
        const message = (result as OperationReceipt).message;
        throw new Error(message ? translateServerMessage(message) : t('原操作仍未确认：{0}，请人工核对，勿重复提交', [state]));
      }
      pendingOperation.value = null;
      refreshStatus.reload();
      reauthorizationStatus.reload();
    }
    if (action === 'usage' || action === 'credential-refresh') {
      const requestKey = attemptedRequests.get(action) || crypto.randomUUID();
      attemptedRequests.set(action, requestKey);
      let result: OperationReceipt;
      try {
        result = await apiPost<OperationReceipt>(`${path}/${action}`, { requestKey });
      } catch (failure) {
        if (operationUncertain(failure)) {
          try {
            const receipt = action === 'credential-refresh'
              ? await apiFetch<OperationReceipt>(`${path}/credential-refresh`)
              : await apiPost<OperationReceipt>(`${path}/${action}`, { requestKey });
            if (receipt.operationId && isPendingState(receipt.state)) pendingOperation.value = { kind: 'operation', id: receipt.operationId };
          } catch { /* Keep the original request key while the server is unavailable. */ }
        } else {
          attemptedRequests.delete(action);
        }
        if (action === 'credential-refresh') refreshStatus.reload();
        throw failure;
      }
      if (isPendingState(result.state) && result.operationId) pendingOperation.value = { kind: 'operation', id: result.operationId };
      if (!['UPDATED', 'SUCCESS'].includes(result.state)) throw new Error(t('操作未确认：{0}', [result.state]));
      attemptedRequests.delete(action);
    } else if (action === 'PAUSE' || action === 'RESUME' || action === 'REMOVE') {
      let result: LifecycleReceipt;
      try {
        result = await lifecycle.start(action, [{ resourceId: current.value.id, resourceVersion: latest.version }]);
      } finally {
        syncLifecyclePending();
      }
      lifecycleStatus.value = lifecycleMessage(result);
      if (lifecycleOutcome(result) !== 'success') throw new Error(lifecycleMessage(result));
    } else if (action === 'reauthorize') {
      oauth.value = await apiPost<NativeAuthorization>(`${path}/reauthorizations`, { requestKey: crypto.randomUUID() });
      callback.value = '';
      return;
    } else if (action === 'reauthorize-complete') {
      const authorization = oauth.value;
      if (!authorization?.id || !callback.value.trim()) throw new Error(t('请先生成链接并填写本次回调'));
      const requestKey = attemptedRequests.get(authorization.id) || crypto.randomUUID();
      attemptedRequests.set(authorization.id, requestKey);
      let result: OperationReceipt;
      try {
        // POST as in runtime/ccmax-native.js (the legacy CCMAX lane reauthorization uses PUT on the same path).
        result = await apiPost<OperationReceipt>(`${path}/reauthorizations/${enc(authorization.id)}`, { code: callback.value.trim(), requestKey });
      } catch (failure) {
        if (exchangeUncertain(failure)) {
          pendingOperation.value = { kind: 'reauthorization', id: authorization.id };
          callback.value = '';
          reauthorizationStatus.reload();
        }
        throw failure;
      }
      if (result.state !== 'SUCCESS') {
        pendingOperation.value = { kind: 'reauthorization', id: authorization.id };
        callback.value = '';
        reauthorizationStatus.reload();
        throw new Error(t('重新授权未确认：{0}，请查询原授权，勿再次兑换', [result.state]));
      }
      attemptedRequests.delete(authorization.id);
      reauthorizationStatus.reload();
      oauth.value = null;
      callback.value = '';
    }
    current.value = await apiFetch<Resource>(path);
    emit('changed');
    if (!['PAUSE', 'RESUME', 'REMOVE', 'reconcile-pending'].includes(action)) session.notify(t('CCMAX 账号信息已更新'));
  } catch (failure) {
    const pending = lifecycle.pending();
    if (pending) pendingOperation.value = { kind: 'lifecycle', ...pending };
    error.value = pending ? t('账号维护结果尚未确认，请查询原操作，勿重复提交。') : (failure as Error).message;
  } finally {
    busy.value = false;
    confirmation.value = '';
  }
}

function confirm() {
  if (confirmation.value) run(confirmation.value);
}
</script>

<template>
  <Dialog size="lg" :title="t('CCMAX 原生账号详情')" @close="emit('close')">
    <div class="rs-body">
      <DetailList :items="details" />
      <Notice>{{ t('关联已有账号不代表新建交付。状态和额度取自上游已有快照，查询时间不代表上游实时采集时间。') }}</Notice>
      <p class="rs-muted">{{ t('最近查询：{0}', [lastQueried]) }}</p>

      <Notice v-if="error" tone="danger">{{ error }}</Notice>
      <Notice v-else-if="lifecycleStatus">{{ lifecycleStatus }}</Notice>
      <div v-if="pendingOperation" class="rs-actions">
        <Button :disabled="busy" @click="run('reconcile-pending')">
          {{ pendingOperation.kind === 'reauthorization' ? t('查询原授权结果（不再次兑换）') : t('核对原操作（不重复写入）') }}
        </Button>
      </div>
      <Notice v-if="refreshUncertain" tone="warning">{{ t('原凭据刷新结果尚未确认。账号可读取不能证明刷新成功，请核对原操作，勿重新刷新。') }}</Notice>
      <Notice v-if="authorizationUncertain" tone="warning">{{ t('原授权已提交兑换，结果尚未确认。请查询原授权结果，勿再次提交回调或生成新的授权。') }}</Notice>
      <Notice v-if="refreshStatus.error.value" tone="danger">
        {{ t('原凭据刷新记录读取失败，暂不能发起新的操作。') }}
        <template #actions><Button size="sm" :disabled="busy" @click="refreshStatus.reload()">{{ t('重新读取原操作') }}</Button></template>
      </Notice>
      <Notice v-if="reauthorizationStatus.error.value" tone="danger">
        {{ t('原授权记录读取失败，暂不能发起新的操作。') }}
        <template #actions><Button size="sm" :disabled="busy" @click="reauthorizationStatus.reload()">{{ t('重新读取原授权') }}</Button></template>
      </Notice>
      <Notice v-if="removed" tone="warning">{{ t('账号已归档，所有上游操作均已禁用。') }}</Notice>
      <template v-if="allowed && !removed">
        <Notice v-if="capabilities.error.value" tone="danger">
          {{ t('操作权限读取失败，请重试。') }}
          <template #actions><Button size="sm" @click="capabilities.reload()">{{ t('重新读取权限') }}</Button></template>
        </Notice>
        <Notice v-else-if="knownCapabilities && (!canPause || !canReauthorize)">
          <template v-if="!canPause">{{ t('当前账号未开通资源启停。') }}</template>
          <template v-if="!canReauthorize">{{ t('当前账号未开通凭据刷新和重新授权。') }}</template>
        </Notice>
      </template>

      <div v-if="allowed" class="rs-actions">
        <Button :disabled="actionsLocked || !canPause" @click="confirmation = paused ? 'RESUME' : 'PAUSE'">{{ paused ? t('恢复启用') : t('停用账号') }}</Button>
        <Button :disabled="actionsLocked || !canReauthorize" @click="confirmation = 'credential-refresh'">{{ t('刷新凭据') }}</Button>
        <Button :disabled="actionsLocked || !canReauthorize" @click="run('reauthorize')">{{ t('生成重新授权链接') }}</Button>
        <Button v-if="session.user?.role === 'ADMIN'" variant="danger" :disabled="actionsLocked || !canRemove" @click="confirmation = 'REMOVE'">{{ t('归档账号') }}</Button>
      </div>
      <Notice v-if="confirmation" tone="warning">
        {{ confirmationText }}
        <template #actions>
          <Button size="sm" :variant="confirmation === 'REMOVE' ? 'danger' : 'secondary'" :disabled="busy || !confirmationAllowed" @click="confirm">{{ t('确认执行') }}</Button>
          <Button size="sm" variant="ghost" :disabled="busy" @click="confirmation = ''">{{ t('取消') }}</Button>
        </template>
      </Notice>

      <section v-if="oauth && !pendingOperation" class="rs-section rs-oauth">
        <p class="rs-muted">{{ t('授权有效至 {0}', [beijingDateTime(oauth.expiresAt, t('以官方页面为准'))]) }}</p>
        <TextInput :model-value="oauth.authUrl" multiline :rows="4" readonly :aria-label="t('授权链接')" />
        <a class="rs-link" :href="oauth.authUrl" target="_blank" rel="noopener noreferrer">{{ t('打开官方授权页面') }}</a>
        <FormField :label="t('完整回调地址或 code#state')">
          <template #default="{ id }">
            <TextInput :id="id" v-model="callback" multiline :rows="3" autocomplete="off" spellcheck="false" />
          </template>
        </FormField>
        <div class="rs-actions">
          <Button variant="primary" :disabled="busy || !callback.trim()" @click="run('reauthorize-complete')">{{ t('回填并更新原账号凭据') }}</Button>
        </div>
      </section>
    </div>
    <template #footer>
      <Button v-if="session.has('resource.usage')" :disabled="actionsLocked" @click="run('usage')">{{ busy ? t('处理中…') : t('查询状态和额度') }}</Button>
      <Button @click="emit('close')">{{ t('关闭') }}</Button>
    </template>
  </Dialog>
</template>

<style scoped>
.rs-body { display: grid; gap: 14px; }
.rs-section { display: grid; gap: 10px; }
.rs-oauth { padding: 14px; background: var(--hs-surface-subtle); border: 1px solid var(--hs-border); border-radius: var(--hs-radius-control); }
.rs-muted { margin: 0; color: var(--hs-text-3); font-size: var(--hs-text-xs); }
.rs-actions { display: flex; flex-wrap: wrap; gap: 8px; }
.rs-link { width: fit-content; color: var(--hs-accent); font-size: var(--hs-text-sm); }
</style>
