// origin: assets/Audits-BxINf5wz.js
import {
  C as e,
  G as t,
  P as n,
  S as r,
  X as i,
  Z as a,
  _ as o,
  a as s,
  c,
  f as l,
  g as u,
  h as d,
  j as f,
  l as p,
  m,
  mt as h,
  o as g,
  pt as _,
  s as v,
  u as y,
  vt as b,
  y as x
} from "./index-Dnr0i-H9.js";
import {
  t as S
} from "./DateRangePicker-DtOG4QUZ.js";
var C = b(a(), 1);

function w(e, t, n) {
  if (n === `CCMAX_PROXY_UNAVAILABLE`) return h(`所选代理出口不可用或已被停用，请更换代理；OAuth交付需重新生成授权链接。`);
  if (n === `CCMAX_OAUTH_CONNECT_FAILED`) return h(`OAuth换取令牌时连接失败，请检查所选代理；重新授权时请使用新生成的授权链接和授权码。`);
  if (typeof e != `number` || !t || typeof t != `object` || Array.isArray(t)) return null;
  let r = t;
  if (r.id != null || r.state != null || !r.error || typeof r.error != `object` || Array.isArray(r.error)) return null;
  let i = r.error;
  if (typeof i.message != `string`) return null;
  let a = i.message.toLowerCase();
  return (e === 400 || e === 403) && a.includes(`socket`) && (a.includes(`unavailable`) || a.includes(`disabled`)) ? h(`所选代理出口不可用或已被停用，请更换代理；OAuth交付需重新生成授权链接。`) : e >= 500 && e <= 599 && a.includes(`oauth token exchange`) && [`could not connect`, `connection failed`, `connection refused`].some(e => a.includes(e)) ? h(`OAuth换取令牌时连接失败，请检查所选代理；重新授权时请使用新生成的授权链接和授权码。`) : null
}
var T = {
    RESOURCE_INTAKE_MATERIAL_VIEWED: h(`查看资源密钥与模型映射`),
    RESOURCE_INTAKE_REQUEST_VIEWED: h(`查看资源原始请求`),
    RESOURCE_INTAKE_RECEIVED: h(`接收资源上报`),
    RESOURCE_INTAKE_BATCH_RECEIVED: h(`批量接收资源上报`),
    RESOURCE_INTAKE_PROJECT_ASSIGNED: h(`分配上报资源项目`),
    RESOURCE_INTAKE_PROJECT_TYPES_CHANGED: h(`调整项目资源接入类型`),
    RESOURCE_INTAKE_REPLAY_CONFLICT: h(`拦截资源上报重放冲突`),
    RESOURCE_INTAKE_MATERIAL_CONFLICT: h(`拦截资源凭据冲突`),
    MONITORING_SOURCE_CREATED: h(`新增工作台展示配置`),
    MONITORING_SOURCE_UPDATED: h(`修改工作台展示配置`),
    MONITORING_MULTIPLIER_UPDATED: h(`修改品类参考倍率`),
    ACCESS_DENIED: h(`权限或 CSRF 校验拦截`),
    REQUEST_FORBIDDEN: h(`请求被禁止`),
    LOGIN_RATE_LIMIT: h(`登录或注册频率拦截`),
    USER_CREATE: h(`创建账号`),
    ROLE_CREATE: h(`创建角色`),
    SELF_ONBOARD: h(`提交供应商注册资料`),
    SUPPLIER_AUTO_APPROVE: h(`自动通过供应商注册`),
    SUPPLIER_REJECT: h(`退回供应商资质`),
    SUPPLIER_ENABLE: h(`启用供应商`),
    SUPPLIER_DISABLE: h(`停用供应商`),
    SUPPLIER_NOTE: h(`修改供应商备注`),
    SUPPLIER_SETTINGS_UPDATED: h(`修改供应商平台配置`),
    SUPPLIER_OWNER_ASSIGNED: h(`指定负责运营`),
    SUPPLIER_AGENT_PROJECTS_CHANGED: h(`调整团队成员项目权限`),
    SUPPLIER_AGENT_PROJECTS_REVOKED: h(`级联收回团队成员项目权限`),
    SUPPLIER_TEAM_GROUP_CREATED: h(`创建团队分组`),
    SUPPLIER_TEAM_GROUP_CHANGED: h(`调整团队分组`),
    SUPPLIER_TEAM_GROUP_REMOVED: h(`解散团队分组`),
    SUPPLIER_TEAM_MEMBERS_MOVED: h(`调整团队成员所属分组`),
    ACCOUNT_SUBMIT: h(`提交收款账户`),
    ACCOUNT_REJECT: h(`退回收款账户`),
    QUOTE_REJECT: h(`退回待审核报价`),
    QUOTE_WITHDRAW: h(`撤回报价`),
    QUOTE_APPROVED_REJECT: h(`拒绝已通过报价`),
    QUOTE_PERIOD_CHANGE_CLOSED_BY_REJECTION: h(`关闭被拒绝报价的调整申请`),
    SETTLEMENT_AUTO_CONFIRM: h(`超时自动确认结算`),
    PAYMENT_REJECT: h(`退回付款申请`),
    PAYMENT_CANCEL: h(`取消付款申请`),
    PAYMENT_FAIL: h(`登记付款申请失败`),
    PAYOUT_PROCESSING: h(`付款通道处理中`),
    PAYOUT_UNKNOWN: h(`付款通道结果待核对`),
    PAYOUT_SUCCEEDED: h(`记录付款通道成功结果`),
    PAYOUT_FAILED: h(`记录付款通道失败结果`),
    PAYOUT_EVENT_IGNORED: h(`忽略未改变状态的付款通道事件`),
    PAYOUT_COST_RESERVED: h(`预留付款通道费用`),
    REPORT_EXPORT: h(`导出报表`),
    CC_INTAKE_REVIEW_REQUIRED: h(`上号计数待核对`),
    CC_INTAKE_DUPLICATE_SKIPPED: h(`跳过重复上号计数`),
    CC_INTAKE_REVIEW_RESOLVED: h(`核对上号计数结果`),
    CC_INTAKE_POLICY_UPDATED: h(`修改CC上号规则`),
    CC_INTAKE_ALLOCATIONS_UPDATED: h(`分配CC上号额度`),
    CC_INTAKE_HISTORY_INITIALIZED: h(`初始化历史上号计数`),
    CC_INTAKE_HISTORY_INITIALIZATION_COMPLETED: h(`完成历史上号计数初始化`),
    CC_INTAKE_SUCCEEDED: h(`记录CC上号成功`),
    CC_INTAKE_PLAN_IDENTIFIED: h(`补识别CC上号套餐`),
    CC_INTAKE_REJECTED: h(`CC上号额度拦截`),
    CC_PRIORITY_PREVIEW_CREATED: h(`创建优先级调整预览`),
    CC_PRIORITY_JOB_STARTED: h(`执行优先级调整`),
    CC_PRIORITY_JOB_RETRIED: h(`重试优先级失败项`),
    CC_PRIORITY_AUTO_ASSIGNED: h(`自动分配账号优先级`),
    CC_PRIORITY_AUTO_SKIPPED: h(`跳过自动优先级分配`),
    CC_PRIORITY_ROTATION_CONFIGURED: h(`修改优先级扶持任务`),
    CC_PRIORITY_ROTATION_CREATED: h(`创建优先级扶持任务`),
    CC_PRIORITY_ROTATION_RESTORE_RETRIED: h(`重试扶持优先级恢复`),
    CC_PRIORITY_ROTATION_STAGED: h(`创建优先级扶持轮次`),
    RESOURCE_LIFECYCLE_CREATED: h(`创建资源暂停或移除操作`),
    RESOURCE_LIFECYCLE_ITEM_FINISHED: h(`记录资源暂停或移除结果`),
    RESOURCE_LIFECYCLE_RECONCILED: h(`重新核对资源暂停或移除状态`),
    CC_PRIORITY_ITEM_FINISHED: h(`记录优先级调整结果`),
    DAILY_EXPORT_CREATED: h(`创建日账导出任务`),
    DAILY_EXPORT_COMPLETED: h(`完成日账导出任务`),
    DAILY_EXPORT_FAILED: h(`日账导出任务失败`),
    DAILY_EXPORT_CANCELLED: h(`取消日账导出任务`),
    DAILY_EXPORT_DOWNLOADED: h(`下载日账导出文件`),
    CC_API_CALL: h(`CCMAX 接口调用`),
    CCMAX_SYNC_SETTINGS_UPDATED: h(`调整 CCMAX 查询并发设置`),
    CCMAX_DAILY_CONFIRMED: h(`历史确认 CCMAX 日账`),
    CCMAX_DAILY_POSTED: h(`自动入账 CCMAX 日账`),
    CCMAX_DAILY_UPDATED: h(`自动更新 CCMAX 日账`),
    CCMAX_DAILY_OBSERVE: h(`采集 CCMAX 日账观测`),
    CCMAX_DAILY_PREVIEW: h(`预览 CCMAX 日账`),
    LOGIN: h(`登录系统`),
    LOGOUT: h(`退出登录`),
    SETTLEMENT_CREATE: h(`生成结算单`),
    SETTLEMENT_BATCH_START: h(`批量生成结算单`),
    SETTLEMENT_ADJUST: h(`人工调整结算金额`),
    SETTLEMENT_CONFIRM: h(`确认结算`),
    SETTLEMENT_REJECT: h(`退回结算`),
    SETTLEMENT_EXPORT: h(`导出结算明细`),
    SETTLEMENT_BATCH_EXPORT: h(`批量导出结算单`),
    PAYMENT_METHOD_SELECTED: h(`选择付款方式`),
    PAYMENT_CREATE: h(`申请付款`),
    PAYMENT_APPROVE: h(`付款申请审核通过`),
    PAYMENT_MANUAL_RECORD: h(`登记付款结果`),
    EXCHANGE_RATE_CREATE: h(`发布汇率版本`),
    EXCHANGE_RATE_ENABLE: h(`重新发布汇率版本`),
    EXCHANGE_RATE_DISABLE: h(`停用汇率版本`),
    SUPPLIER_CREATE: h(`创建供应商`),
    SUPPLIER_APPROVE: h(`供应商资质审核通过`),
    SUPPLIER_CHANGE_SUBMIT: h(`提交资料变更`),
    ACCOUNT_APPROVE: h(`收款账户审核通过`),
    ACCOUNT_REVEAL: h(`查看完整收款账号`),
    QUOTE_AUTO_RENEWED: h(`报价自动续期`),
    QUOTE_SUBMIT: h(`提交报价`),
    QUOTE_UPDATE: h(`修改报价`),
    QUOTE_PERIOD_CHANGE_REQUESTED: h(`申请报价调整`),
    QUOTE_PERIOD_CHANGE_APPROVED: h(`报价调整审核通过`),
    QUOTE_PERIOD_CHANGE_REJECTED: h(`报价调整审核退回`),
    QUOTE_APPROVE: h(`报价审核通过`),
    USER_ACCESS_CHANGE: h(`调整账号权限`),
    USER_ENABLED_CHANGE: h(`调整账号启用状态`),
    ACCOUNT_API_TOKEN_CREATED: h(`创建账号 API 密钥`),
    ACCOUNT_API_TOKEN_RESET: h(`重置账号 API 密钥`),
    ACCOUNT_API_TOKEN_REVEALED: h(`查看账号 API 密钥明文`),
    ACCOUNT_API_TOKEN_REVOKED: h(`撤销账号 API 密钥`),
    ROLE_UPDATE: h(`修改角色权限`),
    USAGE_IMPORT: h(`导入结算数据`),
    DOCUMENT_UPLOAD: h(`上传附件`),
    DOCUMENT_DOWNLOAD: h(`下载附件`),
    PASSWORD_RESET: h(`重置账号密码`),
    USER_FORCE_LOGOUT: h(`强制登出账号`),
    TURNOVER_RECORD: h(`登记每日营业额`),
    PASSWORD_CHANGE: h(`修改本人密码`),
    SECURITY_SETTINGS_UPDATE: h(`修改系统参数`),
    SUPPLIER_USER_LINK: h(`关联供应商用户`),
    SUPPLIER_USER_CREATE: h(`创建供应商用户`),
    PROJECT_CREATE: h(`创建项目`),
    PROJECT_UPDATE: h(`维护项目`),
    PROJECT_CATEGORY_CREATE: h(`创建项目分类`),
    PROJECT_CATEGORY_UPDATE: h(`修改项目分类`),
    PROJECT_CATEGORY_DELETE: h(`删除项目分类`),
    RESOURCE_PROXY_REPLACEMENT_CREATED: h(`发起代理更换`),
    RESOURCE_PROXY_REPLACEMENT_APPLIED: h(`确认代理换绑`),
    OUTBOUND_PROXY_CREATED: h(`创建代理配置`),
    OUTBOUND_PROXY_UPDATED: h(`修改代理配置`),
    OUTBOUND_PROXY_TESTED: h(`检测代理连接`),
    RESOURCE_DRAFT_CREATED: h(`创建资源草稿`),
    RESOURCE_DRAFT_UPDATED: h(`修改资源草稿`),
    RESOURCE_DRAFT_DELETED: h(`删除资源草稿`),
    RESOURCE_OAUTH_AUTHORIZED: h(`创建资源授权会话`),
    TARGET_OAUTH_STARTED: h(`发起目标授权`),
    TARGET_OAUTH_SUBMITTED: h(`提交目标授权码`),
    TARGET_OAUTH_COMPLETED: h(`完成目标授权`),
    RESOURCE_DELIVERED: h(`接收资源交付`),
    RESOURCE_STATUS_SYNCED: h(`手动同步资源状态`),
    RESOURCE_USAGE_SYNCED: h(`手动同步资源状态与消耗`),
    RESOURCE_STATUS_PROJECTION_REBUILT: h(`重建资源状态投影`),
    SUPPLIER_OAUTH_PREPARED: h(`准备供应商交付授权`),
    SUPPLIER_SUBMISSION_CANCELLED: h(`取消供应商交付`),
    RESOURCE_CREATION_RECONCILED: h(`人工核对交付失败`),
    RESOURCE_DELIVERY_REOPENED: h(`恢复授权失败的交付草稿`),
    RESOURCE_COVERED_BY_LANE: h(`按 Lane 覆盖同供应商资源`),
    RESOURCE_LANE_SUPPLY_REJECTED: h(`拒绝重复供应的 Lane`),
    RESOURCE_CREDENTIAL_REFRESH_STARTED: h(`发起强制刷新授权`),
    RESOURCE_CREDENTIAL_REFRESH_UPDATED: h(`更新强制刷新授权进度`),
    RESOURCE_REAUTHORIZATION_STARTED: h(`发起已有账号重新授权`),
    RESOURCE_REAUTHORIZATION_UPDATED: h(`更新已有账号授权进度`),
    RESOURCE_DISPATCH_STARTED: h(`发起资源分发`),
    RESOURCE_DISPATCH_FINISHED: h(`记录资源分发结果`),
    RESOURCE_TARGET_CREATED: h(`创建分发目标`),
    RESOURCE_TARGET_UPDATED: h(`修改分发目标`),
    SCHEDULED_TASK_CREATED: h(`创建定时任务`),
    SCHEDULED_TASK_UPDATED: h(`修改定时任务`),
    SCHEDULED_TASK_TOGGLE: h(`切换定时任务状态`),
    SCHEDULED_TASK_SCHEDULE_UPDATED: h(`调整定时任务执行周期`),
    WORKBENCH_WECOM_SETTINGS_UPDATED: h(`修改工作台企微提醒设置`),
    PERSONAL_PROFILE_UPDATED: h(`修改个人资料`),
    SELF_REGISTER: h(`注册账号`),
    SUPPLIER_CODE_CHANGE: h(`修改供应商编码`),
    SUPPLIER_AGENT_CREATED: h(`创建供应商团队账号`),
    SUPPLIER_AGENT_ACCESS_CHANGED: h(`调整团队账号权限`),
    SUPPLIER_AGENT_PASSWORD_RESET: h(`重置团队账号密码`),
    SETTLEMENT_INPUT_MANUAL: h(`手工录入结算来源`),
    SETTLEMENT_INPUT_RECEIVE: h(`接收结算来源`),
    SETTLEMENT_INPUT_VOID: h(`作废结算来源`),
    SETTLEMENT_WITHDRAW: h(`撤回结算单`),
    SETTLEMENT_VOID: h(`作废结算单`),
    PAYOUT_PROVIDER_SAVE: h(`保存付款服务配置`),
    PAYOUT_REQUESTED: h(`发起付款请求`),
    BILLING_DATA_IMPORT: h(`录入计费数据`),
    SYSTEM_NOTICE_DRAFT_CREATE: h(`新建通知草稿`),
    SYSTEM_NOTICE_DRAFT_UPDATE: h(`修改通知草稿`),
    SYSTEM_NOTICE_PUBLISH: h(`发布系统通知`),
    SYSTEM_NOTICE_REVOKE: h(`撤回系统通知`),
    RECEIPT_CONFIRMED: h(`确认收款`),
    RECEIPT_DISPUTED: h(`提出收款异议`)
  },
  E = {
    RESOURCE_OAUTH_AUTHORIZED: h(`会话已创建`),
    TARGET_OAUTH_STARTED: h(`已发起`),
    TARGET_OAUTH_SUBMITTED: h(`已提交`),
    TARGET_OAUTH_COMPLETED: h(`授权完成`),
    RESOURCE_DISPATCH_STARTED: h(`已发起`),
    RESOURCE_DELIVERED: h(`本地已交付`)
  },
  D = {
    SUPPLIER: h(`供应商`),
    SETTINGS: h(`系统参数`),
    ACCOUNT_API_TOKEN: h(`账号 API 密钥`),
    DAILY_EXPORT: h(`日账导出任务`),
    SUPPLIER_TEAM_GROUP: h(`团队分组`),
    RESOURCE_INTAKE_RECEIPT: h(`资源接入回执`),
    INTAKE_RESOURCE: h(`上报资源`),
    RESOURCE_STATUS_PROJECTION: h(`资源状态投影`),
    CC_OAUTH_SESSION: h(`资源授权会话`),
    PROXY_REPLACEMENT: h(`代理更换任务`),
    SCHEDULED_TASK: h(`定时任务`),
    MONITORING_SOURCE: h(`工作台监控配置`),
    MONITORING_CATEGORY: h(`参考数据品类`),
    CC_RESOURCE: h(`资源`),
    CC_DISPATCH: h(`分发记录`),
    CC_INTAKE_CONFIG: h(`CC上号配置`),
    CC_PRIORITY_JOB: h(`优先级调整任务`),
    CC_PRIORITY_ITEM: h(`优先级调整明细`),
    CC_TARGET: h(`CCMAX 目标`),
    SECURITY: h(`安全记录`)
  };

