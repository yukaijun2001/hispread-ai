// NewAPI delivery (resource intake) helpers: provider types, request shapes and
// the local file checks of NewDelivery. Files are read in the browser only.
import { t } from '../../../lib/i18n';
import type { SelectOption } from '../../../components/ui/types';

/** NewAPI channel types offered for delivery, in display order. */
export const PROVIDER_OPTIONS: SelectOption[] = [
  { value: '1', label: 'OpenAI' },
  { value: '3', label: 'Azure OpenAI' },
  { value: '14', label: 'Anthropic' },
  { value: '24', label: 'Google Gemini' },
  { value: '33', label: 'AWS Bedrock' },
  { value: '41', label: 'Google Vertex' },
  { value: '60', label: 'NewAPI' },
];
export const providerLabel = (type: number | string) => PROVIDER_OPTIONS.find((option) => option.value === String(type))?.label || '—';

export interface IntakeChannel {
  type: number;
  name?: string;
  key: string;
  base_url?: string | null;
  models?: string | null;
  settings?: string;
  [key: string]: unknown;
}
/** One NewAPI channel request (`mode` single / batch / multi_to_single). */
export interface IntakeRequest { mode: string; multi_key_mode?: string; channel: IntakeChannel }
export type IntakeBody = IntakeRequest | { requests: IntakeRequest[] } | Record<string, unknown>;

export interface RecognizeResult { recognized: boolean; request?: IntakeRequest | { requests: IntakeRequest[] } | null; raw?: boolean; message?: string | null }
export interface PreviewResult { resourceCount: number; keyCount: number }

/** Keys counted for the recognised-resources table: one per line in batch mode. */
export const keyCount = (request: IntakeRequest) => (request.mode === 'batch' ? request.channel.key.split('\n').filter(Boolean).length : 1);
/** API address without query or fragment (they may carry secrets). */
export const endpointLabel = (request: IntakeRequest) => request.channel.base_url?.split(/[?#]/)[0] || t('默认地址');

const SERVICE_ACCOUNT_MAX_BYTES = 1048576;
const SERVICE_ACCOUNT_MAX_CHARS = 64e3;
const INTAKE_FILE_MAX_BYTES = 2e5;

/** Validate a Google service-account JSON (BOM allowed). Throws the user-facing message. */
export function parseServiceAccount(text: string): Record<string, unknown> {
  let parsed: unknown;
  try {
    parsed = JSON.parse(text.replace(/^\uFEFF/, ''));
  } catch {
    throw new Error(t('JSON 语法无效，请选择有效的服务账号 JSON 文件。'));
  }
  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) throw new Error(t('服务账号 JSON 须为对象。'));
  const account = parsed as Record<string, unknown>;
  if (account.type !== 'service_account') throw new Error(t('请选择 Google 服务账号 JSON（type 为 service_account）。'));
  for (const field of ['project_id', 'client_email', 'private_key']) {
    const value = account[field];
    if (typeof value !== 'string' || !value.trim()) throw new Error(t('服务账号 JSON 缺少必要字段 {0}。', [field]));
  }
  if (JSON.stringify(account).length > SERVICE_ACCOUNT_MAX_CHARS) throw new Error(t('服务账号 JSON 内容过长，整理后的内容不能超过 64,000 字符。'));
  return account;
}

export async function readServiceAccountFile(file: File): Promise<Record<string, unknown>> {
  if (file.size > SERVICE_ACCOUNT_MAX_BYTES) throw new Error(t('JSON 文件不能超过 1 MiB。'));
  return parseServiceAccount(await file.text());
}

/** Read a delivery data file: TXT or JSON, ≤ 200 KB, non-empty, no NUL bytes, strict UTF-8. */
export async function readIntakeFile(file: File): Promise<string> {
  if (!/\.(txt|json)$/i.test(file.name) || file.size > INTAKE_FILE_MAX_BYTES) throw new Error(t('请上传 200 KB 以内的 TXT 或 JSON 文件。'));
  const bytes = new Uint8Array(await file.arrayBuffer());
  if (!bytes.length || bytes.includes(0)) throw new Error(t('请选择有内容的文本文件。'));
  try {
    return new TextDecoder('utf-8', { fatal: true }).decode(bytes);
  } catch {
    throw new Error(t('文件编码不是 UTF-8，请另存为 UTF-8 后重试。'));
  }
}
