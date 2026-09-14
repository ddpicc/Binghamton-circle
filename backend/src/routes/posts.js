const express = require('express');
const router = express.Router();
const postController = require('../controllers/postController');
const { authenticate, optionalAuth } = require('../middleware/auth');

// 获取帖子列表（可选认证）
router.get('/', optionalAuth, postController.getPosts);

// 获取帖子详情（可选认证）
router.get('/:id', optionalAuth, postController.getPostById);

// 创建帖子（需要认证）
router.post('/', authenticate, postController.createPost);

// 更新帖子（需要认证）
router.put('/:id', authenticate, postController.updatePost);

// 删除帖子（需要认证）
router.delete('/:id', authenticate, postController.deletePost);

// 点赞/取消点赞帖子（需要认证）
router.post('/:id/like', authenticate, postController.toggleLike);

// 获取用户已加入圈子的帖子列表（需要认证）
router.get('/user/circle-posts', authenticate, postController.getUserCirclePosts);

// 获取用户的帖子列表（可选认证）
router.get('/user/:userId', optionalAuth, postController.getUserPosts);

module.exports = router;