# 技术方案

## 架构概述

- **页面结构**：保留 `pages/treehole/list` 作为树洞主页；新增 `pages/treehole/publish` 页面。
- **状态管理**：继续使用现有 `miniprogram/stores/treeHoleStore.js` 管理帖子、分页、评论状态。
- **接口调用**：复用 `miniprogram/services/treehole.js` 中的 `/treehole`、`/treehole/:id/comments` 等接口，与 Web 端保持一致。

## 页面实现

### 树洞列表页调整
- 移除原有顶部内嵌发布区域。
- 使用朋友圈风格布局：
  - 头像/昵称/时间头部；
  - 文本内容块；
  - 图片按照数量自适应布局：1 张全宽，2-3 张等宽，4-9 张三列网格；点击触发 `previewImage`。
- 在内容容器右下角新增悬浮发布按钮（`position: fixed`），样式沿用绿色主色圆形按钮，带“+”图标。
- 支持下拉刷新、触底加载：结合 `onPullDownRefresh` 与 `onReachBottom`，利用 store 的 `pagination`。

### 发布页面
- 新建目录 `pages/treehole/publish`：
  - `index.wxml` 带 `nav-header`、文本 `textarea`、图片选择组件（复用 `image-uploader`，限制 9 张）；底部提交按钮。
  - `index.js` 负责管理文本、图片选择与发布逻辑，引用 `publishPost`；发布成功后 `wx.showToast` 并 `wx.navigateBack`。
  - `index.wxss` 使用现有圆角/阴影风格。
  - `index.json` 声明组件。
- 发布逻辑：
  - 校验文本非空。
  - 调用 `publishPost({ content, images })`；限制图片数量，若超过显示提示。
  - 发布成功后触发列表页刷新，可在成功后调用 `loadPosts({ page: 1, pageSize: 10 })`。

## 数据结构
- 接口返回结构参考 Web：`{ items: TreeHolePost[], total, page, limit }`；帖子字段包括 `id`, `content`, `images[]`, `created_at`, `like_count`, `comment_count`, `is_liked`。

## UI 风格
- 主题颜色：沿用 #006633/渐变。
- 匿名头像：使用内置圆形占位（可复用 CSS）。
- 图片九宫格：使用 `flex` + `calc` 控制宽高，或通过 `grid`。

## 测试策略
- 手动测试：
  1. 进入树洞页，验证列表展示、图片预览。
  2. 下拉刷新、触底加载。
  3. 点击点赞、评论按钮确保后端请求正常。
  4. 悬浮按钮跳转发布页；发布空内容提醒；发布含图片成功返回并刷新。
- 若有条件，可在真机或开发者工具模拟器上验证滚动与悬浮按钮。

## 安全与匿名
- 不显示任何真实用户信息。
- 接口调用沿用现有认证机制，自身无需额外 token 处理。
