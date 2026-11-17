<script setup lang="ts">
// Static documentation for the CCMAX Open API (Bearer API keys). The page makes
// no backend calls; the OpenAPI download is generated in the browser.
import { computed, ref } from 'vue';
import PageHeader from '../../components/ui/PageHeader.vue';
import Button from '../../components/ui/Button.vue';
import Tabs from '../../components/ui/Tabs.vue';
import Notice from '../../components/ui/Notice.vue';
import ProfileDialog from '../../shell/account/ProfileDialog.vue';
import CodeBlock from './CodeBlock.vue';
import FieldTable from './FieldTable.vue';
import { getLocale, t } from '../../lib/i18n';
import { useSessionStore } from '../../stores/session';
import {
  API_ROOT, curlExample, endpointLabel, endpoints, GROUP_DESCRIPTIONS, GROUPS, groupOf, origin, permissionText,
  relativePath, requestFields, responseExample, responseFields, spec, type Endpoint,
} from './docs';

defineProps<{ route: string }>();
const session = useSessionStore();
const user = computed(() => session.user!);
// Supplier members do not receive payableTotal from the daily summary.
const isAgent = computed(() => user.value.role === 'SUPPLIER_AGENT');

const tab = ref<'start' | 'endpoints' | 'rules'>('start');
const tabItems = [
  { id: 'start' as const, label: t('快速开始') },
  { id: 'endpoints' as const, label: t('接口说明') },
  { id: 'rules' as const, label: t('权限与重试') },
];
const selectedId = ref(endpoints[0].id);
const selected = computed(() => endpoints.find((endpoint) => endpoint.id === selectedId.value) ?? endpoints[0]);
const selectedGroup = computed(() => groupOf(selected.value));
const index = GROUPS
  .map((group) => ({ ...group, endpoints: endpoints.filter((endpoint) => groupOf(endpoint) === group.id) }))
  .filter((group) => group.endpoints.length);

const responseRows = computed(() => responseFields(selected.value).filter((field) => !isAgent.value || field.name !== 'payableTotal'));
const responseJson = computed(() => JSON.stringify(responseExample(selected.value, !isAgent.value), null, 2));

const HEADERS = 'Authorization: Bearer <API_KEY>\nContent-Type: application/json';
const ERROR_SHAPE = '{\n  "message": "...",\n  "status": 409,\n  "traceId": "..."\n}';
const ERRORS: Array<[string, string]> = [
  ['400', '输入不合法，或使用了不支持的查询参数。'],
  ['401', '密钥缺失、无效、过期或账号状态不允许。'],
  ['403', '账号权限不足，或接口方法尚未开放。'],
  ['404', '对象不存在或不在当前账号可见范围。'],
  ['409', '幂等内容、版本或业务状态冲突。'],
  ['410', '旧功能已停用，请使用当前 OAuth 和原操作查询流程。'],
  ['502 / 503', '上游服务或本次查询暂时不可用。'],
];

function select(endpoint: Endpoint) {
  selectedId.value = endpoint.id;
  window.scrollTo({ top: 0 });
}

