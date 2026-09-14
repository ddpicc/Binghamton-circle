import { fetchPostById, fetchComments } from '../../../services/treehole'
import { normalizePostImages } from '../../../utils/media'
import { showError } from '../../../utils/toast'

function formatRelativeTime(value) {
  if (!value) return '刚刚'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '刚刚'
  const diff = Date.now() - date.getTime()
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
    postId: null,
    post: null,
    comments: [],
    loading: true,
    error: ''
  },

  onLoad(options) {
    const sys = wx.getSystemInfoSync()
    const postId = parseInt(options.id, 10)
    this.setData({
      safeTop: sys.statusBarHeight || 20,
      postId: Number.isNaN(postId) ? null : postId
    })
    this.loadData()
  },

  async onPullDownRefresh() {
    await this.loadData()
    wx.stopPullDownRefresh()
  },

  async loadData() {
    if (!this.data.postId) {
      this.setData({ loading: false, error: '参数错误' })
      return
    }
    this.setData({ loading: true, error: '' })
    try {
      const [post, comments] = await Promise.all([
        fetchPostById(this.data.postId),
        fetchComments(this.data.postId)
      ])
      const commentList = comments?.comments || comments || []
      this.setData({
        post: this.decoratePost(post),
        comments: commentList.map((item, index) => this.decorateComment(item, index)),
        loading: false
      })
    } catch (error) {
      console.error('加载树洞详情失败:', error)
      const message = error?.response?.data?.error || error?.message || '加载失败'
      this.setData({ loading: false, error: message })
      if (!error?.toastShown) {
        showError(message)
      }
    }
  },

  decoratePost(post) {
    return {
      ...post,
      content: post.content || '',
      images: normalizePostImages(post.images),
      createdText: formatRelativeTime(post.created_at)
    }
  },

  decorateComment(comment, index) {
    const initials = ['鹿', '狐', '熊', '獭', '鸟', '猫']
    const classes = [
      'comment-avatar-mint',
      'comment-avatar-sky',
      'comment-avatar-peach',
      'comment-avatar-sage',
      'comment-avatar-sand',
      'comment-avatar-lilac'
    ]
    return {
      ...comment,
      displayName: '匿名同学',
      createdText: formatRelativeTime(comment.created_at),
      avatarText: initials[index % initials.length],
      avatarClass: classes[index % classes.length]
    }
  },

  handleBack() {
    wx.navigateBack({
      fail: () => {
        wx.switchTab({ url: '/pages/treehole/list/index' })
      }
    })
  },

  handleRetry() {
    this.loadData()
  }
})
