import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { Button, View, Text, Image } from '@tarojs/components'
import Taro, { useDidShow, useRouter } from '@tarojs/taro'
import type { Favorite, Ingredient, MealLog, Recipe, ShoppingItem } from '../../types'
import { loadDB, saveDB } from '../../services/storage'
import { cn } from '../../lib/utils'
import { Icon } from '../../components/Icon'
import { generateRecipeCover } from '../../services/recipeImage'
import './index.css'

const MEAL_LABEL: Record<string, string> = {
  breakfast: '能量早餐',
  lunch: '元气午餐',
  dinner: '暖心宵夜',
  snack: '馋嘴零食',
}

function todayISO(): string {
  const d = new Date()
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

function inferMealSlot(): MealLog['mealType'] {
  const h = new Date().getHours()
  if (h >= 5 && h < 10) return 'breakfast'
  if (h >= 10 && h < 14) return 'lunch'
  if (h >= 14 && h < 17) return 'snack'
  if (h >= 17 && h < 22) return 'dinner'
  return 'snack'
}

export default function RecipeDetailPage() {
  const router = useRouter()
  const [recipe, setRecipe] = useState<Recipe | null>(null)
  const [favorites, setFavorites] = useState<Favorite[]>([])
  const [generating, setGenerating] = useState(false)
  const [uploadingCover, setUploadingCover] = useState(false)
  const [shopping, setShopping] = useState<ShoppingItem[]>([])

  const recipeIdParam = (router.params?.id as string | undefined) || ''

  const refreshPageData = useCallback(() => {
    if (!recipeIdParam) return
    const db = loadDB()
    const r = db.recipes?.find((x) => x.id === recipeIdParam) || null
    setRecipe(r)
    setFavorites(db.favorites || [])
    setShopping(db.shopping || [])
  }, [recipeIdParam])

  useEffect(() => {
    refreshPageData()
  }, [refreshPageData])

  useDidShow(() => {
    refreshPageData()
  })

  const isInShoppingList = (name: string, type: 'ingredient' | 'seasoning') =>
    shopping.some((s) => s.name === name && s.type === type && !s.completed)

  const allRecipeItemsInShopping = useMemo(() => {
    if (!recipe) return false
    const rows: { name: string; type: 'ingredient' | 'seasoning' }[] = [
      ...recipe.ingredients.map((i) => ({ name: i.name, type: 'ingredient' as const })),
      ...(recipe.seasonings || []).map((s) => ({ name: s.name, type: 'seasoning' as const })),
    ]
    if (!rows.length) return false
    return rows.every((row) => isInShoppingList(row.name, row.type))
  }, [recipe, shopping])

  const isFavorite = useMemo(
    () => (recipe ? favorites.some((f) => f.recipeId === recipe.id) : false),
    [favorites, recipe]
  )

  const toggleFavorite = () => {
    if (!recipe) return
    const db = loadDB()
    const cur = db.favorites || []
    const next = cur.some((f) => f.recipeId === recipe.id)
      ? cur.filter((f) => f.recipeId !== recipe.id)
      : [...cur, { id: Date.now().toString(), userId: 'user', recipeId: recipe.id, createdAt: new Date().toISOString() }]
    setFavorites(next)
    saveDB({
      recipes: db.recipes || [],
      logs: db.logs || [],
      shopping: db.shopping || [],
      favorites: next,
      profile: db.profile,
    })
    Taro.showToast({ title: isFavorite ? '已取消收藏' : '已收藏', icon: 'success' })
  }

  const logMeal = () => {
    if (!recipe) return
    const db = loadDB()
    const date = todayISO()
    const mealType = inferMealSlot()
    const log: MealLog = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      userId: 'user',
      date,
      mealType,
      recipeId: recipe.id,
      recipeTitle: recipe.title,
    }
    const next = [...(db.logs || []), log]
    saveDB({
      recipes: db.recipes || [],
      logs: next,
      shopping: db.shopping || [],
      favorites: db.favorites || [],
      profile: db.profile,
    })
    Taro.showToast({ title: '已记入饮食历程', icon: 'success' })
  }

  const addToShopping = (entries: { item: Ingredient; type: 'ingredient' | 'seasoning' }[]) => {
    if (!recipe || !entries.length) return
    const db = loadDB()
    let currentShopping = [...(db.shopping || [])]
    let addedCount = 0
    
    entries.forEach((entry) => {
      const { item, type } = entry
      const amount = `${item.amount}${item.unit}`
      
      // 查找是否已存在相同的食材
      const existingIndex = currentShopping.findIndex(
        (s) => s.name === item.name && s.type === type && !s.completed
      )
      
      if (existingIndex !== -1) {
        // 已存在，尝试合并数量
        const existingItem = currentShopping[existingIndex]
        const existingAmount = existingItem.amount
        
        // 尝试解析数量和单位
        const existingMatch = existingAmount.match(/(\d+\.?\d*)(.*)/)
        const newMatch = amount.match(/(\d+\.?\d*)(.*)/)
        
        if (existingMatch && newMatch && existingMatch[2].trim() === newMatch[2].trim()) {
          // 单位相同，累加数量
          const sum = parseFloat(existingMatch[1]) + parseFloat(newMatch[1])
          currentShopping[existingIndex] = {
            ...existingItem,
            amount: `${sum}${newMatch[2]}`
          }
        } else if (!existingAmount.includes(amount)) {
          // 单位不同，合并为逗号分隔
          currentShopping[existingIndex] = {
            ...existingItem,
            amount: `${existingAmount}, ${amount}`
          }
        }
      } else {
        // 不存在，添加新项
        currentShopping.push({
          id: Math.random().toString(36).slice(2, 11),
          userId: 'user',
          name: item.name,
          amount: amount,
          completed: false,
          recipeId: recipe.id,
          type: type,
        })
        addedCount++
      }
    })
    
    saveDB({
      recipes: db.recipes || [],
      logs: db.logs || [],
      shopping: currentShopping,
      favorites: db.favorites || [],
      profile: db.profile,
    })
    setShopping(currentShopping)
    Taro.showToast({ title: addedCount > 0 ? '已加入清单' : '已更新清单', icon: 'success' })
  }

  const updateRecipeCoverImage = (imageUrl: string) => {
    if (!recipe) return
    const db = loadDB()
    const nextRecipes = (db.recipes || []).map((r) =>
      r.id === recipe.id ? { ...r, image: imageUrl } : r
    )
    saveDB({
      recipes: nextRecipes,
      logs: db.logs || [],
      shopping: db.shopping || [],
      favorites: db.favorites || [],
      profile: db.profile,
    })
    setRecipe({ ...recipe, image: imageUrl })
  }

  const pickCoverFromDevice = async () => {
    if (!recipe || uploadingCover || generating) return
    let tempPath = ''
    try {
      const res = await Taro.chooseMedia({
        count: 1,
        mediaType: ['image'],
        sourceType: ['album', 'camera'],
        sizeType: ['compressed'],
      })
      const file = res.tempFiles?.[0]
      if (!file?.tempFilePath) return
      tempPath = file.tempFilePath
    } catch {
      return
    }

    setUploadingCover(true)
    Taro.showLoading({ title: '保存封面...', mask: true })
    try {
      let finalPath = tempPath
      try {
        const saved = await Taro.saveFile({ tempFilePath: tempPath })
        finalPath = (saved as any).savedFilePath || finalPath
      } catch {
        // 存储配额等：仍用临时路径，可能随缓存清理失效
      }
      updateRecipeCoverImage(finalPath)
      Taro.hideLoading()
      Taro.showToast({ title: '封面已更新', icon: 'success' })
    } catch {
      Taro.hideLoading()
      Taro.showToast({ title: '保存失败', icon: 'none' })
    } finally {
      setUploadingCover(false)
    }
  }

  const generateCover = async () => {
    if (!recipe || generating || uploadingCover) return
    setGenerating(true)
    Taro.showLoading({ title: 'AI 绘制中...', mask: true })
    try {
      const url = await generateRecipeCover(recipe.title, recipe.description)
      if (!url) throw new Error('未返回图片 URL')
      updateRecipeCoverImage(url)
      Taro.hideLoading()
      Taro.showToast({ title: '封面已生成', icon: 'success' })
    } catch (e: any) {
      Taro.hideLoading()
      const msg = e?.message || '生成失败'
      Taro.showModal({
        title: 'AI 绘图失败',
        content: msg.length > 120 ? msg.slice(0, 120) + '…' : msg,
        showCancel: false,
        confirmText: '好的',
      })
    } finally {
      setGenerating(false)
    }
  }

  if (!recipe) {
    return (
      <View className="min-h-screen flex items-center justify-center bg-warm-bg">
        <Text className="text-espresso-40 font-bold">菜谱加载中…</Text>
      </View>
    )
  }

  return (
    <View className="min-h-screen bg-white animate-page-in">
      {/* Hero 图 */}
      <View className="relative">
        <View className="aspect-4x3 bg-orange-50 overflow-hidden rounded-48px flex items-center justify-center" style={{ borderBottomLeftRadius: '96rpx', borderBottomRightRadius: '96rpx' }}>
          {recipe.image ? (
            <Image src={recipe.image} mode="aspectFill" className="w-full h-full" />
          ) : (
            <Icon name="chef-hat" size={120} color="#fdba74" strokeWidth={1} />
          )}
        </View>
        <View
          className="absolute w-11 h-11 bg-white rounded-2xl flex items-center justify-center shadow-md press-strong"
          style={{ top: '80rpx', left: '48rpx' }}
          onClick={() => Taro.navigateBack().catch(() => Taro.switchTab({ url: '/pages/home/index' }))}
        >
          <Icon name="x" size={20} color="#4D3E3E" strokeWidth={2.4} />
        </View>
        <View
          className={cn('absolute w-11 h-11 rounded-2xl flex items-center justify-center shadow-md press-strong', isFavorite ? 'bg-primary' : 'bg-white')}
          style={{ top: '80rpx', right: '112rpx' }}
          onClick={toggleFavorite}
        >
          <Icon name="heart" size={20} color={isFavorite ? '#ffffff' : '#4D3E3E'} strokeWidth={2.4} fill={isFavorite ? '#ffffff' : 'none'} />
        </View>

        {/* 本地上传封面 */}
        <View
          className={cn(
            'absolute flex items-center gap-2 px-5 py-3 rounded-full shadow-lg press-strong',
            uploadingCover ? 'bg-orange-50' : 'bg-white-90'
          )}
          style={{ bottom: '40rpx', left: '48rpx' }}
          onClick={pickCoverFromDevice}
        >
          <Icon name="camera" size={14} color="#FF7E33" strokeWidth={2.4} />
          <Text className={cn('text-11px font-black', uploadingCover ? 'text-espresso-40' : 'text-primary')}>
            {uploadingCover ? '处理中...' : '上传封面'}
          </Text>
        </View>

        {/* AI 生成封面 */}
        <View
          className={cn(
            'absolute flex items-center gap-2 px-5 py-3 rounded-full shadow-orange press-strong',
            generating ? 'bg-white-90' : 'bg-primary'
          )}
          style={{ bottom: '40rpx', right: '48rpx' }}
          onClick={generateCover}
        >
          <View className={generating ? 'animate-spin' : ''} style={{ width: '28rpx', height: '28rpx' }}>
            <Icon name="sparkles" size={14} color={generating ? '#FF7E33' : '#ffffff'} strokeWidth={2.4} />
          </View>
          <Text className={cn('text-11px font-black', generating ? 'text-primary' : 'text-white')}>
            {generating ? 'AI 绘制中...' : recipe.image ? 'AI 重绘' : 'AI 生成封面'}
          </Text>
        </View>
      </View>

      <View className="px-8 py-10">
        {/* 标签 */}
        <View className="flex gap-2 mb-4 flex-wrap">
          {recipe.mealTypes.map((type) => (
            <View key={type} className="px-3 py-1 bg-orange-50 rounded-full">
              <Text className="text-10px font-black text-primary uppercase tracking-widest">
                {MEAL_LABEL[type] || type}
              </Text>
            </View>
          ))}
        </View>
        <Text className="block text-44px font-black italic text-espresso mb-4 leading-tight tracking-tight">{recipe.title}</Text>
        <Text className="block text-espresso-40 mb-6 font-bold text-sm leading-relaxed italic">“ {recipe.description} ”</Text>

        <View
          className="mb-10 flex items-center justify-between p-4 bg-orange-50 rounded-3xl border border-orange-100 shadow-sm press-scale"
          onClick={logMeal}
        >
          <View className="flex items-center gap-3 min-w-0">
            <View className="w-10 h-10 bg-white rounded-2xl flex items-center justify-center flex-shrink-0">
              <Icon name="history" size={20} color="#FF7E33" strokeWidth={2.2} />
            </View>
            <View className="min-w-0">
              <Text className="block text-sm font-black text-espresso">记一餐到饮食历程</Text>
              <Text className="block text-9px font-bold text-espresso-40">按当前时段记录，可在我页查看</Text>
            </View>
          </View>
          <Icon name="chevron-right" size={18} color="#fdba74" strokeWidth={3} />
        </View>

        {/* 营养 */}
        {recipe.nutrition && (
          <View className="glass-panel shadow-card rounded-32px p-8 mb-12 grid grid-cols-4 gap-2">
            {(
              [
                { label: '热量', value: recipe.nutrition.calories, icon: 'flame' as const, color: '#FF7E33' },
                { label: '蛋白质', value: recipe.nutrition.protein, icon: 'heart-pulse' as const, color: '#ef4444' },
                { label: '碳水', value: recipe.nutrition.carbs, icon: 'leaf' as const, color: '#22c55e' },
                { label: '脂肪', value: recipe.nutrition.fat, icon: 'sparkles' as const, color: '#facc15' },
              ]
            ).map((n) => (
              <View key={n.label} className="text-center flex flex-col items-center gap-1">
                <Icon name={n.icon} size={16} color={n.color} strokeWidth={2.4} />
                <Text className="block text-9px font-black text-espresso-30 uppercase">{n.label}</Text>
                <Text className="block text-xs font-black text-primary leading-none">{n.value}</Text>
              </View>
            ))}
          </View>
        )}

        {/* 食材 */}
        <View className="mb-12">
          <View className="flex justify-between items-center mb-6">
            <View className="flex items-center gap-3">
              <View className="w-10 h-10 bg-green-50 rounded-2xl flex items-center justify-center shadow-sm">
                <Icon name="leaf" size={18} color="#22c55e" strokeWidth={2.4} />
              </View>
              <View>
                <Text className="block text-xl font-black text-espresso tracking-tight">食材清单</Text>
                <Text className="block text-10px font-bold text-espresso-30 tracking-widest">大地馈赠 · 新鲜当季</Text>
              </View>
            </View>
            <View
              className={cn(
                'flex items-center gap-1 px-4 py-2 rounded-xl press-scale',
                allRecipeItemsInShopping ? 'bg-green-50' : 'bg-orange-50'
              )}
              onClick={() =>
                addToShopping([
                  ...recipe.ingredients.map((i) => ({ item: i, type: 'ingredient' as const })),
                  ...(recipe.seasonings || []).map((s) => ({ item: s, type: 'seasoning' as const })),
                ])
              }
            >
              <Text
                className={cn('text-xs font-black', allRecipeItemsInShopping ? 'text-green-700' : 'text-primary')}
              >
                {allRecipeItemsInShopping ? '已全部加入' : '全部加入'}
              </Text>
              <Icon
                name={allRecipeItemsInShopping ? 'check' : 'plus-circle'}
                size={14}
                color={allRecipeItemsInShopping ? '#22c55e' : '#FF7E33'}
                strokeWidth={2.6}
              />
            </View>
          </View>
          <View>
            {recipe.ingredients.map((ing, i) => {
              const added = isInShoppingList(ing.name, 'ingredient')
              return (
              <View
                key={`${ing.name}-${i}`}
                className="flex justify-between items-center py-4 px-4 bg-gray-50-50 rounded-2xl mb-2"
                onClick={() => addToShopping([{ item: ing, type: 'ingredient' }])}
              >
                <View className="flex items-center gap-3">
                  <Text className="font-black text-gray-700 text-sm">{ing.name}</Text>
                  <View className={cn('p-1 rounded-lg', added ? 'bg-green-100' : 'bg-orange-100')}>
                    <Icon
                      name={added ? 'check' : 'plus'}
                      size={12}
                      color={added ? '#22c55e' : '#FF7E33'}
                      strokeWidth={3}
                    />
                  </View>
                </View>
                <Text className="text-gray-400 font-bold text-xs">
                  {ing.amount}
                  {ing.unit}
                </Text>
              </View>
              )
            })}
          </View>
        </View>

        {/* 调料 */}
        {recipe.seasonings && recipe.seasonings.length > 0 && (
          <View className="mb-12">
            <View className="flex items-center gap-3 mb-6">
              <View className="w-10 h-10 bg-orange-50 rounded-2xl flex items-center justify-center shadow-sm">
                <Icon name="flame" size={18} color="#FF7E33" strokeWidth={2.4} />
              </View>
              <View>
                <Text className="block text-xl font-black text-espresso tracking-tight">烹饪调料</Text>
                <Text className="block text-10px font-bold text-espresso-30 tracking-widest">一点点 · 点亮味蕾</Text>
              </View>
            </View>
            <View>
              {recipe.seasonings.map((ing, i) => {
                const added = isInShoppingList(ing.name, 'seasoning')
                return (
                <View
                  key={`${ing.name}-${i}`}
                  className="flex justify-between items-center py-4 px-4 bg-gray-50-50 rounded-2xl mb-2"
                  onClick={() => addToShopping([{ item: ing, type: 'seasoning' }])}
                >
                  <View className="flex items-center gap-3">
                    <Text className="font-black text-gray-600 text-sm">{ing.name}</Text>
                    <View className={cn('p-1 rounded-lg', added ? 'bg-green-100' : 'bg-orange-100')}>
                      <Icon
                        name={added ? 'check' : 'plus'}
                        size={12}
                        color={added ? '#22c55e' : '#FF7E33'}
                        strokeWidth={3}
                      />
                    </View>
                  </View>
                  <Text className="text-gray-400 font-bold text-xs">
                    {ing.amount}
                    {ing.unit}
                  </Text>
                </View>
                )
              })}
            </View>
          </View>
        )}

        {/* 步骤 */}
        <View className="pb-10">
          <View className="flex items-center gap-3 mb-6">
            <View className="w-10 h-10 bg-purple-50 rounded-2xl flex items-center justify-center shadow-sm">
              <Icon name="clock" size={18} color="#a855f7" strokeWidth={2.4} />
            </View>
            <View>
              <Text className="block text-xl font-black text-espresso tracking-tight">烹饪步骤</Text>
              <Text className="block text-10px font-bold text-espresso-30 tracking-widest">慢火细炖 · 一步一味</Text>
            </View>
          </View>
          <View className="space-y-6">
            {recipe.instructions.map((step, i) => (
              <View key={i} className="flex gap-5 items-start">
                <View className="flex flex-col items-center flex-shrink-0">
                  <Text className="text-3xl font-black text-orange-200 leading-none">
                    {String(i + 1).padStart(2, '0')}
                  </Text>
                  {i < recipe.instructions.length - 1 && (
                    <View className="w-1 bg-orange-100 mt-2 rounded-full" style={{ height: '40rpx' }} />
                  )}
                </View>
                <View className="flex-1 pb-4 border-b border-orange-50-50">
                  <Text className="block text-espresso font-bold text-sm leading-relaxed">{step}</Text>
                </View>
              </View>
            ))}
          </View>
          <View className="mt-10 flex flex-col items-center gap-2 opacity-60">
            <Icon name="heart" size={20} color="#FF7E33" fill="#FFE4CC" strokeWidth={2} />
            <Text className="text-xs font-black italic text-espresso-40">愿这道菜 · 暖到你的胃</Text>
          </View>
        </View>
      </View>
    </View>
  )
}
