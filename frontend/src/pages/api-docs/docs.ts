// What the API docs page shows for each operation: grouping, labels, required
// permissions, field tables and placeholder examples. Labels and descriptions
// are Chinese dictionary keys, translated where they are rendered.
import { getLocale } from '../../lib/i18n';
import { ccmaxOpenApi, type Operation, type Schema } from './openapi';

export const spec = ccmaxOpenApi(getLocale());
export const origin = spec.servers[0].url;
export const API_ROOT = '/api/open/v1/ccmax';

export interface Endpoint { id: string; method: string; path: string; operation: Operation }
export interface Field { name: string; type: string; required: boolean; description: string }

export const endpoints: Endpoint[] = Object.entries(spec.paths).flatMap(([path, methods]) =>
  Object.entries(methods).map(([method, operation]) => ({ id: `${method}:${path}`, method: method.toUpperCase(), path, operation })));

const resolve = (schema: Schema): Schema => (schema.$ref ? spec.components.schemas[schema.$ref.split('/').at(-1)!] : schema);

function typeLabel(schema: Schema): string {
  const resolved = resolve(schema);
  if (resolved.anyOf) return resolved.anyOf.map(typeLabel).join(' | ');
  if (Array.isArray(resolved.type)) return resolved.type.join(' | ');
  if (resolved.type === 'array') return `${typeLabel(resolved.items || {})}[]`;
  if (resolved.format === 'uuid') return 'UUID';
  return resolved.type || 'object';
}

/** Flatten an object schema into dotted field rows, following `$ref`s up to two levels deep. */
export function schemaFields(schema: Schema, prefix = '', depth = 0): Field[] {
  const resolved = resolve(schema);
  if (resolved.type === 'array') return schemaFields(resolved.items || {}, '[].', depth);
  return Object.entries(resolved.properties || {}).flatMap(([name, property]) => {
    const field: Field = { name: prefix + name, type: typeLabel(property), required: resolved.required?.includes(name) ?? false, description: property.description || '' };
    if (depth < 2 && property.type === 'array' && property.items?.$ref) return [field, ...schemaFields(property.items, `${prefix}${name}[].`, depth + 1)];
    if (depth < 2 && property.$ref) return [field, ...schemaFields(property, `${prefix}${name}.`, depth + 1)];
    return [field];
  });
}

export function requestFields(endpoint: Endpoint): Field[] {
  return [
    ...(endpoint.operation.parameters || []).map((parameter) => ({
      name: parameter.name, type: `${parameter.in} · ${typeLabel(parameter.schema)}`, required: !!parameter.required, description: parameter.schema.description || '',
    })),
    ...(endpoint.operation.requestBody ? schemaFields(endpoint.operation.requestBody.content['application/json'].schema) : []),
  ];
}

export function responseFields(endpoint: Endpoint): Field[] {
  return schemaFields(endpoint.operation.responses[200].content!['application/json'].schema);
}

export const GROUPS = [
  { id: 'capabilities', label: '上号能力' },
  { id: 'projects', label: '项目编码' },
  { id: 'proxies', label: '代理导入与查询' },
  { id: 'submissions', label: 'CCMAX 上号' },
  { id: 'resources', label: '资源查询' },
  { id: 'proxy-replacements', label: '更换代理' },
  { id: 'credential-refresh', label: '原账号凭据刷新' },
  { id: 'reauthorizations', label: '重新授权' },
  { id: 'operations', label: '原维护操作查询' },
  { id: 'daily-summary', label: '当日日账汇总' },
  { id: 'intake', label: '今日上号额度' },
];

const LABELS: Record<string, string> = {
  'GET /capabilities': '查询上号能力',
  'GET /projects': '查询可上号项目',
  'GET /proxies': '查询代理列表',
  'POST /proxies/import': '导入代理',
  'POST /submissions/credentials': '凭据上号',
  'POST /submissions/oauth/authorize': '发起 OAuth 授权',
  'POST /submissions/oauth/complete': '提交授权码',
  'GET /submissions/{id}': '查询上号结果',
  'POST /submissions/{id}/cancel': '取消待提交授权',
  'GET /resources': '查询资源列表',
  'GET /resources/{id}': '查询资源详情',
  'GET /daily-summary': '查询当日日账汇总',
  'GET /intake': '查询今日上号额度',
  'POST /proxy-replacements': '更换代理',
  'GET /proxy-replacements/{id}': '查询代理更换任务',
  'POST /proxy-replacements/{id}/reconcile': '重新核对代理绑定',
  'GET /resources/{resourceId}/credential-refresh': '查询原凭据刷新记录',
  'POST /resources/{resourceId}/credential-refresh': '刷新原账号凭据',
  'GET /resources/{resourceId}/reauthorizations/current': '查询当前重新授权操作',
  'POST /resources/{resourceId}/reauthorizations': '发起重新授权',
  'PUT /resources/{resourceId}/reauthorizations/{id}': '提交重新授权凭据',
  'GET /resources/{resourceId}/reauthorizations/{id}': '查询重新授权进度',
  'GET /resources/{resourceId}/operations/{id}': '查询原维护操作',
  'POST /resources/{resourceId}/operations/{id}/reconcile': '核对原维护操作结果',
};

