// favorites.js
Page({
  data: {
    favorites: [],
    filteredFavorites: [],
    categories: [],
    selectedCategory: 'all',
    editMode: false,
    selectedItems: [],
    selectedCount: 0
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
    
    // 提取所有分类
    const categories = [...new Set(favoriteRecipes.map(recipe => recipe.category))]
    
    this.setData({
      favorites: favoriteRecipes,
      filteredFavorites: favoriteRecipes,
      categories: categories,
      selectedCategory: 'all',
      editMode: false,
      selectedItems: [],
      selectedCount: 0
    })
  },

  // 选择分类
  selectCategory(e) {
    const category = e.currentTarget.dataset.category
    this.setData({ selectedCategory: category })
    this.filterFavorites()
  },

  // 筛选收藏
  filterFavorites() {
    const { favorites, selectedCategory } = this.data
    let filtered
    
    if (selectedCategory === 'all') {
      filtered = favorites
    } else {
      filtered = favorites.filter(recipe => recipe.category === selectedCategory)
    }
    
    this.setData({ filteredFavorites: filtered })
  },

  // 切换编辑模式
  toggleEditMode() {
    this.setData({
      editMode: !this.data.editMode,
      selectedItems: [],
      selectedCount: 0
    })
  },

  // 切换选择状态
  toggleSelect(e) {
    const recipeId = e.currentTarget.dataset.id
    const { selectedItems } = this.data
    let newSelectedItems
    
    if (selectedItems.includes(recipeId)) {
      newSelectedItems = selectedItems.filter(id => id !== recipeId)
    } else {
      newSelectedItems = [...selectedItems, recipeId]
    }
    
    this.setData({
      selectedItems: newSelectedItems,
      selectedCount: newSelectedItems.length
    })
  },

  // 全选
  selectAll() {
    const { filteredFavorites, selectedItems } = this.data
    const allIds = filteredFavorites.map(recipe => recipe.id)
    let newSelectedItems
    
    if (selectedItems.length === allIds.length) {
      newSelectedItems = []
    } else {
      newSelectedItems = allIds
    }
    
    this.setData({
      selectedItems: newSelectedItems,
      selectedCount: newSelectedItems.length
    })
  },

  // 批量删除
  batchRemove() {
    const { selectedItems } = this.data
    if (selectedItems.length === 0) return
    
    wx.showModal({
      title: '确认删除',
      content: `确定要删除${selectedItems.length}个收藏吗？`,
      success: (res) => {
        if (res.confirm) {
          const app = getApp()
          selectedItems.forEach(id => {
            app.removeFavorite(id)
          })
          this.loadFavorites()
        }
      }
    })
  },

  // 导航到食谱详情页面
  navigateToDetail(e) {
    if (this.data.editMode) return
    
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
  preventPropagation(e) {
    e.stopPropagation()
  }
})