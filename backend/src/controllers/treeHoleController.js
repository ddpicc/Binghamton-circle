const { TreeHolePost, User, UserProfile, TreeHoleLike, TreeHoleComment } = require('../models');
const { Op } = require('sequelize');
const {
  assertMiniProgramTextSecurity,
  assertMiniProgramTextSecurityForTexts,
  WechatContentSecurityError
} = require('../services/wechatContentSecurityService');

/**
 * 获取树洞帖子列表
 */
exports.getTreeHolePosts = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      search,
      sortBy = 'created_at',
      sortOrder = 'DESC'
    } = req.query;

    const offset = (page - 1) * limit;
    const whereClause = { status: 'published' };
    
    // 搜索功能
    if (search) {
      whereClause[Op.or] = [
        { title: { [Op.like]: `%${search}%` } },
        { content: { [Op.like]: `%${search}%` } }
      ];
    }

    const { count, rows: posts } = await TreeHolePost.findAndCountAll({
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
      order: [[sortBy, sortOrder]],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    const currentUserId = req.user?.id || null;
    const likedPostIdSet = new Set();

    if (currentUserId && posts.length) {
      const likes = await TreeHoleLike.findAll({
        where: {
          user_id: currentUserId,
          target_type: 'post',
          target_id: posts.map((post) => post.id)
        },
        attributes: ['target_id']
      });
      likes.forEach((like) => likedPostIdSet.add(Number(like.target_id)));
    }

    res.json({
      posts: posts.map(post => ({
        ...post.toJSON(),
        author: {
          id: null,
          username: '匿名',
          nickname: '匿名',
          avatar: null
        },
        is_liked: likedPostIdSet.has(Number(post.id))
      })),
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: count,
        totalPages: Math.ceil(count / limit)
      }
    });
  } catch (error) {
    console.error('获取树洞帖子列表失败:', error);
    res.status(500).json({ error: '获取树洞帖子列表失败' });
  }
};

/**
 * 获取树洞帖子详情
 */
exports.getTreeHolePostById = async (req, res) => {
  try {
    const { id } = req.params;

    const post = await TreeHolePost.findByPk(id, {
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

    if (!post || post.status !== 'published') {
      return res.status(404).json({ error: '帖子不存在' });
    }

    // 增加浏览数
    await post.increment('view_count');

    let isLiked = false;
    if (req.user?.id) {
      const liked = await TreeHoleLike.findOne({
        where: {
          user_id: req.user.id,
          target_id: id,
          target_type: 'post'
        },
        attributes: ['id']
      });
      isLiked = Boolean(liked);
    }

    res.json({
      ...post.toJSON(),
      author: {
        id: null,
        username: '匿名',
        nickname: '匿名',
        avatar: null
      },
      is_liked: isLiked
    });
  } catch (error) {
    console.error('获取树洞帖子详情失败:', error);
    res.status(500).json({ error: '获取树洞帖子详情失败' });
  }
};

/**
 * 创建树洞帖子
 */
exports.createTreeHolePost = async (req, res) => {
  try {
    const { content, tags, images } = req.body;
    const userId = req.user.id;

    if (!content || !content.trim()) {
      return res.status(400).json({ error: '内容不能为空' });
    }

    const trimmedContent = content.trim();

    await assertMiniProgramTextSecurity({
      user: req.user,
      content: trimmedContent,
      scene: 4,
      requestHeaders: req.headers
    });

    const post = await TreeHolePost.create({
      user_id: userId,
      content: trimmedContent,
      tags: Array.isArray(tags) ? tags : [],
      images: Array.isArray(images) ? images : []
    });

    const createdPost = await TreeHolePost.findByPk(post.id, {
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
      message: '树洞帖子创建成功',
      post: {
        ...createdPost.toJSON(),
        author: {
          id: null,
          username: '匿名',
          nickname: '匿名',
          avatar: null
        }
      }
    });
  } catch (error) {
    console.error('创建树洞帖子失败:', error);
    if (error instanceof WechatContentSecurityError) {
      return res.status(error.statusCode).json({
        error: error.message,
        code: error.code
      });
    }
    res.status(500).json({ error: '创建树洞帖子失败' });
  }
};

/**
 * 更新树洞帖子
 */
exports.updateTreeHolePost = async (req, res) => {
  try {
    const { id } = req.params;
    const { content, tags, images } = req.body;
    const userId = req.user.id;

    const post = await TreeHolePost.findByPk(id);
    if (!post) {
      return res.status(404).json({ error: '帖子不存在' });
    }

    // 检查权限
    if (post.user_id !== userId && req.user.role !== 'admin') {
      return res.status(403).json({ error: '无权限修改此帖子' });
    }

    if (typeof content === 'string' && !content.trim()) {
      return res.status(400).json({ error: '内容不能为空' });
    }

    const trimmedContent = typeof content === 'string' ? content.trim() : post.content;

    await assertMiniProgramTextSecurityForTexts({
      user: req.user,
      scene: 4,
      texts: [trimmedContent],
      requestHeaders: req.headers
    });

    await post.update({
      content: trimmedContent,
      tags: Array.isArray(tags) ? tags : post.tags,
      images: Array.isArray(images) ? images : post.images
    });

    const updatedPost = await TreeHolePost.findByPk(id, {
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
      message: '树洞帖子更新成功',
      post: {
        ...updatedPost.toJSON(),
        author: {
          id: null,
          username: '匿名',
          nickname: '匿名',
          avatar: null
        }
      }
    });
  } catch (error) {
    console.error('更新树洞帖子失败:', error);
    if (error instanceof WechatContentSecurityError) {
      return res.status(error.statusCode).json({
        error: error.message,
        code: error.code
      });
    }
    res.status(500).json({ error: '更新树洞帖子失败' });
  }
};

/**
 * 删除树洞帖子
 */
exports.deleteTreeHolePost = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const post = await TreeHolePost.findByPk(id);
    if (!post) {
      return res.status(404).json({ error: '帖子不存在' });
    }

    // 检查权限
    if (post.user_id !== userId && req.user.role !== 'admin') {
      return res.status(403).json({ error: '无权限删除此帖子' });
    }

    await post.update({ status: 'deleted' });

    res.json({ message: '树洞帖子删除成功' });
  } catch (error) {
    console.error('删除树洞帖子失败:', error);
    res.status(500).json({ error: '删除树洞帖子失败' });
  }
};

