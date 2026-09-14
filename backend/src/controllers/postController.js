const { Post, User, UserProfile, Like, Comment, CircleMember } = require('../models');
const { Op } = require('sequelize');
const {
  assertMiniProgramTextSecurityForTexts,
  WechatContentSecurityError
} = require('../services/wechatContentSecurityService');

/**
 * 获取帖子列表
 */
exports.getPosts = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      category,
      search,
      circle_id,
      sortBy = 'created_at',
      sortOrder = 'DESC'
    } = req.query;

    const offset = (page - 1) * limit;
    const whereClause = {};
    
    // 分类筛选
    if (category) {
      whereClause.category = category;
    }
    
    // 圈子筛选
    if (circle_id) {
      whereClause.circle_id = circle_id;
    }
    
    // 搜索功能
    if (search) {
      whereClause[Op.or] = [
        { title: { [Op.like]: `%${search}%` } },
        { content: { [Op.like]: `%${search}%` } }
      ];
    }

    const { count, rows: posts } = await Post.findAndCountAll({
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
        },
        {
          model: require('../models').Circle,
          as: 'circle',
          attributes: ['id', 'name']
        }
      ],
      order: [[sortBy, sortOrder]],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    res.json({
      posts: posts.map(post => ({
        ...post.toJSON(),
        author: post.is_anonymous ? null : {
          id: post.user.id,
          username: post.user.username,
          nickname: post.user.profile?.nickname || post.user.username,
          avatar: post.user.profile?.avatar
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
    console.error('获取帖子列表失败:', error);
    res.status(500).json({ error: '获取帖子列表失败' });
  }
};

/**
 * 获取帖子详情
 */
exports.getPostById = async (req, res) => {
  try {
    const { id } = req.params;

    const post = await Post.findByPk(id, {
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

    if (!post) {
      return res.status(404).json({ error: '帖子不存在' });
    }

    // 增加浏览数
    await post.increment('view_count');

    res.json({
      ...post.toJSON(),
      author: post.is_anonymous ? null : {
        id: post.user.id,
        username: post.user.username,
        nickname: post.user.profile?.nickname || post.user.username,
        avatar: post.user.profile?.avatar,
        bio: post.user.profile?.bio
      }
    });
  } catch (error) {
    console.error('获取帖子详情失败:', error);
    res.status(500).json({ error: '获取帖子详情失败' });
  }
};

/**
 * 创建帖子
 */
exports.createPost = async (req, res) => {
  try {
    const { title, content, is_anonymous = false, category, tags, images, circle_id } = req.body;
    const userId = req.user.id;

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

    // 如果指定了圈子，检查用户是否是圈子成员
    if (circle_id) {
      const membership = await CircleMember.findOne({
        where: {
          circle_id: circle_id,
          user_id: userId,
          status: 'approved'
        }
      });

      if (!membership) {
        return res.status(403).json({ error: '您不是该圈子的成员，无法发布帖子' });
      }
    }

    const post = await Post.create({
      user_id: userId,
      title: trimmedTitle,
      content: trimmedContent,
      is_anonymous,
      category,
      tags: tags || [],
      images: images || [],
      circle_id,
      status: 'published'
    });

    // 如果帖子属于圈子，更新圈子的帖子计数
    if (circle_id) {
      const { Circle } = require('../models');
      const circle = await Circle.findByPk(circle_id);
      if (circle) {
        await circle.increment('post_count', { by: 1 });
      }
    }

    const createdPost = await Post.findByPk(post.id, {
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
        },
        {
          model: require('../models').Circle,
          as: 'circle',
          attributes: ['id', 'name']
        }
      ]
    });

    res.status(201).json({
      message: '帖子创建成功',
      post: {
        ...createdPost.toJSON(),
        author: createdPost.is_anonymous ? null : {
          id: createdPost.user.id,
          username: createdPost.user.username,
          nickname: createdPost.user.profile?.nickname || createdPost.user.username,
          avatar: createdPost.user.profile?.avatar
        }
      }
    });
  } catch (error) {
    console.error('创建帖子失败:', error);
    if (error instanceof WechatContentSecurityError) {
      return res.status(error.statusCode).json({ error: error.message, code: error.code });
    }
    res.status(500).json({ error: '创建帖子失败' });
  }
};

/**
 * 更新帖子
 */
exports.updatePost = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, content, is_anonymous, category, tags, images } = req.body;
    const userId = req.user.id;

    const post = await Post.findByPk(id);
    if (!post) {
      return res.status(404).json({ error: '帖子不存在' });
    }

    // 检查权限
    if (post.user_id !== userId && req.user.role !== 'admin') {
      return res.status(403).json({ error: '无权限修改此帖子' });
    }

    const nextTitle = typeof title === 'string' ? title.trim() : post.title;
    const nextContent = typeof content === 'string' ? content.trim() : post.content;

    if (!nextTitle || !nextContent) {
      return res.status(400).json({ error: '标题和内容不能为空' });
    }

    await assertMiniProgramTextSecurityForTexts({
      user: req.user,
      scene: 3,
      texts: [nextTitle, nextContent],
      requestHeaders: req.headers
    });

    await post.update({
      title: nextTitle,
      content: nextContent,
      is_anonymous: is_anonymous !== undefined ? is_anonymous : post.is_anonymous,
      category: category || post.category,
      tags: tags || post.tags,
      images: images || post.images
    });

    const updatedPost = await Post.findByPk(id, {
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
      message: '帖子更新成功',
      post: {
        ...updatedPost.toJSON(),
        author: updatedPost.is_anonymous ? null : {
          id: updatedPost.user.id,
          username: updatedPost.user.username,
          nickname: updatedPost.user.profile?.nickname || updatedPost.user.username,
          avatar: updatedPost.user.profile?.avatar
        }
      }
    });
  } catch (error) {
    console.error('更新帖子失败:', error);
    if (error instanceof WechatContentSecurityError) {
      return res.status(error.statusCode).json({ error: error.message, code: error.code });
    }
    res.status(500).json({ error: '更新帖子失败' });
  }
};

/**
 * 删除帖子
 */
exports.deletePost = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const post = await Post.findByPk(id);
    if (!post) {
      return res.status(404).json({ error: '帖子不存在' });
    }

    if (post.user_id !== userId && req.user.role !== 'admin') {
      if (!post.circle_id) {
        return res.status(403).json({ error: '无权限删除此帖子' });
      }

      const membership = await CircleMember.findOne({
        where: {
          circle_id: post.circle_id,
          user_id: userId,
          status: 'approved'
        }
      });

      if (!membership || (membership.role !== 'creator' && membership.role !== 'admin')) {
        return res.status(403).json({ error: '无权限删除此帖子' });
      }
    }

    // 如果帖子属于圈子，更新圈子的帖子计数
    if (post.circle_id) {
      const { Circle } = require('../models');
      const circle = await Circle.findByPk(post.circle_id);
      if (circle && circle.post_count > 0) {
        await circle.decrement('post_count', { by: 1 });
      }
    }

    await post.update({ status: 'deleted' });

    res.json({ message: '帖子删除成功' });
  } catch (error) {
    console.error('删除帖子失败:', error);
    res.status(500).json({ error: '删除帖子失败' });
  }
};

