<script setup lang="ts">
// API keys of one account (`userId`) or of the signed-in account. Keys can be
// issued (own account only), reset, revoked and — for platform admins — revealed.
import { computed, ref, useId } from 'vue';
import Button from '../../../components/ui/Button.vue';
import Badge from '../../../components/ui/Badge.vue';
import Dialog from '../../../components/ui/Dialog.vue';
import Icon from '../../../components/ui/Icon.vue';
import IconButton from '../../../components/ui/IconButton.vue';
import Notice from '../../../components/ui/Notice.vue';
import Spinner from '../../../components/ui/Spinner.vue';
import TextInput from '../../../components/ui/TextInput.vue';
import FormField from '../../../components/ui/FormField.vue';
import { useApiData } from '../../../composables/useApiData';
import { apiPost } from '../../../lib/api';
import { t } from '../../../lib/i18n';
import { formatDateTime } from '../../../lib/money';
import { useSessionStore } from '../../../stores/session';

interface ApiToken { id: string; name: string; tail: string; enabled: boolean; expiresAt?: string | null; lastUsedAt?: string | null; revealable?: boolean }
type Mode = 'create' | 'reset' | 'revoke' | 'secret';

const props = defineProps<{ userId?: string }>();
const session = useSessionStore();
const base = computed(() => (props.userId ? `/users/${encodeURIComponent(props.userId)}/api-tokens` : '/auth/api-tokens'));
const tokens = useApiData<ApiToken[]>(base);
const formId = useId();

const mode = ref<Mode | null>(null);
const showHistory = ref(false);
const selected = ref<ApiToken | null>(null);
const name = ref('');
const preset = ref('90');
const customDays = ref('90');
const secret = ref('');
const revealed = ref(false);
const busy = ref(false);
const error = ref('');
let inFlight = false;

const days = computed(() => (preset.value === 'custom' ? Number(customDays.value) : Number(preset.value)));
const daysValid = computed(() => Number.isInteger(days.value) && days.value >= 1 && days.value <= 365);
const platformAdmin = computed(() => session.user?.role === 'ADMIN' && !session.user.supplierId && session.has('system.users'));
const now = computed(() => { void tokens.data.value; return Date.now(); });
const active = (token: ApiToken) => token.enabled && (!token.expiresAt || Date.parse(token.expiresAt) > now.value);
const shown = computed(() => (tokens.data.value ?? []).filter((token) => (showHistory.value ? !active(token) : active(token))));
const inactiveCount = computed(() => (tokens.data.value ?? []).filter((token) => !active(token)).length);
const expired = (token: ApiToken) => !!token.expiresAt && Date.parse(token.expiresAt) <= Date.now();

const presets = [
  { value: '7', label: t('7 天') }, { value: '30', label: t('30 天') }, { value: '90', label: t('90 天') },
  { value: '365', label: t('1 年') }, { value: 'custom', label: t('自定义') },
];
const dialogTitle = computed(() => t(mode.value === 'create' ? '新建 API 密钥' : mode.value === 'reset' ? '重置 API 密钥' : mode.value === 'revoke' ? '撤销 API 密钥' : 'API 密钥'));
const example = t('POST {0}/api/channel/\nAuthorization: Bearer <API 密钥>\nContent-Type: application/json', [window.location.origin]);

function closeDialog() {
  if (inFlight) return;
  mode.value = null; secret.value = ''; revealed.value = false; error.value = ''; selected.value = null;
}

function openDialog(next: Mode, token?: ApiToken) {
  error.value = ''; secret.value = ''; revealed.value = false; selected.value = token ?? null; mode.value = next;
  if (next === 'create') { name.value = ''; preset.value = '90'; }
}

async function act(action: 'issue' | 'reset' | 'revoke' | 'reveal', id?: string) {
  if (inFlight) return;
  inFlight = true; busy.value = true; error.value = '';
  try {
    const path = action === 'issue' ? base.value : `${base.value}/${encodeURIComponent(id ?? '')}/${action}`;
    const body = action === 'issue' ? { name: name.value, days: days.value } : action === 'reset' ? { days: days.value } : {};
    const result = await apiPost<{ key?: string }>(path, body);
    if (action === 'issue' || action === 'reset') showHistory.value = false;
    if (result.key) { secret.value = result.key; revealed.value = false; mode.value = 'secret'; } else mode.value = null;
    if (action !== 'reveal') {
      session.refresh();
      session.notify(t(action === 'revoke' ? '密钥已撤销' : action === 'reset' ? '密钥已重置' : '密钥已生成'));
    }
  } catch (reason) {
    error.value = (reason as Error).message;
  } finally {
    inFlight = false; busy.value = false;
  }
}

function reveal(token: ApiToken) {
  openDialog('secret', token);
  void act('reveal', token.id);
}