export const GROUP_DESCRIPTIONS: Record<string, string> = {
  capabilities: '返回当前接入的上号方式和代理能力。原生目标只支持 OAuth 直连；已有 CUSTOM 接入的旧凭据方式仅用于兼容。',
  projects: '返回当前账号有权上号的 CCMAX 项目编码、名称和对应有效报价标识。团队成员的项目授权实时校验。',
  proxies: '代理按当前账号范围查询和导入。proxyId 也可直接填写代理地址，自动保存或复用本人代理，无需单独导入或预检。',
  submissions: '使用 projectId 和固定 requestKey 发起 OAuth，回填本次完整回调或 code#state。保留原 sessionId 查询结果，不换键重复兑换。原生接入无需填写代理。',
  resources: '查询当前账号可见的资源及最近同步的状态和额度。仅返回本地已有数据，不触发上游同步，不返回原始凭据、代理认证或管理密钥。',
  'proxy-replacements': '更换前查询资源 version 和代理 version。支持1–100条同供应商、同目标资源；可直接填写 proxyUrl，额外需要 proxy.write。重试保持 requestKey 和内容不变，返回任务后查询逐项结果。reconcile 仅重新核对绑定，不重复提交更换。',
  'credential-refresh': '沿用授权维护开关；原生刷新使用 force:false。requestId 保持固定，UPDATED 才确认本次刷新。UNKNOWN 时查询原操作，账号可读不代表丢失的刷新响应已确认，不能重复刷新。',
  reauthorizations: 'POST 发起原账号 OAUTH，再用返回的操作 id 提交本次完整回调或 code#state。结果未知时查询 current 和原授权，不能重新兑换。REFRESH_TOKEN 替换仅属旧 CUSTOM 兼容能力。',
  operations: '使用本地 resourceId 和 operationId 查询或核对原操作，不重复发送上号、刷新凭据或授权兑换。UNKNOWN 继续保留原记录；HTTP 200 不能替代业务结果。',
  intake: '返回API密钥绑定账号的北京时间当日成功总数、PRO／非PRO／未识别数量、处理中数量和实际额度来源的余额。数量不随资源筛选变化；不返回优先级信息。',
  'daily-summary': '使用 quoteId 查询北京时间今天已保存的账单汇总，不采集上游日志、不刷新消耗。主账号限定本供应商，成员限定本人及授权项目。',
};

