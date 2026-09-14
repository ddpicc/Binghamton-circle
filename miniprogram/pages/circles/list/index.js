import circleStore, {
  refreshCircles,
  loadCircles,
  loadOverviewData,
  joinCircleAction,
  quitCircleAction
} from '../../../stores/circleStore'
import authStore from '../../../stores/authStore'

const SORT_OPTIONS = [
  { label: '最新创建', value: 'created_at' },
  { label: '成员最多', value: 'member_count' },
  { label: '帖子最多', value: 'post_count' }
]

const CATEGORY_OPTIONS = [
  { label: '全部圈子', value: '' },
  { label: '学习交流', value: 1 },
  { label: '生活分享', value: 2 },
  { label: '兴趣小组', value: 3 },
  { label: '校园活动', value: 4 },
  { label: '求职招聘', value: 5 }
]

Page({
  data: {
    safeTop: 20,
    searchValue: '',
    sortPickerIndex: 0,
    categoryPickerIndex: 0,
    circles: [],
    loading: false,
    hasMore: true,
    isLoggedIn: !!authStore.getState().token,
    overviewLoading: false,
    stats: {
      total: 0,
      joined: 0
    },
    sortOptions: SORT_OPTIONS,
    categoryOptions: CATEGORY_OPTIONS
  },

  onLoad() {
    const sys = wx.getSystemInfoSync()
    this.setData({
      safeTop: sys.statusBarHeight || 20
    })

    this.unsubscribe = circleStore.subscribe((state) => {
      const buildInitial = (name = '') => {
        const value = (name || '').trim()
        if (!value) return '圈'
        return value.slice(0, 2)
      }

      const circles = [...(state.list.items || [])]
        .sort((a, b) => Number(Boolean(b.is_member)) - Number(Boolean(a.is_member)))
        .map((item) => ({
          ...item,
          __initial: buildInitial(item.name)
        }))
      const sortIndex = SORT_OPTIONS.findIndex((item) => item.value === state.list.filters.sortBy)
      const categoryIndex = CATEGORY_OPTIONS.findIndex(
        (item) => String(item.value) === String(state.list.filters.categoryId || '')
      )

      this.setData({
        circles,
        loading: state.list.loading,
        hasMore: state.list.pagination.hasMore,
        searchValue: state.list.filters.search,
        sortPickerIndex: sortIndex === -1 ? 0 : sortIndex,
        categoryPickerIndex: categoryIndex === -1 ? 0 : categoryIndex,
        overviewLoading: state.overview.loading,
        stats: state.overview.stats
      })
    })

    this.authUnsub = authStore.subscribe((state) => {
      this.setData({
        isLoggedIn: !!state.token
      })
    })

    this.initPage()
  },

  onUnload() {
    this.unsubscribe && this.unsubscribe()
    this.authUnsub && this.authUnsub()
  },

  async initPage() {
    await Promise.all([
      refreshCircles({ page: 1, categoryId: this.resolveCategoryId() }),
      loadOverviewData()
    ])
  },

  async onPullDownRefresh() {
    await Promise.all([
      refreshCircles({
        page: 1,
        search: this.data.searchValue,
        categoryId: this.resolveCategoryId()
      }),
      loadOverviewData()
    ])
    wx.stopPullDownRefresh()
  },

  onReachBottom() {
    if (!this.data.hasMore || this.data.loading) return
    const state = circleStore.getState()
    loadCircles({
      page: state.list.pagination.page + 1,
      pageSize: state.list.pagination.pageSize
    })
  },

  handleLoadMoreTap() {
    this.onReachBottom()
  },

  handleSearchInput(e) {
    this.setData({ searchValue: e.detail.value })
  },

  handleSearchConfirm() {
    this.applyFilters()
  },

  handleClearSearch() {
    this.setData({ searchValue: '' })
    this.applyFilters()
  },

  handleSortChange(e) {
    const index = Number(e.detail.value)
    this.setData({ sortPickerIndex: index })
    this.applyFilters()
  },

  handleCategoryChange(e) {
    const index = Number(e.detail.value)
    this.setData({ categoryPickerIndex: index })
    this.applyFilters()
  },

  handleResetFilters() {
    this.setData({
      searchValue: '',
      sortPickerIndex: 0,
      categoryPickerIndex: 0
    })
    this.applyFilters()
  },

  applyFilters() {
    const sortOption = SORT_OPTIONS[this.data.sortPickerIndex]
    const categoryId = this.resolveCategoryId()

    refreshCircles({
      page: 1,
      search: this.data.searchValue.trim(),
      categoryId,
      sortBy: sortOption?.value,
      sortOrder: 'DESC'
    })
  },

  handleOpenCircle(e) {
    const { id } = e.currentTarget.dataset
    wx.navigateTo({ url: `/pages/circles/detail/index?id=${id}` })
  },

  async handleJoinCircle(e) {
    if (!this.data.isLoggedIn) {
      wx.showToast({ title: '请先完成邮箱验证', icon: 'none' })
      return
    }

    const { id, joined } = e.currentTarget.dataset
    if (joined) {
      await quitCircleAction(id)
    } else {
      await joinCircleAction(id)
    }
  },

  handleCreateCircle() {
    wx.navigateTo({ url: '/pages/circles/manage/index?mode=create' })
  },

  resolveCategoryId() {
    const option = this.data.categoryOptions[this.data.categoryPickerIndex]
    return option ? option.value : ''
  },

  handleBack() {
    wx.navigateBack({
      fail: () => {
        wx.switchTab({ url: '/pages/circles/following/index' })
      }
    })
  }
})
