import {
  publishPost,
  loadPosts
} from '../../../stores/treeHoleStore'
import { uploadImages } from '../../../services/upload'
import { showError } from '../../../utils/toast'
import { ensureLogin } from '../../../utils/auth'

const PAGE_SIZE = 10

Page({
  data: {
    safeTop: 20,
    content: '',
    images: [],
    submitting: false
  },

  async onLoad() {
    const sys = wx.getSystemInfoSync()
    this.setData({ safeTop: sys.statusBarHeight || 20 })
    const allowed = await ensureLogin({
      title: '登录后可发树洞',
      content: '浏览树洞内容无需登录，发帖时需要先登录。'
    })
    if (!allowed) {
      wx.navigateBack({
        fail: () => wx.switchTab({ url: '/pages/treehole/list/index' })
      })
    }
  },

  handleClose() {
    wx.navigateBack({
      fail: () => wx.switchTab({ url: '/pages/treehole/list/index' })
    })
  },

  handleContentInput(e) {
    this.setData({ content: e.detail.value })
  },

  handleImageChange(e) {
    const nextImages = e.detail || []
    if (nextImages.length > 9) {
      showError('最多选择 9 张图片')
      return
    }
    this.setData({ images: nextImages })
  },

  async handleSubmit() {
    if (this.data.submitting) return
    const content = (this.data.content || '').trim()
    if (!content) {
      showError('请输入要分享的内容')
      return
    }

    this.setData({ submitting: true })

    try {
      let imageUrls = []
      if (Array.isArray(this.data.images) && this.data.images.length > 0) {
        imageUrls = await uploadImages(this.data.images)
      }

      await publishPost({ content, images: imageUrls.filter(Boolean) })
      try {
        await loadPosts({ page: 1, pageSize: PAGE_SIZE })
      } catch (err) {
        console.warn('刷新树洞列表失败', err)
      }
      this.setData({ content: '', images: [] })
      wx.navigateBack({ delta: 1 })
    } catch (error) {
      console.error('发布失败', error)
      if (!error?.toastShown) {
        showError(error?.message || '发布失败，请稍后重试')
      }
    } finally {
      this.setData({ submitting: false })
    }
  }
})
