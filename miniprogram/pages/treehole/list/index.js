import treeHoleStore, {
  loadPosts,
  likePost,
  loadComments,
  addComment,
  removePost
} from '../../../stores/treeHoleStore'
import authStore from '../../../stores/authStore'
import { normalizePostImages } from '../../../utils/media'
import { ensureLogin } from '../../../utils/auth'

const PAGE_SIZE = 10

const FILTER_OPTIONS = [
  { id: 'latest', label: '最新' },
  { id: 'hot', label: '热门' }
]

const AVATAR_STYLES = [
  { moodClass: 'avatar-person', avatarIcon: '/assets/icons/person-filled.svg' },
  { moodClass: 'avatar-forest', avatarIcon: '/assets/icons/forest-primary.svg' },
  { moodClass: 'avatar-eco', avatarIcon: '/assets/icons/eco-tertiary.svg' }
]

const TREEHOLE_DISPLAY_NAMES = [
  '沉稳的猫头鹰',
  '淘气的松鼠',
  '安静的海狸',
  '机灵的小鹿',
  '散步的白熊',
  '晚风里的狐狸',
  '爱笑的考拉',
  '发呆的水獭',
  '松弛的企鹅',
  '清醒的云雀',
  '热心的河狸',
  '慢吞吞的刺猬',
  '轻快的羚羊',
  '晒太阳的橘猫',
  '抱书的棕熊',
  '听雨的梅花鹿'
]

const COMMENT_AVATARS = [
  { avatarClass: 'comment-avatar-mint', avatarText: '鹿' },
  { avatarClass: 'comment-avatar-sky', avatarText: '狐' },
  { avatarClass: 'comment-avatar-peach', avatarText: '熊' },
  { avatarClass: 'comment-avatar-sage', avatarText: '獭' },
  { avatarClass: 'comment-avatar-sand', avatarText: '鸟' },
  { avatarClass: 'comment-avatar-lilac', avatarText: '猫' }
]

const COMMENT_DISPLAY_NAMES = [
  '沉稳的猫头鹰',
  '淘气的松鼠',
  '安静的海狸',
  '机灵的小鹿',
  '散步的白熊',
  '晚风里的狐狸',
  '爱笑的考拉',
  '发呆的水獭',
  '松弛的企鹅',
  '清醒的云雀',
  '热心的河狸',
  '慢吞吞的刺猬',
  '轻快的羚羊',
  '晒太阳的橘猫',
  '抱书的棕熊',
  '听雨的梅花鹿'
]

function getCommentIdentity(postId, userId) {
  const seed = `${postId || 0}-${userId || 0}`
  let hash = 0
  for (let i = 0; i < seed.length; i += 1) {
    hash = (hash * 31 + seed.charCodeAt(i)) % 2147483647
  }
  return {
    ...COMMENT_AVATARS[hash % COMMENT_AVATARS.length],
    displayName: COMMENT_DISPLAY_NAMES[hash % COMMENT_DISPLAY_NAMES.length]
  }
}

function formatTime(dateString) {
  if (!dateString) return '刚刚'
  const date = new Date(dateString)
  if (Number.isNaN(date.getTime())) return '刚刚'
  const now = Date.now()
  const diff = now - date.getTime()
  const minute = 60 * 1000
  const hour = 60 * minute
  const day = 24 * hour
  if (diff < minute) return '刚刚'
  if (diff < hour) return `${Math.floor(diff / minute)}分钟前`
  if (diff < day) return `${Math.floor(diff / hour)}小时前`
  return `${Math.floor(diff / day)}天前`
}

