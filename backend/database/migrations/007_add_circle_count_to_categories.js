'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('circle_categories', 'circle_count', {
      type: Sequelize.INTEGER,
      defaultValue: 0,
      comment: '圈子数量',
      after: 'is_active'
    });
    
    // 更新现有分类的圈子数量
    const categories = await queryInterface.sequelize.query(
      `SELECT id FROM circle_categories WHERE is_active = true`,
      { type: Sequelize.QueryTypes.SELECT }
    );
    
    for (const category of categories) {
      const count = await queryInterface.sequelize.query(
        `SELECT COUNT(*) as count FROM circles WHERE category_id = ? AND status = 'active'`,
        { 
          replacements: [category.id],
          type: Sequelize.QueryTypes.SELECT 
        }
      );
      
      await queryInterface.sequelize.query(
        `UPDATE circle_categories SET circle_count = ? WHERE id = ?`,
        { 
          replacements: [count[0].count, category.id],
          type: Sequelize.QueryTypes.UPDATE 
        }
      );
    }
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn('circle_categories', 'circle_count');
  }
};