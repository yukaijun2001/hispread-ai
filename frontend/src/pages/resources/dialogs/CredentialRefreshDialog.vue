<script setup lang="ts">
// Force a credential refresh with the Refresh Token CCMAX already holds. The
// request id stays the same until the previous refresh is complete or failed,
// so asking again after a lost response continues the original operation.
import { onBeforeUnmount, onMounted, ref, computed } from 'vue';
import Dialog from '../../../components/ui/Dialog.vue';
import Button from '../../../components/ui/Button.vue';
import DetailList from '../../../components/ui/DetailList.vue';
import Notice from '../../../components/ui/Notice.vue';
import Spinner from '../../../components/ui/Spinner.vue';
import { ApiError, apiFetch, apiPost } from '../../../lib/api';
import { t } from '../../../lib/i18n';
import type { CredentialRefresh } from '../proxyReplacement';
import { enc, type Resource } from '../resources';

const props = defineProps<{ resource: Resource }>();
const emit = defineEmits<{ close: []; changed: []; reauthorize: [] }>();

const path = `/resources/${enc(props.resource.id)}/credential-refresh`;
const record = ref<CredentialRefresh | null>(null);
const allowed = ref(false);
const busy = ref(false);
const error = ref('');
let requestId = crypto.randomUUID();
let inFlight = false;
let active = true;

onMounted(() => {
  apiFetch<CredentialRefresh>(path)
    .then((value) => { if (active) { record.value = value; allowed.value = value.reauthorizationAllowed === true; } })
    .catch((failure: Error) => { if (active) error.value = failure.message; });
});
onBeforeUnmount(() => { active = false; });

async function query() {
  if (inFlight) return;
  inFlight = true; busy.value = true; error.value = '';
  try {
    const value = await apiFetch<CredentialRefresh>(path);
    record.value = value;
    allowed.value = value.reauthorizationAllowed === true;
    if (['complete', 'FAILED'].includes(value.status || '')) requestId = crypto.randomUUID();
  } catch (failure) {
    error.value = (failure as Error).message;
  } finally {
    busy.value = false; inFlight = false;
  }
}

/** `continueSaved` resumes the original operation whose credential is already saved. */
async function submit(continueSaved: boolean) {
  if (inFlight) return;
  inFlight = true; busy.value = true; error.value = '';
  try {
    const value = await apiPost<CredentialRefresh>(path, { requestId: continueSaved ? record.value?.id : requestId, version: props.resource.version });
    record.value = value;
    if (value.status === 'complete' || value.status === 'FAILED') { requestId = crypto.randomUUID(); emit('changed'); }
  } catch (failure) {
    error.value = (failure as Error).message;
    if (failure instanceof ApiError && failure.status === 403) allowed.value = false;
    else record.value = { id: requestId, status: 'UNKNOWN' };
  } finally {
    busy.value = false; inFlight = false;
  }
}

const status = computed(() => record.value?.status || '');
const details = computed<Array<[string, string]>>(() => [[t('资源'), props.resource.name], ['Lane ID', props.resource.laneId || '']]);
</script>

<template>
  <Dialog :title="t('强制刷新授权')" size="lg" @close="!busy && emit('close')">
    <div class="rs-refresh">
      <DetailList :items="details" />
      <p class="rs-refresh-muted">{{ t('使用 CCMAX 已保存的 Refresh Token 立即刷新，无需重新登录。原账号、代理和历史账单保留。') }}</p>
      <div v-if="!record && !error" class="rs-refresh-loading"><Spinner :size="16" /></div>
      <Notice v-if="record && !allowed" tone="danger">{{ t('当前供应商未开通 CCMAX 重新授权，请联系平台管理员。') }}</Notice>
      <Notice v-if="error" tone="danger">{{ error }}</Notice>
      <Notice v-if="status === 'saved'" tone="info">{{ t('新凭据已保存，等待运行实例同步。请继续同步，不要重新发起刷新。') }}</Notice>
      <Notice v-if="status === 'SUBMITTING'" tone="info">{{ t('正在刷新授权，请稍后查询原操作结果。') }}</Notice>
      <Notice v-if="status === 'UNKNOWN'" tone="danger">{{ t('刷新结果待确认。请先查询原操作，不要重复刷新；仍无法确认时可通过 OAuth 重新授权。') }}</Notice>
      <Notice v-if="status === 'FAILED'" tone="danger">{{ t('刷新未恢复账号授权，可能没有可用 RT 或账号仍受限制。请使用重新授权，并检查账号状态。') }}</Notice>
      <Notice v-if="status === 'complete'" tone="success">{{ t('授权刷新及凭据同步完成。账号是否接单仍取决于暂停、额度和限流状态。') }}</Notice>
      <Notice v-if="record?.paused" tone="info">{{ t('账号仍处于暂停状态，刷新授权不会解除暂停。') }}</Notice>
      <p v-if="status === 'NONE'" class="rs-refresh-text">{{ t('刷新授权不会解除暂停、休眠、限流或额度限制。RT 失效或未保存时，请改用「重新授权」。') }}</p>
    </div>

    <template #footer>
      <Button :disabled="busy" @click="emit('close')">{{ t('关闭') }}</Button>
      <Button v-if="!record || ['SUBMITTING', 'UNKNOWN'].includes(status)" :disabled="busy" @click="query">{{ t('查询操作结果') }}</Button>
      <Button v-if="['FAILED', 'UNKNOWN'].includes(status)" :disabled="busy || !allowed" @click="emit('reauthorize')">{{ t('OAuth 重新授权') }}</Button>
      <Button v-if="status === 'saved'" variant="primary" :disabled="busy || !allowed" @click="submit(true)">{{ busy ? t('同步中…') : t('继续同步') }}</Button>
      <Button v-if="record && ['NONE', 'FAILED', 'complete'].includes(status)" variant="primary" :disabled="busy || !allowed" @click="submit(false)">
        {{ busy ? t('刷新中…') : t('确认刷新授权') }}
      </Button>
    </template>
  </Dialog>
</template>

<style scoped>
.rs-refresh { display: grid; gap: 14px; }
.rs-refresh-muted { margin: 0; color: var(--hs-text-3); font-size: var(--hs-text-sm); }
.rs-refresh-text { margin: 0; color: var(--hs-text-2); font-size: var(--hs-text-sm); }
.rs-refresh-loading { display: grid; place-items: center; padding: 12px; color: var(--hs-text-3); }
</style>