Page({
  data: {
    safeTop: 20,
    topAvatar: '/assets/home/home-logo.jpg',
    filterOptions: FILTER_OPTIONS,
    activeFilter: 'latest',
    posts: [],
    displayPosts: [],
    loading: false,
    hasMore: true,
    commentPostId: null,
    commentContent: '',
    comments: {}
  },

  buildDisplayPost(post, index) {
    const style = AVATAR_STYLES[index % AVATAR_STYLES.length]
    const user = authStore.getState().user || {}
    const canDelete = Boolean(user.id) && (user.role === 'admin' || Number(post.user_id) === Number(user.id))
    return {
      ...post,
      ...style,
      displayName: TREEHOLE_DISPLAY_NAMES[index % TREEHOLE_DISPLAY_NAMES.length],
      createdText: formatTime(post.created_at),
      quote: index === 2,
      images: normalizePostImages(post.images),
      canDelete
    }
  },

  syncPosts() {
    const state = treeHoleStore.getState()
    const posts = (state.posts || []).map((post, index) => this.buildDisplayPost(post, index))
    this.setData({
      posts,
      loading: state.loading,
      hasMore: state.pagination.hasMore,
      comments: this.decorateComments(state.comments),
      commentPostId: this.data.commentPostId
    })
    this.updateDisplayPosts(posts, this.data.activeFilter)
  },

  onLoad() {
    authStore.initUser()
    const sys = wx.getSystemInfoSync()
    const user = authStore.getState().user || {}
    this.setData({
      safeTop: sys.statusBarHeight || 20,
      topAvatar: user.avatar || user.profile?.avatar || '/assets/home/home-logo.jpg'
    })

    this.unsubscribe = treeHoleStore.subscribe((state) => {
      this.syncPosts()
    })

    this.authUnsub = authStore.subscribe((state) => {
      this.setData({
        topAvatar: state.user?.avatar || state.user?.profile?.avatar || '/assets/home/home-logo.jpg'
      })
      this.syncPosts()
    })

    this.refreshFeed()
  },

  onUnload() {
    this.unsubscribe && this.unsubscribe()
    this.authUnsub && this.authUnsub()
  },

  async onPullDownRefresh() {
    await this.refreshFeed()
    wx.stopPullDownRefresh()
  },

  async onReachBottom() {
    await this.loadMore()
  },

  handleFilterTap(e) {
    const { filter } = e.currentTarget.dataset
    if (!filter || filter === this.data.activeFilter) return
    this.setData({ activeFilter: filter })
    this.updateDisplayPosts(this.data.posts, filter)
  },

  updateDisplayPosts(posts, filter) {
    const source = [...(posts || [])]
    let list = source
    if (filter === 'hot') {
      list = source.sort((a, b) => (b.like_count || 0) + (b.comment_count || 0) - (a.like_count || 0) - (a.comment_count || 0))
    }
    this.setData({ displayPosts: list })
  },

  decorateComments(comments = {}) {
    const next = {}
    Object.keys(comments || {}).forEach((key) => {
      const list = comments[key] || []
      next[key] = list.map((comment) => {
        const identity = getCommentIdentity(key, comment.user_id || comment.user?.id || comment.id)
        return {
          ...comment,
          ...identity,
          createdText: formatTime(comment.created_at)
        }
      })
    })
    return next
  },

  async refreshFeed() {
    await loadPosts({ page: 1, pageSize: PAGE_SIZE })
  },

  async loadMore() {
    if (!this.data.hasMore || this.data.loading) return
    const state = treeHoleStore.getState()
    await loadPosts({ page: state.pagination.page + 1, pageSize: state.pagination.pageSize })
  },

  async handleLike(e) {
    const { id } = e.currentTarget.dataset
    if (!id) return
    const allowed = await ensureLogin({
      title: '登录后可点赞',
      content: '浏览树洞内容无需登录，点赞时需要先登录。'
    })
    if (!allowed) return

    try {
      await likePost(id)
    } catch (error) {
      if (error && error.code === 'UNAUTHORIZED') {
        return
      }
      console.error('点赞树洞帖子失败:', error)
    }
  },

  async handleToggleComments(e) {
    const { id } = e.currentTarget.dataset
    if (!id) return
    const nextId = this.data.commentPostId === id ? null : id
    this.setData({ commentPostId: nextId, commentContent: '' })
    if (nextId && !this.data.comments[nextId]) await loadComments(nextId)
  },

  handleCommentInput(e) {
    this.setData({ commentContent: e.detail.value })
  },

  async handleSubmitComment() {
    const postId = this.data.commentPostId
    const content = (this.data.commentContent || '').trim()
    if (!postId || !content) return
    const allowed = await ensureLogin({
      title: '登录后可评论',
      content: '浏览树洞内容无需登录，评论时需要先登录。'
    })
    if (!allowed) return
    await addComment(postId, { content })
    this.setData({ commentContent: '' })
  },

  async handleNavigateToPublish() {
    const allowed = await ensureLogin({
      title: '登录后可发树洞',
      content: '浏览树洞内容无需登录，发帖时需要先登录。'
    })
    if (!allowed) return
    wx.navigateTo({ url: '/pages/treehole/publish/index' })
  },

  handleMoreTap(e) {
    const { id } = e.currentTarget.dataset
    const target = this.data.posts.find((item) => Number(item.id) === Number(id))
    if (!target || !target.canDelete) return

    wx.showActionSheet({
      itemList: ['删除帖子'],
      itemColor: '#d14343',
      success: (result) => {
        if (result.tapIndex === 0) {
          this.confirmDeletePost(target.id)
        }
      }
    })
  },

  confirmDeletePost(id) {
    wx.showModal({
      title: '确认删除',
      content: '删除后无法恢复，确定删除这条帖子吗？',
      confirmColor: '#d14343',
      success: async (result) => {
        if (!result.confirm) return
        try {
          await removePost(id)
          if (Number(this.data.commentPostId) === Number(id)) {
            this.setData({ commentPostId: null, commentContent: '' })
          }
        } catch (error) {
          console.error('删除树洞帖子失败:', error)
        }
      }
    })
  }
})
