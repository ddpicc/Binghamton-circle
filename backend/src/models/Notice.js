const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Notice = sequelize.define('Notice', {
  id: {
    type: DataTypes.BIGINT,
    primaryKey: true,
    autoIncrement: true
  },
  user_id: {
    type: DataTypes.BIGINT,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  title: {
    type: DataTypes.STRING(200),
    allowNull: false,
    comment: '通知标题'
  },
  content: {
    type: DataTypes.TEXT,
    allowNull: false,
    comment: '通知内容'
  },
  category: {
    type: DataTypes.STRING(50),
    allowNull: true,
    comment: '分类'
  },
  priority: {
    type: DataTypes.ENUM('low', 'medium', 'high', 'urgent'),
    defaultValue: 'medium',
    comment: '优先级'
  },
  is_pinned: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    comment: '是否置顶'
  },
  is_published: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
    comment: '是否发布'
  },
  publish_time: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: '发布时间'
  },
  expire_time: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: '过期时间'
  },
  target_audience: {
    type: DataTypes.JSON,
    allowNull: true,
    comment: '目标受众'
  },
  attachments: {
    type: DataTypes.JSON,
    allowNull: true,
    comment: '附件'
  },
  view_count: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    comment: '浏览数'
  },
  status: {
    type: DataTypes.ENUM('draft', 'published', 'archived'),
    defaultValue: 'published',
    comment: '状态'
  },
  created_at: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  },
  updated_at: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  }
}, {
  tableName: 'notices',
  timestamps: true,
  underscored: true,
  indexes: [
    {
      fields: ['user_id']
    },
    {
      fields: ['category']
    },
    {
      fields: ['priority']
    },
    {
      fields: ['is_pinned']
    },
    {
      fields: ['publish_time']
    }
  ]
});

module.exports = Notice;