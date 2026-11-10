# 支付通道协议与验证边界

本地支付申请、独立审核、上传线下凭证与供应商到账确认是实际PostgreSQL业务流程。它们不等于钱包资金划转。当前未提供真实支付通道凭据，因此没有完成任何真实转账、提币、真实余额读取或上游结果查单。

`PayoutProviderGateway.test(code, serverConfig)` 只执行官方认证或账户只读请求。请求主机由受支持code/region固定选择，不允许用户提供任意base URL，HTTP不跟随redirect。响应中不返回access token、密钥、签名或上游账户明细。默认未配置/未启用返回503；鉴权拒绝或业务错误返回502，不把HTTP200的业务错误包装为成功。Transport fixture测试覆盖签名请求与成功/失败映射，不能外推成真实外部账户验证通过。

| code | 官方只读调用 | 认证 | 配置要求 |
|---|---|---|---|
| AIRWALLEX | POST `/api/v1/authentication/login` | x-client-id、x-api-key；可选x-login-as | enabled、clientId、apiKey；SANDBOX或GLOBAL/PRODUCTION |
| OKX_USDT | GET `/api/v5/asset/balances?ccy=USDT` | OK-ACCESS-KEY/TIMESTAMP/PASSPHRASE/SIGN，HMAC-SHA256+Base64 | enabled、apiKey、secretKey、passphrase；GLOBAL/US/AU/EU/EEA |
| BINANCE_USDT | GET `/sapi/v1/account/info` | X-MBX-APIKEY，timestamp/recvWindow，HMAC-SHA256 hex signature | enabled、apiKey、secretKey；GLOBAL |

AIRWALLEX认证会签发短期access token，但本服务只验证格式后丢弃，不继续发起支付。OKX读取资金账户余额，Binance读取账户信息；均没有调用withdraw、transfer或beneficiary写接口。`paymentExecuted:false`明确记录此边界。

官方来源（2026-11-09查阅）：

- [Airwallex API Access Token](https://www.airwallex.com/docs/api/authentication/api_access_token)：页面结构化Next数据包含`/api/v1/authentication/login`、两个官方服务器、认证头及token/expires_at响应。
- [OKX API V5](https://www.okx.com/docs-v5/en/)：REST身份签名、区域主机和Funding Account GET balance协议。
- [Binance官方Swagger](https://github.com/binance/binance-api-swagger/blob/master/spot_api.yaml)：`/sapi/v1/account/info`的USER_DATA请求、timestamp/recvWindow、ApiKeyAuth定义。开发者wallet页面本次返回202空体，因此采用官方仓库的规范作为可读依据。

实际付款执行支持显式 `HISPREAD_PAYOUT_V1` 自有支付中台，或官方 `NATIVE_AIRWALLEX`、`NATIVE_OKX`、`NATIVE_BINANCE` 适配器。执行前保留独立审核、账户快照、单笔/每日限额、持久化幂等意图与 UNKNOWN 原单查单。原生协议的配置、官方来源、费用语义、Travel Rule 限制与 Airwallex 晚退回处理见 [原生支付实现](native-payment-implementation.md)。未配置并启用执行适配器时 execute/reconcile 返回503；没有真实生产凭据验证或任何实际转账。

`GET /api/payments/provider-capabilities` 为最高管理员返回三个真实配置状态的脱敏能力记录。`configured`、`enabled` 与 `readOnlyTestAvailable` 反映数据库配置；`executable` 还要求已显式配置并验证 bridge 或匹配通道的 native adapter。官方只读连接测试保持独立。兼容接口 `/api/payments/providers` 只列可执行通道；只有认证凭据而未选择执行协议的通道不会自动变成可执行。
