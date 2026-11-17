<script setup lang="ts">
// Move one member to another department (调整分组).
import { computed, ref } from 'vue';
import Dialog from '../../components/ui/Dialog.vue';
import Button from '../../components/ui/Button.vue';
import Notice from '../../components/ui/Notice.vue';
import FormField from '../../components/ui/FormField.vue';
import Select from '../../components/ui/Select.vue';
import { apiPut } from '../../lib/api';
import { t } from '../../lib/i18n';
import { useSessionStore } from '../../stores/session';
import { agentIdentity, type SupplierAgent, type TeamGroup } from './team';

const props = defineProps<{ agent: SupplierAgent; groups: TeamGroup[] }>();
const emit = defineEmits<{ close: []; saved: [] }>();
const session = useSessionStore();

const current = props.groups.find((group) => group.memberIds.includes(props.agent.id));
const targetId = ref('');
const saving = ref(false);
const error = ref('');
const target = computed(() => props.groups.find((group) => group.id === targetId.value));
const options = computed(() => [
  { value: '', label: t('请选择目标部门') },
  ...props.groups.filter((group) => group.id !== current?.id).map((group) => ({ value: group.id, label: group.name })),
]);

async function save() {
  const group = target.value;
  if (saving.value || !group) return;
  saving.value = true;
  error.value = '';
  try {
    await apiPut(`/supplier-team-groups/${encodeURIComponent(group.id)}`, {
      name: group.name,
      adminUserId: group.adminUserId,
      memberIds: [...new Set([...group.memberIds, props.agent.id])],
      version: group.version,
      sourceVersions: current ? { [current.id]: current.version } : {},
    });
    session.notify(t('成员分组已更新'));
    emit('saved');
    emit('close');
  } catch (reason) {
    error.value = (reason as Error).message;
  } finally {
    saving.value = false;
  }
}
</script>

<template>
  <Dialog :title="t('调整分组')" :subtitle="agentIdentity(agent)" size="sm" @close="!saving && emit('close')">
    <div class="move-body">
      <p class="move-current">{{ t('当前部门：{0}', [current?.name || '—']) }}</p>
      <FormField :label="t('目标部门')">
        <template #default="{ id }">
          <Select :id="id" v-model="targetId" :options="options" :label="t('目标部门')" :placeholder="t('请选择目标部门')" :disabled="saving" />
        </template>
      </FormField>
      <Notice v-if="error" tone="danger">{{ error }}</Notice>
    </div>
    <template #footer>
      <Button :disabled="saving" @click="emit('close')">{{ t('取消') }}</Button>
      <Button variant="primary" :loading="saving" :disabled="saving || !target" @click="save">{{ saving ? t('保存中…') : t('保存分组') }}</Button>
    </template>
  </Dialog>
</template>

<style scoped>
.move-body { display: grid; gap: 14px; }
.move-current { margin: 0; color: var(--hs-text-2); font-size: var(--hs-text-sm); }
</style>
