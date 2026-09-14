const authStore = require('../../../stores/authStore')
const {
  fetchAllowedLoginEmails,
  createAllowedLoginEmail,
  deleteAllowedLoginEmail
} = require('../../../services/admin')

Page({
  data: {
    list: [],
    email: '',
    note: '',
    loading: true,
    saving: false
  },

  async onLoad() {
    const user = authStore.getState().user
    if (!user || user.role !== 'admin') {
      wx.showToast({ title: '无权限访问', icon: 'none' })
      setTimeout(() => wx.navigateBack(), 800)
      return
    }

    await this.loadList()
  },

  async loadList() {
    this.setData({ loading: true })
    try {
      const response = await fetchAllowedLoginEmails()
      this.setData({
        list: response.items || [],
        loading: false
      })
    } catch (error) {
      console.error('加载白名单邮箱失败:', error)
      this.setData({ loading: false })
      wx.showToast({ title: '加载失败', icon: 'none' })
    }
  },

  handleEmailInput(e) {
    this.setData({ email: String(e.detail.value || '').trim().toLowerCase() })
  },

  handleNoteInput(e) {
    this.setData({ note: String(e.detail.value || '') })
  },

  async handleAdd() {
    if (!this.data.email) {
      wx.showToast({ title: '请输入邮箱', icon: 'none' })
      return
    }

    this.setData({ saving: true })
    try {
      await createAllowedLoginEmail({
        email: this.data.email,
        note: this.data.note.trim()
      })
      this.setData({
        email: '',
        note: ''
      })
      wx.showToast({ title: '已保存', icon: 'success' })
      await this.loadList()
    } catch (error) {
      console.error('保存白名单邮箱失败:', error)
      wx.showToast({ title: error?.message || '保存失败', icon: 'none' })
    } finally {
      this.setData({ saving: false })
    }
  },

  handleDelete(e) {
    const { id, email } = e.currentTarget.dataset
    wx.showModal({
      title: '删除白名单邮箱',
      content: `确认移除 ${email} 吗？`,
      confirmColor: '#d14343',
      success: async (result) => {
        if (!result.confirm) return
        try {
          await deleteAllowedLoginEmail(id)
          wx.showToast({ title: '已删除', icon: 'success' })
          await this.loadList()
        } catch (error) {
          console.error('删除白名单邮箱失败:', error)
          wx.showToast({ title: error?.message || '删除失败', icon: 'none' })
        }
      }
    })
  }
})
