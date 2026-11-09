# 服务器部署

部署栈为 Nginx → Spring Boot/Java17 → PostgreSQL16。正式 Compose 只发布前端端口，数据库和后端位于内部网络。应用以非root运行、只读根文件系统，上传目录和数据库使用命名卷。登录会话保存在PostgreSQL，重启backend不要求用户重新登录；权限或密码变更仍按session_version失效。

## 1. GitHub一键部署（公网10001）

服务器需Git、Docker Engine24+、Docker Compose ≥2.24.4、Python3、curl，建议2核/4GB内存及足够数据库和附件空间。执行部署的用户需要Docker访问权限和代码目录写权限。在服务器防火墙/云安全组放行TCP10001。

把本次源码提交并推送到GitHub后，首次部署执行：

```bash
git clone https://github.com/yukaijun2001/hispread-ai.git /opt/hispread-ai
cd /opt/hispread-ai
./deploy.sh --origin http://你的服务器公网IP:10001
```

后续更新在相同目录执行 `./deploy.sh`。默认使用仓库的origin和main分支，自动fetch并仅fast-forward更新，然后构建镜像、更新容器、等待健康检查，验证前端、数据库就绪及CSRF接口；任一步失败均以非零状态退出。脚本不会自动安装Docker。首次生成随机数据库/管理员密码并写入 `.env.production`（600权限、Git忽略）；以后保留原密码及命名卷。运行时使用文件中的凭据，避免当前Shell的开发凭据覆盖生产配置。初始管理员用户名默认 `admin`，密码在服务器的该文件中查看；修改文件不重置数据库内已有管理员密码。

脚本强制生成 `.run/deploy/ports.yml`，并验证最终Compose配置：前端仅 `0.0.0.0:10001 → 8080/tcp`；backend及postgres不发布任何宿主机端口。Nginx通过Docker网络访问backend，backend通过Docker网络访问PostgreSQL。基础Compose中的默认8088绑定以及其他覆盖文件均不影响这个一键入口。

常用参数：

```bash
./deploy.sh --help
./deploy.sh --branch main --origin http://supplier.example.com:10001
# 首次使用自定义目录/仓库，也可从独立保存的deploy.sh启动，自动clone
bash /tmp/deploy.sh --repo git@github.com:yukaijun2001/hispread-ai.git \
  --dir /opt/hispread-ai --branch main --origin http://你的服务器公网IP:10001
```

支持 `--repo`、`--branch`、`--dir`、`--env-file`、`--origin`、`--project`，对应环境变量见 `--help`。已有目录的分支、origin必须与参数一致。私有仓库通过SSH部署密钥或Git凭据助手认证，URL中禁止夹带密码/token。不要在服务器代码目录直接修改受Git管理的文件；本地修改、未跟踪文件、本地超前提交或分叉会使脚本停止，避免覆盖代码。

未设置origin时，优先复用现有非localhost的10001访问地址，再自动检测公网IPv4。域名、NAT或多网卡环境请显式提供 `--origin`，必须是实际浏览器访问的 `http(s)://主机:10001`，不带路径。HTTPS需要已有外部入口在10001终止TLS并转发；脚本根据scheme设置Secure Cookie，本身提供HTTP，不签发证书、不启用额外的80/443端口。已有TLS/Caddy项目应使用独立Compose项目名与此入口区分。

更新会替换容器，可能有短暂中断；不会执行 `compose down` 或删除卷。数据库迁移由应用启动时执行，升级前按第5节备份；脚本不承诺自动回退数据库迁移。项目名默认 `hispread`，后续保持相同 `--project`、代码目录和环境文件，以继续使用相同数据卷。部署锁在代码目录旁的 `目录.deploy-lock`，异常断电后只有确认无部署进程时才移除遗留锁。

```bash
docker compose -p hispread --env-file .env.production \
  -f docker-compose.yml -f .run/deploy/ports.yml ps
docker compose -p hispread --env-file .env.production \
  -f docker-compose.yml -f .run/deploy/ports.yml logs --tail=100 backend
python3 deploy/smoke-test.py --url http://你的服务器公网IP:10001 --env-file .env.production
bash scripts/test-deploy.sh  # 隔离的Git/部署脚本回归验证
```

## 2. 手动部署与已有反向代理

以下为已有反向代理环境的手动入口。其基础Compose默认监听127.0.0.1:8088，与上一节的一键公网10001入口使用不同配置：

