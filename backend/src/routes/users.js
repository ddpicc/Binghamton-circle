const express = require('express');
const { Op } = require('sequelize');
const router = express.Router();

const {
  User,
  UserProfile,
  Post,
  Like,
  O2OItem,
  Notice,
  Activity,
  TreeHolePost,
  TreeHoleLike
} = require('../models');

const { authenticate, optionalAuth } = require('../middleware/auth');
const {
  assertMiniProgramTextSecurityForTexts,
  WechatContentSecurityError
} = require('../services/wechatContentSecurityService');

function normalizeGenderInput(value) {
  if (value === undefined) return undefined;
  if (value === null) return null;
  const normalized = String(value).trim().toLowerCase();
  if (!normalized) return null;
  if (normalized === 'male' || normalized === 'm' || normalized === '男') return 'male';
  if (normalized === 'female' || normalized === 'f' || normalized === '女') return 'female';
  if (normalized === 'other' || normalized === '保密' || normalized === '未知') return 'other';
  return null;
}

/**
 * 获取当前用户资料
 */
router.get('/profile', authenticate, async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id, {
      attributes: [
        'id',
        'username',
        'primary_email',
        'password',
        'role',
        'status',
        'email_verified',
        'last_login',
        'created_at'
      ],
      include: [
        {
          model: UserProfile,
          as: 'profile',
          attributes: [
            'nickname',
            'avatar',
            'bio',
            'phone',
            'gender',
            'school',
            'major',
            'grade',
            'preferences'
          ]
        }
      ]
    });

    if (!user) {
      return res.status(404).json({ error: '用户不存在' });
    }

    const payload = user.toJSON();
    delete payload.password;

    return res.json({
      user: {
        ...payload,
        has_password: Boolean(user.password)
      }
    });
  } catch (error) {
    console.error('获取用户资料失败:', error);
    return res.status(500).json({ error: '获取用户资料失败' });
  }
});

/**
 * 获取指定用户资料（公开信息）
 */
router.get('/:userId/profile', optionalAuth, async (req, res) => {
  try {
    const targetUserId = parseInt(req.params.userId, 10);

    if (!targetUserId || Number.isNaN(targetUserId)) {
      return res.status(400).json({ error: '无效的用户ID' });
    }

    const user = await User.findByPk(targetUserId, {
      attributes: ['id', 'username', 'created_at', 'role', 'status'],
      include: [
        {
          model: UserProfile,
          as: 'profile',
          attributes: ['nickname', 'avatar', 'bio', 'school', 'major', 'grade']
        }
      ]
    });

    if (!user || user.status !== 'active') {
      return res.status(404).json({ error: '用户不存在' });
    }

    return res.json({
      user: {
        id: user.id,
        username: user.username,
        nickname: user.profile?.nickname || user.username,
        avatar: user.profile?.avatar || null,
        bio: user.profile?.bio || '',
        school: user.profile?.school || '',
        major: user.profile?.major || '',
        grade: user.profile?.grade || '',
        joinedAt: user.created_at
      }
    });
  } catch (error) {
    console.error('获取用户资料失败:', error);
    return res.status(500).json({ error: '获取用户资料失败' });
  }
});

/**
 * 更新用户资料
 */
router.put('/profile', authenticate, async (req, res) => {
  try {
    const allowedProfileFields = [
      'nickname',
      'avatar',
      'bio',
      'phone',
      'gender',
      'school',
      'major',
      'grade'
    ];

    const profileUpdates = {};
    allowedProfileFields.forEach((field) => {
      if (Object.prototype.hasOwnProperty.call(req.body, field)) {
        profileUpdates[field] = req.body[field];
      }
    });

    if (Object.prototype.hasOwnProperty.call(profileUpdates, 'gender')) {
      profileUpdates.gender = normalizeGenderInput(profileUpdates.gender);
    }

    // 确保存在用户与资料
    let user = await User.findByPk(req.user.id);
    if (!user) {
      return res.status(404).json({ error: '用户不存在' });
    }

    let profile = await UserProfile.findOne({ where: { user_id: user.id } });
    if (!profile) {
      profile = await UserProfile.create({ user_id: user.id });
    }

    await assertMiniProgramTextSecurityForTexts({
      user: req.user,
      scene: 1,
      texts: [
        profileUpdates.nickname,
        profileUpdates.bio,
        profileUpdates.school,
        profileUpdates.major,
        profileUpdates.grade
      ],
      requestHeaders: req.headers
    });

    if (Object.keys(profileUpdates).length > 0) {
      await profile.update(profileUpdates);
    }

    // 更新后返回新的资料
    const refreshedUser = await User.findByPk(user.id, {
      attributes: [
        'id',
        'username',
        'primary_email',
        'role',
        'status',
        'email_verified',
        'last_login',
        'created_at'
      ],
      include: [
        {
          model: UserProfile,
          as: 'profile',
          attributes: [
            'nickname',
            'avatar',
            'bio',
            'phone',
            'gender',
            'school',
            'major',
            'grade',
            'preferences'
          ]
        }
      ]
    });

    return res.json({ user: refreshedUser });
  } catch (error) {
    console.error('更新用户资料失败:', error);
    if (error instanceof WechatContentSecurityError) {
      return res.status(error.statusCode).json({ error: error.message, code: error.code });
    }
    return res.status(500).json({ error: '更新用户资料失败' });
  }
});

