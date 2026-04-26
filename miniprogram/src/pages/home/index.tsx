import React, { useCallback, useEffect, useRef, useState } from 'react'
import { Button, View, Text } from '@tarojs/components'
import Taro, { useDidShow } from '@tarojs/taro'
import type { Recipe } from '../../types'
import { loadDB, saveDB } from '../../services/storage'
import { initialRecipes } from '../../data/initialRecipes'
import {
  getHealingFoodFallback,
  getHealingFoodSuggestionFromModel,
  type HealingFoodSuggestion,
} from '../../services/aiHealingFood'
import { generateRecipeFromDish } from '../../services/recipeGenerator'
import { cn } from '../../lib/utils'
import { Icon } from '../../components/Icon'
import './index.css'

/** 四宫格第二张：与「暖心推荐」「灵感识别」同为短主标 + 短副标 */
const RANDOM_WHEEL_QUICK_LABEL = '美食抽签'
const RANDOM_WHEEL_QUICK_SUB = '帮你避免纠结'

/** 下方互动大卡待机时的说明（可两行） */
const RANDOM_WHEEL_IDLE_HINT =
  '从菜谱库随机抽签，专治选择困难。点「开始」滚动，点「暂停」揭晓。'

const QUICK_ITEMS: {
  label: string
  sub: string
  icon: 'sparkles' | 'calendar' | 'camera' | 'compass' | 'search'
  bg: string
  color: string
}[] = [
  { label: '暖心推荐', sub: '今日份小确幸', icon: 'sparkles', bg: 'bg-orange-50', color: '#FF7E33' },
  {
    label: RANDOM_WHEEL_QUICK_LABEL,
    sub: RANDOM_WHEEL_QUICK_SUB,
    icon: 'calendar',
    bg: 'bg-amber-50',
    color: '#ca8a04',
  },
  { label: '灵感识别', sub: '拍一拍存起来', icon: 'camera', bg: 'bg-purple-50', color: '#a855f7' },
  { label: '寻味更多', sub: '探索美食库', icon: 'search', bg: 'bg-blue-50', color: '#3b82f6' },
]

