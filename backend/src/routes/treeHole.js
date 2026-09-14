const express = require('express');
const router = express.Router();
const treeHoleController = require('../controllers/treeHoleController');
const { authenticate, optionalAuth } = require('../middleware/auth');

// 获取树洞帖子列表（可选认证）
router.get('/', optionalAuth, treeHoleController.getTreeHolePosts);

// 获取树洞帖子详情（可选认证）
router.get('/:id', optionalAuth, treeHoleController.getTreeHolePostById);

// 创建树洞帖子（需要认证）
router.post('/', authenticate, treeHoleController.createTreeHolePost);

// 更新树洞帖子（需要认证）
router.put('/:id', authenticate, treeHoleController.updateTreeHolePost);

// 删除树洞帖子（需要认证）
router.delete('/:id', authenticate, treeHoleController.deleteTreeHolePost);

// 点赞/取消点赞树洞帖子（需要认证）
router.post('/:id/like', authenticate, treeHoleController.toggleTreeHoleLike);

// 获取树洞帖子评论（可选认证）
router.get('/:id/comments', optionalAuth, treeHoleController.getTreeHoleComments);

// 创建树洞评论（需要认证）
router.post('/:id/comments', authenticate, treeHoleController.createTreeHoleComment);

module.exports = router;