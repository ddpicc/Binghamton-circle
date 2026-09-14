# 技术方案设计

## 架构概览

- **页面结构**
  - `pages/circles/list`：圈子广场。包含搜索/筛选条、我的圈子捷径、热门圈子、分页加载。
  - `pages/circles/following`：Following 动态页。专注展示已加入圈子的帖子流，含筛选/刷新、懒加载。
  - `pages/circles/detail`：圈子详情。顶部信息区 + Tab（帖子 / 关于 / 成员），支持发帖、评论、加入/退出。
  - `pages/circles/manage`：圈子管理。管理员可编辑基本信息、查看/调整成员、处理申请。
- **公共组件**（复用 Web 端信息架构，适配小程序 UI）：
  - `components/circle/circle-card`：用于列表和推荐位的圈子卡片。
  - `components/circle/circle-stats`：展示成员/帖子等统计。
  - `components/circle/post-card`：Following 和圈子帖子列表复用。
  - `components/common/empty`、`components/common/skeleton`：统一空状态与加载骨架。
- **状态管理**
  - 扩展 `stores/circleStore`：维护列表、详情、成员、申请、帖子、Following feed 的状态分区。
  - 新增 `stores/postStore`（或在 circleStore 内设 `followingFeed` 状态）管理 `posts/user/circle-posts` 结果。
  - 借助现有 `authStore` 监听登录态，触发圈子数据同步。
- **数据流**
  1. 页面触发 `loadCircles / loadCircleDetail / loadFollowingFeed` 等 store action。
  2. store 调用 `services/circles.js` / `services/posts.js` 请求后端。
  3. 请求失败统一通过 `utils/toast` 反馈，同时写入错误状态以便页面渲染空/错误组件。

## API 与数据契约

| 功能 | HTTP | 路径 | 说明 |
| --- | --- | --- | --- |
| 圈子列表 | GET | `/circles` | 支持 `page, limit, search, category_id, sortBy, sortOrder, is_private` |
| 我的圈子 | GET | `/circles/my` | 需认证，用于 Following 页筛选、列表页“我的圈子”模块 |
| 圈子详情 | GET | `/circles/:id` | 返回基础信息、成员统计、规则、当前用户角色 |
| 加入圈子 | POST | `/circles/:id/join` | 私密圈子返回申请状态 |
| 退出圈子 | POST | `/circles/:id/leave` | 需更新成员/帖子统计缓存 |
| 圈子成员 | GET | `/circles/:id/members` | 支持分页、`role`、`status` 筛选 |
| 待审核申请 | GET | `/circles/:id/pending-requests` | 管理员专用 |
| 处理申请 | POST | `/circles/:id/requests/:memberId/handle` | body: `{ action: 'approve' | 'reject', reason? }` |
| 更新圈子 | PUT | `/circles/:id` | 管理页保存基本信息 |
| 圈子帖子 | GET | `/circles/:id/posts` | 支持分页、排序（`created_at` 等）|
| 发布帖子 | POST | `/posts` | body 含 `circle_id`、`title`、`content`、`images[]` |
| Following feed | GET | `/posts/user/circle-posts` | 支持 `page, limit, circle_id, sortBy, sortOrder` |
| 评论 | POST | `/posts/:postId/comments` | 与树洞等模块共用 |
| 点赞/取消 | POST | `/posts/:postId/like` | Following、详情页互动 |

> **修正项**：现有小程序 `services/circles.js` 中 `quitCircle` 需改为命中 `/leave`；圈子帖子相关接口改用 `/posts` 系列保持与后端一致。

## 页面交互与状态

### 圈子列表 (`pages/circles/list`)
- 顶部搜索区：`<input>` + 分类横向滚动标签 + 排序/权限 `picker`。
- 主体：两列卡片（使用 `flex-wrap` 适配不同屏幕），卡片展示封面/名称/描述/统计/状态标签。
- 附加模块：
  - “我的圈子”横滑列表（使用 `scroll-view` 横向展示最多 10 个）。
  - “热门圈子”瀑布式卡片（按成员数排序请求）。
- 分页：触底自动加载 `loadMore`；下拉刷新重置。
- 加入逻辑：
  - 公开圈子 -> 调用 `/join` 成功后更新 store。
  - 私密圈子 -> 弹窗确认后调用 `/join` 获取申请状态。
  - 接口 401 -> 清 session，导航至邮箱验证页。

