import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { View, Text, Image } from '@tarojs/components'
import Taro, { useDidShow } from '@tarojs/taro'
import type { Recipe } from '../../types'
import { loadDB, saveDB } from '../../services/storage'
import { Icon } from '../../components/Icon'
import './index.css'

function RecipeRow({
  recipe,
  managing,
  checked,
  onToggle,
}: {
  recipe: Recipe
  managing: boolean
  checked: boolean
  onToggle: () => void
}) {
  return (
    <View
      className="flex items-center gap-4 p-4 bg-white rounded-3xl shadow-card border border-orange-50-50 press-scale mb-3"
      onClick={() => {
        if (managing) {
          onToggle()
          return
        }
        Taro.navigateTo({ url: `/pages/recipe-detail/index?id=${recipe.id}` })
      }}
    >
      {managing && (
        <View
          className="w-7 h-7 rounded-full border-2 flex items-center justify-center flex-shrink-0"
          style={{
            borderColor: checked ? '#FF7E33' : '#E5E7EB',
            backgroundColor: checked ? '#FF7E33' : 'transparent',
          }}
          onClick={(e) => {
            e.stopPropagation()
            onToggle()
          }}
        >
          {checked ? <Icon name="check" size={14} color="#ffffff" strokeWidth={3} /> : null}
        </View>
      )}
      <View className="w-16 h-16 bg-orange-50 rounded-2xl overflow-hidden flex items-center justify-center flex-shrink-0">
        {recipe.image ? (
          <Image src={recipe.image} mode="aspectFill" className="w-full h-full" />
        ) : (
          <Icon name="chef-hat" size={28} color="#fdba74" strokeWidth={1.5} />
        )}
      </View>
      <View className="flex-1 min-w-0">
        <Text className="block text-sm font-black text-espresso mb-1">{recipe.title}</Text>
        <Text className="block text-10px font-bold text-espresso-40 leading-relaxed clamp-2">{recipe.description}</Text>
      </View>
      {managing ? (
        <View
          className="px-3 py-2 rounded-full border border-red-200 bg-red-50 press-scale flex items-center gap-1 flex-shrink-0"
          onClick={(e) => {
            e.stopPropagation()
            onToggle()
          }}
        >
          <Icon name="x" size={14} color="#ef4444" strokeWidth={3} />
          <Text className="text-10px font-black" style={{ color: '#ef4444' }}>
            选中
          </Text>
        </View>
      ) : (
        <View
          className="px-3 py-2 rounded-full border border-red-200 bg-red-50 press-scale flex items-center gap-1 flex-shrink-0"
          onClick={(e) => {
            e.stopPropagation()
            Taro.showModal({
              title: '删除菜谱',
              content: `将删除「${recipe.title}」及其相关收藏/清单引用，是否继续？`,
              confirmColor: '#ef4444',
              success: (res) => {
                if (!res.confirm) return
                const db = loadDB()
                const ids = new Set([recipe.id])
                const nextRecipes = (db.recipes || []).filter((r) => !ids.has(r.id))
                const nextFavorites = (db.favorites || []).filter((f) => !ids.has(f.recipeId))
                const nextShopping = (db.shopping || []).filter((s) => !s.recipeId || !ids.has(s.recipeId))
                saveDB({
                  ...db,
                  recipes: nextRecipes,
                  favorites: nextFavorites,
                  shopping: nextShopping,
                  logs: db.logs || [],
                })
                Taro.showToast({ title: '已删除', icon: 'success' })
                Taro.eventCenter.trigger('my-recipes-updated')
              },
            })
          }}
        >
          <Icon name="x" size={14} color="#ef4444" strokeWidth={3} />
          <Text className="text-10px font-black" style={{ color: '#ef4444' }}>
            删除
          </Text>
        </View>
      )}
    </View>
  )
}

