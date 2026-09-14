const express = require('express');
const router = express.Router();
const o2oController = require('../controllers/o2oController');
const { authenticate, optionalAuth } = require('../middleware/auth');

// 获取O2O物品列表（可选认证）
router.get('/', optionalAuth, o2oController.getO2OItems);

// 获取O2O分类列表（可选认证）
router.get('/categories', optionalAuth, o2oController.getCategories);

// 搜索O2O物品（可选认证）
router.get('/search', optionalAuth, o2oController.searchO2OItems);

// 获取用户的O2O物品列表（可选认证）
router.get('/user/:userId', optionalAuth, o2oController.getUserO2OItems);

// 获取O2O物品详情（可选认证）
router.get('/:id', optionalAuth, o2oController.getO2OItemById);

// 创建O2O物品（需要认证）
router.post('/', authenticate, o2oController.createO2OItem);

// 更新O2O物品（需要认证）
router.put('/:id', authenticate, o2oController.updateO2OItem);

// 删除O2O物品（需要认证）
router.delete('/:id', authenticate, o2oController.deleteO2OItem);

// 点赞/取消点赞O2O物品（需要认证）
router.post('/:id/like', authenticate, o2oController.toggleLike);

module.exports = router;