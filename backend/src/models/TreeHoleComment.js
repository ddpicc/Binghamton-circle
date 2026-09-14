const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const TreeHoleComment = sequelize.define('TreeHoleComment', {
  id: {
    type: DataTypes.BIGINT,
    primaryKey: true,
    autoIncrement: true
  },
  post_id: {
    type: DataTypes.BIGINT,
    allowNull: false,
    references: {
      model: 'tree_hole_posts',
      key: 'id'
    },
    comment: '树洞帖子ID'
  },
  user_id: {
    type: DataTypes.BIGINT,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id'
    },
    comment: '评论者用户ID（仅用于管理，对外匿名）'
  },
  content: {
    type: DataTypes.TEXT,
    allowNull: false,
    comment: '评论内容'
  },
  parent_id: {
    type: DataTypes.BIGINT,
    allowNull: true,
    references: {
      model: 'tree_hole_comments',
      key: 'id'
    },
    comment: '父评论ID（用于回复）'
  },
  like_count: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    comment: '点赞数'
  },
  status: {
    type: DataTypes.ENUM('published', 'deleted'),
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
  tableName: 'tree_hole_comments',
  timestamps: true,
  underscored: true,
  comment: '树洞评论表',
  indexes: [
    {
      fields: ['post_id']
    },
    {
      fields: ['user_id']
    },
    {
      fields: ['parent_id']
    },
    {
      fields: ['created_at']
    }
  ]
});

module.exports = TreeHoleComment;