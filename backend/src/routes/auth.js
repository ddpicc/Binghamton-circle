const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { authenticate } = require('../middleware/auth');
const { User, UserProfile } = require('../models');

// 用户注册
router.post('/register', authController.register);

// 用户登录
router.post('/login', authController.login);

// 微信小程序登录
router.post('/wechat', authController.wechatLogin);

// 发送邮箱验证码
router.post('/send-email-verification', authController.sendEmailVerification);

// 邮箱验证码登录 / 自动注册
router.post('/email/login', authController.loginWithEmailCode);

// 账号密码登录（兼容邮箱账号）
router.post('/password/login', authController.login);

// 验证邮箱
router.post('/verify-email', authController.verifyEmail);

// 非 edu 邮箱申请
router.post('/non-edu-request', authController.requestNonEduEmail);
router.get('/non-edu-request/status', authController.getNonEduRequestStatus);
router.get('/non-edu-verify/:token', authController.getNonEduVerification);
router.post('/non-edu-complete', authController.completeNonEduRegistration);

// 刷新令牌
router.post('/refresh-token', authController.refreshToken);

// 退出登录（需要认证）
router.post('/logout', authenticate, authController.logout);

// 更新微信用户信息（需要认证）
router.post('/update-wechat-info', authenticate, authController.updateWechatUserInfo);
router.post('/bind-wechat', authenticate, authController.bindWechat);
router.post('/set-password', authenticate, authController.setPassword);

// 获取当前用户信息
router.get('/me', authenticate, async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id, {
      attributes: ['id', 'username', 'primary_email', 'email_verified', 'role', 'status', 'last_login', 'password'],
      include: [{
        model: UserProfile,
        as: 'profile',
        attributes: ['nickname', 'avatar', 'bio', 'phone', 'gender', 'school', 'major', 'grade']
      }]
    });

    if (!user) {
      return res.status(404).json({ error: '用户不存在' });
    }

    const payload = user.toJSON();
    delete payload.password;

    res.json({
      user: {
        ...payload,
        has_password: Boolean(user.password)
      }
    });
  } catch (error) {
    console.error('获取用户信息失败:', error);
    res.status(500).json({ error: '获取用户信息失败' });
  }
});

// 临时测试端点：使用用户ID直接登录
router.post('/test-login/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const jwt = require('jsonwebtoken');

    const user = await User.findByPk(parseInt(userId));
    if (!user || user.status !== 'active') {
      return res.status(404).json({ error: '用户不存在或已禁用' });
    }

    // 更新最后登录时间
    await user.update({ last_login: new Date() });

    // 生成令牌
    const generateAccessToken = (payload) => {
      return jwt.sign(payload, process.env.JWT_SECRET || 'your-secret-key', { expiresIn: '2h' });
    };

    const generateRefreshToken = (payload) => {
      return jwt.sign(payload, process.env.JWT_REFRESH_SECRET || 'your-refresh-secret', { expiresIn: '7d' });
    };

    const accessToken = generateAccessToken({ id: user.id, username: user.username });
    const refreshToken = generateRefreshToken({ id: user.id });

    res.json({
      message: '登录成功',
      user: {
        id: user.id,
        username: user.username,
        email: user.primary_email,
        email_verified: user.email_verified,
        has_password: Boolean(user.password),
      },
      emailVerified: user.email_verified,
      hasPassword: Boolean(user.password),
      accessToken,
      refreshToken
    });
  } catch (error) {
    console.error('测试登录失败:', error);
    res.status(500).json({ error: '测试登录失败' });
  }
});

module.exports = router;