export default function MyRecipesPage() {
  const [recipes, setRecipes] = useState<Recipe[]>([])
  const [managing, setManaging] = useState(false)
  const [selectedIds, setSelectedIds] = useState<string[]>([])

  const hydrate = useCallback(() => {
    const db = loadDB()
    setRecipes((db.recipes || []).filter((r) => r.creatorId === 'user'))
  }, [])

  useDidShow(hydrate)
  useEffect(() => hydrate(), [hydrate])

  useEffect(() => {
    const handler = () => hydrate()
    Taro.eventCenter.on('my-recipes-updated', handler)
    return () => {
      Taro.eventCenter.off('my-recipes-updated', handler)
    }
  }, [hydrate])

  const selectedSet = useMemo(() => new Set(selectedIds), [selectedIds])
  const selectedCount = selectedIds.length
  const allSelected = recipes.length > 0 && selectedCount === recipes.length

  const toggleOne = (id: string) => {
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]))
  }

  const toggleAll = () => {
    setSelectedIds(allSelected ? [] : recipes.map((r) => r.id))
  }

  const deleteSelected = () => {
    if (!selectedCount) {
      Taro.showToast({ title: '请先选择菜谱', icon: 'none' })
      return
    }
    Taro.showModal({
      title: '批量删除',
      content: `将删除已选 ${selectedCount} 道菜谱及其相关收藏/清单引用，且不可恢复。是否继续？`,
      confirmColor: '#ef4444',
      success: (res) => {
        if (!res.confirm) return
        const ids = new Set(selectedIds)
        const db = loadDB()
        const nextRecipes = (db.recipes || []).filter((r) => !ids.has(r.id))
        const nextFavorites = (db.favorites || []).filter((f) => !ids.has(f.recipeId))
        const nextShopping = (db.shopping || []).filter((s) => !s.recipeId || !ids.has(s.recipeId))
        saveDB({
          ...db,
          recipes: nextRecipes,
          favorites: nextFavorites,
          shopping: nextShopping,
          logs: db.logs || [],
        })
        setSelectedIds([])
        setManaging(false)
        hydrate()
        Taro.showToast({ title: '已删除', icon: 'success' })
        Taro.eventCenter.trigger('my-recipes-updated')
      },
    })
  }

  return (
    <View className="min-h-screen bg-warm-bg text-espresso animate-page-in">
      <View className="px-6 pt-10 pb-32">
        <View className="flex items-center justify-between mb-8">
          <View>
            <Text className="block text-3xl font-black italic text-espresso">我的菜谱</Text>
            <Text className="block text-10px font-bold text-espresso-40 tracking-widest uppercase">
              {recipes.length ? `已录入 ${recipes.length} 道私房味道` : '你亲手记录的菜会在这里'}
            </Text>
          </View>
          <View className="flex items-center gap-3">
            {!!recipes.length && (
              <View
                className="px-4 py-2 bg-white-90 rounded-full border border-orange-100 shadow-sm press-scale"
                onClick={() => {
                  setManaging((v) => {
                    const next = !v
                    if (!next) setSelectedIds([])
                    return next
                  })
                }}
              >
                <Text className="text-10px font-black text-primary">{managing ? '完成' : '管理'}</Text>
              </View>
            )}
            <View className="w-12 h-12 bg-orange-100 rounded-2xl flex items-center justify-center shadow-sm">
              <Icon name="book" size={22} color="#FF7E33" strokeWidth={2.4} />
            </View>
          </View>
        </View>

        {recipes.length ? (
          <>
            {recipes.map((recipe) => (
              <RecipeRow
                key={recipe.id}
                recipe={recipe}
                managing={managing}
                checked={selectedSet.has(recipe.id)}
                onToggle={() => toggleOne(recipe.id)}
              />
            ))}

            {managing && (
              <View className="fixed left-0 right-0 bottom-0 bg-white-90 border-t border-orange-50-50 px-6 py-4 flex items-center justify-between">
                <View className="flex items-center gap-3">
                  <View
                    className="px-4 py-3 rounded-full border border-orange-100 bg-orange-50 press-scale"
                    onClick={toggleAll}
                  >
                    <Text className="text-10px font-black text-primary">{allSelected ? '取消全选' : '全选'}</Text>
                  </View>
                  <Text className="text-10px font-bold text-espresso-40">已选 {selectedCount}</Text>
                </View>
                <View
                  className="px-5 py-3 rounded-full border border-red-200 bg-red-50 press-scale flex items-center gap-2"
                  onClick={deleteSelected}
                >
                  <Icon name="x" size={14} color="#ef4444" strokeWidth={3} />
                  <Text className="text-10px font-black" style={{ color: '#ef4444' }}>
                    删除
                  </Text>
                </View>
              </View>
            )}
          </>
        ) : (
          <View className="mt-20 flex flex-col items-center gap-4 text-center">
            <Icon name="book" size={80} color="#fdba74" strokeWidth={1.4} />
            <Text className="block text-xl font-black italic text-espresso">还没有自己的菜谱</Text>
            <Text className="block text-xs font-bold text-espresso-40 leading-relaxed">
              去发现页点击「新增我的菜谱」{'\n'}用图片识别或手动录入第一道菜
            </Text>
          </View>
        )}
      </View>
    </View>
  )
}
