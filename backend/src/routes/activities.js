const express = require('express');
const router = express.Router();
const activityController = require('../controllers/activityController');
const { authenticate, optionalAuth } = require('../middleware/auth');

// 获取活动列表（可选认证）
router.get('/', optionalAuth, activityController.getActivities);

// 获取活动报名名单（可选认证）
router.get('/:id/participants', optionalAuth, activityController.getActivityParticipants);

// 获取活动详情（可选认证）
router.get('/:id', optionalAuth, activityController.getActivityById);

// 创建活动（需要认证）
router.post('/', authenticate, activityController.createActivity);

// 删除活动（需要认证）
router.delete('/:id', authenticate, activityController.deleteActivity);

// 报名/取消报名（需要认证）
router.post('/:id/join', authenticate, activityController.toggleJoin);

module.exports = router;
