const activityStore = require('../../../stores/activityStore')
const authStore = require('../../../stores/authStore')
const { createActivity } = require('../../../services/activities')
const { uploadImages } = require('../../../services/upload')
const { ensureLogin } = require('../../../utils/auth')

const CATEGORY_OPTIONS = ['讲座', '文体', '拼车', '社团', '其他']

Page({
  data: {
    id: '',
    safeTop: 20,
    saving: false,
    categories: CATEGORY_OPTIONS,
    startDateLabel: '选择日期',
    endDateLabel: '选择日期',
    startTimeLabel: '选择时间',
    endTimeLabel: '选择时间',
    form: {
      title: '',
      category: '讲座',
      cover_image: '',
      start_date: '',
      end_date: '',
      start_time_of_day: '',
      end_time_of_day: '',
      location: '',
      limit_enabled: true,
      max_participants: 50,
      description: ''
    }
  },

  async onLoad(options) {
    const system = wx.getSystemInfoSync()
    this.setData({ safeTop: system.statusBarHeight || 20 })

    authStore.initUser()
    const allowed = await ensureLogin({
      title: '登录后可发布活动',
      content: '浏览活动无需登录，发布或管理活动时需要先登录。'
    })
    if (!allowed) {
      wx.navigateBack({
        fail: () => wx.switchTab({ url: '/pages/home/index' })
      })
      return
    }

    const { id } = options || {}
    if (!id) return
    this.setData({ id: String(id) })
    this.loadActivityData(id)
  },

  loadActivityData(id) {
    const activities = activityStore.getState().activities || []
    const activity = activities.find((item) => String(item.id) === String(id))
    if (!activity) return

    const maxParticipants = Number(activity.max_participants || 0)
    const startParts = this.extractDateTimeParts(activity.start_time || activity.time || '')
    const endParts = this.extractDateTimeParts(activity.end_time || '')

    this.setData({
      startDateLabel: this.formatDateLabel(startParts.date),
      endDateLabel: this.formatDateLabel(endParts.date),
      startTimeLabel: this.formatTimeLabel(startParts.time),
      endTimeLabel: this.formatTimeLabel(endParts.time),
      form: {
        title: activity.title || '',
        category: activity.category || activity.type || '讲座',
        cover_image:
          activity.cover_image ||
          activity.cover ||
          activity.poster ||
          activity.image ||
          activity.banner ||
          '',
        start_date: startParts.date,
        end_date: endParts.date,
        start_time_of_day: startParts.time,
        end_time_of_day: endParts.time,
        location: activity.location || '',
        limit_enabled: maxParticipants > 0,
        max_participants: maxParticipants > 0 ? maxParticipants : 50,
        description: activity.description || ''
      }
    })
  },

  extractDateTimeParts(value) {
    if (!value) return { date: '', time: '' }
    const text = String(value).trim()
    if (!text) return { date: '', time: '' }

    const dateMatch = text.match(/(\d{4}-\d{2}-\d{2})/)
    const timeMatch = text.match(/(\d{2}:\d{2})/)
    if (dateMatch || timeMatch) {
      return {
        date: dateMatch ? dateMatch[1] : '',
        time: timeMatch ? timeMatch[1] : ''
      }
    }

    const parsed = new Date(text)
    if (Number.isNaN(parsed.getTime())) {
      return { date: text, time: '' }
    }

    const month = `${parsed.getMonth() + 1}`.padStart(2, '0')
    const day = `${parsed.getDate()}`.padStart(2, '0')
    const hours = `${parsed.getHours()}`.padStart(2, '0')
    const minutes = `${parsed.getMinutes()}`.padStart(2, '0')

    return {
      date: `${parsed.getFullYear()}-${month}-${day}`,
      time: `${hours}:${minutes}`
    }
  },

  formatDateLabel(value) {
    if (!value) return '选择日期'
    const date = new Date(value)
    if (Number.isNaN(date.getTime())) return value
    const month = `${date.getMonth() + 1}`.padStart(2, '0')
    const day = `${date.getDate()}`.padStart(2, '0')
    return `${month}月${day}日`
  },

  formatTimeLabel(value) {
    return value || '选择时间'
  },

  combineDateTime(date, time) {
    if (!date) return ''
    if (!time) return date
    return `${date} ${time}`
  },

  getDateTimeValue(date, time) {
    const dateTimeText = this.combineDateTime(date, time)
    if (!dateTimeText) return null
    const dateObj = new Date(dateTimeText.replace(' ', 'T'))
    return Number.isNaN(dateObj.getTime()) ? null : dateObj
  },

  handleTitleChange(e) {
    this.setData({ 'form.title': e.detail.value })
  },

  handleCategorySelect(e) {
    const index = Number(e.currentTarget.dataset.index)
    const category = this.data.categories[index]
    if (!category) return
    this.setData({ 'form.category': category })
  },

  handleStartDateChange(e) {
    this.setData({
      'form.start_date': e.detail.value,
      startDateLabel: this.formatDateLabel(e.detail.value)
    })
  },

  handleEndDateChange(e) {
    this.setData({
      'form.end_date': e.detail.value,
      endDateLabel: this.formatDateLabel(e.detail.value)
    })
  },

  handleStartTimeChange(e) {
    this.setData({
      'form.start_time_of_day': e.detail.value,
      startTimeLabel: this.formatTimeLabel(e.detail.value)
    })
  },

  handleEndTimeChange(e) {
    this.setData({
      'form.end_time_of_day': e.detail.value,
      endTimeLabel: this.formatTimeLabel(e.detail.value)
    })
  },

  handleLocationChange(e) {
    this.setData({ 'form.location': e.detail.value })
  },

  handleDescriptionChange(e) {
    this.setData({ 'form.description': e.detail.value })
  },

  handleToggleLimit() {
    this.setData({ 'form.limit_enabled': !this.data.form.limit_enabled })
  },

  handleDecreaseLimit() {
    const current = Number(this.data.form.max_participants || 1)
    if (current <= 1) return
    this.setData({ 'form.max_participants': current - 1 })
  },

  handleIncreaseLimit() {
    const current = Number(this.data.form.max_participants || 1)
    this.setData({ 'form.max_participants': current + 1 })
  },

  handleLimitInput(e) {
    const raw = String(e.detail.value || '')
    const digitsOnly = raw.replace(/\D/g, '')
    this.setData({ 'form.max_participants': digitsOnly })
  },

  handleLimitBlur() {
    const parsed = Number(this.data.form.max_participants)
    this.setData({
      'form.max_participants': Number.isFinite(parsed) && parsed >= 1 ? parsed : 1
    })
  },

  async handleChooseCover() {
    try {
      const chooseRes = await wx.chooseMedia({ count: 1, mediaType: ['image'] })
      const path = chooseRes.tempFiles && chooseRes.tempFiles[0] && chooseRes.tempFiles[0].tempFilePath
      if (!path) return
      const [url] = await uploadImages([path])
      if (!url) return
      this.setData({ 'form.cover_image': url })
    } catch (error) {
      console.error('choose cover failed', error)
      wx.showToast({ title: '上传失败', icon: 'none' })
    }
  },

  validateForm() {
    const { form } = this.data
    if (!String(form.title || '').trim()) {
      wx.showToast({ title: '请输入活动名称', icon: 'none' })
      return false
    }
    if (!form.start_date || !form.start_time_of_day) {
      wx.showToast({ title: '请选择开始日期和时间', icon: 'none' })
      return false
    }
    if (!form.end_date || !form.end_time_of_day) {
      wx.showToast({ title: '请选择结束日期和时间', icon: 'none' })
      return false
    }

    const startValue = this.getDateTimeValue(form.start_date, form.start_time_of_day)
    const endValue = this.getDateTimeValue(form.end_date, form.end_time_of_day)
    if (!startValue || !endValue) {
      wx.showToast({ title: '时间格式不正确', icon: 'none' })
      return false
    }
    if (endValue.getTime() <= startValue.getTime()) {
      wx.showToast({ title: '结束时间必须晚于开始时间', icon: 'none' })
      return false
    }

    if (form.limit_enabled) {
      const maxParticipants = Number(form.max_participants)
      if (!Number.isFinite(maxParticipants) || maxParticipants < 1) {
        wx.showToast({ title: '人数限制至少为 1', icon: 'none' })
        return false
      }
    }
    return true
  },

  buildPayload() {
    const { form } = this.data
    const startDateTime = this.combineDateTime(form.start_date, form.start_time_of_day)
    const endDateTime = this.combineDateTime(form.end_date, form.end_time_of_day)

    return {
      title: String(form.title || '').trim(),
      category: form.category || '讲座',
      cover_image: form.cover_image || '',
      time: startDateTime,
      start_time: startDateTime,
      end_time: endDateTime,
      location: String(form.location || '').trim(),
      description: String(form.description || '').trim(),
      max_participants: form.limit_enabled ? Number(form.max_participants || 1) : undefined
    }
  },

  async handleSubmit() {
    if (this.data.saving) return
    if (!this.validateForm()) return

    this.setData({ saving: true })
    const payload = this.buildPayload()

    try {
      if (this.data.id) {
        await activityStore.updateActivityData(this.data.id, payload)
        wx.showToast({ title: '更新成功', icon: 'success' })
      } else {
        await createActivity(payload)
        wx.showToast({ title: '发布成功', icon: 'success' })
      }

      setTimeout(() => {
        wx.navigateBack()
      }, 900)
    } catch (error) {
      console.error('submit activity failed', error)
      wx.showToast({ title: '提交失败', icon: 'none' })
    } finally {
      this.setData({ saving: false })
    }
  },

  handleCancel() {
    wx.navigateBack()
  },

  onBack() {
    this.handleCancel()
  }
})
