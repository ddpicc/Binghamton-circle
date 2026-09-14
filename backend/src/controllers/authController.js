const bcrypt = require('bcryptjs');
const axios = require('axios');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const { Op } = require('sequelize');
const { User, UserProfile, NonEduEmailRequest, EmailVerificationToken, AllowedLoginEmail } = require('../models');
const { sequelize } = require('../models');
const { generateAccessToken, generateRefreshToken } = require('../utils/jwt');
const emailService = require('../services/email');
const nonEduService = require('../services/nonEduService');
const {
  assertMiniProgramTextSecurityForTexts,
  WechatContentSecurityError
} = require('../services/wechatContentSecurityService');

const isValidEmail = (email = '') => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
const SCHOOL_EMAIL_LOGIN_TYPE = 'school_email_login';
const VERIFICATION_CODE_EXPIRES_MINUTES = Number(process.env.EMAIL_CODE_EXPIRES_MINUTES || 10);
const WECHAT_BIND_TOKEN_EXPIRES_IN = process.env.WECHAT_BIND_TOKEN_EXPIRES_IN || '15m';
const normalizeEmail = (email = '') => String(email || '').trim().toLowerCase();
const WECHAT_BIND_SECRET = process.env.WECHAT_BIND_SECRET || process.env.JWT_SECRET || 'wechat-bind-secret';

const isAllowedLoginEmail = async (email = '') => {
  const normalizedEmail = normalizeEmail(email);
  if (emailService.validateSchoolEmail(normalizedEmail)) {
    return true;
  }

  const allowedEmail = await AllowedLoginEmail.findOne({
    where: {
      email: normalizedEmail,
      is_active: true
    }
  });

  return !!allowedEmail;
};

const hashVerificationCode = (email, code, type = SCHOOL_EMAIL_LOGIN_TYPE) => {
  const secret = process.env.EMAIL_CODE_SECRET || process.env.JWT_SECRET || 'email-code-secret';
  return crypto
    .createHash('sha256')
    .update(`${normalizeEmail(email)}:${String(code || '').trim()}:${type}:${secret}`)
    .digest('hex');
};

const createWechatBindingToken = ({ openid, unionid }) => {
  return jwt.sign(
    {
      type: 'wechat_bind',
      openid,
      unionid: unionid || null
    },
    WECHAT_BIND_SECRET,
    { expiresIn: WECHAT_BIND_TOKEN_EXPIRES_IN }
  );
};

const verifyWechatBindingToken = (token) => {
  try {
    const payload = jwt.verify(token, WECHAT_BIND_SECRET);
    if (!payload || payload.type !== 'wechat_bind' || !payload.openid) {
      return null;
    }
    return {
      openid: payload.openid,
      unionid: payload.unionid || null
    };
  } catch (error) {
    return null;
  }
};

const isPlaceholderNickname = (value = '') => {
  const name = String(value || '').trim();
  if (!name) return true;
  if (name === '微信用户') return true;
  return /^wx_[a-z0-9_]+$/i.test(name);
};

const isPlaceholderAvatar = (value = '') => {
  const avatar = String(value || '').trim().toLowerCase();
  if (!avatar) return true;
  if (avatar.includes('default') && avatar.includes('avatar')) return true;
  if (avatar.includes('wx.qlogo.cn') && avatar.includes('/132')) return true;
  if (avatar.includes('thirdwx.qlogo.cn') && avatar.includes('/132')) return true;
  return false;
};

const computeNeedsProfileCompletion = (profile = null) => {
  const nickname = profile?.nickname || '';
  const avatar = profile?.avatar || '';
  return isPlaceholderNickname(nickname) || isPlaceholderAvatar(avatar);
};

