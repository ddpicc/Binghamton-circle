const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Circle = sequelize.define('Circle', {
  id: {
    type: DataTypes.BIGINT,
    primaryKey: true,
    autoIncrement: true
  },
  name: {
    type: DataTypes.STRING(100),
    allowNull: false,
    comment: '圈子名称',
    validate: {
      len: [2, 100]
    }
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: '圈子描述',
    validate: {
      len: [0, 1000]
    }
  },
  cover_image: {
    type: DataTypes.STRING(500),
    allowNull: true,
    comment: '封面图URL',
    validate: {
      isUrl: true
    }
  },
  creator_id: {
    type: DataTypes.BIGINT,
    allowNull: false,
    comment: '创建者ID',
    references: {
      model: 'users',
      key: 'id'
    }
  },
  category_id: {
    type: DataTypes.BIGINT,
    allowNull: true,
    comment: '分类ID',
    references: {
      model: 'circle_categories',
      key: 'id'
    }
  },
  tags: {
    type: DataTypes.JSON,
    allowNull: true,
    comment: '标签数组',
    defaultValue: []
  },
  is_public: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
    comment: '是否公开'
  },
  need_approval: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    comment: '是否需要审核'
  },
  member_count: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    comment: '成员数量'
  },
  post_count: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    comment: '帖子数量'
  },
  status: {
    type: DataTypes.ENUM('active', 'inactive', 'banned'),
    defaultValue: 'active',
    comment: '状态'
  }
}, {
  tableName: 'circles',
  timestamps: true,
  underscored: true,
  indexes: [
    {
      fields: ['creator_id']
    },
    {
      fields: ['status']
    },
    {
      fields: ['is_public']
    },
    {
      fields: ['category_id']
    },
    {
      fields: ['name']
    },
    {
      fields: ['member_count']
    },
    {
      fields: ['post_count']
    }
  ],
  hooks: {
    beforeCreate: async (circle) => {
      // 检查用户创建权限
      const user = await sequelize.models.User.findByPk(circle.creator_id);
      if (user && user.role !== 'admin') {
        const existingCircle = await Circle.findOne({
          where: { creator_id: circle.creator_id }
        });
        if (existingCircle) {
          throw new Error('每个用户只能创建一个圈子');
        }
      }
    }
  }
});

// 实例方法
Circle.prototype.addMember = async function(userId, role = 'member') {
  const member = await this.createMember({
    user_id: userId,
    role: role,
    status: 'approved'
  });
  
  // 更新成员计数
  this.member_count = await this.countMembers();
  await this.save();
  
  return member;
};

Circle.prototype.removeMember = async function(userId) {
  const result = await this.getMembers({
    where: { user_id: userId }
  });
  
  if (result.length > 0) {
    await result[0].destroy();
    
    // 更新成员计数
    this.member_count = await this.countMembers();
    await this.save();
  }
};

Circle.prototype.countMembers = async function() {
  return await this.countMembers({
    where: { status: 'approved' }
  });
};

Circle.prototype.isMember = async function(userId) {
  const member = await this.getMembers({
    where: { 
      user_id: userId,
      status: 'approved'
    }
  });
  return member.length > 0;
};

Circle.prototype.getMemberRole = async function(userId) {
  const member = await this.getMembers({
    where: { 
      user_id: userId,
      status: 'approved'
    }
  });
  return member.length > 0 ? member[0].role : null;
};

Object.defineProperty(Circle.prototype, 'is_private', {
  get() {
    const isPublic = this.getDataValue('is_public');
    return isPublic === undefined ? undefined : !isPublic;
  },
  set(value) {
    this.setDataValue('is_public', !value);
  }
});

const originalToJSON = Circle.prototype.toJSON;
Circle.prototype.toJSON = function() {
  const values = originalToJSON ? originalToJSON.call(this) : this.get();
  return {
    ...values,
    is_private: values.is_public !== undefined ? !values.is_public : values.is_private,
    need_approval: values.need_approval
  };
};

// 静态方法
Circle.findByCreator = async function(userId) {
  return await this.findOne({
    where: { creator_id: userId, status: 'active' },
    include: ['category']
  });
};

Circle.findPublic = async function(options = {}) {
  return await this.findAll({
    where: { 
      is_public: true,
      status: 'active'
    },
    include: ['category', 'creator'],
    ...options,
    order: [['member_count', 'DESC']]
  });
};

Circle.findUserCircles = async function(userId) {
  return await this.findAll({
    where: { status: 'active' },
    include: [
      {
        model: sequelize.models.CircleMember,
        where: { 
          user_id: userId,
          status: 'approved'
        }
      },
      'category'
    ]
  });
};

module.exports = Circle;
