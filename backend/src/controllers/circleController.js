const { Circle, CircleMember, CircleCategory, User, Post, Like, Comment, sequelize } = require('../models');
const ApiError = require('../utils/ApiError');
const { Op } = require('sequelize');
const {
  assertMiniProgramTextSecurityForTexts,
  WechatContentSecurityError
} = require('../services/wechatContentSecurityService');

/**
 * 创建圈子
 */
exports.createCircle = async (req, res) => {
  try {
    const { name, description, category_id, is_private, rules, cover_image, cover_image_url, is_public, need_approval } = req.body;
    const creatorId = req.user.id;
    const trimmedName = (name || '').trim();
    const trimmedDescription = typeof description === 'string' ? description.trim() : description;
    const trimmedRules = typeof rules === 'string' ? rules.trim() : rules;

    if (!trimmedName) {
      return res.status(400).json({ error: '圈子名称不能为空' });
    }

    await assertMiniProgramTextSecurityForTexts({
      user: req.user,
      scene: 3,
      texts: [trimmedName, trimmedDescription, trimmedRules],
      requestHeaders: req.headers
    });

    const coverImageUrl = cover_image || cover_image_url || (req.file ? `/uploads/circles/${req.file.filename}` : null);
    const parsedCategoryId = category_id ? Number(category_id) : null;
    const rawIsPrivate = is_private !== undefined ? (typeof is_private === 'string' ? is_private === 'true' : !!is_private) : undefined;
    const rawIsPublic = is_public !== undefined ? (typeof is_public === 'string' ? is_public === 'true' : !!is_public) : undefined;
    const rawNeedApproval = need_approval !== undefined ? (typeof need_approval === 'string' ? need_approval === 'true' : !!need_approval) : undefined;

    const isPrivateValue = rawIsPrivate !== undefined ? rawIsPrivate : (rawIsPublic !== undefined ? !rawIsPublic : false);
    const isPublicValue = rawIsPublic !== undefined ? rawIsPublic : !isPrivateValue;
    const needApprovalValue = rawNeedApproval !== undefined ? rawNeedApproval : isPrivateValue;

    // 创建圈子
    const circle = await Circle.create({
      name: trimmedName,
      description: trimmedDescription,
      category_id: parsedCategoryId,
      creator_id: creatorId,
      is_public: isPublicValue,
      need_approval: needApprovalValue,
      rules: trimmedRules,
      cover_image: coverImageUrl
    });
    
    // 创建者自动成为成员和管理员
    await CircleMember.create({
      circle_id: circle.id,
      user_id: creatorId,
      role: 'creator',
      status: 'approved'
    });
    
    // 更新圈子成员计数
    await circle.increment('member_count', { by: 1 });
    
    // 更新分类统计
    if (parsedCategoryId) {
      await CircleCategory.increment('circle_count', {
        where: { id: parsedCategoryId }
      });
    }
    
    const createdCircle = await Circle.findByPk(circle.id, {
      include: [
        {
          model: CircleCategory,
          as: 'category',
          attributes: ['id', 'name']
        },
        {
          model: User,
          as: 'creator',
          attributes: ['id', 'username'],
          include: [
            {
              model: require('../models').UserProfile,
              as: 'profile',
              attributes: ['nickname', 'avatar']
            }
          ]
        }
      ]
    });
    
    res.status(201).json({
      message: '圈子创建成功',
      circle: createdCircle
    });
  } catch (error) {
    console.error('创建圈子失败:', error);
    if (error instanceof WechatContentSecurityError) {
      return res.status(error.statusCode).json({ error: error.message, code: error.code });
    }
    res.status(500).json({ error: '创建圈子失败' });
  }
};

/**
 * 获取圈子列表
 */
