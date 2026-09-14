const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const HomeBannerConfig = sequelize.define('HomeBannerConfig', {
  id: {
    type: DataTypes.BIGINT,
    primaryKey: true,
    autoIncrement: true
  },
  source_type: {
    type: DataTypes.ENUM('activity', 'notice'),
    allowNull: false,
    comment: 'Banner 内容来源类型'
  },
  source_id: {
    type: DataTypes.BIGINT,
    allowNull: false,
    comment: '来源内容 ID'
  },
  custom_tag: {
    type: DataTypes.STRING(50),
    allowNull: true,
    comment: '自定义标签文案'
  },
  custom_title: {
    type: DataTypes.STRING(255),
    allowNull: true,
    comment: '自定义标题文案'
  },
  custom_link_text: {
    type: DataTypes.STRING(50),
    allowNull: true,
    comment: '自定义按钮文案'
  },
  is_active: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true,
    comment: '是否为当前生效 Banner'
  },
  start_time: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: '开始生效时间'
  },
  end_time: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: '结束生效时间'
  },
  created_by: {
    type: DataTypes.BIGINT,
    allowNull: true,
    comment: '创建人'
  },
  updated_by: {
    type: DataTypes.BIGINT,
    allowNull: true,
    comment: '更新人'
  },
  created_at: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  },
  updated_at: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  }
}, {
  tableName: 'home_banner_configs',
  timestamps: true,
  underscored: true,
  indexes: [
    {
      fields: ['is_active']
    },
    {
      fields: ['source_type', 'source_id']
    }
  ]
});

module.exports = HomeBannerConfig;
