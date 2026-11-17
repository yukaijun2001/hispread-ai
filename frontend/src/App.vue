<script setup lang="ts">
// Session gate: boot → sign-in → first-time onboarding → console.
import { onBeforeUnmount, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import AppShell from './shell/AppShell.vue';
import BrandLogo from './shell/BrandLogo.vue';
import Spinner from './components/ui/Spinner.vue';
import ToastHost from './components/ui/ToastHost.vue';
import LoginPage from './shell/auth/LoginPage.vue';
import OnboardingPage from './shell/auth/OnboardingPage.vue';
import { apiFetch } from './lib/api';
import { applyDocumentLanguage, installValidationMessages } from './lib/i18n';
import type { SessionUser } from './navigation/access';
import { useSessionStore } from './stores/session';

const session = useSessionStore();
const router = useRouter();

applyDocumentLanguage();
let uninstallValidation: (() => void) | undefined;
onMounted(() => {
  uninstallValidation = installValidationMessages();
  void session.boot();
});
onBeforeUnmount(() => uninstallValidation?.());

function onLogin(user: SessionUser) {
  session.signedIn(user);
  void router.push('/workbench');
}

async function onOnboardingDone() {
  session.user = await apiFetch<SessionUser>('/auth/me');
  session.refresh();
  void router.push('/workbench');
}

async function onOnboardingLogout() {
  await session.logout();
}
</script>

<template>
  <div v-if="session.booting" class="hs-boot">
    <BrandLogo :height="44" />
    <Spinner :size="18" />
  </div>
  <LoginPage v-else-if="!session.user" @login="onLogin" />
  <OnboardingPage
    v-else-if="session.user.onboardingRequired && !session.user.mustChangePassword"
    :approval-required="session.user.supplierRegistrationApprovalEnabled !== false"
    :on-done="onOnboardingDone"
    :on-logout="onOnboardingLogout"
  />
  <AppShell v-else />
  <ToastHost />
</template>

<style scoped>
.hs-boot { display: grid; place-content: center; justify-items: center; gap: 18px; min-height: 100vh; color: var(--hs-text-3); background: var(--hs-bg); }
</style>
