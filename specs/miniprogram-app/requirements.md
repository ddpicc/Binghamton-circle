# 需求文档

## 介绍

为现有校园社区平台构建微信小程序端，在不依赖云开发的前提下复用 `backend/` 提供的 REST API，实现与 Web 前端功能对齐的移动体验，并确保界面符合现代审美与微信小程序交互规范。

## 需求

### 需求 1 - 微信身份与邮箱校验

**用户故事：** 作为在校学生，我希望微信小程序在获取我的微信身份后自动完成账号登录，并在未验证学校邮箱时引导我完成邮箱验证，否则无法浏览平台内容。

#### 验收标准

1. While the 用户首次打开小程序, when 页面加载完毕, the mini program shall 调用 `wx.login`/`wx.getUserProfile` 取得微信身份并向后端发起会话校验接口（如 `/auth/wechat`），若校验成功则写入 `wx.setStorage` 中的会话信息。
2. While the 后端返回 `emailVerified = true`, when 会话建立, the mini program shall 跳转进入首页且允许访问全部功能。
3. While the 后端返回 `emailVerified = false`, when 会话建立, the mini program shall 进入邮箱验证流程页并在用户成功验证之前禁用除验证流程以外的页面访问。
4. While the 用户提交学校邮箱地址, when 他们点击发送验证码, the mini program shall 调用 `POST /auth/send-email-verify` 并在成功时提示验证码已发送。
5. While the 用户填写验证码并提交, when 验证通过, the mini program shall 调用 `POST /auth/verify-email` 设置验证状态，随后刷新会话并允许访问其他页面。
6. While the 用户选择退出登录, when 他们确认操作, the mini program shall 清理会话缓存并重新触发微信登录流程。

### 需求 2 - 首页与全局导航

**用户故事：** 作为用户，我希望打开小程序即可看到校园动态概览并快速进入各功能模块。

#### 验收标准

1. While the 用户首次进入首页, when 页面渲染完成, the mini program shall 展示英雄横幅、今日亮点和最新通知摘要。
2. While the 用户在首页滑动, when 他们浏览模块卡片, the mini program shall 提供跳转入口至通知、O2O、生活地图、圈子、树洞等页面。
3. While the 系统检测到未读通知或重要公告, when 用户进入首页, the mini program shall 突出显示置顶或紧急公告标签。
4. While the 用户在任意页面, when they 使用底部 TabBar 或顶级菜单, the mini program shall 在不刷新认证状态的前提下完成页面切换。

### 需求 3 - 重要通知模块

**用户故事：** 作为学生，我希望在小程序中方便地阅读、搜索与筛选学校通知；作为管理员，我需要在移动端创建和维护公告。

#### 验收标准

1. While the 用户进入通知列表页, when 视图加载, the mini program shall 调用 `GET /notices` 并按照置顶优先、发布时间排序展示通知卡片。
2. While the 用户设置搜索关键字或分类筛选, when 他们提交操作, the mini program shall 调用带查询参数的通知接口并刷新结果。
3. While the 用户点击通知卡片, when 详情页展示, the mini program shall 渲染通知正文、发布时间、标签并支持收藏/分享动作。
4. While the 当前用户具有管理员角色, when 他们点击“发布通知”, the mini program shall 提供表单并调用 `POST /notices` 或 `PUT /notices/:id` 完成创建或更新。
5. While the 管理员发起删除操作, when 他们确认, the mini program shall 调用 `DELETE /notices/:id` 并从列表中移除对应通知。

### 需求 4 - O2O 二手与生活服务

**用户故事：** 作为学生，我希望通过小程序浏览、筛选、发布和管理二手交易、租房、拼车等信息。

#### 验收标准

1. While the 用户打开 O2O 列表页, when 页面初始化, the mini program shall 调用 `GET /o2o` 加载默认分页数据并显示价格、标签、成色等摘要。
2. While the 用户调整搜索、分类、排序或价格等筛选条件, when 触发筛选, the mini program shall 以查询参数调用列表接口并刷新结果。
3. While the 用户查看详情, when 他们点击某物品, the mini program shall 调用 `GET /o2o/:id` 并展示图片轮播、描述、过期状态、卖家资料与联系方式。
4. While the 已登录用户点击发布, when 他们提交表单并上传图片, the mini program shall 先上传素材（至服务器/OSS）再调用 `POST /o2o` 创建记录。
5. While the 发布者需要维护信息, when 他们选择编辑或删除, the mini program shall 调用 `PUT /o2o/:id` 或 `DELETE /o2o/:id` 并同步更新本地列表。
6. While the 用户想表达兴趣, when 他们点击点赞, the mini program shall 调用 `POST /o2o/:id/like` 并即时更新点赞状态与数量。

### 需求 5 - 校园树洞（匿名广场）

**用户故事：** 作为学生，我希望可以匿名发布心情、浏览他人帖子并参与互动。

#### 验收标准