exports.getCircles = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      category_id,
      search,
      sortBy = 'created_at',
      sortOrder = 'DESC'
    } = req.query;

    const offset = (page - 1) * limit;
    const whereClause = { status: 'active' };
    const userId = req.user?.id;
    
    // 分类筛选
    if (category_id) {
      whereClause.category_id = category_id;
    }
    
    // 搜索功能
    if (search) {
      whereClause[Op.or] = [
        { name: { [Op.like]: `%${search}%` } },
        { description: { [Op.like]: `%${search}%` } }
      ];
    }

    const { count, rows: circles } = await Circle.findAndCountAll({
      where: whereClause,
      include: [
        {
          model: CircleCategory,
          as: 'category',
          attributes: ['id', 'name']
        },
        {
          model: User,
          as: 'creator',
          attributes: ['id', 'username'],
          include: [
            {
              model: require('../models').UserProfile,
              as: 'profile',
              attributes: ['nickname', 'avatar']
            }
          ]
        }
      ],
      order: [[sortBy, sortOrder]],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    // 为每个圈子添加用户成员状态信息
    const circlesWithMemberInfo = await Promise.all(
      circles.map(async (circle) => {
        let isMember = false;
        let userRole = null;
        
        if (userId) {
          const membership = await CircleMember.findOne({
            where: {
              circle_id: circle.id,
              user_id: userId,
              status: 'approved'
            }
          });
          isMember = !!membership;
          userRole = membership?.role;
        }
        
        return {
          ...circle.toJSON(),
          is_member: isMember,
          user_role: userRole
        };
      })
    );

    const currentPage = parseInt(page, 10);
    const pageSize = parseInt(limit, 10);
    const totalPages = Math.ceil(count / pageSize);

    res.json({
      items: circlesWithMemberInfo,
      total: count,
      page: currentPage,
      limit: pageSize,
      totalPages,
      pagination: {
        page: currentPage,
        limit: pageSize,
        total: count,
        totalPages
      }
    });
  } catch (error) {
    console.error('获取圈子列表失败:', error);
    res.status(500).json({ error: '获取圈子列表失败' });
  }
};

/**
 * 获取圈子详情
 */
exports.getCircleById = async (req, res) => {
  try {
    const { circleId } = req.params;
    const userId = req.user?.id;

    const circle = await Circle.findByPk(circleId, {
      include: [
        {
          model: CircleCategory,
          as: 'category',
          attributes: ['id', 'name']
        },
        {
          model: User,
          as: 'creator',
          attributes: ['id', 'username'],
          include: [
            {
              model: require('../models').UserProfile,
              as: 'profile',
              attributes: ['nickname', 'avatar']
            }
          ]
        }
      ]
    });

    if (!circle) {
      return res.status(404).json({ error: '圈子不存在' });
    }

    // 检查用户是否是成员
    let isMember = false;
    let userRole = null;
    if (userId) {
      const membership = await CircleMember.findOne({
        where: {
          circle_id: circleId,
          user_id: userId,
          status: 'approved'
        }
      });
      isMember = !!membership;
      userRole = membership?.role;
    }

    // 如果是私密圈子且用户不是成员，返回有限信息
    if (circle.is_private && !isMember && userId !== circle.creator_id) {
      return res.json({
        ...circle.toJSON(),
        is_member: isMember,
        user_role: userRole,
        posts: [],
        memberCount: 0
      });
    }

    // 获取实际成员数量（确保数据准确）
    const actualMemberCount = await CircleMember.count({
      where: {
        circle_id: circleId,
        status: 'approved'
      }
    });

    // 如果缓存数量不准确，更新它
    if (circle.member_count !== actualMemberCount) {
      await circle.update({ member_count: actualMemberCount });
    }

    res.json({
      ...circle.toJSON(),
      is_member: isMember,
      user_role: userRole,
      member_count: actualMemberCount,
      post_count: circle.post_count || 0,
      created_at: circle.created_at || circle.createdAt
    });
  } catch (error) {
    console.error('获取圈子详情失败:', error);
    res.status(500).json({ error: '获取圈子详情失败' });
  }
};

/**
 * 更新圈子信息
 */
