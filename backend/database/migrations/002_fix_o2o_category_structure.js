const { DataTypes } = require('sequelize');

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // 创建 o2o_categories 表
    await queryInterface.createTable('o2o_categories', {
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
        comment: '分类图标'
      },
      is_active: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
        comment: '是否启用'
      },
      sort_order: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
        comment: '排序顺序'
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

    // 插入默认分类数据
    await queryInterface.bulkInsert('o2o_categories', [
      {
        id: 1,
        name: 'second_hand',
        description: '二手物品',
        icon: 'second_hand',
        is_active: true,
        sort_order: 1
      },
      {
        id: 2,
        name: 'rental',
        description: '房屋租赁',
        icon: 'rental',
        is_active: true,
        sort_order: 2
      },
      {
        id: 3,
        name: 'carpool',
        description: '拼车服务',
        icon: 'carpool',
        is_active: true,
        sort_order: 3
      },
      {
        id: 4,
        name: 'service',
        description: '服务提供',
        icon: 'service',
        is_active: true,
        sort_order: 4
      },
      {
        id: 5,
        name: 'other',
        description: '其他',
        icon: 'other',
        is_active: true,
        sort_order: 5
      }
    ]);

    // 修改 o2o_items 表，将 category ENUM 字段改为 category_id BIGINT
    await queryInterface.addColumn('o2o_items', 'category_id_new', {
      type: DataTypes.BIGINT,
      allowNull: true,
      comment: '分类ID',
      references: {
        model: 'o2o_categories',
        key: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL'
    });

    // 更新现有数据，将 category 枚举值映射到对应的 category_id
    await queryInterface.sequelize.query(`
      UPDATE o2o_items 
      SET category_id_new = 
        CASE category
          WHEN 'second_hand' THEN 1
          WHEN 'rental' THEN 2
          WHEN 'carpool' THEN 3
          WHEN 'service' THEN 4
          WHEN 'other' THEN 5
          ELSE NULL
        END
      WHERE category IS NOT NULL
    `);

    // 删除旧的 category 字段
    await queryInterface.removeColumn('o2o_items', 'category');

    // 重命名新字段为 category_id
    await queryInterface.renameColumn('o2o_items', 'category_id_new', 'category_id');

    // 确保 category_id 不为空
    await queryInterface.changeColumn('o2o_items', 'category_id', {
      type: DataTypes.BIGINT,
      allowNull: false,
      comment: '分类ID',
      references: {
        model: 'o2o_categories',
        key: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE'
    });

    // 删除旧的 category 索引（如果存在）
    try {
      await queryInterface.removeIndex('o2o_items', 'o2o_items_category');
    } catch (e) {
      // 索引可能不存在，忽略错误
    }

    // 创建新的 category_id 索引
    await queryInterface.addIndex('o2o_items', ['category_id']);

    // 为 o2o_categories 表创建索引
    await queryInterface.addIndex('o2o_categories', ['name']);
    await queryInterface.addIndex('o2o_categories', ['is_active']);
    await queryInterface.addIndex('o2o_categories', ['sort_order']);
  },

  down: async (queryInterface, Sequelize) => {
    // 删除索引
    await queryInterface.removeIndex('o2o_items', ['category_id']);
    await queryInterface.removeIndex('o2o_categories', ['name']);
    await queryInterface.removeIndex('o2o_categories', ['is_active']);
    await queryInterface.removeIndex('o2o_categories', ['sort_order']);

    // 添加回 category ENUM 字段
    await queryInterface.addColumn('o2o_items', 'category', {
      type: DataTypes.ENUM('second_hand', 'rental', 'carpool', 'service', 'other'),
      allowNull: true,
      comment: '分类'
    });

    // 更新数据，将 category_id 映射回 category 枚举值
    await queryInterface.sequelize.query(`
      UPDATE o2o_items 
      SET category = 
        CASE category_id
          WHEN 1 THEN 'second_hand'
          WHEN 2 THEN 'rental'
          WHEN 3 THEN 'carpool'
          WHEN 4 THEN 'service'
          WHEN 5 THEN 'other'
          ELSE NULL
        END
      WHERE category_id IS NOT NULL
    `);

    // 确保 category 不为空
    await queryInterface.changeColumn('o2o_items', 'category', {
      type: DataTypes.ENUM('second_hand', 'rental', 'carpool', 'service', 'other'),
      allowNull: false,
      comment: '分类'
    });

    // 删除 category_id 字段
    await queryInterface.removeColumn('o2o_items', 'category_id');

    // 删除 o2o_categories 表
    await queryInterface.dropTable('o2o_categories');
  }
};