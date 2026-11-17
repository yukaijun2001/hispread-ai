// NewAPI intake records (`/resource-intakes/{id}`) and their assignment to a quote project.
import type { QuotePrice } from '../../lib/money';

export interface QuoteBasis extends QuotePrice {
  currency?: string | null;
  effectiveFrom?: string | null;
  effectiveTo?: string | null;
}

/** `GET /resource-intakes/{id}`. */
export interface IntakeRecord {
  id: string;
  name: string;
  readOnly?: boolean;
  channelType?: number | null;
  memberCount?: number;
  projectName?: string | null;
  state?: 'UNASSIGNED' | 'ASSIGNED' | string;
  assignedAt?: string | null;
  quoteBasis?: QuoteBasis | null;
  configuration?: { base_url?: unknown; models?: unknown; [key: string]: unknown } | null;
  [key: string]: unknown;
}

/** `GET /resource-intakes/{id}/eligible-projects` row. */
export interface EligibleProject { id: string; name: string; quoteToken: string; quoteBasis: QuoteBasis }

/** `POST /resource-intakes/{id}/material` (secrets; POST so nothing caches it). */
export interface IntakeMaterial { channel?: { key?: unknown; model_mapping?: unknown; [key: string]: unknown } | null }

/** Pretty JSON for objects and JSON strings; other values as text; — when missing. */
export function jsonText(value: unknown): string {
  if (value == null) return '—';
  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value);
      if (parsed && typeof parsed === 'object') return JSON.stringify(parsed, null, 2);
    } catch { /* plain text */ }
    return value;
  }
  return typeof value === 'object' ? JSON.stringify(value, null, 2) : String(value);
}

/** Distinct, trimmed models from the comma-separated `configuration.models`. */
export const modelList = (models: unknown) =>
  (typeof models === 'string' ? [...new Set(models.split(',').map((model) => model.trim()).filter(Boolean))] : []);
