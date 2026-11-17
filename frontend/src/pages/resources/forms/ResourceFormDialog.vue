<script setup lang="ts">
// 新增交付 / 编辑草稿 for one CCMAX resource: OAuth (authorization link + pasted
// callback) or a raw credential, saved as a draft or submitted formally.
//
// Never retried automatically: a submission whose outcome is unknown keeps the
// dialog "in flight" and only 刷新交付结果 may query it. A new submission is
// recorded in sessionStorage (`supplier:pending-submission:{userId}`) before it
// is sent, so reopening the dialog after a crash queries it instead of
// submitting twice. The authorization requestKey is reused while the input
// fingerprint is unchanged; the credential requestKey lives until a submission
// is known not to have started.
import { computed, ref, shallowRef, watch } from 'vue';
import Dialog from '../../../components/ui/Dialog.vue';
import Button from '../../../components/ui/Button.vue';
import Notice from '../../../components/ui/Notice.vue';
import FormField from '../../../components/ui/FormField.vue';
import Select from '../../../components/ui/Select.vue';
import Spinner from '../../../components/ui/Spinner.vue';
import TextInput from '../../../components/ui/TextInput.vue';
import { useApiData } from '../../../composables/useApiData';
import { ApiError, apiFetch, apiPost, apiPut } from '../../../lib/api';
import { t, translateServerMessage } from '../../../lib/i18n';
import { formatDateTime } from '../../../lib/money';
import { useSessionStore } from '../../../stores/session';
import IntakeAccessNotice from '../components/IntakeAccessNotice.vue';
import ProxyCombobox from '../components/ProxyCombobox.vue';
import { useDeliveryProxies, type ProxyOption } from '../composables/useDeliveryProxies';
import { CAPABILITIES_PATH, useIntakeAccess, type SubmissionCapabilities } from '../composables/useIntakeAccess';
import {
  DELIVERY_FAILED, DELIVERY_UNCONFIRMED, credentialModeOptions, deliveryHint, dispatchInFlight, enc, pickProgress,
  type CreationProgress, type Resource,
} from '../resources';

interface Project { id: string; name: string }
interface OauthSession { sessionId: string; authUrl: string; expiresAt?: string | null }
type PendingKind = 'OAUTH' | 'CREDENTIAL';
interface PendingSubmission { id: string; kind: PendingKind }
/** Result of a supplier submission, an OAuth session read / cancel or a draft OAuth submit. */
interface SubmissionResult extends CreationProgress {
  state: string;
  message?: string | null;
  recordDiscarded?: boolean;
  resourceId?: string | null;
  laneId?: string | null;
}

// `onApiDelivery` stays a function prop: its presence decides whether the delivery-method switch is shown.
const props = defineProps<{
  resource: Resource | 'new';
  prefill?: { projectId: string; projectName: string } | null;
  onApiDelivery?: () => void;
}>();
const emit = defineEmits<{ close: []; saved: [] }>();

const isNew = props.resource === 'new';
const initial = props.resource === 'new' ? null : props.resource;
const session = useSessionStore();
const access = useIntakeAccess();
const capabilities = useApiData<SubmissionCapabilities>(initial ? `${CAPABILITIES_PATH}?resourceId=${enc(initial.id)}` : CAPABILITIES_PATH);
const storageKey = `supplier:pending-submission:${session.user?.id}`;
const projects = useApiData<{ items: Project[] }>('/projects?page=1&size=100');
const eligibleProjects = useApiData<Project[]>('/resources/eligible-projects');
const supportedModes = computed(() => capabilities.data.value?.credentialModes || []);
const supportsProxy = computed(() => capabilities.data.value?.supportsProxy === true);
const capabilitiesReady = computed(() => !!capabilities.data.value && !capabilities.error.value);
const proxies = useDeliveryProxies(supportsProxy);

function readPending(key: string): PendingSubmission | null {
  try {
    const value = JSON.parse(sessionStorage.getItem(key) || 'null');
    if (typeof value !== 'object' || !value || !('id' in value) || !('kind' in value)) return null;
    return typeof value.id === 'string' && /^[a-f0-9-]{36}$/i.test(value.id) && (value.kind === 'OAUTH' || value.kind === 'CREDENTIAL')
      ? { id: value.id, kind: value.kind } : null;
  } catch {
    return null;
  }
}

const current = shallowRef<Resource | null>(initial);
const accountName = ref(initial?.accountName || '');
const projectId = ref<string>(initial ? initial.projectId || '' : props.prefill?.projectId || '');
const project = computed(() => (projects.data.value?.items || []).find((row) => row.id === projectId.value)
  || (eligibleProjects.data.value || []).find((row) => row.id === projectId.value));
