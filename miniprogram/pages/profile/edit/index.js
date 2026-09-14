import profileStore, { loadProfile, saveProfile } from '../../../stores/profileStore'
import { uploadImages } from '../../../services/upload'
import { bindWechatAccount } from '../../../services/auth'
const authStore = require('../../../stores/authStore')
const { updateAuthState } = require('../../../stores/authStore')

function computeInitial(profile) {
  const name = (profile?.nickname || profile?.username || '').trim()
  if (name) return name.charAt(0).toUpperCase()
  return '我'
}

Page({
  data: {
    safeTop: 20,
    contentTop: 84,
    profile: null,
    form: {
      avatar: '',
      nickname: '',
      gender: '',
      major: '',
      grade: '',
      bio: ''
    },
    birthday: '',
    avatarInitial: '我',
    saving: false,
    wechatBound: false,
    bindingWechat: false
  },

  onLoad() {
    const sys = wx.getSystemInfoSync()
    const safeTop = sys.statusBarHeight || 20
    this.setData({
      safeTop,
      contentTop: safeTop + 64
    })

    this.unsubscribe = profileStore.subscribe((state) => {
      const profile = state.profile || null
      if (!profile) {
        this.setData({ profile: null })
        return
      }
      this.setData({
        profile,
        avatarInitial: computeInitial(profile),
        form: {
          avatar: profile.avatar || '',
          nickname: profile.nickname || '',
          gender: profile.gender || '',
          major: profile.major || '',
          grade: profile.grade || '',
          bio: profile.bio || ''
        }
      })
    })
    this.setData({
      birthday: wx.getStorageSync('profile_birthday') || ''
    })
    this.syncWechatBoundStatus()
    loadProfile()
  },

  onShow() {
    this.syncWechatBoundStatus()
  },

  onUnload() {
    this.unsubscribe && this.unsubscribe()
  },

  handleBack() {
    wx.navigateBack({
      fail: () => wx.switchTab({ url: '/pages/profile/index/index' })
    })
  },

  syncWechatBoundStatus() {
    const state = authStore.getState()
    const user = state.user || {}
    const wechatBound = Boolean(user.wechat_bound || user.wechat_openid)
    this.setData({ wechatBound })
  },

  async handleBindWechat() {
    if (this.data.bindingWechat) return
    this.setData({ bindingWechat: true })
    try {
      const loginResult = await wx.login()
      const code = loginResult?.code || ''
      if (!code) {
        wx.showToast({ title: '获取微信凭证失败', icon: 'none' })
        return
      }

      await bindWechatAccount(code)
      const state = authStore.getState()
      const nextUser = {
        ...(state.user || {}),
        wechat_bound: true
      }
      updateAuthState({ user: nextUser })
      const app = getApp()
      if (app && app.globalData) {
        app.globalData.user = nextUser
      }
      this.setData({ wechatBound: true })
      wx.showToast({ title: '微信绑定成功', icon: 'success' })
    } catch (error) {
      console.error('手动绑定微信失败', error)
      wx.showToast({ title: error?.message || '微信绑定失败', icon: 'none' })
    } finally {
      this.setData({ bindingWechat: false })
    }
  },

  async handleChangeAvatar() {
    try {
      const result = await wx.chooseMedia({ count: 1, mediaType: ['image'] })
      const tempPath = result?.tempFiles?.[0]?.tempFilePath
      if (!tempPath) return
      const [url] = await uploadImages([tempPath])
      if (!url) return
      this.setData({
        form: {
          ...this.data.form,
          avatar: url
        }
      })
    } catch (error) {
      console.warn('选择头像取消或失败', error)
    }
  },

  handleEditGender() {
    const options = ['男', '女', '保密']
    wx.showActionSheet({
      itemList: options,
      success: (res) => {
        const value = options[res.tapIndex] || ''
        this.setData({
          form: {
            ...this.data.form,
            gender: value
          }
        })
      }
    })
  },

  handleEditTextField(e) {
    const { field, title } = e.currentTarget.dataset
    if (!field) return
    const current = field === 'birthday' ? this.data.birthday : (this.data.form[field] || '')
    wx.showModal({
      title: title || '编辑',
      editable: true,
      placeholderText: `请输入${title || ''}`,
      content: current,
      success: (res) => {
        if (!res.confirm) return
        const value = (res.content || '').trim()
        if (field === 'birthday') {
          this.setData({ birthday: value })
          wx.setStorageSync('profile_birthday', value)
          return
        }
        this.setData({
          form: {
            ...this.data.form,
            [field]: value
          }
        })
      }
    })
  },

  async handleSave() {
    if (this.data.saving) return
    this.setData({ saving: true })
    try {
      await saveProfile({
        avatar: this.data.form.avatar,
        nickname: this.data.form.nickname,
        gender: this.data.form.gender,
        major: this.data.form.major,
        grade: this.data.form.grade,
        bio: this.data.form.bio
      })
      await getApp().refreshProfile()
      wx.showToast({ title: '保存成功', icon: 'success' })
      setTimeout(() => {
        wx.navigateBack({ fail: () => wx.switchTab({ url: '/pages/profile/index/index' }) })
      }, 500)
    } catch (error) {
      console.error('保存资料失败', error)
      wx.showToast({ title: '保存失败', icon: 'none' })
    } finally {
      this.setData({ saving: false })
    }
  }
})
