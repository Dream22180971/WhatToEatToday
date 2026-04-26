import React, { useCallback, useMemo, useState } from 'react'
import { View, Text } from '@tarojs/components'
import Taro, { useDidShow } from '@tarojs/taro'
import type { ShoppingItem } from '../../types'
import { loadDB, saveDB } from '../../services/storage'
import { cn } from '../../lib/utils'
import { Icon } from '../../components/Icon'
import type { IconName } from '../../components/Icon'
import './index.css'

function todayKey() {
  const d = new Date()
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

function todayRecipesKey(dateKey: string) {
  return `shopping_today_recipes_${dateKey}`
}

function makeAmount(x: any) {
  const a = String(x?.amount || '').trim()
  const u = String(x?.unit || '').trim()
  return (a + u).trim() || '适量'
}

function parseAmount(amount: string): { num: number; unit: string } | null {
  const raw = String(amount || '').trim()
  const firstPart = raw.split(',')[0]?.trim() || ''
  const m = firstPart.match(/^(\d+(?:\.\d+)?)(.*)$/)
  if (!m) return null
  const num = Number(m[1])
  if (!Number.isFinite(num)) return null
  return { num, unit: String(m[2] || '').trim() }
}

function normalizeAmountText(amount: string) {
  const raw = String(amount || '').trim()
  if (!raw) return raw
  // 仅做展示层规范化：200G -> 200g（其他单位保持原样）
  return raw.replace(/(\d)\s*G\b/g, '$1g').replace(/(\d)\s*G(?=\s|$)/g, '$1g')
}

export default function ShoppingPage() {
  const [shopping, setShopping] = useState<ShoppingItem[]>([])
  const [todayRecipeCounts, setTodayRecipeCounts] = useState<Record<string, number>>({})
  const [recipes, setRecipes] = useState<any[]>([])

  const hydrate = useCallback(() => {
    const db = loadDB()
    setShopping(db.shopping || [])
    setRecipes(db.recipes || [])

    const k = todayRecipesKey(todayKey())
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
    setTodayRecipeCounts(counts)
  }, [])

  useDidShow(() => {
    hydrate()
  })

  React.useEffect(() => {
    hydrate()
  }, [hydrate])

  const mergedShopping = useMemo(() => {
    return shopping.reduce<ShoppingItem[]>((acc, item) => {
      const existing = acc.find(
        (i) => i.name === item.name && i.type === item.type && i.completed === item.completed
      )
      if (existing) {
        const m1 = item.amount.match(/(\d+\.?\d*)(.*)/)
        const m2 = existing.amount.match(/(\d+\.?\d*)(.*)/)
        if (m1 && m2 && m1[2].trim() === m2[2].trim()) {
          const sum = parseFloat(m1[1]) + parseFloat(m2[1])
          existing.amount = `${sum}${m1[2]}`
        } else if (!existing.amount.includes(item.amount)) {
          existing.amount = `${existing.amount}, ${item.amount}`
        }
        return acc
      }
      acc.push({ ...item })
      return acc
    }, [])
  }, [shopping])

  const persist = (next: ShoppingItem[]) => {
    const db = loadDB()
    saveDB({
      ...db,
      shopping: next,
      recipes: db.recipes || [],
      logs: db.logs || [],
      favorites: db.favorites || [],
    })
  }

  const persistTodayRecipeCounts = (counts: Record<string, number>) => {
    const k = todayRecipesKey(todayKey())
    Taro.setStorageSync(k, counts)
  }

  const todayRecipes = useMemo(() => {
    const map = new Map(recipes.map((r) => [r.id, r]))
    return Object.entries(todayRecipeCounts)
      .map(([id, count]) => {
        const r = map.get(id)
        if (!r) return null
        return { recipe: r, count }
      })
      .filter(Boolean) as { recipe: any; count: number }[]
  }, [recipes, todayRecipeCounts])

  const addRecipeToToday = (recipeId: string) => {
    if (!recipeId) return
    const nextCounts = { ...todayRecipeCounts, [recipeId]: (todayRecipeCounts[recipeId] || 0) + 1 }
    setTodayRecipeCounts(nextCounts)
    persistTodayRecipeCounts(nextCounts)

    const r = recipes.find((x) => x.id === recipeId)
    if (!r) return
    const now = Date.now().toString(36)
    const toItems: ShoppingItem[] = []
    for (const ing of r.ingredients || []) {
      const name = String((ing as any)?.name || '').trim()
      if (!name) continue
      toItems.push({
        id: `shop-ing-${recipeId}-${now}-${Math.random().toString(36).slice(2, 6)}`,
        userId: 'user',
        name,
        amount: makeAmount(ing),
        completed: false,
        recipeId,
        type: 'ingredient',
      })
    }
    for (const s of r.seasonings || []) {
      const name = String((s as any)?.name || '').trim()
      if (!name) continue
      toItems.push({
        id: `shop-sea-${recipeId}-${now}-${Math.random().toString(36).slice(2, 6)}`,
        userId: 'user',
        name,
        amount: makeAmount(s),
        completed: false,
        recipeId,
        type: 'seasoning',
      })
    }
    if (toItems.length) {
      const next = [...shopping, ...toItems]
      setShopping(next)
      persist(next)
      Taro.showToast({ title: '已加入清单', icon: 'success' })
    } else {
      Taro.showToast({ title: '菜谱暂无食材/调料', icon: 'none' })
    }
  }

  const decRecipeServing = (recipeId: string) => {
    if (!recipeId) return
    const current = todayRecipeCounts[recipeId] || 0
    if (current <= 0) return

    const r = recipes.find((x) => x.id === recipeId)
    if (!r) return

    // 先把清单里这一份的食材/调料扣掉
    let nextShop = shopping.slice()
    const decBy = (name: string, type: ShoppingItem['type'], decAmount: string) => {
      const idx = nextShop.findIndex(
        (s) => !s.completed && s.recipeId === recipeId && s.type === type && s.name === name
      )
      if (idx === -1) return
      const existing = nextShop[idx]
      const p1 = parseAmount(existing.amount)
      const p2 = parseAmount(decAmount)
      if (p1 && p2 && p1.unit === p2.unit) {
        const left = p1.num - p2.num
        if (left > 0) nextShop[idx] = { ...existing, amount: `${left}${p1.unit}` }
        else nextShop.splice(idx, 1)
        return
      }
      // 无法解析/单位不一致：降级为移除一条
      nextShop.splice(idx, 1)
    }

    for (const ing of r.ingredients || []) {
      const name = String((ing as any)?.name || '').trim()
      if (!name) continue
      decBy(name, 'ingredient', makeAmount(ing))
    }
    for (const s of r.seasonings || []) {
      const name = String((s as any)?.name || '').trim()
      if (!name) continue
      decBy(name, 'seasoning', makeAmount(s))
    }

    setShopping(nextShop)
    persist(nextShop)

    // 再把份数 -1（到 0 就移除菜品）
    const nextCounts = { ...todayRecipeCounts }
    const nextC = current - 1
    if (nextC > 0) nextCounts[recipeId] = nextC
    else delete nextCounts[recipeId]
    setTodayRecipeCounts(nextCounts)
    persistTodayRecipeCounts(nextCounts)
  }

  const removeRecipeFromToday = (recipeId: string) => {
    const r = recipes.find((x) => x.id === recipeId)
    const currentCount = todayRecipeCounts[recipeId] || 0
    if (currentCount <= 0) return
    Taro.showModal({
      title: '移出菜品',
      content: r ? `将「${r.title}」移出今日菜品，并移除它带来的清单项？` : '将该菜品移出今日菜品，并移除它带来的清单项？',
      cancelText: '仅移出',
      confirmText: '一并移除',
      success: (res) => {
        const nextCounts = { ...todayRecipeCounts }
        delete nextCounts[recipeId]
        setTodayRecipeCounts(nextCounts)
        persistTodayRecipeCounts(nextCounts)
        if (res.confirm) {
          const nextShop = shopping.filter((s) => s.recipeId !== recipeId)
          setShopping(nextShop)
          persist(nextShop)
        }
      },
    })
  }

  const openPickTodayRecipe = () => {
    // 微信限制：showActionSheet 最多 6 项
    const list = recipes.slice().reverse().slice(0, 5)
    if (!list.length) {
      Taro.showModal({
        title: '还没有菜谱',
        content: '先去发现页新增几道菜谱，再来挑选吧。',
        showCancel: false,
        confirmText: '好的',
      })
      return
    }
    Taro.showActionSheet({
      itemList: list.map((r) => r.title).concat(['去发现页挑选…']),
      success: (res) => {
        const idx = res.tapIndex
        if (idx === list.length) {
          Taro.switchTab({ url: '/pages/discovery/index' })
          return
        }
        const r = list[idx]
        if (r) addRecipeToToday(r.id)
      },
    })
  }

  const toggle = (name: string, type: ShoppingItem['type']) => {
    const updated = shopping.map((s) =>
      s.name === name && s.type === type ? { ...s, completed: !s.completed } : s
    )
    setShopping(updated)
    persist(updated)
  }

  const clearAll = () => {
    setShopping([])
    persist([])
    // 同时清空：今日菜品（菜品卡片）
    setTodayRecipeCounts({})
    persistTodayRecipeCounts({})
    Taro.showToast({ title: '已清空', icon: 'success' })
  }

  const ingredientItems = mergedShopping.filter((i) => i.type === 'ingredient')
  const seasoningItems = mergedShopping.filter((i) => i.type === 'seasoning')

  const totalCount = mergedShopping.length
  const doneCount = mergedShopping.filter((i) => i.completed).length

  return (
    <View className="min-h-screen bg-warm-bg text-espresso relative overflow-hidden animate-page-in">
      <View className="absolute bg-glow-peach rounded-full" style={{ top: '-80rpx', left: '-100rpx', width: '360rpx', height: '360rpx' }} />
      <View className="absolute bg-glow-orange rounded-full" style={{ top: '360rpx', right: '-160rpx', width: '420rpx', height: '420rpx' }} />

      <View className="px-6 pt-10 pb-32 relative">
        <View className="flex justify-between items-end mb-6 px-1">
          <View className="flex items-center gap-3">
            <View className="w-12 h-12 bg-orange-100 rounded-2xl flex items-center justify-center shadow-sm">
              <Icon name="list" size={22} color="#FF7E33" strokeWidth={2.4} />
            </View>
            <View>
              <Text className="block text-2xl font-black italic text-espresso tracking-tight">购物清单</Text>
              <Text className="block text-10px font-bold text-espresso-40 tracking-widest uppercase">
                {totalCount ? `已备齐 ${doneCount} / ${totalCount}` : '准备启程 · 去寻味吧'}
              </Text>
            </View>
          </View>
          {totalCount > 0 && (
            <View
              className="flex items-center gap-1 px-3 py-2 bg-white-60 rounded-full border border-orange-100 press-scale"
              onClick={clearAll}
            >
              <Icon name="x" size={12} color="#FF7E33" strokeWidth={3} />
              <Text className="text-10px font-black text-primary tracking-wider">清空</Text>
            </View>
          )}
        </View>

        {/* 今日菜品 */}
        <View className="mb-6 bg-white-60 rounded-3xl shadow-card border border-white p-5">
          <View className="flex items-center justify-between mb-3">
            <View className="flex items-center gap-2">
              <View className="w-10 h-10 bg-orange-50 rounded-2xl flex items-center justify-center">
                <Icon name="sparkles" size={18} color="#FF7E33" strokeWidth={2.4} />
              </View>
              <View>
                <Text className="block text-sm font-black text-espresso tracking-tight">今日菜品</Text>
                <Text className="block text-10px font-bold text-espresso-30 tracking-widest">每道菜一个卡片</Text>
              </View>
            </View>
            <View
              className="px-4 py-2 bg-orange-50 rounded-full border border-orange-100 press-scale"
              onClick={openPickTodayRecipe}
            >
              <Text className="text-10px font-black text-primary">添加菜品</Text>
            </View>
          </View>

          {todayRecipes.length ? (
            <View className="space-y-4">
              {todayRecipes.map(({ recipe: r, count }) => {
                return (
                  <View key={r.id} className="bg-white rounded-3xl border border-orange-50-50 shadow-sm p-4">
                    <View className="flex items-center justify-between mb-3">
                      <Text className="text-base font-black italic text-espresso">{`${r.title}  ×${count}`}</Text>
                      <View className="flex items-center gap-2">
                        <View
                          className="w-9 h-9 rounded-full bg-orange-50 border border-orange-100 flex items-center justify-center press-scale"
                          onClick={() => decRecipeServing(r.id)}
                        >
                          <Text className="text-primary font-black text-base" style={{ lineHeight: '1' }}>
                            -
                          </Text>
                        </View>
                        <View
                          className="w-9 h-9 rounded-full bg-orange-50 border border-orange-100 flex items-center justify-center press-scale"
                          onClick={() => addRecipeToToday(r.id)}
                        >
                          <Text className="text-primary font-black text-base" style={{ lineHeight: '1' }}>
                            +
                          </Text>
                        </View>
                        <View
                          className="flex items-center gap-1 px-3 py-2 rounded-full bg-orange-50 border border-orange-100 press-scale"
                          onClick={() => removeRecipeFromToday(r.id)}
                        >
                          <Icon name="x" size={12} color="#FF7E33" strokeWidth={3} />
                          <Text className="text-10px font-black text-primary">移除</Text>
                        </View>
                      </View>
                    </View>
                  </View>
                )
              })}
            </View>
          ) : (
            <Text className="block text-xs font-bold text-espresso-40 leading-relaxed">
              还没添加菜品。点右上角「添加菜品」，每道菜会单独成卡片展示。
            </Text>
          )}
        </View>

        {mergedShopping.length ? (
          <>
            {(
              [
                { type: 'ingredient' as const, label: '挑选新鲜食材', sub: '大地馈赠 · 当季当鲜', icon: 'leaf' as IconName, bg: 'bg-green-50', color: '#22c55e', items: ingredientItems },
                { type: 'seasoning' as const, label: '备好调味魔法', sub: '一点点 · 点亮味蕾', icon: 'flame' as IconName, bg: 'bg-orange-50', color: '#FF7E33', items: seasoningItems },
              ].filter((g) => g.items.length)
            ).map((group) => (
              <View key={group.type} className="mb-8 animate-slide-up">
                <View className="flex items-center gap-3 mb-4">
                  <View className={cn('w-10 h-10 rounded-2xl flex items-center justify-center shadow-sm', group.bg)}>
                    <Icon name={group.icon} size={18} color={group.color} strokeWidth={2.4} />
                  </View>
                  <View>
                    <Text className="block text-sm font-black text-espresso tracking-tight">{group.label}</Text>
                    <Text className="block text-10px font-bold text-espresso-30 tracking-widest">{group.sub}</Text>
                  </View>
                </View>
                {group.items
                  .slice()
                  .sort((a, b) => Number(a.completed) - Number(b.completed))
                  .map((item, idx) => (
                    <View
                      key={`${item.name}-${item.type}-${item.completed}-${idx}`}
                      className={cn(
                        'flex items-center gap-4 p-5 rounded-healing border shadow-card mb-3 press-scale',
                        item.completed
                          ? 'bg-orange-50-30 border-transparent opacity-60'
                          : 'bg-white border-orange-50-50'
                      )}
                      onClick={() => toggle(item.name, item.type)}
                    >
                      <View
                        className={cn(
                          'w-6 h-6 rounded-full flex items-center justify-center',
                          item.completed ? 'bg-primary' : 'border-2 border-orange-100'
                        )}
                      >
                        {item.completed && <Icon name="check" size={16} color="#ffffff" strokeWidth={3} />}
                      </View>
                      <View className="flex-1">
                        <Text
                          className={cn(
                            'block text-base font-black tracking-tight',
                            item.completed ? 'line-through text-espresso-40' : 'text-espresso'
                          )}
                        >
                          {item.name}
                          {group.type === 'ingredient' && (
                            <Text className="text-espresso-30 font-bold">{`  ${normalizeAmountText(item.amount)}`}</Text>
                          )}
                        </Text>
                      </View>
                    {/* 已移除：清单行的“+”加量按钮（食材/调料都不展示） */}
                    </View>
                  ))}
              </View>
            ))}
          </>
        ) : (
          <View className="mt-4 px-1">
            <View
              className="inline-flex items-center gap-2 px-4 py-2 bg-white-60 rounded-full border border-orange-100 press-scale"
              onClick={() => Taro.switchTab({ url: '/pages/discovery/index' })}
            >
              <Icon name="search" size={14} color="#FF7E33" strokeWidth={2.4} />
              <Text className="text-10px font-black text-primary">去发现页挑菜生成清单</Text>
            </View>
          </View>
        )}
      </View>
    </View>
  )
}