const ccmaxProject = computed(() => !!project.value && project.value.name.trim().toUpperCase().startsWith('CCMAX'));
const projectEligible = computed(() => !!eligibleProjects.data.value?.some((row) => row.id === projectId.value));
const credentialMode = ref<string>(initial ? initial.credentialMode || '' : 'OAUTH');
const oauth = shallowRef<OauthSession | null>(null);
const callback = ref('');
const refreshToken = ref('');
const accessToken = ref('');
const sessionKey = ref('');
const expiresAt = ref(initial ? String(initial.expiresAt ?? '') : '');
const proxyId = ref<string>(!initial || initial.proxySelectionRequired ? '' : initial.proxyId || '');
const canRecordProxy = computed(() => session.has('proxy.write') && session.has('proxy.read'));
const proxyText = ref('');
const proxyMode = computed(() => (proxyId.value && !proxyText.value.trim() ? 'POOL' : 'INPUT'));
const recordedProxies = shallowRef<ProxyOption[]>([]);
const selectedProxy = useApiData<ProxyOption>(() => (supportsProxy.value && proxyId.value ? `/outbound-proxies/${enc(proxyId.value)}` : null));
const proxyChecking = computed(() => proxyMode.value === 'POOL' && !!proxyId.value && selectedProxy.loading.value);
const remark = ref(initial?.remark || '');
const busy = ref(false);
let running = false;
const pending = ref<PendingSubmission | null>(isNew ? readPending(storageKey) : null);
const inFlight = ref(pending.value !== null);
const dispatchOverride = ref<string | null>(null);
const progress = shallowRef<CreationProgress>(initial ? pickProgress(initial) : {});
let submitKey = crypto.randomUUID();
const initialHint = initial ? initial.creationFailureHint || initial.dispatchFailureReason || '' : '';
const message = ref(pending.value ? t('有一次交付结果尚未确认，请先刷新交付结果。') : initialHint ? translateServerMessage(initialHint) : '');
/** In flight, or the resource is already being created / created: nothing may be edited. */
const locked = computed(() => inFlight.value || (current.value != null && (dispatchInFlight(current.value) || current.value.dispatchState === 'SUCCESS')));
const proxyOptions = computed(() => [...(selectedProxy.data.value ? [selectedProxy.data.value] : []), ...recordedProxies.value, ...proxies.data.value]
  .filter((option, index, list) => list.findIndex((other) => other.id === option.id) === index));
const selectedOption = computed(() => proxyOptions.value.find((option) => option.id === proxyId.value) || null);
const accountNameInput = ref<InstanceType<typeof TextInput> | null>(null);
const callbackInput = ref<InstanceType<typeof TextInput> | null>(null);
let authorizationRequest: { fingerprint: string; key: string; resourceId?: string; version?: number } | null = null;

// Once capabilities are known, fall back to OAuth and drop the proxy where unsupported.
watch([capabilitiesReady, () => capabilities.data.value, credentialMode, locked, supportsProxy], () => {
  if (!capabilitiesReady.value || locked.value) return;
  if (!supportedModes.value.includes(credentialMode.value)) credentialMode.value = 'OAUTH';
  if (!supportsProxy.value) { proxyId.value = ''; proxyText.value = ''; }
}, { immediate: true });

const dispatchState = computed(() => dispatchOverride.value || current.value?.dispatchState);
const merged = computed<CreationProgress>(() => ({ ...current.value, ...progress.value }));
const dispatchPending = computed(() => dispatchState.value === 'PENDING');
const retrying = computed(() => dispatchPending.value && merged.value.creationRetrying === true);
const finishedUnknown = computed(() => dispatchState.value === 'UNKNOWN' && merged.value.creationFinished === true);
const closeOnly = computed(() => finishedUnknown.value && !!current.value?.id);
const title = computed(() => {
  if (locked.value) return dispatchPending.value ? (retrying.value ? t('正在自动重试') : t('交付中')) : finishedUnknown.value ? t('交付待处理') : t('核对交付结果');
  return isNew ? t('新增交付') : t('编辑草稿');
});

const sessionPath = (id: string) => `/resources/oauth/supplier-session/${enc(id)}`;
const start = () => { running = true; busy.value = true; };
const finish = () => { running = false; busy.value = false; };
const errorMessage = (failure: unknown) => (failure as Error).message;
const errorCode = (failure: unknown) => (failure instanceof ApiError ? failure.details?.code : undefined);

/** Drop the current authorization link; a new form also cancels its server session. */
function cancelSession() {
  if (isNew && oauth.value && !pending.value) apiPost(`${sessionPath(oauth.value.sessionId)}/cancel`, {}).catch(() => undefined);
  oauth.value = null;
  callback.value = '';
}

function savePending(value: PendingSubmission | null) {
  pending.value = value;
  try {
    if (value) sessionStorage.setItem(storageKey, JSON.stringify(value));
    else sessionStorage.removeItem(storageKey);
  } catch { /* Storage unavailable: recovery relies on the open dialog. */ }
}

