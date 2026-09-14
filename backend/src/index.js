require('dotenv').config({ path: '.env.local' });
const express = require('express');
const morgan = require('morgan');
const { sequelize } = require('./models');

const app = express();
const PORT = process.env.PORT || 3000;

const parseAllowedOrigins = () => {
  const defaults = [
    'http://localhost:5173',
    'https://bu-circle.zeabur.app'
  ];
  const raw = process.env.CORS_ORIGINS || process.env.FRONTEND_URL || '';
  const extra = raw
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
  return Array.from(new Set([...defaults, ...extra]));
};

const allowedOrigins = parseAllowedOrigins();

// 中间件
app.use((req, res, next) => {
  const origin = req.headers.origin;
  if (origin && allowedOrigins.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Vary', 'Origin');
  }

  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,PATCH,DELETE,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Authorization,Content-Type,X-Requested-With');
    return res.sendStatus(204);
  }

  return next();
});
app.use(morgan('combined'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// 健康检查路由
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// API路由
app.use('/api/auth', require('./routes/auth'));
app.use('/api/users', require('./routes/users'));
app.use('/api/posts', require('./routes/posts'));
app.use('/api/comments', require('./routes/comments'));
app.use('/api/notices', require('./routes/notices'));
app.use('/api/o2o', require('./routes/o2o'));
app.use('/api/uploads', require('./routes/uploads'));
app.use('/api/circles', require('./routes/circles'));
app.use('/api/messages', require('./routes/messages'));
app.use('/api/tree-hole', require('./routes/treeHole'));
app.use('/api/activities', require('./routes/activities'));
app.use('/api/life-map', require('./routes/lifeMap'));
app.use('/api/home', require('./routes/home'));
app.use('/api/admin', require('./routes/admin'));

// 错误处理中间件
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ 
    error: 'Internal Server Error',
    message: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// 404处理
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// 数据库连接和服务器启动
async function startServer() {
  try {
    // 测试数据库连接
    await sequelize.authenticate();
    console.log('数据库连接成功');
    
    // 同步数据库模型
    if (process.env.NODE_ENV === 'development') {
      await sequelize.sync({ alter: false });
      console.log('数据库模型同步完成');
    }
    
    // 启动服务器
    app.listen(PORT, () => {
      console.log(`服务器运行在端口 ${PORT}`);
      console.log(`健康检查: http://localhost:${PORT}/health`);
    });
  } catch (error) {
    console.error('服务器启动失败:', error);
    process.exit(1);
  }
}

startServer();
