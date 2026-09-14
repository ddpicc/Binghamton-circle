import { uploadImages } from '../../../services/upload'
import { updateProfile } from '../../../services/profile'
import authStore, { updateAuthState } from '../../../stores/authStore'
const { needsProfileCompletion } = require('../../../utils/profile')

Page({
  data: {
    safeTop: 20,
    contentTop: 84,
    avatar: '',
    nickname: '',
    saving: false
  },

  onLoad() {
    const sys = wx.getSystemInfoSync()
    const safeTop = sys.statusBarHeight || 20
    const user = authStore.getState().user || {}
    const profile = user.profile || user
    this.setData({
      safeTop,
      contentTop: safeTop + 64,
      avatar: profile.avatar || '',
      nickname: profile.nickname || ''
    })
  },

  handleChooseAvatar(e) {
    const avatar = e.detail?.avatarUrl || ''
    if (!avatar) return
    this.setData({ avatar })
  },

  handleNicknameInput(e) {
    this.setData({ nickname: String(e.detail.value || '').trim() })
  },

  handleSkip() {
    this.finishFlow()
  },

  async handleSave() {
    const nickname = String(this.data.nickname || '').trim()
    if (!nickname) {
      wx.showToast({ title: '请输入昵称', icon: 'none' })
      return
    }

    this.setData({ saving: true })
    try {
      let avatar = this.data.avatar || ''
      if (avatar && !/^https?:\/\//.test(avatar)) {
        const [uploadedUrl] = await uploadImages([avatar])
        avatar = uploadedUrl || ''
      }

      const response = await updateProfile({ nickname, avatar })
      const user = response.user || response
      updateAuthState({
        user,
        emailVerified: authStore.getState().emailVerified
      })

      const app = getApp()
      app.globalData.user = user
      app.globalData.needsProfileCompletion = needsProfileCompletion(user)

      wx.showToast({ title: '资料已保存', icon: 'success' })
      setTimeout(() => this.finishFlow(), 400)
    } catch (error) {
      console.error('完善资料失败', error)
      wx.showToast({ title: error?.message || '保存失败', icon: 'none' })
    } finally {
      this.setData({ saving: false })
    }
  },

  finishFlow() {
    const app = getApp()
    app.globalData.needsProfileCompletion = false
    wx.navigateBack({ fail: () => wx.switchTab({ url: '/pages/home/index' }) })
  }
})
