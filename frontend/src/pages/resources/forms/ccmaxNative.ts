// CCMAX native-account helpers (port of runtime/ccmax-native.js). A native
// resource links an existing account on a CCMAX_NATIVE target.
import { ApiError } from '../../../lib/api';

export { isNativeCcmax, nativeStateLabel } from '../resources';

/** States of an operation or reauthorization whose outcome is not known yet. */
export const PENDING_STATES = ['UNKNOWN', 'SUBMITTING', 'PENDING', 'RUNNING'];
export const isPendingState = (state: string | null | undefined) => PENDING_STATES.includes(state || '');

/** The original write that must be reconciled before anything else may run. */
export type PendingOperation =
  | { kind: 'operation'; id: string }
  | { kind: 'reauthorization'; id: string }
  | { kind: 'lifecycle'; id?: string; requestKey: string };

export type NativeAction = 'usage' | 'credential-refresh' | 'PAUSE' | 'RESUME' | 'REMOVE' | 'reauthorize' | 'reauthorize-complete' | 'reconcile-pending';
export type NativeConfirmation = '' | 'PAUSE' | 'RESUME' | 'REMOVE' | 'credential-refresh';

/** Receipt of `/credential-refresh`, `/usage`, `/operations/…/reconcile` and reauthorization reads. */
export interface OperationReceipt { state: string; operationId?: string | null; id?: string | null; message?: string | null }

/** `POST /resources/{id}/reauthorizations` result. */
export interface NativeAuthorization { id: string; authUrl: string; expiresAt?: string | null }

/** `/resource-targets/{id}/accounts` row. */
export interface UpstreamAccount { id: string; name: string; status: string }

const status = (failure: unknown) => (failure instanceof ApiError ? failure.status : 0);
const code = (failure: unknown) => (failure instanceof ApiError ? failure.details?.code : undefined);

/** Lost response, server error or explicit uncertainty: keep the request key and query the original. */
export const operationUncertain = (failure: unknown) =>
  status(failure) >= 500 || !status(failure) || code(failure) === 'RESOURCE_OPERATION_UNCERTAIN';

/** Exchange may have happened: never submit the same callback again. */
export const exchangeUncertain = (failure: unknown) =>
  status(failure) >= 500 || !status(failure) || code(failure) === 'OAUTH_SESSION_NOT_READY';
