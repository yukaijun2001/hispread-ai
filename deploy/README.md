# 服务器部署

部署栈为 Nginx → Spring Boot/Java17 → PostgreSQL16。正式 Compose 只发布前端端口，数据库和后端位于内部网络。应用以非root运行、只读根文件系统，上传目录和数据库使用命名卷。登录会话保存在PostgreSQL，重启backend不要求用户重新登录；权限或密码变更仍按session_version失效。

## 1. 准备与初始化

服务器需Docker Engine24+、Compose v2.20+，建议2核/4GB内存及足够数据库和附件空间。将完整 `hispread-ai` 目录复制到服务器：

```bash
cd /opt/hispread-ai
./deploy/init-env.sh .env.production
# 编辑 PUBLIC_ORIGIN、HTTP_BIND/PORT，妥善保管生成的管理员和数据库密码
# HTTPS部署时 PUBLIC_ORIGIN=https://你的域名，COOKIE_SECURE=true
docker compose --env-file .env.production up -d --build --wait
```

默认监听127.0.0.1:8088，可用服务器上既有反向代理转发。首次启动只建立ADMIN账号、角色和基础任务配置，**不导入供应商、成员、项目、报价、截图RPM或任何演示账号**。仅首次缺失时创建管理员；后续修改.env的ADMIN_PASSWORD不会重置已有密码，应在管理台执行密码修改。

访问PUBLIC_ORIGIN使用ADMIN_USERNAME/ADMIN_PASSWORD登录，再创建运营、财务、供应商、项目并分配归属/权限。职责收紧策略见 `docs/security-role-matrix.md`。开发用backend/.env不会复制进镜像。

## 2. HTTPS与域名

可使用服务器已有Nginx/负载均衡器终止HTTPS并转发127.0.0.1:8088。必须把PUBLIC_ORIGIN设为用户实际访问的完整origin（scheme+host+port，无路径），COOKIE_SECURE=true。边缘代理必须覆盖客户端X-Forwarded-Proto、Host等转发头。

也可用内附Caddy自动申请证书。DNS先指向服务器，开放80/443，在.env.production加入DOMAIN和ACME_EMAIL，并设PUBLIC_ORIGIN和COOKIE_SECURE：

```bash
docker compose --env-file .env.production -f docker-compose.yml -f docker-compose.tls.yml up -d --build --wait
```

Caddy数据卷保存ACME账户与证书。该自动证书流程需真实DNS和公网入站条件，本地验收没有申请公网证书。

## 3. 健康、日志、更新

```bash
docker compose --env-file .env.production ps
docker compose --env-file .env.production logs --tail=100 backend
python3 deploy/smoke-test.py --url https://你的域名 --env-file .env.production
# 更新前备份，记录旧IMAGE_TAG和镜像，再构建更新
docker compose --env-file .env.production up -d --build --wait
```

`/healthz`为前端liveness；`/api/health/live`为进程liveness；`/api/health/ready`执行数据库SELECT1。迁移由Flyway启动时执行，现有数据库通过baseline0保留，V1/V2为幂等初始表和持久会话/索引迁移。已执行迁移文件不能修改；后续升级新增V3/V4等。

日志使用Docker json-file轮转（10MB×3/服务），响应X-Request-ID与错误traceId可关联。未知错误不向客户端输出堆栈/秘密。优雅关闭40秒，付款和授权不确定状态应查询原操作，不能盲目重新提交。

当前已实测镜像架构为本机Docker的linux/arm64。部署到常见linux/amd64服务器可直接在服务器执行构建，或用 `docker buildx build --platform linux/amd64` 构建并发布相应镜像；不可将arm64镜像当作amd64镜像交付。镜像基础版本固定，但tag仍可更新，正式发布可再锁定组织审核过的digest。

## 4. 备份与恢复

```bash
ENV_FILE=.env.production ./deploy/backup.sh
# 恢复会替换现有数据，只有明确恢复时执行
ENV_FILE=.env.production ./deploy/restore.sh backups/时间目录 --replace-data
```

备份目录权限仅当前用户，包含pg_dump自包含数据库备份和上传文件压缩包。金融业务需维护窗口暂停写入，保证数据库与文件快照一致；离机保存并加密备份。.env/数据库密码不在备份里，应单独保存。恢复脚本会停前后端并保留数据库服务，恢复后重启健康检查。普通 `docker compose down` 不删卷；`down -v` 会删除持久数据，勿用于升级。

会话/用户/上传数据均有隐私和凭据，生产需结合服务器磁盘加密和备份权限。当前JSONB资源secret未接入KMS字段加密，部署前按实际凭据敏感性决定管理要求。

## 5. 演示环境

演示模式显式使用额外文件和独立项目名，不能对正式数据库启用：

```bash
# 额外设置SEED/OPERATOR/FINANCE/MEMBER各USERNAME/PASSWORD环境变量
docker compose -p hispread-demo --env-file .env.demo -f docker-compose.yml -f docker-compose.demo.yml up -d --build --wait
```

演示覆盖文件才会挂载 `docs/runtime-fixtures.json` 并创建已有五角色与截图数据。正式版本不依赖这个文件。

## 6. 外部服务

资源/CCMAX功能通过管理员维护的resource-target适配器接入。目标需HTTPS（HTTP需显式允许）、真实API凭据和本项目约定的上游操作协议；未配置返回503，网络失败/上游拒绝/未知结果会保存可查状态。接口适配测试使用本地fixture，不代表已经连接原站私有服务。

支付通道只读认证测试支持文档所列Airwallex/OKX/Binance；缺少真实账户凭据时返回503。资金执行另通过显式 `HISPREAD_PAYOUT_V1` 支付中台协议提供受控适配入口：管理员配置公网HTTPS地址和中台密钥后，已有独立审核的付款才可预检、执行和查询原操作。默认未配置时不执行；官方钱包原生转账/提币没有直接实现，实际出款由你对接的支付中台负责。测试使用本地HTTP fixture，未进行真实资金划转。相关边界详见 `docs/payment-provider-protocols.md` 与最终接口对账报告。

## 7. 发布跨架构镜像

仓库提供deploy/build-multiarch.sh，设置REGISTRY与不可变RELEASE_TAG后推送amd64/arm64。服务器使用基础compose叠加docker-compose.images.yml，执行pull再up -d --no-build --wait。此流程需要你自己的镜像仓库登录与权限；本轮未向任何外部仓库发布。
