<script setup lang="ts">
// 新增交付 for NewAPI (API key) resources: smart recognition or manual fields →
// preview (核对资料) → submit as resource intakes that are assigned to a quote
// project later. Any edit bumps `revision`, which discards an outstanding
// preview and ignores late responses. One requestKey per dialog.
import { computed, ref, shallowRef } from 'vue';
import Dialog from '../../../components/ui/Dialog.vue';
import Button from '../../../components/ui/Button.vue';
import Notice from '../../../components/ui/Notice.vue';
import FormField from '../../../components/ui/FormField.vue';
import Select from '../../../components/ui/Select.vue';
import SearchInput from '../../../components/ui/SearchInput.vue';
import Tabs from '../../../components/ui/Tabs.vue';
import TextInput from '../../../components/ui/TextInput.vue';
import { useApiData } from '../../../composables/useApiData';
import { apiPost } from '../../../lib/api';
import { t, translateServerMessage } from '../../../lib/i18n';
import { useSessionStore } from '../../../stores/session';
import IntakeAccessNotice from '../components/IntakeAccessNotice.vue';
import { useIntakeAccess } from '../composables/useIntakeAccess';
import { enc } from '../resources';
import ServiceAccountJsonField from './ServiceAccountJsonField.vue';
import {
  PROVIDER_OPTIONS, endpointLabel, keyCount, parseServiceAccount, providerLabel, readIntakeFile, readServiceAccountFile,
  type IntakeBody, type IntakeRequest, type PreviewResult, type RecognizeResult,
} from './newDelivery';

type Tab = 'smart' | 'fields';
/** What 核对资料 submits: nothing yet (smart), recognised requests (grouped), a raw recognised request (json) or the manual fields. */
type Mode = 'smart' | 'grouped' | 'json' | 'fields';

// `onCcmax` stays a function prop: its presence decides whether the delivery-method switch is shown.
const props = defineProps<{ onCcmax?: () => void }>();
const emit = defineEmits<{ close: []; saved: [] }>();

const session = useSessionStore();
const platform = !session.user?.supplierId;
const access = useIntakeAccess(() => !!props.onCcmax);

const supplierId = ref(session.user?.supplierId || '');
const supplierSearch = ref('');
const suppliers = useApiData<{ items: Array<{ id: string; name: string }>; total: number }>(
  () => (platform ? `/suppliers?page=1&size=100&search=${enc(supplierSearch.value)}` : null),
);
const tab = ref<Tab>('smart');
const mode = ref<Mode>('smart');
const smartText = ref('');
const smartType = ref('auto');
const recognized = shallowRef<IntakeRequest[]>([]);
const confirmSwitch = ref(false);
const channelType = ref('1');
const name = ref('');
const addMode = ref('batch');
const multiKeyMode = ref('random');
const key = ref('');
const baseUrl = ref('');
const models = ref('');
const vertexKeyType = ref('api_key');
const serviceAccount = ref('');
const jsonText = ref('');
const error = ref('');
const busy = ref(false);
let running = false;
let revision = 0;
const requestKey = crypto.randomUUID();
const dataFile = ref<HTMLInputElement | null>(null);
const preview = shallowRef<{ request: IntakeBody; result: PreviewResult; revision: number } | null>(null);

function invalidate() {
  revision++;
  preview.value = null;
  error.value = '';
}

const vertexServiceAccount = computed(() => channelType.value === '41' && vertexKeyType.value === 'service_account');
const hasDraft = computed(() => !!(key.value || serviceAccount.value || jsonText.value || smartText.value));

const deliveryOptions = computed(() => [
  { value: 'api', label: t('NewAPI 资源交付') },
  { value: 'ccmax', label: t('CCMAX 交付'), disabled: !access.allowed.value },
]);
const supplierOptions = computed(() => [
  { value: '', label: t('请选择供应商') },
  ...(suppliers.data.value?.items || []).map((row) => ({ value: row.id, label: row.name })),
]);
const tabs = computed(() => [{ id: 'smart' as const, label: t('智能录入') }, { id: 'fields' as const, label: t('手动填写') }]);
const smartTypeOptions = computed(() => [{ value: 'auto', label: t('自动识别') }, ...PROVIDER_OPTIONS]);
const addModeOptions = computed(() => [
  { value: 'single', label: t('单密钥') }, { value: 'batch', label: t('批量创建') }, { value: 'multi_to_single', label: t('多密钥') },
]);
const vertexKeyOptions = computed(() => [{ value: 'api_key', label: 'API Key' }, { value: 'service_account', label: t('服务账号 JSON') }]);
const multiKeyOptions = computed(() => [{ value: 'random', label: t('随机') }, { value: 'polling', label: t('轮询') }]);

