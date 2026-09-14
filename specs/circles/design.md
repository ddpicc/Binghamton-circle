# 圈子功能技术方案设计

## 系统架构

### 技术栈
- **后端**：Node.js + Express + Sequelize + MySQL
- **前端**：Vue 3 + TypeScript + Element Plus + Pinia
- **数据库**：MySQL 8.0
- **认证**：JWT + Session

## 数据库设计

### 1. 圈子表 (circles)

```sql
CREATE TABLE circles (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(100) NOT NULL COMMENT '圈子名称',
  description TEXT COMMENT '圈子描述',
  cover_image VARCHAR(500) COMMENT '封面图URL',
  creator_id BIGINT NOT NULL COMMENT '创建者ID',
  tags JSON COMMENT '标签数组',
  is_public BOOLEAN DEFAULT TRUE COMMENT '是否公开',
  need_approval BOOLEAN DEFAULT FALSE COMMENT '是否需要审核',
  max_members INT COMMENT '成员上限',
  member_count INT DEFAULT 0 COMMENT '成员数量',
  post_count INT DEFAULT 0 COMMENT '帖子数量',
  status ENUM('active', 'inactive', 'banned') DEFAULT 'active' COMMENT '状态',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  INDEX idx_creator_id (creator_id),
  INDEX idx_status (status),
  INDEX idx_is_public (is_public),
  FOREIGN KEY (creator_id) REFERENCES users(id) ON DELETE CASCADE
);
```

### 2. 圈子成员表 (circle_members)

```sql
CREATE TABLE circle_members (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  circle_id BIGINT NOT NULL COMMENT '圈子ID',
  user_id BIGINT NOT NULL COMMENT '用户ID',
  role ENUM('creator', 'admin', 'member') DEFAULT 'member' COMMENT '角色',
  status ENUM('pending', 'approved', 'rejected', 'left') DEFAULT 'approved' COMMENT '状态',
  joined_at DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '加入时间',
  
  UNIQUE KEY uk_circle_user (circle_id, user_id),
  INDEX idx_circle_id (circle_id),
  INDEX idx_user_id (user_id),
  INDEX idx_status (status),
  FOREIGN KEY (circle_id) REFERENCES circles(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
```

### 3. 圈子分类表 (circle_categories)

```sql
CREATE TABLE circle_categories (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(50) NOT NULL COMMENT '分类名称',
  description TEXT COMMENT '分类描述',
  icon VARCHAR(100) COMMENT '图标',
  sort_order INT DEFAULT 0 COMMENT '排序',
  is_active BOOLEAN DEFAULT TRUE COMMENT '是否启用',
  
  UNIQUE KEY uk_name (name),
  INDEX idx_sort_order (sort_order)
);
```

### 4. 帖子表修改 (posts)

需要为帖子表添加圈子关联：

```sql
ALTER TABLE posts ADD COLUMN circle_id BIGINT COMMENT '圈子ID';
ALTER TABLE posts ADD COLUMN is_featured BOOLEAN DEFAULT FALSE COMMENT '是否精华';
ALTER TABLE posts ADD INDEX idx_circle_id (circle_id);
ALTER TABLE posts ADD FOREIGN KEY (circle_id) REFERENCES circles(id) ON DELETE SET NULL;
```

### 5. 圈子通知表 (circle_notifications)

```sql
CREATE TABLE circle_notifications (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  circle_id BIGINT NOT NULL COMMENT '圈子ID',
  user_id BIGINT NOT NULL COMMENT '接收用户ID',
  type ENUM('new_post', 'join_request', 'join_approved', 'join_rejected', 'removed', 'circle_update') NOT NULL COMMENT '通知类型',
  title VARCHAR(200) NOT NULL COMMENT '通知标题',
  content TEXT COMMENT '通知内容',
  related_id BIGINT COMMENT '相关ID（帖子ID、用户ID等）',
  is_read BOOLEAN DEFAULT FALSE COMMENT '是否已读',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  
  INDEX idx_circle_user (circle_id, user_id),
  INDEX idx_user_id (user_id),
  INDEX idx_is_read (is_read),
  FOREIGN KEY (circle_id) REFERENCES circles(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
```

## API 设计

### 1. 圈子管理 API

#### 创建圈子
```
POST /api/circles
Headers: { Authorization: Bearer <token> }
Body: {
  name: string,
  description: string,
  coverImage?: string,
  tags?: string[],
  isPublic?: boolean,
  needApproval?: boolean,
  maxMembers?: number
}
Response: {
  code: 200,
  data: Circle
}
```

#### 获取圈子详情
```
GET /api/circles/:id
Response: {
  code: 200,
  data: {
    circle: Circle,
    memberCount: number,
    isMember: boolean,
    userRole?: string
  }
}
```

#### 更新圈子
```
PUT /api/circles/:id
Headers: { Authorization: Bearer <token> }
Body: {
  name?: string,
  description?: string,
  coverImage?: string,
  tags?: string[],
  isPublic?: boolean,
  needApproval?: boolean,
  maxMembers?: number
}
```

#### 删除圈子
```
DELETE /api/circles/:id
Headers: { Authorization: Bearer <token> }
```

### 2. 圈子成员管理 API

#### 申请加入圈子
```
POST /api/circles/:id/join
Headers: { Authorization: Bearer <token> }
```

#### 审核加入申请
```
PUT /api/circles/:circle_id/members/:user_id/approve
Headers: { Authorization: Bearer <token> }
Body: {
  approved: boolean,
  reason?: string
}
```

#### 退出圈子
```
DELETE /api/circles/:id/leave
Headers: { Authorization: Bearer <token> }
```

