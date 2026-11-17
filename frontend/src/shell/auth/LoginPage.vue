<script setup lang="ts">
// Sign in and self-registration. Registration loads the password policy
// first; after a successful registration the form returns to sign-in.
import { computed, onMounted, ref, watch } from 'vue';
import Button from '../../components/ui/Button.vue';
import Icon from '../../components/ui/Icon.vue';
import Notice from '../../components/ui/Notice.vue';
import BrandLogo from '../BrandLogo.vue';
import LanguagePicker from './LanguagePicker.vue';
import LoginParticles from './LoginParticles.vue';
import { apiFetch, apiPost, login } from '../../lib/api';
import { t } from '../../lib/i18n';
import { checkForNewRelease } from '../../lib/version';
import type { SessionUser } from '../../navigation/access';

interface RegistrationPolicy { passwordMinLength: number; passwordMaxLength: number; requireUpper: boolean; requireLower: boolean; requireDigit: boolean; requireSymbol: boolean }

const emit = defineEmits<{ login: [user: SessionUser] }>();

const registering = ref(false);
const username = ref('');
const password = ref('');
const confirm = ref('');
const showPassword = ref(false);
const showConfirm = ref(false);
const busy = ref(false);
const error = ref('');
const success = ref('');
const policy = ref<RegistrationPolicy | null>(null);
const policyLoading = ref(false);
const policyFailed = ref(false);
const policyAttempt = ref(0);

onMounted(() => { void checkForNewRelease(); });

watch([registering, policyAttempt], ([active]) => {
  if (!active) return;
  policy.value = null;
  policyLoading.value = true;
  policyFailed.value = false;
  apiFetch<RegistrationPolicy>('/auth/registration-policy')
    .then((value) => { if (registering.value) policy.value = value; })
    .catch(() => { if (registering.value) policyFailed.value = true; })
    .finally(() => { policyLoading.value = false; });
});

const policyText = computed(() => {
  const p = policy.value;
  if (!p) return '';
  const parts = [p.requireUpper && t('大写字母'), p.requireLower && t('小写字母'), p.requireDigit && t('数字'), p.requireSymbol && t('符号')].filter(Boolean) as string[];
  const contains = parts.length === 0 ? '' : parts.length === 1 ? parts[0] : t('{0}和{1}', [parts.slice(0, -1).join(t('、')), parts.at(-1)]);
  const length = p.passwordMinLength === p.passwordMaxLength ? t('{0} 位', [p.passwordMinLength]) : t('{0}–{1} 位', [p.passwordMinLength, p.passwordMaxLength]);
  return t('密码需为 {0}{1}。', [length, contains ? t('，并包含{0}', [contains]) : '']);
});

async function submit() {
  busy.value = true;
  error.value = '';
  try {
    if (registering.value) {
      if (password.value !== confirm.value) throw new Error(t('两次输入的密码不一致'));
      await apiPost('/auth/register', { username: username.value.trim(), password: password.value });
      registering.value = false;
      password.value = '';
      confirm.value = '';
      showPassword.value = false;
      showConfirm.value = false;
      success.value = t('注册成功，请登录后填写个人及企业资料');
    } else {
      await login(username.value, password.value);
      emit('login', await apiFetch<SessionUser>('/auth/me'));
    }
  } catch (reason) {
    error.value = (reason as Error).message;
  } finally {
    busy.value = false;
  }
}

function switchMode() {
  registering.value = !registering.value;
  error.value = '';
  success.value = '';
  password.value = '';
  confirm.value = '';
  showPassword.value = false;
  showConfirm.value = false;
}
</script>

<template>
  <div class="hs-login">
    <header class="top">
      <BrandLogo :height="44" />
      <div class="top-actions">
        <span class="customer">{{ t('我是客户，前往官网') }}<Icon name="arrow" :size="15" /></span>
        <LanguagePicker />
      </div>
    </header>

    <main class="stage">
      <section class="hero" aria-labelledby="login-hero-title">
        <div class="art"><LoginParticles /></div>
        <div class="copy">
          <h2 id="login-hero-title">{{ t('让每一个想法') }}<br />{{ t('流向') }}<span>{{ t('无限可能') }}</span></h2>
          <p>{{ t('连接前沿 AI 与你的创造力。') }}<br />{{ t('在 Hispread，让下一次突破从此刻开始。') }}</p>
        </div>
      </section>

      <section class="card" :aria-label="registering ? t('创建账号') : t('登录')">
        <h1 v-if="registering">{{ t('创建账号') }}</h1>
        <h1 v-else>{{ t('欢迎回到') }} <span>Hispread</span></h1>
        <p class="sub">{{ registering ? t('注册后登录，再填写个人及企业资料。') : t('使用平台分配的账号登录控制台。') }}</p>

        <form class="form" @submit.prevent="submit">
          <label class="field-row">
            <span>{{ t('账号') }}</span>
            <span class="input">
              <Icon name="users" :size="16" />
              <input v-model="username" name="username" type="text" required autocomplete="username" :placeholder="t('输入账号')" />
            </span>
          </label>
          <label class="field-row">
            <span>{{ t('密码') }}</span>
            <span class="input">
              <Icon name="lock" :size="16" />
              <input v-model="password" :type="showPassword ? 'text' : 'password'" required :autocomplete="registering ? 'new-password' : 'current-password'" :placeholder="t('输入密码')" />
              <button type="button" class="reveal" :aria-label="t(showPassword ? '隐藏密码' : '显示密码')" :aria-pressed="showPassword" @click="showPassword = !showPassword">
                <Icon :name="showPassword ? 'eye-off' : 'eye'" :size="17" />
              </button>
            </span>
          </label>
          <p v-if="registering" class="policy" role="note" aria-live="polite">
            <template v-if="policyLoading">{{ t('正在读取密码规则…') }}</template>
            <template v-else-if="policy">{{ policyText }}</template>
            <template v-else-if="policyFailed">{{ t('密码规则读取失败。') }} <button type="button" class="link" @click="policyAttempt++">{{ t('重试') }}</button></template>
          </p>
          <label v-if="registering" class="field-row">
            <span>{{ t('确认密码') }}</span>
            <span class="input">
              <Icon name="lock" :size="16" />
              <input v-model="confirm" :type="showConfirm ? 'text' : 'password'" required autocomplete="new-password" />
              <button type="button" class="reveal" :aria-label="t(showConfirm ? '隐藏确认密码' : '显示确认密码')" :aria-pressed="showConfirm" @click="showConfirm = !showConfirm">
                <Icon :name="showConfirm ? 'eye-off' : 'eye'" :size="17" />
              </button>
            </span>
          </label>
          <Notice v-if="success" tone="success">{{ success }}</Notice>
          <Notice v-if="error" tone="danger">{{ error }}</Notice>
          <Button type="submit" variant="primary" block trailing-icon="arrow" :loading="busy" :disabled="registering && !policy" class="submit">
            {{ busy ? t('请稍候…') : registering ? t('创建账号') : t('登录') }}
          </Button>
          <button type="button" class="link switch" :disabled="busy" @click="switchMode">{{ registering ? t('已有账号？返回登录') : t('没有账号？立即注册') }}</button>
        </form>
      </section>
    </main>

    <footer class="entity"><strong>HIN Technology co., Limited</strong></footer>
  </div>
