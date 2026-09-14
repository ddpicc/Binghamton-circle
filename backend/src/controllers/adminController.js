const { O2OCategory, BlockedKeyword, NonEduEmailRequest, User, AllowedLoginEmail } = require('../models');
const { sequelize } = require('../models');
const { Op } = require('sequelize');
const emailService = require('../services/email');
const nonEduService = require('../services/nonEduService');

const FRONTEND_BASE_URL = (process.env.NON_EDU_VERIFICATION_BASE_URL || process.env.FRONTEND_URL || 'http://localhost:5173').replace(/\/$/, '');

/**
 * 非 edu 邮箱申请管理
 */
exports.listNonEduRequests = async (req, res) => {
  try {
    const { status } = req.query;
    const where = {};

    if (status && ['pending', 'approved', 'rejected', 'verified'].includes(status)) {
      where.status = status;
    }

    const requests = await NonEduEmailRequest.findAll({
      where,
      order: [['created_at', 'DESC']],
      include: [
        {
          model: User,
          as: 'admin',
          attributes: ['id', 'username', 'primary_email']
        }
      ]
    });

    res.json({
      requests: requests.map((request) => ({
        id: request.id,
        requestedUsername: request.requested_username,
        personalEmail: request.personal_email,
        reason: request.reason,
        status: request.status,
        adminNote: request.admin_note,
        rejectedReason: request.rejected_reason,
        approvedAt: request.approved_at,
        rejectedAt: request.rejected_at,
        verifiedAt: request.verified_at,
        updatedAt: request.updated_at,
        createdAt: request.created_at,
        admin: request.admin
          ? {
              id: request.admin.id,
              username: request.admin.username,
              email: request.admin.email
            }
          : null
      }))
    });
  } catch (error) {
    console.error('获取非 edu 邮箱申请列表失败:', error);
    res.status(500).json({ error: '获取申请列表失败' });
  }
};

exports.approveNonEduRequest = async (req, res) => {
  const { id } = req.params;
  const { adminNote } = req.body;

  try {
    const request = await NonEduEmailRequest.findByPk(id);

    if (!request) {
      return res.status(404).json({ error: '申请不存在' });
    }

    if (request.status === 'verified') {
      return res.status(400).json({ error: '该申请已完成注册' });
    }

    let tokenPayload = null;

    await sequelize.transaction(async (transaction) => {
      request.status = 'approved';
      request.admin_id = req.user.id;
      request.admin_note = adminNote || null;
      request.rejected_reason = null;
      request.approved_at = new Date();
      request.rejected_at = null;
      await request.save({ transaction });

      await nonEduService.invalidateTokensForRequest(request.id, transaction);

      tokenPayload = await nonEduService.createVerificationToken({
        requestId: request.id,
        email: request.personal_email,
        transaction
      });
    });

    const verificationLink = `${FRONTEND_BASE_URL}/non-edu/verify?token=${tokenPayload.rawToken}`;
    const mailSent = await emailService.sendNonEduApprovalEmail({
      email: request.personal_email,
      requestedUsername: request.requested_username,
      verificationLink,
      adminNote
    });

    if (!mailSent) {
      return res.status(500).json({ error: '邮件发送失败，请稍后重试' });
    }

    res.json({
      message: '申请已通过并发送验证邮件',
      request: {
        id: request.id,
        status: request.status,
        personalEmail: request.personal_email,
        requestedUsername: request.requested_username,
        adminNote: request.admin_note,
        approvedAt: request.approved_at
      }
    });
  } catch (error) {
    console.error('审批非 edu 邮箱申请失败:', error);
    res.status(500).json({ error: '审批失败' });
  }
};