### Following (`pages/circles/following`)
- Header：统计加入圈子数量 + “发布帖子”入口（Modal or bottom sheet）。
- 筛选栏：圈子下拉 + 排序（最新/点赞/评论），刷新按钮。
- 内容区：使用 `post-card` 组件，含圈子名、作者、摘要、互动数量、时间。
- 交互：
  - 点击帖子 -> 跳转圈子详情 `?postId=` 或单独帖子页（复用已有帖子详情小程序页面，如无则新建）。
  - 点赞/评论 -> 调用 `/posts/:id/like`、`/posts/:id/comments`，及时更新列表项统计。
- 空态：未加入任何圈子显示引导按钮跳转圈子列表。

### 圈子详情 (`pages/circles/detail`)
- 顶部：封面图、名称、标签（私密/我的圈子）、描述、统计、创建者信息。
- 操作按钮：根据成员/管理员状态展示 `加入/申请`、`退出`、`管理圈子`。
- Tab 结构：
  1. **帖子**：帖子列表 + 发帖入口（调用 `/posts`）。评论折叠显示，支持快捷点赞。
  2. **关于**：圈子规则、创建时间、分类、成员概览、申请说明。
  3. **成员**：列表 + 搜索，成员角色标签（成员/管理员/创建者），管理员可在此跳转管理页。
- 数据刷新：加入/退出/更新圈子信息后重新请求详情与列表，同时派发事件通知列表/Following 页面。

### 管理页 (`pages/circles/manage`)
- 权限校验：进入前调用详情确认 `user_role` 为 `creator`/`admin`，否则重定向。
- Tab：
  1. **基础设置**：表单字段与 Web 版一致，提交调用 `updateCircle`。
  2. **成员管理**：
     - 列表分组（全部/管理员/待审核），支持搜索。
     - 操作：调整角色、移除成员、查看加入时间。
  3. **申请审核**：展示待审核列表，操作 `approve/reject`。
  4. **统计概览**（选做）：展示帖子数、成员增长等，通过 `/circles/:id/posts` 与成员数据聚合。
- 成功后：`showSuccess` 提示并触发其他页面刷新（通过事件总线或 store）。

## 状态同步策略

- `circleStore` 扩展字段：
  ```js
  {
    list: { items, loading, error, pagination, filters },
    overview: { myCircles, hotCircles, loading },
    detail: { data, loading, error },
    posts: { items, loading, pagination },
    following: { items, loading, error, pagination, filters }
  }
  ```
- 加入/退出/更新成功后：
  - 更新 `detail.data.is_member`、`list.items` 对应项、`overview.myCircles`。
  - 通知 Following feed 重新加载（可通过 `wx.emit` 或 `app.globalData` 的版本号字段实现）。
- 登录态变化：`authStore` 订阅回调触发 `circleStore.reset()` 并重新拉取。

## UI/UX 规范

- 主色调沿用 `COLOR_PALETTE.primary` (#006633)；按钮、选中状态一致。
- 卡片圆角、阴影与其他模块统一（24rpx 圆角、柔和阴影）。
- Loading：骨架屏或圆形进度；Error：统一空状态组件 + “重试”按钮。
- Tab 切换使用顶部 `tabs` 或自定义 segmented 控件，保持文章阅读体验。
- Following 页面滚动性能：使用原生 `scroll-view` `lower-threshold` 触底加载，避免一次渲染过多节点。

## 安全与异常处理

- 所有写操作需检查 `401/403`，调用 `resetAuthState` 并引导重新登录/邮箱验证。
- 对于管理员操作接口，出现 `403` 时直接回到详情页并提示“无权限”。
- 表单字段前端校验：
  - 圈子名称 ≤ 50 字，描述 ≤ 500 字。
  - 成员上限仅允许正整数。
  - 帖子标题/内容必填，图片上传数量 ≤ 9。
- 上传图片统一走现有 `services/upload` 流程，生成托管 URL。

## 性能与可维护性

- 列表分页统一页大小（默认 10）， Following 使用懒加载 + 去重。
- 缓存 myCircles/hotCircles 结果于 store，5 分钟内重复访问使用缓存，可在 `app.globalData` 存时间戳。
- 组件化避免重复逻辑，所有页面通过 store actions 调用 API，便于将来统一处理缓存与错误。
- 单独维护 `specs` 目录便于后续需求迭代。

## 测试建议

- **单元/集成**：
  - Mock API 测试 `circleStore` 动作（加入/退出/更新）状态变更。
  - Following 过滤、分页逻辑。
- **手动验证**：
  - 登录/未登录场景下访问圈子模块。
  - 私密圈子申请流程。
  - 管理员修改信息/审核申请。
  - 401 触发后的恢复流程。

