// OpenAPI document for the supplier-facing CCMAX Open API. The embedded specs
// (spec.zh-CN.ts / spec.en-US.ts) describe the original 1.1.0 surface;
// tightenCcmaxOpenApi() narrows them to what is offered today.
import type { Locale } from '../../lib/i18n';
import { ZH_SPEC } from './spec.zh-CN';
import { EN_SPEC } from './spec.en-US';

export interface Schema {
  type?: string | string[];
  format?: string;
  description?: string;
  properties?: Record<string, Schema>;
  required?: string[];
  items?: Schema;
  anyOf?: Schema[];
  oneOf?: Schema[];
  $ref?: string;
  enum?: unknown[];
  const?: unknown;
  default?: unknown;
  example?: unknown;
  writeOnly?: boolean;
  minLength?: number;
  maxLength?: number;
  minimum?: number;
  maximum?: number;
  minItems?: number;
  maxItems?: number;
  pattern?: string;
  additionalProperties?: boolean | Schema;
}

export interface MediaType { schema: Schema }
export interface Parameter { name: string; in: string; required?: boolean; schema: Schema }
export interface Response { description: string; content?: Record<string, MediaType> }
export interface Operation {
  operationId: string;
  summary: string;
  description?: string;
  security?: Array<Record<string, string[]>>;
  parameters?: Parameter[];
  requestBody?: { required?: boolean; content: Record<string, MediaType> };
  responses: Record<string, Response>;
}
export type PathItem = Record<string, Operation>;
export interface Components {
  securitySchemes: Record<string, { type: string; scheme: string; bearerFormat?: string }>;
  schemas: Record<string, Schema>;
}
export interface OpenApiDocument {
  openapi: string;
  info: { title: string; version: string; description: string };
  servers: Array<{ url: string }>;
  paths: Record<string, PathItem>;
  components: Components;
}
export interface EmbeddedSpec { paths: Record<string, PathItem>; components: Components }

const root = '/api/open/v1/ccmax';
const ref = (name: string): Schema => ({ $ref: `#/components/schemas/${name}` });

