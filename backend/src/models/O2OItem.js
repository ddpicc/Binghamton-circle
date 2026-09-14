const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const O2OItem = sequelize.define('O2OItem', {
  id: {
    type: DataTypes.BIGINT,
    primaryKey: true,
    autoIncrement: true
  },
  user_id: {
    type: DataTypes.BIGINT,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  title: {
    type: DataTypes.STRING(200),
    allowNull: false,
    comment: '物品标题'
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: false,
    comment: '物品描述'
  },
  category_id: {
    type: DataTypes.BIGINT,
    allowNull: false,
    comment: '分类ID',
    references: {
      model: 'o2o_categories',
      key: 'id'
    }
  },
  type: {
    type: DataTypes.ENUM('item', 'service', 'carpool'),
    defaultValue: 'item',
    comment: '物品类型'
  },
  price: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true,
    comment: '价格'
  },
  deposit: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true,
    comment: '押金'
  },
  house_type: {
    type: DataTypes.ENUM('whole', 'share', 'single'),
    allowNull: true,
    comment: '房屋类型'
  },
  room_config: {
    type: DataTypes.STRING(50),
    allowNull: true,
    comment: '房间配置'
  },
  area: {
    type: DataTypes.DECIMAL(8, 2),
    allowNull: true,
    comment: '面积'
  },
  floor: {
    type: DataTypes.STRING(50),
    allowNull: true,
    comment: '楼层'
  },
  orientation: {
    type: DataTypes.STRING(20),
    allowNull: true,
    comment: '朝向'
  },
  facilities: {
    type: DataTypes.JSON,
    allowNull: true,
    comment: '配套设施'
  },
  move_in_date: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: '可入住时间'
  },
  min_lease: {
    type: DataTypes.STRING(20),
    allowNull: true,
    comment: '最短租期'
  },
  original_price: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true,
    comment: '原价'
  },
  price_type: {
    type: DataTypes.ENUM('fixed', 'negotiable', 'free'),
    defaultValue: 'fixed',
    comment: '价格类型'
  },
  images: {
    type: DataTypes.JSON,
    allowNull: true,
    comment: '图片URL数组'
  },
  contact_info: {
    type: DataTypes.JSON,
    allowNull: true,
    comment: '联系信息'
  },
  location: {
    type: DataTypes.STRING(255),
    allowNull: true,
    comment: '位置'
  },
  condition: {
    type: DataTypes.ENUM('new', 'like_new', 'good', 'fair', 'poor'),
    allowNull: true,
    comment: '物品状态'
  },
  tags: {
    type: DataTypes.JSON,
    allowNull: true,
    comment: '标签数组'
  },
  status: {
    type: DataTypes.ENUM('available', 'reserved', 'sold', 'expired', 'deleted'),
    defaultValue: 'available',
    comment: '状态'
  },
  view_count: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    comment: '浏览数'
  },
  like_count: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    comment: '点赞数'
  },
  is_pinned: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    comment: '是否置顶'
  },
  is_urgent: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    comment: '是否加急'
  },
  expire_date: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: '过期时间'
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
  tableName: 'o2o_items',
  timestamps: true,
  underscored: true,
  indexes: [
    {
      fields: ['user_id']
    },
    {
      fields: ['category_id']
    },
    {
      fields: ['status']
    },
    {
      fields: ['price']
    },
    {
      fields: ['created_at']
    },
    {
      fields: ['expire_date']
    }
  ]
});

module.exports = O2OItem;