/** Show a re-read resource. True when it was delivered (the dialog closes). */
function applyResource(resource: Resource): boolean {
  current.value = resource;
  dispatchOverride.value = resource.dispatchState || null;
  progress.value = pickProgress(resource);
  if (isNew && resource.creationFinished && resource.id) savePending(null);
  inFlight.value = false;
  emit('saved');
  if (resource.dispatchState === 'SUCCESS') {
    session.notify(translateServerMessage(resource.message || t('资源交付成功')));
    emit('close');
    return true;
  }
  if (resource.dispatchState === 'FAILED') {
    message.value = translateServerMessage(resource.creationFailureHint || resource.message || resource.dispatchFailureReason || DELIVERY_FAILED());
    return false;
  }
  message.value = deliveryHint(resource.dispatchState, resource);
  if (!dispatchInFlight(resource)) inFlight.value = true;
  return false;
}

/** Back to an empty new form after a submission that certainly created nothing. */
function reset(text: string) {
  current.value = null;
  dispatchOverride.value = null;
  progress.value = {};
  savePending(null);
  inFlight.value = false;
  oauth.value = null;
  callback.value = '';
  authorizationRequest = null;
  submitKey = crypto.randomUUID();
  message.value = text;
}

async function applySubmission(result: SubmissionResult, kind: PendingKind) {
  dispatchOverride.value = result.state;
  progress.value = pickProgress(result);
  emit('saved');
  if (result.state === 'SUCCESS') {
    savePending(null);
    inFlight.value = false;
    session.notify(translateServerMessage(result.message || t('资源交付成功')));
    emit('close');
    return;
  }
  const failure = translateServerMessage(result.creationFailureHint || result.message || DELIVERY_FAILED());
  if (result.state === 'FAILED' && result.recordDiscarded) { reset(failure); return; }
  if (result.state === 'FAILED' && result.resourceId) {
    savePending(null);
    inFlight.value = false;
    session.notify(t('{0} 记录已保留，可在列表编辑或删除。', [failure]), true);
    emit('close');
    return;
  }
  if (result.state === 'CANCELLED' || result.state === 'EXPIRED') {
    reset(result.state === 'EXPIRED' ? t('授权会话已过期，请重新生成授权链接。')
      : kind === 'CREDENTIAL' ? t('本次提交已取消，可重新提交。') : t('本次授权已取消，请重新生成授权链接。'));
    return;
  }
  inFlight.value = true;
  message.value = result.state === 'FAILED' ? failure : deliveryHint(result.state, result);
  if (result.creationFinished && result.resourceId) savePending(null);
  if (result.resourceId) current.value = await apiFetch<Resource>(`/resources/${enc(result.resourceId)}`);
}

/** `creationNotStarted`: nothing was created, so a fresh requestKey may be used. */
async function handleNotStarted(failure: unknown): Promise<boolean> {
  if (!(failure instanceof ApiError) || failure.details?.creationNotStarted !== true) return false;
  savePending(null);
  inFlight.value = false;
  current.value = null;
  dispatchOverride.value = null;
  progress.value = {};
  submitKey = crypto.randomUUID();
  message.value = failure.message;
  if (failure.details.resourceId) {
    try {
      const latest = await apiFetch<Resource>(`/resources/${enc(failure.details.resourceId)}`);
      current.value = latest;
      dispatchOverride.value = latest.dispatchState || null;
      progress.value = pickProgress(latest);
      inFlight.value = dispatchInFlight(latest);
      if (dispatchInFlight(latest)) message.value = deliveryHint(latest.dispatchState, latest);
    } catch { /* The reset form stays usable. */ }
  }
  return true;
}

function close() {
  if (running) return;
  if (isNew && oauth.value && !pending.value) apiPost(`${sessionPath(oauth.value.sessionId)}/cancel`, {}).catch(() => undefined);
  emit('close');
}

/** 刷新交付结果: query the recorded submission or the resource. Never submits. */
async function refreshResult() {
  const restored = pending.value;
  const resource = current.value;
  if (running || (!resource && !restored)) return;
  start();
  try {
    if (isNew && restored) {
      const path = restored.kind === 'CREDENTIAL' ? `/resources/submissions/${enc(restored.id)}` : sessionPath(restored.id);
      let result: SubmissionResult;
      try {
        result = await apiFetch<SubmissionResult>(path);
      } catch (failure) {
        if (restored.kind === 'CREDENTIAL' || !(failure instanceof ApiError) || failure.status !== 404) throw failure;
        result = await apiPost<SubmissionResult>(`${path}/cancel`, {});
      }
      if (restored.kind === 'OAUTH' && result.state === 'READY') result = await apiPost<SubmissionResult>(`${path}/cancel`, {});
      await applySubmission(result, restored.kind);
      return;
    }
    applyResource(await apiFetch<Resource>(`/resources/${enc(resource!.id)}`));
  } catch (failure) {
    if (isNew && errorCode(failure) === 'OAUTH_SESSION_EXPIRED') {
      reset(t('授权会话已过期，请重新生成授权链接。'));
      return;
    }
    inFlight.value = true;
    message.value = t('交付结果查询失败：{0}。请勿重复提交。', [errorMessage(failure)]);
  } finally {
    finish();
  }
}

