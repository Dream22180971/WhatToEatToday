// favorites.js
Page({
  data: {
    favorites: []
  },

  onLoad() {
    this.loadFavorites()
  },

  onShow() {
    // 每次页面显示时重新加载收藏数据
    this.loadFavorites()
  },

  // 加载收藏的食谱
  loadFavorites() {
    const app = getApp()
    const favoriteRecipes = app.getFavoriteRecipes()
    this.setData({
      favorites: favoriteRecipes
    })
  },

  // 导航到食谱详情页面
  navigateToDetail(e) {
    const recipeId = e.currentTarget.dataset.id
    wx.navigateTo({
      url: `/pages/detail/detail?id=${recipeId}`
    })
  },

  // 移除收藏
  removeFavorite(e) {
    const recipeId = e.currentTarget.dataset.id
    const app = getApp()
    app.removeFavorite(recipeId)
    this.loadFavorites()
  },

  // 导航到首页
  navigateToHome() {
    wx.switchTab({
      url: '/pages/index/index'
    })
  },

  // 阻止事件冒泡
  preventPropagation() {
    // 阻止事件冒泡到父元素
  }
})