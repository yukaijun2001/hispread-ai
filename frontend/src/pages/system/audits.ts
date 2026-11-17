// Audit log labels, one-line summaries and the field-level change table.
import { t } from '../../lib/i18n';

export interface AuditEntry {
  id: string;
  action: string;
  actorName: string;
  targetType: string;
  targetId: string;
  outcome: string;
  ip?: string | null;
  traceId?: string | null;
  createdAt: string;
  beforeJson?: string | null;
  afterJson?: string | null;
}

export interface AuditDetail extends AuditEntry {
  originalBodiesAvailable?: boolean;
  originalRequestBody?: string | null;
  originalResponseBody?: string | null;
}

export interface AuditChange { id: string; field: string; before: unknown; after: unknown }

type Json = Record<string, unknown>;

export const own = (map: Record<string, string>, key: string): string | undefined => (Object.hasOwn(map, key) ? map[key] : undefined);

export const AUDIT_ACTION_LABELS = (): Record<string, string> => ({
  RESOURCE_INTAKE_MATERIAL_VIEWED: t('查看资源密钥与模型映射'),
  RESOURCE_INTAKE_REQUEST_VIEWED: t('查看资源原始请求'),
  RESOURCE_INTAKE_RECEIVED: t('接收资源上报'),
  RESOURCE_INTAKE_BATCH_RECEIVED: t('批量接收资源上报'),
  RESOURCE_INTAKE_PROJECT_ASSIGNED: t('分配上报资源项目'),
  RESOURCE_INTAKE_PROJECT_TYPES_CHANGED: t('调整项目资源接入类型'),
  RESOURCE_INTAKE_REPLAY_CONFLICT: t('拦截资源上报重放冲突'),
  RESOURCE_INTAKE_MATERIAL_CONFLICT: t('拦截资源凭据冲突'),
  MONITORING_SOURCE_CREATED: t('新增工作台展示配置'),
  MONITORING_SOURCE_UPDATED: t('修改工作台展示配置'),
  MONITORING_MULTIPLIER_UPDATED: t('修改品类参考倍率'),
  ACCESS_DENIED: t('权限或 CSRF 校验拦截'),
  REQUEST_FORBIDDEN: t('请求被禁止'),
  LOGIN_RATE_LIMIT: t('登录或注册频率拦截'),
  USER_CREATE: t('创建账号'),
  ROLE_CREATE: t('创建角色'),
  SELF_ONBOARD: t('提交供应商注册资料'),
  SUPPLIER_AUTO_APPROVE: t('自动通过供应商注册'),
  SUPPLIER_REJECT: t('退回供应商资质'),
  SUPPLIER_ENABLE: t('启用供应商'),
  SUPPLIER_DISABLE: t('停用供应商'),
  SUPPLIER_NOTE: t('修改供应商备注'),
  SUPPLIER_SETTINGS_UPDATED: t('修改供应商平台配置'),
  SUPPLIER_OWNER_ASSIGNED: t('指定负责运营'),
  SUPPLIER_AGENT_PROJECTS_CHANGED: t('调整团队成员项目权限'),
  SUPPLIER_AGENT_PROJECTS_REVOKED: t('级联收回团队成员项目权限'),
  SUPPLIER_TEAM_GROUP_CREATED: t('创建团队分组'),
  SUPPLIER_TEAM_GROUP_CHANGED: t('调整团队分组'),
  SUPPLIER_TEAM_GROUP_REMOVED: t('解散团队分组'),
  SUPPLIER_TEAM_MEMBERS_MOVED: t('调整团队成员所属分组'),
  ACCOUNT_SUBMIT: t('提交收款账户'),
  ACCOUNT_REJECT: t('退回收款账户'),
  QUOTE_REJECT: t('退回待审核报价'),
  QUOTE_WITHDRAW: t('撤回报价'),
  QUOTE_APPROVED_REJECT: t('拒绝已通过报价'),
  QUOTE_PERIOD_CHANGE_CLOSED_BY_REJECTION: t('关闭被拒绝报价的调整申请'),
  SETTLEMENT_AUTO_CONFIRM: t('超时自动确认结算'),
  PAYMENT_REJECT: t('退回付款申请'),
  PAYMENT_CANCEL: t('取消付款申请'),
  PAYMENT_FAIL: t('登记付款申请失败'),
  PAYOUT_PROCESSING: t('付款通道处理中'),
  PAYOUT_UNKNOWN: t('付款通道结果待核对'),
  PAYOUT_SUCCEEDED: t('记录付款通道成功结果'),
  PAYOUT_FAILED: t('记录付款通道失败结果'),
  PAYOUT_EVENT_IGNORED: t('忽略未改变状态的付款通道事件'),
  PAYOUT_COST_RESERVED: t('预留付款通道费用'),
  REPORT_EXPORT: t('导出报表'),
  CC_INTAKE_REVIEW_REQUIRED: t('上号计数待核对'),
  CC_INTAKE_DUPLICATE_SKIPPED: t('跳过重复上号计数'),
  CC_INTAKE_REVIEW_RESOLVED: t('核对上号计数结果'),
  CC_INTAKE_POLICY_UPDATED: t('修改CC上号规则'),
  CC_INTAKE_ALLOCATIONS_UPDATED: t('分配CC上号额度'),
  CC_INTAKE_HISTORY_INITIALIZED: t('初始化历史上号计数'),
  CC_INTAKE_HISTORY_INITIALIZATION_COMPLETED: t('完成历史上号计数初始化'),
  CC_INTAKE_SUCCEEDED: t('记录CC上号成功'),
  CC_INTAKE_PLAN_IDENTIFIED: t('补识别CC上号套餐'),
  CC_INTAKE_REJECTED: t('CC上号额度拦截'),
  CC_PRIORITY_PREVIEW_CREATED: t('创建优先级调整预览'),
  CC_PRIORITY_JOB_STARTED: t('执行优先级调整'),
  CC_PRIORITY_JOB_RETRIED: t('重试优先级失败项'),
  CC_PRIORITY_AUTO_ASSIGNED: t('自动分配账号优先级'),
  CC_PRIORITY_AUTO_SKIPPED: t('跳过自动优先级分配'),
  CC_PRIORITY_ROTATION_CONFIGURED: t('修改优先级扶持任务'),
  CC_PRIORITY_ROTATION_CREATED: t('创建优先级扶持任务'),
  CC_PRIORITY_ROTATION_RESTORE_RETRIED: t('重试扶持优先级恢复'),
  CC_PRIORITY_ROTATION_STAGED: t('创建优先级扶持轮次'),
  RESOURCE_LIFECYCLE_CREATED: t('创建资源暂停或移除操作'),
  RESOURCE_LIFECYCLE_ITEM_FINISHED: t('记录资源暂停或移除结果'),
  RESOURCE_LIFECYCLE_RECONCILED: t('重新核对资源暂停或移除状态'),
  CC_PRIORITY_ITEM_FINISHED: t('记录优先级调整结果'),
  DAILY_EXPORT_CREATED: t('创建日账导出任务'),
  DAILY_EXPORT_COMPLETED: t('完成日账导出任务'),
  DAILY_EXPORT_FAILED: t('日账导出任务失败'),
  DAILY_EXPORT_CANCELLED: t('取消日账导出任务'),
  DAILY_EXPORT_DOWNLOADED: t('下载日账导出文件'),
  CC_API_CALL: t('CCMAX 接口调用'),
  CCMAX_SYNC_SETTINGS_UPDATED: t('调整 CCMAX 查询并发设置'),
  CCMAX_DAILY_CONFIRMED: t('历史确认 CCMAX 日账'),
  CCMAX_DAILY_POSTED: t('自动入账 CCMAX 日账'),
  CCMAX_DAILY_UPDATED: t('自动更新 CCMAX 日账'),
  CCMAX_DAILY_OBSERVE: t('采集 CCMAX 日账观测'),
  CCMAX_DAILY_PREVIEW: t('预览 CCMAX 日账'),
  LOGIN: t('登录系统'),
  LOGOUT: t('退出登录'),
  SETTLEMENT_CREATE: t('生成结算单'),
  SETTLEMENT_BATCH_START: t('批量生成结算单'),
  SETTLEMENT_ADJUST: t('人工调整结算金额'),
  SETTLEMENT_CONFIRM: t('确认结算'),
  SETTLEMENT_REJECT: t('退回结算'),
  SETTLEMENT_EXPORT: t('导出结算明细'),
  SETTLEMENT_BATCH_EXPORT: t('批量导出结算单'),
  PAYMENT_METHOD_SELECTED: t('选择付款方式'),
  PAYMENT_CREATE: t('申请付款'),
  PAYMENT_APPROVE: t('付款申请审核通过'),
  PAYMENT_MANUAL_RECORD: t('登记付款结果'),
  EXCHANGE_RATE_CREATE: t('发布汇率版本'),
  EXCHANGE_RATE_ENABLE: t('重新发布汇率版本'),
  EXCHANGE_RATE_DISABLE: t('停用汇率版本'),
  SUPPLIER_CREATE: t('创建供应商'),
  SUPPLIER_APPROVE: t('供应商资质审核通过'),
  SUPPLIER_CHANGE_SUBMIT: t('提交资料变更'),
  ACCOUNT_APPROVE: t('收款账户审核通过'),
  ACCOUNT_REVEAL: t('查看完整收款账号'),
  QUOTE_AUTO_RENEWED: t('报价自动续期'),
  QUOTE_SUBMIT: t('提交报价'),
  QUOTE_UPDATE: t('修改报价'),
  QUOTE_PERIOD_CHANGE_REQUESTED: t('申请报价调整'),
  QUOTE_PERIOD_CHANGE_APPROVED: t('报价调整审核通过'),
  QUOTE_PERIOD_CHANGE_REJECTED: t('报价调整审核退回'),
  QUOTE_APPROVE: t('报价审核通过'),
  USER_ACCESS_CHANGE: t('调整账号权限'),
  USER_ENABLED_CHANGE: t('调整账号启用状态'),
  ACCOUNT_API_TOKEN_CREATED: t('创建账号 API 密钥'),
  ACCOUNT_API_TOKEN_RESET: t('重置账号 API 密钥'),
  ACCOUNT_API_TOKEN_REVEALED: t('查看账号 API 密钥明文'),
  ACCOUNT_API_TOKEN_REVOKED: t('撤销账号 API 密钥'),
  ROLE_UPDATE: t('修改角色权限'),
  USAGE_IMPORT: t('导入结算数据'),
  DOCUMENT_UPLOAD: t('上传附件'),
  DOCUMENT_DOWNLOAD: t('下载附件'),
  PASSWORD_RESET: t('重置账号密码'),
  USER_FORCE_LOGOUT: t('强制登出账号'),
  TURNOVER_RECORD: t('登记每日营业额'),
  PASSWORD_CHANGE: t('修改本人密码'),
  SECURITY_SETTINGS_UPDATE: t('修改系统参数'),
  SUPPLIER_USER_LINK: t('关联供应商用户'),
  SUPPLIER_USER_CREATE: t('创建供应商用户'),
  PROJECT_CREATE: t('创建项目'),
  PROJECT_UPDATE: t('维护项目'),
  PROJECT_CATEGORY_CREATE: t('创建项目分类'),
  PROJECT_CATEGORY_UPDATE: t('修改项目分类'),
  PROJECT_CATEGORY_DELETE: t('删除项目分类'),
  RESOURCE_PROXY_REPLACEMENT_CREATED: t('发起代理更换'),
  RESOURCE_PROXY_REPLACEMENT_APPLIED: t('确认代理换绑'),
  OUTBOUND_PROXY_CREATED: t('创建代理配置'),
  OUTBOUND_PROXY_UPDATED: t('修改代理配置'),
  OUTBOUND_PROXY_TESTED: t('检测代理连接'),
  RESOURCE_DRAFT_CREATED: t('创建资源草稿'),
  RESOURCE_DRAFT_UPDATED: t('修改资源草稿'),
  RESOURCE_DRAFT_DELETED: t('删除资源草稿'),
  RESOURCE_OAUTH_AUTHORIZED: t('创建资源授权会话'),
  TARGET_OAUTH_STARTED: t('发起目标授权'),
  TARGET_OAUTH_SUBMITTED: t('提交目标授权码'),
  TARGET_OAUTH_COMPLETED: t('完成目标授权'),
  RESOURCE_DELIVERED: t('接收资源交付'),
  RESOURCE_STATUS_SYNCED: t('手动同步资源状态'),
  RESOURCE_USAGE_SYNCED: t('手动同步资源状态与消耗'),
  RESOURCE_STATUS_PROJECTION_REBUILT: t('重建资源状态投影'),
  SUPPLIER_OAUTH_PREPARED: t('准备供应商交付授权'),
  SUPPLIER_SUBMISSION_CANCELLED: t('取消供应商交付'),
  RESOURCE_CREATION_RECONCILED: t('人工核对交付失败'),
  RESOURCE_DELIVERY_REOPENED: t('恢复授权失败的交付草稿'),
  RESOURCE_COVERED_BY_LANE: t('按 Lane 覆盖同供应商资源'),
  RESOURCE_LANE_SUPPLY_REJECTED: t('拒绝重复供应的 Lane'),
  RESOURCE_CREDENTIAL_REFRESH_STARTED: t('发起强制刷新授权'),
  RESOURCE_CREDENTIAL_REFRESH_UPDATED: t('更新强制刷新授权进度'),
  RESOURCE_REAUTHORIZATION_STARTED: t('发起已有账号重新授权'),
  RESOURCE_REAUTHORIZATION_UPDATED: t('更新已有账号授权进度'),
  RESOURCE_DISPATCH_STARTED: t('发起资源分发'),
  RESOURCE_DISPATCH_FINISHED: t('记录资源分发结果'),
  RESOURCE_TARGET_CREATED: t('创建分发目标'),
  RESOURCE_TARGET_UPDATED: t('修改分发目标'),
  SCHEDULED_TASK_CREATED: t('创建定时任务'),
  SCHEDULED_TASK_UPDATED: t('修改定时任务'),
  SCHEDULED_TASK_TOGGLE: t('切换定时任务状态'),
  SCHEDULED_TASK_SCHEDULE_UPDATED: t('调整定时任务执行周期'),
  WORKBENCH_WECOM_SETTINGS_UPDATED: t('修改工作台企微提醒设置'),
  PERSONAL_PROFILE_UPDATED: t('修改个人资料'),
  SELF_REGISTER: t('注册账号'),
  SUPPLIER_CODE_CHANGE: t('修改供应商编码'),
  SUPPLIER_AGENT_CREATED: t('创建供应商团队账号'),
  SUPPLIER_AGENT_ACCESS_CHANGED: t('调整团队账号权限'),
  SUPPLIER_AGENT_PASSWORD_RESET: t('重置团队账号密码'),
  SETTLEMENT_INPUT_MANUAL: t('手工录入结算来源'),
  SETTLEMENT_INPUT_RECEIVE: t('接收结算来源'),
  SETTLEMENT_INPUT_VOID: t('作废结算来源'),
  SETTLEMENT_WITHDRAW: t('撤回结算单'),
  SETTLEMENT_VOID: t('作废结算单'),
  PAYOUT_PROVIDER_SAVE: t('保存付款服务配置'),
  PAYOUT_REQUESTED: t('发起付款请求'),
  BILLING_DATA_IMPORT: t('录入计费数据'),
  SYSTEM_NOTICE_DRAFT_CREATE: t('新建通知草稿'),
  SYSTEM_NOTICE_DRAFT_UPDATE: t('修改通知草稿'),
  SYSTEM_NOTICE_PUBLISH: t('发布系统通知'),
  SYSTEM_NOTICE_REVOKE: t('撤回系统通知'),
  RECEIPT_CONFIRMED: t('确认收款'),
  RECEIPT_DISPUTED: t('提出收款异议'),
});