function submit() {
  if (mode.value === 'revoke') void act('revoke', selected.value?.id);
  else if (daysValid.value && (mode.value !== 'create' || name.value.trim())) void act(mode.value === 'create' ? 'issue' : 'reset', selected.value?.id);
}

async function copy() {
  try {
    await navigator.clipboard.writeText(secret.value);
    session.notify(t('已复制'));
  } catch {
    error.value = t('复制失败，请显示后手动复制。');
  }
}
</script>

<template>
  <div class="tokens">
    <div class="tokens-head">
      <h3>{{ t(showHistory ? '历史密钥' : 'API 密钥') }}</h3>
      <div class="tokens-actions">
        <Button v-if="showHistory || inactiveCount > 0" size="sm" variant="ghost" @click="showHistory = !showHistory">{{ t(showHistory ? '返回有效密钥' : '历史密钥') }}</Button>
        <Button v-if="!userId" size="sm" variant="primary" icon="plus" :disabled="busy || tokens.loading.value || !!tokens.error.value" @click="openDialog('create')">{{ t('新建密钥') }}</Button>
      </div>
    </div>

    <div v-if="tokens.loading.value" class="tokens-state"><Spinner /></div>
    <Notice v-else-if="tokens.error.value" tone="danger">{{ tokens.error.value }}</Notice>
    <ul v-else-if="shown.length" class="tokens-list" :aria-label="t('API 密钥列表')">
      <li v-for="token in shown" :key="token.id">
        <div class="tokens-info">
          <div class="tokens-name">
            <strong>{{ token.name }}</strong>
            <code>•••• {{ token.tail }}</code>
            <Badge :tone="token.enabled ? (expired(token) ? 'warning' : 'success') : 'neutral'" dot>
              {{ token.enabled ? t(expired(token) ? '已到期' : '有效') : t('已撤销') }}
            </Badge>
          </div>
          <div class="tokens-meta">
            <span>{{ token.expiresAt ? t('{0} 到期', [formatDateTime(token.expiresAt)]) : t('未设到期时间') }}</span>
            <span>{{ token.lastUsedAt ? t('最近使用 {0}', [formatDateTime(token.lastUsedAt)]) : t('尚未使用') }}</span>
          </div>
        </div>
        <div v-if="token.enabled" class="tokens-row-actions">
          <Button v-if="platformAdmin && token.revealable && !expired(token)" size="sm" variant="ghost" :disabled="busy" @click="reveal(token)">{{ t('查看') }}</Button>
          <Button size="sm" variant="ghost" :disabled="busy" @click="openDialog('reset', token)">{{ t('重置') }}</Button>
          <Button size="sm" variant="ghost" class="tokens-revoke" :disabled="busy" @click="openDialog('revoke', token)">{{ t('撤销') }}</Button>
        </div>
      </li>
    </ul>
    <div v-else class="tokens-empty">
      <Icon name="lock" :size="22" />
      <strong>{{ t(showHistory ? '暂无历史密钥' : '暂无有效密钥') }}</strong>
      <span v-if="!userId && !showHistory">{{ t('需要通过程序访问平台时，可新建密钥。') }}</span>
    </div>

    <details class="tokens-help">
      <summary>{{ t('调用示例') }}</summary>
      <pre>{{ example }}</pre>
    </details>

    <Dialog v-if="mode" :title="dialogTitle" size="sm" @close="closeDialog">
      <div class="tokens-dialog">
        <Notice v-if="error" tone="danger">{{ error }}</Notice>
        <template v-if="mode === 'secret'">
          <div v-if="busy" class="tokens-state"><Spinner /></div>
          <div v-else-if="secret" class="tokens-secret">
            <FormField :label="selected?.name || t('API 密钥')">
              <template #default="{ id }">
                <div class="tokens-secret-input">
                  <TextInput :id="id" :model-value="secret" :type="revealed ? 'text' : 'password'" readonly autocomplete="off" spellcheck="false" :aria-label="t('完整 API 密钥')" />
                  <IconButton :icon="revealed ? 'eye-off' : 'eye'" :label="t(revealed ? '隐藏密钥' : '显示密钥')" bordered @click="revealed = !revealed" />
                </div>
              </template>
            </FormField>
            <p v-if="!platformAdmin" class="tokens-once">{{ t('仅本次展示，请复制保存。') }}</p>
          </div>
        </template>
        <form v-else :id="formId" class="tokens-form" @submit.prevent="submit">
          <FormField v-if="mode === 'create'" :label="t('密钥名称')">
            <template #default="{ id }">
              <TextInput :id="id" v-model="name" autofocus required maxlength="100" :disabled="busy" :placeholder="t('例如：自动交付')" />
            </template>
          </FormField>
          <p v-else class="tokens-confirm">{{ t(mode === 'reset' ? '重置“{0}”后，旧密钥立即失效。' : '撤销“{0}”后，使用它的程序将无法继续访问。', [selected?.name]) }}</p>
          <fieldset v-if="mode !== 'revoke'" class="tokens-expiry" :disabled="busy">
            <legend>{{ t('有效期') }}</legend>
            <div class="tokens-presets">
              <button v-for="option in presets" :key="option.value" type="button" :aria-pressed="preset === option.value" :class="{ on: preset === option.value }" @click="preset = option.value">{{ option.label }}</button>
            </div>
            <FormField v-if="preset === 'custom'" :label="t('有效天数')">
              <template #default="{ id }">
                <TextInput :id="id" v-model="customDays" type="number" min="1" max="365" required />
              </template>
            </FormField>
          </fieldset>
        </form>
      </div>
      <template #footer>
        <template v-if="mode === 'secret'">
          <Button :disabled="busy" @click="closeDialog">{{ t('关闭') }}</Button>
          <Button variant="primary" icon="copy" :disabled="busy || !secret" @click="copy">{{ t('复制密钥') }}</Button>
        </template>
        <template v-else>
          <Button :disabled="busy" @click="closeDialog">{{ t('取消') }}</Button>
          <Button
            type="submit"
            :form="formId"
            :variant="mode === 'revoke' ? 'danger' : 'primary'"
            :disabled="busy || (mode !== 'revoke' && (!daysValid || (mode === 'create' && !name.trim())))"
          >{{ t(busy ? '处理中…' : mode === 'create' ? '创建密钥' : mode === 'reset' ? '确认重置' : '确认撤销') }}</Button>
        </template>
      </template>
    </Dialog>
  </div>
