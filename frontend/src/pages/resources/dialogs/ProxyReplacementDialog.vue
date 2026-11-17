<script setup lang="ts">
// Replace the outbound proxy of one or more resources. One request key per
// intent: after a lost response the same request is checked again (the form
// stays locked) instead of creating a second job.
import { computed, ref } from 'vue';
import Dialog from '../../../components/ui/Dialog.vue';
import Button from '../../../components/ui/Button.vue';
import Notice from '../../../components/ui/Notice.vue';
import { ApiError, apiPost } from '../../../lib/api';
import { t } from '../../../lib/i18n';
import { useSessionStore } from '../../../stores/session';
import ReplacementProxyPicker from '../components/ReplacementProxyPicker.vue';
import { EMPTY_CHOICE, type ReplacementChoice } from '../proxyReplacement';
import type { Resource } from '../resources';

const props = defineProps<{ resources: Resource[] }>();
const emit = defineEmits<{ close: []; created: [id: string] }>();

const session = useSessionStore();
const canRecord = session.has('proxy.read') && session.has('proxy.write');
const perRow = ref(false);
const shared = ref<ReplacementChoice>(EMPTY_CHOICE);
const choices = ref<Record<string, ReplacementChoice>>({});
const submitting = ref(false);
const error = ref('');
// Set after a lost or failed (non-4xx) response: retrying checks the same request.
const retrySame = ref(false);
let requestKey = crypto.randomUUID();
let inFlight = false;

const valid = (choice?: ReplacementChoice) => !!choice?.proxy?.supported || (canRecord && !!choice?.url.trim());
const ready = computed(() => (perRow.value ? props.resources.every((r) => valid(choices.value[r.id])) : valid(shared.value)));
const single = computed(() => props.resources.length === 1);

/** Changed input is a new intent, unless the previous request still needs checking. */
function inputChanged() { if (!retrySame.value) requestKey = crypto.randomUUID(); }
function setShared(choice: ReplacementChoice) { shared.value = choice; inputChanged(); }
function setChoice(id: string, choice: ReplacementChoice) { choices.value = { ...choices.value, [id]: choice }; inputChanged(); }
function togglePerRow(event: Event) { perRow.value = (event.target as HTMLInputElement).checked; inputChanged(); }

async function submit() {
  if (inFlight) return;
  if (!ready.value) { error.value = t('请为每条资源填写代理地址或选择已有代理'); return; }
  const items = props.resources.map((resource) => {
    const choice = (perRow.value ? choices.value[resource.id] : shared.value) || EMPTY_CHOICE;
    return {
      resourceId: resource.id,
      resourceVersion: resource.version,
      ...(choice.proxy ? { proxyId: choice.proxy.id, proxyVersion: choice.proxy.version } : { proxyUrl: choice.url.trim() }),
    };
  });
  inFlight = true; submitting.value = true; error.value = '';
  try {
    const job = await apiPost<{ id: string }>('/resource-proxy-replacements', { requestKey, items });
    emit('created', job.id);
  } catch (failure) {
    error.value = failure instanceof Error ? failure.message : t('提交失败');
    retrySame.value = !(failure instanceof ApiError && failure.status >= 400 && failure.status < 500);
  } finally {
    inFlight = false; submitting.value = false;
  }
}

const sharedSummary = computed(() => shared.value.proxy?.name || (shared.value.url.trim() ? t('使用已填写的代理地址') : t('待填写或选择代理')));
</script>

<template>
  <Dialog
    :title="single ? t('更换代理') : t('批量替换代理')"
    :subtitle="single ? resources[0].name : t('已选择 {0} 条 CCMAX 资源', [resources.length])"
    size="lg"
    @close="emit('close')"
  >
    <div class="rs-replace">
      <Notice tone="info">{{ t('更换将改变账号出口 IP，可能短暂中断服务。账号凭据保持。提交后可关闭页面，在“更换记录”查看进度。') }}</Notice>
      <Notice v-if="retrySame" tone="danger">{{ t('如提交响应中断，可保持选择后重试查询同一请求，或先查看更换记录；系统不会重复创建同一操作。') }}</Notice>

      <fieldset class="rs-replace-form" :disabled="submitting || retrySame">
        <label v-if="resources.length > 1" class="rs-replace-check">
          <input type="checkbox" :checked="perRow" @change="togglePerRow">
          {{ t('逐条填写或选择不同代理') }}
        </label>
        <ReplacementProxyPicker v-if="!perRow" :resource-id="resources[0].id" :value="shared" :can-record="canRecord" @change="setShared" />
        <ul v-if="resources.length > 1" class="rs-replace-list">
          <li v-for="resource in resources" :key="resource.id">
            <strong>{{ resource.name }}</strong>
            <ReplacementProxyPicker
              v-if="perRow"
              :resource-id="resource.id"
              :value="choices[resource.id] || EMPTY_CHOICE"
              :can-record="canRecord"
              @change="setChoice(resource.id, $event)"
            />
            <span v-else class="rs-replace-muted">{{ sharedSummary }}</span>
          </li>
        </ul>
      </fieldset>

      <Notice v-if="error" tone="danger">{{ error }}</Notice>
    </div>

    <template #footer>
      <Button @click="emit('close')">{{ t('关闭') }}</Button>
      <Button variant="primary" :disabled="submitting || !ready" :loading="submitting" @click="submit">
        {{ submitting ? t('提交中…') : retrySame ? t('核对同一请求') : t('确认更换') }}
      </Button>
    </template>
  </Dialog>
</template>

<style scoped>
.rs-replace { display: grid; gap: 14px; }
.rs-replace-form { display: grid; gap: 12px; min-width: 0; margin: 0; padding: 0; border: 0; }
.rs-replace-check { display: inline-flex; align-items: center; gap: 8px; color: var(--hs-text-2); font-size: var(--hs-text-sm); }
.rs-replace-list { display: grid; gap: 0; margin: 0; padding: 0; list-style: none; border: 1px solid var(--hs-border); border-radius: 12px; }
.rs-replace-list li { display: grid; gap: 6px; padding: 10px 14px; }
.rs-replace-list li + li { border-top: 1px solid var(--hs-border); }
.rs-replace-list strong { font-size: var(--hs-text-sm); font-weight: 600; overflow-wrap: anywhere; }
.rs-replace-muted { color: var(--hs-text-3); font-size: var(--hs-text-xs); }
</style>
