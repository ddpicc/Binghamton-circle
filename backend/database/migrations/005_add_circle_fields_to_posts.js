const { DataTypes } = require('sequelize');

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // 为 posts 表添加圈子相关字段
    await queryInterface.addColumn('posts', 'circle_id', {
      type: DataTypes.BIGINT,
      allowNull: true,
      comment: '圈子ID',
      references: {
        model: 'circles',
        key: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL'
    });

    await queryInterface.addColumn('posts', 'is_featured', {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      comment: '是否精华'
    });

    // 创建索引
    await queryInterface.addIndex('posts', ['circle_id']);
    await queryInterface.addIndex('posts', ['is_featured']);
    await queryInterface.addIndex('posts', ['circle_id', 'is_featured']);
  },

  down: async (queryInterface, Sequelize) => {
    // 删除索引
    await queryInterface.removeIndex('posts', ['circle_id']);
    await queryInterface.removeIndex('posts', ['is_featured']);
    await queryInterface.removeIndex('posts', ['circle_id', 'is_featured']);

    // 删除字段
    await queryInterface.removeColumn('posts', 'circle_id');
    await queryInterface.removeColumn('posts', 'is_featured');
  }
};