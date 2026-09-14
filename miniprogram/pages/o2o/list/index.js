import o2oStore, { loadO2OList, loadCategories, resetO2OState } from '../../../stores/o2oStore'
import authStore from '../../../stores/authStore'
import { ensureLogin } from '../../../utils/auth'

const RATIO_CLASSES = ['ratio-1-1']

Page({
  data: {
    safeTop: 20,
    topAvatar: '/assets/home/home-logo.jpg',
    search: '',
    chipOptions: [{ label: '全部', value: '' }],
    selectedCategory: '',
    sortOptions: [
      { label: '最新发布', value: 'latest' },
      { label: '价格从低到高', value: 'price_low' },
      { label: '价格从高到低', value: 'price_high' },
      { label: '最受欢迎', value: 'popular' }
    ],
    sort: 'latest',
    sortLabel: '最新发布',
    sortIndex: 0,
    items: [],
    leftColumn: [],
    rightColumn: [],
    loading: false,
    hasMore: true,
    isLoggedIn: !!authStore.getState().token
  },

  onLoad() {
    const sys = wx.getSystemInfoSync()
    const authState = authStore.getState()
    this.setData({
      safeTop: sys.statusBarHeight || 20,
      topAvatar: authState.user?.avatar || authState.user?.profile?.avatar || '/assets/home/home-logo.jpg'
    })

    this.unsubscribe = o2oStore.subscribe((state) => {
      const decorated = this.decorateItems(state.items || [])
      const chipOptions = [
        { label: '全部', value: '' },
        ...state.categories.map((item) => ({
          label: item.displayName || item.name,
          value: String(item.id)
        }))
      ]
      const { leftColumn, rightColumn } = this.buildMasonryColumns(decorated)
      this.setData({
        items: decorated,
        leftColumn,
        rightColumn,
        loading: state.loading,
        hasMore: state.pagination.hasMore,
        chipOptions
      })
    })

    this.authUnsub = authStore.subscribe((state) => {
      this.setData({
        isLoggedIn: !!state.token,
        topAvatar: state.user?.avatar || state.user?.profile?.avatar || '/assets/home/home-logo.jpg'
      })
    })

    loadCategories()
    loadO2OList({ page: 1, pageSize: 10 })
  },

  onShow() {
    loadO2OList({ page: 1, pageSize: 10 })
  },

  onUnload() {
    this.unsubscribe && this.unsubscribe()
    this.authUnsub && this.authUnsub()
    resetO2OState()
  },

  async onPullDownRefresh() {
    await loadO2OList({
      page: 1,
      pageSize: 10,
      keyword: this.data.search,
      category: this.data.selectedCategory,
      sort: this.data.sort
    })
    wx.stopPullDownRefresh()
  },

  decorateItems(items = []) {
    return items.map((item, index) => {
      const cover = item.images?.[0] || ''
      const sellerName = item.seller_name || item.user?.nickname || item.user?.username || ''
      const sellerAvatar = item.user?.avatar || ''
      return {
        ...item,
        cover,
        sellerName,
        sellerAvatar,
        conditionTag: item.condition || '',
        createdText: this.formatRelativeTime(item.created_at),
        ratioClass: RATIO_CLASSES[index % RATIO_CLASSES.length]
      }
    })
  },

  buildMasonryColumns(items = []) {
    const leftColumn = []
    const rightColumn = []
    let leftHeight = 0
    let rightHeight = 0

    items.forEach((item) => {
      const cardHeight = 360 + 240
      if (leftHeight <= rightHeight) {
        leftColumn.push(item)
        leftHeight += cardHeight
      } else {
        rightColumn.push(item)
        rightHeight += cardHeight
      }
    })
    return { leftColumn, rightColumn }
  },

  formatRelativeTime(value) {
    if (!value) return ''
    const date = new Date(value)
    if (Number.isNaN(date.getTime())) return ''
    const diff = Date.now() - date.getTime()
    const minute = 60 * 1000
    const hour = 60 * minute
    const day = 24 * hour
    if (diff < hour) return `${Math.max(1, Math.floor(diff / minute))}分钟前`
    if (diff < day) return `${Math.floor(diff / hour)}小时前`
    if (diff < day * 2) return '昨天'
    return `${Math.floor(diff / day)}天前`
  },

  handleSearchInput(e) {
    this.setData({ search: e.detail.value })
  },

  handleSearchConfirm() {
    loadO2OList({
      page: 1,
      pageSize: 10,
      keyword: this.data.search,
      category: this.data.selectedCategory,
      sort: this.data.sort
    })
  },

  handleCategoryTap(e) {
    const { value } = e.currentTarget.dataset
    if (value === undefined || value === this.data.selectedCategory) return
    this.setData({ selectedCategory: value })
    loadO2OList({
      page: 1,
      pageSize: 10,
      keyword: this.data.search,
      category: value,
      sort: this.data.sort
    })
  },

  handleSortPickerTap() {
    const labels = this.data.sortOptions.map((item) => item.label)
    wx.showActionSheet({
      itemList: labels,
      success: ({ tapIndex }) => {
        const option = this.data.sortOptions[tapIndex]
        if (!option) return
        this.setData({
          sort: option.value,
          sortLabel: option.label,
          sortIndex: tapIndex
        })
        loadO2OList({
          page: 1,
          pageSize: 10,
          keyword: this.data.search,
          category: this.data.selectedCategory,
          sort: option.value
        })
      }
    })
  },

  handleLoadMore() {
    if (!this.data.hasMore || this.data.loading) return
    const state = o2oStore.getState()
    loadO2OList({
      page: state.pagination.page + 1,
      pageSize: state.pagination.pageSize,
      keyword: this.data.search,
      category: this.data.selectedCategory,
      sort: this.data.sort
    })
  },

  handleItemTap(e) {
    const { id } = e.currentTarget.dataset
    wx.navigateTo({ url: `/pages/o2o/detail/index?id=${id}` })
  },

  async handlePublish() {
    const allowed = await ensureLogin({
      title: '登录后可发布闲置',
      content: '浏览闲置列表无需登录，发布商品时需要先登录。'
    })
    if (!allowed) return
    wx.navigateTo({ url: '/pages/o2o/publish/index' })
  }
})
