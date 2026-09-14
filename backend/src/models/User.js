const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const User = sequelize.define('User', {
  id: {
    type: DataTypes.BIGINT,
    primaryKey: true,
    autoIncrement: true
  },
  wechat_openid: {
    type: DataTypes.STRING(100),
    unique: true,
    allowNull: true,
    comment: '微信OpenID'
  },
  wechat_unionid: {
    type: DataTypes.STRING(100),
    allowNull: true,
    comment: '微信UnionID'
  },
  username: {
    type: DataTypes.STRING(50),
    unique: true,
    allowNull: false,
    comment: '用户名'
  },
  primary_email: {
    type: DataTypes.STRING(100),
    unique: true,
    allowNull: true,
    comment: '主邮箱地址'
  },
  password: {
    type: DataTypes.STRING(255),
    allowNull: true,
    comment: '密码'
  },
  role: {
    type: DataTypes.ENUM('user', 'admin'),
    defaultValue: 'user',
    comment: '用户角色'
  },
  status: {
    type: DataTypes.ENUM('active', 'inactive', 'banned'),
    defaultValue: 'active',
    comment: '用户状态'
  },
  last_login: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: '最后登录时间'
  },
  email_verified: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    comment: '邮箱是否验证'
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
  tableName: 'users',
  timestamps: true,
  underscored: true,
  indexes: [
    {
      unique: true,
      fields: ['wechat_openid']
    },
    {
      unique: true,
      fields: ['username']
    },
    {
      unique: true,
      fields: ['primary_email']
    }
  ]
});

module.exports = User;