import React, { useCallback, useMemo, useState } from 'react'
import { View, Text, Input, Image, Textarea, ScrollView } from '@tarojs/components'
import Taro, { useDidShow, useRouter } from '@tarojs/taro'
import type { Ingredient, Recipe } from '../../types'
import { loadDB, saveDB } from '../../services/storage'
import { initialRecipes } from '../../data/initialRecipes'
import { parseRecipeFromImage } from '../../services/recipeParser'
import { Icon } from '../../components/Icon'
import { cn } from '../../lib/utils'
import './index.css'

const PLACEHOLDER_STYLE = 'color: rgba(77,62,62,0.38);'

const INPUT_CLASS = 'w-full text-sm font-bold text-espresso leading-normal'
const TEXTAREA_CLASS = 'w-full text-sm font-bold text-espresso leading-relaxed'

function normalizeIngredientLine(raw: string) {
  return raw
    .replace(/\u3000/g, ' ')
    .replace(/，/g, ',')
    .replace(/、/g, ',')
    .replace(/[\s\t]+/g, ' ')
    .trim()
}

/** 兼容：番茄 2 个 / 番茄2个 / 番茄,2,个 / 番茄：2个 / 食用油 适量 */
function parseIngredientLine(raw: string): Ingredient | null {
  const line = normalizeIngredientLine(raw)
  if (!line) return null

  const parts = line.split(' ').filter(Boolean)
  if (parts.length >= 3) {
    return { name: parts[0], amount: parts[1], unit: parts.slice(2).join('') }
  }
  if (parts.length === 2) {
    return { name: parts[0], amount: parts[1], unit: '' }
  }

  if (line.includes(',')) {
    const p = line.split(',').map((s) => s.trim()).filter(Boolean)
    if (p.length >= 3) return { name: p[0], amount: p[1], unit: p[2] }
    if (p.length === 2) return { name: p[0], amount: p[1], unit: '' }
  }

  const colon = line.match(/^(.+?)[:：]\s*(\d+(?:\.\d+)?)\s*([a-zA-Z%一-龥]*)$/)
  if (colon) {
    return { name: colon[1].trim(), amount: colon[2], unit: (colon[3] || '').trim() }
  }

  const glued = line.match(/^(.+?)(\d+(?:\.\d+)?)([a-zA-Z%一-龥]*)$/)
  if (glued && glued[1].trim()) {
    return { name: glued[1].trim(), amount: glued[2], unit: (glued[3] || '').trim() }
  }

  return { name: line, amount: '适量', unit: '' }
}

function splitRecipeLines(block: string) {
  return block
    .split(/\r?\n|[；;]/)
    .map((l) => l.replace(/^\s*\d+[.)、．]\s*/, '').trim())
    .filter(Boolean)
}

function sortByCreatedAtDesc(list: Recipe[]): Recipe[] {
  return [...list].sort((a, b) => {
    const ta = Date.parse(a.createdAt || '') || 0
    const tb = Date.parse(b.createdAt || '') || 0
    return tb - ta
  })
}

function mergeForDiscovery(saved: Recipe[], systemRecipes: Recipe[]): Recipe[] {
  const systemIds = new Set(systemRecipes.map((r) => r.id))
  const savedUser = saved.filter((r) => r.creatorId === 'user' && !systemIds.has(r.id))
  return [...systemRecipes, ...sortByCreatedAtDesc(savedUser)]
}

const RecipeTile = ({ recipe, onClick }: { recipe: Recipe; onClick: () => void }) => {
  const ingCount = (recipe.ingredients?.length || 0) + (recipe.seasonings?.length || 0)
  const stepCount = recipe.instructions?.length || 0
  return (
    <View className="bg-white rounded-2rem overflow-hidden shadow-card border border-orange-50-50 press-scale" onClick={onClick}>
      <View className="aspect-4x3 bg-orange-50-30 relative flex items-center justify-center">
        {recipe.image ? (
          <Image src={recipe.image} mode="aspectFill" className="w-full h-full" />
        ) : (
          <Icon name="chef-hat" size={56} color="#fdba74" strokeWidth={1.4} />
        )}
      </View>
      <View className="p-4">
        <Text className="block font-black text-espresso text-sm mb-2 leading-tight">{recipe.title}</Text>
        <Text className="block text-10px text-espresso-40 font-medium leading-relaxed mb-3 clamp-2">
          {recipe.description}
        </Text>
        <View className="flex items-center gap-3 pt-2 border-t border-orange-50-50">
          <View className="flex items-center gap-1">
            <Icon name="leaf" size={10} color="#22c55e" strokeWidth={2.6} />
            <Text className="text-9px font-black text-espresso-40">{ingCount} 种</Text>
          </View>
          <View className="flex items-center gap-1">
            <Icon name="clock" size={10} color="#a855f7" strokeWidth={2.6} />
            <Text className="text-9px font-black text-espresso-40">{stepCount} 步</Text>
          </View>
        </View>
      </View>
    </View>
  )
}

