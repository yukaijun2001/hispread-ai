// Team (supplier member accounts and departments) types and helpers.
import { getLocale, t } from '../../lib/i18n';
import type { SelectOption } from '../../components/ui/types';

export interface AgentProject { id: string; name: string; category?: string | null; categoryName?: string | null }

export interface SupplierAgent {
  id: string;
  username: string;
  displayName: string;
  enabled: boolean;
  version: number;
  projects?: AgentProject[];
}

export interface TeamGroup {
  id: string;
  name: string;
  adminUserId?: string | null;
  memberIds: string[];
  allowPro?: boolean;
  version: number;
}

export interface PermissionProject extends AgentProject { assignable?: boolean }
export interface AgentProjects { assignedIds: string[]; availableProjects: PermissionProject[] }

export interface RegistrationPolicy {
  passwordMinLength: number;
  passwordMaxLength: number;
  requireUpper: boolean;
  requireLower: boolean;
  requireDigit: boolean;
  requireSymbol: boolean;
}

/** Filter key for a project category; projects without one share `uncategorized`. */
export const categoryKey = (category?: string | null) => (category ? `category:${category}` : 'uncategorized');

/** "全部大类" followed by each category present in `projects`, sorted by label. */
export function categoryOptions(projects: AgentProject[]): SelectOption[] {
  const labels = new Map<string, string>();
  projects.forEach((project) => labels.set(categoryKey(project.category), project.categoryName || project.category || t('未分类')));
  return [
    { value: '', label: t('全部大类') },
    ...Array.from(labels, ([value, label]) => ({ value, label })).sort((a, b) => a.label.localeCompare(b.label, getLocale())),
  ];
}

export const agentIdentity = (agent: Pick<SupplierAgent, 'displayName' | 'username'>) => `${agent.displayName} · ${agent.username}`;

/** Group of each member id. */
export const groupByMember = (groups: TeamGroup[]) => new Map(groups.flatMap((group) => group.memberIds.map((id) => [id, group] as const)));

/** Required character classes the policy names. */
export function policyRequirements(policy: RegistrationPolicy | null): string[] {
  if (!policy) return [];
  return [
    policy.requireUpper && t('大写字母'), policy.requireLower && t('小写字母'),
    policy.requireDigit && t('数字'), policy.requireSymbol && t('符号'),
  ].filter((item): item is string => !!item);
}

/** What a typed password still lacks. Length counts code points; classes are Unicode-aware. */
export function passwordProblems(policy: RegistrationPolicy | null, password: string): string[] {
  if (!policy || !password) return [];
  const length = Array.from(password).length;
  return [
    (length < policy.passwordMinLength || length > policy.passwordMaxLength) && t('长度须为 {0}—{1} 位', [policy.passwordMinLength, policy.passwordMaxLength]),
    policy.requireUpper && !/\p{Lu}/u.test(password) && t('大写字母'),
    policy.requireLower && !/\p{Ll}/u.test(password) && t('小写字母'),
    policy.requireDigit && !/\p{Nd}/u.test(password) && t('数字'),
    policy.requireSymbol && !/[^\p{L}\p{N}\s]/u.test(password) && t('符号'),
  ].filter((item): item is string => !!item);
}
