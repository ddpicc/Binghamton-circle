const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const NonEduEmailRequest = sequelize.define('NonEduEmailRequest', {
  id: {
    type: DataTypes.BIGINT,
    primaryKey: true,
    autoIncrement: true
  },
  requested_username: {
    type: DataTypes.STRING(50),
    allowNull: false
  },
  personal_email: {
    type: DataTypes.STRING(100),
    allowNull: false,
    unique: true
  },
  reason: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  status: {
    type: DataTypes.ENUM('pending', 'approved', 'rejected', 'verified'),
    defaultValue: 'pending',
    allowNull: false
  },
  admin_id: {
    type: DataTypes.BIGINT,
    allowNull: true
  },
  admin_note: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  rejected_reason: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  approved_at: {
    type: DataTypes.DATE,
    allowNull: true
  },
  rejected_at: {
    type: DataTypes.DATE,
    allowNull: true
  },
  verified_at: {
    type: DataTypes.DATE,
    allowNull: true
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
  tableName: 'non_edu_email_requests',
  timestamps: true,
  underscored: true
});

module.exports = NonEduEmailRequest;
