import noticeStore, { loadNotices, removeNotice, resetCurrentNotice } from '../../../stores/noticeStore'
import authStore from '../../../stores/authStore'
import { ensureLogin } from '../../../utils/auth'

Page({
  data: {
    safeTop: 20,
    list: [],
    loading: false,
    isAdmin: false
  },

  onLoad() {
    const sys = wx.getSystemInfoSync()
    this.setData({ safeTop: sys.statusBarHeight || 20 })

    this.unsubscribe = noticeStore.subscribe((state) => {
      const list = (state.list || []).slice(0, 8).map((item) => ({
        ...item,
        displayTime: this.formatNoticeTime(item.created_at)
      }))
      this.setData({
        list,
        loading: state.loading
      })
    })

    this.authUnsub = authStore.subscribe((state) => {
      const isAdmin = state.user && state.user.role === 'admin'
      this.setData({ isAdmin })
    })

    loadNotices({ page: 1, pageSize: 8, sort: 'newest' })
  },

  onUnload() {
    this.unsubscribe && this.unsubscribe()
    this.authUnsub && this.authUnsub()
    resetCurrentNotice()
  },

  handleBack() {
    wx.navigateBack({
      fail: () => wx.switchTab({ url: '/pages/home/index' })
    })
  },

  formatNoticeTime(value) {
    if (!value) return ''
    const date = new Date(value)
    if (Number.isNaN(date.getTime())) {
      return String(value)
    }
    const y = date.getFullYear()
    const m = String(date.getMonth() + 1).padStart(2, '0')
    const d = String(date.getDate()).padStart(2, '0')
    const hh = String(date.getHours()).padStart(2, '0')
    const mm = String(date.getMinutes()).padStart(2, '0')
    return `${y}.${m}.${d} ${hh}:${mm}`
  },

  handleOpen(e) {
    const { id } = e.currentTarget.dataset
    wx.navigateTo({ url: `/pages/notices/detail/index?id=${id}` })
  },

  async handleCreate() {
    const allowed = await ensureLogin({
      title: '登录后可发布通知',
      content: '浏览通知列表无需登录，发布通知时需要先登录。'
    })
    if (!allowed) return
    wx.navigateTo({ url: '/pages/notices/edit/index' })
  },

  handleDelete(e) {
    const { id } = e.currentTarget.dataset
    wx.showModal({
      title: '删除通知',
      content: '确认删除该通知？',
      success: async (res) => {
        if (res.confirm) {
          await removeNotice(id)
        }
      }
    })
  }
})
