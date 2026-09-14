const authStore = require('../../stores/authStore')
const BLOCKED_ROUTES = new Set([
  '/pages/auth/email-verify/index',
  '/pages/profile/onboarding/index'
])

function isPlaceholderNickname(value = '') {
  const nickname = String(value || '').trim()
  if (!nickname) return true
  if (nickname === '微信用户') return true
  if (/^wx_[a-z0-9_]+$/i.test(nickname)) return true
  return false
}

function normalizeUserProfile(user = {}) {
  const profile = user.profile || {}
  return {
    nickname: profile.nickname || user.nickname || user.username || '',
    avatar: profile.avatar || user.avatar || ''
  }
}

function computeInitial(nickname = '') {
  const name = String(nickname || '').trim()
  if (!name || isPlaceholderNickname(name)) return '我'
  return name.charAt(0).toUpperCase()
}

Component({
  data: {
    visible: false,
    submitting: false,
    wechatAvatar: '',
    wechatNickname: '',
    avatarInitial: '我'
  },

  lifetimes: {
    attached() {
      this.unsubscribe = authStore.subscribe((state) => {
        this.syncByAuthState(state)
      })
    },
    detached() {
      if (this.unsubscribe) {
        this.unsubscribe()
      }
    }
  },

  pageLifetimes: {
    show() {
      this.tryRefreshProfileForAccuracy()
    }
  },

  methods: {
    noop() {},

    async tryRefreshProfileForAccuracy() {
      const app = typeof getApp === 'function' ? getApp() : null
      if (!app || typeof app.refreshProfile !== 'function') {
        return
      }
      const state = authStore.getState()
      if (!state || !state.token) {
        return
      }
      try {
        await app.refreshProfile()
      } catch (error) {
        // 静默失败，继续使用本地状态
      }
    },

    syncByAuthState(state = {}) {
      const token = state.token || ''
      const user = state.user || null
      const app = typeof getApp === 'function' ? getApp() : null
      const currentPages = typeof getCurrentPages === 'function' ? getCurrentPages() : []
      const currentPage = currentPages[currentPages.length - 1]
      const currentRoute = currentPage?.route ? `/${currentPage.route}` : ''

      if (!token || !user) {
        if (this.data.visible) {
          this.setData({ visible: false })
        }
        return
      }

      const profile = normalizeUserProfile(user)
      const nickname = String(profile.nickname || '').trim()
      const avatar = String(profile.avatar || '').trim()
      const nicknameValid = !isPlaceholderNickname(nickname)
      const avatarValid = Boolean(avatar)
      const shouldShow = !nicknameValid || !avatarValid

      if (BLOCKED_ROUTES.has(currentRoute)) {
        if (this.data.visible) {
          this.setData({ visible: false })
        }
        return
      }

      if (app && app.globalData && app.globalData.needsProfileCompletion === false) {
        if (this.data.visible) {
          this.setData({ visible: false })
        }
        return
      }

      if (!shouldShow) {
        if (this.data.visible) {
          this.setData({
            visible: false,
            submitting: false,
            wechatAvatar: '',
            wechatNickname: ''
          })
        }
        return
      }

      this.setData({
        visible: true,
        avatarInitial: computeInitial(nickname),
        wechatAvatar: this.data.wechatAvatar || avatar,
        wechatNickname: this.data.wechatNickname || (nicknameValid ? nickname : '')
      })
    },

    handleMaskTap() {
      wx.showToast({
        title: '请先完善头像和昵称',
        icon: 'none'
      })
    },

    handleChooseAvatar(e) {
      const avatarUrl = e.detail?.avatarUrl || ''
      if (!avatarUrl) return
      this.setData({ wechatAvatar: avatarUrl })
    },

    handleNicknameInput(e) {
      this.setData({
        wechatNickname: String(e.detail?.value || '')
      })
    },

    async handleSubmit() {
      if (this.data.submitting) return
      const nickname = String(this.data.wechatNickname || '').trim()
      const avatar = String(this.data.wechatAvatar || '').trim()

      if (!avatar || !nickname || isPlaceholderNickname(nickname)) {
        wx.showToast({
          title: '请先选择头像并填写昵称',
          icon: 'none'
        })
        return
      }

      this.setData({ submitting: true })
      try {
        const { put } = require('../../utils/request')
        await put('/users/profile', { nickname, avatar })

        const app = typeof getApp === 'function' ? getApp() : null
        if (app && typeof app.refreshProfile === 'function') {
          await app.refreshProfile()
        }

        if (app && app.globalData) {
          app.globalData.needsProfileCompletion = false
        }

        wx.showToast({
          title: '保存成功',
          icon: 'success'
        })
      } catch (error) {
        console.error('保存微信资料失败:', error)
        wx.showToast({
          title: '保存失败，请重试',
          icon: 'none'
        })
      } finally {
        this.setData({ submitting: false })
      }
    }
  }
})
