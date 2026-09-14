import { loginWithEmail as emailLogin, loginWithWechat as wechatLogin, fetchProfile } from './services/auth'
import authStore, { updateAuthState, resetAuthState, initUser } from './stores/authStore'
import { resetProfileState } from './stores/profileStore'
import { showError } from './utils/toast'
import { USE_CLOUD_CONTAINER, CLOUDBASE_ENV } from './config/index'
const { needsProfileCompletion } = require('./utils/profile')

const ORIGINAL_PAGE = Page
Page = function withDefaultShare(pageOptions = {}) {
  if (typeof pageOptions.onShareAppMessage !== 'function') {
    pageOptions.onShareAppMessage = function onShareAppMessage() {
      const route = this.route ? `/${this.route}` : '/pages/home/index'
      return {
        title: 'Binghamton Circle',
        path: route
      }
    }
  }

  if (typeof pageOptions.onShareTimeline !== 'function') {
    pageOptions.onShareTimeline = function onShareTimeline() {
      return {
        title: 'Binghamton Circle'
      }
    }
  }

  return ORIGINAL_PAGE(pageOptions)
}

App({
  globalData: {
    emailVerified: authStore.getState().emailVerified,
    user: authStore.getState().user,
    hasPassword: authStore.getState().hasPassword,
    needsProfileCompletion: needsProfileCompletion(authStore.getState().user)
  },

  async onLaunch() {
    if (USE_CLOUD_CONTAINER) {
      wx.cloud.init({
        env: CLOUDBASE_ENV,
        traceUser: true
      })
    }
    initUser()
    const state = authStore.getState()
    this.globalData.emailVerified = state.emailVerified
    this.globalData.user = state.user
    this.globalData.hasPassword = state.hasPassword
    this.globalData.needsProfileCompletion = needsProfileCompletion(state.user)
  },

  onShow() {
    if (typeof wx.showShareMenu === 'function') {
      wx.showShareMenu({
        withShareTicket: true,
        menus: ['shareAppMessage', 'shareTimeline']
      })
    }
  },

  async ensureSession(force = false) {
    console.log('=== ensureSession 开始 ===')
    console.log('force参数:', force)

    initUser()
    const state = authStore.getState()
    console.log('当前auth状态:', {
      hasToken: !!state.token,
      hasUser: !!state.user,
      userId: state.user?.id
    })

    if (!force && state.token && state.user) {
      console.log('已有有效session，跳过登录')
      this.globalData.emailVerified = state.emailVerified
      this.globalData.user = state.user
      this.globalData.hasPassword = state.hasPassword
      this.globalData.needsProfileCompletion = needsProfileCompletion(state.user)
      return
    }

    if (force) {
      console.log('需要登录，跳转到登录页面')
      wx.navigateTo({ url: '/pages/auth/email-verify/index' })
      return
    }

    console.log('无有效session，但非强制登录，不跳转')
  },

  async loginWithEmail(email, code) {
    console.log('=== loginWithEmail 开始 ===')
    console.log('email:', email)

    try {
      const session = await emailLogin(email, code)
      console.log('邮箱登录响应:', {
        success: !!session.accessToken,
        userId: session.user?.id,
        username: session.user?.username
      })

      updateAuthState({
        token: session.accessToken || session.token,
        refreshToken: session.refreshToken || authStore.getState().refreshToken || '',
        user: session.user,
        emailVerified: !!session.emailVerified,
        hasPassword: !!(session.hasPassword || session.user?.has_password)
      })

      this.globalData.emailVerified = !!session.emailVerified
      this.globalData.user = session.user
      this.globalData.hasPassword = !!(session.hasPassword || session.user?.has_password)
      this.globalData.needsProfileCompletion = Boolean(
        typeof session.needsProfileCompletion === 'boolean'
          ? session.needsProfileCompletion
          : needsProfileCompletion(session.user)
      )

      console.log('邮箱登录状态更新完成')
      return session
    } catch (error) {
      console.error('loginWithEmail error', error)
      throw error
    }
  },

  async refreshProfile() {
    try {
      const profile = await fetchProfile({ authMode: 'optional' })
      const profileUser = profile.user || profile
      const verified = Boolean(
        (profileUser && (profileUser.emailVerified || profileUser.email_verified)) ||
        profile.emailVerified ||
        profile.email_verified
      )
      updateAuthState({
        user: profileUser,
        emailVerified: verified,
        hasPassword: !!(profileUser?.has_password || profile.hasPassword)
      })
      const state = authStore.getState()
      this.globalData.user = state.user
      this.globalData.emailVerified = state.emailVerified
      this.globalData.hasPassword = state.hasPassword
      this.globalData.needsProfileCompletion = needsProfileCompletion(state.user)
    } catch (error) {
      console.error('refreshProfile error', error)
    }
  },

  async ensureEmailVerified() {
    const state = authStore.getState()
    if (!state.emailVerified) {
      wx.redirectTo({ url: '/pages/auth/email-verify/index' })
      return false
    }
    return true
  },

  async loginWithWechat() {
    const loginRes = await wx.login()
    const code = loginRes?.code || ''
    const session = await wechatLogin(code)
    const hasBoundEmail = Boolean(session?.user?.email || session?.user?.primary_email)
    const emailVerified = Boolean(session?.emailVerified || session?.user?.email_verified)

    if (session?.needEmailBind || !hasBoundEmail || !emailVerified) {
      resetAuthState()
      this.globalData.emailVerified = false
      this.globalData.user = null
      this.globalData.hasPassword = false
      this.globalData.needsProfileCompletion = false
      return {
        ...session,
        needEmailBind: true,
        message: '账号不存在，请先使用邮箱和验证码注册账号，再绑定微信登录'
      }
    }

    if (!session?.accessToken && !session?.token) {
      return {
        ...session,
        needEmailBind: true,
        message: '微信登录未返回有效账号信息，请先使用邮箱注册账号'
      }
    }

    if (session && session.accessToken) {
      updateAuthState({
        token: session.accessToken || session.token,
        refreshToken: session.refreshToken || authStore.getState().refreshToken || '',
        user: session.user,
        emailVerified,
        hasPassword: !!(session.hasPassword || session.user?.has_password)
      })
      this.globalData.emailVerified = emailVerified
      this.globalData.user = session.user
      this.globalData.hasPassword = !!(session.hasPassword || session.user?.has_password)
      this.globalData.needsProfileCompletion = Boolean(
        typeof session.needsProfileCompletion === 'boolean'
          ? session.needsProfileCompletion
          : needsProfileCompletion(session.user)
      )
    }
    return session
  },

  logout() {
    resetAuthState()
    resetProfileState()
    this.globalData.emailVerified = false
    this.globalData.user = null
    this.globalData.hasPassword = false
    this.globalData.needsProfileCompletion = false
    wx.reLaunch({ url: '/pages/home/index' })
  }
})
