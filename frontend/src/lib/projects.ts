import { t } from './i18n';
import { DELIVERY_TYPE_LABELS, SETTLEMENT_MODE_LABELS } from './labels';
import type { CapacitySpec } from './labels';
import type { SelectOption } from '../components/ui/types';

export interface Project extends CapacitySpec {
  id: string;
  name: string;
  code: string;
  category?: string | null;
  categoryName?: string | null;
  enabled: boolean;
  settlementMethod: 'QUOTA' | 'ACCOUNT_BUYOUT' | 'LEGACY' | string;
  deliveryMethod: string;
  unit?: string | null;
  suggestedMultiplier?: string | null;
}

export const projectCategory = (project: Pick<Project, 'categoryName' | 'category'>) => project.categoryName || project.category || t('未分类');

/**
 * Select option for a project. Same-named projects are told apart by category
 * (when it differs), settlement and delivery method, then a running number.
 * With `markDisabled`, disabled projects are shown but cannot be picked.
 */
export function projectOption(project: Project, all: Project[], markDisabled = false): SelectOption {
  const namesakes = all.filter((p) => p.name === project.name);
  const category = projectCategory(project);
  const categoriesDiffer = namesakes.some((p) => projectCategory(p) !== category);
  const settlement = SETTLEMENT_MODE_LABELS();
  const delivery = DELIVERY_TYPE_LABELS();
  const describe = (p: Project) => [categoriesDiffer ? projectCategory(p) : '', settlement[p.settlementMethod], delivery[p.deliveryMethod]].filter(Boolean).join(' · ');
  const description = describe(project);
  const twins = namesakes.filter((p) => describe(p) === description).sort((a, b) => a.code.localeCompare(b.code) || a.id.localeCompare(b.id));
  const index = twins.findIndex((p) => p.id === project.id);
  const qualifier = [description, twins.length > 1 ? t('同名项目 {0}', [index + 1]) : ''].filter(Boolean).join(' · ');
  const disabled = markDisabled && !project.enabled;
  return {
    value: project.id,
    label: project.name,
    shortLabel: qualifier ? `${project.name} · ${qualifier}` : project.name,
    detail: [qualifier, disabled ? t('已停用') : ''].filter(Boolean).join(' · '),
    disabled,
  };
}
