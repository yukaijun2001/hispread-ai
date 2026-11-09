# 后端实现与验证

运行栈：Java17、Spring Boot3.5.7、PostgreSQL16、JDBC JSONB。源码位于backend/src/main/java/com/hispread/ai，schema位于src/main/resources/schema.sql。

认证使用HttpOnly/SameSite Cookie session、登录更换session ID、CSRF常量时间校验、BCrypt与失败限流。强制改密与首次建档由服务器拦截业务API，返回PASSWORD_CHANGE_REQUIRED或ONBOARDING_REQUIRED。账户停用、密码重置、强制登出通过session_version使旧会话失效。密码复杂度、注册审核以及新会话有效期读取持久化系统策略。

租户数据保存在hub_entity的kind/owner_id/data JSONB/version中，写入采用乐观版本条件更新。ADMIN、OPERATOR、FINANCE为独立本地平台账号，supplierId=null，以业务权限控制跨供应商范围；供应商主账号和成员保留所属supplierId；普通成员日账和资源进一步按creatorId/createdBy筛选，部门管理员仅管理本组。平台编码与备注动作由具备supplier.write的平台身份执行，供应商主账号不能越权执行。代理绑定资源响应仅公开UI表格需要的六个字段。

已实现的本地数据流程包括登录注册和建档、用户角色、供应商资料与审核、账户审核、项目、报价及审核、资源草稿与NewAPI资料、团队与分组、金额来源、结算、人工付款与到账核对、汇率、报表与CSV、通知实际投递与撤回、审计、代理配置、配置和策略。工作台资金总览从已确认结算按币种汇总，待办按当前身份和数据库状态生成。

API文档的21个CCMAX Bearer操作均有路由与权限边界。密钥生成/重置时仅返回一次明文，数据库存SHA256。无效、到期、撤销、所属账号禁用时401。代理导入真实入库，资源与日汇总按租户读取；依赖真实外部OAuth/CCMAX/支付/代理检测的动作返回503。未连接上游时不宣称已经创建账号、应用代理或发送资金。

真实PostgreSQL验证：AdminIntegrationTest4、BackendIntegrationTest6、SupplierBusinessIntegrationTest10、PlatformFinanceIntegrationTest4、RolePolicyIntegrationTest4、OperatorFinanceIntegrationTest6，共34项，全部通过。具体结果见backend-test-results.json。测试覆盖CSRF、会话、强制改密、租户隔离、秘密投影、乐观锁、Bearer撤销、报价审批、成员范围、通知、结算及付款幂等。测试事务回滚，临时随机测试账号不保留。

当前实现证据只证明前端原产物及用户授权供应商数据。ADMIN后端为本地重建，原站私有算法与外部执行能力不宣称已经恢复。RPM402为截图参考固定种子。

五个内置角色均已完成：最高管理员61权限，运营33权限，财务28权限，供应商主账号27权限，子账号按项目和部门授权。OPERATOR/FINANCE默认权限由本地RolePolicy定义，原前端证据没有提供生产默认分配。默认策略仅迁移旧无标记version0空内置角色；管理员已编辑或清空的授权保留。菜单和所有业务接口分权测试、角色降级清除旧权限与会话失效见five-role-test-results.json；真实浏览器和最终服务状态见five-role-browser-qa.json和five-role-final-runtime.json。
