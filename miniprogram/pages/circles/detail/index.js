import circleStore, {
  loadCircleDetail,
  loadCircleThreads,
  loadCircleMembers,
  joinCircleAction,
  quitCircleAction,
  createCirclePostAction,
  createCircleCommentAction,
  deleteCirclePostAction
} from '../../../stores/circleStore'
import authStore from '../../../stores/authStore'
import { normalizePostImages } from '../../../utils/media'

Page({
  data: {
    safeTop: 20,
    circleId: '',
    circle: null,
    loading: false,
    posts: [],
    postsLoading: false,
    activeTab: 'posts',
    isMember: false,
    isAdmin: false,
    showPostEditor: false,
    postTitle: '',
    postContent: '',
    commentPostId: null,
    commentContent: '',
    members: [],
    membersLoading: false,
    scrollTarget: '',
    highlightPostId: '',
    userRole: '',
    currentUser: null
  },

  onLoad(options) {
    const sys = wx.getSystemInfoSync()
    const { id, postId } = options
    this.postToHighlight = postId || ''
    this.setData({
      safeTop: sys.statusBarHeight || 20,
      circleId: id || ''
    })

    this.unsubscribe = circleStore.subscribe((state) => {
      const circle = state.detail.data
      const user = this.data.currentUser || authStore.getState().user || {}
      const userRole = circle && circle.user_role ? circle.user_role : circle && circle.creator_id === user.id ? 'creator' : ''
      const detail = circle
        ? {
            ...circle,
            formattedCreatedAt: this.formatDate(circle.created_at),
            onlineCount: Math.max(1, Math.floor(Number(circle.member_count || 0) * 0.03)),
            creatorName: circle?.creator?.username || '未知',
            rulesText: circle?.rules || '暂无规则说明',
            descriptionText: circle?.description || '这个圈子还没有简介',
            nameInitial: (circle?.name || '圈').slice(0, 1)
          }
        : null
      const posts = (state.threads.items || []).map((item, index) => {
        const author = item.author || item.user || {}
        const authorProfile = author.profile || {}
        const authorName = authorProfile.nickname || author.nickname || author.username || '匿名用户'
        return {
          ...item,
          authorName,
          authorId: author.id,
          authorAvatar: authorProfile.avatar || null,
          authorInitial: (authorName || '匿').charAt(0).toUpperCase(),
          createdAt: this.formatDate(item.created_at),
          images: normalizePostImages(item.images),
          isFeatured: index === 0,
          canDelete: this.canDeletePost(item, userRole, user)
        }
      })
      const members = (state.members.items || []).map((member) => {
        const user = member.user || {}
        const profile = user.profile || {}
        const name = profile.nickname || user.username || '成员'
        return {
          ...member,
          userId: user.id,
          displayName: name,
          avatarInitial: (name || '成').charAt(0).toUpperCase(),
          roleLabel: member.role === 'creator' ? '创建者' : member.role === 'admin' ? '管理员' : '成员'
        }
      })

      // 调试信息
      console.log('=== CircleStore状态更新 (成员) ===')
      console.log('原始members数据:', state.members.items)
      console.log('处理后的members数据:', members)
      console.log('membersLoading:', state.members.loading)
      console.log('membersError:', state.members.error)

      const isAdmin = userRole === 'creator' || userRole === 'admin' || user.role === 'admin'
      const isMember = !!(circle && circle.is_member)

      const nextData = {
        circle: detail,
        loading: state.detail.loading,
        posts,
        postsLoading: state.threads.loading,
        isMember,
        isAdmin,
        userRole,
        members,
        membersLoading: state.members.loading
      }

      if (this.postToHighlight && posts.length) {
        nextData.highlightPostId = this.postToHighlight
        nextData.scrollTarget = `post-${this.postToHighlight}`
        this.postToHighlight = ''
        setTimeout(() => {
          this.setData({ scrollTarget: '' })
        }, 800)
      }

      this.setData(nextData)
    })

    this.authUnsub = authStore.subscribe((state) => {
      this.setData({ currentUser: state.user })
    })

    if (this.data.circleId) {
      this.initialize()
    }
  },

  onUnload() {
    this.unsubscribe && this.unsubscribe()
    this.authUnsub && this.authUnsub()
  },

  async initialize() {
    this.setData({ members: [], highlightPostId: '', commentPostId: null })
    const circle = await loadCircleDetail(this.data.circleId)
    if (!circle) return
    await Promise.all([
      loadCircleThreads(this.data.circleId, { page: 1 })
    ])
    await this.fetchMembers()
  },

  async fetchMembers() {
    console.log('=== fetchMembers 开始调试 ===')
    console.log('circleId:', this.data.circleId)
    console.log('当前用户token:', authStore.getState().token ? '已登录' : '未登录')

    try {
      const result = await loadCircleMembers(this.data.circleId, { status: 'approved' })
      console.log('fetchMembers 结果:', result)
      console.log('store中的members状态:', circleStore.getState().members)
    } catch (error) {
      console.error('fetchMembers 错误:', error)
    }
  },

  async onPullDownRefresh() {
    await Promise.all([
      loadCircleDetail(this.data.circleId),
      loadCircleThreads(this.data.circleId, { page: 1 }),
      loadCircleMembers(this.data.circleId, { status: 'approved' })
    ])
    wx.stopPullDownRefresh()
  },

  formatDate(value) {
    if (!value) return ''
    const date = new Date(value)
    if (Number.isNaN(date.getTime())) return value
    const month = `${date.getMonth() + 1}`.padStart(2, '0')
    const day = `${date.getDate()}`.padStart(2, '0')
    const hours = `${date.getHours()}`.padStart(2, '0')
    const minutes = `${date.getMinutes()}`.padStart(2, '0')
    return `${month}-${day} ${hours}:${minutes}`
  },

  canDeletePost(post, circleRole, user = this.data.currentUser || {}) {
    if (!user?.id) return false
    if (user.role === 'admin') return true
    if (Number(post.user_id) === Number(user.id)) return true
    return circleRole === 'creator' || circleRole === 'admin'
  },

  handleTabChange(e) {
    const tab = e.currentTarget.dataset.tab
    this.setData({ activeTab: tab })
    if (tab === 'members' && !this.data.members.length) {
      this.fetchMembers()
    }
  },

  async handleJoin() {
    if (!this.data.circleId) return
    if (this.data.isMember) {
      await quitCircleAction(this.data.circleId)
    } else {
      await joinCircleAction(this.data.circleId)
    }
    await this.fetchMembers()
  },

  handleToggleEditor() {
    this.setData({ showPostEditor: !this.data.showPostEditor })
  },

  handleViewUser(e) {
    const { userId } = e.currentTarget.dataset
    if (!userId) return
    wx.navigateTo({
      url: `/pages/users/detail/index?userId=${userId}`
    })
  },

  handlePostTitleInput(e) {
    this.setData({ postTitle: e.detail.value })
  },

  handlePostContentInput(e) {
    this.setData({ postContent: e.detail.value })
  },

  async handlePublishPost() {
    if (!this.data.postContent.trim()) {
      wx.showToast({ title: '请输入内容', icon: 'none' })
      return
    }
    await createCirclePostAction(this.data.circleId, {
      title: this.data.postTitle.trim(),
      content: this.data.postContent.trim()
    })
    this.setData({ postTitle: '', postContent: '', showPostEditor: false })
  },

  handleCommentToggle(e) {
    const { postId } = e.currentTarget.dataset
    this.setData({
      commentPostId: this.data.commentPostId === postId ? null : postId,
      commentContent: ''
    })
  },

  handleCommentInput(e) {
    this.setData({ commentContent: e.detail.value })
  },

  async handleSubmitComment() {
    if (!this.data.commentContent.trim() || !this.data.commentPostId) {
      wx.showToast({ title: '请输入评论内容', icon: 'none' })
      return
    }
    await createCircleCommentAction(this.data.circleId, this.data.commentPostId, {
      content: this.data.commentContent.trim()
    })
    this.setData({ commentContent: '', commentPostId: null })
  },

  handleOpenManage() {
    if (!this.data.circleId) return
    wx.navigateTo({ url: `/pages/circles/manage/index?id=${this.data.circleId}` })
  },

  handleBack() {
    wx.navigateBack({
      fail: () => {
        wx.switchTab({ url: '/pages/circles/following/index' })
      }
    })
  },

  handleShareTap() {
    wx.showToast({ title: '分享功能开发中', icon: 'none' })
  },

  handleMoreTap(e) {
    const { postId } = e.currentTarget.dataset
    const post = (this.data.posts || []).find((item) => Number(item.id) === Number(postId))
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
          await deleteCirclePostAction(this.data.circleId, post.id)
        } catch (error) {
          console.error('删除圈子帖子失败:', error)
        }
      }
    })
  }
})
