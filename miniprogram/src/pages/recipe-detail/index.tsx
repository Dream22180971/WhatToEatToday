import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { Button, View, Text, Image, Canvas } from '@tarojs/components'
import Taro, { useDidShow, useRouter } from '@tarojs/taro'
import type { Favorite, Ingredient, MealLog, Recipe, ShoppingItem } from '../../types'
import { loadDB, saveDB } from '../../services/storage'
import { cn } from '../../lib/utils'
import { Icon } from '../../components/Icon'
import { generateRecipeCover } from '../../services/recipeImage'
import { reconcileRecipeListsByInstructions } from '../../services/recipeReconcile'
import './index.css'

const MEAL_LABEL: Record<string, string> = {
  breakfast: '能量早餐',
  lunch: '元气午餐',
  dinner: '暖心宵夜',
  snack: '馋嘴零食',
}

function makeAmount(x: any) {
  const a = String(x?.amount || '').trim()
  const u = String(x?.unit || '').trim()
  return (a + u).trim() || '适量'
}

function todayISO(): string {
  const d = new Date()
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

function shoppingTodayRecipesKey(dateKey: string) {
  return `shopping_today_recipes_${dateKey}`
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
  const [shareCanvasWidthPx, setShareCanvasWidthPx] = useState<number>(375)
  const [shareCanvasHeightPx, setShareCanvasHeightPx] = useState<number>(1200)

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
    // 联动：加入「清单页-今日菜品」（按份数累加）
    try {
      const k = shoppingTodayRecipesKey(todayISO())
      const raw = Taro.getStorageSync(k)
      // 兼容旧版：raw 可能是 string[]；新版为 Record<recipeId, count>
      let counts: Record<string, number> = {}
      if (Array.isArray(raw)) {
        for (const x of raw) {
          if (typeof x !== 'string' || !x) continue
          counts[x] = (counts[x] || 0) + 1
        }
      } else if (raw && typeof raw === 'object') {
        for (const [id, c] of Object.entries(raw as any)) {
          const n = Number(c)
          if (id && Number.isFinite(n) && n > 0) counts[id] = Math.floor(n)
        }
      }
      counts[recipe.id] = (counts[recipe.id] || 0) + 1
      Taro.setStorageSync(k, counts)
    } catch {
      // ignore
    }
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
      const raw = String(e?.message || '生成失败')
      const isRateLimit =
        raw.includes('HTTP 429') ||
        raw.includes('rate limit') ||
        raw.includes('Requests rate limit exceeded')
      const msg = isRateLimit
        ? '这会儿生成太火爆啦，已触发服务限流。建议稍后 1~2 分钟再试；每日封面额度为 20 次。'
        : raw
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

  const drawWrappedText = (
    ctx: any,
    text: string,
    x: number,
    y: number,
    maxWidth: number,
    lineHeight: number,
    maxLines?: number
  ) => {
    const t = String(text || '')
    if (!t) return y
    const chars = t.split('')
    let line = ''
    let lines = 0
    for (let i = 0; i < chars.length; i++) {
      const test = line + chars[i]
      const w = ctx.measureText(test).width
      if (w > maxWidth && line) {
        ctx.fillText(line, x, y)
        y += lineHeight
        line = chars[i]
        lines += 1
        if (maxLines && lines >= maxLines) return y
      } else {
        line = test
      }
    }
    if (line) {
      ctx.fillText(line, x, y)
      y += lineHeight
    }
    return y
  }

  const shareRecipeLongImage = async () => {
    if (!recipe) return
    const sys = Taro.getSystemInfoSync()
    const canvasWidth = Math.min(430, Math.max(320, sys.windowWidth || 375)) // px
    const padding = 20
    const maxW = canvasWidth - padding * 2
    const exportScale = 2.0 // 提高清晰度：导出 2x 分辨率
    const stepLimit = 12 // 更快：限制步骤渲染条数
    const posterRecipe = reconcileRecipeListsByInstructions(recipe)

    const stepsLen = Array.isArray(recipe.instructions) ? recipe.instructions.length : 0
    const ingLen = Array.isArray(posterRecipe.ingredients) ? posterRecipe.ingredients.length : 0
    const seaLen = Array.isArray(posterRecipe.seasonings) ? posterRecipe.seasonings.length : 0
    const approxHeight =
      190 +
      Math.min(ingLen, 18) * 22 +
      (seaLen ? 34 + Math.min(seaLen, 18) * 22 : 0) +
      Math.min(stepsLen, stepLimit) * 34 +
      120

    // 先给一个足够大的画布，最后按实际内容高度裁剪导出，避免“过长留白/截断”
    const canvasHeight = Math.max(820, Math.min(4200, Math.floor(approxHeight) + 120))
    setShareCanvasWidthPx(canvasWidth)
    setShareCanvasHeightPx(canvasHeight)
    // 等待 Canvas 样式更新（避免“宽高不一致导致绘制异常/空白”）
    await new Promise((r) => setTimeout(r, 120))

    Taro.showLoading({ title: '生成长图...', mask: true })
    try {
      const ctx = Taro.createCanvasContext('shareRecipeCanvas')

      const drawRoundRect = (x: number, y: number, w: number, h: number, r: number) => {
        const rr = Math.max(0, Math.min(r, w / 2, h / 2))
        ctx.beginPath()
        ctx.moveTo(x + rr, y)
        ctx.arcTo(x + w, y, x + w, y + h, rr)
        ctx.arcTo(x + w, y + h, x, y + h, rr)
        ctx.arcTo(x, y + h, x, y, rr)
        ctx.arcTo(x, y, x + w, y, rr)
        ctx.closePath()
      }

      ctx.setFillStyle('#FFF7F1')
      ctx.fillRect(0, 0, canvasWidth, canvasHeight)

      // 主卡片（圆角，尽量接近详情页的“奶油玻璃卡片”观感）
      ctx.setFillStyle('rgba(255,255,255,0.94)')
      drawRoundRect(padding, padding, canvasWidth - padding * 2, canvasHeight - padding * 2, 22)
      ctx.fill()

      let y = padding + 30

      ctx.setFillStyle('#FF7E33')
      ctx.setFontSize(13)
      ctx.fillText('三餐有意思 · 菜谱分享', padding + 22, y)

      y += 32
      ctx.setFillStyle('#4D3E3E')
      ctx.setFontSize(28)
      y = drawWrappedText(ctx, recipe.title, padding + 22, y, maxW - 44, 36, 2)

      ctx.setFillStyle('rgba(77,62,62,0.55)')
      ctx.setFontSize(14)
      y = drawWrappedText(ctx, `“${recipe.description || ''}”`, padding + 22, y + 8, maxW - 44, 22, 3)

      // 食材
      y += 18
      ctx.setFillStyle('#22c55e')
      ctx.setFontSize(15)
      ctx.fillText('食材', padding + 22, y)
      y += 24
      ctx.setFillStyle('#4D3E3E')
      ctx.setFontSize(14)
      for (const ing of (posterRecipe.ingredients || []).slice(0, 18)) {
        const name = String((ing as any)?.name || '').trim()
        if (!name) continue
        const amt = makeAmount(ing)
        ctx.fillText(`${name}  ${amt}`, padding + 22, y)
        y += 22
      }

      // 调料（可选）
      if (Array.isArray(posterRecipe.seasonings) && posterRecipe.seasonings.length) {
        y += 12
        ctx.setFillStyle('#FF7E33')
        ctx.setFontSize(15)
        ctx.fillText('调料', padding + 22, y)
        y += 24
        ctx.setFillStyle('#4D3E3E')
        ctx.setFontSize(14)
        for (const s of (posterRecipe.seasonings || []).slice(0, 18)) {
          const name = String((s as any)?.name || '').trim()
          if (!name) continue
          const amt = makeAmount(s)
          ctx.fillText(`${name}  ${amt}`, padding + 22, y)
          y += 22
        }
      }

      // 步骤
      y += 20
      ctx.setFillStyle('#8b5cf6')
      ctx.setFontSize(15)
      ctx.fillText('步骤', padding + 22, y)
      y += 26
      ctx.setFillStyle('#4D3E3E')
      ctx.setFontSize(14)
      let stepIdx = 1
      const steps = (recipe.instructions || []).slice(0, stepLimit)
      for (const step of steps) {
        y = drawWrappedText(ctx, `${stepIdx}. ${step}`, padding + 22, y, maxW - 44, 22, 3)
        y += 6
        stepIdx += 1
      }
      if ((recipe.instructions || []).length > stepLimit) {
        ctx.setFillStyle('rgba(77,62,62,0.45)')
        ctx.setFontSize(11)
        y = drawWrappedText(ctx, `（仅展示前 ${stepLimit} 步，详情见小程序）`, padding + 22, y + 4, maxW - 44, 18, 2)
      }

      // footer
      ctx.setFillStyle('rgba(77,62,62,0.45)')
      ctx.setFontSize(11)
      const footerY = Math.min(canvasHeight - padding - 18, y + 24)
      ctx.fillText('来自「三餐有意思」小程序', padding + 22, footerY)

      await new Promise<void>((resolve) => ctx.draw(false, resolve))

      const exportHeight = Math.max(620, Math.min(canvasHeight, footerY + 34))
      const res = await Taro.canvasToTempFilePath({
        canvasId: 'shareRecipeCanvas',
        width: canvasWidth,
        height: exportHeight,
        destWidth: Math.floor(canvasWidth * exportScale),
        destHeight: Math.floor(exportHeight * exportScale),
      } as any)

      const filePath = (res as any)?.tempFilePath
      if (!filePath) throw new Error('未生成图片')

      // 保存到相册
      try {
        await Taro.saveImageToPhotosAlbum({ filePath })
      } catch (e: any) {
        const msg = String(e?.errMsg || e?.message || '')
        if (msg.includes('auth') || msg.includes('authorize') || msg.includes('denied')) {
          Taro.showModal({
            title: '需要相册权限',
            content: '请在设置里允许保存到相册后再试一次。',
            confirmText: '去设置',
            cancelText: '取消',
            success: async (r2) => {
              if (!r2.confirm) return
              try {
                await Taro.openSetting()
              } catch {}
            },
          })
          return
        }
        throw e
      }

      // 拉起微信图片分享菜单（新版本支持）
      const wxAny = wx as any
      if (wxAny?.showShareImageMenu) {
        wxAny.showShareImageMenu({ path: filePath })
        Taro.hideLoading()
        return
      }

      Taro.hideLoading()
      Taro.showToast({ title: '已保存到相册，可在微信发送给好友', icon: 'none' })
    } catch (e: any) {
      Taro.hideLoading()
      Taro.showToast({ title: String(e?.message || '生成失败'), icon: 'none' })
    }
  }

  if (!recipe) {
    return (
      <View className="min-h-screen flex items-center justify-center bg-warm-bg">
        <Text className="text-espresso-40 font-bold">菜谱加载中…</Text>
      </View>
    )
  }

  const reconciled = reconcileRecipeListsByInstructions(recipe)
  const displayIngredients = reconciled.ingredients
  const displaySeasonings = reconciled.seasonings

  return (
    <View className="min-h-screen bg-white animate-page-in">
      {/* 隐藏画布：用于生成分享长图 */}
      <Canvas
        canvasId="shareRecipeCanvas"
        style={{
          position: 'absolute',
          left: '-9999px',
          top: '0px',
          width: `${shareCanvasWidthPx}px`,
          height: `${shareCanvasHeightPx}px`,
        }}
      />
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
                  ...displayIngredients.map((i) => ({ item: i, type: 'ingredient' as const })),
                  ...(displaySeasonings || []).map((s) => ({ item: s, type: 'seasoning' as const })),
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
            {displayIngredients.map((ing, i) => {
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
        {displaySeasonings && displaySeasonings.length > 0 && (
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
              {displaySeasonings.map((ing, i) => {
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

          {/* 推荐给好友 */}
          <View className="mt-10">
            <View
              className="flex items-center justify-center gap-2 px-6 py-4 bg-orange-50 rounded-3xl border border-orange-100 shadow-sm press-scale"
              onClick={() => void shareRecipeLongImage()}
            >
              <Icon name="share" size={18} color="#FF7E33" strokeWidth={2.4} />
              <Text className="text-sm font-black text-primary">推荐给好友</Text>
              <Text className="text-10px font-bold text-espresso-30">保存长图 · 分享微信</Text>
            </View>
          </View>
        </View>
      </View>
    </View>
  )
}