exports.updateCircle = async (req, res) => {
  try {
    const { circleId } = req.params;
    const { name, description, category_id, is_private, is_public, need_approval, rules, cover_image, cover_image_url } = req.body;
    const userId = req.user.id;

    const circle = await Circle.findByPk(circleId);
    if (!circle) {
      return res.status(404).json({ error: '圈子不存在' });
    }

    // 检查权限
    if (circle.creator_id !== userId && req.user.role !== 'admin') {
      return res.status(403).json({ error: '无权限修改此圈子' });
    }

    const parsedCategoryId = category_id ? Number(category_id) : null;
    const rawIsPrivate = is_private !== undefined ? (typeof is_private === 'string' ? is_private === 'true' : !!is_private) : undefined;
    const rawIsPublic = is_public !== undefined ? (typeof is_public === 'string' ? is_public === 'true' : !!is_public) : undefined;
    const rawNeedApproval = need_approval !== undefined ? (typeof need_approval === 'string' ? need_approval === 'true' : !!need_approval) : undefined;

    const isPrivateValue = rawIsPrivate !== undefined
      ? rawIsPrivate
      : (rawIsPublic !== undefined ? !rawIsPublic : circle.is_private);
    const isPublicValue = rawIsPublic !== undefined ? rawIsPublic : !isPrivateValue;
    const needApprovalValue = rawNeedApproval !== undefined ? rawNeedApproval : (rawIsPrivate !== undefined ? rawIsPrivate : circle.need_approval);
    const nextName = typeof name === 'string' ? name.trim() : circle.name;
    const nextDescription = typeof description === 'string' ? description.trim() : circle.description;
    const nextRules = typeof rules === 'string' ? rules.trim() : circle.rules;

    if (!nextName) {
      return res.status(400).json({ error: '圈子名称不能为空' });
    }

    await assertMiniProgramTextSecurityForTexts({
      user: req.user,
      scene: 3,
      texts: [nextName, nextDescription, nextRules],
      requestHeaders: req.headers
    });

    const updateData = {
      name: nextName,
      description: nextDescription,
      is_public: isPublicValue,
      need_approval: needApprovalValue,
      rules: nextRules
    };

    // 更新分类
    if (parsedCategoryId && parsedCategoryId !== circle.category_id) {
      updateData.category_id = parsedCategoryId;
      
      // 减少原分类计数
      if (circle.category_id) {
        await CircleCategory.decrement('circle_count', {
          where: { id: circle.category_id }
        });
      }
      
      // 增加新分类计数
      await CircleCategory.increment('circle_count', {
        where: { id: parsedCategoryId }
      });
    }

    // 更新封面图片
    const coverImageUrl = cover_image || cover_image_url;
    if (coverImageUrl) {
      updateData.cover_image = coverImageUrl;
    }

    await circle.update(updateData);

    const updatedCircle = await Circle.findByPk(circleId, {
      include: [
        {
          model: CircleCategory,
          as: 'category',
          attributes: ['id', 'name']
        },
        {
          model: User,
          as: 'creator',
          attributes: ['id', 'username'],
          include: [
            {
              model: require('../models').UserProfile,
              as: 'profile',
              attributes: ['nickname', 'avatar']
            }
          ]
        }
      ]
    });

    res.json({
      message: '圈子更新成功',
      circle: updatedCircle
    });
  } catch (error) {
    console.error('更新圈子失败:', error);
    if (error instanceof WechatContentSecurityError) {
      return res.status(error.statusCode).json({ error: error.message, code: error.code });
    }
    res.status(500).json({ error: '更新圈子失败' });
  }
};

/**
 * 删除圈子
 */
exports.deleteCircle = async (req, res) => {
  try {
    const { circleId } = req.params;
    const userId = req.user.id;

    const circle = await Circle.findByPk(circleId);
    if (!circle) {
      return res.status(404).json({ error: '圈子不存在' });
    }

    // 检查权限
    if (circle.creator_id !== userId && req.user.role !== 'admin') {
      return res.status(403).json({ error: '无权限删除此圈子' });
    }

    // 更新分类统计
    if (circle.category_id) {
      await CircleCategory.decrement('circle_count', {
        where: { id: circle.category_id }
      });
    }

    await circle.update({ status: 'deleted' });

    res.json({ message: '圈子删除成功' });
  } catch (error) {
    console.error('删除圈子失败:', error);
    res.status(500).json({ error: '删除圈子失败' });
  }
};

/**
 * 加入圈子
 */