const generateUniqueUsername = async (email) => {
  const prefix = normalizeEmail(email).split('@')[0] || 'user';
  const sanitizedBase = prefix.replace(/[^a-z0-9_]/gi, '_').replace(/^_+|_+$/g, '') || 'user';
  let candidate = sanitizedBase.slice(0, 24);
  let counter = 1;

  while (await User.findOne({ where: { username: candidate } })) {
    const suffix = `_${counter}`;
    candidate = `${sanitizedBase.slice(0, Math.max(1, 24 - suffix.length))}${suffix}`;
    counter += 1;
  }

  return candidate;
};

const buildAuthResponse = async (user, message = '登录成功') => {
  const hydratedUser = await User.findByPk(user.id, {
    attributes: ['id', 'username', 'primary_email', 'role', 'status', 'email_verified', 'last_login', 'password', 'wechat_openid'],
    include: [{
      model: UserProfile,
      as: 'profile',
      attributes: ['nickname', 'avatar', 'bio', 'phone', 'gender', 'school', 'major', 'grade']
    }]
  });

  const accessToken = generateAccessToken({ id: hydratedUser.id, username: hydratedUser.username });
  const refreshToken = generateRefreshToken({ id: hydratedUser.id });
  const needsProfileCompletion = computeNeedsProfileCompletion(hydratedUser.profile);

  return {
    message,
    user: {
      id: hydratedUser.id,
      username: hydratedUser.username,
      email: hydratedUser.primary_email,
      role: hydratedUser.role,
      status: hydratedUser.status,
      email_verified: hydratedUser.email_verified,
      wechat_bound: Boolean(hydratedUser.wechat_openid),
      has_password: Boolean(hydratedUser.password),
      profile: hydratedUser.profile
        ? {
            nickname: hydratedUser.profile.nickname,
            avatar: hydratedUser.profile.avatar,
            bio: hydratedUser.profile.bio,
            phone: hydratedUser.profile.phone,
            gender: hydratedUser.profile.gender,
            school: hydratedUser.profile.school,
            major: hydratedUser.profile.major,
            grade: hydratedUser.profile.grade
          }
        : null
    },
    emailVerified: hydratedUser.email_verified,
    wechatBound: Boolean(hydratedUser.wechat_openid),
    hasPassword: Boolean(hydratedUser.password),
    needsProfileCompletion,
    accessToken,
    refreshToken
  };
};

const consumeEmailLoginCode = async (email, code, transaction) => {
  const normalizedEmail = normalizeEmail(email);
  const tokenHash = hashVerificationCode(normalizedEmail, code, SCHOOL_EMAIL_LOGIN_TYPE);
  const tokenRecord = await EmailVerificationToken.findOne({
    where: {
      email: normalizedEmail,
      type: SCHOOL_EMAIL_LOGIN_TYPE,
      token_hash: tokenHash,
      used_at: null,
      expires_at: {
        [Op.gt]: new Date()
      }
    },
    order: [['created_at', 'DESC']],
    transaction,
    lock: transaction ? transaction.LOCK.UPDATE : undefined
  });

  if (!tokenRecord) {
    return null;
  }

  tokenRecord.used_at = new Date();
  await tokenRecord.save({ transaction });
  return tokenRecord;
};

/**
 * 用户注册
 */
exports.register = async (req, res) => {
  return res.status(410).json({
    error: '注册入口已升级，请先通过校园邮箱验证码登录/注册'
  });
};

/**
 * 用户登录
 */
exports.login = async (req, res) => {
  return res.status(410).json({
    error: '密码登录已下线，请使用微信登录或邮箱验证码登录/注册'
  });
};

/**
 * 发送邮箱验证码
 */
