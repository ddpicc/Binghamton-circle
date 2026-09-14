const authStore = require('../../../stores/authStore')
const { fetchActivities } = require('../../../services/activities')
const { fetchNotices } = require('../../../services/notices')
const { fetchHomeBanner, updateHomeBanner } = require('../../../services/home')

Page({
  data: {
    sourceTabs: [
      { label: '活动', value: 'activity' },
      { label: '通知', value: 'notice' }
    ],
    selectedSourceType: 'activity',
    selectedSourceId: null,
    activities: [],
    notices: [],
    customTag: '',
    customTitle: '',
    customLinkText: '',
    saving: false,
    loading: true
  },

  async onLoad() {
    const user = authStore.getState().user
    if (!user || user.role !== 'admin') {
      wx.showToast({ title: '无权限访问', icon: 'none' })
      setTimeout(() => wx.navigateBack(), 800)
      return
    }

    await this.loadPageData()
  },

  async loadPageData() {
    this.setData({ loading: true })
    try {
      const [bannerRes, activityRes, noticeRes] = await Promise.all([
        fetchHomeBanner(),
        fetchActivities({ limit: 20, sortBy: 'created_at', sortOrder: 'DESC' }),
        fetchNotices({ limit: 20, sortBy: 'created_at', sortOrder: 'DESC' })
      ])

      const banner = bannerRes.banner || null
      const activities = (activityRes.items || activityRes.activities || []).map((item) => ({
        ...item,
        displayMeta: `${this.formatDate(item.time || item.created_at)}${item.location ? ` · ${item.location}` : ''}`
      }))
      const notices = (noticeRes.notices || noticeRes.items || noticeRes.data || []).map((item) => ({
        ...item,
        displayMeta: `${this.formatDate(item.created_at)} · ${item.category || '通知'}`
      }))

      this.setData({
        activities,
        notices,
        selectedSourceType: banner?.sourceType || banner?.type || 'activity',
        selectedSourceId: banner?.sourceId || banner?.id || null,
        customTag: banner?.customTag || '',
        customTitle: banner?.customTitle || '',
        customLinkText: banner?.customLinkText || '',
        loading: false
      })
    } catch (error) {
      console.error('加载 Banner 管理页失败:', error)
      this.setData({ loading: false })
      wx.showToast({ title: '加载失败', icon: 'none' })
    }
  },

  formatDate(value) {
    if (!value) return '时间待定'
    const date = new Date(value)
    if (Number.isNaN(date.getTime())) return String(value)
    const month = `${date.getMonth() + 1}`.padStart(2, '0')
    const day = `${date.getDate()}`.padStart(2, '0')
    const hours = `${date.getHours()}`.padStart(2, '0')
    const minutes = `${date.getMinutes()}`.padStart(2, '0')
    return `${month}-${day} ${hours}:${minutes}`
  },

  handleTabTap(e) {
    const { value } = e.currentTarget.dataset
    if (!value || value === this.data.selectedSourceType) return
    this.setData({
      selectedSourceType: value,
      selectedSourceId: null
    })
  },

  handleSelectItem(e) {
    const { id } = e.currentTarget.dataset
    if (!id) return
    this.setData({ selectedSourceId: Number(id) })
  },

  handleTagInput(e) {
    this.setData({ customTag: e.detail.value })
  },

  handleTitleInput(e) {
    this.setData({ customTitle: e.detail.value })
  },

  handleLinkTextInput(e) {
    this.setData({ customLinkText: e.detail.value })
  },

  async handleSave() {
    if (!this.data.selectedSourceId) {
      wx.showToast({ title: '请选择要展示的内容', icon: 'none' })
      return
    }

    this.setData({ saving: true })
    try {
      await updateHomeBanner({
        source_type: this.data.selectedSourceType,
        source_id: this.data.selectedSourceId,
        custom_tag: this.data.customTag.trim(),
        custom_title: this.data.customTitle.trim(),
        custom_link_text: this.data.customLinkText.trim()
      })
      wx.showToast({ title: 'Banner 已更新', icon: 'success' })
      setTimeout(() => wx.navigateBack(), 600)
    } catch (error) {
      console.error('更新 Banner 失败:', error)
      wx.showToast({ title: error?.message || '保存失败', icon: 'none' })
    } finally {
      this.setData({ saving: false })
    }
  }
})
