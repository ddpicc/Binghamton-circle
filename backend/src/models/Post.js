const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Post = sequelize.define('Post', {
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
    comment: '帖子标题'
  },
  content: {
    type: DataTypes.TEXT,
    allowNull: false,
    comment: '帖子内容'
  },
  is_anonymous: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    comment: '是否匿名'
  },
  images: {
    type: DataTypes.JSON,
    allowNull: true,
    comment: '图片URL数组'
  },
  category: {
    type: DataTypes.STRING(50),
    allowNull: true,
    comment: '分类'
  },
  tags: {
    type: DataTypes.JSON,
    allowNull: true,
    comment: '标签数组'
  },
  circle_id: {
    type: DataTypes.BIGINT,
    allowNull: true,
    comment: '圈子ID',
    references: {
      model: 'circles',
      key: 'id'
    }
  },
  is_featured: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    comment: '是否精华'
  },
  like_count: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    comment: '点赞数'
  },
  comment_count: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    comment: '评论数'
  },
  view_count: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    comment: '浏览数'
  },
  status: {
    type: DataTypes.ENUM('published', 'draft', 'deleted'),
    defaultValue: 'published',
    comment: '状态'
  },
  is_pinned: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    comment: '是否置顶'
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
  tableName: 'posts',
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
      fields: ['circle_id']
    },
    {
      fields: ['is_featured']
    },
    {
      fields: ['circle_id', 'is_featured']
    },
    {
      fields: ['created_at']
    },
    {
      fields: ['is_pinned']
    }
  ]
});

module.exports = Post;