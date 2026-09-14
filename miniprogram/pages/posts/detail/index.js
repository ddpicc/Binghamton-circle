import authStore from '../../../stores/authStore'
import { ensureLogin } from '../../../utils/auth'
import { fetchPostById } from '../../../services/posts'
import { showError } from '../../../utils/toast'
import { normalizePostImages } from '../../../utils/media'

Page({
  data: {
    postId: null,
    post: null,
    loading: true,
    error: null,
    title: '帖子详情',
    activeTab: 'posts'
  },

  onLoad(options) {
    authStore.initUser()

    const postId = parseInt(options.id, 10)
    if (!postId || Number.isNaN(postId)) {
      wx.showToast({
        title: '参数错误',
        icon: 'error'
      })
      setTimeout(() => wx.navigateBack(), 1200)
      return
    }

    this.setData({ postId })
    this.loadPost()
  },

  async onPullDownRefresh() {
    await this.loadPost()
    wx.stopPullDownRefresh()
  },

  async loadPost() {
    this.setData({ loading: true, error: null })
    try {
      const post = await fetchPostById(this.data.postId)
      const formattedPost = this.formatPost(post)
      this.setData({
        post: formattedPost,
        loading: false,
        title: formattedPost.title || '帖子详情'
      })
    } catch (error) {
      console.error('加载帖子详情失败:', error)
      const message = error?.response?.data?.error || error?.message || '加载失败'
      this.setData({ loading: false, error: message })
      if (!error?.toastShown) {
        showError(message)
      }
    }
  },

  formatPost(post) {
    if (!post) return null
    const createdAt = this.formatDate(post.created_at)
    const author = post.author || post.user || {}
    const profile = author.profile || {}
    const authorName = profile.nickname || author.nickname || author.username || '匿名用户'
    const authorAvatar = profile.avatar || author.avatar || ''
    const authorId = author.id || ''
    const authorInitial = authorName ? authorName.charAt(0).toUpperCase() : '匿'
    const circleName = post.circle?.name || post.circle_name || 'Binghamton Circle'
    const heroImage = normalizePostImages(post.images)[0] || ''

    return {
      ...post,
      createdAt,
      images: normalizePostImages(post.images),
      authorName,
      authorAvatar,
      authorId,
      authorInitial,
      circleName,
      heroImage
    }
  },

  formatDate(value) {
    if (!value) return ''
    const date = new Date(value)
    if (Number.isNaN(date.getTime())) return value
    const year = date.getFullYear()
    const month = `${date.getMonth() + 1}`.padStart(2, '0')
    const day = `${date.getDate()}`.padStart(2, '0')
    const hours = `${date.getHours()}`.padStart(2, '0')
    const minutes = `${date.getMinutes()}`.padStart(2, '0')
    return `${year}-${month}-${day} ${hours}:${minutes}`
  },

  handleRetry() {
    this.loadPost()
  },

  handleBack() {
    wx.navigateBack({
      fail: () => {
        wx.switchTab({
          url: '/pages/circles/following/index'
        })
      }
    })
  },

  handleShareTap() {
    wx.showToast({
      title: '分享功能开发中',
      icon: 'none'
    })
  },

  handleMoreTap() {
    wx.showToast({
      title: '更多功能开发中',
      icon: 'none'
    })
  },

  handleSwitchTab(e) {
    const { tab } = e.currentTarget.dataset
    if (!tab || tab === 'posts') {
      this.setData({ activeTab: 'posts' })
      return
    }
    wx.showToast({
      title: '该模块暂未开放',
      icon: 'none'
    })
  },

  handleViewCircle() {
    const { post } = this.data
    if (!post || !post.circle_id) return
    wx.navigateTo({
      url: `/pages/circles/detail/index?id=${post.circle_id}`
    })
  },

  handleViewAuthor() {
    const { post } = this.data
    if (!post || !post.authorId) return
    wx.navigateTo({
      url: `/pages/users/detail/index?userId=${post.authorId}`
    })
  },

  async handleQuickPublish() {
    const allowed = await ensureLogin({
      title: '登录后可发树洞',
      content: '浏览内容无需登录，发帖时需要先登录。'
    })
    if (!allowed) return
    wx.navigateTo({
      url: '/pages/treehole/publish/index'
    })
  }
})
