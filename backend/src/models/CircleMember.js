const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const CircleMember = sequelize.define('CircleMember', {
  id: {
    type: DataTypes.BIGINT,
    primaryKey: true,
    autoIncrement: true
  },
  circle_id: {
    type: DataTypes.BIGINT,
    allowNull: false,
    comment: '圈子ID',
    references: {
      model: 'circles',
      key: 'id'
    }
  },
  user_id: {
    type: DataTypes.BIGINT,
    allowNull: false,
    comment: '用户ID',
    references: {
      model: 'users',
      key: 'id'
    }
  },
  role: {
    type: DataTypes.ENUM('creator', 'admin', 'member'),
    defaultValue: 'member',
    comment: '角色',
    validate: {
      isIn: [['creator', 'admin', 'member']]
    }
  },
  status: {
    type: DataTypes.ENUM('pending', 'approved', 'rejected', 'left'),
    defaultValue: 'approved',
    comment: '状态',
    validate: {
      isIn: [['pending', 'approved', 'rejected', 'left']]
    }
  },
  joined_at: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
    comment: '加入时间'
  }
}, {
  tableName: 'circle_members',
  timestamps: true,
  underscored: true,
  indexes: [
    {
      unique: true,
      fields: ['circle_id', 'user_id'],
      name: 'uk_circle_user'
    },
    {
      fields: ['circle_id']
    },
    {
      fields: ['user_id']
    },
    {
      fields: ['status']
    },
    {
      fields: ['role']
    }
  ],
  hooks: {
    beforeCreate: async (member) => {
      // 检查用户是否已经是成员
      const existingMember = await CircleMember.findOne({
        where: {
          circle_id: member.circle_id,
          user_id: member.user_id
        }
      });
      
      if (existingMember) {
        throw new Error('用户已经是该圈子的成员');
      }
      
      // 检查圈子成员上限
      const circle = await sequelize.models.Circle.findByPk(member.circle_id);
      if (circle && circle.max_members) {
        const currentCount = await CircleMember.count({
          where: {
            circle_id: member.circle_id,
            status: 'approved'
          }
        });
        
        if (currentCount >= circle.max_members) {
          throw new Error('圈子已达到成员上限');
        }
      }
    }
  }
});

// 实例方法
CircleMember.prototype.approve = async function() {
  this.status = 'approved';
  await this.save();
  
  // 更新圈子成员计数
  const circle = await sequelize.models.Circle.findByPk(this.circle_id);
  if (circle) {
    circle.member_count = await circle.countMembers();
    await circle.save();
  }
};

CircleMember.prototype.reject = async function(reason) {
  this.status = 'rejected';
  await this.save();
};

CircleMember.prototype.leave = async function() {
  this.status = 'left';
  await this.save();
  
  // 更新圈子成员计数
  const circle = await sequelize.models.Circle.findByPk(this.circle_id);
  if (circle) {
    circle.member_count = await circle.countMembers();
    await circle.save();
  }
};

// 静态方法
CircleMember.findByCircleAndUser = async function(circleId, userId) {
  return await this.findOne({
    where: {
      circle_id: circleId,
      user_id: userId
    },
    include: ['user', 'circle']
  });
};

CircleMember.getPendingRequests = async function(circleId) {
  return await this.findAll({
    where: {
      circle_id: circleId,
      status: 'pending'
    },
    include: ['user'],
    order: [['created_at', 'ASC']]
  });
};

CircleMember.getMembersByRole = async function(circleId, role) {
  return await this.findAll({
    where: {
      circle_id: circleId,
      role: role,
      status: 'approved'
    },
    include: ['user']
  });
};

module.exports = CircleMember;