function O(e, t) {
  return Object.hasOwn(e, t) ? e[t] : void 0
}

function k(e) {
  try {
    let t = JSON.parse(e || `{}`);
    return typeof t == `object` && t && !Array.isArray(t) ? t : {}
  } catch {
    return {}
  }
}
var A = {
    sessionIdleMinutes: h(`空闲有效期（分钟）`),
    sessionAbsoluteMinutes: h(`绝对有效期（分钟）`),
    passwordMinLength: h(`密码最短长度`),
    passwordMaxLength: h(`密码最长长度`),
    requireUpper: h(`要求大写字母`),
    requireLower: h(`要求小写字母`),
    requireDigit: h(`要求数字`),
    requireSymbol: h(`要求特殊字符`),
    initialPasswordLength: h(`初始密码总长度`),
    initialPasswordFormat: h(`初始密码格式`),
    initialPasswordPrefix: h(`初始密码前缀`),
    forceInitialChange: h(`首次登录强制改密`),
    loginMaxFailures: h(`登录失败次数上限`),
    loginLockMinutes: h(`登录锁定时长（分钟）`),
    allowSamePersonReview: h(`允许同一账号审核`),
    supplierRegistrationApprovalEnabled: h(`供应商注册需要审核`),
    quoteMultiplierMin: h(`报价倍率下限`),
    quoteMultiplierMax: h(`报价倍率上限`)
  },
  j = {
    forceStopCcmaxIntake: h(`强制停止 CCMAX 新增上号`),
    ccmaxIntakeConcurrencyLimit: h(`每供应商同时上号数`),
    ccmaxCreationTimeoutSeconds: h(`上号单次超时（秒）`),
    allowAllSuppliersPro: h(`全部供应商允许 PRO 上号`),
    allowAllSuppliersCcmax: h(`全部供应商允许 CCMAX 上号`),
    allowAllSuppliersCcmaxReauthorization: h(`全部供应商允许 CCMAX 重新授权`)
  },
  M = {
    defaultProxyMaxResources: h(`新代理默认绑定数量`),
    allowPro: h(`允许 PRO 上号`),
    allowCcmax: h(`允许该供应商 CCMAX 上号`),
    allowCcmaxReauthorization: h(`允许该供应商 CCMAX 重新授权`),
    allowCcmaxPause: h(`允许该供应商暂停资源`),
    allowCcmaxSafeRemoval: h(`允许该供应商移除资源`)
  },
  N = {
    name: h(`供应商名称`),
    supplierType: h(`主体类型`),
    contact: h(`联系人`),
    email: h(`邮箱`),
    phone: h(`电话`),
    country: h(`国家或地区`),
    cycle: h(`结算周期`),
    customCycleDays: h(`自定义结算天数`)
  };

