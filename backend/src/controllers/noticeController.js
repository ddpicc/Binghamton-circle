const { Notice, User, UserProfile, Like } = require('../models');
const { Op } = require('sequelize');
const {
  assertMiniProgramTextSecurityForTexts,
  WechatContentSecurityError
} = require('../services/wechatContentSecurityService');

/**
 * 获取通知列表
 */
exports.getNotices = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      category,
      priority,
      search,
      sortBy = 'created_at',
      sortOrder = 'DESC'
    } = req.query;

    const offset = (page - 1) * limit;
    const whereClause = { is_published: true };
    
    // 分类筛选
    if (category) {
      whereClause.category = category;
    }
    
    // 优先级筛选
    if (priority) {
      whereClause.priority = priority;
    }
    
    // 搜索功能
    if (search) {
      whereClause[Op.or] = [
        { title: { [Op.like]: `%${search}%` } },
        { content: { [Op.like]: `%${search}%` } }
      ];
    }

    // 检查过期时间
    whereClause[Op.or] = [
      { expire_time: { [Op.gt]: new Date() } },
      { expire_time: null }
    ];

    const { count, rows: notices } = await Notice.findAndCountAll({
      where: whereClause,
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'username'],
          include: [
            {
              model: UserProfile,
              as: 'profile',
              attributes: ['nickname', 'avatar']
            }
          ]
        }
      ],
      order: [
        ['is_pinned', 'DESC'],
        [sortBy, sortOrder]
      ],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    res.json({
      notices: notices.map(notice => ({
        ...notice.toJSON(),
        author: {
          id: notice.user.id,
          username: notice.user.username,
          nickname: notice.user.profile?.nickname || notice.user.username,
          avatar: notice.user.profile?.avatar
        }
      })),
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: count,
        totalPages: Math.ceil(count / limit)
      }
    });
  } catch (error) {
    console.error('获取通知列表失败:', error);
    res.status(500).json({ error: '获取通知列表失败' });
  }
};

/**
 * 获取通知详情
 */
exports.getNoticeById = async (req, res) => {
  try {
    const { id } = req.params;

    const notice = await Notice.findByPk(id, {
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'username'],
          include: [
            {
              model: UserProfile,
              as: 'profile',
              attributes: ['nickname', 'avatar', 'bio']
            }
          ]
        }
      ]
    });

    if (!notice) {
      return res.status(404).json({ error: '通知不存在' });
    }

    // 增加浏览数
    await notice.increment('view_count');

    res.json({
      ...notice.toJSON(),
      author: {
        id: notice.user.id,
        username: notice.user.username,
        nickname: notice.user.profile?.nickname || notice.user.username,
        avatar: notice.user.profile?.avatar,
        bio: notice.user.profile?.bio
      }
    });
  } catch (error) {
    console.error('获取通知详情失败:', error);
    res.status(500).json({ error: '获取通知详情失败' });
  }
};

/**
 * 创建通知（管理员功能）
 */
exports.createNotice = async (req, res) => {
  try {
    const { 
      title, 
      content, 
      category, 
      priority = 'medium',
      is_pinned = false,
      publish_time,
      expire_time,
      target_audience,
      attachments
    } = req.body;
    const userId = req.user.id;

    // 检查管理员权限
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: '无权限发布通知' });
    }

    if (!title || !content) {
      return res.status(400).json({ error: '标题和内容不能为空' });
    }

    const trimmedTitle = title.trim();
    const trimmedContent = content.trim();

    await assertMiniProgramTextSecurityForTexts({
      user: req.user,
      scene: 3,
      texts: [trimmedTitle, trimmedContent],
      requestHeaders: req.headers
    });

    const notice = await Notice.create({
      user_id: userId,
      title: trimmedTitle,
      content: trimmedContent,
      category,
      priority,
      is_pinned,
      publish_time: publish_time || new Date(),
      expire_time,
      target_audience: target_audience || [],
      attachments: attachments || []
    });

    const createdNotice = await Notice.findByPk(notice.id, {
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'username'],
          include: [
            {
              model: UserProfile,
              as: 'profile',
              attributes: ['nickname', 'avatar']
            }
          ]
        }
      ]
    });

    res.status(201).json({
      message: '通知创建成功',
      notice: {
        ...createdNotice.toJSON(),
        author: {
          id: createdNotice.user.id,
          username: createdNotice.user.username,
          nickname: createdNotice.user.profile?.nickname || createdNotice.user.username,
          avatar: createdNotice.user.profile?.avatar
        }
      }
    });
  } catch (error) {
    console.error('创建通知失败:', error);
    if (error instanceof WechatContentSecurityError) {
      return res.status(error.statusCode).json({ error: error.message, code: error.code });
    }
    res.status(500).json({ error: '创建通知失败' });
  }
};

/**
 * 更新通知（管理员功能）
 */