exports.sendEmailVerification = async (req, res) => {
  try {
    const email = normalizeEmail(req.body.email);

    if (!email) {
      return res.status(400).json({ error: '邮箱不能为空' });
    }

    if (!isValidEmail(email)) {
      return res.status(400).json({ error: '请输入有效的邮箱地址' });
    }

    // 验证学校邮箱域名
    if (!(await isAllowedLoginEmail(email))) {
      return res.status(400).json({ error: '请使用学校邮箱' });
    }

    // 生成验证码
    const code = emailService.generateVerificationCode();

    const now = new Date();
    const expiresAt = new Date(now.getTime() + VERIFICATION_CODE_EXPIRES_MINUTES * 60 * 1000);
    await EmailVerificationToken.update(
      {
        used_at: now
      },
      {
        where: {
          email,
          type: SCHOOL_EMAIL_LOGIN_TYPE,
          used_at: null
        }
      }
    );

    await EmailVerificationToken.create({
      email,
      token_hash: hashVerificationCode(email, code, SCHOOL_EMAIL_LOGIN_TYPE),
      type: SCHOOL_EMAIL_LOGIN_TYPE,
      expires_at: expiresAt
    });

    // 发送验证码邮件
    const success = await emailService.sendVerificationCode(email, code);

    if (!success) {
      await EmailVerificationToken.update(
        { used_at: new Date() },
        {
          where: {
            email,
            type: SCHOOL_EMAIL_LOGIN_TYPE,
            token_hash: hashVerificationCode(email, code, SCHOOL_EMAIL_LOGIN_TYPE),
            used_at: null
          }
        }
      );
      return res.status(500).json({ error: '验证码发送失败' });
    }

    res.json({ 
      message: '验证码发送成功'
    });
  } catch (error) {
    console.error('发送验证码失败:', error);
    res.status(500).json({ error: '验证码发送失败' });
  }
};

/**
 * 邮箱验证码登录 / 自动注册
 */
exports.loginWithEmailCode = async (req, res) => {
  try {
    const email = normalizeEmail(req.body.email);
    const code = String(req.body.code || '').trim();
    const wechatBindingToken = String(req.body.wechatBindingToken || '').trim();

    if (!email || !code) {
      return res.status(400).json({ error: '邮箱和验证码不能为空' });
    }

    if (!isValidEmail(email)) {
      return res.status(400).json({ error: '请输入有效的邮箱地址' });
    }

    if (!(await isAllowedLoginEmail(email))) {
      return res.status(400).json({ error: '请使用学校邮箱' });
    }

    let user = null;
    let created = false;

    const wechatIdentity = wechatBindingToken ? verifyWechatBindingToken(wechatBindingToken) : null;
    if (wechatBindingToken && !wechatIdentity) {
      return res.status(400).json({ error: '微信绑定信息已过期，请重新微信登录后再验证邮箱' });
    }

    await sequelize.transaction(async (transaction) => {
      const tokenRecord = await consumeEmailLoginCode(email, code, transaction);
      if (!tokenRecord) {
        throw new Error('INVALID_VERIFICATION_CODE');
      }

      user = await User.findOne({
        where: { primary_email: email },
        transaction,
        lock: transaction.LOCK.UPDATE
      });

      if (!user) {
        created = true;
        const username = await generateUniqueUsername(email);
        user = await User.create({
          username,
          primary_email: email,
          password: null,
          email_verified: true
        }, { transaction });

        await UserProfile.create({
          user_id: user.id,
          nickname: null,
          avatar: null
        }, { transaction });
      } else if (!user.email_verified) {
        await user.update({ email_verified: true }, { transaction });
      }

      await user.update({ last_login: new Date() }, { transaction });

      if (wechatIdentity) {
        const existingWechatUser = await User.findOne({
          where: { wechat_openid: wechatIdentity.openid },
          transaction,
          lock: transaction.LOCK.UPDATE
        });
        if (existingWechatUser && String(existingWechatUser.id) !== String(user.id)) {
          throw new Error('WECHAT_ALREADY_BOUND');
        }

        const wechatUpdates = {
          wechat_openid: wechatIdentity.openid
        };

        if (wechatIdentity.unionid) {
          wechatUpdates.wechat_unionid = wechatIdentity.unionid;
        }

        await user.update(wechatUpdates, { transaction });
      }

      tokenRecord.user_id = user.id;
      await tokenRecord.save({ transaction });
    });

    const response = await buildAuthResponse(user, created ? '注册并登录成功' : '登录成功');
    res.json(response);
  } catch (error) {
    if (error.message === 'INVALID_VERIFICATION_CODE') {
      return res.status(400).json({ error: '验证码错误或已过期' });
    }
    if (error.message === 'WECHAT_ALREADY_BOUND') {
      return res.status(409).json({ error: '该微信已绑定其他账号，请使用微信直接登录' });
    }

    console.error('邮箱验证码登录失败:', error);
    res.status(500).json({ error: '邮箱登录失败' });
  }
};

