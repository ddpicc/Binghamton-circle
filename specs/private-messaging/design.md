# 技术方案设计

## 架构概览

- **前端（小程序）**
  - 在“用户详情”页新增“发送私信”按钮，入口可根据 `hasUnread` 标记显示红点。
  - 新增 `pages/messages/thread/index` 用于展示双方聊天记录、发送消息及展示占位状态。
  - 新增 `stores/messageStore` 负责会话状态、消息列表、未读标记、发送节流逻辑。
  - 新增 `services/messages` 调用后端 REST API，支持加载会话、发送消息、设置已读、拉取未读摘要。
- **后端（CloudBase Run Node.js 服务）**
  - 新增 `messages`、`conversations` 两张表，并通过 Sequelize 模型管理。
  - 新增 `Conversation`、`Message` 模型及关联。
  - 新增 `/api/messages` 路由：获取会话、发送消息、标记已读、查询未读统计。
  - 在用户详情相关 API 中加入未读提示字段，或者由前端调用未读统计接口实现红点。

## 数据模型设计

### conversations 表
| 字段 | 类型 | 描述 |
| --- | --- | --- |
| id | BIGINT PK | 会话 ID |
| user_a_id | BIGINT | 较小的用户 ID，用于唯一索引 |
| user_b_id | BIGINT | 较大的用户 ID |
| last_message_id | BIGINT | 最近一条消息 ID（用于排序） |
| last_message_at | DATETIME | 最近消息时间 |
| unread_a | INTEGER | A 用户未读数 |
| unread_b | INTEGER | B 用户未读数 |
| created_at / updated_at | DATETIME | 时间戳 |

**唯一约束**：`(user_a_id, user_b_id)`，确保两用户只有一个会话。

### messages 表
| 字段 | 类型 | 描述 |
| --- | --- | --- |
| id | BIGINT PK | 消息 ID |
| conversation_id | BIGINT FK -> conversations.id |
| sender_id | BIGINT | 发送方 |
| receiver_id | BIGINT | 接收方 |
| content | TEXT | 消息内容（纯文本） |
| status | ENUM('sent','delivered','read') | 消息状态 |
| created_at / updated_at | DATETIME | 时间戳 |

索引：`conversation_id + created_at`，`receiver_id + status`（方便统计未读）。

## 后端 API 设计

| 方法 | 路径 | 描述 |
| --- | --- | --- |
| `GET /api/messages/conversations/:userId` | 获取与指定用户的会话详情及近 N 条消息（默认 20） |
| `POST /api/messages/conversations/:userId/messages` | 向对方发送消息 |
| `POST /api/messages/conversations/:userId/read` | 标记会话为已读 |
| `GET /api/messages/unread-summary` | 返回各用户（或会话）的未读数量 |

**发送消息约束**：服务端在入库前检查：
1. 最近一次消息是否由发送方发出。
2. 在对方回复前，发送方发送的消息数量是否已达到 2 条。
3. 满足条件方可发送；否则返回 400 错误码及提示信息。

**未读计数**：发送成功后递增接收方未读；标记已读时清零对应字段。

## 前端交互流程

1. 用户在详情页点击“发送私信”：
   - 调用 `wx.navigateTo({ url: '/pages/messages/thread/index?userId=xxx' })`。
   - 页面 `onLoad` 调用 `messageStore.loadConversation(userId)`。
2. 在聊天页面：
   - 下拉加载更多历史消息。
   - 输入框提交消息，调用 `messageStore.sendMessage`。
   - Store 在发送前校验当前用户是否达到“连续两条未回复”限制；若达上限直接提示。
3. 页面 `onShow` 时标记已读，调用后端 `read` API，并更新用户详情页红点标记。
4. 用户详情页在 `onShow` 时调用 `messageStore.getUnreadFlag(userId)` 来决定是否展示红点。

## 状态管理

- `messageStore` 状态字段：
  - `threads`: `{ [userId]: { messages: [], hasMore: boolean, loading: boolean, lastLoadedAt: string } }`
  - `unreadFlags`: `{ [userId]: boolean }`
  - `sending`: 是否正在发送
  - `error`: 最近一次错误信息
- 提供方法：
  - `loadConversation(userId, { before })`
  - `sendMessage(userId, content)`
  - `markAsRead(userId)`
  - `syncUnreadFlags()`

## UI 设计说明

- 聊天页面参考微信对话：
  - 顶部导航显示对方昵称，支持返回。
  - 消息气泡左右对齐；头像使用用户头像（若无则使用首字母）。
  - 底部输入区域：文本框 + 发送按钮。
  - 空状态提示：“开始和对方聊天吧～”。
- 用户详情页“发送私信”按钮右上角显示小红点（通过 CSS 自定义）。

## 权限与安全

- API 需经过登录认证中间件，提取 `req.user.id`。
- 发送消息时拒绝向自己发送。
- 查询会话时确保当前用户为会话双方之一。
- 消息内容长度限制（例如 500 字符）。
- 数据库层面添加外键约束并支持软删除（后续扩展）。

## 测试策略

- **后端单元测试**：`messages` 控制器与服务逻辑，覆盖：
  - 创建会话、发送消息、限制校验、未读计数、标记已读。
- **前端单元测试**：`messageStore` 方法，模拟 API 响应，验证状态更新及连续发送限制逻辑。
- **手动测试**：
  1. 用户 A -> 用户 B 连续发送两条成功，第三条被阻止。
  2. 用户 B 回复后，双方可正常互发。
  3. 未读红点显示/清除。
  4. 异常（无网络）提示。

## 后续扩展

- 支持图片/语音消息。
- WebSocket 或实时数据库 watch 实现即时同步。
- 系统通知消息聚合。