```bash
cd /opt/hispread-ai
./deploy/init-env.sh .env.production
# 编辑 PUBLIC_ORIGIN、HTTP_BIND/PORT，妥善保管生成的管理员和数据库密码
# HTTPS部署时 PUBLIC_ORIGIN=https://你的域名，COOKIE_SECURE=true
docker compose --env-file .env.production up -d --build --wait
```

默认监听127.0.0.1:8088，可用服务器上既有反向代理转发。首次启动只建立ADMIN账号、角色和基础任务配置，**不导入供应商、成员、项目、报价、截图RPM或任何演示账号**。仅首次缺失时创建管理员；后续修改.env的ADMIN_PASSWORD不会重置已有密码，应在管理台执行密码修改。

访问PUBLIC_ORIGIN使用ADMIN_USERNAME/ADMIN_PASSWORD登录，再创建运营、财务、供应商、项目并分配归属/权限。职责收紧策略见 `docs/security-role-matrix.md`。开发用backend/.env不会复制进镜像。

## 3. 手动HTTPS与域名

可使用服务器已有Nginx/负载均衡器终止HTTPS并转发127.0.0.1:8088。必须把PUBLIC_ORIGIN设为用户实际访问的完整origin（scheme+host+port，无路径），COOKIE_SECURE=true。边缘代理必须覆盖客户端X-Forwarded-Proto、Host等转发头。

也可用内附Caddy自动申请证书。DNS先指向服务器，开放80/443，在.env.production加入DOMAIN和ACME_EMAIL，并设PUBLIC_ORIGIN和COOKIE_SECURE：

```bash
docker compose --env-file .env.production -f docker-compose.yml -f docker-compose.tls.yml up -d --build --wait
```

Caddy数据卷保存ACME账户与证书。该自动证书流程需真实DNS和公网入站条件，本地验收没有申请公网证书。

## 4. 健康、日志、手动更新

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

## 5. 备份与恢复

```bash
ENV_FILE=.env.production ./deploy/backup.sh
# 恢复会替换现有数据，只有明确恢复时执行
ENV_FILE=.env.production ./deploy/restore.sh backups/时间目录 --replace-data
```

备份目录权限仅当前用户，包含pg_dump自包含数据库备份和上传文件压缩包。金融业务需维护窗口暂停写入，保证数据库与文件快照一致；离机保存并加密备份。.env/数据库密码不在备份里，应单独保存。恢复脚本会停前后端并保留数据库服务，恢复后重启健康检查。普通 `docker compose down` 不删卷；`down -v` 会删除持久数据，勿用于升级。

会话/用户/上传数据均有隐私和凭据，生产需结合服务器磁盘加密和备份权限。当前JSONB资源secret未接入KMS字段加密，部署前按实际凭据敏感性决定管理要求。

## 6. 演示环境

演示模式显式使用额外文件和独立项目名，不能对正式数据库启用：

```bash
# 额外设置SEED/OPERATOR/FINANCE/MEMBER各USERNAME/PASSWORD环境变量
docker compose -p hispread-demo --env-file .env.demo -f docker-compose.yml -f docker-compose.demo.yml up -d --build --wait
```

演示覆盖文件才会挂载 `docs/runtime-fixtures.json` 并创建已有五角色与截图数据。正式版本不依赖这个文件。

## 7. 外部服务

资源/CCMAX功能通过管理员维护的resource-target适配器接入。目标需HTTPS（HTTP需显式允许）、真实API凭据和本项目约定的上游操作协议；未配置返回503，网络失败/上游拒绝/未知结果会保存可查状态。接口适配测试使用本地fixture，不代表已经连接原站私有服务。

支付通道只读认证测试支持文档所列Airwallex/OKX/Binance；缺少真实账户凭据时返回503。资金执行另通过显式 `HISPREAD_PAYOUT_V1` 支付中台协议提供受控适配入口：管理员配置公网HTTPS地址和中台密钥后，已有独立审核的付款才可预检、执行和查询原操作。默认未配置时不执行；官方钱包原生转账/提币没有直接实现，实际出款由你对接的支付中台负责。测试使用本地HTTP fixture，未进行真实资金划转。相关边界详见 `docs/payment-provider-protocols.md` 与最终接口对账报告。

## 8. 发布跨架构镜像

仓库提供deploy/build-multiarch.sh，设置REGISTRY与不可变RELEASE_TAG后推送amd64/arm64。服务器使用基础compose叠加docker-compose.images.yml，执行pull再up -d --no-build --wait。此流程需要你自己的镜像仓库登录与权限；本轮未向任何外部仓库发布。
