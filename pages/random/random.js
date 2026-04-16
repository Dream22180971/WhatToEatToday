// search.js
Page({
  data: {
    searchQuery: '',
    searchResults: [],
    recommendedRecipes: [],
    hotKeywords: ['鸡蛋', '红烧肉', '糖醋排骨', '鱼香肉丝', '宫保鸡丁'],
    searchHistory: [],
    hasSearched: false
  },

  onLoad() {
    // 加载推荐食谱
    this.loadRecommendedRecipes()
    // 加载搜索历史
    this.loadSearchHistory()
  },

  loadRecommendedRecipes() {
    const app = getApp()
    // 随机获取3个食谱作为推荐
    const recipes = app.globalData.recipes
    const recommended = []
    const usedIndexes = new Set()
    
    for (let i = 0; i < 3 && i < recipes.length; i++) {
      let randomIndex
      do {
        randomIndex = Math.floor(Math.random() * recipes.length)
      } while (usedIndexes.has(randomIndex))
      
      usedIndexes.add(randomIndex)
      recommended.push(recipes[randomIndex])
    }
    
    this.setData({ recommendedRecipes: recommended })
  },

  loadSearchHistory() {
    const history = wx.getStorageSync('searchHistory') || []
    this.setData({ searchHistory: history })
  },

  onSearchInput(e) {
    this.setData({ searchQuery: e.detail.value })
  },

  performSearch() {
    const query = this.data.searchQuery.trim()
    if (!query) return
    
    // 保存到搜索历史
    this.saveSearchHistory(query)
    
    // 执行搜索
    const app = getApp()
    const recipes = app.globalData.recipes
    const results = recipes.filter(recipe => {
      // 搜索标题、标签、食材
      const titleMatch = recipe.title.includes(query)
      const tagsMatch = recipe.tags.some(tag => tag.includes(query))
      const ingredientsMatch = recipe.ingredients.some(ingredient => ingredient.includes(query))
      return titleMatch || tagsMatch || ingredientsMatch
    })
    
    this.setData({
      searchResults: results,
      hasSearched: true
    })
  },

  saveSearchHistory(keyword) {
    let history = wx.getStorageSync('searchHistory') || []
    // 移除重复项
    history = history.filter(item => item !== keyword)
    // 添加到开头
    history.unshift(keyword)
    // 限制历史记录数量
    if (history.length > 10) {
      history = history.slice(0, 10)
    }
    wx.setStorageSync('searchHistory', history)
    this.setData({ searchHistory: history })
  },

  clearSearch() {
    this.setData({ searchQuery: '' })
  },

  clearHistory() {
    wx.setStorageSync('searchHistory', [])
    this.setData({ searchHistory: [] })
  },

  searchWithHistory(e) {
    const keyword = e.currentTarget.dataset.keyword
    this.setData({ searchQuery: keyword })
    this.performSearch()
  },

  searchWithHotKeyword(e) {
    const keyword = e.currentTarget.dataset.keyword
    this.setData({ searchQuery: keyword })
    this.performSearch()
  },

  navigateToDetail(e) {
    const recipeId = e.currentTarget.dataset.id
    wx.navigateTo({
      url: `/pages/detail/detail?id=${recipeId}`
    })
  }
})