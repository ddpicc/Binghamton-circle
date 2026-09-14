const messageStore = require('../../../stores/messageStore')
const authStore = require('../../../stores/authStore')
const { ensureLogin } = require('../../../utils/auth')

Page({
  data: {
    userId: null,
    currentUserId: null,
    conversation: null,
    messages: [],
    loading: true,
    hasMore: false,
    sending: false,
    inputValue: '',
    scrollIntoView: '',
    targetUser: null,
    error: null,
    title: '私信'
  },

  async onLoad(options) {
    authStore.initUser()

    const userId = parseInt(options.userId, 10)
    if (!userId || Number.isNaN(userId)) {
      wx.showToast({
        title: '无效的用户',
        icon: 'error'
      })
      setTimeout(() => {
        wx.navigateBack()
      }, 1200)
      return
    }

    const allowed = await ensureLogin({
      title: '登录后可发送私信',
      content: '浏览公开内容无需登录，私信沟通时需要先登录。'
    })
    if (!allowed) {
      wx.navigateBack({
        fail: () => wx.switchTab({ url: '/pages/home/index' })
      })
      return
    }

    this.userId = userId
    const currentUser = authStore.getState().user
    this.setData({
      userId,
      currentUserId: currentUser?.id || null
    })

    this.unsubscribe = messageStore.subscribe(this.handleStoreUpdate.bind(this))
    this.initConversation()
  },

  async initConversation() {
    try {
      this.setData({ loading: true })
      await messageStore.loadConversation(this.userId)
      await messageStore.markAsRead(this.userId)
    } catch (error) {
      this.setData({ error: error?.message || '加载失败' })
    } finally {
      this.setData({ loading: false })
    }
  },

  onShow() {
    if (this.userId) {
      messageStore.markAsRead(this.userId)
    }
  },

  onUnload() {
    this.unsubscribe && this.unsubscribe()
  },

  handleStoreUpdate(state) {
    const thread = state.threads[this.userId] || {}
    const messages = thread.messages || []
    const conversation = thread.conversation || this.data.conversation
    const targetUser = (conversation && conversation.targetUser) || this.data.targetUser
    const displayTitle = targetUser
      ? (targetUser.nickname || targetUser.username || '私信')
      : '私信'

    const nextData = {
      conversation,
      targetUser,
      messages,
      hasMore: thread.hasMore || false,
      sending: state.sending || false,
      error: thread.error ? (thread.error.message || '加载失败') : null,
      title: displayTitle
    }

    if (messages.length) {
      const lastMessage = messages[messages.length - 1]
      nextData.scrollIntoView = `message-${lastMessage.id}`
    }

    this.setData(nextData)
  },

  async handleLoadMore() {
    const state = messageStore.getState()
    const thread = state.threads[this.userId] || {}
    if (!thread.hasMore || thread.loading) return
    const beforeId = thread.pagination?.nextBeforeId
    if (!beforeId) return
    await messageStore.loadConversation(this.userId, { beforeId })
  },

  handleInput(e) {
    this.setData({ inputValue: e.detail.value })
  },

  async handleSend() {
    if (!this.data.inputValue.trim()) {
      wx.showToast({
        title: '请输入内容',
        icon: 'none'
      })
      return
    }

    try {
      const message = await messageStore.sendMessage(this.userId, this.data.inputValue)
      if (message) {
        this.setData({
          inputValue: '',
          scrollIntoView: `message-${message.id}`
        })
        await messageStore.markAsRead(this.userId)
      }
    } catch (error) {
      // 错误已在 store 内部提示
    }
  },

  handleRetry() {
    this.initConversation()
  }
})
