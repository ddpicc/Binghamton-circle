const authStore = require('../../../stores/authStore')
const { updateAuthState } = require('../../../stores/authStore')
const { setPassword } = require('../../../services/auth')

Page({
  data: {
    hasPassword: false,
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
    saving: false
  },

  onLoad() {
    const state = authStore.getState()
    this.setData({
      hasPassword: !!(state.hasPassword || state.user?.has_password)
    })
  },

  handleInput(e) {
    const { field } = e.currentTarget.dataset
    this.setData({ [field]: e.detail.value || '' })
  },

  async handleSave() {
    const { hasPassword, currentPassword, newPassword, confirmPassword } = this.data
    if (hasPassword && !currentPassword) {
      wx.showToast({ title: '请输入当前密码', icon: 'none' })
      return
    }
    if (!newPassword || newPassword.length < 6) {
      wx.showToast({ title: '新密码至少6位', icon: 'none' })
      return
    }
    if (newPassword !== confirmPassword) {
      wx.showToast({ title: '两次输入的密码不一致', icon: 'none' })
      return
    }

    this.setData({ saving: true })
    try {
      await setPassword({
        currentPassword,
        newPassword
      })
      const app = getApp()
      const state = authStore.getState()
      updateAuthState({
        hasPassword: true,
        user: {
          ...(state.user || {}),
          has_password: true
        }
      })
      app.globalData.hasPassword = true
      wx.showToast({ title: hasPassword ? '密码已更新' : '密码已设置', icon: 'success' })
      setTimeout(() => wx.navigateBack(), 500)
    } catch (error) {
      console.error('设置密码失败', error)
      wx.showToast({ title: error?.message || '设置失败', icon: 'none' })
    } finally {
      this.setData({ saving: false })
    }
  }
})
