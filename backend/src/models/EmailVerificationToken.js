const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const EmailVerificationToken = sequelize.define('EmailVerificationToken', {
  id: {
    type: DataTypes.BIGINT,
    primaryKey: true,
    autoIncrement: true
  },
  request_id: {
    type: DataTypes.BIGINT,
    allowNull: true
  },
  user_id: {
    type: DataTypes.BIGINT,
    allowNull: true
  },
  email: {
    type: DataTypes.STRING(100),
    allowNull: false
  },
  token_hash: {
    type: DataTypes.STRING(128),
    allowNull: false,
    unique: true
  },
  type: {
    type: DataTypes.ENUM('non_edu_onboarding', 'school_email_login'),
    allowNull: false,
    defaultValue: 'non_edu_onboarding'
  },
  expires_at: {
    type: DataTypes.DATE,
    allowNull: false
  },
  used_at: {
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
  tableName: 'email_verification_tokens',
  timestamps: true,
  underscored: true
});

module.exports = EmailVerificationToken;