function downloadSpec() {
  const url = URL.createObjectURL(new Blob([JSON.stringify(spec, null, 2)], { type: 'application/json' }));
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = getLocale() === 'en-US' ? 'ccmax-openapi.en.json' : 'ccmax-openapi.json';
  anchor.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

const keysOpen = ref(false);
function profileSaved() {
  session.refresh();
  keysOpen.value = false;
  session.notify(t('个人信息已更新'));
}
</script>

<template>
  <div class="api-docs">
    <PageHeader :title="t('API 文档')">
      <template #description>
        <span class="caption"><strong>CCMAX</strong><span>v{{ spec.info.version }}</span><span>{{ t('{0} 个接口', [endpoints.length]) }}</span></span>
      </template>
      <template #actions>
        <Button icon="download" @click="downloadSpec">{{ t('下载 OpenAPI') }}</Button>
        <Button variant="primary" icon="lock" @click="keysOpen = true">{{ t('管理 API 密钥') }}</Button>
      </template>
    </PageHeader>

    <Tabs v-model="tab" :items="tabItems" :label="t('API 文档')" class="doc-tabs" />

    <div v-if="tab === 'start'" class="flow">
      <Notice v-if="!user.supplierId">{{ t('平台账号可查看对接说明；这些 CCMAX 业务接口由供应商主账号或团队成员的 API 密钥调用。') }}</Notice>
      <section class="doc-card">
        <h2>{{ t('接入地址与认证') }}</h2>
        <CodeBlock :label="t('接口前缀')" :code="`${origin}${API_ROOT}`" />
        <CodeBlock :label="t('请求头')" :code="HEADERS" />
        <p class="quiet">{{ t('在「个人资料 → API 密钥」创建密钥，或点击右上方「管理 API 密钥」。密钥沿用所属账号的权限和数据范围。') }}</p>
      </section>
      <section class="doc-card">
        <h2>{{ t('接入步骤') }}</h2>
        <ol class="steps">
          <li><strong>{{ t('查询项目与报价标识') }}</strong><p>{{ t('先查询 capabilities，再查询有权上号的项目，保存 projectId；projectCode 用于展示和资源筛选。') }}</p></li>
          <li><strong>{{ t('确认接入方式') }}</strong><p>{{ t('原生 CCMAX 使用 OAuth 直连，无需填写代理。已有 CUSTOM 接入仅在 supportsProxy 为 true 时使用已保存的本地代理 ID。') }}</p></li>
          <li><strong>{{ t('提交单账号上号') }}</strong><p>{{ t('用固定 requestKey 发起 OAuth，回填本次完整回调或 code#state。保存原 sessionId 查询结果；state=SUCCESS 才确认上号成功。') }}</p></li>
          <li><strong>{{ t('查询资源和当日汇总') }}</strong><p>{{ t('按资源 id 查询状态和额度；用 quoteId 查询北京时间当天的日账汇总。') }}</p></li>
        </ol>
        <div><Button trailing-icon="chevron" @click="tab = 'endpoints'">{{ t('查看接口说明') }}</Button></div>
      </section>
      <Notice>{{ t('账务汇总仅读取已保存的账单，不触发上游采集。旧 RT／AT／SK 提交和代理批量替换仅用于已有 CUSTOM 接入兼容，原生接入不开放。') }}</Notice>
    </div>

    <div v-else-if="tab === 'endpoints'" class="layout">
      <nav class="index" :aria-label="t('接口目录')">
        <section v-for="group in index" :key="group.id">
          <h2>{{ t(group.label) }}</h2>
          <button
            v-for="endpoint in group.endpoints"
            :key="endpoint.id"
            type="button"
            :class="{ current: endpoint.id === selectedId }"
            :aria-current="endpoint.id === selectedId ? 'true' : undefined"
            @click="select(endpoint)"
          >
            <span class="method" :class="endpoint.method.toLowerCase()">{{ endpoint.method }}</span>
            <span>{{ t(endpointLabel(endpoint)) }}</span>
          </button>
        </section>
      </nav>

      <article class="doc-card endpoint">
        <h2>{{ t(endpointLabel(selected)) }}</h2>
        <div class="path">
          <span class="method" :class="selected.method.toLowerCase()">{{ selected.method }}</span>
          <code>{{ API_ROOT }}{{ relativePath(selected) }}</code>
        </div>
        <p>{{ t(GROUP_DESCRIPTIONS[selectedGroup]) }}</p>
        <p class="quiet">{{ t('所需权限：{0}', [t(permissionText(selected))]) }}</p>
        <Notice v-if="selectedGroup === 'daily-summary'">{{ t('日期固定为北京时间今天，仅读取已有账单；成员只看本人和授权项目，不返回 payableTotal。') }}</Notice>
        <Notice v-if="selectedGroup === 'intake'" tone="info">{{ t('PRO满额只关闭PRO接收；非PRO满额停止新增。优先级、档位、区间、canPro及额度来源由服务端计算，上号请求携带这些参数会被拒绝。') }}</Notice>

        <h3>{{ t('请求参数') }}</h3>
        <FieldTable :fields="requestFields(selected)" request />

        <h3>{{ t('调用示例') }}</h3>
        <p class="quiet">{{ t('请替换示例中的占位值。示例密钥、凭据和账号均为占位内容，页面不会发起上号请求。') }}</p>
        <CodeBlock label="cURL" :code="curlExample(selected)" />

        <h3>{{ t('返回字段') }}</h3>
        <FieldTable :fields="responseRows" />

        <h3>{{ t('响应示例') }}</h3>
        <CodeBlock label="JSON" :code="responseJson" />
        <Notice v-if="selectedGroup === 'submissions'" tone="warning">{{ t('HTTP 200 表示已取得业务回执。UNKNOWN 或 PENDING 时继续查询原请求，不能换键自动重复上号。') }}</Notice>
      </article>
    </div>

    <div v-else class="flow">
      <section class="doc-card">
        <h2>{{ t('账号与密钥权限') }}</h2>
        <ul class="rules">
          <li>{{ t('API 密钥只能使用所属账号已有的权限；主账号、团队成员的供应商归属和本人范围由服务端校验。') }}</li>
          <li>{{ t('密钥撤销、到期或账号停用后无法调用；角色权限和项目授权变更会在后续请求生效。') }}</li>
          <li>{{ t('旧密钥不会自动获得新增代理和账单权限，需要在个人资料中重置或重新签发。') }}</li>
          <li>{{ t('密钥放在 Authorization 请求头中，不放入 URL 或共享日志。登录 Cookie 不能替代 API 密钥。') }}</li>
        </ul>
      </section>
      <section class="doc-card">
        <h2>{{ t('错误与重试') }}</h2>
        <CodeBlock :label="t('错误结构')" :code="ERROR_SHAPE" />
        <dl class="errors">
          <div v-for="[status, meaning] in ERRORS" :key="status">
            <dt><code>{{ status }}</code></dt>
            <dd>{{ t(meaning) }}</dd>
          </div>
        </dl>
        <Notice tone="warning">{{ t('读取可以重试。上号写入超时后先查询原 requestKey 或 sessionId；404 也可能表示原请求尚未落库，不能据此换键重交。') }}</Notice>
      </section>
    </div>

    <ProfileDialog v-if="keysOpen" initial-tab="tokens" @close="keysOpen = false" @saved="profileSaved" />
  </div>
</template>

<style scoped>
.caption { display: inline-flex; flex-wrap: wrap; align-items: center; gap: 4px 10px; }
.caption strong { color: var(--hs-text-2); font-weight: 600; }
.caption span + span::before { content: "·"; margin-right: 10px; color: var(--hs-text-4); }
.doc-tabs { margin-bottom: 20px; }
.flow { display: grid; gap: 16px; max-width: 880px; }
.doc-card { display: grid; gap: 14px; min-width: 0; padding: 20px; background: var(--hs-surface); border: 1px solid var(--hs-border); border-radius: var(--hs-radius-card); box-shadow: var(--hs-shadow-card); }
.doc-card h2 { margin: 0; color: var(--hs-text); font-size: 15px; font-weight: 600; line-height: 1.4; }
.doc-card h3 { margin: 10px 0 0; color: var(--hs-text); font-size: var(--hs-text-sm); font-weight: 600; }
.doc-card p { margin: 0; color: var(--hs-text-2); font-size: var(--hs-text-sm); line-height: 1.7; }
.doc-card p.quiet { color: var(--hs-text-3); font-size: var(--hs-text-xs); }
.steps { display: grid; gap: 12px; margin: 0; padding-left: 20px; color: var(--hs-text-3); font-size: var(--hs-text-sm); }
.steps li { padding-left: 4px; }
.steps strong { color: var(--hs-text); font-weight: 500; }
.steps p { margin-top: 2px; }
.rules { display: grid; gap: 8px; margin: 0; padding-left: 20px; color: var(--hs-text-2); font-size: var(--hs-text-sm); line-height: 1.7; }
.errors { display: grid; margin: 0; border: 1px solid var(--hs-border); border-radius: var(--hs-radius-control); }
.errors div { display: grid; grid-template-columns: 96px minmax(0, 1fr); gap: 12px; padding: 10px 14px; }
.errors div + div { border-top: 1px solid var(--hs-divider); }
.errors dt code { color: var(--hs-text); background: none; padding: 0; font-family: var(--hs-font-mono); font-size: 12.5px; font-variant-numeric: tabular-nums; }
.errors dd { margin: 0; color: var(--hs-text-2); font-size: var(--hs-text-sm); line-height: 1.6; }

.layout { display: grid; grid-template-columns: 248px minmax(0, 1fr); align-items: start; gap: 20px; }
.index { position: sticky; top: 16px; display: grid; gap: 16px; max-height: calc(100vh - 32px); overflow-y: auto; }
.index section { display: grid; gap: 2px; }
.index h2 { margin: 0 0 4px; padding: 0 10px; color: var(--hs-text-4); font-size: 11px; font-weight: 500; letter-spacing: .3px; }
.index button { display: flex; align-items: center; gap: 8px; width: 100%; min-height: 0; padding: 7px 10px; color: var(--hs-text-2); background: none; border: 0; border-radius: var(--hs-radius-small); font: inherit; font-size: var(--hs-text-sm); text-align: left; cursor: pointer; }
.index button:hover { color: var(--hs-text); background: var(--hs-surface-subtle); }
.index button.current { color: var(--hs-text); background: var(--hs-surface-subtle); font-weight: 500; }
.index button:focus-visible { outline: none; box-shadow: var(--hs-accent-ring); }
.method { flex: none; min-width: 38px; padding: 1px 0; border-radius: 6px; font-family: var(--hs-font-mono); font-size: 10.5px; font-weight: 600; text-align: center; }
.method.get { color: var(--hs-success); background: var(--hs-success-soft); }
.method.post { color: #2a4fb3; background: var(--hs-accent-soft); }
.method.put { color: var(--hs-violet); background: var(--hs-violet-soft); }
.method.delete { color: var(--hs-danger); background: var(--hs-danger-soft); }
.path { display: flex; align-items: center; gap: 10px; min-width: 0; padding: 10px 12px; background: var(--hs-surface-subtle); border: 1px solid var(--hs-border); border-radius: var(--hs-radius-control); }
.path code { min-width: 0; overflow-wrap: anywhere; color: var(--hs-text); background: none; padding: 0; font-family: var(--hs-font-mono); font-size: 13px; }

@media (max-width: 960px) {
  .layout { grid-template-columns: minmax(0, 1fr); }
  .index { position: static; max-height: none; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); }
}
</style>
