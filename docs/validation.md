# 验证记录

日期：2026-11-09（Asia/Shanghai）。

最新接口补齐验证：完整 `mvn -q clean package` **118项通过，0失败/错误/跳过**，前端check/build通过，Docker生产3服务健康且仅前端10001公开，部署17项回归通过。新增后台执行、监控、代理、原生支付及沙箱详见 [接口补齐与验证](interface-completion-2026-11-09.md)；下文较小测试数量和“未构建Docker”等为历史阶段记录。

## 当前专业权限收紧（取代历史默认策略）

当前策略为 security-role-policy-v3，由本轮用户明确授权的本地专业职责设计定义。最终完整 `mvn package` 48项真实PostgreSQL测试全部通过，0失败/错误/跳过。对象授权、同职责自定义角色上限、运营归属隔离、成员本人/部门及当前项目授权、资料白名单、敏感SDK投影、供应商停用、角色迁移、独立付款审核及账户快照变更失效均有回归。最终运行、浏览器与临时数据清理记录索引见 security-hardening-validation.json；五角色矩阵见 security-role-matrix.md。以下33/34项和三角色24项属于历史阶段，不代表本轮最终策略。

## 五角色补充

已补齐 OPERATOR 与 FINANCE 的非空默认权限、真实登录账号、平台数据范围和业务授权。新增 RolePolicyIntegrationTest 4项与 OperatorFinanceIntegrationTest 6项；完整 `mvn package` 共34项通过，无失败、错误或跳过。角色迁移、降级移除旧权限、附加角色保留、会话失效、最高管理员专属入口、运营与财务的业务写权限边界，以及本地财务闭环均有 PostgreSQL 测试。

五角色浏览器和重启结果见 five-role-browser-qa.json、five-role-final-runtime.json；新增截图报告位于 ../ui-review/five-role/report.html。新增两角色60个路由场景中31个可达、29个按权限拒绝，预期访问与实际一致、runtime错误0、最终失败页面GET0；6次禁止写操作均返回403。运营与财务各8个弹层已打开核对，另临时创建1个本地PENDING账户验证财务审核控件，未提交审批，随后按精确ID和qaMarker清理2条临时实体（余0），记录见five-role-account-review-qa.json。下方三角色报告和24项测试记录保留为历史基线，五角色最终测试数量以 five-role-test-results.json 为准。

## 前端

`npm run check` 与 `npm run build` 均成功。84个恢复业务模块使用Vue3渲染，14份真实CSS、品牌图片、Three shader保留；依赖中无React/ReactDOM。浏览器验证事件、Context、Teleport、ref、状态更新和effect卸载；已修复focus/blur冒泡与组件名称警告。

## 三角色浏览器与访问边界

- ADMIN：29个可达路由/账务标签，运行错误0，页面GET失败0。
- SUPPLIER：14个可达视图，运行错误0，页面GET失败0。
- SUPPLIER_AGENT：13个视图，5个可达、8个按权限拒绝；运行错误0，页面GET失败0。拒绝范围包括主账号报价/资料、管理员系统、API文档、普通成员部门账单等。
- 临时部门管理员：部门账单与成员管理2个视图可达；测试后恢复原部门配置与成员权限，`restored=true`。

原始记录：role-browser-qa.json、group-admin-qa.json、runtime-qa.json。角色测试仅本地可逆操作；线上只执行登录和读取。

## 视觉与结构

ui-review/report.html包含60个Tab：24个线上/本地配对视图、36个管理员/成员本地视图。配对图像B档一致度98.62%–100%，平均99.69%，44个差异区域、0个P0区域。309处主要元素的实测DOM边界全部精确一致，计算样式差异0。此为抽样结构证据，不是全元素设计验收或全站满分。

当前源站入口已变为index-CJ4rElNB.js，品牌改成Supplier；实现保留用户附件和本地证据index-Dnr0i-H9.js中的Hispread AI。实时RPM、日期、汇率顺序、脱敏个人资料和本地API origin造成的数据差异保留。管理员/成员没有线上视觉账号，36个本地Tab不判像素通过。报告已修正技能默认聚合100分的误导性输出，overall_score为null，详见ui-review/QA-NOTES.md。

## 后端与PostgreSQL

最终完整 `mvn package` 成功，24项真实PostgreSQL集成测试全部通过（0失败、0错误、0跳过）。测试使用事务回滚，临时测试数据不保留。完整最终测试结果在backend-test-results.json及backend/target/surefire-reports；打包产物backend/target/hispread-ai-1.0.0.jar。

覆盖认证/CSRF/强制改密/首次建档门槛、BCrypt、会话与Bearer撤销、租户与成员范围、版本冲突、平台编码备注权限、敏感响应字段投影、报价审核和已生效价格、成员真实登录/部门管理、NewAPI资料幂等/项目类型/管理员正确租户报价、结算快照/确认、线下凭证付款/超付/重复关闭占用/收款、真实CSV/XLSX内容与文件权限。

本地完成的平台录入真实应付→生成结算→供应商确认→登记线下付款凭证→供应商确认到账闭环不调用外部资金通道。未配置的CCMAX/OAuth、支付执行、代理探测返回明确503。敏感NewAPI原材料在本地JSONB中持久化，尚未接入独立密钥管理与字段加密；不能将此本地复刻视为原站生产后端或完整上游系统。

## 部署配置

`docker compose --env-file backend/.env config --quiet` 已通过配置校验；未构建或启动Docker服务，当前使用本机PostgreSQL和Java17运行。Dockerfile与compose可供独立环境使用。凭据文件backend/.env权限600并被忽略；文档不包含初始化密码。

本轮最终浏览器与业务验收：110个角色路由场景运行错误0、失败页面GET0；运营归属隔离通过；两名独立财务真实UI付款申请PENDING且已付0、自审403、独立APPROVED后登记SUCCEEDED且已付12.50。临时付款、结算、2份凭证及上传文件清理后0残留，当前和迭代中创建的3个临时审核账号均清理。图文报告在 ../ui-review/permission-hardening/report.html，机器证据索引为security-hardening-validation.json。