// Fallback descriptions by the last segment of a field name: request fields use
// REQUEST_HINTS; response fields try RESPONSE_HINTS first.
const REQUEST_HINTS: Record<string, string> = {
  projectCode: '项目查询返回的稳定编码。',
  quoteId: '项目查询返回的报价标识，精确关联本次查询。',
  projectId: '必填，使用项目查询返回的内部 projectId；projectCode 只用于展示和资源筛选。',
  proxyId: '仅已有 CUSTOM 接入可选，传已保存的本地代理 ID，不传代理地址；原生直连请省略。',
  requestKey: '调用方生成的 UUID；同一次提交重试时保持不变。',
  sessionId: '发起 OAuth 返回的本地会话标识。',
  id: '资源查询传资源 id；提交结果查询传 requestKey 或 sessionId。',
  credentialMode: '当前上号主流程仅填写 OAUTH；旧 CUSTOM 凭据流程单独兼容。',
  accountName: '上号账号名称，最多128个字符。',
  expiresAt: 'ACCESS_TOKEN 的可选过期时间，使用正整数毫秒时间戳。',
  setupToken: '仅兼容 false，true 暂不支持。',
  refreshToken: 'REFRESH_TOKEN 模式必填；仅通过请求体提交。',
  accessToken: 'ACCESS_TOKEN 模式必填。',
  sessionKey: 'SESSION_KEY 模式必填。',
  code: '本次授权的完整回调 URL 或 code#state，保留 state。',
  lines: '代理文本，支持 SOCKS5 / HTTP / HTTPS；单次最多500行。',
  defaultProtocol: 'SOCKS5 / HTTP / HTTPS，用于未写协议的输入。',
  maxResources: '非负整数；0表示不限。',
  page: '页码从1开始，默认1。',
  size: '每页条数默认20，最大100。',
  state: '按交付状态筛选，例如 DRAFT、DELIVERED。',
  operationalStatus: '按已有运行状态分类筛选，例如 READY、GONE、INVALID。',
  search: '关键词查询，沿用现有账号和 Lane ID 搜索。',
  input: 'OAuth 完成使用原 sessionId，无需再次提交账号对象。',
  businessDate: '服务端按 Asia/Shanghai 取今天。',
  consumptionTotal: '已入账原始金额加尚未入账的当天消耗，十进制字符串。',
  pendingConsumption: '尚未入账的当天消耗，不据此预估应付金额。',
  payableTotal: '仅供应商主账号返回已入账应收金额；部门管理员和普通成员不返回此字段。',
  hasData: '无数据为 false，金额为 null；真实零消耗保留零字符串。',
  lastQueriedAt: '范围内最近观测时间，不代表全部资源已同步。',
  imported: '成功导入数量；同时检查 skipped 中的跳过项。',
  skipped: '重复或格式错误行及对应原因。',
  resourceData: '已有额度和健康状态；没有数据时为 null。',
  resourceCount: '本次汇总涉及的资源数量。',
  entryCount: '本次汇总涉及的账单条目数量，仅返回数量。',
  pendingCount: '尚未入账的条目数量。',
};

const RESPONSE_HINTS: Record<string, string> = {
  id: '代理或资源的本地标识，供后续调用使用。',
  name: '对象的可读名称。',
  state: '业务状态；上号回执仅 SUCCESS 表示确认成功。',
  expiresAt: 'OAuth 会话到期时间，ISO 8601 格式。',
  projectId: '项目的内部标识。',
  projectName: '项目名称。',
  settlementMethod: 'QUOTA 为额度结算，ACCOUNT_BUYOUT 为账号买断。',
  quoteCode: '关联报价的业务编号。',
  currency: '金额所属币种，不合并不同币种。',
  timezone: '业务日期使用 Asia/Shanghai。',
  items: '当前页结果数组，具体字段见响应示例。',
  total: '列表总条数；上号额度接口中为当日PRO、非PRO与未识别成功数量之和。',
  page: '当前页码。',
  size: '当前每页条数。',
  sessionId: '本地授权会话标识，用于完成授权和查询结果。',
  authUrl: '由账号持有人打开并完成授权的链接。',
  resourceId: '成功关联的本地资源标识。',
  resourceType: '本组接口返回 CCMAX。',
  laneId: '上游账号的 Lane ID。',
  laneState: '最近同步的上游账号状态。',
  dispatchState: '本地交付处理结果。',
  createdAt: '资源创建时间。',
  updatedAt: '资源最近更新时间。',
  submittedAt: '资源提交交付时间，未提供时为空。',
  creationAttempts: '本次创建执行轮次，不等于最终 HTTP 创建请求次数。',
  creationRetrying: '是否仍处于原流程的受控恢复中。',
  creationFinished: '本次处理是否结束，不代表已成功交付。',
  creationHttpStatus: '已保存的上游 HTTP 状态码，可能为空。',
  creationFailureHint: '当前创建尝试的安全错误说明。',
  dispatchFailureReason: '已保存的交付失败说明。',
  date: '成功日期，按北京时间划分。',
  pro: '当日成功识别为PRO的新增数量。',
  nonPro: '当日成功识别为非PRO的新增数量。',
  unknown: '已成功但套餐未识别的数量，后续补入原成功日期。',
  processing: '处理中及结果待核实的请求数量。',
  proAllowance: '当前账号实际PRO额度来源的上限、已用、下级未用预留与本账号可用数；null上限表示不限。',
  nonProAllowance: '当前账号实际非PRO额度来源的上限、已用、下级未用预留与本账号可用数；null上限表示不限。',
  reservedRemaining: '该来源预留给直属成员或交付组的未用额度，受上级总限约束；不计入remaining。',
  proBlockReason: 'PRO不能接收的具体原因；null表示可接收。',
  nonProBlockReason: '非PRO不能接收的具体原因；null表示可接收。',
  canPro: '服务端计算的PRO接收状态，仅可读取，不能作为上号请求参数提交。',
  accepting: '当前额度来源是否接收新上号。',
};

