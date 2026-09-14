const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const ActivityParticipant = sequelize.define('ActivityParticipant', {
  id: {
    type: DataTypes.BIGINT,
    primaryKey: true,
    autoIncrement: true
  },
  activity_id: {
    type: DataTypes.BIGINT,
    allowNull: false,
    references: { model: 'activities', key: 'id' }
  },
  user_id: {
    type: DataTypes.BIGINT,
    allowNull: false,
    references: { model: 'users', key: 'id' }
  },
  created_at: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  }
}, {
  tableName: 'activity_participants',
  timestamps: false,
  underscored: true,
  comment: '活动报名参与记录',
  indexes: [
    { fields: ['activity_id'] },
    { fields: ['user_id'] },
    { unique: true, fields: ['activity_id', 'user_id'] }
  ]
});

module.exports = ActivityParticipant;

