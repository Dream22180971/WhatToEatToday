// profile.js
Page({
  data: {
    stats: {
      tried: 12,
      favorites: 5,
      created: 0
    },
    settings: {
      notifications: true,
      darkMode: false
    }
  },

  onLoad() {
    // 加载用户数据
    this.loadUserData()
  },

  // 加载用户数据
  loadUserData() {
    const app = getApp()
    // 从全局数据中获取收藏数量
    const favoritesCount = app.globalData.favorites.length
    this.setData({
      stats: {
        ...this.data.stats,
        favorites: favoritesCount
      }
    })
  },

  // 切换设置
  toggleSetting(e) {
    const setting = e.currentTarget.dataset.setting
    const value = e.detail.value
    
    this.setData({
      settings: {
        ...this.data.settings,
        [setting]: value
      }
    })
    
    // 保存设置到本地存储
    wx.setStorageSync('settings', this.data.settings)
  },

  // 登出
  logout() {
    wx.showModal({
      title: 'Log Out',
      content: 'Are you sure you want to log out?',
      success: (res) => {
        if (res.confirm) {
          // 清除用户数据
          wx.removeStorageSync('userInfo')
          wx.removeStorageSync('favorites')
          wx.removeStorageSync('settings')
          
          // 跳转到登录页面（如果有）
          wx.showToast({
            title: 'Logged out successfully',
            icon: 'success'
          })
        }
      }
    })
  }
})