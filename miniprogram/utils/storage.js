const SESSION_KEY = 'BC_SESSION'

function getSession() {
  try {
    return wx.getStorageSync(SESSION_KEY) || {}
  } catch (err) {
    console.error('getSession error', err)
    return {}
  }
}

function setSession(session = {}) {
  try {
    wx.setStorageSync(SESSION_KEY, session)
  } catch (err) {
    console.error('setSession error', err)
  }
}

function clearSession() {
  try {
    wx.removeStorageSync(SESSION_KEY)
  } catch (err) {
    console.error('clearSession error', err)
  }
}

function getToken() {
  const session = getSession()
  return session && session.token ? session.token : ''
}

function getRefreshToken() {
  const session = getSession()
  return session && session.refreshToken ? session.refreshToken : ''
}

function getUser() {
  const session = getSession()
  return session && session.user ? session.user : null
}

module.exports.getSession = getSession
module.exports.setSession = setSession
module.exports.clearSession = clearSession
module.exports.getToken = getToken
module.exports.getRefreshToken = getRefreshToken
module.exports.getUser = getUser