function readFileAsBase64(filePath: string): Promise<string> {
  return new Promise((resolve, reject) => {
    try {
      const fs = Taro.getFileSystemManager()
      fs.readFile({
        filePath,
        encoding: 'base64',
        success: (r) => resolve((r as any).data as string),
        fail: (err) => reject(new Error((err as any)?.errMsg || '读取图片失败')),
      })
    } catch (e) {
      reject(e)
    }
  })
}

function mimeFromPath(filePath: string): string {
  const lower = filePath.toLowerCase()
  if (lower.endsWith('.png')) return 'image/png'
  if (lower.endsWith('.webp')) return 'image/webp'
  if (lower.endsWith('.gif')) return 'image/gif'
  return 'image/jpeg'
}

export default function DiscoveryPage() {
  const [recipes, setRecipes] = useState<Recipe[]>([])
  const [allRecipes, setAllRecipes] = useState<Recipe[]>([])
  const [search, setSearch] = useState('')
  const [showUpload, setShowUpload] = useState(false)
  const [parsing, setParsing] = useState(false)
  const [manualMode, setManualMode] = useState(false)
  const [manualTitle, setManualTitle] = useState('')
  const [manualDesc, setManualDesc] = useState('')
  const [manualIngredients, setManualIngredients] = useState('')
  const [manualSteps, setManualSteps] = useState('')
  const router = useRouter()

  const hydrate = useCallback(() => {
    const db = loadDB()
    let saved = db.recipes || []
    const systemRecipes = initialRecipes
    if (!saved.length) {
      saveDB({
        ...db,
        recipes: systemRecipes,
        logs: db.logs || [],
        shopping: db.shopping || [],
        favorites: db.favorites || [],
      })
      saved = systemRecipes
    }
    const merged = mergeForDiscovery(saved, systemRecipes)
    setRecipes(merged)
    setAllRecipes(merged)
  }, [])

  useDidShow(() => {
    hydrate()
    const preSearch = Taro.getStorageSync('discovery_prefill_search')
    if (preSearch) {
      Taro.removeStorageSync('discovery_prefill_search')
      setSearch(String(preSearch))
    }
    // 首页「灵感识别」跳到发现页时会设置这个标记
    const flag = Taro.getStorageSync('discovery_auto_upload')
    if (flag) {
      Taro.removeStorageSync('discovery_auto_upload')
      setTimeout(() => setShowUpload(true), 200)
    }
  })

  React.useEffect(() => {
    hydrate()
  }, [hydrate])

  const filtered = useMemo(() => {
    const q = search.trim()
    if (!q) return recipes
    return allRecipes.filter(
      (r) => r.title.includes(q) || r.ingredients?.some((i) => i.name.includes(q))
    )
  }, [allRecipes, recipes, search])

  const recipeId = (router.params?.recipeId as string | undefined) || undefined
  React.useEffect(() => {
    if (!recipeId) return
    const r = allRecipes.find((x) => x.id === recipeId)
    if (r) Taro.navigateTo({ url: `/pages/recipe-detail/index?id=${r.id}` })
  }, [allRecipes, recipeId])

  const handleImageUpload = async () => {
    let chosenPath = ''
    try {
      const res = await Taro.chooseMedia({
        count: 1,
        mediaType: ['image'],
        sourceType: ['album', 'camera'],
        sizeType: ['compressed'],
      })
      const file = res.tempFiles?.[0]
      if (!file?.tempFilePath) return
      chosenPath = file.tempFilePath
    } catch {
      return // 用户取消
    }

    setShowUpload(false)
    setParsing(true)
    Taro.showLoading({ title: 'AI 识别中...', mask: true })
    try {
      const limit = 100
      const db0 = loadDB()
      const userCount = (db0.recipes || []).filter((r) => r.creatorId === 'user').length
      if (userCount >= limit) {
        Taro.hideLoading()
        setParsing(false)
        Taro.showToast({ title: `菜谱最多支持导入 ${limit} 个`, icon: 'none' })
        return
      }

      // 优先上传云存储并用 https 临时链接分析，避免把大 base64 塞进云函数 event 导致超时/失败
      let parsed: Awaited<ReturnType<typeof parseRecipeFromImage>>
      try {
        const ext = (() => {
          const lower = chosenPath.toLowerCase()
          if (lower.endsWith('.png')) return '.png'
          if (lower.endsWith('.webp')) return '.webp'
          if (lower.endsWith('.gif')) return '.gif'
          return '.jpg'
        })()
        const cloudPath = `ai/recipe-${Date.now().toString(36)}${ext}`
        const uploadRes = await Taro.cloud.uploadFile({ cloudPath, filePath: chosenPath })
        const fileID = (uploadRes as any)?.fileID as string | undefined
        if (!fileID) throw new Error('上传失败')
        const tempRes = await Taro.cloud.getTempFileURL({ fileList: [fileID] })
        const tempUrl = (tempRes as any)?.fileList?.[0]?.tempFileURL as string | undefined
        if (!tempUrl) throw new Error('获取临时链接失败')
        parsed = await parseRecipeFromImage({ url: tempUrl })
      } catch {
        // 云存储不可用时回退 base64 直传
        const base64 = await readFileAsBase64(chosenPath)
        parsed = await parseRecipeFromImage({ base64, mime: mimeFromPath(chosenPath) })
      }
      const newRecipe: Recipe = {
        id: 'ai-' + Date.now().toString(36),
        title: parsed.title,
        description: parsed.description,
        ingredients: parsed.ingredients,
        seasonings: parsed.seasonings,
        instructions: parsed.instructions,
        categories: parsed.categories.length ? parsed.categories : ['AI 识别'],
        nutrition: parsed.nutrition,
        mealTypes: parsed.mealTypes,
        creatorId: 'user',
        isPublic: false,
        createdAt: new Date().toISOString(),
      }
      const db = loadDB()
      const next = [newRecipe, ...(db.recipes || [])]
      saveDB({
        ...db,
        recipes: next,
        logs: db.logs || [],
        shopping: db.shopping || [],
        favorites: db.favorites || [],
      })
      setAllRecipes(next)
      Taro.hideLoading()
      Taro.showToast({ title: '识别成功', icon: 'success' })
      Taro.navigateTo({ url: `/pages/recipe-detail/index?id=${newRecipe.id}` })
    } catch (e: any) {
      Taro.hideLoading()
      const msg = e?.message || '识别失败'
      Taro.showModal({
        title: 'AI 识别失败',
        content: msg.length > 120 ? msg.slice(0, 120) + '…' : msg,
        showCancel: false,
        confirmText: '好的',
      })
    } finally {
      setParsing(false)
    }
  }

  const resetManual = () => {
    setManualTitle('')
    setManualDesc('')
    setManualIngredients('')
    setManualSteps('')
  }

  const createManualRecipe = () => {
    const limit = 100
    const db0 = loadDB()
    const userCount = (db0.recipes || []).filter((r) => r.creatorId === 'user').length
    if (userCount >= limit) {
      Taro.showToast({ title: `菜谱最多支持导入 ${limit} 个`, icon: 'none' })
      return
    }

    const title = manualTitle.trim()
    const ingredients = splitRecipeLines(manualIngredients)
      .map((line) => parseIngredientLine(line))
      .filter((x): x is Ingredient => !!x && !!x.name.trim())
    const instructions = splitRecipeLines(manualSteps)
    if (!title) {
      Taro.showToast({ title: '请先填写菜谱名称', icon: 'none' })
      return
    }
    if (!ingredients.length) {
      Taro.showToast({ title: '请至少填写1个食材', icon: 'none' })
      return
    }
    if (!instructions.length) {
      Taro.showToast({ title: '请至少填写1个步骤', icon: 'none' })
      return
    }

    const newRecipe: Recipe = {
      id: 'manual-' + Date.now().toString(36),
      title,
      description: manualDesc.trim() || '家常暖心菜，慢慢做更有味。',
      ingredients,
      seasonings: [],
      instructions,
      categories: ['手动创建'],
      mealTypes: ['lunch', 'dinner'],
      creatorId: 'user',
      isPublic: false,
      createdAt: new Date().toISOString(),
    }
    const db = loadDB()
    const next = [newRecipe, ...(db.recipes || [])]
    saveDB({
      ...db,
      recipes: next,
      logs: db.logs || [],
      shopping: db.shopping || [],
      favorites: db.favorites || [],
    })
    setAllRecipes(next)
    setShowUpload(false)
    setManualMode(false)
    resetManual()
    Taro.showToast({ title: '菜谱已创建', icon: 'success' })
    Taro.navigateTo({ url: `/pages/recipe-detail/index?id=${newRecipe.id}` })
  }

  return (
    <View className="min-h-screen bg-warm-bg text-espresso relative overflow-hidden animate-page-in">
      <View className="absolute bg-glow-peach rounded-full" style={{ top: '-80rpx', left: '-100rpx', width: '360rpx', height: '360rpx' }} />
      <View className="absolute bg-glow-orange rounded-full" style={{ top: '480rpx', right: '-140rpx', width: '380rpx', height: '380rpx' }} />

      <View className="px-6 pt-10 pb-32 relative">
        <View className="flex justify-between items-center mb-6">
          <View className="flex items-center gap-3">
            <View className="w-11 h-11 bg-orange-100 rounded-2xl flex items-center justify-center shadow-sm">
              <Icon name="compass" size={20} color="#FF7E33" strokeWidth={2.4} />
            </View>
            <View>
              <Text className="block text-3xl font-black italic tracking-tight">
                探索<Text className="text-primary italic">新滋味</Text>
              </Text>
              <Text className="block text-10px font-bold text-espresso-40 tracking-widest uppercase">
                每一次相遇 · 都是今日的小惊喜
              </Text>
            </View>
          </View>
          <View
            className="bg-primary w-14 h-14 rounded-healing shadow-orange flex items-center justify-center press-strong"
            onClick={() => setShowUpload(true)}
          >
            <Icon name="plus-circle" size={24} color="#ffffff" strokeWidth={2.4} />
          </View>
        </View>

        <View className="mb-8 bg-white shadow-card border border-orange-100-50 rounded-healing px-5 py-4 flex items-center gap-3">
          <View className="bg-orange-50 rounded-full flex items-center justify-center flex-shrink-0" style={{ width: '60rpx', height: '60rpx' }}>
            <Icon name="search" size={16} color="#FF7E33" strokeWidth={2.4} />
          </View>
          <Input
            value={search}
            onInput={(e) => setSearch(e.detail.value)}
            placeholder="寻找你的下一餐灵感..."
            placeholderStyle="color: rgba(77,62,62,0.45);"
            className="flex-1 text-sm font-bold"
          />
        </View>

        <View
          className="mb-6 p-5 bg-white-60 rounded-3xl shadow-card border border-orange-100-50 flex items-center justify-between press-scale"
          onClick={() => setShowUpload(true)}
        >
          <View className="flex items-center gap-3">
            <View className="w-11 h-11 bg-orange-50 rounded-2xl flex items-center justify-center">
              <Icon name="plus-circle" size={20} color="#FF7E33" strokeWidth={2.6} />
            </View>
            <View>
              <Text className="block text-sm font-black text-espresso">新增我的菜谱</Text>
              <Text className="block text-10px font-bold text-espresso-40">支持 AI 图片识别，也可以手动录入</Text>
            </View>
          </View>
          <Icon name="chevron-right" size={18} color="#fdba74" strokeWidth={3} />
        </View>

        {/* 我的菜谱库 */}
        <View className="mb-8">
          <Text className="block text-2xl font-black italic text-espresso mb-4">
            我的菜谱库
          </Text>
          <Text className="block text-10px font-bold text-espresso-40 tracking-widest uppercase mb-6">
            收藏的、创建的，都在这里
          </Text>
        </View>

        <View className="grid grid-cols-2 gap-4">
          {filtered.map((r) => (
            <RecipeTile
              key={r.id}
              recipe={r}
              onClick={() => Taro.navigateTo({ url: `/pages/recipe-detail/index?id=${r.id}` })}
            />
          ))}
        </View>

        {!filtered.length && (
          <View className="mt-12 flex flex-col items-center gap-5 px-6">
            <View className="relative w-40 h-40 flex items-center justify-center">
              <View className="absolute inset-0 bg-glow-peach rounded-full" />
              <View className="relative w-32 h-32 bg-white rounded-full flex items-center justify-center shadow-card border-4 border-white">
                <Icon name="chef-hat" size={60} color="#fdba74" strokeWidth={1.4} />
              </View>
              <View className="absolute" style={{ top: '-6rpx', right: '0rpx' }}>
                <Icon name="sparkles" size={24} color="#FFB347" fill="#FFB347" />
              </View>
            </View>
            <Text className="block font-black italic text-espresso text-xl">暂无这味道</Text>
            <Text className="block text-center text-espresso-40 font-bold text-xs leading-relaxed">
              不妨先清空关键词{'\n'}或者用相机给一道菜拍个照
            </Text>
            <View
              className="flex items-center gap-2 px-6 py-3 bg-primary rounded-full shadow-orange press-scale mt-2"
              onClick={() => setShowUpload(true)}
            >
              <Icon name="camera" size={16} color="#ffffff" strokeWidth={2.4} />
              <Text className="text-white font-black text-xs">拍照录入</Text>
            </View>
          </View>
        )}
      </View>

      {/* 上传弹层 */}
      {showUpload && (
        <View
          className="fixed inset-0 bg-black-60 z-100 flex items-start justify-center animate-sheet-fade p-6"
          style={{ paddingTop: '300rpx' }}
          onClick={() => {
            setShowUpload(false)
            setManualMode(false)
            resetManual()
          }}
        >
          <View
            className={cn('bg-white w-full rounded-healing animate-page-in flex flex-col', manualMode ? 'p-5' : 'p-8')}
            style={{ maxHeight: manualMode ? '85vh' : '620rpx' }}
            onClick={(e) => e.stopPropagation()}
          >
            <View className="flex justify-between items-center mb-5 flex-shrink-0">
              <Text className="text-lg font-black italic text-espresso tracking-tight">
                {manualMode ? '手动创建菜谱' : '添加菜谱'}
              </Text>
              <View
                className="p-2 bg-orange-50 rounded-full press-scale"
                onClick={() => {
                  setShowUpload(false)
                  setManualMode(false)
                  resetManual()
                }}
              >
                <Icon name="x" size={18} color="#4D3E3E" />
              </View>
            </View>

            {!manualMode ? (
              <>
                <View className="mb-4 p-4 bg-orange-50 rounded-2xl flex items-center gap-3">
                  <Icon name="sparkles" size={18} color="#FF7E33" strokeWidth={2.4} />
                  <Text className="flex-1 text-11px font-bold text-primary leading-relaxed">
                    已接入 通义千问 Qwen-VL，拍照 / 截图即可智能识别菜名、食材和步骤。
                  </Text>
                </View>

                <View className="grid grid-cols-2 gap-4 mb-4">
                  <View
                    className="flex flex-col items-center justify-center gap-3 p-8 border-2 border-dashed border-orange-200 rounded-2xl press-scale bg-white"
                    onClick={handleImageUpload}
                  >
                    <Icon name="camera" size={32} color="#FF7E33" />
                    <Text className="text-xs font-bold text-primary">AI 图片识别</Text>
                  </View>
                  <View className="flex flex-col items-center justify-center gap-3 p-8 border-2 border-dashed border-gray-200 rounded-2xl opacity-50">
                    <Icon name="upload" size={32} color="#9ca3af" />
                    <Text className="text-xs font-bold text-gray-500">PDF / 文档</Text>
                  </View>
                </View>

                {parsing && (
                  <View className="flex items-center justify-center gap-3 py-4">
                    <View className="animate-spin" style={{ width: '36rpx', height: '36rpx' }}>
                      <Icon name="sparkles" size={18} color="#FF7E33" />
                    </View>
                    <Text className="text-primary font-bold text-sm">AI 正在识别菜谱...</Text>
                  </View>
                )}

                <View
                  className="w-full py-4 bg-primary rounded-2xl press-scale flex items-center justify-center shadow-orange gap-2"
                  onClick={() => setManualMode(true)}
                >
                  <Icon name="plus-circle" size={16} color="#ffffff" strokeWidth={2.4} />
                  <Text className="text-white font-black text-sm">手动输入菜谱</Text>
                </View>
              </>
            ) : (
              <View className="flex flex-col">
                <ScrollView scrollY style={{ height: '680rpx' }} showScrollbar={false}>
                  <View className="pb-2">
                    <View className="mb-4 p-4 bg-orange-50 rounded-2xl border border-orange-100">
                      <Text className="block text-10px font-black text-primary tracking-widest mb-1">填写说明</Text>
                      <Text className="block text-11px font-bold text-espresso-40 leading-relaxed">
                        食材每行一条，支持「番茄 2 个」「番茄2个」「番茄,2,个」等写法；步骤每行一条，也支持用分号分隔。
                      </Text>
                    </View>

                    <View className="mb-3">
                      <Text className="block text-10px font-black text-primary tracking-widest mb-2">菜谱名称</Text>
                      <View className="bg-white rounded-2xl px-4 py-3 border border-orange-50-50 shadow-sm">
                        <Input
                          value={manualTitle}
                          onInput={(e) => setManualTitle(e.detail.value)}
                          placeholder="例：番茄牛腩煲"
                          placeholderStyle={PLACEHOLDER_STYLE}
                          className={INPUT_CLASS}
                          maxlength={40}
                          adjustPosition
                        />
                      </View>
                    </View>

                    <View className="mb-3">
                      <Text className="block text-10px font-black text-primary tracking-widest mb-2">一句描述</Text>
                      <View className="bg-white rounded-2xl px-4 py-3 border border-orange-50-50 shadow-sm">
                        <Input
                          value={manualDesc}
                          onInput={(e) => setManualDesc(e.detail.value)}
                          placeholder="例：酸甜开胃，适合周末"
                          placeholderStyle={PLACEHOLDER_STYLE}
                          className={INPUT_CLASS}
                          maxlength={120}
                          adjustPosition
                        />
                      </View>
                    </View>

                    <View className="mb-3">
                      <Text className="block text-10px font-black text-primary tracking-widest mb-2">食材清单</Text>
                      <Text className="block text-9px font-bold text-espresso-40 mb-2 leading-relaxed">
                        每行一条；名称、数量、单位之间用空格或英文逗号隔开均可。
                      </Text>
                      <View className="bg-white rounded-2xl px-4 py-3 border border-orange-50-50 shadow-sm">
                        <Textarea
                          value={manualIngredients}
                          onInput={(e) => setManualIngredients(e.detail.value)}
                          placeholder={'番茄 2 个\n鸡蛋 3 个\n食用油 适量'}
                          placeholderStyle={PLACEHOLDER_STYLE}
                          className={TEXTAREA_CLASS}
                          maxlength={2000}
                          style={{ minHeight: '200rpx', width: '100%' }}
                          showConfirmBar={false}
                        />
                      </View>
                    </View>

                    <View className="mb-4">
                      <Text className="block text-10px font-black text-primary tracking-widest mb-2">烹饪步骤</Text>
                      <Text className="block text-9px font-bold text-espresso-40 mb-2 leading-relaxed">每行一步，按制作顺序填写。</Text>
                      <View className="bg-white rounded-2xl px-4 py-3 border border-orange-50-50 shadow-sm">
                        <Textarea
                          value={manualSteps}
                          onInput={(e) => setManualSteps(e.detail.value)}
                          placeholder={'番茄切块备用\n鸡蛋打散\n热锅少油炒熟鸡蛋盛出\n下番茄炒软后回锅调味'}
                          placeholderStyle={PLACEHOLDER_STYLE}
                          className={TEXTAREA_CLASS}
                          maxlength={4000}
                          style={{ minHeight: '220rpx', width: '100%' }}
                          showConfirmBar={false}
                        />
                      </View>
                    </View>
                  </View>
                </ScrollView>

                <View className="flex gap-3 pt-3 mt-1 border-t border-orange-50-50 flex-shrink-0">
                  <View
                    className="flex-1 py-4 bg-warm-bg rounded-2xl flex items-center justify-center press-scale border border-orange-100"
                    onClick={() => setManualMode(false)}
                  >
                    <Text className="text-espresso font-black text-sm">返回</Text>
                  </View>
                  <View
                    className="flex-1 py-4 bg-primary rounded-2xl flex items-center justify-center press-scale shadow-orange"
                    onClick={createManualRecipe}
                  >
                    <Text className="text-white font-black text-sm">保存菜谱</Text>
                  </View>
                </View>
              </View>
            )}
          </View>
        </View>
      )}
    </View>
  )
}
