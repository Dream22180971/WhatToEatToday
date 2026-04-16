// random.js
Page({
  data: {
    selectedRecipe: null,
    isSpinning: false
  },

  onLoad() {
    // 初始化时随机选择一个食谱
    this.selectRandomRecipe()
  },

  // 随机选择食谱
  selectRandomRecipe() {
    const app = getApp()
    const randomRecipe = app.getRandomRecipe()
    this.setData({
      selectedRecipe: randomRecipe
    })
  },

  // 旋转轮盘
  spinWheel() {
    if (this.data.isSpinning) return
    
    this.setData({ isSpinning: true })
    
    // 模拟轮盘旋转动画
    setTimeout(() => {
      this.selectRandomRecipe()
      this.setData({ isSpinning: false })
    }, 1000)
  },

  // 调整口味偏好
  adjustCravings() {
    wx.showToast({
      title: '功能开发中',
      icon: 'none'
    })
  },

  // 导航到食谱详情页面
  navigateToDetail() {
    if (!this.data.selectedRecipe) return
    
    wx.navigateTo({
      url: `/pages/detail/detail?id=${this.data.selectedRecipe.id}`
    })
  }
})