exports.joinCircle = async (req, res) => {
  try {
    const { circleId } = req.params;
    const userId = req.user.id;

    const circle = await Circle.findByPk(circleId);
    if (!circle) {
      return res.status(404).json({ error: '圈子不存在' });
    }

    // 检查是否已经是成员
    const existingMembership = await CircleMember.findOne({
      where: {
        circle_id: circleId,
        user_id: userId
      }
    });

    const requiresApproval = circle.need_approval === true;

    let membership;

    if (existingMembership) {
      if (existingMembership.status === 'approved') {
        return res.status(400).json({ error: '您已经是该圈子的成员' });
      }
      if (existingMembership.status === 'pending') {
        return res.status(400).json({ error: '您已经提交了加入申请，请等待审核' });
      }

      const nextStatus = requiresApproval ? 'pending' : 'approved';
      const prevStatus = existingMembership.status;

      await existingMembership.update({
        status: nextStatus,
        role: 'member'
      });

      if (!requiresApproval && prevStatus !== 'approved') {
        await circle.increment('member_count');
      }

      membership = existingMembership;
    } else {
      membership = await CircleMember.create({
        circle_id: circleId,
        user_id: userId,
        role: 'member',
        status: requiresApproval ? 'pending' : 'approved'
      });

      if (!requiresApproval) {
        await circle.increment('member_count');
      }
    }
    
    res.json({
      success: true,
      message: requiresApproval ? '申请已提交，等待审核' : '加入成功',
      data: membership
    });
  } catch (error) {
    console.error('加入圈子失败:', error);
    res.status(500).json({ error: '加入圈子失败' });
  }
};

/**
 * 退出圈子
 */
exports.leaveCircle = async (req, res) => {
    const transaction = await sequelize.transaction();
  
  try {
    const { circleId } = req.params;
    const userId = req.user.id;
    
        const membership = await CircleMember.findOne({
      where: {
        circle_id: circleId,
        user_id: userId,
        status: 'approved'
      },
      transaction
    });
    
    if (!membership) {
            await transaction.rollback();
      return res.status(400).json({ error: '您不是该圈子的成员' });
    }

    // 创建者不能退出圈子，只能删除或转让
    if (membership.role === 'creator') {
            await transaction.rollback();
      return res.status(400).json({ error: '圈子创建者不能退出圈子，请先转让圈子所有权' });
    }

        await membership.update({ status: 'left' }, { transaction });
    
    // 更新圈子成员计数
        const circle = await Circle.findByPk(circleId, { transaction });
        if (circle) {
      const newCount = Math.max(0, (circle.member_count || 0) - 1);
            await circle.update({ member_count: newCount }, { transaction });
          }

        await transaction.commit();
        res.json({ message: '退出圈子成功' });
  } catch (error) {
    await transaction.rollback();
        res.status(500).json({ error: '退出圈子失败' });
  }
};

/**
 * 获取圈子成员列表
 */
