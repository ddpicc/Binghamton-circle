const { DataTypes } = require('sequelize');

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // 创建圈子表
    await queryInterface.createTable('circles', {
      id: {
        type: DataTypes.BIGINT,
        primaryKey: true,
        autoIncrement: true
      },
      name: {
        type: DataTypes.STRING(100),
        allowNull: false,
        comment: '圈子名称'
      },
      description: {
        type: DataTypes.TEXT,
        allowNull: true,
        comment: '圈子描述'
      },
      cover_image: {
        type: DataTypes.STRING(500),
        allowNull: true,
        comment: '封面图URL'
      },
      creator_id: {
        type: DataTypes.BIGINT,
        allowNull: false,
        comment: '创建者ID',
        references: {
          model: 'users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      tags: {
        type: DataTypes.JSON,
        allowNull: true,
        comment: '标签数组'
      },
      is_public: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
        comment: '是否公开'
      },
      need_approval: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
        comment: '是否需要审核'
      },
      max_members: {
        type: DataTypes.INTEGER,
        allowNull: true,
        comment: '成员上限'
      },
      member_count: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
        comment: '成员数量'
      },
      post_count: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
        comment: '帖子数量'
      },
      status: {
        type: DataTypes.ENUM('active', 'inactive', 'banned'),
        defaultValue: 'active',
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
    });

    // 创建索引
    await queryInterface.addIndex('circles', ['creator_id']);
    await queryInterface.addIndex('circles', ['status']);
    await queryInterface.addIndex('circles', ['is_public']);
    await queryInterface.addIndex('circles', ['name']);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('circles');
  }
};