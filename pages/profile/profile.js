// profile.js
Page({
  data: {
    stats: {
      tried: 0,
      favorites: 0,
      points: 0
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

  onShow() {
    // 每次页面显示时重新加载数据
    this.loadUserData()
  },

  // 加载用户数据
  loadUserData() {
    const app = getApp()
    // 从全局数据中获取收藏数量
    const favoritesCount = app.globalData.favorites.length
    this.setData({
      stats: {
        tried: 0,
        favorites: favoritesCount,
        points: Math.floor(favoritesCount * 10)
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

  // 导航到收藏页面
  navigateToFavorites() {
    wx.navigateTo({
      url: '/pages/favorites/favorites'
    })
  },

  // 显示用户协议
  showUserAgreement() {
    wx.showModal({
      title: '用户协议',
      content: '欢迎使用今天吃什么小程序。本协议旨在规范用户使用本小程序的行为，保护用户和开发者的合法权益。\n\n1. 用户在使用本小程序时，应当遵守相关法律法规。\n2. 用户不得利用本小程序从事违法活动。\n3. 开发者保留对本协议的最终解释权。',
      showCancel: false
    })
  },

  // 显示隐私政策
  showPrivacyPolicy() {
    wx.showModal({
      title: '隐私政策',
      content: '本小程序重视用户隐私保护。\n\n1. 我们不会收集用户的个人信息。\n2. 我们会存储用户的收藏记录在本地。\n3. 我们不会将用户数据分享给第三方。\n4. 用户可以随时清除本地存储的数据。',
      showCancel: false
    })
  }
})