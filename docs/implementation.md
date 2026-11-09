# 实现方式与边界

本地生产证据版本为0.8.122。原网站使用React，但本项目按要求使用Vue3：App.vue启动Vue，vue-compat.js把恢复业务函数的JSX调用与hooks映射为Vue组件、响应式状态、生命周期、provide/inject和Teleport。没有React或ReactDOM依赖，也没有iframe、远端页面代理或截图背景。原先打包进索引的React、ReactDOM、调度器已删除；Three.js改成独立npm依赖，保留原自定义shader与随机种子。业务模块保留可阅读的美化JS而非冒充原始.vue源码。全部来源映射在frontend/scripts/provenance.json；后续可逐模块迁成SFC，当前所有DOM由Vue管理。

全部14份真实CSS和品牌图片保留在frontend/public/assets，保持精确class与DOM层级，动态导入使用Vite重新构建。页面包括登录注册、工作台、全部供应商业务导航，以及生产证据中的平台管理模块。交付涵盖平台最高管理员、供应商主账号、供应商子账号三种角色。主账号有线上像素基线；管理员和子账号只有生产源码的分支依据，需明确标注无线上像素基线。

后端在前端模块落地后依据其真实调用构建：Spring Boot3、Java17、PostgreSQL16，JDBC和JSONB实体存储、真实Cookie会话、CSRF、BCrypt、租户约束和乐观锁。真实实体写入数据库并可在刷新后恢复，既有源站数据仅作为本地初始化基线。工作台RPM种子取用户提供截图402，运行站点实际RPM会变化。

外部CCMAX/OAuth、代理连通性检测、自动支付等需要原服务凭据和上游系统；未接入的操作返回明确503。UI外观可还原，这类外部业务结果无法由前端证据恢复。数据库保存本地操作，前后端运行均不依赖源站会话。

API文档中的服务器地址使用当前本地 `window.location.origin`，使复制的curl指向本项目；源站版本中的固定域名已替换。这是运行环境配置差异，验收中保留，不能为追求像素分数改回线上域名。
