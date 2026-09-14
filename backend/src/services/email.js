const nodemailer = require('nodemailer');
const crypto = require('crypto');

/**
 * 邮件服务类
 */
class EmailService {
  constructor() {
    this.transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST || 'smtp.gmail.com',
      port: process.env.EMAIL_PORT || 587,
      secure: parseInt(process.env.EMAIL_PORT) === 465, // true for 465, false for other ports
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      }
    });
  }

  /**
   * 生成验证码
   */
  generateVerificationCode() {
    return crypto.randomInt(100000, 999999).toString();
  }

  /**
   * 发送邮箱验证码
   */
  async sendVerificationCode(email, code) {
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: '校园社区平台 - 邮箱验证码',
      html: `
        <div style="max-width: 600px; margin: 0 auto; padding: 20px; font-family: Arial, sans-serif;">
          <h2 style="color: #1890ff; text-align: center;">校园社区平台</h2>
          <div style="background-color: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="color: #333; margin-top: 0;">邮箱验证</h3>
            <p style="color: #666; margin-bottom: 20px;">您的验证码是：</p>
            <div style="background-color: #1890ff; color: white; padding: 15px; text-align: center; font-size: 24px; font-weight: bold; border-radius: 4px; letter-spacing: 2px;">
              ${code}
            </div>
            <p style="color: #666; margin-top: 20px; font-size: 14px;">
              验证码有效期为10分钟，请尽快完成验证。
            </p>
          </div>
          <p style="color: #999; text-align: center; font-size: 12px; margin-top: 30px;">
            如果您没有请求此验证码，请忽略此邮件。
          </p>
        </div>
      `
    };

    try {
      await this.transporter.sendMail(mailOptions);
      return true;
    } catch (error) {
      console.error('邮件发送失败:', error);
      return false;
    }
  }

  /**
   * 发送欢迎邮件
   */
  async sendWelcomeEmail(email, nickname) {
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: '欢迎加入校园社区平台',
      html: `
        <div style="max-width: 600px; margin: 0 auto; padding: 20px; font-family: Arial, sans-serif;">
          <h2 style="color: #1890ff; text-align: center;">欢迎加入校园社区平台</h2>
          <div style="background-color: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="color: #333; margin-top: 0;">你好，${nickname}！</h3>
            <p style="color: #666; line-height: 1.6;">
              感谢您注册校园社区平台！在这里您可以：
            </p>
            <ul style="color: #666; line-height: 1.6;">
              <li>查看学校重要通知</li>
              <li>发布和浏览二手交易信息</li>
              <li>在广场上与同学交流</li>
              <li>分享校园生活点滴</li>
            </ul>
            <p style="color: #666; margin-top: 20px;">
              如果您有任何问题或建议，请随时联系我们。
            </p>
          </div>
          <p style="color: #999; text-align: center; font-size: 12px; margin-top: 30px;">
            © 2024 校园社区平台. All rights reserved.
          </p>
        </div>
      `
    };

    try {
      await this.transporter.sendMail(mailOptions);
      return true;
    } catch (error) {
      console.error('欢迎邮件发送失败:', error);
      return false;
    }
  }

  /**
   * 非 edu 邮箱申请提交确认
   */
  async sendNonEduRequestConfirmation(email, username) {
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: '我们已收到您的注册申请',
      html: `
        <div style="max-width: 600px; margin: 0 auto; padding: 20px; font-family: Arial, sans-serif;">
          <h2 style="color: #1890ff; text-align: center;">校园社区平台</h2>
          <div style="background-color: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="color: #333; margin-top: 0;">Hi ${username || '同学'},</h3>
            <p style="color: #666; line-height: 1.6;">
              我们已经收到您使用非学校邮箱注册的申请。管理员会尽快审核，并在通过后向您发送账号设置邮件。
            </p>
            <p style="color: #666; line-height: 1.6;">
              审核通常会在 1-2 个工作日内完成，请耐心等待。如需补充信息，可以回复此邮件或联系管理员。
            </p>
          </div>
          <p style="color: #999; text-align: center; font-size: 12px; margin-top: 30px;">
            © 2024 校园社区平台. All rights reserved.
          </p>
        </div>
      `
    };

    try {
      await this.transporter.sendMail(mailOptions);
      return true;
    } catch (error) {
      console.error('非 edu 邮箱申请确认邮件发送失败:', error);
      return false;
    }
  }

  /**
   * 非 edu 邮箱申请通过邮件
   */
  async sendNonEduApprovalEmail({ email, requestedUsername, verificationLink, adminNote }) {
    const noteBlock = adminNote
      ? `<div style="background-color:#fffbe6;border-radius:6px;padding:12px 16px;border:1px solid #ffe58f;margin-top:16px;">
            <strong>管理员备注：</strong>
            <div style="margin-top:8px;color:#555;white-space:pre-line;">${adminNote}</div>
         </div>`
      : '';

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: '请完成校园社区平台账号设置',
      html: `
        <div style="max-width: 600px; margin: 0 auto; padding: 20px; font-family: Arial, sans-serif;">
          <h2 style="color: #1890ff; text-align: center;">校园社区平台</h2>
          <div style="background-color: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="color: #333; margin-top: 0;">申请已通过</h3>
            <p style="color: #666; line-height: 1.6;">
              您使用邮箱 <strong>${email}</strong> 的注册申请已获得管理员审核通过。
            </p>
            <p style="color: #666; line-height: 1.6;">
              请在 24 小时内点击下方按钮完成账号设置。您可沿用当时填写的用户名 <strong>${requestedUsername}</strong>，或重新设置新的用户名。
            </p>
            <div style="text-align: center; margin: 24px 0;">
              <a href="${verificationLink}" style="display: inline-block; padding: 12px 24px; background-color: #1890ff; color: white; text-decoration: none; border-radius: 4px;">
                完成账号设置
              </a>
            </div>
            <p style="color: #999; font-size: 12px;">
              如果按钮无法点击，请复制以下链接到浏览器打开：
              <br />
              <span style="word-break: break-all;">${verificationLink}</span>
            </p>
            ${noteBlock}
          </div>
          <p style="color: #999; text-align: center; font-size: 12px; margin-top: 30px;">
            链接 24 小时内有效，请勿转发。如非本人操作，请忽略此邮件。
          </p>
        </div>
      `
    };

    try {
      await this.transporter.sendMail(mailOptions);
      return true;
    } catch (error) {
      console.error('非 edu 邮箱申请通过邮件发送失败:', error);
      return false;
    }
  }

  /**
   * 非 edu 邮箱申请被驳回邮件
   */
  async sendNonEduRejectionEmail({ email, requestedUsername, reason }) {
    const reasonBlock = reason
      ? `<div style="margin-top:16px;">
            <strong>驳回原因：</strong>
            <div style="margin-top:8px;color:#555;white-space:pre-line;">${reason}</div>
         </div>`
      : '';

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: '校园社区平台注册申请结果通知',
      html: `
        <div style="max-width: 600px; margin: 0 auto; padding: 20px; font-family: Arial, sans-serif;">
          <h2 style="color: #ff4d4f; text-align: center;">校园社区平台</h2>
          <div style="background-color: #fff1f0; padding: 20px; border-radius: 8px; margin: 20px 0; border: 1px solid #ffa39e;">
            <h3 style="color: #cf1322; margin-top: 0;">申请未通过</h3>
            <p style="color: #666; line-height: 1.6;">
              很抱歉，您使用邮箱 <strong>${email}</strong> 的注册申请未能通过审核。
            </p>
            ${reasonBlock}
            <p style="color: #666; line-height: 1.6; margin-top: 16px;">
              如需进一步帮助，请回复此邮件或联系管理员，我们会协助您完成注册。
            </p>
          </div>
          <p style="color: #999; text-align: center; font-size: 12px; margin-top: 30px;">
            © 2024 校园社区平台. All rights reserved.
          </p>
        </div>
      `
    };

    try {
      await this.transporter.sendMail(mailOptions);
      return true;
    } catch (error) {
      console.error('非 edu 邮箱申请驳回邮件发送失败:', error);
      return false;
    }
  }

  /**
   * 验证学校邮箱域名
   */
  validateSchoolEmail(email) {
    const normalizedEmail = String(email || '').trim().toLowerCase();
    const emailDomain = normalizedEmail.split('@')[1];
    if (!emailDomain) {
      return false;
    }
    return emailDomain === 'binghamton.edu';
  }
}

module.exports = new EmailService();