/** Result badge text for successful steps that do not mean the final outcome. */
const PROGRESS_LABELS = (): Record<string, string> => ({
  RESOURCE_OAUTH_AUTHORIZED: t('会话已创建'),
  TARGET_OAUTH_STARTED: t('已发起'),
  TARGET_OAUTH_SUBMITTED: t('已提交'),
  TARGET_OAUTH_COMPLETED: t('授权完成'),
  RESOURCE_DISPATCH_STARTED: t('已发起'),
  RESOURCE_DELIVERED: t('本地已交付'),
});

export const AUDIT_TARGET_LABELS = (): Record<string, string> => ({
  SUPPLIER: t('供应商'),
  SETTINGS: t('系统参数'),
  ACCOUNT_API_TOKEN: t('账号 API 密钥'),
  DAILY_EXPORT: t('日账导出任务'),
  SUPPLIER_TEAM_GROUP: t('团队分组'),
  RESOURCE_INTAKE_RECEIPT: t('资源接入回执'),
  INTAKE_RESOURCE: t('上报资源'),
  RESOURCE_STATUS_PROJECTION: t('资源状态投影'),
  CC_OAUTH_SESSION: t('资源授权会话'),
  PROXY_REPLACEMENT: t('代理更换任务'),
  SCHEDULED_TASK: t('定时任务'),
  MONITORING_SOURCE: t('工作台监控配置'),
  MONITORING_CATEGORY: t('参考数据品类'),
  CC_RESOURCE: t('资源'),
  CC_DISPATCH: t('分发记录'),
  CC_INTAKE_CONFIG: t('CC上号配置'),
  CC_PRIORITY_JOB: t('优先级调整任务'),
  CC_PRIORITY_ITEM: t('优先级调整明细'),
  CC_TARGET: t('CCMAX 目标'),
  SECURITY: t('安全记录'),
});

