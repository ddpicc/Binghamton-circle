import authStore from '../stores/authStore'

function requireVerified(path, type = 'navigateTo') {
  const { emailVerified } = authStore.getState()
  if (!emailVerified && path.indexOf('auth/email-verify') === -1) {
    wx.redirectTo({ url: '/pages/auth/email-verify/index' })
    return false
  }
  return true
}

export function navigateTo(path, options = {}) {
  if (!requireVerified(path, 'navigateTo')) return
  wx.navigateTo({ url: path, ...options })
}

export function redirectTo(path, options = {}) {
  if (!requireVerified(path, 'redirectTo')) return
  wx.redirectTo({ url: path, ...options })
}

export function switchTab(path) {
  if (!requireVerified(path, 'switchTab')) return
  wx.switchTab({ url: path })
}

export function reLaunch(path) {
  if (!requireVerified(path, 'reLaunch')) return
  wx.reLaunch({ url: path })
}
