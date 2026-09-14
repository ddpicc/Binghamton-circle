module.exports = {
  up: async (queryInterface, Sequelize) => {
    const { BIGINT, STRING, TEXT, JSON, ENUM, DATE, DECIMAL, BOOLEAN } = Sequelize.DataTypes;

    // 已审核并发布的生活地图点位
    await queryInterface.createTable('life_map_points', {
      id: { type: BIGINT, primaryKey: true, autoIncrement: true },
      name: { type: STRING(200), allowNull: false, comment: '点位名称' },
      description: { type: TEXT, allowNull: true, comment: '点位描述/备注' },
      category: { type: ENUM('food', 'grocery', 'service', 'campus', 'other'), allowNull: false, defaultValue: 'other', comment: '类别' },
      latitude: { type: DECIMAL(10, 7), allowNull: false, comment: '纬度' },
      longitude: { type: DECIMAL(10, 7), allowNull: false, comment: '经度' },
      address: { type: STRING(255), allowNull: true, comment: '地址' },
      phone: { type: STRING(50), allowNull: true, comment: '电话' },
      website: { type: STRING(255), allowNull: true, comment: '网站' },
      business_hours: { type: JSON, allowNull: true, comment: '营业时间配置' },
      tags: { type: JSON, allowNull: true, comment: '标签数组' },
      status: { type: ENUM('active', 'inactive', 'archived'), allowNull: false, defaultValue: 'active', comment: '状态' },
      created_by: {
        type: BIGINT,
        allowNull: true,
        references: { model: 'users', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
        comment: '创建者用户ID（管理员或有权限用户）'
      },
      created_at: { type: DATE, defaultValue: Sequelize.NOW },
      updated_at: { type: DATE, defaultValue: Sequelize.NOW }
    });

    await queryInterface.addIndex('life_map_points', ['category']);
    await queryInterface.addIndex('life_map_points', ['status']);
    await queryInterface.addIndex('life_map_points', ['created_by']);
    await queryInterface.addIndex('life_map_points', ['latitude', 'longitude']);

    // 用户提交的点位，待审核
    await queryInterface.createTable('life_map_point_submissions', {
      id: { type: BIGINT, primaryKey: true, autoIncrement: true },
      name: { type: STRING(200), allowNull: false, comment: '建议的点位名称' },
      description: { type: TEXT, allowNull: true, comment: '描述/备注' },
      category: { type: ENUM('food', 'grocery', 'service', 'campus', 'other'), allowNull: false, defaultValue: 'other', comment: '类别' },
      latitude: { type: DECIMAL(10, 7), allowNull: false, comment: '纬度' },
      longitude: { type: DECIMAL(10, 7), allowNull: false, comment: '经度' },
      address: { type: STRING(255), allowNull: true, comment: '地址' },
      phone: { type: STRING(50), allowNull: true, comment: '电话' },
      website: { type: STRING(255), allowNull: true, comment: '网站' },
      business_hours: { type: JSON, allowNull: true, comment: '营业时间配置' },
      tags: { type: JSON, allowNull: true, comment: '标签数组' },
      submitted_by: {
        type: BIGINT,
        allowNull: false,
        references: { model: 'users', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
        comment: '提交者用户ID'
      },
      status: { type: ENUM('pending', 'approved', 'rejected'), allowNull: false, defaultValue: 'pending', comment: '审核状态' },
      reviewed_by: {
        type: BIGINT,
        allowNull: true,
        references: { model: 'users', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
        comment: '审核管理员ID'
      },
      reviewed_at: { type: DATE, allowNull: true, comment: '审核时间' },
      review_note: { type: STRING(500), allowNull: true, comment: '审核备注' },
      approved_point_id: {
        type: BIGINT,
        allowNull: true,
        references: { model: 'life_map_points', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
        comment: '审核通过后关联生成的正式点位ID'
      },
      created_at: { type: DATE, defaultValue: Sequelize.NOW },
      updated_at: { type: DATE, defaultValue: Sequelize.NOW }
    });

    await queryInterface.addIndex('life_map_point_submissions', ['submitted_by']);
    await queryInterface.addIndex('life_map_point_submissions', ['status']);
    await queryInterface.addIndex('life_map_point_submissions', ['reviewed_by']);
    await queryInterface.addIndex('life_map_point_submissions', ['approved_point_id']);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('life_map_point_submissions');
    await queryInterface.dropTable('life_map_points');
  }
};

