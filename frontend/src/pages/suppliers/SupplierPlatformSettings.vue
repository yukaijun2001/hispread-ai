<script setup lang="ts">
// 平台配置 tab of the supplier drawer: CCMAX onboarding / reauthorization /
// resource operation switches, PRO push and the default proxy binding limit
// (editable by ADMIN with system.settings), followed by the CC intake rules
// for the supplier and its members.
import { computed, ref, watch } from 'vue';
import Button from '../../components/ui/Button.vue';
import Notice from '../../components/ui/Notice.vue';
import TextInput from '../../components/ui/TextInput.vue';
import EmptyState from '../../components/ui/EmptyState.vue';
import Spinner from '../../components/ui/Spinner.vue';
import IntakePolicyPanel from './IntakePolicyPanel.vue';
import MemberPrioritySettings from './MemberPrioritySettings.vue';
import { useApiData } from '../../composables/useApiData';
import { apiPut } from '../../lib/api';
import { t } from '../../lib/i18n';
import type { SubmissionCapabilities } from '../../navigation/access';
import { useSessionStore } from '../../stores/session';
import { isPlatformUser } from './supplierAdmin';

interface SupplierSettings {
  defaultProxyMaxResources: number;
  allowPro: boolean;
  allowCcmax: boolean;
  allowCcmaxReauthorization: boolean;
  allowCcmaxPause: boolean;
  allowCcmaxSafeRemoval: boolean;
  forceStopCcmaxIntake?: boolean;
  globalAllowCcmax?: boolean;
  globalAllowCcmaxReauthorization?: boolean;
  globalAllowPro?: boolean;
  version: number;
}
type SwitchKey = 'allowCcmax' | 'allowCcmaxReauthorization' | 'allowCcmaxPause' | 'allowCcmaxSafeRemoval' | 'allowPro';

const props = defineProps<{ supplierId: string }>();

const session = useSessionStore();
const platform = computed(() => !!session.user && isPlatformUser(session.user) && session.has('supplier.read'));
const canEdit = computed(() => session.user?.role === 'ADMIN' && session.has('system.settings'));
const path = computed(() => `/suppliers/${encodeURIComponent(props.supplierId)}/settings`);
const source = useApiData<SupplierSettings>(() => (platform.value ? path.value : null));
const capabilities = useApiData<SubmissionCapabilities>(() => (platform.value ? '/resources/submission-capabilities' : null));

const current = ref<SupplierSettings | null>(null);
const proxyLimit = ref('');
const switches = ref<Record<SwitchKey, boolean>>({ allowCcmax: false, allowCcmaxReauthorization: false, allowCcmaxPause: false, allowCcmaxSafeRemoval: false, allowPro: false });
const saving = ref(false);
const error = ref('');

function apply(settings: SupplierSettings) {
  current.value = settings;
  proxyLimit.value = String(settings.defaultProxyMaxResources);
  switches.value = {
    allowCcmax: settings.allowCcmax, allowCcmaxReauthorization: settings.allowCcmaxReauthorization, allowCcmaxPause: settings.allowCcmaxPause,
    allowCcmaxSafeRemoval: settings.allowCcmaxSafeRemoval, allowPro: settings.allowPro,
  };
}
// Every load (including a global refresh) replaces unsaved edits, as before.
watch(() => source.data.value, (value) => { if (value) { apply(value); error.value = ''; } }, { immediate: true });

async function save() {
  if (saving.value || !canEdit.value || !current.value) return;
  const value = proxyLimit.value;
  if (!/^\d+$/.test(value) || !Number.isSafeInteger(Number(value)) || Number(value) > 2147483647) {
    error.value = t('请填写有效的非负整数');
    return;
  }
  saving.value = true;
  error.value = '';
  try {
    const saved = await apiPut<SupplierSettings>(path.value, {
      defaultProxyMaxResources: Number(value),
      ...switches.value,
      version: current.value.version,
    });
    apply(saved);
    session.notify(t('供应商配置已保存'));
  } catch (reason) {
    error.value = (reason as Error).message;
  } finally {
    saving.value = false;
  }
}