exports.getCircleMembers = async (req, res) => {
  try {
    console.log('=== getCircleMembers 开始 ===')
    const { circleId } = req.params;
    const { page = 1, limit = 20, role } = req.query;
    const userId = req.user?.id;

    console.log('请求参数:', { circleId, page, limit, role, userId })

    // 获取圈子信息
    const circle = await Circle.findByPk(circleId);
    if (!circle) {
      console.log('圈子不存在:', circleId)
      return res.status(404).json({ error: '圈子不存在' });
    }

    console.log('圈子信息:', {
      id: circle.id,
      name: circle.name,
      is_private: circle.is_private,
      creator_id: circle.creator_id
    })

    // 检查权限：私密圈子需要成员身份，公开圈子允许任何人查看
    if (circle.is_private) {
      console.log('私密圈子，检查成员权限...')
      const isMember = await CircleMember.findOne({
        where: {
          circle_id: circleId,
          user_id: userId,
          status: 'approved'
        }
      });

      if (!isMember && circle.creator_id !== userId) {
        console.log('无权限查看成员列表')
        return res.status(403).json({ error: '无权限查看此圈子的成员列表' });
      }
      console.log('权限检查通过')
    }

    const offset = (page - 1) * limit;
    const whereClause = {
      circle_id: circleId,
      status: 'approved'
    };

    if (role && role !== 'undefined') {
      whereClause.role = role;
    }

    console.log('查询条件:', whereClause)
    console.log('分页信息:', { offset, limit: parseInt(limit) })

    // 先查询所有状态的成员用于调试
    const allMembers = await CircleMember.findAll({
      where: { circle_id: circleId },
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'username'],
          include: [
            {
              model: require('../models').UserProfile,
              as: 'profile',
              attributes: ['nickname', 'avatar', 'bio']
            }
          ]
        }
      ]
    })

    console.log('所有状态的成员:', allMembers.map(m => ({
      id: m.id,
      user_id: m.user_id,
      role: m.role,
      status: m.status,
      user: m.user ? {
        id: m.user.id,
        username: m.user.username,
        profile: m.user.profile
      } : null
    })))

    const { count, rows: members } = await CircleMember.findAndCountAll({
      where: whereClause,
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'username'],
          include: [
            {
              model: require('../models').UserProfile,
              as: 'profile',
              attributes: ['nickname', 'avatar', 'bio']
            }
          ]
        }
      ],
      order: [['created_at', 'ASC']],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    console.log('查询结果:', {
      count,
      members: members.map(m => ({
        id: m.id,
        user_id: m.user_id,
        role: m.role,
        user: m.user ? {
          id: m.user.id,
          username: m.user.username,
          profile: m.user.profile
        } : null
      }))
    })

    res.json({
      members,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: count,
        totalPages: Math.ceil(count / limit)
      }
    });
  } catch (error) {
    console.error('获取圈子成员失败:', error);
    res.status(500).json({ error: '获取圈子成员失败' });
  }
};

/**
 * 获取用户的圈子列表
 */
exports.getUserCircles = async (req, res) => {
  try {
    const userId = req.user.id;
    const { status = 'approved' } = req.query;

    const memberships = await CircleMember.findAll({
      where: {
        user_id: userId,
        status
      },
      include: [
        {
          model: Circle,
          as: 'circle',
          where: { status: 'active' },
          include: [
            {
              model: CircleCategory,
              as: 'category',
              attributes: ['id', 'name']
            }
          ]
        }
      ],
      order: [['created_at', 'DESC']]
    });

    const circles = memberships.map(membership => ({
      ...membership.circle.toJSON(),
      role: membership.role,
      joinedAt: membership.created_at
    }));

    res.json({ circles });
  } catch (error) {
    console.error('获取用户圈子失败:', error);
    res.status(500).json({ error: '获取用户圈子失败' });
  }
};

/**
 * 获取圈子帖子列表
 */
exports.getCirclePosts = async (req, res) => {
  try {
    const { circleId } = req.params;
    const userId = req.user?.id;
    const {
      page = 1,
      limit = 10,
      sortBy = 'created_at',
      sortOrder = 'DESC'
    } = req.query;

    // 获取圈子信息
    const circle = await Circle.findByPk(circleId);
    if (!circle) {
      return res.status(404).json({ error: '圈子不存在' });
    }

    // 检查权限：私密圈子需要成员身份
    if (circle.is_private) {
      const isMember = await CircleMember.findOne({
        where: {
          circle_id: circleId,
          user_id: userId,
          status: 'approved'
        }
      });
      
      if (!isMember && circle.creator_id !== userId) {
        return res.status(403).json({ error: '无权限查看此圈子的帖子' });
      }
    }

    const offset = (page - 1) * limit;

    const { count, rows: posts } = await Post.findAndCountAll({
      where: {
        circle_id: circleId,
        status: 'published'
      },
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'username'],
          include: [
            {
              model: require('../models').UserProfile,
              as: 'profile',
              attributes: ['nickname', 'avatar']
            }
          ]
        }
      ],
      order: [[sortBy, sortOrder]],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    res.json({
      posts,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: count,
        totalPages: Math.ceil(count / limit)
      }
    });
  } catch (error) {
    console.error('获取圈子帖子失败:', error);
    res.status(500).json({ error: '获取圈子帖子失败' });
  }
};

/**
 * 处理加入申请
 */