exports.rejectNonEduRequest = async (req, res) => {
  const { id } = req.params;
  const { reason } = req.body;

  if (!reason) {
    return res.status(400).json({ error: '请填写驳回原因' });
  }

  try {
    const request = await NonEduEmailRequest.findByPk(id);

    if (!request) {
      return res.status(404).json({ error: '申请不存在' });
    }

    if (request.status === 'verified') {
      return res.status(400).json({ error: '该申请已完成注册' });
    }

    await sequelize.transaction(async (transaction) => {
      request.status = 'rejected';
      request.admin_id = req.user.id;
      request.rejected_reason = reason;
      request.rejected_at = new Date();
      request.admin_note = null;
      request.approved_at = null;
      await request.save({ transaction });

      await nonEduService.invalidateTokensForRequest(request.id, transaction);
    });

    await emailService.sendNonEduRejectionEmail({
      email: request.personal_email,
      requestedUsername: request.requested_username,
      reason
    });

    res.json({
      message: '申请已驳回并通知申请人',
      request: {
        id: request.id,
        status: request.status,
        personalEmail: request.personal_email,
        requestedUsername: request.requested_username,
        rejectedReason: request.rejected_reason,
        rejectedAt: request.rejected_at
      }
    });
  } catch (error) {
    console.error('驳回非 edu 邮箱申请失败:', error);
    res.status(500).json({ error: '驳回失败' });
  }
};

exports.listAllowedLoginEmails = async (req, res) => {
  try {
    const items = await AllowedLoginEmail.findAll({
      order: [['created_at', 'DESC']]
    });

    res.json({
      items: items.map((item) => ({
        id: item.id,
        email: item.email,
        note: item.note,
        isActive: item.is_active,
        createdAt: item.created_at,
        updatedAt: item.updated_at
      }))
    });
  } catch (error) {
    console.error('获取登录白名单邮箱失败:', error);
    res.status(500).json({ error: '获取登录白名单邮箱失败' });
  }
};

exports.createAllowedLoginEmail = async (req, res) => {
  try {
    const email = String(req.body.email || '').trim().toLowerCase();
    const note = String(req.body.note || '').trim();

    if (!email) {
      return res.status(400).json({ error: '邮箱不能为空' });
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ error: '请输入有效的邮箱地址' });
    }

    if (emailService.validateSchoolEmail(email)) {
      return res.status(400).json({ error: '学校邮箱无需加入白名单' });
    }

    const [item, created] = await AllowedLoginEmail.findOrCreate({
      where: { email },
      defaults: {
        email,
        note: note || null,
        is_active: true,
        created_by: req.user.id,
        updated_by: req.user.id
      }
    });

    if (!created) {
      await item.update({
        note: note || item.note,
        is_active: true,
        updated_by: req.user.id
      });
    }

    res.status(created ? 201 : 200).json({
      message: created ? '邮箱已加入白名单' : '邮箱白名单已更新',
      item: {
        id: item.id,
        email: item.email,
        note: item.note,
        isActive: item.is_active
      }
    });
  } catch (error) {
    console.error('添加登录白名单邮箱失败:', error);
    res.status(500).json({ error: '添加登录白名单邮箱失败' });
  }
};

exports.deleteAllowedLoginEmail = async (req, res) => {
  try {
    const { id } = req.params;
    const item = await AllowedLoginEmail.findByPk(id);

    if (!item) {
      return res.status(404).json({ error: '白名单邮箱不存在' });
    }

    await item.destroy();

    res.json({ message: '白名单邮箱已删除' });
  } catch (error) {
    console.error('删除登录白名单邮箱失败:', error);
    res.status(500).json({ error: '删除登录白名单邮箱失败' });
  }
};

/**
 * O2O分类管理
 */

/**
 * 获取O2O分类列表（管理员）
 */
exports.getO2oCategories = async (req, res) => {
  try {
    const categories = await O2OCategory.findAll({
      order: [['sort_order', 'ASC'], ['name', 'ASC']]
    });

    res.json({ categories });
  } catch (error) {
    console.error('获取O2O分类失败:', error);
    res.status(500).json({ error: '获取O2O分类失败' });
  }
};

/**
 * 创建O2O分类
 */
