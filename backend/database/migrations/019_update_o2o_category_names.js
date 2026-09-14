const { DataTypes } = require('sequelize');

module.exports = {
  up: async (queryInterface, Sequelize) => {
    console.log('开始更新O2O分类名称...');
    
    // 更新分类名称为中文
    await queryInterface.sequelize.query(`
      UPDATE o2o_categories 
      SET name = '二手物品' 
      WHERE name = 'second_hand'
    `);
    console.log('已将 "second_hand" 更新为 "二手物品"');
    
    await queryInterface.sequelize.query(`
      UPDATE o2o_categories 
      SET name = '租房信息' 
      WHERE name = 'rental'
    `);
    console.log('已将 "rental" 更新为 "租房信息"');
    
    console.log('O2O分类名称更新完成');
  },

  down: async (queryInterface, Sequelize) => {
    console.log('回滚O2O分类名称...');
    
    // 回滚分类名称
    await queryInterface.sequelize.query(`
      UPDATE o2o_categories 
      SET name = 'second_hand' 
      WHERE name = '二手物品'
    `);
    console.log('已将 "二手物品" 回滚为 "second_hand"');
    
    await queryInterface.sequelize.query(`
      UPDATE o2o_categories 
      SET name = 'rental' 
      WHERE name = '租房信息'
    `);
    console.log('已将 "租房信息" 回滚为 "rental"');
    
    console.log('O2O分类名称回滚完成');
  }
};