exports.updateNotice = async (req, res) => {
  try {
    const { id } = req.params;
    const { 
      title, 
      content, 
      category, 
      priority,
      is_pinned,
      publish_time,
      expire_time,
      target_audience,
      attachments,
      status
    } = req.body;
    const userId = req.user.id;

    const notice = await Notice.findByPk(id);
    if (!notice) {
      return res.status(404).json({ error: '通知不存在' });
    }

    // 检查权限
    if (notice.user_id !== userId && req.user.role !== 'admin') {
      return res.status(403).json({ error: '无权限修改此通知' });
    }

    const nextTitle = typeof title === 'string' ? title.trim() : notice.title;
    const nextContent = typeof content === 'string' ? content.trim() : notice.content;

    if (!nextTitle || !nextContent) {
      return res.status(400).json({ error: '标题和内容不能为空' });
    }

    await assertMiniProgramTextSecurityForTexts({
      user: req.user,
      scene: 3,
      texts: [nextTitle, nextContent],
      requestHeaders: req.headers
    });

    await notice.update({
      title: nextTitle,
      content: nextContent,
      category: category || notice.category,
      priority: priority || notice.priority,
      is_pinned: is_pinned !== undefined ? is_pinned : notice.is_pinned,
      publish_time: publish_time || notice.publish_time,
      expire_time: expire_time || notice.expire_time,
      target_audience: target_audience || notice.target_audience,
      attachments: attachments || notice.attachments,
      status: status || notice.status
    });

    const updatedNotice = await Notice.findByPk(id, {
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'username'],
          include: [
            {
              model: UserProfile,
              as: 'profile',
              attributes: ['nickname', 'avatar']
            }
          ]
        }
      ]
    });

    res.json({
      message: '通知更新成功',
      notice: {
        ...updatedNotice.toJSON(),
        author: {
          id: updatedNotice.user.id,
          username: updatedNotice.user.username,
          nickname: updatedNotice.user.profile?.nickname || updatedNotice.user.username,
          avatar: updatedNotice.user.profile?.avatar
        }
      }
    });
  } catch (error) {
    console.error('更新通知失败:', error);
    if (error instanceof WechatContentSecurityError) {
      return res.status(error.statusCode).json({ error: error.message, code: error.code });
    }
    res.status(500).json({ error: '更新通知失败' });
  }
};

/**
 * 删除通知（管理员功能）
 */
exports.deleteNotice = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const notice = await Notice.findByPk(id);
    if (!notice) {
      return res.status(404).json({ error: '通知不存在' });
    }

    // 检查权限
    if (notice.user_id !== userId && req.user.role !== 'admin') {
      return res.status(403).json({ error: '无权限删除此通知' });
    }

    await notice.update({ status: 'archived' });

    res.json({ message: '通知删除成功' });
  } catch (error) {
    console.error('删除通知失败:', error);
    res.status(500).json({ error: '删除通知失败' });
  }
};

/**
 * 点赞/取消点赞通知
 */
exports.toggleLike = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const notice = await Notice.findByPk(id);
    if (!notice) {
      return res.status(404).json({ error: '通知不存在' });
    }

    // 检查是否已点赞
    const existingLike = await Like.findOne({
      where: {
        user_id: userId,
        target_id: id,
        target_type: 'notice'
      }
    });

    if (existingLike) {
      // 取消点赞
      await existingLike.destroy();
      await notice.decrement('like_count');
      res.json({ message: '取消点赞成功', liked: false });
    } else {
      // 点赞
      await Like.create({
        user_id: userId,
        target_id: id,
        target_type: 'notice'
      });
      await notice.increment('like_count');
      res.json({ message: '点赞成功', liked: true });
    }
  } catch (error) {
    console.error('点赞操作失败:', error);
    res.status(500).json({ error: '点赞操作失败' });
  }
};

/**
 * 获取通知分类列表
 */
exports.getCategories = async (req, res) => {
  try {
    const categories = await Notice.findAll({
      attributes: ['category'],
      where: {
        category: {
          [Op.ne]: null
        },
        is_published: true
      },
      group: ['category'],
      order: [['category', 'ASC']]
    });

    res.json({
      categories: categories.map(item => item.category)
    });
  } catch (error) {
    console.error('获取通知分类失败:', error);
    res.status(500).json({ error: '获取通知分类失败' });
  }
};

/**
 * 获取置顶通知
 */
exports.getPinnedNotices = async (req, res) => {
  try {
    const notices = await Notice.findAll({
      where: {
        is_pinned: true,
        is_published: true,
        [Op.or]: [
          { expire_time: { [Op.gt]: new Date() } },
          { expire_time: null }
        ]
      },
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'username'],
          include: [
            {
              model: UserProfile,
              as: 'profile',
              attributes: ['nickname', 'avatar']
            }
          ]
        }
      ],
      order: [['created_at', 'DESC']],
      limit: 5
    });

    res.json({
      notices: notices.map(notice => ({
        ...notice.toJSON(),
        author: {
          id: notice.user.id,
          username: notice.user.username,
          nickname: notice.user.profile?.nickname || notice.user.username,
          avatar: notice.user.profile?.avatar
        }
      }))
    });
  } catch (error) {
    console.error('获取置顶通知失败:', error);
    res.status(500).json({ error: '获取置顶通知失败' });
  }
};
