module.exports = {
  up: async (queryInterface, Sequelize) => {
    const { BIGINT, DATE } = Sequelize;
    await queryInterface.createTable('activity_participants', {
      id: { type: BIGINT, primaryKey: true, autoIncrement: true },
      activity_id: { type: BIGINT, allowNull: false, references: { model: 'activities', key: 'id' }, onDelete: 'CASCADE', onUpdate: 'CASCADE' },
      user_id: { type: BIGINT, allowNull: false, references: { model: 'users', key: 'id' }, onDelete: 'CASCADE', onUpdate: 'CASCADE' },
      created_at: { type: DATE, defaultValue: Sequelize.NOW }
    })
    await queryInterface.addIndex('activity_participants', ['activity_id'])
    await queryInterface.addIndex('activity_participants', ['user_id'])
    await queryInterface.addIndex('activity_participants', ['activity_id', 'user_id'], { unique: true })
  },
  down: async (queryInterface) => {
    await queryInterface.dropTable('activity_participants')
  }
}