/**
 * 兼容旧验证接口，直接复用邮箱验证码登录
 */
exports.verifyEmail = exports.loginWithEmailCode;

exports.setPassword = async (req, res) => {
  return res.status(410).json({
    error: '密码设置已下线，请使用微信登录或邮箱验证码登录/注册'
  });
};

/**
 * 提交非 edu 邮箱申请
 */
exports.requestNonEduEmail = async (req, res) => {
  try {
    const { username, email, reason } = req.body;

    if (!username || !email) {
      return res.status(400).json({ error: '用户名和邮箱不能为空' });
    }

    const trimmedUsername = username.trim();
    const normalizedEmail = email.trim().toLowerCase();

    if (!isValidEmail(normalizedEmail)) {
      return res.status(400).json({ error: '请输入有效的邮箱地址' });
    }

    if (emailService.validateSchoolEmail(normalizedEmail)) {
      return res.status(400).json({ error: '该邮箱为学校邮箱，请直接使用邮箱验证流程' });
    }

    const existingUser = await User.findOne({ where: { primary_email: normalizedEmail } });
    if (existingUser) {
      return res.status(400).json({ error: '该邮箱已被注册，请尝试登录或使用找回密码' });
    }

    let request = await NonEduEmailRequest.findOne({
      where: { personal_email: normalizedEmail }
    });

    if (request && request.status === 'pending') {
      return res.status(200).json({
        message: '申请已提交，请等待管理员审核',
        status: request.status
      });
    }

    if (request) {
      request.requested_username = trimmedUsername;
      request.reason = reason;
      request.status = 'pending';
      request.admin_id = null;
      request.admin_note = null;
      request.rejected_reason = null;
      request.approved_at = null;
      request.rejected_at = null;
      request.verified_at = null;
      await request.save();
    } else {
      request = await NonEduEmailRequest.create({
        requested_username: trimmedUsername,
        personal_email: normalizedEmail,
        reason,
        status: 'pending'
      });
    }

    await nonEduService.invalidateTokensForRequest(request.id);
    await emailService.sendNonEduRequestConfirmation(normalizedEmail, trimmedUsername);

    res.status(201).json({
      message: '申请已提交，请等待管理员审核',
      status: request.status
    });
  } catch (error) {
    console.error('提交非 edu 邮箱申请失败:', error);
    res.status(500).json({ error: '提交申请失败' });
  }
};

/**
 * 查询非 edu 邮箱申请状态
 */
exports.getNonEduRequestStatus = async (req, res) => {
  try {
    const { email, username } = req.query;

    if (!email && !username) {
      return res.status(400).json({ error: '请提供邮箱或用户名查询' });
    }

    const where = {};
    if (email) {
      where.personal_email = email.trim().toLowerCase();
    }
    if (username) {
      where.requested_username = username.trim();
    }

    const request = await NonEduEmailRequest.findOne({
      where,
      order: [['updated_at', 'DESC']]
    });

    if (!request) {
      return res.status(404).json({ status: 'not_found' });
    }

    res.json({
      status: request.status,
      request: {
        requestedUsername: request.requested_username,
        personalEmail: request.personal_email,
        reason: request.reason,
        status: request.status,
        adminNote: request.admin_note,
        rejectedReason: request.rejected_reason,
        updatedAt: request.updated_at
      }
    });
  } catch (error) {
    console.error('查询非 edu 邮箱申请状态失败:', error);
    res.status(500).json({ error: '查询申请状态失败' });
  }
};

