import profileStore, {
  loadProfile,
  saveProfile,
  loadMyPosts,
  loadMyFavorites
} from '../../../stores/profileStore'
const authStore = require('../../../stores/authStore')

function computeInitial(profile) {
  if (!profile) return '我'
  const name = (profile.nickname || profile.username || '').trim()
  if (name && !isPlaceholderNickname(name)) {
    return name.charAt(0).toUpperCase()
  }
  return '我'
}

function isPlaceholderNickname(value = '') {
  const name = String(value || '').trim()
  if (!name) return true
  if (name === '微信用户') return true
  if (/^wx_[a-z0-9_]+$/i.test(name)) return true
  return false
}

function isPlaceholderAvatar(url = '') {
  const value = String(url || '').trim().toLowerCase()
  if (!value) return true
  if (value.includes('default') && value.includes('avatar')) return true
  if (value.includes('wx.qlogo.cn') && value.includes('/132')) return true
  if (value.includes('thirdwx.qlogo.cn') && value.includes('/132')) return true
  return false
}

Page({
  data: {
    safeTop: 20,
    profile: null,
    loading: false,
    posts: [],
    favorites: [],
    avatarInitial: '我',
    displayName: '未设置昵称',
    displayBio: 'Binghamton 同学，欢迎完善资料。',
    displayAvatar: '',
    isAdmin: false,
    showEditor: false,
    postCount: 0,
    activityCount: 0,
    followingCount: 0,
    fansCountText: '0',
    agreedProtocol: false
  },

  onLoad() {
    const sys = wx.getSystemInfoSync()
    const authState = authStore.getState()
    this.setData({
      safeTop: sys.statusBarHeight || 20,
      isAdmin: !!(authState.user && authState.user.role === 'admin')
    })

    this.unsubscribe = profileStore.subscribe((state) => {
      const avatarInitial = computeInitial(state.profile)
      const profile = state.profile || null
      const postCount = Number(state.postsTotal || 0)
      const activityCount = Number(profile?.activity_count || profile?.activityCount || 0)
      const followingCount = Number(profile?.following_count || profile?.followingCount || 0)
      const fansCount = Number(profile?.followers_count || profile?.follower_count || profile?.fans_count || 0)
      const hasValidNickname = Boolean(profile && !isPlaceholderNickname(profile.nickname))
      const hasValidAvatar = Boolean(profile && !isPlaceholderAvatar(profile.avatar))
      const displayName = hasValidNickname
        ? (profile.nickname || profile.username || '未设置昵称')
        : '请授权昵称'
      const displayBio = profile?.bio || 'Binghamton 同学，欢迎完善资料。'
      const displayAvatar = hasValidAvatar ? profile?.avatar : ''

      this.setData({
        profile,
        loading: state.loading,
        posts: state.posts,
        favorites: state.favorites,
        avatarInitial,
        postCount,
        activityCount,
        followingCount,
        fansCountText: this.formatCount(fansCount),
        displayName,
        displayBio,
        displayAvatar
      })
    })

    this.authUnsub = authStore.subscribe((state) => {
      const isAdmin = !!(state.user && state.user.role === 'admin')
      if (state.token && state.user) {
        this.setData({ isAdmin })
        loadProfile()
        loadMyPosts()
        loadMyFavorites()
        return
      }

      this.setData({
        isAdmin: false,
        profile: null,
        posts: [],
        favorites: [],
        postCount: 0,
        loading: false
      })
    })

    loadProfile()
    loadMyPosts()
    loadMyFavorites()
  },

  onShow() {
    loadProfile()
    loadMyPosts()
    loadMyFavorites()
  },

  onUnload() {
    this.unsubscribe && this.unsubscribe()
    this.authUnsub && this.authUnsub()
  },

  formatCount(value) {
    if (!value || value < 1000) return `${value || 0}`
    const formatted = (value / 1000).toFixed(1)
    return `${formatted.replace(/\.0$/, '')}k`
  },

  handleToggleEdit() {
    wx.navigateTo({ url: '/pages/profile/edit/index' })
  },

  handleInput(e) {
    const { field } = e.currentTarget.dataset
    const value = e.detail.value
    const profile = Object.assign({}, this.data.profile || {})
    profile[field] = value
    this.setData({
      profile,
      avatarInitial: computeInitial(profile)
    })
  },

  async handleSave() {
    if (!this.data.profile) return
    await saveProfile({
      nickname: this.data.profile.nickname,
      phone: this.data.profile.phone,
      bio: this.data.profile.bio,
      school: this.data.profile.school,
      major: this.data.profile.major,
      grade: this.data.profile.grade
    })
  },


  handleMenuTap(e) {
    const { action } = e.currentTarget.dataset
    if (action === 'myposts') {
      wx.navigateTo({ url: '/pages/profile/posts/index' })
      return
    }
    if (action === 'favorites') {
      wx.navigateTo({ url: '/pages/profile/favorites/index' })
      return
    }
    if (action === 'settings') {
      wx.navigateTo({ url: '/pages/profile/edit/index' })
      return
    }
    if (action === 'adminBanner') {
      wx.navigateTo({ url: '/pages/profile/admin-banner/index' })
      return
    }
    if (action === 'adminEmails') {
      wx.navigateTo({ url: '/pages/profile/admin-emails/index' })
    }
  },

  async handleReLogin() {
    if (!this.data.agreedProtocol) {
      wx.showToast({ title: '请先阅读并同意协议', icon: 'none' })
      return
    }
    await getApp().ensureSession(true)
    await loadProfile()
  },

  async handleWechatQuickLogin() {
    if (!this.data.agreedProtocol) {
      wx.showToast({ title: '请先阅读并同意协议', icon: 'none' })
      return
    }
    try {
      const session = await getApp().loginWithWechat()
      if (session?.needEmailBind) {
        wx.showToast({
          title: session.message || '当前微信未绑定邮箱账号，请先使用邮箱验证码注册/登录，再在账号内绑定微信。',
          icon: 'none'
        })
        return
      }

      wx.showToast({ title: '微信登录成功', icon: 'success' })
      await loadProfile()
      await loadMyPosts()
      await loadMyFavorites()
    } catch (error) {
      console.error('微信快捷登录失败', error)
      wx.showToast({ title: error?.message || '微信登录失败', icon: 'none' })
    }
  },

  handleToggleAgreement() {
    this.setData({ agreedProtocol: !this.data.agreedProtocol })
  },

  handleOpenAgreement() {
    wx.showToast({ title: '服务协议建设中', icon: 'none' })
  },

  handleOpenPrivacy() {
    wx.showToast({ title: '隐私政策建设中', icon: 'none' })
  }
})
