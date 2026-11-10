# 原生支付适配器：官方协议、实现与验证

查阅日期：2026-11-09。实现保留 `HISPREAD_PAYOUT_V1` 自有支付中台，并新增显式 `NATIVE_AIRWALLEX`、`NATIVE_OKX`、`NATIVE_BINANCE`。读取文档与本地 fixture 验证均未使用真实支付凭据，没有向官方服务发出身份认证、查余额、转账或提币请求。

## 配置与接口

既有最高管理员配置入口 `PUT /api/payout-providers/{code}` 使用顶层通道凭据。`executionAdapter` 明确选择执行协议；原生模式的 `baseUrl` 只能为空或区域固定官方 origin，保存后补全官方地址。生产不会接受私网、任意域名、HTTP 或重定向。修改区域/协议时提交 `executionAdapter.baseUrl:""` 让服务重新推导官方 origin。

```json
{
  "enabled": true,
  "regionCode": "SANDBOX",
  "clientId": "<server-side Airwallex client>",
  "apiKey": "<server-side key>",
  "apiVersion": "2025-06-30",
  "transferMethod": "LOCAL",
  "transferReason": "professional_business_services",
  "singleLimit": "1000",
  "dailyLimit": "10000",
  "executionAdapter": {
    "enabled": true,
    "protocol": "NATIVE_AIRWALLEX",
    "baseUrl": ""
  },
  "beneficiaryMappings": {
    "<approved-local-account-id>": {
      "accountVersion": 2,
      "beneficiaryId": "<existing-Airwallex-beneficiary-id>"
    }
  }
}
```

OKX 使用 `code:OKX_USDT`、`protocol:NATIVE_OKX`、顶层 `apiKey/secretKey/passphrase`，`regionCode:GLOBAL|US|AU|EU|EEA`；Binance 使用 `code:BINANCE_USDT`、`protocol:NATIVE_BINANCE`、顶层 `apiKey/secretKey`，当前仅 `regionCode:GLOBAL`。Binance `sourceWallet` 为 `SPOT` 或 `FUNDING`。网络标识必须显式匹配官方返回值，例如 OKX `networkMappings:{"TRC20":"USDT-TRC20"}`，Binance `networkMappings:{"TRC20":"TRX","ERC20":"ETH"}`。不猜测默认网络。

OKX 的地区合规收款人可在 `recipientInformation` 配置，键为本地已审核账户 ID，值含相同 `accountVersion` 与官方 `rcvrInfo` 对象（`walletType:private|exchange`、所需姓名、国家、地址及 `exchId`）。GET 配置只返回此信息的 `{accountVersion,configured:true}` 摘要，完整合规资料保留在服务端；客户端未修改时应省略该字段。API Key、Secret、Passphrase、Client ID 不回显；空密钥保留已有值，`clearApiKey` / `clearSecretKey` / `clearPassphrase` / `clearClientId` 显式清除。收款人映射 ID 与网络映射会返回管理员用于管理。

业务入口仍为 `POST /api/payments/{id}/payout-preview`、`/execute`、`/reconcile`。`GET /api/payments/provider-capabilities` 和 `/providers` 使用实际显式适配器状态。`POST /api/payout-providers/{code}/test` 继续只做官方只读身份/余额连接测试；它既不创建转账，也不能替代付款预检。

## 官方协议与实现决策

### Airwallex

