import o2oStore, { loadO2ODetail, removeO2OItem } from '../../../stores/o2oStore'
import authStore from '../../../stores/authStore'
import { ensureLogin } from '../../../utils/auth'

function formatItem(raw) {
  if (!raw) return raw
  const contact =
    typeof raw.contact_info === 'string'
      ? { text: raw.contact_info }
      : raw.contact_info || {}
  return { ...raw, contact }
}

Page({
  data: {
    safeTop: 20,
    item: null,
    isOwner: false,
    isAdmin: false,
    canManage: false
  },

  async onLoad(options) {
    const sys = wx.getSystemInfoSync()
    this.setData({ safeTop: sys.statusBarHeight || 20 })

    const { id } = options
    this.unsubscribe = o2oStore.subscribe((state) => {
      if (state.currentItem) {
        this.setData({ item: formatItem(state.currentItem) })
        this.refreshOwnership()
      }
    })
    this.authUnsub = authStore.subscribe(() => this.refreshOwnership())

    if (id) {
      const detail = await loadO2ODetail(id)
      this.setData({ item: formatItem(detail) })
      this.refreshOwnership()
    }
  },

  onUnload() {
    this.unsubscribe && this.unsubscribe()
    this.authUnsub && this.authUnsub()
  },

  refreshOwnership() {
    const user = authStore.getState().user
    const item = this.data.item
    if (!item) return
    const isOwner = user && item.user_id === user.id
    const isAdmin = user && user.role === 'admin'
    this.setData({ isOwner, isAdmin, canManage: !!(isOwner || isAdmin) })
  },

  handleBack() {
    wx.navigateBack({
      fail: () => wx.switchTab({ url: '/pages/o2o/list/index' })
    })
  },

  async handleEdit() {
    if (!this.data.item) return
    const allowed = await ensureLogin({
      title: '登录后可编辑闲置',
      content: '浏览商品详情无需登录，编辑自己发布的商品时需要先登录。'
    })
    if (!allowed) return
    wx.navigateTo({ url: `/pages/o2o/publish/index?id=${this.data.item.id}` })
  },

  handleMoreTap() {
    if (!this.data.canManage || !this.data.item) return

    wx.showActionSheet({
      itemList: ['编辑物品', '删除物品'],
      success: (result) => {
        if (result.tapIndex === 0) {
          this.handleEdit()
          return
        }

        if (result.tapIndex === 1) {
          this.handleDelete()
        }
      }
    })
  },

  handleDelete() {
    if (!this.data.item) return
    wx.showModal({
      title: '删除物品',
      content: '确认删除该物品？',
      success: async (res) => {
        if (res.confirm) {
          await removeO2OItem(this.data.item.id)
          wx.navigateBack()
        }
      }
    })
  }
})