/**
 * 获取我的帖子
 */
router.get('/me/posts', authenticate, async (req, res) => {
  try {
    const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
    const limit = Math.min(parseInt(req.query.limit, 10) || 10, 50);
    const [circlePosts, treeHolePosts, items, activities, notices] = await Promise.all([
      Post.findAll({
        where: { user_id: req.user.id, status: { [Op.ne]: 'deleted' } },
        order: [['created_at', 'DESC']]
      }),
      TreeHolePost.findAll({
        where: { user_id: req.user.id, status: { [Op.ne]: 'deleted' } },
        order: [['created_at', 'DESC']]
      }),
      O2OItem.findAll({
        where: { user_id: req.user.id, status: { [Op.ne]: 'deleted' } },
        order: [['created_at', 'DESC']]
      }),
      Activity.findAll({
        where: { user_id: req.user.id, status: { [Op.ne]: 'deleted' } },
        order: [['created_at', 'DESC']]
      }),
      Notice.findAll({
        where: { user_id: req.user.id, status: { [Op.ne]: 'archived' } },
        order: [['created_at', 'DESC']]
      })
    ]);

    const merged = [
      ...circlePosts.map((post) => ({
        id: `circle-post-${post.id}`,
        contentId: post.id,
        type: post.circle_id ? 'circle_post' : 'post',
        title: post.title,
        summary: post.content,
        created_at: post.created_at,
        status: post.status,
        route: post.circle_id
          ? `/pages/circles/detail/index?id=${post.circle_id}&postId=${post.id}`
          : `/pages/posts/detail/index?id=${post.id}`,
        stats: {
          like_count: post.like_count || 0,
          comment_count: post.comment_count || 0
        }
      })),
      ...treeHolePosts.map((post) => ({
        id: `treehole-${post.id}`,
        contentId: post.id,
        type: 'treehole',
        title: '匿名树洞',
        summary: post.content,
        created_at: post.created_at,
        status: post.status,
        route: `/pages/treehole/detail/index?id=${post.id}`,
        stats: {
          like_count: post.like_count || 0,
          comment_count: post.comment_count || 0
        }
      })),
      ...items.map((item) => ({
        id: `o2o-${item.id}`,
        contentId: item.id,
        type: 'o2o',
        title: item.title,
        summary: item.description || '',
        created_at: item.created_at,
        status: item.status,
        route: `/pages/o2o/detail/index?id=${item.id}`,
        price: item.price,
        stats: {
          like_count: item.like_count || 0
        }
      })),
      ...activities.map((activity) => ({
        id: `activity-${activity.id}`,
        contentId: activity.id,
        type: 'activity',
        title: activity.title,
        summary: activity.description || '',
        created_at: activity.created_at,
        status: activity.status,
        route: `/pages/activities/detail/index?id=${activity.id}`,
        stats: {
          participant_count: activity.participant_count || 0
        }
      })),
      ...notices.map((notice) => ({
        id: `notice-${notice.id}`,
        contentId: notice.id,
        type: 'notice',
        title: notice.title,
        summary: notice.content || '',
        created_at: notice.created_at,
        status: notice.status,
        route: `/pages/notices/detail/index?id=${notice.id}`,
        stats: {
          view_count: notice.view_count || 0
        }
      }))
    ].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

    const total = merged.length;
    const offset = (page - 1) * limit;
    const rows = merged.slice(offset, offset + limit);

    return res.json({
      items: rows,
      total,
      page,
      limit
    });
  } catch (error) {
    console.error('获取我的帖子失败:', error);
    return res.status(500).json({ error: '获取我的帖子失败' });
  }
});

/**
 * 获取我的收藏
 */
