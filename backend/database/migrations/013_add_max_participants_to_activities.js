module.exports = {
  up: async (queryInterface, Sequelize) => {
    const table = await queryInterface.describeTable('activities');
    if (!table.max_participants) {
      await queryInterface.addColumn('activities', 'max_participants', {
        type: Sequelize.INTEGER,
        allowNull: true,
        comment: '最大报名人数（可选）'
      });
    }
  },

  down: async (queryInterface) => {
    const table = await queryInterface.describeTable('activities');
    if (table.max_participants) {
      await queryInterface.removeColumn('activities', 'max_participants');
    }
  }
};
