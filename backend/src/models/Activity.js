const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Activity = sequelize.define('Activity', {
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
    comment: '发布者用户ID'
  },
  title: {
    type: DataTypes.STRING(255),
    allowNull: false,
    comment: '活动标题'
  },
  cover_image: {
    type: DataTypes.STRING(500),
    allowNull: true,
    comment: '活动封面图URL'
  },
  location: {
    type: DataTypes.STRING(255),
    allowNull: true,
    comment: '活动地点（可选）'
  },
  time: {
    type: DataTypes.DATE,
    allowNull: false,
    comment: '活动时间'
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: '活动描述（可选）'
  },
  participant_count: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    comment: '报名参与人数'
  },
  max_participants: {
    type: DataTypes.INTEGER,
    allowNull: true,
    comment: '最大报名人数（可选）'
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
  tableName: 'activities',
  timestamps: true,
  underscored: true,
  comment: '校园活动'
});

module.exports = Activity;
