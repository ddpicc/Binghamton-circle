import profileStore, { loadMyFavorites } from '../../../stores/profileStore'

const TYPE_META = {
  treehole: { label: '树洞', badgeClass: 'badge-treehole' },
  o2o: { label: '二手', badgeClass: 'badge-o2o' },
  notice: { label: '通知', badgeClass: 'badge-notice' },
  circle_post: { label: '圈子帖子', badgeClass: 'badge-circle' },
  post: { label: '帖子', badgeClass: 'badge-post' }
}

Page({
  data: {
    safeTop: 20,
    loading: true,
    items: [],
    total: 0
  },

  onLoad() {
    const sys = wx.getSystemInfoSync()
    this.setData({ safeTop: sys.statusBarHeight || 20 })
    this.unsubscribe = profileStore.subscribe((state) => {
      this.setData({
        items: (state.favorites || []).map((item) => this.decorateItem(item)),
        total: Number(state.favoritesTotal || 0)
      })
    })
    this.hasLoaded = true
    this.didFirstShow = false
    this.refresh()
  },

  onShow() {
    if (!this.hasLoaded) return
    if (!this.didFirstShow) {
      this.didFirstShow = true
      return
    }
    this.refresh()
  },

  onUnload() {
    this.unsubscribe && this.unsubscribe()
  },

  async onPullDownRefresh() {
    await this.refresh()
    wx.stopPullDownRefresh()
  },

  async refresh() {
    this.setData({ loading: true })
    try {
      await loadMyFavorites({ page: 1, limit: 30 })
    } finally {
      this.setData({ loading: false })
    }
  },

  decorateItem(item) {
    const meta = TYPE_META[item.type] || TYPE_META.post
    return {
      ...item,
      typeLabel: meta.label,
      badgeClass: meta.badgeClass,
      likedText: this.formatDate(item.liked_at),
      summaryText: this.buildSummary(item.summary)
    }
  },

  buildSummary(value = '') {
    const text = String(value || '').replace(/\s+/g, ' ').trim()
    if (!text) return '暂无内容摘要'
    if (text.length <= 72) return text
    return `${text.slice(0, 72)}...`
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

  handleBack() {
    wx.navigateBack({
      fail: () => {
        wx.switchTab({ url: '/pages/profile/index/index' })
      }
    })
  },

  handleItemTap(e) {
    const { route } = e.currentTarget.dataset
    if (!route) return
    wx.navigateTo({ url: route })
  }
})
