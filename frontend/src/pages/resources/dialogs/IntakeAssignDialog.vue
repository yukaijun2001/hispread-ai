<script setup lang="ts">
// 分配项目: assign a received NewAPI resource to a project that has a valid quote.
// One request key per dialog; the quote token pins the quote shown here.
// Assignment is final.
import { computed, ref } from 'vue';
import Button from '../../../components/ui/Button.vue';
import Dialog from '../../../components/ui/Dialog.vue';
import FormField from '../../../components/ui/FormField.vue';
import Notice from '../../../components/ui/Notice.vue';
import Select from '../../../components/ui/Select.vue';
import { useApiData } from '../../../composables/useApiData';
import { apiPost } from '../../../lib/api';
import { t } from '../../../lib/i18n';
import { formatQuotePrice } from '../../../lib/money';
import type { EligibleProject } from '../intakeDetail';
import type { Resource } from '../resources';

const props = defineProps<{ resource: Resource }>();
const emit = defineEmits<{ close: []; assigned: [] }>();

const projects = useApiData<EligibleProject[]>(() => `/resource-intakes/${encodeURIComponent(props.resource.id)}/eligible-projects`);
const projectId = ref('');
const error = ref('');
const saving = ref(false);
const requestKey = crypto.randomUUID();
let submitting = false;

const selected = computed(() => projects.data.value?.find((project) => project.id === projectId.value));
const options = computed(() => (projects.data.value ?? []).map((project) => ({ value: project.id, label: project.name })));
const models = computed(() => props.resource.modelSummary ?? []);
const problem = computed(() => error.value || projects.error.value);

function choose(value: string) { projectId.value = value; error.value = ''; }
function close() { if (!saving.value) emit('close'); }

async function submit() {
  const project = selected.value;
  if (!project || submitting || projects.error.value) return;
  submitting = true;
  saving.value = true;
  error.value = '';
  try {
    await apiPost(`/resource-intakes/${encodeURIComponent(props.resource.id)}/assign-project`, {
      projectId: project.id, version: props.resource.version, requestKey, quoteToken: project.quoteToken,
    });
    emit('assigned');
  } catch (failure) {
    error.value = failure instanceof Error && failure.message ? failure.message : t('分配失败，请稍后重试');
  } finally {
    submitting = false;
    saving.value = false;
  }
}
</script>

<template>
  <Dialog :title="t('分配项目')" @close="close">
    <form id="intake-assign-form" class="ia" @submit.prevent="submit">
      <div class="ia-resource">
        <span>{{ t('当前资源') }}</span>
        <strong>{{ resource.name }}</strong>
        <p>NewAPI · {{ t('{0} 个密钥', [resource.memberCount ?? 0]) }}</p>
        <p v-if="models.length" class="ia-models" :title="models.join(t('、'))">
          {{ models.slice(0, 3).join(t('、')) }}{{ models.length > 3 ? t(' 等 {0} 个模型', [models.length]) : '' }}
        </p>
      </div>

      <Notice v-if="problem" tone="danger">{{ problem }}</Notice>

      <p v-if="projects.loading.value" class="ia-message" role="status">{{ t('正在查询有效报价…') }}</p>
      <div v-else-if="!projects.error.value && !projects.data.value?.length" class="ia-message">
        <strong>{{ t('暂无可分配项目') }}</strong>
        <p>{{ t('请联系平台核对项目适用类型与有效报价。') }}</p>
      </div>
      <template v-else-if="!projects.error.value">
        <FormField :label="t('报价项目')" required>
          <template #default="{ id }">
            <Select
              :id="id"
              :model-value="projectId"
              :options="options"
              :label="t('报价项目')"
              :placeholder="t('请选择报价项目')"
              searchable
              :search-placeholder="t('搜索项目名称')"
              :disabled="saving"
              @update:model-value="(value) => choose(String(value))"
            />
          </template>
        </FormField>
        <section class="ia-quote" :aria-label="t('报价依据')" aria-live="polite">
          <h3>{{ t('报价依据') }}</h3>
          <dl v-if="selected">
            <div><dt>{{ selected.quoteBasis.unitPrice == null ? t('折扣') : t('单价') }}</dt><dd>{{ formatQuotePrice(selected.quoteBasis) }}</dd></div>
            <div><dt>{{ t('币种') }}</dt><dd>{{ String(selected.quoteBasis.currency || '—') }}</dd></div>
            <div><dt>{{ t('有效期') }}</dt><dd>{{ String(selected.quoteBasis.effectiveFrom) }}{{ t(' 至') }} {{ String(selected.quoteBasis.effectiveTo) }}</dd></div>
          </dl>
          <p v-else>{{ t('选择项目后查看报价') }}</p>
        </section>
      </template>
    </form>

    <template #footer>
      <span class="ia-hint">{{ t('仅可分配一次，保存后不可更改') }}</span>
      <Button :disabled="saving" @click="close">{{ t('取消') }}</Button>
      <Button
        type="submit"
        form="intake-assign-form"
        variant="primary"
        :loading="saving"
        :disabled="!selected || saving || projects.loading.value || !!projects.error.value"
      >{{ saving ? t('正在保存…') : t('确认分配') }}</Button>
    </template>
  </Dialog>
</template>

<style scoped>
.ia { display: grid; gap: 16px; }
.ia-resource { display: grid; gap: 4px; padding: 14px 16px; background: var(--hs-surface-subtle); border: 1px solid var(--hs-border); border-radius: 12px; }
.ia-resource > span { color: var(--hs-text-3); font-size: var(--hs-text-xs); }
.ia-resource strong { font-size: var(--hs-text-md, 15px); font-weight: 600; overflow-wrap: anywhere; }
.ia-resource p { margin: 0; color: var(--hs-text-3); font-size: var(--hs-text-xs); }
.ia-models { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.ia-message { margin: 0; color: var(--hs-text-3); font-size: var(--hs-text-sm); }
.ia-message p { margin: 4px 0 0; }
.ia-message strong { color: var(--hs-text); }
.ia-quote { display: grid; gap: 8px; padding: 14px 16px; border: 1px solid var(--hs-border); border-radius: 12px; }
.ia-quote h3 { margin: 0; font-size: var(--hs-text-sm); font-weight: 600; }
.ia-quote p { margin: 0; color: var(--hs-text-3); font-size: var(--hs-text-sm); }
.ia-quote dl { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 12px; margin: 0; }
.ia-quote dt { color: var(--hs-text-3); font-size: var(--hs-text-xs); }
.ia-quote dd { margin: 2px 0 0; font-variant-numeric: tabular-nums; overflow-wrap: anywhere; }
.ia-hint { flex: 1; color: var(--hs-text-3); font-size: var(--hs-text-xs); }
</style>
