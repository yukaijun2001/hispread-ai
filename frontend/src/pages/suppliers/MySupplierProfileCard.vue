<script setup lang="ts">
// The supplier's own profile. Changes are submitted for platform review; while a
// change is pending the current (effective) profile stays visible and read-only.
import { computed, ref } from 'vue';
import Card from '../../components/ui/Card.vue';
import Avatar from '../../components/ui/Avatar.vue';
import Button from '../../components/ui/Button.vue';
import DetailList from '../../components/ui/DetailList.vue';
import FormField from '../../components/ui/FormField.vue';
import Notice from '../../components/ui/Notice.vue';
import Select from '../../components/ui/Select.vue';
import StatusBadge from '../../components/ui/StatusBadge.vue';
import TextInput from '../../components/ui/TextInput.vue';
import { apiPut } from '../../lib/api';
import { t } from '../../lib/i18n';
import { formatDateTime } from '../../lib/money';
import { useSessionStore } from '../../stores/session';
import { CYCLE_OPTIONS, cycleLabel } from './suppliers';
import type { OwnSupplier } from './supplierAccounts';

const props = defineProps<{ supplier: OwnSupplier }>();
const session = useSessionStore();

type FormKey = 'name' | 'registrationNo' | 'country' | 'contact' | 'phone' | 'email' | 'cycle' | 'customCycleDays';
const editing = ref(false);
const form = ref<Record<FormKey, string>>({ name: '', registrationNo: '', country: '', contact: '', phone: '', email: '', cycle: '', customCycleDays: '' });
const saving = ref(false);
const error = ref('');

const typeLabel = computed(() => (props.supplier.supplierType === 'INDIVIDUAL' ? t('个人') : t('企业')));
const company = computed(() => props.supplier.supplierType === 'COMPANY');
const cycleOptions = CYCLE_OPTIONS().map(({ value, label }) => ({ value: value as string, label }));

const identityItems = computed<Array<[string, string | null | undefined]>>(() => [
  [t('主体类型'), typeLabel.value],
  ...(company.value ? [[t('企业注册编号'), props.supplier.registrationNo] as [string, string | null | undefined]] : []),
  [t('国家 / 地区'), props.supplier.country],
]);
const contactItems = computed<Array<[string, string | null | undefined]>>(() => [
  [t('联系人'), props.supplier.contact],
  [t('联系电话'), props.supplier.phone || t('未填写')],
  [t('电子邮箱'), props.supplier.email || t('未填写')],
  [t('结算周期'), cycleLabel(props.supplier.cycle, props.supplier.customCycleDays)],
]);

function startEdit() {
  const s = props.supplier;
  form.value = {
    name: s.name ?? '', registrationNo: s.registrationNo ?? '', country: s.country ?? '', contact: s.contact ?? '',
    phone: s.phone ?? '', email: s.email ?? '', cycle: s.cycle ?? '', customCycleDays: String(s.customCycleDays ?? ''),
  };
  error.value = '';
  editing.value = true;
}

function setField(key: FormKey, value: string) {
  form.value = { ...form.value, [key]: value, ...(key === 'cycle' ? { customCycleDays: '' } : {}) };
}
const cycleModel = computed({ get: () => form.value.cycle, set: (value: string) => setField('cycle', value) });

async function submit() {
  if (saving.value) return;
  saving.value = true;
  error.value = '';
  const f = form.value;
  try {
    await apiPut(`/suppliers/${props.supplier.id}`, {
      name: f.name,
      registrationNo: f.registrationNo || '',
      supplierType: props.supplier.supplierType,
      country: f.country,
      contact: f.contact,
      phone: f.phone,
      email: f.email?.trim() || '',
      cycle: f.cycle,
      customCycleDays: f.cycle === 'CUSTOM' ? Number(f.customCycleDays) : null,
      version: props.supplier.version,
    });
    session.notify(t('资料修改已提交审核'));
    editing.value = false;
    session.refresh();
  } catch (reason) {
    error.value = (reason as Error).message;
  } finally {
    saving.value = false;
  }
}
</script>

