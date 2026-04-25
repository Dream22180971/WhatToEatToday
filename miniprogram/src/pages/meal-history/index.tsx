import React, { useCallback, useMemo, useState } from 'react'
import { View, Text } from '@tarojs/components'
import Taro, { useDidShow } from '@tarojs/taro'
import type { MealLog } from '../../types'
import { loadDB } from '../../services/storage'
import { Icon } from '../../components/Icon'
import './index.css'

const MEAL: Record<MealLog['mealType'], string> = {
  breakfast: '早餐',
  lunch: '午餐',
  dinner: '晚餐',
  snack: '加餐',
}

const ORDER: Record<MealLog['mealType'], number> = {
  breakfast: 0,
  lunch: 1,
  dinner: 2,
  snack: 3,
}

function formatDate(d: string) {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(d)
  if (!m) return d
  return `${Number(m[2])}月${Number(m[3])}日`
}

export default function MealHistoryPage() {
  const [logs, setLogs] = useState<MealLog[]>([])

  const hydrate = useCallback(() => {
    const db = loadDB()
    const list = [...(db.logs || [])]
    list.sort((a, b) => {
      if (a.date !== b.date) return b.date.localeCompare(a.date)
      return ORDER[b.mealType] - ORDER[a.mealType]
    })
    setLogs(list)
  }, [])

  useDidShow(hydrate)

  const groups = useMemo(() => {
    const map: { date: string; items: MealLog[] }[] = []
    for (const log of logs) {
      const last = map[map.length - 1]
      if (last && last.date === log.date) last.items.push(log)
      else map.push({ date: log.date, items: [log] })
    }
    return map
  }, [logs])

  const open = (log: MealLog) => {
    if (log.recipeId) Taro.navigateTo({ url: `/pages/recipe-detail/index?id=${log.recipeId}` })
  }

  return (
    <View className="min-h-screen bg-warm-bg text-espresso animate-page-in">
      <View className="px-6 pt-6 pb-32">
        <Text className="block text-10px font-bold text-espresso-40 tracking-widest uppercase mb-2">时光轴</Text>
        <Text className="block text-2xl font-black italic text-espresso mb-8">饮食历程</Text>

        {groups.length ? (
          groups.map((g) => (
            <View key={g.date} className="mb-8">
              <Text className="block text-xs font-black text-primary mb-3">
                {formatDate(g.date)} <Text className="text-espresso-40 font-bold">{g.date}</Text>
              </Text>
              {g.items.map((log) => (
                <View
                  key={log.id}
                  className="flex items-center justify-between p-4 bg-white rounded-3xl shadow-card border border-orange-50-50 press-scale mb-2"
                  onClick={() => open(log)}
                >
                  <View className="flex-1 min-w-0 pr-2">
                    <View className="flex items-center gap-2 mb-1">
                      <View className="px-2 py-0.5 bg-orange-50 rounded-full">
                        <Text className="text-9px font-black text-primary">{MEAL[log.mealType]}</Text>
                      </View>
                      {!log.recipeId && (
                        <Text className="text-9px font-bold text-espresso-30">无菜谱链接</Text>
                      )}
                    </View>
                    <Text className="block text-sm font-black text-espresso truncate">{log.recipeTitle || '已记录'}</Text>
                  </View>
                  {log.recipeId ? <Icon name="chevron-right" size={18} color="#fdba74" strokeWidth={3} /> : null}
                </View>
              ))}
            </View>
          ))
        ) : (
          <View className="mt-20 flex flex-col items-center gap-4 text-center">
            <Icon name="history" size={80} color="#fdba74" strokeWidth={1.4} />
            <Text className="block text-xl font-black italic text-espresso">还没有饮食记录</Text>
            <Text className="block text-xs font-bold text-espresso-40 leading-relaxed">
              在菜谱详情轻点「记一餐到饮食历程」{'\n'}会按日期出现在这里
            </Text>
          </View>
        )}
      </View>
    </View>
  )
}
