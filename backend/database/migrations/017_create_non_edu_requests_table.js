'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('non_edu_email_requests', {
      id: {
        type: Sequelize.BIGINT,
        autoIncrement: true,
        primaryKey: true
      },
      requested_username: {
        type: Sequelize.STRING(50),
        allowNull: false
      },
      personal_email: {
        type: Sequelize.STRING(100),
        allowNull: false,
        unique: true
      },
      reason: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      status: {
        type: Sequelize.ENUM('pending', 'approved', 'rejected', 'verified'),
        allowNull: false,
        defaultValue: 'pending'
      },
      admin_id: {
        type: Sequelize.BIGINT,
        allowNull: true
      },
      admin_note: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      rejected_reason: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      approved_at: {
        type: Sequelize.DATE,
        allowNull: true
      },
      rejected_at: {
        type: Sequelize.DATE,
        allowNull: true
      },
      verified_at: {
        type: Sequelize.DATE,
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

    await queryInterface.createTable('email_verification_tokens', {
      id: {
        type: Sequelize.BIGINT,
        autoIncrement: true,
        primaryKey: true
      },
      request_id: {
        type: Sequelize.BIGINT,
        allowNull: true,
        references: {
          model: 'non_edu_email_requests',
          key: 'id'
        },
        onDelete: 'SET NULL',
        onUpdate: 'CASCADE'
      },
      user_id: {
        type: Sequelize.BIGINT,
        allowNull: true,
        references: {
          model: 'users',
          key: 'id'
        },
        onDelete: 'SET NULL',
        onUpdate: 'CASCADE'
      },
      email: {
        type: Sequelize.STRING(100),
        allowNull: false
      },
      token_hash: {
        type: Sequelize.STRING(128),
        allowNull: false,
        unique: true
      },
      type: {
        type: Sequelize.ENUM('non_edu_onboarding'),
        allowNull: false,
        defaultValue: 'non_edu_onboarding'
      },
      expires_at: {
        type: Sequelize.DATE,
        allowNull: false
      },
      used_at: {
        type: Sequelize.DATE,
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

    await queryInterface.addIndex('non_edu_email_requests', ['status']);
    await queryInterface.addIndex('email_verification_tokens', ['type', 'expires_at']);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeIndex('email_verification_tokens', ['type', 'expires_at']);
    await queryInterface.removeIndex('non_edu_email_requests', ['status']);
    await queryInterface.dropTable('email_verification_tokens');
    await queryInterface.dropTable('non_edu_email_requests');
  }
};