/**
 * 保存草稿 (formal = false), 正式提交 (formal = true) or 生成授权链接 (authorize = true).
 * Validation runs in the legacy order; the first failure is shown and nothing is sent.
 */
async function submit(formal: boolean, authorize = false) {
  if (running || locked.value) return;
  const mode = credentialMode.value;
  if (!capabilitiesReady.value || !supportedModes.value.includes(mode)) {
    message.value = capabilities.error.value || t('请等待上号方式加载完成后重试');
    return;
  }
  const editing = current.value;
  const authorization = oauth.value;
  const code = callback.value;
  message.value = '';
  if ((isNew || formal || authorize) && !(formal && mode === 'OAUTH' && authorization && code.trim())) {
    start();
    try {
      await access.requireAllowed();
    } catch (failure) {
      message.value = errorMessage(failure);
      return;
    } finally {
      finish();
    }
  }
  if (!ccmaxProject.value) { message.value = t('当前仅支持 CCMAX 项目交付'); return; }
  if (!projectId.value) { message.value = t('请选择项目'); return; }
  if (eligibleProjects.loading.value || eligibleProjects.error.value
    || (!projectEligible.value && (isNew || formal || editing?.projectId !== projectId.value))) {
    message.value = eligibleProjects.error.value || t('该项目今日没有唯一有效的已通过报价，暂不可交付');
    return;
  }
  if ((formal || authorize) && !accountName.value.trim()) {
    message.value = t('请填写CCMAX账号名称');
    accountNameInput.value?.focus();
    return;
  }
  if (supportsProxy.value && proxyMode.value === 'POOL' && proxyId.value
    && (selectedProxy.loading.value || selectedProxy.error.value || !selectedProxy.data.value?.enabled)) {
    message.value = t('请选择可用代理');
    return;
  }
  if (supportsProxy.value && proxyMode.value === 'INPUT' && proxyText.value.trim() && !canRecordProxy.value) {
    message.value = t('当前账号只能选择已有代理，请从下拉列表选择');
    return;
  }
  if (formal && !capabilities.data.value?.allowDirectCcmax && (proxyMode.value === 'INPUT' ? !proxyText.value.trim() : !proxyId.value)) {
    message.value = t('请录入代理地址或从代理池选择代理');
    return;
  }
  const refresh = refreshToken.value.trim();
  const access_ = accessToken.value.trim();
  const key = sessionKey.value.trim();
  const expiry = expiresAt.value;
  const input: Record<string, unknown> = {
    accountName: accountName.value.trim(),
    projectId: projectId.value,
    credentialMode: mode,
    remark: remark.value.trim(),
    ...(editing ? { version: editing.version } : {}),
    // Credentials belong to the project: switching project clears the stored ones.
    ...(editing && projectId.value !== editing.projectId ? { refreshToken: '', accessToken: '', sessionKey: '' } : {}),
    proxyId: supportsProxy.value ? proxyId.value : '',
    ...(editing && !proxyId.value ? { socks5: '' } : {}),
    ...(mode === 'REFRESH_TOKEN' && refresh ? { refreshToken: refresh } : {}),
    ...(mode === 'ACCESS_TOKEN' && access_ ? { accessToken: access_ } : {}),
    ...(mode === 'ACCESS_TOKEN' && refresh ? { refreshToken: refresh } : {}),
    ...(mode === 'ACCESS_TOKEN' && expiry ? { expiresAt: Number(expiry) } : {}),
    ...(mode === 'SESSION_KEY' && key ? { sessionKey: key } : {}),
  };
  if (expiry && (!/^\d+$/.test(expiry) || Number(expiry) <= 0 || !Number.isSafeInteger(Number(expiry)))) {
    message.value = t('过期时间需为正整数毫秒时间戳');
    return;
  }
  if (formal && mode === 'OAUTH' && (!authorization || !code.trim())) {
    message.value = t('请先生成授权链接并回填授权码');
    callbackInput.value?.focus();
    return;
  }
  if (formal) {
    const configured = !!editing && editing.projectId === projectId.value && editing.credentialMode === mode && !!editing.credentialConfigured;
    if (mode === 'REFRESH_TOKEN' && !refresh && !configured) { message.value = t('请填写Refresh Token'); return; }
    if (mode === 'ACCESS_TOKEN' && !access_ && !configured) { message.value = t('请填写Access Token'); return; }
    if (mode === 'SESSION_KEY' && !key && !configured) { message.value = t('请填写Session Key'); return; }
  }
  if (supportsProxy.value && proxyMode.value === 'INPUT' && proxyText.value.trim()) {
    start();
    try {
      // The server parses the address and reuses an existing proxy with the same endpoint.
      const proxy = await apiPost<ProxyOption>('/outbound-proxies/resolve', { url: proxyText.value.trim() });
      if (!proxy.enabled) throw new Error(t('该代理已停用，请启用后重试或录入其他代理'));
      if (formal && proxy.maxResources > 0 && proxy.usedResources + proxy.reservedResources >= proxy.maxResources && proxy.id !== editing?.proxyId) {
        throw new Error(t('该代理的可用名额已满，请录入其他代理'));
      }
      input.proxyId = proxy.id;
      delete input.socks5;
      proxyId.value = proxy.id;
      recordedProxies.value = [proxy, ...recordedProxies.value.filter((option) => option.id !== proxy.id)];
    } catch (failure) {
      message.value = errorMessage(failure);
      return;
    } finally {
      finish();
    }
  }

  if (formal && mode === 'OAUTH') {
    if ((!isNew && !editing) || !authorization || !code.trim()) {
      message.value = t('请先生成授权链接并回填授权码');
      return;
    }
    start();
    let keepOauthSession = false;
    try {
      if (isNew) {
        savePending({ id: authorization.sessionId, kind: 'OAUTH' });
        await applySubmission(await apiPost<SubmissionResult>('/resources/oauth/supplier-submit', {
          sessionId: authorization.sessionId, code: code.trim(), input,
        }), 'OAUTH');
        return;
      }
      const resource = editing!;
      const result = await apiPost<SubmissionResult>(`/resources/${enc(resource.id)}/oauth/supplier-submit`, {
        sessionId: authorization.sessionId, code: code.trim(), version: resource.version, remark: remark.value,
      });
      callback.value = '';
      emit('saved');
      if (result.state === 'FAILED') {
        oauth.value = null;
        current.value = { ...resource, ...pickProgress(result), dispatchState: 'FAILED', dispatchFailureReason: result.creationFailureHint || result.message || null };
        message.value = translateServerMessage(result.creationFailureHint || result.message || DELIVERY_FAILED());
        return;
      }
      if (result.state !== 'SUCCESS') {
        current.value = { ...resource, ...pickProgress(result), dispatchState: result.state };
        dispatchOverride.value = result.state;
        progress.value = pickProgress(result);
        inFlight.value = true;
        message.value = deliveryHint(result.state, result);
        return;
      }
      session.notify(translateServerMessage(result.message || t('CCMAX资源已创建（{0}）', [result.laneId])));
      emit('close');
    } catch (failure) {
      const failureCode = errorCode(failure);
      if (failureCode === 'CCMAX_INTAKE_CONCURRENCY_LIMIT') {
        keepOauthSession = true; savePending(null); inFlight.value = false; message.value = errorMessage(failure);
        return;
      }
      if (failureCode === 'OAUTH_STATE_MISMATCH') {
        keepOauthSession = true; savePending(null); inFlight.value = false; callback.value = ''; message.value = errorMessage(failure);
        return;
      }
      if (failureCode === 'OAUTH_SESSION_EXPIRED') {
        if (isNew) reset(t('授权会话已过期，请重新生成授权链接。'));
        else { authorizationRequest = null; inFlight.value = false; message.value = errorMessage(failure); }
        return;
      }
      if (isNew && await handleNotStarted(failure)) return;
      inFlight.value = true;
      message.value = t('交付结果尚未确认：{0}。请刷新交付结果，勿重复提交。', [errorMessage(failure)]);
    } finally {
      if (!keepOauthSession) { oauth.value = null; callback.value = ''; }
      finish();
    }
    return;
  }

  start();
  let submittedId: string | null = null;
  try {
    if (isNew && authorize) {
      if (authorization) {
        const previous = await apiPost<SubmissionResult>(`${sessionPath(authorization.sessionId)}/cancel`, {});
        if (!['CANCELLED', 'EXPIRED'].includes(previous.state)) {
          savePending({ id: authorization.sessionId, kind: 'OAUTH' });
          await applySubmission(previous, 'OAUTH');
          return;
        }
        oauth.value = null; callback.value = ''; authorizationRequest = null;
      }
      const fingerprint = JSON.stringify(input);
      if (authorizationRequest?.fingerprint !== fingerprint) authorizationRequest = { fingerprint, key: crypto.randomUUID() };
      oauth.value = await apiPost<OauthSession>('/resources/oauth/supplier-authorize', { ...input, requestKey: authorizationRequest.key });
      callback.value = '';
      return;
    }
    if (isNew && formal) {
      const requestKey = submitKey;
      savePending({ id: requestKey, kind: 'CREDENTIAL' });
      await applySubmission(await apiPost<SubmissionResult>('/resources/supplier-submit', { requestKey, input }), 'CREDENTIAL');
      return;
    }
    if (isNew && !formal && !authorize && authorization) {
      const previous = await apiPost<SubmissionResult>(`${sessionPath(authorization.sessionId)}/cancel`, {});
      if (previous.state !== 'CANCELLED' && previous.state !== 'EXPIRED') {
        savePending({ id: authorization.sessionId, kind: 'OAUTH' });
        await applySubmission(previous, 'OAUTH');
        return;
      }
      oauth.value = null; callback.value = '';
    }
    if (authorize && editing) {
      if (authorization) {
        const previous = await apiPost<SubmissionResult>(`${sessionPath(authorization.sessionId)}/cancel`, {});
        if (!['CANCELLED', 'EXPIRED'].includes(previous.state)) {
          dispatchOverride.value = previous.state;
          inFlight.value = true;
          message.value = deliveryHint(previous.state, previous);
          return;
        }
        oauth.value = null; callback.value = ''; authorizationRequest = null;
      }
      const unversioned = { ...input };
      delete unversioned.version;
      const fingerprint = JSON.stringify(unversioned);
      if (authorizationRequest?.fingerprint !== fingerprint || authorizationRequest.resourceId !== editing.id) {
        const saved = await apiPut<Resource>(`/resources/${enc(editing.id)}`, input);
        current.value = saved;
        emit('saved');
        authorizationRequest = { fingerprint, resourceId: saved.id, key: crypto.randomUUID(), version: saved.version };
      }
      const original = authorizationRequest;
      oauth.value = await apiPost<OauthSession>(`/resources/${enc(original.resourceId!)}/oauth/supplier-authorize`, {
        version: original.version, requestKey: original.key,
      });
      callback.value = '';
      return;
    }
    const saved = editing ? await apiPut<Resource>(`/resources/${enc(editing.id)}`, input) : await apiPost<Resource>('/resources/drafts', input);
    current.value = saved;
    emit('saved');
    if (formal) {
      submittedId = saved.id;
      applyResource(await apiPost<Resource>(`/resources/${enc(saved.id)}/submit`, { version: saved.version }));
      return;
    }
    session.notify(t('草稿已保存'));
    emit('close');
  } catch (failure) {
    const reason = errorMessage(failure);
    if (isNew && formal && await handleNotStarted(failure)) return;
    if (isNew && formal && errorCode(failure) === 'CCMAX_RAW_IMPORT_DISABLED') {
      reset(reason);
      credentialMode.value = 'OAUTH';
      capabilities.reload();
      return;
    }
    if (isNew && formal) {
      inFlight.value = true;
      message.value = t('交付结果尚未确认：{0}。请刷新交付结果，勿重复提交。', [reason]);
    } else if (submittedId) {
      // The draft was saved but the submit response was lost: show what the server has.
      inFlight.value = true;
      try {
        const latest = await apiFetch<Resource>(`/resources/${enc(submittedId)}`);
        current.value = latest;
        emit('saved');
        if (latest.dispatchState) applyResource(latest);
        else { inFlight.value = false; message.value = t('提交未完成：{0}', [reason]); }
      } catch {
        message.value = DELIVERY_UNCONFIRMED();
      }
    } else {
      message.value = reason;
    }
  } finally {
    finish();
  }
}

