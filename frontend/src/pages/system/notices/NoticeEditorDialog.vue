<script setup lang="ts">
// Create (publish now or save as draft) or edit a draft notice. Supplier
// audiences may be narrowed to suppliers that quoted on chosen projects; the
// picker below the form previews the recipients.
import { computed, ref } from 'vue';
import FormField from '../../../components/ui/FormField.vue';
import Select from '../../../components/ui/Select.vue';
import TextInput from '../../../components/ui/TextInput.vue';
import FormDialog from '../components/FormDialog.vue';
import NoticeAudiencePicker from './NoticeAudiencePicker.vue';
import { useApiData } from '../../../composables/useApiData';
import { apiPost, apiPut } from '../../../lib/api';
import { t } from '../../../lib/i18n';
import { useSessionStore } from '../../../stores/session';
import { AUDIENCE_LABELS, isSupplierAudience, type NoticeAudience, type NoticeRow, type QuoteProjectRef, type Recipient } from './notices';

const props = defineProps<{ editing: NoticeRow | 'new' }>();
const emit = defineEmits<{ close: [] }>();
const session = useSessionStore();

const creating = props.editing === 'new';
const draft = props.editing === 'new' ? null : props.editing;

const title = ref(draft?.title ?? '');
const body = ref(draft?.body ?? '');
const audience = ref<NoticeAudience>(draft?.audience ?? 'SUPPLIER_ADMINS');
const targetUserId = ref(draft?.targetUserId || '');
const projects = ref<QuoteProjectRef[]>(draft?.quoteProjects ?? []);
const filtered = ref(projects.value.length > 0);

const recipients = useApiData<Array<Recipient & { id: string }>>('/notifications/notice-recipients');

const audienceOptions = computed(() => Object.entries(AUDIENCE_LABELS()).map(([value, label]) => ({ value: value as NoticeAudience, label })));
const recipientOptions = computed(() => (recipients.data.value ?? []).map((user) => ({
  value: user.id,
  label: `${user.displayName}（${user.username}）${user.supplierName ? ` · ${user.supplierName}` : ''}`,
})));
const recipientHint = computed(() => (recipients.loading.value
  ? t('正在加载账号…')
  : recipients.error.value || (recipients.data.value?.length ? undefined : t('暂无可接收通知的账号'))));

function setAudience(value: NoticeAudience) {
  audience.value = value;
  targetUserId.value = '';
}

// Required selects, in field order, as the old form did.
function validate() {
  if (!audience.value) return t('请选择{0}', [t('接收范围')]);
  if (audience.value === 'DIRECT' && !targetUserId.value) return t('请选择{0}', [t('接收账号')]);
  return '';
}

// Primary: publish now (new) / save the draft (edit). Secondary (new only): save as draft.
async function submit(secondary: boolean) {
  const byProject = isSupplierAudience(audience.value) && filtered.value;
  if (byProject && !projects.value.length) throw new Error(t('请至少选择一个报价项目。'));
  const payload = {
    title: title.value,
    body: body.value,
    audience: audience.value,
    targetUserId: audience.value === 'DIRECT' ? targetUserId.value : null,
    quoteProjectIds: byProject ? projects.value.map((project) => project.id) : [],
  };
  if (draft) {
    await apiPut(`/notifications/notices/${draft.id}`, { ...payload, version: draft.version });
    session.notify(t('通知草稿已更新'));
  } else if (secondary) {
    await apiPost('/notifications/notices', payload);
    session.notify(t('通知草稿已保存'));
  } else {
    const result = await apiPost<{ recipientCount: number }>('/notifications/publish', payload);
    session.notify(t('已发送至 {0} 个账号', [result.recipientCount]));
  }
  session.refresh();
}
</script>

<template>
  <FormDialog
    size="lg"
    :title="t(creating ? '新建系统通知' : '编辑通知草稿')"
    :subtitle="t(creating ? '可以立即发布，也可以先保存为草稿。' : '草稿保存后不会发送给任何账号。')"
    :submit-label="t(creating ? '立即发布' : '保存草稿')"
    :secondary-label="creating ? t('保存草稿') : undefined"
    :validate="validate"
    :on-submit="submit"
    @close="emit('close')"
  >
    <template #default="{ busy }">
      <FormField :label="t('通知标题')" required>
        <template #default="{ id }"><TextInput :id="id" v-model="title" required :disabled="busy" /></template>
      </FormField>
      <FormField :label="t('通知正文')" required>
        <template #default="{ id }"><TextInput :id="id" v-model="body" multiline :rows="5" required :disabled="busy" /></template>
      </FormField>
      <FormField :label="t('接收范围')" required>
        <template #default="{ id }">
          <Select :id="id" :model-value="audience" :options="audienceOptions" :label="t('接收范围')" :disabled="busy" @update:model-value="setAudience($event as NoticeAudience)" />
        </template>
      </FormField>
      <FormField v-if="audience === 'DIRECT'" :label="t('接收账号')" :hint="recipientHint" required>
        <template #default="{ id }">
          <Select :id="id" v-model="targetUserId" :options="recipientOptions" :label="t('接收账号')" :placeholder="t('请选择')" icon="users" searchable :disabled="busy" />
        </template>
      </FormField>
      <NoticeAudiencePicker
        :key="`${audience}:${targetUserId}`"
        v-model:filtered="filtered"
        v-model:projects="projects"
        :audience="audience"
        :target-user-id="targetUserId"
      />
    </template>
  </FormDialog>
</template>