const SECURITY_POLICY_FIELDS = (): Record<string, string> => ({
  sessionIdleMinutes: t('空闲有效期（分钟）'),
  sessionAbsoluteMinutes: t('绝对有效期（分钟）'),
  passwordMinLength: t('密码最短长度'),
  passwordMaxLength: t('密码最长长度'),
  requireUpper: t('要求大写字母'),
  requireLower: t('要求小写字母'),
  requireDigit: t('要求数字'),
  requireSymbol: t('要求特殊字符'),
  initialPasswordLength: t('初始密码总长度'),
  initialPasswordFormat: t('初始密码格式'),
  initialPasswordPrefix: t('初始密码前缀'),
  forceInitialChange: t('首次登录强制改密'),
  loginMaxFailures: t('登录失败次数上限'),
  loginLockMinutes: t('登录锁定时长（分钟）'),
  allowSamePersonReview: t('允许同一账号审核'),
  supplierRegistrationApprovalEnabled: t('供应商注册需要审核'),
  quoteMultiplierMin: t('报价倍率下限'),
  quoteMultiplierMax: t('报价倍率上限'),
});

const INTAKE_SETTING_FIELDS = (): Record<string, string> => ({
  forceStopCcmaxIntake: t('强制停止 CCMAX 新增上号'),
  ccmaxIntakeConcurrencyLimit: t('每供应商同时上号数'),
  ccmaxCreationTimeoutSeconds: t('上号单次超时（秒）'),
  allowAllSuppliersPro: t('全部供应商允许 PRO 上号'),
  allowAllSuppliersCcmax: t('全部供应商允许 CCMAX 上号'),
  allowAllSuppliersCcmaxReauthorization: t('全部供应商允许 CCMAX 重新授权'),
});

