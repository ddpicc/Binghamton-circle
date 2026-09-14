# 实施计划

- [x] 1. 前端注册申请入口
  - 在 `Register.vue` 增加无学校邮箱申请对话框与状态提示。
  - 扩展 `authService` 新增申请、状态查询接口调用。
  - _需求: 1_

- [x] 2. 管理后台审批界面
  - 在 `AdminConfig.vue` 增加“非 edu 邮箱申请”菜单及列表视图。
  - 实现审批操作调用新的管理员 API。
  - _需求: 2_

- [x] 3. 邮件链接注册页面与路由
  - 新建 `NonEduComplete.vue` 页面处理验证码链接并完成账号设置。
  - 更新前端路由与服务接口。
  - _需求: 3_

- [x] 4. 后端数据结构与模型
  - 创建 `non_edu_email_requests`、`email_verification_tokens` 等 Sequelize 模型与迁移。
  - _需求: 2,3,4_

- [x] 5. 后端控制器与路由
  - 扩展 `authController` 和 `adminController` 实现申请提交、审批、完成注册逻辑。
  - 更新 `routes/auth.js`、`routes/admin.js`。
  - _需求: 1,2,3_

- [x] 6. 邮件与令牌服务
  - 在 `emailService` 中添加审批通过/驳回及验证链接邮件模板。
  - 实现一次性令牌生成、验证、失效逻辑。
  - _需求: 3,4_

- [x] 7. 测试与文档
  - 编写/更新后端单元与集成测试；补充 README 或部署说明。
  - _需求: 3,4_
