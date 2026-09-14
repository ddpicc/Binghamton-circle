module.exports = {
  up: async (queryInterface, Sequelize) => {
    const { BIGINT, INTEGER, DATE, ENUM, TEXT } = Sequelize;

    await queryInterface.createTable('conversations', {
      id: {
        type: BIGINT,
        primaryKey: true,
        autoIncrement: true
      },
      user_a_id: {
        type: BIGINT,
        allowNull: false,
        comment: '会话参与者A（较小的用户ID）',
        references: { model: 'users', key: 'id' },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE'
      },
      user_b_id: {
        type: BIGINT,
        allowNull: false,
        comment: '会话参与者B（较大的用户ID）',
        references: { model: 'users', key: 'id' },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE'
      },
      last_message_id: {
        type: BIGINT,
        allowNull: true,
        comment: '最近一条消息ID'
      },
      last_message_at: {
        type: DATE,
        allowNull: true,
        comment: '最近消息时间'
      },
      unread_a: {
        type: INTEGER,
        allowNull: false,
        defaultValue: 0,
        comment: 'A 用户未读数'
      },
      unread_b: {
        type: INTEGER,
        allowNull: false,
        defaultValue: 0,
        comment: 'B 用户未读数'
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

    await queryInterface.addConstraint('conversations', {
      fields: ['user_a_id', 'user_b_id'],
      type: 'unique',
      name: 'uniq_conversations_participants'
    });

    await queryInterface.addIndex('conversations', ['user_a_id']);
    await queryInterface.addIndex('conversations', ['user_b_id']);
    await queryInterface.addIndex('conversations', ['last_message_at']);

    await queryInterface.createTable('messages', {
      id: {
        type: BIGINT,
        primaryKey: true,
        autoIncrement: true
      },
      conversation_id: {
        type: BIGINT,
        allowNull: false,
        references: { model: 'conversations', key: 'id' },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE'
      },
      sender_id: {
        type: BIGINT,
        allowNull: false,
        references: { model: 'users', key: 'id' },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE'
      },
      receiver_id: {
        type: BIGINT,
        allowNull: false,
        references: { model: 'users', key: 'id' },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE'
      },
      content: {
        type: TEXT,
        allowNull: false,
        comment: '消息内容'
      },
      status: {
        type: ENUM('sent', 'delivered', 'read'),
        allowNull: false,
        defaultValue: 'sent',
        comment: '消息状态'
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

    await queryInterface.addIndex('messages', ['conversation_id', 'created_at']);
    await queryInterface.addIndex('messages', ['receiver_id', 'status']);
  },

  down: async (queryInterface) => {
    await queryInterface.dropTable('messages');
    await queryInterface.dropTable('conversations');
  }
};
