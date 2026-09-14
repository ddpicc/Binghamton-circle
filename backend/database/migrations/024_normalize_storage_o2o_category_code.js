module.exports = {
  up: async (queryInterface) => {
    await queryInterface.sequelize.query(`
      UPDATE o2o_categories
      SET code = 'storage'
      WHERE name = '存储' AND code LIKE 'category_%'
    `);
  },

  down: async (queryInterface) => {
    await queryInterface.sequelize.query(`
      UPDATE o2o_categories
      SET code = CONCAT('category_', id)
      WHERE name = '存储' AND code = 'storage'
    `);
  }
};
