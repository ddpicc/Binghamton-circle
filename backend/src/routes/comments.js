const express = require('express');
const router = express.Router();
const commentController = require('../controllers/commentController');
const { authenticate, optionalAuth } = require('../middleware/auth');

// 获取帖子的评论列表（可选认证）
router.get('/post/:postId', optionalAuth, commentController.getComments);

// 获取评论详情（可选认证）
router.get('/:id', optionalAuth, commentController.getCommentById);

// 创建评论（需要认证）
router.post('/post/:postId', authenticate, commentController.createComment);

// 删除评论（需要认证）
router.delete('/:id', authenticate, commentController.deleteComment);

// 点赞/取消点赞评论（需要认证）
router.post('/:id/like', authenticate, commentController.toggleLike);

module.exports = router;