/** Untranslated description key for a field row ('' when there is none). */
export function fieldHint(field: Field, request: boolean): string {
  const last = field.name.split('.').at(-1)!;
  return field.description || (!request && RESPONSE_HINTS[last]) || REQUEST_HINTS[last] || '';
}

/** Path below the API root, e.g. "/resources/{id}". */
export const relativePath = (endpoint: Endpoint) => endpoint.path.slice(API_ROOT.length);

export function groupOf(endpoint: Endpoint): string {
  const path = relativePath(endpoint);
  if (path.includes('/reauthorizations')) return 'reauthorizations';
  if (path.includes('/operations/')) return 'operations';
  if (path.endsWith('/credential-refresh')) return 'credential-refresh';
  return path.split('/')[1];
}

export const endpointLabel = (endpoint: Endpoint) => LABELS[`${endpoint.method} ${relativePath(endpoint)}`] || endpoint.operation.summary;

/** Permissions the API key's account needs for `endpoint`. */
export function permissionText(endpoint: Endpoint): string {
  switch (groupOf(endpoint)) {
    case 'projects': return 'project.read + resource.read';
    case 'submissions': return endpoint.method === 'GET' ? 'resource.read' : 'resource.write';
    case 'capabilities': return 'resource.read';
    case 'proxies': return endpoint.method === 'POST' ? 'proxy.read + proxy.write' : 'proxy.read';
    case 'resources':
    case 'intake': return 'resource.read';
    case 'proxy-replacements':
      return relativePath(endpoint) === '/proxy-replacements' ? 'resource.read + resource.write + proxy.read（直接填写额外需 proxy.write）' : 'resource.read';
    case 'credential-refresh':
    case 'reauthorizations':
    case 'operations': return endpoint.method === 'GET' ? 'resource.read' : 'resource.read + resource.write';
    default: return 'resource.read + resource.usage';
  }
}

// --- Placeholder examples ------------------------------------------------------

const REQUEST_KEY = '00000000-0000-4000-8000-000000000001';
const CREDENTIAL_INPUT = {
  projectCode: 'PRJ-000001',
  credentialMode: 'REFRESH_TOKEN',
  accountName: 'account@example.com',
  proxyId: 'http://username:password@proxy.example.com:8080',
  refreshToken: '<refreshToken>',
};
const OAUTH_AUTHORIZE = { projectId: '<projectId>', credentialMode: 'OAUTH', accountName: CREDENTIAL_INPUT.accountName, requestKey: REQUEST_KEY };

function requestExample(endpoint: Endpoint): unknown {
  if (endpoint.method === 'GET') return undefined;
  const group = groupOf(endpoint);
  if (group === 'credential-refresh') return { requestId: REQUEST_KEY, version: 0 };
  if (group === 'reauthorizations') {
    return endpoint.method === 'POST' ? { version: 0, mode: 'OAUTH', requestKey: REQUEST_KEY } : { code: '<authorizationCode>#<state>', requestKey: REQUEST_KEY };
  }
  switch (relativePath(endpoint)) {
    case '/proxy-replacements':
      return { requestKey: REQUEST_KEY, items: [{ resourceId: '<resourceId>', resourceVersion: 0, proxyUrl: 'http://username:password@proxy.example.com:8080' }] };
    case '/proxies/import': return { lines: 'socks5://username:password@proxy.example.com:1080', defaultProtocol: 'SOCKS5', maxResources: 10 };
    case '/submissions/credentials': return { requestKey: REQUEST_KEY, input: CREDENTIAL_INPUT };
    case '/submissions/oauth/authorize': return OAUTH_AUTHORIZE;
    case '/submissions/oauth/complete': return { sessionId: '<sessionId>', code: '<authorizationCode>#<state>' };
    default: return undefined;
  }
}

export function curlExample(endpoint: Endpoint): string {
  const query = groupOf(endpoint) === 'daily-summary' ? '?quoteId=<quoteId>' : '';
  const body = requestExample(endpoint);
  return [
    `curl --fail-with-body -X ${endpoint.method} "${origin}${endpoint.path.replace(/\{([^}]+)\}/g, '<$1>')}${query}"`,
    '  -H "Authorization: Bearer $CCMAX_API_KEY"',
    ...(body ? ['  -H "Content-Type: application/json"', `  --data '${JSON.stringify(body, null, 2)}'`] : []),
  ].join(' \\\n');
}

