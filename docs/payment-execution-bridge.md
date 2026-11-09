# HISPREAD_PAYOUT_V1 支付执行中台契约

这是本项目新增的外部支付中台适配协议，可连接用户自有的受控支付服务。它不是从原站恢复出的私有协议，也不是 Airwallex、Binance、OKX 的原生转账/提币接口实现。官方通道只读连接测试与此执行中台配置完全独立。当前没有配置真实执行中台或资金凭据；集成测试连接本机fixture，未发生真实出款。

## 管理员配置

在 `payout-provider` 的 `executionAdapter` 保存：

```json
{
  "protocol": "HISPREAD_PAYOUT_V1",
  "baseUrl": "https://payments.example.com/hispread",
  "apiKey": "server-side-bridge-key",
  "enabled": true,
  "allowHttp": false,
  "timeoutMs": 15000
}
```

通道自身也须 `enabled=true`。执行中台不要求填写官方钱包API密钥，中台可独立管理钱包认证。只有最高管理员可以维护配置。公开配置只返回密钥掩码和存在标志；空密钥保留旧值。默认缺失或禁用配置返回503，`/payments/provider-capabilities` 明确 `executable=false`。有效bridge配置才显示 `executable=true`，`/payments/providers` 只列此类通道。

生产必须使用公网HTTPS，不允许用户名密码、query、fragment、路径穿越或私网/环回/链路本地地址。配置保存和每次请求均校验目标，不跟随重定向。明文HTTP和私网仅在 active profile 为 `test` 或 `integration-test` 且 `app.payments.allow-private-adapters=true` 时可用于fixture；不能由生产配置的 `allowHttp` 绕过。

## HTTP调用

请求均为 `POST`，URL分别为：

- `{baseUrl}/payments/{localPaymentId}/preview`
- `{baseUrl}/payments/{localPaymentId}/execute`
- `{baseUrl}/payments/{localPaymentId}/reconcile`

头包含 `Authorization: Bearer <bridge-api-key>`、`Content-Type: application/json` 和 `Idempotency-Key: <payment.requestKey>`。客户端不自动重试执行请求。中台必须将 `localPaymentId` 与 `requestKey` 共同作为资金操作幂等身份，不能重复发起钱包转账。

预检和执行请求的金额、收款对象等均从已审核的付款及冻结账户读取，不采信浏览器传入的金额或账户：

```json
{
  "protocol": "HISPREAD_PAYOUT_V1",
  "localPaymentId": "local-payment-uuid",
  "requestKey": "stable-original-request-key",
  "provider": "AIRWALLEX",
  "supplierId": "supplier-uuid",
  "settlementId": "statement-uuid",
  "currency": "USD",
  "amount": "100.00",
  "fee": "0.00",
  "obligationCurrency": "USD",
  "obligationAmount": "100.00",
  "accountVersion": 1,
  "recipient": {
    "id": "account-uuid",
    "holder": "Approved recipient",
    "accountType": "BANK",
    "bank": "Approved bank",
    "currency": "USD",
    "lastFour": "1234",
    "accountNumber": "server-side-approved-account"
  }
}
```

`recipient` 可附带已保存的 `transferType`、`network`、`walletType`。完整账号仅在服务端发给已配置中台，不返回浏览器，也不保存到公开操作记录。操作记录只保存目标origin、请求摘要、金额、原幂等身份和脱敏结果。

预检响应必须回显 `localPaymentId`、`requestKey`、`currency`、精确十进制 `amount`，并明确 `executable:true`。可附带 `availableBalance`。浏览器得到的响应只含本地冻结金额、目标掩码和预检结论，未经筛选的中台响应不会转发。

执行或查单响应示例：

```json
{
  "localPaymentId": "local-payment-uuid",
  "requestKey": "stable-original-request-key",
  "currency": "USD",
  "amount": "100.00",
  "state": "SUCCEEDED",
  "operationId": "bridge-operation-id",
  "externalRef": "actual-provider-transfer-reference"
}
```

状态只能是 `SUCCEEDED`、`FAILED`、`PROCESSING` 或 `UNKNOWN`。成功必须同时提供非空 `operationId` 与 `externalRef`。明确业务失败必须提供非空 `operationId`。任何身份、币种、金额不符，或成功缺少引用，均按UNKNOWN保留原资金占用，不能记已付款。

查单请求为：

```json
{
  "protocol": "HISPREAD_PAYOUT_V1",
  "localPaymentId": "local-payment-uuid",
  "requestKey": "stable-original-request-key",
  "operationId": "prior-operation-id-or-empty-if-response-was-lost"
}
```

查单必须按原身份检索原操作，即使执行响应超时没有取得operationId，也不得生成新付款。查单响应仍须回显上述身份、金额、币种。若管理员修改中台地址，原操作查单会拒绝，须恢复原目标；不能向另一个服务提交同一操作。

## 状态与记账

只有最高管理员具备 `payment.execute` / `payout.reconcile` 时可执行对应本地API。付款必须为CHANNEL且APPROVED，`reviewedBy` 与 `createdBy` 不同，当前账户仍APPROVED且版本/快照未变，浏览器提交当前payment.version。

执行前先在数据库事务中持久化PROCESSING意图和原幂等身份，然后只发送一次网络请求。崩溃或超时后保留该意图，只能查单；重复execute返回既有状态，不再次发出外部请求。

- 明确成功：新事务在付款锁及结算锁下更新SUCCEEDED，并以 `paidApplied` 标志确保累计已付只加一次。
- 明确FAILED，或HTTP 400/401/403/404/405/415/422的拒绝：更新FAILED，并以 `reservationReleased` 标志确保只释放本笔占用一次。
- 5xx、网络超时、连接失败、响应格式错误、重定向、金额或身份不匹配：更新UNKNOWN，保留占用，不更新已付。
- PROCESSING/UNKNOWN：使用原操作查单，明确成功后只记账一次。终态重复查单不再次累加。

此实现可以实际连接按上述协议实现的自有支付中台，但原生钱包转账和真实生产资金验证仍是独立部署前工作。当前fixture验证证明请求/鉴权/幂等/错误映射及数据库流程，不证明任何真实钱包已完成转账。
