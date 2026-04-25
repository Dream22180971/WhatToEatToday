import React, { useCallback, useState } from 'react'
import { View, Text, Input } from '@tarojs/components'
import Taro, { useDidShow } from '@tarojs/taro'
import type { UserProfile } from '../../types'
import { loadDB, saveDB } from '../../services/storage'
import { Icon } from '../../components/Icon'
import { cn } from '../../lib/utils'
import './index.css'

const DIETARY_TAGS = [
  { value: 'none', label: '无特殊饮食', icon: 'heart' },
  { value: 'vegetarian', label: '素食', icon: 'leaf' },
  { value: 'vegan', label: '纯素', icon: 'leaf' },
  { value: 'gluten-free', label: '无麸质', icon: 'filter' },
  { value: 'dairy-free', label: '无乳制品', icon: 'filter' },
  { value: 'keto', label: '生酮', icon: 'flame' },
]

const TASTE_TAGS = [
  { value: 'light', label: '清淡', icon: 'leaf' },
  { value: 'mild', label: '适中', icon: 'heart' },
  { value: 'spicy', label: '辛辣', icon: 'flame' },
  { value: 'sweet', label: '甜味', icon: 'sparkles' },
  { value: 'savory', label: '咸鲜', icon: 'flame' },
  { value: 'sour', label: '酸味', icon: 'sparkles' },
]

const CUISINE_TAGS = [
  { value: 'chinese', label: '中餐', icon: 'heart' },
  { value: 'western', label: '西餐', icon: 'sparkles' },
  { value: 'japanese', label: '日料', icon: 'leaf' },
  { value: 'korean', label: '韩料', icon: 'flame' },
  { value: 'thai', label: '泰餐', icon: 'sparkles' },
  { value: 'other', label: '其他', icon: 'heart' },
]

