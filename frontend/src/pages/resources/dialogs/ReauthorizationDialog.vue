<script setup lang="ts">
// Reauthorize an existing CCMAX account (OAuth login to the original account or
// a new Refresh Token). A submitted reauthorization is polled every 3 s while
// it is in progress; an unknown outcome is only ever queried, never resubmitted.
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import Dialog from '../../../components/ui/Dialog.vue';
import Button from '../../../components/ui/Button.vue';
import DetailList from '../../../components/ui/DetailList.vue';
import FormField from '../../../components/ui/FormField.vue';
import Notice from '../../../components/ui/Notice.vue';
import Select from '../../../components/ui/Select.vue';
import Spinner from '../../../components/ui/Spinner.vue';
import TextInput from '../../../components/ui/TextInput.vue';
import { ApiError, apiFetch, apiPost, apiPut } from '../../../lib/api';
import { t, translateServerMessage } from '../../../lib/i18n';
import { formatDateTime } from '../../../lib/money';
import { REAUTH_POLLING, REAUTH_STATUS_LABELS, type Reauthorization } from '../proxyReplacement';
import { enc, type Resource } from '../resources';

type Mode = 'OAUTH' | 'REFRESH_TOKEN';

const props = defineProps<{ resource: Resource }>();
const emit = defineEmits<{ close: []; changed: [] }>();

const base = `/resources/${enc(props.resource.id)}/reauthorizations`;
const record = ref<Reauthorization | null>(null);
const allowed = ref(false);
const mode = ref<Mode>('OAUTH');
const code = ref('');
const refreshToken = ref('');
const accessToken = ref('');
const expiresAt = ref('');
const error = ref('');
const loading = ref(true);
const busy = ref(false);
let inFlight = false;
let active = true;
let changedReported = false;
let pollTimer: number | undefined;

function clearInputs() { code.value = ''; refreshToken.value = ''; accessToken.value = ''; expiresAt.value = ''; }

function apply(value: Reauthorization) {
  if (!active) return;
  record.value = value;
  if (value.reauthorizationAllowed !== undefined) allowed.value = value.reauthorizationAllowed;
  if (value.mode) mode.value = value.mode;
  if (value.status === 'complete' && !changedReported) { changedReported = true; emit('changed'); }
  if (value.credentialSaved) clearInputs();
  if (value.queryFailed) error.value = value.message ? translateServerMessage(value.message) : t('进度查询失败，请稍后重试。');
}

async function loadCurrent() {
  loading.value = true; error.value = '';
  try {
    apply(await apiFetch<Reauthorization>(`${base}/current`));
  } catch (failure) {
    if (active) error.value = (failure as Error).message;
    if (failure instanceof ApiError && failure.status === 403) allowed.value = false;
  } finally {
    if (active) loading.value = false;
  }
}
onMounted(loadCurrent);
onBeforeUnmount(() => { active = false; window.clearTimeout(pollTimer); });

async function run(action: () => Promise<Reauthorization>) {
  if (inFlight) return;
  inFlight = true; busy.value = true; error.value = '';
  try {
    apply(await action());
  } catch (failure) {
    if (active) error.value = (failure as Error).message;
    if (failure instanceof ApiError && failure.status === 403) allowed.value = false;
  } finally {
    inFlight = false;
    if (active) busy.value = false;
  }
}

const queryProgress = () => run(() => apiFetch<Reauthorization>(`${base}/${enc(record.value!.id!)}`));

watch([record, error, busy], () => {
  window.clearTimeout(pollTimer);
  const current = record.value;
  if (!current?.id || !current.submitted || error.value || busy.value || !REAUTH_POLLING.has(current.status || '')) return;
  pollTimer = window.setTimeout(() => { void queryProgress(); }, 3000);
});

const status = computed(() => record.value?.status || 'NONE');
const showStart = computed(() => allowed.value && (!!record.value?.expiredUnsaved
  || ['NONE', 'INITIALIZING', 'READY', 'FAILED', 'CANCELLED', 'complete', 'superseded', 'NOT_FOUND', 'exchanging'].includes(status.value))
  && !record.value?.busy);
