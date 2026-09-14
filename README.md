# 校园社区平台

一个面向大学生的校园社区平台，集成了身份认证、信息发布、二手交易、生活服务等功能。

## 项目结构

```
Binghamton-circle/
├── backend/                 # 后端服务 (Node.js + Express)
│   ├── src/
│   │   ├── controllers/    # 控制器
│   │   ├── models/         # 数据模型
│   │   ├── routes/         # 路由
│   │   ├── middleware/     # 中间件
│   │   ├── services/       # 业务逻辑
│   │   ├── utils/          # 工具函数
│   │   └── config/         # 配置文件
│   ├── tests/              # 测试文件
│   └── scripts/            # 脚本文件
├── miniprogram/            # 微信小程序端 (原生小程序框架)
│   ├── app.js/json/wxss    # 全局配置与启动逻辑
│   ├── components/         # 复用组件（导航、卡片、上传等）
│   ├── pages/              # 小程序页面（首页、通知、O2O、圈子等）
│   ├── services/           # 与 backend 通讯的请求层
│   ├── stores/             # 轻量状态管理
│   └── styles/             # 主题与工具样式
├── frontend/               # 前端应用 (Vue 3)
│   ├── src/
│   │   ├── components/     # 组件
│   │   ├── views/          # 页面
│   │   ├── stores/         # 状态管理
│   │   ├── router/         # 路由
│   │   ├── assets/         # 静态资源
│   │   ├── utils/          # 工具函数
│   │   └── api/            # API接口
│   ├── public/             # 公共资源
│   └── tests/              # 测试文件
├── database/               # 数据库相关
│   ├── migrations/         # 数据库迁移
│   └── seeds/             # 种子数据
├── docs/                  # 文档
│   ├── api/               # API文档
│   └── deployment/        # 部署文档
└── specs/                 # 项目规格
    └── campus-community/  # 校园社区项目规格
```

## 技术栈

### 后端
- Node.js 18+
- Express.js 4.x
- MySQL 8.0
- Redis 6.x
- JWT认证
- Sequelize ORM

### 前端
- Vue 3 + Composition API
- Vite
- Vue Router 4
- Pinia
- Element Plus
- TypeScript
- Tailwind CSS

## 功能特性

1. **用户认证系统**
   - 微信扫码登录
   - 学校邮箱验证
   - 非学校邮箱注册申请与管理员审核
   - JWT token认证

2. **重要通知系统**
   - 通知发布和管理
   - 分类和搜索功能
   - 通知收藏功能

3. **O2O信息平台**
   - 二手交易
   - 租房信息
   - 拼车信息
   - 图片上传
   - 搜索和筛选

4. **广场社交功能**
   - 帖子发布和浏览
   - 匿名发布选项
   - 点赞和评论
   - 个人主页

5. **系统管理**
   - 用户管理
   - 内容审核
   - 数据统计

## 开发环境

### 环境要求
- Node.js 18+
- MySQL 8.0+
- Redis 6.x+
- Git

### 安装步骤

1. 克隆项目
```bash
git clone <repository-url>
cd Binghamton-circle
```

2. 安装后端依赖
```bash
cd backend
npm install
```

3. 安装前端依赖
```bash
cd ../frontend
npm install
```

4. 配置环境变量
```bash
cp .env.example .env
# 编辑 .env 文件配置数据库等信息
```

5. 启动开发服务器
```bash
# 后端
cd backend
npm run dev

# 前端
cd ../frontend
npm run dev
```

## 项目规范

### 代码规范
- 使用ESLint进行代码检查
- 使用Prettier进行代码格式化
- 遵循ES6+语法规范

### Git规范
- 使用语义化提交信息
- 遵循Git Flow工作流
- 定期进行代码审查

### 文档规范
- 保持API文档的及时更新
- 重要的业务逻辑需要注释
- 使用JSDoc进行函数文档

## 部署

项目支持Docker部署，详细部署文档请参考 `docs/deployment/` 目录。

### 小程序开发与预览

1. 使用 `npm install` 安装 `miniprogram/` 中声明的依赖（若需 `@vant/weapp` 等组件，可根据需要补充）。
2. 打开微信开发者工具，导入项目根目录，确保 `project.config.json` 中的 `appid` 已替换为实际小程序的 AppID。
3. 后端服务需可访问（默认请求 `http://localhost:3000/api`），可通过修改 `miniprogram/config/index.js` 调整接口地址。
4. 首次进入小程序会自动触发微信登录与邮箱验证，完成验证后即可体验首页、通知、O2O、圈子、树洞等功能。

> 提示：如需切换环境或上架发布，可在微信开发者工具中配置上传版本，同时根据服务器地址调整 API 基础路径。

## 许可证

MIT License
