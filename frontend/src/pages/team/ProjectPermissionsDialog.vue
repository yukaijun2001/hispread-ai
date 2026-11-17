<script setup lang="ts">
// Which quoted projects a member may operate. Projects the server marks
// `assignable: false` are historical grants: they can be removed but not re-added.
// A department admin may only hand out projects they hold, and cannot edit their own.
import { computed, ref, watch } from 'vue';
import Dialog from '../../components/ui/Dialog.vue';
import Button from '../../components/ui/Button.vue';
import Notice from '../../components/ui/Notice.vue';
import SearchInput from '../../components/ui/SearchInput.vue';
import Select from '../../components/ui/Select.vue';
import Spinner from '../../components/ui/Spinner.vue';
import { useApiData } from '../../composables/useApiData';
import { apiPut } from '../../lib/api';
import { t } from '../../lib/i18n';
import { useSessionStore } from '../../stores/session';
import { categoryKey, categoryOptions, type AgentProjects, type SupplierAgent } from './team';

const props = defineProps<{ agent: SupplierAgent }>();
const emit = defineEmits<{ close: [] }>();

const session = useSessionStore();
const user = computed(() => session.user!);
const agentRole = computed(() => user.value.role === 'SUPPLIER_AGENT');
const self = computed(() => agentRole.value && user.value.id === props.agent.id);
const path = `/supplier-agents/${encodeURIComponent(props.agent.id)}/projects`;
const data = useApiData<AgentProjects>(path);

const selected = ref<string[]>([]);
const search = ref('');
const category = ref('');
const saving = ref(false);
const error = ref('');
watch(() => data.data.value, (value) => { if (value) selected.value = value.assignedIds; }, { immediate: true });

const available = computed(() => data.data.value?.availableProjects ?? []);
const term = computed(() => search.value.trim().toLocaleLowerCase());
const visible = computed(() => available.value.filter((project) => project.name.toLocaleLowerCase().includes(term.value)
  && (!category.value || categoryKey(project.category) === category.value)));
const blocked = computed(() => self.value || saving.value || data.loading.value || !!data.error.value || !data.data.value);

function toggle(id: string, checked: boolean) {
  selected.value = checked ? [...selected.value, id] : selected.value.filter((value) => value !== id);
}
function selectAll() {
  selected.value = available.value.filter((project) => project.assignable !== false || selected.value.includes(project.id)).map((project) => project.id);
}

async function save() {
  if (blocked.value) return;
  saving.value = true;
  error.value = '';
  try {
    await apiPut(path, { projectIds: selected.value });
    session.refresh();
    session.notify(t('成员项目权限已保存'));
    emit('close');
  } catch (reason) {
    error.value = (reason as Error).message;
  } finally {
    saving.value = false;
  }
}
</script>

