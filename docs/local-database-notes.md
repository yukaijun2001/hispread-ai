# 本地数据库初始化记录

- 新建独立 PostgreSQL 数据库 hispread_ai，未变更其他已有数据库。
- 种子业务数据来自脱敏 runtime-fixtures.json。线上采集仅授权登录与 GET 请求。
- 三角色密码由 backend/.env 提供，文件权限600，git忽略，文档不记录明文。
- 2026-11-09 一次迁移：仅fixture成员UUID 29488753-d429-4766-885c-55fcd7d04856 且旧用户名ag45时，改为wt_agent45并写入 MEMBER_PASSWORD 的 BCrypt，失效该成员旧session。这是构建期间旧脱敏种子兼容，不是每次启动行为。
- SeedData 只补fixture指定成员缺失的登录记录，不重写后来创建成员，不重置已有账号密码。
- ADMIN种子为本地自建身份，无线上ADMIN证据。管理员页面按捕获前端的权限分支还原，私有后端算法不宣称恢复。
- RPM402是截图参考种子，固定展示，并非当前外部运行数据。
