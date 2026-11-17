// Proxy replacement jobs (/resource-proxy-replacements) and CCMAX credential
// refresh / reauthorization states.
import { t } from '../../lib/i18n';

/** A proxy offered for replacement. Only `supported` proxies can be bound. */
export interface ReplacementProxy {
  id: string;
  name: string;
  protocol: string;
  endpoint: string;
  supported?: boolean;
  version?: number;
  maxResources: number;
  usedResources: number;
  reservedResources: number;
}

/** Chosen proxy, or a typed proxy address. */
export interface ReplacementChoice { url: string; proxy?: ReplacementProxy }
export const EMPTY_CHOICE: ReplacementChoice = { url: '' };

export interface ReplacementItem { resourceName: string; proxyName: string; state: string; error?: string | null; bindingApplied?: boolean }
export interface ReplacementJob {
  id: string;
  state: string;
  total: number;
  finished: number;
  mode?: string;
  creatorName?: string;
  createdAt?: string;
  error?: string | null;
  DONE?: number;
  SKIPPED?: number;
  FAILED?: number;
  NEEDS_REVIEW?: number;
  items?: ReplacementItem[];
}

export const REPLACEMENT_STATE_LABELS = (): Record<string, string> => ({
  QUEUED: t('排队中'), PREPARING: t('校验中'), SUBMITTING: t('提交中'), RUNNING: t('更换中'), VERIFYING: t('核对绑定中'),
  COMPLETED: t('已完成'), PARTIAL_FAILED: t('部分失败'), FAILED: t('失败'), NEEDS_REVIEW: t('待核对'), DONE: t('绑定完成'),
  SKIPPED: t('已是目标代理'), PENDING: t('待校验'), READY: t('待提交'), SUBMITTED: t('处理中'),
});
export const replacementStateLabel = (state: string) => REPLACEMENT_STATE_LABELS()[state] || state;

/** Job states after which progress stops changing on its own. */
export const REPLACEMENT_TERMINAL = new Set(['COMPLETED', 'PARTIAL_FAILED', 'FAILED', 'NEEDS_REVIEW']);

// --- Credential refresh ---------------------------------------------------------------
export interface CredentialRefresh { id?: string; status?: string; reauthorizationAllowed?: boolean; paused?: boolean }

// --- Reauthorization --------------------------------------------------------------------
export interface Reauthorization {
  id?: string;
  status?: string;
  mode?: 'OAUTH' | 'REFRESH_TOKEN';
  submitted?: boolean;
  busy?: boolean;
  expiredUnsaved?: boolean;
  paused?: boolean;
  updatedAt?: string;
  authUrl?: string;
  expiresAt?: string | null;
  credentialSaved?: boolean;
  queryFailed?: boolean;
  message?: string;
  reauthorizationAllowed?: boolean;
}

export const REAUTH_STATUS_LABELS = (): Record<string, string> => ({
  NONE: t('尚未开始'), INITIALIZING: t('正在生成授权链接'), READY: t('等待提交新凭据'), SUBMITTING: t('正在提交，等待确认'),
  UNKNOWN: t('结果待查询'), NOT_FOUND: t('尚未查到操作'), FAILED: t('授权链接生成失败'), CANCELLED: t('已重新发起授权'),
  pending: t('等待处理'), exchanging: t('凭据交换结果待核对'), staged: t('凭据已暂存，等待保存'), saved: t('凭据已保存，等待同步'),
  installed: t('主实例已同步，等待其他实例'), complete: t('授权同步完成'), superseded: t('已被后续凭据更新替代'),
});

/** Submitted reauthorizations in these states are polled every 3 s. */
export const REAUTH_POLLING = new Set(['SUBMITTING', 'pending', 'staged', 'saved', 'installed']);