/** The previous exchange is unclear or expired: only a fresh OAuth login is safe. */
const oauthOnly = computed(() => !!record.value?.expiredUnsaved || ['NOT_FOUND', 'exchanging'].includes(status.value));
const showSubmit = computed(() => allowed.value && !!record.value?.id && ['READY', 'staged', 'NOT_FOUND', 'UNKNOWN'].includes(status.value)
  && !record.value.busy && !record.value.expiredUnsaved);

async function start(chosen: Mode) {
  await run(async () => {
    const created = await apiPost<Reauthorization>(base, { version: props.resource.version, mode: chosen });
    clearInputs();
    changedReported = false;
    return created;
  });
}

async function submit() {
  const current = record.value;
  if (!current?.id) return;
  const expiry = expiresAt.value;
  if (current.mode === 'REFRESH_TOKEN' && expiry && (!/^\d+$/.test(expiry) || Number(expiry) <= Date.now() || !Number.isSafeInteger(Number(expiry)))) {
    error.value = t('有效期请填写未来的 Unix 毫秒时间戳。');
    return;
  }
  const body = current.mode === 'OAUTH'
    ? { code: code.value.trim() }
    : {
      refreshToken: refreshToken.value.trim(),
      ...(accessToken.value.trim() ? { accessToken: accessToken.value.trim() } : {}),
      ...(expiry ? { expiresAt: Number(expiry) } : {}),
    };
  await run(() => apiPut<Reauthorization>(`${base}/${enc(current.id!)}`, body));
}

function copyLink() {
  const url = record.value?.authUrl;
  if (url) navigator.clipboard.writeText(url).catch(() => { error.value = t('复制失败，请手动复制授权链接。'); });
}

const modeOptions = computed(() => [
  { value: 'OAUTH' as Mode, label: t('OAuth 登录原账号（推荐）') },
  { value: 'REFRESH_TOKEN' as Mode, label: t('更新 Refresh Token') },
]);
const modeValue = computed({
  get: (): Mode => (oauthOnly.value ? 'OAUTH' : mode.value),
  set: (value: Mode | Mode[] | '') => { if (value === 'OAUTH' || value === 'REFRESH_TOKEN') mode.value = value; },
});
const details = computed<Array<[string, string]>>(() => [[t('资源'), props.resource.name], ['Lane ID', props.resource.laneId || '']]);
const submitDisabled = computed(() => busy.value || (record.value?.mode === 'OAUTH' ? !code.value.trim() : !refreshToken.value.trim()));
</script>

