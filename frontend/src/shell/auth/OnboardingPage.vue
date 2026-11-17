<script setup lang="ts">
// First sign-in for a new supplier: personal contact details and the supplier
// entity. Depending on platform settings the profile is reviewed or approved
// automatically.
import { ref } from 'vue';
import Button from '../../components/ui/Button.vue';
import Notice from '../../components/ui/Notice.vue';
import FormField from '../../components/ui/FormField.vue';
import TextInput from '../../components/ui/TextInput.vue';
import Select from '../../components/ui/Select.vue';
import BrandLogo from '../BrandLogo.vue';
import LanguagePicker from './LanguagePicker.vue';
import { apiPost } from '../../lib/api';
import { t } from '../../lib/i18n';

const props = defineProps<{ approvalRequired: boolean; onDone: () => Promise<void>; onLogout: () => Promise<void> }>();

const name = ref('');
const email = ref('');
const phone = ref('');
const supplierType = ref<'COMPANY' | 'INDIVIDUAL'>('COMPANY');
const companyName = ref('');
const registrationNo = ref('');
const country = ref(t('中国'));
const cycle = ref<'DAILY' | 'WEEKLY' | 'MONTHLY' | 'CUSTOM'>('MONTHLY');
const customDays = ref('');
const saving = ref(false);
const error = ref('');

const typeOptions = [{ value: 'COMPANY', label: t('企业') }, { value: 'INDIVIDUAL', label: t('个人') }];
const cycleOptions = [{ value: 'DAILY', label: t('日结') }, { value: 'WEEKLY', label: t('周结') }, { value: 'MONTHLY', label: t('月结') }, { value: 'CUSTOM', label: t('自定义') }];

async function submit() {
  if (saving.value) return;
  saving.value = true;
  error.value = '';
  try {
    const company = supplierType.value === 'COMPANY';
    await apiPost('/auth/onboarding', {
      personalName: name.value.trim(),
      personalEmail: email.value.trim(),
      personalPhone: phone.value.trim(),
      supplierType: supplierType.value,
      companyName: company ? companyName.value.trim() : '',
      registrationNo: company ? registrationNo.value.trim() : '',
      country: country.value.trim(),
      cycle: cycle.value,
      customCycleDays: cycle.value === 'CUSTOM' ? Number(customDays.value) : null,
    });
    await props.onDone();
  } catch (reason) {
    error.value = (reason as Error).message;
  } finally {
    saving.value = false;
  }
}

async function signOut() {
  try { await props.onLogout(); } catch (reason) { error.value = (reason as Error).message; }
}
</script>

<template>
  <div class="hs-onboarding">
    <section class="card">
      <header class="head">
        <BrandLogo :height="36" />
        <div class="head-actions">
          <LanguagePicker />
          <Button variant="ghost" size="sm" icon="logout" @click="signOut">{{ t('退出登录') }}</Button>
        </div>
      </header>
      <h1>{{ t('完善首次登录资料') }}</h1>
      <p class="intro">{{ t('填写个人联系信息和供应商主体资料。') }}{{ approvalRequired ? t('提交后资料进入待审核状态。') : t('提交后供应商资料将自动通过审核。') }}</p>

      <form class="form" @submit.prevent="submit">
        <h2>{{ t('个人信息') }}</h2>
        <div class="grid">
          <FormField :label="t('姓名')"><template #default="{ id }"><TextInput :id="id" v-model="name" required maxlength="100" autocomplete="name" /></template></FormField>
          <FormField :label="t('联系电话（选填）')"><template #default="{ id }"><TextInput :id="id" v-model="phone" maxlength="60" autocomplete="tel" /></template></FormField>
          <FormField :label="t('电子邮箱（选填）')"><template #default="{ id }"><TextInput :id="id" v-model="email" type="email" maxlength="160" autocomplete="email" /></template></FormField>
        </div>

        <h2>{{ t('供应商主体信息') }}</h2>
        <div class="grid">
          <FormField :label="t('主体类型')"><template #default="{ id }"><Select :id="id" v-model="supplierType" :options="typeOptions" :label="t('主体类型')" /></template></FormField>
          <template v-if="supplierType === 'COMPANY'">
            <FormField :label="t('企业名称')"><template #default="{ id }"><TextInput :id="id" v-model="companyName" required maxlength="160" autocomplete="organization" /></template></FormField>
            <FormField :label="t('统一社会信用代码或注册编号')"><template #default="{ id }"><TextInput :id="id" v-model="registrationNo" required maxlength="100" /></template></FormField>
          </template>
          <FormField :label="t('国家或地区')"><template #default="{ id }"><TextInput :id="id" v-model="country" required maxlength="80" /></template></FormField>
          <FormField :label="t('结算周期')">
            <template #default="{ id }"><Select :id="id" v-model="cycle" :options="cycleOptions" :label="t('结算周期')" @update:model-value="customDays = ''" /></template>
          </FormField>
          <FormField v-if="cycle === 'CUSTOM'" :label="t('每隔多少天结算')">
            <template #default="{ id }"><TextInput :id="id" v-model="customDays" type="number" required min="1" max="365" /></template>
          </FormField>
        </div>

        <Notice v-if="error" tone="danger">{{ error }}</Notice>
        <div class="submit">
          <Button type="submit" variant="primary" :loading="saving">{{ saving ? t('正在保存…') : t('保存资料') }}</Button>
        </div>
      </form>
    </section>
  </div>
</template>

<style scoped>
.hs-onboarding { display: grid; place-items: start center; min-height: 100vh; padding: 48px 20px; background: var(--hs-bg); font-family: var(--hs-font); color: var(--hs-text); }
.card { width: min(760px, 100%); padding: 28px 32px 32px; background: var(--hs-surface); border: 1px solid var(--hs-border); border-radius: 20px; box-shadow: var(--hs-shadow-card); }
.head { display: flex; align-items: center; justify-content: space-between; gap: 12px; margin-bottom: 28px; }
.head-actions { display: flex; align-items: center; gap: 8px; }
h1 { margin: 0; font-size: 24px; font-weight: 600; letter-spacing: -.4px; }
.intro { margin: 6px 0 0; color: var(--hs-text-3); font-size: var(--hs-text-sm); line-height: 1.7; }
.form { display: grid; gap: 14px; margin-top: 24px; }
.form h2 { margin: 10px 0 0; font-size: 15px; font-weight: 600; }
.grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 14px 18px; }
.submit { display: flex; justify-content: flex-end; margin-top: 6px; }
@media (max-width: 640px) { .grid { grid-template-columns: minmax(0, 1fr); } .card { padding: 22px 18px; } }
</style>
