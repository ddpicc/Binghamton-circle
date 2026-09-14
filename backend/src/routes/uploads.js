const express = require('express');
const router = express.Router();
const uploadController = require('../controllers/uploadController');
const { authenticate } = require('../middleware/auth');

// 获取文件信息（可选认证）
router.get('/info/:filename', uploadController.getFileInfo);

// 上传单个文件（需要认证）
router.post('/single', authenticate, uploadController.uploadSingle);

// 上传多个文件（需要认证）
router.post('/multiple', authenticate, uploadController.uploadMultiple);

// 上传图片（需要认证）
router.post('/image', authenticate, uploadController.uploadImage);

// 兼容根路径上传图片
router.post('/', authenticate, uploadController.uploadImage);

// 删除文件（需要认证）
router.delete('/:filename', authenticate, uploadController.deleteFile);

// 根路由 - 返回上传服务信息
router.get('/', (req, res) => {
  res.json({
    message: '文件上传服务',
    version: '1.0.0',
    endpoints: {
      'POST /single': '上传单个文件',
      'POST /multiple': '上传多个文件（最多5个）',
      'POST /image': '上传图片',
      'GET /info/:filename': '获取文件信息',
      'DELETE /:filename': '删除文件'
    },
    limits: {
      maxFileSize: process.env.MAX_FILE_SIZE || '10MB',
      maxFiles: 5,
      allowedTypes: ['图片', '文档', '视频']
    }
  });
});

module.exports = router;