exports.handleJoinRequest = async (req, res) => {
  try {
    const { circleId, memberId } = req.params;
    const { action } = req.body; // 'approve' 或 'reject'

    const membership = await CircleMember.findOne({
      where: {
        circle_id: circleId,
        user_id: memberId,
        status: 'pending'
      }
    });

    if (!membership) {
      return res.status(404).json({ error: '未找到该申请' });
    }

    if (action === 'approve') {
    await membership.update({ status: 'approved' });
      
      // 更新圈子成员计数
      const circle = await Circle.findByPk(circleId);
      if (circle) {
        await circle.increment('member_count');
      }
      
      res.json({ message: '已通过申请' });
    } else if (action === 'reject') {
      await membership.update({ status: 'rejected' });
      res.json({ message: '已拒绝申请' });
    } else {
      res.status(400).json({ error: '无效的操作' });
    }
  } catch (error) {
    console.error('处理加入申请失败:', error);
    res.status(500).json({ error: '处理加入申请失败' });
  }
};

/**
 * 移除成员
 */
exports.removeMember = async (req, res) => {
  try {
    const { circleId, memberId } = req.params;

    const membership = await CircleMember.findOne({
      where: {
        circle_id: circleId,
        user_id: memberId,
        status: 'approved'
      }
    });

    if (!membership) {
      return res.status(404).json({ error: '未找到该成员' });
    }

    // 不能移除创建者
    if (membership.role === 'creator') {
      return res.status(400).json({ error: '不能移除圈子创建者' });
    }

    await membership.update({ status: 'removed' });

    const circle = await Circle.findByPk(circleId);
    if (circle) {
      const newCount = Math.max(0, (circle.member_count || 0) - 1);
      await circle.update({ member_count: newCount });
    }

    res.json({ message: '成员已移除' });
  } catch (error) {
    console.error('移除成员失败:', error);
    res.status(500).json({ error: '移除成员失败' });
  }
};

/**
 * 获取待处理的加入申请
 */
exports.getPendingRequests = async (req, res) => {
  try {
    const { circleId } = req.params;

    const requests = await CircleMember.findAll({
      where: {
        circle_id: circleId,
        status: 'pending'
      },
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'username'],
          include: [
            {
              model: require('../models').UserProfile,
              as: 'profile',
              attributes: ['nickname', 'avatar', 'bio']
            }
          ]
        }
      ],
      order: [['created_at', 'ASC']]
    });
    
    res.json({ requests });
  } catch (error) {
    console.error('获取待处理申请失败:', error);
    res.status(500).json({ error: '获取待处理申请失败' });
  }
};

exports.transferCircle = async (req, res) => {
  const transaction = await sequelize.transaction();
  try {
    const { circleId } = req.params;
    const { target_member_id } = req.body;

    const targetUserId = Number(target_member_id);
    if (!target_member_id || Number.isNaN(targetUserId)) {
      await transaction.rollback();
      return res.status(400).json({ error: '请选择有效的成员' });
    }

    const circle = await Circle.findByPk(circleId, { transaction });
    if (!circle) {
      await transaction.rollback();
      return res.status(404).json({ error: '圈子不存在' });
    }

    if (circle.creator_id === targetUserId) {
      await transaction.rollback();
      return res.status(400).json({ error: '该成员已经是圈子创建者' });
    }

    const targetMembership = await CircleMember.findOne({
      where: {
        circle_id: circleId,
        user_id: targetUserId,
        status: 'approved'
      },
      transaction
    });

    if (!targetMembership) {
      await transaction.rollback();
      return res.status(404).json({ error: '目标成员不存在或尚未加入圈子' });
    }

    await CircleMember.update(
      { role: 'admin' },
      {
        where: {
          circle_id: circleId,
          user_id: circle.creator_id,
          status: 'approved'
        },
        transaction
      }
    );

    await targetMembership.update({ role: 'creator' }, { transaction });

    await circle.update({ creator_id: targetUserId }, { transaction });

    await transaction.commit();

    res.json({ message: '圈子已成功转让' });
  } catch (error) {
    await transaction.rollback();
    console.error('转让圈子失败:', error);
    res.status(500).json({ error: '转让圈子失败' });
  }
};
