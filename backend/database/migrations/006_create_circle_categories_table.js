const { DataTypes } = require('sequelize');

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // 创建圈子分类表
    await queryInterface.createTable('circle_categories', {
      id: {
        type: DataTypes.BIGINT,
        primaryKey: true,
        autoIncrement: true
      },
      name: {
        type: DataTypes.STRING(50),
        allowNull: false,
        unique: true,
        comment: '分类名称'
      },
      description: {
        type: DataTypes.TEXT,
        allowNull: true,
        comment: '分类描述'
      },
      icon: {
        type: DataTypes.STRING(100),
        allowNull: true,
        comment: '图标'
      },
      sort_order: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
        comment: '排序'
      },
      is_active: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
        comment: '是否启用'
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
    await queryInterface.addIndex('circle_categories', ['name'], { unique: true });
    await queryInterface.addIndex('circle_categories', ['sort_order']);
    await queryInterface.addIndex('circle_categories', ['is_active']);

    // 插入默认分类数据
    await queryInterface.bulkInsert('circle_categories', [
      {
        id: 1,
        name: '学习交流',
        description: '课程讨论、学习资料分享',
        icon: 'book',
        sort_order: 1,
        is_active: true
      },
      {
        id: 2,
        name: '生活娱乐',
        description: '日常生活、娱乐活动',
        icon: 'game',
        sort_order: 2,
        is_active: true
      },
      {
        id: 3,
        name: '运动健身',
        description: '体育活动、健身打卡',
        icon: 'sport',
        sort_order: 3,
        is_active: true
      },
      {
        id: 4,
        name: '求职实习',
        description: '招聘信息、实习经验',
        icon: 'work',
        sort_order: 4,
        is_active: true
      },
      {
        id: 5,
        name: '二手交易',
        description: '闲置物品买卖',
        icon: 'shopping',
        sort_order: 5,
        is_active: true
      },
      {
        id: 6,
        name: '社团组织',
        description: '学生社团、组织活动',
        icon: 'group',
        sort_order: 6,
        is_active: true
      },
      {
        id: 7,
        name: '其他',
        description: '其他类型的圈子',
        icon: 'more',
        sort_order: 999,
        is_active: true
      }
    ]);

    // 为 circles 表添加 category_id 字段
    await queryInterface.addColumn('circles', 'category_id', {
      type: DataTypes.BIGINT,
      allowNull: true,
      comment: '分类ID',
      references: {
        model: 'circle_categories',
        key: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL'
    });

    // 创建索引
    await queryInterface.addIndex('circles', ['category_id']);
  },

  down: async (queryInterface, Sequelize) => {
    // 删除索引
    await queryInterface.removeIndex('circles', ['category_id']);
    
    // 删除字段
    await queryInterface.removeColumn('circles', 'category_id');
    
    // 删除表
    await queryInterface.dropTable('circle_categories');
  }
};