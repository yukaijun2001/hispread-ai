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

后续更新在相同目录执行 `./deploy.sh`。默认使用仓库的origin和main分支，自动fetch并仅fast-forward更新，然后构建镜像、更新容器、等待健康检查，验证前端、数据库就绪及CSRF接口；任一步失败均以非零状态退出。脚本不会自动安装Docker。首次生成随机数据库密码，并写入 `.env.production`（600权限、Git忽略）；以后保留现有配置及命名卷。平台管理员固定为 `wutong` / `wutong@Qq1.`。若现有文件仍是旧默认用户名 `admin`，下次部署会改成这个账号；已经改成其他用户名时不覆盖密码。运行时使用文件中的凭据，避免当前Shell的开发凭据覆盖生产配置。

首次使用新参数前先更新本地脚本，再运行部署与清理。`--clean` 会自动拉取最新代码、部署并通过健康检查后，才开始清理：

```bash
git pull --ff-only
./deploy.sh --clean
```

此选项不会创建备份。它会在通过范围校验后停止前后端，删除唯一已标记为验收的供应商及本站测试用户、项目、资源记录、报价、账务、会话和附件，保留当前平台管理员及密码、管理员名下的API密钥、所有角色、系统配置、全局上号规则、NewAPI/CCMAX目标和其他上游凭据/支付配置、汇率与非测试品类；不会调用上游。若发现其他供应商/项目/非`qa_`用户、未识别实体类型、运行中任务、附件目录不一致或数据在清理前变化，则拒绝执行并保留数据。清理完须以原管理员重新登录，旧会话已注销。不要对包含真实供应商/项目数据的环境使用。

脚本强制生成 `.run/deploy/ports.yml`，并验证最终Compose配置：前端仅 `0.0.0.0:10001 → 8080/tcp`；backend及postgres不发布任何宿主机端口。Nginx通过Docker网络访问backend，backend通过Docker网络访问PostgreSQL。基础Compose中的默认8088绑定以及其他覆盖文件均不影响这个一键入口。

常用参数：

```bash
./deploy.sh --help
./deploy.sh --branch main --origin http://supplier.example.com:10001
# 首次使用自定义目录/仓库，也可从独立保存的deploy.sh启动，自动clone
bash /tmp/deploy.sh --repo git@github.com:yukaijun2001/hispread-ai.git \
  --dir /opt/hispread-ai --branch main --origin http://你的服务器公网IP:10001
```

支持 `--repo`、`--branch`、`--dir`、`--env-file`、`--origin`、`--project`、`--clean`，对应环境变量见 `--help`。已有目录的分支、origin必须与参数一致。私有仓库通过SSH部署密钥或Git凭据助手认证，URL中禁止夹带密码/token。不要在服务器代码目录直接修改受Git管理的文件；本地修改、未跟踪文件、本地超前提交或分叉会使脚本停止，避免覆盖代码。

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

默认监听127.0.0.1:8088，可用服务器上既有反向代理转发。首次启动只建立平台管理员 `wutong`、角色和基础任务配置，**不导入供应商、成员、项目、报价、截图RPM或任何演示账号**。旧默认账号 `admin` 会在下次启动时改名并同步为 `wutong` / `wutong@Qq1.`；已经是该用户名后，修改文件不会重置数据库密码。

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

`/healthz`为前端liveness；`/api/health/live`为进程liveness；`/api/health/ready`执行数据库SELECT1。迁移由Flyway启动时执行，现有数据库通过baseline0保留。V1/V2建立表和持久会话/索引；V3收紧任务范围；V4仅从角色和用户授权中移除退役的监控权限，保留其余自定义授权、业务数据和会话版本。已执行迁移文件不能修改；后续升级新增迁移。

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

独立的 `deploy/clean-test-data.py` 仅作为 `deploy.sh --clean` 的内部实现；它只允许唯一验收供应商、明确标记的测试项目和 `qa_` 用户。未知数据类型、其他供应商或正式账号会拒绝执行。保留项与删除范围按上节说明；资源关联仅在本站删除，不调用上游移除接口。

```bash
# 在完成部署健康检查后，使用deploy.sh集成的清理选项。
./deploy.sh --clean
```

执行前不创建任何备份。程序在单个数据库事务中比较全部记录指纹，有变化就回滚，然后清理本站附件、注销旧会话，重启并核对管理员和配置未变。数据库提交后附件删除或重启若失败，脚本返回非零并保持前后端停止，不会误报清理完成，也不会自动恢复数据；检查退出信息并修复本地服务状态。全验收清理后只保留原管理员登录；后台只会重建停用的默认计划及历史兼容参数，无演示供应商或项目。此流程不可逆。

## 6. 演示环境

演示模式显式使用额外文件和独立项目名，不能对正式数据库启用：

```bash
# 额外设置SEED/OPERATOR/FINANCE/MEMBER各USERNAME/PASSWORD环境变量
docker compose -p hispread-demo --env-file .env.demo -f docker-compose.yml -f docker-compose.demo.yml up -d --build --wait
```

演示覆盖文件才会挂载 `docs/runtime-fixtures.json` 并创建已有五角色与截图数据。正式版本不依赖这个文件。

## 7. 外部服务

当前范围优先阅读 [控制台收紧实现与验证](../docs/console-scope-implementation-2026-11-16.md)，较早的 [接口补齐与验证](../docs/interface-completion-2026-11-09.md) 保留为历史记录。生产配置固定 `app.payments.online-enabled=false`、`sandbox-enabled=false`，旧 `PAYMENT_SANDBOX_ENABLED` 环境变量不会重新启用生产沙箱。后台只保留可选的交付状态同步；升级默认停用旧计划。网关监控、自动权重轮换、企微外发和财务自动确认已移除。

资源/CCMAX功能通过管理员维护的resource-target适配器接入。目标需HTTPS（HTTP需显式允许）、真实API凭据和本项目约定的上游操作协议；未配置返回503，网络失败/上游拒绝/未知结果会保存可查状态。接口适配测试使用本地fixture，不代表已经连接原站私有服务。

当前付款仅走线下申请、独立审核、真实转账结果与凭证登记、供应商到账确认。通道配置、连接测试、预检和新的线上执行均关闭，即使保存过支付凭据也不会创建新的出款。已有 Airwallex/OKX/Binance 或 `HISPREAD_PAYOUT_V1` 款项保留原通道的历史查单；不确定款项继续占用金额，不换通道、不重发。旧支付适配器留用于历史兼容和本地协议测试，`docs/native-payment-implementation.md` 描述历史实现。

## 8. 发布跨架构镜像

仓库提供deploy/build-multiarch.sh，设置REGISTRY与不可变RELEASE_TAG后推送amd64/arm64。服务器使用基础compose叠加docker-compose.images.yml，执行pull再up -d --no-build --wait。此流程需要你自己的镜像仓库登录与权限；本轮未向任何外部仓库发布。