const baseUrlPlaceholder = computed(() => (channelType.value === '3' ? t('https://资源名.openai.azure.com') : 'https://api.example.com'));

const tabModel = computed({
  get: () => tab.value,
  set: (value: Tab) => {
    if (busy.value) return;
    invalidate();
    tab.value = value;
    mode.value = value;
    recognized.value = [];
  },
});

/** Field setter that also invalidates the preview, like every legacy onChange. */
function edit<T>(target: { value: T }, after?: () => void) {
  return (value: T) => { invalidate(); target.value = value; after?.(); };
}
const resetSmart = () => { mode.value = 'smart'; recognized.value = []; };
const setSupplier = edit(supplierId);
const setName = edit(name);
const setSmartType = edit(smartType, resetSmart);
const setSmartText = edit(smartText, resetSmart);
const setModels = edit(models);
const setChannelType = edit(channelType);
const setAddMode = edit(addMode);
const setVertexKeyType = edit(vertexKeyType);
const setMultiKeyMode = edit(multiKeyMode);
const setBaseUrl = edit(baseUrl);
const setKey = edit(key);
const setServiceAccount = edit(serviceAccount);
function setSupplierSearch(value: string) {
  invalidate();
  supplierId.value = '';
  supplierSearch.value = value;
}

function chooseDelivery(value: string) {
  if (value !== 'ccmax' || !access.allowed.value) return;
  if (hasDraft.value) confirmSwitch.value = true;
  else props.onCcmax?.();
}

function close() {
  if (!busy.value) emit('close');
}

function buildRequest(): IntakeBody {
  if (mode.value === 'grouped') {
    if (!recognized.value.length) throw new Error(t('请先识别交付资料。'));
    return { requests: recognized.value.map((request) => ({ ...request, channel: { ...request.channel, models: models.value.trim() } })) };
  }
  if (mode.value === 'smart') throw new Error(t('请先识别资料，再核对并提交。'));
  if (mode.value === 'json') {
    let parsed: unknown;
    try {
      parsed = JSON.parse(jsonText.value);
    } catch {
      throw new Error(t('NewAPI 资料不是有效的 JSON，请核对后重试。'));
    }
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) throw new Error(t('请粘贴包含 mode 和 channel 的 NewAPI 资料对象。'));
    return parsed as IntakeBody;
  }
  const credential = vertexServiceAccount.value ? JSON.stringify(parseServiceAccount(serviceAccount.value)) : key.value.trim();
  if (!credential) throw new Error(t('请填写交付凭据。'));
  if (channelType.value === '3' && !baseUrl.value.trim()) throw new Error(t('Azure 交付需要填写 Endpoint 地址。'));
  return {
    mode: vertexServiceAccount.value ? 'single' : addMode.value,
    multi_key_mode: multiKeyMode.value,
    channel: {
      type: Number(channelType.value),
      name: name.value.trim() || t('供应商交付'),
      key: credential,
      base_url: baseUrl.value.trim(),
      models: models.value.trim(),
      ...(channelType.value === '41' ? { settings: JSON.stringify({ vertex_key_type: vertexKeyType.value }) } : {}),
    },
  };
}

async function readFile(file: File) {
  if (running) return;
  invalidate();
  const started = revision;
  running = true; busy.value = true;
  try {
    const text = await readIntakeFile(file);
    if (started === revision) {
      if (tab.value === 'smart') { smartText.value = text; recognized.value = []; mode.value = 'smart'; }
      else key.value = text;
    }
  } catch (failure) {
    error.value = (failure as Error).message;
  } finally {
    running = false; busy.value = false;
  }
}

function onDataFile(event: Event) {
  const input = event.target as HTMLInputElement;
  const file = input.files?.[0];
  input.value = '';
  if (file) readFile(file);
}

async function uploadServiceAccount(file: File) {
  invalidate();
  try {
    serviceAccount.value = JSON.stringify(await readServiceAccountFile(file), null, 2);
    return true;
  } catch (failure) {
    error.value = (failure as Error).message;
    return false;
  }
}

