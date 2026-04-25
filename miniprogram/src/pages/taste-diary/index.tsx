import React, { useCallback, useMemo, useState } from 'react'
import { View, Text, Input, Textarea, Picker, Button } from '@tarojs/components'
import Taro, { useDidShow } from '@tarojs/taro'
import type { DietType, UserProfile, UserPreferences } from '../../types'
import { loadDB, saveDB } from '../../services/storage'
import { Icon } from '../../components/Icon'
import { cn } from '../../lib/utils'
import './index.css'

const DIET: { value: DietType; label: string }[] = [
  { value: 'none', label: '无特别限制' },
  { value: 'vegetarian', label: '蛋奶素' },
  { value: 'vegan', label: '全素' },
  { value: 'keto', label: '生酮' },
  { value: 'paleo', label: '原始人饮食' },
]

function defaultProfile(): UserProfile {
  return {
    uid: 'user',
    displayName: '美食爱好者',
    email: 'user@example.com',
    preferences: { dietaryType: 'none', dislikedIngredients: [], favoriteCuisines: [] },
    tier: 'standard',
    extraSlots: 0,
    createdAt: new Date().toISOString(),
  }
}

function tagsToString(arr: string[]) {
  return arr.length ? arr.join('、') : ''
}

function stringToTags(s: string) {
  return s
    .split(/[,，、\n]/)
    .map((x) => x.trim())
    .filter(Boolean)
}

export default function TasteDiaryPage() {
  const [displayName, setDisplayName] = useState('')
  const [dietIndex, setDietIndex] = useState(0)
  const [disliked, setDisliked] = useState('')
  const [cuisines, setCuisines] = useState('')

  const dietLabel = useMemo(() => DIET[dietIndex]?.label ?? '无特别限制', [dietIndex])

  const hydrate = useCallback(() => {
    const db = loadDB()
    const p = db.profile || defaultProfile()
    setDisplayName(p.displayName || '')
    const idx = Math.max(0, DIET.findIndex((d) => d.value === p.preferences.dietaryType))
    setDietIndex(idx === -1 ? 0 : idx)
    setDisliked(tagsToString(p.preferences.dislikedIngredients))
    setCuisines(tagsToString(p.preferences.favoriteCuisines))
  }, [])

  useDidShow(hydrate)

  const save = () => {
    const db = loadDB()
    const prev = db.profile || defaultProfile()
    const preferences: UserPreferences = {
      dietaryType: DIET[dietIndex].value,
      dislikedIngredients: stringToTags(disliked),
      favoriteCuisines: stringToTags(cuisines),
    }
    const next: UserProfile = { ...prev, displayName: displayName.trim() || '美食爱好者', preferences }
    saveDB({
      ...db,
      profile: next,
      recipes: db.recipes || [],
      logs: db.logs || [],
      shopping: db.shopping || [],
      favorites: db.favorites || [],
    })
    Taro.showToast({ title: '已保存', icon: 'success' })
  }

  return (
    <View className="min-h-screen bg-warm-bg text-espresso animate-page-in">
      <View className="px-6 pt-6 pb-32">
        <Text className="block text-10px font-bold text-espresso-40 tracking-widest uppercase mb-2">
          会用于首页智能推荐
        </Text>
        <Text className="block text-2xl font-black italic text-espresso mb-8">口味与习惯</Text>

        <View className="bg-white rounded-3xl shadow-card border border-orange-50-50 p-5 mb-4">
          <Text className="block text-10px font-black text-primary tracking-widest mb-2">称呼</Text>
          <Input
            className="text-sm font-bold text-espresso"
            value={displayName}
            placeholder="想怎么被称呼"
            onInput={(e) => setDisplayName(e.detail.value)}
          />
        </View>

        <View className="bg-white rounded-3xl shadow-card border border-orange-50-50 p-5 mb-4">
          <Text className="block text-10px font-black text-primary tracking-widest mb-2">饮食类型</Text>
          <Picker
            mode="selector"
            range={DIET}
            rangeKey="label"
            value={dietIndex}
            onChange={(e) => setDietIndex(Number(e.detail.value))}
          >
            <View className="flex items-center justify-between">
              <Text className="text-sm font-black text-espresso">{dietLabel}</Text>
              <Icon name="chevron-down" size={18} color="#fdba74" strokeWidth={3} />
            </View>
          </Picker>
        </View>

        <View className="bg-white rounded-3xl shadow-card border border-orange-50-50 p-5 mb-4">
          <Text className="block text-10px font-black text-primary tracking-widest mb-2">不太喜欢</Text>
          <Text className="block text-9px font-bold text-espresso-40 mb-2">用顿号、逗号分隔，如：香菜、洋葱</Text>
          <Textarea
            className="text-xs font-bold text-espresso w-full"
            style={{ minHeight: '120rpx' }}
            value={disliked}
            placeholder="可留空"
            onInput={(e) => setDisliked(e.detail.value)}
          />
        </View>

        <View className="bg-white rounded-3xl shadow-card border border-orange-50-50 p-5 mb-8">
          <Text className="block text-10px font-black text-primary tracking-widest mb-2">偏爱的菜系/风味</Text>
          <Text className="block text-9px font-bold text-espresso-40 mb-2">如：川味、日料、家常小炒</Text>
          <Textarea
            className="text-xs font-bold text-espresso w-full"
            style={{ minHeight: '120rpx' }}
            value={cuisines}
            placeholder="可留空"
            onInput={(e) => setCuisines(e.detail.value)}
          />
        </View>

        <Button
          className={cn('w-full bg-primary text-white py-3 rounded-healing text-sm font-black shadow-orange')}
          onClick={save}
        >
          保存
        </Button>
      </View>
    </View>
  )
}
