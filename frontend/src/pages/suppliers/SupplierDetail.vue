<script setup lang="ts">
// Supplier drawer (platform): profile, platform configuration, qualification
// documents and payout accounts, with code / note / linked-user / enable
// dialogs and four-eyes profile review.
import { computed, ref } from 'vue';
import { useRoute } from 'vue-router';
import Dialog from '../../components/ui/Dialog.vue';
import Avatar from '../../components/ui/Avatar.vue';
import Button from '../../components/ui/Button.vue';
import StatusBadge from '../../components/ui/StatusBadge.vue';
import DetailList from '../../components/ui/DetailList.vue';
import Notice from '../../components/ui/Notice.vue';
import Tabs from '../../components/ui/Tabs.vue';
import EmptyState from '../../components/ui/EmptyState.vue';
import Spinner from '../../components/ui/Spinner.vue';
import ReviewBox from '../../components/ReviewBox.vue';
import OwnerSection from './OwnerSection.vue';
import SupplierPlatformSettings from './SupplierPlatformSettings.vue';
import SupplierDetailDocuments from './SupplierDetailDocuments.vue';
import SupplierDetailAccounts from './SupplierDetailAccounts.vue';
import SupplierFormModal from './SupplierFormModal.vue';
import CredentialDialog from './CredentialDialog.vue';
import { useApiData } from '../../composables/useApiData';
import { apiPost, apiPut } from '../../lib/api';
import { t } from '../../lib/i18n';
import { formatDateTime } from '../../lib/money';
import { useSessionStore } from '../../stores/session';
import { CYCLE_LABELS, cycleLabel } from './suppliers';
import {
  isPlatformUser, loginAccountFields,
  type Credential, type FormValues, type Supplier, type SupplierAccount, type SupplierDocument, type UserOption,
} from './supplierAdmin';

type TabId = 'profile' | 'settings' | 'documents' | 'accounts';

const props = defineProps<{ id: string }>();
const emit = defineEmits<{ close: []; edit: [supplier: Supplier] }>();

const session = useSessionStore();
const route = useRoute();
const user = computed(() => session.user!);
const platform = computed(() => isPlatformUser(user.value) && session.has('supplier.read'));

const supplier = useApiData<Supplier>(() => `/suppliers/${props.id}`);
const accounts = useApiData<SupplierAccount[]>(() => (session.has('account.read') ? `/accounts?supplierId=${props.id}` : null));
const documents = useApiData<SupplierDocument[]>(() => `/documents?supplierId=${props.id}`);

// `?tab=` picks the first tab; 平台配置 is only for platform staff.
const requestedTab = String(route.query.tab ?? '');
const tab = ref<TabId>(requestedTab === 'settings' && !platform.value ? 'profile' : (requestedTab || 'profile') as TabId);
const tabs = computed(() => [
  { id: 'profile' as TabId, label: t('基本资料') },
  ...(platform.value ? [{ id: 'settings' as TabId, label: t('平台配置') }] : []),
  { id: 'documents' as TabId, label: t('资质材料'), count: documents.data.value?.length || 0 },
  ...(session.has('account.read') ? [{ id: 'accounts' as TabId, label: t('收款账户'), count: accounts.data.value?.length || 0 }] : []),
]);

const data = computed(() => supplier.data.value);
const profileItems = computed<Array<[string, string]>>(() => {
  const s = data.value;
  if (!s) return [];
  return [
    [t('供应商代码'), s.code],
    [t('主体名称'), s.name],
    [t('供应商类型'), s.supplierType === 'INDIVIDUAL' ? t('个人') : t('企业')],
    [t('企业注册编号'), s.supplierType === 'COMPANY' ? s.registrationNo ?? '' : t('不适用')],
    [t('联系人'), s.contact],
    [t('联系电话'), s.phone || t('未填写')],
    [t('电子邮箱'), s.email || t('未填写')],
    [t('结算周期'), cycleLabel(s.cycle, s.customCycleDays)],
    [t('更新时间'), formatDateTime(s.updatedAt)],
  ];
});

const PENDING_KEYS = ['name', 'registrationNo', 'contact', 'phone', 'email', 'country', 'cycle', 'customCycleDays'];
const pendingItems = computed<Array<[string, string]>>(() => {
  const raw = data.value?.pendingProfile;
  if (!raw) return [];
  const names: Record<string, string> = {
    name: t('主体名称'), registrationNo: t('注册编号'), contact: t('联系人'), phone: t('电话'), email: t('邮箱'),
    country: t('国家 / 地区'), cycle: t('结算周期'), customCycleDays: t('每隔多少天结算'),
  };
  const cycles = CYCLE_LABELS();
  return Object.entries(JSON.parse(raw) as Record<string, unknown>)
    .filter(([key, value]) => PENDING_KEYS.includes(key) && (key !== 'customCycleDays' || value !== null))
    .map(([key, value]) => [names[key], key === 'cycle' ? cycles[String(value)] || String(value) : key === 'email' && !value ? t('未填写') : String(value)]);
});

