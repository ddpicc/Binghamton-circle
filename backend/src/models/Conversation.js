const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Conversation = sequelize.define('Conversation', {
  id: {
    type: DataTypes.BIGINT,
    primaryKey: true,
    autoIncrement: true
  },
  user_a_id: {
    type: DataTypes.BIGINT,
    allowNull: false,
    comment: '会话参与者A（较小ID）'
  },
  user_b_id: {
    type: DataTypes.BIGINT,
    allowNull: false,
    comment: '会话参与者B（较大ID）'
  },
  last_message_id: {
    type: DataTypes.BIGINT,
    allowNull: true
  },
  last_message_at: {
    type: DataTypes.DATE,
    allowNull: true
  },
  unread_a: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0
  },
  unread_b: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0
  }
}, {
  tableName: 'conversations',
  underscored: true
});

module.exports = Conversation;
