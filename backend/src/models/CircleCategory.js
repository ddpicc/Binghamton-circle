const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const CircleCategory = sequelize.define('CircleCategory', {
  id: {
    type: DataTypes.BIGINT,
    primaryKey: true,
    autoIncrement: true
  },
  name: {
    type: DataTypes.STRING(50),
    allowNull: false,
    unique: true,
    comment: '分类名称',
    validate: {
      len: [2, 50]
    }
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: '分类描述',
    validate: {
      len: [0, 500]
    }
  },
  icon: {
    type: DataTypes.STRING(100),
    allowNull: true,
    comment: '图标'
  },
  sort_order: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    comment: '排序'
  },
  is_active: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
    comment: '是否启用'
  },
  circle_count: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    comment: '圈子数量'
  }
}, {
  tableName: 'circle_categories',
  timestamps: true,
  underscored: true,
  indexes: [
    {
      unique: true,
      fields: ['name']
    },
    {
      fields: ['sort_order']
    },
    {
      fields: ['is_active']
    }
  ]
});

// 静态方法
CircleCategory.getActiveCategories = async function() {
  return await this.findAll({
    where: { is_active: true },
    order: [['sort_order', 'ASC'], ['id', 'ASC']]
  });
};

CircleCategory.getCategoriesWithCount = async function() {
  const categories = await this.findAll({
    where: { is_active: true },
    include: [
      {
        model: sequelize.models.Circle,
        where: { status: 'active' },
        required: false,
        attributes: []
      }
    ],
    attributes: [
      'id',
      'name',
      'description',
      'icon',
      'sort_order',
      [
        sequelize.fn('COUNT', sequelize.col('circles.id')),
        'circle_count'
      ]
    ],
    group: ['CircleCategory.id'],
    order: [['sort_order', 'ASC'], ['id', 'ASC']]
  });
  
  return categories.map(cat => ({
    ...cat.toJSON(),
    circle_count: parseInt(cat.get('circle_count') || 0)
  }));
};

module.exports = CircleCategory;