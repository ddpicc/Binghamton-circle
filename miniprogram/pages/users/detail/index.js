const authStore = require('../../../stores/authStore')
const messageStore = require('../../../stores/messageStore')
const { fetchUserPublicProfile } = require('../../../services/users')
const { showError } = require('../../../utils/toast')
const { ensureLogin } = require('../../../utils/auth')

Page({
  data: {
    userId: null,
    user: null,
    loading: true,
    hasUnread: false
  },

  onLoad(options) {
    authStore.initUser()

    const userId = parseInt(options.userId, 10)
    if (!userId || Number.isNaN(userId)) {
      wx.showToast({
        title: '无效的用户',
        icon: 'error'
      })
      setTimeout(() => wx.navigateBack(), 1000)
      return
    }

    this.userId = userId
    this.setData({ userId })

    this.unsubscribe = messageStore.subscribe(this.handleStoreUpdate.bind(this))

    this.loadUserProfile()
    messageStore.syncUnreadFlags()
  },

  onShow() {
    messageStore.syncUnreadFlags()
  },

  onUnload() {
    this.unsubscribe && this.unsubscribe()
  },

  async loadUserProfile() {
    this.setData({ loading: true })
    try {
      const response = await fetchUserPublicProfile(this.userId)
      this.setData({
        user: response.user || null,
        loading: false
      })
    } catch (error) {
      this.setData({ loading: false })
      if (!error?.toastShown) {
        showError(error?.message || '加载用户资料失败')
      }
    }
  },

  handleStoreUpdate(state) {
    const hasUnread = !!state.unreadFlags?.[this.userId]
    if (hasUnread !== this.data.hasUnread) {
      this.setData({ hasUnread })
    }
  },

  async handleSendMessage() {
    wx.vibrateShort({ type: 'light' })
    const allowed = await ensureLogin({
      title: '登录后可发送私信',
      content: '查看用户资料无需登录，发起私信时需要先登录。'
    })
    if (!allowed) return
    wx.navigateTo({
      url: `/pages/messages/thread/index?userId=${this.userId}`
    })
  }
})
