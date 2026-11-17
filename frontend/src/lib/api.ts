// Same-origin JSON client for /api. Non-safe methods carry the server-issued
// CSRF header; a 401 or a password-change requirement is broadcast as a
// window event so the session layer can react wherever the request came from.
import { getLocale, t, translateServerMessage } from './i18n';

export const UNAUTHORIZED_EVENT = 'hub:unauthorized';
export const PASSWORD_REQUIRED_EVENT = 'hub:password-required';

export interface ApiErrorDetails {
  code?: string;
  traceId?: string;
  creationNotStarted: boolean;
  resourceId?: string;
  operationId?: string;
}

export class ApiError extends Error {
  status: number;
  details?: ApiErrorDetails;
  constructor(status: number, message: string, details?: ApiErrorDetails) {
    super(translateServerMessage(message) + (details?.traceId ? ` [${details.traceId}]` : ''));
    this.status = status;
    this.details = details;
  }
}

interface CsrfToken { headerName: string; token: string }
let csrf: CsrfToken | undefined;

export function clearCsrfToken() { csrf = undefined; }

export async function csrfToken(): Promise<CsrfToken> {
  if (!csrf) {
    const response = await fetch('/api/auth/csrf', { credentials: 'same-origin' });
    if (!response.ok) throw new ApiError(response.status, t('无法连接服务器'));
    csrf = await response.json() as CsrfToken;
  }
  return csrf;
}

export interface ApiInit extends RequestInit {
  /** Marks polling and other requests the user did not trigger directly. */
  background?: boolean;
}

const SAFE_METHODS = ['GET', 'HEAD', 'OPTIONS'];

export async function apiFetch<T = any>(path: string, init: ApiInit = {}): Promise<T> {
  const { background, ...request } = init;
  const method = (request.method || 'GET').toUpperCase();
  const headers = new Headers(request.headers);
  headers.set('Accept-Language', getLocale());
  if (background) headers.set('X-Hub-Background', '1');
  if (request.body && !(request.body instanceof FormData) && !headers.has('Content-Type')) headers.set('Content-Type', 'application/json');
  if (!SAFE_METHODS.includes(method)) {
    const token = await csrfToken();
    headers.set(token.headerName, token.token);
  }
  // Supplier bills are always requested in the consumption view and never served from cache.
  const supplierBill = method === 'GET' && path.startsWith('/supplier-bills/');
  let url = `/api${path}`;
  if (supplierBill) {
    const parsed = new URL(url, window.location.origin);
    parsed.searchParams.set('billView', 'consumption-v2');
    url = parsed.pathname + parsed.search;
  }
  const response = await fetch(url, { ...request, ...(supplierBill ? { cache: 'no-store' as RequestCache } : {}), headers, credentials: 'same-origin' });
  const body = await response.json().catch(() => {
    if (response.ok) throw new ApiError(502, t('服务器返回格式异常'));
    return { message: t('服务器返回格式异常') };
  });
  if (!response.ok) {
    if (response.status === 401) {
      clearCsrfToken();
      window.dispatchEvent(new Event(UNAUTHORIZED_EVENT));
    }
    if (body.code === 'PASSWORD_CHANGE_REQUIRED') window.dispatchEvent(new Event(PASSWORD_REQUIRED_EVENT));
    throw new ApiError(response.status, body.message || t('请求失败'), {
      code: typeof body.code === 'string' ? body.code : undefined,
      traceId: typeof body.traceId === 'string' && body.traceId !== 'null' ? body.traceId : undefined,
      creationNotStarted: body.creationNotStarted === true,
      resourceId: typeof body.resourceId === 'string' ? body.resourceId : undefined,
      operationId: typeof body.operationId === 'string' ? body.operationId : undefined,
    });
  }
  return body as T;
}

export const apiPost = <T = any>(path: string, body: unknown, init: ApiInit = {}) =>
  apiFetch<T>(path, { ...init, method: 'POST', body: JSON.stringify(body) });
export const apiPut = <T = any>(path: string, body: unknown, init: ApiInit = {}) =>
  apiFetch<T>(path, { ...init, method: 'PUT', body: JSON.stringify(body) });
export const apiDelete = <T = any>(path: string, init: ApiInit = {}) =>
  apiFetch<T>(path, { ...init, method: 'DELETE' });

/** Form-encoded login. A 403 usually means a stale CSRF token, so it is retried once with a fresh one. */
export async function login(username: string, password: string): Promise<void> {
  const request: RequestInit = {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ username, password }).toString(),
  };
  for (let attempt = 0; attempt < 2; attempt++) {
    clearCsrfToken();
    try {
      await apiFetch('/auth/login', request);
      clearCsrfToken();
      return;
    } catch (error) {
      if (!(error instanceof ApiError) || error.status !== 403) throw error;
      if (attempt === 1) throw new ApiError(403, t('登录安全校验失败，请刷新页面后重试'));
    }
  }
}

export async function logout(): Promise<void> {
  await apiPost('/auth/logout', {});
  clearCsrfToken();
}

export function uploadDocument(supplierId: string, file: File, category = 'QUALIFICATION') {
  const form = new FormData();
  form.set('supplierId', supplierId);
  form.set('category', category);
  form.set('file', file);
  return apiFetch('/documents', { method: 'POST', body: form });
}

/** Download a file response through a temporary object URL. */
export async function download(path: string, filename: string, init: RequestInit = {}): Promise<void> {
  const response = await fetch(`/api${path}`, { ...init, credentials: 'same-origin' });
  if (!response.ok) {
    const body = await response.json().catch(() => null);
    if (response.status === 401) {
      clearCsrfToken();
      window.dispatchEvent(new Event(UNAUTHORIZED_EVENT));
    }
    throw new ApiError(response.status, body?.message
      || t(response.status === 401 || response.status === 403 ? '无导出权限或登录已失效' : '导出失败，请重试'));
  }
  const url = URL.createObjectURL(await response.blob());
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export const exportSettlementCsv = (id: string) =>
  download(`/settlements/${encodeURIComponent(id)}/export`, `settlement-${id}.csv`);

export async function exportSettlementsCsv(query: string, ids: string[]) {
  const token = await csrfToken();
  return download(`/settlements/export?${query}`, 'settlements.csv', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', [token.headerName]: token.token },
    body: JSON.stringify({ ids }),
  });
}