// Four-eyes: the submitter of the profile change cannot review it.
const canReview = computed(() => !!data.value && session.has('supplier.review') && data.value.profileReviewState === 'PENDING'
  && data.value.submittedBy !== user.value.id && data.value.profileSubmittedBy !== user.value.id);

async function review(approved: boolean, note: string) {
  await apiPost(`/suppliers/${props.id}/review`, { approved, note });
  session.notify(approved ? t('资料审核已通过') : t('已退回补充'));
  session.refresh();
}

// --- Dialogs ---------------------------------------------------------------------
const dialog = ref<'code' | 'note' | 'users' | 'enabled' | null>(null);
const credential = ref<Credential | null>(null);
const availableUsers = useApiData<UserOption[]>(() => (dialog.value === 'users' ? '/suppliers/available-users' : null));

async function saveCode(values: FormValues) {
  await apiPut(`/suppliers/${props.id}/code`, { code: values.code.trim().toUpperCase(), version: data.value!.version });
  session.refresh();
  session.notify(t('供应商编码已更新'));
}
async function saveNote(values: FormValues) {
  await apiPut(`/suppliers/${props.id}/note`, { note: values.note || '' });
  session.refresh();
  session.notify(t('备注已保存'));
}
async function linkUser(values: FormValues) {
  const result = await apiPost<Credential>(`/suppliers/${props.id}/users`, {
    mode: values.mode,
    userId: values.userId || null,
    username: values.username,
    displayName: values.displayName || data.value?.contact,
    password: values.password || null,
  });
  credential.value = result;
  session.refresh();
  session.notify(t('用户已关联'));
}
async function toggleEnabled(values: FormValues) {
  await apiPost(`/suppliers/${props.id}/enabled`, { enabled: !data.value?.enabled, note: values.note });
  session.refresh();
  session.notify(t('供应商状态已更新'));
}
</script>

