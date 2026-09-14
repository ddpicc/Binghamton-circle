const express = require('express');
const router = express.Router();
const circleController = require('../controllers/circleController');
const { authenticate } = require('../middleware/auth');
const {
  checkCircleExists,
  requireCircleMember,
  requireCircleAdmin,
  requireCircleCreator,
  checkCanCreateCircle,
  loadCircle
} = require('../middleware/circleAuth');

// 圈子路由
// 获取圈子列表
router.get('/', authenticate, circleController.getCircles);

// 获取用户的圈子列表
router.get('/my', authenticate, circleController.getUserCircles);

// 创建圈子
router.post('/', 
  authenticate,
  checkCanCreateCircle,
  circleController.createCircle
);

// 获取圈子详情
router.get('/:circleId', 
  authenticate,
  checkCircleExists,
  loadCircle,
  circleController.getCircleById
);

// 更新圈子
router.put('/:circleId', 
  authenticate,
  checkCircleExists,
  requireCircleAdmin,
  circleController.updateCircle
);

router.post('/:circleId/transfer',
  authenticate,
  checkCircleExists,
  requireCircleCreator,
  circleController.transferCircle
);

// 删除圈子
router.delete('/:circleId', 
  authenticate,
  checkCircleExists,
  requireCircleCreator,
  circleController.deleteCircle
);

// 加入圈子
router.post('/:circleId/join', 
  authenticate,
  checkCircleExists,
  circleController.joinCircle
);

// 退出圈子
router.post('/:circleId/leave', 
  authenticate,
  checkCircleExists,
  requireCircleMember,
  circleController.leaveCircle
);

// 获取圈子成员列表
router.get('/:circleId/members', 
  authenticate,
  checkCircleExists,
  loadCircle,
  circleController.getCircleMembers
);

// 获取待处理的加入申请
router.get('/:circleId/pending-requests', 
  authenticate,
  checkCircleExists,
  requireCircleAdmin,
  circleController.getPendingRequests
);

// 处理加入申请
router.post('/:circleId/requests/:memberId/handle', 
  authenticate,
  checkCircleExists,
  requireCircleAdmin,
  circleController.handleJoinRequest
);

// 移除成员
router.delete('/:circleId/members/:memberId', 
  authenticate,
  checkCircleExists,
  requireCircleAdmin,
  circleController.removeMember
);

// 获取圈子帖子列表
router.get('/:circleId/posts', 
  checkCircleExists,
  loadCircle,
  circleController.getCirclePosts
);

module.exports = router;
