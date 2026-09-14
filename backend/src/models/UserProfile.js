const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const UserProfile = sequelize.define('UserProfile', {
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
  nickname: {
    type: DataTypes.STRING(50),
    allowNull: true,
    comment: '昵称'
  },
  avatar: {
    type: DataTypes.STRING(255),
    allowNull: true,
    comment: '头像URL'
  },
  bio: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: '个人简介'
  },
  phone: {
    type: DataTypes.STRING(20),
    allowNull: true,
    comment: '手机号'
  },
  gender: {
    type: DataTypes.ENUM('male', 'female', 'other'),
    allowNull: true,
    comment: '性别'
  },
  birth_date: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: '出生日期'
  },
  school: {
    type: DataTypes.STRING(100),
    allowNull: true,
    comment: '学校'
  },
  major: {
    type: DataTypes.STRING(100),
    allowNull: true,
    comment: '专业'
  },
  grade: {
    type: DataTypes.STRING(20),
    allowNull: true,
    comment: '年级'
  },
  address: {
    type: DataTypes.STRING(255),
    allowNull: true,
    comment: '地址'
  },
  preferences: {
    type: DataTypes.JSON,
    allowNull: true,
    comment: '用户偏好设置'
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
  tableName: 'user_profiles',
  timestamps: true,
  underscored: true
});

module.exports = UserProfile;