# 自有支付中台配置入口

官方支付通道只读连接测试与实际出款中台是两项独立能力。未配置执行中台时`/payments/providers`不返回可执行通道，前端禁用线上付款；不会因为官方余额接口可读就声称能出款。

本地新增的执行协议为`HISPREAD_PAYOUT_V1`，由用户自行实现或部署自有支付中台。它不是官方Airwallex/OKX/Binance transfer协议的复刻。管理员使用已有provider配置接口保存服务端配置：

```json
{
  "enabled": true,
  "executionAdapter": {
    "enabled": true,
    "protocol": "HISPREAD_PAYOUT_V1",
    "baseUrl": "https://your-payments.example.com/hispread",
    "apiKey": "SERVER_SIDE_BRIDGE_KEY",
    "allowHttp": false
  }
}
```

`PUT /api/payout-providers/OKX_USDT`（或其他已支持code）仅ADMIN可操作，需要同源会话与CSRF头。`executionAdapter.apiKey`空字符串表示保留既有密钥，`clearApiKey:true`显式清除。读取配置仅返回`hasApiKey`与`apiKeyMasked`，不返回密钥。启用时服务器校验协议、密钥及公网HTTPS固定origin或路径前缀，禁止userinfo/query/fragment/私网/redirect。

官方通道apiKey和执行中台apiKey独立，不应混用。执行仍必须经过供应商金额确认、付款申请、独立审核和当前版本校验；配置中台不绕过申请审核分离。实际`preview/execute/reconcile`服务实现与幂等、持久化执行意图说明见财务域相应接口文档。
