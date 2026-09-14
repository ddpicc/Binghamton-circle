'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.removeColumn('circles', 'max_members');
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.addColumn('circles', 'max_members', {
      type: Sequelize.INTEGER,
      allowNull: true,
      comment: '成员上限',
      validate: {
        min: 1
      }
    });
  }
};