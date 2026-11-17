import { defineStore } from 'pinia';
import { computed, ref, shallowRef, watch } from 'vue';
import { apiFetch, logout as apiLogout, PASSWORD_REQUIRED_EVENT, UNAUTHORIZED_EVENT } from '../lib/api';
import type { SessionUser, SubmissionCapabilities } from '../navigation/access';

export interface Toast { id: number; message: string; error: boolean }

export const useSessionStore = defineStore('session', () => {
  const user = ref<SessionUser | null>(null);
  const booting = ref(true);
  /** Bumped to make every data view reload (login, profile change, notification read). */
  const epoch = ref(0);
  const capabilities = shallowRef<SubmissionCapabilities | null>(null);
  const toast = ref<Toast | null>(null);
  const passwordDialogOpen = ref(false);
  const profileDialogOpen = ref(false);
  let toastTimer: number | undefined;
  let toastSequence = 0;

  const has = (permission?: string) => !permission || !!user.value?.permissions.includes(permission);
  const isSupplier = computed(() => !!user.value?.supplierId);
  const displayName = computed(() => user.value?.displayName?.trim() || user.value?.username || '');

  function notify(message: string, error = false) {
    window.clearTimeout(toastTimer);
    toast.value = { id: ++toastSequence, message, error };
    toastTimer = window.setTimeout(() => { toast.value = null; }, 4500);
  }
  const dismissToast = () => { window.clearTimeout(toastTimer); toast.value = null; };

  function clear() {
    user.value = null;
    passwordDialogOpen.value = false;
    profileDialogOpen.value = false;
  }

  async function boot() {
    try {
      user.value = await apiFetch<SessionUser>('/auth/me');
    } catch {
      user.value = null;
    } finally {
      booting.value = false;
    }
  }

  function signedIn(next: SessionUser) {
    user.value = next;
    epoch.value++;
  }

  async function reloadUser() {
    user.value = await apiFetch<SessionUser>('/auth/me');
    epoch.value++;
  }

  const refresh = () => { epoch.value++; };

  async function logout() {
    await apiLogout();
    clear();
  }

  function patchUser(patch: Partial<SessionUser>) {
    if (user.value) user.value = { ...user.value, ...patch };
  }

  // A refresh re-reads the account so permission changes take effect without a reload.
  watch(epoch, (value, previous) => {
    if (!user.value || value === 0 || previous === undefined) return;
    apiFetch<SessionUser>('/auth/me').then((next) => { if (user.value) user.value = next; }).catch(() => {});
  });

  let capabilityRequest: AbortController | undefined;
  watch([() => user.value?.id, () => user.value?.permissions.includes('resource.read'), epoch], () => {
    capabilityRequest?.abort();
    capabilities.value = null;
    if (!user.value?.permissions.includes('resource.read')) return;
    const controller = new AbortController();
    capabilityRequest = controller;
    apiFetch<SubmissionCapabilities>('/resources/submission-capabilities', { signal: controller.signal })
      .then((value) => { if (!controller.signal.aborted) capabilities.value = value; })
      .catch(() => { if (!controller.signal.aborted) capabilities.value = null; });
  });

  window.addEventListener(UNAUTHORIZED_EVENT, clear);
  window.addEventListener(PASSWORD_REQUIRED_EVENT, () => patchUser({ mustChangePassword: true }));

  return {
    user, booting, epoch, capabilities, toast, passwordDialogOpen, profileDialogOpen,
    has, isSupplier, displayName, notify, dismissToast, boot, signedIn, reloadUser, refresh, logout, clear, patchUser,
  };
});
