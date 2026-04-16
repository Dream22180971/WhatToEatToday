// detail.js
Page({
  data: {
    recipe: null,
    isFavorite: false
  },

  onLoad(options) {
    const recipeId = parseInt(options.id)
    this.loadRecipe(recipeId)
  },

  // 加载食谱数据
  loadRecipe(recipeId) {
    const app = getApp()
    const recipe = app.globalData.recipes.find(r => r.id === recipeId)
    
    if (recipe) {
      this.setData({
        recipe: recipe,
        isFavorite: app.isFavorite(recipeId)
      })
    } else {
      wx.showToast({
        title: '食谱未找到',
        icon: 'none'
      })
      wx.navigateBack()
    }
  },

  // 返回上一页
  navigateBack() {
    wx.navigateBack()
  },

  // 切换收藏状态
  toggleFavorite() {
    if (!this.data.recipe) return
    
    const app = getApp()
    const recipeId = this.data.recipe.id
    
    if (app.isFavorite(recipeId)) {
      app.removeFavorite(recipeId)
      this.setData({ isFavorite: false })
    } else {
      app.addFavorite(recipeId)
      this.setData({ isFavorite: true })
    }
  },

  // 分享食谱
  shareRecipe() {
    if (!this.data.recipe) return
    
    wx.showShareMenu({
      withShareTicket: true,
      menus: ['shareAppMessage', 'shareTimeline']
    })
  },

  // 分享到好友
  onShareAppMessage() {
    if (!this.data.recipe) return
    
    return {
      title: this.data.recipe.title,
      path: `/pages/detail/detail?id=${this.data.recipe.id}`,
      imageUrl: this.data.recipe.image
    }
  },

  // 分享到朋友圈
  onShareTimeline() {
    if (!this.data.recipe) return
    
    return {
      title: this.data.recipe.title,
      imageUrl: this.data.recipe.image
    }
  }
})