async function recognize() {
  if (running) return;
  invalidate();
  running = true; busy.value = true;
  const started = revision;
  try {
    const result = await apiPost<RecognizeResult>('/resource-intakes/recognize', {
      text: smartText.value, channelType: smartType.value === 'auto' ? null : Number(smartType.value),
    });
    if (started !== revision) return;
    if (!result.recognized || !result.request) throw new Error(result.message ? translateServerMessage(result.message) : t('请确认资源类型后重试。'));
    const request = result.request;
    if ('requests' in request) {
      recognized.value = request.requests;
      mode.value = 'grouped';
    } else {
      recognized.value = [request];
      if (result.raw || request.channel.type === 41) {
        jsonText.value = JSON.stringify(request, null, 2);
        mode.value = 'json';
      } else {
        models.value = request.channel.models || '';
        mode.value = 'grouped';
      }
    }
    session.notify(t('已识别资料，请核对后提交交付'));
  } catch (failure) {
    if (started === revision) error.value = (failure as Error).message;
  } finally {
    running = false; busy.value = false;
  }
}

async function check() {
  if (running) return;
  error.value = '';
  if (platform && !supplierId.value) { error.value = t('请先选择交付供应商。'); return; }
  running = true; busy.value = true;
  const started = revision;
  try {
    const request = buildRequest();
    const result = await apiPost<PreviewResult>('/resource-intakes/preview', request);
    if (started === revision) preview.value = { request, result, revision: started };
  } catch (failure) {
    if (started === revision) error.value = (failure as Error).message;
  } finally {
    running = false; busy.value = false;
  }
}

async function submit() {
  const checked = preview.value;
  if (!checked || checked.revision !== revision || running) return;
  running = true; busy.value = true; error.value = '';
  try {
    const result = await apiPost<{ resourceIds: string[] }>('/resource-intakes', {
      request: checked.request, requestKey, supplierId: supplierId.value, name: name.value,
    });
    // Credentials are not kept once accepted.
    key.value = ''; serviceAccount.value = ''; jsonText.value = ''; smartText.value = ''; recognized.value = [];
    session.notify(t('已接收 {0} 条资料，待分配报价项目', [result.resourceIds.length]));
    emit('saved');
  } catch (failure) {
    error.value = (failure as Error).message;
  } finally {
    running = false; busy.value = false;
  }
}
</script>

