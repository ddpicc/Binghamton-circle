// pages/activities/detail/index.js
const activityStore = require('../../../stores/activityStore')
const { removeActivity } = require('../../../stores/activityStore')
const authStore = require('../../../stores/authStore')
const { fetchActivityParticipants } = require('../../../services/activities')
const { showError } = require('../../../utils/toast')
const { ensureLogin } = require('../../../utils/auth')

Page({
  data: {
    activity: null,
    activityView: {},
    loading: true,
    isCreator: false,
    isAdmin: false,
    participants: [],
    participantPreview: [],
    participantsLoading: false,
    showParticipants: false,
    joinLoading: false,
    isFavorite: false,
    favoriteIcon: '/assets/icons/heart-outline.svg',
    safeTop: 20
  },

  onLoad(options) {
    const systemInfo = wx.getSystemInfoSync()
    this.setData({
      safeTop: systemInfo.statusBarHeight || 20
    })

    // 初始化用户状态
    authStore.initUser()

    const { id } = options
    if (!id) {
      wx.showToast({
        title: '参数错误',
        icon: 'error'
      })
      setTimeout(() => {
        wx.navigateBack()
      }, 1500)
      return
    }

    // 保存活动ID
    this.activityId = id

    // 订阅数据变化
    this.unsubscribe = activityStore.subscribe((state) => {
      const { currentActivity, loading } = state
      if (currentActivity && currentActivity.id == id) {
        const isCreator = this.isCreator(currentActivity)
        const isAdmin = this.isAdmin()
        const participants = this.formatParticipants(currentActivity.participants || [])
        const activityView = this.normalizeActivity(currentActivity, participants, isCreator)
        this.setData({
          activity: currentActivity,
          activityView,
          loading,
          isCreator,
          isAdmin,
          participants,
          participantPreview: this.buildParticipantPreview(participants, activityView.publisherAvatar),
          showParticipants: participants.length ? this.data.showParticipants : false
        })
      } else {
        this.setData({
          loading
        })
      }
    })

    // 获取活动详情
    activityStore.loadActivityDetail(id)
  },

  onUnload() {
    this.unsubscribe && this.unsubscribe()
  },

  formatParticipants(list) {
    return (list || []).map((participant) => ({
      ...participant,
      displayName: participant.nickname || participant.username || '用户',
      avatar: participant.avatar || participant.avatar_url || '',
      joinedAtText: this.formatDate(participant.joined_at)
    }))
  },

  normalizeActivity(activity, participants = [], isCreator = this.data.isCreator) {
    const participantCount = Number(
      activity.participant_count != null
        ? activity.participant_count
        : participants.length
    )
    const maxParticipants = Number(activity.max_participants || 0)
    const cover =
      activity.cover_image ||
      activity.cover ||
      activity.poster ||
      activity.image ||
      activity.banner ||
      '/assets/home/event-cover.jpg'
    const publisher = activity.publisher || activity.user || {}
    const publisherName = publisher.nickname || publisher.username || '活动发起者'
    const publisherAvatar = publisher.avatar || '/assets/home/user-li.jpg'
    const timeText = activity.time || activity.start_time || '时间待定'
    const locationText = activity.location || '地点待定'

    let ctaText = '立即报名'
    if (this.data.joinLoading) {
      ctaText = '处理中...'
    } else if (isCreator) {
      ctaText = '管理活动'
    } else if (activity.is_joined) {
      ctaText = '已报名'
    } else if (maxParticipants && participantCount >= maxParticipants) {
      ctaText = '名额已满'
    }

    return {
      cover,
      publisherName,
      publisherAvatar,
      participantCount,
      timeText,
      locationText,
      statusText: activity.is_joined ? '已报名' : '报名进行中',
      ctaText
    }
  },

  buildParticipantPreview(participants = [], fallbackAvatar = '/assets/home/user-li.jpg') {
    return participants.slice(0, 3).map((item) => ({
      ...item,
      avatar: item.avatar || fallbackAvatar
    }))
  },

  formatDate(value) {
    if (!value) return ''
    const date = new Date(value)
    if (Number.isNaN(date.getTime())) return ''
    const month = `${date.getMonth() + 1}`.padStart(2, '0')
    const day = `${date.getDate()}`.padStart(2, '0')
    const hours = `${date.getHours()}`.padStart(2, '0')
    const minutes = `${date.getMinutes()}`.padStart(2, '0')
    return `${month}-${day} ${hours}:${minutes}`
  },

  // 判断是否是创建者
  isCreator(activity) {
    const user = authStore.getState().user
    return user && activity.user_id === user.id
  },

  isAdmin() {
    const user = authStore.getState().user
    return !!(user && user.role === 'admin')
  },

  onToggleParticipants() {
    const nextShow = !this.data.showParticipants
    this.setData({
      showParticipants: nextShow
    })

    if (
      nextShow &&
      (!this.data.participants || this.data.participants.length === 0) &&
      (this.data.activity?.participant_count || 0) > 0
    ) {
      this.loadParticipants()
    }
  },

  onParticipantTap(e) {
    if (e && e.stopPropagation) e.stopPropagation()
    const { id } = e.currentTarget.dataset
    if (!id) return
    wx.navigateTo({
      url: `/pages/users/detail/index?userId=${id}`
    })
  },

  async loadParticipants() {
    if (!this.activityId) return
    this.setData({ participantsLoading: true })
    try {
      const response = await fetchActivityParticipants(this.activityId)
      const list =
        response.participants ||
        response.items ||
        response.data ||
        response ||
        []
      const formatted = this.formatParticipants(list)
      this.setData({
        participants: formatted,
        participantPreview: this.buildParticipantPreview(formatted, (this.data.activityView || {}).publisherAvatar),
        participantsLoading: false,
        activityView: this.normalizeActivity(this.data.activity || {}, formatted, this.data.isCreator)
      })
    } catch (error) {
      console.error('加载报名名单失败', error)
      this.setData({ participantsLoading: false })
      if (!error?.toastShown) {
        showError(error?.message || '加载报名名单失败')
      }
    }
  },

  // 报名/取消报名
  async onToggleJoin(e) {
    const { id } = e.currentTarget.dataset
    if (!id) return
    if (this.data.joinLoading) return
    const allowed = await ensureLogin({
      title: '登录后可报名活动',
      content: '浏览活动详情无需登录，报名活动时需要先登录。'
    })
    if (!allowed) return

    // 添加触觉反馈
    wx.vibrateShort({ type: 'light' })

    this.setData({
      joinLoading: true,
      activityView: {
        ...this.data.activityView,
        ctaText: '处理中...'
      }
    })

    activityStore.toggleJoinActivity(id)
      .then((result) => {
        const toastMessage =
          (result && result.message) ||
          (result && result.joined ? '报名成功' : '操作成功')
        wx.showToast({
          title: toastMessage,
          icon: 'success'
        })
      })
      .catch((error) => {
        const message =
          error?.response?.data?.error ||
          error?.message ||
          '操作失败'
        wx.showToast({
          title: message,
          icon: 'none'
        })
      })
      .finally(() => {
        this.setData({
          joinLoading: false,
          activityView: this.normalizeActivity(this.data.activity || {}, this.data.participants || [], this.data.isCreator)
        })
      })
  },

  onBack() {
    const pages = getCurrentPages()
    if (pages.length > 1) {
      wx.navigateBack()
      return
    }
    wx.switchTab({
      url: '/pages/activities/index'
    })
  },

  onMore() {
    const activityId = this.data.activity?.id
    if (!activityId) return

    if (this.data.isCreator || this.data.isAdmin) {
      const itemList = this.data.isCreator ? ['编辑活动', '删除活动'] : ['删除活动']
      wx.showActionSheet({
        itemList,
        success: (result) => {
          if (this.data.isCreator && result.tapIndex === 0) {
            this.onEditActivity({ currentTarget: { dataset: { id: activityId } } })
            return
          }

          const deleteIndex = this.data.isCreator ? 1 : 0
          if (result.tapIndex === deleteIndex) {
            this.confirmDeleteActivity()
          }
        }
      })
      return
    }
    wx.showActionSheet({
      itemList: ['举报活动', '不感兴趣'],
      success: () => {
        wx.showToast({
          title: '已处理',
          icon: 'none'
        })
      }
    })
  },

  confirmDeleteActivity() {
    const activityId = this.data.activity?.id
    if (!activityId) return

    wx.showModal({
      title: '删除活动',
      content: '删除后无法恢复，确定删除这个活动吗？',
      confirmColor: '#d14343',
      success: async (result) => {
        if (!result.confirm) return
        try {
          await removeActivity(activityId)
          wx.showToast({ title: '活动已删除', icon: 'success' })
          this.onBack()
        } catch (error) {
          console.error('删除活动失败:', error)
          wx.showToast({
            title: error?.message || '删除失败',
            icon: 'none'
          })
        }
      }
    })
  },

  onToggleFavorite() {
    const next = !this.data.isFavorite
    this.setData({
      isFavorite: next,
      favoriteIcon: next ? '/assets/icons/heart-filled-red.svg' : '/assets/icons/heart-outline.svg'
    })
    wx.showToast({
      title: next ? '已收藏' : '已取消收藏',
      icon: 'none'
    })
  },

  onShareAppMessage() {
    const activity = this.data.activity || {}
    return {
      title: activity.title || '校园活动',
      path: `/pages/activities/detail/index?id=${activity.id || this.activityId || ''}`,
      imageUrl: this.data.activityView?.cover || ''
    }
  },

  // 编辑活动
  onEditActivity(e) {
    const { id } = e.currentTarget.dataset
    if (!id) return

    // 添加触觉反馈
    wx.vibrateShort({ type: 'medium' })

    // 跳转到编辑页面
    wx.navigateTo({
      url: `/pages/activities/edit/index?id=${id}`
    })
  }
})
