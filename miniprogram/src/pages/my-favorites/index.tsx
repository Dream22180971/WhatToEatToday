import React, { useCallback, useEffect, useState } from 'react'
import { View, Text, Image } from '@tarojs/components'
import Taro, { useDidShow } from '@tarojs/taro'
import type { Recipe } from '../../types'
import { loadDB } from '../../services/storage'
import { Icon } from '../../components/Icon'
import './index.css'

function FavoriteRow({ recipe }: { recipe: Recipe }) {
  return (
    <View
      className="flex items-center gap-4 p-4 bg-white rounded-3xl shadow-card border border-orange-50-50 press-scale mb-3"
      onClick={() => Taro.navigateTo({ url: `/pages/recipe-detail/index?id=${recipe.id}` })}
    >
      <View className="w-16 h-16 bg-orange-50 rounded-2xl overflow-hidden flex items-center justify-center flex-shrink-0">
        {recipe.image ? (
          <Image src={recipe.image} mode="aspectFill" className="w-full h-full" />
        ) : (
          <Icon name="heart" size={30} color="#FF7E33" strokeWidth={1.8} />
        )}
      </View>
      <View className="flex-1 min-w-0">
        <Text className="block text-sm font-black text-espresso mb-1">{recipe.title}</Text>
        <Text className="block text-10px font-bold text-espresso-40 leading-relaxed clamp-2">{recipe.description}</Text>
      </View>
      <Icon name="chevron-right" size={18} color="#fdba74" strokeWidth={3} />
    </View>
  )
}

export default function MyFavoritesPage() {
  const [recipes, setRecipes] = useState<Recipe[]>([])

  const hydrate = useCallback(() => {
    const db = loadDB()
    const favoriteIds = new Set((db.favorites || []).map((f) => f.recipeId))
    setRecipes((db.recipes || []).filter((r) => favoriteIds.has(r.id)))
  }, [])

  useDidShow(hydrate)
  useEffect(() => hydrate(), [hydrate])

  return (
    <View className="min-h-screen bg-warm-bg text-espresso animate-page-in">
      <View className="px-6 pt-10 pb-32">
        <View className="flex items-center justify-between mb-8">
          <View>
            <Text className="block text-3xl font-black italic text-espresso">我的收藏</Text>
            <Text className="block text-10px font-bold text-espresso-40 tracking-widest uppercase">
              {recipes.length ? `收藏了 ${recipes.length} 道想再吃的味道` : '喜欢的菜谱会在这里'}
            </Text>
          </View>
          <View className="w-12 h-12 bg-orange-100 rounded-2xl flex items-center justify-center shadow-sm">
            <Icon name="heart" size={22} color="#FF7E33" strokeWidth={2.4} />
          </View>
        </View>

        {recipes.length ? (
          recipes.map((recipe) => <FavoriteRow key={recipe.id} recipe={recipe} />)
        ) : (
          <View className="mt-20 flex flex-col items-center gap-4 text-center">
            <Icon name="heart" size={80} color="#fdba74" strokeWidth={1.4} />
            <Text className="block text-xl font-black italic text-espresso">还没有收藏</Text>
            <Text className="block text-xs font-bold text-espresso-40 leading-relaxed">
              在菜谱详情页点亮爱心{'\n'}这里就会保存你的心动菜单
            </Text>
          </View>
        )}
      </View>
    </View>
  )
}
