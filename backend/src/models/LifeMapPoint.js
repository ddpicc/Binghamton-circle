const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const LifeMapPoint = sequelize.define('LifeMapPoint', {
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
  status: { type: DataTypes.ENUM('active', 'inactive', 'archived'), allowNull: false, defaultValue: 'active' },
  created_by: { type: DataTypes.BIGINT, allowNull: true }
}, {
  tableName: 'life_map_points',
  timestamps: true,
  underscored: true,
  indexes: [
    { fields: ['category'] },
    { fields: ['status'] },
    { fields: ['created_by'] },
    { fields: ['latitude', 'longitude'] }
  ]
});

module.exports = LifeMapPoint;

