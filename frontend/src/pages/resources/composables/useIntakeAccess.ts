import { computed, toValue, type MaybeRefOrGetter } from 'vue';
import { useApiData } from '../../../composables/useApiData';
import { apiFetch } from '../../../lib/api';
import { t } from '../../../lib/i18n';
import { useSessionStore } from '../../../stores/session';

export const CAPABILITIES_PATH = '/resources/submission-capabilities';

export interface SubmissionCapabilities {
  supportsProxy?: boolean;
  allowCcmax?: boolean;
  forceStopCcmaxIntake?: boolean;
  allowCcmaxPause?: boolean;
  allowCcmaxSafeRemoval?: boolean;
  allowCcmaxReauthorization?: boolean;
  allowDirectCcmax?: boolean;
  credentialModes?: string[];
}

export function intakeDeniedMessage(capabilities: SubmissionCapabilities | null | undefined): string {
  return capabilities?.forceStopCcmaxIntake
    ? t('平台已暂停 CCMAX 新增上号，请稍后再试或联系平台管理员。已有资源查询、同步和重新授权不受影响。')
    : t('当前供应商未开通 CCMAX 上号，请联系平台管理员。');
}

export type IntakeAccess = ReturnType<typeof useIntakeAccess>;

/**
 * Whether this supplier may onboard new CCMAX accounts. Only supplier users with
 * `resource.write` ask; `requireAllowed()` re-reads the capabilities right
 * before every submit and throws the denial message.
 */
export function useIntakeAccess(enabledInput: MaybeRefOrGetter<boolean> = true) {
  const session = useSessionStore();
  const enabled = computed(() => toValue(enabledInput) && !!session.user?.supplierId && session.has('resource.write'));
  const data = useApiData<SubmissionCapabilities>(() => (enabled.value ? CAPABILITIES_PATH : null));
  const allowed = computed(() => enabled.value && data.data.value?.allowCcmax === true && !data.data.value.forceStopCcmaxIntake && !data.error.value);
  const deniedMessage = computed(() => intakeDeniedMessage(data.data.value));

  async function requireAllowed() {
    if (!enabled.value) throw new Error(t('当前账号无权访问此页面'));
    const latest = await apiFetch<SubmissionCapabilities>(CAPABILITIES_PATH);
    data.mutate(() => latest);
    if (latest.forceStopCcmaxIntake || !latest.allowCcmax) throw new Error(intakeDeniedMessage(latest));
  }

  return { ...data, enabled, allowed, deniedMessage, requireAllowed };
}