<template>
  <Dialog size="lg" :title="t('新增交付')" @close="close">
    <div class="rs-body">
      <Notice v-if="error" tone="danger">{{ error }}</Notice>
      <IntakeAccessNotice :access="access" />
      <Notice v-if="confirmSwitch" tone="warning">
        {{ t('切换到 CCMAX 会清除当前未提交资料。') }}
        <template #actions>
          <Button size="sm" variant="ghost" @click="confirmSwitch = false">{{ t('继续填写') }}</Button>
          <Button size="sm" :disabled="!access.allowed.value" @click="props.onCcmax?.()">{{ t('确认切换') }}</Button>
        </template>
      </Notice>

      <fieldset class="rs-fieldset rs-grid" :disabled="busy">
        <FormField v-if="onCcmax" :label="t('交付方式')">
          <template #default="{ id }">
            <Select :id="id" model-value="api" :options="deliveryOptions" :label="t('交付方式')" @update:model-value="chooseDelivery($event as string)" />
          </template>
        </FormField>
        <FormField v-if="platform" :label="t('交付供应商')" :error="suppliers.error.value || undefined">
          <template #default="{ id }">
            <div class="rs-supplier">
              <Select
                :id="id"
                :model-value="supplierId"
                :options="supplierOptions"
                :label="t('交付供应商')"
                searchable
                :search-placeholder="t('搜索供应商')"
                :disabled="suppliers.loading.value || !!suppliers.error.value"
                @update:model-value="setSupplier($event as string)"
              />
              <SearchInput
                v-if="(suppliers.data.value?.total || 0) > 100 || supplierSearch"
                :model-value="supplierSearch"
                :label="t('搜索更多供应商')"
                :placeholder="t('输入名称查询更多供应商')"
                @update:model-value="setSupplierSearch"
              />
            </div>
          </template>
        </FormField>
        <FormField :label="t('名称（选填）')">
          <template #default="{ id }">
            <TextInput :id="id" :model-value="name" maxlength="100" :placeholder="t('便于后续识别这份交付')" @update:model-value="setName" />
          </template>
        </FormField>
      </fieldset>

      <Tabs v-model="tabModel" :items="tabs" :label="t('录入方式')" />

      <fieldset class="rs-fieldset rs-grid" :disabled="busy">
        <template v-if="tab === 'smart'">
          <FormField :label="t('提供商')">
            <template #default="{ id }">
              <Select :id="id" :model-value="smartType" :options="smartTypeOptions" :label="t('智能录入资源类型')" @update:model-value="setSmartType($event as string)" />
            </template>
          </FormField>
          <FormField class="rs-wide" :label="t('粘贴交付资料')">
            <template #default="{ id }">
              <TextInput
                :id="id"
                :model-value="smartText"
                multiline
                :rows="recognized.length ? 3 : 6"
                autocomplete="off"
                spellcheck="false"
                :placeholder="t('支持每行一个 Key、Key----Endpoint、地址与 Key 分行、Vertex 服务账号 JSON 或完整 NewAPI 请求。无法唯一识别时请选择资源类型。')"
                @update:model-value="setSmartText"
              />
            </template>
          </FormField>
          <div class="rs-wide">
            <Button :disabled="busy || !smartText.trim()" @click="recognize">
              {{ busy ? t('正在识别…') : recognized.length ? t('重新识别') : t('识别资料') }}
            </Button>
          </div>
          <template v-if="recognized.length">
            <section class="rs-wide rs-recognized" :aria-label="t('已识别资源')">
              <h3>{{ t('已识别资源') }}</h3>
              <div class="rs-table-wrap">
                <table class="rs-table">
                  <thead><tr><th>{{ t('类型') }}</th><th>{{ t('API 地址') }}</th><th class="num">{{ t('密钥数量') }}</th></tr></thead>
                  <tbody>
                    <tr v-for="(request, index) in recognized" :key="index">
                      <td>{{ providerLabel(request.channel.type) }}</td>
                      <td class="rs-endpoint">{{ endpointLabel(request) }}</td>
                      <td class="num">{{ keyCount(request) }}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </section>
            <FormField v-if="mode === 'grouped'" class="rs-wide" :label="t('模型（应用于本次全部资源，选填）')">
              <template #default="{ id }">
                <TextInput :id="id" :model-value="models" :placeholder="t('多个模型用逗号分隔')" @update:model-value="setModels" />
              </template>
            </FormField>
          </template>
        </template>

        <template v-else>
          <FormField :label="t('提供商')">
            <template #default="{ id }">
              <Select :id="id" :model-value="channelType" :options="PROVIDER_OPTIONS" :label="t('提供商')" @update:model-value="setChannelType($event as string)" />
            </template>
          </FormField>
          <FormField :label="t('添加模式')">
            <template #default="{ id }">
              <Select :id="id" :model-value="addMode" :options="addModeOptions" :label="t('添加模式')" :disabled="vertexServiceAccount" @update:model-value="setAddMode($event as string)" />
            </template>
          </FormField>
          <FormField v-if="channelType === '41'" :label="t('凭据方式')">
            <template #default="{ id }">
              <Select :id="id" :model-value="vertexKeyType" :options="vertexKeyOptions" :label="t('Vertex 凭据方式')" @update:model-value="setVertexKeyType($event as string)" />
            </template>
          </FormField>
          <FormField v-if="addMode === 'multi_to_single'" :label="t('密钥聚合模式')">
            <template #default="{ id }">
              <Select :id="id" :model-value="multiKeyMode" :options="multiKeyOptions" :label="t('密钥聚合模式')" @update:model-value="setMultiKeyMode($event as string)" />
            </template>
          </FormField>
          <FormField :label="t('API 地址')" :optional="channelType !== '3'">
            <template #default="{ id }">
              <TextInput
                :id="id"
                :model-value="baseUrl"
                type="url"
                :placeholder="baseUrlPlaceholder"
                @update:model-value="setBaseUrl"
              />
            </template>
          </FormField>
          <FormField :label="t('模型')" optional>
            <template #default="{ id }">
              <TextInput :id="id" :model-value="models" :placeholder="t('多个模型用逗号分隔')" @update:model-value="setModels" />
            </template>
          </FormField>
          <ServiceAccountJsonField
            v-if="vertexServiceAccount"
            class="rs-wide"
            :scope="t('交付')"
            :value="serviceAccount"
            :disabled="busy"
            :upload="uploadServiceAccount"
            @change="setServiceAccount"
          />
          <FormField v-else class="rs-wide" :label="t('API 密钥')">
            <template #default="{ id }">
              <TextInput
                :id="id"
                :model-value="key"
                multiline
                :rows="6"
                autocomplete="off"
                spellcheck="false"
                :placeholder="channelType === '33' ? t('API Key，或 AccessKey|SecretKey|区域；多组凭据每行一组') : t('粘贴 API Key；批量交付时每行一个')"
                @update:model-value="setKey"
              />
            </template>
          </FormField>
        </template>
      </fieldset>

      <div class="rs-file-row">
        <Button size="sm" icon="upload" :disabled="busy" @click="dataFile?.click()">{{ t('读取资料文件') }}</Button>
        <input ref="dataFile" class="rs-file" type="file" accept=".txt,.json" tabindex="-1" :aria-label="t('读取资料文件')" :disabled="busy" @change="onDataFile">
        <small>{{ t('TXT / JSON · 最大 200 KB') }}</small>
      </div>

      <section v-if="preview" class="rs-review" :aria-label="t('交付资料核对结果')">
        <strong>{{ t('已核对 {0} 条资源，共 {1} 个 Key', [preview.result.resourceCount, preview.result.keyCount]) }}</strong>
        <span>{{ t('报价项目：交付后分配') }}</span>
      </section>
    </div>
    <template #footer>
      <span class="rs-foot-note">{{ t('提交后关联报价项目') }}</span>
      <Button :disabled="busy" @click="emit('close')">{{ t('取消') }}</Button>
      <Button :disabled="busy || mode === 'smart'" @click="check">{{ busy ? t('正在处理…') : preview ? t('重新核对') : t('核对资料') }}</Button>
      <Button variant="primary" :disabled="busy || !preview" @click="submit">{{ busy ? t('正在处理…') : t('提交交付') }}</Button>
    </template>
  </Dialog>