export default function HomePage() {
  const [recipes, setRecipes] = useState<Recipe[]>([])
  const [creativeSuggest, setCreativeSuggest] = useState<HealingFoodSuggestion | null>(null)
  const [creativeLoading, setCreativeLoading] = useState(false)
  const [creativeFromModel, setCreativeFromModel] = useState<boolean | null>(null)

  /** 随机吃什么：轮盘展示与暂停结果 */
  const [spinning, setSpinning] = useState(false)
  const [wheelFace, setWheelFace] = useState<Recipe | null>(null)
  const [luckyPick, setLuckyPick] = useState<Recipe | null>(null)
  const spinTimerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const wheelFaceRef = useRef<Recipe | null>(null)

  const hydrate = useCallback(() => {
    const db = loadDB()
    const r = db.recipes?.length ? db.recipes : initialRecipes
    setRecipes(r)
    saveDB({
      ...db,
      recipes: r,
      logs: db.logs || [],
      shopping: db.shopping || [],
      favorites: db.favorites || [],
    })
  }, [])

  useEffect(() => {
    hydrate()
  }, [hydrate])

  useDidShow(() => {
    hydrate()
  })

  const loadCreative = useCallback(async (avoidDishes?: string[], opts?: { useModel?: boolean }) => {
    // 先秒出兜底文案，提升体感
    const fallback = getHealingFoodFallback(avoidDishes)
    setCreativeSuggest(fallback)
    setCreativeFromModel(false)
    if (opts?.useModel === false) {
      setCreativeLoading(false)
      return
    }

    setCreativeLoading(true)
    try {
      const db = loadDB()
      const s = await getHealingFoodSuggestionFromModel({
        preferences: db.profile?.preferences,
        logs: db.logs || [],
        avoidDishes,
      })
      setCreativeSuggest({ ...s, fromModel: true })
      setCreativeFromModel(true)
    } catch (e: any) {
      const msg = String(e?.message || '')
      if (msg.includes('今日推荐已用完') || msg.includes('智能推荐次数已用完')) {
        Taro.showModal({
          title: '今日推荐已用完',
          content: msg.length > 120 ? msg.slice(0, 120) + '…' : msg,
          showCancel: false,
          confirmText: '好的',
        })
      }
      // 保持兜底即可
    } finally {
      setCreativeLoading(false)
    }
  }, [])

  useEffect(() => {
    // 首次进入只展示本地兜底，不消耗 AI 生文额度。
    void loadCreative(undefined, { useModel: false })
  }, [loadCreative])

  const stopRandomWheel = useCallback(() => {
    if (spinTimerRef.current) {
      clearInterval(spinTimerRef.current)
      spinTimerRef.current = null
    }
  }, [])

  useEffect(() => {
    return () => stopRandomWheel()
  }, [stopRandomWheel])

  const startRandomWheel = () => {
    if (!recipes.length) {
      Taro.showToast({ title: '菜谱库准备中', icon: 'none' })
      return
    }
    stopRandomWheel()
    setLuckyPick(null)
    setSpinning(true)
    const tick = () => {
      const r = recipes[Math.floor(Math.random() * recipes.length)]
      wheelFaceRef.current = r
      setWheelFace(r)
    }
    tick()
    spinTimerRef.current = setInterval(tick, 72)
  }

  const pauseRandomWheel = () => {
    stopRandomWheel()
    setSpinning(false)
    const locked = wheelFaceRef.current
    setLuckyPick(locked)
    if (locked) setWheelFace(locked)
  }

  const gotoDetail = (r: Recipe) => {
    Taro.navigateTo({ url: `/pages/recipe-detail/index?id=${r.id}` })
  }

  const openSuggestedDish = () => {
    if (!creativeSuggest?.dish) return
    const name = creativeSuggest.dish.trim()
    const hit = recipes.find((r) => r.title === name || r.title.includes(name) || name.includes(r.title))
    if (hit) {
      gotoDetail(hit)
      return
    }
    Taro.showModal({
      title: '这道菜还不在菜谱库里',
      content: `要不要为「${name}」生成一份可保存的菜谱？`,
      // 微信小程序限制：按钮文案不超过 4 个汉字
      cancelText: '去搜索',
      confirmText: '生成保存',
      success: (res) => {
        if (res.confirm) {
          void (async () => {
            Taro.showLoading({ title: '生成菜谱中...', mask: true })
            try {
              const db = loadDB()
              const prefs = db.profile?.preferences
              const gen = await generateRecipeFromDish({
                dish: name,
                userContext: {
                  diet: prefs?.dietaryType,
                  dislike: (prefs?.dislikedIngredients || []).join('、'),
                },
              })

              const newRecipe: Recipe = {
                id: 'ai-text-' + Date.now().toString(36),
                title: gen.title,
                description: gen.description || `把「${gen.title}」做得热气腾腾，心也跟着亮起来。`,
                ingredients: gen.ingredients,
                seasonings: gen.seasonings,
                instructions: gen.instructions,
                categories: gen.categories?.length ? gen.categories : ['AI 生成'],
                nutrition: gen.nutrition,
                mealTypes: gen.mealTypes?.length ? gen.mealTypes : ['dinner'],
                creatorId: 'user',
                isPublic: false,
                createdAt: new Date().toISOString(),
              }

              saveDB({
                ...db,
                recipes: [newRecipe, ...(db.recipes || [])],
                logs: db.logs || [],
                shopping: db.shopping || [],
                favorites: db.favorites || [],
              })

              setRecipes([newRecipe, ...(db.recipes || [])])
              Taro.hideLoading()
              Taro.showToast({ title: '已生成并保存', icon: 'success' })
              gotoDetail(newRecipe)
            } catch (e: any) {
              Taro.hideLoading()
              Taro.showModal({
                title: '生成失败',
                content: String(e?.message || '请稍后再试'),
                showCancel: false,
                confirmText: '好的',
              })
            }
          })()
        } else if (res.cancel) {
          Taro.setStorageSync('discovery_prefill_search', name)
          Taro.switchTab({ url: '/pages/discovery/index' })
        }
      },
    })
  }

  const handleQuick = (label: string) => {
    if (label === '暖心推荐') {
      Taro.showToast({ title: '正在生成一句暖胃推荐…', icon: 'none' })
      void loadCreative(creativeSuggest?.dish ? [creativeSuggest.dish] : undefined)
      return
    }
    if (label === RANDOM_WHEEL_QUICK_LABEL) {
      setTimeout(() => {
        Taro.pageScrollTo({ selector: '#home-random-wheel', duration: 240 }).catch(() => {})
      }, 80)
      return
    }
    if (label === '灵感识别') {
      Taro.setStorageSync('discovery_auto_upload', '1')
    }
    Taro.switchTab({ url: '/pages/discovery/index' })
  }

  return (
    <View className="min-h-screen bg-warm-bg text-espresso relative overflow-hidden">
      {/* 装饰性背景 */}
      <View className="absolute top-0 left-0 w-64 h-64 bg-glow-peach rounded-full" style={{ top: '-80rpx', left: '-80rpx' }} />
      <View className="absolute w-80 h-80 bg-glow-orange rounded-full" style={{ top: '320rpx', right: '-120rpx' }} />

      <View className="px-6 pt-10 pb-32 animate-page-in relative" style={{ paddingBottom: '300rpx' }}>
        {/* Hero */}
        <View className="mb-10 flex items-start justify-between gap-4">
          <View className="flex-1 min-w-0" style={{ width: 'calc(100% - 300rpx)' }}>
            <Text className="block text-40px font-black leading-tight tracking-tight mb-4">
              好好吃饭{'\n'}
              <Text className="text-primary italic">治愈生活</Text>
            </Text>
            <Text className="block text-espresso-40 font-bold text-sm leading-relaxed">让 AI 为你定制每日暖心菜单</Text>
            <Text
              className="block text-espresso-40 font-bold leading-relaxed"
              style={{ whiteSpace: 'nowrap', fontSize: '22rpx' }}
            >
              懂生活，更懂你的胃，让你的三餐每一口都有意思
            </Text>
          </View>

          {/* 右侧装饰：品牌感线稿「治愈饭碗」 */}
          <View
            className="bg-white-30 rounded-3xl border border-white"
            style={{
              width: '280rpx',
              height: '220rpx',
              position: 'relative',
              overflow: 'hidden',
              marginTop: '18rpx',
              marginLeft: '-8rpx',
            }}
          >
            <View
              className="absolute rounded-full"
              style={{
                width: '250rpx',
                height: '250rpx',
                background: 'radial-gradient(circle, rgba(255,126,51,0.18) 0%, rgba(255,126,51,0) 64%)',
                top: '-80rpx',
                left: '-80rpx',
              }}
            />

            {/* 小星星点缀 */}
            <View style={{ position: 'absolute', left: '16rpx', top: '16rpx', opacity: 0.2 }}>
              <Icon name="sparkles" size={30} color="#FF7E33" strokeWidth={1.4} />
            </View>
            <View style={{ position: 'absolute', right: '18rpx', top: '30rpx', opacity: 0.16 }}>
              <Icon name="sparkles" size={24} color="#FF7E33" strokeWidth={1.4} />
            </View>

            {/* 勺子（左下角） */}
            <View
              style={{
                position: 'absolute',
                left: '32rpx',
                bottom: '22rpx',
                width: '14rpx',
                height: '62rpx',
                borderRadius: '999rpx',
                backgroundColor: '#FF7E33',
                opacity: 0.55,
              }}
            />
            <View
              style={{
                position: 'absolute',
                left: '24rpx',
                bottom: '76rpx',
                width: '26rpx',
                height: '20rpx',
                borderRadius: '999rpx',
                borderWidth: '5rpx',
                borderStyle: 'solid',
                borderColor: '#FF7E33',
                opacity: 0.55,
                backgroundColor: 'rgba(255,255,255,0.22)',
              }}
            />

            {/* 叉子（右下角） */}
            <View
              style={{
                position: 'absolute',
                right: '18rpx',
                bottom: '22rpx',
                width: '16rpx',
                height: '72rpx',
                borderRadius: '999rpx',
                backgroundColor: '#FF7E33',
                opacity: 0.55,
              }}
            />
            {[0, 1, 2].map((i) => (
              <View
                key={`fork-prong-${i}`}
                style={{
                  position: 'absolute',
                  right: `${14 + i * 10}rpx`,
                  bottom: '98rpx',
                  width: '9rpx',
                  height: '22rpx',
                  borderRadius: '999rpx',
                  backgroundColor: '#FF7E33',
                  opacity: 0.55,
                }}
              />
            ))}

            {/* 米饭团（中间） */}
            <View
              style={{
                position: 'absolute',
                left: '72rpx',
                top: '66rpx',
                width: '126rpx',
                height: '92rpx',
                borderRadius: '999rpx',
                borderWidth: '5rpx',
                borderStyle: 'solid',
                borderColor: '#FF7E33',
                backgroundColor: 'rgba(255,255,255,0.45)',
                opacity: 0.95,
              }}
            />
            {/* 米粒点点 */}
            {[
              ['92rpx', '88rpx'],
              ['120rpx', '84rpx'],
              ['148rpx', '98rpx'],
              ['106rpx', '112rpx'],
              ['138rpx', '118rpx'],
            ].map(([l, t], idx) => (
              <View
                key={`grain-${idx}`}
                style={{
                  position: 'absolute',
                  left: l,
                  top: t,
                  width: '8rpx',
                  height: '8rpx',
                  borderRadius: '999rpx',
                  backgroundColor: '#FF7E33',
                  opacity: 0.18,
                }}
              />
            ))}
            {/* 小脸 */}
            <View style={{ position: 'absolute', left: '110rpx', top: '118rpx', width: '10rpx', height: '10rpx', borderRadius: '999rpx', backgroundColor: '#FF7E33', opacity: 0.55 }} />
            <View style={{ position: 'absolute', left: '152rpx', top: '118rpx', width: '10rpx', height: '10rpx', borderRadius: '999rpx', backgroundColor: '#FF7E33', opacity: 0.55 }} />
            <View
              style={{
                position: 'absolute',
                left: '130rpx',
                top: '132rpx',
                width: '26rpx',
                height: '12rpx',
                borderBottomWidth: '5rpx',
                borderBottomStyle: 'solid',
                borderBottomColor: '#FF7E33',
                borderRadius: '0 0 999rpx 999rpx',
                opacity: 0.55,
              }}
            />

            {/* 碗（底部） */}
            <View
              style={{
                position: 'absolute',
                left: '62rpx',
                top: '120rpx',
                width: '146rpx',
                height: '66rpx',
                borderRadius: '0 0 46rpx 46rpx',
                borderWidth: '5rpx',
                borderStyle: 'solid',
                borderColor: '#FF7E33',
                backgroundColor: 'rgba(255,255,255,0.25)',
                opacity: 0.95,
              }}
            />
            {/* 碗口 */}
            <View
              style={{
                position: 'absolute',
                left: '62rpx',
                top: '112rpx',
                width: '146rpx',
                height: '18rpx',
                borderRadius: '999rpx',
                borderWidth: '5rpx',
                borderStyle: 'solid',
                borderColor: '#FF7E33',
                opacity: 0.9,
                backgroundColor: 'rgba(255,255,255,0.25)',
              }}
            />
          </View>
        </View>

        {/* 4 × 快捷入口 */}
        <View className="grid grid-cols-2 gap-3 mb-6">
          {QUICK_ITEMS.map((item) => (
            <View
              key={item.label}
              className="flex items-center gap-3 p-3 bg-white-60 rounded-3xl shadow-card border border-white press-scale"
              onClick={() => handleQuick(item.label)}
            >
              <View className={cn('flex-shrink-0 w-10 h-10 rounded-2xl flex items-center justify-center', item.bg)}>
                <Icon name={item.icon} size={18} color={item.color} strokeWidth={2.2} />
              </View>
              <View className="flex-1 min-w-0">
                <Text className="block text-xs font-black text-espresso tracking-tight">{item.label}</Text>
                <Text className="block text-9px font-bold text-espresso-40 tracking-wide mt-1">{item.sub}</Text>
              </View>
            </View>
          ))}
        </View>

        {/* AI 治愈推荐：通义生成「不限于菜谱」的菜名 + 文案，可换一道 */}
        <View
          className="p-5 rounded-healing shadow-card relative overflow-hidden mb-5 animate-slide-up border"
          style={{
            borderWidth: '2rpx',
            borderStyle: 'solid',
            borderColor: '#fed7aa',
            background: 'linear-gradient(175deg, #fff7ed 0%, #ffffff 42%, #fff1e6 100%)',
            minHeight: '430rpx',
          }}
        >
          <View className="absolute opacity-25" style={{ top: '-20rpx', right: '-8rpx' }}>
            <Icon name="sparkles" size={96} color="#FFEDD5" strokeWidth={1.4} />
          </View>

          <View className="relative flex flex-col" style={{ minHeight: '390rpx' }}>
            <View className="mb-2 flex items-center justify-between gap-2">
              <View className="flex items-center gap-2 min-w-0">
                <View className="w-2 h-2 bg-primary rounded-full animate-pulse flex-shrink-0" />
                <Text className="text-9px font-black text-primary tracking-widest uppercase truncate">
                  {creativeLoading ? '通义千问正在为你造一味温柔…' : 'AI 治愈小厨 · 随心一味'}
                </Text>
              </View>
              {!creativeLoading && creativeFromModel === false && (
                <Text className="text-9px font-bold text-espresso-30 flex-shrink-0">本地灵感</Text>
              )}
            </View>

            <View className="mb-3 pr-1 flex-1">
              {creativeLoading && !creativeSuggest ? (
                <Text className="block text-sm font-bold text-espresso-40 leading-relaxed">
                  正在写一封给胃的小短信，马上就好…
                </Text>
              ) : creativeSuggest ? (
                <>
                  <Text className="block text-11px font-bold text-espresso leading-relaxed mb-3 whitespace-pre-line">
                    {creativeSuggest.healing}
                  </Text>
                  <View className="px-3 py-2 bg-white-70 rounded-2xl border border-orange-100 mb-2">
                    <Text className="block text-9px font-black text-primary tracking-widest mb-1">今日一味</Text>
                    <Text className="block text-xl font-black italic text-espresso leading-tight tracking-tight">
                      {creativeSuggest.dish}
                    </Text>
                  </View>
                  <Text className="block text-10px text-espresso-40 font-bold leading-relaxed">{creativeSuggest.tagline}</Text>
                </>
              ) : (
                <Text className="block text-sm font-bold text-espresso-40 leading-relaxed">稍后再试一次~</Text>
              )}
            </View>

            <View className="flex gap-2">
              <Button
                className="flex-1 bg-primary text-white py-3 rounded-healing text-xs font-black shadow-orange press-scale"
                disabled={!creativeSuggest || creativeLoading}
                onClick={openSuggestedDish}
              >
                去尝尝
              </Button>
              <Button
                className="px-4 bg-white-90 text-primary py-3 rounded-healing text-xs font-black press-scale border border-orange-200"
                disabled={creativeLoading}
                  onClick={() => void loadCreative(creativeSuggest?.dish ? [creativeSuggest.dish] : undefined)}
              >
                {creativeLoading ? '生成中' : '换一道'}
              </Button>
            </View>
          </View>
        </View>

        {/* 随机吃什么：蜜杏暖色 + 动感，与上方 AI 卡同属暖色系、层次略浅 */}
        <View
          id="home-random-wheel"
          className="p-5 rounded-healing shadow-card relative overflow-hidden mb-5 animate-slide-up border"
          style={{
            borderWidth: '2rpx',
            borderStyle: 'solid',
            borderColor: '#fde68a',
            background: 'linear-gradient(165deg, #fffbeb 0%, #ffffff 50%, #fff7ed 100%)',
          }}
        >
          <View className="absolute opacity-30" style={{ bottom: '-28rpx', left: '-12rpx' }}>
            <Icon name="compass" size={108} color="#FDE68A" strokeWidth={1.2} />
          </View>
          <View className="relative">
            <View className="mb-2 flex items-center gap-2">
              <View
                className={cn(
                  'w-2 h-2 rounded-full flex-shrink-0 bg-secondary',
                  spinning && 'animate-pulse'
                )}
              />
              <Text className="text-9px font-black text-secondary tracking-widest uppercase">
                {`${RANDOM_WHEEL_QUICK_LABEL} · 互动`}
              </Text>
            </View>

            <View className="mb-1 min-h-0 pr-1">
              <Text
                className={cn(
                  'block text-lg font-black text-espresso leading-tight tracking-tight mb-2',
                  spinning && 'italic text-primary'
                )}
              >
                {spinning && wheelFace
                  ? wheelFace.title
                  : luckyPick
                    ? luckyPick.title
                    : '准备好了吗？'}
              </Text>
              <Text className="block text-11px text-espresso-40 font-bold leading-relaxed clamp-2">
                {spinning
                  ? '菜名在菜谱库里飞快掠过，点「暂停」锁定缘分…'
                  : luckyPick
                    ? luckyPick.description || '就这道啦，点开看看怎么做～'
                    : RANDOM_WHEEL_IDLE_HINT}
              </Text>
            </View>

            <View className="flex gap-2">
              {spinning ? (
                <Button
                  className="flex-1 bg-secondary text-espresso py-3 rounded-healing text-xs font-black shadow-sm press-scale"
                  onClick={pauseRandomWheel}
                >
                  暂停
                </Button>
              ) : (
                <Button
                  className="flex-1 bg-primary text-white py-3 rounded-healing text-xs font-black shadow-orange press-scale"
                  onClick={startRandomWheel}
                >
                  {luckyPick ? '再转一次' : '开始'}
                </Button>
              )}
              <Button
                className="px-4 py-3 rounded-healing text-xs font-black press-scale bg-white-90 text-primary border border-orange-200"
                disabled={!luckyPick || spinning}
                onClick={() => luckyPick && gotoDetail(luckyPick)}
              >
                看菜谱
              </Button>
            </View>
          </View>
        </View>

        {/* 底部温馨话 */}
        <View className="mt-14 flex flex-col items-center gap-2 opacity-60 animate-slide-up">
          <Icon name="heart-pulse" size={18} color="#FF7E33" strokeWidth={2.2} />
          <Text className="text-10px font-black text-espresso-40 tracking-widest">用一餐的温度 · 治愈一天的疲惫</Text>
        </View>
      </View>

    </View>
  )
}
