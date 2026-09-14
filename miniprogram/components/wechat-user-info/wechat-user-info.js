// 获取微信用户信息的组件
// 按照微信小程序最佳实践，应该在用户主动点击时获取用户信息

Component({
  properties: {
    // 是否显示获取用户信息的按钮
    show: {
      type: Boolean,
      value: false
    },
    // 按钮类型
    type: {
      type: String,
      value: 'primary' // primary, default
    },
    // 按钮大小
    size: {
      type: String,
      value: 'default' // default, mini, small
    }
  },

  data: {
    loading: false
  },

  methods: {
    // 获取用户信息
    async getUserProfile() {
      if (this.data.loading) return;

      this.setData({ loading: true });

      try {
        // 使用 wx.getUserProfile 获取用户信息
        const userProfile = await this.getUserProfilePromise();

        if (userProfile) {
          // 发送用户信息到后端
          await this.updateUserInfo(userProfile);

          // 触发成功事件
          this.triggerEvent('success', userProfile);
        }
      } catch (error) {
        console.error('获取用户信息失败:', error);

        // 触发失败事件
        this.triggerEvent('fail', error);

        // 如果用户拒绝，不显示错误提示
        if (error.errMsg !== 'getUserProfile:fail auth deny') {
          wx.showToast({
            title: '获取用户信息失败',
            icon: 'none'
          });
        }
      } finally {
        this.setData({ loading: false });
      }
    },

    // Promise 封装 wx.getUserProfile
    getUserProfilePromise() {
      return new Promise((resolve, reject) => {
        wx.getUserProfile({
          desc: '用于完善会员资料', // 声明获取用户个人信息后的用途
          success: (res) => {
            const { userInfo } = res;
            resolve({
              nickname: userInfo.nickName,
              avatar: userInfo.avatarUrl,
              gender: userInfo.gender,
              city: userInfo.city,
              province: userInfo.province,
              country: userInfo.country
            });
          },
          fail: (error) => {
            reject(error);
          }
        });
      });
    },

    // 更新用户信息到后端
    async updateUserInfo(userInfo) {
      const { updateWechatUserInfo } = require('../services/auth');

      try {
        const result = await updateWechatUserInfo(userInfo);

        // 更新全局用户信息
        const app = getApp();
        if (app.globalData.user) {
          app.globalData.user = {
            ...app.globalData.user,
            ...result.user
          };
        }

        // 更新store中的用户信息
        const authStore = require('../stores/authStore').default;
        const { updateAuthState } = require('../stores/authStore');
        const currentState = authStore.getState();
        updateAuthState({
          user: {
            ...currentState.user,
            ...result.user
          }
        });

        wx.showToast({
          title: '信息更新成功',
          icon: 'success'
        });
      } catch (error) {
        console.error('更新用户信息失败:', error);
        throw error;
      }
    }
  }
});