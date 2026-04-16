// index.js
Page({
  data: {
    recipes: []
  },

  onLoad() {
    // 从全局数据中获取食谱列表
    const app = getApp()
    this.setData({
      recipes: app.globalData.recipes
    })
  },

  // 导航到随机推荐页面
  navigateToRandom() {
    wx.navigateTo({
      url: '/pages/random/random'
    })
  },

  // 导航到收藏页面
  navigateToFavorites() {
    wx.navigateTo({
      url: '/pages/favorites/favorites'
    })
  },

  // 导航到食谱详情页面
  navigateToDetail(e) {
    const recipeId = e.currentTarget.dataset.id
    wx.navigateTo({
      url: `/pages/detail/detail?id=${recipeId}`
    })
  },

  // 切换收藏状态
  toggleFavorite(e) {
    const recipeId = e.currentTarget.dataset.id
    const app = getApp()
    
    if (app.isFavorite(recipeId)) {
      app.removeFavorite(recipeId)
    } else {
      app.addFavorite(recipeId)
    }
    
    // 重新渲染页面
    this.setData({})
  },

  // 检查是否收藏
  isFavorite(recipeId) {
    const app = getApp()
    return app.isFavorite(recipeId)
  },

  // 阻止事件冒泡
  preventPropagation() {
    // 阻止事件冒泡到父元素
  }
})