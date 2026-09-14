module.exports = {
  up: async (queryInterface, Sequelize) => {
    const table = await queryInterface.describeTable('tree_hole_posts');
    if (table.title) {
      await queryInterface.removeColumn('tree_hole_posts', 'title');
    }
  },

  down: async (queryInterface, Sequelize) => {
    const { STRING } = Sequelize.DataTypes;
    const table = await queryInterface.describeTable('tree_hole_posts');
    if (!table.title) {
      await queryInterface.addColumn('tree_hole_posts', 'title', {
        type: STRING(200),
        allowNull: false,
        defaultValue: '',
        comment: '帖子标题'
      });
    }
  }
};
