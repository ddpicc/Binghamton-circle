const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const AllowedLoginEmail = sequelize.define('AllowedLoginEmail', {
  id: {
    type: DataTypes.BIGINT,
    primaryKey: true,
    autoIncrement: true
  },
  email: {
    type: DataTypes.STRING(255),
    allowNull: false,
    unique: true,
    comment: '允许登录的非学校邮箱'
  },
  note: {
    type: DataTypes.STRING(255),
    allowNull: true,
    comment: '备注'
  },
  is_active: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true,
    comment: '是否启用'
  },
  created_by: {
    type: DataTypes.BIGINT,
    allowNull: true,
    comment: '创建人'
  },
  updated_by: {
    type: DataTypes.BIGINT,
    allowNull: true,
    comment: '更新人'
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
  tableName: 'allowed_login_emails',
  timestamps: true,
  underscored: true,
  indexes: [
    {
      unique: true,
      fields: ['email']
    },
    {
      fields: ['is_active']
    }
  ]
});

module.exports = AllowedLoginEmail;