function P(e) {
  return typeof e == `object` && e && !Array.isArray(e) ? e : {}
}

function F(e) {
  let t = k(e.beforeJson),
    n = k(e.afterJson),
    r = (e, t, n) => Object.entries(e).filter(([e]) => Object.hasOwn(t, e) || Object.hasOwn(n, e)).map(([e, r]) => ({
      id: e,
      field: r,
      before: t[e],
      after: n[e]
    })).filter(e => e.before !== e.after);
  return e.action === `SECURITY_SETTINGS_UPDATE` ? [...r(A, P(t.policy), P(n.policy)), ...r(j, t, n)] : e.action === `SUPPLIER_SETTINGS_UPDATED` ? r(M, t, n) : e.action === `SUPPLIER_CHANGE_SUBMIT` ? r(N, t, P(n.requestedProfile)) : []
}

function I(e) {
  return e === void 0 ? h(`未记录`) : e === null ? h(`未设置`) : e === `` ? h(`空值`) : typeof e == `boolean` ? h(e ? `是` : `否`) : typeof e == `object` ? JSON.stringify(e) : String(e)
}

function L(e) {
  if (e.action === `RESOURCE_OAUTH_AUTHORIZED`) return h(`已生成授权链接，等待提交授权码`);
  if (e.action === `TARGET_OAUTH_SUBMITTED`) return h(`授权码已提交，等待目标创建结果`);
  if (e.action === `RESOURCE_DISPATCH_STARTED`) return h(`已发起目标创建，结果待确认`);
  if (e.action === `RESOURCE_DELIVERED`) return h(`资源已在平台接收`);
  if (e.action === `RESOURCE_DELIVERY_REOPENED`) return k(e.afterJson).reason === `OAUTH_INVALID_CODE` ? h(`确认授权码无效，恢复草稿以便重新授权`) : h(`确认目标拒绝创建，恢复草稿以便重新授权`);
  if (e.action === `RESOURCE_DISPATCH_FINISHED`) {
    let t = k(e.afterJson).state;
    return h(t === `SUCCESS` ? `目标创建成功` : t === `FAILED` ? `目标明确拒绝创建` : `目标结果待人工核对`)
  }
  if (e.action === `CC_API_CALL`) {
    let t = k(e.beforeJson),
      n = k(e.afterJson),
      r = n.body,
      i = r && typeof r == `object` && !Array.isArray(r) ? r.error : null,
      a = i && typeof i == `object` && !Array.isArray(i) ? i.message : null;
    if (n.httpStatus === 400 && typeof a == `string` && a.includes(`authorization code state does not match this sign-in link`)) return h(`授权码与本次登录链接不匹配，CCMAX 拒绝创建资源`);
    let o = w(n.httpStatus, r, n.ccmaxFailureHint);
    return o ? h(`{0}（HTTP {1}）`, [o, n.httpStatus]) : typeof n.httpStatus == `number` && n.httpStatus >= 400 ? h(`CCMAX 接口拒绝请求（HTTP {0}）`, [n.httpStatus]) : n.callOutcome === `NETWORK_ERROR` ? h(`请求未收到目标响应，结果待核对`) : t.path === `/v1/lanes` ? h(`向 CCMAX 创建资源`) : t.path === `/v1/lanes/query` ? h(`查询 CCMAX 状态与费用`) : t.path === `/v1/lanes/oauth/authorize` ? h(`生成 CCMAX 授权链接`) : h(`调用 CCMAX 接口`)
  }
  return e.outcome === `SUCCESS` ? h(`操作已记录`) : h(`操作未成功`)
}

