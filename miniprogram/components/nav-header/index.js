Component({
  properties: {
    title: {
      type: String,
      value: ''
    },
    showBack: {
      type: Boolean,
      value: false
    },
    background: {
      type: String,
      value: 'linear-gradient(135deg, #006633 0%, #00a86b 100%)'
    }
  },

  data: {
    statusBarHeight: 20,
    navHeight: 64
  },

  lifetimes: {
    attached() {
      const info = wx.getSystemInfoSync()
      const statusBarHeight = info.statusBarHeight || 20
      const navHeight = statusBarHeight + 44
      this.setData({ statusBarHeight, navHeight })
    }
  },

  methods: {
    handleBack() {
      const pages = getCurrentPages()
      if (pages.length > 1) {
        wx.navigateBack()
      } else {
        wx.switchTab({ url: '/pages/home/index' })
      }
    }
  }
})
