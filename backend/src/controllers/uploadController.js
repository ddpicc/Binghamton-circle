const multer = require('multer');
const path = require('path');
const COS = require('cos-nodejs-sdk-v5');

const COS_REGION = process.env.COS_REGION || 'ap-shanghai';
const COS_BUCKET = process.env.COS_BUCKET;

// 初始化腾讯云COS客户端
const cos = new COS({
  SecretId: process.env.COS_SECRET_ID,
  SecretKey: process.env.COS_SECRET_KEY,
  Region: COS_REGION,
  Domain: process.env.COS_DOMAIN
});

// 调试信息
console.log('COS Configuration:', {
  SecretId: process.env.COS_SECRET_ID ? '***' : 'undefined',
  SecretKey: process.env.COS_SECRET_KEY ? '***' : 'undefined',
  Region: COS_REGION,
  Domain: process.env.COS_DOMAIN,
  Bucket: COS_BUCKET
});

// 配置存储到内存（用于上传到COS）
const storage = multer.memoryStorage();

// 文件类型验证
const fileFilter = (req, file, cb) => {
  // 允许的图片类型
  const allowedImageTypes = /jpeg|jpg|png|gif|webp/;
  // 允许的文档类型
  const allowedDocumentTypes = /pdf|doc|docx|txt/;
  // 允许的视频类型
  const allowedVideoTypes = /mp4|mov|avi|wmv/;
  
  const extname = path.extname(file.originalname).toLowerCase();
  const mimetype = file.mimetype.toLowerCase();

  // 检查图片
  if (allowedImageTypes.test(extname.replace('.', '')) && 
      mimetype.startsWith('image/')) {
    return cb(null, true);
  }
  
  // 检查文档
  if (allowedDocumentTypes.test(extname.replace('.', '')) && 
      (mimetype.includes('application/') || mimetype.includes('text/'))) {
    return cb(null, true);
  }
  
  // 检查视频
  if (allowedVideoTypes.test(extname.replace('.', '')) && 
      mimetype.startsWith('video/')) {
    return cb(null, true);
  }
  
  cb(new Error('不支持的文件类型'));
};

// 文件大小限制
const limits = {
  fileSize: parseInt(process.env.MAX_FILE_SIZE) || 10 * 1024 * 1024 // 默认10MB
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: limits
});

// 生成COS文件路径
const generateCosPath = (originalName, folder = 'uploads') => {
  const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
  const extension = path.extname(originalName);
  const baseName = path.basename(originalName, extension);
  return `${folder}/${baseName}-${uniqueSuffix}${extension}`;
};

// 上传文件到COS
const uploadToCos = (file, cosPath) => {
  return new Promise((resolve, reject) => {
    console.log('Uploading to COS:', {
      Bucket: COS_BUCKET,
      Region: COS_REGION,
      Key: cosPath,
      ContentType: file.mimetype,
      fileSize: file.size
    });

    cos.putObject({
      Bucket: COS_BUCKET,
      Region: COS_REGION,
      Key: cosPath,
      Body: file.buffer,
      ContentType: file.mimetype
    }, (err, data) => {
      if (err) {
        console.error('COS upload error:', err);
        reject(err);
      } else {
        console.log('COS upload success:', data);
        const configuredDomain = process.env.COS_DOMAIN ? process.env.COS_DOMAIN.trim() : '';
        const normalizedDomain = configuredDomain
          ? (configuredDomain.startsWith('http') ? configuredDomain : `https://${configuredDomain}`)
          : '';
        const locationUrl = data && data.Location
          ? (data.Location.startsWith('http') ? data.Location : `https://${data.Location}`)
          : '';
        const url = normalizedDomain
          ? `${normalizedDomain.replace(/\/$/, '')}/${cosPath}`
          : locationUrl;
        resolve({
          ...data,
          cosPath: cosPath,
          url
        });
      }
    });
  });
};

// 从COS删除文件
const deleteFromCos = (cosPath) => {
  return new Promise((resolve, reject) => {
    cos.deleteObject({
      Bucket: COS_BUCKET,
      Region: COS_REGION,
      Key: cosPath
    }, (err, data) => {
      if (err) {
        reject(err);
      } else {
        resolve(data);
      }
    });
  });
};

/**
 * 上传单个文件
 */
exports.uploadSingle = async (req, res) => {
  const singleUpload = upload.single('file');

  singleUpload(req, res, async (err) => {
    if (err) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({
          error: '文件大小超过限制',
          maxSize: limits.fileSize
        });
      }
      if (err.message === '不支持的文件类型') {
        return res.status(400).json({
          error: '不支持的文件类型',
          allowedTypes: ['图片', '文档', '视频']
        });
      }
      return res.status(500).json({ error: '文件上传失败' });
    }

    if (!req.file) {
      return res.status(400).json({ error: '未选择文件' });
    }

    try {
      // 生成COS文件路径
      const cosPath = generateCosPath(req.file.originalname);

      // 上传到COS
      const cosResult = await uploadToCos(req.file, cosPath);

      // 返回文件信息
      res.json({
        message: '文件上传成功',
        file: {
          filename: cosPath,
          originalName: req.file.originalname,
          mimetype: req.file.mimetype,
          size: req.file.size,
          path: cosPath,
          url: cosResult.url,
          cosPath: cosPath,
          etag: cosResult.ETag,
          location: cosResult.Location
        },
        url: cosResult.url,
        location: cosResult.Location
      });
    } catch (error) {
      console.error('COS上传失败:', error);
      res.status(500).json({ error: '文件上传到COS失败' });
    }
  });
};

/**
 * 上传多个文件
 */