#### 移除成员
```
DELETE /api/circles/:circle_id/members/:user_id
Headers: { Authorization: Bearer <token> }
```

#### 设置成员角色
```
PUT /api/circles/:circle_id/members/:user_id/role
Headers: { Authorization: Bearer <token> }
Body: {
  role: 'admin' | 'member'
}
```

### 3. 圈子内容 API

#### 获取圈子帖子列表
```
GET /api/circles/:id/posts?query=...
Query: {
  page: number,
  limit: number,
  featured?: boolean
}
Response: {
  code: 200,
  data: {
    posts: Post[],
    total: number,
    featuredPosts: Post[]
  }
}
```

#### 发布圈子帖子
```
POST /api/circles/:id/posts
Headers: { Authorization: Bearer <token> }
Body: {
  title: string,
  content: string,
  images?: string[],
  isAnonymous?: boolean
}
```

#### 设置精华帖子
```
PUT /api/circles/:circle_id/posts/:post_id/featured
Headers: { Authorization: Bearer <token> }
Body: {
  featured: boolean
}
```

### 4. 圈子发现 API

#### 获取圈子列表
```
GET /api/circles
Query: {
  page: number,
  limit: number,
  category?: string,
  sort: 'newest' | 'popular' | 'members',
  search?: string
}
Response: {
  code: 200,
  data: {
    circles: Circle[],
    total: number,
    categories: Category[]
  }
}
```

#### 获取推荐圈子
```
GET /api/circles/recommended
Response: {
  code: 200,
  data: Circle[]
}
```

#### 获取用户加入的圈子
```
GET /api/user/circles
Headers: { Authorization: Bearer <token> }
Response: {
  code: 200,
  data: Circle[]
}
```

### 5. 通知 API

#### 获取圈子通知
```
GET /api/circles/:id/notifications
Headers: { Authorization: Bearer <token> }
Query: {
  page: number,
  limit: number,
  unread?: boolean
}
```

#### 标记通知已读
```
PUT /api/circles/notifications/:id/read
Headers: { Authorization: Bearer <token> }
```

## 前端组件设计

### 1. 页面组件

- **CircleList.vue** - 圈子列表页
- **CircleDetail.vue** - 圈子详情页
- **CircleCreate.vue** - 创建圈子页
- **CircleManage.vue** - 圈子管理页
- **CirclePosts.vue** - 圈子帖子页
- **MyCircles.vue** - 我的圈子页

### 2. 功能组件

- **CircleCard.vue** - 圈子卡片组件
- **CircleMemberList.vue** - 成员列表组件
- **JoinRequestList.vue** - 加入申请列表
- **CircleSettings.vue** - 圈子设置组件
- **CircleNotification.vue** - 圈子通知组件

### 3. 状态管理

使用 Pinia 管理圈子相关状态：

```typescript
// stores/circle.ts
export const useCircleStore = defineStore('circle', {
  state: () => ({
    circles: [] as Circle[],
    myCircles: [] as Circle[],
    currentCircle: null as Circle | null,
    notifications: [] as Notification[]
  }),
  actions: {
    // 圈子 CRUD
    async createCircle(data: CircleCreate) {}
    async joinCircle(circleId: number) {}
    async leaveCircle(circleId: number) {}
    async getCirclePosts(circleId: number, params?: any) {}
    // ...
  }
})
```

## 权限控制

### 1. 中间件设计

```typescript
// circleAuth.middleware.ts
export const circleAuth = {
  // 检查是否是圈子成员
  isMember: async (req, res, next) => {
    const circleId = req.params.circleId;
    const userId = req.user.id;
    const member = await CircleMember.findOne({
      where: { circleId, userId, status: 'approved' }
    });
    if (!member) {
      return res.status(403).json({ code: 403, message: '不是圈子成员' });
    }
    req.circleRole = member.role;
    next();
  },
  
  // 检查是否是圈子管理员
  isAdmin: async (req, res, next) => {
    if (req.circleRole !== 'creator' && req.circleRole !== 'admin') {
      return res.status(403).json({ code: 403, message: '需要管理员权限' });
    }
    next();
  },
  
  // 检查是否是圈子创建者
  isCreator: async (req, res, next) => {
    if (req.circleRole !== 'creator') {
      return res.status(403).json({ code: 403, message: '需要创建者权限' });
    }
    next();
  }
};
```

### 2. 路由权限控制

```typescript
// circle.routes.ts
router.post('/', authMiddleware, circleController.createCircle);
router.get('/', circleController.getCircles);
router.get('/recommended', authMiddleware, circleController.getRecommendedCircles);
router.get('/my', authMiddleware, circleController.getMyCircles);

router.get('/:id', circleController.getCircleDetail);
router.post('/:id/join', authMiddleware, circleController.joinCircle);
router.delete('/:id/leave', authMiddleware, circleController.leaveCircle);

router.put('/:id', authMiddleware, circleAuth.isCreator, circleController.updateCircle);
router.delete('/:id', authMiddleware, circleAuth.isCreator, circleController.deleteCircle);

router.get('/:id/posts', circleAuth.isMember, circleController.getCirclePosts);
router.post('/:id/posts', circleAuth.isMember, circleController.createCirclePost);
```

## 性能优化

1. **缓存策略**：
   - 使用 Redis 缓存热门圈子信息
   - 缓存用户加入的圈子列表
   - 缓存圈子帖子统计

2. **数据库优化**：
   - 为圈子相关查询添加合适的索引
   - 使用分页查询避免大量数据加载
   - 考虑读写分离

3. **前端优化**：
   - 实现虚拟滚动处理大量圈子列表
   - 使用图片懒加载
   - 实现帖子分页加载