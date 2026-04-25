import React, { useCallback, useMemo, useState } from 'react'
import { View, Text } from '@tarojs/components'
import Taro, { useDidShow } from '@tarojs/taro'
import type { ShoppingItem } from '../../types'
import { loadDB, saveDB } from '../../services/storage'
import { cn } from '../../lib/utils'
import { Icon } from '../../components/Icon'
import type { IconName } from '../../components/Icon'
import './index.css'

export default function ShoppingPage() {
  const [shopping, setShopping] = useState<ShoppingItem[]>([])

  const hydrate = useCallback(() => {
    const db = loadDB()
    setShopping(db.shopping || [])
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
                            'block font-black tracking-tight',
                            item.completed ? 'line-through text-espresso-40' : 'text-espresso'
                          )}
                        >
                          {item.name}
                        </Text>
                        <Text className="block text-10px font-bold text-espresso-30 uppercase">{item.amount}</Text>
                      </View>
                    </View>
                  ))}
              </View>
            ))}
          </>
        ) : (
          <View className="mt-12 flex flex-col items-center gap-5 px-6">
            <View className="relative w-40 h-40 flex items-center justify-center">
              <View className="absolute inset-0 bg-glow-peach rounded-full" />
              <View className="relative w-32 h-32 bg-white rounded-full flex items-center justify-center shadow-card border-4 border-white">
                <Icon name="bag" size={60} color="#fdba74" strokeWidth={1.4} />
              </View>
              <View className="absolute" style={{ top: '-8rpx', right: '0rpx' }}>
                <Icon name="sparkles" size={24} color="#FFB347" fill="#FFB347" />
              </View>
            </View>
            <Text className="block font-black italic text-espresso text-xl mt-2">清单空空 生活缓缓</Text>
            <Text className="block text-center text-espresso-40 font-bold text-xs leading-relaxed px-8">
              去发现页挑一道心仪的菜{'\n'}点「全部加入」，就能把食材收进清单
            </Text>
            <View
              className="flex items-center gap-2 px-6 py-3 bg-primary rounded-full shadow-orange press-scale mt-2"
              onClick={() => Taro.switchTab({ url: '/pages/discovery/index' })}
            >
              <Icon name="compass" size={16} color="#ffffff" strokeWidth={2.4} />
              <Text className="text-white font-black text-xs">去发现灵感</Text>
            </View>
          </View>
        )}
      </View>
    </View>
  )
}