exports.uploadMultiple = async (req, res) => {
  const multipleUpload = upload.array('files', 5); // 最多5个文件

  multipleUpload(req, res, async (err) => {
    if (err) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({
          error: '文件大小超过限制',
          maxSize: limits.fileSize
        });
      }
      if (err.code === 'LIMIT_FILE_COUNT') {
        return res.status(400).json({
          error: '文件数量超过限制',
          maxCount: 5
        });
      }
      if (err.message === '不支持的文件类型') {
        return res.status(400).json({
          error: '不支持的文件类型',
          allowedTypes: ['图片', '文档', '视频']
        });
      }
      return res.status(500).json({ error: '文件上传失败' });
    }

    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: '未选择文件' });
    }

    try {
      // 批量上传到COS
      const uploadPromises = req.files.map(file => {
        const cosPath = generateCosPath(file.originalname);
        return uploadToCos(file, cosPath);
      });

      const results = await Promise.all(uploadPromises);

      // 返回文件信息
      const files = results.map((result, index) => ({
        filename: result.cosPath,
        originalName: req.files[index].originalname,
        mimetype: req.files[index].mimetype,
        size: req.files[index].size,
        path: result.cosPath,
        url: result.url,
        cosPath: result.cosPath,
        etag: result.ETag,
        location: result.Location
      }));

      res.json({
        message: '文件上传成功',
        files: files,
        count: files.length,
        urls: files.map((file) => file.url)
      });
    } catch (error) {
      console.error('COS批量上传失败:', error);
      res.status(500).json({ error: '文件上传到COS失败' });
    }
  });
};

/**
 * 上传图片（专门处理图片）
 */
exports.uploadImage = async (req, res) => {
  const imageUpload = upload.fields([
    { name: 'image', maxCount: 1 },
    { name: 'file', maxCount: 1 }
  ]);

  imageUpload(req, res, async (err) => {
    if (err) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({
          error: '图片大小超过限制',
          maxSize: limits.fileSize
        });
      }
      if (err.message === '不支持的文件类型') {
        return res.status(400).json({
          error: '不支持的图片类型',
          allowedTypes: ['jpeg', 'jpg', 'png', 'gif', 'webp']
        });
      }
      return res.status(500).json({ error: '图片上传失败' });
    }

    const uploadedFile = req.files?.image?.[0] || req.files?.file?.[0];

    if (!uploadedFile) {
      return res.status(400).json({ error: '未选择图片' });
    }

    try {
      const folderFromBody = req.body?.folder || req.query?.folder || req.headers['x-upload-folder'];
      const sanitizedFolder = typeof folderFromBody === 'string' && folderFromBody.trim() !== ''
        ? folderFromBody.trim().replace(/^\/+|\/+$/g, '')
        : 'images';

      // 生成COS文件路径
      const cosPath = generateCosPath(uploadedFile.originalname, sanitizedFolder);

      // 上传到COS
      const cosResult = await uploadToCos(uploadedFile, cosPath);

      // 返回图片信息
      res.json({
        message: '图片上传成功',
        image: {
          filename: cosPath,
          originalName: uploadedFile.originalname,
          mimetype: uploadedFile.mimetype,
          size: uploadedFile.size,
          width: null, // 可以后续添加图片尺寸处理
          height: null,
          path: cosPath,
          url: cosResult.url,
          cosPath: cosPath,
          etag: cosResult.ETag,
          location: cosResult.Location
        },
        url: cosResult.url
      });
    } catch (error) {
      console.error('COS图片上传失败:', error);
      res.status(500).json({ error: '图片上传到COS失败' });
    }
  });
};

/**
 * 删除文件
 */
exports.deleteFile = async (req, res) => {
  try {
    const { filename } = req.params;

    if (!filename) {
      return res.status(400).json({ error: '文件名不能为空' });
    }

    try {
      // 从COS删除文件
      await deleteFromCos(filename);
      res.json({ message: '文件删除成功' });
    } catch (error) {
      if (error.code === 'NoSuchKey') {
        return res.status(404).json({ error: '文件不存在' });
      }
      throw error;
    }
  } catch (error) {
    console.error('删除文件失败:', error);
    res.status(500).json({ error: '删除文件失败' });
  }
};

/**
 * 获取文件信息
 */
exports.getFileInfo = async (req, res) => {
  try {
    const { filename } = req.params;

    if (!filename) {
      return res.status(400).json({ error: '文件名不能为空' });
    }

    try {
      // 获取COS文件信息
      const result = await new Promise((resolve, reject) => {
        cos.headObject({
          Bucket: COS_BUCKET,
          Region: COS_REGION,
          Key: filename
        }, (err, data) => {
          if (err) {
            reject(err);
          } else {
            resolve(data);
          }
        });
      });

      const configuredDomain = process.env.COS_DOMAIN ? process.env.COS_DOMAIN.trim() : '';
      const normalizedDomain = configuredDomain
        ? (configuredDomain.startsWith('http') ? configuredDomain : `https://${configuredDomain}`)
        : '';
      const defaultBucketDomain = COS_BUCKET
        ? `https://${COS_BUCKET}.cos.${COS_REGION}.myqcloud.com`
        : '';
      const finalDomain = normalizedDomain || defaultBucketDomain;

      res.json({
        filename: filename,
        size: result['Content-Length'],
        created: result['Last-Modified'],
        modified: result['Last-Modified'],
        contentType: result['Content-Type'],
        etag: result['ETag'],
        path: filename,
        url: finalDomain ? `${finalDomain.replace(/\/$/, '')}/${filename}` : ''
      });
    } catch (error) {
      if (error.code === 'NoSuchKey') {
        return res.status(404).json({ error: '文件不存在' });
      }
      throw error;
    }
  } catch (error) {
    console.error('获取文件信息失败:', error);
    res.status(500).json({ error: '获取文件信息失败' });
  }
};
