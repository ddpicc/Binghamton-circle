const { DataTypes } = require('sequelize');

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // 创建圈子成员表
    await queryInterface.createTable('circle_members', {
      id: {
        type: DataTypes.BIGINT,
        primaryKey: true,
        autoIncrement: true
      },
      circle_id: {
        type: DataTypes.BIGINT,
        allowNull: false,
        comment: '圈子ID',
        references: {
          model: 'circles',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      user_id: {
        type: DataTypes.BIGINT,
        allowNull: false,
        comment: '用户ID',
        references: {
          model: 'users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      role: {
        type: DataTypes.ENUM('creator', 'admin', 'member'),
        defaultValue: 'member',
        comment: '角色'
      },
      status: {
        type: DataTypes.ENUM('pending', 'approved', 'rejected', 'left'),
        defaultValue: 'approved',
        comment: '状态'
      },
      joined_at: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
        comment: '加入时间'
      },
      created_at: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW
      },
      updated_at: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW
      }
    });

    // 创建唯一索引（一个用户在一个圈子只能有一条记录）
    await queryInterface.addIndex('circle_members', {
      fields: ['circle_id', 'user_id'],
      unique: true,
      name: 'uk_circle_user'
    });

    // 创建其他索引
    await queryInterface.addIndex('circle_members', ['circle_id']);
    await queryInterface.addIndex('circle_members', ['user_id']);
    await queryInterface.addIndex('circle_members', ['status']);
    await queryInterface.addIndex('circle_members', ['role']);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('circle_members');
  }
};