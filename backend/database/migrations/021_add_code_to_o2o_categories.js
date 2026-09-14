const { DataTypes } = require('sequelize');

module.exports = {
  up: async (queryInterface) => {
    await queryInterface.addColumn('o2o_categories', 'code', {
      type: DataTypes.STRING(50),
      allowNull: true,
      comment: '分类业务标识'
    });

    await queryInterface.sequelize.query(`
      UPDATE o2o_categories
      SET code = CASE
        WHEN name IN ('second_hand', '二手物品', '二手') OR description IN ('二手物品', '二手交易', '二手') THEN 'second_hand'
        WHEN name IN ('rental', '租房信息', '租房') OR description IN ('房屋租赁', '租房信息', '租房') THEN 'rental'
        WHEN name IN ('carpool', '拼车') OR description IN ('拼车服务', '拼车') THEN 'carpool'
        WHEN name IN ('service', '服务') OR description IN ('服务提供', '服务') THEN 'service'
        WHEN name IN ('other', '其他') OR description IN ('其他') THEN 'other'
        ELSE code
      END
      WHERE code IS NULL OR code = ''
    `);

    await queryInterface.sequelize.query(`
      UPDATE o2o_categories
      SET code = CONCAT('category_', id)
      WHERE code IS NULL OR code = ''
    `);

    await queryInterface.sequelize.query(`
      UPDATE o2o_categories
      SET name = CASE code
        WHEN 'second_hand' THEN '二手'
        WHEN 'rental' THEN '租房'
        WHEN 'carpool' THEN '拼车'
        WHEN 'service' THEN '服务'
        WHEN 'other' THEN '其他'
        ELSE name
      END
    `);

    await queryInterface.changeColumn('o2o_categories', 'code', {
      type: DataTypes.STRING(50),
      allowNull: false,
      unique: true,
      comment: '分类业务标识'
    });

    await queryInterface.addIndex('o2o_categories', ['code'], {
      unique: true,
      name: 'o2o_categories_code'
    });
  },

  down: async (queryInterface) => {
    await queryInterface.removeIndex('o2o_categories', 'o2o_categories_code');
    await queryInterface.removeColumn('o2o_categories', 'code');
  }
};
