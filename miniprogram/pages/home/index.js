const activityStore = require('../../stores/activityStore')
const { ensureLogin } = require('../../utils/auth')
const { fetchActivities } = require('../../services/activities')
const { fetchO2OList } = require('../../services/o2o')
const { fetchPosts } = require('../../services/treehole')
const { fetchHomeBanner } = require('../../services/home')

const TREEHOLE_NAMES = [
  '沉稳的猫头鹰',
  '淘气的松鼠',
  '安静的海狸',
  '机灵的小鹿',
  '散步的白熊',
  '晚风里的狐狸'
]

const TAB_PAGES = new Set([
  '/pages/home/index',
  '/pages/treehole/list/index',
  '/pages/circles/following/index',
  '/pages/o2o/list/index',
  '/pages/profile/index/index'
])

Page({
  data: {
    safeTop: 74,
    quickMenus: [
      { id: 1, label: '提醒', icon: '/assets/icons/notifications-primary.svg', url: '/pages/notices/list/index' },
      { id: 2, label: '闲置', icon: '/assets/icons/shopping-basket-primary.svg', url: '/pages/o2o/list/index' },
      { id: 3, label: '活动', icon: '/assets/icons/event-primary.svg', url: '/pages/activities/index' },
      { id: 4, label: '树洞', icon: '/assets/icons/layers-primary.svg', url: '/pages/treehole/list/index' }
    ],
    latestGoods: {
      images: [
        '/assets/home/goods-1.jpg',
        '/assets/home/goods-2.jpg'
      ]
    },
    avatars: {
      logo: '/assets/home/home-logo.jpg',
      chen: '/assets/home/user-chen.jpg',
      li: '/assets/home/user-li.jpg'
    },
    eventCover: '/assets/home/event-cover.jpg',
    latestFeed: [],
    feedLoading: false,
    banner: {
      id: '',
      tag: '校园活动',
      title: '查看最新校园活动',
      linkText: '进入活动页'
    }
  },

  onLoad() {
    this.bannerManaged = false
    const sys = wx.getSystemInfoSync()
    const statusBarHeight = sys.statusBarHeight || 20
    const safeTop = statusBarHeight + 20
    this.setData({ safeTop })

    this.unsubscribe = activityStore.subscribe((state) => {
      if (this.bannerManaged) return
      this.setData({
        banner: this.buildBanner(state.activities || [])
      })
    })

    this.loadHomeData()
  },

  onShow() {
    this.loadHomeData()
  },

  onUnload() {
    this.unsubscribe && this.unsubscribe()
  },

  onPullDownRefresh() {
    Promise.resolve(this.loadHomeData())
      .finally(() => {
        wx.stopPullDownRefresh()
      })
  },

  loadHomeData() {
    activityStore.loadActivities({ limit: 20 })
    return Promise.allSettled([
      this.loadBannerConfig(),
      this.loadLatestFeed()
    ])
  },

  async loadBannerConfig() {
    try {
      const response = await fetchHomeBanner()
      const banner = response.banner || null
      if (!banner) {
        this.bannerManaged = false
        const state = activityStore.getState()
        this.setData({
          banner: this.buildBanner(state.activities || [])
        })
        return
      }

      this.bannerManaged = true
      this.setData({
        banner: {
          id: banner.id || '',
          type: banner.type || banner.sourceType || '',
          path: banner.path || '',
          tag: banner.tag || '校园活动',
          title: banner.title || '查看最新校园活动',
          linkText: banner.linkText || '查看详情'
        }
      })
    } catch (error) {
      console.error('加载首页 Banner 配置失败:', error)
      this.bannerManaged = false
      const state = activityStore.getState()
      this.setData({
        banner: this.buildBanner(state.activities || [])
      })
    }
  },

  async loadLatestFeed() {
    this.setData({ feedLoading: true })
    try {
      const [activitiesResponse, goodsResponse, postsResponse] = await Promise.all([
        fetchActivities({ limit: 6, sortBy: 'created_at', sortOrder: 'DESC' }),
        fetchO2OList({ limit: 6, sort: 'latest' }),
        fetchPosts({ limit: 6 })
      ])

      const activities = (activitiesResponse.items || activitiesResponse.activities || [])
        .map((item) => this.normalizeActivityFeedItem(item))
      const goods = (goodsResponse.items || []).map((item) => this.normalizeO2OFeedItem(item))
      const posts = (postsResponse.items || postsResponse.posts || postsResponse.data || [])
        .map((item, index) => this.normalizeTreeHoleFeedItem(item, index))

      const latestFeed = [...activities, ...goods, ...posts]
        .filter((item) => item && item.sortTime > 0)
        .sort((a, b) => b.sortTime - a.sortTime)
        .slice(0, 9)

      this.setData({ latestFeed, feedLoading: false })
    } catch (error) {
      console.error('加载首页最新动态失败:', error)
      this.setData({ latestFeed: [], feedLoading: false })
    }
  },

  buildBanner(activities = []) {
    const fallback = {
      id: '',
      tag: '校园活动',
      title: '查看最新校园活动',
      linkText: '进入活动页'
    }

    if (!Array.isArray(activities) || !activities.length) {
      return fallback
    }

    const featured = this.pickFeaturedActivity(activities)
    if (!featured) {
      return fallback
    }

    return {
      id: featured.id || '',
      tag: featured.category || featured.type || '校园活动',
      title: featured.title || fallback.title,
      linkText: '查看详情'
    }
  },

  pickFeaturedActivity(activities = []) {
    const now = Date.now()
    const normalized = activities
      .map((item) => {
        const rawTime = item.start_time || item.time || item.startTime || ''
        const timestamp = rawTime ? new Date(rawTime).getTime() : Number.NaN
        return {
          ...item,
          _timestamp: timestamp
        }
      })
      .filter((item) => item && item.title)

    const upcoming = normalized
      .filter((item) => !Number.isNaN(item._timestamp) && item._timestamp >= now)
      .sort((a, b) => a._timestamp - b._timestamp)

    if (upcoming.length) {
      return upcoming[0]
    }

    return normalized[0] || null
  },

  getTimestamp(value) {
    if (!value) return 0
    const timestamp = new Date(value).getTime()
    return Number.isNaN(timestamp) ? 0 : timestamp
  },

  formatRelativeTime(value) {
    const timestamp = this.getTimestamp(value)
    if (!timestamp) return '刚刚'
    const diff = Date.now() - timestamp
    const minute = 60 * 1000
    const hour = 60 * minute
    const day = 24 * hour
    if (diff < minute) return '刚刚'
    if (diff < hour) return `${Math.max(1, Math.floor(diff / minute))}分钟前`
    if (diff < day) return `${Math.floor(diff / hour)}小时前`
    if (diff < day * 2) return '昨天'
    return `${Math.floor(diff / day)}天前`
  },

  buildStats(items = []) {
    return items.filter(Boolean).map((item) => ({
      icon: item.icon,
      text: String(item.text)
    }))
  },

  getTreeHoleName(index) {
    return TREEHOLE_NAMES[index % TREEHOLE_NAMES.length]
  },

  normalizeActivityFeedItem(item = {}) {
    const createdAt = item.created_at || item.updated_at || item.time
    const publisher = item.publisher || item.user || {}
    const stats = this.buildStats([
      {
        icon: '/assets/icons/event-primary.svg',
        text: item.location || '地点待定'
      },
      item.participant_count != null
        ? {
            icon: '/assets/icons/favorite-outline-muted.svg',
            text: `${item.participant_count} 人关注`
          }
        : null
    ])

    return {
      id: item.id,
      type: 'activity',
      route: `/pages/activities/detail/index?id=${item.id}`,
      tag: item.category || item.type || '校园活动',
      tagClass: 'feed-tag-activity',
      authorName: publisher.nickname || publisher.username || '活动发起者',
      authorMeta: `${this.formatRelativeTime(createdAt)} · 活动`,
      avatar: publisher.avatar || '',
      avatarMode: 'image',
      title: item.title || '校园活动',
      content: item.description || '点击查看活动详情',
      imageList: [item.cover_image || ''].filter(Boolean),
      stats,
      sortTime: this.getTimestamp(createdAt)
    }
  },

  normalizeO2OFeedItem(item = {}) {
    const seller = item.user || {}
    const sellerName = item.seller_name || seller.nickname || seller.username || '闲置发布者'
    const coverList = Array.isArray(item.images) ? item.images.filter(Boolean).slice(0, 3) : []
    const price = item.price != null && item.price !== '' ? `¥${item.price}` : '价格私聊'
    const stats = this.buildStats([
      { icon: '/assets/icons/favorite-outline-muted.svg', text: price },
      item.location
        ? { icon: '/assets/icons/location-on-primary-soft.svg', text: item.location }
        : null
    ])

    return {
      id: item.id,
      type: 'o2o',
      route: `/pages/o2o/detail/index?id=${item.id}`,
      tag: '二手市场',
      tagClass: 'feed-tag-goods',
      authorName: sellerName,
      authorMeta: `${this.formatRelativeTime(item.created_at)} · 闲置`,
      avatar: seller.avatar || '',
      avatarMode: 'image',
      title: item.title || '闲置物品',
      content: item.description || '点击查看物品详情',
      imageList: coverList,
      stats,
      sortTime: this.getTimestamp(item.created_at)
    }
  },

  normalizeTreeHoleFeedItem(item = {}, index = 0) {
    const stats = this.buildStats([
      {
        icon: '/assets/icons/favorite-filled-red-material.svg',
        text: item.like_count || 0
      },
      {
        icon: '/assets/icons/chat-bubble-muted.svg',
        text: item.comment_count || 0
      }
    ])

    return {
      id: item.id,
      type: 'treehole',
      route: `/pages/treehole/detail/index?id=${item.id}`,
      tag: '树洞',
      tagClass: 'feed-tag-treehole',
      authorName: this.getTreeHoleName(index),
      authorMeta: `${this.formatRelativeTime(item.created_at)} · 树洞`,
      avatar: '/assets/icons/visibility-off-white.svg',
      avatarMode: 'anon',
      title: '',
      content: item.content || item.text || '点击查看树洞内容',
      imageList: Array.isArray(item.images) ? item.images.filter(Boolean).slice(0, 3) : [],
      stats,
      sortTime: this.getTimestamp(item.created_at)
    }
  },

  handleNavigate(e) {
    const { url } = e.currentTarget?.dataset || {}
    if (!url) return

    const basePath = url.split('?')[0]
    if (TAB_PAGES.has(basePath)) {
      wx.switchTab({ url: basePath })
      return
    }

    wx.navigateTo({ url })
  },

  handleFeedItemTap(e) {
    const { url } = e.currentTarget.dataset || {}
    if (!url) return
    this.handleNavigate({ currentTarget: { dataset: { url } } })
  },

  handleSearch() {
    wx.showToast({
      title: '搜索功能开发中',
      icon: 'none'
    })
  },

  handleBannerTap() {
    const { id, path, type } = this.data.banner || {}
    if (path) {
      wx.navigateTo({ url: path })
      return
    }

    if (id && type === 'notice') {
      wx.navigateTo({ url: `/pages/notices/detail/index?id=${id}` })
      return
    }

    if (id) {
      wx.navigateTo({ url: `/pages/activities/detail/index?id=${id}` })
      return
    }

    wx.navigateTo({ url: '/pages/activities/index' })
  },

  handleQuickPublish() {
    wx.showActionSheet({
      itemList: ['发布活动', '发布二手', '发表树洞'],
      success: async (res) => {
        const actions = [
          '/pages/activities/edit/index',
          '/pages/o2o/publish/index',
          '/pages/treehole/publish/index'
        ]
        const selectedUrl = actions[res.tapIndex]
        if (selectedUrl) {
          const allowed = await ensureLogin({
            title: '登录后可发布内容',
            content: '浏览内容无需登录，发布活动、闲置或树洞时需要先登录。'
          })
          if (!allowed) return
          wx.navigateTo({ url: selectedUrl })
        }
      }
    })
  }
})
