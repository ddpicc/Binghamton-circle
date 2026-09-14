import { createStore } from '../utils/createStore'
import authStore from './authStore'
import {
  fetchProfileOverview,
  updateProfile,
  fetchMyPosts,
  fetchMyFavorites,
  updatePreferences
} from '../services/profile'
import { showSuccess } from '../utils/toast'

function normalizeProfile(payload) {
  if (!payload) return null
  const user = payload.user || payload
  if (!user) return null
  return {
    ...user,
    ...(user.profile || {}),
    profileDetails: user.profile || null
  }
}

const profileStore = createStore({
  profile: null,
  loading: false,
  posts: [],
  favorites: [],
  postsTotal: 0,
  favoritesTotal: 0,
  preferences: null
})

export default profileStore

export function resetProfileState() {
  profileStore.resetState()
}

async function ensureSessionReady() {
  const app = typeof getApp === 'function' ? getApp() : null
  if (!app || typeof app.ensureSession !== 'function') {
    return false
  }
  const currentPages = typeof getCurrentPages === 'function' ? getCurrentPages() : []
  const currentPage = currentPages[currentPages.length - 1]
  const currentRoute = currentPage?.route ? `/${currentPage.route}` : ''
  const state = authStore.getState()

  if (state.token && state.user) {
    return true
  }

  // 个人中心默认展示未登录态，不在页面加载时自动拉起登录。
  if (currentRoute === '/pages/profile/index/index') {
    return false
  }

  await app.ensureSession()
  const nextState = authStore.getState()
  return Boolean(nextState.token && nextState.user)
}

export async function loadProfile() {
  profileStore.setState({ loading: true })
  try {
    const ready = await ensureSessionReady()
    if (!ready) {
      profileStore.setState({
      profile: null,
      posts: [],
      favorites: [],
      postsTotal: 0,
      favoritesTotal: 0,
      preferences: null
    })
      return
    }
    const response = await fetchProfileOverview()
    profileStore.setState({
      profile: normalizeProfile(response),
      preferences: response.preferences || null
    })
  } finally {
    profileStore.setState({ loading: false })
  }
}

export async function saveProfile(payload) {
  const ready = await ensureSessionReady()
  if (!ready) {
    throw new Error('NOT_LOGGED_IN')
  }
  const response = await updateProfile(payload)
  showSuccess('资料已更新')
  profileStore.setState({ profile: normalizeProfile(response) })
}

export async function loadMyPosts(params = {}) {
  const ready = await ensureSessionReady()
  if (!ready) {
    profileStore.setState({ posts: [], postsTotal: 0 })
    return
  }
  const response = await fetchMyPosts(params)
  profileStore.setState({
    posts: response.items || response.posts || [],
    postsTotal: Number(response.total || 0)
  })
}

export async function loadMyFavorites(params = {}) {
  const ready = await ensureSessionReady()
  if (!ready) {
    profileStore.setState({ favorites: [], favoritesTotal: 0 })
    return
  }
  const response = await fetchMyFavorites(params)
  profileStore.setState({
    favorites: response.items || response.favorites || [],
    favoritesTotal: Number(response.total || 0)
  })
}

export async function savePreferences(payload) {
  const ready = await ensureSessionReady()
  if (!ready) {
    throw new Error('NOT_LOGGED_IN')
  }
  await updatePreferences(payload)
  showSuccess('设置已保存')
  profileStore.setState({ preferences: { ...profileStore.getState().preferences, ...payload } })
}
