import noticeStore, { loadNoticeDetail, removeNotice } from '../../../stores/noticeStore'
import authStore from '../../../stores/authStore'
import { ensureLogin } from '../../../utils/auth'

Page({
  data: {
    notice: null,
    isAdmin: false
  },

  async onLoad(options) {
    const { id } = options
    this.noticeUnsub = noticeStore.subscribe((state) => {
      this.setData({ notice: state.currentNotice || this.data.notice })
    })
    this.authUnsub = authStore.subscribe((state) => {
      const isAdmin = state.user && state.user.role === 'admin'
      this.setData({ isAdmin })
    })

    if (id) {
      const detail = await loadNoticeDetail(id)
      this.setData({ notice: detail })
    }
  },

  onUnload() {
    this.noticeUnsub && this.noticeUnsub()
    this.authUnsub && this.authUnsub()
  },

  handleBack() {
    wx.navigateBack()
  },

  async handleEdit() {
    const notice = this.data.notice
    const id = notice ? notice.id : null
    if (!id) return
    const allowed = await ensureLogin({
      title: '登录后可编辑通知',
      content: '浏览通知详情无需登录，编辑通知时需要先登录。'
    })
    if (!allowed) return
    wx.navigateTo({ url: `/pages/notices/edit/index?id=${id}` })
  },

  handleDelete() {
    const notice = this.data.notice
    const id = notice ? notice.id : null
    if (!id) return
    wx.showModal({
      title: '删除通知',
      content: '确认删除该通知？',
      success: async (res) => {
        if (res.confirm) {
          await removeNotice(id)
          wx.showToast({ title: '已删除', icon: 'success' })
          wx.navigateBack()
        }
      }
    })
  }
})
