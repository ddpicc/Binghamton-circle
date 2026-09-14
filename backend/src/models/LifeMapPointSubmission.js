const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const LifeMapPointSubmission = sequelize.define('LifeMapPointSubmission', {
  id: { type: DataTypes.BIGINT, primaryKey: true, autoIncrement: true },
  name: { type: DataTypes.STRING(200), allowNull: false },
  description: { type: DataTypes.TEXT, allowNull: true },
  category: { type: DataTypes.ENUM('food', 'grocery', 'service', 'campus', 'other'), allowNull: false, defaultValue: 'other' },
  latitude: { type: DataTypes.DECIMAL(10, 7), allowNull: false },
  longitude: { type: DataTypes.DECIMAL(10, 7), allowNull: false },
  address: { type: DataTypes.STRING(255), allowNull: true },
  phone: { type: DataTypes.STRING(50), allowNull: true },
  website: { type: DataTypes.STRING(255), allowNull: true },
  business_hours: { type: DataTypes.JSON, allowNull: true },
  tags: { type: DataTypes.JSON, allowNull: true },
  submitted_by: { type: DataTypes.BIGINT, allowNull: false },
  status: { type: DataTypes.ENUM('pending', 'approved', 'rejected'), allowNull: false, defaultValue: 'pending' },
  reviewed_by: { type: DataTypes.BIGINT, allowNull: true },
  reviewed_at: { type: DataTypes.DATE, allowNull: true },
  review_note: { type: DataTypes.STRING(500), allowNull: true },
  approved_point_id: { type: DataTypes.BIGINT, allowNull: true }
}, {
  tableName: 'life_map_point_submissions',
  timestamps: true,
  underscored: true,
  indexes: [
    { fields: ['submitted_by'] },
    { fields: ['status'] },
    { fields: ['reviewed_by'] },
    { fields: ['approved_point_id'] }
  ]
});

module.exports = LifeMapPointSubmission;