router.get('/me/favorites', authenticate, async (req, res) => {
  try {
    const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
    const limit = Math.min(parseInt(req.query.limit, 10) || 10, 50);
    const [likes, treeHoleLikes] = await Promise.all([
      Like.findAll({
        where: {
          user_id: req.user.id,
          target_type: {
            [Op.in]: ['post', 'o2o_item', 'notice']
          }
        },
        order: [['created_at', 'DESC']],
        include: [
          {
            model: Post,
            as: 'post',
            attributes: ['id', 'title', 'content', 'created_at', 'like_count', 'comment_count', 'category', 'circle_id', 'status'],
            required: false
          },
          {
            model: O2OItem,
            as: 'o2oItem',
            attributes: ['id', 'title', 'description', 'price', 'status', 'created_at', 'like_count'],
            required: false
          },
          {
            model: Notice,
            as: 'notice',
            attributes: ['id', 'title', 'content', 'category', 'created_at', 'status', 'view_count'],
            required: false
          }
        ]
      }),
      TreeHoleLike.findAll({
        where: {
          user_id: req.user.id,
          target_type: 'post'
        },
        order: [['created_at', 'DESC']]
      })
    ]);

    const treeHoleIds = treeHoleLikes.map((item) => item.target_id);
    const treeHolePosts = treeHoleIds.length
      ? await TreeHolePost.findAll({
          where: {
            id: treeHoleIds,
            status: 'published'
          }
        })
      : [];
    const treeHoleMap = new Map(treeHolePosts.map((item) => [Number(item.id), item]));

    const items = [
      ...likes.map((like) => {
        if (like.target_type === 'post' && like.post) {
          return {
            id: `favorite-post-${like.id}`,
            liked_at: like.created_at,
            type: like.post.circle_id ? 'circle_post' : 'post',
            title: like.post.title,
            summary: like.post.content || '',
            route: like.post.circle_id
              ? `/pages/circles/detail/index?id=${like.post.circle_id}&postId=${like.post.id}`
              : `/pages/posts/detail/index?id=${like.post.id}`,
            target: {
              id: like.post.id,
              type: like.post.circle_id ? 'circle_post' : 'post'
            }
          };
        }

        if (like.target_type === 'o2o_item' && like.o2oItem) {
          return {
            id: `favorite-o2o-${like.id}`,
            liked_at: like.created_at,
            type: 'o2o',
            title: like.o2oItem.title,
            summary: like.o2oItem.description || '',
            route: `/pages/o2o/detail/index?id=${like.o2oItem.id}`,
            target: {
              id: like.o2oItem.id,
              type: 'o2o'
            }
          };
        }

        if (like.target_type === 'notice' && like.notice) {
          return {
            id: `favorite-notice-${like.id}`,
            liked_at: like.created_at,
            type: 'notice',
            title: like.notice.title,
            summary: like.notice.content || '',
            route: `/pages/notices/detail/index?id=${like.notice.id}`,
            target: {
              id: like.notice.id,
              type: 'notice'
            }
          };
        }

        return null;
      }).filter(Boolean),
      ...treeHoleLikes.map((like) => {
        const post = treeHoleMap.get(Number(like.target_id));
        if (!post) return null;
        return {
          id: `favorite-treehole-${like.id}`,
          liked_at: like.created_at,
          type: 'treehole',
          title: '匿名树洞',
          summary: post.content || '',
          route: `/pages/treehole/detail/index?id=${post.id}`,
          target: {
            id: post.id,
            type: 'treehole'
          }
        };
      }).filter(Boolean)
    ].sort((a, b) => new Date(b.liked_at).getTime() - new Date(a.liked_at).getTime());

    const total = items.length;
    const offset = (page - 1) * limit;
    const pagedItems = items.slice(offset, offset + limit);

    return res.json({
      items: pagedItems,
      total,
      page,
      limit
    });
  } catch (error) {
    console.error('获取收藏列表失败:', error);
    return res.status(500).json({ error: '获取收藏列表失败' });
  }
});

/**
 * 更新用户偏好设置
 */
router.put('/me/preferences', authenticate, async (req, res) => {
  try {
    if (!req.body || typeof req.body !== 'object') {
      return res.status(400).json({ error: '偏好设置格式不正确' });
    }

    let profile = await UserProfile.findOne({ where: { user_id: req.user.id } });
    if (!profile) {
      profile = await UserProfile.create({ user_id: req.user.id });
    }

    const nextPreferences = {
      ...(profile.preferences || {}),
      ...req.body
    };

    await profile.update({ preferences: nextPreferences });

    return res.json({
      message: '偏好设置已更新',
      preferences: nextPreferences
    });
  } catch (error) {
    console.error('更新偏好设置失败:', error);
    return res.status(500).json({ error: '更新偏好设置失败' });
  }
});

module.exports = router;
