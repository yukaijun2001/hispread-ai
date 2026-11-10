# 接口补齐与验证

日期：2026-11-09，Asia/Shanghai。本文取代早期“后台任务未实现、代理仅TCP、原生支付未实现、监控未闭环”的状态描述；真实服务配置和真实账户验收仍单独列明。

## 本轮实现

| 功能 | 入口 | 实际行为 |
| --- | --- | --- |
| 工作台监控 | `GET /api/workbench/monitoring`、`POST /api/workbench-monitoring/sources/{id}/refresh` | 使用同一份持久化监控源快照；按品类取有效来源较高RPM/TPM；定时采集，供应商可见性过滤，失败保留上次数据并标记过期；配置和刷新共用锁及版本。 |
| 日账同步 | `POST /api/system/scheduled-tasks/CCMAX_DAILY_SYNC/run` | 请求真实CUSTOM上游，校验资源/供应商/日期，按本地已审核报价计算金额，写入可去重的待核对账单。 |
| 财务确认采集金额 | `POST /api/settlement-inputs/{id}/confirm` | 财务或管理员核对当前版本、报价与配对账单，确认后进入AVAILABLE参与结算。前端日账明细提供确认按钮。 |
| 状态与费用同步 | `POST /api/system/scheduled-tasks/CCMAX_STATUS_SYNC/run` | 校验上游响应后更新限定资源状态、优先级、用量及供应商完整观察快照。 |
| 企业微信提醒 | 任务 `WORKBENCH_WECOM_REMINDER` 及 `reminder-settings` | 官方群机器人markdown请求、加密保存Webhook、脱敏设置、聚合待办、持久化发送冷却与错误记录。 |
| 优先级轮换 | `priority-support`、任务`run`、`rotation-settings/retry-restore` | 先读取原值并持久化，执行升降优先级，周期结束或停用时恢复；未知/失败恢复阻断新轮换；重试只处理未恢复项。 |
| 代理检测 | `POST /api/outbound-proxies/{id}/test` | HTTP CONNECT、HTTPS代理TLS、SOCKS5及账号密码握手，再经隧道访问固定HTTPS观察端，验证公开出口IP；不是仅TCP测试。 |
| 官方原生付款 | `POST /api/payments/{id}/payout-preview`、`execute`、`reconcile` | 显式选择Airwallex/OKX/Binance官方协议或既有中台；签名、限额、审核账户版本、持久化单次执行与原单查单；Airwallex晚退回一次性冲回已付/到账统计。 |
| 隔离支付沙箱 | `POST /api/payments/sandbox`、`GET /api/payments/sandbox/{id}`、`POST /api/payments/sandbox/events` | 从已独立审核付款建立独立模拟副本，处理幂等事件与终态冲突；不更新真实payment/settlement/payout-call。默认关闭，可显式开启。 |
| NewAPI公开渠道协议 | `POST /api/resources/{id}/upstream-channel` 及资源usage/say-hi/lifecycle | 实际调用NewAPI公开渠道接口，验证映射、双认证、状态和结果；配额保持原单位，不猜测兑换成美元。 |
| 资源执行可靠性 | 原提交/OAuth/生命周期/代理替换入口 | 严格响应业务状态、资源身份与绑定确认；持久化凭据更新及本地资源效果；重复请求不再次提交；不明确结果保持UNKNOWN。 |

## 配置

- 监控配置包含enabled、includeInTotal、supplierVisible和JSON字段路径；NewAPI可配置Bearer与newApiUserId，读取`/api/log/stat`等管理员允许的JSON监控端点。选择正确时间范围由上游端点配置决定，不把累计配额伪造为实时速率。
- 部署脚本首次自动生成`WECOM_ENCRYPTION_KEY`（Base64的32字节随机密钥）并在后续部署保留；已有环境可在`.env.production`添加密钥。密钥轮换后需重新保存机器人Webhook。
- `PAYMENT_SANDBOX_ENABLED=false`默认关闭；改为true后可通过管理员付款详情建立隔离模拟。真实在线通道不包含模拟通道。
- 资金通道页面可选择官方原生/自有中台；官方原生凭据、网络标识、审核账户与beneficiary版本映射均需管理员显式维护。
- 资源目标页面可选择CUSTOM或NEWAPI。CUSTOM必须提供兼容实现；NEWAPI必须提供管理员Token与用户ID。后台私有CCMAX任务不发送到不支持该协议的NEWAPI目标。

## 联网依据

协议细节和逐项来源分别在[原生支付实现](native-payment-implementation.md)、[后台任务协议](job-executor-protocols.md)、[资源与代理实现](resource-integration-implementation.md)。主要第一方依据包括：

- [Airwallex Transfers API](https://www.airwallex.com/docs/api/2025-06-30/payouts/transfers)与[转账状态](https://www.airwallex.com/docs/payouts/transfers/create-a-transfer/transfer-statuses)。
- [OKX官方V5文档](https://www.okx.com/docs-v5/en/)。
- [Binance官方Wallet SDK](https://github.com/binance/binance-connector-js/tree/master/clients/wallet)。
- [企业微信群机器人官方文档](https://developer.work.weixin.qq.com/document/path/91770)。
- [NewAPI官方渠道管理](https://doc.newapi.pro/en/api/fei-channel-management/)与[源码](https://github.com/QuantumNous/new-api)。
- IETF [HTTP CONNECT](https://www.rfc-editor.org/rfc/rfc9110.html#section-9.3.6)、[SOCKS5](https://www.rfc-editor.org/rfc/rfc1928)、[SOCKS5认证](https://www.rfc-editor.org/rfc/rfc1929)。

## 尚需真实环境的部分

原站私有CCMAX/OAuth服务器协议未公开，也没有提供兼容上游、真实支付凭据或企业微信机器人。本轮完成了本项目侧接口、公开协议适配和本地协议验收，不能宣称已经连接原站生产服务或成功进行真实资金划转。

Airwallex仅支持已有且匹配审核账户的beneficiary及同币种付款；预检手续费是估计，实际费用另记录。OKX/Binance需要官方支持的网络、账户权限和白名单；Binance需要Travel Rule问卷的账户及本地未建模的Memo/Tag账户明确停止，不猜填合规字段。Airwallex晚退回可手动查原单处理，未接官方Webhook或自动轮询。未发生真实出款、自动开户、自动配置白名单或向原站写入。

## 最终验收记录

- `mvn -q clean package`：118项测试，0失败、0错误、0跳过；含实际PostgreSQL事务与本地HTTP/TLS代理/支付协议fixture。
- `npm run check`与`npm run build`：通过。
- 当前明确前端路径模板218/218匹配；静态后端映射328，运行时路由清单326，统计方式不同，均不代表真实外部账户成功。
- `bash scripts/test-deploy.sh`：17项隔离部署回归通过。
- Docker生产镜像实际构建、空库启动，frontend/backend/postgres健康；仅frontend 0.0.0.0:10001映射；管理员登录与9项通用接口检查通过，新增监控/通道能力/沙箱能力/任务/路由读取5项通过。
- 浏览器验证管理员登录、Airwallex/OKX原生配置表单、NEWAPI目标协议切换、监控用户ID字段；仅打开表单，未提交真实服务配置。
- 生产默认未配置上游、无演示监控，沙箱默认关闭；未发起真实金融请求或向源站写入。

完整后端测试汇总在`docs/api-integration-test-results.json`。本机Docker验收材料位于被Git忽略的`.run/interfaces-validation/`，不包含在提交源码内。