<template>
  <Dialog drawer size="lg" :title="data?.name || t('供应商详情')" :subtitle="data?.code" @close="emit('close')">
    <div v-if="data" class="sd">
      <section class="sd-cover">
        <Avatar :name="data.name" :size="44" square />
        <div class="sd-cover-text">
          <strong>{{ data.country }} · {{ cycleLabel(data.cycle, data.customCycleDays) }}</strong>
          <div class="sd-badges">
            <StatusBadge :state="data.state" />
            <span class="sd-quiet">{{ data.enabled ? t('合作启用中') : t('已停用') }}</span>
          </div>
        </div>
        <Button v-if="session.has('supplier.write')" size="sm" icon="quote" @click="emit('edit', data)">{{ t('维护资料') }}</Button>
      </section>

      <Tabs v-model="tab" :items="tabs" :label="t('供应商详情')" />

      <SupplierPlatformSettings v-if="tab === 'settings' && platform" :supplier-id="id" />

      <template v-if="tab === 'profile'">
        <section class="sd-section">
          <div v-if="!user.supplierId && session.has('supplier.write')" class="sd-title">
            <h3>{{ t('基本资料') }}</h3>
            <button type="button" class="sd-link" @click="dialog = 'code'">{{ t('修改编码') }}</button>
          </div>
          <DetailList :items="profileItems" />
        </section>

        <section v-if="pendingItems.length" class="sd-section">
          <h3>{{ t('本次提交的变更') }}</h3>
          <DetailList :items="pendingItems" />
        </section>

        <OwnerSection
          v-if="session.has('supplier.owner.assign')"
          :supplier-id="id"
          :version="data.version"
          :owner-user-id="data.ownerUserId"
          :owner-name="data.ownerName"
          @changed="session.refresh()"
        />

        <section v-if="!user.supplierId" class="sd-section">
          <div class="sd-title">
            <h3>{{ t('内部备注') }}</h3>
            <button v-if="session.has('supplier.write')" type="button" class="sd-link" @click="dialog = 'note'">{{ t('编辑') }}</button>
          </div>
          <p class="sd-quiet sd-note">{{ data.internalNote || t('尚未添加内部备注') }}</p>
        </section>

        <section v-if="!user.supplierId" class="sd-section">
          <div class="sd-title">
            <h3>{{ t('关联用户') }}</h3>
            <button v-if="session.has('supplier.users')" type="button" class="sd-link" @click="dialog = 'users'">{{ t('添加用户') }}</button>
          </div>
          <ul class="sd-users">
            <li v-for="linked in data.linkedUsers ?? []" :key="linked.id">
              <span>{{ linked.displayName }} <small class="sd-quiet">{{ linked.username }}</small></span>
              <StatusBadge :state="linked.enabled ? 'APPROVED' : 'WITHDRAWN'" :label="linked.enabled ? t('启用') : t('停用')" />
            </li>
          </ul>
        </section>

        <Notice v-if="data.reviewNote">{{ data.reviewNote }}</Notice>
        <ReviewBox v-if="canReview" :on-review="review" />

        <div v-if="!user.supplierId && session.has('supplier.toggle')" class="sd-section">
          <div>
            <Button :variant="data.enabled ? 'danger' : 'secondary'" size="sm" @click="dialog = 'enabled'">{{ data.enabled ? t('停用供应商') : t('重新启用') }}</Button>
          </div>
        </div>
      </template>

      <SupplierDetailDocuments v-if="tab === 'documents'" :supplier-id="id" :documents="documents.data.value" />
      <SupplierDetailAccounts v-if="tab === 'accounts'" :supplier-id="id" :supplier-name="data.name" :accounts="accounts.data.value" />
    </div>
    <EmptyState v-else-if="supplier.error.value" error :text="supplier.error.value" />
    <div v-else class="sd-loading"><Spinner :size="16" /></div>

    <SupplierFormModal
      v-if="dialog === 'code' && data"
      :title="t('修改供应商编码')"
      :subtitle="t('修改后新资源使用新编码；已创建资源的名称保持原样。')"
      :fields="[{ name: 'code', label: t('供应商编码'), full: true, hint: t('2-30 位字母、数字、下划线或短横线；已使用过的编码不能复用') }]"
      :initial="{ code: data.code }"
      :on-submit="saveCode"
      @close="dialog = null"
    />
    <SupplierFormModal
      v-if="dialog === 'note'"
      :title="t('内部备注')"
      :fields="[{ name: 'note', label: t('备注'), type: 'textarea', full: true, required: false }]"
      :initial="{ note: data?.internalNote || '' }"
      :on-submit="saveNote"
      @close="dialog = null"
    />
    <SupplierFormModal
      v-if="dialog === 'users'"
      :title="t('添加供应商用户')"
      :fields="loginAccountFields(availableUsers.data.value ?? [])"
      :initial="{ mode: 'NEW', displayName: data?.contact || '' }"
      :on-submit="linkUser"
      @close="dialog = null"
    />
    <SupplierFormModal
      v-if="dialog === 'enabled'"
      :title="data?.enabled ? t('停用供应商') : t('启用供应商')"
      :fields="[{ name: 'note', label: t('操作原因'), type: 'textarea', full: true }]"
      :on-submit="toggleEnabled"
      @close="dialog = null"
    />
    <CredentialDialog v-if="credential" :value="credential" @close="credential = null" />
  </Dialog>
</template>

<style scoped>
.sd { display: grid; gap: 18px; }
.sd-loading { display: grid; place-items: center; padding: 40px; color: var(--hs-text-3); }
.sd-cover { display: flex; align-items: center; gap: 14px; padding: 16px 18px; background: var(--hs-surface-subtle); border: 1px solid var(--hs-border); border-radius: 14px; }
.sd-cover-text { display: grid; gap: 6px; flex: 1; min-width: 0; }
.sd-cover-text strong { color: var(--hs-text); font-size: var(--hs-text-md); font-weight: 600; }
.sd-badges { display: flex; flex-wrap: wrap; align-items: center; gap: 8px; }
.sd-quiet { color: var(--hs-text-3); font-size: var(--hs-text-xs); }
.sd-section { display: grid; gap: 10px; }
.sd-section > h3, .sd-title h3 { margin: 0; font-size: var(--hs-text-sm); font-weight: 600; }
.sd-title { display: flex; align-items: center; justify-content: space-between; gap: 12px; }
.sd-link { padding: 0; color: var(--hs-accent); background: none; border: 0; font: inherit; font-size: var(--hs-text-sm); cursor: pointer; }
.sd-link:hover { text-decoration: underline; text-underline-offset: 3px; }
.sd-note { margin: 0; font-size: var(--hs-text-sm); white-space: pre-wrap; }
.sd-users { display: grid; gap: 6px; margin: 0; padding: 0; list-style: none; }
.sd-users li { display: flex; align-items: center; justify-content: space-between; gap: 12px; padding: 8px 12px; border: 1px solid var(--hs-border); border-radius: 10px; color: var(--hs-text); font-size: var(--hs-text-sm); }
</style>
