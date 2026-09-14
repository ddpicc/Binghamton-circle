const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/lifeMapController');
const { authenticate, optionalAuth, requireAdmin } = require('../middleware/auth');

// 点位列表（公开，支持筛选与范围查询）
router.get('/points', optionalAuth, ctrl.listPoints);

// 管理员直接创建正式点位
router.post('/points', authenticate, requireAdmin, ctrl.createPoint);

// 提交点位（登录用户）
router.post('/submissions', authenticate, ctrl.submitPoint);

// 查看提交列表（管理员看全部，普通用户看自己）
router.get('/submissions', authenticate, ctrl.listSubmissions);

// 审核：通过/拒绝（管理员）
router.post('/submissions/:id/approve', authenticate, requireAdmin, ctrl.approveSubmission);
router.post('/submissions/:id/reject', authenticate, requireAdmin, ctrl.rejectSubmission);

module.exports = router;

