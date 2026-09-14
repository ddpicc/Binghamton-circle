module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('home_banner_configs', {
      id: {
        type: Sequelize.BIGINT,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false
      },
      source_type: {
        type: Sequelize.ENUM('activity', 'notice'),
        allowNull: false
      },
      source_id: {
        type: Sequelize.BIGINT,
        allowNull: false
      },
      custom_tag: {
        type: Sequelize.STRING(50),
        allowNull: true
      },
      custom_title: {
        type: Sequelize.STRING(255),
        allowNull: true
      },
      custom_link_text: {
        type: Sequelize.STRING(50),
        allowNull: true
      },
      is_active: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: true
      },
      start_time: {
        type: Sequelize.DATE,
        allowNull: true
      },
      end_time: {
        type: Sequelize.DATE,
        allowNull: true
      },
      created_by: {
        type: Sequelize.BIGINT,
        allowNull: true
      },
      updated_by: {
        type: Sequelize.BIGINT,
        allowNull: true
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      }
    });

    await queryInterface.addIndex('home_banner_configs', ['is_active']);
    await queryInterface.addIndex('home_banner_configs', ['source_type', 'source_id']);
  },

  async down(queryInterface) {
    await queryInterface.dropTable('home_banner_configs');
  }
};