</template>

<style scoped>
.tokens { display: grid; gap: 14px; }
.tokens-head { display: flex; align-items: center; justify-content: space-between; gap: 12px; }
.tokens-head h3 { margin: 0; font-size: var(--hs-text-sm); font-weight: 600; }
.tokens-actions { display: flex; gap: 8px; }
.tokens-state { display: grid; place-items: center; padding: 24px; color: var(--hs-text-3); }
.tokens-list { display: grid; margin: 0; padding: 0; list-style: none; border: 1px solid var(--hs-border); border-radius: 12px; }
.tokens-list li { display: flex; align-items: center; justify-content: space-between; gap: 12px; padding: 12px 14px; border-bottom: 1px solid var(--hs-divider); }
.tokens-list li:last-child { border-bottom: 0; }
.tokens-info { display: grid; gap: 4px; min-width: 0; }
.tokens-name { display: flex; flex-wrap: wrap; align-items: center; gap: 8px; }
.tokens-name strong { color: var(--hs-text); font-size: var(--hs-text-sm); font-weight: 600; }
.tokens-name code { color: var(--hs-text-3); font-family: var(--hs-font-mono); font-size: var(--hs-text-xs); }
.tokens-meta { display: flex; flex-wrap: wrap; gap: 4px 14px; color: var(--hs-text-3); font-size: var(--hs-text-xs); }
.tokens-row-actions { display: flex; gap: 2px; flex: none; }
.tokens-revoke { color: var(--hs-danger); }
.tokens-empty { display: grid; justify-items: center; gap: 6px; padding: 28px 16px; color: var(--hs-text-3); text-align: center; border: 1px dashed var(--hs-border-strong); border-radius: 12px; font-size: var(--hs-text-xs); }
.tokens-empty strong { color: var(--hs-text-2); font-size: var(--hs-text-sm); font-weight: 500; }
.tokens-help summary { color: var(--hs-text-3); font-size: var(--hs-text-xs); cursor: pointer; }
.tokens-help pre { margin: 8px 0 0; padding: 12px; overflow-x: auto; color: var(--hs-text-2); background: var(--hs-surface-subtle); border: 1px solid var(--hs-border); border-radius: 10px; font-family: var(--hs-font-mono); font-size: var(--hs-text-xs); }
.tokens-dialog, .tokens-form { display: grid; gap: 14px; }
.tokens-secret-input { display: flex; gap: 8px; }
.tokens-secret-input > :first-child { flex: 1; }
.tokens-once, .tokens-confirm { margin: 0; color: var(--hs-text-2); font-size: var(--hs-text-sm); line-height: 1.7; }
.tokens-expiry { display: grid; gap: 10px; min-width: 0; margin: 0; padding: 0; border: 0; }
.tokens-expiry legend { margin-bottom: 8px; padding: 0; color: var(--hs-text-2); font-size: var(--hs-text-xs); font-weight: 500; }
.tokens-presets { display: flex; flex-wrap: wrap; gap: 6px; }
.tokens-presets button { height: 30px; padding: 0 12px; color: var(--hs-text-2); background: var(--hs-surface); border: 1px solid var(--hs-border-strong); border-radius: 999px; font: inherit; font-size: var(--hs-text-xs); cursor: pointer; }
.tokens-presets button.on { color: #fff; background: var(--hs-primary); border-color: var(--hs-primary); }
.tokens-presets button:focus-visible { outline: none; box-shadow: var(--hs-accent-ring); }
</style>