async function copyLink() {
  if (!oauth.value) return;
  try {
    await navigator.clipboard.writeText(oauth.value.authUrl);
    session.notify(t('授权链接已复制'));
  } catch {
    message.value = t('复制失败，请手动选中授权链接复制');
  }
}

// --- Field changes -----------------------------------------------------------------
const deliveryOptions = computed(() => [{ value: 'ccmax', label: t('CCMAX 交付') }, { value: 'api', label: t('NewAPI 资源交付') }]);
const deliveryLocked = computed(() => busy.value || !!current.value || !!oauth.value || !!refreshToken.value || !!accessToken.value || !!sessionKey.value);
function chooseDelivery(value: string) {
  if (value === 'api') props.onApiDelivery?.();
}

const projectOptions = computed(() => {
  const listed = projects.data.value?.items || [];
  const prefill = props.prefill;
  return [
    { value: '', label: t('请选择') },
    ...(isNew && prefill && !listed.some((row) => row.id === prefill.projectId) ? [{ value: prefill.projectId, label: prefill.projectName }] : []),
    ...(!isNew && !projectEligible.value && project.value ? [{ value: project.value.id, label: t('{0}（暂不可交付）', [project.value.name]) }] : []),
    ...(eligibleProjects.data.value || []).map((row) => ({ value: row.id, label: row.name })),
  ].filter((option, index, list) => list.findIndex((other) => other.value === option.value) === index);
});
function selectProject(value: string) {
  projectId.value = value;
  credentialMode.value = 'OAUTH';
  refreshToken.value = ''; accessToken.value = ''; sessionKey.value = ''; expiresAt.value = '';
  proxyId.value = '';
  oauth.value = null; callback.value = '';
  message.value = '';
}

