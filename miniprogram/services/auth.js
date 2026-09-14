import { post, get } from '../utils/request'

export function loginWithWechat(code) {
  return post('/auth/wechat', code ? { code } : {})
}

export function sendEmailVerification(email) {
  return post('/auth/send-email-verification', { email })
}

export function verifyEmail(payload) {
  return post('/auth/verify-email', payload)
}

export function loginWithEmail(email, code) {
  return post('/auth/email/login', { email, code })
}

export function loginWithEmailAndWechatBind(email, code, wechatBindingToken) {
  return post('/auth/email/login', { email, code, wechatBindingToken })
}

export function loginWithPassword(username, password) {
  return post('/auth/password/login', { username, password })
}

export function logout() {
  return post('/auth/logout')
}

export function fetchProfile(options = {}) {
  return get('/users/profile', {}, options)
}

export function updateWechatUserInfo(userInfo) {
  return post('/auth/update-wechat-info', userInfo)
}

export function setPassword(payload) {
  return post('/auth/set-password', payload)
}

export function refreshAccessToken(refreshToken) {
  return post('/auth/refresh-token', { refreshToken })
}

export function bindWechatAccount(code) {
  return post('/auth/bind-wechat', code ? { code } : {})
}
