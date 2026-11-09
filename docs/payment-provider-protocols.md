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

实际执行付款可通过新增的HISPREAD_PAYOUT_V1自有支付中台适配器接入，已有可靠幂等身份、独立审核、账户快照、版本锁和UNKNOWN查单流程。未配置中台时execute/reconcile缺省503；没有虚构资金成功结果。原生钱包转账及真实生产凭据验证仍未完成。

`GET /api/payments/provider-capabilities` 为最高管理员返回三个真实配置状态的脱敏能力记录。`configured`、`enabled` 和 `readOnlyTestAvailable` 反映数据库配置；未配置执行中台时 `executable=false` 并包含明确原因。配置有效 `HISPREAD_PAYOUT_V1` bridge后其执行能力与官方只读测试独立，详见 [支付执行中台契约](payment-execution-bridge.md)。兼容前端原调用的 `/api/payments/providers` 只列可执行的provider，因此当前返回空数组。这是能力筛选结果，不代表已配置通道能自动执行转账。