const SUPPLIER_SETTING_FIELDS = (): Record<string, string> => ({
  defaultProxyMaxResources: t('新代理默认绑定数量'),
  allowPro: t('允许 PRO 上号'),
  allowCcmax: t('允许该供应商 CCMAX 上号'),
  allowCcmaxReauthorization: t('允许该供应商 CCMAX 重新授权'),
  allowCcmaxPause: t('允许该供应商暂停资源'),
  allowCcmaxSafeRemoval: t('允许该供应商移除资源'),
});

const SUPPLIER_PROFILE_FIELDS = (): Record<string, string> => ({
  name: t('供应商名称'),
  supplierType: t('主体类型'),
  contact: t('联系人'),
  email: t('邮箱'),
  phone: t('电话'),
  country: t('国家或地区'),
  cycle: t('结算周期'),
  customCycleDays: t('自定义结算天数'),
});

/** A JSON snapshot as a plain object; anything else (invalid, array, scalar) is `{}`. */
export function parseSnapshot(text: string | null | undefined): Json {
  try {
    const value = JSON.parse(text || '{}');
    return typeof value === 'object' && value && !Array.isArray(value) ? value : {};
  } catch {
    return {};
  }
}

const asObject = (value: unknown): Json => (typeof value === 'object' && value && !Array.isArray(value) ? value as Json : {});

