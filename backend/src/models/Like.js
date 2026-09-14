const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Like = sequelize.define('Like', {
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
  target_id: {
    type: DataTypes.BIGINT,
    allowNull: false,
    comment: '目标ID'
  },
  target_type: {
    type: DataTypes.ENUM('post', 'comment', 'o2o_item', 'notice'),
    allowNull: false,
    comment: '目标类型'
  },
  created_at: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  }
}, {
  tableName: 'likes',
  timestamps: true,
  underscored: true,
  indexes: [
    {
      unique: true,
      fields: ['user_id', 'target_id', 'target_type']
    },
    {
      fields: ['target_id', 'target_type']
    },
    {
      fields: ['user_id']
    },
    {
      fields: ['created_at']
    }
  ]
});

module.exports = Like;