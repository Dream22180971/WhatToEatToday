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
  const [disliked, setDisliked] = useState('')
  const [cuisines, setCuisines] = useState('')

  const hydrate = useCallback(() => {
    const db = loadDB()
    const p = db.profile || defaultProfile()
    setDisliked(tagsToString(p.preferences.dislikedIngredients))
    setCuisines(tagsToString(p.preferences.favoriteCuisines))
  }, [])

  useDidShow(hydrate)

  const save = () => {
    const db = loadDB()
    const prev = db.profile || defaultProfile()
    const preferences: UserPreferences = {
      dietaryType: prev.preferences?.dietaryType || 'none',
      dislikedIngredients: stringToTags(disliked),
      favoriteCuisines: stringToTags(cuisines),
    }
    const next: UserProfile = { ...prev, preferences }
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
        <View className="mb-8">
          <Text className="block text-3xl font-black italic text-espresso">口味与习惯</Text>
          <Text className="block text-10px font-bold text-espresso-40 tracking-widest uppercase">
            会用于首页智能推荐
          </Text>
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