function R(e) {
  if (e.action === `CC_API_CALL`) {
    let t = k(e.afterJson);
    return t?.httpStatus ? `HTTP ${t.httpStatus}` : t?.callOutcome === `NETWORK_ERROR` ? h(`未收到响应`) : void 0
  }
  if (e.outcome === `SUCCESS`) {
    if (e.action === `RESOURCE_DISPATCH_FINISHED`) {
      let t = k(e.afterJson).state;
      return h(t === `SUCCESS` ? `分发成功` : t === `FAILED` ? `分发失败` : t === `UNKNOWN` ? `结果待核对` : `已记录`)
    }
    return O(E, e.action)
  }
}

function z(e) {
  return e.action === `RESOURCE_DISPATCH_FINISHED` && k(e.afterJson).state === `FAILED` ? `FAILURE` : e.outcome
}
var B = i();

function V() {
  let [i, a] = (0, C.useState)(``), [b, w] = (0, C.useState)(``), [E, A] = (0, C.useState)(``), [j, M] = (0, C.useState)(``), [N, P] = (0, C.useState)(f), [V, H] = (0, C.useState)(f), [U, W] = (0, C.useState)(1), [G, K] = (0, C.useState)(10), [q, J] = (0, C.useState)(null), Y = r(q ? `/system/audits/${encodeURIComponent(q.id)}` : null), X = Y.data && !Y.loading && !Y.error ? F(Y.data) : [], {
    refresh: ee
  } = e(), [te, ne] = (0, C.useState)(0), Z = r(`/system/audit-actions?retry=${te}`), re = Array.from(new Set([...Object.keys(T), ...(Z.data || []).filter(e => typeof e == `string` && e.trim()), ...b ? [b] : []])).sort((e, t) => (O(T, e) || e).localeCompare(O(T, t) || t, _())), Q = new URLSearchParams({
    search: i,
    action: b,
    actor: E,
    outcome: j,
    page: String(U),
    size: String(G)
  });
  N && Q.set(`from`, N), V && Q.set(`to`, V);
  let $ = r(`/system/audits?summaryOnly=true&${Q.toString()}`);
  return (0, B.jsxs)(B.Fragment, {
    children: [(0, B.jsx)(m, {
      title: h(`审计日志`),
      subtitle: h(`记录关键操作及接口调用。已发起、已提交和本地已交付均不代表目标分发成功，最终状态请查看资源详情。`)
    }), (0, B.jsxs)(`section`, {
      className: `panel`,
      children: [(0, B.jsxs)(l, {
        className: `audit-toolbar`,
        actions: (0, B.jsx)(v, {
          icon: `refresh`,
          "aria-label": h(`刷新审计日志`),
          onClick: ee
        }),
        children: [(0, B.jsx)(x, {
          value: i,
          onChange: e => {
            a(e), W(1)
          },
          placeholder: h(`目标编号或操作代码`)
        }), (0, B.jsx)(y, {
          compact: !0,
          ariaLabel: h(`操作内容`),
          searchPlaceholder: h(`搜索操作内容或代码`),
          value: b,
          onChange: e => {
            w(e), W(1)
          },
          options: [{
            value: ``,
            label: h(`全部操作内容`),
            shortLabel: h(`操作内容`)
          }, ...re.map(e => ({
            value: e,
            label: O(T, e) || e,
            detail: e
          }))]
        }), (0, B.jsx)(x, {
          value: E,
          onChange: e => {
            A(e), W(1)
          },
          placeholder: h(`操作人`)
        }), (0, B.jsx)(y, {
          compact: !0,
          ariaLabel: h(`操作结果`),
          value: j,
          onChange: e => {
            M(e), W(1)
          },
          options: [{
            value: ``,
            label: h(`全部结果`)
          }, {
            value: `SUCCESS`,
            label: h(`成功`)
          }, {
            value: `FAILURE`,
            label: h(`失败`)
          }, {
            value: `DENIED`,
            label: h(`已拦截`)
          }]
        }), (0, B.jsx)(S, {
          label: h(`操作日期`),
          from: N,
          to: V,
          onChange: (e, t) => {
            P(e), H(t), W(1)
          }
        }), (i || b || E || j || N || V) && (0, B.jsx)(`button`, {
          className: `text-button muted`,
          type: `button`,
          onClick: () => {
            a(``), w(``), A(``), M(``), P(``), H(``), W(1)
          },
          children: h(`清除筛选 `)
        })]
      }), Z.error && (0, B.jsxs)(u, {
        tone: `amber`,
        children: [h(`操作内容加载失败：`), Z.error, h(`。已有操作仍可筛选。 `), (0, B.jsx)(`button`, {
          className: `text-button`,
          onClick: () => ne(e => e + 1),
          children: h(`重试加载操作内容 `)
        })]
      }), (0, B.jsx)(c, {
        data: $.data?.items || [],
        loading: $.loading,
        error: $.error,
        onRow: J,
        columns: [{
          label: h(`操作人`),
          render: (e, t) => (0, B.jsxs)(`div`, {
            className: `identity`,
            children: [(0, B.jsx)(s, {
              name: e.actorName,
              index: t,
              size: `small`
            }), (0, B.jsx)(`strong`, {
              children: e.actorName
            })]
          })
        }, {
          label: h(`操作内容`),
          render: e => (0, B.jsxs)(`div`, {
            className: `stack`,
            children: [(0, B.jsx)(`strong`, {
              children: O(T, e.action) || e.action
            }), (0, B.jsx)(`small`, {
              children: L(e)
            })]
          })
        }, {
          label: h(`操作对象`),
          render: e => (0, B.jsxs)(`span`, {
            children: [O(D, e.targetType) || h(`操作对象`), ` ·`, ` `, (0, B.jsx)(`code`, {
              className: `audit-target`,
              children: e.targetId
            })]
          })
        }, {
          label: h(`结果`),
          render: e => (0, B.jsx)(g, {
            state: z(e),
            label: R(e)
          })
        }, {
          label: h(`时间`),
          render: e => (0, B.jsx)(`span`, {
            className: `mono subtle`,
            children: n(e.createdAt)
          })
        }, {
          label: h(`操作`),
          render: e => (0, B.jsx)(`button`, {
            className: `text-button`,
            onClick: () => J(e),
            children: h(`详情 `)
          })
        }]
      }), (0, B.jsx)(o, {
        data: $.data,
        page: U,
        onPage: W,
        size: G,
        onSizeChange: e => {
          K(e), W(1)
        }
      })]
    }), q && (0, B.jsxs)(t, {
      drawer: !0,
      title: O(T, q.action) || q.action,
      subtitle: L(q),
      onClose: () => J(null),
      children: [(0, B.jsx)(p, {
        items: [
          [h(`操作人`), q.actorName],
          [h(`操作结果`), (0, B.jsx)(g, {
            state: z(q),
            label: R(q)
          })],
          [h(`操作说明`), L(q)],
          [h(`对象类型`), O(D, q.targetType) || q.targetType],
          [h(`资源编号`), q.targetId],
          [h(`来源 IP`), q.ip],
          [h(`操作时间`), n(q.createdAt)],
          [h(`请求追踪 ID`), (0, B.jsx)(`code`, {
            className: `wrap-code`,
            children: q.traceId
          })],
          [h(`事件代码`), q.action]
        ]
      }), Y.loading ? (0, B.jsx)(d, {}) : Y.error ? (0, B.jsxs)(u, {
        tone: `red`,
        children: [h(`详情加载失败：`), Y.error]
      }) : Y.data ? (0, B.jsxs)(B.Fragment, {
        children: [X.length > 0 && (0, B.jsxs)(`section`, {
          className: `subsection`,
          children: [(0, B.jsx)(`h3`, {
            children: h(`变更内容`)
          }), (0, B.jsx)(c, {
            data: X,
            columns: [{
              label: h(`字段`),
              render: e => e.field
            }, {
              label: h(`修改前`),
              render: e => (0, B.jsx)(`span`, {
                className: `audit-change-value`,
                children: I(e.before)
              })
            }, {
              label: h(`修改后`),
              render: e => (0, B.jsx)(`span`, {
                className: `audit-change-value`,
                children: I(e.after)
              })
            }]
          })]
        }), (0, B.jsxs)(`details`, {
          className: `subsection`,
          children: [(0, B.jsx)(`summary`, {
            children: q.action === `CC_API_CALL` ? h(`查看原始请求与响应（技术字段）`) : h(`查看完整变更快照`)
          }), q.action === `CC_API_CALL` && !Y.data.originalBodiesAvailable && (0, B.jsx)(u, {
            children: h(`此历史记录未保留原始报文，以下为当时保存的内容。`)
          }), (0, B.jsx)(`h3`, {
            children: q.action === `CC_API_CALL` ? h(`请求`) : h(`变更前`)
          }), (0, B.jsx)(`pre`, {
            className: `audit-json`,
            children: Y.data.originalBodiesAvailable ? Y.data.originalRequestBody ?? h(`无请求体`) : JSON.stringify(k(Y.data.beforeJson), null, 2)
          }), (0, B.jsx)(`h3`, {
            children: q.action === `CC_API_CALL` ? h(`响应`) : h(`变更后`)
          }), (0, B.jsx)(`pre`, {
            className: `audit-json after`,
            children: Y.data.originalBodiesAvailable ? Y.data.originalResponseBody ?? h(`未收到响应体`) : JSON.stringify(k(Y.data.afterJson), null, 2)
          })]
        })]
      }) : null]
    })]
  })
}
export {
  V as Audits
};