- 使用官方 [API Access Token](https://www.airwallex.com/docs/api/authentication/api_access_token) 的 `POST /api/v1/authentication/login`、`x-client-id`、`x-api-key` 与可选 `x-login-as`；短期 bearer token 只存在本次服务调用内存中。SANDBOX 为 `api.sandbox.airwallex.com`，生产为 `api.airwallex.com`。
- 采用 [2025-06-30 Transfers API](https://www.airwallex.com/docs/api/2025-06-30/payouts/transfers) 并发送 `x-api-version:2025-06-30`。`POST /api/v1/transfers/create` 请求含 `request_id`、`beneficiary_id`、`transfer_currency/source_currency`、`transfer_amount`、`fee_paid_by:PAYER`、`reason/reference/transfer_method`。当前无 FX：源币种与收款币种相同。
- 既有本地银行账户没有国家路由资料，不能凭账号猜测或自动创建收款人。使用明确版本绑定的已有 beneficiary 映射，按 [Beneficiaries API](https://www.airwallex.com/docs/api/payouts/beneficiaries) GET `/api/v1/beneficiaries/{id}`，校验 `beneficiary.bank_details.account_number`（或 IBAN）、`account_name`、`account_currency` 与本地审核快照完全一致，再创建。供应商更新账户后旧版本映射失效。
- 预检调用 `/api/v1/transfers/validate`；这是字段校验接口，官方无费用报价保证。按 [Create a transfer 的 transfer fee 说明](https://www.airwallex.com/docs/payouts/transfers/create-a-transfer)，费用在 create/retrieve 响应中提供。因此预检返回 `feeEstimateOnly:true`、`feeVerification:PROVIDER_VALIDATED_REQUEST_ONLY`，执行/查询另保存 `providerFeeAmount/providerFeeCurrency/providerFeeVariance`。本地审核手续费是估计，实际通道费用可能不同。
- 官方允许通过 `GET /api/v1/transfers?request_id=...` 查询不确定创建结果；本实现持久化由本地 localPaymentId 与 requestKey 共同 SHA-256 前 32 位生成的固定 request ID，查询只接受唯一匹配的 request ID、beneficiary、金额与币种。创建最多一次，不依赖官方七天去重窗口重新发送。
- [Transfer statuses](https://www.airwallex.com/docs/payouts/transfers/create-a-transfer/transfer-statuses) 明确 `SENT` 只代表发出，`PAID` 后仍可能 `FAILED`。本实现 `SENT` 保持 PROCESSING，`PAID` 映射 SUCCEEDED 并标记 `providerFinality:PROVISIONAL`、`lateReturnMonitoringRequired:true`；允许其继续执行只读 reconcile。后续官方 FAILED/CANCELLED 在同一事务内一次性冲回该付款的 paidAmount、释放 reservation，保存 paidReversed/lateReturn/returnedAt；将原到账确认改为 DISPUTED，并重算结算单 receivedAmount/paymentProgress，防止已确认收款在晚退回后继续计入到账。重复查单不重复加减。审批撤回/拒绝可在官方继续提交，故维持 PROCESSING，不能当作最终出款失败释放预留。

### OKX

- [OKX API V5 官方文档](https://app.okx.com/docs-v5/en/) 的 REST 签名为 Base64(HMAC-SHA256(secret, timestamp + method + requestPath含query + body))，包含 `OK-ACCESS-KEY/TIMESTAMP/PASSPHRASE/SIGN`。使用固定区域 host，时间为 UTC ISO8601 毫秒。
- `GET /api/v5/asset/currencies?ccy=USDT` 验证完整官方 chain、`canWd`、min/max、`wdTickSz` 与当前固定手续费；`GET /api/v5/asset/balances?ccy=USDT` 核验 funding 可用金额覆盖本金+手续费。费用变化会在执行 create 前停止，要求重新申请审核。
- `POST /api/v5/asset/withdrawal`：链上 `dest:4`、明确 `chain`；UID 内部 `dest:3,toAddrType:2`。官方 UID 上限32个数字，本地拒绝邮箱/电话歧义；内部手续费零、最多八位小数。`clientId` 为原付款 localPaymentId+requestKey 确定性 32位字母数字标识。成功 create 只映射 PROCESSING。
- `GET /api/v5/asset/withdrawal-history?ccy=USDT&clientId=...` 查询原单，校验唯一 clientId、原 wdId（若已知）、amount/currency、目标地址哈希与网络。官方 `state:2` SUCCEEDED、`-1/-2` FAILED；其他文档中的进行中状态保持 PROCESSING，未知代码 UNKNOWN。查单会保存实际 providerFeeAmount/providerFeeCurrency/providerFeeVariance，暴露预检到创建之间可能发生的费用变化。
- 官方 Trusted Address、提币权限、IP 白名单、地区 `rcvrInfo` 仍由账户和官方校验。没有自动将 Spot/Trading 资金划入 Funding，也不自动添加白名单或修改账户安全设置。

### Binance

- 使用 [Binance 官方 wallet connector 的 Capital API](https://github.com/binance/binance-connector-js/blob/master/clients/wallet/src/rest-api/modules/capital-api.ts) 及 [官方 Swagger](https://github.com/binance/binance-api-swagger/blob/master/spot_api.yaml)。固定 `api.binance.com`，`X-MBX-APIKEY`，URL 编码后的 query 含 timestamp/recvWindow=5000，HMAC-SHA256 十六进制签名。所有金额使用 BigDecimal 字符串，避免 double。
- 每次预检/执行先调用 `GET /sapi/v1/localentity/questionnaire-requirements`，仅在官方返回 `questionnaireCountryCode:NIL` 时采用标准钱包提币。来源：[官方 Travel Rule endpoint](https://github.com/binance/binance-connector-js/blob/master/clients/wallet/src/rest-api/modules/travel-rule-api.ts) 与 [官方返回模型](https://github.com/binance/binance-connector-python/blob/master/clients/wallet/src/binance_sdk_wallet/rest_api/models/check_questionnaire_requirements_response.py)。需要 Travel Rule 的账户会明确拒绝标准提币；当前本地没有问卷收集/审查流程，未臆造问卷字段，也不会退回另一端点尝试付款。
- `GET /sapi/v1/capital/config/getall` 核对 USDT 指定网络 withdrawEnable、限额、整数精度、当前手续费、地址正则和 Tag 要求；缺 Memo/Tag 的账户不能用于要求 Tag 的网络。Spot 余额来自 coin.free；Funding 使用只读 `POST /sapi/v1/asset/get-funding-asset`。
- 使用 `POST /sapi/v1/capital/withdraw/apply`，明确 network/address/walletType，`withdrawOrderId` 为同一稳定32位身份。Binance 官方 [withdrawal guide](https://www.binance.bh/en/support/faq/detail/115003670492) 说明网络费从提交金额扣除，因此提交总金额为本地收款 amount+已审核 fee；预检要求官方 fee 与审核值一致，查单校验净收款 amount 与 transactionFee，避免把手续费计入供应商到账金额。create 响应 id 只代表请求已收，映射 PROCESSING。
- `GET /sapi/v1/capital/withdraw/history` 按 withdrawOrderId 查询，固定使用原创建时间附近的六天窗口，符合官方小于七天的查询限制，避免默认时间窗口滚动查不到旧单时误判失败。校验唯一原单、目标哈希、网络、币种、净金额和费用；状态6成功、1/3/5失败、0/2/4处理中。查无匹配保持 UNKNOWN，绝不重发。

## 持久化与结果不确定性

保留原有最高管理员权限、CSRF、maker/checker 独立身份、乐观版本锁、审核账户快照与数据库 advisory lock。纯本地配置/收款信息校验在创建 durable intent 前完成；每个原生通道的单笔限额也在此检查。按 UTC 日累计非FAILED付款执行额，使用 provider 事务锁核验 dailyLimit。

创建上游操作前先提交 PROCESSING intent。intent 保存原 protocol、origin、付款方身份绑定哈希、固定 request ID、时间、网络与收款目标哈希。不保存完整账号到公开操作记录。更改 protocol、origin、API key/client identity/loginAs 后不能查另一账户的原单。签名 secret 的轮换不改变同一API key代表的付款方身份。

create 网络超时、5xx、业务错误、解析失败或无法证实拒绝均保留 UNKNOWN，只查询原单；没有自动重试。create 前的明确预检错误可 FAILED 并释放预留。reconcile 自身的网络/鉴权错误不能证明原付款失败，不释放原预留。所有官方响应需核验身份、金额、币种与状态，不回显原始 provider错误体、token、密钥或签名URL。公开 payout-call 会去除 adapterBinding/executionContext/requestFingerprint。

## 验证及真实限制

`NativePaymentGatewayTest` 使用注入 Transport，覆盖三家官方请求路径/签名/UID和网络映射/费率变更/Travel Rule拒绝/身份不匹配/timeout不重试。`NativePaymentConfigTest` 覆盖配置保存、密钥空值保留、协议匹配、PII脱敏。`NativePaymentExecutionServiceTest` 覆盖 PAID→晚退回以及重复操作的账目一次性。`NativePaymentIntegrationTest` 在本地 PostgreSQL 使用 fixture Transport，覆盖真实HTTP控制器、审批快照、durable intent、超时、幂等回放、原单查单成功、重复成功、晚退回冲回与身份配置更改拦截。

这证明协议构造、数据库状态及账目控制通过本地验证，不等于已获得任何真实生产账户的支付能力。仍需用户真实凭据、相应权限/白名单、Airwallex 收款人登记、账户区域适用性与官方 sandbox验收。Binance需要问卷的账户、Memo/Tag账户、自动外汇、代创建收款人、自动资金划转和官方 webhook 验签不在当前标准原生适配范围。Airwallex晚退回已支持管理员主动查单；无人主动查单时不会凭空获知外部变动，后续可接入具有正确验签与事件幂等的webhook或专用查单调度。退回后的实际通道费用与清算退款仍需财务核对，不自动重发原付款。
