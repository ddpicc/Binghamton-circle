const { Comment, Post, User, UserProfile, Like } = require('../models');
const { Op } = require('sequelize');
const {
  assertMiniProgramTextSecurityForTexts,
  WechatContentSecurityError
} = require('../services/wechatContentSecurityService');

/**
 * 获取帖子的评论列表
 */
exports.getComments = async (req, res) => {
  try {
    const { postId } = req.params;
    const { page = 1, limit = 20, parentId } = req.query;

    const offset = (page - 1) * limit;
    const whereClause = { post_id: postId };

    // 如果指定了parentId，获取该评论的回复
    if (parentId) {
      whereClause.parent_id = parentId;
    } else {
      // 否则获取顶级评论
      whereClause.parent_id = null;
    }

    const { count, rows: comments } = await Comment.findAndCountAll({
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
          model: Comment,
          as: 'replies',
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
          limit: 3 // 限制回复数量
        }
      ],
      order: [['created_at', 'ASC']],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    res.json({
      comments: comments.map(comment => ({
        ...comment.toJSON(),
        author: comment.is_anonymous ? null : {
          id: comment.user.id,
          username: comment.user.username,
          nickname: comment.user.profile?.nickname || comment.user.username,
          avatar: comment.user.profile?.avatar
        },
        replies: comment.replies?.map(reply => ({
          ...reply.toJSON(),
          author: reply.is_anonymous ? null : {
            id: reply.user.id,
            username: reply.user.username,
            nickname: reply.user.profile?.nickname || reply.user.username,
            avatar: reply.user.profile?.avatar
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
    console.error('获取评论列表失败:', error);
    res.status(500).json({ error: '获取评论列表失败' });
  }
};

/**
 * 创建评论
 */
exports.createComment = async (req, res) => {
  try {
    const { postId } = req.params;
    const { content, parentId, is_anonymous = false } = req.body;
    const userId = req.user.id;
    const trimmedContent = (content || '').trim();

    if (!trimmedContent) {
      return res.status(400).json({ error: '评论内容不能为空' });
    }

    // 检查帖子是否存在
    const post = await Post.findByPk(postId);
    if (!post) {
      return res.status(404).json({ error: '帖子不存在' });
    }

    // 如果是回复，检查父评论是否存在
    if (parentId) {
      const parentComment = await Comment.findByPk(parentId);
      if (!parentComment || parentComment.post_id !== parseInt(postId)) {
        return res.status(404).json({ error: '父评论不存在' });
      }
    }

    await assertMiniProgramTextSecurityForTexts({
      user: req.user,
      scene: 2,
      texts: [trimmedContent],
      requestHeaders: req.headers
    });

    const comment = await Comment.create({
      post_id: postId,
      user_id: userId,
      parent_id: parentId || null,
      content: trimmedContent,
      is_anonymous
    });

    // 更新帖子的评论数
    await post.increment('comment_count');

    const createdComment = await Comment.findByPk(comment.id, {
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
        author: createdComment.is_anonymous ? null : {
          id: createdComment.user.id,
          username: createdComment.user.username,
          nickname: createdComment.user.profile?.nickname || createdComment.user.username,
          avatar: createdComment.user.profile?.avatar
        }
      }
    });
  } catch (error) {
    console.error('创建评论失败:', error);
    if (error instanceof WechatContentSecurityError) {
      return res.status(error.statusCode).json({ error: error.message, code: error.code });
    }
    res.status(500).json({ error: '创建评论失败' });
  }
};

/**
 * 删除评论
 */
exports.deleteComment = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const comment = await Comment.findByPk(id);
    if (!comment) {
      return res.status(404).json({ error: '评论不存在' });
    }

    // 检查权限
    if (comment.user_id !== userId && req.user.role !== 'admin') {
      return res.status(403).json({ error: '无权限删除此评论' });
    }

    // 获取帖子ID，用于更新评论数
    const postId = comment.post_id;

    // 获取该评论下的所有回复数量
    const replyCount = await Comment.count({
      where: { parent_id: id }
    });

    // 删除评论及其回复
    await Comment.destroy({
      where: {
        [Op.or]: [
          { id },
          { parent_id: id }
        ]
      }
    });

    // 更新帖子的评论数
    const post = await Post.findByPk(postId);
    await post.decrement('comment_count', { by: 1 + replyCount });

    res.json({ message: '评论删除成功' });
  } catch (error) {
    console.error('删除评论失败:', error);
    res.status(500).json({ error: '删除评论失败' });
  }
};

/**
 * 点赞/取消点赞评论
 */
exports.toggleLike = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const comment = await Comment.findByPk(id);
    if (!comment) {
      return res.status(404).json({ error: '评论不存在' });
    }

    // 检查是否已点赞
    const existingLike = await Like.findOne({
      where: {
        user_id: userId,
        target_id: id,
        target_type: 'comment'
      }
    });

    if (existingLike) {
      // 取消点赞
      await existingLike.destroy();
      await comment.decrement('like_count');
      res.json({ message: '取消点赞成功', liked: false });
    } else {
      // 点赞
      await Like.create({
        user_id: userId,
        target_id: id,
        target_type: 'comment'
      });
      await comment.increment('like_count');
      res.json({ message: '点赞成功', liked: true });
    }
  } catch (error) {
    console.error('点赞操作失败:', error);
    res.status(500).json({ error: '点赞操作失败' });
  }
};

/**
 * 获取评论详情
 */
exports.getCommentById = async (req, res) => {
  try {
    const { id } = req.params;

    const comment = await Comment.findByPk(id, {
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
        },
        {
          model: Comment,
          as: 'parent',
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
        }
      ]
    });

    if (!comment) {
      return res.status(404).json({ error: '评论不存在' });
    }

    res.json({
      ...comment.toJSON(),
      author: comment.is_anonymous ? null : {
        id: comment.user.id,
        username: comment.user.username,
        nickname: comment.user.profile?.nickname || comment.user.username,
        avatar: comment.user.profile?.avatar,
        bio: comment.user.profile?.bio
      },
      parent: comment.parent ? {
        ...comment.parent.toJSON(),
        author: comment.parent.is_anonymous ? null : {
          id: comment.parent.user.id,
          username: comment.parent.user.username,
          nickname: comment.parent.user.profile?.nickname || comment.parent.user.username,
          avatar: comment.parent.user.profile?.avatar
        }
      } : null
    });
  } catch (error) {
    console.error('获取评论详情失败:', error);
    res.status(500).json({ error: '获取评论详情失败' });
  }
};
