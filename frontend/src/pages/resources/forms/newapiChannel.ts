// NewAPI channel helpers (port of runtime/newapi-channel.js). A NewAPI resource
// links an existing upstream channel; its quota stays in upstream raw units.
import { t } from '../../../lib/i18n';
import type { Resource } from '../resources';

export { channelLabel, isNewApi } from '../resources';

/** Usage snapshot of a NewAPI channel (`resource.usage`). */
export interface NewApiUsage {
  unit?: string | null;
  used_quota?: number | string | null;
  balance?: number | string | null;
  queriedAt?: string | null;
}

export const newApiUsage = (resource: Resource) => (resource.usage ?? null) as NewApiUsage | null;

/** Upstream raw number, or 未查询. */
export const usageNumber = (value: number | string | null | undefined) => (value == null ? t('未查询') : String(value));

/** `/resources/{id}/upstream-channel` accepts a positive integer of at most 18 digits. */
export const CHANNEL_ID_PATTERN = /^[1-9][0-9]{0,17}$/;

/** `/resource-targets` row. */
export interface ResourceTarget { id: string; name: string; enabled: boolean; protocol: string }
