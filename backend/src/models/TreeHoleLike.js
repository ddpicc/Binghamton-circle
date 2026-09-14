const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const TreeHoleLike = sequelize.define('TreeHoleLike', {
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
    comment: '点赞用户ID'
  },
  target_id: {
    type: DataTypes.BIGINT,
    allowNull: false,
    comment: '目标ID（帖子ID或评论ID）'
  },
  target_type: {
    type: DataTypes.ENUM('post', 'comment'),
    allowNull: false,
    comment: '目标类型'
  },
  created_at: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  }
}, {
  tableName: 'tree_hole_likes',
  // This table only has created_at; disable updatedAt to avoid ER_BAD_FIELD_ERROR
  timestamps: false,
  underscored: true,
  comment: '树洞点赞表',
  indexes: [
    {
      fields: ['user_id']
    },
    {
      fields: ['target_id']
    },
    {
      fields: ['target_type']
    },
    {
      unique: true,
      fields: ['user_id', 'target_id', 'target_type']
    }
  ]
});

module.exports = TreeHoleLike;
