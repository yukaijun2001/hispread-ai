// Project administration types and form helpers (recovered Projects module).
import { t } from '../../lib/i18n';
import type { Project } from '../../lib/projects';

export interface ProjectRow extends Project {
  description?: string | null;
  updatedAt?: string | null;
  version: number;
}

export interface CategoryCode { code: string; name: string; enabled: boolean; projectCount: number; version: number }

export const ENABLED_OPTIONS = () => [{ value: 'true', label: t('启用') }, { value: 'false', label: t('停用') }];
