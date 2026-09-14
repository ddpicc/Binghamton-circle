module.exports = {
  up: async (queryInterface, Sequelize) => {
    const { BIGINT, STRING, ENUM, TEXT, BOOLEAN, DATE } = Sequelize;

    await queryInterface.createTable('blocked_keywords', {
      id: {
        type: BIGINT,
        primaryKey: true,
        autoIncrement: true
      },
      keyword: {
        type: STRING(100),
        allowNull: false,
        comment: '屏蔽关键词'
      },
      type: {
        type: ENUM('exact', 'partial', 'regex'),
        defaultValue: 'exact',
        comment: '匹配类型：exact=完全匹配，partial=包含匹配，regex=正则表达式'
      },
      action: {
        type: ENUM('block', 'mark', 'replace'),
        defaultValue: 'block',
        comment: '处理方式：block=完全屏蔽，mark=标记提醒，replace=替换为***'
      },
      reason: {
        type: TEXT,
        allowNull: true,
        comment: '屏蔽原因'
      },
      is_active: {
        type: BOOLEAN,
        defaultValue: true,
        comment: '是否启用'
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

    const safeAddIndex = async (fields, name) => {
      try {
        await queryInterface.addIndex('blocked_keywords', fields, { name });
      } catch (error) {
        if (error?.original?.code === 'ER_DUP_KEYNAME' || error?.original?.errno === 1061) {
          return;
        }
        throw error;
      }
    };

    await safeAddIndex(['keyword'], 'blocked_keywords_keyword');
    await safeAddIndex(['type'], 'blocked_keywords_type');
    await safeAddIndex(['is_active'], 'blocked_keywords_is_active');
    await safeAddIndex(['created_at'], 'blocked_keywords_created_at');
  },

  down: async (queryInterface) => {
    await queryInterface.dropTable('blocked_keywords');
  }
};