const modeOptions = computed(() => credentialModeOptions().filter((option) => supportedModes.value.includes(option.value)));
function selectMode(value: string) {
  credentialMode.value = value;
  refreshToken.value = ''; accessToken.value = ''; sessionKey.value = ''; expiresAt.value = '';
  oauth.value = null; callback.value = '';
}

function setAccountName(value: string) {
  accountName.value = value;
  oauth.value = null; callback.value = '';
}

function typeProxy(value: string) {
  proxyText.value = value;
  proxyId.value = '';
  cancelSession();
}
function pickProxy(option: ProxyOption) {
  const changed = option.id !== proxyId.value;
  proxyId.value = option.id;
  proxyText.value = '';
  if (changed) cancelSession();
}

const modeSupported = computed(() => supportedModes.value.includes(credentialMode.value));
const proxyChosen = computed(() => (proxyMode.value === 'INPUT' ? !!proxyText.value.trim() : !!proxyId.value));
const tokenPlaceholder = computed(() => (isNew ? '' : t('留空表示不更换')));
const saveDisabled = computed(() => busy.value || proxyChecking.value || locked.value || !ccmaxProject.value || !projectId.value
  || (isNew && (!projectEligible.value || !access.allowed.value)));
const submitDisabled = computed(() => {
  const oauthReady = credentialMode.value === 'OAUTH' && !!oauth.value && !!callback.value.trim();
  return busy.value || proxyChecking.value || locked.value || !ccmaxProject.value || !projectId.value || !projectEligible.value
    || (!access.allowed.value && !oauthReady) || (credentialMode.value === 'OAUTH' && (!oauth.value || !callback.value.trim()));
});
const showMessage = computed(() => !!message.value && !(!access.allowed.value && message.value === access.deniedMessage.value));
</script>

