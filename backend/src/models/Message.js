const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Message = sequelize.define('Message', {
  id: {
    type: DataTypes.BIGINT,
    primaryKey: true,
    autoIncrement: true
  },
  conversation_id: {
    type: DataTypes.BIGINT,
    allowNull: false
  },
  sender_id: {
    type: DataTypes.BIGINT,
    allowNull: false
  },
  receiver_id: {
    type: DataTypes.BIGINT,
    allowNull: false
  },
  content: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  status: {
    type: DataTypes.ENUM('sent', 'delivered', 'read'),
    allowNull: false,
    defaultValue: 'sent'
  }
}, {
  tableName: 'messages',
  underscored: true
});

module.exports = Message;
