# 技术方案设计

## 架构概览
- 在仓库根目录新增 `miniprogram/` 目录，遵循微信小程序工程规范，包含 `app.js/json/wxss`、`pages`、`components`、`services`、`utils`、`styles`、`assets` 等子目录。
- 使用微信小程序原生框架开发，必要时引入 `@vant/weapp` 等组件库，通过 `miniprogram_npm/` 安装并在 `app.json` 中声明。
- 所有后端通信统一使用 `backend/` 目录提供的 REST API，不依赖云开发；基础 URL 从 `config/index.js` 读取。

## 会话与认证
- `app.ts`（或 `app.js`）在 `onLaunch` 时调用 `wx.login` 获取 `code` 并请求 `/auth/wechat`，返回数据包括 `token` 与 `emailVerified`。
- 将 `token` 与用户基础信息缓存至 `wx.setStorageSync`，同时写入 `App.globalData`。
- 若 `emailVerified === false`，强制跳转到 `pages/auth/email-verify/index`；在其它页面的 `onShow` 中调用 `ensureVerified()` 防护。
- `logout()` 封装在 `services/auth.js`，清理缓存并重新执行登录流程。

## 网络请求封装
- `services/request.js` 使用 `wx.request` 封装 GET/POST/PUT/DELETE：
  - 统一追加 `Authorization: Bearer ${token}`
  - 拦截 401，触发重新登录逻辑
  - 支持全局 loading（`wx.showNavigationBarLoading`）与错误提示
- 各业务服务 `services/*.js` 调用 `request`，返回标准化数据结构。

## 状态管理
- `utils/createStore.js` 简易响应式 store（发布-订阅），提供 `getState`、`setState`、`subscribe`。
- `stores/` 存放业务模块状态：`authStore`、`noticeStore`、`o2oStore`、`circleStore`、`treeHoleStore`、`lifeStore`、`profileStore`。
- 页面在 `onLoad/onShow` 时订阅对应 store，并在 `onUnload` 时取消订阅。

## 页面与功能模块
### 全局导航
- `app.json` 配置底部 `tabBar`：`home`、`notices`、`o2o`、`circles`、`profile`。
- 每个 tab 页面使用 `Page` 定义，支持下拉刷新与触底加载。

### 首页 `pages/home/index`
- 显示英雄轮播、今日亮点、最新通知、快速入口栅格（通知、O2O、生活地图、圈子、树洞）。
- `onLoad` 调用 `noticeService.fetchHighlights()`、`activityService.fetchHighlights()`。
- 提供“重要通知”banner，未读时高亮。

### 通知
- 列表页 `pages/notices/index`：搜索框、分类筛选、列表卡片，调用 `GET /notices`。
- 详情页 `pages/notices/detail`：展示通知全文，管理员显示编辑删除按钮。
- 管理端入口 `pages/notices/edit`：表单提交 `POST/PUT /notices`。

### O2O
- 列表页 `pages/o2o/index`：筛选器（分类、排序、价格区间），卡片展示；下拉刷新与分页。
- 详情页 `pages/o2o/detail`：图片轮播、卖家信息、点赞按钮。
- 发布页 `pages/o2o/publish`：表单 + 图片上传（使用 `components/image-uploader`），发起 `POST/PUT`。

### 树洞
- 页面 `pages/treehole/index`：匿名帖子列表，下拉刷新、触底加载。
- 发布浮层：文本输入、多图上传；提交 `POST /treehole`。
- 评论抽屉：懒加载评论，支持回复与点赞。

### 圈子
- 列表页 `pages/circles/index`：筛选、加入按钮。
- 详情页 `pages/circles/detail`：标签页切换（介绍、帖子、成员），调用 `GET /circles/:id`。
- 管理页 `pages/circles/manage`：圈主/管理员可编辑信息、审核请求。

### 生活地图与服务
- `pages/life/map`：使用原生 `map` 组件渲染地点，提供类别筛选。
- `pages/activities`：生活指南与活动列表，支持跳转外链或报名。

### 个人中心
- `pages/profile/index`：展示用户信息、认证状态、偏好设置、我的发布/收藏。
- 更换头像使用图片上传后调用 `/users/profile/avatar`。
- 包含“邮箱验证”状态视图，必要时指向验证页。

### 邮箱验证
- `pages/auth/email-verify/index`：提交邮箱、验证码；发送按钮含倒计时。
- 验证成功后写入状态并自动返回之前页。

## 组件与样式
- `components/nav-header`：各页面顶部自定义导航条。
- `components/section-card`、`item-card`、`tag-list`、`load-more`、`empty-state`、`rich-text-viewer`、`image-uploader`。
- 全局样式 `styles/theme.wxss` 定义主色 `#006633`、辅色 `#00a86b`、灰度、阴影、圆角；`styles/typography.wxss` 提供字体与标题样式；`styles/utilities.wxss` 管理布局工具类。
- 所有页面引用主题并保持现代卡片风格，支持浅色/深色主题兼容。

## 资源与配置
- `project.config.json`：`miniprogramRoot: "miniprogram"`、`appid` 留空待填写、源码目录映射、编译配置（ES6、增强编译、URL check）。
- 静态资源放于 `assets/images`, `assets/icons`；引用统一路径。
- `package.json`（可选）配置 `npm run build:mp` 同步 `@vant/weapp`。

## 上传与图片处理
- 使用原生 `wx.chooseMedia` -> `wx.uploadFile` 上传至后端 `/uploads`。
- 统一封装 `uploadImages(files)` 返回 URL 数组，供 O2O、树洞、头像使用。

## 错误与体验
- `utils/toast.js` 封装 `wx.showToast`/`showModal`。
- 请求失败时展示 `components/error-state`，带 Retry。
- 对于加载延迟的页面使用骨架屏（`skeleton` 组件或自定义 shimmer）。

## 测试策略
- 建议添加 `miniprogram/tests/`，使用 `@wechat-miniprogram/simulate` 对 stores 与 services 进行单元测试。
- 编写手工测试清单覆盖：微信登录 + 邮箱验证流程、各模块数据加载、管理员权限操作、图片上传、分页与筛选、异常网络场景。