exports.createO2oCategory = async (req, res) => {
  try {
    const { code, name, description, icon, sort_order = 0 } = req.body;

    if (!code || !name) {
      return res.status(400).json({ error: '分类标识和分类名称不能为空' });
    }

    if (!/^[a-z0-9_]+$/.test(code)) {
      return res.status(400).json({ error: '分类标识仅支持小写字母、数字和下划线' });
    }

    const existingCode = await O2OCategory.findOne({
      where: { code }
    });

    if (existingCode) {
      return res.status(400).json({ error: '分类标识已存在' });
    }

    // 检查分类名称是否已存在
    const existingCategory = await O2OCategory.findOne({
      where: { name }
    });

    if (existingCategory) {
      return res.status(400).json({ error: '分类名称已存在' });
    }

    const category = await O2OCategory.create({
      code,
      name,
      description,
      icon,
      sort_order,
      is_active: true
    });

    res.status(201).json({
      message: '分类创建成功',
      category
    });
  } catch (error) {
    console.error('创建O2O分类失败:', error);
    res.status(500).json({ error: '创建O2O分类失败' });
  }
};

/**
 * 删除O2O分类
 */
exports.deleteO2oCategory = async (req, res) => {
  try {
    const { id } = req.params;

    const category = await O2OCategory.findByPk(id);
    if (!category) {
      return res.status(404).json({ error: '分类不存在' });
    }

    // 检查是否有物品使用此分类
    const { O2OItem } = require('../models');
    const itemCount = await O2OItem.count({
      where: { category_id: id }
    });

    if (itemCount > 0) {
      return res.status(400).json({
        error: `无法删除分类，${itemCount}个物品正在使用此分类`
      });
    }

    await category.destroy();

    res.json({ message: '分类删除成功' });
  } catch (error) {
    console.error('删除O2O分类失败:', error);
    res.status(500).json({ error: '删除O2O分类失败' });
  }
};

/**
 * 关键词屏蔽管理
 */

/**
 * 获取关键词屏蔽列表
 */
exports.getBlockedKeywords = async (req, res) => {
  try {
    const keywords = await BlockedKeyword.findAll({
      where: { is_active: true },
      order: [['created_at', 'DESC']]
    });

    res.json({ keywords });
  } catch (error) {
    console.error('获取关键词屏蔽列表失败:', error);
    res.status(500).json({ error: '获取关键词屏蔽列表失败' });
  }
};

/**
 * 添加关键词屏蔽
 */
exports.addBlockedKeyword = async (req, res) => {
  try {
    const { type, keyword, action, reason } = req.body;

    if (!keyword) {
      return res.status(400).json({ error: '关键词不能为空' });
    }

    // 检查关键词是否已存在
    const existingKeyword = await BlockedKeyword.findOne({
      where: { keyword, is_active: true }
    });

    if (existingKeyword) {
      return res.status(400).json({ error: '关键词已存在' });
    }

    const blockedKeyword = await BlockedKeyword.create({
      type,
      keyword,
      action,
      reason,
      is_active: true
    });

    res.status(201).json({
      message: '关键词屏蔽添加成功',
      keyword: blockedKeyword
    });
  } catch (error) {
    console.error('添加关键词屏蔽失败:', error);
    res.status(500).json({ error: '添加关键词屏蔽失败' });
  }
};

/**
 * 删除关键词屏蔽
 */
exports.deleteBlockedKeyword = async (req, res) => {
  try {
    const { id } = req.params;

    const blockedKeyword = await BlockedKeyword.findByPk(id);
    if (!blockedKeyword) {
      return res.status(404).json({ error: '关键词屏蔽不存在' });
    }

    await blockedKeyword.update({ is_active: false });

    res.json({ message: '关键词屏蔽删除成功' });
  } catch (error) {
    console.error('删除关键词屏蔽失败:', error);
    res.status(500).json({ error: '删除关键词屏蔽失败' });
  }
};