/**
 * 点赞/取消点赞树洞帖子
 */
exports.toggleTreeHoleLike = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const post = await TreeHolePost.findByPk(id);
    if (!post) {
      return res.status(404).json({ error: '帖子不存在' });
    }

    // 检查是否已点赞
    const existingLike = await TreeHoleLike.findOne({
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
      res.json({
        message: '取消点赞成功',
        liked: false,
        like_count: Math.max(0, (post.like_count || 0) - 1)
      });
    } else {
      // 点赞
      await TreeHoleLike.create({
        user_id: userId,
        target_id: id,
        target_type: 'post'
      });
      await post.increment('like_count');
      res.json({
        message: '点赞成功',
        liked: true,
        like_count: (post.like_count || 0) + 1
      });
    }
  } catch (error) {
    console.error('点赞操作失败:', error);
    res.status(500).json({ error: '点赞操作失败' });
  }
};

/**
 * 获取树洞帖子评论
 */
exports.getTreeHoleComments = async (req, res) => {
  try {
    const { id } = req.params;
    const postId = id;
    const { page = 1, limit = 20 } = req.query;

    const offset = (page - 1) * limit;

    const { count, rows: comments } = await TreeHoleComment.findAndCountAll({
      where: {
        post_id: postId,
        status: 'published',
        parent_id: null // 只获取顶层评论
      },
      include: [
        {
          model: TreeHoleComment,
          as: 'replies',
          where: { status: 'published' },
          required: false,
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
        },
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
      comments: comments.map(comment => ({
        ...comment.toJSON(),
        author: {
          id: null,
          username: '匿名',
          nickname: '匿名',
          avatar: null
        },
        replies: comment.replies?.map(reply => ({
          ...reply.toJSON(),
          author: {
            id: null,
            username: '匿名',
            nickname: '匿名',
            avatar: null
          }
          })) || []
      })),
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: count,
        totalPages: Math.ceil(count / limit)
      }
    });
  } catch (error) {
    console.error('获取树洞评论失败:', error);
    res.status(500).json({ error: '获取树洞评论失败' });
  }
};

/**
 * 创建树洞评论
 */
exports.createTreeHoleComment = async (req, res) => {
  try {
    const { id } = req.params;
    const postId = id;
    const { content, parent_id } = req.body;
    const userId = req.user.id;
    const trimmedContent = (content || '').trim();

    if (!trimmedContent) {
      return res.status(400).json({ error: '评论内容不能为空' });
    }

    await assertMiniProgramTextSecurity({
      user: req.user,
      content: trimmedContent,
      scene: 2,
      requestHeaders: req.headers
    });

    const comment = await TreeHoleComment.create({
      post_id: postId,
      user_id: userId,
      content: trimmedContent,
      parent_id
    });

    // 增加帖子评论数
    await TreeHolePost.increment('comment_count', { where: { id: postId } });

    const createdComment = await TreeHoleComment.findByPk(comment.id, {
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
      message: '评论创建成功',
      comment: {
        ...createdComment.toJSON(),
        author: {
          id: null,
          username: '匿名',
          nickname: '匿名',
          avatar: null
        }
      }
    });
  } catch (error) {
    console.error('创建树洞评论失败:', error);
    if (error instanceof WechatContentSecurityError) {
      return res.status(error.statusCode).json({
        error: error.message,
        code: error.code
      });
    }
    res.status(500).json({ error: '创建树洞评论失败' });
  }
};