</template>

<style scoped>
.rs-body { display: grid; gap: 16px; }
.rs-fieldset { min-width: 0; margin: 0; padding: 0; border: 0; }
.rs-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 14px 16px; align-items: start; }
.rs-wide { grid-column: 1 / -1; }
.rs-supplier { display: grid; gap: 8px; }
.rs-recognized h3 { margin: 0 0 10px; color: var(--hs-text); font-size: var(--hs-text-sm); font-weight: 600; }
.rs-table-wrap { max-height: 280px; overflow: auto; border: 1px solid var(--hs-border); border-radius: var(--hs-radius-control); }
.rs-table { width: 100%; border-collapse: collapse; font-size: var(--hs-text-sm); }
.rs-table th { position: sticky; top: 0; padding: 8px 12px; color: var(--hs-text-3); font-weight: 500; text-align: left; background: var(--hs-surface-subtle); border-bottom: 1px solid var(--hs-border); }
.rs-table td { padding: 10px 12px; color: var(--hs-text); border-bottom: 1px solid var(--hs-divider); }
.rs-table tr:last-child td { border-bottom: 0; }
.rs-table .num { text-align: right; font-variant-numeric: tabular-nums; }
.rs-endpoint { max-width: 420px; overflow-wrap: anywhere; }
.rs-file-row { display: flex; flex-wrap: wrap; align-items: center; gap: 10px; }
.rs-file-row small { color: var(--hs-text-3); font-size: var(--hs-text-xs); }
.rs-file { display: none; }
.rs-review { display: flex; flex-wrap: wrap; gap: 12px 24px; padding: 14px 16px; color: var(--hs-text-2); font-size: var(--hs-text-sm); background: var(--hs-accent-soft); border-radius: var(--hs-radius-control); }
.rs-review strong { color: var(--hs-text); font-variant-numeric: tabular-nums; }
.rs-foot-note { margin-right: auto; color: var(--hs-text-3); font-size: var(--hs-text-xs); }
@media (max-width: 640px) { .rs-grid { grid-template-columns: minmax(0, 1fr); } }
</style>
