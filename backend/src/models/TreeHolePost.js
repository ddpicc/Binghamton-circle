const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const TreeHolePost = sequelize.define('TreeHolePost', {
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
    },
    comment: '发布者用户ID（仅用于管理，对外匿名）'
  },
  content: {
    type: DataTypes.TEXT,
    allowNull: false,
    comment: '帖子内容'
  },
  images: {
    type: DataTypes.JSON,
    allowNull: true,
    comment: '图片URL数组'
  },
  tags: {
    type: DataTypes.JSON,
    allowNull: true,
    comment: '标签数组'
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
  tableName: 'tree_hole_posts',
  timestamps: true,
  underscored: true,
  comment: '树洞帖子表',
  indexes: [
    {
      fields: ['user_id']
    },
    {
      fields: ['created_at']
    },
    {
      fields: ['is_pinned']
    },
    {
      fields: ['status']
    }
  ]
});

module.exports = TreeHolePost;
