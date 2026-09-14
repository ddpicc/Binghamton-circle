const activityStore = require('../../stores/activityStore')
const authStore = require('../../stores/authStore')
const { ensureLogin } = require('../../utils/auth')

const WEEK_NAMES = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT']

function buildWeekDates() {
  const now = new Date()
  const monday = new Date(now)
  const day = monday.getDay() || 7
  monday.setDate(monday.getDate() - day + 1)

  return Array.from({ length: 6 }).map((_, index) => {
    const current = new Date(monday)
    current.setDate(monday.getDate() + index)
    return {
      dateKey: `${current.getFullYear()}-${String(current.getMonth() + 1).padStart(2, '0')}-${String(current.getDate()).padStart(2, '0')}`,
      weekText: WEEK_NAMES[current.getDay()],
      dayText: String(current.getDate())
    }
  })
}

Page({
  data: {
    safeTop: 20,
    topAvatar: '/assets/home/home-logo.jpg',
    loading: true,
    weekDates: [],
    selectedDateKey: '',
    activities: [],
    displayActivities: [],
    hero: {
      id: '',
      cover: '',
      title: '',
      subtitle: ''
    }
  },

  onLoad() {
    authStore.initUser()

    const sys = wx.getSystemInfoSync()
    const weekDates = buildWeekDates()
    const user = authStore.getState().user || {}
    this.setData({
      safeTop: sys.statusBarHeight || 20,
      weekDates,
      selectedDateKey: weekDates[0]?.dateKey || '',
      topAvatar: user.avatar || user.profile?.avatar || '/assets/home/home-logo.jpg'
    })

    this.unsubscribe = activityStore.subscribe((state) => {
      const normalized = this.normalizeActivities(state.activities || [])
      this.setData({
        loading: state.loading,
        activities: normalized
      })
      this.refreshDisplayActivities()
    })

    this.authUnsub = authStore.subscribe((state) => {
      this.setData({
        topAvatar: state.user?.avatar || state.user?.profile?.avatar || '/assets/home/home-logo.jpg'
      })
    })

    this.loadData()
  },

  onShow() {
    this.loadData()
  },

  onUnload() {
    this.unsubscribe && this.unsubscribe()
    this.authUnsub && this.authUnsub()
  },

  onPullDownRefresh() {
    this.loadData()
    setTimeout(() => wx.stopPullDownRefresh(), 700)
  },

  onReachBottom() {
    wx.showToast({ title: '没有更多活动了', icon: 'none' })
  },

  loadData() {
    activityStore.loadActivities()
  },

  normalizeActivities(list = []) {
    return list.map((item) => {
      const startTime = item.time || item.start_time || item.startTime || ''
      const cover =
        item.cover_image ||
        item.cover ||
        item.poster ||
        item.image ||
        item.banner ||
        ''
      const locationText = item.location || ''
      const participantCount = Number(item.participant_count || item.participants_count || 0)
      const maxParticipants = Number(item.max_participants || 0)
      const previewFromParticipants = Array.isArray(item.participants)
        ? item.participants.map((it) => it.avatar).filter(Boolean)
        : []
      const fallbackAvatar = item.publisher?.avatar || item.user?.avatar
      const previewAvatars = (previewFromParticipants.length ? previewFromParticipants : [fallbackAvatar]).filter(Boolean).slice(0, 3)
      const extraCount = Math.max(0, participantCount - previewAvatars.length)
      const isFull = maxParticipants > 0 && participantCount >= maxParticipants
      const isJoined = !!item.is_joined
      return {
        ...item,
        cover,
        timeText: this.formatTimeRange(startTime, item.end_time || item.endTime),
        locationText,
        participantCount,
        maxParticipants,
        previewAvatars,
        extraCount,
        isJoined,
        isFull,
        statusText: isJoined ? '已报名' : (isFull ? '已满' : '报名中'),
        joinedText: isJoined ? '已报名' : `${participantCount}人参与`,
        dateKey: this.toDateKey(startTime)
      }
    })
  },

  refreshDisplayActivities() {
    const { activities, selectedDateKey } = this.data
    let displayActivities = activities
    if (selectedDateKey) {
      const matched = activities.filter((item) => item.dateKey === selectedDateKey)
      displayActivities = matched.length ? matched : activities
    }
    const heroSource = displayActivities[0] || activities[0]
    const hero = heroSource
      ? {
          id: heroSource.id,
          cover: heroSource.cover || '',
          title: heroSource.title || '',
          subtitle: heroSource.timeText || ''
        }
      : {
          id: '',
          cover: '',
          title: '',
          subtitle: ''
        }
    this.setData({
      displayActivities,
      hero
    })
  },

  toDateKey(value) {
    if (!value) return ''
    const date = new Date(value)
    if (Number.isNaN(date.getTime())) return ''
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
  },

  formatTimeRange(startValue, endValue) {
    if (!startValue) return ''
    const start = new Date(startValue)
    if (Number.isNaN(start.getTime())) return String(startValue)
    const month = `${start.getMonth() + 1}`.padStart(2, '0')
    const day = `${start.getDate()}`.padStart(2, '0')
    const startHour = `${start.getHours()}`.padStart(2, '0')
    const startMinute = `${start.getMinutes()}`.padStart(2, '0')
    if (!endValue) return `${month}月${day}日 ${startHour}:${startMinute}`

    const end = new Date(endValue)
    if (Number.isNaN(end.getTime())) return `${month}月${day}日 ${startHour}:${startMinute}`
    const endHour = `${end.getHours()}`.padStart(2, '0')
    const endMinute = `${end.getMinutes()}`.padStart(2, '0')
    return `${month}月${day}日 ${startHour}:${startMinute} - ${endHour}:${endMinute}`
  },

  onDateTap(e) {
    const { date } = e.currentTarget.dataset
    if (!date || date === this.data.selectedDateKey) return
    this.setData({ selectedDateKey: date })
    this.refreshDisplayActivities()
  },

  onSearchTap() {
    wx.navigateTo({ url: '/pages/notices/list/index' })
  },

  onNotificationsTap() {
    wx.navigateTo({ url: '/pages/notices/list/index' })
  },

  onHeroTap() {
    if (!this.data.hero.id) return
    wx.navigateTo({ url: `/pages/activities/detail/index?id=${this.data.hero.id}` })
  },

  onActivityTap(e) {
    const { id } = e.currentTarget.dataset
    if (!id) return
    wx.navigateTo({ url: `/pages/activities/detail/index?id=${id}` })
  },

  onJoinTap(e) {
    const { id, joined } = e.currentTarget.dataset
    if (!id || joined) {
      wx.navigateTo({ url: `/pages/activities/detail/index?id=${id}` })
      return
    }
    wx.navigateTo({ url: `/pages/activities/detail/index?id=${id}` })
  },

  async onPublishActivity() {
    const allowed = await ensureLogin({
      title: '登录后可发布活动',
      content: '浏览活动列表无需登录，发布活动时需要先登录。'
    })
    if (!allowed) return
    wx.navigateTo({ url: '/pages/activities/edit/index' })
  },

  onTabTap(e) {
    const { url } = e.currentTarget.dataset
    if (!url) return
    wx.switchTab({ url })
  },

  onShareAppMessage() {
    return {
      title: '校园活动 - Binghamton Circle',
      path: '/pages/activities/index'
    }
  },

  onShareTimeline() {
    return {
      title: '发现校园精彩活动'
    }
  }
})