const toggle = (key: SwitchKey, event: Event) => { switches.value = { ...switches.value, [key]: (event.target as HTMLInputElement).checked }; };
</script>

<template>
  <EmptyState v-if="!platform" error :text="t('当前账号无权访问此页面')" compact />
  <div v-else class="ps">
    <Notice v-if="source.error.value" tone="danger">
      {{ source.error.value }}
      <template #actions><Button size="sm" @click="source.reload()">{{ t('重新加载配置') }}</Button></template>
    </Notice>
    <div v-else-if="!current || source.loading.value" class="ps-loading"><Spinner :size="16" /></div>
    <form v-else class="ps-form" @submit.prevent="save">
      <section class="ps-section">
        <h3>{{ t('CCMAX 上号') }}</h3>
        <label class="ps-switch">
          <span><strong>{{ t('允许该供应商 CCMAX 上号') }}</strong><small>{{ t('系统参数的全局开关关闭时，按此配置判断。') }}</small></span>
          <input type="checkbox" role="switch" :checked="switches.allowCcmax" :disabled="saving || !canEdit" @change="toggle('allowCcmax', $event)">
        </label>
        <p class="ps-hint">
          {{ current.forceStopCcmaxIntake ? t('平台已强制停止 CCMAX 新增上号；该供应商当前停收，已保存的允许配置保持不变。')
            : current.globalAllowCcmax ? t('当前全局已开启，所有供应商均可 CCMAX 上号。') : t('当前全局已关闭，按该供应商的开关判断。') }}
        </p>
      </section>

      <section class="ps-section">
        <h3>{{ t('CCMAX 重新授权') }}</h3>
        <p class="ps-hint">{{ t('控制 OAuth 重新授权和凭据刷新；关闭后仍可查询已有操作。') }}</p>
        <label class="ps-switch">
          <span><strong>{{ t('允许该供应商 CCMAX 重新授权') }}</strong><small>{{ t('独立于新增上号；全局关闭后按各供应商的重新授权开关判断。') }}</small></span>
          <input type="checkbox" role="switch" :checked="switches.allowCcmaxReauthorization" :disabled="saving || !canEdit" @change="toggle('allowCcmaxReauthorization', $event)">
        </label>
        <p class="ps-hint">{{ current.globalAllowCcmaxReauthorization ? t('当前全局已开启，所有供应商均可 CCMAX 重新授权。') : t('当前全局已关闭，按该供应商的开关判断。') }}</p>
      </section>

      <section class="ps-section">
        <h3>{{ t('CCMAX 资源操作') }}</h3>
        <p class="ps-hint">{{ t('分别开放供应商端的暂停和移除；仅可操作其权限内的已交付资源。') }}</p>
        <label class="ps-switch">
          <span><strong>{{ t('允许该供应商暂停资源') }}</strong><small>{{ t('暂停后停止接收新请求，保留凭据并等待在途请求完成。') }}</small></span>
          <input type="checkbox" role="switch" :checked="switches.allowCcmaxPause" :disabled="saving || !canEdit" @change="toggle('allowCcmaxPause', $event)">
        </label>
        <label class="ps-switch">
          <span><strong>{{ t('允许该供应商移除资源') }}</strong><small>{{ t('释放完成后无法恢复；本地资源和账单历史保留。') }}</small></span>
          <input type="checkbox" role="switch" :checked="switches.allowCcmaxSafeRemoval" :disabled="saving || !canEdit" @change="toggle('allowCcmaxSafeRemoval', $event)">
        </label>
      </section>

      <section class="ps-section">
        <h3>{{ t('PRO 推送') }}</h3>
        <label class="ps-switch">
          <span><strong>{{ t('允许该供应商推送 PRO') }}</strong><small>{{ t('全局关闭时按此配置判断；全局开启时所有供应商均允许。') }}</small></span>
          <input type="checkbox" role="switch" :checked="switches.allowPro" :disabled="saving || !canEdit" @change="toggle('allowPro', $event)">
        </label>
        <p class="ps-hint">{{ current.globalAllowPro ? t('当前全局已开启，所有供应商均允许推送 PRO。') : t('当前全局已关闭，按该供应商的开关判断。') }}</p>
        <p class="ps-hint">{{ t('后续原生 OAuth 新增上号会核验 PRO 资格与每日额度；已有账号不因修改此开关自动启停。') }}</p>
      </section>

      <section v-if="capabilities.data.value?.supportsProxy === true" class="ps-section">
        <h3>{{ t('代理默认配置') }}</h3>
        <p class="ps-hint">{{ t('用于该供应商及其团队成员后续新建的代理；已有代理保持原绑定上限。') }}</p>
        <label class="ps-field">
          <span>{{ t('每条代理默认可绑定资源数') }}</span>
          <TextInput v-model="proxyLimit" type="number" min="0" max="2147483647" step="1" required :disabled="saving || !canEdit" :aria-label="t('每条代理默认可绑定资源数')" />
          <small>{{ t('0 表示不限。新建或导入代理时未单独指定上限，将使用此默认值。') }}</small>
        </label>
      </section>

      <Notice v-if="error" tone="danger">{{ error }}</Notice>
      <footer class="ps-actions">
        <Button :disabled="saving" @click="source.reload()">{{ t('重新加载配置') }}</Button>
        <Button v-if="canEdit" variant="primary" type="submit" :loading="saving">{{ saving ? t('保存中…') : t('保存配置') }}</Button>
      </footer>
    </form>

    <template v-if="platform">
      <section class="ps-intake"><IntakePolicyPanel :supplier-id="supplierId" /></section>
      <MemberPrioritySettings :supplier-id="supplierId" />
    </template>
  </div>