/**
 * 点赞/取消点赞帖子
 */
exports.toggleLike = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const post = await Post.findByPk(id);
    if (!post) {
      return res.status(404).json({ error: '帖子不存在' });
    }

    // 检查是否已点赞
    const existingLike = await Like.findOne({
      where: {
        user_id: userId,
        target_id: id,
        target_type: 'post'
      }
    });

    if (existingLike) {
      // 取消点赞
      await existingLike.destroy();
      await post.decrement('like_count');
      res.json({ message: '取消点赞成功', liked: false });
    } else {
      // 点赞
      await Like.create({
        user_id: userId,
        target_id: id,
        target_type: 'post'
      });
      await post.increment('like_count');
      res.json({ message: '点赞成功', liked: true });
    }
  } catch (error) {
    console.error('点赞操作失败:', error);
    res.status(500).json({ error: '点赞操作失败' });
  }
};

/**
 * 获取用户的帖子列表
 */
exports.getUserPosts = async (req, res) => {
  try {
    const { userId } = req.params;
    const { page = 1, limit = 10 } = req.query;

    const offset = (page - 1) * limit;

    const { count, rows: posts } = await Post.findAndCountAll({
      where: {
        user_id: userId,
        status: 'published'
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
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    res.json({
      posts: posts.map(post => ({
        ...post.toJSON(),
        author: post.is_anonymous ? null : {
          id: post.user.id,
          username: post.user.username,
          nickname: post.user.profile?.nickname || post.user.username,
          avatar: post.user.profile?.avatar
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
    console.error('获取用户帖子失败:', error);
    res.status(500).json({ error: '获取用户帖子失败' });
  }
};

/**
 * 获取用户已加入圈子的帖子列表
 */
exports.getUserCirclePosts = async (req, res) => {
  try {
    const userId = req.user.id;
    const { page = 1, limit = 20, circle_id, sortBy = 'created_at', sortOrder = 'DESC' } = req.query;

    console.log('=== getUserCirclePosts 开始 ===')
    console.log('用户ID:', userId)
    console.log('请求参数:', { page, limit, circle_id, sortBy, sortOrder })

    const offset = (page - 1) * limit;

    // 获取用户已加入的圈子列表
    const userCircleMemberships = await CircleMember.findAll({
      where: {
        user_id: userId,
        status: 'approved'
      },
      attributes: ['circle_id']
    });

    const circleIds = userCircleMemberships.map(membership => membership.circle_id);

    console.log('用户已加入的圈子ID:', circleIds)
    console.log('圈子数量:', circleIds.length)

    if (circleIds.length === 0) {
      console.log('用户没有加入任何圈子，返回空结果')
      return res.json({
        posts: [],
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: 0,
          totalPages: 0
        }
      });
    }

    // 构建查询条件
    const whereClause = {
      status: 'published'
    };

    // 如果指定了特定圈子，检查该圈子是否在用户已加入的圈子中
    if (circle_id) {
      const targetCircleId = parseInt(circle_id);
      if (circleIds.includes(targetCircleId)) {
        whereClause.circle_id = targetCircleId;
      } else {
        // 用户请求了未加入的圈子，返回空结果
        return res.json({
          posts: [],
          pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total: 0,
            totalPages: 0
          }
        });
      }
    } else {
      // 没有指定特定圈子，返回所有已加入圈子的帖子
      whereClause.circle_id = circleIds;
    }

    console.log('最终查询条件 whereClause:', whereClause)

    const { count, rows: posts } = await Post.findAndCountAll({
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
        },
        {
          model: require('../models').Circle,
          as: 'circle',
          attributes: ['id', 'name']
        }
      ],
      order: [[sortBy, sortOrder]],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    console.log('查询到的帖子数量:', count)
    console.log('返回的帖子数据:', posts.map(p => ({
      id: p.id,
      title: p.title,
      circle_id: p.circle_id,
      circle_name: p.circle?.name,
      images: p.images,
      images_type: typeof p.images,
      images_is_array: Array.isArray(p.images)
    })))

    res.json({
      posts: posts.map(post => ({
        ...post.toJSON(),
        author: post.is_anonymous ? null : {
          id: post.user.id,
          username: post.user.username,
          nickname: post.user.profile?.nickname || post.user.username,
          avatar: post.user.profile?.avatar
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
    console.error('获取用户圈子帖子失败:', error);
    res.status(500).json({ error: '获取用户圈子帖子失败' });
  }
};
