import { ReactShim, jsxRuntime, createPortal } from "../runtime/vue-compat.js";
import { Toast } from "../runtime/toast.js";
// origin: assets/index-Dnr0i-H9.js
const __vite__mapDeps = (i, m = __vite__mapDeps, d = (m.f || (m.f = ["assets/OperatorKpi-NouSWERW.js", "assets/OwnerSection-BV_jBT2b.js", "assets/OutboundProxies-BILxGplZ.js", "assets/QueryFilters-CwGBc_NH.js", "assets/Projects-BlZGF-3J.js", "assets/systemLabels-DqpNuQ-_.js", "assets/Quotes-BL6CyQ42.js", "assets/DateRangePicker-DtOG4QUZ.js", "assets/projectOptions-RFlNxqPH.js", "assets/quoteHelpers-Fmn-ErWD.js", "assets/Reports-ChHNVTLt.js", "assets/CcmaxResourceAnalysis-DJRiAnAd.js", "assets/CcmaxResourceAnalysis-BcXKi-LX.css", "assets/Resources-CXo1DF00.js", "assets/CcmaxResourceOverview-BpVmtOxH.js", "assets/MoneyDisplay-Bphc56N8.js", "assets/resourceHelpers-DoyalwRL.js", "assets/Resources-CMSdJ6EA.css", "assets/ScheduledTaskRuns-DXdXtjvS.js", "assets/ScheduledTasks-DQG4VARN.js", "assets/SupplierAccounts-CMP57Xp2.js", "assets/SupplierAgents-GOZSRGGY.js", "assets/SupplierAgents-CDsbewjG.css", "assets/Suppliers-BquEthXG.js", "assets/AccountDialogs-DkF7YQod.js", "assets/SystemNotices-BwbR9un8.js", "assets/SystemNotices-Bi3Ra51o.css", "assets/Workbench-CVusO4pD.js", "assets/Workbench-CUVm9rHy.css", "assets/ApiDocs-BOQ6E5CN.js", "assets/ApiDocs-DpVANaVB.css"]))) => i.map(i => d[i]);
var e = Object.create,
  t = Object.defineProperty,
  n = Object.getOwnPropertyDescriptor,
  r = Object.getOwnPropertyNames,
  i = Object.getPrototypeOf,
  a = Object.prototype.hasOwnProperty,
  o = (e, t) => () => (t || (e((t = {
    exports: {}
  }).exports, t), e = null), t.exports),
  s = (e, n) => {
    let r = {};
    for (var i in e) t(r, i, {
      get: e[i],
      enumerable: !0
    });
    return n || t(r, Symbol.toStringTag, {
      value: `Module`
    }), r
  },
  c = (e, i, o, s) => {
    if (i && typeof i == `object` || typeof i == `function`)
      for (var c = r(i), l = 0, u = c.length, d; l < u; l++) d = c[l], !a.call(e, d) && d !== o && t(e, d, {
        get: (e => i[e]).bind(null, d),
        enumerable: !(s = n(i, d)) || s.enumerable
      });
    return e
  },
  l = (n, r, o) => (o = n == null ? {} : e(i(n)), c(r || !n || !n.__esModule || !a.call(n, `default`) ? t(o, `default`, {
    value: n,
    enumerable: !0
  }) : o, n));
(function() {
  let e = document.createElement(`link`).relList;
  if (e && e.supports && e.supports(`modulepreload`)) return;
  for (let e of document.querySelectorAll(`link[rel="modulepreload"]`)) n(e);
  new MutationObserver(e => {
    for (let t of e)
      if (t.type === `childList`)
        for (let e of t.addedNodes) e.tagName === `LINK` && e.rel === `modulepreload` && n(e)
  }).observe(document, {
    childList: !0,
    subtree: !0
  });

  function t(e) {
    let t = {};
    return e.integrity && (t.integrity = e.integrity), e.referrerPolicy && (t.referrerPolicy = e.referrerPolicy), t.credentials = e.crossOrigin === `use-credentials` ? `include` : e.crossOrigin === `anonymous` ? `omit` : `same-origin`, t
  }

  function n(e) {
    if (e.ep) return;
    e.ep = !0;
    let n = t(e);
    fetch(e.href, n)
  }
})();
var u = {
    "查看完整金额：{0} {1}": `View exact amount: {0} {1}`,
    完整原值: `Exact value`,
    付款安排: `Payment arrangements`,
    手续费: `Fees`,
    收款与汇率: `Recipient and exchange rate`,
    关联对象与录入方式: `Supplier, project and entry method`,
    款项信息: `Entry information`,
    所属期间与金额: `Period and amount`,
    资源信息: `Resource information`,
    "项目 / 创建人": `Project / Creator`,
    "创建人：{0}": `Created by: {0}`,
    "交付 / 资源状态": `Delivery / Resource status`,
    "额度 / 使用情况": `Quota / Usage`,
    结算对象: `Settlement parties`,
    结算金额: `Settlement amount`,
    "搜索{0}": `Search {0}`,
    执行日期: `Execution date`,
    不限日期: `All dates`,
    移除: `Remove`,
    创建执行配置不存在: `The account creation configuration no longer exists.`,
    "当前供应商同时上号数已达上限（": `This supplier has reached the simultaneous account creation limit (`,
    "个），请稍后重试": ` accounts). Please try again later.`,
    折: `%`,
    " / 个": ` / unit`,
    "当前额度来源的非PRO每日数量已满，请次日再试或联系供应商管理员。": `The daily non-PRO allowance for this quota source is exhausted. Try again tomorrow or contact your supplier administrator.`,
    当日: `Today`,
    近7天: `Last 7 days`,
    近30天: `Last 30 days`,
    本月: `This month`,
    快捷日期: `Date shortcuts`,
    "同时控制 OAuth、手动凭据和强制刷新授权；关闭后仍可查询已有操作。": `Controls OAuth, manual credentials, and forced credential refresh. Existing operation results remain available when disabled.`,
    "CCMAX 重新授权": `CCMAX reauthorization`,
    "全部供应商允许 CCMAX 重新授权": `Allow CCMAX reauthorization for all suppliers`,
    "允许该供应商 CCMAX 重新授权": `Allow CCMAX reauthorization for this supplier`,
    "独立于新增上号；全局关闭后按各供应商的重新授权开关判断。": `Independent of new account creation. When the global switch is off, each supplier's reauthorization setting applies.`,
    "关闭后仍可查询已有操作的结果，不再生成新链接或提交新凭据。": `Existing operation results remain available. New authorization links and credential submissions are blocked.`,
    "当前全局已开启，所有供应商均可 CCMAX 重新授权。": `CCMAX reauthorization is currently enabled for all suppliers.`,
    "当前供应商未开通 CCMAX 重新授权，请联系平台管理员。": `CCMAX reauthorization is disabled for this supplier. Contact your platform administrator.`,
    欢迎回到: `Welcome to`,
    让每一个想法: `Every idea.`,
    流向: `Unlock `,
    无限可能: `possibilities`,
    "连接前沿 AI 与你的创造力。": `Connect your creativity with AI.`,
    "在 Hispread，让下一次突破从此刻开始。": `Your next breakthrough starts at Hispread.`,
    "我是客户，前往官网": `I'm a customer · Visit our website`,
    确认作废: `Confirm void`,
    标记已读: `Mark as read`,
    已标记为已读: `Marked as read`,
    "已读表示该账号已点击“标记已读”、打开消息或执行“全部已读”。查看人员明细不会改变阅读状态。": `Read means the account marked the notice as read, opened the message, or marked all messages as read. Viewing recipients does not change read status.`,
    级联收回团队成员项目权限: `Revoke delegated team member project access`,
    "当前无法付款，请稍后重试": `Payment is unavailable. Please try again later.`,
    可以付款: `Ready to pay`,
    预检结果: `Preflight result`,
    查看付款状态: `View payment status`,
    刷新付款状态: `Refresh payment status`,
    付款待核实: `Payment awaiting verification`,
    付款成功: `Payment successful`,
    "每笔付款只显示一条，状态随查单结果更新。": `Each payment appears once. Its status updates as results are checked.`,
    "下载汇总 PDF": `Download summary PDF`,
    可结算总金额: `Total eligible amount`,
    "供应商明细（{0} 家）": `Supplier details ({0} suppliers)`,
    供应商结算汇总: `Supplier settlement summary`,
    "{0} 笔来源": `{0} source entries`,
    资源编号缺失: `Resource number unavailable`,
    "原额 {0} · {1}": `Original {0} · {1}`,
    "{0} 个 · 单价 {1} {2}": `{0} units · Unit price {1} {2}`,
    "至 {0}": `To {0}`,
    "{0} 笔日账汇总": `{0} daily entries combined`,
    "资源编号 / 款项": `Resource number / Entry`,
    按资源汇总的结算明细: `Settlement details grouped by resource`,
    "供应商确认截止时间（北京时间）：{0}": `Supplier confirmation deadline (Beijing time): {0}`,
    "导出汇总 PDF": `Export summary PDF`,
    "需处理项（{0} 张，不计入合计）": `Items requiring attention ({0} documents, excluded from totals)`,
    "结算单明细（{0} 张）": `Settlement details ({0} documents)`,
    "该期间有 {0} 天存在采集异常，本汇总仅包含已拉取的日账。": `Collection issues affected {0} days in this period. This summary includes only collected daily bills.`,
    "不同币种分别汇总，需处理项不计入合计。": `Currencies are totaled separately. Items requiring attention are excluded.`,
    金额汇总: `Amount summary`,
    "批次编号：{0}": `Batch ID: {0}`,
    "结算期间：{0} 至 {1}": `Settlement period: {0} to {1}`,
    "在打印窗口中选择“另存为 PDF”即可保存。": `Choose “Save as PDF” in the print dialog.`,
    "打印 / 保存 PDF": `Print / Save PDF`,
    结算单汇总: `Settlement summary`,
    "请允许弹出窗口后重试导出 PDF": `Allow pop-up windows and retry the PDF export`,
    请等待结算单核算完成后导出: `Wait for settlement calculation to finish before exporting`,
    "搜索资源名称、账号或 Lane ID": `Search resource name, account or Lane ID`,
    "供应商目录已变化，请刷新重试": `The supplier catalog changed. Refresh and try again.`,
    "复制 Lane ID": `Copy Lane ID`,
    "\n[查看工作台](": `
 [View workbench](`,
    "\n导出行数：": `
 export row number:`,
    "\n待计价试算不代表已确认应付；当天数据未完结。\n筛选条件：": `
 The pending price trial calculation does not mean that the payment has been confirmed; the data for the day has not been completed. 
 filter criteria:`,
    "\n来源条数：": `
 source number:`,
    " / 个 ": ` /piece `,
    " / 共 ": ` / total `,
    " /个": ` /piece`,
    " USDT，与已审批付款不一致，请重新申请": ` USDT, inconsistent with the approved payment, please apply again`,
    " · {0} 张需处理": ` · {0} need attention`,
    " · {0} 笔到账争议": ` · {0} payment dispute`,
    " · 同币种": ` · Same currency`,
    " · 大写字母": ` · Capital letters`,
    " · 小写字母": ` · Lowercase letters`,
    " · 尾号": ` ·Tail number`,
    " · 当前参考 V{0}": ` · Current reference V{0}`,
    " · 数字": ` · Digital`,
    " · 有任务正在生成": ` · A batch is being generated`,
    " · 服务账号：": ` · Service account:`,
    " · 符号": ` · Symbol`,
    " · 请求 ": ` · Request `,
    " → CNY 当前参考汇率": ` → CNY current reference exchange rate`,
    " 个": ` item`,
    " 个 Key ": ` Key `,
    " 个 lane 缺失。 ": ` lanes are missing. `,
    " 个 lane，": ` lane,`,
    " 个。 ": ` items. `,
    " 个任务 · 第 ": ` tasks · No. `,
    " 个密钥": ` keys`,
    " 个密钥 ": ` keys `,
    " 个归属冲突 lane（": ` ownership conflict lane (`,
    " 个窗口 ": ` windows `,
    " 个缺失 ": ` missing `,
    " 个资源 · 当日持续更新 ": ` resources · Continuously updated on the same day `,
    " 个预占": ` reserved`,
    " 个， 返回 ": ` , return `,
    " 个，缺失 ": ` , missing `,
    " 之间": ` (inclusive)`,
    " 位 ": ` characters `,
    " 位）": ` bit)`,
    " 倍": ` times`,
    " 出款 ": ` Withdrawal `,
    " 分钟": ` minutes`,
    " 前确认；逾期未提出异议将自动确认。": ` ; if no objection is raised within the time limit, it will be automatically confirmed.`,
    " 可用余额不足": ` Insufficient available balance`,
    " 家": ` suppliers`,
    " 家供应商": ` suppliers`,
    " 家供应商 ": ` suppliers `,
    " 已因超过确认截止时间且未收到异议而自动确认。": ` was confirmed automatically because the deadline passed without a dispute.`,
    " 已存在且内容或历史归属不同，请核对，不允许覆盖": ` already exists and the content or history ownership is different. Please check. Overwriting is not allowed.`,
    " 已结束 ": ` has ended `,
    " 年 ": ` year `,
    " 张 ": ` sheets `,
    " 张结算单 ": ` settlement documents `,
    " 张结算单需处理，其余单据 ": ` settlement documents need to be processed, and the remaining documents `,
    " 强制刷新 ": ` forced refresh `,
    " 必须为字符串或 null": ` must be a string or null`,
    " 必须为数值或 null": ` must be a numeric value or null`,
    " 批 · ": ` batch · `,
    " 批、全局": ` batch, global`,
    " 批。你的输入已保留，请核对后保存。 ": ` batch. Your input has been retained, please check and save. `,
    " 批失败，": ` batch failed,`,
    " 批成功， ": ` batch successfully, `,
    " 月 ": ` month `,
    " 条": ` records`,
    " 条 ": ` records `,
    " 条 / 页 ": ` items/page `,
    " 条代理": ` proxies`,
    " 条已入账": ` items have been recorded`,
    " 条待计价": ` items to be priced`,
    " 条未提供数据": ` No data provided`,
    " 条记录 ": ` records `,
    " 条记录 · ": ` records · `,
    " 条资源": ` resources`,
    " 条资源计入": ` resources are included in`,
    " 条资源）；未选择归属，未采集金额，缺失不能按零处理": ` resources); no ownership selected, no amount collected, missing items cannot be treated as zero`,
    " 条资源，共 ": ` resources, total `,
    " 条资源；当前账号仅可查看自己有权限的明细。": ` resources; the current account can only view the details for which it has permission.`,
    " 条跨日来源不属于单日日账，本次不纳入。 ": ` cross-day sources do not belong to single-day daily accounts and are not included this time. `,
    " 条，成功 ": ` items, successful `,
    " 生成新密码，并让该账号现有会话失效。": ` Generate a new password and invalidate existing sessions for this account.`,
    " 生效": ` takes effect`,
    " 的全部登录会话。对方需要重新登录。 ": ` . The other party needs to log in again. `,
    " 的最新应收金额为": ` is`,
    " 秒": ` seconds`,
    " 秒 · 调整周期 ": ` seconds·Adjustment period `,
    " 笔）": ` entries)`,
    " 等": ` etc.`,
    " 等 {0} 个模型": ` and other {0} models`,
    " 组 ": ` group `,
    " 至": ` to`,
    " 至 ": ` to `,
    " 行 ": ` OK `,
    " 行 / 共 ": ` rows / total `,
    " 行 ·": ` OK ·`,
    " 行 · ": ` OK · `,
    " 行应为 7 列": ` row should be 7 columns`,
    " 行日期或数值格式不正确": ` The row date or value format is incorrect`,
    " 行编辑中": ` Line editing`,
    " 行自动拆分，可打包下载。 ": ` lines are automatically split and can be packaged and downloaded. `,
    " 资金通道未启用": ` Fund channel is not enabled`,
    " 资金通道未配置": ` Fund channel is not configured`,
    " 起": ` From`,
    " 页 ": ` pages `,
    " 项": ` items`,
    " 项\n": ` item 
`,
    " 项 ": ` items `,
    " 项与既有资源资料冲突": ` item conflicts with existing resource data`,
    " 项任务暂不可启用": ` tasks cannot be activated at the moment`,
    " 项凭据与既有资源交叠，请核对": ` credentials overlap with existing resources, please check`,
    " 项权限 ": ` permissions `,
    " 项）": ` items)`,
    " 项，请核对": ` , please check`,
    "### Hispread AI 待办提醒\n": `### Hispread AI to-do reminder 
`,
    "0 表示不限；每条已交付资源占一个名额。": `0 means no limit; each delivered resource occupies one quota.`,
    "1 年": `1 year`,
    "2-30 位字母、数字、下划线或短横线；创建后仅运营可修改": `2-30 letters, numbers, underscores or dashes; only operations can be modified after creation`,
    "2-30 位字母、数字、下划线或短横线；已使用过的编码不能复用": `2-30 digits of letters, numbers, underscores or dashes; codes that have been used cannot be reused`,
    "2-40位字母、数字、下划线或短横线；创建后不可修改": `2-40 letters, numbers, underscores or dashes; cannot be modified after creation`,
    "30 天": `30 days`,
    "5 小时": `5 hours`,
    "5 小时已用百分比": `5 hours used percentage`,
    "5 小时用量": `5 hours dosage`,
    "5 小时采集时间": `5 hours collection time`,
    "5 小时重置时间": `5 hours reset time`,
    "5h 已满": `5h is full`,
    "7 天": `7 days`,
    "7 天 Fable 已用百分比": `7 days Fable used percentage`,
    "7 天 Fable 用量": `7-day Fable dosage`,
    "7 天 Fable 重置时间": `7 days Fable reset time`,
    "7 天已用百分比": `7 days used percentage`,
    "7 天用量": `7-day dosage`,
    "7 天采集时间": `7 days collection time`,
    "7 天重置时间": `7 days reset time`,
    "7d 已满": `7d is full`,
    "90 天": `90 days`,
    "API Key 仅授予读取和提币所需的最小权限，并绑定生产出口 IP。凭据加密保存，不回显明文。": `API Key only grants the minimum permissions required to read and withdraw coins, and is bound to the production export IP. Credentials are stored encrypted and plain text will not be displayed.`,
    "API Key，或 AccessKey|SecretKey|区域；多组凭据每行一组": `API Key, or AccessKey|SecretKey|area; multiple sets of credentials, one per line`,
    "API 地址": `API address`,
    "API 密钥": `API key`,
    "API 密钥 ": `API key `,
    "API 密钥列表": `API key list`,
    "API 密钥无效或已失效": `API key is invalid or expired`,
    "API 密钥校验不可用": `API key verification is not available`,
    "API 版本": `API version`,
    "APP_DATA_KEY 必须是 32 字节密钥的 Base64 编码": `APP_DATA_KEY must be Base64 encoding of a 32-byte key`,
    "Access Token到期时间不正确": `Access Token expiration time is incorrect`,
    "Access Token（可选）": `Access Token (optional)`,
    "Access Token（可选） ": `Access Token (optional) `,
    "Airwallex beneficiary ID / 收款地址 / UID": `Airwallex beneficiary ID / payment address / UID`,
    "Airwallex 付款币种不正确": `Airwallex payment currency is incorrect`,
    "Airwallex 原始状态 ": `Airwallex original condition `,
    "Airwallex 响应无法解析": `Airwallex response cannot be parsed`,
    "Airwallex 响应结构不正确": `Airwallex response structure is incorrect`,
    "Airwallex 实际手续费与已审批金额不一致，需要核对": `The actual handling fee of Airwallex is inconsistent with the approved amount and needs to be verified.`,
    "Airwallex 已响应但缺少转账 ID": `Airwallex responded but transfer ID is missing`,
    "Airwallex 暂未返回该转账记录": `Airwallex has not yet returned the transfer record.`,
    "Airwallex 空中云汇": `Airwallex`,
    "Airwallex 网络请求失败": `Airwallex network request failed`,
    "Airwallex 请求失败": `Airwallex request failed`,
    "Airwallex 资金账户 ": `Airwallex Fund Account `,
    "Airwallex 转账方式": `Airwallex transfer method`,
    "Airwallex 转账用途": `Airwallex transfer purpose`,
    "Airwallex 返回多条同幂等键转账，需要人工核对": `Airwallex returns multiple transfers with the same idempotent key and requires manual verification`,
    "Airwallex 返回的幂等键与本系统请求不一致": `The idempotent key returned by Airwallex is inconsistent with the system request.`,
    "Airwallex 返回的手续费币种与已审批付款不一致，需要核对": `The handling fee currency returned by Airwallex is inconsistent with the approved payment and needs to be verified.`,
    "Airwallex 返回的转账币种与冻结付款不一致": `The transfer currency returned by Airwallex is inconsistent with the frozen payment`,
    "Airwallex 返回的转账金额与冻结付款不一致": `The transfer amount returned by Airwallex is inconsistent with the frozen payment`,
    "Airwallex 返回的金额格式不正确": `The amount returned by Airwallex is in an incorrect format.`,
    "Airwallex 鉴权响应无法解析": `Airwallex authentication response cannot be parsed`,
    "Airwallex 鉴权响应缺少 token": `Airwallex authentication response lacks token`,
    "Azure 交付需要填写 Endpoint 地址。": `Azure delivery requires filling in the Endpoint address.`,
    "BINANCE_USDT 通道只支持 USDT 付款": `BINANCE_USDT channel only supports USDT payment`,
    "Binance USDT 可用余额不足": `Binance USDT available balance is insufficient`,
    "Binance USDT 必须使用已指定网络的链上收款账户": `Binance USDT must use the on-chain payment account of the designated network`,
    "Binance USDT 网络应使用 TRX、BSC、ETH 等官方编码": `Binance USDT network should use official codes such as TRX, BSC, ETH etc.`,
    "Binance 响应无法解析": `Binance response cannot be parsed`,
    "Binance 已受理，等待查单确认": `Binance has accepted it, waiting for order confirmation`,
    "Binance 币安": `Binance Binance`,
    "Binance 当前手续费为 ": `Binance’s current handling fee is `,
    "Binance 暂未返回该提币记录": `Binance has not yet returned the withdrawal record.`,
    "Binance 查单币种不一致": `Binance check currency is inconsistent`,
    "Binance 查单金额与已审批金额不一致": `The amount checked by Binance is inconsistent with the approved amount`,
    "Binance 签名失败": `Binance signature failed`,
    "Binance 网络请求失败": `Binance network request failed`,
    "Binance 请求失败": `Binance request failed`,
    "Binance 账户不支持该 USDT 网络": `Binance account does not support the USDT network`,
    "Binance 账户未返回 USDT 资产信息": `Binance account did not return USDT asset information`,
    "Binance 返回的数据结构不正确": `The data structure returned by Binance is incorrect`,
    "Binance 返回的金额格式不正确": `The amount returned by Binance is in an incorrect format.`,
    "CC lane 查询时间": `CC lane query time`,
    "CC lane 查询消耗": `CC lane query consumption`,
    "CC lane 资源": `CC lane resources`,
    "CCMAX 交付": `CCMAX delivery`,
    "CCMAX 凭据方式": `CCMAX credential method`,
    "CCMAX 同步并发": `CCMAX sync concurrency`,
    "CCMAX 批量交付": `CCMAX bulk delivery`,
    "CCMAX 批量接口尚未接入": `CCMAX batch interface has not been connected yet`,
    "CCMAX 批量资料须为 JSON 数组，请检查格式。": `CCMAX batch data must be a JSON array, please check the format.`,
    "CCMAX 拒绝创建资源（HTTP 400），请核对凭据与代理后重新提交。": `CCMAX refused to create the resource (HTTP 400), please check the credentials and proxy and resubmit.`,
    "CCMAX 拒绝创建资源（HTTP 400），请重新生成授权链接，并提交该链接对应的新授权码。": `CCMAX refuses to create resources (HTTP 400). Please regenerate the authorization link and submit the new authorization code corresponding to the link.`,
    "CCMAX 接口拒绝请求（HTTP {0}）": `CCMAX interface refused request (HTTP {0})`,
    "CCMAX 接口调用": `CCMAX interface call`,
    "CCMAX 日账同步": `CCMAX daily billing sync`,
    "CCMAX 日账响应不完整或字段不符": `CCMAX daily account response is incomplete or the fields do not match`,
    "CCMAX 日账查询失败，请稍后重试": `CCMAX daily account query failed, please try again later.`,
    "CCMAX 服务响应超时": `CCMAX service response timeout`,
    "CCMAX 服务地址解析失败": `CCMAX service address resolution failed`,
    "CCMAX 服务异常（HTTP ": `CCMAX service exception (HTTP `,
    "CCMAX 服务异常（HTTP {0}）": `CCMAX service exception (HTTP {0})`,
    "CCMAX 未返回该 lane，不能按零消耗处理": `CCMAX has not returned to this lane and cannot be processed as zero consumption.`,
    "CCMAX 来源金额已修订，请先核对差额，不能按旧金额结算": `CCMAX source amount has been revised, please check the difference first, settlement cannot be based on the old amount`,
    "CCMAX 查询、响应校验或观测写入失败；请检查运行记录并补查": `CCMAX query, response verification or observation writing failed; please check the running record and make additional inquiries`,
    "CCMAX 查询并发已满，请稍后重试": `CCMAX query concurrency is full, please try again later.`,
    "CCMAX 查询正在发布排空，请稍后重试": `CCMAX query is publishing and draining, please try again later.`,
    "CCMAX 查询许可已过期，请重试": `CCMAX query license has expired, please try again`,
    "CCMAX 查询许可暂时不可用，请稍后重试": `CCMAX query license is temporarily unavailable, please try again later.`,
    "CCMAX 模型 ": `CCMAX model `,
    "CCMAX 模型日账已冻结；来源修订须走差额核对，不能直接作废": `CCMAX model daily account has been frozen; source revisions must be reconciled and cannot be directly voided`,
    "CCMAX 模型消耗": `CCMAX model consumption`,
    "CCMAX 模型金额须为 USD": `CCMAX model amount must be USD`,
    "CCMAX 状态与费用同步": `CCMAX status and cost sync`,
    "CCMAX 目标": `CCMAX target`,
    "CCMAX 目标已停用，不能发起新查询": `CCMAX target has been deactivated and new queries cannot be initiated.`,
    "CCMAX 目标已创建，资源交付成功": `CCMAX target has been created and the resource is delivered successfully`,
    "CCMAX 请求未通过（HTTP ": `CCMAX request failed (HTTP `,
    "CCMAX 请求过于频繁（HTTP 429）": `CCMAX requests too frequently (HTTP 429)`,
    "CCMAX 调用记录未能可靠保存，不能确认本次本地处理完成": `CCMAX call record cannot be saved reliably, and the completion of this local processing cannot be confirmed.`,
    "CCMAX 账户信息": `CCMAX account information`,
    "CCMAX 资源概况": `CCMAX Resource Overview`,
    "CCMAX 资源概况 ": `CCMAX Resource Overview `,
    "CCMAX 返回 HTTP {0}": `CCMAX returns HTTP {0}`,
    "CCMAX 返回的创建结果不完整，请联系平台核对。": `The creation result returned by CCMAX is incomplete, please contact the platform for verification.`,
    "CCMAX 返回错误（HTTP ": `CCMAX returns error (HTTP `,
    "CCMAX 逐模型账单": `CCMAX bills by model`,
    "CCMAX审计待重试，原文已加密保留：{}": `CCMAX audit needs to be retried, the original text has been encrypted and retained: {}`,
    "CCMAX审计暂存文件无法读取，原文件已保留待核对：{}": `CCMAX audit temporary file cannot be read, the original file has been retained for verification: {}`,
    "CCMAX审计积压状态不可读，未删除记录": `CCMAX audit backlog status is unreadable and records are not deleted`,
    "CCMAX审计队列暂时不可读，未删除记录": `CCMAX audit queue is temporarily unreadable and records are not deleted`,
    "CCMAX拒绝创建目标，尚未确认交付成功。请核对凭据与代理。": `CCMAX declined target creation. Successful delivery has not been confirmed. Check the credentials and proxy.`,
    "CCMAX拒绝请求（HTTP ": `CCMAX rejects the request (HTTP `,
    "CCMAX服务暂时异常（HTTP ": `CCMAX service is temporarily abnormal (HTTP `,
    "CCMAX目标创建结果待核对，尚未确认交付成功，请勿重复提交。": `CCMAX target creation result needs to be verified. The successful delivery has not been confirmed yet. Please do not submit again.`,
    "CCMAX目标配置已变化，请重新确认": `CCMAX target configuration has changed, please reconfirm`,
    "CCMAX认证或权限校验失败（HTTP ": `CCMAX authentication or authority verification failed (HTTP `,
    "CCMAX请求过于频繁（HTTP 429），请稍后再试。": `CCMAX requests are too frequent (HTTP 429), please try again later.`,
    CCMAX账号名称: `CCMAX account name`,
    "CCMAX账号名称（交付账号）": `CCMAX account name (delivery account)`,
    "CCMAX资源已创建（{0}）": `CCMAX resource has been created ({0})`,
    CC返回非成功状态: `CC returns non-success status`,
    "CSV 中没有数据": `No data in CSV`,
    "CSV 列名或顺序不正确，请使用提供的模板": `CSV column name or order is incorrect, please use the provided template`,
    "CSV 引号未闭合": `CSV quote marks are not closed`,
    "CSV 第 ": `CSV No. `,
    "CSV 第 {0} 行应为 {1} 列": `CSV row {0} must contain {1} columns.`,
    "CSV 第 {0} 行日期或数值格式不正确": `CSV row {0} has an invalid date or numeric value.`,
    "Client ID 与 API Key 加密保存，不回显明文。正式凭据请只授予 balance:read、beneficiary:read 和 transfer:write 等必需最小权限。": `Client ID and API Key are stored encrypted and are never shown in plain text. Grant production credentials only the required permissions, such as balance:read, beneficiary:read and transfer:write.`,
    "Fable 采集时间": `Fable collection time`,
    "Fable 限制结束时间": `Fable limit end time`,
    "HTTP 地址": `HTTP address`,
    "Idempotency-Key 必须为 1—200 字符": `Idempotency-Key must be 1-200 characters`,
    "JSON 数组（字段与下方一致）": `JSON array (fields are consistent with those below)`,
    "JSON 文件不能超过 1 MiB。": `JSON file cannot exceed 1 MiB.`,
    "JSON 语法无效，请选择有效的服务账号 JSON 文件。": `The JSON syntax is invalid, please select a valid service account JSON file.`,
    "JSON 资料格式不正确": `JSON data format is incorrect`,
    "NewAPI 待分配": `NewAPI · Unassigned`,
    "NewAPI 待分配资源": `NewAPI resources to be allocated`,
    "NewAPI 资料不是有效的 JSON，请核对后重试。": `NewAPI data is not valid JSON, please check and try again.`,
    "NewAPI 资源交付": `NewAPI resource delivery`,
    "OAuth 回调地址或授权码": `OAuth callback address or authorization code`,
    "OAuth 授权码": `OAuth authorization code`,
    "OAuth 授权链接": `OAuth authorization link`,
    "OAuth 操作仅接受本次授权码": `OAuth operation only accepts this authorization code`,
    "OAuth 登录原账号（推荐）": `OAuth to log in to the original account (recommended)`,
    "OAuth 重新授权 ": `OAuth reauthorization `,
    "OAuth 需逐个完成本人授权，请使用单条交付": `OAuth requires personal authorization one by one, please use single delivery`,
    OAuth交付请先生成授权链接: `OAuth delivery please generate authorization link first`,
    OAuth交付请回填授权码后使用OAuth正式提交: `For OAuth delivery, please fill in the authorization code and use OAuth to submit it formally.`,
    OAuth交付请在授权码回填后使用正式提交: `For OAuth delivery, please use formal submission after backfilling the authorization code.`,
    "OAuth换取令牌时连接失败，请检查所选代理；重新授权时请使用新生成的授权链接和授权码。": `OAuth connection failed when exchanging tokens, please check the selected proxy; please use the newly generated authorization link and authorization code when re-authorizing.`,
    "OAuth目标已有创建记录，请重新生成授权链接并回填授权码后提交": `The OAuth target has been created. Please regenerate the authorization link and fill in the authorization code before submitting.`,
    "OKX UID 内部转账": `OKX UID internal transfer`,
    "OKX USDT 网络格式不正确": `OKX USDT network format is incorrect`,
    "OKX 响应无法解析": `OKX response cannot be parsed`,
    "OKX 如 USDT-TRC20；Binance 如 TRX、BSC、ETH": `OKX such as USDT-TRC20; Binance such as TRX, BSC, ETH`,
    "OKX 已受理，等待查单确认": `OKX accepted, waiting for order confirmation`,
    "OKX 当前手续费为 ": `OKX The current handling fee is `,
    "OKX 接口请求失败，请核对通道配置": `OKX interface request failed, please check the channel configuration`,
    "OKX 暂未返回该提币记录": `OKX has not returned the currency withdrawal record yet`,
    "OKX 欧意": `OKX Ouyi`,
    "OKX 签名失败": `OKX signature failed`,
    "OKX 网络请求失败": `OKX network request failed`,
    "OKX 网络连接失败，请稍后重试": `OKX network connection failed, please try again later.`,
    "OKX 请求失败": `OKX request failed`,
    "OKX 请求时间已过期，请联系管理员检查服务器时间同步": `OKX request time has expired, please contact the administrator to check server time synchronization`,
    "OKX 请求时间戳格式不正确，请联系管理员检查 UTC 毫秒格式": `OKX request timestamp format is incorrect, please contact the administrator to check the UTC millisecond format`,
    "OKX 账户不支持该 USDT 网络": `OKX account does not support the USDT network`,
    "OKX 资金账户 USDT 可用余额不足": `OKX capital account USDT available balance is insufficient`,
    "OKX 返回多条匹配流水，请人工核对": `OKX returns multiple matching flows, please check manually`,
    "OKX 返回数据无法解析，请稍后重试": `OKX returned data cannot be parsed, please try again later.`,
    "OKX 返回的提币流水不完整": `The withdrawal flow returned by OKX is incomplete`,
    "OKX 返回的金额格式不正确": `The amount returned by OKX is in incorrect format`,
    "OKX_USDT 通道只支持 USDT 付款": `OKX_USDT channel only supports USDT payment`,
    "OpenAI 兼容": `OpenAI compatible`,
    "PDF / PNG / JPG，最多 10 MB": `PDF / PNG / JPG, up to 10 MB`,
    "PDF / PNG / JPG，最多10 MB": `PDF/PNG/JPG, up to 10 MB`,
    "POST {0}/api/channel/\nAuthorization: Bearer <API 密钥>\nContent-Type: application/json": `POST {0}/api/channel/ 
 Authorization: Bearer <API key> 
 Content-Type: application/json`,
    "RPM / TPM 倍率": `RPM/TPM multiplier`,
    "RPM 与 TPM 倍率配置": `RPM and TPM multiplier configuration`,
    "RPM 字段路径": `RPM field path`,
    SHA256前12位: `first 12 digits of SHA256`,
    "Sandbox 测试环境": `Sandbox test environment`,
    "TPM 字段路径": `TPM field path`,
    "TXT / JSON · 最大 200 KB": `TXT / JSON · Max 200 KB`,
    "Token 消耗": `Token consumption`,
    "Token 消费总额": `Token total consumption`,
    "USDT 网络": `USDT Network`,
    "USDT 转账方式不正确": `USDT transfer method is incorrect`,
    "Vertex 凭据方式": `Vertex credential method`,
    '[{"accountName":"账号标识","projectId":"项目ID","credentialMode":"REFRESH_TOKEN","refreshToken":"...","proxyId":"代理ID"}]': `[{"accountName":"Account ID","projectId":"Project ID","credentialMode":"REFRESH_TOKEN","refreshToken":"...","proxyId":"Proxy ID"}]`,
    "[代理标识已隐藏]": `[Proxy ID has been hidden]`,
    "[层级过深]": `[Maximum nesting depth exceeded]`,
    "[已脱敏]": `[Desensitized]`,
    "[敏感值已隐藏]": `[Sensitive value has been hidden]`,
    "[无效链接]": `[Invalid link]`,
    "[邮箱已隐藏]": `[Email has been hidden]`,
    "[链接已隐藏]": `[Link hidden]`,
    "[长标识已隐藏]": `[Long logo has been hidden]`,
    "accesstoken已过期(等待自动续期)": `accesstoken has expired (waiting for automatic renewal)`,
    "batch_add_set_key_prefix_2_name 必须为布尔值": `batch_add_set_key_prefix_2_name must be a Boolean value`,
    "channel 必须为对象": `channel must be an object`,
    "channel.groups 必须为字符串数组或 null": `channel.groups must be a string array or null`,
    "channel.key 不能为空": `channel.key cannot be empty`,
    "channel.key 存在重复成员": `channel.key has duplicate members`,
    "channel.key 没有有效成员": `channel.key has no valid members`,
    "channel.key 的 Vertex 多 Key 资料必须为 JSON 数组": `channel.key must be a JSON array`,
    "channel.settings 不是有效的字符串 JSON 对象": `channel.settings must be a valid JSON object containing string values.`,
    "channel.type 尚未启用或不是整数": `channel.type has not been enabled or is not an integer`,
    "https://资源名.openai.azure.com": `https://resourcename.openai.azure.com`,
    "lane 归属已变化": `lane ownership has changed`,
    "lane 归属已变化，需人工核对": `lane ownership has changed and requires manual verification`,
    "mode 必须为 single、batch 或 multi_to_single": `mode must be single, batch or multi_to_single`,
    "multi_key_mode 必须为 random 或 polling": `multi_key_mode must be random or polling`,
    "unit::个": `item`,
    "unit::个数": `item`,
    "unit::分钟": `minute`,
    "unit::基准金额": `Base amount`,
    "unit::天": `day`,
    "unit::小时": `hour`,
    "unit::年": `year`,
    "unit::日": `day`,
    "unit::月": `month`,
    "unit::次": `request`,
    "unit::秒": `second`,
    "unit::账号": `account`,
    "unit::额度面值": `Credit value`,
    '{"_truncated":"响应或请求过长，内容已隐藏"}': `{"_truncated":"The response or request is too long and the content has been hidden"}`,
    '{"code":"ONBOARDING_REQUIRED","message":"请先填写个人和企业资料"}': `{"code":"ONBOARDING_REQUIRED","message":"Please fill in your personal and business information first"}`,
    '{"code":"PASSWORD_CHANGE_REQUIRED","message":"首次登录或密码重置后，请先修改密码"}': `{"code":"PASSWORD_CHANGE_REQUIRED","message":"After first login or password reset, please change your password first"}`,
    '{"message":"权限不足或 CSRF 校验失败，请刷新重试"}': `{"message":"Insufficient permissions or CSRF verification failed, please refresh and try again"}`,
    '{"message":"登录会话暂时无法验证，请稍后重试"}': `{"message":"The login session cannot be verified temporarily, please try again later"}`,
    '{"message":"登录尝试过于频繁，请稍后重试"}': `{"message":"Login attempts are too frequent, please try again later"}`,
    '{"message":"登录已失效，请重新登录"}': `{"message":"Login has expired, please log in again"}`,
    '{"message":"请先登录"}': `{"message":"Please log in first"}`,
    '{"message":"账号或密码错误，或账号已停用"}': `{"message":"The account or password is incorrect, or the account has been deactivated"}`,
    "{0}": `{0}`,
    "{0} {1} / 个": `{0} {1}/piece`,
    "{0} {1} · 重置时间：{2}": `{0} {1} · Reset time: {2}`,
    "{0} {1} 完整收款账号": `{0} {1} Complete payment account number`,
    "{0} {1} 条，筛选资源": `{0} {1} items, filter resources`,
    "{0} {1} 请先联系平台核对创建结果，勿重复提交。": `{0} {1} Please contact the platform first to check the creation results and do not submit repeatedly.`,
    "{0} · {1} 应付明细": `{0} · {1} Payable details`,
    "{0} · {1} 来源修订": `{0} · {1} Source revision`,
    "{0} · {1}。": `{0} · {1}.`,
    "{0} · {1}（{2}）": `{0} · {1} ({2})`,
    "{0} · 保存后下一轮执行生效，当前执行继续完成。": `{0} · Changes apply to the next run. The current run will finish.`,
    "{0} · 应收明细": `{0} · Receivable details`,
    "{0} · 待核对观测同步": `{0} · Observation synchronization to be verified`,
    "{0} · 末四位 {1}": `{0} · Last four digits {1}`,
    "{0} · 绑定资源": `{0} · Bind resources`,
    "{0} · 账单明细 · {1}": `{0} · Bill details · {1}`,
    "{0} × {1}": `{0} × {1}`,
    "{0} × {1} 倍": `{0} × {1} times`,
    "{0} 个": `{0}`,
    "{0} 个|one": `{0} item`,
    "{0} 个任务处理中，可关闭页面稍后查看": `{0} tasks are being processed. You can close the page and view it later.`,
    "{0} 个资源 · {1} 条账单": `{0} resources · {1} bills`,
    "{0} 优先": `{0} priority`,
    "{0} 位": `{0} characters`,
    "{0} 倍": `{0} times`,
    "{0} 到期": `{0} expires`,
    "{0} 只读连接测试通过，未发起提币": `{0} The read-only connection test passed, but no coin withdrawal was initiated.`,
    "{0} 批": `{0} batch`,
    "{0} 条": `{0} items`,
    "{0} 条 / 页": `{0} / page`,
    "{0} 条|one": `{0} record`,
    "{0} 条日账": `{0} daily accounts`,
    "{0} 条日账 / {1} 行": `{0} daily accounts / {1} lines`,
    "{0} 条资源": `{0} resources`,
    "{0} 条资源|one": `{0} resource`,
    "{0} 生效": `{0} takes effect`,
    "{0} 笔已选日账": `{0} selected daily accounts`,
    "{0} 笔需处理": `{0} entries need attention`,
    "{0} 至 {1}": `{0} to {1}`,
    "{0} 至 {1} · {2}": `{0} to {1} · {2}`,
    "{0} 记录已保留，可在列表编辑或删除。": `{0} record has been reserved and can be edited or deleted in the list.`,
    "{0} 资金通道已保存": `{0} payment provider has been saved`,
    "{0} 起": `{0}`,
    "{0} 通道配置": `{0} channel configuration`,
    "{0} 项": `{0} items`,
    "{0} 项|one": `{0} item`,
    "{0}–{1} 位": `{0}–{1} characters`,
    "{0}。原提交编号已保留，核对时不会换号重建。": `{0}. The original submission number has been retained and will not be renumbered during verification.`,
    "{0}上传 JSON 文件": `{0} upload JSON file`,
    "{0}倍率上限": `{0}rate upper limit`,
    "{0}倍率下限": `{0} lower limit of multiplier`,
    "{0}倍率已保存": `{0} multiplier has been saved`,
    "{0}加载中…": `{0} Loading…`,
    "{0}加载失败": `{0} failed to load`,
    "{0}和{1}": `{0} and {1}`,
    "{0}子菜单": `{0} submenu`,
    "{0}平均已用": `{0} average used`,
    "{0}年 {1}月": `{0} year {1} month`,
    "{0}年{1}月{2}日": `{0}-{1}-{2}`,
    "{0}服务账号 JSON": `{0} service account JSON`,
    "{0}账号 · {1}": `{0} account · {1}`,
    "{0}选项": `{0} option`,
    "{0}（HTTP {1}）": `{0} (HTTP {1})`,
    "{0}（{1}）": `{0} ({1})`,
    "{0}（{1}）{2}": `{0} ({1}){2}`,
    "{0}（暂不可交付）": `{0} (not yet available for delivery)`,
    "{0}，可左右滚动": `{0}, can scroll left and right`,
    "{0}，查看详情": `{0}, view details`,
    "{0}：{1}": `{0}: {1}`,
    "· 尾号 ": `·Tail number `,
    "”（": `" (`,
    "”，草稿内容将不能再修改。": `", the draft content will no longer be modified.`,
    "…[截断]": `…[truncated]`,
    "→ 调整后预览：": `→ Preview after adjustment:`,
    "。 ": `. `,
    "。可使用关键词搜索，或刷新重试。 ": `. You can search using keywords, or refresh and try again. `,
    "。已有操作仍可筛选。 ": `. Existing operations can still be filtered. `,
    "。正在重试，可稍后重新查看。 ": `. Retrying, you can check again later. `,
    "。确认后金额冻结。 ": `. The amount will be frozen after confirmation. `,
    "。请于 ": `. Please confirm by `,
    "。请有权人员完成登录并回填授权码。 ": `. Please have the authorized personnel complete the login and fill in the authorization code. `,
    "。逾期未提出异议将自动确认。 ": `. Any objections not raised within the time limit will be automatically confirmed. `,
    一: `Mon`,
    "一次最多接收 100 个 Key": `can receive up to 100 Keys at a time`,
    一次最多查询100条资源: `A maximum of 100 resources can be queried at one time`,
    "一次请选择1～100条资源": `Please select 1 to 100 resources at a time`,
    一次请选择同一CCMAX目标的资源: `Please select the resources of the same CCMAX target at one time`,
    一次请选择同一供应商的资源: `Please select resources from the same supplier at one time`,
    三: `Wed`,
    上一年: `Previous year`,
    "上一张 ": `Previous picture `,
    上一页: `Previous page`,
    "上一页 ": `Previous page `,
    上两个月: `Last two months`,
    "上传 JSON 文件 ": `Upload JSON file `,
    "上传中…": `Uploading…`,
    上传付款凭证: `Upload payment voucher`,
    上传供应商资质附件: `Upload supplier qualification attachment`,
    "上传服务账号 JSON 文件，或在这里粘贴完整 JSON": `Upload a service account JSON file or paste the complete JSON here.`,
    上传材料: `Upload materials`,
    "上传真实付款凭证后直接登记已付款，并通知供应商确认到账。": `After uploading the real payment voucher, directly register the payment and notify the supplier to confirm the payment.`,
    上传附件: `Upload attachment`,
    上号中: `is on the way`,
    上号失败: `Number registration failed`,
    "上游尚未提供费用数据完整性/修订版本；仅供人工核对，不写入日账或结算": `The upstream has not yet provided the completeness/revision of the expense data; it is only for manual verification and will not be written into the daily account or settlement.`,
    上游换绑接口暂未声明支持此代理协议: `The upstream binding interface has not yet stated that it supports this proxy protocol.`,
    "上游数据年龄（秒）": `Upstream data age (seconds)`,
    "上游未完成换绑，原绑定未变化": `The upstream binding has not been completed and the original binding has not changed.`,
    "上游绑定已变化，但本地资料也已变化，请平台核对": `The upstream binding has changed, but the local data has also changed. Please check with the platform.`,
    "上游进度已失效，实际代理待核对，勿重复提交": `The upstream progress has expired. The actual proxy needs to be verified. Do not submit again.`,
    "上游进度已失效，正在核对实际绑定": `The upstream progress has expired and the actual binding is being checked.`,
    上游采集时间: `upstream collection time`,
    "上游金额已修订，": `upstream amount has been revised,`,
    下一年: `next year`,
    "下一张 ": `next picture `,
    下一页: `next page`,
    "下一页 ": `next page `,
    下两个月: `next two months`,
    下次执行: `next execution`,
    "下表是历史 CC lane 期间总费用快照，仅供资源概览。可按北京时间日期查询逐模型 token 费用作只读预览，也可保存为待核对观测；上游尚未提供费用完整性语义，观测不可进入结算。 ": `The following table is a snapshot of the total expenses during the historical CC lane period and is for resource overview only. The model-token fee can be queried based on Beijing time and date for read-only preview, or it can be saved as an observation to be verified; the upstream has not yet provided fee integrity semantics, and the observation cannot enter settlement. `,
    下载: `download`,
    "下载 ": `download `,
    下载附件: `Download attachment`,
    不支持的支付结果: `Unsupported payment result`,
    不支持的资源概况类型: `Unsupported resource profile type`,
    不支持的资金通道: `Unsupported fund channel`,
    不是测试通道: `is not a test channel`,
    不能停用当前登录账号: `The current login account cannot be deactivated`,
    不能在当前会话修改自己的角色或停用自己: `You cannot modify your role or deactivate yourself in the current session.`,
    不能强制登出当前登录账号: `Cannot force logout of the current login account`,
    不能改变团队成员的基础身份: `The basic identity of team members cannot be changed.`,
    不能查询北京时间未来的账单日期: `Unable to query the future bill date in Beijing time`,
    不能登记未来的营业额: `Unable to register future turnover`,
    "不能通过改角色改变账号的平台／供应商归属": `The platform/supplier affiliation of the account cannot be changed by changing the role.`,
    不适用: `Not applicable`,
    不限: `No limit`,
    不限数量: `Unlimited quantity`,
    "与待审核或已确认报价的适用时间重叠；请退回并调整期间": `overlaps with the applicable time for pending or confirmed quotations; please return and adjust the period`,
    专业商业服务: `Professional business services`,
    业务功能: `Business function`,
    业务导航: `Business Navigation`,
    业务日期: `Business date`,
    业务记录: `business record`,
    "两天前创建的草稿默认不显示。选择「草稿」，或用搜索、创建日期可以查出来。 ": `Drafts created two days ago are not displayed by default. Select "Drafts", or use search or creation date to find out. `,
    两次输入的密码不一致: `The passwords entered twice are inconsistent.`,
    两次输入的新密码不一致: `The new password entered twice is inconsistent.`,
    个: `item`,
    个人: `Individual`,
    个人信息: `Personal information`,
    "个人信息 ": `Personal information `,
    "个人信息加载失败：": `Personal information loading failed:`,
    个人信息已更新: `personal information has been updated`,
    个人电话: `Personal phone number`,
    个人资料: `Personal information`,
    "个人资料已变化，请刷新后重试": `Personal information has changed, please refresh and try again.`,
    个人资料格式不正确: `Personal data format is incorrect`,
    个人邮箱: `Personal email`,
    个数: `number`,
    "个自定义角色 ": `custom roles `,
    中国: `China`,
    中转站: `transfer station`,
    主体信息: `subject information`,
    主体名称: `Subject name`,
    主体类型: `Subject type`,
    "主体类型创建后不可切换，请核实后新建正确主体": `The subject type cannot be switched after creation. Please verify and create the correct subject.`,
    主体证明与补充材料: `Main body certificate and supplementary materials`,
    "主实例已同步，等待其他实例": `The main instance has been synchronized, waiting for other instances`,
    主机: `host`,
    买断价格: `Buyout price`,
    买断报价只接受每个账号的固定单价: `The buyout quote only accepts the fixed unit price of each account.`,
    买断账号数量: `Number of purchased accounts`,
    买断金额: `Buyout amount`,
    事件代码: `event code`,
    事件编号: `event number`,
    二: `Tue`,
    五: `Fri`,
    交付: `Delivery`,
    "交付 ": `Delivery `,
    交付中: `is being delivered`,
    "交付中，请等待后刷新交付结果，勿重复提交。": `is being delivered. Please wait and refresh the delivery results. Do not submit again.`,
    "交付代理-": `Delivery Proxy-`,
    交付供应商: `delivery supplier`,
    交付列表: `Delivery list`,
    交付失败: `Delivery failed`,
    交付失败原因: `Reason for delivery failure`,
    "交付失败，请核对后重新提交。": `Delivery failed, please check and resubmit.`,
    交付密钥: `Key delivery`,
    交付待处理: `delivery pending`,
    交付成功: `delivered successfully`,
    "交付成功，共 {0} 条资源，待分配报价项目": `delivered successfully, a total of {0} resources, quote items to be allocated`,
    交付报价: `delivery quote`,
    交付指纹计算不可用: `Delivery fingerprint calculation is not available`,
    交付方式: `Delivery method`,
    交付方式筛选: `Delivery method screening`,
    "交付暂未完成，请协助处理": `delivery has not been completed yet, please assist in processing`,
    "交付暂未完成，请协助处理。": `has not been completed yet, please assist in processing.`,
    交付状态: `delivery status`,
    "交付状态已变化或仍有创建结果，请刷新后核对，不能重复处理": `The delivery status has changed or there are still creation results. Please refresh and check. Repeat processing is not allowed.`,
    "交付状态已变化，请人工核对": `The delivery status has changed, please check manually`,
    "交付状态已变化，请刷新后重试": `The delivery status has changed, please refresh and try again.`,
    "交付结果尚未确认，请等待后刷新交付结果，勿重复提交。": `The delivery result has not been confirmed yet. Please wait and refresh the delivery result. Do not submit again.`,
    "交付结果尚未确认，请联系平台核对": `The delivery result has not been confirmed, please contact the platform to check.`,
    "交付结果尚未确认：{0}。请刷新交付结果核对，勿重复提交。": `Delivery result not yet confirmed: {0}. Please refresh the delivery results to check and do not submit again.`,
    "交付结果尚未确认：{0}。请刷新交付结果，勿重复提交。": `Delivery result not yet confirmed: {0}. Please refresh the delivery results and do not submit again.`,
    "交付结果已变化，请刷新后核对": `The delivery result has changed, please refresh and check.`,
    "交付结果未确认，请查看原记录，勿更换编号重复创建": `The delivery result has not been confirmed. Please check the original record and do not change the number and create it again.`,
    "交付结果查询失败：{0}。请勿重复提交。": `Delivery result query failed: {0}. Please do not resubmit.`,
    "交付草稿已变化，目标已创建，请人工核对": `The delivery draft has changed and the target has been created. Please check manually.`,
    "交付草稿已变化，请刷新后核对": `The delivery draft has changed, please refresh and check.`,
    "交付草稿已变化，请核对结果": `The delivery draft has changed, please check the result`,
    "交付草稿已变化，请重新授权": `The delivery draft has changed, please re-authorize`,
    交付记录: `delivery record`,
    "交付请求处理时间已到，结果未确认": `The delivery request processing time has expired and the result is not confirmed.`,
    "交付请求已中断，结果未确认": `The delivery request has been interrupted and the result is not confirmed`,
    交付账号: `Account delivery`,
    交付资料核对结果: `delivery data verification results`,
    "交付资格查询失败：": `Delivery qualification query failed:`,
    "交付资源-": `Delivery Resources-`,
    "交付页面已更新，请刷新后重试。草稿仅在新版页面点击保存草稿时创建。": `delivery page has been updated, please refresh and try again. Drafts are only created when you click Save Draft on the new page.`,
    交付项目: `delivery project`,
    交易所钱包: `Exchange Wallet`,
    人工核对交付失败: `Manual verification delivery failed`,
    "人工登记 / 关闭付款": `Manual registration / close payment`,
    人工调整: `manual adjustment`,
    人工调整合计: `Manual adjustment total`,
    "人工调整已保存，最终应付金额已更新": `Manual adjustment has been saved and the final amount payable has been updated`,
    人工调整结算金额: `Manual adjustment of settlement amount`,
    人工调整记录: `Manual adjustment record`,
    人民币参考汇率读取失败: `Failed to read RMB reference exchange rate`,
    "人民币同币种按 1 折算 · 仅供参考": `RMB with the same currency is converted at 1 · For reference only`,
    仅供参考: `For reference only`,
    仅供应商及其团队成员可录入资源: `Only suppliers and their team members can enter resources`,
    仅供应商可查看本方账单: `Only suppliers can view their own bills`,
    "仅保存在服务端，保存后不回显。": `Stored only on the server and hidden after saving.`,
    仅内部可见: `Only visible internally`,
    仅发送待办分类数量: `Send only task counts by category`,
    仅可从本方已通过的报价发起交付: `Delivery can only be initiated from the quote that has been approved by the party`,
    仅可修改本方草稿: `Only the original draft can be modified`,
    "仅可分配一次，保存后不可更改": `A resource can only be assigned once. The assignment cannot be changed after saving.`,
    仅可删除未交付的草稿: `Only undelivered drafts can be deleted`,
    仅可删除未交付的草稿或已确认失败记录: `Only undelivered drafts or confirmed failure records can be deleted`,
    "仅在服务端加密保存，保存后不回显。": `is only encrypted and saved on the server side and will not be echoed after saving.`,
    仅已交付的已有账号可以重新授权: `Only existing accounts that have been delivered can be reauthorized.`,
    "仅已通过报价可申请调整；待审核报价请直接编辑": `Only quotations that have been approved can apply for adjustment; please edit quotations that are pending review directly.`,
    仅平台人员可操作: `Only platform personnel can operate`,
    仅平台内部: `Only within the platform`,
    仅平台内部可见: `is only visible inside the platform`,
    仅平台管理员可查看已生成令牌的明文: `Only the platform administrator can view the clear text of the generated token`,
    "仅当前目标；默认 2，范围 1–32。": `Current target only; default 2, range 1–32.`,
    "仅批准当前填写的目标地址。HTTP 会以明文传输管理密钥。": `Only the currently filled target address is approved. HTTP transmits the administrative key in clear text.`,
    "仅接收现行系统已核算的原始金额，不在此生成日/月账单。跨越调价日期的账单，需要先拆分原始金额。": `only receives the original amount calculated by the current system and does not generate daily/monthly bills here. For bills that span the price adjustment date, the original amount needs to be split first.`,
    "仅支持 PDF、PNG、JPG；文件内容必须与类型一致": `only supports PDF, PNG, and JPG; the file content must be consistent with the type`,
    "仅支持与供应商主体同名的账户。": `Only accounts with the same name as the supplier principal are supported.`,
    "仅支持与当前供应商主体同名的账户；完整账号、地址或 UID 不会在页面回显。 ": `only supports accounts with the same name as the current supplier; the full account number, address or UID will not be echoed on the page. `,
    "仅支持空中云汇、欧意或币安收款账户": `only supports SkyFX, OuYi or Binance receiving accounts`,
    "仅显示 models[].tokenCostUsd；不计入工具费、总费用或应付。": `Shows only models[].tokenCostUsd; does not include tool fees, total fees, or payable.`,
    仅显示已启用且未绑定供应商的用户: `Only display users who are enabled and not bound to a supplier`,
    仅显示当前账号的任务: `Only displays tasks for the current account`,
    "仅本次展示，请复制保存。": `is displayed only for this time, please copy and save.`,
    仅自定义结算周期可填写天数: `Only the number of days can be filled in the custom settlement cycle`,
    今天生效: `takes effect today`,
    "今天调价今天生效。": `Today’s price adjustment takes effect today.`,
    "今天调价今天生效，历史价格不变。未来调价按所选日期生效，审核前旧价继续有效。 ": `Today’s price adjustment takes effect today, and the historical price remains unchanged. Future price adjustments will take effect on the selected date, and the old price before review will remain valid. `,
    "今日 · ": `Today · `,
    "今日尚未结束，金额会继续更新。": `has not ended today and the amount will continue to be updated.`,
    今日或缺报价等原因尚未计价入账: `The price has not yet been recorded in the account due to lack of quote or other reasons today.`,
    "今日数据截至查询时间，仍会变化；仅供核对，不可确认入账或结算": `Today’s data is current as of the query time and may still change. It is for reconciliation only and cannot be posted or settled.`,
    "今日账单 · 次日可结算": `Today’s bill · Can be settled the next day`,
    "今日账单持续更新，次日可结算；待计价消耗尚未计入应收。": `Today’s bills continue to update and become eligible for settlement tomorrow. Unpriced usage is excluded from receivables.`,
    "今日账单持续更新，次日可结算（北京时间）。": `Today's bill is continuously updated and can be settled the next day (Beijing time).`,
    "今日账单持续更新，次日可结算；待计价消耗尚未计入应收。历史资源未能关联创建账号的，单独列示。 ": `Today’s bills continue to update and become eligible for settlement tomorrow. Unpriced usage is excluded from receivables. Historical resources without a creator account are listed separately. `,
    "仍有效；新账户审核通过后才会替换它。 ": `is still valid; it will not be replaced until the new account is approved. `,
    付款凭证: `payment voucher`,
    "付款凭证不能超过10 MB": `Payment voucher cannot exceed 10 MB`,
    付款单: `payment order`,
    "付款单 / 供应商": `Payment Order/Supplier`,
    付款处理中: `Payment is being processed`,
    付款失败: `Payment failed`,
    付款完成: `payment completed`,
    付款审核已处理: `Payment review has been processed`,
    "付款已进入通道，请查询原请求状态": `Payment has entered the channel, please check the original request status`,
    付款币种必须与所选收款账户一致: `The payment currency must be consistent with the selected payment account`,
    付款待审核: `Payment pending review`,
    付款方式: `payment method`,
    付款状态已发生变化: `Payment status has changed`,
    付款申请不在待审核状态: `Payment application is not pending review`,
    付款申请审核: `Payment application review`,
    付款申请审核通过: `Payment application approved`,
    "付款申请当前状态不可登记，或尚未完成原审核": `The current status of the payment application cannot be registered, or the original review has not been completed.`,
    付款结果已登记: `payment result has been registered`,
    付款记录: `Payment record`,
    "付款记录 ": `Payment record `,
    付款进度: `payment progress`,
    付款进度筛选值无效: `The payment progress filter value is invalid`,
    付款通道处理中: `Payment channel is being processed`,
    付款通道结果待核对: `Payment channel result needs to be verified`,
    付款金额: `payment amount`,
    "付款金额超过 Airwallex 单笔限额": `The payment amount exceeds Airwallex single transaction limit`,
    "付款金额超过 Binance 单笔限额": `The payment amount exceeds Binance’s single transaction limit`,
    "付款金额超过 OKX 单笔限额": `The payment amount exceeds the OKX single limit`,
    付款金额超过未占用的应付余额: `The payment amount exceeds the unoccupied balance payable`,
    "付款须先审核通过，且未执行": `Payment must be approved first and has not been executed.`,
    代理: `proxy`,
    "代理 / 地址": `proxy/address`,
    "代理 URL": `Proxy URL`,
    代理不允许此连接: `The proxy does not allow this connection`,
    代理列表: `Proxy List`,
    "代理列表加载失败：{0}": `Proxy list loading failed: {0}`,
    "代理列表已变化，请刷新后重新检测": `The proxy list has changed, please refresh and recheck.`,
    "代理列表收集失败，未开始检测：{0}": `Proxy list collection failed, detection has not started: {0}`,
    "代理列表返回不完整，请刷新后重试": `The proxy list returned is incomplete, please refresh and try again.`,
    "代理列表（每行一条，最多 500 条）": `Proxy list (one per line, up to 500)`,
    代理协议: `Agency Agreement`,
    "代理名称不能包含完整出口地址，请使用业务名称": `The proxy name cannot contain the complete export address, please use the business name.`,
    代理名称或可见出口: `Proxy name or visible exit`,
    代理在握手完成前断开连接: `Proxy disconnected before handshake completed`,
    代理地址不在允许的公网范围: `The proxy address is not within the allowed public network range.`,
    代理地址无法读取: `The proxy address cannot be read.`,
    代理地址格式不正确: `The proxy address format is incorrect.`,
    "代理地址格式不正确，支持 SOCKS5、HTTP、HTTPS URL": `The proxy address format is incorrect. SOCKS5, HTTP, and HTTPS URLs are supported.`,
    "代理已有资源绑定，请新建代理以更换地址": `The proxy has resource binding. Please create a new proxy to change the address.`,
    代理拒绝认证方式: `Proxy rejects authentication method`,
    代理拒绝转发: `Proxy refuses to forward`,
    "代理拒绝转发（HTTP ": `The proxy refuses to forward (HTTP `,
    "代理拒绝连接（HTTP 403）：请检查服务器出口 IP 白名单及目标域名访问限制": `Proxy refuses connection (HTTP 403): Please check the server export IP whitelist and target domain name access restrictions`,
    代理握手失败: `Proxy handshake failed`,
    代理无法连通外部地址: `The proxy cannot connect to the external address`,
    代理更换记录: `proxy replacement record`,
    代理更换进度: `Proxy replacement progress`,
    "代理格式不正确，支持 SOCKS5、HTTP、HTTPS URL": `The proxy format is incorrect and supports SOCKS5, HTTP, and HTTPS URLs.`,
    "代理检测失败：{0}": `Proxy detection failed: {0}`,
    代理检测通过: `Proxy detection passed`,
    代理池: `Proxy pool`,
    代理没有返回有效响应: `The proxy did not return a valid response`,
    代理状态: `Proxy status`,
    代理目标地址无法读取: `The proxy target address cannot be read.`,
    代理筛选条件不正确: `Proxy filtering conditions are incorrect`,
    代理管理: `Proxy Management`,
    "代理绑定资源已达上限，请更换代理": `The proxy binding resources have reached the upper limit, please change the proxy.`,
    代理认证信息过长: `Proxy authentication information is too long`,
    代理认证失败: `Proxy authentication failed`,
    代理认证资料无法读取: `The proxy authentication data cannot be read.`,
    代理返回了无法识别的地址: `The proxy returned an unrecognized address`,
    代理连接或响应超时: `Proxy connection or response timeout`,
    "代理连接被拒绝或重置，请检查访问限制": `The proxy connection was refused or reset, please check the access restrictions.`,
    代理配置: `Proxies`,
    代理配置不完整: `Proxy configuration is incomplete`,
    代理配置已保存: `Proxy configuration has been saved`,
    代理配置已变化: `Proxy configuration has changed`,
    "代理配置已变化，请重新选择": `The proxy configuration has changed, please select again.`,
    代码: `code`,
    价格: `price`,
    "价格 / 倍率": `price / multiplier`,
    价格优先: `price priority`,
    价格版本: `Price history`,
    价格生效日期必须与新价格一起提交: `price effective date must be submitted together with new price`,
    "价格： ": `price: `,
    任务: `task`,
    "任务 / 账务日期": `Task/account date`,
    任务列表: `Scheduled tasks`,
    "任务加载失败：": `Task loading failed:`,
    任务名称: `Task name`,
    "任务名称长度须为 1 至 128 个字符": `Task name must be between 1 and 128 characters long`,
    任务已停用: `task has been deactivated`,
    "任务已停用，当前执行完成后不再调度": `The task has been deactivated and will no longer be scheduled after the current execution is completed.`,
    任务已启用: `task has been enabled`,
    任务执行器尚未接入: `task executor has not been connected yet`,
    任务执行权已变化: `Task execution right has changed`,
    任务状态: `task status`,
    "任务状态 / 进度": `Task status/progress`,
    "任务状态已变化，请刷新查看": `The task status has changed, please refresh to view`,
    任务类型: `Task type`,
    任务详情: `mission details`,
    任务配置: `Task settings`,
    "任务配置已保存，下一轮执行使用新配置": `The task configuration has been saved, and the new configuration will be used in the next round of execution.`,
    "任务配置已变化，请刷新重试": `The task configuration has changed, please refresh and try again.`,
    "任务配置已被修改，请刷新重试": `The task configuration has been modified, please refresh and try again.`,
    "任务长时间未完成，请平台核对实际绑定": `The task has not been completed for a long time. Please check the actual binding on the platform.`,
    企业: `Enterprise`,
    企业供应商需填写统一社会信用代码或注册编号: `Enterprise suppliers need to fill in the unified social credit code or registration number`,
    企业名称: `Company name`,
    企业微信响应无效: `Enterprise WeChat response is invalid`,
    企业微信拒绝消息: `Enterprise WeChat rejects message`,
    企业微信请求失败: `Enterprise WeChat request failed`,
    企业支出: `Corporate expenditures`,
    企业注册编号: `Enterprise registration number`,
    会话已创建: `session has been created`,
    会话有效期: `Session lifetime`,
    "会话空闲期为 1—1440 分钟，绝对有效期不得小于空闲期且不超过 7 天": `The session idle period is 1-1440 minutes, and the absolute validity period shall not be less than the idle period and shall not exceed 7 days.`,
    位: ` characters`,
    余量折合约: `balance discount contract`,
    作废原因: `Reason for invalidation`,
    作废未结算的原始金额: `Void the original unsettled amount`,
    作废本条原始金额: `Void the original amount of this article`,
    作废结算来源: `Void settlement source`,
    "使用 CCMAX 已保存的 Refresh Token 立即刷新，无需重新登录。原账号、代理和历史账单保留。 ": `uses the CCMAX saved Refresh Token to refresh immediately without re-logging in. The original account number, proxy and historical bills are retained. `,
    使用创建时填写的密码: `Use the password filled in when creating`,
    使用原操作继续提交: `Continue to submit using the original operation`,
    "使用原编号核对 / 继续": `Use original number to check/continue`,
    "使用已保存的 beneficiary ID 执行同币种付款，支持 Sandbox 与生产环境分离配置。": `Uses the saved beneficiary ID to perform payments in the same currency, and supports separate configuration of the Sandbox and the production environment.`,
    "使用时自动保存，重复代理会复用": `is automatically saved when used, and repeated proxies will be reused.`,
    使用粘贴资料中的代理URI: `Use the proxy URI in the pasted data`,
    "例如 0.8": `for example 0.8`,
    "例如 10": `example 10`,
    "例如 27": `For example, 27`,
    "例如 SUP-2026-0008": `for example SUP-2026-0008`,
    "例如：CCMAX 主站": `For example: CCMAX master station`,
    "例如：CCMAX 正式环境": `For example: CCMAX formal environment`,
    "例如：X-API-Key": `For example: X-API-Key`,
    "例如：anthropic": `Example: anthropopic`,
    "例如：data.tpm；未提供可留空": `For example: data.tpm; if not provided, please leave it blank`,
    "例如：rpm 或 data.rpm": `For example: rpm or data.rpm`,
    "例如：windowEnd": `For example: windowEnd`,
    "例如：windowSeconds": `For example: windowSeconds`,
    "例如：自动交付": `Example: automatic delivery`,
    供应商: `Supplier`,
    "供应商 / 付款单": `Supplier/Payment Order`,
    "供应商 / 结算单": `Supplier/Settlement Statement`,
    "供应商 / 项目": `Supplier/Project`,
    供应商不存在或已停用: `The supplier does not exist or has been deactivated.`,
    供应商主体信息: `Supplier subject information`,
    供应商主体名称: `Supplier entity name`,
    供应商交付: `supplier delivery`,
    供应商代码: `supplier code`,
    供应商代码已被使用: `supplier code has been used`,
    供应商代码未变化: `supplier code has not changed`,
    "供应商代码须为 2-30 位字母、数字、下划线或短横线": `supplier code must be 2-30 letters, numbers, underscores or dashes`,
    供应商到账: `Supplier arrives`,
    供应商到账确认: `Supplier arrival confirmation`,
    供应商反馈到账差异: `Supplier feedback on account difference`,
    "供应商只能将匹配类型的接口资源分配到此项目。仍需有权交付且存在有效的已审核报价。": `The supplier can only assign interface resources of matching type to this project. The right to deliver and the existence of a valid approved quote are still required.`,
    供应商可见: `Supplier visible`,
    供应商名称或编码: `Supplier name or code`,
    供应商启用且资质通过后才能提交报价: `Suppliers can only submit quotations after they are activated and qualified.`,
    "供应商始终可见最终应收；选择仅内部可见时，不展示本条加减金额与说明。": `The final receivable is always visible to the supplier; when only visible internally is selected, the addition and subtraction amount and description of this article will not be displayed.`,
    供应商尚未确认本次结算金额: `The supplier has not yet confirmed the settlement amount.`,
    供应商尚未确认本次金额: `The supplier has not yet confirmed the amount.`,
    供应商尚未确认这笔结算金额: `The supplier has not yet confirmed the settlement amount.`,
    供应商展示: `supplier display`,
    供应商已停用: `The supplier is disabled.`,
    "供应商已停用，禁止出款": `The supplier has been deactivated and payment is prohibited.`,
    "供应商已停用，禁止申请付款": `The supplier has been deactivated and payment application is prohibited.`,
    供应商已删除: `supplier has been deleted`,
    供应商已手动确认: `The supplier has been manually confirmed`,
    供应商已确认到账: `The supplier has confirmed the payment.`,
    供应商已确认收款: `The supplier has confirmed payment receipt`,
    "供应商已被修改，请刷新后重试": `The supplier has been modified, please refresh and try again.`,
    供应商应收: `Supplier receivable`,
    "供应商应收.csv": `supplier receivable.csv`,
    供应商应收排行: `Supplier receivables ranking`,
    "供应商或项目加载失败：": `Supplier or project loading failed:`,
    供应商报价: `Supplier quote`,
    供应商收款状态: `Supplier payment status`,
    供应商收款账户: `Supplier payment accounts`,
    供应商是否可见: `Is the supplier visible?`,
    供应商未启用或资质未通过: `The supplier is not activated or the qualification is not passed.`,
    供应商核对到账: `Confirm receipt as supplier`,
    "供应商添加并启用代理后，会显示在这里；也可切换状态筛选查看全部代理。": `After the supplier adds and enables the proxy, it will be displayed here; you can also switch the status filter to view all proxies.`,
    "供应商状态已变化，不能通过报价": `The supplier status has changed and the quote cannot be passed.`,
    "供应商状态已变化，不能通过报价调整": `The supplier status has changed. The quote adjustment cannot be approved.`,
    "供应商状态已变化，请重试": `The supplier status has changed, please try again`,
    供应商状态已更新: `Supplier status has been updated`,
    供应商确认截止时间: `Supplier confirmation deadline`,
    "供应商确认截止时间 ": `Supplier confirmation deadline `,
    "供应商确认截止时间：": `supplier confirmation deadline:`,
    供应商筛选: `Supplier Screening`,
    "供应商筛选项加载失败：": `Supplier filter item loading failed:`,
    供应商管理: `Suppliers`,
    供应商类型: `supplier type`,
    供应商编码: `supplier code`,
    "供应商编码,供应商,币种,应收,已付款,待付款,已确认到账,待确认到账,未付结算数,到账争议数,最早待付日期\r\n": `supplier code, supplier, currency, receivable, paid, pending payment, confirmed arrival, pending confirmation, number of unpaid settlements, number of disputes on arrival, earliest date to be paid\r 
`,
    供应商编码已更新: `supplier code has been updated`,
    "供应商编码缺失，不能创建资源": `The supplier code is missing and resources cannot be created.`,
    供应商详情: `supplier details`,
    供应商账号: `supplier account`,
    "供应商账号（含团队成员）": `Supplier accounts (including team members)`,
    "供应商管理员（仅主账号）": `Supplier administrators (primary accounts only)`,
    供应商资料: `supplier information`,
    "供应商资料已被修改，请刷新后重试": `The supplier information has been modified, please refresh and try again.`,
    供应商资质审核通过: `Supplier qualification review passed`,
    供应商须启用且资质已通过: `Supplier must be enabled and qualified`,
    "供应商／创建人选项加载失败：": `Supplier/creator option loading failed:`,
    便于后续识别这份交付: `facilitates subsequent identification of this delivery`,
    保存: `Save`,
    "保存{0}倍率": `Save {0} multiplier`,
    "保存中…": `Saving…`,
    保存付款服务配置: `Save payment service configuration`,
    "保存后对后续请求生效，正在执行的请求继续完成。": `is saved, it will take effect on subsequent requests, and the request being executed will continue to be completed.`,
    保存周期: `storage period`,
    保存和提交交付: `Save and submit for delivery`,
    "保存失败，请重试": `Saving failed, please try again`,
    保存并发配置: `Save concurrent configuration`,
    保存并重新登录: `Save and log in again`,
    "保存待核对观测 ": `Save observations to be verified `,
    保存方式: `saving method`,
    保存权限: `Save permission`,
    保存草稿: `Save draft`,
    "保存草稿 ": `Save draft `,
    保存观测失败: `Failed to save observation`,
    保存角色: `Save role`,
    保存设置: `Save settings`,
    保存调整: `Save adjustments`,
    保存资料: `Save information`,
    保存适用类型: `Save applicable type`,
    保存通道配置: `Save channel configuration`,
    保存配置: `Save settings`,
    保留或更新机器人: `Reserve or update robot`,
    修改个人资料: `Modify personal information`,
    修改代理配置: `Modify proxy configuration`,
    修改供应商备注: `Modify supplier remarks`,
    修改供应商编码: `Modify supplier code`,
    修改分发目标: `Modify distribution target`,
    "修改后新资源使用新编码；已创建资源的名称保持原样。": `After modification, new resources use new encoding; the names of created resources remain unchanged.`,
    修改品类参考倍率: `Modify category reference ratio`,
    修改定时任务: `Modify scheduled tasks`,
    修改密码: `Change password`,
    "修改密码 ": `Change password `,
    修改工作台展示配置: `Modify workbench display configuration`,
    修改报价: `Modify quote`,
    修改本人密码: `Change my password`,
    修改系统参数: `Modify system parameters`,
    "修改编码 ": `Modify encoding `,
    修改角色权限: `Modify role permissions`,
    "修改资料 ": `Modify information `,
    修改资源草稿: `Modify resource draft`,
    修改通知草稿: `Draft modification notice`,
    修改项目分类: `Modify project classification`,
    修订: `revision`,
    倍: `times`,
    倍率: `multiplier`,
    "倍率 / 独立价格": `multiplier/independent price`,
    倍率上限: `multiplier upper limit`,
    倍率下限: `multiplier lower limit`,
    倍率下限不能大于上限: `The lower limit of the multiplier cannot be greater than the upper limit`,
    "倍率下限和上限须为 0.1 至 100 的数值，最多两位小数": `Multiplier limits must be between 0.1 and 100, with up to two decimal places`,
    倍率和旧比例字段不能同时提交: `The multiplier and old ratio fields cannot be submitted at the same time`,
    倍率报价: `Discount quote`,
    "倍率改为 ": `multiplier changed to `,
    "倍率改为 {0} 倍": `multiplier changed to {0} times`,
    "倍率整数部分最多 6 位": `The integer part of the multiplier is up to 6 digits`,
    "倍率整数部分最多 6 位，小数部分最多 8 位": `The integer part of the multiplier is up to 6 digits, and the decimal part is up to 8 digits.`,
    "倍率最多 8 位小数": `multiplier up to 8 decimal places`,
    倍率生成时间: `multiplier generation time`,
    "倍率读取失败：": `multiplier reading failed:`,
    "倍率／单价": `multiplier/unit price`,
    "停止检测 ": `Stop detection `,
    停用: `Disable`,
    停用供应商: `Deactivate supplier`,
    "停用后，{0} 将立即退出登录且无法再次登录，历史资源和账单保留。": `Disabling {0} signs the account out immediately and prevents further sign-ins. Historical resources and bills are retained.`,
    停用汇率版本: `deactivate exchange rate version`,
    健康状态同步时间: `Health status synchronization time`,
    "允许 HTTP 时请填写有效的 HTTP 服务地址": `Please fill in a valid HTTP service address when allowing HTTP`,
    允许同一人提交并审核: `Allows the same person to submit and review`,
    "允许此 HTTP 地址": `Allow this HTTP address`,
    "允许范围 ": `allowable range `,
    "先生成登录链接，完成登录后把回调地址或 code#state 粘贴到下方；无需填写 SOCKS5。 ": `First generate the login link, and after completing the login, paste the callback address or code#state below; no need to fill in SOCKS5. `,
    "先选择供应商、项目、币种和结算日期。": `First select the supplier, project, currency and settlement date.`,
    入账原始金额: `Original amount recorded`,
    "入账已处理 ": `entry has been processed `,
    入账应付: `Account payable`,
    入账时报价: `Quote at time of entry`,
    入账状态: `entry status`,
    全局并发批次: `Global concurrent batch`,
    "全局并发批次需为 1–64 的整数": `The global concurrent batch needs to be an integer from 1–64`,
    "全局并发批次（所有目标共享）": `Global concurrent batch (shared by all targets)`,
    "全局并发须为 1–64 的整数": `Global concurrency must be an integer from 1–64`,
    全局设置版本不正确: `The global setting version is incorrect`,
    全球: `Global`,
    全选: `Select all`,
    "全选 ": `Select all `,
    "全选全部可用项目 ": `Select all available items `,
    全部: `All`,
    "全部 ": `All `,
    全部交付方式: `All delivery methods`,
    全部交付状态: `All delivery statuses`,
    全部付款进度: `All payment progress`,
    全部任务状态: `All task status`,
    全部供应商: `All suppliers`,
    全部供应商代理: `All supplier proxies`,
    全部入账状态: `All credit status`,
    全部凭据方式: `All credential methods`,
    全部创建人: `All creators`,
    全部创建账号: `All creator accounts`,
    全部协议: `All protocols`,
    全部启用账号: `Enable all accounts`,
    全部大类: `All categories`,
    全部失效原因: `All failure reasons`,
    全部审核状态: `All review status`,
    "全部已成功交付资源 {0} 条，筛选资源": `All {0} resources have been successfully delivered, filter resources`,
    "全部已读 ": `Mark all as read `,
    全部币种: `All currencies`,
    全部归属: `All ownership`,
    全部录入人: `All entries`,
    全部报价状态: `All quote status`,
    全部报价项目: `All quote items`,
    全部操作: `All operations`,
    全部操作内容: `All operation contents`,
    全部收款进度: `All payment progress`,
    全部方式: `All methods`,
    全部来源: `All sources`,
    全部模型: `all models`,
    全部消息: `All updates`,
    "全部消息 ": `All updates `,
    全部状态: `All statuses`,
    全部类型: `all types`,
    全部结果: `All results`,
    全部结算方式: `All settlement methods`,
    全部角色: `All roles`,
    全部账号合计: `All accounts combined`,
    全部账户类型: `All account types`,
    全部资源状态: `All resource statuses`,
    全部资源类型: `All resource types`,
    全部项目: `All items`,
    全额已收款: `full amount has been collected`,
    "公告 ": `Announcement `,
    六: `Sat`,
    "共 ": `total `,
    "共 {0} 个项目": `{0} items in total`,
    "共 {0} 条": `{0} items in total`,
    "共 {0} 条记录": `{0} records`,
    "共 {0} 条记录|one": `{0} record`,
    "共 {0} 项": `{0} items in total`,
    关联供应商用户: `associated supplier user`,
    关联用户: `associated user`,
    "关联记录 {0} · 点击查看完整业务信息。": `associated record {0} · Click to view complete business information.`,
    关联项目: `related projects`,
    关键词: `Keywords`,
    "关键词/模型": `keyword/model`,
    关闭: `Close`,
    "关闭 ": `Close `,
    "申请已作废，金额占用已释放": `Application voided and reserved amount released`,
    确认审核通过: `Confirm approval`,
    确认通过: `Approve`,
    "是否确认审核通过该报价？": `Are you sure you want to approve this quote?`,
    "是否确认审核通过该报价调整？": `Are you sure you want to approve this quote adjustment?`,
    重新申请付款: `Reapply for payment`,
    "该结算单尚未确认或已无可申请付款金额，请刷新后核对。": `This settlement is not confirmed or has no amount available for payment. Refresh and check it.`,
    作废申请: `Void application`,
    作废付款申请: `Void payment application`,
    关闭付款申请: `Close payment application`,
    "关闭后，新自注册供应商首次建档自动通过，无需先上传资质；已有待审资料、后台创建和后续资料变更仍需人工审核。 ": `When disabled, newly registered suppliers are approved automatically without uploading qualifications first. Existing pending profiles, accounts created by administrators and subsequent profile changes still require review. `,
    关闭提示: `Close prompt`,
    关闭被拒绝报价的调整申请: `Close the adjustment application for the rejected quote`,
    关闭页面不会停止已提交的操作: `Closing the page will not stop the submitted operation`,
    其他: `Others`,
    其他服务: `Other services`,
    其他权限: `Other permissions`,
    内置: `built-in`,
    内置任务仅支持修改周期或启停: `Built-in tasks only support modifying the cycle or starting and stopping`,
    内置角色仅允许调整待分配管理和原始请求查看权限: `Built-in roles only allow adjustment of pending management and original request viewing permissions`,
    内部备注: `internal remarks`,
    内部转账: `Internal transfer`,
    冷却中: `Cooling down`,
    凭据: `Credentials`,
    凭据交换结果待核对: `Credential exchange results need to be verified`,
    "凭据已保存，等待同步": `Credentials have been saved and are waiting for synchronization`,
    "凭据已暂存，等待保存": `Credentials have been temporarily stored and are waiting to be saved.`,
    凭据方式: `Credential method`,
    凭据方式不正确: `The credential method is incorrect`,
    凭据方式与字段不匹配: `The credential method does not match the field`,
    凭据状态提示: `Credential status prompt`,
    凭据续期提示: `Credential renewal prompt`,
    出款资金账户: `Withdrawal Fund Account`,
    分发到目标: `distributed to target`,
    分发参数不能为空: `distribution parameters cannot be empty`,
    分发失败: `distribution failed`,
    分发成功: `distributed successfully`,
    分发时授权: `Authorization when distributing`,
    分发结果状态已变化: `The distribution result status has changed`,
    分发记录: `distribution record`,
    "分发记录加载失败：": `Distribution record loading failed:`,
    "分发请求已完成，请核对目标状态": `The distribution request has been completed, please check the target status`,
    分发资源: `Distribution resources`,
    "分类汇总加载失败：": `Classification summary loading failed:`,
    分组名称: `Group name`,
    "分配失败，请稍后重试": `Allocation failed, please try again later.`,
    分配时间: `allocation time`,
    分配状态不正确: `allocation status is incorrect`,
    分配项目: `Assign project`,
    "分配项目 ": `Assign project `,
    分页参数不正确: `paging parameters are incorrect`,
    分页导航: `Paging navigation`,
    "切换到 CCMAX 会清除当前未提交资料。": `Switching to CCMAX will clear the currently unsubmitted data.`,
    切换定时任务状态: `Switch scheduled task status`,
    切换导航宽度: `Switch navigation width`,
    "切换语言会刷新页面，请先保存正在编辑的内容。": `Changing language reloads the page. Save your changes first.`,
    创建: `Created`,
    "创建 / 撤回结算单": `Create/withdraw settlement document`,
    创建中: `is being created`,
    "创建中…": `Creating…`,
    创建人: `Creator`,
    创建人归类汇总: `Creator classification summary`,
    创建代理配置: `Create proxy configuration`,
    "创建任务后才能查看执行记录。": `The execution record can only be viewed after the task is created.`,
    创建供应商: `Create supplier`,
    创建供应商团队账号: `Create a supplier team account`,
    创建供应商用户: `Create supplier user`,
    创建分发目标: `Create distribution target`,
    创建定时任务: `Create a scheduled task`,
    创建密钥: `Create key`,
    创建导出任务: `Create export task`,
    创建新用户: `Create new user`,
    创建日期: `Creation date`,
    创建日期格式不正确: `The creation date format is incorrect`,
    创建日期范围不正确: `The creation date range is incorrect`,
    创建时间: `creation time`,
    创建结算单权限已变化: `The permission to create settlement documents has changed`,
    创建角色: `Create a role`,
    创建账号: `Create account`,
    "创建账号 ": `Create account `,
    创建账号查询条件不正确: `The query conditions for creating an account are incorrect.`,
    创建资源授权会话: `Create resource authorization session`,
    创建资源草稿: `Create resource draft`,
    创建重试允许的目标源配置不正确: `The target source configuration allowed by the creation retry is incorrect.`,
    创建重试次数超出上限: `The number of creation retries exceeds the upper limit`,
    创建项目: `Create project`,
    创建项目分类: `Create project classification`,
    初始化密码: `Initial password`,
    初始密码: `Initial password`,
    "初始密码仅在本次操作后展示。请通过安全渠道交给本人；关闭后无法再次查询明文。 ": `initial password will only be displayed after this operation. Please hand it over to me through a secure channel; after closing, the clear text cannot be retrieved again. `,
    "初始密码仅在此处显示一次，请先安全保存；关闭后无法再次查看。": `is only displayed here once, please save it safely first; it cannot be viewed again after closing.`,
    "初始密码前缀只允许至多 8 个可见英文字母、数字或指定符号": `The initial password prefix only allows up to 8 visible English letters, numbers or designated symbols`,
    初始密码总长度: `Initial password length`,
    初始密码格式仅支持字母数字或含符号: `The initial password format only supports alphanumeric or symbols.`,
    "初始密码至少保留 12 位随机部分，不能使用统一固定初始密码": `The initial password must retain at least 12 random digits, and a unified fixed initial password cannot be used.`,
    初始密码长度必须符合密码策略: `The initial password length must comply with the password policy`,
    "初始密码（留空自动生成）": `Initial password (leave blank to automatically generate)`,
    删除: `Delete`,
    "删除 ": `Delete `,
    "删除中…": `Deleting…`,
    "删除失败，请重试": `Deletion failed, please try again`,
    删除资源: `Delete resources`,
    删除资源草稿: `Delete resource draft`,
    删除项目分类: `Delete project category`,
    删除项目大类: `Delete project category`,
    到账争议: `Receipt dispute`,
    刷新: `Refresh`,
    "刷新 ": `Refresh `,
    "刷新 CCMAX 来源": `Refresh CCMAX source`,
    刷新中: `Refreshing`,
    "刷新中…": `Refreshing…`,
    刷新交付结果: `Refresh delivery results`,
    刷新供应商: `Refresh supplier`,
    刷新供应商账单: `Refresh supplier bill`,
    "刷新倍率 ": `Refresh rate `,
    刷新原始金额: `Refresh the original amount`,
    刷新周期为2至3600秒: `refresh cycle is 2 to 3600 seconds`,
    刷新审计日志: `Refresh audit log`,
    刷新归属: `refresh ownership`,
    刷新待分配资源: `Refresh resources to be allocated`,
    刷新我的交付: `Refresh my delivery`,
    刷新报价: `Refresh quote`,
    "刷新授权不会解除暂停、休眠、限流或额度限制。RT 失效或未保存时，请改用「重新授权」。": `Refreshing the authorization will not lift the suspension, hibernation, current limit or quota limit. When the RT expires or is not saved, please use "Reauthorize" instead.`,
    刷新收款账户: `Refresh the payment account`,
    刷新日账: `Refresh daily account`,
    "刷新未恢复账号授权，可能没有可用 RT 或账号仍受限制。请使用重新授权，并检查账号状态。 ": `Refresh does not restore account authorization. There may be no RT available or the account is still restricted. Please use re-authorization and check the account status. `,
    刷新款项记录: `Refresh payment record`,
    刷新汇率: `Refresh exchange rate`,
    "刷新状态 ": `refresh status `,
    "刷新结果待确认。请先查询原操作，不要重复刷新；仍无法确认时可通过 OAuth 重新授权。 ": `The refresh result needs to be confirmed. Please query the original operation first and do not refresh again; if you still cannot confirm, you can re-authorize through OAuth. `,
    刷新结算单: `Refresh settlement document`,
    刷新角色: `Refresh role`,
    刷新调用日志: `Refresh call log`,
    刷新账号: `Refresh account`,
    刷新资源列表: `Refresh resource list`,
    刷新通知: `Refresh notification`,
    刷新项目: `refresh project`,
    "前 ": `ago `,
    "前完成确认或提出异议；逾期未处理将默认确认无误。 ": `; if it is not processed within the time limit, it will be confirmed by default. `,
    加减结算金额: `Add or subtract settlement amount`,
    加减金额: `Addition or subtraction amount`,
    "加减金额 ": `Addition or subtraction amount `,
    加减金额不能为零: `The addition and subtraction amount cannot be zero`,
    加减金额最多保留两位小数: `The addition and subtraction amounts must be kept to two decimal places at most.`,
    "加减金额（{0}）": `Addition or subtraction amount ({0})`,
    加载中: `Loading`,
    "加载中…": `Loading…`,
    "加载代理中…": `Loading proxy…`,
    "加载供应商失败：": `Could not load suppliers:`,
    "加载草稿失败：{0}": `Failed to load draft: {0}`,
    "加载进度中…": `Loading in progress...`,
    包含大写字母: `Contains uppercase letters`,
    包含小写字母: `Contains lowercase letters`,
    包含数字: `Contains numbers`,
    包含未知权限项: `contains unknown permission items`,
    包含符号: `Contains symbols`,
    "北京时间 · 当前筛选范围": `Beijing time · Current filtering range`,
    北京时间账单日期: `Beijing time bill date`,
    区间: `interval`,
    区间包含开始和结束当天: `range includes the starting and ending day`,
    协议: `Protocol`,
    单价: `unit price`,
    "单价改为 ": `Unit price changed to `,
    "单价改为 {0}": `Unit price changed to {0}`,
    "单价改为 {0} {1}": `Unit price changed to {0} {1}`,
    单位: `unit`,
    单位价格: `unit price`,
    "单位价格（{0} / {1}）": `unit price ({0} / {1})`,
    单密钥: `single key`,
    单张新建: `Create settlement`,
    单条更换: `single replacement`,
    单次报表范围不能超过24个月: `The scope of a single report cannot exceed 24 months`,
    "单次最多20,000条来源金额，请缩小范围": `The maximum amount from one source is 20,000, please narrow the range.`,
    "单次最多处理10万笔来源，请缩小结算范围": `A maximum of 100,000 sources can be processed at a time, please narrow the settlement scope.`,
    "单次最多导入 500 条代理": `Up to 500 proxies can be imported at a time`,
    "单次最多导出100万条日账，请缩小日期范围": `A maximum of 1 million daily accounts can be exported at a time. Please narrow the date range.`,
    "单次最多生成1000张结算单，请缩小范围": `A maximum of 1,000 settlement documents can be generated at a time, please narrow the range.`,
    "单次最多选择20,000条来源金额": `A maximum of 20,000 source amounts can be selected at a time`,
    "单目标并发须为 1–32 的整数": `Single target concurrency must be an integer from 1 to 32`,
    "单笔上限（USDT）": `Single transaction limit (USDT)`,
    "单笔上限（按付款币种）": `Single transaction limit (according to payment currency)`,
    单账号: `Per account`,
    "单账户 API Key 可留空": `Single account API Key can be left blank`,
    单资源: `single resource`,
    "占用 / 上限": `occupancy / upper limit`,
    "历史 CC lane 总费用": `History CC lane total cost`,
    历史付款: `Payment history`,
    历史价格: `price history`,
    历史入账: `Historical entry`,
    历史单据未记录: `Historical documents are not recorded`,
    历史单据未设置: `Historical documents are not set`,
    历史多项目结算: `Historical multi-item settlement`,
    历史密钥: `historical key`,
    "历史密钥未保存可查看副本，请重置生成新密钥": `The historical key is not saved and can be viewed as a copy. Please reset and generate a new key.`,
    "历史开始日期、价格及报价内容不能修改；只能调整今天或未来的结束日期": `The historical start date, price and quote content cannot be modified; only today's or future end date can be adjusted`,
    历史开始日期不可修改: `The historical start date cannot be modified`,
    "历史开始日期不可修改，只能调整今天或未来的结束日期": `The historical start date cannot be modified, only today's or future end date can be adjusted.`,
    "历史开始日期和价格已锁定；改价请复制新行。": `The historical start date and price have been locked; please copy the new row to change the price.`,
    历史归属待核对: `historical ownership needs to be verified`,
    "历史录入密钥仅用于资源录入，请在个人资料生成平台 API 密钥": `The historical entry key is only used for resource entry. Please generate the platform API key in your personal data.`,
    历史总费用: `Historical total cost`,
    历史报价: `historical quote`,
    "历史报价不能修改或提交，请选择今天或未来日期": `Historical quotes cannot be modified or submitted, please select today or a future date`,
    "历史报价不能修改，可复制后提交今天或未来的新报价。": `historical quotes cannot be modified, but can be copied and submitted for new quotes today or in the future.`,
    "历史报价不能修改，结束日期不能早于北京时间今天": `historical quote cannot be modified, and the end date cannot be earlier than today, Beijing time`,
    "历史报价不能修改，请提交今天或未来的新报价": `Historical quotations cannot be modified, please submit a new quote today or in the future.`,
    "历史报价不能修改；请复制后提交今天或未来的报价": `Historical quotations cannot be modified; please copy and submit today's or future quotations`,
    "历史报价不能申请修改。": `Historical quotations cannot be modified.`,
    历史报价依据缺失: `Historical quote basis is missing`,
    "历史报价开始日期不能修改，只能调整今天及未来的结束日期和价格": `The start date of historical quote cannot be modified, only the end date and price of today and the future can be adjusted.`,
    历史授权: `Historical authorization`,
    历史期间总费用来源: `Source of total expenses in historical period`,
    历史未记录: `History not recorded`,
    "历史流程单据仅供核对，不自动转换供应商确认结果": `Historical process documents are only for verification and do not automatically convert supplier confirmation results.`,
    "历史确认 CCMAX 日账": `Historical Confirmation CCMAX Daily Account`,
    历史账户: `historical account`,
    历史资源: `Historical Resources`,
    历史银行账户: `Historical bank account`,
    原CCMAX目标不可用: `The original CCMAX target is unavailable`,
    "原交付报价快照缺失，请人工核对后补交": `The original delivery quote snapshot is missing, please manually check and resubmit.`,
    "原价延长原报价周期，遇待审报价跳过并提示": `Extend the quote at its current price. Skip quotes with pending reviews and report them.`,
    原因: `Reason`,
    原始消耗: `original consumption`,
    "原始消耗已修订，保留原结算金额，须处理差额": `The original consumption has been revised, the original settlement amount is retained, and the difference must be processed`,
    "原始状态 ": `original condition `,
    原始请求: `original request`,
    原始金额: `original amount`,
    "原始金额合计 ": `Total original amount `,
    "原始金额和最终应付包含待确认及已确认结算；已确认应付、已付款和待付款只按供应商已确认结算统计。 ": `The original amount and final payable include pending and confirmed settlement; confirmed payable, paid and pending payment are only counted according to the supplier's confirmed settlement. `,
    原始金额币种: `Original amount currency`,
    "原始金额所属期间不正确，最长一年": `The period to which the original amount belongs is incorrect, up to one year`,
    原始金额最多8位小数: `The original amount can have up to 8 decimal places.`,
    原始金额状态: `Original amount status`,
    原始金额状态不正确: `The original amount status is incorrect`,
    原始金额请求字段不完整: `The original amount request field is incomplete`,
    "原始金额（完整精度）": `Original amount (full accuracy)`,
    "原操作尚未确认可重新授权，请先查询原操作进度": `The original operation has not been confirmed and can be reauthorized. Please check the progress of the original operation first.`,
    原有效期: `Previous validity period`,
    原目标已停用: `The original target has been deactivated`,
    原账户: `original account`,
    "原账户 ": `original account `,
    "原资源已变化，请核对交付结果": `The original resources have changed, please check the delivery results`,
    去付款: `Make payment`,
    去补充: `Complete information`,
    参与品类对比: `Participate in category comparison`,
    "参数已被修改，请刷新重试": `The parameters have been modified, please refresh and try again.`,
    "参考 1 {0} = ¥{1} · V{2} · 仅供参考": `Reference 1 {0} = ¥{1} · V{2} · For reference only`,
    "参考 RPM": `Reference RPM`,
    "参考 TPM": `reference TPM`,
    参考数据: `Reference data`,
    参考数据品类: `reference data category`,
    参考汇率: `Reference exchange rate`,
    参考汇率读取失败: `Could not load reference exchange rates`,
    "参考金额约 {0} {1}": `Reference amount: approximately {0} {1}`,
    "发布 ": `released `,
    "发布中…": `is releasing...`,
    "发布后将立即发送给“": `will be sent to "`,
    发布时间: `release time`,
    发布汇率版本: `releases exchange rate version`,
    发布系统通知: `Release system notification`,
    发布通知: `release notice`,
    "发布通知 ": `release notice `,
    发起付款: `initiate payment`,
    发起付款请求: `Initiate payment request`,
    发起代理更换: `Initiate proxy replacement`,
    发起已有账号重新授权: `Initiate reauthorization of existing accounts`,
    发起强制刷新授权: `Initiate forced refresh authorization`,
    发起目标授权: `Initiate target authorization`,
    发起资源分发: `Initiate resource distribution`,
    发送结果未确认: `The sending result is not confirmed`,
    取消: `Cancel`,
    "取消 ": `Cancel `,
    "取消 / 登记失败": `Cancellation/Registration failed`,
    取消付款申请: `Cancel payment application`,
    取消本页全选: `Cancel all selections on this page`,
    取消申请: `Cancel application`,
    变更供应商资料: `Change supplier information`,
    变更前: `before change`,
    变更原因: `Reason for change`,
    变更后: `after change`,
    "变更审核中，当前账户仍有效": `The change is under review, the current account is still valid`,
    变更已有账户: `Change existing account`,
    "另有 ": `also `,
    只可作废尚未用于结算的原始金额: `Only the original amount that has not been used for settlement can be voided`,
    "只有供应商本人可确认到账，平台登记付款不等于供应商确认到账": `Only the supplier himself can confirm the payment. Registration of payment on the platform does not mean the supplier confirms the payment.`,
    只能修改待审核报价: `can only modify the quote pending review`,
    只能修改自己提交的报价: `can only modify the quote submitted by itself.`,
    "只能关联尚未绑定供应商且启用的供应商用户，不能转换平台人员或抢占其他供应商账号": `can only be associated with enabled supplier users who have not been bound to a supplier, and cannot switch platform personnel or seize other supplier accounts.`,
    只能关闭待审或已批但未登记付款的申请: `Only applications that are pending review or have been approved but have not been registered for payment can be closed.`,
    只能分配本供应商报价已通过且未到期的项目: `can only allocate projects whose quotations from this supplier have been approved and have not yet expired.`,
    只能发布草稿通知: `Only draft notifications can be issued`,
    只能变更当前已通过的账户: `Only the currently passed account can be changed.`,
    "只能拒绝已通过报价，请刷新后重试": `can only reject the passed quote, please refresh and try again.`,
    只能指定启用中的平台运营: `Only enabled platform operations can be specified.`,
    只能撤回当前版本且尚未获供应商确认的结算单: `Only the current version of the settlement document that has not been confirmed by the supplier can be withdrawn.`,
    只能撤回待审核报价: `can only withdraw the quote pending review`,
    只能撤回自己提交的报价: `You can only withdraw the quote you submitted.`,
    只能编辑草稿通知: `Only draft notifications can be edited`,
    只能调整尚未确认的当前流程结算单: `Only the current process settlement document that has not yet been confirmed can be adjusted.`,
    只读: `read only`,
    只读测试连接: `read-only test connection`,
    "可交付项目加载失败：": `Deliverable project loading failed:`,
    "可交付项目查询失败：{0}": `Deliverable item query failed: {0}`,
    "可以立即发布，也可以先保存为草稿。": `Can be published immediately or saved as a draft first.`,
    "可使用原操作和完全相同的输入继续保存，不会重新交换凭据。": `The original operation and the exact same input can be used to continue saving without re-exchanging credentials.`,
    "可先创建用户，在新建供应商时关联；关联前不能登录": `You can create a user first and associate it when creating a new supplier; you cannot log in before association.`,
    "可先生成授权链接；补充代理后请重新生成链接再正式提交。": `You can generate an authorization link first; after adding proxies, please regenerate the link before submitting it officially.`,
    "可在启用或运行时修改，下一轮执行生效": `can be modified when enabling or running, and will take effect in the next round of execution.`,
    "可提供账号数（个）": `Number of available accounts`,
    可操作项目: `operable items`,
    可正常生成: `can be generated normally`,
    可生成: `can generate`,
    可生成金额: `Settlement amount`,
    可结算笔数: `Eligible entries`,
    可见: `visible`,
    "可设置 2 至 3600 秒的整数周期。": `can set an integer period from 2 to 3600 seconds.`,
    "可设置 2 至 3600 秒的整数周期，工作台页面每 10 秒读取本系统快照。": `can set an integer period from 2 to 3600 seconds, and the workbench page reads a snapshot of this system every 10 seconds.`,
    "可调整待分配管理和原始请求查看权限。其余内置权限只读。": `can adjust the management and original request viewing rights to be assigned. The remaining built-in permissions are read-only.`,
    可选: `Optional`,
    可选前缀: `Optional prefix`,
    "可选，提醒中展示的工作台链接。": `Optional, the workbench link displayed in the reminder.`,
    "各品类独立配置 0.1 至 100 的区间，最多两位小数；0.1 倍为实际值的 10%，工作台 RPM 向上取整显示。 ": `Set a range from 0.1 to 100 with up to two decimal places for each category. A 0.1 multiplier means 10% of the actual value; workbench RPM is rounded up. `,
    合作启用中: `cooperation is activated`,
    合作状态: `Cooperation status`,
    合计: `Total`,
    "合计包含全部 ": `Total includes all `,
    "同一付款已绑定其他通道，不能重新出款": `The same payment has been bound to other channels and cannot be withdrawn again.`,
    "同一供应商/项目/币种已有重叠期间原始金额；日/月重复推送会重复计价，请先核对或作废未分配记录": `The same supplier/project/currency already has the original amount for the overlapping period; repeated push on a daily/monthly basis will result in repeated pricing. Please check or invalidate the unallocated records first.`,
    "同一供应商、项目同一时间只生效一条报价，跨期间保持同一币种。今天调价今天生效，历史价格不变；未来调价按所选日期生效。待审调整和已排期的后续价格会显示在列表中，页面打开时自动更新。 ": `Only one quote for the same supplier and project is valid at the same time, and the same currency is maintained across periods. Today's price adjustment takes effect today, and the historical price remains unchanged; future price adjustments will take effect on the selected date. Pending adjustments and scheduled follow-up prices are displayed in the list, which is automatically updated when the page is opened. `,
    "同一供应商和项目下保持唯一，用于防止重复结算": `remains unique under the same supplier and project to prevent repeated settlement`,
    同一供应商和项目只能使用一个报价币种: `The same supplier and project can only use one quote currency.`,
    同一供应商和项目在该时间段已有待审核或已通过报价: `The same supplier and project have been pending review or quote has been approved during this time period`,
    "同一天、同一站点和币种只能记一次。": `The same day, same site and currency can only be recorded once.`,
    "同一币种对自动递增版本号，历史版本不可修改。": `The version number of the same currency pair is automatically incremented, and the historical version cannot be modified.`,
    同一幂等键不能用于不同付款请求: `The same idempotent key cannot be used for different payment requests`,
    同一提交编号不能用于不同内容: `The same submission number cannot be used for different content`,
    "同一操作不能更换凭据，请先查询原操作": `Credentials cannot be changed for the same operation. Please check the original operation first.`,
    "同一操作不能更换凭据，请查询原操作结果": `Credentials cannot be changed for the same operation, please check the original operation results.`,
    "同一支付事件编号的内容不同，拒绝覆盖": `The contents of the same payment event number are different and coverage is refused.`,
    同一目标版本的查询来源不一致: `Query sources of the same target version are inconsistent`,
    "同一目标的 lane 被多个资源占用，需人工核对": `The lane of the same target is occupied by multiple resources and requires manual verification.`,
    "同一请求的资源或代理已变化，请先查看原操作记录": `The resource or proxy for the same request has changed. Please check the original operation record first.`,
    同一请求键不能用于不同内容: `The same request key cannot be used for different content`,
    "同一账号创建的资源按类型汇总，币种分别统计": `Group resources by creator account and resource type, with separate totals for each currency.`,
    "同名项目 {0}": `Project with the same name {0}`,
    "同品类有效来源按较高值提供参考数据。": `Valid sources of the same category provide reference data based on higher values.`,
    同币种: `same currency`,
    "同币种按 1 折算 · 仅供参考": `The same currency is converted at 1 · For reference only`,
    同币种无需维护汇率版本: `No need to maintain the exchange rate version of the same currency`,
    "同币种汇率必须为 1": `The exchange rate of the same currency must be 1`,
    "同币种，无换汇": `Same currency, no exchange`,
    "同时调价 ": `Price adjustment at the same time `,
    同步: `synchronization`,
    "同步中…": `Synchronizing...`,
    名次: `ranking`,
    名称: `Name`,
    名称或编号: `name or number`,
    "名称（选填）": `Name (optional)`,
    "后仍未确认，请联系平台核对。": `, please contact the platform for verification.`,
    "后台正在处理，关闭页面后仍会继续。可在“最近批量结算”查看结果。": `is being processed in the background and will continue after closing the page. The results can be viewed in "Latest Batch Settlement".`,
    "后台生成 · 文件保留 7 天": `Background generation · File retention for 7 days`,
    后显示人民币折算: ` to see the CNY reference amount`,
    后查看人民币折算: ` to view the CNY reference amount`,
    "后续 {0} {1} · {2} 起": `Follow-up {0} {1} · {2} onwards`,
    "后续 {0} · {1} 起": `Upcoming {0} · From {1}`,
    "后续 {0} 倍 · {1} 起": `Subsequent {0} times · Starting from {1}`,
    "后续处理失败 ": `Follow-up processing failed `,
    "后续处理进行中（": `follow-up processing is in progress (`,
    "向 CCMAX 创建资源": `Create resources to CCMAX`,
    否: `No`,
    "含 ": `includes `,
    "含 code 参数的回调地址": `callback address containing code parameter`,
    "含异常，见明细": `Contains issues; see details`,
    含税: `Tax included`,
    含税口径: `Tax treatment`,
    启用: `Enable`,
    "启用 ": `Enable `,
    "启用 / 停用供应商": `Enable/disable supplier`,
    启用中: `Enabled`,
    启用供应商: `Enable supplier`,
    "启用后，{0} 可重新登录，原角色和所属供应商保持不变。": `is enabled, {0} can log in again, and the original role and supplier will remain unchanged.`,
    "启用后，供应商可在 CCMAX 交付中选择此目标。": `When enabled, suppliers can select this target for CCMAX delivery.`,
    启用目标: `Enable target`,
    启用采集: `Enable collection`,
    周期开始: `cycle starts`,
    周期结束: `End of cycle`,
    周期结算: `Periodic Settlement`,
    周结: `Weekly`,
    品类: `Category`,
    "品类展示参数已变化，请刷新": `Category display parameters have changed, please refresh`,
    "品类读取失败：": `Category reading failed:`,
    响应: `response`,
    四: `Thu`,
    回填并创建目标资源: `Backfill and create target resources`,
    "回调地址或 code#state": `callback address or code#state`,
    团队成员: `Team members`,
    团队成员创建成功: `Team member created successfully`,
    团队成员只能选择本人创建的代理: `Team members can only choose proxies created by themselves`,
    团队成员请由供应商创建: `team members please be created by the supplier`,
    团队成员请选择代理配置: `Team members please select proxy configuration`,
    固定单价: `Fixed unit price`,
    "国家 / 地区": `Country/Region`,
    国家或地区: `country or region`,
    "国际汇款 SWIFT": `International Remittance SWIFT`,
    图表类型: `chart type`,
    在线: `Online`,
    在线状态筛选无效: `Online status filtering is invalid`,
    "地址加密保存，保存不会发送测试消息。": `address is encrypted and saved, and no test message will be sent when saved.`,
    "地址已加密保存，不会回显；留空保留，填写新地址则替换。": `The address is stored encrypted and is not displayed. Leave this blank to keep it, or enter a new address to replace it.`,
    "地址格式异常，展开完整资料查看": `The address format is abnormal, expand the complete information to view`,
    "均 ": `average `,
    基准币种: `base currency`,
    基准币种与报价币种不能相同: `The base currency and quote currency must be different.`,
    基准金额: `Base amount`,
    "基准金额最多 8 位小数": `The base amount can have up to 8 decimal places.`,
    基本资料: `Basic information`,
    基础角色: `Base role`,
    "填写 1-365 天；结算单的实际起止日期仍在创建时确认": `Fill in 1-365 days; the actual start and end dates of the settlement document are still confirmed when creating`,
    "填写个人联系信息和供应商主体资料。 ": `Enter your contact information and supplier profile. `,
    "填写原始金额后，系统按该供应商和项目的有效报价计算应付。提交后进入待结算，付款仍需先完成供应商金额确认。": `After filling in the original amount, the system calculates the payable amount based on the valid quote of the supplier and project. After submission, the payment will proceed to pending settlement. The payment still needs to be confirmed by the supplier first.`,
    填写实际交付的账号名称: `Fill in the actual delivery account name`,
    "填写审核意见，退回时必填": `Fill in the review comments, required when returning`,
    "填写拒绝原因，最多500字": `Fill in the reason for rejection, up to 500 words`,
    填写时需为有效邮箱格式: `must be filled in in a valid email format`,
    "增加一条 ": `Add one `,
    处理中: `is being processed`,
    "处理中…": `Processing…`,
    处理参考: `processing reference`,
    处理结果: `processing result`,
    备注: `Remarks`,
    备注不能超过2000字: `Remarks cannot exceed 2000 words`,
    备注已保存: `Remarks have been saved`,
    "备注最多 300 字": `Remarks can be up to 300 words.`,
    备注过长: `Remark is too long`,
    复制: `Copy`,
    "复制 ": `Copy `,
    "复制为新行 ": `Copy as new line `,
    "复制失败，请手动复制授权链接。": `Copy failed, please copy the authorization link manually.`,
    "复制失败，请手动选中授权链接复制": `Copy failed, please manually select the authorization link to copy`,
    "复制失败，请显示后手动复制。": `Copy failed, please copy manually after display.`,
    "复制失败，请选中授权链接后手动复制": `Copy failed, please select the authorization link and copy manually`,
    "复制失败，请选择内容手动复制": `Copy failed, please select content to copy manually`,
    "复制密钥 ": `copy key `,
    "复制新行 ": `Copy new line `,
    "复制链接 ": `Copy link `,
    复制项目: `Copy project`,
    外部接收: `external reception`,
    外部金额: `External amount`,
    "多个地址请逐行使用 Key----Endpoint 配对": `Please use Key----Endpoint pairing line by line for multiple addresses.`,
    多个模型用逗号分隔: `Multiple models separated by commas`,
    多密钥: `multiple keys`,
    大写字母: `capital letters`,
    大类名称: `Category name`,
    "大类名称须为1-80字": `Category name must be 1-80 words`,
    大类码值: `large category code value`,
    "大类码值须为2-40位字母、数字、下划线或短横线，名称须为1-80字": `Category code value must be 2-40 letters, numbers, underscores or dashes, and name must be 1-80 characters`,
    "大类选项在“维护大类码值”中新增和启停": `Add or enable project categories in Manage project categories.`,
    "天存在采集异常。本次只结算已拉取的日账，不代表该期间已全部结清。 ": `There is a collection exception on day 7. This time, only the daily accounts that have been pulled will be settled, which does not mean that all the accounts have been settled during the period. `,
    "天存在采集异常，金额仅包含已拉取的日账；遗漏账单补齐后可再次结算。 ": ` days with collection errors. Amounts include only collected daily bills; missing bills can be settled later. `,
    失效原因: `failure reason`,
    "失效原因加载中…": `Failure reason is loading...`,
    失效原因加载失败: `Failure reason loading failed`,
    失效原因查询条件不正确: `Failure cause query condition is incorrect`,
    "失效原因选项加载失败：": `Failure reason option loading failed:`,
    失败: `failed`,
    "失败 ": `failed `,
    "失败后收到成功结果，需人工对账，禁止自动重记或再次出款": `After receiving a successful result after failure, manual reconciliation is required, and automatic re-recording or re-withdrawal is prohibited.`,
    失败或待核对: `failed or needs to be verified`,
    失败或部分完成: `failed or partially completed`,
    套餐与额度: `Package and Quota`,
    套餐信息: `package information`,
    套餐名称: `package name`,
    套餐未提供: `package not provided`,
    套餐检查时间: `package check time`,
    套餐类型: `Plan type`,
    "如 BILLING_VIEWER": `such as BILLING_VIEWER`,
    "如 TRX、BSC、ETH": `such as TRX, BSC, ETH`,
    "如 USDT-TRC20": `as USDT-TRC20`,
    "如提交响应中断，可保持选择后重试查询同一请求，或先查看更换记录；系统不会重复创建同一操作。 ": `If the submission response is interrupted, you can keep the selection and retry the query for the same request, or check the replacement record first; the system will not create the same operation repeatedly. `,
    "如账户需要 Travel Rule 问卷，连接检测会明确提示，未配置前不会发起提币。": `If the account requires a Travel Rule questionnaire, the connection detection will clearly prompt, and no currency withdrawal will be initiated before configuration.`,
    姓名: `Name`,
    "姓名 / 显示名称": `Name/Display name`,
    "字母、数字及 . _ @ -，至少 3 位": `Use at least 3 characters: letters, numbers, or . _ @ -`,
    "字母、数字和符号": `Letters, numbers and symbols`,
    字母和数字: `letters and numbers`,
    "存在无法确定类型的资料，请选择资源类型后重新识别": `There is data whose type cannot be determined. Please select the resource type and re-identify it.`,
    "存在未配对的 Key，请为每行补充 Key----Endpoint": `There is an unpaired Key. Please add Key----Endpoint for each line.`,
    安全记录: `safety record`,
    完善首次登录资料: `Complete first login information`,
    完成: `completed`,
    "完成授权并分发 ": `completes authorization and distribution `,
    完成目标授权: `Complete target authorization`,
    "完整 API 密钥": `Full API Key`,
    完整链接: `full link`,
    定时任务: `Scheduled tasks`,
    定时任务子菜单: `Scheduled task submenu`,
    实际付款币种: `Actual payment currency`,
    "实际代理绑定未确认，请平台核对，勿重复提交": `The actual proxy binding has not been confirmed. Please check with the platform and do not submit again.`,
    审核: `Review`,
    "审核 / 调价": `Review / adjust price`,
    审核付款申请: `Review payment application`,
    "审核前原期间和价格继续生效，历史费用不变。": `The original period and price before the review will continue to be effective, and the historical fees will remain unchanged.`,
    审核意见: `Review notes`,
    "审核意见：": `review comments:`,
    审核报价: `Review quote`,
    审核操作: `Audit operation`,
    审核收款账户: `Review the payment account`,
    审核改价: `Review price change`,
    审核调价: `Review price change`,
    "审核调价 ": `Review price change `,
    审核资料: `Audit information`,
    审核通过: `Approve`,
    审核通过后才可用于收款: `can only be used for collection after passing the review.`,
    审计日志: `Audit log`,
    "审计连接无法中断，待写原文继续保留": `The audit connection cannot be interrupted, and the original text to be written will continue to be retained.`,
    密码: `Password`,
    "密码 UTF-8 编码不能超过 72 字节，避免 BCrypt 截断": `password UTF-8 encoding cannot exceed 72 bytes to avoid BCrypt truncation`,
    密码不能含控制字符: `Password cannot contain control characters`,
    密码已重置: `Password has been reset`,
    "密码最短长度为 8—64，最长长度不超过 72，且不小于最短长度": `The minimum password length is 8-64, the maximum length does not exceed 72, and is not less than the minimum length`,
    密码策略: `Password Policy`,
    "密码规则读取失败。 ": `Failed to read password rules. `,
    "密码还缺少：": `password is still missing:`,
    密码重置成功: `Password reset successful`,
    "密码长度不符合当前策略（": `The password length does not comply with the current policy (`,
    "密码需为 {0}{1}。": `Password needs to be {0}{1}.`,
    密钥名称: `key name`,
    密钥已撤销: `Key has been revoked`,
    "密钥已撤销或到期，请重置后使用": `The key has been revoked or expired, please reset it before use.`,
    密钥已生成: `key has been generated`,
    "密钥已被重置或撤销，请刷新列表": `The key has been reset or revoked, please refresh the list`,
    密钥已重置: `Key has been reset`,
    密钥数量: `Number of keys`,
    密钥聚合模式: `key aggregation mode`,
    "密钥记录不一致，请联系管理员": `Key records are inconsistent, please contact the administrator`,
    对应报价: `corresponding quote`,
    对应结算单: `corresponding settlement document`,
    "对应账单 / 记录": `corresponding bill/record`,
    对象类型: `object type`,
    "导入中…": `Importing...`,
    "导入代理-": `Import Proxy-`,
    导入参数不完整: `The imported parameters are incomplete`,
    导入有效项: `Import valid items`,
    导入结算数据: `Import settlement data`,
    "导出 CSV ": `Export CSV `,
    "导出{0}": `Export{0}`,
    导出任务: `Export jobs`,
    导出任务不存在: `The export task does not exist`,
    "导出任务已创建，可继续操作页面，完成后在导出任务中下载。": `The export task has been created. You can continue to operate the page and download it in the export task after completion.`,
    导出任务状态: `Export task status`,
    导出任务类型: `Export task type`,
    导出分片大小不正确: `The exported fragment size is incorrect`,
    导出列数不一致: `The number of exported columns is inconsistent`,
    导出参数不完整: `Incomplete export parameters`,
    "导出存储空间不足，请稍后重试": `Insufficient export storage space, please try again later.`,
    导出当前筛选的全部明细: `Export all details of the current filter`,
    导出当前筛选的全部汇总: `Export all summary of current filtering`,
    导出报表: `Export report`,
    "导出报表 CSV": `Export report to CSV`,
    导出文件不存在: `The export file does not exist`,
    "导出文件尚未生成，请稍后查看任务": `The export file has not been generated yet, please check the task later.`,
    "导出文件已过期，请重新导出": `The export file has expired, please re-export it.`,
    导出文件校验失败: `The export file failed integrity verification.`,
    "导出文件过大或存储空间不足，请缩小日期范围": `The exported file is too large or there is insufficient storage space. Please reduce the date range.`,
    导出文件预览: `Export file preview`,
    "导出明细 ": `Export details `,
    "导出未完成，请重新导出；若重复失败请联系管理员": `The export did not complete. Try again; contact an administrator if it fails repeatedly.`,
    导出格式: `export format`,
    "导出汇总 ": `Export summary `,
    导出目录不能是符号链接: `The export directory cannot be a symbolic link`,
    导出结算单: `Export settlement document`,
    导出结算明细: `Export settlement details`,
    导出行数核对不一致: `The export row count did not match.`,
    导出预览: `export preview`,
    "将为 ": `will be `,
    "将每个窗口剩余百分比相加；不同套餐的实际容量不同，仅作参考": `Add the remaining percentage of each window; the actual capacity of different packages is different, for reference only`,
    "将立即结束 ": `This immediately ends `,
    小写字母: `lowercase letters`,
    尚不能确认目标已拒绝创建: `It is not possible to confirm that the target has refused to create`,
    尚无可查询的目标关联: `There is no query target association yet`,
    "尚无金额修订。": `.`,
    尚未上传资质材料: `Qualification materials have not been uploaded yet`,
    尚未使用: `not used yet`,
    尚未分配: `has not been allocated yet`,
    尚未完成取数: `Number retrieval has not been completed yet`,
    尚未开始: `has not started yet`,
    尚未执行只读连接测试: `The read-only connection test has not been performed yet`,
    尚未查到操作: `No operation found yet`,
    尚未添加内部备注: `No internal remarks have been added yet`,
    尚未添加收款账户: `No payment account has been added yet`,
    尚未生成: `has not been generated yet`,
    尚未登记: `has not been registered yet`,
    尚未确认: `Not yet confirmed`,
    尚未获供应商确认: `has not been confirmed by the supplier`,
    "尚未配置真实支付通道。当前可人工登记实际付款；本地测试可显式启用模拟通道。 ": `The real payment channel has not been configured yet. Actual payments can currently be manually registered; local testing can explicitly enable simulated channels. `,
    尚未验证: `Not yet verified`,
    就绪: `ready`,
    "就绪 / 总数": `ready/total`,
    展开: `Expand`,
    展开全部: `Expand all`,
    展示项目: `display project`,
    工作台: `Workbench`,
    工作台地址: `workbench address`,
    工作台展示配置已保存: `Workbench display configuration has been saved`,
    工作台待办企业微信提醒: `Workbench reminders via WeCom`,
    工作台监控配置: `workbench monitoring configuration`,
    工作台运行数据: `Workbench operating data`,
    已上号: `has been numbered`,
    已交付: `delivered`,
    "已人工核实本次未创建成功，可编辑后重新提交或删除记录。": `It has been manually verified that the creation was not successful this time. You can edit and resubmit or delete the record.`,
    已付款: `Paid`,
    已付清: `paid in full`,
    已作废: `has been invalidated`,
    "已作废，来源单号仍保留用于防重": `has been invalidated, and the source order number is still retained for prevention of redundancy.`,
    "已保存 ": `saved `,
    "已保存；查询范围已覆盖，金额仍未封账。": `has been saved; the query range has been covered, but the amount has not been closed.`,
    已停止: `has been stopped`,
    已停用: `Disabled`,
    "已停用，本轮收尾中": `has been deactivated and this round is being concluded.`,
    已入账: `Accrued`,
    已入账应付: `has been accounted for and payable`,
    "已入账应付与待计价试算分别列示；当天数据未完结。缺少报价的记录保留原始金额并注明原因。 ": `The accounts payable and the trial calculation to be priced are presented separately; the data for the day is not completed. Records with missing quotes retain the original amount and indicate the reason. `,
    已入账应收: `Accrued receivables`,
    已入账记录缺少应付金额: `The accounted record lacks the amount payable`,
    已入账金额: `Amount recorded`,
    已全部标记为已读: `All marked as read`,
    已冻结旧来源: `The old source has been frozen`,
    已分配: `assigned`,
    已到期: `has expired`,
    "已占用 {0}/{1}": `occupied {0}/{1}`,
    已发布: `has been released`,
    已发起: `has been initiated`,
    "已发起目标创建，结果待确认": `Target creation has been initiated, the result is to be confirmed`,
    "已发起结算，等待供应商确认金额": `Settlement has been initiated, waiting for the supplier to confirm the amount`,
    已发送: `Sent`,
    "已发送至 {0} 个账号": `has been sent to {0} accounts`,
    已取消: `Canceled`,
    已启用: `Enabled`,
    已复制: `copied`,
    已失败: `failed`,
    已完成: `Completed`,
    "已完成 {0} / {1} · 正常 {2} · 失败 {3} · 请求失败 {4} · 无检测权限 {5}": `Completed {0} / {1} · Normal {2} · Failed {3} · Request failed {4} · No detection permission {5}`,
    已完成付款: `Payment completed`,
    "已导入 {0} 条；跳过 {1} 条{2}": `{0} items imported; {1} items {2} skipped`,
    已应用的筛选: `Filter applied`,
    已强制登出: `Forced logout`,
    "已录入 {0} 条，重复 {1} 条；应付金额由服务端按报价计算": `{0} items have been entered, and {1} items are repeated; the amount payable is calculated by the server based on the quote.`,
    已成功: `has been successful`,
    已成功交付: `has been successfully delivered`,
    已拉取的真实消耗合计: `The total real consumption that has been pulled`,
    已拉取账单: `The bill has been pulled`,
    已拦截: `intercepted`,
    已推送: `has been pushed`,
    已提交: `submitted`,
    已撤回: `Withdrawn`,
    "已撤回，原始金额重新可选": `has been withdrawn, the original amount can be re-selected`,
    已撤销: `Canceled`,
    已明确允许: `explicitly allowed`,
    "已是目标 ": `is already a target `,
    已是目标代理: `is already the target proxy`,
    "已显示 ": `is shown `,
    已暂停: `Paused`,
    已更新: `updated`,
    已替代价格: `has replaced the price`,
    已替换: `has been replaced`,
    "已有2个未完成的导出任务，请等待或取消后再试": `There are 2 unfinished export tasks. Please wait or cancel and try again.`,
    已有代理: `already has an proxy`,
    已有供应商用户: `already has supplier users`,
    "已有待审资料，请先等待审核或退回": `There is already data waiting for review. Please wait for review or return it.`,
    已有目标凭据仅能用于同一站点源地址: `Existing target credentials can only be used for the same site source address`,
    已有账号重新授权: `Already have an account re-authorized?`,
    "已有账号？返回登录": `Already have an account? Return to login`,
    已查询通道状态: `Channel status has been queried`,
    "已标记删除，列表中已隐藏": `has been marked for deletion and hidden in the list`,
    已核实到账: `has been verified and received`,
    "已核对 ": `verified `,
    "已核对绑定 · 服务待验证": `Binding verified · Service pending verification`,
    "已满 ": `is full `,
    已生成: `has been generated`,
    "已生成 {0} 张": `{0} created`,
    "已生成 {0} 张结算单": `{0} settlement documents have been generated`,
    "已生成授权链接，等待提交授权码": `Authorization link has been generated, waiting for submission of authorization code`,
    已用: `used`,
    "已用 ": `used `,
    "已用 {0}%": `{0}% used`,
    已登记付款: `Payment has been registered`,
    "已登记付款，请核对到账": `Payment has been registered, please check the payment.`,
    "已登记线下付款，已通知供应商确认到账": `Offline payment has been registered and the supplier has been notified to confirm the payment.`,
    已确认: `Confirmed`,
    已确认到账: `has been confirmed.`,
    "已确认到账的记录不能反向覆盖，请联系平台核对差异": `Confirmed records cannot be overwritten in reverse. Please contact the platform to check the difference.`,
    已确认应付: `Confirmed payable`,
    已确认应收: `Receivables confirmed`,
    已确认收款: `Payment confirmed`,
    已移除: `removed`,
    "已筛选 ": `filtered `,
    已纳入结算: `has been included in the settlement`,
    "已续期 ": `has been renewed `,
    已自动计价入账的原始金额: `The original amount that has been automatically calculated and recorded`,
    "已自动重试1次，交付暂未完成，自动处理已结束，请协助处理。": `has been automatically retried once. The delivery has not been completed yet. The automatic processing has ended. Please assist in processing.`,
    已被后续凭据更新替代: `has been replaced by subsequent credential updates`,
    已记下这笔营业额: `This turnover has been recorded`,
    已记录: `has been recorded`,
    "已识别资料，请核对后提交交付": `The information has been identified, please check and submit for delivery.`,
    已识别资源: `Resource identified`,
    "已读取 {0} 条": `{0} items read`,
    "已读取最新配置：该目标 ": `The latest configuration has been read: this target `,
    "已读取：": `has read:`,
    "已超过确认截止时间，系统已按规则自动确认": `The confirmation deadline has passed and the system has automatically confirmed according to the rules.`,
    "已跳过 ": `skipped `,
    "已跳过 {0} 组归属冲突 lane / {1} 条资源；其余可采集资源已处理": `{0} group ownership conflict lane / {1} resources have been skipped; the remaining collectible resources have been processed`,
    已过期: `has expired`,
    "已进入支付通道，不可改为线下登记；请查询原通道结果": `has entered the payment channel and cannot be changed to offline registration; please check the original channel results`,
    "已进入支付通道，不可用人工登记覆盖结果；请查询通道状态": `has entered the payment channel, and manual registration cannot be used to overwrite the results; please check the channel status`,
    已退回: `Rejected`,
    已退回核对: `has been returned for verification`,
    已退回补充: `has been returned for supplement`,
    "已选 ": `Selected `,
    "已选 {0} 家供应商 · 可生成 {1} 张结算单": `{0} suppliers selected · {1} settlement documents can be generated`,
    "已选{0}": `Selected {0}`,
    已选供应商: `selected supplier`,
    已选创建人: `Selected creator`,
    "已选开始：{0}，请选择结束日期": `Selected start: {0}, please select an end date`,
    已选择: `selected`,
    "已选择 {0} 条 CCMAX 资源": `{0} CCMAX resources have been selected`,
    已选项目: `selected items`,
    "已选：": `Selected:`,
    已通过: `Approved`,
    已配置: `configured`,
    "已配置{0}": `configured {0}`,
    "已配置，留空保留原地址": `has been configured, leave it blank to retain the original address`,
    "已配置，留空表示保留": `has been configured, leave blank to reserve`,
    "已采集 ": `has been collected `,
    已重新发起授权: `Authorization has been reinitiated`,
    币安: `Binance`,
    "币安 USDT 收款地址": `Binance USDT payment address`,
    "币安 USDT 链上提币，执行前实时校验余额、网络和手续费。": `Withdraw coins on the Binance USDT chain, and verify the balance, network and handling fees in real time before execution.`,
    币安首版只支持链上收款地址: `The first version of Binance only supports on-chain payment addresses`,
    币种: `Currency`,
    "币种 ": `Currency `,
    "币种 / 税": `Currency / tax`,
    "币种仅支持 USD、CNY、USDT": `currency only supports USD, CNY, USDT`,
    币种对: `currency pair`,
    币种查询条件不正确: `Currency query conditions are incorrect`,
    常用操作: `Common operations`,
    幂等键对应的结算请求不同: `The settlement requests corresponding to the idempotent keys are different`,
    平台: `Platform`,
    平台人员: `Platform personnel`,
    平台付款状态: `Platform payment status`,
    平台全部待办: `All platform tasks`,
    "平台启用了多个 CCMAX 目标，请管理员只保留一个启用目标": `The platform has enabled multiple CCMAX targets, please administrator only keep one enabled target.`,
    平台尚未登记付款: `The platform has not registered payment yet`,
    "平台尚未配置可用的 CCMAX 目标": `The platform has not been configured with an available CCMAX target`,
    平台已完成付款: `Platform has completed payment`,
    "平台已登记付款，等待供应商确认到账。": `The platform has registered payment and is waiting for confirmation from the supplier.`,
    平台总扣款: `Platform total deduction`,
    "平台承担的手续费（付款币种）": `Handling fee borne by the platform (payment currency)`,
    平台管理员: `Administrator`,
    平台维护: `platform maintenance`,
    平台角色不能绑定供应商: `Platform role cannot be bound to a supplier`,
    平台运营: `Operator`,
    "平台运营 ": `Operator `,
    "平台运营加载失败：": `Platform operation loading failed:`,
    "平均已用 {0}%": `average {0}% used`,
    年: `year`,
    "并发配置保存失败：{0}": `Failed to save concurrent configuration: {0}`,
    "并发配置已保存。": `Concurrency configuration has been saved.`,
    "并发配置已被其他人修改。输入已保留，请先重新读取最新配置，再核对并保存。": `The concurrency configuration has been modified by others. The input has been reserved. Please re-read the latest configuration, then check and save.`,
    "并发配置读取失败：{0}": `Concurrent configuration reading failed: {0}`,
    应付: `Payable`,
    应付币种: `Currency payable`,
    应付概览: `Payable Overview`,
    应付汇总: `Payable Summary`,
    应付金额: `Amount payable`,
    应收: `Receivables`,
    "应收只统计供应商已确认的结算；平台付款成功与供应商确认到账分别统计。": `Receivables include only settlements confirmed by the supplier. Successful platform payments and supplier-confirmed receipts are counted separately.`,
    应收报表: `Receivables reports`,
    应收汇总: `Receivable Summary`,
    建议倍率: `recommended multiplier`,
    "建议倍率 {0}": `recommended multiplier {0}`,
    "建议倍率为最多 8 位小数的非负数，整数部分最多 6 位": `recommends that the multiplier be a non-negative number with up to 8 decimal places, and the integer part can have up to 6 digits.`,
    建议倍率必须是小数: `It is recommended that the multiplier must be a decimal`,
    建议折扣: `Suggested discount`,
    "建议折扣 {0}": `Suggested discount: {0}`,
    "建议折扣为最多 6 位小数的非负数，整数部分最多 8 位": `The suggested discount must be non-negative, with up to 8 integer digits and 6 decimal places.`,
    "建议折扣为最多 8 位小数的非负数，整数部分最多 6 位": `recommends that the discount be a non-negative number with up to 8 decimal places, and the integer part can have up to 6 digits.`,
    建议折扣必须是小数: `It is recommended that the discount must be a decimal`,
    开启供应商注册审批: `Require approval for supplier registration`,
    开始日期: `Start date`,
    "开始日期 {0} 保留，历史期间不可修改": `start date {0} is reserved and cannot be modified during the historical period.`,
    开始日期不能晚于结束日期: `The start date cannot be later than the end date`,
    "开始日期已锁定，只能调整今天或未来的结束日期。": `The start date is locked and the end date can only be adjusted today or in the future.`,
    "开始日期已锁定，请选择结束日期": `The start date is locked, please select the end date`,
    开始时间: `start time`,
    开始更新凭据: `Start updating credentials`,
    开始月份: `start month`,
    异常条数: `Abnormal number of items`,
    异常说明: `exception description`,
    强制刷新授权: `Forced refresh of authorization`,
    "强制刷新授权：使用已保存的 Refresh Token 刷新凭据": `Forced refresh authorization: use the saved Refresh Token to refresh the credentials`,
    强制登出: `Forced logout`,
    "强制登出 ": `Forced logout `,
    "强制登出 · {0}": `Forced logout · {0}`,
    强制登出账号: `Forced account logout`,
    归属筛选: `Attribution Screening`,
    "归属记录不一致，请刷新后重试": `The ownership record is inconsistent, please refresh and try again.`,
    "当前 Binance 账户受 Travel Rule 约束，本期尚未配置地区问卷，禁止出款": `The current Binance account is subject to the Travel Rule. The regional questionnaire has not been configured for this period, and withdrawals are prohibited.`,
    "当前 RPM 倍率": `Current RPM multiplier`,
    "当前 TPM 倍率": `Current TPM multiplier`,
    "当前不可新增授权；取消后不能重新勾选。": `It is currently not possible to add new authorizations; it cannot be re-checked after cancellation.`,
    "当前不能再添加人工调整。": `Currently, manual adjustments cannot be added.`,
    "当前仅支持 CCMAX 项目交付": `currently only supports CCMAX project delivery`,
    当前价格: `current price`,
    当前供应商: `current supplier`,
    "当前只显示最近 200 条。处理完这些之后，刷新即可看到更早的待办。": `Currently only the latest 200 items are displayed. After processing these, refresh to see earlier to-dos.`,
    当前可用余额: `Available balance`,
    "当前基础版仅使用 Airwallex 已保存的 beneficiary ID；动态银行字段待 Sandbox 收款样例确认后补齐。 ": `Payments currently use a beneficiary ID already saved in Airwallex. Additional bank fields require validation against sandbox recipient examples. `,
    当前密码: `Current password`,
    当前密码不正确: `The current password is incorrect`,
    "当前密码还需满足：": `The current password also needs to meet:`,
    当前已生效的公开参考汇率: `The currently effective public reference exchange rate`,
    "当前折算约 ¥": `is currently converted to approximately ¥`,
    "当前操作不能重复提交，请先查询同步进度": `The current operation cannot be submitted repeatedly. Please check the synchronization progress first.`,
    "当前日期范围有 ": `The current date range is `,
    "当前是本地模拟，绝不执行真实转账。": `This is a local simulation. No real transfer will be made.`,
    "当前最短密码少于 15 位。请结合账号的验证方式评估风险，避免使用可预测短密码。 ": `The current shortest password is less than 15 characters. Please evaluate the risk based on the account verification method and avoid using predictable short passwords. `,
    "当前最终应付：": `current final payment:`,
    当前有效报价: `Current valid quote`,
    "当前条件 {0} 条资源": `Current conditions {0} resources`,
    当前条件没有日账记录: `There is no daily account record under the current conditions`,
    当前检测不支持该协议: `The current detection does not support this protocol`,
    "当前汇率版本（1 {0} ＝）": `current exchange rate version (1 {0} =)`,
    "当前没有可生成的结算单，请先处理异常": `There is currently no settlement document that can be generated. Please handle the exception first.`,
    当前没有待审核资料: `There is currently no data to be reviewed.`,
    当前环境未启用报价自动续期: `Automatic quote renewal is not enabled in this environment.`,
    当前筛选下没有交付资源: `There are no delivery resources under the current filtering`,
    "当前筛选下没有已成功交付的 CCMAX 资源": `There are no successfully delivered CCMAX resources under the current filter.`,
    当前筛选没有记录: `There is no record in the current filtering`,
    "当前筛选范围 · 包含所有分页": `Current filtering range · Includes all paginations`,
    当前筛选范围没有可导出的日账: `There are no daily accounts that can be exported in the current filtering range.`,
    "当前范围超过20,000笔来源，请缩小日期范围后全选": `The current range exceeds 20,000 sources, please narrow the date range and select all`,
    "当前负责运营：": `is currently responsible for operating:`,
    "当前账号仅可选择已有代理。": `Only existing proxies can be selected for the current account.`,
    "当前账号只能选择已有代理，请从下拉列表选择": `The current account can only select existing proxies. Please select from the drop-down list.`,
    当前账号无权访问此页面: `You do not have permission to access this page.`,
    当前账号无需首次资料录入: `There is no need to enter data for the first time for the current account.`,
    "当前账号没有已开放的 API 权限": `The current account does not have open API permissions`,
    当前账号没有收款账户查看权限: `The current account does not have permission to view the payment account`,
    当前账号没有资源交付权限或供应商归属: `The current account does not have resource delivery permissions or supplier ownership.`,
    "当前账号缺少读取供应商或项目的权限，无法填写此表单。": `The current account lacks the permission to read suppliers or projects and cannot fill in this form.`,
    当前资源: `Current resource`,
    "当前资质申请由其他账号提交，不能修改待审材料；请先退回，由提交人补充后重新审核": `The current qualification application was submitted by another account, and the materials pending for review cannot be modified; please return it first, and the submitter will make supplements before reviewing again.`,
    "当前项目 {0} 项 · 共 {1} 项": `Current project {0} items · Total {1} items`,
    "当前项目不满足交付资格，请先核对项目授权和当日生效报价。": `The current project does not meet the delivery qualifications. Please check the project authorization and quote effective on that day first.`,
    "当前：": `Current:`,
    当天及缺报价记录不计入可结算金额: `The same day and missing quote records are not included in the settleable amount`,
    当天未完结: `Today’s bills are still open`,
    当天账单次日才可结算: `The current day's bill can only be settled the next day.`,
    "当天账单次日才可结算（北京时间）": `The current day's bill can be settled the next day (Beijing time)`,
    "当日价格不唯一，请核对报价生效时间": `The price on the day is not unique, please check the quote effective time`,
    "当日消耗，次日入账。 ": `is consumed on the same day and recorded in the account the next day. `,
    当日账单等待次日入账: `The bill of the day is waiting to be credited the next day`,
    录入人: `Entry person`,
    录入手工应付依据: `Enter manual payable basis`,
    "录入手工款 ": `Enter manual payable `,
    "录入手工款 / 接收或作废原始金额": `Enter manual payment / accept or void the original amount`,
    录入方式: `Entry method`,
    录入时间: `entry time`,
    录入计费数据: `Enter billing data`,
    待上号: `Waiting for registration`,
    待付单: `Pending order`,
    待付款: `pending payment`,
    待付金额: `Amount to be paid`,
    待供应商确认: `Awaiting supplier confirmation`,
    待确认金额: `Amount awaiting confirmation`,
    查看待确认结算单: `View pending settlements`,
    "{0} 笔待确认 · 查看": `{0} pending settlements · View`,
    "{0} 笔待确认 · 查看|one": `{0} pending settlement · View`,
    待关联供应商: `Supplier to be associated`,
    待分配: `Unassigned`,
    待分配项目: `Items to be assigned`,
    待创建目标: `Target to be created`,
    待办事项: `To-do list`,
    待办分类: `To-do classification`,
    待填写: `to be filled in`,
    待处理: `Pending`,
    待完善: `to be improved`,
    待完成: `To be completed`,
    "待审 / 已通过": `Pending / approved`,
    待审核: `Pending review`,
    "待审核：": `Pending review: `,
    "待审：{0}": `Pending review: {0}`,
    待执行付款: `Ready for payment`,
    待推送: `to be pushed`,
    待提交: `to be submitted`,
    待收款: `pending payment`,
    待查询: `to be queried`,
    待校验: `to be verified`,
    待核实: `to be verified`,
    待核对: `Needs reconciliation`,
    "待核对 ": `Needs reconciliation `,
    待生成: `to be generated`,
    "待生成结算单 · 可逐张预览": `Settlement document to be generated · Can be previewed one by one`,
    待生效: `To be effective`,
    待申请付款: `Payment request required`,
    待确认: `Pending confirmation`,
    待确认到账: `pending confirmation`,
    待确认应收金额: `Receivable amount awaiting confirmation`,
    待确认收款: `Receipt to be confirmed`,
    待结算: `pending settlement`,
    待自动计价: `to be automatically calculated`,
    待计价: `Awaiting pricing`,
    待计价消耗: `Unpriced usage`,
    待计价消耗说明: `Consumption instructions to be calculated`,
    待计价试算: `Pending trial calculation`,
    待选择代理: `Proxy to be selected`,
    待配置: `To be configured`,
    必填: `required`,
    "必填，保存后会记入归属记录。": `is required and will be recorded in the ownership record after saving.`,
    必须保留至少一个启用的管理员: `At least one enabled administrator must remain`,
    "必须由供应商确认本版结算金额后才能申请付款；历史平台确认不能代替供应商确认": `The supplier must confirm the settlement amount of this version before applying for payment; historical platform confirmation cannot replace supplier confirmation.`,
    忽略未改变状态的付款通道事件: `Ignore payment channel events that have not changed status`,
    "总计：": `Total: `,
    总额度: `Total quota`,
    "恢复当前值 ": `Restore current value `,
    恢复授权失败的交付草稿: `Recovery authorization failed delivery draft`,
    成功: `Success`,
    "成功 {0} 条，需核对 {1} 条": `{0} items successful, {1} items need to be checked`,
    "成员尚未分配项目，请在列表中通过“权限管理”分配。": `The member has not been assigned the project, please assign it through "Permission Management" in the list.`,
    成员报价项目筛选: `Member quote Item Screening`,
    成员项目大类筛选: `Member project category screening`,
    成员项目权限已保存: `Member project permissions have been saved`,
    我已保存: `I have saved`,
    "我已保存 ": `I have saved `,
    "我已核实CCMAX未创建该资源，确认本次交付失败 ": `I have verified that CCMAX did not create this resource and confirmed that this delivery failed. `,
    我的交付: `My deliveries`,
    我的报价: `My quotes`,
    我的操作: `My operation`,
    我的收款记录: `My payment record`,
    我的资料: `My profile`,
    "我的资料 ": `My profile `,
    "截止 ": `deadline `,
    "截止时间前可确认或提出异议，逾期未处理将按无异议自动确认。": `Confirm or raise an objection before the deadline. After the deadline, unanswered settlements are automatically confirmed without objection.`,
    "截止时间前可确认或提出异议；逾期未处理将按无异议自动确认。": `Confirm or raise an objection before the deadline. After the deadline, unanswered settlements are automatically confirmed without objection.`,
    所属供应商: `Suppliers`,
    所属供应商不可变更: `The supplier cannot be changed`,
    所属期间: `period`,
    所属范围: `scope`,
    所属项目: `Project`,
    "所有目标共享；默认 4，范围 1–64。在任一目标修改后全局生效。": `Shared by all targets; default 4, range 1–64. Modifications to any target take effect globally.`,
    所选代理不存在或已停用: `The selected proxy does not exist or has been disabled`,
    "所选代理出口不可用或已被停用，请更换代理；OAuth交付需重新生成授权链接。": `The selected proxy outlet is unavailable or has been deactivated. Please change the proxy; OAuth delivery requires regenerating the authorization link.`,
    所选代理已停用: `The selected proxy has been deactivated`,
    "所选代理已变化，请重新授权": `The selected proxy has changed, please re-authorize it.`,
    "所选代理已变化，请重新提交": `The selected proxy has changed, please resubmit.`,
    "所选代理已失效或不属于本人，请重新选择本人创建的代理并重新授权": `The selected proxy has expired or does not belong to me. Please re-select the proxy created by me and re-authorize it.`,
    所选代理的可用绑定容量不足: `The available binding capacity of the selected proxy is insufficient.`,
    "所选日账来源包含重复 ID": `The selected daily ledger source contains duplicate IDs`,
    "所选日账来源已变化或不可结算，请刷新重选": `The selected daily account source has changed or cannot be settled. Please refresh and reselect.`,
    "所选来源的归属、日期、币种或状态不符合结算范围": `The ownership, date, currency or status of the selected source does not meet the settlement range`,
    "所选汇率已失效或不是当前生效版本，请刷新后重试": `The selected exchange rate has expired or is not the current effective version. Please refresh and try again.`,
    "所选生效日原价格： ": `Original price on the selected effective date: `,
    "所选角色已不存在，请刷新后重试": `The selected role no longer exists, please refresh and try again.`,
    "所选角色的权限合并生效，账号原有身份和供应商归属保持不变。": `Permissions from the selected roles are combined. The account’s identity and supplier association remain unchanged.`,
    所选账号: `selected account`,
    手动: `manual`,
    手动填写: `Fill in manually`,
    "手动设置需 ": `Manual passwords require  `,
    手工录入: `manual entry`,
    手工录入结算来源: `Manual entry of settlement source`,
    手工款: `Manual payment`,
    手工款项编号: `Manual payment number`,
    手工账务请填写款项说明: `Please fill in the payment description for manual accounting`,
    打包下载: `package download`,
    打包下载全部文件: `package download all files`,
    "打开授权页面 ": `Open the authorization page `,
    "打开浏览器 ": `Open browser `,
    "执行中…": `Executing...`,
    执行付款: `Execute payment`,
    "执行后需等待支付机构核验结果。": `, you need to wait for the verification results of the payment institution.`,
    "执行权已变化，提交结果待核对": `The execution right has changed and the submission result needs to be verified.`,
    执行租约已失效: `The execution lease has expired`,
    执行结果: `Result`,
    执行结果不正确: `The execution result is incorrect`,
    执行范围: `Execution scope`,
    执行记录: `Task runs`,
    "执行记录 ": `Task runs `,
    "执行记录加载失败：": `Execution record loading failed:`,
    执行超时: `Execution timeout`,
    "批量交付支持 Refresh Token、Access Token、Session Key；OAuth 请逐个授权。": `Batch delivery supports Refresh Token, Access Token, and Session Key; please authorize OAuth one by one.`,
    批量供应商确认截止时间: `Batch supplier confirmation deadline`,
    批量创建: `Batch creation`,
    "批量导入 ": `Batch import `,
    批量导入代理: `Batch import proxy`,
    批量提交编号或内容不正确: `The batch submission number or content is incorrect`,
    批量新建结算单: `Create settlements in batch`,
    "批量新建结算单 ": `Create settlements in batch `,
    批量替换: `batch replacement`,
    批量替换代理: `Batch replacement proxy`,
    "批量条目不能为空，提交编号不能重复": `The batch entry cannot be empty and the submission number cannot be repeated.`,
    "批量检测 ": `Batch testing `,
    批量检测中: `batch testing in progress`,
    批量检测完成: `batch testing completed`,
    批量检测已停止: `Batch testing has stopped`,
    批量检测未开始: `Batch testing has not started`,
    批量检测进度: `batch testing progress`,
    批量生成结果: `Batch generation results`,
    批量生成结算单: `Batch generation of settlement documents`,
    批量粘贴结构化资料: `Paste structured data in batches`,
    批量结算单预览: `Batch settlement preview`,
    批量结算币种: `Batch settlement currencies`,
    批量结算项目: `Batch settlement projects`,
    "批量资料不能超过 200 KB。": `batch data cannot exceed 200 KB.`,
    "批量资料存在重复资源，请核对": `There are duplicate resources in batch data, please check`,
    "批量资料必须包含 1—100 组请求": `batch data must contain 1-100 sets of requests`,
    "批，还会受其他目标占用影响。 ": `batch will also be affected by the occupation of other targets. `,
    "找不到完整覆盖来源期间的唯一已确认报价。期间调价须由现行系统拆分原始金额；历史LEGACY报价需重新提交": `Unable to find the only confirmed quote for the full coverage source period. Periodic price adjustments must be split from the original amount by the current system; historical LEGACY quotes must be resubmitted`,
    技术服务: `technical service`,
    折扣: `Discount`,
    "折扣 / 独立价格": `Discount / fixed price`,
    折扣上限: `Maximum discount`,
    折扣下限: `Minimum discount`,
    "折扣下限和上限为最多 6 位小数的非负数，整数部分最多 8 位，上限不小于下限": `Discount limits must be non-negative, with up to 8 integer digits and 6 decimal places. The maximum must be at least the minimum.`,
    "折扣后约 {0} {1}": `After discount: approximately {0} {1}`,
    折扣报价: `Discount quote`,
    "折扣改为 {0}": `Discount changed to {0}`,
    "折扣整数部分最多 8 位": `Discount: up to 8 integer digits`,
    "折扣整数部分最多 8 位，小数部分最多 6 位": `Discount: up to 8 integer digits and 6 decimal places`,
    "折扣最多 6 位小数": `Discount: up to 6 decimal places`,
    "折扣计费需填写基准标识，数量应为 0": `Discount billing requires filling in the benchmark identifier, and the quantity should be 0`,
    报价: `Quote`,
    "报价 ": `Quote `,
    "报价 {0} · {1}。": `Quote {0} · {1}.`,
    "报价 {0}：{1}。{2}。": `Quote {0}: {1}. {2}.`,
    报价不在待审核状态: `The quote is not pending review`,
    报价不能调整为历史生效日期: `The quote cannot be adjusted to the historical effective date`,
    报价与项目结算方式不一致: `The quote is inconsistent with the project settlement method`,
    报价依据: `Quote basis`,
    报价倍率: `quote multiple`,
    "报价倍率下限和上限为最多 8 位小数的非负数，整数部分最多 6 位，上限不小于下限": `The lower limit and upper limit of the quote multiple are non-negative numbers with up to 8 decimal places, and the integer part has up to 6 digits. The upper limit is not less than the lower limit.`,
    报价倍率下限和上限必须是小数: `The lower limit and upper limit of the quote multiple must be decimals`,
    "报价倍率必须不小于 0": `The quote multiple must not be less than 0`,
    "报价倍率必须在 ": `The quote factor must be between `,
    "报价倍率必须在 {0} 至 {1} 之间": `The quote multiple must be between {0} and {1}`,
    报价倍率必须非负且在允许精度内: `The quote multiple must be non-negative and within the allowed accuracy.`,
    报价倍率缺失: `quote multiple is missing`,
    报价倍率范围读取失败: `Failed to read quote multiple range`,
    报价倍率超出允许的存储精度: `The quote multiple exceeds the allowed storage accuracy.`,
    报价列表: `Quote list`,
    "报价列表读取失败：{0}；已有草稿仍可保留，刷新后再试。": `Failed to read quote list: {0}; existing drafts can still be retained, refresh and try again.`,
    报价到期日: `quote expiration date`,
    "报价加载失败：": `quote loading failed:`,
    报价单价缺失: `The quoted unit price is missing`,
    报价单位: `quote unit`,
    报价单号: `quote number`,
    报价审核已处理: `quote review has been processed`,
    报价审核通过: `Quote approved`,
    报价尚未确认新的项目结算方式: `quote has not yet confirmed the new project settlement method`,
    "报价已不处于已通过状态，请刷新列表。": `The quote is no longer in the passed status, please refresh the list.`,
    报价已拒绝: `quote rejected`,
    报价已撤回: `quote has been withdrawn`,
    报价已退回: `Quote rejected`,
    报价币种: `quote Currency`,
    报价开始日期不能调整到历史日期: `The quote start date cannot be adjusted to the historical date`,
    报价快照缺失: `quote snapshot is missing`,
    "报价或项目已变化，请重新选择并确认": `The quote or project has changed, please re-select and confirm`,
    "报价所属供应商不可修改；请取消后新增一行": `The supplier to which the quote belongs cannot be modified; please cancel and add a new line.`,
    报价折扣: `Quote discount`,
    "报价折扣下限和上限为最多 8 位小数的非负数，整数部分最多 6 位，上限不小于下限": `The lower limit and upper limit of the quote discount are non-negative numbers with up to 8 decimal places, and the integer part has up to 6 digits. The upper limit is not less than the lower limit.`,
    报价折扣下限和上限必须是小数: `The lower limit and upper limit of the quote discount must be decimals`,
    "报价折扣必须不小于 0": `The quote discount must not be less than 0`,
    "报价折扣必须在 ": `The discount must be between `,
    "报价折扣必须在 {0} 至 {1} 之间": `The discount must be between {0} and {1}`,
    报价折扣必须非负且在允许精度内: `The quote discount must be non-negative and within the allowed accuracy.`,
    报价折扣缺失: `Quote discount is missing`,
    报价折扣范围读取失败: `Could not load discount limits`,
    报价折扣超出允许的存储精度: `The quote discount exceeds the allowed storage accuracy.`,
    报价排行榜: `Quote ranking list`,
    报价方式: `Pricing method`,
    "报价方式必须匹配项目：额度结算使用倍率，账号买断使用单个固定价格": `The quote method must match the items: quota settlement uses a multiple, account buyout uses a single fixed price`,
    报价日期和价格没有变化: `There is no change in the quote date and price`,
    报价有效期: `quote Validity Period`,
    "报价期间已变化，请重新发起调整": `has changed during the quote period, please initiate adjustment again`,
    报价状态: `Quote status`,
    "报价状态已变化，请关闭并刷新列表。": `The quote status has changed, please close and refresh the list.`,
    "报价状态已变化，请刷新后重试": `The quote status has changed, please refresh and try again.`,
    "报价状态未更新，请刷新后核对": `quote status has not been updated, please refresh and check.`,
    报价生效日: `quote Effective Date`,
    报价管理: `Quotes`,
    报价结束日期不能早于今天: `The quote end date cannot be earlier than today`,
    报价编号: `Quote number`,
    "报价编号、供应商或项目": `Quote number, supplier or project`,
    报价自动续期: `Automatic quote renewal`,
    "报价详情加载失败：": `Failed to load quote details:`,
    "报价读取失败：": `quote reading failed:`,
    报价调整审核退回: `quote adjustment review and return`,
    报价调整审核通过: `quote adjustment approved`,
    报价调整已提交审核: `quote adjustment has been submitted for review`,
    报价调整已退回: `quote adjustment has been returned`,
    报价调整已通过: `quote adjustment passed`,
    "报价资料加载失败：{0}": `Failed to load quote data: {0}`,
    报价项目: `Quoted projects`,
    "报价项目已经分配，不能再次修改或清空": `The quote item has been allocated and cannot be modified or cleared again.`,
    "报价项目：交付后分配": `quote Item: Allocation after Delivery`,
    报表下钻范围无效: `The drill-down range of the report is invalid`,
    报表中心: `Reports`,
    报表供应商: `Report Supplier`,
    报表导出已开始: `Report export has started`,
    报表导出类型无效: `Report export type is invalid`,
    报表币种: `Report currency`,
    报表开始日期不能晚于结束日期: `The report start date cannot be later than the end date`,
    报表筛选: `Report filtering`,
    报表项目: `report item`,
    抵扣原币应付: `Deduction of original currency payable`,
    抵扣原币应收: `Deduction of original currency receivables`,
    "拉取金额为真实账单；当天账单次日才可结算，缺报价等异常保留待计价": `The pulled amount is the real bill; the current day's bill can only be settled the next day. Abnormalities such as missing quotations are reserved for pricing.`,
    "拉取金额即为真实账单，保留原始金额精度，无需核验。已结束日期按报价自动计价入账。 ": `is the real bill, and the accuracy of the original amount is retained without verification. The end date will be automatically calculated based on the quoted price. `,
    "拉取金额即为真实账单，无需核验。当天账单次日可结算（北京时间）。": `Imported amounts come from actual bills and require no manual verification. A day’s bills become eligible for settlement the next day (Beijing time).`,
    "拒绝 ": `Rejected `,
    拒绝原因: `Reason for rejection`,
    拒绝原因最多500字: `The reason for rejection should be up to 500 words.`,
    "拒绝原因（必填）": `Reason for rejection (required)`,
    "拒绝后，该报价不再用于新的交付和计价，未完成的调价申请一并关闭。已冻结的交付、账务和结算记录保留。 ": `is rejected, the quote will no longer be used for new delivery and pricing, and the unfinished price adjustment application will be closed. Frozen delivery, accounting and settlement records are retained. `,
    拒绝已通过报价: `Reject the passed quote`,
    "拒绝重复供应的 Lane": `Rejection of repeated supply of Lane`,
    指定: `designated`,
    指定供应商: `Select suppliers`,
    指定单个账号: `Specify a single account`,
    "指定原因 ": `Specified reason `,
    指定请求头: `Specify request header`,
    指定负责运营: `designated responsible for operation`,
    指定负责运营并查看月度绩效: `Designated to be responsible for operations and review monthly performance`,
    "指定账号：{0}{1}": `designated account: {0}{1}`,
    指定项目: `designated items`,
    指标路径须为简单点分字段名: `The indicator path must be a simple dotted field name`,
    "按 1 {0} = ¥{1} · V{2} · 仅供参考": `Press 1 {0} = ¥{1} · V{2} · For reference only`,
    "按 Lane 覆盖同供应商资源": `Cover resources from the same supplier by Lane`,
    按创建人汇总: `Summary by creator`,
    按创建账号汇总: `Summary by creator account`,
    "按北京时间的日期生效；历史价格和已形成的费用快照保留。": `Is effective as of the date in Beijing time; historical prices and fee snapshots are retained.`,
    按单价: `based on unit price`,
    "按原始金额和对应报价计算，叠加人工调整；确认后金额冻结": `is calculated based on the original amount and corresponding quote, with manual adjustments superimposed; the amount is frozen after confirmation`,
    "按原始金额和对应报价计算；以本单最终应收金额确认": `Calculated based on the original amount and corresponding quote; confirmed based on the final amount receivable of this order`,
    "按原金额的 {0}% 计价": `{0}% of the original amount`,
    "按启动时的筛选条件检测全部分页；停止后，已发出的请求继续完成。 ": `Detects all paging according to the filter conditions at startup; after stopping, the requests that have been sent continue to be completed. `,
    "按已入账来源选择；当天账单次日才可结算（北京时间）。": `Select according to the account source; the current day's bill can only be settled the next day (Beijing time).`,
    "按已入账／试算分别列示": `Accrued and provisional amounts shown separately`,
    "按已拉取的可结算日账生成。不同项目和币种自动分单；缺报价或来源异常的单据单独提示。 ": `Generate settlements from imported daily bills eligible for settlement. Separate them by project and currency, and flag missing quotes or invalid source data. `,
    "按当前条件汇总全部 ": `Summarize all according to current conditions `,
    "按当前筛选统计 CCMAX 资源": `Statistics CCMAX resources according to current filtering`,
    "按当前筛选统计已成功交付的资源，状态和额度按最近同步快照展示；状态分类互斥，等待自动续期不算账号失效；额度指标单独统计。": `Statistics of resources that have been successfully delivered are based on the current filtering. The status and quota are displayed according to the latest synchronized snapshot; status categories are mutually exclusive, and waiting for automatic renewal does not count as account expiration; quota indicators are counted separately.`,
    "按当前筛选统计已成功交付资源；5h/7d额度统计不含已移除资源；余量折合按窗口百分比估算。 ": `Resources have been successfully delivered according to the current filtering statistics; 5h/7d quota statistics do not include removed resources; the remaining amount is estimated based on the window percentage. `,
    "按当前输入，该目标最多同时执行 ": `According to the current input, the target can be executed at most simultaneously `,
    按待付款金额排序: `Sort by amount to be paid`,
    "按所选日期生效。": `is effective on the selected date.`,
    "按执行开始时间筛选，日期使用北京时间": `Filter by execution start time, use Beijing time for date`,
    "按日汇总 ": `Daily summary `,
    "按确认月份统计已确认结算。指定和改挂不改变已经结算的归属。": `Group confirmed settlements by confirmation month. Assigning or changing an operator does not change attribution for completed settlements.`,
    "按站点独立配置采集和展示，可兼容不同品类的 JSON 接口": `Independently configures collection and display by site, and is compatible with JSON interfaces of different categories`,
    按结算周期归属统计: `Attribution statistics by settlement cycle`,
    按结算周期结束月份归属: `Attribute to the month in which the settlement cycle ends`,
    换算后的付款金额不能为零: `The converted payment amount cannot be zero.`,
    "授权会话已变化，请刷新交付结果": `The authorization session has changed, please refresh the delivery results.`,
    "授权会话已过期或已取消，请重新生成链接": `The authorization session has expired or been cancelled, please regenerate the link.`,
    "授权会话已过期或已提交，请重新生成授权链接": `The authorization session has expired or has been submitted. Please regenerate the authorization link.`,
    "授权会话已过期或草稿已变化，请重新生成链接": `The authorization session has expired or the draft has changed, please regenerate the link.`,
    "授权会话已过期，请重新生成授权链接。": `The authorization session has expired, please regenerate the authorization link.`,
    "授权入口有效期至 ": `Authorized entrance is valid until `,
    "授权刷新及凭据同步完成。账号是否接单仍取决于暂停、额度和限流状态。 ": `Authorization and credential synchronization are complete. Order availability still depends on pause status, quota and rate limits. `,
    授权参数不能为空: `Authorization parameter cannot be empty`,
    授权同步完成: `authorization synchronization completed`,
    授权完成: `authorization completed`,
    "授权已使用，请重新授权": `The authorization has been used, please re-authorize it.`,
    "授权已回填，目标侧资源已创建": `The authorization has been backfilled and the target side resource has been created.`,
    "授权已过期或目标/代理已变化，请重新授权": `The authorization has expired or the target/proxy has changed, please re-authorize it.`,
    授权操作已变化: `Authorization operation has changed`,
    "授权操作已结束，当前行读取失败：{0}": `The authorization operation has ended and the current line reading failed: {0}`,
    授权数量: `Authorized quantity`,
    授权状态已变化: `Authorization status has changed`,
    "授权状态已变化，请刷新交付结果": `Authorization status has changed, please refresh the delivery results`,
    授权码: `authorization code`,
    "授权码 ": `authorization code `,
    "授权码与本次授权链接不匹配，请重新生成授权链接，并回填该链接对应的新授权码。": `The authorization code does not match this authorization link. Please regenerate the authorization link and backfill the new authorization code corresponding to the link.`,
    "授权码与本次登录链接不匹配，CCMAX 拒绝创建资源": `The authorization code does not match the login link. CCMAX refuses to create resources.`,
    "授权码已提交，等待目标创建结果": `Authorization code has been submitted, waiting for the target creation result`,
    "授权码无效、已过期或已被使用，请重新生成授权链接，并提交该链接对应的新授权码。": `The authorization code is invalid, expired or has been used. Please regenerate the authorization link and submit the new authorization code corresponding to the link.`,
    授权结果状态已变化: `Authorization result status has changed`,
    "授权资料已变化，请重新生成链接": `The authorization information has changed, please regenerate the link.`,
    授权链接: `authorization link`,
    "授权链接 ": `authorization link `,
    "授权链接不会在关闭后保留。可填写之前取得的授权码，或生成新链接。 ": `Authorization link does not persist after closing. You can fill in the authorization code obtained previously, or generate a new link. `,
    授权链接已复制: `Authorization link has been copied`,
    "授权链接已过期，请生成新的授权链接": `The authorization link has expired, please generate a new authorization link.`,
    "授权链接有效期至 ": `Authorization link is valid until `,
    授权链接生成失败: `Authorization link generation failed`,
    排行展示项目: `Ranking Display Project`,
    排行币种: `ranking currency`,
    排行日期: `ranking date`,
    排行项目大类: `Ranking Project Categories`,
    排队中: `Queuing`,
    "接口交付类型 ": `Interface delivery type `,
    接口交付适用类型: `interface delivery applicable type`,
    接口地址格式不正确: `The interface address format is incorrect.`,
    接口环境: `Interface environment`,
    接收原始金额: `Receive original amount`,
    "接收外部金额 ": `Receive external amount `,
    接收结算来源: `Receive settlement source`,
    接收范围: `Recipients`,
    接收记录: `receiving record`,
    接收账号: `receiving account`,
    "接收账号不存在或已停用，请重新选择": `The receiving account does not exist or has been deactivated, please select again.`,
    接收资源交付: `Receive resource delivery`,
    接收资源详情: `Receive resource details`,
    推送中: `is being pushed`,
    推送失败: `Push failed`,
    提交: `Submit`,
    "提交 / 变更收款账户": `Submit/change payment account`,
    "提交 / 编辑报价": `Submit/Edit Quote`,
    提交中: `Submitting`,
    "提交中…": `Submitting…`,
    提交交付: `Submit for delivery`,
    "提交人与审核人不能是同一账号，请由另一位授权人员审核": `The submitter and reviewer cannot have the same account. Please have another authorized person review it.`,
    提交供应商注册资料: `Submit supplier registration information`,
    提交全部条目: `Submit all entries`,
    "提交前校验未通过，请刷新资源和代理后重试": `The verification before submission failed. Please refresh the resources and proxies and try again.`,
    "提交后供应商资料将自动通过审核。": `is submitted, the supplier information will automatically pass the review.`,
    提交后关联报价项目: `Related quote items after submission`,
    "提交后资料进入待审核状态。": `The profile will be submitted for review.`,
    提交失败: `Submission failed`,
    提交审核: `Submit for review`,
    提交报价: `Submit quote`,
    提交收款账户: `Submit payment account`,
    提交时间: `submission time`,
    "提交未完成：{0}": `Submission not completed: {0}`,
    提交模拟事件: `Submit simulation event`,
    提交版本与原请求不符: `The submitted version does not match the original request`,
    提交状态已变化: `Submission status has changed`,
    提交目标授权码: `Submit target authorization code`,
    提交线上付款审核: `Submit online payment review`,
    "提交结果待核对，请稍后查询": `The submitted result is pending verification, please check later.`,
    "提交结果未确认，请平台核对实际绑定，勿重复提交": `The submission result is not confirmed. Please check the actual binding on the platform and do not submit again.`,
    "提交编号：": `submission number:`,
    提交请求内容不符: `Submission request content does not match`,
    提交请求内容与原请求不一致: `The content of the submitted request is inconsistent with the original request`,
    提交请求标识不正确: `The submission request ID is incorrect`,
    提交调整审核: `Submit for review`,
    提交账号: `Submitting account`,
    提交账户变更: `Submit account changes`,
    提交账户审核: `Submit account review`,
    提交资料修改: `Submit information modification`,
    提交资料变更: `Submit information changes`,
    提交重新授权: `Submit for reauthorization`,
    提供商: `provider`,
    提出收款异议: `File a payment objection`,
    提出金额异议: `Raise an objection to the amount`,
    提币: `Withdraw coins`,
    "提币金额不在 Binance 当前网络限额内": `The withdrawal amount is not within Binance’s current network limit.`,
    "提币金额不符合 Binance 当前网络精度": `The withdrawal amount does not meet Binance’s current network accuracy`,
    搜索: `Search`,
    "搜索付款单、供应商或通道": `Search for payment orders, suppliers or channels`,
    搜索供应商: `Search suppliers`,
    "搜索供应商、户名、机构或尾号": `Search for suppliers, account names, institutions or tail numbers`,
    "搜索供应商代码、名称、联系人": `Search supplier code, name, contact person`,
    "搜索供应商名称、编码或联系人": `Search supplier name, code or contact person`,
    搜索供应商名称或编码: `Search supplier name or code`,
    搜索供应商或结算单号: `Search supplier or settlement document number`,
    搜索创建人姓名或账号: `Search creator name or username`,
    搜索创建账号: `Search and create account`,
    "搜索创建账号、资源或项目": `Search and create accounts, resources or projects`,
    搜索可用代理: `Search available proxies`,
    搜索名称或编号: `Search name or number`,
    搜索失效原因: `Search failure reason`,
    搜索姓名或登录账号: `Search name or login account`,
    搜索币种对或汇率来源: `Search currency pairs or exchange rate sources`,
    搜索并选择已有代理: `Search and select an existing proxy`,
    搜索录入人姓名或账号: `Search submitter name or username`,
    搜索成员姓名或登录账号: `Search member name or login account`,
    搜索报价项目: `Search quoted projects`,
    搜索操作内容或代码: `Search operation content or code`,
    搜索更多供应商: `Search more suppliers`,
    "搜索来源单号、供应商或项目": `Search source order number, supplier or project`,
    搜索模型: `search model`,
    搜索结果: `Search results`,
    搜索结算单号: `Search settlement document number`,
    搜索结算编号或供应商: `Search settlement number or supplier`,
    搜索自定义角色名称或标识: `Search for custom role name or logo`,
    搜索角色名称或标识: `Search role name or ID`,
    搜索负责人或备注: `Search for person in charge or remarks`,
    "搜索账号 / Lane ID": `Search account / Lane ID`,
    "搜索资源、供应商或项目": `Search for resources, suppliers or projects`,
    搜索资源名称: `Search resource name`,
    搜索通知标题或正文: `Search notification title or text`,
    搜索项目: `search item`,
    搜索项目名称: `Search project name`,
    搜索项目名称或编码: `Search project name or code`,
    "搜索项目大类、名称或编号": `Search item category, name or number`,
    "撤回 ": `withdrawn `,
    "撤回中…": `Withdrawing…`,
    撤回人: `withdrawn person`,
    撤回原因: `Reason for withdrawal`,
    "撤回后，尚未阅读的消息会从收件人列表中移除；已读消息和管理记录会保留。 ": `is withdrawn, unread messages will be removed from the recipient list; read messages and management records will be retained. `,
    撤回报价: `Withdraw quote`,
    撤回时间: `withdrawal time`,
    撤回系统通知: `Withdraw system notification`,
    撤回结算单: `Withdraw settlement document`,
    撤回通知: `Withdraw announcement`,
    "撤回通知 ": `Withdraw announcement `,
    "撤销 ": `Cancellation `,
    "撤销 API 密钥": `Revoke API Key`,
    "撤销“{0}”后，使用它的程序将无法继续访问。": `After revoking "{0}", programs using it will no longer be accessible.`,
    操作: `Actions`,
    操作人: `Operator`,
    "操作人搜索最多 100 字": `Operator search maximum 100 words`,
    操作内容: `Action`,
    "操作内容加载失败：": `Operation content loading failed:`,
    操作原因: `Operation reason`,
    操作失败: `Operation failed`,
    "操作失败：": `Operation failed:`,
    操作对象: `Target`,
    操作已记录: `Action recorded`,
    操作日期: `Operation date`,
    操作时间: `operating time`,
    操作未成功: `Operation unsuccessful`,
    操作标识必须为UUID: `The operation identifier must be UUID`,
    操作结束日期不能早于开始日期: `The operation end date cannot be earlier than the start date`,
    操作结果: `operation result`,
    操作结果筛选值不正确: `The operation result filter value is incorrect`,
    操作记录范围: `operation record range`,
    操作说明: `operating instructions`,
    支付事件编号不正确: `The payment event number is incorrect`,
    支付事件通道不匹配: `Payment event channel does not match`,
    "支付模拟通道只可在显式dev环境启用，生产禁止启用": `The payment simulation channel can only be enabled in the explicit dev environment, and is prohibited from being enabled in production.`,
    支付流水与请求不匹配: `The payment flow does not match the request`,
    "支付结果金额/币种与冻结的付款请求不符，未更新付款状态": `The payment result amount/currency does not match the frozen payment request, and the payment status is not updated.`,
    支付通道: `payment channel`,
    支付通道适配器不存在: `Payment channel adapter does not exist`,
    "支持 1–1440 分钟。已启用时，下次执行按新周期安排；当前执行继续完成。": `supports 1–1440 minutes. When enabled, the next execution is scheduled on the new cycle; the current execution continues to completion.`,
    "支持 PDF、PNG、JPG，单个文件不超过 10 MB。": `supports PDF, PNG, and JPG, and a single file does not exceed 10 MB.`,
    "支持 SOCKS5、HTTP、HTTPS，用于 CCMAX 交付。认证信息加密保存，不回显。 已有资源绑定时不可修改地址。 ": `Supports SOCKS5, HTTP, HTTPS for CCMAX delivery. The authentication information is stored encrypted and will not be displayed back. The address cannot be modified when the resource is already bound. `,
    "支持 SOCKS5、HTTP、HTTPS，重复代理自动复用。": `supports SOCKS5, HTTP, HTTPS, and repeated proxies are automatically reused.`,
    支持模型: `support model`,
    "支持每行一个 Key、Key----Endpoint、地址与 Key 分行、Vertex 服务账号 JSON 或完整 NewAPI 请求。无法唯一识别时请选择资源类型。": `supports one Key per line, Key----Endpoint, address and Key branch, Vertex service account JSON or complete NewAPI request. Please select the resource type when it cannot be uniquely identified.`,
    "收款人 / 账户": `Payee/Account`,
    收款人汇总: `Recipients`,
    "收款人汇总 ": `Recipients `,
    "收款地址 / 欧意 UID": `payment address / Ouyi UID`,
    "收款地址或 UID 过短": `The payment address or UID is too short`,
    收款备注: `Receipt Remarks`,
    收款币种: `Payment currency`,
    收款币种筛选: `Collection currency screening`,
    收款币种筛选值不正确: `The filtering value of payment currency is incorrect.`,
    收款户名: `Beneficiary account name`,
    收款方式: `payment method`,
    收款有异议: `Objection to payment`,
    收款核对已保存: `Payment verification has been saved`,
    收款概览: `Payment Overview`,
    收款目标: `collection target`,
    收款管理: `Receivables`,
    收款记录: `Payment record`,
    收款账号: `Payment account number`,
    收款账户: `Payment account`,
    "收款账户 ": `Payment account `,
    "收款账户不属于 Airwallex 通道": `The receiving account does not belong to the Airwallex channel`,
    "收款账户不属于 Binance USDT 通道": `The receiving account does not belong to the Binance USDT channel`,
    "收款账户不属于 OKX USDT 通道": `The receiving account does not belong to the OKX USDT channel`,
    "OKX 链上付款仅支持 USDT 链上收款账户": `OKX on-chain payouts require a USDT blockchain receiving account`,
    "无法唯一匹配 OKX USDT 提币网络，请核对收款网络": `The receiving network does not uniquely match an OKX USDT withdrawal network. Check the receiving network.`,
    "收款账户与审批快照不符，禁止执行": `The payment account does not match the approval snapshot, execution is prohibited`,
    收款账户审核通过: `payment account approved`,
    收款账户尚未通过或已停用: `The payment account has not been passed or has been deactivated.`,
    收款账户已变更或停用: `The payment account has been changed or deactivated`,
    "收款账户已变更或停用，请关闭未执行的申请后重新核对": `The payment account has been changed or deactivated. Please close the unexecuted application and recheck.`,
    收款账户已提交审核: `The payment account has been submitted for review`,
    收款账户待审核: `Payment account pending review`,
    收款账户状态筛选值不正确: `The payment account status filter value is incorrect.`,
    收款账户类型筛选值不正确: `The payment account type filter value is incorrect.`,
    "收款账户记录 ": `payment account record `,
    收款进度: `Payment progress`,
    收起: `Collapse`,
    收起创建人汇总: `Close creator summary`,
    改价待审: `Price change pending review`,
    改价生效日期: `Price change effective date`,
    "改价生效日期须为北京时间今天或未来，且在调整后的报价期间内": `The effective date of the price change must be today or in the future Beijing time, and within the adjusted quote period`,
    "改价生效日期（北京时间）": `Price change effective date (Beijing time)`,
    改挂: `change`,
    改挂负责运营: `Changed to responsible for operation`,
    数字: `digital`,
    "数字资产收款账户币种必须为 USDT": `The currency of the digital asset payment account must be USDT`,
    数据时点: `data time point`,
    数据时间: `data time`,
    数据时间字段路径: `Data time field path`,
    数据来源: `data source`,
    数据正常: `data is normal`,
    数据表格: `data form`,
    数据较旧: `data is older`,
    "数据重复、被引用或已发生变化，请刷新后重试": `The record already exists, is in use, or has changed. Refresh and try again.`,
    数据预览: `data preview`,
    数量计费不能同时录入基准金额: `The base amount cannot be entered at the same time for quantity billing.`,
    "整单已付 ": `The entire order has been paid `,
    整数能力必须在1至BIGINT上限之间: `Integer capability must be between 1 and the upper limit of BIGINT`,
    整数能力超过BIGINT上限: `Integer capability exceeds the upper limit of BIGINT`,
    整目标: `Whole target`,
    文件: `file`,
    "文件在本地读取并填入当前资料，确认交付时一并提交。支持 JSON 文件，最大 1 MiB。 ": `file is read locally and the current data is filled in, and is submitted when the delivery is confirmed. Supports JSON files, up to 1 MiB. `,
    "文件尚未生成或已经过期，请刷新任务列表。": `The file has not been generated or has expired. Please refresh the task list.`,
    文件格式: `file format`,
    "文件编码不是 UTF-8，请另存为 UTF-8 后重试。": `The file encoding is not UTF-8, please save it as UTF-8 and try again.`,
    新上限低于已交付资源数: `The new upper limit is lower than the number of delivered resources`,
    "新业务仅支持 USD、CNY 和 USDT": `new business only supports USD, CNY and USDT`,
    "新价格只能从今天或未来生效；历史价格不能修改": `New prices can only take effect from today or the future; historical prices cannot be modified.`,
    新价格生效日期必须在调整后的报价有效期内: `The effective date of the new price must be within the validity period of the adjusted quote`,
    "新凭据已保存，等待运行实例同步。请继续同步，不要重新发起刷新。": `New credentials have been saved, waiting for running instance synchronization. Please continue syncing and do not reinitiate the refresh.`,
    "新凭据已持久保存，运行实例已完成同步。可在资源列表同步最新账号状态。": `The new credentials have been persisted and the running instance has completed synchronization. The latest account status can be synchronized in the resource list.`,
    新初始密码: `New initial password`,
    "新增 / 启停汇率版本": `Add/start/stop exchange rate version`,
    "新增 CCMAX 目标": `New CCMAX target`,
    新增交付: `New delivery`,
    "新增交付 ": `New delivery `,
    新增代理: `New proxy`,
    "新增代理 ": `New proxy `,
    "新增后即可用于项目创建。": `can be used for project creation after it is added.`,
    新增团队成员: `New team member`,
    "新增大类 ": `New category `,
    "新增展示配置 ": `New display configuration `,
    新增工作台展示配置: `New workbench display configuration`,
    "新增成员 ": `New member `,
    "新增报价行 ": `Add quote line `,
    新增收款账户: `Add a new payment account`,
    新增汇率版本: `New exchange rate version`,
    "新增版本 ": `new version `,
    "新增目标 ": `New target `,
    新增账户: `New account`,
    "新增账户 ": `New account `,
    新增项目大类: `New project category`,
    新密码: `New password`,
    新密码不能与当前密码相同: `The new password cannot be the same as the current password`,
    "新建 / 编辑 / 发布通知": `Create, edit or publish announcements`,
    "新建 / 编辑 / 启停项目": `Create, edit, enable or disable projects`,
    "新建 API 密钥": `Create new API key`,
    新建供应商: `New supplier`,
    "新建供应商 ": `New supplier `,
    "新建供应商 / 修改资料": `Create new supplier/modify information`,
    "新建密钥 ": `Create new key `,
    "新建或重置后，首次登录必须修改密码": `After creating or resetting, the password must be changed when logging in for the first time.`,
    新建系统通知: `New system notification`,
    新建结算单: `New settlement`,
    新建角色: `Create a new role`,
    "新建角色 ": `Create a new role `,
    "新建通知 ": `New notification `,
    新建通知草稿: `New draft notification`,
    新建项目: `New project`,
    "新建项目 ": `New project `,
    新报价待审: `New quote pending review`,
    新登录账号: `New login account`,
    方式: `method`,
    无人民币参考汇率查看权限: `No permission to view RMB reference exchange rate`,
    无参考汇率查看权限: `You do not have permission to view reference exchange rates`,
    无导出权限或登录已失效: `No export permission or login has expired`,
    "无待办，未发送": `No pending, not sent`,
    无效接收范围: `Invalid receiving range`,
    无效的交付方式筛选: `Invalid delivery method filter`,
    无效的币种: `Invalid currency`,
    无效的报价方式: `Invalid quote method`,
    无效的报价状态: `Invalid quote status`,
    无效的排序字段: `Invalid sort field`,
    无效的排序方向: `Invalid sort direction`,
    无效的结算方式筛选: `Invalid settlement method filter`,
    无效的认证方式: `Invalid authentication method`,
    无效的项目状态筛选: `Invalid project status filter`,
    无效的项目能力类型: `Invalid project capability type`,
    无效通知状态: `Invalid notification status`,
    无数据: `No data`,
    无此操作权限: `No permission for this operation`,
    "无法与 HTTPS 代理完成握手": `Unable to complete handshake with HTTPS proxy`,
    无法核对实际代理绑定: `Unable to verify actual proxy binding`,
    "无法生成原账号授权链接；请确认原账号身份可验证、目标权限及账号状态": `The original account authorization link cannot be generated; please confirm that the identity of the original account can be verified, the target permissions and the account status`,
    无法解析代理地址: `Unable to resolve proxy address`,
    无法连接代理: `Unable to connect to proxy`,
    无法连接服务器: `Unable to connect to the server`,
    无法连接检测中转服务: `Unable to connect to detection transfer service`,
    无草稿编辑权限: `No draft editing permissions`,
    无请求体: `No request body`,
    无需付款: `No payment required`,
    无需认证: `No certification required`,
    日: `Sun`,
    日期: `Date`,
    "日期 × 供应商 × 项目汇总": `Date × Supplier × Project Summary`,
    日期不正确: `date is incorrect`,
    日期范围: `date range`,
    "日期进度： ": `date progress: `,
    日结: `Daily settlement`,
    日账: `Daily bills`,
    "日账任务按服务类型运行，不指定单个目标": `Daily accounting tasks are run by service type and do not specify a single target.`,
    日账分组汇总: `Daily account group summary`,
    日账导出: `Daily ledger export`,
    "日账导出\n数据时点：": `Daily account export 
 data time point:`,
    日账导出任务: `Daily ledger export task`,
    "日账已变化，请重新预览": `The daily account has changed, please preview again`,
    日账快照行数核对不一致: `Daily account snapshot line number verification is inconsistent`,
    日账明细: `Daily bill details`,
    "日账查询条件不正确，日期跨度最长一年": `Daily account query conditions are incorrect, the date span is up to one year`,
    "日账核验已取消，拉取后自动入账": `Daily account verification has been cancelled, and it will be automatically entered into the account after being pulled.`,
    日账汇总: `Daily bill summary`,
    日账筛选条件: `Daily Account Filter Conditions`,
    日账筛选条件不正确: `Daily account filtering conditions are incorrect`,
    "日账统计加载失败：": `Daily account statistics loading failed:`,
    日账视图: `Daily account view`,
    日账运行状态已变化: `Daily account running status has changed`,
    日账采集完成: `Daily account collection completed`,
    "日账金额已变化，请重新预览后生成结算单": `The daily account amount has changed, please preview again and generate the settlement statement.`,
    "旧 CC lane 总费用快照不能纳入模型日账；请使用逐模型 tokenCostUsd 日账流程": `The old CC lane total cost snapshot cannot be included in the model daily account; please use the model-by-model tokenCostUsd daily account process`,
    "旧CSV计费导入已停用；本系统不生成日/月账单": `The old CSV billing import has been disabled; this system does not generate daily/monthly bills`,
    "旧计费明细导入已停用；请通过 /api/settlement-inputs 接收现行系统原始金额": `The import of old billing details has been disabled; please receive the current system original amount through /api/settlement-inputs`,
    时间: `time`,
    明细: `Details`,
    "明细 ": `Details `,
    明细入账状态: `Detailed entry status`,
    "明细文件每 ": `Detailed documents each `,
    明细条数: `Number of details`,
    明细账务日期: `Detailed accounting date`,
    明细项目: `detailed items`,
    星海数智: `Xinghai Digital Intelligence`,
    是: `Yes`,
    是否在线: `Online?`,
    是否更新业务状态: `Whether to update business status`,
    "显示 {0} / {1} 个项目": `Showing {0} / {1} items`,
    显示名称: `Display name`,
    显示密码: `Show password`,
    显示密钥: `display key`,
    "显示更多代理（已显示 ": `Show more proxies (shown `,
    显示确认密码: `Display confirmation password`,
    显示顺序: `display order`,
    显示顺序须为非负整数: `The display order must be a non-negative integer`,
    智能录入: `intelligent entry`,
    "智能录入资料不能超过 200 KB": `Smart input data cannot exceed 200 KB`,
    智能录入资源类型: `Intelligent input resource type`,
    暂不可启用: `Unavailable`,
    暂不支持此任务类型: `This task type is not supported yet`,
    "暂不支持申请 Setup Token": `Application for Setup Token is not currently supported.`,
    暂不支持该币种: `This currency is not supported yet`,
    暂停结算: `Settlement suspended`,
    "暂无 ": `None `,
    "暂无 {0} → {1} 当前参考汇率": `No current {0} → {1} reference exchange rate`,
    "暂无人工调整记录。": `has no manual adjustment record yet.`,
    暂无匹配代理: `No matching proxy yet`,
    "暂无匹配，可直接粘贴代理地址": `No match yet, you can directly paste the proxy address`,
    暂无历史密钥: `No historical key yet`,
    "暂无可交付项目，请先提交报价并等待审核生效。": `There are currently no deliverable items. Please submit your quote first and wait for the review to take effect.`,
    暂无可分配项目: `There are currently no assigned projects`,
    "暂无可分配项目，请先提交项目报价并等待审核通过。": `There are currently no assigned projects. Please submit a project quote first and wait for approval.`,
    "暂无可指定的平台运营账号，请先启用平台运营账号。": `There is currently no designated platform operation account. Please enable the platform operation account first.`,
    暂无可接收通知的账号: `There is currently no account to receive notifications.`,
    暂无可用于报价排行的项目: `There are currently no projects available for quote ranking.`,
    暂无可配置的项目品类: `There is currently no configured project category`,
    暂无启用代理: `No proxy is enabled yet`,
    暂无唯一有效报价: `There is currently no only valid quote`,
    暂无套餐与额度数据: `No package and quota data yet`,
    暂无已发布的参考数据: `No published reference data yet`,
    暂无当前生效的参考汇率: `There is no currently effective reference exchange rate.`,
    暂无当日数据: `No data for the day yet`,
    暂无待处理事项: `No pending items yet`,
    "暂无待审核的报价调整。": `There are no quote adjustments pending review.`,
    "暂无报价，可点击“新增报价行”开始填写": `There is no quote yet, you can click "Add quote line" to start filling in`,
    暂无收款账户: `No payment account yet`,
    暂无数据: `No data yet`,
    "暂无数据 ": `No data yet `,
    暂无新消息: `No new news yet`,
    暂无有效密钥: `No valid key yet`,
    暂无未读消息: `No unread messages yet`,
    暂无款项: `No payment yet`,
    暂无消息: `No news yet`,
    暂无消费金额: `No consumption amount yet`,
    暂无用量数据: `No usage data yet`,
    "暂无自定义角色，可先新建角色并配置权限。": `No custom roles yet. Create a role and configure its permissions first.`,
    暂无记录: `No records yet`,
    "暂无该币种已通过的收款账户，请先维护并审核账户。": `There is currently no approved payment account for this currency. Please maintain and review the account first.`,
    暂无金额: `No amount yet`,
    "暂时无法更新进度：": `The progress cannot be updated temporarily:`,
    "暂时无法获取你的资料，请刷新重试": `Your information cannot be obtained temporarily, please refresh and try again.`,
    更多数据: `More data`,
    "更多设置 · 默认全部项目、全部币种，五天内确认": `More settings · All projects and currencies; confirmation within five days`,
    更换中: `is being replaced`,
    更换代理: `Change proxy`,
    "更换代理 ": `Change proxy `,
    "更换将改变账号出口 IP，可能短暂中断服务。账号凭据保持。提交后可关闭页面，在“更换记录”查看进度。 ": `replacement will change the account exit IP and may temporarily interrupt the service. Account credentials are maintained. After submission, you can close the page and check the progress in "Replace Record". `,
    更换记录: `Replacement record`,
    "更新 Refresh Token": `Update Refresh Token`,
    "更新于 ": `updated on `,
    更新失败: `update failed`,
    更新已有账号授权进度: `Update existing account authorization progress`,
    更新强制刷新授权进度: `Update forced refresh of authorization progress`,
    更新时间: `update time`,
    最多分配30个附加角色: `Assign up to 30 additional roles`,
    "最多展示 200 张结算单": `Display up to 200 settlement documents`,
    最多绑定资源数: `Maximum number of bound resources`,
    最新刷新时间: `latest refresh time`,
    最新数据: `latest data`,
    最早待付: `Earliest payment due`,
    最短长度: `Minimum length`,
    最终应付: `final payment`,
    最终应收: `final receivable`,
    "最近 {0} 分钟后重置": `Reset after last {0} minutes`,
    "最近 {0} 天后重置": `Reset after the last {0} days`,
    "最近 {0} 小时后重置": `Reset after last {0} hours`,
    "最近使用 {0}": `Recently used {0}`,
    最近同步时间: `latest synchronization time`,
    "最近批量结算 ": `Latest batch settlement `,
    最近更新: `latest update`,
    "最近更新：": `latest update:`,
    "最近查询 ": `recent query `,
    最近观测: `recent observations`,
    最近进展: `Recent progress`,
    最长长度: `Maximum length`,
    月: `month`,
    "月 ": `month `,
    月份: `month`,
    "月份 ": `month `,
    "月份,币种,原始金额,最终应付,已确认应付,已付款,待付款,结算单数,供应商数\r\n": `month, currency, original amount, final payable, confirmed payable, paid, pending payment, number of settlement orders, number of suppliers\r 
`,
    月度应付趋势: `Monthly payment trend`,
    月度绩效: `Monthly performance`,
    月结: `Monthly`,
    有: `Yes`,
    "有一次交付结果尚未确认，请先刷新交付结果。": `One of the delivery results has not been confirmed, please refresh the delivery results first.`,
    有异议: `Objection`,
    有效: `is valid`,
    有效天数: `Valid days`,
    有效期: `Validity period`,
    "有效期至 ": `is valid until `,
    "有效期请填写未来的 Unix 毫秒时间戳。": `Please fill in the Unix millisecond timestamp in the future for the validity period.`,
    有效期调整记录: `Validity period adjustment record`,
    "有效期（可选，Unix 毫秒时间戳）": `Validity period (optional, Unix millisecond timestamp)`,
    "有效期（可选，Unix 毫秒时间戳） ": `Validity period (optional, Unix millisecond timestamp) `,
    "有效至 ": `is valid until `,
    有金额异议: `There is an amount objection`,
    "服务 / 项目": `Service/Project`,
    服务任务: `Service tasks`,
    服务器返回格式异常: `Invalid server response`,
    服务地址: `Service address`,
    "服务账号 JSON": `service account JSON`,
    "服务账号 JSON 内容过长，整理后的内容不能超过 64,000 字符。": `The service account JSON content is too long, and the edited content cannot exceed 64,000 characters.`,
    "服务账号 JSON 缺少必要字段 {0}。": `The service account JSON is missing the required field {0}.`,
    "服务账号 JSON 须为对象。": `Service account JSON must be an object.`,
    期间: `period`,
    "期间内没有可结算的单日金额；跨天来源须按真实每日金额拆分，已分配/作废/跨出选择期间的记录不纳入": `There is no single-day amount that can be settled during the period; cross-day sources must be split according to the real daily amount, and records that have been allocated/voided/out of the selected period are not included`,
    "期间改为 ": `period changed to `,
    "期间改为 {0} 至 {1}": `Period changed to {0} to {1}`,
    未交付: `not delivered`,
    未交付或历史记录无快照: `Not delivered or history has no snapshot`,
    未付款: `Unpaid`,
    "未保存可信报价快照，保留已入账应付": `The trusted quote snapshot is not saved, and the credited quote snapshot is retained.`,
    未入账: `not recorded`,
    未关联: `not associated`,
    未分类: `Uncategorized`,
    未分配: `not assigned`,
    未到账或金额有异议: `The account has not been received or the amount is disputed`,
    未单独允许: `not individually allowed`,
    未取得资源详情: `Resource details not obtained`,
    未变更: `unchanged`,
    未启用: `Not enabled`,
    未命名项目: `Unnamed project`,
    未填写: `Not provided`,
    未填写邮箱: `Email address not filled in`,
    未安排: `Not scheduled`,
    未归属: `not assigned`,
    未找到匹配项目: `No matching item found`,
    "未找到资源凭据，请补充 Key": `Resource credentials not found, please add Key`,
    未提交: `not submitted`,
    未提供: `not provided`,
    未提供模型: `No model provided`,
    未收到响应: `No response received`,
    未收到响应体: `No response body received`,
    未来价格: `future price`,
    未查询: `not queried`,
    未检测: `not detected`,
    未知: `Unknown`,
    未知创建人: `Unknown creator`,
    未知状态: `unknown status`,
    "未知状态（{0}）": `Unknown status ({0})`,
    未知申请人: `Unknown applicant`,
    未知类型: `Unknown type`,
    未税: `tax not included`,
    "未税（不自动计税）": `No tax (no automatic tax calculation)`,
    未绑定: `not bound`,
    未能连通目标地址: `Failed to connect to target address`,
    未设到期时间: `No expiration time set`,
    未设置分组: `Grouping not set`,
    未读消息: `Unread messages`,
    未选择: `Not selected`,
    未选择能力类型时不能提交能力口径: `Select a capacity type before specifying its capacity definition.`,
    "未选择项目时，成员没有项目操作权限。 ": `When no project is selected, members do not have project operation rights. `,
    未配置: `not configured`,
    未配置企业微信机器人: `Enterprise WeChat robot is not configured`,
    未配置有效的企业微信机器人: `A valid WeCom bot has not been configured.`,
    末尾: `Last`,
    "本代理已交付 ": `This proxy has been delivered `,
    本供应商全部操作: `All operations of this supplier`,
    "本供应商已有这个登录账号，请在列表中重置密码或更换登录账号": `This supplier already has this login account, please reset the password or change the login account in the list`,
    "本单确认截止时间已到，请关闭弹窗并刷新结算单状态": `The deadline for confirmation of this order has arrived. Please close the pop-up window and refresh the settlement order status.`,
    "本单确认截止时间已到，请关闭弹窗并刷新结算单状态。": `The deadline for confirmation of this order has arrived. Please close the pop-up window and refresh the settlement order status.`,
    "本单确认截止时间已到，请刷新查看最新状态。 ": `The deadline for confirmation of this order has arrived, please refresh to view the latest status. `,
    本地已交付: `has been delivered locally`,
    "本地模拟已受理，不发生真实转账": `The local simulation has been accepted and no real transfer will occur.`,
    "本地模拟等待测试结果；非银行查询": `Local simulation waiting for test results; non-bank query`,
    "本地模拟结果，不发生实际出款": `Local simulation results, no actual withdrawal occurs`,
    "本地模拟请求已受理，未发生真实出款": `The local simulation request has been accepted, but no actual withdrawal has occurred.`,
    "本地模拟（不出款）": `local simulation (no payment)`,
    本地测试事件: `local test event`,
    "本地清算 LOCAL": `Local clearing LOCAL`,
    "本地目标关联已变化，请平台核对": `The local target association has changed, please check with the platform`,
    "本张单生成失败，请重新尝试；重复失败请联系管理员": `This sheet failed to be generated, please try again; if it fails again, please contact the administrator.`,
    本期应付: `Payable in this period`,
    本期应收: `Receivables in this period`,
    "本期结算数量 × 已确认单价": `Current settlement quantity × confirmed unit price`,
    本期金额已确认: `The amount of this period has been confirmed`,
    "本次交付结果尚未确认。请先在CCMAX核实没有创建成功；已有账号或无法确认时，请勿继续，以免重复交付或遗漏账号。 ": `The result of this delivery has not yet been confirmed. Please first verify whether the creation is successful in CCMAX; if you already have an account or cannot confirm it, please do not continue to avoid repeated delivery or missing an account. `,
    本次向供应商支付: `This payment to the supplier`,
    本次应付合计: `Total payable this time`,
    本次应付抵扣: `Deduction payable this time`,
    本次应收抵扣: `Deduction of this receivable`,
    "本次抵扣应付（{0}）": `This deduction is payable ({0})`,
    "本次授权已取消，请重新生成授权链接。": `This authorization has been cancelled, please regenerate the authorization link.`,
    "本次提交已取消，可重新提交。": `This submission has been canceled and can be resubmitted.`,
    本次提交的变更: `Changes submitted this time`,
    本次收款: `This payment`,
    "本次暂存凭据已过期，请查询原操作后重新生成 OAuth 链接登录原账号。 ": `The temporary credentials have expired. Please check the original operation and regenerate the OAuth link to log in to the original account. `,
    "本次查询截至 ": `This inquiry ends `,
    "本次请求未确认，请查询原操作；不要更换请求或重复使用一次性凭据。": `This request is not confirmed, please check the original operation; do not change the request or reuse one-time credentials.`,
    "本笔付款将超过 Airwallex 每日出款限额": `This payment will exceed the Airwallex daily withdrawal limit`,
    "本笔付款将超过 Binance 每日出款限额": `This payment will exceed Binance’s daily withdrawal limit`,
    "本笔付款将超过 OKX 每日出款限额": `This payment will exceed OKX’s daily withdrawal limit`,
    本笔付款尚未进入通道或已被关闭: `This payment has not entered the channel or has been closed`,
    "本类 {0} 项 · 共 {1} 项": `{0} items in this category · {1} items in total`,
    "本系统记录交付结果异常，请联系平台核对。": `This system records abnormal delivery results, please contact the platform for verification.`,
    本页全选: `Select all on this page`,
    "机器人 Webhook 地址": `Robot Webhook Address`,
    机器人设置: `robot settings`,
    机器人配置: `Bot settings`,
    机器人配置不正确: `Robot configuration is incorrect`,
    "机器人配置已保存，下一轮执行使用新配置": `The robot configuration has been saved and the new configuration will be used in the next round of execution.`,
    "机器人配置已变化，请刷新重试": `The robot configuration has changed, please refresh and try again.`,
    "权限不足或 CSRF 校验失败，请刷新重试": `Permission denied or security check failed. Refresh and try again.`,
    "权限或 CSRF 校验拦截": `Permission or CSRF verification interception`,
    "权限管理 ": `Permission Management `,
    权限配置: `Permissions`,
    权限项目大类筛选: `Filtering of categories of authorized projects`,
    条: `records`,
    "条记录；待计价消耗不计入应付。 ": `records; consumption to be calculated is not included in payables. `,
    "条，待核对 ": `, to be checked `,
    来源: `Source`,
    "来源 / 导出": `Source/Export`,
    "来源 IP": `source IP`,
    来源单号: `source number`,
    "来源单号已存在但内容不同，不允许覆盖：": `The source order number already exists but the content is different and overwriting is not allowed:`,
    来源已修订: `Source revised`,
    "来源已变化，请人工核对差额": `The source has changed, please check the difference manually.`,
    来源应付: `Source payable`,
    来源笔数: `source number`,
    来源类型: `source type`,
    来源编号或关键词: `source number or keyword`,
    来源账单期间: `source bill period`,
    "来源账单跨越报价版本，请现行系统按报价生效期间拆分原始金额；不能按天数摊分猜价": `The source bill crosses the quote version. Please use the current system to split the original amount according to the effective period of the quote; the guess price cannot be divided according to the number of days.`,
    "来源金额已被其他结算占用，请刷新重试": `The source amount has been occupied by other settlements, please refresh and try again.`,
    "来源金额或归属已变化，当前结算单暂停确认。请由平台撤回后重新生成。 ": `The source amount or attribution has changed, and confirmation of the current settlement document is suspended. Please withdraw it from the platform and regenerate it. `,
    "来源金额或归属已变化，请由平台撤回后重新生成结算单": `The source amount or attribution has changed. Please withdraw it from the platform and regenerate the settlement form.`,
    "林亦 · 运营": `Lin Yi·Operation`,
    "查单间隔（秒，自动调度预留）": `Order checking interval (seconds, reserved for automatic scheduling)`,
    查看: `View`,
    "查看 ": `View `,
    "查看 / 下载付款凭证 ": `View/Download Payment Voucher `,
    "查看「付款记录」标签页": `View the "Payment History" tab`,
    "查看「汇率版本」标签页": `View the "Exchange Rate Version" tab`,
    查看与修改系统参数: `View and modify system parameters`,
    查看与管理角色: `View and manage roles`,
    查看与管理账号: `View and manage accounts`,
    查看代理配置: `View proxy configuration`,
    "查看供应商 ": `View suppliers `,
    查看供应商列表与详情: `View supplier list and details`,
    "查看依据 ": `View basis `,
    "查看全部 ": `View all `,
    "查看原交付记录 ": `View original delivery record `,
    "查看原始请求与响应（技术字段）": `View original request and response (technical field)`,
    "查看各供应商的代理归属，并可检测连通性。检测失败不会自动停用。": `View the proxy affiliation of each supplier and detect connectivity. Detection failures are not automatically deactivated.`,
    "查看各服务任务的自动与手动执行结果，按开始时间倒序。": `View the automatic and manual execution results of each service task in reverse order of start time.`,
    查看完整收款账号: `View the complete payment account number`,
    查看完整账号: `View full account`,
    查看审计日志: `View audit log`,
    查看工作台: `View workbench`,
    查看归属记录: `View ownership records`,
    查看待办: `View to-do`,
    查看扩展信息: `View extended information`,
    查看报价列表与详情: `View quote list and details`,
    查看报表: `View report`,
    查看收款: `View payment`,
    查看收款管理: `View payment management`,
    查看收款账户: `Check the payment account`,
    "查看明细 ": `View details `,
    查看本方或授权资源: `View our or authorized resources`,
    "查看本账号创建的日账导出，文件保留7天": `View the daily account export created by this account, and the file will be retained for 7 days.`,
    查看每日营业额: `View daily turnover`,
    查看汇率版本: `View exchange rate version`,
    查看汇率详情: `View exchange rate details`,
    "查看相关记录 ": `View related records `,
    "查看站点 RPM / TPM": `View Site RPM/TPM`,
    "查看结果 ": `View results `,
    "查看结算单 ": `View settlement statement `,
    查看结算单明细: `Check the settlement statement details`,
    查看结算管理: `View settlement management`,
    "查看详情 ": `View details `,
    查看账务结算单: `View the accounting statement`,
    查看账务金额记录: `View account amount records`,
    查看资源原始请求: `View resource original request`,
    查看资源密钥与模型映射: `View resource key and model mapping`,
    查看资源接口配置: `View resource interface configuration`,
    查看资金通道: `View payment providers`,
    查看资金通道调用日志: `Check the fund channel call log`,
    查看进度: `View progress`,
    "查看金额记录 ": `View amount record `,
    查看项目列表与详情: `View project list and details`,
    查询: `Query`,
    "筛选条件已修改，点击查询后更新结果。": `Filters have changed. Click Query to update the results.`,
    "查询 CCMAX 状态与费用": `Query CCMAX status and cost`,
    "查询、响应校验或写入失败": `Query, response verification or writing failure`,
    "查询中…": `Querying…`,
    查询失败: `Query failed`,
    "查询并发设置已变化，请重新读取后确认保存": `Query concurrency settings have changed, please re-read and confirm to save.`,
    查询授权进度: `Query authorization progress`,
    "查询操作结果 ": `Query operation results `,
    查询时间: `query time`,
    查询条件不正确: `Incorrect query conditions`,
    查询条件过长: `Query condition is too long`,
    查询结果未知: `query result unknown`,
    查询范围已覆盖: `The query range has been covered`,
    查询账号状态和用量: `Query account status and usage`,
    查询资源消耗: `Query resource consumption`,
    查询通道结果: `Query channel results`,
    柱状图: `Histogram`,
    "柱状图 ": `Histogram `,
    "标记中…": `Marking…`,
    校验中: `checking`,
    校验报价并计算应付: `Verify quote and calculate payable`,
    核对: `Verification`,
    核对交付结果: `Check delivery results`,
    核对到账情况: `Check the account arrival status`,
    "核对到账情况 ": `Check the account arrival status `,
    核对同一请求: `Verify the same request`,
    核对后删除: `Delete after verification`,
    核对后编辑: `Edit after verification`,
    核对失败: `Verification failed`,
    核对收款: `Check receipt`,
    核对本期应收金额: `Check the amount receivable in the current period`,
    核对绑定中: `Verifying binding`,
    核对结果: `Reconciliation outcome`,
    核对资料: `Check information`,
    "核对逐模型费用 ": `Check model-by-model costs `,
    格式: `format`,
    检查资源接口连接: `Check resource interface connection`,
    检查连接: `Check connection`,
    检测: `detection`,
    "检测中…": `testing...`,
    "检测中转仅支持 SOCKS5": `detection relay only supports SOCKS5`,
    检测中转地址不在允许的公网范围: `Detection that the transit address is not within the allowed public network range`,
    "检测中转失败：": `Failed to detect transfer:`,
    检测中转未能建立到代理的连接: `Detection relay failed to establish connection to the proxy`,
    检测中转配置无法读取: `Detection transfer configuration cannot be read`,
    检测代理连接: `Detect proxy connection`,
    检测完成进度: `detection completion progress`,
    检测未能完成: `Test failed to complete`,
    检测结果返回不完整: `The test result returned is incomplete`,
    检测请求失败: `Detection request failed`,
    检测超时: `detection timeout`,
    检测通过: `passed the test`,
    检索项目名称或大类: `Search project name or category`,
    概览币种: `Overview of currencies`,
    模型: `Model`,
    模型或入账状态查询条件不正确: `The model or entry status query conditions are incorrect.`,
    "模型日账归属已变化，不能计价": `The daily account ownership of the model has changed and cannot be priced.`,
    模型映射: `model mapping`,
    模型标识过长: `model identification is too long`,
    "模型（应用于本次全部资源，选填）": `model (applied to all resources this time, optional)`,
    "模型（选填）": `model (optional)`,
    "模型：": `model:`,
    "模拟 · ": `Simulation · `,
    "模拟 · 未真实出款": `Simulation · No real payment`,
    "模拟事件已处理，未发生实际出款": `The simulation event has been processed, but no actual withdrawal has occurred.`,
    模拟成功: `simulation successful`,
    "模拟支付返回（仅本地）": `simulated payment return (local only)`,
    模拟确定失败: `Simulation determination failed`,
    模拟结果: `simulation results`,
    模拟结果不明: `Unknown simulation result`,
    模拟返回结果: `simulation return result`,
    模拟通道未显式授权: `Analog channel is not explicitly authorized`,
    次: `request`,
    次日入账: `will be credited the next day`,
    欧意: `Ouyi`,
    "欧意 UID 内部转账": `European and Italian UID internal transfer`,
    "欧意 USDT 链上提币与 UID 内部转账。": `EU-Yi USDT on-chain currency withdrawal and UID internal transfer.`,
    欧洲经济区: `European Economic Area`,
    款项说明: `Payment Description`,
    止: `To`,
    "止 ": `To `,
    "正在保存…": `Saving…`,
    "正在保存并发…": `Saving concurrency...`,
    "正在停止检测，等待在途请求完成": `Stopping detection, waiting for the request in transit to be completed`,
    "正在分发…": `is being distributed…`,
    "正在创建…": `is creating…`,
    "正在刷新授权，请稍后查询原操作结果。": `The authorization is being refreshed, please check the original operation results later.`,
    "查询超时，请稍后重试": `The query timed out. Please retry shortly.`,
    "加载超时，请重试": `Loading timed out. Please retry.`,
    正在加载: `Loading…`,
    "正在加载 ": `Loading… `,
    "正在加载…": `Loading…`,
    "正在加载代理…": `Loading proxy...`,
    "正在加载日账统计…": `Loading daily account statistics...`,
    "正在加载筛选选项…": `Loading filter options…`,
    "正在加载账号…": `Loading account...`,
    正在取数: `is getting the number`,
    "正在处理…": `is processing...`,
    "正在恢复草稿…": `Resuming draft...`,
    "正在拒绝…": `is rejecting…`,
    "正在提交…": `is submitting...`,
    "正在提交，等待确认": `is submitting, waiting for confirmation`,
    "正在提交，请稍后查询原操作": `is being submitted, please check the original operation later.`,
    正在收集当前筛选的全部代理: `is collecting all currently filtered proxies.`,
    "正在查询…": `is querying...`,
    "正在查询有效报价… ": `Querying valid quote... `,
    "正在核对记录数量…": `Checking the number of records...`,
    "正在核算…": `is calculating...`,
    "正在检查…": `Checking...`,
    "正在汇总…": `is summarizing...`,
    正在生成: `is generating`,
    "正在生成 · 已生成 {0} 张": `is generating · {0} pictures have been generated`,
    "正在生成…": `is generating...`,
    正在生成授权链接: `Generating authorization link`,
    "正在登记…": `is registering...`,
    "正在继续加载代理，已加载的可直接选择…": `is continuing to load the proxy. If it is already loaded, you can select it directly...`,
    正在自动重试: `is retrying automatically`,
    "正在自动重试，请等待处理结果，勿重复提交。": `is automatically retrying, please wait for the processing result and do not submit again.`,
    "正在补交…": `is being resubmitted...`,
    "正在识别…": `Recognizing…`,
    "正在读取…": `Reading...`,
    "正在读取人民币参考汇率…": `is reading the RMB reference exchange rate...`,
    "正在读取倍率配置…": `Reading multiplier configuration...`,
    "正在读取参考汇率…": `Loading reference exchange rates…`,
    "正在读取密码规则…": `Reading password rules...`,
    "正在读取平台运营…": `is reading platform operation...`,
    正在读取报价倍率范围: `Reading the quote multiple range`,
    正在读取报价折扣范围: `Loading discount limits`,
    "正在读取运行情况…": `Reading operation status...`,
    "正在读取预览…": `Reading preview...`,
    "正在选择全部…": `Selecting all…`,
    "正在逐项交付…": `is being delivered item by item…`,
    "正在采集…": `is collecting...`,
    "正在采集：{0}": `is collecting: {0}`,
    "正在重新读取并发配置…": `Re-reading concurrent configuration...`,
    正常: `normal`,
    正常生成: `generated normally`,
    "正式交付前必填；资源名称由系统按规则生成。": `is required before formal delivery; the resource name is generated by the system according to rules.`,
    正式提交: `Officially submitted`,
    正式提交或保存草稿后由系统生成: `Generated by the system when submitted or saved as a draft.`,
    "正数增加，负数扣减；不会修改原始金额和报价快照。": `increases the positive number and deducts the negative number; the original amount and quote snapshot will not be modified.`,
    此代理已经存在: `This proxy already exists`,
    此代理已经导入: `This proxy has been imported`,
    "此历史记录未保留原始报文，以下为当时保存的内容。": `This historical record does not retain the original message. The following is the content saved at that time.`,
    "此记录已保存在本地，但尚未创建 CCMAX 目标。补交成功后才算交付成功。": `This record has been saved locally, but the CCMAX target has not been created. The delivery is considered successful only after the re-submission is successful.`,
    "此账号需要先修改初始密码。修改成功后请重新登录。": `This account needs to change the initial password first. Please log in again after the modification is successful.`,
    "每 ": `every `,
    "每 {0} 分钟": `Every {0} minutes`,
    "每 {0} 天结算": `Settlement every {0} days`,
    每个账号价格: `Price per account`,
    "每个账号独立随机生成，不使用所有人通用的固定密码。随机部分至少 12 位。": `Generate a unique random password for each account. The random portion must contain at least 12 characters.`,
    "每个项目独立保留排序方式；点击报价或能力列头切换排序。能力缺失的历史报价始终置末且不计名次。 ": `Each item retains the sorting method independently; click the quote or capability column header to switch the sorting. Historical quotations with missing abilities are always placed at the bottom and are not included in the ranking. `,
    "每批录入 1—1000 条计费明细": `Enter 1-1000 billing details per batch`,
    "每批须包含 1 至 100 份交付": `Each batch shall contain 1 to 100 deliveries`,
    每日: `Daily`,
    "每日上限（USDT）": `Daily upper limit (USDT)`,
    "每日上限（按付款币种）": `Daily upper limit (by payment currency)`,
    每日汇总: `Daily summary`,
    每日消耗: `Daily consumption`,
    每日营业额: `Daily turnover`,
    "每日营业额{0}": `Daily turnover {0}`,
    每日限额不能小于单笔限额: `The daily limit cannot be less than the single transaction limit`,
    每日额度: `Daily quota`,
    每月: `monthly`,
    每月应付: `Payable monthly`,
    "每月应付.csv": `Monthly payable.csv`,
    每月额度: `Monthly quota`,
    "每条代理独立设置绑定上限。": `Each proxy sets the binding upper limit independently.`,
    每条代理绑定上限: `Resource limit per proxy`,
    "每条完成独立交付。OAuth 需在单条新增中逐个完成授权；结果待核对时保留原记录与提交编号。 ": `Each item is delivered independently. OAuth requires authorization to be completed one by one in a single new entry; the original record and submission number will be retained while the results are being verified. `,
    每类服务统一配置运行周期和同步范围: `Configure the schedule and synchronization scope for each service.`,
    每组交付资料必须为请求对象: `Each set of delivery materials must be the object of the request`,
    每隔多少天结算: `Settlement every how many days`,
    每页显示条数: `Number of items displayed per page`,
    汇总: `summary`,
    "汇总供应商维护的收款账户，默认展示生效中的账户；待审核、已退回和已替换记录可通过状态筛选查看。 ": `View supplier payment accounts. Active accounts are shown by default; use the status filter to view pending, returned or replaced accounts. `,
    汇率: `exchange rate`,
    汇率依据: `exchange rate basis`,
    汇率新版本已发布: `exchange rate has been released`,
    汇率方向: `exchange rate direction`,
    "汇率最多保留 12 位小数": `The exchange rate can retain up to 12 decimal places.`,
    汇率来源: `exchange rate source`,
    汇率版本: `Exchange rate version`,
    "汇率版本已发生变化，请刷新后重试": `The exchange rate version has changed, please refresh and try again.`,
    汇率版本状态已更新: `exchange rate version status has been updated`,
    "汇率（1 基准币种兑换）": `exchange rate (1 base currency exchange)`,
    没有匹配的自定义角色: `No matching custom role`,
    "没有匹配的选项 ": `No matching options `,
    "没有匹配的项目，请调整项目名称或大类。 ": `There is no matching project, please adjust the project name or category. `,
    没有可生成的结算单: `No settlement document can be generated`,
    没有执行此操作的权限: `You do not have permission to perform this action.`,
    没有找到匹配的代理: `No matching proxy found`,
    没有未读消息: `No unread messages`,
    "没有查看报价的权限，无法带入交付资料": `does not have the permission to view the quote and cannot bring in the delivery information.`,
    没有符合当前检索和大类条件的项目: `There are no items that meet the current search and category conditions`,
    "没有账号？立即注册": `Don’t have an account? Register now`,
    没有资源交付权限: `No resource delivery permission`,
    "没有逐批记录。": `There is no batch-by-batch record.`,
    没有需要重新生成的结算单: `There is no settlement document that needs to be regenerated.`,
    "注册审批已关闭，系统自动通过": `Registration approval is disabled; the profile was approved automatically.`,
    "注册成功，请登录后填写个人及企业资料": `Registration successful, please log in and fill in your personal and corporate information`,
    注册编号: `registration number`,
    注册账号: `Register account`,
    测试通道连接: `Test channel connection`,
    消息通知: `Notifications`,
    "消息通知，{0} 条未读": `message notification, {0} unread`,
    "消息通知，{0} 条未读|one": `Notifications, {0} unread message`,
    "消息通知，没有未读": `message notification, no unread`,
    消耗: `Usage`,
    "消耗 / 原始金额": `Usage / base amount`,
    消耗合计: `Total consumption`,
    "消费观测缺少买断数量，不能按消费金额计算买断应付": `The consumption observation lacks the buyout quantity, and the buyout payable cannot be calculated based on the consumption amount.`,
    消费金额: `Consumption amount`,
    "消费金额（CC目标）": `Consumption amount (CC target)`,
    添加供应商用户: `Add supplier user`,
    "添加或启用代理后，可在交付时选择；也可切换状态筛选查看全部代理。": `After adding or enabling an proxy, you can select it during delivery; you can also switch the status filter to view all proxies.`,
    添加模式: `Add mode`,
    "添加用户 ": `Add user `,
    "清空 ": `Clear `,
    清空搜索: `Clear search`,
    "清空选择 ": `Clear selection `,
    "清除{0}筛选": `Clear {0} filter`,
    "清除后无法启用提醒，需重新填写机器人地址。": `The reminder cannot be enabled after clearing, and the robot address needs to be filled in again.`,
    清除已保存机器人: `Clear saved robots`,
    清除筛选: `Clear filter`,
    "清除筛选 ": `Clear filter `,
    "点击代理可查看绑定资源；地址按当前账号权限展示。检测只说明当次能否经该代理连出，不会自动停用。 ": `Click the proxy to view the bound resources; the address is displayed according to the current account permissions. The test only shows whether the connection can be made through the proxy at that time, and will not be automatically deactivated. `,
    "点击查看完整业务信息。": `Click to view complete business information.`,
    "版本 V": `version V`,
    状态: `Status`,
    状态处理: `status processing`,
    状态已更新: `Status updated`,
    状态未知: `status unknown`,
    "状态未知 ": `status unknown `,
    状态查询: `status query`,
    独立单价: `Fixed unit price`,
    现在: `now`,
    现行系统原始金额: `Current system original amount`,
    "现行系统原始金额 × 折扣百分比": `Original amount × discount percentage`,
    "现行系统原始金额 × 报价倍率": `Current system original amount × quote multiple`,
    "现行系统原始金额 × 报价折扣": `Current system original amount × quote discount`,
    现行系统来源单号: `Current system source order number`,
    "现行系统自动接入待完成；当前仅支持平台人工接收": `The current system’s automatic access is to be completed; currently only manual reception by the platform is supported`,
    现货账户: `spot account`,
    生产环境: `production environment`,
    生产环境禁止演示数据和开发密钥: `Demo data and development keys are prohibited in the production environment`,
    "生成 CCMAX 授权链接": `Generate CCMAX authorization link`,
    "生成中 · 已生成 {0} 张": `Generating · {0} created`,
    生成执行预检: `Generate execution preflight`,
    "生成授权入口 ": `Generate authorization entry `,
    生成授权链接: `Generate authorization link`,
    生成新的授权链接: `Generate a new authorization link`,
    生成时间: `generation time`,
    生成格式: `Generation format`,
    生成结算单: `Generate settlements`,
    生效中: `Active`,
    生效日期: `Effective date`,
    生效日期不能早于北京时间今天: `The effective date cannot be earlier than today in Beijing time.`,
    生效时间: `effective time`,
    生效结束日期不能早于开始日期: `The effective end date cannot be earlier than the start date`,
    "用于创建、重置和修改密码；不会直接改写已有密码。": `Is used to create, reset and modify passwords; it will not directly overwrite existing passwords.`,
    用户: `user`,
    用户已关联: `user has been associated`,
    "用户已被其他供应商关联，请刷新重试": `The user has been associated with another supplier, please refresh and try again.`,
    申报能力: `Declared capacity`,
    "申报能力 / 补充说明": `Capacity / notes`,
    申请中占用: `occupied during application`,
    申请人: `applicant`,
    申请付款: `Apply for payment`,
    "申请付款 ": `Apply for payment `,
    "申请变更 ": `Request change `,
    "申请已关闭，金额占用已释放": `The application has been closed and the amount occupied has been released`,
    申请报价调整: `Apply for quote adjustment`,
    申请时间: `application time`,
    申请类型: `application type`,
    电子邮箱: `Email`,
    "电子邮箱（选填）": `Email (optional)`,
    电话: `Phone`,
    界面语言: `Interface language`,
    留空则按系统参数安全随机生成: `If left blank, it will be generated safely and randomly according to system parameters.`,
    留空则按系统参数随机生成: `If left blank, it will be randomly generated according to system parameters.`,
    留空表示不更换: `Leave blank to indicate no replacement`,
    留空表示保持原地址: `Leave it blank to keep the original address`,
    留空表示保留原值: `Leave it blank to keep the original value`,
    登录: `Sign in`,
    "登录会话暂时无法验证，请稍后重试": `Your session cannot be verified right now. Try again later.`,
    登录保护: `Login protection`,
    "登录失败次数为 3—20 次，锁定时间为 1—1440 分钟": `The number of failed logins is 3-20 times, and the lock time is 1-1440 minutes.`,
    "登录安全校验失败，请刷新页面后重试": `Sign-in security check failed. Refresh and try again.`,
    "登录尝试过于频繁，请稍后重试": `Too many sign-in attempts. Try again later.`,
    "登录已失效，请重新登录": `Your session has expired. Sign in again.`,
    登录或注册频率拦截: `Login or registration frequency interception`,
    登录系统: `Login system`,
    登录账号: `Login account`,
    登录账号已存在: `Login account already exists`,
    "登录账号已存在，请更换登录账号": `This login already exists. Please choose another login.`,
    登记付款申请失败: `Registration payment application failed`,
    登记付款结果: `Registration payment result`,
    登记每日营业额: `Register daily turnover`,
    登记营业额: `Record turnover`,
    的: `of`,
    监控令牌: `monitoring token`,
    监控接口地址: `monitoring interface address`,
    "监控数据暂时不可用，请稍后重试": `Monitoring data is temporarily unavailable, please try again later.`,
    "监控配置已变化，请刷新": `The monitoring configuration has changed, please refresh`,
    "目前合作已停用，历史资料仍可查看。": `The cooperation is currently disabled, and historical data can still be viewed.`,
    目标: `target`,
    目标不存在或未启用: `The target does not exist or is not enabled.`,
    目标代理: `target proxy`,
    目标代理绑定不匹配: `Target proxy binding does not match`,
    "目标侧资源已创建：": `The target side resource has been created:`,
    "目标冷却中；保留本地交付记录": `The target is cooling; keep local delivery records`,
    目标创建响应不完整: `Incomplete target creation response`,
    目标创建成功: `Target created successfully`,
    "目标创建结果待核对，暂不能修改草稿": `The target creation result needs to be verified, and the draft cannot be modified yet.`,
    "目标创建结果待核对，暂不能再次提交": `The target creation result needs to be verified and cannot be submitted again.`,
    "目标创建结果待核对，暂不能重新授权": `The target creation result needs to be verified and re-authorization is not possible at the moment.`,
    目标创建结果未确认: `The target creation result is not confirmed`,
    目标创建结果状态已变化: `The status of the target creation result has changed`,
    "目标加载失败：": `Target loading failed:`,
    目标名称: `Target name`,
    "目标名称须为1-128字": `Target name must be 1-128 characters`,
    "目标地址与原账号实例不一致，不能刷新授权": `The target address is inconsistent with the original account instance, and the authorization cannot be refreshed.`,
    "目标地址与原账号实例不一致，不能重新授权": `The target address is inconsistent with the original account instance and cannot be reauthorized.`,
    目标地址须为HTTPS或已明确允许的HTTP源: `The destination address must be HTTPS or an explicitly allowed HTTP source`,
    "目标已停止；保留本地交付记录，允许核对费用": `Target stopped; keep local delivery record, allow reconciliation of charges`,
    "目标已就绪；保留本地交付记录": `Target is ready; keep local delivery record`,
    "目标已移除；自动同步停止，历史金额可手动核查": `target has been removed; automatic synchronization stopped, historical amounts can be manually verified`,
    "目标拒绝此密钥（HTTP 401）": `The target rejected this key (HTTP 401)`,
    "目标拒绝读取资源（HTTP 403），请检查密钥权限": `The target refuses to read the resource (HTTP 403), please check the key permissions`,
    "目标授权失败，请核对配置与代理池": `Target authorization failed, please check the configuration and proxy pool`,
    "目标接口返回 HTTP ": `The target interface returns HTTP `,
    目标明确拒绝创建: `The target explicitly refuses to create`,
    目标服务: `target service`,
    目标服务未能生成OAuth授权链接: `The target service failed to generate the OAuth authorization link`,
    "目标服务未能生成OAuth授权链接，请核对所选代理后重试。": `The target service failed to generate an OAuth authorization link. Please check the selected proxy and try again.`,
    目标未确认代理绑定: `The target does not confirm the proxy binding.`,
    目标未绑定本次注册的代理: `The target is not bound to the proxy registered this time.`,
    "目标查询范围已覆盖，已结束日期自动计价入账": `The target query range has been covered, and the end date is automatically calculated and recorded.`,
    目标结果待人工核对: `target result awaits manual verification`,
    目标编号或操作代码: `target number or operation code`,
    目标设置版本不正确: `The target setting version is incorrect`,
    "目标账号存在关联冲突，请平台核对": `The target account has an association conflict, please check with the platform.`,
    "目标账户 ID（x-login-as，可选）": `Target account ID (x-login-as, optional)`,
    "目标退出中；保留本地交付记录": `The target is exiting; keep local delivery records`,
    目标配置已保存: `Target configuration has been saved`,
    "目标配置已变化，请重新授权": `The target configuration has changed, please re-authorize`,
    码值: `code value`,
    "码值 {0} · 已关联 {1} 个项目": `code value {0} · {1} items associated`,
    "码值创建后固定；停用不改变已有项目。": `Code value is fixed after creation; deactivation does not change existing projects.`,
    "确定删除“": `Confirm to delete"`,
    确认: `Confirm`,
    "确认 / 提出结算异议": `Confirm/raise settlement objection`,
    "确认 {0} 出款": `Confirm {0} withdrawal`,
    确认代理换绑: `Confirm the proxy binding change`,
    确认停用: `Confirm deactivation`,
    确认分配: `Confirm assignment`,
    确认切换: `Confirm switching`,
    确认删除: `Confirm deletion`,
    确认到账: `confirmed arrival`,
    确认刷新授权: `Confirm refresh authorization`,
    确认发布: `confirmed release`,
    "确认后将发起真实 ": `is confirmed, the real `,
    确认启用: `Confirm activation`,
    确认密码: `Confirm password`,
    确认并保存并发: `Confirm and save concurrency`,
    确认并删除: `Confirm and delete`,
    确认并编辑: `Confirm and edit`,
    确认截止时间: `Confirmation deadline`,
    "确认截止时间已过，请刷新结算单状态": `The confirmation deadline has passed, please refresh the settlement document status.`,
    确认截止时间必须晚于当前时间: `The confirmation deadline must be later than the current time`,
    确认截止时间须晚于当前且不超过180天: `The confirmation deadline must be later than the current time and no more than 180 days`,
    确认执行本笔付款: `Confirm execution of this payment`,
    确认拒绝: `Confirm rejection`,
    确认指定: `Confirm designation`,
    "确认授权码无效，恢复草稿以便重新授权": `Confirm that the authorization code is invalid, restore the draft for re-authorization`,
    确认撤回: `Confirm withdrawal`,
    确认撤销: `Confirm cancellation`,
    确认收款: `Confirm payment`,
    确认改挂: `Confirm the change`,
    确认新密码: `Confirm new password`,
    确认时间: `Confirmation time`,
    确认更换: `Confirm replacement`,
    确认期限不能超过180天: `The confirmation period cannot exceed 180 days`,
    "确认期限已过，请重新预览": `The confirmation period has expired, please preview again`,
    确认本期应付: `confirms payable in this period`,
    确认本期应收: `Confirm receivables in this period`,
    确认生成: `Confirm generation`,
    确认登记: `Confirm registration`,
    "确认目标拒绝创建，恢复草稿以便重新授权": `Confirm target rejects creation, restore draft for re-authorization`,
    "确认筛选范围与文件格式，提交后将在后台生成": `Confirm the screening scope and file format, which will be generated in the background after submission.`,
    确认线下付款并通知供应商: `Confirm offline payment and notify supplier`,
    确认结算: `Confirm settlement`,
    确认重置: `Confirm reset`,
    离线: `offline`,
    私人钱包: `private wallet`,
    "移除 ": `Remove `,
    税含: `Tax included`,
    空中云汇: `Sky Cloud Collection`,
    "空中云汇收款账户需使用已保存的 beneficiary ID": `The cloud remittance payment account in the sky must use the saved beneficiary ID`,
    "空闲有效期（分钟）": `Idle validity period (minutes)`,
    "空闲期控制无操作退出，绝对有效期限制单次登录总时长。保存后按新策略校验已有会话。": `The idle timeout signs users out after inactivity. The absolute lifetime limits the total session duration. Saved settings also apply to existing sessions.`,
    窗口秒数字段路径: `Window seconds field path`,
    立即发布: `Publish now`,
    立即采集: `Collect immediately`,
    站点: `site`,
    "站点 / 分组": `site/group`,
    "站点 RPM / TPM": `Site RPM/TPM`,
    站点名称: `site name`,
    站点展示名称: `site display name`,
    "站点监控配置独立于 CCMAX 交付目标。接口应返回 JSON，字段路径使用点号分隔。": `site monitoring configuration is independent of CCMAX delivery targets. The interface should return JSON with field paths separated by dots.`,
    站点运行情况: `site operation status`,
    "笔日账待处理：请检查报价、归属、项目启用状态或来源修订；本张单暂不生成": `Daily account pending: Please check the quote, attribution, project activation status or source revision; this sheet will not be generated yet`,
    "笔来源。按各笔日账的冻结报价计价，正式生成前再次核对金额。 ": `source entries. Prices use the quote frozen for each daily bill. Verify the amounts again before generating settlements. `,
    "笔跨天金额未计入日账。未结算记录需按真实每日金额重新录入；已结算记录需人工核对。": `The amount that spans multiple days is not included in the daily account. Unsettled records need to be re-entered according to the true daily amount; settled records need to be manually checked.`,
    符号: `symbol`,
    "第 ": `No. `,
    "第 {0} / 共 {1} 页": `Page {0} of {1}`,
    "第 {0} 条 expiresAt 须为正整数毫秒时间戳。": `Article {0} expiresAt must be a positive integer millisecond timestamp.`,
    "第 {0} 条 {1} 须为文本。": `Article {0} {1} must be text.`,
    "第 {0} 条资料须为对象。": `The information in item {0} must be the object.`,
    "第 {0} 行{1}": `Line {0}{1}`,
    "第 {0} 页": `page {0}`,
    "第{0}条代理": `Article {0} Proxy`,
    "第{0}条凭据方式": `Credential method {0}`,
    "第{0}条项目": `Item {0}`,
    第一版仅支持与供应商主体同名的收款账户: `only supports the payment account with the same name as the supplier entity.`,
    "等待 CCMAX 多 lane 批量查询接口确认与联调": `Awaiting confirmation and integration testing of the CCMAX multi-lane batch query API.`,
    等待处理: `waiting to be processed`,
    等待提交新凭据: `Waiting to submit new credentials`,
    "等待目标就绪；保留本地交付记录": `Wait for target to be ready; keep local delivery record`,
    等待采集: `waiting for collection`,
    等待重置更新: `Waiting for reset update`,
    筛选代理: `screening proxy`,
    筛选执行记录: `Filter execution records`,
    筛选是否在线: `Filter by online status`,
    筛选条件: `Filter conditions`,
    筛选账号状态: `Filter account status`,
    筛选账号角色: `Filter account roles`,
    "筛选选项加载失败：": `Filter option loading failed:`,
    筛选通知状态: `Screening notification status`,
    "简写仅支持 host:port 或 host:port:username:password": `Use host:port or host:port:username:password for abbreviated proxy URLs.`,
    简写默认协议: `Default protocol for abbreviated URLs`,
    "管理 NewAPI 待分配资源": `Manage NewAPI resources to be allocated`,
    "管理公告 ": `Management Announcement `,
    管理团队成员: `Manage team members`,
    管理密钥: `Admin key`,
    "管理数据采集与工作台提醒任务。": `Manage data collection and workbench reminder tasks.`,
    管理登录账号: `Manage login account`,
    类型: `type`,
    "类型 {0}": `type {0}`,
    "粘贴 API Key；批量交付时每行一个": `Paste API Key; one per line for batch delivery`,
    粘贴交付资料: `Paste delivery information`,
    "粘贴企业微信群机器人的 Webhook 地址": `Paste the WeCom group bot webhook URL.`,
    "粘贴完整回调 URL 或 code#state": `Paste the full callback URL or code#state`,
    系统: `system`,
    系统任务: `system tasks`,
    系统参数: `System settings`,
    系统参数已保存: `System parameters have been saved`,
    系统管理: `Administration`,
    系统管理子菜单: `System management submenu`,
    "约 ¥": `about ¥`,
    纯授权码: `pure authorization code`,
    线上付款: `Online payment`,
    "线上付款 · 审核后通道执行": `Online payment · Channel execution after review`,
    "线上付款提交后先审核，审核通过后再通过支付通道执行。金额、账户及汇率版本会冻结。 ": `Online payment will be reviewed after submission. After passing the review, it will be executed through the payment channel. Amounts, accounts and exchange rate versions will be frozen. `,
    线上付款申请已提交审核: `Online payment application has been submitted for review`,
    线上付款请选择已审核的收款账户: `Please select an approved payment account for online payment`,
    线下付款: `Offline payment`,
    "线下付款 / 上传凭证": `Offline payment/upload voucher`,
    "线下付款 / 上传凭证 ": `Offline payment/upload voucher `,
    "线下付款 · 上传付款凭证": `Offline payment · Upload payment voucher`,
    "线下付款 · 凭证登记": `Offline payment · Evidence recorded`,
    "线下转账完成后上传真实付款凭证。提交即登记平台已付款，无需再付款审核，并通知供应商确认到账。 ": `Upload the real payment voucher after completing the offline transfer. Submission registers that the platform has paid, no further payment review is required, and the supplier is notified to confirm the payment. `,
    终态结果缺少支付机构流水: `The final result lacks the payment institution statement.`,
    经营概览: `Business Overview`,
    绑定完成: `binding completed`,
    "绑定完成 ": `binding completed `,
    "绑定完成表示已核对代理绑定，服务可用性尚未验证。待核对项不会自动重复提交。 ": `Binding completed means that the proxy binding has been verified, but the service availability has not yet been verified. Items to be checked will not be automatically resubmitted. `,
    "绑定资源 ": `Binding resources `,
    结束日期: `End date`,
    结束日期不能早于开始日期: `The end date cannot be earlier than the start date`,
    结束时间: `end time`,
    结束月份: `end month`,
    结果: `results`,
    结果回传: `result return`,
    "结果尚未核实，应付金额继续占用。请先查询，不要另建付款重复出款。 ": `result has not yet been verified, and the amount payable continues to be occupied. Please check first and do not create another payment and make repeated withdrawals. `,
    结果待查询: `results to be queried`,
    结果待核对: `Result unconfirmed`,
    "结果未确认，请到目标侧核对资源，勿重复回填。": `The result is not confirmed. Please go to the target side to check the resources and do not backfill repeatedly.`,
    结果核对中: `results are being verified`,
    结算中: `is settling`,
    结算人工调整记录: `Settlement Manual Adjustment Record`,
    "结算倍率 / 单价": `settlement ratio / unit price`,
    结算单: `Settlement`,
    "结算单 ": `Settlement `,
    "结算单 {0} 已因超过确认截止时间且未收到异议而自动确认。": `Settlement {0} was confirmed automatically because the deadline passed without a dispute.`,
    "结算单 {0} 的最新应收金额为 {1}，请核对最新版本。": `The updated receivable amount for settlement {0} is {1}. Please review the latest version.`,
    "结算单 {0}。请于 {1} 前确认；逾期未提出异议将自动确认。": `Settlement {0}. Confirm by {1}; it will be confirmed automatically if no dispute is received by the deadline.`,
    "结算单已确认、已到期或版本变化，请刷新后重试": `The settlement document has been confirmed, expired or the version has changed. Please refresh and try again.`,
    "结算单版本已变化，请刷新核对最新金额": `The version of the settlement statement has changed, please refresh and check the latest amount.`,
    "结算单状态或版本已变化，请重新核对金额": `The status or version of the settlement document has changed, please recheck the amount.`,
    结算单的实际起止日期仍在创建时确认: `The actual start and end dates of the settlement document are still confirmed when creating`,
    结算单详情: `Settlement details`,
    结算单预览: `Settlement Statement Preview`,
    结算单预览内容: `Settlement Statement Preview Content`,
    结算单预览明细: `Settlement document preview details`,
    结算周期: `Settlement period`,
    结算币种筛选: `Settlement currency screening`,
    结算开始日期: `Settlement start date`,
    "结算开始日期 ": `Settlement start date `,
    "结算折扣 / 单价": `Settlement discount / unit price`,
    结算方式: `Settlement method`,
    结算方式筛选: `Settlement method screening`,
    结算日期: `settlement date`,
    结算日期必须在本单结算期间内: `The settlement date must be within the settlement period of this order`,
    结算期间: `settlement period`,
    "结算比例应在 0% 到 100% 之间": `Settlement ratio should be between 0% and 100%`,
    结算版本已变化: `settlement version has changed`,
    结算状态: `settlement status`,
    结算笔数: `Number of settlement transactions`,
    结算结束日期: `Settlement end date`,
    "结算结束日期 ": `Settlement end date `,
    结算编号: `settlement number`,
    "结算调整基数已变化，请刷新后重试": `The settlement adjustment base has changed, please refresh and try again.`,
    "绝对有效期（分钟）": `Absolute validity period (minutes)`,
    统一社会信用代码或注册编号: `Unified social credit code or registration number`,
    统计币种: `statistical currency`,
    "统计时间：": `statistical time:`,
    统计月份: `Statistical month`,
    统计期间: `statistical period`,
    继续使用原账号密码: `Keep the existing account password`,
    继续同步: `Continue synchronization`,
    继续填写: `Continue to fill in`,
    绩效负责人: `Performance Manager`,
    维护代理配置: `Maintain proxy configuration`,
    维护大类码值: `Manage project categories`,
    维护资料: `Manage profile`,
    "维护资料 ": `Manage profile `,
    维护资源接口配置: `Maintain resource interface configuration`,
    维护通道配置: `Maintenance channel configuration`,
    维护项目: `Manage projects`,
    编辑: `Edit`,
    "编辑 ": `Edit `,
    "编辑 CCMAX 目标": `Edit CCMAX target`,
    编辑企微提醒: `Editor's WeChat reminder`,
    "编辑周期 ": `Edit schedule `,
    编辑定时任务: `Edit scheduled task`,
    编辑工作台展示配置: `Edit workbench display configuration`,
    "编辑此行 ": `Edit this line `,
    编辑草稿: `Edit Draft`,
    编辑角色: `Edit role`,
    "编辑账号 · {0}": `Edit account · {0}`,
    编辑运行周期: `Edit run cycle`,
    编辑通知草稿: `Editorial Notice Draft`,
    编辑项目: `Edit project`,
    编辑项目大类: `Editing project categories`,
    缺少本次操作标识: `The operation identifier is missing`,
    "缺少线下付款登记/附件上传权限，或线上付款申请/账户读取权限，请联系管理员。 ": `Lack of offline payment registration/attachment upload permission, or online payment application/account reading permission, please contact the administrator. `,
    网络: `Network`,
    "网络异常，发送结果未确认": `Network abnormality, sending result not confirmed`,
    网络手续费: `Network handling fee`,
    网络未填写: `Network is not filled in`,
    网页: `web page`,
    "美国 / 澳大利亚": `United States / Australia`,
    联系与结算: `Contact and Settlement`,
    联系人: `Contact person`,
    联系电话: `Contact number`,
    "联系电话（选填）": `Contact number (optional)`,
    能力口径: `Capacity definition`,
    能力口径待配置: `Capacity configuration required`,
    能力类型: `Capacity type`,
    能力补充说明: `Capacity notes`,
    能力补充说明最多500字: `Supplementary description of ability can be up to 500 words`,
    "能力补充说明（选填）": `Supplementary description of ability (optional)`,
    能力说明: `Capability Description`,
    自动: `automatic`,
    "自动入账 CCMAX 日账": `Automatically enter CCMAX daily account`,
    "自动更新 CCMAX 日账": `Automatically update CCMAX daily account`,
    自动查单: `Automatic order checking`,
    "自动查单未取得可核验结果，等待下次查询": `The automatic check did not obtain verifiable results, waiting for the next query`,
    "自动查单间隔（秒）": `Automatic order checking interval (seconds)`,
    自动续期: `Automatic renewal`,
    自动识别: `automatic identification`,
    "自动转为大写标识，空格和符号转为下划线": `Converted to uppercase; spaces and symbols become underscores.`,
    自动通过供应商注册: `automatically passes supplier registration`,
    自定义: `customized`,
    自定义期间: `Customized period`,
    "自定义结算周期须填写 1-365 天": `Custom settlement cycle must be filled in 1-365 days`,
    "自定义角色 · 可多选": `Custom role · Multiple selections possible`,
    "自定义角色已创建，可勾选分配": `Custom role has been created and can be assigned`,
    至: `To`,
    "至 ": `To `,
    至少配置一种指标路径: `Configure at least one indicator path`,
    草稿: `Draft`,
    "草稿保存后不会发送给任何账号。": `The draft will not be sent to any account after being saved.`,
    草稿已保存: `draft saved`,
    营业额: `Turnover`,
    "营业额已保存，请刷新后查看": `Sales volume has been saved, please refresh to view.`,
    "行 ": `OK `,
    "补交 CCMAX 目标": `Submit CCMAX target`,
    "补交未完成：{0}": `Submission not completed: {0}`,
    补交目标: `resubmission target`,
    补全批次须为1至200条: `The completion batch must be from 1 to 200 items`,
    补查失败: `Supplementary check failed`,
    补查整目标: `Supplementary check and adjustment target`,
    "补查部分完成，请在 CCMAX 核对中查看运行记录": `supplementary check is partially completed, please check the running record in CCMAX check`,
    "要求符号时，初始密码格式也必须支持符号": `When symbols are required, the initial password format must also support symbols`,
    "观测 ID 不正确": `Observation ID is incorrect`,
    角色: `role`,
    角色与权限: `Roles & permissions`,
    "角色加载失败：": `Could not load roles: `,
    角色名称: `Role name`,
    角色已保存: `Role saved`,
    "角色已被修改，请刷新重试": `The role has been modified, please refresh and try again.`,
    角色标识: `Role identification`,
    角色标识不正确: `The role identification is incorrect`,
    "解析为独立条目 ": `resolves to independent entry `,
    触发方式: `Trigger mode`,
    触发方式不正确: `The triggering method is incorrect`,
    计价依据: `pricing basis`,
    计价口径: `Pricing basis`,
    计价币种: `Pricing currency`,
    计价数量: `pricing quantity`,
    "计价数量 ": `pricing quantity `,
    计价方式: `pricing method`,
    计价明细: `Pricing details`,
    计算依据: `calculation basis`,
    计算方式: `calculation method`,
    计算结果超出允许范围: `The calculation result exceeds the allowable range`,
    "计费明细：": `billing details:`,
    计费类型: `Billing type`,
    订阅创建时间: `Subscription creation time`,
    订阅类型: `Subscription Type`,
    认证凭据格式不正确: `Authentication credentials format is incorrect`,
    认证方式: `certification method`,
    "认证被拒绝(具体原因未确认)": `Certification rejected (specific reason not confirmed)`,
    认证请求头名称: `Authentication request header name`,
    "记一笔 ": `Make a note `,
    记录不存在或不可访问: `record does not exist or is inaccessible`,
    记录付款通道失败结果: `Record payment channel failure result`,
    记录付款通道成功结果: `records the successful result of the payment channel`,
    "记录关键操作及接口调用。已发起、已提交和本地已交付均不代表目标分发成功，最终状态请查看资源详情。": `records key operations and interface calls. Initiated, submitted and locally delivered do not mean that the target distribution is successful. Please check the resource details for the final status.`,
    "记录号 ": `record number `,
    记录时间: `recording time`,
    记录明细: `Record details`,
    "记录状态已变化，请刷新后查看": `The record status has changed, please refresh and check again.`,
    记录资源分发结果: `Record resource distribution results`,
    设置新密码: `Set new password`,
    识别资料: `identification information`,
    试算: `trial calculation`,
    "试试其他名称、供应商、状态或协议，或清除当前筛选条件。": `Try a different name, supplier, status, or agreement, or clear the current filter.`,
    "该 API 尚未对令牌开放或当前账号无权调用": `This API is not yet open to tokens or the current account does not have the right to call it`,
    "该 Binance USDT 网络当前暂停提币": `The Binance USDT network is currently suspending withdrawals`,
    "该 Lane 已有历史资源关联，需平台核对，未覆盖历史账单。": `This Lane is already associated with historical resources and needs to be verified by the platform, and historical bills are not covered.`,
    "该 USDT 网络当前暂停提币": `The USDT network is currently suspending withdrawals`,
    "该 lane 在所选日期未返回模型费用记录。": `This lane did not return model expense records on the selected date.`,
    该付款当前状态不可登记线下付款: `The current status of this payment cannot be registered for offline payment.`,
    "该付款申请为线下付款，请上传凭证登记，不可通过支付通道执行": `This payment application is an offline payment. Please upload the voucher for registration. It cannot be executed through the payment channel.`,
    "该付款申请选择了支付通道，请按原通道处理，不可改为线下登记": `This payment application has selected a payment channel. Please process it through the original channel. It cannot be changed to offline registration.`,
    "该代理已停用，请先在代理池启用或更换代理": `The proxy has been disabled. Please enable or replace the proxy in the proxy pool first.`,
    "该代理已停用，请启用后重试或录入其他代理": `The proxy has been disabled. Please enable it and try again or enter other proxies.`,
    "该代理已存在，但认证信息不同，请先在代理池更新后使用": `The proxy already exists, but the authentication information is different. Please use it after updating the proxy pool first.`,
    "该代理的可用名额已满，请录入其他代理": `The available quota for this proxy is full. Please enter other proxies.`,
    该凭据方式不需要OAuth授权: `This credential method does not require OAuth authorization`,
    "该历史币种仅供查看；新付款申请只支持 USD、CNY 和 USDT。": `This historical currency is for viewing only; new payment applications only support USD, CNY and USDT.`,
    "该大类已有工作台监控或展示参数关联，不能删除；可以停用此大类": `This category has been associated with workbench monitoring or display parameters and cannot be deleted; this category can be deactivated`,
    "该大类已有项目关联，不能删除": `This category already has associated items and cannot be deleted.`,
    "该大类已有项目关联，不能删除；可以停用此大类": `This category has project associations and cannot be deleted; this category can be deactivated`,
    "该币种对暂无当前生效汇率。": `There is no current effective exchange rate for this currency pair.`,
    "该币种对的版本号已被占用，请刷新后重试": `The version number of this currency pair has been occupied, please refresh and try again.`,
    "该异常项已由其他重试完成，请查看原批次结果": `This exception item has been completed by other retries, please check the original batch results.`,
    "该张单暂不可生成，请先处理异常": `This order cannot be generated temporarily, please handle the exception first`,
    "该张单超过20000笔来源，请缩小结算期间": `This order has more than 20,000 sources, please reduce the settlement period.`,
    "该批次已发起，请查看正式结算单": `This batch has been initiated, please check the official settlement form`,
    该报价已有待审核的调整申请: `This quote has an adjustment application pending review`,
    "该报价目前不满足交付条件，请核对有效期和币种": `This quote currently does not meet the delivery conditions, please check the validity period and currency`,
    "该授权操作已结束，不能继续提交": `The authorization operation has ended and submission cannot be continued.`,
    该排序字段不适用于当前项目能力类型: `This sorting field is not applicable to the current project capability type`,
    该接收范围不能指定账号: `The receiving range cannot specify an account.`,
    该支付通道尚未配置或未启用: `The payment channel has not been configured or enabled`,
    "该日期没有唯一已通过的 USD 报价，不能计算应付": `There is no unique passed USD quote on this date, and the payable cannot be calculated.`,
    该服务全部已启用目标: `All enabled targets for this service`,
    该服务类型已有日账任务: `This service type already has daily accounting tasks`,
    "该期间有 ": `This period has `,
    该生效日期的报价价格没有变化: `There is no change in the quoted price on this effective date`,
    "该监控正在刷新，请稍后重试": `The monitoring is being refreshed, please try again later.`,
    该目标实际并发上限: `The actual concurrency upper limit of this target`,
    该目标已有同类定时任务: `This target already has a scheduled task of the same type`,
    该目标并发批次: `The target concurrent batch`,
    "该目标并发批次需为 1–32 的整数": `The target concurrent batch needs to be an integer from 1–32`,
    "该网络必须填写 Memo/Tag，当前收款账户模型尚不支持": `This network must fill in Memo/Tag, and the current payment account model is not supported yet.`,
    该能力类型不接受额度周期或面值币种: `This capability type does not accept quota period or face value currency`,
    该能力类型只支持项目合计口径: `This capacity type supports project totals only.`,
    "该范围已没有可结算来源，请核对是否已在其他结算单中": `There is no billable source in this range. Please check whether it is included in other settlement documents.`,
    "该范围没有可结算的单日金额来源。": `There is no single-day amount source that can be settled in this range.`,
    该行报价已保存: `Quote saved.`,
    该行报价已提交审核: `Quote submitted for review.`,
    "该记录尚不能确认目标已拒绝创建，请人工核对后处理": `This record cannot confirm that the target has refused to be created. Please manually check and process.`,
    "该账号已有授权操作，请先完成原操作": `This account has been authorized to operate, please complete the original operation first`,
    "该账号已有授权操作，请先查询原操作": `This account has been authorized to operate, please check the original operation first`,
    "该账号已有授权操作，请先查询并完成原操作": `This account has been authorized to operate. Please check and complete the original operation first.`,
    "该账号已由本供应商供应，原资源已更新。": `This account has been provided by this supplier, and the original resources have been updated.`,
    "该资源已由其他供应商供应过，不能重复供应。": `This resource has been supplied by another supplier and cannot be supplied repeatedly.`,
    "该资源已经被分配，请刷新": `The resource has been allocated, please refresh`,
    该通知已撤回: `This notice has been withdrawn`,
    该通道不支持所选账户地区: `This channel does not support the selected account region`,
    该通道不支持能力查询: `This channel does not support capability query`,
    "该项目今日存在多条有效报价，请先核对报价": `There are multiple valid quotes for this project today, please check the quotes first`,
    "该项目今日没有唯一有效的已通过报价，暂不可交付": `This project does not have the only valid approved quote today and cannot be delivered yet.`,
    "该项目今日没有已通过且有效的报价，暂不可交付": `There is no approved and valid quote for this project today, and it cannot be delivered yet.`,
    该项目只接受正数账号额度: `This project only accepts positive account quotas`,
    该项目只接受正整数账号数量: `This project requires a positive integer for the number of accounts.`,
    "该项目存在不同币种的报价，请先核对报价": `This project has quotations in different currencies, please check the quote first`,
    该项目尚未配置能力口径: `This project has no capacity definition configured.`,
    "该项目暂未配置交付方式，目前只开放 CCMAX 项目交付。": `This project has not yet configured a delivery method, and currently only CCMAX project delivery is available.`,
    详情: `Details`,
    "详情 ": `Details `,
    "详情加载失败：": `Details loading failed:`,
    说明: `Description`,
    说明本次指定或改挂的原因: `Explain the reason for this designation or change.`,
    "请上传 200 KB 以内的 TXT 或 JSON 文件。": `Please upload a TXT or JSON file within 200 KB.`,
    请上传付款凭证: `Please upload payment voucher`,
    请上传该供应商的付款凭证: `Please upload the supplier’s payment voucher`,
    请为每条资源选择代理: `Please select an proxy for each resource`,
    "请为每条选择供应商、项目、账号标识和代理。": `Please select the supplier, project, account ID and proxy for each item.`,
    "请于 ": `Please confirm or raise a dispute by `,
    请从代理配置中选择代理: `Please select a proxy from the proxy configuration`,
    "请使用 Key----Endpoint，或将地址和 Key 分行填写": `Please use Key----Endpoint, or fill in the address and Key separately.`,
    "请使用不含凭据的公开 HTTPS 地址": `Please use a public HTTPS address without credentials`,
    "请使用原 Claude 账号授权。原资源、历史账单、供应商归属和代理配置保留。 ": `Authorize using the original Claude account. Existing resources, historical bills, supplier ownership and proxy settings are retained. `,
    请使用接口接入密钥: `Please use the interface access key`,
    请先保存OAuth交付草稿: `Please save the OAuth delivery draft first`,
    请先在项目大类码值中维护并选择大类: `Please first maintain and select the major category in the project category code value`,
    请先在项目管理配置能力口径: `Configure the capacity definition in Projects first.`,
    请先填写个人和企业资料: `Complete your personal and supplier information first.`,
    请先完成目标授权: `Please complete the target authorization first`,
    "请先查询原操作。交换结果不明时，请重新生成 OAuth 链接登录原账号，勿重复使用一次性授权码或 RT。 ": `Please check the original operation first. When the exchange result is unclear, please regenerate the OAuth link to log in to the original account. Do not reuse the one-time authorization code or RT. `,
    "请先核实CCMAX未创建成功，再确认处理": `Please verify that CCMAX has not been created successfully before confirming the processing.`,
    请先核实CCMAX账号名称再分发: `Please verify the CCMAX account name before distribution`,
    请先生成授权链接并回填授权码: `Please generate an authorization link and fill in the authorization code first.`,
    请先登录: `Please sign in.`,
    请先粘贴交付资料: `Please paste the delivery information first`,
    请先维护该项目的结算方式与交付方式: `Please maintain the settlement method and delivery method of this project first`,
    "请先维护该项目的结算方式与交付方式；历史项目不会被自动归类": `Please maintain the settlement method and delivery method of this project first; historical projects will not be automatically classified`,
    "请先识别交付资料。": `Please identify the delivery information first.`,
    "请先识别资料，再核对并提交。": `Please identify the information first, then check and submit.`,
    "请先选择交付供应商。": `Please select the delivery supplier first.`,
    "请先配置至少一个已启用的 CCMAX 目标": `Configure at least one enabled CCMAX target first.`,
    请先配置项目能力口径: `Configure the project capacity definition first.`,
    "请先配置项目能力口径，再提交或审核报价": `Configure the project capacity definition before submitting or reviewing a quote.`,
    请勾选至少一笔单日金额来源: `Please check at least one daily amount source`,
    请同时填写正整数RPM和TPM: `Please fill in both RPM and TPM as positive integers`,
    请回填完整的授权码或回调地址: `Please fill in the complete authorization code or callback address`,
    "请填写 80 字以内的站点名称": `Please fill in the site name within 80 words`,
    "请填写 USD、CNY 或 USDT 的有效金额": `Please fill in the valid amount in USD, CNY or USDT`,
    "请填写Access Token": `Please fill in Access Token`,
    请填写CCMAX账号名称: `Please fill in the CCMAX account name`,
    "请填写Refresh Token": `Please fill in Refresh Token`,
    "请填写Session Key": `Please fill in Session Key`,
    "请填写不小于 0 的倍率": `Please fill in the multiplier ratio not less than 0`,
    "请填写不小于 0 的单位价格": `Please fill in the unit price not less than 0`,
    "请填写不小于 0 的折扣": `Enter a discount of 0 or greater`,
    请填写不超过500字的备注: `Please fill in the remarks no more than 500 words`,
    请填写个人姓名: `Please fill in your personal name`,
    "请填写交付凭据。": `Please fill in the delivery certificate.`,
    请填写代理: `Please fill in the proxy`,
    请填写代理名称: `Please fill in the proxy name`,
    请填写代理名称和有效的绑定上限: `Please fill in the proxy name and effective binding limit`,
    请填写代理地址: `Please fill in the proxy address`,
    请填写企业名称和统一社会信用代码或注册编号: `Please fill in the company name and unified social credit code or registration number`,
    "请填写作废原因，最多1000字": `Please fill in the reason for cancellation, up to 1000 words`,
    请填写取消或失败原因: `Please fill in the reason for cancellation or failure`,
    请填写变更原因: `Please fill in the reason for the change`,
    请填写国家或地区: `Please fill in the country or region`,
    请填写大于0的账号额度: `Please fill in the account limit greater than 0`,
    请填写安全的认证请求头名称: `Please fill in the secure authentication request header name`,
    请填写完整的生效日期: `Please fill in the complete effective date`,
    "请填写密钥名称和 1—365 天有效期": `Please fill in the key name and validity period of 1-365 days`,
    请填写所选方式的凭据: `Please fill in the credentials for the selected method`,
    请填写报价倍率: `Please fill in the quote multiple`,
    请填写报价折扣: `Please fill in the quote discount`,
    请填写拒绝原因: `Please fill in the reason for rejection`,
    请填写授权会话和授权码: `Please fill in the authorization session and authorization code`,
    "请填写授权码或 Refresh Token": `Please fill in the authorization code or Refresh Token`,
    "请填写有效 Refresh Token；有效期必须是未来的毫秒时间戳": `Please fill in a valid Refresh Token; the validity period must be a timestamp in milliseconds in the future`,
    请填写有效登录账号和显示名称: `Please fill in the valid login account and display name`,
    "请填写有效的代理 URL": `Please fill in a valid proxy URL`,
    请填写有效的账号和显示名称: `Enter a valid username and display name.`,
    请填写未到账或金额差异说明: `Please fill in the explanation of non-receipt or amount difference`,
    请填写本次指定或改挂的原因: `Please fill in the reason for this designation or change.`,
    请填写查询并发设置: `Please fill in the query concurrency settings`,
    请填写正整数账号数量: `Please fill in the number of positive integer accounts`,
    "请填写此字段。": `Please complete this field.`,
    请填写监控令牌: `Please fill in the monitoring token`,
    请填写监控显示名称: `Please fill in the monitoring display name`,
    请填写目标名称和服务地址: `Please fill in the target name and service address`,
    请填写管理密钥: `Enter the admin key`,
    请填写营业额: `Please fill in the turnover`,
    请填写认证凭据: `Please fill in the certification credentials`,
    请填写调整说明: `Please fill in the adjustment instructions`,
    请填写转账流水号: `Please fill in the transfer serial number`,
    请填写退回原因: `Please fill in the reason for return`,
    请填写金额异议说明: `Please fill in the amount objection statement`,
    "请完整配置 API Key 和 Secret Key": `Please completely configure API Key and Secret Key`,
    "请完整配置 API Key、Secret Key 和 Passphrase": `Please completely configure API Key, Secret Key and Passphrase`,
    "请完整配置 Airwallex Client ID 和 API Key": `Please completely configure Airwallex Client ID and API Key`,
    请录入代理地址或从代理池选择代理: `Please enter the proxy address or select a proxy from the proxy pool`,
    "请提供 NewAPI 请求对象或 Vertex 服务账号资料": `Please provide NewAPI request object or Vertex service account information`,
    请提供交付资料: `Please provide delivery information`,
    请明确选择至少一笔单日金额来源: `Please clearly select at least one daily amount source`,
    请核对到账: `Please confirm receipt`,
    "请检查日账任务迁移是否已应用。": `Please check whether the daily accounting task migration has been applied.`,
    "请检查此字段的输入值。": `Please check the value in this field.`,
    请求: `request`,
    "请求中…": `Requesting…`,
    "请求体必须是 JSON 对象": `The request body must be a JSON object`,
    "请求体超过 2 MiB 限制": `Request body exceeds 2 MiB limit`,
    请求参数不正确: `Invalid request parameters`,
    请求失败: `Request failed`,
    "请求已受理，请查看实际通道状态": `request has been accepted, please check the actual channel status`,
    "请求未收到目标响应，结果待核对": `The request did not receive the target response, and the result needs to be verified.`,
    请求标识不正确: `The request identifier is incorrect`,
    请求标识对应的结算条件不同: `The settlement conditions corresponding to the request identifier are different.`,
    请求标识已用于其他分发: `The request ID has been used for other distributions`,
    请求标识已用于其他导出条件: `The request ID has been used in other export conditions`,
    请求结果未知: `request result unknown`,
    请求被禁止: `Request is prohibited`,
    "请求超时（毫秒）": `Request timeout (milliseconds)`,
    "请求追踪 ID": `request tracking ID`,
    "请求键对应的调整内容不同，请核对后重新操作": `The adjustment content corresponding to the request key is different, please check and operate again.`,
    请确认应收金额: `Please confirm the amount receivable`,
    "请确认资源类型后重试。": `Please confirm the resource type and try again.`,
    "请稍候…": `Please wait…`,
    请等待本批处理完成后再处理异常项: `Please wait until this batch is completed before processing the exception item`,
    "请粘贴包含 mode 和 channel 的 NewAPI 资料对象。": `Please paste the NewAPI data object containing mode and channel.`,
    "请联系平台核对项目适用类型与有效报价。": `Please contact the platform to check the applicable project type and valid quote.`,
    请至少勾选一个要展示的项目: `Please check at least one item to be displayed`,
    "请至少设置 RPM 或 TPM 字段路径": `Please set at least the RPM or TPM field path`,
    请说明撤回原因: `Please explain the reason for withdrawal`,
    请调整日期: `Please adjust the date`,
    "请输入 1 至 100 条 JSON 数组。": `Please enter a JSON array of 1 to 100 items.`,
    请输入供应商名称: `Enter supplier name`,
    请输入整数加减金额: `Please enter the integer plus or minus amount`,
    请输入有效: `Enter a valid `,
    "请输入有效的企业微信机器人 Webhook 地址": `Please enter a valid enterprise WeChat robot Webhook address`,
    请输入有效的工作台地址: `Please enter a valid workbench address`,
    "请输入有效的格式。": `Please enter a valid value.`,
    "请进入对应记录查看详情。": `Please enter the corresponding record to view details.`,
    请选择: `Please select`,
    "请选择 Google 服务账号 JSON（type 为 service_account）。": `Please select Google service account JSON (type is service_account).`,
    "请选择 OAuth 或 Refresh Token 重新授权": `Please choose OAuth or Refresh Token to re-authorize`,
    "请选择 USDT 转账方式": `Please select USDT transfer method`,
    请选择OAuth授权方式: `Please select the OAuth authorization method`,
    "请选择{0}": `Please select {0}`,
    请选择主体类型: `Please select the subject type`,
    请选择交付供应商: `Please select delivery supplier`,
    "请选择交付账号、交付密钥或中转站": `Select account delivery, key delivery or relay site.`,
    请选择代理: `Please select an proxy`,
    请选择价格适用时刻: `Please select the price applicable time`,
    请选择企业或个人供应商: `Please select a corporate or individual supplier`,
    请选择供应商: `Please select supplier`,
    "请选择供应商，单次最多5000家": `Please select a supplier, the maximum number is 5,000 at a time`,
    请选择创建新用户或关联已有用户: `Please choose to create a new user or associate an existing user`,
    请选择另一位平台运营: `Please choose another platform operator`,
    请选择可用代理: `Please select an available proxy`,
    请选择启用的已有目标凭据: `Please select an existing target credential that is enabled`,
    请选择启用的项目品类: `Please select the enabled project category`,
    请选择导出条件: `Please select export conditions`,
    请选择平台运营: `Please select platform operation`,
    请选择当前汇率: `Please select the current exchange rate`,
    请选择当前生效的汇率版本: `Please select the exchange rate version currently in effect`,
    "请选择截至昨天的结算期间（北京时间）": `Please select the settlement period as of yesterday (Beijing time)`,
    请选择报价项目: `Please select the quote item`,
    请选择排行日期: `Please select the ranking date`,
    请选择接收账号: `Please select the receiving account`,
    请选择收款钱包类型: `Please select the payment wallet type`,
    请选择日期: `Please select date`,
    请选择月份: `Please select the month`,
    "请选择有内容的文本文件。": `Please select a text file with content.`,
    "请选择有效日期范围，最长一年": `Please select a valid date range, up to one year`,
    请选择有效的今天或未来报价期间: `Please select a valid today or future quote period`,
    请选择有效的任务类型和状态: `Please select a valid task type and status`,
    "请选择有效的供应商、项目和日期范围": `Please select a valid supplier, project and date range`,
    请选择有效的报价起止日期: `Please select a valid quote start and end date`,
    "请选择有效的结算期间，结束日期最晚为昨天。": `Select a valid settlement period ending no later than yesterday.`,
    请选择有效的起止日期: `Please select a valid start and end date`,
    请选择有效的项目: `Please select a valid item`,
    请选择目标: `Please select target`,
    "请选择线下付款并上传凭证，或按原支付通道处理": `Please choose offline payment and upload the voucher, or process it through the original payment channel`,
    请选择线下付款或支付通道付款: `Please choose offline payment or payment channel payment`,
    请选择编辑或删除: `Please choose to edit or delete`,
    请选择账号状态: `Please select account status`,
    "请选择资料未变化、已交付的CCMAX资源": `Please select the CCMAX resource whose data has not changed and has been delivered.`,
    请选择项目: `Please select the item`,
    请选择项目和排行日期: `Please select the project and ranking date`,
    请选择项目能力类型: `Please select the project capability type`,
    请选择额度结算或账号买断: `Please choose quota settlement or account buyout`,
    请选择默认协议: `Please select the default protocol`,
    请重新打开机器人配置: `Please reopen the robot configuration`,
    "读取失败：": `Reading failed:`,
    "读取资料文件 ": `Read data file `,
    调价: `Adjust price`,
    "调价 ": `Adjust price `,
    调价已退回: `Price change rejected`,
    调价已通过: `Price change approved`,
    调价待审: `Price change pending review`,
    "调整{0}的采集周期": `Adjust the collection cycle of {0}`,
    调整前应付: `Payable before adjustment`,
    调整单位价格: `Adjust unit price`,
    调整后与其他报价时间重叠: `overlaps with other quote times after adjustment`,
    调整后有效期: `Validity period after adjustment`,
    调整后的最终应付不能小于零: `The adjusted final payable cannot be less than zero`,
    "调整后的有效期不能排除已审核的价格版本；请保留该版本对应日期": `The adjusted validity period cannot exclude the reviewed price version; please keep the corresponding date of this version`,
    调整周期: `adjustment cycle`,
    调整团队成员项目权限: `Adjust team member project permissions`,
    调整团队账号权限: `Adjust team account permissions`,
    调整报价: `Adjust quote`,
    "调整报价 ": `Adjust quote `,
    调整报价倍率: `Adjust quote multiple`,
    调整报价折扣: `Adjust discount`,
    调整日期必须在本结算单期间内: `The adjustment date must be within the period of this settlement statement`,
    "调整状态加载失败：": `Failed to load adjustment status:`,
    调整申请已处理: `Adjustment application has been processed`,
    调整申请已处理或报价状态已变化: `The adjustment application has been processed or the quote status has changed`,
    "调整申请已处理，请刷新后重试": `The adjustment application has been processed, please refresh and try again.`,
    调整说明: `Adjustment Instructions`,
    调整账号权限: `Adjust account permissions`,
    调整采集周期: `Adjust the collection cycle`,
    调整金额不能为零: `The adjustment amount cannot be zero`,
    "调用 CCMAX 接口": `calls CCMAX interface`,
    调用日志: `API calls`,
    调用时间: `calling time`,
    调用状态: `calling status`,
    调用状态不正确: `The calling status is incorrect`,
    调用示例: `calling example`,
    调用类型: `call type`,
    调用结果: `call result`,
    调用能力: `calling ability`,
    调用能力必须同时填写正整数RPM和TPM: `The calling capability must fill in both the positive integer RPM and TPM.`,
    "调用能力（RPM + TPM）": `calling ability (RPM + TPM)`,
    "调用记录未能可靠保存，请联系平台核对处理结果": `The call record cannot be saved reliably. Please contact the platform to check the processing results.`,
    负责人: `person in charge`,
    负责人没有变化: `There is no change in the person in charge`,
    负责运营: `Assigned operator`,
    负责运营已更新: `responsible for operation has been updated`,
    负责运营筛选: `Filter by assigned operator`,
    财务人员: `Finance`,
    账务: `Accounts`,
    账务日期: `Accounting date`,
    账务查询条件不正确: `Account query conditions are incorrect`,
    账务管理: `Accounting`,
    账务金额与计算依据: `Account amount and calculation basis`,
    账单创建账号: `bill creation account`,
    "账单已进入结算，保留原快照": `The bill has entered settlement and the original snapshot is retained.`,
    "账单查询条件不正确，日期跨度最长一年": `The bill query conditions are incorrect, and the date span is up to one year.`,
    账单资源类型: `Billing resource type`,
    账单项目: `bill item`,
    账号: `Username`,
    "账号 / Lane ID": `Account / Lane ID`,
    "账号不可用，暂不能生成密钥": `The account is unavailable and the key cannot be generated temporarily.`,
    账号买断: `Account buyout`,
    "账号买断不能按 Token 消费金额计价，须提供账号数量": `account buyout cannot be calculated based on the Token consumption amount, the number of accounts must be provided`,
    账号买断数量必须为正整数: `The account buyout quantity must be a positive integer`,
    账号买断须使用单个独立价格: `Account buyout must use a single independent price`,
    "账号仍处于暂停状态，刷新授权不会解除暂停。": `account is still suspended, and refreshing the authorization will not lift the suspension.`,
    账号信息: `account information`,
    账号健康状态: `Account health status`,
    "账号受限(account_on_hold)": `Account limit (account_on_hold)`,
    账号名称: `account name`,
    "账号名称须为1-128字": `Account name must be 1-128 characters`,
    账号失效: `account invalid`,
    账号失效原因: `Reason for account invalidation`,
    账号已停用: `account has been deactivated`,
    账号已创建: `account has been created`,
    "账号已发生变更，请刷新后重试": `The account has been changed, please refresh and try again.`,
    "账号已变化，请刷新重试": `The user account has changed. Refresh and try again.`,
    账号已变更: `account has been changed`,
    账号已启用: `account has been activated`,
    账号已存在: `account already exists`,
    "账号当前仍暂停；重新授权不会解除暂停、休眠或风控限制。": `account is currently suspended; reauthorization will not lift suspension, hibernation, or risk control restrictions.`,
    账号或密码错误: `Incorrect username or password`,
    "账号或密码错误，或账号已停用": `Incorrect username or password, or the account is disabled.`,
    账号数: `Number of accounts`,
    账号数量: `Number of accounts`,
    "账号数（个）": `Number of accounts (number)`,
    账号显示名称: `Account display name`,
    账号标识: `Account ID`,
    "账号状态已变化，请重新登录": `Account status has changed, please log in again`,
    "账号状态或创建结算单权限已变化，请联系管理员": `The account status or permission to create settlement documents has changed, please contact the administrator.`,
    "账号状态或导出权限已变化，任务已停止": `The task stopped because the account status or export permissions changed.`,
    "账号状态或归属已变化，请重新登录": `The account status or ownership has changed, please log in again.`,
    账号状态筛选无效: `Account status filtering is invalid`,
    账号管理: `User accounts`,
    "账号绑定已变化，请刷新后核对": `Account binding has changed, please refresh and check.`,
    账号菜单: `Account Menu`,
    账号设置已保存: `Account settings have been saved`,
    账号额度: `Account quota`,
    账号额度必须为最多8位小数的正数: `The account limit must be a positive number with up to 8 decimal places.`,
    账号额度最多8位小数: `account limit can be up to 8 decimal places`,
    账号额度须选择单账号或全部账号合计: `The account limit must be selected as a single account or the total of all accounts.`,
    "账号额度须选择总额度、每日或每月": `Account quota must be selected as total quota, daily or monthly`,
    账号额度须选择面值币种: `The account limit must select the face value currency.`,
    账户不在待审核状态: `The account is not in the pending review status`,
    账户信息加密失败: `Account information encryption failed`,
    "账户变更须经审核，审核通过前旧账户仍有效": `Account changes are subject to review. The old account will remain valid until the review is passed.`,
    账户号码过短: `Account number is too short`,
    账户审核已处理: `Account review has been processed`,
    账户注册地区: `account registration area`,
    "账户状态已变化，请退回并重新申请": `Account status has changed, please return and reapply.`,
    账户状态筛选: `Account status filtering`,
    账户类型: `Account type`,
    "账户类型 / 转账方式": `Account type/Transfer method`,
    账户类型筛选: `Account type filtering`,
    "账户解密失败，请检查密钥，禁止重新生成密钥覆盖现有数据": `Account decryption failed, please check the key and prohibit regenerating the key from overwriting existing data.`,
    "费用期间内存在价格变更，请按生效时刻拆分费用后再核对；不能整日套用新价": `There is a price change during the fee period. Please split the fee according to the effective time before checking; the new price cannot be applied throughout the day.`,
    费用期间必须完整落在报价有效期内: `The fee period must completely fall within the validity period of the quote`,
    资料: `Information`,
    资料修改已提交审核: `Profile changes have been submitted for review.`,
    "资料修改已提交审核；审核通过前，下面显示的是当前生效资料。": `data modification has been submitted for review; until the review is passed, the currently effective data is displayed below.`,
    资料审核: `Profile review`,
    资料审核已通过: `data review passed`,
    资料审核状态: `Data review status`,
    "资料已变化，请刷新后重试": `The data has changed, please refresh and try again.`,
    资料已提交审核: `information has been submitted for review`,
    "资料已提交，请刷新后重试": `The data has been submitted, please refresh and try again.`,
    "资料已被修改，请刷新后重试": `The data has been modified, please refresh and try again.`,
    资料需要补充: `More profile information required`,
    资源: `Resources`,
    "资源 / lane": `resources / lane`,
    "资源 / 来源": `Resources / Sources`,
    "资源 / 账单": `Resources/Bills`,
    "资源 / 项目": `Resources/Projects`,
    资源不处于可提交状态: `The resource is not in a submittable state`,
    资源不能重复: `Resources cannot be repeated.`,
    资源交付入口尚未启用: `The resource delivery entrance has not been enabled yet`,
    资源交付成功: `Resource delivery successful`,
    "资源关联已变化，请平台核对": `The resource association has changed, please check with the platform.`,
    资源关键词: `resource keywords`,
    资源列表: `Resource list`,
    资源名称: `Resource name`,
    "资源名称不能超过 100 字符": `Resource name cannot exceed 100 characters`,
    "资源名称请勿包含 Key 或 Key 片段": `Resource name must not contain Key or Key fragment`,
    资源尚无已确认的CCMAX关联: `resource has no confirmed CCMAX association`,
    资源尚未交付: `The resource has not been delivered yet`,
    "资源尚未确认绑定账号，请先核对交付结果": `The resource has not been confirmed to be bound to the account. Please check the delivery results first.`,
    "资源已变化，目标已创建，请人工核对": `The resource has changed and the target has been created. Please check manually.`,
    "资源已变化，请刷新": `The resource has changed, please refresh`,
    资源已在平台接收: `resource has been received on the platform`,
    "资源已有分发，需先核对原结果": `resources have been distributed, the original results need to be checked first`,
    资源已有创建记录: `The resource has been created.`,
    资源归属已变化: `Resource ownership has changed`,
    资源总数: `Resources`,
    资源情况: `Resource summary`,
    "资源或 lane 归属已变化": `Resource or lane ownership has changed`,
    资源扩展信息: `resource extension information`,
    资源接口录入尚未启用: `Resource interface entry has not been enabled yet`,
    资源接口配置: `Resource integrations`,
    "资源无可查询的 CCMAX lane": `There is no CCMAX lane for querying resources.`,
    资源未处于可授权状态: `The resource is not in an authorizable state`,
    资源概况刷新中: `resource profile is being refreshed`,
    资源概况刷新失败: `Resource profile refresh failed`,
    资源概况刷新已合并至后续任务: `Resource profile refresh has been merged into subsequent tasks`,
    "资源概况加载失败：": `Resource profile loading failed:`,
    资源概况已刷新: `resource overview has been refreshed`,
    资源概况待刷新: `resource overview to be refreshed`,
    "资源正在更换代理或结果待核对，请先查看更换记录": `The resource is changing proxies or the result needs to be verified. Please check the replacement record first.`,
    "资源正在更换代理或结果待核对，请查看更换记录": `The resource is changing proxies or the result needs to be verified. Please check the replacement record.`,
    资源状态: `Resource status`,
    "资源状态已变化，请刷新列表": `The resource status has changed, please refresh the list`,
    资源状态数量: `Resource status quantity`,
    资源状态筛选不正确: `Resource status filtering is incorrect`,
    资源目标关联已变化: `Resource target association has changed`,
    "资源目标关联已变化，不能更新扩展数据": `The resource target association has changed and the extended data cannot be updated.`,
    "资源目标关联已变化，不能更新消费快照": `The resource target association has changed and the consumption snapshot cannot be updated.`,
    资源管理: `Resources`,
    资源类型: `Resource type`,
    "资源类型、项目或创建账号查询条件不正确": `The resource type, project or account creation query conditions are incorrect.`,
    资源类型条件不一致: `Resource type conditions are inconsistent`,
    资源类型配置不正确: `The resource type configuration is incorrect`,
    资源编号: `resource number`,
    资源费用: `Resource fee`,
    资源资料不能为空: `Resource data cannot be empty`,
    资源资料已变化: `resource information has changed`,
    "资源资料已变化，请刷新后重试": `The resource information has changed, please refresh and try again.`,
    资源身份密钥配置无效: `Resource identity key configuration is invalid`,
    资源身份计算不可用: `Resource identity calculation is unavailable`,
    资源金额: `Resource amount`,
    资源额度概况: `Resource Quota Overview`,
    "资源／来源编号": `Resource/Source Number`,
    资质待审核: `Qualifications pending review`,
    资质材料: `Qualification Material`,
    资质材料已上传: `qualification materials have been uploaded`,
    资质附件已上传: `qualification attachment has been uploaded`,
    资金管理: `Payments`,
    资金管理子菜单: `Fund Management Submenu`,
    资金账户: `capital account`,
    资金通道: `Payment providers`,
    起: `From`,
    "起 ": `From `,
    超时自动确认结算: `Automatic confirmation of settlement after timeout`,
    跟随时区: `Auto (time zone)`,
    路径须为简单点分字段名: `The path must be a simple dotted field name`,
    转账: `Transfer`,
    转账手续费: `Transfer fee`,
    转账方式: `Transfer method`,
    "转账流水号 / 凭证编号": `Transfer serial number/voucher number`,
    "转账流水号 / 凭证编号（选填）": `Transfer serial number/voucher number (optional)`,
    转账用途代码: `Transfer purpose code`,
    转账网络: `Transfer Network`,
    轮询: `Polling`,
    输入: `Enter `,
    "输入 27 表示 27折（原金额的 27%）。仅作建议，不限制实际报价。": `Enter 27 for 27% of the original amount. This is a suggestion; quotes may use a different discount.`,
    "输入值大于允许的最大值。": `The value exceeds the allowed maximum.`,
    "输入值小于允许的最小值。": `The value is below the allowed minimum.`,
    "输入内容过短。": `The value is too short.`,
    "输入内容过长。": `The value is too long.`,
    输入只读监控令牌: `Enter read-only monitoring token`,
    输入名称查询更多供应商: `Enter the name to query more suppliers`,
    输入密码: `Enter your password`,
    输入有效价格后显示折扣后金额: `Enter a valid price to see the discounted amount`,
    输入管理密钥: `Enter admin key`,
    输入账号: `Enter your username`,
    "达到本轮采集时限，已保存数据，下轮补采": `The collection time limit of this round has been reached. The data has been saved and will be supplemented in the next round.`,
    "达到连续失败次数后临时锁定账号；同时保留接口限流。": `Temporarily lock an account after repeated failed sign-ins. API rate limits still apply.`,
    过期时间需为正整数毫秒时间戳: `The expiration time must be a positive integer millisecond timestamp`,
    "过期时间（毫秒时间戳，可选）": `expiration time (millisecond timestamp, optional)`,
    运营归属: `Operator assignments`,
    "运行 ID 不正确": `The running ID is incorrect`,
    "运行 {0}": `Run {0}`,
    运行中: `running`,
    运行周期: `Schedule`,
    运行周期已保存: `The running cycle has been saved`,
    "运行周期须为 1 至 1440 分钟": `operation cycle must be 1 to 1440 minutes`,
    "运行周期（分钟）": `operation cycle (minutes)`,
    "运行情况读取失败：": `Failed to read running status:`,
    运行数据已重新采集: `Operation data has been recollected`,
    运行记录分页参数不正确: `The running record paging parameters are incorrect`,
    返回供应商列表: `Return to supplier list`,
    "返回修改 ": `Return to modification `,
    返回批量预览: `Return to batch preview`,
    返回有效密钥: `returns a valid key`,
    "返回选择 ": `Return to selection `,
    还没有定时任务: `There is no scheduled task yet`,
    "还没有营业额记录。可以先手工记一笔。": `No turnover recorded yet. Add a manual entry to get started.`,
    "这一天、这个站点和币种已经记过": `This day, this site and currency have been debited`,
    "这个登录账号已存在，可在列表中重置密码。": `This login account already exists, and the password can be reset in the list.`,
    "这是一笔本地模拟付款，没有发生真实款项支出。": `This is a local simulated payment and no real payment has occurred.`,
    "这里只展示平台已发布并到达生效时间的最新版本；实际付款采用的汇率以对应付款记录快照为准。 ": `Only the latest version of the platform that has been released and has reached the effective time is displayed here; the exchange rate used for actual payment is based on the snapshot of the corresponding payment record. `,
    "这里记录已落库的通道提交、主动查单和结果处理，不展示密钥、令牌或完整收款信息。 ": `View recorded provider submissions, status checks and processing results. Credentials and full recipient details are hidden. `,
    进度: `progress`,
    "进度查询失败，请稍后重试。": `Progress query failed, please try again later.`,
    进度查询暂不可用: `Progress query is temporarily unavailable`,
    "进度自动更新；关闭后仍可从更换记录查看": `progress is updated automatically; it can still be viewed from the replacement record after closing`,
    "连接 CCMAX 服务失败": `Failed to connect to CCMAX service`,
    "连接 CCMAX 服务超时": `Connection to CCMAX service timed out`,
    "连接检查：{0}": `Connection check: {0}`,
    连接正常: `connection is normal`,
    "连接正常，该账户需 Travel Rule 问卷": `The connection is normal, this account requires a Travel Rule questionnaire`,
    连续失败次数: `Number of consecutive failures`,
    退出中: `Exiting`,
    退出登录: `Sign out`,
    "退出登录 ": `Sign out `,
    退回: `Reject`,
    退回付款申请: `Return payment application`,
    退回供应商资质: `Return supplier qualification`,
    "退回原因：": `:`,
    退回待审核报价: `Return the quote pending review`,
    退回收款账户: `Return to repayment account`,
    退回时必须填写原因: `The reason must be filled in when returning`,
    退回结算: `return settlement`,
    退回补充: `Request changes`,
    "适用于供应商资料、收款账户、报价和付款审核；仍需相应审核权限并满足业务条件。 ": `Applies to supplier profiles, payment accounts, quotes and payment reviews. Review permissions and other business requirements still apply. `,
    适用报价缺少可信倍率: `The applicable quote lacks a credible multiple`,
    适用日期: `Applicable date`,
    适用期间: `Effective period`,
    选填: `Optional`,
    "选填，可填小数。填写后在报价时提示；留空则不显示，也不要求按此报价。": `Optional, decimals can be filled in. After filling in, you will be prompted when quoting; if you leave it blank, it will not be displayed and you will not be required to quote based on this.`,
    "选填；填写时需为有效邮箱格式": `Optional; when filling in, it must be in a valid email format`,
    选择: `Select`,
    选择CCMAX项目: `Select CCMAX project`,
    "选择{0}": `Select {0}`,
    选择付款方式: `Select payment method`,
    选择供应商: `Select supplier`,
    选择供应商代理: `Select supplier proxy`,
    选择全部: `Select all`,
    "选择全部来源{0}": `Select all sources{0}`,
    "选择单日金额来源（已选 ": `Select the source of daily amount (selected `,
    选择已有代理或粘贴代理地址: `Select an existing proxy or paste the proxy address`,
    选择已有用户: `Select existing users`,
    "选择开始日期，再选择结束日期": `Select the start date, then select the end date`,
    选择替换代理: `Select replacement proxy`,
    选择服务任务: `Select service task`,
    选择本页可操作资源: `Select this page to replace resources`,
    选择结束日期: `Select end date`,
    选择页码: `Select page number`,
    选择项目: `Select item`,
    选择项目后查看报价: `Check the quote after selecting the project`,
    逐条检测结果: `test results one by one`,
    "逐条选择不同代理 ": `Select different proxies one by one `,
    逐模型费用已保存为待核对观测: `Model-by-model costs have been saved as observations to be verified`,
    逐模型费用核对: `Model-by-model cost verification`,
    通知内容: `Notification content`,
    "通知已撤回，已移除 {0} 条未读消息": `Notification has been withdrawn and {0} unread messages have been removed`,
    通知标题: `notification title`,
    通知正文: `Notice text`,
    "通知状态已变化，请刷新后重试": `The notification status has changed, please refresh and try again.`,
    通知管理: `Announcements`,
    通知草稿已保存: `Notification draft saved`,
    "通知草稿已变化，请刷新后重试": `The draft notification has changed, please refresh and try again.`,
    通知草稿已更新: `Draft notification has been updated`,
    通过: `Approve`,
    "通过支付通道执行 ": `Execute through the payment provider `,
    通过资金通道执行付款: `Execute payment through fund channel`,
    通道状态已核对: `Channel status has been verified`,
    "通道请求已发起，结果不明时不能释放应付占用": `The channel request has been initiated, and the occupied occupation cannot be released when the result is unknown.`,
    逾期已自动确认: `Overdue has been automatically confirmed`,
    "逾期未提出异议，系统已自动确认": `No objection has been raised within the time limit, and the system has automatically confirmed it.`,
    逾期自动确认: `Overdue automatic confirmation`,
    邮箱: `Email`,
    "部分 lane 未返回": `Some lanes are not returned`,
    "部分 lane 未返回；缺失不能按零处理": `Some lanes are not returned; missing items cannot be treated as zero.`,
    部分付款: `Partially paid`,
    "部分代理尚未加载：": `Some proxies have not been loaded:`,
    "部分供应商的可结算日账已变化，请刷新供应商列表": `The settleable daily accounts of some suppliers have changed, please refresh the supplier list`,
    部分失败: `Partial failure`,
    部分完成: `partially completed`,
    部分已收款: `Partial payment has been received`,
    "部分查询失败：{0} 批失败，{1} 个 lane 缺失": `Partial query failed: {0} batch failed, {1} lanes missing`,
    "部分查询失败；已保存成功批次，旧金额保持不变。": `Partial query failed; the successful batch has been saved and the old amount remains unchanged.`,
    部分监控数据暂不可用: `Some monitoring data are temporarily unavailable`,
    "配置 ": `configuration `,
    配置中: `is configuring`,
    配置代理: `configure proxy`,
    "配置保存后下一轮执行生效，当前执行继续使用原配置。运行周期通过「编辑周期」设置。": `After the configuration is saved, the next round of execution will take effect, and the current execution will continue to use the original configuration. The running cycle is set through "Edit Cycle".`,
    "配置审核方式；新注册供应商的审批开关默认开启。": `Configure the review method; the approval switch for newly registered suppliers is turned on by default.`,
    配置工作台展示: `Configure workbench display`,
    "配置工作台展示 ": `Configure workbench display `,
    "配置已变化，请刷新后重试": `The configuration has changed, please refresh and try again.`,
    "采用V{0} · {1}": `uses V{0} · {1}`,
    "采用当前已生效的版本，提交后冻结": `adopts the currently effective version and will be frozen after submission.`,
    "采用最新配置 ": `adopts the latest configuration `,
    采购商品: `Purchase goods`,
    采集: `collection`,
    "采集 CCMAX 日账观测": `collects CCMAX daily account observations`,
    "采集 {0}：{1}/{2} 批": `Collection {0}: {1}/{2} batch`,
    采集反馈: `Collect feedback`,
    采集周期已保存: `Collection cycle has been saved`,
    "采集周期须为 2 至 3600 秒的整数": `acquisition period must be an integer from 2 to 3600 seconds`,
    "采集周期（秒）": `Collection cycle (seconds)`,
    "采集失败，请重试": `Collection failed, please try again`,
    "采集失败：{0}": `Collection failed: {0}`,
    采集完成: `collection completed`,
    "采集完成，数据较旧：{0}": `Collection completed, data is older: {0}`,
    "采集完成，源数据较旧": `Collection completed, source data is older`,
    "采集已完成，但上游数据时间较旧。": `Collection has been completed, but the upstream data time is older.`,
    "采集成功：{0}": `Collection successful: {0}`,
    采集时间: `collection time`,
    采集时间未知: `collection time unknown`,
    "采集时间：": `collection time:`,
    "采集未成功，已保留上次数据": `The collection was unsuccessful and the last data has been retained.`,
    重复代理: `Duplicate proxy`,
    重复支付通道编码: `Duplicate payment channel code`,
    重新加载: `Reload`,
    "重新加载选项 ": `reload option `,
    重新发布: `re-released`,
    重新发布汇率版本: `re-release exchange rate version`,
    重新启用: `Re-enable`,
    "重新导出 ": `re-export `,
    重新授权: `reauthorization`,
    "重新授权 ": `reauthorization `,
    重新授权方式: `Reauthorization method`,
    "重新授权方式 ": `Reauthorization method `,
    重新核对: `Recheck`,
    "重新核对 ": `Recheck `,
    重新生成授权链接: `Regenerate authorization link`,
    重新生成未完成项: `Regenerate unfinished items`,
    重新识别: `re-identification`,
    "重新读取授权记录 ": `Reread authorization records `,
    "重新读取配置（保留输入） ": `Reread configuration (retain input) `,
    重置: `Reset`,
    "重置 ": `Reset `,
    "重置 API 密钥": `Reset API key`,
    "重置“{0}”后，旧密钥立即失效。": `After resetting "{0}", the old key becomes invalid immediately.`,
    "重置中…": `Resetting...`,
    "重置后旧会话失效，首次登录要求遵循当前系统参数。": `The old session becomes invalid after reset, and the first login is required to follow the current system parameters.`,
    重置团队成员密码: `Reset team member password`,
    重置团队账号密码: `Reset team account password`,
    重置密码: `Reset password`,
    "重置密码 ": `Reset password `,
    "重置密码 · {0}": `Reset password · {0}`,
    重置时间未提供: `reset time not provided`,
    "重置时间：": `reset time:`,
    重置筛选: `Reset filtering`,
    "重置筛选 ": `Reset filtering `,
    重置账号密码: `Reset account password`,
    "重置：": `reset:`,
    重试: `Retry`,
    "重试 ": `Retry `,
    "重试加载代理 ": `Retry loading proxy `,
    "重试加载操作内容 ": `Retry loading operation content `,
    重试加载详情: `Retry loading details`,
    重试失效原因: `Reason for retry failure`,
    重试筛选选项: `Retry filtering options`,
    "重试统计 ": `Retry statistics `,
    重试读取并发配置: `Retry reading concurrent configuration`,
    金额: `Amount`,
    "金额、数量或汇率必须大于零": `Amount, quantity or exchange rate must be greater than zero`,
    "金额同步失败，仍显示上次成功的金额": `Amount synchronization failed, the last successful amount is still displayed.`,
    "金额同步失败，暂未取得消费金额": `Amount synchronization failed, the consumption amount has not been obtained yet`,
    "金额同步失败：{0}": `Amount synchronization failed: {0}`,
    金额小数位超过币种精度: `The decimal places of the amount exceed the currency precision.`,
    金额已同步: `Amount has been synchronized`,
    "金额已同步，最新账号状态读取失败：{0}": `The amount has been synchronized, and the latest account status failed to be read: {0}`,
    金额性质: `Nature of amount`,
    "金额或数量必须非负、小于 10^15，且最多 12 位小数": `The amount or quantity must be non-negative, less than 10^15, and have up to 12 decimal places.`,
    金额所属开始日期: `Start date of amount`,
    金额所属结束日期: `End date of the amount`,
    金额来源: `Amount Source`,
    金额确认: `Amount Confirmation`,
    金额记录: `Amount records`,
    "金额须由对应供应商确认，平台不能代签": `The amount must be confirmed by the corresponding supplier, and the platform cannot sign for it.`,
    "金额预览已过期，请重新生成预览": `The amount preview has expired, please regenerate the preview.`,
    钱包类型: `wallet type`,
    银行账户: `Bank account`,
    链上收款账户必须选择网络: `The on-chain payment account must select the network`,
    链上收款账户缺少网络: `The payment account on the chain lacks network`,
    链上转账: `On-chain transfer`,
    "链上转账 · {0}": `On-chain transfer · {0}`,
    "链接（未发现 code 参数）": `link (code parameter not found)`,
    "锁定时间（分钟）": `Lock duration (minutes)`,
    长度: `length`,
    "长度须为 {0}—{1} 位": `Length must be {0}–{1} characters`,
    阅读情况: `reading status`,
    阶段与进度: `Stages and Progress`,
    "附件大小必须在 1B 到 10MB 之间": `Attachment size must be between 1B and 10MB`,
    附件类型不正确: `The attachment type is incorrect`,
    附加自定义角色: `Additional custom roles`,
    "附加角色请选择自定义角色，基础身份请在主角色中设置": `Please select a custom role for additional roles, and set the basic identity in the main role.`,
    "陈宁 · 财务": `Chen Ning · Finance`,
    限流冷却: `current limiting cooling`,
    限流等级: `current limiting level`,
    随机: `random`,
    随机整数区间须在1至100内: `The random integer range must be between 1 and 100`,
    隐藏: `Hide`,
    隐藏密码: `hidden password`,
    隐藏密钥: `hidden key`,
    隐藏确认密码: `Hide confirmation password`,
    需核对差额: `Need to check the difference`,
    "需要身份验证(kyc)": `requires authentication (kyc)`,
    "需要通过程序访问平台时，可新建密钥。": `When you need to access the platform through a program, you can create a new key.`,
    非资源款项: `Non-resource money`,
    面积图: `Area chart`,
    "面积图 ": `Area chart `,
    页码不正确: `The page number is incorrect`,
    页面加载出现异常: `Unable to load the page`,
    项目: `Project`,
    "项目 ": `Project `,
    "项目 / 记录": `Project/Record`,
    "项目不存在、已停用或不是CCMAX项目": `project does not exist, has been deactivated, or is not a CCMAX project`,
    项目不存在或已停用: `project does not exist or has been deactivated`,
    项目分类汇总: `Project classification summary`,
    项目分配: `Project Allocation`,
    "项目分配成功，资源已移入交付列表和资源列表": `Project allocation is successful, resources have been moved to the delivery list and resource list`,
    "项目加载失败：": `Project loading failed:`,
    "项目口径已变化，请按当前项目重新提交报价": `project has changed. Please resubmit the quote based on the current project.`,
    项目合计每分钟调用能力: `Total project throughput per minute`,
    项目名称: `project name`,
    "项目名称加载失败：": `Project name loading failed:`,
    项目名称或编号: `Project name or code`,
    项目品类: `project category`,
    项目大类: `Project categories`,
    项目大类已保存: `project category has been saved`,
    "项目大类已停用，请选择启用的大类": `The project category has been disabled, please select the enabled category`,
    项目大类已删除: `project category has been deleted`,
    "项目大类已发生变更，请刷新后重试": `The project category has changed, please refresh and try again`,
    项目大类码值: `Project category code value`,
    项目大类码值已存在: `project category code value already exists`,
    项目大类筛选: `Project Category Screening`,
    项目大类筛选过长: `Project category screening is too long`,
    项目已保存: `project saved`,
    项目已停用或不支持该资源类型: `The project has been deactivated or does not support this resource type`,
    "项目已停用，不能提交报价": `project has been deactivated and the quote cannot be submitted.`,
    "项目已停用，不能新增报价或计费数据": `The project has been deactivated and quote or billing data cannot be added.`,
    项目已删除: `item has been deleted`,
    "项目已发生变更，请刷新重试": `The project has changed, please refresh and try again`,
    "项目已有待审或已通过的能力报价，不能变更能力口径": `The capacity definition cannot change while this project has pending or approved capacity quotes.`,
    "项目已有确认报价，不能变更结算/交付方式；请新建项目，历史快照保持不变": `This project already has an approved quote. Create a new project to change the settlement or delivery method; historical snapshots are retained.`,
    项目或分配请求标识不正确: `The project or allocation request ID is incorrect`,
    项目报价: `Project quote`,
    项目授权列表: `project authorization list`,
    项目权限: `project permissions`,
    "项目权限加载失败：": `Project permission loading failed:`,
    "项目条款已变化，请退回并按当前项目重新提交报价": `The terms of the project have changed, please return and resubmit the quote based on the current project`,
    项目状态筛选: `project status filter`,
    项目管理: `Projects`,
    项目结算方式尚未配置: `project settlement method has not been configured yet`,
    项目统计: `project statistics`,
    "项目编号将在保存后由系统自动生成。": `Project number will be automatically generated by the system after saving.`,
    项目编号计数器不存在: `Item number counter does not exist`,
    "项目能力口径已变化，请退回并按当前口径重新提交": `The project capacity definition has changed. Request changes and resubmit using the current definition.`,
    项目说明: `Project Description`,
    项目适用资源类型已保存: `The resource type applicable to the project has been saved`,
    项目须启用且已设置交付方式: `project must be enabled and delivery method set`,
    "项目：": `project:`,
    预览: `preview`,
    "预览 CCMAX 日账": `preview CCMAX daily account`,
    "预览 · 尚未生成": `Preview · Not yet generated`,
    "预览已过期，请返回重新选择": `The preview has expired, please go back and choose again.`,
    已选金额汇总: `Selected amount total`,
    "已选 {0} 家供应商 · {1} 笔可结算": `{0} suppliers selected · {1} eligible entries`,
    金额待核算: `Amount pending calculation`,
    预览结算单: `Preview settlement document`,
    预览页码或每页条数无效: `The preview page number or the number of items per page is invalid`,
    预计向供应商支付: `Estimated payment to supplier`,
    预计收款: `Estimated payment`,
    额外用量: `additional dosage`,
    额度周期: `Quota period`,
    额度报价只接受倍率: `quota quote only accepts multiples`,
    "额度报价可填小数。新提交、待审修改和调价按当前区间校验；已经通过的价格不改写。": `Discounts may contain decimals. The current bounds apply to new quotes, edits awaiting approval and price changes. Previously approved prices remain unchanged.`,
    额度数据: `quota data`,
    额度数据缺失: `Quota data is missing`,
    额度结算: `Quota settlement`,
    额度结算须使用倍率报价: `quote multiple must be used for quota settlement`,
    额度范围: `Amount range`,
    额度面值: `Credit value`,
    额度面值币种: `Quota face value currency`,
    "首次登录或密码重置后，请先修改密码": `Change your password before continuing after your first sign-in or a password reset.`,
    "首次请求：": `first request:`,
    首版仅供应商可交付资源: `first version only resources can be delivered by suppliers`,
    首版每个项目只使用一种能力口径: `Each project uses one capacity definition.`,
    默认使用联系人姓名: `uses the contact name by default`,
    默认地址: `default address`,
    "﻿结算单号,供应商,应付币种,项目,来源单号,原始金额起日,原始金额止日,数量,原始金额,金额,报价版本,记录类型,调整说明,供应商可见\r\n": `Settlement document number, supplier, payable currency, item, source document number, original amount starting date, original amount ending date, quantity, original amount, amount, quote version, record type, adjustment description, visible to suppliers\r 
`,
    "（": ` (`,
    "（{0} 笔）": `({0} entries)`,
    "（{0}）": ` ({0})`,
    "（全部 {0}）": `(all {0})`,
    "（北京时间）": `(Beijing time)`,
    "（北京时间）\n": `(Beijing time)`,
    "（北京时间）· 次日可结算 ": `(Beijing time) · Settlement can be made the next day `,
    "（可选）": `(optional)`,
    "（尾号 ": `(last number `,
    "（尾号 {0}）": ` (ending {0})`,
    "（已停用）": ` (Disabled)`,
    "（已配置 {0}）": `({0} configured)`,
    "（已配置）": `(configured)`,
    "（暂不支持换绑）": `(Bundling change is not supported yet)`,
    "（选填）": `(optional)`,
    "（错误码：": `(error code:`,
    "） ": `) `,
    "）吗？删除后不能再用于新项目。 ": `)? Once deleted it cannot be used in new projects. `,
    "），请核对凭据、代理和授权信息。": `), please check credentials, proxy and authorization information.`,
    "），请核对授权或联系平台检查接口配置。": `), please check the authorization or contact the platform to check the interface configuration.`,
    "），请稍后重试；已有交付请求请先核对结果，勿重复提交。": `), please try again later; if you already have a delivery request, please check the results first and do not submit again.`,
    "， ": `,  `,
    "，{0} 起": `, from {0}`,
    "，包含{0}": `, contains {0}`,
    "，可填小数 ": `, decimals can be filled in `,
    "，并包含{0}": `, and contains {0}`,
    "，当前账号无查看权限": `, the current account does not have viewing permissions`,
    "，正在自动重试。": `, automatically retrying.`,
    "，自 ": `, since `,
    "，自 {0} 生效": `, effective {0}`,
    "，请核对最新版本。": `, please check the latest version.`,
    "：": `: `,
    "： ": `: `,
    "：标记删除并从列表隐藏，记录保留。": `: Mark for deletion and hidden from list, record retained.`,
    "；": `; `,
    "；{0} 条存在待审或报价冲突，请核对审批": `; {0} items are pending review or have quote conflicts, please check for approval`,
    "；再次请求：": `;Request again:`,
    "；受理不等于到账，结果不明时只能查单。 ": `; Acceptance does not mean receipt. When the result is unknown, the order can only be checked. `,
    "；处理建议：": `; Handling suggestions:`,
    "；将继续核对，不会重复提交": `; Will continue to check and will not submit again`,
    "；已保留上次数据。": `; The last data has been retained.`,
    "；抵扣应付 ": `; Deduction payable `,
    "；正在显示上次读取的数据。": `; Displaying the last read data.`,
    "；留空由系统生成。 ": `; Leave blank to be generated by the system. `,
    "；结果待核对，勿重复提交": `; The result needs to be verified. Do not submit again.`,
    "；自动重试": `; retry automatically`,
    "；请稍后重新核对，勿重复提交": `; Please recheck later and do not submit again.`,
    "；金额会继续变化。": `; The amount will continue to change.`,
    "每 {0} 分钟|one": `Every {0} minute`,
    "label::创建账号": `Creator account`,
    "，": `, `,
    "（{0} 笔）|one": `({0} entry)`,
    选择全部供应商: `Select all suppliers`,
    选择全部搜索结果: `Select all results`,
    "选择单日金额来源（已选 {0} 笔）": `Select daily bills ({0} selected)`,
    "export-column::日期": `Date`,
    "export-column::供应商": `Supplier`,
    "export-column::项目": `Project`,
    "export-column::资源／来源编号": `Resource / source ID`,
    "export-column::模型": `Model`,
    "export-column::币种": `Currency`,
    "export-column::原始金额": `Base amount`,
    "export-column::报价单号": `Quote ID`,
    "export-column::计价方式": `Pricing method`,
    "export-column::计价数量": `Quantity`,
    "export-column::应付金额": `Payable amount`,
    "export-column::金额性质": `Amount type`,
    "export-column::报价生效日": `Quote effective date`,
    "export-column::报价到期日": `Quote expiry date`,
    "export-column::状态": `Status`,
    "export-column::异常说明": `Issue`,
    "export-column::已入账应付": `Accrued payable`,
    "export-column::待计价试算": `Provisional payable`,
    "export-column::明细条数": `Detail count`,
    "export-column::异常条数": `Issue count`,
    "export-column::单价": `Unit price`,
    "折扣 / 单价": `Discount / unit price`,
    "预览已按界面语言和折扣口径显示；下载文件保留原始列名与数值。": `The preview uses your language and discount format. Downloaded files retain their original columns and values.`,
    "已导入 {0} 条；跳过 {1} 条。": `Imported {0}; skipped {1}.`,
    "第 {0} 行：{1}": `Line {0}: {1}`,
    "； ": `; `,
    "、": `, `,
    "上游错误（参考 {0}）": `Provider error (reference {0})`,
    "价格 / 折扣": `Price / discount`,
    "CCMAX 返回错误（HTTP {0}）：{1}": `CCMAX returned an error (HTTP {0}): {1}`,
    "；处理建议：{0}": `; Suggested action: {0}`,
    "记录号 {0} 已存在且内容或历史归属不同，请核对，不允许覆盖": `Record {0} already exists with different contents or historical ownership. Check the record; overwriting is not allowed.`,
    "来源单号已存在但内容不同，不允许覆盖：{0}": `Source reference already exists with different contents; overwriting is not allowed: {0}`,
    "{0} 资金通道未配置": `{0} payout provider is not configured`,
    "{0} 资金通道未启用": `{0} payout provider is disabled`,
    "密码长度不符合当前策略（{0}—{1} 位）": `Password length does not meet the current policy ({0}–{1} characters)`,
    "{0} 当前手续费为 {1} USDT，与已审批付款不一致，请重新申请": `The current {0} fee is {1} USDT and differs from the approved payment. Submit a new request.`,
    "Airwallex 资金账户 {0} 可用余额不足": `The Airwallex {0} account has insufficient available funds`,
    "channel.{0} 必须为字符串或 null": `channel.{0} must be a string or null`,
    "channel.{0} 必须为数值或 null": `channel.{0} must be a number or null`,
    "第 {0} 项凭据与既有资源交叠，请核对": `Item {0} has credentials overlapping an existing resource. Check the item.`,
    "第 {0} 项与既有资源资料冲突": `Item {0} conflicts with an existing resource`,
    "计费明细：{0}": `Billing details: {0}`,
    "{0}（错误码：{1}）": `{0} (error code: {1})`,
    "密码还缺少：{0}": `Password is missing: {0}`,
    "上游返回未翻译的错误，请联系管理员（参考 {0}）": `The provider returned an untranslated error. Contact an administrator (reference {0}).`,
    "{0} 个密钥": `{0} keys`,
    "{0} 个密钥|one": `{0} key`,
    "测试此账号的连通性，可能消耗上游额度": `Test this account’s connectivity; upstream quota may be consumed`,
    "测试中…": `Testing…`,
    测试请求失败: `Test request failed`,
    "正在测试此账号，最长约 70 秒，请勿重复点击。": `Testing this account. Allow up to about 70 seconds; do not submit again.`,
    测试成功: `Test passed`,
    测试失败: `Test failed`,
    测试时间: `Test time`,
    耗时: `Latency`,
    "Worker 状态码": `Worker HTTP status`,
    上游状态码: `Upstream HTTP status`,
    未返回具体错误说明: `No detailed error was returned`,
    仅已交付且已绑定账号的资源可以测试: `Only delivered resources with a confirmed account binding can be tested`,
    "Say Hi 请求中断，测试结果未确认；请稍后手动重试": `Say Hi was interrupted; the result is unconfirmed. Retry manually later.`,
    "Say Hi 未取得有效测试结果，请稍后手动重试": `Say Hi did not return a valid test result. Retry manually later.`,
    金额录入方式: `Amount entry method`,
    按报价计算应付: `Calculate payable from quote`,
    直接录入真实结算金额: `Enter actual settlement amount directly`,
    真实结算金额: `Actual settlement amount`,
    结算币种: `Settlement currency`,
    保存真实结算金额: `Save actual settlement amount`,
    无需报价: `No quote required`,
    "仅关联供应商和项目，无需报价；填写金额即为应付金额。提交后进入待结算，付款仍需先完成供应商金额确认。": `Only the supplier and project are linked; no quote is required. The entered amount is the payable amount. Supplier confirmation is still required before payment.`,
    "已录入 {0} 条，重复 {1} 条；已按真实结算金额保存": `Entered {0}, duplicates {1}; saved as actual settlement amounts`,
    "笔跨天金额未计入日账。直接录入的真实结算金额可按完整期间结算；其他未结算记录需按真实每日金额重新录入，已结算记录需人工核对。": `cross-day amounts are excluded from daily bills. Actual settlement amounts entered directly can be settled for the whole period. Other unsettled entries need actual daily amounts; settled entries need manual review.`,
    直接结算金额仅支持手工录入: `Direct settlement amounts are only supported for manual entry`,
    直接结算金额无需填写买断数量: `Direct settlement amounts do not require a buyout quantity`,
    按供应商汇总: `By supplier`,
    "供应商 × 币种汇总": `Summary by supplier and currency`,
    日账汇总方式不正确: `Invalid daily accounting grouping mode`,
    未结算金额: `Unsettled amount`,
    已入账且尚未生成结算单的应付金额: `Posted payable amounts not yet included in a settlement statement`,
    运营主体: `Operated by`,
    平台配置: `Platform settings`,
    代理默认配置: `Proxy defaults`,
    每条代理默认可绑定资源数: `Default resources per proxy`,
    "用于该供应商及其团队成员后续新建的代理；已有代理保持原绑定上限。": `Applies to new proxies created by this supplier and its team. Existing proxy limits stay unchanged.`,
    "0 表示不限。新建或导入代理时未单独指定上限，将使用此默认值。": `0 means unlimited. New and imported proxies use this default when no individual limit is specified.`,
    使用平台默认值: `Use platform default`,
    "留空使用平台默认值。": `Leave blank to use the platform default.`,
    供应商配置已保存: `Supplier settings saved`,
    重新加载配置: `Reload settings`,
    请填写有效的非负整数: `Enter a valid non-negative integer`,
    修改供应商配置: `Update supplier settings`,
    "供应商配置已变化，请重新加载后再保存": `Supplier settings have changed. Reload them before saving.`,
    供应商配置不正确: `Invalid supplier settings`,
    按金额从高到低排序: `Sort amounts from highest to lowest`,
    按金额从低到高排序: `Sort amounts from lowest to highest`,
    取消金额排序: `Clear amount sorting`,
    日账汇总排序条件不正确: `Invalid daily summary sorting options`,
    分组管理: `Team groups`,
    新增分组: `New group`,
    编辑分组: `Edit group`,
    组管理员: `Group administrator`,
    分组成员: `Group members`,
    成员数量: `Members`,
    所属分组: `Group`,
    全部分组: `All groups`,
    未分组: `Ungrouped`,
    成员分组筛选: `Filter members by group`,
    请选择管理员: `Select an administrator`,
    分组已保存: `Group saved`,
    分组已解散: `Group dissolved`,
    解散分组: `Dissolve group`,
    确认解散: `Confirm dissolution`,
    "分组加载失败：": `Could not load groups: `,
    没有匹配的成员: `No matching members`,
    账号不可用: `Account unavailable`,
    " · 组管理员": ` · Group administrator`,
    "已在分组：{0}": `Already in group: {0}`,
    "当前查询分组：{0}": `Viewing group: {0}`,
    "管理员自动加入本组，只能查询本组成员日账单。每名成员只能属于一个分组。": `The administrator joins this group automatically and can query its members’ daily bills. Each member can belong to one group.`,
    "确认解散分组“{0}”？成员将变为未分组，组管理员的组内账单查询权限随即收回。": `Dissolve “{0}”? Members will become ungrouped and the administrator will immediately lose access to group bills.`,
    "分组已变化，请刷新重试": `The group has changed. Please refresh and try again.`,
    "请填写分组名称、管理员和有效成员": `Enter a group name, administrator and valid members.`,
    请选择本供应商已启用的团队成员作为管理员: `Select an enabled member of your supplier team as administrator.`,
    只能选择本供应商的团队成员: `Select members of your supplier team only.`,
    "成员已属于其他分组，请先从原分组移出": `A member already belongs to another group. Remove them from that group first.`,
    "分组名称、管理员或成员已被使用，请刷新后重试": `The group name, administrator or member is already in use. Refresh and try again.`,
    SUPPLIER_TEAM_GROUP_CREATED: `Supplier team group created`,
    SUPPLIER_TEAM_GROUP_CHANGED: `Supplier team group updated`,
    SUPPLIER_TEAM_GROUP_REMOVED: `Supplier team group dissolved`,
    创建团队分组: `Create team group`,
    调整团队分组: `Update team group`,
    解散团队分组: `Dissolve team group`,
    团队部门: `Team departments`,
    部门: `Department`,
    新增部门: `New department`,
    编辑部门: `Edit department`,
    删除部门: `Delete department`,
    部门名称: `Department name`,
    部门管理员: `Department administrator`,
    所属部门: `Department`,
    部门成员: `Department members`,
    未分配部门: `No department`,
    全部成员: `All members`,
    成员: `Member`,
    部门设置: `Department settings`,
    部门已删除: `Department deleted`,
    部门已保存: `Department saved`,
    部门加载失败: `Could not load departments`,
    "部门加载失败：": `Could not load departments: `,
    "如：运营一部": `For example: Operations`,
    "已选 {0} 人": `{0} selected`,
    "{0} 人": `{0} members`,
    "{0} 人|one": `{0} member`,
    "部门管理员：{0}": `Department administrator: {0}`,
    刷新团队成员: `Refresh team members`,
    "已在部门：{0}": `In department: {0}`,
    "当前查询部门：{0}": `Viewing department: {0}`,
    "创建部门，安排成员与管理员。": `Create a department and assign its members and administrator.`,
    "管理员属于本部门，只能查询本部门成员的日账单。每名成员归属一个部门。": `The administrator belongs to this department and can query its members’ daily bills. Each member belongs to one department.`,
    "删除部门“{0}”后，成员保留并移至未分配部门，管理员的部门账单查询权限随即收回。": `Deleting “{0}” keeps its members, moves them to No department, and immediately revokes the administrator’s access to department bills.`,
    "API 文档": `API documentation`,
    "CCMAX 上号": `CCMAX account delivery`,
    "{0} 个接口": `{0} endpoints`,
    "下载 OpenAPI": `Download OpenAPI`,
    快速开始: `Quick start`,
    接口说明: `API reference`,
    权限与重试: `Permissions and retries`,
    "管理 API 密钥": `Manage API keys`,
    接入地址与认证: `Base URL and authentication`,
    接口前缀: `API base URL`,
    请求头: `Request headers`,
    接入步骤: `Integration steps`,
    查询项目与报价标识: `Get project and quote identifiers`,
    "查询有权上号的项目，保存 projectCode 和 quoteId。": `Get eligible projects and save projectCode and quoteId.`,
    导入并选择代理: `Import and select a proxy`,
    "导入后查询代理列表取得 proxyId，确认代理启用且仍有容量。": `After import, list proxies to obtain proxyId. Check that the proxy is enabled and has capacity.`,
    提交单账号上号: `Onboard one account`,
    "选择凭据或 OAuth 流程。保存 requestKey 或 sessionId，通过原标识查询结果；state=SUCCESS 才确认成功。": `Use credentials or OAuth. Keep requestKey or sessionId and query the original result. Only state=SUCCESS confirms successful onboarding.`,
    查询资源和当日汇总: `Query resources and today’s summary`,
    "按资源 id 查询状态和额度；用 quoteId 查询北京时间当天的日账汇总。": `Use the resource id to query status and quotas, and quoteId for today’s summary in Asia/Shanghai.`,
    查看接口说明: `View API reference`,
    "当日日账仅提供汇总，不提供明细。金额取最近同步的数据，当天仍会变化；未同步的数据不按零处理。": `Daily bills provide a summary only. Amounts reflect the latest synchronized data and may change during the day. Missing data is not treated as zero.`,
    接口目录: `Endpoint directory`,
    请求参数: `Request parameters`,
    返回字段: `Response fields`,
    响应示例: `Example response`,
    "请替换示例中的占位值。示例密钥、凭据和账号均为占位内容，页面不会发起上号请求。": `Replace the placeholder values. Keys, credentials and accounts in these examples are placeholders. This page does not submit onboarding requests.`,
    账号与密钥权限: `Account and key permissions`,
    错误与重试: `Errors and retries`,
    错误结构: `Error format`,
    接口字段: `API fields`,
    字段: `Field`,
    "无需额外参数。": `No additional parameters.`,
    "复制失败，请手动选择复制": `Copy failed. Select and copy the text manually.`,
    项目编码: `Project codes`,
    代理导入与查询: `Proxy import and queries`,
    资源查询: `Resource queries`,
    当日日账汇总: `Today’s bill summary`,
    查询可上号项目: `List eligible projects`,
    查询代理列表: `List proxies`,
    导入代理: `Import proxies`,
    凭据上号: `Submit credentials`,
    "发起 OAuth 授权": `Start OAuth authorization`,
    提交授权码: `Submit authorization code`,
    查询上号结果: `Query onboarding result`,
    取消待提交授权: `Cancel pending authorization`,
    查询资源列表: `List resources`,
    查询资源详情: `Get resource details`,
    查询当日日账汇总: `Get today’s bill summary`,
    "平台账号可查看对接说明；这些 CCMAX 业务接口由供应商主账号或团队成员的 API 密钥调用。": `Platform accounts can read this reference. These CCMAX endpoints require an API key belonging to a supplier primary account or team member.`,
    "在「个人资料 → API 密钥」创建密钥，或点击右上方「管理 API 密钥」。密钥沿用所属账号的权限和数据范围。": `Create a key under Personal profile → API keys, or select Manage API keys above. Keys follow the owner’s permissions and data scope.`,
    "返回当前账号有权上号的 CCMAX 项目编码、名称和对应有效报价标识。团队成员的项目授权实时校验。": `Returns eligible CCMAX project codes, names and active quote identifiers. Team members’ project grants are checked on each request.`,
    "代理按当前账号范围查询和导入。主账号可使用本供应商代理，团队成员仅可使用本人创建的代理。导入后查询列表取得 proxyId。": `Proxies follow the current account scope. Primary accounts can use their supplier’s proxies; team members can use only proxies they created. List proxies after import to obtain proxyId.`,
    "单账号上号复用现有业务流程。凭据提交使用调用方生成的 UUID；OAuth 使用返回的 sessionId。相同请求标识和输入不会重复创建账号。": `Onboards one account using the existing workflow. Credential submissions use a caller-generated UUID; OAuth uses the returned sessionId. Reusing the same identifier and input does not create another account.`,
    "查询当前账号可见的资源及最近同步的状态和额度。仅返回本地已有数据，不触发上游同步，不返回原始凭据、代理认证或管理密钥。": `Queries visible resources and their latest synchronized status and quotas. Reads saved data without triggering upstream synchronization. Raw credentials, proxy authentication and management keys are excluded.`,
    "仅接受 quoteId，查询北京时间今天的汇总。主账号限定本供应商，团队成员限定本人资源及当前授权项目。不提供明细或日期范围。": `Accepts quoteId only and returns today’s summary in Asia/Shanghai. Primary accounts are scoped to their supplier; team members to their own resources and currently assigned projects. No line items or date ranges are available.`,
    "只接受 quoteId。日期由服务端固定为北京时间今天，额外日期参数、明细开关或其他账号筛选将被拒绝。": `Accepts quoteId only. The server sets the date to today in Asia/Shanghai. Extra date parameters, detail switches and other-account filters are rejected.`,
    "HTTP 200 表示已取得业务回执。UNKNOWN 或 PENDING 时继续查询原请求，不能换键自动重复上号。": `HTTP 200 confirms receipt of a business result. For UNKNOWN or PENDING, query the original request. Do not automatically resubmit with a new key.`,
    "API 密钥只能使用所属账号已有的权限；主账号、团队成员的供应商归属和本人范围由服务端校验。": `API keys can use only their owner’s permissions. The server checks supplier membership and creator scope for primary accounts and team members.`,
    "密钥撤销、到期或账号停用后无法调用；角色权限和项目授权变更会在后续请求生效。": `Revoked or expired keys and disabled accounts cannot call these endpoints. Role and project grant changes apply to subsequent requests.`,
    "旧密钥不会自动获得新增代理和账单权限，需要在个人资料中重置或重新签发。": `Existing keys do not automatically gain new proxy or billing permissions. Reset or reissue them under Personal profile.`,
    "密钥放在 Authorization 请求头中，不放入 URL 或共享日志。登录 Cookie 不能替代 API 密钥。": `Send keys in the Authorization header, not in URLs or shared logs. Login cookies cannot replace API keys.`,
    "输入不合法，或使用了不支持的查询参数。": `Invalid input or unsupported query parameters.`,
    "密钥缺失、无效、过期或账号状态不允许。": `Missing, invalid or expired key, or the account is not eligible.`,
    "账号权限不足，或接口方法尚未开放。": `Insufficient permissions, or the endpoint or method is not enabled.`,
    "对象不存在或不在当前账号可见范围。": `Object not found or outside the current account’s scope.`,
    "幂等内容、版本或业务状态冲突。": `Idempotency payload, version or business-state conflict.`,
    "上游服务或本次查询暂时不可用。": `The upstream service or query is temporarily unavailable.`,
    "读取可以重试。上号写入超时后先查询原 requestKey 或 sessionId；404 也可能表示原请求尚未落库，不能据此换键重交。": `Reads may be retried. After an onboarding timeout, query the original requestKey or sessionId. A 404 may mean the original request has not been saved yet; it does not justify resubmitting with a new key.`,
    "项目查询返回的稳定编码。": `Stable code returned by the project query.`,
    "项目查询返回的报价标识，精确关联本次查询。": `Quote identifier returned by the project query; matches this query to one quote.`,
    "代理列表返回的 id，上号时必须传入。": `Proxy id from the proxy list; required for onboarding.`,
    "调用方生成的 UUID；同一次提交重试时保持不变。": `Caller-generated UUID. Keep it unchanged when retrying the same submission.`,
    "发起 OAuth 返回的本地会话标识。": `Local session identifier returned when starting OAuth.`,
    "资源查询传资源 id；提交结果查询传 requestKey 或 sessionId。": `Use a resource id for resource queries, or requestKey/sessionId for submission results.`,
    "上号账号名称，最多128个字符。": `Account name, up to 128 characters.`,
    "ACCESS_TOKEN 的可选过期时间，使用正整数毫秒时间戳。": `Optional ACCESS_TOKEN expiry as a positive integer Unix timestamp in milliseconds.`,
    "仅兼容 false，true 暂不支持。": `Only false is supported; true is currently unavailable.`,
    "REFRESH_TOKEN 模式必填；仅通过请求体提交。": `Required in REFRESH_TOKEN mode. Send it only in the request body.`,
    "ACCESS_TOKEN 模式必填。": `Required in ACCESS_TOKEN mode.`,
    "SESSION_KEY 模式必填。": `Required in SESSION_KEY mode.`,
    "账号持有人完成授权后取得的授权码。": `Authorization code obtained after the account owner completes authorization.`,
    "代理文本，支持 SOCKS5 / HTTP / HTTPS；单次最多500行。": `Proxy text supporting SOCKS5, HTTP and HTTPS. Maximum 500 lines per import.`,
    "SOCKS5 / HTTP / HTTPS，用于未写协议的输入。": `SOCKS5, HTTP or HTTPS, used for inputs without an explicit protocol.`,
    "非负整数；0表示不限。": `Non-negative integer; 0 means unlimited.`,
    "页码从1开始，默认1。": `Page number starts at 1. Default: 1.`,
    "每页条数默认20，最大100。": `Page size defaults to 20, maximum 100.`,
    "按交付状态筛选，例如 DRAFT、DELIVERED。": `Filter by delivery state, such as DRAFT or DELIVERED.`,
    "按已有运行状态分类筛选，例如 READY、GONE、INVALID。": `Filter by saved operational status, such as READY, GONE or INVALID.`,
    "关键词查询，沿用现有账号和 Lane ID 搜索。": `Keyword query using the existing account and Lane ID search.`,
    "账号对象；OAuth 完成时与发起授权时保持一致。": `Account object. Keep it identical between starting and completing OAuth.`,
    "服务端按 Asia/Shanghai 取今天。": `The server’s current date in Asia/Shanghai.`,
    "已入账原始金额加尚未入账的当天消耗，十进制字符串。": `Posted original amounts plus today’s unposted consumption, as a decimal string.`,
    "尚未入账的当天消耗，不据此预估应付金额。": `Today’s unposted consumption. It is not used to estimate payable amounts.`,
    "只汇总已入账并保存报价依据的应付金额。": `Totals payable amounts only for posted entries with saved pricing evidence.`,
    "无数据为 false，金额为 null；真实零消耗保留零字符串。": `False with null amounts when data is missing. Actual zero consumption remains a zero string.`,
    "范围内最近观测时间，不代表全部资源已同步。": `Latest observation query time in scope; does not mean all resources have synchronized.`,
    "成功导入数量；同时检查 skipped 中的跳过项。": `Number successfully imported. Also inspect skipped items.`,
    "重复或格式错误行及对应原因。": `Duplicate or invalid lines and their reasons.`,
    "已有额度和健康状态；没有数据时为 null。": `Saved quota and health data, or null when unavailable.`,
    "本次汇总涉及的资源数量。": `Number of resources included in this summary.`,
    "本次汇总涉及的账单条目数量，仅返回数量。": `Number of bill entries included in the summary; no line items are returned.`,
    "尚未入账的条目数量。": `Number of unposted entries.`,
    "所需权限：{0}": `Required permissions: {0}`,
    "主账号需 settlement.read；团队成员沿用本人日账资格。": `Primary accounts require settlement.read; team members use their own bill-read eligibility.`,
    "代理或资源的本地标识，供后续调用使用。": `Local proxy or resource identifier for subsequent calls.`,
    "对象的可读名称。": `Human-readable object name.`,
    "业务状态；上号回执仅 SUCCESS 表示确认成功。": `Business state. Only SUCCESS confirms successful onboarding in a submission receipt.`,
    "OAuth 会话到期时间，ISO 8601 格式。": `OAuth session expiry in ISO 8601 format.`,
    "项目的内部标识。": `Internal project identifier.`,
    "项目名称。": `Project name.`,
    "QUOTA 为额度结算，ACCOUNT_BUYOUT 为账号买断。": `QUOTA indicates quota settlement; ACCOUNT_BUYOUT indicates an account buyout.`,
    "关联报价的业务编号。": `Business code of the associated quote.`,
    "金额所属币种，不合并不同币种。": `Currency of the amounts. Different currencies are not combined.`,
    "业务日期使用 Asia/Shanghai。": `Business dates use Asia/Shanghai.`,
    "当前页结果数组，具体字段见响应示例。": `Results on the current page. See the example response for item fields.`,
    "符合当前权限和筛选条件的总条数。": `Total number of results matching the current permissions and filters.`,
    "当前页码。": `Current page number.`,
    "当前每页条数。": `Current page size.`,
    "本地授权会话标识，用于完成授权和查询结果。": `Local authorization session identifier for completion and result queries.`,
    "由账号持有人打开并完成授权的链接。": `Link to be opened by the account owner to complete authorization.`,
    "成功关联的本地资源标识。": `Identifier of the associated local resource.`,
    "本组接口返回 CCMAX。": `These endpoints return CCMAX.`,
    "上游账号的 Lane ID。": `Lane ID of the upstream account.`,
    "最近同步的上游账号状态。": `Latest synchronized upstream account state.`,
    "本地交付处理结果。": `Local delivery processing state.`,
    "资源创建时间。": `Resource creation time.`,
    "资源最近更新时间。": `Latest resource update time.`,
    "资源提交交付时间，未提供时为空。": `Delivery submission time, or null if unavailable.`,
    "本次创建执行轮次，不等于最终 HTTP 创建请求次数。": `Execution rounds for this creation attempt, not the number of final HTTP create calls.`,
    "是否仍处于原流程的受控恢复中。": `Whether controlled recovery within the original workflow is ongoing.`,
    "本次处理是否结束，不代表已成功交付。": `Whether processing has finished; does not confirm successful delivery.`,
    "已保存的上游 HTTP 状态码，可能为空。": `Saved upstream HTTP status code, possibly null.`,
    "当前创建尝试的安全错误说明。": `Safe error description for the current creation attempt.`,
    "已保存的交付失败说明。": `Saved delivery failure description.`,
    "仅供应商主账号返回已入账应收金额；部门管理员和普通成员不返回此字段。": `Booked receivables are returned only for the supplier primary account. Department administrators and ordinary members do not receive this field.`,
    "如：交付组2": `For example: Delivery Group 2`,
    "勾选其他部门成员后，保存时会将其调入本部门。原部门管理员需先更换管理员。": `Select members from other departments to move them here on save. Replace their original department administrator before moving that administrator.`,
    "历史成员已初始化分组，请指定部门管理员。": `Existing members have been grouped. Please appoint a department administrator.`,
    请先更换原部门管理员: `Replace the original department administrator first`,
    "来自部门：{0}": `From department: {0}`,
    待设置管理员: `Administrator not assigned`,
    "成员所属分组已变化，请刷新后重新选择": `The member’s department has changed. Refresh and select again.`,
    "请先更换原部门管理员，再调整其分组": `Replace the original department administrator before moving this member.`,
    "PRO 推送": `PRO delivery`,
    "当前供应商不允许上号 PRO，CCMAX 已拒绝创建，请联系平台管理员。": `This supplier is not allowed to deliver PRO accounts. CCMAX rejected the creation. Contact the platform administrator.`,
    "CCMAX 无法核验账号套餐，未创建账号。请核对凭据的 user:profile 权限及代理后重新提交。": `CCMAX could not verify the account plan, so no account was created. Check the credential’s user:profile permission and proxy before submitting again.`,
    "开启后所有供应商均允许推送 PRO；关闭后按各供应商自己的配置判断。": `When enabled, all suppliers may deliver PRO accounts. When disabled, each supplier’s own setting applies.`,
    "全部供应商允许推送 PRO": `Allow PRO delivery for all suppliers`,
    "配置在下次新账号上号时生效；关闭后 CCMAX 会核验套餐并拒绝 PRO，无法核验时也不会创建账号。": `Applies when the next new account is delivered. When disabled, CCMAX checks the plan and rejects PRO accounts; accounts are not created if the plan cannot be verified.`,
    "允许该供应商推送 PRO": `Allow PRO delivery for this supplier`,
    "全局关闭时按此配置判断；全局开启时所有供应商均允许。": `This setting applies when the global switch is off. When the global switch is on, all suppliers are allowed.`,
    "当前全局已开启，所有供应商均允许推送 PRO。": `The global switch is on. All suppliers are allowed to deliver PRO accounts.`,
    "当前全局已关闭，按该供应商的开关判断。": `The global switch is off. This supplier’s own setting applies.`,
    设置管理员: `Set administrator`,
    更换管理员: `Change administrator`,
    "选择左侧小组，可设置管理员或调整成员分组。": `Select a group on the left to set its administrator or move members.`,
    "当前小组：{0}": `Current group: {0}`,
    "管理员只能查询本小组成员的日账单，请选择本组已启用成员。": `The administrator can only query this group’s daily bills. Choose an enabled member of this group.`,
    "请先在编辑部门中加入已启用成员，再设置管理员。": `Add an enabled member using Edit Department before setting an administrator.`,
    管理员已保存: `Administrator saved`,
    "新增成员将自动加入本组。": `New members are automatically added to this group.`,
    "新成员已加入{0}，项目权限由供应商主账号分配。": `The new member has joined {0}. Project access is assigned by the supplier primary account.`,
    阅读与接收人员: `Readers and recipients`,
    "已推送 {0} 人": `Sent to {0} recipients`,
    "已读 {0} 人": `Read by {0}`,
    "未读 {0} 人": `Unread by {0}`,
    "已撤回 {0} 人": `Withdrawn from {0}`,
    "历史接收明细仅保留 {0} 人，其余投递记录已移除，无法还原人员及阅读状态。": `Only {0} historical recipient records remain. Removed records cannot be used to reconstruct recipients or read status.`,
    "搜索姓名、账号或供应商": `Search names, usernames or suppliers`,
    筛选阅读状态: `Filter read status`,
    全部人员: `All recipients`,
    刷新人员明细: `Refresh recipients`,
    接收人员: `Recipients`,
    推送情况: `Delivery status`,
    已投递: `Delivered`,
    阅读状态: `Read status`,
    推送时间: `Sent at`,
    阅读时间: `Read at`,
    "已读表示该账号已打开消息或执行“全部已读”。查看人员明细不会改变阅读状态。": `Read means the account opened the message or marked all messages as read. Viewing recipient details does not mark messages as read.`,
    按报价项目筛选接收供应商: `Filter suppliers by quoted projects`,
    "报价项目（可多选）": `Quoted projects (multiple selection)`,
    "任一所选项目做过报价即可接收，包含已驳回或已撤回的报价；同一账号只推送一次。": `Suppliers with a quote for any selected project qualify, including rejected or withdrawn quotes. Each account receives one message.`,
    "移除项目 {0}": `Remove project {0}`,
    暂无有报价记录的项目: `No projects with quote history`,
    "请至少选择一个报价项目。": `Select at least one quoted project.`,
    "正在计算接收人员…": `Calculating recipients…`,
    "预计推送 {0} 人": `Expected recipients: {0}`,
    收起人员: `Hide recipients`,
    查看接收人员: `View recipients`,
    "实际接收人员以发布时的账号状态和报价记录为准。": `Recipients are determined by account status and quote records at publication.`,
    "查看阅读和接收人员：{0}": `View readers and recipients: {0}`,
    查看人员: `View people`,
    无效阅读状态: `Invalid read status`,
    只有供应商接收范围可以按报价项目筛选: `Only supplier audiences can be filtered by quoted projects`,
    无效报价项目: `Invalid quoted project`,
    "报价项目不存在，请重新选择": `A selected project no longer exists. Select again.`,
    "没有符合条件的接收账号，请调整接收范围或报价项目": `No eligible recipients. Adjust the audience or quoted projects.`,
    已读: `Read`,
    未读: `Unread`,
    清空选择: `Clear selection`,
    "仅支持通过 quoteId 查询当日日账汇总": `Only quoteId is supported for today’s billing summary.`,
    "仅供应商账号可调用 CCMAX 业务 API": `Only supplier accounts can call the CCMAX business API.`,
    "OAuth 请使用授权上号接口": `Use the OAuth authorization endpoint for OAuth accounts.`,
    项目编码不正确: `Invalid project code.`,
    报价标识不正确: `Invalid quote ID.`,
    "日账自动入账失败，请检查运行记录": `Automatic daily billing failed. Check the execution log.`,
    "暂时无法核实支付通道费用，请稍后重试": `The payment provider fee cannot be verified right now. Try again later.`,
    "支付通道返回的费用无效，请稍后重试": `The payment provider returned an invalid fee. Try again later.`,
    "尚未发起支付的通道申请请作废，不可人工登记付款失败": `Cancel a channel payment request that has not started. Do not manually mark it as failed.`,
    支付通道费用无效: `Invalid payment provider fee.`,
    支付通道尚未配置: `The payment provider is not configured.`,
    "付款状态已变化，请查询原请求状态": `The payment status has changed. Check the original request.`,
    已保存账号尚未核对成功: `The saved account has not been verified successfully.`,
    "来源明细写入数量不一致，请刷新重试": `The number of saved source entries does not match. Refresh and try again.`,
    只能作废当前版本且尚未进入付款的已确认结算单: `Only the current version of a confirmed settlement that has not entered payment can be voided.`,
    "存在未关闭付款申请、已付款或通道执行记录，不能作废结算单": `This settlement has an open payment request, a completed payment, or a provider execution record and cannot be voided.`,
    "结算单或付款状态已变化，请刷新重试": `The settlement or payment status has changed. Refresh and try again.`,
    "小组管理员权限已变化，请刷新重试": `Your group administrator access has changed. Refresh and try again.`,
    不能修改自己的项目权限: `You cannot change your own project access.`,
    只能分配自己已有且当前可授权的项目: `You can only assign projects you currently have access to and are eligible to delegate.`,
    "供应商主账号不可用，请联系供应商": `The supplier primary account is unavailable. Contact the supplier.`,
    "小组已变化，请刷新后重试": `The group has changed. Refresh and try again.`,
    仅供应商主账号或当前小组管理员可操作: `Only the supplier primary account or the current group administrator can perform this action.`,
    交付组1: `Delivery group 1`,
    "每位成员必须归属部门，请先调整到其他部门": `Every member must belong to a department. Move the member to another department first.`,
    请选择其他目标部门: `Choose a different destination department.`,
    "至少保留一个部门，请先新增部门并转移成员": `At least one department must remain. Create another department and move the members first.`,
    "目标部门已变化，请刷新重试": `The destination department has changed. Refresh and try again.`,
    付款状态: `Payment status`,
    " 条记录": ` records`,
    历史记录: `History`,
    "自己的项目权限由供应商分配。": `Your project access is assigned by the supplier.`,
    "仅可分配自己已有且可授权的项目；其他已有项目由供应商管理。": `You can only assign projects you have access to and can delegate. Other existing project access is managed by the supplier.`,
    "暂无可分配项目，请联系供应商分配项目权限。": `No projects are available to assign. Contact the supplier for project access.`,
    "仅修改当前可管理的项目权限。": `Only project access within your current scope is changed.`,
    调整分组: `Move to department`,
    "成员已加入{0}，请在列表中通过“权限管理”分配项目。": `The member has joined {0}. Use Project access in the list to assign projects.`,
    "成员已加入{0}，可在列表中分配你已有的项目。": `The member has joined {0}. You can assign your existing projects from the list.`,
    新成员所属部门: `New member department`,
    "交付组1（自动创建）": `Delivery group 1 (created automatically)`,
    成员分组已更新: `The member’s department has been updated.`,
    "当前部门：{0}": `Current department: {0}`,
    目标部门: `Destination department`,
    请选择目标部门: `Choose a destination department`,
    保存分组: `Save department`,
    成员分配已保存: `Member assignments saved.`,
    分配成员: `Assign members`,
    "删除部门“{0}”后，成员将转入目标部门，原管理员权限随即收回。": `Members of “{0}” will move to the destination department. The current department administrator’s access will be revoked.`,
    成员转入部门: `Move members to`,
    "请选择本组已启用成员作为管理员，可查看日账、创建组员并分配已有项目。": `Choose an enabled member of this group to view daily bills, create members and assign existing projects.`,
    "每名成员必须归属一个部门。管理员可管理本组成员及已有项目权限。": `Every member must belong to one department. Administrators can manage their group’s members and delegate existing project access.`,
    已在本组: `In this group`,
    未在本组: `Outside this group`,
    结算单已作废: `Settlement voided`,
    作废结算单: `Void settlement`,
    "作废后原始金额重新可选，原结算及确认记录保留。": `Voiding releases the source amounts for a new settlement. The original settlement and confirmation records are retained.`,
    "结算单已作废，原始金额重新可选": `The settlement has been voided. Its source amounts are available again.`,
    没有匹配的供应商: `No matching suppliers`,
    "﻿结算单号,供应商,应付币种,项目,资源编号或款项,原始金额起日,原始金额止日,来源笔数,原始金额,金额,报价版本,记录类型,调整说明,供应商可见\r\n": `﻿Settlement number,Supplier,Payable currency,Project,Resource or item,Source start date,Source end date,Source count,Original amount,Amount,Quote version,Record type,Adjustment note,Supplier visibility\\r\\n`,
    "供应商 × 币种 × 折扣汇总": `Supplier × currency × pricing summary`,
    报价未提供或不唯一: `Price unavailable or ambiguous`,
    待计价部分仅供参考: `Unpriced usage: reference price only`,
    直接录入: `Direct amount`,
    入账时计价依据: `Recorded pricing basis`,
    供应商汇总: `Supplier summary`,
    供应商汇总导出: `Export supplier summary`,
    "导出当前筛选的全部供应商汇总，包含折扣": `Export all filtered supplier summaries, including discounts`,
    "按供应商、币种和折扣归组，导出全部分页。待计价折扣仅供参考，不计入入账应付。": `Export all pages grouped by supplier, currency and discount. Pending discounts are for reference only and do not count toward booked payables.`,
    计价说明: `Pricing basis`,
    记录数: `Record count`,
    待计价条数: `Pending count`,
    已入账条数: `Booked count`,
    跳至: `Go to`,
    跳转页码: `Go to page number`,
    页: `page`,
    跳转: `Go`,
    "显示与所选周期有交集的结算单（含起止当天）。": `Show statements whose settlement periods overlap the selected dates (inclusive).`,
    来源开始日期: `Source start date`,
    来源结束日期: `Source end date`,
    "日期用于筛选明细，结算周期按所选明细的最早开始日期和最晚结束日期自动识别。": `Use these dates to find source entries. The settlement period is automatically set to the earliest start and latest end of the selected entries.`,
    结算周期开始日期不能晚于结束日期: `The settlement period start must not be after its end.`,
    "开启后所有供应商均可上 CCMAX；关闭后按各供应商的参数配置判断。": `When enabled, all suppliers can deliver CCMAX accounts. When disabled, each supplier’s settings apply.`,
    "全部供应商允许 CCMAX 上号": `Allow CCMAX account delivery for all suppliers`,
    "对供应商及其有项目权限的团队成员生效，历史资源仍可查看。": `Applies to suppliers and team members with project access. Existing resources remain accessible.`,
    "允许该供应商 CCMAX 上号": `Allow CCMAX account delivery for this supplier`,
    "系统参数的全局开关关闭时，按此配置判断。": `This setting applies when the global switch in System settings is off.`,
    "当前全局已开启，所有供应商均可 CCMAX 上号。": `The global switch is on. All suppliers can deliver CCMAX accounts.`,
    "当前供应商未开通 CCMAX 上号，请联系平台管理员。": `CCMAX account delivery is disabled for this supplier. Contact a platform administrator.`,
    CCMAX拒绝调整优先级: `CCMAX rejected the priority update`,
    CC上号规则: `CC account intake rules`,
    CC上号规则已保存: `CC account intake rules saved`,
    CC每日上号额度分配: `Allocate daily CC intake allowances`,
    PRO每日数量: `Daily PRO limit`,
    非PRO每日数量: `Daily non-PRO limit`,
    非PRO品类开放: `Non-PRO intake`,
    "PRO满额后继续接收非PRO；非PRO满额或停收后停止全部新增上号。PRO资格仍按现有开关判断。": `Non-PRO intake continues when PRO is full. All new intake stops when non-PRO is full or closed. Existing PRO eligibility settings still apply.`,
    "{0}配置方式": `{0} configuration`,
    "{0}额度来源": `{0} allowance source`,
    "{0}：{1}分配比例": `{0}: {1} allocation percentage`,
    "上下限相同即固定值。新配置用于后续上号；历史账号通过批量调整执行。": `Equal bounds produce a fixed value. New rules apply to future intake; use bulk updates for existing accounts.`,
    "上号调度参数由服务端统一计算，当前接口不接受此字段": `Intake scheduling is determined by the server. This endpoint does not accept that field.`,
    上号额度分配已保存: `Intake allowance allocations saved`,
    "上级为不限时无法按比例换算，请联系平台先明确对应品类的每日数量。": `Percentages require a finite parent allowance. Ask the platform to set a daily limit for the corresponding category first.`,
    个人上号额度分配: `Individual intake allocations`,
    个人优先级配置: `Individual priority settings`,
    个人划拨: `Individual reservations`,
    "个人平台配置只设置优先级，个人数量由供应商划拨": `Individual platform settings only control priority. The supplier allocates individual intake allowances.`,
    个人预留: `Personal reservation`,
    临时调度: `Temporary scheduling`,
    交付组: `Delivery group`,
    交付组上号额度分配: `Delivery group intake allocations`,
    交付组共享池: `Delivery group shared pool`,
    交付组划拨: `Group reservations`,
    仅供应商主账号可分配额度: `Only the supplier primary account can allocate allowances`,
    "仅平台可见；未覆盖的档位跟随供应商及系统配置。": `Platform only. Tiers without an override follow supplier and system settings.`,
    "仅调整已有账号的使用顺序，不计入当日上号数量。": `Updates the routing order of existing accounts. This does not count as new daily intake.`,
    仅重试失败项: `Retry failed items only`,
    今日上号分类额度: `Daily intake allowances by category`,
    今日上号额度: `Today’s intake allowances`,
    "今日已用：{0}": `Used today: {0}`,
    今日成功: `Successful today`,
    今日成功总数: `Total successful today`,
    "仍有处理中或待核实上号，请核对完成后调整划拨；原额度来源已保留": `Some intake requests are still processing or unconfirmed. Resolve them before changing allocations; their original allowance sources are preserved.`,
    任务创建人的平台操作权限已失效: `The task creator no longer has platform operation permission`,
    优先级上限: `Maximum priority`,
    优先级下限: `Minimum priority`,
    优先级区间须为0至1000且下限不大于上限: `Priority bounds must be integers from 0 to 1000, with minimum no greater than maximum`,
    优先级档位: `Priority tiers`,
    优先级档位不正确: `Invalid priority tier`,
    优先级调整任务已提交: `Priority update task submitted`,
    供应商共享池: `Supplier shared pool`,
    供应商总额度: `Supplier total allowance`,
    供应商每日数量: `Supplier daily limits`,
    供应商直接划拨: `Direct supplier reservation`,
    保存CC上号规则: `Save CC intake rules`,
    保存额度分配: `Save allocations`,
    停收: `Closed`,
    "共{0}个账号": `{0} accounts`,
    共享: `Shared`,
    "共享池余额供同一来源成员共用；以上数量不随资源搜索、状态筛选或分页变化。": `Shared balances are available to members using the same source. Resource search, status filters and pagination do not change these totals.`,
    分配后供应商共享剩余: `Supplier shared balance after allocation`,
    "分配后未用预留量超过上级可分配余额；已成功的数量不能回收": `Unused reservations would exceed the parent balance. Successful intake cannot be reclaimed.`,
    分配方式: `Allocation method`,
    "分配比例须在0%至100%之间，最多两位小数": `Allocation percentages must be between 0% and 100%, with at most two decimal places`,
    "划拨会预留额度，其他成员只共享剩余部分。空白表示共享；0%表示独立额度为0。": `Allocations reserve capacity, leaving the remainder for others to share. Leave blank to share; 0% reserves an allowance of zero.`,
    刷新进度: `Refresh progress`,
    北京时间: `Beijing time`,
    单独设置: `Override`,
    原CCMAX目标已停用或不存在: `The original CCMAX target is disabled or no longer exists`,
    原优先级: `Previous priority`,
    "只能向本供应商的交付组、组内成员或个人划拨，同一个人不能重复领取": `Allocate only to this supplier’s delivery groups or members. Each person may have only one allocation source.`,
    各档位优先级区间: `Priority ranges by tier`,
    "同级划拨比例不能超过100%": `Sibling allocation percentages cannot exceed 100%`,
    回收未用额度: `Reclaim unused allowance`,
    处理中及待核实: `Processing or unconfirmed`,
    套餐未识别: `Unidentified plan`,
    "实际优先级与任务值不一致，可重试失败项": `The actual priority does not match the task value. Retry the failed item.`,
    已停收: `Closed`,
    可上号: `Accepting accounts`,
    平台已停收: `Intake stopped by platform`,
    供应商未开通: `Supplier intake not enabled`,
    非PRO暂停接收: `Non-PRO intake paused`,
    未开通PRO: `PRO intake not enabled`,
    交付组未开通PRO: `PRO not enabled for this group`,
    今日额度为0: `Daily allowance is zero`,
    个人额度已回收: `Personal allowance reclaimed`,
    共享额度已预留: `Shared allowance reserved`,
    当前来源额度用尽: `Allowance source exhausted`,
    非PRO来源暂无额度: `No non-PRO allowance available`,
    当前账号暂不接收: `Intake unavailable for this account`,
    供应商今日成功总数: `Supplier accounts added today`,
    本人今日成功总数: `Your accounts added today`,
    供应商今日成功: `Supplier added today`,
    本人今日成功: `You added today`,
    本账号可用: `Available to this account`,
    "当前账号实际PRO额度来源的上限、已用、下级未用预留与本账号可用数；null上限表示不限。": `The current PRO source's limit, usage, unused child reservations and available balance for this account; a null limit means no limit.`,
    "当前账号实际非PRO额度来源的上限、已用、下级未用预留与本账号可用数；null上限表示不限。": `The current non-PRO source's limit, usage, unused child reservations and available balance for this account; a null limit means no limit.`,
    "该来源预留给直属成员或交付组的未用额度，受上级总限约束；不计入remaining。": `Unused reservations for direct members or groups, capped by parent limits and excluded from remaining.`,
    "PRO不能接收的具体原因；null表示可接收。": `The reason PRO intake is unavailable; null means intake is available.`,
    "非PRO不能接收的具体原因；null表示可接收。": `The reason non-PRO intake is unavailable; null means intake is available.`,
    "已预留给成员／交付组 {0} 个，不计入本账号可用额度。": `{0} accounts are reserved for members or groups and excluded from this account’s available allowance.`,
    "已勾选账号（{0}个）": `Selected accounts ({0})`,
    已跳过: `Skipped`,
    "已重新提交失败项，沿用原分配值": `Failed items resubmitted with their original assigned values`,
    常规: `Standard`,
    开放: `Open`,
    "当前优先级尚未查询，执行后将核对实际结果": `Current priority has not been retrieved; the actual result will be verified after execution`,
    当前使用档位: `Active tier`,
    "当前供应商已有两个上号请求正在处理，请完成后重试": `Two intake requests are already processing for this supplier. Wait for them to finish and try again.`,
    当前筛选下全部CCMAX账号: `All CCMAX accounts matching current filters`,
    "当前系统默认：{0}": `Current system default: {0}`,
    当前范围没有可调整的资源: `No resources in this selection can be updated`,
    "当前额度来源的非PRO每日数量已满或已停收，请次日再试或联系供应商管理员": `The daily non-PRO allowance for this source is full or closed. Try again tomorrow or contact the supplier administrator.`,
    待执行: `Ready to run`,
    恢复当前值: `Restore saved values`,
    成员独立优先级: `Individual member priorities`,
    我的额度来源: `My allowance source`,
    "执行会清除这些账号的临时优先级提升。账号范围与每个账号的具体值已固定，请核对预览后执行。": `Execution clears temporary priority boosts for these accounts. The account list and assigned values are fixed. Review this preview before running.`,
    批量调整优先级: `Bulk priority update`,
    拟调整值: `Assigned priority`,
    指定本次区间: `Specify a range for this task`,
    "按北京时间统计当日成功新增；数量和优先级分别继承，已成功的数量不会因修改配置清零。": `Counts successful new accounts per Beijing calendar day. Limits and priorities inherit independently. Changing settings never resets successful counts.`,
    按当前生效规则: `Use current effective rules`,
    "按比例划拨需要明确上级每日数量；请先设置上级数量或回收下级划拨": `Percentage allocations require a finite parent daily limit. Set that limit or reclaim child reservations first.`,
    接收中: `Accepting`,
    接收状态: `Intake status`,
    数值参数不正确: `Invalid numeric parameter`,
    "数量、比例基点、版本和优先级必须为整数": `Quantities, percentage basis points, versions and priorities must be integers`,
    新建调整: `New update`,
    无需修改: `Unchanged`,
    暂无团队成员: `No team members yet`,
    未独立划拨: `No individual reservation`,
    "未识别套餐已计入成功总数，识别后补入原成功日期的分类数量。": `Unidentified plans are included in the successful total. Once identified, their category count is added to the original success date.`,
    来源剩余: `Source balance`,
    "来源已用／每日上限": `Source used / daily limit`,
    "来自{0}": `From {0}`,
    查看详情: `View details`,
    查看调整记录: `View update history`,
    查询原值中: `Retrieving current values`,
    核实中: `Verifying`,
    档位: `Tier`,
    "正在查询原优先级，账号范围和拟调整值已保存，完成后即可确认执行。": `Retrieving current priorities. The account list and assigned values are saved; execution can be confirmed once retrieval finishes.`,
    "每日{0}个": `{0} accounts per day`,
    "每日数量须为0至100000000的整数；系统默认不能跟随自身": `Daily quantities must be integers from 0 to 100000000. System defaults cannot inherit from themselves.`,
    "比例按直接上级每日数量向下取整。已消费数量不能回收；调组、撤销或修改比例均不清零当日已用。": `Percentages use the direct parent’s daily allowance, rounded down. Used capacity cannot be reclaimed. Group changes, revocation and percentage edits never reset today’s usage.`,
    "没有可重试的失败项；待核实项正在查询实际结果": `There are no failed items to retry. Unconfirmed items are being verified.`,
    "生成预览中…": `Preparing preview…`,
    生效区间: `Effective range`,
    确认执行调整: `Confirm and run update`,
    系统配置需要提供全部档位默认区间: `System settings must include default ranges for every tier`,
    系统默认: `System default`,
    组内共享剩余: `Group shared balance`,
    "范围覆盖当前筛选的全部分页，执行前会固定账号清单及具体值。": `Includes every page matching the current filters. The account list and assigned values are fixed before execution.`,
    补充兜底: `Fallback`,
    请先勾选要调整的账号: `Select the accounts to update first`,
    请先执行预览任务: `Run the preview task first`,
    请先明确上级数量: `Set a finite parent limit first`,
    请同时填写优先级区间上下限: `Provide both priority bounds`,
    请填写CC上号配置: `Provide CC intake settings`,
    请填写完整的CC上号配置: `Provide complete CC intake settings`,
    请指定供应商查看上号额度: `Select a supplier to view intake allowances`,
    请求内容过大: `Request body is too large`,
    请求参数嵌套过深: `Request parameters are nested too deeply`,
    请选择已勾选账号或当前筛选全部账号: `Choose selected accounts or all accounts matching the current filters`,
    请选择成员: `Select a member`,
    "调整结果尚未确认，后台将继续核实": `The update is unconfirmed. Background verification will continue.`,
    调整范围: `Update scope`,
    账号已移除或正在退出: `The account is removed or draining`,
    账期优先: `Payment-term priority`,
    资源不存在或不可访问: `Resource does not exist or is inaccessible`,
    资源尚未成功绑定CCMAX账号: `Resource is not successfully linked to a CCMAX account`,
    资源已删除: `Resource has been deleted`,
    资源的CCMAX账号关联已变化: `The resource’s CCMAX account link has changed`,
    "资源范围不正确或超过50000个，请缩小筛选范围": `Invalid selection or more than 50000 resources. Narrow the filters.`,
    "超出{0}个": `{0} over the limit`,
    跟随上级: `Inherit from parent`,
    跟随系统: `Inherit system default`,
    返回调整: `Back to update`,
    选择成员: `Select member`,
    "选择成员查看或覆盖其档位配置；成员和供应商前端均不可读取这些信息。": `Select a member to view or override tier settings. Members and supplier interfaces cannot read this information.`,
    "配置已变化，请刷新后再保存": `Settings have changed. Reload before saving.`,
    配置方式: `Configuration`,
    重点合作: `Key partner`,
    限制数量: `Set a limit`,
    非PRO: `Non-PRO`,
    "预览数据仍在查询，请稍后再执行": `Preview data is still loading. Wait before executing.`,
    预览调整: `Preview update`,
    额度划拨配置不正确: `Invalid allowance allocation settings`,
    额度来源: `Allowance source`,
    额度分配: `Allowance allocation`,
    修改CC上号规则: `Update CC intake rules`,
    分配CC上号额度: `Allocate CC intake allowances`,
    记录CC上号成功: `Record successful CC intake`,
    补识别CC上号套餐: `Identify CC intake plan`,
    CC上号额度拦截: `CC intake allowance rejection`,
    创建优先级调整预览: `Create priority update preview`,
    执行优先级调整: `Run priority update`,
    重试优先级失败项: `Retry failed priority updates`,
    自动分配账号优先级: `Assign account priority automatically`,
    记录优先级调整结果: `Record priority update result`,
    CC上号配置: `CC intake settings`,
    优先级调整任务: `Priority update task`,
    优先级调整明细: `Priority update item`,
    上号拦截原因不正确: `Invalid intake rejection reason`,
    查询今日上号额度: `Get today’s intake allowances`,
    "返回API密钥绑定账号的北京时间当日成功总数、PRO／非PRO／未识别数量、处理中数量和实际额度来源的余额。数量不随资源筛选变化；不返回优先级信息。": `Returns successful intake totals, PRO/non-PRO/unidentified counts, processing counts and the actual allowance balance for the API key owner, using the Beijing calendar day. Resource filters do not affect these counts. Priority information is excluded.`,
    "PRO满额只关闭PRO接收；非PRO满额停止新增。优先级、档位、区间、canPro及额度来源由服务端计算，上号请求携带这些参数会被拒绝。": `A full PRO allowance closes PRO intake only. A full non-PRO allowance stops new intake. Priority, tiers, ranges, canPro and allowance sources are server-controlled; intake requests containing these fields are rejected.`,
    "成功日期，按北京时间划分。": `Success date in Beijing time.`,
    "当日成功总数，等于PRO、非PRO和套餐未识别数量之和。": `Daily successful total: PRO plus non-PRO plus unidentified plans.`,
    "当日成功识别为PRO的新增数量。": `Successful new accounts identified as PRO today.`,
    "当日成功识别为非PRO的新增数量。": `Successful new accounts identified as non-PRO today.`,
    "已成功但套餐未识别的数量，后续补入原成功日期。": `Successful accounts with unidentified plans; later classification is attributed to the original success date.`,
    "处理中及结果待核实的请求数量。": `Number of processing or unconfirmed intake requests.`,
    "当前账号实际PRO额度来源的上限、已用与剩余；null上限表示不限。": `Limit, usage and balance of the account’s actual PRO allowance source. A null limit means unlimited.`,
    "当前账号实际非PRO额度来源的上限、已用与剩余；null上限表示不限。": `Limit, usage and balance of the account’s actual non-PRO allowance source. A null limit means unlimited.`,
    "服务端计算的PRO接收状态，仅可读取，不能作为上号请求参数提交。": `Server-calculated PRO intake status. Read only; do not submit it in intake requests.`,
    "当前额度来源是否接收新上号。": `Whether the current allowance source accepts new accounts.`,
    "回收交付组额度前，请先回收或调整组内个人划拨。": `Reclaim or adjust individual reservations before reclaiming the delivery group allowance.`,
    "今日个人额度已回收，次日使用共享额度": `Your personal allowance has been reclaimed today. Shared access resumes tomorrow.`,
    "只回收未用额度；当日已用个人不再自动转入共享池": `Only unused allowances are reclaimed. Members who used a personal reservation today do not automatically move to a shared pool.`,
    "比例按直接上级每日数量向下取整。只回收未用额度；当日已用个人不再自动转入共享池。调组、撤销或修改比例均不清零当日已用。": `Percentages use the direct parent’s daily allowance, rounded down. Only unused capacity can be reclaimed; members who used a personal reservation today do not automatically move to a shared pool. Group changes, revocation and percentage edits never reset today’s usage.`,
    "列表总条数；上号额度接口中为当日PRO、非PRO与未识别成功数量之和。": `List result count; for intake allowances, the daily sum of successful PRO, non-PRO and unidentified accounts.`,
    "该上号计数已核对，请刷新列表": `This intake count has already been reconciled. Refresh the list.`,
    请选择核对结果并填写不超过500字的核对依据: `Choose a reconciliation outcome and provide supporting notes of up to 500 characters.`,
    "资源创建结果尚未确认，不能核对新增计数": `The resource creation result is unconfirmed. Its new-account count cannot be reconciled yet.`,
    核对上号计数: `Reconcile intake counts`,
    "仅列出已成功创建、但新增或重复归属仍有歧义的账号。核对只修正计数，不重新上号。": `Shows successfully created accounts whose new or duplicate status is uncertain. Reconciliation updates counts without creating accounts again.`,
    核对计数供应商: `Supplier for count reconciliation`,
    确认成功时间: `Confirmed success time`,
    上号计数已核对: `Intake count reconciled`,
    "核对：{0}": `Reconcile: {0}`,
    请选择核对结果: `Select an outcome`,
    确认本次新增: `Confirm as newly created`,
    确认为已有账号: `Confirm as existing account`,
    核对依据: `Supporting notes`,
    保存核对结果: `Save reconciliation`,
    上号计数待核对: `Intake count needs reconciliation`,
    跳过重复上号计数: `Skip duplicate intake count`,
    核对上号计数结果: `Reconcile intake count outcome`,
    搜索成员姓名或账号: `Search member name or account`,
    按交付组筛选成员: `Filter members by delivery group`,
    全部交付组: `All delivery groups`,
    仅看已划拨成员: `Show allocated members only`,
    "显示{0}／{1}位成员，筛选与翻页不会丢失已填配置。": `Showing {0} of {1} members. Filtering and pagination preserve unsaved changes.`,
    核对此账号: `Reconcile account`,
    暂无匹配成员: `No matching members`,
    当前接口不接受查询参数: `This endpoint does not accept query parameters.`,
    "该账号已有成功计数，请按已有账号核对": `This account already has a successful intake count. Reconcile it as an existing account.`,
    "已有更新的平台优先级操作，原任务已跳过": `A newer platform priority operation exists. The original task was skipped.`,
    "接收状态同时受平台开关、品类资格与当前额度约束；非PRO满额后停止全部新增上号。": `Intake status also depends on platform switches, category eligibility and available allowances. A full non-PRO allowance stops all new intake.`,
    原交付组: `Original delivery group`,
    "原额度来源：{0}": `Original allowance source: {0}`,
    "共享剩余已扣除下级未用预留，不能直接用总上限减已用数计算。": `Shared balances already exclude unused reservations for child groups or members; they are not simply the daily limit minus usage.`,
    跳过自动优先级分配: `Skip automatic priority assignment`,
    接收资源上报: `Receive resource submission`,
    批量接收资源上报: `Receive resource submissions in bulk`,
    分配上报资源项目: `Assign a project to a submitted resource`,
    调整项目资源接入类型: `Update project resource intake types`,
    拦截资源上报重放冲突: `Block conflicting resource submission replay`,
    拦截资源凭据冲突: `Block conflicting resource credentials`,
    调整团队成员所属分组: `Move team members between groups`,
    预留付款通道费用: `Reserve payment provider costs`,
    创建日账导出任务: `Create daily bill export`,
    完成日账导出任务: `Complete daily bill export`,
    日账导出任务失败: `Daily bill export failed`,
    取消日账导出任务: `Cancel daily bill export`,
    下载日账导出文件: `Download daily bill export files`,
    "调整 CCMAX 查询并发设置": `Update CCMAX query concurrency settings`,
    调整账号启用状态: `Change account enabled status`,
    "创建账号 API 密钥": `Create account API key`,
    "重置账号 API 密钥": `Reset account API key`,
    "查看账号 API 密钥明文": `Reveal account API key`,
    "撤销账号 API 密钥": `Revoke account API key`,
    手动同步资源状态: `Manually synchronize resource status`,
    手动同步资源状态与消耗: `Manually synchronize resource status and consumption`,
    重建资源状态投影: `Rebuild resource status projections`,
    准备供应商交付授权: `Prepare supplier delivery authorization`,
    取消供应商交付: `Cancel supplier delivery`,
    调整定时任务执行周期: `Update scheduled task interval`,
    修改工作台企微提醒设置: `Update dashboard WeCom reminder settings`,
    "账号 API 密钥": `Account API key`,
    团队分组: `Team group`,
    资源接入回执: `Resource intake receipt`,
    上报资源: `Submitted resource`,
    资源状态投影: `Resource status projection`,
    资源授权会话: `Resource authorization session`,
    代理更换任务: `Proxy replacement job`,
    修改供应商平台配置: `Update supplier platform settings`,
    供应商名称: `Supplier name`,
    供应商注册需要审核: `Require supplier registration review`,
    修改前: `Before change`,
    修改后: `After change`,
    变更内容: `Changed fields`,
    允许同一账号审核: `Allow review by the same account`,
    "允许该供应商 PRO 上号": `Allow PRO delivery for this supplier`,
    "全部供应商允许 PRO 上号": `Allow PRO delivery for all suppliers`,
    初始密码前缀: `Initial password prefix`,
    初始密码格式: `Initial password format`,
    密码最短长度: `Minimum password length`,
    密码最长长度: `Maximum password length`,
    报价倍率上限: `Maximum quote multiplier`,
    报价倍率下限: `Minimum quote multiplier`,
    新代理默认绑定数量: `Default resource limit for new proxies`,
    未记录: `Not recorded`,
    未设置: `Not set`,
    登录失败次数上限: `Maximum failed login attempts`,
    "登录锁定时长（分钟）": `Login lock duration (minutes)`,
    空值: `Empty value`,
    自定义结算天数: `Custom settlement cycle (days)`,
    要求大写字母: `Require uppercase letters`,
    要求小写字母: `Require lowercase letters`,
    要求数字: `Require digits`,
    要求特殊字符: `Require special characters`,
    首次登录强制改密: `Require password change at first login`,
    查看完整变更快照: `View complete change snapshots`,
    填写或选择代理: `Enter or select a proxy`,
    "proxyId 可直接填写代理地址，也可填写代理列表中的 id；代理须启用且仍有容量。": `Set proxyId to a proxy address or an id from the proxy list. The proxy must be enabled and have capacity.`,
    "代理按当前账号范围查询和导入。proxyId 也可直接填写代理地址，自动保存或复用本人代理，无需单独导入或预检。": `Proxies are scoped to the caller. Set proxyId directly to a proxy address to save or reuse your own proxy, without a separate import or preflight.`,
    "必填，可填已有代理 id 或 SOCKS5 / HTTP / HTTPS 地址；也支持 host:port、host:port:username:password（默认 SOCKS5）。直填地址还需 proxy.read + proxy.write 权限。": `Required: an existing proxy id or a SOCKS5 / HTTP / HTTPS address. Also accepts host:port or host:port:username:password (SOCKS5 by default). An address additionally requires proxy.read + proxy.write.`,
    "强制停止 CCMAX 新增上号": `Force-stop new CCMAX account intake`,
    "优先于全局允许和供应商配置，仅停止新增上号；已有资源查询、同步和重新授权不受影响。": `Overrides global and supplier permissions for new intake only. Existing resource queries, synchronization and reauthorization remain available.`,
    "平台已暂停 CCMAX 新增上号，请稍后再试或联系平台管理员。": `The platform has paused new CCMAX account intake. Try again later or contact a platform administrator.`,
    "平台已暂停 CCMAX 新增上号，请稍后再试或联系平台管理员。已有资源查询、同步和重新授权不受影响。": `The platform has paused new CCMAX account intake. Try again later or contact a platform administrator. Existing resource queries, synchronization and reauthorization remain available.`,
    "平台已强制停止 CCMAX 新增上号；该供应商当前停收，已保存的允许配置保持不变。": `New CCMAX account intake is stopped platform-wide. This supplier is not accepting new accounts; saved permission settings are unchanged.`,
    "跟随上级（{0}）": `Inherit from parent ({0})`,
    "未单独设置时使用所选档位的上级默认区间；可按档位自定义，上下限相同即固定值。新配置用于后续上号，历史账号通过批量调整执行。": `Each tier inherits its parent default range unless overridden. Customize ranges by tier; equal bounds produce a fixed value. New rules apply to future intake. Use bulk updates for existing accounts.`,
    "统一开通供应商上号资格，仍受强制停止、项目权限及每日额度限制；关闭后按各供应商配置判断。": `Grants intake eligibility to all suppliers, subject to the force-stop switch, project permissions and daily limits. When off, each supplier’s settings apply.`,
    "允许小组上 PRO": `Allow PRO account creation for this group`,
    "仍受平台 PRO 资格与每日额度限制。": `Platform PRO eligibility and daily limits still apply.`,
    PRO允许: `PRO allowed`,
    PRO停收: `PRO closed`,
    "允许 PRO 上号": `Allow PRO account creation`,
    "允许{0}上 PRO": `Allow PRO intake for {0}`,
    共享剩余: `Shared remaining`,
    "留空共享，0%不分配。": `Leave blank to share; 0% reserves zero.`,
    "比例划拨需先由平台设置每日数量。": `The platform must set daily quantities before percentage allocation.`,
    "关闭 PRO 不影响非PRO，保留原额度配置。": `Turning PRO off keeps non-PRO and saved allowances available.`,
    "允许 PRO": `Allow PRO`,
    暂无交付组: `No delivery groups`,
    "{0}位成员": `{0} members`,
    "显示{0}／{1}位成员": `Showing {0} of {1} members`,
    "回收仅释放未用额度，当日已用保留。": `Reclaim releases unused capacity; today’s usage is retained.`,
    "进入「我的报价」，点击「新增报价行」并选择项目。": `Open My Quotes, click Add Quote Row, and select a project.`,
    "按项目填写倍率或单价、服务量级说明和适用期间。": `Enter the project multiplier or unit price, service capacity, and effective dates.`,
    "提交该行报价，等待平台审核；通过且在有效期内后即可交付。": `Submit the quote for review. Once approved and effective, you can deliver resources.`,
    "进入「报价管理」，筛选待审核报价并打开详情。": `Open Quote Management, filter pending quotes, and open a quote.`,
    "核对供应商、项目、倍率或单价、服务量级和适用期间。": `Check the supplier, project, multiplier or unit price, service capacity, and effective dates.`,
    "有审核权限时通过或退回报价；退回时填写原因，供供应商修改。": `With review permission, approve or reject the quote. Give a reason when rejecting it so the supplier can revise it.`,
    "项目暂不可交付时，先检查报价是否已通过且生效。": `If a project is unavailable for delivery, check that its quote is approved and effective.`,
    "报价审核通过后，供应商才能在有效期间内交付对应项目。": `Suppliers can deliver after a quote is approved and within its effective dates.`,
    去报价: `Submit a quote`,
    查看报价: `View quotes`,
    "先由供应商主账号或本组管理员分配项目，再进入「我的交付」。": `Ask the supplier account owner or your group administrator to assign a project, then open My Deliveries.`,
    "报价审核生效后，进入「我的交付」，点击「新增交付」。": `Once the quote is approved and effective, open My Deliveries and click New Delivery.`,
    "进入「资源管理」，按供应商、项目或账号查询交付资源。": `Open Resource Management and search deliveries by supplier, project, or account.`,
    "点击资源行打开详情，核对交付结果、代理和账号状态。": `Click a resource row to check its delivery result, proxy, and account status.`,
    "需要更新状态或消耗时，使用有权限的同步操作，再查看实际结果。": `To update status or usage, use the sync action available to your account and check the result.`,
    "资源消耗与付款进度分别查看，交付成功不代表已完成结算。": `Usage and payment progress are tracked separately. A successful delivery does not mean settlement is complete.`,
    去交付: `Deliver resources`,
    查看交付: `View deliveries`,
    查看资源: `View resources`,
    "进入「收款管理 → 日账」，按日期查询每日消耗。": `Open Receivables → Daily Bills and filter by date to check daily usage.`,
    "小组管理员可查看本组成员的消耗，并按成员筛选。": `Group administrators can view usage for their group and filter by member.`,
    "普通团队成员仅可查看本人交付资源产生的消耗。": `Team members can view usage from their own delivered resources.`,
    "点击账单查看明细，核对对应资源和日期。": `Open a bill to check its resource and date details.`,
    "进入「收款管理 → 日账」，按日期、项目或资源核对消耗与应收。": `Open Receivables → Daily Bills and check usage and receivables by date, project, or resource.`,
    "平台发起结算后，在「金额确认」中核对结算明细并确认金额。": `After the platform creates a statement, check its details and confirm the amount under Amount Confirmation.`,
    "在「收款记录」查看付款进度，实际收到款项后再确认到账。": `Check payment progress under Receipt Records. Confirm receipt only after the funds arrive.`,
    "进入「账务管理 → 日账」，按供应商和日期核对消耗与应付。": `Open Accounting → Daily Bills and check usage and payables by supplier and date.`,
    "在「结算单」发起结算，等待供应商核对并确认金额。": `Create a settlement under Statements and wait for the supplier to check and confirm the amount.`,
    "金额确认后按权限申请付款，在「付款记录」查看后续进度。": `After amount confirmation, request payment if permitted and track progress under Payment Records.`,
    "团队日账只展示消耗；应收、结算和收款由供应商主账号处理。": `Team bills show usage only. The supplier account owner handles receivables, settlement, and receipts.`,
    "金额确认在付款前完成，到账确认在实际收到款项后完成。": `Confirm the amount before payment. Confirm receipt after the funds arrive.`,
    操作指引: `Operation guide`,
    "按步骤完成报价、交付与对账": `Follow the steps for quotes, delivery, and billing`,
    "选择项目并填写账号凭据；交付 CCMAX 账号时还需选择代理并完成授权。": `Select a project and enter the account credentials. CCMAX accounts also require a proxy and authorization.`,
    "检查信息并提交，在列表中查看交付结果和失败说明。": `Check the details and submit. Find the delivery result and any failure details in the list.`,
    "保存草稿不算交付；CCMAX 正式提交前需有可用代理和有效报价。": `Saving a draft does not deliver the resource. CCMAX submission requires an available proxy and an effective quote.`,
    "进入「我的交付」，按项目或账号查询已交付资源。": `Open My Deliveries and search delivered resources by project or account.`,
    交付资源: `Deliver resources`,
    查看账单: `View bills`,
    隐藏操作指引: `Hide operation guide`,
    显示操作指引: `Show operation guide`,
    全选本页: `Select this page`,
    "标记已读（{0}）": `Mark as read ({0})`,
    "选择消息：{0}": `Select message: {0}`,
    暂无未读进展: `No unread updates`,
    "已将 {0} 条消息标记为已读": `Marked {0} messages as read`,
    "已标记 {0} 条，{1} 条未成功，请重试。": `Marked {0} as read. {1} could not be updated; please try again.`,
    "已将 {0} 条消息标记为已读|one": `Marked {0} message as read`,
    允许: `Allow`,
    已关闭: `Off`,
    回收额度: `Reclaim`,
    "{0}：回收未用额度": `{0}: reclaim unused capacity`,
    初始化历史上号计数: `Initialize historical intake counts`,
    完成历史上号计数初始化: `Complete historical intake count initialization`,
    "交付组PRO配置不正确，请刷新后重试": `Invalid delivery group PRO settings. Refresh and try again.`,
    每供应商同时上号数: `Concurrent account intake per supplier`,
    "保存后立即生效，在途请求继续完成。": `Saved changes apply immediately. In-flight requests continue to completion.`,
    每供应商同时上号数须为1至1000的整数: `Concurrent account intake per supplier must be an integer from 1 to 1000.`,
    "当前供应商同时上号数已达上限（{0}个），请稍后重试": `This supplier has reached the concurrent intake limit ({0}). Try again shortly.`,
    每供应商并发上号上限须为1至1000的整数: `Concurrent account intake per supplier must be an integer from 1 to 1000.`,
    "并发上限未保存：Redis配置同步失败，请稍后重试": `The concurrency limit was not saved because Redis configuration synchronization failed. Try again shortly.`,
    请选择一种调整范围: `Select exactly one adjustment scope`,
    指定优先级不能同时填写区间: `Enter either a fixed priority or a range`,
    请输入要设置的优先级: `Enter the priority to apply`,
    优先级须为0至1000的整数: `Priority must be an integer from 0 to 1000`,
    "调整范围为空或超出数量、长度限制": `The scope is empty or exceeds the count or length limit`,
    "部分Lane ID未匹配到已有CCMAX账号，请核对后重试": `Some Lane IDs do not match existing CCMAX accounts. Check the IDs and try again`,
    "Lane ID匹配多个账号或目标实例，请按供应商或勾选账号调整": `A Lane ID matches multiple accounts or target instances. Select suppliers or accounts instead`,
    请至少选择一个供应商: `Select at least one supplier`,
    "请输入1至5000个Lane ID": `Enter between 1 and 5000 Lane IDs`,
    按供应商: `By supplier`,
    "按 Lane ID": `By Lane ID`,
    设置优先级: `Set priority`,
    请输入0至1000的整数: `Enter an integer from 0 to 1000`,
    "搜索并选择供应商（可多选）": `Search and select suppliers (multiple allowed)`,
    "移除供应商{0}": `Remove supplier {0}`,
    "调整所选供应商的全部已有CCMAX账号，不受列表筛选和分页限制。": `Include all existing CCMAX accounts of the selected suppliers, across all pages and independent of list filters.`,
    "粘贴 Lane ID，支持换行、逗号或空格分隔": `Paste Lane IDs separated by newlines, commas or spaces`,
    "已输入{0}个Lane ID，重复项自动合并；最多5000个。": `{0} Lane IDs entered. Duplicates are merged; maximum 5000.`,
    "将范围内的账号统一设置为输入的优先级，预览后确认执行。": `Set every account in the scope to the entered priority. Review the preview before confirming.`,
    "请选择可调整的资源状态，已移除和退出中的账号不参与调整": `Select an adjustable resource status. Removed or draining accounts are excluded`,
    当前范围没有符合状态条件的可调整账号: `No adjustable accounts match the selected scope and status`,
    整理账号范围中: `Preparing local account list`,
    全部可调整状态: `All adjustable statuses`,
    "已移除（不参与调整）": `Removed (excluded)`,
    "退出中（不参与调整）": `Draining (excluded)`,
    "按本地已保存状态筛选，已移除和退出中的账号自动排除。": `Filter by locally saved status. Removed and draining accounts are automatically excluded.`,
    "直接提交优先级更新，不会预先查询原值。": `Submit the priority update directly, without first querying previous values.`,
    "调整会清除所选账号的临时优先级提升。": `Updating clears temporary priority boosts for the selected accounts.`,
    提交调整: `Submit update`,
    "正在整理旧任务的本地账号范围，不会查询原优先级。": `Preparing the local account list for an older task, without querying previous priorities.`,
    "此任务尚未提交执行，账号范围与调整值已固定，可确认执行。": `This task has not started. Its account scope and values are fixed; confirm to run it.`,
    部门账单: `Department bills`,
    账单部门: `Bill department`,
    全部部门: `All departments`,
    搜索部门: `Search departments`,
    部门汇总: `Department summary`,
    部门汇总方式: `Department grouping`,
    按日显示: `By date`,
    期间汇总: `Period total`,
    账务期间: `Billing period`,
    账单成员: `Contributing members`,
    "主账号／历史未归属": `Primary account / unassigned history`,
    查看成员账单: `View member bills`,
    "按成员当前部门归集，币种分别统计": `Grouped by current department, with currencies kept separate`,
    "部门账单按成员当前所属部门汇总；调整部门后，历史日账随当前归属展示。已入账应收沿用原账单金额。": `Bills are grouped by members’ current departments. Moving a member changes how their past bills are grouped; recorded receivables remain unchanged.`,
    仅供应商主账号或部门管理员可查看部门账单: `Only supplier primary accounts and department administrators can view department bills`,
    无权查看此部门账单: `You do not have access to this department’s bills`,
    "部门账单按成员当前所属部门汇总；调整部门后，历史日账随当前归属展示。": `Bills are grouped by members’ current departments. Moving a member changes how their past bills are grouped.`,
    返回部门汇总: `All departments`,
    账单汇总方式: `Bill grouping`,
    成员账单: `Member bills`,
    账单口径与说明: `About these bills`,
    "金额按币种精度展示，悬停可查看完整数值；币种分别统计。": `Amounts use the currency’s display precision. Hover for the full value. Currencies are kept separate.`,
    "{0} 位账单成员": `{0} contributing members`,
    "{0} 位账单成员|one": `{0} contributing member`,
    查看成员: `View members`,
    "上号单次超时（秒）": `Account creation timeout (seconds)`,
    "默认120秒，可设1–300秒；保存后新提交生效，在途请求继续使用原值。": `Default: 120 seconds. Range: 1–300 seconds. Changes apply to new submissions; requests in progress keep their original timeout.`,
    上号单次超时须为1至300的整数秒: `Account creation timeout must be an integer from 1 to 300 seconds.`,
    "上号超时未保存：Redis配置同步失败，请稍后重试": `Account creation timeout was not saved because configuration synchronization failed. Please try again.`,
    历史未结算金额: `Historical unsettled amount`,
    "全部历史已入账、尚未生成结算单的金额": `All posted amounts not yet included in a settlement`,
    "导出结算单 {0}": `Export settlement {0}`,
    "导出中…": `Exporting…`,
    "导出失败，请重试": `Export failed. Please try again.`,
    导出: `Export`,
    打开导航: `Open navigation`,
    关闭导航: `Close navigation`,
    查看结果: `View results`,
    筛选: `Filters`,
    "汇总更新中，将自动刷新": `The summary is updating and will refresh automatically`,
    "导出当前筛选下的全部结算单，包含所有分页": `Export all statements matching the current filters, across all pages`,
    导出筛选结果: `Export filtered results`,
    "批量导出已选（{0}）": `Export selected ({0})`,
    选择本页结算单: `Select statements on this page`,
    "选择结算单 {0}": `Select statement {0}`,
    结算单已导出: `Statements exported`,
    "单次最多导出10000张结算单，请缩小筛选范围": `Export up to 10,000 statements at a time. Narrow your filters.`,
    没有可导出的结算单: `No statements to export`,
    "部分结算单已不在当前筛选或权限范围内，请刷新后重新选择": `Some statements are outside the current filters or your access. Refresh and select again.`,
    批量导出结算单: `Batch export statements`,
    已生成的日账静态汇总: `Generated daily bill summaries`,
    "按已生成的日账汇总金额结算，正式生成后冻结本单金额。": `Settle using generated daily bill totals. The statement amounts are frozen when created.`,
    以本单冻结的日账静态汇总金额确认: `Confirm the frozen daily bill totals on this statement`,
    "日账静态汇总正在更新，请等待生成完成后重新预览": `Daily bill summaries are updating. Wait for completion, then preview again.`,
    没有已生成且可结算的日账汇总: `No generated daily bill summaries are available for settlement`,
    "日账来源占用已变化，请刷新后重新预览": `Daily bill allocations changed. Refresh and preview again.`,
    "日账金额已变化，请等待汇总更新后重新预览": `Daily bill amounts changed. Wait for summaries to update, then preview again.`,
    "日账尚有待处理金额，请先处理后重新生成汇总": `Some daily bill amounts need attention. Resolve them and regenerate the summaries.`,
    请先预览日账汇总后再生成结算单: `Preview the daily bill summaries before creating a statement`,
    日账汇总结算不接受逐条来源选择: `Daily summary settlement does not accept individual source selections`,
    结算依据类型无效: `Invalid settlement basis`,
    当前环境尚未启用日账静态汇总: `Daily bill summaries are not enabled in this environment`,
    结算单操作: `Settlement actions`,
    付款说明与凭证: `Payment notes and evidence`,
    付款说明: `Payment notes`,
    付款说明格式: `Payment note formatting`,
    "填写付款说明，可直接粘贴图片或将文件拖到这里": `Enter payment notes, paste images, or drag files here`,
    "支持拖入文件、粘贴图片；PDF / PNG / JPG，单个最多10 MB，最多10个附件": `Drag files or paste images. PDF / PNG / JPG, up to 10 MB each and 10 attachments.`,
    添加文件: `Add files`,
    添加付款凭证文件: `Add payment evidence files`,
    "移除附件 {0}": `Remove attachment {0}`,
    加粗: `Bold`,
    斜体: `Italic`,
    下划线: `Underline`,
    无序列表: `Bullet list`,
    有序列表: `Numbered list`,
    最多添加10个付款凭证附件: `Add up to 10 payment evidence attachments`,
    "付款凭证大小须在1 B至10 MB之间": `Each payment evidence file must be between 1 B and 10 MB`,
    "仅支持PDF、PNG、JPG付款凭证": `Payment evidence supports PDF, PNG and JPG files`,
    "付款说明过长，最多10000字": `Payment notes may contain up to 10,000 characters`,
    付款说明格式不正确: `Invalid payment note format`,
    付款说明内容过长或层级过多: `Payment notes are too long or deeply nested`,
    付款说明包含不支持的格式: `Payment notes contain unsupported formatting`,
    "付款凭证须包含1至10个不同附件，首个附件须与主凭证一致": `Provide 1 to 10 distinct attachments, with the primary evidence first`,
    已登记的付款说明和凭证不能修改: `Recorded payment notes and evidence cannot be changed`,
    付款时间: `Payment time`,
    CCMAX优先级扶持: `CCMAX priority support`,
    业务规则: `Business rule`,
    按比例轮换扶持: `Rotate support by account percentage`,
    "执行周期（分钟）": `Run interval (minutes)`,
    "扶持账号比例（%）": `Ready accounts to support (%)`,
    每家最多扶持账号数: `Maximum accounts per supplier`,
    每家最多扶持账号数须为1至50000的整数: `Maximum accounts per supplier must be an integer from 1 to 50,000`,
    目标优先级: `Target priority`,
    扶持记录: `Support history`,
    返回配置: `Back to configuration`,
    "扶持配置已保存，下一轮执行生效": `Support settings saved for the next run`,
    已重新提交失败的恢复项: `Failed restoration items resubmitted`,
    "恢复失败时不会继续叠加扶持。处理异常后可重试。": `Further support is paused for suppliers whose restoration failed. Resolve the error and retry.`,
    重试恢复: `Retry restoration`,
    "恢复失败，已暂停该供应商扶持": `Restoration failed; supplier support paused`,
    正在扶持: `Applying support`,
    扶持中: `Supported`,
    正在恢复: `Restoring`,
    已结束: `Finished`,
    已进入下一轮: `Next round started`,
    扶持账号: `Supported accounts`,
    恢复账号: `Restored accounts`,
    "扶持比例须在0.01%至100%之间，最多两位小数": `Support percentage must be between 0.01% and 100%, with up to two decimal places`,
    所选供应商的可用账号: `Ready accounts of selected suppliers`,
    "无消费扶持或按比例轮换，规则与周期可配置": `No-spending support or percentage rotation, with configurable rules and intervals`,
    "规则检查完成，账号结果见扶持记录": `Rule evaluation completed; see support history for account results`,
    "显示最近10轮，账号数量为成功数 / 总数。每轮恢复扶持前的优先级，期间的人工修改也会覆盖。": `The latest 10 rounds. Account counts show succeeded / total. Restoration uses the priority before support and overrides intervening manual changes.`,
    "每轮先恢复上一批，再按比例选择下一批可用账号；优先选择尚未扶持的账号。": `Restore the previous batch before selecting the next percentage of ready accounts, prioritizing accounts not yet supported.`,
    "仅选择就绪账号。每家数量＝就绪数×比例向上取整，且不超过数量上限。每轮先恢复上一轮的原优先级，停用也会恢复。": `Select ready accounts only. Per-supplier count is ready accounts × percentage, rounded up and capped by the maximum. Restore original priorities each round and when disabled.`,
    "请先配置供应商、扶持比例和目标优先级": `Configure suppliers, support percentage and target priority first`,
    请选择1至100个供应商: `Select 1 to 100 suppliers`,
    请选择优先级扶持规则: `Select a priority support rule`,
    请填写完整的优先级扶持配置: `Complete the priority support settings`,
    "扶持配置已变化，请刷新重试": `Support settings changed. Refresh and retry.`,
    "部分供应商不存在，请重新选择": `Some suppliers no longer exist. Select them again.`,
    "原优先级尚未确认，本轮未调整": `Original priority was not confirmed; no update was sent this round`,
    "供应商消费或账号可用状态已变化，本轮不再扶持": `Supplier spending or account readiness changed; support was skipped this round`,
    "无法核实当前优先级，本轮未调整": `Current priority could not be verified; no update was sent this round`,
    "扶持任务请在定时任务配置中重试恢复，不能重放历史扶持": `Retry restoration in scheduled-task settings. Historical support cannot be replayed.`,
    创建优先级扶持任务: `Create priority support task`,
    创建扶持任务: `Create support task`,
    供应商范围: `Supplier scope`,
    按供应商优先级档位: `By supplier priority tier`,
    供应商优先级档位: `Supplier priority tiers`,
    "执行时按供应商当前生效档位筛选，包含继承系统档位的供应商。": `Resolve suppliers by their effective priority tier when the task runs, including inherited system tiers.`,
    指定供应商或档位范围的就绪账号: `Ready accounts within the selected suppliers or priority tiers`,
    请至少选择一个供应商优先级档位: `Select at least one supplier priority tier`,
    请选择供应商范围: `Select a supplier scope`,
    请填写供应商范围: `Complete the supplier scope`,
    创建任务: `Create task`,
    编辑任务: `Edit task`,
    请选择任务类型: `Select a task type`,
    "管理定时任务，创建后可独立配置和启停。": `Manage scheduled tasks with independent settings and enable controls.`,
    每个任务独立配置运行周期和执行范围: `Configure the interval and scope for each task.`,
    修改优先级扶持任务: `Update priority support task`,
    重试扶持优先级恢复: `Retry priority restoration`,
    创建优先级扶持轮次: `Stage priority support round`,
    "配置已变化，本轮跳过并等待下一周期": `Configuration changed; this run was skipped until the next cycle`,
    供应商无消费扶持: `Support suppliers with no spending change`,
    "按配置的执行周期比较供应商前后两次成功采集的账单总额；无变化才扶持。有变化时仅恢复上一轮，等待下个周期。": `Compare supplier billing totals across the configured run interval. Support suppliers with unchanged totals; changed totals only trigger restoration until the next cycle.`,
    "无消费判断窗口跟随执行周期。账单未更新、采集失败或跨日时等待新的有效采集结果。": `The no-spending window follows the run interval. Wait for new valid billing data if collection has not updated, failed, or crossed into a new day.`,
    "已选择{0}项": `{0} selected`,
    全选当前结果: `Select all results`,
    清空已选: `Clear selection`,
    "可连续勾选或全选当前搜索结果，最多选择100个供应商。": `Select suppliers individually or select all current search results, up to 100 suppliers.`,
    CCMAX资源分析: `CCMAX resource analysis`,
    报表中心子菜单: `Report center submenu`,
    应付应收分析: `Payables and receivables`,
    分析供应商: `Analysis supplier`,
    单次资源分析范围不能超过366天: `A resource analysis can cover up to 366 days.`,
    每日创建趋势: `Daily creation trend`,
    "每日创建趋势，选择日期可查看明细": `Daily creations. Select a date to view details.`,
    "{0}，创建 {1} 个资源": `{0}: {1} resources created`,
    创建成功: `Successfully created`,
    有创建记录的天数: `Days with creations`,
    当前就绪: `Ready now`,
    按套餐类型: `By plan`,
    按当前状态: `By current status`,
    套餐类型分布: `Plan distribution`,
    当前状态分布: `Current status distribution`,
    每日类型与状态明细: `Daily plans and statuses`,
    "{0} 创建明细": `Creations on {0}`,
    创建数量: `Creations`,
    查看全部日期: `View all dates`,
    所选范围暂无已记录的创建成功资源: `No recorded successful creations in this range.`,
    "按北京时间的实际创建成功日期统计，重复上号与失败尝试不计入。套餐为创建时记录，状态为最近同步结果；已移除或已删除账号保留创建数量。": `Grouped by the actual successful creation date in Beijing time. Duplicate submissions and failed attempts are excluded. Plans reflect creation; statuses reflect the latest sync. Removed or deleted accounts remain in creation counts.`,
    "点击柱形可查看当天明细，再次点击取消。无创建记录的日期按零显示。": `Select a bar to view that day; select it again to clear. Days without recorded creations show zero.`,
    "仅统计系统已记录的创建成功事件，未记录的早期历史不补造；套餐未提供与状态未知单独展示。": `Only recorded successful creation events are counted. Earlier unrecorded history is not reconstructed. Missing plans and unknown statuses are shown separately.`,
    当前资源情况: `Current resources`,
    每日创建分析: `Daily creations`,
    当前资源供应商: `Current resource supplier`,
    全部创建日期: `All creation dates`,
    "统计当前已成功交付且未逻辑删除的全部CCMAX资源，包含早期资源，不受创建日期限制。品类按最近采集的账号套餐，状态按最近同步结果；已移除单独列示。": `All successfully delivered CCMAX resources that have not been deleted, including earlier resources, regardless of creation date. Plans and statuses use the latest collected data; removed resources are listed separately.`,
    "套餐信息正在后台分批补全，{0} 个资源暂列为套餐未提供。": `Plan data is being filled in background batches. {0} resources are temporarily listed as plan not provided.`,
    当前资源总数: `Current resources`,
    失效或不可用: `Invalid or unavailable`,
    当前没有符合条件的已交付资源: `No delivered resources match these filters`,
    套餐品类与当前状态: `Plans and current statuses`,
    合计覆盖全部筛选结果: `Totals include all filtered results`,
    就绪比例: `Ready rate`,
    暂停: `Pause`,
    批量暂停: `Pause selected`,
    暂停与移除记录: `Pause and removal history`,
    "确认{0}资源": `Confirm resource {0}`,
    "暂停会停止接收新请求，保留凭据并让在途请求完成。当前CCMAX接口未提供解除暂停操作。": `Pausing stops new requests, keeps credentials and lets in-flight requests finish. CCMAX currently provides no API to resume a paused account.`,
    "已选择 {0} 个资源，按CCMAX实例分组执行，每项结果独立记录。": `{0} resources selected. Operations are grouped by CCMAX instance, with a result for each resource.`,
    "确认{0}": `Confirm {0}`,
    等待提交: `Waiting to submit`,
    "共 {0} 个资源": `{0} resources`,
    需要人工核对: `Review required`,
    处理结束: `Finished processing`,
    "已受理安全移除后继续核对至已移除；结果不明时只查询状态，不自动重复提交。关闭窗口后可从操作记录继续查看。": `Accepted removals are checked until released. Unconfirmed operations are verified without automatic resubmission. Continue viewing from history after closing this window.`,
    "核对中…": `Verifying…`,
    重新核对状态: `Verify status again`,
    暂停与安全移除记录: `Pause and safe removal history`,
    资源数量: `Resource count`,
    创建资源暂停或移除操作: `Create resource pause or removal operation`,
    记录资源暂停或移除结果: `Record resource pause or removal result`,
    重新核对资源暂停或移除状态: `Recheck resource pause or removal status`,
    "资源正在暂停或安全移除，请先查看操作记录": `This resource has an unfinished pause or removal operation. Check its history first.`,
    "所选资源已有暂停或安全移除操作，请先查看操作记录": `Selected resources have unfinished pause or removal operations. Check the history first.`,
    "一次请选择1至100条CCMAX资源，并确认操作类型": `Select 1–100 CCMAX resources and a valid action.`,
    资源及版本不完整: `Resource identifiers and versions are required.`,
    "请选择已交付、当前目标已启用的CCMAX资源": `Select delivered CCMAX resources with an enabled target.`,
    "资源已变化、存在未完成操作或账号归属冲突，请刷新后重试": `Resources changed, have unfinished operations or have conflicting ownership. Refresh and try again.`,
    同一提交标识不能用于不同操作: `A request identifier cannot be reused for a different operation.`,
    "操作正在执行，请稍后再核对": `The operation is running. Check again shortly.`,
    "发起账号已失去平台操作权限，未提交CCMAX": `The creator no longer has platform permission. Nothing was submitted to CCMAX.`,
    不可用: `Unavailable`,
    全部日期: `All dates`,
    初始化中: `Provisioning`,
    刷新统计: `Refresh statistics`,
    套餐排序: `Plan order`,
    就绪数量从高到低: `Ready count: high to low`,
    就绪比例从高到低: `Ready rate: high to low`,
    已删除: `Deleted`,
    当前状态: `Current status`,
    搜索日期: `Search dates`,
    明细日期: `Detail date`,
    显示全部状态: `Show all statuses`,
    查看当日明细: `View daily details`,
    筛选条件尚未应用: `Filters not applied`,
    统计口径: `How these statistics are counted`,
    账号套餐: `Account plan`,
    资源总数从高到低: `Resource count: high to low`,
    "CCMAX 资源操作": `CCMAX resource operations`,
    允许该供应商暂停资源: `Allow this supplier to pause resources`,
    "暂停后停止接收新请求，保留凭据并等待在途请求完成。": `Pausing stops new requests, retains credentials, and lets in-flight requests finish.`,
    "释放完成后无法恢复；本地资源和账单历史保留。": `Removal is irreversible once released. Local resources and billing history are retained.`,
    供应商身份不完整: `Supplier identity is incomplete`,
    "当前供应商未开通此资源操作，请联系平台管理员": `This resource operation is not enabled for your supplier. Contact the platform administrator.`,
    "停止接收新请求；保留本地交付记录": `Stops new requests; local delivery history is retained`,
    允许该供应商移除资源: `Allow this supplier to remove resources`,
    "分别开放供应商端的暂停和移除；仅可操作其权限内的已交付资源。": `Enable pause and removal separately for this supplier. Only delivered resources within their access may be operated on.`,
    "已受理移除后继续核对至已移除；结果不明时只查询状态，不自动重复提交。关闭窗口后可从操作记录继续查看。": `Accepted removals are checked until released. Uncertain results are verified without resubmitting. Reopen the records to follow progress.`,
    "已提交{0}，后台处理中，可在操作记录查看": `{0} submitted and running in the background. View progress in the operation records.`,
    批量移除: `Bulk remove`,
    暂停与移除进度: `Pause and removal progress`,
    正在移除: `Removing`,
    批量资源操作仅限有权限的平台账号: `Bulk resource operations require an authorized platform account.`,
    移除后无法恢复: `Removal cannot be undone`,
    "{0} 个资源": `{0} resources`,
    创建日期快捷筛选: `Creation date shortcuts`,
    资源记录总数: `Total resource records`,
    含已移除记录: `Includes removed records`,
    点击状态筛选下方套餐: `Select a status to filter plans below`,
    搜索套餐名称: `Search plan names`,
    筛选合计: `Filtered total`,
    "包含{0}的套餐": `Plans containing {0}`,
    "筛选包含{0}的套餐": `Filter plans containing {0}`,
    供应商每日上号: `Daily creations by supplier`,
    有上号记录的供应商: `Suppliers with creations`,
    统计天数: `Days in range`,
    日均上号: `Daily average`,
    期间合计: `Period total`,
    "每格为当天成功新增数量，合计覆盖全部筛选结果。": `Each cell shows successful new creations for that day. Totals include all filtered rows.`,
    "按北京时间的成功新增日期统计；失败、重试、重新授权和已有账号重复上号不重复计数。已移除或已删除资源保留历史上号数量。": `Counts successful new creations by Beijing date. Failed attempts, retries, reauthorization and repeat deliveries are excluded. Removed and deleted resources retain their historical counts.`,
    "零表示该日没有已记录的成功新增；早期未记录的上号历史不补造。": `Zero means no successful creation was recorded that day. Earlier unrecorded history is not reconstructed.`,
    "全部记录 · 点击筛选套餐": `All records · Select to filter plans`,
    图形: `Chart`,
    表格: `Table`,
    热力图: `Heatmap`,
    按比例: `By share`,
    按数量: `By count`,
    在库就绪率: `In-stock readiness`,
    "在库就绪率 {0}": `{0} of in-stock resources ready`,
    在库资源: `In-stock resources`,
    "已移除 {0}，单独列示": `{0} removed, shown separately`,
    该批次当前就绪: `Currently ready in this cohort`,
    "按最近同步状态统计，在库不含已移除": `Latest synced states; in-stock excludes removed resources`,
    "显示创建批次的最近同步状态，不是历史当日状态快照。": `Latest synced states of each creation cohort, not historical daily snapshots.`,
    "数量比较新增规模，比例比较当前状态构成；点击条形查看精确数量。": `Compare creation volume by count or current state mix by share. Select a bar for exact counts.`,
    所选日期没有已记录的创建成功资源: `No successful creations were recorded for the selected date`,
    "按北京时间的成功记账日期统计：优先使用可信的上游创建时间，缺失时使用首次确认成功时间。重复上号与失败尝试不计入；移除或删除不扣减历史创建数量。": `Counts use the Beijing date of a trusted provider creation timestamp, falling back to first successful confirmation. Repeat deliveries and failed attempts are excluded. Removal and deletion do not reduce historical counts.`,
    "套餐采用创建成功记录（未知套餐可后续补识别），状态采用最近同步结果，不是历史当日快照。早期未记录历史不补造；无记录不代表实际零新增。": `Plans come from creation records; unknown plans may be identified later. States reflect the latest sync, not historical daily snapshots. Unrecorded earlier history is not reconstructed; no record does not prove no creations.`,
    "成功日期优先使用可信的上游创建时间，缺失时使用首次确认成功时间，统一按北京时间归日。失败、重试、重新授权和已有账号重复上号不重复计数；移除或删除不扣减历史数量。": `Success dates use trusted provider creation timestamps or first successful confirmation, grouped by Beijing date. Failures, retries, reauthorization and existing-account repeats are excluded. Removal and deletion preserve historical counts.`,
    恢复: `Resume`,
    批量恢复: `Resume selected`,
    批量停用: `Pause selected`,
    批量启停: `Pause / resume selected`,
    请选择启停状态相同的资源: `Select resources with the same pause status`,
    已恢复: `Resumed`,
    启停与移除记录: `Pause, resume and removal history`,
    启停与移除进度: `Pause, resume and removal progress`,
    "支持 SOCKS5、HTTP 或 host:port:username:password，重复代理自动复用。": `Supports SOCKS5, HTTP or host:port:username:password. Existing proxies are reused.`,
    请为每条资源填写代理地址或选择已有代理: `Enter a proxy address or select an existing proxy for each resource`,
    逐条填写或选择不同代理: `Enter or select a different proxy for each resource`,
    使用已填写的代理地址: `Use the entered proxy address`,
    待填写或选择代理: `Enter or select a proxy`,
    查询代理更换任务: `Get proxy replacement job`,
    重新核对代理绑定: `Reconcile proxy binding`,
    查询强制刷新结果: `Get current credential refresh`,
    查询当前重新授权操作: `Get current reauthorization`,
    发起重新授权: `Start reauthorization`,
    提交重新授权凭据: `Submit reauthorization credentials`,
    查询重新授权进度: `Get reauthorization progress`,
    "resource.read + resource.write + proxy.read（直接填写额外需 proxy.write）": `resource.read + resource.write + proxy.read (inline entry additionally requires proxy.write)`,
    "更换前查询资源 version 和代理 version。支持1–100条同供应商、同目标资源；可直接填写 proxyUrl，额外需要 proxy.write。重试保持 requestKey 和内容不变，返回任务后查询逐项结果。reconcile 仅重新核对绑定，不重复提交更换。": `Retrieve resource and proxy versions first. Supports 1–100 resources from the same supplier and target. Inline proxyUrl requires proxy.write. Keep requestKey and payload unchanged when retrying, and query per-item outcomes. Reconcile only checks binding again; it never resubmits a replacement.`,
    "沿用授权维护开关。requestId 为同一次操作固定的 UUID；UNKNOWN 时查询原操作，不换键重复刷新。saved 表示待安装，允许沿用原 requestId 再试；complete 才表示本次刷新完成，不保证账号就绪。": `The existing maintenance policy applies. Keep the same UUID requestId for one operation. Query UNKNOWN results instead of refreshing with a new ID. saved means installation is pending and can be retried with the original requestId. complete confirms this refresh, but does not guarantee account readiness.`,
    "先 POST 发起 OAUTH 或 REFRESH_TOKEN，再用返回的操作 id 通过 PUT 提交授权码或新凭据。OAuth 链接由账号持有人完成。发起响应丢失时先查 current；提交结果未知时查询原操作，不能盲目重新发起或更换一次性凭据。": `POST to start OAUTH or REFRESH_TOKEN, then PUT the code or new credentials using the returned operation id. The account holder completes OAuth. If the start response is lost, query current first. Query the original operation after an uncertain submission; do not blindly start again or change one-time credentials.`
  },
  d = `hispread.language`,
  f = new Set([`Asia/Shanghai`, `Asia/Urumqi`, `Asia/Chongqing`, `Asia/Chungking`, `Asia/Harbin`, `PRC`]);

function p(e) {
  return f.has(e) ? `zh-CN` : `en-US`
}

function m() {
  try {
    let e = new URL(window.location.href).searchParams.get(`language`);
    if (e === `zh-CN` || e === `en-US`) return e;
    let t = localStorage.getItem(d);
    return t === `zh-CN` || t === `en-US` ? t : `auto`
  } catch {
    return `auto`
  }
}

function h(e, t) {
  return e === `auto` ? p(t) : e
}

function g() {
  let e = ``;
  try {
    e = Intl.DateTimeFormat().resolvedOptions().timeZone
  } catch {}
  return h(m(), e)
}
var _ = g(),
  v = () => _;

function y(e) {
  let t = new URL(window.location.href);
  t.searchParams.delete(`language`);
  try {
    e === `auto` ? localStorage.removeItem(d) : localStorage.setItem(d, e)
  } catch {
    e !== `auto` && t.searchParams.set(`language`, e)
  }
  t.href === window.location.href ? window.location.reload() : window.location.assign(t.href)
}
var b = u,
  x = e => Object.hasOwn(b, e) ? b[e] : void 0;

function S(e, t = []) {
  let n = t[0],
    r = (n === 1 || n === 1n || n === `1` ? x(e + `|one`) : void 0) ?? x(e);
  return (_ === `zh-CN` ? e : r ?? e).replace(/\{(\d+)\}/g, (e, n) => Number(n) < t.length ? String(t[Number(n)]) : e)
}

function ee(e) {
  return _ === `zh-CN` ? e : x(e) ?? e
}

function C(e, t) {
  return _ === `zh-CN` ? t : x(`${e}::${t}`) ?? t
}
var te = `The operation could not be completed. Please refresh and try again, or contact support with the request reference.`,
  w = /\p{Script=Han}/u,
  ne = Object.keys(b).filter(e => w.test(e) && !/\{\d+\}/.test(e) && e.trim().length >= 2).sort((e, t) => t.length - e.length),
  T;

function E(e) {
  if (_ === `zh-CN` || !w.test(e)) return e;
  let t = x(e);
  if (t !== void 0) return t;
  T ??= new RegExp(ne.map(e => e.replace(/[.*+?^${}()|[\]\\]/g, `\\$&`)).join(`|`), `g`);
  let n = e.replace(T, e => b[e]);
  return w.test(n) ? te : n
}

function re() {
  document.documentElement.lang = _
}

function ie(e, t) {
  if (!/^\d+(?:\.\d*)?$/.test(e)) return e;
  let [n, r = ``] = e.split(`.`), i = n + r, a = n.length + t, [o, s = ``] = (a <= 0 ? `0.${`0`.repeat(-a)}${i}` : a >= i.length ? i + `0`.repeat(a - i.length) : `${i.slice(0,a)}.${i.slice(a)}`).split(`.`), c = s.replace(/0+$/, ``);
  return (o.replace(/^0+(?=\d)/, ``) || `0`) + (c ? `.${c}` : ``)
}
var ae = e => ie(e, 2),
  D = e => ie(e, -2);

function O(e) {
  return /^\d+(?:\.\d*)?$/.test(e) ? `${ae(e)}${v()===`zh-CN`?`折`:`%`}` : e
}

function oe(e) {
  if (!/^\d+(?:\.\d+)?$/.test(e)) return null;
  let [t, n = ``] = e.split(`.`);
  return [BigInt(t + n), 10n ** BigInt(n.length)]
}

function se(e, t, n, r) {
  let i = oe(e);
  if (!i) return null;
  let a = r.flatMap(e => {
      let t = oe(e.rate);
      return !t || t[0] === 0n ? [] : [{
        from: e.baseCurrency,
        to: e.quoteCurrency,
        ratio: t
      }, {
        from: e.quoteCurrency,
        to: e.baseCurrency,
        ratio: [t[1], t[0]]
      }]
    }),
    o = t === n ? [1n, 1n] : a.find(e => e.from === t && e.to === n)?.ratio;
  if (!o)
    for (let e of a.filter(e => e.from === t)) {
      let t = a.find(t => t.from === e.to && t.to === n);
      if (t) {
        o = [e.ratio[0] * t.ratio[0], e.ratio[1] * t.ratio[1]];
        break
      }
    }
  if (!o) return null;
  let s = i[0] * o[0] * 100n,
    c = i[1] * o[1],
    l = (s / c + (s % c * 2n >= c ? 1n : 0n)).toString().padStart(3, `0`);
  return `${l.slice(0,-2)}.${l.slice(-2)}`
}

function ce(e) {
  return e.unitPrice == null ? e.multiplier == null ? e.ratePercent == null ? `—` : O(D(String(e.ratePercent))) : O(String(e.multiplier)) : String(e.unitPrice)
}

function k(e) {
  let t = /^CCMAX 返回错误（HTTP (\d{3})）：([\s\S]*)$/.exec(e);
  if (t) {
    if (v() === `zh-CN`) return e;
    let [n, r] = t[2].split(`；处理建议：`, 2), i = S(`CCMAX 返回错误（HTTP {0}）：{1}`, [t[1], M(n)]);
    return r ? i + S(`；处理建议：{0}`, [k(r)]) : i
  }
  for (let [t, n] of [
      [/^当前供应商同时上号数已达上限（(\d+)个），请稍后重试$/, `当前供应商同时上号数已达上限（{0}个），请稍后重试`],
      [/^记录号 ([\s\S]+) 已存在且内容或历史归属不同，请核对，不允许覆盖$/, `记录号 {0} 已存在且内容或历史归属不同，请核对，不允许覆盖`],
      [/^来源单号已存在但内容不同，不允许覆盖：([\s\S]+)$/, `来源单号已存在但内容不同，不允许覆盖：{0}`],
      [/^(.+) 资金通道未配置$/, `{0} 资金通道未配置`],
      [/^(.+) 资金通道未启用$/, `{0} 资金通道未启用`],
      [/^密码长度不符合当前策略（(\d+)—(\d+) 位）$/, `密码长度不符合当前策略（{0}—{1} 位）`],
      [/^(Binance|OKX) 当前手续费为 (\d+(?:\.\d+)?) USDT，与已审批付款不一致，请重新申请$/, `{0} 当前手续费为 {1} USDT，与已审批付款不一致，请重新申请`],
      [/^Airwallex 资金账户 ([A-Z]{3}) 可用余额不足$/, `Airwallex 资金账户 {0} 可用余额不足`],
      [/^channel\.([a-zA-Z_][a-zA-Z_0-9]*) 必须为字符串或 null$/, `channel.{0} 必须为字符串或 null`],
      [/^channel\.([a-zA-Z_][a-zA-Z_0-9]*) 必须为数值或 null$/, `channel.{0} 必须为数值或 null`],
      [/^第 (\d+) 项凭据与既有资源交叠，请核对$/, `第 {0} 项凭据与既有资源交叠，请核对`],
      [/^第 (\d+) 项与既有资源资料冲突$/, `第 {0} 项与既有资源资料冲突`]
    ]) {
    let r = t.exec(e);
    if (r) return S(n, r.slice(1))
  }
  let n = /^计费明细：([\s\S]+)$/.exec(e);
  if (n) return S(`计费明细：{0}`, [k(n[1])]);
  let r = /^([\s\S]+)（错误码：([^（）]+)）$/.exec(e);
  if (r) return S(`{0}（错误码：{1}）`, [k(r[1]), r[2]]);
  let i = /^密码还缺少：(.+)$/.exec(e);
  if (i) return S(`密码还缺少：{0}`, [i[1].split(`、`).map(k).join(v() === `zh-CN` ? `、` : `, `)]);
  let a = /^CSV 第 (\d+) 行应为 (\d+) 列$/.exec(e);
  if (a) return S(`CSV 第 {0} 行应为 {1} 列`, [a[1], a[2]]);
  let o = /^CSV 第 (\d+) 行日期或数值格式不正确$/.exec(e);
  if (o) return S(`CSV 第 {0} 行日期或数值格式不正确`, [o[1]]);
  if (e === `建议倍率为最多 8 位小数的非负数，整数部分最多 6 位`) return S(`建议折扣为最多 6 位小数的非负数，整数部分最多 8 位`);
  if (e === `报价倍率下限和上限为最多 8 位小数的非负数，整数部分最多 6 位，上限不小于下限`) return S(`折扣下限和上限为最多 6 位小数的非负数，整数部分最多 8 位，上限不小于下限`);
  let s = /报价倍率必须在 (\d+(?:\.\d+)?) 至 (\d+(?:\.\d+)?) 之间/.exec(e);
  return s ? S(`报价折扣必须在 {0} 至 {1} 之间`, [ae(s[1]), ae(s[2])]) : E(e.replace(/倍率改为\s*(\d+(?:\.\d+)?)\s*倍/g, (e, t) => S(`折扣改为 {0}`, [O(t)])).replace(/报价倍率|建议倍率/g, e => e === `报价倍率` ? `报价折扣` : `建议折扣`))
}

function A(e) {
  let t = k(e);
  return t === `The operation could not be completed. Please refresh and try again, or contact support with the request reference.` ? S(`上游错误（参考 {0}）`, [j(e)]) : t
}

function j(e) {
  let t = 2166136261;
  for (let n of e) t = Math.imul(t ^ n.codePointAt(0), 16777619);
  return (t >>> 0).toString(16).padStart(8, `0`).toUpperCase()
}

function M(e) {
  let t = k(e);
  return t === `The operation could not be completed. Please refresh and try again, or contact support with the request reference.` ? S(`上游返回未翻译的错误，请联系管理员（参考 {0}）`, [j(e)]) : t
}
var le, ue = class extends Error {
  status;
  details;
  constructor(e, t, n) {
    super(k(t) + (n?.traceId ? ` [${n.traceId}]` : ``)), this.status = e, this.details = n
  }
};
async function de() {
  if (!le) {
    let e = await fetch(`/api/auth/csrf`, {
      credentials: `same-origin`
    });
    if (!e.ok) throw new ue(e.status, S(`无法连接服务器`));
    le = await e.json()
  }
  return le
}
async function fe(e, t = {}) {
  let n = (t.method || `GET`).toUpperCase(),
    r = new Headers(t.headers);
  if (r.set(`Accept-Language`, v()), t.body && !(t.body instanceof FormData) && !r.has(`Content-Type`) && r.set(`Content-Type`, `application/json`), ![`GET`, `HEAD`, `OPTIONS`].includes(n)) {
    let e = await de();
    r.set(e.headerName, e.token)
  }
  let i = n === `GET` && e.startsWith(`/supplier-bills/`),
    a = `/api` + e;
  if (i) {
    let e = new URL(a, window.location.origin);
    e.searchParams.set(`billView`, `consumption-v2`), a = e.pathname + e.search
  }
  let o = await fetch(a, {
      ...t,
      ...i ? {
        cache: `no-store`
      } : {},
      headers: r,
      credentials: `same-origin`
    }),
    s = await o.json().catch(() => {
      if (o.ok) throw new ue(502, S(`服务器返回格式异常`));
      return {
        message: S(`服务器返回格式异常`)
      }
    });
  if (!o.ok) throw o.status === 401 && (le = void 0, window.dispatchEvent(new Event(`hub:unauthorized`))), s.code === `PASSWORD_CHANGE_REQUIRED` && window.dispatchEvent(new Event(`hub:password-required`)), new ue(o.status, s.message || S(`请求失败`), {
    code: typeof s.code == `string` ? s.code : void 0,
    traceId: typeof s.traceId == `string` && s.traceId !== `null` ? s.traceId : void 0,
    creationNotStarted: s.creationNotStarted === !0,
    resourceId: typeof s.resourceId == `string` ? s.resourceId : void 0
  });
  return s
}
var pe = (e, t) => fe(e, {
    method: `POST`,
    body: JSON.stringify(t)
  }),
  me = (e, t) => fe(e, {
    method: `PUT`,
    body: JSON.stringify(t)
  });
async function he(e, t) {
  let n = {
    method: `POST`,
    headers: {
      "Content-Type": `application/x-www-form-urlencoded`
    },
    body: new URLSearchParams({
      username: e,
      password: t
    }).toString()
  };
  for (let e = 0; e < 2; e++) {
    le = void 0;
    try {
      await fe(`/auth/login`, n), le = void 0;
      return
    } catch (t) {
      if (!(t instanceof ue) || t.status !== 403) throw t;
      if (e === 1) throw new ue(403, S(`登录安全校验失败，请刷新页面后重试`))
    }
  }
}
async function ge() {
  await pe(`/auth/logout`, {}), le = void 0
}
async function _e(e, t, n = `QUALIFICATION`) {
  let r = new FormData;
  return r.set(`supplierId`, e), r.set(`category`, n), r.set(`file`, t), fe(`/documents`, {
    method: `POST`,
    body: r
  })
}
async function ve(e) {
  return be(`/settlements/${encodeURIComponent(e)}/export`, `settlement-${e}.csv`)
}
async function ye(e, t) {
  let n = await de();
  return be(`/settlements/export?${e}`, `settlements.csv`, {
    method: `POST`,
    headers: {
      "Content-Type": `application/json`,
      [n.headerName]: n.token
    },
    body: JSON.stringify({
      ids: t
    })
  })
}
async function be(e, t, n = {}) {
  let r = await fetch(`/api${e}`, {
    ...n,
    credentials: `same-origin`
  });
  if (!r.ok) {
    let e = await r.json().catch(() => null);
    throw r.status === 401 && (le = void 0, window.dispatchEvent(new Event(`hub:unauthorized`))), new ue(r.status, e?.message || S(r.status === 401 || r.status === 403 ? `无导出权限或登录已失效` : `导出失败，请重试`))
  }
  let i = URL.createObjectURL(await r.blob()),
    a = document.createElement(`a`);
  a.href = i, a.download = t, a.click(), setTimeout(() => URL.revokeObjectURL(i), 1e3)
}

function xe() {
  let e = new Map;

  function t(e) {
    return e instanceof HTMLInputElement || e instanceof HTMLSelectElement || e instanceof HTMLTextAreaElement ? e : null
  }

  function n(n) {
    let r = t(n.target);
    if (!r || r.validity.customError) return;
    let i = r.validity,
      a = i.valueMissing ? S(`请填写此字段。`) : i.typeMismatch ? S(`请输入有效的格式。`) : i.rangeUnderflow ? S(`输入值小于允许的最小值。`) : i.rangeOverflow ? S(`输入值大于允许的最大值。`) : i.tooShort ? S(`输入内容过短。`) : i.tooLong ? S(`输入内容过长。`) : S(`请检查此字段的输入值。`);
    r.setCustomValidity(a), e.set(r, a)
  }

  function r(n) {
    let r = t(n.target);
    r && e.has(r) && (r.validationMessage === e.get(r) && r.setCustomValidity(``), e.delete(r))
  }

  function i() {
    for (let [t, n] of e) t.validationMessage === n && t.setCustomValidity(``);
    e.clear()
  }
  return document.addEventListener(`click`, i, !0), document.addEventListener(`invalid`, n, !0), document.addEventListener(`input`, r, !0), document.addEventListener(`change`, r, !0), () => {
    i(), document.removeEventListener(`click`, i, !0), document.removeEventListener(`invalid`, n, !0), document.removeEventListener(`input`, r, !0), document.removeEventListener(`change`, r, !0)
  }
}
var Ce = () => ReactShim, N = ReactShim, we = `/assets/hispread-ai-Bi7go8ib.png`, Ee = () => jsxRuntime, P = jsxRuntime,
  De = {
    menu: (0, P.jsx)(`path`, {
      d: `M4 6h16M4 12h16M4 18h16`
    }),
    bell: (0, P.jsxs)(P.Fragment, {
      children: [(0, P.jsx)(`path`, {
        d: `M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9`
      }), (0, P.jsx)(`path`, {
        d: `M10 21h4`
      })]
    }),
    users: (0, P.jsxs)(P.Fragment, {
      children: [(0, P.jsx)(`path`, {
        d: `M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M22 21v-2a4 4 0 0 0-3-3.87`
      }), (0, P.jsx)(`circle`, {
        cx: `9`,
        cy: `7`,
        r: `4`
      }), (0, P.jsx)(`path`, {
        d: `M16 3.13a4 4 0 0 1 0 7.75`
      })]
    }),
    quote: (0, P.jsxs)(P.Fragment, {
      children: [(0, P.jsx)(`path`, {
        d: `M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z`
      }), (0, P.jsx)(`path`, {
        d: `M14 2v6h6M8 13h8M8 17h5`
      })]
    }),
    wallet: (0, P.jsxs)(P.Fragment, {
      children: [(0, P.jsx)(`path`, {
        d: `M20 8V5a2 2 0 0 0-2-2H6a3 3 0 0 0 0 6h14v11H6a3 3 0 0 1-3-3V6`
      }), (0, P.jsx)(`path`, {
        d: `M20 12h-5v5h5`
      }), (0, P.jsx)(`path`, {
        d: `M17 14.5h.01`
      })]
    }),
    shield: (0, P.jsxs)(P.Fragment, {
      children: [(0, P.jsx)(`path`, {
        d: `M12 22s8-4 8-11V5l-8-3-8 3v6c0 7 8 11 8 11`
      }), (0, P.jsx)(`path`, {
        d: `m9 12 2 2 4-4`
      })]
    }),
    settings: (0, P.jsxs)(P.Fragment, {
      children: [(0, P.jsx)(`path`, {
        d: `m9 3-.8 2.5-2.5 1-2.3-.7-1.5 2.6 1.7 1.9-.2 2.7-1.5 1.8 1.5 2.6 2.4-.5 2.3 1.4.6 2.7h3l1-2.3 2.5-1.1 2.2.7 1.5-2.6-1.6-2-.1-2.6 1.7-1.8-1.5-2.6-2.6.4L13.7 6 13 3z`
      }), (0, P.jsx)(`circle`, {
        cx: `10.5`,
        cy: `12`,
        r: `3`
      })]
    }),
    plus: (0, P.jsx)(`path`, {
      d: `M12 5v14M5 12h14`
    }),
    search: (0, P.jsxs)(P.Fragment, {
      children: [(0, P.jsx)(`circle`, {
        cx: `10.5`,
        cy: `10.5`,
        r: `7`
      }), (0, P.jsx)(`path`, {
        d: `m16 16 5 5`
      })]
    }),
    chevron: (0, P.jsx)(`path`, {
      d: `m9 5 7 7-7 7`
    }),
    down: (0, P.jsx)(`path`, {
      d: `m6 9 6 6 6-6`
    }),
    close: (0, P.jsx)(`path`, {
      d: `m6 6 12 12M6 18 18 6`
    }),
    check: (0, P.jsx)(`path`, {
      d: `m5 12 4 4L19 6`
    }),
    clock: (0, P.jsxs)(P.Fragment, {
      children: [(0, P.jsx)(`circle`, {
        cx: `12`,
        cy: `12`,
        r: `9`
      }), (0, P.jsx)(`path`, {
        d: `M12 7v5l3 2`
      })]
    }),
    arrow: (0, P.jsx)(`path`, {
      d: `M5 12h14m-5-5 5 5-5 5`
    }),
    download: (0, P.jsx)(P.Fragment, {
      children: (0, P.jsx)(`path`, {
        d: `M12 3v12m-4-4 4 4 4-4M4 16v5h16v-5`
      })
    }),
    upload: (0, P.jsx)(P.Fragment, {
      children: (0, P.jsx)(`path`, {
        d: `M12 16V4m-4 4 4-4 4 4M4 16v5h16v-5`
      })
    }),
    refresh: (0, P.jsxs)(P.Fragment, {
      children: [(0, P.jsx)(`path`, {
        d: `M20 7v5h-5M4 17v-5h5`
      }), (0, P.jsx)(`path`, {
        d: `M6 6a8 8 0 0 1 13 2M5 16a8 8 0 0 0 13 2`
      })]
    }),
    globe: (0, P.jsxs)(P.Fragment, {
      children: [(0, P.jsx)(`circle`, {
        cx: `12`,
        cy: `12`,
        r: `9`
      }), (0, P.jsx)(`ellipse`, {
        cx: `12`,
        cy: `12`,
        rx: `4`,
        ry: `9`
      }), (0, P.jsx)(`path`, {
        d: `M3 12h18`
      })]
    }),
    grid: (0, P.jsxs)(P.Fragment, {
      children: [(0, P.jsx)(`rect`, {
        x: `3`,
        y: `3`,
        width: `7`,
        height: `7`,
        rx: `1.5`
      }), (0, P.jsx)(`rect`, {
        x: `14`,
        y: `3`,
        width: `7`,
        height: `7`,
        rx: `1.5`
      }), (0, P.jsx)(`rect`, {
        x: `3`,
        y: `14`,
        width: `7`,
        height: `7`,
        rx: `1.5`
      }), (0, P.jsx)(`rect`, {
        x: `14`,
        y: `14`,
        width: `7`,
        height: `7`,
        rx: `1.5`
      })]
    }),
    bank: (0, P.jsx)(P.Fragment, {
      children: (0, P.jsx)(`path`, {
        d: `m3 8 9-5 9 5H3M3 21h18M6 9v9M12 9v9M18 9v9M3 18h18`
      })
    }),
    eye: (0, P.jsxs)(P.Fragment, {
      children: [(0, P.jsx)(`path`, {
        d: `M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12`
      }), (0, P.jsx)(`circle`, {
        cx: `12`,
        cy: `12`,
        r: `3`
      })]
    }),
    "eye-off": (0, P.jsxs)(P.Fragment, {
      children: [(0, P.jsx)(`path`, {
        d: `M3 3l18 18M10.6 5.1A11.4 11.4 0 0 1 12 5c6.5 0 10 7 10 7a15 15 0 0 1-3.1 3.8M6.3 6.3C3.5 8.3 2 12 2 12s3.5 7 10 7c1.8 0 3.4-.5 4.7-1.3`
      }), (0, P.jsx)(`path`, {
        d: `M9.9 9.9a3 3 0 0 0 4.2 4.2`
      })]
    }),
    link: (0, P.jsx)(P.Fragment, {
      children: (0, P.jsx)(`path`, {
        d: `M10 13a5 5 0 0 0 7 0l3-3a5 5 0 0 0-7-7l-2 2M14 11a5 5 0 0 0-7 0l-3 3a5 5 0 0 0 7 7l2-2`
      })
    }),
    logout: (0, P.jsx)(P.Fragment, {
      children: (0, P.jsx)(`path`, {
        d: `M9 4H4v16h5M10 12h11m-4-4 4 4-4 4`
      })
    }),
    info: (0, P.jsxs)(P.Fragment, {
      children: [(0, P.jsx)(`circle`, {
        cx: `12`,
        cy: `12`,
        r: `9`
      }), (0, P.jsx)(`path`, {
        d: `M12 11v6M12 7h.01`
      })]
    }),
    audit: (0, P.jsx)(P.Fragment, {
      children: (0, P.jsx)(`path`, {
        d: `M14 2H5v20h14V8zM14 2v6h5M8 12h8M8 16h5`
      })
    }),
    filter: (0, P.jsxs)(P.Fragment, {
      children: [(0, P.jsx)(`path`, {
        d: `M3 5h18M6 12h12M9 19h6`
      }), (0, P.jsx)(`circle`, {
        cx: `8`,
        cy: `5`,
        r: `2`,
        fill: `currentColor`,
        stroke: `none`
      }), (0, P.jsx)(`circle`, {
        cx: `15`,
        cy: `12`,
        r: `2`,
        fill: `currentColor`,
        stroke: `none`
      })]
    }),
    lock: (0, P.jsxs)(P.Fragment, {
      children: [(0, P.jsx)(`rect`, {
        x: `4`,
        y: `10`,
        width: `16`,
        height: `11`,
        rx: `3`
      }), (0, P.jsx)(`path`, {
        d: `M8 10V7a4 4 0 0 1 8 0v3M12 14v3`
      })]
    }),
    copy: (0, P.jsxs)(P.Fragment, {
      children: [(0, P.jsx)(`rect`, {
        x: `8`,
        y: `8`,
        width: `12`,
        height: `13`,
        rx: `2`
      }), (0, P.jsx)(`path`, {
        d: `M16 8V3H3v13h5`
      })]
    }),
    building: (0, P.jsx)(P.Fragment, {
      children: (0, P.jsx)(`path`, {
        d: `M4 21V5l8-3v19M12 8h8v13M2 21h20M7 7v2m0 3v2m0 3v1M16 11v2m0 3v2`
      })
    })
  };

function F({
  name: e,
  size: t = 19,
  className: n = ``
}) {
  return (0, P.jsx)(`svg`, {
    className: n,
    width: t,
    height: t,
    viewBox: `0 0 24 24`,
    fill: `none`,
    stroke: `currentColor`,
    strokeWidth: `1.7`,
    strokeLinecap: `round`,
    strokeLinejoin: `round`,
    "aria-hidden": `true`,
    children: De[e] || De.grid
  })
}

function Oe({
  compact: e = !1
}) {
  return (0, P.jsx)(`svg`, {
    className: `brand-logo ${e?`brand-logo--compact`:`brand-logo--full`}`,
    width: e ? 36 : 180,
    height: e ? 40 : 60,
    viewBox: e ? `10 54 180 196` : `10 54 585 196`,
    preserveAspectRatio: `xMidYMid meet`,
    role: `img`,
    "aria-label": `Hispread AI`,
    focusable: `false`,
    children: (0, P.jsx)(`image`, {
      href: we,
      width: `600`,
      height: `300`
    })
  })
}
var ke = (0, N.createContext)(v());

function Ae({
  children: e
}) {
  return re(), (0, N.useEffect)(xe, []), (0, P.jsx)(ke.Provider, {
    value: v(),
    children: e
  })
}

function je({
  compact: e = !1
}) {
  return (0, P.jsxs)(`label`, {
    className: `language-switcher${e?` language-switcher--compact`:``}`,
    children: [(0, P.jsx)(`span`, {
      className: `sr-only`,
      children: S(`界面语言`)
    }), (0, P.jsxs)(`span`, {
      className: `language-switcher-current`,
      "aria-hidden": `true`,
      children: [e && (0, P.jsx)(F, {
        name: `globe`,
        size: 15
      }), v() === `zh-CN` ? `中文` : `English`, e && (0, P.jsx)(F, {
        name: `down`,
        size: 12
      })]
    }), (0, P.jsxs)(`select`, {
      "aria-label": S(`界面语言`),
      title: S(`切换语言会刷新页面，请先保存正在编辑的内容。`),
      defaultValue: m(),
      onChange: e => y(e.target.value),
      children: [(0, P.jsx)(`option`, {
        value: `auto`,
        children: S(`自动`)
      }), (0, P.jsx)(`option`, {
        value: `zh-CN`,
        children: `中文`
      }), (0, P.jsx)(`option`, {
        value: `en-US`,
        children: `English`
      })]
    })]
  })
}
var Re = { createPortal }, Fe = () => Re;

function Be({
  title: e,
  subtitle: t,
  children: n,
  onClose: r,
  className: i = ``,
  wide: a = !1,
  drawer: o = !1
}) {
  let s = (0, N.useRef)(null),
    c = (0, N.useId)();
  return (0, N.useEffect)(() => {
    let e = s.current,
      t = document.activeElement,
      n = window.visualViewport,
      r = () => {
        e?.style.setProperty(`--dialog-viewport-height`, `${Math.min(window.innerHeight,n?.height??window.innerHeight)}px`), e?.style.setProperty(`--dialog-viewport-top`, `${n?.offsetTop??0}px`)
      };
    return r(), window.addEventListener(`resize`, r), n?.addEventListener(`resize`, r), n?.addEventListener(`scroll`, r), e?.showModal(), () => {
      window.removeEventListener(`resize`, r), n?.removeEventListener(`resize`, r), n?.removeEventListener(`scroll`, r), e?.close(), t instanceof HTMLElement && t.isConnected && t.focus({
        preventScroll: !0
      })
    }
  }, []), (0, P.jsxs)(`dialog`, {
    ref: s,
    "aria-labelledby": c,
    className: `${a?`wide`:``} ${o?`drawer`:``} ${i}`,
    onPointerDown: e => {
      if (!o || e.target !== e.currentTarget) return;
      let t = e.currentTarget.getBoundingClientRect();
      (e.clientX < t.left || e.clientX > t.right || e.clientY < t.top || e.clientY > t.bottom) && r()
    },
    onCancel: e => {
      e.preventDefault(), r()
    },
    children: [(0, P.jsxs)(`div`, {
      className: `dialog-header`,
      children: [(0, P.jsxs)(`div`, {
        children: [(0, P.jsx)(`h2`, {
          id: c,
          children: e
        }), t && (0, P.jsx)(`p`, {
          children: t
        })]
      }), (0, P.jsx)(`button`, {
        type: `button`,
        className: `icon-button`,
        onClick: r,
        "aria-label": S(`关闭`),
        children: (0, P.jsx)(F, {
          name: `close`
        })
      })]
    }), (0, P.jsx)(`div`, {
      className: `dialog-body`,
      children: n
    })]
  })
}

function Ve(e) {
  return e.replace(/倍率改为 (\d+(?:\.\d+)?) 倍/g, (e, t) => S(`折扣改为 {0}`, [O(t)])).replace(/单价改为 ([^；，]+)/g, (e, t) => S(`单价改为 {0}`, [t])).replace(/期间改为 (\d{4}-\d{2}-\d{2}) 至 (\d{4}-\d{2}-\d{2})/g, (e, t, n) => S(`期间改为 {0} 至 {1}`, [t, n])).replace(/，(\d{4}-\d{2}-\d{2}) 起/g, (e, t) => S(`，{0} 起`, [t])).replace(/；/g, v() === `zh-CN` ? `；` : `; `)
}

function He(e) {
  return e.eventType === `SYSTEM_NOTICE` ? e.title : e.title.split(` · `).map(k).join(` · `)
}

function Ue(e) {
  let t = e.body;
  if (e.eventType === `SYSTEM_NOTICE`) return t;
  if (e.eventType.startsWith(`QUOTE_`)) {
    let e = /^报价 ([\s\S]+)：(倍率改为[\s\S]+|单价改为[\s\S]+|期间改为[\s\S]+)。([^。]+)。$/.exec(t);
    if (e) return S(`报价 {0}：{1}。{2}。`, [e[1], Ve(e[2]), k(e[3])]);
    let n = /^报价 ([\s\S]+) · ([^。]+)。$/.exec(t);
    if (n) return S(`报价 {0} · {1}。`, [n[1], k(n[2])])
  }
  if (e.eventType.startsWith(`SETTLEMENT_`)) {
    let e = /^结算单 ([\s\S]+)。请于 ([\s\S]+) 前确认；逾期未提出异议将自动确认。$/.exec(t);
    if (e) return S(`结算单 {0}。请于 {1} 前确认；逾期未提出异议将自动确认。`, [e[1], e[2]]);
    let n = /^结算单 ([\s\S]+) 已因超过确认截止时间且未收到异议而自动确认。$/.exec(t);
    if (n) return S(`结算单 {0} 已因超过确认截止时间且未收到异议而自动确认。`, [n[1]]);
    let r = /^结算单 ([\s\S]+) 的最新应收金额为 ([\s\S]+)，请核对最新版本。$/.exec(t);
    if (r) return S(`结算单 {0} 的最新应收金额为 {1}，请核对最新版本。`, [r[1], r[2]])
  }
  let n = /^([\s\S]+) · ([^。]+)。$/.exec(t);
  if (n) {
    let e = n[1],
      t = /^(供应商资料|业务记录|结算单|付款记录|收款账户记录) ([\s\S]+)$/.exec(e);
    return t && (e = `${k(t[1])} ${t[2]}`), e = e.replace(/（尾号 ([^）]+)）$/g, (e, t) => S(`（尾号 {0}）`, [t])), S(`{0} · {1}。`, [e, k(n[2])])
  }
  return k(t)
}

function We(e, t) {
  let [n, r = ``] = e.split(`.`), i = n + r, a = n.length + t;
  a <= 0 && (i = `0`.repeat(1 - a) + i, a = 1), a >= i.length && (i = i.padEnd(a + 1, `0`));
  let o = i.slice(0, a).replace(/^0+(?=\d)/, ``),
    s = i.slice(a).replace(/0+$/, ``);
  return s ? `${o}.${s}` : o
}

function Ge(e) {
  return We(e, -2)
}
var Ke = {
    QUOTA: S(`额度结算`),
    ACCOUNT_BUYOUT: S(`账号买断`),
    LEGACY: `—`
  },
  qe = {
    ACCOUNT: S(`交付账号`),
    KEY: S(`交付密钥`),
    RELAY: S(`中转站`),
    LEGACY: S(`待完善`)
  },
  Je = {
    ACCOUNT_COUNT: S(`账号数量`),
    ACCOUNT_QUOTA: S(`账号额度`),
    THROUGHPUT: S(`调用能力`)
  };

function Ye(e) {
  if (e.body !== `请进入对应记录查看详情。`) return Ue(e);
  let t = new URLSearchParams(e.targetPath.split(`?`)[1] || ``).get(`id`);
  return t ? S(`关联记录 {0} · 点击查看完整业务信息。`, [t.slice(0, 8).toUpperCase()]) : S(`点击查看完整业务信息。`)
}

function Xe(e) {
  return new URLSearchParams(window.location.hash.split(`?`)[1] || ``).get(e) || ``
}

function Ze(e) {
  let t = e.replace(/^#?\//, ``).replace(/^ops(?=\?|$)/, `resources`);
  /^(workbench|suppliers|operator-kpi|supplier-accounts|projects|quotes|settlements|reports|ccmax-resource-analysis|api-docs|notifications|notice-admin|users|roles|settings|scheduled-tasks|scheduled-task-runs|payout-providers|payout-recipients|payout-calls|audits|deliveries|deliveries-pending|resources|resources-pending|resource-targets|outbound-proxies|supplier-agents)(\?|$)/.test(t) && (window.location.hash = `/` + t)
}

function Qe() {
  let e = new Date;
  return `${e.getFullYear()}-${String(e.getMonth()+1).padStart(2,`0`)}-${String(e.getDate()).padStart(2,`0`)}`
}

function $e(e = new Date) {
  let t = new Intl.DateTimeFormat(`en-CA`, {
      timeZone: `Asia/Shanghai`,
      year: `numeric`,
      month: `2-digit`,
      day: `2-digit`
    }).formatToParts(e),
    n = e => t.find(t => t.type === e)?.value || ``;
  return `${n(`year`)}-${n(`month`)}-${n(`day`)}`
}

function et(e) {
  return e.accountType === `OKX_USDT` ? S(`欧意`) : e.accountType === `BINANCE_USDT` ? S(`币安`) : e.providerCode === `AIRWALLEX` || /^(airwallex|空中云汇)$/i.test(e.bank.trim()) ? S(`空中云汇`) : e.bank
}
var tt = [`USD`, `CNY`, `USDT`],
  nt = {
    PENDING: S(`待审核`),
    APPROVED: S(`已通过`),
    REJECTED: S(`已退回`),
    CONFIRMED: S(`已确认`),
    WITHDRAWN: S(`已撤回`),
    SUPERSEDED: S(`已替换`),
    SUCCEEDED: S(`付款完成`),
    PROCESSING: S(`付款处理中`),
    UNKNOWN: S(`结果待核对`),
    AVAILABLE: S(`待结算`),
    ALLOCATED: S(`已纳入结算`),
    VOID: S(`已作废`),
    PARTIAL: S(`部分付款`),
    PAID: S(`已付清`),
    UNPAID: S(`待付款`),
    SUCCESS: S(`成功`),
    DENIED: S(`已拦截`),
    FAILURE: S(`失败`),
    DISPUTED: S(`收款有异议`),
    CANCELLED: S(`已取消`),
    FAILED: S(`付款失败`)
  };

function rt(e, t) {
  let n = String(e ?? `0`);
  typeof e == `number` && (n = e.toFixed(Math.min(12, t + 2)));
  let r = /^(-?)(\d+)(?:\.(\d*))?$/.exec(n);
  if (!r) return 0n;
  let i = r[3] || ``,
    a = BigInt(r[2]) * 10n ** BigInt(t) + BigInt(i.slice(0, t).padEnd(t, `0`) || `0`);
  return Number(i[t] || `0`) >= 5 && a++, r[1] ? -a : a
}

function it(e, t) {
  let n = e < 0n ? `-` : ``,
    r = (e < 0n ? -e : e).toString().padStart(t + 1, `0`);
  return n + (t ? r.slice(0, -t) + `.` + r.slice(-t) : r)
}

function at(e, t = `USD`) {
  let n = t === `JPY` ? 0 : 2,
    [r, i] = it(rt(e, n), n).split(`.`);
  return r.replace(/\B(?=(\d{3})+(?!\d))/g, `,`) + (i === void 0 ? `` : `.` + i)
}

function ot(e, t, n = `USD`) {
  let r = rt(e, 12) * rt(t, 12),
    i = n === `JPY` ? 0 : 2,
    a = 10n ** BigInt(24 - i),
    o = ((r < 0n ? -r : r) + a / 2n) / a;
  return it(r < 0n ? -o : o, i)
}

function st(e, t = 9) {
  let n = it(e.reduce((e, n) => e + rt(n, t), 0n), t);
  if (!n.includes(`.`)) return n;
  let r = n.replace(/(\.\d*?)0+$/, `$1`).replace(/\.$/, ``);
  return r === `` || r === `-` ? `0` : r
}

function ct(e, t, n = `USD`) {
  let r = n === `JPY` ? 0 : 2;
  return it(rt(e, r) - rt(t, r), r)
}

function lt(e, t) {
  let n = rt(e, 12),
    r = rt(t, 12);
  return n < r ? -1 : +(n > r)
}

function ut(e) {
  return e ? new Date(e).toLocaleString(v(), {
    month: `2-digit`,
    day: `2-digit`,
    hour: `2-digit`,
    minute: `2-digit`,
    hour12: !1
  }) : `—`
}

function dt(e) {
  return e.state === `CONFIRMED` ? lt(e.paidAmount, e.total) >= 0 ? `PAID` : lt(e.paidAmount, `0`) > 0 ? `PARTIAL` : `UNPAID` : e.state
}
var ft = {
  REFRESH_TOKEN: `Refresh Token`,
  ACCESS_TOKEN: `Access Token`,
  SESSION_KEY: `Session Key`,
  OAUTH: S(`OAuth 授权码`)
};

function pt(e) {
  if (!e || /[\s\u0000-\u001f]/.test(e)) return !1;
  let t = e.match(/^(socks5|http|https):\/\/([^/?#]+)$/);
  if (!t) return !1;
  try {
    let n = new URL(e),
      r = t[2],
      i = r.match(/:(\d+)$/)?.[1],
      a = r.includes(`@`) ? r.slice(0, r.lastIndexOf(`@`)) : null;
    return [`socks5:`, `http:`, `https:`].includes(n.protocol) && !!n.hostname && !!i && Number(i) >= 1 && Number(i) <= 65535 && (a === null || !!a && !a.startsWith(`:`))
  } catch {
    return !1
  }
}

function mt(e) {
  return He(e)
}
var ht = (0, N.createContext)(null),
  gt = () => (0, N.useContext)(ht);

function _t(e, t = 0) {
  let {
    epoch: n,
    user: r
  } = gt(), i = `${r.id}:${e}`, [a, o] = (0, N.useState)(0), s = (0, N.useCallback)(() => o(e => e + 1), []), [c, l] = (0, N.useState)({
    key: i,
    revision: 0,
    data: null,
    error: ``,
    loading: !!e,
    refreshing: !1
  }), u = (0, N.useRef)(c);
  u.current = c;
  let d = (0, N.useRef)(i);
  d.current = i;
  let f = (0, N.useCallback)(e => {
    l(t => d.current !== i || t.key !== i || t.loading || t.error || t.data === null ? t : {
      ...t,
      data: e(t.data),
      revision: t.revision + 1
    })
  }, [i]);
  (0, N.useEffect)(() => {
    let n = !0,
      r = !1,
      a, o, s = () => {
        !n || t <= 0 || (o !== void 0 && window.clearTimeout(o), o = window.setTimeout(() => {
          document.hidden || u.current.error ? s() : c(!1)
        }, t))
      };
    if (!e) {
      l({
        key: i,
        revision: 0,
        data: null,
        error: ``,
        loading: !1,
        refreshing: !1
      });
      return
    }
    let c = t => {
      if (r) return;
      r = !0, o !== void 0 && window.clearTimeout(o);
      let c = new AbortController;
      a = c;
      let d = u.current.revision + +!!t;
      t && l(e => {
        let t = e.key === i && e.data !== null;
        return {
          key: i,
          revision: d,
          data: t ? e.data : null,
          error: ``,
          loading: !t,
          refreshing: t
        }
      });
      let f = !1,
        p = window.setTimeout(() => {
          f = !0, c.abort()
        }, 15e3);
      fe(e, {
        signal: c.signal,
        ...t ? {} : {
          headers: {
            "X-Hub-Background": `1`
          }
        }
      }).then(e => {
        n && l(t => t.key !== i || t.revision !== d ? {
          ...t,
          refreshing: !1
        } : {
          key: i,
          data: e,
          error: ``,
          loading: !1,
          refreshing: !1,
          revision: d
        })
      }).catch(e => {
        n && l(t => ({
          ...t,
          loading: !1,
          refreshing: !1,
          error: f ? S(`加载超时，请重试`) : e.message
        }))
      }).finally(() => {
        window.clearTimeout(p), r = !1, s()
      })
    };
    c(!0);
    let d = () => {
      !document.hidden && !u.current.error && c(!1)
    };
    return t > 0 && document.addEventListener(`visibilitychange`, d), () => {
      n = !1, a?.abort(), o !== void 0 && window.clearTimeout(o), document.removeEventListener(`visibilitychange`, d)
    }
  }, [e, i, n, t, a]);
  let p = c.key === i ? c : {
    data: null,
    error: ``,
    loading: !!e,
    refreshing: !1
  };
  return (0, N.useMemo)(() => ({
    ...p,
    mutate: f,
    reload: s
  }), [p, f, s])
}

function vt({
  children: e,
  icon: t,
  variant: n = `secondary`,
  className: r = ``,
  ...i
}) {
  return (0, P.jsxs)(`button`, {
    className: `btn ${n} ${r}`,
    ...i,
    children: [t && (0, P.jsx)(F, {
      name: t,
      size: 17
    }), ` `, e]
  })
}

function yt({
  state: e,
  label: t
}) {
  return (0, P.jsxs)(`span`, {
    className: `badge ${e.toLowerCase()}`,
    children: [(0, P.jsx)(`span`, {
      className: `status-dot`
    }), t || nt[e] || e]
  })
}

function bt({
  value: e,
  onChange: t,
  options: n,
  ariaLabel: r,
  disabled: i = !1,
  required: a = !1,
  compact: o = !1,
  visual: s,
  searchPlaceholder: c,
  onSearchChange: l,
  selectedValues: u,
  onSelectAll: d,
  onClearSelection: f,
  selectAllDisabled: p = !1,
  className: m = ``
}) {
  let h = u !== void 0,
    g = c ?? (s && s !== `currency` ? S(`搜索{0}`, [r]) : void 0),
    [_, v] = (0, N.useState)(!1),
    [y, b] = (0, N.useState)(``),
    [x, ee] = (0, N.useState)({
      left: 0,
      top: 0,
      width: 180,
      maxHeight: 260
    }),
    [C, te] = (0, N.useState)(null),
    w = (0, N.useRef)(null),
    ne = (0, N.useRef)(null),
    T = (0, N.useRef)(null),
    E = (0, N.useRef)(!1),
    re = (0, N.useId)(),
    ie = n.find(t => t.value === e),
    ae = (0, N.useRef)(void 0);
  ie && (ae.current = ie);
  let D = ie || (ae.current?.value === e ? ae.current : void 0),
    O = u?.length ? S(`已选择{0}项`, [u.length]) : D?.shortLabel || D?.label || S(`请选择`),
    oe = h ? O : D ? `${D.label}${D.detail?` · ${D.detail}`:``}` : S(`请选择`),
    se = e => {
      b(e), l?.(e)
    };
  (0, N.useEffect)(() => {
    !_ && l && y && se(``)
  }, [_, l, y]);
  let ce = y.trim().toLocaleLowerCase(),
    k = h ? n.filter(e => e.value !== ``) : n,
    A = g && ce && !l ? k.filter(e => [e.label, e.value, e.detail || ``].some(e => e.toLocaleLowerCase().includes(ce))) : k,
    j = t => u ? u.includes(t.value) : e === t.value,
    M = s ? {
      currency: `wallet`,
      supplier: `users`,
      project: `grid`,
      account: `bank`,
      user: `users`,
      role: `shield`
    } [s] : null;
  (0, N.useEffect)(() => {
    if (!_ || i) return;
    let e = () => {
      let e = w.current?.getBoundingClientRect();
      if (!e) return;
      let t = Math.min(Math.max(e.width, g ? 280 : 180), window.innerWidth - 16),
        n = g ? 360 : s === `project` ? 224 : 260,
        r = Math.min(k.reduce((e, t) => e + (t.detail ? 50 : 39), (g ? 62 : 10) + (h ? 44 : 0)), n),
        i = window.innerHeight - e.bottom - 12,
        a = e.top - 12,
        o = i < r && a > i,
        c = Math.max(48, Math.min(n, o ? a : i));
      ee({
        left: Math.max(8, Math.min(e.left, window.innerWidth - t - 8)),
        top: o ? Math.max(8, e.top - Math.min(r, c) - 7) : e.bottom + 7,
        width: t,
        maxHeight: c
      })
    };
    te(w.current?.closest(`dialog`) || document.body), e(), window.addEventListener(`resize`, e), window.addEventListener(`scroll`, e, !0);
    let t = e => {
        let t = e.target;
        !w.current?.contains(t) && !ne.current?.contains(t) && v(!1)
      },
      n = e => {
        let t = e.target;
        !w.current?.contains(t) && !ne.current?.contains(t) && v(!1)
      };
    return document.addEventListener(`pointerdown`, t), document.addEventListener(`focusin`, n), () => {
      window.removeEventListener(`resize`, e), window.removeEventListener(`scroll`, e, !0), document.removeEventListener(`pointerdown`, t), document.removeEventListener(`focusin`, n)
    }
  }, [_, i, n.length, s, g, h]), (0, N.useEffect)(() => {
    if (!_ || !C) return;
    if (g) {
      (!h || E.current) && T.current?.focus(), E.current = !1;
      return
    }
    if (!E.current) return;
    let t = ne.current?.querySelectorAll(`[role="option"]`),
      r = Math.max(0, n.findIndex(t => t.value === e));
    (t?.[r]?.disabled ? Array.from(t || []).find(e => !e.disabled) : t?.[r])?.focus(), E.current = !1
  }, [_, C, n, e, g, h]);
  let le = () => Array.from(ne.current?.querySelectorAll(`[role="option"]`) || []),
    ue = e => {
      let t = le();
      if (!t.length) return;
      let n = Math.max(0, Math.min(t.length - 1, e));
      (t[n].disabled ? t.slice(n + 1).find(e => !e.disabled) || t.slice(0, n).reverse().find(e => !e.disabled) : t[n])?.focus()
    },
    de = e => {
      if (e.nativeEvent.isComposing) return;
      if (e.key === `Escape`) {
        e.preventDefault(), v(!1), w.current?.focus();
        return
      }
      let t = le();
      if (e.target === T.current) {
        if (e.key === `Home` || e.key === `End`) return;
        let n = t.filter((e, t) => !e.disabled && (!ce || A[t]?.value !== ``));
        e.key === `ArrowDown` || e.key === `ArrowUp` ? (e.preventDefault(), (e.key === `ArrowUp` ? n.at(-1) : n[0])?.focus()) : e.key === `Enter` && (e.preventDefault(), n[0]?.click());
        return
      }
      let n = t.indexOf(document.activeElement);
      if (g && e.key === `ArrowUp` && n === t.findIndex(e => !e.disabled)) {
        e.preventDefault(), T.current?.focus();
        return
      }
      let r = n;
      if (e.key === `ArrowDown`) r = Math.min(n + 1, t.length - 1);
      else if (e.key === `ArrowUp`) r = Math.max(n - 1, 0);
      else if (e.key === `Home`) r = 0;
      else if (e.key === `End`) r = t.length - 1;
      else return;
      e.preventDefault();
      let i = e.key === `ArrowUp` || e.key === `End` ? -1 : 1;
      for (; t[r]?.disabled && r >= 0 && r < t.length;) r += i;
      t[r]?.focus()
    },
    fe = A.map(n => (0, P.jsxs)(`button`, {
      className: `dropdown-option tone-${n.tone||`neutral`} ${n.detail?`has-detail`:``} ${j(n)?`selected`:``}`,
      type: `button`,
      role: `option`,
      disabled: n.disabled,
      "aria-selected": j(n),
      onClick: () => {
        t(n.value), !h && (l && se(``), v(!1), w.current?.focus())
      },
      children: [h && (0, P.jsx)(`span`, {
        className: `dropdown-multi-check`,
        "aria-hidden": `true`,
        children: j(n) && (0, P.jsx)(F, {
          name: `check`,
          size: 13
        })
      }), n.tone && n.tone !== `all` && (0, P.jsx)(`span`, {
        className: `dropdown-dot ${n.tone}`,
        "aria-hidden": `true`
      }), (0, P.jsxs)(`span`, {
        className: `dropdown-option-content`,
        children: [(0, P.jsx)(`span`, {
          children: n.label
        }), n.detail && (0, P.jsx)(`small`, {
          className: `dropdown-option-detail`,
          title: n.detail,
          children: n.detail
        })]
      }), !h && e === n.value && (0, P.jsx)(F, {
        name: `check`,
        size: 15
      })]
    }, n.value));
  return (0, P.jsxs)(`div`, {
    className: `dropdown ${o?`compact`:``} ${s||``} ${m}`,
    children: [(0, P.jsxs)(`button`, {
      className: `dropdown-trigger ${e||u?.length?`has-value`:``} tone-${e&&D?.tone||`neutral`}`,
      type: `button`,
      ref: w,
      disabled: i || !g && n.every(e => e.disabled),
      "aria-label": S(`{0}：{1}`, [r, oe]),
      title: oe,
      "aria-required": a || void 0,
      "aria-haspopup": `listbox`,
      "aria-expanded": _,
      "aria-controls": _ ? re : void 0,
      onClick: () => {
        _ || (E.current = !0, se(``)), v(e => !e)
      },
      onKeyDown: t => {
        if (t.key === `Escape` && _) t.preventDefault(), v(!1);
        else if (t.key === `ArrowDown` || t.key === `ArrowUp`) {
          if (t.preventDefault(), _) {
            if (g) {
              T.current?.focus();
              return
            }
            let t = Math.max(0, n.findIndex(t => t.value === e));
            ue(t)
          } else E.current = !0, se(``), v(!0)
        }
      },
      children: [M && (0, P.jsx)(F, {
        name: M,
        size: 15,
        className: `dropdown-visual-icon`
      }), e && D?.tone && D.tone !== `all` && (0, P.jsx)(`span`, {
        className: `dropdown-dot ${D?.tone||`neutral`}`,
        "aria-hidden": `true`
      }), (0, P.jsx)(`span`, {
        className: `dropdown-value`,
        children: O
      }), (0, P.jsx)(F, {
        name: `down`,
        size: 15
      })]
    }), _ && C && (0, Re.createPortal)((0, P.jsxs)(`div`, {
      className: `dropdown-menu ${s||``} ${g||h?`searchable`:``}`,
      id: g || h ? void 0 : re,
      role: g || h ? void 0 : `listbox`,
      "aria-label": g || h ? void 0 : S(`{0}选项`, [r]),
      ref: ne,
      onKeyDown: de,
      style: x,
      children: [g && (0, P.jsxs)(`label`, {
        className: `dropdown-search`,
        children: [(0, P.jsx)(F, {
          name: `search`,
          size: 16
        }), (0, P.jsx)(`input`, {
          ref: T,
          "aria-label": g,
          placeholder: g,
          value: y,
          onChange: e => se(e.target.value),
          autoComplete: `off`
        })]
      }), h && (0, P.jsxs)(`div`, {
        className: `dropdown-multi-toolbar`,
        children: [(0, P.jsx)(`span`, {
          role: `status`,
          children: S(`已选择{0}项`, [u.length])
        }), d && (0, P.jsx)(`button`, {
          type: `button`,
          disabled: p,
          onClick: () => {
            d(), (T.current || w.current)?.focus()
          },
          children: S(`全选当前结果`)
        }), f && (0, P.jsx)(`button`, {
          type: `button`,
          disabled: !u.length,
          onClick: () => {
            f(), (T.current || w.current)?.focus()
          },
          children: S(`清空已选`)
        }), (0, P.jsx)(`button`, {
          type: `button`,
          onClick: () => {
            v(!1), w.current?.focus()
          },
          children: S(`完成`)
        })]
      }), g || h ? (0, P.jsx)(`div`, {
        className: `dropdown-options`,
        id: re,
        role: `listbox`,
        "aria-multiselectable": h || void 0,
        "aria-label": S(`{0}选项`, [r]),
        children: fe
      }) : fe, g && !A.length && (0, P.jsx)(`p`, {
        className: `dropdown-empty`,
        role: `status`,
        children: S(`没有匹配的选项 `)
      })]
    }), C)]
  })
}

function xt({
  name: e,
  index: t = 0,
  size: n = `normal`
}) {
  return (0, P.jsx)(`span`, {
    className: `company-avatar avatar-${t%5} ${n}`,
    children: /^[a-z]/i.test(e) ? e[0].toUpperCase() : e.slice(0, 1)
  })
}

function I({
  text: e = S(`暂无记录`),
  error: t = !1
}) {
  return (0, P.jsxs)(`div`, {
    className: `empty ${t?`error`:``}`,
    children: [(0, P.jsx)(`div`, {
      className: `empty-icon`,
      children: (0, P.jsx)(F, {
        name: t ? `info` : `quote`,
        size: 28
      })
    }), (0, P.jsx)(`strong`, {
      children: e
    })]
  })
}

function St() {
  return (0, P.jsxs)(`div`, {
    className: `loading-state`,
    children: [(0, P.jsx)(`span`, {
      className: `spinner`
    }), S(`正在加载 `)]
  })
}

function Ct({
  children: e,
  tone: t = `blue`
}) {
  return (0, P.jsxs)(`div`, {
    className: `notice ${t}`,
    children: [(0, P.jsx)(F, {
      name: `info`,
      size: 17
    }), (0, P.jsx)(`div`, {
      children: e
    })]
  })
}

function wt({
  title: e,
  children: t
}) {
  return t ? (0, P.jsx)(`header`, {
    className: `page-actions`,
    "aria-label": e + S(`操作`),
    children: (0, P.jsx)(`div`, {
      className: `heading-actions`,
      children: t
    })
  }) : null
}

function Tt({
  items: e,
  value: t,
  onChange: n
}) {
  return (0, P.jsx)(`div`, {
    className: `tabs`,
    role: `tablist`,
    children: e.map(e => (0, P.jsxs)(`button`, {
      role: `tab`,
      "aria-selected": t === e.id,
      className: t === e.id ? `active` : ``,
      onClick: () => n(e.id),
      children: [e.label, e.count !== void 0 && (0, P.jsx)(`span`, {
        children: e.count
      })]
    }, e.id))
  })
}

function Et({
  children: e,
  actions: t,
  className: n = ``
}) {
  return (0, P.jsxs)(`div`, {
    className: `panel-toolbar filter-toolbar ${n}`.trim(),
    children: [(0, P.jsx)(`div`, {
      className: `filter-toolbar-fields`,
      children: e
    }), t && (0, P.jsx)(`div`, {
      className: `filter-toolbar-actions`,
      children: t
    })]
  })
}

function Dt({
  children: e,
  ariaLabel: t = S(`数据表格`)
}) {
  let n = (0, N.useRef)(null),
    [r, i] = (0, N.useState)(!1);
  return (0, N.useEffect)(() => {
    let e = n.current;
    if (!e) return;
    let t = () => i(e.scrollWidth > e.clientWidth + 1);
    t();
    let r = new ResizeObserver(t);
    return r.observe(e), e.firstElementChild && r.observe(e.firstElementChild), () => r.disconnect()
  }, []), (0, P.jsx)(`div`, {
    ref: n,
    className: `table-scroll`,
    tabIndex: r ? 0 : void 0,
    role: r ? `region` : void 0,
    "aria-label": r ? S(`{0}，可左右滚动`, [t]) : void 0,
    children: e
  })
}

function Ot({
  columns: e,
  data: t,
  loading: n,
  refreshing: r,
  loadingRows: i,
  error: a,
  onRetry: o,
  onRow: s,
  ariaLabel: c
}) {
  let l = (0, N.useRef)(null),
    u = (0, N.useRef)(0),
    d = (0, N.useRef)(5);
  return (0, N.useLayoutEffect)(() => {
    !n && !a && l.current && (u.current = l.current.getBoundingClientRect().height, d.current = t.length || 5)
  }, [n, a, t]), a && !t.length ? (0, P.jsxs)(`div`, {
    children: [(0, P.jsx)(I, {
      text: a,
      error: !0
    }), o && (0, P.jsx)(vt, {
      onClick: o,
      children: S(`重新加载`)
    })]
  }) : (0, P.jsxs)(`div`, {
    ref: l,
    className: `data-table-state`,
    "aria-busy": !!n || !!r,
    style: n && u.current ? {
      minHeight: u.current
    } : void 0,
    children: [a && (0, P.jsx)(Ct, {
      tone: `red`,
      children: a
    }), r && (0, P.jsx)(`span`, {
      className: `data-table-refresh`,
      role: `status`,
      children: S(`刷新中…`)
    }), (0, P.jsxs)(Dt, {
      ariaLabel: c,
      children: [(0, P.jsxs)(`table`, {
        children: [(0, P.jsx)(`thead`, {
          children: (0, P.jsx)(`tr`, {
            children: e.map((e, t) => (0, P.jsx)(`th`, {
              className: e.className,
              "aria-sort": e.ariaSort,
              children: e.label
            }, t))
          })
        }), (0, P.jsx)(`tbody`, {
          children: n ? Array.from({
            length: Math.min(100, i ?? d.current)
          }, (t, n) => (0, P.jsx)(`tr`, {
            className: `data-table-skeleton`,
            "aria-hidden": `true`,
            children: e.map((e, t) => (0, P.jsx)(`td`, {
              children: (0, P.jsx)(`span`, {})
            }, t))
          }, `loading-${n}`)) : t.map((t, n) => (0, P.jsx)(`tr`, {
            onClick: () => s?.(t),
            tabIndex: s ? 0 : void 0,
            onKeyDown: e => {
              s && e.target === e.currentTarget && (e.key === `Enter` || e.key === ` `) && (e.preventDefault(), s(t))
            },
            className: s ? `clickable` : ``,
            children: e.map((e, r) => (0, P.jsx)(`td`, {
              className: e.className,
              children: e.render(t, n)
            }, r))
          }, t.id || t.code || n))
        })]
      }), !n && !t.length && (0, P.jsx)(I, {}), n && (0, P.jsx)(`span`, {
        className: `sr-only`,
        role: `status`,
        children: S(`正在加载`)
      })]
    })]
  })
}

function kt({
  data: e,
  page: t,
  onPage: n,
  size: r,
  onSizeChange: i,
  loading: a = !1,
  queryKey: o
}) {
  let s = (0, N.useRef)(null),
    [c, l] = (0, N.useState)(String(t));
  (0, N.useEffect)(() => l(String(t)), [t, r, o]), !a && e && o !== void 0 && (s.current = {
    key: o,
    total: e.total
  });
  let u = !a && e ? e.total : a && o !== void 0 && s.current?.key === o ? s.current.total : void 0,
    d = u === void 0 ? t : Math.max(1, Math.ceil(u / r)),
    f = !a && u !== void 0 && /^\d+$/.test(c) && Number.isSafeInteger(Number(c));

  function p() {
    if (!f) return;
    let e = Math.max(1, Math.min(d, Number(c)));
    l(String(e)), e !== t && n(e)
  }
  let m = new Set([1, d]),
    h = Math.max(1, Math.min(t - 1, d - 3));
  for (let e = h; e <= Math.min(d, h + 3); e++) m.add(e);
  let g = [];
  return [...m].sort((e, t) => e - t).forEach((e, t, n) => {
    t > 0 && e - n[t - 1] > 1 && g.push(`ellipsis`), g.push(e)
  }), (0, P.jsxs)(`div`, {
    className: `pagination`,
    "aria-busy": a,
    children: [(0, P.jsx)(`span`, {
      className: `pagination-total`,
      children: S(`共 {0} 条记录`, [u ?? `—`])
    }), (0, P.jsxs)(`div`, {
      className: `pagination-controls`,
      children: [(0, P.jsx)(`select`, {
        className: `pagination-size`,
        "aria-label": S(`每页显示条数`),
        value: r,
        onChange: e => i(Number(e.target.value)),
        children: [10, 20, 50, 100].map(e => (0, P.jsx)(`option`, {
          value: e,
          children: S(`{0} 条 / 页`, [e])
        }, e))
      }), (0, P.jsx)(`span`, {
        className: `pagination-page-count`,
        children: S(`第 {0} / 共 {1} 页`, [t, u === void 0 ? `—` : d])
      }), (0, P.jsxs)(`div`, {
        className: `pagination-navigation`,
        role: `group`,
        "aria-label": S(`分页导航`),
        children: [(0, P.jsx)(`button`, {
          type: `button`,
          "aria-label": S(`上一页`),
          disabled: t <= 1,
          onClick: () => n(t - 1),
          children: (0, P.jsx)(F, {
            name: `chevron`,
            className: `rotate`,
            size: 16
          })
        }), (0, P.jsx)(`div`, {
          className: `pagination-page-list`,
          role: `group`,
          "aria-label": S(`选择页码`),
          children: g.map((e, r) => e === `ellipsis` ? (0, P.jsx)(`span`, {
            className: `pagination-ellipsis`,
            "aria-hidden": `true`,
            children: `…`
          }, `ellipsis-${r}`) : (0, P.jsx)(`button`, {
            type: `button`,
            className: `page-number${e===t?` active`:``}`,
            "aria-label": S(`第 {0} 页`, [e]),
            "aria-current": e === t ? `page` : void 0,
            disabled: e === t,
            onClick: () => n(e),
            children: e
          }, e))
        }), (0, P.jsx)(`button`, {
          type: `button`,
          "aria-label": S(`下一页`),
          disabled: u === void 0 || t >= d,
          onClick: () => n(t + 1),
          children: (0, P.jsx)(F, {
            name: `chevron`,
            size: 16
          })
        })]
      }), (0, P.jsxs)(`div`, {
        className: `pagination-jump`,
        children: [(0, P.jsxs)(`label`, {
          children: [(0, P.jsx)(`span`, {
            children: S(`跳至`)
          }), (0, P.jsx)(`input`, {
            "aria-label": S(`跳转页码`),
            type: `text`,
            inputMode: `numeric`,
            maxLength: 16,
            value: c,
            disabled: a || u === void 0,
            onChange: e => l(e.target.value),
            onKeyDown: e => {
              e.key === `Enter` && (e.preventDefault(), e.stopPropagation(), p())
            }
          }), (0, P.jsx)(`span`, {
            children: S(`页`)
          })]
        }), (0, P.jsx)(`button`, {
          type: `button`,
          disabled: !f,
          onClick: p,
          children: S(`跳转`)
        })]
      })]
    })]
  })
}

function At({
  value: e,
  onChange: t,
  placeholder: n = S(`搜索名称或编号`)
}) {
  let r = (0, N.useRef)(null);
  return (0, P.jsxs)(`label`, {
    className: `search-input`,
    children: [(0, P.jsx)(F, {
      name: `search`,
      size: 18
    }), (0, P.jsx)(`input`, {
      ref: r,
      "aria-label": n,
      value: e,
      placeholder: n,
      onChange: e => t(e.target.value)
    }), e && (0, P.jsx)(`button`, {
      type: `button`,
      "aria-label": S(`清空搜索`),
      onClick: () => {
        t(``), r.current?.focus()
      },
      children: (0, P.jsx)(F, {
        name: `close`,
        size: 14
      })
    })]
  })
}

function jt({
  title: e,
  subtitle: t,
  fields: n,
  initial: r = {},
  onClose: i,
  onSubmit: a,
  submitLabel: o = S(`保存`),
  submitDisabled: s = !1,
  className: c = ``,
  secondarySubmit: l,
  extra: u
}) {
  let [d, f] = (0, N.useState)(r), [p, m] = (0, N.useState)(``), [h, g] = (0, N.useState)(!1), _ = (0, N.useRef)(!1), v = [];
  for (let e of n.filter(e => !e.visible || e.visible(d))) {
    let t = v.at(-1);
    t && t.title === e.section ? t.fields.push(e) : v.push({
      title: e.section,
      fields: [e]
    })
  }

  function y(e, t) {
    f(n => {
      let r = e.valuesOnChange?.(t, n) || {};
      return {
        ...n,
        ...Object.fromEntries((e.clearOnChange || []).map(e => [e, ``])),
        ...r,
        [e.name]: t
      }
    })
  }
  async function b(e) {
    e.preventDefault();
    let t = e.nativeEvent.submitter?.getAttribute(`data-form-action`) === `secondary`;
    if (_.current || s) return;
    let r = n.find(e => e.type === `select` && e.required !== !1 && (!e.visible || e.visible(d)) && !d[e.name]);
    if (r) {
      m(S(`请选择{0}`, [r.label])), Array.from(e.currentTarget.querySelectorAll(`.field`)).find(e => e.dataset.field === r.name)?.querySelector(`.dropdown-trigger`)?.focus();
      return
    }
    _.current = !0, g(!0), m(``);
    try {
      await (t && l ? l.onSubmit(d) : a(d)), i()
    } catch (e) {
      m(e instanceof Error ? e.message : S(`操作失败`))
    } finally {
      _.current = !1, g(!1)
    }
  }
  return (0, P.jsx)(Be, {
    title: e,
    subtitle: t,
    className: c,
    onClose: () => {
      h || i()
    },
    children: (0, P.jsxs)(`form`, {
      onSubmit: b,
      children: [(0, P.jsxs)(`div`, {
        className: `form-modal-content`,
        children: [(0, P.jsx)(`div`, {
          className: `form-sections`,
          children: v.map((e, t) => (0, P.jsxs)(`fieldset`, {
            className: e.title ? `form-section` : `form-section-plain`,
            children: [e.title && (0, P.jsx)(`legend`, {
              children: e.title
            }), (0, P.jsx)(`div`, {
              className: `form-grid`,
              children: e.fields.map(e => (0, P.jsxs)(`label`, {
                className: `field ${e.full?`full`:``}`,
                "data-field": e.name,
                children: [(0, P.jsxs)(`span`, {
                  children: [e.label, e.required !== !1 && (0, P.jsx)(`em`, {
                    children: `*`
                  })]
                }), e.type === `select` ? (0, P.jsx)(bt, {
                  ariaLabel: e.label,
                  visual: e.visual,
                  searchPlaceholder: e.searchPlaceholder,
                  onSearchChange: e.onSearchChange,
                  required: e.required !== !1,
                  value: d[e.name] || ``,
                  onChange: t => y(e, t),
                  options: [{
                    value: ``,
                    label: e.searchLoading ? S(`正在加载`) : e.searchError || e.searchEmptyText || S(`请选择`),
                    disabled: !!e.searchLoading || !!e.searchError || !!e.searchEmptyText
                  }, ...typeof e.options == `function` ? e.options(d) : e.options || []]
                }) : e.type === `textarea` ? (0, P.jsx)(`textarea`, {
                  required: e.required !== !1,
                  placeholder: e.placeholder,
                  value: d[e.name] || ``,
                  onChange: t => y(e, t.target.value)
                }) : (0, P.jsx)(`input`, {
                  type: e.type || `text`,
                  "aria-label": e.ariaLabel,
                  required: e.required !== !1,
                  autoComplete: e.type === `password` ? `new-password` : `off`,
                  min: e.min,
                  max: e.max,
                  minLength: e.minLength,
                  step: e.step || `any`,
                  placeholder: e.placeholder,
                  value: d[e.name] || ``,
                  onChange: t => y(e, t.target.value)
                }), ` `, e.hint && (0, P.jsx)(`small`, {
                  children: e.hint
                })]
              }, e.name))
            })]
          }, t))
        }), u?.(d)]
      }), p && (0, P.jsx)(`div`, {
        className: `form-modal-error`,
        children: (0, P.jsx)(Ct, {
          tone: `red`,
          children: p
        })
      }), (0, P.jsxs)(`footer`, {
        className: `dialog-footer`,
        children: [(0, P.jsx)(vt, {
          type: `button`,
          onClick: i,
          disabled: h,
          children: S(`取消 `)
        }), l && (0, P.jsx)(vt, {
          type: `submit`,
          className: `form-secondary-submit`,
          "data-form-action": `secondary`,
          disabled: h || s,
          children: h ? S(`正在提交…`) : l.label
        }), (0, P.jsx)(vt, {
          type: `submit`,
          className: `form-primary-submit`,
          variant: `primary`,
          disabled: h || s,
          children: h ? S(`正在提交…`) : typeof o == `function` ? o(d) : o
        })]
      })]
    })
  })
}

function Mt({
  items: e
}) {
  return (0, P.jsx)(`dl`, {
    className: `detail-grid`,
    children: e.map(([e, t]) => (0, P.jsxs)(`div`, {
      children: [(0, P.jsx)(`dt`, {
        children: e
      }), (0, P.jsx)(`dd`, {
        children: t == null || t === `` ? `—` : t
      })]
    }, e))
  })
}

function Nt({
  onReview: e,
  title: t = S(`审核意见`),
  approveLabel: n = S(`审核通过`),
  rejectLabel: r = S(`退回补充`),
  approveDisabled: i = !1,
  approveConfirmation: a
}) {
  let [o, s] = (0, N.useState)(``), [c, l] = (0, N.useState)(!1), [u, d] = (0, N.useState)(``), [f, p] = (0, N.useState)(!1);
  async function m(t) {
    if (!c) {
      d(``), l(!0);
      try {
        await e(t, o), p(!1)
      } catch (e) {
        d(e.message)
      } finally {
        l(!1)
      }
    }
  }
  return (0, P.jsxs)(`section`, {
    className: `review-box`,
    children: [(0, P.jsx)(`h3`, {
      children: t
    }), (0, P.jsx)(`textarea`, {
      "aria-label": t,
      placeholder: S(`填写审核意见，退回时必填`),
      value: o,
      onChange: e => s(e.target.value)
    }), u && (0, P.jsx)(Ct, {
      tone: `red`,
      children: u
    }), (0, P.jsxs)(`div`, {
      children: [(0, P.jsx)(vt, {
        disabled: c,
        onClick: () => m(!1),
        children: r
      }), (0, P.jsx)(vt, {
        variant: `primary`,
        icon: `check`,
        disabled: c || i,
        onClick: () => a ? p(!0) : void m(!0),
        children: n
      })]
    }), f && a && (0, P.jsxs)(Be, {
      title: S(`确认审核通过`),
      onClose: () => {
        c || p(!1)
      },
      children: [(0, P.jsx)(`p`, {
        children: a
      }), u && (0, P.jsx)(Ct, {
        tone: `red`,
        children: u
      }), (0, P.jsxs)(`div`, {
        className: `dialog-footer`,
        children: [(0, P.jsx)(vt, {
          disabled: c,
          onClick: () => p(!1),
          children: S(`取消`)
        }), (0, P.jsx)(vt, {
          variant: `primary`,
          disabled: c,
          onClick: () => void m(!0),
          children: S(c ? `正在提交…` : `确认通过`)
        })]
      })]
    })]
  })
}
var Pt = `modulepreload`,
  Ft = function(e) {
    return `/` + e
  },
  It = {},
  L = function(e, t, n) {
    let r = Promise.resolve();
    if (t && t.length > 0) {
      let e = document.getElementsByTagName(`link`),
        i = document.querySelector(`meta[property=csp-nonce]`),
        a = i?.nonce || i?.getAttribute(`nonce`);

      function o(e) {
        return Promise.all(e.map(e => Promise.resolve(e).then(e => ({
          status: `fulfilled`,
          value: e
        }), e => ({
          status: `rejected`,
          reason: e
        }))))
      }

      function s(e) {
        return import.meta.resolve ? import.meta.resolve(e) : new URL(e, import.meta.url).href
      }
      r = o(t.map(t => {
        if (t = Ft(t, n), t = s(t), t in It) return;
        It[t] = !0;
        let r = t.endsWith(`.css`);
        for (let n = e.length - 1; n >= 0; n--) {
          let i = e[n];
          if (i.href === t && (!r || i.rel === `stylesheet`)) return
        }
        let i = document.createElement(`link`);
        if (i.rel = r ? `stylesheet` : Pt, r || (i.as = `script`), i.crossOrigin = ``, i.href = t, a && i.setAttribute(`nonce`, a), document.head.appendChild(i), r) return new Promise((e, n) => {
          i.addEventListener(`load`, e), i.addEventListener(`error`, () => n(Error(`Unable to preload CSS for ${t}`)))
        })
      }).filter(e => e !== void 0))
    }

    function i(e) {
      let t = new Event(`vite:preloadError`, {
        cancelable: !0
      });
      if (t.payload = e, window.dispatchEvent(t), !t.defaultPrevented) throw e
    }
    return r.then(t => {
      for (let e of t || []) e.status === `rejected` && i(e.reason);
      return e().catch(i)
    })
  },
  Lt = (0, N.lazy)(() => L(() => import(`./Notifications-BTntRB-A.js`), [])),
  Rt = (0, N.lazy)(() => L(() => import(`./OperatorKpi-NouSWERW.js`), __vite__mapDeps([0, 1]))),
  zt = (0, N.lazy)(() => L(() => import(`./OutboundProxies-BILxGplZ.js`), __vite__mapDeps([2, 3]))),
  Bt = (0, N.lazy)(() => L(() => import(`./PayoutCallLogs-DpLZK7rw.js`), [])),
  Vt = (0, N.lazy)(() => L(() => import(`./PayoutProviders-D9Kgf-te.js`), [])),
  Ht = (0, N.lazy)(() => L(() => import(`./Projects-BlZGF-3J.js`), __vite__mapDeps([4, 5]))),
  Ut = (0, N.lazy)(() => L(() => import(`./Quotes-BL6CyQ42.js`).then(e => e.t), __vite__mapDeps([6, 3, 7, 5, 8, 9]))),
  Wt = (0, N.lazy)(() => L(() => import(`./Reports-ChHNVTLt.js`), __vite__mapDeps([10, 3]))),
  Gt = (0, N.lazy)(() => L(() => import(`./CcmaxResourceAnalysis-DJRiAnAd.js`), __vite__mapDeps([11, 3, 12]))),
  Kt = (0, N.lazy)(() => L(() => import(`./Resources-CXo1DF00.js`).then(e => e.t), __vite__mapDeps([13, 14, 3, 7, 15, 16, 17]))),
  qt = (0, N.lazy)(() => L(() => import(`./ResourceTargets-DskGxaTi.js`), [])),
  Jt = (0, N.lazy)(() => L(() => import(`./ScheduledTaskRuns-DXdXtjvS.js`), __vite__mapDeps([18, 7, 5]))),
  Yt = (0, N.lazy)(() => L(() => import(`./ScheduledTasks-DQG4VARN.js`), __vite__mapDeps([19, 5]))),
  Xt = (0, N.lazy)(() => L(() => import(`./Settlements-CJxoFHir.js`), [])),
  Zt = (0, N.lazy)(() => L(() => import(`./SupplierAccounts-CMP57Xp2.js`), __vite__mapDeps([20, 3]))),
  Qt = (0, N.lazy)(() => L(() => import(`./SupplierAgents-GOZSRGGY.js`), __vite__mapDeps([21, 22]))),
  $t = (0, N.lazy)(() => L(() => import(`./Suppliers-BquEthXG.js`).then(e => e.t), __vite__mapDeps([23, 24]))),
  en = (0, N.lazy)(() => L(() => import(`./System-BbMdwGgl.js`), [])),
  tn = (0, N.lazy)(() => L(() => import(`./SystemNotices-BwbR9un8.js`).then(e => e.t), __vite__mapDeps([25, 26]))),
  nn = (0, N.lazy)(() => L(() => import(`./SystemSettings-CtOVlrw5.js`), [])),
  rn = (0, N.lazy)(() => L(() => import(`./Workbench-CVusO4pD.js`), __vite__mapDeps([27, 5, 28]))),
  an = (0, N.lazy)(() => L(() => import(`./ApiDocs-BOQ6E5CN.js`), __vite__mapDeps([29, 30])));

function on({
  mustChangePassword: e,
  routeAllowed: t,
  route: n,
  supplier: r
}) {
  return (0, P.jsx)(P.Fragment, {
    children: e ? null : t ? n === `workbench` ? (0, P.jsx)(rn, {}) : n === `suppliers` ? (0, P.jsx)($t, {}) : n === `operator-kpi` ? (0, P.jsx)(Rt, {}) : n === `supplier-accounts` ? (0, P.jsx)(Zt, {}) : n === `projects` ? (0, P.jsx)(Ht, {}) : n === `quotes` ? (0, P.jsx)(Ut, {}) : n === `settlements` ? (0, P.jsx)(Xt, {}) : n === `deliveries` || n === `deliveries-pending` ? (0, P.jsx)(Kt, {
      supplierSide: !0,
      pendingOnly: n === `deliveries-pending`
    }) : n === `outbound-proxies` ? (0, P.jsx)(zt, {
      platform: !r
    }) : n === `supplier-agents` ? (0, P.jsx)(Qt, {}) : n === `resources` || n === `resources-pending` ? (0, P.jsx)(Kt, {
      supplierSide: !1,
      pendingOnly: n === `resources-pending`
    }) : n === `resource-targets` ? (0, P.jsx)(qt, {}) : n === `ccmax-resource-analysis` ? (0, P.jsx)(Gt, {}) : n === `reports` ? (0, P.jsx)(Wt, {}) : n === `notifications` ? (0, P.jsx)(Lt, {}) : n === `api-docs` ? (0, P.jsx)(an, {}) : n === `notice-admin` ? (0, P.jsx)(tn, {}) : n === `settings` ? (0, P.jsx)(nn, {}) : n === `scheduled-tasks` ? (0, P.jsx)(Yt, {}) : n === `scheduled-task-runs` ? (0, P.jsx)(Jt, {}) : n === `payout-providers` ? (0, P.jsx)(Vt, {}) : n === `payout-recipients` ? (0, P.jsx)(Zt, {
      view: `recipients`
    }) : n === `payout-calls` ? (0, P.jsx)(Bt, {}) : (0, P.jsx)(en, {
      section: n
    }) : (0, P.jsx)(I, {
      text: S(`当前账号无权访问此页面`),
      error: !0
    })
  })
}

function sn({
  mobile: e,
  open: t,
  onClose: n,
  children: r
}) {
  let i = (0, N.useRef)(null);
  (0, N.useEffect)(() => {
    let n = i.current;
    if (!e || !t || !n) return;
    let r = document.activeElement;
    return n.showModal(), () => {
      n.close(), r instanceof HTMLElement && r.isConnected && r.focus({
        preventScroll: !0
      })
    }
  }, [e, t]);
  let a = (0, P.jsxs)(`aside`, {
    className: `sidebar`,
    id: `app-navigation`,
    onClick: t => {
      e && t.target instanceof Element && t.target.closest(`a, nav button:not([aria-expanded])`) && n()
    },
    children: [e && (0, P.jsx)(`button`, {
      className: `icon-button mobile-navigation-close`,
      type: `button`,
      "aria-label": S(`关闭导航`),
      onClick: n,
      children: (0, P.jsx)(F, {
        name: `close`
      })
    }), r]
  });
  return e ? t ? (0, P.jsx)(`dialog`, {
    className: `mobile-navigation`,
    "aria-label": S(`业务导航`),
    ref: i,
    onKeyDown: e => {
      if (e.key !== `Tab`) return;
      let t = [...e.currentTarget.querySelectorAll(`a[href], button:not(:disabled), [tabindex="0"]`)].filter(e => e.getClientRects().length > 0),
        n = t[0],
        r = t.at(-1);
      e.shiftKey && document.activeElement === n ? (e.preventDefault(), r?.focus()) : !e.shiftKey && document.activeElement === r && (e.preventDefault(), n?.focus())
    },
    onCancel: e => {
      e.preventDefault(), n()
    },
    onClick: e => {
      e.target === e.currentTarget && n()
    },
    children: a
  }) : null : a
}
var cn = `(max-width: 767px)`;

function ln() {
  let [e, t] = (0, N.useState)(() => window.matchMedia(cn).matches);
  return (0, N.useEffect)(() => {
    let e = window.matchMedia(cn),
      n = () => t(e.matches);
    return n(), e.addEventListener(`change`, n), () => e.removeEventListener(`change`, n)
  }, []), e
}

function un(e) {
  let t = !!e.supplierId,
    n = t && e.role === `SUPPLIER_AGENT`,
    r = t => e.permissions.includes(t);
  return [{
    id: `daily`,
    label: S(`日账`),
    allowed: n || r(t ? `settlement.read` : `usage.read`)
  }, {
    id: `departments`,
    label: S(`部门账单`),
    allowed: t && (n ? !!e.teamAdminGroup?.id : r(`settlement.read`))
  }, {
    id: `statements`,
    label: S(t ? `金额确认` : `结算单`),
    allowed: !n && r(`settlement.read`)
  }, {
    id: `inputs`,
    label: S(`金额记录`),
    allowed: !t && r(`usage.read`)
  }, {
    id: `payments`,
    label: S(t ? `收款记录` : `付款记录`),
    allowed: !n && r(`payment.read`)
  }, {
    id: `rates`,
    label: S(t ? `参考汇率` : `汇率版本`),
    allowed: !n && r(`exchange_rate.read`)
  }].filter(e => e.allowed)
}

function dn(e, t) {
  let n = un(e),
    r = t === `resource-accounting` ? e.supplierId ? `statements` : `daily` : t;
  return r ? n.find(e => e.id === r) : n[0]
}

function fn(e) {
  return !e.supplierId && e.role !== `SUPPLIER` && e.permissions.includes(`report.read`) && e.permissions.includes(`resource.read`) && e.permissions.includes(`usage.read`)
}
var pn = `login-release`;

function mn(e) {
  return !e || !/^\d+\.\d+\.\d+/.test(e) ? null : e
}
async function hn() {
  let e = mn(document.querySelector(`meta[name="app-version"]`)?.getAttribute(`content`));
  if (e) try {
    let t = await fetch(`/api/health`, {
      cache: `no-store`,
      headers: {
        "X-Hub-Background": `1`
      }
    });
    if (!t.ok) return;
    let n = mn((await t.json()).version);
    if (!n || n === e) {
      sessionStorage.removeItem(pn);
      return
    }
    if (sessionStorage.getItem(pn) === n) return;
    sessionStorage.setItem(pn, n), location.reload()
  } catch {}
}

function gn() {
  let e = () => {
    document.visibilityState === `visible` && hn()
  };
  e();
  let t = window.setInterval(e, 15e3);
  return window.addEventListener(`focus`, e), document.addEventListener(`visibilitychange`, e), () => {
    window.clearInterval(t), window.removeEventListener(`focus`, e), document.removeEventListener(`visibilitychange`, e)
  }
}

function _n() {
  let {
    epoch: e,
    notify: t,
    refresh: n
  } = gt(), [r, i] = (0, N.useState)(0), [a, o] = (0, N.useState)(!1), [s, c] = (0, N.useState)([]);
  (0, N.useEffect)(() => {
    let e = !0,
      t = () => {
        document.hidden || fe(`/notifications/unread-count`, {
          headers: {
            "X-Hub-Background": `1`
          }
        }).then(t => {
          e && i(t.count)
        }).catch(() => {})
      };
    t();
    let n = setInterval(t, 3e4);
    return () => {
      e = !1, clearInterval(n)
    }
  }, [e]);
  async function l() {
    if (a) {
      o(!1);
      return
    }
    o(!0);
    try {
      let e = await fe(`/notifications?unread=true&size=5`, {
        headers: {
          "X-Hub-Background": `1`
        }
      });
      c(e.items)
    } catch (e) {
      t(e.message, !0)
    }
  }
  return (0, P.jsxs)(`div`, {
    className: `notification-popover`,
    children: [(0, P.jsxs)(`button`, {
      className: `icon-button notification-bell`,
      "aria-label": r ? S(`消息通知，{0} 条未读`, [r]) : S(`消息通知，没有未读`),
      "aria-expanded": a,
      onClick: () => void l(),
      children: [(0, P.jsx)(F, {
        name: `bell`,
        size: 21
      }), r > 0 && (0, P.jsx)(`b`, {
        children: r > 99 ? `99+` : r
      })]
    }), a && (0, P.jsxs)(`div`, {
      className: `notification-dropdown`,
      children: [(0, P.jsxs)(`div`, {
        className: `panel-section-head`,
        children: [(0, P.jsx)(`strong`, {
          children: S(`未读消息`)
        }), (0, P.jsx)(`button`, {
          className: `text-button`,
          onClick: () => {
            o(!1), Ze(`notifications`)
          },
          children: S(`全部消息 `)
        })]
      }), s.length ? s.map(e => (0, P.jsxs)(`button`, {
        onClick: () => {
          o(!1), pe(`/notifications/${e.id}/read`, {}).catch(e => t(e.message, !0)).finally(() => {
            n(), Ze(e.targetPath || `notifications`)
          })
        },
        children: [(0, P.jsx)(`strong`, {
          children: mt(e)
        }), (0, P.jsx)(`small`, {
          className: `notification-summary`,
          children: Ye(e)
        }), (0, P.jsx)(`small`, {
          children: ut(e.createdAt)
        })]
      }, e.id)) : (0, P.jsx)(`p`, {
        className: `muted`,
        children: S(`暂无未读消息`)
      })]
    })]
  })
}
var vn = (0, N.lazy)(() => L(() => import(`./LoginParticleArtwork-BO8OSBtb.js`), []));

function yn({
  onLogin: e
}) {
  (0, N.useEffect)(() => {
    hn()
  }, []);
  let [t, n] = (0, N.useState)(``), [r, i] = (0, N.useState)(``), [a, o] = (0, N.useState)(``), [s, c] = (0, N.useState)(!1), [l, u] = (0, N.useState)(null), [d, f] = (0, N.useState)(!1), [p, m] = (0, N.useState)(!1), [h, g] = (0, N.useState)(0), [_, v] = (0, N.useState)(!1), [y, b] = (0, N.useState)(!1), [x, ee] = (0, N.useState)(``), [C, te] = (0, N.useState)(!1), [w, ne] = (0, N.useState)(``);
  (0, N.useEffect)(() => {
    if (!s) return;
    let e = !0;
    return u(null), f(!0), m(!1), fe(`/auth/registration-policy`).then(t => {
      e && u(t)
    }).catch(() => {
      e && m(!0)
    }).finally(() => {
      e && f(!1)
    }), () => {
      e = !1
    }
  }, [s, h]);
  let T = l ? [l.requireUpper && S(`大写字母`), l.requireLower && S(`小写字母`), l.requireDigit && S(`数字`), l.requireSymbol && S(`符号`)].filter(e => !!e) : [],
    E = T.length ? T.length === 1 ? T[0] : S(`{0}和{1}`, [T.slice(0, -1).join(S(`、`)), T.at(-1)]) : ``,
    re = l ? S(`密码需为 {0}{1}。`, [l.passwordMinLength === l.passwordMaxLength ? S(`{0} 位`, [l.passwordMinLength]) : S(`{0}–{1} 位`, [l.passwordMinLength, l.passwordMaxLength]), E ? S(`，并包含{0}`, [E]) : ``]) : ``;
  return (0, P.jsxs)(`div`, {
    className: `login-page login-hispread`,
    children: [(0, P.jsxs)(`header`, {
      className: `login-toolbar`,
      children: [(0, P.jsx)(`div`, {
        className: `login-brand`,
        children: (0, P.jsx)(Oe, {})
      }), (0, P.jsxs)(`div`, {
        className: `login-toolbar-actions`,
        children: [(0, P.jsxs)(`button`, {
          className: `login-customer-link`,
          type: `button`,
          children: [(0, P.jsx)(`span`, {
            children: S(`我是客户，前往官网`)
          }), (0, P.jsx)(F, {
            name: `arrow`,
            size: 16
          })]
        }), (0, P.jsx)(je, {})]
      })]
    }), (0, P.jsxs)(`main`, {
      className: `login-main`,
      children: [(0, P.jsxs)(`section`, {
        className: `login-portal`,
        "aria-labelledby": `login-hero-title`,
        children: [(0, P.jsx)(`div`, {
          className: `login-particle-stage`,
          "aria-hidden": `true`,
          children: (0, P.jsx)(N.Suspense, {
            fallback: null,
            children: (0, P.jsx)(vn, {})
          })
        }), (0, P.jsxs)(`div`, {
          className: `login-hero-copy`,
          children: [(0, P.jsxs)(`h2`, {
            id: `login-hero-title`,
            children: [S(`让每一个想法`), (0, P.jsx)(`br`, {}), S(`流向`), (0, P.jsx)(`span`, {
              children: S(`无限可能`)
            }), (0, P.jsx)(F, {
              name: `arrow`,
              size: 28
            })]
          }), (0, P.jsxs)(`p`, {
            children: [S(`连接前沿 AI 与你的创造力。`), (0, P.jsx)(`br`, {}), S(`在 Hispread，让下一次突破从此刻开始。`)]
          })]
        })]
      }), (0, P.jsxs)(`section`, {
        className: `login-card`,
        "aria-label": S(s ? `创建账号` : `登录`),
        children: [(0, P.jsxs)(`div`, {
          className: `login-account-avatar`,
          "aria-hidden": `true`,
          children: [(0, P.jsx)(`span`, {
            className: `login-avatar-head`
          }), (0, P.jsx)(`span`, {
            className: `login-avatar-body`
          }), (0, P.jsx)(`svg`, {
            className: `login-avatar-spark`,
            viewBox: `0 0 24 24`,
            fill: `none`,
            children: (0, P.jsx)(`path`, {
              d: `m9 3 1.6 5.4L16 10l-5.4 1.6L9 17l-1.6-5.4L2 10l5.4-1.6L9 3ZM19 2v6m-3-3h6`
            })
          })]
        }), (0, P.jsx)(`div`, {
          className: `login-form-heading`,
          children: (0, P.jsx)(`h1`, {
            children: s ? S(`创建账号`) : (0, P.jsxs)(P.Fragment, {
              children: [S(`欢迎回到`), ` `, (0, P.jsx)(`span`, {
                children: `Hispread`
              })]
            })
          })
        }), (0, P.jsxs)(`form`, {
          onSubmit: async n => {
            n.preventDefault(), te(!0), ne(``);
            try {
              if (s) {
                if (r !== a) throw Error(S(`两次输入的密码不一致`));
                await pe(`/auth/register`, {
                  username: t.trim(),
                  password: r
                }), c(!1), i(``), o(``), v(!1), b(!1), ee(S(`注册成功，请登录后填写个人及企业资料`))
              } else await he(t, r), e(await fe(`/auth/me`))
            } catch (e) {
              ne(e.message)
            } finally {
              te(!1)
            }
          },
          children: [(0, P.jsxs)(`label`, {
            className: `field`,
            children: [(0, P.jsx)(`span`, {
              children: S(`账号`)
            }), (0, P.jsxs)(`span`, {
              className: `login-account-input`,
              children: [(0, P.jsx)(F, {
                name: `users`,
                size: 17
              }), (0, P.jsx)(`input`, {
                required: !0,
                autoComplete: `username`,
                placeholder: S(`输入账号`),
                value: t,
                onChange: e => n(e.target.value)
              })]
            })]
          }), (0, P.jsxs)(`div`, {
            className: `field`,
            children: [(0, P.jsx)(`label`, {
              htmlFor: `login-password`,
              children: S(`密码`)
            }), (0, P.jsxs)(`div`, {
              className: `password-input`,
              children: [(0, P.jsx)(F, {
                name: `lock`,
                size: 17
              }), (0, P.jsx)(`input`, {
                id: `login-password`,
                required: !0,
                type: _ ? `text` : `password`,
                autoComplete: s ? `new-password` : `current-password`,
                placeholder: S(`输入密码`),
                value: r,
                onChange: e => i(e.target.value)
              }), (0, P.jsx)(`button`, {
                className: `password-visibility`,
                type: `button`,
                "aria-label": S(_ ? `隐藏密码` : `显示密码`),
                "aria-pressed": _,
                title: S(_ ? `隐藏密码` : `显示密码`),
                onClick: () => v(e => !e),
                children: (0, P.jsx)(F, {
                  name: _ ? `eye-off` : `eye`,
                  size: 18
                })
              })]
            })]
          }), s && (0, P.jsxs)(`p`, {
            className: `login-password-hint`,
            role: `note`,
            "aria-live": `polite`,
            children: [d && S(`正在读取密码规则…`), l && re, p && (0, P.jsxs)(P.Fragment, {
              children: [S(`密码规则读取失败。 `), (0, P.jsx)(`button`, {
                className: `text-button`,
                type: `button`,
                onClick: () => g(e => e + 1),
                children: S(`重试 `)
              })]
            })]
          }), s && (0, P.jsxs)(`div`, {
            className: `field`,
            children: [(0, P.jsx)(`label`, {
              htmlFor: `login-confirm-password`,
              children: S(`确认密码`)
            }), (0, P.jsxs)(`div`, {
              className: `password-input`,
              children: [(0, P.jsx)(F, {
                name: `lock`,
                size: 17
              }), (0, P.jsx)(`input`, {
                id: `login-confirm-password`,
                required: !0,
                type: y ? `text` : `password`,
                autoComplete: `new-password`,
                value: a,
                onChange: e => o(e.target.value)
              }), (0, P.jsx)(`button`, {
                className: `password-visibility`,
                type: `button`,
                "aria-label": S(y ? `隐藏确认密码` : `显示确认密码`),
                "aria-pressed": y,
                title: S(y ? `隐藏确认密码` : `显示确认密码`),
                onClick: () => b(e => !e),
                children: (0, P.jsx)(F, {
                  name: y ? `eye-off` : `eye`,
                  size: 18
                })
              })]
            })]
          }), x && (0, P.jsx)(Ct, {
            tone: `green`,
            children: x
          }), w && (0, P.jsx)(Ct, {
            tone: `red`,
            children: w
          }), (0, P.jsxs)(vt, {
            variant: `primary`,
            type: `submit`,
            disabled: C || s && !l,
            children: [S(C ? `请稍候…` : s ? `创建账号` : `登录`), (0, P.jsx)(F, {
              name: `arrow`,
              size: 16
            })]
          }), (0, P.jsx)(`button`, {
            className: `text-button login-switch`,
            type: `button`,
            disabled: C,
            onClick: () => {
              c(e => !e), ne(``), ee(``), i(``), o(``), v(!1), b(!1)
            },
            children: S(s ? `已有账号？返回登录` : `没有账号？立即注册`)
          })]
        })]
      })]
    }), (0, P.jsx)(`footer`, {
      className: `login-entity`,
      children: (0, P.jsx)(`strong`, {
        children: `HIN Technology co., Limited`
      })
    })]
  })
}
var bn = [{
    id: `workbench`,
    label: S(`工作台`),
    icon: `grid`,
    permission: `workbench.read`
  }, {
    id: `suppliers`,
    label: S(`供应商管理`),
    icon: `users`,
    permission: `supplier.read`
  }, {
    id: `operator-kpi`,
    label: S(`运营归属`),
    icon: `users`,
    permission: `supplier.owner.assign`
  }, {
    id: `projects`,
    label: S(`项目管理`),
    icon: `quote`,
    permission: `project.read`
  }, {
    id: `quotes`,
    label: S(`报价管理`),
    icon: `quote`,
    permission: `quote.read`
  }, {
    id: `settlements`,
    label: S(`账务管理`),
    icon: `wallet`,
    permission: `settlement.read`
  }, {
    id: `deliveries`,
    label: S(`我的交付`),
    icon: `quote`,
    permission: `resource.read`
  }, {
    id: `outbound-proxies`,
    label: S(`代理配置`),
    icon: `settings`,
    permission: `proxy.read`
  }, {
    id: `supplier-agents`,
    label: S(`团队成员`),
    icon: `users`,
    permission: `supplier.agent.manage`
  }, {
    id: `resources`,
    label: S(`资源管理`),
    icon: `grid`,
    permission: `resource.read`
  }, {
    id: `reports`,
    label: S(`报表中心`),
    icon: `audit`,
    permission: `report.read`
  }, {
    id: `api-docs`,
    label: S(`API 文档`),
    icon: `quote`,
    permission: ``
  }],
  xn = [{
    id: `users`,
    label: S(`账号管理`),
    icon: `users`,
    permission: `system.users`
  }, {
    id: `roles`,
    label: S(`角色与权限`),
    icon: `shield`,
    permission: `system.roles`
  }, {
    id: `notice-admin`,
    label: S(`通知管理`),
    icon: `bell`,
    permission: `notification.publish`
  }, {
    id: `resource-targets`,
    label: S(`资源接口配置`),
    icon: `settings`,
    permission: `resource.config.read`
  }, {
    id: `settings`,
    label: S(`系统参数`),
    icon: `settings`,
    permission: `system.settings`
  }, {
    id: `scheduled-tasks`,
    label: S(`任务列表`),
    icon: `grid`,
    permission: `system.settings`
  }, {
    id: `scheduled-task-runs`,
    label: S(`执行记录`),
    icon: `audit`,
    permission: `system.settings`
  }, {
    id: `audits`,
    label: S(`审计日志`),
    icon: `audit`,
    permission: `audit.read`
  }],
  Sn = [{
    id: `payout-providers`,
    label: S(`资金通道`),
    icon: `bank`,
    permission: `payout.provider.read`
  }, {
    id: `payout-recipients`,
    label: S(`收款人汇总`),
    icon: `users`,
    permission: `account.read`
  }, {
    id: `payout-calls`,
    label: S(`付款状态`),
    icon: `audit`,
    permission: `payout.call.read`
  }],
  Cn = {
    id: `supplier-accounts`,
    label: S(`供应商收款账户`),
    icon: `bank`,
    permission: `account.read`
  },
  wn = [{
    id: `resources-pending`,
    label: S(`NewAPI 待分配`),
    icon: `grid`,
    permission: `resource.intake.manage`
  }, {
    id: `deliveries-pending`,
    label: S(`NewAPI 待分配`),
    icon: `quote`,
    permission: `resource.intake.manage`
  }],
  Tn = {
    id: `ccmax-resource-analysis`,
    label: S(`CCMAX资源分析`),
    icon: `audit`,
    permission: ``
  },
  En = [Tn, ...wn, ...bn, ...Sn, ...xn, Cn, {
    id: `notifications`,
    label: S(`消息通知`),
    icon: `bell`,
    permission: ``
  }],
  Dn = () => {
    let e = window.location.hash.replace(/^#\//, ``) || `workbench`;
    return e.split(`?`)[0] === `tasks` ? `workbench` : e.replace(/^ops(?=\?|$)/, `resources`)
  };

function On() {
  let e = ln(),
    [t, n] = (0, N.useState)(!1),
    [r, i] = (0, N.useState)(null),
    [a, o] = (0, N.useState)(!0),
    [s, c] = (0, N.useState)(Dn),
    [l, u] = (0, N.useState)(0),
    [d, f] = (0, N.useState)(null),
    [p, m] = (0, N.useState)(!1),
    [h, g] = (0, N.useState)(!0),
    [_, v] = (0, N.useState)(() => Dn().split(`?`)[0] === `settlements`),
    [y, b] = (0, N.useState)(() => [`reports`, `ccmax-resource-analysis`].includes(Dn().split(`?`)[0])),
    [x, ee] = (0, N.useState)(() => Sn.some(e => e.id === Dn().split(`?`)[0])),
    [C, te] = (0, N.useState)(() => xn.some(e => e.id === Dn().split(`?`)[0])),
    [w, ne] = (0, N.useState)(() => [`scheduled-tasks`, `scheduled-task-runs`].includes(Dn().split(`?`)[0])),
    [T, E] = (0, N.useState)(!1),
    [re, ie] = (0, N.useState)(!1),
    [ae, D] = (0, N.useState)(!1),
    O = (0, N.useRef)(null),
    oe = (0, N.useRef)(null);
  (0, N.useEffect)(() => {
    n(!1)
  }, [s, e, r?.id]), (0, N.useEffect)(() => {
    if (r?.supplierId && r.role === `SUPPLIER_AGENT` && s.split(`?`)[0] === `settlements`) return gn()
  }, [r?.supplierId, r?.role, s]), (0, N.useEffect)(() => {
    fe(`/auth/me`).then(i).catch(() => i(null)).finally(() => o(!1));
    let e = () => {
        let e = window.location.hash.replace(/^#\//, ``) || `workbench`,
          t = Dn();
        if (e !== t) {
          window.location.replace(`#/` + t);
          return
        }
        c(t)
      },
      t = () => {
        i(null), ie(!1)
      },
      n = () => i(e => e && {
        ...e,
        mustChangePassword: !0
      });
    return e(), window.addEventListener(`hashchange`, e), window.addEventListener(`hub:unauthorized`, t), window.addEventListener(`hub:password-required`, n), () => {
      window.removeEventListener(`hashchange`, e), window.removeEventListener(`hub:unauthorized`, t), window.removeEventListener(`hub:password-required`, n)
    }
  }, []), (0, N.useEffect)(() => {
    if (!d) return;
    let e = setTimeout(() => f(null), 4500);
    return () => clearTimeout(e)
  }, [d]), (0, N.useEffect)(() => {
    s.split(`?`)[0] === `settlements` && v(!0), [`reports`, `ccmax-resource-analysis`].includes(s.split(`?`)[0]) && b(!0)
  }, [s]), (0, N.useEffect)(() => {
    if (!T) return;
    let e = e => {
        O.current?.contains(e.target) || E(!1)
      },
      t = e => {
        e.key === `Escape` && E(!1)
      };
    return document.addEventListener(`pointerdown`, e), document.addEventListener(`keydown`, t), () => {
      document.removeEventListener(`pointerdown`, e), document.removeEventListener(`keydown`, t)
    }
  }, [T]), (0, N.useEffect)(() => () => {
    oe.current !== null && window.clearTimeout(oe.current)
  }, []), (0, N.useEffect)(() => {
    let e = s.split(`?`)[0];
    [`resources`, `resources-pending`, `deliveries`, `deliveries-pending`].includes(e) && g(!0), Sn.some(t => t.id === e) && ee(!0), xn.some(t => t.id === e) && te(!0), (e === `scheduled-tasks` || e === `scheduled-task-runs`) && ne(!0)
  }, [s]);
  let se = () => {
      oe.current !== null && window.clearTimeout(oe.current), oe.current = null
    },
    ce = () => {
      se(), oe.current = window.setTimeout(() => E(!1), 250)
    };
  (0, N.useEffect)(() => {
    if (!r || !l) return;
    let e = !0;
    return fe(`/auth/me`).then(t => {
      e && i(t)
    }).catch(() => {}), () => {
      e = !1
    }
  }, [l]);
  let k = (e, t = !1) => f({
    message: e,
    error: t
  });
  if (a) return (0, P.jsxs)(`div`, {
    className: `boot-screen`,
    children: [(0, P.jsx)(Oe, {}), (0, P.jsx)(St, {})]
  });
  if (!r) return (0, P.jsx)(yn, {
    onLogin: e => {
      i(e), u(e => e + 1), Ze(`workbench`)
    }
  });
  if (r.onboardingRequired && !r.mustChangePassword) return (0, P.jsx)(kn, {
    approvalRequired: r.supplierRegistrationApprovalEnabled !== !1,
    onDone: async () => {
      i(await fe(`/auth/me`)), u(e => e + 1), Ze(`workbench`)
    },
    onLogout: async () => {
      await ge(), i(null)
    }
  });
  let A = e => !e || r.permissions.includes(e),
    j = s.split(`?`)[0],
    M = !!r.supplierId,
    le = fn(r),
    ue = r.role === `SUPPLIER_AGENT` ? !!r.teamAdminGroup?.id : A(`supplier.agent.manage`),
    de = r.displayName?.trim() || r.username,
    pe = un(r),
    me = dn(r, new URLSearchParams(s.split(`?`)[1]).get(`tab`) || ``),
    he = En.find(e => e.id === j),
    _e = bn.filter(e => (e.id !== `api-docs` || r.role !== `SUPPLIER_AGENT`) && (e.id === `settlements` ? pe.length > 0 : e.id === `supplier-agents` ? ue : A(e.permission)) && (M ? e.id !== `projects` && e.id !== `resources` && e.id !== `suppliers` : ![`deliveries`, `supplier-agents`].includes(e.id))),
    ve = Sn.filter(e => A(e.permission) && !M),
    ye = xn.filter(e => A(e.permission) && !M),
    be = (e, t) => !M && e === `reports` && !A(`usage.read`) && !A(`settlement.read`) ? S(`运营报表`) : M && {
      suppliers: S(`我的资料`),
      quotes: S(`我的报价`),
      settlements: S(`收款管理`),
      reports: S(`应收报表`)
    } [e] || t,
    xe = he && ((j === `settlements` ? !!me : j === `supplier-agents` ? ue : A(he.permission)) || j === `resource-targets` && A(`workbench.monitoring.configure`)) && (!M || !xn.some(e => e.id === j) && !Sn.some(e => e.id === j) && j !== `projects` && j !== `supplier-accounts` && j !== `resources` && j !== `resources-pending`) && (j !== `api-docs` || r.role !== `SUPPLIER_AGENT`) && (j !== `ccmax-resource-analysis` || le) && (M || ![`deliveries`, `deliveries-pending`, `supplier-agents`].includes(j)),
    Se = () => {
      i(null), ie(!1), D(!1), E(!1)
    };
  return (0, P.jsx)(ht.Provider, {
    value: {
      user: r,
      epoch: l,
      refresh: () => u(e => e + 1),
      has: A,
      notify: k
    },
    children: (0, P.jsxs)(`div`, {
      className: `app-shell ${p?`sidebar-collapsed`:``}`,
      children: [(0, P.jsxs)(sn, {
        mobile: e,
        open: t,
        onClose: () => n(!1),
        children: [(0, P.jsxs)(`a`, {
          className: `brand`,
          href: `#/workbench`,
          "aria-label": `Hispread AI`,
          children: [(0, P.jsx)(Oe, {}), (0, P.jsx)(Oe, {
            compact: !0
          })]
        }), (0, P.jsx)(`nav`, {
          "aria-label": S(`业务导航`),
          children: _e.map(e => e.id === `settlements` ? (0, P.jsxs)(`div`, {
            className: `nav-accordion`,
            children: [(0, P.jsxs)(`button`, {
              className: `nav-parent ${j===e.id?`active`:``}`,
              "aria-label": be(e.id, e.label),
              "aria-expanded": _,
              onClick: () => v(e => !e),
              children: [(0, P.jsx)(F, {
                name: e.icon
              }), (0, P.jsx)(`span`, {
                children: be(e.id, e.label)
              }), (0, P.jsx)(F, {
                name: `down`,
                size: 14
              })]
            }), _ && (0, P.jsx)(`div`, {
              className: `nav-submenu`,
              role: `group`,
              "aria-label": S(`{0}子菜单`, [be(e.id, e.label)]),
              children: pe.map(t => (0, P.jsxs)(`button`, {
                title: t.label,
                "aria-label": t.label,
                "aria-current": j === e.id && me?.id === t.id ? `page` : void 0,
                className: j === e.id && me?.id === t.id ? `active` : ``,
                onClick: () => Ze(`settlements?tab=${t.id}`),
                children: [(0, P.jsx)(F, {
                  name: t.id === `rates` ? `bank` : `wallet`
                }), (0, P.jsx)(`span`, {
                  children: t.label
                })]
              }, t.id))
            })]
          }, e.id) : e.id === `reports` && !M ? (0, P.jsxs)(`div`, {
            className: `nav-accordion`,
            children: [(0, P.jsxs)(`button`, {
              className: `nav-parent ${[`reports`,`ccmax-resource-analysis`].includes(j)?`active`:``}`,
              "aria-label": be(e.id, e.label),
              "aria-expanded": y,
              onClick: () => b(e => !e),
              children: [(0, P.jsx)(F, {
                name: e.icon
              }), (0, P.jsx)(`span`, {
                children: be(e.id, e.label)
              }), (0, P.jsx)(F, {
                name: `down`,
                size: 14
              })]
            }), y && (0, P.jsx)(`div`, {
              className: `nav-submenu`,
              role: `group`,
              "aria-label": S(`报表中心子菜单`),
              children: [{
                id: `reports`,
                label: !A(`usage.read`) && !A(`settlement.read`) ? S(`运营报表`) : S(`应付应收分析`)
              }, ...le ? [Tn] : []].map(e => (0, P.jsxs)(`button`, {
                title: e.label,
                "aria-label": e.label,
                "aria-current": j === e.id ? `page` : void 0,
                className: j === e.id ? `active` : ``,
                onClick: () => Ze(e.id),
                children: [(0, P.jsx)(F, {
                  name: `audit`
                }), (0, P.jsx)(`span`, {
                  children: e.label
                })]
              }, e.id))
            })]
          }, e.id) : [`resources`, `deliveries`].includes(e.id) ? (0, P.jsxs)(`div`, {
            className: `nav-accordion`,
            children: [(0, P.jsxs)(`button`, {
              className: `nav-parent ${j===e.id||j===`${e.id}-pending`?`active`:``}`,
              "aria-label": e.label,
              "aria-expanded": h,
              onClick: () => g(e => !e),
              children: [(0, P.jsx)(F, {
                name: e.icon
              }), (0, P.jsx)(`span`, {
                children: e.label
              }), (0, P.jsx)(F, {
                name: `down`,
                size: 14
              })]
            }), h && (0, P.jsx)(`div`, {
              className: `nav-submenu`,
              role: `group`,
              "aria-label": S(`{0}子菜单`, [e.label]),
              children: [{
                id: e.id,
                label: e.id === `resources` ? S(`资源列表`) : S(`交付列表`),
                permission: `resource.read`
              }, {
                id: `${e.id}-pending`,
                label: S(`NewAPI 待分配`),
                permission: `resource.intake.manage`
              }].filter(e => A(e.permission)).map(t => (0, P.jsxs)(`button`, {
                "aria-label": t.label,
                title: t.label,
                className: j === t.id ? `active` : ``,
                onClick: () => Ze(t.id),
                children: [(0, P.jsx)(F, {
                  name: e.icon
                }), (0, P.jsx)(`span`, {
                  children: t.label
                })]
              }, t.id))
            })]
          }, e.id) : (0, P.jsxs)(`button`, {
            title: be(e.id, e.label),
            "aria-label": be(e.id, e.label),
            className: j === e.id || e.id === `suppliers` && j === `supplier-accounts` ? `active` : ``,
            onClick: () => Ze(e.id),
            children: [(0, P.jsx)(F, {
              name: e.icon
            }), (0, P.jsx)(`span`, {
              children: be(e.id, e.label)
            }), j === e.id && (0, P.jsx)(`i`, {
              className: `nav-active-dot`
            })]
          }, e.id))
        }), ve.length > 0 && (0, P.jsxs)(`nav`, {
          className: `nav-accordion`,
          "aria-label": S(`资金管理`),
          children: [(0, P.jsxs)(`button`, {
            className: `nav-parent ${Sn.some(e=>e.id===j)?`active`:``}`,
            "aria-expanded": x,
            onClick: () => ee(e => !e),
            children: [(0, P.jsx)(F, {
              name: `wallet`
            }), (0, P.jsx)(`span`, {
              children: S(`资金管理`)
            }), (0, P.jsx)(F, {
              name: `down`,
              size: 14
            })]
          }), x && (0, P.jsx)(`div`, {
            className: `nav-submenu`,
            role: `group`,
            "aria-label": S(`资金管理子菜单`),
            children: ve.map(e => (0, P.jsxs)(`button`, {
              title: e.label,
              "aria-label": e.label,
              className: j === e.id ? `active` : ``,
              onClick: () => Ze(e.id),
              children: [(0, P.jsx)(F, {
                name: e.icon
              }), (0, P.jsx)(`span`, {
                children: e.label
              })]
            }, e.id))
          })]
        }), ye.length > 0 && (0, P.jsxs)(`nav`, {
          className: `nav-accordion`,
          "aria-label": S(`系统管理`),
          children: [(0, P.jsxs)(`button`, {
            className: `nav-parent ${xn.some(e=>e.id===j)?`active`:``}`,
            "aria-expanded": C,
            onClick: () => te(e => !e),
            children: [(0, P.jsx)(F, {
              name: `settings`
            }), (0, P.jsx)(`span`, {
              children: S(`系统管理`)
            }), (0, P.jsx)(F, {
              name: `down`,
              size: 14
            })]
          }), C && (0, P.jsx)(`div`, {
            className: `nav-submenu`,
            role: `group`,
            "aria-label": S(`系统管理子菜单`),
            children: ye.map(e => e.id === `scheduled-task-runs` ? null : e.id === `scheduled-tasks` ? (0, P.jsxs)(`div`, {
              className: `nav-nested`,
              children: [(0, P.jsxs)(`button`, {
                className: `nav-nested-parent ${j===`scheduled-tasks`||j===`scheduled-task-runs`?`current`:``}`,
                "aria-label": S(`定时任务`),
                "aria-expanded": w,
                onClick: () => ne(e => !e),
                children: [(0, P.jsx)(F, {
                  name: `settings`
                }), (0, P.jsx)(`span`, {
                  children: S(`定时任务`)
                }), (0, P.jsx)(F, {
                  name: `down`,
                  size: 13
                })]
              }), w && (0, P.jsx)(`div`, {
                className: `nav-nested-submenu`,
                role: `group`,
                "aria-label": S(`定时任务子菜单`),
                children: ye.filter(e => [`scheduled-tasks`, `scheduled-task-runs`].includes(e.id)).map(e => (0, P.jsxs)(`button`, {
                  title: e.label,
                  "aria-label": e.label,
                  className: j === e.id ? `active` : ``,
                  onClick: () => Ze(e.id),
                  children: [(0, P.jsx)(F, {
                    name: e.icon
                  }), (0, P.jsx)(`span`, {
                    children: e.label
                  })]
                }, e.id))
              })]
            }, e.id) : (0, P.jsxs)(`button`, {
              title: e.label,
              "aria-label": e.label,
              className: j === e.id ? `active` : ``,
              onClick: () => Ze(e.id),
              children: [(0, P.jsx)(F, {
                name: e.icon
              }), (0, P.jsx)(`span`, {
                children: e.label
              })]
            }, e.id))
          })]
        })]
      }), (0, P.jsxs)(`div`, {
        className: `main-layout`,
        children: [(0, P.jsxs)(`header`, {
          className: `topbar`,
          children: [(0, P.jsxs)(`div`, {
            className: `breadcrumb`,
            children: [(0, P.jsx)(`button`, {
              className: `icon-button menu-toggle`,
              "aria-label": S(e ? `打开导航` : `切换导航宽度`),
              "aria-expanded": e ? t : void 0,
              "aria-controls": `app-navigation`,
              onClick: () => {
                e ? n(e => !e) : m(e => !e)
              },
              children: (0, P.jsx)(F, {
                name: e ? `menu` : `grid`,
                size: 18
              })
            }), (0, P.jsx)(`h1`, {
              children: j === `settlements` && me ? me.label : be(j, he?.label || S(`工作台`))
            })]
          }), (0, P.jsxs)(`div`, {
            className: `topbar-actions`,
            children: [(0, P.jsx)(je, {
              compact: !0
            }), !r.mustChangePassword && (0, P.jsx)(_n, {}), (0, P.jsxs)(`div`, {
              className: `profile-menu`,
              ref: O,
              onMouseEnter: se,
              onMouseLeave: ce,
              children: [(0, P.jsxs)(`button`, {
                className: `profile-trigger`,
                "aria-label": S(`账号菜单`),
                "aria-expanded": T,
                onClick: () => E(e => !e),
                children: [(0, P.jsx)(`span`, {
                  className: `topbar-avatar`,
                  children: de.slice(0, 1)
                }), (0, P.jsx)(`span`, {
                  children: de
                }), (0, P.jsx)(F, {
                  name: `down`,
                  size: 14
                })]
              }), T && (0, P.jsxs)(`div`, {
                className: `profile-dropdown`,
                children: [(0, P.jsx)(`strong`, {
                  children: de
                }), (0, P.jsx)(`small`, {
                  children: r.username
                }), M && A(`supplier.read`) && (0, P.jsxs)(`button`, {
                  onClick: () => {
                    Ze(`suppliers`), E(!1)
                  },
                  children: [(0, P.jsx)(F, {
                    name: `users`,
                    size: 16
                  }), S(`我的资料 `)]
                }), (0, P.jsxs)(`button`, {
                  onClick: () => {
                    D(!0), E(!1)
                  },
                  children: [(0, P.jsx)(F, {
                    name: `users`,
                    size: 16
                  }), S(`个人信息 `)]
                }), (0, P.jsxs)(`button`, {
                  onClick: () => {
                    ie(!0), E(!1)
                  },
                  children: [(0, P.jsx)(F, {
                    name: `lock`,
                    size: 16
                  }), S(`修改密码 `)]
                }), (0, P.jsxs)(`button`, {
                  onClick: async () => {
                    try {
                      await ge(), Se()
                    } catch (e) {
                      k(e.message, !0)
                    }
                  },
                  children: [(0, P.jsx)(F, {
                    name: `logout`,
                    size: 16
                  }), S(`退出登录 `)]
                })]
              })]
            })]
          })]
        }), (0, P.jsx)(`main`, {
          className: `page-content${M?``:` platform-page`}${j===`workbench`?` workbench-page`:``}`,
          children: (0, P.jsx)(N.Suspense, {
            fallback: (0, P.jsx)(St, {}),
            children: (0, P.jsx)(on, {
              mustChangePassword: r.mustChangePassword,
              routeAllowed: !!xe,
              route: j,
              supplier: M
            })
          })
        }, s)]
      }), (re || r.mustChangePassword) && (0, P.jsx)(N.Suspense, {
        fallback: (0, P.jsx)(St, {}),
        children: (0, P.jsx)(jn, {
          forced: r.mustChangePassword,
          onClose: () => ie(!1),
          onChanged: Se
        })
      }), ae && (0, P.jsx)(N.Suspense, {
        fallback: (0, P.jsx)(St, {}),
        children: (0, P.jsx)(Mn, {
          onClose: () => D(!1),
          onSaved: e => {
            i(t => t && {
              ...t,
              displayName: e.displayName
            }), u(e => e + 1), D(!1), k(S(`个人信息已更新`))
          }
        })
      }), d && (0, P.jsxs)(Toast, {
        message: d.message,
        error: d.error,
        children: [(0, P.jsx)(F, {
          name: d.error ? `info` : `check`,
          size: 19
        }), d.message, (0, P.jsx)(`button`, {
          "aria-label": S(`关闭提示`),
          onClick: () => f(null),
          children: (0, P.jsx)(F, {
            name: `close`,
            size: 14
          })
        })]
      })]
    })
  })
}
var kn = (0, N.lazy)(() => L(() => import(`./Onboarding-BDYVT1sP.js`), []));

function An() {
  return (0, P.jsx)(N.Suspense, {
    fallback: (0, P.jsxs)(`div`, {
      className: `boot-screen`,
      children: [(0, P.jsx)(Oe, {}), (0, P.jsx)(St, {})]
    }),
    children: (0, P.jsx)(On, {})
  })
}
var jn = (0, N.lazy)(() => L(() => import(`./AccountDialogs-DkF7YQod.js`).then(e => ({
    default: e.PasswordDialog
  })), [])),
  Mn = (0, N.lazy)(() => L(() => import(`./AccountDialogs-DkF7YQod.js`).then(e => ({
    default: e.PersonalProfileDialog
  })), []));
export {
  fe as $, at as A, Xe as B, gt as C, ft as D, qe as E, Ge as F, Be as G, st as H, Ze as I, Oe as J, Fe as K, Ye as L, lt as M, ot as N, Ke as O, ut as P, ue as Q, mt as R, _t as S, tt as T, Qe as U, ct as V, pt as W, Ee as X, F as Y, Ce as Z, kt as _, s as _t, xt as a, _e as at, Dt as b, Ot as c, ae as ct, I as d, ce as dt, ve as et, Et as f, se as ft, Ct as g, ee as gt, St as h, C as ht, L as i, me as it, $e as j, et as k, Mt as l, D as lt, wt as m, S as mt, un as n, ge as nt, yt as o, k as ot, jt as p, v as pt, je as q, ln as r, pe as rt, vt as s, A as st, dn as t, ye as tt, bt as u, O as ut, Nt as v, l as vt, Je as w, Tt as x, At as y, dt as z
};
export function RootApplication() { return P.jsx(Ae, { children: P.jsx(On, {}) }); }