/** Known proxy / OAuth failures of a CCMAX call, explained for the operator. */
function ccmaxFailureHint(status: unknown, body: unknown, hint: unknown): string | null {
  const proxyUnavailable = () => t('所选代理出口不可用或已被停用，请更换代理；OAuth交付需重新生成授权链接。');
  const oauthFailed = () => t('OAuth换取令牌时连接失败，请检查所选代理；重新授权时请使用新生成的授权链接和授权码。');
  if (hint === 'CCMAX_PROXY_UNAVAILABLE') return proxyUnavailable();
  if (hint === 'CCMAX_OAUTH_CONNECT_FAILED') return oauthFailed();
  if (typeof status !== 'number' || !body || typeof body !== 'object' || Array.isArray(body)) return null;
  const response = body as Json;
  if (response.id != null || response.state != null || !response.error || typeof response.error !== 'object' || Array.isArray(response.error)) return null;
  const error = response.error as Json;
  if (typeof error.message !== 'string') return null;
  const message = error.message.toLowerCase();
  if ((status === 400 || status === 403) && message.includes('socket') && (message.includes('unavailable') || message.includes('disabled'))) return proxyUnavailable();
  if (status >= 500 && status <= 599 && message.includes('oauth token exchange')
    && ['could not connect', 'connection failed', 'connection refused'].some((phrase) => message.includes(phrase))) return oauthFailed();
  return null;
}