const RESOURCE = {
  id: '<resourceId>', version: 0, name: 'CCMAX account', accountName: 'account@example.com', projectId: '<projectId>',
  state: 'DELIVERED', dispatchState: 'SUCCESS', laneId: '<laneId>', laneState: 'READY', resourceData: null, resourceType: 'CCMAX',
};

/** Example 200 body; `payableTotal` appears only when `withPayable`. */
export function responseExample(endpoint: Endpoint, withPayable = true): unknown {
  const path = relativePath(endpoint);
  const group = groupOf(endpoint);
  if (group === 'capabilities') return { allowCcmax: true, allowDirectCcmax: true, supportsProxy: false, allowRawCredentialImport: false, credentialModes: ['OAUTH'] };
  if (group === 'operations') return { operationId: '<operationId>', resourceId: '<resourceId>', state: 'UNKNOWN' };
  if (group === 'proxy-replacements') {
    return { id: '<jobId>', mode: 'SINGLE', state: 'QUEUED', total: 1, finished: 0, items: [{ resourceId: '<resourceId>', state: 'PENDING', bindingApplied: false, readiness: 'unverified' }] };
  }
  if (group === 'credential-refresh') {
    return endpoint.method === 'GET'
      ? { status: 'NONE', reauthorizationAllowed: true }
      : { id: '<requestId>', state: 'UPDATED', operationId: '<operationId>', laneState: 'READY', paused: false, busy: false };
  }
  if (group === 'reauthorizations') {
    if (path.endsWith('/current')) return { status: 'NONE', reauthorizationAllowed: true };
    const started = endpoint.method === 'POST';
    return {
      id: '<operationId>', resourceId: '<resourceId>', mode: 'OAUTH', state: started ? 'READY' : 'SUCCESS', credentialSaved: !started, busy: false, paused: false,
      ...(started ? { authUrl: 'https://example.invalid/authorize', expiresAt: '2026-11-09T10:30:00+08:00' } : {}),
    };
  }
  if (path === '/projects') {
    return [{ projectId: '<projectId>', projectCode: 'PRJ-000001', projectName: 'CCMAX', settlementMethod: 'QUOTA', quoteId: '<quoteId>', quoteCode: 'QT-000001', currency: 'USD' }];
  }
  if (path === '/proxies/import') return { imported: 1, skipped: [] };
  if (path === '/proxies') {
    return {
      items: [{ id: '<proxyId>', version: 0, name: 'Proxy', protocol: 'SOCKS5', endpoint: 'pro****:1080', enabled: true, maxResources: 10, usedResources: 0, reservedResources: 0 }],
      total: 1, page: 1, size: 20,
    };
  }
  if (path.endsWith('/authorize')) return { sessionId: '<sessionId>', authUrl: 'https://example.invalid/authorize', expiresAt: '2026-11-03T10:30:00+08:00' };
  if (path.endsWith('/cancel')) return { state: 'CANCELLED' };
  if (group === 'submissions') return { state: 'SUCCESS', resourceId: '<resourceId>', laneId: '<laneId>', laneState: 'READY' };
  if (path === '/resources') return { items: [RESOURCE], total: 1, page: 1, size: 20 };
  if (path === '/resources/{id}') return RESOURCE;
  if (path === '/intake') {
    const allowance = (limit: number, used: number) => ({ limit, used, remaining: limit - used, source: 'U:<userId>', groupId: '<groupId>', reclaimed: false, reservedRemaining: 0 });
    return {
      date: '2026-11-04', total: 35, pro: 2, nonPro: 30, unknown: 3, processing: 1,
      proAllowance: allowance(10, 2), nonProAllowance: allowance(100, 30),
      canPro: true, accepting: true, proBlockReason: null, nonProBlockReason: null,
    };
  }
  return {
    businessDate: '2026-11-03', timezone: 'Asia/Shanghai', quoteId: '<quoteId>', currency: 'USD', hasData: true,
    resourceCount: 2, entryCount: 3, pendingCount: 1, consumptionTotal: '2.123456789', pendingConsumption: '0.123456789',
    ...(withPayable ? { payableTotal: '1.6' } : {}),
    lastQueriedAt: '2026-11-03T10:00:00+08:00',
  };
}
