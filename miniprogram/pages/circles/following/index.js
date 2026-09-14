import circleStore, { loadFollowingFeed, loadOverviewData, deleteCirclePostAction } from '../../../stores/circleStore'
import authStore from '../../../stores/authStore'
import { ensureLogin } from '../../../utils/auth'

Page({
  data: {
    safeTop: 20,
    topAvatar: '/assets/home/home-logo.jpg',
    activeSegment: 'follow',
    storyCircles: [],
    feedPosts: [],
    displayPosts: [],
    loading: false,
    hasMore: true,
    isLoggedIn: !!authStore.getState().token
  },

  getCircleRoleMap(overview = {}) {
    return (overview.myCircles || []).reduce((acc, circle) => {
      if (circle?.id) acc[circle.id] = circle.user_role || ''
      return acc
    }, {})
  },

  canDeletePost(post, circleRoleMap = {}) {
    const user = authStore.getState().user || {}
    if (!user.id) return false
    if (user.role === 'admin') return true
    if (Number(post.user_id) === Number(user.id)) return true
    const role = circleRoleMap[post.circle_id]
    return role === 'creator' || role === 'admin'
  },

  syncFeed() {
    const state = circleStore.getState()
    const rawPosts = state.following.items || []
    const overview = state.overview || {}
    const circleRoleMap = this.getCircleRoleMap(overview)
    const feedPosts = rawPosts.map((post, index) => {
      const author = post.author || post.user || {}
      const profile = author.profile || {}
      const content = (post.content || post.body || post.title || '今天也有很多值得记录的小事。').trim()
      const image = (post.images && post.images[0]) || ''
      return {
        ...post,
        displayName: profile.nickname || author.nickname || author.username || `圈友${index + 1}`,
        displayTime: this.formatRelativeTime(post.created_at),
        displayContent: content.length > 110 ? `${content.slice(0, 110)}...` : content,
        circleName: post.circle?.name || '圈子',
        likeCount: Number(post.like_count || post.likes_count || 0),
        commentCount: Number(post.comment_count || post.comments_count || 0),
        liked: Boolean(post.is_liked || post.liked || false),
        image,
        avatar: profile.avatar || author.avatar || '',
        canDelete: this.canDeletePost(post, circleRoleMap)
      }
    })

    const circles = [...(overview.myCircles || [])]
    const uniqueById = []
    const seen = new Set()
    circles.forEach((circle, index) => {
      if (!circle?.id || seen.has(circle.id)) return
      seen.add(circle.id)
      uniqueById.push({
        id: circle.id,
        name: (circle.name || `圈子${index + 1}`).slice(0, 4),
        cover: circle.cover_image || ''
      })
    })

    this.setData({
      feedPosts,
      storyCircles: uniqueById.slice(0, 8),
      loading: state.following.loading,
      hasMore: state.following.pagination.hasMore
    })
    this.updateDisplayPosts(feedPosts, this.data.activeSegment)
  },

  onLoad() {
    const sys = wx.getSystemInfoSync()
    const authState = authStore.getState()
    const topAvatar = authState.user?.avatar || authState.user?.profile?.avatar || '/assets/home/home-logo.jpg'
    this.setData({
      safeTop: sys.statusBarHeight || 20,
      topAvatar
    })

    this.unsubscribe = circleStore.subscribe((state) => {
      this.syncFeed()
    })

    this.authUnsub = authStore.subscribe((state) => {
      const loggedIn = !!state.token
      const topAvatar = state.user?.avatar || state.user?.profile?.avatar || '/assets/home/home-logo.jpg'
      if (loggedIn !== this.data.isLoggedIn || topAvatar !== this.data.topAvatar) {
        this.setData({
          isLoggedIn: loggedIn,
          topAvatar
        })
      }
      this.syncFeed()
      if (loggedIn && !this.data.feedPosts.length) this.initPage()
    })

    this.initPage()
  },

  onUnload() {
    this.unsubscribe && this.unsubscribe()
    this.authUnsub && this.authUnsub()
  },

  async initPage() {
    const state = authStore.getState()
    try {
      if (state.token) {
        await Promise.allSettled([
          loadOverviewData(),
          loadFollowingFeed({ page: 1 })
        ])
      } else {
        await loadOverviewData()
      }
    } catch (error) {
      console.error('init following page failed', error)
    }
  },

  async onPullDownRefresh() {
    try {
      await Promise.allSettled([
        loadOverviewData(),
        loadFollowingFeed({ page: 1 })
      ])
      wx.showToast({ title: '刷新成功', icon: 'success' })
    } catch (error) {
      wx.showToast({ title: '刷新失败', icon: 'none' })
    } finally {
      wx.stopPullDownRefresh()
    }
  },

  onReachBottom() {
    if (!this.data.hasMore || this.data.loading) return
    const state = circleStore.getState()
    loadFollowingFeed({
      page: state.following.pagination.page + 1,
      pageSize: state.following.pagination.pageSize,
      circleId: state.following.filters.circleId,
      sortBy: state.following.filters.sortBy,
      sortOrder: state.following.filters.sortOrder
    })
  },

  handleSegmentChange(e) {
    const { segment } = e.currentTarget.dataset
    if (!segment || segment === this.data.activeSegment) return
    this.setData({ activeSegment: segment })
    this.updateDisplayPosts(this.data.feedPosts, segment)
  },

  handleViewCircle(e) {
    const { circleId } = e.currentTarget.dataset
    if (!circleId) return
    wx.navigateTo({ url: `/pages/circles/detail/index?id=${circleId}` })
  },

  handleCreateCircle() {
    wx.navigateTo({ url: '/pages/circles/list/index' })
  },

  handleViewPost(e) {
    const { postId } = e.currentTarget.dataset
    if (!postId) return
    wx.navigateTo({ url: `/pages/posts/detail/index?id=${postId}` })
  },

  handleMoreTap(e) {
    const { postId } = e.currentTarget.dataset
    const post = this.data.feedPosts.find((item) => Number(item.id) === Number(postId))
    if (!post || !post.canDelete) return

    wx.showActionSheet({
      itemList: ['删除帖子'],
      itemColor: '#d14343',
      success: (result) => {
        if (result.tapIndex === 0) {
          this.confirmDeletePost(post)
        }
      }
    })
  },

  confirmDeletePost(post) {
    wx.showModal({
      title: '确认删除',
      content: '删除后无法恢复，确定删除这条帖子吗？',
      confirmColor: '#d14343',
      success: async (result) => {
        if (!result.confirm) return
        try {
          await deleteCirclePostAction(post.circle_id, post.id)
        } catch (error) {
          console.error('删除圈子帖子失败:', error)
        }
      }
    })
  },

  handleGoToActivities() {
    wx.navigateTo({ url: '/pages/activities/index' })
  },

  handleGoToCircles() {
    wx.navigateTo({ url: '/pages/circles/list/index' })
  },

  async handleGoToLogin() {
    await ensureLogin({
      title: '登录后查看圈子动态',
      content: '浏览基础页面无需登录，查看关注圈子的动态时需要先登录。'
    })
  },

  handleQuickPublish() {
    wx.navigateTo({ url: '/pages/circles/list/index' })
  },

  updateDisplayPosts(posts, segment) {
    const source = [...(posts || [])]
    const list = segment === 'hot'
      ? source.sort((a, b) => (b.likeCount + b.commentCount) - (a.likeCount + a.commentCount))
      : source

    this.setData({ displayPosts: list })
  },

  formatRelativeTime(value) {
    if (!value) return '刚刚'
    const date = new Date(value)
    if (Number.isNaN(date.getTime())) return '刚刚'
    const diff = Date.now() - date.getTime()
    const minute = 60 * 1000
    const hour = 60 * minute
    if (diff < hour) return `${Math.max(1, Math.floor(diff / minute))}分钟前`
    if (diff < 24 * hour) return `${Math.floor(diff / hour)}小时前`
    return '昨天'
  }
})