/** Field-level changes for the actions whose snapshots have known fields. */
export function auditChanges(entry: AuditEntry): AuditChange[] {
  const before = parseSnapshot(entry.beforeJson);
  const after = parseSnapshot(entry.afterJson);
  const diff = (fields: Record<string, string>, from: Json, to: Json) => Object.entries(fields)
    .filter(([key]) => Object.hasOwn(from, key) || Object.hasOwn(to, key))
    .map(([key, field]) => ({ id: key, field, before: from[key], after: to[key] }))
    .filter((change) => change.before !== change.after);
  if (entry.action === 'SECURITY_SETTINGS_UPDATE') {
    return [...diff(SECURITY_POLICY_FIELDS(), asObject(before.policy), asObject(after.policy)), ...diff(INTAKE_SETTING_FIELDS(), before, after)];
  }
  if (entry.action === 'SUPPLIER_SETTINGS_UPDATED') return diff(SUPPLIER_SETTING_FIELDS(), before, after);
  if (entry.action === 'SUPPLIER_CHANGE_SUBMIT') return diff(SUPPLIER_PROFILE_FIELDS(), before, asObject(after.requestedProfile));
  return [];
}

export function formatChangeValue(value: unknown): string {
  if (value === undefined) return t('未记录');
  if (value === null) return t('未设置');
  if (value === '') return t('空值');
  if (typeof value === 'boolean') return t(value ? '是' : '否');
  if (typeof value === 'object') return JSON.stringify(value);
  return String(value);
}

