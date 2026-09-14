const express = require('express');
const router = express.Router();

const { authenticate, requireAdmin } = require('../middleware/auth');
const adminController = require('../controllers/adminController');

// 路由前缀处理
router.use((req, res, next) => {
  console.log(`Admin API: ${req.method} ${req.path}`);
  next();
});

/**
 * 非 edu 邮箱申请管理
 */
router.get('/non-edu-requests', authenticate, requireAdmin, adminController.listNonEduRequests);
router.post('/non-edu-requests/:id/approve', authenticate, requireAdmin, adminController.approveNonEduRequest);
router.post('/non-edu-requests/:id/reject', authenticate, requireAdmin, adminController.rejectNonEduRequest);

router.get('/allowed-login-emails', authenticate, requireAdmin, adminController.listAllowedLoginEmails);
router.post('/allowed-login-emails', authenticate, requireAdmin, adminController.createAllowedLoginEmail);
router.delete('/allowed-login-emails/:id', authenticate, requireAdmin, adminController.deleteAllowedLoginEmail);

/**
 * O2O分类管理
 */
router.get('/o2o-categories', authenticate, requireAdmin, adminController.getO2oCategories);
router.post('/o2o-categories', authenticate, requireAdmin, adminController.createO2oCategory);
router.delete('/o2o-categories/:id', authenticate, requireAdmin, adminController.deleteO2oCategory);

/**
 * 关键词屏蔽管理
 */
router.get('/keywords', authenticate, requireAdmin, adminController.getBlockedKeywords);
router.post('/keywords', authenticate, requireAdmin, adminController.addBlockedKeyword);
router.delete('/keywords/:id', authenticate, requireAdmin, adminController.deleteBlockedKeyword);

module.exports = router;