export function tightenCcmaxOpenApi(original: OpenApiDocument, language: Locale = 'zh-CN'): OpenApiDocument {
  const spec = structuredClone(original);
  const english = language === 'en-US';
  const text = (chinese: string, translated: string) => (english ? translated : chinese);
  spec.info.version = '1.2.0';
  spec.info.description = text('OAuth 上号、原结果查询、账号维护与额度。原生目标直连；旧 CUSTOM 凭据和代理接口仅供已有兼容接入使用。', 'OAuth onboarding, original-result lookup, account maintenance and allowance. Native targets connect directly; credential/proxy endpoints remain compatibility-only for existing CUSTOM integrations.');
  for (const path of ['/proxies', '/proxies/import', '/submissions/credentials', '/proxy-replacements', '/proxy-replacements/{id}', '/proxy-replacements/{id}/reconcile']) delete spec.paths[root + path];
  const schemas = spec.components.schemas;
  const account = schemas.Account;
  account.description = text('先查询项目与接入能力。原生接入仅支持 OAuth 直连，不填写代理。PRO 与每日额度由服务端核验。', 'Query eligible projects and capabilities first. Native targets support direct OAuth only; omit proxies. The server checks plan and allowance.');
  account.required = ['projectId', 'accountName', 'credentialMode', 'requestKey'];
  account.properties = {
    projectId: { type: 'string', minLength: 1, description: text('GET /projects 返回的内部标识；不是 projectCode。', 'Internal ID returned by GET /projects; not projectCode.') },
    accountName: { type: 'string', minLength: 1, maxLength: 128 },
    credentialMode: { type: 'string', enum: ['OAUTH'] },
    requestKey: { type: 'string', format: 'uuid', description: text('调用方生成。同一次请求与内容保持原编号，不能换键重复创建。', 'Caller-generated; retain the same key and input for the same request.') },
    proxyId: { type: 'string', description: text('仅 CUSTOM 接入可选，必须是已保存的本地代理 ID，不接受代理地址。原生直连请省略。', 'Optional stored local proxy ID for CUSTOM only, never a proxy URL. Omit for native direct mode.') },
    remark: { type: 'string', maxLength: 2000 },
  };
  schemas.OAuthSubmit.required = ['sessionId', 'code'];
  schemas.OAuthSubmit.properties = {
    sessionId: { type: 'string', description: text('原授权返回的本地会话 ID。', 'Original local authorization session ID.') },
    code: { type: 'string', writeOnly: true, description: text('本次授权的完整回调 URL 或 code#state；不能丢弃 state。', 'Full callback URL or code#state from this authorization; retain state.') },
  };
  const start = schemas.ReauthorizationStart;
  start.required = ['mode', 'version', 'requestKey'];
  start.properties!.mode = { type: 'string', enum: ['OAUTH'], description: text('原生账号使用原账号 OAuth 重新授权。', 'Native accounts reauthorize the original account with OAuth.') };
  start.properties!.requestKey = { type: 'string', format: 'uuid', description: text('固定的本次操作编号。', 'Stable ID for this operation.') };
  schemas.ReauthorizationSubmit.required = ['code', 'requestKey'];
  schemas.ReauthorizationSubmit.properties = {
    code: { type: 'string', writeOnly: true, description: text('本次重新授权的完整回调或 code#state。', 'This reauthorization callback URL or code#state.') },
    requestKey: { type: 'string', format: 'uuid', description: text('同一次兑换保持不变。', 'Keep unchanged for the same exchange.') },
  };
  const maintenance = schemas.MaintenanceOperation.properties!;
  maintenance.state = { type: 'string', description: text('READY 待回调；SUCCESS／UPDATED／COMPLETED 确认对应操作。UNKNOWN／PENDING 需查询原记录。', 'READY awaits callback; SUCCESS/UPDATED/COMPLETED confirm their operation; UNKNOWN/PENDING require original-record lookup.') };
  maintenance.status = structuredClone(maintenance.state);
  maintenance.operationId = { type: 'string', description: text('原始本地操作 ID。', 'Original local operation ID.') };
  schemas.Submission.properties!.operationId = { type: 'string' };
  schemas.Submission.properties!.sessionId = { type: 'string' };
  schemas.Submission.properties!.completionOperationId = { type: 'string' };
  schemas.OAuthAuthorization.properties!.state = { type: 'string' };
  schemas.OAuthAuthorization.properties!.resourceId = { type: 'string' };
  schemas.Capabilities = {
    type: 'object',
    properties: {
      allowCcmax: { type: 'boolean' }, allowDirectCcmax: { type: 'boolean' }, supportsProxy: { type: 'boolean' }, allowRawCredentialImport: { type: 'boolean' },
      credentialModes: { type: 'array', items: { type: 'string' } }, allowCcmaxReauthorization: { type: 'boolean' }, message: { type: 'string' },
    },
  };
  const resource = schemas.Resource.properties!;
  delete resource.resourceData;
  resource.projectCode = { type: 'string' };
  resource.operationalState = { type: 'string' };
  const daily = schemas.DailySummary.properties!;
  daily.consumptionTotal.description = text('已保存账单的消耗汇总，不触发上游采集。', 'Persisted bill consumption; does not collect upstream logs.');
  daily.pendingConsumption.description = text('已保存的待核对账单消耗。', 'Persisted pending bill consumption.');
  daily.lastQueriedAt.description = text('当前返回 null；此接口不刷新上游数据。', 'Currently null; this endpoint does not refresh upstream data.');
  const template = structuredClone(spec.paths[root + '/resources/{resourceId}/credential-refresh'].get);
  const createOperation = (id: string, summary: string, schema: string, parameters: Parameter[] = []): Operation => ({
    ...structuredClone(template), operationId: id, summary,
    parameters,
    responses: { ...structuredClone(template.responses), 200: { description: text('业务回执，成功须检查 state。', 'Business receipt; inspect state.'), content: { 'application/json': { schema: ref(schema) } } } },
  });
  spec.paths[root + '/capabilities'] = { get: createOperation('ccmaxCapabilities', text('查询上号能力', 'Get onboarding capabilities'), 'Capabilities') };
  const operationParameters = ['resourceId', 'id'].map((name): Parameter => ({ name, in: 'path', required: true, schema: { type: 'string', description: text('本地资源或操作 ID。', 'Local resource or operation ID.') } }));
  spec.paths[root + '/resources/{resourceId}/operations/{id}'] = { get: createOperation('ccmaxGetMaintenanceOperation', text('查询原维护操作', 'Get original maintenance operation'), 'MaintenanceOperation', operationParameters) };
  spec.paths[root + '/resources/{resourceId}/operations/{id}/reconcile'] = { post: createOperation('ccmaxReconcileMaintenanceOperation', text('核对原维护操作结果', 'Reconcile original maintenance result'), 'MaintenanceOperation', operationParameters) };
  for (const methods of Object.values(spec.paths)) for (const operation of Object.values(methods)) {
    operation.responses[410] = { description: text('功能已停用，不重新开放旧写入。', 'Feature retired; old writes are not reopened.'), content: { 'application/json': { schema: ref('Error') } } };
    operation.responses[504] = { description: text('执行超时；保留原编号，查询结果，不能换键重交。', 'Execution timed out; retain original IDs and query results without resubmitting.'), content: { 'application/json': { schema: ref('Error') } } };
  }
  delete schemas.CredentialSubmit;
  for (const name of ['ProxyImport', 'ProxyImportResult', 'Proxy', 'ProxyPage', 'ProxyReplacementItem', 'ProxyReplacementCreate', 'ProxyReplacementResultItem', 'ProxyReplacementJob']) delete schemas[name];
  return spec;
}

/** The published document for `locale`, served from the current origin. */
export function ccmaxOpenApi(locale: Locale): OpenApiDocument {
  const english = locale === 'en-US';
  const embedded = english ? EN_SPEC : ZH_SPEC;
  return tightenCcmaxOpenApi({
    openapi: '3.1.0',
    info: {
      title: 'Hispread CCMAX API',
      version: '1.1.0',
      description: english
        ? '9 groups, 21 Bearer operations. Proxy replacement, forced credential refresh and reauthorization preserve account permissions, supplier/creator/project scope and maintenance policy. Maintenance is independent of new-account intake. Version/capacity checks, lane exclusion and request identity remain enforced; query the original operation before retrying uncertain writes.'
        : '9类、21个Bearer接口。新增更换代理、强制刷新和重新授权；沿用账号权限、供应商／本人及项目范围。维护开关为全局或供应商允许，独立于新增上号停收。代理更换保留同源互斥、版本／容量及稳定请求幂等；UNKNOWN先查原操作，禁止盲目重复写入。',
    },
    servers: [{ url: window.location.origin }],
    paths: embedded.paths,
    components: embedded.components,
  }, locale);
}
