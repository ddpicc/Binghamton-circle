const express = require('express');
const router = express.Router();
const noticeController = require('../controllers/noticeController');
const { authenticate, optionalAuth, requireAdmin } = require('../middleware/auth');

// 获取通知列表（可选认证）
router.get('/', optionalAuth, noticeController.getNotices);

// 获取通知详情（可选认证）
router.get('/:id', optionalAuth, noticeController.getNoticeById);

// 获取通知分类列表（可选认证）
router.get('/categories/list', optionalAuth, noticeController.getCategories);

// 获取置顶通知（可选认证）
router.get('/pinned', optionalAuth, noticeController.getPinnedNotices);

// 创建通知（仅管理员）
router.post('/', authenticate, requireAdmin, noticeController.createNotice);

// 更新通知（仅管理员）
router.put('/:id', authenticate, requireAdmin, noticeController.updateNotice);

// 删除通知（仅管理员）
router.delete('/:id', authenticate, requireAdmin, noticeController.deleteNotice);

// 点赞/取消点赞通知（需要认证）
router.post('/:id/like', authenticate, noticeController.toggleLike);

module.exports = router;