<template>
  <Dialog size="lg" :title="title" @close="close">
    <form class="rs-form" :aria-label="t('资源交付')" method="post" @submit.prevent>
      <fieldset class="rs-fieldset rs-grid" :disabled="busy || locked">
        <FormField v-if="isNew && onApiDelivery" :label="t('交付方式')">
          <template #default="{ id }">
            <Select :id="id" model-value="ccmax" :options="deliveryOptions" :label="t('交付方式')" :disabled="deliveryLocked" @update:model-value="chooseDelivery($event as string)" />
          </template>
        </FormField>
        <FormField :label="t('资源名称')">
          <template #default="{ id }">
            <TextInput :id="id" :model-value="current?.name || ''" readonly :placeholder="t('正式提交或保存草稿后由系统生成')" />
          </template>
        </FormField>
        <FormField :label="t('所属项目')">
          <template #default="{ id }">
            <Select :id="id" :model-value="projectId" :options="projectOptions" :label="t('所属项目')" @update:model-value="selectProject($event as string)" />
          </template>
        </FormField>

        <div v-if="eligibleProjects.loading.value" class="rs-wide rs-loading"><Spinner :size="16" /></div>
        <Notice v-if="eligibleProjects.error.value" class="rs-wide" tone="danger">{{ t('可交付项目加载失败：') }}{{ eligibleProjects.error.value }}</Notice>
        <Notice v-if="!eligibleProjects.loading.value && !eligibleProjects.error.value && eligibleProjects.data.value?.length === 0" class="rs-wide" tone="danger">
          {{ t('暂无可交付项目，请先提交报价并等待审核生效。') }}
        </Notice>
        <Notice v-if="projectId && project && !ccmaxProject" class="rs-wide" tone="danger">{{ t('该项目暂未配置交付方式，目前只开放 CCMAX 项目交付。') }}</Notice>

        <template v-if="ccmaxProject">
          <FormField :label="t('CCMAX账号名称（交付账号）')" :hint="t('正式交付前必填；资源名称由系统按规则生成。')">
            <template #default="{ id }">
              <TextInput
                :id="id"
                ref="accountNameInput"
                :model-value="accountName"
                name="accountName"
                maxlength="128"
                required
                :placeholder="t('填写实际交付的账号名称')"
                @update:model-value="setAccountName"
              />
            </template>
          </FormField>
          <FormField v-if="supportedModes.length > 1" :label="t('CCMAX 凭据方式')">
            <template #default="{ id }">
              <Select :id="id" :model-value="credentialMode" :options="modeOptions" :label="t('凭据方式')" @update:model-value="selectMode($event as string)" />
            </template>
          </FormField>
          <p v-else class="rs-mode-note">{{ t('上号方式：OAuth 授权') }}</p>
          <ProxyCombobox
            v-if="supportsProxy"
            class="rs-wide"
            :value="proxyText"
            :selected="proxyMode === 'POOL' ? selectedOption : null"
            :options="proxyOptions"
            :loading="proxies.loading.value"
            :loading-more="proxies.loadingMore.value"
            :error="proxies.error.value"
            :disabled="busy || locked"
            :can-record="canRecordProxy"
            :own-proxy-id="current?.proxyId"
            @input="typeProxy"
            @select="pickProxy"
            @retry="proxies.retry()"
          />
          <template v-if="modeSupported">
            <FormField v-if="credentialMode === 'REFRESH_TOKEN' || credentialMode === 'ACCESS_TOKEN'" :label="`Refresh Token${credentialMode === 'ACCESS_TOKEN' ? t('（可选）') : ''}`">
              <template #default="{ id }">
                <TextInput :id="id" v-model="refreshToken" type="password" autocomplete="new-password" :placeholder="tokenPlaceholder" />
              </template>
            </FormField>
            <template v-if="credentialMode === 'ACCESS_TOKEN'">
              <FormField label="Access Token">
                <template #default="{ id }">
                  <TextInput :id="id" v-model="accessToken" type="password" autocomplete="new-password" :placeholder="tokenPlaceholder" />
                </template>
              </FormField>
              <FormField :label="t('过期时间（毫秒时间戳，可选）')">
                <template #default="{ id }"><TextInput :id="id" v-model="expiresAt" inputmode="numeric" /></template>
              </FormField>
            </template>
            <FormField v-if="credentialMode === 'SESSION_KEY'" label="Session Key">
              <template #default="{ id }">
                <TextInput :id="id" v-model="sessionKey" type="password" autocomplete="new-password" :placeholder="tokenPlaceholder" />
              </template>
            </FormField>
          </template>

          <section v-if="credentialMode === 'OAUTH'" class="rs-wide rs-oauth">
            <p v-if="!proxyChosen" class="rs-muted">
              {{ capabilities.data.value?.allowDirectCcmax ? t('当前CCMAX原生目标支持直连，可直接生成授权链接并回填。') : t('可先生成授权链接；补充代理后请重新生成链接再正式提交。') }}
            </p>
            <div>
              <Button :disabled="busy || proxyChecking || !access.allowed.value || !capabilitiesReady" @click="submit(false, true)">
                {{ busy ? t('正在生成…') : oauth ? t('重新生成授权链接') : t('生成授权链接') }}
              </Button>
            </div>
            <template v-if="oauth">
              <p class="rs-muted">{{ t('授权链接有效期至') }} {{ formatDateTime(oauth.expiresAt) }}</p>
              <FormField :label="t('授权链接')">
                <template #default="{ id }"><TextInput :id="id" :model-value="oauth.authUrl" multiline :rows="3" readonly /></template>
              </FormField>
              <div class="rs-oauth-actions">
                <Button size="sm" icon="link" @click="copyLink">{{ t('复制') }}</Button>
                <a class="rs-link" :href="oauth.authUrl" target="_blank" rel="noopener noreferrer">{{ t('打开浏览器') }}</a>
              </div>
              <FormField :label="t('回调地址或 code#state')">
                <template #default="{ id }">
                  <TextInput
                    :id="id"
                    ref="callbackInput"
                    v-model="callback"
                    name="callback"
                    multiline
                    :rows="3"
                    spellcheck="false"
                    autocomplete="off"
                    :placeholder="t('粘贴完整回调 URL 或 code#state')"
                  />
                </template>
              </FormField>
            </template>
          </section>
        </template>

        <FormField class="rs-wide" :label="t('备注')">
          <template #default="{ id }"><TextInput :id="id" v-model="remark" multiline :rows="3" /></template>
        </FormField>
      </fieldset>

      <Notice v-if="capabilities.error.value" tone="danger">
        {{ capabilities.error.value }}
        <template #actions><Button size="sm" @click="capabilities.reload()">{{ t('重新读取上号方式') }}</Button></template>
      </Notice>
      <IntakeAccessNotice :access="access" />
      <Notice v-if="projects.error.value" tone="danger">{{ t('项目加载失败：') }}{{ projects.error.value }}</Notice>
      <Notice v-if="showMessage" :tone="locked ? 'warning' : 'danger'">{{ message }}</Notice>
    </form>
    <template #footer>
      <Button v-if="locked" :disabled="busy" icon="refresh" @click="refreshResult">{{ busy ? t('正在查询…') : t('刷新交付结果') }}</Button>
      <Button :disabled="busy" @click="close">{{ closeOnly ? t('关闭') : t('取消') }}</Button>
      <template v-if="!closeOnly">
        <Button :disabled="saveDisabled" @click="submit(false)">{{ t('保存草稿') }}</Button>
        <Button variant="primary" :disabled="submitDisabled" @click="submit(true)">{{ busy ? t('正在处理…') : t('正式提交') }}</Button>
      </template>
    </template>
  </Dialog>
</template>

<style scoped>
.rs-form { display: grid; gap: 14px; }
.rs-fieldset { min-width: 0; margin: 0; padding: 0; border: 0; }
.rs-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 14px 16px; align-items: start; }
.rs-wide { grid-column: 1 / -1; }
.rs-loading { display: grid; place-items: center; padding: 6px; color: var(--hs-text-3); }
.rs-mode-note { grid-column: 1 / -1; margin: 0; color: var(--hs-text-3); font-size: var(--hs-text-sm); }
.rs-oauth { display: grid; gap: 12px; padding: 14px; background: var(--hs-surface-subtle); border: 1px solid var(--hs-border); border-radius: var(--hs-radius-control); }
.rs-muted { margin: 0; color: var(--hs-text-3); font-size: var(--hs-text-xs); }
.rs-oauth-actions { display: flex; align-items: center; gap: 12px; }
.rs-link { color: var(--hs-accent); font-size: var(--hs-text-sm); }
@media (max-width: 640px) { .rs-grid { grid-template-columns: minmax(0, 1fr); } }
</style>