const COOKING_TAGS = [
  { value: 'quick', label: '快手菜', icon: 'rocket' },
  { value: 'healthy', label: '健康', icon: 'heart' },
  { value: 'homemade', label: '家常菜', icon: 'home' },
  { value: 'party', label: '宴客菜', icon: 'users' },
  { value: 'dessert', label: '甜点', icon: 'cake' },
  { value: 'soup', label: '汤品', icon: 'coffee' },
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

export default function PreferencesPage() {
  const [dietaryType, setDietaryType] = useState('none')
  const [tastePreferences, setTastePreferences] = useState<string[]>([])
  const [cuisinePreferences, setCuisinePreferences] = useState<string[]>([])
  const [cookingPreferences, setCookingPreferences] = useState<string[]>([])
  const [dislikedIngredients, setDislikedIngredients] = useState<string[]>([])
  const [newDislikedIngredient, setNewDislikedIngredient] = useState('')

  const hydrate = useCallback(() => {
    const db = loadDB()
    const p = db.profile || defaultProfile()
    const preferences = p.preferences || { dietaryType: 'none', dislikedIngredients: [], favoriteCuisines: [] }
    
    setDietaryType(preferences.dietaryType || 'none')
    setTastePreferences([]) // 初始化空数组，后续可以从存储中读取
    setCuisinePreferences(preferences.favoriteCuisines || [])
    setCookingPreferences([]) // 初始化空数组，后续可以从存储中读取
    setDislikedIngredients(preferences.dislikedIngredients || [])
  }, [])

  useDidShow(hydrate)

  const toggleTastePreference = (taste: string) => {
    setTastePreferences(prev => {
      if (prev.includes(taste)) {
        return prev.filter(t => t !== taste)
      } else {
        return [...prev, taste]
      }
    })
  }

  const toggleCuisinePreference = (cuisine: string) => {
    setCuisinePreferences(prev => {
      if (prev.includes(cuisine)) {
        return prev.filter(c => c !== cuisine)
      } else {
        return [...prev, cuisine]
      }
    })
  }

  const toggleCookingPreference = (cooking: string) => {
    setCookingPreferences(prev => {
      if (prev.includes(cooking)) {
        return prev.filter(c => c !== cooking)
      } else {
        return [...prev, cooking]
      }
    })
  }

  const addDislikedIngredient = () => {
    const ingredient = newDislikedIngredient.trim()
    if (ingredient && !dislikedIngredients.includes(ingredient)) {
      setDislikedIngredients([...dislikedIngredients, ingredient])
      setNewDislikedIngredient('')
    }
  }

  const removeDislikedIngredient = (ingredient: string) => {
    setDislikedIngredients(dislikedIngredients.filter(i => i !== ingredient))
  }

  const save = () => {
    const db = loadDB()
    const prev = db.profile || defaultProfile()
    const next: UserProfile = {
      ...prev,
      preferences: {
        dietaryType,
        dislikedIngredients,
        favoriteCuisines: cuisinePreferences,
        // 可以在这里添加其他偏好设置
      },
    }
    saveDB({
      ...db,
      profile: next,
      recipes: db.recipes || [],
      logs: db.logs || [],
      shopping: db.shopping || [],
      favorites: db.favorites || [],
    })
    Taro.showToast({ title: '已保存', icon: 'success' })
    setTimeout(() => {
      Taro.navigateBack().catch(() => {})
    }, 1000)
  }

  return (
    <View className="preferences-container animate-page-in">
      <View className="px-6 pt-6 pb-32">
        <View className="mb-8">
          <Text className="block text-10px font-bold text-espresso-40 tracking-widest uppercase mb-2">偏好设置</Text>
          <Text className="block text-2xl font-black italic text-espresso">口味偏好管理</Text>
        </View>

        {/* 饮食类型 */}
        <View className="section">
          <Text className="section-title">饮食类型</Text>
          <View className="preference-card">
            <View className="tag-container">
              {DIETARY_TAGS.map((tag) => (
                <View
                  key={tag.value}
                  className={cn('preference-tag', dietaryType === tag.value ? 'active' : 'inactive')}
                  onClick={() => setDietaryType(tag.value)}
                >
                  <Icon name={tag.icon as any} size={14} color={dietaryType === tag.value ? '#ffffff' : '#FF7E33'} strokeWidth={2.4} />
                  <Text>{tag.label}</Text>
                </View>
              ))}
            </View>
          </View>
        </View>

        {/* 口味偏好 */}
        <View className="section">
          <Text className="section-title">口味偏好</Text>
          <View className="preference-card">
            <View className="tag-container">
              {TASTE_TAGS.map((tag) => (
                <View
                  key={tag.value}
                  className={cn('preference-tag', tastePreferences.includes(tag.value) ? 'active' : 'inactive')}
                  onClick={() => toggleTastePreference(tag.value)}
                >
                  <Icon name={tag.icon as any} size={14} color={tastePreferences.includes(tag.value) ? '#ffffff' : '#FF7E33'} strokeWidth={2.4} />
                  <Text>{tag.label}</Text>
                </View>
              ))}
            </View>
          </View>
        </View>

        {/* 菜系偏好 */}
        <View className="section">
          <Text className="section-title">菜系偏好</Text>
          <View className="preference-card">
            <View className="tag-container">
              {CUISINE_TAGS.map((tag) => (
                <View
                  key={tag.value}
                  className={cn('preference-tag', cuisinePreferences.includes(tag.value) ? 'active' : 'inactive')}
                  onClick={() => toggleCuisinePreference(tag.value)}
                >
                  <Icon name={tag.icon as any} size={14} color={cuisinePreferences.includes(tag.value) ? '#ffffff' : '#FF7E33'} strokeWidth={2.4} />
                  <Text>{tag.label}</Text>
                </View>
              ))}
            </View>
          </View>
        </View>

        {/* 烹饪风格 */}
        <View className="section">
          <Text className="section-title">烹饪风格</Text>
          <View className="preference-card">
            <View className="tag-container">
              {COOKING_TAGS.map((tag) => (
                <View
                  key={tag.value}
                  className={cn('preference-tag', cookingPreferences.includes(tag.value) ? 'active' : 'inactive')}
                  onClick={() => toggleCookingPreference(tag.value)}
                >
                  <Icon name={tag.icon as any} size={14} color={cookingPreferences.includes(tag.value) ? '#ffffff' : '#FF7E33'} strokeWidth={2.4} />
                  <Text>{tag.label}</Text>
                </View>
              ))}
            </View>
          </View>
        </View>

        {/* 不喜欢的食材 */}
        <View className="section">
          <Text className="section-title">不喜欢的食材</Text>
          <View className="preference-card">
            <View className="flex gap-2 mb-4">
              <Input
                className="text-input flex-1"
                value={newDislikedIngredient}
                placeholder="输入不喜欢的食材"
                placeholderStyle="color: rgba(77,62,62,0.38)"
                onInput={(e) => setNewDislikedIngredient(e.detail.value)}
                onSubmitEditing={addDislikedIngredient}
                returnKeyType="done"
              />
              <View
                className="px-4 py-2 bg-primary rounded-16rpx text-white font-black text-sm"
                onClick={addDislikedIngredient}
              >
                添加
              </View>
            </View>
            <View>
              {dislikedIngredients.map((ingredient, index) => (
                <View key={index} className="disliked-item">
                  <Text>{ingredient}</Text>
                  <View
                    className="remove-btn"
                    onClick={() => removeDislikedIngredient(ingredient)}
                  >
                    <Icon name="x" size={16} color="#EF4444" strokeWidth={2.4} />
                  </View>
                </View>
              ))}
              {dislikedIngredients.length === 0 && (
                <Text className="text-10px font-bold text-espresso-40">暂无不喜欢的食材</Text>
              )}
            </View>
          </View>
        </View>

        {/* 保存按钮 */}
        <View className="save-btn" onClick={save}>
          <Text>保存偏好设置</Text>
        </View>
      </View>
    </View>
  )
}