<template>
  <Dialog :title="t('项目权限')" :subtitle="agent.displayName ? `${agent.displayName} · ${agent.username}` : agent.username" size="lg" @close="!saving && emit('close')">
    <div class="perm-body">
      <Notice v-if="agentRole">{{ self ? t('自己的项目权限由供应商分配。') : t('仅可分配自己已有且可授权的项目；其他已有项目由供应商管理。') }}</Notice>
      <div v-if="data.loading.value" class="perm-loading"><Spinner :size="16" /></div>
      <Notice v-else-if="data.error.value" tone="danger">{{ t('项目权限加载失败：') }}{{ data.error.value }}</Notice>
      <template v-else-if="available.length">
        <div class="perm-toolbar">
          <div class="perm-summary">
            <strong>{{ t('已选') }} {{ selected.length }} {{ t('项') }}</strong>
            <span>{{ term || category ? t('显示 {0} / {1} 个项目', [visible.length, available.length]) : t('共 {0} 个项目', [available.length]) }}</span>
          </div>
          <div class="perm-actions">
            <Button size="sm" :disabled="saving || self" @click="selectAll">{{ t('全选全部可用项目') }}</Button>
            <Button size="sm" :disabled="saving || self" @click="selected = []">{{ t('清空') }}</Button>
          </div>
        </div>
        <div class="perm-filters">
          <SearchInput v-model="search" class="perm-search" :placeholder="t('搜索项目名称')" :label="t('搜索项目名称')" />
          <div class="perm-category"><Select v-model="category" :options="categoryOptions(available)" :label="t('权限项目大类筛选')" :placeholder="t('全部大类')" /></div>
        </div>
        <div class="perm-list" role="group" :aria-label="t('项目授权列表')">
          <template v-if="visible.length">
            <label
              v-for="project in visible"
              :key="project.id"
              class="perm-option"
              :class="{ 'is-on': selected.includes(project.id), 'is-off': project.assignable === false && !selected.includes(project.id) }"
            >
              <input
                type="checkbox"
                :aria-label="project.name"
                :checked="selected.includes(project.id)"
                :disabled="saving || self || (project.assignable === false && !selected.includes(project.id))"
                @change="toggle(project.id, ($event.target as HTMLInputElement).checked)"
              >
              <span class="perm-project">
                <span>{{ project.name }}</span>
                <small v-if="project.assignable === false">{{ t('当前不可新增授权；取消后不能重新勾选。') }}</small>
              </span>
              <span v-if="project.assignable === false" class="perm-history">{{ t('历史授权') }}</span>
            </label>
          </template>
          <p v-else class="perm-empty">{{ t('没有匹配的项目，请调整项目名称或大类。') }}</p>
        </div>
      </template>
      <Notice v-else>{{ agentRole ? t('暂无可分配项目，请联系供应商分配项目权限。') : t('暂无可分配项目，请先提交项目报价并等待审核通过。') }}</Notice>
      <Notice v-if="error" tone="danger">{{ error }}</Notice>
    </div>
    <template #footer>
      <span class="perm-help">{{ agentRole ? t('仅修改当前可管理的项目权限。') : t('未选择项目时，成员没有项目操作权限。') }}</span>
      <Button :disabled="saving" @click="emit('close')">{{ t('取消') }}</Button>
      <!-- The old build only rendered this button while the search box had text; it is now always shown (still disabled for one's own permissions). -->
      <Button variant="primary" :loading="saving" :disabled="blocked" @click="save">{{ saving ? t('保存中…') : t('保存') }}</Button>
    </template>
  </Dialog>
</template>

<style scoped>
.perm-body { display: grid; gap: 14px; }
.perm-loading { display: grid; place-items: center; padding: 28px; color: var(--hs-text-3); }
.perm-toolbar { display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: 10px; }
.perm-summary { display: grid; gap: 2px; }
.perm-summary strong { color: var(--hs-text); font-size: var(--hs-text-sm); font-weight: 600; }
.perm-summary span { color: var(--hs-text-3); font-size: var(--hs-text-xs); }
.perm-actions { display: flex; gap: 6px; }
.perm-filters { display: flex; flex-wrap: wrap; gap: 8px; }
.perm-search { flex: 1 1 220px; }
.perm-category { flex: 0 1 200px; min-width: 160px; }
.perm-list { display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: 8px; max-height: 46vh; overflow: auto; padding: 2px; }
.perm-option { display: flex; align-items: flex-start; gap: 10px; padding: 10px 12px; background: var(--hs-surface); border: 1px solid var(--hs-border); border-radius: var(--hs-radius-control); font-size: var(--hs-text-sm); cursor: pointer; }
.perm-option.is-on { background: var(--hs-accent-soft); border-color: #cddbfc; }
.perm-option.is-off { color: var(--hs-text-4); cursor: not-allowed; }
.perm-option input { margin-top: 3px; accent-color: var(--hs-accent); }
.perm-project { display: grid; flex: 1; gap: 2px; min-width: 0; color: var(--hs-text); overflow-wrap: anywhere; }
.perm-project small { color: var(--hs-text-3); font-size: 11px; }
.perm-history { flex: none; padding: 1px 6px; color: var(--hs-warning); background: var(--hs-warning-soft); border-radius: 6px; font-size: 11px; }
.perm-empty { grid-column: 1 / -1; margin: 0; padding: 20px; color: var(--hs-text-3); font-size: var(--hs-text-sm); text-align: center; }
.perm-help { flex: 1; color: var(--hs-text-3); font-size: var(--hs-text-xs); }
</style>
