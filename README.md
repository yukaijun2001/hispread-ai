# Hispread AI 管理台

Vue 3 + Vite 前端、Spring Boot 3 / Java 17 后端、PostgreSQL 16 数据库。根据 `../evidence/前端` 的生产证据0.8.122恢复，保留原CSS、品牌资源与业务交互。后端依据已完成的前端真实接口实现；本地数据独立于源站。

## 本机启动

需要 Node ≥22、Java17、Maven3.9+、PostgreSQL16。新建独立数据库 `hispread_ai`，配置环境变量：

```bash
cd /Users/yukaijun/account-booster/hispread-ai
cp .env.example .env
# 编辑 .env 中的数据库连接与本地初始账号密码
cd frontend && npm ci && cd ..
./scripts/dev.sh
```

访问 http://127.0.0.1:5173 ，后端 http://127.0.0.1:8080/api/health 。首次启动从环境变量初始化账号、项目、报价、部门与汇率；后续启动读取已保存数据，不重置。

本次工作环境已创建独立 `hispread_ai` 数据库；五类本地初始登录凭据保存在权限600且被忽略的 `backend/.env`：`ADMIN_USERNAME/PASSWORD` 为平台最高管理员（`local_admin`），`OPERATOR_USERNAME/PASSWORD` 为平台运营（`local_operator`），`FINANCE_USERNAME/PASSWORD` 为财务人员（`local_finance`），`SEED_USERNAME/PASSWORD` 为供应商主账号，`MEMBER_USERNAME/PASSWORD` 为供应商团队成员（本机账号 `wt_agent45`）。主账号与用户提供账号相同。启动脚本自动读取根目录 `.env`，若不存在则读取 `backend/.env`。不要提交凭据文件。本机运行 `python3 scripts/credentials.py` 查看五个账号名，添加 `--passwords` 可在你自己的终端查看本地初始化密码。

## Docker

服务器使用根目录的 `deploy.sh` 一键更新部署。它从 GitHub 的 `main` 分支拉取最新提交、构建镜像并启动服务，**只发布前端 `0.0.0.0:10001`**，后端和 PostgreSQL 均不映射宿主机端口。首次部署自动生成权限为600的 `.env.production`；后续部署保留密码、数据库和上传文件。

```bash
git clone https://github.com/yukaijun2001/hispread-ai.git /opt/hispread-ai
cd /opt/hispread-ai
./deploy.sh --origin http://你的服务器公网IP:10001

# 后续更新，在相同目录再次执行
./deploy.sh
```

服务器需要 Git、Docker Engine、Docker Compose ≥2.24.4、Python3、curl，并在防火墙/安全组放行TCP10001。未指定 `--origin` 时复用已有公网访问地址，首次尝试检测公网IPv4；有域名或NAT时应显式指定用户实际访问的地址。GitHub私有仓库使用SSH部署密钥或Git凭据助手。工作区有未提交修改、本地独有提交或分叉时停止更新。

生产模式仅初始化管理员，不导入演示供应商/项目。初始化密码保存在 `.env.production`，更改该文件不重置数据库中已有管理员密码。参数、日志、备份及手动代理部署方式见 [deploy/README.md](deploy/README.md)。

以下演示环境需显式加 `-f docker-compose.demo.yml`，不用于生产数据。

```bash
cp .env.example .env
# 设置五类账号密码：ADMIN_*、OPERATOR_*、FINANCE_*、SEED_*、MEMBER_*，以及DATABASE_PASSWORD
# Docker 使用独立持久卷，数据库不发布端口；前端默认8088
# 设置 PUBLIC_ORIGIN=http://localhost:8088 和 COOKIE_SECURE=false用于本地演示
docker compose --env-file .env -f docker-compose.yml -f docker-compose.demo.yml up -d --build --wait
```

仅演示覆盖文件读取挂载的 `docs/runtime-fixtures.json`。正式服务器初始化不依赖该文件。数据库、会话和上传文件持久化，Flyway负责数据库迁移。

## 验证

```bash
cd frontend
npm run build
npm run check
cd ../backend
mvn test
```

后端集成测试使用真实PostgreSQL；测试不会依赖源站，不会调用源站业务写接口。完整执行记录见 [docs/validation.md](docs/validation.md)。UI验收入口见 `ui-review/report.html`，覆盖清单、截图、问题与不能确认项在报告中列出。

## 源码与证据

- `frontend/src/App.vue`、`main.js`：Vue应用入口。
- `frontend/src/runtime/vue-compat.js`：将恢复的业务函数映射为Vue组件、响应式状态与生命周期，唯一DOM渲染器为Vue。无React/ReactDOM依赖。
- `frontend/src/recovered/`：84个可阅读业务模块，已删除打包的React渲染器，保留真实DOM/事件/校验/接口。
- `frontend/public/assets/`：14份原CSS与品牌图；粒子动画使用Three.js和恢复的原shader。
- `backend/src/main/java/com/hispread/ai/`：会话/权限/CSRF、PostgreSQL存储与业务控制器。
- `docs/evidence-core.md`、`evidence-domain.md`：源码阅读、字段与接口契约。
- `docs/rea-evidence.md`：REA静态/运行证据ID及覆盖限制。
- `docs/implementation.md`：恢复方法和技术边界。

## 业务覆盖与边界

供应商视图包含登录注册、首次建档、工作台、报价表内编辑/调价/撤回、日账/部门账单/金额确认/收款/汇率、交付/待分配、代理管理、部门成员、应收报表、API文档、个人资料与密码、API密钥。所有本地写入经后端和PostgreSQL保存，Cookie HttpOnly会话，写操作强制CSRF，实体按供应商隔离并使用版本冲突校验。

源站生产证据也含平台管理员界面，前端已恢复。本轮根据用户要求重新设计并收紧五种身份：运营仅访问已分配供应商，财务只处理财务职责，主账号限本供应商，子账号同时受本人/部门与项目授权限制。付款实行申请与审核分离；最高管理员不能自批付款或代供应商确认。角色编辑和自定义附加角色有服务端职责上限。精确权限和数据范围以 [docs/security-role-matrix.md](docs/security-role-matrix.md) 为准，之前33/28项宽权限属于历史实现，不再是当前策略。

外部支付、CCMAX/OAuth、真实代理探测需要上游服务配置；未配置的执行接口返回503，不代表第三方动作已完成。当前新策略是本地专业化设计，不声称恢复了原站私有权限配置。
历史五角色补充记录保留在 docs/five-role-permissions.md 与 ui-review/five-role/report.html；当前收紧策略见 docs/security-role-matrix.md，最新运行与权限检查见 docs/security-hardening-validation.json。历史截图分数只描述当时版本，不代表本轮授权边界验证。
