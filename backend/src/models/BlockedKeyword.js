const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const BlockedKeyword = sequelize.define('BlockedKeyword', {
  id: {
    type: DataTypes.BIGINT,
    primaryKey: true,
    autoIncrement: true
  },
  keyword: {
    type: DataTypes.STRING(100),
    allowNull: false,
    comment: '屏蔽关键词'
  },
  type: {
    type: DataTypes.ENUM('exact', 'partial', 'regex'),
    defaultValue: 'exact',
    comment: '匹配类型：exact=完全匹配，partial=包含匹配，regex=正则表达式'
  },
  action: {
    type: DataTypes.ENUM('block', 'mark', 'replace'),
    defaultValue: 'block',
    comment: '处理方式：block=完全屏蔽，mark=标记提醒，replace=替换为***'
  },
  reason: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: '屏蔽原因'
  },
  is_active: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
    comment: '是否启用'
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
  tableName: 'blocked_keywords',
  timestamps: true,
  underscored: true,
  indexes: [
    {
      fields: ['keyword']
    },
    {
      fields: ['type']
    },
    {
      fields: ['is_active']
    }
  ]
});

module.exports = BlockedKeyword;