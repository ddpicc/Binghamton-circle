module.exports = {
  up: async (queryInterface, Sequelize) => {
    const { BIGINT, STRING, TEXT, INTEGER, ENUM, DATE } = Sequelize;

    await queryInterface.createTable('activities', {
      id: {
        type: BIGINT,
        primaryKey: true,
        autoIncrement: true
      },
      user_id: {
        type: BIGINT,
        allowNull: false,
        references: { model: 'users', key: 'id' },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
        comment: '发布者用户ID'
      },
      title: {
        type: STRING(255),
        allowNull: false,
        comment: '活动标题'
      },
      location: {
        type: STRING(255),
        allowNull: true,
        comment: '活动地点（可选）'
      },
      time: {
        type: DATE,
        allowNull: false,
        comment: '活动时间'
      },
      description: {
        type: TEXT,
        allowNull: true,
        comment: '活动描述（可选）'
      },
      participant_count: {
        type: INTEGER,
        allowNull: false,
        defaultValue: 0,
        comment: '报名参与人数'
      },
      max_participants: {
        type: INTEGER,
        allowNull: true,
        comment: '最大报名人数（可选）'
      },
      status: {
        type: ENUM('published', 'deleted'),
        allowNull: false,
        defaultValue: 'published',
        comment: '状态'
      },
      created_at: {
        type: DATE,
        defaultValue: Sequelize.NOW
      },
      updated_at: {
        type: DATE,
        defaultValue: Sequelize.NOW
      }
    });

    await queryInterface.addIndex('activities', ['user_id']);
    await queryInterface.addIndex('activities', ['time']);
    await queryInterface.addIndex('activities', ['created_at']);
    await queryInterface.addIndex('activities', ['status']);
  },

  down: async (queryInterface) => {
    await queryInterface.dropTable('activities');
  }
};
