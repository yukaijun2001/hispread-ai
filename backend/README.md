# Hispread AI 后端

Java 17、Spring Boot 3.5.7、PostgreSQL 16、Spring JDBC。所有业务接口保留证据中的 `/api` 路径与直接 JSON 响应，浏览器通过同源 Cookie session 和 CSRF token 调用。

```sh
createdb hispread_ai
cp .env.example .env
# 编辑 .env，填写 SEED_USERNAME、SEED_PASSWORD 与数据库配置
./run.sh
```

首次空库必须设置 `SEED_USERNAME` / `SEED_PASSWORD`，密码需8–64字符并包含大小写字母、数字及符号。种子从 `../docs/runtime-fixtures.json` 导入（可设 `FIXTURES_PATH`）；不会连接源站或改源站数据。已有库不会重置用户密码或覆盖业务记录。登录凭据仅放被忽略的 `.env`，不写源码。

默认监听8080。前端Vite代理必须保留浏览器Host（changeOrigin:false）；生产用同源反代。数据库环境变量为 `DATABASE_URL`（JDBC URL）、`DATABASE_USER`、`DATABASE_PASSWORD`。文件存储在`data/uploads`，可通过 `UPLOAD_DIRECTORY` 配置持久卷。

- `hub_user` 保存 BCrypt 密码、用户资料和会话失效版本。
- `hub_entity` 保存有种类、租户、版本与时间戳的 PostgreSQL JSONB 业务记录；更新采用数据库条件版本，冲突返回409。
- 登录时更换session ID；写请求必须携带`GET /api/auth/csrf`所给头名与token；未登录401，无权限403。
- 所有供应商读写以supplierId隔离，成员资源进一步按创建人过滤。注册会建立独立租户。
- 报价新增进入PENDING；审核权限仅平台角色可用。代理配置可持久化，检测与未配置的外部OAuth/CCMAX/支付调用返回503，消息明确未执行外部操作。
- API密钥仅创建/重置时返回明文，数据库保存SHA256。种子成员由 `MEMBER_USERNAME` / `MEMBER_PASSWORD` 提供本地初始账号；未提供密码时为随机不可恢复值。`ADMIN_USERNAME` / `ADMIN_PASSWORD` 创建独立本地最高管理员。

执行`mvn test`使用真实PostgreSQL，在事务内创建随机测试账号与数据并回滚；不会使用H2。先启动一次完成种子初始化，再运行测试。执行`mvn package`构建可执行jar。

`/api/open/v1/ccmax` 已实现文档21操作的 Bearer 鉴权入口。项目、代理、资源、日汇总为本地真实读取，代理导入写 PostgreSQL；OAuth、凭据刷新、上游提交与维护执行返回503。无密钥、无效/撤销/到期密钥返回401。

本地最高管理员支持用户/角色、供应商与收款账户审核、系统与接收策略、通知实际投递和撤回、审计、资源接口和资金通道配置。任务默认停用且 ready=false，不生成虚假运行记录。工作台按确认结算数据计算资金概览。

此实现还原证据可见的供应商及平台流程。原站私有结算算法、付款通道、上游资源创建能力未从前端证据恢复，不应将本地数据流转视为真实资金到账或外部资源创建。
