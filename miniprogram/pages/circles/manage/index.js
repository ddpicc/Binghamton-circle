import circleStore, {
  loadCircleDetail,
  updateCircleAction,
  loadCircleMembers,
  loadPendingJoinRequests,
  approveJoinRequest,
  rejectJoinRequest,
  removeMember,
  createCircleAction
} from '../../../stores/circleStore'
import authStore from '../../../stores/authStore'
import { uploadImages } from '../../../services/upload'

const CATEGORY_OPTIONS = [
  { id: 1, name: '学术探讨' },
  { id: 2, name: '运动健身' },
  { id: 3, name: '兴趣爱好' },
  { id: 4, name: '校园生活' },
  { id: 5, name: '职业发展' }
]

Page({
  data: {
    circleId: '',
    circle: null,
    loading: false,
    saving: false,
    isAdmin: false,
    isCreateMode: false,
    currentUser: null,
    activeTab: 'basic',
    form: {
      name: '',
      description: '',
      category_id: '',
      rules: '',
      max_members: '',
      cover_image: '',
      icon_image: '',
      is_private: false
    },
    categories: CATEGORY_OPTIONS,
    members: [],
    membersLoading: false,
    pending: [],
    pendingLoading: false,
    displayCategory: '请选择分类',
    categoryIndex: -1,
    safeTop: 20,
    contentTop: 64
  },

  onLoad(options) {
    const { id, mode } = options
    const isCreateMode = mode === 'create'

    const sys = wx.getSystemInfoSync()
    const safeTop = sys.statusBarHeight || 20
    this.setData({
      circleId: id || '',
      isCreateMode,
      safeTop,
      contentTop: safeTop + (isCreateMode ? 64 : 44)
    })

    this.unsubscribe = circleStore.subscribe((state) => {
      if (!isCreateMode) {
        const circle = state.detail.data
        if (circle) {
          const user = this.data.currentUser
          const role = circle.user_role || (circle.creator_id === user?.id ? 'creator' : '')
          const isAdmin = role === 'creator' || role === 'admin' || user?.role === 'admin'

          const categoryIndex = this.findCategoryIndex(circle.category_id)
          this.setData({
            circle,
            loading: state.detail.loading,
            isAdmin,
            form: {
              name: circle.name || '',
              description: circle.description || '',
              category_id: circle.category_id || '',
              rules: circle.rules || '',
              max_members: circle.max_members || '',
              cover_image: circle.cover_image || '',
              icon_image: circle.icon_image || '',
              is_private: circle.is_private || false
            },
            displayCategory: this.findCategoryName(circle.category_id) || '请选择分类',
            categoryIndex
          })
        }
      }

      const members = (state.members.items || []).map((member) => {
        const displayName = member.user?.profile?.nickname || member.user?.username || '成员'
        return {
          ...member,
          displayName,
          avatarInitial: displayName.charAt(0).toUpperCase(),
          roleLabel: member.role === 'creator' ? '创建者' : member.role === 'admin' ? '管理员' : '成员'
        }
      })

      this.setData({
        members,
        membersLoading: state.members.loading,
        pending: (state.members.pending.items || []).map((item) => ({
          ...item,
          displayTime: this.formatDate(item.created_at)
        })),
        pendingLoading: state.members.pending.loading
      })
    })

    this.authUnsub = authStore.subscribe((state) => {
      this.setData({ currentUser: state.user })
    })

    if (!isCreateMode && this.data.circleId) {
      this.initialize()
    }
  },

  findCategoryIndex(id) {
    if (!id) return -1
    return this.data.categories.findIndex((item) => Number(item.id) === Number(id))
  },

  findCategoryName(id) {
    const index = this.findCategoryIndex(id)
    return index >= 0 ? this.data.categories[index].name : ''
  },

  formatDate(value) {
    if (!value) return ''
    const date = new Date(value)
    if (Number.isNaN(date.getTime())) return value
    const month = `${date.getMonth() + 1}`.padStart(2, '0')
    const day = `${date.getDate()}`.padStart(2, '0')
    const hours = `${date.getHours()}`.padStart(2, '0')
    const minutes = `${date.getMinutes()}`.padStart(2, '0')
    return `${month}-${day} ${hours}:${minutes}`
  },

  onUnload() {
    this.unsubscribe && this.unsubscribe()
    this.authUnsub && this.authUnsub()
  },

  async initialize() {
    const detail = await loadCircleDetail(this.data.circleId)
    if (!detail) {
      wx.showToast({ title: '圈子不存在或无权限', icon: 'none' })
      wx.navigateBack()
      return
    }
    await Promise.all([
      loadCircleMembers(this.data.circleId, { status: 'approved' }),
      loadPendingJoinRequests(this.data.circleId)
    ])
  },

  handleTabChange(e) {
    this.setData({ activeTab: e.currentTarget.dataset.tab })
  },

  handleInput(e) {
    const { field } = e.currentTarget.dataset
    this.setData({ [`form.${field}`]: e.detail.value })
  },

  handleCategorySelect(e) {
    const index = Number(e.currentTarget.dataset.index)
    const category = this.data.categories[index]
    this.setData({
      'form.category_id': category ? category.id : '',
      categoryIndex: index,
      displayCategory: category ? category.name : '请选择分类'
    })
  },

  async handleChooseCover() {
    try {
      const res = await wx.chooseMedia({ count: 1, mediaType: ['image'] })
      const paths = res.tempFiles.map((file) => file.tempFilePath)
      const [url] = await uploadImages(paths)
      if (url) {
        this.setData({ 'form.cover_image': url })
      }
    } catch (error) {
      console.error('choose cover error', error)
    }
  },

  async handleChooseIcon() {
    try {
      const res = await wx.chooseMedia({ count: 1, mediaType: ['image'] })
      const paths = res.tempFiles.map((file) => file.tempFilePath)
      const [url] = await uploadImages(paths)
      if (url) {
        this.setData({ 'form.icon_image': url })
      }
    } catch (error) {
      console.error('choose icon error', error)
    }
  },

  handlePublicToggle() {
    this.setData({ 'form.is_private': !this.data.form.is_private })
  },

  async handleSave() {
    if (!this.data.form.name.trim()) {
      wx.showToast({ title: '请输入圈子名称', icon: 'none' })
      return
    }
    if (!this.data.form.category_id) {
      wx.showToast({ title: '请选择分类', icon: 'none' })
      return
    }
    if (!this.data.form.description.trim()) {
      wx.showToast({ title: '请输入圈子描述', icon: 'none' })
      return
    }

    this.setData({ saving: true })
    try {
      if (this.data.isCreateMode) {
        const circle = await createCircleAction({
          name: this.data.form.name.trim(),
          description: this.data.form.description.trim(),
          category_id: this.data.form.category_id,
          rules: this.data.form.rules.trim(),
          max_members: this.data.form.max_members ? Number(this.data.form.max_members) : undefined,
          cover_image: this.data.form.cover_image,
          icon_image: this.data.form.icon_image,
          is_private: this.data.form.is_private
        })
        if (circle && circle.id) {
          wx.redirectTo({ url: `/pages/circles/detail/index?id=${circle.id}` })
        }
      } else {
        await updateCircleAction(this.data.circleId, {
          name: this.data.form.name.trim(),
          description: this.data.form.description.trim(),
          category_id: this.data.form.category_id,
          rules: this.data.form.rules.trim(),
          max_members: this.data.form.max_members ? Number(this.data.form.max_members) : undefined,
          cover_image: this.data.form.cover_image,
          icon_image: this.data.form.icon_image,
          is_private: this.data.form.is_private
        })
      }
    } finally {
      this.setData({ saving: false })
    }
  },

  async handleApprove(e) {
    const { memberId } = e.currentTarget.dataset
    await approveJoinRequest(this.data.circleId, memberId)
  },

  async handleReject(e) {
    const { memberId } = e.currentTarget.dataset
    await rejectJoinRequest(this.data.circleId, memberId)
  },

  async handleRemoveMember(e) {
    const { memberId } = e.currentTarget.dataset
    await removeMember(this.data.circleId, memberId)
  },

  handleBack() {
    const pages = getCurrentPages()
    if (pages.length > 1) {
      wx.navigateBack()
    } else {
      wx.switchTab({ url: '/pages/circles/following/index' })
    }
  }
})