</template>

<style scoped>
.ps { display: grid; gap: 18px; }
.ps-loading { display: grid; place-items: center; padding: 24px; color: var(--hs-text-3); }
.ps-form { display: grid; gap: 14px; }
.ps-section { display: grid; gap: 8px; padding-bottom: 14px; border-bottom: 1px solid var(--hs-divider); }
.ps-section h3 { margin: 0; font-size: var(--hs-text-sm); font-weight: 600; }
.ps-hint { margin: 0; color: var(--hs-text-3); font-size: var(--hs-text-xs); line-height: 1.6; }
.ps-switch { display: flex; align-items: center; justify-content: space-between; gap: 16px; padding: 10px 12px; background: var(--hs-surface-subtle); border: 1px solid var(--hs-border); border-radius: 12px; cursor: pointer; }
.ps-switch > span { display: grid; gap: 2px; }
.ps-switch strong { color: var(--hs-text); font-size: var(--hs-text-sm); font-weight: 500; }
.ps-switch small { color: var(--hs-text-3); font-size: var(--hs-text-xs); }
.ps-switch input { flex: none; width: 36px; height: 20px; margin: 0; appearance: none; background: var(--hs-border-strong); border-radius: 999px; position: relative; cursor: pointer; transition: background .15s; }
.ps-switch input::after { content: ''; position: absolute; top: 2px; left: 2px; width: 16px; height: 16px; background: #fff; border-radius: 50%; box-shadow: 0 1px 2px rgb(0 0 0 / 20%); transition: transform .15s; }
.ps-switch input:checked { background: var(--hs-accent); }
.ps-switch input:checked::after { transform: translateX(16px); }
.ps-switch input:disabled { opacity: .55; cursor: not-allowed; }
.ps-switch input:focus-visible { outline: none; box-shadow: var(--hs-accent-ring); }
.ps-field { display: grid; gap: 6px; max-width: 320px; }
.ps-field > span { color: var(--hs-text-2); font-size: var(--hs-text-sm); font-weight: 500; }
.ps-field small { color: var(--hs-text-3); font-size: var(--hs-text-xs); }
.ps-actions { display: flex; justify-content: flex-end; gap: 8px; }
.ps-intake { padding-top: 18px; border-top: 1px solid var(--hs-divider); }
</style>