/** One-line explanation shown under the action and as the drawer subtitle. */
export function auditSummary(entry: AuditEntry): string {
  if (entry.action === 'RESOURCE_OAUTH_AUTHORIZED') return t('已生成授权链接，等待提交授权码');
  if (entry.action === 'TARGET_OAUTH_SUBMITTED') return t('授权码已提交，等待目标创建结果');
  if (entry.action === 'RESOURCE_DISPATCH_STARTED') return t('已发起目标创建，结果待确认');
  if (entry.action === 'RESOURCE_DELIVERED') return t('资源已在平台接收');
  if (entry.action === 'RESOURCE_DELIVERY_REOPENED') {
    return parseSnapshot(entry.afterJson).reason === 'OAUTH_INVALID_CODE'
      ? t('确认授权码无效，恢复草稿以便重新授权') : t('确认目标拒绝创建，恢复草稿以便重新授权');
  }
  if (entry.action === 'RESOURCE_DISPATCH_FINISHED') {
    const state = parseSnapshot(entry.afterJson).state;
    return t(state === 'SUCCESS' ? '目标创建成功' : state === 'FAILED' ? '目标明确拒绝创建' : '目标结果待人工核对');
  }
  if (entry.action === 'CC_API_CALL') {
    const before = parseSnapshot(entry.beforeJson);
    const after = parseSnapshot(entry.afterJson);
    const body = after.body;
    const error = body && typeof body === 'object' && !Array.isArray(body) ? (body as Json).error : null;
    const message = error && typeof error === 'object' && !Array.isArray(error) ? (error as Json).message : null;
    if (after.httpStatus === 400 && typeof message === 'string' && message.includes('authorization code state does not match this sign-in link')) {
      return t('授权码与本次登录链接不匹配，CCMAX 拒绝创建资源');
    }
    const hint = ccmaxFailureHint(after.httpStatus, body, after.ccmaxFailureHint);
    if (hint) return t('{0}（HTTP {1}）', [hint, after.httpStatus]);
    if (typeof after.httpStatus === 'number' && after.httpStatus >= 400) return t('CCMAX 接口拒绝请求（HTTP {0}）', [after.httpStatus]);
    if (after.callOutcome === 'NETWORK_ERROR') return t('请求未收到目标响应，结果待核对');
    if (before.path === '/v1/lanes') return t('向 CCMAX 创建资源');
    if (before.path === '/v1/lanes/query') return t('查询 CCMAX 状态与费用');
    if (before.path === '/v1/lanes/oauth/authorize') return t('生成 CCMAX 授权链接');
    return t('调用 CCMAX 接口');
  }
  return entry.outcome === 'SUCCESS' ? t('操作已记录') : t('操作未成功');
}

/** Result badge label; undefined falls back to the state's own label. */
export function auditResultLabel(entry: AuditEntry): string | undefined {
  if (entry.action === 'CC_API_CALL') {
    const after = parseSnapshot(entry.afterJson);
    if (after.httpStatus) return `HTTP ${after.httpStatus}`;
    return after.callOutcome === 'NETWORK_ERROR' ? t('未收到响应') : undefined;
  }
  if (entry.outcome !== 'SUCCESS') return undefined;
  if (entry.action === 'RESOURCE_DISPATCH_FINISHED') {
    const state = parseSnapshot(entry.afterJson).state;
    return t(state === 'SUCCESS' ? '分发成功' : state === 'FAILED' ? '分发失败' : state === 'UNKNOWN' ? '结果待核对' : '已记录');
  }
  return own(PROGRESS_LABELS(), entry.action);
}

/** Badge state: a dispatch the target refused is a failure even though recording it succeeded. */
export function auditState(entry: AuditEntry): string {
  return entry.action === 'RESOURCE_DISPATCH_FINISHED' && parseSnapshot(entry.afterJson).state === 'FAILED' ? 'FAILURE' : entry.outcome;
}