1. While the 用户进入树洞页面, when 列表加载, the mini program shall 调用 `GET /treehole` 渲染匿名帖子并支持懒加载或下拉刷新。
2. While the 用户填写匿名帖子内容与图片, when 他们提交, the mini program shall 调用 `POST /treehole` 上传文本和图片引用并显示成功提示。
3. While the 用户浏览帖子, when 他们触发点赞或展开评论, the mini program shall 分别调用 `POST /treehole/:id/like` 和 `GET /treehole/:id/comments`。
4. While the 用户输入评论或回复, when 提交成功, the mini program shall 调用 `POST /treehole/:id/comments` 并局部刷新评论区域。
5. While the 管理员需要维护内容, when 他们执行删除, the mini program shall 调用相关 `DELETE` 接口并在界面隐藏对应记录。

### 需求 6 - 圈子社区

**用户故事：** 作为用户，我希望在不同圈子中浏览与发布话题，并可加入/退出圈子。

#### 验收标准

1. While the 用户访问圈子列表, when 视图加载, the mini program shall 调用 `GET /circles` 并展示标签、成员数、帖子数等信息。
2. While the 用户搜索或筛选圈子, when 他们调整条件, the mini program shall 携带查询参数调用圈子列表接口。
3. While the 用户点击圈子详情, when 页面打开, the mini program shall 调用 `GET /circles/:id` 加载简介、帖子流与成员信息。
4. While the 未加入用户点击加入, when 操作成功, the mini program shall 调用 `POST /circles/:id/join` 并更新成员状态；已加入用户可触发退出接口。
5. While the 圈主或管理员操作圈子管理, when 提交编辑/审核请求, the mini program shall 调用对应 `PUT`/`POST` 接口并刷新界面。
6. While the 用户在圈子中发布帖子或评论, when 提交内容, the mini program shall 调用 `POST /circles/:id/posts` 及相关评论接口，再次拉取最新帖子流。

### 需求 7 - 生活服务与地图

**用户故事：** 作为初到校园的学生，我希望在小程序查看生活地图、活动与指南，快速获取实用信息。

#### 验收标准

1. While the 用户打开生活地图模块, when 地图组件渲染, the mini program shall 调用 `GET /life-map` 加载地点数据并在地图/列表中展示。
2. While the 用户筛选生活类别（餐饮、出行、住宿等）, when 他们切换标签, the mini program shall 更新展示列表与地图点位。
3. While the 用户查看校园活动或生活指南, when 页面加载, the mini program shall 调用 `GET /activities` 或相关接口呈现卡片式内容。
4. While 活动需要报名或外链, when 用户点击操作, the mini program shall 跳转到对应链接或调用报名接口，并给出成功提示。

### 需求 8 - 个人资料与偏好

**用户故事：** 作为用户，我希望在小程序管理个人资料、查看我的发布/收藏，并调整通知偏好。

#### 验收标准

1. While the 用户进入个人中心, when 页面加载, the mini program shall 调用 `GET /users/profile` 并展示头像、昵称、认证状态等信息。
2. While the 用户编辑资料, when 他们提交修改, the mini program shall 调用 `PUT /users/profile` 更新后端并同步缓存。
3. While the 用户查看我的发布或收藏, when 他们切换页签, the mini program shall 调用对应列表接口并支持分页。
4. While the 用户调整通知或隐私偏好, when 他们保存, the mini program shall 调用后端设置接口并提示操作成功。
5. While the 用户需要更换头像, when 他们选择图片, the mini program shall 执行上传后调用 `PUT /users/profile/avatar` 或相关接口更新头像。

### 需求 9 - UI 设计与体验规范

**用户故事：** 作为产品负责人，我希望小程序具备现代美观的视觉体验，符合微信小程序交互规范。

#### 验收标准

1. While the 小程序渲染通用布局, when 页面构建, the mini program shall 应用统一的主题色（高校绿系）、圆角卡片、留白与阴影风格。
2. While the 页面包含表单或列表, when 组件交互, the mini program shall 确保触控友好、支持下拉刷新、骨架屏与空状态。
3. While the 小程序在不同设备上运行, when 检测到不同屏幕尺寸, the mini program shall 保持布局自适应、字体和触控区域符合微信设计规范。
4. While 网络请求进行, when 等待响应, the mini program shall 展示加载状态并在失败时提供重试操作。

### 需求 10 - 系统配置与工程约束

**用户故事：** 作为开发者，我希望项目结构清晰、易于配置后端地址并具备可扩展性。

#### 验收标准

1. While the 项目初始化, when 创建小程序目录结构, the mini program shall 采用 `/miniprogram/` 目录，包含 `app.js/json/wxss`、`pages`、`utils`、`services` 等规范子目录。
2. While the 应用需要访问后端, when 发起请求, the mini program shall 统一从配置文件读取 API 基址并通过封装的 `request` 工具附带 token。
3. While the 项目构建或发布, when 执行构建脚本, the mini program shall 在 `project.config.json` 中包含必要的编译配置与 appid（预留填充）。
4. While the 代码库需要质量保障, when 提交前, the mini program shall 提供至少基础单元/集成测试策略说明并支持模拟数据或拦截器。

