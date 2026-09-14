import { sendEmailVerification, loginWithEmail, loginWithEmailAndWechatBind, bindWechatAccount } from '../../../services/auth'
import authStore, { updateAuthState } from '../../../stores/authStore'
const { needsProfileCompletion } = require('../../../utils/profile')

function normalizeEmailUser(email = '') {
  const value = String(email || '').trim().toLowerCase()
  if (!value) return ''
  if (value.includes('@')) return value
  return value.replace(/@binghamton\.edu$/i, '')
}

function resolveEmailInput(emailUser = '') {
  const user = String(emailUser || '').trim().toLowerCase()
  if (!user) return ''
  if (user.includes('@')) return user
  return `${user}@binghamton.edu`
}

Page({
  data: {
    safeTop: 20,
    contentTop: 84,
    emailUser: '',
    customEmailMode: false,
    code: '',
    countdown: 0,
    sending: false,
    verifying: false,
    wechatLoggingIn: false,
    wechatBindingToken: '',
    needWechatBind: false
  },

  onLoad() {
    const sys = wx.getSystemInfoSync()
    const safeTop = sys.statusBarHeight || 20
    this.setData({
      safeTop,
      contentTop: safeTop + 64
    })

    const user = authStore.getState().user || {}
    const rawEmail = user.primary_email || user.email || ''
    this.setData({ emailUser: normalizeEmailUser(rawEmail) })

  },

  handleBack() {
    wx.navigateBack({
      fail: () => wx.switchTab({ url: '/pages/profile/index/index' })
    })
  },

  handleEmailInput(e) {
    const value = String(e.detail.value || '').replace(/\s+/g, '').toLowerCase()
    this.setData({
      emailUser: value,
      customEmailMode: value.includes('@')
    })
  },

  handleCodeInput(e) {
    this.setData({ code: String(e.detail.value || '').trim() })
  },

  async handleSendCode() {
    const email = resolveEmailInput(this.data.emailUser)
    if (!email) {
      wx.showToast({ title: '请输入邮箱', icon: 'none' })
      return
    }
    this.setData({ sending: true })
    try {
      await sendEmailVerification(email)
      wx.showToast({ title: '验证码已发送', icon: 'success' })
      this.startCountdown()
    } catch (error) {
      console.error('发送验证码失败', error)
      wx.showToast({ title: error?.message || '发送失败', icon: 'none' })
    } finally {
      this.setData({ sending: false })
    }
  },

  async handleVerify() {
    const email = resolveEmailInput(this.data.emailUser)
    if (!email) {
      wx.showToast({ title: '请输入邮箱', icon: 'none' })
      return
    }
    this.setData({ verifying: true })
    try {
      if (!this.data.code) {
        wx.showToast({ title: '请输入验证码', icon: 'none' })
        this.setData({ verifying: false })
        return
      }
      let session = null
      if (this.data.wechatBindingToken) {
        session = await loginWithEmailAndWechatBind(email, this.data.code, this.data.wechatBindingToken)
      } else {
        session = await loginWithEmail(email, this.data.code)
      }
      const shouldCompleteProfile = this.applySession(session)
      await this.handlePostRegisterSetup(session)
      wx.showToast({ title: '登录成功', icon: 'success' })
      setTimeout(() => {
        if (shouldCompleteProfile) {
          wx.redirectTo({ url: '/pages/profile/onboarding/index' })
          return
        }
        wx.navigateBack({ fail: () => wx.switchTab({ url: '/pages/home/index' }) })
      }, 500)
    } catch (error) {
      console.error('登录失败', error)
      wx.showToast({ title: error?.message || '登录失败', icon: 'none' })
    } finally {
      this.setData({ verifying: false })
    }
  },

  applySession(session = {}) {
    const verified = Boolean(session.emailVerified)
    const user = session.user || null
    const shouldCompleteProfile =
      typeof session.needsProfileCompletion === 'boolean'
        ? session.needsProfileCompletion
        : needsProfileCompletion(user)

    updateAuthState({
      token: session.accessToken || session.token,
      refreshToken: session.refreshToken || authStore.getState().refreshToken || '',
      user,
      emailVerified: verified,
      hasPassword: !!(session.hasPassword || user?.has_password)
    })

    const app = getApp()
    app.globalData.emailVerified = verified
    app.globalData.user = user
    app.globalData.hasPassword = !!(session.hasPassword || user?.has_password)
    app.globalData.needsProfileCompletion = shouldCompleteProfile

    return shouldCompleteProfile
  },

  async handlePostRegisterSetup(session = {}) {
    const wechatBound = !!(session.wechatBound || session.user?.wechat_bound)
    if (!wechatBound) {
      await this.handleBindWechat({ silent: true })
    }
  },

  async handleBindWechat(options = {}) {
    const silent = !!options.silent
    try {
      const loginResult = await wx.login()
      const code = loginResult?.code || ''
      if (!code) {
        if (!silent) {
          wx.showToast({ title: '获取微信凭证失败', icon: 'none' })
        } else {
          wx.showToast({ title: '自动绑定未完成，可在账号设置手动绑定', icon: 'none' })
        }
        return
      }

      await bindWechatAccount(code)
      const state = authStore.getState()
      const nextUser = {
        ...(state.user || {}),
        wechat_bound: true
      }
      updateAuthState({ user: nextUser })
      const app = getApp()
      app.globalData.user = nextUser
      if (!silent) {
        wx.showToast({ title: '微信已绑定', icon: 'success' })
      }
    } catch (error) {
      console.error('绑定微信失败', error)
      if (!silent) {
        wx.showToast({ title: error?.message || '绑定微信失败', icon: 'none' })
      } else {
        wx.showToast({ title: '自动绑定未完成，可在账号设置手动绑定', icon: 'none' })
      }
    }
  },

  notifyWechatBindRequired(message) {
    const content = message || '请先使用邮箱和验证码注册账号，注册完成后再绑定微信登录。'
    this.setData({ wechatLoggingIn: false })
    setTimeout(() => {
      wx.showModal({
        title: '账号不存在',
        content,
        confirmText: '去邮箱注册',
        showCancel: false,
        fail: () => {
          wx.showToast({ title: '请先邮箱注册', icon: 'none' })
        }
      })
    }, 80)
  },

  async handleWechatLogin() {
    if (this.data.wechatLoggingIn) return
    this.setData({ wechatLoggingIn: true })
    try {
      const session = await getApp().loginWithWechat()
      if (session.needEmailBind) {
        this.setData({
          wechatBindingToken: session.wechatBindingToken || '',
          needWechatBind: true
        })
        this.notifyWechatBindRequired(session.message)
        return
      }

      const shouldCompleteProfile = this.applySession(session)
      wx.showToast({ title: '微信登录成功', icon: 'success' })
      setTimeout(() => {
        if (shouldCompleteProfile) {
          wx.redirectTo({ url: '/pages/profile/onboarding/index' })
          return
        }
        wx.navigateBack({ fail: () => wx.switchTab({ url: '/pages/home/index' }) })
      }, 500)
    } catch (error) {
      console.error('微信登录失败', error)
      wx.showToast({ title: error?.message || '微信登录失败', icon: 'none' })
    } finally {
      if (this.data.wechatLoggingIn) {
        this.setData({ wechatLoggingIn: false })
      }
    }
  },

  startCountdown() {
    this.setData({ countdown: 60 })
    if (this.timer) clearInterval(this.timer)
    this.timer = setInterval(() => {
      const next = this.data.countdown - 1
      if (next <= 0) {
        clearInterval(this.timer)
        this.setData({ countdown: 0 })
      } else {
        this.setData({ countdown: next })
      }
    }, 1000)
  },

  onUnload() {
    if (this.timer) clearInterval(this.timer)
  }
})
