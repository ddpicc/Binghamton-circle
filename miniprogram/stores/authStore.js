const { createStore } = require('../utils/createStore')
const { getSession, setSession, clearSession } = require('../utils/storage')

const initialSession = getSession()
const EMPTY_AUTH_STATE = {
  user: null,
  token: '',
  refreshToken: '',
  emailVerified: false,
  hasPassword: false,
  loading: false
}

const authStore = createStore({
  ...EMPTY_AUTH_STATE,
  user: initialSession.user || EMPTY_AUTH_STATE.user,
  token: initialSession.token || EMPTY_AUTH_STATE.token,
  refreshToken: initialSession.refreshToken || EMPTY_AUTH_STATE.refreshToken,
  emailVerified: initialSession.emailVerified || EMPTY_AUTH_STATE.emailVerified,
  hasPassword: initialSession.hasPassword || EMPTY_AUTH_STATE.hasPassword
})

module.exports = authStore

function updateAuthState(partial) {
  authStore.setState(partial)
  const state = authStore.getState()
  setSession({
    token: state.token,
    refreshToken: state.refreshToken,
    user: state.user,
    emailVerified: state.emailVerified,
    hasPassword: state.hasPassword
  })
}

function resetAuthState() {
  authStore.setState(EMPTY_AUTH_STATE)
  clearSession()
}

function initUser() {
  // 检查本地存储的用户状态
  const session = getSession()
  if (session.token && session.user) {
    // 如果有有效的token和用户信息，更新store状态
    authStore.setState({
      user: session.user,
      token: session.token,
      refreshToken: session.refreshToken || '',
      emailVerified: session.emailVerified || false,
      hasPassword: session.hasPassword || session.user?.has_password || false,
      loading: false
    })
  } else {
    // 如果没有有效状态，清除store
    authStore.setState(EMPTY_AUTH_STATE)
  }
}

module.exports.updateAuthState = updateAuthState
module.exports.resetAuthState = resetAuthState
module.exports.initUser = initUser