<template>
  <Dialog :title="t('已有账号重新授权')" size="lg" @close="!busy && emit('close')">
    <div class="rs-reauth">
      <DetailList :items="details" />
      <p class="rs-reauth-muted">{{ t('请使用原 Claude 账号授权。原资源、历史账单、供应商归属和代理配置保留。') }}</p>

      <div v-if="loading" class="rs-reauth-loading"><Spinner :size="16" /></div>
      <template v-else>
        <Notice v-if="!allowed" tone="danger">{{ t('当前供应商未开通 CCMAX 重新授权，请联系平台管理员。') }}</Notice>
        <Notice v-if="record" :tone="status === 'complete' ? 'success' : 'info'" :title="REAUTH_STATUS_LABELS()[status] || status">
          <p v-if="record.paused" class="rs-reauth-line">{{ t('账号当前仍暂停；重新授权不会解除暂停、休眠或风控限制。') }}</p>
          <p v-if="record.updatedAt" class="rs-reauth-line">{{ t('更新于') }} {{ formatDateTime(record.updatedAt) }}</p>
        </Notice>
        <p v-if="status === 'complete'" class="rs-reauth-text">{{ t('新凭据已持久保存，运行实例已完成同步。可在资源列表同步最新账号状态。') }}</p>
        <Notice v-if="['UNKNOWN', 'NOT_FOUND', 'exchanging'].includes(status)" tone="danger">
          {{ t('请先查询原操作。交换结果不明时，请重新生成 OAuth 链接登录原账号，勿重复使用一次性授权码或 RT。') }}
        </Notice>
        <Notice v-if="record?.expiredUnsaved" tone="danger">{{ t('本次暂存凭据已过期，请查询原操作后重新生成 OAuth 链接登录原账号。') }}</Notice>
        <p v-if="status === 'staged' && !record?.expiredUnsaved" class="rs-reauth-text">{{ t('可使用原操作和完全相同的输入继续保存，不会重新交换凭据。') }}</p>
        <Notice v-if="error" tone="danger">{{ error }}</Notice>

        <div v-if="showStart" class="rs-reauth-start">
          <FormField :label="t('重新授权方式')">
            <Select v-model="modeValue" :options="modeOptions" :label="t('重新授权方式')" :disabled="busy || oauthOnly" />
          </FormField>
          <div>
            <Button :disabled="busy" @click="start(oauthOnly ? 'OAUTH' : mode)">
              {{ busy ? t('处理中…') : oauthOnly || mode === 'OAUTH' ? t('生成新的授权链接') : t('开始更新凭据') }}
            </Button>
          </div>
        </div>

        <section v-if="record?.authUrl && status === 'READY'" class="rs-reauth-link">
          <p class="rs-reauth-muted">{{ t('授权链接有效期至') }} {{ formatDateTime(record.expiresAt) }}</p>
          <FormField v-slot="{ id }" :label="t('授权链接')">
            <TextInput :id="id" :model-value="record.authUrl" multiline :rows="3" readonly />
          </FormField>
          <div class="rs-reauth-actions">
            <a :href="record.authUrl" target="_blank" rel="noopener noreferrer">{{ t('打开授权页面') }}</a>
            <Button size="sm" icon="copy" @click="copyLink">{{ t('复制链接') }}</Button>
          </div>
        </section>
        <p v-if="status === 'READY' && mode === 'OAUTH' && !record?.authUrl" class="rs-reauth-muted">
          {{ t('授权链接不会在关闭后保留。可填写之前取得的授权码，或生成新链接。') }}
        </p>

        <div v-if="showSubmit" class="rs-reauth-form">
          <FormField v-if="record?.mode === 'OAUTH'" v-slot="{ id }" :label="t('授权码')">
            <TextInput :id="id" v-model="code" multiline :rows="3" autocomplete="off" :disabled="busy" />
          </FormField>
          <template v-else>
            <FormField v-slot="{ id }" label="Refresh Token">
              <TextInput :id="id" v-model="refreshToken" type="password" autocomplete="new-password" :disabled="busy" />
            </FormField>
            <FormField v-slot="{ id }" :label="t('Access Token（可选）')">
              <TextInput :id="id" v-model="accessToken" type="password" autocomplete="new-password" :disabled="busy" />
            </FormField>
            <FormField v-slot="{ id }" :label="t('有效期（可选，Unix 毫秒时间戳）')">
              <TextInput :id="id" v-model="expiresAt" inputmode="numeric" :disabled="busy" />
            </FormField>
          </template>
        </div>
      </template>

      <Notice v-if="loading && error" tone="danger">{{ error }}</Notice>
      <div v-if="!loading && (!record || !!error || status === 'INITIALIZING')">
        <Button size="sm" icon="refresh" :disabled="busy" @click="loadCurrent">{{ t('重新读取授权记录') }}</Button>
      </div>
    </div>

    <template #footer>
      <Button :disabled="busy" @click="emit('close')">{{ t('关闭') }}</Button>
      <Button v-if="record?.submitted && record.id" :disabled="busy" @click="queryProgress">{{ busy ? t('查询中…') : t('查询授权进度') }}</Button>
      <Button v-if="showSubmit" variant="primary" :disabled="submitDisabled" @click="submit">
        {{ busy ? t('正在提交…') : record?.submitted ? t('使用原操作继续提交') : t('提交重新授权') }}
      </Button>
    </template>
  </Dialog>
</template>

<style scoped>
.rs-reauth { display: grid; gap: 14px; }
.rs-reauth-muted { margin: 0; color: var(--hs-text-3); font-size: var(--hs-text-sm); }
.rs-reauth-text { margin: 0; color: var(--hs-text-2); font-size: var(--hs-text-sm); }
.rs-reauth-line { margin: 4px 0 0; }
.rs-reauth-loading { display: grid; place-items: center; padding: 12px; color: var(--hs-text-3); }
.rs-reauth-start, .rs-reauth-form, .rs-reauth-link { display: grid; gap: 12px; }
.rs-reauth-actions { display: flex; align-items: center; gap: 12px; }
.rs-reauth-actions a { color: var(--hs-accent); font-size: var(--hs-text-sm); }
</style>
