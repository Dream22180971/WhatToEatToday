// index.js
Page({
  data: {
    recipes: [],
    randomRecipes: [],
    isSpinning: false,
    showResults: false,
    remainingSpins: 5
  },

  onLoad() {
    // 从全局数据中获取食谱列表
    const app = getApp()
    this.setData({
      recipes: app.globalData.recipes
    })
    
    // 检查今日旋转次数
    this.checkDailySpins()
  },

  checkDailySpins() {
    const today = new Date().toDateString()
    const lastSpinDate = wx.getStorageSync('lastSpinDate')
    const spinCount = wx.getStorageSync('spinCount') || 0
    
    if (lastSpinDate !== today) {
      // 新的一天，重置旋转次数
      wx.setStorageSync('lastSpinDate', today)
      wx.setStorageSync('spinCount', 0)
      this.setData({ remainingSpins: 5 })
    } else {
      // 当天已旋转的次数
      this.setData({ remainingSpins: 5 - spinCount })
    }
  },

  spinWheel() {
    if (this.data.isSpinning || this.data.remainingSpins <= 0) return
    
    // 减少旋转次数
    const spinCount = (wx.getStorageSync('spinCount') || 0) + 1
    wx.setStorageSync('spinCount', spinCount)
    this.setData({ remainingSpins: 5 - spinCount })
    
    // 开始旋转动画
    this.setData({ isSpinning: true })
    
    // 2秒后停止旋转并生成随机菜品
    setTimeout(() => {
      this.generateRandomRecipes()
      this.setData({ isSpinning: false, showResults: true })
    }, 2000)
  },

  generateRandomRecipes() {
    const recipes = this.data.recipes
    const randomRecipes = []
    const usedIndexes = new Set()
    
    // 保留已锁定的菜品
    const lockedRecipes = this.data.randomRecipes.filter(recipe => recipe.locked)
    
    // 生成新的随机菜品
    const neededCount = 3 - lockedRecipes.length
    for (let i = 0; i < neededCount; i++) {
      let randomIndex
      do {
        randomIndex = Math.floor(Math.random() * recipes.length)
      } while (usedIndexes.has(randomIndex))
      
      usedIndexes.add(randomIndex)
      randomRecipes.push({
        ...recipes[randomIndex],
        locked: false
      })
    }
    
    // 合并锁定的菜品和新生成的菜品
    this.setData({
      randomRecipes: [...lockedRecipes, ...randomRecipes]
    })
  },

  lockRecipe(e) {
    const id = e.currentTarget.dataset.id
    const randomRecipes = this.data.randomRecipes.map(recipe => {
      if (recipe.id === id) {
        return { ...recipe, locked: !recipe.locked }
      }
      return recipe
    })
    this.setData({ randomRecipes })
  },

  spinAgain() {
    if (this.data.remainingSpins <= 0) return
    this.spinWheel()
  },

  selectAll() {
    // 全部选择逻辑
    wx.showToast({
      title: '已选择所有推荐菜品',
      icon: 'success'
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
  preventPropagation(e) {
    e.stopPropagation()
  }
})