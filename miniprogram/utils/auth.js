const authStore = require('../stores/authStore')
const { showError } = require('./toast')
const LOGIN_PAGE_URL = '/pages/auth/email-verify/index'

function hasSession() {
  const state = authStore.getState()
  return Boolean(state.token && state.user)
}

function redirectToLogin() {
  const pages = typeof getCurrentPages === 'function' ? getCurrentPages() : []
  const currentPage = pages[pages.length - 1]
  const currentRoute = currentPage && currentPage.route ? `/${currentPage.route}` : ''
  if (currentRoute === LOGIN_PAGE_URL) {
    return
  }

  wx.navigateTo({
    url: LOGIN_PAGE_URL,
    fail: () => {
      wx.redirectTo({ url: LOGIN_PAGE_URL })
    }
  })
}

function ensureLogin(options = {}) {
  if (hasSession()) {
    return Promise.resolve(true)
  }

  const {
    title = '需要登录',
    content = '该操作需要登录后使用。是否继续登录？',
    confirmText = '去登录'
  } = options

  return new Promise((resolve) => {
    wx.showModal({
      title,
      content,
      confirmText,
      cancelText: '暂不',
      success: async (result) => {
        if (!result.confirm) {
          resolve(false)
          return
        }

        try {
          const app = typeof getApp === 'function' ? getApp() : null
          if (!app || typeof app.ensureSession !== 'function') {
            showError('登录能力不可用')
            resolve(false)
            return
          }

          await app.ensureSession(true)
          resolve(hasSession())
        } catch (error) {
          resolve(false)
        }
      },
      fail: () => resolve(false)
    })
  })
}

module.exports.hasSession = hasSession
module.exports.ensureLogin = ensureLogin
module.exports.redirectToLogin = redirectToLogin
module.exports.LOGIN_PAGE_URL = LOGIN_PAGE_URL