/**
 * 验证非 edu 邮箱令牌有效性
 */
exports.getNonEduVerification = async (req, res) => {
  try {
    const token = req.params.token || req.query.token;

    if (!token) {
      return res.status(400).json({ error: '缺少验证令牌' });
    }

    const tokenRecord = await nonEduService.findValidToken(token);

    if (!tokenRecord || !tokenRecord.request) {
      return res.status(404).json({ error: '验证链接已失效或不存在' });
    }

    if (tokenRecord.request.status !== 'approved') {
      return res.status(400).json({ error: '申请尚未获得批准' });
    }

    res.json({
      email: tokenRecord.email,
      requestedUsername: tokenRecord.request.requested_username,
      expiresAt: tokenRecord.expires_at
    });
  } catch (error) {
    console.error('验证非 edu 邮箱令牌失败:', error);
    res.status(500).json({ error: '验证链接校验失败' });
  }
};

/**
 * 完成非 edu 邮箱注册
 */
exports.completeNonEduRegistration = async (req, res) => {
  try {
    const { token, username, password } = req.body;

    if (!token || !username || !password) {
      return res.status(400).json({ error: '缺少必要的注册信息' });
    }

    const trimmedUsername = username.trim();
    if (trimmedUsername.length < 3 || trimmedUsername.length > 20) {
      return res.status(400).json({ error: '用户名长度需在3到20个字符之间' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: '密码长度不能少于6位' });
    }

    const existingUsername = await User.findOne({ where: { username: trimmedUsername } });
    if (existingUsername) {
      return res.status(400).json({ error: '用户名已存在，请选择其他用户名' });
    }

    const tokenRecord = await nonEduService.findValidToken(token);
    if (!tokenRecord || !tokenRecord.request) {
      return res.status(400).json({ error: '验证链接已失效或不存在' });
    }

    if (tokenRecord.request.status !== 'approved') {
      return res.status(400).json({ error: '申请尚未获得批准' });
    }

    const existingEmail = await User.findOne({ where: { primary_email: tokenRecord.email } });
    if (existingEmail) {
      return res.status(400).json({ error: '该邮箱已被注册，请联系管理员处理' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    let newUser = null;

    await sequelize.transaction(async (transaction) => {
      newUser = await User.create({
        username: trimmedUsername,
        primary_email: tokenRecord.email,
        password: hashedPassword,
        email_verified: true
      }, { transaction });

      await UserProfile.create({
        user_id: newUser.id,
        nickname: trimmedUsername
      }, { transaction });

      await NonEduEmailRequest.update({
        status: 'verified',
        verified_at: new Date()
      }, {
        where: { id: tokenRecord.request.id },
        transaction
      });

      tokenRecord.user_id = newUser.id;
      tokenRecord.used_at = new Date();
      await tokenRecord.save({ transaction });

      await nonEduService.invalidateTokensForRequest(tokenRecord.request.id, transaction);
    });

    await emailService.sendWelcomeEmail(tokenRecord.email, trimmedUsername);

    const accessToken = generateAccessToken({ id: newUser.id, username: newUser.username });
    const refreshToken = generateRefreshToken({ id: newUser.id });

    res.status(201).json({
      message: '账号设置完成',
      user: {
        id: newUser.id,
        username: newUser.username,
        email: newUser.primary_email,
        email_verified: true,
        role: newUser.role,
        status: newUser.status
      },
      accessToken,
      refreshToken
    });
  } catch (error) {
    console.error('完成非 edu 邮箱注册失败:', error);
    res.status(500).json({ error: '账号设置失败，请重试或联系管理员' });
  }
};

/**
 * 微信小程序登录
 */
exports.wechatLogin = async (req, res) => {
  try {
    const { code } = req.body;

    let openid = req.headers['x-wx-openid'] || req.headers['X-WX-OPENID'] || null;
    let unionid = req.headers['x-wx-unionid'] || req.headers['X-WX-UNIONID'] || null;
    let sessionKey = null;

    if (openid) {
      console.log('使用云托管请求头中的微信身份信息登录:', {
        openidSuffix: openid.slice(-6),
        hasUnionId: Boolean(unionid)
      });
    } else {
      if (!code) {
        return res.status(400).json({ error: '缺少登录凭证 code' });
      }

      const appId = process.env.WECHAT_MINIAPP_APPID;
      const appSecret = process.env.WECHAT_MINIAPP_SECRET;

      console.log('微信登录调试信息:');
      console.log('AppId:', appId);
      console.log('AppSecret:', appSecret ? '***已配置***' : '***未配置***');
      console.log('Code:', code);

      if (appId && appSecret) {
        try {
          console.log('正在调用微信API...');
          const response = await axios.get('https://api.weixin.qq.com/sns/jscode2session', {
            params: {
              appid: appId,
              secret: appSecret,
              js_code: code,
              grant_type: 'authorization_code'
            }
          });

          console.log('微信API响应:', JSON.stringify(response.data, null, 2));

          if (response.data.errcode) {
            console.warn('jscode2session error:', response.data);
          } else {
            openid = response.data.openid;
            unionid = response.data.unionid;
            sessionKey = response.data.session_key;
            console.log('成功获取openid:', openid);
          }
        } catch (apiError) {
          console.warn('jscode2session request failed:', apiError.message);
          console.warn('Error details:', apiError.response?.data || apiError);
        }
      } else {
        console.warn('微信AppId或AppSecret未配置');
      }
    }

    if (!openid) {
      // 开发环境降级处理，使用固定的测试 openid 以便调试
      // 这样可以确保开发时每次登录都是同一个用户
      if (process.env.NODE_ENV === 'development') {
        openid = 'dev_test_wechat_user_001'; // 固定的测试openid
        console.log('使用开发环境固定openid:', openid);
      } else {
        openid = `dev_${code}`;
      }
    }

    let user = await User.findOne({ where: { wechat_openid: openid } });
    if (!user && unionid) {
      user = await User.findOne({ where: { wechat_unionid: unionid } });
      if (user && user.wechat_openid !== openid) {
        await user.update({ wechat_openid: openid });
      }
    }

    if (!user) {
      const wechatBindingToken = createWechatBindingToken({ openid, unionid });
      return res.status(200).json({
        needEmailBind: true,
        wechatBindingToken,
        message: '请先完成校园邮箱认证并绑定微信账号'
      });
    }

    // 微信仅允许登录已完成邮箱注册/验证的账号
    if (!user.primary_email || !user.email_verified || user.status !== 'active') {
      const wechatBindingToken = createWechatBindingToken({ openid, unionid });
      return res.status(200).json({
        needEmailBind: true,
        wechatBindingToken,
        message: '当前微信尚未绑定已完成邮箱验证的账号，请先邮箱注册/登录后再绑定微信'
      });
    }

    await user.update({
      last_login: new Date(),
      ...(unionid && !user.wechat_unionid ? { wechat_unionid: unionid } : {})
    });

    const responseData = await buildAuthResponse(user, '登录成功');

    // 仅在开发环境返回sessionKey用于调试
    if (process.env.NODE_ENV === 'development') {
      responseData.sessionKey = sessionKey;
    }

    res.json(responseData);
  } catch (error) {
    console.error('微信登录失败:', error);
    res.status(500).json({ error: '微信登录失败' });
  }
};

/**
 * 绑定微信账号（需先完成邮箱注册登录）
 */
exports.bindWechat = async (req, res) => {
  try {
    const { code } = req.body;
    const userId = req.user.id;
    let openid = req.headers['x-wx-openid'] || req.headers['X-WX-OPENID'] || null;
    let unionid = req.headers['x-wx-unionid'] || req.headers['X-WX-UNIONID'] || null;

    if (!openid) {
      if (!code) {
        return res.status(400).json({ error: '缺少微信登录凭证 code' });
      }

      const appId = process.env.WECHAT_MINIAPP_APPID;
      const appSecret = process.env.WECHAT_MINIAPP_SECRET;
      if (!appId || !appSecret) {
        return res.status(500).json({ error: '微信绑定服务未配置' });
      }

      const response = await axios.get('https://api.weixin.qq.com/sns/jscode2session', {
        params: {
          appid: appId,
          secret: appSecret,
          js_code: code,
          grant_type: 'authorization_code'
        }
      });

      if (response.data.errcode || !response.data.openid) {
        return res.status(400).json({ error: '微信登录凭证无效，请重试' });
      }

      openid = response.data.openid;
      unionid = response.data.unionid || null;
    }

    const user = await User.findByPk(userId);
    if (!user || user.status !== 'active') {
      return res.status(404).json({ error: '用户不存在' });
    }

    const existingWechatUser = await User.findOne({ where: { wechat_openid: openid } });
    if (existingWechatUser && String(existingWechatUser.id) !== String(user.id)) {
      return res.status(409).json({ error: '该微信已绑定其他账号' });
    }

    await user.update({
      wechat_openid: openid,
      ...(unionid ? { wechat_unionid: unionid } : {})
    });

    return res.json({
      message: '微信绑定成功',
      wechatBound: true
    });
  } catch (error) {
    console.error('绑定微信失败:', error);
    return res.status(500).json({ error: '绑定微信失败' });
  }
};

/**
 * 刷新令牌
 */
exports.refreshToken = async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(401).json({ error: 'Refresh token required' });
    }

    const { verifyRefreshToken, generateAccessToken } = require('../utils/jwt');
    const decoded = verifyRefreshToken(refreshToken);

    // 检查用户是否仍然活跃
    const user = await User.findByPk(decoded.id);
    if (!user || user.status !== 'active') {
      return res.status(401).json({ error: 'Invalid or inactive user' });
    }

    // 生成新的访问令牌
    const newAccessToken = generateAccessToken({ id: user.id, username: user.username });

    res.json({
      accessToken: newAccessToken
    });
  } catch (error) {
    console.error('刷新令牌失败:', error);
    res.status(401).json({ error: 'Invalid refresh token' });
  }
};