</template>

<style scoped>
.hs-login {
  --particle-base: #4169d9;
  --particle-cyan: #168baf;
  --particle-purple: #7663d6;
  display: grid; grid-template-rows: auto 1fr auto; min-height: 100vh;
  padding: 0 clamp(20px, 5vw, 72px);
  color: var(--hs-text); background: radial-gradient(60% 50% at 30% 45%, #ffffff 0%, var(--hs-bg) 100%);
  font-family: var(--hs-font);
}
.top { display: flex; align-items: center; justify-content: space-between; gap: 16px; height: 88px; }
.top-actions { display: flex; align-items: center; gap: 16px; }
.customer { display: inline-flex; align-items: center; gap: 6px; color: var(--hs-text-2); font-size: var(--hs-text-sm); }
.stage { display: grid; grid-template-columns: minmax(0, 1.1fr) minmax(360px, 420px); align-items: center; gap: clamp(24px, 6vw, 96px); padding: 24px 0 40px; }
.hero { position: relative; min-height: 560px; display: flex; align-items: center; }
.art { position: absolute; inset: 0 auto 0 22%; width: 46%; }
.copy { position: relative; max-width: 460px; }
.copy h2 { margin: 0; font-size: clamp(36px, 4.4vw, 54px); font-weight: 500; letter-spacing: -1px; line-height: 1.25; }
.copy h2 span { color: #5b4cc4; }
.copy p { margin: 22px 0 0; color: var(--hs-text-2); font-size: var(--hs-text-md); line-height: 1.9; }
.card { padding: 36px 32px 28px; background: var(--hs-surface); border: 1px solid var(--hs-border); border-radius: 22px; box-shadow: 0 24px 60px -24px rgb(0 0 0 / 18%); }
.card h1 { margin: 0; font-size: 26px; font-weight: 600; letter-spacing: -.5px; }
.card h1 span { color: #5b4cc4; }
.sub { margin: 6px 0 24px; color: var(--hs-text-3); font-size: var(--hs-text-sm); }
.form { display: grid; gap: 16px; }
.field-row { display: grid; gap: 6px; color: var(--hs-text-2); font-size: var(--hs-text-xs); font-weight: 500; }
.input { display: flex; align-items: center; gap: 10px; height: 46px; padding: 0 14px; color: var(--hs-text-3); background: var(--hs-surface-subtle); border: 1px solid var(--hs-border-strong); border-radius: 12px; transition: border-color .15s, box-shadow .15s; }
.input:focus-within { background: var(--hs-surface); border-color: var(--hs-accent); box-shadow: var(--hs-accent-ring); }
.input input { flex: 1; min-width: 0; height: 100%; padding: 0; color: var(--hs-text); background: none; border: 0; border-radius: 0; outline: none; box-shadow: none; font: inherit; font-size: var(--hs-text-md); font-weight: 400; }
.reveal { display: grid; place-items: center; width: 28px; height: 28px; min-height: 0; padding: 0; color: var(--hs-text-3); background: none; border: 0; border-radius: 8px; cursor: pointer; }
.reveal:hover { color: var(--hs-text); background: var(--hs-surface-hover); }
.policy { margin: -8px 0 0; color: var(--hs-text-3); font-size: var(--hs-text-xs); line-height: 1.6; }
.submit { height: 46px; margin-top: 6px; font-size: var(--hs-text-md); }
.link { min-height: 0; padding: 0; color: var(--hs-accent); background: none; border: 0; font: inherit; font-size: var(--hs-text-sm); cursor: pointer; }
.link:hover:not(:disabled) { text-decoration: underline; text-underline-offset: 3px; }
.switch { justify-self: center; }
.entity { display: flex; justify-content: center; padding: 18px 0 24px; color: var(--hs-text-4); border-top: 1px solid var(--hs-border); font-size: var(--hs-text-xs); }
.entity strong { font-weight: 500; }
@media (max-width: 900px) {
  .stage { grid-template-columns: minmax(0, 1fr); }
  .hero { min-height: 260px; }
  .art { inset: 0 0 0 auto; width: 50%; opacity: .7; }
  .customer { display: none; }
}
</style>