<template>
  <Card>
    <template #header>
      <div class="ms-head">
        <Avatar :name="supplier.name" :size="44" square />
        <div class="ms-identity">
          <h2>{{ supplier.name }}</h2>
          <p>{{ typeLabel }}{{ supplier.country ? ` · ${supplier.country}` : '' }}</p>
        </div>
        <div class="ms-status">
          <span>{{ t('资料审核') }}</span>
          <StatusBadge :state="supplier.profileReviewState || supplier.state" />
        </div>
      </div>
    </template>

    <div class="ms-body">
      <Notice v-if="supplier.pendingProfile" tone="warning">{{ t('资料修改已提交审核；审核通过前，下面显示的是当前生效资料。') }}</Notice>
      <Notice v-if="!supplier.enabled" tone="warning">{{ t('目前合作已停用，历史资料仍可查看。') }}</Notice>
      <Notice v-if="supplier.profileReviewState === 'REJECTED' && supplier.reviewNote" tone="danger">{{ t('审核意见：') }}{{ supplier.reviewNote }}</Notice>

      <form class="ms-form" @submit.prevent="submit">
        <section class="ms-section">
          <h3>{{ t('主体信息') }}</h3>
          <div v-if="editing" class="ms-grid">
            <FormField :label="t('主体名称')" required>
              <template #default="{ id }"><TextInput :id="id" :model-value="form.name" required @update:model-value="setField('name', $event)" /></template>
            </FormField>
            <FormField :label="t('主体类型')">
              <strong class="ms-fixed">{{ typeLabel }}</strong>
            </FormField>
            <FormField v-if="company" :label="t('企业注册编号')" required>
              <template #default="{ id }"><TextInput :id="id" :model-value="form.registrationNo" required @update:model-value="setField('registrationNo', $event)" /></template>
            </FormField>
            <FormField :label="t('国家 / 地区')" required>
              <template #default="{ id }"><TextInput :id="id" :model-value="form.country" required @update:model-value="setField('country', $event)" /></template>
            </FormField>
          </div>
          <DetailList v-else :items="identityItems" />
        </section>

        <section class="ms-section">
          <h3>{{ t('联系与结算') }}</h3>
          <div v-if="editing" class="ms-grid">
            <FormField :label="t('联系人')" required>
              <template #default="{ id }"><TextInput :id="id" :model-value="form.contact" required @update:model-value="setField('contact', $event)" /></template>
            </FormField>
            <FormField :label="t('联系电话')">
              <template #default="{ id }"><TextInput :id="id" :model-value="form.phone" :placeholder="t('选填')" @update:model-value="setField('phone', $event)" /></template>
            </FormField>
            <FormField :label="t('电子邮箱')" :hint="t('填写时需为有效邮箱格式')">
              <template #default="{ id }"><TextInput :id="id" :model-value="form.email" type="email" :placeholder="t('选填')" @update:model-value="setField('email', $event)" /></template>
            </FormField>
            <FormField :label="t('结算周期')">
              <template #default="{ id }"><Select :id="id" v-model="cycleModel" :options="cycleOptions" :label="t('结算周期')" /></template>
            </FormField>
            <FormField v-if="form.cycle === 'CUSTOM'" :label="t('每隔多少天结算')" :hint="t('结算单的实际起止日期仍在创建时确认')" required>
              <template #default="{ id }">
                <TextInput :id="id" :model-value="form.customCycleDays" type="number" min="1" max="365" step="1" required :placeholder="t('例如 10')"
                  @update:model-value="setField('customCycleDays', $event)" />
              </template>
            </FormField>
          </div>
          <DetailList v-else :items="contactItems" />
        </section>

        <Notice v-if="error" tone="danger">{{ error }}</Notice>

        <div class="ms-footer">
          <span>{{ t('最近更新：') }}{{ formatDateTime(supplier.updatedAt) }}</span>
          <div class="ms-actions">
            <template v-if="editing">
              <Button :disabled="saving" @click="editing = false">{{ t('取消') }}</Button>
              <Button type="submit" variant="primary" :disabled="saving">{{ saving ? t('提交中…') : t('提交资料修改') }}</Button>
            </template>
            <Button v-else-if="session.has('supplier.write') && !supplier.pendingProfile" variant="primary" @click="startEdit">{{ t('修改资料') }}</Button>
          </div>
        </div>
      </form>
    </div>
  </Card>
</template>

<style scoped>
.ms-head { display: flex; align-items: center; gap: 14px; width: 100%; }
.ms-identity { flex: 1; min-width: 0; }
.ms-identity h2 { margin: 0; color: var(--hs-text); font-size: var(--hs-text-lg); font-weight: 600; overflow-wrap: anywhere; }
.ms-identity p { margin: 2px 0 0; color: var(--hs-text-3); font-size: var(--hs-text-xs); }
.ms-status { display: grid; justify-items: end; gap: 4px; color: var(--hs-text-3); font-size: var(--hs-text-xs); }
.ms-body { display: grid; gap: 14px; }
.ms-form { display: grid; gap: 18px; }
.ms-section { display: grid; gap: 10px; }
.ms-section h3 { margin: 0; color: var(--hs-text); font-size: var(--hs-text-sm); font-weight: 600; }
.ms-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: 12px 16px; }
.ms-fixed { display: flex; align-items: center; height: var(--hs-control-height); color: var(--hs-text); font-size: var(--hs-text-sm); font-weight: 500; }
.ms-footer { display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: 10px; padding-top: 14px; border-top: 1px solid var(--hs-divider); color: var(--hs-text-3); font-size: var(--hs-text-xs); }
.ms-actions { display: flex; gap: 8px; }
</style>
