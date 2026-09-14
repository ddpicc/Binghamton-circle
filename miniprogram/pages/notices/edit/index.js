import noticeStore, { loadNoticeDetail, saveNotice, resetCurrentNotice } from '../../../stores/noticeStore'

Page({
  data: {
    id: null,
    form: {
      title: '',
      category: 'academic',
      content: '',
      is_pinned: false
    },
    categories: ['academic', 'activity', 'urgent', 'other'],
    categoryIndex: 0,
    saving: false
  },

  async onLoad(options) {
    const { id } = options
    if (id) {
      this.setData({ id })
      const detail = await loadNoticeDetail(id)
      this.setData({
        form: {
          title: detail.title,
          category: detail.category || 'academic',
          content: detail.content,
          is_pinned: !!detail.is_pinned
        },
        categoryIndex: this.data.categories.indexOf(detail.category || 'academic')
      })
    }
  },

  onUnload() {
    resetCurrentNotice()
  },

  handleTitleChange(e) {
    this.setData({ 'form.title': e.detail.value })
  },

  handleContentChange(e) {
    this.setData({ 'form.content': e.detail.value })
  },

  handleCategoryChange(e) {
    const index = Number(e.detail.value)
    this.setData({ categoryIndex: index, 'form.category': this.data.categories[index] })
  },

  handlePinnedChange(e) {
    this.setData({ 'form.is_pinned': e.detail.value })
  },

  async handleSubmit() {
    if (!this.data.form.title || !this.data.form.content) {
      wx.showToast({ title: '请填写完整内容', icon: 'none' })
      return
    }
    this.setData({ saving: true })
    try {
      const payload = { ...this.data.form }
      if (this.data.id) {
        payload.id = Number(this.data.id)
      }
      await saveNotice(payload)
      wx.showToast({ title: '已保存', icon: 'success' })
      wx.navigateBack()
    } finally {
      this.setData({ saving: false })
    }
  }
})