/**
 * 更新微信用户信息
 */
exports.updateWechatUserInfo = async (req, res) => {
  try {
    const { nickname, avatar, gender, city, province, country } = req.body;
    const userId = req.user.id;

    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({ error: '用户不存在' });
    }

    await assertMiniProgramTextSecurityForTexts({
      user: req.user,
      scene: 1,
      texts: [nickname, city, province, country],
      requestHeaders: req.headers
    });

    // 更新用户资料
    const [profile, created] = await UserProfile.findOrCreate({
      where: { user_id: userId },
      defaults: {
        nickname: nickname || user.username,
        avatar: avatar || null,
        gender: gender || null,
        city: city || null,
        province: province || null,
        country: country || null
      }
    });

    if (!created) {
      await profile.update({
        nickname: nickname || profile.nickname,
        avatar: avatar || profile.avatar,
        gender: gender || profile.gender,
        city: city || profile.city,
        province: province || profile.province,
        country: country || profile.country
      });
    }

    res.json({
      message: '用户信息更新成功',
      user: {
        id: user.id,
        username: user.username,
        profile: {
          nickname: profile.nickname,
          avatar: profile.avatar,
          gender: profile.gender,
          city: profile.city,
          province: profile.province,
          country: profile.country
        }
      }
    });
  } catch (error) {
    console.error('更新微信用户信息失败:', error);
    if (error instanceof WechatContentSecurityError) {
      return res.status(error.statusCode).json({ error: error.message, code: error.code });
    }
    res.status(500).json({ error: '更新用户信息失败' });
  }
};

/**
 * 退出登录
 */
exports.logout = async (req, res) => {
  // 在实际应用中，这里可能需要将令牌加入黑名单
  res.json({ message: '退出登录成功' });
};
